import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|ts|svelte)"
  ],
  "addons": [
    "@storybook/addon-svelte-csf",
    "@storybook/addon-docs",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions"
  ],
  "framework": {
    "name": "@storybook/sveltekit",
    "options": {}
  },
  async viteFinal(config) {
    config.optimizeDeps = {
      ...(config.optimizeDeps || {}),
      include: [
        ...(config.optimizeDeps?.include || []),
        'axobject-query',
        'aria-query',
        '@jridgewell/resolve-uri',
      ],
    };
    return config;
  }
};
export default config;