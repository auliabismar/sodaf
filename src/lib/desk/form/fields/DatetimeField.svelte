<script lang="ts">
	import {
		DatePicker,
		DatePickerInput,
		TimePicker,
		TimePickerSelect,
		SelectItem
	} from 'carbon-components-svelte';
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
		minDate?: string | undefined;
		maxDate?: string | undefined;
		dateFormat?: string;
		timeFormat?: string;
		onchange?: (value: string | null) => void;
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
		minDate = undefined,
		maxDate = undefined,
		dateFormat = 'Y-m-d',
		timeFormat = '24',
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Internal state
	let dateValue = $state('');
	let timeValue = $state('');

	// Computed properties
	let inputId = $derived(`input-${field.fieldname}`);
	let isInvalid = $derived(!!error);
	let inputMinDate = $derived(minDate || (field.options ? field.options.split(',')[0] : undefined));
	let inputMaxDate = $derived(maxDate || (field.options ? field.options.split(',')[1] : undefined));

	// Initialize date and time values when the component value changes
	$effect(() => {
		if (value) {
			const dateTime = new Date(value);
			if (!isNaN(dateTime.getTime())) {
				dateValue = dateTime.toISOString().split('T')[0];
				timeValue = dateTime.toTimeString().slice(0, 5); // HH:MM format
			}
		} else {
			dateValue = '';
			timeValue = '';
		}
	});

	// Event handlers
	function handleDateChange(event: any) {
		// Just update local state, then calculate combined, but need to be careful not to cycle
		// Actually updateCombinedValue depends on reading current state.
		// event.detail is reliable
		dateValue = event.detail || event.target?.value;
		updateCombinedValue();
	}

	function handleTimeChange(event: any) {
		timeValue = event.detail || event.target?.value;
		updateCombinedValue();
	}

	function handleBlur(event: FocusEvent) {
		onblur?.();
	}

	function handleFocus(event: FocusEvent) {
		onfocus?.();
	}

	// Update the combined datetime value
	function updateCombinedValue() {
		if (dateValue && timeValue) {
			// Combine date and time into ISO string
			const dateTimeString = `${dateValue}T${timeValue}:00`;
			const dateTime = new Date(dateTimeString);

			if (!isNaN(dateTime.getTime())) {
				const newValue = dateTime.toISOString();
				onchange?.(newValue);
			}
		} else if (dateValue) {
			// If only date is provided, use start of day
			const dateTimeString = `${dateValue}T00:00:00`;
			const dateTime = new Date(dateTimeString);

			if (!isNaN(dateTime.getTime())) {
				const newValue = dateTime.toISOString();
				onchange?.(newValue);
			}
		} else {
			onchange?.(null);
		}
	}

	// Validation
	function validateDateTime(dateString: string | null): boolean {
		if (dateString === null || dateString === '') {
			return !required;
		}

		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			return false;
		}

		if (inputMinDate) {
			const minDate = new Date(inputMinDate);
			if (date < minDate) return false;
		}

		if (inputMaxDate) {
			const maxDate = new Date(inputMaxDate);
			if (date > maxDate) return false;
		}

		return true;
	}

	// Get today's date in YYYY-MM-DD format for default max date
	function getTodayString(): string {
		return new Date().toISOString().split('T')[0];
	}

	// Format time for display
	function formatTimeForDisplay(timeString: string): string {
		if (!timeString) return '';

		const [hours, minutes] = timeString.split(':');
		if (timeFormat === '12') {
			const hour = parseInt(hours, 10);
			const ampm = hour >= 12 ? 'PM' : 'AM';
			const displayHour = hour % 12 || 12;
			return `${displayHour}:${minutes} ${ampm}`;
		}

		return timeString;
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
	onchange={updateCombinedValue}
	{onblur}
	{onfocus}
>
	<div class="datetime-container">
		<div class="date-section">
			<DatePicker
				id={`${inputId}-date`}
				bind:value={dateValue}
				{dateFormat}
				minDate={inputMinDate}
				maxDate={inputMaxDate || getTodayString()}
				short={true}
				light={false}
				onchange={(event) => {
					handleDateChange(event);
				}}
			>
				<DatePickerInput
					id={`${inputId}-date-input`}
					labelText=""
					placeholder="YYYY-MM-DD"
					disabled={disabled || readonly}
					{readonly}
				/>
			</DatePicker>
		</div>

		<div class="time-section">
			<TimePicker
				id={`${inputId}-time`}
				bind:value={timeValue}
				placeholder="HH:MM"
				onchange={(event) => {
					handleTimeChange(event);
				}}
			>
				<TimePickerSelect value="am">
					<SelectItem value="am" text="AM" />
					<SelectItem value="pm" text="PM" />
				</TimePickerSelect>
			</TimePicker>
		</div>
	</div>
</BaseField>

<style>
	.datetime-container {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
		width: 100%;
	}

	.date-section {
		flex: 2;
		min-width: 0;
	}

	.time-section {
		flex: 1;
		min-width: 0;
	}

	/* Responsive design */
	@media (max-width: 672px) {
		.datetime-container {
			flex-direction: column;
			gap: 1rem;
		}

		.date-section,
		.time-section {
			flex: 1;
			width: 100%;
		}
	}
</style>
