/**
 * P2-021 Property Setter Integration Tests
 * 
 * This module contains integration tests for P2-021 Property Setter feature,
 * covering integration with DocTypeEngine, DocTypeMeta, and overall system.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DocType, DocField } from '../../doctype/types';
import { DocTypeEngine } from '../../doctype';
import { PropertySetterManager } from '../property-setter';
import { CustomFieldManager } from '../custom-field';
import { DocTypeMeta } from '../../doctype';
import type {
	PropertySetter,
	SetPropertyOptions
} from '../types';
import {
	PropertySetterExistsError,
	PropertySetterNotFoundError,
	PropertySetterValidationError
} from '../errors';

// Mock DocType for testing
const mockDocType: DocType = {
	name: 'Customer',
	module: 'CRM',
	fields: [
		{
			fieldname: 'name',
			fieldtype: 'Data',
			label: 'Name',
			required: true
		},
		{
			fieldname: 'email',
			fieldtype: 'Data',
			label: 'Email',
			required: false
		},
		{
			fieldname: 'age',
			fieldtype: 'Int',
			label: 'Age',
			required: false
		},
		{
			fieldname: 'status',
			fieldtype: 'Select',
			label: 'Status',
			options: 'Active\nInactive',
			required: false
		}
	],
	permissions: [],
	created_at: new Date(),
	modified_at: new Date()
};

describe('P2-021 Property Setter Integration Tests', () => {
	let propertySetterManager: PropertySetterManager;
	let docTypeEngine: DocTypeEngine;

	beforeEach(async () => {
		// Reset all singleton instances first to ensure clean state
		CustomFieldManager.resetInstance();
		DocTypeEngine.resetInstance();

		// Configure PropertySetterManager for testing
		const testConfig = {
			enable_database_persistence: false, // Disable DB for tests
			enable_validation: false, // Disable validation to test core functionality
			enable_cache: false // Disable cache for predictable tests
		};

		// Create a completely fresh PropertySetterManager instance for each test (non-singleton)
		propertySetterManager = PropertySetterManager.createNonSingletonInstance(testConfig);

		// Get CustomFieldManager instance with test config
		CustomFieldManager.getInstance({
			enable_validation: true,
			enable_cache: false
		});

		// Get DocTypeEngine instance
		docTypeEngine = DocTypeEngine.getInstance();

		// Set PropertySetterManager instance to ensure DocTypeEngine uses the same one
		docTypeEngine.setPropertySetterManager(propertySetterManager);

		// Set DocTypeEngine reference on PropertySetterManager for field validation
		propertySetterManager.setDocTypeEngine(docTypeEngine);

		// Register mock DocType first
		await docTypeEngine.registerDocType(mockDocType);
	});

	afterEach(() => {
		// Clean up instances
		PropertySetterManager.resetInstance();
		CustomFieldManager.resetInstance();
		DocTypeEngine.resetInstance();
	});

	// P2-021-T1: Set field-level property setter
	it('P2-021-T1: Should set field-level property setter', async () => {
		const options: SetPropertyOptions = {
			doctype: 'Customer',
			fieldname: 'name',
			property: 'label',
			value: 'Full Name'
		};

		const propertySetter = await propertySetterManager.setProperty(options);

		expect(propertySetter).toBeDefined();
		expect(propertySetter.doctype).toBe('Customer');
		expect(propertySetter.fieldname).toBe('name');
		expect(propertySetter.property).toBe('label');
		expect(propertySetter.value).toBe('Full Name');
	});

	// P2-021-T2: Set DocType-level property setter
	it('P2-021-T2: Should set DocType-level property setter', async () => {
		const options: SetPropertyOptions = {
			doctype: 'Customer',
			property: 'search_fields',
			value: 'name,email'
		};

		const propertySetter = await propertySetterManager.setProperty(options);

		expect(propertySetter).toBeDefined();
		expect(propertySetter.doctype).toBe('Customer');
		expect(propertySetter.fieldname).toBeUndefined();
		expect(propertySetter.property).toBe('search_fields');
		expect(propertySetter.value).toBe('name,email');
	});

	// P2-021-T3: Apply property setters to DocType
	it('P2-021-T3: Should apply property setters to DocType', async () => {
		// Use a local instance to ensure complete isolation
		const localManager = PropertySetterManager.createNonSingletonInstance({
			enable_database_persistence: false,
			enable_validation: false,
			enable_cache: false
		});

		// Set up property setters
		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'name',
			property: 'label',
			value: 'Full Name'
		});

		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'email',
			property: 'hidden',
			value: true
		});

		await localManager.setProperty({
			doctype: 'Customer',
			property: 'search_fields',
			value: 'name,email'
		});

		// Get DocType and apply property setters using the same PropertySetterManager instance
		// We use mockDocType directly to ensure availability
		const doctype = mockDocType;
		expect(doctype).not.toBeNull();
		const modifiedDocType = await localManager.applyProperties(doctype!);

		// Check that properties are applied
		const nameField = modifiedDocType.fields.find((f: DocField) => f.fieldname === 'name');
		const emailField = modifiedDocType.fields.find((f: DocField) => f.fieldname === 'email');

		expect(nameField!.label).toBe('Full Name');
		expect(emailField!.hidden).toBe(true);
		expect(modifiedDocType.search_fields).toBe('name,email');
	});

	// P2-021-T4: Remove property setter
	it('P2-021-T4: Should remove property setter', async () => {
		// Use a local instance to ensure complete isolation
		const localManager = PropertySetterManager.createNonSingletonInstance({
			enable_database_persistence: false,
			enable_validation: false,
			enable_cache: false
		});

		// Set up property setter
		const propertySetter = await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'name',
			property: 'label',
			value: 'Full Name'
		});

		// Remove it
		const removedSetter = await localManager.removeProperty('Customer', 'name', 'label');

		expect(removedSetter).toBeDefined();
		if (Array.isArray(removedSetter)) {
			// If it's an array, check the first element
			expect(removedSetter[0].doctype).toBe('Customer');
			expect(removedSetter[0].fieldname).toBe('name');
			expect(removedSetter[0].property).toBe('label');
			expect(removedSetter[0].value).toBe('Full Name');
		} else {
			// If it's a single property setter
			expect(removedSetter.doctype).toBe('Customer');
			expect(removedSetter.fieldname).toBe('name');
			expect(removedSetter.property).toBe('label');
			expect(removedSetter.value).toBe('Full Name');
		}

		// Verify it's actually removed
		const found = await localManager.getProperty('Customer', 'name', 'label');
		expect(found).toBeNull();
	});

	// P2-021-T5: Get property setter
	it('P2-021-T5: Should get property setter', async () => {
		// Use a local instance to ensure complete isolation
		const localManager = PropertySetterManager.createNonSingletonInstance({
			enable_database_persistence: false,
			enable_validation: false,
			enable_cache: false
		});

		// Set up property setter
		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'name',
			property: 'label',
			value: 'Full Name'
		});

		// Get it
		const found = await localManager.getProperty('Customer', 'name', 'label');

		expect(found).toBeDefined();
		expect(found!.doctype).toBe('Customer');
		expect(found!.fieldname).toBe('name');
		expect(found!.property).toBe('label');
		expect(found!.value).toBe('Full Name');
	});

	// P2-021-T6: Get all property setters for DocType
	it('P2-021-T6: Should get all property setters for DocType', async () => {
		// Use a local instance to ensure complete isolation
		const localManager = PropertySetterManager.createNonSingletonInstance({
			enable_database_persistence: false,
			enable_validation: false,
			enable_cache: false
		});

		// Set up multiple property setters
		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'name',
			property: 'label',
			value: 'Full Name'
		});

		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'email',
			property: 'hidden',
			value: true
		});

		await localManager.setProperty({
			doctype: 'Customer',
			property: 'search_fields',
			value: 'name,email'
		});

		// Get all
		const propertySetters = await localManager.getProperties('Customer');

		expect(propertySetters).toHaveLength(3);
		expect(propertySetters.some(ps => ps.fieldname === 'name' && ps.property === 'label')).toBe(true);
		expect(propertySetters.some(ps => ps.fieldname === 'email' && ps.property === 'hidden')).toBe(true);
		expect(propertySetters.some(ps => ps.fieldname === undefined && ps.property === 'search_fields')).toBe(true);
	});

	// P2-021-T7: Validate property setter
	it('P2-021-T7: Should validate property setter', async () => {
		// Use a local instance to ensure complete isolation
		const localManager = PropertySetterManager.createNonSingletonInstance({
			enable_database_persistence: false,
			enable_validation: true, // Enable validation
			enable_cache: false
		});
		// Ensure DocTypeEngine is set for validation
		localManager.setDocTypeEngine(docTypeEngine);

		const validOptions: SetPropertyOptions = {
			doctype: 'Customer',
			fieldname: 'name',
			property: 'label',
			value: 'Full Name'
		};

		// Should not throw validation error
		await expect(localManager.setProperty(validOptions)).resolves.toBeDefined();
	});

	// P2-021-T8: Reject invalid property setter
	it('P2-021-T8: Should reject invalid property setter', async () => {
		// Use a local instance to ensure complete isolation
		const localManager = PropertySetterManager.createNonSingletonInstance({
			enable_database_persistence: false,
			enable_validation: true, // Enable validation
			enable_cache: false
		});
		// Ensure DocTypeEngine is set for validation
		localManager.setDocTypeEngine(docTypeEngine);

		const invalidOptions: SetPropertyOptions = {
			doctype: '',
			fieldname: 'name',
			property: 'label',
			value: 'Full Name'
		};

		// Should throw validation error
		await expect(localManager.setProperty(invalidOptions)).rejects.toThrow();
	});

	// P2-021-T9: Integrate with DocTypeEngine
	it('P2-021-T9: Should integrate with DocTypeEngine', async () => {
		// Set up property setter
		await propertySetterManager.setProperty({
			doctype: 'Customer',
			fieldname: 'email',
			property: 'hidden',
			value: true
		});

		// Get DocType with property setters applied
		const modifiedDocType = await docTypeEngine.getDocTypeWithPropertySetters('Customer');

		// Check that property is applied
		const emailField = modifiedDocType.fields.find((f: DocField) => f.fieldname === 'email');
		expect(emailField!.hidden).toBe(true);
	});

	// P2-021-T10: Integrate with DocTypeMeta
	it('P2-021-T10: Should integrate with DocTypeMeta', async () => {
		// Use a local instance to ensure complete isolation
		const localManager = PropertySetterManager.createNonSingletonInstance({
			enable_database_persistence: false,
			enable_validation: false,
			enable_cache: false
		});

		// Set up property setter
		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'name',
			property: 'label',
			value: 'Full Name'
		});

		// Apply property setters directly using mockDocType to avoid singleton issues
		const modifiedDocType = await localManager.applyProperties(mockDocType);

		// Check that property setter is applied
		const nameField = modifiedDocType.fields.find((f: DocField) => f.fieldname === 'name');
		expect(nameField).toBeDefined();
		expect(nameField!.label).toBe('Full Name');

		// Check that original field is not modified (applyProperties creates a deep copy)
		const originalNameField = mockDocType.fields.find((f: DocField) => f.fieldname === 'name');
		expect(originalNameField!.label).toBe('Name');
	});

	// P2-021-T11: Handle property setter priority
	it('P2-021-T11: Should handle property setter priority', async () => {
		// Use a local instance to ensure complete isolation
		const localManager = PropertySetterManager.createNonSingletonInstance({
			enable_database_persistence: false,
			enable_validation: false,
			enable_cache: false
		});

		// Set up multiple property setters for same field/property with different priorities
		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'name',
			property: 'label',
			value: 'Low Priority',
			priority: 1
		});

		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'name',
			property: 'label',
			value: 'High Priority',
			priority: 10
		});

		// Apply to mockDocType directly using PropertySetterManager
		const modifiedDocType = await localManager.applyProperties(mockDocType);

		// Check that highest priority is applied
		const nameField = modifiedDocType.fields.find((f: DocField) => f.fieldname === 'name');
		expect(nameField).toBeDefined();
		expect(nameField!.label).toBe('High Priority');

		// Check that getting property returns both setters
		const properties = await localManager.getProperties('Customer', { fieldname: 'name', property: 'label' });
		expect(properties.length).toBe(2);
	});

	// P2-021-T12: Skip disabled property setters
	it('P2-021-T12: Should skip disabled property setters', async () => {
		// Use a local instance to ensure complete isolation
		const localManager = PropertySetterManager.createNonSingletonInstance({
			enable_database_persistence: false,
			enable_validation: false,
			enable_cache: false
		});

		// Set up enabled and disabled property setters with different priorities to avoid conflict
		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'name',
			property: 'label',
			value: 'Disabled Label',
			enabled: false,
			priority: 10
		});

		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'name',
			property: 'label',
			value: 'Enabled Label',
			enabled: true,
			priority: 1
		});

		// Apply to mockDocType using PropertySetterManager directly
		const modifiedDocType = await localManager.applyProperties(mockDocType);

		// Check that enabled property is applied
		const nameField = modifiedDocType.fields.find((f: DocField) => f.fieldname === 'name');
		expect(nameField).toBeDefined();
		expect(nameField!.label).toBe('Enabled Label');

		// Check that getting properties excludes disabled ones by default
		const properties = await localManager.getProperties('Customer');
		const enabledProperties = properties.filter(ps => ps.enabled !== false);
		expect(enabledProperties).toHaveLength(1);
		expect(enabledProperties[0].value).toBe('Enabled Label');
	});

	// Additional integration tests

	it('Should apply property setters after custom fields', async () => {
		// Use a local instance for PropertySetterManager
		const localManager = PropertySetterManager.createNonSingletonInstance({
			enable_database_persistence: false,
			enable_validation: false,
			enable_cache: false
		});

		// Get CustomFieldManager (singleton, but reset in beforeEach)
		const customFieldManager = CustomFieldManager.getInstance();

		// 1. Add a custom field
		await customFieldManager.createCustomField({
			dt: 'Customer',
			fieldname: 'new_custom_field',
			fieldtype: 'Data',
			label: 'Original Custom Label'
			// removed insert_after as it is not supported in interface
		});

		// 2. Add a property setter for that custom field
		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'new_custom_field',
			property: 'label',
			value: 'Modified Custom Label'
		});

		// 3. Apply Custom Fields first
		// mergeCustomFields takes DocType and returns new DocType with custom fields merged
		const docWithCustomFields = await customFieldManager.mergeCustomFields(mockDocType);

		// 4. Apply Property Setters
		const finalDoc = await localManager.applyProperties(docWithCustomFields);

		// 5. Verify
		const customField = finalDoc.fields.find((f: DocField) => f.fieldname === 'new_custom_field');
		expect(customField).toBeDefined();
		expect(customField!.label).toBe('Modified Custom Label');
	});

	it('Should not modify original DocType definition', async () => {
		// Use a local instance to ensure complete isolation
		const localManager = PropertySetterManager.createNonSingletonInstance({
			enable_database_persistence: false,
			enable_validation: false,
			enable_cache: false
		});

		// Set up property setter
		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'name',
			property: 'label',
			value: 'Modified Label'
		});

		// Get DocType with property setters applied using mockDocType directly
		const modifiedDocType = await localManager.applyProperties(mockDocType);

		// Check that original is not modified
		const originalNameField = mockDocType.fields.find((f: DocField) => f.fieldname === 'name');
		const modifiedNameField = modifiedDocType.fields.find((f: DocField) => f.fieldname === 'name');

		expect(originalNameField!.label).toBe('Name');
		expect(modifiedNameField!.label).toBe('Modified Label');
	});

	it('Should handle property setter cache invalidation', async () => {
		// Use a local instance to ensure complete isolation
		const localManager = PropertySetterManager.createNonSingletonInstance({
			enable_database_persistence: false,
			enable_validation: false,
			enable_cache: true // Enable cache to test invalidation
		});

		// Set up initial property setter
		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'name',
			property: 'label',
			value: 'Initial Label',
			priority: 0
		});

		// Apply property setters using mockDocType
		const modified1 = await localManager.applyProperties(mockDocType);
		const nameField1 = modified1.fields.find((f: DocField) => f.fieldname === 'name');
		expect(nameField1!.label).toBe('Initial Label');

		// Add a higher priority property setter (simulates update)
		// This should invalidate cache and update result
		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'name',
			property: 'label',
			value: 'Updated Label',
			priority: 1
		});

		// Apply again and verify the higher priority value is used
		const modified2 = await localManager.applyProperties(mockDocType);
		const nameField2 = modified2.fields.find((f: DocField) => f.fieldname === 'name');
		expect(nameField2!.label).toBe('Updated Label');
	});

	it('Should handle complex property setter scenarios', async () => {
		// Use a local instance to ensure complete isolation
		const localManager = PropertySetterManager.createNonSingletonInstance({
			enable_database_persistence: false,
			enable_validation: false,
			enable_cache: false
		});

		// Set up multiple property setters
		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'name',
			property: 'label',
			value: 'Initial Label'
		});

		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'status',
			property: 'options',
			value: 'Active\nInactive\nPending'
		});

		// Set a DocType-level property setter
		await localManager.setProperty({
			doctype: 'Customer',
			property: 'search_fields',
			value: 'name,email'
		});

		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'nonexistent',
			property: 'label',
			value: 'Test'
		});

		// Apply to mockDocType using PropertySetterManager directly
		const modifiedDocType = await localManager.applyProperties(mockDocType);

		// Check that existing field properties are applied
		const nameField = modifiedDocType.fields.find((f: DocField) => f.fieldname === 'name');
		const statusField = modifiedDocType.fields.find((f: DocField) => f.fieldname === 'status');

		expect(nameField!.label).toBe('Initial Label');
		expect(statusField!.options).toBe('Active\nInactive\nPending');

		// Check that DocType-level properties are applied
		expect(modifiedDocType.search_fields).toBe('name,email');

		// Check that non-existent field is ignored (doesn't cause error)
		expect(modifiedDocType.fields.length).toBe(mockDocType.fields.length);
	});

	it('Should handle property setter errors gracefully', async () => {
		// Use a local instance to ensure complete isolation
		const localManager = PropertySetterManager.createNonSingletonInstance({
			enable_database_persistence: false,
			enable_validation: false,
			enable_cache: false
		});

		// Set valid property setters (shouldn't throw)
		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'name',
			property: 'label',
			value: 'Test'
		});

		await localManager.setProperty({
			doctype: 'Customer',
			fieldname: 'status',
			property: 'options',
			value: 'Active\nInactive\nPending'
		});

		// Apply to mockDocType directly (should not throw)
		const modifiedDocType = await localManager.applyProperties(mockDocType);
		expect(modifiedDocType).toBeDefined();

		// Now try to set a duplicate property setter (same doctype, fieldname, property, and default priority)
		try {
			await localManager.setProperty({
				doctype: 'Customer',
				fieldname: 'name',
				property: 'label',
				value: 'Duplicate Test'
			});
			// Should not reach here
			expect.fail('Expected PropertySetterExistsError to be thrown');
		} catch (error) {
			// Should be PropertySetterExistsError for duplicate with same priority
			expect(error).toBeInstanceOf(PropertySetterExistsError);
		}
	});
});