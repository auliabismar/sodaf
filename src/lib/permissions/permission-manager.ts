/**
 * Permission Manager
 * 
 * P3-010: Implement PermissionManager for checking permissions.
 * Provides comprehensive permission checking for doctypes, fields, and documents.
 */

import type {
    PermissionType,
    PermLevel,
    UserPermission,
    FieldPermission,
    PermissionDocument,
    PermissionCheckContext,
    PermissionCheckResult,
    PermissionQueryCondition,
    EffectivePermission,
    RolePermission
} from './types';

/**
 * Configuration for PermissionManager
 */
export interface PermissionManagerConfig {
    /** Current user email/ID */
    user: string;

    /** User's assigned roles */
    roles: string[];

    /** Role permissions by doctype */
    rolePermissions?: Map<string, RolePermission[]>;

    /** User permissions (restrictions) */
    userPermissions?: UserPermission[];

    /** Field permissions by doctype */
    fieldPermissions?: Map<string, FieldPermission[]>;

    /** Function to get document by name */
    getDocument?: (doctype: string, name: string) => Promise<PermissionDocument | null>;

    /** Function to get doctype metadata (for field info) */
    getDocType?: (doctype: string) => { fields?: Array<{ fieldname: string; permlevel?: number }> } | null;
}

/**
 * Cache key generator for permission results
 */
function getCacheKey(doctype: string, ptype: PermissionType, docName?: string): string {
    return docName ? `${doctype}:${ptype}:${docName}` : `${doctype}:${ptype}`;
}

/**
 * PermissionManager class for checking permissions
 * 
 * Provides methods for:
 * - DocType-level permission checks (read, write, create, delete, etc.)
 * - Field-level permission checks based on permlevel
 * - Document-level permission checks (including if_owner)
 * - User permission restrictions
 * - SQL query conditions for filtering
 * - Permission caching
 */
export class PermissionManager {
    private user: string;
    private roles: string[];
    private rolePermissions: Map<string, RolePermission[]>;
    private userPermissions: UserPermission[];
    private fieldPermissions: Map<string, FieldPermission[]>;
    private getDocument?: (doctype: string, name: string) => Promise<PermissionDocument | null>;
    private getDocType?: (doctype: string) => { fields?: Array<{ fieldname: string; permlevel?: number }> } | null;

    /** Permission cache */
    private cache: Map<string, boolean> = new Map();

    /** System Manager role name */
    private static readonly SYSTEM_MANAGER_ROLE = 'System Manager';

    constructor(config: PermissionManagerConfig) {
        this.user = config.user;
        this.roles = config.roles;
        this.rolePermissions = config.rolePermissions ?? new Map();
        this.userPermissions = config.userPermissions ?? [];
        this.fieldPermissions = config.fieldPermissions ?? new Map();
        this.getDocument = config.getDocument;
        this.getDocType = config.getDocType;
    }

    /**
     * Check if System Manager role is present
     */
    private isSystemManager(): boolean {
        return this.roles.includes(PermissionManager.SYSTEM_MANAGER_ROLE);
    }

    /**
     * Get role permissions for a doctype
     */
    private getRolePermissionsForDoctype(doctype: string): RolePermission[] {
        return this.rolePermissions.get(doctype) ?? [];
    }

    /**
     * Check if user has a specific permission for a doctype
     * P3-010-T1: Returns boolean
     * P3-010-T2: System Manager always returns true
     */
    hasPermission(doctype: string, ptype: PermissionType): boolean {
        // System Manager has all permissions
        if (this.isSystemManager()) {
            return true;
        }

        // Check cache first
        const cacheKey = getCacheKey(doctype, ptype);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        // Get permissions for this doctype
        const permissions = this.getRolePermissionsForDoctype(doctype);

        // Check if any role has the required permission
        const hasPermission = permissions.some(perm => {
            // Check if user has this role
            if (!this.roles.includes(perm.role)) {
                return false;
            }

            // Check if this permission type is granted
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (perm as any)[ptype] === true;
        });

        // Cache the result
        this.cache.set(cacheKey, hasPermission);

        return hasPermission;
    }

    /**
     * Check read permission
     * P3-010-T3
     */
    canRead(doctype: string): boolean {
        return this.hasPermission(doctype, 'read');
    }

    /**
     * Check write permission
     * P3-010-T4
     */
    canWrite(doctype: string): boolean {
        return this.hasPermission(doctype, 'write');
    }

    /**
     * Check create permission
     * P3-010-T5
     */
    canCreate(doctype: string): boolean {
        return this.hasPermission(doctype, 'create');
    }

    /**
     * Check delete permission
     * P3-010-T6
     */
    canDelete(doctype: string): boolean {
        return this.hasPermission(doctype, 'delete');
    }

