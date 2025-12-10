import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AttachField from '../AttachField.svelte';
import { createMockField, mockFields } from './fixtures/mockFields';
import { createMockFile, createMockEvent } from './fixtures/testUtils';

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
				this.onload(new ProgressEvent('load') as ProgressEvent<FileReader>);
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

describe('AttachField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = mockFields.attach;
		vi.useFakeTimers();
	});

	// P3-007-T21: AttachField renders FileUploader
	it('renders FileUploader component', async () => {
		component = render(AttachField, {
			props: { field, value: [] }
		});
		
		const uploader = screen.getByText(/Drop files here or click to upload/);
		expect(uploader).toBeInTheDocument();
	});

	// Test file upload functionality
	it('handles file selection', async () => {
		component = render(AttachField, {
			props: { field, value: [] }
		});
		
		const file = createMockFile('test.txt', 'text/plain');
		const input = screen.getByRole('button'); // FileUploader uses button
		
		// Simulate file selection
		const fileList = {
			0: file,
			length: 1,
			item: (index: number) => file
		} as any;
		
		// Create a mock change event
		const changeEvent = createMockEvent('change', fileList);
		
		// Get the internal input element
		const fileInput = component.container.querySelector('input[type="file"]');
		if (fileInput) {
			await fireEvent.change(fileInput, { target: { files: fileList } });
		}
		
		// Wait for async operations
		await waitFor(() => {
			expect(screen.getByText('test.txt')).toBeInTheDocument();
		});
	});

	// Test multiple file selection
	it('handles multiple file selection when multiple is true', async () => {
		component = render(AttachField, {
			props: { field, value: [], multiple: true }
		});
		
		const file1 = createMockFile('test1.txt', 'text/plain');
		const file2 = createMockFile('test2.txt', 'text/plain');
		
		const fileList = {
			0: file1,
			1: file2,
			length: 2,
			item: (index: number) => index === 0 ? file1 : file2
		} as any;
		
		const fileInput = component.container.querySelector('input[type="file"]');
		if (fileInput) {
			await fireEvent.change(fileInput, { target: { files: fileList } });
		}
		
		await waitFor(() => {
			expect(screen.getByText('test1.txt')).toBeInTheDocument();
			expect(screen.getByText('test2.txt')).toBeInTheDocument();
		});
	});

	// Test file size validation
	it('validates file size and rejects files that are too large', async () => {
		component = render(AttachField, {
			props: { field, value: [], maxSize: 100 } // 100 bytes
		});
		
		const largeFile = createMockFile('large.txt', 'text/plain', 200);
		const fileList = {
			0: largeFile,
			length: 1,
			item: () => largeFile
		} as any;
		
		const fileInput = component.container.querySelector('input[type="file"]');
		if (fileInput) {
			await fireEvent.change(fileInput, { target: { files: fileList } });
		}
		
		// File should not be added
		await waitFor(() => {
			expect(screen.queryByText('large.txt')).not.toBeInTheDocument();
		});
	});

	// Test file type validation
	it('validates file type when accept is specified', async () => {
		component = render(AttachField, {
			props: { field, value: [], accept: 'image/*' }
		});
		
		const textFile = createMockFile('test.txt', 'text/plain');
		const fileList = {
			0: textFile,
			length: 1,
			item: () => textFile
		} as any;
		
		const fileInput = component.container.querySelector('input[type="file"]');
		if (fileInput) {
			await fireEvent.change(fileInput, { target: { files: fileList } });
		}
		
		// File should not be added
		await waitFor(() => {
			expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
		});
	});

	// Test file removal
	it('removes file when remove button is clicked', async () => {
		const file = createMockFile('test.txt', 'text/plain');
		
		component = render(AttachField, {
			props: { field, value: [file] }
		});
		
		const removeButton = screen.getByRole('button', { name: /remove test.txt/i });
		await fireEvent.click(removeButton);
		
		// File should be removed
		await waitFor(() => {
			expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
		});
	});

	// Test clear all files
	it('clears all files when clear all button is clicked', async () => {
		const file1 = createMockFile('test1.txt', 'text/plain');
		const file2 = createMockFile('test2.txt', 'text/plain');
		
		component = render(AttachField, {
			props: { field, value: [file1, file2] }
		});
		
		const clearButton = screen.getByRole('button', { name: /clear all/i });
		await fireEvent.click(clearButton);
		
		// All files should be removed
		await waitFor(() => {
			expect(screen.queryByText('test1.txt')).not.toBeInTheDocument();
			expect(screen.queryByText('test2.txt')).not.toBeInTheDocument();
		});
	});

	// Test disabled state
	it('disables file upload when disabled prop is true', async () => {
		component = render(AttachField, {
			props: { field, value: [], disabled: true }
		});
		
		const uploader = component.container.querySelector('.disabled-message');
		expect(uploader).toBeInTheDocument();
		expect(screen.getByText(/File upload is disabled/)).toBeInTheDocument();
	});

	// Test readonly state
	it('disables file upload when readonly prop is true', async () => {
		component = render(AttachField, {
			props: { field, value: [], readonly: true }
		});
		
		const uploader = component.container.querySelector('.disabled-message');
		expect(uploader).toBeInTheDocument();
		expect(screen.getByText(/File upload is disabled/)).toBeInTheDocument();
	});

	// Test max files limit
	it('prevents adding more files than maxFiles limit', async () => {
		const file1 = createMockFile('test1.txt', 'text/plain');
		const file2 = createMockFile('test2.txt', 'text/plain');
		const file3 = createMockFile('test3.txt', 'text/plain');
		
		component = render(AttachField, {
			props: { field, value: [file1, file2], maxFiles: 2 }
		});
		
		const fileList = {
			0: file3,
			length: 1,
			item: () => file3
		} as any;
		
		const fileInput = component.container.querySelector('input[type="file"]');
		if (fileInput) {
			await fireEvent.change(fileInput, { target: { files: fileList } });
		}
		
		// File should not be added
		await waitFor(() => {
			expect(screen.queryByText('test3.txt')).not.toBeInTheDocument();
			expect(screen.getByText(/Maximum number of files/)).toBeInTheDocument();
		});
	});

	// Test single file mode
	it('replaces existing file when multiple is false', async () => {
		const file1 = createMockFile('test1.txt', 'text/plain');
		const file2 = createMockFile('test2.txt', 'text/plain');
		
		component = render(AttachField, {
			props: { field, value: [file1], multiple: false }
		});
		
		const fileList = {
			0: file2,
			length: 1,
			item: () => file2
		} as any;
		
		const fileInput = component.container.querySelector('input[type="file"]');
		if (fileInput) {
			await fireEvent.change(fileInput, { target: { files: fileList } });
		}
		
		await waitFor(() => {
			// First file should be replaced
			expect(screen.queryByText('test1.txt')).not.toBeInTheDocument();
			expect(screen.getByText('test2.txt')).toBeInTheDocument();
		});
	});

	// Test drag and drop
	it('handles drag and drop events', async () => {
		component = render(AttachField, {
			props: { field, value: [] }
		});
		
		const dropZone = component.container.querySelector('.attach-field-container');
		expect(dropZone).toBeInTheDocument();
		
		// Test drag over
		await fireEvent.dragOver(dropZone!);
		expect(dropZone).toHaveClass('drag-over');
		
		// Test drag leave
		await fireEvent.dragLeave(dropZone!);
		expect(dropZone).not.toHaveClass('drag-over');
	});

	// Test change event emission
	it('emits change event when files are added', async () => {
		let changeEventFired = false;
		let changeEventValue: File[] | null = null;
		
		component = render(AttachField, {
			props: { field, value: [] }
		});
		
		// Listen for change event
		const unsubscribe = component.$on('change', (event: any) => {
			changeEventFired = true;
			changeEventValue = event.detail;
		});
		
		const file = createMockFile('test.txt', 'text/plain');
		const fileList = {
			0: file,
			length: 1,
			item: () => file
		} as any;
		
		const fileInput = component.container.querySelector('input[type="file"]');
		if (fileInput) {
			await fireEvent.change(fileInput, { target: { files: fileList } });
		}
		
		await waitFor(() => {
			expect(changeEventFired).toBe(true);
			expect(changeEventValue).toEqual([file]);
		});
		
		unsubscribe();
	});

	// Test error event emission
	it('emits error event when validation fails', async () => {
		let errorEventFired = false;
		let errorEventValue: string[] | null = null;
		
		component = render(AttachField, {
			props: { field, value: [], maxSize: 100 }
		});
		
		// Listen for error event
		const unsubscribe = component.$on('error', (event: any) => {
			errorEventFired = true;
			errorEventValue = event.detail;
		});
		
		const largeFile = createMockFile('large.txt', 'text/plain', 200);
		const fileList = {
			0: largeFile,
			length: 1,
			item: () => largeFile
		} as any;
		
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

	// Test file size formatting
	it('displays formatted file sizes', async () => {
		const file = createMockFile('test.txt', 'text/plain', 2048); // 2KB
		
		component = render(AttachField, {
			props: { field, value: [file] }
		});
		
		await waitFor(() => {
			expect(screen.getByText('2 KB')).toBeInTheDocument();
		});
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({ 
			fieldtype: 'Attach', 
			required: true 
		});
		
		component = render(AttachField, {
			props: { field: requiredField, value: [] }
		});
		
		const label = screen.getByText('Attach Field *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(AttachField, {
			props: { field, value: [], error: 'File upload failed' }
		});
		
		const errorMessage = screen.getByText('File upload failed');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({ 
			fieldtype: 'Attach', 
			description: 'Upload your documents here' 
		});
		
		component = render(AttachField, {
			props: { field: fieldWithDescription, value: [] }
		});
		
		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test file upload progress
	it('shows upload progress for files', async () => {
		const file = createMockFile('test.txt', 'text/plain');
		
		component = render(AttachField, {
			props: { field, value: [] }
		});
		
		const fileList = {
			0: file,
			length: 1,
			item: () => file
		} as any;
		
		const fileInput = component.container.querySelector('input[type="file"]');
		if (fileInput) {
			await fireEvent.change(fileInput, { target: { files: fileList } });
		}
		
		// Progress bar should be visible initially
		await waitFor(() => {
			const progressBar = component.container.querySelector('.progress-bar');
			expect(progressBar).toBeInTheDocument();
		});
		
		// Fast forward timers to complete progress
		vi.advanceTimersByTime(1000);
		
		await waitFor(() => {
			// Progress should be complete
			expect(screen.getByText('test.txt')).toBeInTheDocument();
		});
	});
});