/**
 * SQL Generation Error Classes
 * 
 * Defines specific error types for SQL generation operations.
 */

/**
 * SQL Generation Error
 */
export class SQLGenerationError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly doctype?: string,
		public readonly field?: string,
		public readonly details?: any
	) {
		super(message);
		this.name = 'SQLGenerationError';
	}
}

/**
 * Unsupported Field Type Error
 */
export class UnsupportedFieldTypeError extends SQLGenerationError {
	constructor(fieldType: string) {
		super(`Unsupported field type: ${fieldType}`, 'UNSUPPORTED_FIELD_TYPE', undefined, fieldType);
		this.name = 'UnsupportedFieldTypeError';
	}
}

/**
 * Invalid Constraint Error
 */
export class InvalidConstraintError extends SQLGenerationError {
	constructor(constraint: string, reason: string) {
		super(`Invalid constraint: ${constraint}. Reason: ${reason}`, 'INVALID_CONSTRAINT');
		this.name = 'InvalidConstraintError';
	}
}

/**
 * Table Name Conflict Error
 */
export class TableNameConflictError extends SQLGenerationError {
	constructor(tableName: string) {
		super(`Table name conflict: ${tableName}`, 'TABLE_NAME_CONFLICT', tableName);
		this.name = 'TableNameConflictError';
	}
}

/**
 * Column Name Conflict Error
 */
export class ColumnNameConflictError extends SQLGenerationError {
	constructor(columnName: string, tableName?: string) {
		super(`Column name conflict: ${columnName}`, 'COLUMN_NAME_CONFLICT', tableName, columnName);
		this.name = 'ColumnNameConflictError';
	}
}

/**
 * Layout Field Error
 */
export class LayoutFieldError extends SQLGenerationError {
	constructor(fieldType: string) {
		super(`Layout field type does not create database column: ${fieldType}`, 'LAYOUT_FIELD', undefined, fieldType);
		this.name = 'LayoutFieldError';
	}
}

/**
 * Migration Error
 */
export class MigrationError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly doctype?: string,
		public readonly field?: string,
		public readonly details?: any
	) {
		super(message);
		this.name = 'MigrationError';
	}
}

/**
 * Migration Error Code enumeration
 */
export const MigrationErrorCode = {
	SCHEMA_VALIDATION_FAILED: 'SCHEMA_VALIDATION_FAILED',
	TABLE_NOT_FOUND: 'TABLE_NOT_FOUND',
	COLUMN_NOT_FOUND: 'COLUMN_NOT_FOUND',
	INDEX_NOT_FOUND: 'INDEX_NOT_FOUND',
	TYPE_CONVERSION_FAILED: 'TYPE_CONVERSION_FAILED',
	CONSTRAINT_VALIDATION: 'CONSTRAINT_VALIDATION',
	FOREIGN_KEY_VALIDATION: 'FOREIGN_KEY_VALIDATION',
	DATA_LOSS_RISK: 'DATA_LOSS_RISK',
	MIGRATION_TIMEOUT: 'MIGRATION_TIMEOUT',
	SQL_EXECUTION_ERROR: 'SQL_EXECUTION_ERROR',
	BACKUP_FAILED: 'BACKUP_FAILED',
	ROLLBACK_FAILED: 'ROLLBACK_FAILED'
}

/**
 * Type alias for MigrationErrorCode
 */
export type MigrationErrorCode = keyof typeof MigrationErrorCode;