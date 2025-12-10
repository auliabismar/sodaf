import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'jsdom',
		setupFiles: ['./src/lib/desk/form/fields/__tests__/setup.ts'],
		globals: true,
		include: ['src/**/__tests__/**/*.{test,spec}.{js,ts}'],
		exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
		// Add Svelte 5 specific configuration
		environmentOptions: {
			jsdom: {
				resources: 'usable',
				runScripts: 'dangerously'
			}
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			reportsDirectory: 'coverage',
			include: ['src/lib/desk/form/fields/**/*.{js,ts,svelte}'],
			exclude: [
				'**/__tests__/**',
				'**/*.d.ts',
				'**/node_modules/**'
			],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80
				}
			}
		}
	}
});