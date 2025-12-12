/**
 * Permission Types and Interfaces
 * 
 * P3-009: Define comprehensive TypeScript interfaces for permissions.
 * Builds on P2-001 DocPerm for role-based permissions.
 */

// Re-export DocPerm from P2-001 as the base RolePermission
export type { DocPerm as RolePermission } from '../meta/doctype/types';

/**
 * Union type of all 14 permission types
 */
export type PermissionType =
    | 'read'      // View documents
    | 'write'     // Update documents
    | 'create'    // Create new documents
    | 'delete'    // Delete documents
    | 'submit'    // Submit documents
    | 'cancel'    // Cancel submitted documents
    | 'amend'     // Amend cancelled documents
    | 'report'    // Generate reports
    | 'export'    // Export documents
    | 'import'    // Import documents
    | 'share'     // Share documents with others
    | 'print'     // Print documents
    | 'email'     // Email documents
    | 'select';   // Select in Link fields

/**
 * Permission level type (0-9)
 * Level 0 is the base level with most access
 * Higher levels have more restricted access
 */
export type PermLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * User Permission interface for user-level document restrictions
 * Allows restricting which documents a user can access
 */
export interface UserPermission {
    /** Name of the UserPermission record */
    name?: string;

    /** User to whom this permission applies */
    user: string;

    /** DocType this permission restricts */
    allow: string;

    /** Specific document name to allow access to */
    for_value: string;

    /** Whether to apply to all children of this document */
    apply_to_all_children?: boolean;

    /** DocType this applies to (for Link field restrictions) */
    applicable_for?: string;

    /** Whether this is a default permission */
    is_default?: boolean;

    /** Whether to hide descendant documents */
    hide_descendants?: boolean;
}

/**
 * Field Permission interface for permlevel-based field access control
 * Controls read/write access to specific fields
 */
export interface FieldPermission {
    /** Field name */
    fieldname: string;

    /** Permission level for this field (0-9) */
    permlevel: PermLevel;

    /** Whether the field is readable at this permlevel */
    read: boolean;

    /** Whether the field is writable at this permlevel */
    write: boolean;
}

/**
 * Document for which permissions are being checked
 */
export interface PermissionDocument {
    /** Document type */
    doctype: string;

    /** Document name */
    name?: string;

    /** Document owner */
    owner?: string;

    /** Document status (0=Draft, 1=Submitted, 2=Cancelled) */
    docstatus?: 0 | 1 | 2;

    /** Parent document name (for child tables) */
    parent?: string;

    /** Parent document type */
    parenttype?: string;
}

/**
 * Permission check context
 */
export interface PermissionCheckContext {
    /** Current user */
    user: string;

    /** User's roles */
    roles: string[];

    /** Permission level being checked */
    permlevel?: PermLevel;

    /** Whether to check owner-only permissions */
    check_owner?: boolean;

    /** Whether to throw on permission denied */
    throw_on_deny?: boolean;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
    /** Whether permission is granted */
    allowed: boolean;

    /** Reason for denial if not allowed */
    reason?: string;

    /** Role that granted permission (if allowed) */
    granting_role?: string;

    /** Permission level at which permission was granted */
    permlevel?: PermLevel;

    /** Whether permission was granted due to ownership */
    is_owner_match?: boolean;
}

/**
 * Function signature type for permission check functions
 * @param doctype - Document type to check
 * @param permission - Permission type to check
 * @param doc - Document being checked (optional)
 * @param context - Permission check context
 * @returns Permission check result
 */
export type PermissionCheck = (
    doctype: string,
    permission: PermissionType,
    doc?: PermissionDocument,
    context?: PermissionCheckContext
) => PermissionCheckResult | Promise<PermissionCheckResult>;

/**
 * SQL WHERE clause condition for permission-based queries
 * Used to filter documents based on user permissions
 */
export interface PermissionQueryCondition {
    /** SQL WHERE clause string */
    condition: string;

    /** Parameter values for the condition */
    values?: Record<string, unknown>;

    /** Whether this condition includes owner-based filtering */
    includes_owner_filter?: boolean;

    /** DocTypes involved in the condition */
    doctypes?: string[];
}

/**
 * Permission query builder type
 * Returns SQL conditions for filtering documents
 */
export type PermissionQueryBuilder = (
    doctype: string,
    user: string,
    permission?: PermissionType
) => PermissionQueryCondition | Promise<PermissionQueryCondition>;

/**
 * Share permission for document sharing
 */
export interface SharePermission {
    /** Share record name */
    name?: string;

    /** DocType being shared */
    share_doctype: string;

    /** Document name being shared */
    share_name: string;

    /** User being shared with */
    user: string;

    /** Whether user can read */
    read: boolean;

    /** Whether user can write */
    write: boolean;

    /** Whether user can share with others */
    share: boolean;

    /** Whether user is the owner of the share (can revoke) */
    everyone?: boolean;
}

/**
 * Effective permission after combining role, user, and share permissions
 */
export interface EffectivePermission {
    /** All permission flags */
    read: boolean;
    write: boolean;
    create: boolean;
    delete: boolean;
    submit: boolean;
    cancel: boolean;
    amend: boolean;
    report: boolean;
    export: boolean;
    import: boolean;
    share: boolean;
    print: boolean;
    email: boolean;
    select: boolean;

    /** Permission level */
    permlevel: PermLevel;

    /** Source of the permission (role, share, user) */
    source: 'role' | 'share' | 'user';

    /** Role that provided base permission */
    role?: string;

    /** Whether if_owner restriction applies */
    if_owner?: boolean;
}
