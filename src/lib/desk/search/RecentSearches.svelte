<script lang="ts">
	/**
	 * RecentSearches Component
	 * P3-019: Recent search history display
	 */

	type Props = {
		recentSearches: string[];
		onSelect?: (query: string) => void;
		onClear?: () => void;
	};

	let { recentSearches, onSelect, onClear }: Props = $props();

	/**
	 * Handle recent search click
	 * P3-019-T9: Recent searches shown
	 */
	function handleClick(query: string) {
		onSelect?.(query);
	}

	/**
	 * Handle clear all
	 * P3-019-T10: Clear recent button
	 */
	function handleClear() {
		onClear?.();
	}
</script>

<div class="recent-searches" data-testid="recent-searches">
	{#if recentSearches.length > 0}
		<div class="recent-header">
			<span class="recent-title">Recent Searches</span>
			<button class="clear-button" onclick={handleClear} data-testid="clear-recent-button">
				Clear all
			</button>
		</div>
		<ul class="recent-list" role="list">
			{#each recentSearches as query (query)}
				<li>
					<button class="recent-item" onclick={() => handleClick(query)} data-testid="recent-search-{query}">
						<span class="recent-icon" aria-hidden="true">🕒</span>
						<span class="recent-query">{query}</span>
					</button>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="recent-empty" data-testid="recent-empty">
			<span class="empty-icon">🔍</span>
			<span class="empty-text">Type to search</span>
			<div class="empty-hints">
				<span class="hint">Search for documents, reports, and pages</span>
				<span class="hint">Try <kbd>#list User</kbd> for quick list access</span>
				<span class="hint">Try <kbd>#new Invoice</kbd> to create new documents</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.recent-searches {
		padding: 0.5rem 0;
	}

	.recent-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1.25rem;
	}

	.recent-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.clear-button {
		padding: 0.25rem 0.5rem;
		border: none;
		background: transparent;
		color: var(--text-muted, #6b7280);
		font-size: 0.75rem;
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.15s ease;
	}

	.clear-button:hover {
		background: var(--bg-hover, #f3f4f6);
		color: var(--text-primary, #111827);
	}

	.recent-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.recent-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.625rem 1.25rem;
		border: none;
		background: transparent;
		text-align: left;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.recent-item:hover {
		background: var(--bg-hover, #f3f4f6);
	}

	.recent-icon {
		font-size: 1rem;
		opacity: 0.5;
	}

	.recent-query {
		font-size: 0.875rem;
		color: var(--text-primary, #111827);
	}

	.recent-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 3rem 1rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 2.5rem;
		opacity: 0.5;
	}

	.empty-text {
		font-size: 1rem;
		font-weight: 500;
		color: var(--text-primary, #111827);
	}

	.empty-hints {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		margin-top: 0.5rem;
	}

	.hint {
		font-size: 0.813rem;
		color: var(--text-muted, #6b7280);
	}

	.hint kbd {
		padding: 0.125rem 0.375rem;
		background: var(--bg-subtle, #f3f4f6);
		border: 1px solid var(--border-subtle, #e5e7eb);
		border-radius: 4px;
		font-size: 0.75rem;
		font-family: inherit;
	}
</style>
