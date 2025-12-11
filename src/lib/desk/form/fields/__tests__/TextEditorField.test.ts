import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import TextEditorField from '../TextEditorField.svelte';
import { createMockField } from './fixtures/mockFields';


let mockEditorOptions: any;

// Mock TipTap Editor
vi.mock('@tiptap/core', () => {
	return {
		Editor: vi.fn().mockImplementation((options) => {
			mockEditorOptions = options;
			return {
				chain: vi.fn().mockReturnValue({
					focus: vi.fn().mockReturnValue({
						toggleBold: vi.fn().mockReturnValue({ run: vi.fn() }),
						toggleItalic: vi.fn().mockReturnValue({ run: vi.fn() }),
						toggleUnderline: vi.fn().mockReturnValue({ run: vi.fn() }),
						toggleHeading: vi.fn().mockReturnValue({ run: vi.fn() }),
						toggleBulletList: vi.fn().mockReturnValue({ run: vi.fn() }),
						toggleOrderedList: vi.fn().mockReturnValue({ run: vi.fn() }),
						toggleCode: vi.fn().mockReturnValue({ run: vi.fn() }),
						toggleBlockquote: vi.fn().mockReturnValue({ run: vi.fn() }),
						setLink: vi.fn().mockReturnValue({ run: vi.fn() }),
						unsetLink: vi.fn().mockReturnValue({ run: vi.fn() }),
						setImage: vi.fn().mockReturnValue({ run: vi.fn() })
					})
				}),
				getHTML: vi.fn().mockReturnValue('<p>Initial content</p>'),
				getText: vi.fn().mockReturnValue('Initial content'),
				commands: {
					setContent: vi.fn()
				},
				setEditable: vi.fn(),
				destroy: vi.fn(),
				on: vi.fn(),
				off: vi.fn(),
				isActive: vi.fn().mockReturnValue(false)
			};
		})
	};
});

