<script lang="ts">
	import { TextInput } from 'carbon-components-svelte';
	import BaseField from './BaseField.svelte';
	import type { DocField } from '../../../meta/doctype/types';

	interface Props {
		field: DocField;
		value?: number | null;
		error?: string | string[];
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		description?: string;
		hideLabel?: boolean;
		currency?: string;
		placeholder?: string;
		onchange?: (value: number | null) => void;
		onblur?: () => void;
		onfocus?: () => void;
	}

	let {
		field,
		value = null,
		error = '',
		disabled = false,
		readonly = false,
		required = false,
		description = '',
		hideLabel = false,
		currency = 'USD',
		placeholder = '',
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Computed properties
	let inputId = $derived(`input-${field.fieldname}`);
	let fieldCurrency = $derived(field.options || currency);
	let inputPlaceholder = $derived(placeholder || `0.00 ${fieldCurrency}`);
	let displayValue = $derived(formatCurrency(value));
	let isInvalid = $derived(!!error);

	// Event handlers
	function handleChange(event: CustomEvent<string>) {
		const newValue = parseCurrency(event.detail);
		// Note: we can't update value locally if it's a prop, unless we made it bindable state.
		// Parent is responsible for updating value.
		// But, displayValue is derived from 'value'.
		// If we want instant feedback while typing valid currency?
		// Actually TextInput binds value, so the user types, it updates local variable bound...
		// But displayValue IS derived from prop 'value'.
		// So if we type "12", handleChange fires, emits 12. Parent updates 'value' prop -> displayValue updates to "$12.00".
		// That might be jarring while typing.
		// However, the original code had `bind:value={displayValue}` on TextInput.
		// `displayValue` was `$: displayValue = formatCurrency(value);`
		// Wait, if `displayValue` is bound, user typing updates `displayValue`.
		// But `displayValue` is also reactively updated when `value` changes.
		// This is a common Svelte 4 pattern that can cause loops or cursor jumps.
		// In Svelte 5 with $derived, we can't bind to a derived value.
		// So we need a local state for the input value.

		onchange?.(newValue);
	}

	// We need local state for the text input to avoid fighting with the formatted value while typing
	// Use derived to create a reactive reference to the formatted value
	let formattedValue = $derived(formatCurrency(value || 0));
	let inputValue = $state<string>();

	// Initialize inputValue and update when formattedValue changes
	$effect(() => {
		inputValue = formattedValue;
	});

	function handleBlur(event: FocusEvent) {
		onblur?.();
	}

	function handleFocus(event: FocusEvent) {
		onfocus?.();
	}

	// Format currency value for display
	function formatCurrency(value: number | null): string {
		if (value === null || value === undefined) {
			return '';
		}

		// Format with currency symbol and proper decimal places
		const formatted = new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: fieldCurrency,
			minimumFractionDigits: 2,
			maximumFractionDigits: field.precision || 2
		}).format(value);

		return formatted;
	}

	// Parse currency input string to number
	function parseCurrency(input: string): number | null {
		if (!input || input.trim() === '') {
			return null;
		}

		// Remove currency symbols and formatting
		const cleanInput = input.replace(/[^\d.-]/g, '').trim();

		if (cleanInput === '' || cleanInput === '-' || cleanInput === '.') {
			return null;
		}

		const parsed = parseFloat(cleanInput);
		return isNaN(parsed) ? null : parsed;
	}

	// Validate currency value
	function validateCurrency(value: number | null): boolean {
		if (value === null || value === undefined) {
			return !required;
		}

		if (isNaN(value)) {
			return false;
		}

		if (value < 0) {
			return false;
		}

		return true;
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
	<TextInput
		id={inputId}
		bind:value={inputValue}
		disabled={disabled || readonly}
		{readonly}
		placeholder={inputPlaceholder}
		invalid={isInvalid}
		invalidText={Array.isArray(error) ? error.join(', ') : error}
		onchange={(event) => {
			const customEvent = new CustomEvent('change', {
				detail: event.currentTarget.value
			});
			handleChange(customEvent);
		}}
		onblur={handleBlur}
		onfocus={handleFocus}
	/>
</BaseField>
