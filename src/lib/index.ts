/**
 * SODAF Core Library Index
 * 
 * Exports all core modules and utilities.
 */

// Export database module
export * from './core/database';

// Export document module
export * from './core/document';

// Export schema module with explicit re-exports to avoid naming conflicts
export type {
	FieldType as SchemaFieldType,
	DocField as SchemaDocField,
	DocIndex as SchemaDocIndex,
	DocSchema,
	DocPermission as SchemaDocPermission,
	FieldConstraint,
	FieldDisplayOptions,
	FieldCondition,
	FieldValidation,
	FieldOption,
	SchemaValidationResult,
	ValidationWarning,
	SchemaMigration,
	SchemaDiff,
	SchemaExportOptions,
	SchemaImportOptions
} from './core/schema';

export {
	STANDARD_COLUMNS,
	isFieldType,
	isStandardColumn,
	getFieldTypeCategory
} from './core/schema';

// Re-export ValidationError with alias to avoid conflict
export type { ValidationError as SchemaValidationError } from './core/schema';

// Export site module
export * from './core/site';

// Export DocType module with explicit re-exports to avoid naming conflicts
export type {
	DocType,
	DocField,
	DocPerm,
	DocIndex,
	DocTypeAction,
	DocTypeLink,
	FieldType
} from './meta/doctype';

export {
	DocTypeEngine,
	DocTypeValidator,
	DocTypeJSONParser
} from './meta/doctype';

export {
	DocTypeError,
	DocTypeExistsError,
	DocTypeNotFoundError,
	DocTypeValidationError,
	JSONParseError,
	FileNotFoundError,
	FileIOError,
	SerializationError
} from './meta/doctype';

export type { ValidationResult } from './meta/doctype';
export type { ValidationError as DocTypeValidationErrorType } from './meta/doctype';
