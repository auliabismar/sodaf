// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { UserSessionCache } from '$lib/cache/types';
import type { CacheManager } from '$lib/cache/cache-manager';
import type { User } from '$lib/auth/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** Current session ID (from cookie) */
			sessionId?: string;
			/** Current user ID */
			userId?: string;
			/** Authenticated user object */
			user?: User | null;
			/** User's roles */
			userRoles?: string[];
			/** Cached user session data */
			userCache?: UserSessionCache;
			/** Global cache manager instance */
			cacheManager?: CacheManager;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
