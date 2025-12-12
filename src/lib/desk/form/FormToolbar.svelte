<script lang="ts">
	import type { FormController } from './form-controller';
	import type { FormViewState } from './types';

	type Props = {
		controller: FormController;
		title?: string;
	};

	let { controller, title }: Props = $props();

	// Subscribe to store for reactivity
	let state: FormViewState = $state(controller.getState());

	$effect(() => {
		const unsubscribe = controller.subscribe((newState) => {
			state = newState;
		});
		return unsubscribe;
	});

	let isDirty = $derived(state.is_dirty);
	let isNew = $derived(state.is_new);
	let isSaving = $derived(state.is_saving);
	let docstatus = $derived(state.docstatus);

	async function handleSave() {
		await controller.save();
	}

	async function handleSubmit() {
		await controller.submit();
	}

	async function handleCancel() {
		await controller.cancel();
	}

	async function handleDiscard() {
		await controller.reload();
	}

	async function handleDelete() {
		if (confirm('Are you sure you want to delete this document?')) {
			await controller.delete();
		}
	}
</script>

<div class="form-toolbar">
	<div class="toolbar-left">
		<div class="title-area">
			<h1 class="form-title" title={title || state.name}>
				{title || state.name || 'New ' + controller.doctype}
			</h1>
			{#if isDirty}
				<span class="status-badge dirty">Not Saved</span>
			{:else if isNew}
				<span class="status-badge new">New</span>
			{:else if docstatus === 1}
				<span class="status-badge submitted">Submitted</span>
			{:else if docstatus === 2}
				<span class="status-badge cancelled">Cancelled</span>
			{/if}
		</div>
	</div>

	<div class="toolbar-right">
		{#if !isNew && isDirty}
			<button class="btn btn-secondary" onclick={handleDiscard} disabled={isSaving}> Discard </button>
		{/if}

		{#if docstatus === 0}
			<button class="btn btn-primary" onclick={handleSave} disabled={isSaving}>
				{isSaving ? 'Saving...' : 'Save'}
			</button>
			{#if !isNew && !isDirty}
				<!-- Assuming submittable logic checks would be here -->
				<button class="btn btn-primary" onclick={handleSubmit} disabled={isSaving}> Submit </button>
			{/if}
		{:else if docstatus === 1}
			<button class="btn btn-danger" onclick={handleCancel} disabled={isSaving}> Cancel </button>
		{:else if docstatus === 2}
			<button class="btn btn-primary" onclick={() => controller.amend()} disabled={isSaving}> Amend </button>
		{/if}

		<div class="menu-actions">
			<button class="btn btn-icon" title="More Actions">
				<span class="icon">⋮</span>
			</button>
			<!-- Menu implementation would go here (Delete, Print, Email, etc.) -->
			{#if !isNew && docstatus !== 1}
				<button class="btn btn-danger btn-sm" onclick={handleDelete}>Delete</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.form-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1.5rem;
		background-color: var(--bg-surface, #ffffff);
		border-bottom: 1px solid var(--border-color, #e2e8f0);
		height: 60px;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.title-area {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.form-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-color, #1e293b);
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 300px;
	}

	.status-badge {
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-weight: 500;
		text-transform: uppercase;
	}

	.status-badge.dirty {
		background-color: #fef3c7;
		color: #d97706;
	}

	.status-badge.new {
		background-color: #dbeafe;
		color: #2563eb;
	}

	.status-badge.submitted {
		background-color: #dcfce7;
		color: #16a34a;
	}

	.status-badge.cancelled {
		background-color: #fee2e2;
		color: #dc2626;
	}

	.toolbar-right {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid transparent;
		transition: all 0.2s;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.btn-primary {
		background-color: var(--primary-color, #3b82f6);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: var(--primary-hover, #2563eb);
	}

	.btn-secondary {
		background-color: white;
		border-color: var(--border-color, #e2e8f0);
		color: var(--text-color, #1e293b);
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: var(--bg-hover, #f8fafc);
		border-color: var(--border-hover, #cbd5e1);
	}

	.btn-danger {
		background-color: #fee2e2;
		color: #dc2626;
		border-color: #fecaca;
	}

	.btn-danger:hover {
		background-color: #fecaca;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-icon {
		background: none;
		padding: 0.5rem;
		color: var(--text-muted, #64748b);
		font-size: 1.25rem;
	}

	.btn-icon:hover {
		background-color: var(--bg-hover, #f8fafc);
		color: var(--text-color, #1e293b);
	}

	.btn-sm {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
	}

	.menu-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-left: 1px solid var(--border-color, #e2e8f0);
		padding-left: 0.75rem;
	}
</style>
