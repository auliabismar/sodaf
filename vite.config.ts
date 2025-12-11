import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		conditions: ['browser'],
	},
	optimizeDeps: {
		exclude: ['svelte', '@sveltejs/kit']
	}
});