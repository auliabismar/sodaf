/**
 * Custom Field Validators Tests
 * 
 * This file contains unit tests for custom field validation functions,
 * testing all validation rules and edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
	validateFieldName,
	validateFieldLabel,
	validateFieldType,
	validateFieldOptions,
	validateFieldLength,
	validateFieldDefaultValue,
	validateFieldDependencies,
	validateCustomField,
	validateCreateCustomFieldOptions,
	validateUpdateCustomFieldOptions
} from '../validators';
import type { CustomField, CreateCustomFieldOptions, UpdateCustomFieldOptions } from '../types';
import type { FieldType } from '../../doctype/types';

describe('validateFieldName', () => {
	it('should validate a valid field name', () => {
		const result = validateFieldName('cf_test_field');
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should reject empty field name', () => {
		const result = validateFieldName('');
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Field name is required');
	});

	it('should reject whitespace-only field name', () => {
		const result = validateFieldName('   ');
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Field name is required');
	});

	it('should reject non-string field name', () => {
		const result = validateFieldName(123 as any);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Field name must be a string');
	});

	it('should reject field name that is too long', () => {
		const longFieldName = 'a'.repeat(141);
		const result = validateFieldName(longFieldName);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Field name cannot be longer than 140 characters');
	});

	it('should reject field name with invalid characters', () => {
		const result = validateFieldName('invalid-field-name');
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Field name must start with a letter or underscore and contain only letters, numbers, and underscores'
		);
	});

	it('should reject field name starting with a number', () => {
		const result = validateFieldName('123field');
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Field name must start with a letter or underscore and contain only letters, numbers, and underscores'
		);
	});

	it('should reject reserved field names', () => {
		const reservedNames = ['name', 'creation', 'modified', 'docstatus'];

		for (const name of reservedNames) {
			const result = validateFieldName(name);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(`Field name '${name}' is reserved and cannot be used`);
		}
	});

	it('should warn about JavaScript keywords', () => {
		const jsKeywords = ['break', 'case', 'class', 'function'];

		for (const keyword of jsKeywords) {
			const result = validateFieldName(keyword);
			expect(result.valid).toBe(true);
			expect(result.warnings).toContain(
				`Field name '${keyword}' is a JavaScript keyword and may cause issues`
			);
		}
	});

	it('should warn about missing cf_ prefix', () => {
		const result = validateFieldName('test_field');
		expect(result.valid).toBe(true);
		expect(result.warnings).toContain(
			"Custom field names should start with 'cf_' to avoid conflicts with standard fields"
		);
	});

	it('should not warn about cf_ prefix', () => {
		const result = validateFieldName('cf_test_field');
		expect(result.valid).toBe(true);
		expect(result.warnings).toHaveLength(0);
	});
});

describe('validateFieldLabel', () => {
	it('should validate a valid field label', () => {
		const result = validateFieldLabel('Test Field');
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should reject empty field label', () => {
		const result = validateFieldLabel('');
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Field label is required');
	});

	it('should reject whitespace-only field label', () => {
		const result = validateFieldLabel('   ');
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Field label is required');
	});

	it('should reject non-string field label', () => {
		const result = validateFieldLabel(123 as any);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Field label must be a string');
	});

	it('should reject field label that is too long', () => {
		const longLabel = 'a'.repeat(256);
		const result = validateFieldLabel(longLabel);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Field label cannot be longer than 255 characters');
	});
});

describe('validateFieldType', () => {
	it('should validate supported field types', () => {
		const supportedTypes: FieldType[] = [
			'Data', 'Long Text', 'Small Text', 'Text Editor', 'Code', 'Markdown Editor',
			'HTML Editor', 'Int', 'Float', 'Currency', 'Percent', 'Check', 'Select',
			'Link', 'Dynamic Link', 'Date', 'Datetime', 'Time', 'Duration',
			'Geolocation', 'Attach', 'Attach Image', 'Signature', 'Color', 'Rating',
			'Password', 'Read Only'
		];

		for (const fieldtype of supportedTypes) {
			const result = validateFieldType(fieldtype);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		}
	});

	it('should reject empty field type', () => {
		const result = validateFieldType('' as FieldType);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Field type is required');
	});

	it('should reject unsupported field types', () => {
		const unsupportedTypes = ['Table', 'Section Break', 'Column Break', 'Tab Break'];

		for (const fieldtype of unsupportedTypes) {
			const result = validateFieldType(fieldtype as FieldType);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				`Field type '${fieldtype}' is not supported for custom fields`
			);
		}
	});
});

describe('validateFieldOptions', () => {
	it('should validate options for Select field', () => {
		const result = validateFieldOptions('Select', 'Option 1\nOption 2\nOption 3');
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should validate options for Link field', () => {
		const result = validateFieldOptions('Link', 'User');
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should validate options for Dynamic Link field', () => {
		const result = validateFieldOptions('Dynamic Link', 'User');
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should reject missing options for Select field', () => {
		const result = validateFieldOptions('Select', '');
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Field options are required for field type \'Select\''
		);
	});

	it('should reject missing options for Link field', () => {
		const result = validateFieldOptions('Link', '');
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Field options are required for field type \'Link\''
		);
	});

	it('should reject missing options for Dynamic Link field', () => {
		const result = validateFieldOptions('Dynamic Link', '');
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Field options are required for field type \'Dynamic Link\''
		);
	});

	it('should warn about options for non-option field types', () => {
		const result = validateFieldOptions('Data', 'Some options');
		expect(result.valid).toBe(true);
		expect(result.warnings).toContain(
			'Field options are not typically used for field type \'Data\''
		);
	});

	it('should not require options for Data field', () => {
		const result = validateFieldOptions('Data', '');
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});
});

describe('validateFieldLength', () => {
	it('should validate length for text fields', () => {
		const result = validateFieldLength('Data', 255);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should warn about missing length for text fields', () => {
		const result = validateFieldLength('Data');
		expect(result.valid).toBe(true);
		expect(result.warnings).toContain(
			'Field length should be specified for field type \'Data\''
		);
	});

	it('should warn about length for non-text fields', () => {
		const result = validateFieldLength('Int', 10);
		expect(result.valid).toBe(true);
		expect(result.warnings).toContain(
			'Field length is not typically used for field type \'Int\''
		);
	});

	it('should reject zero length', () => {
		const result = validateFieldLength('Data', 0);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Field length must be between 1 and 1000000'
		);
	});

	it('should reject negative length', () => {
		const result = validateFieldLength('Data', -10);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Field length must be between 1 and 1000000'
		);
	});

	it('should reject length that is too large', () => {
		const result = validateFieldLength('Data', 1000001);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Field length must be between 1 and 1000000'
		);
	});
});

describe('validateFieldDefaultValue', () => {
	it('should validate string default value for Data field', () => {
		const result = validateFieldDefaultValue('Data', 'default value');
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should validate integer default value for Int field', () => {
		const result = validateFieldDefaultValue('Int', 42);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should validate float default value for Float field', () => {
		const result = validateFieldDefaultValue('Float', 3.14);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should validate boolean default value for Check field', () => {
		const result = validateFieldDefaultValue('Check', true);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should validate date default value for Date field', () => {
		const result = validateFieldDefaultValue('Date', new Date());
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should validate date string default value for Date field', () => {
		const result = validateFieldDefaultValue('Date', '2023-01-01');
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should reject non-integer default value for Int field', () => {
		const result = validateFieldDefaultValue('Int', 3.14);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Default value for Int field must be an integer'
		);
	});

	it('should reject non-numeric default value for Float field', () => {
		const result = validateFieldDefaultValue('Float', 'not a number');
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Default value for Float field must be a number'
		);
	});

	it('should reject non-boolean default value for Check field', () => {
		const result = validateFieldDefaultValue('Check', 'not a boolean');
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Default value for Check field must be a boolean'
		);
	});

	it('should reject invalid date default value for Date field', () => {
		const result = validateFieldDefaultValue('Date', 123);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Default value for Date field must be a Date object or string'
		);
	});

	it('should accept undefined default value', () => {
		const result = validateFieldDefaultValue('Data', undefined);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should accept null default value', () => {
		const result = validateFieldDefaultValue('Data', null);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});
});

describe('validateFieldDependencies', () => {
	it('should validate no dependencies', () => {
		const result = validateFieldDependencies();
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should validate existing dependency', () => {
		const existingFields = ['field1', 'field2', 'field3'];
		const result = validateFieldDependencies('field1', existingFields);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should reject non-existent dependency', () => {
		const existingFields = ['field1', 'field2', 'field3'];
		const result = validateFieldDependencies('non_existent', existingFields);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Dependency field \'non_existent\' does not exist in the DocType'
		);
	});

	it('should validate empty dependency', () => {
		const result = validateFieldDependencies('');
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should validate whitespace-only dependency', () => {
		const result = validateFieldDependencies('   ');
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should validate dependency with no existing fields', () => {
		const result = validateFieldDependencies('field1');
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});
});

describe('validateCustomField', () => {
	it('should validate a complete custom field', () => {
		const customField: CustomField = {
			is_custom: true,
			dt: 'User',
			fieldname: 'cf_test_field',
			fieldtype: 'Data',
			label: 'Test Field',
			creation: new Date(),
			modified: new Date(),
			owner: 'Administrator',
			modified_by: 'Administrator',
			name: 'User-cf_test_field',
			parent: 'User',
			parentfield: 'custom_fields',
			parenttype: 'DocType',
			idx: 0,
			docstatus: 0
		};

		const result = validateCustomField(customField);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should validate custom field with all properties', () => {
		const customField: CustomField = {
			is_custom: true,
			dt: 'User',
			fieldname: 'cf_comprehensive_field',
			fieldtype: 'Data',
			label: 'Comprehensive Field',
			options: '',
			default: 'default value',
			required: true,
			unique: false,
			length: 255,
			description: 'Test description',
			comment: 'Test comment',
			order: 1,
			in_list_view: true,
			in_standard_filter: true,
			in_global_search: false,
			hidden: false,
			read_only: false,
			validate: '',
			depends_on: '',
			label_depends_on: '',
			mandatory_depends_on: '',
			read_only_depends_on: '',
			hidden_depends_on: '',
			change: '',
			filters: '',
			fetch_from: '',
			fetch_if_empty: false,
			allow_in_quick_entry: true,
			translatable: false,
			no_copy: false,
			remember_last_selected: false,
			bold: false,
			deprecated: false,
			precision_based_on: '',
			width: '',
			columns: '',
			child_doctype: '',
			image_field: '',
			search_index: false,
			email_trigger: false,
			timeline: false,
			track_seen: false,
			track_visits: false,
			old_fieldname: '',
			unique_across_doctypes: false,
			ignore_user_permissions: false,
			ignore_xss_filtered: false,
			allow_on_submit: false,
			collapsible: false,
			collapsible_depends_on: '',
			fetch_to_include: '',
			set_user_permissions: false,
			ignore_strict_user_permissions: false,
			table_fieldname: '',
			real_fieldname: '',
			creation: new Date(),
			modified: new Date(),
			owner: 'Administrator',
			modified_by: 'Administrator',
			name: 'User-cf_comprehensive_field',
			parent: 'User',
			parentfield: 'custom_fields',
			parenttype: 'DocType',
			idx: 0,
			docstatus: 0
		};

		const result = validateCustomField(customField);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should reject custom field with invalid field name', () => {
		const customField: CustomField = {
			is_custom: true,
			dt: 'User',
			fieldname: 'invalid field name',
			fieldtype: 'Data',
			label: 'Test Field',
			creation: new Date(),
			modified: new Date(),
			owner: 'Administrator',
			modified_by: 'Administrator',
			name: 'User-invalid field name',
			parent: 'User',
			parentfield: 'custom_fields',
			parenttype: 'DocType',
			idx: 0,
			docstatus: 0
		};

		const result = validateCustomField(customField);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Field name must start with a letter or underscore and contain only letters, numbers, and underscores'
		);
	});

	it('should reject custom field with invalid field type', () => {
		const customField: CustomField = {
			is_custom: true,
			dt: 'User',
			fieldname: 'cf_test_field',
			fieldtype: 'Table' as FieldType,
			label: 'Test Field',
			creation: new Date(),
			modified: new Date(),
			owner: 'Administrator',
			modified_by: 'Administrator',
			name: 'User-cf_test_field',
			parent: 'User',
			parentfield: 'custom_fields',
			parenttype: 'DocType',
			idx: 0,
			docstatus: 0
		};

		const result = validateCustomField(customField);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Field type \'Table\' is not supported for custom fields'
		);
	});

	it('should reject custom field with missing options for Select field', () => {
		const customField: CustomField = {
			is_custom: true,
			dt: 'User',
			fieldname: 'cf_test_field',
			fieldtype: 'Select',
			label: 'Test Field',
			options: '',
			creation: new Date(),
			modified: new Date(),
			owner: 'Administrator',
			modified_by: 'Administrator',
			name: 'User-cf_test_field',
			parent: 'User',
			parentfield: 'custom_fields',
			parenttype: 'DocType',
			idx: 0,
			docstatus: 0
		};

		const result = validateCustomField(customField);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Field options are required for field type \'Select\''
		);
	});

	it('should reject custom field with invalid default value', () => {
		const customField: CustomField = {
			is_custom: true,
			dt: 'User',
			fieldname: 'cf_test_field',
			fieldtype: 'Int',
			label: 'Test Field',
			default: 'not an integer',
			creation: new Date(),
			modified: new Date(),
			owner: 'Administrator',
			modified_by: 'Administrator',
			name: 'User-cf_test_field',
			parent: 'User',
			parentfield: 'custom_fields',
			parenttype: 'DocType',
			idx: 0,
			docstatus: 0
		};

		const result = validateCustomField(customField);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Default value for Int field must be an integer'
		);
	});

	it('should reject custom field with non-existent dependency', () => {
		const customField: CustomField = {
			is_custom: true,
			dt: 'User',
			fieldname: 'cf_test_field',
			fieldtype: 'Data',
			label: 'Test Field',
			depends_on: 'non_existent_field',
			creation: new Date(),
			modified: new Date(),
			owner: 'Administrator',
			modified_by: 'Administrator',
			name: 'User-cf_test_field',
			parent: 'User',
			parentfield: 'custom_fields',
			parenttype: 'DocType',
			idx: 0,
			docstatus: 0
		};

		const existingFields = ['field1', 'field2', 'field3'];
		const result = validateCustomField(customField, existingFields);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Dependency field \'non_existent_field\' does not exist in the DocType'
		);
	});
});

describe('validateCreateCustomFieldOptions', () => {
	it('should validate valid create options', () => {
		const options: CreateCustomFieldOptions = {
			dt: 'User',
			fieldname: 'cf_test_field',
			fieldtype: 'Data',
			label: 'Test Field'
		};

		const result = validateCreateCustomFieldOptions(options);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should reject missing DocType', () => {
		const options = {
			fieldname: 'cf_test_field',
			fieldtype: 'Data',
			label: 'Test Field'
		} as CreateCustomFieldOptions;

		const result = validateCreateCustomFieldOptions(options);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('DocType is required');
	});

	it('should reject empty DocType', () => {
		const options: CreateCustomFieldOptions = {
			dt: '',
			fieldname: 'cf_test_field',
			fieldtype: 'Data',
			label: 'Test Field'
		};

		const result = validateCreateCustomFieldOptions(options);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('DocType is required');
	});

	it('should reject existing field name', () => {
		const options: CreateCustomFieldOptions = {
			dt: 'User',
			fieldname: 'cf_test_field',
			fieldtype: 'Data',
			label: 'Test Field'
		};

		const existingFields = ['cf_test_field', 'field2', 'field3'];
		const result = validateCreateCustomFieldOptions(options, existingFields);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Field \'cf_test_field\' already exists in the DocType'
		);
	});

	it('should validate complete create options', () => {
		const options: CreateCustomFieldOptions = {
			dt: 'User',
			fieldname: 'cf_comprehensive_field',
			fieldtype: 'Data',
			label: 'Comprehensive Field',
			options: '',
			default: 'default value',
			required: true,
			unique: false,
			length: 255,
			description: 'Test description',
			comment: 'Test comment',
			order: 1,
			in_list_view: true,
			in_standard_filter: true,
			in_global_search: false,
			hidden: false,
			read_only: false,
			validate: '',
			depends_on: '',
			label_depends_on: '',
			mandatory_depends_on: '',
			read_only_depends_on: '',
			hidden_depends_on: '',
			change: '',
			filters: '',
			fetch_from: '',
			fetch_if_empty: false,
			allow_in_quick_entry: true,
			translatable: false,
			no_copy: false,
			remember_last_selected: false,
			bold: false,
			deprecated: false,
			precision_based_on: '',
			width: '',
			columns: '',
			child_doctype: '',
			image_field: '',
			search_index: false,
			email_trigger: false,
			timeline: false,
			track_seen: false,
			track_visits: false,
			old_fieldname: '',
			unique_across_doctypes: false,
			ignore_user_permissions: false,
			ignore_xss_filtered: false,
			allow_on_submit: false,
			collapsible: false,
			collapsible_depends_on: '',
			fetch_to_include: '',
			set_user_permissions: false,
			ignore_strict_user_permissions: false,
			table_fieldname: '',
			real_fieldname: ''
		};

		const result = validateCreateCustomFieldOptions(options);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});
});

describe('validateUpdateCustomFieldOptions', () => {
	it('should validate empty update options', () => {
		const options: UpdateCustomFieldOptions = {};
		const result = validateUpdateCustomFieldOptions(options);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should validate valid label update', () => {
		const options: UpdateCustomFieldOptions = {
			label: 'Updated Label'
		};

		const result = validateUpdateCustomFieldOptions(options);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should validate valid field type update', () => {
		const options: UpdateCustomFieldOptions = {
			fieldtype: 'Int'
		};

		const result = validateUpdateCustomFieldOptions(options);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should reject invalid label update', () => {
		const options: UpdateCustomFieldOptions = {
			label: ''
		};

		const result = validateUpdateCustomFieldOptions(options);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Field label is required');
	});

	it('should reject invalid field type update', () => {
		const options: UpdateCustomFieldOptions = {
			fieldtype: 'Table' as FieldType
		};

		const result = validateUpdateCustomFieldOptions(options);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Field type \'Table\' is not supported for custom fields'
		);
	});

	it('should reject invalid default value update', () => {
		const options: UpdateCustomFieldOptions = {
			fieldtype: 'Int',
			default: 'not an integer'
		};

		const result = validateUpdateCustomFieldOptions(options);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Default value for Int field must be an integer'
		);
	});

	it('should validate complete update options', () => {
		const options: UpdateCustomFieldOptions = {
			label: 'Updated Label',
			fieldtype: 'Int',
			required: true,
			unique: false,
			length: 10,
			description: 'Updated description',
			comment: 'Updated comment',
			order: 2,
			in_list_view: true,
			in_standard_filter: false,
			in_global_search: true,
			hidden: false,
			read_only: true,
			validate: '',
			depends_on: '',
			label_depends_on: '',
			mandatory_depends_on: '',
			read_only_depends_on: '',
			hidden_depends_on: '',
			change: '',
			filters: '',
			fetch_from: '',
			fetch_if_empty: false,
			allow_in_quick_entry: false,
			translatable: true,
			no_copy: true,
			remember_last_selected: true,
			bold: true,
			deprecated: true,
			precision_based_on: '',
			width: '',
			columns: '',
			child_doctype: '',
			image_field: '',
			search_index: true,
			email_trigger: true,
			timeline: true,
			track_seen: true,
			track_visits: true,
			old_fieldname: '',
			unique_across_doctypes: true,
			ignore_user_permissions: true,
			ignore_xss_filtered: true,
			allow_on_submit: true,
			collapsible: true,
			collapsible_depends_on: '',
			fetch_to_include: '',
			set_user_permissions: true,
			ignore_strict_user_permissions: true,
			table_fieldname: '',
			real_fieldname: ''
		};

		const result = validateUpdateCustomFieldOptions(options);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	describe('Additional Comprehensive Validation Tests', () => {
		describe('validateFieldName edge cases', () => {
			it('should handle maximum length field name', () => {
				const maxLengthName = 'a'.repeat(140);
				const result = validateFieldName(maxLengthName);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should reject field name exceeding maximum length', () => {
				const tooLongName = 'a'.repeat(141);
				const result = validateFieldName(tooLongName);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Field name cannot be longer than 140 characters');
			});

			it('should handle field name with numbers', () => {
				const result = validateFieldName('cf_field_123');
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should handle field name with underscores', () => {
				const result = validateFieldName('cf_field_name_with_underscores');
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});
		});

		describe('validateFieldLabel edge cases', () => {
			it('should handle maximum length field label', () => {
				const maxLengthLabel = 'a'.repeat(255);
				const result = validateFieldLabel(maxLengthLabel);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should reject field label exceeding maximum length', () => {
				const tooLongLabel = 'a'.repeat(256);
				const result = validateFieldLabel(tooLongLabel);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Field label cannot be longer than 255 characters');
			});

			it('should handle field label with special characters', () => {
				const result = validateFieldLabel('Field Label with Special Characters: @#$%');
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});
		});

		describe('validateFieldType edge cases', () => {
			it('should handle all supported field types', () => {
				const supportedTypes: FieldType[] = [
					'Data', 'Long Text', 'Small Text', 'Text Editor', 'Code', 'Markdown Editor',
					'HTML Editor', 'Int', 'Float', 'Currency', 'Percent', 'Check', 'Select',
					'Link', 'Dynamic Link', 'Date', 'Datetime', 'Time', 'Duration',
					'Geolocation', 'Attach', 'Attach Image', 'Signature', 'Color', 'Rating',
					'Password', 'Read Only'
				];

				for (const fieldtype of supportedTypes) {
					const result = validateFieldType(fieldtype);
					expect(result.valid).toBe(true);
					expect(result.errors).toHaveLength(0);
				}
			});
		});

		describe('validateFieldOptions edge cases', () => {
			it('should handle Select field with multiline options', () => {
				const result = validateFieldOptions('Select', 'Option 1\nOption 2\nOption 3');
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should handle Link field with valid options', () => {
				const result = validateFieldOptions('Link', 'User');
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should handle Dynamic Link field with valid options', () => {
				const result = validateFieldOptions('Dynamic Link', 'User');
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});
		});

		describe('validateFieldLength edge cases', () => {
			it('should handle maximum valid length', () => {
				const result = validateFieldLength('Data', 1000000);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should reject length exceeding maximum', () => {
				const result = validateFieldLength('Data', 1000001);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Field length must be between 1 and 1000000');
			});

			it('should handle minimum valid length', () => {
				const result = validateFieldLength('Data', 1);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});
		});

		describe('validateFieldDefaultValue edge cases', () => {
			it('should handle Currency field default value', () => {
				const result = validateFieldDefaultValue('Currency', 123.45);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should handle Percent field default value', () => {
				const result = validateFieldDefaultValue('Percent', 85.5);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should handle Time field default value', () => {
				const result = validateFieldDefaultValue('Time', '14:30:00');
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should handle Duration field default value', () => {
				const result = validateFieldDefaultValue('Duration', '2h 30m');
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should handle Geolocation field default value', () => {
				const result = validateFieldDefaultValue('Geolocation', '40.7128,-74.0060');
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should handle Color field default value', () => {
				const result = validateFieldDefaultValue('Color', '#FF5733');
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should handle Rating field default value', () => {
				const result = validateFieldDefaultValue('Rating', 4.5);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});
		});

		describe('validateFieldDependencies edge cases', () => {
			it('should handle complex dependency expressions', () => {
				const result = validateFieldDependencies('field1.field2 == "value"');
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should handle dependency with function call', () => {
				const result = validateFieldDependencies('eval:doc.get_value()');
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should handle multiple dependencies', () => {
				const result = validateFieldDependencies('field1 && field2');
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});
		});

		describe('validateCustomField comprehensive tests', () => {
			it('should validate custom field with all properties', () => {
				const customField = {
					is_custom: true as const,
					dt: 'User',
					fieldname: 'cf_comprehensive_field',
					fieldtype: 'Data' as const,
					label: 'Comprehensive Field',
					options: '',
					default: 'default value',
					required: true,
					unique: false,
					length: 255,
					description: 'Test description',
					comment: 'Test comment',
					order: 1,
					in_list_view: true,
					in_standard_filter: true,
					in_global_search: false,
					hidden: false,
					read_only: false,
					validate: '',
					depends_on: '',
					label_depends_on: '',
					mandatory_depends_on: '',
					read_only_depends_on: '',
					hidden_depends_on: '',
					change: '',
					filters: '',
					fetch_from: '',
					fetch_if_empty: false,
					allow_in_quick_entry: true,
					translatable: false,
					no_copy: false,
					remember_last_selected: false,
					bold: false,
					deprecated: false,
					precision_based_on: '',
					width: '',
					columns: '',
					child_doctype: '',
					image_field: '',
					search_index: false,
					email_trigger: false,
					timeline: false,
					track_seen: false,
					track_visits: false,
					old_fieldname: '',
					unique_across_doctypes: false,
					ignore_user_permissions: false,
					ignore_xss_filtered: false,
					allow_on_submit: false,
					collapsible: false,
					collapsible_depends_on: '',
					fetch_to_include: '',
					set_user_permissions: false,
					ignore_strict_user_permissions: false,
					table_fieldname: '',
					real_fieldname: '',
					creation: new Date(),
					modified: new Date(),
					owner: 'Administrator',
					modified_by: 'Administrator',
					name: 'User-cf_comprehensive_field',
					parent: 'User',
					parentfield: 'custom_fields',
					parenttype: 'DocType',
					idx: 0,
					docstatus: 0
				};

				const result = validateCustomField(customField);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should validate custom field with minimal properties', () => {
				const customField = {
					is_custom: true as const,
					dt: 'User',
					fieldname: 'cf_minimal_field',
					fieldtype: 'Data',
					label: 'Minimal Field',
					creation: new Date(),
					modified: new Date(),
					owner: 'Administrator',
					modified_by: 'Administrator',
					name: 'User-cf_minimal_field',
					parent: 'User',
					parentfield: 'custom_fields',
					parenttype: 'DocType',
					idx: 0,
					docstatus: 0
				} as any;

				const result = validateCustomField(customField);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});
		});

		describe('validateCreateCustomFieldOptions comprehensive tests', () => {
			it('should validate create options with existing fields check', () => {
				const options = {
					dt: 'User',
					fieldname: 'cf_new_field',
					fieldtype: 'Data',
					label: 'New Field'
				} as any;

				const existingFields = ['name', 'email', 'cf_new_field'];
				const result = validateCreateCustomFieldOptions(options, existingFields);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Field \'cf_new_field\' already exists in the DocType');
			});

			it('should validate create options with no existing fields', () => {
				const options = {
					dt: 'User',
					fieldname: 'cf_new_field',
					fieldtype: 'Data',
					label: 'New Field'
				} as any;

				const result = validateCreateCustomFieldOptions(options);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});
		});

		describe('validateUpdateCustomFieldOptions comprehensive tests', () => {
			it('should validate update options with all properties', () => {
				const options = {
					label: 'Updated Label',
					fieldtype: 'Int',
					required: true,
					unique: false,
					length: 10,
					description: 'Updated description',
					comment: 'Updated comment',
					order: 2,
					in_list_view: false,
					in_standard_filter: true,
					in_global_search: true,
					hidden: false,
					read_only: true,
					validate: 'eval:doc.value > 0',
					depends_on: 'other_field',
					label_depends_on: 'other_field',
					mandatory_depends_on: 'other_field',
					read_only_depends_on: 'other_field',
					hidden_depends_on: 'other_field',
					change: 'doc.value',
					filters: 'status="Active"',
					fetch_from: 'other_table.field',
					fetch_if_empty: true,
					allow_in_quick_entry: false,
					translatable: true,
					no_copy: true,
					remember_last_selected: true,
					bold: true,
					deprecated: true,
					precision_based_on: 'other_field',
					width: '50%',
					columns: '2',
					child_doctype: 'ChildDocType',
					image_field: 'image_field',
					search_index: true,
					email_trigger: true,
					timeline: true,
					track_seen: true,
					track_visits: true,
					old_fieldname: 'old_field',
					unique_across_doctypes: true,
					ignore_user_permissions: true,
					ignore_xss_filtered: true,
					allow_on_submit: true,
					collapsible: true,
					collapsible_depends_on: 'other_field',
					fetch_to_include: 'related_field',
					set_user_permissions: true,
					ignore_strict_user_permissions: true,
					table_fieldname: 'table_field',
					real_fieldname: 'real_field'
				} as any;

				const result = validateUpdateCustomFieldOptions(options);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should validate update options with field type change', () => {
				const options = {
					fieldtype: 'Link',
					options: 'User'
				} as any;

				const result = validateUpdateCustomFieldOptions(options);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});

			it('should validate update options with default value change', () => {
				const options = {
					default: 'new default value'
				} as any;

				const result = validateUpdateCustomFieldOptions(options);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});
		});
	});
});