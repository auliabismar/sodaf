import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach } from 'vitest';
import TimeField from '../TimeField.svelte';
import { createMockField } from './fixtures/mockFields';

describe('TimeField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = createMockField({ fieldtype: 'Time' });
	});

	// P3-007-T14: TimeField renders TimePicker
	it('renders TimePicker component', async () => {
		component = render(TimeField, {
			props: { field, value: '14:30' }
		});
		
		const timePicker = screen.getByRole('textbox', { name: /time/i });
		expect(timePicker).toBeInTheDocument();
		expect(timePicker).toHaveValue('14:30');
	});

	// P3-007-T33: Value binding works
	it('supports two-way value binding', async () => {
		let testValue = '10:15';
		component = render(TimeField, {
			props: { field, value: testValue }
		});
		
		const timePicker = screen.getByRole('textbox', { name: /time/i });
		expect(timePicker).toHaveValue('10:15');
	});

	// P3-007-T34: Change event emitted
	it('emits change event on value change', async () => {
		let changeEventFired = false;
		let changeEventValue = '';
		
		component = render(TimeField, {
			props: { field, value: '10:15' }
		});
		
		// Listen for change event
		const unsubscribe = component.$on('change', (event: any) => {
			changeEventFired = true;
			changeEventValue = event.detail;
		});
		
		const timePicker = screen.getByRole('textbox', { name: /time/i });
		await fireEvent.input(timePicker, { target: { value: '23:45' } });
		
		expect(changeEventFired).toBe(true);
		expect(changeEventValue).toBe('23:45');
		
		unsubscribe();
	});

	// Test disabled state
	it('disables input when disabled prop is true', async () => {
		component = render(TimeField, {
			props: { field, value: '10:15', disabled: true }
		});
		
		const timePicker = screen.getByRole('textbox', { name: /time/i });
		expect(timePicker).toBeDisabled();
	});

	// Test readonly state
	it('makes input readonly when readonly prop is true', async () => {
		component = render(TimeField, {
			props: { field, value: '10:15', readonly: true }
		});
		
		const timePicker = screen.getByRole('textbox', { name: /time/i });
		expect(timePicker).toHaveAttribute('readonly');
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({ 
			fieldtype: 'Time', 
			required: true 
		});
		
		component = render(TimeField, {
			props: { field: requiredField, value: '10:15' }
		});
		
		const label = screen.getByText('Test Field *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(TimeField, {
			props: { field, value: '10:15', error: 'Invalid time' }
		});
		
		const errorMessage = screen.getByText('Invalid time');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test field label
	it('uses field label for display', async () => {
		const labeledField = createMockField({ 
			fieldtype: 'Time', 
			label: 'Custom Time Field' 
		});
		
		component = render(TimeField, {
			props: { field: labeledField, value: '10:15' }
		});
		
		const label = screen.getByText('Custom Time Field');
		expect(label).toBeInTheDocument();
	});

	// Test hide label
	it('hides label when hideLabel is true', async () => {
		component = render(TimeField, {
			props: { field, value: '10:15', hideLabel: true }
		});
		
		const label = screen.queryByText('Test Field');
		expect(label).not.toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({ 
			fieldtype: 'Time', 
			description: 'This is a time field' 
		});
		
		component = render(TimeField, {
			props: { field: fieldWithDescription, value: '10:15' }
		});
		
		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test null value handling
	it('handles null value correctly', async () => {
		component = render(TimeField, {
			props: { field, value: null }
		});
		
		const timePicker = screen.getByRole('textbox', { name: /time/i });
		expect(timePicker).toHaveValue('');
	});

	// Test time format (12-hour vs 24-hour)
	it('supports 12-hour time format', async () => {
		component = render(TimeField, {
			props: { field, value: '14:30', timeFormat: '12' }
		});
		
		const amPmSelect = screen.getByRole('button', { name: /AM|PM/i });
		expect(amPmSelect).toBeInTheDocument();
	});

	// Test time parsing
	it('correctly parses different time formats', async () => {
		component = render(TimeField, {
			props: { field, value: '14:30:00' }
		});
		
		const timePicker = screen.getByRole('textbox', { name: /time/i });
		expect(timePicker).toHaveValue('14:30');
	});

	// Test time formatting
	it('correctly formats time for storage', async () => {
		let changeEventFired = false;
		let changeEventValue = '';
		
		component = render(TimeField, {
			props: { field, value: null, timeFormat: '12' }
		});
		
		// Listen for change event
		const unsubscribe = component.$on('change', (event: any) => {
			changeEventFired = true;
			changeEventValue = event.detail;
		});
		
		const timePicker = screen.getByRole('textbox', { name: /time/i });
		await fireEvent.input(timePicker, { target: { value: '11:45' } });
		
		expect(changeEventFired).toBe(true);
		expect(changeEventValue).toBe('23:45'); // 11:45 PM should convert to 23:45 in 24-hour format
		
		unsubscribe();
	});

	// Test focus and blur events
	it('emits focus and blur events', async () => {
		let focusEventFired = false;
		let blurEventFired = false;
		
		component = render(TimeField, {
			props: { field, value: '10:15' }
		});
		
		// Listen for events
		const unsubscribeFocus = component.$on('focus', () => {
			focusEventFired = true;
		});
		const unsubscribeBlur = component.$on('blur', () => {
			blurEventFired = true;
		});
		
		const timePicker = screen.getByRole('textbox', { name: /time/i });
		await fireEvent.focus(timePicker);
		await fireEvent.blur(timePicker);
		
		expect(focusEventFired).toBe(true);
		expect(blurEventFired).toBe(true);
		
		unsubscribeFocus();
		unsubscribeBlur();
	});
});