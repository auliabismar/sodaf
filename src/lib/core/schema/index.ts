/**
 * Schema Module Index
 * 
 * Exports all schema-related types and utilities.
 */

// Export types
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
	ValidationError,
	ValidationWarning,
	SchemaMigration,
	SchemaDiff,
	SchemaExportOptions,
	SchemaImportOptions
} from './types';

// Export constants and utilities
export {
	STANDARD_COLUMNS,
	isFieldType,
	isStandardColumn,
	getFieldTypeCategory
} from './types';

// Export SchemaManager
export { SchemaManager } from './schema-manager';
export { IndexManager } from './index-manager';