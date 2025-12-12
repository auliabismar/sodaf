/**
 * Workspace Manager
 * 
 * P3-016: Implement WorkspaceManager for permission-aware workspace navigation.
 * Provides methods for workspace visibility, content filtering, statistics, and user preferences.
 */

import type {
    Workspace,
    WorkspaceShortcut,
    WorkspaceLink,
    FilteredWorkspace,
    WorkspaceListItem,
    GroupedLinksMap
} from './types';
import type { PermissionManager } from '../../permissions';
import type { SidebarCategory } from '../sidebar/types';

/**
 * User context for permission checking
 */
export interface UserContext {
    /** User identifier */
    name: string;
    /** User's assigned roles */
    roles: string[];
}

/**
 * Recent document entry
 */
export interface RecentDocument {
    /** Document name/id */
    name: string;
    /** DocType of the document */
    doctype: string;
    /** Document route/path */
    route: string;
    /** When the document was last accessed */
    last_accessed: string;
}

/**
 * Configuration for WorkspaceManager
 */
export interface WorkspaceManagerConfig {
    /** Permission manager instance for permission checks */
    permissionManager: PermissionManager;
    /** Optional initial workspaces to register */
    workspaces?: Workspace[];
    /** Function to get document count (for shortcut statistics) */
    getDocumentCount?: (doctype: string, filters?: Record<string, unknown>, userPermissions?: boolean) => Promise<number>;
    /** Function to get user preference */
    getUserPreference?: (user: string, key: string) => string | null;
    /** Function to set user preference */
    setUserPreference?: (user: string, key: string, value: string) => void;
    /** Function to get recent documents */
    getRecentDocuments?: (user: string, doctype: string, limit: number) => RecentDocument[];
}

/**
 * WorkspaceManager class for permission-aware workspace navigation
 * 
 * Provides methods for:
 * - Workspace visibility and filtering based on user roles and permissions
 * - Content filtering (shortcuts, links) based on role restrictions
 * - Shortcut count statistics with permission filtering
 * - User workspace preferences
 * - Recent document tracking
 */
export class WorkspaceManager {
    private permissionManager: PermissionManager;
    private workspaces: Map<string, Workspace> = new Map();
    private getDocumentCount?: WorkspaceManagerConfig['getDocumentCount'];
    private getUserPreference?: WorkspaceManagerConfig['getUserPreference'];
    private setUserPreferenceFunc?: WorkspaceManagerConfig['setUserPreference'];
    private getRecentDocumentsFunc?: WorkspaceManagerConfig['getRecentDocuments'];

    constructor(config: WorkspaceManagerConfig) {
        this.permissionManager = config.permissionManager;
        this.getDocumentCount = config.getDocumentCount;
        this.getUserPreference = config.getUserPreference;
        this.setUserPreferenceFunc = config.setUserPreference;
        this.getRecentDocumentsFunc = config.getRecentDocuments;

        // Register initial workspaces
        if (config.workspaces) {
            for (const workspace of config.workspaces) {
                this.registerWorkspace(workspace);
            }
        }
    }

    /**
     * Check if user has System Manager role
     */
    private isSystemManager(user: UserContext): boolean {
        return user.roles.includes('System Manager');
    }

    /**
     * Check if user has any of the specified roles
     */
    private hasAnyRole(user: UserContext, roles: string[]): boolean {
        if (roles.length === 0) return true; // Empty roles = accessible to all
        return roles.some(role => user.roles.includes(role));
    }

    /**
     * Check if user can access a shortcut
     */
    private canAccessShortcut(shortcut: WorkspaceShortcut, user: UserContext): boolean {
        // Check only_for role restriction
        if (shortcut.only_for && shortcut.only_for.length > 0) {
            if (!this.hasAnyRole(user, shortcut.only_for)) {
                return false;
            }
        }

        // Check DocType permission if shortcut is for a DocType
        if (shortcut.type === 'DocType') {
            return this.permissionManager.canRead(shortcut.link_to);
        }

        return true;
    }

    /**
     * Check if user can access a link
     */
    private canAccessLink(link: WorkspaceLink, user: UserContext): boolean {
        // Check only_for role restriction
        if (link.only_for && link.only_for.length > 0) {
            if (!this.hasAnyRole(user, link.only_for)) {
                return false;
            }
        }

        // Check DocType permission if link is for a DocType
        if (link.type === 'DocType') {
            return this.permissionManager.canRead(link.link_to);
        }

        return true;
    }

