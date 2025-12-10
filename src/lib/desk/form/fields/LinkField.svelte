<script lang="ts">
	import { onMount } from 'svelte';
	import { ComboBox, Button, Tooltip } from 'carbon-components-svelte';
	import { Add, Launch } from 'carbon-icons-svelte';
	import BaseField from './BaseField.svelte';
	import type { DocField } from '../../../meta/doctype/types';

	interface Props {
		field: DocField;
		value?: string;
		error?: string | string[];
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		description?: string;
		hideLabel?: boolean;
		placeholder?: string;
		filters?: Record<string, any>;
		allowQuickCreate?: boolean;
		showOpenButton?: boolean;
		onchange?: (value: string) => void;
		onblur?: (event: FocusEvent) => void;
		onfocus?: (event: FocusEvent) => void;
		onquickCreate?: (detail: any) => void;
		onopenDocument?: (detail: any) => void;
	}

	let {
		field,
		value = $bindable(''),
		error = '',
		disabled = false,
		readonly = false,
		required = false,
		description = '',
		hideLabel = false,
		placeholder = '',
		filters = {},
		allowQuickCreate = true,
		showOpenButton = true,
		onchange,
		onblur,
		onfocus,
		onquickCreate, // mapped from 'quick-create'
		onopenDocument // mapped from 'open-document'
	}: Props = $props();

	// Internal state
	let options = $state<Array<{ id: string; value: string; text: string }>>([]);
	let searchValue = $state('');
	let isLoading = $state(false);
	let showQuickCreateTooltip = $state(false);
	let showOpenTooltip = $state(false);

	// Computed properties
	let inputId = $derived(`input-${field.fieldname}`);
	let isInvalid = $derived(!!error);
	let isDisabled = $derived(disabled || readonly || field.read_only);
	let quickCreateTooltipId = $derived(`quick-create-${field.fieldname}`);
	let openTooltipId = $derived(`open-${field.fieldname}`);
	let targetDoctype = $derived(field.options || '');

	// Update search value when field value changes
	$effect(() => {
		if (value && !searchValue) {
			searchValue = value;
		}
	});

	// Watch for filters change to refetch
	$effect(() => {
		if (filters) {
			fetchOptions(searchValue);
		}
	});

	// Event handlers
	function handleChange(newValue: string) {
		value = newValue;
		searchValue = newValue;
		onchange?.(newValue);
	}

	function handleBlur(event: FocusEvent) {
		onblur?.(event);
	}

	function handleFocus(event: FocusEvent) {
		onfocus?.(event);
	}

	// Handle search input change
	function handleSearchChange(event: CustomEvent<string> | any) {
		const val = event.detail !== undefined ? event.detail : (event.target as HTMLInputElement).value;
		searchValue = val;
		fetchOptions(searchValue);
	}

	// Handle selection from searchable dropdown
	function handleSearchSelect(event: CustomEvent<{ selectedItem: { value: string } }> | any) {
		const selectedItem = event.detail.selectedItem;
		const selectedValue = selectedItem?.value || '';
		handleChange(selectedValue);
	}

	// Fetch options from API
	async function fetchOptions(searchTerm: string = '') {
		if (!targetDoctype) return;

		isLoading = true;
		try {
			// Build query parameters
			const params = new URLSearchParams({
				doctype: targetDoctype,
				search: searchTerm,
				limit: '20'
			});

			// Add filters if provided
			if (Object.keys(filters).length > 0) {
				params.append('filters', JSON.stringify(filters));
			}

			// Add field filters from field definition
			if (field.filters) {
				params.append('field_filters', field.filters);
			}

			// Make API call to search for documents
			const response = await fetch(`/api/v1/search?${params.toString()}`);

			if (!response.ok) {
				throw new Error(`Failed to fetch options: ${response.statusText}`);
			}

			const data = await response.json();

			// Transform API response to ComboBox format
			options = data.map((doc: any) => ({
				id: doc.name,
				value: doc.name,
				text: `${doc.name}${doc.label ? `: ${doc.label}` : ''}`
			}));
		} catch (error) {
			console.error('Error fetching link options:', error);
			options = [];
		} finally {
			isLoading = false;
		}
	}

	// Handle quick create button click
	function handleQuickCreate() {
		if (!targetDoctype) return;

		// Dispatch event to open quick create dialog
		onquickCreate?.({
			doctype: targetDoctype,
			fieldname: field.fieldname,
			filters: filters
		});
	}

	// Handle open button click
	function handleOpen() {
		if (!value || !targetDoctype) return;

		// Dispatch event to open linked document
		onopenDocument?.({
			doctype: targetDoctype,
			name: value
		});
	}

	// Generate placeholder text
	function getPlaceholderText(): string {
		if (placeholder) return placeholder;
		if (required || field.required) return `Select ${field.label}`;
		return `Select ${field.label} (optional)`;
	}

	// Initialize component
	onMount(() => {
		// Fetch initial options if value is set
		if (value) {
			fetchOptions(value);
		} else {
			// Fetch initial set of options
			fetchOptions();
		}
	});
