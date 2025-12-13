/**
 * Activity Manager
 * 
 * P3-018: Implement activity logging and comments.
 * Provides comment CRUD, activity logging, likes, and seen tracking.
 */

import type {
    Activity,
    ActivityType,
    Comment,
    Like,
    VersionActivity,
    SeenEntry,
    TimelineEntry,
    ActivityManagerConfig,
    ActivityStorage,
    ActivityFilters
} from './types';

/**
 * In-memory storage implementation for testing and simple use cases
 */
export class InMemoryActivityStorage implements ActivityStorage {
    private activities: Map<string, Activity> = new Map();
    private seenEntries: Map<string, SeenEntry> = new Map();
    private idCounter: number = 0;

    private generateId(prefix: string): string {
        return `${prefix}-${++this.idCounter}`;
    }

    async saveActivity(activity: Activity): Promise<string> {
        const name = activity.name || this.generateId('ACT');
        const activityWithName = { ...activity, name };
        this.activities.set(name, activityWithName);
        return name;
    }

    async getActivity(name: string): Promise<Activity | null> {
        return this.activities.get(name) || null;
    }

    async updateActivity(name: string, data: Partial<Activity>): Promise<void> {
        const existing = this.activities.get(name);
        if (existing) {
            this.activities.set(name, { ...existing, ...data });
        }
    }

    async deleteActivity(name: string): Promise<void> {
        this.activities.delete(name);
    }

    async getActivities(doctype: string, docName: string, filters?: ActivityFilters): Promise<Activity[]> {
        let results = Array.from(this.activities.values())
            .filter(a => a.doctype === doctype && a.doc_name === docName);

        if (filters?.types) {
            results = results.filter(a => filters.types!.includes(a.type));
        }

        if (filters?.user) {
            results = results.filter(a => a.user === filters.user);
        }

        // Sort by timestamp descending by default
        results.sort((a, b) => {
            const dateA = new Date(a.timestamp).getTime();
            const dateB = new Date(b.timestamp).getTime();
            return filters?.order_dir === 'asc' ? dateA - dateB : dateB - dateA;
        });

        if (filters?.limit) {
            results = results.slice(0, filters.limit);
        }

        return results;
    }

    async saveSeen(entry: SeenEntry): Promise<void> {
        const key = `${entry.doctype}:${entry.doc_name}:${entry.user}`;
        this.seenEntries.set(key, entry);
    }

    async getSeenEntries(user: string, doctype?: string): Promise<SeenEntry[]> {
        return Array.from(this.seenEntries.values())
            .filter(e => e.user === user && (!doctype || e.doctype === doctype));
    }

    async isSeen(doctype: string, docName: string, user: string): Promise<boolean> {
        const key = `${doctype}:${docName}:${user}`;
        return this.seenEntries.has(key);
    }

    // For testing: get all activities
    getAllActivities(): Activity[] {
        return Array.from(this.activities.values());
    }

    // For testing: clear all data
    clear(): void {
        this.activities.clear();
        this.seenEntries.clear();
        this.idCounter = 0;
    }
}

/**
 * Parse @mentions from text content
 */
export function parseMentions(content: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+|[a-zA-Z0-9._-]+)/g;
    const matches = content.match(mentionRegex) || [];
    return matches.map(m => m.substring(1)); // Remove @ prefix
}

/**
 * Activity Manager class for activity logging and comments
 * 
 * Provides methods for:
 * - Comment CRUD operations
 * - Activity logging
 * - Like/unlike
 * - Seen tracking
 */
export class ActivityManager {
    private user: string;
    private storage: ActivityStorage;
    private static idCounter: number = 0;

    constructor(config: ActivityManagerConfig) {
        this.user = config.user;
        this.storage = config.storage || new InMemoryActivityStorage();
    }

    /**
     * Generate a unique ID
     */
    private generateId(prefix: string): string {
        return `${prefix}-${Date.now()}-${++ActivityManager.idCounter}`;
    }

    // ==================== Comment System ====================

