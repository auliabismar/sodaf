/**
 * Index Comparator Utility
 * 
 * This utility class provides methods for comparing DocType indexes with database indexes,
 * detecting differences, and determining migration requirements.
 */

import type { DocIndex } from '../../doctype/types';
import type { IndexInfo } from '../../../core/database/types';
import type { IndexDefinition } from '../types';

/**
 * Static utility class for comparing DocType indexes with database indexes
 */
export class IndexComparator {
	/**
	 * Default index type for SQLite
	 */
	private static readonly DEFAULT_INDEX_TYPE = 'btree';

	/**
	 * Maximum length for generated index names
	 */
	private static readonly MAX_INDEX_NAME_LENGTH = 64;

	/**
	 * Compare a DocType index with a database index
	 * @param docIndex DocType index definition
	 * @param dbIndex Database index information
	 * @returns True if indexes are equivalent
	 */
	static compareIndexToIndex(
		docIndex: DocIndex,
		dbIndex: IndexInfo
	): boolean {
		// Compare uniqueness
		if (!!docIndex.unique !== dbIndex.unique) {
			return false;
		}

		// Compare columns (order matters for indexes)
		if (!this.areColumnsEqual(docIndex.columns, dbIndex.columns)) {
			return false;
		}

		// Compare index type if specified
		if (docIndex.type && dbIndex.type) {
			if (docIndex.type.toLowerCase() !== dbIndex.type.toLowerCase()) {
				return false;
			}
		}

		// Note: SQLite doesn't support partial indexes with WHERE clauses in the same way
		// For now, we'll ignore where clause comparison for IndexInfo
		// This would need to be extended if IndexInfo is enhanced to support partial indexes

		return true;
	}

	/**
	 * Find a database index that matches a DocType index
	 * @param docIndex DocType index to match
	 * @param dbIndexes Array of database indexes
	 * @returns Matching IndexInfo or null if not found
	 */
	static findMatchingIndex(
		docIndex: DocIndex,
		dbIndexes: IndexInfo[]
	): IndexInfo | null {
		for (const dbIndex of dbIndexes) {
			if (this.compareIndexToIndex(docIndex, dbIndex)) {
				return dbIndex;
			}
		}
		return null;
	}

	/**
	 * Convert DocType index to IndexDefinition
	 * @param docIndex DocType index to convert
	 * @param doctypeName DocType name for index naming
	 * @returns IndexDefinition
	 */
	static docIndexToIndexDefinition(
		docIndex: DocIndex,
		doctypeName: string
	): IndexDefinition {
		const name = docIndex.name || this.generateIndexName(
			doctypeName,
			docIndex.columns,
			docIndex.unique
		);

		return {
			name,
			columns: [...docIndex.columns],
			unique: !!docIndex.unique,
			type: docIndex.type || this.DEFAULT_INDEX_TYPE,
			where: docIndex.where ? this.normalizeWhereClause(docIndex.where) : undefined
		};
	}

	/**
	 * Convert IndexInfo to IndexDefinition
	 * @param indexInfo IndexInfo to convert
	 * @returns IndexDefinition
	 */
	static indexInfoToIndexDefinition(indexInfo: IndexInfo): IndexDefinition {
		return {
			name: indexInfo.name,
			columns: [...indexInfo.columns],
			unique: indexInfo.unique,
			type: indexInfo.type || this.DEFAULT_INDEX_TYPE
			// Note: IndexInfo doesn't currently support where clause
		};
	}

	/**
	 * Generate a consistent index name
	 * @param doctypeName DocType name
	 * @param columns Array of column names
	 * @param unique Whether index is unique
	 * @returns Generated index name
	 */
	static generateIndexName(
		doctypeName: string,
		columns: string[],
		unique?: boolean
	): string {
		// Create base name from table and columns
		const tablePart = doctypeName.toLowerCase().replace(/[^a-z0-9]/g, '_');
		const columnsPart = columns
			.map(col => col.toLowerCase().replace(/[^a-z0-9]/g, '_'))
			.join('_');
		
		const uniquePrefix = unique ? 'uk_' : 'idx_';
		let indexName = `${uniquePrefix}${tablePart}_${columnsPart}`;

		// Truncate if too long
		if (indexName.length > this.MAX_INDEX_NAME_LENGTH) {
			const maxTablePart = Math.floor(
				(this.MAX_INDEX_NAME_LENGTH - uniquePrefix.length - columnsPart.length - 1) / 2
			);
			const truncatedTable = tablePart.substring(0, maxTablePart);
			const maxColumnsPart = this.MAX_INDEX_NAME_LENGTH - uniquePrefix.length - truncatedTable.length - 1;
			const truncatedColumns = columnsPart.substring(0, maxColumnsPart);
			indexName = `${uniquePrefix}${truncatedTable}_${truncatedColumns}`;
		}

		return indexName;
	}

	/**
	 * Normalize column order for comparison
	 * @param columns Array of column names
	 * @returns Normalized array of column names
	 */
	static normalizeColumnOrder(columns: string[]): string[] {
		// For index comparison, order matters, so we just return a copy
		// This method is primarily for consistency with the architecture design
		return [...columns].map(col => col.toLowerCase().trim());
	}

