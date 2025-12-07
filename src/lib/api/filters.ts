/**
 * API Filter Parsing Utilities
 *
 * Handles parsing of filter parameters from URL query strings.
 * Supports both object format {"field":"value"} and array format
 * [["field","=","value"]].
 *
 * @module api/filters
 */

import type { FilterCondition, QueryOptions } from '$lib/core/database/types';
import type { ParsedQueryOptions } from './types';

// =============================================================================
// Filter Parsing
// =============================================================================

/**
 * Parse filters from query parameter string
 *
 * Supports two formats:
 * - Object: `{"status":"Active","type":"Invoice"}`
 * - Array: `[["status","=","Active"],["amount",">",100]]`
 *
 * @param filtersParam - Raw filters string from URL
 * @returns Parsed filters object or array
 */
export function parseFilters(
    filtersParam: string | null
): { filters?: Record<string, unknown>; conditions?: FilterCondition[] } {
    if (!filtersParam) {
        return {};
    }

    try {
        const parsed = JSON.parse(filtersParam);

        // Array format: [["field", "op", "value"], ...]
        if (Array.isArray(parsed)) {
            // Validate each condition is a valid tuple
            const conditions: FilterCondition[] = [];
            for (const item of parsed) {
                if (Array.isArray(item) && item.length >= 2) {
                    // [field, operator, value] or [field, value] (implicit =)
                    if (item.length === 2) {
                        conditions.push([item[0], '=', item[1]]);
                    } else {
                        conditions.push([item[0], item[1], item[2]]);
                    }
                }
            }
            return { conditions };
        }

        // Object format: { field: value, ... }
        if (typeof parsed === 'object' && parsed !== null) {
            return { filters: parsed as Record<string, unknown> };
        }

        return {};
    } catch {
        // Invalid JSON, return empty
        return {};
    }
}

/**
 * Parse fields parameter from query string
 *
 * @param fieldsParam - Raw fields string from URL
 * @returns Array of field names or undefined
 */
export function parseFields(fieldsParam: string | null): string[] | undefined {
    if (!fieldsParam) {
        return undefined;
    }

    try {
        const parsed = JSON.parse(fieldsParam);
        if (Array.isArray(parsed)) {
            return parsed.filter((f): f is string => typeof f === 'string');
        }
        return undefined;
    } catch {
        // Single field as plain string
        return [fieldsParam];
    }
}

/**
 * Parse integer parameter with default value
 *
 * @param param - Raw parameter string
 * @param defaultValue - Default if not provided or invalid
 * @returns Parsed integer or default
 */
export function parseIntParam(param: string | null, defaultValue: number): number {
    if (!param) {
        return defaultValue;
    }

    const parsed = parseInt(param, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

// =============================================================================
// Query Options Parsing
// =============================================================================

/**
 * Parse all query options from URL search params
 *
 * Extracts the following parameters:
 * - filters: JSON object or array
 * - fields: JSON array of field names
 * - order_by: Sort field with optional direction
 * - limit_start: Pagination offset (default: 0)
 * - limit_page_length: Page size (default: 20)
 * - pluck: Single field to extract
 *
 * @param url - Request URL object
 * @returns Parsed query options ready for database queries
 */
export function parseQueryOptions(url: URL): ParsedQueryOptions {
    const searchParams = url.searchParams;

    // Parse filters
    const filtersParam = searchParams.get('filters');
    const { filters, conditions } = parseFilters(filtersParam);

    // Parse fields
    const fields = parseFields(searchParams.get('fields'));

    // Parse sorting
    const order_by = searchParams.get('order_by') || undefined;

    // Parse pagination
    const limit_start = parseIntParam(searchParams.get('limit_start'), 0);
    const limit_page_length = parseIntParam(searchParams.get('limit_page_length'), 20);

    // Parse pluck
    const pluck = searchParams.get('pluck') || undefined;

    const options: ParsedQueryOptions = {
        limit_start,
        limit_page_length
    };

    if (filters) {
        options.filters = filters;
    }

    if (conditions && conditions.length > 0) {
        options.and_filters = conditions;
    }

    if (fields) {
        options.fields = fields;
    }

    if (order_by) {
        options.order_by = order_by;
    }

    if (pluck) {
        options.pluck = pluck;
    }

    return options;
}

/**
 * Convert ParsedQueryOptions to database QueryOptions
 *
 * @param parsed - Parsed query options from URL
 * @returns QueryOptions for database operations
 */
export function toQueryOptions(parsed: ParsedQueryOptions): QueryOptions {
    const options: QueryOptions = {};

    if (parsed.filters) {
        options.filters = parsed.filters;
    }

    if (parsed.and_filters) {
        options.and_filters = parsed.and_filters;
    }

    if (parsed.fields) {
        options.fields = parsed.fields;
    }

    if (parsed.order_by) {
        options.order_by = parsed.order_by;
    }

    if (parsed.limit_start !== undefined) {
        options.limit_start = parsed.limit_start;
    }

    if (parsed.limit_page_length !== undefined) {
        options.limit_page_length = parsed.limit_page_length;
    }

    if (parsed.pluck) {
        options.pluck = parsed.pluck;
    }

    return options;
}
