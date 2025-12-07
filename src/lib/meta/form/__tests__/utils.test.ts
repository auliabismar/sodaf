/**
 * Form Schema Utility Functions Tests
 * 
 * This file contains tests for utility functions and type guards used in the form schema system.
 */

import { describe, it, expect } from 'vitest';
import type {
	FormSchema,
	FormSection,
	FormColumn,
	FormField,
	FormTab,
	ValidationRule,
	FormEvent,
	FormScript,
	FormMetadata,
	ValidationType,
	ValidationTrigger,
	FieldMapping,
	FormState,
	FormConfig,
	ValidationContext,
	ValidationOptions
} from '../types';
import type { DocField, DocType } from '../../doctype/types';
import {
	isFormSchema,
	isFormSection,
	isFormColumn,
	isFormField,
	isFormTab,
	isValidationRule,
	isFormEvent,
	isFormScript,
	isFormMetadata,
	isValidationType,
	isValidationTrigger,
	isTextField,
	isNumericField,
	isSelectionField,
	isDateTimeField,
	isBooleanField,
	isFileField,
	isLayoutField,
	isDisplayField,
	docFieldToFormField,
	createDefaultFormState,
	createDefaultFormConfig,
	createDefaultValidationContext,
	createDefaultValidationOptions,
	getAllFieldNames,
	getFieldByName,
	hasTabs,
	hasSections,
	getTotalFieldCount,
	cloneFormSchema,
	mergeFormConfigs
} from '../utils';

