<script lang="ts">
	import { TextInput, Button } from 'carbon-components-svelte';
	import { Checkmark, Close } from 'carbon-icons-svelte';
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
		showAlpha?: boolean;
		format?: 'hex' | 'rgb' | 'rgba' | 'hsl';
		onchange?: (value: string) => void;
		onblur?: (event: FocusEvent) => void;
		onfocus?: (event: FocusEvent) => void;
	}

	let {
		field,
		value = $bindable('#000000'),
		error = '',
		disabled = false,
		readonly = false,
		required = false,
		description = '',
		hideLabel = false,
		placeholder = '#000000',
		showAlpha = false,
		format = 'hex',
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Internal state
	let showColorPicker = $state(false);
	let pickerInput = $state<HTMLInputElement>();
	let isPickerOpening = $state(false);

	// Computed properties
	let inputId = $derived(`input-${field.fieldname}`);
	let inputPlaceholder = $derived(placeholder || field.label || '#000000');
	let isInvalid = $derived(!!error);
	let isDisabled = $derived(disabled || readonly || field.read_only);
	let displayColor = $derived(normalizeColor(value));
	let colorPreviewStyle = $derived(`background-color: ${displayColor};`);

	// Event handlers
	function handleChange(event: CustomEvent<string> | any) {
		const newValue = event.detail !== undefined ? event.detail : event;
		value = newValue;
		onchange?.(newValue);
	}

	function handleBlur(event: FocusEvent) {
		onblur?.(event);
	}

	function handleFocus(event: FocusEvent) {
		onfocus?.(event);
	}

	function handleColorInputChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newValue = target.value;

		if (isValidColor(newValue)) {
			value = normalizeColor(newValue);
			onchange?.(value);
		}
	}

	function handleColorPickerChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newValue = target.value;

		value = normalizeColor(newValue);
		onchange?.(value);
	}

	function toggleColorPicker() {
		if (isDisabled) return;

		if (showColorPicker) {
			closeColorPicker();
		} else {
			openColorPicker();
		}
	}

	function openColorPicker() {
		if (isDisabled || isPickerOpening) return;

		isPickerOpening = true;
		showColorPicker = true;

		// Focus the color picker input after it's rendered
		setTimeout(() => {
			if (pickerInput) {
				pickerInput.focus();
				pickerInput.click();
			}
			isPickerOpening = false;
		}, 0);
	}

	function closeColorPicker() {
		showColorPicker = false;
	}

	function handleColorPickerBlur() {
		// Delay closing to allow for color selection
		setTimeout(() => {
			if (!pickerInput?.matches(':focus')) {
				closeColorPicker();
			}
		}, 150);
	}

	// Color validation and conversion functions
	function isValidColor(color: string): boolean {
		if (!color || typeof color !== 'string') return false;

		// Create a temporary element to test color validity
		const temp = document.createElement('div');
		temp.style.color = color;
		document.body.appendChild(temp);
		const isValid = temp.style.color !== '';
		document.body.removeChild(temp);

		return isValid;
	}

	function normalizeColor(color: string): string {
		if (!isValidColor(color)) return '#000000';

		// Convert to the specified format
		switch (format) {
			case 'hex':
				return rgbToHex(color);
			case 'rgb':
				return toRgbString(color);
			case 'rgba':
				return toRgbaString(color);
			case 'hsl':
				return toHslString(color);
			default:
				return rgbToHex(color);
		}
	}

	function rgbToHex(color: string): string {
		// Create a temporary element to convert color
		const temp = document.createElement('div');
		temp.style.color = color;
		document.body.appendChild(temp);
		const rgbColor = window.getComputedStyle(temp).color;
		document.body.removeChild(temp);

		// Parse RGB values
		const rgbMatch = rgbColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		if (rgbMatch) {
			const r = parseInt(rgbMatch[1], 10);
			const g = parseInt(rgbMatch[2], 10);
			const b = parseInt(rgbMatch[3], 10);
			return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
		}

		// If it's already hex, return it
		if (color.startsWith('#')) {
			return color.toUpperCase();
		}

		return '#000000';
	}

	function toRgbString(color: string): string {
		// Create a temporary element to convert color
		const temp = document.createElement('div');
		temp.style.color = color;
		document.body.appendChild(temp);
		const rgbColor = window.getComputedStyle(temp).color;
		document.body.removeChild(temp);

		return rgbColor;
	}

	function toRgbaString(color: string): string {
		// Create a temporary element to convert color
		const temp = document.createElement('div');
		temp.style.color = color;
		document.body.appendChild(temp);
		const rgbColor = window.getComputedStyle(temp).color;
		document.body.removeChild(temp);

		// Check if it's already RGBA
		if (rgbColor.startsWith('rgba')) {
			return rgbColor;
		}

		// Convert RGB to RGBA with full opacity
		const rgbMatch = rgbColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		if (rgbMatch) {
			const r = rgbMatch[1];
			const g = rgbMatch[2];
			const b = rgbMatch[3];
			return `rgba(${r}, ${g}, ${b}, 1)`;
		}

		return 'rgba(0, 0, 0, 1)';
	}

	function toHslString(color: string): string {
		// Create a temporary element to convert color
		const temp = document.createElement('div');
		temp.style.color = color;
		document.body.appendChild(temp);
		const rgbColor = window.getComputedStyle(temp).color;
		document.body.removeChild(temp);

		// Parse RGB values
		const rgbMatch = rgbColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		if (rgbMatch) {
			const r = parseInt(rgbMatch[1], 10) / 255;
			const g = parseInt(rgbMatch[2], 10) / 255;
			const b = parseInt(rgbMatch[3], 10) / 255;

			const max = Math.max(r, g, b);
			const min = Math.min(r, g, b);
			let h = 0,
				s = 0,
				l = (max + min) / 2;

			if (max !== min) {
				const d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

				switch (max) {
					case r:
						h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
						break;
					case g:
						h = ((b - r) / d + 2) / 6;
						break;
					case b:
						h = ((r - g) / d + 4) / 6;
						break;
				}
			}

			return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
		}

		return 'hsl(0, 0%, 0%)';
	}

	function getContrastColor(hexColor: string): string {
		// Convert hex to RGB
		const r = parseInt(hexColor.slice(1, 3), 16);
		const g = parseInt(hexColor.slice(3, 5), 16);
		const b = parseInt(hexColor.slice(5, 7), 16);

		// Calculate luminance
		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

		// Return black or white based on luminance
		return luminance > 0.5 ? '#000000' : '#FFFFFF';
	}

	// Handle escape key to close color picker
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && showColorPicker) {
			closeColorPicker();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

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
	<div class="color-field-container">
		<div class="color-input-wrapper">
			<TextInput
				id={inputId}
				type="text"
				{value}
				disabled={isDisabled}
				{readonly}
				placeholder={inputPlaceholder}
				invalid={isInvalid}
				invalidText={Array.isArray(error) ? error.join(', ') : error}
				onchange={handleColorInputChange}
				onblur={handleBlur}
				onfocus={handleFocus}
			/>
			<div class="color-preview-wrapper">
				<div
					class="color-preview"
					style={colorPreviewStyle}
					title="Click to open color picker"
					role="button"
					tabindex={isDisabled ? -1 : 0}
					aria-label="Color picker"
					onclick={toggleColorPicker}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							toggleColorPicker();
						}
					}}
				>
					{#if isValidColor(value)}
						<div class="color-check" style="color: {getContrastColor(displayColor)}">
							<Checkmark size={16} />
						</div>
					{:else}
						<div class="color-error">
							<Close size={16} />
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#if showColorPicker}
			<div
				class="color-picker-overlay"
				onclick={closeColorPicker}
				role="button"
				tabindex="0"
				onkeydown={(e) => {
					if (e.key === 'Escape') closeColorPicker();
				}}
			>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="color-picker-container" onclick={(e) => e.stopPropagation()}>
					<div class="color-picker-header">
						<span class="color-picker-title">Choose a color</span>
						<Button
							kind="ghost"
							size="small"
							icon={Close}
							iconDescription="Close color picker"
							onclick={closeColorPicker}
						/>
					</div>
					<div class="color-picker-content">
						<div class="color-input-row">
							<label for="picker-input" class="color-picker-label">Color:</label>
							<input
								bind:this={pickerInput}
								id="picker-input"
								type="color"
								value={displayColor}
								disabled={isDisabled}
								onchange={handleColorPickerChange}
								onblur={handleColorPickerBlur}
								class="color-picker-input"
							/>
							<span class="color-value">{displayColor}</span>
						</div>

						{#if showAlpha}
							<div class="color-input-row">
								<label for="alpha-input" class="color-picker-label">Alpha:</label>
								<input
									id="alpha-input"
									type="range"
									min="0"
									max="1"
									step="0.1"
									defaultValue="1"
									disabled={isDisabled}
									class="color-alpha-input"
								/>
								<span class="alpha-value">100%</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</BaseField>

<style>
	.color-field-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		position: relative;
	}

	.color-input-wrapper {
		position: relative;
		display: flex;
		align-items: stretch;
		width: 100%;
	}

	.color-input-wrapper :global(.cds--text-input) {
		flex: 1;
		padding-right: 3.5rem;
	}

	.color-preview-wrapper {
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		z-index: 1;
	}

	.color-preview {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.25rem;
		border: 1px solid var(--cds-ui-03);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.color-preview:hover {
		transform: translateY(-50%) scale(1.05);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.color-preview:focus {
		outline: 2px solid var(--cds-focus);
		outline-offset: 2px;
	}

	.color-check,
	.color-error {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.color-error {
		color: var(--cds-support-error);
	}

	.color-picker-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.color-picker-container {
		background-color: var(--cds-layer-01);
		border-radius: 0.5rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		width: 300px;
		max-width: 90vw;
		overflow: hidden;
	}

	.color-picker-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-bottom: 1px solid var(--cds-ui-03);
	}

	.color-picker-title {
		font-weight: 600;
		color: var(--cds-text-primary);
	}

	.color-picker-content {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.color-input-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.color-picker-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--cds-text-secondary);
		min-width: 60px;
	}

	.color-picker-input {
		width: 60px;
		height: 40px;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
	}

	.color-alpha-input {
		flex: 1;
	}

	.color-value,
	.alpha-value {
		font-size: 0.875rem;
		color: var(--cds-text-primary);
		font-family: monospace;
		min-width: 80px;
		text-align: right;
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.color-preview {
			border: 2px solid WindowText;
		}

		.color-picker-container {
			border: 2px solid WindowText;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.color-preview {
			transition: none;
		}
	}
</style>