    /**
     * Check submit permission
     * P3-010-T7
     */
    canSubmit(doctype: string): boolean {
        return this.hasPermission(doctype, 'submit');
    }

    /**
     * Check cancel permission
     * P3-010-T8
     */
    canCancel(doctype: string): boolean {
        return this.hasPermission(doctype, 'cancel');
    }

    /**
     * Check amend permission
     * P3-010-T9
     */
    canAmend(doctype: string): boolean {
        return this.hasPermission(doctype, 'amend');
    }

    /**
     * Check export permission
     * P3-010-T10
     */
    canExport(doctype: string): boolean {
        return this.hasPermission(doctype, 'export');
    }

    /**
     * Check import permission
     * P3-010-T11
     */
    canImport(doctype: string): boolean {
        return this.hasPermission(doctype, 'import');
    }

    /**
     * Check print permission
     * P3-010-T12
     */
    canPrint(doctype: string): boolean {
        return this.hasPermission(doctype, 'print');
    }

    /**
     * Check email permission
     * P3-010-T13
     */
    canEmail(doctype: string): boolean {
        return this.hasPermission(doctype, 'email');
    }

    /**
     * Get the permlevel required to read a field
     * P3-010-T14
     */
    getFieldReadPermission(doctype: string, fieldname: string): PermLevel {
        const fieldPerms = this.fieldPermissions.get(doctype) ?? [];
        const fieldPerm = fieldPerms.find(fp => fp.fieldname === fieldname);

        if (fieldPerm && fieldPerm.read) {
            return fieldPerm.permlevel;
        }

        // Try to get from doctype metadata
        if (this.getDocType) {
            const doctypeInfo = this.getDocType(doctype);
            const field = doctypeInfo?.fields?.find(f => f.fieldname === fieldname);
            if (field && field.permlevel !== undefined) {
                return field.permlevel as PermLevel;
            }
        }

        // Default to level 0 (base access)
        return 0;
    }

    /**
     * Get the permlevel required to write a field
     * P3-010-T15
     */
    getFieldWritePermission(doctype: string, fieldname: string): PermLevel {
        const fieldPerms = this.fieldPermissions.get(doctype) ?? [];
        const fieldPerm = fieldPerms.find(fp => fp.fieldname === fieldname);

        if (fieldPerm && fieldPerm.write) {
            return fieldPerm.permlevel;
        }

        // Try to get from doctype metadata
        if (this.getDocType) {
            const doctypeInfo = this.getDocType(doctype);
            const field = doctypeInfo?.fields?.find(f => f.fieldname === fieldname);
            if (field && field.permlevel !== undefined) {
                return field.permlevel as PermLevel;
            }
        }

        // Default to level 0 (base access)
        return 0;
    }

    /**
     * Check if user has permission at a specific permlevel
     * The role's permlevel must be >= the required level to access fields at that level
     */
    private hasPermissionAtLevel(doctype: string, ptype: PermissionType, requiredLevel: PermLevel): boolean {
        // System Manager has all permissions at all levels
        if (this.isSystemManager()) {
            return true;
        }

        const permissions = this.getRolePermissionsForDoctype(doctype);

        return permissions.some(perm => {
            // Check if user has this role
            if (!this.roles.includes(perm.role)) {
                return false;
            }

            // Check permission level - role's permlevel must be >= required level
            const roleLevel = (perm.permlevel ?? 0) as PermLevel;
            if (roleLevel < requiredLevel) {
                return false;
            }

            // Check if this permission type is granted
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (perm as any)[ptype] === true;
        });
    }

    /**
     * Check if user can read a specific field
     * P3-010-T16
     */
    canReadField(doctype: string, fieldname: string, doc?: PermissionDocument): boolean {
        // System Manager can read all fields
        if (this.isSystemManager()) {
            return true;
        }

        // Get required permlevel for this field
        const requiredLevel = this.getFieldReadPermission(doctype, fieldname);

        // Check if user has read permission at this level
        if (!this.hasPermissionAtLevel(doctype, 'read', requiredLevel)) {
            return false;
        }

        // If doc provided, check if_owner
        if (doc) {
            const permissions = this.getRolePermissionsForDoctype(doctype);
            const applicablePerms = permissions.filter(p =>
                this.roles.includes(p.role) &&
                p.read === true &&
                (p.permlevel ?? 0) <= requiredLevel
            );

            // If all applicable permissions require owner, check ownership
            const allRequireOwner = applicablePerms.every(p => p.if_owner === true);
            if (allRequireOwner && applicablePerms.length > 0) {
                return doc.owner === this.user;
            }
        }

        return true;
    }

