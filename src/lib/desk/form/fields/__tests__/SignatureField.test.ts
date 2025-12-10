import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import SignatureField from '../SignatureField.svelte';
import { renderWithProps, createMockEvent, createMockKeyboardEvent } from './fixtures/testUtils';
import { mockFields } from './fixtures/mockFields';

describe('SignatureField', () => {
	let mockCanvas: HTMLCanvasElement;
	let mockContext: CanvasRenderingContext2D;

	beforeEach(() => {
		vi.clearAllMocks();
		
		// Mock canvas and context
		mockCanvas = document.createElement('canvas');
		mockContext = {
			clearRect: vi.fn(),
			fillRect: vi.fn(),
			beginPath: vi.fn(),
			moveTo: vi.fn(),
			lineTo: vi.fn(),
			stroke: vi.fn(),
			getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
			putImageData: vi.fn(),
			drawImage: vi.fn()
		} as any;

		// Mock HTMLCanvasElement methods
		Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
			value: () => mockContext,
			writable: true
		});

		// Mock toDataURL
		Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
			value: () => 'data:image/png;base64,mock-signature-data',
			writable: true
		});

		// Mock createObjectURL for download
		global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
		global.URL.revokeObjectURL = vi.fn();
	});

	describe('P3-007-T26: Signature Field Basic Functionality', () => {
		it('should render signature field with label', async () => {
			const { getByText } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: ''
			});

			expect(getByText(mockFields.signature.label)).toBeInTheDocument();
		});

		it('should render canvas with correct dimensions', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: '',
				width: 400,
				height: 200
			});

			const canvas = container.querySelector('.signature-canvas') as HTMLCanvasElement;
			expect(canvas.width).toBe(400);
			expect(canvas.height).toBe(200);
		});

		it('should display placeholder when empty', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: ''
			});

			const placeholder = container.querySelector('.signature-placeholder');
			expect(placeholder).toBeInTheDocument();
			expect(placeholder?.textContent).toContain('Click or touch to sign');
		});

		it('should display error message when error is provided', async () => {
			const { getByText } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: '',
				error: 'Signature is required'
			});

			expect(getByText('Signature is required')).toBeInTheDocument();
		});
	});

	describe('P3-007-T26: Drawing Functionality', () => {
		it('should start drawing on mouse down', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: ''
			});

			const canvas = container.querySelector('.signature-canvas') as HTMLCanvasElement;
			const rect = canvas.getBoundingClientRect();
			
			await fireEvent.mouseDown(canvas, {
				clientX: rect.left + 50,
				clientY: rect.top + 50
			});

			expect(mockContext.beginPath).toHaveBeenCalled();
			expect(mockContext.moveTo).toHaveBeenCalledWith(50, 50);
		});

		it('should draw on mouse move', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: ''
			});

			const canvas = container.querySelector('.signature-canvas') as HTMLCanvasElement;
			const rect = canvas.getBoundingClientRect();
			
			// Start drawing
			await fireEvent.mouseDown(canvas, {
				clientX: rect.left + 50,
				clientY: rect.top + 50
			});

			// Move mouse
			await fireEvent.mouseMove(canvas, {
				clientX: rect.left + 100,
				clientY: rect.top + 100
			});

			expect(mockContext.lineTo).toHaveBeenCalledWith(100, 100);
			expect(mockContext.stroke).toHaveBeenCalled();
		});

		it('should stop drawing on mouse up', async () => {
			const mockChange = vi.fn();
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: '',
				onchange: mockChange
			});

			const canvas = container.querySelector('.signature-canvas') as HTMLCanvasElement;
			const rect = canvas.getBoundingClientRect();
			
			// Draw something
			await fireEvent.mouseDown(canvas, {
				clientX: rect.left + 50,
				clientY: rect.top + 50
			});
			await fireEvent.mouseMove(canvas, {
				clientX: rect.left + 100,
				clientY: rect.top + 100
			});
			await fireEvent.mouseUp(canvas);

			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: 'data:image/png;base64,mock-signature-data' })
			);
		});

		it('should handle mouse leave', async () => {
			const mockChange = vi.fn();
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: '',
				onchange: mockChange
			});

			const canvas = container.querySelector('.signature-canvas') as HTMLCanvasElement;
			const rect = canvas.getBoundingClientRect();
			
			// Start drawing
			await fireEvent.mouseDown(canvas, {
				clientX: rect.left + 50,
				clientY: rect.top + 50
			});
			await fireEvent.mouseMove(canvas, {
				clientX: rect.left + 100,
				clientY: rect.top + 100
			});
			await fireEvent.mouseLeave(canvas);

			expect(mockChange).toHaveBeenCalled();
		});
	});

	describe('P3-007-T26: Touch Support', () => {
		it('should start drawing on touch start', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: ''
			});

			const canvas = container.querySelector('.signature-canvas') as HTMLCanvasElement;
			const rect = canvas.getBoundingClientRect();
			const touch = new Touch({
				identifier: 0,
				target: canvas,
				clientX: rect.left + 50,
				clientY: rect.top + 50
			} as any);

			await fireEvent.touchStart(canvas, {
				touches: [touch]
			});

			expect(mockContext.beginPath).toHaveBeenCalled();
			expect(mockContext.moveTo).toHaveBeenCalled();
		});

		it('should draw on touch move', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: ''
			});

			const canvas = container.querySelector('.signature-canvas') as HTMLCanvasElement;
			const rect = canvas.getBoundingClientRect();
			const touch = new Touch({
				identifier: 0,
				target: canvas,
				clientX: rect.left + 100,
				clientY: rect.top + 100
			} as any);

			await fireEvent.touchMove(canvas, {
				touches: [touch]
			});

			expect(mockContext.lineTo).toHaveBeenCalled();
			expect(mockContext.stroke).toHaveBeenCalled();
		});

		it('should stop drawing on touch end', async () => {
			const mockChange = vi.fn();
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: '',
				onchange: mockChange
			});

			const canvas = container.querySelector('.signature-canvas') as HTMLCanvasElement;
			const touch = new Touch({
				identifier: 0,
				target: canvas
			} as any);

			await fireEvent.touchEnd(canvas, {
				changedTouches: [touch]
			});

			expect(mockChange).toHaveBeenCalled();
		});
	});

	describe('P3-007-T26: Clear Functionality', () => {
		it('should clear signature when clear button is clicked', async () => {
			const mockChange = vi.fn();
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: 'data:image/png;base64,mock-signature-data',
				onchange: mockChange
			});

			const clearButton = container.querySelector('[icon-description="Clear signature"]');
			await fireEvent.click(clearButton!);

			expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 400, 200);
			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: '' })
			);
		});

		it('should not clear when disabled', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: 'data:image/png;base64,mock-signature-data',
				disabled: true
			});

			const clearButton = container.querySelector('[icon-description="Clear signature"]');
			expect(clearButton).toBeDisabled();
		});
	});

	describe('P3-007-T26: Download Functionality', () => {
		it('should show download button when enabled', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: 'data:image/png;base64,mock-signature-data',
				showDownloadButton: true
			});

			const downloadButton = container.querySelector('[icon-description="Download signature"]');
			expect(downloadButton).toBeInTheDocument();
		});

		it('should not show download button when disabled', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: 'data:image/png;base64,mock-signature-data',
				showDownloadButton: false
			});

			const downloadButton = container.querySelector('[icon-description="Download signature"]');
			expect(downloadButton).not.toBeInTheDocument();
		});

		it('should download signature when button is clicked', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: 'data:image/png;base64,mock-signature-data',
				showDownloadButton: true
			});

			const downloadButton = container.querySelector('[icon-description="Download signature"]');
			await fireEvent.click(downloadButton!);

			expect(global.URL.createObjectURL).toHaveBeenCalled();
		});
	});

	describe('P3-007-T26: Format Support', () => {
		it('should export as PNG by default', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: '',
				format: 'png'
			});

			const canvas = container.querySelector('.signature-canvas') as HTMLCanvasElement;
			const toDataURLSpy = vi.spyOn(canvas, 'toDataURL');
			
			// Trigger save
			await fireEvent.mouseUp(canvas);

			expect(toDataURLSpy).toHaveBeenCalledWith('image/png');
		});

		it('should export as JPEG when specified', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: '',
				format: 'jpeg'
			});

			const canvas = container.querySelector('.signature-canvas') as HTMLCanvasElement;
			const toDataURLSpy = vi.spyOn(canvas, 'toDataURL');
			
			// Trigger save
			await fireEvent.mouseUp(canvas);

			expect(toDataURLSpy).toHaveBeenCalledWith('image/jpeg', 0.9);
		});

		it('should export as SVG when specified', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: '',
				format: 'svg'
			});

			const canvas = container.querySelector('.signature-canvas') as HTMLCanvasElement;
			const toDataURLSpy = vi.spyOn(canvas, 'toDataURL');
			
			// Trigger save
			await fireEvent.mouseUp(canvas);

			expect(toDataURLSpy).toHaveBeenCalled();
		});
	});

	describe('P3-007-T26: Accessibility', () => {
		it('should have proper ARIA attributes', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: ''
			});

			const canvas = container.querySelector('.signature-canvas');
			expect(canvas).toHaveAttribute('role', 'img');
			expect(canvas).toHaveAttribute('aria-label', 'Signature canvas');
			expect(canvas).toHaveAttribute('tabindex', '0');
		});

		it('should support keyboard navigation', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: 'data:image/png;base64,mock-signature-data'
			});

			const canvas = container.querySelector('.signature-canvas') as HTMLCanvasElement;
			const clearSpy = vi.spyOn(mockContext, 'clearRect');
			
			await fireEvent.keyDown(canvas, { key: 'Delete' });
			expect(clearSpy).toHaveBeenCalled();

			await fireEvent.keyDown(canvas, { key: 'Backspace' });
			expect(clearSpy).toHaveBeenCalledTimes(2);
		});

		it('should be keyboard focusable', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: ''
			});

			const canvas = container.querySelector('.signature-canvas');
			expect(canvas).toHaveAttribute('tabindex', '0');
		});
	});

	describe('P3-007-T26: Disabled and Readonly States', () => {
		it('should disable canvas when disabled', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: '',
				disabled: true
			});

			const canvas = container.querySelector('.signature-canvas') as HTMLCanvasElement;
			expect(canvas).toHaveClass('disabled');
			expect(canvas).toHaveAttribute('tabindex', '-1');
		});

		it('should disable canvas when readonly', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: '',
				readonly: true
			});

			const canvas = container.querySelector('.signature-canvas') as HTMLCanvasElement;
			expect(canvas).toHaveClass('disabled');
			expect(canvas).toHaveAttribute('tabindex', '-1');
		});

		it('should not respond to mouse events when disabled', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: '',
				disabled: true
			});

			const canvas = container.querySelector('.signature-canvas') as HTMLCanvasElement;
			await fireEvent.mouseDown(canvas);

			expect(mockContext.beginPath).not.toHaveBeenCalled();
		});
	});

	describe('P3-007-T26: Event Handling', () => {
		it('should dispatch change event on signature', async () => {
			const mockChange = vi.fn();
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: '',
				onchange: mockChange
			});

			const canvas = container.querySelector('.signature-canvas') as HTMLCanvasElement;
			await fireEvent.mouseUp(canvas);

			expect(mockChange).toHaveBeenCalledTimes(1);
			expect(mockChange).toHaveBeenCalledWith(
				expect.objectContaining({ detail: 'data:image/png;base64,mock-signature-data' })
			);
		});

		it('should dispatch blur event', async () => {
			const mockBlur = vi.fn();
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: '',
				onblur: mockBlur
			});

			const canvas = container.querySelector('.signature-canvas');
			if (canvas) {
				await fireEvent.blur(canvas);
			}

			expect(mockBlur).toHaveBeenCalledTimes(1);
		});

		it('should dispatch focus event', async () => {
			const mockFocus = vi.fn();
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: '',
				onfocus: mockFocus
			});

			const canvas = container.querySelector('.signature-canvas');
			if (canvas) {
				await fireEvent.focus(canvas);
			}

			expect(mockFocus).toHaveBeenCalledTimes(1);
		});
	});

	describe('P3-007-T26: Signature Preview', () => {
		it('should show preview when signature exists', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: 'data:image/png;base64,mock-signature-data'
			});

			const preview = container.querySelector('.signature-preview');
			expect(preview).toBeInTheDocument();

			const previewImage = container.querySelector('.preview-image');
			expect(previewImage).toHaveAttribute('src', 'data:image/png;base64,mock-signature-data');
		});

		it('should not show preview when no signature', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: ''
			});

			const preview = container.querySelector('.signature-preview');
			expect(preview).not.toBeInTheDocument();
		});

		it('should show signature status when signature exists', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: 'data:image/png;base64,mock-signature-data'
			});

			const statusText = container.querySelector('.status-text');
			const statusIcon = container.querySelector('.status-icon');
			
			expect(statusText?.textContent).toBe('Signature captured');
			expect(statusIcon).toBeInTheDocument();
		});
	});

	describe('P3-007-T26: Edge Cases', () => {
		it('should handle empty signature data', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: ''
			});

			const placeholder = container.querySelector('.signature-placeholder');
			expect(placeholder).toBeInTheDocument();
		});

		it('should handle invalid signature data', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: 'invalid-data'
			});

			const preview = container.querySelector('.signature-preview');
			expect(preview).toBeInTheDocument();
		});

		it('should handle custom pen settings', async () => {
			const { container } = await renderWithProps(SignatureField, {
				field: mockFields.signature,
				value: '',
				penColor: '#FF0000',
				penWidth: 3
			});

			const canvas = container.querySelector('.signature-canvas') as HTMLCanvasElement;
			await fireEvent.mouseDown(canvas);

			expect(mockContext.strokeStyle).toBe('#FF0000');
			expect(mockContext.lineWidth).toBe(3);
		});
	});
});