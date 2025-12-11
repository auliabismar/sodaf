/**
 * Property Setter Manager Tests
 * 
 * This module contains tests for the PropertySetterManager class,
 * covering all major functionality including property setting, removal,
 * validation, and integration with DocTypeMeta.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DocType, DocField } from '../../doctype/types';
import { DocTypeEngine } from '../../doctype';
import { PropertySetterManager } from '../property-setter';
import type {
	PropertySetter,
	SetPropertyOptions,
	PropertySetterQueryOptions
} from '../types';
import {
	PropertySetterExistsError,
	PropertySetterNotFoundError,
	PropertySetterValidationError,
	PropertySetterOperationError
} from '../errors';

// Mock DocType for testing
const mockDocType: DocType = {
	name: 'TestDocType',
	module: 'Test',
	fields: [
		{
			fieldname: 'name',
			fieldtype: 'Data',
			label: 'Name',
			required: true
		},
		{
			fieldname: 'age',
			fieldtype: 'Int',
			label: 'Age',
			required: false
		},
		{
			fieldname: 'email',
			fieldtype: 'Data',
			label: 'Email',
			required: false
		}
	],
	permissions: [],
	created_at: new Date(),
	modified_at: new Date()
};

describe('PropertySetterManager', () => {
	let propertySetterManager: PropertySetterManager;
	let docTypeEngine: DocTypeEngine;

	beforeEach(async () => {
		// Reset singleton instances
		PropertySetterManager.resetInstance();
		DocTypeEngine.resetInstance();

		// Get fresh instances
		propertySetterManager = PropertySetterManager.getInstance({
			enable_database_persistence: false, // Disable DB for tests
			enable_validation: true
		});
		docTypeEngine = DocTypeEngine.getInstance();

		// Register mock DocType
		await docTypeEngine.registerDocType(mockDocType);
	});

	afterEach(() => {
		// Clean up instances
		PropertySetterManager.resetInstance();
		DocTypeEngine.resetInstance();
	});

	describe('setProperty', () => {
		it('should set a field-level property setter', async () => {
			const options: SetPropertyOptions = {
				doctype: 'TestDocType',
				fieldname: 'name',
				property: 'label',
				value: 'Full Name'
			};

			const propertySetter = await propertySetterManager.setProperty(options);

			expect(propertySetter).toBeDefined();
			expect(propertySetter.doctype).toBe('TestDocType');
			expect(propertySetter.fieldname).toBe('name');
			expect(propertySetter.property).toBe('label');
			expect(propertySetter.value).toBe('Full Name');
			expect(propertySetter.enabled).toBe(true);
		});

		it('should set a DocType-level property setter', async () => {
			const options: SetPropertyOptions = {
				doctype: 'TestDocType',
				property: 'search_fields',
				value: 'name,email'
			};

			const propertySetter = await propertySetterManager.setProperty(options);

			expect(propertySetter).toBeDefined();
			expect(propertySetter.doctype).toBe('TestDocType');
			expect(propertySetter.fieldname).toBeUndefined();
			expect(propertySetter.property).toBe('search_fields');
			expect(propertySetter.value).toBe('name,email');
		});

		it('should throw error for duplicate property setter', async () => {
			const options: SetPropertyOptions = {
				doctype: 'TestDocType',
				fieldname: 'name',
				property: 'label',
				value: 'Full Name'
			};

			// Set first property setter
			await propertySetterManager.setProperty(options);

			// Try to set duplicate
			await expect(propertySetterManager.setProperty(options)).rejects.toThrow(PropertySetterExistsError);
		});

		it('should throw error for invalid property name', async () => {
			const options: SetPropertyOptions = {
				doctype: 'TestDocType',
				fieldname: 'name',
				property: 'invalid_property',
				value: 'test'
			};

			await expect(propertySetterManager.setProperty(options)).rejects.toThrow(PropertySetterValidationError);
		});

		it('should throw error for non-existent field', async () => {
			const options: SetPropertyOptions = {
				doctype: 'TestDocType',
				fieldname: 'nonexistent',
				property: 'label',
				value: 'Test'
			};

			await expect(propertySetterManager.setProperty(options)).rejects.toThrow(PropertySetterValidationError);
		});

		it('should set property with priority', async () => {
			const options: SetPropertyOptions = {
				doctype: 'TestDocType',
				fieldname: 'name',
				property: 'label',
				value: 'High Priority Label',
				priority: 10
			};

			const propertySetter = await propertySetterManager.setProperty(options);

			expect(propertySetter.priority).toBe(10);
		});

		it('should set property with description', async () => {
			const options: SetPropertyOptions = {
				doctype: 'TestDocType',
				fieldname: 'name',
				property: 'label',
				value: 'Descriptive Label',
				description: 'This is a test property setter'
			};

			const propertySetter = await propertySetterManager.setProperty(options);

			expect(propertySetter.description).toBe('This is a test property setter');
		});
	});

	describe('removeProperty', () => {
		beforeEach(async () => {
			// Set up some property setters for testing
			await propertySetterManager.setProperty({
				doctype: 'TestDocType',
				fieldname: 'name',
				property: 'label',
				value: 'Full Name'
			});

			await propertySetterManager.setProperty({
				doctype: 'TestDocType',
				fieldname: 'age',
				property: 'hidden',
				value: true
			});

			await propertySetterManager.setProperty({
				doctype: 'TestDocType',
				property: 'search_fields',
				value: 'name,email'
			});
		});

		it('should remove a specific property setter', async () => {
			const removed = await propertySetterManager.removeProperty(
				'TestDocType',
				'name',
				'label'
			);

			expect(removed).toBeDefined();
			if (!Array.isArray(removed)) {
				expect(removed.doctype).toBe('TestDocType');
				expect(removed.fieldname).toBe('name');
				expect(removed.property).toBe('label');
			}

			// Verify it's actually removed
			const found = await propertySetterManager.getProperty('TestDocType', 'name', 'label');
			expect(found).toBeNull();
		});

		it('should remove all property setters for a field', async () => {
			const removed = await propertySetterManager.removeProperty('TestDocType', 'age');

			expect(Array.isArray(removed)).toBe(true);
			expect(removed).toHaveLength(1);
			if (Array.isArray(removed)) {
				expect(removed[0].fieldname).toBe('age');
			}

			// Verify they're actually removed
			const found = await propertySetterManager.getProperty('TestDocType', 'age');
			expect(found).toBeNull();
		});

		it('should remove all property setters for a DocType', async () => {
			const removed = await propertySetterManager.removeProperty('TestDocType');

			expect(Array.isArray(removed)).toBe(true);
			expect(removed).toHaveLength(3);

			// Verify they're actually removed
			const found1 = await propertySetterManager.getProperty('TestDocType', 'name', 'label');
			const found2 = await propertySetterManager.getProperty('TestDocType', 'age', 'hidden');
			const found3 = await propertySetterManager.getProperty('TestDocType', undefined, 'search_fields');

			expect(found1).toBeNull();
			expect(found2).toBeNull();
			expect(found3).toBeNull();
		});

		it('should throw error for non-existent property setter', async () => {
			await expect(
				propertySetterManager.removeProperty('TestDocType', 'nonexistent', 'label')
			).rejects.toThrow(PropertySetterNotFoundError);
		});
	});

	describe('getProperty', () => {
		beforeEach(async () => {
			// Set up some property setters for testing
			await propertySetterManager.setProperty({
				doctype: 'TestDocType',
				fieldname: 'name',
				property: 'label',
				value: 'Full Name',
				priority: 5
			});

			await propertySetterManager.setProperty({
				doctype: 'TestDocType',
				fieldname: 'name',
				property: 'hidden',
				value: true,
				priority: 10
			});

			await propertySetterManager.setProperty({
				doctype: 'TestDocType',
				property: 'search_fields',
				value: 'name,email'
			});
		});

		it('should get a specific property setter', async () => {
			const found = await propertySetterManager.getProperty('TestDocType', 'name', 'label');

			expect(found).toBeDefined();
			expect(found!.property).toBe('label');
			expect(found!.value).toBe('Full Name');
		});

		it('should get highest priority property setter when property not specified', async () => {
			const found = await propertySetterManager.getProperty('TestDocType', 'name');

			expect(found).toBeDefined();
			expect(found!.property).toBe('hidden'); // Higher priority (10 > 5)
			expect(found!.value).toBe(true);
		});

		it('should return null for non-existent property setter', async () => {
			const found = await propertySetterManager.getProperty('TestDocType', 'nonexistent', 'label');

			expect(found).toBeNull();
		});
	});

	describe('getProperties', () => {
		beforeEach(async () => {
			// Set up some property setters for testing
			await propertySetterManager.setProperty({
				doctype: 'TestDocType',
				fieldname: 'name',
				property: 'label',
				value: 'Full Name'
			});

			await propertySetterManager.setProperty({
				doctype: 'TestDocType',
				fieldname: 'age',
				property: 'hidden',
				value: true
			});

			await propertySetterManager.setProperty({
				doctype: 'TestDocType',
				property: 'search_fields',
				value: 'name,email'
			});

			await propertySetterManager.setProperty({
				doctype: 'TestDocType',
				fieldname: 'email',
				property: 'label',
				value: 'Email Address',
				enabled: false
			});
		});

		it('should get all property setters for a DocType', async () => {
			const properties = await propertySetterManager.getProperties('TestDocType');

			expect(properties).toHaveLength(4);
		});

		it('should filter by field name', async () => {
			const properties = await propertySetterManager.getProperties('TestDocType', {
				fieldname: 'name'
			});

			expect(properties).toHaveLength(1);
			expect(properties[0].fieldname).toBe('name');
		});

		it('should filter by property name', async () => {
			const properties = await propertySetterManager.getProperties('TestDocType', {
				property: 'label'
			});

			expect(properties).toHaveLength(2);
			expect(properties.every(p => p.property === 'label')).toBe(true);
		});

		it('should exclude disabled property setters', async () => {
			const properties = await propertySetterManager.getProperties('TestDocType', {
				include_disabled: false
			});

			expect(properties).toHaveLength(3); // One is disabled
			expect(properties.every(p => p.enabled !== false)).toBe(true);
		});

		it('should sort by priority', async () => {
			const properties = await propertySetterManager.getProperties('TestDocType', {
				sort_by: 'priority',
				sort_order: 'desc'
			});

			// Check that they are sorted by priority (descending)
			for (let i = 1; i < properties.length; i++) {
				const prevPriority = properties[i - 1].priority || 0;
				const currPriority = properties[i].priority || 0;
				expect(prevPriority).toBeGreaterThanOrEqual(currPriority);
			}
		});

		it('should apply limit and offset', async () => {
			const properties = await propertySetterManager.getProperties('TestDocType', {
				limit: 2,
				offset: 1
			});

			expect(properties).toHaveLength(2);
		});
	});

	describe('applyProperties', () => {
		it('should apply field-level property setters', async () => {
			// Set up property setters
			await propertySetterManager.setProperty({
				doctype: 'TestDocType',
				fieldname: 'name',
				property: 'label',
				value: 'Full Name'
			});

			await propertySetterManager.setProperty({
				doctype: 'TestDocType',
				fieldname: 'age',
				property: 'hidden',
				value: true
			});

			// Apply to DocType
			const modifiedDocType = await propertySetterManager.applyProperties(mockDocType);

			// Check that properties are applied
			const nameField = modifiedDocType.fields.find(f => f.fieldname === 'name');
			const ageField = modifiedDocType.fields.find(f => f.fieldname === 'age');

			expect(nameField!.label).toBe('Full Name');
			expect(ageField!.hidden).toBe(true);
		});

		it('should apply DocType-level property setters', async () => {
			// Set up property setter
			await propertySetterManager.setProperty({
				doctype: 'TestDocType',
				property: 'search_fields',
				value: 'name,email'
			});

			// Apply to DocType
			const modifiedDocType = await propertySetterManager.applyProperties(mockDocType);

			// Check that property is applied
			expect(modifiedDocType.search_fields).toBe('name,email');
		});

		it('should not modify original DocType', async () => {
			// Set up property setter
			await propertySetterManager.setProperty({
				doctype: 'TestDocType',
				fieldname: 'name',
				property: 'label',
				value: 'Modified Name'
			});

			// Apply to DocType
			await propertySetterManager.applyProperties(mockDocType);

			// Check that original DocType is not modified
			const originalNameField = mockDocType.fields.find(f => f.fieldname === 'name');
			expect(originalNameField!.label).toBe('Name'); // Original value
		});

		it('should apply property setters in priority order', async () => {
			// Set up multiple property setters for same field and property
			await propertySetterManager.setProperty({
				doctype: 'TestDocType',
				fieldname: 'name',
				property: 'label',
				value: 'Low Priority',
				priority: 1
			});

			await propertySetterManager.setProperty({
				doctype: 'TestDocType',
				fieldname: 'name',
				property: 'label',
				value: 'High Priority',
				priority: 10
			});

			// Apply to DocType
			const modifiedDocType = await propertySetterManager.applyProperties(mockDocType);

			// Check that highest priority is applied
			const nameField = modifiedDocType.fields.find(f => f.fieldname === 'name');
			expect(nameField!.label).toBe('High Priority');
		});

		it('should skip disabled property setters', async () => {
			// Set up property setter
			await propertySetterManager.setProperty({
				doctype: 'TestDocType',
				fieldname: 'name',
				property: 'label',
				value: 'Disabled Label',
				enabled: false
			});

			// Apply to DocType
			const modifiedDocType = await propertySetterManager.applyProperties(mockDocType);

			// Check that disabled property is not applied
			const nameField = modifiedDocType.fields.find(f => f.fieldname === 'name');
			expect(nameField!.label).toBe('Name'); // Original value
		});
	});

	describe('validatePropertySetter', () => {
		it('should validate a correct property setter', async () => {
			const propertySetter: PropertySetter = {
				doctype: 'TestDocType',
				fieldname: 'name',
				property: 'label',
				value: 'Valid Label'
			};

			const result = await propertySetterManager.validatePropertySetter(propertySetter);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject property setter with invalid property', async () => {
			const propertySetter: PropertySetter = {
				doctype: 'TestDocType',
				fieldname: 'name',
				property: 'invalid_property',
				value: 'test'
			};

			const result = await propertySetterManager.validatePropertySetter(propertySetter);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should reject property setter for non-existent field', async () => {
			const propertySetter: PropertySetter = {
				doctype: 'TestDocType',
				fieldname: 'nonexistent',
				property: 'label',
				value: 'test'
			};

			const result = await propertySetterManager.validatePropertySetter(propertySetter);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});
	});

	describe('configuration', () => {
		it('should get default configuration', () => {
			// Create a fresh instance with default config
			PropertySetterManager.resetInstance();
			const manager = PropertySetterManager.getInstance();
			const config = manager.getConfig();

			expect(config.enable_cache).toBe(true);
			expect(config.cache_ttl).toBe(300);
			expect(config.enable_validation).toBe(true);
			expect(config.enable_database_persistence).toBe(true);
		});

		it('should update configuration', () => {
			// Create a fresh instance with default config
			PropertySetterManager.resetInstance();
			const manager = PropertySetterManager.getInstance();

			manager.updateConfig({
				cache_ttl: 600,
				enable_validation: false
			});

			const config = manager.getConfig();

			expect(config.cache_ttl).toBe(600);
			expect(config.enable_validation).toBe(false);
			// Other settings should remain unchanged
			expect(config.enable_cache).toBe(true);
			expect(config.enable_database_persistence).toBe(true);
		});
	});
});