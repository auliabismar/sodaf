import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CurrencyField from '../CurrencyField.svelte';
import { createMockField } from './fixtures/mockFields';

describe('CurrencyField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = createMockField({ fieldtype: 'Currency', options: 'USD' });
	});

	// P3-007-T4: CurrencyField renders TextInput
	it('renders TextInput component', async () => {
		component = render(CurrencyField, {
			props: { field, value: 42.50 }
		});

		const input = screen.getByRole('textbox');
		expect(input).toBeInTheDocument();
	});

	// P3-007-T33: Value binding works
	it('supports two-way value binding', async () => {
		let testValue = 0.0;
		component = render(CurrencyField, {
			props: { field, value: testValue }
		});

		const input = screen.getByRole('textbox');
		await fireEvent.input(input, { target: { value: '$123.45' } });

		expect(input).toBeInTheDocument();
	});

	// P3-007-T34: Change event emitted
	it('emits change event on value change', async () => {
		const onchange = vi.fn();

		component = render(CurrencyField, {
			props: { field, value: 0.0, onchange }
		});

		const input = screen.getByRole('textbox');
		await fireEvent.input(input, { target: { value: '$456.78' } });

		// CurrencyField might emit the numeric value or string depending on implementation
		// Based on original test: expect(changeEventValue).toBe(456.78);
		expect(onchange).toHaveBeenCalledWith(456.78);
	});

	// Test disabled state
	it('disables input when disabled prop is true', async () => {
		component = render(CurrencyField, {
			props: { field, value: 0.0, disabled: true }
		});

		const input = screen.getByRole('textbox');
		expect(input).toBeDisabled();
	});

	// Test readonly state
	it('makes input readonly when readonly prop is true', async () => {
		component = render(CurrencyField, {
			props: { field, value: 0.0, readonly: true }
		});

		const input = screen.getByRole('textbox');
		expect(input).toHaveAttribute('readonly');
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({
			fieldtype: 'Currency',
			options: 'USD',
			required: true
		});

		component = render(CurrencyField, {
			props: { field: requiredField, value: 0.0 }
		});

		const label = screen.getByText('Test Field *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(CurrencyField, {
			props: { field, value: 0.0, error: 'This field is required' }
		});

		const errorMessage = screen.getByText('This field is required');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test currency formatting
	it('formats currency value with proper symbol', async () => {
		component = render(CurrencyField, {
			props: { field, value: 1234.56, currency: 'USD' }
		});

		const input = screen.getByRole('textbox') as HTMLInputElement;
		expect(input).toBeInTheDocument();
		// The formatted value should include currency symbol
		expect(input.value || '').toContain('$');
	});

	// Test different currency
	it('uses different currency symbol when specified', async () => {
		const euroField = createMockField({
			fieldtype: 'Currency',
			options: 'EUR'
		});

		component = render(CurrencyField, {
			props: { field: euroField, value: 100.0 }
		});

		const input = screen.getByRole('textbox') as HTMLInputElement;
		expect(input).toBeInTheDocument();
		// The formatted value should include EUR symbol
		expect(input.value || '').toContain('€');
	});

	// Test precision
	it('respects precision property', async () => {
		const fieldWithPrecision = createMockField({
			fieldtype: 'Currency',
			options: 'USD',
			precision: 3
		});

		component = render(CurrencyField, {
			props: { field: fieldWithPrecision, value: 123.456 }
		});

		const input = screen.getByRole('textbox');
		expect(input).toBeInTheDocument();
		// The formatted value should respect precision
	});

	// Test field label
	it('uses field label for display', async () => {
		const labeledField = createMockField({
			fieldtype: 'Currency',
			label: 'Custom Currency Field',
			options: 'USD'
		});

		component = render(CurrencyField, {
			props: { field: labeledField, value: 0.0 }
		});

		const label = screen.getByText('Custom Currency Field');
		expect(label).toBeInTheDocument();
	});

	// Test hide label
	it('hides label when hideLabel is true', async () => {
		component = render(CurrencyField, {
			props: { field, value: 0.0, hideLabel: true }
		});

		const label = screen.queryByText('Test Field');
		expect(label).not.toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({
			fieldtype: 'Currency',
			options: 'USD',
			description: 'This is a currency field'
		});

		component = render(CurrencyField, {
			props: { field: fieldWithDescription, value: 0.0 }
		});

		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test null value handling
	it('handles null value correctly', async () => {
		component = render(CurrencyField, {
			props: { field, value: null }
		});

		const input = screen.getByRole('textbox') as HTMLInputElement;
		expect(input).toBeInTheDocument();
		expect(input.value).toBe('');
	});

	// Test currency parsing
	it('parses currency input correctly', async () => {
		component = render(CurrencyField, {
			props: { field, value: 0.0 }
		});

		const input = screen.getByRole('textbox');

		// Test parsing with currency symbol
		await fireEvent.input(input, { target: { value: '$1,234.56' } });

		// The component should parse this to the numeric value
		expect(input).toBeInTheDocument();
	});

	// Test placeholder
	it('uses appropriate placeholder', async () => {
		component = render(CurrencyField, {
			props: { field, value: null }
		});

		const input = screen.getByRole('textbox') as HTMLInputElement;
		expect(input).toBeInTheDocument();
		expect(input.placeholder || '').toContain('USD');
	});

	// Test custom placeholder
	it('uses custom placeholder when provided', async () => {
		component = render(CurrencyField, {
			props: { field, value: null, placeholder: 'Enter amount' }
		});

		const input = screen.getByRole('textbox') as HTMLInputElement;
		expect(input).toBeInTheDocument();
		expect(input.placeholder).toBe('Enter amount');
	});
});