/**
 * Database Abstract Class
 * 
 * This module defines the abstract Database class that provides the interface
 * for all database operations. All database implementations must extend this class.
 */

import type {
	QueryOptions,
	QueryResult,
	TransactionOptions,
	TableInfo,
	ColumnInfo,
	ForeignKeyInfo,
	IndexInfo,
	Migration
} from './types';

/**
 * Abstract Database class defining the interface for all database operations
 * 
 * This class provides the complete interface for CRUD operations, transactions,
 * schema management, and other database functionality.
 * 
 * @abstract
 */
export abstract class Database {
	/**
	 * Database configuration
	 */
	protected config: any;

	/**
	 * Constructor
	 * @param config Database configuration options
	 */
	constructor(config: any = {}) {
		this.config = config;
	}

	/**
	 * Execute a raw SQL query
	 * @param query SQL query string with optional placeholders
	 * @param values Array of values for parameterized query
	 * @param as_dict Whether to return results as objects (default) or arrays
	 * @returns Promise that resolves to query results
	 */
	public abstract sql(
		query: string,
		values?: any[],
		as_dict?: boolean
	): Promise<any[]>;

	/**
	 * Execute a SQL statement that doesn't return data (INSERT, UPDATE, DELETE, CREATE, etc.)
	 * @param query SQL statement with optional placeholders
	 * @param values Optional values for placeholders
	 * @returns Promise that resolves to the result
	 */
	public abstract run(
		query: string,
		values?: any[]
	): Promise<any>;

	/**
	 * Get a single value from a document
	 * @param doctype Document type
	 * @param name Document name
	 * @param field Field name (optional, returns all fields if not specified)
	 * @returns Promise that resolves to the field value or document object
	 */
	public abstract get_value(
		doctype: string,
		name: string,
		field?: string
	): Promise<any>;

	/**
	 * Set a single value in a document
	 * @param doctype Document type
	 * @param name Document name
	 * @param field Field name or object with multiple fields
	 * @param value Field value (if field is a string)
	 * @returns Promise that resolves when the operation is complete
	 */
	public abstract set_value(
		doctype: string,
		name: string,
		field: string | Record<string, any>,
		value?: any
	): Promise<void>;

	/**
	 * Get a single value from a Single doctype
	 * @param doctype Single doctype name
	 * @param field Field name (optional, returns all fields if not specified)
	 * @returns Promise that resolves to the field value or document object
	 */
	public abstract get_single_value(
		doctype: string,
		field?: string
	): Promise<any>;

	/**
	 * Set a single value in a Single doctype
	 * @param doctype Single doctype name
	 * @param field Field name or object with multiple fields
	 * @param value Field value (if field is a string)
	 * @returns Promise that resolves when the operation is complete
	 */
	public abstract set_single_value(
		doctype: string,
		field: string | Record<string, any>,
		value?: any
	): Promise<void>;

	/**
	 * Get a single document by name
	 * @param doctype Document type
	 * @param name Document name
	 * @returns Promise that resolves to the document or null if not found
	 */
	public abstract get_doc(
		doctype: string,
		name: string
	): Promise<any | null>;

	/**
	 * Get all documents matching the query options
	 * @param doctype Document type
	 * @param options Query options for filtering, sorting, pagination
	 * @returns Promise that resolves to array of documents
	 */
	public abstract get_all(
		doctype: string,
		options?: QueryOptions
	): Promise<any[]>;

	/**
	 * Alias for get_all method
	 * @param doctype Document type
	 * @param options Query options for filtering, sorting, pagination
	 * @returns Promise that resolves to array of documents
	 */
	public abstract get_list(
		doctype: string,
		options?: QueryOptions
	): Promise<any[]>;

	/**
	 * Get the count of documents matching the query options
	 * @param doctype Document type
	 * @param options Query options for filtering
	 * @returns Promise that resolves to the count
	 */
	public abstract get_count(
		doctype: string,
		options?: QueryOptions
	): Promise<number>;

