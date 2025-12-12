/**
 * P3-015: Workspace Types and Interfaces Tests
 * 
 * Test Plan:
 * P3-015-T1: Workspace interface compiles with name, label, icon, module, category, sequence, roles
 * P3-015-T2: Workspace has content arrays - shortcuts, links, charts, number_cards, quick_lists
 * P3-015-T3: WorkspaceShortcut interface - label, link_to, type, only_for, stats_filter
 * P3-015-T4: WorkspaceLink interface - label, link_to, type, link_group, only_for
 * P3-015-T5: WorkspaceChart interface - chart_name, label, width
 * P3-015-T6: WorkspaceNumberCard interface - label, number_card_name
 * P3-015-T7: FilteredWorkspace interface - Workspace with grouped_links map
 * P3-015-T8: SidebarItem interface - name, label, icon, category, sequence
 * P3-015-T9: SidebarCategory type - 'Modules', 'Domains', 'Places', 'Administration'
 * P3-015-T10: AwesomebarResult interface - label, value, type, route, description
 * P3-015-T11: SearchResult interface - doctype, name, content, route, score
 */

import { describe, it, expect } from 'vitest';
import type {
    Workspace,
    WorkspaceShortcut,
    WorkspaceLink,
    WorkspaceChart,
    WorkspaceNumberCard,
    FilteredWorkspace,
    GroupedLinksMap,
    WorkspaceQuickList
} from '../workspace/types';
import type {
    SidebarItem,
    SidebarCategory,
    AwesomebarResult,
    SearchResult
} from '../sidebar/types';

