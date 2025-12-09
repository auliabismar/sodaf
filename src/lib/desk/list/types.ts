import type { FieldType } from '../../meta/doctype/types';

/**
 * Configuration for a column in the list view
 */
export interface ColumnConfig {
    fieldname: string;
    label: string;
    width?: string;
    sortable?: boolean;
    formatter?: (value: any, row: any) => string;
    hidden?: boolean;
}

/**
 * Configuration for a filter in the list view
 */
export interface FilterConfig {
    fieldname: string;
    fieldtype: FieldType;
    label: string;
    options?: string | string[];
    default?: any;
    condition?: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'like' | 'in' | 'not in' | 'between';
}

/**
 * Action to be performed on a single row
 */
export interface RowAction {
    label: string;
    icon?: string;
    action: (row: any) => void | Promise<void>;
    condition?: (row: any) => boolean;
    primary?: boolean;
}

/**
 * Action to be performed on multiple selected rows
 */
export interface BulkAction {
    label: string;
    icon?: string;
    action: (selection: any[]) => void | Promise<void>;
    confirm_message?: string;
}

/**
 * Sort configuration
 */
export interface SortConfig {
    field: string;
    order: 'asc' | 'desc';
}

/**
 * Configuration for the list view of a specific DocType
 */
export interface ListViewConfig {
    doctype: string;
    columns: ColumnConfig[];
    filters: FilterConfig[];
    default_sort?: SortConfig;
    row_actions?: RowAction[];
    bulk_actions?: BulkAction[];
    page_length?: number;
}

/**
 * State of pagination
 */
export interface PaginationState {
    page: number;
    page_size: number;
    total: number;
    has_more: boolean;
}

/**
 * State of the list view
 */
export interface ListViewState<T = any> {
    data: T[];
    loading: boolean;
    error?: string | null;
    filters: Record<string, any>;
    sort?: SortConfig;
    selection: string[]; // List of selected IDs
    pagination: PaginationState;
}
