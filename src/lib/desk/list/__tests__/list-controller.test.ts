/**
 * P3-002: List View Controller Tests
 * 
 * Tests for ListController data loading, filtering, sorting, and pagination.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { ListController } from '../list-controller';
import type { ListViewConfig } from '../types';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('ListController', () => {
    let controller: ListController;
    const doctype = 'Test Doctype';
    const config: ListViewConfig = {
        doctype,
        columns: [],
        filters: [],
        default_sort: { field: 'creation', order: 'desc' },
        page_length: 10
    };

    beforeEach(() => {
        fetchMock.mockReset();
        controller = new ListController(doctype, config);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('P3-002-T1: should initialize with correct default state', () => {
        const state = controller.getState();
        expect(state.data).toEqual([]);
        expect(state.loading).toBe(false);
        expect(state.filters).toEqual({});
        expect(state.sort).toEqual(config.default_sort);
        expect(state.pagination).toEqual({
            page: 1,
            page_size: 10,
            total: 0,
            has_more: false
        });
    });

    it('P3-002-T2: should load data from API', async () => {
        const mockData = [{ name: 'doc1' }, { name: 'doc2' }];
        const mockResponse = { data: mockData, meta: { total: 2 } };

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        await controller.loadData();

        const state = controller.getState();
        expect(state.data).toEqual(mockData);
        expect(state.loading).toBe(false);
        expect(state.pagination.total).toBe(2);

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining(`/api/resource/${doctype}`),
            expect.any(Object)
        );
    });

    it('P3-002-T3: should pass filters to API', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [] })
        });

        await controller.setFilter('status', 'Active');

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('filters=%7B%22status%22%3A%22Active%22%7D'),
            expect.any(Object)
        );
    });

    it('P3-002-T4 & T5: should handle filters correctly', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ data: [] })
        });

        await controller.setFilter('status', 'Active');
        let state = controller.getState();
        expect(state.filters).toEqual({ status: 'Active' });

        await controller.setFilter('priority', 'High');
        state = controller.getState();
        expect(state.filters).toEqual({ status: 'Active', priority: 'High' });

        await controller.clearFilter('status');
        state = controller.getState();
        expect(state.filters).toEqual({ priority: 'High' });
    });

    it('P3-002-T6 & T7: should clear filters', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ data: [] })
        });

        await controller.setFilter('status', 'Active');
        await controller.setFilter('priority', 'High');

        await controller.clearAllFilters();
        const state = controller.getState();
        expect(state.filters).toEqual({});
    });

    it('P3-002-T8 & T9: should handle sorting', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ data: [] })
        });

        await controller.setSort('name', 'asc');
        let state = controller.getState();
        expect(state.sort).toEqual({ field: 'name', order: 'asc' });

        await controller.toggleSort('name');
        state = controller.getState();
        expect(state.sort).toEqual({ field: 'name', order: 'desc' });

        await controller.toggleSort('other_field');
        state = controller.getState();
        expect(state.sort).toEqual({ field: 'other_field', order: 'desc' });
    });

    it('P3-002-T10 - T15: should handle selection', () => {
        const mockData = [
            { name: '1' }, { name: '2' }, { name: '3' }
        ];
        // Inject data
        controller['store'].update(s => ({ ...s, data: mockData }));

        controller.selectRow('1');
        let state = controller.getState();
        expect(state.selection).toEqual(['1']);

        controller.toggleRowSelection('2');
        state = controller.getState();
        expect(state.selection).toEqual(['1', '2']);

        controller.toggleRowSelection('1');
        state = controller.getState();
        expect(state.selection).toEqual(['2']);

        controller.selectAll();
        state = controller.getState();
        expect(state.selection).toEqual(['1', '2', '3']);

        controller.deselectAll();
        state = controller.getState();
        expect(state.selection).toEqual([]);

        controller.selectRow('1');
        const selected = controller.getSelectedRows();
        expect(selected).toEqual([{ name: '1' }]);
    });

    it('P3-002-T16 - T18: should handle pagination', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ data: [] })
        });

        await controller.setPageSize(50);
        let state = controller.getState();
        expect(state.pagination.page_size).toBe(50);
        expect(state.pagination.page).toBe(1);

        await controller.goToPage(2);
        state = controller.getState();
        expect(state.pagination.page).toBe(2);

        controller['store'].update(s => ({
            ...s,
            pagination: { ...s.pagination, has_more: true, page: 1 }
        }));

        await controller.loadMore();

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('page=2'),
            expect.any(Object)
        );
    });

    it('P3-002-T20 & T21: should execute actions', async () => {
        const rowAction = vi.fn();
        const bulkAction = vi.fn();

        const actionConfig: ListViewConfig = {
            doctype: 'Test',
            columns: [],
            filters: [],
            row_actions: [{ label: 'Edit', action: rowAction }],
            bulk_actions: [{ label: 'Delete', action: bulkAction }]
        };

        const actionController = new ListController('Test', actionConfig);

        await actionController.executeRowAction('Edit', { name: '1' });
        expect(rowAction).toHaveBeenCalledWith({ name: '1' });

        actionController['store'].update(s => ({ ...s, data: [{ name: '1' }], selection: ['1'] }));
        await actionController.executeBulkAction('Delete');
    });

    // P3-002-T19: refresh() reloads current data
    it('P3-002-T19: refresh() reloads current data', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ data: [{ name: 'doc1' }], meta: { total: 1 } })
        });

        await controller.loadData();
        fetchMock.mockClear();

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [{ name: 'doc1-updated' }], meta: { total: 1 } })
        });

        await controller.refresh();
        const state = controller.getState();
        expect(state.data[0].name).toBe('doc1-updated');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // P3-002-T22: State is reactive (Svelte store)
    it('P3-002-T22: State is reactive (Svelte store)', async () => {
        const states: any[] = [];
        const unsubscribe = controller.subscribe((state) => {
            states.push({ ...state });
        });

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [{ name: 'doc1' }], meta: { total: 1 } })
        });

        await controller.loadData();
        unsubscribe();

        // Should have captured multiple state changes (initial, loading, loaded)
        expect(states.length).toBeGreaterThan(1);
        // Last state should have data
        expect(states[states.length - 1].data.length).toBe(1);
    });

    // P3-002-T23: search(query) filters by search fields
    it('P3-002-T23: search(query) filters by search fields', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [{ name: 'doc1' }], meta: { total: 1 } })
        });

        await controller.search('test query');

        // Search uses _search filter with like pattern
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('_search'),
            expect.any(Object)
        );

        // Verify state updated with search filter
        const state = controller.getState();
        expect(state.filters['_search']).toBeDefined();
    });

    // P3-002-T24: getState() returns current ListViewState
    it('P3-002-T24: getState() returns current ListViewState', () => {
        const state = controller.getState();

        // Verify all required ListViewState properties exist
        expect(state).toHaveProperty('data');
        expect(state).toHaveProperty('loading');
        expect(state).toHaveProperty('filters');
        expect(state).toHaveProperty('sort');
        expect(state).toHaveProperty('selection');
        expect(state).toHaveProperty('pagination');

        // Verify pagination structure
        expect(state.pagination).toHaveProperty('page');
        expect(state.pagination).toHaveProperty('page_size');
        expect(state.pagination).toHaveProperty('total');
        expect(state.pagination).toHaveProperty('has_more');
    });
});
