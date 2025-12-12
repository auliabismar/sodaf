/**
 * Auth Guards
 * 
 * P3-014: Route guards for protecting endpoints.
 * Provides requireAuth, requireRole, and requirePermission guards.
 */

import type { RequestEvent } from '@sveltejs/kit';
import type { User } from './types';
import type { PermissionType } from '../permissions/types';
import { AuthRequiredError, ForbiddenError } from './middleware';

// ==================== Types ====================

/**
 * Extended locals with user
 */
interface AuthLocals {
    user: User | null;
    userRoles?: string[];
}

/**
 * Guard result - either passes (returns user) or throws
 */
export type GuardResult = User;

/**
 * Permission checker function type
 */
export type PermissionChecker = (
    user: User,
    doctype: string,
    ptype: PermissionType
) => boolean | Promise<boolean>;

// ==================== Guards ====================

/**
 * Require authentication guard
 * P3-014-T7: Protected route without auth returns 401
 * P3-014-T8: Protected route with auth proceeds
 * P3-014-T11: requireAuth guard protects routes
 * 
 * @param event - SvelteKit request event
 * @returns Authenticated user
 * @throws AuthRequiredError if not authenticated
 */
export function requireAuth(event: RequestEvent): GuardResult {
    const locals = event.locals as AuthLocals;

    if (!locals.user) {
        throw new AuthRequiredError('Authentication required');
    }

    return locals.user;
}

/**
 * Require specific role guard
 * P3-014-T10: Returns 403 if wrong role
 * P3-014-T12: requireRole(role) provides role-specific protection
 * 
 * @param role - Required role name
 * @returns Guard function
 */
export function requireRole(role: string): (event: RequestEvent) => GuardResult {
    return (event: RequestEvent) => {
        const user = requireAuth(event);
        const locals = event.locals as AuthLocals;

        // Check if user has the required role
        const userRoles = locals.userRoles ?? [];

        // System Manager has all roles
        if (userRoles.includes('System Manager')) {
            return user;
        }

        if (!userRoles.includes(role)) {
            throw new ForbiddenError(`Role '${role}' required`);
        }

        return user;
    };
}

/**
 * Require specific permission guard
 * P3-014-T9: Permission check middleware returns 403 if no permission
 * P3-014-T13: requirePermission(doctype, ptype) performs permission check
 * 
 * @param doctype - DocType to check permission for
 * @param ptype - Permission type to check
 * @param checker - Optional permission checker function
 * @returns Guard function
 */
export function requirePermission(
    doctype: string,
    ptype: PermissionType,
    checker?: PermissionChecker
): (event: RequestEvent) => GuardResult | Promise<GuardResult> {
    return async (event: RequestEvent) => {
        const user = requireAuth(event);

        // If a checker is provided, use it
        if (checker) {
            const hasPermission = await checker(user, doctype, ptype);
            if (!hasPermission) {
                throw new ForbiddenError(`Permission '${ptype}' on '${doctype}' required`);
            }
            return user;
        }

        // Default behavior: check locals for userRoles and assume System Manager has all permissions
        const locals = event.locals as AuthLocals;
        const userRoles = locals.userRoles ?? [];

        if (userRoles.includes('System Manager')) {
            return user;
        }

        // Without a checker, we can't verify specific permissions
        // This should be configured with a proper PermissionManager checker
        throw new ForbiddenError(`Permission '${ptype}' on '${doctype}' required`);
    };
}

// ==================== Utility Functions ====================

/**
 * Create a permission checker from a PermissionManager-like object
 * 
 * @param permissionManager - Object with hasPermission method
 * @returns Permission checker function
 */
export function createPermissionChecker(
    permissionManager: { hasPermission: (doctype: string, ptype: PermissionType) => boolean }
): PermissionChecker {
    return (_user: User, doctype: string, ptype: PermissionType) => {
        return permissionManager.hasPermission(doctype, ptype);
    };
}

/**
 * Handle guard errors and return appropriate response
 * 
 * @param error - Error thrown by guard
 * @returns Response object
 */
export function handleGuardError(error: unknown): Response {
    if (error instanceof AuthRequiredError) {
        return new Response(JSON.stringify({
            error: 'Unauthorized',
            message: error.message
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (error instanceof ForbiddenError) {
        return new Response(JSON.stringify({
            error: 'Forbidden',
            message: error.message
        }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Re-throw unknown errors
    throw error;
}

/**
 * Wrap an endpoint handler with guard protection
 * 
 * @param guard - Guard function to apply
 * @param handler - Request handler function
 * @returns Protected handler
 */
export function withGuard<T>(
    guard: (event: RequestEvent) => GuardResult | Promise<GuardResult>,
    handler: (event: RequestEvent, user: User) => T | Promise<T>
): (event: RequestEvent) => Promise<T | Response> {
    return async (event: RequestEvent) => {
        try {
            const user = await guard(event);
            return await handler(event, user);
        } catch (error) {
            return handleGuardError(error);
        }
    };
}
