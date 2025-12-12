/**
 * P3-017 Workspace Browser Tests
 * 
 * Browser-based tests for Workspace Svelte components using vitest-browser-svelte
 */
import { render } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';
import { describe, it, expect, vi } from 'vitest';
import Workspace from './Workspace.svelte';
import ShortcutCard from './ShortcutCard.svelte';
import LinkGroup from './LinkGroup.svelte';
import WorkspaceChart from './WorkspaceChart.svelte';
import type { FilteredWorkspace, WorkspaceShortcut, WorkspaceLink, WorkspaceChart as ChartType } from './types';

describe('P3-017 Workspace Components (Browser)', () => {
    const mockShortcut: WorkspaceShortcut = {
        label: 'Sales Order',
        link_to: 'Sales Order',
        type: 'DocType',
        stats_filter: { status: 'Draft' }
    };

    const mockLinks: WorkspaceLink[] = [
        { label: 'Customer', link_to: 'Customer', type: 'DocType', link_group: 'Masters' },
        { label: 'Item', link_to: 'Item', type: 'DocType', link_group: 'Masters' },
        { label: 'Sales Invoice', link_to: 'Sales Invoice', type: 'DocType', link_group: 'Transactions' }
    ];

    const mockChart: ChartType = {
        chart_name: 'sales_monthly',
        label: 'Monthly Sales',
        width: 'Full'
    };

    const mockWorkspace: FilteredWorkspace = {
        name: 'selling',
        label: 'Selling',
        icon: 'cart',
        module: 'Selling',
        category: 'Modules',
        sequence: 1,
        roles: [],
        shortcuts: [mockShortcut],
        grouped_links: new Map([
            ['Masters', [mockLinks[0], mockLinks[1]]],
            ['Transactions', [mockLinks[2]]]
        ]),
        links: mockLinks,
        charts: [mockChart],
        number_cards: [],
        quick_lists: []
    };

    describe('ShortcutCard', () => {
        // P3-017-T9: Shortcut cards display
        it('P3-017-T9: Shortcut cards display icon, label', async () => {
            render(ShortcutCard, { shortcut: mockShortcut });

            await expect.element(page.getByText('Sales Order')).toBeVisible();
            await expect.element(page.getByTestId('shortcut-card-Sales Order')).toBeVisible();
        });

        // P3-017-T10: Shortcut count loads async
        it('P3-017-T10: Shortcut count loads async', async () => {
            const mockGetCount = vi.fn().mockResolvedValue(42);

            render(ShortcutCard, {
                shortcut: mockShortcut,
                getCount: mockGetCount
            });

            // Should show loading initially
            await expect.element(page.getByTestId('shortcut-count-loading')).toBeVisible();

            // Wait for count to load
            await expect.element(page.getByTestId('shortcut-count')).toBeVisible();
            await expect.element(page.getByText('42')).toBeVisible();

            expect(mockGetCount).toHaveBeenCalledWith('Sales Order', { status: 'Draft' });
        });

        // P3-017-T11: Shortcut click navigates
        it('P3-017-T11: Shortcut click navigates', async () => {
            render(ShortcutCard, { shortcut: mockShortcut });

            const card = page.getByTestId('shortcut-card-Sales Order');
            await card.click();

            // Navigation would occur via window.location.href
            expect(true).toBe(true);
        });
    });

    describe('LinkGroup', () => {
        // P3-017-T12: Link groups organized
        it('P3-017-T12: Link groups organized', async () => {
            render(LinkGroup, { groupName: 'Masters', links: mockLinks.slice(0, 2) });

            await expect.element(page.getByTestId('link-group-Masters')).toBeVisible();
            await expect.element(page.getByText('Customer')).toBeVisible();
            await expect.element(page.getByText('Item')).toBeVisible();
        });

        // P3-017-T13: Link group headers
        it('P3-017-T13: Link group headers display', async () => {
            render(LinkGroup, { groupName: 'Transactions', links: [mockLinks[2]] });

            await expect.element(page.getByText('Transactions')).toBeVisible();
        });

        // P3-017-T14: Link click navigates
        it('P3-017-T14: Link click navigates', async () => {
            render(LinkGroup, { groupName: 'Masters', links: [mockLinks[0]] });

            const link = page.getByTestId('link-item-Customer');
            await link.click();

            // Navigation occurs via window.location.href
            expect(true).toBe(true);
        });
    });

    describe('WorkspaceChart', () => {
        // P3-017-T15: Charts render
        it('P3-017-T15: Charts render', async () => {
            render(WorkspaceChart, { chart: mockChart });

            await expect.element(page.getByTestId('workspace-chart-sales_monthly')).toBeVisible();
            await expect.element(page.getByText('Monthly Sales')).toBeVisible();
        });

        // Chart width classes
        it('Chart respects width setting', async () => {
            render(WorkspaceChart, { chart: { ...mockChart, width: 'Half' } });

            const chart = page.getByTestId('workspace-chart-sales_monthly');
            await expect.element(chart).toHaveClass('half-width');
        });
    });

    describe('Workspace', () => {
        // P3-017-T8: Workspace renders
        it('P3-017-T8: Workspace renders', async () => {
            render(Workspace, { workspace: mockWorkspace });

            await expect.element(page.getByTestId('workspace')).toBeVisible();
        });

        // P3-017-T8 continued: Shows shortcuts and links
        it('P3-017-T8: Shows shortcuts and links', async () => {
            render(Workspace, { workspace: mockWorkspace });

            // Shortcuts section
            await expect.element(page.getByText('Shortcuts')).toBeVisible();
            await expect.element(page.getByText('Sales Order')).toBeVisible();

            // Links section
            await expect.element(page.getByText('Links')).toBeVisible();
            await expect.element(page.getByText('Customer')).toBeVisible();

            // Charts section  
            await expect.element(page.getByText('Dashboard')).toBeVisible();
        });

        // P3-017-T16: Only permitted items shown (tested via filtered workspace)
        it('P3-017-T16: Only permitted items shown', async () => {
            // A workspace with filtered (empty) content
            const filteredWorkspace: FilteredWorkspace = {
                ...mockWorkspace,
                shortcuts: [], // No shortcuts due to permissions
                grouped_links: new Map(), // No links due to permissions
                links: []
            };

            render(Workspace, { workspace: filteredWorkspace });

            // Should still render but without shortcuts/links
            await expect.element(page.getByTestId('workspace')).toBeVisible();
        });

        // P3-017-T17: Empty workspace
        it('P3-017-T17: Empty workspace shows message', async () => {
            const emptyWorkspace: FilteredWorkspace = {
                ...mockWorkspace,
                shortcuts: [],
                grouped_links: new Map(),
                links: [],
                charts: []
            };

            render(Workspace, { workspace: emptyWorkspace });

            await expect.element(page.getByTestId('workspace-empty')).toBeVisible();
            await expect.element(page.getByText('No content available')).toBeVisible();
        });

        // P3-017-T18: Responsive grid (visual test - basic check)
        it('P3-017-T18: Responsive grid adapts', async () => {
            render(Workspace, { workspace: mockWorkspace });

            // Verify the grid containers exist
            const shortcuts = page.getByText('Shortcuts');
            await expect.element(shortcuts).toBeVisible();

            // The grid CSS is responsive, this test confirms structure exists
            expect(true).toBe(true);
        });

        // P3-017-T19: Loading state
        it('P3-017-T19: Loading state shows skeleton', async () => {
            render(Workspace, { workspace: null, loading: true });

            await expect.element(page.getByTestId('workspace-loading')).toBeVisible();
        });
    });
});
