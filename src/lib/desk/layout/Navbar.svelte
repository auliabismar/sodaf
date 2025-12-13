<script lang="ts">
	/**
	 * Navbar Component
	 * P3-020: Top navigation bar with search, notifications, quick create, user menu
	 */
	import type { User } from '$lib/auth/types';
	import UserMenu from './UserMenu.svelte';

	type BreadcrumbItem = {
		label: string;
		href?: string;
	};

	type QuickCreateItem = {
		label: string;
		doctype: string;
		icon?: string;
	};

	type Props = {
		user: User | null;
		breadcrumbs?: BreadcrumbItem[];
		notificationCount?: number;
		quickCreateItems?: QuickCreateItem[];
		isDarkMode?: boolean;
		onSearchClick?: () => void;
		onNotificationsClick?: () => void;
		onQuickCreate?: (doctype: string) => void;
		onThemeToggle?: () => void;
		onLogout?: () => void;
		onProfile?: () => void;
		onSettings?: () => void;
	};

	let {
		user,
		breadcrumbs = [],
		notificationCount = 0,
		quickCreateItems = [],
		isDarkMode = false,
		onSearchClick,
		onNotificationsClick,
		onQuickCreate,
		onThemeToggle,
		onLogout,
		onProfile,
		onSettings
	}: Props = $props();

	let quickCreateOpen = $state(false);

	function toggleQuickCreate() {
		quickCreateOpen = !quickCreateOpen;
	}

	function handleQuickCreate(doctype: string) {
		quickCreateOpen = false;
		onQuickCreate?.(doctype);
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			quickCreateOpen = false;
		}
	}
</script>

