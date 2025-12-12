/**
 * Authentication Manager
 * 
 * P3-013: Implement AuthManager for login/logout and session management.
 * Provides comprehensive authentication including sessions, tokens, API keys,
 * and security measures like rate limiting and account lockout.
 */

import type { User, Session, AuthToken, AuthResult, LoginCredentials } from './types';
import { UserManager } from './user-manager';
import { getRandomBytes, bytesToHex, hexToBytes, hashWithSalt } from './crypto-utils';

// ==================== Error Classes ====================

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends Error {
    constructor(message: string = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
    }
}

/**
 * Error thrown when trying to authenticate a disabled user
 */
export class UserDisabledError extends Error {
    constructor(message: string = 'User account is disabled') {
        super(message);
        this.name = 'UserDisabledError';
    }
}

/**
 * Error thrown when account is locked due to too many failed attempts
 */
export class AccountLockedError extends Error {
    public readonly unlockTime: Date;

    constructor(unlockTime: Date) {
        super(`Account is locked until ${unlockTime.toISOString()}`);
        this.name = 'AccountLockedError';
        this.unlockTime = unlockTime;
    }
}

// ==================== Configuration ====================

/**
 * Configuration for AuthManager
 */
export interface AuthManagerConfig {
    /** UserManager instance for user operations */
    userManager: UserManager;
    /** Maximum login attempts before lockout (default: 5) */
    maxLoginAttempts?: number;
    /** Lockout duration in milliseconds (default: 15 minutes) */
    lockoutDuration?: number;
    /** Session timeout in milliseconds (default: 24 hours) */
    sessionTimeout?: number;
    /** Extended session timeout for remember-me (default: 30 days) */
    extendedSessionTimeout?: number;
    /** Token expiry in milliseconds (default: 1 hour) */
    tokenExpiry?: number;
}

// ==================== Internal Types ====================

/**
 * Internal session storage with token info
 */
interface StoredSession extends Session {
    /** Access token */
    token: string;
    /** Refresh token */
    refresh_token: string;
    /** Token expiry time */
    token_expiry: string;
    /** Session expiry time */
    session_expiry: string;
    /** Whether this is an extended (remember-me) session */
    is_extended: boolean;
}

/**
 * Login attempt tracking for rate limiting
 */
interface LoginAttempt {
    /** Number of failed attempts */
    count: number;
    /** Timestamp of first failed attempt in current window */
    first_attempt: number;
    /** Lockout expiry timestamp (if locked) */
    lockout_until?: number;
}

/**
 * API key storage
 */
interface StoredAPIKey {
    /** API key identifier */
    api_key: string;
    /** Hashed API secret */
    api_secret_hash: string;
    /** Salt for secret hashing */
    salt: string;
    /** Associated user */
    user: string;
    /** Creation timestamp */
    created: string;
    /** Whether the key is active */
    active: boolean;
}

// ==================== AuthManager Class ====================

/**
 * AuthManager class for authentication and session management
 * 
 * Provides methods for:
 * - Login/logout with session creation
 * - Token validation and refresh
 * - API key management
 * - Rate limiting and account lockout
 */
export class AuthManager {
    private userManager: UserManager;
    private sessions: Map<string, StoredSession> = new Map();
    private tokenToSession: Map<string, string> = new Map(); // token -> session_id
    private refreshTokenToSession: Map<string, string> = new Map(); // refresh_token -> session_id
    private loginAttempts: Map<string, LoginAttempt> = new Map();
    private apiKeys: Map<string, StoredAPIKey> = new Map();

    // Configuration
    private maxLoginAttempts: number;
    private lockoutDuration: number;
    private sessionTimeout: number;
    private extendedSessionTimeout: number;
    private tokenExpiry: number;

    constructor(config: AuthManagerConfig) {
        this.userManager = config.userManager;
        this.maxLoginAttempts = config.maxLoginAttempts ?? 5;
        this.lockoutDuration = config.lockoutDuration ?? 15 * 60 * 1000; // 15 minutes
        this.sessionTimeout = config.sessionTimeout ?? 24 * 60 * 60 * 1000; // 24 hours
        this.extendedSessionTimeout = config.extendedSessionTimeout ?? 30 * 24 * 60 * 60 * 1000; // 30 days
        this.tokenExpiry = config.tokenExpiry ?? 60 * 60 * 1000; // 1 hour
    }

