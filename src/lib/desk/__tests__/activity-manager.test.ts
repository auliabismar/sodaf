/**
 * Activity Manager Tests
 * P3-018: Tests for ActivityManager activity logging and comments
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    ActivityManager,
    InMemoryActivityStorage,
    parseMentions,
    type Comment,
    type Like,
    type ActivityType
} from '../activity';

describe('P3-018: Activity Manager', () => {
    let storage: InMemoryActivityStorage;
    let am: ActivityManager;

    beforeEach(() => {
        storage = new InMemoryActivityStorage();
        am = new ActivityManager({
            user: 'test@example.com',
            storage
        });
    });

    // ==================== Comment System ====================

    // P3-018-T1: addComment(doctype, name, content) creates comment
    describe('P3-018-T1: addComment creates comment', () => {
        it('should create a comment with correct properties', async () => {
            const comment = await am.addComment('Task', 'TASK-001', 'This is a test comment');

            expect(comment).toBeDefined();
            expect(comment.name).toBeTruthy();
            expect(comment.doctype).toBe('Task');
            expect(comment.doc_name).toBe('TASK-001');
            expect(comment.type).toBe('Comment');
            expect(comment.content).toBe('This is a test comment');
            expect(comment.user).toBe('test@example.com');
            expect(comment.timestamp).toBeTruthy();
        });

        it('should persist the comment in storage', async () => {
            const comment = await am.addComment('Task', 'TASK-001', 'Persisted comment');

            const stored = await storage.getActivity(comment.name);
            expect(stored).toBeDefined();
            expect((stored as Comment).content).toBe('Persisted comment');
        });

        it('should support parent comment for replies', async () => {
            const parent = await am.addComment('Task', 'TASK-001', 'Parent comment');
            const reply = await am.addComment('Task', 'TASK-001', 'Reply comment', parent.name);

            expect(reply.parent_comment).toBe(parent.name);
        });
    });

    // P3-018-T2: addComment with mentions parses @mentions
    describe('P3-018-T2: addComment with mentions parses @mentions', () => {
        it('should parse single @mention', async () => {
            const comment = await am.addComment(
                'Task',
                'TASK-001',
                'Hey @john please review this'
            );

            expect(comment.mentions).toContain('john');
        });

        it('should parse multiple @mentions', async () => {
            const comment = await am.addComment(
                'Task',
                'TASK-001',
                'Hey @john and @jane please review this'
            );

            expect(comment.mentions).toContain('john');
            expect(comment.mentions).toContain('jane');
        });

        it('should parse email @mentions', async () => {
            const comment = await am.addComment(
                'Task',
                'TASK-001',
                'Assigning to @john.doe@example.com'
            );

            expect(comment.mentions).toContain('john.doe@example.com');
        });

        it('should return empty array when no mentions', async () => {
            const comment = await am.addComment(
                'Task',
                'TASK-001',
                'No mentions here'
            );

            expect(comment.mentions).toEqual([]);
        });
    });

    // P3-018-T3: getComments(doctype, name) returns comments
    describe('P3-018-T3: getComments returns comments', () => {
        it('should return all comments for a document', async () => {
            await am.addComment('Task', 'TASK-001', 'Comment 1');
            await am.addComment('Task', 'TASK-001', 'Comment 2');
            await am.addComment('Task', 'TASK-001', 'Comment 3');

            const comments = await am.getComments('Task', 'TASK-001');

            expect(comments).toHaveLength(3);
        });

        it('should not return comments from other documents', async () => {
            await am.addComment('Task', 'TASK-001', 'Comment for TASK-001');
            await am.addComment('Task', 'TASK-002', 'Comment for TASK-002');

            const comments = await am.getComments('Task', 'TASK-001');

            expect(comments).toHaveLength(1);
            expect(comments[0].content).toBe('Comment for TASK-001');
        });

        it('should return empty array when no comments', async () => {
            const comments = await am.getComments('Task', 'TASK-999');

            expect(comments).toEqual([]);
        });
    });

    // P3-018-T4: updateComment(name, content) updates comment
    describe('P3-018-T4: updateComment updates comment', () => {
        it('should update comment content', async () => {
            const comment = await am.addComment('Task', 'TASK-001', 'Original content');
            const updated = await am.updateComment(comment.name, 'Updated content');

            expect(updated).toBeDefined();
            expect(updated!.content).toBe('Updated content');
        });

        it('should set edited flag and timestamp', async () => {
            const comment = await am.addComment('Task', 'TASK-001', 'Original');
            const updated = await am.updateComment(comment.name, 'Edited');

            expect(updated!.edited).toBe(true);
            expect(updated!.edited_at).toBeTruthy();
        });

        it('should re-parse mentions on update', async () => {
            const comment = await am.addComment('Task', 'TASK-001', 'Hey @john');
            const updated = await am.updateComment(comment.name, 'Hey @jane');

            expect(updated!.mentions).toContain('jane');
            expect(updated!.mentions).not.toContain('john');
        });

        it('should return null for non-existent comment', async () => {
            const updated = await am.updateComment('NON-EXISTENT', 'Content');

            expect(updated).toBeNull();
        });
    });

    // P3-018-T5: deleteComment(name) removes comment
    describe('P3-018-T5: deleteComment removes comment', () => {
        it('should delete the comment', async () => {
            const comment = await am.addComment('Task', 'TASK-001', 'To be deleted');
            await am.deleteComment(comment.name);

            const stored = await storage.getActivity(comment.name);
            expect(stored).toBeNull();
        });

        it('should not affect other comments', async () => {
            const comment1 = await am.addComment('Task', 'TASK-001', 'Comment 1');
            const comment2 = await am.addComment('Task', 'TASK-001', 'Comment 2');

            await am.deleteComment(comment1.name);

            const comments = await am.getComments('Task', 'TASK-001');
            expect(comments).toHaveLength(1);
            expect(comments[0].name).toBe(comment2.name);
        });
    });

    // ==================== Activity Logging ====================

    // P3-018-T6: getTimeline(doctype, name) returns all activities
    describe('P3-018-T6: getTimeline returns all activities', () => {
        it('should return comments in timeline', async () => {
            await am.addComment('Task', 'TASK-001', 'A comment');

            const timeline = await am.getTimeline('Task', 'TASK-001');

            expect(timeline).toHaveLength(1);
            expect(timeline[0].type).toBe('Comment');
            expect(timeline[0].content).toBe('A comment');
        });

        it('should return likes in timeline', async () => {
            await am.like('Task', 'TASK-001');

            const timeline = await am.getTimeline('Task', 'TASK-001');

            expect(timeline).toHaveLength(1);
            expect(timeline[0].type).toBe('Like');
            expect(timeline[0].content).toBe('liked this document');
        });

        it('should return version changes in timeline', async () => {
            await am.logDocumentChange('Task', 'TASK-001', 'status', 'Open', 'Closed');

            const timeline = await am.getTimeline('Task', 'TASK-001');

            expect(timeline).toHaveLength(1);
            expect(timeline[0].type).toBe('Version');
            expect(timeline[0].content).toContain('status');
        });

        it('should combine all activity types', async () => {
            await am.addComment('Task', 'TASK-001', 'A comment');
            await am.like('Task', 'TASK-001');
            await am.logDocumentChange('Task', 'TASK-001', 'status', 'Open', 'Closed');

            const timeline = await am.getTimeline('Task', 'TASK-001');

            expect(timeline.length).toBe(3);
            const types = timeline.map(t => t.type);
            expect(types).toContain('Comment');
            expect(types).toContain('Like');
            expect(types).toContain('Version');
        });
    });

    // P3-018-T7: logActivity(activity) creates activity log
    describe('P3-018-T7: logActivity creates activity log', () => {
        it('should log a custom activity', async () => {
            const activityName = await am.logActivity({
                doctype: 'Task',
                doc_name: 'TASK-001',
                type: 'Assignment',
                data: { assigned_to: 'jane@example.com' }
            });

            expect(activityName).toBeTruthy();

            const timeline = await am.getTimeline('Task', 'TASK-001');
            expect(timeline).toHaveLength(1);
            expect(timeline[0].type).toBe('Assignment');
        });

        it('should auto-set user and timestamp', async () => {
            const activityName = await am.logActivity({
                doctype: 'Task',
                doc_name: 'TASK-001',
                type: 'Share',
                data: { shared_with: 'bob@example.com' }
            });

            const stored = await storage.getActivity(activityName);
            expect(stored!.user).toBe('test@example.com');
            expect(stored!.timestamp).toBeTruthy();
        });
    });

    // P3-018-T8: Auto-log on document change logs value changes
    describe('P3-018-T8: Auto-log on document change', () => {
        it('should log field value changes', async () => {
            await am.logDocumentChange('Task', 'TASK-001', 'status', 'Open', 'In Progress');

            const timeline = await am.getTimeline('Task', 'TASK-001');

            expect(timeline).toHaveLength(1);
            expect(timeline[0].type).toBe('Version');
            expect(timeline[0].data?.field).toBe('status');
            expect(timeline[0].data?.old_value).toBe('Open');
            expect(timeline[0].data?.new_value).toBe('In Progress');
        });

        it('should track multiple field changes', async () => {
            await am.logDocumentChange('Task', 'TASK-001', 'status', 'Open', 'Closed');
            await am.logDocumentChange('Task', 'TASK-001', 'priority', 'Low', 'High');

            const timeline = await am.getTimeline('Task', 'TASK-001');

            expect(timeline).toHaveLength(2);
        });
    });

    // ==================== Likes ====================

    // P3-018-T9: like(doctype, name) adds like
    describe('P3-018-T9: like adds like', () => {
        it('should add a like to the document', async () => {
            const like = await am.like('Task', 'TASK-001');

            expect(like).toBeDefined();
            expect(like.type).toBe('Like');
            expect(like.user).toBe('test@example.com');
        });

        it('should not create duplicate likes from same user', async () => {
            await am.like('Task', 'TASK-001');
            await am.like('Task', 'TASK-001');

            const likes = await am.getLikes('Task', 'TASK-001');
            expect(likes).toHaveLength(1);
        });
    });

    // P3-018-T10: unlike(doctype, name) removes like
    describe('P3-018-T10: unlike removes like', () => {
        it('should remove the like', async () => {
            await am.like('Task', 'TASK-001');
            await am.unlike('Task', 'TASK-001');

            const likes = await am.getLikes('Task', 'TASK-001');
            expect(likes).toHaveLength(0);
        });

        it('should not fail if no like exists', async () => {
            await expect(am.unlike('Task', 'TASK-001')).resolves.not.toThrow();
        });
    });

    // P3-018-T11: getLikes(doctype, name) returns likers
    describe('P3-018-T11: getLikes returns likers', () => {
        it('should return list of users who liked', async () => {
            // Create manager for different users
            const am1 = new ActivityManager({ user: 'user1@example.com', storage });
            const am2 = new ActivityManager({ user: 'user2@example.com', storage });
            const am3 = new ActivityManager({ user: 'user3@example.com', storage });

            await am1.like('Task', 'TASK-001');
            await am2.like('Task', 'TASK-001');
            await am3.like('Task', 'TASK-001');

            const likes = await am.getLikes('Task', 'TASK-001');

            expect(likes).toHaveLength(3);
            expect(likes).toContain('user1@example.com');
            expect(likes).toContain('user2@example.com');
            expect(likes).toContain('user3@example.com');
        });

        it('should return empty array if no likes', async () => {
            const likes = await am.getLikes('Task', 'TASK-999');

            expect(likes).toEqual([]);
        });
    });

    // ==================== Seen Tracking ====================

    // P3-018-T12: markSeen(doctype, name) marks as seen
    describe('P3-018-T12: markSeen marks as seen', () => {
        it('should mark document as seen', async () => {
            await am.markSeen('Task', 'TASK-001');

            const isSeen = await am.isSeen('Task', 'TASK-001');
            expect(isSeen).toBe(true);
        });

        it('should not affect other documents', async () => {
            await am.markSeen('Task', 'TASK-001');

            const isSeen = await am.isSeen('Task', 'TASK-002');
            expect(isSeen).toBe(false);
        });
    });

    // P3-018-T13: getUnseenCount(doctype) returns unseen count
    describe('P3-018-T13: getUnseenCount returns unseen count', () => {
        it('should return count of unseen documents', async () => {
            const allDocs = ['TASK-001', 'TASK-002', 'TASK-003', 'TASK-004', 'TASK-005'];
            await am.markSeen('Task', 'TASK-001');
            await am.markSeen('Task', 'TASK-003');

            const unseenCount = await am.getUnseenCount('Task', allDocs);

            expect(unseenCount).toBe(3); // TASK-002, TASK-004, TASK-005
        });

        it('should return total count when none seen', async () => {
            const allDocs = ['TASK-001', 'TASK-002'];
            const unseenCount = await am.getUnseenCount('Task', allDocs);

            expect(unseenCount).toBe(2);
        });

        it('should return 0 when all seen', async () => {
            const allDocs = ['TASK-001', 'TASK-002'];
            await am.markSeen('Task', 'TASK-001');
            await am.markSeen('Task', 'TASK-002');

            const unseenCount = await am.getUnseenCount('Task', allDocs);

            expect(unseenCount).toBe(0);
        });
    });

    // P3-018-T14: getUnseenDocuments(doctype) returns unseen docs
    describe('P3-018-T14: getUnseenDocuments returns unseen docs', () => {
        it('should return list of unseen document names', async () => {
            const allDocs = ['TASK-001', 'TASK-002', 'TASK-003'];
            await am.markSeen('Task', 'TASK-001');

            const unseen = await am.getUnseenDocuments('Task', allDocs);

            expect(unseen).toHaveLength(2);
            expect(unseen).toContain('TASK-002');
            expect(unseen).toContain('TASK-003');
            expect(unseen).not.toContain('TASK-001');
        });

        it('should return all docs when none seen', async () => {
            const allDocs = ['TASK-001', 'TASK-002'];
            const unseen = await am.getUnseenDocuments('Task', allDocs);

            expect(unseen).toEqual(allDocs);
        });
    });

    // ==================== Activity Types ====================

    // P3-018-T15: Activity types (Comment, Like, Assignment, Share, Version)
    describe('P3-018-T15: Activity types', () => {
        it('should support Comment activity type', async () => {
            const comment = await am.addComment('Task', 'TASK-001', 'Test');
            expect(comment.type).toBe('Comment');
        });

        it('should support Like activity type', async () => {
            const like = await am.like('Task', 'TASK-001');
            expect(like.type).toBe('Like');
        });

        it('should support Assignment activity type', async () => {
            await am.logActivity({
                doctype: 'Task',
                doc_name: 'TASK-001',
                type: 'Assignment',
                data: { assigned_to: 'user@example.com' }
            });

            const timeline = await am.getTimeline('Task', 'TASK-001');
            expect(timeline[0].type).toBe('Assignment');
        });

        it('should support Share activity type', async () => {
            await am.logActivity({
                doctype: 'Task',
                doc_name: 'TASK-001',
                type: 'Share',
                data: { shared_with: 'user@example.com' }
            });

            const timeline = await am.getTimeline('Task', 'TASK-001');
            expect(timeline[0].type).toBe('Share');
        });

        it('should support Version activity type', async () => {
            await am.logDocumentChange('Task', 'TASK-001', 'status', 'Old', 'New');

            const timeline = await am.getTimeline('Task', 'TASK-001');
            expect(timeline[0].type).toBe('Version');
        });

        it('should accept all ActivityType values', () => {
            const types: ActivityType[] = ['Comment', 'Like', 'Assignment', 'Share', 'Version'];
            expect(types).toHaveLength(5);
        });
    });

    // ==================== Utility Function Tests ====================

    describe('parseMentions utility function', () => {
        it('should parse simple usernames', () => {
            expect(parseMentions('@john')).toEqual(['john']);
        });

        it('should parse email addresses', () => {
            expect(parseMentions('@john@example.com')).toEqual(['john@example.com']);
        });

        it('should parse multiple mentions', () => {
            const mentions = parseMentions('@alice @bob @charlie');
            expect(mentions).toContain('alice');
            expect(mentions).toContain('bob');
            expect(mentions).toContain('charlie');
        });

        it('should handle usernames with dots and underscores', () => {
            expect(parseMentions('@john.doe')).toEqual(['john.doe']);
            expect(parseMentions('@john_doe')).toEqual(['john_doe']);
        });

        it('should return empty array for no mentions', () => {
            expect(parseMentions('No mentions here')).toEqual([]);
        });
    });
});
