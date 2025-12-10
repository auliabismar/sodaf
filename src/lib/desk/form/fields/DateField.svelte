<script lang="ts">
	import { DatePicker, DatePickerInput } from 'carbon-components-svelte';
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
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Computed properties
	let inputId = $derived(`input-${field.fieldname}`);
	let isInvalid = $derived(!!error);
	let parsedValue = $derived(parseDateValue(value));
	let inputMinDate = $derived(minDate || (field.options ? field.options.split(',')[0] : undefined));
	let inputMaxDate = $derived(maxDate || (field.options ? field.options.split(',')[1] : undefined));

	// Event handlers
	function handleChange(event: any) {
		const newValue = event.detail || event.target?.value;
		const formatted = formatDateValue(newValue);
		onchange?.(formatted);
	}

	function handleBlur(event: FocusEvent) {
		onblur?.();
	}

	function handleFocus(event: FocusEvent) {
		onfocus?.();
	}

	// Parse date value for DatePicker component
	function parseDateValue(dateString: string | null): string {
		if (!dateString) return '';

		// If already in YYYY-MM-DD format, return as is
		if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
			return dateString;
		}

		// Try to parse other formats
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return '';

		return date.toISOString().split('T')[0];
	}

	// Format date value for storage
	function formatDateValue(dateString: string): string {
		if (!dateString) return '';

		// DatePicker returns YYYY-MM-DD format
		if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
			return dateString;
		}

		// Try to parse and format
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return '';

		return date.toISOString().split('T')[0];
	}

	// Validation
	function validateDate(dateString: string | null): boolean {
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
	<DatePicker
		id={inputId}
		value={parsedValue}
		{dateFormat}
		minDate={inputMinDate}
		maxDate={inputMaxDate || getTodayString()}
		short={true}
		light={false}
		onchange={(event) => {
			handleChange(event);
		}}
		onblur={handleBlur}
		onfocus={handleFocus}
	>
		<DatePickerInput
			id={inputId}
			labelText=""
			placeholder="YYYY-MM-DD"
			disabled={disabled || readonly}
			{readonly}
			invalid={isInvalid}
			invalidText={Array.isArray(error) ? error.join(', ') : error}
		/>
	</DatePicker>
</BaseField>
