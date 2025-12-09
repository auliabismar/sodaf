import { describe, it, expect } from 'vitest';
import type {
    ListViewConfig,
    ColumnConfig,
    FilterConfig,
    RowAction,
    BulkAction,
    SortConfig,
    ListViewState,
    PaginationState
} from '../types';

describe('List View Types', () => {
    it('should compile ColumnConfig', () => {
        const column: ColumnConfig = {
            fieldname: 'name',
            label: 'Name',
            width: '200px',
            sortable: true,
            formatter: (val) => `<b>${val}</b>`,
            hidden: false
        };
        expect(column.fieldname).toBe('name');
    });

    it('should compile FilterConfig', () => {
        const filter: FilterConfig = {
            fieldname: 'status',
            fieldtype: 'Select',
            label: 'Status',
            options: ['Active', 'Inactive'],
            default: 'Active',
            condition: '='
        };
        expect(filter.fieldname).toBe('status');
    });

    it('should compile RowAction', () => {
        const action: RowAction = {
            label: 'Edit',
            icon: 'edit',
            action: (row) => console.log(row),
            condition: (row) => row.status === 'Active',
            primary: true
        };
        expect(action.label).toBe('Edit');
    });

    it('should compile BulkAction', () => {
        const action: BulkAction = {
            label: 'Delete',
            icon: 'delete',
            action: (selection) => console.log(selection),
            confirm_message: 'Are you sure?'
        };
        expect(action.label).toBe('Delete');
    });

    it('should compile SortConfig', () => {
        const sort: SortConfig = {
            field: 'created_at',
            order: 'desc'
        };
        expect(sort.field).toBe('created_at');
    });

    it('should compile PaginationState', () => {
        const pagination: PaginationState = {
            page: 1,
            page_size: 20,
            total: 100,
            has_more: true
        };
        expect(pagination.total).toBe(100);
    });

    it('should compile ListViewState', () => {
        const state: ListViewState = {
            data: [{ id: 1, name: 'Test' }],
            loading: false,
            filters: { status: 'Active' },
            sort: { field: 'name', order: 'asc' },
            selection: ['1'],
            pagination: {
                page: 1,
                page_size: 20,
                total: 100,
                has_more: true
            }
        };
        expect(state.loading).toBe(false);
    });

    it('should compile ListViewConfig', () => {
        const config: ListViewConfig = {
            doctype: 'User',
            columns: [
                { fieldname: 'username', label: 'Username' }
            ],
            filters: [
                { fieldname: 'role', fieldtype: 'Link', label: 'Role' }
            ],
            default_sort: { field: 'username', order: 'asc' },
            page_length: 50
        };
        expect(config.doctype).toBe('User');
    });
});
