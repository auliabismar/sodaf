<script lang="ts">
	/**
	 * SidebarItem Component
	 * P3-017: Individual sidebar navigation item with icon and label
	 */
	import type { SidebarItem } from './types';

	type Props = {
		item: SidebarItem;
		collapsed?: boolean;
		active?: boolean;
	};

	let { item, collapsed = false, active = false }: Props = $props();

	function handleClick() {
		if (item.route) {
			window.location.href = item.route;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}
</script>

<button
	class="sidebar-item"
	class:collapsed
	class:active
	onclick={handleClick}
	onkeydown={handleKeyDown}
	title={collapsed ? item.label : undefined}
	aria-current={active ? 'page' : undefined}
	data-testid="sidebar-item-{item.name}"
>
	<span class="sidebar-item-icon" aria-hidden="true">
		{#if item.icon}
			<i class="icon-{item.icon}"></i>
		{:else}
			<span class="icon-placeholder">📁</span>
		{/if}
	</span>
	{#if !collapsed}
		<span class="sidebar-item-label">{item.label}</span>
	{/if}
</button>

<style>
	.sidebar-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.625rem 1rem;
		border: none;
		background: transparent;
		color: var(--text-secondary, #4b5563);
		font-size: 0.875rem;
		text-align: left;
		cursor: pointer;
		border-radius: 0.375rem;
		transition: all 0.15s ease;
	}

	.sidebar-item:hover {
		background: var(--bg-hover, #f3f4f6);
		color: var(--text-primary, #111827);
	}

	.sidebar-item:focus-visible {
		outline: 2px solid var(--focus-ring, #3b82f6);
		outline-offset: -2px;
	}

	.sidebar-item.active {
		background: var(--bg-active, #eff6ff);
		color: var(--text-active, #2563eb);
		font-weight: 500;
	}

	.sidebar-item.collapsed {
		justify-content: center;
		padding: 0.625rem;
	}

	.sidebar-item-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
	}

	.sidebar-item-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.icon-placeholder {
		font-size: 1rem;
	}
</style>
