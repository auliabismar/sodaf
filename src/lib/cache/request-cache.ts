/**
 * Request Cache
 *
 * Implements request-scoped cache using Node.js AsyncLocalStorage.
 * This provides request isolation - each HTTP request gets its own
 * cache that is automatically cleaned up when the request completes.
 *
 * @module cache/request-cache
 */

import { AsyncLocalStorage } from 'async_hooks';

/**
 * Request cache entry with metadata
 */
interface RequestCacheData {
    cache: Map<string, any>;
    createdAt: Date;
    stats: RequestCacheStats;
}

/**
 * Statistics for request-scoped cache
 */
export interface RequestCacheStats {
    hits: number;
    misses: number;
    sets: number;
}

/**
 * AsyncLocalStorage instance for request-scoped caching
 */
const requestStorage = new AsyncLocalStorage<RequestCacheData>();

/**
 * Run a function within a request cache scope
 *
 * Creates an isolated cache context for the duration of the function.
 * The cache is automatically cleaned up when the function completes.
 *
 * @param fn - Function to run within the cache scope
 * @returns The return value of the function
 *
 * @example
 * ```typescript
 * const result = await runWithRequestCache(async () => {
 *   cacheForRequest('user:123', userData);
 *   return await processRequest();
 * });
 * ```
 */
export async function runWithRequestCache<T>(fn: () => T | Promise<T>): Promise<T> {
    const cacheData: RequestCacheData = {
        cache: new Map(),
        createdAt: new Date(),
        stats: {
            hits: 0,
            misses: 0,
            sets: 0
        }
    };

    return requestStorage.run(cacheData, fn);
}

/**
 * Run a synchronous function within a request cache scope
 *
 * @param fn - Synchronous function to run within the cache scope
 * @returns The return value of the function
 */
export function runWithRequestCacheSync<T>(fn: () => T): T {
    const cacheData: RequestCacheData = {
        cache: new Map(),
        createdAt: new Date(),
        stats: {
            hits: 0,
            misses: 0,
            sets: 0
        }
    };

    return requestStorage.run(cacheData, fn);
}

/**
 * Get the current request cache data
 *
 * @returns The current request cache data or undefined if not in a request context
 */
function getRequestData(): RequestCacheData | undefined {
    return requestStorage.getStore();
}

/**
 * Cache a value for the current request
 *
 * Values cached here are only visible within the current request
 * and are automatically cleaned up when the request completes.
 *
 * @param key - Cache key
 * @param value - Value to cache
 * @returns true if cached, false if not in request context
 *
 * @example
 * ```typescript
 * cacheForRequest('permission:User:read', true);
 * ```
 */
export function cacheForRequest<T>(key: string, value: T): boolean {
    const data = getRequestData();
    if (!data) {
        return false;
    }

    data.cache.set(key, value);
    data.stats.sets++;
    return true;
}

/**
 * Get a cached value from the current request
 *
 * @param key - Cache key
 * @returns Cached value or undefined if not found or not in request context
 *
 * @example
 * ```typescript
 * const hasPermission = getFromRequest<boolean>('permission:User:read');
 * ```
 */
export function getFromRequest<T>(key: string): T | undefined {
    const data = getRequestData();
    if (!data) {
        return undefined;
    }

    if (data.cache.has(key)) {
        data.stats.hits++;
        return data.cache.get(key) as T;
    }

    data.stats.misses++;
    return undefined;
}

/**
 * Check if a key exists in the current request cache
 *
 * @param key - Cache key
 * @returns true if key exists, false otherwise
 */
export function hasInRequest(key: string): boolean {
    const data = getRequestData();
    if (!data) {
        return false;
    }
    return data.cache.has(key);
}

/**
 * Delete a key from the current request cache
 *
 * @param key - Cache key to delete
 * @returns true if deleted, false if not found or not in context
 */
export function deleteFromRequest(key: string): boolean {
    const data = getRequestData();
    if (!data) {
        return false;
    }
    return data.cache.delete(key);
}

/**
 * Clear all entries from the current request cache
 *
 * @returns true if cleared, false if not in request context
 */
export function clearRequestCache(): boolean {
    const data = getRequestData();
    if (!data) {
        return false;
    }

    data.cache.clear();
    return true;
}

/**
 * Get statistics for the current request cache
 *
 * @returns Cache statistics or null if not in request context
 */
export function getRequestCacheStats(): RequestCacheStats | null {
    const data = getRequestData();
    if (!data) {
        return null;
    }

    return { ...data.stats };
}

/**
 * Get the size of the current request cache
 *
 * @returns Number of entries in the cache, or 0 if not in context
 */
export function getRequestCacheSize(): number {
    const data = getRequestData();
    if (!data) {
        return 0;
    }
    return data.cache.size;
}

/**
 * Check if currently in a request cache context
 *
 * @returns true if in a request context, false otherwise
 */
export function isInRequestContext(): boolean {
    return getRequestData() !== undefined;
}

/**
 * Get or set a cached value using a factory function
 *
 * If the key exists in cache, returns the cached value.
 * Otherwise, calls the factory function, caches the result, and returns it.
 *
 * @param key - Cache key
 * @param factory - Function to generate value if not cached
 * @returns Cached or newly generated value, or undefined if not in context
 *
 * @example
 * ```typescript
 * const user = await getOrSetForRequest('user:123', async () => {
 *   return await db.getUser('123');
 * });
 * ```
 */
export async function getOrSetForRequest<T>(
    key: string,
    factory: () => T | Promise<T>
): Promise<T | undefined> {
    const data = getRequestData();
    if (!data) {
        return undefined;
    }

    if (data.cache.has(key)) {
        data.stats.hits++;
        return data.cache.get(key) as T;
    }

    data.stats.misses++;
    const value = await factory();
    data.cache.set(key, value);
    data.stats.sets++;
    return value;
}

/**
 * Synchronous version of getOrSetForRequest
 *
 * @param key - Cache key
 * @param factory - Synchronous function to generate value if not cached
 * @returns Cached or newly generated value, or undefined if not in context
 */
export function getOrSetForRequestSync<T>(
    key: string,
    factory: () => T
): T | undefined {
    const data = getRequestData();
    if (!data) {
        return undefined;
    }

    if (data.cache.has(key)) {
        data.stats.hits++;
        return data.cache.get(key) as T;
    }

    data.stats.misses++;
    const value = factory();
    data.cache.set(key, value);
    data.stats.sets++;
    return value;
}
