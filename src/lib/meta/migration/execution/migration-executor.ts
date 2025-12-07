/**
 * Migration Executor
 * 
 * Executes SQL statements within transactions with proper error handling.
 * Provides savepoint support and transaction management.
 */

import type { Database } from '../../../core/database/database';
import type {
	ExecutionOptions,
	ExecutionResult,
	Savepoint,
	TransactionOptions
} from '../apply-types';

/**
 * Executes migration SQL statements within transactions
 */
export class MigrationExecutor {
	private database: Database;

	/**
	 * Create a new MigrationExecutor instance
	 * @param database Database connection
	 */
	constructor(database: Database) {
		this.database = database;
	}

	/**
	 * Execute a function within a transaction
	 * @param operations Function to execute within transaction
	 * @param options Transaction options
	 * @returns Promise resolving to function's return value
	 */
	async executeInTransaction<T>(
		operations: () => Promise<T>,
		options: TransactionOptions = {}
	): Promise<T> {
		const startTime = Date.now();
		const warnings: string[] = [];
		const errors: string[] = [];
		let affectedRows: number | undefined;
		const savepoints: Savepoint[] = [];

		let transaction: any;
		try {
			// Start transaction
			transaction = await this.database.begin({
				isolation_level: options.isolationLevel
			});

			// Execute operations within transaction
			const result = await operations();

			// Commit transaction
			await this.database.commit(transaction);

			affectedRows = this.extractAffectedRows(result);
			
			return result;

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			errors.push(`Transaction failed: ${errorMessage}`);

			// Try to rollback if possible
			try {
				if (transaction) {
					await this.database.rollback(transaction);
				}
			} catch (rollbackError) {
				errors.push(`Rollback failed: ${
					rollbackError instanceof Error
						? rollbackError.message
						: String(rollbackError)
				}`);
			}

			throw new Error(`Transaction execution failed: ${errorMessage}`);
		} finally {
			// Log execution time
			const executionTime = Date.now() - startTime;
			
			if (errors.length > 0) {
				console.error(`Transaction execution failed after ${executionTime}ms:`, errors);
			}
		}
	}

	/**
	 * Execute migration SQL statements
	 * @param statements SQL statements to execute
	 * @param options Execution options
	 * @returns Promise resolving to ExecutionResult
	 */
	async executeMigrationSQL(
		statements: Array<{ sql: string; type?: string; destructive?: boolean; table?: string; comment?: string }>,
		options: ExecutionOptions = {}
	): Promise<ExecutionResult> {
		const startTime = Date.now();
		const warnings: string[] = [];
		const errors: string[] = [];
		let totalAffectedRows = 0;
		const savepoints: Savepoint[] = [];

		try {
			// Start transaction
			const transaction = await this.database.begin({
				isolation_level: options.isolationLevel,
				read_only: false,
				savepoint: options.createSavepoints
			});

			// Execute each statement
			for (let i = 0; i < statements.length; i++) {
				const statement = statements[i];
				
				try {
					// Create savepoint if requested
					let savepoint: Savepoint | undefined;
					if (options.createSavepoints) {
						const savepointName = options.savepointPattern 
							? options.savepointPattern.replace('{index}', i.toString())
							: `sp_${i}`;
						
						savepoint = await this.database.savepoint(savepointName, transaction);
						if (savepoint) {
							savepoints.push(savepoint);
						}
					}

					// Execute the SQL statement
					const result = await this.database.run(statement.sql);
					
					// Check if statement affected rows
					const affectedRows = this.extractAffectedRows(result);
					totalAffectedRows += affectedRows || 0;

					// Release savepoint if created
					if (savepoint) {
						await this.database.release_savepoint(savepoint);
					}

					// Log statement execution
					if (statement.comment) {
						console.log(`Executed: ${statement.comment}`);
					}

				} catch (statementError) {
					const errorMessage = statementError instanceof Error 
						? statementError.message 
						: String(statementError);
					
					errors.push(`Statement ${i + 1} failed: ${errorMessage}`);
					
					// Rollback to savepoint if available
					if (savepoints.length > 0) {
						try {
							const lastSavepoint = savepoints[savepoints.length - 1];
							await this.database.rollback_to_savepoint(lastSavepoint);
							warnings.push(`Rolled back to savepoint: ${lastSavepoint.name}`);
						} catch (rollbackError) {
							errors.push(`Savepoint rollback failed: ${
								rollbackError instanceof Error 
									? rollbackError.message 
									: String(rollbackError)
							}`);
						}
					}

					// Continue on error if specified
					if (!options.continueOnError) {
						throw new Error(`Migration execution failed at statement ${i + 1}: ${errorMessage}`);
					}
				}
			}

			// Commit transaction
			await this.database.commit(transaction);

			return {
				success: errors.length === 0,
				affectedRows: totalAffectedRows,
				executionTime: Date.now() - startTime,
				warnings,
				errors,
				savepoints
			};

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			errors.push(`Migration execution failed: ${errorMessage}`);

			return {
				success: false,
				affectedRows: totalAffectedRows,
				executionTime: Date.now() - startTime,
				warnings,
				errors,
				savepoints
			};
		}
	}

