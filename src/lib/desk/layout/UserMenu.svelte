<script lang="ts">
	/**
	 * UserMenu Component
	 * P3-020: User dropdown menu with profile, settings, logout
	 */
	import type { User } from '$lib/auth/types';

	type Props = {
		user: User | null;
		onLogout?: () => void;
		onProfile?: () => void;
		onSettings?: () => void;
	};

	let { user, onLogout, onProfile, onSettings }: Props = $props();

	let isOpen = $state(false);

	function toggleMenu() {
		isOpen = !isOpen;
	}

	function closeMenu() {
		isOpen = false;
	}

	function handleLogout() {
		closeMenu();
		onLogout?.();
	}

	function handleProfile() {
		closeMenu();
		onProfile?.();
	}

	function handleSettings() {
		closeMenu();
		onSettings?.();
	}

	// Close on click outside
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			closeMenu();
		}
	}

	// Get initials from user name
	function getInitials(name: string): string {
		const parts = name.split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return name.slice(0, 2).toUpperCase();
	}
</script>

<div class="user-menu" data-testid="user-menu">
	<button
		class="user-trigger"
		onclick={toggleMenu}
		aria-expanded={isOpen}
		aria-haspopup="menu"
		data-testid="user-menu-trigger"
	>
		{#if user?.user_image}
			<img src={user.user_image} alt={user.full_name} class="user-avatar" />
		{:else}
			<span class="user-initials" data-testid="user-initials">
				{user ? getInitials(user.full_name || user.name) : '??'}
			</span>
		{/if}
		<span class="user-name" data-testid="user-name">
			{user?.full_name || user?.name || 'Guest'}
		</span>
		<span class="dropdown-arrow" aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
	</button>

	{#if isOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="menu-backdrop" onclick={handleBackdropClick}></div>
		<div class="menu-dropdown" role="menu" data-testid="user-menu-dropdown">
			<div class="menu-header">
				<span class="menu-user-email">{user?.email || ''}</span>
				<span class="menu-user-type">{user?.user_type || ''}</span>
			</div>
			<div class="menu-divider"></div>
			<button class="menu-item" role="menuitem" onclick={handleProfile} data-testid="user-menu-profile">
				<span class="menu-icon">👤</span>
				<span>Profile</span>
			</button>
			<button class="menu-item" role="menuitem" onclick={handleSettings} data-testid="user-menu-settings">
				<span class="menu-icon">⚙️</span>
				<span>Settings</span>
			</button>
			<div class="menu-divider"></div>
			<button
				class="menu-item menu-item-danger"
				role="menuitem"
				onclick={handleLogout}
				data-testid="user-menu-logout"
			>
				<span class="menu-icon">🚪</span>
				<span>Log out</span>
			</button>
		</div>
	{/if}
</div>

<style>
	.user-menu {
		position: relative;
	}

	.user-trigger {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		border: none;
		background: transparent;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.user-trigger:hover {
		background: var(--bg-hover, #f3f4f6);
	}

	.user-trigger:focus-visible {
		outline: 2px solid var(--focus-ring, #3b82f6);
		outline-offset: 2px;
	}

	.user-avatar {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		object-fit: cover;
	}

	.user-initials {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--primary, #3b82f6), var(--primary-dark, #2563eb));
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.user-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary, #111827);
	}

	.dropdown-arrow {
		font-size: 0.625rem;
		color: var(--text-muted, #6b7280);
	}

	.menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 99;
	}

	.menu-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		min-width: 220px;
		background: var(--bg-surface, #ffffff);
		border: 1px solid var(--border-subtle, #e5e7eb);
		border-radius: 0.5rem;
		box-shadow:
			0 10px 25px -5px rgba(0, 0, 0, 0.1),
			0 8px 10px -6px rgba(0, 0, 0, 0.1);
		z-index: 100;
		overflow: hidden;
	}

	.menu-header {
		padding: 0.75rem 1rem;
		background: var(--bg-subtle, #f9fafb);
	}

	.menu-user-email {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary, #111827);
	}

	.menu-user-type {
		display: block;
		font-size: 0.75rem;
		color: var(--text-muted, #6b7280);
		margin-top: 0.125rem;
	}

	.menu-divider {
		height: 1px;
		background: var(--border-subtle, #e5e7eb);
	}

	.menu-item {
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

	.menu-item:hover {
		background: var(--bg-hover, #f3f4f6);
	}

	.menu-item:focus-visible {
		outline: none;
		background: var(--bg-hover, #f3f4f6);
	}

	.menu-item-danger {
		color: var(--danger, #dc2626);
	}

	.menu-item-danger:hover {
		background: rgba(220, 38, 38, 0.1);
	}

	.menu-icon {
		font-size: 1rem;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.user-name {
			display: none;
		}
	}
</style>
