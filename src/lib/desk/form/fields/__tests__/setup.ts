import { expect, vi, beforeAll, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import { vi as vitestVi } from 'vitest';

// Extend vitest expect with jest-dom matchers
declare global {
	namespace Vi {
		interface JestAssertion<T = any>
			extends TestingLibraryMatchers<T, void> {}
	}
}

// Configure Svelte 5 for testing
beforeAll(() => {
	// Force client-side mode for Svelte 5
	(globalThis as any).__SVELTEKIT_DEV__ = true;
	(globalThis as any).__SVELTEKIT_BROWSER__ = true;
	(globalThis as any).__SVELTEKIT_SSR__ = false;
	
	// Mock ResizeObserver
	global.ResizeObserver = vi.fn().mockImplementation(() => ({
		observe: vi.fn(),
		unobserve: vi.fn(),
		disconnect: vi.fn(),
	}));

	// Mock window.matchMedia
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});

	// Mock getComputedStyle
	Object.defineProperty(window, 'getComputedStyle', {
		value: vi.fn().mockImplementation((element) => ({
			color: element?.style?.color || 'rgb(0, 0, 0)',
			getPropertyValue: vi.fn().mockReturnValue(''),
		})),
	});

	// Mock HTMLElement.prototype.scrollIntoView
	HTMLElement.prototype.scrollIntoView = vi.fn();
	
	// Mock document.body for color conversion
	if (!document.body) {
		document.body = document.createElement('body');
	}
});

// Clean up after each test
afterEach(() => {
	// Reset DOM between tests
	document.body.innerHTML = '';
});