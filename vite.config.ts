import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { playwright } from '@vitest/browser-playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		conditions: ['browser'],
	},
	// optimizeDeps: {
	// 	exclude: ['svelte', '@sveltejs/kit']
	// },
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'src/**/*.svelte.test.ts'],
		browser: {
			enabled: true,
			provider: playwright(),
			instances: [
				{ browser: 'chromium' }
			],
			headless: true
		}
	}
});