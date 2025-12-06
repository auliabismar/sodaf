/**
 * System Cache Manager
 *
 * Implements system-wide cache for DocTypes, Workspaces, and Role Permissions
 * that is shared across all users. This cache layer sits between the database
 * and application code to reduce database queries.
 *
 * @module cache/system-cache
 */

import type {
    CacheEntry,
    CacheStats,
    SystemCache,
    DocType
} from './types';

/**
 * Database interface for cache operations
 * This allows the cache to work with any database implementation
 */
export interface CacheDatabase {
    get_doc(doctype: string, name: string): Promise<any | null>;
    get_all(doctype: string, options?: any): Promise<any[]>;
}

/**
 * Options for configuring the SystemCacheManager
 */
export interface SystemCacheOptions {
    /** Default TTL for cache entries in seconds (default: 3600 = 1 hour) */
    defaultTtl?: number;
    /** Maximum number of DocTypes to cache (default: 1000) */
    maxDocTypes?: number;
}

/**
 * SystemCacheManager provides caching for system-wide data
 *
 * Features:
 * - DocType metadata caching
 * - Workspace information caching
 * - Role permissions caching
 * - System settings caching
 * - Cache invalidation
 * - Statistics tracking
 *
 * @example
 * ```typescript
 * const cache = new SystemCacheManager(db);
 * const doctype = await cache.getDocTypeMeta('User');
 * console.log(cache.getStats());
 * ```
 */
export class SystemCacheManager {
    private cache: SystemCache;
    private db: CacheDatabase | null = null;
    private stats: CacheStats;
    private options: Required<SystemCacheOptions>;

    // TTL tracking for cache entries
    private docTypeCachedAt: Map<string, Date> = new Map();
    private workspacesCachedAt: Date | null = null;
    private rolePermissionsCachedAt: Map<string, Date> = new Map();
    private systemSettingsCachedAt: Date | null = null;

    constructor(db?: CacheDatabase, options: SystemCacheOptions = {}) {
        this.db = db || null;
        this.options = {
            defaultTtl: options.defaultTtl ?? 3600,
            maxDocTypes: options.maxDocTypes ?? 1000
        };

        this.cache = {
            docTypes: {},
            workspaces: {},
            rolePermissions: {},
            systemSettings: {}
        };

        this.stats = {
            hits: 0,
            misses: 0,
            size: 0,
            lastCleared: undefined
        };
    }

    /**
     * Set the database instance for cache operations
     * @param db Database instance to use for queries
     */
    setDatabase(db: CacheDatabase): void {
        this.db = db;
    }

    /**
     * Get DocType metadata from cache or database
     *
     * First call queries the database and caches the result.
     * Subsequent calls return the cached result without DB query.
     *
     * @param doctype - DocType name to retrieve
     * @returns DocType metadata or null if not found
     */
    async getDocTypeMeta(doctype: string): Promise<DocType | null> {
        // Check if cached
        if (this.cache.docTypes[doctype]) {
            this.stats.hits++;
            return this.cache.docTypes[doctype];
        }

        this.stats.misses++;

        // Query database if available
        if (!this.db) {
            return null;
        }

        const doc = await this.db.get_doc('DocType', doctype);
        if (doc) {
            // Convert to DocType format and cache
            const docType: DocType = {
                name: doc.name,
                module: doc.module || '',
                fields: doc.fields || {},
                permissions: doc.permissions || []
            };

            this.cache.docTypes[doctype] = docType;
            this.docTypeCachedAt.set(doctype, new Date());
            this.updateCacheSize();
        }

        return doc ? this.cache.docTypes[doctype] : null;
    }

    /**
     * Get all workspaces from cache or database
     *
     * @returns Record of all workspaces keyed by name
     */
    async getAllWorkspaces(): Promise<Record<string, any>> {
        // Check if cached and not empty
        if (Object.keys(this.cache.workspaces).length > 0) {
            this.stats.hits++;
            return this.cache.workspaces;
        }

        this.stats.misses++;

        // Query database if available
        if (!this.db) {
            return {};
        }

        const workspaces = await this.db.get_all('Workspace');
        if (workspaces && workspaces.length > 0) {
            // Convert array to record keyed by name
            for (const ws of workspaces) {
                this.cache.workspaces[ws.name] = ws;
            }
            this.workspacesCachedAt = new Date();
            this.updateCacheSize();
        }

        return this.cache.workspaces;
    }

    /**
     * Get role permissions for a specific doctype
     *
     * @param doctype - DocType name to get permissions for
     * @returns Array of role names that have permissions
     */
    async getRolePermissions(doctype: string): Promise<string[]> {
        // Check if cached
        if (this.cache.rolePermissions[doctype]) {
            this.stats.hits++;
            return this.cache.rolePermissions[doctype];
        }

        this.stats.misses++;

        // Query database if available
        if (!this.db) {
            return [];
        }

        const permissions = await this.db.get_all('DocPerm', {
            filters: { parent: doctype }
        });

        if (permissions && permissions.length > 0) {
            // Extract unique roles
            const roles = [...new Set(permissions.map((p: any) => p.role))];
            this.cache.rolePermissions[doctype] = roles;
            this.rolePermissionsCachedAt.set(doctype, new Date());
            this.updateCacheSize();
            return roles;
        }

        // Cache empty result to avoid repeated queries
        this.cache.rolePermissions[doctype] = [];
        this.rolePermissionsCachedAt.set(doctype, new Date());
        return [];
    }

