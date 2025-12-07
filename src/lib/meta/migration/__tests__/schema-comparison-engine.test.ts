/**
 * Schema Comparison Engine Tests (P2-006-T1 to T17)
 * 
 * This file contains tests for the SchemaComparisonEngine class, which is the main
 * orchestrator for schema comparison operations between DocType definitions and
 * actual database schema.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SchemaComparisonEngine } from '../schema-comparison-engine';
import type { Database } from '../../../core/database/database';
import type { DocTypeEngine } from '../../doctype/doctype-engine';
import type { DocType, DocField, DocIndex } from '../../doctype/types';
import type { ColumnInfo, IndexInfo } from '../../../core/database/types';
import type { SchemaDiff } from '../types';
import type { SchemaComparisonOptions } from '../schema-comparison-types';
import type { SchemaComparisonContext } from '../schema-comparison-types';
import {
	DocTypeNotFoundError,
	TableNotFoundError,
	SchemaValidationError
} from '../schema-comparison-errors';
import { FieldComparator } from '../comparators/field-comparator';
import { IndexComparator } from '../comparators/index-comparator';
import { SchemaDiffAnalyzer } from '../analyzers/diff-analyzer';
import { sampleDocFields, sampleDocIndexes, sampleColumnInfo, sampleIndexInfo } from './fixtures/test-data';

// Mock implementations
const mockDatabase = {
	get_columns: vi.fn(),
	get_indexes: vi.fn()
} as unknown as Database;

const mockDocTypeEngine = {
	getDocType: vi.fn()
} as unknown as DocTypeEngine;

// Test data
const testDocType: DocType = {
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

const testTableColumns: ColumnInfo[] = [
	sampleColumnInfo.basicText,
	sampleColumnInfo.email,
	sampleColumnInfo.number,
	sampleColumnInfo.select,
	sampleColumnInfo.checkbox
];

const testTableIndexes: IndexInfo[] = [
	sampleIndexInfo.basicIndex,
	sampleIndexInfo.uniqueIndex
];

describe('SchemaComparisonEngine', () => {
	let engine: SchemaComparisonEngine;

	beforeEach(() => {
		vi.clearAllMocks();
		engine = new SchemaComparisonEngine(
			mockDatabase as Database,
			mockDocTypeEngine as DocTypeEngine
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	/**
	 * Test P2-006-T1: compareSchema - New Table
	 */
	it('P2-006-T1: should compare schema when table does not exist', async () => {
		// Arrange
	(mockDocTypeEngine.getDocType as any).mockResolvedValue(testDocType);
	(mockDatabase.get_columns as any).mockRejectedValue(new Error('Table not found'));
	(mockDatabase.get_indexes as any).mockRejectedValue(new Error('Table not found'));

		// Act
		const diff = await engine.compareSchema('TestDocType');

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(5); // All fields should be added
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(2); // All indexes should be added
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);

		// Check that all DocType fields are in addedColumns
		const addedFieldNames = diff.addedColumns.map(col => col.fieldname);
		expect(addedFieldNames).toContain('name');
		expect(addedFieldNames).toContain('email');
		expect(addedFieldNames).toContain('age');
		expect(addedFieldNames).toContain('is_active');
		expect(addedFieldNames).toContain('description');

		// Check that all DocType indexes are in addedIndexes
		const addedIndexNames = diff.addedIndexes.map(idx => idx.name);
		expect(addedIndexNames).toContain('idx_name');
		expect(addedIndexNames).toContain('idx_email_unique');
	});

	/**
	 * Test P2-006-T2: compareSchema - No Changes
	 */
	it('P2-006-T2: should compare schema when schema matches DocType definition', async () => {
		// Arrange
	(mockDocTypeEngine.getDocType as any).mockResolvedValue(testDocType);
	(mockDatabase.get_columns as any).mockResolvedValue(testTableColumns);
	(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		// Act
		const diff = await engine.compareSchema('TestDocType');

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);

		// Verify hasChanges returns false
		const hasChanges = await engine.hasChanges(diff);
		expect(hasChanges).toBe(false);

		// Verify requiresDataMigration returns false
		const requiresDataMigration = await engine.requiresDataMigration(diff);
		expect(requiresDataMigration).toBe(false);
	});

	/**
	 * Test P2-006-T3: compareSchema - Added Field
	 */
	it('P2-006-T3: should detect new field in DocType', async () => {
		// Arrange
		const docTypeWithNewField: DocType = {
			...testDocType,
			fields: [
				...testDocType.fields,
				sampleDocFields.longText // New field
			]
		};

	(mockDocTypeEngine.getDocType as any).mockResolvedValue(docTypeWithNewField);
	(mockDatabase.get_columns as any).mockResolvedValue(testTableColumns);
	(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		// Act
		const diff = await engine.compareSchema('TestDocType');

		// Assert
		expect(diff.addedColumns).toHaveLength(1);
		expect(diff.addedColumns[0].fieldname).toBe('description');
		expect(diff.addedColumns[0].column.type).toBe('text');
		expect(diff.addedColumns[0].destructive).toBe(false);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);

		// Verify hasChanges returns true
		const hasChanges = await engine.hasChanges(diff);
		expect(hasChanges).toBe(true);
	});

	/**
	 * Test P2-006-T4: compareSchema - Removed Field
	 */
	it('P2-006-T4: should detect field removed from DocType', async () => {
		// Arrange
		const tableWithExtraColumn: ColumnInfo[] = [
			...testTableColumns,
			{
				name: 'legacy_field',
				type: 'text',
				nullable: true,
				default_value: null,
				primary_key: false,
				auto_increment: false,
				unique: false
			}
		];

	(mockDocTypeEngine.getDocType as any).mockResolvedValue(testDocType);
	(mockDatabase.get_columns as any).mockResolvedValue(tableWithExtraColumn);
	(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		// Act
		const diff = await engine.compareSchema('TestDocType');

		// Assert
		expect(diff.removedColumns).toHaveLength(1);
		expect(diff.removedColumns[0].fieldname).toBe('legacy_field');
		expect(diff.removedColumns[0].column.type).toBe('text');
		expect(diff.removedColumns[0].destructive).toBe(true);
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
	});

	/**
	 * Test P2-006-T5: compareSchema - Modified Field Type
	 */
	it('P2-006-T5: should detect field type changes', async () => {
		// Arrange
		const tableWithDifferentType: ColumnInfo[] = testTableColumns.map(col => {
			if (col.name === 'age') {
				return {
					...col,
					type: 'text' // Changed from integer
				};
			}
			return col;
		});

	(mockDocTypeEngine.getDocType as any).mockResolvedValue(testDocType);
	(mockDatabase.get_columns as any).mockResolvedValue(tableWithDifferentType);
	(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		// Act
		const diff = await engine.compareSchema('TestDocType');

		// Assert
		expect(diff.modifiedColumns).toHaveLength(1);
		expect(diff.modifiedColumns[0].fieldname).toBe('age');
		expect(diff.modifiedColumns[0].changes.type?.from).toBe('text');
		expect(diff.modifiedColumns[0].changes.type?.to).toBe('integer');
		expect(diff.modifiedColumns[0].requiresDataMigration).toBe(true);
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
	});

	/**
	 * Test P2-006-T6: compareSchema - Modified Field Length
	 */
	it('P2-006-T6: should detect field length changes', async () => {
		// Arrange
		const docTypeWithDifferentLength: DocType = {
			...testDocType,
			fields: testDocType.fields.map(field => {
				if (field.fieldname === 'name') {
					return {
						...field,
						length: 200 // Changed from 100
					};
				}
				return field;
			})
		};

		const tableWithDifferentLength: ColumnInfo[] = testTableColumns.map(col => {
			if (col.name === 'name') {
				return {
					...col,
					type: 'varchar(100)' // Different length
				};
			}
			return col;
		});

	(mockDocTypeEngine.getDocType as any).mockResolvedValue(docTypeWithDifferentLength);
	(mockDatabase.get_columns as any).mockResolvedValue(tableWithDifferentLength);
	(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		// Act
		const diff = await engine.compareSchema('TestDocType');

		// Assert
		expect(diff.modifiedColumns).toHaveLength(1);
		expect(diff.modifiedColumns[0].fieldname).toBe('name');
		expect(diff.modifiedColumns[0].changes.length?.from).toBe(100);
		expect(diff.modifiedColumns[0].changes.length?.to).toBe(200);
		expect(diff.modifiedColumns[0].requiresDataMigration).toBe(false);
	});

	/**
	 * Test P2-006-T7: compareSchema - Modified Required Constraint
	 */
	it('P2-006-T7: should detect required constraint changes', async () => {
		// Arrange
		const tableWithDifferentNullable: ColumnInfo[] = testTableColumns.map(col => {
			if (col.name === 'email') {
				return {
					...col,
					nullable: true // Different nullable constraint
				};
			}
			return col;
		});

	(mockDocTypeEngine.getDocType as any).mockResolvedValue(testDocType);
	(mockDatabase.get_columns as any).mockResolvedValue(tableWithDifferentNullable);
	(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		// Act
		const diff = await engine.compareSchema('TestDocType');

		// Assert
		expect(diff.modifiedColumns).toHaveLength(1);
		expect(diff.modifiedColumns[0].fieldname).toBe('email');
		expect(diff.modifiedColumns[0].changes.nullable?.from).toBe(true);
		expect(diff.modifiedColumns[0].changes.nullable?.to).toBe(false);
		expect(diff.modifiedColumns[0].requiresDataMigration).toBe(true);
	});

	/**
	 * Test P2-006-T8: compareSchema - Modified Unique Constraint
	 */
	it('P2-006-T8: should detect unique constraint changes', async () => {
		// Arrange
		const tableWithDifferentUnique: ColumnInfo[] = testTableColumns.map(col => {
			if (col.name === 'email') {
				return {
					...col,
					unique: false // Different unique constraint
				};
			}
			return col;
		});

	(mockDocTypeEngine.getDocType as any).mockResolvedValue(testDocType);
	(mockDatabase.get_columns as any).mockResolvedValue(tableWithDifferentUnique);
	(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		// Act
		const diff = await engine.compareSchema('TestDocType');

		// Assert
		expect(diff.modifiedColumns).toHaveLength(1);
		expect(diff.modifiedColumns[0].fieldname).toBe('email');
		expect(diff.modifiedColumns[0].changes.unique?.from).toBe(false);
		expect(diff.modifiedColumns[0].changes.unique?.to).toBe(true);
	});

	/**
	 * Test P2-006-T9: compareSchema - Modified Default Value
	 */
	it('P2-006-T9: should detect default value changes', async () => {
		// Arrange
		const tableWithDifferentDefault: ColumnInfo[] = testTableColumns.map(col => {
			if (col.name === 'status') {
				return {
					...col,
					default_value: 'Inactive' // Different default value
				};
			}
			return col;
		});

	(mockDocTypeEngine.getDocType as any).mockResolvedValue(testDocType);
	(mockDatabase.get_columns as any).mockResolvedValue(tableWithDifferentDefault);
	(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		// Act
		const diff = await engine.compareSchema('TestDocType');

		// Assert
		expect(diff.modifiedColumns).toHaveLength(1);
		expect(diff.modifiedColumns[0].fieldname).toBe('status');
		expect(diff.modifiedColumns[0].changes.default?.from).toBe('Inactive');
		expect(diff.modifiedColumns[0].changes.default?.to).toBe('Active');
		expect(diff.modifiedColumns[0].requiresDataMigration).toBe(false);
	});

	/**
	 * Test P2-006-T10: compareSchema - Added Index
	 */
	it('P2-006-T10: should detect new index in DocType', async () => {
		// Arrange
		const docTypeWithNewIndex: DocType = {
			...testDocType,
			indexes: [
				...(testDocType.indexes || []),
				sampleDocIndexes.compositeIndex // New index
			]
		};

	(mockDocTypeEngine.getDocType as any).mockResolvedValue(docTypeWithNewIndex);
	(mockDatabase.get_columns as any).mockResolvedValue(testTableColumns);
	(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		// Act
		const diff = await engine.compareSchema('TestDocType');

		// Assert
		expect(diff.addedIndexes).toHaveLength(1);
		expect(diff.addedIndexes[0].name).toBe('idx_name_status');
		expect(diff.addedIndexes[0].index.columns).toEqual(['name', 'status']);
		expect(diff.addedIndexes[0].destructive).toBe(false);
		expect(diff.removedIndexes).toHaveLength(0);
	});

	/**
	 * Test P2-006-T11: compareSchema - Removed Index
	 */
	it('P2-006-T11: should detect index removed from DocType', async () => {
		// Arrange
		const tableWithExtraIndex: IndexInfo[] = [
			...testTableIndexes,
			{
				name: 'idx_obsolete',
				columns: ['obsolete_field'],
				unique: false,
				type: 'btree'
			}
		];

	(mockDocTypeEngine.getDocType as any).mockResolvedValue(testDocType);
	(mockDatabase.get_columns as any).mockResolvedValue(testTableColumns);
	(mockDatabase.get_indexes as any).mockResolvedValue(tableWithExtraIndex);

		// Act
		const diff = await engine.compareSchema('TestDocType');

		// Assert
		expect(diff.removedIndexes).toHaveLength(1);
		expect(diff.removedIndexes[0].name).toBe('idx_obsolete');
		expect(diff.removedIndexes[0].index.columns).toEqual(['obsolete_field']);
		expect(diff.removedIndexes[0].destructive).toBe(false);
		expect(diff.addedIndexes).toHaveLength(0);
	});

	/**
	 * Test P2-006-T12: compareSchema - Modified Index
	 */
	it('P2-006-T12: should detect index definition changes', async () => {
		// Arrange
		const tableWithDifferentIndex: IndexInfo[] = testTableIndexes.map(idx => {
			if (idx.name === 'idx_name_status') {
				return {
					...idx,
					columns: ['name'] // Different columns
				};
			}
			return idx;
		});

		const docTypeWithDifferentIndex: DocType = {
			...testDocType,
			indexes: [
				...(testDocType.indexes || []),
				sampleDocIndexes.compositeIndex
			]
		};

	(mockDocTypeEngine.getDocType as any).mockResolvedValue(docTypeWithDifferentIndex);
	(mockDatabase.get_columns as any).mockResolvedValue(testTableColumns);
	(mockDatabase.get_indexes as any).mockResolvedValue(tableWithDifferentIndex);

		// Act
		const diff = await engine.compareSchema('TestDocType');

		// Assert
		// Index should appear as removed + added (SQLite limitation)
		expect(diff.addedIndexes).toHaveLength(1);
		expect(diff.removedIndexes).toHaveLength(1);
		expect(diff.addedIndexes[0].name).toBe('idx_name_status');
		expect(diff.addedIndexes[0].index.columns).toEqual(['name', 'status']);
		expect(diff.removedIndexes[0].name).toBe('idx_name_status');
		expect(diff.removedIndexes[0].index.columns).toEqual(['name']);
	});

	/**
	 * Test P2-006-T13: hasChanges - Empty Diff
	 */
	it('P2-006-T13: hasChanges should return false for empty diff', async () => {
		// Arrange
		const emptyDiff: SchemaDiff = {
			addedColumns: [],
			removedColumns: [],
			modifiedColumns: [],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		};

		// Act
		const hasChanges = await engine.hasChanges(emptyDiff);

		// Assert
		expect(hasChanges).toBe(false);
	});

	/**
	 * Test P2-006-T14: hasChanges - With Changes
	 */
	it('P2-006-T14: hasChanges should return true for non-empty diff', async () => {
		// Arrange
		const diffWithChanges: SchemaDiff = {
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
			removedColumns: [],
			modifiedColumns: [],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		};

		// Act
		const hasChanges = await engine.hasChanges(diffWithChanges);

		// Assert
		expect(hasChanges).toBe(true);
	});

	/**
	 * Test P2-006-T15: requiresDataMigration - Type Changes
	 */
	it('P2-006-T15: requiresDataMigration should return true for type changes', async () => {
		// Arrange
		const diffWithTypeChanges: SchemaDiff = {
			addedColumns: [],
			removedColumns: [],
			modifiedColumns: [{
				fieldname: 'test_field',
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

		// Act
		const requiresDataMigration = await engine.requiresDataMigration(diffWithTypeChanges);

		// Assert
		expect(requiresDataMigration).toBe(true);
	});

	/**
	 * Test P2-006-T16: getTableColumns - Existing Table
	 */
	it('P2-006-T16: getTableColumns should return correct ColumnInfo array', async () => {
		// Arrange
	(mockDatabase.get_columns as any).mockResolvedValue(testTableColumns);

		// Act
		const columns = await engine.getTableColumns('tabTestDocType');

		// Assert
		expect(columns).toHaveLength(5);
		expect(columns[0].name).toBe('name');
		expect(columns[0].type).toBe('varchar');
		expect(columns[1].name).toBe('email');
		expect(columns[1].type).toBe('varchar');
		expect(columns[2].name).toBe('age');
		expect(columns[2].type).toBe('integer');
		expect(columns[3].name).toBe('status');
		expect(columns[3].type).toBe('varchar');
		expect(columns[4].name).toBe('is_active');
		expect(columns[4].type).toBe('integer');
	});

	/**
	 * Test P2-006-T17: getTableIndexes - Existing Table
	 */
	it('P2-006-T17: getTableIndexes should return correct IndexInfo array', async () => {
		// Arrange
	(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

		// Act
		const indexes = await engine.getTableIndexes('tabTestDocType');

		// Assert
		expect(indexes).toHaveLength(2);
		expect(indexes[0].name).toBe('idx_name');
		expect(indexes[0].columns).toEqual(['name']);
		expect(indexes[0].unique).toBe(false);
		expect(indexes[1].name).toBe('idx_email_unique');
		expect(indexes[1].columns).toEqual(['email']);
		expect(indexes[1].unique).toBe(true);
	});

	describe('Error Handling', () => {
		it('should throw DocTypeNotFoundError when DocType not found', async () => {
			// Arrange
			(mockDocTypeEngine.getDocType as any).mockResolvedValue(null);

			// Act & Assert
			await expect(engine.compareSchema('NonExistentDocType'))
				.rejects.toThrow(DocTypeNotFoundError);
		});

		it('should throw TableNotFoundError when table not found', async () => {
			// Arrange
			(mockDocTypeEngine.getDocType as any).mockResolvedValue(testDocType);
			(mockDatabase.get_columns as any).mockRejectedValue(new Error('Table not found'));

			// Act & Assert
			await expect(engine.compareSchema('TestDocType'))
				.rejects.toThrow(TableNotFoundError);
		});

		it('should handle schema validation errors', async () => {
			// Arrange
			const invalidDocType: DocType = {
				...testDocType,
				fields: [
					...testDocType.fields,
					{
						fieldname: 'name', // Duplicate field name
						label: 'Duplicate Name',
						fieldtype: 'Data',
						required: false,
						unique: false
					}
				]
			};

			(mockDocTypeEngine.getDocType as any).mockResolvedValue(invalidDocType);
			(mockDatabase.get_columns as any).mockResolvedValue(testTableColumns);
			(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

			// Act
			const diff = await engine.compareSchema('TestDocType');

			// Assert - Should still return diff but with validation errors
			expect(diff).toBeDefined();
			// The actual validation would be handled by SchemaDiffAnalyzer.validateSchemaDiff
		});
	});

	describe('Progress Callback', () => {
		it('should call progress callback with correct stages', async () => {
			// Arrange
			const progressCallback = vi.fn();
			(mockDocTypeEngine.getDocType as any).mockResolvedValue(testDocType);
			(mockDatabase.get_columns as any).mockResolvedValue(testTableColumns);
			(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

			// Act
			await engine.compareSchema('TestDocType', {}, progressCallback);

			// Assert
			expect(progressCallback).toHaveBeenCalledTimes(5);
			expect(progressCallback).toHaveBeenNthCalledWith(1, {
				operation: 'Loading DocType',
				percentage: 10,
				current: 'TestDocType'
			});
			expect(progressCallback).toHaveBeenNthCalledWith(2, {
				operation: 'Loading table schema',
				percentage: 30,
				current: 'TestDocType'
			});
			expect(progressCallback).toHaveBeenNthCalledWith(3, {
				operation: 'Comparing schemas',
				percentage: 50,
				current: 'TestDocType'
			});
			expect(progressCallback).toHaveBeenNthCalledWith(4, {
				operation: 'Analyzing differences',
				percentage: 80,
				current: 'TestDocType'
			});
			expect(progressCallback).toHaveBeenNthCalledWith(5, {
				operation: 'Comparison complete',
				percentage: 100,
				current: 'TestDocType'
			});
		});
	});

	describe('Caching', () => {
		it('should cache table columns and indexes', async () => {
			// Arrange
			(mockDocTypeEngine.getDocType as any).mockResolvedValue(testDocType);
			(mockDatabase.get_columns as any).mockResolvedValue(testTableColumns);
			(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

			// Act
			await engine.compareSchema('TestDocType');
			await engine.compareSchema('TestDocType'); // Second call should use cache

			// Assert
			expect(mockDatabase.get_columns).toHaveBeenCalledTimes(1);
			expect(mockDatabase.get_indexes).toHaveBeenCalledTimes(1);
		});

		it('should clear cache when requested', async () => {
			// Arrange
			(mockDocTypeEngine.getDocType as any).mockResolvedValue(testDocType);
			(mockDatabase.get_columns as any).mockResolvedValue(testTableColumns);
			(mockDatabase.get_indexes as any).mockResolvedValue(testTableIndexes);

			// Act
			await engine.compareSchema('TestDocType');
			engine.clearCache('tabTestDocType');
			await engine.compareSchema('TestDocType');

			// Assert
			expect(mockDatabase.get_columns).toHaveBeenCalledTimes(2);
			expect(mockDatabase.get_indexes).toHaveBeenCalledTimes(2);
		});
	});
});