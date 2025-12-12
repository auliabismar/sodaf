/**
 * Sidebar Manager Tests
 * P3-016: Tests for SidebarManager permission-aware navigation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SidebarManager, type SidebarManagerConfig, type SearchProvider, type DocTypeInfo } from '../sidebar/sidebar-manager';
import { WorkspaceManager, type WorkspaceManagerConfig, type UserContext } from '../workspace/workspace-manager';
import { PermissionManager, type PermissionManagerConfig } from '../../permissions';
import type { Workspace } from '../workspace/types';
import type { SearchResult } from '../sidebar/types';

describe('P3-016: Sidebar Manager', () => {
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
                    { label: 'New Sales Order', link_to: 'Sales Order', type: 'DocType' }
                ],
                links: [
                    { label: 'Sales Order', link_to: 'Sales Order', type: 'DocType', link_group: 'Transactions' }
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
                sequence: 2,
                roles: ['HR Manager'],
                shortcuts: [],
                links: [
                    { label: 'Employee', link_to: 'Employee', type: 'DocType' }
                ],
                charts: [],
                number_cards: [],
                quick_lists: []
            },
            {
                name: 'settings',
                label: 'Settings',
                icon: 'icon-settings',
                module: 'Core',
                category: 'Administration',
                sequence: 10,
                roles: [],
                shortcuts: [],
                links: [
                    { label: 'Settings Page', link_to: '/settings', type: 'Page' }
                ],
                charts: [],
                number_cards: [],
                quick_lists: []
            }
        ];
    }

    // Sample doctype info
    function createSampleDocTypes(): DocTypeInfo[] {
        return [
            { name: 'Sales Order', label: 'Sales Order', icon: 'icon-so' },
            { name: 'Customer', label: 'Customer', icon: 'icon-customer' },
            { name: 'Item', label: 'Item', icon: 'icon-item' },
            { name: 'Purchase Order', label: 'Purchase Order', icon: 'icon-po' },
            { name: 'Employee', label: 'Employee', icon: 'icon-employee' }
        ];
    }

    let pm: PermissionManager;
    let wm: WorkspaceManager;
    let sm: SidebarManager;
    let salesUser: UserContext;
    let systemManager: UserContext;

    beforeEach(() => {
        pm = createMockPermissionManager();
        wm = new WorkspaceManager({
            permissionManager: pm,
            workspaces: createSampleWorkspaces()
        });
        sm = new SidebarManager({
            permissionManager: pm,
            workspaceManager: wm,
            getDocTypes: createSampleDocTypes
        });

        salesUser = { name: 'sales@example.com', roles: ['Sales User'] };
        systemManager = { name: 'admin@example.com', roles: ['System Manager'] };
    });

    // P3-016-T18: globalSearch(query, user) respects permissions
    describe('P3-016-T18: globalSearch respects permissions', () => {
        it('should filter results by DocType permissions', async () => {
            const mockResults: SearchResult[] = [
                { doctype: 'Sales Order', name: 'SO-001', content: 'Test order', route: '/app/sales-order/SO-001', score: 0.9 },
                { doctype: 'Employee', name: 'EMP-001', content: 'Test employee', route: '/app/employee/EMP-001', score: 0.8 }
            ];

            const mockSearchProvider: SearchProvider = {
                search: vi.fn().mockResolvedValue(mockResults)
            };

            const smWithSearch = new SidebarManager({
                permissionManager: pm,
                workspaceManager: wm,
                searchProvider: mockSearchProvider
            });

            const results = await smWithSearch.globalSearch('test', salesUser);

            // Sales User should see Sales Order but not Employee
            expect(results.length).toBe(1);
            expect(results[0].doctype).toBe('Sales Order');
        });

        it('should return all results for System Manager', async () => {
            const mockResults: SearchResult[] = [
                { doctype: 'Sales Order', name: 'SO-001', content: 'Test order', route: '/app/sales-order/SO-001', score: 0.9 },
                { doctype: 'Employee', name: 'EMP-001', content: 'Test employee', route: '/app/employee/EMP-001', score: 0.8 }
            ];

            const mockSearchProvider: SearchProvider = {
                search: vi.fn().mockResolvedValue(mockResults)
            };

            const smPm = createMockPermissionManager({
                user: 'admin@example.com',
                roles: ['System Manager']
            });

            const smWithSearch = new SidebarManager({
                permissionManager: smPm,
                workspaceManager: wm,
                searchProvider: mockSearchProvider
            });

            const results = await smWithSearch.globalSearch('test', systemManager);

            expect(results.length).toBe(2);
        });

        it('should return empty array for empty query', async () => {
            const mockSearchProvider: SearchProvider = {
                search: vi.fn().mockResolvedValue([])
            };

            const smWithSearch = new SidebarManager({
                permissionManager: pm,
                workspaceManager: wm,
                searchProvider: mockSearchProvider
            });

            const results = await smWithSearch.globalSearch('', salesUser);

            expect(results).toEqual([]);
            expect(mockSearchProvider.search).not.toHaveBeenCalled();
        });
    });

    // P3-016-T19: awesomebar(query, user) actions filtered by permission
    describe('P3-016-T19: awesomebar actions filtered by permission', () => {
        it('should filter DocType actions by permission', () => {
            const results = sm.awesomebar('sales', salesUser);

            // Should find Sales Order (has permission)
            const salesOrderResults = results.filter(r => r.value.includes('Sales Order'));
            expect(salesOrderResults.length).toBeGreaterThan(0);
        });

        it('should not include DocTypes user cannot access', () => {
            const results = sm.awesomebar('employee', salesUser);

            // Should not find Employee (no permission)
            const employeeResults = results.filter(r => r.value.includes('Employee'));
            expect(employeeResults.length).toBe(0);
        });
    });

    // P3-016-T20: Awesomebar shows "New X" if user has create permission
    describe('P3-016-T20: Awesomebar shows "New X" for create permission', () => {
        it('should show "New X" when user has create permission', () => {
            const results = sm.awesomebar('sales order', salesUser);

            // Sales User has create permission for Sales Order
            const newAction = results.find(r => r.label === 'New Sales Order');
            expect(newAction).toBeDefined();
            expect(newAction!.type).toBe('Action');
            expect(newAction!.route).toContain('/new');
        });

        it('should not show "New X" when user lacks create permission', () => {
            const results = sm.awesomebar('customer', salesUser);

            // Sales User does NOT have create permission for Customer
            const newAction = results.find(r => r.label === 'New Customer');
            expect(newAction).toBeUndefined();
        });
    });

    // P3-016-T21: Awesomebar shows "X List" if user has read permission
    describe('P3-016-T21: Awesomebar shows "X List" for read permission', () => {
        it('should show "X List" when user has read permission', () => {
            const results = sm.awesomebar('customer', salesUser);

            // Sales User has read permission for Customer
            const listAction = results.find(r => r.label === 'Customer List');
            expect(listAction).toBeDefined();
            expect(listAction!.type).toBe('DocType');
        });

        it('should not show "X List" when user lacks read permission', () => {
            const results = sm.awesomebar('purchase', salesUser);

            // Sales User does NOT have read permission for Purchase Order
            const listAction = results.find(r => r.label === 'Purchase Order List');
            expect(listAction).toBeUndefined();
        });
    });

    // Test awesomebar with reports
    describe('Awesomebar with reports', () => {
        it('should include reports that user can access', () => {
            const smWithReports = new SidebarManager({
                permissionManager: pm,
                workspaceManager: wm,
                getDocTypes: createSampleDocTypes,
                getReports: () => [
                    { name: 'Sales Analytics', label: 'Sales Analytics', ref_doctype: 'Sales Order' },
                    { name: 'Employee Report', label: 'Employee Report', ref_doctype: 'Employee' }
                ]
            });

            const results = smWithReports.awesomebar('analytics', salesUser);

            const salesReport = results.find(r => r.label === 'Sales Analytics');
            expect(salesReport).toBeDefined();
            expect(salesReport!.type).toBe('Report');
        });

        it('should filter reports by ref_doctype permission', () => {
            const smWithReports = new SidebarManager({
                permissionManager: pm,
                workspaceManager: wm,
                getDocTypes: createSampleDocTypes,
                getReports: () => [
                    { name: 'Employee Report', label: 'Employee Report', ref_doctype: 'Employee' }
                ]
            });

            const results = smWithReports.awesomebar('employee', salesUser);

            // Sales User cannot access Employee, so report should be hidden
            const employeeReport = results.find(r => r.label === 'Employee Report');
            expect(employeeReport).toBeUndefined();
        });
    });

    // Test awesomebar with pages
    describe('Awesomebar with pages', () => {
        it('should include pages in results', () => {
            const smWithPages = new SidebarManager({
                permissionManager: pm,
                workspaceManager: wm,
                getDocTypes: createSampleDocTypes,
                getPages: () => [
                    { name: 'setup-wizard', label: 'Setup Wizard' },
                    { name: 'dashboard', label: 'Dashboard' }
                ]
            });

            const results = smWithPages.awesomebar('setup', salesUser);

            const setupPage = results.find(r => r.label === 'Setup Wizard');
            expect(setupPage).toBeDefined();
            expect(setupPage!.type).toBe('Page');
        });
    });

    // Test awesomebar with workspaces
    describe('Awesomebar with workspaces', () => {
        it('should include visible workspaces in results', () => {
            const results = sm.awesomebar('selling', salesUser);

            const workspaceResult = results.find(r => r.type === 'Workspace' && r.label === 'Selling');
            expect(workspaceResult).toBeDefined();
        });

        it('should not include hidden workspaces', () => {
            const results = sm.awesomebar('human resources', salesUser);

            // HR workspace requires HR Manager role
            const hrWorkspace = results.find(r => r.type === 'Workspace' && r.label === 'Human Resources');
            expect(hrWorkspace).toBeUndefined();
        });
    });

    // Test sidebar sections
    describe('getSidebarSections', () => {
        it('should return sections from visible workspaces', () => {
            const sections = sm.getSidebarSections(salesUser);

            expect(sections.length).toBeGreaterThan(0);

            // Find Modules section
            const modulesSection = sections.find(s => s.title === 'Modules');
            expect(modulesSection).toBeDefined();
            expect(modulesSection!.items.some(i => i.name === 'selling')).toBe(true);
        });

        it('should respect category ordering', () => {
            const smPm = createMockPermissionManager({
                user: 'admin@example.com',
                roles: ['System Manager']
            });
            const smWm = new WorkspaceManager({
                permissionManager: smPm,
                workspaces: createSampleWorkspaces()
            });
            const smSm = new SidebarManager({
                permissionManager: smPm,
                workspaceManager: smWm
            });

            const sections = smSm.getSidebarSections(systemManager);

            // Modules should come before Administration
            const modulesIndex = sections.findIndex(s => s.title === 'Modules');
            const adminIndex = sections.findIndex(s => s.title === 'Administration');

            if (modulesIndex !== -1 && adminIndex !== -1) {
                expect(modulesIndex).toBeLessThan(adminIndex);
            }
        });

        it('should include route in sidebar items', () => {
            const sections = sm.getSidebarSections(salesUser);

            const modulesSection = sections.find(s => s.title === 'Modules');
            if (modulesSection && modulesSection.items.length > 0) {
                expect(modulesSection.items[0].route).toBeDefined();
                expect(modulesSection.items[0].route).toContain('/app/');
            }
        });
    });

    // Test System Manager bypass
    describe('System Manager sees all actions', () => {
        it('should show all DocType actions for System Manager', () => {
            const smPm = createMockPermissionManager({
                user: 'admin@example.com',
                roles: ['System Manager']
            });
            const smSm = new SidebarManager({
                permissionManager: smPm,
                workspaceManager: wm,
                getDocTypes: createSampleDocTypes
            });

            const results = smSm.awesomebar('employee', systemManager);

            // System Manager should see Employee list and New Employee
            const listAction = results.find(r => r.label === 'Employee List');
            const newAction = results.find(r => r.label === 'New Employee');

            expect(listAction).toBeDefined();
            expect(newAction).toBeDefined();
        });
    });
});
