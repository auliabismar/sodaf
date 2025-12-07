/**
 * API Route Types Tests
 *
 * Test suite for P2-012: API Route Types
 * Validates that all TypeScript interfaces compile correctly and have expected properties.
 *
 * @module meta/api/__tests__/types.test
 */

import { describe, it, expect } from 'vitest';
import type {
    HTTPMethod,
    HTTPStatusCode,
    RouteType,
    RouteConfig,
    RequestValidationType,
    FieldValidationRule,
    ValidationSchema,
    RoutePermissions,
    RateLimitConfig,
    RouteMiddleware,
    RequestUser,
    RequestContext,
    APIResponse,
    PaginationInfo,
    ListResponse,
    ValidationError,
    ErrorResponse,
    RouteHandler,
    RouteHook,
    RouteHooks,
    FilterOperator,
    FilterCondition,
    ListQueryParams,
    OpenAPIOperation,
    RouteConfigWithOpenAPI
} from '../types';

describe('P2-012: API Route Types', () => {
    describe('P2-012-T1: RouteConfig interface compiles', () => {
        it('should compile with method, path, validation, and permissions', () => {
            const routeConfig: RouteConfig = {
                method: 'GET',
                path: '/api/resource/Customer',
                type: 'list',
                doctype: 'Customer',
                description: 'List all customers',
                validation: {
                    query: [
                        { name: 'limit', type: 'integer', min: 1, max: 100 }
                    ]
                },
                permissions: {
                    permission: 'read',
                    roles: ['Sales User']
                },
                requires_auth: true,
                tags: ['Customer'],
                summary: 'List customers'
            };

            expect(routeConfig.method).toBe('GET');
            expect(routeConfig.path).toBe('/api/resource/Customer');
            expect(routeConfig.type).toBe('list');
            expect(routeConfig.doctype).toBe('Customer');
            expect(routeConfig.validation?.query).toHaveLength(1);
            expect(routeConfig.permissions?.permission).toBe('read');
            expect(routeConfig.requires_auth).toBe(true);
        });

        it('should support all route types', () => {
            const routeTypes: RouteType[] = [
                'list', 'create', 'read', 'update', 'delete',
                'submit', 'cancel', 'amend', 'method', 'custom'
            ];

            routeTypes.forEach(type => {
                const config: RouteConfig = {
                    method: 'GET',
                    path: '/test',
                    type
                };
                expect(config.type).toBe(type);
            });
        });

        it('should support middleware and rate limiting', () => {
            const routeConfig: RouteConfig = {
                method: 'POST',
                path: '/api/resource/Customer',
                type: 'create',
                middleware: [
                    { name: 'auth', order: 1 },
                    { name: 'validate', config: { strict: true }, order: 2 }
                ],
                rate_limit: {
                    max_requests: 100,
                    window_seconds: 60,
                    key: 'user',
                    skip_admin: true
                }
            };

            expect(routeConfig.middleware).toHaveLength(2);
            expect(routeConfig.rate_limit?.max_requests).toBe(100);
            expect(routeConfig.rate_limit?.window_seconds).toBe(60);
        });
    });

    describe('P2-012-T2: ValidationSchema interface compiles', () => {
        it('should compile with params, query, body validation rules', () => {
            const validation: ValidationSchema = {
                params: [
                    { name: 'doctype', type: 'string', required: true },
                    { name: 'name', type: 'string', required: true }
                ],
                query: [
                    { name: 'fields', type: 'array', items: { name: 'field', type: 'string' } },
                    { name: 'limit_start', type: 'integer', default: 0 },
                    { name: 'limit_page_length', type: 'integer', default: 20 }
                ],
                body: [
                    { name: 'customer_name', type: 'string', required: true },
                    { name: 'email', type: 'email', required: false }
                ],
                strip_unknown: true,
                partial: false
            };

            expect(validation.params).toHaveLength(2);
            expect(validation.query).toHaveLength(3);
            expect(validation.body).toHaveLength(2);
            expect(validation.strip_unknown).toBe(true);
            expect(validation.partial).toBe(false);
        });

        it('should support custom validation function', () => {
            const validation: ValidationSchema = {
                body: [
                    { name: 'password', type: 'string', required: true }
                ],
                custom: 'validatePasswordStrength'
            };

            expect(validation.custom).toBe('validatePasswordStrength');
        });
    });

    describe('P2-012-T3: FieldValidationRule supports pattern, min, max', () => {
        it('should support pattern for string validation', () => {
            const rule: FieldValidationRule = {
                name: 'phone',
                type: 'string',
                pattern: '^[0-9]{10}$',
                message: 'Phone must be 10 digits'
            };

            expect(rule.pattern).toBe('^[0-9]{10}$');
            expect(rule.message).toBe('Phone must be 10 digits');
        });

        it('should support min/max for numeric validation', () => {
            const rule: FieldValidationRule = {
                name: 'age',
                type: 'integer',
                min: 0,
                max: 150,
                required: true
            };

            expect(rule.min).toBe(0);
            expect(rule.max).toBe(150);
        });

        it('should support min/max for string length', () => {
            const rule: FieldValidationRule = {
                name: 'username',
                type: 'string',
                min: 3,
                max: 50
            };

            expect(rule.min).toBe(3);
            expect(rule.max).toBe(50);
        });

        it('should support enum values', () => {
            const rule: FieldValidationRule = {
                name: 'status',
                type: 'string',
                enum: ['Draft', 'Active', 'Cancelled']
            };

            expect(rule.enum).toEqual(['Draft', 'Active', 'Cancelled']);
        });

        it('should support nested object schemas', () => {
            const rule: FieldValidationRule = {
                name: 'address',
                type: 'object',
                schema: [
                    { name: 'street', type: 'string', required: true },
                    { name: 'city', type: 'string', required: true },
                    { name: 'zip', type: 'string', pattern: '^[0-9]{5}$' }
                ]
            };

            expect(rule.schema).toHaveLength(3);
            expect(rule.schema?.[0].name).toBe('street');
        });

        it('should support array item schemas', () => {
            const rule: FieldValidationRule = {
                name: 'tags',
                type: 'array',
                items: {
                    name: 'tag',
                    type: 'string',
                    min: 1,
                    max: 50
                }
            };

            expect(rule.items?.type).toBe('string');
            expect(rule.items?.min).toBe(1);
        });

        it('should support all validation types', () => {
            const types: RequestValidationType[] = [
                'string', 'number', 'integer', 'boolean',
                'array', 'object', 'date', 'email', 'url', 'uuid'
            ];

            types.forEach(type => {
                const rule: FieldValidationRule = { name: 'test', type };
                expect(rule.type).toBe(type);
            });
        });
    });

    describe('P2-012-T4: APIResponse interface compiles', () => {
        it('should compile with data, message, exc', () => {
            const response: APIResponse<{ name: string }> = {
                data: { name: 'Customer-001' },
                message: 'Document saved successfully'
            };

            expect(response.data.name).toBe('Customer-001');
            expect(response.message).toBe('Document saved successfully');
        });

        it('should support exception fields', () => {
            const response: APIResponse = {
                data: null,
                message: 'An error occurred',
                exc: 'ValidationError',
                exc_type: 'frappe.exceptions.ValidationError',
                _status_code: 400
            };

            expect(response.exc).toBe('ValidationError');
            expect(response.exc_type).toBe('frappe.exceptions.ValidationError');
            expect(response._status_code).toBe(400);
        });

        it('should support generic types', () => {
            interface Customer {
                name: string;
                email: string;
                customer_type: 'Individual' | 'Company';
            }

            const response: APIResponse<Customer> = {
                data: {
                    name: 'CUST-001',
                    email: 'test@example.com',
                    customer_type: 'Individual'
                }
            };

            expect(response.data.customer_type).toBe('Individual');
        });
    });

    describe('P2-012-T5: ListResponse interface compiles', () => {
        it('should compile with data array and pagination info', () => {
            const response: ListResponse<{ name: string }> = {
                data: [
                    { name: 'Customer-001' },
                    { name: 'Customer-002' }
                ],
                message: 'Found 2 records',
                pagination: {
                    start: 0,
                    limit: 20,
                    total_count: 100,
                    has_more: true
                },
                filters: { customer_type: 'Individual' },
                order_by: 'creation desc'
            };

            expect(response.data).toHaveLength(2);
            expect(response.pagination?.start).toBe(0);
            expect(response.pagination?.limit).toBe(20);
            expect(response.pagination?.total_count).toBe(100);
            expect(response.pagination?.has_more).toBe(true);
            expect(response.order_by).toBe('creation desc');
        });

        it('should work with empty results', () => {
            const response: ListResponse = {
                data: [],
                pagination: {
                    start: 0,
                    limit: 20,
                    total_count: 0,
                    has_more: false
                }
            };

            expect(response.data).toHaveLength(0);
            expect(response.pagination?.has_more).toBe(false);
        });
    });

    describe('P2-012-T6: ErrorResponse interface compiles', () => {
        it('should compile with error, message, stack', () => {
            const response: ErrorResponse = {
                error: true,
                message: 'Document not found',
                exc_type: 'DoesNotExistError',
                _status_code: 404,
                error_code: 'NOT_FOUND'
            };

            expect(response.error).toBe(true);
            expect(response.message).toBe('Document not found');
            expect(response.exc_type).toBe('DoesNotExistError');
            expect(response._status_code).toBe(404);
            expect(response.error_code).toBe('NOT_FOUND');
        });

        it('should support validation errors', () => {
            const response: ErrorResponse = {
                error: true,
                message: 'Validation failed',
                _status_code: 400,
                validation_errors: [
                    { field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' },
                    { field: 'customer_name', message: 'This field is required', code: 'REQUIRED' }
                ]
            };

            expect(response.validation_errors).toHaveLength(2);
            expect(response.validation_errors?.[0].field).toBe('email');
            expect(response.validation_errors?.[1].code).toBe('REQUIRED');
        });

        it('should support stack trace in debug mode', () => {
            const response: ErrorResponse = {
                error: true,
                message: 'Internal server error',
                _status_code: 500,
                stack: 'Error: Something went wrong\n    at function1 (file.ts:10)\n    at function2 (file.ts:20)'
            };

            expect(response.stack).toContain('Error: Something went wrong');
        });
    });

    describe('P2-012-T7: HTTP method types defined', () => {
        it('should support GET method', () => {
            const method: HTTPMethod = 'GET';
            expect(method).toBe('GET');
        });

        it('should support POST method', () => {
            const method: HTTPMethod = 'POST';
            expect(method).toBe('POST');
        });

        it('should support PUT method', () => {
            const method: HTTPMethod = 'PUT';
            expect(method).toBe('PUT');
        });

        it('should support DELETE method', () => {
            const method: HTTPMethod = 'DELETE';
            expect(method).toBe('DELETE');
        });

        it('should support PATCH method', () => {
            const method: HTTPMethod = 'PATCH';
            expect(method).toBe('PATCH');
        });

        it('should support all HTTP status codes', () => {
            const statusCodes: HTTPStatusCode[] = [
                200, 201, 204, 400, 401, 403, 404, 409, 422, 500
            ];

            statusCodes.forEach(code => {
                const status: HTTPStatusCode = code;
                expect(status).toBe(code);
            });
        });
    });

    describe('Additional Type Tests', () => {
        describe('RoutePermissions', () => {
            it('should compile with all permission options', () => {
                const permissions: RoutePermissions = {
                    permission: 'write',
                    roles: ['System Manager', 'Sales Manager'],
                    permlevel: 0,
                    if_owner: true,
                    custom_check: 'check_territory_permission',
                    public: false
                };

                expect(permissions.permission).toBe('write');
                expect(permissions.roles).toContain('Sales Manager');
                expect(permissions.if_owner).toBe(true);
            });
        });

        describe('RequestContext', () => {
            it('should compile with all context properties', () => {
                const context: RequestContext = {
                    user: {
                        name: 'test@example.com',
                        email: 'test@example.com',
                        full_name: 'Test User',
                        roles: ['Sales User', 'Customer User'],
                        is_admin: false,
                        language: 'en',
                        time_zone: 'Asia/Jakarta'
                    },
                    doctype: 'Customer',
                    doc_name: 'CUST-001',
                    params: { doctype: 'Customer', name: 'CUST-001' },
                    query: { fields: ['name', 'email'] },
                    body: {},
                    headers: { 'content-type': 'application/json' },
                    method: 'GET',
                    url: '/api/resource/Customer/CUST-001',
                    ip: '127.0.0.1',
                    timestamp: new Date(),
                    request_id: 'req-123'
                };

                expect(context.user?.name).toBe('test@example.com');
                expect(context.doctype).toBe('Customer');
                expect(context.method).toBe('GET');
            });
        });

        describe('RouteHandler and RouteHooks', () => {
            it('should define handler signature correctly', () => {
                const handler: RouteHandler = async (context) => {
                    return {
                        data: { name: context.doc_name },
                        message: 'Success'
                    };
                };

                expect(typeof handler).toBe('function');
            });

            it('should define hook signature correctly', () => {
                const hook: RouteHook = async (context) => {
                    // Modify context or perform side effects
                    return context;
                };

                expect(typeof hook).toBe('function');
            });

            it('should compile RouteHooks interface', () => {
                const hooks: RouteHooks = {
                    before: [
                        async (ctx) => {
                            ctx.body.modified_at = new Date().toISOString();
                            return ctx;
                        }
                    ],
                    after: [
                        async () => { /* log response */ }
                    ],
                    on_error: async (error, _ctx) => ({
                        error: true,
                        message: error.message,
                        _status_code: 500
                    })
                };

                expect(hooks.before).toHaveLength(1);
                expect(hooks.after).toHaveLength(1);
                expect(hooks.on_error).toBeDefined();
            });
        });

        describe('FilterCondition and ListQueryParams', () => {
            it('should support all filter operators', () => {
                const operators: FilterOperator[] = [
                    '=', '!=', '>', '>=', '<', '<=',
                    'like', 'not like', 'in', 'not in',
                    'is', 'is not', 'between'
                ];

                operators.forEach(op => {
                    const filter: FilterCondition = {
                        field: 'status',
                        operator: op,
                        value: 'Active'
                    };
                    expect(filter.operator).toBe(op);
                });
            });

            it('should compile ListQueryParams', () => {
                const params: ListQueryParams = {
                    fields: ['name', 'email', 'customer_type'],
                    filters: [
                        { field: 'customer_type', operator: '=', value: 'Individual' }
                    ],
                    order_by: 'creation desc',
                    limit_start: 0,
                    limit_page_length: 20,
                    with_children: true,
                    distinct: true
                };

                expect(params.fields).toContain('email');
                expect(params.limit_page_length).toBe(20);
            });
        });

        describe('OpenAPI Types', () => {
            it('should compile OpenAPIOperation', () => {
                const operation: OpenAPIOperation = {
                    operationId: 'listCustomers',
                    summary: 'List all customers',
                    description: 'Returns a paginated list of customers',
                    tags: ['Customer', 'CRM'],
                    deprecated: false,
                    security: [{ bearerAuth: [] }]
                };

                expect(operation.operationId).toBe('listCustomers');
                expect(operation.tags).toContain('CRM');
            });

            it('should compile RouteConfigWithOpenAPI', () => {
                const config: RouteConfigWithOpenAPI = {
                    method: 'GET',
                    path: '/api/resource/Customer',
                    type: 'list',
                    openapi: {
                        operationId: 'listCustomers',
                        summary: 'List customers'
                    }
                };

                expect(config.openapi?.operationId).toBe('listCustomers');
            });
        });
    });
});
