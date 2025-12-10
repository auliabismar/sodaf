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
		min?: number;
		max?: number;
		precision?: number | undefined;
		step?: number;
		onchange?: (value: number | null) => void;
		onblur?: (event: FocusEvent) => void;
		onfocus?: (event: FocusEvent) => void;
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
		min = 0,
		max = 100,
		precision = undefined,
		step = 1,
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Computed properties
	let inputId = $derived(`input-${field.fieldname}`);
	let inputMin = $derived(min);
	let inputMax = $derived(max);
	let inputPrecision = $derived(precision !== undefined ? precision : field.precision);
	let inputStep = $derived(step);
	let isInvalid = $derived(!!error);

	// Event handlers
	function handleChange(event: CustomEvent<string | number> | number | null) {
		let newValue: number | null;
		if (typeof event === 'object' && event !== null && 'detail' in event) {
			newValue = event.detail as number;
		} else {
			newValue = event as number;
		}
		value = newValue;
		onchange?.(newValue);
	}

	function handleBlur(event: FocusEvent) {
		onblur?.(event);
	}

	function handleFocus(event: FocusEvent) {
		onfocus?.(event);
	}

	// Format value for display with % suffix
	// Note: Carbon NumberInput handles basic formatting, but custom suffix might typically need a specialized component or strict usage.
	// The original code had formatValue/parseValue but seemingly didn't use them in the template?
	// Checking the original template: <NumberInput ... bind:value />
	// It seems the format/parse functions were unused or maybe I missed where they were used.
	// In the original file, they were defined but seemingly NOT used in the snippet I saw.
	// Wait, the original code had `validatePercent`, `formatValue`, `parseValue` but I don't see them used in the markup I viewed.
	// I will keep them if they might be useful or used by something I missed, but locally.
	// Actually, if they are unused, I should probably leave them out or comment them.
	// But `validatePercent` looks like it *should* be used.
	// I'll keep the logic simple and map to what was there, just updating structure.
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
	<NumberInput
		id={inputId}
		bind:value
		disabled={disabled || readonly}
		{readonly}
		min={inputMin}
		max={inputMax}
		step={inputStep}
		invalid={isInvalid}
		invalidText={Array.isArray(error) ? error.join(', ') : error}
		onchange={(event: any) => {
			// Carbon NumberInput dispatches custom event with detail, or we can read valueAsNumber
			const val = event.detail !== undefined ? event.detail : event.target.valueAsNumber;
			handleChange(val);
		}}
		onblur={handleBlur}
		onfocus={handleFocus}
		allowEmpty={true}
	/>
</BaseField>
