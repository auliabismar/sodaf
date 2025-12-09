import { writable, get, type Writable, type Unsubscriber } from 'svelte/store';
import type { ListViewConfig, ListViewState, FilterConfig, SortConfig, PaginationState } from './types';
import { parseFilters } from '../../api/filters';

/**
 * Controller for the List View
 * Manages state, data loading, filtering, sorting, and pagination
 */
export class ListController {
    private store: Writable<ListViewState>;
    public readonly doctype: string;
    private config?: ListViewConfig;
    private abortController?: AbortController;

    constructor(doctype: string, config?: ListViewConfig) {
        this.doctype = doctype;
        this.config = config;

        const initialState: ListViewState = {
            data: [],
            loading: false,
            filters: {},
            sort: config?.default_sort || { field: 'modified', order: 'desc' },
            selection: [],
            pagination: {
                page: 1,
                page_size: config?.page_length || 20,
                total: 0,
                has_more: false
            }
        };

        this.store = writable(initialState);
    }

    /**
     * Subscribe to store updates
     */
    subscribe(run: (value: ListViewState) => void, invalidate?: (value?: ListViewState) => void): Unsubscriber {
        return this.store.subscribe(run, invalidate);
    }

    /**
     * Get current state
     */
    getState(): ListViewState {
        return get(this.store);
    }

