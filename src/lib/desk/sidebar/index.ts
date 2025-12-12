/**
 * Sidebar Module Index
 * 
 * P3-015: Exports sidebar types
 * P3-016: Exports SidebarManager
 * P3-017: Exports Sidebar Svelte components
 */

// P3-015: Type definitions
export type {
    SidebarCategory,
    SidebarItem,
    SidebarSection,
    SidebarState,
    AwesomebarResult,
    AwesomebarState,
    SearchResult
} from './types';

// P3-016: Sidebar Manager
export { SidebarManager } from './sidebar-manager';

// P3-017: Svelte Components
export { default as Sidebar } from './Sidebar.svelte';
export { default as SidebarCategoryComponent } from './SidebarCategory.svelte';
export { default as SidebarItemComponent } from './SidebarItem.svelte';
