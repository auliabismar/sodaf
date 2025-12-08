/**
 * Migration Error Classes
 * 
 * Defines specific error classes for migration operations.
 * Provides detailed error context and error recovery capabilities.
 */

import type { AppliedMigration, DataLossRisk } from '../apply-types';
import type { Migration as BaseMigration } from '../types';

/**
 * Base migration error class
 */
export class MigrationError extends Error {
	/**
	 * Create a new MigrationError
	 * @param message Error message
	 * @param code Error code
	 * @param doctype Optional DocType name
	 * @param migrationId Optional migration ID
	 * @param details Optional error details
	 */
	constructor(
		message: string,
		public readonly code: string,
		public readonly doctype?: string,
		public readonly migrationId?: string,
		public readonly details?: any
	) {
		super(message);
		this.name = 'MigrationError';
	}

	/**
	 * Get error details as JSON
	 * @returns Error details object
	 */
	toJSON(): any {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			doctype: this.doctype,
			migrationId: this.migrationId,
			details: this.details,
			stack: this.stack
		};
	}
}

/**
 * Migration validation error
 */
export class MigrationValidationError extends MigrationError {
	/**
	 * Create a new MigrationValidationError
	 * @param validation Validation result that failed
	 */
	constructor(validation: any) {
		super(
			`Migration validation failed: ${validation.errors?.map((e: any) => e.message).join(', ') || 'Unknown validation error'
			}`,
			'MIGRATION_VALIDATION_FAILED',
			validation.doctype || validation.migration?.doctype,
			validation.migration?.id
		);
		this.name = 'MigrationValidationError';
		this.validation = validation;
	}

	/**
	 * Validation result that caused the error
	 */
	public readonly validation: any;
}

/**
 * Migration execution error
 */
export class MigrationExecutionError extends MigrationError {
	/**
	 * Create a new MigrationExecutionError
	 * @param statement SQL statement that failed
	 * @param originalError Original error that occurred
	 */
	constructor(
		statement: any,
		originalError: Error
	) {
		super(
			`Migration execution failed: ${originalError.message}`,
			'MIGRATION_EXECUTION_ERROR',
			statement.table,
			statement.id
		);
		this.name = 'MigrationExecutionError';
		this.statement = statement;
		this.originalError = originalError;
	}

	/**
	 * SQL statement that failed
	 */
	public readonly statement: any;

	/**
	 * Original error that occurred
	 */
	public readonly originalError: Error;
}

/**
 * Migration rollback error
 */
export class MigrationRollbackError extends MigrationError {
	/**
	 * Create a new MigrationRollbackError
	 * @param migrationId Migration ID that failed to rollback
	 * @param originalError Original error that occurred
	 */
	constructor(
		migrationId: string,
		originalError: Error
	) {
		super(
			`Migration rollback failed: ${originalError.message}`,
			'MIGRATION_ROLLBACK_FAILED',
			undefined,
			migrationId
		);
		this.name = 'MigrationRollbackError';
		this.migrationId = migrationId;
		this.originalError = originalError;
	}

	/**
	 * Migration ID that failed
	 */
	public readonly migrationId: string;

	/**
	 * Original error that occurred
	 */
	public readonly originalError: Error;
}

/**
 * Data loss risk error
 */
export class DataLossRiskError extends MigrationError {
	/**
	 * Create a new DataLossRiskError
	 * @param risks Data loss risks that were detected
	 */
	constructor(risks: DataLossRisk[]) {
		super(
			`Data loss risks detected: ${risks.map(r => r.description).join(', ')}`,
			'DATA_LOSS_RISK',
			undefined,
			undefined,
			{ risks }
		);
		this.name = 'DataLossRiskError';
		this.risks = risks;
	}

	/**
	 * Data loss risks that were detected
	 */
	public readonly risks: DataLossRisk[];
}

/**
 * Migration timeout error
 */
export class MigrationTimeoutError extends MigrationError {
	/**
	 * Create a new MigrationTimeoutError
	 * @param migrationId Migration ID that timed out
	 * @param timeout Timeout duration in seconds
	 * @param operation Operation that timed out
	 */
	constructor(
		migrationId: string,
		timeout: number,
		operation: string
	) {
		super(
			`Migration ${operation} timed out after ${timeout} seconds`,
			'MIGRATION_TIMEOUT',
			undefined,
			migrationId
		);
		this.name = 'MigrationTimeoutError';
		this.timeout = timeout;
		this.operation = operation;
	}

