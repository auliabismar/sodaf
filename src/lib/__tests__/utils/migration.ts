/**
 * Migration Test Utilities
 *
 * Provides utilities for creating test migration scenarios,
 * simulating database schema changes, and validating migration behavior.
 */

import type {
	Migration,
	SchemaDiff,
	ColumnChange,
	ColumnRename,
	FieldChange,
	IndexChange,
	MigrationResult,
	MigrationOptions,
	MigrationHistory,
	MigrationStats,
	ColumnDefinition,
	IndexDefinition
} from '../../meta/migration/types';
import type { DocType } from '../../meta/doctype/types';

/**
 * Test migration configuration
 */
export interface TestMigrationConfig {
	/** Migration name */
	name: string;
	/** Migration version */
	version: string;
	/** Migration description */
	description?: string;
	/** Migration type */
	type?: 'schema' | 'data' | 'mixed';
	/** Whether migration is reversible */
	reversible?: boolean;
	/** Migration dependencies */
	dependencies?: string[];
	/** Custom SQL statements */
	sql?: string[];
}

/**
 * Test schema configuration
 */
export interface TestSchemaConfig {
	/** Table name */
	tableName: string;
	/** Fields configuration */
	fields: Record<string, {
		type: string;
		nullable?: boolean;
		default?: any;
		unique?: boolean;
		primaryKey?: boolean;
		autoIncrement?: boolean;
	}>;
	/** Indexes configuration */
	indexes?: Record<string, {
		columns: string[];
		unique?: boolean;
		where?: string;
	}>;
	/** Foreign keys configuration */
	foreignKeys?: Record<string, {
		references: string;
		onDelete?: string;
		onUpdate?: string;
	}>;
}

/**
 * Migration test factory
 */
