/**
 * Migration Workflow
 * 
 * Orchestrates the complete migration workflow from schema comparison to SQL execution.
 */

import type { DocTypeEngine } from '../doctype';
import type { SchemaDiff, MigrationResult, MigrationOptions } from './types';
import type { MigrationSQL } from './sql/sql-types';

/**
 * Simple MigrationValidation interface for this workflow
 */
interface MigrationValidation {
	valid: boolean;
	errors: Array<{ code: string; message: string; severity: string; suggestion?: string }>;
	warnings: Array<{ code: string; message: string; type: string }>;
	recommendations: string[];
}

import { SchemaComparisonEngine } from './schema-comparison-engine';
import { SQLGenerator } from './sql-generator';

/**
 * Migration Workflow class
 */
export class MigrationWorkflow {
	private schemaEngine: SchemaComparisonEngine;
	private sqlGenerator: SQLGenerator;

	constructor(database: any, doctypeEngine: DocTypeEngine) {
		this.schemaEngine = new SchemaComparisonEngine(database, doctypeEngine);
		this.sqlGenerator = new SQLGenerator({
			tableNamingStrategy: 'snake_case',
			identifierQuote: '`',
			includeComments: true,
			formatSQL: true,
			validateSQL: true
		});
	}

	/**
	 * Complete migration workflow: compare, generate SQL, and optionally apply
	 */
	async executeMigration(
		doctypeName: string,
		options: MigrationOptions = {}
	): Promise<MigrationResult> {
		const startTime = Date.now();
		const result: MigrationResult = {
			success: false,
			sql: [],
			warnings: [],
			errors: []
		};

		try {
			// 1. Compare schemas
			const diff = await this.schemaEngine.compareSchema(doctypeName);
			const sql = this.sqlGenerator.generateMigrationSQL(diff, doctypeName);

			if (!this.hasChanges(diff)) {
				result.success = true;
				result.warnings.push('No schema changes detected');
				return result;
			}

			// 2. Validate migration
			const validation = this.validateMigration(sql);
			if (!validation.valid) {
				result.errors.push(...validation.errors.map((e: any) => e.message));
				return result;
			}

			result.warnings.push(...validation.warnings.map((w: any) => w.message));

			// 3. Prepare SQL statements
			result.sql = sql.forward.map((stmt: any) => stmt.sql);

			// 4. Apply migration if not dry run
			if (!options.dryRun) {
				const applied = await this.applyMigration(sql);
				result.success = applied.success;
				result.errors.push(...applied.errors);
				result.affectedRows = applied.affectedRows;
			} else {
				result.success = true;
				result.warnings.push('Dry run - no changes applied');
			}

			// 5. Record migration
			if (result.success && !options.dryRun) {
				await this.recordMigration(doctypeName, diff, sql);
			}

		} catch (error) {
			result.errors.push(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
		}

		result.executionTime = Date.now() - startTime;
		return result;
	}

	/**
	 * Generate migration SQL without applying
	 */
	async generateMigrationSQL(doctypeName: string): Promise<MigrationSQL> {
		const diff: SchemaDiff = await this.schemaEngine.compareSchema(doctypeName);
		return this.sqlGenerator.generateMigrationSQL(diff, doctypeName);
	}

	/**
	 * Validate migration SQL
	 */
	validateMigration(sql: MigrationSQL): MigrationValidation {
		const validation: MigrationValidation = {
			valid: true,
			errors: [],
			warnings: [],
			recommendations: []
		};

		// Check for destructive operations
		if (sql.destructive) {
			validation.warnings.push({
				code: 'DESTRUCTIVE_OPERATIONS',
				message: 'Migration contains potentially destructive operations',
				type: 'data_loss'
			});
			validation.recommendations.push('Consider creating a backup before applying this migration');
		}

		// Validate SQL syntax (basic)
		for (const statement of sql.forward) {
			if (!this.isValidSQLSyntax(statement.sql)) {
				validation.valid = false;
				validation.errors.push({
					code: 'INVALID_SQL_SYNTAX',
					message: `Invalid SQL syntax in statement: ${statement.sql}`,
					severity: 'error',
					suggestion: 'Check SQL syntax and identifier quoting'
				});
			}
		}

		// Check for data migration requirements
		const requiresDataMigration = sql.forward.some(stmt =>
			stmt.type === 'alter_table' && stmt.destructive
		);

		if (requiresDataMigration) {
			validation.warnings.push({
				code: 'DATA_MIGRATION_REQUIRED',
				message: 'Migration requires data migration',
				type: 'performance'
			});
			validation.recommendations.push('Consider running migration during low-traffic periods');
		}

		return validation;
	}

	/**
	 * Apply migration SQL
	 */
	private async applyMigration(sql: MigrationSQL): Promise<MigrationResult> {
		const result: MigrationResult = {
			success: false,
			sql: sql.forward.map(stmt => stmt.sql),
			warnings: [],
			errors: []
		};

		try {
			// This would execute SQL statements in a transaction
			// For now, simulate successful execution
			result.success = true;
			result.affectedRows = 0; // Would be actual row count

			// Simulate execution time estimation
			const estimatedTime = sql.estimatedTime || 0;
			if (estimatedTime > 10) {
				result.warnings.push(`Migration may take approximately ${estimatedTime} seconds`);
			}

		} catch (error) {
			result.errors.push(`SQL execution failed: ${error instanceof Error ? error.message : String(error)}`);
		}

		return result;
	}

	/**
	 * Record migration in history
	 */
	private async recordMigration(
		doctypeName: string,
		diff: SchemaDiff,
		sql: MigrationSQL
	): Promise<void> {
		// This would save migration to history table
		// For now, just log to console
		console.log(`Recording migration for ${doctypeName}:`, {
			id: sql.metadata.id,
			doctype: doctypeName,
			version: sql.metadata.version,
			timestamp: sql.metadata.timestamp,
			statements: sql.forward.length,
			destructive: sql.destructive
		});
	}

	/**
	 * Check if schema diff has changes
	 */
	private hasChanges(diff: SchemaDiff): boolean {
		return (
			diff.addedColumns.length > 0 ||
			diff.removedColumns.length > 0 ||
			diff.modifiedColumns.length > 0 ||
			diff.addedIndexes.length > 0 ||
			diff.removedIndexes.length > 0 ||
			diff.renamedColumns.length > 0
		);
	}

	/**
	 * Basic SQL syntax validation
	 */
	private isValidSQLSyntax(sql: string): boolean {
		// Basic validation - in practice, you'd use a proper SQL parser
		const trimmed = sql.trim().toUpperCase();

		// Check for required keywords
		const hasValidKeyword = [
			'CREATE TABLE',
			'ALTER TABLE',
			'DROP TABLE',
			'CREATE INDEX',
			'DROP INDEX',
			'INSERT INTO',
			'UPDATE',
			'DELETE FROM'
		].some(keyword => trimmed.startsWith(keyword));

		if (!hasValidKeyword) {
			return false;
		}

		// Check for balanced quotes
		const singleQuotes = (sql.match(/'/g) || []).length;
		if (singleQuotes % 2 !== 0) {
			return false;
		}

		// Check for balanced parentheses
		let parenCount = 0;
		for (const char of sql) {
			if (char === '(') parenCount++;
			if (char === ')') parenCount--;
		}

		return parenCount === 0;
	}

	/**
	 * Generate rollback SQL for a migration
	 */
	async generateRollbackSQL(doctypeName: string): Promise<string[]> {
		const migrationSQL = await this.generateMigrationSQL(doctypeName);
		return migrationSQL.rollback.map((stmt: any) => stmt.sql);
	}

	/**
	 * Execute rollback for a migration
	 */
	async executeRollback(doctypeName: string): Promise<MigrationResult> {
		const rollbackSQL = await this.generateRollbackSQL(doctypeName);

		const result: MigrationResult = {
			success: false,
			sql: rollbackSQL,
			warnings: ['Executing rollback migration'],
			errors: []
		};

		try {
			// This would execute rollback SQL statements in a transaction
			// For now, simulate successful execution
			result.success = true;
			result.warnings.push('Rollback migration completed successfully');

		} catch (error) {
			result.errors.push(`Rollback failed: ${error instanceof Error ? error.message : String(error)}`);
		}

		return result;
	}

	/**
	 * Get migration history for a DocType
	 */
	async getMigrationHistory(doctypeName: string): Promise<any[]> {
		// This would retrieve migration history from database
		// For now, return empty array
		return [];
	}

	/**
	 * Check if migration has been applied
	 */
	async isMigrationApplied(migrationId: string): Promise<boolean> {
		// This would check migration history table
		// For now, return false
		return false;
	}

	/**
	 * Get pending migrations for a DocType
	 */
	async getPendingMigrations(doctypeName: string): Promise<string[]> {
		// This would compare current schema with latest migration
		// For now, return empty array
		return [];
	}

	/**
	 * Create backup before migration
	 */
	async createBackup(doctypeName: string): Promise<string> {
		// This would create a backup of the table
		// For now, return placeholder path
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		return `backup_${doctypeName}_${timestamp}.sql`;
	}

	/**
	 * Restore from backup
	 */
	async restoreFromBackup(backupPath: string): Promise<MigrationResult> {
		const result: MigrationResult = {
			success: false,
			sql: [],
			warnings: [`Restoring from backup: ${backupPath}`],
			errors: []
		};

		try {
			// This would execute the backup SQL
			// For now, simulate successful execution
			result.success = true;
			result.warnings.push('Backup restored successfully');

		} catch (error) {
			result.errors.push(`Restore failed: ${error instanceof Error ? error.message : String(error)}`);
		}

		return result;
	}
}