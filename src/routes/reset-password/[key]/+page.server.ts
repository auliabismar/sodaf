/**
 * Reset Password Page Server Actions
 * P3-021: Reset password flow
 */
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getUserManager } from '../../../hooks.server';

/**
 * Load function - validate reset key
 * P3-021-T9: Invalid reset key shows error
 */
export const load: PageServerLoad = async ({ params, locals }) => {
    if (locals.user) {
        throw redirect(302, '/app');
    }

    const { key } = params;

    if (!key) {
        return {
            valid: false,
            error: 'Invalid reset link',
        };
    }

    // We don't validate the key on load to avoid revealing information
    // Validation happens on form submit
    return {
        valid: true,
        key,
    };
};

/**
 * Form actions for reset password
 */
export const actions: Actions = {
    default: async ({ request, params }) => {
        const formData = await request.formData();
        const newPassword = formData.get('password')?.toString() || '';
        const confirmPassword = formData.get('confirm_password')?.toString() || '';
        const { key } = params;

        // Validate inputs
        if (!newPassword) {
            return fail(400, {
                error: 'Password is required',
            });
        }

        if (newPassword.length < 8) {
            return fail(400, {
                error: 'Password must be at least 8 characters',
            });
        }

        if (newPassword !== confirmPassword) {
            return fail(400, {
                error: 'Passwords do not match',
            });
        }

        try {
            const userManager = getUserManager();

            // P3-021-T8: Reset password submit updates password
            const success = await userManager.confirmResetPassword(key, newPassword);

            if (success) {
                return {
                    success: true,
                };
            }

            // P3-021-T9: Invalid reset key shows error
            return fail(400, {
                error: 'Invalid or expired reset link. Please request a new one.',
            });

        } catch (error) {
            console.error('Reset password error:', error);

            // Check for specific error types
            if (error instanceof Error && error.message.includes('expired')) {
                return fail(400, {
                    error: 'This reset link has expired. Please request a new one.',
                });
            }

            return fail(400, {
                error: 'Invalid or expired reset link. Please request a new one.',
            });
        }
    },
};
