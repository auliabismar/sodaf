/**
 * API Route Types and Interfaces
 *
 * This file defines comprehensive TypeScript interfaces for API route generation,
 * validation schemas, request/response types, and related structures for the
 * SODAF meta API system.
 *
 * @module meta/api/types
 */

// =============================================================================
// HTTP Method and Status Types
// =============================================================================

/**
 * Supported HTTP methods for API routes
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * HTTP status codes commonly used in API responses
 */
export type HTTPStatusCode =
    | 200 // OK
    | 201 // Created
    | 204 // No Content
    | 400 // Bad Request
    | 401 // Unauthorized
    | 403 // Forbidden
    | 404 // Not Found
    | 409 // Conflict
    | 422 // Unprocessable Entity
    | 500; // Internal Server Error

// =============================================================================
// Route Configuration Types
// =============================================================================

/**
 * Route type categorization for DocType-based APIs
 */
export type RouteType =
    | 'list' // GET /api/resource/{doctype}
    | 'create' // POST /api/resource/{doctype}
    | 'read' // GET /api/resource/{doctype}/{name}
    | 'update' // PUT /api/resource/{doctype}/{name}
    | 'delete' // DELETE /api/resource/{doctype}/{name}
    | 'submit' // POST /api/resource/{doctype}/{name}/submit
    | 'cancel' // POST /api/resource/{doctype}/{name}/cancel
    | 'amend' // POST /api/resource/{doctype}/{name}/amend
    | 'method' // POST /api/method/{path}
    | 'custom'; // Custom route handlers

/**
 * RouteConfig interface representing a complete API route definition
 */
export interface RouteConfig {
    /** HTTP method for this route */
    method: HTTPMethod;

    /** Route path pattern (e.g., '/api/resource/{doctype}') */
    path: string;

    /** Route type for categorization */
    type: RouteType;

    /** Source DocType name (if DocType-based) */
    doctype?: string;

    /** Route description for documentation */
    description?: string;

    /** Validation schema for request data */
    validation?: ValidationSchema;

    /** Required permissions to access this route */
    permissions?: RoutePermissions;

    /** Middleware to apply to this route */
    middleware?: RouteMiddleware[];

    /** Rate limiting configuration */
    rate_limit?: RateLimitConfig;

    /** Route handler reference */
    handler?: RouteHandler;

    /** Whether route requires authentication */
    requires_auth?: boolean;

    /** Route tags for OpenAPI grouping */
    tags?: string[];

    /** Route summary for OpenAPI */
    summary?: string;

    /** Deprecated flag */
    deprecated?: boolean;
}

// =============================================================================
// Validation Types
// =============================================================================

/**
 * Validation types for request data
 */
export type RequestValidationType =
    | 'string'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'array'
    | 'object'
    | 'date'
    | 'email'
    | 'url'
    | 'uuid';

/**
 * Individual field validation rule
 */
export interface FieldValidationRule {
    /** Field name */
    name: string;

    /** Expected data type */
    type: RequestValidationType;

    /** Whether field is required */
    required?: boolean;

    /** Default value if not provided */
    default?: unknown;

    /** Regex pattern for string validation */
    pattern?: string;

    /** Minimum value (for numbers) or length (for strings/arrays) */
    min?: number;

    /** Maximum value (for numbers) or length (for strings/arrays) */
    max?: number;

    /** Allowed values (for enum-like validation) */
    enum?: unknown[];

    /** Nested schema for object fields */
    schema?: FieldValidationRule[];

    /** Array item schema */
    items?: FieldValidationRule;

    /** Transform function name to apply */
    transform?: string;

    /** Custom validation function name */
    validate?: string;

    /** Error message override */
    message?: string;

    /** Field description for documentation */
    description?: string;
}

/**
 * ValidationSchema interface for complete request validation
 */
export interface ValidationSchema {
    /** Path parameter validations */
    params?: FieldValidationRule[];

    /** Query parameter validations */
    query?: FieldValidationRule[];

    /** Request body validations */
    body?: FieldValidationRule[];

    /** Custom validation function name */
    custom?: string;

    /** Whether to strip unknown fields */
    strip_unknown?: boolean;

    /** Whether to allow partial updates (for PATCH) */
    partial?: boolean;
}

// =============================================================================
// Permission and Security Types
// =============================================================================

/**
 * Route permissions configuration
 */
export interface RoutePermissions {
    /** Required DocType permission (read, write, create, etc.) */
    permission?: 'read' | 'write' | 'create' | 'delete' | 'submit' | 'cancel' | 'amend';

    /** Required roles (any of these roles can access) */
    roles?: string[];

    /** Required permission level (0-9) */
    permlevel?: number;

    /** Whether to check if_owner condition */
    if_owner?: boolean;

    /** Custom permission check function name */
    custom_check?: string;

    /** Whether route is publicly accessible */
    public?: boolean;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
    /** Maximum requests per window */
    max_requests: number;

    /** Time window in seconds */
    window_seconds: number;

    /** Key to use for rate limiting (e.g., 'ip', 'user', 'api_key') */
    key?: string;

    /** Whether to skip rate limiting for admins */
    skip_admin?: boolean;
}

/**
 * Route middleware definition
 */
export interface RouteMiddleware {
    /** Middleware name */
    name: string;

    /** Middleware configuration */
    config?: Record<string, unknown>;

    /** Order of execution */
    order?: number;
}

// =============================================================================
// Request Context Types
// =============================================================================

/**
 * User information in request context
 */
