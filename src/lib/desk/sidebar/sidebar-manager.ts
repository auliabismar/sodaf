/**
 * Sidebar Manager
 * 
 * P3-016: Implement SidebarManager for permission-aware sidebar navigation.
 * Provides search functionality with permission filtering.
 */

import type { PermissionManager } from '../../permissions';
import type {
    SidebarSection,
    SidebarItem,
    SidebarCategory,
    AwesomebarResult,
    SearchResult
} from './types';
import type { WorkspaceManager, UserContext } from '../workspace/workspace-manager';

/**
 * Search provider interface for pluggable search backends
 */
export interface SearchProvider {
    /** Full-text search function */
    search(query: string, doctypes?: string[]): Promise<SearchResult[]>;
}

/**
 * DocType metadata for awesomebar results
 */
export interface DocTypeInfo {
    /** DocType name */
    name: string;
    /** Display label */
    label?: string;
    /** Icon */
    icon?: string;
    /** Description */
    description?: string;
}

/**
 * Configuration for SidebarManager
 */
export interface SidebarManagerConfig {
    /** Permission manager instance */
    permissionManager: PermissionManager;
    /** Workspace manager instance */
    workspaceManager: WorkspaceManager;
    /** Search provider for global search */
    searchProvider?: SearchProvider;
    /** Function to get all DocTypes */
    getDocTypes?: () => DocTypeInfo[];
    /** Function to get all reports */
    getReports?: () => Array<{ name: string; label?: string; ref_doctype?: string }>;
    /** Function to get all pages */
    getPages?: () => Array<{ name: string; label?: string }>;
}

/**
 * SidebarManager class for permission-aware sidebar navigation
 * 
 * Provides methods for:
 * - Global search with permission filtering
 * - Awesomebar results (quick actions, doctypes, reports)
 * - Sidebar sections from workspaces
 */
export class SidebarManager {
    private permissionManager: PermissionManager;
    private workspaceManager: WorkspaceManager;
    private searchProvider?: SearchProvider;
    private getDocTypes?: SidebarManagerConfig['getDocTypes'];
    private getReports?: SidebarManagerConfig['getReports'];
    private getPages?: SidebarManagerConfig['getPages'];

    constructor(config: SidebarManagerConfig) {
        this.permissionManager = config.permissionManager;
        this.workspaceManager = config.workspaceManager;
        this.searchProvider = config.searchProvider;
        this.getDocTypes = config.getDocTypes;
        this.getReports = config.getReports;
        this.getPages = config.getPages;
    }

    /**
     * Check if user has System Manager role
     */
    private isSystemManager(user: UserContext): boolean {
        return user.roles.includes('System Manager');
    }

    /**
     * Global search with permission filtering
     * P3-016-T18: Search respects permissions
     */
    async globalSearch(query: string, user: UserContext): Promise<SearchResult[]> {
        if (!this.searchProvider || !query.trim()) {
            return [];
        }

        // Get all search results
        const results = await this.searchProvider.search(query);

        // System Manager sees all results
        if (this.isSystemManager(user)) {
            return results;
        }

        // Filter results based on DocType permissions
        return results.filter(result => {
            return this.permissionManager.canRead(result.doctype);
        });
    }

