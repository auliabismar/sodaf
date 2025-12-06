/**
 * Site Configuration Types and Interfaces
 * 
 * This module defines TypeScript interfaces for site configuration, context, and limits
 * as specified in PRD Section 1.1.
 */

/**
 * Interface defining the limits and quotas for a site
 */
export interface SiteLimits {
	/** Maximum number of users allowed */
	max_users?: number;
	/** Maximum storage space in bytes */
	max_space?: number;
	/** Maximum number of emails that can be sent */
	max_emails?: number;
}

/**
 * Interface defining the configuration for a site
 */
export interface SiteConfig {
	/** Database name for the site */
	db_name: string;
	/** Database type - currently only 'sqlite' is supported */
	db_type: 'sqlite';
	/** Optional encryption key for database */
	encryption_key?: string;
	/** Whether the site is in maintenance mode */
	maintenance_mode: boolean;
	/** Whether the site is in developer mode */
	developer_mode: boolean;
	/** Maximum file size in bytes */
	max_file_size: number;
	/** Array of allowed file types */
	allowed_file_types: string[];
	/** Session expiry time in seconds */
	session_expiry: number;
	/** Optional limits for the site */
	limits?: SiteLimits;
}

/**
 * Interface defining the context for a site
 */
export interface SiteContext {
	/** Name of the site */
	site_name: string;
	/** Path to the site's database file */
	db_path: string;
	/** Configuration for the site */
	config: SiteConfig;
	/** Path to public files directory */
	files_path: string;
	/** Path to private files directory */
	private_files_path: string;
	/** Path to backups directory */
	backup_path: string;
}