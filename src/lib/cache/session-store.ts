/**
 * Session Store
 *
 * Implements session lifecycle management with automatic cleanup,
 * expiration handling, and cache size limits. Works in conjunction
 * with UserCacheManager for complete session handling.
 *
 * @module cache/session-store
 */

import type { UserSessionData } from './types';

/**
 * Options for configuring the SessionStore
 */
export interface SessionStoreOptions {
    /** Default session expiry in seconds (default: 21600 = 6 hours) */
    defaultExpiry?: number;
    /** Maximum number of sessions to store (default: 10000) */
    maxSessions?: number;
    /** Cleanup interval in milliseconds (default: 60000 = 1 minute) */
    cleanupInterval?: number;
    /** Callback when session expires (for cache cleanup) */
    onSessionExpire?: (sessionId: string, userId: string) => void;
}

/**
 * Internal session entry with metadata
 */
interface SessionEntry {
    sessionId: string;
    data: UserSessionData;
    createdAt: Date;
}

/**
 * Session store statistics
 */
export interface SessionStoreStats {
    /** Total active sessions */
    totalSessions: number;
    /** Sessions created */
    sessionsCreated: number;
    /** Sessions expired */
    sessionsExpired: number;
    /** Sessions manually deleted */
    sessionsDeleted: number;
}

/**
 * SessionStore manages session lifecycle
 *
 * Features:
 * - Session CRUD operations
 * - Automatic expiration handling
 * - Periodic cleanup of expired sessions
 * - Session limits with LRU eviction
 * - Per-user session tracking
 * - Callbacks for session expiration
 *
 * @example
 * ```typescript
 * const store = new SessionStore({ onSessionExpire: (id, userId) => userCache.invalidateUserCache(userId) });
 * const sessionId = store.createSession('user@example.com');
 * const session = store.getSession(sessionId);
 * ```
 */
export class SessionStore {
    private sessions: Map<string, SessionEntry> = new Map();
    private userToSessions: Map<string, Set<string>> = new Map();
    private options: Required<SessionStoreOptions>;
    private stats: SessionStoreStats;
    private cleanupTimer: ReturnType<typeof setInterval> | null = null;

    constructor(options: SessionStoreOptions = {}) {
        this.options = {
            defaultExpiry: options.defaultExpiry ?? 21600, // 6 hours
            maxSessions: options.maxSessions ?? 10000,
            cleanupInterval: options.cleanupInterval ?? 60000, // 1 minute
            onSessionExpire: options.onSessionExpire ?? (() => { })
        };

        this.stats = {
            totalSessions: 0,
            sessionsCreated: 0,
            sessionsExpired: 0,
            sessionsDeleted: 0
        };

        // Start cleanup timer
        this.startCleanupTimer();
    }

