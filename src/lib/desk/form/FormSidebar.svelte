<script lang="ts">
	import type { FormViewState } from './types';

	type Props = {
		state: FormViewState;
	};

	let { state }: Props = $props();

	let { doc } = $derived(state);

	const formatTime = (time: string) => {
		if (!time) return '-';
		return new Date(time).toLocaleString();
	};
</script>

<div class="form-sidebar">
	<div class="sidebar-section">
		<h3 class="section-heading">Assigned To</h3>
		<div class="assigned-users">
			<button class="add-btn">+ Add</button>
			<!-- User avatars would go here -->
		</div>
	</div>

	<div class="sidebar-section">
		<h3 class="section-heading">Shared With</h3>
		<div class="shared-users">
			<button class="add-btn">+ Add</button>
		</div>
	</div>

	<div class="sidebar-section">
		<h3 class="section-heading">Tags</h3>
		<div class="tags-list">
			<input type="text" placeholder="Add a tag..." class="tag-input" />
		</div>
	</div>

	<div class="sidebar-section metadata">
		<div class="meta-row">
			<span class="label">Created</span>
			<div class="value">
				<div>{formatTime(doc.creation)}</div>
				<div class="user">{doc.owner}</div>
			</div>
		</div>
		<div class="meta-row">
			<span class="label">Modified</span>
			<div class="value">
				<div>{formatTime(doc.modified)}</div>
				<div class="user">{doc.modified_by}</div>
			</div>
		</div>
	</div>
</div>

<style>
	.form-sidebar {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.sidebar-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.section-heading {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--text-muted, #64748b);
		margin: 0;
		letter-spacing: 0.05em;
	}

	.add-btn {
		background: none;
		border: 1px dashed var(--border-color, #e2e8f0);
		border-radius: 9999px; /* Pill */
		padding: 0.25rem 0.75rem;
		font-size: 0.8rem;
		color: var(--text-muted, #64748b);
		cursor: pointer;
		width: max-content;
	}

	.add-btn:hover {
		border-color: var(--primary-color, #3b82f6);
		color: var(--primary-color, #3b82f6);
	}

	.tag-input {
		width: 100%;
		border: none;
		background: transparent;
		border-bottom: 1px solid var(--border-color, #e2e8f0);
		padding: 0.25rem 0;
		font-size: 0.875rem;
		outline: none;
	}

	.tag-input:focus {
		border-color: var(--primary-color, #3b82f6);
	}

	.metadata {
		margin-top: auto;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-color, #e2e8f0);
	}

	.meta-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.75rem;
		font-size: 0.8rem;
	}

	.meta-row .label {
		color: var(--text-muted, #64748b);
	}

	.meta-row .value {
		text-align: right;
		color: var(--text-color, #1e293b);
	}

	.meta-row .user {
		font-size: 0.75rem;
		color: var(--text-muted, #64748b);
		margin-top: 0.125rem;
	}
</style>
