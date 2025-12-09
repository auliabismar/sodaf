<script lang="ts">
	import {
		Modal,
		Checkbox,
		RadioButtonGroup,
		RadioButton,
		ProgressBar,
		Button
	} from 'carbon-components-svelte';
	import { createEventDispatcher, onDestroy } from 'svelte';
	import type { ListController } from './list-controller';
	import type { ColumnConfig, ListViewState } from './types';
	import type { ExportProgress } from './export';
	import { performExport } from './export';

	export let open = false;
	export let controller: ListController;
	export let columns: ColumnConfig[] = [];

	const dispatch = createEventDispatcher();

	// Export settings
	let selectedFields: string[] = [];
	let exportFormat: 'csv' | 'xlsx' = 'csv';
	let exportScope: 'all' | 'selected' = 'all';

	// Progress state
	let isExporting = false;
	let progress: ExportProgress | null = null;
	let abortController: AbortController | null = null;

	// Subscribe to controller state for reactive updates
	let state: ListViewState = controller.getState();
	const unsubscribe = controller.subscribe((value) => {
		state = value;
	});

	onDestroy(() => {
		unsubscribe();
	});

	// Derived values
	$: hasSelection = state.selection.length > 0;
	$: selectionCount = state.selection.length;

	// Initialize selected fields when dialog opens
	$: if (open) {
		selectedFields = columns.filter((c) => !c.hidden).map((c) => c.fieldname);
		progress = null;
		isExporting = false;
		// Reset export scope when no selection
		if (!hasSelection) {
			exportScope = 'all';
		}
	}

	function toggleField(fieldname: string) {
		if (selectedFields.includes(fieldname)) {
			selectedFields = selectedFields.filter((f) => f !== fieldname);
		} else {
			selectedFields = [...selectedFields, fieldname];
		}
	}

	function selectAllFields() {
		selectedFields = columns.map((c) => c.fieldname);
	}

	function deselectAllFields() {
		selectedFields = [];
	}

	// Check if a field is selected (for reactive checkbox binding)
	function isFieldSelected(fieldname: string): boolean {
		return selectedFields.includes(fieldname);
	}

	async function handleExport() {
		if (selectedFields.length === 0) return;

		isExporting = true;
		abortController = new AbortController();

		try {
			const currentState = controller.getState();

			await performExport({
				doctype: controller.doctype,
				columns: columns,
				filters: currentState.filters,
				sort: currentState.sort,
				selectedIds: exportScope === 'selected' ? currentState.selection : undefined,
				fields: selectedFields,
				format: exportFormat,
				signal: abortController.signal,
				onProgress: (p) => {
					progress = p;
				}
			});

			// Success - close dialog
			open = false;
			dispatch('exported', { format: exportFormat });
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				progress = { current: 0, total: 0, status: 'cancelled' };
			} else {
				console.error('Export error:', error);
			}
		} finally {
			isExporting = false;
			abortController = null;
		}
	}

	function handleCancel() {
		if (abortController) {
			abortController.abort();
		}
	}

	function handleClose() {
		if (isExporting) {
			handleCancel();
		}
		open = false;
	}

	$: progressPercent = progress ? Math.round((progress.current / Math.max(progress.total, 1)) * 100) : 0;
</script>

<Modal
	bind:open
	modalHeading="Export Data"
	primaryButtonText={isExporting ? 'Exporting...' : 'Export'}
	secondaryButtonText={isExporting ? 'Cancel' : 'Close'}
	primaryButtonDisabled={selectedFields.length === 0 || isExporting}
	on:click:button--primary={handleExport}
	on:click:button--secondary={isExporting ? handleCancel : handleClose}
	on:close={handleClose}
>
	<div class="export-dialog">
		{#if isExporting && progress}
			<div class="progress-section">
				<p class="progress-label">
					{#if progress.status === 'fetching'}
						Fetching records... ({progress.current} of {progress.total || '?'})
					{:else if progress.status === 'processing'}
						Processing data...
					{:else if progress.status === 'cancelled'}
						Export cancelled
					{:else}
						Complete!
					{/if}
				</p>
				<ProgressBar value={progressPercent} max={100} />
			</div>
		{:else}
			<!-- Format Selection -->
			<div class="section">
				<h4>Export Format</h4>
				<RadioButtonGroup bind:selected={exportFormat} legendText="">
					<RadioButton labelText="CSV (.csv)" value="csv" />
					<RadioButton labelText="Excel (.xlsx)" value="xlsx" />
				</RadioButtonGroup>
			</div>

			<!-- Scope Selection -->
			{#if hasSelection}
				<div class="section">
					<h4>Export Scope</h4>
					<RadioButtonGroup bind:selected={exportScope} legendText="">
						<RadioButton labelText="All records" value="all" />
						<RadioButton labelText="Selected only ({state.selection.length})" value="selected" />
					</RadioButtonGroup>
				</div>
			{/if}

			<!-- Field Selection -->
			<div class="section">
				<div class="field-header">
					<h4>Fields to Export</h4>
					<div class="field-actions">
						<Button kind="ghost" size="small" onclick={selectAllFields}>Select All</Button>
						<Button kind="ghost" size="small" onclick={deselectAllFields}>Clear All</Button>
					</div>
				</div>
				<div class="field-list">
					{#each columns as column (column.fieldname)}
						<Checkbox
							labelText={column.label}
							checked={selectedFields.includes(column.fieldname)}
							on:change={() => toggleField(column.fieldname)}
						/>
					{/each}
				</div>
				{#if selectedFields.length === 0}
					<p class="warning">Please select at least one field to export.</p>
				{/if}
			</div>
		{/if}
	</div>
</Modal>

<style>
	.export-dialog {
		min-height: 200px;
	}

	.section {
		margin-bottom: 1.5rem;
	}

	.section h4 {
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.field-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.field-actions {
		display: flex;
		gap: 0.5rem;
	}

	.field-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.5rem;
		max-height: 200px;
		overflow-y: auto;
		padding: 0.5rem;
		border: 1px solid var(--cds-border-subtle);
		border-radius: 4px;
	}

	.warning {
		color: var(--cds-text-error, #da1e28);
		font-size: 0.875rem;
		margin-top: 0.5rem;
	}

	.progress-section {
		padding: 2rem 0;
	}

	.progress-label {
		margin-bottom: 1rem;
		text-align: center;
	}
</style>
