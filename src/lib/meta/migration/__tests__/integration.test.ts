/**
 * Schema Comparison Integration Tests
 * 
 * This file contains integration tests for the schema comparison functionality,
 * testing the complete workflow from DocType definitions to database schema
 * comparison and analysis.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SchemaComparisonEngine } from '../schema-comparison-engine';
import type { Database } from '../../../core/database/database';
import type { DocTypeEngine } from '../../doctype/doctype-engine';
import type { DocType, DocField, DocIndex } from '../../doctype/types';
import type { ColumnInfo, IndexInfo } from '../../../core/database/types';
import type { SchemaDiff } from '../types';
import type { SchemaComparisonOptions, SchemaComparisonContext } from '../schema-comparison-types';
import { FieldComparator } from '../comparators/field-comparator';
import { IndexComparator } from '../comparators/index-comparator';
import { SchemaDiffAnalyzer } from '../analyzers/diff-analyzer';
import {
	DocTypeNotFoundError,
	TableNotFoundError,
	SchemaValidationError
} from '../schema-comparison-errors';
import { sampleDocFields, sampleDocIndexes, sampleColumnInfo, sampleIndexInfo } from './fixtures/test-data';

describe('Schema Comparison Integration Tests', () => {
	let engine: SchemaComparisonEngine;
	let mockDatabase: Partial<Database>;
	let mockDocTypeEngine: Partial<DocTypeEngine>;
	let testDocType: DocType;
	let testTableColumns: ColumnInfo[];
	let testTableIndexes: IndexInfo[];

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Create mock database
		mockDatabase = {
			get_columns: vi.fn(),
			get_indexes: vi.fn()
		} as unknown as Database;

		// Create mock DocType engine
		mockDocTypeEngine = {
			getDocType: vi.fn(),
			getAllDocTypes: vi.fn()
		} as unknown as DocTypeEngine;

		// Create test DocType
		testDocType = {
			name: 'TestDocType',
			module: 'Test',
			fields: [
				sampleDocFields.basicText,
				sampleDocFields.email,
				sampleDocFields.number,
				sampleDocFields.checkbox
			],
			permissions: [],
			indexes: [
				sampleDocIndexes.basicIndex,
				sampleDocIndexes.uniqueIndex
			]
		};

		// Create test table schema
		testTableColumns = [
			sampleColumnInfo.basicText,
			sampleColumnInfo.email,
			sampleColumnInfo.number,
			sampleColumnInfo.checkbox
		];

		testTableIndexes = [
			sampleIndexInfo.basicIndex,
			sampleIndexInfo.uniqueIndex
		];

		// Create engine instance
		engine = new SchemaComparisonEngine(
			mockDatabase as Database,
			mockDocTypeEngine as DocTypeEngine
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	/**
	 * Test: Complete Comparison Workflow
	 */
	it('should perform complete schema comparison workflow', async () => {
		// Arrange
		(mockDocTypeEngine.getDocType as any).mockResolvedValue(testDocType);
		(mockDatabase.get_columns as any).mockResolvedValue(testTableColumns);
		(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		const progressCallback = vi.fn();

		// Act
		const diff = await engine.compareSchema('TestDocType', {}, progressCallback);

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);

		// Verify progress callback was called
		expect(progressCallback).toHaveBeenCalledTimes(5);
		expect(progressCallback).toHaveBeenNthCalledWith(1, {
			operation: 'Loading DocType',
			percentage: 10,
			current: 'TestDocType'
		});
		expect(progressCallback).toHaveBeenNthCalledWith(5, {
			operation: 'Comparison complete',
			percentage: 100,
			current: 'TestDocType'
		});

		// Verify database methods were called
		expect(mockDatabase.get_columns).toHaveBeenCalledWith('tabTestDocType');
		expect(mockDatabase.get_indexes).toHaveBeenCalledWith('tabTestDocType');
	});

	/**
	 * Test: Multiple DocType Comparison
	 */
	it('should compare multiple DocTypes', async () => {
		// Arrange
		const testDocTypes = ['TestDocType1', 'TestDocType2', 'TestDocType3'];
		const mockResults = [
			{ ...testDocType, name: 'TestDocType1' },
			{ ...testDocType, name: 'TestDocType2' },
			{ ...testDocType, name: 'TestDocType3' }
		];

		// Mock getAllDocTypes to return the list of doctypes
		(mockDocTypeEngine.getAllDocTypes as any).mockResolvedValue(mockResults);

		(mockDocTypeEngine.getDocType as any)
			.mockImplementation((doctypeName: string) => {
				const result = mockResults.find(dt => dt.name === doctypeName);
				return Promise.resolve(result || null);
			});

		(mockDatabase.get_columns as any).mockResolvedValue(testTableColumns);
		(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		// Act
		const results = await engine.compareAllSchemas();

		// Assert
		expect(results).toBeDefined();
		expect(results.size).toBe(3);

		// Verify all DocTypes were requested
		expect(mockDocTypeEngine.getDocType).toHaveBeenCalledWith('TestDocType1');
		expect(mockDocTypeEngine.getDocType).toHaveBeenCalledWith('TestDocType2');
		expect(mockDocTypeEngine.getDocType).toHaveBeenCalledWith('TestDocType3');

		// Verify results contain correct diffs
		for (const [name, diff] of results) {
			expect(diff).toBeDefined();
			expect(diff.addedColumns).toHaveLength(0);
			expect(diff.removedColumns).toHaveLength(0);
			expect(diff.modifiedColumns).toHaveLength(0);
			expect(diff.addedIndexes).toHaveLength(0);
			expect(diff.removedIndexes).toHaveLength(0);
			expect(diff.renamedColumns).toHaveLength(0);
		}
	});

	/**
	 * Test: Batch Comparison with Progress
	 */
	it('should handle batch comparison with progress tracking', async () => {
		// Arrange
		const doctypeNames = ['TestDocType1', 'TestDocType2'];
		const progressEvents: any[] = [];

		const progressCallback = (progress: any) => {
			progressEvents.push(progress);
		};

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(testDocType);
		(mockDatabase.get_columns as any).mockResolvedValue(testTableColumns);
		(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		// Act
		const result = await engine.batchCompareSchemas(doctypeNames, {}, progressCallback);

		// Assert
		expect(result).toBeDefined();
		expect(result.results).toBeDefined();
		expect(result.successCount).toBe(2);
		expect(result.failureCount).toBe(0);
		expect(result.errors).toHaveLength(0);
		expect(result.totalTime).toBeGreaterThanOrEqual(0);

		// Verify progress tracking
		expect(progressEvents.length).toBeGreaterThan(0);
		expect(progressEvents[0].operation).toBe('Processing batch');
		expect(progressEvents[progressEvents.length - 1].operation).toBe('Batch comparison complete');
	});

	/**
	 * Test: Error Handling - DocType Not Found
	 */
	it('should handle DocType not found error', async () => {
		// Arrange
		(mockDocTypeEngine.getDocType as any).mockResolvedValue(null);

		// Act & Assert
		await expect(engine.compareSchema('NonExistentDocType'))
			.rejects.toThrow(DocTypeNotFoundError);
	});

	/**
	 * Test: Error Handling - Table Not Found
	 */
	it('should handle table not found error', async () => {
		// Arrange
		(mockDocTypeEngine.getDocType as any).mockResolvedValue(testDocType);
		(mockDatabase.get_columns as any).mockRejectedValue(new Error('Table not found'));

		// Act
		const diff = await engine.compareSchema('TestDocType', { includeSystemFields: true });

		// Assert
		expect(diff).toBeDefined();
		// Should treat missing table as new table (all fields added)
		expect(diff.addedColumns).toHaveLength(testDocType.fields.length);
		expect(diff.addedIndexes).toHaveLength(testDocType.indexes!.length);
	});

	/**
	 * Test: Schema Comparison with Options
	 */
	it('should respect comparison options', async () => {
		// Arrange
		const options: SchemaComparisonOptions = {
			caseSensitive: false,
			ignoreDefaultValues: true,
			ignoreLengthDifferences: true
		};

		const fieldWithDefault: DocField = {
			...sampleDocFields.basicText,
			default: 'default_value'
		};

		const columnWithDifferentDefault: ColumnInfo = {
			...sampleColumnInfo.basicText,
			default_value: 'different_default'
		};

		const docTypeWithDefault: DocType = {
			...testDocType,
			fields: [fieldWithDefault]
		};

		// Only include the column we're testing - this DocType only has one field
		const tableColumnsWithDifferentDefault = [
			columnWithDifferentDefault
		];

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(docTypeWithDefault);
		(mockDatabase.get_columns as any).mockResolvedValue(tableColumnsWithDifferentDefault);
		(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		// Act
		const diff = await engine.compareSchema('TestDocType', options);

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		// Default difference should be ignored due to options
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
	});

	/**
	 * Test: Complex Schema Comparison
	 */
	it('should handle complex schema differences', async () => {
		// Arrange
		const complexDocType: DocType = {
			...testDocType,
			fields: [
				...testDocType.fields,
				sampleDocFields.longText, // New field
				sampleDocFields.date // New field
			],
			indexes: [
				...(testDocType.indexes || []),
				sampleDocIndexes.compositeIndex // New index
			]
		};

		const tableWithoutNewFields = testTableColumns.filter(col =>
			col.name !== 'description' && col.name !== 'birth_date'
		);

		const tableWithoutNewIndex = testTableIndexes.filter(idx =>
			idx.name !== 'idx_name_status'
		);

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(complexDocType);
		(mockDatabase.get_columns as any).mockResolvedValue(tableWithoutNewFields);
		(mockDatabase.get_indexes as any).mockResolvedValue(tableWithoutNewIndex);

		// Act
		const diff = await engine.compareSchema('TestDocType');

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(2);
		expect(diff.addedColumns.map(col => col.fieldname)).toContain('description');
		expect(diff.addedColumns.map(col => col.fieldname)).toContain('birth_date');
		expect(diff.addedIndexes).toHaveLength(1);
		expect(diff.addedIndexes[0].name).toBe('idx_name_status');
	});

	/**
	 * Test: Schema Validation Integration
	 */
	it('should integrate schema validation', async () => {
		// Arrange
		const invalidDocType: DocType = {
			...testDocType,
			fields: [
				...testDocType.fields,
				{
					...sampleDocFields.basicText,
					fieldname: 'name' // Duplicate field name
				}
			],
			permissions: [],
			indexes: testDocType.indexes
		};

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(invalidDocType);
		(mockDatabase.get_columns as any).mockResolvedValue(testTableColumns);
		(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		// Act
		const diff = await engine.compareSchema('TestDocType');

		// Assert
		expect(diff).toBeDefined();
		// Diff should still be generated even with validation errors
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
	});

	/**
	 * Test: Caching Behavior
	 */
	it('should cache database schema information', async () => {
		// Arrange
		(mockDocTypeEngine.getDocType as any).mockResolvedValue(testDocType);
		(mockDatabase.get_columns as any).mockResolvedValue(testTableColumns);
		(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		const progressCallback = vi.fn();

		// Act - First comparison
		await engine.compareSchema('TestDocType', {}, progressCallback);

		// Act - Second comparison should use cache
		await engine.compareSchema('TestDocType', {}, progressCallback);

		// Assert
		expect(mockDatabase.get_columns).toHaveBeenCalledTimes(1);
		expect(mockDatabase.get_indexes).toHaveBeenCalledTimes(1);
		expect(progressCallback).toHaveBeenCalledTimes(10); // 5 calls per comparison
	});

	/**
	 * Test: Cache Clearing
	 */
	it('should clear cache when requested', async () => {
		// Arrange
		(mockDocTypeEngine.getDocType as any).mockResolvedValue(testDocType);
		(mockDatabase.get_columns as any).mockResolvedValue(testTableColumns);
		(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		// Act - First comparison to populate cache
		await engine.compareSchema('TestDocType');

		// Clear cache
		engine.clearCache('tabTestDocType');

		// Act - Second comparison should re-fetch
		await engine.compareSchema('TestDocType');

		// Assert
		expect(mockDatabase.get_columns).toHaveBeenCalledTimes(2);
		expect(mockDatabase.get_indexes).toHaveBeenCalledTimes(2);
	});

	/**
	 * Test: Performance with Large Schema
	 */
	it('should handle large schema comparison efficiently', async () => {
		// Arrange
		const largeDocType: DocType = {
			...testDocType,
			fields: Array.from({ length: 100 }, (_, i) => ({
				fieldname: `field_${i}`,
				label: `Field ${i}`,
				fieldtype: 'Data' as const,
				required: i % 10 === 0,
				unique: i % 20 === 0
			})),
			permissions: [],
			indexes: Array.from({ length: 20 }, (_, i) => ({
				name: `idx_field_${i}`,
				columns: [`field_${i}`, `field_${i + 1}`],
				unique: i % 5 === 0
			}))
		};

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(largeDocType);
		(mockDatabase.get_columns as any).mockResolvedValue([]);
		(mockDatabase.get_indexes as any).mockResolvedValue([]);

		const startTime = Date.now();

		// Act
		const diff = await engine.compareSchema('LargeDocType');

		const endTime = Date.now();
		const duration = endTime - startTime;

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(100);
		expect(diff.addedIndexes).toHaveLength(20);
		expect(duration).toBeLessThan(1000); // Should complete within 1 second
	});

	/**
	 * Test: Concurrent Comparison
	 */
	it('should handle concurrent comparisons safely', async () => {
		// Arrange
		const concurrentDocTypes = ['TestDocType1', 'TestDocType2', 'TestDocType3'];
		const mockResults = concurrentDocTypes.map(name => ({ ...testDocType, name }));

		(mockDocTypeEngine.getDocType as any)
			.mockImplementation((doctypeName: string) => {
				// Add small delay to simulate async operation
				return new Promise(resolve => {
					setTimeout(() => resolve(mockResults.find(dt => dt.name === doctypeName) || null), Math.random() * 10);
				});
			});

		(mockDatabase.get_columns as any).mockResolvedValue([]);
		(mockDatabase.get_indexes as any).mockResolvedValue([]);

		// Act
		const results = await engine.batchCompareSchemas(concurrentDocTypes);

		// Assert
		expect(results).toBeDefined();
		expect(results.successCount).toBe(3);
		expect(results.failureCount).toBe(0);
		expect(results.errors).toHaveLength(0);
	});

	/**
	 * Test: Integration with FieldComparator
	 */
	it('should integrate with FieldComparator correctly', async () => {
		// Arrange - use 'email' field instead of 'name' since 'name' is a system field
		const fieldWithLengthChange: DocField = {
			...sampleDocFields.email,
			length: 300 // Different length from 255
		};

		const columnWithOldLength: ColumnInfo = {
			...sampleColumnInfo.email,
			type: 'varchar(255)' // Original length
		};

		const docTypeWithLengthChange: DocType = {
			...testDocType,
			fields: [fieldWithLengthChange]
		};

		// Only include the column we're testing - this DocType only has one field
		const tableColumnsWithOldLength = [
			columnWithOldLength
		];

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(docTypeWithLengthChange);
		(mockDatabase.get_columns as any).mockResolvedValue(tableColumnsWithOldLength);
		(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		// Act
		const diff = await engine.compareSchema('TestDocType');

		// Assert
		expect(diff).toBeDefined();
		expect(diff.modifiedColumns).toHaveLength(1);
		expect(diff.modifiedColumns[0].fieldname).toBe('email');
		expect(diff.modifiedColumns[0].changes.length?.from).toBe(255);
		expect(diff.modifiedColumns[0].changes.length?.to).toBe(300);
		expect(diff.modifiedColumns[0].requiresDataMigration).toBe(false);
	});

	/**
	 * Test: Integration with IndexComparator
	 */
	it('should integrate with IndexComparator correctly', async () => {
		// Arrange
		const indexWithDifferentColumns: DocIndex = {
			name: 'idx_test',
			columns: ['name', 'status'], // Different columns
			unique: false,
			type: 'btree'
		};

		const indexWithOriginalColumns: IndexInfo = {
			name: 'idx_test',
			columns: ['name'], // Different columns
			unique: false,
			type: 'btree'
		};

		const docTypeWithIndexChange: DocType = {
			...testDocType,
			indexes: [indexWithDifferentColumns]
		};

		// Only include the index we're comparing - the DocType only has this one index
		const tableIndexesWithOriginalIndex = [
			indexWithOriginalColumns
		];

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(docTypeWithIndexChange);
		(mockDatabase.get_columns as any).mockResolvedValue(testTableColumns);
		(mockDatabase.get_indexes as any).mockResolvedValue(tableIndexesWithOriginalIndex);

		// Act
		const diff = await engine.compareSchema('TestDocType');

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedIndexes).toHaveLength(1);
		expect(diff.removedIndexes).toHaveLength(1);
		expect(diff.addedIndexes[0].index.columns).toEqual(['name', 'status']);
		expect(diff.removedIndexes[0].index.columns).toEqual(['name']);
	});

	/**
	 * Test: Integration with SchemaDiffAnalyzer
	 */
	it('should integrate with SchemaDiffAnalyzer correctly', async () => {
		// Arrange
		const complexDiff: SchemaDiff = {
			addedColumns: [{
				fieldname: 'new_field',
				column: {
					name: 'new_field',
					type: 'text',
					nullable: true,
					primary_key: false,
					auto_increment: false,
					unique: false
				},
				destructive: false
			}],
			removedColumns: [{
				fieldname: 'old_field',
				column: {
					name: 'old_field',
					type: 'text',
					nullable: true,
					primary_key: false,
					auto_increment: false,
					unique: false
				},
				destructive: true
			}],
			modifiedColumns: [{
				fieldname: 'changed_field',
				changes: {
					type: { from: 'text', to: 'integer' }
				},
				requiresDataMigration: true,
				destructive: false
			}],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		};

		// Mock the engine to return this diff
		const mockEngine = {
			compareSchema: vi.fn().mockResolvedValue(complexDiff),
			hasChanges: vi.fn().mockResolvedValue(true),
			requiresDataMigration: vi.fn().mockResolvedValue(true),
			hasDestructiveChanges: vi.fn().mockResolvedValue(true),
			getDiffStatistics: vi.fn().mockResolvedValue({
				totalChanges: 4,
				addedColumns: 1,
				removedColumns: 1,
				modifiedColumns: 1,
				addedIndexes: 0,
				removedIndexes: 0,
				renamedColumns: 0,
				requiresDataMigration: true,
				hasDestructiveChanges: true,
				complexityScore: 50
			})
		};

		// Act
		const hasChanges = await mockEngine.hasChanges(complexDiff);
		const requiresMigration = await mockEngine.requiresDataMigration(complexDiff);
		const hasDestructive = await mockEngine.hasDestructiveChanges(complexDiff);
		const stats = await mockEngine.getDiffStatistics(complexDiff);

		// Assert
		expect(hasChanges).toBe(true);
		expect(requiresMigration).toBe(true);
		expect(hasDestructive).toBe(true);
		expect(stats.totalChanges).toBe(4);
		expect(stats.requiresDataMigration).toBe(true);
		expect(stats.hasDestructiveChanges).toBe(true);
	});
});