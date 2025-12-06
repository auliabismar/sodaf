/**
 * MetaCache Unit Tests
 * 
 * This file contains comprehensive unit tests for the MetaCache class
 * covering all test cases from P2-004-T23 to P2-004-T25.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DocTypeEngine } from '../doctype-engine';
import { DocTypeMeta } from '../meta';
import { MetaCache } from '../meta-cache';
import { DocTypeError } from '../errors';
import type { DocType } from '../types';

describe('MetaCache', () => {
	let engine: DocTypeEngine;
	let cache: MetaCache;
	let sampleDocType: DocType;

	beforeEach(() => {
		// Reset instances for clean testing
		DocTypeEngine.resetInstance();
		MetaCache.resetInstance();
		
		engine = DocTypeEngine.getInstance();
		cache = MetaCache.getInstance(engine);

		// Create a sample DocType for testing
		sampleDocType = {
			name: 'TestDocType',
			module: 'TestModule',
			fields: [
				{
					fieldname: 'title',
					label: 'Title',
					fieldtype: 'Data',
					required: true
				}
			],
			permissions: [
				{
					role: 'System Manager',
					read: true,
					write: true,
					create: true,
					delete: true
				}
			]
		};
	});

	afterEach(() => {
		// Clean up after each test
		DocTypeEngine.resetInstance();
		MetaCache.resetInstance();
	});

	// P2-004-T23: Meta caching - Second access uses cached meta
	it('P2-004-T23: should use cached meta on second access', async () => {
		// Register DocType
		await engine.registerDocType(sampleDocType);

		// First access - should load from engine and cache
		const meta1 = await cache.getMeta('TestDocType');
		expect(meta1).toBeInstanceOf(DocTypeMeta);

		// Second access - should return cached instance
		const meta2 = await cache.getMeta('TestDocType');
		expect(meta1).toBe(meta2); // Same instance reference
		expect(cache.isCached('TestDocType')).toBe(true);
	});

	// P2-004-T24: `reloadMeta(doctype)` - Refreshes cached meta
	it('P2-004-T24: should refresh cached meta when reloadMeta is called', async () => {
		// Register DocType
		await engine.registerDocType(sampleDocType);

		// Get initial meta
		const meta1 = await cache.getMeta('TestDocType');
		expect(meta1).toBeInstanceOf(DocTypeMeta);

		// Modify the DocType in engine
		const modifiedDocType = {
			...sampleDocType,
			fields: [
				...sampleDocType.fields,
				{
					fieldname: 'new_field',
					label: 'New Field',
					fieldtype: 'Data' as const
				}
			]
		};

		// Update the DocType in engine (simulate external change)
		await engine.unregisterDocType('TestDocType');
		await engine.registerDocType(modifiedDocType);

		// Reload meta
		const meta2 = await cache.reloadMeta('TestDocType');
		expect(meta2).toBeInstanceOf(DocTypeMeta);
		expect(meta1).not.toBe(meta2); // Different instance reference

		// Verify the new field is present
		expect(meta2?.has_field('new_field')).toBe(true);
		expect(meta2?.get_field('new_field')?.label).toBe('New Field');
	});

	// P2-004-T25: `clearMetaCache()` - Clears all cached meta
	it('P2-004-T25: should clear all cached meta when clearMetaCache is called', async () => {
		// Register multiple DocTypes
		await engine.registerDocType(sampleDocType);
		
		const secondDocType = {
			...sampleDocType,
			name: 'SecondDocType'
		};
		await engine.registerDocType(secondDocType);

		// Cache both DocTypes
		const meta1 = await cache.getMeta('TestDocType');
		const meta2 = await cache.getMeta('SecondDocType');

		expect(meta1).toBeInstanceOf(DocTypeMeta);
		expect(meta2).toBeInstanceOf(DocTypeMeta);
		expect(cache.getCacheSize()).toBe(2);
		expect(cache.getCachedDocTypes()).toEqual(
			expect.arrayContaining(['TestDocType', 'SecondDocType'])
		);

		// Clear cache
		cache.clearCache();

		// Verify cache is empty
		expect(cache.getCacheSize()).toBe(0);
		expect(cache.getCachedDocTypes()).toEqual([]);
		expect(cache.isCached('TestDocType')).toBe(false);
		expect(cache.isCached('SecondDocType')).toBe(false);

		// Verify new instances are created after cache clear
		const meta3 = await cache.getMeta('TestDocType');
		const meta4 = await cache.getMeta('SecondDocType');

		expect(meta1).not.toBe(meta3); // Different instance
		expect(meta2).not.toBe(meta4); // Different instance
	});

	// Additional tests for MetaCache functionality
	it('should return null for non-existent DocType', async () => {
		const meta = await cache.getMeta('NonExistentDocType');
		expect(meta).toBeNull();
		expect(cache.isCached('NonExistentDocType')).toBe(false);
	});

	it('should invalidate specific DocType from cache', async () => {
		// Register DocType
		await engine.registerDocType(sampleDocType);

		// Cache the DocType
		const meta1 = await cache.getMeta('TestDocType');
		expect(cache.isCached('TestDocType')).toBe(true);

		// Invalidate specific DocType
		cache.invalidateMeta('TestDocType');
		expect(cache.isCached('TestDocType')).toBe(false);

		// Next access should create new instance
		const meta2 = await cache.getMeta('TestDocType');
		expect(meta1).not.toBe(meta2);
	});

	it('should handle preloadMetas for multiple DocTypes', async () => {
		// Register multiple DocTypes
		await engine.registerDocType(sampleDocType);
		
		const secondDocType = {
			...sampleDocType,
			name: 'SecondDocType'
		};
		await engine.registerDocType(secondDocType);

		const thirdDocType = {
			...sampleDocType,
			name: 'ThirdDocType'
		};
		// Don't register third DocType to test null handling

		// Preload metas
		const results = await cache.preloadMetas([
			'TestDocType',
			'SecondDocType',
			'ThirdDocType',
			'NonExistentDocType'
		]);

		expect(results.size).toBe(4);
		expect(results.get('TestDocType')).toBeInstanceOf(DocTypeMeta);
		expect(results.get('SecondDocType')).toBeInstanceOf(DocTypeMeta);
		expect(results.get('ThirdDocType')).toBeNull();
		expect(results.get('NonExistentDocType')).toBeNull();

		// Verify cached status
		expect(cache.isCached('TestDocType')).toBe(true);
		expect(cache.isCached('SecondDocType')).toBe(true);
		expect(cache.isCached('ThirdDocType')).toBe(false);
		expect(cache.isCached('NonExistentDocType')).toBe(false);
	});

	it('should throw error when getInstance is called without engine on first call', () => {
		MetaCache.resetInstance();
		expect(() => MetaCache.getInstance()).toThrow(DocTypeError);
	});

	it('should return engine instance', () => {
		const returnedEngine = cache.getEngine();
		expect(returnedEngine).toBe(engine);
	});

	it('should handle concurrent access to same DocType', async () => {
		// Register DocType
		await engine.registerDocType(sampleDocType);

		// Make concurrent requests
		const promises = Array(10).fill(0).map(() => cache.getMeta('TestDocType'));
		const results = await Promise.all(promises);

		// All should return valid instances
		for (const meta of results) {
			expect(meta).toBeInstanceOf(DocTypeMeta);
			expect(meta?.get_doctype().name).toBe('TestDocType');
		}

		// Should only have one cached entry
		expect(cache.getCacheSize()).toBe(1);
	});

	it('should handle reloadMeta for non-existent DocType', async () => {
		const meta = await cache.reloadMeta('NonExistentDocType');
		expect(meta).toBeNull();
		expect(cache.isCached('NonExistentDocType')).toBe(false);
	});

	it('should handle invalidateMeta for non-existent DocType', async () => {
		// Should not throw error
		expect(() => cache.invalidateMeta('NonExistentDocType')).not.toThrow();
		expect(cache.isCached('NonExistentDocType')).toBe(false);
	});

	it('should maintain cache size correctly', async () => {
		expect(cache.getCacheSize()).toBe(0);

		// Register and cache DocTypes
		await engine.registerDocType(sampleDocType);
		await cache.getMeta('TestDocType');
		expect(cache.getCacheSize()).toBe(1);

		const secondDocType = {
			...sampleDocType,
			name: 'SecondDocType'
		};
		await engine.registerDocType(secondDocType);
		await cache.getMeta('SecondDocType');
		expect(cache.getCacheSize()).toBe(2);

		// Invalidate one
		cache.invalidateMeta('TestDocType');
		expect(cache.getCacheSize()).toBe(1);

		// Clear all
		cache.clearCache();
		expect(cache.getCacheSize()).toBe(0);
	});
});