    /**
     * P3-018-T1, P3-018-T2: Add a comment to a document
     * @param doctype Document type
     * @param name Document name
     * @param content Comment text content
     * @param parentComment Optional parent comment for replies
     * @returns Created comment
     */
    async addComment(
        doctype: string,
        name: string,
        content: string,
        parentComment?: string
    ): Promise<Comment> {
        const mentions = parseMentions(content);

        const comment: Comment = {
            name: this.generateId('CMT'),
            doctype,
            doc_name: name,
            type: 'Comment',
            user: this.user,
            timestamp: new Date().toISOString(),
            content,
            mentions,
            parent_comment: parentComment
        };

        await this.storage.saveActivity(comment);
        return comment;
    }

    /**
     * P3-018-T3: Get comments for a document
     * @param doctype Document type
     * @param name Document name
     * @returns Array of comments
     */
    async getComments(doctype: string, name: string): Promise<Comment[]> {
        const activities = await this.storage.getActivities(doctype, name, {
            types: ['Comment']
        });
        return activities as Comment[];
    }

    /**
     * P3-018-T4: Update a comment
     * @param commentName Comment name to update
     * @param content New content
     * @returns Updated comment or null if not found
     */
    async updateComment(commentName: string, content: string): Promise<Comment | null> {
        const existing = await this.storage.getActivity(commentName);
        if (!existing || existing.type !== 'Comment') {
            return null;
        }

        const mentions = parseMentions(content);
        const updates: Partial<Comment> = {
            content,
            mentions,
            edited: true,
            edited_at: new Date().toISOString()
        };

        await this.storage.updateActivity(commentName, updates);

        return {
            ...(existing as Comment),
            ...updates
        } as Comment;
    }

    /**
     * P3-018-T5: Delete a comment
     * @param commentName Comment name to delete
     */
    async deleteComment(commentName: string): Promise<void> {
        await this.storage.deleteActivity(commentName);
    }

    // ==================== Activity Logging ====================

    /**
     * P3-018-T6: Get timeline for a document (all activities)
     * @param doctype Document type
     * @param name Document name
     * @param filters Optional filters
     * @returns Array of timeline entries
     */
    async getTimeline(
        doctype: string,
        name: string,
        filters?: ActivityFilters
    ): Promise<TimelineEntry[]> {
        const activities = await this.storage.getActivities(doctype, name, filters);

        return activities.map(activity => this.activityToTimelineEntry(activity));
    }

    /**
     * Convert an activity to a timeline entry
     */
    private activityToTimelineEntry(activity: Activity): TimelineEntry {
        let content = '';
        let data = activity.data;

        switch (activity.type) {
            case 'Comment':
                content = (activity as Comment).content;
                break;
            case 'Like':
                content = 'liked this document';
                break;
            case 'Version':
                const version = activity as VersionActivity;
                content = `changed ${version.field} from "${version.old_value}" to "${version.new_value}"`;
                // Include version details in the data object
                data = {
                    ...data,
                    field: version.field,
                    old_value: version.old_value,
                    new_value: version.new_value
                };
                break;
            case 'Assignment':
                content = `assigned to ${activity.data?.assigned_to || 'user'}`;
                break;
            case 'Share':
                content = `shared with ${activity.data?.shared_with || 'user'}`;
                break;
            default:
                content = activity.data?.message || activity.type;
        }

        return {
            type: activity.type,
            timestamp: activity.timestamp,
            user: activity.user,
            content,
            data,
            activity
        };
    }

    /**
     * P3-018-T7: Log an activity
     * @param activity Activity to log
     * @returns Activity name
     */
    async logActivity(activity: Omit<Activity, 'name' | 'user' | 'timestamp'>): Promise<string> {
        const fullActivity: Activity = {
            ...activity,
            name: this.generateId('ACT'),
            user: this.user,
            timestamp: new Date().toISOString()
        };

        return await this.storage.saveActivity(fullActivity);
    }

