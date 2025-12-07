/**
 * Field Comparator Tests
 * 
 * This file contains tests for FieldComparator class, which provides methods for comparing
 * DocType fields with database columns, detecting differences, and determining migration
 * requirements.
 */

import { describe, it, expect } from 'vitest';
import { FieldComparator } from '../comparators/field-comparator';
import type { DocField } from '../../doctype/types';
import type { ColumnInfo } from '../../../core/database/types';
import type { FieldChange, ColumnDefinition } from '../types';
import type { SchemaComparisonOptions } from '../schema-comparison-types';
import { sampleDocFields, sampleColumnInfo } from './fixtures/test-data';

describe('FieldComparator', () => {
	/**
	 * Test: compareFieldToColumn - Identical Field
	 */
	it('should compare identical field and column', () => {
		// Arrange
		const field: DocField = {
			fieldname: 'name',
			label: 'Name',
			fieldtype: 'Data',
			length: 100,
			required: true,
			unique: false
		};

		const column: ColumnInfo = {
			name: 'name',
			type: 'varchar',
			nullable: false,
			default_value: null,
			primary_key: false,
			auto_increment: false,
			unique: false
		};

		// Act
		const result = FieldComparator.compareFieldToColumn(field, column);

		// Assert
		expect(result).toBeNull();
	});

	/**
	 * Test: compareFieldToColumn - Type Differences
	 */
	it('should detect type differences', () => {
		// Arrange
		const field: DocField = {
			fieldname: 'age',
			label: 'Age',
			fieldtype: 'Int',
			required: false,
			unique: false
		};

		const column: ColumnInfo = {
			name: 'age',
			type: 'text', // Different type
			nullable: true,
			default_value: null,
			primary_key: false,
			auto_increment: false,
			unique: false
		};

		// Act
		const result = FieldComparator.compareFieldToColumn(field, column);

		// Assert
		expect(result).not.toBeNull();
		expect(result?.fieldname).toBe('age');
		expect(result?.changes.type?.from).toBe('text');
		expect(result?.changes.type?.to).toBe('integer');
		expect(result?.requiresDataMigration).toBe(true);
		expect(result?.destructive).toBe(true);
	});

	/**
	 * Test: compareFieldToColumn - Length Differences
	 */
	it('should detect length differences', () => {
		// Arrange
		const field: DocField = {
			fieldname: 'title',
			label: 'Title',
			fieldtype: 'Data',
			length: 200,
			required: true,
			unique: false
		};

		const column: ColumnInfo = {
			name: 'title',
			type: 'varchar(100)', // Different length
			nullable: false,
			default_value: null,
			primary_key: false,
			auto_increment: false,
			unique: false
		};

		// Act
		const result = FieldComparator.compareFieldToColumn(field, column);

		// Assert
		expect(result).not.toBeNull();
		expect(result?.fieldname).toBe('title');
		expect(result?.changes.length?.from).toBe(100);
		expect(result?.changes.length?.to).toBe(200);
		expect(result?.requiresDataMigration).toBe(false);
		expect(result?.destructive).toBe(false);
	});

	/**
	 * Test: compareFieldToColumn - Required Constraint Differences
	 */
	it('should detect required constraint differences', () => {
		// Arrange
		const field: DocField = {
			fieldname: 'email',
			label: 'Email',
			fieldtype: 'Data',
			required: true, // Different constraint
			unique: false
		};

		const column: ColumnInfo = {
			name: 'email',
			type: 'varchar',
			nullable: true, // Different constraint
			default_value: null,
			primary_key: false,
			auto_increment: false,
			unique: false
		};

		// Act
		const result = FieldComparator.compareFieldToColumn(field, column);

		// Assert
		expect(result).not.toBeNull();
		expect(result?.fieldname).toBe('email');
		expect(result?.changes.nullable?.from).toBe(true);
		expect(result?.changes.nullable?.to).toBe(false);
		expect(result?.requiresDataMigration).toBe(true);
	});

	/**
	 * Test: compareFieldToColumn - Unique Constraint Differences
	 */
	it('should detect unique constraint differences', () => {
		// Arrange
		const field: DocField = {
			fieldname: 'username',
			label: 'Username',
			fieldtype: 'Data',
			required: false,
			unique: true // Different constraint
		};

		const column: ColumnInfo = {
			name: 'username',
			type: 'varchar',
			nullable: true,
			default_value: null,
			primary_key: false,
			auto_increment: false,
			unique: false // Different constraint
		};

		// Act
		const result = FieldComparator.compareFieldToColumn(field, column);

		// Assert
		expect(result).not.toBeNull();
		expect(result?.fieldname).toBe('username');
		expect(result?.changes.unique?.from).toBe(false);
		expect(result?.changes.unique?.to).toBe(true);
		expect(result?.requiresDataMigration).toBe(true);
	});

	/**
	 * Test: compareFieldToColumn - Default Value Differences
	 */
	it('should detect default value differences', () => {
		// Arrange
		const field: DocField = {
			fieldname: 'status',
			label: 'Status',
			fieldtype: 'Select',
			options: 'Active\nInactive',
			default: 'Active', // Different default
			required: false,
			unique: false
		};

		const column: ColumnInfo = {
			name: 'status',
			type: 'varchar',
			nullable: true,
			default_value: 'Inactive', // Different default
			primary_key: false,
			auto_increment: false,
			unique: false
		};

		// Act
		const result = FieldComparator.compareFieldToColumn(field, column);

		// Assert
		expect(result).not.toBeNull();
		expect(result?.fieldname).toBe('status');
		expect(result?.changes.default?.from).toBe('Inactive');
		expect(result?.changes.default?.to).toBe('Active');
		expect(result?.requiresDataMigration).toBe(false);
	});

	/**
	 * Test: findMatchingColumn - Exact Match
	 */
	it('should find exact column match', () => {
		// Arrange
		const field: DocField = {
			fieldname: 'name',
			label: 'Name',
			fieldtype: 'Data',
			required: true,
			unique: false
		};

		const columns: ColumnInfo[] = [
			{
				name: 'id',
				type: 'integer',
				nullable: false,
				default_value: null,
				primary_key: true,
				auto_increment: true,
				unique: true
			},
			{
				name: 'name',
				type: 'varchar',
				nullable: false,
				default_value: null,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			{
				name: 'email',
				type: 'varchar',
				nullable: true,
				default_value: null,
				primary_key: false,
				auto_increment: false,
				unique: true
			}
		];

		// Act
		const result = FieldComparator.findMatchingColumn(field, columns);

		// Assert
		expect(result).not.toBeNull();
		expect(result?.name).toBe('name');
		expect(result?.type).toBe('varchar');
	});

	/**
	 * Test: findMatchingColumn - No Match
	 */
	it('should return null when no matching column found', () => {
		// Arrange
		const field: DocField = {
			fieldname: 'missing_field',
			label: 'Missing Field',
			fieldtype: 'Data',
			required: false,
			unique: false
		};

		const columns: ColumnInfo[] = [
			{
				name: 'id',
				type: 'integer',
				nullable: false,
				default_value: null,
				primary_key: true,
				auto_increment: true,
				unique: true
			},
			{
				name: 'name',
				type: 'varchar',
				nullable: false,
				default_value: null,
				primary_key: false,
				auto_increment: false,
				unique: false
			}
		];

		// Act
		const result = FieldComparator.findMatchingColumn(field, columns);

		// Assert
		expect(result).toBeNull();
	});

	/**
	 * Test: findMatchingColumn - Case Insensitive Match
	 */
	it('should handle case insensitive matching', () => {
		// Arrange
		const field: DocField = {
			fieldname: 'Name',
			label: 'Name',
			fieldtype: 'Data',
			required: true,
			unique: false
		};

		const columns: ColumnInfo[] = [
			{
				name: 'name', // Different case
				type: 'varchar',
				nullable: false,
				default_value: null,
				primary_key: false,
				auto_increment: false,
				unique: false
			}
		];

		const options: SchemaComparisonOptions = {
			caseSensitive: false
		};

		// Act
		const result = FieldComparator.findMatchingColumn(field, columns, options);

		// Assert
		expect(result).not.toBeNull();
		expect(result?.name).toBe('name');
	});

	/**
	 * Test: findMatchingColumn - Old Field Name Match
	 */
	it('should match using old field name', () => {
		// Arrange
		const field: DocField = {
			fieldname: 'new_name',
			label: 'New Name',
			fieldtype: 'Data',
			old_fieldname: 'old_name', // Old field name
			required: true,
			unique: false
		};

		const columns: ColumnInfo[] = [
			{
				name: 'old_name', // Should match old name
				type: 'varchar',
				nullable: false,
				default_value: null,
				primary_key: false,
				auto_increment: false,
				unique: false
			}
		];

		// Act
		const result = FieldComparator.findMatchingColumn(field, columns);

		// Assert
		expect(result).not.toBeNull();
		expect(result?.name).toBe('old_name');
	});

	/**
	 * Test: fieldToColumnDefinition
	 */
	it('should convert DocField to ColumnDefinition', () => {
		// Arrange
		const field: DocField = {
			fieldname: 'email',
			label: 'Email',
			fieldtype: 'Data',
			length: 255,
			required: false,
			unique: true,
			default: 'test@example.com'
		};

		// Act
		const result = FieldComparator.fieldToColumnDefinition(field);

		// Assert
		expect(result).toEqual({
			name: 'email',
			type: 'varchar(255)',
			nullable: true,
			default_value: 'test@example.com',
			primary_key: false,
			auto_increment: false,
			unique: true,
			length: 255
		});
	});

	/**
	 * Test: columnInfoToColumnDefinition
	 */
	it('should convert ColumnInfo to ColumnDefinition', () => {
		// Arrange
		const column: ColumnInfo = {
			name: 'age',
			type: 'integer',
			nullable: true,
			default_value: 0,
			primary_key: false,
			auto_increment: false,
			unique: false
		};

		// Act
		const result = FieldComparator.columnInfoToColumnDefinition(column);

		// Assert
		expect(result).toEqual({
			name: 'age',
			type: 'integer',
			nullable: true,
			default_value: 0,
			primary_key: false,
			auto_increment: false,
			unique: false
		});
	});

	/**
	 * Test: mapFieldTypeToSQLiteType - Standard Types
	 */
	it('should map standard field types to SQLite types', () => {
		// Arrange & Act & Assert
		expect(FieldComparator.mapFieldTypeToSQLiteType('Data')).toBe('text');
		expect(FieldComparator.mapFieldTypeToSQLiteType('Int')).toBe('integer');
		expect(FieldComparator.mapFieldTypeToSQLiteType('Float')).toBe('real');
		expect(FieldComparator.mapFieldTypeToSQLiteType('Check')).toBe('integer');
		expect(FieldComparator.mapFieldTypeToSQLiteType('Select')).toBe('text');
		expect(FieldComparator.mapFieldTypeToSQLiteType('Link')).toBe('text');
		expect(FieldComparator.mapFieldTypeToSQLiteType('Date')).toBe('text');
		expect(FieldComparator.mapFieldTypeToSQLiteType('Currency')).toBe('real');
	});

	/**
	 * Test: mapFieldTypeToSQLiteType - With Length
	 */
	it('should include length in mapped type for text fields', () => {
		// Arrange
		const field: DocField = {
			fieldname: 'title',
			label: 'Title',
			fieldtype: 'Data',
			length: 100
		};

		// Act
		const result = FieldComparator.mapFieldTypeToSQLiteType('Data', field);

		// Assert
		expect(result).toBe('varchar(100)');
	});

	/**
	 * Test: mapFieldTypeToSQLiteType - Custom Mappings
	 */
	it('should use custom field type mappings', () => {
		// Arrange
		const customMappings = {
			'CustomType': 'custom_sqlite_type'
		};

		// Act
		const result = FieldComparator.mapFieldTypeToSQLiteType('CustomType', undefined, customMappings);

		// Assert
		expect(result).toBe('custom_sqlite_type');
	});

	/**
	 * Test: areTypesCompatible - Compatible Types
	 */
	it('should identify compatible types', () => {
		// Arrange & Act & Assert
		expect(FieldComparator.areTypesCompatible('text', 'varchar')).toBe(true);
		expect(FieldComparator.areTypesCompatible('varchar', 'text')).toBe(true);
		expect(FieldComparator.areTypesCompatible('integer', 'int')).toBe(true);
		expect(FieldComparator.areTypesCompatible('integer', 'real')).toBe(true);
		expect(FieldComparator.areTypesCompatible('real', 'float')).toBe(true);
		expect(FieldComparator.areTypesCompatible('real', 'decimal')).toBe(true);
	});

	/**
	 * Test: areTypesCompatible - Incompatible Types
	 */
	it('should identify incompatible types', () => {
		// Arrange & Act & Assert
		expect(FieldComparator.areTypesCompatible('text', 'integer')).toBe(false);
		expect(FieldComparator.areTypesCompatible('varchar', 'real')).toBe(false);
		expect(FieldComparator.areTypesCompatible('integer', 'text')).toBe(false);
	});

	/**
	 * Test: requiresDataMigration - Type Conversion
	 */
	it('should determine data migration requirement for type changes', () => {
		// Arrange
		const changeWithMigration: FieldChange = {
			fieldname: 'test_field',
			changes: {
				type: { from: 'text', to: 'integer' }
			},
			requiresDataMigration: true,
			destructive: false
		};

		const changeWithoutMigration: FieldChange = {
			fieldname: 'test_field',
			changes: {
				length: { from: 100, to: 200 }
			},
			requiresDataMigration: false,
			destructive: false
		};

		// Act & Assert
		expect(FieldComparator.requiresDataMigration(changeWithMigration)).toBe(true);
		expect(FieldComparator.requiresDataMigration(changeWithoutMigration)).toBe(false);
	});

	/**
	 * Test: isDestructive - Destructive Changes
	 */
	it('should identify destructive changes', () => {
		// Arrange
		const destructiveChange: FieldChange = {
			fieldname: 'test_field',
			changes: {
				type: { from: 'text', to: 'integer' }
			},
			requiresDataMigration: true,
			destructive: true
		};

		const nonDestructiveChange: FieldChange = {
			fieldname: 'test_field',
			changes: {
				length: { from: 100, to: 200 }
			},
			requiresDataMigration: false,
			destructive: false
		};

		// Act & Assert
		expect(FieldComparator.isDestructive(destructiveChange)).toBe(true);
		expect(FieldComparator.isDestructive(nonDestructiveChange)).toBe(false);
	});

	/**
	 * Test: getChangeComplexity
	 */
	it('should calculate change complexity score', () => {
		// Arrange
		const simpleChange: FieldChange = {
			fieldname: 'simple_field',
			changes: {
				default: { from: null, to: 'default_value' }
			},
			requiresDataMigration: false,
			destructive: false
		};

		const complexChange: FieldChange = {
			fieldname: 'complex_field',
			changes: {
				type: { from: 'text', to: 'integer' },
				nullable: { from: true, to: false },
				unique: { from: false, to: true }
			},
			requiresDataMigration: true,
			destructive: true
		};

		// Act
		const simpleScore = FieldComparator.getChangeComplexity(simpleChange);
		const complexScore = FieldComparator.getChangeComplexity(complexChange);

		// Assert
		expect(simpleScore).toBeLessThan(complexScore);
		expect(simpleScore).toBe(2); // Base score for default change
		expect(complexScore).toBeGreaterThan(20); // Type change + constraints
	});

	/**
	 * Test: isSystemField
	 */
	it('should identify system fields', () => {
		// Arrange & Act & Assert
		expect(FieldComparator.isSystemField('name')).toBe(true);
		expect(FieldComparator.isSystemField('creation')).toBe(true);
		expect(FieldComparator.isSystemField('modified')).toBe(true);
		expect(FieldComparator.isSystemField('modified_by')).toBe(true);
		expect(FieldComparator.isSystemField('owner')).toBe(true);
		expect(FieldComparator.isSystemField('docstatus')).toBe(true);
		expect(FieldComparator.isSystemField('idx')).toBe(true);
		expect(FieldComparator.isSystemField('parent')).toBe(true);
		expect(FieldComparator.isSystemField('parentfield')).toBe(true);
		expect(FieldComparator.isSystemField('parenttype')).toBe(true);
		expect(FieldComparator.isSystemField('custom_field')).toBe(false);
		expect(FieldComparator.isSystemField('user_field')).toBe(false);
	});

	/**
	 * Test: Complex Field Comparison
	 */
	it('should handle complex field comparison with multiple changes', () => {
		// Arrange
		const field: DocField = {
			fieldname: 'complex_field',
			label: 'Complex Field',
			fieldtype: 'Data',
			length: 200,
			required: true,
			unique: true,
			default: 'new_default'
		};

		const column: ColumnInfo = {
			name: 'complex_field',
			type: 'varchar(100)', // Different length
			nullable: true, // Different nullable
			default_value: 'old_default', // Different default
			primary_key: false,
			auto_increment: false,
			unique: false // Different unique
		};

		// Act
		const result = FieldComparator.compareFieldToColumn(field, column);

		// Assert
		expect(result).not.toBeNull();
		expect(result?.fieldname).toBe('complex_field');
		expect(result?.changes.length?.from).toBe(100);
		expect(result?.changes.length?.to).toBe(200);
		expect(result?.changes.nullable?.from).toBe(true);
		expect(result?.changes.nullable?.to).toBe(false);
		expect(result?.changes.unique?.from).toBe(false);
		expect(result?.changes.unique?.to).toBe(true);
		expect(result?.changes.default?.from).toBe('old_default');
		expect(result?.changes.default?.to).toBe('new_default');
		expect(result?.requiresDataMigration).toBe(true);
	});

	/**
	 * Test: Precision Handling
	 */
	it('should handle precision for numeric fields', () => {
		// Arrange
		const field: DocField = {
			fieldname: 'price',
			label: 'Price',
			fieldtype: 'Currency',
			precision: 2,
			required: false,
			unique: false
		};

		const column: ColumnInfo = {
			name: 'price',
			type: 'decimal(10,4)', // Different precision
			nullable: true,
			default_value: null,
			primary_key: false,
			auto_increment: false,
			unique: false
		};

		// Act
		const result = FieldComparator.compareFieldToColumn(field, column);

		// Assert
		expect(result).not.toBeNull();
		expect(result?.fieldname).toBe('price');
		expect(result?.changes.precision?.from).toBe(4);
		expect(result?.changes.precision?.to).toBe(2);
		expect(result?.destructive).toBe(false); // Increasing precision is not destructive
	});

	/**
	 * Test: Options Handling
	 */
	it('should handle comparison options correctly', () => {
		// Arrange
		const field: DocField = {
			fieldname: 'test_field',
			label: 'Test Field',
			fieldtype: 'Data',
			required: false,
			unique: false
		};

		const column: ColumnInfo = {
			name: 'test_field',
			type: 'varchar',
			nullable: true,
			default_value: 'old_default',
			primary_key: false,
			auto_increment: false,
			unique: false
		};

		const options: SchemaComparisonOptions = {
			ignoreDefaultValues: true
		};

		// Act
		const result = FieldComparator.compareFieldToColumn(field, column, options);

		// Assert
		expect(result).toBeNull(); // Should ignore default difference
	});
});