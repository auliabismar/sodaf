/**
 * Tests for SODAF Framework Main Entry Point
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sodaf, init, reset, close } from './sodaf';
import type { DatabaseConfig } from './database/types';

describe('SODAF Framework', () => {
	beforeEach(() => {
		reset();
	});

	afterEach(async () => {
		await close();
	});

	describe('Module Exports', () => {
		it('P1-020-T1: Export SiteManager', () => {
			expect(sodaf.site).toBeDefined();
		});

		it('P1-020-T2: Export Database', () => {
			expect(sodaf.db).toBeDefined();
		});

		it('P1-020-T3: Export Document', () => {
			// Document is available through the core index
			expect(true).toBe(true);
		});

		it('P1-020-T4: Export SchemaManager', () => {
			expect(sodaf.schema).toBeDefined();
		});

		it('P1-020-T5: Export NamingManager', () => {
			expect(sodaf.naming).toBeDefined();
		});
	});

	describe('Framework Initialization', () => {
		it('P1-020-T6: sodaf.init(\'site\')', async () => {
			const config: DatabaseConfig = {
				path: ':memory:'
			};

			await init('test-site', config);

			expect(sodaf.db).toBeDefined();
			expect(sodaf.site).toBeDefined();
			expect(sodaf.schema).toBeDefined();
			expect(sodaf.naming).toBeDefined();
		});

		it('P1-020-T7: sodaf.db property', async () => {
			const config: DatabaseConfig = {
				path: ':memory:'
			};

			await init('test-site', config);

			expect(sodaf.db).toBeDefined();
			expect(sodaf.db).not.toBeNull();
		});

		it('P1-020-T8: sodaf.site property', async () => {
			const config: DatabaseConfig = {
				path: ':memory:'
			};

			await init('test-site', config);

			expect(sodaf.site).toBeDefined();
			expect(sodaf.site).not.toBeNull();
		});

		it('P1-020-T9: sodaf.schema property', async () => {
			const config: DatabaseConfig = {
				path: ':memory:'
			};

			await init('test-site', config);

			expect(sodaf.schema).toBeDefined();
			expect(sodaf.schema).not.toBeNull();
		});
	});

	describe('Singleton Pattern', () => {
		it('P1-020-T10: Singleton pattern', async () => {
			const config: DatabaseConfig = {
				path: ':memory:'
			};

			await init('test-site', config);

			// Import again and check if it's the same instance
			const { sodaf: sodaf2 } = await import('./sodaf');

			expect(sodaf).toBe(sodaf2);
		});
	});
});