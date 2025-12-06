/**
 * Session Store Tests
 *
 * Unit tests for P1-024: Session Store
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    SessionStore,
    createSessionStore
} from '../session-store';

describe('SessionStore', () => {
    let store: SessionStore;

    beforeEach(() => {
        // Disable automatic cleanup for predictable tests
        store = new SessionStore({ cleanupInterval: 0 });
    });

    afterEach(() => {
        store.destroy();
    });

    describe('Session CRUD', () => {
        it('creates a new session', () => {
            const sessionId = store.createSession('user@example.com');

            expect(sessionId).toBeDefined();
            expect(sessionId).toMatch(/^sess_/);
            expect(store.getSessionCount()).toBe(1);
        });

        it('gets session data', () => {
            const sessionId = store.createSession('user@example.com');
            const session = store.getSession(sessionId);

            expect(session).toBeDefined();
            expect(session?.userId).toBe('user@example.com');
            expect(session?.roles).toEqual([]);
            expect(session?.permissions).toEqual([]);
        });

        it('updates session data', () => {
            const sessionId = store.createSession('user@example.com');

            const updated = store.updateSession(sessionId, {
                roles: ['Admin'],
                activeWorkspace: 'Home'
            });

            expect(updated).toBe(true);

            const session = store.getSession(sessionId);
            expect(session?.roles).toEqual(['Admin']);
            expect(session?.activeWorkspace).toBe('Home');
        });

        it('deletes a session', () => {
            const sessionId = store.createSession('user@example.com');

            expect(store.getSessionCount()).toBe(1);

            const deleted = store.deleteSession(sessionId);

            expect(deleted).toBe(true);
            expect(store.getSessionCount()).toBe(0);
            expect(store.getSession(sessionId)).toBeNull();
        });

        it('returns false when deleting non-existent session', () => {
            const deleted = store.deleteSession('non-existent');
            expect(deleted).toBe(false);
        });

        it('returns null for non-existent session', () => {
            const session = store.getSession('non-existent');
            expect(session).toBeNull();
        });
    });

    describe('Session Timeout (P1-024-T9)', () => {
        it('P1-024-T9: Session timeout clears cache - expired session removed', () => {
            // Create session that expires immediately
            const sessionId = store.createSession('user@example.com', -1); // -1 second = already expired

            // Session should be null when retrieved
            const session = store.getSession(sessionId);
            expect(session).toBeNull();

            // Stats should show expiration
            const stats = store.getStats();
            expect(stats.sessionsExpired).toBe(1);
        });

        it('session expiration calls onSessionExpire callback', () => {
            const onExpire = vi.fn();
            store = new SessionStore({ cleanupInterval: 0, onSessionExpire: onExpire });

            // Create session that expires immediately
            const sessionId = store.createSession('user@example.com', -1);

            // Trigger expiration check
            store.getSession(sessionId);

            expect(onExpire).toHaveBeenCalledWith(sessionId, 'user@example.com');
        });
    });

    describe('Cache Size Limit (P1-024-T12)', () => {
        it('P1-024-T12: Cache size limit - old sessions evicted', () => {
            store = new SessionStore({ maxSessions: 3, cleanupInterval: 0 });

            const sessions: string[] = [];

            // Create 4 sessions (1 over limit)
            for (let i = 0; i < 4; i++) {
                const sessionId = store.createSession(`user${i}@example.com`);
                sessions.push(sessionId);
            }

            // Should only have 3 sessions
            expect(store.getSessionCount()).toBe(3);

            // First session should be evicted
            expect(store.isValidSession(sessions[0])).toBe(false);

            // Later sessions should still exist
            expect(store.isValidSession(sessions[1])).toBe(true);
            expect(store.isValidSession(sessions[2])).toBe(true);
            expect(store.isValidSession(sessions[3])).toBe(true);
        });

        it('setMaxSessions evicts excess sessions', () => {
            const sessions: string[] = [];

            // Create 5 sessions
            for (let i = 0; i < 5; i++) {
                const sessionId = store.createSession(`user${i}@example.com`);
                sessions.push(sessionId);
            }

            expect(store.getSessionCount()).toBe(5);

            // Reduce limit
            store.setMaxSessions(2);

            expect(store.getSessionCount()).toBe(2);
        });
    });

    describe('Session Expiry Management', () => {
        it('cleanupExpiredSessions removes expired sessions', () => {
            // Create mix of valid and expired sessions
            store.createSession('user1@example.com', 3600); // Valid
            store.createSession('user2@example.com', -1);   // Expired
            store.createSession('user3@example.com', -1);   // Expired

            expect(store.getSessionCount()).toBe(3);

            const cleaned = store.cleanupExpiredSessions();

            expect(cleaned).toBe(2);
            expect(store.getSessionCount()).toBe(1);
        });

        it('extendSession extends expiry time', () => {
            const sessionId = store.createSession('user@example.com', 60); // 60 seconds

            const session1 = store.getSession(sessionId);
            const originalExpiry = session1?.expiresAt.getTime() || 0;

            const extended = store.extendSession(sessionId, 3600); // Add 1 hour

            expect(extended).toBe(true);

            const session2 = store.getSession(sessionId);
            const newExpiry = session2?.expiresAt.getTime() || 0;

            expect(newExpiry).toBeGreaterThan(originalExpiry);
        });

        it('extendSession returns false for non-existent session', () => {
            const extended = store.extendSession('non-existent', 3600);
            expect(extended).toBe(false);
        });
    });

    describe('Per-User Session Tracking', () => {
        it('getSessionsByUser returns all sessions for user', () => {
            const session1 = store.createSession('user@example.com');
            const session2 = store.createSession('user@example.com');
            store.createSession('other@example.com');

            const sessions = store.getSessionsByUser('user@example.com');

            expect(sessions.length).toBe(2);
            expect(sessions).toContain(session1);
            expect(sessions).toContain(session2);
        });

        it('returns empty array for user with no sessions', () => {
            const sessions = store.getSessionsByUser('nobody@example.com');
            expect(sessions).toEqual([]);
        });
    });

    describe('Session Validation', () => {
        it('isValidSession returns true for valid session', () => {
            const sessionId = store.createSession('user@example.com');
            expect(store.isValidSession(sessionId)).toBe(true);
        });

        it('isValidSession returns false for non-existent session', () => {
            expect(store.isValidSession('non-existent')).toBe(false);
        });

        it('isValidSession returns false for expired session', () => {
            const sessionId = store.createSession('user@example.com', -1);
            expect(store.isValidSession(sessionId)).toBe(false);
        });
    });

    describe('Clear All Sessions', () => {
        it('clearAllSessions removes all sessions', () => {
            store.createSession('user1@example.com');
            store.createSession('user2@example.com');
            store.createSession('user3@example.com');

            expect(store.getSessionCount()).toBe(3);

            store.clearAllSessions();

            expect(store.getSessionCount()).toBe(0);
        });

        it('clearAllSessions calls onSessionExpire for each session', () => {
            const onExpire = vi.fn();
            store = new SessionStore({ cleanupInterval: 0, onSessionExpire: onExpire });

            store.createSession('user1@example.com');
            store.createSession('user2@example.com');

            store.clearAllSessions();

            expect(onExpire).toHaveBeenCalledTimes(2);
        });
    });

    describe('Statistics', () => {
        it('tracks session statistics', () => {
            const sessionId = store.createSession('user@example.com');

            let stats = store.getStats();
            expect(stats.sessionsCreated).toBe(1);
            expect(stats.totalSessions).toBe(1);

            store.deleteSession(sessionId);

            stats = store.getStats();
            expect(stats.sessionsDeleted).toBe(1);
            expect(stats.totalSessions).toBe(0);
        });

        it('tracks expired sessions', () => {
            const sessionId = store.createSession('user@example.com', -1);

            // Trigger expiration
            store.getSession(sessionId);

            const stats = store.getStats();
            expect(stats.sessionsExpired).toBe(1);
        });
    });

    describe('Session Preferences', () => {
        it('stores user preferences', () => {
            const sessionId = store.createSession('user@example.com', undefined, {
                theme: 'dark',
                language: 'en'
            });

            const session = store.getSession(sessionId);

            expect(session?.preferences.theme).toBe('dark');
            expect(session?.preferences.language).toBe('en');
        });
    });

    describe('Factory Function', () => {
        it('createSessionStore creates a new instance', () => {
            const store1 = createSessionStore({ cleanupInterval: 0 });
            const store2 = createSessionStore({ cleanupInterval: 0 });

            expect(store1).toBeInstanceOf(SessionStore);
            expect(store2).toBeInstanceOf(SessionStore);
            expect(store1).not.toBe(store2);

            store1.destroy();
            store2.destroy();
        });

        it('createSessionStore accepts options', () => {
            const tempStore = createSessionStore({
                defaultExpiry: 7200,
                maxSessions: 500,
                cleanupInterval: 0
            });

            expect(tempStore).toBeInstanceOf(SessionStore);
            tempStore.destroy();
        });
    });

    describe('Cleanup Timer', () => {
        it('stopCleanupTimer stops the timer', () => {
            const timerStore = new SessionStore({ cleanupInterval: 100 });

            // This should not throw
            timerStore.stopCleanupTimer();
            timerStore.stopCleanupTimer(); // Call again to test idempotence

            timerStore.destroy();
        });
    });
});
