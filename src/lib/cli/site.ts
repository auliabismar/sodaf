/**
 * Site Management
 * 
 * This file implements site management functionality for CLI system, including
 * site configuration loading, context creation, and site operations.
 */

import type { SiteConfig, SiteContext } from '../core/site/types';
import type { Database } from '../core/database/database';
import type { ExecutionContext, CLIConfig } from './types';
import { ConfigManager } from './config';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';

/**
 * Site configuration with additional metadata
 */
export interface SiteInfo {
	/** Site name */
	name: string;
	
	/** Site configuration */
	config: SiteConfig;
	
	/** Site file path */
	filePath: string;
	
	/** Whether site is active */
	active: boolean;
	
	/** Site creation date */
	createdAt: Date;
	
	/** Site last modified date */
	modifiedAt: Date;
}

/**
 * Site manager
 */
export class SiteManager {
	private sitesDir: string;
	private sites: Map<string, SiteInfo> = new Map();
	
	/**
	 * Create a new site manager
	 * @param sitesDir Sites directory path
	 */
	constructor(sitesDir: string) {
		this.sitesDir = sitesDir;
		this.loadSites();
	}
	
	/**
	 * Load all sites from sites directory
	 */
	private loadSites(): void {
		if (!existsSync(this.sitesDir)) {
			return;
		}
		
		try {
			const files = readdirSync(this.sitesDir);
			
			for (const file of files) {
				if (file.endsWith('.json')) {
					const filePath = join(this.sitesDir, file);
					const siteName = basename(file, '.json');
					
					try {
						const content = readFileSync(filePath, 'utf-8');
						const config = JSON.parse(content) as SiteConfig;
						
						const siteInfo: SiteInfo = {
							name: siteName,
							config,
							filePath,
							active: false,
							createdAt: new Date(),
							modifiedAt: new Date()
						};
						
						this.sites.set(siteName, siteInfo);
					} catch (error) {
						console.warn(`Failed to load site ${siteName}: ${error}`);
					}
				}
			}
		} catch (error) {
			throw new Error(`Failed to load sites from ${this.sitesDir}: ${error}`);
		}
	}
	
	/**
	 * Get all sites
	 * @returns Array of site information
	 */
	getSites(): SiteInfo[] {
		return Array.from(this.sites.values());
	}
	
	/**
	 * Get a specific site
	 * @param name Site name
	 * @returns Site information or null if not found
	 */
	getSite(name: string): SiteInfo | null {
		return this.sites.get(name) || null;
	}
	
	/**
	 * Create a new site
	 * @param name Site name
	 * @param config Site configuration
	 * @returns Created site information
	 */
	createSite(name: string, config: SiteConfig): SiteInfo {
		// Validate site name
		if (!name || name.trim() === '') {
			throw new Error('Site name cannot be empty');
		}
		
		if (this.sites.has(name)) {
			throw new Error(`Site '${name}' already exists`);
		}
		
		// Validate configuration
		this.validateSiteConfig(config);
		
		// Ensure sites directory exists
		if (!existsSync(this.sitesDir)) {
			mkdirSync(this.sitesDir, { recursive: true });
		}
		
		// Create site file
		const filePath = join(this.sitesDir, `${name}.json`);
		const siteInfo: SiteInfo = {
			name,
			config,
			filePath,
			active: false,
			createdAt: new Date(),
			modifiedAt: new Date()
		};
		
		// Save site configuration
		this.saveSite(siteInfo);
		
		// Add to in-memory sites
		this.sites.set(name, siteInfo);
		
		return siteInfo;
	}
	
	/**
	 * Update an existing site
	 * @param name Site name
	 * @param config New site configuration
	 * @returns Updated site information
	 */
	updateSite(name: string, config: SiteConfig): SiteInfo {
		const siteInfo = this.sites.get(name);
		if (!siteInfo) {
			throw new Error(`Site '${name}' not found`);
		}
		
		// Validate configuration
		this.validateSiteConfig(config);
		
		// Update site
		siteInfo.config = config;
		siteInfo.modifiedAt = new Date();
		
		// Save site configuration
		this.saveSite(siteInfo);
		
		// Update in-memory sites
		this.sites.set(name, siteInfo);
		
		return siteInfo;
	}
	
	/**
	 * Delete a site
	 * @param name Site name
	 */
	deleteSite(name: string): void {
		const siteInfo = this.sites.get(name);
		if (!siteInfo) {
			throw new Error(`Site '${name}' not found`);
		}
		
		// Delete site file
		try {
			require('fs').unlinkSync(siteInfo.filePath);
		} catch (error) {
			throw new Error(`Failed to delete site file: ${error}`);
		}
		
		// Remove from in-memory sites
		this.sites.delete(name);
	}
	
	/**
	 * Set active site
	 * @param name Site name or null to deactivate all
	 */
	setActiveSite(name: string | null): void {
		// Deactivate all sites
		for (const siteInfo of this.sites.values()) {
			siteInfo.active = false;
		}
		
		// Activate specified site
		if (name) {
			const siteInfo = this.sites.get(name);
			if (siteInfo) {
				siteInfo.active = true;
			}
		}
		
		// Save active site to file
		this.saveActiveSite(name);
	}
	