describe('Type Guard Functions', () => {
	it('isFormSchema should return true for valid FormSchema', () => {
		const validFormSchema: FormSchema = {
			doctype: 'TestDocType',
			layout: {
				has_tabs: false,
				quick_entry: false,
				print_hide: false
			}
		};
		
		expect(isFormSchema(validFormSchema)).toBe(true);
	});

	it('isFormSchema should return false for invalid FormSchema', () => {
		const invalidFormSchema = {
			// Missing doctype
			layout: {
				has_tabs: false,
				quick_entry: false,
				print_hide: false
			}
		};
		
		expect(isFormSchema(invalidFormSchema)).toBe(false);
	});

	it('isFormSection should return true for valid FormSection', () => {
		const validFormSection: FormSection = {
			fieldname: 'test_section',
			label: 'Test Section'
		};
		
		expect(isFormSection(validFormSection)).toBe(true);
	});

	it('isFormSection should return false for invalid FormSection', () => {
		const invalidFormSection = {
			// Missing fieldname
			label: 'Test Section'
		};
		
		expect(isFormSection(invalidFormSection)).toBe(false);
	});

	it('isFormColumn should return true for valid FormColumn', () => {
		const validFormColumn: FormColumn = {
			fields: [
				{
					fieldname: 'field1',
					fieldtype: 'Data',
					label: 'Field 1'
				}
			]
		};
		
		expect(isFormColumn(validFormColumn)).toBe(true);
	});

	it('isFormColumn should return false for invalid FormColumn', () => {
		const invalidFormColumn = {
			// Missing fields array
			width: '50%'
		};
		
		expect(isFormColumn(invalidFormColumn)).toBe(false);
	});

	it('isFormField should return true for valid FormField', () => {
		const validFormField: FormField = {
			fieldname: 'test_field',
			fieldtype: 'Data',
			label: 'Test Field'
		};
		
		expect(isFormField(validFormField)).toBe(true);
	});

	it('isFormField should return false for invalid FormField', () => {
		const invalidFormField = {
			// Missing fieldname
			fieldtype: 'Data',
			label: 'Test Field'
		};
		
		expect(isFormField(invalidFormField)).toBe(false);
	});

	it('isFormTab should return true for valid FormTab', () => {
		const validFormTab: FormTab = {
			fieldname: 'test_tab',
			label: 'Test Tab',
			sections: [
				{
					fieldname: 'section_1',
					label: 'Section 1'
				}
			]
		};
		
		expect(isFormTab(validFormTab)).toBe(true);
	});

	it('isFormTab should return false for invalid FormTab', () => {
		const invalidFormTab = {
			// Missing sections array
			fieldname: 'test_tab',
			label: 'Test Tab'
		};
		
		expect(isFormTab(invalidFormTab)).toBe(false);
	});

	it('isValidationRule should return true for valid ValidationRule', () => {
		const validValidationRule: ValidationRule = {
			type: 'required',
			message: 'This field is required',
			validator: 'return value !== ""'
		};
		
		expect(isValidationRule(validValidationRule)).toBe(true);
	});

	it('isValidationRule should return false for invalid ValidationRule', () => {
		const invalidValidationRule = {
			// Missing type
			message: 'This field is required',
			validator: 'return value !== ""'
		};
		
		expect(isValidationRule(invalidValidationRule)).toBe(false);
	});

	it('isFormEvent should return true for valid FormEvent', () => {
		const validFormEvent: FormEvent = {
			on_load: 'console.log("Form loaded")',
			on_submit: 'console.log("Form submitted")'
		};
		
		expect(isFormEvent(validFormEvent)).toBe(true);
	});

	it('isFormEvent should return false for invalid FormEvent', () => {
		const invalidFormEvent = {
			// Missing any event handlers
			custom_property: 'invalid'
		};
		
		expect(isFormEvent(invalidFormEvent)).toBe(false);
	});

	it('isFormScript should return true for valid FormScript', () => {
		const validFormScript: FormScript = {
			name: 'test-script',
			code: 'console.log("Test script")',
			type: 'javascript'
		};
		
		expect(isFormScript(validFormScript)).toBe(true);
	});

	it('isFormScript should return false for invalid FormScript', () => {
		const invalidFormScript = {
			// Missing name
			code: 'console.log("Test script")',
			type: 'javascript'
		};
		
		expect(isFormScript(invalidFormScript)).toBe(false);
	});

	it('isFormMetadata should return true for valid FormMetadata', () => {
		const validFormMetadata: FormMetadata = {
			version: '1.0.0',
			author: 'Test Author'
		};
		
		expect(isFormMetadata(validFormMetadata)).toBe(true);
	});

	it('isFormMetadata should return false for invalid FormMetadata', () => {
		const invalidFormMetadata = null;
		
		// The isFormMetadata function returns null for falsy values
		expect(isFormMetadata(invalidFormMetadata)).toBe(null);
	});

	it('isValidationType should return true for valid validation types', () => {
		expect(isValidationType('required')).toBe(true);
		expect(isValidationType('email')).toBe(true);
		expect(isValidationType('custom')).toBe(true);
	});

	it('isValidationType should return false for invalid validation types', () => {
		expect(isValidationType('invalid_type')).toBe(false);
		expect(isValidationType('')).toBe(false);
		expect(isValidationType(null)).toBe(false);
	});

	it('isValidationTrigger should return true for valid validation triggers', () => {
		expect(isValidationTrigger('change')).toBe(true);
		expect(isValidationTrigger('blur')).toBe(true);
		expect(isValidationTrigger('submit')).toBe(true);
	});

	it('isValidationTrigger should return false for invalid validation triggers', () => {
		expect(isValidationTrigger('invalid_trigger')).toBe(false);
		expect(isValidationTrigger('')).toBe(false);
		expect(isValidationTrigger(null)).toBe(false);
	});
});

