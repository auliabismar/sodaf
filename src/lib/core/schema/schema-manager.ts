/**
 * Schema Manager - Table Operations
 * 
 * This module implements the SchemaManager class for creating and modifying database tables.
 * It provides a high-level API for managing database schema based on DocField definitions.
 */

import type { DocField, DocIndex, DocSchema, FieldType } from './types';
import { STANDARD_COLUMNS } from './types';
import { Database } from '../database/database';
import { SQLiteDatabase } from '../database/sqlite-database';
import { IndexManager } from './index-manager';

/**
 * Schema Manager class
 * 
 * Provides methods for creating and managing database tables based on document schemas.
 */
export class SchemaManager {
	/**
	 * Database instance
	 */
	private db: Database;

	/**
	 * Index manager instance
	 */
	private indexManager: IndexManager;

	/**
	 * Constructor
	 * @param db Database instance
	 */
	constructor(db: Database) {
		this.db = db;
		this.indexManager = new IndexManager(db);
	}

	/**
	 * Create a table based on document schema
	 * @param doctype Document type name
	 * @param fields Array of document fields
	 * @returns Promise that resolves when the table is created
	 */
	public async createTable(doctype: string, fields: DocField[]): Promise<void> {
		const tableName = `tab${doctype}`;
		
		// Check if table already exists
		const exists = await this.tableExists(doctype);
		if (exists) {
			throw new Error(`Table ${tableName} already exists`);
		}

		// Build column definitions including standard columns
		const columns = this.buildColumns(fields);
		
		// Create the table
		await (this.db as SQLiteDatabase).create_table(tableName, columns);
	}

	/**
	 * Check if a table exists for the given doctype
	 * @param doctype Document type name
	 * @returns Promise that resolves to true if table exists
	 */
	public async tableExists(doctype: string): Promise<boolean> {
		const tableName = `tab${doctype}`;
		try {
			return await this.db.table_exists(tableName);
		} catch (error) {
			// If table doesn't exist, return false instead of throwing error
			if ((error as Error).message.includes('no such table')) {
				return false;
			}
			throw error;
		}
	}

	/**
	 * Get the schema for a table
	 * @param doctype Document type name
	 * @returns Promise that resolves to array of DocField
	 */
	public async getTableSchema(doctype: string): Promise<DocField[]> {
		const tableName = `tab${doctype}`;
		
		// Check if table exists
		const exists = await this.tableExists(doctype);
		if (!exists) {
			throw new Error(`Table ${tableName} does not exist`);
		}

		// Get table info from database
		const tableInfo = await (this.db as SQLiteDatabase).get_table_info(tableName);
		
		// Convert to DocField format
		const fields: DocField[] = [];
		
		for (const column of tableInfo.columns) {
			// Skip standard columns that are managed automatically
			if (STANDARD_COLUMNS.includes(column.name as any)) {
				continue;
			}
			
			// Strip quotes from string default values
			let defaultValue = column.default_value;
			if (typeof defaultValue === 'string' && defaultValue.startsWith("'") && defaultValue.endsWith("'")) {
				defaultValue = defaultValue.slice(1, -1);
			}
			
			const field: DocField = {
				fieldname: column.name,
				fieldtype: this.mapSqliteTypeToFieldType(column.type) as FieldType,
				label: column.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
				reqd: !column.nullable,
				unique: column.unique,
				length: this.getColumnLength(column.type),
				default: defaultValue
			};
			
			fields.push(field);
		}
		
		return fields;
	}

	/**
	 * Drop a table
	 * @param doctype Document type name
	 * @returns Promise that resolves when the table is dropped
	 */
	public async dropTable(doctype: string): Promise<void> {
		const tableName = `tab${doctype}`;
		await (this.db as SQLiteDatabase).drop_table(tableName);
	}

