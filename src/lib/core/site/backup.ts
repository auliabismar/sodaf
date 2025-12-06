/**
 * Site Manager - Backup and Restore
 * 
 * This module implements backup and restore functionality for site databases.
 * It provides functionality for creating timestamped backups, restoring from backups,
 * and managing maintenance mode.
 */

import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import Database from 'better-sqlite3';
import { copyFile } from 'fs/promises';
import type { SiteContext } from './types';
import { SiteError, SiteNotFoundError, BackupNotFoundError, InvalidBackupError } from './errors';

// Re-export error classes for convenience
export { BackupNotFoundError, InvalidBackupError };

/**
 * Site Backup Manager class for managing database backups
 */
export class SiteBackupManager {
	private siteManager: any; // Direct reference to SiteManager instance

	/**
	 * Constructor
	 * @param siteManager Instance of SiteManager
	 */
	constructor(siteManager: any) {
		// Store direct reference to SiteManager instance
		this.siteManager = siteManager;
	}

	/**
	 * Create a backup of the site database
	 * @param siteName Name of the site to backup
	 * @returns Promise that resolves to the absolute path of the backup file
	 */
	public async backupSite(siteName: string): Promise<string> {
		const site = await this.siteManager.getSite(siteName);
		if (!site) {
			throw new SiteNotFoundError(siteName);
		}

		// Ensure backup directory exists
		await fs.mkdir(site.backup_path, { recursive: true });

		// Generate timestamped backup filename
		const now = new Date();
		const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_').replace(/_+/g, '_');
		const backupFilename = `backup_${timestamp}.sqlite`;
		const backupPath = resolve(site.backup_path, backupFilename);

		// Close any open database connections for this site
		const db = this.siteManager.getDatabase(siteName);
		if (db) {
			// Create a consistent backup by running WAL checkpoint
			db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
		}

		// Copy the database file to the backup location
		await copyFile(site.db_path, backupPath);

		// Verify that the backup is a valid SQLite database
		await this.validateBackup(backupPath);

		return backupPath;
	}

	/**
	 * Restore a site database from a backup
	 * @param siteName Name of the site to restore
	 * @param backupPath Path to the backup file
	 * @returns Promise that resolves when the restore is complete
	 */
	public async restoreSite(siteName: string, backupPath: string): Promise<void> {
		const site = await this.siteManager.getSite(siteName);
		if (!site) {
			throw new SiteNotFoundError(siteName);
		}

		// Check if the backup file exists
		try {
			await fs.access(backupPath);
		} catch (error) {
			throw new BackupNotFoundError(backupPath);
		}

		// Validate the backup file
		await this.validateBackup(backupPath);

		// Create an automatic backup before restore
		await this.backupSite(siteName);

		// Close any open database connections for this site
		const db = this.siteManager.getDatabase(siteName);
		if (db) {
			db.close();
			// Remove from connection map
			(this.siteManager as any).dbConnections.delete(siteName);
		}

		// Replace the database file with the backup
		await copyFile(backupPath, site.db_path);

		// Reinitialize the database connection if this was the current site
		const currentSite = this.siteManager.getCurrentSite();
		if (currentSite && currentSite.site_name === siteName) {
			await this.siteManager.initSite(siteName);
			await this.siteManager.switchSite(siteName);
		}
	}

	/**
	 * List all available backups for a site
	 * @param siteName Name of the site
	 * @returns Promise that resolves to an array of backup file paths
	 */
	public async listBackups(siteName: string): Promise<string[]> {
		const site = await this.siteManager.getSite(siteName);
		if (!site) {
			throw new SiteNotFoundError(siteName);
		}

		try {
			await fs.access(site.backup_path);
		} catch (error) {
			// Backup directory doesn't exist, return empty array
			return [];
		}

		try {
			const entries = await fs.readdir(site.backup_path, { withFileTypes: true });
			return entries
				.filter(entry => entry.isFile() && entry.name.startsWith('backup_') && entry.name.endsWith('.sqlite'))
				.map(entry => join(site.backup_path, entry.name))
				.sort(); // Sort by filename (which includes timestamp)
		} catch (error) {
			return [];
		}
	}

