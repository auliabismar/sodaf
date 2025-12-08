/**
 * API Module Exports
 *
 * This file exports all public types and interfaces from the API module.
 *
 * @module meta/api
 */

// =============================================================================
// Type Exports
// =============================================================================

export type {
    // HTTP Types
    HTTPMethod,
    HTTPStatusCode,

    // Route Configuration
    RouteType,
    RouteConfig,
    RouteConfigWithOpenAPI,

    // Validation Types
    RequestValidationType,
    FieldValidationRule,
    ValidationSchema,

    // Permission Types
    RoutePermissions,
    RateLimitConfig,
    RouteMiddleware,

    // Request Context
    RequestUser,
    RequestContext,

    // Response Types
    APIResponse,
    PaginationInfo,
    ListResponse,
    ValidationError,
    ErrorResponse,

    // Handler Types
    RouteHandler,
    RouteHook,
    RouteHooks,

    // Query Types
    FilterOperator,
    FilterCondition,
    ListQueryParams,

    // OpenAPI Types
    OpenAPIOperation
} from './types';

// =============================================================================
// API Generator Exports
// =============================================================================

export { APIGenerator } from './api-generator';
export type { APIGeneratorOptions, GeneratedRoute } from './api-generator';

// =============================================================================
// Custom Field API Integration Exports
// =============================================================================

// The API Generator has been enhanced with custom field support
// Custom field API types are handled through the existing route generation system

