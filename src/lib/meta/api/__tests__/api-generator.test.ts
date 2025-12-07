/**
 * API Generator Unit Tests
 *
 * Tests for P2-013: API Generator
 *
 * @module meta/api/__tests__/api-generator.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { APIGenerator } from '../api-generator';
import type { DocType } from '../../doctype/types';
import type { RouteConfig, ValidationSchema, RouteMiddleware } from '../types';

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Basic DocType fixture for testing
 */
const createBasicDocType = (): DocType => ({
    name: 'Test DocType',
    module: 'Test Module',
    fields: [
        {
            fieldname: 'title',
            label: 'Title',
            fieldtype: 'Data',
            required: true,
            length: 200
        },
        {
            fieldname: 'description',
            label: 'Description',
            fieldtype: 'Long Text',
            required: false
        },
        {
            fieldname: 'count',
            label: 'Count',
            fieldtype: 'Int',
            required: false,
            default: 0
        },
        {
            fieldname: 'amount',
            label: 'Amount',
            fieldtype: 'Float',
            required: false
        },
        {
            fieldname: 'status',
            label: 'Status',
            fieldtype: 'Select',
            options: 'Draft\nPending\nApproved\nRejected',
            required: true
        },
        {
            fieldname: 'due_date',
            label: 'Due Date',
            fieldtype: 'Date',
            required: false
        },
        {
            fieldname: 'is_active',
            label: 'Is Active',
            fieldtype: 'Check',
            default: true
        },
        {
            fieldname: 'section1',
            label: 'Section 1',
            fieldtype: 'Section Break'
        }
    ],
    permissions: [
        { role: 'System Manager', read: true, write: true, create: true, delete: true },
        { role: 'Guest', read: true }
    ]
});

/**
 * Submittable DocType fixture
 */
const createSubmittableDocType = (): DocType => ({
    ...createBasicDocType(),
    name: 'Submittable DocType',
    is_submittable: true,
    permissions: [
        { role: 'System Manager', read: true, write: true, create: true, delete: true, submit: true, cancel: true, amend: true },
        { role: 'Editor', read: true, write: true, create: true, submit: true }
    ]
});

/**
 * Single DocType fixture
 */
const createSingleDocType = (): DocType => ({
    ...createBasicDocType(),
    name: 'Settings DocType',
    issingle: true
});

/**
 * Virtual DocType fixture
 */
const createVirtualDocType = (): DocType => ({
    ...createBasicDocType(),
    name: 'Virtual DocType',
    is_virtual: true
});

// =============================================================================
// P2-013-T1: generateRoutes returns array of RouteConfig
// =============================================================================

