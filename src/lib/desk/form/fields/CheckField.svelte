<script lang="ts">
	import { Checkbox } from 'carbon-components-svelte';
	import BaseField from './BaseField.svelte';
	import type { DocField } from '../../../meta/doctype/types';

	interface Props {
		field: DocField;
		value?: boolean;
		error?: string | string[];
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		description?: string;
		hideLabel?: boolean;
		onchange?: (value: boolean) => void;
		onblur?: () => void;
		onfocus?: () => void;
	}

	let {
		field,
		value = false,
		error = '',
		disabled = false,
		readonly = false,
		required = false,
		description = '',
		hideLabel = false,
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Computed properties
	let inputId = $derived(`input-${field.fieldname}`);
	let isInvalid = $derived(!!error);
	let isChecked = $derived(value === true);
	let isDisabled = $derived(disabled || field.read_only === true);

	// Event handlers
	function handleChange(event: CustomEvent<boolean> | boolean) {
		const newValue = typeof event === 'boolean' ? event : event.detail;
		onchange?.(newValue);
	}

	function handleBlur(event: FocusEvent) {
		onblur?.();
	}

	function handleFocus(event: FocusEvent) {
		onfocus?.();
	}

	// Toggle checkbox value
	function toggleCheckbox() {
		if (isDisabled) return;

		const newValue = !isChecked;
		handleChange(newValue);
	}

	// Handle keyboard interaction
	function handleKeydown(event: KeyboardEvent) {
		if (isDisabled) return;

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleCheckbox();
		}
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
	<div
		class="checkbox-container"
		class:disabled={isDisabled}
		role="checkbox"
		aria-checked={isChecked}
		aria-disabled={isDisabled}
		aria-required={required || field.required}
		tabindex={isDisabled ? -1 : 0}
		onclick={toggleCheckbox}
		onkeydown={handleKeydown}
	>
		<Checkbox
			id={inputId}
			checked={isChecked}
			disabled={isDisabled}
			{readonly}
			onchange={(event) => {
				const customEvent = new CustomEvent('change', {
					detail: (event.target as HTMLInputElement).checked
				});
				handleChange(customEvent);
			}}
			onblur={handleBlur}
			onfocus={handleFocus}
		/>
		{#if !hideLabel}
			<label for={inputId} class="checkbox-label" class:disabled={isDisabled}>
				{field.label}
				{#if required || field.required}
					<span class="required-indicator" aria-hidden="true">*</span>
				{/if}
			</label>
		{/if}
	</div>
</BaseField>

<style>
	.checkbox-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		user-select: none;
		padding: 0.25rem;
		border-radius: 0.25rem;
		transition: background-color 0.15s ease;
	}

	.checkbox-container:hover:not(.disabled) {
		background-color: var(--cds-background-hover);
	}

	.checkbox-container:focus-within:not(.disabled) {
		outline: 2px solid var(--cds-focus);
		outline-offset: 2px;
	}

	.checkbox-container.disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.checkbox-label {
		font-weight: 500;
		color: var(--cds-text-primary, #161616);
		cursor: pointer;
		margin: 0;
	}

	.checkbox-label.disabled {
		color: var(--cds-text-disabled, #8d8d8d);
		cursor: not-allowed;
	}

	.required-indicator {
		color: var(--cds-support-error);
		margin-left: 0.25rem;
		font-weight: 700;
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.checkbox-container:focus-within:not(.disabled) {
			outline: 3px solid WindowText;
			outline-offset: 2px;
		}

		.checkbox-label {
			color: WindowText;
		}

		.checkbox-label.disabled {
			color: GrayText;
		}

		.required-indicator {
			color: Highlight;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.checkbox-container {
			transition: none;
		}
	}
</style>
