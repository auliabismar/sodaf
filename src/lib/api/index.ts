/**
 * API Module Exports
 *
 * Barrel exports for the API utilities module.
 *
 * @module api
 */

// =============================================================================
// Type Exports
// =============================================================================

export type {
    APISuccessResponse,
    APIErrorResponse,
    APIErrorDetails,
    APIResponse,
    ParsedFilters,
    ParsedQueryOptions,
    DocumentRequestBody,
    WhitelistedMethod,
    MethodRegistry
} from './types';

// =============================================================================
// Filter Utilities
// =============================================================================

export {
    parseFilters,
    parseFields,
    parseIntParam,
    parseQueryOptions,
    toQueryOptions
} from './filters';

// =============================================================================
// API Utilities
// =============================================================================

export {
    getDatabase,
    setDatabase,
    createSuccessResponse,
    createErrorResponse,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    serverError,
    checkPermission,
    requireAuth,
    normalizeDocTypeName,
    denormalizeDocTypeName,
    parseRequestBody
} from './utils';

export type { PermissionType } from './utils';

// =============================================================================
// Method Registry
// =============================================================================

export {
    registerMethod,
    getMethod,
    hasMethod,
    getAllMethodPaths
} from './method-registry';
