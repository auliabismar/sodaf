<script lang="ts">
	/**
	 * ShortcutCard Component
	 * P3-017: Workspace shortcut card with icon, label, and async count badge
	 */
	import type { WorkspaceShortcut } from './types';

	type Props = {
		shortcut: WorkspaceShortcut;
		getCount?: (doctype: string, filters?: Record<string, unknown>) => Promise<number>;
	};

	let { shortcut, getCount }: Props = $props();

	let count = $state<number | null>(null);
	let loadingCount = $state(false);

	$effect(() => {
		// Load count asynchronously if getCount is provided
		if (getCount && shortcut.type === 'DocType') {
			loadingCount = true;
			getCount(shortcut.link_to, shortcut.stats_filter)
				.then((c) => {
					count = c;
				})
				.catch(() => {
					count = null;
				})
				.finally(() => {
					loadingCount = false;
				});
		}
	});

	function handleClick() {
		// Navigate to list view for DocType shortcuts
		if (shortcut.type === 'DocType') {
			window.location.href = `/desk/${shortcut.link_to}`;
		} else if (shortcut.type === 'Report') {
			window.location.href = `/desk/Report/${shortcut.link_to}`;
		} else if (shortcut.type === 'Page') {
			window.location.href = `/desk/Page/${shortcut.link_to}`;
		} else {
			window.location.href = `/desk/${shortcut.link_to}`;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}

	// Icon based on type
	function getIcon() {
		switch (shortcut.type) {
			case 'Report':
				return '📊';
			case 'Page':
				return '📄';
			default:
				return '📁';
		}
	}
</script>

<button
	class="shortcut-card"
	onclick={handleClick}
	onkeydown={handleKeyDown}
	data-testid="shortcut-card-{shortcut.link_to}"
>
	<div class="shortcut-icon" aria-hidden="true">
		{getIcon()}
	</div>
	<div class="shortcut-content">
		<span class="shortcut-label">{shortcut.label}</span>
		{#if count !== null}
			<span class="shortcut-count" data-testid="shortcut-count">{count}</span>
		{:else if loadingCount}
			<span class="shortcut-count loading" data-testid="shortcut-count-loading">...</span>
		{/if}
	</div>
</button>

<style>
	.shortcut-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 1.5rem 1rem;
		background: var(--bg-surface, #ffffff);
		border: 1px solid var(--border-color, #e5e7eb);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
		min-height: 120px;
	}

	.shortcut-card:hover {
		background: var(--bg-hover, #f9fafb);
		border-color: var(--border-active, #3b82f6);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.shortcut-card:focus-visible {
		outline: 2px solid var(--focus-ring, #3b82f6);
		outline-offset: 2px;
	}

	.shortcut-icon {
		font-size: 2rem;
	}

	.shortcut-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		text-align: center;
	}

	.shortcut-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary, #111827);
	}

	.shortcut-count {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-accent, #2563eb);
	}

	.shortcut-count.loading {
		color: var(--text-muted, #6b7280);
		animation: pulse 1s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