	/**
	 * Delete a backup file
	 * @param siteName Name of the site
	 * @param backupPath Path to the backup file to delete
	 * @returns Promise that resolves when the deletion is complete
	 */
	public async deleteBackup(siteName: string, backupPath: string): Promise<void> {
		const site = await this.siteManager.getSite(siteName);
		if (!site) {
			throw new SiteNotFoundError(siteName);
		}

		// Check if the backup file exists
		try {
			await fs.access(backupPath);
		} catch (error) {
			throw new BackupNotFoundError(backupPath);
		}

		// Ensure that the backup is in the correct directory
		// Normalize paths for comparison (handle both Unix and Windows)
		const normalizedBackupPath = resolve(backupPath).replace(/\\/g, '/');
		const normalizedSitePath = resolve(site.backup_path).replace(/\\/g, '/');
		if (!normalizedBackupPath.startsWith(normalizedSitePath)) {
			throw new BackupNotFoundError(backupPath);
		}

		// Delete the backup file
		await fs.unlink(backupPath);
	}

	/**
	 * Set maintenance mode for a site
	 * @param siteName Name of the site
	 * @param enabled Whether maintenance mode should be enabled
	 * @returns Promise that resolves to the updated SiteConfig
	 */
	public async setMaintenanceMode(siteName: string, enabled: boolean): Promise<any> {
		return await this.siteManager.updateSiteConfig(siteName, {
			maintenance_mode: enabled
		});
	}

	/**
	 * Check if a site is in maintenance mode
	 * @param siteName Name of the site
	 * @returns Promise that resolves to true if maintenance mode is enabled
	 */
	public async isMaintenanceMode(siteName: string): Promise<boolean> {
		const config = await this.siteManager.getSiteConfig(siteName);
		return config.maintenance_mode;
	}

	/**
	 * Validate that a backup file is a valid SQLite database
	 * @param backupPath Path to the backup file
	 * @returns Promise that resolves if the backup is valid
	 * @throws InvalidBackupError if the backup is invalid
	 */
	private async validateBackup(backupPath: string): Promise<void> {
		try {
			// Try to open the database and run a simple query
			const db = new Database(backupPath, { readonly: true });
			
			// Check if it's a valid SQLite database by querying the sqlite_master table
			const result = db.prepare('SELECT count(*) as count FROM sqlite_master WHERE type=\'table\'').get() as { count: number };
			
			// Close the database
			db.close();
			
			// If we got here without errors, it's a valid SQLite database
			if (typeof result.count !== 'number') {
				throw new InvalidBackupError(backupPath, 'Invalid database structure');
			}
		} catch (error) {
			if (error instanceof InvalidBackupError) {
				throw error;
			}
			throw new InvalidBackupError(backupPath, error instanceof Error ? error.message : 'Unknown error');
		}
	}

	/**
	 * Get backup information
	 * @param backupPath Path to the backup file
	 * @returns Promise that resolves to backup information
	 */
	public async getBackupInfo(backupPath: string): Promise<{
		path: string;
		size: number;
		created: Date;
		tables: string[];
	}> {
		try {
			// Get file stats
			const stats = await fs.stat(backupPath);
			
			// Open the database to get table information
			const db = new Database(backupPath, { readonly: true });
			const tables = db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\' ORDER BY name').all() as { name: string }[];
			db.close();
			
			return {
				path: backupPath,
				size: stats.size,
				created: stats.birthtime,
				tables: tables.map(t => t.name)
			};
		} catch (error) {
			throw new InvalidBackupError(backupPath, error instanceof Error ? error.message : 'Unknown error');
		}
	}
}