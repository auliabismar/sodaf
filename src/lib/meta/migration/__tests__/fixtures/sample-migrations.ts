/**
 * Sample Migration Objects for Testing
 * 
 * This file contains sample migration objects used across multiple test files.
 * These fixtures provide realistic examples of migration objects with various
 * configurations and edge cases.
 */

import type {
	Migration,
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
 * Sample column definition for testing
 */
export const sampleColumnDefinition: ColumnDefinition = {
	name: 'test_column',
	type: 'varchar',
	nullable: true,
	primary_key: false,
	auto_increment: false,
	unique: false,
	length: 255
};

/**
 * Sample column definition with foreign key
 */
export const sampleColumnWithForeignKey: ColumnDefinition = {
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
};

/**
 * Sample index definition for testing
 */
export const sampleIndexDefinition: IndexDefinition = {
	name: 'idx_test_column',
	columns: ['test_column'],
	unique: false,
	type: 'btree'
};

/**
 * Sample unique index definition
 */
export const sampleUniqueIndexDefinition: IndexDefinition = {
	name: 'idx_unique_email',
	columns: ['email'],
	unique: true,
	type: 'btree',
	where: 'email IS NOT NULL'
};

/**
 * Sample column change for testing
 */
export const sampleColumnChange: ColumnChange = {
	fieldname: 'new_field',
	column: sampleColumnDefinition,
	destructive: false
};

/**
 * Sample field change for testing
 */
export const sampleFieldChange: FieldChange = {
	fieldname: 'modified_field',
	changes: {
		type: { from: 'varchar', to: 'text' },
		length: { from: 255, to: 1000 },
		required: { from: false, to: true },
		unique: { from: false, to: true },
		default: { from: null, to: 'default_value' }
	},
	requiresDataMigration: true,
	destructive: false
};

/**
 * Sample index change for testing
 */
export const sampleIndexChange: IndexChange = {
	name: 'idx_new_index',
	index: sampleIndexDefinition,
	destructive: false
};

/**
 * Sample column rename for testing
 */
export const sampleColumnRename: ColumnRename = {
	from: 'old_column',
	to: 'new_column',
	column: sampleColumnDefinition
};

/**
 * Sample schema diff with added column
 */
export const schemaDiffWithAddedColumn: SchemaDiff = {
	addedColumns: [sampleColumnChange],
	removedColumns: [],
	modifiedColumns: [],
	addedIndexes: [],
	removedIndexes: [],
	renamedColumns: []
};

/**
 * Sample schema diff with removed column
 */
export const schemaDiffWithRemovedColumn: SchemaDiff = {
	addedColumns: [],
	removedColumns: [sampleColumnChange],
	modifiedColumns: [],
	addedIndexes: [],
	removedIndexes: [],
	renamedColumns: []
};

/**
 * Sample schema diff with modified column
 */
export const schemaDiffWithModifiedColumn: SchemaDiff = {
	addedColumns: [],
	removedColumns: [],
	modifiedColumns: [sampleFieldChange],
	addedIndexes: [],
	removedIndexes: [],
	renamedColumns: []
};

/**
 * Sample schema diff with renamed column
 */
export const schemaDiffWithRenamedColumn: SchemaDiff = {
	addedColumns: [],
	removedColumns: [],
	modifiedColumns: [],
	addedIndexes: [],
	removedIndexes: [],
	renamedColumns: [sampleColumnRename]
};

/**
 * Sample schema diff with index changes
 */
export const schemaDiffWithIndexChanges: SchemaDiff = {
	addedColumns: [],
	removedColumns: [],
	modifiedColumns: [],
	addedIndexes: [sampleIndexChange],
	removedIndexes: [],
	renamedColumns: []
};

/**
 * Complex schema diff with all types of changes
 */
export const complexSchemaDiff: SchemaDiff = {
	addedColumns: [sampleColumnChange],
	removedColumns: [sampleColumnChange],
	modifiedColumns: [sampleFieldChange],
	addedIndexes: [sampleIndexChange],
	removedIndexes: [sampleIndexChange],
	renamedColumns: [sampleColumnRename]
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
 * Sample migration with string SQL
 */
export const sampleMigrationWithStringSql: Migration = {
	id: 'add_user_email',
	doctype: 'User',
	timestamp: new Date('2023-12-01T10:00:00Z'),
	diff: schemaDiffWithAddedColumn,
	sql: 'ALTER TABLE `tabUser` ADD COLUMN `email` varchar(255) UNIQUE;',
	rollbackSql: 'ALTER TABLE `tabUser` DROP COLUMN `email`;',
	applied: false,
	version: '1.0.0',
	description: 'Add email field to User DocType',
	destructive: false,
	requiresBackup: false
};

/**
 * Sample migration with array SQL
 */
export const sampleMigrationWithArraySql: Migration = {
	id: 'modify_user_profile',
	doctype: 'User',
	timestamp: new Date('2023-12-02T10:00:00Z'),
	diff: schemaDiffWithModifiedColumn,
	sql: [
		'ALTER TABLE `tabUser` ADD COLUMN `temp_profile` text;',
		'UPDATE `tabUser` SET `temp_profile` = `profile`;',
		'ALTER TABLE `tabUser` DROP COLUMN `profile`;',
		'ALTER TABLE `tabUser` RENAME COLUMN `temp_profile` TO `profile`;'
	],
	rollbackSql: [
		'ALTER TABLE `tabUser` ADD COLUMN `temp_profile` varchar(255);',
		'UPDATE `tabUser` SET `temp_profile` = `profile`;',
		'ALTER TABLE `tabUser` DROP COLUMN `profile`;',
		'ALTER TABLE `tabUser` RENAME COLUMN `temp_profile` TO `profile`;'
	],
	applied: false,
	version: '1.1.0',
	description: 'Modify User profile field from varchar to text',
	destructive: false,
	requiresBackup: true
};

/**
 * Sample destructive migration
 */
export const sampleDestructiveMigration: Migration = {
	id: 'remove_legacy_data',
	doctype: 'LegacyData',
	timestamp: new Date('2023-12-03T10:00:00Z'),
	diff: schemaDiffWithRemovedColumn,
	sql: 'ALTER TABLE `tabLegacyData` DROP COLUMN `legacy_field`;',
	rollbackSql: 'ALTER TABLE `tabLegacyData` ADD COLUMN `legacy_field` text;',
	applied: false,
	version: '2.0.0',
	description: 'Remove legacy data field',
	destructive: true,
	requiresBackup: true
};

/**
 * Sample failed migration
 */
export const sampleFailedMigration: Migration = {
	id: 'failed_migration',
	doctype: 'TestDoc',
	timestamp: new Date('2023-12-04T10:00:00Z'),
	diff: schemaDiffWithAddedColumn,
	sql: 'INVALID SQL STATEMENT',
	rollbackSql: '',
	applied: false,
	version: '1.0.0',
	description: 'A migration that failed',
	destructive: false,
	requiresBackup: false,
	error: 'SQL syntax error near "INVALID"'
};

/**
 * Sample migration with metadata
 */
export const sampleMigrationWithMetadata: Migration = {
	id: 'migration_with_metadata',
	doctype: 'ComplexDoc',
	timestamp: new Date('2023-12-05T10:00:00Z'),
	diff: complexSchemaDiff,
	sql: 'ALTER TABLE `tabComplexDoc` ADD COLUMN `new_col` text;',
	rollbackSql: 'ALTER TABLE `tabComplexDoc` DROP COLUMN `new_col`;',
	applied: true,
	version: '1.2.0',
	description: 'Complex migration with metadata',
	destructive: false,
	requiresBackup: false,
	estimatedTime: 30,
	metadata: {
		author: 'test_developer',
		ticket: 'TICKET-123',
		notes: 'This migration addresses issue with data storage'
	}
};

/**
 * Array of all sample migrations
 */
export const sampleMigrations: Migration[] = [
	sampleMigrationWithStringSql,
	sampleMigrationWithArraySql,
	sampleDestructiveMigration,
	sampleFailedMigration,
	sampleMigrationWithMetadata
];