/**
 * Custom Field Errors
 * 
 * This module defines error classes specific to custom field operations,
 * providing detailed error information for debugging and error handling.
 */

/**
 * Base class for all custom field errors
 */
export class CustomFieldError extends Error {
	/** Error code for programmatic handling */
	public readonly code: string;
	
	/** Additional error details */
	public readonly details?: Record<string, any>;
	
	/**
	 * Create a new CustomFieldError
	 * @param message Error message
	 * @param code Error code
	 * @param details Additional error details
	 */
	constructor(message: string, code: string, details?: Record<string, any>) {
		super(message);
		this.name = 'CustomFieldError';
		this.code = code;
		this.details = details;
		
		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, CustomFieldError);
		}
	}
}

/**
 * Error thrown when a custom field already exists
 */
export class CustomFieldExistsError extends CustomFieldError {
	/**
	 * Create a new CustomFieldExistsError
	 * @param fieldname Name of the field that already exists
	 * @param doctype DocType the field belongs to
	 */
	constructor(fieldname: string, doctype: string) {
		super(
			`Custom field '${fieldname}' already exists for DocType '${doctype}'`,
			'CUSTOM_FIELD_EXISTS',
			{ fieldname, doctype }
		);
		this.name = 'CustomFieldExistsError';
	}
}

/**
 * Error thrown when a custom field is not found
 */
export class CustomFieldNotFoundError extends CustomFieldError {
	/**
	 * Create a new CustomFieldNotFoundError
	 * @param fieldname Name of the field that was not found
	 * @param doctype DocType the field should belong to
	 */
	constructor(fieldname: string, doctype: string) {
		super(
			`Custom field '${fieldname}' not found for DocType '${doctype}'`,
			'CUSTOM_FIELD_NOT_FOUND',
			{ fieldname, doctype }
		);
		this.name = 'CustomFieldNotFoundError';
	}
}

/**
 * Error thrown when a custom field validation fails
 */
export class CustomFieldValidationError extends CustomFieldError {
	/** Array of validation errors */
	public readonly validationErrors: string[];
	
	/**
	 * Create a new CustomFieldValidationError
	 * @param message Error message
	 * @param validationErrors Array of validation errors
	 * @param details Additional error details
	 */
	constructor(message: string, validationErrors: string[], details?: Record<string, any>) {
		super(
			message,
			'CUSTOM_FIELD_VALIDATION_ERROR',
			{ validationErrors, ...details }
		);
		this.name = 'CustomFieldValidationError';
		this.validationErrors = validationErrors;
	}
}

/**
 * Error thrown when a custom field operation is not supported
 */
export class CustomFieldOperationNotSupportedError extends CustomFieldError {
	/**
	 * Create a new CustomFieldOperationNotSupportedError
	 * @param operation The operation that is not supported
	 * @param reason Reason why the operation is not supported
	 */
	constructor(operation: string, reason?: string) {
		super(
			`Custom field operation '${operation}' is not supported${reason ? `: ${reason}` : ''}`,
			'CUSTOM_FIELD_OPERATION_NOT_SUPPORTED',
			{ operation, reason }
		);
		this.name = 'CustomFieldOperationNotSupportedError';
	}
}

/**
 * Error thrown when a custom field dependency is not found
 */
export class CustomFieldDependencyNotFoundError extends CustomFieldError {
	/**
	 * Create a new CustomFieldDependencyNotFoundError
	 * @param dependency The dependency that was not found
	 * @param fieldname Name of the field that has the dependency
	 * @param doctype DocType the field belongs to
	 */
	constructor(dependency: string, fieldname: string, doctype: string) {
		super(
			`Custom field dependency '${dependency}' not found for field '${fieldname}' in DocType '${doctype}'`,
			'CUSTOM_FIELD_DEPENDENCY_NOT_FOUND',
			{ dependency, fieldname, doctype }
		);
		this.name = 'CustomFieldDependencyNotFoundError';
	}
}

/**
 * Error thrown when a custom field type is not supported
 */
export class CustomFieldTypeNotSupportedError extends CustomFieldError {
	/**
	 * Create a new CustomFieldTypeNotSupportedError
	 * @param fieldtype The field type that is not supported
	 */
	constructor(fieldtype: string) {
		super(
			`Custom field type '${fieldtype}' is not supported`,
			'CUSTOM_FIELD_TYPE_NOT_SUPPORTED',
			{ fieldtype }
		);
		this.name = 'CustomFieldTypeNotSupportedError';
	}
}

/**
 * Error thrown when a custom field operation fails
 */