describe('P3-015: Workspace Types and Interfaces', () => {
    // P3-015-T1: Workspace interface compiles with required properties
    describe('P3-015-T1: Workspace interface', () => {
        it('should have name, label, icon, module, category, sequence, roles properties', () => {
            const workspace: Workspace = {
                name: 'test-workspace',
                label: 'Test Workspace',
                icon: 'icon-test',
                module: 'Test Module',
                category: 'Modules',
                sequence: 1,
                roles: ['System Manager', 'Administrator'],
                shortcuts: [],
                links: [],
                charts: [],
                number_cards: [],
                quick_lists: []
            };

            expect(workspace.name).toBe('test-workspace');
            expect(workspace.label).toBe('Test Workspace');
            expect(workspace.icon).toBe('icon-test');
            expect(workspace.module).toBe('Test Module');
            expect(workspace.category).toBe('Modules');
            expect(workspace.sequence).toBe(1);
            expect(workspace.roles).toEqual(['System Manager', 'Administrator']);
        });
    });

    // P3-015-T2: Workspace has content arrays
    describe('P3-015-T2: Workspace content arrays', () => {
        it('should have shortcuts, links, charts, number_cards, quick_lists arrays', () => {
            const shortcut: WorkspaceShortcut = {
                label: 'New Item',
                link_to: 'Item',
                type: 'DocType'
            };

            const link: WorkspaceLink = {
                label: 'Item List',
                link_to: 'Item',
                type: 'DocType'
            };

            const chart: WorkspaceChart = {
                chart_name: 'Sales Chart',
                label: 'Sales Overview'
            };

            const numberCard: WorkspaceNumberCard = {
                label: 'Total Items',
                number_card_name: 'item_count'
            };

            const quickList: WorkspaceQuickList = {
                label: 'Recent Items',
                document_type: 'Item'
            };

            const workspace: Workspace = {
                name: 'test-workspace',
                label: 'Test Workspace',
                icon: 'icon-test',
                module: 'Test Module',
                category: 'Modules',
                sequence: 1,
                roles: [],
                shortcuts: [shortcut],
                links: [link],
                charts: [chart],
                number_cards: [numberCard],
                quick_lists: [quickList]
            };

            expect(workspace.shortcuts).toHaveLength(1);
            expect(workspace.links).toHaveLength(1);
            expect(workspace.charts).toHaveLength(1);
            expect(workspace.number_cards).toHaveLength(1);
            expect(workspace.quick_lists).toHaveLength(1);
        });
    });

    // P3-015-T3: WorkspaceShortcut interface
    describe('P3-015-T3: WorkspaceShortcut interface', () => {
        it('should have label, link_to, type, only_for, stats_filter properties', () => {
            const shortcut: WorkspaceShortcut = {
                label: 'New Sales Order',
                link_to: 'Sales Order',
                type: 'DocType',
                only_for: ['Sales Manager'],
                stats_filter: { status: 'Draft' }
            };

            expect(shortcut.label).toBe('New Sales Order');
            expect(shortcut.link_to).toBe('Sales Order');
            expect(shortcut.type).toBe('DocType');
            expect(shortcut.only_for).toEqual(['Sales Manager']);
            expect(shortcut.stats_filter).toEqual({ status: 'Draft' });
        });

        it('should allow optional only_for and stats_filter', () => {
            const shortcut: WorkspaceShortcut = {
                label: 'New Item',
                link_to: 'Item',
                type: 'DocType'
            };

            expect(shortcut.only_for).toBeUndefined();
            expect(shortcut.stats_filter).toBeUndefined();
        });
    });

    // P3-015-T4: WorkspaceLink interface
    describe('P3-015-T4: WorkspaceLink interface', () => {
        it('should have label, link_to, type, link_group, only_for properties', () => {
            const link: WorkspaceLink = {
                label: 'Item List',
                link_to: 'Item',
                type: 'DocType',
                link_group: 'Masters',
                only_for: ['Item Manager']
            };

            expect(link.label).toBe('Item List');
            expect(link.link_to).toBe('Item');
            expect(link.type).toBe('DocType');
            expect(link.link_group).toBe('Masters');
            expect(link.only_for).toEqual(['Item Manager']);
        });

        it('should allow optional link_group and only_for', () => {
            const link: WorkspaceLink = {
                label: 'Dashboard',
                link_to: '/dashboard',
                type: 'Page'
            };

            expect(link.link_group).toBeUndefined();
            expect(link.only_for).toBeUndefined();
        });
    });

    // P3-015-T5: WorkspaceChart interface
    describe('P3-015-T5: WorkspaceChart interface', () => {
        it('should have chart_name, label, width properties', () => {
            const chart: WorkspaceChart = {
                chart_name: 'monthly_sales',
                label: 'Monthly Sales',
                width: 'Full'
            };

            expect(chart.chart_name).toBe('monthly_sales');
            expect(chart.label).toBe('Monthly Sales');
            expect(chart.width).toBe('Full');
        });

        it('should allow optional width', () => {
            const chart: WorkspaceChart = {
                chart_name: 'daily_orders',
                label: 'Daily Orders'
            };

            expect(chart.width).toBeUndefined();
        });
    });

    // P3-015-T6: WorkspaceNumberCard interface
    describe('P3-015-T6: WorkspaceNumberCard interface', () => {
        it('should have label, number_card_name properties', () => {
            const numberCard: WorkspaceNumberCard = {
                label: 'Total Revenue',
                number_card_name: 'total_revenue_card'
            };

            expect(numberCard.label).toBe('Total Revenue');
            expect(numberCard.number_card_name).toBe('total_revenue_card');
        });
    });

    // P3-015-T7: FilteredWorkspace interface
    describe('P3-015-T7: FilteredWorkspace interface', () => {
        it('should extend Workspace with grouped_links map', () => {
            const groupedLinks: GroupedLinksMap = new Map();
            groupedLinks.set('Masters', [
                { label: 'Item', link_to: 'Item', type: 'DocType', link_group: 'Masters' }
            ]);
            groupedLinks.set('Reports', [
                { label: 'Sales Report', link_to: 'Sales Report', type: 'Report', link_group: 'Reports' }
            ]);

            const filteredWorkspace: FilteredWorkspace = {
                name: 'filtered-workspace',
                label: 'Filtered Workspace',
                icon: 'icon-filter',
                module: 'Test Module',
                category: 'Modules',
                sequence: 1,
                roles: ['Administrator'],
                shortcuts: [],
                links: [
                    { label: 'Item', link_to: 'Item', type: 'DocType', link_group: 'Masters' },
                    { label: 'Sales Report', link_to: 'Sales Report', type: 'Report', link_group: 'Reports' }
                ],
                charts: [],
                number_cards: [],
                quick_lists: [],
                grouped_links: groupedLinks
            };

            expect(filteredWorkspace.grouped_links).toBeInstanceOf(Map);
            expect(filteredWorkspace.grouped_links.get('Masters')).toHaveLength(1);
            expect(filteredWorkspace.grouped_links.get('Reports')).toHaveLength(1);
            expect(filteredWorkspace.links).toHaveLength(2);
        });
    });

    // P3-015-T8: SidebarItem interface
    describe('P3-015-T8: SidebarItem interface', () => {
        it('should have name, label, icon, category, sequence properties', () => {
            const sidebarItem: SidebarItem = {
                name: 'selling',
                label: 'Selling',
                icon: 'icon-selling',
                category: 'Modules',
                sequence: 1
            };

            expect(sidebarItem.name).toBe('selling');
            expect(sidebarItem.label).toBe('Selling');
            expect(sidebarItem.icon).toBe('icon-selling');
            expect(sidebarItem.category).toBe('Modules');
            expect(sidebarItem.sequence).toBe(1);
        });

        it('should allow optional route, is_active, and children', () => {
            const sidebarItem: SidebarItem = {
                name: 'home',
                label: 'Home',
                icon: 'icon-home',
                category: 'Places',
                sequence: 0,
                route: '/home',
                is_active: true,
                children: [
                    {
                        name: 'dashboard',
                        label: 'Dashboard',
                        icon: 'icon-dashboard',
                        category: 'Places',
                        sequence: 1
                    }
                ]
            };

            expect(sidebarItem.route).toBe('/home');
            expect(sidebarItem.is_active).toBe(true);
            expect(sidebarItem.children).toHaveLength(1);
        });
    });

    // P3-015-T9: SidebarCategory type
    describe('P3-015-T9: SidebarCategory type', () => {
        it('should accept Modules, Domains, Places, Administration values', () => {
            const modules: SidebarCategory = 'Modules';
            const domains: SidebarCategory = 'Domains';
            const places: SidebarCategory = 'Places';
            const admin: SidebarCategory = 'Administration';

            expect(modules).toBe('Modules');
            expect(domains).toBe('Domains');
            expect(places).toBe('Places');
            expect(admin).toBe('Administration');
        });
    });

    // P3-015-T10: AwesomebarResult interface
    describe('P3-015-T10: AwesomebarResult interface', () => {
        it('should have label, value, type, route, description properties', () => {
            const result: AwesomebarResult = {
                label: 'Sales Order',
                value: 'Sales Order',
                type: 'DocType',
                route: '/app/sales-order',
                description: 'Create and manage sales orders'
            };

            expect(result.label).toBe('Sales Order');
            expect(result.value).toBe('Sales Order');
            expect(result.type).toBe('DocType');
            expect(result.route).toBe('/app/sales-order');
            expect(result.description).toBe('Create and manage sales orders');
        });

        it('should allow optional description, icon, and shortcut', () => {
            const result: AwesomebarResult = {
                label: 'New Item',
                value: 'new-item',
                type: 'Action',
                route: '/app/item/new',
                icon: 'icon-plus',
                shortcut: 'Ctrl+N'
            };

            expect(result.icon).toBe('icon-plus');
            expect(result.shortcut).toBe('Ctrl+N');
        });
    });

    // P3-015-T11: SearchResult interface
    describe('P3-015-T11: SearchResult interface', () => {
        it('should have doctype, name, content, route, score properties', () => {
            const searchResult: SearchResult = {
                doctype: 'Item',
                name: 'ITEM-001',
                content: 'Laptop Computer - High performance laptop',
                route: '/app/item/ITEM-001',
                score: 0.95
            };

            expect(searchResult.doctype).toBe('Item');
            expect(searchResult.name).toBe('ITEM-001');
            expect(searchResult.content).toBe('Laptop Computer - High performance laptop');
            expect(searchResult.route).toBe('/app/item/ITEM-001');
            expect(searchResult.score).toBe(0.95);
        });

        it('should allow optional metadata', () => {
            const searchResult: SearchResult = {
                doctype: 'Sales Order',
                name: 'SO-001',
                content: 'Sales order for customer ABC',
                route: '/app/sales-order/SO-001',
                score: 0.88,
                metadata: {
                    customer: 'ABC Corp',
                    status: 'Submitted'
                }
            };

            expect(searchResult.metadata).toEqual({
                customer: 'ABC Corp',
                status: 'Submitted'
            });
        });
    });
});
