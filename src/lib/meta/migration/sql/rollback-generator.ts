/**
 * Rollback Generator
 * 
 * Generates rollback SQL statements for migrations.
 */

import type { DocField, DocIndex } from '../../doctype/types';
import type { FieldChange, ColumnChange, ColumnRename } from '../types';
import type {
	SQLStatement,
	SQLOptions
} from './sql-types';
import { IndexBuilder } from './index-builder';
import { TableRebuilder } from './table-rebuilder';

/**
 * Rollback Generator class
 */
export class RollbackGenerator {
	private indexBuilder: IndexBuilder;
	private tableRebuilder: TableRebuilder;
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

		this.indexBuilder = new IndexBuilder(this.options);
		this.tableRebuilder = new TableRebuilder(this.options);
	}

	/**
	 * Generate rollback for CREATE TABLE
	 */
	generateRollbackForCreateTable(tableName: string): SQLStatement[] {
		const quotedTableName = this.quoteIdentifier(tableName);
		const sql = `DROP TABLE ${quotedTableName}`;

		return [{
			sql,
			type: 'drop_table',
			destructive: true,
			table: tableName,
			comment: `Rollback: CREATE TABLE ${tableName}`
		}];
	}

	/**
	 * Generate rollback for ADD COLUMN
	 */
	generateRollbackForAddColumn(tableName: string, columnName: string): SQLStatement[] {
		const quotedTableName = this.quoteIdentifier(tableName);
		const quotedColumnName = this.quoteIdentifier(columnName);

		return [{
			sql: `ALTER TABLE ${quotedTableName} DROP COLUMN ${quotedColumnName}`,
			type: 'alter_table',
			destructive: true,
			table: tableName,
			column: columnName,
			comment: `Rollback: Drop column ${columnName} from ${tableName}`
		}];
	}

	/**
	 * Generate rollback for DROP COLUMN
	 */
	generateRollbackForDropColumn(
		tableName: string,
		columnName: string,
		column: any
	): SQLStatement[] {
		const quotedTableName = this.quoteIdentifier(tableName);
		const quotedColumnName = this.quoteIdentifier(columnName);

		// Build column definition from original column
		const columnDef = this.buildColumnDefinitionFromColumn(column);
		const alterSQL = `ALTER TABLE ${quotedTableName} ADD COLUMN ${columnDef}`;

		return [{
			sql: alterSQL,
			type: 'alter_table',
			destructive: false,
			table: tableName,
			column: columnName,
			comment: `Rollback: Add column ${columnName} to ${tableName}`
		}];
	}

	/**
	 * Generate rollback for MODIFY COLUMN
	 */
	generateRollbackForModifyColumn(tableName: string, change: FieldChange): SQLStatement[] {
		// Create reverse change
		const reverseChange: FieldChange = {
			fieldname: change.fieldname,
			changes: {},
			requiresDataMigration: change.requiresDataMigration,
			destructive: change.destructive
		};

		// Reverse all changes
		if (change.changes.type) {
			reverseChange.changes.type = {
				from: change.changes.type.to,
				to: change.changes.type.from
			};
		}

		if (change.changes.length) {
			reverseChange.changes.length = {
				from: change.changes.length.to,
				to: change.changes.length.from
			};
		}

		if (change.changes.required) {
			reverseChange.changes.required = {
				from: change.changes.required.to,
				to: change.changes.required.from
			};
		}

		if (change.changes.unique) {
			reverseChange.changes.unique = {
				from: change.changes.unique.to,
				to: change.changes.unique.from
			};
		}

		if (change.changes.default) {
			reverseChange.changes.default = {
				from: change.changes.default.to,
				to: change.changes.default.from
			};
		}

		if (change.changes.precision) {
			reverseChange.changes.precision = {
				from: change.changes.precision.to,
				to: change.changes.precision.from
			};
		}

		if (change.changes.nullable) {
			reverseChange.changes.nullable = {
				from: change.changes.nullable.to,
				to: change.changes.nullable.from
			};
		}

		// Generate table rebuild for reverse change
		const strategy = this.options.defaultRebuildStrategy;
		// TODO: We don't have access to full columns definition here, passing empty array.
		return this.tableRebuilder.buildModifyColumnRebuild(tableName, [], reverseChange, strategy);
	}

	/**
	 * Generate rollback for CREATE INDEX
	 */
	generateRollbackForCreateIndex(indexName: string): SQLStatement[] {
		const sql = this.indexBuilder.buildDropIndexStatement(indexName);

		return [{
			sql,
			type: 'drop_index',
			destructive: false,
			comment: `Rollback: Drop index ${indexName}`
		}];
	}

	/**
	 * Generate rollback for DROP INDEX
	 */
	generateRollbackForDropIndex(indexName: string, index: DocIndex): SQLStatement[] {
		// Handle null index
		if (!index) {
			return [{
				sql: `-- Rollback for DROP INDEX ${indexName} (index details not available)`,
				type: 'create_index',
				destructive: false,
				table: 'unknown',
				comment: `Rollback: Create index ${indexName}`
			}];
		}

		const tableName = this.extractTableNameFromIndex(index);
		const indexDef = this.indexBuilder.buildIndexDefinition(tableName, index);
		const sql = this.indexBuilder.buildCreateIndexStatement(indexDef);

		return [{
			sql,
			type: 'create_index',
			destructive: false,
			table: tableName,
			comment: `Rollback: Create index ${indexName}`
		}];
	}

	/**
	 * Generate rollback for RENAME COLUMN
	 */
	generateRollbackForRenameColumn(tableName: string, rename: ColumnRename): SQLStatement[] {
		// SQLite requires table rebuild for renaming columns
		const reverseRename: ColumnRename = {
			from: rename.to,
			to: rename.from,
			column: rename.column
		};

		const strategy = this.options.defaultRebuildStrategy;
		return this.buildRenameColumnRebuild(tableName, reverseRename, strategy);
	}

	/**
	 * Generate rollback for table rebuild operations
	 */
	generateRollbackForTableRebuild(
		tableName: string,
		backupTableName: string
	): SQLStatement[] {
		const quotedTableName = this.quoteIdentifier(tableName);
		const quotedBackupTable = this.quoteIdentifier(backupTableName);

		const statements: SQLStatement[] = [];

		// Drop current table
		statements.push({
			sql: `DROP TABLE ${quotedTableName}`,
			type: 'drop_table',
			destructive: true,
			table: tableName,
			comment: `Rollback: Drop current table ${tableName}`
		});

		// Restore backup table
		statements.push({
			sql: `ALTER TABLE ${quotedBackupTable} RENAME TO ${quotedTableName}`,
			type: 'alter_table',
			destructive: false,
			table: tableName,
			comment: `Rollback: Restore ${tableName} from backup`
		});

		return statements;
	}

	/**
	 * Generate complete rollback SQL for a migration
	 */
	generateRollbackMigration(
		forwardStatements: SQLStatement[]
	): SQLStatement[] {
		const rollbackStatements: SQLStatement[] = [];

		// Process statements in reverse order
		for (let i = forwardStatements.length - 1; i >= 0; i--) {
			const statement = forwardStatements[i];

			// Handle null/undefined statements
			if (!statement) {
				continue;
			}

			// Handle empty SQL statements
			if (!statement.sql || statement.sql.trim() === '') {
				continue;
			}

			const rollback = this.generateRollbackForStatement(statement);

			if (rollback) {
				rollbackStatements.push(...rollback);
			}
		}

		return rollbackStatements;
	}

	/**
	 * Generate rollback for a specific SQL statement
	 */
	private generateRollbackForStatement(statement: SQLStatement): SQLStatement[] | null {
		const { sql, type, table, column } = statement;

		// Parse SQL to determine appropriate rollback
		const upperSQL = sql.toUpperCase().trim();

		if (type === 'create_table') {
			const tableName = this.extractTableNameFromCreateTable(sql);
			if (tableName) {
				const result = this.generateRollbackForCreateTable(tableName);
				return this.applyCommentOption(result);
			}
		}

		if (type === 'alter_table') {
			if (upperSQL.includes('ADD COLUMN')) {
				const columnName = this.extractColumnNameFromAddColumn(sql);
				if (table && columnName) {
					const result = this.generateRollbackForAddColumn(table, columnName);
					return this.applyCommentOption(result);
				}
			}

			if (upperSQL.includes('DROP COLUMN')) {
				const columnName = this.extractColumnNameFromDropColumn(sql);
				if (table && columnName) {
					// Need original column definition for proper rollback
					// This would require more context in practice
					const result = this.generateRollbackForDropColumn(table, columnName, null);
					return this.applyCommentOption(result);
				}
			}
		}

		if (type === 'drop_table') {
			const tableName = this.extractTableNameFromDropTable(sql) || table;
			if (tableName) {
				// Generate CREATE TABLE placeholder (actual schema not available)
				const quotedTableName = this.quoteIdentifier(tableName);
				const result: SQLStatement[] = [{
					sql: `CREATE TABLE ${quotedTableName} (/* schema not available */)`,
					type: 'create_table',
					destructive: false,
					table: tableName,
					comment: `Rollback: CREATE TABLE ${tableName} (schema not available)`
				}];
				return this.applyCommentOption(result);
			}
		}

		if (type === 'create_index') {
			const indexName = this.extractIndexNameFromCreateIndex(sql);
			if (indexName) {
				const result = this.generateRollbackForCreateIndex(indexName);
				return this.applyCommentOption(result);
			}
		}

		if (type === 'drop_index') {
			const indexName = this.extractIndexNameFromDropIndex(sql) || this.extractIndexNameFromSQL(sql);
			if (indexName) {
				// Generate CREATE INDEX placeholder
				const quotedIndexName = this.quoteIdentifier(indexName);
				const tableName = table || 'unknown';
				const quotedTableName = this.quoteIdentifier(tableName);
				const result: SQLStatement[] = [{
					sql: `CREATE INDEX ${quotedIndexName} ON ${quotedTableName} (/* columns not available */)`,
					type: 'create_index',
					destructive: false,
					table: tableName,
					comment: `Rollback: CREATE INDEX ${indexName}`
				}];
				return this.applyCommentOption(result);
			}
		}

		if (type === 'insert') {
			const tableName = table || this.extractTableNameFromInsert(sql);
			if (tableName) {
				const quotedTableName = this.quoteIdentifier(tableName);
				const result: SQLStatement[] = [{
					sql: `DELETE FROM ${quotedTableName} WHERE /* condition not available */`,
					type: 'delete',
					destructive: true,
					table: tableName,
					comment: `Rollback: DELETE inserted rows from ${tableName}`
				}];
				return this.applyCommentOption(result);
			}
		}

		if (type === 'update') {
			const tableName = table || this.extractTableNameFromUpdate(sql);
			if (tableName) {
				const quotedTableName = this.quoteIdentifier(tableName);
				const result: SQLStatement[] = [{
					sql: `UPDATE ${quotedTableName} SET /* original values not available */`,
					type: 'update',
					destructive: false,
					table: tableName,
					comment: `Rollback: UPDATE ${tableName} to original values`
				}];
				return this.applyCommentOption(result);
			}
		}

		if (type === 'delete') {
			const tableName = table || this.extractTableNameFromDelete(sql);
			if (tableName) {
				const quotedTableName = this.quoteIdentifier(tableName);
				const result: SQLStatement[] = [{
					sql: `INSERT INTO ${quotedTableName} /* original data not available */`,
					type: 'insert',
					destructive: false,
					table: tableName,
					comment: `Rollback: INSERT deleted rows into ${tableName}`
				}];
				return this.applyCommentOption(result);
			}
		}

		return null;
	}

	/**
	 * Apply comment option to statements
	 */
	private applyCommentOption(statements: SQLStatement[]): SQLStatement[] {
		if (!this.options.includeComments) {
			return statements.map(stmt => {
				const { comment, ...rest } = stmt;
				return rest as SQLStatement;
			});
		}
		return statements;
	}

	/**
	 * Extract index name from SQL (fallback)
	 */
	private extractIndexNameFromSQL(sql: string): string | null {
		const match = sql.match(/`(\w+)`/i);
		return match ? match[1] : null;
	}

	/**
	 * Extract table name from INSERT SQL
	 */
	private extractTableNameFromInsert(sql: string): string | null {
		const match = sql.match(/INSERT\s+INTO\s+`?(\w+)`?/i);
		return match ? match[1] : null;
	}

	/**
	 * Extract table name from UPDATE SQL
	 */
	private extractTableNameFromUpdate(sql: string): string | null {
		const match = sql.match(/UPDATE\s+`?(\w+)`?/i);
		return match ? match[1] : null;
	}

	/**
	 * Extract table name from DELETE SQL
	 */
	private extractTableNameFromDelete(sql: string): string | null {
		const match = sql.match(/DELETE\s+FROM\s+`?(\w+)`?/i);
		return match ? match[1] : null;
	}

	/**
	 * Build column definition from column data
	 */
	private buildColumnDefinitionFromColumn(column: any): string {
		// This would need to build proper column definition
		// For now, return a placeholder
		if (column && column.name && column.type) {
			const quotedName = this.quoteIdentifier(column.name);
			return `${quotedName} ${column.type}`;
		}

		return 'column_definition_placeholder';
	}

	/**
	 * Build rename column rebuild SQL
	 */
	private buildRenameColumnRebuild(
		tableName: string,
		rename: ColumnRename,
		strategy: any
	): SQLStatement[] {
		const tempTableName = this.tableRebuilder.generateTempTableName(tableName, strategy);
		const quotedTableName = this.quoteIdentifier(tableName);
		const quotedTempTable = this.quoteIdentifier(tempTableName);
		const quotedFrom = this.quoteIdentifier(rename.from);
		const quotedTo = this.quoteIdentifier(rename.to);

		const statements: SQLStatement[] = [];

		// Create temporary table with renamed column
		statements.push({
			sql: `CREATE TABLE ${quotedTempTable} AS\nSELECT * FROM ${quotedTableName} WHERE 1=0`,
			type: 'create_table',
			destructive: false,
			table: tempTableName,
			comment: `Create temporary table for column rename`
		});

		// Copy data with renamed column
		statements.push({
			sql: `INSERT INTO ${quotedTempTable}\nSELECT *, ${quotedFrom} AS ${quotedTo} FROM ${quotedTableName}`,
			type: 'insert',
			destructive: false,
			table: tempTableName,
			comment: `Copy data with renamed column`
		});

		// Drop original table
		statements.push({
			sql: `DROP TABLE ${quotedTableName}`,
			type: 'drop_table',
			destructive: true,
			table: tableName,
			comment: `Drop original table`
		});

		// Rename temporary table
		statements.push({
			sql: `ALTER TABLE ${quotedTempTable} RENAME TO ${quotedTableName}`,
			type: 'alter_table',
			destructive: false,
			table: tableName,
			comment: `Rename temporary table to original name`
		});

		return statements;
	}

	/**
	 * Extract table name from CREATE TABLE SQL
	 */
	private extractTableNameFromCreateTable(sql: string): string | null {
		const match = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?(\w+)[`"]?/i);
		return match ? match[1] : null;
	}

	/**
	 * Extract table name from DROP TABLE SQL
	 */
	private extractTableNameFromDropTable(sql: string): string | null {
		const match = sql.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?[`"]?(\w+)[`"]?/i);
		return match ? match[1] : null;
	}

	/**
	 * Extract column name from ADD COLUMN SQL
	 */
	private extractColumnNameFromAddColumn(sql: string): string | null {
		const match = sql.match(/ADD\s+COLUMN\s+(?:`?(\w+)`?)/i);
		return match ? match[1] : null;
	}

	/**
	 * Extract column name from DROP COLUMN SQL
	 */
	private extractColumnNameFromDropColumn(sql: string): string | null {
		const match = sql.match(/DROP\s+COLUMN\s+(?:`?(\w+)`?)/i);
		return match ? match[1] : null;
	}

	/**
	 * Extract index name from CREATE INDEX SQL
	 */
	private extractIndexNameFromCreateIndex(sql: string): string | null {
		const match = sql.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i);
		return match ? match[1] : null;
	}

	/**
	 * Extract index name from DROP INDEX SQL
	 */
	private extractIndexNameFromDropIndex(sql: string): string | null {
		const match = sql.match(/DROP\s+INDEX\s+(?:IF\s+EXISTS\s+)?`?(\w+)`?/i);
		return match ? match[1] : null;
	}

	/**
	 * Extract table name from index
	 */
	private extractTableNameFromIndex(index: DocIndex): string {
		// This would need to be determined from context
		// For now, return a placeholder
		return 'table_name_placeholder';
	}

	/**
	 * Quote identifier according to options
	 */
	private quoteIdentifier(name: string): string {
		return `${this.options.identifierQuote}${name}${this.options.identifierQuote}`;
	}
}