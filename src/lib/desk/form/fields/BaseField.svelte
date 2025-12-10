<script lang="ts">
	import { Tooltip, Button } from 'carbon-components-svelte';
	import { Information, Warning, ErrorFilled } from 'carbon-icons-svelte';
	import type { DocField } from '../../../meta/doctype/types';

	interface Props {
		field: DocField;
		value: any;
		error?: string | string[];
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		description?: string;
		hideLabel?: boolean;
		children?: any;
		onchange?: (value: any) => void;
		onblur?: (event?: FocusEvent) => void;
		onfocus?: (event?: FocusEvent) => void;
	}

	let {
		field,
		value,
		error = '',
		disabled = false,
		readonly = false,
		required = false,
		description = '',
		hideLabel = false,
		children,
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Internal state
	let showTooltip = $state(false);
	let tooltipId = $derived(`tooltip-${field.fieldname}`);
	let errorId = $derived(`error-${field.fieldname}`);
	let labelId = $derived(`label-${field.fieldname}`);

	// Computed properties
	let hasError = $derived(error && error !== '');
	let isRequired = $derived(required || field.required);
	let isDisabled = $derived(disabled || readonly || field.read_only);
	let isReadonly = $derived(readonly || field.read_only);
	let isHidden = $derived(field.hidden);

	// Helper functions
	function handleFieldChange(event: CustomEvent | any) {
		// Handle both CustomEvent (from components) and varying payloads
		const detail = event.detail !== undefined ? event.detail : event;
		onchange?.(detail);
	}

	function handleFieldBlur(event?: FocusEvent) {
		onblur?.(event);
	}

	function handleFieldFocus(event?: FocusEvent) {
		onfocus?.(event);
	}

	// Generate unique IDs for accessibility
	function generateId(prefix: string, fieldname: string): string {
		return `${prefix}-${fieldname.replace(/[^a-zA-Z0-9]/g, '-')}`;
	}
</script>

<div class="base-field" class:hidden={isHidden} class:has-error={hasError}>
	{#if !hideLabel}
		<div class="field-label-container">
			<label for={labelId} class="field-label" class:required={isRequired}>
				{field.label}
				{#if isRequired}
					<span class="required-indicator" aria-hidden="true">*</span>
				{/if}
			</label>

			{#if description}
				<div class="description-container">
					<Tooltip align="center" {tooltipId} open={showTooltip} direction="bottom">
						<Button
							kind="ghost"
							size="small"
							icon={Information}
							iconDescription="Field information"
							aria-label={`Information about ${field.label}`}
							on:mouseenter={() => (showTooltip = true)}
							on:mouseleave={() => (showTooltip = false)}
							on:focus={() => (showTooltip = true)}
							on:blur={() => (showTooltip = false)}
						/>
						<div>
							<p class="description-text">{description}</p>
						</div>
					</Tooltip>
				</div>
			{/if}
		</div>
	{/if}

	<div class="field-input-container" class:disabled={isDisabled}>
	<!-- Slot for the actual field input -->
	{@render children({
		value,
		disabled: isDisabled,
		readonly: isReadonly,
		required: isRequired,
		id: labelId,
		"aria-describedby": hasError ? errorId : undefined,
		onchange: handleFieldChange,
		onblur: handleFieldBlur,
		onfocus: handleFieldFocus
	})}
</div>

	{#if hasError}
		<div class="error-container" id={errorId} role="alert" aria-live="polite">
			<ErrorFilled class="error-icon" size={16} />
			<span class="error-message">
				{Array.isArray(error) ? error.join(', ') : error}
			</span>
		</div>
	{/if}
</div>

<style>
	.base-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		width: 100%;
	}

	.base-field.hidden {
		display: none;
	}

	.base-field.has-error .field-input-container :global(input),
	.base-field.has-error .field-input-container :global(textarea),
	.base-field.has-error .field-input-container :global(select) {
		border-color: var(--cds-support-error);
		box-shadow: inset 0 0 0 1px var(--cds-support-error);
	}

	.field-label-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.field-label {
		font-weight: 600;
		color: var(--cds-text-primary);
		margin: 0;
	}

	.field-label.required {
		font-weight: 700;
	}

	.required-indicator {
		color: var(--cds-support-error);
		margin-left: 0.25rem;
		font-weight: 700;
	}

	.description-container {
		display: flex;
		align-items: center;
	}

	.description-text {
		margin: 0;
		max-width: 300px;
		font-size: 0.875rem;
		line-height: 1.25rem;
		color: var(--cds-text-secondary);
	}

	.field-input-container {
		position: relative;
		width: 100%;
	}

	.field-input-container.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.error-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	/* .error-icon {
		color: var(--cds-support-error);
		flex-shrink: 0;
	} */

	.error-message {
		font-size: 0.875rem;
		color: var(--cds-support-error);
		font-weight: 500;
		line-height: 1.25rem;
	}

	/* Responsive design */
	@media (max-width: 672px) {
		.base-field {
			margin-bottom: 1rem;
		}

		.field-label-container {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.description-text {
			max-width: 250px;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.field-label {
			color: WindowText;
		}

		.required-indicator {
			color: Highlight;
		}

		.error-message {
			color: Highlight;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.base-field * {
			transition: none !important;
			animation: none !important;
		}
	}
</style>
