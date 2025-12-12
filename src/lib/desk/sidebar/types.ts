/**
 * Sidebar Types and Interfaces
 * P3-015: TypeScript interfaces for sidebar navigation and search
 */

/**
 * Sidebar category types for organizing navigation items
 */
export type SidebarCategory = 'Modules' | 'Domains' | 'Places' | 'Administration';

/**
 * Sidebar navigation item
 */
export interface SidebarItem {
    /** Unique identifier name */
    name: string;
    /** Display label */
    label: string;
    /** Icon identifier */
    icon: string;
    /** Category for grouping */
    category: SidebarCategory;
    /** Display order sequence */
    sequence: number;
    /** Target route/link (optional) */
    route?: string;
    /** Whether item is currently active */
    is_active?: boolean;
    /** Child items for nested navigation */
    children?: SidebarItem[];
}

/**
 * Awesomebar search result item
 */
export interface AwesomebarResult {
    /** Display label */
    label: string;
    /** Value/identifier */
    value: string;
    /** Type of result (e.g., 'DocType', 'Report', 'Page', 'Workspace') */
    type: string;
    /** Navigation route */
    route: string;
    /** Additional description */
    description?: string;
    /** Icon for the result */
    icon?: string;
    /** Keyboard shortcut if applicable */
    shortcut?: string;
}

/**
 * Full-text search result from database
 */
export interface SearchResult {
    /** DocType of the matched document */
    doctype: string;
    /** Document name/identifier */
    name: string;
    /** Matched content excerpt */
    content: string;
    /** Navigation route to the document */
    route: string;
    /** Relevance score */
    score: number;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}

/**
 * Sidebar section containing grouped items
 */
export interface SidebarSection {
    /** Section heading */
    title: SidebarCategory;
    /** Items in this section */
    items: SidebarItem[];
    /** Whether section is collapsed */
    collapsed?: boolean;
}

/**
 * Sidebar state for reactive stores
 */
export interface SidebarState {
    /** Grouped sections */
    sections: SidebarSection[];
    /** Currently selected item */
    selected: string | null;
    /** Collapsed state by category */
    collapsed: Record<SidebarCategory, boolean>;
    /** Search query */
    searchQuery: string;
    /** Loading state */
    loading: boolean;
}

/**
 * Awesomebar state for reactive stores
 */
export interface AwesomebarState {
    /** Current search query */
    query: string;
    /** Search results */
    results: AwesomebarResult[];
    /** Currently highlighted result index */
    highlightedIndex: number;
    /** Whether awesomebar is open */
    isOpen: boolean;
    /** Loading state */
    loading: boolean;
    /** Recent searches */
    recentSearches: string[];
}