	/**
	 * Check if a document exists
	 * @param doctype Document type
	 * @param name Document name (optional, checks if any document exists if not specified)
	 * @param filters Additional filters (optional)
	 * @returns Promise that resolves to true if document exists
	 */
	public abstract exists(
		doctype: string,
		name?: string,
		filters?: Record<string, any>
	): Promise<boolean>;

	/**
	 * Insert a new document
	 * @param doctype Document type
	 * @param doc Document object or array of documents
	 * @returns Promise that resolves to the name of the inserted document
	 */
	public abstract insert(
		doctype: string,
		doc: any | any[]
	): Promise<string | string[]>;

	/**
	 * Update an existing document
	 * @param doctype Document type
	 * @param name Document name
	 * @param doc Document object with updated fields
	 * @returns Promise that resolves when the operation is complete
	 */
	public abstract update(
		doctype: string,
		name: string,
		doc: any
	): Promise<void>;

	/**
	 * Delete a document
	 * @param doctype Document type
	 * @param name Document name
	 * @returns Promise that resolves when the operation is complete
	 */
	public abstract delete(
		doctype: string,
		name: string
	): Promise<void>;

	/**
	 * Insert multiple documents in a single operation
	 * @param doctype Document type
	 * @param docs Array of documents to insert
	 * @returns Promise that resolves to array of inserted document names
	 */
	public abstract bulk_insert(
		doctype: string,
		docs: any[]
	): Promise<string[]>;

	/**
	 * Delete all documents matching the query options
	 * @param doctype Document type
	 * @param options Query options for filtering
	 * @returns Promise that resolves to the number of deleted documents
	 */
	public abstract delete_all(
		doctype: string,
		options?: QueryOptions
	): Promise<number>;

	/**
	 * Begin a new transaction
	 * @param options Transaction options
	 * @returns Promise that resolves to a transaction object
	 */
	public abstract begin(
		options?: TransactionOptions
	): Promise<any>;

	/**
	 * Commit a transaction
	 * @param transaction Transaction object
	 * @returns Promise that resolves when the transaction is committed
	 */
	public abstract commit(
		transaction: any
	): Promise<void>;

	/**
	 * Rollback a transaction
	 * @param transaction Transaction object
	 * @returns Promise that resolves when the transaction is rolled back
	 */
	public abstract rollback(
		transaction: any
	): Promise<void>;

	/**
	 * Create a savepoint within a transaction
	 * @param name Savepoint name
	 * @param transaction Transaction object (optional)
	 * @returns Promise that resolves to a savepoint object
	 */
	public abstract savepoint(
		name: string,
		transaction?: any
	): Promise<any>;

	/**
	 * Rollback to a savepoint
	 * @param savepoint Savepoint object or name
	 * @returns Promise that resolves when rolled back to savepoint
	 */
	public abstract rollback_to_savepoint(
		savepoint: any
	): Promise<void>;

	/**
	 * Release a savepoint
	 * @param savepoint Savepoint object or name
	 * @returns Promise that resolves when savepoint is released
	 */
	public abstract release_savepoint(
		savepoint: any
	): Promise<void>;

	/**
	 * Execute a function within a transaction
	 * @param fn Function to execute within transaction
	 * @param options Transaction options
	 * @returns Promise that resolves to the function's return value
	 */
	public abstract withTransaction<T>(
		fn: (transaction: any) => Promise<T>,
		options?: TransactionOptions
	): Promise<T>;

	/**
	 * Get table information
	 * @param tableName Table name
	 * @returns Promise that resolves to table information
	 */
	public abstract get_table_info(
		tableName: string
	): Promise<TableInfo>;

	/**
	 * Get column information for a table
	 * @param tableName Table name
	 * @returns Promise that resolves to array of column information
	 */
	public abstract get_columns(
		tableName: string
	): Promise<ColumnInfo[]>;

