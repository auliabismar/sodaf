<script lang="ts">
	import { NumberInput } from 'carbon-components-svelte';
	import BaseField from './BaseField.svelte';
	import type { DocField } from '../../../meta/doctype/types';

	interface Props {
		field: DocField;
		value?: string | null;
		error?: string | string[];
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		description?: string;
		hideLabel?: boolean;
		showDays?: boolean;
		showHours?: boolean;
		showMinutes?: boolean;
		showSeconds?: boolean;
		onchange?: (value: string | null) => void;
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
		showDays = true,
		showHours = true,
		showMinutes = true,
		showSeconds = false,
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Internal state
	let days = $state(0);
	let hours = $state(0);
	let minutes = $state(0);
	let seconds = $state(0);

	// Computed properties
	let inputId = $derived(`input-${field.fieldname}`);
	let isInvalid = $derived(!!error);

	// Initialize duration values when the component value changes
	$effect(() => {
		if (value) {
			parseDuration(value);
		} else {
			// Only reset if not currently editing (handled by binding flow?)
			// Actually, if value becomes null from outside, we should reset.
			// If value becomes null from inside (user cleared inputs), we also need to be consistent.
			days = 0;
			hours = 0;
			minutes = 0;
			seconds = 0;
		}
	});

	// Event handlers
	function handleDaysChange(event: CustomEvent<string | number> | any) {
		const val = event.detail !== undefined ? event.detail : event.target.valueAsNumber;
		days = val || 0;
		updateCombinedValue();
	}

	function handleHoursChange(event: CustomEvent<string | number> | any) {
		const val = event.detail !== undefined ? event.detail : event.target.valueAsNumber;
		hours = val || 0;
		updateCombinedValue();
	}

	function handleMinutesChange(event: CustomEvent<string | number> | any) {
		const val = event.detail !== undefined ? event.detail : event.target.valueAsNumber;
		minutes = val || 0;
		updateCombinedValue();
	}

	function handleSecondsChange(event: CustomEvent<string | number> | any) {
		const val = event.detail !== undefined ? event.detail : event.target.valueAsNumber;
		seconds = val || 0;
		updateCombinedValue();
	}

	function handleBlur(event: FocusEvent) {
		onblur?.(event);
	}

	function handleFocus(event: FocusEvent) {
		onfocus?.(event);
	}

	// Parse duration string into components
	function parseDuration(durationString: string) {
		if (!durationString) {
			days = 0;
			hours = 0;
			minutes = 0;
			seconds = 0;
			return;
		}

		// Parse duration in format like "1d 2h 30m" or "90:30:00"
		const parts = durationString.split(' ');
		let totalSeconds = 0;

		let d = 0,
			h = 0,
			m = 0,
			s = 0;

		for (const part of parts) {
			if (part.endsWith('d')) {
				d = parseInt(part.replace('d', ''), 10) || 0;
				totalSeconds += d * 24 * 60 * 60;
			} else if (part.endsWith('h')) {
				h = parseInt(part.replace('h', ''), 10) || 0;
				totalSeconds += h * 60 * 60;
			} else if (part.endsWith('m')) {
				m = parseInt(part.replace('m', ''), 10) || 0;
				totalSeconds += m * 60;
			} else if (part.endsWith('s')) {
				s = parseInt(part.replace('s', ''), 10) || 0;
				totalSeconds += s;
			} else if (part.includes(':')) {
				// Format like HH:MM:SS or MM:SS
				const timeParts = part.split(':');
				if (timeParts.length === 3) {
					h = parseInt(timeParts[0], 10) || 0;
					m = parseInt(timeParts[1], 10) || 0;
					s = parseInt(timeParts[2], 10) || 0;
				} else if (timeParts.length === 2) {
					h = parseInt(timeParts[0], 10) || 0;
					m = parseInt(timeParts[1], 10) || 0;
					s = 0;
				}
			}
		}

		// Normalize values
		if (s >= 60) {
			m += Math.floor(s / 60);
			s = s % 60;
		}
		if (m >= 60) {
			h += Math.floor(m / 60);
			m = m % 60;
		}
		if (h >= 24) {
			d += Math.floor(h / 24);
			h = h % 24;
		}

		days = d;
		hours = h;
		minutes = m;
		seconds = s;
	}

	// Update the combined duration value
	function updateCombinedValue() {
		// Format as human-readable duration
		let durationString = '';
		if (showDays && days > 0) {
			durationString += `${days}d `;
		}
		if (showHours && hours > 0) {
			durationString += `${hours}h `;
		}
		if (showMinutes && minutes > 0) {
			durationString += `${minutes}m `;
		}
		if (showSeconds && seconds > 0) {
			durationString += `${seconds}s `;
		}

		// If all values are 0, return empty string or null?
		// Original code: if empty string, value = null.
		let newValue: string | null;
		if (!durationString.trim()) {
			newValue = null;
		} else {
			newValue = durationString.trim();
		}

		value = newValue;
		onchange?.(newValue);
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
	<div class="duration-container">
		{#if showDays}
			<div class="duration-input-group">
				<NumberInput
					id={`${inputId}-days`}
					value={days}
					disabled={disabled || readonly}
					{readonly}
					min={0}
					max={365}
					step={1}
					labelText="Days"
					hideLabel={true}
					onchange={handleDaysChange}
				/>
				<span class="duration-unit">d</span>
			</div>
		{/if}

		{#if showHours}
			<div class="duration-input-group">
				<NumberInput
					id={`${inputId}-hours`}
					value={hours}
					disabled={disabled || readonly}
					{readonly}
					min={0}
					max={23}
					step={1}
					labelText="Hours"
					hideLabel={true}
					onchange={handleHoursChange}
				/>
				<span class="duration-unit">h</span>
			</div>
		{/if}

		{#if showMinutes}
			<div class="duration-input-group">
				<NumberInput
					id={`${inputId}-minutes`}
					value={minutes}
					disabled={disabled || readonly}
					{readonly}
					min={0}
					max={59}
					step={1}
					labelText="Minutes"
					hideLabel={true}
					onchange={handleMinutesChange}
				/>
				<span class="duration-unit">m</span>
			</div>
		{/if}

		{#if showSeconds}
			<div class="duration-input-group">
				<NumberInput
					id={`${inputId}-seconds`}
					value={seconds}
					disabled={disabled || readonly}
					{readonly}
					min={0}
					max={59}
					step={1}
					labelText="Seconds"
					hideLabel={true}
					onchange={handleSecondsChange}
				/>
				<span class="duration-unit">s</span>
			</div>
		{/if}
	</div>
</BaseField>

<style>
	.duration-container {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.duration-input-group {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.duration-input-group :global(.bx--number-input) {
		width: 4rem;
	}

	.duration-unit {
		font-weight: 500;
		color: var(--cds-text-secondary);
		font-size: 0.875rem;
		min-width: 1rem;
		text-align: center;
	}

	/* Responsive design */
	@media (max-width: 672px) {
		.duration-container {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.duration-input-group {
			width: 100%;
			justify-content: space-between;
		}

		.duration-input-group :global(.bx--number-input) {
			flex: 1;
			width: auto;
		}
	}
</style>
