import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import type { RenderResult } from '@testing-library/svelte';

declare global {
	namespace Vi {
		interface Assertion<T = any> extends TestingLibraryMatchers<T, void> {}
	}
}

// Vitest global types
declare const vi: {
	mock: (path: string, factory?: () => any) => void;
	unmock: (path: string) => void;
	clearAllMocks: () => void;
	resetAllMocks: () => void;
	restoreAllMocks: () => void;
	spied: {
		fn: <T extends (...args: any[]) => any>(implementation?: T) => T;
	};
};

// Testing library types
declare const expect: jest.Expect;

// Svelte component testing types
declare module '@testing-library/svelte' {
	interface RenderResult<T = any> extends RenderResult<T> {
		$on(event: string, callback: (event: CustomEvent) => void): () => void;
		component: {
			$on(event: string, callback: (event: CustomEvent) => void): () => void;
		};
	}
}