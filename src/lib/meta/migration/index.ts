/**
 * Migration Module Public API
 * 
 * This file exports all public types and interfaces from the migration module.
 */

// Export all types
export type {
	SchemaDiff,
	ColumnChange,
	FieldChange,
	IndexChange,
	ColumnRename,
	ColumnDefinition,
	IndexDefinition,
	ForeignKeyDefinition,
	Migration,
	MigrationOptions,
	MigrationResult,
	SQLiteMigrationOperation,
	TableRebuildStrategy,
	SQLiteConstraintHandling,
	MigrationErrorCode,
	MigrationErrorCode as MigrationErrorCodeEnum
} from './types';

// Export schema comparison types
export type {
	SchemaComparisonOptions,
	DiffStatistics,
	SchemaCacheEntry,
	BatchComparisonResult,
	EnhancedSchemaDiff,
	ProgressCallback,
	ColumnRenameDetection,
	SchemaComparisonContext,
	FieldTypeMapping
} from './schema-comparison-types';

// Export schema comparison errors
export {
	SchemaComparisonError,
	DocTypeNotFoundError,
	TableNotFoundError,
	SchemaValidationError,
	FieldComparisonError,
	IndexComparisonError
} from './schema-comparison-errors';

// Export schema comparison engine
export { SchemaComparisonEngine } from './schema-comparison-engine';

// Export SQL generation modules
export { SQLGenerator } from './sql-generator';
export { MigrationWorkflow } from './migration-workflow';

// Export SQL generation submodules
export * from './sql';

// Export apply migration components
export { MigrationApplier } from './apply';
export type {
	ApplyOptions,
	SyncOptions,
	DryRunOptions,
	RollbackOptions,
	BatchMigrationResult,
	DryRunResult,
	AppliedMigration,
	MigrationHistory,
	MigrationStatus,
	RollbackInfo,
	ExecutionEnvironment,
	BackupType,
	BackupOptions,
	BackupInfo,
	RestoreResult,
	ValidationOptions,
	MigrationValidation,
	SchemaValidation,
	SQLValidation,
	RollbackValidation,
	DataLossRisk,
	ValidationError,
	ValidationWarning,
	SchemaError,
	SchemaWarning,
	SQLSyntaxError,
	SQLPerformanceWarning,
	SQLSecurityIssue,
	SQLOptimization,
	RollbackBlocker,
	RollbackRisk,
	RollbackRecommendation,
	ValidationResults,
	ErrorRecoveryStrategy,
	ExecutionOptions,
	ExecutionResult,
	Savepoint,
	TransactionOptions
} from './apply-types';

// Export types from types.ts that are not in apply-types.ts
export type {
	MigrationStats
} from './types';

// Export apply migration managers
export { MigrationHistoryManager } from './history/history-manager';
export { MigrationBackupManager } from './backup/backup-manager';
export { MigrationValidator } from './validation/migration-validator';
export { MigrationExecutor } from './execution/migration-executor';

// Export apply migration errors
export {
	MigrationValidationError,
	MigrationExecutionError,
	MigrationRollbackError,
	DataLossRiskError,
	MigrationTimeoutError,
	MigrationBackupError,
	MigrationRestoreError,
	MigrationDependencyError,
	MigrationConflictError,
	MigrationErrorRecovery
} from './errors/apply-errors';

// Export schema comparison utilities
export { FieldComparator } from './comparators/field-comparator';
export { IndexComparator } from './comparators/index-comparator';
export { SchemaDiffAnalyzer } from './analyzers/diff-analyzer';

// Import types for use in helper functions
import type {
	SchemaDiff,
	ColumnChange,
	FieldChange,
	IndexChange,
	ColumnRename,
	ColumnDefinition,
	IndexDefinition,
	Migration
} from './types';

// Re-export error codes as a const for easier access
export const MigrationErrorCodeValues = {
	SCHEMA_VALIDATION_FAILED: 'SCHEMA_VALIDATION_FAILED',
	TABLE_NOT_FOUND: 'TABLE_NOT_FOUND',
	COLUMN_NOT_FOUND: 'COLUMN_NOT_FOUND',
	INDEX_NOT_FOUND: 'INDEX_NOT_FOUND',
	TYPE_CONVERSION_FAILED: 'TYPE_CONVERSION_FAILED',
	CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
	FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
	DATA_LOSS_RISK: 'DATA_LOSS_RISK',
	MIGRATION_TIMEOUT: 'MIGRATION_TIMEOUT',
	SQL_EXECUTION_ERROR: 'SQL_EXECUTION_ERROR',
	BACKUP_FAILED: 'BACKUP_FAILED',
	ROLLBACK_FAILED: 'ROLLBACK_FAILED'
} as const;

// Type guards for runtime type checking
export function isSchemaDiff(obj: any): obj is SchemaDiff {
	return obj && 
		   Array.isArray(obj.addedColumns) &&
		   Array.isArray(obj.removedColumns) &&
		   Array.isArray(obj.modifiedColumns) &&
		   Array.isArray(obj.addedIndexes) &&
		   Array.isArray(obj.removedIndexes) &&
		   Array.isArray(obj.renamedColumns);
}

