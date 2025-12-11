/**
 * SQL Generator
 * 
 * Main orchestrator class that coordinates SQL generation operations.
 */

import type { DocType, DocField, DocIndex } from '../doctype/types';
import { getTreeFields, isTreeField } from '../tree/schema';
import type { SchemaDiff, FieldChange, ColumnChange, ColumnRename, ColumnDefinition } from './types';
import type {
	MigrationSQL,
	SQLStatement,
	SQLOptions,
	MigrationMetadata,
	MigrationOptions
} from './sql';

import { FieldTypeMapper } from './sql/field-type-mapper';
import { ConstraintBuilder } from './sql/constraint-builder';
import { IndexBuilder } from './sql/index-builder';
import { TableRebuilder } from './sql/table-rebuilder';
import { RollbackGenerator } from './sql/rollback-generator';
import { SQLFormatter } from './sql/sql-formatter';

/**
 * SQL Generator class
 */
export class SQLGenerator {
	private typeMapper: FieldTypeMapper;
	private constraintBuilder: ConstraintBuilder;
	private indexBuilder: IndexBuilder;
	private tableRebuilder: TableRebuilder;
	private rollbackGenerator: RollbackGenerator;
	private formatter: SQLFormatter;
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
		this.indexBuilder = new IndexBuilder(this.options);
		this.tableRebuilder = new TableRebuilder(this.options);
		this.rollbackGenerator = new RollbackGenerator(this.options);
		this.formatter = new SQLFormatter(this.options);
	}

	/**
	 * Generate CREATE TABLE SQL for a DocType
	 */
	generateCreateTableSQL(doctype: DocType): SQLStatement[] {
		// Use the table_name if available, otherwise use the name directly
		const tableName = doctype.table_name || `tab${doctype.name}`;
		const columns = this.generateColumnDefinitions(doctype);
		const constraints = this.generateTableConstraints(doctype);

		const columnDefs = columns.map(col => {
			const colConstraints = this.constraintBuilder.buildColumnConstraints(
				this.fieldToDocField(col, doctype)
			);
			return this.constraintBuilder.buildColumnDefinition(col, colConstraints);
		});

		let sql = this.formatter.formatCreateTable(
			tableName,
			columnDefs,
			constraints
		);

		if (this.options.includeComments) {
			sql = this.formatter.addComments(
				sql,
				`Create table for DocType: ${doctype.name}`
			);
		}

		return [{
			sql,
			type: 'create_table',
			destructive: false,
			table: tableName,
			comment: `Create table for DocType: ${doctype.name}`
		}];
	}

	/**
	 * Generate DROP TABLE SQL for a DocType
	 */
	generateDropTableSQL(doctype: DocType): SQLStatement[] {
		const tableName = this.getTableName(doctype);

		let sql = this.formatter.formatDropStatement('TABLE', tableName);

		if (this.options.includeComments) {
			sql = this.formatter.addComments(
				sql,
				`Drop table for DocType: ${doctype.name}`
			);
		}

		return [{
			sql,
			type: 'drop_table',
			destructive: true,
			table: tableName,
			comment: `Drop table for DocType: ${doctype.name}`
		}];
	}

	/**
	 * Generate ALTER TABLE ADD COLUMN SQL
	 */
	generateAddColumnSQL(doctype: DocType, field: DocField): SQLStatement[] {
		const tableName = this.getTableName(doctype);
		const columnDef = this.typeMapper.mapFieldType(field);
		const colConstraints = this.constraintBuilder.buildColumnConstraints(field);
		const columnDefinition = this.constraintBuilder.buildColumnDefinition(columnDef, colConstraints);

		let sql = this.formatter.formatAlterTable(tableName, 'ADD COLUMN', columnDefinition);

		if (this.options.includeComments) {
			sql = this.formatter.addComments(
				sql,
				`Add column '${field.fieldname}' to table '${tableName}'`
			);
		}

		return [{
			sql,
			type: 'alter_table',
			destructive: false,
			table: tableName,
			column: field.fieldname,
			comment: `Add column '${field.fieldname}' to table '${tableName}'`,
			columnDef: field
		}];
	}

	/**
	 * Generate ALTER TABLE DROP COLUMN SQL
	 */
	generateDropColumnSQL(doctype: DocType, field: DocField): SQLStatement[] {
		const tableName = this.getTableName(doctype);

		// Use table rebuild strategy for SQLite
		const strategy = this.options.defaultRebuildStrategy;

		// We pass the full fields list so builder can create the new table schema (excluding droppped column)
		return this.tableRebuilder.buildDropColumnRebuild(tableName, doctype.fields, field.fieldname, strategy);
	}

	/**
	 * Generate ALTER TABLE MODIFY COLUMN SQL
	 */
	generateModifyColumnSQL(doctype: string, change: FieldChange): SQLStatement[] {
		// SQLite doesn't support MODIFY COLUMN directly, needs table rebuild
		const strategy = this.options.defaultRebuildStrategy;
		const columns = this.getDocTypeFromName(doctype).fields; // Placeholder fields

		return this.tableRebuilder.buildModifyColumnRebuild(doctype, columns, change, strategy);
	}

	/**
	 * Generate CREATE INDEX SQL
	 */
	generateCreateIndexSQL(doctype: DocType, index: DocIndex): SQLStatement[] {
		const tableName = this.getTableName(doctype);
		// Use the index name if provided, otherwise generate one
		const indexName = index.name || `idx_${doctype.name}_${index.columns.join('_')}`;
		const columns = index.columns.map(col => this.quoteIdentifier(col));

		let sql = this.formatter.formatCreateIndex(
			indexName,
			tableName,
			columns,
			index.unique
		);

		if (this.options.includeComments) {
			sql = this.formatter.addComments(
				sql,
				`Create ${index.unique ? 'unique ' : ''}index '${indexName}' on table '${tableName}'`
			);
		}

		return [{
			sql,
			type: 'create_index',
			destructive: false,
			table: tableName,
			comment: `Create ${index.unique ? 'unique ' : ''}index '${indexName}' on table '${tableName}'`
		}];
	}

	/**
	 * Generate DROP INDEX SQL
	 */
	generateDropIndexSQL(indexName: string): SQLStatement[] {
		let sql = this.formatter.formatDropStatement('INDEX', indexName);

		if (this.options.includeComments) {
			sql = this.formatter.addComments(
				sql,
				`Drop index '${indexName}'`
			);
		}

		return [{
			sql,
			type: 'drop_index',
			destructive: false,
			table: '',
			comment: `Drop index '${indexName}'`
		}];
	}

	/**
	 * Generate SQL to rename a column (requires table rebuild in SQLite)
	 */
	generateRenameColumnSQL(doctype: string, rename: ColumnRename): SQLStatement[] {
		const strategy = this.options.defaultRebuildStrategy;
		return this.buildRenameColumnRebuild(doctype, rename, strategy);
	}

	/**
	 * Generate complete migration SQL from schema diff
	 */
	generateMigrationSQL(diff: SchemaDiff, doctype: string): MigrationSQL {
		const statements: SQLStatement[] = [];
		const warnings: string[] = [];
		let destructive = false;

		// Process added columns
		for (const column of diff.addedColumns) {
			const sql = this.generateAddColumnSQL(this.getDocTypeFromName(doctype), this.columnDefinitionToDocField(column.column, this.getDocTypeFromName(doctype)));
			statements.push(...sql);
		}

		// Process removed columns
		for (const column of diff.removedColumns) {
			if (column.destructive) {
				warnings.push(`Removing column '${column.fieldname}' may result in data loss`);
				destructive = true;
			}

			const sql = this.generateDropColumnSQL(this.getDocTypeFromName(doctype), this.columnDefinitionToDocField(column.column, this.getDocTypeFromName(doctype)));
			statements.push(...sql);
		}

		// Process modified columns
		for (const change of diff.modifiedColumns) {
			if (change.destructive) {
				warnings.push(`Modifying column '${change.fieldname}' may result in data loss`);
				destructive = true;
			}

			// Add warning for type conversion
			if (change.changes.type) {
				warnings.push(`Column '${change.fieldname}' type conversion from '${change.changes.type.from}' to '${change.changes.type.to}'`);
			}

			// Add warning for data migration requirement
			if (change.requiresDataMigration) {
				warnings.push(`Column '${change.fieldname}' requires data migration`);
			}

			const sql = this.generateModifyColumnSQL(doctype, change);
			statements.push(...sql);
		}

		// Process added indexes
		for (const index of diff.addedIndexes) {
			const sql = this.generateCreateIndexSQL(this.getDocTypeFromName(doctype), index.index as DocIndex);
			statements.push(...sql);
		}

		// Process removed indexes
		for (const index of diff.removedIndexes) {
			const sql = this.generateDropIndexSQL(index.name);
			statements.push(...sql);
		}

		// Process renamed columns
		for (const rename of diff.renamedColumns) {
			const sql = this.generateRenameColumnSQL(doctype, rename);
			statements.push(...sql);
		}

		// Generate rollback statements
		const rollbackStatements = this.rollbackGenerator.generateRollbackMigration(statements);

		// Create metadata
		const metadata: MigrationMetadata = {
			id: `migration_${Date.now()}`,
			doctype,
			version: '1.0.0',
			timestamp: new Date(),
			diff,
			options: {
				backup: true,
				validateData: true,
				continueOnError: false,
				dryRun: false
			}
		};

		return {
			forward: statements,
			rollback: rollbackStatements,
			destructive,
			warnings,
			estimatedTime: this.estimateExecutionTime(statements),
			metadata
		};
	}

	/**
	 * Generate rollback SQL for a migration
	 */
	generateRollbackSQL(statements: SQLStatement[]): SQLStatement[] {
		return this.rollbackGenerator.generateRollbackMigration(statements);
	}

	/**
	 * Get table name from DocType
	 */
	private getTableName(doctype: DocType): string {
		// If an explicit table_name is set, use it directly without formatting
		// This preserves the intended name format
		if (doctype.table_name) {
			return doctype.table_name;
		}

		// Only apply naming strategy when deriving from DocType name
		return this.formatter.formatTableName(doctype.name);
	}

	/**
	 * Generate column definitions from DocType
	 */
	private generateColumnDefinitions(doctype: DocType): ColumnDefinition[] {
		const columns: ColumnDefinition[] = [];

		const fields = [...doctype.fields];
		if (doctype.is_tree) {
			const treeFields = getTreeFields(doctype);
			for (const tf of treeFields) {
				if (!fields.find(f => f.fieldname === tf.fieldname)) {
					fields.push(tf);
				}
			}
		}

		for (const field of fields) {
			try {
				const columnDef = this.typeMapper.mapFieldType(field);
				columns.push(columnDef);
			} catch (error) {
				// Skip layout fields and unsupported types
				if (error instanceof Error && error.message.includes('Layout field')) {
					continue;
				}
				throw error;
			}
		}

		return columns;
	}

	/**
	 * Generate table constraints from DocType
	 */
	private generateTableConstraints(doctype: DocType): string[] {
		const constraints: string[] = [];

		// Add primary key constraint if name field exists
		const nameField = doctype.fields.find(field => field.fieldname === 'name');
		if (nameField) {
			constraints.push(`PRIMARY KEY (${this.quoteIdentifier('name')})`);
		}

		return constraints;
	}

	/**
	 * Convert ColumnDefinition back to DocField for constraint building
	 */
	private fieldToDocField(column: ColumnDefinition, doctype?: DocType): DocField {
		// Find original field if available
		let originalField: DocField | undefined;
		if (doctype && doctype.fields) {
			originalField = doctype.fields.find(f => f.fieldname === column.name);
		}

		if (originalField) {
			return originalField;
		}

		// Create minimal DocField from ColumnDefinition
		return {
			fieldname: column.name,
			label: column.name,
			fieldtype: 'Data', // Default type
			required: !column.nullable,
			unique: column.unique,
			default: column.default_value
		};
	}

	/**
	 * Estimate execution time for SQL statements
	 */
	private estimateExecutionTime(statements: SQLStatement[]): number {
		let totalTime = 0;

		for (const statement of statements) {
			switch (statement.type) {
				case 'create_table':
					totalTime += 1; // 1 second for table creation
					break;
				case 'alter_table':
					totalTime += 2; // 2 seconds for table alteration
					break;
				case 'drop_table':
					totalTime += 0.5; // 0.5 seconds for table drop
					break;
				case 'create_index':
					totalTime += 0.5; // 0.5 seconds for index creation
					break;
				case 'drop_index':
					totalTime += 0.2; // 0.2 seconds for index drop
					break;
				case 'insert':
					totalTime += 0.1; // 0.1 seconds per insert
					break;
				case 'update':
					totalTime += 0.2; // 0.2 seconds per update
					break;
				case 'delete':
					totalTime += 0.1; // 0.1 seconds per delete
					break;
				default:
					totalTime += 0.1; // Default 0.1 seconds
					break;
			}
		}

		return totalTime;
	}

	/**
	 * Convert ColumnDefinition back to DocField for constraint building
	 */
	private columnDefinitionToDocField(column: ColumnDefinition, doctype?: DocType): DocField {
		// Find original field if available
		const originalField = this.fieldToDocField(column, doctype);

		return originalField;
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

	private quoteIdentifier(name: string): string {
		return `${this.options.identifierQuote}${name}${this.options.identifierQuote}`;
	}

	/**
	 * Get DocType from name (placeholder implementation)
	 */
	private getDocTypeFromName(name: string): DocType {
		// This is a placeholder - in a real implementation, this would
		// fetch DocType from a cache or database
		return {
			name,
			module: 'Core',
			fields: [],
			permissions: [],
			table_name: `tab${name}`
		};
	}
}