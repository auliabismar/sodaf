<script lang="ts">
	/**
	 * Sidebar Component
	 * P3-017: Main sidebar container with navigation sections
	 */
	import type { SidebarSection, SidebarState } from './types';
	import SidebarCategory from './SidebarCategory.svelte';

	type Props = {
		sections: SidebarSection[];
		activeWorkspace?: string;
		collapsed?: boolean;
		loading?: boolean;
		onCollapsedChange?: (collapsed: boolean) => void;
	};

	let {
		sections,
		activeWorkspace = '',
		collapsed = false,
		loading = false,
		onCollapsedChange
	}: Props = $props();

	let focusedIndex = $state(-1);

	// Flatten items for keyboard navigation
	let allItems = $derived(sections.flatMap((s) => s.items));

	function toggleCollapse() {
		const newCollapsed = !collapsed;
		onCollapsedChange?.(newCollapsed);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (allItems.length === 0) return;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				focusedIndex = Math.min(focusedIndex + 1, allItems.length - 1);
				focusItem(focusedIndex);
				break;
			case 'ArrowUp':
				e.preventDefault();
				focusedIndex = Math.max(focusedIndex - 1, 0);
				focusItem(focusedIndex);
				break;
			case 'Home':
				e.preventDefault();
				focusedIndex = 0;
				focusItem(focusedIndex);
				break;
			case 'End':
				e.preventDefault();
				focusedIndex = allItems.length - 1;
				focusItem(focusedIndex);
				break;
		}
	}

	function focusItem(index: number) {
		const item = allItems[index];
		if (item) {
			const element = document.querySelector(`[data-testid="sidebar-item-${item.name}"]`) as HTMLElement;
			element?.focus();
		}
	}
</script>

<nav
	class="sidebar"
	class:collapsed
	role="navigation"
	aria-label="Main navigation"
	onkeydown={handleKeyDown}
	data-testid="sidebar"
>
	<div class="sidebar-header">
		<button
			class="collapse-toggle"
			onclick={toggleCollapse}
			title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			aria-expanded={!collapsed}
			aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			{collapsed ? '▶' : '◀'}
		</button>
	</div>

	<div class="sidebar-content">
		{#if loading}
			<div class="sidebar-skeleton" data-testid="sidebar-loading">
				{#each Array(5) as _, i}
					<div class="skeleton-item" style="animation-delay: {i * 0.1}s"></div>
				{/each}
			</div>
		{:else if sections.length === 0}
			<div class="sidebar-empty" data-testid="sidebar-empty">
				<p>No workspaces available</p>
			</div>
		{:else}
			{#each sections as section (section.title)}
				<SidebarCategory {section} {collapsed} activeItem={activeWorkspace} />
			{/each}
		{/if}
	</div>
</nav>

<style>
	.sidebar {
		display: flex;
		flex-direction: column;
		width: 240px;
		height: 100%;
		background: var(--bg-surface, #ffffff);
		border-right: 1px solid var(--border-color, #e5e7eb);
		transition: width 0.2s ease;
	}

	.sidebar.collapsed {
		width: 64px;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding: 0.75rem;
		border-bottom: 1px solid var(--border-subtle, #e5e7eb);
	}

	.collapse-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: none;
		background: transparent;
		color: var(--text-muted, #6b7280);
		font-size: 0.75rem;
		cursor: pointer;
		border-radius: 0.375rem;
		transition: all 0.15s ease;
	}

	.collapse-toggle:hover {
		background: var(--bg-hover, #f3f4f6);
		color: var(--text-primary, #111827);
	}

	.collapse-toggle:focus-visible {
		outline: 2px solid var(--focus-ring, #3b82f6);
		outline-offset: -2px;
	}

	.sidebar-content {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem 0;
	}

	.sidebar-skeleton {
		padding: 0.5rem;
	}

	.skeleton-item {
		height: 2.5rem;
		margin: 0.25rem 0.5rem;
		background: linear-gradient(
			90deg,
			var(--bg-skeleton, #e5e7eb) 25%,
			var(--bg-skeleton-highlight, #f3f4f6) 50%,
			var(--bg-skeleton, #e5e7eb) 75%
		);
		background-size: 200% 100%;
		border-radius: 0.375rem;
		animation: shimmer 1.5s infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	.sidebar-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		color: var(--text-muted, #6b7280);
		font-size: 0.875rem;
		text-align: center;
	}
</style>
