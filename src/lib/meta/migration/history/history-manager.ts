/**
 * Migration History Manager
 * 
 * Responsible for tracking migration execution history in the database.
 * Provides functionality to record, retrieve, and manage migration history.
 */

import type { Database } from '../../../core/database/database';
import type { Migration, MigrationStats, SchemaDiff } from '../types';
import type {
	AppliedMigration,
	MigrationHistory,
	RollbackInfo,
	ExecutionEnvironment
} from '../apply-types';
import { MigrationStatus } from '../apply-types';

/**
 * Manages migration history tracking in the database
 */
export class MigrationHistoryManager {
	private database: Database;
	private historyTableInitialized: boolean = false;

	/**
	 * Create a new MigrationHistoryManager instance
	 * @param database Database connection for history storage
	 */
	constructor(database: Database) {
		this.database = database;
	}

	/**
	 * Initialize the migration history table if it doesn't exist
	 */
	async initializeHistoryTable(): Promise<void> {
		if (this.historyTableInitialized) {
			return;
		}

		const createTableSQL = `
			CREATE TABLE IF NOT EXISTS tabMigrationHistory (
				id TEXT PRIMARY KEY,
				doctype TEXT NOT NULL,
				version TEXT NOT NULL,
				timestamp TEXT NOT NULL,
				sql TEXT,
				rollback_sql TEXT,
				status TEXT NOT NULL,
				applied_by TEXT,
				execution_time INTEGER,
				affected_rows INTEGER,
				backup_path TEXT,
				error TEXT,
				rollback_info TEXT,
				environment TEXT,
				metadata TEXT
			);
		`;

		// Create indexes for better performance
		const createIndexesSQL = [
			`CREATE INDEX IF NOT EXISTS idx_migration_doctype ON tabMigrationHistory(doctype);`,
			`CREATE INDEX IF NOT EXISTS idx_migration_status ON tabMigrationHistory(status);`,
			`CREATE INDEX IF NOT EXISTS idx_migration_timestamp ON tabMigrationHistory(timestamp);`
		];

		try {
			await this.database.run(createTableSQL);
			
			for (const indexSQL of createIndexesSQL) {
				await this.database.run(indexSQL);
			}

			this.historyTableInitialized = true;
		} catch (error) {
			throw new Error(
				`Failed to initialize migration history table: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Record a migration in the history
	 * @param migration Applied migration to record
	 */
	async recordMigration(migration: AppliedMigration): Promise<void> {
		await this.initializeHistoryTable();

		try {
			const insertSQL = `
				INSERT INTO tabMigrationHistory (
					id, doctype, version, timestamp, sql, rollback_sql, status,
					applied_by, execution_time, affected_rows, backup_path, error,
					rollback_info, environment, metadata
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`;

			const values = [
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
			];

			await this.database.run(insertSQL, values);
		} catch (error) {
			throw new Error(
				`Failed to record migration ${migration.id}: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Update the status of a migration
	 * @param migrationId Migration ID to update
	 * @param status New status
	 * @param error Optional error message if status is FAILED
	 */
	async updateMigrationStatus(
		migrationId: string,
		status: MigrationStatus,
		error?: string
	): Promise<void> {
		await this.initializeHistoryTable();

		try {
			const updateSQL = `
				UPDATE tabMigrationHistory 
				SET status = ?, error = ?
				WHERE id = ?
			`;

			const values = [status, error || null, migrationId];
			await this.database.run(updateSQL, values);
		} catch (error) {
			throw new Error(
				`Failed to update migration status for ${migrationId}: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Get migration history for a specific DocType or all migrations
	 * @param doctypeName Optional DocType name to filter by
	 * @param limit Optional limit on number of records to return
	 * @returns Promise resolving to MigrationHistory
	 */
	async getMigrationHistory(
		doctypeName?: string,
		limit?: number
	): Promise<MigrationHistory> {
		await this.initializeHistoryTable();

		try {
			let query = `
				SELECT * FROM tabMigrationHistory 
				${doctypeName ? 'WHERE doctype = ?' : ''}
				ORDER BY timestamp DESC
				${limit ? 'LIMIT ?' : ''}
			`;

			const values: any[] = [];
			if (doctypeName) {
				values.push(doctypeName);
			}
			if (limit) {
				values.push(limit);
			}

			const rows = await this.database.sql(query, values);
			const migrations: AppliedMigration[] = [];

			for (const row of rows) {
				migrations.push(this.mapRowToAppliedMigration(row));
			}

			// Calculate statistics
			const stats = this.calculateMigrationStats(migrations);

			// Find last successful migration
			const lastMigration = migrations.find(
				m => m.status === MigrationStatus.APPLIED
			);

			// Separate pending and failed migrations
			const pendingMigrations: Migration[] = [];
			const failedMigrations: AppliedMigration[] = [];

			for (const migration of migrations) {
				if (migration.status === MigrationStatus.FAILED) {
					failedMigrations.push(migration);
				}
				// Note: Pending migrations would be determined differently in a real implementation
				// For now, we'll return an empty array
			}

			return {
				migrations,
				lastMigration,
				pendingMigrations,
				failedMigrations,
				stats
			};

		} catch (error) {
			throw new Error(
				`Failed to get migration history: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Get a specific migration by ID
	 * @param migrationId Migration ID to retrieve
	 * @returns Promise resolving to Migration or null if not found
	 */
	async getMigrationById(migrationId: string): Promise<AppliedMigration | null> {
		await this.initializeHistoryTable();

		try {
			const query = `
				SELECT * FROM tabMigrationHistory 
				WHERE id = ?
				ORDER BY timestamp DESC
				LIMIT 1
			`;

			const rows = await this.database.sql(query, [migrationId]);
			
			if (rows.length === 0) {
				return null;
			}

			return this.mapRowToAppliedMigration(rows[0]);

		} catch (error) {
			throw new Error(
				`Failed to get migration ${migrationId}: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Get the latest migration for a DocType
	 * @param doctypeName DocType name
	 * @returns Promise resolving to Migration or null if no migrations found
	 */
	async getLatestMigration(doctypeName: string): Promise<AppliedMigration | null> {
		await this.initializeHistoryTable();

		try {
			const query = `
				SELECT * FROM tabMigrationHistory 
				WHERE doctype = ? AND status = ?
				ORDER BY timestamp DESC
				LIMIT 1
			`;

			const rows = await this.database.sql(query, [
				doctypeName,
				MigrationStatus.APPLIED
			]);
			
			if (rows.length === 0) {
				return null;
			}

			return this.mapRowToAppliedMigration(rows[0]);

		} catch (error) {
			throw new Error(
				`Failed to get latest migration for ${doctypeName}: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Get pending migrations for a DocType or all
	 * @param doctypeName Optional DocType name to filter by
	 * @returns Promise resolving to array of Migrations
	 */
	async getPendingMigrations(doctypeName?: string): Promise<Migration[]> {
		await this.initializeHistoryTable();

		try {
			// In a real implementation, this would compare registered migrations
			// with applied migrations to find pending ones
			// For now, we'll return an empty array
			return [];

		} catch (error) {
			throw new Error(
				`Failed to get pending migrations: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Check if a migration has been applied
	 * @param migrationId Migration ID to check
	 * @returns Promise resolving to boolean
	 */
	async isMigrationApplied(migrationId: string): Promise<boolean> {
		await this.initializeHistoryTable();

		try {
			const query = `
				SELECT COUNT(*) as count FROM tabMigrationHistory 
				WHERE id = ? AND status = ?
			`;

			const rows = await this.database.sql(query, [
				migrationId,
				MigrationStatus.APPLIED
			]);

			return rows[0].count > 0;

		} catch (error) {
			throw new Error(
				`Failed to check if migration ${migrationId} is applied: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Clear migration history for a DocType or all
	 * @param doctypeName Optional DocType name to clear history for
	 */
	async clearHistory(doctypeName?: string): Promise<void> {
		await this.initializeHistoryTable();

		try {
			let query = doctypeName
				? 'DELETE FROM tabMigrationHistory WHERE doctype = ?'
				: 'DELETE FROM tabMigrationHistory';

			const values = doctypeName ? [doctypeName] : [];
			await this.database.run(query, values);

		} catch (error) {
			throw new Error(
				`Failed to clear migration history: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Get migration statistics for a DocType or all
	 * @param doctypeName Optional DocType name to filter by
	 * @returns Promise resolving to MigrationStats
	 */
	async getMigrationStats(doctypeName?: string): Promise<MigrationStats> {
		await this.initializeHistoryTable();

		try {
			let query = `
				SELECT 
					COUNT(*) as total,
					SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as applied,
					SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as failed,
					SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as rolled_back,
					SUM(execution_time) as total_execution_time,
					MAX(timestamp) as last_migration_date
				FROM tabMigrationHistory
				${doctypeName ? 'WHERE doctype = ?' : ''}
			`;

			const values = [
				MigrationStatus.APPLIED,
				MigrationStatus.FAILED,
				MigrationStatus.ROLLED_BACK
			];

			if (doctypeName) {
				values.push(doctypeName as any);
			}

			const rows = await this.database.sql(query, values);
			const row = rows[0];

			const total = row.total || 0;
			const applied = row.applied || 0;
			const failed = row.failed || 0;
			const rolledBack = row.rolled_back || 0;
			const pending = total - applied - failed - rolledBack;

			// Count destructive migrations
			let destructiveQuery = `
				SELECT COUNT(*) as count FROM tabMigrationHistory
				WHERE JSON_EXTRACT(metadata, '$.destructive') = 1
				${doctypeName ? 'AND doctype = ?' : ''}
			`;

			const destructiveValues = doctypeName ? [doctypeName] : [];
			const destructiveRows = await this.database.sql(destructiveQuery, destructiveValues);
			const destructive = destructiveRows[0].count || 0;

			return {
				total,
				applied,
				pending,
				failed,
				destructive,
				lastMigrationDate: row.last_migration_date 
					? new Date(row.last_migration_date) 
					: undefined,
				totalExecutionTime: row.total_execution_time || 0
			};

		} catch (error) {
			throw new Error(
				`Failed to get migration statistics: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Map a database row to an AppliedMigration object
	 * @param row Database row
	 * @returns AppliedMigration object
	 */
	private mapRowToAppliedMigration(row: any): AppliedMigration {
		return {
			id: row.id,
			doctype: row.doctype,
			timestamp: new Date(row.timestamp),
			sql: JSON.parse(row.sql || '[]'),
			rollbackSql: JSON.parse(row.rollback_sql || '[]'),
			applied: row.status === MigrationStatus.APPLIED,
			version: row.version,
			destructive: JSON.parse(row.metadata || '{}').destructive || false,
			requiresBackup: JSON.parse(row.metadata || '{}').requiresBackup || false,
			appliedAt: new Date(row.timestamp),
			executionTime: row.execution_time || 0,
			affectedRows: row.affected_rows || undefined,
			backupPath: row.backup_path || undefined,
			appliedBy: row.applied_by || undefined,
			status: row.status as MigrationStatus,
			error: row.error || undefined,
			rollbackInfo: row.rollback_info
				? JSON.parse(row.rollback_info)
				: undefined,
			environment: row.environment
				? JSON.parse(row.environment)
				: undefined,
			metadata: JSON.parse(row.metadata || '{}'),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			} // Add empty diff to satisfy AppliedMigration interface
		};
	}

	/**
	 * Calculate migration statistics from an array of migrations
	 * @param migrations Array of AppliedMigration objects
	 * @returns MigrationStats object
	 */
	private calculateMigrationStats(migrations: AppliedMigration[]): MigrationStats {
		const total = migrations.length;
		const applied = migrations.filter(
			m => m.status === MigrationStatus.APPLIED
		).length;
		const failed = migrations.filter(
			m => m.status === MigrationStatus.FAILED
		).length;
		const rolledBack = migrations.filter(
			m => m.status === MigrationStatus.ROLLED_BACK
		).length;
		const pending = migrations.filter(
			m => m.status === MigrationStatus.PENDING
		).length;
		const destructive = migrations.filter(m => m.destructive).length;

		const lastMigrationDate = migrations.length > 0
			? Math.max(...migrations.map(m => m.timestamp.getTime()))
			: undefined;

		const totalExecutionTime = migrations.reduce(
			(sum, m) => sum + m.executionTime,
			0
		);

		return {
			total,
			applied,
			pending,
			failed,
			destructive,
			lastMigrationDate: lastMigrationDate 
				? new Date(lastMigrationDate) 
				: undefined,
			totalExecutionTime
		};
	}
}