    /**
     * Check if workspace has any accessible content for the user
     */
    private hasAccessibleContent(workspace: Workspace, user: UserContext): boolean {
        // Check if any shortcut is accessible
        const hasAccessibleShortcut = workspace.shortcuts.some(shortcut =>
            this.canAccessShortcut(shortcut, user)
        );
        if (hasAccessibleShortcut) return true;

        // Check if any link is accessible
        const hasAccessibleLink = workspace.links.some(link =>
            this.canAccessLink(link, user)
        );
        if (hasAccessibleLink) return true;

        // Check charts, number_cards, quick_lists (consider accessible if present)
        if (workspace.charts.length > 0) return true;
        if (workspace.number_cards.length > 0) return true;
        if (workspace.quick_lists.length > 0) return true;

        return false;
    }

    /**
     * Filter shortcuts for a user
     */
    private filterShortcuts(shortcuts: WorkspaceShortcut[], user: UserContext): WorkspaceShortcut[] {
        return shortcuts.filter(shortcut => this.canAccessShortcut(shortcut, user));
    }

    /**
     * Filter links for a user
     */
    private filterLinks(links: WorkspaceLink[], user: UserContext): WorkspaceLink[] {
        return links.filter(link => this.canAccessLink(link, user));
    }

    /**
     * Group links by their link_group
     */
    private groupLinks(links: WorkspaceLink[]): GroupedLinksMap {
        const grouped: GroupedLinksMap = new Map();

        for (const link of links) {
            const group = link.link_group || 'Other';
            if (!grouped.has(group)) {
                grouped.set(group, []);
            }
            grouped.get(group)!.push(link);
        }

        return grouped;
    }

    // P3-016-T23: Register a new workspace
    registerWorkspace(workspace: Workspace): void {
        this.workspaces.set(workspace.name, workspace);
    }

    /**
     * Get a workspace by name
     */
    getWorkspace(name: string): Workspace | null {
        return this.workspaces.get(name) || null;
    }

    /**
     * Get all registered workspaces
     */
    getAllWorkspaces(): Workspace[] {
        return Array.from(this.workspaces.values());
    }

    /**
     * Get visible workspaces for a user
     * P3-016-T1: Returns workspaces user can see
     * P3-016-T2: Workspace with roles: [] visible if user has content access
     * P3-016-T3: Workspace with roles: ['Admin'] only visible to Admin role
     * P3-016-T4: Workspace with no accessible content hidden from sidebar
     * P3-016-T5: Workspaces sorted by sequence
     * P3-016-T6: Workspaces grouped by category
     * P3-016-T24: System Manager sees all workspaces
     */
    getVisibleWorkspaces(user: UserContext): WorkspaceListItem[] {
        const visibleWorkspaces: WorkspaceListItem[] = [];

        for (const workspace of this.workspaces.values()) {
            // T24: System Manager sees all workspaces
            if (this.isSystemManager(user)) {
                visibleWorkspaces.push({
                    name: workspace.name,
                    label: workspace.label,
                    icon: workspace.icon,
                    category: workspace.category,
                    sequence: workspace.sequence
                });
                continue;
            }

            // T3: Check role-based visibility
            if (workspace.roles.length > 0 && !this.hasAnyRole(user, workspace.roles)) {
                continue;
            }

            // T2: If roles are empty, check if user has content access
            // T4: Hide workspace if no accessible content
            if (!this.hasAccessibleContent(workspace, user)) {
                continue;
            }

            visibleWorkspaces.push({
                name: workspace.name,
                label: workspace.label,
                icon: workspace.icon,
                category: workspace.category,
                sequence: workspace.sequence
            });
        }

        // T5: Sort by sequence
        visibleWorkspaces.sort((a, b) => a.sequence - b.sequence);

        return visibleWorkspaces;
    }

    /**
     * Get workspaces grouped by category
     * P3-016-T6: Workspaces grouped by category (Modules, Domains, Administration)
     */
    getWorkspacesGroupedByCategory(user: UserContext): Map<SidebarCategory, WorkspaceListItem[]> {
        const visible = this.getVisibleWorkspaces(user);
        const grouped = new Map<SidebarCategory, WorkspaceListItem[]>();

        for (const workspace of visible) {
            const category = workspace.category as SidebarCategory;
            if (!grouped.has(category)) {
                grouped.set(category, []);
            }
            grouped.get(category)!.push(workspace);
        }

        return grouped;
    }

