<script lang="ts">
	import { NumberInput } from 'carbon-components-svelte';
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
		min?: number | undefined;
		max?: number | undefined;
		step?: number;
		onchange?: (value: number | null) => void;
		onblur?: () => void;
		onfocus?: () => void;
	}

	let {
		field,
		value = $bindable(null),
		error = '',
		disabled = false,
		readonly = false,
		required = false,
		description = '',
		hideLabel = false,
		min = undefined,
		max = undefined,
		step = 1,
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Internal state for the input
	let internalValue = $state<number | null>(value);

	// Sync internal value with prop
	$effect(() => {
		internalValue = value;
	});

	// Watch for internal value changes (from +/- buttons or typing)
	$effect(() => {
		if (internalValue !== value) {
			value = internalValue;
			onchange?.(internalValue);
		}
	});

	// Computed properties
	let inputId = $derived(`input-${field.fieldname}`);
	let inputMin = $derived(
		min !== undefined ? min : field.options ? parseInt(field.options.split(',')[0]) : undefined
	);
	let inputMax = $derived(
		max !== undefined ? max : field.options ? parseInt(field.options.split(',')[1]) : undefined
	);
	let inputStep = $derived(step);
	let isInvalid = $derived(!!error);

	// Event handlers
	function handleBlur(event: FocusEvent) {
		onblur?.();
	}

	function handleFocus(event: FocusEvent) {
		onfocus?.();
	}

	// Validation
	function validateInt(value: number | null): boolean {
		if (value === null || value === undefined) {
			return !required;
		}

		if (!Number.isInteger(value)) {
			return false;
		}

		if (inputMin !== undefined && value < inputMin) {
			return false;
		}

		if (inputMax !== undefined && value > inputMax) {
			return false;
		}

		return true;
	}

	// Format value for display
	function formatValue(value: number | null): string {
		return value !== null ? value.toString() : '';
	}

	// Parse input value
	function parseValue(input: string): number | null {
		if (input === '' || input === '-') {
			return null;
		}

		const parsed = parseInt(input, 10);
		return isNaN(parsed) ? null : parsed;
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
	<NumberInput
		id={inputId}
		bind:value={internalValue}
		disabled={disabled || readonly}
		{readonly}
		min={inputMin}
		max={inputMax}
		step={inputStep}
		invalid={isInvalid}
		invalidText={Array.isArray(error) ? error.join(', ') : error}
		onblur={handleBlur}
		onfocus={handleFocus}
		allowEmpty={true}
	/>
</BaseField>
