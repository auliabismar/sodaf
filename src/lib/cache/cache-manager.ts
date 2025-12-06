/**
 * Cache Manager
 *
 * Unified cache manager that coordinates all three cache layers:
 * 1. System Cache - DocTypes, Workspaces, Role Permissions
 * 2. User Cache - Per-user session data
 * 3. Request Cache - Request-scoped temporary cache
 *
 * @module cache/cache-manager
 */

import type {
    CacheStats,
    CacheInvalidationEvent,
    CacheEvent,
    CacheEventSubscriber,
    UserSessionCache
} from './types';
import { SystemCacheManager, type CacheDatabase } from './system-cache';
import { UserCacheManager, type UserCacheDatabase, type UserInfo } from './user-cache';
import { SessionStore, type SessionStoreOptions } from './session-store';
import {
    runWithRequestCache,
    getRequestCacheStats,
    isInRequestContext,
    type RequestCacheStats
} from './request-cache';

/**
 * Combined cache statistics from all layers
 */
export interface CombinedCacheStats {
    system: CacheStats;
    user: CacheStats;
    request: RequestCacheStats | null;
    session: {
        totalSessions: number;
        sessionsCreated: number;
        sessionsExpired: number;
    };
}

/**
 * Options for configuring the CacheManager
 */
export interface CacheManagerOptions {
    /** Database instance for cache operations */
    db?: CacheDatabase & UserCacheDatabase;
    /** Session store options */
    sessionOptions?: SessionStoreOptions;
    /** System cache TTL in seconds */
    systemCacheTtl?: number;
    /** User cache TTL in seconds */
    userCacheTtl?: number;
}

/**
 * CacheManager provides unified access to all cache layers
 *
 * Features:
 * - Single entry point for all cache operations
 * - Coordinated cache invalidation
 * - Event subscription system
 * - Combined statistics
 *
 * @example
 * ```typescript
 * const cacheManager = createCacheManager({ db });
 *
 * // Use system cache
 * const doctype = await cacheManager.system.getDocTypeMeta('User');
 *
 * // Invalidate across all layers
 * cacheManager.invalidate('doctype_saved', { doctype: 'User' });
 * ```
 */
export class CacheManager {
    readonly system: SystemCacheManager;
    readonly user: UserCacheManager;
    readonly session: SessionStore;

    private subscribers: Map<CacheInvalidationEvent, Set<CacheEventSubscriber>> = new Map();

    constructor(options: CacheManagerOptions = {}) {
        // Initialize system cache
        this.system = new SystemCacheManager(options.db, {
            defaultTtl: options.systemCacheTtl
        });

        // Initialize user cache
        this.user = new UserCacheManager(options.db, {
            defaultTtl: options.userCacheTtl
        });

        // Initialize session store with callback to clear user cache
        this.session = new SessionStore({
            ...options.sessionOptions,
            onSessionExpire: (sessionId, userId) => {
                this.user.removeSession(sessionId);
                options.sessionOptions?.onSessionExpire?.(sessionId, userId);
            }
        });

        // Initialize subscriber maps
        this.subscribers.set('doctype_saved', new Set());
        this.subscribers.set('workspace_saved', new Set());
        this.subscribers.set('permission_changed', new Set());
    }

    /**
     * Set the database for all cache layers
     *
     * @param db - Database instance
     */
    setDatabase(db: CacheDatabase & UserCacheDatabase): void {
        this.system.setDatabase(db);
        this.user.setDatabase(db);
    }

    /**
     * Run a function within a request cache scope
     *
     * Wraps the function in an isolated request cache context.
     *
     * @param fn - Function to run
     * @returns Result of the function
     */
    async runWithRequestCache<T>(fn: () => T | Promise<T>): Promise<T> {
        return runWithRequestCache(fn);
    }

    /**
     * Build user cache and create session
     *
     * Call this at user login to populate all caches.
     *
     * @param user - User information
     * @param sessionExpiry - Optional session expiry in seconds
     * @returns Session ID
     */
    async createUserSession(user: UserInfo, sessionExpiry?: number): Promise<string> {
        // Create session in session store
        const sessionId = this.session.createSession(user.userId, sessionExpiry);

        // Build user cache (this uses a different session ID internally)
        await this.user.buildUserCache(user);

        return sessionId;
    }

    /**
     * Get user cache for a session
     *
     * @param sessionId - Session ID
     * @returns User session cache or null if session invalid
     */
    getUserSessionCache(sessionId: string): UserSessionCache | null {
        // Verify session is valid
        if (!this.session.isValidSession(sessionId)) {
            return null;
        }

        // Get session data to find user ID
        const sessionData = this.session.getSession(sessionId);
        if (!sessionData) {
            return null;
        }

        // Get user's sessions and find matching cache
        const userSessions = this.user.getSessionsForUser(sessionData.userId);
        if (userSessions.length > 0) {
            return this.user.getUserCache(userSessions[0]);
        }

        return null;
    }

