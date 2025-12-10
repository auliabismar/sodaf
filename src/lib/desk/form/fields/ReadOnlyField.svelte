<script lang="ts">
	import BaseField from './BaseField.svelte';
	import type { DocField } from '../../../meta/doctype/types';

	interface Props {
		field: DocField;
		value?: any;
		error?: string | string[];
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		description?: string;
		hideLabel?: boolean;
		format?: 'text' | 'html' | 'json' | 'date' | 'currency' | 'percent' | 'boolean' | 'link' | 'auto';
		onchange?: (value: any) => void;
		onblur?: (event: FocusEvent) => void;
		onfocus?: (event: FocusEvent) => void;
	}

	let {
		field,
		value = $bindable(undefined),
		error = '',
		disabled = false,
		readonly = false,
		required = false,
		description = '',
		hideLabel = false,
		format = 'auto',
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Computed properties
	let isDisabled = $derived(disabled || readonly || field.read_only);
	let displayFormat = $derived(format === 'auto' ? getAutoFormat() : format);
	let formattedValue = $derived(formatValue(value, displayFormat, field));

	// Helper functions
	function getAutoFormat(): 'text' | 'html' | 'json' | 'date' | 'currency' | 'percent' | 'boolean' | 'link' {
		switch (field.fieldtype) {
			case 'HTML':
				return 'html';
			case 'Code':
				return 'json';
			case 'Date':
			case 'Datetime':
				return 'date';
			case 'Currency':
				return 'currency';
			case 'Percent':
				return 'percent';
			case 'Check':
				return 'boolean';
			case 'Link':
			case 'Dynamic Link':
				return 'link';
			default:
				return 'text';
		}
	}

	function formatValue(val: any, fmt: string, fld: DocField): string {
		if (val === null || val === undefined || val === '') {
			return '';
		}

		switch (fmt) {
			case 'text':
				return formatTextValue(val, fld);
			case 'html':
				return formatHtmlValue(val);
			case 'json':
				return formatJsonValue(val);
			case 'date':
				return formatDateValue(val, fld);
			case 'currency':
				return formatCurrencyValue(val, fld);
			case 'percent':
				return formatPercentValue(val, fld);
			case 'boolean':
				return formatBooleanValue(val);
			case 'link':
				return formatLinkValue(val, fld);
			default:
				return String(val);
		}
	}

	function formatTextValue(val: any, fld: DocField): string {
		let text = String(val);

		// Handle line breaks for text fields
		if (fld.fieldtype === 'Long Text' || fld.fieldtype === 'Small Text') {
			text = text.replace(/\n/g, '<br>');
		}

		// Truncate long text if length is specified
		if (fld.length && text.length > fld.length) {
			text = text.substring(0, fld.length) + '...';
		}

		return text;
	}

	function formatHtmlValue(val: any): string {
		// For HTML fields, we assume the value is already HTML
		return String(val);
	}

	function formatJsonValue(val: any): string {
		try {
			if (typeof val === 'object') {
				return JSON.stringify(val, null, 2);
			}
			const parsed = JSON.parse(String(val));
			return JSON.stringify(parsed, null, 2);
		} catch (e) {
			return String(val);
		}
	}

	function formatDateValue(val: any, fld: DocField): string {
		try {
			const date = new Date(val);

			if (isNaN(date.getTime())) {
				return String(val);
			}

			// Format based on field type
			switch (fld.fieldtype) {
				case 'Date':
					return date.toLocaleDateString();
				case 'Datetime':
					return date.toLocaleString();
				case 'Time':
					return date.toLocaleTimeString();
				default:
					return date.toLocaleDateString();
			}
		} catch (e) {
			return String(val);
		}
	}

	function formatCurrencyValue(val: any, fld: DocField): string {
		const num = parseFloat(val);

		if (isNaN(num)) {
			return String(val);
		}

		const options: Intl.NumberFormatOptions = {
			style: 'currency',
			currency: fld.options || 'USD',
			minimumFractionDigits: fld.precision || 2,
			maximumFractionDigits: fld.precision || 2
		};

		return new Intl.NumberFormat('en-US', options).format(num);
	}

	function formatPercentValue(val: any, fld: DocField): string {
		const num = parseFloat(val);

		if (isNaN(num)) {
			return String(val);
		}

		const options: Intl.NumberFormatOptions = {
			style: 'percent',
			minimumFractionDigits: fld.precision || 0,
			maximumFractionDigits: fld.precision || 0
		};

		return new Intl.NumberFormat('en-US', options).format(num / 100);
	}

	function formatBooleanValue(val: any): string {
		if (typeof val === 'boolean') {
			return val ? 'Yes' : 'No';
		}

		const strVal = String(val).toLowerCase();
		return strVal === 'true' || strVal === '1' || strVal === 'yes' ? 'Yes' : 'No';
	}

	function formatLinkValue(val: any, fld: DocField): string {
		if (!val) {
			return '';
		}

		// For link fields, we might want to show the display value
		// For now, just return the value as text
		return String(val);
	}

	function handleFieldChange(event: CustomEvent | any) {
		const val = event.detail !== undefined ? event.detail : event;
		onchange?.(val);
	}

	function handleFieldBlur(event?: FocusEvent) {
		if (event) {
			onblur?.(event);
		} else {
			// Create a synthetic FocusEvent when no event is available
			const syntheticEvent = new FocusEvent('blur');
			onblur?.(syntheticEvent);
		}
	}

	function handleFieldFocus(event?: FocusEvent) {
		if (event) {
			onfocus?.(event);
		} else {
			// Create a synthetic FocusEvent when no event is available
			const syntheticEvent = new FocusEvent('focus');
			onfocus?.(syntheticEvent);
		}
	}

	// Copy to clipboard functionality
	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(String(value));
			// Could show a toast notification here
		} catch (err) {
			console.error('Failed to copy to clipboard:', err);
		}
	}
