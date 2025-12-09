/**
 * List View Export Module
 * 
 * Provides CSV and Excel export functionality for list views
 * with support for field selection, filtering, and progress tracking.
 */

import * as XLSX from 'xlsx';
import type { ColumnConfig, SortConfig } from './types';
import type { FieldType } from '../../meta/doctype/types';

/**
 * Configuration for export operations
 */
export interface ExportConfig {
    /** DocType name */
    doctype: string;
    /** Column configurations with labels and formatters */
    columns: ColumnConfig[];
    /** Currently applied filters */
    filters?: Record<string, any>;
    /** Current sort order */
    sort?: SortConfig;
    /** If provided, only export these row IDs */
    selectedIds?: string[];
    /** If provided, only export these fields (by fieldname) */
    fields?: string[];
    /** Export format */
    format: 'csv' | 'xlsx';
    /** Progress callback */
    onProgress?: (progress: ExportProgress) => void;
    /** Abort signal for cancellation */
    signal?: AbortSignal;
}

/**
 * Progress information for export operations
 */
export interface ExportProgress {
    /** Current number of records fetched */
    current: number;
    /** Total number of records */
    total: number;
    /** Current status */
    status: 'fetching' | 'processing' | 'complete' | 'cancelled';
}

/**
 * Format a value based on field type for export
 */
export function formatValue(value: any, fieldtype?: FieldType): string {
    if (value === null || value === undefined) {
        return '';
    }

    switch (fieldtype) {
        case 'Date':
            // Format as YYYY-MM-DD
            if (value instanceof Date) {
                return value.toISOString().split('T')[0];
            }
            if (typeof value === 'string' && value.includes('T')) {
                return value.split('T')[0];
            }
            return String(value);

        case 'Datetime':
            // Format as YYYY-MM-DD HH:mm:ss
            if (value instanceof Date) {
                return value.toISOString().replace('T', ' ').split('.')[0];
            }
            if (typeof value === 'string' && value.includes('T')) {
                return value.replace('T', ' ').split('.')[0];
            }
            return String(value);

        case 'Check':
            return value ? 'Yes' : 'No';

        case 'Currency':
        case 'Float':
        case 'Percent':
            return typeof value === 'number' ? value.toString() : String(value);

        case 'Int':
            return typeof value === 'number' ? Math.floor(value).toString() : String(value);

        default:
            return String(value);
    }
}

/**
 * Generate filename for export
 */
export function generateFilename(doctype: string, format: 'csv' | 'xlsx'): string {
    const date = new Date().toISOString().split('T')[0];
    const safeName = doctype.replace(/\s+/g, '_');
    return `${safeName}_${date}.${format}`;
}

/**
 * Fetch all records for export, handling pagination
 */
