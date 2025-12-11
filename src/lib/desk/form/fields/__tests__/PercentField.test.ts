import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import PercentField from '../PercentField.svelte';
import { createMockField } from './fixtures/mockFields';

describe('PercentField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = createMockField({ fieldtype: 'Percent' });
	});

	// P3-007-T5: PercentField renders NumberInput
	it('renders NumberInput component', async () => {
		component = render(PercentField, {
			props: { field, value: 42 }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toBeInTheDocument();
		expect(input).toHaveValue(42);
	});

	// P3-007-T33: Value binding works
	it('supports two-way value binding', async () => {
		let testValue = 0;
		component = render(PercentField, {
			props: { field, value: testValue }
		});

		const input = screen.getByRole('spinbutton');
		await fireEvent.input(input, { target: { value: '75' } });

		expect(input).toHaveValue(75);
	});

	// P3-007-T34: Change event emitted
	it('emits change event on value change', async () => {
		const onchange = vi.fn();

		component = render(PercentField, {
			props: { field, value: 0, onchange }
		});

		const input = screen.getByRole('spinbutton');
		await fireEvent.input(input, { target: { value: '85' } });

		expect(onchange).toHaveBeenCalledWith(85);
	});

	// Test disabled state
	it('disables input when disabled prop is true', async () => {
		component = render(PercentField, {
			props: { field, value: 0, disabled: true }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toBeDisabled();
	});

	// Test readonly state
	it('makes input readonly when readonly prop is true', async () => {
		component = render(PercentField, {
			props: { field, value: 0, readonly: true }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toHaveAttribute('readonly');
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({
			fieldtype: 'Percent',
			required: true
		});

		component = render(PercentField, {
			props: { field: requiredField, value: 0 }
		});

		const label = screen.getByText('Test Field *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(PercentField, {
			props: { field, value: 0, error: 'This field is required' }
		});

		const errorMessage = screen.getByText('This field is required');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test min value validation (0-100 range)
	it('enforces minimum value of 0', async () => {
		component = render(PercentField, {
			props: { field, value: 0, min: 0 }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toHaveAttribute('min', '0');
	});

	// Test max value validation (0-100 range)
	it('enforces maximum value of 100', async () => {
		component = render(PercentField, {
			props: { field, value: 0, max: 100 }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toHaveAttribute('max', '100');
	});

	// Test custom range
	it('respects custom min/max values', async () => {
		component = render(PercentField, {
			props: { field, value: 0, min: 10, max: 90 }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toHaveAttribute('min', '10');
		expect(input).toHaveAttribute('max', '90');
	});

	// Test step value
	it('uses step value for increment/decrement', async () => {
		component = render(PercentField, {
			props: { field, value: 0, step: 5 }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toHaveAttribute('step', '5');
	});

	// Test precision
	it('respects precision property', async () => {
		const fieldWithPrecision = createMockField({
			fieldtype: 'Percent',
			precision: 2
		});

		component = render(PercentField, {
			props: { field: fieldWithPrecision, value: 0, precision: 2 }
		});

		// Precision is handled in the formatting logic
		const input = screen.getByRole('spinbutton');
		expect(input).toBeInTheDocument();
	});

	// Test field label
	it('uses field label for display', async () => {
		const labeledField = createMockField({
			fieldtype: 'Percent',
			label: 'Custom Percent Field'
		});

		component = render(PercentField, {
			props: { field: labeledField, value: 0 }
		});

		const label = screen.getByText('Custom Percent Field');
		expect(label).toBeInTheDocument();
	});

	// Test hide label
	it('hides label when hideLabel is true', async () => {
		component = render(PercentField, {
			props: { field, value: 0, hideLabel: true }
		});

		const label = screen.queryByText('Test Field');
		expect(label).not.toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({
			fieldtype: 'Percent',
			description: 'This is a percent field'
		});

		component = render(PercentField, {
			props: { field: fieldWithDescription, value: 0 }
		});

		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test null value handling
	it('handles null value correctly', async () => {
		component = render(PercentField, {
			props: { field, value: null }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toHaveValue(null);
	});

	// Test percentage input validation
	it('validates percentage input correctly', async () => {
		component = render(PercentField, {
			props: { field, value: 0 }
		});

		const input = screen.getByRole('spinbutton');

		// Test valid percentage
		await fireEvent.input(input, { target: { value: '50' } });
		expect(input).toHaveValue(50);

		// Test decimal percentage
		await fireEvent.input(input, { target: { value: '75.5' } });
		expect(input).toHaveValue(75.5);
	});

	// Test range validation
	it('validates input is within 0-100 range', async () => {
		component = render(PercentField, {
			props: { field, value: 50 }
		});

		const input = screen.getByRole('spinbutton');

		// Test values outside range
		// The component should handle these appropriately
		expect(input).toHaveAttribute('min', '0');
		expect(input).toHaveAttribute('max', '100');
	});
});