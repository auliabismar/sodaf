import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import DateField from '../DateField.svelte';
import { createMockField } from './fixtures/mockFields';

// Extend vitest expect with jest-dom matchers
expect.extend(matchers);

describe('DateField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = createMockField({ fieldtype: 'Date' });
	});

	// P3-007-T12: DateField renders DatePicker
	it('renders DatePicker component', async () => {
		component = render(DateField, {
			props: { field, value: '2023-12-25' }
		});
		
		const datePicker = screen.getByRole('textbox');
		expect(datePicker).toBeInTheDocument();
		expect(datePicker).toHaveValue('2023-12-25');
	});

	// P3-007-T13: Value binding works
	it('supports two-way value binding', async () => {
		let testValue = '2023-01-01';
		component = render(DateField, {
			props: { field, value: testValue }
		});
		
		const datePicker = screen.getByRole('textbox');
		expect(datePicker).toHaveValue('2023-01-01');
	});

	// P3-007-T14: Change event emitted
	it('emits change event on value change', async () => {
		let changeEventFired = false;
		let changeEventValue = '';
		
		component = render(DateField, {
			props: { field, value: '2023-01-01' }
		});
		
		// Listen for change event
		const unsubscribe = component.$on('change', (event: any) => {
			changeEventFired = true;
			changeEventValue = event.detail;
		});
		
		const datePicker = screen.getByRole('textbox');
		await fireEvent.input(datePicker, { target: { value: '2023-12-31' } });
		
		expect(changeEventFired).toBe(true);
		expect(changeEventValue).toBe('2023-12-31');
		
		unsubscribe();
	});

	// Test disabled state
	it('disables input when disabled prop is true', async () => {
		component = render(DateField, {
			props: { field, value: '2023-01-01', disabled: true }
		});
		
		const datePicker = screen.getByRole('textbox');
		expect(datePicker).toBeDisabled();
	});

	// Test readonly state
	it('makes input readonly when readonly prop is true', async () => {
		component = render(DateField, {
			props: { field, value: '2023-01-01', readonly: true }
		});
		
		const datePicker = screen.getByRole('textbox');
		expect(datePicker).toHaveAttribute('readonly');
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({ 
			fieldtype: 'Date', 
			required: true 
		});
		
		component = render(DateField, {
			props: { field: requiredField, value: '2023-01-01' }
		});
		
		const label = screen.getByText('Test Field *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(DateField, {
			props: { field, value: '2023-01-01', error: 'Invalid date' }
		});
		
		const errorMessage = screen.getByText('Invalid date');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test min date validation
	it('respects min date property', async () => {
		const fieldWithMin = createMockField({ 
			fieldtype: 'Date', 
			options: '2023-01-01,2023-12-31'
		});
		
		component = render(DateField, {
			props: { field: fieldWithMin, value: '2023-06-15' }
		});
		
		const datePicker = screen.getByRole('textbox');
		expect(datePicker).toHaveAttribute('min', '2023-01-01');
	});

	// Test max date validation
	it('respects max date property', async () => {
		const fieldWithMax = createMockField({ 
			fieldtype: 'Date', 
			options: '2023-01-01,2023-12-31'
		});
		
		component = render(DateField, {
			props: { field: fieldWithMax, value: '2023-06-15' }
		});
		
		const datePicker = screen.getByRole('textbox');
		expect(datePicker).toHaveAttribute('max', '2023-12-31');
	});

	// Test field label
	it('uses field label for display', async () => {
		const labeledField = createMockField({ 
			fieldtype: 'Date', 
			label: 'Custom Date Field' 
		});
		
		component = render(DateField, {
			props: { field: labeledField, value: '2023-01-01' }
		});
		
		const label = screen.getByText('Custom Date Field');
		expect(label).toBeInTheDocument();
	});

	// Test hide label
	it('hides label when hideLabel is true', async () => {
		component = render(DateField, {
			props: { field, value: '2023-01-01', hideLabel: true }
		});
		
		const label = screen.queryByText('Test Field');
		expect(label).not.toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({ 
			fieldtype: 'Date', 
			description: 'This is a date field' 
		});
		
		component = render(DateField, {
			props: { field: fieldWithDescription, value: '2023-01-01' }
		});
		
		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test null value handling
	it('handles null value correctly', async () => {
		component = render(DateField, {
			props: { field, value: null }
		});
		
		const datePicker = screen.getByRole('textbox');
		expect(datePicker).toHaveValue('');
	});

	// Test date parsing
	it('correctly parses different date formats', async () => {
		component = render(DateField, {
			props: { field, value: '2023-12-25T10:30:00Z' }
		});
		
		const datePicker = screen.getByRole('textbox');
		expect(datePicker).toHaveValue('2023-12-25');
	});

	// Test date formatting
	it('correctly formats date for storage', async () => {
		let changeEventFired = false;
		let changeEventValue = '';
		
		component = render(DateField, {
			props: { field, value: null }
		});
		
		// Listen for change event
		const unsubscribe = component.$on('change', (event: any) => {
			changeEventFired = true;
			changeEventValue = event.detail;
		});
		
		const datePicker = screen.getByRole('textbox');
		await fireEvent.input(datePicker, { target: { value: '2023-12-31' } });
		
		expect(changeEventFired).toBe(true);
		expect(changeEventValue).toBe('2023-12-31');
		
		unsubscribe();
	});

	// Test focus and blur events
	it('emits focus and blur events', async () => {
		let focusEventFired = false;
		let blurEventFired = false;
		
		component = render(DateField, {
			props: { field, value: '2023-01-01' }
		});
		
		// Listen for events
		const unsubscribeFocus = component.$on('focus', () => {
			focusEventFired = true;
		});
		const unsubscribeBlur = component.$on('blur', () => {
			blurEventFired = true;
		});
		
		const datePicker = screen.getByRole('textbox');
		await fireEvent.focus(datePicker);
		await fireEvent.blur(datePicker);
		
		expect(focusEventFired).toBe(true);
		expect(blurEventFired).toBe(true);
		
		unsubscribeFocus();
		unsubscribeBlur();
	});
});