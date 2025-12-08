/**
 * Schema Comparison Engine
 *
 * This is the main class responsible for orchestrating schema comparison operations
 * between DocType definitions and actual database schema.
 */

import type { Database } from '../../core/database/database';
import type { DocTypeEngine } from '../doctype/doctype-engine';
import type { DocType } from '../doctype/types';
import type {
	SchemaDiff,
	ColumnChange,
	FieldChange,
	IndexChange,
	ColumnRename
} from './types';
import type { ColumnInfo, IndexInfo } from '../../core/database/types';
import type {
	SchemaComparisonOptions,
	DiffStatistics,
	SchemaCacheEntry,
	BatchComparisonResult,
	ProgressCallback,
	SchemaComparisonContext
} from './schema-comparison-types';
import { FieldComparator } from './comparators/field-comparator';
import { IndexComparator } from './comparators/index-comparator';
import { SchemaDiffAnalyzer } from './analyzers/diff-analyzer';
import {
	SchemaComparisonError,
	DocTypeNotFoundError,
	TableNotFoundError,
	SchemaValidationError
} from './schema-comparison-errors';
import { CustomFieldManager } from '../custom';

/**
 * Main class for orchestrating schema comparison operations
 */
export class SchemaComparisonEngine {
	private database: Database;
	private doctypeEngine: DocTypeEngine;
	private customFieldManager: CustomFieldManager;
	private defaultOptions: SchemaComparisonOptions;
	private cache: Map<string, SchemaCacheEntry>;

	/**
	 * Cache timeout in milliseconds (5 minutes)
	 */
	private static readonly CACHE_TIMEOUT = 5 * 60 * 1000;

	/**
	 * Create a new SchemaComparisonEngine instance
	 * @param database Database connection for schema introspection
	 * @param doctypeEngine DocType engine for retrieving DocType definitions
	 * @param options Default comparison options
	 */
	constructor(
		database: Database,
		doctypeEngine: DocTypeEngine,
		options: SchemaComparisonOptions = {}
	) {
		this.database = database;
		this.doctypeEngine = doctypeEngine;
		this.customFieldManager = CustomFieldManager.getInstance();
		this.defaultOptions = {
			caseSensitive: true,
			includeSystemFields: false,
			analyzeDataMigration: true,
			validateTypeCompatibility: true,
			ignoreDefaultValues: false,
			ignoreLengthDifferences: false,
			ignorePrecisionDifferences: false,
			...options
		};
		this.cache = new Map();
	}
	