    /**
     * Generate a unique session ID
     */
    private generateSessionId(): string {
        return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Start the periodic cleanup timer
     */
    private startCleanupTimer(): void {
        if (this.options.cleanupInterval > 0) {
            this.cleanupTimer = setInterval(() => {
                this.cleanupExpiredSessions();
            }, this.options.cleanupInterval);
        }
    }

    /**
     * Stop the cleanup timer
     */
    stopCleanupTimer(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }

    /**
     * Create a new session
     *
     * @param userId - User ID for the session
     * @param expiresIn - Optional expiry in seconds (defaults to options.defaultExpiry)
     * @param preferences - Optional user preferences
     * @returns Session ID
     */
    createSession(
        userId: string,
        expiresIn?: number,
        preferences: Record<string, any> = {}
    ): string {
        // Enforce max sessions limit
        if (this.sessions.size >= this.options.maxSessions) {
            this.evictOldestSession();
        }

        const sessionId = this.generateSessionId();
        const now = new Date();
        const expirySeconds = expiresIn ?? this.options.defaultExpiry;
        const expiresAt = new Date(now.getTime() + expirySeconds * 1000);

        const sessionData: UserSessionData = {
            userId,
            roles: [],
            permissions: [],
            activeWorkspace: undefined,
            preferences,
            expiresAt,
            lastActivity: now
        };

        const entry: SessionEntry = {
            sessionId,
            data: sessionData,
            createdAt: now
        };

        this.sessions.set(sessionId, entry);

        // Track session for user
        if (!this.userToSessions.has(userId)) {
            this.userToSessions.set(userId, new Set());
        }
        this.userToSessions.get(userId)!.add(sessionId);

        this.stats.totalSessions++;
        this.stats.sessionsCreated++;

        return sessionId;
    }

    /**
     * Get session data
     *
     * Returns null if session doesn't exist or is expired.
     *
     * @param sessionId - Session ID
     * @returns Session data or null
     */
    getSession(sessionId: string): UserSessionData | null {
        const entry = this.sessions.get(sessionId);
        if (!entry) {
            return null;
        }

        // Check if expired
        if (new Date() > entry.data.expiresAt) {
            this.handleExpiredSession(sessionId, entry.data.userId);
            return null;
        }

        // Update last activity
        entry.data.lastActivity = new Date();

        return entry.data;
    }

    /**
     * Update session data
     *
     * @param sessionId - Session ID
     * @param updates - Partial session data to update
     * @returns true if updated, false if session not found
     */
    updateSession(sessionId: string, updates: Partial<UserSessionData>): boolean {
        const entry = this.sessions.get(sessionId);
        if (!entry) {
            return false;
        }

        // Check if expired
        if (new Date() > entry.data.expiresAt) {
            this.handleExpiredSession(sessionId, entry.data.userId);
            return false;
        }

        // Apply updates
        Object.assign(entry.data, updates);
        entry.data.lastActivity = new Date();

        return true;
    }

    /**
     * Delete a session
     *
     * @param sessionId - Session ID to delete
     * @returns true if deleted, false if not found
     */
    deleteSession(sessionId: string): boolean {
        const entry = this.sessions.get(sessionId);
        if (!entry) {
            return false;
        }

        // Remove from user tracking
        const sessions = this.userToSessions.get(entry.data.userId);
        if (sessions) {
            sessions.delete(sessionId);
            if (sessions.size === 0) {
                this.userToSessions.delete(entry.data.userId);
            }
        }

        this.sessions.delete(sessionId);
        this.stats.totalSessions--;
        this.stats.sessionsDeleted++;

        return true;
    }

    /**
     * Handle expired session cleanup
     */
    private handleExpiredSession(sessionId: string, userId: string): void {
        // Remove from maps
        const sessions = this.userToSessions.get(userId);
        if (sessions) {
            sessions.delete(sessionId);
            if (sessions.size === 0) {
                this.userToSessions.delete(userId);
            }
        }

        this.sessions.delete(sessionId);
        this.stats.totalSessions--;
        this.stats.sessionsExpired++;

        // Call expiration callback
        this.options.onSessionExpire(sessionId, userId);
    }

    /**
     * Clean up all expired sessions
     *
     * @returns Number of sessions cleaned up
     */
    cleanupExpiredSessions(): number {
        const now = new Date();
        let cleaned = 0;

        for (const [sessionId, entry] of this.sessions) {
            if (now > entry.data.expiresAt) {
                this.handleExpiredSession(sessionId, entry.data.userId);
                cleaned++;
            }
        }

        return cleaned;
    }

    /**
     * Evict the oldest session when cache is full
     */
    private evictOldestSession(): void {
        let oldestSessionId: string | null = null;
        let oldestTime: Date | null = null;

        for (const [sessionId, entry] of this.sessions) {
            if (!oldestTime || entry.createdAt < oldestTime) {
                oldestTime = entry.createdAt;
                oldestSessionId = sessionId;
            }
        }

        if (oldestSessionId) {
            const entry = this.sessions.get(oldestSessionId);
            if (entry) {
                this.handleExpiredSession(oldestSessionId, entry.data.userId);
            }
        }
    }

    /**
     * Get all sessions for a user
     *
     * @param userId - User ID
     * @returns Array of session IDs
     */
    getSessionsByUser(userId: string): string[] {
        const sessions = this.userToSessions.get(userId);
        return sessions ? Array.from(sessions) : [];
    }

    /**
     * Check if a session exists and is valid
     *
     * @param sessionId - Session ID
     * @returns true if session exists and is not expired
     */
    isValidSession(sessionId: string): boolean {
        const entry = this.sessions.get(sessionId);
        if (!entry) {
            return false;
        }
        return new Date() <= entry.data.expiresAt;
    }

    /**
     * Extend session expiry
     *
     * @param sessionId - Session ID
     * @param additionalSeconds - Seconds to add to expiry
     * @returns true if extended, false if session not found
     */
    extendSession(sessionId: string, additionalSeconds: number): boolean {
        const entry = this.sessions.get(sessionId);
        if (!entry) {
            return false;
        }

        const newExpiry = new Date(entry.data.expiresAt.getTime() + additionalSeconds * 1000);
        entry.data.expiresAt = newExpiry;
        entry.data.lastActivity = new Date();

        return true;
    }

    /**
     * Get store statistics
     */
    getStats(): SessionStoreStats {
        return { ...this.stats };
    }

    /**
     * Get the number of active sessions
     */
    getSessionCount(): number {
        return this.sessions.size;
    }

    /**
     * Clear all sessions
     */
    clearAllSessions(): void {
        // Notify for each session
        for (const [sessionId, entry] of this.sessions) {
            this.options.onSessionExpire(sessionId, entry.data.userId);
        }

        this.sessions.clear();
        this.userToSessions.clear();
        this.stats.totalSessions = 0;
    }

    /**
     * Set max sessions limit
     *
     * @param limit - New maximum session limit
     */
    setMaxSessions(limit: number): void {
        this.options.maxSessions = limit;

        // Evict if over limit
        while (this.sessions.size > limit) {
            this.evictOldestSession();
        }
    }

    /**
     * Destroy the session store (cleanup timers)
     */
    destroy(): void {
        this.stopCleanupTimer();
        this.clearAllSessions();
    }
}

/**
 * Create a new SessionStore instance
 *
 * @param options - Store configuration options
 * @returns New SessionStore instance
 */
export function createSessionStore(options?: SessionStoreOptions): SessionStore {
    return new SessionStore(options);
}