	/**
	 * Execute rollback SQL statements
	 * @param statements SQL statements to execute for rollback
	 * @param options Execution options
	 * @returns Promise resolving to ExecutionResult
	 */
	async executeRollbackSQL(
		statements: Array<{ sql: string; type?: string; destructive?: boolean; table?: string; comment?: string }>,
		options: ExecutionOptions = {}
	): Promise<ExecutionResult> {
		const startTime = Date.now();
		const warnings: string[] = [];
		const errors: string[] = [];
		let totalAffectedRows = 0;
		const savepoints: Savepoint[] = [];

		try {
			// Start transaction
			const transaction = await this.database.begin({
				isolation_level: options.isolationLevel || 'SERIALIZABLE',
				read_only: false,
				savepoint: true // Always use savepoints for rollback
			});

			// Execute each rollback statement
			for (let i = 0; i < statements.length; i++) {
				const statement = statements[i];
				
				try {
					// Create savepoint
					const savepointName = `rollback_sp_${i}`;
					const savepoint = await this.database.savepoint(savepointName, transaction);
					savepoints.push(savepoint);

					// Execute the rollback statement
					const result = await this.database.run(statement.sql);
					
					// Check if statement affected rows
					const affectedRows = this.extractAffectedRows(result);
					totalAffectedRows += affectedRows || 0;

					// Log rollback execution
					if (statement.comment) {
						console.log(`Rolled back: ${statement.comment}`);
					}

					// Release savepoint
					await this.database.release_savepoint(savepoint);

				} catch (statementError) {
					const errorMessage = statementError instanceof Error 
						? statementError.message 
						: String(statementError);
					
					errors.push(`Rollback statement ${i + 1} failed: ${errorMessage}`);
					
					// Rollback to previous savepoint
					if (savepoints.length > 0) {
						try {
							const lastSavepoint = savepoints[savepoints.length - 1];
							await this.database.rollback_to_savepoint(lastSavepoint);
							warnings.push(`Rolled back to savepoint: ${lastSavepoint.name}`);
						} catch (rollbackError) {
							errors.push(`Savepoint rollback failed: ${
								rollbackError instanceof Error 
									? rollbackError.message 
									: String(rollbackError)
							}`);
						}
					}

					// Continue on error if specified
					if (!options.continueOnError) {
						throw new Error(`Rollback execution failed at statement ${i + 1}: ${errorMessage}`);
					}
				}
			}

			// Commit transaction
			await this.database.commit(transaction);

			return {
				success: errors.length === 0,
				affectedRows: totalAffectedRows,
				executionTime: Date.now() - startTime,
				warnings,
				errors,
				savepoints
			};

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			errors.push(`Rollback execution failed: ${errorMessage}`);

			return {
				success: false,
				affectedRows: totalAffectedRows,
				executionTime: Date.now() - startTime,
				warnings,
				errors,
				savepoints
			};
		}
	}

	/**
	 * Create a savepoint
	 * @param name Savepoint name
	 * @param transaction Transaction object
	 * @returns Promise resolving to Savepoint
	 */
	async createSavepoint(name: string, transaction: any): Promise<Savepoint> {
		try {
			const savepoint = await this.database.savepoint(name, transaction);
			
			return {
				name,
				createdAt: new Date(),
				active: true
			};

		} catch (error) {
			throw new Error(`Failed to create savepoint ${name}: ${
				error instanceof Error ? error.message : String(error)
			}`);
		}
	}

	/**
	 * Rollback to a savepoint
	 * @param savepoint Savepoint to rollback to
	 * @returns Promise that resolves when rollback is complete
	 */
	async rollbackToSavepoint(savepoint: Savepoint): Promise<void> {
		try {
			await this.database.rollback_to_savepoint(savepoint);
			
			// Update savepoint status
			savepoint.active = false;

		} catch (error) {
			throw new Error(`Failed to rollback to savepoint ${savepoint.name}: ${
				error instanceof Error ? error.message : String(error)
			}`);
		}
	}

	/**
	 * Release a savepoint
	 * @param savepoint Savepoint to release
	 * @returns Promise that resolves when savepoint is released
	 */
	async releaseSavepoint(savepoint: Savepoint): Promise<void> {
		try {
			await this.database.release_savepoint(savepoint);
			
			// Update savepoint status
			savepoint.active = false;

		} catch (error) {
			throw new Error(`Failed to release savepoint ${savepoint.name}: ${
				error instanceof Error ? error.message : String(error)
			}`);
		}
	}

	/**
	 * Extract affected rows from database result
	 * @param result Database execution result
	 * @returns Number of affected rows
	 */
	private extractAffectedRows(result: any): number | undefined {
		// Different database drivers return affected rows differently
		// This is a simplified implementation
		if (result && typeof result === 'object') {
			// SQLite style
			if (result.changes !== undefined) {
				return result.changes;
			}
		}

		return undefined;
	}

