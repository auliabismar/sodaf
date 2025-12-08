/**
 * MetaCache Manager - Caching for DocTypeMeta Instances
 * 
 * This module implements the MetaCache class which manages caching of DocTypeMeta
 * instances with proper invalidation support.
 */

import type { DocType } from './types';
import type { DocTypeEngine } from './doctype-engine';
import { DocTypeMeta } from './meta';
import { MetaFactory } from './meta-factory';
import { DocTypeError } from './errors';

/**
 * MetaCache class for managing DocTypeMeta instances
 */
export class MetaCache {
	private static instance: MetaCache | null = null;
	private cache: Map<string, DocTypeMeta> = new Map();
	private engine: DocTypeEngine;
	private loadingPromises: Map<string, Promise<DocTypeMeta | null>> = new Map();

	/**
	 * Private constructor for singleton pattern
	 * @param engine DocTypeEngine instance to use for loading DocTypes
	 */
	private constructor(engine: DocTypeEngine) {
		this.engine = engine;
	}

	/**
	 * Get singleton instance
	 * @param engine Optional DocTypeEngine instance (required for first initialization)
	 * @returns MetaCache singleton instance
	 */
	public static getInstance(engine?: DocTypeEngine): MetaCache {
		if (!MetaCache.instance) {
			if (!engine) {
				throw new DocTypeError('DocTypeEngine required for first initialization');
			}
			MetaCache.instance = new MetaCache(engine);
		} else if (engine) {
			// If an engine is provided and we already have an instance,
			// update the engine reference to ensure we use the latest engine
			MetaCache.instance.engine = engine;
		}
		return MetaCache.instance;
	}

	/**
	 * Reset the singleton instance (for testing purposes)
	 */
	public static resetInstance(): void {
		if (MetaCache.instance) {
			MetaCache.instance.cache.clear();
			MetaCache.instance.loadingPromises.clear();
		}
		MetaCache.instance = null;
	}

	/**
	 * Get Meta instance for a DocType
	 * @param doctypeName Name of the DocType to get Meta for
	 * @returns Promise resolving to DocTypeMeta instance or null if not found
	 */
	public async getMeta(doctypeName: string, includeCustomFields: boolean = true): Promise<DocTypeMeta | null> {
		// Create cache key with includeCustomFields flag
		const cacheKey = `${doctypeName}_${includeCustomFields}`;
		
		// Check cache first
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey)!;
		}

		// Check if already loading (handle concurrent access)
		if (this.loadingPromises.has(cacheKey)) {
			return this.loadingPromises.get(cacheKey)!;
		}

		// Create loading promise
		const loadingPromise = this.loadAndCacheMeta(doctypeName, includeCustomFields);
		this.loadingPromises.set(cacheKey, loadingPromise);

		try {
			return await loadingPromise;
		} finally {
			// Clean up loading promise
			this.loadingPromises.delete(cacheKey);
		}
	}

	/**
	 * Load DocType from engine and cache it
	 * @param doctypeName Name of DocType to load
	 * @returns Promise resolving to DocTypeMeta instance or null if not found
	 */
	private async loadAndCacheMeta(doctypeName: string, includeCustomFields: boolean): Promise<DocTypeMeta | null> {
		// Load DocType from engine
		const doctype = await this.engine.getDocType(doctypeName);
		if (!doctype) {
			return null;
		}

		// Create and cache Meta instance
		const meta = this.createMeta(doctype, includeCustomFields);
		const cacheKey = `${doctypeName}_${includeCustomFields}`;
		this.cache.set(cacheKey, meta);

		return meta;
	}

	/**
	 * Invalidate cached Meta instance
	 * @param doctypeName Name of the DocType to invalidate cache for
	 */
	public invalidateMeta(doctypeName: string): void {
		// Invalidate all cache entries for this DocType (with and without custom fields)
		const keysToDelete: string[] = [];
		for (const key of this.cache.keys()) {
			if (key.startsWith(`${doctypeName}_`)) {
				keysToDelete.push(key);
			}
		}
		
		for (const key of keysToDelete) {
			this.cache.delete(key);
		}
	}

	/**
	 * Clear all cached Meta instances
	 */
	public clearCache(): void {
		this.cache.clear();
	}

	/**
	 * Reload Meta instance from engine
	 * @param doctypeName Name of the DocType to reload
	 * @returns Promise resolving to DocTypeMeta instance or null if not found
	 */
	public async reloadMeta(doctypeName: string, includeCustomFields: boolean = true): Promise<DocTypeMeta | null> {
		this.invalidateMeta(doctypeName);
		return this.getMeta(doctypeName, includeCustomFields);
	}

	/**
	 * Get all cached DocType names
	 * @returns Array of cached DocType names
	 */
	public getCachedDocTypes(): string[] {
		return Array.from(this.cache.keys());
	}

	/**
	 * Check if a DocType is cached
	 * @param doctypeName Name of the DocType to check
	 * @returns True if cached, false otherwise
	 */
	public isCached(doctypeName: string): boolean {
		return this.cache.has(doctypeName);
	}

	/**
	 * Get the size of the cache (number of cached DocTypes)
	 * @returns Number of cached DocTypes
	 */
	public getCacheSize(): number {
		return this.cache.size;
	}

	/**
	 * Preload DocTypeMeta instances for multiple DocTypes
	 * @param doctypeNames Array of DocType names to preload
	 * @returns Promise resolving to Map of doctypeName to DocTypeMeta instances
	 */
	public async preloadMetas(doctypeNames: string[]): Promise<Map<string, DocTypeMeta | null>> {
		const results = new Map<string, DocTypeMeta | null>();

		// Process in parallel for better performance
		const promises = doctypeNames.map(async (doctypeName) => {
			const meta = await this.getMeta(doctypeName);
			return { doctypeName, meta };
		});

		const resolved = await Promise.all(promises);
		for (const { doctypeName, meta } of resolved) {
			results.set(doctypeName, meta);
		}

		return results;
	}

	/**
	 * Create Meta instance from DocType
	 * @param doctype DocType definition to create Meta for
	 * @returns DocTypeMeta instance
	 */
	private createMeta(doctype: DocType, includeCustomFields: boolean = true): DocTypeMeta {
		return MetaFactory.create(doctype, includeCustomFields);
	}

	/**
	 * Get the underlying DocTypeEngine instance
	 * @returns DocTypeEngine instance
	 */
	public getEngine(): DocTypeEngine {
		return this.engine;
	}
}