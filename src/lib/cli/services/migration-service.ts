/**
 * Migration Service Interface
 * 
 * This file implements the migration service that provides high-level
 * migration operations for the CLI system.
 */

import type {
	MigrationResult,
	MigrationHistory,
	MigrationCommandOptions,
	ExecutionContext
} from '../types';
// import { MigrationStatus } from '../types';
import type { SiteContext } from '../../core/site/types';
import type { Database } from '../../core/database/database';

/**
 * Migration service interface
 */
export interface IMigrationService {
	/**
	 * Run pending migrations
	 * @param options Migration options
	 * @param context Execution context
	 * @returns Promise resolving to migration result
	 */
	runMigrations(
		options: MigrationCommandOptions,
		context: ExecutionContext
	): Promise<MigrationResult>;
	
	/**
	 * Show migration dry run
	 * @param options Migration options
	 * @param context Execution context
	 * @returns Promise resolving to migration result
	 */
	dryRunMigrations(
		options: MigrationCommandOptions,
		context: ExecutionContext
	): Promise<MigrationResult>;
	
	/**
	 * Get migration status
	 * @param siteName Site name
	 * @param context Execution context
	 * @returns Promise resolving to migration history
	 */
	getMigrationStatus(
		siteName: string,
		context: ExecutionContext
	): Promise<MigrationHistory>;
	
	/**
	 * Rollback migrations
	 * @param options Migration options
	 * @param context Execution context
	 * @returns Promise resolving to migration result
	 */
	rollbackMigrations(
		options: MigrationCommandOptions,
		context: ExecutionContext
	): Promise<MigrationResult>;
}

/**
 * Migration service implementation
 */
export class MigrationService implements IMigrationService {
	/**
	 * Run pending migrations
	 * @param options Migration options
	 * @param context Execution context
	 * @returns Promise resolving to migration result
	 */
	async runMigrations(
		options: MigrationCommandOptions,
		context: ExecutionContext
	): Promise<MigrationResult> {
		const site = await this.getSiteContext(options.site, context);
		const database = await this.getDatabase(site);
		
		try {
			// Create migration applier
			const { MigrationApplier } = await import('../../meta/migration/apply');
			const { DocTypeEngine } = await import('../../meta/doctype/doctype-engine');
			
			const doctypeEngine = new (DocTypeEngine as any)(database);
			const applier = new MigrationApplier(database, doctypeEngine, {
				dryRun: options.dryRun || false,
				force: options.force || false,
				preserveData: true,
				backup: options.backup !== false,
				continueOnError: options.continueOnError || false,
				batchSize: options.batchSize || 1000,
				timeout: options.timeout || 300,
				validateData: true,
				context: { user: 'cli' }
			});
			
			// Run migrations
			const result = await applier.syncAllDocTypes({
				force: options.force || false,
				backup: options.backup !== false,
				timeout: options.timeout || 300,
				continueOnError: options.continueOnError || false
			});
			
			// Report progress if verbose
			if (options.verbose) {
				context.progress.start('Migration', result.totalTime || 0);
				context.progress.start('Migrations').complete('Migrations completed');
			}
			
			return result;
			
		} catch (error) {
			return {
				success: false,
				sql: [],
				warnings: [],
				errors: [error instanceof Error ? error.message : String(error)],
				executionTime: 0
			};
		} finally {
			// Close database connection if needed
			if (database && 'close' in database) {
				(database as any).close();
			}
		}
	}
	
	/**
	 * Show migration dry run
	 * @param options Migration options
	 * @param context Execution context
	 * @returns Promise resolving to migration result
	 */
	async dryRunMigrations(
		options: MigrationCommandOptions,
		context: ExecutionContext
	): Promise<MigrationResult> {
		const dryRunOptions = { ...options, dryRun: true };
		return this.runMigrations(dryRunOptions, context);
	}
	
	/**
	 * Get migration status
	 * @param siteName Site name
	 * @param context Execution context
	 * @returns Promise resolving to migration history
	 */
	async getMigrationStatus(
		siteName: string,
		context: ExecutionContext
	): Promise<MigrationHistory> {
		const site = await this.getSiteContext(siteName, context);
		const database = await this.getDatabase(site);
		
		try {
			// Get migration history
			const { MigrationHistoryManager } = await import('../../meta/migration/history/history-manager');
			const historyManager = new MigrationHistoryManager(database);
			
			const history = await historyManager.getMigrationHistory();
			
			// Get migration statistics
			const stats = await historyManager.getMigrationStats();
			
			return {
				...history,
				stats
			};
			
		} catch (error) {
			throw new Error(`Failed to get migration status: ${
				error instanceof Error ? error.message : String(error)
			}`);
		} finally {
			// Close database connection if needed
			if (database && 'close' in database) {
				(database as any).close();
			}
		}
	}
	
