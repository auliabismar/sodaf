/**
 * User Types and Interfaces
 * 
 * P3-011: Define TypeScript interfaces for User and Session.
 * Core authentication and identity types for the application.
 */

/**
 * User type classification
 * Distinguishes between different kinds of users in the system
 */
export type UserType =
    | 'System User'     // Full desk access
    | 'Website User'    // Portal/website only access
    | 'Admin';          // Administrator with full access

/**
 * User interface for user identification and status
 * Contains core user properties for authentication and authorization
 */
export interface User {
    /** Unique user identifier (usually email) */
    name: string;

    /** User's email address */
    email: string;

    /** User's full display name */
    full_name: string;

    /** Whether the user account is enabled */
    enabled: boolean;

    /** Type of user account */
    user_type: UserType;

    /** User's first name (optional) */
    first_name?: string;

    /** User's last name (optional) */
    last_name?: string;

    /** Username for login (if different from email) */
    username?: string;

    /** User's profile image URL */
    user_image?: string;

    /** User's preferred language */
    language?: string;

    /** User's timezone */
    time_zone?: string;

    /** Last login timestamp */
    last_login?: string;

    /** Last known IP address */
    last_ip?: string;

    /** Whether the user is active (not logged out) */
    last_active?: string;

    /** API key for programmatic access */
    api_key?: string;

    /** API secret (hashed, never exposed) */
    api_secret?: string;

    /** Date/time of account creation */
    creation?: string;

    /** Date/time of last modification */
    modified?: string;

    /** User who last modified this account */
    modified_by?: string;
}

/**
 * UserRole interface for role assignment
 * Links a user to assigned roles
 */
export interface UserRole {
    /** The role name */
    role: string;

    /** Whether this role grants desk (admin panel) access */
    is_desk_user: boolean;

    /** Parent user name */
    parent?: string;

    /** Index position in roles list */
    idx?: number;
}

/**
 * Session interface for tracking user sessions
 * Contains session metadata for security and auditing
 */
export interface Session {
    /** Session ID (unique token) */
    session_id: string;

    /** Associated user */
    user: string;

    /** Device information (user agent) */
    device: string;

    /** Client IP address */
    ip_address: string;

    /** Session creation timestamp */
    created: string;

    /** Last activity timestamp */
    last_active?: string;

    /** Session status */
    status?: 'active' | 'expired' | 'revoked';

    /** Geographic location (if available) */
    geo_location?: string;

    /** Browser information */
    browser?: string;

    /** Operating system */
    os?: string;
}

/**
 * AuthToken interface for JWT or similar token-based auth
 * Used for API authentication and session management
 */
export interface AuthToken {
    /** Access token string */
    token: string;

    /** Token expiry timestamp (ISO 8601) */
    expiry: string;

    /** Refresh token for obtaining new access tokens */
    refresh_token?: string;

    /** Token type (e.g., 'Bearer') */
    token_type?: string;

    /** Scopes granted to this token */
    scopes?: string[];

    /** User the token belongs to */
    user?: string;

    /** Token creation timestamp */
    issued_at?: string;
}

/**
 * LoginCredentials interface for email/password login
 * Standard username/password authentication
 */
export interface LoginCredentials {
    /** User's email address */
    email: string;

    /** User's password (plaintext, for transmission only) */
    password: string;

    /** Optional device identifier for session tracking */
    device_id?: string;

    /** Whether to create a persistent session */
    remember_me?: boolean;
}

/**
 * APICredentials interface for API key authentication
 * Used for programmatic/server-to-server access
 */
export interface APICredentials {
    /** API key identifier */
    api_key: string;

    /** API secret for authentication */
    api_secret: string;
}

/**
 * AuthResult interface for login/auth operation results
 */
export interface AuthResult {
    /** Whether authentication was successful */
    success: boolean;

    /** Error message if authentication failed */
    message?: string;

    /** User object if successful */
    user?: User;

    /** Auth token if successful */
    token?: AuthToken;

    /** Session if created */
    session?: Session;
}

/**
 * PasswordPolicy interface for password requirements
 */
export interface PasswordPolicy {
    /** Minimum password length */
    min_length: number;

    /** Maximum password length */
    max_length?: number;

    /** Require at least one uppercase letter */
    require_uppercase: boolean;

    /** Require at least one lowercase letter */
    require_lowercase: boolean;

    /** Require at least one numeric digit */
    require_number: boolean;

    /** Require at least one special character */
    require_special: boolean;
}
