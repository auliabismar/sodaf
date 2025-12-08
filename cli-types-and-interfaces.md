# CLI Types and Interfaces

This document defines comprehensive TypeScript interfaces and types for the SODAF CLI system.

## Core CLI Types

### Command System Types

```typescript
/**
 * Base interface for all CLI commands
 */
export interface Command {
	/** Unique command name */
	name: string;
	
	/** Human-readable description */
	description: string;
	
	/** Usage syntax */
	usage: string;
	
	/** Example usage patterns */
	examples: string[];
	
	/** Available command options */
	options: CommandOption[];
	
	/** Whether command requires site context */
	requiresSite?: boolean;
	
	/** Command execution handler */
	execute(args: CommandArgs, context: ExecutionContext): Promise<number>;
}

/**
 * Command option definition
 */
export interface CommandOption {
	/** Option name (without dashes) */
	name: string;
	
	/** Short form (single dash) */
	short?: string;
	
	/** Long form (double dash) */
	long?: string;
	
	/** Option description */
	description: string;
	
	/** Whether option is required */
	required?: boolean;
	
	/** Option type */
	type: 'string' | 'number' | 'boolean';
	
	/** Default value if not provided */
	default?: any;
	
	/** Whether option accepts multiple values */
	multiple?: boolean;
	
	/** Validation function */
	validate?: (value: any) => boolean | string;
	
	/** Possible values for enum options */
	choices?: string[];
}

/**
 * Parsed command arguments
 */
export interface CommandArgs {
	/** Command name */
	command: string;
	
	/** Subcommand name (if any) */
	subcommand?: string;
	
	/** Positional arguments */
	positionals: string[];
	
	/** Named options */
	options: Record<string, any>;
	
	/** Get option value */
	getOption(name: string): any;
	
	/** Check if flag is present */
	hasFlag(name: string): boolean;
	
	/** Get positional argument by index */
	getPositional(index: number): string | undefined;
	
	/** Get all remaining arguments */
	getRemaining(): string[];
}

/**
 * Command execution context
 */
export interface ExecutionContext {
	/** CLI configuration */
	config: CLIConfig;
	
	/** Site context (if applicable) */
	site?: SiteContext;
	
	/** Output handler */
	output: OutputHandler;
	
	/** Progress reporter */
	progress: ProgressReporter;
	
	/** Error handler */
	errorHandler: ErrorHandler;
	
	/** Logger instance */
	logger: Logger;
	
	/** Execution start time */
	startTime: number;
}
```

### Migration Command Types

```typescript
/**
 * Migration command options
 */
export interface MigrationCommandOptions {
	/** Target site name */
	site?: string;
	
	/** Force execution without confirmation */
	force?: boolean;
	
	/** Verbose output */
	verbose?: boolean;
	
	/** Dry run mode */
	dryRun?: boolean;
	
	/** Operation timeout in seconds */
	timeout?: number;
	
	/** Create backup before migration */
	backup?: boolean;
	
	/** Batch size for large operations */
	batchSize?: number;
	
	/** Continue on error */
	continueOnError?: boolean;
}

/**
 * Migration status options
 */
export interface StatusCommandOptions extends MigrationCommandOptions {
	/** Output format */
	format?: 'text' | 'json' | 'table';
	
	/** Show only pending migrations */
	pendingOnly?: boolean;
	
	/** Show only applied migrations */
	appliedOnly?: boolean;
	
	/** Filter by DocType */
	doctype?: string;
}

/**
 * Migration rollback options
 */
export interface RollbackCommandOptions extends MigrationCommandOptions {
	/** Number of migrations to rollback */
	steps?: number;
	
	/** Specific migration ID to rollback */
	id?: string;
	
	/** Rollback to specific timestamp */
	to?: Date;
	
	/** Confirm destructive operations */
	confirmDestructive?: boolean;
}
```

### Configuration Types