    /**
     * Check if user can write to a specific field
     * P3-010-T17
     */
    canWriteField(doctype: string, fieldname: string, doc?: PermissionDocument): boolean {
        // System Manager can write all fields
        if (this.isSystemManager()) {
            return true;
        }

        // Get required permlevel for this field
        const requiredLevel = this.getFieldWritePermission(doctype, fieldname);

        // Check if user has write permission at this level
        if (!this.hasPermissionAtLevel(doctype, 'write', requiredLevel)) {
            return false;
        }

        // If doc provided, check if_owner
        if (doc) {
            const permissions = this.getRolePermissionsForDoctype(doctype);
            const applicablePerms = permissions.filter(p =>
                this.roles.includes(p.role) &&
                p.write === true &&
                (p.permlevel ?? 0) <= requiredLevel
            );

            // If all applicable permissions require owner, check ownership
            const allRequireOwner = applicablePerms.every(p => p.if_owner === true);
            if (allRequireOwner && applicablePerms.length > 0) {
                return doc.owner === this.user;
            }
        }

        return true;
    }

    /**
     * Get SQL WHERE clause conditions for permission-based filtering
     * P3-010-T18
     */
    getPermissionQueryConditions(doctype: string): PermissionQueryCondition {
        // System Manager has no restrictions
        if (this.isSystemManager()) {
            return {
                condition: '1=1',
                includes_owner_filter: false,
                doctypes: [doctype]
            };
        }

        const conditions: string[] = [];
        const values: Record<string, unknown> = {};
        let includesOwnerFilter = false;

        // Check role-based permissions
        const permissions = this.getRolePermissionsForDoctype(doctype);
        const applicablePerms = permissions.filter(p =>
            this.roles.includes(p.role) && p.read === true
        );

        if (applicablePerms.length === 0) {
            // No read permission at all
            return {
                condition: '1=0',
                includes_owner_filter: false,
                doctypes: [doctype]
            };
        }

        // Check if any permission requires owner
        const hasOwnerOnlyPerms = applicablePerms.some(p => p.if_owner === true);
        const hasFullPerms = applicablePerms.some(p => !p.if_owner);

        if (hasOwnerOnlyPerms && !hasFullPerms) {
            // Only owner-based permissions
            conditions.push('owner = :owner');
            values.owner = this.user;
            includesOwnerFilter = true;
        }

        // Add user permission restrictions
        const userPerms = this.getUserPermissions(doctype);
        if (userPerms.length > 0) {
            const allowedValues = userPerms
                .filter(up => up.allow === doctype || up.applicable_for === doctype)
                .map(up => up.for_value);

            if (allowedValues.length > 0) {
                conditions.push(`name IN (:allowed_values)`);
                values.allowed_values = allowedValues;
            }
        }

        // Build final condition
        const finalCondition = conditions.length > 0
            ? conditions.join(' AND ')
            : '1=1';

        return {
            condition: finalCondition,
            values: Object.keys(values).length > 0 ? values : undefined,
            includes_owner_filter: includesOwnerFilter,
            doctypes: [doctype]
        };
    }

    /**
     * Get user permissions (restrictions) for a doctype
     * P3-010-T19
     */
    getUserPermissions(doctype?: string): UserPermission[] {
        if (!doctype) {
            return this.userPermissions.filter(up => up.user === this.user);
        }

        return this.userPermissions.filter(up =>
            up.user === this.user &&
            (up.allow === doctype || up.applicable_for === doctype)
        );
    }

    /**
     * Get roles for a user
     * P3-010-T20
     */
    getUserRoles(user?: string): string[] {
        // If no user specified or same user, return current roles
        if (!user || user === this.user) {
            return [...this.roles];
        }

        // For other users, we would need to look up their roles
        // This implementation only knows about the current user
        return [];
    }

    /**
     * Check if current user has a specific role
     * P3-010-T21
     */
    hasRole(role: string): boolean {
        return this.roles.includes(role);
    }

    /**
     * Check if user has permission on a specific document
     * P3-010-T22: if_owner permission check
     * P3-010-T23: Document-level permission
     */
    async hasDocumentPermission(
        doctype: string,
        name: string,
        ptype: PermissionType
    ): Promise<boolean> {
        // System Manager has all permissions
        if (this.isSystemManager()) {
            return true;
        }

        // First check basic doctype permission
        if (!this.hasPermission(doctype, ptype)) {
            return false;
        }

        // Get the document to check ownership
        let doc: PermissionDocument | null = null;
        if (this.getDocument) {
            doc = await this.getDocument(doctype, name);
        }

        if (!doc) {
            // Document not found - allow if has basic permission
            return true;
        }

        // Check if_owner permissions
        const permissions = this.getRolePermissionsForDoctype(doctype);
        const applicablePerms = permissions.filter(p =>
            this.roles.includes(p.role) &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (p as any)[ptype] === true
        );

        // If any permission doesn't require owner, allow
        const hasNonOwnerPerm = applicablePerms.some(p => !p.if_owner);
        if (hasNonOwnerPerm) {
            return true;
        }

        // All permissions require owner - check ownership
        if (applicablePerms.length > 0) {
            return doc.owner === this.user;
        }

        return false;
    }

