/**
 * Auth Module Exports
 * 
 * P3-011: User Types and Interfaces
 * P3-012: User Manager
 * P3-013: Auth Manager
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

// Auth Manager
export {
    AuthManager,
    AuthenticationError,
    UserDisabledError,
    AccountLockedError,
    type AuthManagerConfig,
} from './auth-manager';
