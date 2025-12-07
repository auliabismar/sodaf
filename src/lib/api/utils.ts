/**
 * API Utilities
 *
 * Common utilities for API routes including response formatting,
 * error handling, and database access.
 *
 * @module api/utils
 */

import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { APISuccessResponse, APIErrorResponse, APIErrorDetails } from './types';
import { SQLiteDatabase } from '$lib/core/database/sqlite-database';

// =============================================================================
// Database Instance
// =============================================================================

/**
 * Singleton database instance for API operations
 */
let dbInstance: SQLiteDatabase | null = null;

/**
 * Get or create the database instance
 *
 * @returns SQLiteDatabase instance
 */
export function getDatabase(): SQLiteDatabase {
    if (!dbInstance) {
        // SQLiteDatabase constructor automatically calls connect()
        dbInstance = new SQLiteDatabase();
    }
    return dbInstance;
}

/**
 * Set the database instance (for testing)
 *
 * @param db - Database instance to use
 */
export function setDatabase(db: SQLiteDatabase): void {
    dbInstance = db;
}

// =============================================================================
// Response Formatting
// =============================================================================

/**
 * Create a success response
 *
 * @param data - Response data
 * @param message - Optional success message
 * @param status - HTTP status code (default: 200)
 * @returns JSON response
 */
export function createSuccessResponse<T>(
    data: T,
    message?: string,
    status: number = 200
): Response {
    const body: APISuccessResponse<T> = { data };
    if (message) {
        body.message = message;
    }
    return json(body, { status });
}

/**
 * Create an error response
 *
 * @param status - HTTP status code
 * @param message - Error message
 * @param details - Additional error details
 * @returns JSON response
 */
export function createErrorResponse(
    status: number,
    message: string,
    details?: Partial<APIErrorDetails>
): Response {
    const errorInfo: APIErrorDetails = {
        message,
        ...details
    };

    const body: APIErrorResponse = {
        data: null,
        error: errorInfo
    };

    return json(body, { status });
}

// =============================================================================
// Error Helpers
// =============================================================================

/**
 * Create a 400 Bad Request response
 *
 * @param message - Error message
 * @param validationErrors - Field validation errors
 * @returns JSON response
 */
export function badRequest(
    message: string,
    validationErrors?: Record<string, string[]>
): Response {
    return createErrorResponse(400, message, { validation_errors: validationErrors });
}

/**
 * Create a 401 Unauthorized response
 *
 * @param message - Error message (default: 'Authentication required')
 * @returns JSON response
 */
export function unauthorized(message: string = 'Authentication required'): Response {
    return createErrorResponse(401, message);
}

/**
 * Create a 403 Forbidden response
 *
 * @param message - Error message (default: 'Permission denied')
 * @returns JSON response
 */
export function forbidden(message: string = 'Permission denied'): Response {
    return createErrorResponse(403, message);
}

/**
 * Create a 404 Not Found response
 *
 * @param message - Error message (default: 'Resource not found')
 * @returns JSON response
 */
export function notFound(message: string = 'Resource not found'): Response {
    return createErrorResponse(404, message);
}

/**
 * Create a 500 Internal Server Error response
 *
 * @param message - Error message (default: 'Internal server error')
 * @returns JSON response
 */
export function serverError(message: string = 'Internal server error'): Response {
    return createErrorResponse(500, message);
}

// =============================================================================
// Permission Checking
// =============================================================================

/**
 * Permission types for DocType operations
 */
export type PermissionType = 'read' | 'write' | 'create' | 'delete' | 'submit' | 'cancel' | 'amend';

/**
 * Check if the current user has permission for the specified operation
 *
 * @param event - SvelteKit request event
 * @param doctype - DocType name
 * @param permission - Required permission
 * @returns True if user has permission, false otherwise
 */
export function checkPermission(
    event: RequestEvent,
    doctype: string,
    permission: PermissionType
): boolean {
    // TODO: Implement proper permission checking using DocType permissions
    // For now, check if user is authenticated
    const { locals } = event;

    // If no session, only allow read for public DocTypes
    if (!locals.sessionId) {
        return false;
    }

    // If user is authenticated, allow all operations for now
    // This should be replaced with proper DocType permission checking
    return true;
}

/**
 * Ensure user is authenticated
 *
 * @param event - SvelteKit request event
 * @returns True if authenticated
 * @throws Unauthorized error if not authenticated
 */
export function requireAuth(event: RequestEvent): boolean {
    if (!event.locals.sessionId) {
        return false;
    }
    return true;
}

// =============================================================================
// DocType Utilities
// =============================================================================

/**
 * Normalize DocType name from URL parameter
 *
 * Converts underscore-separated lowercase to proper DocType name
 * e.g., 'sales_invoice' -> 'Sales Invoice'
 *
 * @param urlDoctype - DocType from URL parameter
 * @returns Normalized DocType name
 */
export function normalizeDocTypeName(urlDoctype: string): string {
    return urlDoctype
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Denormalize DocType name for URL
 *
 * Converts proper DocType name to URL-safe format
 * e.g., 'Sales Invoice' -> 'sales_invoice'
 *
 * @param doctype - DocType name
 * @returns URL-safe DocType string
 */
export function denormalizeDocTypeName(doctype: string): string {
    return doctype.toLowerCase().replace(/\s+/g, '_');
}

// =============================================================================
// Request Body Parsing
// =============================================================================

/**
 * Parse request body as JSON
 *
 * @param request - Fetch Request object
 * @returns Parsed JSON body or null on error
 */
export async function parseRequestBody<T = Record<string, unknown>>(
    request: Request
): Promise<T | null> {
    try {
        const body = await request.json();
        return body as T;
    } catch {
        return null;
    }
}
