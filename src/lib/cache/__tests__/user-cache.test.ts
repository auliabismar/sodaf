/**
 * User Cache Manager Tests
 *
 * Unit tests for P1-024: User Cache Manager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    UserCacheManager,
    createUserCache,
    type UserCacheDatabase,
    type UserInfo
} from '../user-cache';

/**
 * Mock database implementation for testing
 */
function createMockDb(data: {
    roles?: any[];
    permissions?: any[];
    workspaces?: any[];
    defaults?: any[];
} = {}): UserCacheDatabase & { queryCount: number } {
    let queryCount = 0;

    return {
        get queryCount() {
            return queryCount;
        },

        async get_doc(doctype: string, name: string): Promise<any | null> {
            queryCount++;
            return null;
        },

        async get_all(doctype: string, options?: any): Promise<any[]> {
            queryCount++;

            if (doctype === 'Has Role' && data.roles) {
                const parent = options?.filters?.parent;
                if (parent) {
                    return data.roles.filter((r: any) => r.parent === parent);
                }
                return data.roles;
            }

            if (doctype === 'User Permission' && data.permissions) {
                const user = options?.filters?.user;
                if (user) {
                    return data.permissions.filter((p: any) => p.user === user);
                }
                return data.permissions;
            }

            if (doctype === 'Workspace' && data.workspaces) {
                return data.workspaces;
            }

            if (doctype === 'DefaultValue' && data.defaults) {
                const parent = options?.filters?.parent;
                if (parent) {
                    return data.defaults.filter((d: any) => d.parent === parent);
                }
                return data.defaults;
            }

            return [];
        }
    };
}