    // ==================== Helper Methods ====================

    /**
     * Generate a secure random token
     */
    private generateToken(): string {
        return bytesToHex(getRandomBytes(32));
    }

    /**
     * Generate a session ID
     */
    private generateSessionId(): string {
        return bytesToHex(getRandomBytes(16));
    }

    /**
     * Hash an API secret
     */
    private async hashSecret(secret: string, salt?: string): Promise<{ hash: string; salt: string }> {
        const saltBytes = salt ? hexToBytes(salt) : getRandomBytes(32);
        const hash = await hashWithSalt(secret, saltBytes);
        return { hash, salt: bytesToHex(saltBytes) };
    }

    /**
     * Check if account is locked
     */
    private isAccountLocked(email: string): { locked: boolean; unlockTime?: Date } {
        const attempts = this.loginAttempts.get(email);
        if (!attempts || !attempts.lockout_until) {
            return { locked: false };
        }

        if (Date.now() >= attempts.lockout_until) {
            // Lockout expired, clear it
            this.loginAttempts.delete(email);
            return { locked: false };
        }

        return { locked: true, unlockTime: new Date(attempts.lockout_until) };
    }

    /**
     * Record a failed login attempt
     */
    private recordFailedAttempt(email: string): void {
        let attempts = this.loginAttempts.get(email);
        const now = Date.now();

        if (!attempts) {
            attempts = { count: 1, first_attempt: now };
        } else {
            attempts.count++;
        }

        // Lock account if max attempts exceeded
        if (attempts.count >= this.maxLoginAttempts) {
            attempts.lockout_until = now + this.lockoutDuration;
        }

        this.loginAttempts.set(email, attempts);
    }

    /**
     * Clear login attempts on successful login
     */
    private clearLoginAttempts(email: string): void {
        this.loginAttempts.delete(email);
    }

    // ==================== Login/Logout ====================

    /**
     * Login a user with email and password
     * P3-013-T1: Returns token and user
     * P3-013-T2: Throws AuthenticationError on wrong password
     * P3-013-T3: Throws UserDisabledError on disabled user
     * P3-013-T4: Creates session record
     * P3-013-T5: Records IP/device metadata
     * P3-013-T17: Rate limiting works
     * P3-013-T18: Account lockout after N failed attempts
     * P3-013-T20: Remember me extended session
     */
    async login(
        credentials: LoginCredentials,
        options?: { ip_address?: string; device?: string }
    ): Promise<AuthResult> {
        const { email, password, remember_me } = credentials;
        const ip_address = options?.ip_address ?? '0.0.0.0';
        const device = options?.device ?? 'Unknown';

        // P3-013-T18: Check if account is locked
        const lockStatus = this.isAccountLocked(email);
        if (lockStatus.locked) {
            throw new AccountLockedError(lockStatus.unlockTime!);
        }

        // Get user
        const user = this.userManager.getUserByEmail(email);
        if (!user) {
            this.recordFailedAttempt(email);
            throw new AuthenticationError('Invalid email or password');
        }

        // P3-013-T3: Check if user is disabled
        if (!user.enabled) {
            throw new UserDisabledError();
        }

        // Verify password
        const isValid = await this.userManager.verifyPassword(email, password);
        if (!isValid) {
            // P3-013-T17: Record failed attempt for rate limiting
            this.recordFailedAttempt(email);
            throw new AuthenticationError('Invalid email or password');
        }

        // Clear failed attempts on successful login
        this.clearLoginAttempts(email);

        // P3-013-T4: Create session
        const sessionId = this.generateSessionId();
        const token = this.generateToken();
        const refreshToken = this.generateToken();
        const now = new Date();

        // P3-013-T20: Use extended timeout for remember-me
        const timeout = remember_me ? this.extendedSessionTimeout : this.sessionTimeout;
        const sessionExpiry = new Date(now.getTime() + timeout);
        const tokenExpiryDate = new Date(now.getTime() + this.tokenExpiry);

        const storedSession: StoredSession = {
            session_id: sessionId,
            user: email,
            device,
            ip_address,
            created: now.toISOString(),
            last_active: now.toISOString(),
            status: 'active',
            token,
            refresh_token: refreshToken,
            token_expiry: tokenExpiryDate.toISOString(),
            session_expiry: sessionExpiry.toISOString(),
            is_extended: !!remember_me,
        };

        // Store session
        this.sessions.set(sessionId, storedSession);
        this.tokenToSession.set(token, sessionId);
        this.refreshTokenToSession.set(refreshToken, sessionId);

        // Build auth token response
        const authToken: AuthToken = {
            token,
            expiry: tokenExpiryDate.toISOString(),
            refresh_token: refreshToken,
            token_type: 'Bearer',
            user: email,
            issued_at: now.toISOString(),
        };

        // Build session response (without internal fields)
        const session: Session = {
            session_id: sessionId,
            user: email,
            device,
            ip_address,
            created: now.toISOString(),
            last_active: now.toISOString(),
            status: 'active',
        };

        return {
            success: true,
            user,
            token: authToken,
            session,
        };
    }

