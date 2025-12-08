/**
 * Migration History Manager Tests
 * 
 * This file contains tests for MigrationHistoryManager class, which is responsible
 * for tracking migration execution history in the database.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MigrationHistoryManager } from '../history/history-manager';
import type { Database } from '../../../core/database/database';
import type { AppliedMigration, MigrationHistory, MigrationStats } from '../apply-types';
import { MigrationStatus } from '../apply-types';
import { sampleAppliedMigrations, sampleMigrationHistory } from './fixtures/apply-fixtures';
import { testConstants } from './fixtures/test-data';

// Mock database implementation
const mockDatabase = {
	run: vi.fn().mockResolvedValue({ changes: 1 }),
	sql: vi.fn().mockResolvedValue([]),
	begin: vi.fn().mockResolvedValue({ id: 'tx_123' }),
	commit: vi.fn().mockResolvedValue(undefined),
	rollback: vi.fn().mockResolvedValue(undefined),
	withTransaction: vi.fn().mockImplementation((fn) => fn({ id: 'tx_123' }))
} as unknown as Database;

describe('MigrationHistoryManager', () => {
	let historyManager: MigrationHistoryManager;
	
	beforeEach(() => {
		historyManager = new MigrationHistoryManager(mockDatabase);
		vi.clearAllMocks();
	});
	
	

	describe('initializeHistoryTable', () => {
		it('should create migration history table if not exists', async () => {
			await historyManager.initializeHistoryTable();
			
			expect(mockDatabase.run).toHaveBeenCalledWith(
				expect.stringContaining('CREATE TABLE IF NOT EXISTS tabMigrationHistory')
			);
			
			// Should create indexes
			expect(mockDatabase.run).toHaveBeenCalledWith(
				expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_migration_doctype')
			);
			expect(mockDatabase.run).toHaveBeenCalledWith(
				expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_migration_status')
			);
			expect(mockDatabase.run).toHaveBeenCalledWith(
				expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_migration_timestamp')
			);
		});
		
		it('should not recreate table if already initialized', async () => {
			// Initialize once
			await historyManager.initializeHistoryTable();
			vi.clearAllMocks();
			
			// Initialize again
			await historyManager.initializeHistoryTable();
			
			// Should not call database.run again
			expect(mockDatabase.run).not.toHaveBeenCalled();
		});
	});

	describe('recordMigration', () => {
		it('should record migration in history table', async () => {
			const migration = sampleAppliedMigrations.successful;
			
			await historyManager.recordMigration(migration);
			
			expect(mockDatabase.run).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO tabMigrationHistory'),
				expect.arrayContaining([
					migration.id,
					migration.doctype,
					migration.version,
					migration.timestamp.toISOString(),
					JSON.stringify(migration.sql),
					JSON.stringify(migration.rollbackSql),
					migration.status,
					migration.appliedBy,
					migration.executionTime,
					migration.affectedRows || null,
					migration.backupPath || null,
					migration.error || null,
					migration.rollbackInfo 
						? JSON.stringify(migration.rollbackInfo) 
						: null,
					migration.environment 
						? JSON.stringify(migration.environment) 
						: null,
					JSON.stringify(migration.metadata || {})
				])
			);
		});
		
		it('should initialize table before recording', async () => {
			const migration = sampleAppliedMigrations.successful;
			
			await historyManager.recordMigration(migration);
			
			// Should have initialized table first
			expect(mockDatabase.run).toHaveBeenCalledWith(
				expect.stringContaining('CREATE TABLE IF NOT EXISTS tabMigrationHistory')
			);
		});
	});

	describe('updateMigrationStatus', () => {
		it('should update migration status in history table', async () => {
			const migrationId = 'test_migration_123';
			const status = MigrationStatus.FAILED;
			const error = 'Foreign key constraint violation';
			
			await historyManager.updateMigrationStatus(migrationId, status, error);
			
			expect(mockDatabase.run).toHaveBeenCalledWith(
				expect.stringContaining('UPDATE tabMigrationHistory SET status = ?, error = ? WHERE id = ?'),
				[status, error || null, migrationId]
			);
		});
	});

	describe('getMigrationHistory', () => {
		it('should return migration history for specific DocType', async () => {
			const mockRows = [
				{
					id: 'migration_1',
					doctype: testConstants.TEST_DOCTYPE,
					version: '1.0.0',
					timestamp: '2023-12-01T10:00:00Z',
					sql: '["ALTER TABLE ADD COLUMN email"]',
					rollback_sql: '["ALTER TABLE DROP COLUMN email"]',
					status: 'applied',
					applied_by: 'test_user',
					execution_time: 1500,
					affected_rows: 0,
					backup_path: null,
					error: null,
					rollback_info: null,
					environment: '{"databaseVersion": "SQLite 3.40.0"}',
					metadata: '{"destructive": false}'
				}
			];
			
			mockDatabase.sql = vi.fn().mockResolvedValue(mockRows);
			
			const history = await historyManager.getMigrationHistory(testConstants.TEST_DOCTYPE);
			
			expect(mockDatabase.sql).toHaveBeenCalledWith(
				expect.stringContaining('SELECT * FROM tabMigrationHistory WHERE doctype = ? ORDER BY timestamp DESC'),
				[testConstants.TEST_DOCTYPE]
			);
			
			expect(history.migrations).toHaveLength(1);
			expect(history.migrations[0].id).toBe('migration_1');
			expect(history.migrations[0].doctype).toBe(testConstants.TEST_DOCTYPE);
			expect(history.migrations[0].status).toBe(MigrationStatus.APPLIED);
			expect(history.stats.total).toBe(1);
			expect(history.stats.applied).toBe(1);
		});
		
		it('should return all migration history when no DocType specified', async () => {
			const mockRows = [
				{
					id: 'migration_1',
					doctype: testConstants.TEST_DOCTYPE,
					status: 'applied'
				},
				{
					id: 'migration_2',
					doctype: 'User',
					status: 'applied'
				}
			];
			
			mockDatabase.sql = vi.fn().mockResolvedValue(mockRows);
			
			const history = await historyManager.getMigrationHistory();
			
			expect(mockDatabase.sql).toHaveBeenCalledWith(
				expect.stringContaining('SELECT * FROM tabMigrationHistory ORDER BY timestamp DESC'),
				[]
			);
			
			expect(history.migrations).toHaveLength(2);
		});
		
		it('should limit results when limit specified', async () => {
			mockDatabase.sql = vi.fn().mockResolvedValue([]);
			
			await historyManager.getMigrationHistory(undefined, 10);
			
			expect(mockDatabase.sql).toHaveBeenCalledWith(
				expect.stringContaining('SELECT * FROM tabMigrationHistory ORDER BY timestamp DESC LIMIT ?'),
				[10]
			);
		});
	});

	describe('getMigrationById', () => {
		it('should return specific migration by ID', async () => {
			const migrationId = 'test_migration_123';
			const mockRow = {
				id: migrationId,
				doctype: testConstants.TEST_DOCTYPE,
				status: 'applied'
			};
			
			mockDatabase.sql = vi.fn().mockResolvedValue([mockRow]);
			
			const migration = await historyManager.getMigrationById(migrationId);
			
			expect(mockDatabase.sql).toHaveBeenCalledWith(
				expect.stringContaining('SELECT * FROM tabMigrationHistory WHERE id = ? ORDER BY timestamp DESC LIMIT 1'),
				[migrationId]
			);
			
			expect(migration).not.toBeNull();
			expect(migration?.id).toBe(migrationId);
		});
		
		it('should return null when migration not found', async () => {
			const migrationId = 'nonexistent_migration';
			
			mockDatabase.sql = vi.fn().mockResolvedValue([]);
			
			const migration = await historyManager.getMigrationById(migrationId);
			
			expect(migration).toBeNull();
		});
	});

	describe('getLatestMigration', () => {
		it('should return latest applied migration for DocType', async () => {
			const mockRow = {
				id: 'latest_migration',
				doctype: testConstants.TEST_DOCTYPE,
				status: 'applied'
			};
			
			mockDatabase.sql = vi.fn().mockResolvedValue([mockRow]);
			
			const migration = await historyManager.getLatestMigration(testConstants.TEST_DOCTYPE);
			
			expect(mockDatabase.sql).toHaveBeenCalledWith(
				expect.stringContaining('SELECT * FROM tabMigrationHistory WHERE doctype = ? AND status = ? ORDER BY timestamp DESC LIMIT 1'),
				[testConstants.TEST_DOCTYPE, MigrationStatus.APPLIED]
			);
			
			expect(migration).not.toBeNull();
			expect(migration?.id).toBe('latest_migration');
		});
		
		it('should return null when no applied migration found', async () => {
			mockDatabase.sql = vi.fn().mockResolvedValue([]);
			
			const migration = await historyManager.getLatestMigration(testConstants.TEST_DOCTYPE);
			
			expect(migration).toBeNull();
		});
	});

	describe('isMigrationApplied', () => {
		it('should return true when migration is applied', async () => {
			const migrationId = 'applied_migration';
			
			mockDatabase.sql = vi.fn().mockResolvedValue([{ count: 1 }]);
			
			const isApplied = await historyManager.isMigrationApplied(migrationId);
			
			expect(mockDatabase.sql).toHaveBeenCalledWith(
				expect.stringContaining('SELECT COUNT(*) as count FROM tabMigrationHistory WHERE id = ? AND status = ?'),
				[migrationId, MigrationStatus.APPLIED]
			);
			
			expect(isApplied).toBe(true);
		});
		
		it('should return false when migration is not applied', async () => {
			const migrationId = 'pending_migration';
			
			mockDatabase.sql = vi.fn().mockResolvedValue([{ count: 0 }]);
			
			const isApplied = await historyManager.isMigrationApplied(migrationId);
			
			expect(isApplied).toBe(false);
		});
	});

	describe('clearHistory', () => {
		it('should clear history for specific DocType', async () => {
			await historyManager.clearHistory(testConstants.TEST_DOCTYPE);
			
			expect(mockDatabase.run).toHaveBeenCalledWith(
				'DELETE FROM tabMigrationHistory WHERE doctype = ?',
				[testConstants.TEST_DOCTYPE]
			);
		});
		
		it('should clear all history when no DocType specified', async () => {
			await historyManager.clearHistory();
			
			expect(mockDatabase.run).toHaveBeenCalledWith(
				'DELETE FROM tabMigrationHistory',
				[]
			);
		});
	});

	describe('getMigrationStats', () => {
		it('should return migration statistics for specific DocType', async () => {
			const mockRow = {
				total: 10,
				applied: 8,
				failed: 1,
				rolled_back: 1,
				total_execution_time: 15000,
				last_migration_date: '2023-12-01T10:00:00Z'
			};
			
			// Mock main stats query
			mockDatabase.sql = vi.fn()
				.mockResolvedValueOnce([mockRow]) // Stats query
				.mockResolvedValueOnce([{ count: 2 }]); // Destructive count query
			
			const stats = await historyManager.getMigrationStats(testConstants.TEST_DOCTYPE);
			
			expect(mockDatabase.sql).toHaveBeenCalledWith(
				expect.stringContaining('SELECT COUNT(*) as total, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as applied'),
				expect.arrayContaining([MigrationStatus.APPLIED, MigrationStatus.FAILED, MigrationStatus.ROLLED_BACK, testConstants.TEST_DOCTYPE])
			);
			
			expect(stats.total).toBe(10);
			expect(stats.applied).toBe(8);
			expect(stats.failed).toBe(1);
			expect(stats.pending).toBe(1); // 10 - 8 - 1 - 1
			expect(stats.destructive).toBe(2);
			expect(stats.lastMigrationDate).toEqual(new Date('2023-12-01T10:00:00Z'));
			expect(stats.totalExecutionTime).toBe(15000);
		});
		
		it('should return overall statistics when no DocType specified', async () => {
			const mockRow = {
				total: 20,
				applied: 16,
				failed: 2,
				rolled_back: 2,
				total_execution_time: 30000,
				last_migration_date: '2023-12-01T10:00:00Z'
			};
			
			// Mock main stats query
			mockDatabase.sql = vi.fn()
				.mockResolvedValueOnce([mockRow]) // Stats query
				.mockResolvedValueOnce([{ count: 4 }]); // Destructive count query
			
			const stats = await historyManager.getMigrationStats();
			
			expect(mockDatabase.sql).toHaveBeenCalledWith(
				expect.stringContaining('SELECT COUNT(*) as total, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as applied'),
				expect.arrayContaining([MigrationStatus.APPLIED, MigrationStatus.FAILED, MigrationStatus.ROLLED_BACK])
			);
			
			expect(stats.total).toBe(20);
			expect(stats.applied).toBe(16);
			expect(stats.failed).toBe(2);
			expect(stats.pending).toBe(2); // 20 - 16 - 2 - 2
			expect(stats.destructive).toBe(4);
		});
	});
});