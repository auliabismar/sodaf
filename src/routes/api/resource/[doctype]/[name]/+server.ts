/**
 * Single Document API Route
 *
 * Handles read (GET), update (PUT), and delete (DELETE) operations
 * for individual documents.
 * Path: /api/resource/{doctype}/{name}
 *
 * @module routes/api/resource/[doctype]/[name]
 */

import type { RequestHandler } from './$types';
import {
    getDatabase,
    createSuccessResponse,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    serverError,
    requireAuth,
    checkPermission,
    normalizeDocTypeName,
    parseRequestBody
} from '$lib/api';

// =============================================================================
// GET - Read Single Document
// =============================================================================

/**
 * GET /api/resource/{doctype}/{name}
 *
 * Get a single document by name.
 */
export const GET: RequestHandler = async ({ params, locals }) => {
    try {
        const doctypeParam = params.doctype;
        const name = params.name;

        if (!doctypeParam) {
            return badRequest('DocType is required');
        }
        if (!name) {
            return badRequest('Document name is required');
        }

        const doctype = normalizeDocTypeName(doctypeParam);

        // Check read permission
        // Note: For now, we allow unauthenticated access for read
        // TODO: Check DocType-specific permissions

        // Get database and fetch document
        const db = getDatabase();
        const doc = await db.get_doc(doctype, name);

        if (!doc) {
            return notFound(`Document '${name}' not found in ${doctype}`);
        }

        return createSuccessResponse(doc, 'Success');
    } catch (err) {
        console.error('GET /api/resource/[doctype]/[name] error:', err);

        if (err instanceof Error) {
            if (err.message.includes('no such table')) {
                return badRequest(`DocType '${params.doctype}' does not exist`);
            }
            return serverError(err.message);
        }

        return serverError('An unexpected error occurred');
    }
};

// =============================================================================
// PUT - Update Document
// =============================================================================

/**
 * PUT /api/resource/{doctype}/{name}
 *
 * Update an existing document.
 *
 * Request Body:
 * - Fields to update (partial update supported)
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
    try {
        const doctypeParam = params.doctype;
        const name = params.name;

        if (!doctypeParam) {
            return badRequest('DocType is required');
        }
        if (!name) {
            return badRequest('Document name is required');
        }

        const doctype = normalizeDocTypeName(doctypeParam);

        // Check authentication
        if (!requireAuth({ locals } as any)) {
            return unauthorized();
        }

        // Check write permission
        if (!checkPermission({ locals } as any, doctype, 'write')) {
            return forbidden('You do not have permission to update this document');
        }

        // Check if document exists
        const db = getDatabase();
        const existingDoc = await db.get_doc(doctype, name);

        if (!existingDoc) {
            return notFound(`Document '${name}' not found in ${doctype}`);
        }

        // Parse request body
        const body = await parseRequestBody(request);
        if (!body) {
            return badRequest('Invalid request body');
        }

        // Update document
        await db.update(doctype, name, body);

        // Get the updated document
        const updatedDoc = await db.get_doc(doctype, name);

        return createSuccessResponse(updatedDoc, 'Document updated successfully');
    } catch (err) {
        console.error('PUT /api/resource/[doctype]/[name] error:', err);

        if (err instanceof Error) {
            if (err.message.includes('no such table')) {
                return badRequest(`DocType '${params.doctype}' does not exist`);
            }
            return serverError(err.message);
        }

        return serverError('An unexpected error occurred');
    }
};

// =============================================================================
// DELETE - Delete Document
// =============================================================================

/**
 * DELETE /api/resource/{doctype}/{name}
 *
 * Delete an existing document.
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
    try {
        const doctypeParam = params.doctype;
        const name = params.name;

        if (!doctypeParam) {
            return badRequest('DocType is required');
        }
        if (!name) {
            return badRequest('Document name is required');
        }

        const doctype = normalizeDocTypeName(doctypeParam);

        // Check authentication
        if (!requireAuth({ locals } as any)) {
            return unauthorized();
        }

        // Check delete permission
        if (!checkPermission({ locals } as any, doctype, 'delete')) {
            return forbidden('You do not have permission to delete this document');
        }

        // Check if document exists
        const db = getDatabase();
        const existingDoc = await db.get_doc(doctype, name);

        if (!existingDoc) {
            return notFound(`Document '${name}' not found in ${doctype}`);
        }

        // Check if document is submitted (cannot delete submitted documents)
        if (existingDoc.docstatus === 1) {
            return forbidden('Cannot delete submitted documents. Cancel the document first.');
        }

        // Delete document
        await db.delete(doctype, name);

        return createSuccessResponse({ name }, 'Document deleted successfully');
    } catch (err) {
        console.error('DELETE /api/resource/[doctype]/[name] error:', err);

        if (err instanceof Error) {
            if (err.message.includes('no such table')) {
                return badRequest(`DocType '${params.doctype}' does not exist`);
            }
            return serverError(err.message);
        }

        return serverError('An unexpected error occurred');
    }
};
