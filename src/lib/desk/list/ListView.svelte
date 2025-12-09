<script lang="ts">
	import { onMount, onDestroy, afterUpdate } from 'svelte';
	import { DataTable, Pagination, SkeletonText } from 'carbon-components-svelte';
	import { ListController } from './list-controller';
	import ListToolbar from './ListToolbar.svelte';
	import ListFilters from './ListFilters.svelte';
	import ListPagination from './ListPagination.svelte';
	import ListRow from './ListRow.svelte';
	import type { ListViewConfig, ListViewState } from './types';
	import { loadColumnWidths, saveColumnWidths, type ColumnWidth } from './column-resize';

	export let doctype: string;
	export let config: ListViewConfig;

	const controller = new ListController(doctype, config);
	let state: ListViewState;
	let tableContainer: HTMLDivElement;
	let focusedRowIndex = -1;

	// Local selection state for Carbon DataTable binding
	let selectedRowIds: string[] = [];

	// Column widths with persistence
	let columnWidths: Record<string, string> = {};

	const unsubscribe = controller.subscribe((value) => {
		state = value;
		// Sync from controller to local if different (e.g., after deselectAll)
		if (JSON.stringify(selectedRowIds) !== JSON.stringify(value.selection)) {
			selectedRowIds = [...value.selection];
		}
	});

	// Sync selection changes from DataTable back to controller
	$: {
		if (state && JSON.stringify(selectedRowIds) !== JSON.stringify(state.selection)) {
			// Update controller with new selection
			controller['store'].update((s) => ({ ...s, selection: [...selectedRowIds] }));
		}
	}

	onMount(() => {
		controller.loadData();

		// Load persisted column widths
		const savedWidths = loadColumnWidths(doctype);
		if (savedWidths) {
			savedWidths.forEach((w) => {
				columnWidths[w.fieldname] = `${w.width}px`;
			});
		}

		// Delay to allow DataTable to render
		setTimeout(setupColumnResize, 500);
	});

	// Re-setup resize handles after updates (e.g., data changes)
	let resizeSetupDone = false;
	afterUpdate(() => {
		if (state.data.length > 0 && !resizeSetupDone) {
			setTimeout(() => {
				console.log('afterUpdate: setting up column resize');
				setupColumnResize();
				resizeSetupDone = true;
			}, 100);
		}
	});

	onDestroy(() => {
		unsubscribe();
	});

	// Prepare headers for DataTable with saved widths
	$: headers = [
		...config.columns.map((col) => ({
			key: col.fieldname,
			value: col.label,
			sortable: col.sortable !== false,
			width: columnWidths[col.fieldname] || col.width
		})),
		...(config.row_actions?.length ? [{ key: '_actions', value: '', empty: true }] : [])
	];

	$: rows = state.data.map((row: any) => ({
		id: row.name,
		...row,
		_actions: 'actions'
	}));

	function handleSort(e: CustomEvent) {
		if (e.detail.header.key === '_actions') return;
		const order = e.detail.sortDirection === 'ascending' ? 'asc' : 'desc';
		controller.setSort(e.detail.header.key, order);
	}

	// T27: Keyboard navigation
	function handleKeyDown(e: KeyboardEvent) {
		if (!rows.length) return;

		// Don't intercept keyboard when user is typing in an input
		const target = e.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				focusedRowIndex = Math.min(focusedRowIndex + 1, rows.length - 1);
				highlightRow(focusedRowIndex);
				break;
			case 'ArrowUp':
				e.preventDefault();
				focusedRowIndex = Math.max(focusedRowIndex - 1, 0);
				highlightRow(focusedRowIndex);
				break;
			case ' ': // Space - toggle selection
				e.preventDefault();
				if (focusedRowIndex >= 0 && focusedRowIndex < rows.length) {
					const rowId = rows[focusedRowIndex].id;
					if (selectedRowIds.includes(rowId)) {
						selectedRowIds = selectedRowIds.filter((id) => id !== rowId);
					} else {
						selectedRowIds = [...selectedRowIds, rowId];
					}
				}
				break;
			case 'Enter': // Open row detail
				e.preventDefault();
				if (focusedRowIndex >= 0 && focusedRowIndex < rows.length) {
					const row = rows[focusedRowIndex];
					window.location.href = `/desk/${doctype}/${row.id}`;
				}
				break;
		}
	}

	function highlightRow(index: number) {
		if (!tableContainer) return;
		const tableRows = tableContainer.querySelectorAll('tbody tr');
		tableRows.forEach((tr, i) => {
			tr.classList.toggle('keyboard-focused', i === index);
		});
		// Scroll into view
		tableRows[index]?.scrollIntoView({ block: 'nearest' });
	}

	// T26: Column resize setup
	function setupColumnResize() {
		if (!tableContainer) return;
		const headerCells = tableContainer.querySelectorAll('thead th');
		console.log('Found header cells:', headerCells.length);

		headerCells.forEach((th) => {
			// Skip if already has resize handle
			if (th.querySelector('.column-resize-handle')) return;

			// Get the header text to match with our column config
			const headerText = th.textContent?.trim() || '';

			// Find matching column by label
			const matchingCol = config.columns.find((col) => col.label === headerText);
			if (!matchingCol) {
				console.log('Skipping th (no match):', headerText);
				return;
			}

			const key = matchingCol.fieldname;
			console.log('Adding resize handle to column:', key, 'label:', headerText);

			// Create resize handle
			const handle = document.createElement('div');
			handle.className = 'column-resize-handle';
			handle.style.cssText = `
				position: absolute;
				right: 0;
				top: 0;
				bottom: 0;
				width: 8px;
				cursor: col-resize;
				background: transparent;
				z-index: 100;
			`;
			(th as HTMLElement).style.position = 'relative';
			th.appendChild(handle);

			let startX: number;
			let startWidth: number;

			handle.addEventListener('mousedown', (e) => {
				e.preventDefault();
				e.stopPropagation();
				startX = e.clientX;
				startWidth = (th as HTMLElement).offsetWidth;
				handle.classList.add('resizing');

				const onMouseMove = (e: MouseEvent) => {
					const diff = e.clientX - startX;
					const newWidth = Math.max(50, startWidth + diff);
					(th as HTMLElement).style.width = `${newWidth}px`;
				};

				const onMouseUp = () => {
					handle.classList.remove('resizing');
					document.removeEventListener('mousemove', onMouseMove);
					document.removeEventListener('mouseup', onMouseUp);

					// Save to state and localStorage
					columnWidths[key] = `${(th as HTMLElement).offsetWidth}px`;
					const widthsArray: ColumnWidth[] = Object.entries(columnWidths).map(([fieldname, width]) => ({
						fieldname,
						width: parseInt(width)
					}));
					saveColumnWidths(doctype, widthsArray);
				};

				document.addEventListener('mousemove', onMouseMove);
				document.addEventListener('mouseup', onMouseUp);
			});
		});
	}
