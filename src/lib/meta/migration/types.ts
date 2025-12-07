/**
 * Migration Types and Interfaces
 * 
 * This file defines comprehensive TypeScript interfaces for schema migration, diffs,
 * and history tracking in the SODAF framework.
 */

import type { DocType, DocField, DocIndex } from '../doctype/types';
import type { TableInfo, ColumnInfo, IndexInfo } from '../../core/database/types';

// Export all types will be done at the end of the file

/**
 * Represents the difference between expected schema (DocType) and actual database schema
 */
export interface SchemaDiff {
	/** Columns that need to be added to the database */
	addedColumns: ColumnChange[];
	
	/** Columns that need to be removed from the database */
	removedColumns: ColumnChange[];
	
	/** Columns that have been modified (type, length, constraints, etc.) */
	modifiedColumns: FieldChange[];
	
	/** Indexes that need to be added to the database */
	addedIndexes: IndexChange[];
	
	/** Indexes that need to be removed from the database */
	removedIndexes: IndexChange[];
	
	/** Columns that have been renamed */
	renamedColumns: ColumnRename[];
}

/**
 * Represents a column addition or removal
 */
export interface ColumnChange {
	/** Column name */
	fieldname: string;
	
	/** Column definition */
	column: ColumnDefinition;
	
	/** Whether this change is destructive (data loss possible) */
	destructive: boolean;
}

/**
 * Represents a column rename operation
 */
export interface ColumnRename {
	/** Original column name */
	from: string;
	
	/** New column name */
	to: string;
	
	/** Column definition */
	column: ColumnDefinition;
}

/**
 * Represents detailed field changes between schema versions
 */
export interface FieldChange {
	/** Field name */
	fieldname: string;
	
	/** Detailed changes for this field */
	changes: {
		/** Type change (Data → Int, etc.) */
		type?: { from: string; to: string };
		
		/** Length change for text fields */
		length?: { from: number; to: number };
		
		/** Required constraint change */
		required?: { from: boolean; to: boolean };
		
		/** Unique constraint change */
		unique?: { from: boolean; to: boolean };
		
		/** Default value change */
		default?: { from: any; to: any };
		
		/** Precision change for numeric fields */
		precision?: { from: number; to: number };
		
		/** Nullable constraint change */
		nullable?: { from: boolean; to: boolean };
	};
	
	/** Whether this change requires data migration/conversion */
	requiresDataMigration: boolean;
	
	/** Whether this change is potentially destructive */
	destructive: boolean;
}

/**
 * Represents an index addition or removal
 */
export interface IndexChange {
	/** Index name */
	name: string;
	
	/** Index definition */
	index: IndexDefinition;
	
	/** Whether this change is destructive */
	destructive: boolean;
}

/**
 * Complete column definition for migration operations
 */
export interface ColumnDefinition {
	/** Column name */
	name: string;
	
	/** Data type */
	type: string;
	
	/** Whether column can be null */
	nullable: boolean;
	
	/** Default value */
	default_value?: any;
	
	/** Whether column is part of primary key */
	primary_key: boolean;
	
	/** Whether column is auto-incrementing */
	auto_increment: boolean;
	
	/** Whether column is unique */
	unique: boolean;
	
	/** Maximum length for text fields */
	length?: number;
	
	/** Number of decimal places for numeric fields */
	precision?: number;
	
	/** Foreign key constraints */
	foreign_key?: ForeignKeyDefinition;
	
	/** Check constraints */
	check?: string;
	
	/** Collation for text fields */
	collation?: string;
}

/**
 * Complete index definition for migration operations
 */
export interface IndexDefinition {
	/** Index name */
	name: string;
	
	/** Indexed columns */
	columns: string[];
	
	/** Whether index is unique */
	unique: boolean;
	
	/** Index type (btree, hash, etc.) */
	type?: string;
	
	/** WHERE clause for partial index */
	where?: string;
	
	/** Sort order for each column (ASC/DESC) */
	order?: ('ASC' | 'DESC')[];
	
	/** Collation for each column */
	collation?: string[];
}

/**
 * Foreign key definition
 */
