<script lang="ts">
	/**
	 * GlobalSearch Component
	 * P3-019: Awesomebar/global search modal with keyboard navigation
	 */
	import type { AwesomebarResult, AwesomebarState } from '../sidebar/types';
	import type { SidebarManager } from '../sidebar/sidebar-manager';
	import type { UserContext } from '../workspace/workspace-manager';
	import SearchResults from './SearchResults.svelte';
	import RecentSearches from './RecentSearches.svelte';

	type Props = {
		sidebarManager: SidebarManager;
		user: UserContext;
		isOpen?: boolean;
		onNavigate?: (route: string) => void;
		onClose?: () => void;
	};

	let { sidebarManager, user, isOpen = false, onNavigate, onClose }: Props = $props();

	// Awesomebar state
	let query = $state('');
	let results = $state<AwesomebarResult[]>([]);
	let selectedIndex = $state(0);
	let loading = $state(false);
	let recentSearches = $state<string[]>([]);

	// Debounce timer
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	const DEBOUNCE_MS = 300;

	// Input element ref
	let inputElement: HTMLInputElement;

	// Load recent searches from localStorage on mount
	$effect(() => {
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('globalSearch_recent');
			if (stored) {
				try {
					recentSearches = JSON.parse(stored);
				} catch {
					recentSearches = [];
				}
			}
		}
	});

	// Focus input when modal opens
	$effect(() => {
		if (isOpen && inputElement) {
			inputElement.focus();
		}
	});

	// Global keyboard shortcut (Ctrl+K)
	$effect(() => {
		if (typeof window === 'undefined') return;

		function handleGlobalKeyDown(e: KeyboardEvent) {
			if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
				e.preventDefault();
				if (!isOpen) {
					// Parent should handle opening
				}
			}
		}

		window.addEventListener('keydown', handleGlobalKeyDown);
		return () => window.removeEventListener('keydown', handleGlobalKeyDown);
	});

	/**
	 * Parse search command syntax
	 * P3-019-T15: "#list User" -> list command for User doctype
	 */
	function parseCommand(q: string): { command: string | null; arg: string } {
		const trimmed = q.trim();
		if (trimmed.startsWith('#')) {
			const parts = trimmed.slice(1).split(/\s+/);
			const command = parts[0]?.toLowerCase() || null;
			const arg = parts.slice(1).join(' ');
			return { command, arg };
		}
		return { command: null, arg: trimmed };
	}

	/**
	 * Perform search with debouncing
	 * P3-019-T2: Typing triggers debounced search
	 */
	function handleInput() {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		const trimmedQuery = query.trim();
		if (!trimmedQuery) {
			results = [];
			loading = false;
			return;
		}

		loading = true;
		debounceTimer = setTimeout(() => {
			performSearch(trimmedQuery);
		}, DEBOUNCE_MS);
	}

	/**
	 * Execute search
	 */
	function performSearch(searchQuery: string) {
		const { command, arg } = parseCommand(searchQuery);

		if (command === 'list' && arg) {
			// P3-019-T15: Search commands - filter to list views
			results = sidebarManager.awesomebar(arg, user).filter((r) => r.value.startsWith('list-'));
		} else if (command === 'new' && arg) {
			// Quick action command
			results = sidebarManager.awesomebar(arg, user).filter((r) => r.value.startsWith('new-'));
		} else {
			// Regular search
			results = sidebarManager.awesomebar(searchQuery, user);
		}

		selectedIndex = 0;
		loading = false;
	}

	/**
	 * Handle keyboard navigation
	 * P3-019-T5/T6/T7: Arrow keys, Enter, Escape
	 */
	function handleKeyDown(e: KeyboardEvent) {
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				if (results.length > 0) {
					selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
				}
				break;
			case 'ArrowUp':
				e.preventDefault();
				if (results.length > 0) {
					selectedIndex = Math.max(selectedIndex - 1, 0);
				}
				break;
			case 'Enter':
				e.preventDefault();
				if (results.length > 0 && results[selectedIndex]) {
					selectResult(results[selectedIndex]);
				}
				break;
			case 'Escape':
				e.preventDefault();
				handleClose();
				break;
		}
	}

	/**
	 * Select a search result
	 * P3-019-T6/T11: Navigate on Enter or click
	 */
	function selectResult(result: AwesomebarResult) {
		// Save to recent searches
		saveRecentSearch(query.trim());

		// Navigate
		onNavigate?.(result.route);
		handleClose();
	}

	/**
	 * Save search to recent history
	 */
	function saveRecentSearch(searchQuery: string) {
		if (!searchQuery) return;

		// Remove if already exists, add to front
		const filtered = recentSearches.filter((s) => s !== searchQuery);
		recentSearches = [searchQuery, ...filtered].slice(0, 10);

		if (typeof window !== 'undefined') {
			localStorage.setItem('globalSearch_recent', JSON.stringify(recentSearches));
		}
	}

	/**
	 * Handle recent search selection
	 * P3-019-T9: Recent searches shown and clickable
	 */
	function handleRecentSelect(searchQuery: string) {
		query = searchQuery;
		performSearch(searchQuery);
	}

	/**
	 * Clear recent searches
	 * P3-019-T10: Button to clear history
	 */
	function handleClearRecent() {
		recentSearches = [];
		if (typeof window !== 'undefined') {
			localStorage.removeItem('globalSearch_recent');
		}
	}

	/**
	 * Close the search modal
	 * P3-019-T7: Escape closes
	 */
	function handleClose() {
		query = '';
		results = [];
		selectedIndex = 0;
		loading = false;
		onClose?.();
	}

	/**
	 * Handle backdrop click
	 */
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}
</script>

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="global-search-backdrop" onclick={handleBackdropClick} data-testid="global-search-backdrop">
		<div
			class="global-search-modal"
			role="dialog"
			aria-modal="true"
			aria-label="Global search"
			data-testid="global-search"
		>
			<!-- Search Input -->
			<div class="search-input-wrapper">
				<span class="search-icon" aria-hidden="true">🔍</span>
				<input
					bind:this={inputElement}
					bind:value={query}
					oninput={handleInput}
					onkeydown={handleKeyDown}
					type="text"
					class="search-input"
					placeholder="Search or type a command..."
					aria-label="Search"
					data-testid="global-search-input"
				/>
				{#if loading}
					<span class="search-spinner" data-testid="search-loading" aria-label="Loading">⏳</span>
				{:else if query}
					<button
						class="search-clear"
						onclick={() => {
							query = '';
							results = [];
						}}
						aria-label="Clear search"
					>
						✕
					</button>
				{/if}
				<kbd class="search-shortcut">Esc</kbd>
			</div>

			<!-- Results or Recent Searches -->
			<div class="search-content">
				{#if query.trim()}
					{#if loading}
						<div class="search-loading-state" data-testid="search-loading-state">
							<span class="spinner"></span>
							<span>Searching...</span>
						</div>
					{:else if results.length === 0}
						<div class="search-no-results" data-testid="search-no-results">
							<span class="no-results-icon">🔎</span>
							<span>No results found for "{query}"</span>
						</div>
					{:else}
						<SearchResults {results} {selectedIndex} onSelect={selectResult} />
					{/if}
				{:else}
					<RecentSearches {recentSearches} onSelect={handleRecentSelect} onClear={handleClearRecent} />
				{/if}
			</div>

			<!-- Footer with hints -->
			<div class="search-footer">
				<span class="footer-hint"><kbd>↑↓</kbd> Navigate</span>
				<span class="footer-hint"><kbd>↵</kbd> Select</span>
				<span class="footer-hint"><kbd>Esc</kbd> Close</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.global-search-backdrop {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 10vh;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		z-index: 9999;
	}

	.global-search-modal {
		width: 100%;
		max-width: 640px;
		max-height: 70vh;
		background: var(--bg-surface, #ffffff);
		border-radius: 12px;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.search-input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--border-subtle, #e5e7eb);
	}

	.search-icon {
		font-size: 1.25rem;
		opacity: 0.5;
	}

	.search-input {
		flex: 1;
		border: none;
		outline: none;
		font-size: 1.125rem;
		background: transparent;
		color: var(--text-primary, #111827);
	}

	.search-input::placeholder {
		color: var(--text-muted, #9ca3af);
	}

	.search-spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.search-clear {
		padding: 0.25rem 0.5rem;
		border: none;
		background: var(--bg-subtle, #f3f4f6);
		border-radius: 4px;
		cursor: pointer;
		color: var(--text-muted, #6b7280);
	}

	.search-clear:hover {
		background: var(--bg-hover, #e5e7eb);
	}

	.search-shortcut {
		padding: 0.25rem 0.5rem;
		background: var(--bg-subtle, #f3f4f6);
		border: 1px solid var(--border-subtle, #e5e7eb);
		border-radius: 4px;
		font-size: 0.75rem;
		color: var(--text-muted, #6b7280);
	}

	.search-content {
		flex: 1;
		overflow-y: auto;
		min-height: 200px;
		max-height: 400px;
	}

	.search-loading-state,
	.search-no-results {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 3rem 1rem;
		color: var(--text-muted, #6b7280);
	}

	.no-results-icon {
		font-size: 2rem;
		opacity: 0.5;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 3px solid var(--border-subtle, #e5e7eb);
		border-top-color: var(--primary, #3b82f6);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.search-footer {
		display: flex;
		gap: 1rem;
		padding: 0.75rem 1.25rem;
		border-top: 1px solid var(--border-subtle, #e5e7eb);
		background: var(--bg-subtle, #f9fafb);
	}

	.footer-hint {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--text-muted, #6b7280);
	}

	.footer-hint kbd {
		padding: 0.125rem 0.375rem;
		background: var(--bg-surface, #ffffff);
		border: 1px solid var(--border-subtle, #e5e7eb);
		border-radius: 4px;
		font-size: 0.625rem;
	}
</style>
