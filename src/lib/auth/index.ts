/**
 * Auth Module Exports
 * 
 * P3-011: User Types and Interfaces
 * P3-012: User Manager
 */

// Types
export type {
    UserType,
    User,
    UserRole,
    Session,
    AuthToken,
    LoginCredentials,
    APICredentials,
    AuthResult,
    PasswordPolicy,
} from './types';

// User Manager
export {
    UserManager,
    type UserManagerConfig,
    type CreateUserData,
    type UpdateUserData,
    type UserFilters,
    type DeleteUserResult,
    type PasswordResetToken,
    type PasswordValidationResult,
} from './user-manager';