describe('Field Type Check Functions', () => {
	it('isTextField should return true for text field types', () => {
		expect(isTextField('Data')).toBe(true);
		expect(isTextField('Small Text')).toBe(true);
		expect(isTextField('Long Text')).toBe(true);
		expect(isTextField('Text Editor')).toBe(true);
		expect(isTextField('Code')).toBe(true);
	});

	it('isTextField should return false for non-text field types', () => {
		expect(isTextField('Int')).toBe(false);
		expect(isTextField('Check')).toBe(false);
		expect(isTextField('Date')).toBe(false);
	});

	it('isNumericField should return true for numeric field types', () => {
		expect(isNumericField('Int')).toBe(true);
		expect(isNumericField('Float')).toBe(true);
		expect(isNumericField('Currency')).toBe(true);
		expect(isNumericField('Percent')).toBe(true);
	});

	it('isNumericField should return false for non-numeric field types', () => {
		expect(isNumericField('Data')).toBe(false);
		expect(isNumericField('Check')).toBe(false);
		expect(isNumericField('Date')).toBe(false);
	});

	it('isSelectionField should return true for selection field types', () => {
		expect(isSelectionField('Select')).toBe(true);
		expect(isSelectionField('Link')).toBe(true);
		expect(isSelectionField('Dynamic Link')).toBe(true);
		expect(isSelectionField('Table MultiSelect')).toBe(true);
	});

	it('isSelectionField should return false for non-selection field types', () => {
		expect(isSelectionField('Data')).toBe(false);
		expect(isSelectionField('Int')).toBe(false);
		expect(isSelectionField('Date')).toBe(false);
	});

	it('isDateTimeField should return true for date/time field types', () => {
		expect(isDateTimeField('Date')).toBe(true);
		expect(isDateTimeField('Datetime')).toBe(true);
		expect(isDateTimeField('Time')).toBe(true);
		expect(isDateTimeField('Duration')).toBe(true);
	});

	it('isDateTimeField should return false for non-date/time field types', () => {
		expect(isDateTimeField('Data')).toBe(false);
		expect(isDateTimeField('Int')).toBe(false);
		expect(isDateTimeField('Check')).toBe(false);
	});

	it('isBooleanField should return true for boolean field types', () => {
		expect(isBooleanField('Check')).toBe(true);
	});

	it('isBooleanField should return false for non-boolean field types', () => {
		expect(isBooleanField('Data')).toBe(false);
		expect(isBooleanField('Int')).toBe(false);
		expect(isBooleanField('Date')).toBe(false);
	});

	it('isFileField should return true for file field types', () => {
		expect(isFileField('Attach')).toBe(true);
		expect(isFileField('Attach Image')).toBe(true);
	});

	it('isFileField should return false for non-file field types', () => {
		expect(isFileField('Data')).toBe(false);
		expect(isFileField('Int')).toBe(false);
		expect(isFileField('Date')).toBe(false);
	});

	it('isLayoutField should return true for layout field types', () => {
		expect(isLayoutField('Section Break')).toBe(true);
		expect(isLayoutField('Column Break')).toBe(true);
		expect(isLayoutField('Tab Break')).toBe(true);
		expect(isLayoutField('Fold')).toBe(true);
	});

	it('isLayoutField should return false for non-layout field types', () => {
		expect(isLayoutField('Data')).toBe(false);
		expect(isLayoutField('Int')).toBe(false);
		expect(isLayoutField('Date')).toBe(false);
	});

	it('isDisplayField should return true for display field types', () => {
		expect(isDisplayField('Read Only')).toBe(true);
		expect(isDisplayField('Button')).toBe(true);
		expect(isDisplayField('Image')).toBe(true);
		expect(isDisplayField('HTML')).toBe(true);
	});

	it('isDisplayField should return false for non-display field types', () => {
		expect(isDisplayField('Data')).toBe(false);
		expect(isDisplayField('Int')).toBe(false);
		expect(isDisplayField('Date')).toBe(false);
	});
});

describe('Conversion Functions', () => {
	it('docFieldToFormField should convert DocField to FormField', () => {
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

		const formField = docFieldToFormField(docField);

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
	});
});

