/**
 * User Cache Manager
 *
 * Implements per-user session cache populated at login, storing roles,
 * permissions, and visible workspaces. This cache layer reduces database
 * queries for user-specific data during request processing.
 *
 * @module cache/user-cache
 */

import type {
    CacheStats,
    UserSessionCache
} from './types';

/**
 * Database interface for user cache operations
 */
export interface UserCacheDatabase {
    get_doc(doctype: string, name: string): Promise<any | null>;
    get_all(doctype: string, options?: any): Promise<any[]>;
}

/**
 * User information for building cache
 */
export interface UserInfo {
    userId: string;
    name: string;
    email: string;
}

/**
 * Options for configuring the UserCacheManager
 */
export interface UserCacheOptions {
    /** Default TTL for cache entries in seconds (default: 3600 = 1 hour) */
    defaultTtl?: number;
    /** Maximum number of user sessions to cache (default: 1000) */
    maxSessions?: number;
}

/**
 * Internal cache entry with session data
 */
interface UserCacheEntry {
    cache: UserSessionCache;
    cachedAt: Date;
    userId: string;
}

/**
 * UserCacheManager provides caching for per-user session data
 *
 * Features:
 * - User roles caching
 * - User permissions caching
 * - Visible workspaces caching
 * - User defaults caching
 * - Cache invalidation (full and partial)
 * - Statistics tracking
 * - Session lifecycle management
 *
 * @example
 * ```typescript
 * const userCache = new UserCacheManager(db);
 * const sessionId = await userCache.buildUserCache({ userId: 'user@example.com', name: 'User', email: 'user@example.com' });
 * const roles = userCache.getUserRoles(sessionId);
 * ```
 */
export class UserCacheManager {
    private caches: Map<string, UserCacheEntry> = new Map();
    private userToSessions: Map<string, Set<string>> = new Map();
    private db: UserCacheDatabase | null = null;
    private stats: CacheStats;
    private options: Required<UserCacheOptions>;

