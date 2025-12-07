/**
 * Table Rebuilder
 * 
 * Handles SQLite table rebuild operations for column modifications.
 */

import type { DocField } from '../../doctype/types';
import type { DocType } from '../../doctype/types';
import type { FieldChange, ColumnDefinition } from '../types';
import type {
	SQLStatement,
	TableRebuildStrategy,
	SQLOptions
} from './sql-types';
import { FieldTypeMapper } from './field-type-mapper';
import { ConstraintBuilder } from './constraint-builder';

/**
 * Table Rebuilder class
 */
export class TableRebuilder {
	private typeMapper: FieldTypeMapper;
	private constraintBuilder: ConstraintBuilder;
	private options: Required<SQLOptions>;
	
	constructor(options: SQLOptions = {}) {
		this.options = {
			typeMappings: {},
			tableNamingStrategy: 'snake_case',
			identifierQuote: '`',
			includeComments: true,
			formatSQL: true,
			defaultRebuildStrategy: {
				useTempTable: true,
				tempTablePattern: '{table}_temp_{timestamp}',
				copyStrategy: 'batch',
				batchSize: 1000,
				dropOriginal: true,
				verifyData: true,
				preserveIndexes: false,
				preserveForeignKeys: false,
				preserveTriggers: false
			},
			foreignKeyStrategy: 'recreate',
			maxLineLength: 110,
			validateSQL: false,
			...options
		};
		
		this.typeMapper = new FieldTypeMapper(this.options.typeMappings);
		this.constraintBuilder = new ConstraintBuilder(this.options);
	}
	
	/**
	 * Build table rebuild SQL for column modifications
	 */
	buildRebuildSQL(
		tableName: string,
		changes: FieldChange[],
		strategy: TableRebuildStrategy
	): SQLStatement[] {
		const statements: SQLStatement[] = [];
		const tempTableName = this.generateTempTableName(tableName, strategy);
		
		// 1. Create temporary table with new schema
		const createTempSQL = this.buildCreateTempTableSQL(tableName, tempTableName, changes);
		statements.push({
			sql: createTempSQL,
			type: 'create_table',
			destructive: false,
			table: tempTableName,
			comment: `Create temporary table for rebuild: ${tempTableName}`
		});
		
		// 2. Copy data from original table to temporary table
		const copyDataSQL = this.buildCopyDataSQL(tableName, tempTableName, changes);
		statements.push({
			sql: copyDataSQL,
			type: 'insert',
			destructive: false,
			table: tempTableName,
			comment: `Copy data from ${tableName} to ${tempTableName}`
		});
		
		// 3. Drop original table
		const dropOriginalSQL = this.buildDropOriginalSQL(tableName);
		statements.push({
			sql: dropOriginalSQL,
			type: 'drop_table',
			destructive: true,
			table: tableName,
			comment: `Drop original table: ${tableName}`
		});
		
		// 4. Rename temporary table to original name
		const renameTempSQL = this.buildRenameTempSQL(tempTableName, tableName);
		statements.push({
			sql: renameTempSQL,
			type: 'alter_table',
			destructive: false,
			table: tableName,
			comment: `Rename ${tempTableName} to ${tableName}`
		});
		
		// 5. Recreate indexes if needed
		if (strategy.preserveIndexes) {
			const recreateIndexesSQL = this.buildRecreateIndexesSQL(tableName);
			if (recreateIndexesSQL) {
				statements.push({
					sql: recreateIndexesSQL,
					type: 'create_index',
					destructive: false,
					table: tableName,
					comment: `Recreate indexes for ${tableName}`
				});
			}
		}
		
		return statements;
	}
	
