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
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

// Mock database implementation
const mockDatabase = {
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

// Mock fs module
vi.mock('fs/promises');
const mockFs = vi.mocked(fs);

// Mock path module
vi.mock('path');
const mockPath = vi.mocked(path);

// Mock crypto module
vi.mock('crypto');
const mockCrypto = vi.mocked(crypto);

describe('MigrationBackupManager', () => {
	let backupManager: MigrationBackupManager;
	const testBackupDir = './test_backups';
	
	beforeEach(() => {
		backupManager = new MigrationBackupManager(mockDatabase, {
			storagePath: testBackupDir,
			compression: 'none',
			retentionDays: 7,
			encrypt: false,
			verifyIntegrity: false
		});
		vi.clearAllMocks();
		
		// Setup default mocks
		mockPath.join = vi.fn((...args) => args.join('/'));
		mockFs.writeFile = vi.fn().mockResolvedValue(undefined);
		mockFs.stat = vi.fn().mockResolvedValue({ size: 1024 } as any);
		mockCrypto.createHash = vi.fn().mockReturnValue({
			update: vi.fn().mockReturnThis(),
			digest: vi.fn().mockReturnValue('test_checksum')
		} as any);
	});
	
	afterEach(() => {
		backupManager = null as any;
		vi.restoreAllMocks();
	});

	describe('createBackup', () => {
		it('should create full backup with table structure and data', async () => {
			const backupPath = await backupManager.createBackup(testConstants.TEST_DOCTYPE, 'FULL' as BackupType);
			
			// Verify database was queried for table info
			expect(mockDatabase.get_table_info).toHaveBeenCalledWith(testConstants.TEST_DOCTYPE);
			
			// Verify database was queried for data
			expect(mockDatabase.sql).toHaveBeenCalledWith(
				expect.stringContaining('SELECT * FROM'),
				[testConstants.TEST_DOCTYPE]
			);
			
			// Verify backup file was created
			expect(mockFs.writeFile).toHaveBeenCalled();
			
			// Verify backup path format
			expect(mockPath.join).toHaveBeenCalledWith(
				testBackupDir,
				expect.stringContaining(`${testConstants.TEST_DOCTYPE}_`)
			);
			
			// Verify backup contains structure and data
			const writeCall = mockFs.writeFile.mock.calls[0];
			const backupContent = JSON.parse(writeCall[1] as string);
			expect(backupContent.data.type).toBe('FULL');
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
				expect.stringContaining(`SELECT name, ${columnName} FROM`),
				[testConstants.TEST_DOCTYPE]
			);
			
			// Verify backup contains column-specific data
			const writeCall = mockFs.writeFile.mock.calls[0];
			const backupContent = JSON.parse(writeCall[1] as string);
			expect(backupContent.data.type).toBe('COLUMN');
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
			const backupPath = await backupManager.createBackup(testConstants.TEST_DOCTYPE, 'SCHEMA' as BackupType);
			
			// Verify backup contains only structure
			const writeCall = mockFs.writeFile.mock.calls[0];
			const backupContent = JSON.parse(writeCall[1] as string);
			expect(backupContent.data.type).toBe('SCHEMA');
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
					type: 'FULL',
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
			mockFs.readFile = vi.fn().mockResolvedValue(JSON.stringify(backupData));
			
			// Mock database operations
			mockDatabase.run = vi.fn().mockResolvedValue({ changes: 2 });
			mockDatabase.withTransaction = vi.fn().mockImplementation(async (fn) => {
				await fn({ id: 'tx_123' });
				return { changes: 2 };
			});
			
			const result = await backupManager.restoreFromBackup(backupPath);
			
			expect(result.success).toBe(true);
			expect(result.recordCount).toBe(2);
			expect(result.validated).toBe(false); // Verification disabled in mock
			
			// Verify table was dropped and recreated
			expect(mockDatabase.run).toHaveBeenCalledWith(
				expect.stringContaining('DROP TABLE IF EXISTS'),
				[testConstants.TEST_DOCTYPE]
			);
			
			// Verify data was restored
			expect(mockDatabase.withTransaction).toHaveBeenCalled();
		});
		
		it('should restore column from column backup', async () => {
			const backupPath = '/tmp/column_backup.json';
			const backupData = {
				info: sampleBackupInfo.column,
				data: {
					type: 'COLUMN',
					table: testConstants.TEST_DOCTYPE,
					column: 'email',
					records: [
						{ name: 'test', email: 'test@example.com' },
						{ name: 'user2', email: 'user2@example.com' }
					]
				}
			};
			
			// Mock file reading
			mockFs.readFile = vi.fn().mockResolvedValue(JSON.stringify(backupData));
			
			// Mock database operations
			mockDatabase.run = vi.fn().mockResolvedValue({ changes: 2 });
			
			const result = await backupManager.restoreFromBackup(backupPath);
			
			expect(result.success).toBe(true);
			expect(result.recordCount).toBe(2);
		});
		
		it('should fail when backup file does not exist', async () => {
			const backupPath = '/tmp/nonexistent_backup.json';
			
			// Mock file access error
			mockFs.access = vi.fn().mockRejectedValue(new Error('File not found'));
			
			const result = await backupManager.restoreFromBackup(backupPath);
			
			expect(result.success).toBe(false);
			expect(result.errors).toContain('Restore failed: File not found');
		});
		
		it('should fail when backup integrity check fails', async () => {
			const backupPath = '/tmp/corrupt_backup.json';
			const backupData = { info: {}, data: {} };
			
			// Mock file reading
			mockFs.readFile = vi.fn().mockResolvedValue(JSON.stringify(backupData));
			mockFs.access = vi.fn().mockResolvedValue(undefined);
			
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
			mockFs.readdir = vi.fn().mockResolvedValue(backupFiles);
			
			// Mock file reading
			mockFs.readFile = vi.fn()
				.mockResolvedValueOnce(JSON.stringify({ info: sampleBackupInfo.full }))
				.mockResolvedValueOnce(JSON.stringify({ info: sampleBackupInfo.column }))
				.mockResolvedValueOnce('invalid json');
			
			const backups = await backupManager.listBackups();
			
			expect(backups).toHaveLength(2); // Only valid JSON files
			expect(backups[0]).toEqual(sampleBackupInfo.full);
			expect(backups[1]).toEqual(sampleBackupInfo.column);
			
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
			mockFs.readdir = vi.fn().mockResolvedValue(backupFiles);
			
			// Mock file reading
			mockFs.readFile = vi.fn()
				.mockResolvedValueOnce(JSON.stringify({ 
					info: { ...sampleBackupInfo.full, doctype: testConstants.TEST_DOCTYPE }
				}))
				.mockResolvedValueOnce(JSON.stringify({ 
					info: { ...sampleBackupInfo.column, doctype: 'User' }
				}))
				.mockResolvedValueOnce(JSON.stringify({ 
					info: { ...sampleBackupInfo.full, doctype: testConstants.TEST_DOCTYPE }
				}));
			
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
				{ info: { ...sampleBackupInfo.full, createdAt: oldDate }, path: '/tmp/old_backup.json' },
				{ info: { ...sampleBackupInfo.column, createdAt: recentDate }, path: '/tmp/recent_backup.json' }
			];
			
			// Mock listBackups
			vi.spyOn(backupManager, 'listBackups').mockResolvedValue(backupFiles as any);
			
			// Mock file deletion
			mockFs.unlink = vi.fn().mockResolvedValue(undefined);
			
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
				{ info: { ...sampleBackupInfo.full, createdAt: oldDate }, path: '/tmp/old_backup.json' }
			];
			
			// Mock listBackups
			vi.spyOn(backupManager, 'listBackups').mockResolvedValue(backupFiles as any);
			
			// Mock file deletion
			mockFs.unlink = vi.fn().mockResolvedValue(undefined);
			
			await backupManager.cleanupOldBackups(customRetentionDays);
			
			// Verify old backup was deleted (10 days > 5 days retention)
			expect(mockFs.unlink).toHaveBeenCalledWith('/tmp/old_backup.json');
		});
	});
});