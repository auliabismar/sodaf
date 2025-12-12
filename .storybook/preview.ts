import type { Preview } from "@storybook/sveltekit";
import 'carbon-components-svelte/css/g90.css';

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
};

export default preview;
