/**
 * System Cache Manager Tests
 *
 * Unit tests for P1-023: System Cache Manager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    SystemCacheManager,
    createSystemCache,
    type CacheDatabase
} from '../system-cache';
import type { DocType } from '../types';

/**
 * Mock database implementation for testing
 */
function createMockDb(data: {
    docTypes?: Record<string, any>;
    workspaces?: any[];
    permissions?: any[];
    systemSettings?: any;
} = {}): CacheDatabase & { queryCount: number } {
    let queryCount = 0;

    return {
        get queryCount() {
            return queryCount;
        },

        async get_doc(doctype: string, name: string): Promise<any | null> {
            queryCount++;

            if (doctype === 'DocType' && data.docTypes) {
                return data.docTypes[name] || null;
            }

            if (doctype === 'System Settings' && data.systemSettings) {
                return data.systemSettings;
            }

            return null;
        },

        async get_all(doctype: string, options?: any): Promise<any[]> {
            queryCount++;

            if (doctype === 'Workspace' && data.workspaces) {
                return data.workspaces;
            }

            if (doctype === 'DocPerm' && data.permissions) {
                const parent = options?.filters?.parent;
                if (parent) {
                    return data.permissions.filter((p: any) => p.parent === parent);
                }
                return data.permissions;
            }

            return [];
        }
    };
}