	/**
	 * Build table rebuild SQL for dropping a column
	 */
	buildDropColumnRebuild(
		tableName: string,
		columnName: string,
		strategy: TableRebuildStrategy
	): SQLStatement[] {
		const statements: SQLStatement[] = [];
		const tempTableName = this.generateTempTableName(tableName, strategy);
		
		// 1. Create temporary table without the column
		const createTempSQL = this.buildCreateTempTableWithoutColumnSQL(
			tableName,
			tempTableName,
			columnName
		);
		statements.push({
			sql: createTempSQL,
			type: 'create_table',
			destructive: false,
			table: tempTableName,
			comment: `Create temporary table without column: ${columnName}`
		});
		
		// 2. Copy data excluding the column
		const copyDataSQL = this.buildCopyDataWithoutColumnSQL(
			tableName,
			tempTableName,
			columnName
		);
		statements.push({
			sql: copyDataSQL,
			type: 'insert',
			destructive: false,
			table: tempTableName,
			comment: `Copy data excluding column: ${columnName}`
		});
		
		// 3. Drop original table
		const dropOriginalSQL = this.buildDropOriginalSQL(tableName);
		statements.push({
			sql: dropOriginalSQL,
			type: 'drop_table',
			destructive: true,
			table: tableName,
			comment: `Drop original table: ${tableName}`
		});
		
		// 4. Rename temporary table to original name
		const renameTempSQL = this.buildRenameTempSQL(tempTableName, tableName);
		statements.push({
			sql: renameTempSQL,
			type: 'alter_table',
			destructive: false,
			table: tableName,
			comment: `Rename ${tempTableName} to ${tableName}`
		});
		
		return statements;
	}
	
	/**
	 * Build table rebuild SQL for modifying a column
	 */
	buildModifyColumnRebuild(
		tableName: string,
		change: FieldChange,
		strategy: TableRebuildStrategy
	): SQLStatement[] {
		const statements: SQLStatement[] = [];
		const tempTableName = this.generateTempTableName(tableName, strategy);
		
		// 1. Create temporary table with modified column
		const createTempSQL = this.buildCreateTempTableWithModifiedColumnSQL(
			tableName,
			tempTableName,
			change
		);
		statements.push({
			sql: createTempSQL,
			type: 'create_table',
			destructive: false,
			table: tempTableName,
			comment: `Create temporary table with modified column: ${change.fieldname}`
		});
		
		// 2. Copy data with column transformation if needed
		const copyDataSQL = this.buildCopyDataWithModifiedColumnSQL(
			tableName,
			tempTableName,
			change
		);
		statements.push({
			sql: copyDataSQL,
			type: 'insert',
			destructive: false,
			table: tempTableName,
			comment: `Copy data with modified column: ${change.fieldname}`
		});
		
		// 3. Drop original table
		const dropOriginalSQL = this.buildDropOriginalSQL(tableName);
		statements.push({
			sql: dropOriginalSQL,
			type: 'drop_table',
			destructive: true,
			table: tableName,
			comment: `Drop original table: ${tableName}`
		});
		
		// 4. Rename temporary table to original name
		const renameTempSQL = this.buildRenameTempSQL(tempTableName, tableName);
		statements.push({
			sql: renameTempSQL,
			type: 'alter_table',
			destructive: false,
			table: tableName,
			comment: `Rename ${tempTableName} to ${tableName}`
		});
		
		return statements;
	}
	
	/**
	 * Generate temporary table name
	 */
	generateTempTableName(table: string, strategy: TableRebuildStrategy): string {
		const pattern = strategy.tempTablePattern;
		const timestamp = Date.now();
		
		return pattern
			.replace('{table}', table)
			.replace('{timestamp}', String(timestamp));
	}
	
	/**
	 * Build copy data SQL
	 */
	buildCopyDataSQL(
		fromTable: string,
		toTable: string,
		changes: FieldChange[]
	): string {
		const quotedFromTable = this.quoteIdentifier(fromTable);
		const quotedToTable = this.quoteIdentifier(toTable);
		
		// Build column list for copy
		const columns = this.buildColumnListForCopy(changes);
		
		return `INSERT INTO ${quotedToTable} (${columns})\nSELECT ${columns} FROM ${quotedFromTable}`;
	}
	
	/**
	 * Build drop original table SQL
	 */
	buildDropOriginalSQL(table: string): string {
		const quotedTable = this.quoteIdentifier(table);
		return `DROP TABLE ${quotedTable}`;
	}
	
	/**
	 * Build rename temporary table SQL
	 */
	buildRenameTempSQL(tempTable: string, originalTable: string): string {
		const quotedTempTable = this.quoteIdentifier(tempTable);
		const quotedOriginalTable = this.quoteIdentifier(originalTable);
		
		return `ALTER TABLE ${quotedTempTable} RENAME TO ${quotedOriginalTable}`;
	}
	