	/**
	 * Add a column to a table
	 * @param doctype Document type name
	 * @param field Document field definition
	 * @returns Promise that resolves when the column is added
	 */
	public async addColumn(doctype: string, field: DocField): Promise<void> {
		const tableName = `tab${doctype}`;
		
		// Check if column already exists
		const exists = await this.columnExists(doctype, field.fieldname);
		if (exists) {
			throw new Error(`Column ${field.fieldname} already exists in table ${tableName}`);
		}

		// SQLite doesn't support adding UNIQUE columns directly
		// We need to create a new table with the UNIQUE constraint and copy data
		if (field.unique) {
			await this.addColumnWithUniqueConstraint(doctype, field);
		} else {
			// Build column definition
			const column = this.buildColumn(field);
			
			// Add the column
			await (this.db as SQLiteDatabase).add_column(tableName, column);
		}
	}
	
	/**
	 * Add a column with UNIQUE constraint by recreating the table
	 * @param doctype Document type name
	 * @param field Field definition
	 */
	private async addColumnWithUniqueConstraint(doctype: string, field: DocField): Promise<void> {
		const tableName = `tab${doctype}`;
		const tempTableName = `${tableName}_temp_${Date.now()}`;
		
		// Get current table schema
		const tableInfo = await (this.db as SQLiteDatabase).get_table_info(tableName);
		const oldColumns = tableInfo.columns;
		
		// Add new column to columns array
		const newColumns = [...oldColumns, this.buildColumn(field)];
		
		// Create temporary table with new schema
		await (this.db as SQLiteDatabase).create_table(tempTableName, newColumns);
		
		// Copy data from old table to new table
		const oldColumnNames = oldColumns.map(col => col.name).join(', ');
		
		// For the new column, use NULL as default value
		// We need to explicitly list all columns from the old table and add NULL for the new column
		await (this.db as SQLiteDatabase).run(`
			INSERT INTO ${tempTableName} (${oldColumnNames})
			SELECT ${oldColumnNames} FROM ${tableName}
		`);
		
		// Drop old table
		await (this.db as SQLiteDatabase).drop_table(tableName);
		
		// Rename temporary table to original name
		await (this.db as SQLiteDatabase).rename_table(tempTableName, tableName);
		
		// Explicitly create a unique index for the new column if needed
		if (field.unique) {
			const indexName = `idx_${tableName}_${field.fieldname}`;
			await (this.db as SQLiteDatabase).create_index(indexName, tableName, [field.fieldname], true);
		}
	}

	/**
	 * Drop a column from a table
	 * @param doctype Document type name
	 * @param fieldName Field name
	 * @returns Promise that resolves when the column is dropped
	 */
	public async dropColumn(doctype: string, fieldName: string): Promise<void> {
		const tableName = `tab${doctype}`;
		
		// Check if column exists
		const exists = await this.columnExists(doctype, fieldName);
		if (!exists) {
			throw new Error(`Column ${fieldName} does not exist in table ${tableName}`);
		}

		// Cannot drop standard columns
		if (STANDARD_COLUMNS.includes(fieldName as any)) {
			throw new Error(`Cannot drop standard column: ${fieldName}`);
		}

		// Drop the column
		await (this.db as SQLiteDatabase).drop_column(tableName, fieldName);
	}

	/**
	 * Rename a column in a table
	 * @param doctype Document type name
	 * @param oldFieldName Current field name
	 * @param newFieldName New field name
	 * @returns Promise that resolves when the column is renamed
	 */
	public async renameColumn(doctype: string, oldFieldName: string, newFieldName: string): Promise<void> {
		const tableName = `tab${doctype}`;
		
		// Check if column exists
		const exists = await this.columnExists(doctype, oldFieldName);
		if (!exists) {
			throw new Error(`Column ${oldFieldName} does not exist in table ${tableName}`);
		}

		// Cannot rename standard columns
		if (STANDARD_COLUMNS.includes(oldFieldName as any)) {
			throw new Error(`Cannot rename standard column: ${oldFieldName}`);
		}

		// Rename the column
		await (this.db as SQLiteDatabase).rename_column(tableName, oldFieldName, newFieldName);
	}

