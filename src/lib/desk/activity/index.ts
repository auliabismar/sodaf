/**
 * Activity Module
 * P3-018: Activity logging and comments
 */

// Export all types
export type {
    ActivityType,
    Activity,
    Comment,
    Like,
    AssignmentActivity,
    ShareActivity,
    VersionActivity,
    SeenEntry,
    TimelineEntry,
    ActivityManagerConfig,
    ActivityStorage,
    ActivityFilters
} from './types';

// Export manager and utilities
export {
    ActivityManager,
    InMemoryActivityStorage,
    parseMentions
} from './activity-manager';
