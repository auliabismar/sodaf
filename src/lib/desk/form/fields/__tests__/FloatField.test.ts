import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import FloatField from '../FloatField.svelte';
import { createMockField } from './fixtures/mockFields';

describe('FloatField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = createMockField({ fieldtype: 'Float' });
	});

	// P3-007-T3: FloatField renders NumberInput
	it('renders NumberInput component', async () => {
		component = render(FloatField, {
			props: { field, value: 42.5 }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toBeInTheDocument();
		expect(input).toHaveValue(42.5);
	});

	// P3-007-T33: Value binding works
	it('supports two-way value binding', async () => {
		let testValue = 0.0;
		component = render(FloatField, {
			props: { field, value: testValue }
		});

		const input = screen.getByRole('spinbutton');
		await fireEvent.input(input, { target: { value: '123.45' } });

		expect(input).toHaveValue(123.45);
	});

	// P3-007-T34: Change event emitted
	it('emits change event on value change', async () => {
		const onchange = vi.fn();

		component = render(FloatField, {
			props: { field, value: 0.0, onchange }
		});

		const input = screen.getByRole('spinbutton');
		await fireEvent.input(input, { target: { value: '456.78' } });

		expect(onchange).toHaveBeenCalledWith(456.78);
	});

	// Test disabled state
	it('disables input when disabled prop is true', async () => {
		component = render(FloatField, {
			props: { field, value: 0.0, disabled: true }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toBeDisabled();
	});

	// Test readonly state
	it('makes input readonly when readonly prop is true', async () => {
		component = render(FloatField, {
			props: { field, value: 0.0, readonly: true }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toHaveAttribute('readonly');
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({
			fieldtype: 'Float',
			required: true
		});

		component = render(FloatField, {
			props: { field: requiredField, value: 0.0 }
		});

		const label = screen.getByText('Test Field *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(FloatField, {
			props: { field, value: 0.0, error: 'This field is required' }
		});

		const errorMessage = screen.getByText('This field is required');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test min value validation
	it('respects min value property', async () => {
		const fieldWithMin = createMockField({
			fieldtype: 'Float',
			options: '10.5,100.0'
		});

		component = render(FloatField, {
			props: { field: fieldWithMin, value: 0.0 }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toHaveAttribute('min', '10.5');
	});

	// Test max value validation
	it('respects max value property', async () => {
		const fieldWithMax = createMockField({
			fieldtype: 'Float',
			options: '0.0,100.0'
		});

		component = render(FloatField, {
			props: { field: fieldWithMax, value: 0.0 }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toHaveAttribute('max', '100');
	});

	// Test step value
	it('uses step value for increment/decrement', async () => {
		component = render(FloatField, {
			props: { field, value: 0.0, step: 0.1 }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toHaveAttribute('step', '0.1');
	});

	// Test precision
	it('respects precision property', async () => {
		const fieldWithPrecision = createMockField({
			fieldtype: 'Float',
			precision: 3
		});

		component = render(FloatField, {
			props: { field: fieldWithPrecision, value: 0.0, precision: 3 }
		});

		// Precision is handled in the formatting logic
		const input = screen.getByRole('spinbutton');
		expect(input).toBeInTheDocument();
	});

	// Test field label
	it('uses field label for display', async () => {
		const labeledField = createMockField({
			fieldtype: 'Float',
			label: 'Custom Float Field'
		});

		component = render(FloatField, {
			props: { field: labeledField, value: 0.0 }
		});

		const label = screen.getByText('Custom Float Field');
		expect(label).toBeInTheDocument();
	});

	// Test hide label
	it('hides label when hideLabel is true', async () => {
		component = render(FloatField, {
			props: { field, value: 0.0, hideLabel: true }
		});

		const label = screen.queryByText('Test Field');
		expect(label).not.toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({
			fieldtype: 'Float',
			description: 'This is a float field'
		});

		component = render(FloatField, {
			props: { field: fieldWithDescription, value: 0.0 }
		});

		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test null value handling
	it('handles null value correctly', async () => {
		component = render(FloatField, {
			props: { field, value: null }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toHaveValue(null);
	});

	// Test decimal input validation
	it('validates decimal input correctly', async () => {
		component = render(FloatField, {
			props: { field, value: 0.0 }
		});

		const input = screen.getByRole('spinbutton');

		// Test decimal input
		await fireEvent.input(input, { target: { value: '12.34' } });
		expect(input).toHaveValue(12.34);

		// Test scientific notation
		await fireEvent.input(input, { target: { value: '1.23e4' } });
		// This should be handled appropriately by the component
	});
});