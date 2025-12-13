<script lang="ts">
	/**
	 * DocType Form Page
	 * P3-020-T3: Shows form view for a document
	 */
	import { page } from '$app/stores';
	import { FormView } from '$lib/desk/form';
	import type { FormMeta, FormDoc } from '$lib/desk/form/types';

	let doctype = $derived($page.params.doctype);
	let name = $derived($page.params.name);

	// Demo meta - in real app this would come from DocType meta
	let meta = $derived<FormMeta>({
		doctype,
		name: doctype,
		fields: [
			{ fieldname: 'name', label: 'ID', fieldtype: 'Data', reqd: 1, read_only: 1 },
			{ fieldname: 'title', label: 'Title', fieldtype: 'Data', reqd: 1 },
			{ fieldname: 'description', label: 'Description', fieldtype: 'Text Editor' },
			{ fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Draft\nOpen\nClosed' },
			{ fieldname: 'modified', label: 'Modified', fieldtype: 'Datetime', read_only: 1 }
		],
		is_submittable: false,
		is_single: false,
		permissions: [{ permLevel: 0, read: 1, write: 1, create: 1, delete: 1 }]
	});

	// Demo doc - in real app this would come from API
	let doc = $state<FormDoc>({
		doctype,
		name,
		title: `Document ${name}`,
		description: 'This is a sample document description.',
		status: 'Open',
		modified: '2024-01-15 10:30:00',
		docstatus: 0
	});

	let loading = $state(false);
	let dirty = $state(false);

	async function handleSave() {
		loading = true;
		// Simulate API call
		await new Promise((r) => setTimeout(r, 500));
		dirty = false;
		loading = false;
	}
</script>

<svelte:head>
	<title>{name} - {doctype} | Desk</title>
</svelte:head>

<div class="form-page" data-testid="form-page">
	<FormView {meta} {doc} {loading} {dirty} onSave={handleSave} />
</div>

<style>
	.form-page {
		min-height: 100%;
	}
</style>
