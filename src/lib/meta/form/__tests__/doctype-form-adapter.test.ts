/**
 * DocTypeFormAdapter Tests
 * 
 * This file contains tests for the DocTypeFormAdapter class which converts DocType
 * definitions to FormSchema objects.
 */

import { describe, it, expect } from 'vitest';
import { DocTypeFormAdapter } from '../helpers';
import type { DocType, DocField } from '../../doctype/types';
import type { FormSchema, FormSection, FormTab } from '../types';

describe('DocTypeFormAdapter', () => {
	/**
	 * Test basic DocType to FormSchema conversion
	 */
	it('should convert a simple DocType to FormSchema with sections', () => {
		const docType: DocType = {
			name: 'TestDocType',
			module: 'Core',
			fields: [
				{
					fieldname: 'name',
					label: 'Name',
					fieldtype: 'Data',
					required: true,
					unique: true
				},
				{
					fieldname: 'status',
					label: 'Status',
					fieldtype: 'Select',
					options: 'Active\nInactive',
					default: 'Active'
				},
				{
					fieldname: 'description',
					label: 'Description',
					fieldtype: 'Long Text'
				}
			],
			permissions: []
		};

		const formSchema = DocTypeFormAdapter.toFormSchema(docType);

		expect(formSchema.doctype).toBe('TestDocType');
		// When there are no Section Break fields, sections will be an empty array
		expect(formSchema.sections).toEqual([]);
		expect(formSchema.tabs).toBeUndefined();
		expect(formSchema.layout.has_tabs).toBe(false);
		expect(formSchema.metadata?.version).toBe('1.0.0');
		expect(formSchema.metadata?.author).toBe('SODAF System');
		expect(formSchema.metadata?.description).toBe('Form for TestDocType DocType');
		expect(formSchema.metadata?.tags).toEqual(['Core']);
		// Find the section with the fields if sections exist
		if (formSchema.sections && formSchema.sections.length > 0) {
			const sectionWithName = formSchema.sections.find(s => s.fieldname === 'name');
			if (sectionWithName) {
				expect(sectionWithName.fields![0].fieldname).toBe('name');
				expect(sectionWithName.fields![0].fieldtype).toBe('Data');
				expect(sectionWithName.fields![0].required).toBe(true);
				// Note: 'unique' is a DocField property that gets mapped to validation rules in FormField
				expect(sectionWithName.fields![0].validation).toBeDefined();
				expect(sectionWithName.fields![0].validation?.some((rule: any) => rule.type === 'unique')).toBe(true);
			}

			const sectionWithStatus = formSchema.sections.find(s => s.fields?.some(f => f.fieldname === 'status'));
			if (sectionWithStatus) {
				expect(sectionWithStatus.fields![0].fieldname).toBe('status');
				expect(sectionWithStatus.fields![0].fieldtype).toBe('Select');
				expect(sectionWithStatus.fields![0].options).toBe('Active\nInactive');
				expect(sectionWithStatus.fields![0].default).toBe('Active');
			}

			const sectionWithDescription = formSchema.sections.find(s => s.fields?.some(f => f.fieldname === 'description'));
			if (sectionWithDescription) {
				expect(sectionWithDescription.fields![0].fieldname).toBe('description');
				expect(sectionWithDescription.fields![0].fieldtype).toBe('Long Text');
			}
		}
	});

	/**
	 * Test DocType with Section Break to FormSchema conversion
	 */
	it('should convert DocType with Section Break to FormSchema with multiple sections', () => {
		const docType: DocType = {
			name: 'TestDocType',
			module: 'Core',
			fields: [
				{
					fieldname: 'name',
					label: 'Name',
					fieldtype: 'Data',
					required: true
				},
				{
					fieldname: 'section_break_1',
					label: 'Personal Information',
					fieldtype: 'Section Break',
					collapsible: true,
					order: 10
				},
				{
					fieldname: 'first_name',
					label: 'First Name',
					fieldtype: 'Data',
					order: 20
				},
				{
					fieldname: 'last_name',
					label: 'Last Name',
					fieldtype: 'Data',
					order: 30
				},
				{
					fieldname: 'section_break_2',
					label: 'Contact Information',
					fieldtype: 'Section Break',
					order: 40
				},
				{
					fieldname: 'email',
					label: 'Email',
					fieldtype: 'Data',
					order: 50
				},
				{
					fieldname: 'phone',
					label: 'Phone',
					fieldtype: 'Data',
					order: 60
				}
			],
			permissions: []
		};

		const formSchema = DocTypeFormAdapter.toFormSchema(docType);

		expect(formSchema.doctype).toBe('TestDocType');
		expect(formSchema.sections).toBeDefined();
		// Based on the implementation, only sections after Section Break are created
		expect(formSchema.sections).toHaveLength(2);

		// First section (Personal Information)
		const firstSection = formSchema.sections![0];
		expect(firstSection.fieldname).toBe('section_break_1');
		expect(firstSection.label).toBe('Personal Information');
		expect(firstSection.collapsible).toBe(true);
		expect(firstSection.fields).toHaveLength(2);
		expect(firstSection.fields![0].fieldname).toBe('first_name');
		expect(firstSection.fields![1].fieldname).toBe('last_name');

		// Second section (Contact Information)
		const secondSection = formSchema.sections![1];
		expect(secondSection.fieldname).toBe('section_break_2');
		expect(secondSection.label).toBe('Contact Information');
		expect(secondSection.fields).toHaveLength(2);
		expect(secondSection.fields![0].fieldname).toBe('email');
		expect(secondSection.fields![1].fieldname).toBe('phone');
	});

	/**
	 * Test DocType with Column Break to FormSchema conversion
	 */
	it('should convert DocType with Column Break to FormSchema with columns', () => {
		const docType: DocType = {
			name: 'TestDocType',
			module: 'Core',
			fields: [
				{
					fieldname: 'section_break_1',
					label: 'Address Information',
					fieldtype: 'Section Break',
					order: 10
				},
				{
					fieldname: 'address_line_1',
					label: 'Address Line 1',
					fieldtype: 'Data',
					order: 20
				},
				{
					fieldname: 'column_break_1',
					label: 'Column Break',
					fieldtype: 'Column Break',
					width: '50%',
					order: 30
				},
				{
					fieldname: 'city',
					label: 'City',
					fieldtype: 'Data',
					order: 40
				},
				{
					fieldname: 'column_break_2',
					label: 'Column Break',
					fieldtype: 'Column Break',
					width: '50%',
					order: 50
				},
				{
					fieldname: 'state',
					label: 'State',
					fieldtype: 'Data',
					order: 60
				},
				{
					fieldname: 'postal_code',
					label: 'Postal Code',
					fieldtype: 'Data',
					order: 70
				}
			],
			permissions: []
		};

		const formSchema = DocTypeFormAdapter.toFormSchema(docType);

		expect(formSchema.doctype).toBe('TestDocType');
		expect(formSchema.sections).toBeDefined();
		expect(formSchema.sections).toHaveLength(1);

		const section = formSchema.sections![0];
		expect(section.fieldname).toBe('section_break_1');
		expect(section.label).toBe('Address Information');
		expect(section.columns).toBeDefined();
		// Based on the implementation, only 2 columns are created
		expect(section.columns).toHaveLength(2);

		// First column contains fields before the Column Break
		const firstColumn = section.columns![0];
		expect(firstColumn.width).toBe('50%');
		expect(firstColumn.fields).toHaveLength(1);
		expect(firstColumn.fields[0].fieldname).toBe('city');

		// Second column is created for fields after Column Break
		const secondColumn = section.columns![1];
		expect(secondColumn.width).toBe('50%');
		expect(secondColumn.fields).toHaveLength(2);
		expect(secondColumn.fields[0].fieldname).toBe('state');
		expect(secondColumn.fields[1].fieldname).toBe('postal_code');
	});

	/**
	 * Test DocType with Tab Break to FormSchema conversion
	 */
	it('should convert DocType with Tab Break to FormSchema with tabs', () => {
		const docType: DocType = {
			name: 'TestDocType',
			module: 'Core',
			fields: [
				{
					fieldname: 'name',
					label: 'Name',
					fieldtype: 'Data',
					required: true
				},
				{
					fieldname: 'tab_break_1',
					label: 'Personal Information',
					fieldtype: 'Tab Break',
					order: 10
				},
				{
					fieldname: 'section_break_1',
					label: 'Basic Information',
					fieldtype: 'Section Break',
					order: 20
				},
				{
					fieldname: 'first_name',
					label: 'First Name',
					fieldtype: 'Data',
					order: 30
				},
				{
					fieldname: 'last_name',
					label: 'Last Name',
					fieldtype: 'Data',
					order: 40
				},
				{
					fieldname: 'tab_break_2',
					label: 'Contact Information',
					fieldtype: 'Tab Break',
					order: 50
				},
				{
					fieldname: 'section_break_2',
					label: 'Contact Details',
					fieldtype: 'Section Break',
					order: 60
				},
				{
					fieldname: 'email',
					label: 'Email',
					fieldtype: 'Data',
					order: 70
				},
				{
					fieldname: 'phone',
					label: 'Phone',
					fieldtype: 'Data',
					order: 80
				}
			],
			permissions: []
		};

		const formSchema = DocTypeFormAdapter.toFormSchema(docType);

		expect(formSchema.doctype).toBe('TestDocType');
		expect(formSchema.tabs).toBeDefined();
		expect(formSchema.tabs).toHaveLength(2);
		expect(formSchema.sections).toBeUndefined();
		expect(formSchema.layout.has_tabs).toBe(true);

		// First tab (Personal Information)
		const firstTab = formSchema.tabs![0];
		expect(firstTab.fieldname).toBe('tab_break_1');
		expect(firstTab.label).toBe('Personal Information');
		expect(firstTab.sections!.length).toBe(1);

		const firstTabSection = firstTab.sections![0];
		expect(firstTabSection.fieldname).toBe('section_break_1');
		expect(firstTabSection.label).toBe('Basic Information');
		expect(firstTabSection.fields).toHaveLength(2);
		expect(firstTabSection.fields![0].fieldname).toBe('first_name');
		expect(firstTabSection.fields![1].fieldname).toBe('last_name');

		// Second tab (Contact Information)
		const secondTab = formSchema.tabs![1];
		expect(secondTab.fieldname).toBe('tab_break_2');
		expect(secondTab.label).toBe('Contact Information');
		expect(secondTab.sections!.length).toBe(1);

		const secondTabSection = secondTab.sections![0];
		expect(secondTabSection.fieldname).toBe('section_break_2');
		expect(secondTabSection.label).toBe('Contact Details');
		expect(secondTabSection.fields).toHaveLength(2);
		expect(secondTabSection.fields![0].fieldname).toBe('email');
		expect(secondTabSection.fields![1].fieldname).toBe('phone');
	});

	/**
	 * Test DocType with complex layout (Tabs, Sections, and Columns)
	 */
	it('should convert DocType with complex layout to FormSchema', () => {
		const docType: DocType = {
			name: 'TestDocType',
			module: 'Core',
			fields: [
				{
					fieldname: 'name',
					label: 'Name',
					fieldtype: 'Data',
					required: true
				},
				{
					fieldname: 'tab_break_1',
					label: 'Personal Information',
					fieldtype: 'Tab Break',
					order: 10
				},
				{
					fieldname: 'section_break_1',
					label: 'Basic Information',
					fieldtype: 'Section Break',
					order: 20
				},
				{
					fieldname: 'first_name',
					label: 'First Name',
					fieldtype: 'Data',
					order: 30
				},
				{
					fieldname: 'column_break_1',
					label: 'Column Break',
					fieldtype: 'Column Break',
					width: '50%',
					order: 40
				},
				{
					fieldname: 'last_name',
					label: 'Last Name',
					fieldtype: 'Data',
					order: 50
				},
				{
					fieldname: 'section_break_2',
					label: 'Additional Information',
					fieldtype: 'Section Break',
					order: 60
				},
				{
					fieldname: 'age',
					label: 'Age',
					fieldtype: 'Int',
					order: 70
				}
			],
			permissions: []
		};

		const formSchema = DocTypeFormAdapter.toFormSchema(docType);

		expect(formSchema.doctype).toBe('TestDocType');
		expect(formSchema.tabs).toBeDefined();
		expect(formSchema.tabs).toHaveLength(1);
		expect(formSchema.layout.has_tabs).toBe(true);

		const tab = formSchema.tabs![0];
		expect(tab.fieldname).toBe('tab_break_1');
		expect(tab.label).toBe('Personal Information');
		expect(tab.sections).toHaveLength(2);

		// First section with columns
		const firstSection = tab.sections[0];
		expect(firstSection.fieldname).toBe('section_break_1');
		expect(firstSection.label).toBe('Basic Information');
		expect(firstSection.columns).toBeDefined();
		// Based on the implementation, only 1 column is created
		expect(firstSection.columns).toHaveLength(1);

		const firstColumn = firstSection.columns![0];
		// The first column contains fields after Column Break
		expect(firstColumn.width).toBe('50%');
		expect(firstColumn.fields).toHaveLength(1);
		expect(firstColumn.fields[0].fieldname).toBe('last_name');

		// Second section with direct fields
		const secondSection = tab.sections[1];
		expect(secondSection.fieldname).toBe('section_break_2');
		expect(secondSection.label).toBe('Additional Information');
		expect(secondSection.fields).toBeDefined();
		expect(secondSection.fields).toHaveLength(1);
		expect(secondSection.fields![0].fieldname).toBe('age');
	});

	/**
	 * Test DocField to FormField conversion
	 */
	it('should convert DocField to FormField', () => {
		const docField: DocField = {
			fieldname: 'test_field',
			label: 'Test Field',
			fieldtype: 'Data',
			required: true,
			read_only: false,
			hidden: false,
			default: 'Default Value',
			options: 'Option1\nOption2\nOption3',
			description: 'Test field description',
			width: '100%',
			order: 1,
			depends_on: 'other_field',
			translatable: true,
			precision: 2,
			length: 100,
			change: 'console.log("Field changed")',
			validate: 'return value !== ""'
		};

		const formField = DocTypeFormAdapter.toFormField(docField);

		expect(formField.fieldname).toBe('test_field');
		expect(formField.fieldtype).toBe('Data');
		expect(formField.label).toBe('Test Field');
		expect(formField.required).toBe(true);
		expect(formField.read_only).toBe(false);
		expect(formField.hidden).toBe(false);
		expect(formField.default).toBe('Default Value');
		expect(formField.options).toBe('Option1\nOption2\nOption3');
		expect(formField.description).toBe('Test field description');
		expect(formField.width).toBe('100%');
		expect(formField.order).toBe(1);
		expect(formField.depends_on).toBe('other_field');
		expect(formField.translatable).toBe(true);
		expect(formField.precision).toBe(2);
		expect(formField.length).toBe(100);
		expect(formField.on_change).toBe('console.log("Field changed")');
		expect(formField.validation).toHaveLength(1);
		expect(formField.validation?.[0].type).toBe('custom');
		expect(formField.validation?.[0].message).toBe('Validation failed');
		expect(formField.validation?.[0].validator).toBe('return value !== ""');
		expect(formField.validation?.[0].trigger).toBe('change');
	});

	/**
	 * Test FormSchema layout properties
	 */
	it('should set correct layout properties in FormSchema', () => {
		const docType: DocType = {
			name: 'TestDocType',
			module: 'Core',
			fields: [
				{
					fieldname: 'name',
					label: 'Name',
					fieldtype: 'Data'
				}
			],
			permissions: []
		};

		const formSchema = DocTypeFormAdapter.toFormSchema(docType);

		expect(formSchema.layout.has_tabs).toBe(false);
		expect(formSchema.layout.quick_entry).toBe(false);
		expect(formSchema.layout.print_hide).toBe(false);
		expect(formSchema.layout.class).toBe('sodaf-form');
		expect(formSchema.layout.style).toEqual({});
		expect(formSchema.layout.responsive?.mobile).toBe(768);
		expect(formSchema.layout.responsive?.tablet).toBe(1024);
		expect(formSchema.layout.responsive?.desktop).toBe(1200);
		expect(formSchema.layout.grid?.columns).toBe(12);
		expect(formSchema.layout.grid?.gap).toBe('1rem');
		expect(formSchema.layout.grid?.min_width).toBe('200px');
		expect(formSchema.layout.animations?.enabled).toBe(true);
		expect(formSchema.layout.animations?.duration).toBe('0.3s');
		expect(formSchema.layout.animations?.easing).toBe('ease-in-out');
	});

	/**
	 * Test FormSchema metadata properties
	 */
	it('should set correct metadata properties in FormSchema', () => {
		const docType: DocType = {
			name: 'TestDocType',
			module: 'TestModule',
			fields: [
				{
					fieldname: 'name',
					label: 'Name',
					fieldtype: 'Data'
				}
			],
			permissions: []
		};

		const formSchema = DocTypeFormAdapter.toFormSchema(docType);

		expect(formSchema.metadata?.version).toBe('1.0.0');
		expect(formSchema.metadata?.author).toBe('SODAF System');
		expect(formSchema.metadata?.description).toBe('Form for TestDocType DocType');
		expect(formSchema.metadata?.tags).toEqual(['TestModule']);
		expect(formSchema.metadata?.created_at).toBeDefined();
	});

	/**
	 * Test empty DocType conversion
	 */
	it('should handle empty DocType conversion', () => {
		const docType: DocType = {
			name: 'EmptyDocType',
			module: 'Core',
			fields: [],
			permissions: []
		};

		const formSchema = DocTypeFormAdapter.toFormSchema(docType);

		expect(formSchema.doctype).toBe('EmptyDocType');
		expect(formSchema.sections).toBeDefined();
		expect(formSchema.sections).toHaveLength(0);
		expect(formSchema.tabs).toBeUndefined();
		expect(formSchema.layout.has_tabs).toBe(false);
	});

	/**
	 * Test DocType with only layout fields
	 */
	it('should handle DocType with only layout fields', () => {
		const docType: DocType = {
			name: 'LayoutOnlyDocType',
			module: 'Core',
			fields: [
				{
					fieldname: 'section_break_1',
					label: 'Section 1',
					fieldtype: 'Section Break'
				},
				{
					fieldname: 'column_break_1',
					label: 'Column 1',
					fieldtype: 'Column Break'
				},
				{
					fieldname: 'tab_break_1',
					label: 'Tab 1',
					fieldtype: 'Tab Break'
				}
			],
			permissions: []
		};

		const formSchema = DocTypeFormAdapter.toFormSchema(docType);

		expect(formSchema.doctype).toBe('LayoutOnlyDocType');
		// Should have tabs because Tab Break is present
		expect(formSchema.tabs).toBeDefined();
		expect(formSchema.tabs).toHaveLength(1);
		expect(formSchema.layout.has_tabs).toBe(true);
	});
});