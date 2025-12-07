/**
 * Migration Applier Tests (P2-008-T1 to T17)
 * 
 * This file contains tests for MigrationApplier class, which is the main
 * orchestrator for applying migrations to the database.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MigrationApplier } from '../apply';
import type { Database } from '../../../core/database/database';
import type { DocTypeEngine } from '../../doctype/doctype-engine';
import type { DocType, DocField } from '../../doctype/types';
import type { Migration, SchemaDiff } from '../types';
import type { MigrationResult } from '../types';
import type { ApplyOptions, SyncOptions } from '../apply-types';
import { MigrationStatus } from '../apply-types';

import {
	testDocType,
	sampleMigrations,
	sampleAppliedMigrations,
	sampleMigrationResults,
	sampleOptions
} from './fixtures/apply-fixtures';
import { testConstants } from './fixtures/test-data';
import { addColumnsSchemaDiff, removeColumnsSchemaDiff, complexSchemaDiff } from './fixtures/schema-diffs';
import { sampleDocFields } from './fixtures/test-data';

// Mock implementations
const mockDatabase = {
	run: vi.fn().mockResolvedValue({ changes: 1 }),
	sql: vi.fn().mockResolvedValue([]),
	begin: vi.fn().mockResolvedValue({ id: 'tx_123' }),
	commit: vi.fn().mockResolvedValue(undefined),
	rollback: vi.fn().mockResolvedValue(undefined),
	savepoint: vi.fn().mockResolvedValue({ name: 'sp_1' }),
	release_savepoint: vi.fn().mockResolvedValue(undefined),
	rollback_to_savepoint: vi.fn().mockResolvedValue(undefined),
	withTransaction: vi.fn().mockImplementation((fn) => fn({ id: 'tx_123' })),
	get_table_info: vi.fn().mockResolvedValue({
		columns: [],
		indexes: [],
		foreign_keys: []
	})
} as unknown as Database;

const mockDocTypeEngine = {
	getDocType: vi.fn().mockResolvedValue(testDocType),
	getAllDocTypes: vi.fn().mockResolvedValue([testDocType]),
	getDocTypesByModule: vi.fn().mockResolvedValue([testDocType]),
	isRegistered: vi.fn().mockResolvedValue(true),
	getDocTypeCount: vi.fn().mockResolvedValue(1)
} as unknown as DocTypeEngine;

describe('MigrationApplier', () => {
	let migrationApplier: MigrationApplier;
	
	beforeEach(() => {
		migrationApplier = new MigrationApplier(mockDatabase, mockDocTypeEngine);
		vi.clearAllMocks();
	});
	
	afterEach(() => {
		migrationApplier = null as any;
	});

	describe('P2-008-T1: syncDocType creates table', () => {
		it('should create table with all columns when table does not exist', async () => {
			// Mock database to indicate table doesn't exist
			mockDatabase.sql = vi.fn()
				.mockResolvedValueOnce([]) // No columns found
				.mockResolvedValueOnce([]); // No indexes found
			
			// Mock schema engine to return diff with all fields as added
			const mockSchemaEngine = migrationApplier['schemaEngine'];
			mockSchemaEngine.compareSchema = vi.fn().mockResolvedValue(addColumnsSchemaDiff);
			mockSchemaEngine.hasChanges = vi.fn().mockResolvedValue(true);
			
			// Mock SQL generator to return CREATE TABLE statement
			const mockSqlGenerator = migrationApplier['sqlGenerator'];
			mockSqlGenerator.generateMigrationSQL = vi.fn().mockReturnValue({
				forward: [
					{
						sql: `CREATE TABLE \`${testConstants.TEST_TABLE}\` (\`name\` varchar(100), \`email\` varchar(255));`,
						type: 'create_table',
						destructive: false,
						table: testConstants.TEST_TABLE
					}
				],
				rollback: [
					{
						sql: `DROP TABLE \`${testConstants.TEST_TABLE}\`;`,
						type: 'drop_table',
						destructive: true,
						table: testConstants.TEST_TABLE
					}
				],
				warnings: [],
				destructive: false
			});
			
			// Mock executor to return success
			const mockExecutor = migrationApplier['executor'];
			mockExecutor.executeMigrationSQL = vi.fn().mockResolvedValue({
				success: true,
				warnings: [],
				errors: [],
				affectedRows: 0
			});
			
			// Mock history manager
			const mockHistoryManager = migrationApplier['historyManager'];
			mockHistoryManager.recordMigration = vi.fn().mockResolvedValue(undefined);
			
			const result = await migrationApplier.syncDocType(testConstants.TEST_DOCTYPE);
			
			expect(result.success).toBe(true);
			expect(result.sql).toHaveLength(1);
			expect(result.sql[0]).toContain('CREATE TABLE');
			expect(result.sql[0]).toContain(testConstants.TEST_TABLE);
			expect(result.sql[0]).toContain('name');
			expect(result.sql[0]).toContain('email');
			expect(result.metadata?.doctype).toBe(testConstants.TEST_DOCTYPE);
			expect(result.metadata?.action).toBe('sync');
			expect(result.metadata?.changes).toBe(true);
			
			// Verify executor was called
			expect(mockExecutor.executeMigrationSQL).toHaveBeenCalled();
			
			// Verify history was recorded
			expect(mockHistoryManager.recordMigration).toHaveBeenCalled();
		});
	});

	describe('P2-008-T2: syncDocType adds column', () => {
		it('should add column to existing table', async () => {
			// Mock database to indicate table exists but missing new column
			mockDatabase.sql = vi.fn()
				.mockResolvedValueOnce([{ name: 'name', type: 'varchar' }]) // Existing columns
				.mockResolvedValueOnce([]); // No indexes
			
			// Mock schema engine to return diff with added column
			const mockSchemaEngine = migrationApplier['schemaEngine'];
			mockSchemaEngine.compareSchema = vi.fn().mockResolvedValue(addColumnsSchemaDiff);
			mockSchemaEngine.hasChanges = vi.fn().mockResolvedValue(true);
			
			// Mock SQL generator to return ADD COLUMN statement
			const mockSqlGenerator = migrationApplier['sqlGenerator'];
			mockSqlGenerator.generateMigrationSQL = vi.fn().mockReturnValue({
				forward: [
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` ADD COLUMN \`email\` varchar(255);`,
						type: 'alter_table',
						destructive: false,
						table: testConstants.TEST_TABLE,
						column: 'email'
					}
				],
				rollback: [
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` DROP COLUMN \`email\`;`,
						type: 'alter_table',
						destructive: true,
						table: testConstants.TEST_TABLE,
						column: 'email'
					}
				],
				warnings: [],
				destructive: false
			});
			
			// Mock executor to return success
			const mockExecutor = migrationApplier['executor'];
			mockExecutor.executeMigrationSQL = vi.fn().mockResolvedValue({
				success: true,
				warnings: [],
				errors: [],
				affectedRows: 0
			});
			
			// Mock history manager
			const mockHistoryManager = migrationApplier['historyManager'];
			mockHistoryManager.recordMigration = vi.fn().mockResolvedValue(undefined);
			
			const result = await migrationApplier.syncDocType(testConstants.TEST_DOCTYPE);
			
			expect(result.success).toBe(true);
			expect(result.sql).toHaveLength(1);
			expect(result.sql[0]).toContain('ALTER TABLE');
			expect(result.sql[0]).toContain('ADD COLUMN');
			expect(result.sql[0]).toContain('email');
			expect(result.metadata?.changes).toBe(true);
		});
	});

	describe('P2-008-T3: syncDocType drops column', () => {
		it('should remove column from existing table with backup', async () => {
			// Mock database to indicate table exists with the column to be dropped
			mockDatabase.sql = vi.fn()
				.mockResolvedValueOnce([
					{ name: 'name', type: 'varchar' },
					{ name: 'legacy_field', type: 'text' }
				]) // Existing columns
				.mockResolvedValueOnce([]); // No indexes
			
			// Mock schema engine to return diff with removed column
			const mockSchemaEngine = migrationApplier['schemaEngine'];
			mockSchemaEngine.compareSchema = vi.fn().mockResolvedValue(removeColumnsSchemaDiff);
			mockSchemaEngine.hasChanges = vi.fn().mockResolvedValue(true);
			
			// Mock SQL generator to return DROP COLUMN statement
			const mockSqlGenerator = migrationApplier['sqlGenerator'];
			mockSqlGenerator.generateMigrationSQL = vi.fn().mockReturnValue({
				forward: [
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` DROP COLUMN \`legacy_field\`;`,
						type: 'alter_table',
						destructive: true,
						table: testConstants.TEST_TABLE,
						column: 'legacy_field'
					}
				],
				rollback: [
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` ADD COLUMN \`legacy_field\` text;`,
						type: 'alter_table',
						destructive: false,
						table: testConstants.TEST_TABLE,
						column: 'legacy_field'
					}
				],
				warnings: ['Data loss risk: column removal will delete data'],
				destructive: true
			});
			
			// Mock backup manager
			const mockBackupManager = migrationApplier['backupManager'];
			mockBackupManager.createBackup = vi.fn().mockResolvedValue('/tmp/backup.sql');
			
			// Mock executor to return success
			const mockExecutor = migrationApplier['executor'];
			mockExecutor.executeMigrationSQL = vi.fn().mockResolvedValue({
				success: true,
				warnings: [],
				errors: [],
				affectedRows: 0
			});
			
			// Mock history manager
			const mockHistoryManager = migrationApplier['historyManager'];
			mockHistoryManager.recordMigration = vi.fn().mockResolvedValue(undefined);
			
			const result = await migrationApplier.syncDocType(testConstants.TEST_DOCTYPE);
			
			expect(result.success).toBe(true);
			expect(result.sql).toHaveLength(1);
			expect(result.sql[0]).toContain('DROP COLUMN');
			expect(result.sql[0]).toContain('legacy_field');
			expect(result.backupPath).toBe('/tmp/backup.sql');
			expect(result.warnings).toContain('Data loss risk: column removal will delete data');
			expect(result.metadata?.destructive).toBe(true);
			
			// Verify backup was created
			expect(mockBackupManager.createBackup).toHaveBeenCalledWith(
				testConstants.TEST_DOCTYPE,
				'FULL'
			);
		});
	});

	describe('P2-008-T4: syncDocType modifies column', () => {
		it('should change column type with table rebuild', async () => {
			// Mock database to indicate table exists with old column type
			mockDatabase.sql = vi.fn()
				.mockResolvedValueOnce([
					{ name: 'name', type: 'varchar', length: 100 },
					{ name: 'age', type: 'integer' }
				]) // Existing columns
				.mockResolvedValueOnce([]); // No indexes
			
			// Mock schema engine to return diff with modified column
			const mockSchemaEngine = migrationApplier['schemaEngine'];
			const modifiedDiff = {
				...complexSchemaDiff,
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [
					{
						fieldname: 'name',
						changes: {
							length: { from: 100, to: 200 },
							required: { from: false, to: true }
						},
						requiresDataMigration: true,
						destructive: false
					}
				]
			};
			mockSchemaEngine.compareSchema = vi.fn().mockResolvedValue(modifiedDiff);
			mockSchemaEngine.hasChanges = vi.fn().mockResolvedValue(true);
			
			// Mock SQL generator to return MODIFY COLUMN statements
			const mockSqlGenerator = migrationApplier['sqlGenerator'];
			mockSqlGenerator.generateMigrationSQL = vi.fn().mockReturnValue({
				forward: [
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` MODIFY COLUMN \`name\` varchar(200) NOT NULL;`,
						type: 'alter_table',
						destructive: false,
						table: testConstants.TEST_TABLE,
						column: 'name'
					}
				],
				rollback: [
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` MODIFY COLUMN \`name\` varchar(100);`,
						type: 'alter_table',
						destructive: false,
						table: testConstants.TEST_TABLE,
						column: 'name'
					}
				],
				warnings: ['Table rebuild required for column modification'],
				destructive: false
			});
			
			// Mock executor to return success
			const mockExecutor = migrationApplier['executor'];
			mockExecutor.executeMigrationSQL = vi.fn().mockResolvedValue({
				success: true,
				warnings: [],
				errors: [],
				affectedRows: 0
			});
			
			// Mock history manager
			const mockHistoryManager = migrationApplier['historyManager'];
			mockHistoryManager.recordMigration = vi.fn().mockResolvedValue(undefined);
			
			const result = await migrationApplier.syncDocType(testConstants.TEST_DOCTYPE);
			
			expect(result.success).toBe(true);
			expect(result.sql).toHaveLength(1);
			expect(result.sql[0]).toContain('MODIFY COLUMN');
			expect(result.sql[0]).toContain('name');
			expect(result.sql[0]).toContain('varchar(200)');
			expect(result.sql[0]).toContain('NOT NULL');
			expect(result.warnings).toContain('Table rebuild required for column modification');
		});
	});

	describe('P2-008-T5: syncDocType adds index', () => {
		it('should create index on specified columns', async () => {
			// Mock database to indicate table exists but missing index
			mockDatabase.sql = vi.fn()
				.mockResolvedValueOnce([
					{ name: 'name', type: 'varchar' },
					{ name: 'email', type: 'varchar' }
				]) // Existing columns
				.mockResolvedValueOnce([{ name: 'idx_name', columns: ['name'] }]); // Existing indexes
			
			// Mock schema engine to return diff with added index
			const mockSchemaEngine = migrationApplier['schemaEngine'];
			const indexDiff = {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [
					{
						name: 'idx_email',
						index: {
							name: 'idx_email',
							columns: ['email'],
							unique: true,
							type: 'btree'
						},
						destructive: false
					}
				],
				removedIndexes: [],
				renamedColumns: []
			};
			mockSchemaEngine.compareSchema = vi.fn().mockResolvedValue(indexDiff);
			mockSchemaEngine.hasChanges = vi.fn().mockResolvedValue(true);
			
			// Mock SQL generator to return CREATE INDEX statement
			const mockSqlGenerator = migrationApplier['sqlGenerator'];
			mockSqlGenerator.generateMigrationSQL = vi.fn().mockReturnValue({
				forward: [
					{
						sql: `CREATE UNIQUE INDEX \`idx_email\` ON \`${testConstants.TEST_TABLE}\` (\`email\`);`,
						type: 'create_index',
						destructive: false,
						table: testConstants.TEST_TABLE
					}
				],
				rollback: [
					{
						sql: `DROP INDEX \`idx_email\`;`,
						type: 'drop_index',
						destructive: false,
						table: testConstants.TEST_TABLE
					}
				],
				warnings: [],
				destructive: false
			});
			
			// Mock executor to return success
			const mockExecutor = migrationApplier['executor'];
			mockExecutor.executeMigrationSQL = vi.fn().mockResolvedValue({
				success: true,
				warnings: [],
				errors: [],
				affectedRows: 0
			});
			
			// Mock history manager
			const mockHistoryManager = migrationApplier['historyManager'];
			mockHistoryManager.recordMigration = vi.fn().mockResolvedValue(undefined);
			
			const result = await migrationApplier.syncDocType(testConstants.TEST_DOCTYPE);
			
			expect(result.success).toBe(true);
			expect(result.sql).toHaveLength(1);
			expect(result.sql[0]).toContain('CREATE UNIQUE INDEX');
			expect(result.sql[0]).toContain('idx_email');
			expect(result.sql[0]).toContain('email');
		});
	});

	describe('P2-008-T6: syncDocType atomic', () => {
		it('should ensure all or nothing on error', async () => {
			// Mock database to indicate table exists
			mockDatabase.sql = vi.fn()
				.mockResolvedValueOnce([
					{ name: 'name', type: 'varchar' },
					{ name: 'email', type: 'varchar' }
				]) // Existing columns
				.mockResolvedValueOnce([]); // No indexes
			
			// Mock schema engine to return diff with multiple changes
			const mockSchemaEngine = migrationApplier['schemaEngine'];
			mockSchemaEngine.compareSchema = vi.fn().mockResolvedValue(complexSchemaDiff);
			mockSchemaEngine.hasChanges = vi.fn().mockResolvedValue(true);
			
			// Mock SQL generator to return multiple statements
			const mockSqlGenerator = migrationApplier['sqlGenerator'];
			mockSqlGenerator.generateMigrationSQL = vi.fn().mockReturnValue({
				forward: [
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` ADD COLUMN \`new_field\` text;`,
						type: 'alter_table',
						destructive: false,
						table: testConstants.TEST_TABLE,
						column: 'new_field'
					},
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` DROP COLUMN \`removed_field\`;`,
						type: 'alter_table',
						destructive: true,
						table: testConstants.TEST_TABLE,
						column: 'removed_field'
					}
				],
				rollback: [
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` DROP COLUMN \`new_field\`;`,
						type: 'alter_table',
						destructive: true,
						table: testConstants.TEST_TABLE,
						column: 'new_field'
					},
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` ADD COLUMN \`removed_field\` varchar(100);`,
						type: 'alter_table',
						destructive: false,
						table: testConstants.TEST_TABLE,
						column: 'removed_field'
					}
				],
				warnings: ['Data loss risk: column removal will delete data'],
				destructive: true
			});
			
			// Mock executor to fail on second statement
			const mockExecutor = migrationApplier['executor'];
			mockExecutor.executeMigrationSQL = vi.fn().mockResolvedValue({
				success: false,
				warnings: [],
				errors: ['Foreign key constraint violation'],
				affectedRows: 0
			});
			
			// Mock history manager (should not be called due to failure)
			const mockHistoryManager = migrationApplier['historyManager'];
			mockHistoryManager.recordMigration = vi.fn().mockResolvedValue(undefined);
			
			const result = await migrationApplier.syncDocType(testConstants.TEST_DOCTYPE);
			
			expect(result.success).toBe(false);
			expect(result.errors).toContain('Foreign key constraint violation');
			expect(result.metadata?.error).toContain('Foreign key constraint violation');
			
			// Verify history was not recorded due to failure
			expect(mockHistoryManager.recordMigration).not.toHaveBeenCalled();
		});
	});

	describe('P2-008-T7: syncAllDocTypes', () => {
		it('should sync all registered DocTypes', async () => {
			// Mock DocType engine to return multiple DocTypes
			mockDocTypeEngine.getAllDocTypes = vi.fn().mockResolvedValue([
				testDocType,
				{
					...testDocType,
					name: 'User'
				}
			]);
			
			// Mock schema engine to return changes for both DocTypes
			const mockSchemaEngine = migrationApplier['schemaEngine'];
			mockSchemaEngine.compareSchema = vi.fn()
				.mockResolvedValueOnce(addColumnsSchemaDiff)
				.mockResolvedValueOnce(removeColumnsSchemaDiff);
			mockSchemaEngine.hasChanges = vi.fn().mockResolvedValue(true);
			
			// Mock SQL generator
			const mockSqlGenerator = migrationApplier['sqlGenerator'];
			mockSqlGenerator.generateMigrationSQL = vi.fn()
				.mockReturnValueOnce({
					forward: [{ sql: 'ALTER TABLE tabTestDocType ADD COLUMN email;', type: 'alter_table' }],
					rollback: [{ sql: 'ALTER TABLE tabTestDocType DROP COLUMN email;', type: 'alter_table' }],
					warnings: [],
					destructive: false
				})
				.mockReturnValueOnce({
					forward: [{ sql: 'ALTER TABLE tabUser DROP COLUMN legacy_field;', type: 'alter_table' }],
					rollback: [{ sql: 'ALTER TABLE tabUser ADD COLUMN legacy_field;', type: 'alter_table' }],
					warnings: ['Data loss risk'],
					destructive: true
				});
			
			// Mock executor to succeed for both
			const mockExecutor = migrationApplier['executor'];
			mockExecutor.executeMigrationSQL = vi.fn()
				.mockResolvedValueOnce({
					success: true,
					warnings: [],
					errors: [],
					affectedRows: 0
				})
				.mockResolvedValueOnce({
					success: true,
					warnings: [],
					errors: [],
					affectedRows: 0
				});
			
			// Mock history manager
			const mockHistoryManager = migrationApplier['historyManager'];
			mockHistoryManager.recordMigration = vi.fn().mockResolvedValue(undefined);
			
			const result = await migrationApplier.syncAllDocTypes();
			
			expect(result.success).toBe(true);
			expect(result.successful).toHaveLength(2);
			expect(result.successful).toContain(testConstants.TEST_DOCTYPE);
			expect(result.successful).toContain('User');
			expect(result.failed).toHaveLength(0);
			expect(result.totalTime).toBeGreaterThan(0);
			
			// Verify executor was called for both DocTypes
			expect(mockExecutor.executeMigrationSQL).toHaveBeenCalledTimes(2);
			
			// Verify history was recorded for both DocTypes
			expect(mockHistoryManager.recordMigration).toHaveBeenCalledTimes(2);
		});
		
		it('should handle mixed success and failure', async () => {
			// Mock DocType engine to return multiple DocTypes
			mockDocTypeEngine.getAllDocTypes = vi.fn().mockResolvedValue([
				testDocType,
				{
					...testDocType,
					name: 'User'
				}
			]);
			
			// Mock schema engine to return changes for both DocTypes
			const mockSchemaEngine = migrationApplier['schemaEngine'];
			mockSchemaEngine.compareSchema = vi.fn()
				.mockResolvedValueOnce(addColumnsSchemaDiff)
				.mockResolvedValueOnce(removeColumnsSchemaDiff);
			mockSchemaEngine.hasChanges = vi.fn().mockResolvedValue(true);
			
			// Mock SQL generator
			const mockSqlGenerator = migrationApplier['sqlGenerator'];
			mockSqlGenerator.generateMigrationSQL = vi.fn()
				.mockReturnValueOnce({
					forward: [{ sql: 'ALTER TABLE tabTestDocType ADD COLUMN email;', type: 'alter_table' }],
					rollback: [{ sql: 'ALTER TABLE tabTestDocType DROP COLUMN email;', type: 'alter_table' }],
					warnings: [],
					destructive: false
				})
				.mockReturnValueOnce({
					forward: [{ sql: 'ALTER TABLE tabUser DROP COLUMN legacy_field;', type: 'alter_table' }],
					rollback: [{ sql: 'ALTER TABLE tabUser ADD COLUMN legacy_field;', type: 'alter_table' }],
					warnings: ['Data loss risk'],
					destructive: true
				});
			
			// Mock executor to succeed for first, fail for second
			const mockExecutor = migrationApplier['executor'];
			mockExecutor.executeMigrationSQL = vi.fn()
				.mockResolvedValueOnce({
					success: true,
					warnings: [],
					errors: [],
					affectedRows: 0
				})
				.mockResolvedValueOnce({
					success: false,
					warnings: [],
					errors: ['Foreign key constraint violation'],
					affectedRows: 0
				});
			
			// Mock history manager
			const mockHistoryManager = migrationApplier['historyManager'];
			mockHistoryManager.recordMigration = vi.fn().mockResolvedValue(undefined);
			
			const result = await migrationApplier.syncAllDocTypes();
			
			expect(result.success).toBe(false);
			expect(result.successful).toHaveLength(1);
			expect(result.successful).toContain(testConstants.TEST_DOCTYPE);
			expect(result.failed).toHaveLength(1);
			expect(result.failed).toContain('User');
			expect(result.errors).toContain('Failed to sync User: Foreign key constraint violation');
		});
	});

	describe('P2-008-T8: dryRun', () => {
		it('should return SQL without executing', async () => {
			// Mock database to indicate table exists
			mockDatabase.sql = vi.fn()
				.mockResolvedValueOnce([
					{ name: 'name', type: 'varchar' }
				]) // Existing columns
				.mockResolvedValueOnce([]); // No indexes
			
			// Mock schema engine to return diff
			const mockSchemaEngine = migrationApplier['schemaEngine'];
			mockSchemaEngine.compareSchema = vi.fn().mockResolvedValue(addColumnsSchemaDiff);
			mockSchemaEngine.hasChanges = vi.fn().mockResolvedValue(true);
			
			// Mock SQL generator
			const mockSqlGenerator = migrationApplier['sqlGenerator'];
			mockSqlGenerator.generateMigrationSQL = vi.fn().mockReturnValue({
				forward: [
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` ADD COLUMN \`email\` varchar(255);`,
						type: 'alter_table',
						destructive: false,
						table: testConstants.TEST_TABLE,
						column: 'email'
					}
				],
				rollback: [
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` DROP COLUMN \`email\`;`,
						type: 'alter_table',
						destructive: true,
						table: testConstants.TEST_TABLE,
						column: 'email'
					}
				],
				warnings: [],
				destructive: false
			});
			
			// Mock executor (should not be called in dry run)
			const mockExecutor = migrationApplier['executor'];
			mockExecutor.executeMigrationSQL = vi.fn().mockResolvedValue({
				success: true,
				warnings: [],
				errors: [],
				affectedRows: 0
			});
			
			// Mock history manager (should not be called in dry run)
			const mockHistoryManager = migrationApplier['historyManager'];
			mockHistoryManager.recordMigration = vi.fn().mockResolvedValue(undefined);
			
			const result = await migrationApplier.syncDocType(testConstants.TEST_DOCTYPE, { dryRun: true });
			
			expect(result.success).toBe(true);
			expect(result.sql).toHaveLength(1);
			expect(result.sql[0]).toContain('ADD COLUMN email');
			expect(result.metadata?.dryRun).toBe(true);
			
			// Verify executor was not called in dry run
			expect(mockExecutor.executeMigrationSQL).not.toHaveBeenCalled();
			
			// Verify history was not recorded in dry run
			expect(mockHistoryManager.recordMigration).not.toHaveBeenCalled();
		});
	});

	describe('P2-008-T9: dryRun returns warnings', () => {
		it('should return warnings for data loss risks', async () => {
			// Mock database to indicate table exists
			mockDatabase.sql = vi.fn()
				.mockResolvedValueOnce([
					{ name: 'name', type: 'varchar' },
					{ name: 'legacy_field', type: 'text' }
				]) // Existing columns
				.mockResolvedValueOnce([]); // No indexes
			
			// Mock schema engine to return diff with destructive changes
			const mockSchemaEngine = migrationApplier['schemaEngine'];
			mockSchemaEngine.compareSchema = vi.fn().mockResolvedValue(removeColumnsSchemaDiff);
			mockSchemaEngine.hasChanges = vi.fn().mockResolvedValue(true);
			
			// Mock SQL generator
			const mockSqlGenerator = migrationApplier['sqlGenerator'];
			mockSqlGenerator.generateMigrationSQL = vi.fn().mockReturnValue({
				forward: [
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` DROP COLUMN \`legacy_field\`;`,
						type: 'alter_table',
						destructive: true,
						table: testConstants.TEST_TABLE,
						column: 'legacy_field'
					}
				],
				rollback: [
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` ADD COLUMN \`legacy_field\` text;`,
						type: 'alter_table',
						destructive: false,
						table: testConstants.TEST_TABLE,
						column: 'legacy_field'
					}
				],
				warnings: ['Data loss risk: column removal will delete data'],
				destructive: true
			});
			
			// Mock validator to return data loss risks
			const mockValidator = migrationApplier['validator'];
			mockValidator.checkDataLossRisks = vi.fn().mockResolvedValue([
				{
					type: 'column_removal',
					severity: 'high',
					target: 'legacy_field column',
					description: 'Removing column \'legacy_field\' will permanently delete all data',
					estimatedAffectedRecords: 1000,
					mitigation: ['Export data before removal', 'Create backup']
				}
			]);
			
			const result = await migrationApplier.syncDocType(testConstants.TEST_DOCTYPE, { dryRun: true });
			
			expect(result.success).toBe(true);
			expect(result.warnings).toContain('Data loss risk: column removal will delete data');
			expect(result.metadata?.dryRun).toBe(true);
			
			// Verify validator was called
			expect(mockValidator.checkDataLossRisks).toHaveBeenCalled();
		});
	});

	describe('P2-008-T10: applyMigration', () => {
		it('should execute migration SQL', async () => {
			const migration = sampleMigrations.addColumn;
			
			// Mock history manager to indicate migration not applied
			const mockHistoryManager = migrationApplier['historyManager'];
			mockHistoryManager.isMigrationApplied = vi.fn().mockResolvedValue(false);
			
			// Mock validator to return valid
			const mockValidator = migrationApplier['validator'];
			mockValidator.validateMigration = vi.fn().mockResolvedValue({
				valid: true,
				errors: [],
				warnings: [],
				recommendations: [],
				score: 100,
				validatedAt: new Date()
			});
			
			// Mock executor to return success
			const mockExecutor = migrationApplier['executor'];
			mockExecutor.executeMigrationSQL = vi.fn().mockResolvedValue({
				success: true,
				warnings: [],
				errors: [],
				affectedRows: 0
			});
			
			// Mock history manager to record migration
			mockHistoryManager.recordMigration = vi.fn().mockResolvedValue(undefined);
			
			const result = await migrationApplier.applyMigration(migration);
			
			expect(result.success).toBe(true);
			expect(result.sql).toEqual(migration.sql);
			
			// Verify executor was called
			expect(mockExecutor.executeMigrationSQL).toHaveBeenCalled();
			
			// Verify history was recorded
			expect(mockHistoryManager.recordMigration).toHaveBeenCalledWith(
				expect.objectContaining({
					id: migration.id,
					doctype: migration.doctype,
					applied: true,
					status: 'applied' as MigrationStatus
				})
			);
		});
	});

	describe('P2-008-T11: applyMigration records history', () => {
		it('should record migration in history after successful execution', async () => {
			const migration = sampleMigrations.addColumn;
			
			// Mock history manager
			const mockHistoryManager = migrationApplier['historyManager'];
			mockHistoryManager.isMigrationApplied = vi.fn().mockResolvedValue(false);
			mockHistoryManager.recordMigration = vi.fn().mockResolvedValue(undefined);
			
			// Mock validator to return valid
			const mockValidator = migrationApplier['validator'];
			mockValidator.validateMigration = vi.fn().mockResolvedValue({
				valid: true,
				errors: [],
				warnings: [],
				recommendations: [],
				score: 100,
				validatedAt: new Date()
			});
			
			// Mock executor to return success
			const mockExecutor = migrationApplier['executor'];
			mockExecutor.executeMigrationSQL = vi.fn().mockResolvedValue({
				success: true,
				warnings: [],
				errors: [],
				affectedRows: 0
			});
			
			await migrationApplier.applyMigration(migration);
			
			// Verify history was recorded with correct details
			expect(mockHistoryManager.recordMigration).toHaveBeenCalledWith(
				expect.objectContaining({
					id: migration.id,
					doctype: migration.doctype,
					sql: migration.sql,
					rollbackSql: migration.rollbackSql,
					applied: true,
					appliedAt: expect.any(Date),
					executionTime: expect.any(Number),
					status: MigrationStatus.APPLIED,
					appliedBy: 'system'
				})
			);
		});
	});

	describe('P2-008-T12: rollbackMigration', () => {
		it('should execute rollback SQL', async () => {
			const appliedMigration = {
				...sampleAppliedMigrations.successful,
				rollbackSql: [
					'ALTER TABLE `tabTestDocType` DROP COLUMN `email`;'
				]
			};
			
			// Mock history manager to return applied migration
			const mockHistoryManager = migrationApplier['historyManager'];
			mockHistoryManager.getMigrationById = vi.fn().mockResolvedValue(appliedMigration);
			
			// Mock validator to return valid rollback
			const mockValidator = migrationApplier['validator'];
			mockValidator.validateRollbackPossibility = vi.fn().mockResolvedValue({
				possible: true,
				blockers: [],
				risks: [],
				recommendations: [],
				difficulty: 'easy'
			});
			
			// Mock executor to return success
			const mockExecutor = migrationApplier['executor'];
			mockExecutor.executeRollbackSQL = vi.fn().mockResolvedValue({
				success: true,
				warnings: [],
				errors: [],
				affectedRows: 0
			});
			
			// Mock history manager to update status
			mockHistoryManager.updateMigrationStatus = vi.fn().mockResolvedValue(undefined);
			
			const result = await migrationApplier.rollbackMigration(appliedMigration.id);
			
			expect(result.success).toBe(true);
			
			// Verify executor was called with rollback SQL
			expect(mockExecutor.executeRollbackSQL).toHaveBeenCalledWith(
				appliedMigration.rollbackSql.map(sql => ({
					sql,
					type: 'custom',
					destructive: true,
					table: appliedMigration.doctype,
					comment: `Rollback migration: ${appliedMigration.id}`
				})),
				expect.any(Object)
			);
			
			// Verify history was updated
			expect(mockHistoryManager.updateMigrationStatus).toHaveBeenCalledWith(
				appliedMigration.id,
				'rolled_back' as MigrationStatus
			);
		});
	});

	describe('P2-008-T13: rollbackMigration updates history', () => {
		it('should update migration history with rollback info', async () => {
			const appliedMigration = {
				...sampleAppliedMigrations.successful,
				rollbackSql: [
					'ALTER TABLE `tabTestDocType` DROP COLUMN `email`;'
				]
			};
			
			// Mock history manager
			const mockHistoryManager = migrationApplier['historyManager'];
			mockHistoryManager.getMigrationById = vi.fn().mockResolvedValue(appliedMigration);
			mockHistoryManager.updateMigrationStatus = vi.fn().mockResolvedValue(undefined);
			
			// Mock validator to return valid rollback
			const mockValidator = migrationApplier['validator'];
			mockValidator.validateRollbackPossibility = vi.fn().mockResolvedValue({
				possible: true,
				blockers: [],
				risks: [],
				recommendations: [],
				difficulty: 'easy'
			});
			
			// Mock executor to return success
			const mockExecutor = migrationApplier['executor'];
			mockExecutor.executeRollbackSQL = vi.fn().mockResolvedValue({
				success: true,
				warnings: [],
				errors: [],
				affectedRows: 0,
				executionTime: 1000
			});
			
			await migrationApplier.rollbackMigration(appliedMigration.id);
			
			// Verify history was updated with rollback info
			expect(mockHistoryManager.updateMigrationStatus).toHaveBeenCalledWith(
				appliedMigration.id,
				MigrationStatus.ROLLED_BACK
			);
		});
	});

	describe('P2-008-T14: getMigrationHistory', () => {
		it('should return past migrations for DocType', async () => {
			// Mock history manager
			const mockHistoryManager = migrationApplier['historyManager'];
			mockHistoryManager.getMigrationHistory = vi.fn().mockResolvedValue({
				migrations: [sampleAppliedMigrations.successful],
				lastMigration: sampleAppliedMigrations.successful,
				pendingMigrations: [],
				failedMigrations: [],
				stats: {
					total: 1,
					applied: 1,
					pending: 0,
					failed: 0,
					destructive: 0,
					lastMigrationDate: sampleAppliedMigrations.successful.appliedAt,
					totalExecutionTime: 1500
				}
			});
			
			const history = await migrationApplier.getMigrationHistory(testConstants.TEST_DOCTYPE);
			
			expect(history.migrations).toHaveLength(1);
			expect(history.migrations[0]).toEqual(sampleAppliedMigrations.successful);
			expect(history.lastMigration).toEqual(sampleAppliedMigrations.successful);
			expect(history.stats.total).toBe(1);
			expect(history.stats.applied).toBe(1);
			
			// Verify history manager was called
			expect(mockHistoryManager.getMigrationHistory).toHaveBeenCalledWith(
				testConstants.TEST_DOCTYPE,
				undefined
			);
		});
	});

	describe('P2-008-T15: getPendingMigrations', () => {
		it('should return unapplied migrations', async () => {
			// Mock history manager
			const mockHistoryManager = migrationApplier['historyManager'];
			mockHistoryManager.getPendingMigrations = vi.fn().mockResolvedValue([
				sampleMigrations.addColumn,
				sampleMigrations.removeColumn
			]);
			
			const pending = await migrationApplier.getPendingMigrations(testConstants.TEST_DOCTYPE);
			
			expect(pending).toHaveLength(2);
			expect(pending[0]).toEqual(sampleMigrations.addColumn);
			expect(pending[1]).toEqual(sampleMigrations.removeColumn);
			
			// Verify history manager was called
			expect(mockHistoryManager.getPendingMigrations).toHaveBeenCalledWith(
				testConstants.TEST_DOCTYPE
			);
		});
	});

	describe('P2-008-T16: Data preservation on column drop', () => {
		it('should create temp backup before dropping column', async () => {
			// Mock database to indicate table exists with column to be dropped
			mockDatabase.sql = vi.fn()
				.mockResolvedValueOnce([
					{ name: 'name', type: 'varchar' },
					{ name: 'legacy_field', type: 'text' }
				]) // Existing columns
				.mockResolvedValueOnce([]); // No indexes
			
			// Mock schema engine to return diff with removed column
			const mockSchemaEngine = migrationApplier['schemaEngine'];
			mockSchemaEngine.compareSchema = vi.fn().mockResolvedValue(removeColumnsSchemaDiff);
			mockSchemaEngine.hasChanges = vi.fn().mockResolvedValue(true);
			
			// Mock SQL generator
			const mockSqlGenerator = migrationApplier['sqlGenerator'];
			mockSqlGenerator.generateMigrationSQL = vi.fn().mockReturnValue({
				forward: [
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` DROP COLUMN \`legacy_field\`;`,
						type: 'alter_table',
						destructive: true,
						table: testConstants.TEST_TABLE,
						column: 'legacy_field'
					}
				],
				rollback: [
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` ADD COLUMN \`legacy_field\` text;`,
						type: 'alter_table',
						destructive: false,
						table: testConstants.TEST_TABLE,
						column: 'legacy_field'
					}
				],
				warnings: ['Data loss risk: column removal will delete data'],
				destructive: true
			});
			
			// Mock backup manager
			const mockBackupManager = migrationApplier['backupManager'];
			mockBackupManager.createBackup = vi.fn().mockResolvedValue('/tmp/backup.sql');
			
			// Mock executor to return success
			const mockExecutor = migrationApplier['executor'];
			mockExecutor.executeMigrationSQL = vi.fn().mockResolvedValue({
				success: true,
				warnings: [],
				errors: [],
				affectedRows: 0
			});
			
			// Mock history manager
			const mockHistoryManager = migrationApplier['historyManager'];
			mockHistoryManager.recordMigration = vi.fn().mockResolvedValue(undefined);
			
			await migrationApplier.syncDocType(testConstants.TEST_DOCTYPE, { preserveData: true });
			
			// Verify backup was created
			expect(mockBackupManager.createBackup).toHaveBeenCalledWith(
				testConstants.TEST_DOCTYPE,
				'FULL'
			);
		});
	});

	describe('P2-008-T17: Data conversion on type change', () => {
		it('should convert data when changing column type', async () => {
			// Mock database to indicate table exists with old column type
			mockDatabase.sql = vi.fn()
				.mockResolvedValueOnce([
					{ name: 'name', type: 'varchar', length: 100 },
					{ name: 'age', type: 'integer' }
				]) // Existing columns
				.mockResolvedValueOnce([]); // No indexes
			
			// Mock schema engine to return diff with type change
			const mockSchemaEngine = migrationApplier['schemaEngine'];
			const typeChangeDiff = {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [
					{
						fieldname: 'age',
						changes: {
							type: { from: 'integer', to: 'varchar' }
						},
						requiresDataMigration: true,
						destructive: false
					}
				],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			};
			mockSchemaEngine.compareSchema = vi.fn().mockResolvedValue(typeChangeDiff);
			mockSchemaEngine.hasChanges = vi.fn().mockResolvedValue(true);
			
			// Mock SQL generator to return type conversion statements
			const mockSqlGenerator = migrationApplier['sqlGenerator'];
			mockSqlGenerator.generateMigrationSQL = vi.fn().mockReturnValue({
				forward: [
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` MODIFY COLUMN \`age\` varchar(10);`,
						type: 'alter_table',
						destructive: false,
						table: testConstants.TEST_TABLE,
						column: 'age'
					}
				],
				rollback: [
					{
						sql: `ALTER TABLE \`${testConstants.TEST_TABLE}\` MODIFY COLUMN \`age\` integer;`,
						type: 'alter_table',
						destructive: false,
						table: testConstants.TEST_TABLE,
						column: 'age'
					}
				],
				warnings: ['Data conversion required for type change'],
				destructive: false
			});
			
			// Mock executor to return success
			const mockExecutor = migrationApplier['executor'];
			mockExecutor.executeMigrationSQL = vi.fn().mockResolvedValue({
				success: true,
				warnings: [],
				errors: [],
				affectedRows: 100
			});
			
			// Mock history manager
			const mockHistoryManager = migrationApplier['historyManager'];
			mockHistoryManager.recordMigration = vi.fn().mockResolvedValue(undefined);
			
			const result = await migrationApplier.syncDocType(testConstants.TEST_DOCTYPE);
			
			expect(result.success).toBe(true);
			expect(result.affectedRows).toBe(100);
			expect(result.warnings).toContain('Data conversion required for type change');
		});
	});
});