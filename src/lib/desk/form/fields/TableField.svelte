<script lang="ts">
	import { Button, Checkbox } from 'carbon-components-svelte';
	import { Add, TrashCan, Edit, Save, Close, ArrowUp, ArrowDown } from 'carbon-icons-svelte';
	import BaseField from './BaseField.svelte';
	import FieldRenderer from './FieldRenderer.svelte';
	import type { DocField } from '../../../meta/doctype/types';

	interface Props {
		field: DocField;
		value?: any[];
		error?: string | string[];
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		description?: string;
		hideLabel?: boolean;
		childFields?: DocField[];
		allowAdd?: boolean;
		allowDelete?: boolean;
		allowEdit?: boolean;
		allowReorder?: boolean;
		minRows?: number;
		maxRows?: number;
		onchange?: (value: any[]) => void;
		onblur?: () => void;
		onfocus?: () => void;
	}

	let {
		field,
		value = $bindable([]),
		error = '',
		disabled = false,
		readonly = false,
		required = false,
		description = '',
		hideLabel = false,
		childFields = [],
		allowAdd = true,
		allowDelete = true,
		allowEdit = true,
		allowReorder = true,
		minRows = 0,
		maxRows = 100,
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Internal state
	let editingRow = $state<number | null>(null);
	let editingData = $state<Record<string, any>>({});
	let selectedRows = $state<Set<number>>(new Set());
	let dragStartIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	// Computed properties
	let hasError = $derived(error && error !== '');
	let isDisabled = $derived(disabled || readonly || field.read_only);
	let canAdd = $derived(allowAdd && !isDisabled && (maxRows === undefined || value.length < maxRows));
	let canDelete = $derived(allowDelete && !isDisabled && selectedRows.size > 0);
	let canEdit = $derived(allowEdit && !isDisabled);
	let canReorder = $derived(allowReorder && !isDisabled && value.length > 1);
	let hasMinRows = $derived(minRows > 0 && value.length < minRows);

	// Helper functions
	function createEmptyRow(): Record<string, any> {
		const row: Record<string, any> = {};
		childFields.forEach((childField) => {
			row[childField.fieldname] = childField.default || '';
		});
		return row;
	}

	// CRUD operations
	function addRow() {
		if (isDisabled || !canAdd) return;

		const newRow = createEmptyRow();
		const newValue = [...value, newRow];
		value = newValue;
		onchange?.(newValue);

		// Start editing the new row
		editingRow = value.length - 1;
		editingData = { ...newRow };
	}

	function deleteSelectedRows() {
		if (isDisabled || !allowDelete || selectedRows.size === 0) return;

		const newValue = value.filter((_, i) => !selectedRows.has(i));
		value = newValue;
		selectedRows = new Set();
		onchange?.(newValue);
	}

	function startEditRow(index: number) {
		if (isDisabled || !canEdit) return;

		editingRow = index;
		editingData = { ...value[index] };
	}

	function saveEditRow() {
		if (editingRow === null) return;

		const newValue = [...value];
		newValue[editingRow] = { ...editingData };
		value = newValue;
		editingRow = null;
		editingData = {};
		onchange?.(newValue);
	}

	function cancelEditRow() {
		editingRow = null;
		editingData = {};
	}

	function handleCellChange(rowIndex: number, fieldname: string, cellValue: any) {
		if (editingRow === rowIndex) {
			editingData[fieldname] = cellValue;

			// We need to trigger reactivity for editingData immediately needed?
			// Since editingData is state, updating property might not trigger deep?
			// In Svelte 5, $state object properties are reactive if accessed.
			// But for safety:
			editingData = editingData;
		}
	}

	// Row selection
	function toggleRowSelection(index: number) {
		const newSelected = new Set(selectedRows);
		if (newSelected.has(index)) {
			newSelected.delete(index);
		} else {
			newSelected.add(index);
		}
		selectedRows = newSelected;
	}

	function selectAllRows(checked: boolean) {
		if (checked) {
			selectedRows = new Set(value.map((_, i) => i));
		} else {
			selectedRows = new Set();
		}
	}

	// Drag and drop for reordering
	function handleDragStart(event: DragEvent, index: number) {
		if (!canReorder) return;

		dragStartIndex = index;
		event.dataTransfer?.setData('text/plain', index.toString());
	}

	function handleDragOver(event: DragEvent, index: number) {
		if (!canReorder) return;

		event.preventDefault();
		dragOverIndex = index;
	}

	function handleDrop(event: DragEvent, dropIndex: number) {
		if (!canReorder || dragStartIndex === null) return;

		event.preventDefault();

		if (dragStartIndex !== dropIndex) {
			const newValue = [...value];
			const draggedRow = newValue[dragStartIndex];
			newValue.splice(dragStartIndex, 1);
			newValue.splice(dropIndex, 0, draggedRow);
			value = newValue;
			onchange?.(newValue);
		}

		dragStartIndex = null;
		dragOverIndex = null;
	}

	function moveRowUp(index: number) {
		if (!canReorder || index === 0) return;

		const newValue = [...value];
		[newValue[index - 1], newValue[index]] = [newValue[index], newValue[index - 1]];
		value = newValue;
		onchange?.(newValue);
	}

	function moveRowDown(index: number) {
		if (!canReorder || index === value.length - 1) return;

		const newValue = [...value];
		[newValue[index], newValue[index + 1]] = [newValue[index + 1], newValue[index]];
		value = newValue;
		onchange?.(newValue);
	}

	// Cell rendering helpers
	function getCellDisplayValue(rowIndex: number, fieldname: string): any {
		if (editingRow === rowIndex) {
			return editingData[fieldname];
		}
		return value[rowIndex]?.[fieldname] || '';
	}

	function isCellEditable(rowIndex: number, fieldname: string): boolean {
		return editingRow === rowIndex && canEdit;
	}

	// Event handlers for BaseField
	function handleFieldChange(event: CustomEvent | any) {
		// value = event.detail; // Array already bound?
		// Logic handles updating `value` and dispatching `onchange`
		onchange?.(event.detail);
	}
</script>

<BaseField
	{field}
	{value}
	{error}
	{disabled}
	{readonly}
	{required}
	{description}
	{hideLabel}
	onchange={handleFieldChange}
	{onblur}
	{onfocus}
>
	<div class="table-field-container" class:disabled={isDisabled}>
		{#if hasMinRows}
			<div class="min-rows-warning" role="alert" aria-live="polite">
				Minimum {minRows} row{minRows === 1 ? '' : 's'} required
			</div>
		{/if}

		{#if childFields.length === 0}
			<div class="no-fields-message">No child fields configured for this table</div>
		{:else}
			<div class="table-controls">
				{#if canAdd}
					<Button kind="primary" size="small" icon={Add} onclick={addRow} disabled={!canAdd}>Add Row</Button>
				{/if}

				{#if canDelete}
					<Button
						kind="danger"
						size="small"
						icon={TrashCan}
						onclick={deleteSelectedRows}
						disabled={!canDelete}
					>
						Delete Selected ({selectedRows.size})
					</Button>
				{/if}
			</div>

			<div class="table-wrapper">
				<table class="data-table" role="grid" aria-label={field.label || 'Data Table'}>
					<thead>
						<tr>
							{#if allowDelete && !isDisabled}
								<th class="select-column">
									<Checkbox
										checked={selectedRows.size === value.length && value.length > 0}
										indeterminate={selectedRows.size > 0 && selectedRows.size < value.length}
										on:change={(e: any) => selectAllRows(e.detail.checked)}
										labelText="Select all rows"
										hideLabel
									/>
								</th>
							{/if}

							{#each childFields as childField}
								<th>
									{childField.label}
									{#if childField.required}
										<span class="required-indicator" aria-hidden="true">*</span>
									{/if}
								</th>
							{/each}

							{#if (allowEdit || allowReorder) && !isDisabled}
								<th class="actions-column">Actions</th>
							{/if}
						</tr>
					</thead>

					<tbody>
						{#each value as row, rowIndex}
							<tr
								class="data-row"
								class:editing={editingRow === rowIndex}
								class:dragging-over={dragOverIndex === rowIndex}
								draggable={canReorder}
								ondragstart={(e) => handleDragStart(e, rowIndex)}
								ondragover={(e) => handleDragOver(e, rowIndex)}
								ondrop={(e) => handleDrop(e, rowIndex)}
								aria-rowindex={rowIndex + 1}
							>
								{#if allowDelete && !isDisabled}
									<td class="select-column">
										<Checkbox
											checked={selectedRows.has(rowIndex)}
											on:change={() => toggleRowSelection(rowIndex)}
											labelText="Select row"
											hideLabel
										/>
									</td>
								{/if}

								{#each childFields as childField}
									<td
										class="data-cell"
										class:editable={isCellEditable(rowIndex, childField.fieldname)}
										role="gridcell"
										aria-colindex={childField.order || 1}
										aria-readonly={!isCellEditable(rowIndex, childField.fieldname)}
									>
										{#if isCellEditable(rowIndex, childField.fieldname)}
											<div class="cell-editor">
												<FieldRenderer
													field={childField}
													value={getCellDisplayValue(rowIndex, childField.fieldname)}
													onchange={(e: any) => handleCellChange(rowIndex, childField.fieldname, e)}
												/>
											</div>
										{:else}
											<div class="cell-display">
												<FieldRenderer
													field={childField}
													value={getCellDisplayValue(rowIndex, childField.fieldname)}
													readonly={true}
												/>
											</div>
										{/if}
									</td>
								{/each}

								{#if (allowEdit || allowReorder) && !isDisabled}
									<td class="actions-column">
										<div class="row-actions">
											{#if editingRow === rowIndex}
												<Button
													kind="ghost"
													size="small"
													icon={Save}
													iconDescription="Save row"
													onclick={saveEditRow}
												/>
												<Button
													kind="ghost"
													size="small"
													icon={Close}
													iconDescription="Cancel edit"
													onclick={cancelEditRow}
												/>
											{:else}
												{#if canEdit}
													<Button
														kind="ghost"
														size="small"
														icon={Edit}
														iconDescription="Edit row"
														onclick={() => startEditRow(rowIndex)}
													/>
												{/if}

												{#if canReorder}
													<div class="reorder-controls">
														<Button
															kind="ghost"
															size="small"
															icon={ArrowUp}
															iconDescription="Move row up"
															disabled={rowIndex === 0}
															onclick={() => moveRowUp(rowIndex)}
														/>
														<Button
															kind="ghost"
															size="small"
															icon={ArrowDown}
															iconDescription="Move row down"
															disabled={rowIndex === value.length - 1}
															onclick={() => moveRowDown(rowIndex)}
														/>
													</div>
												{/if}
											{/if}
										</div>
									</td>
								{/if}
							</tr>
						{:else}
							<tr class="empty-row">
								<td
									colspan={childFields.length +
										(allowDelete && !isDisabled ? 1 : 0) +
										((allowEdit || allowReorder) && !isDisabled ? 1 : 0)}
								>
									<div class="empty-message">
										{value.length === 0 ? 'No rows added yet' : 'No matching rows found'}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</BaseField>

<style>
	.table-field-container {
		width: 100%;
		border: 1px solid var(--cds-border-subtle);
		border-radius: 0.25rem;
		background-color: var(--cds-background);
	}

	.table-field-container.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.min-rows-warning {
		padding: 0.5rem 1rem;
		background-color: var(--cds-support-warning);
		color: var(--cds-text-on-color);
		font-size: 0.875rem;
		font-weight: 500;
	}

	.no-fields-message {
		padding: 2rem;
		text-align: center;
		color: var(--cds-text-secondary);
		font-style: italic;
	}

	.table-controls {
		display: flex;
		gap: 0.5rem;
		padding: 1rem;
		border-bottom: 1px solid var(--cds-border-subtle);
		background-color: var(--cds-background-layer);
	}

	.table-wrapper {
		overflow-x: auto;
		max-height: 400px;
		overflow-y: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.data-table th {
		position: sticky;
		top: 0;
		background-color: var(--cds-background-layer);
		border-bottom: 2px solid var(--cds-border-strong);
		padding: 0.75rem;
		text-align: left;
		font-weight: 600;
		color: var(--cds-text-primary);
		z-index: 10;
	}

	.data-table td {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--cds-border-subtle);
		vertical-align: middle;
	}

	.data-row:hover {
		background-color: var(--cds-background-hover);
	}

	.data-row.editing {
		background-color: var(--cds-background-selected);
	}

	.data-row.dragging-over {
		background-color: var(--cds-background-selected-hover);
		border-top: 2px solid var(--cds-border-interactive);
	}

	.select-column {
		width: 2rem;
		text-align: center;
	}

	.actions-column {
		width: 8rem;
		text-align: center;
	}

	.data-cell {
		min-width: 8rem;
	}

	.data-cell.editable {
		background-color: var(--cds-field);
	}

	.cell-editor {
		min-height: 2rem;
	}

	.cell-display {
		min-height: 1.5rem;
		display: flex;
		align-items: center;
	}

	.row-actions {
		display: flex;
		gap: 0.25rem;
		justify-content: center;
		align-items: center;
	}

	.reorder-controls {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.empty-row {
		height: 4rem;
	}

	.empty-message {
		text-align: center;
		color: var(--cds-text-secondary);
		font-style: italic;
		padding: 1rem;
	}

	.required-indicator {
		color: var(--cds-support-error);
		margin-left: 0.25rem;
		font-weight: 700;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.table-controls {
			flex-direction: column;
		}

		.data-table {
			font-size: 0.8rem;
		}

		.data-table th,
		.data-table td {
			padding: 0.375rem 0.5rem;
		}

		.actions-column {
			width: 6rem;
		}

		.reorder-controls {
			flex-direction: row;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.data-table th {
			border-bottom-color: WindowText;
		}

		.data-table td {
			border-bottom-color: WindowText;
		}

		.data-row:hover {
			background-color: Highlight;
			color: HighlightText;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.table-field-container * {
			transition: none !important;
			animation: none !important;
		}
	}
</style>
