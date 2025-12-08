/**
 * Virtual DocType Error Classes
 * 
 * This module defines custom error classes for Virtual DocType operations,
 * providing specific error handling and debugging information.
 */

// =============================================================================
// Base Virtual DocType Error
// =============================================================================

/**
 * Base error class for all Virtual DocType related errors
 */
export class VirtualDocTypeError extends Error {
	/** Error code for identification */
	public readonly code: string;

	/** Virtual DocType name */
	public readonly doctypeName?: string;

	/** Source of the error */
	public readonly source?: string;

	/** Additional error context */
	public readonly context?: Record<string, any>;

	/** Original error that caused this error */
	public readonly originalError?: Error;

	/**
	 * Create a new VirtualDocTypeError
	 * @param message Error message
	 * @param code Error code
	 * @param doctypeName Name of the Virtual DocType
	 * @param source Source of the error
	 * @param context Additional error context
	 * @param originalError Original error that caused this error
	 */
	constructor(
		message: string,
		code: string,
		doctypeName?: string,
		source?: string,
		context?: Record<string, any>,
		originalError?: Error
	) {
		super(message);
		this.name = 'VirtualDocTypeError';
		this.code = code;
		this.doctypeName = doctypeName;
		this.source = source;
		this.context = context;
		this.originalError = originalError;

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, VirtualDocTypeError);
		}
	}

	/**
	 * Get error details as object
	 * @returns Error details
	 */
	public getDetails(): Record<string, any> {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			doctypeName: this.doctypeName,
			source: this.source,
			context: this.context,
			stack: this.stack,
			originalError: this.originalError ? {
				name: this.originalError.name,
				message: this.originalError.message,
				stack: this.originalError.stack
			} : undefined
		};
	}

	/**
	 * Convert error to JSON string
	 * @returns JSON string representation
	 */
	public toJSON(): string {
		return JSON.stringify(this.getDetails(), null, 2);
	}
}

// =============================================================================
// Configuration Errors
// =============================================================================

/**
 * Error thrown when Virtual DocType configuration is invalid
 */
export class VirtualConfigError extends VirtualDocTypeError {
	/** Configuration validation errors */
	public readonly validationErrors: string[];

	/**
	 * Create a new VirtualConfigError
	 * @param message Error message
	 * @param doctypeName Name of the Virtual DocType
	 * @param validationErrors Array of validation error messages
	 * @param context Additional error context
	 */
	constructor(
		message: string,
		doctypeName?: string,
		validationErrors: string[] = [],
		context?: Record<string, any>
	) {
		super(
			message,
			'VIRTUAL_CONFIG_ERROR',
			doctypeName,
			'configuration',
			{ ...context, validationErrors },
			undefined
		);
		this.name = 'VirtualConfigError';
		this.validationErrors = validationErrors;
	}
}

/**
 * Error thrown when required configuration is missing
 */
export class VirtualMissingConfigError extends VirtualConfigError {
	/** Missing configuration keys */
	public readonly missingKeys: string[];

	/**
	 * Create a new VirtualMissingConfigError
	 * @param doctypeName Name of the Virtual DocType
	 * @param missingKeys Array of missing configuration keys
	 * @param context Additional error context
	 */
	constructor(
		doctypeName: string,
		missingKeys: string[],
		context?: Record<string, any>
	) {
		const message = `Missing required configuration: ${missingKeys.join(', ')}`;
		super(message, doctypeName, [message], context);
		this.name = 'VirtualMissingConfigError';
		this.missingKeys = missingKeys;
	}
}

// =============================================================================
// Connection Errors
// =============================================================================

/**
 * Error thrown when connection to source fails
 */
export class VirtualConnectionError extends VirtualDocTypeError {
	/** Connection attempt count */
	public readonly attemptCount: number;

	/** Total timeout in milliseconds */
	public readonly timeout: number;

