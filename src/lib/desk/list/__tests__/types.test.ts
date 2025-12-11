/**
 * P3-001: List View Types and Interfaces Tests
 * 
 * Tests to verify all list view interfaces compile correctly.
 */

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

describe('P3-001: List View Types and Interfaces', () => {
    // P3-001-T2: ColumnConfig interface compiles
    it('P3-001-T2: ColumnConfig interface compiles', () => {
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

    // P3-001-T3: FilterConfig interface compiles
    it('P3-001-T3: FilterConfig interface compiles', () => {
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

    // P3-001-T4: RowAction interface compiles
    it('P3-001-T4: RowAction interface compiles', () => {
        const action: RowAction = {
            label: 'Edit',
            icon: 'edit',
            action: (row) => console.log(row),
            condition: (row) => row.status === 'Active',
            primary: true
        };
        expect(action.label).toBe('Edit');
    });

    // P3-001-T5: BulkAction interface compiles
    it('P3-001-T5: BulkAction interface compiles', () => {
        const action: BulkAction = {
            label: 'Delete',
            icon: 'delete',
            action: (selection) => console.log(selection),
            confirm_message: 'Are you sure?'
        };
        expect(action.label).toBe('Delete');
    });

    // P3-001-T6: SortConfig interface compiles
    it('P3-001-T6: SortConfig interface compiles', () => {
        const sort: SortConfig = {
            field: 'created_at',
            order: 'desc'
        };
        expect(sort.field).toBe('created_at');
    });

    // P3-001-T8: PaginationState interface compiles
    it('P3-001-T8: PaginationState interface compiles', () => {
        const pagination: PaginationState = {
            page: 1,
            page_size: 20,
            total: 100,
            has_more: true
        };
        expect(pagination.total).toBe(100);
    });

    // P3-001-T7: ListViewState interface compiles
    it('P3-001-T7: ListViewState interface compiles', () => {
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

    // P3-001-T1: ListViewConfig interface compiles
    it('P3-001-T1: ListViewConfig interface compiles', () => {
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