	/**
	 * Execute a single SQL statement with timeout
	 * @param sql SQL statement to execute
	 * @param timeout Timeout in seconds
	 * @returns Promise resolving to execution result
	 */
	private async executeWithTimeout(
		sql: string,
		timeout: number
	): Promise<any> {
		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				reject(new Error(`SQL execution timeout after ${timeout} seconds`));
			}, timeout * 1000);

			this.database.run(sql)
				.then(result => {
					clearTimeout(timeoutId);
					resolve(result);
				})
				.catch(error => {
					clearTimeout(timeoutId);
					reject(error);
				});
		});
	}

	/**
	 * Check if a SQL statement is read-only
	 * @param sql SQL statement to check
	 * @returns True if statement is read-only
	 */
	private isReadOnlyStatement(sql: string): boolean {
		const upperSQL = sql.toUpperCase().trim();
		const readOnlyStatements = ['SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN'];
		
		return readOnlyStatements.some(stmt => 
			upperSQL.startsWith(stmt + ' ') || upperSQL.startsWith(stmt + '\n')
		);
	}

	/**
	 * Analyze SQL statement for potential issues
	 * @param sql SQL statement to analyze
	 * @returns Analysis warnings
	 */
	private analyzeSQLStatement(sql: string): string[] {
		const warnings: string[] = [];
		const upperSQL = sql.toUpperCase();

		// Check for potentially slow operations
		if (upperSQL.includes('SELECT *') && !upperSQL.includes('LIMIT')) {
			warnings.push('Unbounded SELECT * query may be slow on large tables');
		}

		if (upperSQL.includes('UPDATE') && !upperSQL.includes('WHERE')) {
			warnings.push('UPDATE without WHERE clause affects all rows');
		}

		if (upperSQL.includes('DELETE') && !upperSQL.includes('WHERE')) {
			warnings.push('DELETE without WHERE clause affects all rows');
		}

		// Check for missing indexes hints
		if (upperSQL.includes('JOIN') && !upperSQL.includes('INDEX')) {
			warnings.push('JOIN operation without index hint may be slow');
		}

		return warnings;
	}

	/**
	 * Get transaction isolation level from options
	 * @param options Execution options
	 * @returns Isolation level string
	 */
	private getIsolationLevel(options: ExecutionOptions): string {
		return options.isolationLevel || 'READ_COMMITTED';
	}

	/**
	 * Get transaction timeout from options
	 * @param options Execution options
	 * @returns Timeout in seconds
	 */
	private getTimeout(options: ExecutionOptions): number {
		return options.timeout || 300; // Default 5 minutes
	}

	/**
	 * Check if savepoints should be created
	 * @param options Execution options
	 * @returns True if savepoints should be created
	 */
	private shouldCreateSavepoints(options: ExecutionOptions): boolean {
		return options.createSavepoints !== false;
	}

	/**
	 * Get savepoint naming pattern from options
	 * @param options Execution options
	 * @returns Savepoint naming pattern
	 */
	private getSavepointPattern(options: ExecutionOptions): string {
		return options.savepointPattern || 'sp_{index}';
	}

	/**
	 * Check if execution should continue on error
	 * @param options Execution options
	 * @returns True if execution should continue on error
	 */
	private shouldContinueOnError(options: ExecutionOptions): boolean {
		return options.continueOnError === true;
	}

	/**
	 * Validate execution options
	 * @param options Execution options to validate
	 * @throws Error if options are invalid
	 */
	private validateOptions(options: ExecutionOptions): void {
		// Validate isolation level
		const validIsolationLevels = [
			'READ_UNCOMMITTED',
			'READ_COMMITTED',
			'REPEATABLE_READ',
			'SERIALIZABLE'
		];

		if (options.isolationLevel && 
			!validIsolationLevels.includes(options.isolationLevel)) {
			throw new Error(`Invalid isolation level: ${options.isolationLevel}`);
		}

		// Validate timeout
		if (options.timeout !== undefined && options.timeout <= 0) {
			throw new Error('Timeout must be greater than 0 seconds');
		}
	}

	/**
	 * Create execution context for logging
	 * @param options Execution options
	 * @returns Execution context object
	 */
	private createExecutionContext(options: ExecutionOptions): Record<string, any> {
		return {
			isolationLevel: this.getIsolationLevel(options),
			timeout: this.getTimeout(options),
			createSavepoints: this.shouldCreateSavepoints(options),
			savepointPattern: this.getSavepointPattern(options),
			continueOnError: this.shouldContinueOnError(options),
			timestamp: new Date().toISOString()
		};
	}

	/**
	 * Log execution metrics
	 * @param executionTime Execution time in milliseconds
	 * @param affectedRows Number of affected rows
	 * @param warnings Warnings generated
	 * @param errors Errors generated
	 */
	private logExecutionMetrics(
		executionTime: number,
		affectedRows?: number,
		warnings: string[] = [],
		errors: string[] = []
	): void {
		const metrics = {
			executionTime,
			affectedRows,
			warningCount: warnings.length,
			errorCount: errors.length,
			timestamp: new Date().toISOString()
		};

		console.log('Migration execution metrics:', JSON.stringify(metrics, null, 2));
	}
}