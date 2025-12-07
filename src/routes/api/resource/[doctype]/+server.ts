/**
 * DocType List and Create API Route
 *
 * Handles list (GET) and create (POST) operations for DocTypes.
 * Path: /api/resource/{doctype}
 *
 * @module routes/api/resource/[doctype]
 */

import type { RequestHandler } from './$types';
import {
    getDatabase,
    createSuccessResponse,
    badRequest,
    unauthorized,
    forbidden,
    serverError,
    requireAuth,
    checkPermission,
    normalizeDocTypeName,
    parseRequestBody
} from '$lib/api';
import { parseQueryOptions, toQueryOptions } from '$lib/api/filters';

// =============================================================================
// GET - List Documents
// =============================================================================

/**
 * GET /api/resource/{doctype}
 *
 * List documents with optional filtering, pagination, and sorting.
 *
 * Query Parameters:
 * - filters: JSON object {"field":"value"} or array [["field","=","value"]]
 * - fields: JSON array of field names ["name","status"]
 * - order_by: Sort field with direction "creation desc"
 * - limit_start: Pagination offset (default: 0)
 * - limit_page_length: Page size (default: 20)
 * - pluck: Single field to extract as array
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
    try {
        const doctypeParam = params.doctype;
        if (!doctypeParam) {
            return badRequest('DocType is required');
        }

        const doctype = normalizeDocTypeName(doctypeParam);

        // Check read permission
        // Note: For now, we allow unauthenticated access for read
        // TODO: Check DocType-specific permissions

        // Parse query options from URL
        const parsedOptions = parseQueryOptions(url);
        const queryOptions = toQueryOptions(parsedOptions);

        // Get database and execute query
        const db = getDatabase();
        const data = await db.get_all(doctype, queryOptions);

        return createSuccessResponse(data, 'Success');
    } catch (err) {
        console.error('GET /api/resource/[doctype] error:', err);

        if (err instanceof Error) {
            // Check for "table not found" errors
            if (err.message.includes('no such table')) {
                return badRequest(`DocType '${params.doctype}' does not exist`);
            }
            return serverError(err.message);
        }

        return serverError('An unexpected error occurred');
    }
};

// =============================================================================
// POST - Create Document
// =============================================================================

/**
 * POST /api/resource/{doctype}
 *
 * Create a new document.
 *
 * Request Body:
 * - All fields for the new document
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
    try {
        const doctypeParam = params.doctype;
        if (!doctypeParam) {
            return badRequest('DocType is required');
        }

        const doctype = normalizeDocTypeName(doctypeParam);

        // Check authentication
        if (!requireAuth({ locals } as any)) {
            return unauthorized();
        }

        // Check create permission
        if (!checkPermission({ locals } as any, doctype, 'create')) {
            return forbidden('You do not have permission to create this document');
        }

        // Parse request body
        const body = await parseRequestBody(request);
        if (!body) {
            return badRequest('Invalid request body');
        }

        // Get database and insert document
        const db = getDatabase();
        const name = await db.insert(doctype, body);

        // Get the created document
        const doc = await db.get_doc(doctype, name as string);

        return createSuccessResponse(doc, 'Document created successfully', 201);
    } catch (err) {
        console.error('POST /api/resource/[doctype] error:', err);

        if (err instanceof Error) {
            // Check for validation errors
            if (err.message.includes('required')) {
                return badRequest(err.message);
            }
            // Check for unique constraint violations
            if (err.message.includes('UNIQUE constraint')) {
                return badRequest('A document with this name already exists');
            }
            // Check for type errors
            if (err.message.includes('type')) {
                return badRequest(err.message);
            }
            return serverError(err.message);
        }

        return serverError('An unexpected error occurred');
    }
};