    /**
     * Get awesomebar results for a query
     * P3-016-T19: Actions filtered by permission
     * P3-016-T20: Awesomebar shows "New X" if user has create permission
     * P3-016-T21: Awesomebar shows "X List" if user has read permission
     */
    awesomebar(query: string, user: UserContext): AwesomebarResult[] {
        const results: AwesomebarResult[] = [];
        const queryLower = query.toLowerCase().trim();

        if (!queryLower) {
            return results;
        }

        // Get DocTypes that match the query
        if (this.getDocTypes) {
            const doctypes = this.getDocTypes();

            for (const doctype of doctypes) {
                const label = doctype.label || doctype.name;
                const labelLower = label.toLowerCase();
                const nameLower = doctype.name.toLowerCase();

                // Check if query matches
                if (!labelLower.includes(queryLower) && !nameLower.includes(queryLower)) {
                    continue;
                }

                const canRead = this.isSystemManager(user) || this.permissionManager.canRead(doctype.name);
                const canCreate = this.isSystemManager(user) || this.permissionManager.canCreate(doctype.name);

                // T21: Add "X List" if user has read permission
                if (canRead) {
                    results.push({
                        label: `${label} List`,
                        value: `list-${doctype.name}`,
                        type: 'DocType',
                        route: `/app/${doctype.name.toLowerCase().replace(/ /g, '-')}`,
                        description: `View ${label} list`,
                        icon: doctype.icon
                    });
                }

                // T20: Add "New X" if user has create permission
                if (canCreate) {
                    results.push({
                        label: `New ${label}`,
                        value: `new-${doctype.name}`,
                        type: 'Action',
                        route: `/app/${doctype.name.toLowerCase().replace(/ /g, '-')}/new`,
                        description: `Create new ${label}`,
                        icon: doctype.icon,
                        shortcut: 'Ctrl+N'
                    });
                }
            }
        }

        // Get Reports that match the query
        if (this.getReports) {
            const reports = this.getReports();

            for (const report of reports) {
                const label = report.label || report.name;
                const labelLower = label.toLowerCase();

                if (!labelLower.includes(queryLower)) {
                    continue;
                }

                // Check permission for the reference DocType if specified
                if (report.ref_doctype) {
                    const canRead = this.isSystemManager(user) || this.permissionManager.canRead(report.ref_doctype);
                    if (!canRead) {
                        continue;
                    }
                }

                results.push({
                    label: label,
                    value: `report-${report.name}`,
                    type: 'Report',
                    route: `/app/query-report/${report.name.toLowerCase().replace(/ /g, '-')}`,
                    description: `View ${label} report`
                });
            }
        }

        // Get Pages that match the query
        if (this.getPages) {
            const pages = this.getPages();

            for (const page of pages) {
                const label = page.label || page.name;
                const labelLower = label.toLowerCase();

                if (!labelLower.includes(queryLower)) {
                    continue;
                }

                results.push({
                    label: label,
                    value: `page-${page.name}`,
                    type: 'Page',
                    route: `/app/${page.name.toLowerCase().replace(/ /g, '-')}`,
                    description: `Go to ${label}`
                });
            }
        }

        // Get Workspaces that match the query
        const visibleWorkspaces = this.workspaceManager.getVisibleWorkspaces(user);
        for (const workspace of visibleWorkspaces) {
            const labelLower = workspace.label.toLowerCase();
            const nameLower = workspace.name.toLowerCase();

            if (labelLower.includes(queryLower) || nameLower.includes(queryLower)) {
                results.push({
                    label: workspace.label,
                    value: `workspace-${workspace.name}`,
                    type: 'Workspace',
                    route: `/app/${workspace.name}`,
                    icon: workspace.icon,
                    description: `Go to ${workspace.label} workspace`
                });
            }
        }

        return results;
    }

    /**
     * Get sidebar sections from workspaces
     */
    getSidebarSections(user: UserContext): SidebarSection[] {
        const grouped = this.workspaceManager.getWorkspacesGroupedByCategory(user);
        const sections: SidebarSection[] = [];

        // Define category order
        const categoryOrder: SidebarCategory[] = ['Modules', 'Domains', 'Places', 'Administration'];

        for (const category of categoryOrder) {
            const workspaces = grouped.get(category);
            if (!workspaces || workspaces.length === 0) {
                continue;
            }

            const items: SidebarItem[] = workspaces.map(workspace => ({
                name: workspace.name,
                label: workspace.label,
                icon: workspace.icon,
                category: workspace.category as SidebarCategory,
                sequence: workspace.sequence,
                route: `/app/${workspace.name}`
            }));

            sections.push({
                title: category,
                items: items
            });
        }

        return sections;
    }

    /**
     * Update the permission manager
     */
    setPermissionManager(permissionManager: PermissionManager): void {
        this.permissionManager = permissionManager;
    }
}