	/**
	 * Create a new VirtualConnectionError
	 * @param message Error message
	 * @param doctypeName Name of the Virtual DocType
	 * @param source Source of the error
	 * @param attemptCount Number of connection attempts
	 * @param timeout Total timeout in milliseconds
	 * @param originalError Original error that caused this error
	 * @param context Additional error context
	 * @param code Error code
	 */
	constructor(
		message: string,
		doctypeName?: string,
		source?: string,
		attemptCount: number = 1,
		timeout: number = 0,
		originalError?: Error,
		context?: Record<string, any>,
		code: string = 'VIRTUAL_CONNECTION_ERROR'
	) {
		super(
			message,
			code,
			doctypeName,
			source,
			{ ...context, attemptCount, timeout },
			originalError
		);
		this.name = 'VirtualConnectionError';
		this.attemptCount = attemptCount;
		this.timeout = timeout;
	}
}

/**
 * Error thrown when authentication fails
 */
export class VirtualAuthenticationError extends VirtualConnectionError {
	/** Authentication type */
	public readonly authType: string;

	/**
	 * Create a new VirtualAuthenticationError
	 * @param message Error message
	 * @param doctypeName Name of the Virtual DocType
	 * @param authType Authentication type that failed
	 * @param source Source of the error
	 * @param originalError Original error that caused this error
	 * @param context Additional error context
	 */
	constructor(
		message: string,
		doctypeName?: string,
		authType: string = 'unknown',
		source?: string,
		originalError?: Error,
		context?: Record<string, any>
	) {
		super(
			message,
			doctypeName,
			source,
			1,
			0,
			originalError,
			{ ...context, authType },
			'VIRTUAL_AUTH_ERROR'
		);
		this.name = 'VirtualAuthenticationError';
		this.authType = authType;
	}
}

// =============================================================================
// Data Errors
// =============================================================================

/**
 * Error thrown when data fetching fails
 */
export class VirtualDataError extends VirtualDocTypeError {
	/** Query options that caused the error */
	public readonly queryOptions?: Record<string, any>;

	/** Data source that failed */
	public readonly dataSource?: string;

	/**
	 * Create a new VirtualDataError
	 * @param message Error message
	 * @param doctypeName Name of the Virtual DocType
	 * @param dataSource Data source that failed
	 * @param queryOptions Query options that caused the error
	 * @param originalError Original error that caused this error
	 * @param context Additional error context
	 */
	constructor(
		message: string,
		doctypeName?: string,
		dataSource?: string,
		queryOptions?: Record<string, any>,
		originalError?: Error,
		context?: Record<string, any>
	) {
		super(
			message,
			'VIRTUAL_DATA_ERROR',
			doctypeName,
			dataSource,
			{ ...context, queryOptions },
			originalError
		);
		this.name = 'VirtualDataError';
		this.queryOptions = queryOptions;
		this.dataSource = dataSource;
	}
}

/**
 * Error thrown when data parsing fails
 */
export class VirtualParseError extends VirtualDataError {
	/** Data format that failed to parse */
	public readonly dataFormat: string;

	/** Raw data that failed to parse */
	public readonly rawData?: string;

	/**
	 * Create a new VirtualParseError
	 * @param message Error message
	 * @param doctypeName Name of the Virtual DocType
	 * @param dataFormat Data format that failed to parse
	 * @param rawData Raw data that failed to parse
	 * @param originalError Original error that caused this error
	 * @param context Additional error context
	 */
	constructor(
		message: string,
		doctypeName?: string,
		dataFormat: string = 'unknown',
		rawData?: string,
		originalError?: Error,
		context?: Record<string, any>
	) {
		super(
			message,
			doctypeName,
			'parser',
			undefined,
			originalError,
			{ ...context, dataFormat, rawData }
		);
		this.name = 'VirtualParseError';
		this.dataFormat = dataFormat;
		this.rawData = rawData;
	}
}

/**
 * Error thrown when data validation fails
 */
export class VirtualValidationError extends VirtualDataError {
	/** Validation errors */
	public readonly validationErrors: Record<string, string[]>;

	/** Data that failed validation */
	public readonly invalidData?: Record<string, any>;

	/**
	 * Create a new VirtualValidationError
	 * @param message Error message
	 * @param doctypeName Name of the Virtual DocType
	 * @param validationErrors Validation errors by field
	 * @param invalidData Data that failed validation
	 * @param context Additional error context
	 */
	constructor(
		message: string,
		doctypeName?: string,
		validationErrors: Record<string, string[]> = {},
		invalidData?: Record<string, any>,
		context?: Record<string, any>
	) {
		super(
			message,
			doctypeName,
			'validator',
			undefined,
			undefined,
			{ ...context, validationErrors, invalidData }
		);
		this.name = 'VirtualValidationError';
		this.validationErrors = validationErrors;
		this.invalidData = invalidData;
	}
}

