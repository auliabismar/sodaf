/**
 * Request Cache Tests
 *
 * Unit tests for P1-025: Request Cache using AsyncLocalStorage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    runWithRequestCache,
    runWithRequestCacheSync,
    cacheForRequest,
    getFromRequest,
    hasInRequest,
    deleteFromRequest,
    clearRequestCache,
    getRequestCacheStats,
    getRequestCacheSize,
    isInRequestContext,
    getOrSetForRequest,
    getOrSetForRequestSync
} from '../request-cache';

describe('Request Cache', () => {
    describe('runWithRequestCache', () => {
        it('should create isolated scope for async function', async () => {
            let insideContext = false;

            await runWithRequestCache(async () => {
                insideContext = isInRequestContext();
            });

            expect(insideContext).toBe(true);
        });

        it('should return the result of the function', async () => {
            const result = await runWithRequestCache(async () => {
                return 'test-result';
            });

            expect(result).toBe('test-result');
        });

        it('should isolate cache between requests', async () => {
            await runWithRequestCache(async () => {
                cacheForRequest('key1', 'value1');
            });

            await runWithRequestCache(async () => {
                // Cache from previous request should not be visible
                expect(getFromRequest('key1')).toBeUndefined();
            });
        });

        it('should clear cache after request completes', async () => {
            await runWithRequestCache(async () => {
                cacheForRequest('temp-key', 'temp-value');
                expect(getFromRequest('temp-key')).toBe('temp-value');
            });

            // Outside request context, cache should be gone
            expect(isInRequestContext()).toBe(false);
            expect(getFromRequest('temp-key')).toBeUndefined();
        });
    });

    describe('runWithRequestCacheSync', () => {
        it('should create isolated scope for sync function', () => {
            let insideContext = false;

            runWithRequestCacheSync(() => {
                insideContext = isInRequestContext();
            });

            expect(insideContext).toBe(true);
        });

        it('should return the result of the function', () => {
            const result = runWithRequestCacheSync(() => {
                return 42;
            });

            expect(result).toBe(42);
        });
    });

    describe('cacheForRequest', () => {
        it('should store value in cache', async () => {
            await runWithRequestCache(async () => {
                const stored = cacheForRequest('test-key', 'test-value');
                expect(stored).toBe(true);
            });
        });

        it('should return false when not in request context', () => {
            const stored = cacheForRequest('key', 'value');
            expect(stored).toBe(false);
        });

        it('should update stats on set', async () => {
            await runWithRequestCache(async () => {
                cacheForRequest('key1', 'value1');
                cacheForRequest('key2', 'value2');

                const stats = getRequestCacheStats();
                expect(stats?.sets).toBe(2);
            });
        });
    });

    describe('getFromRequest', () => {
        it('should return cached value', async () => {
            await runWithRequestCache(async () => {
                cacheForRequest('my-key', { data: 'test' });
                const result = getFromRequest<{ data: string }>('my-key');
                expect(result).toEqual({ data: 'test' });
            });
        });

        it('should return undefined for missing key', async () => {
            await runWithRequestCache(async () => {
                const result = getFromRequest('non-existent');
                expect(result).toBeUndefined();
            });
        });

        it('should return undefined when not in request context', () => {
            const result = getFromRequest('key');
            expect(result).toBeUndefined();
        });

        it('should track cache hits', async () => {
            await runWithRequestCache(async () => {
                cacheForRequest('key', 'value');
                getFromRequest('key');
                getFromRequest('key');

                const stats = getRequestCacheStats();
                expect(stats?.hits).toBe(2);
            });
        });

        it('should track cache misses', async () => {
            await runWithRequestCache(async () => {
                getFromRequest('missing1');
                getFromRequest('missing2');

                const stats = getRequestCacheStats();
                expect(stats?.misses).toBe(2);
            });
        });
    });

    describe('hasInRequest', () => {
        it('should return true for existing key', async () => {
            await runWithRequestCache(async () => {
                cacheForRequest('exists', 'value');
                expect(hasInRequest('exists')).toBe(true);
            });
        });

        it('should return false for missing key', async () => {
            await runWithRequestCache(async () => {
                expect(hasInRequest('missing')).toBe(false);
            });
        });

        it('should return false when not in context', () => {
            expect(hasInRequest('key')).toBe(false);
        });
    });

    describe('deleteFromRequest', () => {
        it('should delete existing key', async () => {
            await runWithRequestCache(async () => {
                cacheForRequest('to-delete', 'value');
                const deleted = deleteFromRequest('to-delete');
                expect(deleted).toBe(true);
                expect(hasInRequest('to-delete')).toBe(false);
            });
        });

        it('should return false for missing key', async () => {
            await runWithRequestCache(async () => {
                const deleted = deleteFromRequest('non-existent');
                expect(deleted).toBe(false);
            });
        });

        it('should return false when not in context', () => {
            expect(deleteFromRequest('key')).toBe(false);
        });
    });

    describe('clearRequestCache', () => {
        it('should clear all entries', async () => {
            await runWithRequestCache(async () => {
                cacheForRequest('key1', 'value1');
                cacheForRequest('key2', 'value2');
                cacheForRequest('key3', 'value3');

                clearRequestCache();

                expect(getRequestCacheSize()).toBe(0);
                expect(hasInRequest('key1')).toBe(false);
            });
        });

        it('should return false when not in context', () => {
            expect(clearRequestCache()).toBe(false);
        });
    });

    describe('getRequestCacheStats', () => {
        it('should return stats with all fields', async () => {
            await runWithRequestCache(async () => {
                cacheForRequest('k1', 'v1');  // 1 set
                getFromRequest('k1');          // 1 hit
                getFromRequest('missing');     // 1 miss

                const stats = getRequestCacheStats();
                expect(stats).toEqual({
                    hits: 1,
                    misses: 1,
                    sets: 1
                });
            });
        });

        it('should return null when not in context', () => {
            expect(getRequestCacheStats()).toBeNull();
        });
    });

    describe('getRequestCacheSize', () => {
        it('should return number of cached entries', async () => {
            await runWithRequestCache(async () => {
                expect(getRequestCacheSize()).toBe(0);

                cacheForRequest('k1', 'v1');
                expect(getRequestCacheSize()).toBe(1);

                cacheForRequest('k2', 'v2');
                expect(getRequestCacheSize()).toBe(2);
            });
        });

        it('should return 0 when not in context', () => {
            expect(getRequestCacheSize()).toBe(0);
        });
    });

    describe('isInRequestContext', () => {
        it('should return false outside request', () => {
            expect(isInRequestContext()).toBe(false);
        });

        it('should return true inside request', async () => {
            await runWithRequestCache(async () => {
                expect(isInRequestContext()).toBe(true);
            });
        });
    });

    describe('getOrSetForRequest', () => {
        it('should return cached value if exists', async () => {
            await runWithRequestCache(async () => {
                cacheForRequest('cached', 'original');

                let factoryCalled = false;
                const result = await getOrSetForRequest('cached', async () => {
                    factoryCalled = true;
                    return 'new-value';
                });

                expect(result).toBe('original');
                expect(factoryCalled).toBe(false);
            });
        });

        it('should call factory and cache result if not exists', async () => {
            await runWithRequestCache(async () => {
                let factoryCalled = false;
                const result = await getOrSetForRequest('new-key', async () => {
                    factoryCalled = true;
                    return 'generated-value';
                });

                expect(result).toBe('generated-value');
                expect(factoryCalled).toBe(true);
                expect(getFromRequest('new-key')).toBe('generated-value');
            });
        });

        it('should return undefined when not in context', async () => {
            const result = await getOrSetForRequest('key', async () => 'value');
            expect(result).toBeUndefined();
        });
    });

    describe('getOrSetForRequestSync', () => {
        it('should return cached value if exists', () => {
            runWithRequestCacheSync(() => {
                cacheForRequest('sync-cached', 'cached-value');

                let called = false;
                const result = getOrSetForRequestSync('sync-cached', () => {
                    called = true;
                    return 'new';
                });

                expect(result).toBe('cached-value');
                expect(called).toBe(false);
            });
        });

        it('should call factory and cache result if not exists', () => {
            runWithRequestCacheSync(() => {
                const result = getOrSetForRequestSync('sync-new', () => 'sync-generated');

                expect(result).toBe('sync-generated');
                expect(getFromRequest('sync-new')).toBe('sync-generated');
            });
        });
    });

    describe('Practical use cases', () => {
        it('should cache permission check per request', async () => {
            let dbCalls = 0;

            const checkPermission = async (user: string, resource: string): Promise<boolean> => {
                const cacheKey = `permission:${user}:${resource}`;
                return await getOrSetForRequest(cacheKey, async () => {
                    dbCalls++;
                    // Simulate DB call
                    return user === 'admin';
                }) ?? false;
            };

            await runWithRequestCache(async () => {
                // First call - should hit "DB"
                const result1 = await checkPermission('admin', 'users');
                expect(result1).toBe(true);
                expect(dbCalls).toBe(1);

                // Second call - should use cache
                const result2 = await checkPermission('admin', 'users');
                expect(result2).toBe(true);
                expect(dbCalls).toBe(1); // No additional DB call
            });
        });

        it('should cache link lookup per request', async () => {
            let lookupCalls = 0;

            const lookupUser = async (userId: string): Promise<{ name: string }> => {
                const cacheKey = `user:${userId}`;
                return await getOrSetForRequest(cacheKey, async () => {
                    lookupCalls++;
                    return { name: `User ${userId}` };
                }) ?? { name: 'Unknown' };
            };

            await runWithRequestCache(async () => {
                await lookupUser('123');
                await lookupUser('123');
                await lookupUser('123');

                expect(lookupCalls).toBe(1); // Only one lookup despite 3 calls
            });
        });
    });
});
