<script lang="ts">
	import { TextInput } from 'carbon-components-svelte';
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
		children?: any;
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
		children,
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Computed properties
	let inputId = $derived(`input-${field.fieldname}`);
	let maxLength = $derived(field.length || undefined);
	let inputPlaceholder = $derived(placeholder || field.label || '');

	// Event handlers
	function handleChange(event: CustomEvent<string | number | null> | any) {
		// Handle Carbon's CustomEvent or native Event
		const newValue = event.detail !== undefined ? event.detail : event.currentTarget.value;
		onchange?.(newValue as string);
	}

	function handleBlur(event: FocusEvent) {
		onblur?.();
	}

	function handleFocus(event: FocusEvent) {
		onfocus?.();
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
	{#snippet children()}
		<TextInput
			id={inputId}
			{value}
			disabled={disabled || readonly}
			{readonly}
			placeholder={inputPlaceholder}
			maxlength={maxLength}
			invalid={!!error}
			invalidText={Array.isArray(error) ? error.join(', ') : error}
			on:input={handleChange}
			on:blur={handleBlur}
			on:focus={handleFocus}
		/>
	{/snippet}
</BaseField>
