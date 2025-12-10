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
		rows = 4,
		cols = 50,
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
				return 'resize-none';
			case 'horizontal':
				return 'resize-horizontal';
			case 'both':
				return 'resize-both';
			case 'vertical':
			default:
				return 'resize-vertical';
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
	<div class="text-field-container" class:has-error={isInvalid || isMaxLengthExceeded}>
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
			<div class="char-count" class:exceeded={isMaxLengthExceeded}>
				{characterCount}/{maxLength}
				{#if isMaxLengthExceeded}
					<span class="exceeded-message"> (Character limit exceeded)</span>
				{/if}
			</div>
		{:else if showCharCount}
			<div class="char-count">
				{characterCount} characters
			</div>
		{/if}
	</div>
</BaseField>

<style>
	.text-field-container {
		width: 100%;
		position: relative;
	}

	.text-field-container.has-error :global(textarea) {
		border-color: var(--cds-support-error);
		box-shadow: inset 0 0 0 1px var(--cds-support-error);
	}

	/* Resize controls */
	:global(.resize-vertical) {
		resize: vertical;
		min-height: 100px;
	}

	:global(.resize-horizontal) {
		resize: horizontal;
	}

	:global(.resize-both) {
		resize: both;
	}

	:global(.resize-none) {
		resize: none;
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
		.text-field-container {
			width: 100%;
		}

		:global(textarea) {
			width: 100% !important;
			min-width: 0 !important;
		}

		.char-count {
			font-size: 0.7rem;
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
