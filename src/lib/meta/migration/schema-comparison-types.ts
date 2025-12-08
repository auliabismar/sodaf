/**
 * Schema Comparison Types and Interfaces
 * 
 * This file defines TypeScript interfaces specific to schema comparison operations
 * in the SODAF framework's migration system.
 */

import type {
	SchemaDiff,
	ColumnChange,
	FieldChange,
	IndexChange,
	ColumnRename,
	ColumnDefinition,
	IndexDefinition,
	MigrationValidation
} from './types';

/**
 * Options for controlling schema comparison behavior
 */
export interface SchemaComparisonOptions {
	/** Whether to ignore case when comparing field names */
	caseSensitive?: boolean;
	
	/** Whether to include system fields (name, creation, modified, etc.) */
	includeSystemFields?: boolean;
	
	/** Whether to analyze data migration requirements */
	analyzeDataMigration?: boolean;
	
	/** Whether to validate field type compatibility */
	validateTypeCompatibility?: boolean;
	
	/** Whether to include custom fields in comparison */
	includeCustomFields?: boolean;
	
	/** Custom field type mappings */
	fieldTypeMappings?: Record<string, string>;
	
	/** Whether to ignore default value differences */
	ignoreDefaultValues?: boolean;
	
	/** Whether to ignore length differences for text fields */
	ignoreLengthDifferences?: boolean;
	
	/** Whether to ignore precision differences for numeric fields */
	ignorePrecisionDifferences?: boolean;
}

/**
 * Statistics about schema differences
 */
export interface DiffStatistics {
	/** Total number of changes */
	totalChanges: number;
	
	/** Number of added columns */
	addedColumns: number;
	
	/** Number of removed columns */
	removedColumns: number;
	
	/** Number of modified columns */
	modifiedColumns: number;
	
	/** Number of added indexes */
	addedIndexes: number;
	
	/** Number of removed indexes */
	removedIndexes: number;
	
	/** Number of renamed columns */
	renamedColumns: number;
	
	/** Whether any changes require data migration */
	requiresDataMigration: boolean;
	
	/** Whether any changes are potentially destructive */
	hasDestructiveChanges: boolean;
	
	/** Estimated complexity score for migration planning */
	complexityScore: number;
}

/**
 * Schema comparison cache entry
 */
export interface SchemaCacheEntry {
	/** Table name */
	tableName: string;
	
	/** Column information */
	columns: import('../../core/database/types').ColumnInfo[];
	
	/** Index information */
	indexes: import('../../core/database/types').IndexInfo[];
	
	/** Cache timestamp */
	timestamp: number;
	
	/** Whether cache is valid */
	valid: boolean;
}

/**
 * Batch comparison result
 */
export interface BatchComparisonResult {
	/** Map of doctype names to schema diffs */
	results: Map<string, SchemaDiff>;
	
	/** Number of successful comparisons */
	successCount: number;
	
	/** Number of failed comparisons */
	failureCount: number;
	
	/** Errors encountered during comparison */
	errors: SchemaComparisonError[];
	
	/** Total comparison time in milliseconds */
	totalTime: number;
}

/**
 * Schema comparison error with detailed context
 */
export class SchemaComparisonError extends Error {
	/** Error code */
	public readonly code: string;
	
	/** Related DocType name */
	public readonly doctype?: string;
	
	/** Additional error details */
	public readonly details?: any;
	
	constructor(
		message: string,
		code: string = 'SCHEMA_COMPARISON_ERROR',
		doctype?: string,
		details?: any
	) {
		super(message);
		this.name = 'SchemaComparisonError';
		this.code = code;
		this.doctype = doctype;
		this.details = details;
	}
}

/**
 * Error thrown when DocType is not found
 */
export class DocTypeNotFoundError extends SchemaComparisonError {
	constructor(doctypeName: string) {
		super(
			`DocType '${doctypeName}' not found`,
			'DOCTYPE_NOT_FOUND',
			doctypeName
		);
		this.name = 'DocTypeNotFoundError';
	}
}

/**
 * Error thrown when table is not found
 */
export class TableNotFoundError extends SchemaComparisonError {
	constructor(tableName: string) {
		super(
			`Table '${tableName}' not found`,
			'TABLE_NOT_FOUND',
			tableName
		);
		this.name = 'TableNotFoundError';
	}
}

/**
 * Error thrown when schema validation fails
 */
export class SchemaValidationError extends SchemaComparisonError {
	constructor(message: string, doctype?: string, details?: any) {
		super(
			message,
			'SCHEMA_VALIDATION_FAILED',
			doctype,
			details
		);
		this.name = 'SchemaValidationError';
	}
}

/**
 * Error thrown when field comparison fails
 */
export class FieldComparisonError extends SchemaComparisonError {
	constructor(
		fieldName: string,
		doctype?: string,
		details?: any
	) {
		super(
			`Field comparison failed for '${fieldName}'`,
			'FIELD_COMPARISON_FAILED',
			doctype,
			details
		);
		this.name = 'FieldComparisonError';
	}
}

/**
 * Error thrown when index comparison fails
 */
export class IndexComparisonError extends SchemaComparisonError {
	constructor(
		indexName: string,
		doctype?: string,
		details?: any
	) {
		super(
			`Index comparison failed for '${indexName}'`,
			'INDEX_COMPARISON_FAILED',
			doctype,
			details
		);
		this.name = 'IndexComparisonError';
	}
}

/**
 * Field type mapping configuration
 */
export interface FieldTypeMapping {
	/** DocType field type */
	docType: string;
	
	/** Database column type */
	database: string;
	
	/** Whether mapping is bidirectional */
	bidirectional: boolean;
	
	/** Conversion function if needed */
	converter?: (value: any) => any;
}

/**
 * Column rename detection result
 */
export interface ColumnRenameDetection {
	/** Detected renames */
	renames: ColumnRename[];
	
	/** Confidence score for each rename (0-1) */
	confidence: number[];
	
	/** Detection method used */
	method: 'exact_match' | 'type_match' | 'similarity';
}

/**
 * Schema comparison context for tracking comparison state
 */
export interface SchemaComparisonContext {
	/** Current DocType being compared */
	currentDocType?: string;
	
	/** Comparison options */
	options: SchemaComparisonOptions;
	
	/** Cache for schema information */
	cache: Map<string, SchemaCacheEntry>;
	
	/** Errors encountered during comparison */
	errors: SchemaComparisonError[];
	
	/** Warnings generated during comparison */
	warnings: string[];
	
	/** Start time of comparison */
	startTime: number;
}

/**
 * Comparison result with additional metadata
 */
export interface EnhancedSchemaDiff extends SchemaDiff {
	/** DocType name */
	doctype: string;
	
	/** Comparison timestamp */
	timestamp: Date;
	
	/** Comparison options used */
	options: SchemaComparisonOptions;
	
	/** Statistics about the diff */
	statistics: DiffStatistics;
	
	/** Whether diff is valid */
	valid: boolean;
	
	/** Validation errors */
	validationErrors: string[];
	
	/** Warnings */
	warnings: string[];
	
	/** Recommendations */
	recommendations: string[];
}

/**
 * Schema comparison progress callback
 */
export type ProgressCallback = (progress: {
	/** Current operation */
	operation: string;
	
	/** Progress percentage (0-100) */
	percentage: number;
	
	/** Current item being processed */
	current?: string;
	
	/** Total items to process */
	total?: number;
	
	/** Processed items count */
	processed?: number;
}) => void;