	/**
	 * Build create temporary table SQL
	 */
	private buildCreateTempTableSQL(
		originalTable: string,
		tempTable: string,
		changes: FieldChange[]
	): string {
		// This would need access to original table schema and new schema
		// For now, return a placeholder that would be implemented with actual schema access
		const quotedTempTable = this.quoteIdentifier(tempTable);
		
		return `CREATE TABLE ${quotedTempTable} (\n\t-- New schema with modifications\n\tid INTEGER PRIMARY KEY\n\t-- ... other columns\n)`;
	}
	
	/**
	 * Build create temporary table without column SQL
	 */
	private buildCreateTempTableWithoutColumnSQL(
		originalTable: string,
		tempTable: string,
		excludedColumn: string
	): string {
		const quotedTempTable = this.quoteIdentifier(tempTable);
		
		return `CREATE TABLE ${quotedTempTable} AS\nSELECT * FROM ${this.quoteIdentifier(originalTable)} WHERE 1=0`;
	}
	
	/**
	 * Build create temporary table with modified column SQL
	 */
	private buildCreateTempTableWithModifiedColumnSQL(
		originalTable: string,
		tempTable: string,
		change: FieldChange
	): string {
		const quotedTempTable = this.quoteIdentifier(tempTable);
		
		return `CREATE TABLE ${quotedTempTable} (\n\t-- Schema with modified column: ${change.fieldname}\n\tid INTEGER PRIMARY KEY\n\t-- ... other columns\n)`;
	}
	
	/**
	 * Build copy data without column SQL
	 */
	private buildCopyDataWithoutColumnSQL(
		fromTable: string,
		toTable: string,
		excludedColumn: string
	): string {
		const quotedFromTable = this.quoteIdentifier(fromTable);
		const quotedToTable = this.quoteIdentifier(toTable);
		const quotedExcludedColumn = this.quoteIdentifier(excludedColumn);
		
		return `INSERT INTO ${quotedToTable}\nSELECT * FROM ${quotedFromTable} WHERE ${quotedExcludedColumn} IS NOT NULL`;
	}
	
	/**
	 * Build copy data with modified column SQL
	 */
	private buildCopyDataWithModifiedColumnSQL(
		fromTable: string,
		toTable: string,
		change: FieldChange
	): string {
		const quotedFromTable = this.quoteIdentifier(fromTable);
		const quotedToTable = this.quoteIdentifier(toTable);
		const quotedColumn = this.quoteIdentifier(change.fieldname);
		
		// Handle type conversion if needed
		let columnExpression = quotedColumn;
		
		if (change.changes.type) {
			// Add type conversion logic here
			const { from, to } = change.changes.type;
			columnExpression = this.buildTypeConversionExpression(quotedColumn, from, to);
		}
		
		return `INSERT INTO ${quotedToTable}\nSELECT *, ${columnExpression} AS ${quotedColumn} FROM ${quotedFromTable}`;
	}
	
	/**
	 * Build recreate indexes SQL
	 */
	private buildRecreateIndexesSQL(tableName: string): string | undefined {
		// This would need access to original index definitions
		// For now, return a placeholder
		return `-- Recreate indexes for ${this.quoteIdentifier(tableName)}\n-- Index recreation would go here`;
	}
	
	/**
	 * Build column list for copy operation
	 */
	private buildColumnListForCopy(changes: FieldChange[]): string {
		// This would need access to original table schema
		// For now, return a placeholder
		return '*';
	}
	
	/**
	 * Build type conversion expression
	 */
	private buildTypeConversionExpression(
		column: string,
		fromType: string,
		toType: string
	): string {
		// Handle common type conversions
		if (fromType.toUpperCase() === 'INTEGER' && toType.toUpperCase() === 'TEXT') {
			return `CAST(${column} AS TEXT)`;
		}
		
		if (fromType.toUpperCase() === 'TEXT' && toType.toUpperCase() === 'INTEGER') {
			return `CAST(${column} AS INTEGER)`;
		}
		
		if (fromType.toUpperCase() === 'REAL' && toType.toUpperCase() === 'INTEGER') {
			return `CAST(${column} AS INTEGER)`;
		}
		
		if (fromType.toUpperCase() === 'INTEGER' && toType.toUpperCase() === 'REAL') {
			return `CAST(${column} AS REAL)`;
		}
		
		// Default to no conversion
		return column;
	}
	
	/**
	 * Quote identifier according to options
	 */
	private quoteIdentifier(name: string): string {
		return `${this.options.identifierQuote}${name}${this.options.identifierQuote}`;
	}
}