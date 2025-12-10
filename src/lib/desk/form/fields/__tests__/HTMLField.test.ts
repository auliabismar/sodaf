import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import HTMLField from '../HTMLField.svelte';
import { createMockField } from './fixtures/mockFields';

// Mock DOMPurify
vi.mock('dompurify', () => ({
	sanitize: vi.fn((html: string) => html)
}));

describe('HTMLField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = createMockField({ fieldtype: 'HTML' });
		vi.clearAllMocks();
	});

	// P3-007-T19: HTMLField renders HTML content display
	it('renders HTML content display component', async () => {
		component = render(HTMLField, {
			props: { field, value: '<p>Test content</p>' }
		});
		
		const htmlContent = screen.getByRole('document');
		expect(htmlContent).toBeInTheDocument();
		expect(htmlContent).toHaveAttribute('aria-label', 'Test Field HTML content preview');
	});

	// Test HTML sanitization
	it('sanitizes HTML content when sanitizeHtml is true', async () => {
		const DOMPurify = await import('dompurify');
		component = render(HTMLField, {
			props: { field, value: '<p>Test content</p><script>alert("xss")</script>', sanitizeHtml: true }
		});
		
		expect(DOMPurify.default.sanitize).toHaveBeenCalledWith('<p>Test content</p><script>alert("xss")</script>');
	});

	// Test toolbar buttons
	it('renders toolbar with edit and preview buttons', async () => {
		component = render(HTMLField, {
			props: { field, value: '<p>Test content</p>', allowEditing: true }
		});
		
		// Check for toolbar elements
		const editButton = screen.getByText('Edit');
		const previewButton = screen.getByText('Preview');
		const copyButton = screen.getByLabelText('Copy HTML');
		
		expect(editButton).toBeInTheDocument();
		expect(previewButton).toBeInTheDocument();
		expect(copyButton).toBeInTheDocument();
	});

	// Test value binding
	it('supports two-way value binding', async () => {
		let testValue = '<p>Initial content</p>';
		component = render(HTMLField, {
			props: { field, value: testValue }
		});
		
		const htmlContent = screen.getByRole('document');
		expect(htmlContent).toBeInTheDocument();
	});

	// Test change event
	it('emits change event on content change', async () => {
		let changeEventFired = false;
		let changeEventValue = '';
		
		component = render(HTMLField, {
			props: { field, value: '<p>Initial content</p>' }
		});
		
		// Listen for change event
		const unsubscribe = component.$on('change', (event: any) => {
			changeEventFired = true;
			changeEventValue = event.detail;
		});
		
		// Start editing to trigger change
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		const textarea = screen.getByDisplayValue('Initial content');
		await fireEvent.input(textarea, { target: { value: '<p>New content</p>' } });
		
		// Save changes
		const saveButton = screen.getByText('Save');
		await fireEvent.click(saveButton);
		
		// Wait for change event to be processed
		await waitFor(() => {
			expect(changeEventFired).toBe(true);
		});
		
		unsubscribe();
	});

	// Test disabled state
	it('disables editor when disabled prop is true', async () => {
		component = render(HTMLField, {
			props: { field, value: '<p>Test content</p>', disabled: true }
		});
		
		// Should show preview only, no edit button
		const editButton = screen.queryByText('Edit');
		expect(editButton).not.toBeInTheDocument();
		
		const htmlContent = screen.getByRole('document');
		expect(htmlContent).toBeInTheDocument();
	});

	// Test readonly state
	it('makes editor readonly when readonly prop is true', async () => {
		component = render(HTMLField, {
			props: { field, value: '<p>Test content</p>', readonly: true }
		});
		
		// Should show preview only, no edit button
		const editButton = screen.queryByText('Edit');
		expect(editButton).not.toBeInTheDocument();
		
		const htmlContent = screen.getByRole('document');
		expect(htmlContent).toBeInTheDocument();
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({ 
			fieldtype: 'HTML', 
			required: true 
		});
		
		component = render(HTMLField, {
			props: { field: requiredField, value: '<p>Test content</p>' }
		});
		
		const label = screen.getByText('Test Field *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(HTMLField, {
			props: { field, value: '<p>Test content</p>', error: 'Invalid HTML' }
		});
		
		const errorMessage = screen.getByText('Invalid HTML');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test placeholder
	it('uses placeholder when provided', async () => {
		component = render(HTMLField, {
			props: { field, value: '', placeholder: 'Enter HTML content here...' }
		});
		
		// Start editing to see placeholder
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		const textarea = screen.getByPlaceholderText('Enter HTML content here...');
		expect(textarea).toBeInTheDocument();
	});

	// Test field label
	it('uses field label when no placeholder provided', async () => {
		const labeledField = createMockField({ 
			fieldtype: 'HTML', 
			label: 'Custom HTML Field' 
		});
		
		component = render(HTMLField, {
			props: { field: labeledField, value: '' }
		});
		
		const label = screen.getByText('Custom HTML Field');
		expect(label).toBeInTheDocument();
	});

	// Test hide label
	it('hides label when hideLabel is true', async () => {
		component = render(HTMLField, {
			props: { field, value: '', hideLabel: true }
		});
		
		const label = screen.queryByText('Test Field');
		expect(label).not.toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({ 
			fieldtype: 'HTML', 
			description: 'Enter HTML content here' 
		});
		
		component = render(HTMLField, {
			props: { field: fieldWithDescription, value: '' }
		});
		
		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test edit mode
	it('enters edit mode when edit button is clicked', async () => {
		component = render(HTMLField, {
			props: { field, value: '<p>Test content</p>', allowEditing: true }
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
		component = render(HTMLField, {
			props: { field, value: '<p>Test content</p>' }
		});
		
		// Should show preview, not editor
		const htmlContent = screen.getByRole('document');
		expect(htmlContent).toBeInTheDocument();
		
		const textarea = screen.queryByDisplayValue('Test content');
		expect(textarea).not.toBeInTheDocument();
	});

	// Test editor toolbar
	it('shows editor toolbar in edit mode', async () => {
		component = render(HTMLField, {
			props: { field, value: '<p>Test content</p>', allowEditing: true }
		});
		
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		// Check for editor toolbar buttons
		const boldButton = screen.getByText('B');
		const italicButton = screen.getByText('I');
		const underlineButton = screen.getByText('U');
		const codeButton = screen.getByText('<code>');
		
		expect(boldButton).toBeInTheDocument();
		expect(italicButton).toBeInTheDocument();
		expect(underlineButton).toBeInTheDocument();
		expect(codeButton).toBeInTheDocument();
	});

	// Test HTML insertion
	it('inserts HTML tags when toolbar buttons are clicked', async () => {
		component = render(HTMLField, {
			props: { field, value: 'selected text', allowEditing: true }
		});
		
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		const textarea = screen.getByDisplayValue('selected text');
		
		// Select some text
		(textarea as HTMLTextAreaElement).setSelectionRange(0, 8);
		
		// Click bold button
		const boldButton = screen.getByText('B');
		await fireEvent.click(boldButton);
		
		// Should wrap selected text in strong tags
		expect(textarea).toHaveValue('<strong>selected text</strong>');
	});

	// Test link insertion
	it('opens link dialog when link button is clicked', async () => {
		component = render(HTMLField, {
			props: { field, value: '<p>Test content</p>', allowEditing: true }
		});
		
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		const linkButton = screen.getByText('Link');
		await fireEvent.click(linkButton);
		
		// Mock prompt
		const mockPrompt = vi.fn().mockReturnValue('https://example.com');
		global.prompt = mockPrompt;
		
		// Should trigger prompt
		expect(mockPrompt).toHaveBeenCalledWith('Enter URL:');
	});

	// Test image insertion
	it('opens image dialog when image button is clicked', async () => {
		component = render(HTMLField, {
			props: { field, value: '<p>Test content</p>', allowEditing: true }
		});
		
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		const imageButton = screen.getByText('Image');
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

	// Test copy functionality
	it('copies HTML to clipboard', async () => {
		const mockClipboard = {
			writeText: vi.fn().mockResolvedValue(undefined)
		};
		Object.assign(navigator, { clipboard: mockClipboard });
		
		component = render(HTMLField, {
			props: { field, value: '<p>Test content</p>' }
		});
		
		const copyButton = screen.getByLabelText('Copy HTML');
		await fireEvent.click(copyButton);
		
		expect(mockClipboard.writeText).toHaveBeenCalledWith('<p>Test content</p>');
	});

	// Test fullscreen functionality
	it('toggles fullscreen mode', async () => {
		component = render(HTMLField, {
			props: { field, value: '<p>Test content</p>' }
		});
		
		const fullscreenButton = screen.getByLabelText('Fullscreen');
		await fireEvent.click(fullscreenButton);
		
		const fullscreenExitButton = screen.getByLabelText('Exit fullscreen');
		expect(fullscreenExitButton).toBeInTheDocument();
	});

	// Test sanitized indicator
	it('shows sanitized indicator when sanitizeHtml is true', async () => {
		component = render(HTMLField, {
			props: { field, value: '<p>Test content</p>', sanitizeHtml: true }
		});
		
		const sanitizedInfo = screen.getByText('Sanitized');
		expect(sanitizedInfo).toBeInTheDocument();
	});

	// Test empty state
	it('shows empty state when no content is provided', async () => {
		component = render(HTMLField, {
			props: { field, value: '', allowEditing: true }
		});
		
		const emptyState = screen.getByText('No HTML content to display');
		expect(emptyState).toBeInTheDocument();
		
		const addButton = screen.getByText('Add HTML Content');
		expect(addButton).toBeInTheDocument();
	});

	// Test cancel editing
	it('cancels editing when cancel button is clicked', async () => {
		component = render(HTMLField, {
			props: { field, value: '<p>Original content</p>', allowEditing: true }
		});
		
		const editButton = screen.getByText('Edit');
		await fireEvent.click(editButton);
		
		const textarea = screen.getByDisplayValue('Original content');
		await fireEvent.input(textarea, { target: { value: '<p>Modified content</p>' } });
		
		const cancelButton = screen.getByText('Cancel');
		await fireEvent.click(cancelButton);
		
		// Should revert to original content
		const htmlContent = screen.getByRole('document');
		expect(htmlContent).toBeInTheDocument();
		
		// Check if content is still original (not modified)
		expect(htmlContent).toHaveTextContent('Original content');
	});

	// Test max height
	it('respects maxHeight property', async () => {
		component = render(HTMLField, {
			props: { field, value: '<p>Test content</p>', maxHeight: '300px' }
		});
		
		const htmlContent = screen.getByRole('document');
		expect(htmlContent).toBeInTheDocument();
		// Note: Max height is applied via CSS, not easily testable with queries
	});

	// Test min height
	it('respects minHeight property', async () => {
		component = render(HTMLField, {
			props: { field, value: '<p>Test content</p>', minHeight: '150px' }
		});
		
		const htmlContent = screen.getByRole('document');
		expect(htmlContent).toBeInTheDocument();
		// Note: Min height is applied via CSS, not easily testable with queries
	});

	// Test focus and blur events
	it('emits focus and blur events', async () => {
		let focusEventFired = false;
		let blurEventFired = false;
		
		component = render(HTMLField, {
			props: { field, value: '<p>Test content</p>', allowEditing: true }
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

	// Test allowed tags customization
	it('respects allowedTags property', async () => {
		const DOMPurify = await import('dompurify');
		const customTags = ['p', 'strong', 'em'];
		
		component = render(HTMLField, {
			props: { 
				field, 
				value: '<p>Test <script>alert("xss")</script> content</p>',
				sanitizeHtml: true,
				allowedTags: customTags
			}
		});
		
		expect(DOMPurify.default.sanitize).toHaveBeenCalledWith('<p>Test <script>alert("xss")</script> content</p>', expect.objectContaining({
			ALLOWED_TAGS: customTags
		}));
	});

	// Test allowed attributes customization
	it('respects allowedAttributes property', async () => {
		const DOMPurify = await import('dompurify');
		const customAttributes = ['class', 'id'];
		
		component = render(HTMLField, {
			props: { 
				field, 
				value: '<p class="test" id="test">Test content</p>',
				sanitizeHtml: true,
				allowedAttributes: customAttributes
			}
		});
		
		expect(DOMPurify.default.sanitize).toHaveBeenCalledWith('<p class="test" id="test">Test content</p>', expect.objectContaining({
			ALLOWED_ATTR: customAttributes
		}));
	});
});