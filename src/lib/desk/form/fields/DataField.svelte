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
		value = $bindable(''),
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
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const newValue = target.value;
		value = newValue;
		onchange?.(newValue);
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
			{disabled}
			{readonly}
			placeholder={inputPlaceholder}
			maxlength={maxLength}
			invalid={!!error}
			invalidText={Array.isArray(error) ? error.join(', ') : error}
			oninput={handleInput}
			onblur={handleBlur}
			onfocus={handleFocus}
		/>
	{/snippet}
</BaseField>
