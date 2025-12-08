/**
 * P2-020 Custom Fields Test Cases
 * 
 * This file contains specific test cases for the Custom Fields feature
 * as defined in the SODAF task requirements.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CustomFieldManager } from '../custom-field';
import type { CreateCustomFieldOptions } from '../types';
import type { DocType, DocField } from '../../doctype/types';
import {
	CustomFieldExistsError,
	CustomFieldNotFoundError,
	CustomFieldValidationError
} from '../errors';

describe('P2-020 Custom Fields Test Cases', () => {
	let customFieldManager: CustomFieldManager;
	
	beforeEach(async () => {
		// Reset singleton and create new instance for each test
		CustomFieldManager.resetInstance();
		customFieldManager = CustomFieldManager.getInstance({
			enable_cache: true,
			cache_ttl: 60, // 1 minute
			enable_validation: true
		});
		
		// Add a small delay to ensure proper reset
		await new Promise(resolve => setTimeout(resolve, 10));
	});
	
	afterEach(async () => {
		// Reset singleton after each test
		CustomFieldManager.resetInstance();
		
		// Add a small delay to ensure proper reset
		await new Promise(resolve => setTimeout(resolve, 10));
	});
	
	describe('P2-020-T1: should add custom field to DocType', () => {
		it('should add custom field to DocType with proper properties', async () => {
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
	});
	
	describe('P2-020-T2: should persist custom field to database', () => {
		it('should persist custom field and retrieve it', async () => {
			const options: CreateCustomFieldOptions = {
				dt: 'User',
				fieldname: 'cf_persisted_field',
				fieldtype: 'Data',
				label: 'Persisted Field'
			};
			
			// Create custom field
			const createdField = await customFieldManager.createCustomField(options);
			
			// Retrieve field to simulate persistence
			const retrievedField = await customFieldManager.getCustomField('User', 'cf_persisted_field');
			
			expect(retrievedField).not.toBeNull();
			expect(retrievedField?.fieldname).toBe(createdField.fieldname);
			expect(retrievedField?.label).toBe(createdField.label);
			expect(retrievedField?.creation).toEqual(createdField.creation);
			expect(retrievedField?.modified).toEqual(createdField.modified);
		});
	});
	
	describe('P2-020-T3: should merge custom fields into DocType meta', () => {
		it('should merge custom fields into DocType meta correctly', async () => {
			// Clear any existing fields first
			const existingFields = await customFieldManager.getCustomFields('User');
			for (const field of existingFields) {
				await customFieldManager.deleteCustomField('User', field.fieldname);
			}
			
			// Create custom fields
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_merged_field1',
				fieldtype: 'Data',
				label: 'Merged Field 1',
				order: 1
			});
			
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_merged_field2',
				fieldtype: 'Int',
				label: 'Merged Field 2',
				order: 2
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
			expect(mergedDocType.custom_fields).toHaveLength(2);
			expect(mergedDocType.fields.map((f: DocField) => f.fieldname)).toEqual(
				expect.arrayContaining(['name', 'email', 'cf_merged_field1', 'cf_merged_field2'])
			);
		});
	});
	
	describe('P2-020-T4: should position field correctly with insert_after', () => {
		it('should position custom field correctly with order property', async () => {
			// Clear any existing fields first
			const existingFields = await customFieldManager.getCustomFields('User');
			for (const field of existingFields) {
				await customFieldManager.deleteCustomField('User', field.fieldname);
			}
			
			// Create custom fields with specific order
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_first_field',
				fieldtype: 'Data',
				label: 'First Field',
				order: 1
			});
			
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_second_field',
				fieldtype: 'Data',
				label: 'Second Field',
				order: 2
			});
			
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_third_field',
				fieldtype: 'Data',
				label: 'Third Field',
				order: 3
			});
			
			// Get all custom fields and verify order
			const fields = await customFieldManager.getCustomFields('User');
			expect(fields[0].fieldname).toBe('cf_first_field');
			expect(fields[1].fieldname).toBe('cf_second_field');
			expect(fields[2].fieldname).toBe('cf_third_field');
		});
	});
	
	describe('P2-020-T5: should remove custom field', () => {
		it('should remove custom field successfully', async () => {
			// Create custom field
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_removable_field',
				fieldtype: 'Data',
				label: 'Removable Field'
			});
			
			// Verify field exists
			let field = await customFieldManager.getCustomField('User', 'cf_removable_field');
			expect(field).not.toBeNull();
			
			// Remove custom field
			await customFieldManager.deleteCustomField('User', 'cf_removable_field');
			
			// Verify field is removed
			field = await customFieldManager.getCustomField('User', 'cf_removable_field');
			expect(field).toBeNull();
		});
	});
	
	describe('P2-020-T6: should return all custom fields', () => {
		it('should return all custom fields for a DocType', async () => {
			// Create multiple custom fields
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
				fieldtype: 'Date',
				label: 'Field 3'
			});
			
			// Get all custom fields
			const fields = await customFieldManager.getCustomFields('User');
			expect(fields).toHaveLength(3);
			expect(fields.map((f: any) => f.fieldname)).toEqual(
				expect.arrayContaining(['cf_field1', 'cf_field2', 'cf_field3'])
			);
		});
	});
	
	describe('P2-020-T10: should reject duplicate fieldname', () => {
		it('should reject duplicate fieldname within same DocType', async () => {
			const options: CreateCustomFieldOptions = {
				dt: 'User',
				fieldname: 'cf_duplicate_field',
				fieldtype: 'Data',
				label: 'Duplicate Field'
			};
			
			// Create first field
			await customFieldManager.createCustomField(options);
			
			// Try to create duplicate field
			await expect(customFieldManager.createCustomField(options))
				.rejects.toThrow(CustomFieldExistsError);
		});
	});
	
	describe('P2-020-T11: should reject core field override', () => {
		it('should reject creating custom field with reserved name', async () => {
			const reservedNames = ['name', 'creation', 'modified', 'docstatus'];
			
			for (const reservedName of reservedNames) {
				const options: CreateCustomFieldOptions = {
					dt: 'User',
					fieldname: reservedName,
					fieldtype: 'Data',
					label: `Reserved ${reservedName}`
				};
				
				await expect(customFieldManager.createCustomField(options))
					.rejects.toThrow(CustomFieldValidationError);
			}
		});
	});
	
	describe('P2-020-T8: should handle Link type custom fields', () => {
		it('should create and handle Link type custom fields', async () => {
			const options: CreateCustomFieldOptions = {
				dt: 'Todo',
				fieldname: 'cf_assigned_to',
				fieldtype: 'Link',
				label: 'Assigned To',
				options: 'User'
			};
			
			const customField = await customFieldManager.createCustomField(options);
			
			expect(customField.fieldtype).toBe('Link');
			expect(customField.options).toBe('User');
			expect(customField.fieldname).toBe('cf_assigned_to');
			
			// Verify field can be retrieved
			const retrievedField = await customFieldManager.getCustomField('Todo', 'cf_assigned_to');
			expect(retrievedField).not.toBeNull();
			expect(retrievedField?.fieldtype).toBe('Link');
			expect(retrievedField?.options).toBe('User');
		});
	});
	
	describe('P2-020-T9: should handle Table type custom fields', () => {
		it('should reject Table type custom fields as not supported', async () => {
			const options: CreateCustomFieldOptions = {
				dt: 'User',
				fieldname: 'cf_table_field',
				fieldtype: 'Table' as any,
				label: 'Table Field'
			};
			
			await expect(customFieldManager.createCustomField(options))
				.rejects.toThrow(CustomFieldValidationError);
		});
	});
});