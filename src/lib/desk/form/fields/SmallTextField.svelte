<script lang="ts">
	import { TextArea } from 'carbon-components-svelte';
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
		rows?: number;
		cols?: number;
		placeholder?: string;
		maxLength?: number | undefined;
		showCharCount?: boolean;
		resize?: 'none' | 'vertical' | 'horizontal' | 'both';
		onchange?: (value: string) => void;
		onblur?: (event: FocusEvent) => void;
		onfocus?: (event: FocusEvent) => void;
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
		rows = 2,
		cols = 30,
		placeholder = '',
		maxLength = undefined,
		showCharCount = false,
		resize = 'vertical',
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Computed properties
	let inputId = $derived(`input-${field.fieldname}`);
	let isInvalid = $derived(!!error);
	let isDisabled = $derived(disabled || readonly || field.read_only);
	let characterCount = $derived(value ? value.length : 0);
	let isMaxLengthExceeded = $derived(maxLength !== undefined && characterCount > maxLength);
	// remainingChars was unused in template but good to have
	let remainingChars = $derived(maxLength !== undefined ? maxLength - characterCount : undefined);

	// Event handlers
	function handleChange(event: CustomEvent<string> | any) {
		const newValue = event.detail !== undefined ? event.detail : event.target.value;
		value = newValue;
		onchange?.(newValue);
	}

	function handleBlur(event: FocusEvent) {
		onblur?.(event);
	}

	function handleFocus(event: FocusEvent) {
		onfocus?.(event);
	}

	// Get textarea CSS classes based on resize property
	function getTextareaClasses(): string {
		switch (resize) {
			case 'none':
				return 'resize-none small-text';
			case 'horizontal':
				return 'resize-horizontal small-text';
			case 'both':
				return 'resize-both small-text';
			case 'vertical':
			default:
				return 'resize-vertical small-text';
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
	onblur={() => onblur?.(new FocusEvent('blur'))}
	onfocus={() => onfocus?.(new FocusEvent('focus'))}
>
	<div class="small-text-field-container" class:has-error={isInvalid || isMaxLengthExceeded}>
		<TextArea
			id={inputId}
			bind:value
			disabled={isDisabled}
			{readonly}
			required={required || field.required}
			{placeholder}
			{rows}
			{cols}
			maxlength={maxLength}
			invalid={isInvalid || isMaxLengthExceeded}
			invalidText={Array.isArray(error) ? error.join(', ') : error}
			class={getTextareaClasses()}
			onchange={handleChange}
			onblur={handleBlur}
			onfocus={handleFocus}
		/>

		{#if showCharCount && maxLength !== undefined}
			<div class="char-count small" class:exceeded={isMaxLengthExceeded}>
				{characterCount}/{maxLength}
				{#if isMaxLengthExceeded}
					<span class="exceeded-message"> (Limit exceeded)</span>
				{/if}
			</div>
		{:else if showCharCount}
			<div class="char-count small">
				{characterCount} chars
			</div>
		{/if}
	</div>
</BaseField>

<style>
	.small-text-field-container {
		width: 100%;
		position: relative;
		max-width: 500px; /* Smaller max width for small text fields */
	}

	.small-text-field-container.has-error :global(textarea) {
		border-color: var(--cds-support-error);
		box-shadow: inset 0 0 0 1px var(--cds-support-error);
	}

	/* Small text specific styling */
	:global(.small-text) {
		font-size: 0.875rem; /* Smaller font size */
		line-height: 1.25rem;
		min-height: 60px; /* Smaller minimum height */
		padding: 0.5rem 0.75rem; /* Slightly smaller padding */
	}

	/* Resize controls */
	:global(.resize-vertical.small-text) {
		resize: vertical;
		min-height: 60px;
		max-height: 200px; /* Limit maximum height */
	}

	:global(.resize-horizontal.small-text) {
		resize: horizontal;
	}

	:global(.resize-both.small-text) {
		resize: both;
		min-height: 60px;
		max-height: 200px;
	}

	:global(.resize-none.small-text) {
		resize: none;
		height: 60px;
	}

	/* Character count styling */
	.char-count {
		font-size: 0.75rem;
		color: var(--cds-text-secondary);
		text-align: right;
		margin-top: 0.25rem;
		padding: 0.125rem 0.25rem;
		border-radius: 0.125rem;
		transition: color 0.15s ease;
	}

	.char-count.small {
		font-size: 0.7rem;
		padding: 0.1rem 0.2rem;
	}

	.char-count.exceeded {
		color: var(--cds-support-error);
		background-color: rgba(var(--cds-support-error-rgb), 0.1);
		font-weight: 500;
	}

	.exceeded-message {
		font-weight: 600;
	}

	/* Responsive design */
	@media (max-width: 672px) {
		.small-text-field-container {
			width: 100%;
			max-width: 100%;
		}

		:global(.small-text) {
			width: 100% !important;
			min-width: 0 !important;
		}

		.char-count.small {
			font-size: 0.65rem;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.char-count {
			color: WindowText;
		}

		.char-count.exceeded {
			color: Highlight;
			background-color: HighlightText;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.char-count {
			transition: none;
		}
	}
</style>
