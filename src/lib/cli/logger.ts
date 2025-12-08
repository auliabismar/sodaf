/**
 * CLI Logger
 * 
 * This file implements logging functionality for CLI commands.
 */

import type { Logger, OutputFormatter } from './types';

/**
 * Log levels in order of severity
 */
enum LogLevel {
	ERROR = 0,
	WARN = 1,
	INFO = 2,
	DEBUG = 3
}

/**
 * CLI logger implementation
 */
export class CLILogger implements Logger {
	private level: LogLevel;
	private output: OutputFormatter;
	
	/**
	 * Create a new CLI logger
	 * @param level Minimum log level
	 * @param output Output formatter
	 */
	constructor(level: 'error' | 'warn' | 'info' | 'debug', output: OutputFormatter) {
		this.level = this.parseLevel(level);
		this.output = output;
	}
	
	/**
	 * Log an error message
	 * @param message Message to log
	 * @param args Additional arguments
	 */
	error(message: string, ...args: any[]): void {
		if (this.shouldLog(LogLevel.ERROR)) {
			const formattedMessage = this.formatMessage(message, ...args);
			console.error(this.output.error(formattedMessage));
		}
	}
	
	/**
	 * Log a warning message
	 * @param message Message to log
	 * @param args Additional arguments
	 */
	warn(message: string, ...args: any[]): void {
		if (this.shouldLog(LogLevel.WARN)) {
			const formattedMessage = this.formatMessage(message, ...args);
			console.warn(this.output.warn(formattedMessage));
		}
	}
	
	/**
	 * Log an info message
	 * @param message Message to log
	 * @param args Additional arguments
	 */
	info(message: string, ...args: any[]): void {
		if (this.shouldLog(LogLevel.INFO)) {
			const formattedMessage = this.formatMessage(message, ...args);
			console.log(this.output.info(formattedMessage));
		}
	}
	
	/**
	 * Log a debug message
	 * @param message Message to log
	 * @param args Additional arguments
	 */
	debug(message: string, ...args: any[]): void {
		if (this.shouldLog(LogLevel.DEBUG)) {
			const formattedMessage = this.formatMessage(message, ...args);
			const timestamp = new Date().toISOString();
			console.log(`[${timestamp}] ${this.output.format(formattedMessage, 'debug')}`);
		}
	}
	
	/**
	 * Parse string log level to enum
	 * @param level String log level
	 * @returns Log level enum
	 */
	private parseLevel(level: 'error' | 'warn' | 'info' | 'debug'): LogLevel {
		switch (level) {
			case 'error':
				return LogLevel.ERROR;
			case 'warn':
				return LogLevel.WARN;
			case 'info':
				return LogLevel.INFO;
			case 'debug':
				return LogLevel.DEBUG;
			default:
				return LogLevel.INFO;
		}
	}
	
	/**
	 * Check if a message should be logged based on current level
	 * @param level Message level
	 * @returns True if message should be logged
	 */
	private shouldLog(level: LogLevel): boolean {
		return level <= this.level;
	}
	
	/**
	 * Format message with optional arguments
	 * @param message Message template
	 * @param args Arguments to substitute
	 * @returns Formatted message
	 */
	private formatMessage(message: string, ...args: any[]): string {
		if (args.length === 0) {
			return message;
		}
		
		// Simple string substitution
		let formatted = message;
		for (let i = 0; i < args.length; i++) {
			formatted = formatted.replace('%s', String(args[i]));
		}
		
		return formatted;
	}
}