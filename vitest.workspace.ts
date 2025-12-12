import { defineWorkspace } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineWorkspace([
	{
		// Browser tests for Svelte component testing with real DOM rendering
		extends: './vite.config.ts',
		test: {
			name: 'browser',
			include: ['src/**/*.svelte.test.ts'],
			browser: {
				enabled: true,
				provider: 'playwright',
				instances: [
					{
						browser: 'chromium'
					}
				],
				headless: true
			}
		}
	},
	{
		// jsdom tests for unit testing (controllers, utilities, etc.)
		extends: './vite.config.ts',
		test: {
			name: 'unit',
			include: ['src/**/*.test.ts'],
			exclude: ['src/**/*.svelte.test.ts', 'node_modules', 'dist', '.svelte-kit'],
			environment: 'jsdom',
			globals: true,
			setupFiles: ['./src/lib/desk/form/fields/__tests__/setup.ts'],
			server: {
				deps: {
					inline: [/svelte/, /carbon-components-svelte/]
				}
			}
		},
		resolve: {
			alias: {
				'carbon-icons-svelte': path.resolve(
					__dirname,
					'./src/lib/desk/form/fields/__tests__/mocks/carbon-icons-svelte.ts'
				),
				'carbon-components-svelte': path.resolve(
					__dirname,
					'./src/lib/desk/form/fields/__tests__/mocks/carbon-components-svelte.ts'
				)
			}
		}
	},
	{
		extends: 'vite.config.ts',
		plugins: [
			// The plugin will run tests for the stories defined in your Storybook config
			// See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
			storybookTest({
				configDir: path.join(__dirname, '.storybook')
			})
		],
		test: {
			name: 'storybook',
			browser: {
				enabled: true,
				headless: true,
				provider: 'playwright',
				instances: [
					{
						browser: 'chromium'
					}
				]
			},
			setupFiles: ['.storybook/vitest.setup.ts']
		}
	}
]);
