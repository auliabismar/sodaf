/**
 * Migration Backup Manager
 * 
 * Handles data backup and restoration for destructive operations.
 * Supports multiple backup strategies including full, column, schema, and incremental.
 */

import type { Database } from '../../../core/database/database';
import type { TableInfo, ColumnInfo } from '../../../core/database/types';
import type {
	BackupOptions,
	BackupInfo,
	RestoreResult,
	ValidationResults
} from '../apply-types';
import { BackupType } from '../apply-types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Manages backup creation and restoration for migrations
 */
export class MigrationBackupManager {
	private database: Database;
	private options: Required<BackupOptions>;

	/**
	 * Create a new MigrationBackupManager instance
	 * @param database Database connection
	 * @param options Backup options
	 */
	constructor(database: Database, options: BackupOptions = {}) {
		this.database = database;
		this.options = {
			defaultType: BackupType.FULL,
			storagePath: './backups',
			compression: 'gzip',
			retentionDays: 30,
			encrypt: false,
			namingPattern: '{doctype}_{timestamp}_{type}',
			verifyIntegrity: true,
			includeIndexes: true,
			includeTriggers: true,
			...options
		};

		// Ensure backup directory exists
		this.ensureBackupDirectory();
	}

	/**
	 * Create a backup for a DocType
	 * @param doctypeName Name of DocType to backup
	 * @param backupType Type of backup to create
	 * @returns Promise resolving to backup file path
	 */
	async createBackup(
		doctypeName: string,
		backupType: BackupType = this.options.defaultType
	): Promise<string> {
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const fileName = this.options.namingPattern
			.replace('{doctype}', doctypeName)
			.replace('{timestamp}', timestamp)
			.replace('{type}', backupType.toLowerCase());
		
		const backupPath = path.join(this.options.storagePath, `${fileName}.json`);
		
		try {
			let backupData: any;

			switch (backupType) {
				case BackupType.FULL:
					backupData = await this.createFullBackup(doctypeName);
					break;
				case BackupType.COLUMN:
					// For column backup, we'd need to know which column
					// This is a simplified implementation
					backupData = await this.createFullBackup(doctypeName);
					break;
				case BackupType.SCHEMA:
					backupData = await this.createSchemaBackup(doctypeName);
					break;
				case BackupType.INCREMENTAL:
					// Incremental backup would need to compare with last backup
					// This is a simplified implementation
					backupData = await this.createFullBackup(doctypeName);
					break;
				default:
					throw new Error(`Unsupported backup type: ${backupType}`);
			}

			// Add metadata to backup
			const backupInfo: BackupInfo = {
				id: this.generateBackupId(),
				doctype: doctypeName,
				type: backupType,
				createdAt: new Date(),
				path: backupPath,
				size: 0, // Will be updated after writing
				compressed: this.options.compression !== 'none',
				encrypted: this.options.encrypt,
				recordCount: backupData.records?.length || 0,
				checksum: '', // Will be calculated after writing
				metadata: {
					version: '1.0.0',
					createdBy: 'MigrationBackupManager',
					compression: this.options.compression,
					encryption: this.options.encrypt
				}
			};

			// Write backup file
			const backupContent = JSON.stringify({
				info: backupInfo,
				data: backupData
			}, null, 2);

			await fs.writeFile(backupPath, backupContent, 'utf8');

			// Update backup info with actual file size and checksum
			const stats = await fs.stat(backupPath);
			backupInfo.size = stats.size;
			backupInfo.checksum = this.calculateChecksum(backupContent);

			// Update file with checksum
			const updatedContent = JSON.stringify({
				info: backupInfo,
				data: backupData
			}, null, 2);
			await fs.writeFile(backupPath, updatedContent, 'utf8');

			// Verify backup integrity if requested
			if (this.options.verifyIntegrity) {
				await this.verifyBackup(backupPath);
			}

			return backupPath;

		} catch (error) {
			throw new Error(
				`Failed to create backup for ${doctypeName}: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Create a backup for a specific column
	 * @param doctypeName Name of DocType
	 * @param columnName Name of column to backup
	 * @returns Promise resolving to backup file path
	 */
	async createColumnBackup(doctypeName: string, columnName: string): Promise<string> {
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const fileName = this.options.namingPattern
			.replace('{doctype}', doctypeName)
			.replace('{timestamp}', timestamp)
			.replace('{type}', `column_${columnName}`);
		
		const backupPath = path.join(this.options.storagePath, `${fileName}.json`);
		
		try {
			// Get table info to verify column exists
			const tableInfo = await this.database.get_table_info(doctypeName);
			const column = tableInfo.columns.find(c => c.name === columnName);
			
			if (!column) {
				throw new Error(`Column '${columnName}' not found in table '${doctypeName}'`);
			}

			// Get all data for the column
			const query = `SELECT name, ${columnName} FROM ${doctypeName}`;
			const records = await this.database.sql(query);

			const backupData = {
				table: doctypeName,
				column: columnName,
				columnInfo: column,
				records,
				metadata: {
					recordCount: records.length,
					columnType: column.type,
					nullable: column.nullable,
					defaultValue: column.default_value
				}
			};

			// Create backup info
			const backupInfo: BackupInfo = {
				id: this.generateBackupId(),
				doctype: doctypeName,
				type: BackupType.COLUMN,
				createdAt: new Date(),
				path: backupPath,
				size: 0, // Will be updated after writing
				compressed: this.options.compression !== 'none',
				encrypted: this.options.encrypt,
				recordCount: records.length,
				checksum: '', // Will be calculated after writing
				metadata: {
					column: columnName,
					version: '1.0.0'
				}
			};

			// Write backup file
			const backupContent = JSON.stringify({
				info: backupInfo,
				data: backupData
			}, null, 2);

			await fs.writeFile(backupPath, backupContent, 'utf8');

			// Update backup info with actual file size and checksum
			const stats = await fs.stat(backupPath);
			backupInfo.size = stats.size;
			backupInfo.checksum = this.calculateChecksum(backupContent);

			// Update file with checksum
			const updatedContent = JSON.stringify({
				info: backupInfo,
				data: backupData
			}, null, 2);
			await fs.writeFile(backupPath, updatedContent, 'utf8');

			return backupPath;

		} catch (error) {
			throw new Error(
				`Failed to create column backup for ${doctypeName}.${columnName}: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Restore data from a backup file
	 * @param backupPath Path to backup file
	 * @returns Promise resolving to RestoreResult
	 */
	async restoreFromBackup(backupPath: string): Promise<RestoreResult> {
		const startTime = Date.now();
		const warnings: string[] = [];
		const errors: string[] = [];
		let recordCount: number | undefined;
		let validated = false;
		let validation: ValidationResults | undefined;

		try {
			// Verify backup file exists
			await fs.access(backupPath);

			// Read and parse backup file
			const backupContent = await fs.readFile(backupPath, 'utf8');
			const backup = JSON.parse(backupContent);

			// Verify backup integrity
			if (this.options.verifyIntegrity) {
				const expectedChecksum = backup.info.checksum;
				const actualChecksum = this.calculateChecksum(backupContent);
				
				if (expectedChecksum !== actualChecksum) {
					errors.push(`Backup integrity check failed: checksum mismatch`);
					return {
						success: false,
						recordCount,
						executionTime: Date.now() - startTime,
						warnings,
						errors,
						validated,
						validation
					};
				}
			}

			// Restore based on backup type
			switch (backup.info.type) {
				case 'FULL':
					recordCount = await this.restoreFullBackup(backup.data);
					break;
				case 'COLUMN':
					recordCount = await this.restoreColumnBackup(backup.data);
					break;
				case 'SCHEMA':
					recordCount = await this.restoreSchemaBackup(backup.data);
					break;
				case 'INCREMENTAL':
					recordCount = await this.restoreFullBackup(backup.data);
					break;
				default:
					throw new Error(`Unsupported backup type: ${backup.info.type}`);
			}

			// Validate restored data if requested
			if (this.options.verifyIntegrity) {
				validation = await this.validateRestoredData(
					backup.info.doctype,
					backup.data
				);
				validated = validation.valid;
				
				if (!validation.valid) {
					warnings.push(...validation.warnings);
					errors.push(...validation.errors);
				}
			}

			return {
				success: errors.length === 0,
				recordCount,
				executionTime: Date.now() - startTime,
				warnings,
				errors,
				validated,
				validation
			};

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			errors.push(`Restore failed: ${errorMessage}`);

			return {
				success: false,
				recordCount,
				executionTime: Date.now() - startTime,
				warnings,
				errors,
				validated,
				validation
			};
		}
	}

	/**
	 * List available backups for a DocType or all backups
	 * @param doctypeName Optional DocType name to filter by
	 * @returns Promise resolving to array of BackupInfo
	 */
	async listBackups(doctypeName?: string): Promise<BackupInfo[]> {
		try {
			const files = await fs.readdir(this.options.storagePath);
			const backupFiles = files.filter(file => file.endsWith('.json'));
			const backups: BackupInfo[] = [];

			for (const file of backupFiles) {
				try {
					const filePath = path.join(this.options.storagePath, file);
					const content = await fs.readFile(filePath, 'utf8');
					const backup = JSON.parse(content);
					const backupInfo = backup.info as BackupInfo;

					// Filter by doctype if specified
					if (!doctypeName || backupInfo.doctype === doctypeName) {
						backups.push(backupInfo);
					}
				} catch (error) {
					// Skip invalid backup files
					console.warn(`Invalid backup file: ${file}`, error);
				}
			}

			// Sort by creation date (newest first)
			return backups.sort((a, b) => 
				b.createdAt.getTime() - a.createdAt.getTime()
			);

		} catch (error) {
			throw new Error(
				`Failed to list backups: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Clean up old backups based on retention policy
	 * @param retentionDays Optional override for default retention days
	 */
	async cleanupOldBackups(retentionDays?: number): Promise<void> {
		const daysToKeep = retentionDays || this.options.retentionDays;
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

		try {
			const backups = await this.listBackups();
			const oldBackups = backups.filter(
				backup => backup.createdAt < cutoffDate
			);

			for (const backup of oldBackups) {
				try {
					await fs.unlink(backup.path);
					console.log(`Deleted old backup: ${backup.path}`);
				} catch (error) {
					console.warn(
						`Failed to delete old backup ${backup.path}:`,
						error
					);
				}
			}

		} catch (error) {
			throw new Error(
				`Failed to cleanup old backups: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Create a full backup (table structure and data)
	 * @param doctypeName Name of DocType to backup
	 * @returns Promise resolving to backup data
	 */
	private async createFullBackup(doctypeName: string): Promise<any> {
		// Get table structure
		const tableInfo = await this.database.get_table_info(doctypeName);
		
		// Get all data
		const records = await this.database.sql(`SELECT * FROM ${doctypeName}`);

		return {
			type: 'FULL',
			table: doctypeName,
			structure: {
				columns: tableInfo.columns,
				indexes: tableInfo.indexes,
				foreignKeys: tableInfo.foreign_keys
			},
			records,
			metadata: {
				recordCount: records.length,
				columnCount: tableInfo.columns.length,
				indexCount: tableInfo.indexes.length,
				foreignKeyCount: tableInfo.foreign_keys.length
			}
		};
	}

	/**
	 * Create a schema-only backup (table structure without data)
	 * @param doctypeName Name of DocType to backup
	 * @returns Promise resolving to backup data
	 */
	private async createSchemaBackup(doctypeName: string): Promise<any> {
		// Get table structure
		const tableInfo = await this.database.get_table_info(doctypeName);

		return {
			type: 'SCHEMA',
			table: doctypeName,
			structure: {
				columns: tableInfo.columns,
				indexes: tableInfo.indexes,
				foreignKeys: tableInfo.foreign_keys
			},
			metadata: {
				columnCount: tableInfo.columns.length,
				indexCount: tableInfo.indexes.length,
				foreignKeyCount: tableInfo.foreign_keys.length
			}
		};
	}

	/**
	 * Restore from a full backup
	 * @param backupData Backup data
	 * @returns Promise resolving to number of restored records
	 */
	private async restoreFullBackup(backupData: any): Promise<number> {
		const { table, structure, records } = backupData;

		// Start transaction for atomic restore
		return await this.database.withTransaction(async (transaction) => {
			// Drop existing table if it exists
			await this.database.run(`DROP TABLE IF EXISTS ${table}`);

			// Recreate table structure
			await this.restoreTableStructure(table, structure);

			// Restore data if available
			if (records && records.length > 0) {
				await this.restoreTableData(table, records);
			}

			return records.length;
		});
	}

	/**
	 * Restore from a column backup
	 * @param backupData Backup data
	 * @returns Promise resolving to number of restored records
	 */
	private async restoreColumnBackup(backupData: any): Promise<number> {
		const { table, column, records } = backupData;

		// Update records to restore only the specific column
		for (const record of records) {
			const updateSQL = `UPDATE ${table} SET ${column} = ? WHERE name = ?`;
			await this.database.run(updateSQL, [record[column], record.name]);
		}

		return records.length;
	}

	/**
	 * Restore from a schema backup
	 * @param backupData Backup data
	 * @returns Promise resolving to number of restored records (0 for schema-only)
	 */
	private async restoreSchemaBackup(backupData: any): Promise<number> {
		const { table, structure } = backupData;

		// Start transaction for atomic restore
		return await this.database.withTransaction(async (transaction) => {
			// Drop existing table if it exists
			await this.database.run(`DROP TABLE IF EXISTS ${table}`);

			// Recreate table structure
			await this.restoreTableStructure(table, structure);

			return 0; // Schema-only restore doesn't restore data
		});
	}

	/**
	 * Restore table structure from backup
	 * @param tableName Table name
	 * @param structure Table structure
	 */
	private async restoreTableStructure(
		tableName: string,
		structure: any
	): Promise<void> {
		const { columns, indexes, foreignKeys } = structure;

		// Build CREATE TABLE statement
		const columnDefs = columns.map((col: ColumnInfo) => {
			let def = `${col.name} ${col.type}`;
			
			if (!col.nullable) {
				def += ' NOT NULL';
			}
			
			if (col.default_value !== undefined && col.default_value !== null) {
				def += ` DEFAULT ${col.default_value}`;
			}
			
			return def;
		});

		let createSQL = `CREATE TABLE ${tableName} (${columnDefs.join(', ')})`;

		// Add primary key if name column exists
		const nameColumn = columns.find((col: any) => col.name === 'name');
		if (nameColumn) {
			createSQL += ', PRIMARY KEY (name)';
		}

		await this.database.run(createSQL);

		// Create indexes
		if (this.options.includeIndexes) {
			for (const index of indexes) {
				const indexSQL = `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${index.name} ON ${tableName} (${index.columns.join(', ')})`;
				await this.database.run(indexSQL);
			}
		}
	}

	/**
	 * Restore table data from backup
	 * @param tableName Table name
	 * @param records Records to restore
	 */
	private async restoreTableData(tableName: string, records: any[]): Promise<void> {
		if (records.length === 0) {
			return;
		}

		// Get column names from first record
		const columns = Object.keys(records[0]);
		const placeholders = columns.map(() => '?').join(', ');
		const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

		for (const record of records) {
			const values = columns.map(col => record[col]);
			await this.database.run(insertSQL, values);
		}
	}

	/**
	 * Validate restored data against backup
	 * @param doctypeName DocType name
	 * @param backupData Original backup data
	 * @returns Promise resolving to ValidationResults
	 */
	private async validateRestoredData(
		doctypeName: string,
		backupData: any
	): Promise<ValidationResults> {
		const warnings: string[] = [];
		const errors: string[] = [];
		let valid = true;

		try {
			// Get current table info
			const currentTableInfo = await this.database.get_table_info(doctypeName);
			const backupStructure = backupData.structure;

			// Compare column counts
			if (currentTableInfo.columns.length !== backupStructure.columns.length) {
				errors.push(
					`Column count mismatch: expected ${backupStructure.columns.length}, got ${currentTableInfo.columns.length}`
				);
				valid = false;
			}

			// Compare record counts if data was backed up
			if (backupData.records) {
				const currentRecords = await this.database.sql(`SELECT COUNT(*) as count FROM ${doctypeName}`);
				const currentCount = currentRecords[0].count;
				const expectedCount = backupData.records.length;

				if (currentCount !== expectedCount) {
					errors.push(
						`Record count mismatch: expected ${expectedCount}, got ${currentCount}`
					);
					valid = false;
				}
			}

			return {
				valid,
				errors,
				warnings,
				details: {
					columnCount: currentTableInfo.columns.length,
					expectedColumnCount: backupStructure.columns.length,
					recordCount: backupData.records ? backupData.records.length : 0,
					currentRecordCount: backupData.records 
						? (await this.database.sql(`SELECT COUNT(*) as count FROM ${doctypeName}`))[0].count 
						: 0
				}
			};

		} catch (error) {
			return {
				valid: false,
				errors: [`Validation failed: ${error instanceof Error ? error.message : String(error)}`],
				warnings,
				details: {}
			};
		}
	}

	/**
	 * Verify backup file integrity
	 * @param backupPath Path to backup file
	 */
	private async verifyBackup(backupPath: string): Promise<void> {
		try {
			const content = await fs.readFile(backupPath, 'utf8');
			const backup = JSON.parse(content);

			// Basic structure validation
			if (!backup.info || !backup.data) {
				throw new Error('Invalid backup file structure');
			}

			// Checksum verification
			const expectedChecksum = backup.info.checksum;
			const actualChecksum = this.calculateChecksum(content);
			
			if (expectedChecksum !== actualChecksum) {
				throw new Error('Backup checksum mismatch');
			}

		} catch (error) {
			throw new Error(
				`Backup verification failed: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Calculate SHA-256 checksum of content
	 * @param content Content to checksum
	 * @returns Hex string of checksum
	 */
	private calculateChecksum(content: string): string {
		return crypto.createHash('sha256').update(content).digest('hex');
	}

	/**
	 * Generate a unique backup ID
	 * @returns Unique backup ID
	 */
	private generateBackupId(): string {
		return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Ensure backup directory exists
	 */
	private async ensureBackupDirectory(): Promise<void> {
		try {
			await fs.mkdir(this.options.storagePath, { recursive: true });
		} catch (error) {
			// Directory might already exist
			if ((error as any).code !== 'EEXIST') {
				throw error;
			}
		}
	}
}