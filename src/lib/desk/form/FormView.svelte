<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { FormController } from './form-controller';
	import type { FormViewState } from './types';
	import type { DocField } from '../../meta/doctype/types';

	import FormToolbar from './FormToolbar.svelte';
	import FormSidebar from './FormSidebar.svelte';
	import FormTimeline from './FormTimeline.svelte';
	import FormTabs from './FormTabs.svelte';
	import FormSection from './FormSection.svelte';

	type Props = {
		doctype: string;
		name?: string; // If undefined, it's a new doc
	};

	let { doctype, name }: Props = $props();

	// Initialize Controller
	let controller = $derived(
		new FormController(doctype, {
			doctype,
			auto_save: true,
			validate_on_change: true
		})
	);

	let viewState: FormViewState = $state({
		doc: {},
		doctype: undefined,
		is_new: true,
		is_dirty: false,
		is_loading: true,
		is_saving: false,
		is_submitting: false,
		errors: {},
		field_states: {},
		permissions: { can_save: false, can_submit: false, can_cancel: false, can_delete: false },
		ui_state: { collapsed_sections: [], hidden_fields: [], disabled_fields: [], edit_mode: false }
	} as any); // Initial empty state until subscription kicks in

	let isLoading = $derived(viewState.is_loading);
	let docFields = $derived(viewState.doctype?.fields || []);

	// Layout State
	type ParsedSection = {
		field: DocField; // The Section Break field itself, or a dummy one
		columns: DocField[][];
	};

	type ParsedTab = {
		field: DocField; // The Tab Break field, or dummy
		sections: ParsedSection[];
	};

	// Derived layout structure
	let layout = $derived.by(() => {
		const tabs: ParsedTab[] = [];
		let currentTab: ParsedTab = {
			field: { fieldname: '_tab_default', label: 'Details', fieldtype: 'Tab Break' } as DocField,
			sections: []
		};

		let currentSection: ParsedSection = {
			field: { fieldname: '_section_default', label: '', fieldtype: 'Section Break' } as DocField,
			columns: [[]]
		};

		// Helper to push current section to tab
		const pushSection = () => {
			// Only push if it has columns with fields or if it's explicitly defined
			// Actually, ERPNext pushes even empty sections if defined.
			// We'll filter out completely empty default sections if needed, but for now push.
			currentTab.sections.push(currentSection);
		};

		const fields = viewState.doctype?.fields || [];

		for (const field of fields) {
			if (field.fieldtype === 'Tab Break') {
				pushSection(); // Finish current section
				tabs.push(currentTab); // Finish current tab

				// Start new tab
				currentTab = {
					field: field,
					sections: []
				};
				// Reset section
				currentSection = {
					field: {
						fieldname: `_section_${field.fieldname}`,
						label: '',
						fieldtype: 'Section Break'
					} as DocField,
					columns: [[]]
				};
			} else if (field.fieldtype === 'Section Break') {
				pushSection(); // Finish current section

				// Start new section
				currentSection = {
					field: field,
					columns: [[]]
				};
			} else if (field.fieldtype === 'Column Break') {
				// Start new column
				currentSection.columns.push([]);
			} else if (!field.hidden) {
				// Add field to current column
				currentSection.columns[currentSection.columns.length - 1].push(field);
			}
		}

		// Push remaining
		pushSection();
		tabs.push(currentTab);

		// If we only have the default tab and it has no label (or just 'Details'), we might want to treat it as "no tabs" mode visually,
		// but FormTabs handles single tab logic usually by not showing if only 1 tab?
		// Or we just return the structure.
		return tabs;
	});

	// Tab Management
	let activeTabFieldname = $state('');

	$effect(() => {
		if (layout.length > 0 && !activeTabFieldname) {
			activeTabFieldname = layout[0].field.fieldname;
		}
	});

	let currentTabContent = $derived(layout.find((t) => t.field.fieldname === activeTabFieldname) || layout[0]);

	$effect(() => {
		// Subscribe to state
		const unsubscribe = controller.subscribe((val) => {
			viewState = val;
		});

		// Load initial data
		controller.load(name).catch((e) => {
			console.error('Failed to load document', e);
		});

		return () => {
			unsubscribe();
		};
	});

	// Responsive Sidebar
	let sidebarOpen = $state(true);

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}
</script>

<div class="form-view-container">
	{#if isLoading && !viewState.doctype}
		<div class="loading-overlay">
			<div class="spinner">Loading...</div>
		</div>
	{/if}

	<FormToolbar {controller} />

	<div class="form-body">
		<div class="form-main-content">
			{#if layout.length > 1}
				<FormTabs
					tabs={layout.map((t) => ({ label: t.field.label || 'Details', fieldname: t.field.fieldname }))}
					activeTab={activeTabFieldname}
					onTabChange={(fname) => (activeTabFieldname = fname)}
				/>
			{/if}

			<div class="form-layout">
				{#if currentTabContent}
					{#each currentTabContent.sections as section (section.field.fieldname)}
						<FormSection section={section.field} columns={section.columns} {controller} />
					{/each}
				{/if}
			</div>

			<FormTimeline timeline={viewState.ui_state?.timeline || []} />
		</div>

		{#if sidebarOpen}
			<div class="form-sidebar-wrapper">
				<FormSidebar state={viewState} />
			</div>
		{/if}
	</div>
</div>

<style>
	.form-view-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: var(--bg-app, #f8fafc);
		overflow: hidden;
	}

	.form-body {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.form-main-content {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
		min-width: 0; /* Prevent flex overflow */
	}

	.form-sidebar-wrapper {
		width: 300px;
		border-left: 1px solid var(--border-color, #e2e8f0);
		background-color: var(--bg-surface, #ffffff);
		overflow-y: auto;
		padding: 1.5rem;
		flex-shrink: 0;
	}

	.loading-overlay {
		position: absolute;
		inset: 0;
		background: rgba(255, 255, 255, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
	}

	@media (max-width: 1024px) {
		.form-sidebar-wrapper {
			display: none; /* For now hide sidebar on mobile, or implement toggle */
			position: absolute;
			right: 0;
			top: 60px;
			bottom: 0;
			z-index: 40;
			box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
		}
	}
</style>
