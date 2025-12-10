import { render } from '@testing-library/svelte';
import type { DocField } from '../../../../../meta/doctype/types';
import { createMockField } from './mockFields';

interface RenderOptions {
	field?: any;
	value?: string;
	error?: string | string[];
	disabled?: boolean;
	readonly?: boolean;
	required?: boolean;
	description?: string;
	hideLabel?: boolean;
	width?: number;
	height?: number;
	format?: string;
	penColor?: string;
	penWidth?: number;
	showDownloadButton?: boolean;
	showStrengthIndicator?: boolean;
	minLength?: number;
	requireUppercase?: boolean;
	requireLowercase?: boolean;
	requireNumbers?: boolean;
	requireSpecialChars?: boolean;
	maxRating?: number;
	allowHalfStars?: boolean;
	showValue?: boolean;
	size?: 'small' | 'medium' | 'large';
	onchange?: (event: any) => void;
	onblur?: (event: any) => void;
	onfocus?: (event: any) => void;
	props?: Record<string, any>;
	target?: HTMLElement;
	context?: Map<any, any>;
}

/**
 * Renders a component with default props for field testing
 * Updated for Svelte 5 compatibility
 */
export async function renderWithProps(
	component: any,
	options: RenderOptions = {}
) {
	const defaultProps = {
		field: options.field || createMockField(),
		value: '',
		error: '',
		disabled: false,
		readonly: false,
		required: false,
		description: '',
		hideLabel: false,
		...options.props
	};

	// Ensure we have a proper document body for testing
	if (!document.body) {
		document.body = document.createElement('body');
	}

	// Force client-side rendering for Svelte 5
	const target = options.target || document.body;
	
	// Set global flags to force client-side mode
	(globalThis as any).__SVELTEKIT_SSR__ = false;
	(globalThis as any).__SVELTEKIT_BROWSER__ = true;
	
	return render(component, {
		props: defaultProps,
		target,
		context: options.context
	});
}

/**
 * Creates a mock file for testing file uploads
 */
export function createMockFile(name: string, type: string, size: number = 1024): File {
	const buffer = new ArrayBuffer(size);
	const view = new Uint8Array(buffer);
	
	// Fill with some random data
	for (let i = 0; i < size; i++) {
		view[i] = Math.floor(Math.random() * 256);
	}
	
	return new File([buffer], name, { type });
}

/**
 * Creates a mock image file for testing image uploads
 */
export async function createMockImageFile(name: string = 'test.jpg', width: number = 100, height: number = 100): Promise<File> {
	// Create a simple canvas and convert to blob
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	
	const ctx = canvas.getContext('2d');
	if (ctx) {
		// Draw a simple colored rectangle
		ctx.fillStyle = '#FF0000';
		ctx.fillRect(0, 0, width, height);
	}
	
	return new Promise<File>((resolve) => {
		canvas.toBlob((blob) => {
			if (blob) {
				resolve(new File([blob], name, { type: 'image/jpeg' }));
			} else {
				// Fallback to empty file
				resolve(createMockFile(name, 'image/jpeg'));
			}
		}, 'image/jpeg');
	});
}

/**
 * Creates a mock event for testing
 */
export function createMockEvent(type: string, detail: any = {}): CustomEvent {
	return new CustomEvent(type, { detail });
}

/**
 * Creates a mock keyboard event
 */
export function createMockKeyboardEvent(
	type: string,
	key: string,
	options: KeyboardEventInit = {}
): KeyboardEvent {
	return new KeyboardEvent(type, {
		key,
		bubbles: true,
		cancelable: true,
		...options
	});
}

/**
 * Creates a mock mouse event
 */
export function createMockMouseEvent(
	type: string,
	options: MouseEventInit = {}
): MouseEvent {
	return new MouseEvent(type, {
		bubbles: true,
		cancelable: true,
		...options
	});
}

/**
 * Creates a mock focus event
 */
export function createMockFocusEvent(
	type: string,
	options: FocusEventInit = {}
): FocusEvent {
	return new FocusEvent(type, {
		bubbles: true,
		cancelable: true,
		...options
	});
}

/**
 * Waits for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Waits for the next tick
 */
export function nextTick(): Promise<void> {
	return new Promise(resolve => {
		setTimeout(resolve, 0);
	});
}

/**
 * Creates a mock DOM element
 */
export function createMockElement(tagName: string, attributes: Record<string, string> = {}): HTMLElement {
	const element = document.createElement(tagName);
	
	Object.entries(attributes).forEach(([key, value]) => {
		element.setAttribute(key, value);
	});
	
	return element;
}