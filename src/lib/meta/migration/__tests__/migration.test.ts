/**
 * Migration Type Tests (P2-005-M1 to M7)
 * 
 * This file contains tests for migration types to ensure they compile
 * correctly and handle various migration scenarios.
 */

import { describe, it, expect } from 'vitest';
import type {
	Migration,
	SchemaDiff,
	MigrationOptions,
	MigrationResult
} from '../types';
import {
	sampleMigrationWithStringSql,
	sampleMigrationWithArraySql,
	sampleDestructiveMigration,
	sampleFailedMigration,
	sampleMigrationWithMetadata
} from './fixtures/sample-migrations';
import { createTestDate, createMigrationId, createTestVersion } from './fixtures/test-data';

describe('Migration Tests', () => {
	/**
	 * Test P2-005-M1: Create Migration with required properties
	 */
	it('P2-005-M1: should create Migration with required properties', () => {
		const migration: Migration = {
			id: 'test-migration-001',
			doctype: 'TestDocType',
			timestamp: createTestDate(),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN new_field VARCHAR(255);',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN new_field;',
			applied: false,
			version: '1.0.0',
			destructive: false,
			requiresBackup: false
		};
		
		expect(migration).toBeDefined();
		expect(migration.id).toBe('test-migration-001');
		expect(migration.doctype).toBe('TestDocType');
		expect(migration.timestamp).toBeInstanceOf(Date);
		expect(migration.applied).toBe(false);
		expect(migration.version).toBe('1.0.0');
		expect(migration.destructive).toBe(false);
		expect(migration.requiresBackup).toBe(false);
		
		// Check that diff is a valid SchemaDiff
		expect(Array.isArray(migration.diff.addedColumns)).toBe(true);
		expect(Array.isArray(migration.diff.removedColumns)).toBe(true);
		expect(Array.isArray(migration.diff.modifiedColumns)).toBe(true);
		expect(Array.isArray(migration.diff.addedIndexes)).toBe(true);
		expect(Array.isArray(migration.diff.removedIndexes)).toBe(true);
		expect(Array.isArray(migration.diff.renamedColumns)).toBe(true);
		
		// Check SQL properties
		expect(typeof migration.sql).toBe('string');
		expect(typeof migration.rollbackSql).toBe('string');
	});

	/**
	 * Test P2-005-M2: Migration with string SQL
	 */
	it('P2-005-M2: should handle Migration with string SQL', () => {
		const migration: Migration = sampleMigrationWithStringSql;
		
		expect(migration).toBeDefined();
		expect(migration.id).toBe('add_user_email');
		expect(migration.doctype).toBe('User');
		expect(migration.sql).toBe('ALTER TABLE `tabUser` ADD COLUMN `email` varchar(255) UNIQUE;');
		expect(migration.rollbackSql).toBe('ALTER TABLE `tabUser` DROP COLUMN `email`;');
		expect(typeof migration.sql).toBe('string');
		expect(typeof migration.rollbackSql).toBe('string');
	});

	/**
	 * Test P2-005-M3: Migration with array SQL
	 */
	it('P2-005-M3: should handle Migration with array SQL', () => {
		const migration: Migration = sampleMigrationWithArraySql;
		
		expect(migration).toBeDefined();
		expect(migration.id).toBe('modify_user_profile');
		expect(migration.doctype).toBe('User');
		expect(Array.isArray(migration.sql)).toBe(true);
		expect(Array.isArray(migration.rollbackSql)).toBe(true);
		expect(migration.sql).toHaveLength(4);
		expect(migration.rollbackSql).toHaveLength(4);
		
		// Check SQL statements
		expect(migration.sql[0]).toBe('ALTER TABLE `tabUser` ADD COLUMN `temp_profile` text;');
		expect(migration.sql[1]).toBe('UPDATE `tabUser` SET `temp_profile` = `profile`;');
		expect(migration.sql[2]).toBe('ALTER TABLE `tabUser` DROP COLUMN `profile`;');
		expect(migration.sql[3]).toBe('ALTER TABLE `tabUser` RENAME COLUMN `temp_profile` TO `profile`;');
		
		// Check rollback statements
		expect(migration.rollbackSql[0]).toBe('ALTER TABLE `tabUser` ADD COLUMN `temp_profile` varchar(255);');
		expect(migration.rollbackSql[1]).toBe('UPDATE `tabUser` SET `temp_profile` = `profile`;');
		expect(migration.rollbackSql[2]).toBe('ALTER TABLE `tabUser` DROP COLUMN `profile`;');
		expect(migration.rollbackSql[3]).toBe('ALTER TABLE `tabUser` RENAME COLUMN `temp_profile` TO `profile`;');
	});

	/**
	 * Test P2-005-M4: Migration with destructive flag
	 */
	it('P2-005-M4: should handle Migration with destructive flag', () => {
		const nonDestructiveMigration: Migration = {
			id: createMigrationId('non_destructive'),
			doctype: 'TestDocType',
			timestamp: createTestDate(),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN new_field VARCHAR(255);',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN new_field;',
			applied: false,
			version: createTestVersion(1, 0, 0),
			destructive: false,
			requiresBackup: false
		};
		
		const destructiveMigration: Migration = sampleDestructiveMigration;
		
		// Check non-destructive migration
		expect(nonDestructiveMigration.destructive).toBe(false);
		
		// Check destructive migration
		expect(destructiveMigration.destructive).toBe(true);
		expect(destructiveMigration.id).toBe('remove_legacy_data');
		expect(destructiveMigration.doctype).toBe('LegacyData');
		expect(destructiveMigration.sql).toBe('ALTER TABLE `tabLegacyData` DROP COLUMN `legacy_field`;');
		expect(destructiveMigration.rollbackSql).toBe('ALTER TABLE `tabLegacyData` ADD COLUMN `legacy_field` text;');
	});

	/**
	 * Test P2-005-M5: Migration with backup requirement
	 */
	it('P2-005-M5: should handle Migration with backup requirement', () => {
		const noBackupMigration: Migration = {
			id: createMigrationId('no_backup'),
			doctype: 'TestDocType',
			timestamp: createTestDate(),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN new_field VARCHAR(255);',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN new_field;',
			applied: false,
			version: createTestVersion(1, 0, 0),
			destructive: false,
			requiresBackup: false
		};
		
		const backupRequiredMigration: Migration = sampleMigrationWithArraySql;
		
		// Check migration without backup requirement
		expect(noBackupMigration.requiresBackup).toBe(false);
		
		// Check migration with backup requirement
		expect(backupRequiredMigration.requiresBackup).toBe(true);
		expect(backupRequiredMigration.id).toBe('modify_user_profile');
		expect(backupRequiredMigration.doctype).toBe('User');
	});

	/**
	 * Test P2-005-M6: Migration with metadata
	 */
	it('P2-005-M6: should handle Migration with metadata', () => {
		const migration: Migration = sampleMigrationWithMetadata;
		
		expect(migration).toBeDefined();
		expect(migration.id).toBe('migration_with_metadata');
		expect(migration.doctype).toBe('ComplexDoc');
		expect(migration.version).toBe('1.2.0');
		expect(migration.description).toBe('Complex migration with metadata');
		expect(migration.estimatedTime).toBe(30);
		expect(migration.metadata).toBeDefined();
		expect(migration.metadata?.author).toBe('test_developer');
		expect(migration.metadata?.ticket).toBe('TICKET-123');
		expect(migration.metadata?.notes).toBe('This migration addresses issue with data storage');
	});

	/**
	 * Test P2-005-M7: Failed Migration with error
	 */
	it('P2-005-M7: should handle Failed Migration with error', () => {
		const migration: Migration = sampleFailedMigration;
		
		expect(migration).toBeDefined();
		expect(migration.id).toBe('failed_migration');
		expect(migration.doctype).toBe('TestDoc');
		expect(migration.applied).toBe(false);
		expect(migration.error).toBeDefined();
		expect(migration.error).toBe('SQL syntax error near "INVALID"');
		expect(migration.sql).toBe('INVALID SQL STATEMENT');
		expect(migration.rollbackSql).toBe('');
	});
});

