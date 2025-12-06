/**
 * Default Manager Tests
 *
 * Unit tests for P1-027: Default Values System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    DefaultManager,
    createDefaultManager,
    type DefaultDatabase,
    type DefaultScope
} from '../index';

/**
 * Mock database implementation for testing
 */
function createMockDb(): DefaultDatabase & { getStoredDefaults: () => Map<string, any> } {
    const storage = new Map<string, any>();

    const makeKey = (key: string, scope: DefaultScope, scopeId?: string): string => {
        return `${scope}:${scopeId || ''}:${key}`;
    };

    return {
        getStoredDefaults: () => storage,

        async getDefault(key: string, scope: DefaultScope, scopeId?: string): Promise<any | null> {
            const storageKey = makeKey(key, scope, scopeId);
            return storage.has(storageKey) ? storage.get(storageKey) : null;
        },

        async setDefault(key: string, value: any, scope: DefaultScope, scopeId?: string): Promise<void> {
            const storageKey = makeKey(key, scope, scopeId);
            storage.set(storageKey, value);
        },

        async getDefaults(scope: DefaultScope, scopeId?: string): Promise<Record<string, any>> {
            const prefix = `${scope}:${scopeId || ''}:`;
            const result: Record<string, any> = {};

            for (const [storageKey, value] of storage.entries()) {
                if (storageKey.startsWith(prefix)) {
                    const key = storageKey.slice(prefix.length);
                    result[key] = value;
                }
            }

            return result;
        },

        async clearDefault(key: string, scope: DefaultScope, scopeId?: string): Promise<boolean> {
            const storageKey = makeKey(key, scope, scopeId);
            return storage.delete(storageKey);
        }
    };
}