export interface ForeignKeyDefinition {
	/** Referenced table */
	referenced_table: string;
	
	/** Referenced column */
	referenced_column: string;
	
	/** Action on delete */
	on_delete: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';
	
	/** Action on update */
	on_update: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';
}

/**
 * Represents a complete migration operation
 */
export interface Migration {
	/** Unique migration identifier */
	id: string;
	
	/** Target DocType name */
	doctype: string;
	
	/** Migration creation timestamp */
	timestamp: Date;
	
	/** Schema differences this migration addresses */
	diff: SchemaDiff;
	
	/** Forward migration SQL statements */
	sql: string | string[];
	
	/** Rollback migration SQL statements */
	rollbackSql: string | string[];
	
	/** Whether migration has been applied */
	applied: boolean;
	
	/** Error message if migration failed */
	error?: string;
	
	/** Migration version */
	version: string;
	
	/** Human-readable description */
	description?: string;
	
	/** Whether migration is potentially destructive */
	destructive: boolean;
	
	/** Whether migration requires data backup */
	requiresBackup: boolean;
	
	/** Estimated execution time in seconds */
	estimatedTime?: number;
	
	/** Migration metadata */
	metadata?: Record<string, any>;
}

/**
 * Migration execution options
 */
export interface MigrationOptions {
	/** Perform dry run without executing changes */
	dryRun?: boolean;
	
	/** Force migration even if potentially destructive */
	force?: boolean;
	
	/** Preserve data during destructive operations */
	preserveData?: boolean;
	
	/** Create backup before migration */
	backup?: boolean;
	
	/** Continue on error instead of rolling back */
	continueOnError?: boolean;
	
	/** Batch size for large data migrations */
	batchSize?: number;
	
	/** Timeout for migration execution in seconds */
	timeout?: number;
	
	/** Whether to validate data after migration */
	validateData?: boolean;
	
	/** Custom migration context */
	context?: Record<string, any>;
}

/**
 * Result of a migration operation
 */
export interface MigrationResult {
	/** Whether migration was successful */
	success: boolean;
	
	/** SQL statements that were executed or would be executed */
	sql: string[];
	
	/** Warnings generated during migration */
	warnings: string[];
	
	/** Errors encountered during migration */
	errors: string[];
	
	/** Number of rows affected */
	affectedRows?: number;
	
	/** Migration execution time in milliseconds */
	executionTime?: number;
	
	/** Backup file path if backup was created */
	backupPath?: string;
	
	/** Additional result metadata */
	metadata?: Record<string, any>;
}

/**
 * Complete migration history for a system
 */
export interface MigrationHistory {
	/** All migrations in chronological order */
	migrations: Migration[];
	
	/** Last successfully applied migration */
	lastMigration?: Migration;
	
	/** Migrations that have not been applied yet */
	pendingMigrations: Migration[];
	
	/** Migrations that failed to apply */
	failedMigrations: Migration[];
	
	/** Migration statistics */
	stats: MigrationStats;
}

/**
 * Migration statistics
 */
export interface MigrationStats {
	/** Total number of migrations */
	total: number;
	
	/** Number of applied migrations */
	applied: number;
	
	/** Number of pending migrations */
	pending: number;
	
	/** Number of failed migrations */
	failed: number;
	
	/** Number of destructive migrations */
	destructive: number;
	
	/** Date of last migration */
	lastMigrationDate?: Date;
	
	/** Total migration execution time */
	totalExecutionTime: number;
}

/**
 * Migration validation result
 */
export interface MigrationValidation {
	/** Whether migration is valid */
	valid: boolean;
	
	/** Validation errors */
	errors: ValidationError[];
	
	/** Validation warnings */
	warnings: ValidationWarning[];
	
	/** Recommended actions */
	recommendations: string[];
}

/**
 * Migration validation error
 */
export interface ValidationError {
	/** Error code */
	code: string;
	
	/** Error message */
	message: string;
	
	/** Related field or table */
	field?: string;
	
	/** Error severity */
	severity: 'error' | 'warning' | 'info';
	
	/** Suggested fix */
	suggestion?: string;
}

