/**
 * Base Command Class and Interfaces
 * 
 * This file implements the base command class and command registry for the CLI system.
 */

import type {
	Command,
	CommandArgs,
	CommandRegistration,
	ExecutionContext,
	CommandOption
} from './types';
import { ExitCode } from './types';

/**
 * Abstract base command class that all CLI commands should extend
 */
export abstract class BaseCommand implements Command {
	/**
	 * Command name (must be implemented by subclasses)
	 */
	abstract name: string;
	
	/**
	 * Command description (must be implemented by subclasses)
	 */
	abstract description: string;
	
	/**
	 * Command usage syntax (must be implemented by subclasses)
	 */
	abstract usage: string;
	
	/**
	 * Example usage (must be implemented by subclasses)
	 */
	abstract examples: string[];
	
	/**
	 * Command options (must be implemented by subclasses)
	 */
	abstract options: CommandOption[];
	
	/**
	 * Whether command requires site context
	 */
	requiresSite: boolean = false;
	
	/**
	 * Validate command arguments
	 * @param args Parsed command arguments
	 * @returns True if arguments are valid
	 */
	protected validateArgs(args: CommandArgs): boolean {
		// Check required options
		for (const option of this.options) {
			if (option.required && !args.hasOption(option.name)) {
				return false;
			}
		}
		
		return true;
	}
	
	/**
	 * Get validation error message
	 * @param args Parsed command arguments
	 * @returns Error message or null if valid
	 */
	protected getValidationError(args: CommandArgs): string | null {
		// Check required options
		for (const option of this.options) {
			if (option.required && !args.hasOption(option.name)) {
				return `Missing required option: --${option.name}`;
			}
			
			// Validate choices
			if (args.hasOption(option.name) && option.choices) {
				const value = args.getOption(option.name);
				if (!option.choices.includes(value)) {
					return `Invalid value for --${option.name}: ${value}. ` +
						`Allowed values: ${option.choices.join(', ')}`;
				}
			}
		}
		
		return null;
	}
	
	/**
	 * Generate help text for this command
	 * @returns Formatted help text
	 */
	generateHelp(): string {
		const lines: string[] = [];
		
		// Command name and description
		lines.push(`\x1b[1m${this.name}\x1b[0m`);
		lines.push(`  ${this.description}`);
		lines.push('');
		
		// Usage
		lines.push('\x1b[1mUsage:\x1b[0m');
		lines.push(`  ${this.usage}`);
		lines.push('');
		
		// Examples
		if (this.examples.length > 0) {
			lines.push('\x1b[1mExamples:\x1b[0m');
			for (const example of this.examples) {
				lines.push(`  ${example}`);
			}
			lines.push('');
		}
		
		// Options
		if (this.options.length > 0) {
			lines.push('\x1b[1mOptions:\x1b[0m');
			
			// Calculate max option name length for alignment
			const maxNameLength = Math.max(...this.options.map(opt => {
				const name = `--${opt.name}`;
				const short = opt.short ? `-${opt.short}, ` : '';
				return short.length + name.length;
			}));
			
			for (const option of this.options) {
				const name = `--${option.name}`;
				const short = option.short ? `-${option.short}, ` : '';
				const fullName = `${short}${name}`;
				const padding = ' '.repeat(maxNameLength - fullName.length + 2);
				
				let line = `  ${fullName}${padding}${option.description}`;
				
				// Add default value if present
				if (option.default !== undefined) {
					line += ` (default: ${option.default})`;
				}
				
				// Add choices if present
				if (option.choices) {
					line += ` (choices: ${option.choices.join(', ')})`;
				}
				
				lines.push(line);
			}
			lines.push('');
		}
		
		return lines.join('\n');
	}
	
	/**
	 * Execute the command with proper error handling
	 * @param args Parsed command arguments
	 * @param context Execution context
	 * @returns Promise resolving to exit code
	 */
	async execute(args: CommandArgs, context: ExecutionContext): Promise<number> {
		try {
			// Validate arguments
			const validationError = this.getValidationError(args);
			if (validationError) {
				context.output.error(validationError);
				context.output.info(`Use --help for more information.`);
				return ExitCode.INVALID_ARGUMENTS;
			}
			
			// Show help if requested
			if (args.hasFlag('help')) {
				context.output.info(this.generateHelp());
				return ExitCode.SUCCESS;
			}
			
			// Check site requirement
			if (this.requiresSite && !context.site) {
				context.output.error('This command requires a site context. ' +
					'Use --site to specify a site or configure a default site.');
				return ExitCode.SITE_ERROR;
			}
			
			// Execute the command
			return await this.executeCommand(args, context);
			
		} catch (error) {
			// Handle errors through the error handler
			return context.errorHandler.handle(
				error instanceof Error ? error : new Error(String(error)),
				context
			);
		}
	}
	
	/**
	 * Execute the command logic (must be implemented by subclasses)
	 * @param args Parsed command arguments
	 * @param context Execution context
	 * @returns Promise resolving to exit code
	 */
	protected abstract executeCommand(
		args: CommandArgs,
		context: ExecutionContext
	): Promise<number>;
}

