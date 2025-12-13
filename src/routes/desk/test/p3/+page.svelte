<script lang="ts">
	/**
	 * P3 Component Showcase
	 * Test page displaying all Phase 3 Desk components
	 */
	import { Sidebar } from '$lib/desk/sidebar';
	import { Workspace } from '$lib/desk/workspace';
	import { ListView } from '$lib/desk/list';
	import { FormView } from '$lib/desk/form';
	import { GlobalSearch } from '$lib/desk/search';
	import { DeskLayout, Navbar, UserMenu } from '$lib/desk/layout';
	import { SidebarManager } from '$lib/desk/sidebar/sidebar-manager';
	import type { SidebarSection } from '$lib/desk/sidebar/types';
	import type { FilteredWorkspace } from '$lib/desk/workspace/types';
	import type { FormMeta, FormDoc } from '$lib/desk/form/types';
	import type { User } from '$lib/auth/types';

	// Demo user
	const demoUser: User = {
		name: 'admin@example.com',
		email: 'admin@example.com',
		full_name: 'Admin User',
		enabled: true,
		user_type: 'System User'
	};

	// Demo sidebar sections
	const sidebarSections: SidebarSection[] = [
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
				{ name: 'system', label: 'System Settings', icon: '🔧', category: 'Administration', sequence: 1 }
			]
		}
	];

	// Demo workspace
	const demoWorkspace: FilteredWorkspace = {
		name: 'home',
		label: 'Home',
		icon: '🏠',
		shortcuts: [
			{ label: 'Users', link_to: 'User', type: 'DocType', color: '#3b82f6', icon: '👥' },
			{ label: 'Roles', link_to: 'Role', type: 'DocType', color: '#10b981', icon: '🎭' },
			{ label: 'Reports', link_to: 'Report', type: 'DocType', color: '#f59e0b', icon: '📊' }
		],
		grouped_links: new Map([
			[
				'Masters',
				[
					{ label: 'User', link_to: 'User', type: 'DocType', icon: '👤' },
					{ label: 'Role', link_to: 'Role', type: 'DocType', icon: '🎭' }
				]
			]
		]),
		charts: []
	};

	// Demo list columns and data
	const listColumns = [
		{ fieldname: 'name', label: 'ID', fieldtype: 'Link' as const, width: 150 },
		{ fieldname: 'title', label: 'Title', fieldtype: 'Data' as const, width: 200 },
		{ fieldname: 'status', label: 'Status', fieldtype: 'Select' as const, width: 120 }
	];

	const listData = [
		{ name: 'DOC-001', title: 'First Document', status: 'Open' },
		{ name: 'DOC-002', title: 'Second Document', status: 'Closed' },
		{ name: 'DOC-003', title: 'Third Document', status: 'Draft' }
	];

	// Demo form meta and doc
	const formMeta: FormMeta = {
		doctype: 'Demo',
		name: 'Demo',
		fields: [
			{ fieldname: 'title', label: 'Title', fieldtype: 'Data', reqd: 1 },
			{ fieldname: 'description', label: 'Description', fieldtype: 'Text Editor' },
			{ fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Draft\nOpen\nClosed' }
		],
		is_submittable: false,
		is_single: false,
		permissions: [{ permLevel: 0, read: 1, write: 1, create: 1, delete: 1 }]
	};

	const formDoc: FormDoc = {
		doctype: 'Demo',
		name: 'DEMO-001',
		title: 'Sample Document',
		description: 'This is a sample document.',
		status: 'Open',
		docstatus: 0
	};

	// Sidebar manager for search
	const sidebarManager = new SidebarManager();

	// State
	let sidebarCollapsed = $state(false);
	let globalSearchOpen = $state(false);
	let activeSection = $state('layout');
	let selectedRows = $state<string[]>([]);

	const sections = [
		{ id: 'layout', label: 'Layout Components' },
		{ id: 'sidebar', label: 'Sidebar' },
		{ id: 'workspace', label: 'Workspace' },
		{ id: 'list', label: 'List View' },
		{ id: 'form', label: 'Form View' },
		{ id: 'search', label: 'Global Search' }
	];
</script>

<svelte:head>
	<title>P3 Component Showcase</title>
</svelte:head>

<div class="showcase">
	<header class="showcase-header">
		<h1>🎨 Phase 3: Desk Components Showcase</h1>
		<p>Interactive demo of all P3 components</p>
	</header>

	<nav class="showcase-nav">
		{#each sections as section}
			<button
				class="nav-btn"
				class:active={activeSection === section.id}
				onclick={() => (activeSection = section.id)}
			>
				{section.label}
			</button>
		{/each}
	</nav>

	<main class="showcase-content">
		{#if activeSection === 'layout'}
			<section class="demo-section">
				<h2>Layout Components (P3-020)</h2>
				<p class="demo-desc">Navbar and UserMenu components for the desk interface.</p>

				<div class="demo-box">
					<h3>Navbar</h3>
					<Navbar
						user={demoUser}
						breadcrumbs={[{ label: 'Home', href: '/app' }, { label: 'Demo' }]}
						notificationCount={5}
						quickCreateItems={[{ label: 'User', doctype: 'User', icon: '👤' }]}
						onSearchClick={() => (globalSearchOpen = true)}
					/>
				</div>

				<div class="demo-box">
					<h3>User Menu</h3>
					<div class="user-menu-demo">
						<UserMenu user={demoUser} />
					</div>
				</div>
			</section>
		{:else if activeSection === 'sidebar'}
			<section class="demo-section">
				<h2>Sidebar Component (P3-017)</h2>
				<p class="demo-desc">Collapsible sidebar with navigation sections.</p>

				<div class="demo-box sidebar-demo">
					<Sidebar
						sections={sidebarSections}
						activeWorkspace="home"
						collapsed={sidebarCollapsed}
						onCollapsedChange={(c) => (sidebarCollapsed = c)}
					/>
				</div>
			</section>
		{:else if activeSection === 'workspace'}
			<section class="demo-section">
				<h2>Workspace Component (P3-017)</h2>
				<p class="demo-desc">Workspace view with shortcuts, links, and charts.</p>

				<div class="demo-box workspace-demo">
					<Workspace workspace={demoWorkspace} />
				</div>
			</section>
		{:else if activeSection === 'list'}
			<section class="demo-section">
				<h2>List View Component (P3-003)</h2>
				<p class="demo-desc">Data table with sorting, selection, and pagination.</p>

				<div class="demo-box">
					<ListView
						doctype="Demo"
						columns={listColumns}
						data={listData}
						totalCount={listData.length}
						bind:selectedRows
					/>
				</div>
			</section>
		{:else if activeSection === 'form'}
			<section class="demo-section">
				<h2>Form View Component (P3-008)</h2>
				<p class="demo-desc">Document form with fields, toolbar, and sections.</p>

				<div class="demo-box form-demo">
					<FormView meta={formMeta} doc={formDoc} />
				</div>
			</section>
		{:else if activeSection === 'search'}
			<section class="demo-section">
				<h2>Global Search Component (P3-019)</h2>
				<p class="demo-desc">Command palette with search and keyboard navigation.</p>

				<div class="demo-box">
					<button class="open-search-btn" onclick={() => (globalSearchOpen = true)}>
						🔍 Open Global Search (Ctrl+K)
					</button>
				</div>

				<GlobalSearch
					{sidebarManager}
					user={demoUser}
					isOpen={globalSearchOpen}
					onClose={() => (globalSearchOpen = false)}
				/>
			</section>
		{/if}
	</main>

	<footer class="showcase-footer">
		<div class="test-links">
			<strong>Route Tests:</strong>
			<a href="/app" target="_blank">/app (redirect)</a>
			<a href="/app/workspace/home" target="_blank">/app/workspace/home</a>
			<a href="/app/User" target="_blank">/app/User (list)</a>
			<a href="/app/User/admin" target="_blank">/app/User/admin (form)</a>
			<a href="/app/User/new" target="_blank">/app/User/new</a>
		</div>
	</footer>
</div>

<style>
	.showcase {
		min-height: 100vh;
		background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
		color: white;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	.showcase-header {
		text-align: center;
		padding: 3rem 1rem 2rem;
	}

	.showcase-header h1 {
		font-size: 2.5rem;
		margin: 0 0 0.5rem;
		background: linear-gradient(90deg, #c084fc, #818cf8, #60a5fa);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.showcase-header p {
		color: #a5b4fc;
		margin: 0;
		font-size: 1.125rem;
	}

	.showcase-nav {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.nav-btn {
		padding: 0.625rem 1.25rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		color: white;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.nav-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.nav-btn.active {
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		border-color: transparent;
	}

	.showcase-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.demo-section h2 {
		font-size: 1.5rem;
		margin: 0 0 0.5rem;
	}

	.demo-desc {
		color: #a5b4fc;
		margin: 0 0 1.5rem;
	}

	.demo-box {
		background: white;
		border-radius: 0.75rem;
		overflow: hidden;
		margin-bottom: 1.5rem;
	}

	.demo-box h3 {
		background: #f3f4f6;
		color: #374151;
		padding: 0.75rem 1rem;
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		border-bottom: 1px solid #e5e7eb;
	}

	.sidebar-demo {
		height: 400px;
		display: flex;
	}

	.workspace-demo {
		max-height: 500px;
		overflow-y: auto;
	}

	.form-demo {
		max-height: 600px;
		overflow-y: auto;
	}

	.user-menu-demo {
		padding: 1rem;
		display: flex;
		justify-content: flex-end;
	}

	.open-search-btn {
		display: block;
		width: 100%;
		padding: 1rem;
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		border: none;
		border-radius: 0.5rem;
		color: white;
		font-size: 1rem;
		cursor: pointer;
		transition: transform 0.15s ease;
	}

	.open-search-btn:hover {
		transform: scale(1.02);
	}

	.showcase-footer {
		background: rgba(0, 0, 0, 0.3);
		padding: 1.5rem;
		text-align: center;
	}

	.test-links {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		font-size: 0.875rem;
	}

	.test-links a {
		color: #93c5fd;
		text-decoration: none;
		padding: 0.375rem 0.75rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 0.375rem;
		transition: background 0.15s ease;
	}

	.test-links a:hover {
		background: rgba(255, 255, 255, 0.2);
	}
</style>
