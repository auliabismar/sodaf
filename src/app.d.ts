// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { UserSessionCache } from '$lib/cache/types';
import type { CacheManager } from '$lib/cache/cache-manager';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** Current session ID (from cookie) */
			sessionId?: string;
			/** Current user ID */
			userId?: string;
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
