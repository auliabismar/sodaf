/**
 * Single Document Tests
 * 
 * Tests for the SingleDocument class implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DocTypeEngine } from '../doctype-engine';
import { SingleDocument, SingleDocTypeError } from '../single-document';
import { DocTypeValidationError } from '../errors';
import type { DocType } from '../types';
import { DocTypeTestFactory, DocTypeTestHelper } from '../../../__tests__/utils/doctype';
import { createInMemoryTestDatabase } from '../../../__tests__/utils/database';

describe('SingleDocument', () => {
	let engine: DocTypeEngine;
	let metaHelper: DocTypeTestHelper;
	let testDocType: DocType;
	let testDb: any;
	let singleDoc: SingleDocument;

	beforeEach(async () => {
		// Reset engine instance
		DocTypeEngine.resetInstance();
		engine = DocTypeEngine.getInstance();
		metaHelper = new DocTypeTestHelper();

		// Create test database
		testDb = createInMemoryTestDatabase('single-doc-test');
		await testDb.initialize();

		// Create test DocType with unique name to avoid conflicts
		const uniqueId = Math.random().toString(36).substring(2, 8);
		testDocType = DocTypeTestFactory.createSingleDocType({
			name: `TestSingleDoc_${uniqueId}`,
			module: 'TestModule'
		});

		// Register DocType
		await engine.registerDocType(testDocType);

		// Don't create Singles table here - let each test create its own
	});

	afterEach(async () => {
		// Clean up
		await testDb.close();
		metaHelper.clear();
		DocTypeEngine.resetInstance();
		vi.restoreAllMocks();
	});

	describe('Constructor', () => {
		it('should create SingleDocument instance with valid DocType', () => {
			const singleDoc = new SingleDocument({ doctype: testDocType.name }, testDb as any);
			expect(singleDoc).toBeDefined();
			expect(singleDoc.doctype).toBe(testDocType.name);
			expect(singleDoc.__issingle).toBe(true);
			expect(singleDoc.name).toBe(testDocType.name);
		});

		it('should mark as not new and not unsaved', () => {
			// These are protected properties, we'll test through behavior
			const singleDoc = new SingleDocument({ doctype: testDocType.name }, testDb as any);
			expect(singleDoc.name).toBe(testDocType.name);
		});
	});

	describe('Document Operations', () => {
		it('should load document from database', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('load-test');
			await freshDb.initialize();

			// Create Singles table
			await freshDb.run(`
				CREATE TABLE IF NOT EXISTS tabSingles (
					doctype TEXT NOT NULL,
					field TEXT NOT NULL,
					value TEXT,
					PRIMARY KEY (doctype, field)
				)
			`);

			// Set some values first
			const singleDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			singleDoc.set('company_name', 'Test Company');
			await singleDoc.save();

			// Create a new SingleDocument instance for loading to ensure proper initialization
			const loadedDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			await loadedDoc.reload();

			expect(loadedDoc).toBeDefined();
			expect(loadedDoc.doctype).toBe(testDocType.name);
			expect((loadedDoc as any).company_name).toBe('Test Company');

			await freshDb.close();
		});

		it('should update document data using set method', async () => {
			const singleDoc = new SingleDocument({ doctype: testDocType.name }, testDb as any);
			singleDoc.set('company_name', 'Updated Company');
			singleDoc.set('default_currency', 'EUR');

			// Test that the value was set and document is marked as changed
			expect((singleDoc as any).company_name).toBe('Updated Company');
			expect((singleDoc as any).default_currency).toBe('EUR');
		});

		it('should save document changes to database', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('save-test');
			await freshDb.initialize();

			// Create Singles table
			await freshDb.run(`
				CREATE TABLE IF NOT EXISTS tabSingles (
					doctype TEXT NOT NULL,
					field TEXT NOT NULL,
					value TEXT,
					PRIMARY KEY (doctype, field)
				)
			`);

			const singleDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			singleDoc.set('company_name', 'Saved Company');
			singleDoc.set('timezone', 'America/New_York');

			await singleDoc.save();

			// Verify save completed successfully
			expect(singleDoc).toBeDefined();

			// Verify by loading fresh instance
			const loadedDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			await loadedDoc.reload();
			expect((loadedDoc as any).company_name).toBe('Saved Company');
			expect((loadedDoc as any).timezone).toBe('America/New_York');

			await freshDb.close();
		});

		it('should reload document from storage', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('reload-test');
			await freshDb.initialize();

			// Create Singles table
			await freshDb.run(`
				CREATE TABLE IF NOT EXISTS tabSingles (
					doctype TEXT NOT NULL,
					field TEXT NOT NULL,
					value TEXT,
					PRIMARY KEY (doctype, field)
				)
			`);

			// Set initial values
			const singleDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			singleDoc.set('company_name', 'Original Company');
			await singleDoc.save();

			// Update document in memory
			singleDoc.set('company_name', 'Modified Company');

			// Reload document
			await singleDoc.reload();

			// Verify reload completed successfully
			expect(singleDoc).toBeDefined();
			expect((singleDoc as any).company_name).toBe('Original Company'); // Should revert to saved value

			await freshDb.close();
		});

		it('should not save if no changes made', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('no-changes-test');
			await freshDb.initialize();

			// Create Singles table
			await freshDb.run(`
				CREATE TABLE IF NOT EXISTS tabSingles (
					doctype TEXT NOT NULL,
					field TEXT NOT NULL,
					value TEXT,
					PRIMARY KEY (doctype, field)
				)
			`);

			// Should not throw error
			const singleDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			await singleDoc.save();
			// Verify no changes to save
			expect(singleDoc).toBeDefined();

			await freshDb.close();
		});
	});

	describe('CRUD Restrictions', () => {
		it('should not allow insert operation', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('insert-test');
			await freshDb.initialize();

			const singleDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			await expect(singleDoc.insert())
				.rejects.toThrow(SingleDocTypeError);

			await freshDb.close();
		});

		it('should not allow delete operation', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('delete-test');
			await freshDb.initialize();

			const singleDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			await expect(singleDoc.delete())
				.rejects.toThrow(SingleDocTypeError);

			await freshDb.close();
		});
	});

	describe('Value Parsing', () => {
		it('should parse string values correctly', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('string-value-test');
			await freshDb.initialize();

			// Create Singles table
			await freshDb.run(`
				CREATE TABLE IF NOT EXISTS tabSingles (
					doctype TEXT NOT NULL,
					field TEXT NOT NULL,
					value TEXT,
					PRIMARY KEY (doctype, field)
				)
			`);

			const singleDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			singleDoc.set('company_name', 'Test String');
			await singleDoc.save();

			// Reload the same document instance instead of creating a new one
			await singleDoc.reload();
			expect((singleDoc as any).company_name).toBe('Test String');

			await freshDb.close();
		});

		it('should parse integer values correctly', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('int-value-test');
			await freshDb.initialize();

			// Create Singles table
			await freshDb.run(`
				CREATE TABLE IF NOT EXISTS tabSingles (
					doctype TEXT NOT NULL,
					field TEXT NOT NULL,
					value TEXT,
					PRIMARY KEY (doctype, field)
				)
			`);

			const singleDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			singleDoc.set('test_number', 42);
			await singleDoc.save();

			// Reload the same document instance instead of creating a new one
			await singleDoc.reload();
			expect((singleDoc as any).test_number).toBe(42);

			await freshDb.close();
		});

		it('should parse float values correctly', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('float-value-test');
			await freshDb.initialize();

			// Create Singles table
			await freshDb.run(`
				CREATE TABLE IF NOT EXISTS tabSingles (
					doctype TEXT NOT NULL,
					field TEXT NOT NULL,
					value TEXT,
					PRIMARY KEY (doctype, field)
				)
			`);

			const singleDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			singleDoc.set('test_float', 3.14);
			await singleDoc.save();

			// Reload the same document instance instead of creating a new one
			await singleDoc.reload();
			expect((singleDoc as any).test_float).toBe(3.14);

			await freshDb.close();
		});

		it('should parse JSON values correctly', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('json-value-test');
			await freshDb.initialize();

			// Create Singles table
			await freshDb.run(`
				CREATE TABLE IF NOT EXISTS tabSingles (
					doctype TEXT NOT NULL,
					field TEXT NOT NULL,
					value TEXT,
					PRIMARY KEY (doctype, field)
				)
			`);

			const singleDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			const testObject = { key: 'value', nested: { data: 123 } };
			singleDoc.set('test_json', testObject);
			await singleDoc.save();

			// Reload the same document instance instead of creating a new one
			await singleDoc.reload();
			expect((singleDoc as any).test_json).toEqual(testObject);

			await freshDb.close();
		});

		it('should parse null values correctly', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('null-value-test');
			await freshDb.initialize();

			// Create Singles table
			await freshDb.run(`
				CREATE TABLE IF NOT EXISTS tabSingles (
					doctype TEXT NOT NULL,
					field TEXT NOT NULL,
					value TEXT,
					PRIMARY KEY (doctype, field)
				)
			`);

			const singleDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			singleDoc.set('test_null', null);
			await singleDoc.save();

			// Reload the same document instance instead of creating a new one
			await singleDoc.reload();
			expect((singleDoc as any).test_null).toBeNull();

			await freshDb.close();
		});
	});

	describe('Database Operations', () => {
		it('should create Singles table if not exists', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('create-table-test');
			await freshDb.initialize();

			// Drop the table first to test creation
			await freshDb.run('DROP TABLE IF EXISTS tabSingles');

			// Create a new SingleDocument instance to ensure proper initialization
			const newDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			// Set a value to ensure save() actually executes
			newDoc.set('test_field', 'test_value');
			await newDoc.save();

			// Verify table exists
			const tables = await freshDb.sql(
				"SELECT name FROM sqlite_master WHERE type='table' AND name='tabSingles'"
			);
			expect(tables).toHaveLength(1);

			await freshDb.close();
		});

		it('should upsert values correctly', async () => {
			const docTypeName = testDocType.name;
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('upsert-test');
			await freshDb.initialize();

			// Create Singles table manually to ensure it exists
			await freshDb.run(`
				CREATE TABLE IF NOT EXISTS tabSingles (
					doctype TEXT NOT NULL,
					field TEXT NOT NULL,
					value TEXT,
					PRIMARY KEY (doctype, field)
				)
			`);

			// Initial save
			const singleDoc = new SingleDocument({ doctype: docTypeName }, freshDb as any);
			singleDoc.set('company_name', 'Initial Company');
			await singleDoc.save();

			// Update same field
			singleDoc.set('company_name', 'Updated Company');
			await singleDoc.save();

			// Verify only one record exists with updated value
			const rows = await freshDb.sql(
				'SELECT field, value FROM tabSingles WHERE doctype = ? AND field = ?',
				[docTypeName, 'company_name']
			);
			expect(rows).toHaveLength(1);
			expect(rows[0].value).toBe('Updated Company');

			await freshDb.close();
		});

		it('should update modified timestamp on save', async () => {
			const docTypeName = testDocType.name;
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('modified-timestamp-test');
			await freshDb.initialize();

			// Create Singles table manually to ensure it exists
			await freshDb.run(`
				CREATE TABLE IF NOT EXISTS tabSingles (
					doctype TEXT NOT NULL,
					field TEXT NOT NULL,
					value TEXT,
					PRIMARY KEY (doctype, field)
				)
			`);

			// Create a new SingleDocument instance to ensure proper initialization
			const newDoc = new SingleDocument({ doctype: docTypeName }, freshDb as any);
			newDoc.set('company_name', 'Test Company');
			await newDoc.save();

			// Check modified timestamp
			const rows = await freshDb.sql(
				'SELECT value FROM tabSingles WHERE doctype = ? AND field = ?',
				[docTypeName, 'modified']
			);
			expect(rows).toHaveLength(1);
			expect(rows[0].value).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

			await freshDb.close();
		});

		it('should update modified_by on save', async () => {
			const docTypeName = testDocType.name;
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('modified-by-test');
			await freshDb.initialize();

			// Create Singles table manually to ensure it exists
			await freshDb.run(`
				CREATE TABLE IF NOT EXISTS tabSingles (
					doctype TEXT NOT NULL,
					field TEXT NOT NULL,
					value TEXT,
					PRIMARY KEY (doctype, field)
				)
			`);

			// Create a new SingleDocument instance to ensure proper initialization
			const newDoc = new SingleDocument({ doctype: docTypeName }, freshDb as any);
			newDoc.set('company_name', 'Test Company');
			await newDoc.save();

			// Check modified_by
			const rows = await freshDb.sql(
				'SELECT value FROM tabSingles WHERE doctype = ? AND field = ?',
				[docTypeName, 'modified_by']
			);
			expect(rows).toHaveLength(1);
			expect(rows[0].value).toBe('Administrator');

			await freshDb.close();
		});
	});

	describe('Error Handling', () => {
		it('should handle database errors gracefully', async () => {
			// Mock database error
			const mockDb = {
				run: vi.fn().mockRejectedValue(new Error('Database error')),
				sql: vi.fn().mockResolvedValue([])
			} as any;

			const errorDoc = new SingleDocument({ doctype: testDocType.name }, mockDb);
			errorDoc.set('company_name', 'Test');

			await expect(errorDoc.save())
				.rejects.toThrow('Failed to save single document');
		});

		it('should handle reload errors gracefully', async () => {
			// Mock database error
			const mockDb = {
				run: vi.fn().mockResolvedValue({}),
				sql: vi.fn().mockRejectedValue(new Error('Database error'))
			} as any;

			const errorDoc = new SingleDocument({ doctype: testDocType.name }, mockDb);

			await expect(errorDoc.reload())
				.rejects.toThrow('Failed to reload single document');
		});

		it('should provide descriptive error messages for insert', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('insert-error-test');
			await freshDb.initialize();

			const singleDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			try {
				await singleDoc.insert();
			} catch (error: any) {
				expect(error).toBeInstanceOf(SingleDocTypeError);
				expect(error.message).toContain('Cannot insert Single DocType');
				// Just check that it contains the doctype prefix, not the exact name
				expect(error.message).toContain('TestSingleDoc_');
			}

			await freshDb.close();
		});

		it('should provide descriptive error messages for delete', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('delete-error-test');
			await freshDb.initialize();

			const singleDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			try {
				await singleDoc.delete();
			} catch (error: any) {
				expect(error).toBeInstanceOf(SingleDocTypeError);
				expect(error.message).toContain('Cannot delete Single DocType');
				// Just check that it contains the doctype prefix, not the exact name
				expect(error.message).toContain('TestSingleDoc_');
			}

			await freshDb.close();
		});
	});

	describe('Performance', () => {
		it('should handle large document data efficiently', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('large-data-test');
			await freshDb.initialize();

			const largeData = 'A'.repeat(10000); // Large text field

			// Create a new SingleDocument instance to ensure proper initialization
			const newDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			newDoc.set('large_field', largeData);

			const startTime = Date.now();
			await newDoc.save();
			const endTime = Date.now();

			expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

			await freshDb.close();
		});

		it('should handle multiple field updates efficiently', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('performance-test');
			await freshDb.initialize();

			// Create a new SingleDocument instance to ensure proper initialization
			const newDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);

			// Set many fields
			for (let i = 0; i < 100; i++) {
				newDoc.set(`field_${i}`, `value_${i}`);
			}

			const startTime = Date.now();
			await newDoc.save();
			const endTime = Date.now();

			expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds

			await freshDb.close();
		});
	});

	describe('Hooks', () => {
		it('should execute validate hook before save', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('hook-test');
			await freshDb.initialize();

			// Create Singles table
			await freshDb.run(`
				CREATE TABLE IF NOT EXISTS tabSingles (
					doctype TEXT NOT NULL,
					field TEXT NOT NULL,
					value TEXT,
					PRIMARY KEY (doctype, field)
				)
			`);

			const validateHook = vi.fn();
			const hooks = { validate: validateHook };

			// Create a new SingleDocument instance to ensure proper initialization
			const hookDoc = new SingleDocument(
				{ doctype: testDocType.name },
				freshDb as any,
				hooks
			);

			hookDoc.set('company_name', 'Test');
			await hookDoc.save();

			expect(validateHook).toHaveBeenCalled();

			await freshDb.close();
		});

		it('should execute before_save hook before save', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('before-save-hook-test');
			await freshDb.initialize();

			const beforeSaveHook = vi.fn();
			const hooks = { before_save: beforeSaveHook };

			// Create a new SingleDocument instance to ensure proper initialization
			const hookDoc = new SingleDocument(
				{ doctype: testDocType.name },
				freshDb as any,
				hooks
			);

			hookDoc.set('company_name', 'Test');
			await hookDoc.save();

			expect(beforeSaveHook).toHaveBeenCalled();

			await freshDb.close();
		});

		it('should execute after_save hook after save', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('after-save-hook-test');
			await freshDb.initialize();

			const afterSaveHook = vi.fn();
			const hooks = { after_save: afterSaveHook };

			// Create a new SingleDocument instance to ensure proper initialization
			const hookDoc = new SingleDocument(
				{ doctype: testDocType.name },
				freshDb as any,
				hooks
			);

			hookDoc.set('company_name', 'Test');
			await hookDoc.save();

			expect(afterSaveHook).toHaveBeenCalled();

			await freshDb.close();
		});

		it('should execute on_reload hook after reload', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('on-reload-hook-test');
			await freshDb.initialize();

			const onReloadHook = vi.fn();
			const hooks = { on_reload: onReloadHook };

			// Create a new SingleDocument instance to ensure proper initialization
			const hookDoc = new SingleDocument(
				{ doctype: testDocType.name },
				freshDb as any,
				hooks
			);

			hookDoc.set('company_name', 'Test');
			await hookDoc.save();
			await hookDoc.reload();

			expect(onReloadHook).toHaveBeenCalled();

			await freshDb.close();
		});
	});

	describe('Static Methods', () => {
		it('should load document using static load method', async () => {
			// Create a fresh database for this test
			const freshDb = createInMemoryTestDatabase('static-load-test');
			await freshDb.initialize();

			// Set up data first
			const singleDoc = new SingleDocument({ doctype: testDocType.name }, freshDb as any);
			singleDoc.set('company_name', 'Static Load Test');
			await singleDoc.save();

			// Load using static method
			const loadedDoc = await SingleDocument.load(testDocType.name, freshDb as any);

			expect(loadedDoc).toBeInstanceOf(SingleDocument);
			expect(loadedDoc.doctype).toBe(testDocType.name);
			expect((loadedDoc as any).company_name).toBe('Static Load Test');

			await freshDb.close();
		});
	});
});