async function fetchAllRecords(
    config: ExportConfig
): Promise<any[]> {
    const allRecords: any[] = [];
    const pageSize = 100;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        if (config.signal?.aborted) {
            throw new DOMException('Export cancelled', 'AbortError');
        }

        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', pageSize.toString());

        if (config.sort) {
            params.set('order_by', config.sort.field);
            params.set('order', config.sort.order);
        }

        if (config.filters && Object.keys(config.filters).length > 0) {
            params.set('filters', JSON.stringify(config.filters));
        }

        const response = await fetch(`/api/resource/${config.doctype}?${params.toString()}`, {
            signal: config.signal
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const result = await response.json();
        const data = result.data || [];
        const meta = result.meta || {};

        allRecords.push(...data);

        // Update progress
        if (config.onProgress) {
            config.onProgress({
                current: allRecords.length,
                total: meta.total || allRecords.length,
                status: 'fetching'
            });
        }

        hasMore = data.length === pageSize;
        page++;
    }

    return allRecords;
}

/**
 * Filter columns based on fields selection
 */
export function getExportColumns(config: ExportConfig): ColumnConfig[] {
    if (!config.fields || config.fields.length === 0) {
        return config.columns.filter(col => !col.hidden);
    }
    return config.columns.filter(col => config.fields!.includes(col.fieldname));
}

/**
 * Convert records to export data format
 */
export function prepareExportData(
    records: any[],
    columns: ColumnConfig[],
    selectedIds?: string[]
): { headers: string[]; rows: string[][] } {
    // Filter by selected IDs if provided
    let exportRecords = records;
    if (selectedIds && selectedIds.length > 0) {
        exportRecords = records.filter(record => selectedIds.includes(record.name));
    }

    // Get headers from column labels
    const headers = columns.map(col => col.label);

    // Convert each record to a row of values
    const rows = exportRecords.map(record => {
        return columns.map(col => {
            const value = record[col.fieldname];
            // Use formatter if available, otherwise format based on type
            if (col.formatter) {
                // Strip HTML tags from formatter output
                const formatted = col.formatter(value, record);
                return formatted.replace(/<[^>]*>/g, '');
            }
            return formatValue(value);
        });
    });

    return { headers, rows };
}

/**
 * Escape CSV values
 */
export function escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Generate CSV content as string (useful for testing)
 */
export function generateCSVContent(headers: string[], rows: string[][]): string {
    const csvLines: string[] = [];
    csvLines.push(headers.map(escapeCSV).join(','));
    rows.forEach(row => {
        csvLines.push(row.map(escapeCSV).join(','));
    });
    return csvLines.join('\n');
}

/**
 * Export data to CSV format
 */
export async function exportCSV(config: ExportConfig): Promise<Blob> {
    // Fetch all records
    const records = await fetchAllRecords(config);

    if (config.signal?.aborted) {
        throw new DOMException('Export cancelled', 'AbortError');
    }

    // Update progress
    if (config.onProgress) {
        config.onProgress({
            current: records.length,
            total: records.length,
            status: 'processing'
        });
    }

    // Get columns to export
    const columns = getExportColumns(config);

    // Prepare data
    const { headers, rows } = prepareExportData(records, columns, config.selectedIds);

    // Generate CSV content
    const csvContent = generateCSVContent(headers, rows);

    // Update progress
    if (config.onProgress) {
        config.onProgress({
            current: records.length,
            total: records.length,
            status: 'complete'
        });
    }

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Export data to Excel format
 */
export async function exportExcel(config: ExportConfig): Promise<Blob> {
    // Fetch all records
    const records = await fetchAllRecords(config);

    if (config.signal?.aborted) {
        throw new DOMException('Export cancelled', 'AbortError');
    }

    // Update progress
    if (config.onProgress) {
        config.onProgress({
            current: records.length,
            total: records.length,
            status: 'processing'
        });
    }

    // Get columns to export
    const columns = getExportColumns(config);

    // Prepare data
    const { headers, rows } = prepareExportData(records, columns, config.selectedIds);

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths based on content
    const colWidths = headers.map((header, i) => {
        const maxLength = Math.max(
            header.length,
            ...rows.map(row => (row[i] || '').length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
    });
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, config.doctype.substring(0, 31));

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Update progress
    if (config.onProgress) {
        config.onProgress({
            current: records.length,
            total: records.length,
            status: 'complete'
        });
    }

    return new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
}

/**
 * Trigger browser download for an export blob
 */
export function downloadExport(blob: Blob, doctype: string, format: 'csv' | 'xlsx'): void {
    const filename = generateFilename(doctype, format);
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    URL.revokeObjectURL(url);
}

/**
 * Main export function that handles the full export workflow
 */
export async function performExport(config: ExportConfig): Promise<void> {
    let blob: Blob;

    if (config.format === 'csv') {
        blob = await exportCSV(config);
    } else {
        blob = await exportExcel(config);
    }

    if (!config.signal?.aborted) {
        downloadExport(blob, config.doctype, config.format);
    }
}
