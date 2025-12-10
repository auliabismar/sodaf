import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import LinkField from '../LinkField.svelte';
import { createMockField } from './fixtures/mockFields';

// Mock fetch API
global.fetch = vi.fn();

describe('LinkField', () => {
	let field: any;
	let component: any;
	const mockResponse = {
		ok: true,
		json: vi.fn().mockResolvedValue([
			{ name: 'DOC001', label: 'Document 1' },
			{ name: 'DOC002', label: 'Document 2' },
			{ name: 'DOC003', label: 'Document 3' }
		])
	};

	beforeEach(() => {
		vi.clearAllMocks();
		field = createMockField({ 
			fieldtype: 'Link', 
			options: 'User',
			label: 'User Link'
		});
		(fetch as any).mockResolvedValue(mockResponse);
	});

	// P3-007-T8: LinkField renders ComboBox
	it('renders ComboBox component', async () => {
		component = render(LinkField, {
			props: { field, value: 'DOC001' }
		});
		
		const combobox = screen.getByRole('combobox');
		expect(combobox).toBeInTheDocument();
	});

	// P3-007-T8: Search functionality with API integration
	it('fetches options from API on mount', async () => {
		component = render(LinkField, {
			props: { field, value: '' }
		});

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/v1/search?doctype=User&search=&limit=20')
			);
		});
	});

	// P3-007-T8: Search functionality with API integration
	it('fetches options with search term', async () => {
		component = render(LinkField, {
			props: { field, value: '' }
		});

		const combobox = screen.getByRole('combobox');
		await fireEvent.input(combobox, { target: { value: 'DOC' } });

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('search=DOC')
			);
		});
	});

	// P3-007-T9: Quick create button
	it('shows quick create button when allowQuickCreate is true', async () => {
		component = render(LinkField, {
			props: { field, value: '', allowQuickCreate: true }
		});

		const quickCreateButton = screen.getByRole('button', { name: /create new user/i });
		expect(quickCreateButton).toBeInTheDocument();
	});

	// P3-007-T9: Quick create button
	it('hides quick create button when allowQuickCreate is false', async () => {
		component = render(LinkField, {
			props: { field, value: '', allowQuickCreate: false }
		});

		const quickCreateButton = screen.queryByRole('button', { name: /create new/i });
		expect(quickCreateButton).not.toBeInTheDocument();
	});

	// P3-007-T9: Quick create button
	it('dispatches quick-create event when quick create button is clicked', async () => {
		let quickCreateEventFired = false;
		let quickCreateEventData = {};

		component = render(LinkField, {
			props: { field, value: '', allowQuickCreate: true }
		});

		// Listen for quick-create event
		const unsubscribe = component.$on('quick-create', (event: any) => {
			quickCreateEventFired = true;
			quickCreateEventData = event.detail;
		});

		const quickCreateButton = screen.getByRole('button', { name: /create new user/i });
		await fireEvent.click(quickCreateButton);

		expect(quickCreateEventFired).toBe(true);
		expect(quickCreateEventData).toEqual({
			doctype: 'User',
			fieldname: 'test_field',
			filters: {}
		});

		unsubscribe();
	});

	// P3-007-T10: Filter support via get_query
	it('applies filters when fetching options', async () => {
		const filters = { status: 'Active' };
		component = render(LinkField, {
			props: { field, value: '', filters }
		});

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('filters=' + encodeURIComponent(JSON.stringify(filters)))
			);
		});
	});

	// P3-007-T10: Filter support via get_query
	it('applies field filters when fetching options', async () => {
		const fieldWithFilters = createMockField({ 
			fieldtype: 'Link', 
			options: 'User',
			filters: 'status="Active"'
		});

		component = render(LinkField, {
			props: { field: fieldWithFilters, value: '' }
		});

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('field_filters=status="Active"')
			);
		});
	});

	// P3-007-T10: Open button for existing value
	it('shows open button when value is set and showOpenButton is true', async () => {
		component = render(LinkField, {
			props: { field, value: 'DOC001', showOpenButton: true }
		});

		const openButton = screen.getByRole('button', { name: /open DOC001/i });
		expect(openButton).toBeInTheDocument();
	});

	// P3-007-T10: Open button for existing value
	it('hides open button when showOpenButton is false', async () => {
		component = render(LinkField, {
			props: { field, value: 'DOC001', showOpenButton: false }
		});

		const openButton = screen.queryByRole('button', { name: /open/i });
		expect(openButton).not.toBeInTheDocument();
	});

	// P3-007-T10: Open button for existing value
	it('dispatches open-document event when open button is clicked', async () => {
		let openDocumentEventFired = false;
		let openDocumentEventData = {};

		component = render(LinkField, {
			props: { field, value: 'DOC001', showOpenButton: true }
		});

		// Listen for open-document event
		const unsubscribe = component.$on('open-document', (event: any) => {
			openDocumentEventFired = true;
			openDocumentEventData = event.detail;
		});

		const openButton = screen.getByRole('button', { name: /open DOC001/i });
		await fireEvent.click(openButton);

		expect(openDocumentEventFired).toBe(true);
		expect(openDocumentEventData).toEqual({
			doctype: 'User',
			name: 'DOC001'
		});

		unsubscribe();
	});

	// Test disabled state
	it('disables combobox when disabled prop is true', async () => {
		component = render(LinkField, {
			props: { field, value: '', disabled: true }
		});

		const combobox = screen.getByRole('combobox');
		expect(combobox).toBeDisabled();
	});

	// Test readonly state
	it('disables combobox when readonly prop is true', async () => {
		component = render(LinkField, {
			props: { field, value: '', readonly: true }
		});

		const combobox = screen.getByRole('combobox');
		expect(combobox).toBeDisabled();
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({ 
			fieldtype: 'Link', 
			options: 'User',
			required: true 
		});

		component = render(LinkField, {
			props: { field: requiredField, value: '' }
		});

		const label = screen.getByText('User Link *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(LinkField, {
			props: { field, value: '', error: 'This field is required' }
		});

		const errorMessage = screen.getByText('This field is required');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test change event
	it('emits change event on value selection', async () => {
		let changeEventFired = false;
		let changeEventValue = '';

		component = render(LinkField, {
			props: { field, value: '' }
		});

		// Listen for change event
		const unsubscribe = component.$on('change', (event: any) => {
			changeEventFired = true;
			changeEventValue = event.detail;
		});

		// Mock the API response
		(fetch as any).mockResolvedValue(mockResponse);

		// Wait for options to load
		await waitFor(() => {
			expect(fetch).toHaveBeenCalled();
		});

		const combobox = screen.getByRole('combobox');
		await fireEvent.input(combobox, { target: { value: 'DOC001' } });

		// Simulate selection (this would normally be handled by the ComboBox component)
		// For testing purposes, we'll trigger the change event directly
		const selectEvent = new CustomEvent('select', {
			detail: { selectedItem: { value: 'DOC001' } }
		});
		combobox.dispatchEvent(selectEvent);

		expect(changeEventFired).toBe(true);
		expect(changeEventValue).toBe('DOC001');

		unsubscribe();
	});

	// Test blur event
	it('emits blur event', async () => {
		let blurEventFired = false;

		component = render(LinkField, {
			props: { field, value: '' }
		});

		// Listen for blur event
		const unsubscribe = component.$on('blur', () => {
			blurEventFired = true;
		});

		const combobox = screen.getByRole('combobox');
		await fireEvent.blur(combobox);

		expect(blurEventFired).toBe(true);

		unsubscribe();
	});

	// Test focus event
	it('emits focus event', async () => {
		let focusEventFired = false;

		component = render(LinkField, {
			props: { field, value: '' }
		});

		// Listen for focus event
		const unsubscribe = component.$on('focus', () => {
			focusEventFired = true;
		});

		const combobox = screen.getByRole('combobox');
		await fireEvent.focus(combobox);

		expect(focusEventFired).toBe(true);

		unsubscribe();
	});

	// Test placeholder text
	it('uses custom placeholder when provided', async () => {
		component = render(LinkField, {
			props: { field, value: '', placeholder: 'Select a user...' }
		});

		const combobox = screen.getByPlaceholderText('Select a user...');
		expect(combobox).toBeInTheDocument();
	});

	// Test placeholder text for required field
	it('uses required placeholder for required field', async () => {
		const requiredField = createMockField({ 
			fieldtype: 'Link', 
			options: 'User',
			required: true 
		});

		component = render(LinkField, {
			props: { field: requiredField, value: '' }
		});

		const combobox = screen.getByPlaceholderText('Select User Link');
		expect(combobox).toBeInTheDocument();
	});

	// Test API error handling
	it('handles API errors gracefully', async () => {
		(fetch as any).mockRejectedValue(new Error('Network error'));

		component = render(LinkField, {
			props: { field, value: '' }
		});

		// Wait for the error to be handled
		await waitFor(() => {
			expect(fetch).toHaveBeenCalled();
		});

		// Component should still render without crashing
		const combobox = screen.getByRole('combobox');
		expect(combobox).toBeInTheDocument();
	});

	// Test empty options
	it('handles empty DocType options', async () => {
		const fieldWithoutOptions = createMockField({ 
			fieldtype: 'Link', 
			options: ''
		});

		component = render(LinkField, {
			props: { field: fieldWithoutOptions, value: '' }
		});

		// Should not make API call when no DocType is specified
		expect(fetch).not.toHaveBeenCalled();

		const combobox = screen.getByRole('combobox');
		expect(combobox).toBeInTheDocument();
	});
});