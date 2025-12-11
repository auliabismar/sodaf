/**
 * CustomFieldManager Tests
 * 
 * This file contains unit tests for the CustomFieldManager class,
 * testing all CRUD operations, validation, and caching functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CustomFieldManager } from '../custom-field';
import type { CreateCustomFieldOptions, UpdateCustomFieldOptions } from '../types';
import type { DocType, DocField, FieldType } from '../../doctype/types';
import {
	CustomFieldExistsError,
	CustomFieldNotFoundError,
	CustomFieldValidationError
} from '../errors';

describe('CustomFieldManager', () => {
	let customFieldManager: CustomFieldManager;

	beforeEach(() => {
		// Reset singleton and create new instance for each test
		CustomFieldManager.resetInstance();
		customFieldManager = CustomFieldManager.getInstance({
			enable_cache: true,
			cache_ttl: 60, // 1 minute
			enable_validation: true
		});
	});

	afterEach(() => {
		// Reset singleton after each test
		CustomFieldManager.resetInstance();
	});

	describe('Singleton Pattern', () => {
		it('should return the same instance', () => {
			const instance1 = CustomFieldManager.getInstance();
			const instance2 = CustomFieldManager.getInstance();
			expect(instance1).toBe(instance2);
		});

		it('should reset instance correctly', () => {
			const instance1 = CustomFieldManager.getInstance();
			CustomFieldManager.resetInstance();
			const instance2 = CustomFieldManager.getInstance();
			expect(instance1).not.toBe(instance2);
		});
	});

	describe('Configuration', () => {
		it('should use default configuration', () => {
			CustomFieldManager.resetInstance();
			const manager = CustomFieldManager.getInstance();
			const config = manager.getConfig();

			expect(config.enable_cache).toBe(true);
			expect(config.cache_ttl).toBe(300);
			expect(config.enable_validation).toBe(true);
			expect(config.enable_migration_support).toBe(true);
			expect(config.enable_api_support).toBe(true);
		});

		it('should use custom configuration', () => {
			CustomFieldManager.resetInstance();
			const manager = CustomFieldManager.getInstance({
				enable_cache: false,
				cache_ttl: 120,
				enable_validation: false
			});

			const config = manager.getConfig();
			expect(config.enable_cache).toBe(false);
			expect(config.cache_ttl).toBe(120);
			expect(config.enable_validation).toBe(false);
		});

		it('should update configuration', () => {
			customFieldManager.updateConfig({
				enable_cache: false,
				cache_ttl: 180
			});

			const config = customFieldManager.getConfig();
			expect(config.enable_cache).toBe(false);
			expect(config.cache_ttl).toBe(180);
		});
	});

	describe('Create Custom Field', () => {
		it('should create a custom field successfully', async () => {
			const options: CreateCustomFieldOptions = {
				dt: 'User',
				fieldname: 'cf_test_field',
				fieldtype: 'Data',
				label: 'Test Field'
			};

			const customField = await customFieldManager.createCustomField(options);

			expect(customField.is_custom).toBe(true);
			expect(customField.dt).toBe('User');
			expect(customField.fieldname).toBe('cf_test_field');
			expect(customField.fieldtype).toBe('Data');
			expect(customField.label).toBe('Test Field');
			expect(customField.creation).toBeDefined();
			expect(customField.modified).toBeDefined();
		});

		it('should throw error if field already exists', async () => {
			const options: CreateCustomFieldOptions = {
				dt: 'User',
				fieldname: 'cf_test_field',
				fieldtype: 'Data',
				label: 'Test Field'
			};

			await customFieldManager.createCustomField(options);

			await expect(customFieldManager.createCustomField(options))
				.rejects.toThrow(CustomFieldExistsError);
		});

		it('should throw validation error for invalid field name', async () => {
			const options: CreateCustomFieldOptions = {
				dt: 'User',
				fieldname: 'invalid field name',
				fieldtype: 'Data',
				label: 'Test Field'
			};

			await expect(customFieldManager.createCustomField(options))
				.rejects.toThrow(CustomFieldValidationError);
		});

		it('should throw validation error for missing required fields', async () => {
			const options = {
				dt: 'User',
				fieldname: 'cf_test_field'
				// Missing fieldtype and label
			} as CreateCustomFieldOptions;

			await expect(customFieldManager.createCustomField(options))
				.rejects.toThrow(CustomFieldValidationError);
		});

		it('should create custom field with all options', async () => {
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

			const customField = await customFieldManager.createCustomField(options);

			expect(customField.required).toBe(true);
			expect(customField.length).toBe(255);
			expect(customField.description).toBe('Test description');
			expect(customField.in_list_view).toBe(true);
			expect(customField.allow_in_quick_entry).toBe(true);
		});
	});

	describe('Get Custom Field', () => {
		it('should get a custom field successfully', async () => {
			const options: CreateCustomFieldOptions = {
				dt: 'User',
				fieldname: 'cf_test_field',
				fieldtype: 'Data',
				label: 'Test Field'
			};

			const createdField = await customFieldManager.createCustomField(options);
			const retrievedField = await customFieldManager.getCustomField('User', 'cf_test_field');

			expect(retrievedField).not.toBeNull();
			expect(retrievedField?.fieldname).toBe(createdField.fieldname);
			expect(retrievedField?.label).toBe(createdField.label);
		});

		it('should return null for non-existent field', async () => {
			const field = await customFieldManager.getCustomField('User', 'cf_non_existent');
			expect(field).toBeNull();
		});

		it('should return null for non-existent DocType', async () => {
			const field = await customFieldManager.getCustomField('NonExistent', 'cf_test_field');
			expect(field).toBeNull();
		});
	});

	describe('Update Custom Field', () => {
		it('should update a custom field successfully', async () => {
			const options: CreateCustomFieldOptions = {
				dt: 'User',
				fieldname: 'cf_test_field',
				fieldtype: 'Data',
				label: 'Test Field'
			};

			await customFieldManager.createCustomField(options);

			const updateOptions: UpdateCustomFieldOptions = {
				label: 'Updated Test Field',
				required: true,
				description: 'Updated description'
			};

			const updatedField = await customFieldManager.updateCustomField(
				'User',
				'cf_test_field',
				updateOptions
			);

			expect(updatedField.label).toBe('Updated Test Field');
			expect(updatedField.required).toBe(true);
			expect(updatedField.description).toBe('Updated description');
			expect(updatedField.modified).toBeDefined();
		});

		it('should throw error for non-existent field', async () => {
			const updateOptions: UpdateCustomFieldOptions = {
				label: 'Updated Test Field'
			};

			await expect(customFieldManager.updateCustomField('User', 'cf_non_existent', updateOptions))
				.rejects.toThrow(CustomFieldNotFoundError);
		});

		it('should throw validation error for invalid update', async () => {
			const options: CreateCustomFieldOptions = {
				dt: 'User',
				fieldname: 'cf_test_field',
				fieldtype: 'Data',
				label: 'Test Field'
			};

			await customFieldManager.createCustomField(options);

			const updateOptions: UpdateCustomFieldOptions = {
				label: '' // Invalid empty label
			};

			await expect(customFieldManager.updateCustomField('User', 'cf_test_field', updateOptions))
				.rejects.toThrow(CustomFieldValidationError);
		});
	});

	describe('Delete Custom Field', () => {
		it('should delete a custom field successfully', async () => {
			const options: CreateCustomFieldOptions = {
				dt: 'User',
				fieldname: 'cf_test_field',
				fieldtype: 'Data',
				label: 'Test Field'
			};

			await customFieldManager.createCustomField(options);
			await customFieldManager.deleteCustomField('User', 'cf_test_field');

			const field = await customFieldManager.getCustomField('User', 'cf_test_field');
			expect(field).toBeNull();
		});

		it('should throw error for non-existent field', async () => {
			await expect(customFieldManager.deleteCustomField('User', 'cf_non_existent'))
				.rejects.toThrow(CustomFieldNotFoundError);
		});
	});

	describe('Get Custom Fields', () => {
		beforeEach(async () => {
			// Create test custom fields
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_field1',
				fieldtype: 'Data',
				label: 'Field 1',
				order: 2
			});

			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_field2',
				fieldtype: 'Int',
				label: 'Field 2',
				order: 1
			});

			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_field3',
				fieldtype: 'Data',
				label: 'Field 3',
				hidden: true,
				order: 3
			});

			await customFieldManager.createCustomField({
				dt: 'Todo',
				fieldname: 'cf_field4',
				fieldtype: 'Data',
				label: 'Field 4'
			});
		});

		it('should get all custom fields for a DocType', async () => {
			const fields = await customFieldManager.getCustomFields('User', {
				include_hidden: true
			});
			expect(fields).toHaveLength(3);
			expect(fields.map(f => f.fieldname)).toEqual(
				expect.arrayContaining(['cf_field1', 'cf_field2', 'cf_field3'])
			);
		});

		it('should filter by field type', async () => {
			const fields = await customFieldManager.getCustomFields('User', {
				fieldtype: 'Data',
				include_hidden: true
			});
			expect(fields).toHaveLength(2);
			expect(fields.map(f => f.fieldname)).toEqual(
				expect.arrayContaining(['cf_field1', 'cf_field3'])
			);
		});

		it('should exclude hidden fields by default', async () => {
			const fields = await customFieldManager.getCustomFields('User');
			expect(fields).toHaveLength(2);
			expect(fields.map(f => f.fieldname)).not.toContain('cf_field3');
		});

		it('should include hidden fields when requested', async () => {
			const fields = await customFieldManager.getCustomFields('User', {
				include_hidden: true
			});
			expect(fields).toHaveLength(3);
			expect(fields.map(f => f.fieldname)).toContain('cf_field3');
		});

		it('should sort by order by default', async () => {
			const fields = await customFieldManager.getCustomFields('User', {
				include_hidden: true
			});
			expect(fields[0].fieldname).toBe('cf_field2');
			expect(fields[1].fieldname).toBe('cf_field1');
			expect(fields[2].fieldname).toBe('cf_field3');
		});

		it('should sort by custom field', async () => {
			const fields = await customFieldManager.getCustomFields('User', {
				sort_by: 'label',
				sort_order: 'asc',
				include_hidden: true
			});
			expect(fields[0].fieldname).toBe('cf_field1');
			expect(fields[1].fieldname).toBe('cf_field2');
			expect(fields[2].fieldname).toBe('cf_field3');
		});

		it('should apply pagination', async () => {
			const fields = await customFieldManager.getCustomFields('User', {
				limit: 2,
				offset: 1,
				include_hidden: true
			});
			expect(fields).toHaveLength(2);
			expect(fields[0].fieldname).toBe('cf_field1');
			expect(fields[1].fieldname).toBe('cf_field3');
		});
	});

	describe('Get All Custom Fields', () => {
		beforeEach(async () => {
			// Create test custom fields
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_field1',
				fieldtype: 'Data',
				label: 'Field 1'
			});

			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_field2',
				fieldtype: 'Int',
				label: 'Field 2'
			});

			await customFieldManager.createCustomField({
				dt: 'Todo',
				fieldname: 'cf_field3',
				fieldtype: 'Data',
				label: 'Field 3'
			});
		});

		it('should get all custom fields for all DocTypes', async () => {
			const fields = await customFieldManager.getAllCustomFields();
			expect(fields).toHaveLength(3);
		});

		it('should filter by DocType', async () => {
			const fields = await customFieldManager.getAllCustomFields({
				dt: 'User'
			});
			expect(fields).toHaveLength(2);
			expect(fields.map(f => f.fieldname)).toEqual(
				expect.arrayContaining(['cf_field1', 'cf_field2'])
			);
		});
	});

	describe('Has Custom Field', () => {
		it('should return true for existing field', async () => {
			const options: CreateCustomFieldOptions = {
				dt: 'User',
				fieldname: 'cf_test_field',
				fieldtype: 'Data',
				label: 'Test Field'
			};

			await customFieldManager.createCustomField(options);

			const hasField = await customFieldManager.hasCustomField('User', 'cf_test_field');
			expect(hasField).toBe(true);
		});

		it('should return false for non-existent field', async () => {
			const hasField = await customFieldManager.hasCustomField('User', 'cf_non_existent');
			expect(hasField).toBe(false);
		});
	});

	describe('Get Custom Field Count', () => {
		beforeEach(async () => {
			// Create test custom fields
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_field1',
				fieldtype: 'Data',
				label: 'Field 1'
			});

			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_field2',
				fieldtype: 'Int',
				label: 'Field 2'
			});

			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_field3',
				fieldtype: 'Data',
				label: 'Field 3',
				hidden: true
			});
		});

		it('should return count of all custom fields', async () => {
			const count = await customFieldManager.getCustomFieldCount('User');
			expect(count).toBe(2); // Hidden fields excluded by default
		});

		it('should return count including hidden fields', async () => {
			const count = await customFieldManager.getCustomFieldCount('User', {
				include_hidden: true
			});
			expect(count).toBe(3);
		});

		it('should return count filtered by field type', async () => {
			const count = await customFieldManager.getCustomFieldCount('User', {
				fieldtype: 'Data'
			});
			expect(count).toBe(1);
		});
	});

	describe('Get DocTypes With Custom Fields', () => {
		it('should return DocTypes with custom fields', async () => {
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_field1',
				fieldtype: 'Data',
				label: 'Field 1'
			});

			await customFieldManager.createCustomField({
				dt: 'Todo',
				fieldname: 'cf_field2',
				fieldtype: 'Data',
				label: 'Field 2'
			});

			const docTypes = await customFieldManager.getDocTypesWithCustomFields();
			expect(docTypes).toHaveLength(2);
			expect(docTypes).toEqual(expect.arrayContaining(['User', 'Todo']));
		});

		it('should return empty array when no custom fields exist', async () => {
			const docTypes = await customFieldManager.getDocTypesWithCustomFields();
			expect(docTypes).toHaveLength(0);
		});
	});

	describe('Merge Custom Fields', () => {
		it('should merge custom fields into DocType', async () => {
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_field1',
				fieldtype: 'Data',
				label: 'Field 1'
			});

			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_field2',
				fieldtype: 'Int',
				label: 'Field 2'
			});

			const docType: DocType = {
				name: 'User',
				module: 'Core',
				fields: [
					{ fieldname: 'name', fieldtype: 'Data', label: 'Name' },
					{ fieldname: 'email', fieldtype: 'Data', label: 'Email' }
				] as DocField[],
				permissions: []
			};

			const mergedDocType = await customFieldManager.mergeCustomFields(docType);

			expect(mergedDocType.fields).toHaveLength(4);
			expect(mergedDocType.fields.map(f => f.fieldname)).toEqual(
				expect.arrayContaining(['name', 'email', 'cf_field1', 'cf_field2'])
			);
			expect(mergedDocType.custom_fields).toHaveLength(2);
			expect(mergedDocType.custom_fields?.map(f => f.fieldname)).toEqual(
				expect.arrayContaining(['cf_field1', 'cf_field2'])
			);
		});

		it('should return original DocType when no custom fields exist', async () => {
			const docType: DocType = {
				name: 'User',
				module: 'Core',
				fields: [
					{ fieldname: 'name', fieldtype: 'Data', label: 'Name' },
					{ fieldname: 'email', fieldtype: 'Data', label: 'Email' }
				] as DocField[],
				permissions: []
			};

			const mergedDocType = await customFieldManager.mergeCustomFields(docType);

			expect(mergedDocType.fields).toHaveLength(2);
			expect(mergedDocType.custom_fields).toBeUndefined();
		});
	});

	describe('Clear Custom Fields', () => {
		it('should clear all custom fields', async () => {
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_field1',
				fieldtype: 'Data',
				label: 'Field 1'
			});

			await customFieldManager.createCustomField({
				dt: 'Todo',
				fieldname: 'cf_field2',
				fieldtype: 'Data',
				label: 'Field 2'
			});

			await customFieldManager.clearAllCustomFields();

			const userFields = await customFieldManager.getCustomFields('User');
			const todoFields = await customFieldManager.getCustomFields('Todo');

			expect(userFields).toHaveLength(0);
			expect(todoFields).toHaveLength(0);
		});

		it('should clear custom fields for specific DocType', async () => {
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_field1',
				fieldtype: 'Data',
				label: 'Field 1'
			});

			await customFieldManager.createCustomField({
				dt: 'Todo',
				fieldname: 'cf_field2',
				fieldtype: 'Data',
				label: 'Field 2'
			});

			await customFieldManager.clearCustomFields('User');

			const userFields = await customFieldManager.getCustomFields('User');
			const todoFields = await customFieldManager.getCustomFields('Todo');

			expect(userFields).toHaveLength(0);
			expect(todoFields).toHaveLength(1);
		});
	});

	describe('Caching', () => {
		it('should cache custom fields when enabled', async () => {
			const options: CreateCustomFieldOptions = {
				dt: 'User',
				fieldname: 'cf_test_field',
				fieldtype: 'Data',
				label: 'Test Field'
			};

			await customFieldManager.createCustomField(options);

			// First call should cache the field
			const field1 = await customFieldManager.getCustomField('User', 'cf_test_field');

			// Second call should return from cache
			const field2 = await customFieldManager.getCustomField('User', 'cf_test_field');

			expect(field1).toBe(field2); // Same object reference
		});

		it('should not cache when disabled', async () => {
			CustomFieldManager.resetInstance();
			const manager = CustomFieldManager.getInstance({ enable_cache: false });

			const options: CreateCustomFieldOptions = {
				dt: 'User',
				fieldname: 'cf_test_field',
				fieldtype: 'Data',
				label: 'Test Field'
			};

			await manager.createCustomField(options);

			// First call
			const field1 = await manager.getCustomField('User', 'cf_test_field');

			// Second call
			const field2 = await manager.getCustomField('User', 'cf_test_field');

			expect(field1).not.toBe(field2); // Different object references
		});

		it('should invalidate cache when field is updated', async () => {
			const options: CreateCustomFieldOptions = {
				dt: 'User',
				fieldname: 'cf_test_field',
				fieldtype: 'Data',
				label: 'Test Field'
			};

			await customFieldManager.createCustomField(options);

			// First call should cache the field
			const field1 = await customFieldManager.getCustomField('User', 'cf_test_field');

			// Update the field
			await customFieldManager.updateCustomField('User', 'cf_test_field', {
				label: 'Updated Field'
			});

			// Second call should return updated field
			const field2 = await customFieldManager.getCustomField('User', 'cf_test_field');

			expect(field1?.label).toBe('Test Field');
			expect(field2?.label).toBe('Updated Field');
			expect(field1).not.toBe(field2); // Different object references
		});

		it('should invalidate cache when field is deleted', async () => {
			const options: CreateCustomFieldOptions = {
				dt: 'User',
				fieldname: 'cf_test_field',
				fieldtype: 'Data',
				label: 'Test Field'
			};

			await customFieldManager.createCustomField(options);

			// First call should cache the field
			const field1 = await customFieldManager.getCustomField('User', 'cf_test_field');
			expect(field1).not.toBeNull();

			// Delete the field
			await customFieldManager.deleteCustomField('User', 'cf_test_field');

			// Second call should return null
			const field2 = await customFieldManager.getCustomField('User', 'cf_test_field');
			expect(field2).toBeNull();
		});
	});
});