// =============================================================================
// Cache Errors
// =============================================================================

/**
 * Error thrown when cache operations fail
 */
export class VirtualCacheError extends VirtualDocTypeError {
	/** Cache operation that failed */
	public readonly operation: string;

	/** Cache key */
	public readonly cacheKey?: string;

	/**
	 * Create a new VirtualCacheError
	 * @param message Error message
	 * @param doctypeName Name of the Virtual DocType
	 * @param operation Cache operation that failed
	 * @param cacheKey Cache key
	 * @param originalError Original error that caused this error
	 * @param context Additional error context
	 */
	constructor(
		message: string,
		doctypeName?: string,
		operation: string = 'unknown',
		cacheKey?: string,
		originalError?: Error,
		context?: Record<string, any>
	) {
		super(
			message,
			'VIRTUAL_CACHE_ERROR',
			doctypeName,
			'cache',
			{ ...context, operation, cacheKey },
			originalError
		);
		this.name = 'VirtualCacheError';
		this.operation = operation;
		this.cacheKey = cacheKey;
	}
}

// =============================================================================
// Controller Errors
// =============================================================================

/**
 * Error thrown when controller operations fail
 */
export class VirtualControllerError extends VirtualDocTypeError {
	/** Controller type */
	public readonly controllerType: string;

	/** Operation that failed */
	public readonly operation: string;

	/**
	 * Create a new VirtualControllerError
	 * @param message Error message
	 * @param doctypeName Name of the Virtual DocType
	 * @param controllerType Type of controller
	 * @param operation Operation that failed
	 * @param originalError Original error that caused this error
	 * @param context Additional error context
	 */
	constructor(
		message: string,
		doctypeName?: string,
		controllerType: string = 'unknown',
		operation: string = 'unknown',
		originalError?: Error,
		context?: Record<string, any>
	) {
		super(
			message,
			'VIRTUAL_CONTROLLER_ERROR',
			doctypeName,
			controllerType,
			{ ...context, operation },
			originalError
		);
		this.name = 'VirtualControllerError';
		this.controllerType = controllerType;
		this.operation = operation;
	}
}

/**
 * Error thrown when controller is not found
 */
export class VirtualControllerNotFoundError extends VirtualControllerError {
	/**
	 * Create a new VirtualControllerNotFoundError
	 * @param doctypeName Name of the Virtual DocType
	 * @param controllerType Type of controller that was not found
	 * @param context Additional error context
	 */
	constructor(
		doctypeName: string,
		controllerType: string = 'unknown',
		context?: Record<string, any>
	) {
		const message = `Controller not found for Virtual DocType '${doctypeName}' of type '${controllerType}'`;
		super(
			message,
			doctypeName,
			controllerType,
			'get_controller',
			undefined,
			context
		);
		this.name = 'VirtualControllerNotFoundError';
	}
}

// =============================================================================
// Manager Errors
// =============================================================================

/**
 * Error thrown when Virtual DocType manager operations fail
 */
export class VirtualManagerError extends VirtualDocTypeError {
	/** Operation that failed */
	public readonly operation: string;

	/**
	 * Create a new VirtualManagerError
	 * @param message Error message
	 * @param doctypeName Name of the Virtual DocType
	 * @param operation Operation that failed
	 * @param originalError Original error that caused this error
	 * @param context Additional error context
	 */
	constructor(
		message: string,
		doctypeName?: string,
		operation: string = 'unknown',
		originalError?: Error,
		context?: Record<string, any>
	) {
		super(
			message,
			'VIRTUAL_MANAGER_ERROR',
			doctypeName,
			'manager',
			{ ...context, operation },
			originalError
		);
		this.name = 'VirtualManagerError';
		this.operation = operation;
	}
}

/**
 * Error thrown when Virtual DocType is not found
 */
export class VirtualDocTypeNotFoundError extends VirtualManagerError {
	/**
	 * Create a new VirtualDocTypeNotFoundError
	 * @param doctypeName Name of the Virtual DocType that was not found
	 * @param context Additional error context
	 */
	constructor(
		doctypeName: string,
		context?: Record<string, any>
	) {
		const message = `Virtual DocType '${doctypeName}' not found`;
		super(
			message,
			doctypeName,
			'get_doctype',
			undefined,
			context
		);
		this.name = 'VirtualDocTypeNotFoundError';
	}
}

