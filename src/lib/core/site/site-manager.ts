/**
 * Site Manager - Core Implementation
 * 
 * This module implements the SiteManager class for creating, switching, and managing tenant sites.
 * It provides functionality for site lifecycle management including creation, initialization,
 * configuration management, and deletion.
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import Database from 'better-sqlite3';
import type { SiteContext, SiteConfig } from './types';
import { SiteBackupManager } from './backup';
import { SiteError, SiteExistsError, SiteNotFoundError } from './errors';

// Re-export error classes for convenience
export { SiteError, SiteExistsError, SiteNotFoundError };

/**
 * Default site configuration
 */
const DEFAULT_SITE_CONFIG: Omit<SiteConfig, 'db_name'> = {
	db_type: 'sqlite',
	maintenance_mode: false,
	developer_mode: false,
	max_file_size: 10485760, // 10MB in bytes
	allowed_file_types: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
	session_expiry: 3600, // 1 hour in seconds
};

/**
 * Site Manager class for managing multi-tenant sites
 */
export class SiteManager {
	private static instance: SiteManager | null = null;
	private currentSite: SiteContext | null = null;
	private sitesDir: string;
	private dbConnections: Map<string, Database.Database> = new Map();
	private backupManager: SiteBackupManager | null = null;

	/**
	 * Private constructor for singleton pattern
	 * @param sitesDir Path to the sites directory
	 */
	private constructor(sitesDir: string = 'sites') {
		this.sitesDir = sitesDir;
		this.backupManager = new SiteBackupManager(this);
	}

	/**
	 * Get the singleton instance of SiteManager
	 * @param sitesDir Path to the sites directory (only used on first call)
	 * @returns SiteManager instance
	 */
	public static getInstance(sitesDir?: string): SiteManager {
		// For testing purposes, always create a new instance if sitesDir is provided
		// This ensures test isolation by using different directories for different test suites
		if (sitesDir) {
			return new SiteManager(sitesDir);
		}
		if (!SiteManager.instance) {
			SiteManager.instance = new SiteManager('sites');
		}
		return SiteManager.instance;
	}

	/**
	 * Reset the singleton instance (for testing purposes)
	 */
	public static resetInstance(): void {
		if (SiteManager.instance) {
			// Close all database connections
			for (const [siteName, db] of SiteManager.instance.dbConnections) {
				db.close();
			}
			SiteManager.instance.dbConnections.clear();
			// Reset backup manager
			SiteManager.instance.backupManager = null;
		}
		SiteManager.instance = null;
	}

	/**
	 * Create a new site with the given name and optional configuration
	 * @param siteName Name of the site to create
	 * @param config Optional custom configuration
	 * @returns Promise that resolves to the created SiteContext
	 */
	public async createSite(siteName: string, config?: Partial<SiteConfig>): Promise<SiteContext> {
		// Validate site name
		if (!siteName || !/^[a-zA-Z0-9_-]+$/.test(siteName)) {
			throw new SiteError('Site name must contain only alphanumeric characters, hyphens, and underscores');
		}

		// Check if site already exists
		const sitePath = join(this.sitesDir, siteName);
		try {
			await fs.access(sitePath);
			throw new SiteExistsError(siteName);
		} catch (error) {
			if (!(error instanceof SiteExistsError)) {
				// Site doesn't exist, continue with creation
			} else {
				throw error;
			}
		}

		// Create site directory structure
		await fs.mkdir(sitePath, { recursive: true });
		await fs.mkdir(join(sitePath, 'public'), { recursive: true });
		await fs.mkdir(join(sitePath, 'private'), { recursive: true });
		await fs.mkdir(join(sitePath, 'backups'), { recursive: true });

		// Create site configuration
		const siteConfig: SiteConfig = {
			...DEFAULT_SITE_CONFIG,
			db_name: `${siteName}.sqlite`,
			...config,
		};

		// Write configuration file
		const configPath = join(sitePath, 'site_config.json');
		await fs.writeFile(configPath, JSON.stringify(siteConfig, null, '\t'));

		// Create database file
		const dbPath = join(sitePath, siteConfig.db_name);
		const db = new Database(dbPath);
		
		// Enable WAL mode for better concurrency
		db.pragma('journal_mode = WAL');
		db.pragma('foreign_keys = ON');
		
		// Create basic tables
		this.createBasicTables(db);
		db.close();

		// Return site context
		return {
			site_name: siteName,
			db_path: dbPath,
			config: siteConfig,
			files_path: join(sitePath, 'public'),
			private_files_path: join(sitePath, 'private'),
			backup_path: join(sitePath, 'backups'),
		};
	}

	/**
	 * Get site context for an existing site
	 * @param siteName Name of the site
	 * @returns Promise that resolves to SiteContext or null if not found
	 */
	public async getSite(siteName: string): Promise<SiteContext | null> {
		try {
			const sitePath = join(this.sitesDir, siteName);
			await fs.access(sitePath);

			// Read configuration
			const configPath = join(sitePath, 'site_config.json');
			const configData = await fs.readFile(configPath, 'utf-8');
			const config: SiteConfig = JSON.parse(configData);

			return {
				site_name: siteName,
				db_path: join(sitePath, config.db_name),
				config,
				files_path: join(sitePath, 'public'),
				private_files_path: join(sitePath, 'private'),
				backup_path: join(sitePath, 'backups'),
			};
		} catch (error) {
			return null;
		}
	}