describe('P2-013: API Generator', () => {
    let generator: APIGenerator;

    beforeEach(() => {
        generator = new APIGenerator();
    });

    describe('P2-013-T1: generateRoutes(doctype) returns array of RouteConfig', () => {
        it('should return an array', () => {
            const doctype = createBasicDocType();
            const routes = generator.generateRoutes(doctype);

            expect(Array.isArray(routes)).toBe(true);
        });

        it('should return RouteConfig objects with required properties', () => {
            const doctype = createBasicDocType();
            const routes = generator.generateRoutes(doctype);

            for (const route of routes) {
                expect(route).toHaveProperty('method');
                expect(route).toHaveProperty('path');
                expect(route).toHaveProperty('type');
                expect(route).toHaveProperty('doctype');
            }
        });
    });

    // =========================================================================
    // P2-013-T2: GET list route generated
    // =========================================================================

    describe('P2-013-T2: GET list route generated', () => {
        it('should generate GET /api/resource/{doctype} route', () => {
            const doctype = createBasicDocType();
            const routes = generator.generateRoutes(doctype);

            const listRoute = routes.find(
                (r: RouteConfig) => r.method === 'GET' && r.type === 'list'
            );

            expect(listRoute).toBeDefined();
            expect(listRoute?.path).toBe('/api/resource/test_doctype');
            expect(listRoute?.doctype).toBe('Test DocType');
        });
    });

    // =========================================================================
    // P2-013-T3: POST create route generated
    // =========================================================================

    describe('P2-013-T3: POST create route generated', () => {
        it('should generate POST /api/resource/{doctype} route', () => {
            const doctype = createBasicDocType();
            const routes = generator.generateRoutes(doctype);

            const createRoute = routes.find(
                (r: RouteConfig) => r.method === 'POST' && r.type === 'create'
            );

            expect(createRoute).toBeDefined();
            expect(createRoute?.path).toBe('/api/resource/test_doctype');
            expect(createRoute?.doctype).toBe('Test DocType');
        });
    });

    // =========================================================================
    // P2-013-T4: GET single route generated
    // =========================================================================

    describe('P2-013-T4: GET single route generated', () => {
        it('should generate GET /api/resource/{doctype}/{name} route', () => {
            const doctype = createBasicDocType();
            const routes = generator.generateRoutes(doctype);

            const readRoute = routes.find(
                (r: RouteConfig) => r.method === 'GET' && r.type === 'read'
            );

            expect(readRoute).toBeDefined();
            expect(readRoute?.path).toBe('/api/resource/test_doctype/{name}');
            expect(readRoute?.doctype).toBe('Test DocType');
        });
    });

    // =========================================================================
    // P2-013-T5: PUT update route generated
    // =========================================================================

    describe('P2-013-T5: PUT update route generated', () => {
        it('should generate PUT /api/resource/{doctype}/{name} route', () => {
            const doctype = createBasicDocType();
            const routes = generator.generateRoutes(doctype);

            const updateRoute = routes.find(
                (r: RouteConfig) => r.method === 'PUT' && r.type === 'update'
            );

            expect(updateRoute).toBeDefined();
            expect(updateRoute?.path).toBe('/api/resource/test_doctype/{name}');
            expect(updateRoute?.doctype).toBe('Test DocType');
        });
    });

    // =========================================================================
    // P2-013-T6: DELETE route generated
    // =========================================================================

    describe('P2-013-T6: DELETE route generated', () => {
        it('should generate DELETE /api/resource/{doctype}/{name} route', () => {
            const doctype = createBasicDocType();
            const routes = generator.generateRoutes(doctype);

            const deleteRoute = routes.find(
                (r: RouteConfig) => r.method === 'DELETE' && r.type === 'delete'
            );

            expect(deleteRoute).toBeDefined();
            expect(deleteRoute?.path).toBe('/api/resource/test_doctype/{name}');
            expect(deleteRoute?.doctype).toBe('Test DocType');
        });
    });

    // =========================================================================
    // P2-013-T7: Submit route for submittable
    // =========================================================================

    describe('P2-013-T7: Submit route for submittable', () => {
        it('should generate POST .../submit route for submittable DocType', () => {
            const doctype = createSubmittableDocType();
            const routes = generator.generateRoutes(doctype);

            const submitRoute = routes.find(
                (r: RouteConfig) => r.type === 'submit'
            );

            expect(submitRoute).toBeDefined();
            expect(submitRoute?.method).toBe('POST');
            expect(submitRoute?.path).toBe('/api/resource/submittable_doctype/{name}/submit');
        });

        it('should not generate submit route for non-submittable DocType', () => {
            const doctype = createBasicDocType();
            const routes = generator.generateRoutes(doctype);

            const submitRoute = routes.find(
                (r: RouteConfig) => r.type === 'submit'
            );

            expect(submitRoute).toBeUndefined();
        });
    });

    // =========================================================================
    // P2-013-T8: Cancel route for submittable
    // =========================================================================

    describe('P2-013-T8: Cancel route for submittable', () => {
        it('should generate POST .../cancel route for submittable DocType', () => {
            const doctype = createSubmittableDocType();
            const routes = generator.generateRoutes(doctype);

            const cancelRoute = routes.find(
                (r: RouteConfig) => r.type === 'cancel'
            );

            expect(cancelRoute).toBeDefined();
            expect(cancelRoute?.method).toBe('POST');
            expect(cancelRoute?.path).toBe('/api/resource/submittable_doctype/{name}/cancel');
        });
    });

    // =========================================================================
    // P2-013-T9: Amend route for submittable
    // =========================================================================

    describe('P2-013-T9: Amend route for submittable', () => {
        it('should generate POST .../amend route for submittable DocType', () => {
            const doctype = createSubmittableDocType();
            const routes = generator.generateRoutes(doctype);

            const amendRoute = routes.find(
                (r: RouteConfig) => r.type === 'amend'
            );

            expect(amendRoute).toBeDefined();
            expect(amendRoute?.method).toBe('POST');
            expect(amendRoute?.path).toBe('/api/resource/submittable_doctype/{name}/amend');
        });
    });

    // =========================================================================
    // P2-013-T10: generateValidators returns ValidationSchema
    // =========================================================================

    describe('P2-013-T10: generateValidators(doctype) returns ValidationSchema', () => {
        it('should return a ValidationSchema object', () => {
            const doctype = createBasicDocType();
            const schema = generator.generateValidators(doctype);

            expect(schema).toBeDefined();
            expect(schema).toHaveProperty('body');
            expect(Array.isArray(schema.body)).toBe(true);
        });

        it('should include field rules in body array', () => {
            const doctype = createBasicDocType();
            const schema = generator.generateValidators(doctype);

            expect(schema.body?.length).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // P2-013-T11: Required fields in validators
    // =========================================================================

    describe('P2-013-T11: Required fields in validators', () => {
        it('should mark required fields with required: true', () => {
            const doctype = createBasicDocType();
            const schema = generator.generateValidators(doctype);

            const titleRule = schema.body?.find(r => r.name === 'title');
            const descriptionRule = schema.body?.find(r => r.name === 'description');

            expect(titleRule?.required).toBe(true);
            expect(descriptionRule?.required).toBe(false);
        });
    });

    // =========================================================================
    // P2-013-T12: Type validation generated (Int, Float, Date)
    // =========================================================================

    describe('P2-013-T12: Type validation generated', () => {
        it('should map Int to integer type', () => {
            const doctype = createBasicDocType();
            const schema = generator.generateValidators(doctype);

            const countRule = schema.body?.find(r => r.name === 'count');
            expect(countRule?.type).toBe('integer');
        });

        it('should map Float to number type', () => {
            const doctype = createBasicDocType();
            const schema = generator.generateValidators(doctype);

            const amountRule = schema.body?.find(r => r.name === 'amount');
            expect(amountRule?.type).toBe('number');
        });

        it('should map Date to date type', () => {
            const doctype = createBasicDocType();
            const schema = generator.generateValidators(doctype);

            const dateRule = schema.body?.find(r => r.name === 'due_date');
            expect(dateRule?.type).toBe('date');
        });

        it('should map Check to boolean type', () => {
            const doctype = createBasicDocType();
            const schema = generator.generateValidators(doctype);

            const checkRule = schema.body?.find(r => r.name === 'is_active');
            expect(checkRule?.type).toBe('boolean');
        });
    });

    // =========================================================================
    // P2-013-T13: Enum validation for Select
    // =========================================================================

    describe('P2-013-T13: Enum validation for Select', () => {
        it('should generate enum array from Select options', () => {
            const doctype = createBasicDocType();
            const schema = generator.generateValidators(doctype);

            const statusRule = schema.body?.find(r => r.name === 'status');

            expect(statusRule?.enum).toBeDefined();
            expect(statusRule?.enum).toContain('Draft');
            expect(statusRule?.enum).toContain('Pending');
            expect(statusRule?.enum).toContain('Approved');
            expect(statusRule?.enum).toContain('Rejected');
        });
    });

    // =========================================================================
    // P2-013-T14: generateMiddleware returns array
    // =========================================================================

    describe('P2-013-T14: generateMiddleware(doctype) returns middleware array', () => {
        it('should return an array of RouteMiddleware', () => {
            const doctype = createBasicDocType();
            const middleware = generator.generateMiddleware(doctype);

            expect(Array.isArray(middleware)).toBe(true);
            expect(middleware.length).toBeGreaterThan(0);
        });

        it('should include middleware with name and config', () => {
            const doctype = createBasicDocType();
            const middleware = generator.generateMiddleware(doctype);

            for (const mw of middleware) {
                expect(mw).toHaveProperty('name');
                expect(mw).toHaveProperty('config');
            }
        });
    });

    // =========================================================================
    // P2-013-T15: Permission middleware
    // =========================================================================

    describe('P2-013-T15: Permission middleware checks DocType permissions', () => {
        it('should include permission_check middleware', () => {
            const doctype = createBasicDocType();
            const middleware = generator.generateMiddleware(doctype);

            const permMiddleware = middleware.find(m => m.name === 'permission_check');

            expect(permMiddleware).toBeDefined();
            expect(permMiddleware?.config?.doctype).toBe('Test DocType');
        });

        it('should include permission roles in config', () => {
            const doctype = createBasicDocType();
            const middleware = generator.generateMiddleware(doctype);

            const permMiddleware = middleware.find(m => m.name === 'permission_check');
            const permissions = permMiddleware?.config?.permissions as Record<string, string[]>;

            expect(permissions?.read).toContain('System Manager');
            expect(permissions?.read).toContain('Guest');
            expect(permissions?.write).toContain('System Manager');
        });
    });

    // =========================================================================
    // P2-013-T16: Single DocType routes (only GET and PUT)
    // =========================================================================

    describe('P2-013-T16: Single DocType routes', () => {
        it('should only generate GET and PUT routes for Single DocType', () => {
            const doctype = createSingleDocType();
            const routes = generator.generateRoutes(doctype);

            expect(routes.length).toBe(2);

            const methods = routes.map(r => r.method);
            expect(methods).toContain('GET');
            expect(methods).toContain('PUT');
            expect(methods).not.toContain('POST');
            expect(methods).not.toContain('DELETE');
        });

        it('should not include {name} in Single DocType paths', () => {
            const doctype = createSingleDocType();
            const routes = generator.generateRoutes(doctype);

            for (const route of routes) {
                expect(route.path).not.toContain('{name}');
            }
        });
    });

    // =========================================================================
    // P2-013-T17: Virtual DocType routes (custom handlers)
    // =========================================================================

    describe('P2-013-T17: Virtual DocType routes with custom handlers', () => {
        it('should generate routes with custom type for Virtual DocType', () => {
            const doctype = createVirtualDocType();
            const routes = generator.generateRoutes(doctype);

            for (const route of routes) {
                expect(route.type).toBe('custom');
            }
        });

        it('should have undefined handlers for Virtual DocType routes', () => {
            const doctype = createVirtualDocType();
            const routes = generator.generateRoutes(doctype);

            for (const route of routes) {
                expect(route.handler).toBeUndefined();
            }
        });
    });

    // =========================================================================
    // Additional Tests: Options and Edge Cases
    // =========================================================================

    describe('APIGenerator Options', () => {
        it('should use custom basePath when provided', () => {
            const customGenerator = new APIGenerator({ basePath: '/custom/api' });
            const doctype = createBasicDocType();
            const routes = customGenerator.generateRoutes(doctype);

            expect(routes[0].path).toContain('/custom/api');
        });

        it('should add rate_limit middleware when enableRateLimiting is true', () => {
            const rateLimitGenerator = new APIGenerator({ enableRateLimiting: true });
            const doctype = createBasicDocType();
            const middleware = rateLimitGenerator.generateMiddleware(doctype);

            const rateLimitMw = middleware.find(m => m.name === 'rate_limit');
            expect(rateLimitMw).toBeDefined();
        });
    });

    describe('Validation Edge Cases', () => {
        it('should exclude Section Break fields from validation', () => {
            const doctype = createBasicDocType();
            const schema = generator.generateValidators(doctype);

            const sectionRule = schema.body?.find(r => r.name === 'section1');
            expect(sectionRule).toBeUndefined();
        });

        it('should include max length for Data fields with length property', () => {
            const doctype = createBasicDocType();
            const schema = generator.generateValidators(doctype);

            const titleRule = schema.body?.find(r => r.name === 'title');
            expect(titleRule?.max).toBe(200);
        });

        it('should include default values in validation rules', () => {
            const doctype = createBasicDocType();
            const schema = generator.generateValidators(doctype);

            const countRule = schema.body?.find(r => r.name === 'count');
            expect(countRule?.default).toBe(0);
        });
    });

    describe('Route Configuration', () => {
        it('should include module and doctype in tags', () => {
            const doctype = createBasicDocType();
            const routes = generator.generateRoutes(doctype);

            const listRoute = routes.find(r => r.type === 'list');
            expect(listRoute?.tags).toContain('Test Module');
            expect(listRoute?.tags).toContain('Test DocType');
        });

        it('should set requires_auth to true for all routes', () => {
            const doctype = createBasicDocType();
            const routes = generator.generateRoutes(doctype);

            for (const route of routes) {
                expect(route.requires_auth).toBe(true);
            }
        });

        it('should include validation schema on create routes', () => {
            const doctype = createBasicDocType();
            const routes = generator.generateRoutes(doctype);

            const createRoute = routes.find(r => r.type === 'create');
            expect(createRoute?.validation).toBeDefined();
            expect(createRoute?.validation?.body).toBeDefined();
        });

        it('should set partial: true on update route validation', () => {
            const doctype = createBasicDocType();
            const routes = generator.generateRoutes(doctype);

            const updateRoute = routes.find(r => r.type === 'update');
            expect(updateRoute?.validation?.partial).toBe(true);
        });
    });

    describe('Permission Extraction', () => {
        it('should extract submit permissions for submittable routes', () => {
            const doctype = createSubmittableDocType();
            const routes = generator.generateRoutes(doctype);

            const submitRoute = routes.find(r => r.type === 'submit');
            expect(submitRoute?.permissions?.permission).toBe('submit');
            expect(submitRoute?.permissions?.roles).toContain('System Manager');
        });

        it('should extract cancel permissions for submittable routes', () => {
            const doctype = createSubmittableDocType();
            const routes = generator.generateRoutes(doctype);

            const cancelRoute = routes.find(r => r.type === 'cancel');
            expect(cancelRoute?.permissions?.permission).toBe('cancel');
            expect(cancelRoute?.permissions?.roles).toContain('System Manager');
        });

        it('should extract amend permissions for submittable routes', () => {
            const doctype = createSubmittableDocType();
            const routes = generator.generateRoutes(doctype);

            const amendRoute = routes.find(r => r.type === 'amend');
            expect(amendRoute?.permissions?.permission).toBe('amend');
            expect(amendRoute?.permissions?.roles).toContain('System Manager');
        });
    });
});