	/**
	 * Get foreign key information for a table
	 * @param tableName Table name
	 * @returns Promise that resolves to array of foreign key information
	 */
	public abstract get_foreign_keys(
		tableName: string
	): Promise<ForeignKeyInfo[]>;

	/**
	 * Get index information for a table
	 * @param tableName Table name
	 * @returns Promise that resolves to array of index information
	 */
	public abstract get_indexes(
		tableName: string
	): Promise<IndexInfo[]>;

	/**
	 * Get all indexes in the database
	 * @returns Promise that resolves to array of index information
	 */
	public abstract get_all_indexes(): Promise<IndexInfo[]>;

	/**
	 * Check if a table exists
	 * @param tableName Table name
	 * @returns Promise that resolves to true if table exists
	 */
	public abstract table_exists(tableName: string): Promise<boolean>;

	/**
	 * Create a table
	 * @param tableName Table name
	 * @param columns Array of column definitions
	 * @param options Additional options (primary keys, indexes, etc.)
	 * @returns Promise that resolves when the table is created
	 */
	public abstract create_table(
		tableName: string,
		columns: ColumnInfo[],
		options?: any
	): Promise<void>;

	/**
	 * Drop a table
	 * @param tableName Table name
	 * @param ifExists Whether to check if table exists before dropping
	 * @returns Promise that resolves when the table is dropped
	 */
	public abstract drop_table(
		tableName: string,
		ifExists?: boolean
	): Promise<void>;

	/**
	 * Rename a table
	 * @param oldName Current table name
	 * @param newName New table name
	 * @returns Promise that resolves when the table is renamed
	 */
	public abstract rename_table(
		oldName: string,
		newName: string
	): Promise<void>;

	/**
	 * Add a column to a table
	 * @param tableName Table name
	 * @param column Column definition
	 * @returns Promise that resolves when the column is added
	 */
	public abstract add_column(
		tableName: string,
		column: ColumnInfo
	): Promise<void>;

	/**
	 * Drop a column from a table
	 * @param tableName Table name
	 * @param columnName Column name
	 * @returns Promise that resolves when the column is dropped
	 */
	public abstract drop_column(
		tableName: string,
		columnName: string
	): Promise<void>;

	/**
	 * Rename a column
	 * @param tableName Table name
	 * @param oldName Current column name
	 * @param newName New column name
	 * @returns Promise that resolves when the column is renamed
	 */
	public abstract rename_column(
		tableName: string,
		oldName: string,
		newName: string
	): Promise<void>;

	/**
	 * Create an index
	 * @param indexName Index name
	 * @param tableName Table name
	 * @param columns Array of column names
	 * @param unique Whether the index should be unique
	 * @returns Promise that resolves when the index is created
	 */
	public abstract create_index(
		indexName: string,
		tableName: string,
		columns: string[],
		unique?: boolean
	): Promise<void>;

	/**
	 * Drop an index
	 * @param indexName Index name
	 * @returns Promise that resolves when the index is dropped
	 */
	public abstract drop_index(
		indexName: string
	): Promise<void>;

	/**
	 * Run a migration
	 * @param migration Migration object
	 * @returns Promise that resolves when the migration is complete
	 */
	public abstract run_migration(
		migration: Migration
	): Promise<void>;

	/**
	 * Get the current migration version
	 * @returns Promise that resolves to the current version
	 */
	public abstract get_migration_version(): Promise<number>;

	/**
	 * Set the migration version
	 * @param version Migration version
	 * @returns Promise that resolves when the version is set
	 */
	public abstract set_migration_version(
		version: number
	): Promise<void>;

	/**
	 * Close the database connection
	 * @returns Promise that resolves when the connection is closed
	 */
	public abstract close(): Promise<void>;

	/**
	 * Check if the database connection is open
	 * @returns True if connection is open
	 */
	public abstract is_open(): boolean;

	/**
	 * Get the database connection object (implementation-specific)
	 * @returns The underlying database connection object
	 */
	public abstract get_connection(): any;
}