describe('Migration Type Safety', () => {
	/**
	 * Test that Migration enforces required properties
	 */
	it('should enforce Migration required properties', () => {
		const validMigration: Migration = {
			id: createMigrationId('test'),
			doctype: 'TestDocType',
			timestamp: createTestDate(),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN new_field VARCHAR(255);',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN new_field;',
			applied: false,
			version: createTestVersion(1, 0, 0),
			destructive: false,
			requiresBackup: false
		};
		
		expect(validMigration.id).toBeDefined();
		expect(validMigration.doctype).toBeDefined();
		expect(validMigration.timestamp).toBeDefined();
		expect(validMigration.diff).toBeDefined();
		expect(validMigration.sql).toBeDefined();
		expect(validMigration.rollbackSql).toBeDefined();
		expect(typeof validMigration.applied).toBe('boolean');
		expect(validMigration.version).toBeDefined();
		expect(typeof validMigration.destructive).toBe('boolean');
		expect(typeof validMigration.requiresBackup).toBe('boolean');
	});

	/**
	 * Test Migration with all optional properties
	 */
	it('should handle Migration with all optional properties', () => {
		const fullMigration: Migration = {
			id: createMigrationId('full'),
			doctype: 'TestDocType',
			timestamp: createTestDate(),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: ['ALTER TABLE tabTestDocType ADD COLUMN new_field VARCHAR(255);'],
			rollbackSql: ['ALTER TABLE tabTestDocType DROP COLUMN new_field;'],
			applied: true,
			error: undefined,
			version: createTestVersion(1, 2, 3),
			description: 'Full migration with all properties',
			destructive: false,
			requiresBackup: true,
			estimatedTime: 45,
			metadata: {
				author: 'test_developer',
				ticket: 'TICKET-123',
				notes: 'Test migration with all properties',
				customProperty: 'custom_value'
			}
		};
		
		expect(fullMigration.id).toBeDefined();
		expect(fullMigration.doctype).toBeDefined();
		expect(fullMigration.timestamp).toBeDefined();
		expect(fullMigration.diff).toBeDefined();
		expect(Array.isArray(fullMigration.sql)).toBe(true);
		expect(Array.isArray(fullMigration.rollbackSql)).toBe(true);
		expect(fullMigration.applied).toBe(true);
		expect(fullMigration.error).toBeUndefined();
		expect(fullMigration.version).toBe('1.2.3');
		expect(fullMigration.description).toBe('Full migration with all properties');
		expect(fullMigration.destructive).toBe(false);
		expect(fullMigration.requiresBackup).toBe(true);
		expect(fullMigration.estimatedTime).toBe(45);
		expect(fullMigration.metadata?.author).toBe('test_developer');
		expect(fullMigration.metadata?.ticket).toBe('TICKET-123');
		expect(fullMigration.metadata?.notes).toBe('Test migration with all properties');
		expect(fullMigration.metadata?.customProperty).toBe('custom_value');
	});

	/**
	 * Test MigrationOptions type safety
	 */
	it('should enforce MigrationOptions type safety', () => {
		const options: MigrationOptions = {
			dryRun: true,
			force: false,
			preserveData: true,
			backup: true,
			continueOnError: false,
			batchSize: 1000,
			timeout: 300,
			validateData: true,
			context: {
				author: 'test_developer',
				environment: 'test',
				customOption: 'custom_value'
			}
		};
		
		expect(options.dryRun).toBe(true);
		expect(options.force).toBe(false);
		expect(options.preserveData).toBe(true);
		expect(options.backup).toBe(true);
		expect(options.continueOnError).toBe(false);
		expect(options.batchSize).toBe(1000);
		expect(options.timeout).toBe(300);
		expect(options.validateData).toBe(true);
		expect(options.context?.author).toBe('test_developer');
		expect(options.context?.environment).toBe('test');
		expect(options.context?.customOption).toBe('custom_value');
	});

	/**
	 * Test MigrationResult type safety
	 */
	it('should enforce MigrationResult type safety', () => {
		const successResult: MigrationResult = {
			success: true,
			sql: ['ALTER TABLE tabTestDocType ADD COLUMN new_field VARCHAR(255);'],
			warnings: ['Adding column may affect performance'],
			errors: [],
			affectedRows: 1000,
			executionTime: 2500,
			backupPath: '/tmp/backup.sql',
			metadata: {
				migrationId: 'test-migration',
				executedAt: createTestDate()
			}
		};
		
		const failureResult: MigrationResult = {
			success: false,
			sql: ['INVALID SQL STATEMENT'],
			warnings: [],
			errors: ['SQL syntax error'],
			executionTime: 100
		};
		
		// Check success result
		expect(successResult.success).toBe(true);
		expect(Array.isArray(successResult.sql)).toBe(true);
		expect(Array.isArray(successResult.warnings)).toBe(true);
		expect(Array.isArray(successResult.errors)).toBe(true);
		expect(successResult.errors).toHaveLength(0);
		expect(successResult.affectedRows).toBe(1000);
		expect(successResult.executionTime).toBe(2500);
		expect(successResult.backupPath).toBe('/tmp/backup.sql');
		expect(successResult.metadata?.migrationId).toBe('test-migration');
		expect(successResult.metadata?.executedAt).toBeInstanceOf(Date);
		
		// Check failure result
		expect(failureResult.success).toBe(false);
		expect(Array.isArray(failureResult.sql)).toBe(true);
		expect(Array.isArray(failureResult.warnings)).toBe(true);
		expect(Array.isArray(failureResult.errors)).toBe(true);
		expect(failureResult.warnings).toHaveLength(0);
		expect(failureResult.errors).toHaveLength(1);
		expect(failureResult.errors[0]).toBe('SQL syntax error');
		expect(failureResult.executionTime).toBe(100);
		expect(failureResult.affectedRows).toBeUndefined();
		expect(failureResult.backupPath).toBeUndefined();
	});
});