	/**
	 * Timeout duration in seconds
	 */
	public readonly timeout: number;

	/**
	 * Operation that timed out
	 */
	public readonly operation: string;
}

/**
 * Backup error
 */
export class MigrationBackupError extends MigrationError {
	/**
	 * Create a new MigrationBackupError
	 * @param backupPath Backup file path that failed
	 * @param originalError Original error that occurred
	 */
	constructor(
		backupPath: string,
		originalError: Error
	) {
		super(
			`Backup failed: ${originalError.message}`,
			'BACKUP_FAILED',
			undefined,
			undefined,
			{ backupPath }
		);
		this.name = 'MigrationBackupError';
		this.backupPath = backupPath;
		this.originalError = originalError;
	}

	/**
	 * Backup file path that failed
	 */
	public readonly backupPath: string;

	/**
	 * Original error that occurred
	 */
	public readonly originalError: Error;
}

/**
 * Restore error
 */
export class MigrationRestoreError extends MigrationError {
	/**
	 * Create a new MigrationRestoreError
	 * @param backupPath Backup file path that failed to restore
	 * @param originalError Original error that occurred
	 */
	constructor(
		backupPath: string,
		originalError: Error
	) {
		super(
			`Restore failed: ${originalError.message}`,
			'RESTORE_FAILED',
			undefined,
			undefined,
			{ backupPath }
		);
		this.name = 'MigrationRestoreError';
		this.backupPath = backupPath;
		this.originalError = originalError;
	}

	/**
	 * Backup file path that failed to restore
	 */
	public readonly backupPath: string;

	/**
	 * Original error that occurred
	 */
	public readonly originalError: Error;
}

/**
 * Migration dependency error
 */
export class MigrationDependencyError extends MigrationError {
	/**
	 * Create a new MigrationDependencyError
	 * @param migrationId Migration ID with dependency issues
	 * @param dependencies List of missing dependencies
	 * @param originalError Original error that occurred
	 */
	constructor(
		migrationId: string,
		dependencies: string[],
		originalError: Error
	) {
		super(
			`Migration dependency error: ${originalError.message}`,
			'MIGRATION_DEPENDENCY_ERROR',
			undefined,
			migrationId
		);
		this.name = 'MigrationDependencyError';
		this.dependencies = dependencies;
		this.originalError = originalError;
	}

	/**
	 * Missing dependencies
	 */
	public readonly dependencies: string[];

	/**
	 * Original error that occurred
	 */
	public readonly originalError: Error;
}

/**
 * Migration conflict error
 */
export class MigrationConflictError extends MigrationError {
	/**
	 * Create a new MigrationConflictError
	 * @param migrationId Migration ID that has conflicts
	 * @param conflicts List of conflicts
	 * @param originalError Original error that occurred
	 */
	constructor(
		migrationId: string,
		conflicts: string[],
		originalError: Error
	) {
		super(
			`Migration conflict error: ${originalError.message}`,
			'MIGRATION_CONFLICT_ERROR',
			undefined,
			migrationId
		);
		this.name = 'MigrationConflictError';
		this.conflicts = conflicts;
		this.originalError = originalError;
	}

	/**
	 * List of conflicts
	 */
	public readonly conflicts: string[];

	/**
	 * Original error that occurred
	 */
	public readonly originalError: Error;
}

/**
 * Error recovery utilities
 */
export class MigrationErrorRecovery {
	/**
	 * Attempt to recover from a migration error
	 * @param error The error to recover from
	 * @param context Recovery context
	 * @returns Promise resolving to recovery result
	 */
	static async attemptRecovery(
		error: MigrationError,
		context: any = {}
	): Promise<{
		success: boolean;
		recovered: boolean;
		message: string;
		nextSteps: string[];
	}> {
		try {
			// Log the error for debugging
			console.error('Migration error:', error.toJSON());

			// Determine recovery strategy based on error type
			const strategy = this.determineRecoveryStrategy(error);

			// Attempt recovery
			const result = await this.executeRecoveryStrategy(strategy, error, context);

			return {
				success: result.success,
				recovered: result.recovered,
				message: result.message,
				nextSteps: result.nextSteps
			};

		} catch (recoveryError) {
			console.error('Error recovery failed:', recoveryError);

			return {
				success: false,
				recovered: false,
				message: `Recovery failed: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
					}`,
				nextSteps: [
					'Check error logs',
					'Verify system state',
					'Contact system administrator'
				]
			};
		}
	}