<nav class="navbar" data-testid="navbar">
	<div class="navbar-left">
		<!-- Breadcrumbs -->
		<nav class="breadcrumbs" aria-label="Breadcrumb" data-testid="breadcrumbs">
			{#each breadcrumbs as item, i}
				{#if i > 0}
					<span class="breadcrumb-separator" aria-hidden="true">/</span>
				{/if}
				{#if item.href}
					<a href={item.href} class="breadcrumb-link">{item.label}</a>
				{:else}
					<span class="breadcrumb-current" aria-current="page">{item.label}</span>
				{/if}
			{/each}
		</nav>
	</div>

	<div class="navbar-right">
		<!-- Search Button -->
		<button
			class="navbar-btn"
			onclick={onSearchClick}
			aria-label="Search"
			title="Search (Ctrl+K)"
			data-testid="navbar-search"
		>
			<span class="btn-icon">🔍</span>
			<span class="btn-label">Search</span>
			<kbd class="search-kbd">Ctrl+K</kbd>
		</button>

		<!-- Quick Create -->
		<div class="quick-create-wrapper">
			<button
				class="navbar-btn navbar-btn-primary"
				onclick={toggleQuickCreate}
				aria-expanded={quickCreateOpen}
				aria-haspopup="menu"
				data-testid="navbar-quick-create"
			>
				<span class="btn-icon">+</span>
				<span class="btn-label">New</span>
			</button>

			{#if quickCreateOpen}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="dropdown-backdrop" onclick={handleBackdropClick}></div>
				<div class="quick-create-dropdown" role="menu" data-testid="quick-create-dropdown">
					{#if quickCreateItems.length > 0}
						{#each quickCreateItems as item}
							<button class="dropdown-item" role="menuitem" onclick={() => handleQuickCreate(item.doctype)}>
								<span class="dropdown-icon">{item.icon || '📄'}</span>
								<span>{item.label}</span>
							</button>
						{/each}
					{:else}
						<div class="dropdown-empty">No quick actions available</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Notifications -->
		<button
			class="navbar-btn navbar-btn-icon"
			onclick={onNotificationsClick}
			aria-label="Notifications"
			data-testid="navbar-notifications"
		>
			<span class="btn-icon">🔔</span>
			{#if notificationCount > 0}
				<span class="notification-badge" data-testid="notification-count">
					{notificationCount > 99 ? '99+' : notificationCount}
				</span>
			{/if}
		</button>

		<!-- Theme Toggle -->
		<button
			class="navbar-btn navbar-btn-icon"
			onclick={onThemeToggle}
			aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
			data-testid="navbar-theme-toggle"
		>
			<span class="btn-icon">{isDarkMode ? '☀️' : '🌙'}</span>
		</button>

		<!-- User Menu -->
		<UserMenu {user} {onLogout} {onProfile} {onSettings} />
	</div>
</nav>

<style>
	.navbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 56px;
		padding: 0 1rem;
		background: var(--bg-surface, #ffffff);
		border-bottom: 1px solid var(--border-subtle, #e5e7eb);
	}

	.navbar-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.navbar-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	/* Breadcrumbs */
	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.breadcrumb-separator {
		color: var(--text-muted, #9ca3af);
	}

	.breadcrumb-link {
		color: var(--text-secondary, #6b7280);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.breadcrumb-link:hover {
		color: var(--primary, #3b82f6);
	}

	.breadcrumb-current {
		color: var(--text-primary, #111827);
		font-weight: 500;
	}

	/* Navbar Buttons */
	.navbar-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border-subtle, #e5e7eb);
		background: var(--bg-surface, #ffffff);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: var(--text-primary, #111827);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.navbar-btn:hover {
		background: var(--bg-hover, #f3f4f6);
		border-color: var(--border-color, #d1d5db);
	}

	.navbar-btn:focus-visible {
		outline: 2px solid var(--focus-ring, #3b82f6);
		outline-offset: 2px;
	}

	.navbar-btn-primary {
		background: var(--primary, #3b82f6);
		border-color: var(--primary, #3b82f6);
		color: white;
	}

	.navbar-btn-primary:hover {
		background: var(--primary-dark, #2563eb);
		border-color: var(--primary-dark, #2563eb);
	}

	.navbar-btn-icon {
		position: relative;
		padding: 0.5rem;
	}

	.btn-icon {
		font-size: 1rem;
	}

	.btn-label {
		font-weight: 500;
	}

	.search-kbd {
		padding: 0.125rem 0.375rem;
		background: var(--bg-subtle, #f3f4f6);
		border: 1px solid var(--border-subtle, #e5e7eb);
		border-radius: 0.25rem;
		font-size: 0.625rem;
		color: var(--text-muted, #6b7280);
		font-family: inherit;
	}

	/* Notification Badge */
	.notification-badge {
		position: absolute;
		top: -2px;
		right: -2px;
		min-width: 18px;
		height: 18px;
		padding: 0 4px;
		background: var(--danger, #dc2626);
		color: white;
		font-size: 0.625rem;
		font-weight: 600;
		border-radius: 9px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Quick Create Dropdown */
	.quick-create-wrapper {
		position: relative;
	}

	.dropdown-backdrop {
		position: fixed;
		inset: 0;
		z-index: 99;
	}

	.quick-create-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		min-width: 200px;
		background: var(--bg-surface, #ffffff);
		border: 1px solid var(--border-subtle, #e5e7eb);
		border-radius: 0.5rem;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
		z-index: 100;
		overflow: hidden;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.625rem 1rem;
		border: none;
		background: transparent;
		font-size: 0.875rem;
		color: var(--text-primary, #111827);
		cursor: pointer;
		text-align: left;
		transition: background 0.15s ease;
	}

	.dropdown-item:hover {
		background: var(--bg-hover, #f3f4f6);
	}

	.dropdown-icon {
		font-size: 1rem;
	}

	.dropdown-empty {
		padding: 1rem;
		text-align: center;
		color: var(--text-muted, #6b7280);
		font-size: 0.875rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.btn-label,
		.search-kbd {
			display: none;
		}

		.navbar-btn {
			padding: 0.5rem;
		}

		.breadcrumbs {
			max-width: 200px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
</style>
