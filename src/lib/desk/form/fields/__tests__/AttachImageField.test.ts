import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AttachImageField from '../AttachImageField.svelte';
import { createMockField, mockFields } from './fixtures/mockFields';
import { createMockFile, createMockImageFile, createMockEvent } from './fixtures/testUtils';

// Mock FileReader
global.FileReader = class {
	constructor() {
		this.readyState = 0;
		this.result = null;
	}
	readyState: number;
	result: string | ArrayBuffer | null;
	onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
	onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
	readAsDataURL(file: File): void {
		// Simulate successful read
		setTimeout(() => {
			this.result = 'data:image/jpeg;base64,mockdata';
			this.readyState = 2;
			if (this.onload) {
				this.onload(new ProgressEvent('load') as any);
			}
		}, 0);
	}
	abort(): void {}
	readAsArrayBuffer(file: File): void {}
	readAsBinaryString(file: File): void {}
	readAsText(file: File): void {}
	addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {}
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {}
	dispatchEvent(event: Event): boolean {
		return true;
	}
} as any;

// Mock HTMLImageElement
global.Image = class {
	constructor() {
		setTimeout(() => {
			this.width = 100;
			this.height = 100;
			if (this.onload) {
				this.onload(new Event('load'));
			}
		}, 0);
	}
	width: number = 0;
	height: number = 0;
	src: string = '';
	onload: ((event: Event) => void) | null = null;
	onerror: ((event: Event) => void) | null = null;
} as any;

// Mock HTMLCanvasElement
global.HTMLCanvasElement = class {
	constructor() {
		this.width = 0;
		this.height = 0;
		this.getContext = vi.fn().mockReturnValue({
			drawImage: vi.fn(),
			toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,croppeddata'),
			toBlob: vi.fn().mockImplementation((callback) => {
				callback(new Blob(['croppeddata'], { type: 'image/jpeg' }));
			})
		});
	}
	width: number;
	height: number;
	getContext: any;
	toDataURL: any;
	toBlob: any;
} as any;

