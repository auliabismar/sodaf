/**
 * Sample Schema Diffs for Testing
 * 
 * This file contains sample schema diff objects used across multiple test files.
 * These fixtures provide realistic examples of schema differences with various
 * configurations and edge cases.
 */

import type {
	SchemaDiff,
	ColumnChange,
	FieldChange,
	IndexChange,
	ColumnRename,
	ColumnDefinition,
	IndexDefinition,
	ForeignKeyDefinition
} from '../../types';

/**
 * Sample column definition with all properties
 */
export const fullColumnDefinition: ColumnDefinition = {
	name: 'full_column',
	type: 'varchar',
	nullable: true,
	default_value: 'default_value',
	primary_key: false,
	auto_increment: false,
	unique: true,
	length: 255,
	precision: 2,
	foreign_key: {
		referenced_table: 'tabUser',
		referenced_column: 'id',
		on_delete: 'CASCADE',
		on_update: 'CASCADE'
	},
	check: 'length(full_column) > 0',
	collation: 'utf8_unicode_ci'
};

/**
 * Sample index definition with all properties
 */
export const fullIndexDefinition: IndexDefinition = {
	name: 'idx_full_index',
	columns: ['col1', 'col2'],
	unique: true,
	type: 'btree',
	where: 'col1 IS NOT NULL',
	order: ['ASC', 'DESC'],
	collation: ['utf8_unicode_ci', 'utf8_unicode_ci']
};

/**
 * Schema diff with added columns
 */
