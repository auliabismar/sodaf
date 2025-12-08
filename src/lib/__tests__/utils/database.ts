/**
 * Database Test Utilities
 * 
 * Provides utilities for setting up and tearing down test databases,
 * managing test data, and simulating database operations for testing.
 */

import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { Database as AbstractDatabase } from '../../core/database/database';
import type { DatabaseConfig, QueryOptions, QueryResult, TransactionOptions, TableInfo, ColumnInfo, ForeignKeyInfo, IndexInfo, Migration } from '../../core/database/types';

/**
 * Test database configuration
 */
export interface TestDatabaseConfig {
	/** Database name */
	name: string;
	/** Whether to use in-memory database */
	inMemory?: boolean;
	/** Database file path (if not in-memory) */
	path?: string;
	/** Whether to enable foreign keys */
	foreignKeys?: boolean;
	/** Whether to enable WAL mode */
	wal?: boolean;
}

/**
 * Test database wrapper that implements Database interface
 */
export class TestDatabase extends AbstractDatabase {
	private db: Database.Database | null = null;
	protected config: TestDatabaseConfig;

	constructor(config: TestDatabaseConfig) {
		super(config);
		this.config = {
			foreignKeys: true,
			wal: false,
			inMemory: true,
			...config
		};
	}

	/**
	 * Initialize test database
	 */
	public async initialize(): Promise<void> {
		if (this.config.inMemory) {
			this.db = new Database(':memory:');
		} else {
			const dbPath = this.config.path || join(process.cwd(), 'test-data', `${this.config.name}.db`);
			
			// Ensure directory exists
			const dbDir = join(dbPath, '..');
			if (!existsSync(dbDir)) {
				mkdirSync(dbDir, { recursive: true });
			}

			this.db = new Database(dbPath);
		}

		// Configure database
		if (this.config.foreignKeys) {
			this.db.pragma('foreign_keys = ON');
		}

		if (this.config.wal) {
			this.db.pragma('journal_mode = WAL');
		}

		// Set busy timeout for tests
		this.db.pragma('busy_timeout = 5000');
	}

	/**
	 * Get database instance
	 */
	public getDatabase(): Database.Database {
		if (!this.db) {
			throw new Error('Database not initialized. Call initialize() first.');
		}
		return this.db;
	}

	// Implement abstract Database methods
	public async sql(
		query: string,
		values?: any[],
		as_dict: boolean = true
	): Promise<any[]> {
		const db = this.getDatabase();
		const stmt = db.prepare(query);
		console.log(`TestDatabase.sql(): ${query}`, values ? values : '');
		const result = values ? stmt.all(...values) : stmt.all();
		console.log(`TestDatabase.sql() result:`, result);
		return result;
	}

	public async run(query: string, values?: any[]): Promise<any> {
		const db = this.getDatabase();
		const stmt = db.prepare(query);
		if (values) {
			console.log('TestDatabase.run():', query, values);
			const result = stmt.run(...values);
			console.log('TestDatabase.run() result:', result);
			return result;
		}
		const result = stmt.run();
		console.log('TestDatabase.run():', query, 'result:', result);
		return result;
	}

	public async get(query: string, values?: any[]): Promise<any> {
		const db = this.getDatabase();
		const stmt = db.prepare(query);
		if (values) {
			return stmt.get(...values);
		}
		return stmt.get();
	}

	public async get_value(doctype: string, name: string, field?: string): Promise<any> {
		const doc = await this.get_doc(doctype, name);
		if (!doc) return null;
		
		if (field) {
			return doc[field] || null;
		}
		return doc;
	}

	public async set_value(doctype: string, name: string, field: string | Record<string, any>, value?: any): Promise<void> {
		if (typeof field === 'string' && value !== undefined) {
			// Single field update
			await this.run(`UPDATE tab${doctype} SET ${field} = ? WHERE name = ?`, [value, name]);
		} else if (typeof field === 'object') {
			// Multiple fields update
			const fields = Object.keys(field);
			const setClauses = fields.map(f => `${f} = ?`).join(', ');
			const values = [...Object.values(field), name];
			await this.run(`UPDATE tab${doctype} SET ${setClauses} WHERE name = ?`, values);
		}
	}

