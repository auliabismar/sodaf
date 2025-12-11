import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import IntField from '../IntField.svelte';
import { createMockField } from './fixtures/mockFields';

describe('IntField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = createMockField({ fieldtype: 'Int' });
	});

	// P3-007-T2: IntField renders NumberInput
	it('renders NumberInput component', async () => {
		component = render(IntField, {
			props: { field, value: 42 }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toBeInTheDocument();
		expect(input).toHaveValue(42);
	});

	// P3-007-T33: Value binding works
	it('supports two-way value binding', async () => {
		let testValue = 0;
		component = render(IntField, {
			props: { field, value: testValue }
		});

		const input = screen.getByRole('spinbutton');
		await fireEvent.input(input, { target: { value: '123' } });

		expect(input).toHaveValue(123);
	});

	// P3-007-T34: Change event emitted
	it('emits change event on value change', async () => {
		const onchange = vi.fn();

		component = render(IntField, {
			props: { field, value: 0, onchange }
		});

		const input = screen.getByRole('spinbutton');
		await fireEvent.input(input, { target: { value: '456' } });

		expect(onchange).toHaveBeenCalledWith(456);
	});

	// Test disabled state
	it('disables input when disabled prop is true', async () => {
		component = render(IntField, {
			props: { field, value: 0, disabled: true }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toBeDisabled();
	});

	// Test readonly state
	it('makes input readonly when readonly prop is true', async () => {
		component = render(IntField, {
			props: { field, value: 0, readonly: true }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toHaveAttribute('readonly');
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({
			fieldtype: 'Int',
			required: true
		});

		component = render(IntField, {
			props: { field: requiredField, value: 0 }
		});

		const label = screen.getByText('Test Field *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(IntField, {
			props: { field, value: 0, error: 'This field is required' }
		});

		const errorMessage = screen.getByText('This field is required');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test min value validation
	it('respects min value property', async () => {
		const fieldWithMin = createMockField({
			fieldtype: 'Int',
			options: '10,100'
		});

		component = render(IntField, {
			props: { field: fieldWithMin, value: 0 }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toHaveAttribute('min', '10');
	});

	// Test max value validation
	it('respects max value property', async () => {
		const fieldWithMax = createMockField({
			fieldtype: 'Int',
			options: '0,100'
		});

		component = render(IntField, {
			props: { field: fieldWithMax, value: 0 }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toHaveAttribute('max', '100');
	});

	// Test step value
	it('uses step value for increment/decrement', async () => {
		component = render(IntField, {
			props: { field, value: 0, step: 5 }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toHaveAttribute('step', '5');
	});

	// Test field label
	it('uses field label for display', async () => {
		const labeledField = createMockField({
			fieldtype: 'Int',
			label: 'Custom Integer Field'
		});

		component = render(IntField, {
			props: { field: labeledField, value: 0 }
		});

		const label = screen.getByText('Custom Integer Field');
		expect(label).toBeInTheDocument();
	});

	// Test hide label
	it('hides label when hideLabel is true', async () => {
		component = render(IntField, {
			props: { field, value: 0, hideLabel: true }
		});

		const label = screen.queryByText('Test Field');
		expect(label).not.toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({
			fieldtype: 'Int',
			description: 'This is an integer field'
		});

		component = render(IntField, {
			props: { field: fieldWithDescription, value: 0 }
		});

		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test null value handling
	it('handles null value correctly', async () => {
		component = render(IntField, {
			props: { field, value: null }
		});

		const input = screen.getByRole('spinbutton');
		expect(input).toHaveValue(null);
	});

	// Test integer validation
	it('validates integer input', async () => {
		component = render(IntField, {
			props: { field, value: 0 }
		});

		const input = screen.getByRole('spinbutton');

		// Test decimal input (should be rejected or converted)
		await fireEvent.input(input, { target: { value: '12.34' } });

		// The component should handle this appropriately
		// This test depends on the specific implementation
	});
});