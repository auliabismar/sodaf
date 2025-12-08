/**
 * Output Formatting and Progress Reporting
 * 
 * This file implements output formatting, progress reporting, and color support
 * for the CLI system.
 */

import type {
	OutputFormatter,
	ProgressReporter,
	Progress,
	Spinner,
	MigrationResult,
	MigrationHistory
} from './types';

/**
 * Color codes for terminal output
 */
enum Color {
	RESET = '\x1b[0m',
	BOLD = '\x1b[1m',
	DIM = '\x1b[2m',
	ITALIC = '\x1b[3m',
	UNDERLINE = '\x1b[4m',
	
	// Colors
	BLACK = '\x1b[30m',
	RED = '\x1b[31m',
	GREEN = '\x1b[32m',
	YELLOW = '\x1b[33m',
	BLUE = '\x1b[34m',
	MAGENTA = '\x1b[35m',
	CYAN = '\x1b[36m',
	WHITE = '\x1b[37m',
	
	// Bright colors
	BRIGHT_BLACK = '\x1b[90m',
	BRIGHT_RED = '\x1b[91m',
	BRIGHT_GREEN = '\x1b[92m',
	BRIGHT_YELLOW = '\x1b[93m',
	BRIGHT_BLUE = '\x1b[94m',
	BRIGHT_MAGENTA = '\x1b[95m',
	BRIGHT_CYAN = '\x1b[96m',
	BRIGHT_WHITE = '\x1b[97m',
	
	// Background colors
	BG_BLACK = '\x1b[40m',
	BG_RED = '\x1b[41m',
	BG_GREEN = '\x1b[42m',
	BG_YELLOW = '\x1b[43m',
	BG_BLUE = '\x1b[44m',
	BG_MAGENTA = '\x1b[45m',
	BG_CYAN = '\x1b[46m',
	BG_WHITE = '\x1b[47m'
}

/**
 * Style names for formatting
 */
enum Style {
	ERROR = 'error',
	WARN = 'warn',
	SUCCESS = 'success',
	INFO = 'info',
	DEBUG = 'debug',
	HEADER = 'header',
	COMMAND = 'command',
	OPTION = 'option',
	VALUE = 'value',
	EMPHASIS = 'emphasis',
	MUTED = 'muted'
}

/**
 * Terminal output formatter
 */
export class TerminalOutputFormatter implements OutputFormatter {
	private useColors: boolean;
	private outputFormat: 'text' | 'json' | 'table';
	
	/**
	 * Create a new output formatter
	 * @param useColors Whether to use colors in output
	 * @param outputFormat Output format
	 */
	constructor(useColors: boolean = true, outputFormat: 'text' | 'json' | 'table' = 'text') {
		this.useColors = useColors && this.supportsColor();
		this.outputFormat = outputFormat;
	}
	
	/**
	 * Format a message with optional styling
	 * @param message Message to format
	 * @param style Optional style name
	 * @returns Formatted message
	 */
	format(message: string, style?: string): string {
		if (!style || !this.useColors) {
			return message;
		}
		
		const color = this.getStyleColor(style);
		return `${color}${message}${Color.RESET}`;
	}
	
	/**
	 * Format an error message
	 * @param message Error message
	 * @returns Formatted error message
	 */
	error(message: string): string {
		return this.format(`Error: ${message}`, Style.ERROR);
	}
	
	/**
	 * Format a warning message
	 * @param message Warning message
	 * @returns Formatted warning message
	 */
	warn(message: string): string {
		return this.format(`Warning: ${message}`, Style.WARN);
	}
	
	/**
	 * Format a success message
	 * @param message Success message
	 * @returns Formatted success message
	 */
	success(message: string): string {
		return this.format(message, Style.SUCCESS);
	}
	
	/**
	 * Format an info message
	 * @param message Info message
	 * @returns Formatted info message
	 */
	info(message: string): string {
		return this.format(message, Style.INFO);
	}
	
