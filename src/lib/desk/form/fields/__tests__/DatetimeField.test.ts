import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import DatetimeField from '../DatetimeField.svelte';
import { createMockField } from './fixtures/mockFields';

describe('DatetimeField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = createMockField({ fieldtype: 'Datetime' });
	});

	// P3-007-T13: DatetimeField renders DatePicker and TimePicker
	it('renders DatePicker and TimePicker components', async () => {
		component = render(DatetimeField, {
			props: { field, value: '2023-12-25T14:30:00Z' }
		});

		const datePicker = screen.getByRole('textbox', { name: /date/i });
		const timePicker = screen.getByRole('textbox', { name: /time/i });
		expect(datePicker).toBeInTheDocument();
		expect(timePicker).toBeInTheDocument();
	});

	// P3-007-T33: Value binding works
	it('supports two-way value binding', async () => {
		let testValue = '2023-01-01T10:30:00Z';
		component = render(DatetimeField, {
			props: { field, value: testValue }
		});

		const datePicker = screen.getByRole('textbox', { name: /date/i });
		const timePicker = screen.getByRole('textbox', { name: /time/i });
		expect(datePicker).toHaveValue('2023-01-01');
		expect(timePicker).toHaveValue('10:30');
	});

	// P3-007-T34: Change event emitted
	it('emits change event on value change', async () => {
		const onchange = vi.fn();

		component = render(DatetimeField, {
			props: { field, value: '2023-01-01T10:30:00Z', onchange }
		});

		const datePicker = screen.getByRole('textbox', { name: /date/i });
		await fireEvent.input(datePicker, { target: { value: '2023-12-31' } });

		expect(onchange).toHaveBeenCalled();
		expect(onchange.mock.calls[0][0]).toMatch(/2023-12-31T/);
	});

	// Test disabled state
	it('disables inputs when disabled prop is true', async () => {
		component = render(DatetimeField, {
			props: { field, value: '2023-01-01T10:30:00Z', disabled: true }
		});

		const datePicker = screen.getByRole('textbox', { name: /date/i });
		const timePicker = screen.getByRole('textbox', { name: /time/i });
		expect(datePicker).toBeDisabled();
		expect(timePicker).toBeDisabled();
	});

	// Test readonly state
	it('makes inputs readonly when readonly prop is true', async () => {
		component = render(DatetimeField, {
			props: { field, value: '2023-01-01T10:30:00Z', readonly: true }
		});

		const datePicker = screen.getByRole('textbox', { name: /date/i });
		const timePicker = screen.getByRole('textbox', { name: /time/i });
		expect(datePicker).toHaveAttribute('readonly');
		expect(timePicker).toHaveAttribute('readonly');
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({
			fieldtype: 'Datetime',
			required: true
		});

		component = render(DatetimeField, {
			props: { field: requiredField, value: '2023-01-01T10:30:00Z' }
		});

		const label = screen.getByText('Test Field *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(DatetimeField, {
			props: { field, value: '2023-01-01T10:30:00Z', error: 'Invalid datetime' }
		});

		const errorMessage = screen.getByText('Invalid datetime');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test min date validation
	it('respects min date property', async () => {
		const fieldWithMin = createMockField({
			fieldtype: 'Datetime',
			options: '2023-01-01,2023-12-31'
		});

		component = render(DatetimeField, {
			props: { field: fieldWithMin, value: '2023-06-15T10:30:00Z' }
		});

		const datePicker = screen.getByRole('textbox', { name: /date/i });
		expect(datePicker).toHaveAttribute('min', '2023-01-01');
	});

	// Test max date validation
	it('respects max date property', async () => {
		const fieldWithMax = createMockField({
			fieldtype: 'Datetime',
			options: '2023-01-01,2023-12-31'
		});

		component = render(DatetimeField, {
			props: { field: fieldWithMax, value: '2023-06-15T10:30:00Z' }
		});

		const datePicker = screen.getByRole('textbox', { name: /date/i });
		expect(datePicker).toHaveAttribute('max', '2023-12-31');
	});

	// Test field label
	it('uses field label for display', async () => {
		const labeledField = createMockField({
			fieldtype: 'Datetime',
			label: 'Custom Datetime Field'
		});

		component = render(DatetimeField, {
			props: { field: labeledField, value: '2023-01-01T10:30:00Z' }
		});

		const label = screen.getByText('Custom Datetime Field');
		expect(label).toBeInTheDocument();
	});

	// Test hide label
	it('hides label when hideLabel is true', async () => {
		component = render(DatetimeField, {
			props: { field, value: '2023-01-01T10:30:00Z', hideLabel: true }
		});

		const label = screen.queryByText('Test Field');
		expect(label).not.toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({
			fieldtype: 'Datetime',
			description: 'This is a datetime field'
		});

		component = render(DatetimeField, {
			props: { field: fieldWithDescription, value: '2023-01-01T10:30:00Z' }
		});

		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test null value handling
	it('handles null value correctly', async () => {
		component = render(DatetimeField, {
			props: { field, value: null }
		});

		const datePicker = screen.getByRole('textbox', { name: /date/i });
		const timePicker = screen.getByRole('textbox', { name: /time/i });
		expect(datePicker).toHaveValue('');
		expect(timePicker).toHaveValue('');
	});

	// Test datetime parsing
	it('correctly parses ISO datetime strings', async () => {
		component = render(DatetimeField, {
			props: { field, value: '2023-12-25T14:30:00Z' }
		});

		const datePicker = screen.getByRole('textbox', { name: /date/i });
		const timePicker = screen.getByRole('textbox', { name: /time/i });
		expect(datePicker).toHaveValue('2023-12-25');
		expect(timePicker).toHaveValue('14:30');
	});

	// Test datetime formatting
	it('correctly formats datetime for storage', async () => {
		const onchange = vi.fn();

		component = render(DatetimeField, {
			props: { field, value: null, onchange }
		});

		const datePicker = screen.getByRole('textbox', { name: /date/i });
		const timePicker = screen.getByRole('textbox', { name: /time/i });
		await fireEvent.input(datePicker, { target: { value: '2023-12-31' } });
		await fireEvent.input(timePicker, { target: { value: '23:59' } });

		expect(onchange).toHaveBeenCalled();
		expect(onchange.mock.calls[0][0]).toMatch(/2023-12-31T23:59/);
	});

	// Test focus and blur events
	it('emits focus and blur events', async () => {
		const onfocus = vi.fn();
		const onblur = vi.fn();

		component = render(DatetimeField, {
			props: { field, value: '2023-01-01T10:30:00Z', onfocus, onblur }
		});

		const datePicker = screen.getByRole('textbox', { name: /date/i });
		await fireEvent.focus(datePicker);
		await fireEvent.blur(datePicker);

		expect(onfocus).toHaveBeenCalled();
		expect(onblur).toHaveBeenCalled();
	});

	// Test time format (12-hour vs 24-hour)
	it('supports 12-hour time format', async () => {
		component = render(DatetimeField, {
			props: { field, value: '2023-01-01T14:30:00Z', timeFormat: '12' }
		});

		const amPmSelect = screen.getByRole('button', { name: /AM|PM/i });
		expect(amPmSelect).toBeInTheDocument();
	});

	// Test responsive layout
	it('adapts to mobile layout', async () => {
		// Mock mobile viewport
		global.innerWidth = 500;

		component = render(DatetimeField, {
			props: { field, value: '2023-01-01T10:30:00Z' }
		});

		const container = screen.getByRole('group', { name: /datetime/i });
		expect(container).toHaveClass('datetime-container');

		// Reset viewport
		global.innerWidth = 1024;
	});
});