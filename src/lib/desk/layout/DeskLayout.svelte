<script lang="ts">
	/**
	 * DeskLayout Component
	 * P3-020: Main desk layout with sidebar, navbar, and content area
	 */
	import type { User } from '$lib/auth/types';
	import type { SidebarSection } from '$lib/desk/sidebar/types';
	import type { SidebarManager } from '$lib/desk/sidebar/sidebar-manager';
	import { Sidebar } from '$lib/desk/sidebar';
	import Navbar from './Navbar.svelte';
	import GlobalSearch from '$lib/desk/search/GlobalSearch.svelte';
	import type { Snippet } from 'svelte';

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
		sidebarSections: SidebarSection[];
		sidebarManager?: SidebarManager;
		activeWorkspace?: string;
		breadcrumbs?: BreadcrumbItem[];
		notificationCount?: number;
		quickCreateItems?: QuickCreateItem[];
		sidebarCollapsed?: boolean;
		children: Snippet;
		onNavigate?: (route: string) => void;
		onLogout?: () => void;
		onQuickCreate?: (doctype: string) => void;
	};

	let {
		user,
		sidebarSections = [],
		sidebarManager,
		activeWorkspace = '',
		breadcrumbs = [],
		notificationCount = 0,
		quickCreateItems = [],
		sidebarCollapsed = false,
		children,
		onNavigate,
		onLogout,
		onQuickCreate
	}: Props = $props();

	let collapsed = $state(sidebarCollapsed);
	let searchOpen = $state(false);
	let isDarkMode = $state(false);

	// Responsive: auto-collapse on mobile
	let isMobile = $state(false);

	$effect(() => {
		if (typeof window !== 'undefined') {
			const checkMobile = () => {
				isMobile = window.innerWidth < 768;
				if (isMobile && !collapsed) {
					collapsed = true;
				}
			};
			checkMobile();
			window.addEventListener('resize', checkMobile);
			return () => window.removeEventListener('resize', checkMobile);
		}
	});

	// Theme toggle
	$effect(() => {
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('theme');
			isDarkMode = stored === 'dark';
			updateTheme();
		}
	});

	function updateTheme() {
		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('dark', isDarkMode);
		}
	}

	function handleThemeToggle() {
		isDarkMode = !isDarkMode;
		if (typeof window !== 'undefined') {
			localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
		}
		updateTheme();
	}

	function handleCollapsedChange(newCollapsed: boolean) {
		collapsed = newCollapsed;
	}

	function handleSearchClick() {
		searchOpen = true;
	}

	function handleSearchClose() {
		searchOpen = false;
	}

	function handleSearchNavigate(route: string) {
		searchOpen = false;
		onNavigate?.(route);
	}

	function handleProfile() {
		onNavigate?.('/app/User/' + user?.name);
	}

	function handleSettings() {
		onNavigate?.('/app/settings');
	}

	function handleNotificationsClick() {
		onNavigate?.('/app/notifications');
	}
</script>

<div class="desk-layout" class:sidebar-collapsed={collapsed} data-testid="desk-layout">
	<!-- Sidebar -->
	<aside class="desk-sidebar" data-testid="desk-sidebar">
		<Sidebar
			sections={sidebarSections}
			{activeWorkspace}
			{collapsed}
			onCollapsedChange={handleCollapsedChange}
		/>
	</aside>

	<!-- Main Content Area -->
	<div class="desk-main">
		<!-- Navbar -->
		<header class="desk-navbar">
			<Navbar
				{user}
				{breadcrumbs}
				{notificationCount}
				{quickCreateItems}
				{isDarkMode}
				onSearchClick={handleSearchClick}
				onNotificationsClick={handleNotificationsClick}
				{onQuickCreate}
				onThemeToggle={handleThemeToggle}
				{onLogout}
				onProfile={handleProfile}
				onSettings={handleSettings}
			/>
		</header>

		<!-- Content -->
		<main class="desk-content" data-testid="desk-content">
			{@render children()}
		</main>
	</div>

	<!-- Global Search Modal -->
	{#if sidebarManager && user}
		<GlobalSearch
			{sidebarManager}
			{user}
			isOpen={searchOpen}
			onNavigate={handleSearchNavigate}
			onClose={handleSearchClose}
		/>
	{/if}
</div>

<style>
	.desk-layout {
		display: flex;
		height: 100vh;
		width: 100%;
		overflow: hidden;
		background: var(--bg-page, #f3f4f6);
	}

	.desk-sidebar {
		flex-shrink: 0;
		height: 100%;
		z-index: 50;
		transition: width 0.2s ease;
	}

	.desk-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-width: 0;
	}

	.desk-navbar {
		flex-shrink: 0;
		z-index: 40;
	}

	.desk-content {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.desk-sidebar {
			position: fixed;
			left: 0;
			top: 0;
			bottom: 0;
			z-index: 60;
		}

		.sidebar-collapsed .desk-sidebar {
			width: 0;
			overflow: hidden;
		}
	}

	/* Dark mode support */
	:global(.dark) .desk-layout {
		background: var(--bg-page-dark, #111827);
	}
</style>
