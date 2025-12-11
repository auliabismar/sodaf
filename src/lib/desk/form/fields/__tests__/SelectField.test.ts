import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import SelectField from '../SelectField.svelte';
import { createMockField, mockFields } from './fixtures/mockFields';

describe('SelectField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = mockFields.select;
	});

	// P3-007-T7: SelectField renders Select component
	it('renders Select component', async () => {
		component = render(SelectField, {
			props: { field, value: 'Option 1' }
		});

		const select = screen.getByRole('combobox');
		expect(select).toBeInTheDocument();
	});

	// P3-007-T7: Options from field.options
	it('renders options from field.options', async () => {
		component = render(SelectField, {
			props: { field, value: '' }
		});

		const select = screen.getByRole('combobox');
		expect(select).toBeInTheDocument();

		// Check that options are rendered
		await fireEvent.click(select);

		const option1 = await screen.findByText('Option 1');
		const option2 = await screen.findByText('Option 2');
		const option3 = await screen.findByText('Option 3');

		expect(option1).toBeInTheDocument();
		expect(option2).toBeInTheDocument();
		expect(option3).toBeInTheDocument();
	});

	// P3-007-T7: Change event emitted
	it('emits change event on selection', async () => {
		const onchange = vi.fn();

		component = render(SelectField, {
			props: { field, value: '', onchange }
		});

		const select = screen.getByRole('combobox');
		await fireEvent.change(select, { target: { value: 'Option 2' } });

		expect(onchange).toHaveBeenCalledWith('Option 2');
	});

	// P3-007-T7: Search/filter functionality
	it('renders ComboBox when searchable is true', async () => {
		component = render(SelectField, {
			props: { field, value: '', searchable: true }
		});

		// ComboBox renders as an input with combobox role
		const combobox = screen.getByRole('combobox');
		expect(combobox).toBeInTheDocument();
		expect(combobox).toHaveAttribute('type', 'text');
	});

	// Test search functionality
	it('filters options when typing in searchable mode', async () => {
		component = render(SelectField, {
			props: { field, value: '', searchable: true }
		});

		const combobox = screen.getByRole('combobox');
		await fireEvent.input(combobox, { target: { value: 'Option 2' } });

		// Wait for filtered options to update
		await waitFor(() => {
			const option2 = screen.getByText('Option 2');
			expect(option2).toBeInTheDocument();
		});

		// Option 1 and 3 should not be visible
		expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
		expect(screen.queryByText('Option 3')).not.toBeInTheDocument();
	});

	// P3-007-T7: Placeholder support
	it('uses custom placeholder when provided', async () => {
		component = render(SelectField, {
			props: { field, value: '', placeholder: 'Choose an option' }
		});

		const select = screen.getByRole('combobox');
		expect(select).toBeInTheDocument();

		// Check placeholder text
		expect(select).toHaveAttribute('placeholder', 'Choose an option');
	});

	// Test default placeholder for required field
	it('uses default placeholder for required field', async () => {
		const requiredField = createMockField({
			fieldtype: 'Select',
			required: true,
			label: 'Priority',
			options: 'High\nMedium\nLow'
		});

		component = render(SelectField, {
			props: { field: requiredField, value: '' }
		});

		const select = screen.getByRole('combobox');
		expect(select).toHaveAttribute('placeholder', 'Select Priority');
	});

	// Test default placeholder for optional field
	it('uses default placeholder for optional field', async () => {
		const optionalField = createMockField({
			fieldtype: 'Select',
			required: false,
			label: 'Category',
			options: 'A\nB\nC'
		});

		component = render(SelectField, {
			props: { field: optionalField, value: '' }
		});

		const select = screen.getByRole('combobox');
		expect(select).toHaveAttribute('placeholder', 'Select Category (optional)');
	});

	// Test disabled state
	it('disables select when disabled prop is true', async () => {
		component = render(SelectField, {
			props: { field, value: '', disabled: true }
		});

		const select = screen.getByRole('combobox');
		expect(select).toBeDisabled();
	});

	// Test readonly state
	it('disables select when readonly prop is true', async () => {
		component = render(SelectField, {
			props: { field, value: '', readonly: true }
		});

		const select = screen.getByRole('combobox');
		expect(select).toBeDisabled();
	});

	// Test field read_only
	it('disables select when field.read_only is true', async () => {
		const readOnlyField = createMockField({
			fieldtype: 'Select',
			read_only: true,
			options: 'A\nB\nC'
		});

		component = render(SelectField, {
			props: { field: readOnlyField, value: '' }
		});

		const select = screen.getByRole('combobox');
		expect(select).toBeDisabled();
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({
			fieldtype: 'Select',
			required: true,
			options: 'A\nB\nC'
		});

		component = render(SelectField, {
			props: { field: requiredField, value: '' }
		});

		const requiredIndicator = screen.getByText('*');
		expect(requiredIndicator).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(SelectField, {
			props: { field, value: '', error: 'This field is required' }
		});

		const errorMessage = screen.getByText('This field is required');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test field label
	it('uses field label for display', async () => {
		const labeledField = createMockField({
			fieldtype: 'Select',
			label: 'Custom Select Field',
			options: 'A\nB\nC'
		});

		component = render(SelectField, {
			props: { field: labeledField, value: '' }
		});

		const label = screen.getByText('Custom Select Field');
		expect(label).toBeInTheDocument();
	});

	// Test hide label
	it('hides label when hideLabel is true', async () => {
		component = render(SelectField, {
			props: { field, value: '', hideLabel: true }
		});

		const label = screen.queryByText('Select Field');
		expect(label).not.toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({
			fieldtype: 'Select',
			description: 'This is a select field',
			options: 'A\nB\nC'
		});

		component = render(SelectField, {
			props: { field: fieldWithDescription, value: '' }
		});

		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test value binding
	it('binds value correctly', async () => {
		component = render(SelectField, {
			props: { field, value: 'Option 2' }
		});

		const select = screen.getByRole('combobox');
		expect(select).toBeInTheDocument();
		// Note: Carbon Select doesn't expose the selected value in a simple way
		// This test mainly ensures the component renders without error
	});

	// Test empty options
	it('handles empty options gracefully', async () => {
		const fieldWithEmptyOptions = createMockField({
			fieldtype: 'Select',
			options: ''
		});

		component = render(SelectField, {
			props: { field: fieldWithEmptyOptions, value: '' }
		});

		const select = screen.getByRole('combobox');
		expect(select).toBeInTheDocument();
	});

	// Test null options
	it('handles null options gracefully', async () => {
		const fieldWithNullOptions = createMockField({
			fieldtype: 'Select',
			options: undefined
		});

		component = render(SelectField, {
			props: { field: fieldWithNullOptions, value: '' }
		});

		const select = screen.getByRole('combobox');
		expect(select).toBeInTheDocument();
	});

	// Test blur event
	it('emits blur event', async () => {
		const onblur = vi.fn();

		component = render(SelectField, {
			props: { field, value: '', onblur }
		});

		const select = screen.getByRole('combobox');
		await fireEvent.blur(select);

		expect(onblur).toHaveBeenCalled();
	});

	// Test focus event
	it('emits focus event', async () => {
		const onfocus = vi.fn();

		component = render(SelectField, {
			props: { field, value: '', onfocus }
		});

		const select = screen.getByRole('combobox');
		await fireEvent.focus(select);

		expect(onfocus).toHaveBeenCalled();
	});

	// Test searchable selection
	it('emits change event when selecting from searchable dropdown', async () => {
		const onchange = vi.fn();

		component = render(SelectField, {
			props: { field, value: '', searchable: true, onchange }
		});

		const combobox = screen.getByRole('combobox');
		await fireEvent.click(combobox);

		// Wait for options to appear
		await screen.findByText('Option 2');

		// Simulate filtering input first (already done above)
		// Try selecting via Enter key which ComboBox usually supports
		await fireEvent.keyDown(combobox, { key: 'ArrowDown' });
		await fireEvent.keyDown(combobox, { key: 'Enter' });

		await waitFor(() => {
			expect(onchange).toHaveBeenCalledWith('Option 2');
		});
	});

	// Test options with empty lines
	it('filters out empty lines from options', async () => {
		const fieldWithEmptyLines = createMockField({
			fieldtype: 'Select',
			options: 'Option 1\n\nOption 2\n\nOption 3\n'
		});

		component = render(SelectField, {
			props: { field: fieldWithEmptyLines, value: '' }
		});

		const select = screen.getByRole('combobox');
		await fireEvent.click(select);

		// Should only show 3 options, not the empty lines
		const option1 = await screen.findByText('Option 1');
		const option2 = await screen.findByText('Option 2');
		const option3 = await screen.findByText('Option 3');

		expect(option1).toBeInTheDocument();
		expect(option2).toBeInTheDocument();
		expect(option3).toBeInTheDocument();
	});
});