    /**
     * P3-018-T8: Log a document change (auto-log)
     * @param doctype Document type
     * @param name Document name
     * @param field Field that changed
     * @param oldValue Previous value
     * @param newValue New value
     * @returns Activity name
     */
    async logDocumentChange(
        doctype: string,
        name: string,
        field: string,
        oldValue: any,
        newValue: any
    ): Promise<string> {
        const versionActivity: VersionActivity = {
            name: this.generateId('VER'),
            doctype,
            doc_name: name,
            type: 'Version',
            user: this.user,
            timestamp: new Date().toISOString(),
            field,
            old_value: oldValue,
            new_value: newValue
        };

        return await this.storage.saveActivity(versionActivity);
    }

    // ==================== Likes ====================

    /**
     * P3-018-T9: Like a document
     * @param doctype Document type
     * @param name Document name
     * @returns Like activity
     */
    async like(doctype: string, name: string): Promise<Like> {
        // Check if already liked
        const existingLikes = await this.storage.getActivities(doctype, name, {
            types: ['Like'],
            user: this.user
        });

        if (existingLikes.length > 0) {
            return existingLikes[0] as Like;
        }

        const like: Like = {
            name: this.generateId('LKE'),
            doctype,
            doc_name: name,
            type: 'Like',
            user: this.user,
            timestamp: new Date().toISOString()
        };

        await this.storage.saveActivity(like);
        return like;
    }

    /**
     * P3-018-T10: Unlike a document
     * @param doctype Document type
     * @param name Document name
     */
    async unlike(doctype: string, name: string): Promise<void> {
        const existingLikes = await this.storage.getActivities(doctype, name, {
            types: ['Like'],
            user: this.user
        });

        for (const like of existingLikes) {
            await this.storage.deleteActivity(like.name);
        }
    }

    /**
     * P3-018-T11: Get likes for a document
     * @param doctype Document type
     * @param name Document name
     * @returns Array of user emails who liked
     */
    async getLikes(doctype: string, name: string): Promise<string[]> {
        const likes = await this.storage.getActivities(doctype, name, {
            types: ['Like']
        });

        return likes.map(like => like.user);
    }

    // ==================== Seen Tracking ====================

    /**
     * P3-018-T12: Mark a document as seen
     * @param doctype Document type
     * @param name Document name
     */
    async markSeen(doctype: string, name: string): Promise<void> {
        const entry: SeenEntry = {
            name: this.generateId('SEEN'),
            doctype,
            doc_name: name,
            user: this.user,
            seen_at: new Date().toISOString()
        };

        await this.storage.saveSeen(entry);
    }

    /**
     * P3-018-T13: Get count of unseen documents for a doctype
     * @param doctype Document type
     * @param allDocNames All document names to check against
     * @returns Count of unseen documents
     */
    async getUnseenCount(doctype: string, allDocNames: string[]): Promise<number> {
        const seenEntries = await this.storage.getSeenEntries(this.user, doctype);
        const seenNames = new Set(seenEntries.map(e => e.doc_name));

        return allDocNames.filter(name => !seenNames.has(name)).length;
    }

    /**
     * P3-018-T14: Get unseen documents for a doctype
     * @param doctype Document type
     * @param allDocNames All document names to check against
     * @returns Array of unseen document names
     */
    async getUnseenDocuments(doctype: string, allDocNames: string[]): Promise<string[]> {
        const seenEntries = await this.storage.getSeenEntries(this.user, doctype);
        const seenNames = new Set(seenEntries.map(e => e.doc_name));

        return allDocNames.filter(name => !seenNames.has(name));
    }

    /**
     * Check if a document is seen
     * @param doctype Document type
     * @param name Document name
     * @returns Whether document is seen
     */
    async isSeen(doctype: string, name: string): Promise<boolean> {
        return this.storage.isSeen(doctype, name, this.user);
    }

    // ==================== Utility Methods ====================

    /**
     * Set current user
     */
    setUser(user: string): void {
        this.user = user;
    }

    /**
     * Get current user
     */
    getUser(): string {
        return this.user;
    }
}
