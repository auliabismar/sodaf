<script lang="ts">
	/**
	 * WorkspaceChart Component
	 * P3-017: Chart placeholder component for workspace dashboard
	 */
	import type { WorkspaceChart } from './types';

	type Props = {
		chart: WorkspaceChart;
	};

	let { chart }: Props = $props();

	// Determine chart width class
	let widthClass = $derived(chart.width === 'Half' ? 'half-width' : 'full-width');
</script>

<div class="workspace-chart {widthClass}" data-testid="workspace-chart-{chart.chart_name}">
	<div class="chart-header">
		<h4 class="chart-title">{chart.label}</h4>
	</div>
	<div class="chart-content">
		<!-- Chart placeholder - actual chart implementation would go here -->
		<div class="chart-placeholder">
			<span class="chart-icon" aria-hidden="true">📈</span>
			<span class="chart-name">{chart.chart_name}</span>
		</div>
	</div>
</div>

<style>
	.workspace-chart {
		background: var(--bg-surface, #ffffff);
		border: 1px solid var(--border-color, #e5e7eb);
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.workspace-chart.full-width {
		grid-column: 1 / -1;
	}

	.workspace-chart.half-width {
		grid-column: span 1;
	}

	.chart-header {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--border-subtle, #e5e7eb);
		background: var(--bg-elevated, #f9fafb);
	}

	.chart-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary, #111827);
	}

	.chart-content {
		padding: 1.5rem;
		min-height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.chart-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-muted, #9ca3af);
	}

	.chart-icon {
		font-size: 3rem;
		opacity: 0.5;
	}

	.chart-name {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
</style>
