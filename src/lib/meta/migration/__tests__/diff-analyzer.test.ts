/**
 * Schema Diff Analyzer Tests
 * 
 * This file contains tests for SchemaDiffAnalyzer class, which provides methods for analyzing
 * schema diffs, calculating statistics, validating changes, and providing recommendations.
 */

import { describe, it, expect } from 'vitest';
import { SchemaDiffAnalyzer } from '../analyzers/diff-analyzer';
import type { SchemaDiff, FieldChange, ColumnChange, IndexChange, ColumnRename } from '../types';
import type { DiffStatistics } from '../schema-comparison-types';
import type { MigrationValidation } from '../types';
import { FieldComparator } from '../comparators/field-comparator';
import { IndexComparator } from '../comparators/index-comparator';
import {
	addColumnsSchemaDiff,
	removeColumnsSchemaDiff,
	modifyColumnsSchemaDiff,
	renameColumnsSchemaDiff,
	indexChangesSchemaDiff,
	emptySchemaDiff,
	complexSchemaDiff
} from './fixtures/schema-diffs';

describe('SchemaDiffAnalyzer', () => {
	/**
	 * Test: hasChanges - Empty Diff
	 */
	it('should return false for empty diff', () => {
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
		const result = SchemaDiffAnalyzer.hasChanges(emptyDiff);

		// Assert
		expect(result).toBe(false);
	});

	/**
	 * Test: hasChanges - With Changes
	 */
	it('should return true for non-empty diff', () => {
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
		const result = SchemaDiffAnalyzer.hasChanges(diffWithChanges);

		// Assert
		expect(result).toBe(true);
	});

	/**
	 * Test: requiresDataMigration - Type Changes
	 */
	it('should return true for type changes', () => {
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
		const result = SchemaDiffAnalyzer.requiresDataMigration(diffWithTypeChanges);

		// Assert
		expect(result).toBe(true);
	});

	/**
	 * Test: requiresDataMigration - Column Renames
	 */
	it('should return true for column renames', () => {
		// Arrange
		const diffWithRenames: SchemaDiff = {
			addedColumns: [],
			removedColumns: [],
			modifiedColumns: [],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: [{
				from: 'old_name',
				to: 'new_name',
				column: {
					name: 'new_name',
					type: 'varchar',
					nullable: true,
					primary_key: false,
					auto_increment: false,
					unique: false
				}
			}]
		};

		// Act
		const result = SchemaDiffAnalyzer.requiresDataMigration(diffWithRenames);

		// Assert
		expect(result).toBe(true);
	});

	/**
	 * Test: requiresDataMigration - Non-Destructive Changes
	 */
	it('should return false for non-destructive changes', () => {
		// Arrange
		const diffWithNonDestructive: SchemaDiff = {
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
			modifiedColumns: [{
				fieldname: 'test_field',
				changes: {
					default: { from: null, to: 'default_value' }
				},
				requiresDataMigration: false,
				destructive: false
			}],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		};

		// Act
		const result = SchemaDiffAnalyzer.requiresDataMigration(diffWithNonDestructive);

		// Assert
		expect(result).toBe(false);
	});

	/**
	 * Test: hasDestructiveChanges - Column Removal
	 */
	it('should identify destructive column removal', () => {
		// Arrange
		const diffWithDestructiveRemoval: SchemaDiff = {
			addedColumns: [],
			removedColumns: [{
				fieldname: 'legacy_field',
				column: {
					name: 'legacy_field',
					type: 'text',
					nullable: true,
					primary_key: false,
					auto_increment: false,
					unique: false
				},
				destructive: true
			}],
			modifiedColumns: [],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		};

		// Act
		const result = SchemaDiffAnalyzer.hasDestructiveChanges(diffWithDestructiveRemoval);

		// Assert
		expect(result).toBe(true);
	});

	/**
	 * Test: hasDestructiveChanges - Destructive Type Changes
	 */
	it('should identify destructive type changes', () => {
		// Arrange
		const diffWithDestructiveTypeChange: SchemaDiff = {
			addedColumns: [],
			removedColumns: [],
			modifiedColumns: [{
				fieldname: 'test_field',
				changes: {
					type: { from: 'text', to: 'integer' }
				},
				requiresDataMigration: true,
				destructive: true
			}],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		};

		// Act
		const result = SchemaDiffAnalyzer.hasDestructiveChanges(diffWithDestructiveTypeChange);

		// Assert
		expect(result).toBe(true);
	});

	/**
	 * Test: hasDestructiveChanges - Non-Destructive Changes
	 */
	it('should return false for non-destructive changes', () => {
		// Arrange
		const diffWithNonDestructive: SchemaDiff = {
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
			modifiedColumns: [{
				fieldname: 'test_field',
				changes: {
					length: { from: 100, to: 200 }
				},
				requiresDataMigration: false,
				destructive: false
			}],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		};

		// Act
		const result = SchemaDiffAnalyzer.hasDestructiveChanges(diffWithNonDestructive);

		// Assert
		expect(result).toBe(false);
	});

	/**
	 * Test: getDiffStatistics - Basic Statistics
	 */
	it('should calculate basic diff statistics', () => {
		// Arrange
		const diff: SchemaDiff = {
			addedColumns: [
				{ fieldname: 'field1', column: { name: 'field1', type: 'text', nullable: true, unique: false } as any, destructive: false },
				{ fieldname: 'field2', column: { name: 'field2', type: 'text', nullable: true, unique: false } as any, destructive: false }
			],
			removedColumns: [
				{ fieldname: 'field3', column: { name: 'field3', type: 'text' } as any, destructive: true }
			],
			modifiedColumns: [
				{ fieldname: 'field4', changes: {}, requiresDataMigration: false, destructive: false }
			],
			addedIndexes: [
				{ name: 'idx1', index: { name: 'idx1', columns: ['col1'], unique: false } as any, destructive: false }
			],
			removedIndexes: [
				{ name: 'idx2', index: { name: 'idx2', columns: ['col1'], unique: false } as any, destructive: false }
			],
			renamedColumns: [
				{ from: 'old1', to: 'new1', column: { name: 'new1', type: 'text' } as any }
			]
		};

		// Act
		const stats = SchemaDiffAnalyzer.getDiffStatistics(diff);

		// Assert
		expect(stats.totalChanges).toBe(7);
		expect(stats.addedColumns).toBe(2);
		expect(stats.removedColumns).toBe(1);
		expect(stats.modifiedColumns).toBe(1);
		expect(stats.addedIndexes).toBe(1);
		expect(stats.removedIndexes).toBe(1);
		expect(stats.renamedColumns).toBe(1);
		expect(stats.requiresDataMigration).toBe(true);
		expect(stats.hasDestructiveChanges).toBe(true);
		expect(stats.complexityScore).toBeGreaterThan(0);
	});

	/**
	 * Test: getDiffStatistics - Empty Diff
	 */
	it('should return zero statistics for empty diff', () => {
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
		const stats = SchemaDiffAnalyzer.getDiffStatistics(emptyDiff);

		// Assert
		expect(stats.totalChanges).toBe(0);
		expect(stats.addedColumns).toBe(0);
		expect(stats.removedColumns).toBe(0);
		expect(stats.modifiedColumns).toBe(0);
		expect(stats.addedIndexes).toBe(0);
		expect(stats.removedIndexes).toBe(0);
		expect(stats.renamedColumns).toBe(0);
		expect(stats.requiresDataMigration).toBe(false);
		expect(stats.hasDestructiveChanges).toBe(false);
		expect(stats.complexityScore).toBe(0);
	});

	/**
	 * Test: getComplexityScore - Simple Changes
	 */
	it('should calculate low complexity for simple changes', () => {
		// Arrange
		const simpleDiff: SchemaDiff = {
			addedColumns: [{
				fieldname: 'simple_field',
				column: {
					name: 'simple_field',
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
		const score = SchemaDiffAnalyzer.getComplexityScore(simpleDiff);

		// Assert
		expect(score).toBe(2); // Base score for adding simple column
	});

	/**
	 * Test: getComplexityScore - Complex Changes
	 */
	it('should calculate high complexity for complex changes', () => {
		// Arrange
		const complexDiff: SchemaDiff = {
			addedColumns: [{
				fieldname: 'complex_field',
				column: {
					name: 'complex_field',
					type: 'text',
					nullable: false,
					primary_key: false,
					auto_increment: false,
					unique: true
				},
				destructive: false
			}],
			removedColumns: [{
				fieldname: 'legacy_field',
				column: {
					name: 'legacy_field',
					type: 'text',
					nullable: true,
					primary_key: false,
					auto_increment: false,
					unique: false
				},
				destructive: true
			}],
			modifiedColumns: [{
				fieldname: 'modified_field',
				changes: {
					type: { from: 'text', to: 'integer' },
					nullable: { from: true, to: false }
				},
				requiresDataMigration: true,
				destructive: true
			}],
			addedIndexes: [{
				name: 'idx_complex',
				index: {
					name: 'idx_complex',
					columns: ['field1', 'field2'],
					unique: true,
					type: 'btree'
				},
				destructive: false
			}],
			removedIndexes: [],
			renamedColumns: []
		};

		// Act
		const score = SchemaDiffAnalyzer.getComplexityScore(complexDiff);

		// Assert
		expect(score).toBeGreaterThan(30); // Should be significantly higher
	});

	/**
	 * Test: getMigrationPriority - Destructive Changes
	 */
	it('should assign high priority to destructive changes', () => {
		// Arrange
		const destructiveDiff: SchemaDiff = {
			addedColumns: [],
			removedColumns: [{
				fieldname: 'critical_field',
				column: {
					name: 'critical_field',
					type: 'text',
					nullable: true,
					primary_key: false,
					auto_increment: false,
					unique: false
				},
				destructive: true
			}],
			modifiedColumns: [],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		};

		const nonDestructiveDiff: SchemaDiff = {
			addedColumns: [{
				fieldname: 'simple_field',
				column: {
					name: 'simple_field',
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
		const destructivePriority = SchemaDiffAnalyzer.getMigrationPriority(destructiveDiff);
		const nonDestructivePriority = SchemaDiffAnalyzer.getMigrationPriority(nonDestructiveDiff);

		// Assert
		expect(destructivePriority).toBeGreaterThan(nonDestructivePriority);
		expect(destructivePriority).toBeGreaterThan(50); // Base + destructive bonus
	});

	/**
	 * Test: canApplyOnline - Safe Changes
	 */
	it('should identify safe online changes', () => {
		// Arrange
		const safeChange: FieldChange = {
			fieldname: 'safe_field',
			changes: {
				default: { from: null, to: 'default_value' }
			},
			requiresDataMigration: false,
			destructive: false
		};

		// Act
		const result = SchemaDiffAnalyzer.canApplyOnline(safeChange);

		// Assert
		expect(result).toBe(true);
	});

	/**
	 * Test: canApplyOnline - Unsafe Changes
	 */
	it('should identify unsafe online changes', () => {
		// Arrange
		const unsafeChange: FieldChange = {
			fieldname: 'unsafe_field',
			changes: {
				type: { from: 'text', to: 'integer' }
			},
			requiresDataMigration: true,
			destructive: false
		};

		// Act
		const result = SchemaDiffAnalyzer.canApplyOnline(unsafeChange);

		// Assert
		expect(result).toBe(false);
	});

	/**
	 * Test: estimateExecutionTime - Simple Diff
	 */
	it('should estimate short execution time for simple diff', () => {
		// Arrange
		const simpleDiff: SchemaDiff = {
			addedColumns: [{
				fieldname: 'simple_field',
				column: {
					name: 'simple_field',
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
		const time = SchemaDiffAnalyzer.estimateExecutionTime(simpleDiff);

		// Assert
		expect(time).toBeGreaterThan(0);
		expect(time).toBeLessThan(1); // Should be very fast
	});

	/**
	 * Test: estimateExecutionTime - Complex Diff
	 */
	it('should estimate longer execution time for complex diff', () => {
		// Arrange
		const complexDiff: SchemaDiff = {
			addedColumns: [],
			removedColumns: [{
				fieldname: 'legacy_field',
				column: {
					name: 'legacy_field',
					type: 'text',
					nullable: true,
					primary_key: false,
					auto_increment: false,
					unique: false
				},
				destructive: true
			}],
			modifiedColumns: [{
				fieldname: 'modified_field',
				changes: {
					type: { from: 'text', to: 'integer' }
				},
				requiresDataMigration: true,
				destructive: false
			}],
			addedIndexes: [{
				name: 'idx_new',
				index: {
					name: 'idx_new',
					columns: ['field1', 'field2'],
					unique: true,
					type: 'btree'
				},
				destructive: false
			}],
			removedIndexes: [],
			renamedColumns: []
		};

		// Act
		const time = SchemaDiffAnalyzer.estimateExecutionTime(complexDiff);

		// Assert
		expect(time).toBeGreaterThan(2); // Should be significantly longer
	});

	/**
	 * Test: validateSchemaDiff - Valid Diff
	 */
	it('should validate correct schema diff', () => {
		// Arrange
		const validDiff: SchemaDiff = {
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
		const result = SchemaDiffAnalyzer.validateSchemaDiff(validDiff);

		// Assert
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
		expect(result.warnings).toHaveLength(0);
	});

	/**
	 * Test: validateSchemaDiff - Invalid Diff
	 */
	it('should detect invalid schema diff', () => {
		// Arrange
		const invalidDiff: SchemaDiff = {
			addedColumns: [
				{
					fieldname: 'field1',
					column: {
						name: 'field1',
						type: 'text',
						nullable: true,
						primary_key: false,
						auto_increment: false,
						unique: false
					},
					destructive: false
				},
				{
					fieldname: 'field1', // Duplicate name
					column: {
						name: 'field1',
						type: 'integer',
						nullable: false,
						primary_key: false,
						auto_increment: false,
						unique: false
					},
					destructive: false
				}
			],
			removedColumns: [],
			modifiedColumns: [],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		};

		// Act
		const result = SchemaDiffAnalyzer.validateSchemaDiff(invalidDiff);

		// Assert
		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0].message).toContain('Duplicate column name: field1');
	});

	/**
	 * Test: getWarnings - Destructive Changes
	 */
	it('should generate warnings for destructive changes', () => {
		// Arrange
		const destructiveDiff: SchemaDiff = {
			addedColumns: [],
			removedColumns: [{
				fieldname: 'legacy_field',
				column: {
					name: 'legacy_field',
					type: 'text',
					nullable: true,
					primary_key: false,
					auto_increment: false,
					unique: false
				},
				destructive: true
			}],
			modifiedColumns: [{
				fieldname: 'modified_field',
				changes: {
					type: { from: 'text', to: 'integer' }
				},
				requiresDataMigration: true,
				destructive: true
			}],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		};

		// Act
		const warnings = SchemaDiffAnalyzer.getWarnings(destructiveDiff);

		// Assert
		expect(warnings.length).toBeGreaterThan(0);
		expect(warnings.some(w => w.includes('data loss'))).toBe(true);
	});

	/**
	 * Test: getRecommendations - Destructive Changes
	 */
	it('should recommend backup for destructive changes', () => {
		// Arrange
		const destructiveDiff: SchemaDiff = {
			addedColumns: [],
			removedColumns: [{
				fieldname: 'legacy_field',
				column: {
					name: 'legacy_field',
					type: 'text',
					nullable: true,
					primary_key: false,
					auto_increment: false,
					unique: false
				},
				destructive: true
			}],
			modifiedColumns: [],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		};

		// Act
		const recommendations = SchemaDiffAnalyzer.getRecommendations(destructiveDiff);

		// Assert
		expect(recommendations.some(r => r.includes('backup'))).toBe(true);
	});

	/**
	 * Test: getRecommendations - Data Migration
	 */
	it('should recommend testing for data migration', () => {
		// Arrange
		const dataMigrationDiff: SchemaDiff = {
			addedColumns: [],
			removedColumns: [],
			modifiedColumns: [{
				fieldname: 'modified_field',
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
		const recommendations = SchemaDiffAnalyzer.getRecommendations(dataMigrationDiff);

		// Assert
		expect(recommendations.some(r => r.includes('staging'))).toBe(true);
	});

	/**
	 * Test: getRecommendations - Complex Changes
	 */
	it('should recommend breaking down complex changes', () => {
		// Arrange
		// Create enough changes to exceed complexity score of 50
		const addedColumns = Array.from({ length: 20 }, (_, i) => ({
			fieldname: `field${i}`,
			column: {
				name: `field${i}`,
				type: 'text',
				nullable: false, // Adds complexity
				unique: true     // Adds complexity
			} as any,
			destructive: false
		}));

		const complexDiff: SchemaDiff = {
			addedColumns,
			removedColumns: [],
			modifiedColumns: [],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		};

		// Act
		const recommendations = SchemaDiffAnalyzer.getRecommendations(complexDiff);

		// Assert
		expect(recommendations.some(r => r.includes('incremental'))).toBe(true);
	});

	/**
	 * Test: Integration with FieldComparator
	 */
	it('should integrate with FieldComparator for analysis', () => {
		// Arrange
		const fieldChange: FieldChange = {
			fieldname: 'test_field',
			changes: {
				type: { from: 'text', to: 'integer' }
			},
			requiresDataMigration: true,
			destructive: true
		};

		// Act
		const complexity = SchemaDiffAnalyzer.getComplexityScore({
			addedColumns: [],
			removedColumns: [],
			modifiedColumns: [fieldChange],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		});

		const fieldComplexity = FieldComparator.getChangeComplexity(fieldChange);

		// Assert
		// Assert
		expect(complexity).toBe(fieldComplexity);
	});

	/**
	 * Test: Integration with IndexComparator
	 */
	/**
	 * Test: Complexity for Index Operations
	 */
	it('should calculate complexity for index operations', () => {
		// Arrange
		const addedIndex = {
			name: 'idx_new',
			columns: ['col1', 'col2'],
			unique: true,
			type: 'btree'
		};

		const removedIndex = {
			name: 'idx_old',
			columns: ['col1'],
			unique: false,
			type: 'btree'
		};

		// Act
		const complexity = SchemaDiffAnalyzer.getComplexityScore({
			addedColumns: [],
			removedColumns: [],
			modifiedColumns: [],
			addedIndexes: [{
				name: 'idx_new',
				index: addedIndex,
				destructive: false
			}],
			removedIndexes: [{
				name: 'idx_old',
				index: removedIndex,
				destructive: false
			}],
			renamedColumns: []
		});

		// Calculate expected score manually based on implementation
		// Added index: 4 (base) + 3 (unique) + 2 (columns) = 9
		// Removed index: 2 (non-destructive)
		const expectedScore = 9 + 2;

		// Assert
		expect(complexity).toBe(expectedScore);
	});

	/**
	 * Test: Complete Analysis Workflow
	 */
	it('should provide complete analysis workflow', () => {
		// Arrange
		const diff: SchemaDiff = complexSchemaDiff;

		// Act
		const hasChanges = SchemaDiffAnalyzer.hasChanges(diff);
		const requiresMigration = SchemaDiffAnalyzer.requiresDataMigration(diff);
		const hasDestructive = SchemaDiffAnalyzer.hasDestructiveChanges(diff);
		const stats = SchemaDiffAnalyzer.getDiffStatistics(diff);
		const validation = SchemaDiffAnalyzer.validateSchemaDiff(diff);
		const warnings = SchemaDiffAnalyzer.getWarnings(diff);
		const recommendations = SchemaDiffAnalyzer.getRecommendations(diff);
		const complexity = SchemaDiffAnalyzer.getComplexityScore(diff);
		const priority = SchemaDiffAnalyzer.getMigrationPriority(diff);

		// Assert
		expect(hasChanges).toBe(true);
		expect(requiresMigration).toBe(true);
		expect(hasDestructive).toBe(true);
		expect(stats.totalChanges).toBeGreaterThan(0);
		expect(validation.valid).toBe(true);
		expect(warnings.length).toBeGreaterThan(0);
		expect(recommendations.length).toBeGreaterThan(0);
		expect(complexity).toBeGreaterThan(0);
		expect(priority).toBeGreaterThan(0);
	});
});