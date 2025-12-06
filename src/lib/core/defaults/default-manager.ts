/**
 * Default Values Manager
 *
 * Implements multi-level default values with hierarchy: Session > User > Role > Global.
 * Defaults are used to pre-populate fields when creating new documents.
 *
 * @module core/defaults/default-manager
 */

import type {
    DefaultScope,
    DefaultEntry,
    DefaultManagerOptions,
    DefaultDatabase
} from './types';

/**
 * In-memory storage for session defaults
 */
interface SessionDefaults {
    [key: string]: any;
}

/**
 * DefaultManager manages multi-level default values
 *
 * Features:
 * - Global defaults stored in database
 * - User-specific defaults stored in database
 * - Role-based defaults stored in database
 * - Session defaults (in-memory, highest priority)
 * - Automatic resolution hierarchy
 *
 * @example
 * ```typescript
 * const manager = new DefaultManager({ userId: 'admin@example.com', userRoles: ['Admin'] });
 * manager.setDatabase(db);
 *
 * await manager.setDefault('Company', 'ABC Corp'); // global
 * await manager.setDefault('Warehouse', 'Main', 'user@example.com'); // user-specific
 * manager.setSessionDefault('Fiscal Year', '2024'); // session
 *
 * const company = await manager.getDefault('Company'); // Returns 'ABC Corp'
 * ```
 */
export class DefaultManager {
    private db: DefaultDatabase | null = null;
    private options: DefaultManagerOptions;
    private sessionDefaults: SessionDefaults = {};

    /**
     * Create a new DefaultManager instance
     *
     * @param options - Configuration options
     */
    constructor(options: DefaultManagerOptions = {}) {
        this.options = options;
    }

    /**
     * Set the database for persistent storage
     *
     * @param db - Database implementation
     */
    setDatabase(db: DefaultDatabase): void {
        this.db = db;
    }

    /**
     * Set the current user context
     *
     * @param userId - User ID
     * @param userRoles - User's roles
     */
    setUserContext(userId: string, userRoles: string[] = []): void {
        this.options.userId = userId;
        this.options.userRoles = userRoles;
    }

    /**
     * Get the current user ID
     */
    getCurrentUserId(): string | undefined {
        return this.options.userId;
    }

    /**
     * Get the current user's roles
     */
    getCurrentUserRoles(): string[] {
        return this.options.userRoles || [];
    }

    /**
     * Set a default value
     *
     * If user is provided, sets a user-specific default.
     * Otherwise, sets a global default.
     *
     * @param key - The default key (e.g., 'Company', 'Warehouse')
     * @param value - The default value
     * @param user - Optional user ID for user-specific default
     */
    async setDefault(key: string, value: any, user?: string): Promise<void> {
        if (!this.db) {
            return;
        }

        const scope: DefaultScope = user ? 'user' : 'global';
        const scopeId = user || undefined;

        await this.db.setDefault(key, value, scope, scopeId);
    }

    /**
     * Get a default value with full hierarchy resolution
     *
     * Resolution order: Session > User > Role > Global
     *
     * @param key - The default key
     * @returns The resolved default value, or undefined if not found
     */
    async getDefault(key: string): Promise<any | undefined> {
        return this.resolveDefault(key);
    }

    /**
     * Get all defaults for a user
     *
     * Merges global defaults with user-specific defaults.
     * User defaults take precedence over global.
     *
     * @param user - Optional user ID (defaults to current user)
     * @returns Record of all defaults
     */
    async getDefaults(user?: string): Promise<Record<string, any>> {
        const userId = user || this.options.userId;
        const result: Record<string, any> = {};

        if (!this.db) {
            // Return session defaults only
            return { ...this.sessionDefaults };
        }

        // Start with global defaults
        const globalDefaults = await this.db.getDefaults('global');
        Object.assign(result, globalDefaults);

        // Layer role defaults (if user has roles)
        if (userId && this.options.userRoles) {
            for (const role of this.options.userRoles) {
                const roleDefaults = await this.db.getDefaults('role', role);
                Object.assign(result, roleDefaults);
            }
        }

        // Layer user defaults
        if (userId) {
            const userDefaults = await this.db.getDefaults('user', userId);
            Object.assign(result, userDefaults);
        }

        // Layer session defaults (highest priority)
        Object.assign(result, this.sessionDefaults);

        return result;
    }

