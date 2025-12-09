<script lang="ts">
	import { TextInput, Select, SelectItem, DatePicker, Button } from 'carbon-components-svelte';
	import { onDestroy } from 'svelte';
	import { Close } from 'carbon-icons-svelte';
	import type { ListController } from './list-controller';
	import type { ListViewState, FilterConfig } from './types';

	export let controller: ListController;
	export let filterConfig: FilterConfig[] = [];

	let state: ListViewState = controller.getState();
	let unsubscribe: () => void;

	// Local state for filter inputs to avoid debouncing issues if we were binding directly to store (though here we set on change)
	let filterValues: Record<string, any> = {};

	$: {
		if (unsubscribe) unsubscribe();
		unsubscribe = controller.subscribe((value) => {
			state = value;
		});
	}

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});

	function handleFilterChange(field: string, value: any) {
		if (value === '' || value === null || value === undefined) {
			controller.clearFilter(field);
		} else {
			// Logic to determine operator could be improved, currently simple assignment
			// The controller.setFilter handles the logic.
			// Ideally we should pass the operator too if it's complex.
			// For this MVP, we assume exact match or 'like' for strings handled by controller/backend or config.
			controller.setFilter(field, value);
		}
	}

	function getOptions(options?: string | string[]): { id: string; text: string }[] {
		if (!options) return [];
		if (typeof options === 'string') {
			// dynamic options not implemented yet in this snippet
			return [];
		}
		return options.map((opt) => ({ id: opt, text: opt }));
	}
</script>

<div class="list-filters">
	{#each filterConfig as filter (filter.fieldname)}
		<div class="filter-item">
			{#if filter.fieldtype === 'Select'}
				<Select
					labelText={filter.label}
					selected={state.filters[filter.fieldname] || ''}
					on:change={(e) => handleFilterChange(filter.fieldname, (e.target as HTMLSelectElement).value)}
				>
					<SelectItem value="" text="All" />
					{#each getOptions(filter.options) as option}
						<SelectItem value={option.id} text={option.text} />
					{/each}
				</Select>
			{:else if filter.fieldtype === 'Date'}
				<TextInput
					type="date"
					labelText={filter.label}
					value={state.filters[filter.fieldname] || ''}
					on:change={(e) => handleFilterChange(filter.fieldname, e.detail)}
				/>
			{:else}
				<TextInput
					labelText={filter.label}
					value={state.filters[filter.fieldname] || ''}
					on:input={(e) => {
						// Basic debounce could be added here
						handleFilterChange(filter.fieldname, (e.target as HTMLInputElement).value); // detail is value in svelte carbon? No, it's e.target.value usually or detail
						// Carbon TextInput on:input detail is null? Check docs.
						// Actually Carbon Svelte TextInput binds value, or use on:input with e.target.value equivalent
					}}
					on:change={(e) => handleFilterChange(filter.fieldname, e.detail)}
				/>
			{/if}

			{#if state.filters[filter.fieldname]}
				<Button
					kind="ghost"
					iconDescription="Clear filter"
					icon={Close}
					size="small"
					class="clear-filter-btn"
					on:click={() => controller.clearFilter(filter.fieldname)}
				/>
			{/if}
		</div>
	{/each}
</div>

<style>
	.list-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		padding: 1rem 0;
		align-items: flex-end;
	}
	.filter-item {
		display: flex;
		align-items: flex-end;
	}
	/* hack to align clear button */
	:global(.clear-filter-btn) {
		margin-left: -40px;
		margin-bottom: 2px;
	}
</style>
