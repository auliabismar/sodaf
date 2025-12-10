import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import DynamicLinkField from '../DynamicLinkField.svelte';
import { createMockField } from './fixtures/mockFields';

// Mock fetch API
global.fetch = vi.fn();

describe('DynamicLinkField', () => {
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
			fieldtype: 'Dynamic Link', 
			options: 'reference_type\nUser\nCustomer\nSupplier',
			label: 'Dynamic Link'
		});
		(fetch as any).mockResolvedValue(mockResponse);
	});

	// P3-007-T11: Dynamic link based on another field's value
	it('renders ComboBox component', async () => {
		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: 'DOC001',
				formData: { reference_type: 'User' }
			}
		});
		
		const combobox = screen.getByRole('combobox');
		expect(combobox).toBeInTheDocument();
	});

	// P3-007-T11: Dynamic link based on another field's value
	it('determines target DocType from options field value', async () => {
		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: '',
				formData: { reference_type: 'User' }
			}
		});

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/v1/search?doctype=User&search=&limit=20')
			);
		});
	});

	// P3-007-T11: Dynamic link based on another field's value
	it('changes target DocType when options field value changes', async () => {
		let formData = { reference_type: 'User' };
		
		component = render(DynamicLinkField, {
			props: { field, value: '', formData }
		});

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('doctype=User')
			);
		});

		// Update formData to change DocType
		formData = { reference_type: 'Customer' };
		component.$set({ formData });

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('doctype=Customer')
			);
		});
	});

	// P3-007-T11: Dynamic link based on another field's value
	it('clears value when DocType changes', async () => {
		let formData = { reference_type: 'User' };
		
		component = render(DynamicLinkField, {
			props: { field, value: 'DOC001', formData }
		});

		// Change DocType
		formData = { reference_type: 'Customer' };
		component.$set({ formData });

		// Value should be cleared
		await waitFor(() => {
			const combobox = screen.getByRole('combobox');
			expect(combobox).toHaveValue('');
		});
	});

	// P3-007-T11: Dynamic link based on another field's value
	it('shows placeholder when no DocType is selected', async () => {
		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: '',
				formData: {} // No reference_type
			}
		});
		
		const combobox = screen.getByPlaceholderText('Select reference_type first');
		expect(combobox).toBeInTheDocument();
	});

	// P3-007-T11: Dynamic link based on another field's value
	it('disables combobox when no DocType is selected', async () => {
		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: '',
				formData: {} // No reference_type
			}
		});
		
		const combobox = screen.getByRole('combobox');
		expect(combobox).toBeDisabled();
	});

	// Test quick create button
	it('shows quick create button when DocType is selected', async () => {
		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: '',
				formData: { reference_type: 'User' },
				allowQuickCreate: true
			}
		});

		const quickCreateButton = screen.getByRole('button', { name: /create new user/i });
		expect(quickCreateButton).toBeInTheDocument();
	});

	// Test quick create button
	it('hides quick create button when no DocType is selected', async () => {
		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: '',
				formData: {}, // No reference_type
				allowQuickCreate: true
			}
		});

		const quickCreateButton = screen.queryByRole('button', { name: /create new/i });
		expect(quickCreateButton).not.toBeInTheDocument();
	});

	// Test quick create event
	it('dispatches quick-create event with correct DocType', async () => {
		let quickCreateEventFired = false;
		let quickCreateEventData = {};

		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: '',
				formData: { reference_type: 'Customer' },
				allowQuickCreate: true
			}
		});

		// Listen for quick-create event
		const unsubscribe = component.$on('quick-create', (event: any) => {
			quickCreateEventFired = true;
			quickCreateEventData = event.detail;
		});

		const quickCreateButton = screen.getByRole('button', { name: /create new customer/i });
		await fireEvent.click(quickCreateButton);

		expect(quickCreateEventFired).toBe(true);
		expect(quickCreateEventData).toEqual({
			doctype: 'Customer',
			fieldname: 'test_field',
			filters: {}
		});

		unsubscribe();
	});

	// Test open button
	it('shows open button when value is set and DocType is selected', async () => {
		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: 'DOC001',
				formData: { reference_type: 'User' },
				showOpenButton: true
			}
		});

		const openButton = screen.getByRole('button', { name: /open DOC001/i });
		expect(openButton).toBeInTheDocument();
	});

	// Test open button
	it('hides open button when no DocType is selected', async () => {
		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: 'DOC001',
				formData: {}, // No reference_type
				showOpenButton: true
			}
		});

		const openButton = screen.queryByRole('button', { name: /open/i });
		expect(openButton).not.toBeInTheDocument();
	});

	// Test open document event
	it('dispatches open-document event with correct DocType', async () => {
		let openDocumentEventFired = false;
		let openDocumentEventData = {};

		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: 'DOC001',
				formData: { reference_type: 'Supplier' },
				showOpenButton: true
			}
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
			doctype: 'Supplier',
			name: 'DOC001'
		});

		unsubscribe();
	});

	// Test filters
	it('applies filters when fetching options', async () => {
		const filters = { status: 'Active' };
		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: '',
				formData: { reference_type: 'User' },
				filters
			}
		});

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('filters=' + encodeURIComponent(JSON.stringify(filters)))
			);
		});
	});

	// Test field filters
	it('applies field filters when fetching options', async () => {
		const fieldWithFilters = createMockField({ 
			fieldtype: 'Dynamic Link', 
			options: 'reference_type\nUser\nCustomer',
			filters: 'status="Active"'
		});

		component = render(DynamicLinkField, {
			props: { 
				field: fieldWithFilters, 
				value: '',
				formData: { reference_type: 'User' }
			}
		});

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('field_filters=status="Active"')
			);
		});
	});

	// Test disabled state
	it('disables combobox when disabled prop is true', async () => {
		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: '',
				formData: { reference_type: 'User' },
				disabled: true
			}
		});

		const combobox = screen.getByRole('combobox');
		expect(combobox).toBeDisabled();
	});

	// Test readonly state
	it('disables combobox when readonly prop is true', async () => {
		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: '',
				formData: { reference_type: 'User' },
				readonly: true
			}
		});

		const combobox = screen.getByRole('combobox');
		expect(combobox).toBeDisabled();
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({ 
			fieldtype: 'Dynamic Link', 
			options: 'reference_type\nUser\nCustomer',
			required: true 
		});

		component = render(DynamicLinkField, {
			props: { 
				field: requiredField, 
				value: '',
				formData: { reference_type: 'User' }
			}
		});

		const label = screen.getByText('Dynamic Link *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: '',
				formData: { reference_type: 'User' },
				error: 'This field is required'
			}
		});

		const errorMessage = screen.getByText('This field is required');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test change event
	it('emits change event on value selection', async () => {
		let changeEventFired = false;
		let changeEventValue = '';

		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: '',
				formData: { reference_type: 'User' }
			}
		});

		// Listen for change event
		const unsubscribe = component.$on('change', (event: any) => {
			changeEventFired = true;
			changeEventValue = event.detail;
		});

		// Mock API response
		(fetch as any).mockResolvedValue(mockResponse);

		// Wait for options to load
		await waitFor(() => {
			expect(fetch).toHaveBeenCalled();
		});

		const combobox = screen.getByRole('combobox');
		await fireEvent.input(combobox, { target: { value: 'DOC001' } });

		// Simulate selection (this would normally be handled by the ComboBox component)
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

		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: '',
				formData: { reference_type: 'User' }
			}
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

		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: '',
				formData: { reference_type: 'User' }
			}
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

	// Test custom placeholder
	it('uses custom placeholder when provided', async () => {
		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: '',
				formData: { reference_type: 'User' },
				placeholder: 'Select a document...'
			}
		});

		const combobox = screen.getByPlaceholderText('Select a document...');
		expect(combobox).toBeInTheDocument();
	});

	// Test API error handling
	it('handles API errors gracefully', async () => {
		(fetch as any).mockRejectedValue(new Error('Network error'));

		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: '',
				formData: { reference_type: 'User' }
			}
		});

		// Wait for error to be handled
		await waitFor(() => {
			expect(fetch).toHaveBeenCalled();
		});

		// Component should still render without crashing
		const combobox = screen.getByRole('combobox');
		expect(combobox).toBeInTheDocument();
	});

	// Test empty options
	it('handles empty field options', async () => {
		const fieldWithoutOptions = createMockField({ 
			fieldtype: 'Dynamic Link', 
			options: ''
		});

		component = render(DynamicLinkField, {
			props: { 
				field: fieldWithoutOptions, 
				value: '',
				formData: { reference_type: 'User' }
			}
		});

		// Should not make API call when no options are specified
		expect(fetch).not.toHaveBeenCalled();

		const combobox = screen.getByRole('combobox');
		expect(combobox).toBeInTheDocument();
	});

	// Test case insensitive DocType matching
	it('matches DocType case insensitively', async () => {
		component = render(DynamicLinkField, {
			props: { 
				field, 
				value: '',
				formData: { reference_type: 'user' } // lowercase
			}
		});

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('doctype=User') // Should match 'User' from options
			);
		});
	});
});