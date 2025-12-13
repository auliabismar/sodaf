/**
 * Login Page Server Actions
 * P3-021: Login page with authentication
 */
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAuthManager } from '../../hooks.server';
import {
    AuthenticationError,
    UserDisabledError,
    AccountLockedError,
    SESSION_COOKIE,
} from '$lib/auth';

/**
 * Load function - redirect if already logged in
 * P3-021-T11: Already logged in redirects to /app
 */
export const load: PageServerLoad = async ({ locals }) => {
    if (locals.user) {
        throw redirect(302, '/app');
    }
    return {};
};

/**
 * Form actions for login
 */
export const actions: Actions = {
    default: async ({ request, cookies, getClientAddress }) => {
        const formData = await request.formData();
        const email = formData.get('email')?.toString() || '';
        const password = formData.get('password')?.toString() || '';
        const rememberMe = formData.get('remember_me') === 'on';

        // Validate inputs
        if (!email) {
            return fail(400, {
                error: 'Email is required',
                email,
            });
        }

        if (!password) {
            return fail(400, {
                error: 'Password is required',
                email,
            });
        }

        try {
            const authManager = getAuthManager();

            // P3-021-T2: Valid login
            // P3-021-T4: Remember me checkbox for extended session
            const result = await authManager.login(
                {
                    email,
                    password,
                    remember_me: rememberMe,
                },
                {
                    ip_address: getClientAddress(),
                    device: request.headers.get('user-agent') || 'Unknown',
                }
            );

            if (result.success && result.token && result.session) {
                // Set session cookie
                const cookieOptions = {
                    path: '/',
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax' as const,
                    maxAge: rememberMe
                        ? 30 * 24 * 60 * 60  // 30 days for remember me
                        : 24 * 60 * 60,       // 24 hours default
                };

                cookies.set(SESSION_COOKIE, result.token.token, cookieOptions);

                // Redirect to app
                throw redirect(302, '/app');
            }

            // Should not reach here, but handle just in case
            return fail(401, {
                error: 'Authentication failed',
                email,
            });

        } catch (error) {
            // P3-021-T3: Invalid credentials show error
            if (error instanceof AuthenticationError) {
                return fail(401, {
                    error: 'Invalid email or password',
                    email,
                });
            }

            if (error instanceof UserDisabledError) {
                return fail(403, {
                    error: 'Your account has been disabled. Please contact support.',
                    email,
                });
            }

            if (error instanceof AccountLockedError) {
                return fail(403, {
                    error: 'Your account is temporarily locked due to too many failed attempts. Please try again later.',
                    email,
                });
            }

            // Re-throw redirect
            if (error instanceof Response) {
                throw error;
            }

            // Unknown error
            console.error('Login error:', error);
            return fail(500, {
                error: 'An unexpected error occurred. Please try again.',
                email,
            });
        }
    },
};