```typescript
/**
 * Global CLI configuration
 */
export interface CLIConfig {
	/** Default site to use */
	defaultSite?: string;
	
	/** Default output format */
	outputFormat: 'text' | 'json' | 'table';
	
	/** Enable colored output */
	colors: boolean;
	
	/** Default timeout for operations */
	timeout: number;
	
	/** Default batch size */
	batchSize: number;
	
	/** Create backups by default */
	backup: boolean;
	
	/** Verbose output by default */
	verbose: boolean;
	
	/** Force operations by default */
	force: boolean;
	
	/** Log level */
	logLevel: 'error' | 'warn' | 'info' | 'debug';
	
	/** Sites directory path */
	sitesDir: string;
	
	/** Configuration file path */
	configPath: string;
}

/**
 * Site-specific configuration
 */
export interface SiteConfig {
	/** Site name */
	name: string;
	
	/** Site title */
	title?: string;
	
	/** Database configuration */
	database: DatabaseConfig;
	
	/** Site status */
	status: 'active' | 'inactive' | 'maintenance';
	
	/** Site-specific settings */
	settings?: Record<string, any>;
	
	/** Custom migration paths */
	migrationPaths?: string[];
	
	/** Site creation date */
	createdAt: Date;
	
	/** Last modified date */
	modifiedAt: Date;
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
	/** Database type (currently only SQLite) */
	type: 'sqlite';
	
	/** Database file path */
	path: string;
	
	/** Connection pool size */
	poolSize?: number;
	
	/** Connection timeout */
	timeout?: number;
	
	/** Additional connection options */
	options?: Record<string, any>;
}

/**
 * Site execution context
 */
export interface SiteContext {
	/** Site configuration */
	config: SiteConfig;
	
	/** Database connection */
	database: Database;
	
	/** DocType engine */
	doctypeEngine: DocTypeEngine;
	
	/** Migration applier */
	migrationApplier: MigrationApplier;
	
	/** Site-specific logger */
	logger: Logger;
	
	/** Working directory */
	workingDir: string;
}
```

### Output and Progress Types

```typescript
/**
 * Output handler interface
 */
export interface OutputHandler {
	/** Write standard output */
	write(message: string): void;
	
	/** Write error output */
	error(message: string): void;
	
	/** Write warning output */
	warn(message: string): void;
	
	/** Write success message */
	success(message: string): void;
	
	/** Write info message */
	info(message: string): void;
	
	/** Write debug message */
	debug(message: string): void;
	
	/** Format and write table */
	table(data: string[][], headers?: string[]): void;
	
	/** Write JSON output */
	json(data: any): void;
	
	/** Write blank line */
	newline(): void;
	
	/** Clear screen */
	clear(): void;
}

/**
 * Progress reporter interface
 */
export interface ProgressReporter {
	/** Start a new progress operation */
	start(operation: string, total?: number): void;
	
	/** Update progress */
	update(current: number, message?: string): void;
	
	/** Increment progress by one */
	increment(message?: string): void;
	
	/** Complete current operation */
	complete(message?: string): void;
	
	/** Report warning during operation */
	warn(message: string): void;
	
	/** Report error during operation */
	error(message: string): void;
	
	/** Set progress percentage */
	setPercentage(percentage: number, message?: string): void;
	
	/** Create sub-progress */
	subProgress(operation: string, total?: number): ProgressReporter;
}

/**
 * Output formatting options
 */
export interface OutputFormatOptions {
	/** Use colors */
	colors?: boolean;
	
	/** Use Unicode characters */
	unicode?: boolean;
	
	/** Table width */
	width?: number;
	
	/** Indentation size */
	indent?: number;
	
	/** Show timestamps */
	timestamps?: boolean;
	
	/** Show stack traces */
	stackTraces?: boolean;
}
```

### Error Handling Types

```typescript
/**
 * Error handler interface
 */
export interface ErrorHandler {
	/** Handle error and return exit code */
	handle(error: Error, context: ExecutionContext): number;
	
	/** Handle error with additional context */
	handleWithContext(error: Error, context: ExecutionContext, additional?: any): number;
	
	/** Categorize error */
	categorizeError(error: Error): ErrorCategory;
	
	/** Format error message */
	formatError(error: Error, category: ErrorCategory): string;
	
	/** Get exit code for error category */
	getExitCode(category: ErrorCategory): number;
}

/**
 * Error categories
 */
export type ErrorCategory = 
	| 'configuration'
	| 'site'
	| 'migration'
	| 'database'
	| 'filesystem'
	| 'network'
	| 'permission'
	| 'validation'
	| 'system'
	| 'unknown';

/**
 * CLI error with additional context
 */
export interface CLIError extends Error {
	/** Error code */
	code: string;
	
	/** Error category */
	category: ErrorCategory;
	
	/** Related site name */
	site?: string;
	
	/** Related DocType */
	doctype?: string;
	
	/** Related migration ID */
	migrationId?: string;
	
	/** Error severity */
	severity: 'low' | 'medium' | 'high' | 'critical';
	
	/** Whether error is recoverable */
	recoverable: boolean;
	
	/** Suggested actions */
	suggestions?: string[];
	
	/** Additional context data */
	context?: Record<string, any>;
}
```

