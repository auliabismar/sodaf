import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter()
	},
	
	// Ensure compatibility with Svelte 5
	compilerOptions: {
		compatibility: {
			componentApi: 5
		}
	},
	
	// Configure for testing
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) => {
			if (filename.includes('.test.') || filename.includes('.spec.')) {
				return {
					generate: 'dom',
					css: 'injected'
				};
			}
			return {};
		}
	}
};

export default config;