</script>

<div
	class="list-view-container"
	bind:this={tableContainer}
	tabindex="0"
	on:keydown={handleKeyDown}
	role="grid"
	aria-label="Data table"
>
	<ListToolbar {controller} bulkActions={config.bulk_actions} columns={config.columns} />

	<ListFilters {controller} filterConfig={config.filters} />

	{#if state.error}
		<div class="error-state">
			<div class="error-icon">⚠️</div>
			<h3>Error loading data</h3>
			<p>{state.error}</p>
			<button on:click={() => controller.refresh()}>Try Again</button>
		</div>
	{:else if state.loading && state.data.length === 0}
		<div style="padding: 1rem">
			<SkeletonText paragraph lines={5} />
		</div>
	{:else}
		<DataTable
			{headers}
			{rows}
			sortable
			selectable
			batchSelection
			bind:selectedRowIds
			on:click:header={handleSort}
		>
			<svelte:fragment slot="cell" let:row let:cell>
				{#if cell.key === '_actions'}
					<div class="row-actions">
						<ListRow {row} actions={config.row_actions} />
					</div>
				{:else}
					{@const col = config.columns.find((c) => c.fieldname === cell.key)}
					{#if col && col.formatter}
						{@html col.formatter(cell.value, row)}
					{:else}
						{cell.value}
					{/if}
				{/if}
			</svelte:fragment>
		</DataTable>
	{/if}

	<ListPagination {controller} />
</div>

<style>
	.list-view-container {
		padding: 1rem;
		background: var(--cds-layer);
		outline: none;
	}
	.list-view-container:focus {
		outline: 2px solid var(--cds-focus, #0f62fe);
		outline-offset: -2px;
	}
	.row-actions {
		display: flex;
		justify-content: flex-end;
	}
	:global(.column-resize-handle) {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		width: 5px;
		cursor: col-resize;
		background: transparent;
		z-index: 10;
	}
	:global(.column-resize-handle:hover),
	:global(.column-resize-handle.resizing) {
		background: var(--cds-interactive, #0f62fe);
	}
	:global(tr.keyboard-focused) {
		outline: 2px solid var(--cds-focus, #0f62fe);
		outline-offset: -2px;
	}
	.error-state {
		padding: 2rem;
		text-align: center;
		background: var(--cds-layer);
		border: 1px solid var(--cds-border-subtle);
		margin: 1rem 0;
	}
	.error-state .error-icon {
		font-size: 3rem;
	}
	.error-state h3 {
		color: var(--cds-text-error, #da1e28);
		margin: 0.5rem 0;
	}
	.error-state p {
		color: var(--cds-text-secondary);
		margin-bottom: 1rem;
	}
	.error-state button {
		background: var(--cds-interactive, #0f62fe);
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		cursor: pointer;
	}
</style>
