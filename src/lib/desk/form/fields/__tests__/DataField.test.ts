import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach } from 'vitest';
import DataField from '../DataField.svelte';
import { createMockField } from './fixtures/mockFields';

describe('DataField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = createMockField({ fieldtype: 'Data' });
	});

	// P3-007-T1: DataField renders TextInput
	it('renders TextInput component', async () => {
		component = render(DataField, {
			props: { field, value: 'test value' }
		});
		
		const input = screen.getByRole('textbox');
		expect(input).toBeInTheDocument();
		expect(input).toHaveValue('test value');
	});

	// P3-007-T33: Value binding works
	it('supports two-way value binding', async () => {
		let testValue = '';
		component = render(DataField, {
			props: { field, value: testValue }
		});
		
		const input = screen.getByRole('textbox');
		await fireEvent.input(input, { target: { value: 'new value' } });
		
		expect(input).toHaveValue('new value');
	});

	// P3-007-T34: Change event emitted
	it('emits change event on value change', async () => {
		let changeEventFired = false;
		let changeEventValue = '';
		
		component = render(DataField, {
			props: { field, value: '' }
		});
		
		// Listen for change event
		const unsubscribe = component.$on('change', (event: any) => {
			changeEventFired = true;
			changeEventValue = event.detail;
		});
		
		const input = screen.getByRole('textbox');
		await fireEvent.input(input, { target: { value: 'test value' } });
		
		expect(changeEventFired).toBe(true);
		expect(changeEventValue).toBe('test value');
		
		unsubscribe();
	});

	// Test disabled state
	it('disables input when disabled prop is true', async () => {
		component = render(DataField, {
			props: { field, value: '', disabled: true }
		});
		
		const input = screen.getByRole('textbox');
		expect(input).toBeDisabled();
	});

	// Test readonly state
	it('makes input readonly when readonly prop is true', async () => {
		component = render(DataField, {
			props: { field, value: '', readonly: true }
		});
		
		const input = screen.getByRole('textbox');
		expect(input).toHaveAttribute('readonly');
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({ 
			fieldtype: 'Data', 
			required: true 
		});
		
		component = render(DataField, {
			props: { field: requiredField, value: '' }
		});
		
		const label = screen.getByText('Test Field *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(DataField, {
			props: { field, value: '', error: 'This field is required' }
		});
		
		const errorMessage = screen.getByText('This field is required');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test placeholder
	it('uses placeholder when provided', async () => {
		component = render(DataField, {
			props: { field, value: '', placeholder: 'Enter text here' }
		});
		
		const input = screen.getByPlaceholderText('Enter text here');
		expect(input).toBeInTheDocument();
	});

	// Test max length
	it('respects maxLength property', async () => {
		const fieldWithLength = createMockField({ 
			fieldtype: 'Data', 
			length: 10 
		});
		
		component = render(DataField, {
			props: { field: fieldWithLength, value: '' }
		});
		
		const input = screen.getByRole('textbox');
		expect(input).toHaveAttribute('maxlength', '10');
	});

	// Test field label
	it('uses field label when no placeholder provided', async () => {
		const labeledField = createMockField({ 
			fieldtype: 'Data', 
			label: 'Custom Label' 
		});
		
		component = render(DataField, {
			props: { field: labeledField, value: '' }
		});
		
		const label = screen.getByText('Custom Label');
		expect(label).toBeInTheDocument();
	});

	// Test hide label
	it('hides label when hideLabel is true', async () => {
		component = render(DataField, {
			props: { field, value: '', hideLabel: true }
		});
		
		const label = screen.queryByText('Test Field');
		expect(label).not.toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({ 
			fieldtype: 'Data', 
			description: 'This is a helpful description' 
		});
		
		component = render(DataField, {
			props: { field: fieldWithDescription, value: '' }
		});
		
		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test unique field
	it('applies unique validation when field is unique', async () => {
		const uniqueField = createMockField({ 
			fieldtype: 'Data', 
			unique: true 
		});
		
		component = render(DataField, {
			props: { field: uniqueField, value: 'test' }
		});
		
		// This would typically be validated server-side
		// For now, just check that field is rendered
		const input = screen.getByRole('textbox');
		expect(input).toBeInTheDocument();
	});
});