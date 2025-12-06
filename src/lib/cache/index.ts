/**
 * Cache Module Index
 *
 * Exports all cache types and interfaces for the three-layer caching system
 */

export type {
	CacheEntry,
	CacheInvalidationEvent,
	CacheStats,
	SystemCache,
	UserSessionCache,
	UserSessionData,
	UserWorkspacePermissions,
	CacheEvent,
	CacheEventSubscriber,
	CacheEventEmitter,
	DocType
} from './types';

// System cache exports
export {
	SystemCacheManager,
	createSystemCache,
	type CacheDatabase,
	type SystemCacheOptions
} from './system-cache';

// User cache exports
export {
	UserCacheManager,
	createUserCache,
	type UserCacheDatabase,
	type UserCacheOptions,
	type UserInfo
} from './user-cache';

// Session store exports
export {
	SessionStore,
	createSessionStore,
	type SessionStoreOptions,
	type SessionStoreStats
} from './session-store';

// Request cache exports
export {
	runWithRequestCache,
	runWithRequestCacheSync,
	cacheForRequest,
	getFromRequest,
	hasInRequest,
	deleteFromRequest,
	clearRequestCache,
	getRequestCacheStats,
	getRequestCacheSize,
	isInRequestContext,
	getOrSetForRequest,
	getOrSetForRequestSync,
	type RequestCacheStats
} from './request-cache';

// Cache manager exports
export {
	CacheManager,
	createCacheManager,
	type CacheManagerOptions,
	type CombinedCacheStats
} from './cache-manager';