	/**
	 * Modify a column in a table
	 * @param doctype Document type name
	 * @param fieldName Field name
	 * @param field New field definition
	 * @returns Promise that resolves when the column is modified
	 */
	public async modifyColumn(doctype: string, fieldName: string, field: DocField): Promise<void> {
		const tableName = `tab${doctype}`;
		
		// Check if column exists
		const exists = await this.columnExists(doctype, fieldName);
		if (!exists) {
			throw new Error(`Column ${fieldName} does not exist in table ${tableName}`);
		}

		// For SQLite, we need to recreate the table with the modified column
		const tableInfo = await (this.db as SQLiteDatabase).get_table_info(tableName);
		const currentFields = tableInfo.columns;
		
		// Build new column definitions
		const newFields: DocField[] = [];
		
		for (const column of currentFields) {
			if (column.name === fieldName) {
				// Use the new field definition
				newFields.push(field);
			} else {
				// Convert existing column to DocField
				const existingField: DocField = {
					fieldname: column.name,
					fieldtype: this.mapSqliteTypeToFieldType(column.type) as FieldType,
					label: column.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
					reqd: !column.nullable,
					unique: column.unique,
					length: this.getColumnLength(column.type),
					default: column.default_value
				};
				newFields.push(existingField);
			}
		}
		
		// Recreate the table
		const tempTableName = `${tableName}_temp`;
		const columns = this.buildColumns(newFields);
		
		await (this.db as SQLiteDatabase).create_table(tempTableName, columns);
		
		// Copy data
		const columnNames = currentFields.map(col => col.name).join(', ');
		await (this.db as SQLiteDatabase).run(`
			INSERT INTO ${tempTableName} (${columnNames})
			SELECT ${columnNames} FROM ${tableName}
		`);
		
		// Drop old table and rename temp table
		await (this.db as SQLiteDatabase).drop_table(tableName);
		await (this.db as SQLiteDatabase).rename_table(tempTableName, tableName);
	}

	/**
	 * Check if a column exists in a table
	 * @param doctype Document type name
	 * @param fieldName Field name
	 * @returns Promise that resolves to true if column exists
	 */
	public async columnExists(doctype: string, fieldName: string): Promise<boolean> {
		const tableName = `tab${doctype}`;
		
		try {
			const tableInfo = await (this.db as SQLiteDatabase).get_table_info(tableName);
			return tableInfo.columns.some(col => col.name === fieldName);
		} catch (error) {
			// Table doesn't exist
			if ((error as Error).message.includes('no such table')) {
				return false;
			}
			throw error;
		}
	}

	/**
	 * Build column definitions from DocField array
	 * @param fields Array of document fields
	 * @returns Array of column definitions
	 */
	private buildColumns(fields: DocField[]): any[] {
		const columns: any[] = [];
		
		// Add standard columns first
		columns.push(
			{ name: 'name', type: 'TEXT', nullable: false, primary_key: true, unique: true },
			{ name: 'owner', type: 'TEXT', nullable: false },
			{ name: 'creation', type: 'DATETIME', nullable: false },
			{ name: 'modified', type: 'DATETIME', nullable: false },
			{ name: 'modified_by', type: 'TEXT', nullable: false },
			{ name: 'docstatus', type: 'INTEGER', nullable: false, default_value: 0 },
			{ name: 'idx', type: 'INTEGER', nullable: false, default_value: 0 },
			{ name: 'parent', type: 'TEXT', nullable: true },
			{ name: 'parentfield', type: 'TEXT', nullable: true },
			{ name: 'parenttype', type: 'TEXT', nullable: true }
		);
		
		// Add custom fields
		for (const field of fields) {
			// Skip if it's a standard column
			if (STANDARD_COLUMNS.includes(field.fieldname as any)) {
				continue;
			}
			
			columns.push(this.buildColumn(field));
		}
		
		return columns;
	}

