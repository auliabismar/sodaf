/**
 * Document Action API Route
 *
 * Handles workflow actions for submittable documents:
 * - submit: Submit a draft document
 * - cancel: Cancel a submitted document
 * - amend: Create an amended copy of a cancelled document
 *
 * Path: /api/resource/{doctype}/{name}/{action}
 *
 * @module routes/api/resource/[doctype]/[name]/[action]
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
    normalizeDocTypeName
} from '$lib/api';

// =============================================================================
// Valid Actions
// =============================================================================

const VALID_ACTIONS = ['submit', 'cancel', 'amend'] as const;
type DocumentAction = typeof VALID_ACTIONS[number];

/**
 * Check if an action is valid
 */
function isValidAction(action: string): action is DocumentAction {
    return VALID_ACTIONS.includes(action as DocumentAction);
}

// =============================================================================
// POST - Execute Action
// =============================================================================

/**
 * POST /api/resource/{doctype}/{name}/{action}
 *
 * Execute a workflow action on a document.
 *
 * Actions:
 * - submit: Change docstatus from 0 (Draft) to 1 (Submitted)
 * - cancel: Change docstatus from 1 (Submitted) to 2 (Cancelled)
 * - amend: Create a new draft copy from a cancelled document
 */
export const POST: RequestHandler = async ({ params, locals }) => {
    try {
        const doctypeParam = params.doctype;
        const name = params.name;
        const action = params.action;

        // Validate parameters
        if (!doctypeParam) {
            return badRequest('DocType is required');
        }
        if (!name) {
            return badRequest('Document name is required');
        }
        if (!action) {
            return badRequest('Action is required');
        }
        if (!isValidAction(action)) {
            return badRequest(`Invalid action '${action}'. Valid actions are: ${VALID_ACTIONS.join(', ')}`);
        }

        const doctype = normalizeDocTypeName(doctypeParam);

        // Check authentication
        if (!requireAuth({ locals } as any)) {
            return unauthorized();
        }

        // Check action-specific permission
        if (!checkPermission({ locals } as any, doctype, action)) {
            return forbidden(`You do not have permission to ${action} this document`);
        }

        // Get database and fetch document
        const db = getDatabase();
        const doc = await db.get_doc(doctype, name);

        if (!doc) {
            return notFound(`Document '${name}' not found in ${doctype}`);
        }

        // Execute action based on type
        let result: any;
        let message: string;

        switch (action) {
            case 'submit':
                result = await handleSubmit(db, doctype, name, doc);
                message = 'Document submitted successfully';
                break;

            case 'cancel':
                result = await handleCancel(db, doctype, name, doc);
                message = 'Document cancelled successfully';
                break;

            case 'amend':
                result = await handleAmend(db, doctype, name, doc);
                message = 'Document amended successfully';
                break;
        }

        return createSuccessResponse(result, message);
    } catch (err) {
        console.error('POST /api/resource/[doctype]/[name]/[action] error:', err);

        if (err instanceof Error) {
            if (err.message.includes('no such table')) {
                return badRequest(`DocType '${params.doctype}' does not exist`);
            }
            // Return specific action errors as bad request
            if (err.message.includes('Cannot')) {
                return badRequest(err.message);
            }
            return serverError(err.message);
        }

        return serverError('An unexpected error occurred');
    }
};

// =============================================================================
// Action Handlers
// =============================================================================

/**
 * Handle document submission
 */
async function handleSubmit(
    db: any,
    doctype: string,
    name: string,
    doc: any
): Promise<any> {
    // Check current status
    const docstatus = doc.docstatus ?? 0;

    if (docstatus !== 0) {
        throw new Error('Cannot submit: Document is not in Draft status');
    }

    // Update docstatus to 1 (Submitted)
    await db.update(doctype, name, { docstatus: 1 });

    // Return updated document
    return await db.get_doc(doctype, name);
}

/**
 * Handle document cancellation
 */
async function handleCancel(
    db: any,
    doctype: string,
    name: string,
    doc: any
): Promise<any> {
    // Check current status
    const docstatus = doc.docstatus ?? 0;

    if (docstatus !== 1) {
        throw new Error('Cannot cancel: Document is not in Submitted status');
    }

    // Update docstatus to 2 (Cancelled)
    await db.update(doctype, name, { docstatus: 2 });

    // Return updated document
    return await db.get_doc(doctype, name);
}

/**
 * Handle document amendment
 *
 * Creates a new draft copy of a cancelled document with:
 * - New name with -1, -2, etc. suffix
 * - amended_from pointing to original document
 * - docstatus reset to 0 (Draft)
 */
async function handleAmend(
    db: any,
    doctype: string,
    name: string,
    doc: any
): Promise<any> {
    // Check current status
    const docstatus = doc.docstatus ?? 0;

    if (docstatus !== 2) {
        throw new Error('Cannot amend: Document is not in Cancelled status');
    }

    // Create new document with amended fields
    const newDoc = { ...doc };
    delete newDoc.name;
    newDoc.docstatus = 0;
    newDoc.amended_from = name;

    // Generate new name with amendment suffix
    const baseName = name.replace(/-\d+$/, '');
    let amendmentNumber = 1;
    let newName = `${baseName}-${amendmentNumber}`;

    // Check if amended name already exists and increment
    while (await db.exists(doctype, newName)) {
        amendmentNumber++;
        newName = `${baseName}-${amendmentNumber}`;
    }

    newDoc.name = newName;

    // Insert the amended document
    await db.insert(doctype, newDoc);

    // Return the new document
    return await db.get_doc(doctype, newName);
}
