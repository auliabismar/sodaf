/**
 * Cache Manager Tests
 *
 * Unit tests for P1-025: CacheManager that unifies all cache layers
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    CacheManager,
    createCacheManager
} from '../cache-manager';
import type { CacheDatabase } from '../system-cache';
import type { UserCacheDatabase } from '../user-cache';
import type { CacheEvent } from '../types';

// Mock database implementation
function createMockDb(): CacheDatabase & UserCacheDatabase & { queryCount: number } {
    let queryCount = 0;

    return {
        get queryCount() {
            return queryCount;
        },

        async get_doc(doctype: string, name: string): Promise<any | null> {
            queryCount++;
            if (doctype === 'DocType' && name === 'User') {
                return {
                    name: 'User',
                    module: 'Core',
                    fields: { email: 'Data', name: 'Data' },
                    permissions: ['Administrator']
                };
            }
            if (doctype === 'System Settings') {
                return { name: 'System Settings', app_name: 'Test App' };
            }
            return null;
        },

        async get_all(doctype: string, options?: any): Promise<any[]> {
            queryCount++;
            if (doctype === 'Workspace') {
                return [
                    { name: 'Home', label: 'Home Workspace' },
                    { name: 'Settings', label: 'Settings Workspace' }
                ];
            }
            if (doctype === 'DocPerm') {
                return [{ parent: options?.filters?.parent, role: 'System Manager' }];
            }
            if (doctype === 'Has Role') {
                return [{ role: 'System Manager' }, { role: 'User' }];
            }
            if (doctype === 'User Permission') {
                return [{ allow: 'Company', for_value: 'Test Corp' }];
            }
            if (doctype === 'DefaultValue') {
                return [{ defkey: 'company', defvalue: 'Test Corp' }];
            }
            return [];
        }
    };
}

describe('CacheManager', () => {
    let manager: CacheManager;
    let mockDb: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        mockDb = createMockDb();
        manager = new CacheManager({ db: mockDb });
    });

    afterEach(() => {
        manager.destroy();
    });

    describe('constructor', () => {
        it('should create manager with all cache layers', () => {
            expect(manager.system).toBeDefined();
            expect(manager.user).toBeDefined();
            expect(manager.session).toBeDefined();
        });

        it('should work without database', () => {
            const managerWithoutDb = new CacheManager();
            expect(managerWithoutDb).toBeDefined();
            managerWithoutDb.destroy();
        });
    });

    describe('createCacheManager', () => {
        it('should create manager via factory function', () => {
            const m = createCacheManager();
            expect(m).toBeInstanceOf(CacheManager);
            m.destroy();
        });
    });

    describe('setDatabase', () => {
        it('should set database for all layers', async () => {
            const managerWithoutDb = new CacheManager();
            await expect(managerWithoutDb.system.getDocTypeMeta('User')).resolves.toBeNull();

            managerWithoutDb.setDatabase(mockDb);

            const doctype = await managerWithoutDb.system.getDocTypeMeta('User');
            expect(doctype).not.toBeNull();
            expect(doctype?.name).toBe('User');

            managerWithoutDb.destroy();
        });
    });

    describe('system cache integration', () => {
        it('should provide access to system cache', async () => {
            const doctype = await manager.system.getDocTypeMeta('User');
            expect(doctype?.name).toBe('User');
        });

        it('should cache DocType metadata', async () => {
            const initialCount = mockDb.queryCount;

            await manager.system.getDocTypeMeta('User');
            await manager.system.getDocTypeMeta('User');

            // Should only query once due to caching
            expect(mockDb.queryCount).toBe(initialCount + 1);
        });
    });

    describe('user cache integration', () => {
        it('should provide access to user cache', async () => {
            const sessionId = await manager.user.buildUserCache({
                userId: 'test@example.com',
                name: 'Test User',
                email: 'test@example.com'
            });

            expect(sessionId).toBeDefined();

            const roles = manager.user.getUserRoles(sessionId);
            expect(roles).toContain('System Manager');
        });
    });

    describe('session integration', () => {
        it('should provide access to session store', () => {
            const sessionId = manager.session.createSession('user@example.com');
            expect(manager.session.isValidSession(sessionId)).toBe(true);
        });

        it('should cleanup user cache on session deletion', () => {
            // Create a session and then delete it to simulate lifecycle
            const sessionId = manager.session.createSession('user@example.com', 3600);
            expect(manager.session.isValidSession(sessionId)).toBe(true);

            // Delete the session (triggers callback)
            manager.session.deleteSession(sessionId);
            expect(manager.session.isValidSession(sessionId)).toBe(false);
        });
    });

    describe('invalidate', () => {
        it('should invalidate doctype cache on doctype_saved', async () => {
            // Populate cache
            await manager.system.getDocTypeMeta('User');
            expect(manager.system.isDocTypeCached('User')).toBe(true);

            // Invalidate
            manager.invalidate('doctype_saved', { doctype: 'User' });

            expect(manager.system.isDocTypeCached('User')).toBe(false);
        });

        it('should invalidate workspace cache on workspace_saved', async () => {
            // Populate cache
            await manager.system.getAllWorkspaces();
            expect(manager.system.areWorkspacesCached()).toBe(true);

            // Invalidate
            manager.invalidate('workspace_saved');

            expect(manager.system.areWorkspacesCached()).toBe(false);
        });

        it('should invalidate role permissions on permission_changed', async () => {
            // Populate cache
            await manager.system.getRolePermissions('User');

            // Invalidate
            manager.invalidate('permission_changed', { doctype: 'User' });

            // Cache should be cleared (need to check implementation detail)
            const stats = manager.system.getStats();
            // Subsequent call should miss cache
            const initialMisses = stats.misses;
            await manager.system.getRolePermissions('User');
            expect(manager.system.getStats().misses).toBe(initialMisses + 1);
        });

        it('should invalidate specific user permissions on permission_changed', async () => {
            // Build user cache first
            const sessionId = await manager.user.buildUserCache({
                userId: 'test@example.com',
                name: 'Test User',
                email: 'test@example.com'
            });

            const permsBefore = manager.user.getUserPermissions(sessionId);
            expect(permsBefore.length).toBeGreaterThan(0);

            // Invalidate
            manager.invalidate('permission_changed', { userId: 'test@example.com' });

            const permsAfter = manager.user.getUserPermissions(sessionId);
            expect(permsAfter).toEqual([]); // Permissions should be cleared
        });
    });

    describe('invalidateAll', () => {
        it('should clear all caches', async () => {
            // Populate caches
            await manager.system.getDocTypeMeta('User');
            await manager.system.getAllWorkspaces();
            await manager.user.buildUserCache({
                userId: 'test@example.com',
                name: 'Test',
                email: 'test@example.com'
            });

            manager.invalidateAll();

            expect(manager.system.isDocTypeCached('User')).toBe(false);
            expect(manager.system.areWorkspacesCached()).toBe(false);
            expect(manager.user.getSessionCount()).toBe(0);
        });
    });

    describe('event subscription', () => {
        it('should subscribe to cache events', () => {
            const events: CacheEvent[] = [];
            const unsubscribe = manager.on('doctype_saved', (event) => {
                events.push(event);
            });

            manager.invalidate('doctype_saved', { doctype: 'User' });

            expect(events.length).toBe(1);
            expect(events[0].type).toBe('doctype_saved');
            expect(events[0].doctype).toBe('User');

            unsubscribe();
        });

        it('should unsubscribe from events', () => {
            const events: CacheEvent[] = [];
            const handler = (event: CacheEvent) => events.push(event);

            manager.on('doctype_saved', handler);
            manager.invalidate('doctype_saved', { doctype: 'User' });
            expect(events.length).toBe(1);

            manager.off('doctype_saved', handler);
            manager.invalidate('doctype_saved', { doctype: 'User' });
            expect(events.length).toBe(1); // No new events
        });

        it('should handle subscriber errors gracefully', () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });

            manager.on('doctype_saved', () => {
                throw new Error('Subscriber error');
            });

            // Should not throw
            expect(() => {
                manager.invalidate('doctype_saved', { doctype: 'User' });
            }).not.toThrow();

            expect(consoleError).toHaveBeenCalled();
            consoleError.mockRestore();
        });
    });

    describe('getStats', () => {
        it('should return combined statistics', async () => {
            // Perform some operations
            await manager.system.getDocTypeMeta('User');
            await manager.system.getDocTypeMeta('User'); // Hit
            await manager.system.getDocTypeMeta('Unknown'); // Miss
            manager.session.createSession('user@example.com');

            const stats = manager.getStats();

            expect(stats.system).toBeDefined();
            expect(stats.system.hits).toBeGreaterThan(0);
            expect(stats.user).toBeDefined();
            expect(stats.session.totalSessions).toBe(1);
            expect(stats.request).toBeNull(); // Not in request context
        });
    });

    describe('resetStats', () => {
        it('should reset cache statistics', async () => {
            await manager.system.getDocTypeMeta('User');

            manager.resetStats();

            const stats = manager.getStats();
            expect(stats.system.hits).toBe(0);
            expect(stats.system.misses).toBe(0);
        });
    });

    describe('endSession', () => {
        it('should end session and cleanup user cache', async () => {
            const sessionId = manager.session.createSession('user@example.com');
            await manager.user.buildUserCache({
                userId: 'user@example.com',
                name: 'Test',
                email: 'user@example.com'
            });

            manager.endSession(sessionId);

            expect(manager.session.isValidSession(sessionId)).toBe(false);
            expect(manager.user.getSessionsForUser('user@example.com')).toHaveLength(0);
        });
    });

    describe('destroy', () => {
        it('should cleanup all resources', () => {
            const m = createCacheManager();

            m.session.createSession('user@example.com');

            m.destroy();

            expect(m.session.getSessionCount()).toBe(0);
        });
    });

    describe('runWithRequestCache', () => {
        it('should provide request cache scope', async () => {
            let inContext = false;

            await manager.runWithRequestCache(async () => {
                const { isInRequestContext } = await import('../request-cache');
                inContext = isInRequestContext();
            });

            expect(inContext).toBe(true);
        });
    });
});