	/**
	 * Format data as a table
	 * @param data Table data
	 * @param headers Column headers
	 * @returns Formatted table
	 */
	table(data: any[][], headers: string[]): string {
		if (this.outputFormat === 'json') {
			return this.json({ headers, data });
		}
		
		if (data.length === 0) {
			return 'No data to display';
		}
		
		// Calculate column widths
		const colWidths = headers.map((header, i) => {
			const maxDataWidth = Math.max(...data.map(row => 
				String(row[i] || '').length
			));
			return Math.max(header.length, maxDataWidth);
		});
		
		const lines: string[] = [];
		
		// Add headers
		const headerRow = headers.map((header, i) => 
			this.format(header.padEnd(colWidths[i]), Style.HEADER)
		).join(' | ');
		lines.push(headerRow);
		
		// Add separator
		const separator = colWidths.map(width => '-'.repeat(width)).join('-+-');
		lines.push(separator);
		
		// Add data rows
		for (const row of data) {
			const formattedRow = row.map((cell, i) => {
				const cellStr = String(cell || '');
				return cellStr.padEnd(colWidths[i]);
			}).join(' | ');
			lines.push(formattedRow);
		}
		
		return lines.join('\n');
	}
	
	/**
	 * Format data as JSON
	 * @param data Data to format
	 * @param pretty Whether to pretty-print
	 * @returns Formatted JSON
	 */
	json(data: any, pretty: boolean = true): string {
		return JSON.stringify(data, null, pretty ? 2 : 0);
	}
	
	/**
	 * Format migration result
	 * @param result Migration result
	 * @returns Formatted result
	 */
	migrationResult(result: MigrationResult): string {
		if (this.outputFormat === 'json') {
			return this.json(result);
		}
		
		const lines: string[] = [];
		
		// Status
		const status = result.success 
			? this.success('SUCCESS') 
			: this.error('FAILED');
		lines.push(`Migration ${status}`);
		
		// Execution time
		if (result.executionTime) {
			lines.push(`Execution time: ${result.executionTime}ms`);
		}
		
		// Affected rows
		if (result.affectedRows !== undefined) {
			lines.push(`Affected rows: ${result.affectedRows}`);
		}
		
		// SQL statements
		if (result.sql && result.sql.length > 0) {
			lines.push('');
			lines.push(this.format('SQL Statements:', Style.HEADER));
			for (const sql of result.sql) {
				lines.push(`  ${sql}`);
			}
		}
		
		// Warnings
		if (result.warnings && result.warnings.length > 0) {
			lines.push('');
			lines.push(this.format('Warnings:', Style.WARN));
			for (const warning of result.warnings) {
				lines.push(`  ${this.warn(warning)}`);
			}
		}
		
		// Errors
		if (result.errors && result.errors.length > 0) {
			lines.push('');
			lines.push(this.format('Errors:', Style.ERROR));
			for (const error of result.errors) {
				lines.push(`  ${this.error(error)}`);
			}
		}
		
		return lines.join('\n');
	}
	
	/**
	 * Format migration history
	 * @param history Migration history
	 * @returns Formatted history
	 */
	migrationHistory(history: MigrationHistory): string {
		if (this.outputFormat === 'json') {
			return this.json(history);
		}
		
		const lines: string[] = [];
		
		// Statistics
		lines.push(this.format('Migration Statistics:', Style.HEADER));
		lines.push(`  Total: ${history.stats.total}`);
		lines.push(`  Applied: ${history.stats.applied}`);
		lines.push(`  Pending: ${history.stats.pending}`);
		lines.push(`  Failed: ${history.stats.failed}`);
		
		if (history.stats.lastMigrationDate) {
			lines.push(`  Last migration: ${history.stats.lastMigrationDate.toISOString()}`);
		}
		
		// Migration table
		if (history.migrations.length > 0) {
			lines.push('');
			lines.push(this.format('Migration History:', Style.HEADER));
			
			const tableData = history.migrations.map((migration: any) => [
				migration.id,
				migration.doctype,
				migration.applied ? 'Yes' : 'No',
				migration.timestamp.toISOString(),
				migration.destructive ? 'Yes' : 'No'
			]);
			
			const table = this.table(tableData, [
				'ID', 'DocType', 'Applied', 'Timestamp', 'Destructive'
			]);
			
			lines.push(table);
		}
		
		return lines.join('\n');
	}
	
	/**
	 * Get color for a style
	 * @param style Style name
	 * @returns Color code
	 */
	private getStyleColor(style: string): string {
		switch (style) {
			case Style.ERROR:
				return Color.RED;
			case Style.WARN:
				return Color.YELLOW;
			case Style.SUCCESS:
				return Color.GREEN;
			case Style.INFO:
				return Color.BLUE;
			case Style.DEBUG:
				return Color.DIM;
			case Style.HEADER:
				return Color.BOLD;
			case Style.COMMAND:
				return Color.CYAN;
			case Style.OPTION:
				return Color.MAGENTA;
			case Style.VALUE:
				return Color.YELLOW;
			case Style.EMPHASIS:
				return Color.BOLD;
			case Style.MUTED:
				return Color.DIM;
			default:
				return Color.RESET;
		}
	}
	
