/**
 * Logout Endpoint
 * P3-021: Logout and session clearing
 * P3-021-T10: Logout endpoint clears session
 */
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthManager } from '../../hooks.server';
import { SESSION_COOKIE } from '$lib/auth';

export const GET: RequestHandler = async ({ cookies, locals }) => {
    const sessionToken = cookies.get(SESSION_COOKIE);

    if (sessionToken && locals.sessionId) {
        try {
            const authManager = getAuthManager();
            await authManager.logout(locals.sessionId);
        } catch (error) {
            console.error('Logout error:', error);
            // Continue even if logout fails - we'll still clear the cookie
        }
    }

    // Clear the session cookie
    cookies.delete(SESSION_COOKIE, { path: '/' });

    // Redirect to login page
    throw redirect(302, '/login');
};

export const POST: RequestHandler = async ({ cookies, locals }) => {
    // Also support POST for CSRF-protected logout
    const sessionToken = cookies.get(SESSION_COOKIE);

    if (sessionToken && locals.sessionId) {
        try {
            const authManager = getAuthManager();
            await authManager.logout(locals.sessionId);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    cookies.delete(SESSION_COOKIE, { path: '/' });
    throw redirect(302, '/login');
};
