/**
 * Index Comparator Tests
 * 
 * This file contains tests for IndexComparator class, which provides methods for comparing
 * DocType indexes with database indexes, detecting differences, and determining migration
 * requirements.
 */

import { describe, it, expect } from 'vitest';
import { IndexComparator } from '../comparators/index-comparator';
import type { DocIndex } from '../../doctype/types';
import type { IndexInfo } from '../../../core/database/types';
import type { IndexDefinition } from '../types';
import { sampleDocIndexes, sampleIndexInfo } from './fixtures/test-data';

describe('IndexComparator', () => {
	/**
	 * Test: compareIndexToIndex - Identical Index
	 */
	it('should compare identical indexes', () => {
		// Arrange
		const docIndex: DocIndex = {
			name: 'idx_test',
			columns: ['name', 'email'],
			unique: false,
			type: 'btree'
		};

		const dbIndex: IndexInfo = {
			name: 'idx_test',
			columns: ['name', 'email'],
			unique: false,
			type: 'btree'
		};

		// Act
		const result = IndexComparator.compareIndexToIndex(docIndex, dbIndex);

		// Assert
		expect(result).toBe(true);
	});

	/**
	 * Test: compareIndexToIndex - Different Uniqueness
	 */
	it('should detect uniqueness differences', () => {
		// Arrange
		const docIndex: DocIndex = {
			name: 'idx_test',
			columns: ['email'],
			unique: true,
			type: 'btree'
		};

		const dbIndex: IndexInfo = {
			name: 'idx_test',
			columns: ['email'],
			unique: false, // Different uniqueness
			type: 'btree'
		};

		// Act
		const result = IndexComparator.compareIndexToIndex(docIndex, dbIndex);

		// Assert
		expect(result).toBe(false);
	});

	/**
	 * Test: compareIndexToIndex - Different Columns
	 */
	it('should detect column differences', () => {
		// Arrange
		const docIndex: DocIndex = {
			name: 'idx_test',
			columns: ['name', 'email'],
			unique: false,
			type: 'btree'
		};

		const dbIndex: IndexInfo = {
			name: 'idx_test',
			columns: ['name'], // Different columns
			unique: false,
			type: 'btree'
		};

		// Act
		const result = IndexComparator.compareIndexToIndex(docIndex, dbIndex);

		// Assert
		expect(result).toBe(false);
	});

	/**
	 * Test: compareIndexToIndex - Different Column Order
	 */
	it('should detect column order differences', () => {
		// Arrange
		const docIndex: DocIndex = {
			name: 'idx_test',
			columns: ['name', 'email'],
			unique: false,
			type: 'btree'
		};

		const dbIndex: IndexInfo = {
			name: 'idx_test',
			columns: ['email', 'name'], // Different order
			unique: false,
			type: 'btree'
		};

		// Act
		const result = IndexComparator.compareIndexToIndex(docIndex, dbIndex);

		// Assert
		expect(result).toBe(false);
	});

	/**
	 * Test: compareIndexToIndex - Different Types
	 */
	it('should detect index type differences', () => {
		// Arrange
		const docIndex: DocIndex = {
			name: 'idx_test',
			columns: ['name'],
			unique: false,
			type: 'hash'
		};

		const dbIndex: IndexInfo = {
			name: 'idx_test',
			columns: ['name'],
			unique: false,
			type: 'btree' // Different type
		};

		// Act
		const result = IndexComparator.compareIndexToIndex(docIndex, dbIndex);

		// Assert
		expect(result).toBe(false);
	});

	/**
	 * Test: findMatchingIndex - Exact Match
	 */
	it('should find exact index match', () => {
		// Arrange
		const docIndex: DocIndex = {
			name: 'idx_name',
			columns: ['name'],
			unique: false,
			type: 'btree'
		};

		const dbIndexes: IndexInfo[] = [
			{
				name: 'idx_email',
				columns: ['email'],
				unique: true,
				type: 'btree'
			},
			{
				name: 'idx_name',
				columns: ['name'],
				unique: false,
				type: 'btree'
			},
			{
				name: 'idx_status',
				columns: ['status'],
				unique: false,
				type: 'btree'
			}
		];

		// Act
		const result = IndexComparator.findMatchingIndex(docIndex, dbIndexes);

		// Assert
		expect(result).not.toBeNull();
		expect(result?.name).toBe('idx_name');
		expect(result?.columns).toEqual(['name']);
		expect(result?.unique).toBe(false);
		expect(result?.type).toBe('btree');
	});

	/**
	 * Test: findMatchingIndex - No Match
	 */
	it('should return null when no matching index found', () => {
		// Arrange
		const docIndex: DocIndex = {
			name: 'idx_missing',
			columns: ['missing_field'],
			unique: false,
			type: 'btree'
		};

		const dbIndexes: IndexInfo[] = [
			{
				name: 'idx_name',
				columns: ['name'],
				unique: false,
				type: 'btree'
			},
			{
				name: 'idx_email',
				columns: ['email'],
				unique: true,
				type: 'btree'
			}
		];

		// Act
		const result = IndexComparator.findMatchingIndex(docIndex, dbIndexes);

		// Assert
		expect(result).toBeNull();
	});

	/**
	 * Test: docIndexToIndexDefinition
	 */
	it('should convert DocIndex to IndexDefinition', () => {
		// Arrange
		const docIndex: DocIndex = {
			name: 'idx_test_name',
			columns: ['name', 'email'],
			unique: true,
			type: 'btree',
			where: 'status = "active"'
		};

		// Act
		const result = IndexComparator.docIndexToIndexDefinition(docIndex, 'TestDocType');

		// Assert
		expect(result).toEqual({
			name: 'idx_test_name',
			columns: ['name', 'email'],
			unique: true,
			type: 'btree',
			where: 'status = "active"'
		});
	});

	/**
	 * Test: docIndexToIndexDefinition - Generate Name
	 */
	it('should generate index name when not provided', () => {
		// Arrange
		const docIndex: DocIndex = {
			name: '', // Empty name to test generation
			columns: ['name', 'status'],
			unique: false
		};

		// Act
		const result = IndexComparator.docIndexToIndexDefinition(docIndex, 'TestDocType');

		// Assert
		expect(result.name).toBe('idx_testdoctype_name_status');
		expect(result.columns).toEqual(['name', 'status']);
		expect(result.unique).toBe(false);
		expect(result.type).toBe('btree');
	});

	/**
	 * Test: indexInfoToIndexDefinition
	 */
	it('should convert IndexInfo to IndexDefinition', () => {
		// Arrange
		const indexInfo: IndexInfo = {
			name: 'idx_test',
			columns: ['name', 'email'],
			unique: true,
			type: 'hash'
		};

		// Act
		const result = IndexComparator.indexInfoToIndexDefinition(indexInfo);

		// Assert
		expect(result).toEqual({
			name: 'idx_test',
			columns: ['name', 'email'],
			unique: true,
			type: 'hash'
		});
	});

	/**
	 * Test: generateIndexName - Standard Case
	 */
	it('should generate consistent index name', () => {
		// Arrange
		const doctypeName = 'TestDocType';
		const columns = ['name', 'email'];
		const unique = false;

		// Act
		const result = IndexComparator.generateIndexName(doctypeName, columns, unique);

		// Assert
		expect(result).toBe('idx_testdoctype_name_email');
	});

	/**
	 * Test: generateIndexName - Unique Index
	 */
	it('should generate unique index name', () => {
		// Arrange
		const doctypeName = 'TestDocType';
		const columns = ['email'];
		const unique = true;

		// Act
		const result = IndexComparator.generateIndexName(doctypeName, columns, unique);

		// Assert
		expect(result).toBe('uk_testdoctype_email');
	});

	/**
	 * Test: generateIndexName - Long Name Truncation
	 */
	it('should truncate long index names', () => {
		// Arrange
		const doctypeName = 'VeryLongDocTypeNameThatExceedsNormalLimits';
		const columns = ['very_long_column_name', 'another_extremely_long_column_name'];
		const unique = false;

		// Act
		const result = IndexComparator.generateIndexName(doctypeName, columns, unique);

		// Assert
		expect(result.length).toBeLessThanOrEqual(64); // Max length
		expect(result).toContain('idx_');
		expect(result).toContain('verylongdoctypename');
	});

	/**
	 * Test: generateIndexName - Special Characters
	 */
	it('should handle special characters in names', () => {
		// Arrange
		const doctypeName = 'Test-DocType@Special#Chars';
		const columns = ['field-name', 'field.name'];
		const unique = false;

		// Act
		const result = IndexComparator.generateIndexName(doctypeName, columns, unique);

		// Assert
		expect(result).toBe('idx_test_doctype_special_chars_field_name_field_name');
		expect(result).not.toContain('-');
		expect(result).not.toContain('@');
		expect(result).not.toContain('#');
	});

	/**
	 * Test: normalizeColumnOrder
	 */
	it('should normalize column order for comparison', () => {
		// Arrange
		const columns = ['Name', 'EMAIL', 'Status'];

		// Act
		const result = IndexComparator.normalizeColumnOrder(columns);

		// Assert
		expect(result).toEqual(['name', 'email', 'status']);
	});

	/**
	 * Test: isDestructiveChange - Non-destructive Changes
	 */
	it('should identify non-destructive changes', () => {
		// Arrange
		const fromIndex: IndexInfo = {
			name: 'idx_test',
			columns: ['name'],
			unique: true,
			type: 'btree'
		};

		const toIndex: DocIndex = {
			name: 'idx_test',
			columns: ['name'],
			unique: false, // Removing unique is not destructive
			type: 'btree'
		};

		// Act
		const result = IndexComparator.isDestructiveChange(fromIndex, toIndex);

		// Assert
		expect(result).toBe(false);
	});

	/**
	 * Test: isDestructiveChange - Destructive Changes
	 */
	it('should identify destructive changes', () => {
		// Arrange
		const fromIndex: IndexInfo = {
			name: 'idx_test',
			columns: ['name'],
			unique: false,
			type: 'btree'
		};

		const toIndex: DocIndex = {
			name: 'idx_test',
			columns: ['name'],
			unique: true, // Adding unique can be destructive
			type: 'btree'
		};

		// Act
		const result = IndexComparator.isDestructiveChange(fromIndex, toIndex);

		// Assert
		expect(result).toBe(true);
	});

	/**
	 * Test: isDestructiveChange - Column Changes
	 */
	it('should identify column changes as destructive', () => {
		// Arrange
		const fromIndex: IndexInfo = {
			name: 'idx_test',
			columns: ['name'],
			unique: false,
			type: 'btree'
		};

		const toIndex: DocIndex = {
			name: 'idx_test',
			columns: ['email'], // Different columns
			unique: false,
			type: 'btree'
		};

		// Act
		const result = IndexComparator.isDestructiveChange(fromIndex, toIndex);

		// Assert
		expect(result).toBe(true);
	});

	/**
	 * Test: getChangeComplexity
	 */
	it('should calculate change complexity score', () => {
		// Arrange
		const simpleFromIndex: IndexInfo = {
			name: 'idx_simple',
			columns: ['name'],
			unique: false,
			type: 'btree'
		};

		const simpleToIndex: DocIndex = {
			name: 'idx_simple',
			columns: ['name'],
			unique: false,
			type: 'btree'
		};

		const complexFromIndex: IndexInfo = {
			name: 'idx_complex',
			columns: ['name', 'email', 'status'],
			unique: false,
			type: 'btree'
		};

		const complexToIndex: DocIndex = {
			name: 'idx_complex',
			columns: ['name', 'email'],
			unique: true, // Adding unique
			type: 'hash', // Type change
			where: 'status = "active"' // Where clause
		};

		// Act
		const simpleScore = IndexComparator.getChangeComplexity(simpleFromIndex, simpleToIndex);
		const complexScore = IndexComparator.getChangeComplexity(complexFromIndex, complexToIndex);

		// Assert
		expect(simpleScore).toBe(5); // Base score
		expect(complexScore).toBeGreaterThan(simpleScore);
		expect(complexScore).toBeGreaterThan(20); // Should be much higher
	});

	/**
	 * Test: isValidIndexName - Valid Names
	 */
	it('should validate correct index names', () => {
		// Arrange & Act & Assert
		expect(IndexComparator.isValidIndexName('idx_test')).toBe(true);
		expect(IndexComparator.isValidIndexName('uk_email')).toBe(true);
		expect(IndexComparator.isValidIndexName('idx_name_status')).toBe(true);
		expect(IndexComparator.isValidIndexName('test_index')).toBe(true);
	});

	/**
	 * Test: isValidIndexName - Invalid Names
	 */
	it('should reject invalid index names', () => {
		// Arrange & Act & Assert
		expect(IndexComparator.isValidIndexName('')).toBe(false);
		expect(IndexComparator.isValidIndexName('123invalid')).toBe(false);
		expect(IndexComparator.isValidIndexName('invalid-name-with-dashes')).toBe(false);
		expect(IndexComparator.isValidIndexName('invalid name with spaces')).toBe(false);
		expect(IndexComparator.isValidIndexName('a'.repeat(65))).toBe(false); // Too long
	});

	/**
	 * Test: sanitizeIndexName
	 */
	it('should sanitize invalid index names', () => {
		// Arrange & Act & Assert
		expect(IndexComparator.sanitizeIndexName('')).toBe('idx_default');
		expect(IndexComparator.sanitizeIndexName('123invalid')).toBe('idx_123invalid');
		expect(IndexComparator.sanitizeIndexName('invalid-name-with-dashes')).toBe('idx_invalid_name_with_dashes');
		expect(IndexComparator.sanitizeIndexName('invalid name with spaces')).toBe('idx_invalid_name_with_spaces');
		expect(IndexComparator.sanitizeIndexName('a'.repeat(65))).toHaveLength(64); // Truncated
	});

	/**
	 * Test: getIndexTypePriority
	 */
	it('should return correct priority for index types', () => {
		// Arrange & Act & Assert
		expect(IndexComparator.getIndexTypePriority('btree')).toBe(5);
		expect(IndexComparator.getIndexTypePriority('hash')).toBe(7);
		expect(IndexComparator.getIndexTypePriority('gist')).toBe(8);
		expect(IndexComparator.getIndexTypePriority('gin')).toBe(9);
		expect(IndexComparator.getIndexTypePriority('partial')).toBe(6);
		expect(IndexComparator.getIndexTypePriority('unknown')).toBe(3);
		expect(IndexComparator.getIndexTypePriority()).toBe(5); // Default
	});

	/**
	 * Test: Complex Index Comparison
	 */
	it('should handle complex index comparison scenarios', () => {
		// Arrange
		const docIndex: DocIndex = {
			name: 'idx_complex',
			columns: ['name', 'email', 'status'],
			unique: true,
			type: 'btree',
			where: 'status IN ("active", "pending")'
		};

		const dbIndex: IndexInfo = {
			name: 'idx_complex',
			columns: ['name', 'email'], // Missing status
			unique: false, // Different uniqueness
			type: 'hash' // Different type
		};

		// Act
		const result = IndexComparator.compareIndexToIndex(docIndex, dbIndex);

		// Assert
		expect(result).toBe(false);
	});

	/**
	 * Test: Partial Index Support
	 */
	it('should handle partial indexes', () => {
		// Arrange
		const docIndex: DocIndex = {
			name: 'idx_active_users',
			columns: ['name'],
			unique: false,
			type: 'btree',
			where: 'status = "active"'
		};

		const dbIndex: IndexInfo = {
			name: 'idx_active_users',
			columns: ['name'],
			unique: false,
			type: 'btree'
			// Note: IndexInfo doesn't support where clause in current implementation
		};

		// Act
		const definition = IndexComparator.docIndexToIndexDefinition(docIndex, 'User');

		// Assert
		expect(definition.where).toBe('status = "active"');
	});

	/**
	 * Test: Multiple Column Index
	 */
	it('should handle multi-column indexes correctly', () => {
		// Arrange
		const docIndex: DocIndex = {
			name: 'idx_composite',
			columns: ['name', 'email', 'status'],
			unique: true,
			type: 'btree'
		};

		const dbIndex: IndexInfo = {
			name: 'idx_composite',
			columns: ['name', 'email', 'status'],
			unique: true,
			type: 'btree'
		};

		// Act
		const result = IndexComparator.compareIndexToIndex(docIndex, dbIndex);

		// Assert
		expect(result).toBe(true);
	});
});