	/**
	 * Check if terminal supports color
	 * @returns True if color is supported
	 */
	private supportsColor(): boolean {
		// Check for common environment variables
		if (process.env.NO_COLOR || process.env.FORCE_NO_COLOR) {
			return false;
		}
		
		if (process.env.FORCE_COLOR) {
			return true;
		}
		
		// Check if we're in a TTY
		if (!process.stdout.isTTY) {
			return false;
		}
		
		// Check for common terminals that support color
		const term = process.env.TERM || '';
		if (term.includes('color') || term.includes('256') || term === 'xterm') {
			return true;
		}
		
		// Default to true for most modern terminals
		return true;
	}
}

/**
 * Terminal progress reporter
 */
export class TerminalProgressReporter implements ProgressReporter {
	private useColors: boolean;
	private activeProgress: Map<string, TerminalProgress> = new Map();
	private activeSpinner: TerminalSpinner | null = null;
	
	/**
	 * Create a new progress reporter
	 * @param useColors Whether to use colors in output
	 */
	constructor(useColors: boolean = true) {
		this.useColors = useColors && this.supportsProgress();
	}
	
	/**
	 * Start a progress operation
	 * @param operation Operation description
	 * @param total Total items (if known)
	 * @returns Progress instance
	 */
	start(operation: string, total?: number): Progress {
		const progress = new TerminalProgress(operation, total, this.useColors);
		this.activeProgress.set(operation, progress);
		progress.start();
		return progress;
	}
	
	/**
	 * Create a spinner for indeterminate progress
	 * @param text Spinner text
	 * @returns Spinner instance
	 */
	spinner(text: string): Spinner {
		// Stop any existing spinner
		if (this.activeSpinner) {
			this.activeSpinner.stop();
		}
		
		this.activeSpinner = new TerminalSpinner(text, this.useColors);
		this.activeSpinner.start();
		return this.activeSpinner;
	}
	
	/**
	 * Report a warning
	 * @param message Warning message
	 */
	warning(message: string): void {
		const formatter = new TerminalOutputFormatter(this.useColors);
		console.log(formatter.warn(message));
	}
	
	/**
	 * Report an error
	 * @param message Error message
	 */
	error(message: string): void {
		const formatter = new TerminalOutputFormatter(this.useColors);
		console.log(formatter.error(message));
	}
	
	/**
	 * Check if terminal supports progress indicators
	 * @returns True if progress is supported
	 */
	private supportsProgress(): boolean {
		// Progress indicators only work in TTY
		return process.stdout.isTTY === true;
	}
}

/**
 * Terminal progress implementation
 */
class TerminalProgress implements Progress {
	private operation: string;
	private total: number | undefined;
	private current: number = 0;
	private useColors: boolean;
	private startTime: number = 0;
	private lastUpdate: number = 0;
	private isActive: boolean = false;
	
	constructor(operation: string, total: number | undefined, useColors: boolean) {
		this.operation = operation;
		this.total = total;
		this.useColors = useColors;
	}
	
	/**
	 * Start the progress indicator
	 */
	start(): void {
		this.startTime = Date.now();
		this.lastUpdate = this.startTime;
		this.isActive = true;
		this.render();
	}
	
	/**
	 * Update progress
	 * @param current Current progress
	 * @param message Optional message
	 */
	update(current: number, message?: string): void {
		this.current = current;
		
		// Throttle updates to avoid flickering
		const now = Date.now();
		if (now - this.lastUpdate < 100) {
			return;
		}
		
		this.lastUpdate = now;
		this.render(message);
	}
	
	/**
	 * Increment progress
	 * @param amount Amount to increment
	 * @param message Optional message
	 */
	increment(amount: number = 1, message?: string): void {
		this.update(this.current + amount, message);
	}
	
	/**
	 * Complete the progress
	 * @param message Completion message
	 */
	complete(message?: string): void {
		if (!this.isActive) return;
		
		this.isActive = false;
		
		// Clear the progress line
		if (this.useColors) {
			process.stdout.write('\r\x1b[K');
		}
		
		const formatter = new TerminalOutputFormatter(this.useColors);
		const duration = Date.now() - this.startTime;
		
		if (message) {
			console.log(formatter.success(message));
		} else {
			console.log(formatter.success(`${this.operation} completed in ${duration}ms`));
		}
	}
	
