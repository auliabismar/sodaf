/**
 * CLI Types and Interfaces
 * 
 * This file defines TypeScript interfaces for the CLI system, including command
 * definitions, execution context, and configuration types.
 */

import type { Database } from '../core/database/database';
import type { SiteConfig, SiteContext } from '../core/site/types';
import type { MigrationResult, MigrationHistory } from '../meta/migration/types';

// Re-export migration types for other modules
export type { MigrationResult, MigrationHistory };

/**
 * Exit codes used by the CLI
 */
export enum ExitCode {
	SUCCESS = 0,
	GENERAL_ERROR = 1,
	INVALID_ARGUMENTS = 2,
	CONFIGURATION_ERROR = 3,
	SITE_ERROR = 4,
	MIGRATION_ERROR = 5,
	PERMISSION_ERROR = 6,
	NETWORK_ERROR = 7,
	TIMEOUT_ERROR = 8,
	USER_INTERRUPT = 130
}

/**
 * Command option definition
 */
export interface CommandOption {
	/** Option name (e.g., 'site', 'force') */
	name: string;
	
	/** Short form (e.g., 's' for --site) */
	short?: string;
	
	/** Option description */
	description: string;
	
	/** Whether option is required */
	required?: boolean;
	
	/** Whether option expects a value */
	hasValue?: boolean;
	
	/** Default value if not provided */
	default?: any;
	
	/** Possible values for validation */
	choices?: string[];
	
	/** Whether option can be specified multiple times */
	multiple?: boolean;
}

/**
 * Parsed command arguments
 */
export interface CommandArgs {
	/** Command name */
	command: string;
	
	/** Sub-command name (if any) */
	subcommand?: string;
	
	/** Positional arguments */
	positionals: string[];
	
	/** Named options */
	options: Record<string, any>;
	
	/** Original raw arguments */
	raw: string[];
	
	/**
	 * Get an option value
	 * @param name Option name
	 * @param defaultValue Default value if option not present
	 * @returns Option value or default
	 */
	getOption(name: string, defaultValue?: any): any;
	
	/**
	 * Check if an option is present
	 * @param name Option name
	 * @returns True if option is present
	 */
	hasOption(name: string): boolean;
	
	/**
	 * Check if a flag is present (boolean option)
	 * @param name Flag name
	 * @returns True if flag is present
	 */
	hasFlag(name: string): boolean;
	
	/**
	 * Get all values for a multi-value option
	 * @param name Option name
	 * @returns Array of values or empty array
	 */
	getOptions(name: string): any[];
}

/**
 * CLI execution context
 */
export interface ExecutionContext {
	/** Site configuration */
	site?: SiteContext;
	
	/** Database connection */
	database?: Database;
	
	/** CLI configuration */
	config: CLIConfig;
	
	/** Output formatter */
	output: OutputFormatter;
	
	/** Progress reporter */
	progress: ProgressReporter;
	
	/** Error handler */
	errorHandler: ErrorHandler;
	
	/** Logger */
	logger: Logger;
	
	/** Working directory */
	workingDirectory: string;
	
	/** Environment variables */
	env: Record<string, string>;
	
	/** Command execution start time */
	startTime: Date;
}

/**
 * CLI configuration
 */
export interface CLIConfig {
	/** Default site to use */
	defaultSite?: string;
	
	/** Whether to show verbose output */
	verbose: boolean;
	
	/** Whether to force operations without confirmation */
	force: boolean;
	
	/** Operation timeout in seconds */
	timeout: number;
	
	/** Whether to create backups before operations */
	backup: boolean;
	
	/** Output format */
	outputFormat: 'text' | 'json' | 'table';
	
	/** Whether to use colors in output */
	colors: boolean;
	
	/** Whether to show progress indicators */
	progress: boolean;
	
	/** Log level */
	logLevel: 'error' | 'warn' | 'info' | 'debug';
	
	/** Configuration file path */
	configPath?: string;
	
	/** Sites directory */
	sitesDir?: string;
}

/**
 * Command interface
 */
export interface Command {
	/** Command name */
	name: string;
	
	/** Command description */
	description: string;
	
	/** Command usage syntax */
	usage: string;
	
	/** Example usage */
	examples: string[];
	
	/** Command options */
	options: CommandOption[];
	
	/** Whether command requires site context */
	requiresSite?: boolean;
	
	/**
	 * Execute the command
	 * @param args Parsed command arguments
	 * @param context Execution context
	 * @returns Promise resolving to exit code
	 */
	execute(args: CommandArgs, context: ExecutionContext): Promise<number>;
}

/**
 * Command registration information
 */
export interface CommandRegistration {
	/** Command instance */
	command: Command;
	
	/** Command category */
	category: string;
	
	/** Command priority (for help ordering) */
	priority: number;
	
	/** Whether command is enabled */
	enabled: boolean;
}

/**
 * Output formatter interface
 */
export interface OutputFormatter {
	/**
	 * Format a message with optional styling
	 * @param message Message to format
	 * @param style Optional style name
	 * @returns Formatted message
	 */
	format(message: string, style?: string): string;
	
	/**
	 * Format an error message
	 * @param message Error message
	 * @returns Formatted error message
	 */
	error(message: string): string;
	
	/**
	 * Format a warning message
	 * @param message Warning message
	 * @returns Formatted warning message
	 */
	warn(message: string): string;
	
	/**
	 * Format a success message
	 * @param message Success message
	 * @returns Formatted success message
	 */
	success(message: string): string;
	
