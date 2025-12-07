/**
 * Migration Error Tests
 * 
 * This file contains tests for migration error classes, which provide detailed
 * error context and error recovery capabilities.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	MigrationError,
	MigrationValidationError,
	MigrationExecutionError,
	MigrationRollbackError,
	DataLossRiskError,
	MigrationTimeoutError,
	MigrationBackupError,
	MigrationRestoreError,
	MigrationDependencyError,
	MigrationConflictError,
	MigrationErrorRecovery
} from '../errors/apply-errors';
import { sampleMigrations, sampleDataLossRisks } from './fixtures/apply-fixtures';

describe('Migration Error Classes', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('MigrationError', () => {
		it('should create base migration error with correct properties', () => {
			const message = 'Test migration error';
			const code = 'TEST_ERROR';
			const doctype = 'TestDocType';
			const migrationId = 'test_migration_123';
			const details = { customField: 'test_value' };
			
			const error = new MigrationError(message, code, doctype, migrationId, details);
			
			expect(error).toBeInstanceOf(Error);
			expect(error.name).toBe('MigrationError');
			expect(error.message).toBe(message);
			expect(error.code).toBe(code);
			expect(error.doctype).toBe(doctype);
			expect(error.migrationId).toBe(migrationId);
			expect(error.details).toBe(details);
		});
		
		it('should serialize to JSON correctly', () => {
			const error = new MigrationError(
				'Test error',
				'TEST_CODE',
				'TestDocType',
				'test_migration_123',
				{ test: 'value' }
			);
			
			const json = error.toJSON();
			
			expect(json.name).toBe('MigrationError');
			expect(json.message).toBe('Test error');
			expect(json.code).toBe('TEST_CODE');
			expect(json.doctype).toBe('TestDocType');
			expect(json.migrationId).toBe('test_migration_123');
			expect(json.details).toEqual({ test: 'value' });
			expect(json.stack).toBeDefined();
		});
	});

	describe('MigrationValidationError', () => {
		it('should create validation error with validation details', () => {
			const validation = {
				valid: false,
				errors: [
					{ code: 'INVALID_FIELD', message: 'Field is invalid' }
				],
				warnings: [],
				recommendations: ['Fix field definition'],
				score: 25,
				validatedAt: new Date()
			};
			
			const error = new MigrationValidationError(validation);
			
			expect(error).toBeInstanceOf(MigrationError);
			expect(error.name).toBe('MigrationValidationError');
			expect(error.message).toBe('Migration validation failed: Field is invalid');
			expect(error.validation).toBe(validation);
		});
	});

	describe('MigrationExecutionError', () => {
		it('should create execution error with statement and original error', () => {
			const statement = {
				sql: 'ALTER TABLE `test` ADD COLUMN `field` varchar(255);',
				type: 'alter_table',
				table: 'test'
			};
			const originalError = new Error('SQL syntax error');
			
			const error = new MigrationExecutionError(statement, originalError);
			
			expect(error).toBeInstanceOf(MigrationError);
			expect(error.name).toBe('MigrationExecutionError');
			expect(error.message).toBe('Migration execution failed: SQL syntax error');
			expect(error.statement).toBe(statement);
			expect(error.originalError).toBe(originalError);
		});
	});

	describe('MigrationRollbackError', () => {
		it('should create rollback error with migration ID and original error', () => {
			const migrationId = 'test_migration_123';
			const originalError = new Error('Rollback failed');
			
			const error = new MigrationRollbackError(migrationId, originalError);
			
			expect(error).toBeInstanceOf(MigrationError);
			expect(error.name).toBe('MigrationRollbackError');
			expect(error.message).toBe('Migration rollback failed: Rollback failed');
			expect(error.migrationId).toBe(migrationId);
			expect(error.originalError).toBe(originalError);
		});
	});

	describe('DataLossRiskError', () => {
		it('should create data loss risk error with risks', () => {
			const error = new DataLossRiskError(sampleDataLossRisks.columnRemoval);
			
			expect(error).toBeInstanceOf(MigrationError);
			expect(error.name).toBe('DataLossRiskError');
			expect(error.message).toContain('Data loss risks detected');
			expect(error.risks).toBe(sampleDataLossRisks.columnRemoval);
		});
	});

	describe('MigrationTimeoutError', () => {
		it('should create timeout error with migration ID and operation', () => {
			const migrationId = 'test_migration_123';
			const timeout = 300;
			const operation = 'execution';
			
			const error = new MigrationTimeoutError(migrationId, timeout, operation);
			
			expect(error).toBeInstanceOf(MigrationError);
			expect(error.name).toBe('MigrationTimeoutError');
			expect(error.message).toBe('Migration execution timed out after 300 seconds');
			expect(error.migrationId).toBe(migrationId);
			expect(error.timeout).toBe(timeout);
			expect(error.operation).toBe(operation);
		});
	});

	describe('MigrationBackupError', () => {
		it('should create backup error with path and original error', () => {
			const backupPath = '/tmp/backup.sql';
			const originalError = new Error('Disk full');
			
			const error = new MigrationBackupError(backupPath, originalError);
			
			expect(error).toBeInstanceOf(MigrationError);
			expect(error.name).toBe('MigrationBackupError');
			expect(error.message).toBe('Backup failed: Disk full');
			expect(error.backupPath).toBe(backupPath);
			expect(error.originalError).toBe(originalError);
		});
	});

	describe('MigrationRestoreError', () => {
		it('should create restore error with path and original error', () => {
			const backupPath = '/tmp/backup.sql';
			const originalError = new Error('Corrupt backup file');
			
			const error = new MigrationRestoreError(backupPath, originalError);
			
			expect(error).toBeInstanceOf(MigrationError);
			expect(error.name).toBe('MigrationRestoreError');
			expect(error.message).toBe('Restore failed: Corrupt backup file');
			expect(error.backupPath).toBe(backupPath);
			expect(error.originalError).toBe(originalError);
		});
	});

	describe('MigrationDependencyError', () => {
		it('should create dependency error with migration ID and dependencies', () => {
			const migrationId = 'test_migration_123';
			const dependencies = ['User', 'Role'];
			const originalError = new Error('Missing dependency');
			
			const error = new MigrationDependencyError(migrationId, dependencies, originalError);
			
			expect(error).toBeInstanceOf(MigrationError);
			expect(error.name).toBe('MigrationDependencyError');
			expect(error.message).toBe('Migration dependency error: Missing dependency');
			expect(error.migrationId).toBe(migrationId);
			expect(error.dependencies).toBe(dependencies);
			expect(error.originalError).toBe(originalError);
		});
	});

	describe('MigrationConflictError', () => {
		it('should create conflict error with migration ID and conflicts', () => {
			const migrationId = 'test_migration_123';
			const conflicts = ['Table already exists', 'Index conflict'];
			const originalError = new Error('Schema conflict detected');
			
			const error = new MigrationConflictError(migrationId, conflicts, originalError);
			
			expect(error).toBeInstanceOf(MigrationError);
			expect(error.name).toBe('MigrationConflictError');
			expect(error.message).toBe('Migration conflict error: Schema conflict detected');
			expect(error.migrationId).toBe(migrationId);
			expect(error.conflicts).toBe(conflicts);
			expect(error.originalError).toBe(originalError);
		});
	});

	describe('MigrationErrorRecovery', () => {
		it('should attempt recovery from validation error', async () => {
			const validation = {
				valid: false,
				errors: [
					{ code: 'INVALID_FIELD', message: 'Field is invalid', suggestion: 'Fix field type' }
				],
				warnings: [],
				recommendations: [],
				score: 25,
				validatedAt: new Date()
			};
			const error = new MigrationValidationError(validation);
			const context = { user: 'test_user' };
			
			const result = await MigrationErrorRecovery.attemptRecovery(error, context);
			
			expect(result.success).toBe(true);
			expect(result.recovered).toBe(true);
			expect(result.message).toContain('Validation errors can be fixed');
			expect(result.nextSteps).toContain('Fix field type');
		});
		
		it('should attempt recovery from execution error', async () => {
			const statement = { sql: 'ALTER TABLE test ADD COLUMN field', type: 'alter_table' };
			const originalError = new Error('Table locked');
			const error = new MigrationExecutionError(statement, originalError);
			const context = { retryCount: 1 };
			
			const result = await MigrationErrorRecovery.attemptRecovery(error, context);
			
			expect(result.success).toBe(true);
			expect(result.recovered).toBe(true);
			expect(result.message).toContain('Execution retry');
			expect(result.nextSteps).toContain('Retry execution');
		});
		
		it('should attempt recovery from rollback error', async () => {
			const migrationId = 'test_migration_123';
			const originalError = new Error('Cannot rollback');
			const error = new MigrationRollbackError(migrationId, originalError);
			const context = { manualIntervention: true };
			
			const result = await MigrationErrorRecovery.attemptRecovery(error, context);
			
			expect(result.success).toBe(true);
			expect(result.recovered).toBe(true);
			expect(result.message).toContain('Manual intervention required');
			expect(result.nextSteps).toContain('Contact system administrator');
		});
		
		it('should handle recovery failure', async () => {
			const error = new Error('Unknown error type');
			const context = {};
			
			const result = await MigrationErrorRecovery.attemptRecovery(error as any, context);
			
			expect(result.success).toBe(false);
			expect(result.recovered).toBe(false);
			expect(result.message).toContain('Recovery failed');
			expect(result.nextSteps).toContain('Check error logs');
		});
		
		it('should determine correct recovery strategy', async () => {
			const validationError = new MigrationValidationError({
				valid: false,
				errors: [],
				warnings: [],
				recommendations: [],
				score: 0,
				validatedAt: new Date()
			});
			
			const executionError = new MigrationExecutionError(
				{ sql: 'ALTER TABLE test', type: 'alter_table' },
				new Error('Syntax error')
			);
			
			const rollbackError = new MigrationRollbackError('test_123', new Error('Rollback failed'));
			const timeoutError = new MigrationTimeoutError('test_123', 300, 'execution');
			const backupError = new MigrationBackupError('/tmp/backup', new Error('Disk full'));
			const restoreError = new MigrationRestoreError('/tmp/backup', new Error('Corrupt file'));
			const dependencyError = new MigrationDependencyError('test_123', ['User'], new Error('Missing dep'));
			const conflictError = new MigrationConflictError('test_123', ['Conflict'], new Error('Schema conflict'));
			const unknownError = new Error('Unknown error');
			
			// Test strategy determination
			expect(await MigrationErrorRecovery.attemptRecovery(validationError, {}))
				.toMatchObject({ nextSteps: expect.arrayContaining(['Fix validation errors']) });
			
			expect(await MigrationErrorRecovery.attemptRecovery(executionError, {}))
				.toMatchObject({ nextSteps: expect.arrayContaining(['Retry execution']) });
			
			expect(await MigrationErrorRecovery.attemptRecovery(rollbackError, {}))
				.toMatchObject({ nextSteps: expect.arrayContaining(['Manual intervention']) });
			
			expect(await MigrationErrorRecovery.attemptRecovery(timeoutError, {}))
				.toMatchObject({ nextSteps: expect.arrayContaining(['Increase timeout']) });
			
			expect(await MigrationErrorRecovery.attemptRecovery(backupError, {}))
				.toMatchObject({ nextSteps: expect.arrayContaining(['Recreate backup']) });
			
			expect(await MigrationErrorRecovery.attemptRecovery(restoreError, {}))
				.toMatchObject({ nextSteps: expect.arrayContaining(['Alternative restore']) });
			
			expect(await MigrationErrorRecovery.attemptRecovery(dependencyError, {}))
				.toMatchObject({ nextSteps: expect.arrayContaining(['Resolve dependencies']) });
			
			expect(await MigrationErrorRecovery.attemptRecovery(conflictError, {}))
				.toMatchObject({ nextSteps: expect.arrayContaining(['Resolve conflicts']) });
			
			expect(await MigrationErrorRecovery.attemptRecovery(unknownError as any, {}))
				.toMatchObject({ nextSteps: expect.arrayContaining(['Manual intervention']) });
		});
	});
});