    /**
     * Get system settings from cache or database
     *
     * @returns Record of system settings
     */
    async getSystemSettings(): Promise<Record<string, any>> {
        // Check if cached and not empty
        if (Object.keys(this.cache.systemSettings).length > 0) {
            this.stats.hits++;
            return this.cache.systemSettings;
        }

        this.stats.misses++;

        // Query database if available
        if (!this.db) {
            return {};
        }

        const settings = await this.db.get_doc('System Settings', 'System Settings');
        if (settings) {
            this.cache.systemSettings = settings;
            this.systemSettingsCachedAt = new Date();
            this.updateCacheSize();
        }

        return this.cache.systemSettings;
    }

    /**
     * Invalidate a specific DocType from cache
     *
     * @param name - DocType name to invalidate
     */
    invalidateDocType(name: string): void {
        delete this.cache.docTypes[name];
        this.docTypeCachedAt.delete(name);
        this.updateCacheSize();
    }

    /**
     * Invalidate all workspace cache
     */
    invalidateWorkspaces(): void {
        this.cache.workspaces = {};
        this.workspacesCachedAt = null;
        this.updateCacheSize();
    }

    /**
     * Invalidate role permissions for a specific doctype
     *
     * @param doctype - DocType name to invalidate permissions for
     */
    invalidateRolePermissions(doctype: string): void {
        delete this.cache.rolePermissions[doctype];
        this.rolePermissionsCachedAt.delete(doctype);
        this.updateCacheSize();
    }

    /**
     * Invalidate system settings cache
     */
    invalidateSystemSettings(): void {
        this.cache.systemSettings = {};
        this.systemSettingsCachedAt = null;
        this.updateCacheSize();
    }

    /**
     * Invalidate all caches
     */
    invalidateAll(): void {
        this.cache = {
            docTypes: {},
            workspaces: {},
            rolePermissions: {},
            systemSettings: {}
        };

        this.docTypeCachedAt.clear();
        this.workspacesCachedAt = null;
        this.rolePermissionsCachedAt.clear();
        this.systemSettingsCachedAt = null;

        this.stats.lastCleared = new Date();
        this.stats.size = 0;
    }

    /**
     * Get cache statistics
     *
     * @returns Cache statistics including hits, misses, and size
     */
    getStats(): CacheStats {
        return { ...this.stats };
    }

    /**
     * Reset cache statistics
     */
    resetStats(): void {
        this.stats.hits = 0;
        this.stats.misses = 0;
    }

    /**
     * Check if a DocType is cached
     *
     * @param doctype - DocType name to check
     * @returns true if cached
     */
    isDocTypeCached(doctype: string): boolean {
        return doctype in this.cache.docTypes;
    }

    /**
     * Check if workspaces are cached
     *
     * @returns true if workspaces are cached
     */
    areWorkspacesCached(): boolean {
        return Object.keys(this.cache.workspaces).length > 0;
    }

    /**
     * Get the current cache object (for testing purposes)
     *
     * @returns The internal cache object
     */
    getCache(): SystemCache {
        return this.cache;
    }

    /**
     * Manually set a DocType in cache (for testing or pre-warming)
     *
     * @param doctype - DocType name
     * @param data - DocType data
     */
    setDocTypeMeta(doctype: string, data: DocType): void {
        this.cache.docTypes[doctype] = data;
        this.docTypeCachedAt.set(doctype, new Date());
        this.updateCacheSize();
    }

    /**
     * Manually set workspaces in cache (for testing or pre-warming)
     *
     * @param workspaces - Record of workspaces
     */
    setWorkspaces(workspaces: Record<string, any>): void {
        this.cache.workspaces = workspaces;
        this.workspacesCachedAt = new Date();
        this.updateCacheSize();
    }

    /**
     * Manually set role permissions in cache (for testing or pre-warming)
     *
     * @param doctype - DocType name
     * @param roles - Array of role names
     */
    setRolePermissions(doctype: string, roles: string[]): void {
        this.cache.rolePermissions[doctype] = roles;
        this.rolePermissionsCachedAt.set(doctype, new Date());
        this.updateCacheSize();
    }

    /**
     * Manually set system settings in cache (for testing or pre-warming)
     *
     * @param settings - System settings object
     */
    setSystemSettings(settings: Record<string, any>): void {
        this.cache.systemSettings = settings;
        this.systemSettingsCachedAt = new Date();
        this.updateCacheSize();
    }

    /**
     * Update the approximate cache size in bytes
     */
    private updateCacheSize(): void {
        // Approximate size calculation
        const jsonStr = JSON.stringify(this.cache);
        this.stats.size = new Blob([jsonStr]).size;
    }
}

/**
 * Create a new SystemCacheManager instance
 *
 * @param db - Optional database instance
 * @param options - Cache configuration options
 * @returns New SystemCacheManager instance
 */
export function createSystemCache(
    db?: CacheDatabase,
    options?: SystemCacheOptions
): SystemCacheManager {
    return new SystemCacheManager(db, options);
}
