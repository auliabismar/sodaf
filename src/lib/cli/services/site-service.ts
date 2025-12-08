/**
 * Site Management Service
 * 
 * This file implements the site management service that provides
 * site-related operations for the CLI system.
 */

import type { SiteInfo } from '../site';
import type { SiteContext } from '../../core/site/types';
import type { ExecutionContext, CLIConfig } from '../types';
import { SiteManager } from '../site';

/**
 * Site management service interface
 */
export interface ISiteService {
	/**
	 * Get all sites
	 * @param context Execution context
	 * @returns Promise resolving to array of site information
	 */
	getAllSites(context: ExecutionContext): Promise<SiteInfo[]>;
	
	/**
	 * Get a specific site
	 * @param name Site name
	 * @param context Execution context
	 * @returns Promise resolving to site information or null
	 */
	getSite(name: string, context: ExecutionContext): Promise<SiteInfo | null>;
	
	/**
	 * Create a new site
	 * @param name Site name
	 * @param config Site configuration
	 * @param context Execution context
	 * @returns Promise resolving to created site information
	 */
	createSite(name: string, config: any, context: ExecutionContext): Promise<SiteInfo>;
	
	/**
	 * Update an existing site
	 * @param name Site name
	 * @param config New site configuration
	 * @param context Execution context
	 * @returns Promise resolving to updated site information
	 */
	updateSite(name: string, config: any, context: ExecutionContext): Promise<SiteInfo>;
	
	/**
	 * Delete a site
	 * @param name Site name
	 * @param context Execution context
	 * @returns Promise resolving when site is deleted
	 */
	deleteSite(name: string, context: ExecutionContext): Promise<void>;
	
	/**
	 * Set active site
	 * @param name Site name or null to deactivate all
	 * @param context Execution context
	 * @returns Promise resolving when active site is set
	 */
	setActiveSite(name: string | null, context: ExecutionContext): Promise<void>;
	
	/**
	 * Get active site
	 * @param context Execution context
	 * @returns Promise resolving to active site name or null
	 */
	getActiveSite(context: ExecutionContext): Promise<string | null>;
	
	/**
	 * Create site context for execution
	 * @param name Site name or null for active site
	 * @param context Execution context
	 * @returns Promise resolving to site context
	 */
	createSiteContext(
		name: string | null,
		context: ExecutionContext
	): Promise<SiteContext>;
}

/**
 * Site management service implementation
 */
export class SiteService implements ISiteService {
	/**
	 * Get all sites
	 * @param context Execution context
	 * @returns Promise resolving to array of site information
	 */
	async getAllSites(context: ExecutionContext): Promise<SiteInfo[]> {
		const sitesDir = this.getSitesDirectory(context);
		const siteManager = new SiteManager(sitesDir);
		return siteManager.getSites();
	}
	
	/**
	 * Get a specific site
	 * @param name Site name
	 * @param context Execution context
	 * @returns Promise resolving to site information or null
	 */
	async getSite(name: string, context: ExecutionContext): Promise<SiteInfo | null> {
		const sitesDir = this.getSitesDirectory(context);
		const siteManager = new SiteManager(sitesDir);
		return siteManager.getSite(name);
	}
	
	/**
	 * Create a new site
	 * @param name Site name
	 * @param config Site configuration
	 * @param context Execution context
	 * @returns Promise resolving to created site information
	 */
	async createSite(name: string, config: any, context: ExecutionContext): Promise<SiteInfo> {
		const sitesDir = this.getSitesDirectory(context);
		const siteManager = new SiteManager(sitesDir);
		
		// Validate configuration
		this.validateSiteConfig(config);
		
		// Create site
		const siteInfo = siteManager.createSite(name, config);
		
		context.logger.info(`Site '${name}' created successfully`);
		return siteInfo;
	}
	
