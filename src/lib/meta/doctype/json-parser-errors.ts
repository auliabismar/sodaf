/**
 * DocType JSON Parser Error Classes
 * 
 * This module defines all error classes specific to JSON parsing operations
 * for DocType definitions, extending the base DocTypeError hierarchy.
 */

import { DocTypeError } from './errors';

/**
 * Error thrown when JSON parsing fails due to syntax issues
 */
export class JSONParseError extends DocTypeError {
	constructor(
		message: string,
		public readonly position?: number,
		public readonly line?: number,
		public readonly column?: number,
		public readonly source?: string
	) {
		super(message);
		this.name = 'JSONParseError';
	}

	/**
	 * Create a JSONParseError from a native SyntaxError
	 */
	static fromNativeError(error: SyntaxError, jsonString: string): JSONParseError {
		const message = error.message.replace(/JSON Parse error: /, '');
		
		// Try to extract line and column information
		const lineMatch = message.match(/line (\d+)/i);
		const columnMatch = message.match(/column (\d+)/i);
		const positionMatch = message.match(/position (\d+)/i);
		
		const line = lineMatch ? parseInt(lineMatch[1]) : undefined;
		const column = columnMatch ? parseInt(columnMatch[1]) : undefined;
		const position = positionMatch ? parseInt(positionMatch[1]) : undefined;
		
		return new JSONParseError(
			`Invalid JSON syntax: ${message}`,
			position,
			line,
			column,
			jsonString
		);
	}
}

/**
 * Error thrown when file or directory is not found
 */
export class FileNotFoundError extends DocTypeError {
	constructor(
		public readonly filePath: string,
		public readonly type: 'file' | 'directory' = 'file'
	) {
		super(`${type === 'file' ? 'File' : 'Directory'} not found: ${filePath}`);
		this.name = 'FileNotFoundError';
	}
}

/**
 * Error thrown when file I/O operations fail
 */
export class FileIOError extends DocTypeError {
	constructor(
		message: string,
		public readonly filePath: string,
		public readonly operation: 'read' | 'write' | 'create' | 'delete',
		public readonly originalError?: Error
	) {
		super(message);
		this.name = 'FileIOError';
	}

	/**
	 * Create a FileIOError from a native file system error
	 */
	static fromNativeError(
		error: Error,
		filePath: string,
		operation: 'read' | 'write' | 'create' | 'delete'
	): FileIOError {
		const code = (error as any).code;
		let message = `File ${operation} operation failed: ${error.message}`;
		
		// Add more descriptive messages for common error codes
		switch (code) {
			case 'EACCES':
				message = `Permission denied when ${operation}ing file: ${filePath}`;
				break;
			case 'EEXIST':
				message = `File already exists: ${filePath}`;
				break;
			case 'ENOENT':
				message = `File not found: ${filePath}`;
				break;
			case 'ENOSPC':
				message = `No space left on device when writing to: ${filePath}`;
				break;
			case 'EROFS':
				message = `Read-only file system, cannot write to: ${filePath}`;
				break;
		}
		
		return new FileIOError(message, filePath, operation, error);
	}
}

/**
 * Error thrown when DocType serialization fails
 */
export class SerializationError extends DocTypeError {
	constructor(
		message: string,
		public readonly doctypeName?: string,
		public readonly propertyPath?: string,
		public readonly originalError?: Error
	) {
		super(message);
		this.name = 'SerializationError';
	}

	/**
	 * Create a SerializationError for circular reference detection
	 */
	static fromCircularReference(doctypeName: string, propertyPath: string): SerializationError {
		return new SerializationError(
			`Circular reference detected in DocType '${doctypeName}' at '${propertyPath}'`,
			doctypeName,
			propertyPath
		);
	}

	/**
	 * Create a SerializationError for non-serializable values
	 */
	static fromNonSerializableValue(
		doctypeName: string,
		propertyPath: string,
		value: any
	): SerializationError {
		const valueType = typeof value;
		const valueString = valueType === 'object' ? 
			(value?.constructor?.name || 'Object') : 
			String(value);
			
		return new SerializationError(
			`Non-serializable value '${valueString}' (${valueType}) found in DocType '${doctypeName}' at '${propertyPath}'`,
			doctypeName,
			propertyPath
		);
	}
}