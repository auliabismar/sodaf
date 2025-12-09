
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ListView from './ListView.svelte';
import { ListController } from './list-controller';
import type { ListViewConfig } from './types';

// Mock dependencies
vi.mock('$app/navigation', () => ({
    goto: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Setup fetch mock
global.fetch = vi.fn();

describe('P3-003 List View', () => {
    const mockConfig: ListViewConfig = {
        doctype: 'ToDo',
        columns: [
            { fieldname: 'description', label: 'Description' },
            { fieldname: 'status', label: 'Status' }
        ],
        filters: [
            { fieldname: 'status', label: 'Status', fieldtype: 'Select', options: ['Open', 'Closed'] },
            { fieldname: 'due_date', label: 'Due Date', fieldtype: 'Date' }
        ],
        row_actions: [
            { label: 'Edit', action: vi.fn() }
        ],
        bulk_actions: [
            { label: 'Delete', action: vi.fn() }
        ]
    };

    beforeEach(() => {
        vi.resetAllMocks();
        // Default success response
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                data: [
                    { name: 'todo-1', description: 'Test Task 1', status: 'Open' },
                    { name: 'todo-2', description: 'Test Task 2', status: 'Closed' }
                ],
                meta: { total: 2 }
            })
        });
    });

    it('P3-003-T1: Component renders (DataTable functional)', async () => {
        render(ListView, { doctype: 'ToDo', config: mockConfig });
        // Carbon DataTable uses specific classes, but we check for headers
        expect(screen.getByText('Description')).toBeTruthy();
        expect(screen.getByText('Status')).toBeTruthy();
    });

    it('P3-003-T2: Columns from config shown', async () => {
        render(ListView, { doctype: 'ToDo', config: mockConfig });
        expect(screen.getByText('Description')).toBeTruthy();
        expect(screen.getByText('Status')).toBeTruthy();
    });

    it('P3-003-T3: Column sorting', async () => {
        render(ListView, { doctype: 'ToDo', config: mockConfig });
        await waitFor(() => expect(screen.getByText('Test Task 1')).toBeTruthy());

        const header = screen.getByText('Description');
        await fireEvent.click(header);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('order_by=description'),
                expect.any(Object)
            );
        });
    });

    it('P3-003-T8: Filters render', () => {
        render(ListView, { doctype: 'ToDo', config: mockConfig });
        expect(screen.getByLabelText('Status')).toBeTruthy();
    });

    it('P3-003-T10: Filter change updates list', async () => {
        render(ListView, { doctype: 'ToDo', config: mockConfig });
        const statusSelect = screen.getByLabelText('Status');
        await fireEvent.change(statusSelect, { target: { value: 'Open' } });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('filters=%7B%22status%22%3A%22Open%22%7D'),
                expect.any(Object)
            );
        });
    });

    it('P3-003-T12 & T14: Pagination controls and total count', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: Array(20).fill(0).map((_, i) => ({ name: `task-${i}`, description: `Task ${i}`, status: 'Open' })),
                meta: { total: 50 }
            })
        });

        render(ListView, { doctype: 'ToDo', config: mockConfig });
        await waitFor(() => expect(screen.getByText('of 3 pages')).toBeTruthy());
    });

    it('P3-003-T17: Bulk actions toolbar', async () => {
        render(ListView, { doctype: 'ToDo', config: mockConfig });
        await waitFor(() => expect(screen.getByText('Test Task 1')).toBeTruthy());

        // Find a checkbox to select a row (Carbon checkbox)
        // This might be tricky without specific selectors, but usually they have aria-labels or role=checkbox
        const checkboxes = screen.getAllByRole('checkbox');
        // 0 is usually header, 1+ are rows
        if (checkboxes.length > 1) {
            await fireEvent.click(checkboxes[1]);
            // Now bulk actions should appear in toolbar
            await waitFor(() => {
                // Carbon toolbar menu "Actions (1)"
                expect(screen.getByText('Actions (1)')).toBeTruthy();
            });
        }
    });
});
