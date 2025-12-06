/**
 * DocType Engine Tests
 * 
 * Tests for the DocTypeEngine implementation to ensure
 * proper registration, retrieval, and validation functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DocTypeEngine } from '../doctype-engine';
import { DocTypeExistsError, DocTypeNotFoundError, DocTypeValidationError } from '../doctype-engine';
import type { DocType } from '../types';

describe('DocTypeEngine', () => {
	let engine: DocTypeEngine;

	beforeEach(() => {
		// Reset the singleton instance for each test
		DocTypeEngine.resetInstance();
		engine = DocTypeEngine.getInstance();
	});

	describe('Singleton Pattern', () => {
		it('should return the same instance', () => {
			const instance1 = DocTypeEngine.getInstance();
			const instance2 = DocTypeEngine.getInstance();
			expect(instance1).toBe(instance2);
		});

		it('should create a new instance after reset', () => {
			const instance1 = DocTypeEngine.getInstance();
			DocTypeEngine.resetInstance();
			const instance2 = DocTypeEngine.getInstance();
			expect(instance1).not.toBe(instance2);
		});
	});

	describe('Registration', () => {
		it('should register a valid DocType', async () => {
			const doctype: DocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'name',
						label: 'Name',
						fieldtype: 'Data'
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

			await engine.registerDocType(doctype);
			const retrieved = await engine.getDocType('TestDocType');
			expect(retrieved).toEqual(doctype);
		});

		it('should throw DocTypeExistsError when registering duplicate', async () => {
			const doctype: DocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [],
				permissions: []
			};

			await engine.registerDocType(doctype);
			await expect(engine.registerDocType(doctype)).rejects.toThrow(DocTypeExistsError);
		});

		it('should throw DocTypeValidationError when validation fails', async () => {
			const invalidDoctype = {
				name: '',
				module: '',
				fields: [],
				permissions: []
			} as DocType;

			await expect(engine.registerDocType(invalidDoctype)).rejects.toThrow(DocTypeValidationError);
		});
	});

	describe('Retrieval', () => {
		it('should return null for non-existent DocType', async () => {
			const result = await engine.getDocType('NonExistent');
			expect(result).toBeNull();
		});

		it('should return all registered DocTypes', async () => {
			const doctype1: DocType = {
				name: 'TestDocType1',
				module: 'TestModule',
				fields: [],
				permissions: []
			};

			const doctype2: DocType = {
				name: 'TestDocType2',
				module: 'TestModule',
				fields: [],
				permissions: []
			};

			await engine.registerDocType(doctype1);
			await engine.registerDocType(doctype2);

			const allDocTypes = await engine.getAllDocTypes();
			expect(allDocTypes).toHaveLength(2);
			expect(allDocTypes).toContainEqual(doctype1);
			expect(allDocTypes).toContainEqual(doctype2);
		});

		it('should return DocTypes by module', async () => {
			const doctype1: DocType = {
				name: 'TestDocType1',
				module: 'Module1',
				fields: [],
				permissions: []
			};

			const doctype2: DocType = {
				name: 'TestDocType2',
				module: 'Module2',
				fields: [],
				permissions: []
			};

			const doctype3: DocType = {
				name: 'TestDocType3',
				module: 'Module1',
				fields: [],
				permissions: []
			};

			await engine.registerDocType(doctype1);
			await engine.registerDocType(doctype2);
			await engine.registerDocType(doctype3);

			const module1DocTypes = await engine.getDocTypesByModule('Module1');
			expect(module1DocTypes).toHaveLength(2);
			expect(module1DocTypes).toContainEqual(doctype1);
			expect(module1DocTypes).toContainEqual(doctype3);

			const module2DocTypes = await engine.getDocTypesByModule('Module2');
			expect(module2DocTypes).toHaveLength(1);
			expect(module2DocTypes).toContainEqual(doctype2);

			const module3DocTypes = await engine.getDocTypesByModule('Module3');
			expect(module3DocTypes).toHaveLength(0);
		});

		it('should return correct registration status', async () => {
			const doctype: DocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [],
				permissions: []
			};

			expect(await engine.isRegistered('TestDocType')).toBe(false);
			await engine.registerDocType(doctype);
			expect(await engine.isRegistered('TestDocType')).toBe(true);
		});

		it('should return correct DocType count', async () => {
			expect(await engine.getDocTypeCount()).toBe(0);

			const doctype1: DocType = {
				name: 'TestDocType1',
				module: 'TestModule',
				fields: [],
				permissions: []
			};

			const doctype2: DocType = {
				name: 'TestDocType2',
				module: 'TestModule',
				fields: [],
				permissions: []
			};

			await engine.registerDocType(doctype1);
			expect(await engine.getDocTypeCount()).toBe(1);

			await engine.registerDocType(doctype2);
			expect(await engine.getDocTypeCount()).toBe(2);
		});
	});

	describe('Unregistration', () => {
		it('should unregister a DocType', async () => {
			const doctype: DocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [],
				permissions: []
			};

			await engine.registerDocType(doctype);
			expect(await engine.isRegistered('TestDocType')).toBe(true);

			await engine.unregisterDocType('TestDocType');
			expect(await engine.isRegistered('TestDocType')).toBe(false);
		});

		it('should throw DocTypeNotFoundError when unregistering non-existent', async () => {
			await expect(engine.unregisterDocType('NonExistent')).rejects.toThrow(DocTypeNotFoundError);
		});
	});

	describe('Validation', () => {
		it('should validate a valid DocType', async () => {
			const doctype: DocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'name',
						label: 'Name',
						fieldtype: 'Data'
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

			const result = await engine.validateDocType(doctype);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should return validation errors for invalid DocType', async () => {
			const invalidDoctype = {
				name: '',
				module: '',
				fields: [],
				permissions: []
			} as DocType;

			const result = await engine.validateDocType(invalidDoctype);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should detect duplicate field names', async () => {
			const doctype: DocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'name',
						label: 'Name',
						fieldtype: 'Data'
					},
					{
						fieldname: 'name',
						label: 'Another Name',
						fieldtype: 'Data'
					}
				],
				permissions: []
			};

			const result = await engine.validateDocType(doctype);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.type === 'duplicate')).toBe(true);
		});

		it('should detect invalid field types', async () => {
			const doctype: DocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'name',
						label: 'Name',
						fieldtype: 'InvalidType' as any
					}
				],
				permissions: []
			};

			const result = await engine.validateDocType(doctype);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.type === 'invalid_type')).toBe(true);
		});

		it('should detect missing options for Link fields', async () => {
			const doctype: DocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'link_field',
						label: 'Link Field',
						fieldtype: 'Link'
						// Missing options
					}
				],
				permissions: []
			};

			const result = await engine.validateDocType(doctype);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.type === 'missing_options')).toBe(true);
		});

		it('should detect missing options for Table fields', async () => {
			const doctype: DocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'table_field',
						label: 'Table Field',
						fieldtype: 'Table'
						// Missing options
					}
				],
				permissions: []
			};

			const result = await engine.validateDocType(doctype);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.type === 'missing_options')).toBe(true);
		});
	});

	describe('Module Management', () => {
		it('should return all modules', async () => {
			const doctype1: DocType = {
				name: 'TestDocType1',
				module: 'Module1',
				fields: [],
				permissions: []
			};

			const doctype2: DocType = {
				name: 'TestDocType2',
				module: 'Module2',
				fields: [],
				permissions: []
			};

			await engine.registerDocType(doctype1);
			await engine.registerDocType(doctype2);

			const modules = await engine.getAllModules();
			expect(modules).toHaveLength(2);
			expect(modules).toContain('Module1');
			expect(modules).toContain('Module2');
		});

		it('should return DocType count by module', async () => {
			const doctype1: DocType = {
				name: 'TestDocType1',
				module: 'Module1',
				fields: [],
				permissions: []
			};

			const doctype2: DocType = {
				name: 'TestDocType2',
				module: 'Module1',
				fields: [],
				permissions: []
			};

			const doctype3: DocType = {
				name: 'TestDocType3',
				module: 'Module2',
				fields: [],
				permissions: []
			};

			await engine.registerDocType(doctype1);
			await engine.registerDocType(doctype2);
			await engine.registerDocType(doctype3);

			expect(await engine.getDocTypeCountByModule('Module1')).toBe(2);
			expect(await engine.getDocTypeCountByModule('Module2')).toBe(1);
			expect(await engine.getDocTypeCountByModule('Module3')).toBe(0);
		});
	});
});