### Service Types

```typescript
/**
 * Migration service interface
 */
export interface MigrationService {
	/** Run all pending migrations */
	runMigrations(options: MigrationCommandOptions): Promise<MigrationResult>;
	
	/** Get migration status */
	getStatus(options: StatusCommandOptions): Promise<MigrationStatus>;
	
	/** Rollback migrations */
	rollback(options: RollbackCommandOptions): Promise<MigrationResult>;
	
	/** Dry run migrations */
	dryRun(options: MigrationCommandOptions): Promise<DryRunResult>;
	
	/** Validate migrations */
	validate(options: MigrationCommandOptions): Promise<ValidationResult>;
}

/**
 * Site service interface
 */
export interface SiteService {
	/** Get all sites */
	getAllSites(): Promise<SiteConfig[]>;
	
	/** Get site by name */
	getSite(name: string): Promise<SiteConfig | null>;
	
	/** Get default site */
	getDefaultSite(): Promise<SiteConfig | null>;
	
	/** Create site context */
	getSiteContext(siteName: string): Promise<SiteContext>;
	
	/** Create new site */
	createSite(config: SiteConfig): Promise<SiteConfig>;
	
	/** Update site */
	updateSite(name: string, updates: Partial<SiteConfig>): Promise<SiteConfig>;
	
	/** Delete site */
	deleteSite(name: string): Promise<void>;
	
	/** Validate site configuration */
	validateSite(config: SiteConfig): Promise<ValidationResult>;
}

/**
 * Configuration service interface
 */
export interface ConfigService {
	/** Load CLI configuration */
	loadConfig(): Promise<CLIConfig>;
	
	/** Save CLI configuration */
	saveConfig(config: CLIConfig): Promise<void>;
	
	/** Get configuration value */
	get<T>(key: string, defaultValue?: T): T;
	
	/** Set configuration value */
	set(key: string, value: any): Promise<void>;
	
	/** Validate configuration */
	validate(config: CLIConfig): Promise<ValidationResult>;
}
```

### Result Types

```typescript
/**
 * Migration status result
 */
export interface MigrationStatus {
	/** Site name */
	site: string;
	
	/** Overall status */
	status: 'up-to-date' | 'pending' | 'error';
	
	/** Migration statistics */
	stats: MigrationStats;
	
	/** Per-Doctype status */
	doctypes: DocTypeMigrationStatus[];
	
	/** Last migration info */
	lastMigration?: AppliedMigration;
	
	/** Pending migrations */
	pending: Migration[];
	
	/** Failed migrations */
	failed: Migration[];
}

/**
 * Per-Doctype migration status
 */
export interface DocTypeMigrationStatus {
	/** DocType name */
	name: string;
	
	/** Status */
	status: 'up-to-date' | 'pending' | 'error';
	
	/** Current version */
	currentVersion?: string;
	
	/** Target version */
	targetVersion?: string;
	
	/** Number of pending migrations */
	pendingCount: number;
	
	/** Last migration */
	lastMigration?: AppliedMigration;
	
	/** Error message */
	error?: string;
}

/**
 * Dry run result
 */
export interface DryRunResult {
	/** Success flag */
	success: boolean;
	
	/** SQL that would be executed */
	sql: string[];
	
	/** Warnings */
	warnings: string[];
	
	/** Estimated execution time */
	estimatedTime?: number;
	
	/** Whether any migrations are destructive */
	destructive: boolean;
	
	/** Data loss warnings */
	dataLossWarnings: string[];
	
	/** Per-Doctype results */
	doctypes: DocTypeDryRunResult[];
}

/**
 * Per-Doctype dry run result
 */
export interface DocTypeDryRunResult {
	/** DocType name */
	name: string;
	
	/** Number of migrations */
	migrationCount: number;
	
	/** SQL statements */
	sql: string[];
	
	/** Whether changes are destructive */
	destructive: boolean;
	
	/** Warnings */
	warnings: string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
	/** Overall validity */
	valid: boolean;
	
	/** Validation errors */
	errors: ValidationError[];
	
	/** Validation warnings */
	warnings: ValidationWarning[];
	
	/** Recommendations */
	recommendations: string[];
}
```

### Logger Types

