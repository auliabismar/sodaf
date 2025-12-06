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
	FieldType,
	DocField,
	DocIndex,
	DocSchema,
	DocPermission,
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
