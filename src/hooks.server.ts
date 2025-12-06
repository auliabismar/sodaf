/**
 * SvelteKit Server Hooks
 *
 * Integrates cache layers with SvelteKit request lifecycle.
 * Each request is wrapped in a request cache scope and user
 * session data is populated into event.locals.
 *
 * @module hooks.server
 */

import type { Handle } from '@sveltejs/kit';
import { runWithRequestCache } from '$lib/cache/request-cache';
import { CacheManager, createCacheManager } from '$lib/cache/cache-manager';

/**
 * Cookie name for session ID
 */
const SESSION_COOKIE = 'sodaf_session';

/**
 * Global cache manager instance
 */
let cacheManager: CacheManager | null = null;

/**
 * Get or create the global cache manager
 */
export function getCacheManager(): CacheManager {
    if (!cacheManager) {
        cacheManager = createCacheManager();
    }
    return cacheManager;
}

/**
 * Set the cache manager (for testing or custom configuration)
 */
export function setCacheManager(manager: CacheManager): void {
    cacheManager = manager;
}

/**
 * Handle hook
 *
 * Wraps each request in a request cache scope and loads
 * user session data into event.locals.
 */
export const handle: Handle = async ({ event, resolve }) => {
    const manager = getCacheManager();

    // Wrap the entire request in a request cache scope
    return runWithRequestCache(async () => {
        // Get session ID from cookie
        const sessionId = event.cookies.get(SESSION_COOKIE);

        // Populate locals with cache manager
        event.locals.cacheManager = manager;

        if (sessionId) {
            // Try to get session data
            const sessionData = manager.session.getSession(sessionId);

            if (sessionData) {
                // Valid session - populate locals
                event.locals.sessionId = sessionId;
                event.locals.userId = sessionData.userId;

                // Get user cache
                const userCache = manager.getUserSessionCache(sessionId);
                if (userCache) {
                    event.locals.userCache = userCache;
                }
            } else {
                // Session expired or invalid - clear cookie
                event.cookies.delete(SESSION_COOKIE, { path: '/' });
                event.locals.sessionId = undefined;
                event.locals.userId = undefined;
                event.locals.userCache = undefined;
            }
        } else {
            // No session - unauthenticated request
            event.locals.sessionId = undefined;
            event.locals.userId = undefined;
            event.locals.userCache = undefined;
        }

        // Process the request
        const response = await resolve(event);

        return response;
    });
};
