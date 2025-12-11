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
		precision?: number | undefined;
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
		precision = undefined,
		step = 0.01,
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
		min !== undefined ? min : field.options ? parseFloat(field.options.split(',')[0]) : undefined
	);
	let inputMax = $derived(
		max !== undefined ? max : field.options ? parseFloat(field.options.split(',')[1]) : undefined
	);
	let inputPrecision = $derived(precision !== undefined ? precision : field.precision);
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
	function validateFloat(value: number | null): boolean {
		if (value === null || value === undefined) {
			return !required;
		}

		if (isNaN(value)) {
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
		if (value === null) return '';

		if (inputPrecision !== undefined) {
			return value.toFixed(inputPrecision);
		}

		return value.toString();
	}

	// Parse input value
	function parseValue(input: string): number | null {
		if (input === '' || input === '-' || input === '.') {
			return null;
		}

		const parsed = parseFloat(input);
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
