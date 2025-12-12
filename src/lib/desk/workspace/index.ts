/**
 * Workspace Module Index
 * 
 * P3-015: Exports workspace types
 * P3-016: Exports WorkspaceManager
 */

// P3-015: Type definitions
export type {
    Workspace,
    WorkspaceShortcut,
    WorkspaceLink,
    WorkspaceChart,
    WorkspaceNumberCard,
    WorkspaceQuickList,
    FilteredWorkspace,
    GroupedLinksMap,
    WorkspaceListItem,
    WorkspaceState
} from './types';

// P3-016: Workspace Manager
export {
    WorkspaceManager,
    type WorkspaceManagerConfig,
    type UserContext,
    type RecentDocument
} from './workspace-manager';
