/**
 * Migration Executor Tests
 * 
 * This file contains tests for MigrationExecutor class, which is responsible
 * for executing SQL statements within transactions with proper error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MigrationExecutor } from '../execution/migration-executor';
import type { Database } from '../../../core/database/database';
import type { ExecutionOptions, ExecutionResult, Savepoint } from '../apply-types';

// Mock database implementation
const mockDatabase = {
	begin: vi.fn().mockResolvedValue({ id: 'tx_123' }),
	commit: vi.fn().mockResolvedValue(undefined),
	rollback: vi.fn().mockResolvedValue(undefined),
	savepoint: vi.fn().mockResolvedValue({ name: 'sp_1' }),
	release_savepoint: vi.fn().mockResolvedValue(undefined),
	rollback_to_savepoint: vi.fn().mockResolvedValue(undefined),
	run: vi.fn().mockResolvedValue({ changes: 1 }),
	withTransaction: vi.fn().mockImplementation((fn) => fn({ id: 'tx_123' }))
} as unknown as Database;

describe('MigrationExecutor', () => {
	let executor: MigrationExecutor;

	beforeEach(() => {
		mockDatabase.run = vi.fn().mockResolvedValue({ changes: 1 });
		executor = new MigrationExecutor(mockDatabase);
		vi.clearAllMocks();
	});

	describe('executeInTransaction', () => {
		it('should execute operations within transaction', async () => {
			const operations = vi.fn().mockResolvedValue('success');

			const result = await executor.executeInTransaction(operations);

			expect(result).toBe('success');
			expect(mockDatabase.begin).toHaveBeenCalledWith({});
			expect(mockDatabase.commit).toHaveBeenCalledWith({ id: 'tx_123' });
			expect(operations).toHaveBeenCalled();
		});

		it('should rollback on error', async () => {
			const error = new Error('Test error');
			const operations = vi.fn().mockRejectedValue(error);

			await expect(executor.executeInTransaction(operations)).rejects.toThrow('Test error');

			expect(mockDatabase.rollback).toHaveBeenCalledWith({ id: 'tx_123' });
		});

		it('should handle transaction options', async () => {
			const operations = vi.fn().mockResolvedValue('success');
			const options = {
				isolationLevel: 'SERIALIZABLE' as const,
				timeout: 30
			};

			await executor.executeInTransaction(operations, options);

			expect(mockDatabase.begin).toHaveBeenCalledWith({
				isolation_level: options.isolationLevel
			});
		});
	});

	describe('executeMigrationSQL', () => {
		it('should execute migration SQL statements', async () => {
			const statements = [
				{ sql: 'ALTER TABLE `test` ADD COLUMN `field` varchar(255);', type: 'alter_table' },
				{ sql: 'CREATE INDEX `idx_field` ON `test` (`field`);', type: 'create_index' }
			];
			const options: ExecutionOptions = {
				timeout: 60,
				continueOnError: false,
				createSavepoints: false
			};

			const result = await executor.executeMigrationSQL(statements, options);

			expect(result.success).toBe(true);
			expect(result.errors).toHaveLength(0);
			expect(result.warnings).toHaveLength(0);
			expect(result.affectedRows).toBe(2);
			expect(mockDatabase.begin).toHaveBeenCalledWith({
				isolation_level: undefined,
				read_only: false,
				savepoint: false
			});
			expect(mockDatabase.commit).toHaveBeenCalled();

			// Verify all statements were executed
			expect(mockDatabase.run).toHaveBeenCalledTimes(2);
			expect(mockDatabase.run).toHaveBeenCalledWith(statements[0].sql);
			expect(mockDatabase.run).toHaveBeenCalledWith(statements[1].sql);
		});

		it('should handle statement execution error', async () => {
			const statements = [
				{ sql: 'ALTER TABLE `test` ADD COLUMN `field` varchar(255);', type: 'alter_table' },
				{ sql: 'INVALID SQL STATEMENT', type: 'create_index' }
			];
			const options: ExecutionOptions = {
				continueOnError: false
			};

			// Mock database to fail on second statement
			mockDatabase.run = vi.fn()
				.mockResolvedValueOnce({ changes: 1 })
				.mockRejectedValueOnce(new Error('Syntax error'));

			const result = await executor.executeMigrationSQL(statements, options);

			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain('Statement 2 failed: Syntax error');
			expect(mockDatabase.rollback).toHaveBeenCalled();
		});

		it('should continue on error when option is set', async () => {
			const statements = [
				{ sql: 'ALTER TABLE `test` ADD COLUMN `field` varchar(255);', type: 'alter_table' },
				{ sql: 'INVALID SQL STATEMENT', type: 'create_index' },
				{ sql: 'CREATE INDEX `idx_field2` ON `test` (`field2`);', type: 'create_index' }
			];
			const options: ExecutionOptions = {
				continueOnError: true
			};

			// Mock database to fail on second statement only
			mockDatabase.run = vi.fn()
				.mockResolvedValueOnce({ changes: 1 })
				.mockRejectedValueOnce(new Error('Syntax error'))
				.mockResolvedValueOnce({ changes: 1 });

			const result = await executor.executeMigrationSQL(statements, options);

			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.warnings).toHaveLength(0);

			// Verify third statement was still executed despite error
			expect(mockDatabase.run).toHaveBeenCalledTimes(3);
		});

		it('should create savepoints when requested', async () => {
			const statements = [
				{ sql: 'ALTER TABLE `test` ADD COLUMN `field1` varchar(255);', type: 'alter_table' },
				{ sql: 'ALTER TABLE `test` ADD COLUMN `field2` varchar(255);', type: 'alter_table' }
			];
			const options: ExecutionOptions = {
				createSavepoints: true,
				savepointPattern: 'sp_{index}'
			};

			const result = await executor.executeMigrationSQL(statements, options);

			expect(result.success).toBe(true);
			expect(result.savepoints).toHaveLength(2);
			if (result.savepoints && result.savepoints[0]) {
				expect(result.savepoints[0].name).toBe('sp_0');
			}
			if (result.savepoints && result.savepoints[1]) {
				expect(result.savepoints[1].name).toBe('sp_1');
			}

			// Verify savepoints were created and released
			expect(mockDatabase.savepoint).toHaveBeenCalledWith('sp_0', { id: 'tx_123' });
			expect(mockDatabase.savepoint).toHaveBeenCalledWith('sp_1', { id: 'tx_123' });
			expect(mockDatabase.release_savepoint).toHaveBeenCalledTimes(2);
		});

		it('should rollback to savepoint on statement error', async () => {
			const statements = [
				{ sql: 'ALTER TABLE `test` ADD COLUMN `field1` varchar(255);', type: 'alter_table' },
				{ sql: 'INVALID SQL', type: 'alter_table' },
				{ sql: 'ALTER TABLE `test` ADD COLUMN `field3` varchar(255);', type: 'alter_table' }
			];
			const options: ExecutionOptions = {
				createSavepoints: true
			};

			// Mock database to fail on second statement
			mockDatabase.run = vi.fn()
				.mockResolvedValueOnce({ changes: 1 })
				.mockRejectedValueOnce(new Error('Syntax error'))
				.mockResolvedValueOnce({ changes: 1 });

			const result = await executor.executeMigrationSQL(statements, options);

			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.warnings).toContain('Rolled back to savepoint: sp_1');

			// Verify rollback to savepoint was attempted
			expect(mockDatabase.rollback_to_savepoint).toHaveBeenCalledWith(
				expect.objectContaining({ name: 'sp_1' })
			);
		});
	});

	describe('executeRollbackSQL', () => {
		it('should execute rollback SQL statements', async () => {
			const statements = [
				{ sql: 'ALTER TABLE `test` DROP COLUMN `field`;', type: 'alter_table' },
				{ sql: 'DROP INDEX `idx_field`;', type: 'drop_index' }
			];
			const options: ExecutionOptions = {
				timeout: 60
			};

			// Mock database to return 0 changes for rollback statements
			mockDatabase.run = vi.fn().mockResolvedValue({ changes: 0 });

			const result = await executor.executeRollbackSQL(statements, options);

			expect(result.success).toBe(true);
			expect(result.errors).toHaveLength(0);
			expect(result.affectedRows).toBe(0);

			// Verify rollback transaction was used
			expect(mockDatabase.begin).toHaveBeenCalledWith({
				isolation_level: 'SERIALIZABLE',
				read_only: false,
				savepoint: true
			});

			// Verify savepoints were created for rollback
			expect(mockDatabase.savepoint).toHaveBeenCalledWith('rollback_sp_0', expect.any(Object));
			expect(mockDatabase.savepoint).toHaveBeenCalledWith('rollback_sp_1', expect.any(Object));
		});

		it('should handle rollback execution error', async () => {
			const statements = [
				{ sql: 'ALTER TABLE `test` DROP COLUMN `field`;', type: 'alter_table' },
				{ sql: 'INVALID ROLLBACK SQL', type: 'alter_table' }
			];
			const options: ExecutionOptions = {
				continueOnError: false
			};

			// Mock database to fail on second statement
			mockDatabase.run = vi.fn()
				.mockResolvedValueOnce({ changes: 1 })
				.mockRejectedValueOnce(new Error('Rollback error'));

			const result = await executor.executeRollbackSQL(statements, options);

			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain('Rollback statement 2 failed');
			expect(mockDatabase.rollback).toHaveBeenCalled();
		});
	});

	describe('createSavepoint', () => {
		it('should create savepoint with correct properties', async () => {
			const savepointName = 'test_savepoint';
			const transaction = { id: 'tx_123' };

			const savepoint = await executor.createSavepoint(savepointName, transaction);

			expect(savepoint.name).toBe(savepointName);
			expect(savepoint.active).toBe(true);
			expect(savepoint.createdAt).toBeInstanceOf(Date);
			expect(mockDatabase.savepoint).toHaveBeenCalledWith(savepointName, transaction);
		});

		it('should handle savepoint creation error', async () => {
			const savepointName = 'test_savepoint';
			const transaction = { id: 'tx_123' };

			// Mock database to fail
			mockDatabase.savepoint = vi.fn().mockRejectedValue(new Error('Savepoint error'));

			await expect(
				executor.createSavepoint(savepointName, transaction)
			).rejects.toThrow('Failed to create savepoint test_savepoint: Savepoint error');
		});
	});

	describe('rollbackToSavepoint', () => {
		it('should rollback to savepoint and update status', async () => {
			const savepoint: Savepoint = {
				name: 'test_savepoint',
				createdAt: new Date(),
				active: true
			};

			await executor.rollbackToSavepoint(savepoint);

			expect(mockDatabase.rollback_to_savepoint).toHaveBeenCalledWith(savepoint);
			expect(savepoint.active).toBe(false);
		});

		it('should handle rollback error', async () => {
			const savepoint: Savepoint = {
				name: 'test_savepoint',
				createdAt: new Date(),
				active: true
			};

			// Mock database to fail
			mockDatabase.rollback_to_savepoint = vi.fn().mockRejectedValue(new Error('Rollback error'));

			await expect(
				executor.rollbackToSavepoint(savepoint)
			).rejects.toThrow('Failed to rollback to savepoint test_savepoint: Rollback error');
		});
	});

	describe('releaseSavepoint', () => {
		it('should release savepoint and update status', async () => {
			const savepoint: Savepoint = {
				name: 'test_savepoint',
				createdAt: new Date(),
				active: true
			};

			await executor.releaseSavepoint(savepoint);

			expect(mockDatabase.release_savepoint).toHaveBeenCalledWith(savepoint);
			expect(savepoint.active).toBe(false);
		});

		it('should handle release error', async () => {
			const savepoint: Savepoint = {
				name: 'test_savepoint',
				createdAt: new Date(),
				active: true
			};

			// Mock database to fail
			mockDatabase.release_savepoint = vi.fn().mockRejectedValue(new Error('Release error'));

			await expect(
				executor.releaseSavepoint(savepoint)
			).rejects.toThrow('Failed to release savepoint test_savepoint: Release error');
		});
	});
});