	/**
	 * Get active site
	 * @returns Active site name or null
	 */
	getActiveSite(): string | null {
		const activeFile = join(this.sitesDir, '.active');
		
		if (!existsSync(activeFile)) {
			return null;
		}
		
		try {
			const content = readFileSync(activeFile, 'utf-8');
			return content.trim() || null;
		} catch (error) {
			return null;
		}
	}
	
	/**
	 * Create site context for execution
	 * @param name Site name or null for active site
	 * @param config CLI configuration
	 * @returns Promise resolving to site context
	 */
	async createSiteContext(
		name: string | null,
		config: CLIConfig
	): Promise<SiteContext> {
		// Get site name
		const siteName = name || config.defaultSite || this.getActiveSite();
		if (!siteName) {
			throw new Error('No site specified and no active site found');
		}
		
		// Get site information
		const siteInfo = this.sites.get(siteName);
		if (!siteInfo) {
			throw new Error(`Site '${siteName}' not found`);
		}
		
		// Create site context
		const context: SiteContext = {
			site_name: siteName,
			db_path: this.getDatabasePath(siteInfo),
			config: siteInfo.config,
			files_path: this.getFilesPath(siteInfo),
			private_files_path: this.getPrivateFilesPath(siteInfo),
			backup_path: this.getBackupPath(siteInfo)
		};
		
		return context;
	}
	
	/**
	 * Get database path for a site
	 * @param siteInfo Site information
	 * @returns Database file path
	 */
	private getDatabasePath(siteInfo: SiteInfo): string {
		const siteDir = dirname(siteInfo.filePath);
		return join(siteDir, 'database', `${siteInfo.name}.db`);
	}
	
	/**
	 * Get files path for a site
	 * @param siteInfo Site information
	 * @returns Files directory path
	 */
	private getFilesPath(siteInfo: SiteInfo): string {
		const siteDir = dirname(siteInfo.filePath);
		return join(siteDir, 'files');
	}
	
	/**
	 * Get private files path for a site
	 * @param siteInfo Site information
	 * @returns Private files directory path
	 */
	private getPrivateFilesPath(siteInfo: SiteInfo): string {
		const siteDir = dirname(siteInfo.filePath);
		return join(siteDir, 'private');
	}
	
	/**
	 * Get backup path for a site
	 * @param siteInfo Site information
	 * @returns Backup directory path
	 */
	private getBackupPath(siteInfo: SiteInfo): string {
		const siteDir = dirname(siteInfo.filePath);
		return join(siteDir, 'backups');
	}
	
	/**
	 * Validate site configuration
	 * @param config Site configuration
	 */
	private validateSiteConfig(config: SiteConfig): void {
		if (!config.db_name) {
			throw new Error('Site configuration must specify db_name');
		}
		
		if (!config.db_type) {
			throw new Error('Site configuration must specify db_type');
		}
		
		if (config.db_type !== 'sqlite') {
			throw new Error('Only sqlite database type is currently supported');
		}
		
		if (typeof config.maintenance_mode !== 'boolean') {
			throw new Error('Site configuration maintenance_mode must be a boolean');
		}
		
		if (typeof config.developer_mode !== 'boolean') {
			throw new Error('Site configuration developer_mode must be a boolean');
		}
		
		if (typeof config.max_file_size !== 'number' || config.max_file_size <= 0) {
			throw new Error('Site configuration max_file_size must be a positive number');
		}
		
		if (!Array.isArray(config.allowed_file_types)) {
			throw new Error('Site configuration allowed_file_types must be an array');
		}
		
		if (typeof config.session_expiry !== 'number' || config.session_expiry <= 0) {
			throw new Error('Site configuration session_expiry must be a positive number');
		}
	}
	
	/**
	 * Save site configuration to file
	 * @param siteInfo Site information
	 */
	private saveSite(siteInfo: SiteInfo): void {
		try {
			const content = JSON.stringify(siteInfo.config, null, 2);
			writeFileSync(siteInfo.filePath, content, 'utf-8');
		} catch (error) {
			throw new Error(`Failed to save site ${siteInfo.name}: ${error}`);
		}
	}
	
	/**
	 * Save active site name
	 * @param name Active site name or null
	 */
	private saveActiveSite(name: string | null): void {
		try {
			const activeFile = join(this.sitesDir, '.active');
			const content = name ? `${name}\n` : '';
			writeFileSync(activeFile, content, 'utf-8');
		} catch (error) {
			console.warn(`Failed to save active site: ${error}`);
		}
	}
	
	/**
	 * Get default sites directory
	 * @param workingDirectory Working directory
	 * @returns Sites directory path
	 */
	static getDefaultSitesDir(workingDirectory: string = process.cwd()): string {
		// Check for sites directory in working directory
		const localSitesDir = join(workingDirectory, 'sites');
		if (existsSync(localSitesDir)) {
			return localSitesDir;
		}
		
		// Check for sites directory in user home
		const homeSitesDir = join(require('os').homedir(), '.sodaf', 'sites');
		return homeSitesDir;
	}
	
	/**
	 * Create a site manager from CLI configuration
	 * @param config CLI configuration
	 * @returns Site manager instance
	 */
	static fromConfig(config: CLIConfig): SiteManager {
		const sitesDir = config.sitesDir || this.getDefaultSitesDir();
		return new SiteManager(sitesDir);
	}
}