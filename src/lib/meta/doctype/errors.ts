/**
 * DocType Engine Error Classes
 * 
 * This module defines all error classes used in DocType management
 * to provide consistent error handling throughout the system.
 */

/**
 * Base error class for DocType operations
 */
export class DocTypeError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'DocTypeError';
	}
}

/**
 * Error thrown when attempting to register a duplicate DocType
 */
export class DocTypeExistsError extends DocTypeError {
	constructor(doctypeName: string) {
		super(`DocType '${doctypeName}' already exists`);
		this.name = 'DocTypeExistsError';
	}
}

/**
 * Error thrown when attempting to access a non-existent DocType
 */
export class DocTypeNotFoundError extends DocTypeError {
	constructor(doctypeName: string) {
		super(`DocType '${doctypeName}' not found`);
		this.name = 'DocTypeNotFoundError';
	}
}

/**
 * Error thrown when DocType validation fails
 */
export class DocTypeValidationError extends DocTypeError {
	constructor(
		message: string,
		public readonly validationErrors: ValidationError[]
	) {
		super(message);
		this.name = 'DocTypeValidationError';
	}
}

/**
 * Individual validation error
 */
export interface ValidationError {
	/** Error type */
	type: 'required' | 'duplicate' | 'invalid_type' | 'missing_options';
	/** Field or property name */
	field?: string;
	/** Error message */
	message: string;
	/** Severity level */
	severity: 'error' | 'warning';
}

/**
 * Result of DocType validation
 */
export interface ValidationResult {
	/** Whether validation passed */
	valid: boolean;
	/** Array of validation errors */
	errors: ValidationError[];
}