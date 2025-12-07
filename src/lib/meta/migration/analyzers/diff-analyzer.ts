/**
 * Schema Diff Analyzer Utility
 * 
 * This utility class provides methods for analyzing schema diffs, calculating statistics,
 * validating changes, and providing recommendations.
 */

import type { 
	SchemaDiff, 
	FieldChange, 
	ColumnChange, 
	IndexChange,
	ColumnRename
} from '../types';
import type { DiffStatistics } from '../schema-comparison-types';
import type { MigrationValidation } from '../types';
import { FieldComparator } from '../comparators/field-comparator';
import { IndexComparator } from '../comparators/index-comparator';

/**
 * Static utility class for analyzing schema diffs
 */
export class SchemaDiffAnalyzer {
	/**
	 * Check if a schema diff contains any changes
	 * @param diff SchemaDiff to check
	 * @returns True if diff has changes
	 */
	static hasChanges(diff: SchemaDiff): boolean {
		return (
			diff.addedColumns.length > 0 ||
			diff.removedColumns.length > 0 ||
			diff.modifiedColumns.length > 0 ||
			diff.addedIndexes.length > 0 ||
			diff.removedIndexes.length > 0 ||
			diff.renamedColumns.length > 0
		);
	}

	/**
	 * Check if a schema diff requires data migration
	 * @param diff SchemaDiff to check
	 * @returns True if data migration is required
	 */
	static requiresDataMigration(diff: SchemaDiff): boolean {
		// Check modified columns
		for (const change of diff.modifiedColumns) {
			if (FieldComparator.requiresDataMigration(change)) {
				return true;
			}
		}

		// Check renamed columns (require data migration in SQLite)
		if (diff.renamedColumns.length > 0) {
			return true;
		}

		// Check removed columns (potentially destructive)
		for (const change of diff.removedColumns) {
			if (change.destructive) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Check if a schema diff contains potentially destructive changes
	 * @param diff SchemaDiff to check
	 * @returns True if destructive changes are present
	 */
	static hasDestructiveChanges(diff: SchemaDiff): boolean {
		// Check removed columns
		for (const change of diff.removedColumns) {
			if (change.destructive) {
				return true;
			}
		}

		// Check modified columns
		for (const change of diff.modifiedColumns) {
			if (FieldComparator.isDestructive(change)) {
				return true;
			}
		}

		// Check removed indexes
		for (const change of diff.removedIndexes) {
			if (change.destructive) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Get statistics for a schema diff
	 * @param diff SchemaDiff to analyze
	 * @returns DiffStatistics object
	 */
	static getDiffStatistics(diff: SchemaDiff): DiffStatistics {
		const totalChanges = 
			diff.addedColumns.length +
			diff.removedColumns.length +
			diff.modifiedColumns.length +
			diff.addedIndexes.length +
			diff.removedIndexes.length +
			diff.renamedColumns.length;

		const requiresDataMigration = this.requiresDataMigration(diff);
		const hasDestructiveChanges = this.hasDestructiveChanges(diff);
		const complexityScore = this.getComplexityScore(diff);

		return {
			totalChanges,
			addedColumns: diff.addedColumns.length,
			removedColumns: diff.removedColumns.length,
			modifiedColumns: diff.modifiedColumns.length,
			addedIndexes: diff.addedIndexes.length,
			removedIndexes: diff.removedIndexes.length,
			renamedColumns: diff.renamedColumns.length,
			requiresDataMigration,
			hasDestructiveChanges,
			complexityScore
		};
	}

	/**
	 * Validate a schema diff for consistency and correctness
	 * @param diff SchemaDiff to validate
	 * @returns MigrationValidation with validation status and errors
	 */
	static validateSchemaDiff(diff: SchemaDiff): MigrationValidation {
		const errors: string[] = [];
		const warnings: string[] = [];
		const recommendations: string[] = [];

		// Validate column names
		const allColumnNames = new Set<string>();
		
		// Check added columns
		for (const change of diff.addedColumns) {
			if (allColumnNames.has(change.fieldname)) {
				errors.push(`Duplicate column name: ${change.fieldname}`);
			}
			allColumnNames.add(change.fieldname);

			// Validate column definition
			const columnErrors = this.validateColumnDefinition(change.column);
			errors.push(...columnErrors);
		}

		// Check modified columns
		for (const change of diff.modifiedColumns) {
			if (allColumnNames.has(change.fieldname)) {
				errors.push(`Duplicate column name: ${change.fieldname}`);
			}
			allColumnNames.add(change.fieldname);
		}

		// Check renamed columns
		for (const rename of diff.renamedColumns) {
			if (allColumnNames.has(rename.to)) {
				errors.push(`Duplicate column name: ${rename.to}`);
			}
			allColumnNames.add(rename.to);

			// Validate column definition
			const columnErrors = this.validateColumnDefinition(rename.column);
			errors.push(...columnErrors);
		}

		// Validate index names
		const allIndexNames = new Set<string>();
		
		// Check added indexes
		for (const change of diff.addedIndexes) {
			if (allIndexNames.has(change.name)) {
				errors.push(`Duplicate index name: ${change.name}`);
			}
			allIndexNames.add(change.name);

			// Validate index definition
			const indexErrors = this.validateIndexDefinition(change.index);
			errors.push(...indexErrors);
		}

		// Check for potential issues
		this.analyzePotentialIssues(diff, warnings, recommendations);

		// Generate recommendations based on analysis
		this.generateRecommendations(diff, recommendations);

		return {
			valid: errors.length === 0,
			errors: errors.map(err => ({ code: 'VALIDATION_ERROR', message: err, severity: 'error' as const })),
			warnings: warnings.map(warn => ({ code: 'VALIDATION_WARNING', message: warn, type: 'other' as const })),
			recommendations
		};
	}

	/**
	 * Get complexity score for a schema diff
	 * @param diff SchemaDiff to score
	 * @returns Complexity score (higher = more complex)
	 */
	static getComplexityScore(diff: SchemaDiff): number {
		let score = 0;

		// Score added columns
		for (const change of diff.addedColumns) {
			score += 2; // Base score for adding column
			if (change.column.unique) {
				score += 3; // Unique constraint adds complexity
			}
			if (!change.column.nullable) {
				score += 2; // NOT NULL adds complexity
			}
		}

		// Score removed columns
		for (const change of diff.removedColumns) {
			score += change.destructive ? 10 : 3; // Destructive removals are more complex
		}

		// Score modified columns
		for (const change of diff.modifiedColumns) {
			score += FieldComparator.getChangeComplexity(change);
		}

		// Score renamed columns
		score += diff.renamedColumns.length * 5; // Renames are moderately complex

		// Score added indexes
		for (const change of diff.addedIndexes) {
			score += 4; // Base score for adding index
			if (change.index.unique) {
				score += 3; // Unique indexes are more complex
			}
			score += change.index.columns.length; // More columns = more complexity
		}

		// Score removed indexes
		for (const change of diff.removedIndexes) {
			score += change.destructive ? 8 : 2; // Destructive removals are more complex
		}

		return score;
	}

	/**
	 * Get migration priority for a schema diff
	 * @param diff SchemaDiff to prioritize
	 * @returns Priority score (higher = higher priority)
	 */
	static getMigrationPriority(diff: SchemaDiff): number {
		let priority = 0;

		// Base priority from complexity
		priority += this.getComplexityScore(diff);

		// Add priority for destructive changes
		if (this.hasDestructiveChanges(diff)) {
			priority += 50; // High priority for destructive changes
		}

		// Add priority for data migration requirements
		if (this.requiresDataMigration(diff)) {
			priority += 30; // Medium-high priority for data migration
		}

		// Add priority for critical system changes
		for (const change of diff.removedColumns) {
			if (this.isSystemColumn(change.fieldname)) {
				priority += 100; // Very high priority for system column removal
			}
		}

		return priority;
	}

	/**
	 * Check if a field change can be applied online
	 * @param change FieldChange to check
	 * @returns True if change can be applied without downtime
	 */
	static canApplyOnline(change: FieldChange): boolean {
		// Adding columns is generally safe
		if (change.changes.type && !change.changes.type.from) {
			return true;
		}

		// Changing default values is generally safe
		if (change.changes.default && !change.changes.type && !change.changes.nullable) {
			return true;
		}

		// Adding unique constraints may require table rebuild
		if (change.changes.unique && change.changes.unique.to && !change.changes.unique.from) {
			return false;
		}

		// Making columns NOT NULL may require table rebuild
		if (change.changes.nullable && !change.changes.nullable.to && change.changes.nullable.from) {
			return false;
		}

		// Type changes may require table rebuild
		if (change.changes.type && 
			!FieldComparator.areTypesCompatible(change.changes.type.from, change.changes.type.to)) {
			return false;
		}

		return true;
	}

	/**
	 * Get estimated execution time for a schema diff
	 * @param diff SchemaDiff to estimate
	 * @returns Estimated execution time in seconds
	 */
	static estimateExecutionTime(diff: SchemaDiff): number {
		let time = 0;

		// Base time for each operation type
		time += diff.addedColumns.length * 0.1; // 100ms per added column
		time += diff.removedColumns.length * 0.2; // 200ms per removed column
		time += diff.modifiedColumns.length * 0.5; // 500ms per modified column
		time += diff.renamedColumns.length * 0.3; // 300ms per renamed column
		time += diff.addedIndexes.length * 0.5; // 500ms per added index
		time += diff.removedIndexes.length * 0.2; // 200ms per removed index

		// Add time for complex operations
		for (const change of diff.modifiedColumns) {
			if (change.changes.type) {
				time += 1.0; // Extra time for type changes
			}
			if (change.changes.unique && change.changes.unique.to) {
				time += 2.0; // Extra time for adding unique constraints
			}
		}

		// Add buffer for destructive changes
		if (this.hasDestructiveChanges(diff)) {
			time *= 1.5; // 50% extra time for destructive changes
		}

		// Add buffer for data migration
		if (this.requiresDataMigration(diff)) {
			time *= 2.0; // Double time for data migration
		}

		return Math.max(time, 0.1); // Minimum 100ms
	}

	/**
	 * Get warnings for a schema diff
	 * @param diff SchemaDiff to analyze
	 * @returns Array of warning messages
	 */
	static getWarnings(diff: SchemaDiff): string[] {
		const warnings: string[] = [];

		// Warnings for removed columns
		for (const change of diff.removedColumns) {
			if (change.destructive) {
				warnings.push(`Removing column '${change.fieldname}' will result in data loss`);
			}
		}

		// Warnings for modified columns
		for (const change of diff.modifiedColumns) {
			if (change.destructive) {
				warnings.push(`Modifying column '${change.fieldname}' may result in data loss`);
			}
		}

		// Warnings for type changes
		for (const change of diff.modifiedColumns) {
			if (change.changes.type) {
				const from = change.changes.type.from;
				const to = change.changes.type.to;
				if (!FieldComparator.areTypesCompatible(from, to)) {
					warnings.push(`Type change from '${from}' to '${to}' for column '${change.fieldname}' may result in data loss`);
				}
			}
		}

		// Warnings for unique constraints
		for (const change of diff.modifiedColumns) {
			if (change.changes.unique && change.changes.unique.to) {
				warnings.push(`Adding unique constraint to column '${change.fieldname}' may fail if duplicate data exists`);
			}
		}

		return warnings;
	}

	/**
	 * Get recommendations for applying a schema diff
	 * @param diff SchemaDiff to analyze
	 * @returns Array of recommendation messages
	 */
	static getRecommendations(diff: SchemaDiff): string[] {
		const recommendations: string[] = [];

		// Backup recommendations
		if (this.hasDestructiveChanges(diff)) {
			recommendations.push('Create a full database backup before applying this migration');
		}

		// Data migration recommendations
		if (this.requiresDataMigration(diff)) {
			recommendations.push('Test data migration on a staging environment first');
			recommendations.push('Consider running during low-traffic periods');
		}

		// Performance recommendations
		if (diff.addedIndexes.length > 0) {
			recommendations.push('Monitor query performance after adding new indexes');
		}

		// Complex migration recommendations
		if (this.getComplexityScore(diff) > 50) {
			recommendations.push('Consider breaking this migration into smaller, incremental changes');
		}

		// Rollback recommendations
		if (this.hasDestructiveChanges(diff)) {
			recommendations.push('Prepare rollback plan before applying this migration');
		}

		return recommendations;
	}

	/**
	 * Validate column definition
	 * @param column Column definition to validate
	 * @returns Array of error messages
	 */
	private static validateColumnDefinition(column: any): string[] {
		const errors: string[] = [];

		if (!column.name || column.name.trim() === '') {
			errors.push('Column name is required');
		}

		if (!column.type || column.type.trim() === '') {
			errors.push('Column type is required');
		}

		if (column.length && (typeof column.length !== 'number' || column.length <= 0)) {
			errors.push('Column length must be a positive number');
		}

		if (column.precision && (typeof column.precision !== 'number' || column.precision <= 0)) {
			errors.push('Column precision must be a positive number');
		}

		return errors;
	}

	/**
	 * Validate index definition
	 * @param index Index definition to validate
	 * @returns Array of error messages
	 */
	private static validateIndexDefinition(index: any): string[] {
		const errors: string[] = [];

		if (!index.name || index.name.trim() === '') {
			errors.push('Index name is required');
		}

		if (!IndexComparator.isValidIndexName(index.name)) {
			errors.push(`Invalid index name: ${index.name}`);
		}

		if (!index.columns || index.columns.length === 0) {
			errors.push('Index must have at least one column');
		}

		for (const column of index.columns) {
			if (!column || column.trim() === '') {
				errors.push('Index column names cannot be empty');
			}
		}

		return errors;
	}

	/**
	 * Analyze potential issues in schema diff
	 * @param diff SchemaDiff to analyze
	 * @param warnings Array to add warnings to
	 * @param recommendations Array to add recommendations to
	 */
	private static analyzePotentialIssues(
		diff: SchemaDiff,
		warnings: string[],
		recommendations: string[]
	): void {
		// Check for large number of changes
		const totalChanges = diff.addedColumns.length + 
			diff.removedColumns.length + 
			diff.modifiedColumns.length;

		if (totalChanges > 10) {
			warnings.push('Large number of column changes detected');
			recommendations.push('Consider breaking this into multiple smaller migrations');
		}

		// Check for index changes without column changes
		if (diff.addedIndexes.length > 0 || diff.removedIndexes.length > 0) {
			const hasColumnChanges = totalChanges > 0;
			if (!hasColumnChanges) {
				warnings.push('Index changes without column changes may affect query performance');
			}
		}
	}

	/**
	 * Generate recommendations based on schema diff analysis
	 * @param diff SchemaDiff to analyze
	 * @param recommendations Array to add recommendations to
	 */
	private static generateRecommendations(
		diff: SchemaDiff,
		recommendations: string[]
	): void {
		// Performance recommendations
		if (diff.addedColumns.length > 5) {
			recommendations.push('Consider adding indexes to new columns for better query performance');
		}

		// Security recommendations
		for (const change of diff.addedColumns) {
			if (change.column.name.toLowerCase().includes('password') ||
				change.column.name.toLowerCase().includes('secret') ||
				change.column.name.toLowerCase().includes('token')) {
				recommendations.push(`Review security implications of adding column '${change.column.name}'`);
			}
		}
	}

	/**
	 * Check if a column name is a system column
	 * @param columnName Column name to check
	 * @returns True if column is a system column
	 */
	private static isSystemColumn(columnName: string): boolean {
		const systemColumns = [
			'name', 'creation', 'modified', 'modified_by', 'owner',
			'docstatus', 'idx', 'parent', 'parentfield', 'parenttype'
		];
		return systemColumns.includes(columnName);
	}
}