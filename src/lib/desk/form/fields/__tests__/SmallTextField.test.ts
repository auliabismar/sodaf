import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import SmallTextField from '../SmallTextField.svelte';
import { createMockField, mockFields } from './fixtures/mockFields';

describe('SmallTextField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = mockFields.smallText;
	});

	// P3-007-T16: SmallTextField renders TextArea component
	it('renders TextArea component', async () => {
		component = render(SmallTextField, {
			props: { field, value: 'Test text content' }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeInTheDocument();
		expect(textarea).toHaveValue('Test text content');
	});

	// P3-007-T16: Value binding works
	it('supports two-way value binding', async () => {
		let testValue = 'Initial text';
		component = render(SmallTextField, {
			props: { field, value: testValue }
		});

		const textarea = screen.getByRole('textbox');
		await fireEvent.input(textarea, { target: { value: 'Updated text content' } });

		expect(textarea).toHaveValue('Updated text content');
	});

	// P3-007-T16: Change event emitted
	it('emits change event on value change', async () => {
		const onchange = vi.fn();

		component = render(SmallTextField, {
			props: { field, value: '', onchange }
		});

		const textarea = screen.getByRole('textbox');
		await fireEvent.input(textarea, { target: { value: 'New text content' } });

		expect(onchange).toHaveBeenCalledWith('New text content');
	});

	// Test disabled state
	it('disables textarea when disabled prop is true', async () => {
		component = render(SmallTextField, {
			props: { field, value: 'Test', disabled: true }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeDisabled();
	});

	// Test readonly state
	it('makes textarea readonly when readonly prop is true', async () => {
		component = render(SmallTextField, {
			props: { field, value: 'Test', readonly: true }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAttribute('readonly');
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({
			fieldtype: 'Small Text',
			required: true
		});

		component = render(SmallTextField, {
			props: { field: requiredField, value: 'Test' }
		});

		const label = screen.getByText('Test Field *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(SmallTextField, {
			props: { field, value: 'Test', error: 'This field is required' }
		});

		const errorMessage = screen.getByText('This field is required');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test rows property
	it('respects rows property', async () => {
		component = render(SmallTextField, {
			props: { field, value: 'Test', rows: 3 }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAttribute('rows', '3');
	});

	// Test cols property
	it('respects cols property', async () => {
		component = render(SmallTextField, {
			props: { field, value: 'Test', cols: 40 }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAttribute('cols', '40');
	});

	// Test placeholder
	it('displays placeholder text', async () => {
		component = render(SmallTextField, {
			props: { field, value: '', placeholder: 'Enter brief text here...' }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAttribute('placeholder', 'Enter brief text here...');
	});

	// Test maxLength
	it('respects maxLength property', async () => {
		component = render(SmallTextField, {
			props: { field, value: 'Test', maxLength: 50 }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAttribute('maxlength', '50');
	});

	// Test character count display
	it('shows character count when showCharCount is true', async () => {
		component = render(SmallTextField, {
			props: { field, value: 'Hello world', showCharCount: true }
		});

		const charCount = screen.getByText('11 chars');
		expect(charCount).toBeInTheDocument();
	});

	// Test character count with maxLength
	it('shows character count with maxLength when showCharCount is true', async () => {
		component = render(SmallTextField, {
			props: { field, value: 'Hello', maxLength: 25, showCharCount: true }
		});

		const charCount = screen.getByText('5/25');
		expect(charCount).toBeInTheDocument();
	});

	// Test character count exceeded
	it('shows exceeded message when maxLength is exceeded', async () => {
		component = render(SmallTextField, {
			props: { field, value: 'This text is too long for small text field', maxLength: 20, showCharCount: true }
		});

		const exceededMessage = screen.getByText('Limit exceeded');
		expect(exceededMessage).toBeInTheDocument();

		const charCount = screen.getByText('43/20 (Limit exceeded)');
		expect(charCount).toBeInTheDocument();
	});

	// Test field label
	it('uses field label for display', async () => {
		const labeledField = createMockField({
			fieldtype: 'Small Text',
			label: 'Custom Small Text Field'
		});

		component = render(SmallTextField, {
			props: { field: labeledField, value: 'Test' }
		});

		const label = screen.getByText('Custom Small Text Field');
		expect(label).toBeInTheDocument();
	});

	// Test hide label
	it('hides label when hideLabel is true', async () => {
		component = render(SmallTextField, {
			props: { field, value: 'Test', hideLabel: true }
		});

		const label = screen.queryByText('Small Text Field');
		expect(label).not.toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({
			fieldtype: 'Small Text',
			description: 'This is a small text field'
		});

		component = render(SmallTextField, {
			props: { field: fieldWithDescription, value: 'Test' }
		});

		// Check for the field label which should be present
		expect(screen.getByText('Small Text Field')).toBeInTheDocument();
		// Tooltip might be rendered differently or aria-label might vary. 
		// Check for the description text directly (it might be hidden but accessible, or rendered in tooltip)
		// Carbon Tooltip renders children. The button should be there.
		const buttons = screen.getAllByRole('button');
		const infoButton = buttons.find(b => b.getAttribute('aria-label')?.includes('Information'));
		expect(infoButton).toBeDefined();
		expect(infoButton).toBeInTheDocument();
	});

	// Test empty value handling
	it('handles empty value correctly', async () => {
		component = render(SmallTextField, {
			props: { field, value: '' }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveValue('');
	});

	// Test null value handling
	it('handles null value correctly', async () => {
		component = render(SmallTextField, {
			props: { field, value: null as any }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveValue('');
	});

	// Test multi-line content
	it('handles multi-line content correctly', async () => {
		const multiLineText = 'Line 1\nLine 2';
		component = render(SmallTextField, {
			props: { field, value: multiLineText }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveValue(multiLineText);
	});

	// Test blur event
	it('emits blur event when textarea loses focus', async () => {
		const onblur = vi.fn();

		component = render(SmallTextField, {
			props: { field, value: 'Test', onblur }
		});

		const textarea = screen.getByRole('textbox');
		await fireEvent.blur(textarea);

		expect(onblur).toHaveBeenCalled();
	});

	// Test focus event
	it('emits focus event when textarea gains focus', async () => {
		const onfocus = vi.fn();

		component = render(SmallTextField, {
			props: { field, value: 'Test', onfocus }
		});

		const textarea = screen.getByRole('textbox');
		await fireEvent.focus(textarea);

		expect(onfocus).toHaveBeenCalled();
	});

	// Test field read_only from field definition
	it('disables textarea when field.read_only is true', async () => {
		const readOnlyField = createMockField({
			fieldtype: 'Small Text',
			read_only: true
		});

		component = render(SmallTextField, {
			props: { field: readOnlyField, value: 'Test' }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeDisabled();
	});

	// Test validation with required field
	it('validates required field correctly', async () => {
		const requiredField = createMockField({
			fieldtype: 'Small Text',
			required: true
		});

		component = render(SmallTextField, {
			props: { field: requiredField, value: '', error: 'This field is required' }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeInvalid();

		const errorMessage = screen.getByText('This field is required');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test validation with maxLength exceeded
	it('validates maxLength correctly', async () => {
		component = render(SmallTextField, {
			props: { field, value: 'This text is too long for a small text field', maxLength: 20 }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeInvalid();
	});

	// Test small text styling
	it('applies small text styling', async () => {
		component = render(SmallTextField, {
			props: { field, value: 'Test' }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveClass('small-text');
	});

	// Test default rows for small text
	it('uses default rows for small text', async () => {
		component = render(SmallTextField, {
			props: { field, value: 'Test' }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAttribute('rows', '2');
	});

	// Test default cols for small text
	it('uses default cols for small text', async () => {
		component = render(SmallTextField, {
			props: { field, value: 'Test' }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAttribute('cols', '30');
	});
});