/**
 * Migration validation warning
 */
export interface ValidationWarning {
	/** Warning code */
	code: string;
	
	/** Warning message */
	message: string;
	
	/** Related field or table */
	field?: string;
	
	/** Warning type */
	type: 'data_loss' | 'performance' | 'compatibility' | 'other';
}

/**
 * SQLite-specific migration operations
 */
export interface SQLiteMigrationOperation {
	/** Operation type */
	type: 'create_table' | 'alter_table' | 'drop_table' | 'rebuild_table';
	
	/** Target table name */
	table: string;
	
	/** Operation details */
	details: {
		/** Temporary table name for rebuild operations */
		tempTable?: string;
		
		/** Columns to include in rebuilt table */
		columns?: string[];
		
		/** Data preservation strategy */
		preserveData?: boolean;
		
		/** Index recreation strategy */
		recreateIndexes?: boolean;
		
		/** Foreign key handling */
		handleForeignKeys?: 'drop' | 'preserve' | 'recreate';
	};
}

/**
 * SQLite table rebuild strategy
 */
export interface TableRebuildStrategy {
	/** Whether to create temporary table */
	useTempTable: boolean;
	
	/** Temporary table naming pattern */
	tempTablePattern: string;
	
	/** Data copying strategy */
	copyStrategy: 'batch' | 'single' | 'cursor';
	
	/** Batch size for large tables */
	batchSize?: number;
	
	/** Whether to drop original table after successful migration */
	dropOriginal: boolean;
	
	/** Whether to verify data after migration */
	verifyData: boolean;
}

/**
 * SQLite constraint handling
 */
export interface SQLiteConstraintHandling {
	/** How to handle NOT NULL constraints on existing data */
	notNullStrategy: 'add_with_default' | 'update_existing' | 'skip';
	
	/** How to handle UNIQUE constraints on existing data */
	uniqueStrategy: 'drop_duplicates' | 'fail' | 'skip';
	
	/** How to handle FOREIGN KEY constraints */
	foreignKeyStrategy: 'disable' | 'defer' | 'immediate';
	
	/** Default value for new NOT NULL columns */
	defaultForNotNull?: any;
}

/**
 * Migration error with detailed context
 */
export interface MigrationError {
	/** Error code */
	code: string;
	
	/** Error message */
	message: string;
	
	/** Error details */
	details?: any;
	
	/** Related DocType */
	doctype?: string;
	
	/** Related field */
	field?: string;
	
	/** SQL statement that caused the error */
	sql?: string;
	
	/** Stack trace */
	stack?: string;
	
	/** Error severity */
	severity: 'fatal' | 'error' | 'warning';
	
	/** Whether error is recoverable */
	recoverable: boolean;
	
	/** Suggested recovery action */
	recoveryAction?: string;
}

/**
 * Migration error codes
 */
export enum MigrationErrorCode {
	/** Schema validation failed */
	SCHEMA_VALIDATION_FAILED = 'SCHEMA_VALIDATION_FAILED',
	
	/** Table does not exist */
	TABLE_NOT_FOUND = 'TABLE_NOT_FOUND',
	
	/** Column does not exist */
	COLUMN_NOT_FOUND = 'COLUMN_NOT_FOUND',
	
	/** Index does not exist */
	INDEX_NOT_FOUND = 'INDEX_NOT_FOUND',
	
	/** Data type conversion failed */
	TYPE_CONVERSION_FAILED = 'TYPE_CONVERSION_FAILED',
	
	/** Constraint violation */
	CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
	
	/** Foreign key violation */
	FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
	
	/** Data loss risk */
	DATA_LOSS_RISK = 'DATA_LOSS_RISK',
	
	/** Migration timeout */
	MIGRATION_TIMEOUT = 'MIGRATION_TIMEOUT',
	
	/** SQL execution error */
	SQL_EXECUTION_ERROR = 'SQL_EXECUTION_ERROR',
	
	/** Backup creation failed */
	BACKUP_FAILED = 'BACKUP_FAILED',
	
	/** Rollback failed */
	ROLLBACK_FAILED = 'ROLLBACK_FAILED'
}