    /**
     * Get all effective permissions for a document
     * P3-010-T26
     */
    getDocPermissions(doctype: string, doc?: PermissionDocument): EffectivePermission {
        const isSystemManager = this.isSystemManager();
        const permissions = this.getRolePermissionsForDoctype(doctype);

        // Aggregate permissions from all applicable roles
        let read = false, write = false, create = false;
        let deleteP = false, submit = false, cancel = false;
        let amend = false, report = false, exportP = false;
        let importP = false, share = false, print = false;
        let email = false, select = false;
        let grantingRole: string | undefined;
        let ifOwner = false;

        if (isSystemManager) {
            // System Manager has all permissions
            read = write = create = deleteP = submit = cancel = true;
            amend = report = exportP = importP = share = print = email = select = true;
            grantingRole = PermissionManager.SYSTEM_MANAGER_ROLE;
        } else {
            for (const perm of permissions) {
                if (!this.roles.includes(perm.role)) continue;

                // Check ownership if if_owner is set
                if (perm.if_owner && doc && doc.owner !== this.user) {
                    continue;
                }

                if (perm.read) read = true;
                if (perm.write) write = true;
                if (perm.create) create = true;
                if (perm.delete) deleteP = true;
                if (perm.submit) submit = true;
                if (perm.cancel) cancel = true;
                if (perm.amend) amend = true;
                if (perm.report) report = true;
                if (perm.export) exportP = true;
                if (perm.import) importP = true;
                if (perm.share) share = true;
                if (perm.print) print = true;
                if (perm.email) email = true;
                if (perm.select) select = true;

                if (!grantingRole && (perm.read || perm.write)) {
                    grantingRole = perm.role;
                }

                if (perm.if_owner) {
                    ifOwner = true;
                }
            }
        }

        return {
            read,
            write,
            create,
            delete: deleteP,
            submit,
            cancel,
            amend,
            report,
            export: exportP,
            import: importP,
            share,
            print,
            email,
            select,
            permlevel: 0,
            source: 'role',
            role: grantingRole,
            if_owner: ifOwner
        };
    }

    /**
     * Check permission and return detailed result
     */
    checkPermission(
        doctype: string,
        permission: PermissionType,
        doc?: PermissionDocument,
        context?: PermissionCheckContext
    ): PermissionCheckResult {
        const isSystemManager = this.isSystemManager();

        if (isSystemManager) {
            return {
                allowed: true,
                granting_role: PermissionManager.SYSTEM_MANAGER_ROLE,
                permlevel: 0
            };
        }

        const permissions = this.getRolePermissionsForDoctype(doctype);

        for (const perm of permissions) {
            if (!this.roles.includes(perm.role)) continue;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!(perm as any)[permission]) continue;

            // Check ownership if if_owner is set
            if (perm.if_owner && doc && doc.owner !== this.user) {
                continue;
            }

            // Check permlevel if context specifies
            const permLevel = (perm.permlevel ?? 0) as PermLevel;
            if (context?.permlevel !== undefined && permLevel > context.permlevel) {
                continue;
            }

            return {
                allowed: true,
                granting_role: perm.role,
                permlevel: permLevel,
                is_owner_match: perm.if_owner && doc?.owner === this.user
            };
        }

        return {
            allowed: false,
            reason: `No ${permission} permission for ${doctype}`
        };
    }

    /**
     * Clear permission cache
     * P3-010-T24: Permission cache exists
     * P3-010-T25: Clear cache
     */
    clearPermissionCache(): void {
        this.cache.clear();
    }

    /**
     * Get current cache size (for testing)
     */
    getCacheSize(): number {
        return this.cache.size;
    }

    /**
     * Update current user
     */
    setUser(user: string, roles: string[]): void {
        this.user = user;
        this.roles = roles;
        this.clearPermissionCache();
    }

    /**
     * Add or update role permissions for a doctype
     */
    setRolePermissions(doctype: string, permissions: RolePermission[]): void {
        this.rolePermissions.set(doctype, permissions);
        this.clearPermissionCache();
    }

    /**
     * Add user permission restriction
     */
    addUserPermission(permission: UserPermission): void {
        this.userPermissions.push(permission);
    }

    /**
     * Set field permissions for a doctype
     */
    setFieldPermissions(doctype: string, permissions: FieldPermission[]): void {
        this.fieldPermissions.set(doctype, permissions);
    }
}
