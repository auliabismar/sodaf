/**
 * Default Values System Types
 *
 * Defines TypeScript interfaces for the multi-level default values system.
 * Resolution hierarchy: Session > User > Role > Global
 *
 * @module core/defaults/types
 */

/**
 * Scope levels for default values
 *
 * Resolution order (highest to lowest priority):
 * - session: In-memory, request-scoped defaults
 * - user: User-specific defaults stored in database
 * - role: Role-based defaults stored in database
 * - global: System-wide defaults stored in database
 */
export type DefaultScope = 'global' | 'role' | 'user' | 'session';

/**
 * A stored default value entry
 */
export interface DefaultEntry {
    /** The default key (e.g., 'Company', 'Warehouse') */
    key: string;
    /** The default value */
    value: any;
    /** The scope of this default */
    scope: DefaultScope;
    /** The scope identifier (userId for 'user', roleName for 'role', null for 'global') */
    scopeId?: string;
    /** When this default was created/updated */
    createdAt: Date;
}

/**
 * Options for configuring the DefaultManager
 */
export interface DefaultManagerOptions {
    /** Current user ID for user-scoped operations */
    userId?: string;
    /** Current user's roles for role-scoped lookups */
    userRoles?: string[];
}

/**
 * Database interface for default values storage
 *
 * This interface allows for dependency injection during testing.
 */
export interface DefaultDatabase {
    /**
     * Get a single default value from the database
     */
    getDefault(key: string, scope: DefaultScope, scopeId?: string): Promise<any | null>;

    /**
     * Set a default value in the database
     */
    setDefault(key: string, value: any, scope: DefaultScope, scopeId?: string): Promise<void>;

    /**
     * Get all defaults for a given scope
     */
    getDefaults(scope: DefaultScope, scopeId?: string): Promise<Record<string, any>>;

    /**
     * Clear a default value from the database
     */
    clearDefault(key: string, scope: DefaultScope, scopeId?: string): Promise<boolean>;
}