	public async get_all(doctype: string, options?: QueryOptions): Promise<any[]> {
		let query = `SELECT ${options?.fields ? options.fields.join(', ') : '*'} FROM tab${doctype}`;
		const params: any[] = [];
		
		if (options?.filters) {
			const whereClauses: string[] = [];
			for (const [key, value] of Object.entries(options.filters)) {
				whereClauses.push(`${key} = ?`);
				params.push(value);
			}
			query += ` WHERE ${whereClauses.join(' AND ')}`;
		}
		
		if (options?.order_by) {
			query += ` ORDER BY ${options.order_by}`;
		}
		
		if (options?.limit_page_length) {
			query += ` LIMIT ${options.limit_page_length}`;
		}
		
		if (options?.limit_start) {
			query += ` OFFSET ${options.limit_start}`;
		}
		
		return this.sql(query, params);
	}

	public async get_list(doctype: string, options?: QueryOptions): Promise<any[]> {
		return this.get_all(doctype, options);
	}

	public async get_count(doctype: string, options?: QueryOptions): Promise<number> {
		let query = `SELECT COUNT(*) as count FROM tab${doctype}`;
		const params: any[] = [];
		
		if (options?.filters) {
			const whereClauses: string[] = [];
			for (const [key, value] of Object.entries(options.filters)) {
				whereClauses.push(`${key} = ?`);
				params.push(value);
			}
			query += ` WHERE ${whereClauses.join(' AND ')}`;
		}
		
		const result = await this.get(query, params);
		return result?.count || 0;
	}

	public async get_single_value(doctype: string, field?: string): Promise<any> {
		const result = await this.get(`SELECT * FROM tab${doctype} LIMIT 1`);
		if (!result) return null;
		
		if (field) {
			return result[field] || null;
		}
		return result;
	}

	public async set_single_value(doctype: string, field: string | Record<string, any>, value?: any): Promise<void> {
		if (typeof field === 'string' && value !== undefined) {
			// Single field update
			await this.run(`UPDATE tab${doctype} SET ${field} = ?`, [value]);
		} else if (typeof field === 'object') {
			// Multiple fields update
			const fields = Object.keys(field);
			const setClauses = fields.map(f => `${f} = ?`).join(', ');
			const values = Object.values(field);
			await this.run(`UPDATE tab${doctype} SET ${setClauses}`, values);
		}
	}

	public async get_doc(doctype: string, name: string): Promise<any | null> {
		return this.get(`SELECT * FROM tab${doctype} WHERE name = ?`, [name]);
	}

	public async insert(doctype: string, doc: any | any[]): Promise<string | string[]> {
		if (Array.isArray(doc)) {
			// Bulk insert
			const results: string[] = [];
			for (const d of doc) {
				const id = await this.insert(doctype, d) as string;
				results.push(id);
			}
			return results;
		} else {
			// Single insert
			const fields = Object.keys(doc);
			const placeholders = fields.map(() => '?').join(', ');
			const values = Object.values(doc);
			
			const result = await this.run(`INSERT INTO tab${doctype} (${fields.join(', ')}) VALUES (${placeholders})`, values);
			return result.lastInsertRowid as string;
		}
	}

	public async bulk_insert(doctype: string, docs: any[]): Promise<string[]> {
		const results: string[] = [];
		for (const doc of docs) {
			const id = await this.insert(doctype, doc) as string;
			results.push(id);
		}
		return results;
	}

	public async delete_all(doctype: string, options?: QueryOptions): Promise<number> {
		let query = `DELETE FROM tab${doctype}`;
		const params: any[] = [];
		
		if (options?.filters) {
			const whereClauses: string[] = [];
			for (const [key, value] of Object.entries(options.filters)) {
				whereClauses.push(`${key} = ?`);
				params.push(value);
			}
			query += ` WHERE ${whereClauses.join(' AND ')}`;
		}
		
		const result = await this.run(query, params);
		return result.changes || 0;
	}

	public async update(doctype: string, name: string, doc: any): Promise<void> {
		const fields = Object.keys(doc);
		const setClauses = fields.map(field => `${field} = ?`).join(', ');
		const values = [...Object.values(doc), name];
		
		await this.run(`UPDATE tab${doctype} SET ${setClauses} WHERE name = ?`, values);
	}

