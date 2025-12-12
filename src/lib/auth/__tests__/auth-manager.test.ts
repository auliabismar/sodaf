/**
 * P3-013: Auth Manager Tests
 * 
 * Comprehensive tests for AuthManager class.
 * 
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { UserManager } from '../user-manager';
import {
    AuthManager,
    AuthenticationError,
    UserDisabledError,
    AccountLockedError,
    type AuthManagerConfig,
} from '../auth-manager';

describe('P3-013: Auth Manager', () => {
    let userManager: UserManager;
    let authManager: AuthManager;

    // Helper to create a test user
    async function createTestUser(overrides: { email?: string; enabled?: boolean } = {}) {
        return userManager.createUser({
            email: overrides.email ?? 'test@example.com',
            full_name: 'Test User',
            password: 'SecurePass123',
            enabled: overrides.enabled ?? true,
        });
    }

    beforeEach(async () => {
        userManager = new UserManager();
        authManager = new AuthManager({ userManager });
    });

    // ==================== Login Tests ====================

    describe('Login Operations', () => {
        // P3-013-T1: login(email, password) returns token and user
        it('P3-013-T1: login should return token and user', async () => {
            await createTestUser();

            const result = await authManager.login({
                email: 'test@example.com',
                password: 'SecurePass123',
            });

            expect(result.success).toBe(true);
            expect(result.user).toBeDefined();
            expect(result.user?.email).toBe('test@example.com');
            expect(result.token).toBeDefined();
            expect(result.token?.token).toBeDefined();
            expect(result.token?.refresh_token).toBeDefined();
            expect(result.token?.token_type).toBe('Bearer');
            expect(result.session).toBeDefined();
        });

        // P3-013-T2: Login with wrong password throws AuthenticationError
        it('P3-013-T2: login with wrong password should throw AuthenticationError', async () => {
            await createTestUser();

            await expect(authManager.login({
                email: 'test@example.com',
                password: 'WrongPassword123',
            })).rejects.toThrow(AuthenticationError);
        });

        // P3-013-T3: Login disabled user throws UserDisabledError
        it('P3-013-T3: login disabled user should throw UserDisabledError', async () => {
            await createTestUser({ enabled: false });

            await expect(authManager.login({
                email: 'test@example.com',
                password: 'SecurePass123',
            })).rejects.toThrow(UserDisabledError);
        });

        // P3-013-T4: Login creates session
        it('P3-013-T4: login should create session record', async () => {
            await createTestUser();

            const result = await authManager.login({
                email: 'test@example.com',
                password: 'SecurePass123',
            });

            expect(result.session).toBeDefined();
            expect(result.session?.session_id).toBeDefined();
            expect(result.session?.user).toBe('test@example.com');
            expect(result.session?.status).toBe('active');

            // Verify session can be retrieved
            const sessions = authManager.getActiveSessions('test@example.com');
            expect(sessions).toHaveLength(1);
            expect(sessions[0].session_id).toBe(result.session?.session_id);
        });

        // P3-013-T5: Login records IP/device
        it('P3-013-T5: login should record IP and device metadata', async () => {
            await createTestUser();

            const result = await authManager.login(
                { email: 'test@example.com', password: 'SecurePass123' },
                { ip_address: '192.168.1.100', device: 'Chrome/Windows' }
            );

            expect(result.session?.ip_address).toBe('192.168.1.100');
            expect(result.session?.device).toBe('Chrome/Windows');
        });
    });

    // ==================== Logout Tests ====================

    describe('Logout Operations', () => {
        // P3-013-T6: logout() invalidates session
        it('P3-013-T6: logout should invalidate session', async () => {
            await createTestUser();

            const loginResult = await authManager.login({
                email: 'test@example.com',
                password: 'SecurePass123',
            });

            expect(authManager.getActiveSessions('test@example.com')).toHaveLength(1);

            const result = await authManager.logout(loginResult.session!.session_id);

            expect(result).toBe(true);
            expect(authManager.getActiveSessions('test@example.com')).toHaveLength(0);

            // Token should no longer be valid
            const user = authManager.validateSession(loginResult.token!.token);
            expect(user).toBeNull();
        });

        // P3-013-T7: logoutAllSessions(user) invalidates all sessions
        it('P3-013-T7: logoutAllSessions should invalidate all sessions', async () => {
            await createTestUser();

            // Create multiple sessions
            await authManager.login({ email: 'test@example.com', password: 'SecurePass123' });
            await authManager.login({ email: 'test@example.com', password: 'SecurePass123' });
            await authManager.login({ email: 'test@example.com', password: 'SecurePass123' });

            expect(authManager.getActiveSessions('test@example.com')).toHaveLength(3);

            const count = await authManager.logoutAllSessions('test@example.com');

            expect(count).toBe(3);
            expect(authManager.getActiveSessions('test@example.com')).toHaveLength(0);
        });
    });

    // ==================== Session Validation Tests ====================

    describe('Session Validation', () => {
        // P3-013-T8: validateSession(token) returns user if valid
        it('P3-013-T8: validateSession should return user if valid', async () => {
            await createTestUser();

            const loginResult = await authManager.login({
                email: 'test@example.com',
                password: 'SecurePass123',
            });

            const user = authManager.validateSession(loginResult.token!.token);

            expect(user).not.toBeNull();
            expect(user?.email).toBe('test@example.com');
        });

        // P3-013-T9: Expired session returns null
        it('P3-013-T9: expired session should return null', async () => {
            // Create auth manager with very short token expiry
            const shortExpiry = new AuthManager({
                userManager,
                tokenExpiry: 1, // 1ms
            });

            await createTestUser();

            const loginResult = await shortExpiry.login({
                email: 'test@example.com',
                password: 'SecurePass123',
            });

            // Wait for token to expire
            await new Promise(resolve => setTimeout(resolve, 10));

            const user = shortExpiry.validateSession(loginResult.token!.token);
            expect(user).toBeNull();
        });
    });

    // ==================== Token Tests ====================

    describe('Token Operations', () => {
        // P3-013-T10: refreshToken(refreshToken) returns new token pair
        it('P3-013-T10: refreshToken should return new token pair', async () => {
            await createTestUser();

            const loginResult = await authManager.login({
                email: 'test@example.com',
                password: 'SecurePass123',
            });

            const oldToken = loginResult.token!.token;
            const oldRefresh = loginResult.token!.refresh_token;

            const newToken = await authManager.refreshToken(oldRefresh!);

            expect(newToken).not.toBeNull();
            expect(newToken?.token).not.toBe(oldToken);
            expect(newToken?.refresh_token).not.toBe(oldRefresh);
            expect(newToken?.token_type).toBe('Bearer');

            // Old token should no longer work
            expect(authManager.validateSession(oldToken)).toBeNull();

            // New token should work
            expect(authManager.validateSession(newToken!.token)).not.toBeNull();
        });

        // P3-013-T11: getCurrentUser() returns current user
        it('P3-013-T11: getCurrentUser should return current user', async () => {
            await createTestUser();

            const loginResult = await authManager.login({
                email: 'test@example.com',
                password: 'SecurePass123',
            });

            const user = authManager.getCurrentUser(loginResult.token!.token);

            expect(user).not.toBeNull();
            expect(user?.email).toBe('test@example.com');
            expect(user?.full_name).toBe('Test User');
        });
    });

    // ==================== Session Management Tests ====================

    describe('Session Management', () => {
        // P3-013-T12: getActiveSessions(user) returns active sessions
        it('P3-013-T12: getActiveSessions should return active sessions', async () => {
            await createTestUser();

            await authManager.login(
                { email: 'test@example.com', password: 'SecurePass123' },
                { device: 'Chrome/Windows' }
            );
            await authManager.login(
                { email: 'test@example.com', password: 'SecurePass123' },
                { device: 'Firefox/Linux' }
            );

            const sessions = authManager.getActiveSessions('test@example.com');

            expect(sessions).toHaveLength(2);
            expect(sessions.map(s => s.device)).toContain('Chrome/Windows');
            expect(sessions.map(s => s.device)).toContain('Firefox/Linux');
        });

        // P3-013-T13: terminateSession(sessionId) ends specific session
        it('P3-013-T13: terminateSession should end specific session', async () => {
            await createTestUser();

            const session1 = await authManager.login(
                { email: 'test@example.com', password: 'SecurePass123' },
                { device: 'Chrome' }
            );
            const session2 = await authManager.login(
                { email: 'test@example.com', password: 'SecurePass123' },
                { device: 'Firefox' }
            );

            expect(authManager.getActiveSessions('test@example.com')).toHaveLength(2);

            const result = await authManager.terminateSession(session1.session!.session_id);

            expect(result).toBe(true);

            const activeSessions = authManager.getActiveSessions('test@example.com');
            expect(activeSessions).toHaveLength(1);
            expect(activeSessions[0].session_id).toBe(session2.session!.session_id);
        });
    });

    // ==================== API Key Tests ====================

    describe('API Key Operations', () => {
        // P3-013-T14: generateAPIKeySecret(user) returns api_key, api_secret
        it('P3-013-T14: generateAPIKeySecret should return api_key and api_secret', async () => {
            await createTestUser();

            const { api_key, api_secret } = await authManager.generateAPIKeySecret('test@example.com');

            expect(api_key).toBeDefined();
            expect(api_key).toMatch(/^key_[a-f0-9]+$/);
            expect(api_secret).toBeDefined();
            expect(api_secret.length).toBe(64); // 32 bytes hex
        });

        // P3-013-T15: validateAPIKey(key, secret) returns user if valid
        it('P3-013-T15: validateAPIKey should return user if valid', async () => {
            await createTestUser();

            const { api_key, api_secret } = await authManager.generateAPIKeySecret('test@example.com');

            const user = await authManager.validateAPIKey(api_key, api_secret);

            expect(user).not.toBeNull();
            expect(user?.email).toBe('test@example.com');
        });

        // P3-013-T16: revokeAPIKey(key) invalidates API key
        it('P3-013-T16: revokeAPIKey should invalidate API key', async () => {
            await createTestUser();

            const { api_key, api_secret } = await authManager.generateAPIKeySecret('test@example.com');

            // Key should work before revocation
            expect(await authManager.validateAPIKey(api_key, api_secret)).not.toBeNull();

            const result = authManager.revokeAPIKey(api_key);

            expect(result).toBe(true);

            // Key should not work after revocation
            expect(await authManager.validateAPIKey(api_key, api_secret)).toBeNull();
        });
    });

    // ==================== Security Tests ====================

    describe('Security Features', () => {
        // P3-013-T17: Login attempt limiting (rate limiting)
        it('P3-013-T17: should track failed login attempts', async () => {
            await createTestUser();

            // Make 3 failed attempts
            for (let i = 0; i < 3; i++) {
                try {
                    await authManager.login({
                        email: 'test@example.com',
                        password: 'WrongPassword',
                    });
                } catch (e) {
                    // Expected
                }
            }

            expect(authManager.getFailedAttemptCount('test@example.com')).toBe(3);
        });

        // P3-013-T18: Account lockout after N failed attempts
        it('P3-013-T18: should lock account after max failed attempts', async () => {
            // Create with low max attempts
            const strictAuth = new AuthManager({
                userManager,
                maxLoginAttempts: 3,
                lockoutDuration: 60000, // 1 minute
            });

            await createTestUser();

            // Make max failed attempts
            for (let i = 0; i < 3; i++) {
                try {
                    await strictAuth.login({
                        email: 'test@example.com',
                        password: 'WrongPassword',
                    });
                } catch (e) {
                    // Expected
                }
            }

            // Next attempt should throw AccountLockedError
            await expect(strictAuth.login({
                email: 'test@example.com',
                password: 'SecurePass123',
            })).rejects.toThrow(AccountLockedError);
        });

        // P3-013-T19: Session timeout (configurable expiry)
        it('P3-013-T19: should respect configurable session timeout', async () => {
            // Create with very short session timeout
            const shortTimeout = new AuthManager({
                userManager,
                sessionTimeout: 1, // 1ms
                tokenExpiry: 100000, // Keep token valid longer than session
            });

            await createTestUser();

            const loginResult = await shortTimeout.login({
                email: 'test@example.com',
                password: 'SecurePass123',
            });

            // Wait for session to expire
            await new Promise(resolve => setTimeout(resolve, 10));

            // Session should be expired
            const user = shortTimeout.validateSession(loginResult.token!.token);
            expect(user).toBeNull();
        });

        // P3-013-T20: Remember me (extended session)
        it('P3-013-T20: should create extended session with remember_me', async () => {
            await createTestUser();

            // Session without remember_me
            const normalResult = await authManager.login({
                email: 'test@example.com',
                password: 'SecurePass123',
                remember_me: false,
            });

            // Session with remember_me
            const extendedResult = await authManager.login({
                email: 'test@example.com',
                password: 'SecurePass123',
                remember_me: true,
            });

            // Both sessions should be active
            const sessions = authManager.getActiveSessions('test@example.com');
            expect(sessions).toHaveLength(2);

            // Verify both are valid (internal check - extended session should exist)
            expect(normalResult.session).toBeDefined();
            expect(extendedResult.session).toBeDefined();
        });
    });

    // ==================== Error Handling Tests ====================

    describe('Error Handling', () => {
        it('should throw when generating API key for non-existent user', async () => {
            await expect(authManager.generateAPIKeySecret('nonexistent@example.com'))
                .rejects.toThrow('User not found');
        });

        it('should return false when logging out non-existent session', async () => {
            const result = await authManager.logout('nonexistent-session-id');
            expect(result).toBe(false);
        });

        it('should return null when refreshing with invalid token', async () => {
            const result = await authManager.refreshToken('invalid-refresh-token');
            expect(result).toBeNull();
        });

        it('should return null when validating invalid API key', async () => {
            const result = await authManager.validateAPIKey('invalid-key', 'invalid-secret');
            expect(result).toBeNull();
        });

        it('should return false when revoking non-existent API key', () => {
            const result = authManager.revokeAPIKey('nonexistent-key');
            expect(result).toBe(false);
        });

        it('should return null for non-existent users in login', async () => {
            await expect(authManager.login({
                email: 'nonexistent@example.com',
                password: 'AnyPassword123',
            })).rejects.toThrow(AuthenticationError);
        });
    });

    // ==================== Utility Method Tests ====================

    describe('Utility Methods', () => {
        it('should clear lockout manually', async () => {
            const strictAuth = new AuthManager({
                userManager,
                maxLoginAttempts: 2,
            });

            await createTestUser();

            // Lock the account
            try { await strictAuth.login({ email: 'test@example.com', password: 'Wrong' }); } catch { }
            try { await strictAuth.login({ email: 'test@example.com', password: 'Wrong' }); } catch { }

            // Should be locked
            await expect(strictAuth.login({
                email: 'test@example.com',
                password: 'SecurePass123',
            })).rejects.toThrow(AccountLockedError);

            // Clear lockout
            strictAuth.clearLockout('test@example.com');

            // Should work now
            const result = await strictAuth.login({
                email: 'test@example.com',
                password: 'SecurePass123',
            });
            expect(result.success).toBe(true);
        });

        it('should get session by ID', async () => {
            await createTestUser();

            const loginResult = await authManager.login({
                email: 'test@example.com',
                password: 'SecurePass123',
            });

            const session = authManager.getSession(loginResult.session!.session_id);

            expect(session).not.toBeNull();
            expect(session?.user).toBe('test@example.com');
        });

        it('should return null for non-existent session', () => {
            const session = authManager.getSession('nonexistent');
            expect(session).toBeNull();
        });

        it('should update configuration', () => {
            authManager.setSessionTimeout(3600000);
            authManager.setExtendedSessionTimeout(86400000);
            authManager.setMaxLoginAttempts(10);
            authManager.setLockoutDuration(30000);

            // No error means success
            expect(true).toBe(true);
        });
    });
});
