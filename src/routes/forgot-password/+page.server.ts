/**
 * Forgot Password Page Server Actions
 * P3-021: Forgot password flow
 */
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getUserManager } from '../../hooks.server';

/**
 * Load function - redirect if already logged in
 */
export const load: PageServerLoad = async ({ locals }) => {
    if (locals.user) {
        throw redirect(302, '/app');
    }
    return {};
};

/**
 * Form actions for forgot password
 */
export const actions: Actions = {
    default: async ({ request }) => {
        const formData = await request.formData();
        const email = formData.get('email')?.toString() || '';

        // Validate email
        if (!email) {
            return fail(400, {
                error: 'Email is required',
                email,
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return fail(400, {
                error: 'Please enter a valid email address',
                email,
            });
        }

        try {
            const userManager = getUserManager();
            const user = userManager.getUserByEmail(email);

            if (user) {
                // P3-021-T6: Forgot password submit generates reset token
                const resetToken = await userManager.resetPassword(user.name);

                // In a real app, we would send an email here
                // For now, log the reset link for testing
                console.log(`Password reset link: /reset-password/${resetToken.key}`);
            }

            // Always return success (don't reveal if email exists)
            return {
                success: true,
                email,
            };

        } catch (error) {
            console.error('Forgot password error:', error);

            // Still return success to not reveal email existence
            return {
                success: true,
                email,
            };
        }
    },
};
