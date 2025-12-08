/**
 * Meta Factory Tests
 * 
 * Tests for the MetaFactory class implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DocTypeEngine } from '../doctype-engine';
import { MetaFactory } from '../meta-factory';
import { DocTypeError } from '../errors';
import type { DocType } from '../types';
import { DocTypeTestFactory, DocTypeTestHelper } from '../../../__tests__/utils/doctype';

describe('MetaFactory', () => {
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
			name: 'TestDocType',
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

	describe('create', () => {
		it('should create Meta instance for valid DocType', async () => {
			const meta = MetaFactory.create(testDocType);
			
			expect(meta).toBeDefined();
			expect(meta.get_doctype().name).toBe(testDocType.name);
			expect(meta.get_doctype().module).toBe(testDocType.module);
		});

		it('should throw error for invalid DocType', () => {
			const invalidDocType = null as any;
			
			expect(() => MetaFactory.create(invalidDocType))
				.toThrow(DocTypeError);
		});

		it('should throw error for DocType without name', () => {
			const invalidDocType = {
				module: 'TestModule',
				fields: [],
				permissions: []
			} as unknown as DocType;
			
			expect(() => MetaFactory.create(invalidDocType))
				.toThrow(DocTypeError);
		});

		it('should throw error for DocType without module', () => {
			const invalidDocType = {
				name: 'TestDocType',
				fields: [],
				permissions: []
			} as unknown as DocType;
			
			expect(() => MetaFactory.create(invalidDocType))
				.toThrow(DocTypeError);
		});

		it('should throw error for DocType without fields array', () => {
			const invalidDocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: null as any,
				permissions: []
			};
			
			expect(() => MetaFactory.create(invalidDocType))
				.toThrow(DocTypeError);
		});

		it('should throw error for DocType without permissions array', () => {
			const invalidDocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [],
				permissions: null as any
			};
			
			expect(() => MetaFactory.create(invalidDocType))
				.toThrow(DocTypeError);
		});
	});

	describe('createFromName', () => {
		it('should create Meta instance from DocType name', async () => {
			const meta = await MetaFactory.createFromName(testDocType.name, engine);
			
			expect(meta).toBeDefined();
			expect(meta?.get_doctype().name).toBe(testDocType.name);
			expect(meta?.get_doctype().module).toBe(testDocType.module);
		});

		it('should return null for non-existent DocType', async () => {
			const meta = await MetaFactory.createFromName('NonExistentDocType', engine);
			
			expect(meta).toBeNull();
		});

		it('should handle engine errors gracefully', async () => {
			// Mock engine to throw error
			const mockEngine = {
				getDocType: vi.fn().mockRejectedValue(new Error('Engine error'))
			} as any;
			
			await expect(MetaFactory.createFromName(testDocType.name, mockEngine))
				.rejects.toThrow('Engine error');
		});
	});

	describe('createFromNames', () => {
		it('should create multiple Meta instances from DocType names', async () => {
			const docTypeNames = [testDocType.name];
			
			const metas = await MetaFactory.createFromNames(docTypeNames, engine);
			
			expect(metas).toBeDefined();
			expect(metas.size).toBe(1);
			expect(metas.get(testDocType.name)?.get_doctype().name).toBe(testDocType.name);
		});

		it('should handle empty array gracefully', async () => {
			const metas = await MetaFactory.createFromNames([], engine);
			
			expect(metas).toBeDefined();
			expect(metas.size).toBe(0);
		});

		it('should return null for non-existent DocType in batch', async () => {
			const docTypeNames = ['NonExistentDocType'];
			
			const metas = await MetaFactory.createFromNames(docTypeNames, engine);
			
			expect(metas).toBeDefined();
			expect(metas.size).toBe(1);
			expect(metas.get('NonExistentDocType')).toBeNull();
		});

		it('should handle mixed existing and non-existent DocTypes', async () => {
			const docTypeNames = [testDocType.name, 'NonExistentDocType'];
			
			const metas = await MetaFactory.createFromNames(docTypeNames, engine);
			
			expect(metas).toBeDefined();
			expect(metas.size).toBe(2);
			expect(metas.get(testDocType.name)?.get_doctype().name).toBe(testDocType.name);
			expect(metas.get('NonExistentDocType')).toBeNull();
		});

		it('should process DocTypes in parallel for better performance', async () => {
			// Create multiple DocTypes
			const docTypes = Array.from({ length: 10 }, (_, i) => 
				DocTypeTestFactory.createMinimalDocType({
					name: `ParallelDocType${i}`,
					module: 'TestModule'
				})
			);
			
			// Register all DocTypes
			for (const docType of docTypes) {
				await engine.registerDocType(docType);
			}
			
			const docTypeNames = docTypes.map(dt => dt.name);
			
			const startTime = Date.now();
			const metas = await MetaFactory.createFromNames(docTypeNames, engine);
			const endTime = Date.now();
			
			expect(metas).toBeDefined();
			expect(metas.size).toBe(10);
			
			// Should complete faster than sequential processing
			expect(endTime - startTime).toBeLessThan(1000); // 1 second
		});
	});

	describe('Validation', () => {
		it('should validate DocType structure', () => {
			const validDocType = DocTypeTestFactory.createMinimalDocType({
				name: 'ValidDocType',
				module: 'TestModule'
			});
			
			expect(() => MetaFactory.create(validDocType)).not.toThrow();
		});

		it('should reject DocType with invalid structure', () => {
			const invalidDocType = {
				name: 'InvalidDocType',
				module: 'TestModule',
				fields: 'not-an-array' as any,
				permissions: []
			};
			
			expect(() => MetaFactory.create(invalidDocType as DocType))
				.toThrow(DocTypeError);
		});
	});

	describe('Engine Integration', () => {
		it('should use DocTypeEngine for DocType retrieval', async () => {
			const meta = await MetaFactory.createFromName(testDocType.name, engine);
			const retrievedDocType = await engine.getDocType(testDocType.name);
			
			// Check that meta exists and has the correct doctype
			expect(meta).toBeDefined();
			if (meta) {
				expect(meta.get_doctype()).toEqual(retrievedDocType);
			}
		});

		it('should handle engine unavailability', async () => {
			// Mock engine to throw error
			const mockEngine = {
				getDocType: vi.fn().mockRejectedValue(new Error('Engine unavailable'))
			} as any;
			
			await expect(MetaFactory.createFromName(testDocType.name, mockEngine))
				.rejects.toThrow('Engine unavailable');
		});
	});

	describe('Performance', () => {
		it('should handle large number of Meta instances efficiently', async () => {
			const docTypes = Array.from({ length: 50 }, (_, i) => 
				DocTypeTestFactory.createMinimalDocType({
					name: `LargeDocType${i}`,
					module: 'TestModule'
				})
			);
			
			// Register all DocTypes
			for (const docType of docTypes) {
				await engine.registerDocType(docType);
			}
			
			const startTime = Date.now();
			const metas = await MetaFactory.createFromNames(
				docTypes.map(dt => dt.name), 
				engine
			);
			const endTime = Date.now();
			
			expect(metas).toBeDefined();
			expect(metas.size).toBe(50);
			expect(endTime - startTime).toBeLessThan(2000); // Should create within 2 seconds
		});

		it('should initialize indexes efficiently', async () => {
			const complexDocType = DocTypeTestFactory.createComprehensiveDocType({
				name: 'ComplexDocType',
				module: 'TestModule'
			});
			
			await engine.registerDocType(complexDocType);
			
			const startTime = Date.now();
			const meta = MetaFactory.create(complexDocType);
			const endTime = Date.now();
			
			expect(meta).toBeDefined();
			expect(endTime - startTime).toBeLessThan(100); // Should initialize quickly
		});
	});

	describe('Error Handling', () => {
		it('should provide descriptive error messages', () => {
			try {
				MetaFactory.create(null as any);
			} catch (error: any) {
				expect(error).toBeInstanceOf(DocTypeError);
				expect(error.message).toContain('Invalid DocType provided');
			}
		});

		it('should handle engine errors with proper propagation', async () => {
			const mockEngine = {
				getDocType: vi.fn().mockRejectedValue(new Error('Specific engine error'))
			} as any;
			
			try {
				await MetaFactory.createFromName(testDocType.name, mockEngine);
			} catch (error: any) {
				expect(error.message).toBe('Specific engine error');
			}
		});
	});

	describe('Memory Management', () => {
		it('should not leak memory with repeated operations', async () => {
			const initialMemory = process.memoryUsage().heapUsed;
			
			// Perform many operations
			for (let i = 0; i < 100; i++) {
				const meta = MetaFactory.create(testDocType);
				expect(meta).toBeDefined();
			}
			
			// Force garbage collection if available
			if (global.gc) {
				global.gc();
			}
			
			const finalMemory = process.memoryUsage().heapUsed;
			const memoryIncrease = finalMemory - initialMemory;
			
			// Memory increase should be reasonable (less than 10MB)
			expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
		});
	});
});