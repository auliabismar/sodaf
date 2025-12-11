/**
 * SQL Generation Types and Interfaces
 * 
 * This file defines TypeScript interfaces specific to SQL generation operations
 * in the SODAF framework's migration system.
 */

import type { DocType, DocField, DocIndex, FieldType } from '../../doctype/types';
import type { SchemaDiff, FieldChange, ColumnChange, ColumnRename } from '../types';

/**
 * SQL Generation Options
 */
export interface SQLOptions {
	/** Custom field type mappings */
	typeMappings?: Record<string, SQLiteTypeMapping>;

	/** Table naming strategy */
	tableNamingStrategy?: 'snake_case' | 'camelCase' | 'preserve';

	/** Identifier quoting style */
	identifierQuote?: '`' | '"' | '[' | ']';

	/** Whether to include comments in generated SQL */
	includeComments?: boolean;

	/** Whether to format SQL with proper indentation */
	formatSQL?: boolean;

	/** Table rebuild strategy */
	defaultRebuildStrategy?: TableRebuildStrategy;

	/** Foreign key handling during rebuilds */
	foreignKeyStrategy?: 'drop' | 'preserve' | 'recreate';

	/** Maximum line length for formatted SQL */
	maxLineLength?: number;

	/** Whether to validate SQL syntax */
	validateSQL?: boolean;
}

/**
 * SQLite Type Mapping
 */
export interface SQLiteTypeMapping {
	/** SQLite data type */
	sqliteType: string;

	/** Whether type supports length */
	supportsLength: boolean;

	/** Default length if not specified */
	defaultLength?: number;

	/** Whether type supports precision */
	supportsPrecision: boolean;

	/** Default precision if not specified */
	defaultPrecision?: number;

	/** Conversion function for data migration */
	converter?: (value: any) => any;

	/** Validation function for type compatibility */
	validator?: (from: string, to: string) => boolean;

	/** Whether type can be used in PRIMARY KEY */
	canBePrimaryKey: boolean;

	/** Whether type can be used in UNIQUE constraint */
	canBeUnique: boolean;

	/** Whether type can be used in INDEX */
	canBeIndexed: boolean;
}

/**
 * Column Definition for SQL Generation
 */
export interface ColumnDefinitionSQL {
	/** Column name (quoted) */
	name: string;

	/** SQLite data type */
	type: string;

	/** Column constraints */
	constraints: ColumnConstraintsSQL;

	/** Column comment */
	comment?: string;

	/** Whether column is auto-increment */
	autoIncrement: boolean;

	/** Whether column is primary key */
	primaryKey: boolean;
}

/**
 * Column Constraints for SQL Generation
 */
export interface ColumnConstraintsSQL {
	/** NOT NULL constraint */
	notNull?: boolean;

	/** UNIQUE constraint */
	unique?: boolean;

	/** DEFAULT value */
	defaultValue?: string;

	/** CHECK constraint */
	check?: string;

	/** FOREIGN KEY constraint */
	foreignKey?: ForeignKeySQL;

	/** COLLATE clause */
	collate?: string;
}

/**
 * Foreign Key for SQL Generation
 */
export interface ForeignKeySQL {
	/** Referenced table */
	referencedTable: string;

	/** Referenced column */
	referencedColumn: string;

	/** ON DELETE action */
	onDelete: string;

	/** ON UPDATE action */
	onUpdate: string;
}

/**
 * Index Definition for SQL Generation
 */
export interface IndexDefinitionSQL {
	/** Index name (quoted) */
	name: string;

	/** Table name (quoted) */
	table: string;

	/** Indexed columns with order */
	columns: IndexColumnSQL[];

	/** Whether index is unique */
	unique: boolean;

	/** Index type (btree, hash, etc.) */
	type?: string;

	/** WHERE clause for partial index */
	where?: string;

	/** Index comment */
	comment?: string;
}

/**
 * Index Column for SQL Generation
 */
export interface IndexColumnSQL {
	/** Column name (quoted) */
	name: string;

	/** Sort order */
	order: 'ASC' | 'DESC';

	/** Collation */
	collate?: string;
}

/**
 * Table Rebuild Strategy
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

	/** Whether to preserve indexes during rebuild */
	preserveIndexes: boolean;

	/** Whether to preserve foreign keys during rebuild */
	preserveForeignKeys: boolean;

	/** Whether to preserve triggers during rebuild */
	preserveTriggers: boolean;
}

/**
 * Migration SQL Result
 */
export interface MigrationSQL {
	/** Forward migration SQL statements */
	forward: SQLStatement[];

	/** Rollback migration SQL statements */
	rollback: SQLStatement[];

	/** Whether migration is destructive */
	destructive: boolean;

	/** Warnings about potential data loss */
	warnings: string[];

	/** Estimated execution time in seconds */
	estimatedTime?: number;

	/** Migration metadata */
	metadata: MigrationMetadata;
}

/**
 * SQL Statement
 */
export interface SQLStatement {
	/** SQL statement */
	sql: string;

	/** Statement type */
	type: SQLStatementType;

	/** Whether statement is destructive */
	destructive: boolean;

	/** Estimated execution time in seconds */
	estimatedTime?: number;

	/** Statement comment */
	comment?: string;

	/** Related table */
	table?: string;

	/** Related column */
	column?: string;

	/** Column definition for restoration/rollback */
	columnDef?: DocField;

	/** Additional metadata */
	meta?: any;
}

/**
 * SQL Statement Type
 */
export type SQLStatementType =
	| 'create_table'
	| 'drop_table'
	| 'alter_table'
	| 'create_index'
	| 'drop_index'
	| 'insert'
	| 'update'
	| 'delete'
	| 'select'
	| 'transaction'
	| 'other';

/**
 * Migration Metadata
 */
export interface MigrationMetadata {
	/** Migration ID */
	id: string;

	/** Target DocType */
	doctype: string;

	/** Migration version */
	version: string;

	/** Migration timestamp */
	timestamp: Date;

	/** Schema diff this migration addresses */
	diff: SchemaDiff;

	/** Migration options */
	options: MigrationOptions;

	/** Additional metadata */
	custom?: Record<string, any>;
}

/**
 * Migration Options
 */
export interface MigrationOptions {
	/** Whether to create backup before migration */
	backup?: boolean;

	/** Whether to validate data after migration */
	validateData?: boolean;

	/** Whether to continue on error */
	continueOnError?: boolean;

	/** Whether to perform dry run */
	dryRun?: boolean;

	/** Batch size for large operations */
	batchSize?: number;

	/** Timeout for migration in seconds */
	timeout?: number;

	/** Custom migration context */
	context?: Record<string, any>;
}

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
	constructor(fieldType: FieldType) {
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
		super(`Table name conflict: ${tableName}`, 'TABLE_NAME_CONFLICT', undefined, tableName);
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
	constructor(fieldType: FieldType) {
		super(`Layout field type does not create database column: ${fieldType}`, 'LAYOUT_FIELD', undefined, fieldType);
		this.name = 'LayoutFieldError';
	}
}