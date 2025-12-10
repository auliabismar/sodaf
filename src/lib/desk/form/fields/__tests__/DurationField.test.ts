import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach } from 'vitest';
import DurationField from '../DurationField.svelte';
import { createMockField } from './fixtures/mockFields';

describe('DurationField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = createMockField({ fieldtype: 'Duration' });
	});

	// P3-007-T15: DurationField renders NumberInputs
	it('renders NumberInput components', async () => {
		component = render(DurationField, {
			props: { field, value: '1d 2h 30m' }
		});
		
		const daysInput = screen.getByRole('spinbutton', { name: /days/i });
		const hoursInput = screen.getByRole('spinbutton', { name: /hours/i });
		const minutesInput = screen.getByRole('spinbutton', { name: /minutes/i });
		
		expect(daysInput).toBeInTheDocument();
		expect(hoursInput).toBeInTheDocument();
		expect(minutesInput).toBeInTheDocument();
		
		expect(daysInput).toHaveValue(1);
		expect(hoursInput).toHaveValue(2);
		expect(minutesInput).toHaveValue(30);
	});

	// P3-007-T33: Value binding works
	it('supports two-way value binding', async () => {
		let testValue = '2d 4h 15m';
		component = render(DurationField, {
			props: { field, value: testValue }
		});
		
		const daysInput = screen.getByRole('spinbutton', { name: /days/i });
		const hoursInput = screen.getByRole('spinbutton', { name: /hours/i });
		const minutesInput = screen.getByRole('spinbutton', { name: /minutes/i });
		
		expect(daysInput).toHaveValue(2);
		expect(hoursInput).toHaveValue(4);
		expect(minutesInput).toHaveValue(15);
	});

	// P3-007-T34: Change event emitted
	it('emits change event on value change', async () => {
		let changeEventFired = false;
		let changeEventValue = '';
		
		component = render(DurationField, {
			props: { field, value: '1d 2h 30m' }
		});
		
		// Listen for change event
		const unsubscribe = component.$on('change', (event: any) => {
			changeEventFired = true;
			changeEventValue = event.detail;
		});
		
		const daysInput = screen.getByRole('spinbutton', { name: /days/i });
		await fireEvent.input(daysInput, { target: { valueAsNumber: 3 } });
		
		expect(changeEventFired).toBe(true);
		expect(changeEventValue).toBe('3d 2h 30m');
		
		unsubscribe();
	});

	// Test disabled state
	it('disables inputs when disabled prop is true', async () => {
		component = render(DurationField, {
			props: { field, value: '1d 2h 30m', disabled: true }
		});
		
		const daysInput = screen.getByRole('spinbutton', { name: /days/i });
		const hoursInput = screen.getByRole('spinbutton', { name: /hours/i });
		const minutesInput = screen.getByRole('spinbutton', { name: /minutes/i });
		
		expect(daysInput).toBeDisabled();
		expect(hoursInput).toBeDisabled();
		expect(minutesInput).toBeDisabled();
	});

	// Test readonly state
	it('makes inputs readonly when readonly prop is true', async () => {
		component = render(DurationField, {
			props: { field, value: '1d 2h 30m', readonly: true }
		});
		
		const daysInput = screen.getByRole('spinbutton', { name: /days/i });
		const hoursInput = screen.getByRole('spinbutton', { name: /hours/i });
		const minutesInput = screen.getByRole('spinbutton', { name: /minutes/i });
		
		expect(daysInput).toHaveAttribute('readonly');
		expect(hoursInput).toHaveAttribute('readonly');
		expect(minutesInput).toHaveAttribute('readonly');
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({ 
			fieldtype: 'Duration', 
			required: true 
		});
		
		component = render(DurationField, {
			props: { field: requiredField, value: '1d 2h 30m' }
		});
		
		const label = screen.getByText('Test Field *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(DurationField, {
			props: { field, value: '1d 2h 30m', error: 'Invalid duration' }
		});
		
		const errorMessage = screen.getByText('Invalid duration');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test field label
	it('uses field label for display', async () => {
		const labeledField = createMockField({ 
			fieldtype: 'Duration', 
			label: 'Custom Duration Field' 
		});
		
		component = render(DurationField, {
			props: { field: labeledField, value: '1d 2h 30m' }
		});
		
		const label = screen.getByText('Custom Duration Field');
		expect(label).toBeInTheDocument();
	});

	// Test hide label
	it('hides label when hideLabel is true', async () => {
		component = render(DurationField, {
			props: { field, value: '1d 2h 30m', hideLabel: true }
		});
		
		const label = screen.queryByText('Test Field');
		expect(label).not.toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({ 
			fieldtype: 'Duration', 
			description: 'This is a duration field' 
		});
		
		component = render(DurationField, {
			props: { field: fieldWithDescription, value: '1d 2h 30m' }
		});
		
		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test null value handling
	it('handles null value correctly', async () => {
		component = render(DurationField, {
			props: { field, value: null }
		});
		
		const daysInput = screen.getByRole('spinbutton', { name: /days/i });
		const hoursInput = screen.getByRole('spinbutton', { name: /hours/i });
		const minutesInput = screen.getByRole('spinbutton', { name: /minutes/i });
		
		expect(daysInput).toHaveValue(0);
		expect(hoursInput).toHaveValue(0);
		expect(minutesInput).toHaveValue(0);
	});

	// Test show/hide options
	it('respects showDays, showHours, showMinutes, showSeconds props', async () => {
		component = render(DurationField, {
			props: { 
				field, 
				value: '1d 2h 30m 45s',
				showDays: true,
				showHours: true,
				showMinutes: true,
				showSeconds: true
			}
		});
		
		const daysInput = screen.getByRole('spinbutton', { name: /days/i });
		const hoursInput = screen.getByRole('spinbutton', { name: /hours/i });
		const minutesInput = screen.getByRole('spinbutton', { name: /minutes/i });
		const secondsInput = screen.getByRole('spinbutton', { name: /seconds/i });
		
		expect(daysInput).toBeInTheDocument();
		expect(hoursInput).toBeInTheDocument();
		expect(minutesInput).toBeInTheDocument();
		expect(secondsInput).toBeInTheDocument();
	});

	// Test duration parsing
	it('correctly parses different duration formats', async () => {
		component = render(DurationField, {
			props: { field, value: '90:30:00' } // 1h 30m 30s format
		});
		
		const daysInput = screen.getByRole('spinbutton', { name: /days/i });
		const hoursInput = screen.getByRole('spinbutton', { name: /hours/i });
		const minutesInput = screen.getByRole('spinbutton', { name: /minutes/i });
		
		expect(daysInput).toHaveValue(3); // 90 minutes = 1h 30m
		expect(hoursInput).toHaveValue(1);
		expect(minutesInput).toHaveValue(30);
	});

	// Test duration formatting
	it('correctly formats duration for storage', async () => {
		let changeEventFired = false;
		let changeEventValue = '';
		
		component = render(DurationField, {
			props: { field, value: null }
		});
		
		// Listen for change event
		const unsubscribe = component.$on('change', (event: any) => {
			changeEventFired = true;
			changeEventValue = event.detail;
		});
		
		const daysInput = screen.getByRole('spinbutton', { name: /days/i });
		const hoursInput = screen.getByRole('spinbutton', { name: /hours/i });
		const minutesInput = screen.getByRole('spinbutton', { name: /minutes/i });
		
		await fireEvent.input(daysInput, { target: { valueAsNumber: 2 } });
		await fireEvent.input(hoursInput, { target: { valueAsNumber: 5 } });
		await fireEvent.input(minutesInput, { target: { valueAsNumber: 45 } });
		
		expect(changeEventFired).toBe(true);
		expect(changeEventValue).toBe('2d 5h 45m');
		
		unsubscribe();
	});

	// Test focus and blur events
	it('emits focus and blur events', async () => {
		let focusEventFired = false;
		let blurEventFired = false;
		
		component = render(DurationField, {
			props: { field, value: '1d 2h 30m' }
		});
		
		// Listen for events
		const unsubscribeFocus = component.$on('focus', () => {
			focusEventFired = true;
		});
		const unsubscribeBlur = component.$on('blur', () => {
			blurEventFired = true;
		});
		
		const daysInput = screen.getByRole('spinbutton', { name: /days/i });
		await fireEvent.focus(daysInput);
		await fireEvent.blur(daysInput);
		
		expect(focusEventFired).toBe(true);
		expect(blurEventFired).toBe(true);
		
		unsubscribeFocus();
		unsubscribeBlur();
	});

	// Test responsive layout
	it('adapts to mobile layout', async () => {
		// Mock mobile viewport
		global.innerWidth = 500;
		
		component = render(DurationField, {
			props: { field, value: '1d 2h 30m' }
		});
		
		const container = screen.getByRole('group', { name: /duration/i });
		expect(container).toHaveClass('duration-container');
		
		// Reset viewport
		global.innerWidth = 1024;
	});
});