</script>

<BaseField
	{field}
	{value}
	{error}
	disabled={true}
	readonly={true}
	{required}
	{description}
	{hideLabel}
	onchange={(event) => handleFieldChange(event)}
	onblur={(event) => handleFieldBlur(event)}
	onfocus={(event) => handleFieldFocus(event)}
>
	<div class="readonly-field" class:empty={!formattedValue}>
		{#if displayFormat === 'html'}
			<div class="html-content">{@html formattedValue}</div>
		{:else if displayFormat === 'json'}
			<pre class="json-content">{formattedValue}</pre>
		{:else if displayFormat === 'link'}
			<div class="link-content">
				<button
					type="button"
					class="link-value"
					onclick={() => {
						copyToClipboard();
					}}
				>
					{formattedValue}
				</button>
			</div>
		{:else}
			<div
				class="text-content"
				class:multiline={field.fieldtype === 'Long Text' || field.fieldtype === 'Small Text'}
			>
				{formattedValue}
			</div>
		{/if}

		{#if formattedValue}
			<button
				class="copy-button"
				type="button"
				onclick={copyToClipboard}
				title="Copy to clipboard"
				aria-label="Copy to clipboard"
			>
				Copy
			</button>
		{/if}
	</div>
</BaseField>

<style>
	.readonly-field {
		position: relative;
		padding: 0.75rem;
		background-color: var(--cds-background-layer);
		border: 1px solid var(--cds-border-subtle);
		border-radius: 0.25rem;
		min-height: 2.5rem;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.readonly-field.empty {
		color: var(--cds-text-disabled);
		font-style: italic;
		align-items: center;
	}

	.readonly-field.empty::before {
		content: 'No value';
	}

	.text-content {
		flex: 1;
		word-break: break-word;
		line-height: 1.4;
	}

	.text-content.multiline {
		white-space: pre-wrap;
	}

	.html-content {
		flex: 1;
		word-break: break-word;
		line-height: 1.4;
	}

	.html-content :global(p) {
		margin: 0 0 0.5rem 0;
	}

	.html-content :global(p:last-child) {
		margin-bottom: 0;
	}

	.json-content {
		flex: 1;
		background-color: var(--cds-layer-01);
		padding: 0.5rem;
		border-radius: 0.125rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875rem;
		line-height: 1.4;
		overflow-x: auto;
		white-space: pre;
		margin: 0;
	}

	.link-content {
		flex: 1;
	}

	.link-value {
		color: var(--cds-link-01);
		text-decoration: none;
		word-break: break-word;
	}

	.link-value:hover {
		text-decoration: underline;
	}

	.copy-button {
		background: none;
		border: 1px solid var(--cds-border-subtle);
		border-radius: 0.125rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		color: var(--cds-text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
		height: fit-content;
	}

	.copy-button:hover {
		background-color: var(--cds-background-hover);
		border-color: var(--cds-border-interactive);
		color: var(--cds-text-primary);
	}

	.copy-button:active {
		background-color: var(--cds-background-active);
	}

	/* Responsive design */
	@media (max-width: 672px) {
		.readonly-field {
			flex-direction: column;
			align-items: stretch;
		}

		.copy-button {
			align-self: flex-end;
			margin-top: 0.5rem;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.readonly-field {
			border-color: WindowText;
		}

		.copy-button {
			border-color: WindowText;
		}

		.copy-button:hover {
			background-color: Highlight;
			color: HighlightText;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.copy-button {
			transition: none;
		}
	}
</style>