export const addColumnsSchemaDiff: SchemaDiff = {
	addedColumns: [
		{
			fieldname: 'email',
			column: {
				name: 'email',
				type: 'varchar',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: true,
				length: 255
			},
			destructive: false
		},
		{
			fieldname: 'created_at',
			column: {
				name: 'created_at',
				type: 'datetime',
				nullable: false,
				default_value: 'CURRENT_TIMESTAMP',
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			destructive: false
		}
	],
	removedColumns: [],
	modifiedColumns: [],
	addedIndexes: [],
	removedIndexes: [],
	renamedColumns: []
};

/**
 * Schema diff with removed columns
 */
export const removeColumnsSchemaDiff: SchemaDiff = {
	addedColumns: [],
	removedColumns: [
		{
			fieldname: 'legacy_field',
			column: {
				name: 'legacy_field',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			destructive: true
		}
	],
	modifiedColumns: [],
	addedIndexes: [],
	removedIndexes: [],
	renamedColumns: []
};

/**
 * Schema diff with modified columns
 */
export const modifyColumnsSchemaDiff: SchemaDiff = {
	addedColumns: [],
	removedColumns: [],
	modifiedColumns: [
		{
			fieldname: 'username',
			changes: {
				length: { from: 50, to: 100 },
				required: { from: false, to: true },
				unique: { from: false, to: true },
				default: { from: null, to: 'guest_user' }
			},
			requiresDataMigration: true,
			destructive: false
		},
		{
			fieldname: 'status',
			changes: {
				type: { from: 'varchar', to: 'enum' },
				length: { from: 20, to: 10 },
				nullable: { from: true, to: false }
			},
			requiresDataMigration: true,
			destructive: false
		}
	],
	addedIndexes: [],
	removedIndexes: [],
	renamedColumns: []
};

/**
 * Schema diff with renamed columns
 */
export const renameColumnsSchemaDiff: SchemaDiff = {
	addedColumns: [],
	removedColumns: [],
	modifiedColumns: [],
	addedIndexes: [],
	removedIndexes: [],
	renamedColumns: [
		{
			from: 'old_name',
			to: 'new_name',
			column: {
				name: 'new_name',
				type: 'varchar',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false,
				length: 100
			}
		},
		{
			from: 'legacy_id',
			to: 'reference_id',
			column: {
				name: 'reference_id',
				type: 'integer',
				nullable: false,
				primary_key: false,
				auto_increment: false,
				unique: false
			}
		}
	]
};

/**
 * Schema diff with index changes
 */
export const indexChangesSchemaDiff: SchemaDiff = {
	addedColumns: [],
	removedColumns: [],
	modifiedColumns: [],
	addedIndexes: [
		{
			name: 'idx_email_unique',
			index: {
				name: 'idx_email_unique',
				columns: ['email'],
				unique: true,
				type: 'btree'
			},
			destructive: false
		},
		{
			name: 'idx_name_status',
			index: {
				name: 'idx_name_status',
				columns: ['name', 'status'],
				unique: false,
				type: 'btree',
				where: 'status = "active"'
			},
			destructive: false
		}
	],
	removedIndexes: [
		{
			name: 'idx_old_index',
			index: {
				name: 'idx_old_index',
				columns: ['obsolete_field'],
				unique: false,
				type: 'btree'
			},
			destructive: false
		}
	],
	renamedColumns: []
};

/**
 * Empty schema diff
 */
export const emptySchemaDiff: SchemaDiff = {
	addedColumns: [],
	removedColumns: [],
	modifiedColumns: [],
	addedIndexes: [],
	removedIndexes: [],
	renamedColumns: []
};

/**
 * Complex schema diff with all types of changes
 */
export const complexSchemaDiff: SchemaDiff = {
	addedColumns: [
		{
			fieldname: 'new_field',
			column: {
				name: 'new_field',
				type: 'text',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false
			},
			destructive: false
		}
	],
	removedColumns: [
		{
			fieldname: 'removed_field',
			column: {
				name: 'removed_field',
				type: 'varchar',
				nullable: true,
				primary_key: false,
				auto_increment: false,
				unique: false,
				length: 100
			},
			destructive: true
		}
	],
	modifiedColumns: [
		{
			fieldname: 'modified_field',
			changes: {
				type: { from: 'varchar', to: 'text' },
				length: { from: 100, to: 1000 },
				required: { from: false, to: true },
				unique: { from: false, to: true }
			},
			requiresDataMigration: true,
			destructive: false
		}
	],
	addedIndexes: [
		{
			name: 'idx_new_index',
			index: {
				name: 'idx_new_index',
				columns: ['new_field'],
				unique: false,
				type: 'btree'
			},
			destructive: false
		}
	],
	removedIndexes: [
		{
			name: 'idx_removed_index',
			index: {
				name: 'idx_removed_index',
				columns: ['removed_field'],
				unique: false,
				type: 'btree'
			},
			destructive: false
		}
	],
	renamedColumns: [
		{
			from: 'old_column',
			to: 'new_column',
			column: {
				name: 'new_column',
				type: 'integer',
				nullable: false,
				primary_key: false,
				auto_increment: false,
				unique: false
			}
		}
	]
};

/**
 * Schema diff with foreign key changes
 */
export const foreignKeySchemaDiff: SchemaDiff = {
	addedColumns: [
		{
			fieldname: 'user_id',
			column: {
				name: 'user_id',
				type: 'integer',
				nullable: false,
				primary_key: false,
				auto_increment: false,
				unique: false,
				foreign_key: {
					referenced_table: 'tabUser',
					referenced_column: 'id',
					on_delete: 'CASCADE',
					on_update: 'CASCADE'
				}
			},
			destructive: false
		}
	],
	removedColumns: [],
	modifiedColumns: [],
	addedIndexes: [
		{
			name: 'idx_user_id',
			index: {
				name: 'idx_user_id',
				columns: ['user_id'],
				unique: false,
				type: 'btree'
			},
			destructive: false
		}
	],
	removedIndexes: [],
	renamedColumns: []
};

/**
 * Record of all schema diffs for easy access in tests
 */
export const allSchemaDiffs: Record<string, SchemaDiff> = {
	addColumns: addColumnsSchemaDiff,
	removeColumns: removeColumnsSchemaDiff,
	modifyColumns: modifyColumnsSchemaDiff,
	renameColumns: renameColumnsSchemaDiff,
	indexChanges: indexChangesSchemaDiff,
	empty: emptySchemaDiff,
	complex: complexSchemaDiff,
	foreignKey: foreignKeySchemaDiff
};