describe('AttachImageField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = mockFields.attachImage;
		vi.useFakeTimers();
	});

	// P3-007-T22: AttachImageField renders FileUploader for images
	it('renders FileUploader component for image upload', async () => {
		component = render(AttachImageField, {
			props: { field, value: null }
		});
		
		const uploader = screen.getByText(/Drop image here or click to upload/);
		expect(uploader).toBeInTheDocument();
	});

	// Test image upload functionality
	it('handles image file selection', async () => {
		component = render(AttachImageField, {
			props: { field, value: null }
		});
		
		const imageFile = await createMockImageFile('test.jpg');
		const fileList = {
			0: imageFile,
			length: 1,
			item: () => imageFile
		} as any;
		
		const fileInput = component.container.querySelector('input[type="file"]');
		if (fileInput) {
			await fireEvent.change(fileInput, { target: { files: fileList } });
		}
		
		// Wait for image preview to load
		await waitFor(() => {
			const previewImage = screen.getByAltText('Preview');
			expect(previewImage).toBeInTheDocument();
		});
	});

	// Test image type validation
	it('validates file type and rejects non-image files', async () => {
		component = render(AttachImageField, {
			props: { field, value: null }
		});
		
		const textFile = createMockFile('test.txt', 'text/plain');
		const fileList = {
			0: textFile,
			length: 1,
			item: () => textFile
		} as any;
		
		// Listen for error event
		let errorEventFired = false;
		let errorEventValue: string[] | null = null;
		const unsubscribe = component.$on('error', (event: any) => {
			errorEventFired = true;
			errorEventValue = event.detail;
		});
		
		const fileInput = component.container.querySelector('input[type="file"]');
		if (fileInput) {
			await fireEvent.change(fileInput, { target: { files: fileList } });
		}
		
		await waitFor(() => {
			expect(errorEventFired).toBe(true);
			expect(errorEventValue).toContain('Please select an image file');
		});
		
		unsubscribe();
	});

	// Test image size validation
	it('validates image size and rejects files that are too large', async () => {
		component = render(AttachImageField, {
			props: { field, value: null, maxSize: 100 } // 100 bytes
		});
		
		const largeImageFile = await createMockImageFile('large.jpg');
		const largeFile = new File([await largeImageFile.arrayBuffer()], 'large.jpg', { 
			type: 'image/jpeg' 
		});
		
		const fileList = {
			0: largeFile,
			length: 1,
			item: () => largeFile
		} as any;
		
		// Listen for error event
		let errorEventFired = false;
		let errorEventValue: string[] | null = null;
		const unsubscribe = component.$on('error', (event: any) => {
			errorEventFired = true;
			errorEventValue = event.detail;
		});
		
		const fileInput = component.container.querySelector('input[type="file"]');
		if (fileInput) {
			await fireEvent.change(fileInput, { target: { files: fileList } });
		}
		
		await waitFor(() => {
			expect(errorEventFired).toBe(true);
			expect(errorEventValue).toContain('exceeds maximum size');
		});
		
		unsubscribe();
	});

	// Test image preview
	it('displays image preview after upload', async () => {
		const imageFile = await createMockImageFile('test.jpg');
		
		component = render(AttachImageField, {
			props: { field, value: imageFile }
		});
		
		await waitFor(() => {
			const previewImage = screen.getByAltText('Preview');
			expect(previewImage).toBeInTheDocument();
			expect(previewImage).toHaveAttribute('src', 'data:image/jpeg;base64,mockdata');
		});
	});

	// Test crop functionality
	it('opens crop modal when crop button is clicked', async () => {
		const imageFile = await createMockImageFile('test.jpg');
		
		component = render(AttachImageField, {
			props: { field, value: imageFile, enableCrop: true }
		});
		
		await waitFor(() => {
			const cropButton = screen.getByRole('button', { name: /crop image/i });
			expect(cropButton).toBeInTheDocument();
		});
		
		const cropButton = screen.getByRole('button', { name: /crop image/i });
		await fireEvent.click(cropButton);
		
		await waitFor(() => {
			expect(screen.getByText('Crop Image')).toBeInTheDocument();
		});
	});

	// Test zoom functionality
	it('provides zoom controls in crop modal', async () => {
		const imageFile = await createMockImageFile('test.jpg');
		
		component = render(AttachImageField, {
			props: { field, value: imageFile, enableCrop: true, enableZoom: true }
		});
		
		await waitFor(() => {
			const cropButton = screen.getByRole('button', { name: /crop image/i });
			fireEvent.click(cropButton);
		});
		
		await waitFor(() => {
			const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
			const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });
			expect(zoomInButton).toBeInTheDocument();
			expect(zoomOutButton).toBeInTheDocument();
		});
	});

	// Test image removal
	it('removes image when remove button is clicked', async () => {
		const imageFile = await createMockImageFile('test.jpg');
		
		component = render(AttachImageField, {
			props: { field, value: imageFile }
		});
		
		await waitFor(() => {
			const removeButton = screen.getByRole('button', { name: /remove image/i });
			expect(removeButton).toBeInTheDocument();
		});
		
		const removeButton = screen.getByRole('button', { name: /remove image/i });
		await fireEvent.click(removeButton);
		
		// Image should be removed
		await waitFor(() => {
			expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
		});
	});

	// Test image download
	it('downloads image when download button is clicked', async () => {
		const imageFile = await createMockImageFile('test.jpg');
		
		// Mock document.createElement and link functionality
		const mockLink = {
			href: '',
			download: '',
			click: vi.fn(),
			style: { display: '' }
		};
		const mockCreateElement = vi.fn().mockReturnValue(mockLink);
		const mockAppendChild = vi.fn();
		const mockRemoveChild = vi.fn();
		
		Object.defineProperty(document, 'createElement', {
			value: mockCreateElement,
			writable: true
		});
		Object.defineProperty(document.body, 'appendChild', {
			value: mockAppendChild,
			writable: true
		});
		Object.defineProperty(document.body, 'removeChild', {
			value: mockRemoveChild,
			writable: true
		});
		
		component = render(AttachImageField, {
			props: { field, value: imageFile }
		});
		
		await waitFor(() => {
			const downloadButton = screen.getByRole('button', { name: /download image/i });
			expect(downloadButton).toBeInTheDocument();
		});
		
		const downloadButton = screen.getByRole('button', { name: /download image/i });
		await fireEvent.click(downloadButton);
		
		expect(mockCreateElement).toHaveBeenCalledWith('a');
		expect(mockLink.click).toHaveBeenCalled();
	});

	// Test disabled state
	it('disables image upload when disabled prop is true', async () => {
		component = render(AttachImageField, {
			props: { field, value: null, disabled: true }
		});
		
		const uploader = component.container.querySelector('.disabled-message');
		expect(uploader).toBeInTheDocument();
		expect(screen.getByText(/Image upload is disabled/)).toBeInTheDocument();
	});

	// Test readonly state
	it('disables image upload when readonly prop is true', async () => {
		component = render(AttachImageField, {
			props: { field, value: null, readonly: true }
		});
		
		const uploader = component.container.querySelector('.disabled-message');
		expect(uploader).toBeInTheDocument();
		expect(screen.getByText(/Image upload is disabled/)).toBeInTheDocument();
	});

	// Test crop disabled
	it('hides crop button when enableCrop is false', async () => {
		const imageFile = await createMockImageFile('test.jpg');
		
		component = render(AttachImageField, {
			props: { field, value: imageFile, enableCrop: false }
		});
		
		await waitFor(() => {
			const cropButton = screen.queryByRole('button', { name: /crop image/i });
			expect(cropButton).not.toBeInTheDocument();
		});
	});

	// Test zoom disabled
	it('hides zoom controls when enableZoom is false', async () => {
		const imageFile = await createMockImageFile('test.jpg');
		
		component = render(AttachImageField, {
			props: { field, value: imageFile, enableCrop: true, enableZoom: false }
		});
		
		await waitFor(() => {
			const cropButton = screen.getByRole('button', { name: /crop image/i });
			fireEvent.click(cropButton);
		});
		
		await waitFor(() => {
			const zoomInButton = screen.queryByRole('button', { name: /zoom in/i });
			const zoomOutButton = screen.queryByRole('button', { name: /zoom out/i });
			expect(zoomInButton).not.toBeInTheDocument();
			expect(zoomOutButton).not.toBeInTheDocument();
		});
	});

	// Test change event emission
	it('emits change event when image is uploaded', async () => {
		let changeEventFired = false;
		let changeEventValue: File | null = null;
		
		component = render(AttachImageField, {
			props: { field, value: null }
		});
		
		// Listen for change event
		const unsubscribe = component.$on('change', (event: any) => {
			changeEventFired = true;
			changeEventValue = event.detail;
		});
		
		const imageFile = await createMockImageFile('test.jpg');
		const fileList = {
			0: imageFile,
			length: 1,
			item: () => imageFile
		} as any;
		
		const fileInput = component.container.querySelector('input[type="file"]');
		if (fileInput) {
			await fireEvent.change(fileInput, { target: { files: fileList } });
		}
		
		await waitFor(() => {
			expect(changeEventFired).toBe(true);
			expect(changeEventValue).toBe(imageFile);
		});
		
		unsubscribe();
	});

	// Test crop application
	it('applies crop and updates image when apply crop is clicked', async () => {
		const imageFile = await createMockImageFile('test.jpg');
		
		component = render(AttachImageField, {
			props: { field, value: imageFile, enableCrop: true }
		});
		
		await waitFor(() => {
			const cropButton = screen.getByRole('button', { name: /crop image/i });
			fireEvent.click(cropButton);
		});
		
		await waitFor(() => {
			const applyButton = screen.getByRole('button', { name: /apply crop/i });
			expect(applyButton).toBeInTheDocument();
		});
		
		const applyButton = screen.getByRole('button', { name: /apply crop/i });
		await fireEvent.click(applyButton);
		
		// Modal should close
		await waitFor(() => {
			expect(screen.queryByText('Crop Image')).not.toBeInTheDocument();
		});
	});

	// Test image info display
	it('displays image name and size', async () => {
		const imageFile = await createMockImageFile('test-image.jpg');
		
		component = render(AttachImageField, {
			props: { field, value: imageFile }
		});
		
		await waitFor(() => {
			expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
			// File size should be displayed
			const sizeElement = screen.getByText(/\d+\.\d+ [KM]B/);
			expect(sizeElement).toBeInTheDocument();
		});
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({ 
			fieldtype: 'Attach Image', 
			required: true 
		});
		
		component = render(AttachImageField, {
			props: { field: requiredField, value: null }
		});
		
		const label = screen.getByText('Attach Image Field *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(AttachImageField, {
			props: { field, value: null, error: 'Image upload failed' }
		});
		
		const errorMessage = screen.getByText('Image upload failed');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({ 
			fieldtype: 'Attach Image', 
			description: 'Upload your image here' 
		});
		
		component = render(AttachImageField, {
			props: { field: fieldWithDescription, value: null }
		});
		
		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test crop modal close
	it('closes crop modal when cancel button is clicked', async () => {
		const imageFile = await createMockImageFile('test.jpg');
		
		component = render(AttachImageField, {
			props: { field, value: imageFile, enableCrop: true }
		});
		
		await waitFor(() => {
			const cropButton = screen.getByRole('button', { name: /crop image/i });
			fireEvent.click(cropButton);
		});
		
		await waitFor(() => {
			const cancelButton = screen.getByRole('button', { name: /cancel/i });
			expect(cancelButton).toBeInTheDocument();
		});
		
		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);
		
		// Modal should close
		await waitFor(() => {
			expect(screen.queryByText('Crop Image')).not.toBeInTheDocument();
		});
	});
});