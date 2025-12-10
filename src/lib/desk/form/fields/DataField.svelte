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
	function handleChange(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		const newValue = event.currentTarget.value;
		// value = newValue; // In runes, value prop is read-only unless we use bind:value or state.
		// However, typically form fields in this architecture seem to rely on parent updating the value via binding or event.
		// For now we just call callback. If parent binds `bind:value={val}`, then Svelte 5 handles it if we exported it as bindable $state.
		// But here we received it as prop.
		// Actually, standard pattern: just call onchange.
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
			disabled={disabled || readonly}
			{readonly}
			placeholder={inputPlaceholder}
			maxlength={maxLength}
			invalid={!!error}
			invalidText={Array.isArray(error) ? error.join(', ') : error}
			onchange={handleChange}
			onblur={handleBlur}
			onfocus={handleFocus}
		/>
	{/snippet}
</BaseField>
