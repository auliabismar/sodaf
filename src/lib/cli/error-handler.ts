/**
 * Error Handler for CLI
 * 
 * This file implements error handling for CLI commands, including error
 * categorization and user-friendly error messages.
 */

import type {
	ErrorHandler,
	ExecutionContext
} from './types';
import { ErrorCategory, ExitCode } from './types';

/**
 * CLI error handler implementation
 */
export class CLIErrorHandler implements ErrorHandler {
	/**
	 * Create a new CLI error handler
	 */
	constructor() {}
	
	/**
	 * Handle an error
	 * @param error Error to handle
	 * @param context Execution context
	 * @returns Exit code
	 */
	handle(error: Error, context: ExecutionContext): number {
		// Log the error
		context.logger.error(`Error: ${error.message}`, error.stack);
		
		// Categorize the error
		const category = this.categorize(error);
		
		// Format and display user-friendly message
		const message = this.format(error, category);
		context.output.error(message);
		
		// Provide additional context for certain error types
		this.provideContext(error, category, context);
		
		// Return appropriate exit code
		return this.getExitCode(category);
	}
	
	/**
	 * Categorize an error
	 * @param error Error to categorize
	 * @returns Error category
	 */
	categorize(error: Error): ErrorCategory {
		const message = error.message.toLowerCase();
		
		// Configuration errors
		if (message.includes('config') || message.includes('configuration')) {
			return ErrorCategory.CONFIGURATION;
		}
		
		// Site errors
		if (message.includes('site') || message.includes('database') || 
			message.includes('connection')) {
			return ErrorCategory.SITE;
		}
		
		// Migration errors
		if (message.includes('migration') || message.includes('schema')) {
			return ErrorCategory.MIGRATION;
		}
		
		// File system errors
		if (message.includes('file') || message.includes('directory') ||
			message.includes('permission denied') || message.includes('access denied')) {
			return ErrorCategory.FILE_SYSTEM;
		}
		
		// Permission errors
		if (message.includes('permission') || message.includes('unauthorized') ||
			message.includes('forbidden')) {
			return ErrorCategory.PERMISSION;
		}
		
		// Network errors
		if (message.includes('network') || message.includes('timeout') ||
			message.includes('connection')) {
			return ErrorCategory.NETWORK;
		}
		
		// Validation errors
		if (message.includes('invalid') || message.includes('validation') ||
			message.includes('required')) {
			return ErrorCategory.VALIDATION;
		}
		
		// User errors
		if (message.includes('user') || message.includes('interrupt') ||
			message.includes('cancelled')) {
			return ErrorCategory.USER;
		}
		
		// Default to system error
		return ErrorCategory.SYSTEM;
	}
	
	/**
	 * Get user-friendly error message
	 * @param error Error to format
	 * @param category Error category
	 * @returns Formatted error message
	 */
	format(error: Error, category: ErrorCategory): string {
		const message = error.message;
		
		// Add category-specific context
		switch (category) {
			case ErrorCategory.CONFIGURATION:
				return `Configuration error: ${message}. Please check your configuration.`;
				
			case ErrorCategory.SITE:
				return `Site error: ${message}. Please check your site configuration.`;
				
			case ErrorCategory.MIGRATION:
				return `Migration error: ${message}. Please check your migration files.`;
				
			case ErrorCategory.DATABASE:
				return `Database error: ${message}. Please check your database connection.`;
				
			case ErrorCategory.FILE_SYSTEM:
				return `File system error: ${message}. Please check file permissions.`;
				
			case ErrorCategory.PERMISSION:
				return `Permission error: ${message}. Please check your access rights.`;
				
			case ErrorCategory.NETWORK:
				return `Network error: ${message}. Please check your network connection.`;
				
			case ErrorCategory.VALIDATION:
				return `Validation error: ${message}. Please check your input.`;
				
			case ErrorCategory.USER:
				return `Operation cancelled by user: ${message}`;
				
			case ErrorCategory.SYSTEM:
			default:
				return `System error: ${message}. Please report this issue.`;
		}
	}
	
	/**
	 * Provide additional context for errors
	 * @param error Original error
	 * @param category Error category
	 * @param context Execution context
	 */
	private provideContext(error: Error, category: ErrorCategory, context: ExecutionContext): void {
		switch (category) {
			case ErrorCategory.CONFIGURATION:
				context.output.info('Configuration files are searched in the following order:');
				context.output.info('  1. --config command line option');
				context.output.info('  2. SODAF_CONFIG environment variable');
				context.output.info('  3. ./sodaf.config.js');
				context.output.info('  4. ~/.sodaf/config.js');
				break;
				
			case ErrorCategory.SITE:
				context.output.info('Use --site to specify a site or configure a default site.');
				context.output.info('Use "sodaf site list" to see available sites.');
				break;
				
			case ErrorCategory.MIGRATION:
				context.output.info('Use --dry-run to preview changes without applying them.');
				context.output.info('Use --force to bypass validation (not recommended).');
				break;
				
			case ErrorCategory.PERMISSION:
				context.output.info('Try running with elevated privileges or check file ownership.');
				break;
				
			case ErrorCategory.NETWORK:
				context.output.info('Check your internet connection and try again.');
				context.output.info('Use --timeout to increase timeout if needed.');
				break;
		}
	}
	
	/**
	 * Get exit code for error category
	 * @param category Error category
	 * @returns Exit code
	 */
	private getExitCode(category: ErrorCategory): ExitCode {
		switch (category) {
			case ErrorCategory.CONFIGURATION:
				return ExitCode.CONFIGURATION_ERROR;
				
			case ErrorCategory.SITE:
				return ExitCode.SITE_ERROR;
				
			case ErrorCategory.MIGRATION:
				return ExitCode.MIGRATION_ERROR;
				
			case ErrorCategory.PERMISSION:
				return ExitCode.PERMISSION_ERROR;
				
			case ErrorCategory.NETWORK:
				return ExitCode.NETWORK_ERROR;
				
			case ErrorCategory.VALIDATION:
				return ExitCode.INVALID_ARGUMENTS;
				
			case ErrorCategory.USER:
				return ExitCode.USER_INTERRUPT;
				
			case ErrorCategory.FILE_SYSTEM:
			case ErrorCategory.DATABASE:
			case ErrorCategory.SYSTEM:
			default:
				return ExitCode.GENERAL_ERROR;
		}
	}
}