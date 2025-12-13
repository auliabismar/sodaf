/**
 * Activity Types and Interfaces
 * P3-018: TypeScript interfaces for activity logging and comments
 */

/**
 * Activity type enumeration
 */
export type ActivityType = 'Comment' | 'Like' | 'Assignment' | 'Share' | 'Version';

/**
 * Base activity interface
 */
export interface Activity {
    /** Activity unique identifier */
    name: string;
    /** Target document type */
    doctype: string;
    /** Target document name */
    doc_name: string;
    /** Type of activity */
    type: ActivityType;
    /** User who performed the activity */
    user: string;
    /** Timestamp of activity */
    timestamp: Date | string;
    /** Additional data */
    data?: Record<string, any>;
}

/**
 * Comment activity
 */
export interface Comment extends Activity {
    type: 'Comment';
    /** Comment text content */
    content: string;
    /** Parsed @mentions from content */
    mentions: string[];
    /** Parent comment name for replies */
    parent_comment?: string;
    /** Whether comment is edited */
    edited?: boolean;
    /** Edit timestamp */
    edited_at?: Date | string;
}

/**
 * Like activity
 */
export interface Like extends Activity {
    type: 'Like';
}

/**
 * Assignment activity
 */
export interface AssignmentActivity extends Activity {
    type: 'Assignment';
    /** User being assigned */
    assigned_to: string;
    /** Optional due date */
    due_date?: Date | string;
    /** Priority level */
    priority?: 'Low' | 'Medium' | 'High';
    /** Assignment status */
    status?: 'Open' | 'Completed' | 'Cancelled';
}

/**
 * Share activity
 */
export interface ShareActivity extends Activity {
    type: 'Share';
    /** User the document is shared with */
    shared_with: string;
    /** Whether share grants read access */
    read: boolean;
    /** Whether share grants write access */
    write: boolean;
}

/**
 * Version/change activity
 */
export interface VersionActivity extends Activity {
    type: 'Version';
    /** Field that was changed */
    field: string;
    /** Old value before change */
    old_value: any;
    /** New value after change */
    new_value: any;
}

/**
 * Seen tracking entry
 */
export interface SeenEntry {
    /** Unique identifier */
    name: string;
    /** Document type */
    doctype: string;
    /** Document name */
    doc_name: string;
    /** User who saw the document */
    user: string;
    /** Timestamp when document was marked seen */
    seen_at: Date | string;
}

/**
 * Timeline entry for combined activity view
 */
export interface TimelineEntry {
    /** Entry type */
    type: ActivityType;
    /** Timestamp */
    timestamp: Date | string;
    /** User who performed action */
    user: string;
    /** Display content/message */
    content: string;
    /** Additional data for rendering */
    data?: Record<string, any>;
    /** Original activity reference */
    activity?: Activity;
}

/**
 * Configuration for ActivityManager
 */
export interface ActivityManagerConfig {
    /** Current user */
    user: string;
    /** Optional storage provider for persistence */
    storage?: ActivityStorage;
}

/**
 * Storage interface for activity persistence
 */
export interface ActivityStorage {
    /** Save an activity */
    saveActivity(activity: Activity): Promise<string>;
    /** Get activity by name */
    getActivity(name: string): Promise<Activity | null>;
    /** Update an activity */
    updateActivity(name: string, data: Partial<Activity>): Promise<void>;
    /** Delete an activity */
    deleteActivity(name: string): Promise<void>;
    /** Get activities for a document */
    getActivities(doctype: string, docName: string, filters?: ActivityFilters): Promise<Activity[]>;
    /** Save seen entry */
    saveSeen(entry: SeenEntry): Promise<void>;
    /** Get seen entries for user */
    getSeenEntries(user: string, doctype?: string): Promise<SeenEntry[]>;
    /** Check if document is seen */
    isSeen(doctype: string, docName: string, user: string): Promise<boolean>;
}

/**
 * Filters for activity queries
 */
export interface ActivityFilters {
    /** Filter by activity types */
    types?: ActivityType[];
    /** Filter by user */
    user?: string;
    /** Filter by date range start */
    from_date?: Date | string;
    /** Filter by date range end */
    to_date?: Date | string;
    /** Limit number of results */
    limit?: number;
    /** Order by field */
    order_by?: 'timestamp' | 'type';
    /** Order direction */
    order_dir?: 'asc' | 'desc';
}
