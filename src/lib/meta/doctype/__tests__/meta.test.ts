/**
 * DocTypeMeta Unit Tests
 * 
 * This file contains comprehensive unit tests for the DocTypeMeta class
 * covering all test cases from P2-004-T1 to P2-004-T22.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DocTypeMeta } from '../meta';
import { DocTypeError } from '../errors';
import type { DocType, DocField } from '../types';

describe('DocTypeMeta', () => {
	let sampleDocType: DocType;
	let meta: DocTypeMeta;

	beforeEach(() => {
		// Create a comprehensive sample DocType for testing
		sampleDocType = {
			name: 'TestDocType',
			module: 'TestModule',
			is_submittable: true,
			issingle: false,
			istable: false,
			is_tree: false,
			is_virtual: false,
			title_field: 'title',
			image_field: 'image',
			search_fields: 'title, description, category',
			fields: [
				{
					fieldname: 'title',
					label: 'Title',
					fieldtype: 'Data',
					required: true,
					unique: true
				},
				{
					fieldname: 'description',
					label: 'Description',
					fieldtype: 'Long Text'
				},
				{
					fieldname: 'category',
					label: 'Category',
					fieldtype: 'Select',
					options: 'Option 1\nOption 2\nOption 3',
					required: true
				},
				{
					fieldname: 'customer',
					label: 'Customer',
					fieldtype: 'Link',
					options: 'Customer'
				},
				{
					fieldname: 'dynamic_link',
					label: 'Dynamic Link',
					fieldtype: 'Dynamic Link',
					options: 'reference_doctype'
				},
				{
					fieldname: 'items',
					label: 'Items',
					fieldtype: 'Table',
					child_doctype: 'TestItem'
				},
				{
					fieldname: 'image',
					label: 'Image',
					fieldtype: 'Attach Image'
				},
				{
					fieldname: 'section_break',
					label: 'Section Break',
					fieldtype: 'Section Break'
				},
				{
					fieldname: 'column_break',
					label: 'Column Break',
					fieldtype: 'Column Break'
				},
				{
					fieldname: 'tab_break',
					label: 'Tab Break',
					fieldtype: 'Tab Break'
				},
				{
					fieldname: 'fold',
					label: 'Fold',
					fieldtype: 'Fold'
				},
				{
					fieldname: 'button',
					label: 'Button',
					fieldtype: 'Button'
				},
				{
					fieldname: 'html',
					label: 'HTML',
					fieldtype: 'HTML'
				},
				{
					fieldname: 'display_image',
					label: 'Display Image',
					fieldtype: 'Image'
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

		meta = new DocTypeMeta(sampleDocType);
	});

	// P2-004-T1: `new Meta(doctype)` - Creates Meta instance
	it('P2-004-T1: should create Meta instance from DocType', () => {
		expect(meta).toBeInstanceOf(DocTypeMeta);
		expect(meta.get_doctype()).toBe(sampleDocType);
	});

	// P2-004-T2: `meta.get_field('fieldname')` exists - Returns DocField
	it('P2-004-T2: should return DocField when field exists', () => {
		const field = meta.get_field('title');
		expect(field).toBeTruthy();
		expect(field?.fieldname).toBe('title');
		expect(field?.label).toBe('Title');
		expect(field?.fieldtype).toBe('Data');
	});

	// P2-004-T3: `meta.get_field('nonexistent')` - Returns null
	it('P2-004-T3: should return null when field does not exist', () => {
		const field = meta.get_field('nonexistent');
		expect(field).toBeNull();
	});

	// P2-004-T4: `meta.has_field('fieldname')` - Returns true for existing
	it('P2-004-T4: should return true when field exists', () => {
		expect(meta.has_field('title')).toBe(true);
		expect(meta.has_field('description')).toBe(true);
		expect(meta.has_field('category')).toBe(true);
	});

	// P2-004-T5: `meta.has_field('nonexistent')` - Returns false
	it('P2-004-T5: should return false when field does not exist', () => {
		expect(meta.has_field('nonexistent')).toBe(false);
		expect(meta.has_field('')).toBe(false);
		expect(meta.has_field('missing_field')).toBe(false);
	});

	// P2-004-T6: `meta.get_link_fields()` - Returns Link and Dynamic Link fields
	it('P2-004-T6: should return Link and Dynamic Link fields', () => {
		const linkFields = meta.get_link_fields();
		expect(linkFields).toHaveLength(2);

		const fieldnames = linkFields.map(f => f.fieldname);
		expect(fieldnames).toContain('customer');
		expect(fieldnames).toContain('dynamic_link');

		const customerField = linkFields.find(f => f.fieldname === 'customer');
		expect(customerField?.fieldtype).toBe('Link');
		expect(customerField?.options).toBe('Customer');

		const dynamicLinkField = linkFields.find(f => f.fieldname === 'dynamic_link');
		expect(dynamicLinkField?.fieldtype).toBe('Dynamic Link');
		expect(dynamicLinkField?.options).toBe('reference_doctype');
	});

	// P2-004-T7: `meta.get_table_fields()` - Returns Table fields only
	it('P2-004-T7: should return Table fields only', () => {
		const tableFields = meta.get_table_fields();
		expect(tableFields).toHaveLength(1);
		expect(tableFields[0].fieldname).toBe('items');
		expect(tableFields[0].fieldtype).toBe('Table');
		expect(tableFields[0].child_doctype).toBe('TestItem');
	});

	// P2-004-T8: `meta.get_select_fields()` - Returns Select fields only
	it('P2-004-T8: should return Select fields only', () => {
		const selectFields = meta.get_select_fields();
		expect(selectFields).toHaveLength(1);
		expect(selectFields[0].fieldname).toBe('category');
		expect(selectFields[0].fieldtype).toBe('Select');
		expect(selectFields[0].options).toBe('Option 1\nOption 2\nOption 3');
	});

	// P2-004-T9: `meta.get_valid_columns()` - Returns DB column names (no layout fields)
	it('P2-004-T9: should return valid database column names excluding layout fields', () => {
		const validColumns = meta.get_valid_columns();
		
		// Should include regular fields
		expect(validColumns).toContain('title');
		expect(validColumns).toContain('description');
		expect(validColumns).toContain('category');
		expect(validColumns).toContain('customer');
		expect(validColumns).toContain('dynamic_link');
		expect(validColumns).toContain('items');
		expect(validColumns).toContain('image');

		// Should exclude layout fields
		expect(validColumns).not.toContain('section_break');
		expect(validColumns).not.toContain('column_break');
		expect(validColumns).not.toContain('tab_break');
		expect(validColumns).not.toContain('fold');
		expect(validColumns).not.toContain('button');
		expect(validColumns).not.toContain('html');
		expect(validColumns).not.toContain('display_image');
	});

	// P2-004-T10: `meta.is_submittable()` - Returns is_submittable flag
	it('P2-004-T10: should return is_submittable flag', () => {
		expect(meta.is_submittable()).toBe(true);

		// Test with false value
		const nonSubmittableDocType = { ...sampleDocType, is_submittable: false };
		const nonSubmittableMeta = new DocTypeMeta(nonSubmittableDocType);
		expect(nonSubmittableMeta.is_submittable()).toBe(false);

		// Test with undefined value
		const undefinedDocType = { ...sampleDocType, is_submittable: undefined };
		const undefinedMeta = new DocTypeMeta(undefinedDocType);
		expect(undefinedMeta.is_submittable()).toBe(false);
	});

	// P2-004-T11: `meta.is_single()` - Returns issingle flag
	it('P2-004-T11: should return issingle flag', () => {
		expect(meta.is_single()).toBe(false);

		// Test with true value
		const singleDocType = { ...sampleDocType, issingle: true };
		const singleMeta = new DocTypeMeta(singleDocType);
		expect(singleMeta.is_single()).toBe(true);
	});

	// P2-004-T12: `meta.is_table()` - Returns istable flag
	it('P2-004-T12: should return istable flag', () => {
		expect(meta.is_table()).toBe(false);

		// Test with true value
		const tableDocType = { ...sampleDocType, istable: true };
		const tableMeta = new DocTypeMeta(tableDocType);
		expect(tableMeta.is_table()).toBe(true);
	});

	// P2-004-T13: `meta.is_tree()` - Returns is_tree flag
	it('P2-004-T13: should return is_tree flag', () => {
		expect(meta.is_tree()).toBe(false);

		// Test with true value
		const treeDocType = { ...sampleDocType, is_tree: true };
		const treeMeta = new DocTypeMeta(treeDocType);
		expect(treeMeta.is_tree()).toBe(true);
	});

	// P2-004-T14: `meta.is_virtual()` - Returns is_virtual flag
	it('P2-004-T14: should return is_virtual flag', () => {
		expect(meta.is_virtual()).toBe(false);

		// Test with true value
		const virtualDocType = { ...sampleDocType, is_virtual: true };
		const virtualMeta = new DocTypeMeta(virtualDocType);
		expect(virtualMeta.is_virtual()).toBe(true);
	});

	// P2-004-T15: `meta.get_search_fields()` - Returns searchable field names
	it('P2-004-T15: should return searchable field names', () => {
		const searchFields = meta.get_search_fields();
		expect(searchFields).toEqual(['title', 'description', 'category']);
	});

	// P2-004-T16: `meta.get_title_field()` - Returns title_field value
	it('P2-004-T16: should return title_field value', () => {
		expect(meta.get_title_field()).toBe('title');

		// Test with undefined
		const noTitleDocType = { ...sampleDocType, title_field: undefined };
		const noTitleMeta = new DocTypeMeta(noTitleDocType);
		expect(noTitleMeta.get_title_field()).toBeNull();
	});

	// P2-004-T17: `meta.get_label('fieldname')` - Returns field label
	it('P2-004-T17: should return field label', () => {
		expect(meta.get_label('title')).toBe('Title');
		expect(meta.get_label('description')).toBe('Description');
		expect(meta.get_label('category')).toBe('Category');

		// Test with non-existent field
		expect(meta.get_label('nonexistent')).toBeNull();
	});

	// P2-004-T18: `meta.get_options('fieldname')` - Returns options for Select/Link
	it('P2-004-T18: should return options for Select/Link fields', () => {
		// Test Select field
		expect(meta.get_options('category')).toBe('Option 1\nOption 2\nOption 3');

		// Test Link field
		expect(meta.get_options('customer')).toBe('Customer');

		// Test Dynamic Link field
		expect(meta.get_options('dynamic_link')).toBe('reference_doctype');

		// Test field without options
		expect(meta.get_options('title')).toBeNull();

		// Test non-existent field
		expect(meta.get_options('nonexistent')).toBeNull();
	});

	// P2-004-T19: `meta.get_fields_by_type('Data')` - Returns all Data fields
	it('P2-004-T19: should return all fields of specified type', () => {
		const dataFields = meta.get_fields_by_type('Data');
		expect(dataFields).toHaveLength(1);
		expect(dataFields[0].fieldname).toBe('title');

		const textFields = meta.get_fields_by_type('Long Text');
		expect(textFields).toHaveLength(1);
		expect(textFields[0].fieldname).toBe('description');

		// Test with non-existent type
		const noFields = meta.get_fields_by_type('NonExistent' as any);
		expect(noFields).toHaveLength(0);
	});

	// P2-004-T20: `meta.get_required_fields()` - Returns required fields
	it('P2-004-T20: should return required fields', () => {
		const requiredFields = meta.get_required_fields();
		expect(requiredFields).toHaveLength(2);

		const fieldnames = requiredFields.map(f => f.fieldname);
		expect(fieldnames).toContain('title');
		expect(fieldnames).toContain('category');

		// Test with no required fields
		const noRequiredDocType = {
			...sampleDocType,
			fields: sampleDocType.fields.map(f => ({ ...f, required: false }))
		};
		const noRequiredMeta = new DocTypeMeta(noRequiredDocType);
		expect(noRequiredMeta.get_required_fields()).toHaveLength(0);
	});

	// P2-004-T21: `meta.get_unique_fields()` - Returns unique fields
	it('P2-004-T21: should return unique fields', () => {
		const uniqueFields = meta.get_unique_fields();
		expect(uniqueFields).toHaveLength(1);
		expect(uniqueFields[0].fieldname).toBe('title');

		// Test with no unique fields
		const noUniqueDocType = {
			...sampleDocType,
			fields: sampleDocType.fields.map(f => ({ ...f, unique: false }))
		};
		const noUniqueMeta = new DocTypeMeta(noUniqueDocType);
		expect(noUniqueMeta.get_unique_fields()).toHaveLength(0);
	});

	// P2-004-T22: `meta.get_image_field()` - Returns image_field value
	it('P2-004-T22: should return image_field value', () => {
		expect(meta.get_image_field()).toBe('image');

		// Test with undefined
		const noImageDocType = { ...sampleDocType, image_field: undefined };
		const noImageMeta = new DocTypeMeta(noImageDocType);
		expect(noImageMeta.get_image_field()).toBeNull();
	});

	// Additional tests for edge cases and error conditions
	it('should throw error when DocType is null or undefined', () => {
		expect(() => new DocTypeMeta(null as any)).toThrow(DocTypeError);
		expect(() => new DocTypeMeta(undefined as any)).toThrow(DocTypeError);
		expect(() => new DocTypeMeta({ fields: [] } as any)).not.toThrow();
	});

	it('should return all fields when get_all_fields is called', () => {
		const allFields = meta.get_all_fields();
		expect(allFields).toHaveLength(sampleDocType.fields.length);
		expect(allFields).toEqual(expect.arrayContaining(sampleDocType.fields));
	});

	it('should handle empty search_fields', () => {
		const emptySearchDocType = { ...sampleDocType, search_fields: undefined };
		const emptySearchMeta = new DocTypeMeta(emptySearchDocType);
		expect(emptySearchMeta.get_search_fields()).toEqual([]);

		const nullSearchDocType = { ...sampleDocType, search_fields: undefined };
		const nullSearchMeta = new DocTypeMeta(nullSearchDocType);
		expect(nullSearchMeta.get_search_fields()).toEqual([]);
	});

	it('should handle search_fields with extra spaces', () => {
		const spacedSearchDocType = {
			...sampleDocType,
			search_fields: ' title , description , category '
		};
		const spacedSearchMeta = new DocTypeMeta(spacedSearchDocType);
		expect(spacedSearchMeta.get_search_fields()).toEqual(['title', 'description', 'category']);
	});

	it('should cache valid_columns result', () => {
		const validColumns1 = meta.get_valid_columns();
		const validColumns2 = meta.get_valid_columns();
		expect(validColumns1).toBe(validColumns2); // Should be the same reference
	});
});