describe('UserCacheManager', () => {
    let userCache: UserCacheManager;

    beforeEach(() => {
        userCache = new UserCacheManager();
    });

    describe('Build User Cache (P1-024-T1)', () => {
        it('P1-024-T1: buildUserCache(user) populates cache - roles, permissions, workspaces loaded', async () => {
            const mockDb = createMockDb({
                roles: [
                    { parent: 'user@example.com', role: 'System Manager' },
                    { parent: 'user@example.com', role: 'Administrator' }
                ],
                permissions: [
                    { user: 'user@example.com', allow: 'User', for_value: 'user@example.com' }
                ],
                workspaces: [
                    { name: 'Home' },
                    { name: 'Settings' }
                ],
                defaults: [
                    { parent: 'user@example.com', defkey: 'Company', defvalue: 'Test Corp' }
                ]
            });

            userCache.setDatabase(mockDb);

            const user: UserInfo = {
                userId: 'user@example.com',
                name: 'Test User',
                email: 'user@example.com'
            };

            const sessionId = await userCache.buildUserCache(user);

            expect(sessionId).toBeDefined();
            expect(sessionId).toMatch(/^session_/);

            const cache = userCache.getUserCache(sessionId);
            expect(cache).toBeDefined();
            expect(cache?.user.userId).toBe('user@example.com');
            expect(cache?.roles).toContain('System Manager');
            expect(cache?.roles).toContain('Administrator');
            expect(cache?.visibleWorkspaces).toContain('Home');
            expect(cache?.defaults.Company).toBe('Test Corp');
        });
    });

    describe('Get User Cache (P1-024-T2)', () => {
        it('P1-024-T2: getUserCache(sessionId) returns cache - returns UserSessionCache', async () => {
            const mockDb = createMockDb({
                roles: [{ parent: 'user@example.com', role: 'User' }]
            });

            userCache.setDatabase(mockDb);

            const sessionId = await userCache.buildUserCache({
                userId: 'user@example.com',
                name: 'Test User',
                email: 'user@example.com'
            });

            const cache = userCache.getUserCache(sessionId);

            expect(cache).toBeDefined();
            expect(cache?.user.userId).toBe('user@example.com');
            expect(cache?.user.name).toBe('Test User');
            expect(cache?.user.email).toBe('user@example.com');
        });

        it('returns null for non-existent session', () => {
            const cache = userCache.getUserCache('non-existent');
            expect(cache).toBeNull();
        });
    });

    describe('Get User Roles (P1-024-T3)', () => {
        it('P1-024-T3: getUserRoles(sessionId) returns roles - no DB query', async () => {
            const mockDb = createMockDb({
                roles: [
                    { parent: 'user@example.com', role: 'Admin' },
                    { parent: 'user@example.com', role: 'User' }
                ]
            });

            userCache.setDatabase(mockDb);

            const sessionId = await userCache.buildUserCache({
                userId: 'user@example.com',
                name: 'Test User',
                email: 'user@example.com'
            });

            const queryCountBefore = mockDb.queryCount;

            const roles = userCache.getUserRoles(sessionId);

            expect(roles).toContain('Admin');
            expect(roles).toContain('User');
            expect(roles.length).toBe(2);

            // No additional DB queries
            expect(mockDb.queryCount).toBe(queryCountBefore);
        });

        it('returns empty array for non-existent session', () => {
            const roles = userCache.getUserRoles('non-existent');
            expect(roles).toEqual([]);
        });
    });

    describe('Get User Permissions (P1-024-T4)', () => {
        it('P1-024-T4: getUserPermissions(sessionId) returns perms - no DB query', async () => {
            const mockDb = createMockDb({
                roles: [{ parent: 'user@example.com', role: 'User' }],
                permissions: [
                    { user: 'user@example.com', allow: 'Customer', for_value: 'CUST-001' },
                    { user: 'user@example.com', allow: 'Territory', for_value: 'West' }
                ]
            });

            userCache.setDatabase(mockDb);

            const sessionId = await userCache.buildUserCache({
                userId: 'user@example.com',
                name: 'Test User',
                email: 'user@example.com'
            });

            const queryCountBefore = mockDb.queryCount;

            const permissions = userCache.getUserPermissions(sessionId);

            expect(permissions).toContain('Customer:CUST-001');
            expect(permissions).toContain('Territory:West');
            expect(mockDb.queryCount).toBe(queryCountBefore);
        });
    });

    describe('Get Visible Workspaces (P1-024-T5)', () => {
        it('P1-024-T5: getVisibleWorkspaces(sessionId) returns list - pre-filtered workspaces', async () => {
            const mockDb = createMockDb({
                roles: [{ parent: 'user@example.com', role: 'User' }],
                workspaces: [
                    { name: 'Home' },
                    { name: 'CRM' },
                    { name: 'Settings' }
                ]
            });

            userCache.setDatabase(mockDb);

            const sessionId = await userCache.buildUserCache({
                userId: 'user@example.com',
                name: 'Test User',
                email: 'user@example.com'
            });

            const queryCountBefore = mockDb.queryCount;

            const workspaces = userCache.getVisibleWorkspaces(sessionId);

            expect(workspaces).toContain('Home');
            expect(workspaces).toContain('CRM');
            expect(workspaces.length).toBe(3);
            expect(mockDb.queryCount).toBe(queryCountBefore);
        });
    });

    describe('Get User Defaults (P1-024-T6)', () => {
        it('P1-024-T6: getUserDefaults(sessionId) returns defaults - default values cached', async () => {
            const mockDb = createMockDb({
                roles: [{ parent: 'user@example.com', role: 'User' }],
                defaults: [
                    { parent: 'user@example.com', defkey: 'Company', defvalue: 'ABC Corp' },
                    { parent: 'user@example.com', defkey: 'Currency', defvalue: 'USD' }
                ]
            });

            userCache.setDatabase(mockDb);

            const sessionId = await userCache.buildUserCache({
                userId: 'user@example.com',
                name: 'Test User',
                email: 'user@example.com'
            });

            const queryCountBefore = mockDb.queryCount;

            const defaults = userCache.getUserDefaults(sessionId);

            expect(defaults.Company).toBe('ABC Corp');
            expect(defaults.Currency).toBe('USD');
            expect(mockDb.queryCount).toBe(queryCountBefore);
        });
    });

    describe('Invalidate User Cache (P1-024-T7)', () => {
        it('P1-024-T7: invalidateUserCache(user) clears cache - user cache cleared', async () => {
            const mockDb = createMockDb({
                roles: [{ parent: 'user@example.com', role: 'User' }]
            });

            userCache.setDatabase(mockDb);

            const sessionId = await userCache.buildUserCache({
                userId: 'user@example.com',
                name: 'Test User',
                email: 'user@example.com'
            });

            expect(userCache.hasSession(sessionId)).toBe(true);

            userCache.invalidateUserCache('user@example.com');

            expect(userCache.hasSession(sessionId)).toBe(false);
            expect(userCache.getUserCache(sessionId)).toBeNull();
        });
    });

    describe('Invalidate User Permissions (P1-024-T8)', () => {
        it('P1-024-T8: invalidateUserPermissions(user) partial clear - only permissions cleared', async () => {
            const mockDb = createMockDb({
                roles: [{ parent: 'user@example.com', role: 'Admin' }],
                permissions: [
                    { user: 'user@example.com', allow: 'Customer', for_value: 'CUST-001' }
                ]
            });

            userCache.setDatabase(mockDb);

            const sessionId = await userCache.buildUserCache({
                userId: 'user@example.com',
                name: 'Test User',
                email: 'user@example.com'
            });

            // Verify permissions exist
            let permissions = userCache.getUserPermissions(sessionId);
            expect(permissions.length).toBe(1);

            // Invalidate only permissions
            userCache.invalidateUserPermissions('user@example.com');

            // Cache still exists
            expect(userCache.hasSession(sessionId)).toBe(true);

            // Roles still cached
            const roles = userCache.getUserRoles(sessionId);
            expect(roles).toContain('Admin');

            // Permissions cleared
            permissions = userCache.getUserPermissions(sessionId);
            expect(permissions.length).toBe(0);
        });
    });

    describe('Multiple Sessions Per User (P1-024-T10)', () => {
        it('P1-024-T10: Multiple sessions per user - each session has own cache', async () => {
            const mockDb = createMockDb({
                roles: [{ parent: 'user@example.com', role: 'User' }]
            });

            userCache.setDatabase(mockDb);

            const user: UserInfo = {
                userId: 'user@example.com',
                name: 'Test User',
                email: 'user@example.com'
            };

            // Create multiple sessions
            const session1 = await userCache.buildUserCache(user);
            const session2 = await userCache.buildUserCache(user);
            const session3 = await userCache.buildUserCache(user);

            // All sessions should be different
            expect(session1).not.toBe(session2);
            expect(session2).not.toBe(session3);

            // All sessions should be valid
            expect(userCache.hasSession(session1)).toBe(true);
            expect(userCache.hasSession(session2)).toBe(true);
            expect(userCache.hasSession(session3)).toBe(true);

            // Get sessions for user
            const sessions = userCache.getSessionsForUser('user@example.com');
            expect(sessions.length).toBe(3);
            expect(sessions).toContain(session1);
            expect(sessions).toContain(session2);
            expect(sessions).toContain(session3);
        });
    });

    describe('Clear All User Caches (P1-024-T11)', () => {
        it('P1-024-T11: clearAllUserCaches() clears all - all user caches cleared', async () => {
            const mockDb = createMockDb({
                roles: [
                    { parent: 'user1@example.com', role: 'User' },
                    { parent: 'user2@example.com', role: 'Admin' }
                ]
            });

            userCache.setDatabase(mockDb);

            const session1 = await userCache.buildUserCache({
                userId: 'user1@example.com',
                name: 'User 1',
                email: 'user1@example.com'
            });

            const session2 = await userCache.buildUserCache({
                userId: 'user2@example.com',
                name: 'User 2',
                email: 'user2@example.com'
            });

            expect(userCache.getSessionCount()).toBe(2);

            userCache.clearAllUserCaches();

            expect(userCache.getSessionCount()).toBe(0);
            expect(userCache.hasSession(session1)).toBe(false);
            expect(userCache.hasSession(session2)).toBe(false);

            // Verify lastCleared is set
            const stats = userCache.getStats();
            expect(stats.lastCleared).toBeDefined();
        });
    });

    describe('Cache Size Limit (P1-024-T12)', () => {
        it('P1-024-T12: Cache size limit - old sessions evicted', async () => {
            // Create cache with limit of 3 sessions
            userCache = new UserCacheManager(undefined, { maxSessions: 3 });

            const mockDb = createMockDb({
                roles: [{ parent: 'user@example.com', role: 'User' }]
            });

            userCache.setDatabase(mockDb);

            const sessions: string[] = [];

            // Create 4 sessions (1 over limit)
            for (let i = 0; i < 4; i++) {
                const sessionId = await userCache.buildUserCache({
                    userId: `user${i}@example.com`,
                    name: `User ${i}`,
                    email: `user${i}@example.com`
                });
                sessions.push(sessionId);
            }

            // Should only have 3 sessions
            expect(userCache.getSessionCount()).toBe(3);

            // First session should be evicted
            expect(userCache.hasSession(sessions[0])).toBe(false);

            // Later sessions should still exist
            expect(userCache.hasSession(sessions[1])).toBe(true);
            expect(userCache.hasSession(sessions[2])).toBe(true);
            expect(userCache.hasSession(sessions[3])).toBe(true);
        });
    });

    describe('Statistics Tracking', () => {
        it('tracks cache hits and misses', async () => {
            const mockDb = createMockDb({
                roles: [{ parent: 'user@example.com', role: 'User' }]
            });

            userCache.setDatabase(mockDb);

            const sessionId = await userCache.buildUserCache({
                userId: 'user@example.com',
                name: 'Test User',
                email: 'user@example.com'
            });

            // Initial stats
            let stats = userCache.getStats();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);

            // Hit
            userCache.getUserRoles(sessionId);
            stats = userCache.getStats();
            expect(stats.hits).toBe(1);

            // Miss
            userCache.getUserRoles('non-existent');
            stats = userCache.getStats();
            expect(stats.misses).toBe(1);

            // Reset stats
            userCache.resetStats();
            stats = userCache.getStats();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
        });
    });

    describe('Factory Function', () => {
        it('createUserCache creates a new instance', () => {
            const cache1 = createUserCache();
            const cache2 = createUserCache();

            expect(cache1).toBeInstanceOf(UserCacheManager);
            expect(cache2).toBeInstanceOf(UserCacheManager);
            expect(cache1).not.toBe(cache2);
        });

        it('createUserCache accepts database and options', () => {
            const mockDb = createMockDb();
            const cache = createUserCache(mockDb, { defaultTtl: 7200 });

            expect(cache).toBeInstanceOf(UserCacheManager);
        });
    });

    describe('Edge Cases', () => {
        it('works without database (returns empty data)', async () => {
            const sessionId = await userCache.buildUserCache({
                userId: 'user@example.com',
                name: 'Test User',
                email: 'user@example.com'
            });

            const cache = userCache.getUserCache(sessionId);
            expect(cache).toBeDefined();
            expect(cache?.roles).toEqual([]);
            expect(cache?.userPermissions).toEqual([]);
            expect(cache?.visibleWorkspaces).toEqual([]);
            expect(cache?.defaults).toEqual({});
        });

        it('removeSession removes specific session', async () => {
            const mockDb = createMockDb({
                roles: [{ parent: 'user@example.com', role: 'User' }]
            });

            userCache.setDatabase(mockDb);

            const session1 = await userCache.buildUserCache({
                userId: 'user@example.com',
                name: 'Test User',
                email: 'user@example.com'
            });

            const session2 = await userCache.buildUserCache({
                userId: 'user@example.com',
                name: 'Test User',
                email: 'user@example.com'
            });

            userCache.removeSession(session1);

            expect(userCache.hasSession(session1)).toBe(false);
            expect(userCache.hasSession(session2)).toBe(true);
        });
    });
});