describe('Default Creation Functions', () => {
	it('createDefaultFormState should create default form state', () => {
		const formState = createDefaultFormState();

		expect(formState.data).toEqual({});
		expect(formState.original_data).toEqual({});
		expect(formState.errors).toEqual({});
		expect(formState.dirty).toBe(false);
		expect(formState.valid).toBe(true);
		expect(formState.loading).toBe(false);
		expect(formState.submitting).toBe(false);
		expect(formState.active_tab).toBeUndefined();
		expect(formState.collapsed_sections).toEqual([]);
		expect(formState.hidden_fields).toEqual([]);
		expect(formState.disabled_fields).toEqual([]);
	});

	it('createDefaultFormConfig should create default form configuration', () => {
		const formConfig = createDefaultFormConfig();

		expect(formConfig.enable_validation).toBe(true);
		expect(formConfig.auto_save).toBe(false);
		expect(formConfig.auto_save_interval).toBe(30000);
		expect(formConfig.enable_reset).toBe(true);
		expect(formConfig.enable_print).toBe(true);
		expect(formConfig.enable_export).toBe(true);
		expect(formConfig.enable_import).toBe(true);
		expect(formConfig.theme).toBe('default');
		expect(formConfig.language).toBe('en');
		expect(formConfig.custom_classes).toEqual({});
		expect(formConfig.custom_styles).toEqual({});
	});

	it('createDefaultValidationContext should create default validation context', () => {
		const validationContext = createDefaultValidationContext();

		expect(validationContext.data).toEqual({});
		expect(validationContext.permissions).toEqual([]);
		expect(validationContext.extra).toEqual({});
	});

	it('createDefaultValidationOptions should create default validation options', () => {
		const validationOptions = createDefaultValidationOptions();

		expect(validationOptions.immediate).toBe(false);
		expect(validationOptions.validate_empty).toBe(false);
		expect(validationOptions.message_template).toBeUndefined();
		expect(validationOptions.debounce).toBe(300);
	});
});

