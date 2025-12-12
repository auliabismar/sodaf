/**
 * P3-014: Auth Middleware Tests
 * 
 * Comprehensive tests for auth middleware, guards, and CSRF protection.
 * 
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { RequestEvent, Cookies } from '@sveltejs/kit';
import { UserManager } from '../user-manager';
import { AuthManager } from '../auth-manager';
import {
    getTokenFromRequest,
    createAuthMiddleware,
    createCSRFMiddleware,
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
} from '../middleware';
import {
    requireAuth,
    requireRole,
    requirePermission,
    handleGuardError,
    createPermissionChecker,
} from '../guards';

describe('P3-014: Auth Middleware', () => {
    let userManager: UserManager;
    let authManager: AuthManager;

    // Helper to create mock request event
    function createMockEvent(options: {
        cookies?: Record<string, string>;
        headers?: Record<string, string>;
        method?: string;
        path?: string;
        locals?: Record<string, unknown>;
    } = {}): RequestEvent {
        const cookies = options.cookies ?? {};
        const headers = new Headers(options.headers ?? {});

        const cookieObj: Cookies = {
            get: vi.fn((name: string) => cookies[name]),
            getAll: vi.fn(() => Object.entries(cookies).map(([name, value]) => ({ name, value }))),
            set: vi.fn((name: string, value: string) => { cookies[name] = value; }),
            delete: vi.fn((name: string) => { delete cookies[name]; }),
            serialize: vi.fn(() => ''),
        };

        return {
            cookies: cookieObj,
            request: {
                method: options.method ?? 'GET',
                headers,
            },
            url: new URL(`http://localhost${options.path ?? '/'}`),
            locals: options.locals ?? {},
        } as unknown as RequestEvent;
    }

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

    // ==================== Token Extraction Tests ====================

    describe('Token Extraction', () => {
        // P3-014-T4: Cookie auth works
        it('P3-014-T4: should extract token from cookie', () => {
            const event = createMockEvent({
                cookies: { [TOKEN_COOKIE]: 'test-token-123' },
            });

            const credentials = getTokenFromRequest(event);

            expect(credentials.source).toBe('cookie');
            expect(credentials.token).toBe('test-token-123');
        });

        // P3-014-T5: Authorization header works
        it('P3-014-T5: should extract token from Authorization header', () => {
            const event = createMockEvent({
                headers: { 'Authorization': 'Bearer test-token-456' },
            });

            const credentials = getTokenFromRequest(event);

            expect(credentials.source).toBe('header');
            expect(credentials.token).toBe('test-token-456');
        });

        // P3-014-T6: API key auth works
        it('P3-014-T6: should extract API key from headers', () => {
            const event = createMockEvent({
                headers: {
                    [API_KEY_HEADER]: 'key_abc123',
                    [API_SECRET_HEADER]: 'secret_xyz789',
                },
            });

            const credentials = getTokenFromRequest(event);

            expect(credentials.source).toBe('api_key');
            expect(credentials.apiKey).toBe('key_abc123');
            expect(credentials.apiSecret).toBe('secret_xyz789');
        });

        // P3-014-T3: Request without token
        it('P3-014-T3: should return none for request without credentials', () => {
            const event = createMockEvent();

            const credentials = getTokenFromRequest(event);

            expect(credentials.source).toBe('none');
            expect(credentials.token).toBeUndefined();
        });

        it('should prefer API key over Authorization header', () => {
            const event = createMockEvent({
                headers: {
                    'Authorization': 'Bearer some-token',
                    [API_KEY_HEADER]: 'key_abc',
                    [API_SECRET_HEADER]: 'secret_xyz',
                },
            });

            const credentials = getTokenFromRequest(event);

            expect(credentials.source).toBe('api_key');
        });

        it('should handle session cookie as fallback', () => {
            const event = createMockEvent({
                cookies: { [SESSION_COOKIE]: 'session-token' },
            });

            const credentials = getTokenFromRequest(event);

            expect(credentials.source).toBe('cookie');
            expect(credentials.token).toBe('session-token');
        });
    });

    // ==================== Auth Middleware Tests ====================

    describe('Auth Middleware', () => {
        // P3-014-T1: Request with valid token sets user
        it('P3-014-T1: should set user for valid token', async () => {
            await createTestUser();
            const loginResult = await authManager.login({
                email: 'test@example.com',
                password: 'SecurePass123',
            });

            const event = createMockEvent({
                cookies: { [TOKEN_COOKIE]: loginResult.token!.token },
            });

            const middleware = createAuthMiddleware({ authManager });
            const resolve = vi.fn().mockResolvedValue(new Response('OK'));

            await middleware({ event, resolve });

            expect(event.locals.user).toBeDefined();
            expect(event.locals.user?.email).toBe('test@example.com');
            expect(resolve).toHaveBeenCalled();
        });

        // P3-014-T2: Request with expired token
        it('P3-014-T2: should set null for expired token', async () => {
            // Create auth manager with very short expiry
            const shortExpiryAuth = new AuthManager({
                userManager,
                tokenExpiry: 1, // 1ms
            });

            await createTestUser();
            const loginResult = await shortExpiryAuth.login({
                email: 'test@example.com',
                password: 'SecurePass123',
            });

            // Wait for token to expire
            await new Promise(resolve => setTimeout(resolve, 10));

            const event = createMockEvent({
                cookies: { [TOKEN_COOKIE]: loginResult.token!.token },
            });

            const middleware = createAuthMiddleware({ authManager: shortExpiryAuth });
            const resolve = vi.fn().mockResolvedValue(new Response('OK'));

            await middleware({ event, resolve });

            expect(event.locals.user).toBeNull();
        });

        // P3-014-T3: Request without token sets null
        it('P3-014-T3: should set null for request without token', async () => {
            const event = createMockEvent();

            const middleware = createAuthMiddleware({ authManager });
            const resolve = vi.fn().mockResolvedValue(new Response('OK'));

            await middleware({ event, resolve });

            expect(event.locals.user).toBeNull();
        });

        // P3-014-T6: API key authentication
        it('P3-014-T6: should authenticate with API key', async () => {
            await createTestUser();
            const { api_key, api_secret } = await authManager.generateAPIKeySecret('test@example.com');

            const event = createMockEvent({
                headers: {
                    [API_KEY_HEADER]: api_key,
                    [API_SECRET_HEADER]: api_secret,
                },
            });

            const middleware = createAuthMiddleware({ authManager });
            const resolve = vi.fn().mockResolvedValue(new Response('OK'));

            await middleware({ event, resolve });

            expect(event.locals.user).toBeDefined();
            expect(event.locals.user?.email).toBe('test@example.com');
        });

        // P3-014-T15: Session refresh on activity
        it('P3-014-T15: should extend session on activity', async () => {
            await createTestUser();
            const loginResult = await authManager.login({
                email: 'test@example.com',
                password: 'SecurePass123',
            });

            const event = createMockEvent({
                cookies: { [TOKEN_COOKIE]: loginResult.token!.token },
            });

            const middleware = createAuthMiddleware({
                authManager,
                refreshSession: true,
            });
            const resolve = vi.fn().mockResolvedValue(new Response('OK'));

            await middleware({ event, resolve });

            // Session should be updated (last_active)
            const session = authManager.getSession(loginResult.session!.session_id);
            expect(session).toBeDefined();
            expect(session?.status).toBe('active');
        });
    });

    // ==================== Guard Tests ====================

    describe('Auth Guards', () => {
        // P3-014-T7: Protected route without auth returns 401
        it('P3-014-T7: requireAuth should throw for unauthenticated request', () => {
            const event = createMockEvent({
                locals: { user: null },
            });

            expect(() => requireAuth(event)).toThrow(AuthRequiredError);
        });

        // P3-014-T8: Protected route with auth proceeds
        it('P3-014-T8: requireAuth should return user for authenticated request', async () => {
            await createTestUser();

            const event = createMockEvent({
                locals: {
                    user: {
                        name: 'test@example.com',
                        email: 'test@example.com',
                        full_name: 'Test User',
                        enabled: true,
                        user_type: 'System User',
                    },
                },
            });

            const user = requireAuth(event);

            expect(user).toBeDefined();
            expect(user.email).toBe('test@example.com');
        });

        // P3-014-T10: Role check returns 403 if wrong role
        it('P3-014-T10: requireRole should throw for missing role', () => {
            const event = createMockEvent({
                locals: {
                    user: { email: 'test@example.com' },
                    userRoles: ['Guest'],
                },
            });

            const guard = requireRole('Admin');

            expect(() => guard(event)).toThrow(ForbiddenError);
        });

        // P3-014-T11: requireAuth guard protects routes
        it('P3-014-T11: requireAuth guard protects routes', () => {
            const eventWithoutUser = createMockEvent({ locals: { user: null } });
            expect(() => requireAuth(eventWithoutUser)).toThrow(AuthRequiredError);

            const eventWithUser = createMockEvent({
                locals: { user: { email: 'user@test.com' } },
            });
            expect(() => requireAuth(eventWithUser)).not.toThrow();
        });

        // P3-014-T12: requireRole provides role-specific protection
        it('P3-014-T12: requireRole should pass for correct role', () => {
            const event = createMockEvent({
                locals: {
                    user: { email: 'admin@example.com' },
                    userRoles: ['Admin', 'User'],
                },
            });

            const guard = requireRole('Admin');
            const user = guard(event);

            expect(user.email).toBe('admin@example.com');
        });

        it('P3-014-T12: System Manager should have all roles', () => {
            const event = createMockEvent({
                locals: {
                    user: { email: 'admin@example.com' },
                    userRoles: ['System Manager'],
                },
            });

            const guard = requireRole('AnyRole');
            expect(() => guard(event)).not.toThrow();
        });

        // P3-014-T9: Permission check middleware returns 403 if no permission
        it('P3-014-T9: requirePermission should throw for missing permission', async () => {
            const event = createMockEvent({
                locals: {
                    user: { email: 'user@example.com' },
                    userRoles: ['User'],
                },
            });

            const guard = requirePermission('Customer', 'write');

            await expect(guard(event)).rejects.toThrow(ForbiddenError);
        });

        // P3-014-T13: requirePermission with custom checker
        it('P3-014-T13: requirePermission should work with custom checker', async () => {
            const event = createMockEvent({
                locals: {
                    user: { email: 'user@example.com' },
                    userRoles: ['User'],
                },
            });

            const checker = vi.fn().mockReturnValue(true);
            const guard = requirePermission('Customer', 'read', checker);
            const user = await guard(event);

            expect(user.email).toBe('user@example.com');
            expect(checker).toHaveBeenCalledWith(
                expect.objectContaining({ email: 'user@example.com' }),
                'Customer',
                'read'
            );
        });
    });

    // ==================== CSRF Tests ====================

    describe('CSRF Protection', () => {
        // P3-014-T14: CSRF token validated
        it('P3-014-T14: should reject POST without CSRF token', async () => {
            const event = createMockEvent({
                method: 'POST',
                cookies: {},
            });

            const middleware = createCSRFMiddleware();
            const resolve = vi.fn().mockResolvedValue(new Response('OK'));

            const response = await middleware({ event, resolve });

            expect(response.status).toBe(403);
            expect(resolve).not.toHaveBeenCalled();
        });

        it('P3-014-T14: should pass with valid CSRF token', async () => {
            const csrfToken = 'valid-csrf-token';
            const event = createMockEvent({
                method: 'POST',
                cookies: { [CSRF_COOKIE]: csrfToken },
                headers: { [CSRF_HEADER]: csrfToken },
            });

            const middleware = createCSRFMiddleware();
            const resolve = vi.fn().mockResolvedValue(new Response('OK'));

            await middleware({ event, resolve });

            expect(resolve).toHaveBeenCalled();
        });

        it('should reject mismatched CSRF tokens', async () => {
            const event = createMockEvent({
                method: 'POST',
                cookies: { [CSRF_COOKIE]: 'cookie-token' },
                headers: { [CSRF_HEADER]: 'header-token' },
            });

            const middleware = createCSRFMiddleware();
            const resolve = vi.fn().mockResolvedValue(new Response('OK'));

            const response = await middleware({ event, resolve });

            expect(response.status).toBe(403);
        });

        it('should skip CSRF for GET requests', async () => {
            const event = createMockEvent({
                method: 'GET',
            });

            const middleware = createCSRFMiddleware();
            const resolve = vi.fn().mockResolvedValue(new Response('OK'));

            await middleware({ event, resolve });

            expect(resolve).toHaveBeenCalled();
        });

        it('should skip CSRF for API key auth', async () => {
            const event = createMockEvent({
                method: 'POST',
                headers: { [API_KEY_HEADER]: 'some-key' },
            });

            const middleware = createCSRFMiddleware({ excludeApiRoutes: true });
            const resolve = vi.fn().mockResolvedValue(new Response('OK'));

            await middleware({ event, resolve });

            expect(resolve).toHaveBeenCalled();
        });

        it('should skip excluded paths', async () => {
            const event = createMockEvent({
                method: 'POST',
                path: '/api/auth/login',
            });

            const middleware = createCSRFMiddleware({
                excludePaths: ['/api/auth/login'],
            });
            const resolve = vi.fn().mockResolvedValue(new Response('OK'));

            await middleware({ event, resolve });

            expect(resolve).toHaveBeenCalled();
        });

        it('should generate unique CSRF tokens', () => {
            const token1 = generateCSRFToken();
            const token2 = generateCSRFToken();

            expect(token1).not.toBe(token2);
            expect(token1.length).toBe(64); // 32 bytes hex
        });
    });

    // ==================== Error Handling Tests ====================

    describe('Error Handling', () => {
        it('handleGuardError should return 401 for AuthRequiredError', () => {
            const error = new AuthRequiredError('Please login');
            const response = handleGuardError(error);

            expect(response.status).toBe(401);
        });

        it('handleGuardError should return 403 for ForbiddenError', () => {
            const error = new ForbiddenError('Access denied');
            const response = handleGuardError(error);

            expect(response.status).toBe(403);
        });

        it('handleGuardError should re-throw unknown errors', () => {
            const error = new Error('Unknown error');

            expect(() => handleGuardError(error)).toThrow('Unknown error');
        });
    });

    // ==================== Utility Tests ====================

    describe('Utility Functions', () => {
        it('createPermissionChecker should wrap permission manager', () => {
            const mockPermissionManager = {
                hasPermission: vi.fn().mockReturnValue(true),
            };

            const checker = createPermissionChecker(mockPermissionManager);
            const result = checker(
                { email: 'test@example.com' } as any,
                'Customer',
                'read'
            );

            expect(result).toBe(true);
            expect(mockPermissionManager.hasPermission).toHaveBeenCalledWith('Customer', 'read');
        });
    });
});