    constructor(db?: UserCacheDatabase, options: UserCacheOptions = {}) {
        this.db = db || null;
        this.options = {
            defaultTtl: options.defaultTtl ?? 3600,
            maxSessions: options.maxSessions ?? 1000
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
    setDatabase(db: UserCacheDatabase): void {
        this.db = db;
    }

    /**
     * Generate a unique session ID
     */
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Build and cache user session data
     *
     * Populates cache with roles, permissions, and workspaces at login time.
     * Returns a session ID that can be used to retrieve cached data.
     *
     * @param user - User information
     * @returns Session ID for retrieving cached data
     */
    async buildUserCache(user: UserInfo): Promise<string> {
        const sessionId = this.generateSessionId();

        // Enforce max sessions limit
        if (this.caches.size >= this.options.maxSessions) {
            this.evictOldestSession();
        }

        // Build cache from database
        const roles = await this.fetchUserRoles(user.userId);
        const permissions = await this.fetchUserPermissions(user.userId, roles);
        const visibleWorkspaces = await this.fetchVisibleWorkspaces(user.userId, roles);
        const defaults = await this.fetchUserDefaults(user.userId);

        const cache: UserSessionCache = {
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email
            },
            roles,
            userPermissions: permissions,
            visibleWorkspaces,
            defaults
        };

        const entry: UserCacheEntry = {
            cache,
            cachedAt: new Date(),
            userId: user.userId
        };

        this.caches.set(sessionId, entry);

        // Track session for user
        if (!this.userToSessions.has(user.userId)) {
            this.userToSessions.set(user.userId, new Set());
        }
        this.userToSessions.get(user.userId)!.add(sessionId);

        this.updateCacheSize();

        return sessionId;
    }

    /**
     * Fetch user roles from database
     */
    private async fetchUserRoles(userId: string): Promise<string[]> {
        if (!this.db) {
            return [];
        }

        const hasRole = await this.db.get_all('Has Role', {
            filters: { parent: userId }
        });

        return hasRole.map((r: any) => r.role);
    }

    /**
     * Fetch user permissions from database
     */
    private async fetchUserPermissions(userId: string, roles: string[]): Promise<string[]> {
        if (!this.db || roles.length === 0) {
            return [];
        }

        const permissions = await this.db.get_all('User Permission', {
            filters: { user: userId }
        });

        return permissions.map((p: any) => `${p.allow}:${p.for_value}`);
    }

    /**
     * Fetch visible workspaces for user based on roles
     */
    private async fetchVisibleWorkspaces(userId: string, roles: string[]): Promise<string[]> {
        if (!this.db) {
            return [];
        }

        // Get all workspaces
        const workspaces = await this.db.get_all('Workspace');

        // Filter based on roles (simplified - in real implementation would check permissions)
        return workspaces.map((w: any) => w.name);
    }

    /**
     * Fetch user defaults from database
     */
    private async fetchUserDefaults(userId: string): Promise<Record<string, any>> {
        if (!this.db) {
            return {};
        }

        const defaults = await this.db.get_all('DefaultValue', {
            filters: { parent: userId }
        });

        const result: Record<string, any> = {};
        for (const d of defaults) {
            result[d.defkey] = d.defvalue;
        }

        return result;
    }

    /**
     * Get the complete user cache for a session
     *
     * @param sessionId - Session ID
     * @returns UserSessionCache or null if not found
     */
    getUserCache(sessionId: string): UserSessionCache | null {
        const entry = this.caches.get(sessionId);
        if (entry) {
            this.stats.hits++;
            return entry.cache;
        }
        this.stats.misses++;
        return null;
    }

    /**
     * Get user roles from cache (no DB query)
     *
     * @param sessionId - Session ID
     * @returns Array of role names or empty array
     */
    getUserRoles(sessionId: string): string[] {
        const entry = this.caches.get(sessionId);
        if (entry) {
            this.stats.hits++;
            return entry.cache.roles;
        }
        this.stats.misses++;
        return [];
    }

    /**
     * Get user permissions from cache (no DB query)
     *
     * @param sessionId - Session ID
     * @returns Array of permission strings or empty array
     */
    getUserPermissions(sessionId: string): string[] {
        const entry = this.caches.get(sessionId);
        if (entry) {
            this.stats.hits++;
            return entry.cache.userPermissions;
        }
        this.stats.misses++;
        return [];
    }

    /**
     * Get visible workspaces from cache (no DB query)
     *
     * @param sessionId - Session ID
     * @returns Array of workspace names or empty array
     */
    getVisibleWorkspaces(sessionId: string): string[] {
        const entry = this.caches.get(sessionId);
        if (entry) {
            this.stats.hits++;
            return entry.cache.visibleWorkspaces;
        }
        this.stats.misses++;
        return [];
    }

    /**
     * Get user defaults from cache (no DB query)
     *
     * @param sessionId - Session ID
     * @returns Record of default values or empty object
     */
    getUserDefaults(sessionId: string): Record<string, any> {
        const entry = this.caches.get(sessionId);
        if (entry) {
            this.stats.hits++;
            return entry.cache.defaults;
        }
        this.stats.misses++;
        return {};
    }

    /**
     * Invalidate all cache for a specific user
     *
     * Clears all sessions and cached data for the user.
     *
     * @param userId - User ID to invalidate
     */
    invalidateUserCache(userId: string): void {
        const sessions = this.userToSessions.get(userId);
        if (sessions) {
            for (const sessionId of sessions) {
                this.caches.delete(sessionId);
            }
            this.userToSessions.delete(userId);
            this.updateCacheSize();
        }
    }

    /**
     * Invalidate only permissions cache for a user
     *
     * Clears permissions while keeping other cached data.
     * Other data like roles and defaults remain intact.
     *
     * @param userId - User ID to invalidate permissions for
     */
    invalidateUserPermissions(userId: string): void {
        const sessions = this.userToSessions.get(userId);
        if (sessions) {
            for (const sessionId of sessions) {
                const entry = this.caches.get(sessionId);
                if (entry) {
                    entry.cache.userPermissions = [];
                }
            }
            this.updateCacheSize();
        }
    }

    /**
     * Remove a specific session from cache
     *
     * @param sessionId - Session ID to remove
     */
    removeSession(sessionId: string): void {
        const entry = this.caches.get(sessionId);
        if (entry) {
            const sessions = this.userToSessions.get(entry.userId);
            if (sessions) {
                sessions.delete(sessionId);
                if (sessions.size === 0) {
                    this.userToSessions.delete(entry.userId);
                }
            }
            this.caches.delete(sessionId);
            this.updateCacheSize();
        }
    }

    /**
     * Clear all user caches
     */
    clearAllUserCaches(): void {
        this.caches.clear();
        this.userToSessions.clear();
        this.stats.lastCleared = new Date();
        this.stats.size = 0;
    }

    /**
     * Evict the oldest session when cache is full
     */
    private evictOldestSession(): void {
        let oldestSessionId: string | null = null;
        let oldestTime: Date | null = null;

        for (const [sessionId, entry] of this.caches) {
            if (!oldestTime || entry.cachedAt < oldestTime) {
                oldestTime = entry.cachedAt;
                oldestSessionId = sessionId;
            }
        }

        if (oldestSessionId) {
            this.removeSession(oldestSessionId);
        }
    }

    /**
     * Get all sessions for a user
     *
     * @param userId - User ID
     * @returns Array of session IDs
     */
    getSessionsForUser(userId: string): string[] {
        const sessions = this.userToSessions.get(userId);
        return sessions ? Array.from(sessions) : [];
    }

    /**
     * Check if a session exists
     *
     * @param sessionId - Session ID
     * @returns true if session exists
     */
    hasSession(sessionId: string): boolean {
        return this.caches.has(sessionId);
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
     * Get the number of cached sessions
     */
    getSessionCount(): number {
        return this.caches.size;
    }

    /**
     * Update the approximate cache size in bytes
     */
    private updateCacheSize(): void {
        const entries = Array.from(this.caches.values());
        const jsonStr = JSON.stringify(entries.map(e => e.cache));
        this.stats.size = new Blob([jsonStr]).size;
    }
}

/**
 * Create a new UserCacheManager instance
 *
 * @param db - Optional database instance
 * @param options - Cache configuration options
 * @returns New UserCacheManager instance
 */
export function createUserCache(
    db?: UserCacheDatabase,
    options?: UserCacheOptions
): UserCacheManager {
    return new UserCacheManager(db, options);
}