	public async delete(doctype: string, name: string): Promise<void> {
		await this.run(`DELETE FROM tab${doctype} WHERE name = ?`, [name]);
	}

	public async exists(doctype: string, name?: string, filters?: Record<string, any>): Promise<boolean> {
		if (name) {
			const result = await this.get(`SELECT 1 FROM tab${doctype} WHERE name = ? LIMIT 1`, [name]);
			return !!result;
		} else if (filters) {
			const whereClauses: string[] = [];
			const params: any[] = [];
			for (const [key, value] of Object.entries(filters)) {
				whereClauses.push(`${key} = ?`);
				params.push(value);
			}
			const result = await this.get(`SELECT 1 FROM tab${doctype} WHERE ${whereClauses.join(' AND ')} LIMIT 1`, params);
			return !!result;
		} else {
			const result = await this.get(`SELECT 1 FROM tab${doctype} LIMIT 1`);
			return !!result;
		}
	}

	public async begin(options?: TransactionOptions): Promise<any> {
		await this.run('BEGIN TRANSACTION');
		return { type: 'transaction' };
	}

	public async commit(transaction: any): Promise<void> {
		await this.run('COMMIT');
	}

	public async rollback(transaction: any): Promise<void> {
		await this.run('ROLLBACK');
	}

	public async savepoint(name: string, transaction?: any): Promise<any> {
		await this.run(`SAVEPOINT ${name}`);
		return { type: 'savepoint', name };
	}

	public async rollback_to_savepoint(savepoint: any): Promise<void> {
		const name = typeof savepoint === 'string' ? savepoint : savepoint.name;
		await this.run(`ROLLBACK TO SAVEPOINT ${name}`);
	}

	public async release_savepoint(savepoint: any): Promise<void> {
		const name = typeof savepoint === 'string' ? savepoint : savepoint.name;
		await this.run(`RELEASE SAVEPOINT ${name}`);
	}

