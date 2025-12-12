/**
 * P3-008: FormTabs Component Tests
 * - P3-008-T3: Tabs render
 * - P3-008-T4: Tab switching
 */

import { render } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FormTabs from '../FormTabs.svelte';

describe('P3-008: FormTabs Component', () => {
    const defaultTabs = [
        { label: 'Details', fieldname: 'tab_details' },
        { label: 'Settings', fieldname: 'tab_settings' },
        { label: 'Advanced', fieldname: 'tab_advanced' }
    ];

    let onTabChangeMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        onTabChangeMock = vi.fn();
    });

    describe('P3-008-T3: Tabs render', () => {
        it('renders all tabs', async () => {
            render(FormTabs, {
                tabs: defaultTabs,
                activeTab: 'tab_details',
                onTabChange: onTabChangeMock
            });

            await expect.element(page.getByRole('tab', { name: 'Details' })).toBeVisible();
            await expect.element(page.getByRole('tab', { name: 'Settings' })).toBeVisible();
            await expect.element(page.getByRole('tab', { name: 'Advanced' })).toBeVisible();
        });

        it('renders tabs with correct ARIA attributes', async () => {
            render(FormTabs, {
                tabs: defaultTabs,
                activeTab: 'tab_details',
                onTabChange: onTabChangeMock
            });

            const detailsTab = page.getByRole('tab', { name: 'Details' });
            await expect.element(detailsTab).toHaveAttribute('aria-selected', 'true');
            await expect.element(detailsTab).toHaveAttribute('aria-controls', 'panel-tab_details');

            const settingsTab = page.getByRole('tab', { name: 'Settings' });
            await expect.element(settingsTab).toHaveAttribute('aria-selected', 'false');
        });

        it('renders tablist container', async () => {
            render(FormTabs, {
                tabs: defaultTabs,
                activeTab: 'tab_details',
                onTabChange: onTabChangeMock
            });

            await expect.element(page.getByRole('tablist')).toBeVisible();
        });

        it('does not render when tabs array is empty', async () => {
            render(FormTabs, {
                tabs: [],
                activeTab: '',
                onTabChange: onTabChangeMock
            });

            const tablist = page.getByRole('tablist');
            await expect.element(tablist).not.toBeInTheDocument();
        });

        it('highlights active tab with correct class', async () => {
            render(FormTabs, {
                tabs: defaultTabs,
                activeTab: 'tab_settings',
                onTabChange: onTabChangeMock
            });

            const settingsTab = page.getByRole('tab', { name: 'Settings' });
            await expect.element(settingsTab).toHaveClass('active');
        });
    });

    describe('P3-008-T4: Tab switching', () => {
        it('calls onTabChange when tab is clicked', async () => {
            render(FormTabs, {
                tabs: defaultTabs,
                activeTab: 'tab_details',
                onTabChange: onTabChangeMock
            });

            const settingsTab = page.getByRole('tab', { name: 'Settings' });
            await settingsTab.click();

            expect(onTabChangeMock).toHaveBeenCalledWith('tab_settings');
        });

        it('updates active state when tab is clicked', async () => {
            render(FormTabs, {
                tabs: defaultTabs,
                activeTab: 'tab_details',
                onTabChange: onTabChangeMock
            });

            const settingsTab = page.getByRole('tab', { name: 'Settings' });
            await settingsTab.click();

            await expect.element(settingsTab).toHaveClass('active');
        });

        it('switches aria-selected correctly on tab change', async () => {
            render(FormTabs, {
                tabs: defaultTabs,
                activeTab: 'tab_details',
                onTabChange: onTabChangeMock
            });

            const detailsTab = page.getByRole('tab', { name: 'Details' });
            const settingsTab = page.getByRole('tab', { name: 'Settings' });

            await expect.element(detailsTab).toHaveAttribute('aria-selected', 'true');
            await expect.element(settingsTab).toHaveAttribute('aria-selected', 'false');

            await settingsTab.click();

            await expect.element(settingsTab).toHaveAttribute('aria-selected', 'true');
        });
    });

    describe('Tab initialization', () => {
        it('uses first tab as default when no activeTab provided', async () => {
            render(FormTabs, {
                tabs: defaultTabs,
                onTabChange: onTabChangeMock
            });

            const detailsTab = page.getByRole('tab', { name: 'Details' });
            await expect.element(detailsTab).toHaveClass('active');
        });
    });

    describe('Single tab behavior', () => {
        it('still renders when only one tab exists', async () => {
            const singleTab = [{ label: 'Only Tab', fieldname: 'only_tab' }];

            render(FormTabs, {
                tabs: singleTab,
                activeTab: 'only_tab',
                onTabChange: onTabChangeMock
            });

            await expect.element(page.getByRole('tab', { name: 'Only Tab' })).toBeVisible();
        });
    });
});