describe('TextEditorField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = createMockField({ fieldtype: 'Text Editor' });
		vi.clearAllMocks();
	});

	// P3-007-T17: TextEditorField renders TipTap editor
	it('renders TipTap editor component', async () => {
		component = render(TextEditorField, {
			props: { field, value: '<p>Test content</p>' }
		});

		const editorContainer = screen.getByRole('textbox');
		expect(editorContainer).toBeInTheDocument();
		expect(editorContainer).toHaveAttribute('aria-label', 'Test Field');
	});

	// Test toolbar buttons
	it('renders toolbar with formatting buttons', async () => {
		component = render(TextEditorField, {
			props: {
				field,
				value: '<p>Test content</p>',
				toolbar: ['bold', 'italic', 'underline', 'heading1']
			}
		});

		// Check for toolbar buttons
		const boldButton = screen.getByLabelText('Bold');
		const italicButton = screen.getByLabelText('Italic');
		const underlineButton = screen.getByLabelText('Underline');
		const headingButton = screen.getByLabelText('Heading 1');

		expect(boldButton).toBeInTheDocument();
		expect(italicButton).toBeInTheDocument();
		expect(underlineButton).toBeInTheDocument();
		expect(headingButton).toBeInTheDocument();
	});

	// Test value binding
	it('supports two-way value binding', async () => {
		let testValue = '<p>Initial content</p>';
		component = render(TextEditorField, {
			props: { field, value: testValue }
		});

		const editorContainer = screen.getByRole('textbox');
		expect(editorContainer).toBeInTheDocument();
	});

	// Test change event
	it('emits change event on content change', async () => {
		const onchange = vi.fn();

		component = render(TextEditorField, {
			props: { field, value: '<p>Initial content</p>', onchange }
		});

		// Get the Editor mock constructor arguments
		const MockEditor = vi.mocked(Editor);
		// The mock might have been cleared, so we grab the call from this test run
		// Since we render inside the test, the constructor is called here.
		const constructorOptions = MockEditor.mock.calls[0][0];

		if (!constructorOptions) {
			throw new Error('Editor constructor was not called');
		}

		if (!constructorOptions?.onUpdate) {
			throw new Error('Editor onUpdate callback was not provided');
		}

		// Simulate update via the onUpdate callback passed to Tiptap
		// We need to provide a mock editor instance with getHTML
		constructorOptions.onUpdate({
			editor: {
				getHTML: () => '<p>New content</p>',
				getText: () => 'New content'
			}
		} as any);

		// Verify onchange was called (now immediate, but waitFor is safe)
		await waitFor(() => {
			expect(onchange).toHaveBeenCalledWith('<p>New content</p>');
		});
	});

	// Test disabled state
	it('disables editor when disabled prop is true', async () => {
		component = render(TextEditorField, {
			props: { field, value: '<p>Test content</p>', disabled: true }
		});

		const editorContainer = screen.getByRole('textbox');
		expect(editorContainer).toHaveAttribute('aria-disabled', 'true');
	});

	// Test readonly state
	it('makes editor readonly when readonly prop is true', async () => {
		component = render(TextEditorField, {
			props: { field, value: '<p>Test content</p>', readonly: true }
		});

		const editorContainer = screen.getByRole('textbox');
		expect(editorContainer).toHaveAttribute('aria-readonly', 'true');
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({
			fieldtype: 'Text Editor',
			required: true
		});

		component = render(TextEditorField, {
			props: { field: requiredField, value: '<p>Test content</p>' }
		});

		const label = screen.getByText('Test Field *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(TextEditorField, {
			props: { field, value: '<p>Test content</p>', error: 'This field is required' }
		});

		const errorMessage = screen.getByText('This field is required');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test placeholder
	it('uses placeholder when provided', async () => {
		component = render(TextEditorField, {
			props: { field, value: '', placeholder: 'Enter rich text here' }
		});

		const editorContainer = screen.getByRole('textbox');
		expect(editorContainer).toHaveAttribute('placeholder', 'Enter rich text here');
	});

	// Test max length
	it('respects maxLength property', async () => {
		component = render(TextEditorField, {
			props: { field, value: '<p>Test content</p>', maxLength: 100 }
		});

		const characterCount = screen.getByText(/\/ 100/);
		expect(characterCount).toBeInTheDocument();
	});

	// Test field label
	it('uses field label when no placeholder provided', async () => {
		const labeledField = createMockField({
			fieldtype: 'Text Editor',
			label: 'Custom Label'
		});

		component = render(TextEditorField, {
			props: { field: labeledField, value: '' }
		});

		const label = screen.getByText('Custom Label');
		expect(label).toBeInTheDocument();
	});

	// Test hide label
	it('hides label when hideLabel is true', async () => {
		component = render(TextEditorField, {
			props: { field, value: '', hideLabel: true }
		});

		const label = screen.queryByText('Test Field');
		expect(label).not.toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({
			fieldtype: 'Text Editor',
			description: 'This is a rich text editor'
		});

		component = render(TextEditorField, {
			props: { field: fieldWithDescription, value: '' }
		});

		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test toolbar customization
	it('respects toolbar customization', async () => {
		component = render(TextEditorField, {
			props: {
				field,
				value: '<p>Test content</p>',
				toolbar: ['bold', 'italic', 'link']
			}
		});

		const boldButton = screen.getByLabelText('Bold');
		const italicButton = screen.getByLabelText('Italic');
		const linkButton = screen.getByLabelText('Link');

		expect(boldButton).toBeInTheDocument();
		expect(italicButton).toBeInTheDocument();
		expect(linkButton).toBeInTheDocument();

		// Should not have buttons not in toolbar
		const underlineButton = screen.queryByLabelText('Underline');
		expect(underlineButton).not.toBeInTheDocument();
	});

	// Test focus and blur events
	it('emits focus and blur events', async () => {
		const onfocus = vi.fn();
		const onblur = vi.fn();

		component = render(TextEditorField, {
			props: { field, value: '<p>Test content</p>', onfocus, onblur }
		});

		const editorContainer = screen.getByRole('textbox');

		// Simulate focus
		await fireEvent.focus(editorContainer);
		expect(onfocus).toHaveBeenCalled();

		// Simulate blur
		await fireEvent.blur(editorContainer);
		expect(onblur).toHaveBeenCalled();
	});

	// Test link dialog
	it('opens link dialog when link button is clicked', async () => {
		component = render(TextEditorField, {
			props: {
				field,
				value: '<p>Test content</p>',
				toolbar: ['link']
			}
		});

		const linkButton = screen.getByLabelText('Link');
		await fireEvent.click(linkButton);

		// Check if link dialog appears
		const dialogTitle = screen.getByText('Add Link');
		expect(dialogTitle).toBeInTheDocument();

		const urlInput = screen.getByPlaceholderText('https://example.com');
		expect(urlInput).toBeInTheDocument();
	});

	// Test image dialog
	it('opens image dialog when image button is clicked', async () => {
		component = render(TextEditorField, {
			props: {
				field,
				value: '<p>Test content</p>',
				toolbar: ['image']
			}
		});

		const imageButton = screen.getByLabelText('Image');
		await fireEvent.click(imageButton);

		// Check if image dialog appears
		const dialogTitle = screen.getByText('Add Image');
		expect(dialogTitle).toBeInTheDocument();

		const urlInput = screen.getByPlaceholderText('https://example.com/image.jpg');
		expect(urlInput).toBeInTheDocument();
	});

	// Test empty state
	it('handles empty value correctly', async () => {
		component = render(TextEditorField, {
			props: { field, value: '' }
		});

		const editorContainer = screen.getByRole('textbox');
		expect(editorContainer).toBeInTheDocument();
		expect(editorContainer).toHaveAttribute('placeholder', 'Test Field');
	});
});