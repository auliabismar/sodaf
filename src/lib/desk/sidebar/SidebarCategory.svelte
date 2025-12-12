<script lang="ts">
	/**
	 * SidebarCategory Component
	 * P3-017: Category section for grouping sidebar items
	 */
	import type { SidebarSection } from './types';
	import SidebarItem from './SidebarItem.svelte';

	type Props = {
		section: SidebarSection;
		collapsed?: boolean;
		activeItem?: string;
		onToggle?: () => void;
	};

	let { section, collapsed = false, activeItem = '', onToggle }: Props = $props();

	// Initialize from section.collapsed and track local toggle state
	let localToggleState = $state<boolean | null>(null);
	let isExpanded = $derived(localToggleState !== null ? localToggleState : !section.collapsed);

	function toggleExpand() {
		localToggleState = !isExpanded;
		onToggle?.();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			toggleExpand();
		}
	}
</script>

<div class="sidebar-category" class:collapsed data-testid="sidebar-category-{section.title}">
	{#if !collapsed}
		<button
			class="category-header"
			class:expanded={isExpanded}
			onclick={toggleExpand}
			onkeydown={handleKeyDown}
			aria-expanded={isExpanded}
			aria-controls="category-items-{section.title}"
		>
			<span class="category-title">{section.title}</span>
			<span class="category-chevron" aria-hidden="true">
				{isExpanded ? '▼' : '▶'}
			</span>
		</button>
	{/if}

	{#if isExpanded || collapsed}
		<ul class="category-items" id="category-items-{section.title}" role="list">
			{#each section.items as item (item.name)}
				<li>
					<SidebarItem {item} {collapsed} active={activeItem === item.name} />
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.sidebar-category {
		margin-bottom: 0.5rem;
	}

	.category-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.5rem 1rem;
		border: none;
		background: transparent;
		color: var(--text-muted, #6b7280);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		cursor: pointer;
		transition: color 0.15s ease;
	}

	.category-header:hover {
		color: var(--text-primary, #111827);
	}

	.category-header:focus-visible {
		outline: 2px solid var(--focus-ring, #3b82f6);
		outline-offset: -2px;
	}

	.category-chevron {
		font-size: 0.625rem;
		transition: transform 0.15s ease;
	}

	.category-items {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.category-items li {
		margin: 0;
		padding: 0;
	}

	.sidebar-category.collapsed .category-items {
		padding: 0.5rem 0;
		border-top: 1px solid var(--border-subtle, #e5e7eb);
	}
</style>
