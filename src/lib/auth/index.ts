/**
 * Auth Module Exports
 * 
 * P3-011: User Types and Interfaces
 * P3-012: User Manager
 * P3-013: Auth Manager
 * P3-014: Auth Middleware
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

// Middleware (P3-014)
export {
    createAuthMiddleware,
    createCSRFMiddleware,
    getTokenFromRequest,
    generateCSRFToken,
    setCSRFCookie,
    AuthRequiredError,
    ForbiddenError,
    SESSION_COOKIE,
    TOKEN_COOKIE,
    CSRF_COOKIE,
    CSRF_HEADER,
    API_KEY_HEADER,
    API_SECRET_HEADER,
    type AuthCredentials,
    type AuthMiddlewareConfig,
    type CSRFMiddlewareConfig,
} from './middleware';

// Guards (P3-014)
export {
    requireAuth,
    requireRole,
    requirePermission,
    createPermissionChecker,
    handleGuardError,
    withGuard,
    type GuardResult,
    type PermissionChecker,
} from './guards';