export class MigrationTestFactory {
	/**
	 * Create a basic migration
	 */
	public static createBasicMigration(config: TestMigrationConfig): Migration {
		return {
			id: config.name,
			doctype: config.name,
			timestamp: new Date(),
			version: config.version,
			description: config.description || `Migration ${config.name}`,
			sql: config.sql || [],
			rollbackSql: config.reversible ? config.sql || [] : [],
			applied: false,
			destructive: false,
			requiresBackup: false,
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			}
		};
	}

	/**
	 * Create a schema migration
	 */
	public static createSchemaMigration(config: TestMigrationConfig): Migration {
		const createTableSql = this.generateCreateTableSQL(config);
		const dropTableSql = `DROP TABLE IF EXISTS ${config.name};`;

		return {
			id: config.name,
			doctype: config.name,
			timestamp: new Date(),
			version: config.version,
			description: config.description || `Schema migration for ${config.name}`,
			sql: [createTableSql],
			rollbackSql: [dropTableSql],
			applied: false,
			destructive: true,
			requiresBackup: true,
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			}
		};
	}

	/**
	 * Create a data migration
	 */
	public static createDataMigration(config: TestMigrationConfig): Migration {
		const updateDataSql = `UPDATE ${config.name} SET updated_at = CURRENT_TIMESTAMP WHERE 1=1;`;
		const revertDataSql = `UPDATE ${config.name} SET updated_at = NULL WHERE updated_at = CURRENT_TIMESTAMP;`;

		return {
			id: config.name,
			doctype: config.name,
			timestamp: new Date(),
			version: config.version,
			description: config.description || `Data migration for ${config.name}`,
			sql: [updateDataSql],
			rollbackSql: [revertDataSql],
			applied: false,
			destructive: false,
			requiresBackup: false,
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			}
		};
	}

	/**
	 * Create a mixed migration
	 */
	public static createMixedMigration(config: TestMigrationConfig): Migration {
		const alterTableSql = `ALTER TABLE ${config.name} ADD COLUMN new_column TEXT;`;
		const updateDataSql = `UPDATE ${config.name} SET new_column = 'default_value' WHERE new_column IS NULL;`;
		const revertAlterSql = `ALTER TABLE ${config.name} DROP COLUMN new_column;`;

		return {
			id: config.name,
			doctype: config.name,
			timestamp: new Date(),
			version: config.version,
			description: config.description || `Mixed migration for ${config.name}`,
			sql: [alterTableSql, updateDataSql],
			rollbackSql: [revertAlterSql],
			applied: false,
			destructive: false,
			requiresBackup: true,
			diff: {
				addedColumns: [{
					fieldname: 'new_column',
					column: {
						name: 'new_column',
						type: 'TEXT',
						nullable: true,
						primary_key: false,
						auto_increment: false,
						unique: false
					},
					destructive: false
				}],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			}
		};
	}

	/**
	 * Create a migration history
	 */
	public static createMigrationHistory(config: {
		migrations: Migration[];
		lastMigration?: Migration;
		pendingMigrations?: Migration[];
		failedMigrations?: Migration[];
	}): MigrationHistory {
		return {
			migrations: config.migrations,
			lastMigration: config.lastMigration,
			pendingMigrations: config.pendingMigrations || [],
			failedMigrations: config.failedMigrations || [],
			stats: this.createMigrationStats({
				total: config.migrations.length,
				applied: config.migrations.filter(m => m.applied).length,
				pending: (config.pendingMigrations || []).length,
				failed: (config.failedMigrations || []).length,
				destructive: config.migrations.filter(m => m.destructive).length,
				lastMigrationDate: config.lastMigration?.timestamp,
				totalExecutionTime: 0
			})
		};
	}

	/**
	 * Create migration statistics
	 */
	public static createMigrationStats(config: {
		total: number;
		applied: number;
		pending: number;
		failed: number;
		destructive: number;
		lastMigrationDate?: Date;
		totalExecutionTime: number;
	}): MigrationStats {
		return {
			total: config.total,
			applied: config.applied,
			pending: config.pending,
			failed: config.failed,
			destructive: config.destructive,
			lastMigrationDate: config.lastMigrationDate,
			totalExecutionTime: config.totalExecutionTime
		};
	}

	/**
	 * Create a migration result
	 */
	public static createMigrationResult(config: {
		success?: boolean;
		sql?: string[];
		warnings?: string[];
		errors?: string[];
		affectedRows?: number;
		executionTime?: number;
		backupPath?: string;
		metadata?: Record<string, any>;
	}): MigrationResult {
		return {
			success: config.success !== undefined ? config.success : true,
			sql: config.sql || [],
			warnings: config.warnings || [],
			errors: config.errors || [],
			affectedRows: config.affectedRows || 0,
			executionTime: config.executionTime || 100,
			backupPath: config.backupPath,
			metadata: config.metadata
		};
	}

	/**
	 * Create a schema diff
	 */
	public static createSchemaDiff(config: {
		addedColumns?: ColumnChange[];
		removedColumns?: ColumnChange[];
		modifiedColumns?: FieldChange[];
		addedIndexes?: IndexChange[];
		removedIndexes?: IndexChange[];
		renamedColumns?: ColumnRename[];
	}): SchemaDiff {
		return {
			addedColumns: config.addedColumns || [],
			removedColumns: config.removedColumns || [],
			modifiedColumns: config.modifiedColumns || [],
			addedIndexes: config.addedIndexes || [],
			removedIndexes: config.removedIndexes || [],
			renamedColumns: config.renamedColumns || []
		};
	}

	/**
	 * Create a column change
	 */
	public static createColumnChange(config: {
		fieldname: string;
		column: ColumnDefinition;
		destructive?: boolean;
	}): ColumnChange {
		return {
			fieldname: config.fieldname,
			column: config.column,
			destructive: config.destructive || false
		};
	}

	/**
	 * Create a column rename
	 */
	public static createColumnRename(config: {
		from: string;
		to: string;
		column: ColumnDefinition;
	}): ColumnRename {
		return {
			from: config.from,
			to: config.to,
			column: config.column
		};
	}

	/**
	 * Create a field change
	 */
	public static createFieldChange(config: {
		fieldname: string;
		changes: {
			type?: { from: string; to: string };
			length?: { from: number; to: number };
			required?: { from: boolean; to: boolean };
			unique?: { from: boolean; to: boolean };
			default?: { from: any; to: any };
			precision?: { from: number; to: number };
			nullable?: { from: boolean; to: boolean };
		};
		requiresDataMigration?: boolean;
		destructive?: boolean;
	}): FieldChange {
		return {
			fieldname: config.fieldname,
			changes: config.changes,
			requiresDataMigration: config.requiresDataMigration || false,
			destructive: config.destructive || false
		};
	}

	/**
	 * Create an index change
	 */
	public static createIndexChange(config: {
		name: string;
		index: IndexDefinition;
		destructive?: boolean;
	}): IndexChange {
		return {
			name: config.name,
			index: config.index,
			destructive: config.destructive || false
		};
	}

	/**
	 * Generate CREATE TABLE SQL from schema config
	 */
	private static generateCreateTableSQL(config: TestMigrationConfig): string {
		const fields = [
			'id INTEGER PRIMARY KEY AUTOINCREMENT',
			'name TEXT NOT NULL',
			'created_at DATETIME DEFAULT CURRENT_TIMESTAMP',
			'updated_at DATETIME DEFAULT CURRENT_TIMESTAMP'
		];

		return `CREATE TABLE ${config.name} (${fields.join(', ')});`;
	}

	/**
	 * Create a column definition
	 */
	public static createColumnDefinition(config: {
		name: string;
		type: string;
		nullable?: boolean;
		default_value?: any;
		primary_key?: boolean;
		auto_increment?: boolean;
		unique?: boolean;
		length?: number;
		precision?: number;
	}): ColumnDefinition {
		return {
			name: config.name,
			type: config.type,
			nullable: config.nullable !== undefined ? config.nullable : true,
			default_value: config.default_value,
			primary_key: config.primary_key || false,
			auto_increment: config.auto_increment || false,
			unique: config.unique || false,
			length: config.length,
			precision: config.precision
		};
	}

	/**
	 * Create an index definition
	 */
	public static createIndexDefinition(config: {
		name: string;
		columns: string[];
		unique?: boolean;
		type?: string;
		where?: string;
		order?: ('ASC' | 'DESC')[];
		collation?: string[];
	}): IndexDefinition {
		return {
			name: config.name,
			columns: config.columns,
			unique: config.unique || false,
			type: config.type,
			where: config.where,
			order: config.order,
			collation: config.collation
		};
	}
}

