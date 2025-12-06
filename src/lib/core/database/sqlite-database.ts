/**
 * SQLite Database Implementation
 * 
 * This module implements the Database abstract class using better-sqlite3.
 * It provides a complete implementation of all CRUD operations, transactions,
 * schema management, and other database functionality.
 */

import Database from 'better-sqlite3';
import { Database as AbstractDatabase } from './database';
import type {
	QueryOptions,
	QueryResult,
	TransactionOptions,
	TableInfo,
	ColumnInfo,
	ForeignKeyInfo,
	IndexInfo,
	Migration,
	DatabaseConfig,
	FilterCondition,
	FilterOperator
} from './types';

/**
 * SQLite Database implementation
 * 
 * This class extends the abstract Database class and implements all methods
 * using the better-sqlite3 library.
 */
export class SQLiteDatabase extends AbstractDatabase {
	/**
	 * SQLite database connection
	 */
	private db: Database.Database | null = null;

	/**
	 * Current transaction state
	 */
	private inTransaction: boolean = false;

	/**
	 * Transaction savepoints stack
	 */
	private savepoints: string[] = [];

	/**
	 * Current user for context
	 */
	private currentUser: string = 'Administrator';

	/**
	 * Constructor
	 * @param config Database configuration options
	 */
	constructor(config: DatabaseConfig = {}) {
		super(config);
		this.connect();
	}

	/**
	 * Connect to the SQLite database
	 */
	private connect(): void {
		const dbPath = this.config.path || ':memory:';
		
		try {
			this.db = new Database(dbPath);
			
			// Configure database settings
			if (this.config.enable_wal !== false) {
				this.db.exec('PRAGMA journal_mode = WAL');
			}
			
			if (this.config.enable_foreign_keys !== false) {
				this.db.exec('PRAGMA foreign_keys = ON');
			}
			
			if (this.config.synchronous) {
				this.db.exec(`PRAGMA synchronous = ${this.config.synchronous}`);
			}
			
			if (this.config.cache_size) {
				this.db.exec(`PRAGMA cache_size = ${this.config.cache_size}`);
			}
			
			if (this.config.temp_store) {
				this.db.exec(`PRAGMA temp_store = ${this.config.temp_store}`);
			}
			
			// Initialize database schema
			this.initializeSchema();
		} catch (error) {
			throw new Error(`Failed to connect to database: ${(error as Error).message}`);
		}
	}

	/**
	 * Initialize the database schema with required tables
	 */
	private initializeSchema(): void {
		if (!this.db) throw new Error('Database not connected');
		
		// For now, we'll skip creating default tables to avoid SQL syntax issues
		// Tables will be created as needed by the schema management functions
	}

	/**
	 * Set the current user for context
	 * @param user User name
	 */
	public setCurrentUser(user: string): void {
		this.currentUser = user;
	}

	/**
	 * Execute a raw SQL query
	 * @param query SQL query string with optional placeholders
	 * @param values Array of values for parameterized query
	 * @param as_dict Whether to return results as objects (default) or arrays
	 * @returns Promise that resolves to query results
	 */
	public async sql(
		query: string,
		values: any[] = [],
		as_dict: boolean = true
	): Promise<any[]> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const stmt = this.db.prepare(query);
			const result = stmt.all(values);
			
