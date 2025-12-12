// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...svelte.configs['flat/recommended'],
    {
		ignores: ['build/', '.svelte-kit/', 'dist/']
	},
    {
		rules: {
			// Add any custom rules here
		}
	},
    ...storybook.configs["flat/recommended"],
    ...storybook.configs["flat/recommended"]
];