	/**
	 * Format an info message
	 * @param message Info message
	 * @returns Formatted info message
	 */
	info(message: string): string;
	
	/**
	 * Format data as a table
	 * @param data Table data
	 * @param headers Column headers
	 * @returns Formatted table
	 */
	table(data: any[][], headers: string[]): string;
	
	/**
	 * Format data as JSON
	 * @param data Data to format
	 * @param pretty Whether to pretty-print
	 * @returns Formatted JSON
	 */
	json(data: any, pretty?: boolean): string;
	
	/**
	 * Format migration result
	 * @param result Migration result
	 * @returns Formatted result
	 */
	migrationResult(result: MigrationResult): string;
	
	/**
	 * Format migration history
	 * @param history Migration history
	 * @returns Formatted history
	 */
	migrationHistory(history: MigrationHistory): string;
}

/**
 * Progress reporter interface
 */
export interface ProgressReporter {
	/**
	 * Start a progress operation
	 * @param operation Operation description
	 * @param total Total items (if known)
	 * @returns Progress instance
	 */
	start(operation: string, total?: number): Progress;
	
	/**
	 * Create a spinner for indeterminate progress
	 * @param text Spinner text
	 * @returns Spinner instance
	 */
	spinner(text: string): Spinner;
	
	/**
	 * Report a warning
	 * @param message Warning message
	 */
	warning(message: string): void;
	
	/**
	 * Report an error
	 * @param message Error message
	 */
	error(message: string): void;
}

/**
 * Progress interface for determinate operations
 */
export interface Progress {
	/**
	 * Update progress
	 * @param current Current progress
	 * @param message Optional message
	 */
	update(current: number, message?: string): void;
	
	/**
	 * Increment progress
	 * @param amount Amount to increment
	 * @param message Optional message
	 */
	increment(amount?: number, message?: string): void;
	
	/**
	 * Complete the progress
	 * @param message Completion message
	 */
	complete(message?: string): void;
	
	/**
	 * Fail the progress
	 * @param message Failure message
	 */
	fail(message?: string): void;
}

/**
 * Spinner interface for indeterminate operations
 */
export interface Spinner {
	/**
	 * Update spinner text
	 * @param text New text
	 */
	text(text: string): void;
	
	/**
	 * Start the spinner
	 */
	start(): void;
	
	/**
	 * Stop the spinner with success
	 * @param text Success text
	 */
	succeed(text?: string): void;
	
	/**
	 * Stop the spinner with failure
	 * @param text Failure text
	 */
	fail(text?: string): void;
	
	/**
	 * Stop the spinner with warning
	 * @param text Warning text
	 */
	warn(text?: string): void;
	
	/**
	 * Stop the spinner with info
	 * @param text Info text
	 */
	info(text?: string): void;
}

/**
 * Error handler interface
 */
export interface ErrorHandler {
	/**
	 * Handle an error
	 * @param error Error to handle
	 * @param context Execution context
	 * @returns Exit code
	 */
	handle(error: Error, context: ExecutionContext): number;
	
	/**
	 * Categorize an error
	 * @param error Error to categorize
	 * @returns Error category
	 */
	categorize(error: Error): ErrorCategory;
	
	/**
	 * Get user-friendly error message
	 * @param error Error to format
	 * @param category Error category
	 * @returns Formatted error message
	 */
	format(error: Error, category: ErrorCategory): string;
}

/**
 * Error categories
 */
export enum ErrorCategory {
	CONFIGURATION = 'configuration',
	SITE = 'site',
	MIGRATION = 'migration',
	DATABASE = 'database',
	FILE_SYSTEM = 'file_system',
	NETWORK = 'network',
	PERMISSION = 'permission',
	VALIDATION = 'validation',
	USER = 'user',
	SYSTEM = 'system'
}

/**
 * Logger interface
 */
export interface Logger {
	/**
	 * Log an error message
	 * @param message Message to log
	 * @param args Additional arguments
	 */
	error(message: string, ...args: any[]): void;
	
	/**
	 * Log a warning message
	 * @param message Message to log
	 * @param args Additional arguments
	 */
	warn(message: string, ...args: any[]): void;
	
	/**
	 * Log an info message
	 * @param message Message to log
	 * @param args Additional arguments
	 */
	info(message: string, ...args: any[]): void;
	
	/**
	 * Log a debug message
	 * @param message Message to log
	 * @param args Additional arguments
	 */
	debug(message: string, ...args: any[]): void;
}

/**
 * Migration command options
 */
export interface MigrationCommandOptions {
	/** Target site */
	site?: string;
	
	/** Whether to perform dry run */
	dryRun?: boolean;
	
	/** Whether to force execution */
	force?: boolean;
	
	/** Whether to show verbose output */
	verbose?: boolean;
	
	/** Whether to create backup */
	backup?: boolean;
	
	/** Operation timeout */
	timeout?: number;
	
	/** Number of migrations to rollback */
	steps?: number;
	
	/** Specific migration ID to rollback */
	id?: string;
	
	/** Whether to continue on error */
	continueOnError?: boolean;
	
	/** Batch size for large operations */
	batchSize?: number;
}

/**
 * Command execution result
 */
export interface CommandResult {
	/** Exit code */
	exitCode: number;
	
	/** Whether execution was successful */
	success: boolean;
	
	/** Output message */
	message?: string;
	
	/** Result data */
	data?: any;
	
	/** Warnings generated */
	warnings?: string[];
	
	/** Errors generated */
	errors?: string[];
	
	/** Execution time in milliseconds */
	executionTime?: number;
}