	/**
	 * Build a column definition from a DocField
	 * @param field Document field
	 * @returns Column definition
	 */
	private buildColumn(field: DocField): any {
		const sqliteType = this.mapFieldTypeToSqliteType(field.fieldtype);
		
		const column: any = {
			name: field.fieldname,
			type: sqliteType,
			nullable: !field.reqd
		};
		
		// Add default value if specified
		if (field.default !== undefined) {
			// For string values, don't add quotes as they're added by the database
			column.default_value = field.default;
		}
		
		// Add unique constraint if specified
		if (field.unique) {
			column.unique = true;
		}
		
		// Add length for text fields
		if (field.length && ['Data', 'Text', 'Small Text', 'Long Text'].includes(field.fieldtype)) {
			column.type = `VARCHAR(${field.length})`;
		}
		
		// Add precision for numeric fields
		if (field.precision && ['Float', 'Currency', 'Percent'].includes(field.fieldtype)) {
			column.type = `DECIMAL(10, ${field.precision})`;
		}
		
		return column;
	}

	/**
	 * Map FieldType to SQLite type
	 * @param fieldtype Field type
	 * @returns SQLite type
	 */
	private mapFieldTypeToSqliteType(fieldtype: string): string {
		switch (fieldtype) {
			// Text types
			case 'Data':
			case 'Small Text':
				return 'TEXT';
			case 'Text':
			case 'Long Text':
			case 'Text Editor':
			case 'Markdown':
				return 'TEXT';
			case 'HTML':
			case 'Code':
				return 'TEXT';
			
			// Numeric types
			case 'Int':
				return 'INTEGER';
			case 'Float':
			case 'Currency':
			case 'Percent':
				return 'REAL';
			case 'Check':
				return 'INTEGER';
			
			// Date/Time types
			case 'Date':
			case 'Datetime':
			case 'Time':
			case 'Duration':
				return 'TEXT';
			
			// Link types
			case 'Link':
			case 'Dynamic Link':
				return 'TEXT';
			
			// Table type
			case 'Table':
				return 'TEXT'; // Will be handled separately
			
			// File types
			case 'Attach':
			case 'Attach Image':
			case 'Signature':
			case 'Image':
			case 'File':
				return 'TEXT';
			
			// Special types
			case 'Select':
			case 'Color':
			case 'Password':
			case 'Rating':
			case 'JSON':
			case 'Geolocation':
			case 'Barcode':
			case 'Button':
				return 'TEXT';
			
			// Layout types (not stored in database)
			case 'Section Break':
			case 'Column Break':
			case 'Tab Break':
			case 'Read Only':
				return 'TEXT';
			
			default:
				return 'TEXT';
		}
	}

	/**
	 * Create an index
	 * @param tableName Table name
	 * @param indexName Index name
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
		await this.indexManager.createIndex(tableName, indexName, columns, unique);
	}

	/**
	 * Drop an index
	 * @param indexName Index name
	 * @returns Promise that resolves when index is dropped
	 */
	public async dropIndex(indexName: string): Promise<void> {
		await this.indexManager.dropIndex(indexName);
	}

	/**
	 * Get all indexes for a table
	 * @param tableName Table name
	 * @returns Promise that resolves to array of index information
	 */
	public async getIndexes(tableName: string): Promise<DocIndex[]> {
		return await this.indexManager.getIndexes(tableName);
	}

	/**
	 * Map SQLite type to FieldType
	 * @param sqliteType SQLite type
	 * @returns Field type
	 */
	private mapSqliteTypeToFieldType(sqliteType: string): string {
		if (sqliteType.startsWith('VARCHAR') || sqliteType.startsWith('TEXT')) {
			return 'Data';
		} else if (sqliteType.startsWith('INTEGER')) {
			return 'Int';
		} else if (sqliteType.startsWith('REAL') || sqliteType.startsWith('DECIMAL') || sqliteType.startsWith('FLOAT')) {
			return 'Float';
		} else if (sqliteType.startsWith('DATETIME') || sqliteType.startsWith('DATE') || sqliteType.startsWith('TIME')) {
			return 'Datetime';
		} else {
			return 'Data';
		}
	}

	/**
	 * Get column length from SQLite type
	 * @param sqliteType SQLite type
	 * @returns Column length or undefined
	 */
	private getColumnLength(sqliteType: string): number | undefined {
		const match = sqliteType.match(/VARCHAR\((\d+)\)/);
		return match ? parseInt(match[1]) : undefined;
	}
}