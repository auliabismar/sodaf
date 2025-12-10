/**
 * Example usage of DocTypeMeta, MetaCache, and MetaFactory
 * This file demonstrates how to use the new DocType Meta Class implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DocTypeEngine } from '../doctype-engine';
import { DocTypeMeta } from '../meta';
import { MetaCache } from '../meta-cache';
import { MetaFactory } from '../meta-factory';
import type { DocType } from '../types';

describe('DocTypeMeta Example Usage', () => {
	let engine: DocTypeEngine;
	let cache: MetaCache;
	let sampleDocType: DocType;

	beforeEach(() => {
		// Reset engine for clean testing
		DocTypeEngine.resetInstance();
		MetaCache.resetInstance();
		engine = DocTypeEngine.getInstance();
		cache = MetaCache.getInstance(engine);

		// Create a sample DocType for testing
		sampleDocType = {
			name: 'Customer',
			module: 'Sales',
			is_submittable: true,
			title_field: 'customer_name',
			image_field: 'customer_image',
			search_fields: 'customer_name, email, phone',
			fields: [
				{
					fieldname: 'customer_name',
					label: 'Customer Name',
					fieldtype: 'Data',
					required: true,
					unique: true
				},
				{
					fieldname: 'email',
					label: 'Email',
					fieldtype: 'Data',
					unique: true
				},
				{
					fieldname: 'phone',
					label: 'Phone',
					fieldtype: 'Data'
				},
				{
					fieldname: 'customer_type',
					label: 'Customer Type',
					fieldtype: 'Select',
					options: 'Individual\nCompany\nGovernment'
				},
				{
					fieldname: 'territory',
					label: 'Territory',
					fieldtype: 'Link',
					options: 'Territory'
				},
				{
					fieldname: 'customer_image',
					label: 'Customer Image',
					fieldtype: 'Attach Image'
				},
				{
					fieldname: 'section_break',
					label: 'Section Break',
					fieldtype: 'Section Break'
				},
				{
					fieldname: 'address',
					label: 'Address',
					fieldtype: 'Long Text'
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

	it('should demonstrate DocTypeMeta field access methods', async () => {
		// Register the DocType
		await engine.registerDocType(sampleDocType);

		// Get DocTypeMeta using the factory
		const meta = await MetaFactory.create(sampleDocType);

		// Test field access methods
		expect(meta.get_field('customer_name')).toBeTruthy();
		expect(meta.get_field('nonexistent')).toBeNull();
		expect(meta.has_field('email')).toBe(true);
		expect(meta.has_field('nonexistent')).toBe(false);

		// Test field type queries
		const linkFields = await meta.get_link_fields();
		expect(linkFields).toHaveLength(1);
		expect(linkFields[0].fieldname).toBe('territory');

		const selectFields = await meta.get_select_fields();
		expect(selectFields).toHaveLength(1);
		expect(selectFields[0].fieldname).toBe('customer_type');

		// Test valid columns (excludes layout fields)
		const validColumns = await meta.get_valid_columns();
		expect(validColumns).toContain('customer_name');
		expect(validColumns).toContain('email');
		expect(validColumns).not.toContain('section_break');

		// Test required and unique fields
		const requiredFields = await meta.get_required_fields();
		expect(requiredFields).toHaveLength(1);
		expect(requiredFields[0].fieldname).toBe('customer_name');

		const uniqueFields = await meta.get_unique_fields();
		expect(uniqueFields).toHaveLength(2);
		expect(uniqueFields.map((f: any) => f.fieldname)).toEqual(
			expect.arrayContaining(['customer_name', 'email'])
		);
	});

	it('should demonstrate DocTypeMeta property access methods', async () => {
		// Register the DocType
		await engine.registerDocType(sampleDocType);

		// Get DocTypeMeta using the factory
		const meta = await MetaFactory.create(sampleDocType);

		// Test DocType properties
		expect(meta.is_submittable()).toBe(true);
		expect(meta.is_single()).toBe(false);
		expect(meta.is_table()).toBe(false);
		expect(meta.is_tree()).toBe(false);
		expect(meta.is_virtual()).toBe(false);

		// Test metadata properties
		expect(meta.get_title_field()).toBe('customer_name');
		expect(meta.get_image_field()).toBe('customer_image');
		expect(meta.get_search_fields()).toEqual(['customer_name', 'email', 'phone']);
	});

	it('should demonstrate DocTypeMeta field metadata access', async () => {
		// Register the DocType
		await engine.registerDocType(sampleDocType);

		// Get DocTypeMeta using the factory
		const meta = await MetaFactory.create(sampleDocType);

		// Test field metadata access
		expect(await meta.get_label('customer_name')).toBe('Customer Name');
		expect(await meta.get_label('nonexistent')).toBeNull();

		expect(await meta.get_options('customer_type')).toBe('Individual\nCompany\nGovernment');
		expect(await meta.get_options('territory')).toBe('Territory');
		expect(await meta.get_options('customer_name')).toBeNull();
	});

	it('should demonstrate MetaCache functionality', async () => {
		// Register the DocType
		await engine.registerDocType(sampleDocType);

		// First access - should load from engine
		const meta1 = await cache.getMeta('Customer');
		expect(meta1).toBeInstanceOf(DocTypeMeta);

		// Second access - should return cached instance
		const meta2 = await cache.getMeta('Customer');
		expect(meta1).toBe(meta2); // Same instance

		// Test cache status
		expect(cache.isCached('Customer')).toBe(true);
		expect(cache.getCacheSize()).toBe(1);
		expect(cache.getCachedDocTypes()).toEqual(['Customer']);

		// Test cache invalidation
		cache.invalidateMeta('Customer');
		expect(cache.isCached('Customer')).toBe(false);

		// Test reload
		const meta3 = await cache.reloadMeta('Customer');
		expect(meta3).toBeInstanceOf(DocTypeMeta);
		expect(cache.isCached('Customer')).toBe(true);
	});

	it('should demonstrate DocTypeEngine integration', async () => {
		// Register the DocType
		await engine.registerDocType(sampleDocType);

		// Get DocTypeMeta through engine
		const meta = await engine.getDocTypeMeta('Customer');
		expect(meta).toBeInstanceOf(DocTypeMeta);

		// Test cache invalidation through engine
		engine.invalidateDocTypeMeta('Customer');
		expect(cache.isCached('Customer')).toBe(false);

		// Test reload through engine
		const reloadedMeta = await engine.reloadDocTypeMeta('Customer');
		expect(reloadedMeta).toBeInstanceOf(DocTypeMeta);
		expect(cache.isCached('Customer')).toBe(true);

		// Test cache clearing through engine
		engine.clearDocTypeMetaCache();
		expect(cache.isCached('Customer')).toBe(false);
	});

	it('should demonstrate MetaFactory creation methods', async () => {
		// Register the DocType
		await engine.registerDocType(sampleDocType);

		// Create from DocType
		const meta1 = MetaFactory.create(sampleDocType);
		expect(meta1).toBeInstanceOf(DocTypeMeta);

		// Create from name
		const meta2 = await MetaFactory.createFromName('Customer', engine);
		expect(meta2).toBeInstanceOf(DocTypeMeta);

		// Create from multiple names
		const metas = await MetaFactory.createFromNames(['Customer'], engine);
		expect(metas.size).toBe(1);
		expect(metas.get('Customer')).toBeInstanceOf(DocTypeMeta);

		// Test non-existent DocType
		const nonExistent = await MetaFactory.createFromName('NonExistent', engine);
		expect(nonExistent).toBeNull();
	});
});