	/**
	 * Fail the progress
	 * @param message Failure message
	 */
	fail(message?: string): void {
		if (!this.isActive) return;
		
		this.isActive = false;
		
		// Clear the progress line
		if (this.useColors) {
			process.stdout.write('\r\x1b[K');
		}
		
		const formatter = new TerminalOutputFormatter(this.useColors);
		
		if (message) {
			console.log(formatter.error(message));
		} else {
			console.log(formatter.error(`${this.operation} failed`));
		}
	}
	
	/**
	 * Render the progress indicator
	 * @param message Optional message
	 */
	private render(message?: string): void {
		if (!this.isActive) return;
		
		const formatter = new TerminalOutputFormatter(this.useColors);
		let output = '\r';
		
		// Operation name
		output += formatter.format(this.operation, Style.HEADER);
		output += ': ';
		
		if (this.total !== undefined) {
			// Determinate progress
			const percentage = Math.min(100, Math.round((this.current / this.total) * 100));
			const barLength = 20;
			const filledLength = Math.round((percentage / 100) * barLength);
			const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
			
			output += `${bar} ${percentage}% (${this.current}/${this.total})`;
		} else {
			// Indeterminate progress
			output += `${this.current} items processed`;
		}
		
		// Add message if provided
		if (message) {
			output += ` - ${message}`;
		}
		
		// Clear rest of line
		output += '\x1b[K';
		
		process.stdout.write(output);
	}
}

/**
 * Terminal spinner implementation
 */
class TerminalSpinner implements Spinner {
	private spinnerText: string;
	private useColors: boolean;
	private isActive: boolean = false;
	private interval: NodeJS.Timeout | null = null;
	private currentFrame: number = 0;
	private frames: string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
	
	constructor(text: string, useColors: boolean) {
		this.spinnerText = text;
		this.useColors = useColors;
	}
	
	/**
	 * Start the spinner
	 */
	start(): void {
		if (this.isActive) return;
		
		this.isActive = true;
		this.currentFrame = 0;
		
		this.interval = setInterval(() => {
			this.render();
			this.currentFrame = (this.currentFrame + 1) % this.frames.length;
		}, 100);
	}
	
	/**
	 * Update spinner text
	 * @param text New text
	 */
	text(text: string): void {
		this.spinnerText = text;
		if (this.isActive) {
			this.render();
		}
	}
	
	/**
	 * Stop the spinner with success
	 * @param text Success text
	 */
	succeed(text?: string): void {
		this.stop();
		const formatter = new TerminalOutputFormatter(this.useColors);
		const message = text || this.spinnerText;
		console.log(`${formatter.success('✓')} ${message}`);
	}
	
	/**
	 * Stop the spinner with failure
	 * @param text Failure text
	 */
	fail(text?: string): void {
		this.stop();
		const formatter = new TerminalOutputFormatter(this.useColors);
		const message = text || this.spinnerText;
		console.log(`${formatter.error('✗')} ${message}`);
	}
	
	/**
	 * Stop the spinner with warning
	 * @param text Warning text
	 */
	warn(text?: string): void {
		this.stop();
		const formatter = new TerminalOutputFormatter(this.useColors);
		const message = text || this.spinnerText;
		console.log(`${formatter.warn('⚠')} ${message}`);
	}
	
	/**
	 * Stop the spinner with info
	 * @param text Info text
	 */
	info(text?: string): void {
		this.stop();
		const formatter = new TerminalOutputFormatter(this.useColors);
		const message = text || this.spinnerText;
		console.log(`${formatter.info('ℹ')} ${message}`);
	}
	
	/**
	 * Stop the spinner
	 */
	stop(): void {
		if (!this.isActive) return;
		
		this.isActive = false;
		
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
		
		// Clear the spinner line
		if (this.useColors) {
			process.stdout.write('\r\x1b[K');
		}
	}
	
	/**
	 * Render the spinner
	 */
	private render(): void {
		if (!this.isActive) return;
		
		const formatter = new TerminalOutputFormatter(this.useColors);
		const frame = this.frames[this.currentFrame];
		const output = `\r${formatter.format(frame, Style.EMPHASIS)} ${this.spinnerText}\x1b[K`;
		
		process.stdout.write(output);
	}
}