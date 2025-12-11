import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import TextField from '../TextField.svelte';
import { createMockField, mockFields } from './fixtures/mockFields';

describe('TextField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = mockFields.text;
	});

	// P3-007-T16: TextField renders TextArea component
	it('renders TextArea component', async () => {
		component = render(TextField, {
			props: { field, value: 'Test text content' }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeInTheDocument();
		expect(textarea).toHaveValue('Test text content');
	});

	// P3-007-T16: Value binding works
	it('supports two-way value binding', async () => {
		let testValue = 'Initial text';
		component = render(TextField, {
			props: { field, value: testValue }
		});

		const textarea = screen.getByRole('textbox');
		await fireEvent.input(textarea, { target: { value: 'Updated text content' } });

		expect(textarea).toHaveValue('Updated text content');
	});

	// P3-007-T16: Change event emitted
	it('emits change event on value change', async () => {
		const onchange = vi.fn();

		component = render(TextField, {
			props: { field, value: '', onchange }
		});

		const textarea = screen.getByRole('textbox');
		await fireEvent.input(textarea, { target: { value: 'New text content' } });

		expect(onchange).toHaveBeenCalledWith('New text content');
	});

	// Test disabled state
	it('disables textarea when disabled prop is true', async () => {
		component = render(TextField, {
			props: { field, value: 'Test', disabled: true }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeDisabled();
	});

	// Test readonly state
	it('makes textarea readonly when readonly prop is true', async () => {
		component = render(TextField, {
			props: { field, value: 'Test', readonly: true }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAttribute('readonly');
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({
			fieldtype: 'Long Text',
			required: true
		});

		component = render(TextField, {
			props: { field: requiredField, value: 'Test' }
		});

		const label = screen.getByText('Test Field *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(TextField, {
			props: { field, value: 'Test', error: 'This field is required' }
		});

		const errorMessage = screen.getByText('This field is required');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test rows property
	it('respects rows property', async () => {
		component = render(TextField, {
			props: { field, value: 'Test', rows: 6 }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAttribute('rows', '6');
	});

	// Test cols property
	it('respects cols property', async () => {
		component = render(TextField, {
			props: { field, value: 'Test', cols: 80 }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAttribute('cols', '80');
	});

	// Test placeholder
	it('displays placeholder text', async () => {
		component = render(TextField, {
			props: { field, value: '', placeholder: 'Enter your text here...' }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAttribute('placeholder', 'Enter your text here...');
	});

	// Test maxLength
	it('respects maxLength property', async () => {
		component = render(TextField, {
			props: { field, value: 'Test', maxLength: 100 }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAttribute('maxlength', '100');
	});

	// Test character count display
	it('shows character count when showCharCount is true', async () => {
		component = render(TextField, {
			props: { field, value: 'Hello world', showCharCount: true }
		});

		const charCount = screen.getByText('11 characters');
		expect(charCount).toBeInTheDocument();
	});

	// Test character count with maxLength
	it('shows character count with maxLength when showCharCount is true', async () => {
		component = render(TextField, {
			props: { field, value: 'Hello', maxLength: 10, showCharCount: true }
		});

		const charCount = screen.getByText('5/10');
		expect(charCount).toBeInTheDocument();
	});

	// Test character count exceeded
	it('shows exceeded message when maxLength is exceeded', async () => {
		component = render(TextField, {
			props: { field, value: 'This text is too long', maxLength: 10, showCharCount: true }
		});

		const exceededMessage = screen.getByText('Character limit exceeded');
		expect(exceededMessage).toBeInTheDocument();

		const charCount = screen.getByText('22/10 (Character limit exceeded)');
		expect(charCount).toBeInTheDocument();
	});

	// Test field label
	it('uses field label for display', async () => {
		const labeledField = createMockField({
			fieldtype: 'Long Text',
			label: 'Custom Text Field'
		});

		component = render(TextField, {
			props: { field: labeledField, value: 'Test' }
		});

		const label = screen.getByText('Custom Text Field');
		expect(label).toBeInTheDocument();
	});

	// Test hide label
	it('hides label when hideLabel is true', async () => {
		component = render(TextField, {
			props: { field, value: 'Test', hideLabel: true }
		});

		const label = screen.queryByText('Test Field');
		expect(label).not.toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({
			fieldtype: 'Long Text',
			description: 'This is a text field'
		});

		component = render(TextField, {
			props: { field: fieldWithDescription, value: 'Test' }
		});

		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test empty value handling
	it('handles empty value correctly', async () => {
		component = render(TextField, {
			props: { field, value: '' }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveValue('');
	});

	// Test null value handling
	it('handles null value correctly', async () => {
		component = render(TextField, {
			props: { field, value: null as any }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveValue('');
	});

	// Test multi-line content
	it('handles multi-line content correctly', async () => {
		const multiLineText = 'Line 1\nLine 2\nLine 3';
		component = render(TextField, {
			props: { field, value: multiLineText }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveValue(multiLineText);
	});

	// Test blur event
	it('emits blur event when textarea loses focus', async () => {
		const onblur = vi.fn();

		component = render(TextField, {
			props: { field, value: 'Test', onblur }
		});

		const textarea = screen.getByRole('textbox');
		await fireEvent.blur(textarea);

		expect(onblur).toHaveBeenCalled();
	});

	// Test focus event
	it('emits focus event when textarea gains focus', async () => {
		const onfocus = vi.fn();

		component = render(TextField, {
			props: { field, value: 'Test', onfocus }
		});

		const textarea = screen.getByRole('textbox');
		await fireEvent.focus(textarea);

		expect(onfocus).toHaveBeenCalled();
	});

	// Test field read_only from field definition
	it('disables textarea when field.read_only is true', async () => {
		const readOnlyField = createMockField({
			fieldtype: 'Long Text',
			read_only: true
		});

		component = render(TextField, {
			props: { field: readOnlyField, value: 'Test' }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeDisabled();
	});

	// Test validation with required field
	it('validates required field correctly', async () => {
		const requiredField = createMockField({
			fieldtype: 'Long Text',
			required: true
		});

		component = render(TextField, {
			props: { field: requiredField, value: '', error: 'This field is required' }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeInvalid();

		const errorMessage = screen.getByText('This field is required');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test validation with maxLength exceeded
	it('validates maxLength correctly', async () => {
		component = render(TextField, {
			props: { field, value: 'This text is too long', maxLength: 10 }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeInvalid();
	});
});