	/**
	 * Update an existing site
	 * @param name Site name
	 * @param config New site configuration
	 * @param context Execution context
	 * @returns Promise resolving to updated site information
	 */
	async updateSite(name: string, config: any, context: ExecutionContext): Promise<SiteInfo> {
		const sitesDir = this.getSitesDirectory(context);
		const siteManager = new SiteManager(sitesDir);
		
		// Validate configuration
		this.validateSiteConfig(config);
		
		// Update site
		const siteInfo = siteManager.updateSite(name, config);
		
		context.logger.info(`Site '${name}' updated successfully`);
		return siteInfo;
	}
	
	/**
	 * Delete a site
	 * @param name Site name
	 * @param context Execution context
	 * @returns Promise resolving when site is deleted
	 */
	async deleteSite(name: string, context: ExecutionContext): Promise<void> {
		const sitesDir = this.getSitesDirectory(context);
		const siteManager = new SiteManager(sitesDir);
		
		// Check if site exists
		const siteInfo = siteManager.getSite(name);
		if (!siteInfo) {
			throw new Error(`Site '${name}' not found`);
		}
		
		// Confirm deletion if not forced
		const confirmed = await this.confirmDeletion(name, siteInfo, context);
		if (!confirmed) {
			context.logger.info(`Site deletion cancelled`);
			return;
		}
		
		// Delete site
		siteManager.deleteSite(name);
		
		context.logger.info(`Site '${name}' deleted successfully`);
	}
	
	/**
	 * Set active site
	 * @param name Site name or null to deactivate all
	 * @param context Execution context
	 * @returns Promise resolving when active site is set
	 */
	async setActiveSite(name: string | null, context: ExecutionContext): Promise<void> {
		const sitesDir = this.getSitesDirectory(context);
		const siteManager = new SiteManager(sitesDir);
		
		siteManager.setActiveSite(name);
		
		if (name) {
			context.logger.info(`Site '${name}' set as active`);
		} else {
			context.logger.info(`Active site cleared`);
		}
	}
	
	/**
	 * Get active site
	 * @param context Execution context
	 * @returns Promise resolving to active site name or null
	 */
	async getActiveSite(context: ExecutionContext): Promise<string | null> {
		const sitesDir = this.getSitesDirectory(context);
		const siteManager = new SiteManager(sitesDir);
		return siteManager.getActiveSite();
	}
	
	/**
	 * Create site context for execution
	 * @param name Site name or null for active site
	 * @param context Execution context
	 * @returns Promise resolving to site context
	 */
	async createSiteContext(
		name: string | null,
		context: ExecutionContext
	): Promise<SiteContext> {
		const sitesDir = this.getSitesDirectory(context);
		const siteManager = new SiteManager(sitesDir);
		return await siteManager.createSiteContext(name, context.config);
	}
	
	/**
	 * Get sites directory
	 * @param context Execution context
	 * @returns Sites directory path
	 */
	private getSitesDirectory(context: ExecutionContext): string {
		return context.config.sitesDir || SiteManager.getDefaultSitesDir();
	}
	
	/**
	 * Validate site configuration
	 * @param config Site configuration
	 */
	private validateSiteConfig(config: any): void {
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
	 * Confirm site deletion with user
	 * @param name Site name
	 * @param siteInfo Site information
	 * @param context Execution context
	 * @returns Promise resolving to confirmation
	 */
	private async confirmDeletion(
		name: string,
		siteInfo: SiteInfo,
		context: ExecutionContext
	): Promise<boolean> {
		// In a real implementation, this would prompt the user
		// For now, we'll assume confirmation in non-interactive mode
		if (context.config.force) {
			return true;
		}
		
		// Show site information and ask for confirmation
		context.output.info(`Site: ${name}`);
		context.output.info(`Database: ${siteInfo.config.db_name}`);
		context.output.info(`Type: ${siteInfo.config.db_type}`);
		context.output.info(`Created: ${siteInfo.createdAt.toISOString()}`);
		
		// For now, always return true (in real implementation, would prompt user)
		return true;
	}
}