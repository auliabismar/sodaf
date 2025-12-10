import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import ReadOnlyField from '../ReadOnlyField.svelte';
import { renderWithProps } from './fixtures/testUtils';
import { createMockField } from './fixtures/mockFields';
import type { DocField } from '../../../../meta/doctype/types';

describe('ReadOnlyField', () => {
	let mockField: DocField;

	beforeEach(() => {
		// Reset clipboard mock
		Object.assign(navigator, {
			clipboard: {
				writeText: vi.fn().mockResolvedValue(undefined)
			}
		});
	});

	describe('P3-007-T28: Basic ReadOnlyField functionality', () => {
		it('should render read-only field with value', async () => {
			mockField = createMockField({
				fieldname: 'name',
				label: 'Name',
				fieldtype: 'Data'
			});

			const { getByText } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: 'John Doe'
				}
			});

			expect(getByText('John Doe')).toBeInTheDocument();
		});

		it('should show empty state when no value', async () => {
			mockField = createMockField({
				fieldname: 'name',
				label: 'Name',
				fieldtype: 'Data'
			});

			const { container } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: ''
				}
			});

			const readonlyField = container.querySelector('.readonly-field');
			expect(readonlyField).toHaveClass('empty');
			expect(readonlyField).toHaveTextContent('No value');
		});

		it('should have copy button when value exists', async () => {
			mockField = createMockField({
				fieldname: 'email',
				label: 'Email',
				fieldtype: 'Data'
			});

			const { getByText } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: 'john@example.com'
				}
			});

			expect(getByText('Copy')).toBeInTheDocument();
		});

		it('should not have copy button when no value', async () => {
			mockField = createMockField({
				fieldname: 'empty_field',
				label: 'Empty Field',
				fieldtype: 'Data'
			});

			const { queryByText } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: ''
				}
			});

			expect(queryByText('Copy')).not.toBeInTheDocument();
		});
	});

	describe('P3-007-T29: Value formatting by field type', () => {
		it('should format text values correctly', async () => {
			mockField = createMockField({
				fieldname: 'description',
				label: 'Description',
				fieldtype: 'Long Text'
			});

			const { getByText } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: 'Line 1\nLine 2\nLine 3'
				}
			});

			const textContent = getByText('Line 1\nLine 2\nLine 3');
			expect(textContent).toBeInTheDocument();
			expect(textContent).toHaveClass('multiline');
		});

		it('should format currency values correctly', async () => {
			mockField = createMockField({
				fieldname: 'price',
				label: 'Price',
				fieldtype: 'Currency',
				options: 'USD',
				precision: 2
			});

			const { getByText } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: 1234.56
				}
			});

			expect(getByText('$1,234.56')).toBeInTheDocument();
		});

		it('should format percentage values correctly', async () => {
			mockField = createMockField({
				fieldname: 'discount',
				label: 'Discount',
				fieldtype: 'Percent',
				precision: 1
			});

			const { getByText } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: 25.5
				}
			});

			expect(getByText('25.5%')).toBeInTheDocument();
		});

		it('should format boolean values correctly', async () => {
			mockField = createMockField({
				fieldname: 'active',
				label: 'Active',
				fieldtype: 'Check'
			});

			const { getByText } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: true
				}
			});

			expect(getByText('Yes')).toBeInTheDocument();
		});

		it('should format date values correctly', async () => {
			mockField = createMockField({
				fieldname: 'birth_date',
				label: 'Birth Date',
				fieldtype: 'Date'
			});

			const { container } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: '1990-05-15'
				}
			});

			// Date formatting depends on locale, so we just check that it's formatted
			const textContent = container.querySelector('.text-content');
			expect(textContent?.textContent).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
		});

		it('should format datetime values correctly', async () => {
			mockField = createMockField({
				fieldname: 'created_at',
				label: 'Created At',
				fieldtype: 'Datetime'
			});

			const { container } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: '2023-05-15T14:30:00Z'
				}
			});

			// Datetime formatting depends on locale, so we just check that it's formatted
			const textContent = container.querySelector('.text-content');
			expect(textContent?.textContent).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
		});

		it('should format HTML values correctly', async () => {
			mockField = createMockField({
				fieldname: 'content',
				label: 'Content',
				fieldtype: 'HTML'
			});

			const { container } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: '<p>Hello <strong>World</strong></p>'
				}
			});

			const htmlContent = container.querySelector('.html-content');
			expect(htmlContent?.innerHTML).toContain('<p>Hello <strong>World</strong></p>');
		});

		it('should format JSON values correctly', async () => {
			mockField = createMockField({
				fieldname: 'config',
				label: 'Config',
				fieldtype: 'Code'
			});

			const { container } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: '{"name": "test", "value": 123}'
				}
			});

			const jsonContent = container.querySelector('.json-content');
			expect(jsonContent?.textContent).toContain('"name": "test"');
			expect(jsonContent?.textContent).toContain('"value": 123');
		});
	});

	describe('P3-007-T30: Copy to clipboard functionality', () => {
		it('should copy text value to clipboard', async () => {
			mockField = createMockField({
				fieldname: 'email',
				label: 'Email',
				fieldtype: 'Data'
			});

			const { getByText } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: 'test@example.com'
				}
			});

			const copyButton = getByText('Copy');
			await fireEvent.click(copyButton);

			expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test@example.com');
		});

		it('should copy currency value to clipboard', async () => {
			mockField = createMockField({
				fieldname: 'price',
				label: 'Price',
				fieldtype: 'Currency',
				options: 'USD'
			});

			const { getByText } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: 99.99
				}
			});

			const copyButton = getByText('Copy');
			await fireEvent.click(copyButton);

			expect(navigator.clipboard.writeText).toHaveBeenCalledWith(99.99);
		});

		it('should handle clipboard errors gracefully', async () => {
			// Mock clipboard error
			Object.assign(navigator, {
				clipboard: {
					writeText: vi.fn().mockRejectedValue(new Error('Clipboard error'))
				}
			});

			mockField = createMockField({
				fieldname: 'name',
				label: 'Name',
				fieldtype: 'Data'
			});

			const { getByText } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: 'Test Value'
				}
			});

			const copyButton = getByText('Copy');
			
			// Should not throw error
			await expect(fireEvent.click(copyButton)).resolves.not.toThrow();
		});
	});

	describe('P3-007-T31: Format override functionality', () => {
		it('should use explicit format when provided', async () => {
			mockField = createMockField({
				fieldname: 'data',
				label: 'Data',
				fieldtype: 'Data'
			});

			const { getByText } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: '{"key": "value"}',
					format: 'json'
				}
			});

			const jsonContent = getByText('{"key": "value"}').closest('.json-content');
			expect(jsonContent).toBeInTheDocument();
		});

		it('should use auto format when format is auto', async () => {
			mockField = createMockField({
				fieldname: 'price',
				label: 'Price',
				fieldtype: 'Currency',
				options: 'EUR'
			});

			const { getByText } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: 123.45,
					format: 'auto'
				}
			});

			// Should auto-detect currency format
			expect(getByText('€123.45')).toBeInTheDocument();
		});

		it('should fallback to text format for unknown types', async () => {
			mockField = createMockField({
				fieldname: 'unknown',
				label: 'Unknown',
				fieldtype: 'UnknownType' as any
			});

			const { getByText } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: 'Some value',
					format: 'auto'
				}
			});

			expect(getByText('Some value')).toBeInTheDocument();
		});
	});

	describe('ReadOnlyField accessibility', () => {
		it('should have proper ARIA attributes', async () => {
			mockField = createMockField({
				fieldname: 'description',
				label: 'Description',
				fieldtype: 'Data'
			});

			const { getByText } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: 'Test description'
				}
			});

			const copyButton = getByText('Copy');
			expect(copyButton).toHaveAttribute('type', 'button');
			expect(copyButton).toHaveAttribute('aria-label', 'Copy to clipboard');
			expect(copyButton).toHaveAttribute('title', 'Copy to clipboard');
		});

		it('should handle keyboard navigation', async () => {
			mockField = createMockField({
				fieldname: 'name',
				label: 'Name',
				fieldtype: 'Data'
			});

			const { getByText } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: 'Test Name'
				}
			});

			const copyButton = getByText('Copy');
			copyButton.focus();
			expect(document.activeElement).toBe(copyButton);

			await fireEvent.keyDown(copyButton, { key: 'Enter' });
			expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test Name');
		});
	});

	describe('ReadOnlyField disabled/readonly states', () => {
		it('should always be disabled regardless of props', async () => {
			mockField = createMockField({
				fieldname: 'name',
				label: 'Name',
				fieldtype: 'Data'
			});

			const { container } = await renderWithProps(ReadOnlyField, {
				props: {
					field: mockField,
					value: 'Test',
					disabled: false,
					readonly: false
				}
			});

			const readonlyField = container.querySelector('.readonly-field');
			expect(readonlyField).toHaveClass('disabled');
		});
	});
});