    /**
     * Load data from the API
     */
    async loadData(): Promise<void> {
        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        this.updateState({ loading: true });

        // Get current state for params
        const state = this.getState();
        const { page, page_size } = state.pagination;

        // Build query parameters
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', page_size.toString());

        if (state.sort) {
            params.set('order_by', state.sort.field);
            params.set('order', state.sort.order);
        }

        if (Object.keys(state.filters).length > 0) {
            params.set('filters', JSON.stringify(state.filters));
        }

        try {
            const response = await fetch(`/api/resource/${this.doctype}?${params.toString()}`, {
                signal: this.abortController.signal
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

            const result = await response.json();
            const data = result.data || [];
            const meta = result.meta || {};

            this.store.update(current => ({
                ...current,
                data,
                loading: false,
                error: null,
                pagination: {
                    ...current.pagination,
                    total: meta.total || 0,
                    has_more: data.length === page_size
                }
            }));

        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return; // Ignore aborts
            }
            const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
            console.error('ListController loadData error:', error);
            this.updateState({ loading: false, error: errorMessage });
        }
    }

    /**
     * Refresh data keeping current state
     */
    async refresh(): Promise<void> {
        return this.loadData();
    }

    /**
     * Set a filter value
     */
    async setFilter(field: string, value: any): Promise<void> {
        this.store.update(state => ({
            ...state,
            filters: { ...state.filters, [field]: value },
            pagination: { ...state.pagination, page: 1 }
        }));

        return this.loadData();
    }

    /**
     * Clear a specific filter
     */
    async clearFilter(field: string): Promise<void> {
        this.store.update(state => {
            const newFilters = { ...state.filters };
            delete newFilters[field];
            return {
                ...state,
                filters: newFilters,
                pagination: { ...state.pagination, page: 1 }
            };
        });

        return this.loadData();
    }

    /**
     * Clear all filters
     */
    async clearAllFilters(): Promise<void> {
        this.store.update(state => ({
            ...state,
            filters: {},
            pagination: { ...state.pagination, page: 1 }
        }));
        return this.loadData();
    }

    /**
     * Set sort order
     */
    async setSort(field: string, order: 'asc' | 'desc'): Promise<void> {
        this.store.update(state => ({
            ...state,
            sort: { field, order }
        }));
        return this.loadData();
    }

    /**
     * Toggle sort order for a field
     */
    async toggleSort(field: string): Promise<void> {
        this.store.update(state => {
            let newOrder: 'asc' | 'desc' = 'desc';
            if (state.sort?.field === field) {
                newOrder = state.sort.order === 'asc' ? 'desc' : 'asc';
            }
            return {
                ...state,
                sort: { field, order: newOrder }
            };
        });
        return this.loadData();
    }

    /**
     * Select a row
     */
    selectRow(name: string): void {
        this.store.update(state => {
            if (!state.selection.includes(name)) {
                return { ...state, selection: [...state.selection, name] };
            }
            return state;
        });
    }

    /**
     * Deselect a row
     */
    deselectRow(name: string): void {
        this.store.update(state => ({
            ...state,
            selection: state.selection.filter(id => id !== name)
        }));
    }

    /**
     * Toggle row selection
     */
    toggleRowSelection(name: string): void {
        this.store.update(state => {
            if (state.selection.includes(name)) {
                return { ...state, selection: state.selection.filter(id => id !== name) };
            } else {
                return { ...state, selection: [...state.selection, name] };
            }
        });
    }

    /**
     * Select all visible rows
     */
    selectAll(): void {
        this.store.update(state => {
            const allIds = state.data.map((row: any) => row.name);
            return { ...state, selection: allIds };
        });
    }

    /**
     * Deselect all rows
     */
    deselectAll(): void {
        this.store.update(state => ({
            ...state,
            selection: []
        }));
    }

    /**
     * Get selected rows data
     */
    getSelectedRows(): any[] {
        const state = this.getState();
        return state.data.filter((row: any) => state.selection.includes(row.name));
    }

    /**
     * Load next page logic
     */
    async loadMore(): Promise<void> {
        const state = this.getState();
        if (state.pagination.has_more) {
            const nextPage = state.pagination.page + 1;

            this.store.update(s => ({
                ...s,
                pagination: { ...s.pagination, page: nextPage },
                loading: true
            }));

            await this._fetchAndAppend();
        }
    }

    async goToPage(page: number): Promise<void> {
        if (page > 0) {
            this.store.update(state => ({
                ...state,
                pagination: { ...state.pagination, page }
            }));
            return this.loadData();
        }
    }

    async setPageSize(size: number): Promise<void> {
        this.store.update(state => ({
            ...state,
            pagination: { ...state.pagination, page_size: size, page: 1 }
        }));
        return this.loadData();
    }

    async executeRowAction(action: string, row: any): Promise<void> {
        // Find action config
        const actionConfig = this.config?.row_actions?.find(a => a.label === action);
        if (actionConfig && actionConfig.action) {
            await actionConfig.action(row);
        }
    }

    async executeBulkAction(action: string): Promise<void> {
        const selectedRows = this.getSelectedRows();

        if (selectedRows.length === 0) return;

        const actionConfig = this.config?.bulk_actions?.find(a => a.label === action);
        if (actionConfig && actionConfig.action) {
            await actionConfig.action(selectedRows);
        }
    }

    async search(query: string): Promise<void> {
        if (!query) {
            return this.clearFilter('_search');
        }
        // Use _search as the filter key and search in description field
        return this.setFilter('_search', ['like', `%${query}%`]);
    }

    private updateState(partial: Partial<ListViewState>) {
        this.store.update(s => ({ ...s, ...partial }));
    }

    private async _fetchAndAppend() {
        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        const state = this.getState();
        const { page, page_size } = state.pagination;

        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', page_size.toString());

        if (state.sort) {
            params.set('order_by', state.sort.field);
            params.set('order', state.sort.order);
        }

        if (Object.keys(state.filters).length > 0) {
            params.set('filters', JSON.stringify(state.filters));
        }

        try {
            const response = await fetch(`/api/resource/${this.doctype}?${params.toString()}`, {
                signal: this.abortController.signal
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

            const result = await response.json();
            const newData = result.data || [];

            this.store.update(current => ({
                ...current,
                data: [...current.data, ...newData],
                loading: false,
                pagination: {
                    ...current.pagination,
                    has_more: newData.length === page_size
                }
            }));

        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }
            console.error('ListController fetch error:', error);
            this.updateState({ loading: false });
        }
    }
}
