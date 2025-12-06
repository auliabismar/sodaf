/**
 * Connection Pool for SQLite Database
 * 
 * This file implements a connection pool for SQLite database connections to improve
 * performance and manage resource usage efficiently.
 */

import type { PoolOptions, PoolStats } from './types';

/**
 * Connection wrapper for pooled database connections
 */
interface PooledConnection {
	connection: any;
	inUse: boolean;
	createdAt: number;
	lastUsed: number;
}

/**
 * Connection Pool implementation for SQLite databases
 */
export class ConnectionPool {
	private dbPath: string;
	private options: PoolOptions;
	private connections: PooledConnection[] = [];
	private waitingQueue: Array<{
		resolve: (connection: PooledConnection) => void;
		reject: (error: Error) => void;
		timeout?: NodeJS.Timeout;
	}> = [];
	private poolStats: PoolStats = {
		total: 0,
		active: 0,
		idle: 0,
		waiting: 0
	};
	private idleCheckInterval: NodeJS.Timeout | null = null;
	private isDestroyed: boolean = false;

	/**
	 * Create a new connection pool
	 * @param dbPath Path to the SQLite database file
	 * @param options Pool configuration options
	 */
	constructor(dbPath: string, options: PoolOptions = {}) {
		this.dbPath = dbPath;
		this.options = {
			min: 1,
			max: 10,
			idle_timeout: 30000, // 30 seconds
			acquire_timeout: 10000, // 10 seconds
			...options
		};

		// Start idle connection cleanup
		this.startIdleCheck();
	}

	/**
	 * Acquire a connection from the pool
	 * @returns Promise that resolves to a database connection
	 */
	public async acquire(): Promise<any> {
		if (this.isDestroyed) {
			throw new Error('Connection pool has been destroyed');
		}

		// Try to find an idle connection
		const idleConnection = this.connections.find(conn => !conn.inUse);
		if (idleConnection) {
			idleConnection.inUse = true;
			idleConnection.lastUsed = Date.now();
			this.updatePoolStats();
			return idleConnection.connection;
		}

		// If no idle connection and we haven't reached max, create a new one
		if (this.connections.length < (this.options.max || 10)) {
			const connection = await this.createConnection();
			const pooledConnection: PooledConnection = {
				connection,
				inUse: true,
				createdAt: Date.now(),
				lastUsed: Date.now()
			};
			this.connections.push(pooledConnection);
			this.updatePoolStats();
			return connection;
		}

		// Wait for a connection to become available
		return new Promise((resolve, reject) => {
			const waitItem = {
				resolve,
				reject,
				timeout: setTimeout(() => {
					reject(new Error('Connection acquire timeout'));
				}, this.options.acquire_timeout || 10000)
			};
			this.waitingQueue.push(waitItem);
			this.updatePoolStats();
		});
	}

	/**
	 * Release a connection back to the pool
	 * @param connection The database connection to release
	 */
	public release(connection: any): void {
		if (this.isDestroyed) {
			return;
		}

		const pooledConnection = this.connections.find(conn => conn.connection === connection);
		if (!pooledConnection) {
			// Connection not from this pool, ignore
			return;
		}

		pooledConnection.inUse = false;
		pooledConnection.lastUsed = Date.now();

		// If there are waiting connections, resolve the first one
		if (this.waitingQueue.length > 0) {
			const waitItem = this.waitingQueue.shift()!;
			if (waitItem.timeout) {
				clearTimeout(waitItem.timeout);
			}
			waitItem.resolve(pooledConnection);
		}

		this.updatePoolStats();
	}

	/**
	 * Get pool statistics
	 * @returns Current pool statistics
	 */
	public stats(): PoolStats {
		return { ...this.poolStats };
	}

	/**
	 * Destroy the connection pool and close all connections
	 */
	public destroy(): void {
		if (this.isDestroyed) {
			return;
		}

		this.isDestroyed = true;

		// Clear idle check interval
		if (this.idleCheckInterval) {
			clearInterval(this.idleCheckInterval);
			this.idleCheckInterval = null;
		}

		// Clear waiting queue
		this.waitingQueue.forEach(waitItem => {
			if (waitItem.timeout) {
				clearTimeout(waitItem.timeout);
			}
			waitItem.reject(new Error('Connection pool destroyed'));
		});
		this.waitingQueue = [];

		// Close all connections
		const closePromises = this.connections.map(async (pooledConnection) => {
			try {
				if (pooledConnection.connection && typeof pooledConnection.connection.close === 'function') {
					await pooledConnection.connection.close();
				}
			} catch (error) {
				console.error('Error closing connection:', error);
			}
		});

		Promise.all(closePromises).then(() => {
			this.connections = [];
			this.updatePoolStats();
		});
	}

	/**
	 * Create a new database connection
	 * @returns Promise that resolves to a database connection
	 */
	private async createConnection(): Promise<any> {
		// Import Database dynamically to avoid circular dependency
		const { SQLiteDatabase } = await import('./sqlite-database');
		const db = new SQLiteDatabase({ path: this.dbPath });
		return db.get_connection();
	}

	/**
	 * Start the idle connection check interval
	 */
	private startIdleCheck(): void {
		if (this.options.idle_timeout && this.options.idle_timeout > 0) {
			this.idleCheckInterval = setInterval(() => {
				this.checkIdleConnections();
			}, Math.min(this.options.idle_timeout, 60000)); // Check at least once per minute
		}
	}

	/**
	 * Check for idle connections and close them if they've been idle too long
	 */
	private checkIdleConnections(): void {
		if (this.isDestroyed) {
			return;
		}

		const now = Date.now();
		const idleThreshold = this.options.idle_timeout || 30000;

		// Find connections that have been idle too long
		const idleConnections = this.connections.filter(pooledConnection => 
			!pooledConnection.inUse && 
			(now - pooledConnection.lastUsed) > idleThreshold
		);

		// Close idle connections
		idleConnections.forEach(async (pooledConnection) => {
			try {
				if (pooledConnection.connection && typeof pooledConnection.connection.close === 'function') {
					await pooledConnection.connection.close();
				}
			} catch (error) {
				console.error('Error closing idle connection:', error);
			}
		});

		// Remove closed connections from pool
		this.connections = this.connections.filter(pooledConnection => 
			!idleConnections.includes(pooledConnection)
		);

		// Ensure we have at least min connections
		const ensureMinConnections = async () => {
			while (this.connections.length < (this.options.min || 1) && !this.isDestroyed) {
				try {
					const connection = await this.createConnection();
					const pooledConnection: PooledConnection = {
						connection,
						inUse: false,
						createdAt: Date.now(),
						lastUsed: Date.now()
					};
					this.connections.push(pooledConnection);
				} catch (error) {
					console.error('Error creating minimum connection:', error);
					break;
				}
			}
		};
		
		ensureMinConnections();

		this.updatePoolStats();
	}

	/**
	 * Update pool statistics
	 */
	private updatePoolStats(): void {
		this.poolStats.total = this.connections.length;
		this.poolStats.active = this.connections.filter(conn => conn.inUse).length;
		this.poolStats.idle = this.connections.filter(conn => !conn.inUse).length;
		this.poolStats.waiting = this.waitingQueue.length;
	}
}