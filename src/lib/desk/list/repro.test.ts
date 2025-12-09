
import { render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import ListView from './ListView.svelte';
import type { ListViewConfig } from './types';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock dependencies
vi.mock('$app/navigation', () => ({
    goto: vi.fn(),
}));

global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: [], meta: { total: 0 } })
});

describe('ListView Repro', () => {
    const mockConfig: ListViewConfig = {
        doctype: 'ToDo',
        columns: [{ fieldname: 'title', label: 'Title' }],
        filters: [],
        row_actions: [],
        bulk_actions: []
    };

    it('renders without crashing', () => {
        const { container } = render(ListView, { doctype: 'ToDo', config: mockConfig });
        expect(container).toBeTruthy();
    });
});
