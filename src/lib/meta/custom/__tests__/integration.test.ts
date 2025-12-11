/**
 * Custom Field Integration Tests
 * 
 * This file contains integration tests for custom fields, testing the integration
 * with DocTypeEngine, DocTypeMeta, and other components.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CustomFieldManager } from '../custom-field';
import { DocTypeEngine } from '../../doctype/doctype-engine';
import { DocTypeMeta } from '../../doctype/meta';
import type { DocType, DocField } from '../../doctype/types';
import type { CreateCustomFieldOptions } from '../types';

describe('Custom Field Integration', () => {
	let customFieldManager: CustomFieldManager;
	let docTypeEngine: DocTypeEngine;

	beforeEach(() => {
		// Reset singletons
		CustomFieldManager.resetInstance();
		DocTypeEngine.resetInstance();

		// Create new instances
		customFieldManager = CustomFieldManager.getInstance();
		docTypeEngine = DocTypeEngine.getInstance();
	});

	afterEach(() => {
		// Reset singletons
		CustomFieldManager.resetInstance();
		DocTypeEngine.resetInstance();
	});

	describe('DocType Integration', () => {
		it('should integrate custom fields with DocType definitions', async () => {
			// Register a base DocType
			const userDocType: DocType = {
				name: 'User',
				module: 'Core',
				fields: [
					{ fieldname: 'name', fieldtype: 'Data', label: 'Name' },
					{ fieldname: 'email', fieldtype: 'Data', label: 'Email' }
				] as DocField[],
				permissions: []
			};

			await docTypeEngine.registerDocType(userDocType);

			// Create custom fields
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_phone',
				fieldtype: 'Data',
				label: 'Phone',
				order: 3
			});

			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_age',
				fieldtype: 'Int',
				label: 'Age',
				order: 4
			});

			// Get the DocType from engine
			const retrievedDocType = await docTypeEngine.getDocType('User');
			expect(retrievedDocType).not.toBeNull();
			expect(retrievedDocType?.fields).toHaveLength(2);

			// Merge custom fields
			const mergedDocType = await customFieldManager.mergeCustomFields(retrievedDocType!);
			expect(mergedDocType.fields).toHaveLength(4);
			expect(mergedDocType.fields.map(f => f.fieldname)).toEqual(
				expect.arrayContaining(['name', 'email', 'cf_phone', 'cf_age'])
			);
		});

		it('should maintain field order when merging custom fields', async () => {
			// Register a base DocType
			const todoDocType: DocType = {
				name: 'Todo',
				module: 'Core',
				fields: [
					{ fieldname: 'title', fieldtype: 'Data', label: 'Title', order: 1 },
					{ fieldname: 'description', fieldtype: 'Long Text', label: 'Description', order: 2 }
				] as DocField[],
				permissions: []
			};

			await docTypeEngine.registerDocType(todoDocType);

			// Create custom fields with specific order
			await customFieldManager.createCustomField({
				dt: 'Todo',
				fieldname: 'cf_priority',
				fieldtype: 'Select',
				label: 'Priority',
				options: 'Low\nMedium\nHigh',
				order: 1.5 // Between title and description
			});

			await customFieldManager.createCustomField({
				dt: 'Todo',
				fieldname: 'cf_due_date',
				fieldtype: 'Date',
				label: 'Due Date',
				order: 3 // After description
			});

			// Get and merge DocType
			const retrievedDocType = await docTypeEngine.getDocType('Todo');
			const mergedDocType = await customFieldManager.mergeCustomFields(retrievedDocType!);

			// Check that fields are ordered correctly
			const fields = mergedDocType.fields;
			expect(fields[0].fieldname).toBe('title');
			expect(fields[1].fieldname).toBe('cf_priority');
			expect(fields[2].fieldname).toBe('description');
			expect(fields[3].fieldname).toBe('cf_due_date');
		});

		it('should handle multiple DocTypes with custom fields', async () => {
			// Register multiple DocTypes
			const userDocType: DocType = {
				name: 'User',
				module: 'Core',
				fields: [
					{ fieldname: 'name', fieldtype: 'Data', label: 'Name' }
				] as DocField[],
				permissions: []
			};

			const todoDocType: DocType = {
				name: 'Todo',
				module: 'Core',
				fields: [
					{ fieldname: 'title', fieldtype: 'Data', label: 'Title' }
				] as DocField[],
				permissions: []
			};

			await docTypeEngine.registerDocType(userDocType);
			await docTypeEngine.registerDocType(todoDocType);

			// Create custom fields for different DocTypes
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_phone',
				fieldtype: 'Data',
				label: 'Phone'
			});

			await customFieldManager.createCustomField({
				dt: 'Todo',
				fieldname: 'cf_priority',
				fieldtype: 'Select',
				label: 'Priority',
				options: 'Low\nMedium\nHigh'
			});

			// Verify custom fields are associated with correct DocTypes
			const userFields = await customFieldManager.getCustomFields('User');
			const todoFields = await customFieldManager.getCustomFields('Todo');

			expect(userFields).toHaveLength(1);
			expect(userFields[0].fieldname).toBe('cf_phone');

			expect(todoFields).toHaveLength(1);
			expect(todoFields[0].fieldname).toBe('cf_priority');

			// Verify DocTypes with custom fields
			const docTypesWithCustomFields = await customFieldManager.getDocTypesWithCustomFields();
			expect(docTypesWithCustomFields).toHaveLength(2);
			expect(docTypesWithCustomFields).toEqual(expect.arrayContaining(['User', 'Todo']));
		});
	});

	describe('DocTypeMeta Integration', () => {
		it('should integrate with DocTypeMeta for field access', async () => {
			// Register a base DocType
			const userDocType: DocType = {
				name: 'User',
				module: 'Core',
				fields: [
					{ fieldname: 'name', fieldtype: 'Data', label: 'Name' },
					{ fieldname: 'email', fieldtype: 'Data', label: 'Email' }
				] as DocField[],
				permissions: []
			};

			await docTypeEngine.registerDocType(userDocType);

			// Create custom fields
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_phone',
				fieldtype: 'Data',
				label: 'Phone'
			});

			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_age',
				fieldtype: 'Int',
				label: 'Age'
			});

			// Get DocTypeMeta
			const docTypeMeta = await docTypeEngine.getDocTypeMeta('User', false);
			expect(docTypeMeta).not.toBeNull();

			// Check standard fields
			expect(await docTypeMeta?.get_field('name')).not.toBeNull();
			expect(await docTypeMeta?.get_field('email')).not.toBeNull();

			// Check that custom fields are not in standard DocTypeMeta
			expect(await docTypeMeta?.get_field('cf_phone')).toBeNull();
			expect(await docTypeMeta?.get_field('cf_age')).toBeNull();

			// Merge custom fields and create new DocTypeMeta
			const mergedDocType = await customFieldManager.mergeCustomFields(userDocType);
			const mergedDocTypeMeta = new DocTypeMeta(mergedDocType);

			// Check that all fields are available
			expect(await mergedDocTypeMeta.get_field('name')).not.toBeNull();
			expect(await mergedDocTypeMeta.get_field('email')).not.toBeNull();
			expect(await mergedDocTypeMeta.get_field('cf_phone')).not.toBeNull();
			expect(await mergedDocTypeMeta.get_field('cf_age')).not.toBeNull();

			// Check field count
			expect(await mergedDocTypeMeta.get_all_fields()).toHaveLength(4);
		});

		it('should handle field type queries with custom fields', async () => {
			// Register a base DocType
			const userDocType: DocType = {
				name: 'User',
				module: 'Core',
				fields: [
					{ fieldname: 'name', fieldtype: 'Data', label: 'Name' },
					{ fieldname: 'age', fieldtype: 'Int', label: 'Age' }
				] as DocField[],
				permissions: []
			};

			await docTypeEngine.registerDocType(userDocType);

			// Create custom fields
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_phone',
				fieldtype: 'Data',
				label: 'Phone'
			});

			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_score',
				fieldtype: 'Float',
				label: 'Score'
			});

			// Merge custom fields and create DocTypeMeta
			const mergedDocType = await customFieldManager.mergeCustomFields(userDocType);
			const mergedDocTypeMeta = new DocTypeMeta(mergedDocType);

			// Check field type queries
			const dataFields = await mergedDocTypeMeta.get_fields_by_type('Data');
			const intFields = await mergedDocTypeMeta.get_fields_by_type('Int');
			const floatFields = await mergedDocTypeMeta.get_fields_by_type('Float');

			expect(dataFields).toHaveLength(2); // name + cf_phone
			expect(intFields).toHaveLength(1); // age
			expect(floatFields).toHaveLength(1); // cf_score

			expect(dataFields.map((f: any) => f.fieldname)).toEqual(
				expect.arrayContaining(['name', 'cf_phone'])
			);
		});

		it('should handle required field queries with custom fields', async () => {
			// Register a base DocType
			const userDocType: DocType = {
				name: 'User',
				module: 'Core',
				fields: [
					{ fieldname: 'name', fieldtype: 'Data', label: 'Name', required: true },
					{ fieldname: 'email', fieldtype: 'Data', label: 'Email' }
				] as DocField[],
				permissions: []
			};

			await docTypeEngine.registerDocType(userDocType);

			// Create custom fields
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_phone',
				fieldtype: 'Data',
				label: 'Phone'
			});

			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_address',
				fieldtype: 'Data',
				label: 'Address',
				required: true
			});

			// Merge custom fields and create DocTypeMeta
			const mergedDocType = await customFieldManager.mergeCustomFields(userDocType);
			const mergedDocTypeMeta = new DocTypeMeta(mergedDocType);

			// Check required fields
			const requiredFields = await mergedDocTypeMeta.get_required_fields();
			expect(requiredFields).toHaveLength(2);
			expect(requiredFields.map((f: any) => f.fieldname)).toEqual(
				expect.arrayContaining(['name', 'cf_address'])
			);
		});
	});

	describe('Complex Integration Scenarios', () => {
		it('should handle custom field dependencies on standard fields', async () => {
			// Register a base DocType
			const userDocType: DocType = {
				name: 'User',
				module: 'Core',
				fields: [
					{ fieldname: 'user_type', fieldtype: 'Select', label: 'User Type', options: 'Admin\nUser' },
					{ fieldname: 'name', fieldtype: 'Data', label: 'Name' }
				] as DocField[],
				permissions: []
			};

			await docTypeEngine.registerDocType(userDocType);

			// Create custom field with dependency
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_admin_level',
				fieldtype: 'Int',
				label: 'Admin Level',
				depends_on: 'user_type',
				options: 'eval:doc.user_type === "Admin"'
			});

			// Verify dependency validation
			const existingFields = userDocType.fields.map(f => f.fieldname);
			const customField = await customFieldManager.getCustomField('User', 'cf_admin_level');
			expect(customField).not.toBeNull();
			expect(customField?.depends_on).toBe('user_type');
		});

		it('should handle custom field validation with complex rules', async () => {
			// Register a base DocType
			const userDocType: DocType = {
				name: 'User',
				module: 'Core',
				fields: [
					{ fieldname: 'name', fieldtype: 'Data', label: 'Name' }
				] as DocField[],
				permissions: []
			};

			await docTypeEngine.registerDocType(userDocType);

			// Create custom field with validation
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_email',
				fieldtype: 'Data',
				label: 'Email',
				required: true,
				validate: 'eval:doc.email.includes("@")'
			});

			// Verify validation is stored
			const customField = await customFieldManager.getCustomField('User', 'cf_email');
			expect(customField).not.toBeNull();
			expect(customField?.required).toBe(true);
			expect(customField?.validate).toBe('eval:doc.email.includes("@")');
		});

		it('should handle Link and Select custom fields with options', async () => {
			// Register a base DocType
			const todoDocType: DocType = {
				name: 'Todo',
				module: 'Core',
				fields: [
					{ fieldname: 'title', fieldtype: 'Data', label: 'Title' }
				] as DocField[],
				permissions: []
			};

			// Register linked DocType
			const userDocType: DocType = {
				name: 'User',
				module: 'Core',
				fields: [
					{ fieldname: 'name', fieldtype: 'Data', label: 'Name' }
				] as DocField[],
				permissions: []
			};

			await docTypeEngine.registerDocType(todoDocType);
			await docTypeEngine.registerDocType(userDocType);

			// Create custom fields with options
			await customFieldManager.createCustomField({
				dt: 'Todo',
				fieldname: 'cf_priority',
				fieldtype: 'Select',
				label: 'Priority',
				options: 'Low\nMedium\nHigh'
			});

			await customFieldManager.createCustomField({
				dt: 'Todo',
				fieldname: 'cf_assigned_to',
				fieldtype: 'Link',
				label: 'Assigned To',
				options: 'User'
			});

			// Verify options are stored correctly
			const priorityField = await customFieldManager.getCustomField('Todo', 'cf_priority');
			expect(priorityField).not.toBeNull();
			expect(priorityField?.options).toBe('Low\nMedium\nHigh');

			const assignedToField = await customFieldManager.getCustomField('Todo', 'cf_assigned_to');
			expect(assignedToField).not.toBeNull();
			expect(assignedToField?.options).toBe('User');
		});

		it('should handle custom field updates and deletions', async () => {
			// Register a base DocType
			const userDocType: DocType = {
				name: 'User',
				module: 'Core',
				fields: [
					{ fieldname: 'name', fieldtype: 'Data', label: 'Name' }
				] as DocField[],
				permissions: []
			};

			await docTypeEngine.registerDocType(userDocType);

			// Create custom field
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_phone',
				fieldtype: 'Data',
				label: 'Phone'
			});

			// Verify creation
			let customField = await customFieldManager.getCustomField('User', 'cf_phone');
			expect(customField).not.toBeNull();
			expect(customField?.label).toBe('Phone');

			// Update custom field
			await customFieldManager.updateCustomField('User', 'cf_phone', {
				label: 'Phone Number',
				required: true,
				length: 20
			});

			// Verify update
			customField = await customFieldManager.getCustomField('User', 'cf_phone');
			expect(customField).not.toBeNull();
			expect(customField?.label).toBe('Phone Number');
			expect(customField?.required).toBe(true);
			expect(customField?.length).toBe(20);

			// Delete custom field
			await customFieldManager.deleteCustomField('User', 'cf_phone');

			// Verify deletion
			customField = await customFieldManager.getCustomField('User', 'cf_phone');
			expect(customField).toBeNull();

			const userFields = await customFieldManager.getCustomFields('User');
			expect(userFields).toHaveLength(0);
		});
	});

	describe('Performance and Caching', () => {
		it('should handle large numbers of custom fields efficiently', async () => {
			// Register a base DocType
			const userDocType: DocType = {
				name: 'User',
				module: 'Core',
				fields: [
					{ fieldname: 'name', fieldtype: 'Data', label: 'Name' }
				] as DocField[],
				permissions: []
			};

			await docTypeEngine.registerDocType(userDocType);

			// Create many custom fields
			const fieldCount = 100;
			const createPromises: Promise<any>[] = [];

			for (let i = 0; i < fieldCount; i++) {
				createPromises.push(
					customFieldManager.createCustomField({
						dt: 'User',
						fieldname: `cf_field_${i}`,
						fieldtype: 'Data',
						label: `Field ${i}`,
						order: i + 2
					})
				);
			}

			await Promise.all(createPromises);

			// Verify all fields were created
			const userFields = await customFieldManager.getCustomFields('User');
			expect(userFields).toHaveLength(fieldCount);

			// Test field access performance
			const startTime = Date.now();
			for (let i = 0; i < fieldCount; i++) {
				await customFieldManager.getCustomField('User', `cf_field_${i}`);
			}
			const endTime = Date.now();

			// Should complete within reasonable time (adjust threshold as needed)
			expect(endTime - startTime).toBeLessThan(1000); // 1 second
		});

		it('should handle cache invalidation correctly', async () => {
			// Register a base DocType
			const userDocType: DocType = {
				name: 'User',
				module: 'Core',
				fields: [
					{ fieldname: 'name', fieldtype: 'Data', label: 'Name' }
				] as DocField[],
				permissions: []
			};

			await docTypeEngine.registerDocType(userDocType);

			// Create custom field
			await customFieldManager.createCustomField({
				dt: 'User',
				fieldname: 'cf_phone',
				fieldtype: 'Data',
				label: 'Phone'
			});

			// First access should cache the field
			const field1 = await customFieldManager.getCustomField('User', 'cf_phone');
			expect(field1).not.toBeNull();

			// Update the field
			await customFieldManager.updateCustomField('User', 'cf_phone', {
				label: 'Phone Number'
			});

			// Second access should return updated field
			const field2 = await customFieldManager.getCustomField('User', 'cf_phone');
			expect(field2).not.toBeNull();
			expect(field2?.label).toBe('Phone Number');

			// Verify we got different objects (cache invalidated)
			expect(field1).not.toBe(field2);
		});

		describe('P2-020-T7: should include custom fields in schema migration', () => {
			it('should include custom fields in schema comparison', async () => {
				// Register a base DocType
				const userDocType: DocType = {
					name: 'User',
					module: 'Core',
					fields: [
						{ fieldname: 'name', fieldtype: 'Data', label: 'Name' },
						{ fieldname: 'email', fieldtype: 'Data', label: 'Email' }
					] as DocField[],
					permissions: []
				};

				await docTypeEngine.registerDocType(userDocType);

				// Create custom fields
				await customFieldManager.createCustomField({
					dt: 'User',
					fieldname: 'cf_phone',
					fieldtype: 'Data',
					label: 'Phone'
				});

				await customFieldManager.createCustomField({
					dt: 'User',
					fieldname: 'cf_age',
					fieldtype: 'Int',
					label: 'Age'
				});

				// Get DocType with custom fields merged
				const mergedDocType = await customFieldManager.mergeCustomFields(userDocType);

				// Verify custom fields are included in merged DocType
				expect(mergedDocType.fields).toHaveLength(4);
				expect(mergedDocType.fields.map(f => f.fieldname)).toEqual(
					expect.arrayContaining(['name', 'email', 'cf_phone', 'cf_age'])
				);
				expect(mergedDocType.custom_fields).toHaveLength(2);
			});

			it('should include custom fields in migration SQL generation', async () => {
				// Register a base DocType
				const userDocType: DocType = {
					name: 'User',
					module: 'Core',
					fields: [
						{ fieldname: 'name', fieldtype: 'Data', label: 'Name' },
						{ fieldname: 'email', fieldtype: 'Data', label: 'Email' }
					] as DocField[],
					permissions: []
				};

				await docTypeEngine.registerDocType(userDocType);

				// Create custom field
				await customFieldManager.createCustomField({
					dt: 'User',
					fieldname: 'cf_custom_data',
					fieldtype: 'Data',
					label: 'Custom Data',
					length: 100
				});

				// Get DocType with custom fields merged
				const mergedDocType = await customFieldManager.mergeCustomFields(userDocType);

				// Verify the merged DocType contains the custom field
				expect(mergedDocType.fields.some(f => f.fieldname === 'cf_custom_data')).toBe(true);
			});
		});

		describe('P2-020-T12: should include custom fields in API responses', () => {
			it('should include custom fields in API response structure', async () => {
				// Register a base DocType
				const userDocType: DocType = {
					name: 'User',
					module: 'Core',
					fields: [
						{ fieldname: 'name', fieldtype: 'Data', label: 'Name' },
						{ fieldname: 'email', fieldtype: 'Data', label: 'Email' }
					] as DocField[],
					permissions: []
				};

				await docTypeEngine.registerDocType(userDocType);

				// Create custom fields
				await customFieldManager.createCustomField({
					dt: 'User',
					fieldname: 'cf_phone',
					fieldtype: 'Data',
					label: 'Phone'
				});

				await customFieldManager.createCustomField({
					dt: 'User',
					fieldname: 'cf_department',
					fieldtype: 'Link',
					label: 'Department',
					options: 'Department'
				});

				// Get DocType with custom fields merged (simulating API response)
				const mergedDocType = await customFieldManager.mergeCustomFields(userDocType);

				// Verify API response structure includes custom fields
				expect(mergedDocType.fields).toHaveLength(4);
				expect(mergedDocType.custom_fields).toBeDefined();
				expect(mergedDocType.custom_fields).toHaveLength(2);

				// Verify custom field properties are preserved
				const phoneField = mergedDocType.custom_fields?.find(f => f.fieldname === 'cf_phone');
				expect(phoneField).toBeDefined();
				expect(phoneField?.fieldtype).toBe('Data');
				expect(phoneField?.label).toBe('Phone');

				const deptField = mergedDocType.custom_fields?.find(f => f.fieldname === 'cf_department');
				expect(deptField).toBeDefined();
				expect(deptField?.fieldtype).toBe('Link');
				expect(deptField?.options).toBe('Department');
			});

			it('should handle custom fields in API filtering and pagination', async () => {
				// Register a base DocType
				const userDocType: DocType = {
					name: 'User',
					module: 'Core',
					fields: [
						{ fieldname: 'name', fieldtype: 'Data', label: 'Name' }
					] as DocField[],
					permissions: []
				};

				await docTypeEngine.registerDocType(userDocType);

				// Create multiple custom fields
				await customFieldManager.createCustomField({
					dt: 'User',
					fieldname: 'cf_field1',
					fieldtype: 'Data',
					label: 'Field 1',
					in_list_view: true
				});

				await customFieldManager.createCustomField({
					dt: 'User',
					fieldname: 'cf_field2',
					fieldtype: 'Data',
					label: 'Field 2',
					in_list_view: false
				});

				await customFieldManager.createCustomField({
					dt: 'User',
					fieldname: 'cf_field3',
					fieldtype: 'Data',
					label: 'Field 3',
					in_list_view: true
				});

				// Test filtering custom fields (simulating API query)
				const listFields = await customFieldManager.getCustomFields('User', {
					in_list_view: true
				});

				expect(listFields).toHaveLength(2);
				expect(listFields.map(f => f.fieldname)).toEqual(
					expect.arrayContaining(['cf_field1', 'cf_field3'])
				);

				// Test pagination (simulating API pagination)
				const paginatedFields = await customFieldManager.getCustomFields('User', {
					limit: 2,
					offset: 1
				});

				expect(paginatedFields).toHaveLength(2);
			});
		});
	});
});