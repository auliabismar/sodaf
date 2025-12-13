<script lang="ts">
	/**
	 * DocType List Page
	 * P3-020-T2: Shows list view for a doctype
	 */
	import { page } from '$app/stores';
	import { ListView } from '$lib/desk/list';

	let doctype = $derived($page.params.doctype);

	// Demo columns - in real app this would come from DocType meta
	let columns = $derived([
		{ fieldname: 'name', label: 'ID', fieldtype: 'Link' as const, width: 150 },
		{ fieldname: 'title', label: 'Title', fieldtype: 'Data' as const, width: 200 },
		{ fieldname: 'status', label: 'Status', fieldtype: 'Select' as const, width: 120 },
		{ fieldname: 'modified', label: 'Modified', fieldtype: 'Datetime' as const, width: 150 }
	]);

	// Demo data - in real app this would come from API
	let data = $state([
		{ name: 'DOC-001', title: 'First Document', status: 'Open', modified: '2024-01-15 10:30:00' },
		{ name: 'DOC-002', title: 'Second Document', status: 'Closed', modified: '2024-01-14 15:45:00' },
		{ name: 'DOC-003', title: 'Third Document', status: 'Draft', modified: '2024-01-13 09:20:00' }
	]);

	let loading = $state(false);
	let selectedRows = $state<string[]>([]);

	function handleRowClick(row: Record<string, unknown>) {
		// Navigate to form view
		window.location.href = `/app/${doctype}/${row.name}`;
	}
</script>

<svelte:head>
	<title>{doctype} List | Desk</title>
</svelte:head>

<div class="list-page" data-testid="list-page">
	<div class="list-header">
		<h1 class="list-title">{doctype}</h1>
		<a href="/app/{doctype}/new" class="new-btn" data-testid="new-document-btn">
			+ New {doctype}
		</a>
	</div>

	<ListView
		{doctype}
		{columns}
		{data}
		{loading}
		totalCount={data.length}
		bind:selectedRows
		onRowClick={handleRowClick}
	/>
</div>

<style>
	.list-page {
		padding: 1.5rem;
	}

	.list-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.list-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary, #111827);
		margin: 0;
	}

	.new-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--primary, #3b82f6);
		color: white;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		transition: background 0.15s ease;
	}

	.new-btn:hover {
		background: var(--primary-dark, #2563eb);
	}
</style>