	/**
	 * Compare DocType schema with database table schema
	 * @param doctypeName Name of DocType to compare
	 * @param options Comparison options (overrides defaults)
	 * @param progressCallback Optional progress callback
	 * @returns Promise resolving to SchemaDiff
	 */
	async compareSchema(
		doctypeName: string,
		options?: SchemaComparisonOptions,
		progressCallback?: ProgressCallback
	): Promise<SchemaDiff> {
		const mergedOptions = { ...this.defaultOptions, ...options };
		const context: SchemaComparisonContext = {
			currentDocType: doctypeName,
			options: mergedOptions,
			cache: this.cache,
			errors: [],
			warnings: [],
			startTime: Date.now()
		};

		try {
			progressCallback?.({
				operation: 'Loading DocType',
				percentage: 10,
				current: doctypeName
			});

			// Get DocType definition
			const doctype = await this.doctypeEngine.getDocType(doctypeName);
			if (!doctype) {
				throw new DocTypeNotFoundError(doctypeName);
			}

			progressCallback?.({
				operation: 'Loading table schema',
				percentage: 30,
				current: doctypeName
			});

			// Get DocType with custom fields if enabled
			let doctypeForComparison = doctype;
			if (mergedOptions.includeSystemFields) {
				doctypeForComparison = await this.customFieldManager.mergeCustomFields(doctype);
			}

			// Get table schema from database
			const tableName = doctype.table_name || doctypeName;
			let tableColumns: ColumnInfo[] = [];
			let tableIndexes: IndexInfo[] = [];
			
			try {
				[tableColumns, tableIndexes] = await Promise.all([
					this.getTableColumns(tableName, context),
					this.getTableIndexes(tableName, context)
				]);
		} catch (error) {
				// Handle case where table doesn't exist
				if (error instanceof TableNotFoundError) {
					// Table doesn't exist, use empty arrays
					tableColumns = [];
					tableIndexes = [];
				} else {
					throw error;
				}
			}

			progressCallback?.({
				operation: 'Comparing schemas',
				percentage: 50,
				current: doctypeName
			});

			// Perform schema comparison
			const diff = await this.performSchemaComparison(
				doctypeForComparison,
				tableColumns,
				tableIndexes,
				mergedOptions,
				context
			);

			progressCallback?.({
				operation: 'Analyzing differences',
				percentage: 80,
				current: doctypeName
			});

			// Validate the diff
			const validation = SchemaDiffAnalyzer.validateSchemaDiff(diff);
			if (!validation.valid) {
				context.errors.push(
					new SchemaValidationError(
						`Schema validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
						doctypeName,
						validation.errors
					)
				);
			}

			progressCallback?.({
				operation: 'Comparison complete',
				percentage: 100,
				current: doctypeName
			});

			return diff;
		} catch (error) {
			context.errors.push(
				error instanceof SchemaComparisonError 
					? error 
					: new SchemaComparisonError(
						`Schema comparison failed: ${error instanceof Error ? error.message : String(error)}`,
						'COMPARISON_FAILED',
						doctypeName,
						error
					)
			);
			throw error;
		}
	}
	
	/**
	 * Compare all registered DocTypes with their database tables
	 * @param options Comparison options (overrides defaults)
	 * @param progressCallback Optional progress callback
	 * @returns Promise resolving to Map of doctype names to SchemaDiffs
	 */
	async compareAllSchemas(
		options?: SchemaComparisonOptions,
		progressCallback?: ProgressCallback
	): Promise<Map<string, SchemaDiff>> {
		const mergedOptions = { ...this.defaultOptions, ...options };
		const results = new Map<string, SchemaDiff>();
		
		try {
			// Get all DocType names
			// For now, we'll use a placeholder implementation
			// In a real implementation, this would get all DocType names
			const doctypeNames = ['User', 'Todo']; // Placeholder
			const total = doctypeNames.length;
			
			for (let i = 0; i < total; i++) {
				const doctypeName = doctypeNames[i];
				
				try {
					progressCallback?.({
						operation: 'Comparing schemas',
						percentage: Math.floor((i / total) * 100),
						current: doctypeName,
						total,
						processed: i
					});
					
					const diff = await this.compareSchema(doctypeName, mergedOptions);
					results.set(doctypeName, diff);
				} catch (error) {
					// Log error but continue with other DocTypes
					console.error(`Error comparing ${doctypeName}:`, error);
				}
			}
			
			progressCallback?.({
				operation: 'Comparison complete',
				percentage: 100,
				total,
				processed: total
			});
			
			return results;
		} catch (error) {
			throw new SchemaComparisonError(
				`Batch schema comparison failed: ${error instanceof Error ? error.message : String(error)}`,
				'BATCH_COMPARISON_FAILED',
				undefined,
				error
			);
		}
	}
	
	/**
	 * Compare multiple DocTypes in parallel batches
	 * @param doctypeNames Array of DocType names to compare
	 * @param options Comparison options (overrides defaults)
	 * @param progressCallback Optional progress callback
	 * @returns Promise resolving to BatchComparisonResult
	 */
	async batchCompareSchemas(
		doctypeNames: string[],
		options?: SchemaComparisonOptions,
		progressCallback?: ProgressCallback
	): Promise<BatchComparisonResult> {
		const mergedOptions = { ...this.defaultOptions, ...options };
		const results = new Map<string, SchemaDiff>();
		const errors: SchemaComparisonError[] = [];
		const startTime = Date.now();
		
		const batchSize = 5; // Process 5 schemas at a time
		let processed = 0;
		
		try {
			for (let i = 0; i < doctypeNames.length; i += batchSize) {
				const batch = doctypeNames.slice(i, i + batchSize);
				
				progressCallback?.({
					operation: 'Processing batch',
					percentage: Math.floor((processed / doctypeNames.length) * 100),
					current: `Batch ${Math.floor(i / batchSize) + 1}`,
					total: doctypeNames.length,
					processed
				});
				
				const batchPromises = batch.map(async (doctypeName) => {
					try {
						const diff = await this.compareSchema(doctypeName, mergedOptions);
						return { doctypeName, diff, error: null };
					} catch (error) {
						const schemaError = error instanceof SchemaComparisonError 
							? error 
							: new SchemaComparisonError(
								`Schema comparison failed: ${error instanceof Error ? error.message : String(error)}`,
								'COMPARISON_FAILED',
								doctypeName,
								error
							);
						return { doctypeName, diff: null, error: schemaError };
					}
				});
				
				const batchResults = await Promise.all(batchPromises);
				
				for (const result of batchResults) {
					if (result.error) {
						errors.push(result.error);
					} else if (result.diff) {
						results.set(result.doctypeName, result.diff);
					}
				}
				
				processed += batch.length;
			}
			
			const totalTime = Date.now() - startTime;
			
			progressCallback?.({
				operation: 'Batch comparison complete',
				percentage: 100,
				total: doctypeNames.length,
				processed
			});
			
			return {
				results,
				successCount: results.size,
				failureCount: errors.length,
				errors,
				totalTime
			};
		} catch (error) {
			throw new SchemaComparisonError(
				`Batch comparison failed: ${error instanceof Error ? error.message : String(error)}`,
				'BATCH_COMPARISON_FAILED',
				undefined,
				error
			);
		}
	}
	
	/**
	 * Check if a schema diff contains any changes
	 * @param diff SchemaDiff to check
	 * @returns True if diff has changes
	 */
	async hasChanges(diff: SchemaDiff): Promise<boolean> {
		return SchemaDiffAnalyzer.hasChanges(diff);
	}
	
	/**
	 * Check if a schema diff requires data migration
	 * @param diff SchemaDiff to check
	 * @returns True if data migration is required
	 */
	async requiresDataMigration(diff: SchemaDiff): Promise<boolean> {
		return SchemaDiffAnalyzer.requiresDataMigration(diff);
	}
	
	/**
	 * Check if a schema diff contains potentially destructive changes
	 * @param diff SchemaDiff to check
	 * @returns True if destructive changes are present
	 */
	async hasDestructiveChanges(diff: SchemaDiff): Promise<boolean> {
		return SchemaDiffAnalyzer.hasDestructiveChanges(diff);
	}
	
	/**
	 * Get statistics for a schema diff
	 * @param diff SchemaDiff to analyze
	 * @returns DiffStatistics object
	 */
	async getDiffStatistics(diff: SchemaDiff): Promise<DiffStatistics> {
		return SchemaDiffAnalyzer.getDiffStatistics(diff);
	}
	
	/**
	 * Get column information for a table
	 * @param tableName Table name to query
	 * @param context Comparison context
	 * @returns Promise resolving to array of ColumnInfo
	 */
	async getTableColumns(
		tableName: string,
		context?: SchemaComparisonContext
	): Promise<ColumnInfo[]> {
		// Check cache first
		if (context?.cache) {
			const cached = context.cache.get(`columns:${tableName}`);
			if (cached && (Date.now() - cached.timestamp) < SchemaComparisonEngine.CACHE_TIMEOUT) {
				return cached.columns;
			}
		}

		try {
			const columns = await this.database.get_columns(tableName);
			
			// Update cache
			if (context?.cache) {
				context.cache.set(`columns:${tableName}`, {
					tableName,
					columns,
					indexes: [], // Empty since we're only getting columns
					timestamp: Date.now(),
					valid: true
				});
			}
			
			return columns;
		} catch (error) {
			throw new TableNotFoundError(tableName);
		}
	}
	
	/**
	 * Get index information for a table
	 * @param tableName Table name to query
	 * @param context Comparison context
	 * @returns Promise resolving to array of IndexInfo
	 */
	async getTableIndexes(
		tableName: string,
		context?: SchemaComparisonContext
	): Promise<IndexInfo[]> {
		// Check cache first
		if (context?.cache) {
			const cached = context.cache.get(`indexes:${tableName}`);
			if (cached && (Date.now() - cached.timestamp) < SchemaComparisonEngine.CACHE_TIMEOUT) {
				return cached.indexes;
			}
		}

		try {
			const indexes = await this.database.get_indexes(tableName);
			
			// Update cache
			if (context?.cache) {
				context.cache.set(`indexes:${tableName}`, {
					tableName,
					columns: [], // Empty since we're only getting indexes
					indexes,
					timestamp: Date.now(),
					valid: true
				});
			}
			
			return indexes;
		} catch (error) {
			// Indexes might not exist for all tables, return empty array
			return [];
		}
	}
	
	/**
	 * Validate a schema diff for consistency and correctness
	 * @param diff SchemaDiff to validate
	 * @returns ValidationResult with validation status and errors
	 */
	async validateSchemaDiff(diff: SchemaDiff): Promise<any> {
		return SchemaDiffAnalyzer.validateSchemaDiff(diff);
	}
	
	/**
	 * Set default comparison options
	 * @param options New default options
	 */
	setDefaultOptions(options: SchemaComparisonOptions): void {
		this.defaultOptions = { ...this.defaultOptions, ...options };
	}
	
	/**
	 * Get current default comparison options
	 * @returns Current default options
	 */
	getDefaultOptions(): SchemaComparisonOptions {
		return { ...this.defaultOptions };
	}
	
	/**
	 * Clear schema cache
	 * @param tableName Optional table name to clear specific cache entry
	 */
	clearCache(tableName?: string): void {
		if (tableName) {
			this.cache.delete(`columns:${tableName}`);
			this.cache.delete(`indexes:${tableName}`);
		} else {
			this.cache.clear();
		}
	}
	
	/**
	 * Get cache statistics
	 * @returns Cache statistics object
	 */
	getCacheStats(): { size: number; entries: Array<{ key: string; timestamp: number }> } {
		const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
			key,
			timestamp: entry.timestamp
		}));
		
		return {
			size: this.cache.size,
			entries
		};
	}

	/**
	 * Perform the actual schema comparison
	 * @param doctype DocType definition
	 * @param tableColumns Database table columns
	 * @param tableIndexes Database table indexes
	 * @param options Comparison options
	 * @param context Comparison context
	 * @returns Promise resolving to SchemaDiff
	 */
	private async performSchemaComparison(
		doctype: DocType,
		tableColumns: ColumnInfo[],
		tableIndexes: IndexInfo[],
		options: SchemaComparisonOptions,
		context: SchemaComparisonContext
	): Promise<SchemaDiff> {
		const diff: SchemaDiff = {
			addedColumns: [],
			removedColumns: [],
			modifiedColumns: [],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		};
		
		// Compare fields
		const fieldComparison = await this.compareFields(
			doctype.fields,
			tableColumns,
			options
		);
		
		diff.addedColumns = fieldComparison.addedColumns;
		diff.removedColumns = fieldComparison.removedColumns;
		diff.modifiedColumns = fieldComparison.modifiedColumns;
		
		// Compare indexes
		const indexComparison = await this.compareIndexes(
			doctype.indexes || [],
			tableIndexes,
			doctype.name
		);
		
		diff.addedIndexes = indexComparison.addedIndexes;
		diff.removedIndexes = indexComparison.removedIndexes;
		
		// Detect potential column renames
		diff.renamedColumns = await this.detectColumnRenames(
			diff.removedColumns,
			diff.addedColumns,
			options
		);
		
		return diff;
	}

	/**
	 * Compare DocType fields with database columns
	 * @param fields DocType fields
	 * @param columns Database columns
	 * @param options Comparison options
	 * @returns Promise resolving to comparison result
	 */
	private async compareFields(
		fields: any[],
		columns: ColumnInfo[],
		options: SchemaComparisonOptions
	): Promise<{
		addedColumns: ColumnChange[];
		removedColumns: ColumnChange[];
		modifiedColumns: FieldChange[];
	}> {
		const result = {
			addedColumns: [] as ColumnChange[],
			removedColumns: [] as ColumnChange[],
			modifiedColumns: [] as FieldChange[]
		};
		
		// Filter system fields if requested
		const filteredFields = options.includeSystemFields 
			? fields 
			: fields.filter(f => !FieldComparator.isSystemField(f.fieldname));
		
		// Find added and modified fields
		for (const field of filteredFields) {
			const matchingColumn = FieldComparator.findMatchingColumn(field, columns, options);
			
			if (!matchingColumn) {
				// Field not in database - added column
				result.addedColumns.push({
					fieldname: field.fieldname,
					column: FieldComparator.fieldToColumnDefinition(field, options),
					destructive: false
				});
			} else {
				// Field exists - check for modifications
				const fieldChange = FieldComparator.compareFieldToColumn(
					field, 
					matchingColumn, 
					options
				);
				
				if (fieldChange) {
					result.modifiedColumns.push(fieldChange);
				}
			}
		}
		
		// Find removed columns
		const nonSystemColumns = columns.filter(column =>
			!FieldComparator.isSystemField(column.name)
		);
		
		for (const column of nonSystemColumns) {
			const matchingField = filteredFields.find(f =>
				FieldComparator.findMatchingColumn(f, [column], options)
			);
			
			if (!matchingField) {
				// Column not in DocType - removed column
				result.removedColumns.push({
					fieldname: column.name,
					column: FieldComparator.columnInfoToColumnDefinition(column),
					destructive: true
				});
			}
		}
		
		return result;
	}

	/**
	 * Compare DocType indexes with database indexes
	 * @param docIndexes DocType indexes
	 * @param dbIndexes Database indexes
	 * @param doctypeName DocType name
	 * @returns Promise resolving to comparison result
	 */
	private async compareIndexes(
		docIndexes: any[],
		dbIndexes: IndexInfo[],
		doctypeName: string
	): Promise<{
		addedIndexes: IndexChange[];
		removedIndexes: IndexChange[];
	}> {
		const result = {
			addedIndexes: [] as IndexChange[],
			removedIndexes: [] as IndexChange[]
		};
		
		// Find added indexes
		for (const docIndex of docIndexes) {
			const matchingDbIndex = IndexComparator.findMatchingIndex(docIndex, dbIndexes);
			
			if (!matchingDbIndex) {
				// Index not in database - added index
				result.addedIndexes.push({
					name: docIndex.name || IndexComparator.generateIndexName(
						doctypeName, 
						docIndex.columns, 
						docIndex.unique
					),
					index: IndexComparator.docIndexToIndexDefinition(docIndex, doctypeName),
					destructive: false
				});
			}
		}
		
		// Find removed indexes
		for (const dbIndex of dbIndexes) {
			const matchingDocIndex = docIndexes.find(di => 
				IndexComparator.compareIndexToIndex(di, dbIndex)
			);
			
			if (!matchingDocIndex) {
				// Index not in DocType - removed index
				result.removedIndexes.push({
					name: dbIndex.name,
					index: IndexComparator.indexInfoToIndexDefinition(dbIndex),
					destructive: false
				});
			}
		}
		
		return result;
	}

	/**
	 * Detect potential column renames based on similarity
	 * @param removedColumns Removed columns
	 * @param addedColumns Added columns
	 * @param options Comparison options
	 * @returns Promise resolving to array of column renames
	 */
	private async detectColumnRenames(
		removedColumns: ColumnChange[],
		addedColumns: ColumnChange[],
		options: SchemaComparisonOptions
	): Promise<ColumnRename[]> {
		const renames: ColumnRename[] = [];
		const processedRemoved = new Set<number>();
		const processedAdded = new Set<number>();
		
		// Simple heuristic: look for exact type matches with similar names
		for (let i = 0; i < removedColumns.length; i++) {
			if (processedRemoved.has(i)) continue;
			
			const removed = removedColumns[i];
			
			for (let j = 0; j < addedColumns.length; j++) {
				if (processedAdded.has(j)) continue;
				
				const added = addedColumns[j];
				
				// Check if columns have identical definitions
				if (this.areColumnDefinitionsEqual(removed.column, added.column)) {
					// Check name similarity (simple heuristic)
					const similarity = this.calculateNameSimilarity(
						removed.fieldname,
						added.fieldname
					);
					
					// If names are similar, consider it a rename
					if (similarity > 0.7) {
						renames.push({
							from: removed.fieldname,
							to: added.fieldname,
							column: added.column
						});
						
						processedRemoved.add(i);
						processedAdded.add(j);
						break;
					}
				}
			}
		}
		
		return renames;
	}

	/**
	 * Check if two column definitions are equal
	 * @param col1 First column definition
	 * @param col2 Second column definition
	 * @returns True if definitions are equal
	 */
	private areColumnDefinitionsEqual(col1: any, col2: any): boolean {
		return (
			col1.type === col2.type &&
			col1.nullable === col2.nullable &&
			col1.unique === col2.unique &&
			col1.default_value === col2.default_value &&
			col1.length === col2.length &&
			col1.precision === col2.precision
		);
	}

	/**
	 * Calculate name similarity between two strings
	 * @param name1 First name
	 * @param name2 Second name
	 * @returns Similarity score (0-1)
	 */
	private calculateNameSimilarity(name1: string, name2: string): number {
		// Simple similarity calculation based on common characters
		const longer = name1.length > name2.length ? name1 : name2;
		const shorter = name1.length > name2.length ? name2 : name1;
		
		if (longer.length === 0) return 1.0;
		
		const commonChars = longer.split('').filter(char => shorter.includes(char)).length;
		return commonChars / longer.length;
	}
}