/**
 * Predefined test migrations
 */
export const TestMigrations = {
	/**
	 * Initial schema migration
	 */
	initialSchema: MigrationTestFactory.createSchemaMigration({
		name: '001_initial_schema',
		version: '1.0.0',
		description: 'Create initial database schema'
	}),

	/**
	 * User table migration
	 */
	userTable: MigrationTestFactory.createSchemaMigration({
		name: '002_create_user_table',
		version: '1.1.0',
		description: 'Create user table'
	}),

	/**
	 * Document table migration
	 */
	documentTable: MigrationTestFactory.createSchemaMigration({
		name: '003_create_document_table',
		version: '1.2.0',
		description: 'Create document table',
		dependencies: ['002_create_user_table']
	}),

	/**
	 * Data migration
	 */
	populateData: MigrationTestFactory.createDataMigration({
		name: '004_populate_initial_data',
		version: '1.3.0',
		description: 'Populate initial data',
		dependencies: ['003_create_document_table']
	}),

	/**
	 * Mixed migration
	 */
	addStatusColumn: MigrationTestFactory.createMixedMigration({
		name: '005_add_status_column',
		version: '1.4.0',
		description: 'Add status column and populate with default values',
		dependencies: ['004_populate_initial_data']
	})
};

/**
 * Migration test helper class
 */
export class MigrationTestHelper {
	private migrations: Migration[] = [];
	private schemaDiffs: SchemaDiff[] = [];

	/**
	 * Register a migration for cleanup
	 */
	public registerMigration(migration: Migration): void {
		this.migrations.push(migration);
	}

	/**
	 * Create and register a migration
	 */
	public createMigration(config: TestMigrationConfig): Migration {
		const migration = MigrationTestFactory.createBasicMigration(config);
		this.registerMigration(migration);
		return migration;
	}

	/**
	 * Register a schema diff
	 */
	public registerSchemaDiff(diff: SchemaDiff): void {
		this.schemaDiffs.push(diff);
	}

	/**
	 * Get all registered migrations
	 */
	public getMigrations(): Migration[] {
		return [...this.migrations];
	}

	/**
	 * Get all registered schema diffs
	 */
	public getSchemaDiffs(): SchemaDiff[] {
		return [...this.schemaDiffs];
	}

	/**
	 * Find a migration by ID
	 */
	public findMigration(id: string): Migration | undefined {
		return this.migrations.find(m => m.id === id);
	}

	/**
	 * Find a migration by DocType
	 */
	public findMigrationByDocType(doctype: string): Migration | undefined {
		return this.migrations.find(m => m.doctype === doctype);
	}

	/**
	 * Find migrations by status
	 */
	public findMigrationsByStatus(applied: boolean): Migration[] {
		return this.migrations.filter(m => m.applied === applied);
	}

	/**
	 * Find destructive migrations
	 */
	public findDestructiveMigrations(): Migration[] {
		return this.migrations.filter(m => m.destructive);
	}

	/**
	 * Get migration IDs
	 */
	public getMigrationIds(): string[] {
		return this.migrations.map(m => m.id);
	}

	/**
	 * Get migration versions
	 */
	public getMigrationVersions(): string[] {
		return this.migrations.map(m => m.version);
	}

