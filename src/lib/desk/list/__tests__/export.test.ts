/**
 * Export Module Tests
 * 
 * Tests for P3-004 List View Export functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    formatValue,
    generateFilename,
    exportCSV,
    exportExcel,
    prepareExportData,
    generateCSVContent,
    getExportColumns,
    escapeCSV,
    type ExportConfig,
    type ExportProgress
} from '../export';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock URL methods for download tests
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
(global as any).URL.createObjectURL = mockCreateObjectURL;
(global as any).URL.revokeObjectURL = mockRevokeObjectURL;

// Test data used across tests
const mockColumns = [
    { fieldname: 'name', label: 'Name', sortable: true },
    { fieldname: 'status', label: 'Status', sortable: true },
    { fieldname: 'created', label: 'Created Date' }
];

const mockData = [
    { name: 'doc1', status: 'Active', created: '2024-01-15' },
    { name: 'doc2', status: 'Pending', created: '2024-01-16' }
];

// Helper to setup fetch mock
function setupFetchMock(data = mockData, total = data.length) {
    fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data, meta: { total } })
    });
}

describe('Export Module', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        mockCreateObjectURL.mockClear();
        mockRevokeObjectURL.mockClear();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('formatValue', () => {
        // P3-004-T13: Date formatting
        it('should format Date objects as YYYY-MM-DD', () => {
            const date = new Date('2024-01-15T10:30:00Z');
            expect(formatValue(date, 'Date')).toBe('2024-01-15');
        });

        it('should format ISO date strings as YYYY-MM-DD', () => {
            expect(formatValue('2024-01-15T10:30:00.000Z', 'Date')).toBe('2024-01-15');
        });

        it('should format Datetime values', () => {
            const date = new Date('2024-01-15T10:30:00Z');
            expect(formatValue(date, 'Datetime')).toBe('2024-01-15 10:30:00');
        });

        it('should format Check values as Yes/No', () => {
            expect(formatValue(true, 'Check')).toBe('Yes');
            expect(formatValue(false, 'Check')).toBe('No');
            expect(formatValue(1, 'Check')).toBe('Yes');
            expect(formatValue(0, 'Check')).toBe('No');
        });

        it('should handle null and undefined', () => {
            expect(formatValue(null)).toBe('');
            expect(formatValue(undefined)).toBe('');
        });

        it('should format Int values as integers', () => {
            expect(formatValue(42.9, 'Int')).toBe('42');
        });

        it('should format numeric types', () => {
            expect(formatValue(123.45, 'Currency')).toBe('123.45');
            expect(formatValue(75.5, 'Percent')).toBe('75.5');
            expect(formatValue(3.14159, 'Float')).toBe('3.14159');
        });
    });

    describe('generateFilename', () => {
        // P3-004-T8: Filename includes doctype
        it('should generate filename with doctype and date', () => {
            const filename = generateFilename('Test DocType', 'csv');
            expect(filename).toMatch(/^Test_DocType_\d{4}-\d{2}-\d{2}\.csv$/);
        });

        it('should handle spaces in doctype', () => {
            const filename = generateFilename('My Test DocType', 'xlsx');
            expect(filename).toMatch(/^My_Test_DocType_\d{4}-\d{2}-\d{2}\.xlsx$/);
        });

        it('should use correct extension for format', () => {
            expect(generateFilename('Test', 'csv')).toMatch(/\.csv$/);
            expect(generateFilename('Test', 'xlsx')).toMatch(/\.xlsx$/);
        });
    });

    describe('escapeCSV', () => {
        it('should escape values with commas', () => {
            expect(escapeCSV('Hello, World')).toBe('"Hello, World"');
        });

        it('should escape values with quotes', () => {
            expect(escapeCSV('Say "Hello"')).toBe('"Say ""Hello"""');
        });

        it('should escape values with newlines', () => {
            expect(escapeCSV('Line1\nLine2')).toBe('"Line1\nLine2"');
        });

        it('should not escape simple values', () => {
            expect(escapeCSV('Simple')).toBe('Simple');
        });
    });

    describe('prepareExportData', () => {
        const columns = [
            { fieldname: 'name', label: 'Name', sortable: true },
            { fieldname: 'status', label: 'Status', sortable: true }
        ];

        const records = [
            { name: 'doc1', status: 'Active' },
            { name: 'doc2', status: 'Pending' }
        ];

        it('should return headers from column labels', () => {
            const { headers } = prepareExportData(records, columns);
            expect(headers).toEqual(['Name', 'Status']);
        });

        it('should return rows with formatted values', () => {
            const { rows } = prepareExportData(records, columns);
            expect(rows).toHaveLength(2);
            expect(rows[0]).toEqual(['doc1', 'Active']);
            expect(rows[1]).toEqual(['doc2', 'Pending']);
        });

        // P3-004-T6: Export selected only
        it('should filter by selectedIds when provided', () => {
            const { rows } = prepareExportData(records, columns, ['doc1']);
            expect(rows).toHaveLength(1);
            expect(rows[0]).toEqual(['doc1', 'Active']);
        });

        // P3-004-T14: Link field display values
        it('should use formatter for display values', () => {
            const columnsWithFormatter = [
                {
                    fieldname: 'user',
                    label: 'User',
                    formatter: (value: any) => `Display: ${value}`
                }
            ];
            const userRecords = [{ user: 'user123' }];

            const { rows } = prepareExportData(userRecords, columnsWithFormatter);
            expect(rows[0][0]).toBe('Display: user123');
        });

        it('should strip HTML from formatter output', () => {
            const columnsWithFormatter = [
                {
                    fieldname: 'user',
                    label: 'User',
                    formatter: (value: any) => `<a href="#">${value}</a>`
                }
            ];
            const userRecords = [{ user: 'user123' }];

            const { rows } = prepareExportData(userRecords, columnsWithFormatter);
            expect(rows[0][0]).toBe('user123');
            expect(rows[0][0]).not.toContain('<a');
        });
    });

    describe('generateCSVContent', () => {
        // P3-004-T12: Column headers use field labels
        it('should generate CSV with headers and rows', () => {
            const headers = ['Name', 'Status'];
            const rows = [['doc1', 'Active'], ['doc2', 'Pending']];

            const csv = generateCSVContent(headers, rows);

            expect(csv).toBe('Name,Status\ndoc1,Active\ndoc2,Pending');
        });

        it('should escape special characters', () => {
            const headers = ['Name', 'Description'];
            const rows = [['doc1', 'Has, comma'], ['doc2', 'Has "quotes"']];

            const csv = generateCSVContent(headers, rows);

            expect(csv).toContain('"Has, comma"');
            expect(csv).toContain('"Has ""quotes"""');
        });
    });

    describe('getExportColumns', () => {
        const columns = [
            { fieldname: 'name', label: 'Name' },
            { fieldname: 'status', label: 'Status', hidden: true },
            { fieldname: 'date', label: 'Date' }
        ];

        // P3-004-T3: Export with fields param
        it('should filter by fields when specified', () => {
            const config = {
                doctype: 'Test',
                columns,
                fields: ['name', 'date'],
                format: 'csv' as const
            };

            const result = getExportColumns(config);
            expect(result).toHaveLength(2);
            expect(result.map(c => c.fieldname)).toEqual(['name', 'date']);
        });

        it('should exclude hidden columns when no fields specified', () => {
            const config = {
                doctype: 'Test',
                columns,
                format: 'csv' as const
            };

            const result = getExportColumns(config);
            expect(result).toHaveLength(2);
            expect(result.map(c => c.fieldname)).toEqual(['name', 'date']);
        });
    });

    describe('exportCSV', () => {
        // P3-004-T1: exportCSV returns Blob with CSV data
        it('should return a Blob with CSV data', async () => {
            setupFetchMock();

            const config: ExportConfig = {
                doctype: 'Test',
                columns: mockColumns,
                format: 'csv'
            };

            const blob = await exportCSV(config);

            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe('text/csv;charset=utf-8;');
        });

        // P3-004-T4: Export respects filters
        it('should pass filters to API', async () => {
            setupFetchMock();

            const config: ExportConfig = {
                doctype: 'Test',
                columns: mockColumns,
                filters: { status: 'Active' },
                format: 'csv'
            };

            await exportCSV(config);

            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining('filters=%7B%22status%22%3A%22Active%22%7D'),
                expect.any(Object)
            );
        });

        // P3-004-T9: Progress indicator
        it('should call onProgress during export', async () => {
            setupFetchMock();

            const progressCallback = vi.fn();
            const config: ExportConfig = {
                doctype: 'Test',
                columns: mockColumns,
                format: 'csv',
                onProgress: progressCallback
            };

            await exportCSV(config);

            expect(progressCallback).toHaveBeenCalled();
            const lastCall = progressCallback.mock.calls[progressCallback.mock.calls.length - 1][0];
            expect(lastCall.status).toBe('complete');
        });

        // P3-004-T10: Cancel export
        it('should throw AbortError when cancelled', async () => {
            const controller = new AbortController();
            controller.abort();

            const config: ExportConfig = {
                doctype: 'Test',
                columns: mockColumns,
                format: 'csv',
                signal: controller.signal
            };

            await expect(exportCSV(config)).rejects.toThrow('Export cancelled');
        });
    });

    describe('exportExcel', () => {
        // P3-004-T2: exportExcel returns Blob with XLSX data
        it('should return a Blob with XLSX data', async () => {
            setupFetchMock();

            const config: ExportConfig = {
                doctype: 'Test',
                columns: mockColumns,
                format: 'xlsx'
            };

            const blob = await exportExcel(config);

            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        });

        it('should call onProgress during export', async () => {
            setupFetchMock();

            const progressCallback = vi.fn();
            const config: ExportConfig = {
                doctype: 'Test',
                columns: mockColumns,
                format: 'xlsx',
                onProgress: progressCallback
            };

            await exportExcel(config);

            expect(progressCallback).toHaveBeenCalled();
        });

        it('should throw AbortError when cancelled', async () => {
            const controller = new AbortController();
            controller.abort();

            const config: ExportConfig = {
                doctype: 'Test',
                columns: mockColumns,
                format: 'xlsx',
                signal: controller.signal
            };

            await expect(exportExcel(config)).rejects.toThrow('Export cancelled');
        });
    });

    describe('fetchAllRecords (pagination)', () => {
        // P3-004-T5: Export all pages
        it('should fetch all pages for large datasets', async () => {
            const page1Data = Array.from({ length: 100 }, (_, i) => ({ name: `doc${i}` }));
            const page2Data = Array.from({ length: 50 }, (_, i) => ({ name: `doc${100 + i}` }));

            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ data: page1Data, meta: { total: 150 } })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ data: page2Data, meta: { total: 150 } })
                });

            const columns = [{ fieldname: 'name', label: 'Name', sortable: true }];
            const config: ExportConfig = {
                doctype: 'Test',
                columns,
                format: 'csv'
            };

            await exportCSV(config);

            // Should make 2 API calls for pagination
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });
    });
});
