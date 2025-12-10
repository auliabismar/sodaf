import { render, fireEvent, screen } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import TableField from '../TableField.svelte';
import { renderWithProps } from './fixtures/testUtils';
import { createMockField } from './fixtures/mockFields';
import type { DocField } from '../../../../meta/doctype/types';

describe('TableField', () => {
	let mockField: DocField;
	let mockChildFields: DocField[];

	beforeEach(() => {
		mockChildFields = [
			createMockField({
				fieldname: 'name',
				label: 'Name',
				fieldtype: 'Data',
				required: true
			}),
			createMockField({
				fieldname: 'quantity',
				label: 'Quantity',
				fieldtype: 'Int',
				required: false
			}),
			createMockField({
				fieldname: 'price',
				label: 'Price',
				fieldtype: 'Currency',
				options: 'USD'
			})
		];

		mockField = createMockField({
			fieldname: 'items',
			label: 'Items',
			fieldtype: 'Table',
			options: 'ChildDocType',
			child_doctype: 'ChildDocType'
		});
	});

	describe('P3-007-T19: Basic TableField functionality', () => {
		it('should render table with child fields', async () => {
			const { getByText } = await renderWithProps(TableField, {
				props: {
					field: mockField,
					value: [],
					childFields: mockChildFields
				}
			});

			// Check if table headers are rendered
			expect(getByText('Name')).toBeInTheDocument();
			expect(getByText('Quantity')).toBeInTheDocument();
			expect(getByText('Price')).toBeInTheDocument();

			// Check if Add Row button is rendered
			expect(getByText('Add Row')).toBeInTheDocument();
		});

		it('should render existing rows correctly', async () => {
			const existingRows = [
				{ name: 'Item 1', quantity: 10, price: 100 },
				{ name: 'Item 2', quantity: 5, price: 50 }
			];

			const { getByText } = await renderWithProps(TableField, {
				props: {
					field: mockField,
					value: existingRows,
					childFields: mockChildFields
				}
			});

			// Check if existing rows are rendered
			expect(getByText('Item 1')).toBeInTheDocument();
			expect(getByText('Item 2')).toBeInTheDocument();
			expect(getByText('10')).toBeInTheDocument();
			expect(getByText('5')).toBeInTheDocument();
		});

		it('should show empty message when no rows', async () => {
			const { getByText } = await renderWithProps(TableField, {
				props: {
					field: mockField,
					value: [],
					childFields: mockChildFields
				}
			});

			expect(getByText('No rows added yet')).toBeInTheDocument();
		});

		it('should show message when no child fields configured', async () => {
			const { getByText } = await renderWithProps(TableField, {
				props: {
					field: mockField,
					value: [],
					childFields: []
				}
			});

			expect(getByText('No child fields configured for this table')).toBeInTheDocument();
		});
	});

	describe('P3-007-T20: TableField CRUD operations', () => {
		it('should add new row when Add Row is clicked', async () => {
			const mockOnChange = vi.fn();
			let currentValue: any[] = [];

			const { getByText, component } = await renderWithProps(TableField, {
				props: {
					field: mockField,
					value: currentValue,
					childFields: mockChildFields,
					onchange: mockOnChange
				}
			});

			// Click Add Row button
			const addRowButton = getByText('Add Row');
			await fireEvent.click(addRowButton);

			// Check if onchange was called with new row
			expect(mockOnChange).toHaveBeenCalled();
			const newValue = mockOnChange.mock.calls[0][0];
			expect(newValue).toHaveLength(1);
			expect(newValue[0]).toHaveProperty('name', '');
			expect(newValue[0]).toHaveProperty('quantity', '');
			expect(newValue[0]).toHaveProperty('price', '');
		});

		it('should delete selected rows', async () => {
			const mockOnChange = vi.fn();
			const existingRows = [
				{ name: 'Item 1', quantity: 10, price: 100 },
				{ name: 'Item 2', quantity: 5, price: 50 },
				{ name: 'Item 3', quantity: 2, price: 25 }
			];

			const { getByText, getAllByRole } = await renderWithProps(TableField, {
				props: {
					field: mockField,
					value: existingRows,
					childFields: mockChildFields,
					onchange: mockOnChange
				}
			});

			// Select first and third rows
			const checkboxes = getAllByRole('checkbox');
			await fireEvent.click(checkboxes[0]); // Select first row
			await fireEvent.click(checkboxes[2]); // Select third row

			// Click Delete Selected button
			const deleteButton = getByText('Delete Selected (2)');
			await fireEvent.click(deleteButton);

			// Check if onchange was called with remaining rows
			expect(mockOnChange).toHaveBeenCalled();
			const newValue = mockOnChange.mock.calls[0][0];
			expect(newValue).toHaveLength(1);
			expect(newValue[0]).toEqual(existingRows[1]); // Only second row should remain
		});

		it('should edit row inline', async () => {
			const mockOnChange = vi.fn();
			const existingRows = [
				{ name: 'Item 1', quantity: 10, price: 100 }
			];

			const { getByText, getByDisplayValue, component } = await renderWithProps(TableField, {
				props: {
					field: mockField,
					value: existingRows,
					childFields: mockChildFields,
					onchange: mockOnChange
				}
			});

			// Click edit button for first row
			const editButtons = screen.getAllByRole('button').filter(button =>
				button.getAttribute('aria-label') === 'Edit row'
			);
			await fireEvent.click(editButtons[0]);

			// Change name field value
			const nameInput = getByDisplayValue('Item 1');
			await fireEvent.input(nameInput, { target: { value: 'Updated Item 1' } });

			// Click save button
			const saveButton = getByText('Save');
			await fireEvent.click(saveButton);

			// Check if onchange was called with updated row
			expect(mockOnChange).toHaveBeenCalled();
			const newValue = mockOnChange.mock.calls[0][0];
			expect(newValue[0]).toEqual({
				name: 'Updated Item 1',
				quantity: 10,
				price: 100
			});
		});

		it('should cancel row editing', async () => {
			const mockOnChange = vi.fn();
			const existingRows = [
				{ name: 'Item 1', quantity: 10, price: 100 }
			];

			const { getByText, getByDisplayValue, component } = await renderWithProps(TableField, {
				props: {
					field: mockField,
					value: existingRows,
					childFields: mockChildFields,
					onchange: mockOnChange
				}
			});

			// Click edit button for first row
			const editButtons = screen.getAllByRole('button').filter(button =>
				button.getAttribute('aria-label') === 'Edit row'
			);
			await fireEvent.click(editButtons[0]);

			// Change name field value
			const nameInput = getByDisplayValue('Item 1');
			await fireEvent.input(nameInput, { target: { value: 'Updated Item 1' } });

			// Click cancel button
			const cancelButton = getByText('Cancel');
			await fireEvent.click(cancelButton);

			// Check if onchange was NOT called (changes discarded)
			expect(mockOnChange).not.toHaveBeenCalled();

			// Check if original value is still displayed
			expect(getByText('Item 1')).toBeInTheDocument();
		});

		it('should reorder rows with up/down buttons', async () => {
			const mockOnChange = vi.fn();
			const existingRows = [
				{ name: 'Item 1', quantity: 10, price: 100 },
				{ name: 'Item 2', quantity: 5, price: 50 },
				{ name: 'Item 3', quantity: 2, price: 25 }
			];

			const { getAllByLabelText } = await renderWithProps(TableField, {
				props: {
					field: mockField,
					value: existingRows,
					childFields: mockChildFields,
					onchange: mockOnChange
				}
			});

			// Move second row up
			const moveUpButtons = getAllByLabelText('Move row up');
			await fireEvent.click(moveUpButtons[1]); // Second row's up button

			// Check if onchange was called with reordered rows
			expect(mockOnChange).toHaveBeenCalled();
			let newValue = mockOnChange.mock.calls[0][0];
			expect(newValue).toEqual([
				existingRows[1], // Item 2 moved to first position
				existingRows[0], // Item 1 moved to second position
				existingRows[2]  // Item 3 remains third
			]);

			// Reset mock for next test
			mockOnChange.mockReset();

			// Move first row down
			const moveDownButtons = getAllByLabelText('Move row down');
			await fireEvent.click(moveDownButtons[0]); // First row's down button

			// Check if onchange was called with reordered rows
			expect(mockOnChange).toHaveBeenCalled();
			newValue = mockOnChange.mock.calls[0][0];
			expect(newValue).toEqual([
				existingRows[0], // Item 1 back to first position
				existingRows[1], // Item 2 back to second position
				existingRows[2]  // Item 3 remains third
			]);
		});

		it('should respect max rows limit', async () => {
			const mockOnChange = vi.fn();
			const existingRows = [
				{ name: 'Item 1', quantity: 10, price: 100 },
				{ name: 'Item 2', quantity: 5, price: 50 }
			];

			const { getByText } = await renderWithProps(TableField, {
				props: {
					field: mockField,
					value: existingRows,
					childFields: mockChildFields,
					maxRows: 2,
					onchange: mockOnChange
				}
			});

			// Add Row button should be disabled when max rows reached
			const addRowButton = getByText('Add Row');
			expect(addRowButton).toBeDisabled();
		});

		it('should show minimum rows warning', async () => {
			const { getByText } = await renderWithProps(TableField, {
				props: {
					field: mockField,
					value: [],
					childFields: mockChildFields,
					minRows: 2
				}
			});

			expect(getByText('Minimum 2 rows required')).toBeInTheDocument();
		});
	});

	describe('TableField accessibility', () => {
		it('should have proper ARIA labels', async () => {
			const { getByRole } = await renderWithProps(TableField, {
				props: {
					field: mockField,
					value: [],
					childFields: mockChildFields
				}
			});

			const table = getByRole('grid');
			expect(table).toHaveAttribute('aria-label', 'Items');
		});

		it('should have proper ARIA row and column indices', async () => {
			const existingRows = [
				{ name: 'Item 1', quantity: 10, price: 100 }
			];

			const { getByRole } = await renderWithProps(TableField, {
				props: {
					field: mockField,
					value: existingRows,
					childFields: mockChildFields
				}
			});

			const rows = screen.getAllByRole('row');
			expect(rows[1]).toHaveAttribute('aria-rowindex', '1'); // First data row

			const cells = screen.getAllByRole('gridcell');
			expect(cells[0]).toHaveAttribute('aria-colindex', '1'); // First column
		});
	});

	describe('TableField disabled/readonly states', () => {
		it('should disable all controls when disabled', async () => {
			const { getByText, queryByRole } = await renderWithProps(TableField, {
				props: {
					field: mockField,
					value: [],
					childFields: mockChildFields,
					disabled: true
				}
			});

			// Add Row button should not be clickable
			expect(getByText('Add Row')).toBeDisabled();

			// No edit/delete buttons should be present
			expect(queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
			expect(queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
		});

		it('should disable all controls when readonly', async () => {
			const { getByText, queryByRole } = await renderWithProps(TableField, {
				props: {
					field: mockField,
					value: [],
					childFields: mockChildFields,
					readonly: true
				}
			});

			// Add Row button should not be clickable
			expect(getByText('Add Row')).toBeDisabled();

			// No edit/delete buttons should be present
			expect(queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
			expect(queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
		});
	});
});