	/**
	 * Check if an index change is potentially destructive
	 * @param fromIndex Original index
	 * @param toIndex New index
	 * @returns True if change is destructive
	 */
	static isDestructiveChange(
		fromIndex: IndexInfo,
		toIndex: DocIndex
	): boolean {
		// Changing from unique to non-unique is not destructive
		if (fromIndex.unique && !toIndex.unique) {
			return false;
		}

		// Changing from non-unique to unique can be destructive if data has duplicates
		if (!fromIndex.unique && toIndex.unique) {
			return true;
		}

		// Changing columns is destructive (requires index rebuild)
		if (!this.areColumnsEqual(fromIndex.columns, toIndex.columns)) {
			return true;
		}

		// Note: IndexInfo doesn't currently support where clause
		// When partial index support is added, this logic should be updated
		// For now, we assume any where clause in DocIndex represents a new partial index
		if (toIndex.where) {
			return true;
		}

		return false;
	}

	/**
	 * Get complexity score for an index change
	 * @param fromIndex Original index
	 * @param toIndex New index
	 * @returns Complexity score (higher = more complex)
	 */
	static getChangeComplexity(
		fromIndex: IndexInfo,
		toIndex: DocIndex
	): number {
		let score = 0;

		// Base score for any index change
		score += 5;

		// Adding unique constraint increases complexity
		if (!fromIndex.unique && toIndex.unique) {
			score += 10;
		}

		// Removing unique constraint
		if (fromIndex.unique && !toIndex.unique) {
			score += 3;
		}

		// Column changes
		if (!this.areColumnsEqual(fromIndex.columns, toIndex.columns)) {
			score += 8;
			// More columns means more complexity
			score += Math.max(fromIndex.columns.length, toIndex.columns.length);
		}

		// Where clause changes (IndexInfo doesn't support where clause yet)
		if (toIndex.where) {
			score += 7;
			// Complex where clauses add more complexity
			score += this.getWhereClauseComplexity(toIndex.where);
		}

		// Index type changes
		if (fromIndex.type && toIndex.type && 
			fromIndex.type.toLowerCase() !== toIndex.type.toLowerCase()) {
			score += 6;
		}

		return score;
	}

	/**
	 * Check if two column arrays are equal (order matters for indexes)
	 * @param columns1 First array of columns
	 * @param columns2 Second array of columns
	 * @returns True if columns are equal
	 */
	private static areColumnsEqual(columns1: string[], columns2: string[]): boolean {
		if (columns1.length !== columns2.length) {
			return false;
		}

		for (let i = 0; i < columns1.length; i++) {
			if (columns1[i].toLowerCase().trim() !== columns2[i].toLowerCase().trim()) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Normalize where clause for comparison
	 * @param whereClause Where clause to normalize
	 * @returns Normalized where clause
	 */
	private static normalizeWhereClause(whereClause: string): string {
		if (!whereClause) {
			return '';
		}

		// Basic normalization: trim, lowercase, normalize whitespace
		return whereClause
			.trim()
			.replace(/\s+/g, ' ')
			.toLowerCase();
	}

	/**
	 * Get complexity score for a where clause
	 * @param whereClause Where clause to analyze
	 * @returns Complexity score
	 */
	private static getWhereClauseComplexity(whereClause: string): number {
		if (!whereClause) {
			return 0;
		}

		let complexity = 0;
		const clause = whereClause.toLowerCase();

		// Add complexity for different operators
		if (clause.includes(' and ')) {
			complexity += clause.split(' and ').length - 1;
		}

		if (clause.includes(' or ')) {
			complexity += (clause.split(' or ').length - 1) * 2; // OR is more complex
		}

		if (clause.includes(' like ')) {
			complexity += 2;
		}

		if (clause.includes(' in ')) {
			complexity += 3;
		}

		if (clause.includes(' between ')) {
			complexity += 2;
		}

		if (clause.includes(' is null') || clause.includes(' is not null')) {
			complexity += 1;
		}

		// Add complexity for subqueries
		if (clause.includes(' select ')) {
			complexity += 5;
		}

		// Add complexity for functions
		const functionMatches = clause.match(/\b(\w+)\(/g);
		if (functionMatches) {
			complexity += functionMatches.length;
		}

		return complexity;
	}

	/**
	 * Check if index name is valid for SQLite
	 * @param name Index name to validate
	 * @returns True if name is valid
	 */
	static isValidIndexName(name: string): boolean {
		if (!name || name.length === 0) {
			return false;
		}

		if (name.length > this.MAX_INDEX_NAME_LENGTH) {
			return false;
		}

		// Check for valid characters (letters, numbers, underscore)
		const validPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
		return validPattern.test(name);
	}

	/**
	 * Sanitize index name for SQLite
	 * @param name Index name to sanitize
	 * @returns Sanitized index name
	 */
	static sanitizeIndexName(name: string): string {
		if (!name) {
			return 'idx_default';
		}

		// Replace invalid characters with underscore
		let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');

		// Ensure it starts with a letter or underscore
		if (/^[0-9]/.test(sanitized)) {
			sanitized = 'idx_' + sanitized;
		}

		// Truncate if too long
		if (sanitized.length > this.MAX_INDEX_NAME_LENGTH) {
			sanitized = sanitized.substring(0, this.MAX_INDEX_NAME_LENGTH);
		}

		// Ensure it's not empty after sanitization
		if (sanitized.length === 0) {
			sanitized = 'idx_default';
		}

		return sanitized;
	}

	/**
	 * Get index type priority for optimization
	 * @param indexType Index type
	 * @returns Priority score (higher = higher priority)
	 */
	static getIndexTypePriority(indexType?: string): number {
		if (!indexType) {
			return 5; // Default priority
		}

		const type = indexType.toLowerCase();
		switch (type) {
			case 'btree':
				return 5;
			case 'hash':
				return 7;
			case 'gist':
				return 8;
			case 'gin':
				return 9;
			case 'partial':
				return 6;
			default:
				return 3;
		}
	}
}