	/**
	 * Sort migrations by version
	 */
	public sortMigrationsByVersion(): Migration[] {
		return [...this.migrations].sort((a, b) => a.version.localeCompare(b.version));
	}

	/**
	 * Sort migrations by timestamp
	 */
	public sortMigrationsByTimestamp(): Migration[] {
		return [...this.migrations].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
	}

	/**
	 * Get applied migrations
	 */
	public getAppliedMigrations(): Migration[] {
		return this.migrations.filter(m => m.applied);
	}

	/**
	 * Get pending migrations
	 */
	public getPendingMigrations(): Migration[] {
		return this.migrations.filter(m => !m.applied);
	}

	/**
	 * Get migrations with errors
	 */
	public getFailedMigrations(): Migration[] {
		return this.migrations.filter(m => !!m.error);
	}

	/**
	 * Clear all registered migrations and diffs
	 */
	public clear(): void {
		this.migrations = [];
		this.schemaDiffs = [];
	}
}

/**
 * Schema test utilities
 */
export class SchemaTestHelper {
	/**
	 * Create a test schema configuration
	 */
	public static createSchemaConfig(config: TestSchemaConfig): TestSchemaConfig {
		return {
			tableName: config.tableName,
			fields: config.fields,
			indexes: config.indexes || {},
			foreignKeys: config.foreignKeys || {}
		};
	}

	/**
	 * Generate CREATE TABLE SQL from schema config
	 */
	public static generateCreateTableSQL(config: TestSchemaConfig): string {
		const fieldDefinitions: string[] = [];
		const constraints: string[] = [];

		// Generate field definitions
		for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
			let definition = `${fieldName} ${fieldConfig.type}`;

			if (fieldConfig.primaryKey) {
				definition += ' PRIMARY KEY';
			}

			if (fieldConfig.autoIncrement) {
				definition += ' AUTOINCREMENT';
			}

			if (!fieldConfig.nullable) {
				definition += ' NOT NULL';
			}

			if (fieldConfig.default !== undefined) {
				definition += ` DEFAULT ${typeof fieldConfig.default === 'string' ? `'${fieldConfig.default}'` : fieldConfig.default}`;
			}

			if (fieldConfig.unique) {
				definition += ' UNIQUE';
			}

			fieldDefinitions.push(definition);
		}

		// Generate index constraints
		for (const [indexName, indexConfig] of Object.entries(config.indexes || {})) {
			let constraint = `CONSTRAINT ${indexName} UNIQUE (${indexConfig.columns.join(', ')})`;
			if (indexConfig.where) {
				constraint += ` WHERE ${indexConfig.where}`;
			}
			constraints.push(constraint);
		}

		// Generate foreign key constraints
		for (const [fkName, fkConfig] of Object.entries(config.foreignKeys || {})) {
			let constraint = `CONSTRAINT ${fkName} FOREIGN KEY (${fkName}) REFERENCES ${fkConfig.references}`;
			if (fkConfig.onDelete) {
				constraint += ` ON DELETE ${fkConfig.onDelete}`;
			}
			if (fkConfig.onUpdate) {
				constraint += ` ON UPDATE ${fkConfig.onUpdate}`;
			}
			constraints.push(constraint);
		}

		const allDefinitions = [...fieldDefinitions, ...constraints];
		return `CREATE TABLE ${config.tableName} (${allDefinitions.join(', ')});`;
	}

	/**
	 * Generate DROP TABLE SQL
	 */
	public static generateDropTableSQL(tableName: string): string {
		return `DROP TABLE IF EXISTS ${tableName};`;
	}

	/**
	 * Generate ALTER TABLE ADD COLUMN SQL
	 */
	public static generateAddColumnSQL(tableName: string, fieldName: string, fieldType: string): string {
		return `ALTER TABLE ${tableName} ADD COLUMN ${fieldName} ${fieldType};`;
	}

	/**
	 * Generate ALTER TABLE DROP COLUMN SQL
	 */
	public static generateDropColumnSQL(tableName: string, fieldName: string): string {
		return `ALTER TABLE ${tableName} DROP COLUMN ${fieldName};`;
	}

	/**
	 * Generate CREATE INDEX SQL
	 */
	public static generateCreateIndexSQL(indexName: string, tableName: string, columns: string[], unique: boolean = false): string {
		const uniqueClause = unique ? 'UNIQUE ' : '';
		return `CREATE ${uniqueClause}INDEX ${indexName} ON ${tableName} (${columns.join(', ')});`;
	}

	/**
	 * Generate DROP INDEX SQL
	 */
	public static generateDropIndexSQL(indexName: string): string {
		return `DROP INDEX IF EXISTS ${indexName};`;
	}
}