/**
 * CLI Runner and Command Execution
 * 
 * This file implements the main CLI runner that coordinates command execution,
 * error handling, and overall CLI workflow.
 */

import type {
	CommandArgs,
	CommandRegistration,
	ExecutionContext,
	CLIConfig,
	Logger,
	ErrorHandler,
	OutputFormatter,
	ProgressReporter
} from './types';
import { ExitCode, ErrorCategory } from './types';
import { CommandRegistry } from './command';
import { ArgumentParser } from './parser';
import { TerminalOutputFormatter, TerminalProgressReporter } from './output';
import { CLIErrorHandler } from './error-handler.js';
import { CLILogger } from './logger.js';

/**
 * CLI runner options
 */
export interface RunnerOptions {
	/** Configuration file path */
	configPath?: string;
	
	/** Working directory */
	workingDirectory?: string;
	
	/** Environment variables */
	env?: Record<string, string>;
	
	/** Whether to enable verbose output */
	verbose?: boolean;
	
	/** Whether to use colors in output */
	colors?: boolean;
	
	/** Output format */
	outputFormat?: 'text' | 'json' | 'table';
}

/**
 * Main CLI runner class
 */
export class CLIRunner {
	private registry: CommandRegistry;
	private config: CLIConfig;
	private options: RunnerOptions;
	
	/**
	 * Create a new CLI runner
	 * @param registry Command registry
	 * @param options Runner options
	 */
	constructor(registry: CommandRegistry, options: RunnerOptions = {}) {
		this.registry = registry;
		this.options = {
			workingDirectory: process.cwd(),
			env: Object.fromEntries(
				Object.entries(process.env).filter(([, value]) => value !== undefined)
			) as Record<string, string>,
			...options
		};
		
		// Initialize default configuration
		this.config = this.createDefaultConfig();
	}
	
	/**
	 * Run the CLI with provided arguments
	 * @param argv Command line arguments
	 * @returns Promise resolving to exit code
	 */
	async run(argv: string[]): Promise<number> {
		try {
			// Parse global options
			const { globalArgs, remainingArgs } = this.parseGlobalOptions(argv);
			
			// Update configuration with global options
			this.updateConfig(globalArgs);
			
			// Create execution context
			const context = await this.createExecutionContext();
			
			// Handle help/version commands
			if (this.handleSpecialCommands(remainingArgs, context)) {
				return ExitCode.SUCCESS;
			}
			
			// Parse command
			const commandParse = this.parseCommand(remainingArgs);
			if (!commandParse.success) {
				context.output.error(commandParse.error || 'Failed to parse command');
				this.showUsage(context);
				return ExitCode.INVALID_ARGUMENTS;
			}
			
			// Get command registration
			if (!commandParse.args) {
				context.output.error('Failed to parse command arguments');
				this.showUsage(context);
				return ExitCode.INVALID_ARGUMENTS;
			}
			
			const registration = this.registry.get(commandParse.args.command);
			if (!registration) {
				context.output.error(`Unknown command: ${commandParse.args.command}`);
				this.showUsage(context);
				return ExitCode.INVALID_ARGUMENTS;
			}
			
			// Execute command
			return await this.executeCommand(registration, commandParse.args, context);
			
		} catch (error) {
			// Handle unhandled errors
			const context = await this.createExecutionContext();
			return context.errorHandler.handle(
				error instanceof Error ? error : new Error(String(error)),
				context
			);
		}
	}
	
	/**
	 * Parse global options (those before the command)
	 * @param argv Command line arguments
	 * @returns Parsed global args and remaining args
	 */
	private parseGlobalOptions(argv: string[]): {
		globalArgs: CommandArgs;
		remainingArgs: string[];
	} {
		// Create a temporary parser for global options
		const globalParser = new ArgumentParser('sodaf', [
			{
				name: 'help',
				short: 'h',
				description: 'Show help information',
				hasValue: false
			},
			{
				name: 'version',
				short: 'v',
				description: 'Show version information',
				hasValue: false
			},
			{
				name: 'verbose',
				description: 'Enable verbose output',
				hasValue: false
			},
			{
				name: 'quiet',
				short: 'q',
				description: 'Suppress non-error output',
				hasValue: false
			},
			{
				name: 'no-color',
				description: 'Disable colored output',
				hasValue: false
			},
			{
				name: 'format',
				description: 'Output format',
				hasValue: true,
				choices: ['text', 'json', 'table'],
				default: 'text'
			},
			{
				name: 'config',
				description: 'Configuration file path',
				hasValue: true
			}
		]);
		
		const result = globalParser.parse(argv);
		
		if (!result.success) {
			throw new Error(result.error);
		}
		
		// Find where the command starts (first non-option argument)
		const commandIndex = result.args.positionals.findIndex(arg => !arg.startsWith('-'));
		const remainingArgs = commandIndex >= 0 
			? argv.slice(argv.indexOf(result.args.positionals[commandIndex]))
			: [];
		
		return {
			globalArgs: result.args,
			remainingArgs
		};
	}
	
	/**
	 * Update configuration with global options
	 * @param args Parsed global arguments
	 */
	private updateConfig(args: CommandArgs): void {
		if (args.hasFlag('verbose')) {
			this.config.verbose = true;
		}
		
		if (args.hasFlag('quiet')) {
			this.config.logLevel = 'error';
		}
		
		if (args.hasFlag('no-color')) {
			this.config.colors = false;
		}
		
		if (args.hasOption('format')) {
			this.config.outputFormat = args.getOption('format') as 'text' | 'json' | 'table';
		}
		
		if (args.hasOption('config')) {
			this.config.configPath = args.getOption('config');
		}
	}
	
