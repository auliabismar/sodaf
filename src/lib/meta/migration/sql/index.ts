/**
 * SQL Generation Module Exports
 * 
 * Exports all SQL generation classes and utilities.
 */

// Core classes
export { FieldTypeMapper } from './field-type-mapper';
export { ConstraintBuilder } from './constraint-builder';
export { IndexBuilder } from './index-builder';
export { TableRebuilder } from './table-rebuilder';
export { RollbackGenerator } from './rollback-generator';
export { SQLFormatter } from './sql-formatter';

// Types and interfaces
export type {
	SQLOptions,
	SQLiteTypeMapping,
	ColumnDefinitionSQL,
	ColumnConstraintsSQL,
	ForeignKeySQL,
	IndexDefinitionSQL,
	IndexColumnSQL,
	TableRebuildStrategy,
	MigrationSQL,
	SQLStatement,
	SQLStatementType,
	MigrationMetadata,
	MigrationOptions
} from './sql-types';

// Error classes
export {
	SQLGenerationError,
	UnsupportedFieldTypeError,
	InvalidConstraintError,
	TableNameConflictError,
	ColumnNameConflictError,
	LayoutFieldError
} from './sql-types';

// Constants
export { DEFAULT_FIELD_TYPE_MAPPINGS } from './field-type-mapper';