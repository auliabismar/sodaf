/**
 * Common Test Data for Migration Tests
 * 
 * This file contains common test data, helper functions, and utilities
 * used across multiple migration test files.
 */

import type { DocField, DocIndex } from '../../../doctype/types';
import type { ColumnInfo, IndexInfo } from '../../../../core/database/types';

/**
 * Sample DocField objects for testing integration
 */
export const sampleDocFields: Record<string, DocField> = {
	basicText: {
		fieldname: 'name',
		label: 'Name',
		fieldtype: 'Data',
		length: 100,
		required: true,
		unique: false
	},
	email: {
		fieldname: 'email',
		label: 'Email',
		fieldtype: 'Data',
		length: 255,
		required: false,
		unique: true
	},
	number: {
		fieldname: 'age',
		label: 'Age',
		fieldtype: 'Int',
		required: false,
		unique: false
	},
	date: {
		fieldname: 'birth_date',
		label: 'Birth Date',
		fieldtype: 'Date',
		required: false,
		unique: false
	},
	select: {
		fieldname: 'status',
		label: 'Status',
		fieldtype: 'Select',
		options: 'Active\nInactive\nPending',
		required: true,
		unique: false
	},
	link: {
		fieldname: 'user_role',
		label: 'User Role',
		fieldtype: 'Link',
		options: 'UserRole',
		required: false,
		unique: false
	},
	longText: {
		fieldname: 'description',
		label: 'Description',
		fieldtype: 'Long Text',
		required: false,
		unique: false
	},
	checkbox: {
		fieldname: 'is_active',
		label: 'Is Active',
		fieldtype: 'Check',
		required: false,
		unique: false,
		default: 0
	}
};

/**
 * Sample DocIndex objects for testing integration
 */
export const sampleDocIndexes: Record<string, DocIndex> = {
	basicIndex: {
		name: 'idx_name',
		columns: ['name'],
		unique: false
	},
	uniqueIndex: {
		name: 'idx_email_unique',
		columns: ['email'],
		unique: true
	},
	compositeIndex: {
		name: 'idx_name_status',
		columns: ['name', 'status'],
		unique: false
	},
	partialIndex: {
		name: 'idx_active_users',
		columns: ['name'],
		unique: false,
		where: 'is_active = 1'
	}
};

/**
 * Sample ColumnInfo objects for testing integration
 */
export const sampleColumnInfo: Record<string, ColumnInfo> = {
	basicText: {
		name: 'name',
		type: 'varchar',
		nullable: false,
		default_value: null,
		primary_key: false,
		auto_increment: false,
		unique: false
	},
	email: {
		name: 'email',
		type: 'varchar',
		nullable: true,
		default_value: null,
		primary_key: false,
		auto_increment: false,
		unique: true
	},
	number: {
		name: 'age',
		type: 'integer',
		nullable: true,
		default_value: null,
		primary_key: false,
		auto_increment: false,
		unique: false
	},
	date: {
		name: 'birth_date',
		type: 'date',
		nullable: true,
		default_value: null,
		primary_key: false,
		auto_increment: false,
		unique: false
	},
	select: {
		name: 'status',
		type: 'varchar',
		nullable: false,
		default_value: 'Active',
		primary_key: false,
		auto_increment: false,
		unique: false
	},
	checkbox: {
		name: 'is_active',
		type: 'integer',
		nullable: true,
		default_value: null,
		primary_key: false,
		auto_increment: false,
		unique: false
	},
	primaryKey: {
		name: 'id',
		type: 'integer',
		nullable: false,
		default_value: null,
		primary_key: true,
		auto_increment: true,
		unique: true
	}
};

/**
 * Sample IndexInfo objects for testing integration
 */
export const sampleIndexInfo: Record<string, IndexInfo> = {
	basicIndex: {
		name: 'idx_name',
		columns: ['name'],
		unique: false,
		type: 'btree'
	},
	uniqueIndex: {
		name: 'idx_email_unique',
		columns: ['email'],
		unique: true,
		type: 'btree'
	},
	compositeIndex: {
		name: 'idx_name_status',
		columns: ['name', 'status'],
		unique: false,
		type: 'btree'
	},
	hashIndex: {
		name: 'idx_hash_status',
		columns: ['status'],
		unique: false,
		type: 'hash'
	}
};

/**
 * Migration test scenarios
 */