    /**
     * Invalidate cache based on event type
     *
     * Propagates invalidation to all relevant cache layers.
     *
     * @param event - Type of invalidation event
     * @param data - Event data (doctype, workspace, userId, etc.)
     */
    invalidate(event: CacheInvalidationEvent, data?: {
        doctype?: string;
        workspace?: string;
        userId?: string;
    }): void {
        switch (event) {
            case 'doctype_saved':
                if (data?.doctype) {
                    this.system.invalidateDocType(data.doctype);
                    this.system.invalidateRolePermissions(data.doctype);
                }
                break;

            case 'workspace_saved':
                this.system.invalidateWorkspaces();
                // Invalidate all user caches since visible workspaces may change
                this.user.clearAllUserCaches();
                break;

            case 'permission_changed':
                if (data?.doctype) {
                    this.system.invalidateRolePermissions(data.doctype);
                }
                if (data?.userId) {
                    this.user.invalidateUserPermissions(data.userId);
                } else {
                    // If no specific user, invalidate all user permissions
                    this.user.clearAllUserCaches();
                }
                break;
        }

        // Emit event to subscribers
        this.emitEvent(event, data);
    }

    /**
     * Invalidate all caches across all layers
     */
    invalidateAll(): void {
        this.system.invalidateAll();
        this.user.clearAllUserCaches();
        // Note: Request cache is automatically cleared after each request
    }

    /**
     * Subscribe to cache invalidation events
     *
     * @param event - Event type to subscribe to
     * @param subscriber - Callback function
     * @returns Unsubscribe function
     */
    on(event: CacheInvalidationEvent, subscriber: CacheEventSubscriber): () => void {
        const subscribers = this.subscribers.get(event);
        if (subscribers) {
            subscribers.add(subscriber);
        }

        return () => {
            subscribers?.delete(subscriber);
        };
    }

    /**
     * Unsubscribe from cache invalidation events
     *
     * @param event - Event type
     * @param subscriber - Callback to remove
     */
    off(event: CacheInvalidationEvent, subscriber: CacheEventSubscriber): void {
        const subscribers = this.subscribers.get(event);
        if (subscribers) {
            subscribers.delete(subscriber);
        }
    }

    /**
     * Emit event to all subscribers
     */
    private emitEvent(eventType: CacheInvalidationEvent, data?: {
        doctype?: string;
        workspace?: string;
        userId?: string;
    }): void {
        const subscribers = this.subscribers.get(eventType);
        if (!subscribers) {
            return;
        }

        const event: CacheEvent = {
            type: eventType,
            doctype: data?.doctype,
            workspace: data?.workspace,
            userId: data?.userId,
            data,
            timestamp: new Date()
        };

        for (const subscriber of subscribers) {
            try {
                subscriber(event);
            } catch (e) {
                // Log error but don't break other subscribers
                console.error('Cache event subscriber error:', e);
            }
        }
    }

    /**
     * Get combined statistics from all cache layers
     *
     * @returns Statistics from system, user, request, and session caches
     */
    getStats(): CombinedCacheStats {
        const sessionStats = this.session.getStats();

        return {
            system: this.system.getStats(),
            user: this.user.getStats(),
            request: isInRequestContext() ? getRequestCacheStats() : null,
            session: {
                totalSessions: sessionStats.totalSessions,
                sessionsCreated: sessionStats.sessionsCreated,
                sessionsExpired: sessionStats.sessionsExpired
            }
        };
    }

    /**
     * Reset statistics for all cache layers
     */
    resetStats(): void {
        this.system.resetStats();
        this.user.resetStats();
    }

    /**
     * End a user session and cleanup cache
     *
     * @param sessionId - Session ID to end
     */
    endSession(sessionId: string): void {
        const sessionData = this.session.getSession(sessionId);
        if (sessionData) {
            this.user.invalidateUserCache(sessionData.userId);
        }
        this.session.deleteSession(sessionId);
    }

    /**
     * Destroy the cache manager
     *
     * Cleans up all resources including timers.
     */
    destroy(): void {
        this.session.destroy();
        this.system.invalidateAll();
        this.user.clearAllUserCaches();
        this.subscribers.clear();
    }
}

/**
 * Create a new CacheManager instance
 *
 * @param options - Configuration options
 * @returns New CacheManager instance
 */
export function createCacheManager(options?: CacheManagerOptions): CacheManager {
    return new CacheManager(options);
}
