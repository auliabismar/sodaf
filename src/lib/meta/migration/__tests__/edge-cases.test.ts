/**
 * Schema Comparison Edge Cases Tests
 * 
 * This file contains tests for edge cases and special scenarios in schema comparison,
 * including empty schemas, special characters, reserved words, and error conditions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SchemaComparisonEngine } from '../schema-comparison-engine';
import type { Database } from '../../../core/database/database';
import type { DocTypeEngine } from '../../doctype/doctype-engine';
import type { DocType, DocField, DocIndex } from '../../doctype/types';
import type { ColumnInfo, IndexInfo } from '../../../core/database/types';
import type { SchemaComparisonOptions } from '../schema-comparison-types';
import {
	DocTypeNotFoundError,
	TableNotFoundError,
	SchemaValidationError,
	FieldComparisonError,
	IndexComparisonError
} from '../schema-comparison-errors';

describe('Schema Comparison Edge Cases Tests', () => {
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
	 * Test: Empty DocType
	 */
	it('should handle empty DocType', async () => {
		// Arrange
		const emptyDocType: DocType = {
			name: 'EmptyDocType',
			module: 'Test',
			fields: [],
			permissions: [],
			indexes: []
		};

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(emptyDocType);
		(mockDatabase.get_columns as any).mockResolvedValue([]);
		(mockDatabase.get_indexes as any).mockResolvedValue([]);

		// Act
		const diff = await engine.compareSchema('EmptyDocType');

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
	});

	/**
	 * Test: Empty Table Schema
	 */
	it('should handle empty table schema', async () => {
		// Arrange
		const docTypeWithFields: DocType = {
			name: 'DocTypeWithFields',
			module: 'Test',
			fields: [
				{
					fieldname: 'name',
					label: 'Name',
					fieldtype: 'Data',
					required: true
				},
				{
					fieldname: 'email',
					label: 'Email',
					fieldtype: 'Data',
					required: false
				}
			],
			permissions: [],
			indexes: []
		};

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(docTypeWithFields);
		(mockDatabase.get_columns as any).mockResolvedValue([]);
		(mockDatabase.get_indexes as any).mockResolvedValue([]);

		// Act
		const diff = await engine.compareSchema('DocTypeWithFields');

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(2);
		expect(diff.addedColumns.map(col => col.fieldname)).toContain('name');
		expect(diff.addedColumns.map(col => col.fieldname)).toContain('email');
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
	});

	/**
	 * Test: Special Characters in Field Names
	 */
	it('should handle special characters in field names', async () => {
		// Arrange
		const docTypeWithSpecialChars: DocType = {
			name: 'SpecialCharsDocType',
			module: 'Test',
			fields: [
				{
					fieldname: 'field-with-dashes',
					label: 'Field with Dashes',
					fieldtype: 'Data'
				},
				{
					fieldname: 'field_with_underscores',
					label: 'Field with Underscores',
					fieldtype: 'Data'
				},
				{
					fieldname: 'field.with.dots',
					label: 'Field with Dots',
					fieldtype: 'Data'
				},
				{
					fieldname: 'field with spaces',
					label: 'Field with Spaces',
					fieldtype: 'Data'
				},
				{
					fieldname: 'field$with#special@chars!',
					label: 'Field with Special Chars',
					fieldtype: 'Data'
				}
			],
			permissions: [],
			indexes: []
		};

		const tableColumnsWithSpecialChars: ColumnInfo[] = [
			{
				name: 'field-with-dashes',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'field_with_underscores',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'field.with.dots',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'field with spaces',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'field$with#special@chars!',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			}
		];

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(docTypeWithSpecialChars);
		(mockDatabase.get_columns as any).mockResolvedValue(tableColumnsWithSpecialChars);
		(mockDatabase.get_indexes as any).mockResolvedValue([]);

		// Act
		const diff = await engine.compareSchema('SpecialCharsDocType');

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
	});

	/**
	 * Test: Reserved Words as Field Names
	 */
	it('should handle reserved words as field names', async () => {
		// Arrange
		const docTypeWithReservedWords: DocType = {
			name: 'ReservedWordsDocType',
			module: 'Test',
			fields: [
				{
					fieldname: 'select',
					label: 'Select',
					fieldtype: 'Data'
				},
				{
					fieldname: 'insert',
					label: 'Insert',
					fieldtype: 'Data'
				},
				{
					fieldname: 'update',
					label: 'Update',
					fieldtype: 'Data'
				},
				{
					fieldname: 'delete',
					label: 'Delete',
					fieldtype: 'Data'
				},
				{
					fieldname: 'create',
					label: 'Create',
					fieldtype: 'Data'
				},
				{
					fieldname: 'drop',
					label: 'Drop',
					fieldtype: 'Data'
				},
				{
					fieldname: 'table',
					label: 'Table',
					fieldtype: 'Data'
				},
				{
					fieldname: 'index',
					label: 'Index',
					fieldtype: 'Data'
				}
			],
			permissions: [],
			indexes: []
		};

		const tableColumnsWithReservedWords: ColumnInfo[] = [
			{
				name: 'select',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'insert',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'update',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'delete',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'create',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'drop',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'table',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'index',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			}
		];

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(docTypeWithReservedWords);
		(mockDatabase.get_columns as any).mockResolvedValue(tableColumnsWithReservedWords);
		(mockDatabase.get_indexes as any).mockResolvedValue([]);

		// Act
		const diff = await engine.compareSchema('ReservedWordsDocType');

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
	});

	/**
	 * Test: Very Long Field Names
	 */
	it('should handle very long field names', async () => {
		// Arrange
		const veryLongFieldName = 'a'.repeat(200); // 200 characters
		const docTypeWithLongFieldNames: DocType = {
			name: 'LongFieldNamesDocType',
			module: 'Test',
			fields: [
				{
					fieldname: veryLongFieldName,
					label: 'Very Long Field Name',
					fieldtype: 'Data'
				}
			],
			permissions: [],
			indexes: []
		};

		const tableColumnsWithLongNames: ColumnInfo[] = [
			{
				name: veryLongFieldName,
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			}
		];

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(docTypeWithLongFieldNames);
		(mockDatabase.get_columns as any).mockResolvedValue(tableColumnsWithLongNames);
		(mockDatabase.get_indexes as any).mockResolvedValue([]);

		// Act
		const diff = await engine.compareSchema('LongFieldNamesDocType');

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
	});

	/**
	 * Test: Extreme Field Values
	 */
	it('should handle extreme field values', async () => {
		// Arrange
		const docTypeWithExtremeValues: DocType = {
			name: 'ExtremeValuesDocType',
			module: 'Test',
			fields: [
				{
					fieldname: 'very_long_text',
					label: 'Very Long Text',
					fieldtype: 'Long Text',
					length: 1000000 // Very long text field
				},
				{
					fieldname: 'high_precision_number',
					label: 'High Precision Number',
					fieldtype: 'Float',
					precision: 100 // Very high precision
				},
				{
					fieldname: 'zero_length_field',
					label: 'Zero Length Field',
					fieldtype: 'Data',
					length: 0 // Zero length
				},
				{
					fieldname: 'negative_length_field',
					label: 'Negative Length Field',
					fieldtype: 'Data',
					length: -1 // Negative length (should be handled gracefully)
				}
			],
			permissions: [],
			indexes: []
		};

		const tableColumnsWithExtremeValues: ColumnInfo[] = [
			{
				name: 'very_long_text',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false,
			},
			{
				name: 'high_precision_number',
				type: 'real',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false,
			},
			{
				name: 'zero_length_field',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false,
			},
			{
				name: 'negative_length_field',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false,
			}
		];

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(docTypeWithExtremeValues);
		(mockDatabase.get_columns as any).mockResolvedValue(tableColumnsWithExtremeValues);
		(mockDatabase.get_indexes as any).mockResolvedValue([]);

		// Act
		const diff = await engine.compareSchema('ExtremeValuesDocType');

		// Assert
		expect(diff).toBeDefined();
		// Should handle extreme values gracefully
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
	});

	/**
	 * Test: Unicode Characters in Field Names
	 */
	it('should handle unicode characters in field names', async () => {
		// Arrange
		const docTypeWithUnicode: DocType = {
			name: 'UnicodeDocType',
			module: 'Test',
			fields: [
				{
					fieldname: 'campo_nombre',
					label: 'Campo Nombre',
					fieldtype: 'Data'
				},
				{
					fieldname: 'имя_поля',
					label: 'Имя Поля',
					fieldtype: 'Data'
				},
				{
					fieldname: 'フィールド名',
					label: 'フィールド名',
					fieldtype: 'Data'
				},
				{
					fieldname: '字段名',
					label: '字段名',
					fieldtype: 'Data'
				},
				{
					fieldname: 'nom_du_champ',
					label: 'Nom du Champ',
					fieldtype: 'Data'
				}
			],
			permissions: [],
			indexes: []
		};

		const tableColumnsWithUnicode: ColumnInfo[] = [
			{
				name: 'campo_nombre',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'имя_поля',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'フィールド名',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: '字段名',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'nom_du_champ',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			}
		];

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(docTypeWithUnicode);
		(mockDatabase.get_columns as any).mockResolvedValue(tableColumnsWithUnicode);
		(mockDatabase.get_indexes as any).mockResolvedValue([]);

		// Act
		const diff = await engine.compareSchema('UnicodeDocType');

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
	});

	/**
	 * Test: Case Sensitivity Edge Cases
	 */
	it('should handle case sensitivity edge cases', async () => {
		// Arrange
		const docTypeWithMixedCase: DocType = {
			name: 'MixedCaseDocType',
			module: 'Test',
			fields: [
				{
					fieldname: 'Name',
					label: 'Name',
					fieldtype: 'Data'
				},
				{
					fieldname: 'name',
					label: 'name',
					fieldtype: 'Data'
				},
				{
					fieldname: 'NAME',
					label: 'NAME',
					fieldtype: 'Data'
				},
				{
					fieldname: 'NaMe',
					label: 'NaMe',
					fieldtype: 'Data'
				}
			],
			permissions: [],
			indexes: []
		};

		const tableColumnsWithMixedCase: ColumnInfo[] = [
			{
				name: 'name',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'Name',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'NAME',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'NaMe',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			}
		];

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(docTypeWithMixedCase);
		(mockDatabase.get_columns as any).mockResolvedValue(tableColumnsWithMixedCase);
		(mockDatabase.get_indexes as any).mockResolvedValue([]);

		// Test with case sensitive options
		const caseSensitiveOptions: SchemaComparisonOptions = {
			caseSensitive: true
		};

		// Act
		const diff = await engine.compareSchema('MixedCaseDocType', caseSensitiveOptions);

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
	});

	/**
	 * Test: Null and Undefined Values
	 */
	it('should handle null and undefined values gracefully', async () => {
		// Arrange
		const docTypeWithNullValues: DocType = {
			name: 'NullValuesDocType',
			module: 'Test',
			fields: [
				{
					fieldname: 'field_with_null_default',
					label: 'Field with Null Default',
					fieldtype: 'Data',
					default: null
				},
				{
					fieldname: 'field_with_undefined_default',
					label: 'Field with Undefined Default',
					fieldtype: 'Data',
					default: undefined
				},
				{
					fieldname: 'field_with_empty_string_default',
					label: 'Field with Empty String Default',
					fieldtype: 'Data',
					default: ''
				}
			],
			permissions: [],
			indexes: []
		};

		const tableColumnsWithNullValues: ColumnInfo[] = [
			{
				name: 'field_with_null_default',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false,
				default_value: null
			},
			{
				name: 'field_with_undefined_default',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false,
				default_value: undefined
			},
			{
				name: 'field_with_empty_string_default',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false,
				default_value: ''
			}
		];

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(docTypeWithNullValues);
		(mockDatabase.get_columns as any).mockResolvedValue(tableColumnsWithNullValues);
		(mockDatabase.get_indexes as any).mockResolvedValue([]);

		// Act
		const diff = await engine.compareSchema('NullValuesDocType');

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
	});

	/**
	 * Test: Database Connection Errors
	 */
	it('should handle database connection errors gracefully', async () => {
		// Arrange
		(mockDocTypeEngine.getDocType as any).mockResolvedValue({
			name: 'TestDocType',
			module: 'Test',
			fields: [],
			permissions: [],
			indexes: []
		});

		// Mock database connection error
		(mockDatabase.get_columns as any).mockRejectedValue(new Error('Connection lost'));
		(mockDatabase.get_indexes as any).mockRejectedValue(new Error('Connection lost'));

		// Act & Assert
		await expect(engine.compareSchema('TestDocType'))
			.rejects.toThrow('Connection lost');
	});

	/**
	 * Test: Invalid DocType Structure
	 */
	it('should handle invalid DocType structure gracefully', async () => {
		// Arrange
		const invalidDocType: any = {
			name: 'InvalidDocType',
			// Missing required fields
			fields: null,
			indexes: 'not an array'
		};

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(invalidDocType);

		// Act & Assert
		await expect(engine.compareSchema('InvalidDocType'))
			.rejects.toThrow(SchemaValidationError);
	});

	/**
	 * Test: Missing Indexes Array
	 */
	it('should handle missing indexes array', async () => {
		// Arrange
		const docTypeWithoutIndexes: DocType = {
			name: 'DocTypeWithoutIndexes',
			module: 'Test',
			fields: [
				{
					fieldname: 'name',
					label: 'Name',
					fieldtype: 'Data'
				}
			],
			permissions: []
			// indexes property is missing
		};

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(docTypeWithoutIndexes);
		(mockDatabase.get_columns as any).mockResolvedValue([
			{
				name: 'name',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			}
		]);
		(mockDatabase.get_indexes as any).mockResolvedValue([]);

		// Act
		const diff = await engine.compareSchema('DocTypeWithoutIndexes');

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
	});

	/**
	 * Test: Circular Reference in DocType
	 */
	it('should handle circular references in DocType', async () => {
		// Arrange
		const docTypeWithCircularRef: any = {
			name: 'CircularRefDocType',
			module: 'Test',
			fields: [
				{
					fieldname: 'name',
					label: 'Name',
					fieldtype: 'Data'
				}
			],
			permissions: [],
			indexes: []
		};

		// Create circular reference
		docTypeWithCircularRef.self = docTypeWithCircularRef;

		(mockDocTypeEngine.getDocType as any).mockResolvedValue(docTypeWithCircularRef);
		(mockDatabase.get_columns as any).mockResolvedValue([
			{
				name: 'name',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			}
		]);
		(mockDatabase.get_indexes as any).mockResolvedValue([]);

		// Act
		const diff = await engine.compareSchema('CircularRefDocType');

		// Assert
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
	});
});