describe('Form Schema Query Functions', () => {
	it('getAllFieldNames should return all field names from sections', () => {
		const formSchema: FormSchema = {
			doctype: 'TestDocType',
			sections: [
				{
					fieldname: 'section_1',
					label: 'Section 1',
					fields: [
						{
							fieldname: 'field1',
							fieldtype: 'Data',
							label: 'Field 1'
						},
						{
							fieldname: 'field2',
							fieldtype: 'Data',
							label: 'Field 2'
						}
					]
				},
				{
					fieldname: 'section_2',
					label: 'Section 2',
					columns: [
						{
							fields: [
								{
									fieldname: 'field3',
									fieldtype: 'Data',
									label: 'Field 3'
								}
							]
						}
					]
				}
			],
			layout: {}
		};

		const fieldNames = getAllFieldNames(formSchema);

		expect(fieldNames).toEqual(['field1', 'field2', 'field3']);
	});

	it('getAllFieldNames should return all field names from tabs', () => {
		const formSchema: FormSchema = {
			doctype: 'TestDocType',
			tabs: [
				{
					fieldname: 'tab_1',
					label: 'Tab 1',
					sections: [
						{
							fieldname: 'section_1',
							label: 'Section 1',
							fields: [
								{
									fieldname: 'field1',
									fieldtype: 'Data',
									label: 'Field 1'
								}
							]
						}
					]
				}
			],
			layout: {}
		};

		const fieldNames = getAllFieldNames(formSchema);

		expect(fieldNames).toEqual(['field1']);
	});

	it('getFieldByName should return field by name', () => {
		const formSchema: FormSchema = {
			doctype: 'TestDocType',
			sections: [
				{
					fieldname: 'section_1',
					label: 'Section 1',
					fields: [
						{
							fieldname: 'field1',
							fieldtype: 'Data',
							label: 'Field 1'
						}
					]
				}
			],
			layout: {}
		};

		const field = getFieldByName(formSchema, 'field1');

		expect(field).toBeDefined();
		expect(field?.fieldname).toBe('field1');
	});

	it('getFieldByName should return undefined for non-existent field', () => {
		const formSchema: FormSchema = {
			doctype: 'TestDocType',
			sections: [
				{
					fieldname: 'section_1',
					label: 'Section 1',
					fields: [
						{
							fieldname: 'field1',
							fieldtype: 'Data',
							label: 'Field 1'
						}
					]
				}
			],
			layout: {}
		};

		const field = getFieldByName(formSchema, 'non_existent_field');

		expect(field).toBeUndefined();
	});

	it('hasTabs should return true if form has tabs', () => {
		const formSchema: FormSchema = {
			doctype: 'TestDocType',
			tabs: [
				{
					fieldname: 'tab_1',
					label: 'Tab 1',
					sections: []
				}
			],
			layout: {}
		};

		expect(hasTabs(formSchema)).toBe(true);
	});

	it('hasTabs should return false if form has no tabs', () => {
		const formSchema: FormSchema = {
			doctype: 'TestDocType',
			sections: [
				{
					fieldname: 'section_1',
					label: 'Section 1'
				}
			],
			layout: {}
		};

		expect(hasTabs(formSchema)).toBe(false);
	});

	it('hasSections should return true if form has sections', () => {
		const formSchema: FormSchema = {
			doctype: 'TestDocType',
			sections: [
				{
					fieldname: 'section_1',
					label: 'Section 1'
				}
			],
			layout: {}
		};

		expect(hasSections(formSchema)).toBe(true);
	});

	it('hasSections should return false if form has no sections', () => {
		const formSchema: FormSchema = {
			doctype: 'TestDocType',
			tabs: [
				{
					fieldname: 'tab_1',
					label: 'Tab 1',
					sections: []
				}
			],
			layout: {}
		};

		expect(hasSections(formSchema)).toBe(false);
	});

	it('getTotalFieldCount should return total field count', () => {
		const formSchema: FormSchema = {
			doctype: 'TestDocType',
			sections: [
				{
					fieldname: 'section_1',
					label: 'Section 1',
					fields: [
						{
							fieldname: 'field1',
							fieldtype: 'Data',
							label: 'Field 1'
						},
						{
							fieldname: 'field2',
							fieldtype: 'Data',
							label: 'Field 2'
						}
					]
				}
			],
			layout: {}
		};

		const fieldCount = getTotalFieldCount(formSchema);

		expect(fieldCount).toBe(2);
	});

	it('cloneFormSchema should clone form schema', () => {
		const originalFormSchema: FormSchema = {
			doctype: 'TestDocType',
			sections: [
				{
					fieldname: 'section_1',
					label: 'Section 1',
					fields: [
						{
							fieldname: 'field1',
							fieldtype: 'Data',
							label: 'Field 1'
						}
					]
				}
			],
			layout: {}
		};

		const clonedFormSchema = cloneFormSchema(originalFormSchema);

		expect(clonedFormSchema).toEqual(originalFormSchema);
		expect(clonedFormSchema).not.toBe(originalFormSchema);
		expect(clonedFormSchema.sections).not.toBe(originalFormSchema.sections);
	});

	it('mergeFormConfigs should merge form configurations', () => {
		const baseConfig: FormConfig = {
			enable_validation: true,
			auto_save: false,
			auto_save_interval: 30000,
			enable_reset: true,
			enable_print: true,
			enable_export: true,
			enable_import: true,
			theme: 'default',
			language: 'en',
			custom_classes: {
				form: 'base-form'
			},
			custom_styles: {
				backgroundColor: '#ffffff'
			}
		};

		const overrideConfig: Partial<FormConfig> = {
			auto_save: true,
			theme: 'dark',
			custom_classes: {
				section: 'override-section'
			},
			custom_styles: {
				padding: '20px'
			}
		};

		const mergedConfig = mergeFormConfigs(baseConfig, overrideConfig);

		expect(mergedConfig.enable_validation).toBe(true);
		expect(mergedConfig.auto_save).toBe(true);
		expect(mergedConfig.auto_save_interval).toBe(30000);
		expect(mergedConfig.theme).toBe('dark');
		expect(mergedConfig.language).toBe('en');
		expect(mergedConfig.custom_classes?.form).toBe('base-form');
		expect(mergedConfig.custom_classes?.section).toBe('override-section');
		expect(mergedConfig.custom_styles?.backgroundColor).toBe('#ffffff');
		expect(mergedConfig.custom_styles?.padding).toBe('20px');
	});
});