export function isMigration(obj: any): obj is Migration {
	return obj &&
		   typeof obj.id === 'string' &&
		   typeof obj.doctype === 'string' &&
		   obj.timestamp instanceof Date &&
		   isSchemaDiff(obj.diff) &&
		   (typeof obj.sql === 'string' || Array.isArray(obj.sql)) &&
		   (typeof obj.rollbackSql === 'string' || Array.isArray(obj.rollbackSql)) &&
		   typeof obj.applied === 'boolean' &&
		   typeof obj.version === 'string' &&
		   typeof obj.destructive === 'boolean' &&
		   typeof obj.requiresBackup === 'boolean';
}

// Helper functions for creating common migration objects
export function createEmptySchemaDiff(): SchemaDiff {
	return {
		addedColumns: [],
		removedColumns: [],
		modifiedColumns: [],
		addedIndexes: [],
		removedIndexes: [],
		renamedColumns: []
	};
}

export function createColumnChange(
	fieldname: string,
	column: ColumnDefinition,
	destructive: boolean = false
): ColumnChange {
	return {
		fieldname,
		column,
		destructive
	};
}

export function createFieldChange(
	fieldname: string,
	changes: FieldChange['changes'],
	requiresDataMigration: boolean = false,
	destructive: boolean = false
): FieldChange {
	return {
		fieldname,
		changes,
		requiresDataMigration,
		destructive
	};
}

export function createIndexChange(
	name: string,
	index: IndexDefinition,
	destructive: boolean = false
): IndexChange {
	return {
		name,
		index,
		destructive
	};
}

export function createColumnRename(
	from: string,
	to: string,
	column: ColumnDefinition
): ColumnRename {
	return {
		from,
		to,
		column
	};
}

export function createMigration(
	id: string,
	doctype: string,
	version: string,
	diff: SchemaDiff,
	sql: string | string[],
	rollbackSql: string | string[],
	options: Partial<Migration> = {}
): Migration {
	return {
		id,
		doctype,
		timestamp: new Date(),
		diff,
		sql,
		rollbackSql,
		applied: false,
		version,
		destructive: false,
		requiresBackup: false,
		...options
	};
}

// Integration helpers with DocType system
import type { DocField, DocIndex } from '../doctype/types';
import type { ColumnInfo, IndexInfo } from '../../core/database/types';

/**
 * Helper function to convert DocField to ColumnDefinition
 */
export function docFieldToColumnDefinition(field: DocField): ColumnDefinition {
	return {
		name: field.fieldname,
		type: mapFieldTypeToSQLiteType(field.fieldtype),
		nullable: !field.required,
		default_value: field.default,
		primary_key: field.fieldname === 'name',
		auto_increment: field.fieldname === 'name',
		unique: field.unique || false,
		length: field.length,
		precision: field.precision
	};
}

/**
 * Helper function to convert ColumnInfo to ColumnDefinition
 */
export function columnInfoToColumnDefinition(info: ColumnInfo): ColumnDefinition {
	return {
		name: info.name,
		type: info.type,
		nullable: info.nullable,
		default_value: info.default_value,
		primary_key: info.primary_key,
		auto_increment: info.auto_increment,
		unique: info.unique
	};
}

/**
 * Helper function to convert DocIndex to IndexDefinition
 */
export function docIndexToIndexDefinition(index: DocIndex): IndexDefinition {
	return {
		name: index.name,
		columns: index.columns,
		unique: index.unique || false,
		type: index.type,
		where: index.where
	};
}

/**
 * Helper function to convert IndexInfo to IndexDefinition
 */
export function indexInfoToIndexDefinition(info: IndexInfo): IndexDefinition {
	return {
		name: info.name,
		columns: info.columns,
		unique: info.unique,
		type: info.type
	};
}

/**
 * Maps DocType field types to SQLite data types
 */
function mapFieldTypeToSQLiteType(fieldtype: string): string {
	switch (fieldtype) {
		case 'Data':
		case 'Small Text':
		case 'Long Text':
		case 'Text Editor':
		case 'Code':
		case 'Markdown Editor':
		case 'HTML Editor':
		case 'Select':
		case 'Link':
		case 'Dynamic Link':
		case 'Read Only':
		case 'HTML':
		case 'Password':
		case 'Email':
		case 'Phone':
			return 'text';
			
		case 'Int':
		case 'Check':
			return 'integer';
			
		case 'Float':
		case 'Currency':
		case 'Percent':
			return 'real';
			
		case 'Date':
		case 'Datetime':
		case 'Time':
		case 'Duration':
			return 'text';
			
		case 'Geolocation':
		case 'Attach':
		case 'Attach Image':
		case 'Signature':
		case 'Image':
		case 'Color':
		case 'Rating':
			return 'text';
			
		default:
			return 'text';
	}
}