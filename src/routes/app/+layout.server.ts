/**
 * App Layout Server Load
 * P3-020: Auth check for /app/* routes
 */
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
    // P3-020-T13: Unauthenticated redirect
    if (!locals.user) {
        throw redirect(302, '/login');
    }

    return {
        user: locals.user,
        userRoles: locals.userRoles || []
    };
};
