/**
 * Migration Backup Manager Tests
 * 
 * This file contains tests for MigrationBackupManager class, which is responsible
 * for creating and managing backups for destructive migration operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MigrationBackupManager } from '../backup/backup-manager';
import type { Database } from '../../../core/database/database';
import type { BackupInfo, RestoreResult } from '../apply-types';
import { BackupType } from '../apply-types';
import { sampleBackupInfo } from './fixtures/apply-fixtures';
import { testConstants } from './fixtures/test-data';
import { sampleColumnInfo } from './fixtures/test-data';
// Mock fs module
vi.mock('fs/promises', () => ({
	readFile: vi.fn(),
	writeFile: vi.fn(),
	access: vi.fn(),
	stat: vi.fn(),
	readdir: vi.fn(),
	unlink: vi.fn(),
	mkdir: vi.fn()
}));
import * as fs from 'fs/promises';
const mockFs = vi.mocked(fs);

// Mock path module
vi.mock('path', () => ({
	join: vi.fn((...args) => args.join('/')),
	resolve: vi.fn((...args) => args.join('/')),
	dirname: vi.fn(() => '/diir/name'),
	basename: vi.fn(() => 'base.name')
}));
import * as path from 'path';
const mockPath = vi.mocked(path);

// Mock crypto module
vi.mock('crypto', () => ({
	createHash: vi.fn().mockReturnValue({
		update: vi.fn().mockReturnThis(),
		digest: vi.fn().mockReturnValue('test_checksum')
	})
}));
import * as crypto from 'crypto';
const mockCrypto = vi.mocked(crypto);

// Mock database type
let mockDatabase: Database;

describe.sequential('MigrationBackupManager', () => {
	let backupManager: MigrationBackupManager;
	const testBackupDir = './test_backups';

	beforeEach(() => {
		vi.clearAllMocks();

		// Setup fresh mock database
		mockDatabase = {
			get_table_info: vi.fn().mockResolvedValue({
				columns: Object.values(sampleColumnInfo),
				indexes: [],
				foreign_keys: []
			}),
			sql: vi.fn().mockResolvedValue([
				{ name: 'test', email: 'test@example.com' },
				{ name: 'user2', email: 'user2@example.com' }
			]),
			run: vi.fn().mockResolvedValue({ changes: 1 }),
			withTransaction: vi.fn().mockImplementation((fn) => fn({ id: 'tx_123' }))
		} as unknown as Database;

		// Reset readFile mock state explicitly
		vi.mocked(fs.readFile).mockRejectedValue(new Error('Unexpected readFile call in test'));

		backupManager = new MigrationBackupManager(mockDatabase, {
			storagePath: testBackupDir,
			compression: 'none',
			retentionDays: 7,
			encrypt: false,
			verifyIntegrity: false
		});

		// Setup default mocks
		// Setup default mocks
		vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
		vi.mocked(fs.writeFile).mockResolvedValue(undefined);
		vi.mocked(fs.access).mockResolvedValue(undefined); // Default to file exists
		vi.mocked(fs.stat).mockResolvedValue({ size: 1024 } as any);
		vi.mocked(crypto.createHash).mockReturnValue({
			update: vi.fn().mockReturnThis(),
			digest: vi.fn().mockReturnValue('test_checksum')
		} as any);
	});

	afterEach(() => {
		backupManager = null as any;
		// vi.restoreAllMocks(); // Removed to prevent un-mocking modules
	});

	describe('createBackup', () => {
		it('should create full backup with table structure and data', async () => {
			const backupPath = await backupManager.createBackup(testConstants.TEST_DOCTYPE, BackupType.FULL);

			// Verify database was queried for table info
			expect(mockDatabase.get_table_info).toHaveBeenCalledWith(testConstants.TEST_DOCTYPE);

			// Verify database was queried for data
			expect(mockDatabase.sql).toHaveBeenCalledWith(
				expect.stringContaining(`SELECT * FROM ${testConstants.TEST_DOCTYPE}`)
			);

			// Verify backup file was created
			expect(mockFs.writeFile).toHaveBeenCalled();

			// Verify backup path format
			expect(mockPath.join).toHaveBeenCalledWith(
				testBackupDir,
				expect.stringContaining(`${testConstants.TEST_DOCTYPE}_`)
			);

			// Verify backup contains structure and data
			const writeCall = mockFs.writeFile.mock.calls.find((call: any[]) => {
				const content = JSON.parse(call[1] as string);
				return content.data.type === BackupType.FULL;
			});
			if (!writeCall) {
				console.log('DEBUG: Available calls:', mockFs.writeFile.mock.calls.map((c: any[]) => JSON.parse(c[1]).data.type));
				throw new Error('Full backup write call not found');
			}
			const backupContent = JSON.parse(writeCall[1] as string);
			expect(backupContent.data.type).toBe(BackupType.FULL);
			expect(backupContent.data.table).toBe(testConstants.TEST_DOCTYPE);
			expect(backupContent.data.structure).toBeDefined();
			expect(backupContent.data.records).toBeDefined();
			expect(backupContent.data.records).toHaveLength(2);
		});

		it('should create column backup for specific column', async () => {
			const columnName = 'email';
			const backupPath = await backupManager.createColumnBackup(testConstants.TEST_DOCTYPE, columnName);

			// Verify database was queried for table info
			expect(mockDatabase.get_table_info).toHaveBeenCalledWith(testConstants.TEST_DOCTYPE);

			// Verify database was queried for column data
			expect(mockDatabase.sql).toHaveBeenCalledWith(
				expect.stringContaining(`SELECT name, ${columnName} FROM ${testConstants.TEST_DOCTYPE}`)
			);

			// Verify backup contains column-specific data
			const writeCall = mockFs.writeFile.mock.calls[0];
			const backupContent = JSON.parse(writeCall[1] as string);
			expect(backupContent.data.type).toBe(BackupType.COLUMN);
			expect(backupContent.data.column).toBe(columnName);
			expect(backupContent.data.records).toHaveLength(2);
		});

		it('should throw error when column not found', async () => {
			const columnName = 'nonexistent_column';

			// Mock database to return columns without the target column
			mockDatabase.get_table_info = vi.fn().mockResolvedValue({
				columns: [
					{ name: 'name', type: 'varchar' },
					{ name: 'email', type: 'varchar' }
				],
				indexes: [],
				foreign_keys: []
			});

			await expect(
				backupManager.createColumnBackup(testConstants.TEST_DOCTYPE, columnName)
			).rejects.toThrow(`Column '${columnName}' not found in table '${testConstants.TEST_DOCTYPE}'`);
		});

		it('should create schema-only backup', async () => {
			const backupPath = await backupManager.createBackup(testConstants.TEST_DOCTYPE, BackupType.SCHEMA);

			// Verify backup contains only structure
			const writeCall = mockFs.writeFile.mock.calls.find((call: any[]) => {
				const content = JSON.parse(call[1] as string);
				return content.data.type === BackupType.SCHEMA;
			});
			if (!writeCall) {
				throw new Error('Schema backup write call not found');
			}
			const backupContent = JSON.parse(writeCall[1] as string);
			expect(backupContent.data.type).toBe(BackupType.SCHEMA);
			expect(backupContent.data.structure).toBeDefined();
			expect(backupContent.data.records).toBeUndefined();
		});
	});

	describe('restoreFromBackup', () => {
		it('should restore data from full backup', async () => {
			const backupPath = '/tmp/test_backup.json';
			const backupData = {
				info: sampleBackupInfo.full,
				data: {
					type: BackupType.FULL,
					table: testConstants.TEST_DOCTYPE,
					structure: {
						columns: Object.values(sampleColumnInfo),
						indexes: [],
						foreign_keys: []
					},
					records: [
						{ name: 'test', email: 'test@example.com' },
						{ name: 'user2', email: 'user2@example.com' }
					]
				}
			};

			// Mock file reading
			vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(backupData));

			// Mock database operations
			mockDatabase.run = vi.fn().mockResolvedValue({ changes: 2 });
			mockDatabase.withTransaction = vi.fn().mockImplementation(async (fn) => {
				return await fn({ id: 'tx_123' });
			});

			const result = await backupManager.restoreFromBackup(backupPath);

			expect(result.success).toBe(true);
			expect(result.recordCount).toBe(2);
			expect(result.validated).toBe(false); // Verification disabled in mock

			// Verify table was dropped and recreated
			expect(mockDatabase.run).toHaveBeenCalledWith(
				expect.stringContaining('DROP TABLE IF EXISTS')
			);

			// Verify data was restored
			expect(mockDatabase.withTransaction).toHaveBeenCalled();
		});

		it('should restore column from column backup', async () => {
			const backupPath = '/tmp/column_backup.json';
			const backupData = {
				info: sampleBackupInfo.column,
				data: {
					type: BackupType.COLUMN,
					table: testConstants.TEST_DOCTYPE,
					column: 'email',
					records: [
						{ name: 'test', email: 'test@example.com' },
						{ name: 'user2', email: 'user2@example.com' }
					]
				}
			};

			// Mock file reading
			vi.mocked(fs.readFile).mockImplementation((filePath: any) => {
				// Check for matching path, ignoring root/drive differences
				if (filePath.replace(/\\/g, '/').includes('/tmp/column_backup.json')) {
					return Promise.resolve(JSON.stringify(backupData));
				}
				throw new Error('Unexpected file path: ' + filePath);
			});

			// Mock database operations
			mockDatabase.run = vi.fn().mockResolvedValue({ changes: 2 });

			const result = await backupManager.restoreFromBackup(backupPath);

			expect(result.success).toBe(true);
			expect(result.recordCount).toBe(2);
		});

		it('should fail when backup file does not exist', async () => {
			const backupPath = '/tmp/nonexistent_backup.json';

			// Mock file access error
			vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

			const result = await backupManager.restoreFromBackup(backupPath);

			expect(result.success).toBe(false);
			expect(result.errors).toContain('Restore failed: File not found');
		});

		it('should fail when backup integrity check fails', async () => {
			const backupPath = '/tmp/corrupt_backup.json';
			const backupData = { info: {}, data: {} };

			// Mock file reading
			vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(backupData));
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Create backup manager with integrity verification enabled
			const verifyingBackupManager = new MigrationBackupManager(mockDatabase, {
				storagePath: testBackupDir,
				verifyIntegrity: true
			});

			const result = await verifyingBackupManager.restoreFromBackup(backupPath);

			expect(result.success).toBe(false);
			expect(result.errors).toContain('Backup integrity check failed: checksum mismatch');
		});
	});

	describe('listBackups', () => {
		it('should list all backups', async () => {
			const backupFiles = [
				'test_backup_1.json',
				'test_backup_2.json',
				'other_file.txt'
			];

			// Mock directory listing
			vi.mocked(fs.readdir).mockResolvedValue(backupFiles as any);

			// Mock file reading
			vi.mocked(fs.readFile).mockImplementation((filePath: any) => {
				// console.error('DEBUG: Mock readFile called for:', filePath);
				if (filePath.includes('other_file')) return Promise.resolve('invalid json');
				if (filePath.includes('test_backup_2')) return Promise.resolve(JSON.stringify({ info: sampleBackupInfo.column }));
				return Promise.resolve(JSON.stringify({ info: sampleBackupInfo.full }));
			});

			const backups = await backupManager.listBackups();

			expect(backups).toHaveLength(2); // Only valid JSON files
			// Sort is descending by createdAt. Column is 2023-12-02, Full is 2023-12-01.
			expect(backups[0]).toEqual(sampleBackupInfo.column);
			expect(backups[1]).toEqual(sampleBackupInfo.full);

			// Verify directory was listed
			expect(mockFs.readdir).toHaveBeenCalledWith(testBackupDir);
		});

		it('should filter backups by DocType', async () => {
			const backupFiles = [
				'TestDocType_backup_1.json',
				'User_backup_1.json',
				'TestDocType_backup_2.json'
			];

			// Mock directory listing
			vi.mocked(fs.readdir).mockResolvedValue(backupFiles as any);

			// Mock file reading
			// Mock file reading
			vi.mocked(fs.readFile).mockImplementation((filePath: any) => {
				if (filePath.includes('User')) return Promise.resolve(JSON.stringify({
					info: { ...sampleBackupInfo.column, doctype: 'User' }
				}));
				return Promise.resolve(JSON.stringify({
					info: { ...sampleBackupInfo.full, doctype: testConstants.TEST_DOCTYPE }
				}));
			});

			const backups = await backupManager.listBackups(testConstants.TEST_DOCTYPE);

			expect(backups).toHaveLength(2); // Only TestDocType backups
			expect(backups[0].doctype).toBe(testConstants.TEST_DOCTYPE);
			expect(backups[1].doctype).toBe(testConstants.TEST_DOCTYPE);
		});
	});

	describe('cleanupOldBackups', () => {
		it('should delete backups older than retention period', async () => {
			const oldDate = new Date();
			oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

			const recentDate = new Date();
			recentDate.setDate(recentDate.getDate() - 3); // 3 days ago

			const backupFiles = [
				{ ...sampleBackupInfo.full, createdAt: oldDate, path: '/tmp/old_backup.json' },
				{ ...sampleBackupInfo.column, createdAt: recentDate, path: '/tmp/recent_backup.json' }
			];

			// Mock listBackups
			vi.spyOn(backupManager, 'listBackups').mockResolvedValue(backupFiles as any);

			// Mock file deletion
			vi.mocked(fs.unlink).mockResolvedValue(undefined);

			await backupManager.cleanupOldBackups();

			// Verify only old backup was deleted
			expect(mockFs.unlink).toHaveBeenCalledWith('/tmp/old_backup.json');
			expect(mockFs.unlink).not.toHaveBeenCalledWith('/tmp/recent_backup.json');
		});

		it('should use custom retention period when provided', async () => {
			const customRetentionDays = 5;
			const oldDate = new Date();
			oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

			const backupFiles = [
				{ ...sampleBackupInfo.full, createdAt: oldDate, path: '/tmp/old_backup.json' }
			];

			// Mock listBackups
			vi.spyOn(backupManager, 'listBackups').mockResolvedValue(backupFiles as any);

			// Mock file deletion
			vi.mocked(fs.unlink).mockResolvedValue(undefined);

			await backupManager.cleanupOldBackups(customRetentionDays);

			// Verify old backup was deleted (10 days > 5 days retention)
			expect(mockFs.unlink).toHaveBeenCalledWith('/tmp/old_backup.json');
		});
	});
});