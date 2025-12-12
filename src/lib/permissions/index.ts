/**
 * Permissions Module Index
 * 
 * P3-009: Exports all permission-related types and interfaces
 * P3-010: Exports PermissionManager class
 */

// P3-010: Permission Manager
export { PermissionManager, type PermissionManagerConfig } from './permission-manager';

// P3-009: Permission type definitions
export type {
    RolePermission,
    PermissionType,
    PermLevel,
    UserPermission,
    FieldPermission,
    PermissionDocument,
    PermissionCheckContext,
    PermissionCheckResult,
    PermissionCheck,
    SyncPermissionCheck,
    AsyncPermissionCheck,
    PermissionQueryCondition,
    PermissionQueryBuilder,
    SharePermission,
    EffectivePermission
} from './types';