    /**
     * Get filtered workspace content for a user
     * P3-016-T7: Returns filtered workspace content
     * P3-016-T8: Shortcut with only_for role filtered by role
     * P3-016-T9: Shortcut for DocType without permission hidden
     * P3-016-T10: Links filtered by permission
     * P3-016-T11: Links grouped by link_group
     * P3-016-T12: Link with only_for restriction hidden from other roles
     */
    getWorkspaceForUser(name: string, user: UserContext): FilteredWorkspace | null {
        const workspace = this.workspaces.get(name);
        if (!workspace) return null;

        // System Manager gets everything
        if (this.isSystemManager(user)) {
            const filteredLinks = workspace.links;
            return {
                ...workspace,
                shortcuts: workspace.shortcuts,
                links: filteredLinks,
                grouped_links: this.groupLinks(filteredLinks)
            };
        }

        // Check if user can access this workspace at all
        if (workspace.roles.length > 0 && !this.hasAnyRole(user, workspace.roles)) {
            return null;
        }

        // Filter shortcuts and links
        const filteredShortcuts = this.filterShortcuts(workspace.shortcuts, user);
        const filteredLinks = this.filterLinks(workspace.links, user);

        return {
            ...workspace,
            shortcuts: filteredShortcuts,
            links: filteredLinks,
            grouped_links: this.groupLinks(filteredLinks)
        };
    }

    /**
     * Get shortcut count with permission filtering
     * P3-016-T13: Count respects user permissions
     * P3-016-T14: Shortcut count with stats_filter applies filter
     * P3-016-T15: Shortcut count with User Permissions only counts permitted docs
     */
    async getShortcutCount(shortcut: WorkspaceShortcut, user: UserContext): Promise<number> {
        if (!this.getDocumentCount) {
            return 0;
        }

        // Check if user has permission to the DocType
        if (shortcut.type !== 'DocType') {
            return 0;
        }

        // System Manager bypass for permission check but still apply filters
        const hasPermission = this.isSystemManager(user) || this.permissionManager.canRead(shortcut.link_to);
        if (!hasPermission) {
            return 0;
        }

        // Get count with stats_filter if present (T14)
        // Apply user permissions filtering (T15)
        const applyUserPermissions = !this.isSystemManager(user);
        return this.getDocumentCount(
            shortcut.link_to,
            shortcut.stats_filter,
            applyUserPermissions
        );
    }

    /**
     * Get default workspace for a user
     * P3-016-T16: Returns user's preferred workspace
     */
    getDefaultWorkspace(user: UserContext): string | null {
        if (!this.getUserPreference) {
            // Return first visible workspace as default
            const visible = this.getVisibleWorkspaces(user);
            return visible.length > 0 ? visible[0].name : null;
        }

        const preference = this.getUserPreference(user.name, 'default_workspace');
        if (preference) {
            // Verify user can still access this workspace
            const visible = this.getVisibleWorkspaces(user);
            if (visible.some(w => w.name === preference)) {
                return preference;
            }
        }

        // Fallback to first visible workspace
        const visible = this.getVisibleWorkspaces(user);
        return visible.length > 0 ? visible[0].name : null;
    }

    /**
     * Set default workspace for a user
     * P3-016-T17: Updates user preference
     */
    setDefaultWorkspace(user: UserContext, name: string): void {
        if (!this.setUserPreferenceFunc) {
            throw new Error('setUserPreference function not configured');
        }

        // Verify the workspace exists and user can access it
        const workspace = this.workspaces.get(name);
        if (!workspace) {
            throw new Error(`Workspace '${name}' not found`);
        }

        const visible = this.getVisibleWorkspaces(user);
        if (!visible.some(w => w.name === name)) {
            throw new Error(`User does not have access to workspace '${name}'`);
        }

        this.setUserPreferenceFunc(user.name, 'default_workspace', name);
    }

    /**
     * Get recent documents for a user
     * P3-016-T22: Returns user's recent docs
     */
    getRecentDocuments(user: UserContext, doctype: string, limit: number = 10): RecentDocument[] {
        if (!this.getRecentDocumentsFunc) {
            return [];
        }

        // Check if user has permission to read the DocType
        if (!this.isSystemManager(user) && !this.permissionManager.canRead(doctype)) {
            return [];
        }

        return this.getRecentDocumentsFunc(user.name, doctype, limit);
    }

    /**
     * Update the permission manager (e.g., when user changes)
     */
    setPermissionManager(permissionManager: PermissionManager): void {
        this.permissionManager = permissionManager;
    }
}