	/**
	 * List all available sites
	 * @returns Promise that resolves to an array of SiteContext objects
	 */
	public async listSites(): Promise<SiteContext[]> {
		try {
			await fs.access(this.sitesDir);
		} catch (error) {
			// Sites directory doesn't exist, return empty array
			return [];
		}

		try {
			const entries = await fs.readdir(this.sitesDir, { withFileTypes: true });
			const siteNames = entries
				.filter(entry => entry.isDirectory())
				.map(entry => entry.name);

			const sites: SiteContext[] = [];
			for (const siteName of siteNames) {
				const site = await this.getSite(siteName);
				if (site) {
					sites.push(site);
				}
			}

			return sites;
		} catch (error) {
			// If there's any error reading the directory, return empty array
			return [];
		}
	}

	/**
	 * Delete a site and all its data
	 * @param siteName Name of the site to delete
	 * @returns Promise that resolves when deletion is complete
	 */
	public async deleteSite(siteName: string): Promise<void> {
		const sitePath = join(this.sitesDir, siteName);
		
		try {
			await fs.access(sitePath);
		} catch (error) {
			throw new SiteNotFoundError(siteName);
		}

		// Close any open database connections
		if (this.dbConnections.has(siteName)) {
			const db = this.dbConnections.get(siteName);
			if (db) {
				db.close();
			}
			this.dbConnections.delete(siteName);
		}

		// If this is the current site, unset it
		if (this.currentSite && this.currentSite.site_name === siteName) {
			this.currentSite = null;
		}

		// Remove the entire site directory
		await fs.rm(sitePath, { recursive: true, force: true });
	}

	/**
	 * Initialize a site and establish database connection
	 * @param siteName Name of the site to initialize
	 * @returns Promise that resolves to SiteContext
	 */
	public async initSite(siteName: string): Promise<SiteContext> {
		const site = await this.getSite(siteName);
		if (!site) {
			throw new SiteNotFoundError(siteName);
		}

		// Open database connection
		const db = new Database(site.db_path);
		db.pragma('journal_mode = WAL');
		db.pragma('foreign_keys = ON');
		
		this.dbConnections.set(siteName, db);

		return site;
	}

	/**
	 * Switch to a different site
	 * @param siteName Name of the site to switch to
	 * @returns Promise that resolves to SiteContext
	 */
	public async switchSite(siteName: string): Promise<SiteContext> {
		const site = await this.initSite(siteName);
		this.currentSite = site;
		return site;
	}

	/**
	 * Get the current active site
	 * @returns Current SiteContext or null if no site is active
	 */
	public getCurrentSite(): SiteContext | null {
		return this.currentSite;
	}

	/**
	 * Get the database connection for a site
	 * @param siteName Name of the site
	 * @returns Database instance or null if not initialized
	 */
	public getDatabase(siteName: string): Database.Database | null {
		return this.dbConnections.get(siteName) || null;
	}

	/**
	 * Get the configuration for a site
	 * @param siteName Name of the site
	 * @returns Promise that resolves to SiteConfig
	 */
	public async getSiteConfig(siteName: string): Promise<SiteConfig> {
		const site = await this.getSite(siteName);
		if (!site) {
			throw new SiteNotFoundError(siteName);
		}
		return site.config;
	}

	/**
	 * Update the configuration for a site
	 * @param siteName Name of the site
	 * @param updates Partial configuration updates
	 * @returns Promise that resolves to the updated SiteConfig
	 */
	public async updateSiteConfig(siteName: string, updates: Partial<SiteConfig>): Promise<SiteConfig> {
		const site = await this.getSite(siteName);
		if (!site) {
			throw new SiteNotFoundError(siteName);
		}

		// Merge updates with existing config
		const updatedConfig: SiteConfig = {
			...site.config,
			...updates,
		};

		// Write updated configuration
		const configPath = join(this.sitesDir, siteName, 'site_config.json');
		await fs.writeFile(configPath, JSON.stringify(updatedConfig, null, '\t'));

		// Update current site context if this is the active site
		if (this.currentSite && this.currentSite.site_name === siteName) {
			this.currentSite.config = updatedConfig;
		}

		return updatedConfig;
	}

	/**
		* Get the backup manager instance
		* @returns SiteBackupManager instance
		*/
	public getBackupManager(): SiteBackupManager {
		if (!this.backupManager) {
			this.backupManager = new SiteBackupManager(this);
		}
		return this.backupManager;
	}

	/**
	 * Create basic database tables for a new site
	 * @param db Database instance
	 */
	private createBasicTables(db: Database.Database): void {
		// Create a basic table for system information
		db.exec(`
			CREATE TABLE IF NOT EXISTS "tabSystem" (
				name VARCHAR(140) NOT NULL PRIMARY KEY,
				value TEXT,
				created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);
		`);

		// Create a basic table for sessions
		db.exec(`
			CREATE TABLE IF NOT EXISTS "tabSessions" (
				sid VARCHAR(180) NOT NULL PRIMARY KEY,
				sessiondata TEXT,
				expiry DATETIME,
				created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);
		`);

		// Insert basic system information
		const systemInfo = db.prepare('INSERT OR IGNORE INTO "tabSystem" (name, value) VALUES (?, ?)');
		systemInfo.run('version', '1.0.0');
		systemInfo.run('db_created_at', new Date().toISOString());
	}
}