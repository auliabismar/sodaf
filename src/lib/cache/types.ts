/**
 * Cache Types and Interfaces
 * 
 * This file defines TypeScript interfaces for the three-layer caching system:
 * 1. System-wide cache for DocTypes, Workspaces, and Role Permissions
 * 2. User-specific cache for user sessions and permissions
 * 3. Generic cache entry interface for all cache types
 */

// Simple DocType interface for cache purposes
export interface DocType {
	name: string;
	module: string;
	fields: Record<string, any>;
	permissions: string[];
}

/**
 * Generic cache entry interface
 */
export interface CacheEntry<T> {
	/** The cached value */
	value: T;
	/** When the entry was cached (timestamp) */
	cachedAt: Date;
	/** Time to live in cache (seconds) */
	ttl: number;
}

/**
 * Cache invalidation event types
 */
export type CacheInvalidationEvent =
	| 'doctype_saved'
	| 'workspace_saved'
	| 'permission_changed';

/**
 * Cache statistics interface
 */
export interface CacheStats {
	/** Number of cache hits */
	hits: number;
	/** Number of cache misses */
	misses: number;
	/** Current cache size in bytes */
	size: number;
	/** When the cache was last cleared */
	lastCleared?: Date;
}

/**
 * System cache interface
 */
export interface SystemCache {
	/** DocType metadata cache */
	docTypes: Record<string, DocType>;
	/** Workspace information cache */
	workspaces: Record<string, any>;
	/** Role permissions cache */
	rolePermissions: Record<string, string[]>;
	/** System settings cache */
	systemSettings: Record<string, any>;
}

/**
 * User session cache interface
 */
export interface UserSessionCache {
	/** User information */
	user: {
		userId: string;
		name: string;
		email: string;
	};
	/** User roles */
	roles: string[];
	/** User permissions */
	userPermissions: string[];
	/** Visible workspaces for user */
	visibleWorkspaces: string[];
	/** User default settings */
	defaults: Record<string, any>;
}

/**
 * User session data interface
 */
export interface UserSessionData {
	/** User identifier */
	userId: string;
	/** User roles */
	roles: string[];
	/** Permissions granted to user */
	permissions: string[];
	/** Currently active workspace */
	activeWorkspace?: string;
	/** User preferences */
	preferences: Record<string, any>;
	/** Session expiry time */
	expiresAt: Date;
	/** Last activity timestamp */
	lastActivity: Date;
}

/**
 * User workspace permissions interface
 */
export interface UserWorkspacePermissions {
	/** Get user's permissions for a specific workspace */
	getWorkspacePermissions(userId: string, workspace: string): Promise<string[]>;
	
	/** Get user's permissions for a specific workspace from cache only */
	getWorkspacePermissionsCached(userId: string, workspace: string): string[];
	
	/** Set user's permissions for a workspace */
	setWorkspacePermissions(userId: string, workspace: string, permissions: string[]): Promise<void>;
	
	/** Invalidate user's workspace permissions */
	invalidateWorkspacePermissions(userId: string, workspace: string): Promise<void>;
	
	/** Get visible workspaces for user */
	getVisibleWorkspaces(userId: string): Promise<string[]>;
	
	/** Get visible workspaces for user from cache only */
	getVisibleWorkspacesCached(userId: string): string[];
}

/**
 * Cache event interface for subscribers
 */
export interface CacheEvent {
	/** Event type */
	type: CacheInvalidationEvent;
	/** DocType affected (if applicable) */
	doctype?: string;
	/** Workspace affected (if applicable) */
	workspace?: string;
	/** User affected (if applicable) */
	userId?: string;
	/** Event data */
	data?: any;
	/** Event timestamp */
	timestamp: Date;
}

/**
 * Cache event subscriber interface
 */
export interface CacheEventSubscriber {
	/** Handle cache event */
	(event: CacheEvent): void;
}

/**
 * Cache event emitter interface
 */
export interface CacheEventEmitter {
	/** Subscribe to cache events */
	on(event: CacheInvalidationEvent, subscriber: CacheEventSubscriber): () => () => void;
	
	/** Unsubscribe from cache events */
	off(event: CacheInvalidationEvent, subscriber: CacheEventSubscriber): () => () => void;
	
	/** Emit a cache event */
	emit(event: CacheInvalidationEvent, data?: any): void;
}