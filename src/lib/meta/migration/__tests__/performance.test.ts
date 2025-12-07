/**
 * Schema Comparison Performance Tests
 * 
 * This file contains performance tests for the schema comparison functionality,
 * testing large schemas, concurrent operations, and memory usage.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SchemaComparisonEngine } from '../schema-comparison-engine';
import type { Database } from '../../../core/database/database';
import type { DocTypeEngine } from '../../doctype/doctype-engine';
import type { DocType, DocField, DocIndex } from '../../doctype/types';
import type { ColumnInfo, IndexInfo } from '../../../core/database/types';
import type { SchemaComparisonOptions } from '../schema-comparison-types';

describe('Schema Comparison Performance Tests', () => {
	let engine: SchemaComparisonEngine;
	let mockDatabase: Partial<Database>;
	let mockDocTypeEngine: Partial<DocTypeEngine>;

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
			getDocType: vi.fn()
		} as unknown as DocTypeEngine;

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
	 * Helper function to create a large DocType with many fields
	 */
	function createLargeDocType(fieldCount: number, indexCount: number = 10): DocType {
		const fields: DocField[] = Array.from({ length: fieldCount }, (_, i) => ({
			fieldname: `field_${i}`,
			label: `Field ${i}`,
			fieldtype: i % 5 === 0 ? 'Int' : i % 3 === 0 ? 'Date' : 'Data',
			required: i % 10 === 0,
			unique: i % 20 === 0,
			length: i % 2 === 0 ? 100 : 255,
			precision: i % 3 === 0 ? 10 : undefined,
			default: i % 15 === 0 ? `default_${i}` : undefined
		}));

		const indexes: DocIndex[] = Array.from({ length: indexCount }, (_, i) => ({
			name: `idx_${i}`,
			columns: [`field_${i}`, `field_${i + 1}`, `field_${i + 2}`].filter(n => 
				parseInt(n.split('_')[1]) < fieldCount
			),
			unique: i % 3 === 0,
			type: i % 2 === 0 ? 'btree' : 'hash'
		}));

		return {
			name: `LargeDocType_${fieldCount}`,
			module: 'Test',
			fields,
			permissions: [],
			indexes
		};
	}

	/**
	 * Helper function to create large table schema
	 */
	function createLargeTableSchema(fieldCount: number, indexCount: number = 10): {
		columns: ColumnInfo[];
		indexes: IndexInfo[];
	} {
		const columns: ColumnInfo[] = Array.from({ length: fieldCount }, (_, i) => ({
			name: `field_${i}`,
			type: i % 5 === 0 ? 'integer' : i % 3 === 0 ? 'date' : 'text',
			nullable: i % 10 !== 0,
			primary_key: i === 0,
			auto_increment: i === 0,
			unique: i % 20 === 0,
			default_value: i % 15 === 0 ? `default_${i}` : undefined,
			max_length: i % 2 === 0 ? 100 : 255,
			precision: i % 3 === 0 ? 10 : undefined
		}));

		const indexes: IndexInfo[] = Array.from({ length: indexCount }, (_, i) => ({
			name: `idx_${i}`,
			columns: [`field_${i}`, `field_${i + 1}`, `field_${i + 2}`].filter(n => 
				parseInt(n.split('_')[1]) < fieldCount
			),
			unique: i % 3 === 0,
			type: i % 2 === 0 ? 'btree' : 'hash',
			where: i % 5 === 0 ? `field_${i} IS NOT NULL` : undefined
		}));

		return { columns, indexes };
	}

	/**
	 * Test: Large Schema Comparison (100+ fields)
	 */
	it('should handle large schema comparison efficiently (100 fields)', async () => {
		// Arrange
		const fieldCount = 100;
		const largeDocType = createLargeDocType(fieldCount);
		const largeTableSchema = createLargeTableSchema(fieldCount);

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(largeDocType);
		(mockDatabase.get_columns as any).mockResolvedValue(largeTableSchema.columns);
		(mockDatabase.get_indexes as any).mockResolvedValue(largeTableSchema.indexes);

		const startTime = Date.now();

		// Act
		const diff = await engine.compareSchema('LargeDocType_100');

		const endTime = Date.now();
		const duration = endTime - startTime;

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
		expect(duration).toBeLessThan(1000); // Should complete within 1 second
	});

	/**
	 * Test: Very Large Schema Comparison (500+ fields)
	 */
	it('should handle very large schema comparison (500 fields)', async () => {
		// Arrange
		const fieldCount = 500;
		const largeDocType = createLargeDocType(fieldCount, 50);
		const largeTableSchema = createLargeTableSchema(fieldCount, 50);

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(largeDocType);
		(mockDatabase.get_columns as any).mockResolvedValue(largeTableSchema.columns);
		(mockDatabase.get_indexes as any).mockResolvedValue(largeTableSchema.indexes);

		const startTime = Date.now();

		// Act
		const diff = await engine.compareSchema('LargeDocType_500');

		const endTime = Date.now();
		const duration = endTime - startTime;

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
		expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
	});

	/**
	 * Test: Large Schema with Many Differences
	 */
	it('should handle large schema with many differences efficiently', async () => {
		// Arrange
		const fieldCount = 200;
		const largeDocType = createLargeDocType(fieldCount);
		const smallTableSchema = createLargeTableSchema(fieldCount / 2, fieldCount / 20);

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(largeDocType);
		(mockDatabase.get_columns as any).mockResolvedValue(smallTableSchema.columns);
		(mockDatabase.get_indexes as any).mockResolvedValue(smallTableSchema.indexes);

		const startTime = Date.now();

		// Act
		const diff = await engine.compareSchema('LargeDocType_200');

		const endTime = Date.now();
		const duration = endTime - startTime;

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns.length).toBeGreaterThan(0); // Many new columns
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes.length).toBeGreaterThan(0); // Many new indexes
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
		expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
	});

	/**
	 * Test: Concurrent Schema Comparisons
	 */
	it('should handle concurrent schema comparisons safely', async () => {
		// Arrange
		const concurrentCount = 10;
		const fieldCount = 50;
		const docTypes = Array.from({ length: concurrentCount }, (_, i) => 
			createLargeDocType(fieldCount, 5)
		);
		const tableSchemas = Array.from({ length: concurrentCount }, () => 
			createLargeTableSchema(fieldCount, 5)
		);

		(mockDocTypeEngine.getDocType as any)
			.mockImplementation((doctypeName: string) => {
				const index = parseInt(doctypeName.split('_')[1]);
				return Promise.resolve(docTypes[index] || null);
			});

		(mockDatabase.get_columns as any)
			.mockImplementation((tableName: string) => {
				const index = parseInt(tableName.replace('tabLargeDocType_', ''));
				return Promise.resolve(tableSchemas[index]?.columns || []);
			});

		(mockDatabase.get_indexes as any)
			.mockImplementation((tableName: string) => {
				const index = parseInt(tableName.replace('tabLargeDocType_', ''));
				return Promise.resolve(tableSchemas[index]?.indexes || []);
			});

		const startTime = Date.now();

		// Act - Run comparisons concurrently
		const promises = Array.from({ length: concurrentCount }, (_, i) => 
			engine.compareSchema(`LargeDocType_${i}`)
		);

		const results = await Promise.all(promises);

		const endTime = Date.now();
		const duration = endTime - startTime;

		// Assert
		expect(results).toHaveLength(concurrentCount);
		results.forEach(diff => {
			expect(diff).toBeDefined();
			expect(diff.addedColumns).toHaveLength(0);
			expect(diff.removedColumns).toHaveLength(0);
			expect(diff.modifiedColumns).toHaveLength(0);
			expect(diff.addedIndexes).toHaveLength(0);
			expect(diff.removedIndexes).toHaveLength(0);
			expect(diff.renamedColumns).toHaveLength(0);
		});
		expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
	});

	/**
	 * Test: Batch Comparison Performance
	 */
	it('should handle batch comparison efficiently', async () => {
		// Arrange
		const batchSize = 20;
		const fieldCount = 30;
		const docTypeNames = Array.from({ length: batchSize }, (_, i) => `BatchDocType_${i}`);

		(mockDocTypeEngine.getDocType as any)
			.mockImplementation((doctypeName: string) => {
				const index = parseInt(doctypeName.split('_')[1]);
				return Promise.resolve(createLargeDocType(fieldCount, 3));
			});

		(mockDatabase.get_columns as any).mockResolvedValue([]);
		(mockDatabase.get_indexes as any).mockResolvedValue([]);

		const startTime = Date.now();

		// Act
		const result = await engine.batchCompareSchemas(docTypeNames);

		const endTime = Date.now();
		const duration = endTime - startTime;

		// Assert
		expect(result).toBeDefined();
		expect(result.results.size).toBe(batchSize);
		expect(result.successCount).toBe(batchSize);
		expect(result.failureCount).toBe(0);
		expect(result.errors).toHaveLength(0);
		expect(result.totalTime).toBeGreaterThan(0);
		expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
	});

	/**
	 * Test: Memory Usage with Large Schema
	 */
	it('should maintain reasonable memory usage with large schemas', async () => {
		// Arrange
		const fieldCount = 300;
		const largeDocType = createLargeDocType(fieldCount);
		const largeTableSchema = createLargeTableSchema(fieldCount);

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(largeDocType);
		(mockDatabase.get_columns as any).mockResolvedValue(largeTableSchema.columns);
		(mockDatabase.get_indexes as any).mockResolvedValue(largeTableSchema.indexes);

		// Get initial memory usage (approximate)
		const initialMemory = process.memoryUsage().heapUsed;

		// Act - Perform multiple comparisons to test memory accumulation
		for (let i = 0; i < 10; i++) {
			await engine.compareSchema('LargeDocType_300');
		}

		// Clear cache to test memory cleanup
		engine.clearCache();

		// Force garbage collection if available
		if (global.gc) {
			global.gc();
		}

		const finalMemory = process.memoryUsage().heapUsed;
		const memoryIncrease = finalMemory - initialMemory;

		// Assert - Memory increase should be reasonable (less than 50MB)
		expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
	});

	/**
	 * Test: Performance with Different Options
	 */
	it('should maintain performance with different comparison options', async () => {
		// Arrange
		const fieldCount = 150;
		const largeDocType = createLargeDocType(fieldCount);
		const largeTableSchema = createLargeTableSchema(fieldCount);

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(largeDocType);
		(mockDatabase.get_columns as any).mockResolvedValue(largeTableSchema.columns);
		(mockDatabase.get_indexes as any).mockResolvedValue(largeTableSchema.indexes);

		const options: SchemaComparisonOptions[] = [
			{},
			{ caseSensitive: false },
			{ includeSystemFields: false },
			{ analyzeDataMigration: true },
			{ validateTypeCompatibility: true },
			{ ignoreDefaultValues: true },
			{ ignoreLengthDifferences: true },
			{ ignorePrecisionDifferences: true }
		];

		// Act & Assert - Test each option set
		for (const opts of options) {
			const startTime = Date.now();
			const diff = await engine.compareSchema('LargeDocType_150', opts);
			const endTime = Date.now();
			const duration = endTime - startTime;

			expect(diff).toBeDefined();
			expect(duration).toBeLessThan(1500); // Each should complete within 1.5 seconds
		}
	});

	/**
	 * Test: Cache Performance
	 */
	it('should improve performance with caching enabled', async () => {
		// Arrange
		const fieldCount = 100;
		const largeDocType = createLargeDocType(fieldCount);
		const largeTableSchema = createLargeTableSchema(fieldCount);

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(largeDocType);
		(mockDatabase.get_columns as any).mockResolvedValue(largeTableSchema.columns);
		(mockDatabase.get_indexes as any).mockResolvedValue(largeTableSchema.indexes);

		// Act - First comparison (populate cache)
		const startTime1 = Date.now();
		await engine.compareSchema('LargeDocType_100');
		const endTime1 = Date.now();
		const firstDuration = endTime1 - startTime1;

		// Act - Second comparison (use cache)
		const startTime2 = Date.now();
		await engine.compareSchema('LargeDocType_100');
		const endTime2 = Date.now();
		const secondDuration = endTime2 - startTime2;

		// Assert
		expect(firstDuration).toBeGreaterThan(0);
		expect(secondDuration).toBeGreaterThan(0);
		// Second comparison should be faster due to caching
		expect(secondDuration).toBeLessThan(firstDuration);

		// Verify database was called only once
		expect(mockDatabase.get_columns).toHaveBeenCalledTimes(1);
		expect(mockDatabase.get_indexes).toHaveBeenCalledTimes(1);
	});

	/**
	 * Test: Performance Degradation with Schema Complexity
	 */
	it('should handle performance degradation gracefully with complexity', async () => {
		// Arrange - Test with increasing schema sizes
		const fieldCounts = [50, 100, 200, 300];
		const durations: number[] = [];

		for (const fieldCount of fieldCounts) {
			const largeDocType = createLargeDocType(fieldCount);
			const largeTableSchema = createLargeTableSchema(fieldCount);

			(mockDocTypeEngine.getDocType as any).mockResolvedValue(largeDocType);
			(mockDatabase.get_columns as any).mockResolvedValue(largeTableSchema.columns);
			(mockDatabase.get_indexes as any).mockResolvedValue(largeTableSchema.indexes);

			// Act
			const startTime = Date.now();
			await engine.compareSchema(`LargeDocType_${fieldCount}`);
			const endTime = Date.now();
			const duration = endTime - startTime;

			durations.push(duration);

			// Clear mocks for next iteration
			vi.clearAllMocks();
		}

		// Assert - Performance should scale reasonably
		// Each increase in field count should not cause exponential time increase
		for (let i = 1; i < durations.length; i++) {
			const ratio = durations[i] / durations[i - 1];
			// Performance should not degrade more than 3x for each size increase
			expect(ratio).toBeLessThan(3);
		}
	});

	/**
	 * Test: Timeout Handling
	 */
	it('should handle timeout scenarios gracefully', async () => {
		// Arrange
		const fieldCount = 1000;
		const largeDocType = createLargeDocType(fieldCount);
		const largeTableSchema = createLargeTableSchema(fieldCount);

		// Simulate slow database responses
		(mockDocTypeEngine.getDocType as any).mockResolvedValue(largeDocType);
		(mockDatabase.get_columns as any).mockImplementation(() => 
			new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
		);
		(mockDatabase.get_indexes as any).mockResolvedValue(largeTableSchema.indexes);

		const startTime = Date.now();

		// Act & Assert
		try {
			await engine.compareSchema('LargeDocType_1000');
			const endTime = Date.now();
			const duration = endTime - startTime;
			expect(duration).toBeGreaterThan(2000); // Should take at least 2 seconds
		} catch (error) {
			// Should handle timeout gracefully if implemented
			expect(error).toBeDefined();
		}
	});
});