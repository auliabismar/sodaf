<script lang="ts">
	/**
	 * Workspace Component
	 * P3-017: Main workspace view with shortcuts, links, and charts
	 */
	import type {
		FilteredWorkspace,
		WorkspaceShortcut,
		WorkspaceLink,
		WorkspaceChart as ChartType
	} from './types';
	import ShortcutCard from './ShortcutCard.svelte';
	import LinkGroup from './LinkGroup.svelte';
	import WorkspaceChart from './WorkspaceChart.svelte';

	type Props = {
		workspace: FilteredWorkspace | null;
		loading?: boolean;
		getCount?: (doctype: string, filters?: Record<string, unknown>) => Promise<number>;
	};

	let { workspace, loading = false, getCount }: Props = $props();

	// Get shortcuts array
	let shortcuts = $derived(workspace?.shortcuts || []);

	// Get grouped links as array of [groupName, links] pairs
	let groupedLinks = $derived(() => {
		if (!workspace?.grouped_links) return [];
		return Array.from(workspace.grouped_links.entries());
	});

	// Get charts
	let charts = $derived(workspace?.charts || []);

	// Check if workspace is empty
	let isEmpty = $derived(
		!loading &&
			(!workspace ||
				(shortcuts.length === 0 && (workspace.grouped_links?.size ?? 0) === 0 && charts.length === 0))
	);
</script>

<div class="workspace" data-testid="workspace">
	{#if loading}
		<div class="workspace-loading" data-testid="workspace-loading">
			<div class="shortcuts-skeleton">
				{#each Array(4) as _, i}
					<div class="skeleton-card" style="animation-delay: {i * 0.1}s"></div>
				{/each}
			</div>
			<div class="links-skeleton">
				{#each Array(3) as _, i}
					<div class="skeleton-group" style="animation-delay: {i * 0.15}s">
						<div class="skeleton-header"></div>
						<div class="skeleton-item"></div>
						<div class="skeleton-item"></div>
					</div>
				{/each}
			</div>
		</div>
	{:else if isEmpty}
		<div class="workspace-empty" data-testid="workspace-empty">
			<span class="empty-icon" aria-hidden="true">📭</span>
			<h3>No content available</h3>
			<p>This workspace has no shortcuts, links, or charts configured.</p>
		</div>
	{:else}
		<!-- Shortcuts Grid -->
		{#if shortcuts.length > 0}
			<section class="shortcuts-section" aria-labelledby="shortcuts-heading">
				<h2 id="shortcuts-heading" class="section-heading">Shortcuts</h2>
				<div class="shortcuts-grid">
					{#each shortcuts as shortcut (shortcut.link_to)}
						<ShortcutCard {shortcut} {getCount} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Links Section -->
		{#if (workspace?.grouped_links?.size ?? 0) > 0}
			<section class="links-section" aria-labelledby="links-heading">
				<h2 id="links-heading" class="section-heading">Links</h2>
				<div class="links-grid">
					{#each groupedLinks() as [groupName, links] (groupName)}
						<LinkGroup {groupName} {links} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Charts Section -->
		{#if charts.length > 0}
			<section class="charts-section" aria-labelledby="charts-heading">
				<h2 id="charts-heading" class="section-heading">Dashboard</h2>
				<div class="charts-grid">
					{#each charts as chart (chart.chart_name)}
						<WorkspaceChart {chart} />
					{/each}
				</div>
			</section>
		{/if}
	{/if}
</div>

<style>
	.workspace {
		padding: 1.5rem;
		min-height: 100%;
	}

	.section-heading {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #111827);
		margin: 0 0 1rem 0;
	}

	/* Shortcuts Section */
	.shortcuts-section {
		margin-bottom: 2rem;
	}

	.shortcuts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 1rem;
	}

	/* Links Section */
	.links-section {
		margin-bottom: 2rem;
	}

	.links-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	/* Charts Section */
	.charts-section {
		margin-bottom: 2rem;
	}

	.charts-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	/* Loading State */
	.workspace-loading {
		animation: fadeIn 0.2s ease;
	}

	.shortcuts-skeleton {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.skeleton-card {
		height: 120px;
		background: linear-gradient(
			90deg,
			var(--bg-skeleton, #e5e7eb) 25%,
			var(--bg-skeleton-highlight, #f3f4f6) 50%,
			var(--bg-skeleton, #e5e7eb) 75%
		);
		background-size: 200% 100%;
		border-radius: 0.5rem;
		animation: shimmer 1.5s infinite;
	}

	.links-skeleton {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.skeleton-group {
		padding: 1rem;
	}

	.skeleton-header {
		height: 1rem;
		width: 40%;
		background: var(--bg-skeleton, #e5e7eb);
		border-radius: 0.25rem;
		margin-bottom: 1rem;
	}

	.skeleton-item {
		height: 1.5rem;
		width: 80%;
		background: linear-gradient(
			90deg,
			var(--bg-skeleton, #e5e7eb) 25%,
			var(--bg-skeleton-highlight, #f3f4f6) 50%,
			var(--bg-skeleton, #e5e7eb) 75%
		);
		background-size: 200% 100%;
		border-radius: 0.25rem;
		margin-bottom: 0.5rem;
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

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Empty State */
	.workspace-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		text-align: center;
		color: var(--text-muted, #6b7280);
	}

	.workspace-empty .empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.workspace-empty h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-secondary, #4b5563);
		margin: 0 0 0.5rem 0;
	}

	.workspace-empty p {
		font-size: 0.875rem;
		margin: 0;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.shortcuts-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.links-grid {
			grid-template-columns: 1fr;
		}

		.charts-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 480px) {
		.workspace {
			padding: 1rem;
		}

		.shortcuts-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
