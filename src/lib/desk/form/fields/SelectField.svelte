<script lang="ts">
	import { onMount } from 'svelte';
	import { Select, SelectItem, ComboBox } from 'carbon-components-svelte';
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
		searchable?: boolean;
		onchange?: (value: string) => void;
		onblur?: () => void;
		onfocus?: () => void;
	}

	let {
		field,
		value = '',
		error = '',
		disabled = false,
		readonly = false,
		required = false,
		description = '',
		hideLabel = false,
		placeholder = '',
		searchable = false,
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Internal state
	let searchValue = $state('');

	// Computed properties
	let inputId = $derived(`input-${field.fieldname}`);
	let isInvalid = $derived(!!error);
	let isDisabled = $derived(disabled || readonly || field.read_only);

	let options = $derived(
		field.options ? field.options.split('\n').filter((option) => option.trim() !== '') : []
	);

	let filteredOptions = $derived.by(() => {
		if (searchable && searchValue) {
			return options.filter((option) => option.toLowerCase().includes(searchValue.toLowerCase()));
		} else {
			return options;
		}
	});

	// Event handlers
	function handleChange(event: CustomEvent<string>) {
		const newValue = event.detail;
		onchange?.(newValue);
	}

	function handleBlur(event: FocusEvent) {
		onblur?.();
	}

	function handleFocus(event: FocusEvent) {
		onfocus?.();
	}

	// Handle search input change
	function handleSearchChange(event: CustomEvent<string>) {
		searchValue = event.detail;
	}

	// Handle selection from searchable dropdown
	function handleSearchSelect(event: CustomEvent<{ selectedItem: { value: string } }>) {
		const selectedValue = event.detail.selectedItem.value;
		onchange?.(selectedValue);
		searchValue = selectedValue; // Update search value to show selection
	}

	// Generate placeholder text
	function getPlaceholderText(): string {
		if (placeholder) return placeholder;
		if (required || field.required) return `Select ${field.label}`;
		return `Select ${field.label} (optional)`;
	}

	// Validate selection
	function validateSelection(selectedValue: string): boolean {
		if (!required && !field.required) return true;
		return selectedValue !== '';
	}
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
	{onblur}
	{onfocus}
>
	{#if searchable}
		<ComboBox
			id={inputId}
			bind:value={searchValue}
			items={filteredOptions.map((option, index) => ({
				id: `${option}-${index}`,
				value: option,
				text: option
			}))}
			itemToString={(item) => (item ? item.text : '')}
			placeholder={getPlaceholderText()}
			disabled={isDisabled}
			invalid={isInvalid}
			invalidText={Array.isArray(error) ? error.join(', ') : error}
			on:input={(event) => {
				const customEvent = new CustomEvent('input', {
					detail: (event.target as HTMLInputElement).value
				});
				handleSearchChange(customEvent);
			}}
			on:select={(event) => {
				const selectedItem = event.detail.selectedItem;
				const customEvent = new CustomEvent('select', {
					detail: { selectedItem: { value: selectedItem.value } }
				});
				handleSearchSelect(customEvent);
			}}
			on:blur={handleBlur}
			on:focus={handleFocus}
		/>
	{:else}
		<Select
			id={inputId}
			{value}
			placeholder={getPlaceholderText()}
			disabled={isDisabled}
			invalid={isInvalid}
			invalidText={Array.isArray(error) ? error.join(', ') : error}
			onchange={(event) => {
				const customEvent = new CustomEvent('change', {
					detail: (event.target as HTMLSelectElement).value
				});
				handleChange(customEvent);
			}}
			onblur={handleBlur}
			onfocus={handleFocus}
		>
			{#each filteredOptions as option}
				<SelectItem value={option} text={option} />
			{/each}
		</Select>
	{/if}
</BaseField>

<style>
	/* Additional styling for searchable dropdown */
	:global(.bx--combo-box) {
		width: 100%;
	}

	:global(.bx--select) {
		width: 100%;
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		:global(.bx--combo-box:focus-within),
		:global(.bx--select:focus-within) {
			outline: 3px solid WindowText;
			outline-offset: 2px;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		:global(.bx--combo-box__menu),
		:global(.bx--select__menu) {
			transition: none;
		}
	}
</style>
