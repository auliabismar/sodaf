import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		environment: 'jsdom',
		setupFiles: ['./src/lib/desk/form/fields/__tests__/setup.ts'],
		globals: true,
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['node_modules', 'dist', '.svelte-kit'],
		server: {
			deps: {
				inline: [/svelte/, /carbon-components-svelte/]
			}
		}
	},
	resolve: {
		conditions: ['browser'],
		alias: {
			'carbon-icons-svelte': path.resolve(__dirname, './src/lib/desk/form/fields/__tests__/mocks/carbon-icons-svelte.ts')
		}
	},
	optimizeDeps: {
		exclude: ['svelte', '@sveltejs/kit']
	}
});