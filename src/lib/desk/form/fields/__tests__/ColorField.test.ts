import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ColorField from '../ColorField.svelte';
import { renderWithProps, createMockEvent, createMockKeyboardEvent } from './fixtures/testUtils';
import { mockFields } from './fixtures/mockFields';

describe('ColorField', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Mock fetch for color picker functionality
		global.fetch = vi.fn();
	});

	describe('P3-007-T24: Color Field Basic Functionality', () => {
		it('should render color field with label', async () => {
			const { getByText, getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000'
			});

			expect(getByText(mockFields.color.label)).toBeInTheDocument();
			expect(getByLabelText('Color Field')).toBeInTheDocument();
		});

		it('should render color input with correct value', async () => {
			const { getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000'
			});

			const input = getByLabelText('Color Field') as HTMLInputElement;
			expect(input.value).toBe('#FF0000');
		});

		it('should handle color input changes', async () => {
			const mockChange = vi.fn();
			const { getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000',
				onchange: mockChange
			});

			const input = getByLabelText('Color Field') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: '#00FF00' } });

			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: '#00FF00' })
			);
		});

		it('should display error message when error is provided', async () => {
			const { getByText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000',
				error: 'Invalid color format'
			});

			expect(getByText('Invalid color format')).toBeInTheDocument();
		});
	});

	describe('P3-007-T24: Color Preview', () => {
		it('should show color preview with valid color', async () => {
			const { container } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000'
			});

			const preview = container.querySelector('.color-preview');
			expect(preview).toBeInTheDocument();
			expect(preview).toHaveStyle('background-color: #FF0000');
		});

		it('should show checkmark for valid colors', async () => {
			const { container } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000'
			});

			const checkmark = container.querySelector('.color-check');
			expect(checkmark).toBeInTheDocument();
		});

		it('should show error icon for invalid colors', async () => {
			const { container } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: 'invalid-color'
			});

			const errorIcon = container.querySelector('.color-error');
			expect(errorIcon).toBeInTheDocument();
		});

		it('should update preview when color changes', async () => {
			const { container, getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000'
			});

			const input = getByLabelText('Color Field') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: '#00FF00' } });

			const preview = container.querySelector('.color-preview');
			expect(preview).toHaveStyle('background-color: #00FF00');
		});
	});

	describe('P3-007-T24: Color Picker', () => {
		it('should open color picker when preview is clicked', async () => {
			const { container } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000'
			});

			const preview = container.querySelector('.color-preview');
			await fireEvent.click(preview!);

			const picker = container.querySelector('.color-picker-overlay');
			expect(picker).toBeInTheDocument();
		});

		it('should close color picker when overlay is clicked', async () => {
			const { container } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000'
			});

			const preview = container.querySelector('.color-preview');
			await fireEvent.click(preview!);

			const overlay = container.querySelector('.color-picker-overlay');
			await fireEvent.click(overlay!);

			expect(container.querySelector('.color-picker-overlay')).not.toBeInTheDocument();
		});

		it('should close color picker when close button is clicked', async () => {
			const { container } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000'
			});

			const preview = container.querySelector('.color-preview');
			await fireEvent.click(preview!);

			const closeButton = container.querySelector('[icon-description="Close color picker"]');
			await fireEvent.click(closeButton!);

			expect(container.querySelector('.color-picker-overlay')).not.toBeInTheDocument();
		});

		it('should update color when picker value changes', async () => {
			const mockChange = vi.fn();
			const { container } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000',
				onchange: mockChange
			});

			const preview = container.querySelector('.color-preview');
			await fireEvent.click(preview!);

			const pickerInput = container.querySelector('.color-picker-input') as HTMLInputElement;
			await fireEvent.input(pickerInput, { target: { value: '#00FF00' } });

			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: '#00FF00' })
			);
		});
	});

	describe('P3-007-T24: Color Format Support', () => {
		it('should normalize hex colors', async () => {
			const { getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#ff0000',
				format: 'hex'
			});

			const input = getByLabelText('Color Field') as HTMLInputElement;
			expect(input.value).toBe('#FF0000');
		});

		it('should convert RGB to hex format', async () => {
			const { getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: 'rgb(255, 0, 0)',
				format: 'hex'
			});

			const input = getByLabelText('Color Field') as HTMLInputElement;
			expect(input.value).toBe('#FF0000');
		});

		it('should output RGB format when specified', async () => {
			const { getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000',
				format: 'rgb'
			});

			const input = getByLabelText('Color Field') as HTMLInputElement;
			expect(input.value).toBe('rgb(255, 0, 0)');
		});

		it('should output RGBA format when specified', async () => {
			const { getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000',
				format: 'rgba'
			});

			const input = getByLabelText('Color Field') as HTMLInputElement;
			expect(input.value).toBe('rgba(255, 0, 0, 1)');
		});

		it('should output HSL format when specified', async () => {
			const { getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000',
				format: 'hsl'
			});

			const input = getByLabelText('Color Field') as HTMLInputElement;
			expect(input.value).toMatch(/hsl\(0, 100%, 50%\)/);
		});
	});

	describe('P3-007-T24: Alpha Channel Support', () => {
		it('should show alpha slider when enabled', async () => {
			const { container } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000',
				props: {
					showAlpha: true
				}
			});

			const alphaSlider = container.querySelector('.color-alpha-input');
			expect(alphaSlider).toBeInTheDocument();
		});

		it('should not show alpha slider when disabled', async () => {
			const { container } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000',
				props: {
					showAlpha: false
				}
			});

			const alphaSlider = container.querySelector('.color-alpha-input');
			expect(alphaSlider).not.toBeInTheDocument();
		});
	});

	describe('P3-007-T24: Accessibility', () => {
		it('should have proper ARIA labels', async () => {
			const { getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000'
			});

			expect(getByLabelText('Color Field')).toBeInTheDocument();
			expect(getByLabelText('Color picker')).toBeInTheDocument();
		});

		it('should support keyboard navigation', async () => {
			const { container } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000'
			});

			const preview = container.querySelector('.color-preview') as HTMLElement;
			preview?.focus();

			await fireEvent.keyDown(preview!, { key: 'Enter' });

			const picker = container.querySelector('.color-picker-overlay');
			expect(picker).toBeInTheDocument();
		});

		it('should close picker with Escape key', async () => {
			const { container } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000'
			});

			const preview = container.querySelector('.color-preview');
			await fireEvent.click(preview!);

			await fireEvent.keyDown(document, { key: 'Escape' });

			expect(container.querySelector('.color-picker-overlay')).not.toBeInTheDocument();
		});
	});

	describe('P3-007-T24: Disabled and Readonly States', () => {
		it('should disable input when disabled prop is true', async () => {
			const { getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000',
				disabled: true
			});

			const input = getByLabelText('Color Field') as HTMLInputElement;
			expect(input.disabled).toBe(true);
		});

		it('should make input readonly when readonly prop is true', async () => {
			const { getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000',
				readonly: true
			});

			const input = getByLabelText('Color Field') as HTMLInputElement;
			expect(input.readOnly).toBe(true);
		});

		it('should disable color picker when disabled', async () => {
			const { container } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000',
				disabled: true
			});

			const preview = container.querySelector('.color-preview');
			await fireEvent.click(preview!);

			const picker = container.querySelector('.color-picker-overlay');
			expect(picker).not.toBeInTheDocument();
		});
	});

	describe('P3-007-T24: Event Handling', () => {
		it('should dispatch change event on input', async () => {
			const mockChange = vi.fn();
			const { getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000',
				onchange: mockChange
			});

			const input = getByLabelText('Color Field') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: '#00FF00' } });

			expect(mockChange).toHaveBeenCalledTimes(1);
			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: '#00FF00' })
			);
		});

		it('should dispatch blur event', async () => {
			const mockBlur = vi.fn();
			const { getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000',
				onblur: mockBlur
			});

			const input = getByLabelText('Color Field');
			await fireEvent.blur(input);

			expect(mockBlur).toHaveBeenCalledTimes(1);
		});

		it('should dispatch focus event', async () => {
			const mockFocus = vi.fn();
			const { getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#FF0000',
				onfocus: mockFocus
			});

			const input = getByLabelText('Color Field');
			await fireEvent.focus(input);

			expect(mockFocus).toHaveBeenCalledTimes(1);
		});
	});

	describe('P3-007-T24: Edge Cases', () => {
		it('should handle empty color value', async () => {
			const { getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: ''
			});

			const input = getByLabelText('Color Field') as HTMLInputElement;
			expect(input.value).toBe('#000000'); // Should default to black
		});

		it('should handle invalid color gracefully', async () => {
			const { getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: 'not-a-color'
			});

			const input = getByLabelText('Color Field') as HTMLInputElement;
			expect(input.value).toBe('#000000'); // Should default to black
		});

		it('should handle 3-digit hex colors', async () => {
			const { getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: '#F00'
			});

			const input = getByLabelText('Color Field') as HTMLInputElement;
			expect(input.value).toBe('#FF0000');
		});

		it('should handle named colors', async () => {
			const { getByLabelText } = await renderWithProps(ColorField, {
				field: mockFields.color,
				value: 'red'
			});

			const input = getByLabelText('Color Field') as HTMLInputElement;
			expect(input.value).toBe('#FF0000');
		});
	});
});