    /**
     * Logout and invalidate a specific session
     * P3-013-T6: Invalidates session
     */
    async logout(sessionId: string): Promise<boolean> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }

        // Remove from token mappings
        this.tokenToSession.delete(session.token);
        this.refreshTokenToSession.delete(session.refresh_token);

        // Mark session as revoked
        session.status = 'revoked';
        this.sessions.set(sessionId, session);

        return true;
    }

    /**
     * Logout all sessions for a user
     * P3-013-T7: Invalidates all sessions
     */
    async logoutAllSessions(user: string): Promise<number> {
        let count = 0;

        for (const [sessionId, session] of Array.from(this.sessions.entries())) {
            if (session.user === user && session.status === 'active') {
                await this.logout(sessionId);
                count++;
            }
        }

        return count;
    }

    // ==================== Session Validation ====================

    /**
     * Validate a session token and return the user
     * P3-013-T8: Returns user if valid
     * P3-013-T9: Returns null for expired session
     * P3-013-T19: Configurable expiry
     */
    validateSession(token: string): User | null {
        const sessionId = this.tokenToSession.get(token);
        if (!sessionId) {
            return null;
        }

        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }

        // Check if session is revoked
        if (session.status === 'revoked') {
            return null;
        }

        // P3-013-T9: Check token expiry
        if (new Date(session.token_expiry) < new Date()) {
            return null;
        }

        // P3-013-T19: Check session expiry
        if (new Date(session.session_expiry) < new Date()) {
            session.status = 'expired';
            this.sessions.set(sessionId, session);
            return null;
        }

        // Update last active
        session.last_active = new Date().toISOString();
        this.sessions.set(sessionId, session);

        return this.userManager.getUser(session.user);
    }

    /**
     * Refresh an access token using a refresh token
     * P3-013-T10: Returns new token pair
     */
    async refreshToken(refreshToken: string): Promise<AuthToken | null> {
        const sessionId = this.refreshTokenToSession.get(refreshToken);
        if (!sessionId) {
            return null;
        }

        const session = this.sessions.get(sessionId);
        if (!session || session.status !== 'active') {
            return null;
        }

        // Check session hasn't expired
        if (new Date(session.session_expiry) < new Date()) {
            session.status = 'expired';
            this.sessions.set(sessionId, session);
            return null;
        }

        // Generate new tokens
        const newToken = this.generateToken();
        const newRefreshToken = this.generateToken();
        const now = new Date();
        const tokenExpiryDate = new Date(now.getTime() + this.tokenExpiry);

        // Remove old token mappings
        this.tokenToSession.delete(session.token);
        this.refreshTokenToSession.delete(session.refresh_token);

        // Update session
        session.token = newToken;
        session.refresh_token = newRefreshToken;
        session.token_expiry = tokenExpiryDate.toISOString();
        session.last_active = now.toISOString();

        // Add new mappings
        this.tokenToSession.set(newToken, sessionId);
        this.refreshTokenToSession.set(newRefreshToken, sessionId);
        this.sessions.set(sessionId, session);

        return {
            token: newToken,
            expiry: tokenExpiryDate.toISOString(),
            refresh_token: newRefreshToken,
            token_type: 'Bearer',
            user: session.user,
            issued_at: now.toISOString(),
        };
    }

    /**
     * Get current user from token
     * P3-013-T11: Returns current user
     */
    getCurrentUser(token: string): User | null {
        return this.validateSession(token);
    }

    // ==================== Session Management ====================

    /**
     * Get all active sessions for a user
     * P3-013-T12: Returns active sessions
     */
    getActiveSessions(user: string): Session[] {
        const sessions: Session[] = [];

        for (const session of Array.from(this.sessions.values())) {
            if (session.user === user && session.status === 'active') {
                // Check if session hasn't expired
                if (new Date(session.session_expiry) > new Date()) {
                    sessions.push({
                        session_id: session.session_id,
                        user: session.user,
                        device: session.device,
                        ip_address: session.ip_address,
                        created: session.created,
                        last_active: session.last_active,
                        status: session.status,
                    });
                }
            }
        }

        return sessions;
    }

    /**
     * Terminate a specific session
     * P3-013-T13: Ends specific session
     */
    async terminateSession(sessionId: string): Promise<boolean> {
        return this.logout(sessionId);
    }

    // ==================== API Key Management ====================

    /**
     * Generate an API key and secret for a user
     * P3-013-T14: Returns api_key, api_secret
     */
    async generateAPIKeySecret(user: string): Promise<{ api_key: string; api_secret: string }> {
        // Verify user exists
        const userObj = this.userManager.getUser(user);
        if (!userObj) {
            throw new Error('User not found');
        }

        // Generate key and secret
        const apiKey = `key_${bytesToHex(getRandomBytes(16))}`;
        const apiSecret = bytesToHex(getRandomBytes(32));

        // Hash the secret
        const { hash, salt } = await this.hashSecret(apiSecret);

        // Store the key
        const storedKey: StoredAPIKey = {
            api_key: apiKey,
            api_secret_hash: hash,
            salt,
            user,
            created: new Date().toISOString(),
            active: true,
        };

        this.apiKeys.set(apiKey, storedKey);

        return { api_key: apiKey, api_secret: apiSecret };
    }

    /**
     * Validate an API key and secret
     * P3-013-T15: Returns user if valid
     */
    async validateAPIKey(apiKey: string, apiSecret: string): Promise<User | null> {
        const storedKey = this.apiKeys.get(apiKey);
        if (!storedKey || !storedKey.active) {
            return null;
        }

        // Verify the secret
        const { hash } = await this.hashSecret(apiSecret, storedKey.salt);
        if (hash !== storedKey.api_secret_hash) {
            return null;
        }

        return this.userManager.getUser(storedKey.user);
    }

    /**
     * Revoke an API key
     * P3-013-T16: Invalidates API key
     */
    revokeAPIKey(apiKey: string): boolean {
        const storedKey = this.apiKeys.get(apiKey);
        if (!storedKey) {
            return false;
        }

        storedKey.active = false;
        this.apiKeys.set(apiKey, storedKey);
        return true;
    }

    // ==================== Utility Methods ====================

    /**
     * Get count of active sessions for a user
     */
    getSessionCount(user: string): number {
        return this.getActiveSessions(user).length;
    }

    /**
     * Get failed login attempt count for an email
     */
    getFailedAttemptCount(email: string): number {
        const attempts = this.loginAttempts.get(email);
        return attempts?.count ?? 0;
    }

    /**
     * Manually clear lockout for an email (admin function)
     */
    clearLockout(email: string): void {
        this.loginAttempts.delete(email);
    }

    /**
     * Get session by ID
     */
    getSession(sessionId: string): Session | null {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }

        return {
            session_id: session.session_id,
            user: session.user,
            device: session.device,
            ip_address: session.ip_address,
            created: session.created,
            last_active: session.last_active,
            status: session.status,
        };
    }

    /**
     * Update configuration
     */
    setSessionTimeout(timeout: number): void {
        this.sessionTimeout = timeout;
    }

    setExtendedSessionTimeout(timeout: number): void {
        this.extendedSessionTimeout = timeout;
    }

    setMaxLoginAttempts(max: number): void {
        this.maxLoginAttempts = max;
    }

    setLockoutDuration(duration: number): void {
        this.lockoutDuration = duration;
    }
}
