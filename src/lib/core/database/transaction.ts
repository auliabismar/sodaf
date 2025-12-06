/**
 * Transaction Management for SQLite Database
 * 
 * This module implements transaction support with begin, commit, rollback, and savepoints.
 */

import type { TransactionOptions } from './types';

/**
 * Transaction state
 */
export interface TransactionState {
	/** Transaction type: 'transaction' or 'savepoint' */
	type: 'transaction' | 'savepoint';
	
	/** Transaction or savepoint name */
	name?: string;
	
	/** Whether the transaction is active */
	active: boolean;
	
	/** Stack of savepoints (for nested transactions) */
	savepoints: string[];
}

/**
 * Transaction Manager for SQLite databases
 */
export class TransactionManager {
	private db: any;
	private state: TransactionState;
	private transactionCount: number = 0;

	/**
	 * Create a new transaction manager
	 * @param db Database connection
	 */
	constructor(db: any) {
		this.db = db;
		this.state = {
			type: 'transaction',
			active: false,
			savepoints: []
		};
	}

	/**
	 * Begin a new transaction
	 * @param options Transaction options
	 * @returns Promise that resolves to a transaction object
	 */
	public async begin(options: TransactionOptions = {}): Promise<any> {
		if (this.state.active && !options.savepoint) {
			throw new Error('Transaction already in progress');
		}

		try {
			if (options.savepoint) {
				const savepointName = options.savepoint_name || `sp_${Date.now()}`;
				this.db.exec(`SAVEPOINT ${savepointName}`);
				this.state.savepoints.push(savepointName);
				
				return {
					type: 'savepoint',
					name: savepointName
				};
			} else {
				this.db.exec('BEGIN TRANSACTION');
				this.state.active = true;
				this.transactionCount++;
				
				return {
					type: 'transaction'
				};
			}
		} catch (error) {
			throw new Error(`Error beginning transaction: ${(error as Error).message}`);
		}
	}

	/**
	 * Commit a transaction
	 * @param transaction Transaction object
	 * @returns Promise that resolves when transaction is committed
	 */
	public async commit(transaction: any): Promise<void> {
		if (!this.state.active) {
			throw new Error('No active transaction to commit');
		}

		try {
			if (transaction.type === 'savepoint') {
				this.db.exec(`RELEASE SAVEPOINT ${transaction.name}`);
				
				// Remove this savepoint and any that came after it
				const index = this.state.savepoints.indexOf(transaction.name);
				if (index > -1) {
					this.state.savepoints = this.state.savepoints.slice(0, index);
				}
			} else {
				this.db.exec('COMMIT');
				this.state.active = false;
				this.state.savepoints = [];
				this.transactionCount = 0;
			}
		} catch (error) {
			throw new Error(`Error committing transaction: ${(error as Error).message}`);
		}
	}

	/**
	 * Rollback a transaction
	 * @param transaction Transaction object
	 * @returns Promise that resolves when transaction is rolled back
	 */
	public async rollback(transaction: any): Promise<void> {
		if (!this.state.active && transaction.type === 'transaction') {
			throw new Error('No active transaction to rollback');
		}

		try {
			if (transaction.type === 'savepoint') {
				this.db.exec(`ROLLBACK TO SAVEPOINT ${transaction.name}`);
				
				// Remove this savepoint and any that came after it
				const index = this.state.savepoints.indexOf(transaction.name);
				if (index > -1) {
					this.state.savepoints = this.state.savepoints.slice(0, index);
				}
			} else {
				this.db.exec('ROLLBACK');
				this.state.active = false;
				this.state.savepoints = [];
				this.transactionCount = 0;
			}
		} catch (error) {
			throw new Error(`Error rolling back transaction: ${(error as Error).message}`);
		}
	}

	/**
	 * Create a savepoint within a transaction
	 * @param name Savepoint name
	 * @param transaction Transaction object (optional)
	 * @returns Promise that resolves to a savepoint object
	 */
	public async savepoint(name: string, transaction?: any): Promise<any> {
		if (!this.state.active) {
			throw new Error('No active transaction to create savepoint');
		}

		try {
			this.db.exec(`SAVEPOINT ${name}`);
			this.state.savepoints.push(name);
			
			return {
				type: 'savepoint',
				name
			};
		} catch (error) {
			throw new Error(`Error creating savepoint: ${(error as Error).message}`);
		}
	}

	/**
	 * Rollback to a savepoint
	 * @param savepoint Savepoint object or name
	 * @returns Promise that resolves when rolled back to savepoint
	 */
	public async rollback_to_savepoint(savepoint: any): Promise<void> {
		if (!this.state.active) {
			throw new Error('No active transaction to rollback');
		}

		const savepointName = typeof savepoint === 'string' ? savepoint : savepoint.name;
		
		// Check if savepoint exists
		if (!this.state.savepoints.includes(savepointName)) {
			throw new Error(`Savepoint '${savepointName}' does not exist`);
		}

		try {
			this.db.exec(`ROLLBACK TO SAVEPOINT ${savepointName}`);
			
			// Remove this savepoint and any that came after it
			const index = this.state.savepoints.indexOf(savepointName);
			if (index > -1) {
				this.state.savepoints = this.state.savepoints.slice(0, index);
			}
		} catch (error) {
			throw new Error(`Error rolling back to savepoint: ${(error as Error).message}`);
		}
	}

	/**
	 * Release a savepoint
	 * @param savepoint Savepoint object or name
	 * @returns Promise that resolves when savepoint is released
	 */
	public async release_savepoint(savepoint: any): Promise<void> {
		if (!this.state.active) {
			throw new Error('No active transaction to release savepoint');
		}

		const savepointName = typeof savepoint === 'string' ? savepoint : savepoint.name;
		
		// Check if savepoint exists
		if (!this.state.savepoints.includes(savepointName)) {
			throw new Error(`Savepoint '${savepointName}' does not exist`);
		}

		try {
			this.db.exec(`RELEASE SAVEPOINT ${savepointName}`);
			
			// Remove this savepoint from the stack
			const index = this.state.savepoints.indexOf(savepointName);
			if (index > -1) {
				this.state.savepoints.splice(index, 1);
			}
		} catch (error) {
			throw new Error(`Error releasing savepoint: ${(error as Error).message}`);
		}
	}

	/**
	 * Execute a function within a transaction
	 * @param fn Function to execute within transaction
	 * @param options Transaction options
	 * @returns Promise that resolves to the function's return value
	 */
	public async withTransaction<T>(
		fn: (transaction: any) => Promise<T>,
		options: TransactionOptions = {}
	): Promise<T> {
		// If already in a transaction, create a savepoint instead
		if (this.state.active && !options.savepoint) {
			options.savepoint = true;
			options.savepoint_name = `sp_${Date.now()}`;
		}
		
		const transaction = await this.begin(options);
		
		try {
			const result = await fn(transaction);
			await this.commit(transaction);
			return result;
		} catch (error) {
			await this.rollback(transaction);
			throw error;
		}
	}

	/**
	 * Get current transaction state
	 * @returns Current transaction state
	 */
	public getState(): TransactionState {
		return { ...this.state };
	}

	/**
	 * Check if a transaction is active
	 * @returns True if a transaction is active
	 */
	public isActive(): boolean {
		return this.state.active;
	}

	/**
	 * Get the number of active transactions
	 * @returns Number of active transactions
	 */
	public getTransactionCount(): number {
		return this.transactionCount;
	}
}