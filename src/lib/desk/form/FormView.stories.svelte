<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FormView from './FormView.svelte';

	const { Story } = defineMeta({
		title: 'Desk/Form/FormView',
		component: FormView,
		argTypes: {
			doctype: { control: 'text' },
			name: { control: 'text' }
		}
	});
</script>

<!-- Mock API handler would be needed for real data loading, 
     but FormView loads data via FormController which fetches from API. 
     For Storybook, we might see loading state or errors unless we mock fetch.
     However, we can at least see the structure if we mock the controller or API.
     
     Since we can't easily mock fetch globally here without decorators,
     we'll just show the component. It might show "Loading..." or error.
     
     To make it useful, we really should mock the API response.
-->

<Story name="New Document" args={{ doctype: 'ToDo' }} />

<Story name="Existing Document" args={{ doctype: 'ToDo', name: 'TODO-2024-001' }} />
