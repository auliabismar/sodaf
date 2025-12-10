import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		environment: 'jsdom',
		setupFiles: ['./src/lib/desk/form/fields/__tests__/setup.ts'],
		globals: true
	},
	resolve: process.env.VITEST ? {
		conditions: ['browser']
	} : undefined
});
