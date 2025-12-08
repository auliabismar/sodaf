/**
 * Validator Tests
 * 
 * Tests for the DocTypeValidator class implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DocTypeEngine } from '../doctype-engine';
import { DocTypeValidator } from '../validator';
import { DocTypeValidationError } from '../errors';
import type { DocType, DocField, FieldType } from '../types';
import { DocTypeTestFactory, DocTypeTestHelper } from '../../../__tests__/utils/doctype';

describe('DocTypeValidator', () => {
	let engine: DocTypeEngine;
	let metaHelper: DocTypeTestHelper;
	let testDocType: DocType;

	beforeEach(async () => {
		// Reset engine instance
		DocTypeEngine.resetInstance();
		engine = DocTypeEngine.getInstance();
		metaHelper = new DocTypeTestHelper();

		// Create test DocType
		testDocType = DocTypeTestFactory.createComprehensiveDocType({
			name: 'TestValidatorDoc',
			module: 'TestModule'
		});

		// Register DocType
		await engine.registerDocType(testDocType);
	});

	afterEach(() => {
		// Clean up
		metaHelper.clear();
		DocTypeEngine.resetInstance();
		vi.restoreAllMocks();
	});

	describe('validateDocType', () => {
		it('should validate a complete DocType', () => {
			const result = DocTypeValidator.validateDocType(testDocType);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject DocType without name', () => {
			const invalidDocType = {
				...testDocType,
				name: null
			} as any;

			const result = DocTypeValidator.validateDocType(invalidDocType);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e: any) => e.field === 'name' && e.type === 'required'));
		});

		it('should reject DocType without module', () => {
			const invalidDocType = {
				...testDocType,
				module: ''
			} as any;

			const result = DocTypeValidator.validateDocType(invalidDocType);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e: any) => e.field === 'module' && e.type === 'required'));
		});

		it('should reject DocType without fields array', () => {
			const invalidDocType = {
				...testDocType,
				fields: null
			} as any;

			const result = DocTypeValidator.validateDocType(invalidDocType);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e: any) => e.field === 'fields' && e.type === 'required'));
		});

		it('should reject DocType without permissions array', () => {
			const invalidDocType = {
				...testDocType,
				permissions: null
			} as any;

			const result = DocTypeValidator.validateDocType(invalidDocType);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e: any) => e.field === 'permissions' && e.type === 'required'));
		});
	});

	describe('Field Validation', () => {
		it('should reject fields without fieldname', () => {
			const invalidDocType = {
				...testDocType,
				fields: [
					{
						label: 'Test Field',
						fieldtype: 'Data' as FieldType
					} as DocField
				]
			};

			const result = DocTypeValidator.validateDocType(invalidDocType);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e: any) => e.field === 'fieldname' && e.type === 'required'));
		});

		it('should reject fields without label', () => {
			const invalidDocType = {
				...testDocType,
				fields: [
					{
						fieldname: 'test_field',
						fieldtype: 'Data' as FieldType
					} as DocField
				]
			};

			const result = DocTypeValidator.validateDocType(invalidDocType);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e: any) => e.field === 'label' && e.type === 'required'));
		});

		it('should reject fields without fieldtype', () => {
			const invalidDocType = {
				...testDocType,
				fields: [
					{
						fieldname: 'test_field',
						label: 'Test Field'
					} as DocField
				]
			};

			const result = DocTypeValidator.validateDocType(invalidDocType);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e: any) => e.field === 'fieldtype' && e.type === 'required'));
		});

		it('should reject invalid field types', () => {
			const invalidDocType = {
				...testDocType,
				fields: [
					{
						fieldname: 'test_field',
						label: 'Test Field',
						fieldtype: 'InvalidType' as any
					}
				]
			};

			const result = DocTypeValidator.validateDocType(invalidDocType);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e: any) => e.field === 'fieldtype' && e.type === 'invalid'));
		});

		it('should reject duplicate field names', () => {
			const invalidDocType = {
				...testDocType,
				fields: [
					{
						fieldname: 'duplicate_field',
						label: 'First Field',
						fieldtype: 'Data' as FieldType
					},
					{
						fieldname: 'duplicate_field',
						label: 'Second Field',
						fieldtype: 'Data' as FieldType
					}
				]
			};

			const result = DocTypeValidator.validateDocType(invalidDocType);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e: any) => e.type === 'duplicate' && e.field === 'duplicate_field'));
		});

		it('should require options for Link fields', () => {
			const invalidDocType = {
				...testDocType,
				fields: [
					{
						fieldname: 'link_field',
						label: 'Link Field',
						fieldtype: 'Link' as FieldType
						// Missing options
					}
				]
			};

			const result = DocTypeValidator.validateDocType(invalidDocType);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e: any) => e.field === 'options' && e.type === 'required'));
		});

		it('should require options for Table fields', () => {
			const invalidDocType = {
				...testDocType,
				fields: [
					{
						fieldname: 'table_field',
						label: 'Table Field',
						fieldtype: 'Table' as FieldType
						// Missing options
					}
				]
			};

			const result = DocTypeValidator.validateDocType(invalidDocType);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e: any) => e.field === 'options' && e.type === 'required'));
		});

		it('should validate Select fields with options', () => {
			const validDocType = {
				...testDocType,
				fields: [
					{
						fieldname: 'select_field',
						label: 'Select Field',
						fieldtype: 'Select' as FieldType,
						options: 'Option1\nOption2\nOption3'
					}
				]
			};

			const result = DocTypeValidator.validateDocType(validDocType);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject Select fields without options', () => {
			const invalidDocType = {
				...testDocType,
				fields: [
					{
						fieldname: 'select_field',
						label: 'Select Field',
						fieldtype: 'Select' as FieldType
						// Missing options
					}
				]
			};

			const result = DocTypeValidator.validateDocType(invalidDocType);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e: any) => e.field === 'options' && e.type === 'required'));
		});
	});

	describe('Permission Validation', () => {
		it('should reject permissions without role', () => {
			const invalidDocType = {
				...testDocType,
				permissions: [
					{
						read: true,
						write: true
						// Missing role
					} as any
				]
			};

			const result = DocTypeValidator.validateDocType(invalidDocType);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e: any) => e.field === 'role' && e.type === 'required'));
		});

		it('should validate permission with all properties', () => {
			const validDocType = {
				...testDocType,
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

			const result = DocTypeValidator.validateDocType(validDocType);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should validate permission with minimal properties', () => {
			const validDocType = {
				...testDocType,
				permissions: [
					{
						role: 'User',
						read: true
						// Other properties default to false
					}
				]
			};

			const result = DocTypeValidator.validateDocType(validDocType);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});
	});

	describe('Validation Result Structure', () => {
		it('should return proper validation result structure', () => {
			const result = DocTypeValidator.validateDocType(testDocType);

			expect(result).toHaveProperty('valid');
			expect(result).toHaveProperty('errors');
			expect(typeof result.valid).toBe('boolean');
			expect(Array.isArray(result.errors)).toBe(true);
		});

		it('should include error details in validation errors', () => {
			const invalidDocType = {
				name: null,
				module: '',
				fields: null,
				permissions: null
			} as any;

			const result = DocTypeValidator.validateDocType(invalidDocType);

			expect(result.errors).toHaveLength(4);

			// Check error structure
			result.errors.forEach((error: any) => {
				expect(error).toHaveProperty('type');
				expect(error).toHaveProperty('field');
				expect(error).toHaveProperty('message');
				expect(error).toHaveProperty('severity');
			});
		});

		it('should include severity levels in errors', () => {
			const invalidDocType = {
				name: null,
				module: ''
			} as any;

			const result = DocTypeValidator.validateDocType(invalidDocType);

			result.errors.forEach((error: any) => {
				expect(['error', 'warning', 'info']).toContain(error.severity);
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty DocType', () => {
			const result = DocTypeValidator.validateDocType({} as DocType);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(3); // name, module, fields, permissions
		});

		it('should handle null DocType', () => {
			const result = DocTypeValidator.validateDocType(null as any);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should handle undefined DocType', () => {
			const result = DocTypeValidator.validateDocType(undefined as any);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should handle empty fields array', () => {
			const docTypeWithEmptyFields = {
				...testDocType,
				fields: []
			};

			const result = DocTypeValidator.validateDocType(docTypeWithEmptyFields);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should handle empty permissions array', () => {
			const docTypeWithEmptyPerms = {
				...testDocType,
				permissions: []
			};

			const result = DocTypeValidator.validateDocType(docTypeWithEmptyPerms);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});
	});

	describe('Performance', () => {
		it('should handle large DocType efficiently', () => {
			const largeDocType = {
				name: 'LargeDocType',
				module: 'TestModule',
				fields: Array.from({ length: 100 }, (_, i) => ({
					fieldname: `field_${i}`,
					label: `Field ${i}`,
					fieldtype: 'Data' as FieldType
				})),
				permissions: Array.from({ length: 10 }, (_, i) => ({
					role: `Role ${i}`,
					read: true,
					write: i % 2 === 0
				}))
			};

			const startTime = Date.now();
			const result = DocTypeValidator.validateDocType(largeDocType);
			const endTime = Date.now();

			expect(result).toBeDefined();
			expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
		});

		it('should handle many validation calls efficiently', () => {
			const startTime = Date.now();

			for (let i = 0; i < 100; i++) {
				const result = DocTypeValidator.validateDocType(testDocType);
				expect(result.valid).toBe(true);
			}

			const endTime = Date.now();

			expect(endTime - startTime).toBeLessThan(500); // Should complete within 0.5 seconds
		});
	});

	describe('Integration with DocType Engine', () => {
		it('should work with engine-registered DocTypes', async () => {
			const result = DocTypeValidator.validateDocType(testDocType);

			expect(result.valid).toBe(true);

			// Unregister first since it was registered in beforeEach
			await engine.unregisterDocType(testDocType.name);

			// Should be able to register with engine after validation
			await expect(engine.registerDocType(testDocType)).resolves.not.toThrow();
		});

		it('should prevent invalid DocTypes from being registered', async () => {
			const invalidDocType = {
				name: null,
				module: 'TestModule',
				fields: [],
				permissions: []
			} as any;

			const result = DocTypeValidator.validateDocType(invalidDocType);

			expect(result.valid).toBe(false);

			// Should fail engine registration
			await expect(engine.registerDocType(invalidDocType)).rejects.toThrow();
		});
	});
});