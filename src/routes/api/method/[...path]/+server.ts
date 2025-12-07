/**
 * Custom Method API Route
 *
 * Handles whitelisted server method invocations.
 * Path: /api/method/{...path}
 *
 * Example: /api/method/frappe.client.get_count
 *
 * @module routes/api/method/[...path]
 */

import type { RequestHandler } from './$types';
import {
    createSuccessResponse,
    badRequest,
    unauthorized,
    notFound,
    serverError,
    requireAuth,
    parseRequestBody
} from '$lib/api';
import { getMethod } from '$lib/api/method-registry';

// =============================================================================
// GET - Call Method (for simple methods)
// =============================================================================

/**
 * GET /api/method/{...path}
 *
 * Call a whitelisted method with query parameters.
 * Useful for simple GET requests that don't require a body.
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
    try {
        const methodPath = params.path;

        if (!methodPath) {
            return badRequest('Method path is required');
        }

        // Look up method
        const method = getMethod(methodPath);

        if (!method) {
            return notFound(`Method '${methodPath}' is not registered or whitelisted`);
        }

        // Check permission
        if (method.permission === 'user' || method.permission === 'admin') {
            if (!requireAuth({ locals } as any)) {
                return unauthorized();
            }
        }

        if (method.permission === 'admin') {
            // TODO: Check if user is admin
            // For now, just require authentication
        }

        // Convert query params to object
        const queryParams: Record<string, unknown> = {};
        url.searchParams.forEach((value, key) => {
            // Try to parse JSON values
            try {
                queryParams[key] = JSON.parse(value);
            } catch {
                queryParams[key] = value;
            }
        });

        // Execute method
        const result = await method.handler(queryParams);

        return createSuccessResponse(result, 'Success');
    } catch (err) {
        console.error('GET /api/method/[...path] error:', err);

        if (err instanceof Error) {
            return serverError(err.message);
        }

        return serverError('An unexpected error occurred');
    }
};

// =============================================================================
// POST - Call Method (with body)
// =============================================================================

/**
 * POST /api/method/{...path}
 *
 * Call a whitelisted method with JSON body parameters.
 * Used for methods that require complex input.
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
    try {
        const methodPath = params.path;

        if (!methodPath) {
            return badRequest('Method path is required');
        }

        // Look up method
        const method = getMethod(methodPath);

        if (!method) {
            return notFound(`Method '${methodPath}' is not registered or whitelisted`);
        }

        // Check permission
        if (method.permission === 'user' || method.permission === 'admin') {
            if (!requireAuth({ locals } as any)) {
                return unauthorized();
            }
        }

        if (method.permission === 'admin') {
            // TODO: Check if user is admin
        }

        // Parse request body
        const body = await parseRequestBody(request);
        const params_obj = body || {};

        // Execute method
        const result = await method.handler(params_obj);

        return createSuccessResponse(result, 'Success');
    } catch (err) {
        console.error('POST /api/method/[...path] error:', err);

        if (err instanceof Error) {
            return serverError(err.message);
        }

        return serverError('An unexpected error occurred');
    }
};