export class CustomFieldOperationError extends CustomFieldError {
	/**
	 * Create a new CustomFieldOperationError
	 * @param operation The operation that failed
	 * @param reason Reason why the operation failed
	 * @param details Additional error details
	 */
	constructor(operation: string, reason: string, details?: Record<string, any>) {
		super(
			`Custom field operation '${operation}' failed: ${reason}`,
			'CUSTOM_FIELD_OPERATION_ERROR',
			{ operation, reason, ...details }
		);
		this.name = 'CustomFieldOperationError';
	}
}

/**
 * Error thrown when a custom field database operation fails
 */
export class CustomFieldDatabaseError extends CustomFieldError {
	/**
	 * Create a new CustomFieldDatabaseError
	 * @param operation The database operation that failed
	 * @param reason Reason why the operation failed
	 * @param details Additional error details
	 */
	constructor(operation: string, reason: string, details?: Record<string, any>) {
		super(
			`Custom field database operation '${operation}' failed: ${reason}`,
			'CUSTOM_FIELD_DATABASE_ERROR',
			{ operation, reason, ...details }
		);
		this.name = 'CustomFieldDatabaseError';
	}
}

/**
 * Error thrown when a custom field cache operation fails
 */
export class CustomFieldCacheError extends CustomFieldError {
	/**
	 * Create a new CustomFieldCacheError
	 * @param operation The cache operation that failed
	 * @param reason Reason why the operation failed
	 * @param details Additional error details
	 */
	constructor(operation: string, reason: string, details?: Record<string, any>) {
		super(
			`Custom field cache operation '${operation}' failed: ${reason}`,
			'CUSTOM_FIELD_CACHE_ERROR',
			{ operation, reason, ...details }
		);
		this.name = 'CustomFieldCacheError';
	}
}

/**
 * Error thrown when a custom field configuration is invalid
 */
export class CustomFieldConfigurationError extends CustomFieldError {
	/**
	 * Create a new CustomFieldConfigurationError
	 * @param configuration The configuration that is invalid
	 * @param reason Reason why the configuration is invalid
	 * @param details Additional error details
	 */
	constructor(configuration: string, reason: string, details?: Record<string, any>) {
		super(
			`Custom field configuration '${configuration}' is invalid: ${reason}`,
			'CUSTOM_FIELD_CONFIGURATION_ERROR',
			{ configuration, reason, ...details }
		);
		this.name = 'CustomFieldConfigurationError';
	}
}

/**
 * Error thrown when a custom field migration fails
 */
export class CustomFieldMigrationError extends CustomFieldError {
	/**
	 * Create a new CustomFieldMigrationError
	 * @param operation The migration operation that failed
	 * @param reason Reason why the migration failed
	 * @param details Additional error details
	 */
	constructor(operation: string, reason: string, details?: Record<string, any>) {
		super(
			`Custom field migration operation '${operation}' failed: ${reason}`,
			'CUSTOM_FIELD_MIGRATION_ERROR',
			{ operation, reason, ...details }
		);
		this.name = 'CustomFieldMigrationError';
	}
}

/**
 * Error thrown when a custom field API operation fails
 */
export class CustomFieldApiError extends CustomFieldError {
	/**
	 * Create a new CustomFieldApiError
	 * @param operation The API operation that failed
	 * @param reason Reason why the API operation failed
	 * @param details Additional error details
	 */
	constructor(operation: string, reason: string, details?: Record<string, any>) {
		super(
			`Custom field API operation '${operation}' failed: ${reason}`,
			'CUSTOM_FIELD_API_ERROR',
			{ operation, reason, ...details }
		);
		this.name = 'CustomFieldApiError';
	}
}

/**
 * Validation result interface
 */
export interface ValidationResult {
	/** Whether the validation passed */
	valid: boolean;
	
	/** Array of validation errors */
	errors: string[];
	
	/** Array of validation warnings */
	warnings: string[];
}

/**
 * Create a validation result
 * @param valid Whether the validation passed
 * @param errors Array of validation errors
 * @param warnings Array of validation warnings
 * @returns ValidationResult
 */
export function createValidationResult(
	valid: boolean,
	errors: string[] = [],
	warnings: string[] = []
): ValidationResult {
	return { valid, errors, warnings };
}

/**
 * Create a successful validation result
 * @param warnings Array of validation warnings
 * @returns ValidationResult
 */
export function createSuccessValidationResult(warnings: string[] = []): ValidationResult {
	return { valid: true, errors: [], warnings };
}

/**
 * Create a failed validation result
 * @param errors Array of validation errors
 * @param warnings Array of validation warnings
 * @returns ValidationResult
 */
export function createFailureValidationResult(
	errors: string[],
	warnings: string[] = []
): ValidationResult {
	return { valid: false, errors, warnings };
}