	public async withTransaction<T>(fn: (transaction: any) => Promise<T>, options?: TransactionOptions): Promise<T> {
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

	public async table_exists(table: string): Promise<boolean> {
		const result = await this.get("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", [table]);
		return !!result;
	}

	public async get_columns(tableName: string): Promise<ColumnInfo[]> {
		return this.sql(`PRAGMA table_info(${tableName})`);
	}

	public async get_all_indexes(): Promise<IndexInfo[]> {
		return this.sql("SELECT name, tbl_name as table_name, sql FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'");
	}

	public async create_table(tableName: string, columns: ColumnInfo[], options?: any): Promise<void> {
		const columnDefs = columns.map(col => {
			let def = `${col.name} ${col.type}`;
			if (!col.nullable) def += ' NOT NULL';
			if (col.default_value !== undefined) def += ` DEFAULT ${col.default_value}`;
			if (col.primary_key) def += ' PRIMARY KEY';
			if (col.auto_increment) def += ' AUTOINCREMENT';
			if (col.unique) def += ' UNIQUE';
			return def;
		});
		
		let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs.join(', ')})`;
		await this.run(sql);
	}

	public async drop_table(tableName: string, ifExists?: boolean): Promise<void> {
		const ifExistsClause = ifExists ? 'IF EXISTS' : '';
		await this.run(`DROP TABLE ${ifExistsClause} ${tableName}`);
	}

	public async rename_table(oldName: string, newName: string): Promise<void> {
		await this.run(`ALTER TABLE ${oldName} RENAME TO ${newName}`);
	}

	public async add_column(tableName: string, column: ColumnInfo): Promise<void> {
		let def = `${column.name} ${column.type}`;
		if (!column.nullable) def += ' NOT NULL';
		if (column.default_value !== undefined) def += ` DEFAULT ${column.default_value}`;
		if (column.unique) def += ' UNIQUE';
		
		await this.run(`ALTER TABLE ${tableName} ADD COLUMN ${def}`);
	}

	public async drop_column(tableName: string, columnName: string): Promise<void> {
		// SQLite doesn't support dropping columns directly
		// This would require table recreation
		throw new Error('Drop column not supported in SQLite');
	}

	public async rename_column(tableName: string, oldName: string, newName: string): Promise<void> {
		// SQLite doesn't support renaming columns directly
		// This would require table recreation
		throw new Error('Rename column not supported in SQLite');
	}

	public async create_index(indexName: string, tableName: string, columns: string[], unique?: boolean): Promise<void> {
		const uniqueClause = unique ? 'UNIQUE' : '';
		await this.run(`CREATE ${uniqueClause} INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${columns.join(', ')})`);
	}

	public async drop_index(indexName: string): Promise<void> {
		await this.run(`DROP INDEX IF EXISTS ${indexName}`);
	}

	public async get_table_info(tableName: string): Promise<TableInfo> {
		const columns = await this.get_columns(tableName);
		const indexes = await this.get_indexes(tableName);
		const foreignKeys = await this.get_foreign_keys(tableName);
		
		return {
			name: tableName,
			columns,
			primary_keys: columns.filter(col => col.primary_key).map(col => col.name),
			foreign_keys: foreignKeys,
			indexes,
			type: 'table'
		};
	}

	public async get_foreign_keys(tableName: string): Promise<ForeignKeyInfo[]> {
		return this.sql(`PRAGMA foreign_key_list(${tableName})`);
	}

	public async get_indexes(tableName: string): Promise<IndexInfo[]> {
		return this.sql(`PRAGMA index_list(${tableName})`);
	}

	public async run_migration(migration: Migration): Promise<void> {
		const transaction = await this.begin();
		try {
			// Execute migration SQL
			if (migration.up) {
				if (typeof migration.up === 'string') {
					await this.run(migration.up);
				} else {
					for (const sql of migration.up) {
						await this.run(sql);
					}
				}
			}
			
			// Record migration
			await this.run(
				'INSERT INTO tabMigrations (name, version, status) VALUES (?, ?, ?)',
				[migration.description, migration.version, 'applied']
			);
			
			await this.commit(transaction);
		} catch (error) {
			await this.rollback(transaction);
			throw error;
		}
	}

	public async get_migration_version(): Promise<number> {
		const result = await this.get('SELECT MAX(version) as version FROM tabMigrations');
		return result?.version || 0;
	}

	public async set_migration_version(version: number): Promise<void> {
		await this.run('UPDATE tabMigrations SET version = ? WHERE name = ?', [version, 'current']);
	}

	public async get_applied_migrations(): Promise<Migration[]> {
		return this.sql('SELECT * FROM tabMigrations ORDER BY applied_at');
	}

	public async close(): Promise<void> {
		if (this.db) {
			this.db.close();
			this.db = null;
		}
	}

	public is_open(): boolean {
		return this.db !== null;
	}

	public get_connection(): any {
		return this.db;
	}

	/**
	 * Execute a SQL script
	 */
	public executeScript(sql: string): void {
		const db = this.getDatabase();
		db.exec(sql);
	}

	/**
	 * Execute a prepared statement
	 */
	public executeStatement(sql: string, params: any[] = []): Database.RunResult {
		const db = this.getDatabase();
		const stmt = db.prepare(sql);
		return stmt.run(...params);
	}

	/**
	 * Execute a query and return results
	 */
	public query<T = any>(sql: string, params: any[] = []): T[] {
		const db = this.getDatabase();
		const stmt = db.prepare(sql);
		return stmt.all(...params) as T[];
	}

	/**
	 * Execute a query and return first result
	 */
	public queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
		const db = this.getDatabase();
		const stmt = db.prepare(sql);
		return stmt.get(...params) as T | undefined;
	}

	/**
	 * Create a table with basic schema
	 */
	public createTable(tableName: string, schema: string): void {
		const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${schema})`;
		this.executeScript(sql);
	}

	/**
	 * Drop a table if it exists
	 */
	public dropTable(tableName: string): void {
		const sql = `DROP TABLE IF EXISTS ${tableName}`;
		this.executeScript(sql);
	}

	/**
	 * Insert test data into a table
	 */
	public insertData(tableName: string, data: Record<string, any>[]): void {
		if (data.length === 0) return;

		const columns = Object.keys(data[0]);
		const placeholders = columns.map(() => '?').join(', ');
		const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

		const db = this.getDatabase();
		const stmt = db.prepare(sql);

		const transaction = db.transaction(() => {
			for (const row of data) {
				const values = columns.map(col => row[col]);
				stmt.run(...values);
			}
		});

		transaction();
	}

	/**
	 * Clear all data from a table
	 */
	public clearTable(tableName: string): void {
		const sql = `DELETE FROM ${tableName}`;
		this.executeScript(sql);
	}

	/**
	 * Get table schema information
	 */
	public getTableSchema(tableName: string): any[] {
		const sql = `PRAGMA table_info(${tableName})`;
		return this.query(sql);
	}

	/**
	 * Get all table names
	 */
	public getTableNames(): string[] {
		const sql = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";
		const results = this.query<{ name: string }>(sql);
		return results.map(row => row.name);
	}

	/**
	 * Check if table exists
	 */
	public tableExists(tableName: string): boolean {
		const sql = "SELECT name FROM sqlite_master WHERE type='table' AND name = ?";
		const result = this.queryOne(sql, [tableName]);
		return !!result;
	}

	/**
	 * Begin a transaction
	 */
	public beginTransaction(): void {
		this.executeScript('BEGIN TRANSACTION');
	}

	/**
	 * Commit a transaction
	 */
	public commitTransaction(): void {
		this.executeScript('COMMIT');
	}

	/**
	 * Rollback a transaction
	 */
	public rollbackTransaction(): void {
		this.executeScript('ROLLBACK');
	}

	/**
	 * Reset database (drop all tables)
	 */
	public reset(): void {
		const tables = this.getTableNames();
		for (const table of tables) {
			this.dropTable(table);
		}
	}
}