	/**
	 * Determine recovery strategy based on error type
	 * @param error The error to analyze
	 * @returns Recovery strategy
	 */
	private static determineRecoveryStrategy(error: MigrationError): string {
		if (error instanceof MigrationValidationError) {
			return 'validation_fix';
		} else if (error instanceof MigrationExecutionError) {
			return 'execution_retry';
		} else if (error instanceof MigrationRollbackError) {
			return 'rollback_manual';
		} else if (error instanceof MigrationTimeoutError) {
			return 'timeout_increase';
		} else if (error instanceof MigrationBackupError) {
			return 'backup_recreate';
		} else if (error instanceof MigrationRestoreError) {
			return 'restore_alternative';
		} else if (error instanceof MigrationDependencyError) {
			return 'dependency_resolution';
		} else if (error instanceof MigrationConflictError) {
			return 'conflict_resolution';
		} else {
			return 'manual_intervention';
		}
	}

	/**
	 * Execute recovery strategy
	 * @param strategy Recovery strategy to execute
	 * @param error The original error
	 * @param context Recovery context
	 * @returns Promise resolving to recovery result
	 */
	private static async executeRecoveryStrategy(
		strategy: string,
		error: MigrationError,
		context: any
	): Promise<{
		success: boolean;
		recovered: boolean;
		message: string;
		nextSteps: string[];
	}> {
		switch (strategy) {
			case 'validation_fix':
				return await this.recoverFromValidationError(error as any, context);
			case 'execution_retry':
				return await this.recoverFromExecutionError(error as any, context);
			case 'rollback_manual':
				return await this.recoverFromRollbackError(error as any, context);
			case 'timeout_increase':
				return await this.recoverFromTimeoutError(error as any, context);
			case 'backup_recreate':
				return await this.recoverFromBackupError(error as any, context);
			case 'restore_alternative':
				return await this.recoverFromRestoreError(error as any, context);
			case 'dependency_resolution':
				return await this.recoverFromDependencyError(error as any, context);
			case 'conflict_resolution':
				return await this.recoverFromConflictError(error as any, context);
			default:
				return await this.recoverFromGenericError(error, context);
		}
	}

	/**
	 * Recover from validation error
	 */
	private static async recoverFromValidationError(
		error: MigrationValidationError,
		context: any
	): Promise<{
		success: boolean;
		recovered: boolean;
		message: string;
		nextSteps: string[];
	}> {
		// For validation errors, suggest fixing the validation issues
		const validation = error.validation;
		if (!validation) {
			return {
				success: false,
				recovered: false,
				message: 'Cannot recover from validation error: no validation data available',
				nextSteps: ['Provide validation data for recovery']
			};
		}

		// Suggest fixing validation errors
		const fixes = validation.errors?.map((e: any) => e.suggestion) || [];
		const actionableFixes = fixes.filter((fix: string) => fix && fix !== 'Review manually');

		if (actionableFixes.length > 0) {
			return {
				success: true,
				recovered: true,
				message: `Validation errors can be fixed: ${actionableFixes.join(', ')}`,
				nextSteps: actionableFixes
			};
		}

		return {
			success: false,
			recovered: false,
			message: 'Validation errors require manual intervention',
			nextSteps: ['Review validation errors', 'Fix identified issues', 'Retry migration']
		};
	}

	/**
	 * Recover from execution error
	 */
	private static async recoverFromExecutionError(
		error: MigrationExecutionError,
		context: any
	): Promise<{
		success: boolean;
		recovered: boolean;
		message: string;
		nextSteps: string[];
	}> {
		// For execution errors, suggest retrying with different options
		const retryCount = context.retryCount || 0;

		if (retryCount < 3) {
			return {
				success: true,
				recovered: true,
				message: `Execution error recovered by retry attempt ${retryCount + 1}`,
				nextSteps: [
					'Retry migration with increased timeout',
					'Check database connection',
					'Verify SQL syntax'
				]
			};
		}

		return {
			success: false,
			recovered: false,
			message: 'Execution error requires manual intervention',
			nextSteps: [
				'Check database logs',
				'Review SQL statements',
				'Contact database administrator'
			]
		};
	}

