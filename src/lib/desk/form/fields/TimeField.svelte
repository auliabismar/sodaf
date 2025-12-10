<script lang="ts">
	import { TimePicker, TimePickerSelect, SelectItem } from 'carbon-components-svelte';
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
		timeFormat?: string;
		onchange?: (value: string) => void;
		onblur?: () => void;
		onfocus?: () => void;
	}

	let {
		field,
		value = null,
		error = '',
		disabled = false,
		readonly = false,
		required = false,
		description = '',
		hideLabel = false,
		timeFormat = '24',
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Internal state
	let hours = $state('');
	let minutes = $state('');
	let period = $state('am');

	// Computed properties
	let inputId = $derived(`input-${field.fieldname}`);
	let isInvalid = $derived(!!error);
	let is12Hour = $derived(timeFormat === '12');

	// Initialize time values when the component value changes
	$effect(() => {
		if (value) {
			const timeParts = value.split(':');
			if (timeParts.length >= 2) {
				let hour = parseInt(timeParts[0], 10);
				const minute = timeParts[1];

				if (is12Hour) {
					period = hour >= 12 ? 'pm' : 'am';
					hour = hour % 12 || 12;
				}

				hours = hour.toString().padStart(2, '0');
				minutes = minute.substring(0, 2);
			}
		} else {
			hours = '';
			minutes = '';
			period = 'am';
		}
	});

	// Event handlers
	function handleTimeChange(event: any) {
		const newTimeValue = event.detail || event.target?.value;
		const formatted = formatTimeForStorage(newTimeValue);
		onchange?.(formatted);
	}

	function handleBlur(event: FocusEvent) {
		onblur?.();
	}

	function handleFocus(event: FocusEvent) {
		onfocus?.();
	}

	// Format time for storage based on the selected format
	function formatTimeForStorage(timeString: string): string {
		if (!timeString) return '';

		const timeParts = timeString.split(':');
		if (timeParts.length < 2) return '';

		let hour = parseInt(timeParts[0], 10);
		const minute = parseInt(timeParts[1], 10);

		if (isNaN(hour) || isNaN(minute)) return '';

		if (is12Hour) {
			// Convert 12-hour to 24-hour format
			if (period === 'pm' && hour !== 12) {
				hour += 12;
			} else if (period === 'am' && hour === 12) {
				hour = 0;
			}
		}

		return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
	}

	// Validation
	function validateTime(timeString: string | null): boolean {
		if (timeString === null || timeString === '') {
			return !required;
		}

		const timeParts = timeString.split(':');
		if (timeParts.length < 2) return false;

		const hour = parseInt(timeParts[0], 10);
		const minute = parseInt(timeParts[1], 10);

		if (isNaN(hour) || isNaN(minute)) return false;

		if (is12Hour) {
			// 12-hour format: 1-12 for hours, 0-59 for minutes
			if (hour < 1 || hour > 12) return false;
		} else {
			// 24-hour format: 0-23 for hours, 0-59 for minutes
			if (hour < 0 || hour > 23) return false;
		}

		if (minute < 0 || minute > 59) return false;

		return true;
	}

	// Get current time string for placeholder
	function getCurrentTimeString(): string {
		const now = new Date();
		let hour = now.getHours();
		const minute = now.getMinutes();

		if (is12Hour) {
			const currentPeriod = hour >= 12 ? 'pm' : 'am';
			const displayHour = hour % 12 || 12;
			return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${currentPeriod}`;
		}

		return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
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
	<div class="time-container">
		<TimePicker
			id={inputId}
			value={value || ''}
			placeholder="HH:MM"
			onchange={(event) => {
				handleTimeChange(event);
			}}
		>
			{#if is12Hour}
				<TimePickerSelect bind:value={period}>
					<SelectItem value="am" text="AM" />
					<SelectItem value="pm" text="PM" />
				</TimePickerSelect>
			{/if}
		</TimePicker>
	</div>
</BaseField>

<style>
	.time-container {
		width: 100%;
		display: flex;
		align-items: center;
	}

	/* Responsive design */
	@media (max-width: 672px) {
		.time-container {
			width: 100%;
		}
	}
</style>
