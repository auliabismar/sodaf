<script lang="ts">
	/**
	 * SearchResults Component
	 * P3-019: Grouped search results display
	 */
	import type { AwesomebarResult } from '../sidebar/types';

	type Props = {
		results: AwesomebarResult[];
		selectedIndex?: number;
		onSelect?: (result: AwesomebarResult) => void;
	};

	let { results, selectedIndex = 0, onSelect }: Props = $props();

	// Group results by type
	// P3-019-T3: Results grouped by type
	let groupedResults = $derived(() => {
		const groups = new Map<string, AwesomebarResult[]>();
		const typeOrder = ['Action', 'DocType', 'Report', 'Page', 'Workspace'];

		for (const result of results) {
			const type = result.type || 'Other';
			if (!groups.has(type)) {
				groups.set(type, []);
			}
			groups.get(type)!.push(result);
		}

		// Sort groups by type order
		const sortedGroups: Array<{ type: string; items: AwesomebarResult[] }> = [];
		for (const type of typeOrder) {
			if (groups.has(type)) {
				sortedGroups.push({ type, items: groups.get(type)! });
				groups.delete(type);
			}
		}

		// Add remaining groups
		for (const [type, items] of groups) {
			sortedGroups.push({ type, items });
		}

		return sortedGroups;
	});

	/**
	 * Get flat index for a result in grouped display
	 */
	function getFlatIndex(groupIndex: number, itemIndex: number): number {
		let flatIndex = 0;
		const groups = groupedResults();
		for (let i = 0; i < groupIndex; i++) {
			flatIndex += groups[i].items.length;
		}
		return flatIndex + itemIndex;
	}

	/**
	 * Handle result click
	 * P3-019-T11: Click result navigates
	 */
	function handleClick(result: AwesomebarResult) {
		onSelect?.(result);
	}

	/**
	 * Get icon for result type
	 * P3-019-T4: Result item displays icon
	 */
	function getTypeIcon(type: string): string {
		switch (type) {
			case 'Action':
				return '⚡';
			case 'DocType':
				return '📄';
			case 'Report':
				return '📊';
			case 'Page':
				return '📑';
			case 'Workspace':
				return '🏠';
			default:
				return '📁';
		}
	}

	/**
	 * Get group display label
	 */
	function getGroupLabel(type: string): string {
		switch (type) {
			case 'Action':
				return 'Quick Actions';
			case 'DocType':
				return 'Documents';
			case 'Report':
				return 'Reports';
			case 'Page':
				return 'Pages';
			case 'Workspace':
				return 'Workspaces';
			default:
				return type;
		}
	}
</script>

<div class="search-results" data-testid="search-results">
	{#each groupedResults() as group, groupIndex (group.type)}
		<div class="result-group" data-testid="result-group-{group.type}">
			<div class="group-header">
				<span class="group-icon">{getTypeIcon(group.type)}</span>
				<span class="group-label">{getGroupLabel(group.type)}</span>
			</div>
			<ul class="result-list" role="listbox">
				{#each group.items as result, itemIndex (result.value)}
					{@const flatIndex = getFlatIndex(groupIndex, itemIndex)}
					<li
						class="result-item"
						class:selected={flatIndex === selectedIndex}
						role="option"
						aria-selected={flatIndex === selectedIndex}
						data-testid="search-result-{result.value}"
					>
						<button class="result-button" onclick={() => handleClick(result)} tabindex={-1}>
							<span class="result-icon" aria-hidden="true">
								{result.icon || getTypeIcon(result.type)}
							</span>
							<div class="result-content">
								<span class="result-title">{result.label}</span>
								{#if result.description}
									<span class="result-subtitle">{result.description}</span>
								{/if}
							</div>
							{#if result.shortcut}
								<kbd class="result-shortcut">{result.shortcut}</kbd>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</div>

<style>
	.search-results {
		padding: 0.5rem 0;
	}

	.result-group {
		margin-bottom: 0.5rem;
	}

	.group-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.group-icon {
		font-size: 0.875rem;
	}

	.result-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.result-item {
		margin: 0;
		padding: 0;
	}

	.result-item.selected .result-button {
		background: var(--bg-primary-subtle, #eff6ff);
		border-color: var(--primary, #3b82f6);
	}

	.result-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.625rem 1.25rem;
		border: none;
		border-left: 3px solid transparent;
		background: transparent;
		text-align: left;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.result-button:hover {
		background: var(--bg-hover, #f3f4f6);
	}

	.result-icon {
		flex-shrink: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-subtle, #f3f4f6);
		border-radius: 6px;
		font-size: 1rem;
	}

	.result-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.result-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary, #111827);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.result-subtitle {
		font-size: 0.75rem;
		color: var(--text-muted, #6b7280);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.result-shortcut {
		flex-shrink: 0;
		padding: 0.25rem 0.5rem;
		background: var(--bg-subtle, #f3f4f6);
		border: 1px solid var(--border-subtle, #e5e7eb);
		border-radius: 4px;
		font-size: 0.625rem;
		color: var(--text-muted, #6b7280);
	}
</style>