/**
 * Error thrown when Virtual DocType already exists
 */
export class VirtualDocTypeExistsError extends VirtualManagerError {
	/**
	 * Create a new VirtualDocTypeExistsError
	 * @param doctypeName Name of the Virtual DocType that already exists
	 * @param context Additional error context
	 */
	constructor(
		doctypeName: string,
		context?: Record<string, any>
	) {
		const message = `Virtual DocType '${doctypeName}' already exists`;
		super(
			message,
			doctypeName,
			'register_doctype',
			undefined,
			context
		);
		this.name = 'VirtualDocTypeExistsError';
	}
}

// =============================================================================
// Error Factory
// =============================================================================

/**
 * Factory class for creating Virtual DocType errors
 */
export class VirtualErrorFactory {
	/**
	 * Create appropriate error based on error type and context
	 * @param errorType Type of error to create
	 * @param message Error message
	 * @param doctypeName Name of the Virtual DocType
	 * @param context Additional error context
	 * @param originalError Original error that caused this error
	 * @returns Appropriate Virtual DocType error instance
	 */
	static createError(
		errorType: string,
		message: string,
		doctypeName?: string,
		context?: Record<string, any>,
		originalError?: Error
	): VirtualDocTypeError {
		switch (errorType) {
			case 'config':
				return new VirtualConfigError(message, doctypeName, [], context);
			case 'connection':
				return new VirtualConnectionError(message, doctypeName, 'unknown', 1, 0, originalError, context);
			case 'auth':
				return new VirtualAuthenticationError(message, doctypeName, 'unknown', 'unknown', originalError, context);
			case 'data':
				return new VirtualDataError(message, doctypeName, 'unknown', undefined, originalError, context);
			case 'parse':
				return new VirtualParseError(message, doctypeName, 'unknown', undefined, originalError, context);
			case 'validation':
				return new VirtualValidationError(message, doctypeName, {}, undefined, context);
			case 'cache':
				return new VirtualCacheError(message, doctypeName, 'unknown', undefined, originalError, context);
			case 'controller':
				return new VirtualControllerError(message, doctypeName, 'unknown', 'unknown', originalError, context);
			case 'manager':
				return new VirtualManagerError(message, doctypeName, 'unknown', originalError, context);
			default:
				return new VirtualDocTypeError(message, 'VIRTUAL_UNKNOWN_ERROR', doctypeName, 'unknown', context, originalError);
		}
	}

	/**
	 * Wrap a generic error in a Virtual DocType error
	 * @param error Original error to wrap
	 * @param doctypeName Name of the Virtual DocType
	 * @param source Source of the error
	 * @param context Additional error context
	 * @returns Wrapped Virtual DocType error
	 */
	static wrapError(
		error: Error,
		doctypeName?: string,
		source?: string,
		context?: Record<string, any>
	): VirtualDocTypeError {
		if (error instanceof VirtualDocTypeError) {
			return error;
		}

		return new VirtualDocTypeError(
			error.message,
			'VIRTUAL_WRAPPED_ERROR',
			doctypeName,
			source,
			context,
			error
		);
	}
}

// =============================================================================
// Error Utilities
// =============================================================================

/**
 * Check if an error is a Virtual DocType error
 * @param error Error to check
 * @returns True if error is a Virtual DocType error
 */
export function isVirtualError(error: Error): error is VirtualDocTypeError {
	return error instanceof VirtualDocTypeError;
}

/**
 * Check if an error is a specific Virtual DocType error type
 * @param error Error to check
 * @param errorType Expected error type
 * @returns True if error is of the expected type
 */
export function isVirtualErrorType<T extends VirtualDocTypeError>(
	error: Error,
	errorType: new (...args: any[]) => T
): error is T {
	return error instanceof errorType;
}

/**
 * Extract error details from any error
 * @param error Error to extract details from
 * @returns Error details object
 */
export function getErrorDetails(error: Error): Record<string, any> {
	if (isVirtualError(error)) {
		return error.getDetails();
	}

	return {
		name: error.name,
		message: error.message,
		stack: error.stack
	};
}