describe('Migration Edge Cases', () => {
	/**
	 * Test Migration with minimal SQL
	 */
	it('should handle Migration with minimal SQL', () => {
		const minimalMigration: Migration = {
			id: createMigrationId('minimal'),
			doctype: 'TestDocType',
			timestamp: createTestDate(),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: '',
			rollbackSql: '',
			applied: false,
			version: createTestVersion(1, 0, 0),
			destructive: false,
			requiresBackup: false
		};
		
		expect(minimalMigration.sql).toBe('');
		expect(minimalMigration.rollbackSql).toBe('');
	});

	/**
	 * Test Migration with complex SQL array
	 */
	it('should handle Migration with complex SQL array', () => {
		const complexMigration: Migration = {
			id: createMigrationId('complex'),
			doctype: 'TestDocType',
			timestamp: createTestDate(),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: [
				'BEGIN TRANSACTION;',
				'ALTER TABLE tabTestDocType ADD COLUMN temp_field VARCHAR(255);',
				'UPDATE tabTestDocType SET temp_field = old_field;',
				'ALTER TABLE tabTestDocType DROP COLUMN old_field;',
				'ALTER TABLE tabTestDocType RENAME COLUMN temp_field TO new_field;',
				'CREATE INDEX idx_new_field ON tabTestDocType(new_field);',
				'COMMIT;'
			],
			rollbackSql: [
				'BEGIN TRANSACTION;',
				'DROP INDEX idx_new_field;',
				'ALTER TABLE tabTestDocType ADD COLUMN temp_field VARCHAR(255);',
				'UPDATE tabTestDocType SET temp_field = new_field;',
				'ALTER TABLE tabTestDocType DROP COLUMN new_field;',
				'ALTER TABLE tabTestDocType RENAME COLUMN temp_field TO old_field;',
				'COMMIT;'
			],
			applied: false,
			version: createTestVersion(1, 0, 0),
			destructive: false,
			requiresBackup: true
		};
		
		expect(Array.isArray(complexMigration.sql)).toBe(true);
		expect(Array.isArray(complexMigration.rollbackSql)).toBe(true);
		expect(complexMigration.sql).toHaveLength(7);
		expect(complexMigration.rollbackSql).toHaveLength(7);
		expect(complexMigration.sql[0]).toBe('BEGIN TRANSACTION;');
		expect(complexMigration.sql[6]).toBe('COMMIT;');
		expect(complexMigration.rollbackSql[0]).toBe('BEGIN TRANSACTION;');
		expect(complexMigration.rollbackSql[6]).toBe('COMMIT;');
	});

	/**
	 * Test Migration with empty metadata
	 */
	it('should handle Migration with empty metadata', () => {
		const emptyMetadataMigration: Migration = {
			id: createMigrationId('empty_metadata'),
			doctype: 'TestDocType',
			timestamp: createTestDate(),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN new_field VARCHAR(255);',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN new_field;',
			applied: false,
			version: createTestVersion(1, 0, 0),
			destructive: false,
			requiresBackup: false,
			metadata: {}
		};
		
		expect(emptyMetadataMigration.metadata).toBeDefined();
		expect(Object.keys(emptyMetadataMigration.metadata || {})).toHaveLength(0);
	});
});