/**
 * Workspace Manager Tests
 * P3-016: Tests for WorkspaceManager permission-aware navigation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkspaceManager, type WorkspaceManagerConfig, type UserContext, type RecentDocument } from '../workspace/workspace-manager';
import { PermissionManager, type PermissionManagerConfig } from '../../permissions';
import type { Workspace, WorkspaceShortcut } from '../workspace/types';

describe('P3-016: Workspace Manager', () => {
    // Helper to create a mock permission manager
    function createMockPermissionManager(config: Partial<PermissionManagerConfig> = {}): PermissionManager {
        const defaultConfig: PermissionManagerConfig = {
            user: 'test@example.com',
            roles: ['Sales User'],
            rolePermissions: new Map([
                ['Sales Order', [{ role: 'Sales User', read: true, write: true, create: true }]],
                ['Customer', [{ role: 'Sales User', read: true, write: false, create: false }]],
                ['Item', [{ role: 'Sales User', read: true, write: true, create: true }]],
                ['Purchase Order', [{ role: 'Purchase User', read: true, write: true }]],
                ['Employee', [{ role: 'HR Manager', read: true, write: true, create: true }]],
                ['Salary Slip', [{ role: 'HR Manager', read: true }]]
            ]),
            ...config
        };
        return new PermissionManager(defaultConfig);
    }

    // Sample workspaces for testing
    function createSampleWorkspaces(): Workspace[] {
        return [
            {
                name: 'selling',
                label: 'Selling',
                icon: 'icon-selling',
                module: 'Selling',
                category: 'Modules',
                sequence: 1,
                roles: [],
                shortcuts: [
                    { label: 'New Sales Order', link_to: 'Sales Order', type: 'DocType' },
                    { label: 'New Customer', link_to: 'Customer', type: 'DocType' }
                ],
                links: [
                    { label: 'Sales Order', link_to: 'Sales Order', type: 'DocType', link_group: 'Transactions' },
                    { label: 'Customer', link_to: 'Customer', type: 'DocType', link_group: 'Masters' }
                ],
                charts: [],
                number_cards: [],
                quick_lists: []
            },
            {
                name: 'buying',
                label: 'Buying',
                icon: 'icon-buying',
                module: 'Buying',
                category: 'Modules',
                sequence: 2,
                roles: [],
                shortcuts: [
                    { label: 'New Purchase Order', link_to: 'Purchase Order', type: 'DocType' }
                ],
                links: [
                    { label: 'Purchase Order', link_to: 'Purchase Order', type: 'DocType', link_group: 'Transactions' }
                ],
                charts: [],
                number_cards: [],
                quick_lists: []
            },
            {
                name: 'hr',
                label: 'Human Resources',
                icon: 'icon-hr',
                module: 'HR',
                category: 'Modules',
                sequence: 3,
                roles: ['HR Manager'],
                shortcuts: [
                    { label: 'New Employee', link_to: 'Employee', type: 'DocType' }
                ],
                links: [
                    { label: 'Employee', link_to: 'Employee', type: 'DocType', link_group: 'Masters' },
                    { label: 'Salary Slip', link_to: 'Salary Slip', type: 'DocType', link_group: 'Transactions' }
                ],
                charts: [],
                number_cards: [],
                quick_lists: []
            },
            {
                name: 'administration',
                label: 'Administration',
                icon: 'icon-admin',
                module: 'Core',
                category: 'Administration',
                sequence: 10,
                roles: ['System Manager'],
                shortcuts: [],
                links: [
                    { label: 'System Settings', link_to: '/app/system-settings', type: 'Page' }
                ],
                charts: [],
                number_cards: [],
                quick_lists: []
            }
        ];
    }

    let pm: PermissionManager;
    let wm: WorkspaceManager;
    let salesUser: UserContext;
    let hrManager: UserContext;
    let systemManager: UserContext;

    beforeEach(() => {
        pm = createMockPermissionManager();
        wm = new WorkspaceManager({
            permissionManager: pm,
            workspaces: createSampleWorkspaces()
        });

        salesUser = { name: 'sales@example.com', roles: ['Sales User'] };
        hrManager = { name: 'hr@example.com', roles: ['HR Manager'] };
        systemManager = { name: 'admin@example.com', roles: ['System Manager'] };
    });

    // P3-016-T1: getVisibleWorkspaces(user) returns workspaces user can see
    describe('P3-016-T1: getVisibleWorkspaces(user)', () => {
        it('should return workspaces the user can see', () => {
            const visible = wm.getVisibleWorkspaces(salesUser);

            expect(visible.length).toBeGreaterThan(0);
            expect(visible.some(w => w.name === 'selling')).toBe(true);
        });

        it('should not return workspaces user cannot access', () => {
            const visible = wm.getVisibleWorkspaces(salesUser);

            // HR workspace requires HR Manager role
            expect(visible.some(w => w.name === 'hr')).toBe(false);
        });
    });

    // P3-016-T2: Workspace with roles: [] visible if user has content access
    describe('P3-016-T2: Workspace with empty roles array', () => {
        it('should be visible if user has content access', () => {
            const visible = wm.getVisibleWorkspaces(salesUser);

            // Selling workspace has roles: [] and Sales User can access Sales Order/Customer
            expect(visible.some(w => w.name === 'selling')).toBe(true);
        });

        it('should be hidden if user has no content access', () => {
            // Create a workspace with no accessible content for the user
            const customWm = new WorkspaceManager({
                permissionManager: pm,
                workspaces: [
                    {
                        name: 'empty-access',
                        label: 'Empty Access',
                        icon: 'icon-empty',
                        module: 'Test',
                        category: 'Modules',
                        sequence: 1,
                        roles: [],
                        shortcuts: [
                            { label: 'Employee', link_to: 'Employee', type: 'DocType' }
                        ],
                        links: [],
                        charts: [],
                        number_cards: [],
                        quick_lists: []
                    }
                ]
            });

            const visible = customWm.getVisibleWorkspaces(salesUser);
            expect(visible.some(w => w.name === 'empty-access')).toBe(false);
        });
    });

    // P3-016-T3: Workspace with roles: ['Admin'] only visible to Admin role
    describe('P3-016-T3: Workspace with specific role requirement', () => {
        it('should be visible only to users with the required role', () => {
            // HR workspace requires HR Manager role
            const salesVisible = wm.getVisibleWorkspaces(salesUser);
            const hrVisible = wm.getVisibleWorkspaces(hrManager);

            expect(salesVisible.some(w => w.name === 'hr')).toBe(false);

            // Need to update permission manager for HR manager
            const hrPm = createMockPermissionManager({
                user: 'hr@example.com',
                roles: ['HR Manager']
            });
            const hrWm = new WorkspaceManager({
                permissionManager: hrPm,
                workspaces: createSampleWorkspaces()
            });
            const hrManagerVisible = hrWm.getVisibleWorkspaces(hrManager);
            expect(hrManagerVisible.some(w => w.name === 'hr')).toBe(true);
        });
    });

    // P3-016-T4: Workspace with no accessible content hidden from sidebar
    describe('P3-016-T4: Workspace with no accessible content', () => {
        it('should be hidden from sidebar', () => {
            const visible = wm.getVisibleWorkspaces(salesUser);

            // Buying workspace has only Purchase Order which Sales User cannot access
            expect(visible.some(w => w.name === 'buying')).toBe(false);
        });
    });

    // P3-016-T5: Workspaces sorted by sequence
    describe('P3-016-T5: Workspaces sorted by sequence', () => {
        it('should return workspaces in sequence order', () => {
            const visible = wm.getVisibleWorkspaces(systemManager);

            for (let i = 1; i < visible.length; i++) {
                expect(visible[i].sequence).toBeGreaterThanOrEqual(visible[i - 1].sequence);
            }
        });
    });

    // P3-016-T6: Workspaces grouped by category
    describe('P3-016-T6: Workspaces grouped by category', () => {
        it('should group workspaces by category', () => {
            const grouped = wm.getWorkspacesGroupedByCategory(systemManager);

            expect(grouped.has('Modules')).toBe(true);
            expect(grouped.has('Administration')).toBe(true);

            const modules = grouped.get('Modules');
            expect(modules).toBeDefined();
            expect(modules!.length).toBeGreaterThan(0);
        });
    });

    // P3-016-T7: getWorkspaceForUser(name, user) returns filtered workspace content
    describe('P3-016-T7: getWorkspaceForUser(name, user)', () => {
        it('should return filtered workspace content', () => {
            const workspace = wm.getWorkspaceForUser('selling', salesUser);

            expect(workspace).not.toBeNull();
            expect(workspace!.name).toBe('selling');
            expect(workspace!.shortcuts.length).toBeGreaterThan(0);
            expect(workspace!.links.length).toBeGreaterThan(0);
        });

        it('should return null for inaccessible workspace', () => {
            const workspace = wm.getWorkspaceForUser('hr', salesUser);

            expect(workspace).toBeNull();
        });
    });

    // P3-016-T8: Shortcut with only_for role filtered by role
    describe('P3-016-T8: Shortcut with only_for role filtering', () => {
        it('should filter shortcuts by only_for roles', () => {
            const customWm = new WorkspaceManager({
                permissionManager: pm,
                workspaces: [{
                    name: 'test',
                    label: 'Test',
                    icon: 'icon-test',
                    module: 'Test',
                    category: 'Modules',
                    sequence: 1,
                    roles: [],
                    shortcuts: [
                        { label: 'All Users', link_to: 'Sales Order', type: 'DocType' },
                        { label: 'HR Only', link_to: 'Sales Order', type: 'DocType', only_for: ['HR Manager'] }
                    ],
                    links: [
                        { label: 'Sales Order', link_to: 'Sales Order', type: 'DocType' }
                    ],
                    charts: [],
                    number_cards: [],
                    quick_lists: []
                }]
            });

            const workspace = customWm.getWorkspaceForUser('test', salesUser);

            expect(workspace).not.toBeNull();
            expect(workspace!.shortcuts.some(s => s.label === 'All Users')).toBe(true);
            expect(workspace!.shortcuts.some(s => s.label === 'HR Only')).toBe(false);
        });
    });

    // P3-016-T9: Shortcut for DocType without permission hidden
    describe('P3-016-T9: Shortcut for unpermitted DocType', () => {
        it('should hide shortcuts for DocTypes user cannot access', () => {
            const workspace = wm.getWorkspaceForUser('selling', salesUser);

            // All shortcuts in selling should be accessible since Sales User has permission
            expect(workspace).not.toBeNull();

            // Create a workspace with a shortcut to Employee (no permission for Sales User)
            const customWm = new WorkspaceManager({
                permissionManager: pm,
                workspaces: [{
                    name: 'test',
                    label: 'Test',
                    icon: 'icon-test',
                    module: 'Test',
                    category: 'Modules',
                    sequence: 1,
                    roles: [],
                    shortcuts: [
                        { label: 'Accessible', link_to: 'Sales Order', type: 'DocType' },
                        { label: 'Not Accessible', link_to: 'Employee', type: 'DocType' }
                    ],
                    links: [
                        { label: 'Sales Order', link_to: 'Sales Order', type: 'DocType' }
                    ],
                    charts: [],
                    number_cards: [],
                    quick_lists: []
                }]
            });

            const testWorkspace = customWm.getWorkspaceForUser('test', salesUser);
            expect(testWorkspace!.shortcuts.some(s => s.label === 'Accessible')).toBe(true);
            expect(testWorkspace!.shortcuts.some(s => s.label === 'Not Accessible')).toBe(false);
        });
    });

    // P3-016-T10: Links filtered by permission
    describe('P3-016-T10: Links filtered by permission', () => {
        it('should filter links based on DocType permissions', () => {
            const customWm = new WorkspaceManager({
                permissionManager: pm,
                workspaces: [{
                    name: 'test',
                    label: 'Test',
                    icon: 'icon-test',
                    module: 'Test',
                    category: 'Modules',
                    sequence: 1,
                    roles: [],
                    shortcuts: [],
                    links: [
                        { label: 'Sales Order', link_to: 'Sales Order', type: 'DocType' },
                        { label: 'Employee', link_to: 'Employee', type: 'DocType' }
                    ],
                    charts: [{ chart_name: 'test', label: 'Test' }], // Keep workspace visible
                    number_cards: [],
                    quick_lists: []
                }]
            });

            const workspace = customWm.getWorkspaceForUser('test', salesUser);

            expect(workspace!.links.some(l => l.label === 'Sales Order')).toBe(true);
            expect(workspace!.links.some(l => l.label === 'Employee')).toBe(false);
        });
    });

    // P3-016-T11: Links grouped by link_group
    describe('P3-016-T11: Links grouped by link_group', () => {
        it('should group links by link_group', () => {
            const workspace = wm.getWorkspaceForUser('selling', salesUser);

            expect(workspace).not.toBeNull();
            expect(workspace!.grouped_links).toBeInstanceOf(Map);
            expect(workspace!.grouped_links.has('Transactions')).toBe(true);
            expect(workspace!.grouped_links.has('Masters')).toBe(true);
        });
    });

    // P3-016-T12: Link with only_for restriction hidden from other roles
    describe('P3-016-T12: Link with only_for restriction', () => {
        it('should hide links with only_for from other roles', () => {
            const customWm = new WorkspaceManager({
                permissionManager: pm,
                workspaces: [{
                    name: 'test',
                    label: 'Test',
                    icon: 'icon-test',
                    module: 'Test',
                    category: 'Modules',
                    sequence: 1,
                    roles: [],
                    shortcuts: [],
                    links: [
                        { label: 'All Users Link', link_to: 'Sales Order', type: 'DocType' },
                        { label: 'HR Only Link', link_to: 'Sales Order', type: 'DocType', only_for: ['HR Manager'] }
                    ],
                    charts: [],
                    number_cards: [],
                    quick_lists: []
                }]
            });

            const workspace = customWm.getWorkspaceForUser('test', salesUser);

            expect(workspace!.links.some(l => l.label === 'All Users Link')).toBe(true);
            expect(workspace!.links.some(l => l.label === 'HR Only Link')).toBe(false);
        });
    });

    // P3-016-T13: getShortcutCount respects user permissions
    describe('P3-016-T13: getShortcutCount respects permissions', () => {
        it('should return count when user has permission', async () => {
            const mockGetCount = vi.fn().mockResolvedValue(10);
            const customWm = new WorkspaceManager({
                permissionManager: pm,
                workspaces: createSampleWorkspaces(),
                getDocumentCount: mockGetCount
            });

            const shortcut: WorkspaceShortcut = {
                label: 'Sales Orders',
                link_to: 'Sales Order',
                type: 'DocType'
            };

            const count = await customWm.getShortcutCount(shortcut, salesUser);

            expect(count).toBe(10);
            expect(mockGetCount).toHaveBeenCalledWith('Sales Order', undefined, true);
        });

        it('should return 0 when user has no permission', async () => {
            const mockGetCount = vi.fn().mockResolvedValue(10);
            const customWm = new WorkspaceManager({
                permissionManager: pm,
                workspaces: createSampleWorkspaces(),
                getDocumentCount: mockGetCount
            });

            const shortcut: WorkspaceShortcut = {
                label: 'Employees',
                link_to: 'Employee',
                type: 'DocType'
            };

            const count = await customWm.getShortcutCount(shortcut, salesUser);

            expect(count).toBe(0);
            expect(mockGetCount).not.toHaveBeenCalled();
        });
    });

    // P3-016-T14: Shortcut count with stats_filter applies filter
    describe('P3-016-T14: Shortcut count with stats_filter', () => {
        it('should apply stats_filter to count query', async () => {
            const mockGetCount = vi.fn().mockResolvedValue(5);
            const customWm = new WorkspaceManager({
                permissionManager: pm,
                workspaces: createSampleWorkspaces(),
                getDocumentCount: mockGetCount
            });

            const shortcut: WorkspaceShortcut = {
                label: 'Draft Sales Orders',
                link_to: 'Sales Order',
                type: 'DocType',
                stats_filter: { status: 'Draft' }
            };

            await customWm.getShortcutCount(shortcut, salesUser);

            expect(mockGetCount).toHaveBeenCalledWith(
                'Sales Order',
                { status: 'Draft' },
                true
            );
        });
    });

    // P3-016-T15: Shortcut count with User Permissions only counts permitted docs
    describe('P3-016-T15: Shortcut count with User Permissions', () => {
        it('should pass userPermissions flag to count function', async () => {
            const mockGetCount = vi.fn().mockResolvedValue(3);
            const customWm = new WorkspaceManager({
                permissionManager: pm,
                workspaces: createSampleWorkspaces(),
                getDocumentCount: mockGetCount
            });

            const shortcut: WorkspaceShortcut = {
                label: 'Sales Orders',
                link_to: 'Sales Order',
                type: 'DocType'
            };

            await customWm.getShortcutCount(shortcut, salesUser);

            // Third parameter (userPermissions) should be true for non-System Manager
            expect(mockGetCount).toHaveBeenCalledWith('Sales Order', undefined, true);
        });

        it('should not apply user permissions for System Manager', async () => {
            const smPm = createMockPermissionManager({
                user: 'admin@example.com',
                roles: ['System Manager']
            });
            const mockGetCount = vi.fn().mockResolvedValue(100);
            const customWm = new WorkspaceManager({
                permissionManager: smPm,
                workspaces: createSampleWorkspaces(),
                getDocumentCount: mockGetCount
            });

            const shortcut: WorkspaceShortcut = {
                label: 'Sales Orders',
                link_to: 'Sales Order',
                type: 'DocType'
            };

            await customWm.getShortcutCount(shortcut, systemManager);

            // Third parameter should be false for System Manager
            expect(mockGetCount).toHaveBeenCalledWith('Sales Order', undefined, false);
        });
    });

    // P3-016-T16: getDefaultWorkspace returns user's preferred workspace
    describe('P3-016-T16: getDefaultWorkspace', () => {
        it('should return user preference if set', () => {
            const mockGetPref = vi.fn().mockReturnValue('selling');
            const customWm = new WorkspaceManager({
                permissionManager: pm,
                workspaces: createSampleWorkspaces(),
                getUserPreference: mockGetPref
            });

            const defaultWs = customWm.getDefaultWorkspace(salesUser);

            expect(defaultWs).toBe('selling');
            expect(mockGetPref).toHaveBeenCalledWith('sales@example.com', 'default_workspace');
        });

        it('should return first visible workspace if no preference', () => {
            const mockGetPref = vi.fn().mockReturnValue(null);
            const customWm = new WorkspaceManager({
                permissionManager: pm,
                workspaces: createSampleWorkspaces(),
                getUserPreference: mockGetPref
            });

            const defaultWs = customWm.getDefaultWorkspace(salesUser);

            expect(defaultWs).toBe('selling');
        });
    });

    // P3-016-T17: setDefaultWorkspace updates user preference
    describe('P3-016-T17: setDefaultWorkspace', () => {
        it('should update user preference', () => {
            const mockSetPref = vi.fn();
            const customWm = new WorkspaceManager({
                permissionManager: pm,
                workspaces: createSampleWorkspaces(),
                setUserPreference: mockSetPref
            });

            customWm.setDefaultWorkspace(salesUser, 'selling');

            expect(mockSetPref).toHaveBeenCalledWith('sales@example.com', 'default_workspace', 'selling');
        });

        it('should throw error for non-existent workspace', () => {
            const mockSetPref = vi.fn();
            const customWm = new WorkspaceManager({
                permissionManager: pm,
                workspaces: createSampleWorkspaces(),
                setUserPreference: mockSetPref
            });

            expect(() => {
                customWm.setDefaultWorkspace(salesUser, 'nonexistent');
            }).toThrow("Workspace 'nonexistent' not found");
        });

        it('should throw error if user cannot access workspace', () => {
            const mockSetPref = vi.fn();
            const customWm = new WorkspaceManager({
                permissionManager: pm,
                workspaces: createSampleWorkspaces(),
                setUserPreference: mockSetPref
            });

            expect(() => {
                customWm.setDefaultWorkspace(salesUser, 'hr');
            }).toThrow("User does not have access to workspace 'hr'");
        });
    });

    // P3-016-T22: getRecentDocuments returns user's recent docs
    describe('P3-016-T22: getRecentDocuments', () => {
        it('should return recent documents for permitted DocType', () => {
            const mockRecent: RecentDocument[] = [
                { name: 'SO-001', doctype: 'Sales Order', route: '/app/sales-order/SO-001', last_accessed: '2024-01-01' },
                { name: 'SO-002', doctype: 'Sales Order', route: '/app/sales-order/SO-002', last_accessed: '2024-01-02' }
            ];
            const mockGetRecent = vi.fn().mockReturnValue(mockRecent);
            const customWm = new WorkspaceManager({
                permissionManager: pm,
                workspaces: createSampleWorkspaces(),
                getRecentDocuments: mockGetRecent
            });

            const recent = customWm.getRecentDocuments(salesUser, 'Sales Order', 10);

            expect(recent).toEqual(mockRecent);
            expect(mockGetRecent).toHaveBeenCalledWith('sales@example.com', 'Sales Order', 10);
        });

        it('should return empty array for unpermitted DocType', () => {
            const mockGetRecent = vi.fn();
            const customWm = new WorkspaceManager({
                permissionManager: pm,
                workspaces: createSampleWorkspaces(),
                getRecentDocuments: mockGetRecent
            });

            const recent = customWm.getRecentDocuments(salesUser, 'Employee', 10);

            expect(recent).toEqual([]);
            expect(mockGetRecent).not.toHaveBeenCalled();
        });
    });

    // P3-016-T23: registerWorkspace adds new workspace to system
    describe('P3-016-T23: registerWorkspace', () => {
        it('should add new workspace to system', () => {
            const newWorkspace: Workspace = {
                name: 'new-workspace',
                label: 'New Workspace',
                icon: 'icon-new',
                module: 'New',
                category: 'Modules',
                sequence: 100,
                roles: [],
                shortcuts: [{ label: 'Test', link_to: 'Sales Order', type: 'DocType' }],
                links: [],
                charts: [],
                number_cards: [],
                quick_lists: []
            };

            wm.registerWorkspace(newWorkspace);

            const workspace = wm.getWorkspace('new-workspace');
            expect(workspace).not.toBeNull();
            expect(workspace!.label).toBe('New Workspace');

            const visible = wm.getVisibleWorkspaces(salesUser);
            expect(visible.some(w => w.name === 'new-workspace')).toBe(true);
        });
    });

    // P3-016-T24: System Manager sees all workspaces
    describe('P3-016-T24: System Manager bypass', () => {
        it('should show all workspaces to System Manager', () => {
            const smPm = createMockPermissionManager({
                user: 'admin@example.com',
                roles: ['System Manager']
            });
            const smWm = new WorkspaceManager({
                permissionManager: smPm,
                workspaces: createSampleWorkspaces()
            });

            const visible = smWm.getVisibleWorkspaces(systemManager);

            // System Manager should see all 4 workspaces
            expect(visible.length).toBe(4);
            expect(visible.some(w => w.name === 'selling')).toBe(true);
            expect(visible.some(w => w.name === 'buying')).toBe(true);
            expect(visible.some(w => w.name === 'hr')).toBe(true);
            expect(visible.some(w => w.name === 'administration')).toBe(true);
        });

        it('should return unfiltered workspace content for System Manager', () => {
            const smPm = createMockPermissionManager({
                user: 'admin@example.com',
                roles: ['System Manager']
            });
            const smWm = new WorkspaceManager({
                permissionManager: smPm,
                workspaces: [{
                    name: 'test',
                    label: 'Test',
                    icon: 'icon-test',
                    module: 'Test',
                    category: 'Modules',
                    sequence: 1,
                    roles: ['HR Manager'],
                    shortcuts: [
                        { label: 'HR Only', link_to: 'Employee', type: 'DocType', only_for: ['HR Manager'] }
                    ],
                    links: [
                        { label: 'Employee', link_to: 'Employee', type: 'DocType' }
                    ],
                    charts: [],
                    number_cards: [],
                    quick_lists: []
                }]
            });

            const workspace = smWm.getWorkspaceForUser('test', systemManager);

            expect(workspace).not.toBeNull();
            expect(workspace!.shortcuts.length).toBe(1);
            expect(workspace!.links.length).toBe(1);
        });
    });
});