export interface RequestUser {
    /** User ID/name */
    name: string;

    /** User email */
    email?: string;

    /** User full name */
    full_name?: string;

    /** User roles */
    roles: string[];

    /** Whether user is admin */
    is_admin?: boolean;

    /** Whether user is system user */
    is_system_user?: boolean;

    /** User language preference */
    language?: string;

    /** User time zone */
    time_zone?: string;
}

/**
 * RequestContext interface for handler functions
 */
export interface RequestContext {
    /** Current authenticated user */
    user?: RequestUser;

    /** Resolved DocType name (for resource routes) */
    doctype?: string;

    /** Document name (for single document routes) */
    doc_name?: string;

    /** Parsed path parameters */
    params: Record<string, string>;

    /** Parsed query parameters */
    query: Record<string, unknown>;

    /** Parsed and validated request body */
    body: Record<string, unknown>;

    /** Request headers */
    headers: Record<string, string>;

    /** Request method */
    method: HTTPMethod;

    /** Full request URL */
    url: string;

    /** Client IP address */
    ip?: string;

    /** Request timestamp */
    timestamp: Date;

    /** Request ID for tracing */
    request_id?: string;

    /** Session data */
    session?: Record<string, unknown>;

    /** User permissions for the DocType */
    permissions?: RoutePermissions;
}

// =============================================================================
// Response Types
// =============================================================================

/**
 * Generic API response wrapper
 */
export interface APIResponse<T = unknown> {
    /** Response data */
    data: T;

    /** Success/info message */
    message?: string;

    /** Exception type (if error) */
    exc?: string;

    /** Exception traceback (if error, debug mode only) */
    exc_type?: string;

    /** HTTP status code */
    _status_code?: HTTPStatusCode;
}

/**
 * Pagination information for list responses
 */
export interface PaginationInfo {
    /** Starting offset */
    start: number;

    /** Page size limit */
    limit: number;

    /** Total count of records */
    total_count?: number;

    /** Whether there are more records */
    has_more?: boolean;
}

/**
 * List response with pagination
 */
export interface ListResponse<T = unknown> {
    /** Array of records */
    data: T[];

    /** Success message */
    message?: string;

    /** Pagination info */
    pagination?: PaginationInfo;

    /** Applied filters */
    filters?: Record<string, unknown>;

    /** Sort order applied */
    order_by?: string;
}

/**
 * Individual validation error
 */
export interface ValidationError {
    /** Field name */
    field: string;

    /** Error message */
    message: string;

    /** Error code */
    code?: string;

    /** Provided value (for debugging) */
    value?: unknown;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
    /** Error flag */
    error: boolean;

    /** Error message */
    message: string;

    /** Exception type */
    exc_type?: string;

    /** Exception traceback (debug mode) */
    stack?: string;

    /** HTTP status code */
    _status_code: HTTPStatusCode;

    /** Validation errors (for 400/422) */
    validation_errors?: ValidationError[];

    /** Error code for client handling */
    error_code?: string;
}

// =============================================================================
// Route Handler Types
// =============================================================================

/**
 * Route handler function signature
 */
export type RouteHandler = (
    context: RequestContext
) => Promise<APIResponse | ListResponse | ErrorResponse>;

/**
 * Route hook function signature (before/after handlers)
 */
export type RouteHook = (context: RequestContext) => Promise<void | RequestContext>;

/**
 * Route hooks configuration
 */
export interface RouteHooks {
    /** Before route handler */
    before?: RouteHook[];

    /** After route handler (before response) */
    after?: RouteHook[];

    /** On error */
    on_error?: (error: Error, context: RequestContext) => Promise<ErrorResponse>;
}

// =============================================================================
// Query Parameter Types
// =============================================================================

/**
 * Filter operator types
 */
export type FilterOperator =
    | '='
    | '!='
    | '>'
    | '>='
    | '<'
    | '<='
    | 'like'
    | 'not like'
    | 'in'
    | 'not in'
    | 'is'
    | 'is not'
    | 'between';

/**
 * Single filter condition
 */
export interface FilterCondition {
    /** Field name */
    field: string;

    /** Operator */
    operator: FilterOperator;

    /** Value(s) to compare */
    value: unknown;
}

/**
 * Standard query parameters for list endpoints
 */
export interface ListQueryParams {
    /** Fields to return */
    fields?: string[];

    /** Filter conditions */
    filters?: FilterCondition[] | Record<string, unknown>;

    /** Sort order */
    order_by?: string;

    /** Starting offset */
    limit_start?: number;

    /** Page size */
    limit_page_length?: number;

    /** Single field to pluck */
    pluck?: string;

    /** Whether to include child tables */
    with_children?: boolean;

    /** Group by field */
    group_by?: string;

    /** Whether to get distinct records */
    distinct?: boolean;

    /** Debug mode */
    debug?: boolean;
}

// =============================================================================
// OpenAPI Integration Types
// =============================================================================

/**
 * OpenAPI operation info derived from RouteConfig
 */
export interface OpenAPIOperation {
    /** Operation ID */
    operationId: string;

    /** Summary */
    summary?: string;

    /** Description */
    description?: string;

    /** Tags */
    tags?: string[];

    /** Deprecated flag */
    deprecated?: boolean;

    /** Security requirements */
    security?: Record<string, string[]>[];
}

/**
 * Extended RouteConfig with OpenAPI metadata
 */
export interface RouteConfigWithOpenAPI extends RouteConfig {
    /** OpenAPI operation info */
    openapi?: OpenAPIOperation;
}
