/**
 * Workspace Types and Interfaces
 * P3-015: TypeScript interfaces for Workspace navigation, sidebar, and menu structures
 */

/**
 * Workspace shortcut item for quick access to frequently used features
 */
export interface WorkspaceShortcut {
    /** Display label for the shortcut */
    label: string;
    /** Target link/route */
    link_to: string;
    /** Type of shortcut (e.g., 'DocType', 'Report', 'Page') */
    type: string;
    /** Restrict shortcut visibility to specific roles */
    only_for?: string[];
    /** Filter for stats display */
    stats_filter?: Record<string, unknown>;
}

/**
 * Workspace link for navigation within the workspace
 */
export interface WorkspaceLink {
    /** Display label for the link */
    label: string;
    /** Target link/route */
    link_to: string;
    /** Type of link (e.g., 'DocType', 'Report', 'Page') */
    type: string;
    /** Group name for organizing links */
    link_group?: string;
    /** Restrict link visibility to specific roles */
    only_for?: string[];
}

/**
 * Workspace chart configuration
 */
export interface WorkspaceChart {
    /** Name of the chart to display */
    chart_name: string;
    /** Display label for the chart */
    label: string;
    /** Width of the chart (e.g., 'Full', 'Half') */
    width?: string;
}

/**
 * Workspace number card for displaying key metrics
 */
export interface WorkspaceNumberCard {
    /** Display label for the number card */
    label: string;
    /** Name of the number card configuration */
    number_card_name: string;
}

/**
 * Quick list configuration for workspace
 */
export interface WorkspaceQuickList {
    /** Display label for the quick list */
    label: string;
    /** DocType to list */
    document_type: string;
    /** Filters to apply to the list */
    filters?: Record<string, unknown>;
    /** Maximum number of items to display */
    limit?: number;
}

/**
 * Main Workspace interface representing a workspace module
 */
export interface Workspace {
    /** Unique identifier name */
    name: string;
    /** Display label */
    label: string;
    /** Icon identifier */
    icon: string;
    /** Associated module name */
    module: string;
    /** Category for grouping workspaces */
    category: string;
    /** Display order sequence */
    sequence: number;
    /** Roles that can access this workspace */
    roles: string[];
    /** Quick access shortcuts */
    shortcuts: WorkspaceShortcut[];
    /** Navigation links */
    links: WorkspaceLink[];
    /** Dashboard charts */
    charts: WorkspaceChart[];
    /** Number cards for metrics */
    number_cards: WorkspaceNumberCard[];
    /** Quick lists */
    quick_lists: WorkspaceQuickList[];
}

/**
 * Grouped links map type for FilteredWorkspace
 */
export type GroupedLinksMap = Map<string, WorkspaceLink[]>;

/**
 * Workspace with links organized by group
 */
export interface FilteredWorkspace extends Omit<Workspace, 'links'> {
    /** Links organized by their link_group */
    grouped_links: GroupedLinksMap;
    /** Original links array (preserved for compatibility) */
    links: WorkspaceLink[];
}

/**
 * Workspace list item for sidebar display
 */
export interface WorkspaceListItem {
    /** Unique identifier name */
    name: string;
    /** Display label */
    label: string;
    /** Icon identifier */
    icon: string;
    /** Category for grouping */
    category: string;
    /** Display order sequence */
    sequence: number;
}

/**
 * Workspace state for reactive stores
 */
export interface WorkspaceState {
    /** Currently active workspace */
    current: Workspace | null;
    /** List of available workspaces */
    available: WorkspaceListItem[];
    /** Loading state */
    loading: boolean;
    /** Error message if any */
    error: string | null;
}
