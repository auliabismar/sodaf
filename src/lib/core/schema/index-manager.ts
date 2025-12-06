/**
 * Index Manager
 * 
 * This module implements index creation and management for database tables.
 */

import type { DocIndex } from './types';
import { Database } from '../database/database';
import { SQLiteDatabase } from '../database/sqlite-database';

/**
 * Index Manager class
 * 
 * Provides methods for creating and managing database indexes.
 */
export class IndexManager {
	/**
	 * Database instance
	 */
	private db: Database;

	/**
	 * Constructor
	 * @param db Database instance
	 */
	constructor(db: Database) {
		this.db = db;
	}

	/**
	 * Create an index
	 * @param tableName Table name
	 * @param indexName Index name (optional, will be generated if not provided)
	 * @param columns Array of column names
	 * @param unique Whether index should be unique
	 * @returns Promise that resolves when index is created
	 */
	public async createIndex(
		tableName: string,
		indexName: string,
		columns: string[],
		unique: boolean = false
	): Promise<void> {
		// Handle index naming based on the provided indexName
		if (indexName.startsWith('idx_')) {
			// If it already starts with idx_, use it as-is
			// This preserves existing index names
		} else {
			// If it doesn't start with idx_, generate a new name following the convention
			// Use the provided indexName as the suffix, not the column names
			indexName = `idx_${tableName}_${indexName}`;
		}
		
		await (this.db as SQLiteDatabase).create_index(indexName, tableName, columns, unique);
	}

	/**
	 * Drop an index
	 * @param indexName Index name
	 * @returns Promise that resolves when index is dropped
	 */
	public async dropIndex(indexName: string): Promise<void> {
		await (this.db as SQLiteDatabase).drop_index(indexName);
	}

	/**
	 * Get all indexes for a table
	 * @param tableName Table name
	 * @returns Promise that resolves to array of index information
	 */
	public async getIndexes(tableName: string): Promise<DocIndex[]> {
		const indexInfo = await (this.db as SQLiteDatabase).get_indexes(tableName);
		
		return indexInfo.map(info => ({
			name: info.name,
			fields: info.columns,
			unique: info.unique
		}));
	}

	/**
	 * Check if an index exists
	 * @param indexName Index name
	 * @param tableName Optional table name to limit search to
	 * @returns Promise that resolves to true if index exists
	 */
	public async indexExists(indexName: string, tableName?: string): Promise<boolean> {
		try {
			if (tableName) {
				// Check indexes for specific table
				const indexes = await this.getIndexes(tableName);
				return indexes.some(index => index.name === indexName);
			} else {
				// Check all indexes in the database
				const allIndexes = await (this.db as SQLiteDatabase).get_all_indexes();
				return allIndexes.some((index: any) => index.name === indexName);
			}
		} catch (error) {
			return false;
		}
	}
}