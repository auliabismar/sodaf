<script lang="ts">
	/**
	 * Workspace Page
	 * P3-020-T5: Shows workspace view
	 */
	import { page } from '$app/stores';
	import { Workspace } from '$lib/desk/workspace';
	import type { FilteredWorkspace } from '$lib/desk/workspace/types';

	let workspaceName = $derived($page.params.name);

	// Demo workspace data - in real app this would come from API
	let workspace = $derived<FilteredWorkspace>({
		name: workspaceName,
		label: workspaceName.charAt(0).toUpperCase() + workspaceName.slice(1),
		icon: '🏠',
		shortcuts: [
			{ label: 'Users', link_to: 'User', type: 'DocType', color: '#3b82f6', icon: '👥' },
			{ label: 'Roles', link_to: 'Role', type: 'DocType', color: '#10b981', icon: '🎭' },
			{ label: 'Reports', link_to: 'Report', type: 'DocType', color: '#f59e0b', icon: '📊' },
			{ label: 'Settings', link_to: 'System Settings', type: 'DocType', color: '#6366f1', icon: '⚙️' }
		],
		grouped_links: new Map([
			[
				'Masters',
				[
					{ label: 'User', link_to: 'User', type: 'DocType', icon: '👤' },
					{ label: 'Role', link_to: 'Role', type: 'DocType', icon: '🎭' },
					{ label: 'Permission', link_to: 'DocPerm', type: 'DocType', icon: '🔐' }
				]
			],
			[
				'Reports',
				[
					{ label: 'User Activity', link_to: 'User Activity', type: 'Report', icon: '📈' },
					{ label: 'System Health', link_to: 'System Health', type: 'Report', icon: '💚' }
				]
			]
		]),
		charts: []
	});

	let loading = $state(false);
</script>

<svelte:head>
	<title>{workspace.label} | Desk</title>
</svelte:head>

<div class="workspace-page" data-testid="workspace-page">
	<Workspace {workspace} {loading} />
</div>

<style>
	.workspace-page {
		min-height: 100%;
	}
</style>
