<script lang="ts">
	/**
	 * App Layout
	 * P3-020: Main /app layout with DeskLayout component
	 */
	import { DeskLayout } from '$lib/desk/layout';
	import { SidebarManager } from '$lib/desk/sidebar/sidebar-manager';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { SidebarSection } from '$lib/desk/sidebar/types';

	let { data, children } = $props();

	// Initialize sidebar manager
	const sidebarManager = new SidebarManager();

	// Get sidebar sections - in real app this would come from API
	let sidebarSections = $state<SidebarSection[]>([
		{
			title: 'Modules',
			items: [
				{
					name: 'home',
					label: 'Home',
					icon: '🏠',
					category: 'Modules',
					sequence: 1,
					route: '/app/workspace/home'
				},
				{ name: 'users', label: 'Users', icon: '👥', category: 'Modules', sequence: 2, route: '/app/User' },
				{
					name: 'settings',
					label: 'Settings',
					icon: '⚙️',
					category: 'Modules',
					sequence: 3,
					route: '/app/settings'
				}
			]
		},
		{
			title: 'Administration',
			items: [
				{
					name: 'system',
					label: 'System Settings',
					icon: '🔧',
					category: 'Administration',
					sequence: 1,
					route: '/app/System Settings'
				}
			]
		}
	]);

	// Active workspace from URL
	let activeWorkspace = $derived($page.params.name || 'home');

	// Breadcrumbs from current route
	let breadcrumbs = $derived(() => {
		const path = $page.url.pathname;
		const parts = path.split('/').filter(Boolean);

		const crumbs = [{ label: 'Home', href: '/app' }];

		if (parts[1] === 'workspace' && parts[2]) {
			crumbs.push({ label: parts[2] });
		} else if (parts[1]) {
			crumbs.push({ label: parts[1], href: `/app/${parts[1]}` });
			if (parts[2]) {
				crumbs.push({ label: parts[2] === 'new' ? 'New' : parts[2] });
			}
		}

		return crumbs;
	});

	// Quick create items
	const quickCreateItems = [
		{ label: 'User', doctype: 'User', icon: '👤' },
		{ label: 'Role', doctype: 'Role', icon: '🎭' },
		{ label: 'DocType', doctype: 'DocType', icon: '📄' }
	];

	function handleNavigate(route: string) {
		goto(route);
	}

	async function handleLogout() {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			goto('/login');
		} catch {
			// Still redirect on error
			goto('/login');
		}
	}

	function handleQuickCreate(doctype: string) {
		goto(`/app/${doctype}/new`);
	}
</script>

<DeskLayout
	user={data.user}
	{sidebarSections}
	{sidebarManager}
	{activeWorkspace}
	breadcrumbs={breadcrumbs()}
	notificationCount={3}
	{quickCreateItems}
	onNavigate={handleNavigate}
	onLogout={handleLogout}
	onQuickCreate={handleQuickCreate}
>
	{@render children()}
</DeskLayout>
