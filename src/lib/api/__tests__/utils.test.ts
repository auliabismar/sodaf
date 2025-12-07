/**
 * API Utils Unit Tests
 *
 * Tests for P2-014: SvelteKit API Routes Integration
 *
 * @module api/__tests__/utils.test
 */

import { describe, it, expect } from 'vitest';
import {
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    serverError,
    normalizeDocTypeName,
    denormalizeDocTypeName
} from '../utils';

// =============================================================================
// P2-014-T22: Response format consistent { data: ..., message: ... }
// =============================================================================

describe('P2-014: API Utils', () => {
    describe('P2-014-T22: createSuccessResponse format', () => {
        it('should create response with data field', async () => {
            const response = createSuccessResponse({ name: 'DOC-001' });
            const body = await response.json();

            expect(body.data).toEqual({ name: 'DOC-001' });
        });

        it('should include optional message', async () => {
            const response = createSuccessResponse({ name: 'DOC-001' }, 'Document created');
            const body = await response.json();

            expect(body.data).toEqual({ name: 'DOC-001' });
            expect(body.message).toBe('Document created');
        });

        it('should use correct status code', async () => {
            const response = createSuccessResponse({}, undefined, 201);

            expect(response.status).toBe(201);
        });

        it('should default to status 200', async () => {
            const response = createSuccessResponse({});

            expect(response.status).toBe(200);
        });
    });

    describe('P2-014-T22: createErrorResponse format', () => {
        it('should create response with null data and error object', async () => {
            const response = createErrorResponse(400, 'Validation failed');
            const body = await response.json();

            expect(body.data).toBeNull();
            expect(body.error).toBeDefined();
            expect(body.error.message).toBe('Validation failed');
        });

        it('should include validation errors in details', async () => {
            const response = createErrorResponse(400, 'Validation failed', {
                validation_errors: { title: ['Title is required'] }
            });
            const body = await response.json();

            expect(body.error.validation_errors).toEqual({ title: ['Title is required'] });
        });

        it('should use correct status code', async () => {
            const response = createErrorResponse(422, 'Unprocessable');

            expect(response.status).toBe(422);
        });
    });

    // =========================================================================
    // Error helper functions
    // =========================================================================

    describe('Error helpers', () => {
        it('badRequest should return 400', async () => {
            const response = badRequest('Invalid input');

            expect(response.status).toBe(400);
            const body = await response.json();
            expect(body.error.message).toBe('Invalid input');
        });

        it('unauthorized should return 401', async () => {
            const response = unauthorized();

            expect(response.status).toBe(401);
            const body = await response.json();
            expect(body.error.message).toBe('Authentication required');
        });

        it('forbidden should return 403', async () => {
            const response = forbidden();

            expect(response.status).toBe(403);
            const body = await response.json();
            expect(body.error.message).toBe('Permission denied');
        });

        it('notFound should return 404', async () => {
            const response = notFound('Document not found');

            expect(response.status).toBe(404);
            const body = await response.json();
            expect(body.error.message).toBe('Document not found');
        });

        it('serverError should return 500', async () => {
            const response = serverError();

            expect(response.status).toBe(500);
            const body = await response.json();
            expect(body.error.message).toBe('Internal server error');
        });
    });

    // =========================================================================
    // DocType name utilities
    // =========================================================================

    describe('DocType name utilities', () => {
        it('normalizeDocTypeName should convert URL format to proper name', () => {
            expect(normalizeDocTypeName('sales_invoice')).toBe('Sales Invoice');
            expect(normalizeDocTypeName('user')).toBe('User');
            expect(normalizeDocTypeName('purchase_order')).toBe('Purchase Order');
        });

        it('denormalizeDocTypeName should convert proper name to URL format', () => {
            expect(denormalizeDocTypeName('Sales Invoice')).toBe('sales_invoice');
            expect(denormalizeDocTypeName('User')).toBe('user');
            expect(denormalizeDocTypeName('Purchase Order')).toBe('purchase_order');
        });
    });
});