describe('SystemCacheManager', () => {
    let cache: SystemCacheManager;

    beforeEach(() => {
        cache = new SystemCacheManager();
    });

    describe('DocType Caching (P1-023-T1, P1-023-T2)', () => {
        it('P1-023-T1: getDocTypeMeta(doctype) first call - queries DB, caches result', async () => {
            const mockDocType = {
                name: 'User',
                module: 'Core',
                fields: { name: { fieldtype: 'Data' } },
                permissions: ['System Manager']
            };

            const mockDb = createMockDb({
                docTypes: { User: mockDocType }
            });

            cache.setDatabase(mockDb);

            // First call should query DB
            const result = await cache.getDocTypeMeta('User');

            expect(result).toBeDefined();
            expect(result?.name).toBe('User');
            expect(mockDb.queryCount).toBe(1);

            // Verify it's cached
            expect(cache.isDocTypeCached('User')).toBe(true);
        });

        it('P1-023-T2: getDocTypeMeta(doctype) second call - returns cached, no DB query', async () => {
            const mockDocType = {
                name: 'User',
                module: 'Core',
                fields: {},
                permissions: []
            };

            const mockDb = createMockDb({
                docTypes: { User: mockDocType }
            });

            cache.setDatabase(mockDb);

            // First call
            await cache.getDocTypeMeta('User');
            const queryCountAfterFirst = mockDb.queryCount;

            // Second call
            const result = await cache.getDocTypeMeta('User');

            expect(result).toBeDefined();
            expect(result?.name).toBe('User');
            // Query count should not increase
            expect(mockDb.queryCount).toBe(queryCountAfterFirst);
        });
    });

    describe('Workspace Caching (P1-023-T3)', () => {
        it('P1-023-T3: getAllWorkspaces() caches result', async () => {
            const mockWorkspaces = [
                { name: 'Home', content: {} },
                { name: 'Settings', content: {} }
            ];

            const mockDb = createMockDb({
                workspaces: mockWorkspaces
            });

            cache.setDatabase(mockDb);

            // First call should query DB
            const result1 = await cache.getAllWorkspaces();
            const queryCountAfterFirst = mockDb.queryCount;

            expect(Object.keys(result1).length).toBe(2);
            expect(result1['Home']).toBeDefined();
            expect(result1['Settings']).toBeDefined();

            // Second call should use cache
            const result2 = await cache.getAllWorkspaces();

            expect(result2).toEqual(result1);
            expect(mockDb.queryCount).toBe(queryCountAfterFirst);
        });
    });

    describe('Role Permissions Caching (P1-023-T4)', () => {
        it('P1-023-T4: getRolePermissions(doctype) caches', async () => {
            const mockPermissions = [
                { parent: 'User', role: 'System Manager', read: 1 },
                { parent: 'User', role: 'Administrator', read: 1 },
                { parent: 'Customer', role: 'Sales User', read: 1 }
            ];

            const mockDb = createMockDb({
                permissions: mockPermissions
            });

            cache.setDatabase(mockDb);

            // First call should query DB
            const result1 = await cache.getRolePermissions('User');
            const queryCountAfterFirst = mockDb.queryCount;

            expect(result1).toContain('System Manager');
            expect(result1).toContain('Administrator');
            expect(result1.length).toBe(2);

            // Second call should use cache
            const result2 = await cache.getRolePermissions('User');

            expect(result2).toEqual(result1);
            expect(mockDb.queryCount).toBe(queryCountAfterFirst);
        });
    });

    describe('System Settings Caching (P1-023-T5)', () => {
        it('P1-023-T5: getSystemSettings() returns cached', async () => {
            const mockSettings = {
                name: 'System Settings',
                allow_login: true,
                session_expiry: '06:00:00'
            };

            const mockDb = createMockDb({
                systemSettings: mockSettings
            });

            cache.setDatabase(mockDb);

            // First call should query DB
            const result1 = await cache.getSystemSettings();
            const queryCountAfterFirst = mockDb.queryCount;

            expect(result1.allow_login).toBe(true);

            // Second call should use cache
            const result2 = await cache.getSystemSettings();

            expect(result2).toEqual(result1);
            expect(mockDb.queryCount).toBe(queryCountAfterFirst);
        });
    });

    describe('Cache Invalidation (P1-023-T6, P1-023-T7, P1-023-T8)', () => {
        it('P1-023-T6: invalidateDocType(name) clears cache - subsequent call queries DB', async () => {
            const mockDocType = {
                name: 'User',
                module: 'Core',
                fields: {},
                permissions: []
            };

            const mockDb = createMockDb({
                docTypes: { User: mockDocType }
            });

            cache.setDatabase(mockDb);

            // Cache the DocType
            await cache.getDocTypeMeta('User');
            expect(cache.isDocTypeCached('User')).toBe(true);

            // Invalidate
            cache.invalidateDocType('User');
            expect(cache.isDocTypeCached('User')).toBe(false);

            // Next call should query DB again
            const queryCountBeforeSecond = mockDb.queryCount;
            await cache.getDocTypeMeta('User');
            expect(mockDb.queryCount).toBe(queryCountBeforeSecond + 1);
        });

        it('P1-023-T7: invalidateWorkspaces() clears cache - workspaces re-queried', async () => {
            const mockWorkspaces = [{ name: 'Home', content: {} }];

            const mockDb = createMockDb({
                workspaces: mockWorkspaces
            });

            cache.setDatabase(mockDb);

            // Cache workspaces
            await cache.getAllWorkspaces();
            expect(cache.areWorkspacesCached()).toBe(true);

            // Invalidate
            cache.invalidateWorkspaces();
            expect(cache.areWorkspacesCached()).toBe(false);

            // Next call should query DB again
            const queryCountBeforeSecond = mockDb.queryCount;
            await cache.getAllWorkspaces();
            expect(mockDb.queryCount).toBe(queryCountBeforeSecond + 1);
        });

        it('P1-023-T8: invalidateAll() clears everything', async () => {
            const mockDb = createMockDb({
                docTypes: { User: { name: 'User', module: 'Core', fields: {}, permissions: [] } },
                workspaces: [{ name: 'Home', content: {} }],
                permissions: [{ parent: 'User', role: 'Admin', read: 1 }],
                systemSettings: { allow_login: true }
            });

            cache.setDatabase(mockDb);

            // Cache everything
            await cache.getDocTypeMeta('User');
            await cache.getAllWorkspaces();
            await cache.getRolePermissions('User');
            await cache.getSystemSettings();

            expect(cache.isDocTypeCached('User')).toBe(true);
            expect(cache.areWorkspacesCached()).toBe(true);

            // Invalidate all
            cache.invalidateAll();

            expect(cache.isDocTypeCached('User')).toBe(false);
            expect(cache.areWorkspacesCached()).toBe(false);

            // Verify lastCleared is set
            const stats = cache.getStats();
            expect(stats.lastCleared).toBeDefined();
        });
    });

    describe('Cache Statistics (P1-023-T9, P1-023-T10)', () => {
        it('P1-023-T9: Cache stats tracked - hits, misses counted', async () => {
            const mockDb = createMockDb({
                docTypes: { User: { name: 'User', module: 'Core', fields: {}, permissions: [] } }
            });

            cache.setDatabase(mockDb);

            // First call - should be a miss
            await cache.getDocTypeMeta('User');
            let stats = cache.getStats();
            expect(stats.misses).toBe(1);
            expect(stats.hits).toBe(0);

            // Second call - should be a hit
            await cache.getDocTypeMeta('User');
            stats = cache.getStats();
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(1);

            // Third call - another hit
            await cache.getDocTypeMeta('User');
            stats = cache.getStats();
            expect(stats.hits).toBe(2);
            expect(stats.misses).toBe(1);
        });

        it('P1-023-T10: getStats() returns statistics - returns CacheStats object', () => {
            const stats = cache.getStats();

            expect(stats).toBeDefined();
            expect(typeof stats.hits).toBe('number');
            expect(typeof stats.misses).toBe('number');
            expect(typeof stats.size).toBe('number');
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
        });
    });

    describe('Thread-safe Access (P1-023-T11)', () => {
        it('P1-023-T11: Thread-safe access - concurrent access handled', async () => {
            const mockDb = createMockDb({
                docTypes: {
                    User: { name: 'User', module: 'Core', fields: {}, permissions: [] },
                    Customer: { name: 'Customer', module: 'CRM', fields: {}, permissions: [] }
                }
            });

            cache.setDatabase(mockDb);

            // Simulate concurrent access
            const promises = [
                cache.getDocTypeMeta('User'),
                cache.getDocTypeMeta('Customer'),
                cache.getDocTypeMeta('User'),
                cache.getDocTypeMeta('Customer')
            ];

            const results = await Promise.all(promises);

            // All results should be valid
            expect(results[0]?.name).toBe('User');
            expect(results[1]?.name).toBe('Customer');
            expect(results[2]?.name).toBe('User');
            expect(results[3]?.name).toBe('Customer');

            // Both should be cached
            expect(cache.isDocTypeCached('User')).toBe(true);
            expect(cache.isDocTypeCached('Customer')).toBe(true);
        });
    });

    describe('Memory Usage (P1-023-T12)', () => {
        it('P1-023-T12: Memory usage reasonable - large cache does not OOM', async () => {
            const largeDocTypes: Record<string, any> = {};

            // Create many DocTypes
            for (let i = 0; i < 100; i++) {
                largeDocTypes[`DocType${i}`] = {
                    name: `DocType${i}`,
                    module: 'Test',
                    fields: {
                        field1: { fieldtype: 'Data', label: 'Field 1' },
                        field2: { fieldtype: 'Int', label: 'Field 2' }
                    },
                    permissions: ['System Manager', 'Administrator']
                };
            }

            const mockDb = createMockDb({
                docTypes: largeDocTypes
            });

            cache.setDatabase(mockDb);

            // Cache all DocTypes
            for (let i = 0; i < 100; i++) {
                await cache.getDocTypeMeta(`DocType${i}`);
            }

            // Check that size is tracked
            const stats = cache.getStats();
            expect(stats.size).toBeGreaterThan(0);

            // Memory usage should be reasonable (less than 1MB for this test)
            expect(stats.size).toBeLessThan(1024 * 1024);
        });
    });

    describe('Factory Function', () => {
        it('createSystemCache creates a new instance', () => {
            const cache1 = createSystemCache();
            const cache2 = createSystemCache();

            expect(cache1).toBeInstanceOf(SystemCacheManager);
            expect(cache2).toBeInstanceOf(SystemCacheManager);
            expect(cache1).not.toBe(cache2);
        });

        it('createSystemCache accepts database and options', () => {
            const mockDb = createMockDb();
            const cache = createSystemCache(mockDb, { defaultTtl: 7200 });

            expect(cache).toBeInstanceOf(SystemCacheManager);
        });
    });

    describe('Edge Cases', () => {
        it('returns null for non-existent DocType', async () => {
            const mockDb = createMockDb({
                docTypes: {}
            });

            cache.setDatabase(mockDb);

            const result = await cache.getDocTypeMeta('NonExistent');
            expect(result).toBeNull();
        });

        it('returns empty array for DocType with no permissions', async () => {
            const mockDb = createMockDb({
                permissions: []
            });

            cache.setDatabase(mockDb);

            const result = await cache.getRolePermissions('User');
            expect(result).toEqual([]);
        });

        it('works without database (returns null/empty)', async () => {
            // No database set
            const result = await cache.getDocTypeMeta('User');
            expect(result).toBeNull();

            const workspaces = await cache.getAllWorkspaces();
            expect(workspaces).toEqual({});

            const permissions = await cache.getRolePermissions('User');
            expect(permissions).toEqual([]);

            const settings = await cache.getSystemSettings();
            expect(settings).toEqual({});
        });

        it('resetStats clears hit/miss counters', async () => {
            const mockDb = createMockDb({
                docTypes: { User: { name: 'User', module: 'Core', fields: {}, permissions: [] } }
            });

            cache.setDatabase(mockDb);

            await cache.getDocTypeMeta('User');
            await cache.getDocTypeMeta('User');

            let stats = cache.getStats();
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(1);

            cache.resetStats();

            stats = cache.getStats();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
        });

        it('manual setters work for pre-warming cache', () => {
            const docType: DocType = {
                name: 'User',
                module: 'Core',
                fields: {},
                permissions: []
            };

            cache.setDocTypeMeta('User', docType);
            expect(cache.isDocTypeCached('User')).toBe(true);

            cache.setWorkspaces({ Home: { name: 'Home' } });
            expect(cache.areWorkspacesCached()).toBe(true);

            cache.setRolePermissions('User', ['Admin']);
            const internalCache = cache.getCache();
            expect(internalCache.rolePermissions['User']).toEqual(['Admin']);

            cache.setSystemSettings({ app_name: 'Test' });
            expect(internalCache.systemSettings.app_name).toBe('Test');
        });
    });
});