describe('DefaultManager', () => {
    let manager: DefaultManager;
    let mockDb: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        mockDb = createMockDb();
        manager = new DefaultManager({
            userId: 'testuser@example.com',
            userRoles: ['Sales User', 'Stock User']
        });
        manager.setDatabase(mockDb);
    });

    describe('Global Defaults (P1-027-T1)', () => {
        it('P1-027-T1: setDefault("Company", "ABC Corp") global - default stored for all users', async () => {
            await manager.setDefault('Company', 'ABC Corp');

            // Verify stored in database
            const stored = mockDb.getStoredDefaults();
            expect(stored.has('global::Company')).toBe(true);
            expect(stored.get('global::Company')).toBe('ABC Corp');
        });
    });

    describe('User-specific Defaults (P1-027-T2)', () => {
        it('P1-027-T2: setDefault("Company", "XYZ Inc", user) - user-specific default stored', async () => {
            await manager.setDefault('Company', 'XYZ Inc', 'user@example.com');

            // Verify stored with user scope
            const stored = mockDb.getStoredDefaults();
            expect(stored.has('user:user@example.com:Company')).toBe(true);
            expect(stored.get('user:user@example.com:Company')).toBe('XYZ Inc');
        });
    });

    describe('Default Resolution with User Override (P1-027-T3)', () => {
        it('P1-027-T3: getDefault("Company") with user default - returns user value', async () => {
            // Set global default
            await manager.setDefault('Company', 'ABC Corp');

            // Set user default for current user
            await manager.setDefault('Company', 'XYZ Inc', 'testuser@example.com');

            // Should return user value
            const result = await manager.getDefault('Company');
            expect(result).toBe('XYZ Inc');
        });
    });

    describe('Global Default Fallback (P1-027-T4)', () => {
        it('P1-027-T4: getDefault("Company") global only - returns global value', async () => {
            // Only set global default
            await manager.setDefault('Company', 'ABC Corp');

            // Should return global value
            const result = await manager.getDefault('Company');
            expect(result).toBe('ABC Corp');
        });
    });

    describe('Unknown Default (P1-027-T5)', () => {
        it('P1-027-T5: getDefault("Unknown") - returns undefined', async () => {
            const result = await manager.getDefault('Unknown');
            expect(result).toBeUndefined();
        });
    });

    describe('Get All Defaults (P1-027-T6)', () => {
        it('P1-027-T6: getDefaults(user) - returns all user defaults', async () => {
            // Set global defaults
            await manager.setDefault('Company', 'ABC Corp');
            await manager.setDefault('Currency', 'USD');

            // Set user defaults
            await manager.setDefault('Warehouse', 'Main', 'testuser@example.com');

            // Set session default
            manager.setSessionDefault('Territory', 'North');

            // Get all defaults
            const defaults = await manager.getDefaults();

            expect(defaults.Company).toBe('ABC Corp');
            expect(defaults.Currency).toBe('USD');
            expect(defaults.Warehouse).toBe('Main');
            expect(defaults.Territory).toBe('North');
        });
    });

    describe('Clear Default (P1-027-T7)', () => {
        it('P1-027-T7: clearDefault("Company", user) - removes user default', async () => {
            // Set user default
            await manager.setDefault('Company', 'XYZ Inc', 'testuser@example.com');

            // Verify it exists
            let value = await mockDb.getDefault('Company', 'user', 'testuser@example.com');
            expect(value).toBe('XYZ Inc');

            // Clear it
            const result = await manager.clearDefault('Company', 'testuser@example.com');
            expect(result).toBe(true);

            // Verify it's gone
            value = await mockDb.getDefault('Company', 'user', 'testuser@example.com');
            expect(value).toBeNull();
        });
    });

    describe('Session Defaults (P1-027-T8)', () => {
        it('P1-027-T8: setSessionDefault("Warehouse", "Main") - session default set', () => {
            manager.setSessionDefault('Warehouse', 'Main');

            expect(manager.getSessionDefault('Warehouse')).toBe('Main');
            expect(manager.hasSessionDefault('Warehouse')).toBe(true);
        });
    });

    describe('Session Overrides User (P1-027-T9)', () => {
        it('P1-027-T9: Session default overrides user - resolution order correct', async () => {
            // Set user default
            await manager.setDefault('Warehouse', 'Secondary', 'testuser@example.com');

            // Set session default
            manager.setSessionDefault('Warehouse', 'Main');

            // Session should take priority
            const result = await manager.getDefault('Warehouse');
            expect(result).toBe('Main');
        });
    });

    describe('Role Default Hierarchy (P1-027-T10)', () => {
        it('P1-027-T10: Role default hierarchy - role defaults applied', async () => {
            // Set global default
            await manager.setDefault('Warehouse', 'Global Warehouse');

            // Set role default (for current user's role)
            await manager.setRoleDefault('Warehouse', 'Sales Warehouse', 'Sales User');

            // Role default should take priority over global
            const result = await manager.getDefault('Warehouse');
            expect(result).toBe('Sales Warehouse');
        });
    });

    describe('Full Hierarchy Resolution (P1-027-T11)', () => {
        it('P1-027-T11: resolveDefault() full hierarchy - Session > User > Role > Global', async () => {
            // Set all levels
            await manager.setDefault('Warehouse', 'Global Warehouse'); // Global
            await manager.setRoleDefault('Warehouse', 'Role Warehouse', 'Sales User'); // Role
            await manager.setDefault('Warehouse', 'User Warehouse', 'testuser@example.com'); // User
            manager.setSessionDefault('Warehouse', 'Session Warehouse'); // Session

            // Session takes priority
            let result = await manager.resolveDefault('Warehouse');
            expect(result).toBe('Session Warehouse');

            // Clear session, user takes priority
            manager.clearSessionDefault('Warehouse');
            result = await manager.resolveDefault('Warehouse');
            expect(result).toBe('User Warehouse');

            // Clear user, role takes priority
            await manager.clearDefault('Warehouse', 'testuser@example.com');
            result = await manager.resolveDefault('Warehouse');
            expect(result).toBe('Role Warehouse');

            // Clear role, global is returned
            await manager.clearRoleDefault('Warehouse', 'Sales User');
            result = await manager.resolveDefault('Warehouse');
            expect(result).toBe('Global Warehouse');
        });
    });

    describe('Clear Session Defaults (P1-027-T12)', () => {
        it('P1-027-T12: Clear session defaults - session cleared', () => {
            // Set session defaults
            manager.setSessionDefault('Warehouse', 'Main');
            manager.setSessionDefault('Company', 'ABC Corp');

            // Verify they exist
            expect(manager.hasSessionDefault('Warehouse')).toBe(true);
            expect(manager.hasSessionDefault('Company')).toBe(true);

            // Clear all session defaults
            manager.clearSessionDefaults();

            // Verify they're gone
            expect(manager.hasSessionDefault('Warehouse')).toBe(false);
            expect(manager.hasSessionDefault('Company')).toBe(false);
            expect(Object.keys(manager.getSessionDefaults()).length).toBe(0);
        });
    });

    describe('Factory Function', () => {
        it('createDefaultManager creates instance with database', () => {
            const db = createMockDb();
            const mgr = createDefaultManager(db, { userId: 'user@example.com' });

            expect(mgr).toBeInstanceOf(DefaultManager);
            expect(mgr.getCurrentUserId()).toBe('user@example.com');
        });

        it('createDefaultManager works without database', () => {
            const mgr = createDefaultManager();

            expect(mgr).toBeInstanceOf(DefaultManager);
        });
    });

    describe('User Context', () => {
        it('setUserContext updates user and roles', () => {
            manager.setUserContext('newuser@example.com', ['Admin', 'Manager']);

            expect(manager.getCurrentUserId()).toBe('newuser@example.com');
            expect(manager.getCurrentUserRoles()).toEqual(['Admin', 'Manager']);
        });
    });

    describe('Edge Cases', () => {
        it('works without database (session defaults only)', async () => {
            const mgr = new DefaultManager();

            // Set session default
            mgr.setSessionDefault('Company', 'ABC Corp');

            // Get default works
            const result = await mgr.getDefault('Company');
            expect(result).toBe('ABC Corp');

            // Get all defaults works
            const defaults = await mgr.getDefaults();
            expect(defaults.Company).toBe('ABC Corp');
        });

        it('setDefault does nothing without database', async () => {
            const mgr = new DefaultManager();

            // Should not throw
            await mgr.setDefault('Company', 'ABC Corp');

            // Verify nothing is stored (no database)
            const result = await mgr.getDefault('Company');
            expect(result).toBeUndefined();
        });

        it('clearDefault returns false without database', async () => {
            const mgr = new DefaultManager();

            const result = await mgr.clearDefault('Company');
            expect(result).toBe(false);
        });

        it('first role match wins in role resolution', async () => {
            // Set different values for different roles
            await manager.setRoleDefault('DepartmentCode', 'SALES', 'Sales User');
            await manager.setRoleDefault('DepartmentCode', 'STOCK', 'Stock User');

            // Since user has ['Sales User', 'Stock User'], Sales User is checked first
            const result = await manager.getDefault('DepartmentCode');
            expect(result).toBe('SALES');
        });
    });
});
