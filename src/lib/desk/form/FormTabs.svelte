<script lang="ts">
	import type { DocField } from '../../meta/doctype/types';

	type Tab = {
		label: string;
		fieldname: string;
	};

	type Props = {
		tabs: Tab[];
		activeTab?: string;
		onTabChange: (fieldname: string) => void;
	};

	let { tabs, activeTab, onTabChange }: Props = $props();

	let currentTab = $state(activeTab || (tabs.length > 0 ? tabs[0].fieldname : ''));

	// Update state when activeTab prop changes
	$effect(() => {
		if (activeTab && activeTab !== currentTab) {
			currentTab = activeTab;
		}
	});

	function handleTabClick(fieldname: string) {
		currentTab = fieldname;
		onTabChange(fieldname);
	}
</script>

{#if tabs.length > 0}
	<div class="form-tabs">
		<div class="tab-list" role="tablist">
			{#each tabs as tab}
				<button
					class="tab-button"
					class:active={currentTab === tab.fieldname}
					role="tab"
					aria-selected={currentTab === tab.fieldname}
					aria-controls={`panel-${tab.fieldname}`}
					onclick={() => handleTabClick(tab.fieldname)}
					type="button"
				>
					{tab.label}
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
	.form-tabs {
		border-bottom: 1px solid var(--border-color, #e2e8f0);
		margin-bottom: 1.5rem;
		background-color: var(--bg-surface, #ffffff);
	}

	.tab-list {
		display: flex;
		gap: 1.5rem;
		padding: 0 1.5rem;
		overflow-x: auto;
	}

	.tab-button {
		background: none;
		border: none;
		padding: 1rem 0;
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-muted, #64748b);
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.tab-button:hover {
		color: var(--text-color, #1e293b);
	}

	.tab-button.active {
		color: var(--primary-color, #3b82f6);
		border-bottom-color: var(--primary-color, #3b82f6);
	}

	.tab-button:focus-visible {
		outline: none;
		color: var(--primary-color, #3b82f6);
	}
</style>
