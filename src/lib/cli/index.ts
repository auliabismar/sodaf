/**
 * Main CLI Entry Point
 * 
 * This file implements the main entry point for the SODAF CLI system,
 * coordinating all components and handling command execution.
 */

import type { CLIConfig, ExecutionContext } from './types';
import { CLIRunner, type RunnerOptions } from './runner';
import { CommandRegistry } from './command';
import { ConfigManager } from './config';
import { SiteManager } from './site';
import { TerminalOutputFormatter, TerminalProgressReporter } from './output';
import { CLIErrorHandler } from './error-handler';
import { CLILogger } from './logger';
import { MigrateCommand } from './commands/migrate';
import { MigrateDryRunCommand } from './commands/migrate-dry-run';
import { MigrateStatusCommand } from './commands/migrate-status';
import { MigrateRollbackCommand } from './commands/migrate-rollback';

/**
 * Main CLI class
 */
class SODAFCLI {
	private registry: CommandRegistry;
	private config: CLIConfig;
	
	/**
	 * Create a new CLI instance
	 * @param config CLI configuration
	 */
	constructor(config: CLIConfig) {
		this.config = config;
		this.registry = new CommandRegistry();
		this.registerCommands();
	}
	
	/**
	 * Run the CLI with provided arguments
	 * @param argv Command line arguments
	 * @returns Promise resolving to exit code
	 */
	async run(argv: string[]): Promise<number> {
		// Create runner options
		const runnerOptions: RunnerOptions = {
			configPath: this.config.configPath,
			workingDirectory: process.cwd(),
			env: Object.fromEntries(
				Object.entries(process.env).filter(([, value]) => value !== undefined)
			) as Record<string, string>,
			verbose: this.config.verbose,
			colors: this.config.colors,
			outputFormat: this.config.outputFormat
		};
		
		// Create and run CLI runner
		const runner = new CLIRunner(this.registry, runnerOptions);
		return await runner.run(argv);
	}
	
	/**
	 * Register all available commands
	 */
	private registerCommands(): void {
		// Register migration commands
		this.registry.register(new MigrateCommand(), 'migration', 100);
		this.registry.register(new MigrateDryRunCommand(), 'migration', 200);
		this.registry.register(new MigrateStatusCommand(), 'migration', 300);
		this.registry.register(new MigrateRollbackCommand(), 'migration', 400);
		
		// Register aliases
		this.registry.registerAlias('m', 'migrate');
		this.registry.registerAlias('dr', 'dry-run');
		this.registry.registerAlias('st', 'status');
		this.registry.registerAlias('rb', 'rollback');
	}
}

/**
 * Create CLI instance and run with provided arguments
 * @param argv Command line arguments (defaults to process.argv)
 * @returns Promise resolving to exit code
 */
export async function runCLI(argv: string[] = process.argv.slice(2)): Promise<number> {
	try {
		// Load configuration
		const config = ConfigManager.loadConfig();
		
		// Create and run CLI
		const cli = new SODAFCLI(config);
		return await cli.run(argv);
	} catch (error) {
		// Handle unhandled errors
		console.error('Fatal error:', error instanceof Error ? error.message : String(error));
		if (error instanceof Error && error.stack) {
			console.error(error.stack);
		}
		return 1;
	}
}

/**
 * Main entry point for when CLI is executed directly
 */
if (require.main === module) {
	runCLI()
		.then(exitCode => {
			process.exit(exitCode);
		})
		.catch(error => {
			console.error('Unhandled error:', error);
			process.exit(1);
		});
}
