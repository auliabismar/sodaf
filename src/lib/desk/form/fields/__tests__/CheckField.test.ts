import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CheckField from '../CheckField.svelte';
import { createMockField, mockFields } from './fixtures/mockFields';

describe('CheckField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = mockFields.check;
	});

	// P3-007-T6: CheckField renders Checkbox
	it('renders Checkbox component', async () => {
		component = render(CheckField, {
			props: { field, value: true }
		});

		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).toBeInTheDocument();
		expect(checkbox).toBeChecked();
	});

	// Test unchecked state
	it('renders unchecked checkbox when value is false', async () => {
		component = render(CheckField, {
			props: { field, value: false }
		});

		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).toBeInTheDocument();
		expect(checkbox).not.toBeChecked();
	});

	// P3-007-T6: Toggle functionality
	it('toggles checkbox value when clicked', async () => {
		let testValue = false;
		component = render(CheckField, {
			props: { field, value: testValue }
		});

		const checkbox = screen.getByRole('checkbox');
		await fireEvent.click(checkbox);

		expect(checkbox).toBeChecked();
	});

	// P3-007-T6: Change event emitted
	it('emits change event on toggle', async () => {
		const onchange = vi.fn();

		component = render(CheckField, {
			props: { field, value: false, onchange }
		});

		const checkbox = screen.getByRole('checkbox');
		await fireEvent.click(checkbox);

		expect(onchange).toHaveBeenCalledWith(true);
	});

	// Test disabled state
	it('disables checkbox when disabled prop is true', async () => {
		component = render(CheckField, {
			props: { field, value: false, disabled: true }
		});

		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).toBeDisabled();
	});

	// Test readonly state
	it('disables checkbox when readonly prop is true', async () => {
		component = render(CheckField, {
			props: { field, value: false, readonly: true }
		});

		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).toBeDisabled();
	});

	// Test field read_only
	it('disables checkbox when field.read_only is true', async () => {
		const readOnlyField = createMockField({
			fieldtype: 'Check',
			read_only: true
		});

		component = render(CheckField, {
			props: { field: readOnlyField, value: false }
		});

		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).toBeDisabled();
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({
			fieldtype: 'Check',
			required: true
		});

		component = render(CheckField, {
			props: { field: requiredField, value: false }
		});

		const requiredIndicator = screen.getByText('*');
		expect(requiredIndicator).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(CheckField, {
			props: { field, value: false, error: 'This field is required' }
		});

		const errorMessage = screen.getByText('This field is required');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test field label
	it('uses field label for display', async () => {
		const labeledField = createMockField({
			fieldtype: 'Check',
			label: 'Custom Checkbox Field'
		});

		component = render(CheckField, {
			props: { field: labeledField, value: false }
		});

		const label = screen.getByText('Custom Checkbox Field');
		expect(label).toBeInTheDocument();
	});

	// Test hide label
	it('hides label when hideLabel is true', async () => {
		component = render(CheckField, {
			props: { field, value: false, hideLabel: true }
		});

		const label = screen.queryByText('Check Field');
		expect(label).not.toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({
			fieldtype: 'Check',
			description: 'This is a checkbox field'
		});

		component = render(CheckField, {
			props: { field: fieldWithDescription, value: false }
		});

		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test keyboard interaction - Enter key
	it('toggles checkbox when Enter key is pressed', async () => {
		const onchange = vi.fn();

		component = render(CheckField, {
			props: { field, value: false, onchange }
		});

		const container = screen.getByRole('checkbox');
		container.focus();
		await fireEvent.keyDown(container, { key: 'Enter' });

		expect(onchange).toHaveBeenCalledWith(true);
	});

	// Test keyboard interaction - Space key
	it('toggles checkbox when Space key is pressed', async () => {
		const onchange = vi.fn();

		component = render(CheckField, {
			props: { field, value: false, onchange }
		});

		const container = screen.getByRole('checkbox');
		container.focus();
		await fireEvent.keyDown(container, { key: ' ' });

		expect(onchange).toHaveBeenCalledWith(true);
	});

	// Test keyboard interaction with disabled state
	it('does not toggle when keyboard is used on disabled checkbox', async () => {
		const onchange = vi.fn();

		component = render(CheckField, {
			props: { field, value: false, disabled: true, onchange }
		});

		const container = screen.getByRole('checkbox');
		await fireEvent.keyDown(container, { key: 'Enter' });

		expect(onchange).not.toHaveBeenCalled();
	});

	// Test ARIA attributes
	it('sets correct ARIA attributes', async () => {
		component = render(CheckField, {
			props: { field, value: true, required: true }
		});

		const container = screen.getByRole('checkbox');
		expect(container).toHaveAttribute('aria-checked', 'true');
		expect(container).toHaveAttribute('aria-required', 'true');
		expect(container).toHaveAttribute('aria-disabled', 'false');
	});

	// Test ARIA attributes for disabled state
	it('sets correct ARIA attributes for disabled state', async () => {
		component = render(CheckField, {
			props: { field, value: false, disabled: true }
		});

		const container = screen.getByRole('checkbox');
		expect(container).toHaveAttribute('aria-checked', 'false');
		expect(container).toHaveAttribute('aria-disabled', 'true');
		expect(container).toHaveAttribute('tabindex', '-1');
	});

	// Test blur event
	it('emits blur event', async () => {
		const onblur = vi.fn();

		component = render(CheckField, {
			props: { field, value: false, onblur }
		});

		const checkbox = screen.getByRole('checkbox');
		await fireEvent.blur(checkbox);

		expect(onblur).toHaveBeenCalled();
	});

	// Test focus event
	it('emits focus event', async () => {
		const onfocus = vi.fn();

		component = render(CheckField, {
			props: { field, value: false, onfocus }
		});

		const checkbox = screen.getByRole('checkbox');
		await fireEvent.focus(checkbox);

		expect(onfocus).toHaveBeenCalled();
	});

	// Test boolean value handling
	it('handles boolean values correctly', async () => {
		component = render(CheckField, {
			props: { field, value: true }
		});

		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).toBeChecked();

		// Toggle to false
		await fireEvent.click(checkbox);
		expect(checkbox).not.toBeChecked();

		// Toggle back to true
		await fireEvent.click(checkbox);
		expect(checkbox).toBeChecked();
	});

	// Test container click handling
	it('toggles checkbox when container is clicked', async () => {
		const onchange = vi.fn();

		component = render(CheckField, {
			props: { field, value: false, onchange }
		});

		const container = screen.getByRole('checkbox');
		await fireEvent.click(container);

		expect(onchange).toHaveBeenCalledWith(true);
	});
});