<script lang="ts">
	/**
	 * New Document Page
	 * P3-020-T4: Shows empty form for new document
	 */
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { FormView } from '$lib/desk/form';
	import type { FormMeta, FormDoc } from '$lib/desk/form/types';

	let doctype = $derived($page.params.doctype);

	// Demo meta - in real app this would come from DocType meta
	let meta = $derived<FormMeta>({
		doctype,
		name: doctype,
		fields: [
			{ fieldname: 'title', label: 'Title', fieldtype: 'Data', reqd: 1 },
			{ fieldname: 'description', label: 'Description', fieldtype: 'Text Editor' },
			{
				fieldname: 'status',
				label: 'Status',
				fieldtype: 'Select',
				options: 'Draft\nOpen\nClosed',
				default: 'Draft'
			}
		],
		is_submittable: false,
		is_single: false,
		permissions: [{ permLevel: 0, read: 1, write: 1, create: 1, delete: 1 }]
	});

	// Empty doc for new entry
	let doc = $state<FormDoc>({
		doctype,
		name: '',
		title: '',
		description: '',
		status: 'Draft',
		docstatus: 0
	});

	let loading = $state(false);
	let dirty = $state(true); // New doc is always "dirty"

	async function handleSave() {
		loading = true;
		// Simulate API call - in real app this would create the document
		await new Promise((r) => setTimeout(r, 500));

		// Generate a name and redirect to the form view
		const newName = `${doctype.toUpperCase().slice(0, 3)}-${Date.now().toString(36).toUpperCase()}`;
		loading = false;

		goto(`/app/${doctype}/${newName}`);
	}
</script>

<svelte:head>
	<title>New {doctype} | Desk</title>
</svelte:head>

<div class="new-form-page" data-testid="new-form-page">
	<FormView {meta} {doc} {loading} {dirty} isNew={true} onSave={handleSave} />
</div>

<style>
	.new-form-page {
		min-height: 100%;
	}
</style>