    /**
     * Clear a default value
     *
     * If user is provided, clears user-specific default.
     * Otherwise, clears global default.
     *
     * @param key - The default key
     * @param user - Optional user ID for user-specific default
     * @returns True if default was cleared
     */
    async clearDefault(key: string, user?: string): Promise<boolean> {
        if (!this.db) {
            return false;
        }

        const scope: DefaultScope = user ? 'user' : 'global';
        const scopeId = user || undefined;

        return this.db.clearDefault(key, scope, scopeId);
    }

    /**
     * Set a session-scoped default (in-memory only)
     *
     * Session defaults have highest priority and are not persisted.
     *
     * @param key - The default key
     * @param value - The default value
     */
    setSessionDefault(key: string, value: any): void {
        this.sessionDefaults[key] = value;
    }

    /**
     * Get a session default
     *
     * @param key - The default key
     * @returns The session default value, or undefined
     */
    getSessionDefault(key: string): any | undefined {
        return this.sessionDefaults[key];
    }

    /**
     * Clear all session defaults
     */
    clearSessionDefaults(): void {
        this.sessionDefaults = {};
    }

    /**
     * Clear a single session default
     *
     * @param key - The default key
     */
    clearSessionDefault(key: string): void {
        delete this.sessionDefaults[key];
    }

    /**
     * Set a role-based default
     *
     * @param key - The default key
     * @param value - The default value
     * @param role - The role name
     */
    async setRoleDefault(key: string, value: any, role: string): Promise<void> {
        if (!this.db) {
            return;
        }

        await this.db.setDefault(key, value, 'role', role);
    }

    /**
     * Clear a role-based default
     *
     * @param key - The default key
     * @param role - The role name
     * @returns True if default was cleared
     */
    async clearRoleDefault(key: string, role: string): Promise<boolean> {
        if (!this.db) {
            return false;
        }

        return this.db.clearDefault(key, 'role', role);
    }

    /**
     * Resolve a default value using full hierarchy
     *
     * Resolution order (highest to lowest priority):
     * 1. Session (in-memory)
     * 2. User-specific (database)
     * 3. Role-based (database) - checks all user roles
     * 4. Global (database)
     *
     * @param key - The default key
     * @returns The resolved default value, or undefined
     */
    async resolveDefault(key: string): Promise<any | undefined> {
        // 1. Check session defaults (highest priority)
        if (key in this.sessionDefaults) {
            return this.sessionDefaults[key];
        }

        if (!this.db) {
            return undefined;
        }

        // 2. Check user-specific defaults
        if (this.options.userId) {
            const userValue = await this.db.getDefault(key, 'user', this.options.userId);
            if (userValue !== null) {
                return userValue;
            }
        }

        // 3. Check role-based defaults
        if (this.options.userRoles && this.options.userRoles.length > 0) {
            // Check roles in order (first match wins)
            for (const role of this.options.userRoles) {
                const roleValue = await this.db.getDefault(key, 'role', role);
                if (roleValue !== null) {
                    return roleValue;
                }
            }
        }

        // 4. Check global defaults (lowest priority)
        const globalValue = await this.db.getDefault(key, 'global');
        if (globalValue !== null) {
            return globalValue;
        }

        return undefined;
    }

    /**
     * Check if a session default exists
     *
     * @param key - The default key
     * @returns True if session default exists
     */
    hasSessionDefault(key: string): boolean {
        return key in this.sessionDefaults;
    }

    /**
     * Get all session defaults
     *
     * @returns Copy of all session defaults
     */
    getSessionDefaults(): Record<string, any> {
        return { ...this.sessionDefaults };
    }
}

/**
 * Factory function to create a new DefaultManager instance
 *
 * @param db - Optional database implementation
 * @param options - Optional configuration options
 * @returns New DefaultManager instance
 */
export function createDefaultManager(
    db?: DefaultDatabase,
    options: DefaultManagerOptions = {}
): DefaultManager {
    const manager = new DefaultManager(options);
    if (db) {
        manager.setDatabase(db);
    }
    return manager;
}
