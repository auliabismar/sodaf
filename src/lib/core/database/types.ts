/**
 * Database Types and Interfaces
 * 
 * This module defines TypeScript interfaces for database operations, query options,
 * and connection pooling.
 */

/**
 * Filter operators supported in queries
 */
export type FilterOperator = 
	| '='           // Equals
	| '!='          // Not equals
	| '>'           // Greater than
	| '<'           // Less than
	| '>='          // Greater than or equal
	| '<='          // Less than or equal
	| 'like'        // LIKE pattern matching
	| 'not like'    // NOT LIKE pattern matching
	| 'in'          // IN list
	| 'not in'      // NOT IN list
	| 'between'     // BETWEEN range
	| 'not between' // NOT BETWEEN range
	| 'is'          // IS NULL/TRUE/FALSE
	| 'is not';     // IS NOT NULL/TRUE/FALSE

/**
 * Filter condition in array format: [field, operator, value]
 */
export type FilterCondition = [string, FilterOperator, any];

/**
 * Query options for database operations
 */
export interface QueryOptions {
	/** 
	 * Object-based filters: { field: value } 
	 * For simple equality checks
	 */
	filters?: Record<string, any>;
	
	/** 
	 * Array-based filters: [field, operator, value][] 
	 * For complex conditions with specific operators
	 */
	or_filters?: FilterCondition[];
	
	/** 
	 * OR conditions: [field, operator, value][] 
	 * Same format as filters but combined with OR
	 */
	and_filters?: FilterCondition[];
	
	/** 
	 * Field selection: array of field names to return 
	 * If not specified, all fields are returned
	 */
	fields?: string[];
	
	/** 
	 * Pagination options 
	 * limit_start: Number of records to skip (offset)
	 * limit_page_length: Maximum number of records to return
	 */
	limit_start?: number;
	limit_page_length?: number;
	
	/** 
	 * Sorting: field name with optional direction
	 * Examples: 'name', 'name desc', 'creation asc'
	 */
	order_by?: string;
	
	/** 
	 * Pluck: return array of values from a single field
	 * If specified, returns an array of values instead of objects
	 */
	pluck?: string;
	
	/** 
	 * Group by: field name(s) for grouping
	 * Can be a string (single field) or array of strings
	 */
	group_by?: string | string[];
	
	/** 
	 * Having: conditions to apply after grouping
	 * Same format as filters
	 */
	having?: Record<string, any> | FilterCondition[];
	
	/** 
	 * Distinct: return only unique records
	 */
	distinct?: boolean;
	
	/** 
	 * As dictionary: return as object with name as key
	 * Only applicable when querying documents with name field
	 */
	as_dict?: boolean;
	
	/** 
	 * Debug: enable debug logging for the query
	 */
	debug?: boolean;
}

/**
 * Connection pool statistics
 */
export interface PoolStats {
	/** Total number of connections in the pool */
	total: number;
	
	/** Number of active connections currently in use */
	active: number;
	
	/** Number of idle connections available for use */
	idle: number;
	
	/** Number of requests waiting for a connection */
	waiting: number;
}

/**
 * Connection pool configuration options
 */
export interface PoolOptions {
	/** Minimum number of connections to maintain in the pool */
	min?: number;
	
	/** Maximum number of connections allowed in the pool */
	max?: number;
	
	/** Idle timeout in milliseconds - connections idle longer than this will be closed */
	idle_timeout?: number;
	
	/** Acquire timeout in milliseconds - maximum time to wait for a connection */
	acquire_timeout?: number;
	
	/** Whether to create connections on demand or pre-create them */
	create_on_demand?: boolean;
	
	/** Whether to validate connections before returning them from the pool */
	validate_connection?: boolean;
}

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
	/** Database file path for SQLite */
	path?: string;
	
	/** Connection pool options */
	pool?: PoolOptions;
	
	/** Whether to enable WAL mode for SQLite */
	enable_wal?: boolean;
	
	/** Whether to enable foreign key constraints */
	enable_foreign_keys?: boolean;
	
	/** Journal mode for SQLite */
	journal_mode?: 'DELETE' | 'TRUNCATE' | 'PERSIST' | 'MEMORY' | 'WAL' | 'OFF';
	
	/** Synchronous mode for SQLite */
	synchronous?: 'OFF' | 'NORMAL' | 'FULL' | 'EXTRA';
	
	/** Cache size in pages */
	cache_size?: number;
	
	/** Temporary storage location */
	temp_store?: 'DEFAULT' | 'FILE' | 'MEMORY';
}

/**
 * Transaction isolation levels
 */
export type IsolationLevel = 
	| 'READ_UNCOMMITTED'
	| 'READ_COMMITTED'
	| 'REPEATABLE_READ'
	| 'SERIALIZABLE';

/**
 * Transaction options
 */
export interface TransactionOptions {
	/** Isolation level for the transaction */
	isolation_level?: IsolationLevel;
	
	/** Whether to make the transaction read-only */
	read_only?: boolean;
	
	/** Whether to create a savepoint instead of a full transaction */
	savepoint?: boolean;
	
	/** Savepoint name (if creating a savepoint) */
	savepoint_name?: string;
}

/**
 * Database result metadata
 */
export interface QueryResult<T = any> {
	/** Array of result records */
	data: T[];
	
	/** Total number of records (before limit) */
	total_count?: number;
	
	/** Query execution time in milliseconds */
	execution_time?: number;
	
	/** Number of affected rows (for INSERT/UPDATE/DELETE) */
	affected_rows?: number;
	
	/** Last inserted row ID */
	last_insert_id?: any;
	
	/** Whether the query was successful */
	success: boolean;
	
	/** Error message if the query failed */
	error?: string;
}

/**
 * Database migration interface
 */
export interface Migration {
	/** Migration version number */
	version: number;
	
	/** Migration description */
	description: string;
	
	/** SQL statements to execute for upgrading */
	up: string | string[];
	
	/** SQL statements to execute for downgrading */
	down: string | string[];
	
	/** Whether this migration is destructive (data loss possible) */
	destructive?: boolean;
}

/**
 * Database schema information
 */
export interface TableInfo {
	/** Table name */
	name: string;
	
	/** Table columns */
	columns: ColumnInfo[];
	
	/** Primary key columns */
	primary_keys: string[];
	
	/** Foreign key constraints */
	foreign_keys: ForeignKeyInfo[];
	
	/** Indexes on the table */
	indexes: IndexInfo[];
	
	/** Table type (table, view, etc.) */
	type: 'table' | 'view' | 'virtual';
}

/**
 * Column information
 */
export interface ColumnInfo {
	/** Column name */
	name: string;
	
	/** Data type */
	type: string;
	
	/** Whether column can be null */
	nullable: boolean;
	
	/** Default value */
	default_value?: any;
	
	/** Whether column is part of primary key */
	primary_key: boolean;
	
	/** Whether column is auto-incrementing */
	auto_increment: boolean;
	
	/** Whether column is unique */
	unique: boolean;
}

/**
 * Foreign key information
 */
export interface ForeignKeyInfo {
	/** Column name in this table */
	column: string;
	
	/** Referenced table */
	referenced_table: string;
	
	/** Referenced column */
	referenced_column: string;
	
	/** Action on delete */
	on_delete: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';
	
	/** Action on update */
	on_update: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';
}

/**
 * Index information
 */
export interface IndexInfo {
	/** Index name */
	name: string;
	
	/** Indexed columns */
	columns: string[];
	
	/** Whether index is unique */
	unique: boolean;
	
	/** Index type (btree, hash, etc.) */
	type?: string;
}