	/**
	 * Rollback migrations
	 * @param options Migration options
	 * @param context Execution context
	 * @returns Promise resolving to migration result
	 */
	async rollbackMigrations(
		options: MigrationCommandOptions,
		context: ExecutionContext
	): Promise<MigrationResult> {
		const site = await this.getSiteContext(options.site, context);
		const database = await this.getDatabase(site);
		
		try {
			// Get migration history
			const { MigrationHistoryManager } = await import('../../meta/migration/history/history-manager');
			const historyManager = new MigrationHistoryManager(database);
			
			// Determine which migrations to rollback
			const migrationsToRollback = await this.getMigrationsToRollback(
				options,
				historyManager
			);
			
			if (migrationsToRollback.length === 0) {
				return {
					success: true,
					sql: [],
					warnings: ['No migrations to rollback'],
					errors: [],
					executionTime: 0
				};
			}
			
			// Confirm rollback if not forced
			if (!options.force) {
				const confirm = await this.confirmRollback(
					migrationsToRollback,
					context
				);
				
				if (!confirm) {
					return {
						success: false,
						sql: [],
						warnings: [],
						errors: ['Rollback cancelled by user'],
						executionTime: 0
					};
				}
			}
			
			// Execute rollback
			const sqlStatements: string[] = [];
			const warnings: string[] = [];
			let totalAffected = 0;
			
			for (const migration of migrationsToRollback) {
				if (migration.rollbackSql) {
					const rollbackSql = Array.isArray(migration.rollbackSql)
						? migration.rollbackSql
						: [migration.rollbackSql];
					
					sqlStatements.push(...rollbackSql);
					totalAffected += migration.affectedRows || 0;
					
					// Update migration status
					await historyManager.updateMigrationStatus(
						migration.id,
						'ROLLED_BACK' as any
					);
				}
			}
			
			return {
				success: true,
				sql: sqlStatements,
				warnings,
				errors: [],
				affectedRows: totalAffected,
				executionTime: 0
			};
			
		} catch (error) {
			return {
				success: false,
				sql: [],
				warnings: [],
				errors: [error instanceof Error ? error.message : String(error)],
				executionTime: 0
			};
		} finally {
			// Close database connection if needed
			if (database && 'close' in database) {
				(database as any).close();
			}
		}
	}
	
	/**
	 * Get site context
	 * @param siteName Site name
	 * @param context Execution context
	 * @returns Promise resolving to site context
	 */
	private async getSiteContext(
		siteName: string | undefined,
		context: ExecutionContext
	): Promise<SiteContext> {
		if (context.site) {
			return context.site;
		}
		
		// Load site from site manager
		const { SiteManager } = await import('../site');
		const sitesDir = context.config.sitesDir || SiteManager.getDefaultSitesDir();
		const siteManager = new SiteManager(sitesDir);
		
		return await siteManager.createSiteContext(siteName || null, context.config);
	}
	
	/**
	 * Get database connection
	 * @param site Site context
	 * @returns Promise resolving to database connection
	 */
	private async getDatabase(site: SiteContext): Promise<Database> {
		const { SQLiteDatabase } = await import('../../core/database/sqlite-database');
		return new SQLiteDatabase({ path: site.db_path });
	}
	
	/**
	 * Get migrations to rollback
	 * @param options Migration options
	 * @param historyManager Migration history manager
	 * @returns Promise resolving to migrations to rollback
	 */
	private async getMigrationsToRollback(
		options: MigrationCommandOptions,
		historyManager: any
	): Promise<any[]> {
		// Get applied migrations
		const history = await historyManager.getMigrationHistory();
		const appliedMigrations = history.migrations
			.filter((m: any) => m.applied)
			.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
		
		if (options.id) {
			// Rollback specific migration
			const migration = appliedMigrations.find((m: any) => m.id === options.id);
			return migration ? [migration] : [];
		}
		
		if (options.steps) {
			// Rollback last N migrations
			return appliedMigrations.slice(0, options.steps);
		}
		
		// Default: rollback last migration
		return appliedMigrations.slice(0, 1);
	}
	
	/**
	 * Confirm rollback with user
	 * @param migrations Migrations to rollback
	 * @param context Execution context
	 * @returns Promise resolving to confirmation
	 */
	private async confirmRollback(
		migrations: any[],
		context: ExecutionContext
	): Promise<boolean> {
		// In a real implementation, this would prompt the user
		// For now, we'll assume confirmation in non-interactive mode
		return true;
	}
}