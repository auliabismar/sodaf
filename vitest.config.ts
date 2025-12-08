import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: [
			'node_modules/**',
			'dist/**',
			'build/**',
			'coverage/**',
			'src/**/*.d.ts'
		],
		environment: 'node',
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/**',
				'dist/**',
				'build/**',
				'coverage/**',
				'src/**/*.d.ts',
				'src/**/*.test.ts',
				'src/**/*.spec.ts',
				'src/**/__tests__/**',
				'src/**/*.config.ts',
				'src/**/*.stories.@(js|jsx|ts|tsx|svelte)',
				'migration/**',
				'**/*.fixture.ts'
			],
			thresholds: {
				global: {
					branches: 70,
					functions: 80,
					lines: 80,
					statements: 80
				}
			}
		},
		testTimeout: 5000,
		hookTimeout: 10000,
		setupFiles: [],
		watch: false,
		sequence: {
			concurrent: true,
			shuffle: false
		},
		bail: 0,
		retry: 0
	}
});