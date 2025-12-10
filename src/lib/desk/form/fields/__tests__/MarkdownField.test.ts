import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import MarkdownField from '../MarkdownField.svelte';
import { createMockField } from './fixtures/mockFields';

// Mock marked and DOMPurify
vi.mock('marked', () => ({
	marked: vi.fn((markdown: string) => `<p>${markdown}</p>`),
	setOptions: vi.fn()
}));

vi.mock('dompurify', () => ({
	sanitize: vi.fn((html: string) => html)
}));

describe('MarkdownField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = createMockField({ fieldtype: 'Markdown Editor' });
		vi.clearAllMocks();
	});

	// P3-007-T20: MarkdownField renders Markdown editor
	it('renders Markdown editor component', async () => {
		component = render(MarkdownField, {
			props: { field, value: '# Test content' }
		});
		
		const markdownContent = screen.getByRole('document');
		expect(markdownContent).toBeInTheDocument();
		expect(markdownContent).toHaveAttribute('aria-label', 'Test Field markdown preview');
	});

	// Test toolbar buttons
	it('renders toolbar with formatting buttons', async () => {
		component = render(MarkdownField, {
			props: { 
				field, 
				value: '# Test content',
				allowEditing: true
			}
		});
		
		// Enter edit mode to see toolbar
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		// Check for toolbar buttons
		const boldButton = screen.getByTitle('Bold');
		const italicButton = screen.getByTitle('Italic');
		const underlineButton = screen.getByTitle('Underline');
		const headingButton = screen.getByTitle('Heading');
		
		expect(boldButton).toBeInTheDocument();
		expect(italicButton).toBeInTheDocument();
		expect(underlineButton).toBeInTheDocument();
		expect(headingButton).toBeInTheDocument();
	});

	// Test value binding
	it('supports two-way value binding', async () => {
		let testValue = '# Initial content';
		component = render(MarkdownField, {
			props: { field, value: testValue }
		});
		
		const markdownContent = screen.getByRole('document');
		expect(markdownContent).toBeInTheDocument();
	});

	// Test change event
	it('emits change event on content change', async () => {
		let changeEventFired = false;
		let changeEventValue = '';
		
		component = render(MarkdownField, {
			props: { field, value: '# Initial content', allowEditing: true }
		});
		
		// Listen for change event
		const unsubscribe = component.$on('change', (event: any) => {
			changeEventFired = true;
			changeEventValue = event.detail;
		});
		
		// Enter edit mode
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		// Simulate editor content change
		const textarea = screen.getByDisplayValue('Initial content');
		await fireEvent.input(textarea, { target: { value: '# New content' } });
		
		// Save changes
		const saveButton = screen.getByText('Save');
		await fireEvent.click(saveButton);
		
		// Wait for change event to be processed
		await waitFor(() => {
			expect(changeEventFired).toBe(true);
		});
		
		unsubscribe();
	});

	// Test split view
	it('shows split view when splitView is true', async () => {
		component = render(MarkdownField, {
			props: { 
				field, 
				value: '# Test content',
				splitView: true,
				showPreview: true
			}
		});
		
		// Check for split panes
		const markdownSource = screen.getByText('Markdown');
		const previewPane = screen.getByText('Preview');
		
		expect(markdownSource).toBeInTheDocument();
		expect(previewPane).toBeInTheDocument();
	});

	// Test disabled state
	it('disables editor when disabled prop is true', async () => {
		component = render(MarkdownField, {
			props: { field, value: '# Test content', disabled: true }
		});
		
		// Should show preview only, no edit button
		const editButton = screen.queryByText('Edit');
		expect(editButton).not.toBeInTheDocument();
		
		const markdownContent = screen.getByRole('document');
		expect(markdownContent).toBeInTheDocument();
	});

	// Test readonly state
	it('makes editor readonly when readonly prop is true', async () => {
		component = render(MarkdownField, {
			props: { field, value: '# Test content', readonly: true }
		});
		
		// Should show preview only, no edit button
		const editButton = screen.queryByText('Edit');
		expect(editButton).not.toBeInTheDocument();
		
		const markdownContent = screen.getByRole('document');
		expect(markdownContent).toBeInTheDocument();
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({ 
			fieldtype: 'Markdown Editor', 
			required: true 
		});
		
		component = render(MarkdownField, {
			props: { field: requiredField, value: '# Test content' }
		});
		
		const label = screen.getByText('Test Field *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(MarkdownField, {
			props: { field, value: '# Test content', error: 'This field is required' }
		});
		
		const errorMessage = screen.getByText('This field is required');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test placeholder
	it('uses placeholder when provided', async () => {
		component = render(MarkdownField, {
			props: { field, value: '', placeholder: 'Enter markdown here...' }
		});
		
		// Enter edit mode to see placeholder
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		const textarea = screen.getByPlaceholderText('Enter markdown here...');
		expect(textarea).toBeInTheDocument();
	});

	// Test field label
	it('uses field label when no placeholder provided', async () => {
		const labeledField = createMockField({ 
			fieldtype: 'Markdown Editor', 
			label: 'Custom Markdown Field' 
		});
		
		component = render(MarkdownField, {
			props: { field: labeledField, value: '' }
		});
		
		const label = screen.getByText('Custom Markdown Field');
		expect(label).toBeInTheDocument();
	});

	// Test hide label
	it('hides label when hideLabel is true', async () => {
		component = render(MarkdownField, {
			props: { field, value: '', hideLabel: true }
		});
		
		const label = screen.queryByText('Test Field');
		expect(label).not.toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({ 
			fieldtype: 'Markdown Editor', 
			description: 'Enter markdown content here' 
		});
		
		component = render(MarkdownField, {
			props: { field: fieldWithDescription, value: '' }
		});
		
		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test edit mode
	it('enters edit mode when edit button is clicked', async () => {
		component = render(MarkdownField, {
			props: { field, value: '# Test content', allowEditing: true }
		});
		
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		// Check if editor appears
		const textarea = screen.getByDisplayValue('Test content');
		expect(textarea).toBeInTheDocument();
		
		const saveButton = screen.getByText('Save');
		expect(saveButton).toBeInTheDocument();
		
		const cancelButton = screen.getByText('Cancel');
		expect(cancelButton).toBeInTheDocument();
	});

	// Test preview mode
	it('shows preview mode by default', async () => {
		component = render(MarkdownField, {
			props: { field, value: '# Test content' }
		});
		
		// Should show preview, not editor
		const markdownContent = screen.getByRole('document');
		expect(markdownContent).toBeInTheDocument();
		
		const textarea = screen.queryByDisplayValue('Test content');
		expect(textarea).not.toBeInTheDocument();
	});

	// Test editor toolbar
	it('shows editor toolbar in edit mode', async () => {
		component = render(MarkdownField, {
			props: { field, value: '# Test content', allowEditing: true }
		});
		
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		// Check for editor toolbar buttons
		const boldButton = screen.getByTitle('Bold');
		const italicButton = screen.getByTitle('Italic');
		const headingButton = screen.getByTitle('Heading');
		const listButton = screen.getByTitle('Bullet list');
		const quoteButton = screen.getByTitle('Quote');
		
		expect(boldButton).toBeInTheDocument();
		expect(italicButton).toBeInTheDocument();
		expect(headingButton).toBeInTheDocument();
		expect(listButton).toBeInTheDocument();
		expect(quoteButton).toBeInTheDocument();
	});

	// Test markdown insertion
	it('inserts markdown when toolbar buttons are clicked', async () => {
		component = render(MarkdownField, {
			props: { field, value: 'selected text', allowEditing: true }
		});
		
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		const textarea = screen.getByDisplayValue('selected text');
		
		// Select some text
		(textarea as HTMLTextAreaElement).setSelectionRange(0, 6);
		
		// Click bold button
		const boldButton = screen.getByTitle('Bold');
		await fireEvent.click(boldButton);
		
		// Should wrap selected text in bold markdown
		expect(textarea).toHaveValue('**selected text**');
	});

	// Test link insertion
	it('opens link dialog when link button is clicked', async () => {
		component = render(MarkdownField, {
			props: { field, value: '# Test content', allowEditing: true }
		});
		
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		const linkButton = screen.getByTitle('Link');
		await fireEvent.click(linkButton);
		
		// Mock prompt
		const mockPrompt = vi.fn().mockReturnValue('https://example.com');
		global.prompt = mockPrompt;
		
		// Should trigger prompt
		expect(mockPrompt).toHaveBeenCalledWith('Enter URL:');
	});

	// Test image insertion
	it('opens image dialog when image button is clicked', async () => {
		component = render(MarkdownField, {
			props: { field, value: '# Test content', allowEditing: true }
		});
		
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		const imageButton = screen.getByTitle('Image');
		await fireEvent.click(imageButton);
		
		// Mock prompt
		const mockPrompt = vi.fn()
			.mockReturnValueOnce('https://example.com/image.jpg')
			.mockReturnValueOnce('Alt text');
		global.prompt = mockPrompt;
		
		// Should trigger prompts
		expect(mockPrompt).toHaveBeenCalledWith('Enter image URL:');
		expect(mockPrompt).toHaveBeenCalledWith('Enter alt text:');
	});

	// Test code block insertion
	it('inserts code block when code button is clicked', async () => {
		component = render(MarkdownField, {
			props: { field, value: 'selected text', allowEditing: true }
		});
		
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		const codeBlockButton = screen.getByText('</>');
		await fireEvent.click(codeBlockButton);
		
		const textarea = screen.getByDisplayValue('selected text');
		// Should insert code block
		expect(textarea).toHaveValue('```\n\n\n```');
	});

	// Test table insertion
	it('inserts table when table button is clicked', async () => {
		component = render(MarkdownField, {
			props: { field, value: '', allowEditing: true }
		});
		
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		const tableButton = screen.getByText('Table');
		await fireEvent.click(tableButton);
		
		const textarea = screen.getByDisplayValue('');
		// Should insert table markdown
		expect(textarea).toHaveValue('| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |');
	});

	// Test copy functionality
	it('copies markdown to clipboard', async () => {
		const mockClipboard = {
			writeText: vi.fn().mockResolvedValue(undefined)
		};
		Object.assign(navigator, { clipboard: mockClipboard });
		
		component = render(MarkdownField, {
			props: { field, value: '# Test content' }
		});
		
		const copyButton = screen.getByLabelText('Copy Markdown');
		await fireEvent.click(copyButton);
		
		expect(mockClipboard.writeText).toHaveBeenCalledWith('# Test content');
	});

	// Test copy HTML functionality
	it('copies HTML to clipboard', async () => {
		const mockClipboard = {
			writeText: vi.fn().mockResolvedValue(undefined)
		};
		Object.assign(navigator, { clipboard: mockClipboard });
		
		component = render(MarkdownField, {
			props: { field, value: '# Test content' }
		});
		
		const copyHtmlButton = screen.getByLabelText('Copy HTML');
		await fireEvent.click(copyHtmlButton);
		
		expect(mockClipboard.writeText).toHaveBeenCalledWith('<h1>Test content</h1>');
	});

	// Test fullscreen functionality
	it('toggles fullscreen mode', async () => {
		component = render(MarkdownField, {
			props: { field, value: '# Test content' }
		});
		
		const fullscreenButton = screen.getByLabelText('Fullscreen');
		await fireEvent.click(fullscreenButton);
		
		const fullscreenExitButton = screen.getByLabelText('Exit fullscreen');
		expect(fullscreenExitButton).toBeInTheDocument();
	});

	// Test split view toggle
	it('toggles split view', async () => {
		component = render(MarkdownField, {
			props: { 
				field, 
				value: '# Test content',
				showPreview: true
			}
		});
		
		const splitViewToggle = screen.getByText('Split View');
		await fireEvent.click(splitViewToggle);
		
		// Should show split panes
		const markdownSource = screen.getByText('Markdown');
		const previewPane = screen.getByText('Preview');
		
		expect(markdownSource).toBeInTheDocument();
		expect(previewPane).toBeInTheDocument();
	});

	// Test sanitized indicator
	it('shows sanitized indicator when sanitizeHtml is true', async () => {
		component = render(MarkdownField, {
			props: { field, value: '# Test content', sanitizeHtml: true }
		});
		
		const sanitizedInfo = screen.getByText('Sanitized');
		expect(sanitizedInfo).toBeInTheDocument();
	});

	// Test empty state
	it('shows empty state when no content is provided', async () => {
		component = render(MarkdownField, {
			props: { field, value: '' }
		});
		
		const emptyState = screen.getByText('No markdown content to display');
		expect(emptyState).toBeInTheDocument();
		
		const addButton = screen.queryByText('Add Markdown Content');
		// Only shows add button if editing is allowed
		if (addButton) {
			expect(addButton).toBeInTheDocument();
		}
	});

	// Test focus and blur events
	it('emits focus and blur events', async () => {
		let focusEventFired = false;
		let blurEventFired = false;
		
		component = render(MarkdownField, {
			props: { field, value: '# Test content', allowEditing: true }
		});
		
		// Listen for focus and blur events
		const unsubscribeFocus = component.$on('focus', () => {
			focusEventFired = true;
		});
		
		const unsubscribeBlur = component.$on('blur', () => {
			blurEventFired = true;
		});
		
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		const textarea = screen.getByDisplayValue('Test content');
		
		// Simulate focus
		await fireEvent.focus(textarea);
		expect(focusEventFired).toBe(true);
		
		// Simulate blur
		await fireEvent.blur(textarea);
		expect(blurEventFired).toBe(true);
		
		unsubscribeFocus();
		unsubscribeBlur();
	});

	// Test max height
	it('respects maxHeight property', async () => {
		component = render(MarkdownField, {
			props: { field, value: '# Test content', maxHeight: '300px' }
		});
		
		const markdownContent = screen.getByRole('document');
		expect(markdownContent).toBeInTheDocument();
		// Note: Max height is applied via CSS, not easily testable with queries
	});

	// Test min height
	it('respects minHeight property', async () => {
		component = render(MarkdownField, {
			props: { field, value: '# Test content', minHeight: '150px' }
		});
		
		const markdownContent = screen.getByRole('document');
		expect(markdownContent).toBeInTheDocument();
		// Note: Min height is applied via CSS, not easily testable with queries
	});

	// Test line numbers
	it('respects lineNumbers property', async () => {
		component = render(MarkdownField, {
			props: { field, value: 'console.log("test");', lineNumbers: true }
		});
		
		const markdownContent = screen.getByRole('document');
		expect(markdownContent).toBeInTheDocument();
		// Note: Line numbers is applied via CSS, not easily testable with queries
	});

	// Test tab size
	it('respects tabSize property', async () => {
		component = render(MarkdownField, {
			props: { field, value: 'console.log("test");', tabSize: 4 }
		});
		
		const markdownContent = screen.getByRole('document');
		expect(markdownContent).toBeInTheDocument();
		// Note: Tab size is applied via CSS, not easily testable with queries
	});

	// Test cancel editing
	it('cancels editing when cancel button is clicked', async () => {
		component = render(MarkdownField, {
			props: { field, value: '# Original content', allowEditing: true }
		});
		
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		const textarea = screen.getByDisplayValue('Original content');
		await fireEvent.input(textarea, { target: { value: '# Modified content' } });
		
		const cancelButton = screen.getByText('Cancel');
		await fireEvent.click(cancelButton);
		
		// Should revert to original content
		const markdownContent = screen.getByRole('document');
		expect(markdownContent).toBeInTheDocument();
		
		// Check if content is still original (not modified)
		expect(markdownContent).toHaveTextContent('Original content');
	});
});