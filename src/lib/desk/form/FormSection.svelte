<script lang="ts">
	import type { DocField } from '../../meta/doctype/types';
	import type { FormController } from './form-controller';
	import FormColumn from './FormColumn.svelte';

	type Props = {
		section: DocField;
		columns: DocField[][];
		controller: FormController;
		isCollapsed?: boolean;
	};

	let { section, columns, controller, isCollapsed = false }: Props = $props();

	let collapsed = $state(isCollapsed);

	function toggleCollapse() {
		collapsed = !collapsed;
	}
</script>

<div class="form-section" data-fieldname={section.fieldname}>
	{#if section.label}
		<div class="section-header">
			<button class="section-title" onclick={toggleCollapse} type="button">
				<span class="icon">{collapsed ? '▶' : '▼'}</span>
				{section.label}
			</button>
		</div>
	{/if}

	{#if !collapsed}
		<div class="section-body" style:grid-template-columns={`repeat(${columns.length}, 1fr)`}>
			{#each columns as columnFields, i}
				<FormColumn fields={columnFields} {controller} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.form-section {
		margin-bottom: 2rem;
		border-bottom: 1px solid var(--border-color, #e2e8f0);
	}

	.form-section:last-child {
		border-bottom: none;
	}

	.section-header {
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
	}

	.section-title {
		background: none;
		border: none;
		padding: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-color, #1e293b);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.section-title:hover {
		color: var(--primary-color, #3b82f6);
	}

	.icon {
		font-size: 0.75rem;
		color: var(--text-muted, #64748b);
	}

	.section-body {
		display: grid;
		gap: 2rem;
		padding-bottom: 1.5rem;
	}

	@media (max-width: 768px) {
		.section-body {
			grid-template-columns: 1fr !important;
			gap: 1rem;
		}
	}
</style>