</script>

<BaseField
	{field}
	{value}
	{error}
	{disabled}
	{readonly}
	{required}
	{description}
	{hideLabel}
	{onchange}
	onblur={() => onblur?.(new FocusEvent('blur'))}
	onfocus={() => onfocus?.(new FocusEvent('focus'))}
>
	<div class="link-field-container">
		<ComboBox
			id={inputId}
			bind:value={searchValue}
			items={options}
			itemToString={(item) => (item ? item.text : '')}
			placeholder={getPlaceholderText()}
			disabled={isDisabled}
			invalid={isInvalid}
			invalidText={Array.isArray(error) ? error.join(', ') : error}
			on:input={handleSearchChange}
			on:select={handleSearchSelect}
			on:blur={handleBlur}
			on:focus={handleFocus}
		/>

		<div class="link-field-actions">
			{#if allowQuickCreate && !isDisabled && targetDoctype}
				<Tooltip
					align="center"
					tooltipId={quickCreateTooltipId}
					open={showQuickCreateTooltip}
					direction="bottom"
				>
					<Button
						kind="ghost"
						size="small"
						icon={Add}
						iconDescription={`Create new ${targetDoctype}`}
						aria-label={`Create new ${targetDoctype}`}
						on:mouseenter={() => (showQuickCreateTooltip = true)}
						on:mouseleave={() => (showQuickCreateTooltip = false)}
						on:focus={() => (showQuickCreateTooltip = true)}
						on:blur={() => (showQuickCreateTooltip = false)}
						onclick={handleQuickCreate}
					/>
					<div>
						<p>Create new {targetDoctype}</p>
					</div>
				</Tooltip>
			{/if}

			{#if showOpenButton && value && !isDisabled && targetDoctype}
				<Tooltip align="center" tooltipId={openTooltipId} open={showOpenTooltip} direction="bottom">
					<Button
						kind="ghost"
						size="small"
						icon={Launch}
						iconDescription={`Open ${value}`}
						aria-label={`Open ${value}`}
						on:mouseenter={() => (showOpenTooltip = true)}
						on:mouseleave={() => (showOpenTooltip = false)}
						on:focus={() => (showOpenTooltip = true)}
						on:blur={() => (showOpenTooltip = false)}
						onclick={handleOpen}
					/>
					<div>
						<p>Open {value}</p>
					</div>
				</Tooltip>
			{/if}
		</div>
	</div>
</BaseField>

<style>
	.link-field-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	.link-field-container :global(.bx--combo-box) {
		flex: 1;
	}

	.link-field-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.link-field-container :global(.bx--combo-box:focus-within) {
			outline: 3px solid WindowText;
			outline-offset: 2px;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.link-field-container :global(.bx--combo-box__menu) {
			transition: none;
		}
	}

	/* Responsive design */
	@media (max-width: 672px) {
		.link-field-container {
			flex-direction: column;
			align-items: stretch;
		}

		.link-field-actions {
			justify-content: flex-end;
			margin-top: 0.5rem;
		}
	}
</style>
