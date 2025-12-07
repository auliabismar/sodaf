/**
 * Filter Parsing Unit Tests
 *
 * Tests for P2-014: SvelteKit API Routes Integration
 *
 * @module api/__tests__/filters.test
 */

import { describe, it, expect } from 'vitest';
import {
    parseFilters,
    parseFields,
    parseIntParam,
    parseQueryOptions,
    toQueryOptions
} from '../filters';

// =============================================================================
// P2-014-T2: GET with filters param (object format)
// =============================================================================

describe('P2-014: Filter Parsing', () => {
    describe('P2-014-T2: parseFilters with object format', () => {
        it('should parse object filters {"status":"Active"}', () => {
            const result = parseFilters('{"status":"Active"}');

            expect(result.filters).toBeDefined();
            expect(result.filters?.status).toBe('Active');
        });

        it('should parse multiple object filters', () => {
            const result = parseFilters('{"status":"Active","type":"Invoice"}');

            expect(result.filters).toBeDefined();
            expect(result.filters?.status).toBe('Active');
            expect(result.filters?.type).toBe('Invoice');
        });

        it('should handle numeric values in object filters', () => {
            const result = parseFilters('{"amount":100,"enabled":true}');

            expect(result.filters?.amount).toBe(100);
            expect(result.filters?.enabled).toBe(true);
        });
    });

    // =========================================================================
    // P2-014-T3: GET with array filters [["status","=","Active"]]
    // =========================================================================

    describe('P2-014-T3: parseFilters with array format', () => {
        it('should parse array filters [["status","=","Active"]]', () => {
            const result = parseFilters('[["status","=","Active"]]');

            expect(result.conditions).toBeDefined();
            expect(result.conditions?.length).toBe(1);
            expect(result.conditions?.[0]).toEqual(['status', '=', 'Active']);
        });

        it('should parse multiple array filter conditions', () => {
            const result = parseFilters('[["status","=","Active"],["amount",">",100]]');

            expect(result.conditions).toBeDefined();
            expect(result.conditions?.length).toBe(2);
            expect(result.conditions?.[0]).toEqual(['status', '=', 'Active']);
            expect(result.conditions?.[1]).toEqual(['amount', '>', 100]);
        });

        it('should handle two-element array as implicit equals', () => {
            const result = parseFilters('[["status","Active"]]');

            expect(result.conditions).toBeDefined();
            expect(result.conditions?.[0]).toEqual(['status', '=', 'Active']);
        });
    });

    // =========================================================================
    // Edge cases
    // =========================================================================

    describe('parseFilters edge cases', () => {
        it('should return empty object for null input', () => {
            const result = parseFilters(null);

            expect(result.filters).toBeUndefined();
            expect(result.conditions).toBeUndefined();
        });

        it('should return empty object for empty string', () => {
            const result = parseFilters('');

            expect(result.filters).toBeUndefined();
            expect(result.conditions).toBeUndefined();
        });

        it('should return empty object for invalid JSON', () => {
            const result = parseFilters('not valid json');

            expect(result.filters).toBeUndefined();
            expect(result.conditions).toBeUndefined();
        });
    });
});

// =============================================================================
// P2-014-T4: GET with fields param
// =============================================================================

describe('P2-014-T4: parseFields', () => {
    it('should parse array of fields', () => {
        const result = parseFields('["name","status","amount"]');

        expect(result).toEqual(['name', 'status', 'amount']);
    });

    it('should parse single field as string', () => {
        const result = parseFields('name');

        expect(result).toEqual(['name']);
    });

    it('should return undefined for null input', () => {
        const result = parseFields(null);

        expect(result).toBeUndefined();
    });

    it('should filter out non-string values', () => {
        const result = parseFields('["name",123,"status"]');

        expect(result).toEqual(['name', 'status']);
    });
});

// =============================================================================
// P2-014-T6: Pagination parameters
// =============================================================================

describe('P2-014-T6: parseIntParam for pagination', () => {
    it('should parse integer from string', () => {
        expect(parseIntParam('10', 0)).toBe(10);
        expect(parseIntParam('25', 20)).toBe(25);
    });

    it('should return default for null', () => {
        expect(parseIntParam(null, 0)).toBe(0);
        expect(parseIntParam(null, 20)).toBe(20);
    });

    it('should return default for invalid number', () => {
        expect(parseIntParam('abc', 0)).toBe(0);
        expect(parseIntParam('', 20)).toBe(20);
    });
});

// =============================================================================
// parseQueryOptions - complete URL parsing
// =============================================================================

describe('parseQueryOptions', () => {
    it('should parse all query parameters from URL', () => {
        const url = new URL('http://example.com/api/resource/Test?filters={"status":"Active"}&fields=["name","status"]&order_by=creation desc&limit_start=10&limit_page_length=50&pluck=name');

        const result = parseQueryOptions(url);

        expect(result.filters).toEqual({ status: 'Active' });
        expect(result.fields).toEqual(['name', 'status']);
        expect(result.order_by).toBe('creation desc');
        expect(result.limit_start).toBe(10);
        expect(result.limit_page_length).toBe(50);
        expect(result.pluck).toBe('name');
    });

    it('should use default pagination values', () => {
        const url = new URL('http://example.com/api/resource/Test');

        const result = parseQueryOptions(url);

        expect(result.limit_start).toBe(0);
        expect(result.limit_page_length).toBe(20);
    });

    it('should handle array filters', () => {
        const url = new URL('http://example.com/api/resource/Test?filters=[["status","=","Active"]]');

        const result = parseQueryOptions(url);

        expect(result.and_filters).toBeDefined();
        expect(result.and_filters?.[0]).toEqual(['status', '=', 'Active']);
    });
});

// =============================================================================
// toQueryOptions - convert to database options
// =============================================================================

describe('toQueryOptions', () => {
    it('should convert parsed options to database query options', () => {
        const parsed = {
            filters: { status: 'Active' },
            fields: ['name', 'status'],
            order_by: 'creation desc',
            limit_start: 10,
            limit_page_length: 50
        };

        const result = toQueryOptions(parsed);

        expect(result.filters).toEqual({ status: 'Active' });
        expect(result.fields).toEqual(['name', 'status']);
        expect(result.order_by).toBe('creation desc');
        expect(result.limit_start).toBe(10);
        expect(result.limit_page_length).toBe(50);
    });

    it('should handle empty options', () => {
        const result = toQueryOptions({});

        expect(result).toEqual({});
    });
});
