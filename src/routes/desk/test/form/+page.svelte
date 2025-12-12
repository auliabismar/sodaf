<script lang="ts">
	import FormView from '$lib/desk/form/FormView.svelte';
	import { page } from '$app/stores';

	// Mock generic "ToDo" DocType if not found by controller (Controller interacts with API)
	// Actually FormView will try to load DocType via Controller -> API.
	// So this page relies on the API existing or being mocked.
	// Since I cannot easily mock the API for the real browser view without MSW or similar,
	// I will assume the user has some backend or I might need to make FormView more flexible to accept data directly for testing.

	// However, for the purpose of this task (Frontend Desk), usually we either have an API or mocks.
	// I'll try to use FormView as is.

	let docName = $derived($page.url.searchParams.get('name') || undefined);
	let doctype = $derived($page.url.searchParams.get('doctype') || 'ToDo');
</script>

<div class="test-page" style="height: 100vh;">
	{#key doctype + docName}
		<FormView {doctype} name={docName} />
	{/key}
</div>

<style>
	:global(body) {
		margin: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
			'Helvetica Neue', sans-serif;
	}
</style>