	/**
	 * Create execution context
	 * @returns Promise resolving to execution context
	 */
	private async createExecutionContext(): Promise<ExecutionContext> {
		// Create output formatter
		const output = new TerminalOutputFormatter(
			this.config.colors,
			this.config.outputFormat
		);
		
		// Create progress reporter
		const progress = new TerminalProgressReporter(this.config.colors);
		
		// Create logger
		const logger = new CLILogger(this.config.logLevel, output);
		
		// Create error handler
		const errorHandler = new CLIErrorHandler();
		
		return {
			config: this.config,
			output,
			progress,
			errorHandler,
			logger,
			workingDirectory: this.options.workingDirectory || process.cwd(),
			env: this.options.env || Object.fromEntries(
				Object.entries(process.env).filter(([, value]) => value !== undefined)
			) as Record<string, string>,
			startTime: new Date()
		};
	}
	
	/**
	 * Handle special commands (help, version)
	 * @param args Command arguments
	 * @param context Execution context
	 * @returns True if special command was handled
	 */
	private handleSpecialCommands(args: string[], context: ExecutionContext): boolean {
		// Handle version
		if (args.length === 0 || (args.length === 1 && args[0] === '--version')) {
			this.showVersion(context);
			return true;
		}
		
		// Handle help
		if (args.length === 0 || (args.length === 1 && args[0] === '--help')) {
			this.showHelp(context);
			return true;
		}
		
		// Handle command-specific help
		if (args.length === 2 && args[1] === '--help') {
			this.showCommandHelp(args[0], context);
			return true;
		}
		
		return false;
	}
	
	/**
	 * Parse command from arguments
	 * @param args Command arguments
	 * @returns Parse result
	 */
	private parseCommand(args: string[]): { success: boolean; args?: CommandArgs; error?: string } {
		if (args.length === 0) {
			return { success: false, error: 'No command specified' };
		}
		
		const commandName = args[0];
		const registration = this.registry.get(commandName);
		
		if (!registration) {
			return { success: false, error: `Unknown command: ${commandName}` };
		}
		
		// Create parser for this command
		const parser = new ArgumentParser(commandName, registration.command.options);
		const result = parser.parse(args.slice(1));
		
		if (!result.success) {
			return { success: false, error: result.error };
		}
		
		// Set command name in args
		result.args.command = commandName;
		
		return { success: true, args: result.args };
	}
	
	/**
	 * Execute a command
	 * @param registration Command registration
	 * @param args Parsed arguments
	 * @param context Execution context
	 * @returns Promise resolving to exit code
	 */
	private async executeCommand(
		registration: CommandRegistration,
		args: CommandArgs,
		context: ExecutionContext
	): Promise<number> {
		const command = registration.command;
		
		// Log command execution
		context.logger.debug(`Executing command: ${command.name}`);
		
		// Check if command requires site context
		if (command.requiresSite && !context.site) {
			context.output.error('This command requires a site context. ' +
				'Use --site to specify a site or configure a default site.');
			return ExitCode.SITE_ERROR;
		}
		
		// Execute command
		const startTime = Date.now();
		try {
			const exitCode = await command.execute(args, context);
			const executionTime = Date.now() - startTime;
			
			context.logger.debug(`Command ${command.name} completed in ${executionTime}ms with exit code ${exitCode}`);
			
			return exitCode;
		} catch (error) {
			const executionTime = Date.now() - startTime;
			context.logger.debug(`Command ${command.name} failed in ${executionTime}ms: ${error}`);
			
			return context.errorHandler.handle(
				error instanceof Error ? error : new Error(String(error)),
				context
			);
		}
	}
	
	/**
	 * Show usage information
	 * @param context Execution context
	 */
	private showUsage(context: ExecutionContext): void {
		context.output.info('Usage: sodaf <command> [options]');
		context.output.info('');
		context.output.info('Use "sodaf --help" for a list of available commands.');
		context.output.info('Use "sodaf <command> --help" for command-specific help.');
	}
	
	/**
	 * Show version information
	 * @param context Execution context
	 */
	private showVersion(context: ExecutionContext): void {
		// In a real implementation, this would read from package.json
		context.output.info('SODAF CLI version 0.0.1');
	}
	
	/**
	 * Show general help
	 * @param context Execution context
	 */
	private showHelp(context: ExecutionContext): void {
		const helpText = this.registry.generateHelp();
		context.output.info(helpText);
	}
	
	/**
	 * Show command-specific help
	 * @param commandName Command name
	 * @param context Execution context
	 */
	private showCommandHelp(commandName: string, context: ExecutionContext): void {
		const helpText = this.registry.generateCommandHelp(commandName);
		if (helpText) {
			context.output.info(helpText);
		} else {
			context.output.error(`Unknown command: ${commandName}`);
		}
	}
	
	/**
	 * Create default configuration
	 * @returns Default CLI configuration
	 */
	private createDefaultConfig(): CLIConfig {
		return {
			verbose: false,
			force: false,
			timeout: 300,
			backup: true,
			outputFormat: 'text',
			colors: true,
			progress: true,
			logLevel: 'info'
		};
	}
}