			if (as_dict) {
				return result;
			} else {
				// Convert objects to arrays
				return result.map(row => Object.values(row as Record<string, unknown>));
			}
		} catch (error) {
			throw new Error(`SQL Error: ${(error as Error).message} in query: ${query}`);
		}
	}

	/**
	 * Execute a SQL statement that doesn't return data (INSERT, UPDATE, DELETE, CREATE, etc.)
	 * @param query SQL statement with optional placeholders
	 * @param values Optional values for placeholders
	 * @returns Promise that resolves to the result
	 */
	public async run(
		query: string,
		values: any[] = []
	): Promise<any> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const stmt = this.db.prepare(query);
			return stmt.run(values);
		} catch (error) {
			throw new Error(`SQL Error: ${(error as Error).message} in query: ${query}`);
		}
	}

	/**
	 * Get a single value from a document
	 * @param doctype Document type
	 * @param name Document name
	 * @param field Field name (optional, returns all fields if not specified)
	 * @returns Promise that resolves to the field value or document object
	 */
	public async get_value(
		doctype: string,
		name: string,
		field?: string
	): Promise<any> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			if (field) {
				const stmt = this.db.prepare(`
					SELECT ${field} FROM ${doctype} WHERE name = ?
				`);
				const result = stmt.get(name);
				return result ? (result as Record<string, any>)[field] : null;
			} else {
				const stmt = this.db.prepare(`
					SELECT * FROM ${doctype} WHERE name = ?
				`);
				return stmt.get(name) || null;
			}
		} catch (error) {
			throw new Error(`Error getting value: ${(error as Error).message}`);
		}
	}

	/**
	 * Set a single value in a document
	 * @param doctype Document type
	 * @param name Document name
	 * @param field Field name or object with multiple fields
	 * @param value Field value (if field is a string)
	 * @returns Promise that resolves when the operation is complete
	 */
	public async set_value(
		doctype: string,
		name: string,
		field: string | Record<string, any>,
		value?: any
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
			
			if (typeof field === 'string') {
				const stmt = this.db.prepare(`
					UPDATE ${doctype} 
					SET ${field} = ?, modified = ?, modified_by = ?
					WHERE name = ?
				`);
				stmt.run(value, now, this.currentUser, name);
			} else {
				// field is an object with multiple fields
				const updates = Object.keys(field).map(key => `${key} = ?`).join(', ');
				const values = Object.values(field);
				const stmt = this.db.prepare(`
					UPDATE ${doctype} 
					SET ${updates}, modified = ?, modified_by = ?
					WHERE name = ?
				`);
				stmt.run(...values, now, this.currentUser, name);
			}
		} catch (error) {
			throw new Error(`Error setting value: ${(error as Error).message}`);
		}
	}

	/**
	 * Get a single value from a Single doctype
	 * @param doctype Single doctype name
	 * @param field Field name (optional, returns all fields if not specified)
	 * @returns Promise that resolves to the field value or document object
	 */
	public async get_single_value(
		doctype: string,
		field?: string
	): Promise<any> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			if (field) {
				const stmt = this.db.prepare(`
					SELECT ${field} FROM ${doctype} WHERE name = (SELECT name FROM ${doctype} LIMIT 1)
				`);
				const result = stmt.get();
				return result ? (result as Record<string, any>)[field] : null;
			} else {
				const stmt = this.db.prepare(`
					SELECT * FROM ${doctype} LIMIT 1
				`);
				return stmt.get() || null;
			}
		} catch (error) {
			throw new Error(`Error getting single value: ${(error as Error).message}`);
		}
	}

	/**
	 * Set a single value in a Single doctype
	 * @param doctype Single doctype name
	 * @param field Field name or object with multiple fields
	 * @param value Field value (if field is a string)
	 * @returns Promise that resolves when the operation is complete
	 */
	public async set_single_value(
		doctype: string,
		field: string | Record<string, any>,
		value?: any
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
			
			// First check if a record exists
			const existsStmt = this.db.prepare(`
				SELECT name FROM ${doctype} LIMIT 1
			`);
			const exists = existsStmt.get();
			
			if (!exists) {
				// Create a new record with the name as the doctype
				const insertStmt = this.db.prepare(`
					INSERT INTO ${doctype} (name, creation, modified, modified_by, owner)
					VALUES (?, ?, ?, ?, ?)
				`);
				insertStmt.run(doctype, now, now, this.currentUser, this.currentUser);
			}
			
			if (typeof field === 'string') {
				const stmt = this.db.prepare(`
					UPDATE ${doctype} 
					SET ${field} = ?, modified = ?, modified_by = ?
					WHERE name = (SELECT name FROM ${doctype} LIMIT 1)
				`);
				stmt.run(value, now, this.currentUser);
			} else {
				// field is an object with multiple fields
				const updates = Object.keys(field).map(key => `${key} = ?`).join(', ');
				const values = Object.values(field);
				const stmt = this.db.prepare(`
					UPDATE ${doctype} 
					SET ${updates}, modified = ?, modified_by = ?
					WHERE name = (SELECT name FROM ${doctype} LIMIT 1)
				`);
				stmt.run(...values, now, this.currentUser);
			}
		} catch (error) {
			throw new Error(`Error setting single value: ${(error as Error).message}`);
		}
	}

	/**
	 * Get a single document by name
	 * @param doctype Document type
	 * @param name Document name
	 * @returns Promise that resolves to the document or null if not found
	 */
	public async get_doc(
		doctype: string,
		name: string
	): Promise<any | null> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const stmt = this.db.prepare(`
				SELECT * FROM ${doctype} WHERE name = ?
			`);
			return stmt.get(name) || null;
		} catch (error) {
			throw new Error(`Error getting document: ${(error as Error).message}`);
		}
	}

	/**
	 * Build WHERE clause from query options
	 * @param options Query options
	 * @returns Object with WHERE clause and parameters
	 */
	private buildWhereClause(options: QueryOptions): { where: string; params: any[] } {
		const conditions: string[] = [];
		const params: any[] = [];
		
		// Handle object filters
		if (options.filters) {
			for (const [field, value] of Object.entries(options.filters)) {
				conditions.push(`${field} = ?`);
				params.push(value);
			}
		}
		
		// Handle array filters
		if (options.and_filters) {
			for (const [field, operator, value] of options.and_filters) {
				const condition = this.buildFilterCondition(field, operator, value);
				conditions.push(condition.clause);
				params.push(...condition.params);
			}
		}
		
		// Handle OR filters
		if (options.or_filters) {
			const orConditions: string[] = [];
			for (const [field, operator, value] of options.or_filters) {
				const condition = this.buildFilterCondition(field, operator, value);
				orConditions.push(condition.clause);
				params.push(...condition.params);
			}
			if (orConditions.length > 0) {
				conditions.push(`(${orConditions.join(' OR ')})`);
			}
		}
		
		const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
		return { where, params };
	}

	/**
	 * Build a single filter condition
	 * @param field Field name
	 * @param operator Filter operator
	 * @param value Filter value
	 * @returns Object with clause and parameters
	 */
	private buildFilterCondition(
		field: string,
		operator: FilterOperator,
		value: any
	): { clause: string; params: any[] } {
		switch (operator) {
			case '=':
				return { clause: `${field} = ?`, params: [value] };
			case '!=':
				return { clause: `${field} != ?`, params: [value] };
			case '>':
				return { clause: `${field} > ?`, params: [value] };
			case '<':
				return { clause: `${field} < ?`, params: [value] };
			case '>=':
				return { clause: `${field} >= ?`, params: [value] };
			case '<=':
				return { clause: `${field} <= ?`, params: [value] };
			case 'like':
				return { clause: `${field} LIKE ?`, params: [value] };
			case 'not like':
				return { clause: `${field} NOT LIKE ?`, params: [value] };
			case 'in':
				const placeholders = Array(value.length).fill('?').join(', ');
				return { clause: `${field} IN (${placeholders})`, params: value };
			case 'not in':
				const notInPlaceholders = Array(value.length).fill('?').join(', ');
				return { clause: `${field} NOT IN (${notInPlaceholders})`, params: value };
			case 'between':
				return { clause: `${field} BETWEEN ? AND ?`, params: [value[0], value[1]] };
			case 'not between':
				return { clause: `${field} NOT BETWEEN ? AND ?`, params: [value[0], value[1]] };
			case 'is':
				return { clause: `${field} IS ?`, params: [value] };
			case 'is not':
				return { clause: `${field} IS NOT ?`, params: [value] };
			default:
				throw new Error(`Unsupported operator: ${operator}`);
		}
	}

	/**
	 * Get all documents matching the query options
	 * @param doctype Document type
	 * @param options Query options for filtering, sorting, pagination
	 * @returns Promise that resolves to array of documents
	 */
	public async get_all(
		doctype: string,
		options: QueryOptions = {}
	): Promise<any[]> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const { where, params } = this.buildWhereClause(options);
			
			// Build SELECT clause
			let select = '*';
			if (options.fields && options.fields.length > 0) {
				select = options.fields.join(', ');
			}
			
			// Build ORDER BY clause
			let orderBy = '';
			if (options.order_by) {
				orderBy = `ORDER BY ${options.order_by}`;
			}
			
			// Build LIMIT clause
			let limit = '';
			if (options.limit_page_length) {
				limit = `LIMIT ${options.limit_page_length}`;
				if (options.limit_start) {
					limit += ` OFFSET ${options.limit_start}`;
				}
			}
			
			// Build GROUP BY clause
			let groupBy = '';
			if (options.group_by) {
				if (Array.isArray(options.group_by)) {
					groupBy = `GROUP BY ${options.group_by.join(', ')}`;
				} else {
					groupBy = `GROUP BY ${options.group_by}`;
				}
			}
			
			// Build HAVING clause
			let having = '';
			if (options.having) {
				// For simplicity, treat having as object filters
				const havingConditions: string[] = [];
				const havingParams: any[] = [];
				
				if (Array.isArray(options.having)) {
					for (const [field, operator, value] of options.having) {
						const condition = this.buildFilterCondition(field, operator, value);
						havingConditions.push(condition.clause);
						havingParams.push(...condition.params);
					}
				} else {
					for (const [field, value] of Object.entries(options.having)) {
						havingConditions.push(`${field} = ?`);
						havingParams.push(value);
					}
				}
				
				if (havingConditions.length > 0) {
					having = `HAVING ${havingConditions.join(' AND ')}`;
					params.push(...havingParams);
				}
			}
			
			// Build DISTINCT clause
			let distinct = '';
			if (options.distinct) {
				distinct = 'DISTINCT';
			}
			
			const query = `
				SELECT ${distinct} ${select} 
				FROM ${doctype} 
				${where} 
				${groupBy} 
				${having} 
				${orderBy} 
				${limit}
			`;
			
			const stmt = this.db.prepare(query);
			const results = stmt.all(params);
			
			// Handle pluck option
			if (options.pluck) {
				return results.map(row => (row as Record<string, any>)[options.pluck!]);
			}
			
			// Handle as_dict option
			if (options.as_dict) {
				const dict: Record<string, any> = {};
				for (const row of results) {
					dict[(row as Record<string, any>).name] = row;
				}
				return [dict];
			}
			
			return results;
		} catch (error) {
			throw new Error(`Error getting all documents: ${(error as Error).message}`);
		}
	}

	/**
	 * Alias for get_all method
	 * @param doctype Document type
	 * @param options Query options for filtering, sorting, pagination
	 * @returns Promise that resolves to array of documents
	 */
	public async get_list(
		doctype: string,
		options?: QueryOptions
	): Promise<any[]> {
		return this.get_all(doctype, options);
	}

	/**
	 * Get the count of documents matching the query options
	 * @param doctype Document type
	 * @param options Query options for filtering
	 * @returns Promise that resolves to the count
	 */
	public async get_count(
		doctype: string,
		options: QueryOptions = {}
	): Promise<number> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const { where, params } = this.buildWhereClause(options);
			
			const query = `
				SELECT COUNT(*) as count 
				FROM ${doctype} 
				${where}
			`;
			
			const stmt = this.db.prepare(query);
			const result = stmt.get(params);
			return result ? (result as Record<string, any>).count : 0;
		} catch (error) {
			throw new Error(`Error getting count: ${(error as Error).message}`);
		}
	}

	/**
	 * Check if a document exists
	 * @param doctype Document type
	 * @param name Document name (optional, checks if any document exists if not specified)
	 * @param filters Additional filters (optional)
	 * @returns Promise that resolves to true if document exists
	 */
	public async exists(
		doctype: string,
		name?: string,
		filters?: Record<string, any>
	): Promise<boolean> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			let query = `SELECT 1 FROM ${doctype}`;
			const params: any[] = [];
			
			if (name) {
				query += ` WHERE name = ?`;
				params.push(name);
			} else if (filters) {
				const conditions: string[] = [];
				for (const [field, value] of Object.entries(filters)) {
					conditions.push(`${field} = ?`);
					params.push(value);
				}
				if (conditions.length > 0) {
					query += ` WHERE ${conditions.join(' AND ')}`;
				}
			}
			
			query += ` LIMIT 1`;
			
			const stmt = this.db.prepare(query);
			const result = stmt.get(params);
			return !!result;
		} catch (error) {
			throw new Error(`Error checking existence: ${(error as Error).message}`);
		}
	}

	/**
	 * Insert a new document
	 * @param doctype Document type
	 * @param doc Document object or array of documents
	 * @returns Promise that resolves to the name of the inserted document
	 */
	public async insert(
		doctype: string,
		doc: any | any[]
	): Promise<string | string[]> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
			
			if (Array.isArray(doc)) {
				// Bulk insert
				const names: string[] = [];
				
				for (const document of doc) {
					// Set standard fields
					const docToInsert = {
						...document,
						creation: now,
						modified: now,
						modified_by: this.currentUser,
						owner: this.currentUser,
						docstatus: document.docstatus || 0,
						__unsaved: 0
					};
					
					// Ensure name is set
					if (!docToInsert.name) {
						docToInsert.name = this.generateName(doctype);
					}
					
					const fields = Object.keys(docToInsert).join(', ');
					const placeholders = Array(Object.keys(docToInsert).length).fill('?').join(', ');
					const values = Object.values(docToInsert);
					
					const query = `INSERT INTO ${doctype} (${fields}) VALUES (${placeholders})`;
					const stmt = this.db.prepare(query);
					stmt.run(values);
					
					names.push(docToInsert.name);
				}
				
				return names;
			} else {
				// Single insert
				const docToInsert = {
					...doc,
					creation: now,
					modified: now,
					modified_by: this.currentUser,
					owner: this.currentUser,
					docstatus: doc.docstatus || 0,
					__unsaved: 0
				};
				
				// Ensure name is set
				if (!docToInsert.name) {
					docToInsert.name = this.generateName(doctype);
				}
				
				const fields = Object.keys(docToInsert).join(', ');
				const placeholders = Array(Object.keys(docToInsert).length).fill('?').join(', ');
				const values = Object.values(docToInsert);
				
				const query = `INSERT INTO ${doctype} (${fields}) VALUES (${placeholders})`;
				const stmt = this.db.prepare(query);
				stmt.run(values);
				
				return docToInsert.name;
			}
		} catch (error) {
			throw new Error(`Error inserting document: ${(error as Error).message}`);
		}
	}

	/**
	 * Generate a unique name for a document
	 * @param doctype Document type
	 * @returns Generated name
	 */
	private generateName(doctype: string): string {
		const timestamp = Date.now();
		const random = Math.floor(Math.random() * 10000);
		return `${doctype}-${timestamp}-${random}`;
	}

	/**
	 * Update an existing document
	 * @param doctype Document type
	 * @param name Document name
	 * @param doc Document object with updated fields
	 * @returns Promise that resolves when the operation is complete
	 */
	public async update(
		doctype: string,
		name: string,
		doc: any
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
			
			// Add standard fields
			const docToUpdate = {
				...doc,
				modified: now,
				modified_by: this.currentUser
			};
			
			const updates = Object.keys(docToUpdate).map(key => `${key} = ?`).join(', ');
			const values = Object.values(docToUpdate);
			values.push(name);
			
			const query = `UPDATE ${doctype} SET ${updates} WHERE name = ?`;
			const stmt = this.db.prepare(query);
			stmt.run(values);
		} catch (error) {
			throw new Error(`Error updating document: ${(error as Error).message}`);
		}
	}

	/**
	 * Delete a document
	 * @param doctype Document type
	 * @param name Document name
	 * @returns Promise that resolves when the operation is complete
	 */
	public async delete(
		doctype: string,
		name: string
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const query = `DELETE FROM ${doctype} WHERE name = ?`;
			const stmt = this.db.prepare(query);
			stmt.run(name);
		} catch (error) {
			throw new Error(`Error deleting document: ${(error as Error).message}`);
		}
	}

	/**
	 * Insert multiple documents in a single operation
	 * @param doctype Document type
	 * @param docs Array of documents to insert
	 * @returns Promise that resolves to array of inserted document names
	 */
	public async bulk_insert(
		doctype: string,
		docs: any[]
	): Promise<string[]> {
		return this.insert(doctype, docs) as Promise<string[]>;
	}

	/**
	 * Delete all documents matching the query options
	 * @param doctype Document type
	 * @param options Query options for filtering
	 * @returns Promise that resolves to the number of deleted documents
	 */
	public async delete_all(
		doctype: string,
		options: QueryOptions = {}
	): Promise<number> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const { where, params } = this.buildWhereClause(options);
			
			const query = `DELETE FROM ${doctype} ${where}`;
			const stmt = this.db.prepare(query);
			const result = stmt.run(params);
			
			return result.changes;
		} catch (error) {
			throw new Error(`Error deleting all documents: ${(error as Error).message}`);
		}
	}

	/**
	 * Begin a new transaction
	 * @param options Transaction options
	 * @returns Promise that resolves to a transaction object
	 */
	public async begin(
		options: TransactionOptions = {}
	): Promise<any> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			if (options.savepoint) {
				const savepointName = options.savepoint_name || `sp_${Date.now()}`;
				this.db.exec(`SAVEPOINT ${savepointName}`);
				this.savepoints.push(savepointName);
				return { type: 'savepoint', name: savepointName };
			} else {
				this.db.exec('BEGIN TRANSACTION');
				this.inTransaction = true;
				return { type: 'transaction' };
			}
		} catch (error) {
			throw new Error(`Error beginning transaction: ${(error as Error).message}`);
		}
	}

	/**
	 * Commit a transaction
	 * @param transaction Transaction object
	 * @returns Promise that resolves when the transaction is committed
	 */
	public async commit(
		transaction: any
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			if (transaction.type === 'savepoint') {
				this.db.exec(`RELEASE SAVEPOINT ${transaction.name}`);
				const index = this.savepoints.indexOf(transaction.name);
				if (index > -1) {
					this.savepoints.splice(index, 1);
				}
			} else {
				this.db.exec('COMMIT');
				this.inTransaction = false;
			}
		} catch (error) {
			throw new Error(`Error committing transaction: ${(error as Error).message}`);
		}
	}

	/**
	 * Rollback a transaction
	 * @param transaction Transaction object
	 * @returns Promise that resolves when the transaction is rolled back
	 */
	public async rollback(
		transaction: any
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			if (transaction.type === 'savepoint') {
				this.db.exec(`ROLLBACK TO SAVEPOINT ${transaction.name}`);
			} else {
				this.db.exec('ROLLBACK');
				this.inTransaction = false;
				this.savepoints = [];
			}
		} catch (error) {
			throw new Error(`Error rolling back transaction: ${(error as Error).message}`);
		}
	}

	/**
	 * Create a savepoint within a transaction
	 * @param name Savepoint name
	 * @param transaction Transaction object (optional)
	 * @returns Promise that resolves to a savepoint object
	 */
	public async savepoint(
		name: string,
		transaction?: any
	): Promise<any> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			this.db.exec(`SAVEPOINT ${name}`);
			this.savepoints.push(name);
			return { type: 'savepoint', name };
		} catch (error) {
			throw new Error(`Error creating savepoint: ${(error as Error).message}`);
		}
	}

	/**
	 * Rollback to a savepoint
	 * @param savepoint Savepoint object or name
	 * @returns Promise that resolves when rolled back to savepoint
	 */
	public async rollback_to_savepoint(
		savepoint: any
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const savepointName = typeof savepoint === 'string' ? savepoint : savepoint.name;
			this.db.exec(`ROLLBACK TO SAVEPOINT ${savepointName}`);
			
			// Remove all savepoints after this one
			const index = this.savepoints.indexOf(savepointName);
			if (index > -1) {
				this.savepoints = this.savepoints.slice(0, index);
			}
		} catch (error) {
			throw new Error(`Error rolling back to savepoint: ${(error as Error).message}`);
		}
	}

	/**
	 * Release a savepoint
	 * @param savepoint Savepoint object or name
	 * @returns Promise that resolves when savepoint is released
	 */
	public async release_savepoint(
		savepoint: any
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const savepointName = typeof savepoint === 'string' ? savepoint : savepoint.name;
			this.db.exec(`RELEASE SAVEPOINT ${savepointName}`);
			
			// Remove this savepoint from the stack
			const index = this.savepoints.indexOf(savepointName);
			if (index > -1) {
				this.savepoints.splice(index, 1);
			}
		} catch (error) {
			throw new Error(`Error releasing savepoint: ${(error as Error).message}`);
		}
	}

	/**
	 * Execute a function within a transaction
	 * @param fn Function to execute within transaction
	 * @param options Transaction options
	 * @returns Promise that resolves to the function's return value
	 */
	public async withTransaction<T>(
		fn: (transaction: any) => Promise<T>,
		options: TransactionOptions = {}
	): Promise<T> {
		const transaction = await this.begin(options);
		
		try {
			const result = await fn(transaction);
			await this.commit(transaction);
			return result;
		} catch (error) {
			await this.rollback(transaction);
			throw error;
		}
	}

	/**
	 * Get table information
	 * @param tableName Table name
	 * @returns Promise that resolves to table information
	 */
	public async get_table_info(
		tableName: string
	): Promise<TableInfo> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			// Get table type
			const tableTypeStmt = this.db.prepare(`
				SELECT type FROM sqlite_master WHERE name = ?
			`);
			const tableTypeResult = tableTypeStmt.get(tableName);
			const type = tableTypeResult ? 
				((tableTypeResult as Record<string, any>).type === 'view' ? 'view' : 'table') : 'table';
			
			// Get columns
			const columns = await this.get_columns(tableName);
			
			// Get primary keys
			const primaryKeys = columns
				.filter(col => col.primary_key)
				.map(col => col.name);
			
			// Get foreign keys
			const foreignKeys = await this.get_foreign_keys(tableName);
			
			// Get indexes
			const indexes = await this.get_indexes(tableName);
			
			return {
				name: tableName,
				columns,
				primary_keys: primaryKeys,
				foreign_keys: foreignKeys,
				indexes,
				type: type as 'table' | 'view' | 'virtual'
			};
		} catch (error) {
			throw new Error(`Error getting table info: ${(error as Error).message}`);
		}
	}

	/**
	 * Get column information for a table
	 * @param tableName Table name
	 * @returns Promise that resolves to array of column information
	 */
	public async get_columns(
		tableName: string
	): Promise<ColumnInfo[]> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const stmt = this.db.prepare(`PRAGMA table_info(${tableName})`);
			const columns = stmt.all();
			
			// Get index information to check for unique constraints
			const indexes = await this.get_indexes(tableName);
			const uniqueColumns = new Set<string>();
			
			for (const index of indexes) {
				if (index.unique && index.columns.length === 1) {
					uniqueColumns.add(index.columns[0]);
				}
			}
			
			return columns.map(col => ({
				name: (col as Record<string, any>).name,
				type: (col as Record<string, any>).type,
				nullable: (col as Record<string, any>).notnull === 0,
				default_value: (col as Record<string, any>).dflt_value,
				primary_key: (col as Record<string, any>).pk > 0,
				auto_increment: (col as Record<string, any>).pk > 0 && ((col as Record<string, any>).type === 'INTEGER' || (col as Record<string, any>).type === 'integer'),
				unique: uniqueColumns.has((col as Record<string, any>).name)
			}));
		} catch (error) {
			throw new Error(`Error getting columns: ${(error as Error).message}`);
		}
	}

	/**
	 * Get foreign key information for a table
	 * @param tableName Table name
	 * @returns Promise that resolves to array of foreign key information
	 */
	public async get_foreign_keys(
		tableName: string
	): Promise<ForeignKeyInfo[]> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const stmt = this.db.prepare(`PRAGMA foreign_key_list(${tableName})`);
			const foreignKeys = stmt.all();
			
			return foreignKeys.map(fk => ({
				column: (fk as Record<string, any>).from,
				referenced_table: (fk as Record<string, any>).table,
				referenced_column: (fk as Record<string, any>).to,
				on_delete: (fk as Record<string, any>).on_delete as any,
				on_update: (fk as Record<string, any>).on_update as any
			}));
		} catch (error) {
			throw new Error(`Error getting foreign keys: ${(error as Error).message}`);
		}
	}

	/**
	 * Get index information for a table
	 * @param tableName Table name
	 * @returns Promise that resolves to array of index information
	 */
	public async get_indexes(
		tableName: string
	): Promise<IndexInfo[]> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			// Simplified approach - just get basic index info
			const stmt = this.db.prepare(`
				SELECT name, sql FROM sqlite_master
				WHERE type = 'index' AND tbl_name = ?
			`);
			const indexes = stmt.all([tableName]);
			
			const result: IndexInfo[] = [];
			
			for (const index of indexes) {
				// Get indexed columns
				const indexInfoStmt = this.db.prepare(`PRAGMA index_info(${(index as Record<string, any>).name})`);
				const indexInfo = indexInfoStmt.all();
				
				// Check if unique by parsing the SQL statement
				const sql = (index as Record<string, any>).sql || '';
				const unique = sql.toUpperCase().includes('UNIQUE');
				
				result.push({
					name: (index as Record<string, any>).name,
					columns: indexInfo.map(info => (info as Record<string, any>).name).sort((a, b) => {
						const aInfo = indexInfo.find(info => (info as Record<string, any>).name === a);
						const bInfo = indexInfo.find(info => (info as Record<string, any>).name === b);
						return ((aInfo as Record<string, any>)?.seqno || 0) - ((bInfo as Record<string, any>)?.seqno || 0);
					}),
					unique
				});
			}
			
			return result;
		} catch (error) {
			throw new Error(`Error getting indexes: ${(error as Error).message}`);
		}
	}

	/**
		* Get all indexes in the database
		* @returns Promise that resolves to array of index information
		*/
	public async get_all_indexes(): Promise<IndexInfo[]> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			// Get all indexes from sqlite_master
			const stmt = this.db.prepare(`
				SELECT name, sql, tbl_name FROM sqlite_master
				WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
			`);
			const indexes = stmt.all();
			
			const result: IndexInfo[] = [];
			
			for (const index of indexes) {
				// Get indexed columns
				const indexInfoStmt = this.db.prepare(`PRAGMA index_info(${(index as Record<string, any>).name})`);
				const indexInfo = indexInfoStmt.all();
				
				// Check if unique by parsing the SQL statement
				const sql = (index as Record<string, any>).sql || '';
				const unique = sql.toUpperCase().includes('UNIQUE');
				
				result.push({
					name: (index as Record<string, any>).name,
					columns: indexInfo.map(info => (info as Record<string, any>).name).sort((a, b) => {
						const aInfo = indexInfo.find(info => (info as Record<string, any>).name === a);
						const bInfo = indexInfo.find(info => (info as Record<string, any>).name === b);
						return ((aInfo as Record<string, any>)?.seqno || 0) - ((bInfo as Record<string, any>)?.seqno || 0);
					}),
					unique
				});
			}
			
			return result;
		} catch (error) {
			throw new Error(`Error getting all indexes: ${(error as Error).message}`);
		}
	}

	/**
	 * Create a table
	 * @param tableName Table name
	 * @param columns Array of column definitions
	 * @param options Additional options (primary keys, indexes, etc.)
	 * @returns Promise that resolves when the table is created
	 */
	public async create_table(
		tableName: string,
		columns: ColumnInfo[],
		options: any = {}
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const columnDefs = columns.map(col => {
				let def = `${col.name} ${col.type}`;
				
				if (!col.nullable) {
					def += ' NOT NULL';
				}
				
				if (col.default_value !== undefined) {
					def += ` DEFAULT ${typeof col.default_value === 'string' ? `'${col.default_value}'` : col.default_value}`;
				}
				
				if (col.primary_key) {
					def += ' PRIMARY KEY';
					if (col.auto_increment) {
						def += ' AUTOINCREMENT';
					}
				}
				
				if (col.unique && !col.primary_key) {
					def += ' UNIQUE';
				}
				
				return def;
			}).join(', ');
			
			let query = `CREATE TABLE ${tableName} (${columnDefs}`;
			
			// Add foreign keys if provided
			if (options.foreign_keys) {
				for (const fk of options.foreign_keys) {
					query += `, FOREIGN KEY (${fk.column}) REFERENCES ${fk.referenced_table}(${fk.referenced_column})`;
					if (fk.on_delete) {
						query += ` ON DELETE ${fk.on_delete}`;
					}
					if (fk.on_update) {
						query += ` ON UPDATE ${fk.on_update}`;
					}
				}
			}
			
			query += ')';
			
			this.db.exec(query);
			
			// Create indexes if provided
			if (options.indexes) {
				for (const index of options.indexes) {
					await this.create_index(index.name, tableName, index.columns, index.unique);
				}
			}
		} catch (error) {
			throw new Error(`Error creating table: ${(error as Error).message}`);
		}
	}

	/**
	 * Drop a table
	 * @param tableName Table name
	 * @param ifExists Whether to check if table exists before dropping
	 * @returns Promise that resolves when the table is dropped
	 */
	public async drop_table(
		tableName: string,
		ifExists: boolean = true
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const query = ifExists ? `DROP TABLE IF EXISTS ${tableName}` : `DROP TABLE ${tableName}`;
			this.db.exec(query);
		} catch (error) {
			throw new Error(`Error dropping table: ${(error as Error).message}`);
		}
	}

	/**
	 * Rename a table
	 * @param oldName Current table name
	 * @param newName New table name
	 * @returns Promise that resolves when the table is renamed
	 */
	public async rename_table(
		oldName: string,
		newName: string
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const query = `ALTER TABLE ${oldName} RENAME TO ${newName}`;
			this.db.exec(query);
		} catch (error) {
			throw new Error(`Error renaming table: ${(error as Error).message}`);
		}
	}

	/**
	 * Add a column to a table
	 * @param tableName Table name
	 * @param column Column definition
	 * @returns Promise that resolves when the column is added
	 */
	public async add_column(
		tableName: string,
		column: ColumnInfo
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			let def = `${column.name} ${column.type}`;
			
			if (!column.nullable) {
				def += ' NOT NULL';
			}
			
			if (column.default_value !== undefined) {
				def += ` DEFAULT ${typeof column.default_value === 'string' ? `'${column.default_value}'` : column.default_value}`;
			}
			
			if (column.unique) {
				def += ' UNIQUE';
			}
			
			const query = `ALTER TABLE ${tableName} ADD COLUMN ${def}`;
			this.db.exec(query);
		} catch (error) {
			throw new Error(`Error adding column: ${(error as Error).message}`);
		}
	}

	/**
	 * Drop a column from a table
	 * @param tableName Table name
	 * @param columnName Column name
	 * @returns Promise that resolves when the column is dropped
	 */
	public async drop_column(
		tableName: string,
		columnName: string
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			// SQLite doesn't support dropping columns directly
			// We need to recreate the table without the column
			const tableInfo = await this.get_table_info(tableName);
			const columns = tableInfo.columns.filter(col => col.name !== columnName);
			
			const tempTableName = `${tableName}_temp`;
			await this.create_table(tempTableName, columns);
			
			// Copy data
			const columnNames = columns.map(col => col.name).join(', ');
			this.db.exec(`INSERT INTO ${tempTableName} (${columnNames}) SELECT ${columnNames} FROM ${tableName}`);
			
			// Drop old table and rename temp table
			await this.drop_table(tableName);
			await this.rename_table(tempTableName, tableName);
		} catch (error) {
			throw new Error(`Error dropping column: ${(error as Error).message}`);
		}
	}

	/**
	 * Rename a column
	 * @param tableName Table name
	 * @param oldName Current column name
	 * @param newName New column name
	 * @returns Promise that resolves when the column is renamed
	 */
	public async rename_column(
		tableName: string,
		oldName: string,
		newName: string
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			// SQLite doesn't support renaming columns directly
			// We need to recreate the table with the new column name
			const tableInfo = await this.get_table_info(tableName);
			const columns = tableInfo.columns.map(col => 
				col.name === oldName ? { ...col, name: newName } : col
			);
			
			const tempTableName = `${tableName}_temp`;
			await this.create_table(tempTableName, columns);
			
			// Copy data
			const oldColumnNames = tableInfo.columns.map(col => col.name).join(', ');
			const newColumnNames = columns.map(col => col.name).join(', ');
			this.db.exec(`INSERT INTO ${tempTableName} (${newColumnNames}) SELECT ${oldColumnNames} FROM ${tableName}`);
			
			// Drop old table and rename temp table
			await this.drop_table(tableName);
			await this.rename_table(tempTableName, tableName);
		} catch (error) {
			throw new Error(`Error renaming column: ${(error as Error).message}`);
		}
	}

	/**
	 * Create an index
	 * @param indexName Index name
	 * @param tableName Table name
	 * @param columns Array of column names
	 * @param unique Whether the index should be unique
	 * @returns Promise that resolves when the index is created
	 */
	public async create_index(
		indexName: string,
		tableName: string,
		columns: string[],
		unique: boolean = false
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const uniqueKeyword = unique ? 'UNIQUE' : '';
			const columnList = columns.join(', ');
			const query = `CREATE ${uniqueKeyword} INDEX ${indexName} ON ${tableName} (${columnList})`;
			this.db.exec(query);
		} catch (error) {
			throw new Error(`Error creating index: ${(error as Error).message}`);
		}
	}

	/**
	 * Drop an index
	 * @param indexName Index name
	 * @returns Promise that resolves when the index is dropped
	 */
	public async drop_index(
		indexName: string
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const query = `DROP INDEX ${indexName}`;
			this.db.exec(query);
		} catch (error) {
			throw new Error(`Error dropping index: ${(error as Error).message}`);
		}
	}

	/**
	 * Check if a table exists
	 * @param tableName Table name
	 * @returns Promise that resolves to true if table exists
	 */
	public async table_exists(tableName: string): Promise<boolean> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const stmt = this.db.prepare(`
				SELECT name FROM sqlite_master
				WHERE type='table' AND name=?
			`);
			const result = stmt.get([tableName]);
			return !!result;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Run a migration
	 * @param migration Migration object
	 * @returns Promise that resolves when the migration is complete
	 */
	public async run_migration(
		migration: Migration
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			// Check if migration table exists
			const tableExists = await this.exists('tabMigrations');
			
			if (!tableExists) {
				await this.create_table('tabMigrations', [
					{ name: 'version', type: 'INTEGER', primary_key: true, nullable: false, auto_increment: false, unique: true },
					{ name: 'description', type: 'TEXT', nullable: true, primary_key: false, auto_increment: false, unique: false },
					{ name: 'applied_on', type: 'TIMESTAMP', nullable: true, primary_key: false, auto_increment: false, unique: false },
					{ name: 'applied_by', type: 'TEXT', nullable: true, primary_key: false, auto_increment: false, unique: false }
				]);
			}
			
			// Check if migration already applied
			const applied = await this.get_value('tabMigrations', migration.version.toString(), 'version');
			
			if (!applied) {
				// Apply migration
				const statements = Array.isArray(migration.up) ? migration.up : [migration.up];
				
				for (const statement of statements) {
					this.db.exec(statement);
				}
				
				// Record migration
				const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
				await this.insert('tabMigrations', {
					version: migration.version,
					description: migration.description,
					applied_on: now,
					applied_by: this.currentUser
				});
			}
		} catch (error) {
			throw new Error(`Error running migration: ${(error as Error).message}`);
		}
	}

	/**
	 * Get the current migration version
	 * @returns Promise that resolves to the current version
	 */
	public async get_migration_version(): Promise<number> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			const tableExists = await this.exists('tabMigrations');
			
			if (!tableExists) {
				return 0;
			}
			
			const stmt = this.db.prepare(`
				SELECT MAX(version) as max_version FROM tabMigrations
			`);
			const result = stmt.get();
			
			return result ? (result as Record<string, any>).max_version : 0;
		} catch (error) {
			throw new Error(`Error getting migration version: ${(error as Error).message}`);
		}
	}

	/**
	 * Set the migration version
	 * @param version Migration version
	 * @returns Promise that resolves when the version is set
	 */
	public async set_migration_version(
		version: number
	): Promise<void> {
		if (!this.db) throw new Error('Database not connected');
		
		try {
			// Check if migration table exists
			const tableExists = await this.exists('tabMigrations');
			
			if (!tableExists) {
				await this.create_table('tabMigrations', [
					{ name: 'version', type: 'INTEGER', primary_key: true, nullable: false, auto_increment: false, unique: true },
					{ name: 'description', type: 'TEXT', nullable: true, primary_key: false, auto_increment: false, unique: false },
					{ name: 'applied_on', type: 'TIMESTAMP', nullable: true, primary_key: false, auto_increment: false, unique: false },
					{ name: 'applied_by', type: 'TEXT', nullable: true, primary_key: false, auto_increment: false, unique: false }
				]);
			}
			
			// Check if version already exists
			const exists = await this.exists('tabMigrations', version.toString());
			
			if (!exists) {
				const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
				await this.insert('tabMigrations', {
					version,
					description: `Version ${version}`,
					applied_on: now,
					applied_by: this.currentUser
				});
			}
		} catch (error) {
			throw new Error(`Error setting migration version: ${(error as Error).message}`);
		}
	}

	/**
	 * Close the database connection
	 * @returns Promise that resolves when the connection is closed
	 */
	public async close(): Promise<void> {
		if (this.db) {
			this.db.close();
			this.db = null;
		}
	}

	/**
	 * Check if the database connection is open
	 * @returns True if connection is open
	 */
	public is_open(): boolean {
		return this.db !== null;
	}

	/**
	 * Get the database connection object (implementation-specific)
	 * @returns The underlying database connection object
	 */
	public get_connection(): any {
		return this.db;
	}
}