/**
 * Command registry for managing available commands
 */
export class CommandRegistry {
	private commands: Map<string, CommandRegistration> = new Map();
	private aliases: Map<string, string> = new Map();
	
	/**
	 * Register a command
	 * @param command Command to register
	 * @param category Command category
	 * @param priority Command priority (for ordering)
	 */
	register(
		command: Command,
		category: string = 'general',
		priority: number = 100
	): void {
		this.commands.set(command.name, {
			command,
			category,
			priority,
			enabled: true
		});
	}
	
	/**
	 * Register an alias for a command
	 * @param alias Alias name
	 * @param commandName Target command name
	 */
	registerAlias(alias: string, commandName: string): void {
		if (!this.commands.has(commandName)) {
			throw new Error(`Cannot register alias '${alias}' for unknown command '${commandName}'`);
		}
		this.aliases.set(alias, commandName);
	}
	
	/**
	 * Get a command by name or alias
	 * @param name Command name or alias
	 * @returns Command registration or null if not found
	 */
	get(name: string): CommandRegistration | null {
		// Check direct command name
		const registration = this.commands.get(name);
		if (registration) {
			return registration;
		}
		
		// Check aliases
		const commandName = this.aliases.get(name);
		if (commandName) {
			return this.commands.get(commandName) || null;
		}
		
		return null;
	}
	
	/**
	 * Get all registered commands
	 * @returns Array of command registrations
	 */
	getAll(): CommandRegistration[] {
		return Array.from(this.commands.values())
			.filter(reg => reg.enabled)
			.sort((a, b) => {
				// Sort by category first, then by priority
				if (a.category !== b.category) {
					return a.category.localeCompare(b.category);
				}
				return a.priority - b.priority;
			});
	}
	
	/**
	 * Get commands by category
	 * @param category Category name
	 * @returns Array of command registrations
	 */
	getByCategory(category: string): CommandRegistration[] {
		return this.getAll()
			.filter(reg => reg.category === category);
	}
	
	/**
	 * Get all command categories
	 * @returns Array of category names
	 */
	getCategories(): string[] {
		const categories = new Set<string>();
		for (const registration of this.commands.values()) {
			if (registration.enabled) {
				categories.add(registration.category);
			}
		}
		return Array.from(categories).sort();
	}
	
	/**
	 * Check if a command exists
	 * @param name Command name or alias
	 * @returns True if command exists
	 */
	has(name: string): boolean {
		return this.commands.has(name) || this.aliases.has(name);
	}
	
	/**
	 * Enable or disable a command
	 * @param name Command name
	 * @param enabled Whether to enable the command
	 */
	setEnabled(name: string, enabled: boolean): void {
		const registration = this.commands.get(name);
		if (registration) {
			registration.enabled = enabled;
		}
	}
	
	/**
	 * Generate help text for all commands
	 * @returns Formatted help text
	 */
	generateHelp(): string {
		const lines: string[] = [];
		
		lines.push('\x1b[1mSODAF CLI Commands\x1b[0m');
		lines.push('');
		
		const categories = this.getCategories();
		for (const category of categories) {
			const commands = this.getByCategory(category);
			if (commands.length === 0) continue;
			
			lines.push(`\x1b[1m${category.charAt(0).toUpperCase() + category.slice(1)} Commands:\x1b[0m`);
			
			// Calculate max command name length for alignment
			const maxNameLength = Math.max(...commands.map(reg => reg.command.name.length));
			
			for (const registration of commands) {
				const command = registration.command;
				const padding = ' '.repeat(maxNameLength - command.name.length + 2);
				lines.push(`  ${command.name}${padding}${command.description}`);
			}
			
			lines.push('');
		}
		
		lines.push('Use \x1b[1m<scommand> --help\x1b[0m for more information on a specific command.');
		
		return lines.join('\n');
	}
	
	/**
	 * Generate help text for a specific command
	 * @param name Command name or alias
	 * @returns Formatted help text or null if command not found
	 */
	generateCommandHelp(name: string): string | null {
		const registration = this.get(name);
		if (!registration) {
			return null;
		}
		
		if (registration.command instanceof BaseCommand) {
			return registration.command.generateHelp();
		}
		
		// Fallback for commands that don't extend BaseCommand
		const command = registration.command;
		const lines: string[] = [];
		
		lines.push(`\x1b[1m${command.name}\x1b[0m`);
		lines.push(`  ${command.description}`);
		lines.push('');
		
		if (command.usage) {
			lines.push('\x1b[1mUsage:\x1b[0m');
			lines.push(`  ${command.usage}`);
			lines.push('');
		}
		
		if (command.examples && command.examples.length > 0) {
			lines.push('\x1b[1mExamples:\x1b[0m');
			for (const example of command.examples) {
				lines.push(`  ${example}`);
			}
			lines.push('');
		}
		
		return lines.join('\n');
	}
}