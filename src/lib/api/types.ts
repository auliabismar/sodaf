/**
 * API Types and Interfaces
 *
 * Type definitions for API request/response structures used by
 * SvelteKit API routes.
 *
 * @module api/types
 */

import type { FilterCondition } from '$lib/core/database/types';

// =============================================================================
// Response Types
// =============================================================================

/**
 * Standard API success response format
 */
export interface APISuccessResponse<T = unknown> {
    /** Response data */
    data: T;
    /** Optional success message */
    message?: string;
}

/**
 * API error details
 */
export interface APIErrorDetails {
    /** Error message */
    message: string;
    /** Validation errors by field */
    validation_errors?: Record<string, string[]>;
    /** Additional error context */
    details?: Record<string, unknown>;
}

/**
 * Standard API error response format
 */
export interface APIErrorResponse {
    /** Null data on error */
    data: null;
    /** Error information */
    error: APIErrorDetails;
}

/**
 * Union type for all API responses
 */
export type APIResponse<T = unknown> = APISuccessResponse<T> | APIErrorResponse;

// =============================================================================
// Filter Types
// =============================================================================

/**
 * Parsed filters from query parameters
 * Supports both object and array filter formats
 */
export interface ParsedFilters {
    /** Simple key-value filters */
    filters?: Record<string, unknown>;
    /** Array-based filter conditions */
    conditions?: FilterCondition[];
}

/**
 * Parsed query options from URL search params
 */
export interface ParsedQueryOptions {
    /** Parsed filter conditions */
    filters?: Record<string, unknown>;
    /** Array-based filter conditions */
    and_filters?: FilterCondition[];
    /** Fields to return */
    fields?: string[];
    /** Sort order */
    order_by?: string;
    /** Pagination offset */
    limit_start?: number;
    /** Page size */
    limit_page_length?: number;
    /** Single field to pluck */
    pluck?: string;
}

// =============================================================================
// Request Types
// =============================================================================

/**
 * Document create/update request body
 */
export interface DocumentRequestBody {
    /** Document data */
    doc?: Record<string, unknown>;
    /** Alternative: direct fields */
    [key: string]: unknown;
}

// =============================================================================
// Method Types
// =============================================================================

/**
 * Whitelisted method definition
 */
export interface WhitelistedMethod {
    /** Method function */
    handler: (params: Record<string, unknown>) => Promise<unknown>;
    /** Required permission level */
    permission?: 'guest' | 'user' | 'admin';
    /** Method description */
    description?: string;
}

/**
 * Method registry type
 */
export type MethodRegistry = Map<string, WhitelistedMethod>;
