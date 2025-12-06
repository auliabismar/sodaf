/**
 * SODAF Framework Main Entry Point
 * 
 * This module provides the main SODAF framework instance with singleton pattern
 * for easy access to all core modules.
 */

import { Database, SQLiteDatabase } from './database';
import { SchemaManager } from './schema';
import { NamingManager } from './naming';
import { SiteManager } from './site';
import type { DatabaseConfig } from './database/types';

/**
 * SODAF Framework class
 * 
 * This is the main entry point for the SODAF framework. It provides
 * access to all core modules and manages framework state.
 */
export class SodafFramework {
	/**
	 * Singleton instance
	 */
	private static instance: SodafFramework | null = null;

	/**
	 * Database instance
	 */
	public db: Database | null = null;

	/**
	 * Site manager instance
	 */
	public site: SiteManager | null = null;

	/**
	 * Schema manager instance
	 */
	public schema: SchemaManager | null = null;

	/**
	 * Naming manager instance
	 */
	public naming: NamingManager | null = null;

	/**
	 * Private constructor for singleton pattern
	 */
	private constructor() {}

	/**
	 * Get the singleton instance
	 * @returns SodafFramework instance
	 */
	public static getInstance(): SodafFramework {
		if (!SodafFramework.instance) {
			SodafFramework.instance = new SodafFramework();
		}
		return SodafFramework.instance;
	}

	/**
	 * Initialize the SODAF framework
	 * @param siteName Site name to initialize
	 * @param config Optional database configuration
	 * @returns Promise that resolves when initialization is complete
	 */
	public async init(siteName: string, config?: DatabaseConfig): Promise<void> {
		// Initialize database
		this.db = new SQLiteDatabase(config);

		// Initialize site manager
		this.site = SiteManager.getInstance();

		// Initialize schema manager
		this.schema = new SchemaManager(this.db);

		// Initialize naming manager
		this.naming = new NamingManager(this.db);

		// Create or get site context
		try {
			await this.site.createSite(siteName);
		} catch (error) {
			// Site might already exist, which is fine
			if (!(error instanceof Error) || !error.message.includes('already exists')) {
				throw error;
			}
		}
	}

	/**
	 * Reset the framework (for testing purposes)
	 */
	public reset(): void {
		this.db = null;
		this.site = null;
		this.schema = null;
		this.naming = null;
	}

	/**
	 * Close the framework and clean up resources
	 */
	public async close(): Promise<void> {
		if (this.db) {
			await this.db.close();
		}
		this.reset();
	}
}

/**
 * Default SODAF framework instance
 * 
 * This is the main export that users will interact with.
 * It provides a singleton instance of the framework.
 */
export const sodaf = SodafFramework.getInstance();

/**
 * Initialize the SODAF framework
 * 
 * This is a convenience function that initializes the framework
 * with the given site name and optional configuration.
 * 
 * @param siteName Site name to initialize
 * @param config Optional database configuration
 * @returns Promise that resolves when initialization is complete
 */
export async function init(siteName: string, config?: DatabaseConfig): Promise<void> {
	await sodaf.init(siteName, config);
}

/**
 * Reset the framework (for testing purposes)
 */
export function reset(): void {
	sodaf.reset();
}

/**
 * Close the framework and clean up resources
 */
export async function close(): Promise<void> {
	await sodaf.close();
}