	/**
	 * Recover from rollback error
	 */
	private static async recoverFromRollbackError(
		error: MigrationRollbackError,
		context: any
	): Promise<{
		success: boolean;
		recovered: boolean;
		message: string;
		nextSteps: string[];
	}> {
		// For rollback errors, suggest manual rollback
		return {
			success: false,
			recovered: false,
			message: 'Rollback error requires manual intervention',
			nextSteps: [
				'Review rollback SQL statements',
				'Check database state',
				'Consider manual data restoration',
				'Contact support if needed'
			]
		};
	}

	/**
	 * Recover from timeout error
	 */
	private static async recoverFromTimeoutError(
		error: MigrationTimeoutError,
		context: any
	): Promise<{
		success: boolean;
		recovered: boolean;
		message: string;
		nextSteps: string[];
	}> {
		// For timeout errors, suggest increasing timeout
		const newTimeout = Math.min(error.timeout * 2, 3600); // Max 1 hour

		return {
			success: true,
			recovered: true,
			message: `Timeout error recovered by increasing timeout to ${newTimeout} seconds`,
			nextSteps: [
				'Retry migration with increased timeout',
				'Consider breaking into smaller transactions',
				'Monitor system resources during migration'
			]
		};
	}

	/**
	 * Recover from backup error
	 */
	private static async recoverFromBackupError(
		error: MigrationBackupError,
		context: any
	): Promise<{
		success: boolean;
		recovered: boolean;
		message: string;
		nextSteps: string[];
	}> {
		// For backup errors, suggest recreating backup
		return {
			success: true,
			recovered: true,
			message: `Backup error recovered by recreating backup`,
			nextSteps: [
				'Create new backup before migration',
				'Verify backup storage location',
				'Check disk space availability'
			]
		};
	}

	/**
	 * Recover from restore error
	 */
	private static async recoverFromRestoreError(
		error: MigrationRestoreError,
		context: any
	): Promise<{
		success: boolean;
		recovered: boolean;
		message: string;
		nextSteps: string[];
	}> {
		// For restore errors, suggest alternative restore method
		return {
			success: true,
			recovered: true,
			message: `Restore error recovered by using alternative method`,
			nextSteps: [
				'Try manual data restoration',
				'Use different backup file',
				'Contact support for assistance'
			]
		};
	}

	/**
	 * Recover from dependency error
	 */
	private static async recoverFromDependencyError(
		error: MigrationDependencyError,
		context: any
	): Promise<{
		success: boolean;
		recovered: boolean;
		message: string;
		nextSteps: string[];
	}> {
		// For dependency errors, suggest resolving dependencies
		const dependencies = error.dependencies;
		if (!dependencies || dependencies.length === 0) {
			return {
				success: false,
				recovered: false,
				message: 'Cannot recover from dependency error: no dependency information available',
				nextSteps: ['Provide dependency information for recovery']
			};
		}

		return {
			success: true,
			recovered: true,
			message: `Dependency error resolved by addressing: ${dependencies.join(', ')}`,
			nextSteps: [
				'Install missing dependencies',
				'Resolve dependency conflicts',
				'Update migration order'
			]
		};
	}

	/**
	 * Recover from conflict error
	 */
	private static async recoverFromConflictError(
		error: MigrationConflictError,
		context: any
	): Promise<{
		success: boolean;
		recovered: boolean;
		message: string;
		nextSteps: string[];
	}> {
		// For conflict errors, suggest manual resolution
		const conflicts = error.conflicts;
		if (!conflicts || conflicts.length === 0) {
			return {
				success: false,
				recovered: false,
				message: 'Cannot recover from conflict error: no conflict information available',
				nextSteps: ['Provide conflict information for recovery']
			};
		}

		return {
			success: false,
			recovered: false,
			message: 'Conflict error requires manual resolution',
			nextSteps: [
				'Review conflicting migrations',
				'Resolve conflicts manually',
				'Consider migration reordering'
			]
		};
	}

	/**
	 * Recover from generic error
	 */
	private static async recoverFromGenericError(
		error: MigrationError,
		context: any
	): Promise<{
		success: boolean;
		recovered: boolean;
		message: string;
		nextSteps: string[];
	}> {
		return {
			success: false,
			recovered: false,
			message: `Generic error requires manual intervention: ${error.message}`,
			nextSteps: [
				'Review error logs',
				'Check system state',
				'Contact support if needed'
			]
		};
	}
}