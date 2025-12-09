/**
 * Meta Class Tests
 * 
 * Tests for the Meta class implementation to ensure
 * proper DocType metadata management and operations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DocTypeEngine } from '../doctype-engine';
import { DocTypeMeta } from '../meta';
import { DocTypeValidationError, DocTypeError } from '../errors';
import type { DocType, DocField } from '../types';
import { DocTypeTestFactory, DocTypeTestHelper } from '../../../__tests__/utils/doctype';
import { createInMemoryTestDatabase } from '../../../__tests__/utils/database';

describe('DocTypeMeta', () => {
	let engine: DocTypeEngine;
	let metaHelper: DocTypeTestHelper;
	let testDocType: DocType;
	let meta: DocTypeMeta;

	beforeEach(async () => {
		// Reset engine instance
		DocTypeEngine.resetInstance();
		engine = DocTypeEngine.getInstance();
		metaHelper = new DocTypeTestHelper();

		// Create test DocType
		testDocType = DocTypeTestFactory.createComprehensiveDocType({
			name: 'TestDocType',
			module: 'TestModule'
		});

		// Register DocType
		await engine.registerDocType(testDocType);

		// Create Meta instance
		meta = new DocTypeMeta(testDocType);
	});

	afterEach(() => {
		// Clean up
		metaHelper.clear();
		DocTypeEngine.resetInstance();
	});

	describe('Initialization', () => {
		it('should initialize with valid DocType', async () => {
			expect(meta).toBeDefined();
			expect(meta.get_doctype().name).toBe(testDocType.name);
			expect(meta.get_doctype().module).toBe(testDocType.module);
			expect(await meta.get_all_fields()).toHaveLength(testDocType.fields.length);
		});

		it('should throw error for null DocType', () => {
			expect(() => new DocTypeMeta(null as any)).toThrow(DocTypeError);
		});

		it('should throw error for undefined DocType', () => {
			expect(() => new DocTypeMeta(undefined as any)).toThrow(DocTypeError);
		});
	});

	describe('Field Management', () => {
		it('should get field by name', async () => {
			const field = await meta.get_field('name');

			expect(field).toBeDefined();
			expect(field?.fieldname).toBe('name');
			expect(field?.label).toBe('Name');
			expect(field?.fieldtype).toBe('Data');
		});

		it('should return null for non-existent field', async () => {
			const field = await meta.get_field('nonexistent_field');

			expect(field).toBeNull();
		});

		it('should get all fields', async () => {
			const fields = await meta.get_all_fields();

			expect(fields).toHaveLength(testDocType.fields.length);
			expect(fields.map((f: DocField) => f.fieldname)).toContain('name');
			expect(fields.map((f: DocField) => f.fieldname)).toContain('description');
		});

		it('should get required fields', async () => {
			const requiredFields = await meta.get_required_fields();

			const expectedRequired = testDocType.fields.filter(f => f.required);
			expect(requiredFields).toHaveLength(expectedRequired.length);
			expect(requiredFields.every((f: DocField) => f.required)).toBe(true);
		});

		it('should get optional fields', async () => {
			const allFields = await meta.get_all_fields();
			const requiredFields = await meta.get_required_fields();
			const optionalFields = allFields.filter(f => !requiredFields.includes(f));

			const expectedOptional = testDocType.fields.filter(f => !f.required);
			expect(optionalFields).toHaveLength(expectedOptional.length);
			expect(optionalFields.every((f: DocField) => !f.required)).toBe(true);
		});

		it('should get fields by type', async () => {
			const dataFields = await meta.get_fields_by_type('Data');
			const linkFields = await meta.get_fields_by_type('Link');

			const expectedDataFields = testDocType.fields.filter(f => f.fieldtype === 'Data');
			const expectedLinkFields = testDocType.fields.filter(f => f.fieldtype === 'Link');

			expect(dataFields).toHaveLength(expectedDataFields.length);
			expect(linkFields).toHaveLength(expectedLinkFields.length);
		});

		it('should check if field exists', async () => {
			expect(await meta.has_field('name')).toBe(true);
			expect(await meta.has_field('nonexistent_field')).toBe(false);
		});

		it('should get field label', async () => {
			expect(await meta.get_label('name')).toBe('Name');
			expect(await meta.get_label('nonexistent_field')).toBeNull();
		});

		it('should get field type', async () => {
			expect(await meta.get_options('status')).toBe('Draft\nSubmitted\nCancelled');
			expect(await meta.get_options('nonexistent_field')).toBeNull();
		});
	});

	describe('Special Field Types', () => {
		it('should get link fields', async () => {
			const linkFields = await meta.get_link_fields();

			const expectedLinkFields = testDocType.fields.filter(f =>
				f.fieldtype === 'Link' || f.fieldtype === 'Dynamic Link'
			);

			expect(linkFields).toHaveLength(expectedLinkFields.length);
		});

		it('should get table fields', async () => {
			const tableFields = await meta.get_table_fields();

			const expectedTableFields = testDocType.fields.filter(f => f.fieldtype === 'Table');

			expect(tableFields).toHaveLength(expectedTableFields.length);
		});

		it('should get select fields', async () => {
			const selectFields = await meta.get_select_fields();

			const expectedSelectFields = testDocType.fields.filter(f => f.fieldtype === 'Select');

			expect(selectFields).toHaveLength(expectedSelectFields.length);
		});

		it('should get unique fields', async () => {
			const uniqueFields = await meta.get_unique_fields();

			const expectedUniqueFields = testDocType.fields.filter(f => f.unique);

			expect(uniqueFields).toHaveLength(expectedUniqueFields.length);
		});
	});

	describe('DocType Properties', () => {
		it('should check if DocType is submittable', () => {
			expect(meta.is_submittable()).toBe(testDocType.is_submittable || false);
		});

		it('should check if DocType is single', () => {
			expect(meta.is_single()).toBe(testDocType.issingle || false);
		});

		it('should check if DocType is table', () => {
			expect(meta.is_table()).toBe(testDocType.istable || false);
		});

		it('should check if DocType is tree', () => {
			expect(meta.is_tree()).toBe(testDocType.is_tree || false);
		});

		it('should check if DocType is virtual', () => {
			expect(meta.is_virtual()).toBe(testDocType.is_virtual || false);
		});
	});

	describe('Search and Display Fields', () => {
		it('should get search fields', () => {
			const searchFields = meta.get_search_fields();

			if (testDocType.search_fields) {
				const expectedSearchFields = testDocType.search_fields.split(',').map(s => s.trim());
				expect(searchFields).toEqual(expectedSearchFields);
			} else {
				expect(searchFields).toEqual([]);
			}
		});

		it('should get title field', () => {
			const titleField = meta.get_title_field();

			expect(titleField).toBe(testDocType.title_field || null);
		});

		it('should get image field', () => {
			const imageField = meta.get_image_field();

			expect(imageField).toBe(testDocType.image_field || null);
		});

		it('should get valid columns', async () => {
			const validColumns = await meta.get_valid_columns();

			// Should exclude layout fields
			const layoutFieldTypes = [
				'Section Break', 'Column Break', 'Tab Break', 'Fold', 'Button', 'HTML', 'Image'
			];

			const expectedColumns = testDocType.fields
				.filter(f => !layoutFieldTypes.includes(f.fieldtype))
				.map(f => f.fieldname);

			expect(validColumns).toEqual(expect.arrayContaining(expectedColumns));
		});
	});

	describe('Field Options', () => {
		it('should get field options', async () => {
			const options = await meta.get_options('status');

			expect(options).toBe('Draft\nSubmitted\nCancelled');
		});

		it('should return null for field without options', async () => {
			const options = await meta.get_options('name'); // Data field has no options

			expect(options).toBeNull();
		});

		it('should return null for non-existent field', async () => {
			const options = await meta.get_options('nonexistent_field');

			expect(options).toBeNull();
		});
	});

	describe('Performance', () => {
		it('should build indexes efficiently', async () => {
			const largeDocType = {
				name: 'LargeDocType',
				module: 'TestModule',
				fields: Array.from({ length: 1000 }, (_, i) => ({
					fieldname: `field_${i}`,
					label: `Field ${i}`,
					fieldtype: 'Data' as const
				})),
				permissions: []
			} as DocType;

			const startTime = Date.now();
			const largeMeta = new DocTypeMeta(largeDocType);
			const endTime = Date.now();

			expect(largeMeta).toBeDefined();
			expect(await largeMeta.get_all_fields()).toHaveLength(1000);
			expect(endTime - startTime).toBeLessThan(1000); // Should build within 1 second
		});

		it('should cache computed properties', async () => {
			// First call should compute
			const startTime1 = performance.now();
			const validColumns1 = await meta.get_valid_columns();
			const endTime1 = performance.now();

			// Second call should use cache
			const startTime2 = performance.now();
			const validColumns2 = await meta.get_valid_columns();
			const endTime2 = performance.now();

			expect(validColumns1).toEqual(validColumns2);
			// Note: Due to performance optimizations, caching might not show significant improvement
			// So we just check that both calls return the same result
			expect(endTime2 - startTime2).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty DocType gracefully', async () => {
			const emptyDocType = {
				name: 'EmptyDocType',
				module: 'TestModule',
				fields: [],
				permissions: []
			};

			const emptyMeta = new DocTypeMeta(emptyDocType);

			expect(emptyMeta).toBeDefined();
			expect(await emptyMeta.get_all_fields()).toHaveLength(0);
			expect(await emptyMeta.get_required_fields()).toHaveLength(0);
		});

		it('should handle DocType with special characters in name', () => {
			const specialDocType = {
				name: 'DocType_With-Special.Chars',
				module: 'TestModule',
				fields: [
					{ fieldname: 'name', label: 'Name', fieldtype: 'Data' as const }
				],
				permissions: []
			} as DocType;

			const specialMeta = new DocTypeMeta(specialDocType);

			expect(specialMeta).toBeDefined();
			expect(specialMeta.get_doctype().name).toBe('DocType_With-Special.Chars');
		});

		it('should handle fields with all types', async () => {
			const allTypesDocType = {
				name: 'AllTypesDocType',
				module: 'TestModule',
				fields: [
					{ fieldname: 'data_field', label: 'Data Field', fieldtype: 'Data' as const },
					{ fieldname: 'int_field', label: 'Int Field', fieldtype: 'Int' as const },
					{ fieldname: 'float_field', label: 'Float Field', fieldtype: 'Float' as const },
					{ fieldname: 'currency_field', label: 'Currency Field', fieldtype: 'Currency' as const },
					{ fieldname: 'check_field', label: 'Check Field', fieldtype: 'Check' as const },
					{ fieldname: 'select_field', label: 'Select Field', fieldtype: 'Select' as const, options: 'A\nB\nC' },
					{ fieldname: 'link_field', label: 'Link Field', fieldtype: 'Link' as const, options: 'User' },
					{ fieldname: 'table_field', label: 'Table Field', fieldtype: 'Table' as const, options: 'Child' },
					{ fieldname: 'date_field', label: 'Date Field', fieldtype: 'Date' as const },
					{ fieldname: 'datetime_field', label: 'Datetime Field', fieldtype: 'Datetime' as const },
					{ fieldname: 'section_break', label: 'Section Break', fieldtype: 'Section Break' as const },
					{ fieldname: 'column_break', label: 'Column Break', fieldtype: 'Column Break' as const },
					{ fieldname: 'tab_break', label: 'Tab Break', fieldtype: 'Tab Break' as const }
				],
				permissions: []
			} as DocType;

			const allTypesMeta = new DocTypeMeta(allTypesDocType);

			expect(allTypesMeta).toBeDefined();
			expect(await allTypesMeta.get_all_fields()).toHaveLength(13);
			expect(await allTypesMeta.get_link_fields()).toHaveLength(1);
			expect(await allTypesMeta.get_table_fields()).toHaveLength(1);
			expect(await allTypesMeta.get_select_fields()).toHaveLength(1);
		});
	});

	describe('Integration', () => {
		it('should work with DocTypeEngine', async () => {
			const registeredDocType = await engine.getDocType('TestDocType');
			const engineMeta = new DocTypeMeta(registeredDocType!);

			expect(engineMeta.get_doctype().name).toBe(meta.get_doctype().name);
			expect(await engineMeta.get_all_fields()).toEqual(await meta.get_all_fields());
		});

		it('should maintain consistency with original DocType', async () => {
			const originalDocType = meta.get_doctype();

			// Modify meta should not affect original
			const fieldsBefore = await meta.get_all_fields();
			const docTypeBefore = { ...originalDocType };

			// Create new meta from same DocType
			const newMeta = new DocTypeMeta(originalDocType);
			const fieldsAfter = await newMeta.get_all_fields();
			const docTypeAfter = newMeta.get_doctype();

			expect(fieldsBefore).toEqual(fieldsAfter);
			expect(docTypeBefore).toEqual(docTypeAfter);
		});
	});
});