/**
 * Create a test database with default configuration
 */
export function createTestDatabase(name: string = 'test'): TestDatabase {
	return new TestDatabase({ name });
}

/**
 * Create an in-memory test database
 */
export function createInMemoryTestDatabase(name: string = 'test'): TestDatabase {
	return new TestDatabase({ name, inMemory: true });
}

/**
 * Database test helper class with lifecycle management
 */
export class DatabaseTestHelper {
	private databases: TestDatabase[] = [];

	/**
	 * Create and register a test database
	 */
	public createDatabase(config: TestDatabaseConfig): TestDatabase {
		const db = new TestDatabase(config);
		this.databases.push(db);
		return db;
	}

	/**
	 * Clean up all registered databases
	 */
	public async cleanup(): Promise<void> {
		for (const db of this.databases) {
			await db.close();
		}
		this.databases = [];
	}

	/**
	 * Reset all registered databases
	 */
	public resetAll(): void {
		for (const db of this.databases) {
			db.reset();
		}
	}

	/**
	 * Get all registered databases
	 */
	public getDatabases(): TestDatabase[] {
		return [...this.databases];
	}
}

/**
 * Common test schemas
 */
export const TestSchemas = {
	/**
	 * Basic user table schema
	 */
	user: `
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		email TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL,
		role TEXT DEFAULT 'user',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	`,

	/**
	 * Basic document table schema
	 */
	document: `
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		doctype TEXT NOT NULL,
		status TEXT DEFAULT 'draft',
		data TEXT,
		created_by INTEGER,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (created_by) REFERENCES user(id)
	`,

	/**
	 * Migration tracking table schema
	 */
	migration: `
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT UNIQUE NOT NULL,
		version TEXT NOT NULL,
		applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		status TEXT DEFAULT 'applied'
	`,

	/**
	 * DocType metadata table schema
	 */
	doctype_meta: `
		name TEXT PRIMARY KEY,
		module TEXT NOT NULL,
		definition TEXT NOT NULL,
		is_single BOOLEAN DEFAULT FALSE,
		is_table BOOLEAN DEFAULT FALSE,
		is_submittable BOOLEAN DEFAULT FALSE,
		is_tree BOOLEAN DEFAULT FALSE,
		is_virtual BOOLEAN DEFAULT FALSE,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	`
};

/**
 * Common test data
 */
export const TestData = {
	/**
	 * Sample user data
	 */
	users: [
		{ name: 'Admin User', email: 'admin@example.com', password: 'hashed_password', role: 'admin' },
		{ name: 'Test User', email: 'test@example.com', password: 'hashed_password', role: 'user' }
	],

	/**
	 * Sample document data
	 */
	documents: [
		{ name: 'Test Doc 1', doctype: 'TestDoc', status: 'draft', data: '{"key": "value"}' },
		{ name: 'Test Doc 2', doctype: 'TestDoc', status: 'submitted', data: '{"key": "value2"}' }
	]
};