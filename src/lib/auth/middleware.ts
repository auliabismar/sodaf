/**
 * Auth Middleware
 * 
 * P3-014: SvelteKit middleware for authentication.
 * Provides token extraction, session validation, and CSRF protection.
 */

import type { Handle, RequestEvent } from '@sveltejs/kit';
import type { User } from './types';
import type { AuthManager } from './auth-manager';

// ==================== Constants ====================

/** Cookie name for session token */
export const SESSION_COOKIE = 'sodaf_session';

/** Cookie name for auth token */
export const TOKEN_COOKIE = 'sodaf_token';

/** Cookie name for CSRF token */
export const CSRF_COOKIE = 'sodaf_csrf';

/** Header name for CSRF token */
export const CSRF_HEADER = 'X-CSRF-Token';

/** Header name for API key */
export const API_KEY_HEADER = 'X-API-Key';

/** Header name for API secret */
export const API_SECRET_HEADER = 'X-API-Secret';

/** Methods that require CSRF protection */
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// ==================== Types ====================

/**
 * Auth credentials extracted from request
 */
export interface AuthCredentials {
    /** Bearer token (from cookie or header) */
    token?: string;
    /** API key */
    apiKey?: string;
    /** API secret */
    apiSecret?: string;
    /** Source of credentials */
    source: 'cookie' | 'header' | 'api_key' | 'none';
}

/**
 * Auth middleware configuration
 */
export interface AuthMiddlewareConfig {
    /** AuthManager instance */
    authManager: AuthManager;
    /** Whether to refresh session on activity (default: true) */
    refreshSession?: boolean;
    /** Session refresh threshold in ms (default: 5 minutes) */
    refreshThreshold?: number;
}

/**
 * CSRF middleware configuration
 */
export interface CSRFMiddlewareConfig {
    /** Whether to exclude certain paths from CSRF check */
    excludePaths?: string[];
    /** Whether to exclude API routes (default: true for API key auth) */
    excludeApiRoutes?: boolean;
}

// ==================== Token Extraction ====================

/**
 * Extract authentication credentials from a request
 * P3-014-T4: Cookie auth works
 * P3-014-T5: Authorization header works
 * P3-014-T6: API key auth works
 * 
 * @param event - SvelteKit request event
 * @returns Extracted credentials
 */
export function getTokenFromRequest(event: RequestEvent): AuthCredentials {
    // Check for API key first (highest priority for programmatic access)
    const apiKey = event.request.headers.get(API_KEY_HEADER);
    const apiSecret = event.request.headers.get(API_SECRET_HEADER);

    if (apiKey && apiSecret) {
        return {
            apiKey,
            apiSecret,
            source: 'api_key'
        };
    }

    // Check Authorization header
    const authHeader = event.request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return {
            token: authHeader.slice(7),
            source: 'header'
        };
    }

    // Check cookies
    const tokenCookie = event.cookies.get(TOKEN_COOKIE);
    if (tokenCookie) {
        return {
            token: tokenCookie,
            source: 'cookie'
        };
    }

    const sessionCookie = event.cookies.get(SESSION_COOKIE);
    if (sessionCookie) {
        return {
            token: sessionCookie,
            source: 'cookie'
        };
    }

    return { source: 'none' };
}

// ==================== Auth Middleware ====================

/**
 * Create authentication middleware
 * P3-014-T1: Request with valid token sets user
 * P3-014-T2: Request with expired token sets null
 * P3-014-T3: Request without token sets null
 * P3-014-T15: Session refresh on activity
 * 
 * @param config - Middleware configuration
 * @returns SvelteKit handle function
 */
export function createAuthMiddleware(config: AuthMiddlewareConfig): Handle {
    const {
        authManager,
        refreshSession = true,
        refreshThreshold = 5 * 60 * 1000 // 5 minutes
    } = config;

    return async ({ event, resolve }) => {
        // Extract credentials
        const credentials = getTokenFromRequest(event);

        let user: User | null = null;

        if (credentials.source === 'api_key' && credentials.apiKey && credentials.apiSecret) {
            // P3-014-T6: API key authentication
            user = await authManager.validateAPIKey(credentials.apiKey, credentials.apiSecret);
        } else if (credentials.token) {
            // P3-014-T1, T4, T5: Token-based authentication
            user = authManager.validateSession(credentials.token);

            // P3-014-T15: Extend session on activity if user is valid
            if (user && refreshSession && credentials.source === 'cookie') {
                // Session is automatically extended by validateSession
                // The token expiry is checked and last_active is updated
            }
        }

        // Set user in locals (null if not authenticated)
        // P3-014-T2, T3: User is null for expired/missing token
        event.locals.user = user;

        // Proceed with the request
        return resolve(event);
    };
}

// ==================== CSRF Middleware ====================

/**
 * Generate a CSRF token
 * @returns Random CSRF token
 */
export function generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create CSRF protection middleware
 * P3-014-T14: CSRF token validated
 * 
 * @param config - CSRF middleware configuration
 * @returns SvelteKit handle function
 */
export function createCSRFMiddleware(config: CSRFMiddlewareConfig = {}): Handle {
    const {
        excludePaths = [],
        excludeApiRoutes = true
    } = config;

    return async ({ event, resolve }) => {
        const method = event.request.method;
        const path = event.url.pathname;

        // Check if CSRF protection applies
        if (!CSRF_PROTECTED_METHODS.includes(method)) {
            return resolve(event);
        }

        // Exclude specific paths
        if (excludePaths.some(p => path.startsWith(p))) {
            return resolve(event);
        }

        // Exclude API routes if using API key auth
        if (excludeApiRoutes) {
            const apiKey = event.request.headers.get(API_KEY_HEADER);
            if (apiKey) {
                return resolve(event);
            }
        }

        // Validate CSRF token
        const cookieToken = event.cookies.get(CSRF_COOKIE);
        const headerToken = event.request.headers.get(CSRF_HEADER);

        if (!cookieToken || !headerToken || cookieToken !== headerToken) {
            return new Response(JSON.stringify({
                error: 'CSRF validation failed',
                message: 'Invalid or missing CSRF token'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return resolve(event);
    };
}

/**
 * Set CSRF cookie for a response
 * 
 * @param event - Request event
 * @param token - CSRF token (generated if not provided)
 * @returns The CSRF token
 */
export function setCSRFCookie(event: RequestEvent, token?: string): string {
    const csrfToken = token ?? generateCSRFToken();

    event.cookies.set(CSRF_COOKIE, csrfToken, {
        path: '/',
        httpOnly: false, // Must be readable by JavaScript
        secure: event.url.protocol === 'https:',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 24 hours
    });

    return csrfToken;
}

// ==================== Error Classes ====================

/**
 * Error thrown when authentication is required but not provided
 */
export class AuthRequiredError extends Error {
    public readonly status = 401;

    constructor(message: string = 'Authentication required') {
        super(message);
        this.name = 'AuthRequiredError';
    }
}

/**
 * Error thrown when user lacks required permissions
 */
export class ForbiddenError extends Error {
    public readonly status = 403;

    constructor(message: string = 'Permission denied') {
        super(message);
        this.name = 'ForbiddenError';
    }
}
