<script lang="ts">
	import {
		Button,
		OverflowMenu,
		OverflowMenuItem,
		Search,
		Toolbar,
		ToolbarContent,
		ToolbarSearch,
		ToolbarMenu,
		ToolbarMenuItem
	} from 'carbon-components-svelte';
	import { Add, Renew, TrashCan, Download } from 'carbon-icons-svelte';
	import { onDestroy } from 'svelte';
	import type { ListController } from './list-controller';
	import type { ListViewState, BulkAction, ColumnConfig } from './types';
	import ExportDialog from './ExportDialog.svelte';

	export let controller: ListController;
	export let bulkActions: BulkAction[] = [];
	export let columns: ColumnConfig[] = [];

	let exportDialogOpen = false;

	let state: ListViewState = controller.getState();
	let unsubscribe: () => void;

	$: {
		if (unsubscribe) unsubscribe();
		unsubscribe = controller.subscribe((value) => {
			state = value;
		});
	}

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});

	let searchValue = '';
	let searchTimeout: ReturnType<typeof setTimeout>;

	function handleSearchInput() {
		// Debounce search by 300ms
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			controller.search(searchValue);
		}, 300);
	}

	function handleRefresh() {
		controller.refresh();
	}

	function handleBulkAction(action: BulkAction) {
		console.log('Bulk action clicked:', action.label, 'Selection:', state.selection);
		if (action.action) {
			const selectedRows = controller.getSelectedRows();
			action.action(selectedRows);
		}
	}

	function handleNew() {
		window.location.href = `/desk/${controller.doctype}/new`;
	}
</script>

<Toolbar>
	<ToolbarContent>
		<ToolbarSearch
			bind:value={searchValue}
			on:input={handleSearchInput}
			on:clear={() => controller.search('')}
		/>

		<Button kind="ghost" icon={Renew} iconDescription="Refresh" on:click={handleRefresh} />
		<Button
			kind="ghost"
			icon={Download}
			iconDescription="Export"
			on:click={() => (exportDialogOpen = true)}
		/>

		{#if state.selection.length > 0}
			<ToolbarMenu iconDescription="Actions ({state.selection.length})">
				{#each bulkActions as action}
					<ToolbarMenuItem on:click={() => handleBulkAction(action)}>
						{action.label}
					</ToolbarMenuItem>
				{/each}
				{#if !bulkActions.length}
					<ToolbarMenuItem disabled>No bulk actions</ToolbarMenuItem>
				{/if}
			</ToolbarMenu>
		{/if}

		<Button icon={Add} on:click={handleNew}>New</Button>
	</ToolbarContent>
</Toolbar>

<ExportDialog bind:open={exportDialogOpen} {controller} {columns} />