export const migrationTestScenarios = {
	// Simple field addition
	addField: {
		description: 'Add a new email field to User DocType',
		oldFields: [sampleDocFields.basicText, sampleDocFields.number],
		newFields: [sampleDocFields.basicText, sampleDocFields.number, sampleDocFields.email],
		expectedChanges: ['addedColumns']
	},
	
	// Field removal
	removeField: {
		description: 'Remove a temporary field from DocType',
		oldFields: [sampleDocFields.basicText, sampleDocFields.number, sampleDocFields.longText],
		newFields: [sampleDocFields.basicText, sampleDocFields.number],
		expectedChanges: ['removedColumns']
	},
	
	// Field modification
	modifyField: {
		description: 'Change field length and make required',
		oldFields: [sampleDocFields.basicText],
		newFields: [{
			...sampleDocFields.basicText,
			length: 200,
			required: true
		}],
		expectedChanges: ['modifiedColumns']
	},
	
	// Field rename
	renameField: {
		description: 'Rename field from old_name to new_name',
		oldFields: [sampleDocFields.basicText],
		newFields: [{
			...sampleDocFields.basicText,
			fieldname: 'new_name',
			label: 'New Name'
		}],
		expectedChanges: ['renamedColumns']
	},
	
	// Index addition
	addIndex: {
		description: 'Add index on email field',
		oldIndexes: [sampleDocIndexes.basicIndex],
		newIndexes: [sampleDocIndexes.basicIndex, sampleDocIndexes.uniqueIndex],
		expectedChanges: ['addedIndexes']
	},
	
	// Index removal
	removeIndex: {
		description: 'Remove obsolete index',
		oldIndexes: [sampleDocIndexes.basicIndex, sampleDocIndexes.compositeIndex],
		newIndexes: [sampleDocIndexes.basicIndex],
		expectedChanges: ['removedIndexes']
	},
	
	// Complex scenario with multiple changes
	complex: {
		description: 'Multiple field and index changes',
		oldFields: [sampleDocFields.basicText, sampleDocFields.number],
		newFields: [sampleDocFields.basicText, sampleDocFields.number, sampleDocFields.email],
		oldIndexes: [sampleDocIndexes.basicIndex],
		newIndexes: [sampleDocIndexes.basicIndex, sampleDocIndexes.uniqueIndex],
		expectedChanges: ['addedColumns', 'addedIndexes']
	}
};

/**
 * Helper function to create a date for testing
 */
export function createTestDate(daysOffset: number = 0): Date {
	const date = new Date('2023-12-01T10:00:00Z');
	date.setDate(date.getDate() + daysOffset);
	return date;
}

/**
 * Helper function to create a migration ID
 */
export function createMigrationId(prefix: string, suffix: string = ''): string {
	const timestamp = Date.now();
	return suffix ? `${prefix}_${suffix}_${timestamp}` : `${prefix}_${timestamp}`;
}

/**
 * Helper function to create a test version string
 */
export function createTestVersion(major: number, minor: number, patch: number): string {
	return `${major}.${minor}.${patch}`;
}

/**
 * Helper function to create test SQL statements
 */
export const testSqlStatements = {
	addColumn: (table: string, column: string, type: string): string =>
		`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${type};`,
		
	dropColumn: (table: string, column: string): string =>
		`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\`;`,
		
	modifyColumn: (table: string, column: string, newType: string): string =>
		`ALTER TABLE \`${table}\` MODIFY COLUMN \`${column}\` ${newType};`,
		
	renameColumn: (table: string, oldName: string, newName: string): string =>
		`ALTER TABLE \`${table}\` RENAME COLUMN \`${oldName}\` TO \`${newName}\`;`,
		
	addIndex: (table: string, indexName: string, columns: string[]): string =>
		`CREATE INDEX \`${indexName}\` ON \`${table}\` (${columns.join(', ')});`,
		
	dropIndex: (indexName: string, table: string): string =>
		`DROP INDEX \`${indexName}\` ON \`${table}\`;`,
		
	addUniqueIndex: (table: string, indexName: string, columns: string[]): string =>
		`CREATE UNIQUE INDEX \`${indexName}\` ON \`${table}\` (${columns.join(', ')});`,
		
	createTable: (table: string, columns: string[]): string =>
		`CREATE TABLE \`${table}\` (${columns.join(', ')});`,
		
	dropTable: (table: string): string =>
		`DROP TABLE \`${table}\`;`
};

/**
 * Common test constants
 */
export const testConstants = {
	TEST_DOCTYPE: 'TestDocType',
	TEST_TABLE: 'tabTestDocType',
	TEST_MIGRATION_AUTHOR: 'test_developer',
	TEST_MIGRATION_TICKET: 'TICKET-123',
	TEST_MIGRATION_NOTES: 'Test migration for unit testing',
	TEST_BACKUP_PATH: '/tmp/test_backup.sql',
	TEST_TIMEOUT: 30000,
	TEST_BATCH_SIZE: 1000
};

/**
 * Common error messages for testing
 */
export const testErrorMessages = {
	SCHEMA_VALIDATION_FAILED: 'Schema validation failed',
	TABLE_NOT_FOUND: 'Table not found',
	COLUMN_NOT_FOUND: 'Column not found',
	INDEX_NOT_FOUND: 'Index not found',
	TYPE_CONVERSION_FAILED: 'Type conversion failed',
	CONSTRAINT_VIOLATION: 'Constraint violation',
	FOREIGN_KEY_VIOLATION: 'Foreign key violation',
	DATA_LOSS_RISK: 'Data loss risk',
	MIGRATION_TIMEOUT: 'Migration timeout',
	SQL_EXECUTION_ERROR: 'SQL execution error',
	BACKUP_FAILED: 'Backup failed',
	ROLLBACK_FAILED: 'Rollback failed'
};