/**
 * Layout Components Browser Tests
 * P3-020: Test Navbar, UserMenu, and DeskLayout components
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';

import Navbar from '../Navbar.svelte';
import UserMenu from '../UserMenu.svelte';
import type { User } from '$lib/auth/types';

// Test user
const mockUser: User = {
    name: 'admin@example.com',
    email: 'admin@example.com',
    full_name: 'Admin User',
    enabled: true,
    user_type: 'System User'
};

describe('UserMenu Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('P3-020-T9: displays user name and initials', async () => {
        render(UserMenu, { user: mockUser });

        // Check user name is displayed
        const userName = page.getByTestId('user-name');
        await expect.element(userName).toBeVisible();
        await expect.element(userName).toHaveTextContent('Admin User');

        // Check initials are displayed
        const initials = page.getByTestId('user-initials');
        await expect.element(initials).toBeVisible();
        await expect.element(initials).toHaveTextContent('AU');
    });

    it('P3-020-T11: opens dropdown menu on click', async () => {
        render(UserMenu, { user: mockUser });

        // Initially dropdown should not be visible
        const trigger = page.getByTestId('user-menu-trigger');
        await trigger.click();

        // Dropdown should now be visible
        const dropdown = page.getByTestId('user-menu-dropdown');
        await expect.element(dropdown).toBeVisible();

        // Should have profile, settings, logout
        await expect.element(page.getByTestId('user-menu-profile')).toBeVisible();
        await expect.element(page.getByTestId('user-menu-settings')).toBeVisible();
        await expect.element(page.getByTestId('user-menu-logout')).toBeVisible();
    });

    it('P3-020-T12: calls onLogout when logout clicked', async () => {
        const onLogout = vi.fn();
        render(UserMenu, { user: mockUser, onLogout });

        // Open menu
        await page.getByTestId('user-menu-trigger').click();

        // Click logout
        await page.getByTestId('user-menu-logout').click();

        expect(onLogout).toHaveBeenCalled();
    });

    it('displays guest for null user', async () => {
        render(UserMenu, { user: null });

        const userName = page.getByTestId('user-name');
        await expect.element(userName).toHaveTextContent('Guest');
    });
});

describe('Navbar Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('P3-020-T9: displays user in navbar', async () => {
        render(Navbar, { user: mockUser });

        const navbar = page.getByTestId('navbar');
        await expect.element(navbar).toBeVisible();

        // User menu should be visible
        const userMenu = page.getByTestId('user-menu');
        await expect.element(userMenu).toBeVisible();
    });

    it('P3-020-T10: search button triggers onSearchClick', async () => {
        const onSearchClick = vi.fn();
        render(Navbar, { user: mockUser, onSearchClick });

        const searchBtn = page.getByTestId('navbar-search');
        await searchBtn.click();

        expect(onSearchClick).toHaveBeenCalled();
    });

    it('P3-020-T14: displays breadcrumbs', async () => {
        render(Navbar, {
            user: mockUser,
            breadcrumbs: [
                { label: 'Home', href: '/app' },
                { label: 'Users', href: '/app/User' },
                { label: 'Admin' }
            ]
        });

        const breadcrumbs = page.getByTestId('breadcrumbs');
        await expect.element(breadcrumbs).toBeVisible();
        await expect.element(breadcrumbs).toHaveTextContent('Home');
        await expect.element(breadcrumbs).toHaveTextContent('Users');
        await expect.element(breadcrumbs).toHaveTextContent('Admin');
    });

    it('P3-020-T16: theme toggle button works', async () => {
        const onThemeToggle = vi.fn();
        render(Navbar, { user: mockUser, onThemeToggle });

        const themeToggle = page.getByTestId('navbar-theme-toggle');
        await themeToggle.click();

        expect(onThemeToggle).toHaveBeenCalled();
    });

    it('P3-020-T17: displays notification count', async () => {
        render(Navbar, { user: mockUser, notificationCount: 5 });

        const count = page.getByTestId('notification-count');
        await expect.element(count).toBeVisible();
        await expect.element(count).toHaveTextContent('5');
    });

    it('P3-020-T17: shows 99+ for large notification counts', async () => {
        render(Navbar, { user: mockUser, notificationCount: 150 });

        const count = page.getByTestId('notification-count');
        await expect.element(count).toHaveTextContent('99+');
    });

    it('P3-020-T18: quick create dropdown opens', async () => {
        render(Navbar, {
            user: mockUser,
            quickCreateItems: [
                { label: 'User', doctype: 'User', icon: '👤' },
                { label: 'Role', doctype: 'Role', icon: '🎭' }
            ]
        });

        const quickCreateBtn = page.getByTestId('navbar-quick-create');
        await quickCreateBtn.click();

        const dropdown = page.getByTestId('quick-create-dropdown');
        await expect.element(dropdown).toBeVisible();
    });

    it('P3-020-T18: quick create calls onQuickCreate', async () => {
        const onQuickCreate = vi.fn();
        render(Navbar, {
            user: mockUser,
            quickCreateItems: [{ label: 'User', doctype: 'User', icon: '👤' }],
            onQuickCreate
        });

        // Open dropdown
        await page.getByTestId('navbar-quick-create').click();

        // Click first item
        const dropdown = page.getByTestId('quick-create-dropdown');
        const item = dropdown.getByRole('menuitem');
        await item.click();

        expect(onQuickCreate).toHaveBeenCalledWith('User');
    });
});