```typescript
/**
 * Logger interface
 */
export interface Logger {
	/** Log error message */
	error(message: string, ...args: any[]): void;
	
	/** Log warning message */
	warn(message: string, ...args: any[]): void;
	
	/** Log info message */
	info(message: string, ...args: any[]): void;
	
	/** Log debug message */
	debug(message: string, ...args: any[]): void;
	
	/** Set log level */
	setLevel(level: LogLevel): void;
	
	/** Get current log level */
	getLevel(): LogLevel;
	
	/** Create child logger with additional context */
	child(context: Record<string, any>): Logger;
}

/**
 * Log levels
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Log entry
 */
export interface LogEntry {
	/** Timestamp */
	timestamp: Date;
	
	/** Log level */
	level: LogLevel;
	
	/** Message */
	message: string;
	
	/** Additional arguments */
	args: any[];
	
	/** Logger context */
	context?: Record<string, any>;
	
	/** Error stack trace (if applicable) */
	stack?: string;
}
```

### Utility Types

```typescript
/**
 * Command registry
 */
export interface CommandRegistry {
	/** Register a command */
	register(command: Command): void;
	
	/** Unregister a command */
	unregister(name: string): void;
	
	/** Get command by name */
	get(name: string): Command | undefined;
	
	/** Get all commands */
	getAll(): Command[];
	
	/** Get commands matching pattern */
	find(pattern: string): Command[];
	
	/** Check if command exists */
	has(name: string): boolean;
}

/**
 * Argument parser
 */
export interface ArgumentParser {
	/** Parse command line arguments */
	parse(args: string[]): CommandArgs;
	
	/** Generate usage help */
	generateUsage(command: Command): string;
	
	/** Validate arguments */
	validate(args: CommandArgs, command: Command): ValidationResult;
}

/**
 * File system utilities
 */
export interface FileSystemUtils {
	/** Check if file exists */
	exists(path: string): Promise<boolean>;
	
	/** Read file content */
	readFile(path: string): Promise<string>;
	
	/** Write file content */
	writeFile(path: string, content: string): Promise<void>;
	
	/** Create directory */
	mkdir(path: string): Promise<void>;
	
	/** Remove file or directory */
	remove(path: string): Promise<void>;
	
	/** List directory contents */
	list(path: string): Promise<string[]>;
	
	/** Get file stats */
	stats(path: string): Promise<FileStats>;
}

/**
 * File statistics
 */
export interface FileStats {
	/** Whether path is a file */
	isFile: boolean;
	
	/** Whether path is a directory */
	isDirectory: boolean;
	
	/** File size in bytes */
	size: number;
	
	/** Creation time */
	createdAt: Date;
	
	/** Last modified time */
	modifiedAt: Date;
	
	/** Last accessed time */
	accessedAt: Date;
}
```

## Integration Types

### Migration System Integration

```typescript
/**
 * Extended migration options for CLI
 */
export interface CLIMigrationOptions extends MigrationOptions {
	/** CLI-specific options */
	cli: {
		/** Output format */
		outputFormat: 'text' | 'json' | 'table';
		
		/** Show progress */
		showProgress: boolean;
		
		/** Interactive mode */
		interactive: boolean;
		
		/** Site context */
		siteContext?: SiteContext;
	};
}

/**
 * CLI-specific migration result
 */
export interface CLIMigrationResult extends MigrationResult {
	/** CLI-specific metadata */
	cli: {
		/** Formatted output */
		output?: string;
		
		/** Progress updates */
		progress?: ProgressUpdate[];
		
		/** User interactions */
		interactions?: UserInteraction[];
	};
}

/**
 * Progress update
 */
export interface ProgressUpdate {
	/** Timestamp */
	timestamp: Date;
	
	/** Operation name */
	operation: string;
	
	/** Current progress */
	current: number;
	
	/** Total items */
	total?: number;
	
	/** Progress message */
	message?: string;
	
	/** Operation status */
	status: 'running' | 'completed' | 'error' | 'warning';
}

/**
 * User interaction
 */
export interface UserInteraction {
	/** Timestamp */
	timestamp: Date;
	
	/** Interaction type */
	type: 'confirmation' | 'input' | 'choice' | 'password';
	
	/** Prompt message */
	prompt: string;
	
	/** User response */
	response?: string;
	
	/** Default value */
	default?: string;
	
	/** Available choices */
	choices?: string[];
}
```

These comprehensive types provide a solid foundation for implementing the CLI system with proper TypeScript support and clear interfaces for all components.