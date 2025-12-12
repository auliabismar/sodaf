/**
 * Test cases for Permission Manager
 * P3-010: Permission Manager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionManager, type PermissionManagerConfig } from '../permission-manager';
import type {
    RolePermission,
    UserPermission,
    FieldPermission,
    PermissionDocument
} from '../types';

describe('P3-010: Permission Manager', () => {
    // Default test configuration
    const createDefaultConfig = (): PermissionManagerConfig => ({
        user: 'test@example.com',
        roles: ['User'],
        rolePermissions: new Map([
            ['Sales Order', [
                {
                    role: 'User',
                    read: true,
                    write: true,
                    create: true,
                    delete: false,
                    submit: false,
                    cancel: false,
                    amend: false,
                    export: true,
                    import: false,
                    print: true,
                    email: true,
                    permlevel: 0
                },
                {
                    role: 'Sales Manager',
                    read: true,
                    write: true,
                    create: true,
                    delete: true,
                    submit: true,
                    cancel: true,
                    amend: true,
                    export: true,
                    import: true,
                    print: true,
                    email: true,
                    permlevel: 0
                }
            ]]
        ])
    });

    let pm: PermissionManager;

    beforeEach(() => {
        pm = new PermissionManager(createDefaultConfig());
    });

    describe('P3-010-T1: hasPermission(doctype, ptype)', () => {
        it('should return boolean for permission check', () => {
            const result = pm.hasPermission('Sales Order', 'read');
            expect(typeof result).toBe('boolean');
        });

        it('should return true when user has permission', () => {
            expect(pm.hasPermission('Sales Order', 'read')).toBe(true);
            expect(pm.hasPermission('Sales Order', 'write')).toBe(true);
        });

        it('should return false when user lacks permission', () => {
            expect(pm.hasPermission('Sales Order', 'delete')).toBe(false);
            expect(pm.hasPermission('Sales Order', 'submit')).toBe(false);
        });

        it('should return false for unknown doctype', () => {
            expect(pm.hasPermission('Unknown DocType', 'read')).toBe(false);
        });
    });

    describe('P3-010-T2: hasPermission for System Manager', () => {
        it('should always return true for System Manager', () => {
            const systemManagerPm = new PermissionManager({
                user: 'admin@example.com',
                roles: ['System Manager']
            });

            expect(systemManagerPm.hasPermission('Sales Order', 'read')).toBe(true);
            expect(systemManagerPm.hasPermission('Sales Order', 'write')).toBe(true);
            expect(systemManagerPm.hasPermission('Sales Order', 'delete')).toBe(true);
            expect(systemManagerPm.hasPermission('Sales Order', 'submit')).toBe(true);
            expect(systemManagerPm.hasPermission('Unknown DocType', 'read')).toBe(true);
        });
    });

    describe('P3-010-T3: canRead(doctype)', () => {
        it('should check read permission', () => {
            expect(pm.canRead('Sales Order')).toBe(true);
        });

        it('should return false when no read permission', () => {
            const limitedPm = new PermissionManager({
                user: 'test@example.com',
                roles: ['Limited User'],
                rolePermissions: new Map([
                    ['Sales Order', [{ role: 'Limited User', read: false, write: false }]]
                ])
            });
            expect(limitedPm.canRead('Sales Order')).toBe(false);
        });
    });

    describe('P3-010-T4: canWrite(doctype)', () => {
        it('should check write permission', () => {
            expect(pm.canWrite('Sales Order')).toBe(true);
        });

        it('should return false when no write permission', () => {
            const readOnlyPm = new PermissionManager({
                user: 'test@example.com',
                roles: ['Reader'],
                rolePermissions: new Map([
                    ['Sales Order', [{ role: 'Reader', read: true, write: false }]]
                ])
            });
            expect(readOnlyPm.canWrite('Sales Order')).toBe(false);
        });
    });

    describe('P3-010-T5: canCreate(doctype)', () => {
        it('should check create permission', () => {
            expect(pm.canCreate('Sales Order')).toBe(true);
        });

        it('should return false when no create permission', () => {
            const noCreatePm = new PermissionManager({
                user: 'test@example.com',
                roles: ['Viewer'],
                rolePermissions: new Map([
                    ['Sales Order', [{ role: 'Viewer', read: true, create: false }]]
                ])
            });
            expect(noCreatePm.canCreate('Sales Order')).toBe(false);
        });
    });

    describe('P3-010-T6: canDelete(doctype)', () => {
        it('should check delete permission', () => {
            expect(pm.canDelete('Sales Order')).toBe(false);
        });

        it('should return true when user has delete permission', () => {
            const managerPm = new PermissionManager({
                ...createDefaultConfig(),
                roles: ['Sales Manager']
            });
            expect(managerPm.canDelete('Sales Order')).toBe(true);
        });
    });

    describe('P3-010-T7: canSubmit(doctype)', () => {
        it('should check submit permission', () => {
            expect(pm.canSubmit('Sales Order')).toBe(false);
        });

        it('should return true for users with submit permission', () => {
            const managerPm = new PermissionManager({
                ...createDefaultConfig(),
                roles: ['Sales Manager']
            });
            expect(managerPm.canSubmit('Sales Order')).toBe(true);
        });
    });

    describe('P3-010-T8: canCancel(doctype)', () => {
        it('should check cancel permission', () => {
            expect(pm.canCancel('Sales Order')).toBe(false);
        });

        it('should return true for users with cancel permission', () => {
            const managerPm = new PermissionManager({
                ...createDefaultConfig(),
                roles: ['Sales Manager']
            });
            expect(managerPm.canCancel('Sales Order')).toBe(true);
        });
    });

    describe('P3-010-T9: canAmend(doctype)', () => {
        it('should check amend permission', () => {
            expect(pm.canAmend('Sales Order')).toBe(false);
        });

        it('should return true for users with amend permission', () => {
            const managerPm = new PermissionManager({
                ...createDefaultConfig(),
                roles: ['Sales Manager']
            });
            expect(managerPm.canAmend('Sales Order')).toBe(true);
        });
    });

    describe('P3-010-T10: canExport(doctype)', () => {
        it('should check export permission', () => {
            expect(pm.canExport('Sales Order')).toBe(true);
        });
    });

    describe('P3-010-T11: canImport(doctype)', () => {
        it('should check import permission', () => {
            expect(pm.canImport('Sales Order')).toBe(false);
        });

        it('should return true for users with import permission', () => {
            const managerPm = new PermissionManager({
                ...createDefaultConfig(),
                roles: ['Sales Manager']
            });
            expect(managerPm.canImport('Sales Order')).toBe(true);
        });
    });

    describe('P3-010-T12: canPrint(doctype)', () => {
        it('should check print permission', () => {
            expect(pm.canPrint('Sales Order')).toBe(true);
        });
    });

    describe('P3-010-T13: canEmail(doctype)', () => {
        it('should check email permission', () => {
            expect(pm.canEmail('Sales Order')).toBe(true);
        });
    });

    describe('P3-010-T14: getFieldReadPermission(doctype, field)', () => {
        it('should return permlevel for field read', () => {
            const pmWithFieldPerms = new PermissionManager({
                ...createDefaultConfig(),
                fieldPermissions: new Map([
                    ['Sales Order', [
                        { fieldname: 'amount', permlevel: 0, read: true, write: true },
                        { fieldname: 'secret_code', permlevel: 3, read: true, write: false }
                    ]]
                ])
            });

            expect(pmWithFieldPerms.getFieldReadPermission('Sales Order', 'amount')).toBe(0);
            expect(pmWithFieldPerms.getFieldReadPermission('Sales Order', 'secret_code')).toBe(3);
        });

        it('should return 0 for unknown fields', () => {
            expect(pm.getFieldReadPermission('Sales Order', 'unknown_field')).toBe(0);
        });

        it('should use doctype metadata when available', () => {
            const pmWithDocType = new PermissionManager({
                ...createDefaultConfig(),
                getDocType: (doctype) => ({
                    fields: [
                        { fieldname: 'customer', permlevel: 0 },
                        { fieldname: 'salary', permlevel: 2 }
                    ]
                })
            });

            expect(pmWithDocType.getFieldReadPermission('Sales Order', 'customer')).toBe(0);
            expect(pmWithDocType.getFieldReadPermission('Sales Order', 'salary')).toBe(2);
        });
    });

    describe('P3-010-T15: getFieldWritePermission(doctype, field)', () => {
        it('should return permlevel for field write', () => {
            const pmWithFieldPerms = new PermissionManager({
                ...createDefaultConfig(),
                fieldPermissions: new Map([
                    ['Sales Order', [
                        { fieldname: 'amount', permlevel: 0, read: true, write: true },
                        { fieldname: 'secret_code', permlevel: 3, read: true, write: true }
                    ]]
                ])
            });

            expect(pmWithFieldPerms.getFieldWritePermission('Sales Order', 'amount')).toBe(0);
            expect(pmWithFieldPerms.getFieldWritePermission('Sales Order', 'secret_code')).toBe(3);
        });
    });

    describe('P3-010-T16: canReadField(doctype, field, doc)', () => {
        it('should check field-level read permission', () => {
            const pmWithLevelPerms = new PermissionManager({
                user: 'test@example.com',
                roles: ['User'],
                rolePermissions: new Map([
                    ['Sales Order', [
                        { role: 'User', read: true, permlevel: 0 },
                        { role: 'Manager', read: true, permlevel: 3 }
                    ]]
                ]),
                fieldPermissions: new Map([
                    ['Sales Order', [
                        { fieldname: 'amount', permlevel: 0, read: true, write: true },
                        { fieldname: 'secret_code', permlevel: 3, read: true, write: false }
                    ]]
                ])
            });

            expect(pmWithLevelPerms.canReadField('Sales Order', 'amount')).toBe(true);
            expect(pmWithLevelPerms.canReadField('Sales Order', 'secret_code')).toBe(false);
        });

        it('should allow System Manager to read all fields', () => {
            const systemManagerPm = new PermissionManager({
                user: 'admin@example.com',
                roles: ['System Manager'],
                fieldPermissions: new Map([
                    ['Sales Order', [
                        { fieldname: 'secret_code', permlevel: 9, read: true, write: false }
                    ]]
                ])
            });

            expect(systemManagerPm.canReadField('Sales Order', 'secret_code')).toBe(true);
        });
    });

    describe('P3-010-T17: canWriteField(doctype, field, doc)', () => {
        it('should check field-level write permission', () => {
            const pmWithLevelPerms = new PermissionManager({
                user: 'test@example.com',
                roles: ['User'],
                rolePermissions: new Map([
                    ['Sales Order', [
                        { role: 'User', read: true, write: true, permlevel: 0 }
                    ]]
                ]),
                fieldPermissions: new Map([
                    ['Sales Order', [
                        { fieldname: 'amount', permlevel: 0, read: true, write: true },
                        { fieldname: 'secret_code', permlevel: 3, read: true, write: true }
                    ]]
                ])
            });

            expect(pmWithLevelPerms.canWriteField('Sales Order', 'amount')).toBe(true);
            expect(pmWithLevelPerms.canWriteField('Sales Order', 'secret_code')).toBe(false);
        });
    });

    describe('P3-010-T18: getPermissionQueryConditions(doctype)', () => {
        it('should return SQL WHERE clause', () => {
            const result = pm.getPermissionQueryConditions('Sales Order');

            expect(result).toHaveProperty('condition');
            expect(typeof result.condition).toBe('string');
            expect(result.doctypes).toContain('Sales Order');
        });

        it('should return 1=1 for System Manager', () => {
            const systemManagerPm = new PermissionManager({
                user: 'admin@example.com',
                roles: ['System Manager']
            });

            const result = systemManagerPm.getPermissionQueryConditions('Sales Order');
            expect(result.condition).toBe('1=1');
            expect(result.includes_owner_filter).toBe(false);
        });

        it('should return 1=0 when no read permission', () => {
            const noPermPm = new PermissionManager({
                user: 'test@example.com',
                roles: ['No Access'],
                rolePermissions: new Map([
                    ['Sales Order', [{ role: 'Other Role', read: true }]]
                ])
            });

            const result = noPermPm.getPermissionQueryConditions('Sales Order');
            expect(result.condition).toBe('1=0');
        });

        it('should include owner filter for if_owner permissions', () => {
            const ownerOnlyPm = new PermissionManager({
                user: 'test@example.com',
                roles: ['User'],
                rolePermissions: new Map([
                    ['Sales Order', [
                        { role: 'User', read: true, if_owner: true }
                    ]]
                ])
            });

            const result = ownerOnlyPm.getPermissionQueryConditions('Sales Order');
            expect(result.includes_owner_filter).toBe(true);
            expect(result.condition).toContain('owner');
        });
    });

    describe('P3-010-T19: getUserPermissions(doctype)', () => {
        it('should return user restrictions', () => {
            const pmWithUserPerms = new PermissionManager({
                ...createDefaultConfig(),
                userPermissions: [
                    {
                        user: 'test@example.com',
                        allow: 'Company',
                        for_value: 'Acme Corp'
                    },
                    {
                        user: 'test@example.com',
                        allow: 'Sales Order',
                        for_value: 'SO-001'
                    },
                    {
                        user: 'other@example.com',
                        allow: 'Sales Order',
                        for_value: 'SO-002'
                    }
                ]
            });

            const perms = pmWithUserPerms.getUserPermissions('Sales Order');
            expect(perms.length).toBe(1);
            expect(perms[0].for_value).toBe('SO-001');
        });

        it('should return all user permissions when no doctype specified', () => {
            const pmWithUserPerms = new PermissionManager({
                ...createDefaultConfig(),
                userPermissions: [
                    { user: 'test@example.com', allow: 'Company', for_value: 'Acme Corp' },
                    { user: 'test@example.com', allow: 'Sales Order', for_value: 'SO-001' }
                ]
            });

            const perms = pmWithUserPerms.getUserPermissions();
            expect(perms.length).toBe(2);
        });
    });

    describe('P3-010-T20: getUserRoles(user)', () => {
        it('should return user roles', () => {
            const roles = pm.getUserRoles();
            expect(roles).toContain('User');
        });

        it('should return current user roles when requesting own roles', () => {
            const roles = pm.getUserRoles('test@example.com');
            expect(roles).toContain('User');
        });

        it('should return empty array for other users', () => {
            const roles = pm.getUserRoles('other@example.com');
            expect(roles).toEqual([]);
        });
    });

    describe('P3-010-T21: hasRole(role)', () => {
        it('should check current user role', () => {
            expect(pm.hasRole('User')).toBe(true);
            expect(pm.hasRole('Admin')).toBe(false);
        });

        it('should check System Manager role', () => {
            const systemManagerPm = new PermissionManager({
                user: 'admin@example.com',
                roles: ['System Manager']
            });

            expect(systemManagerPm.hasRole('System Manager')).toBe(true);
        });
    });

    describe('P3-010-T22: if_owner permission', () => {
        it('should allow owner access when if_owner is set', async () => {
            const doc: PermissionDocument = {
                doctype: 'Sales Order',
                name: 'SO-001',
                owner: 'test@example.com'
            };

            const ownerOnlyPm = new PermissionManager({
                user: 'test@example.com',
                roles: ['User'],
                rolePermissions: new Map([
                    ['Sales Order', [
                        { role: 'User', read: true, write: true, if_owner: true }
                    ]]
                ]),
                getDocument: async () => doc
            });

            const result = await ownerOnlyPm.hasDocumentPermission('Sales Order', 'SO-001', 'read');
            expect(result).toBe(true);
        });

        it('should deny non-owner access when if_owner is set', async () => {
            const doc: PermissionDocument = {
                doctype: 'Sales Order',
                name: 'SO-001',
                owner: 'other@example.com'
            };

            const ownerOnlyPm = new PermissionManager({
                user: 'test@example.com',
                roles: ['User'],
                rolePermissions: new Map([
                    ['Sales Order', [
                        { role: 'User', read: true, write: true, if_owner: true }
                    ]]
                ]),
                getDocument: async () => doc
            });

            const result = await ownerOnlyPm.hasDocumentPermission('Sales Order', 'SO-001', 'read');
            expect(result).toBe(false);
        });
    });

    describe('P3-010-T23: hasDocumentPermission(doctype, name, ptype)', () => {
        it('should check doc-level permission', async () => {
            const result = await pm.hasDocumentPermission('Sales Order', 'SO-001', 'read');
            expect(typeof result).toBe('boolean');
        });

        it('should return true for System Manager', async () => {
            const systemManagerPm = new PermissionManager({
                user: 'admin@example.com',
                roles: ['System Manager']
            });

            const result = await systemManagerPm.hasDocumentPermission('Sales Order', 'SO-001', 'delete');
            expect(result).toBe(true);
        });

        it('should return false when basic permission is denied', async () => {
            const result = await pm.hasDocumentPermission('Sales Order', 'SO-001', 'delete');
            expect(result).toBe(false);
        });
    });

    describe('P3-010-T24: Permission cache', () => {
        it('should cache permission results', () => {
            // First call
            pm.hasPermission('Sales Order', 'read');
            const cacheSize1 = pm.getCacheSize();

            // Second call should use cache
            pm.hasPermission('Sales Order', 'read');
            const cacheSize2 = pm.getCacheSize();

            expect(cacheSize1).toBeGreaterThan(0);
            expect(cacheSize2).toBe(cacheSize1);
        });

        it('should cache different permission types separately', () => {
            pm.hasPermission('Sales Order', 'read');
            pm.hasPermission('Sales Order', 'write');
            pm.hasPermission('Sales Order', 'delete');

            expect(pm.getCacheSize()).toBe(3);
        });
    });

    describe('P3-010-T25: clearPermissionCache()', () => {
        it('should clear cache', () => {
            pm.hasPermission('Sales Order', 'read');
            pm.hasPermission('Sales Order', 'write');
            expect(pm.getCacheSize()).toBeGreaterThan(0);

            pm.clearPermissionCache();
            expect(pm.getCacheSize()).toBe(0);
        });
    });

    describe('P3-010-T26: getDocPermissions(doctype, doc)', () => {
        it('should return all permissions for document', () => {
            const perms = pm.getDocPermissions('Sales Order');

            expect(perms).toHaveProperty('read');
            expect(perms).toHaveProperty('write');
            expect(perms).toHaveProperty('create');
            expect(perms).toHaveProperty('delete');
            expect(perms).toHaveProperty('submit');
            expect(perms).toHaveProperty('cancel');
            expect(perms).toHaveProperty('amend');
            expect(perms).toHaveProperty('export');
            expect(perms).toHaveProperty('import');
            expect(perms).toHaveProperty('print');
            expect(perms).toHaveProperty('email');
            expect(perms).toHaveProperty('permlevel');
            expect(perms).toHaveProperty('source');
        });

        it('should return correct permission values', () => {
            const perms = pm.getDocPermissions('Sales Order');

            expect(perms.read).toBe(true);
            expect(perms.write).toBe(true);
            expect(perms.create).toBe(true);
            expect(perms.delete).toBe(false);
            expect(perms.submit).toBe(false);
            expect(perms.source).toBe('role');
        });

        it('should return all true for System Manager', () => {
            const systemManagerPm = new PermissionManager({
                user: 'admin@example.com',
                roles: ['System Manager']
            });

            const perms = systemManagerPm.getDocPermissions('Any DocType');
            expect(perms.read).toBe(true);
            expect(perms.write).toBe(true);
            expect(perms.create).toBe(true);
            expect(perms.delete).toBe(true);
            expect(perms.submit).toBe(true);
            expect(perms.cancel).toBe(true);
            expect(perms.amend).toBe(true);
            expect(perms.role).toBe('System Manager');
        });

        it('should respect if_owner when document is provided', () => {
            const ownerDoc: PermissionDocument = {
                doctype: 'Sales Order',
                name: 'SO-001',
                owner: 'test@example.com'
            };

            const nonOwnerDoc: PermissionDocument = {
                doctype: 'Sales Order',
                name: 'SO-002',
                owner: 'other@example.com'
            };

            const ownerOnlyPm = new PermissionManager({
                user: 'test@example.com',
                roles: ['User'],
                rolePermissions: new Map([
                    ['Sales Order', [
                        { role: 'User', read: true, write: true, if_owner: true }
                    ]]
                ])
            });

            const ownerPerms = ownerOnlyPm.getDocPermissions('Sales Order', ownerDoc);
            expect(ownerPerms.read).toBe(true);
            expect(ownerPerms.write).toBe(true);

            const nonOwnerPerms = ownerOnlyPm.getDocPermissions('Sales Order', nonOwnerDoc);
            expect(nonOwnerPerms.read).toBe(false);
            expect(nonOwnerPerms.write).toBe(false);
        });
    });

    describe('Additional PermissionManager functionality', () => {
        it('should support setUser to change current user', () => {
            pm.setUser('newuser@example.com', ['Sales Manager']);

            expect(pm.hasRole('Sales Manager')).toBe(true);
            expect(pm.hasRole('User')).toBe(false);
            expect(pm.canDelete('Sales Order')).toBe(true);
        });

        it('should clear cache when user changes', () => {
            pm.hasPermission('Sales Order', 'read');
            expect(pm.getCacheSize()).toBeGreaterThan(0);

            pm.setUser('other@example.com', ['User']);
            expect(pm.getCacheSize()).toBe(0);
        });

        it('should support setRolePermissions to update permissions', () => {
            pm.setRolePermissions('New DocType', [
                { role: 'User', read: true, write: true }
            ]);

            expect(pm.canRead('New DocType')).toBe(true);
            expect(pm.canWrite('New DocType')).toBe(true);
        });

        it('should support addUserPermission', () => {
            pm.addUserPermission({
                user: 'test@example.com',
                allow: 'Company',
                for_value: 'New Company'
            });

            const perms = pm.getUserPermissions('Company');
            expect(perms.length).toBe(1);
            expect(perms[0].for_value).toBe('New Company');
        });

        it('should support checkPermission for detailed result', () => {
            const result = pm.checkPermission('Sales Order', 'read');

            expect(result.allowed).toBe(true);
            expect(result.granting_role).toBe('User');
            expect(result.permlevel).toBe(0);
        });

        it('should return detailed denial reason', () => {
            const result = pm.checkPermission('Sales Order', 'delete');

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('delete');
            expect(result.reason).toContain('Sales Order');
        });
    });
});
