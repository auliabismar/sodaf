/**
 * SvelteKit Server Hooks
 *
 * P3-014: Auth middleware integration with cache layers.
 * Each request is wrapped in a request cache scope and user
 * session data is populated into event.locals.
 *
 * @module hooks.server
 */

import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { runWithRequestCache } from '$lib/cache/request-cache';
import { CacheManager, createCacheManager } from '$lib/cache/cache-manager';
import {
    createAuthMiddleware,
    createCSRFMiddleware,
    SESSION_COOKIE,
    setCSRFCookie,
    type AuthMiddlewareConfig,
} from '$lib/auth/middleware';
import { AuthManager } from '$lib/auth/auth-manager';
import { UserManager } from '$lib/auth/user-manager';

/**
 * Global cache manager instance
 */
let cacheManager: CacheManager | null = null;

/**
 * Global auth manager instance
 */
let authManager: AuthManager | null = null;

/**
 * Global user manager instance
 */
let userManager: UserManager | null = null;

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
 * Get or create the global user manager
 */
export function getUserManager(): UserManager {
    if (!userManager) {
        userManager = new UserManager();
    }
    return userManager;
}

/**
 * Set the user manager (for testing or custom configuration)
 */
export function setUserManager(manager: UserManager): void {
    userManager = manager;
}

/**
 * Get or create the global auth manager
 */
export function getAuthManager(): AuthManager {
    if (!authManager) {
        authManager = new AuthManager({ userManager: getUserManager() });
    }
    return authManager;
}

/**
 * Set the auth manager (for testing or custom configuration)
 */
export function setAuthManager(manager: AuthManager): void {
    authManager = manager;
}

/**
 * Cache middleware handle
 * Wraps each request in a request cache scope and populates cache manager
 */
const cacheHandle: Handle = async ({ event, resolve }) => {
    const manager = getCacheManager();

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

/**
 * Create auth handle with dependency injection
 */
function createAuthHandle(): Handle {
    return createAuthMiddleware({
        authManager: getAuthManager(),
        refreshSession: true,
        refreshThreshold: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * CSRF handle for state-changing requests
 */
const csrfHandle: Handle = createCSRFMiddleware({
    excludePaths: ['/api/auth/login', '/api/auth/logout'],
    excludeApiRoutes: true, // Skip CSRF for API key auth
});

/**
 * CSRF token initialization handle
 * Sets CSRF cookie for non-authenticated requests that don't have one
 */
const csrfInitHandle: Handle = async ({ event, resolve }) => {
    // Set CSRF token if not present
    if (!event.cookies.get('sodaf_csrf')) {
        setCSRFCookie(event);
    }
    return resolve(event);
};

/**
 * Combined handle hook
 *
 * Order of middleware:
 * 1. Cache - Set up request cache scope
 * 2. Auth - Validate tokens and set user
 * 3. CSRF Init - Ensure CSRF cookie exists
 * 4. CSRF - Validate CSRF tokens for state changes
 */
export const handle: Handle = sequence(
    cacheHandle,
    createAuthHandle(),
    csrfInitHandle,
    csrfHandle
);

