/**
 * MetaFactory Unit Tests
 * 
 * This file contains comprehensive unit tests for the MetaFactory class
 * covering all factory methods and validation logic.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DocTypeEngine } from '../doctype-engine';
import { DocTypeMeta } from '../meta';
import { MetaFactory } from '../meta-factory';
import { DocTypeError } from '../errors';
import type { DocType } from '../types';

describe('MetaFactory', () => {
	let engine: DocTypeEngine;
	let sampleDocType: DocType;

	beforeEach(() => {
		// Reset instances for clean testing
		DocTypeEngine.resetInstance();
		
		engine = DocTypeEngine.getInstance();

		// Create a sample DocType for testing
		sampleDocType = {
			name: 'TestDocType',
			module: 'TestModule',
			fields: [
				{
					fieldname: 'title',
					label: 'Title',
					fieldtype: 'Data',
					required: true
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
	});

	afterEach(() => {
		// Clean up after each test
		DocTypeEngine.resetInstance();
	});

	describe('create method', () => {
		it('should create DocTypeMeta instance from valid DocType', () => {
			const meta = MetaFactory.create(sampleDocType);
			
			expect(meta).toBeInstanceOf(DocTypeMeta);
			expect(meta.get_doctype()).toBe(sampleDocType);
			expect(meta.has_field('title')).toBe(true);
		});

		it('should throw error for null DocType', () => {
			expect(() => MetaFactory.create(null as any)).toThrow(DocTypeError);
			expect(() => MetaFactory.create(undefined as any)).toThrow(DocTypeError);
		});

		it('should throw error for DocType without name', () => {
			const invalidDocType = { ...sampleDocType, name: '' };
			expect(() => MetaFactory.create(invalidDocType)).toThrow(DocTypeError);
		});

		it('should throw error for DocType without module', () => {
			const invalidDocType = { ...sampleDocType, module: undefined as any };
			expect(() => MetaFactory.create(invalidDocType)).toThrow(DocTypeError);
		});

		it('should throw error for DocType without fields array', () => {
			const invalidDocType = { ...sampleDocType, fields: null as any };
			expect(() => MetaFactory.create(invalidDocType)).toThrow(DocTypeError);
		});

		it('should throw error for DocType without permissions array', () => {
			const invalidDocType = { ...sampleDocType, permissions: null as any };
			expect(() => MetaFactory.create(invalidDocType)).toThrow(DocTypeError);
		});

		it('should initialize computed indexes', () => {
			const meta = MetaFactory.create(sampleDocType);
			
			// Trigger computation to verify initialization
			const validColumns = meta.get_valid_columns();
			expect(validColumns).toContain('title');
		});
	});

	describe('createFromName method', () => {
		beforeEach(async () => {
			// Register sample DocType for createFromName tests
			await engine.registerDocType(sampleDocType);
		});

		it('should create DocTypeMeta from DocType name', async () => {
			const meta = await MetaFactory.createFromName('TestDocType', engine);
			
			expect(meta).toBeInstanceOf(DocTypeMeta);
			expect(meta?.get_doctype().name).toBe('TestDocType');
			expect(meta?.has_field('title')).toBe(true);
		});

		it('should return null for non-existent DocType', async () => {
			const meta = await MetaFactory.createFromName('NonExistentDocType', engine);
			expect(meta).toBeNull();
		});

		it('should throw error when engine is null', async () => {
			await expect(
				MetaFactory.createFromName('TestDocType', null as any)
			).rejects.toThrow();
		});
	});

	describe('createFromNames method', () => {
		beforeEach(async () => {
			// Register multiple DocTypes for createFromNames tests
			await engine.registerDocType(sampleDocType);
			
			const secondDocType = {
				...sampleDocType,
				name: 'SecondDocType'
			};
			await engine.registerDocType(secondDocType);
			
			const thirdDocType = {
				...sampleDocType,
				name: 'ThirdDocType'
			};
			await engine.registerDocType(thirdDocType);
		});

		it('should create multiple DocTypeMeta instances from names', async () => {
			const results = await MetaFactory.createFromNames(
				['TestDocType', 'SecondDocType', 'ThirdDocType'],
				engine
			);
			
			expect(results.size).toBe(3);
			expect(results.get('TestDocType')).toBeInstanceOf(DocTypeMeta);
			expect(results.get('SecondDocType')).toBeInstanceOf(DocTypeMeta);
			expect(results.get('ThirdDocType')).toBeInstanceOf(DocTypeMeta);
		});

		it('should return null for non-existent DocTypes', async () => {
			const results = await MetaFactory.createFromNames(
				['TestDocType', 'NonExistentDocType', 'AnotherNonExistent'],
				engine
			);
			
			expect(results.size).toBe(3);
			expect(results.get('TestDocType')).toBeInstanceOf(DocTypeMeta);
			expect(results.get('NonExistentDocType')).toBeNull();
			expect(results.get('AnotherNonExistent')).toBeNull();
		});

		it('should handle empty array of names', async () => {
			const results = await MetaFactory.createFromNames([], engine);
			expect(results.size).toBe(0);
		});

		it('should handle duplicate names in array', async () => {
			const results = await MetaFactory.createFromNames(
				['TestDocType', 'TestDocType', 'SecondDocType'],
				engine
			);
			
			// Map should only have unique keys
			expect(results.size).toBe(2);
			expect(results.get('TestDocType')).toBeInstanceOf(DocTypeMeta);
			expect(results.get('SecondDocType')).toBeInstanceOf(DocTypeMeta);
		});

		it('should throw error when engine is null', async () => {
			await expect(
				MetaFactory.createFromNames(['TestDocType'], null as any)
			).rejects.toThrow();
		});
	});

	describe('edge cases and error handling', () => {
		it('should handle DocType with minimal valid structure', () => {
			const minimalDocType: DocType = {
				name: 'Minimal',
				module: 'Test',
				fields: [],
				permissions: []
			};
			
			expect(() => MetaFactory.create(minimalDocType)).not.toThrow();
			const meta = MetaFactory.create(minimalDocType);
			expect(meta).toBeInstanceOf(DocTypeMeta);
		});

		it('should handle DocType with complex structure', () => {
			const complexDocType: DocType = {
				name: 'Complex',
				module: 'Test',
				is_submittable: true,
				issingle: false,
				istable: false,
				is_tree: false,
				is_virtual: false,
				title_field: 'title',
				image_field: 'image',
				search_fields: 'title, description',
				fields: [
					{
						fieldname: 'title',
						label: 'Title',
						fieldtype: 'Data',
						required: true,
						unique: true,
						length: 100,
						hidden: false,
						read_only: false,
						indexed: true,
						description: 'Test description',
						comment: 'Test comment',
						order: 1,
						in_list_view: true,
						in_standard_filter: true,
						in_global_search: true,
						print_hide: false,
						export_hide: false,
						import_hide: false,
						report_hide: false,
						permlevel: 0,
						depends_on: '',
						label_depends_on: '',
						mandatory_depends_on: '',
						read_only_depends_on: '',
						hidden_depends_on: '',
						validate: '',
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
					}
				],
				permissions: [
					{
						role: 'System Manager',
						read: true,
						write: true,
						create: true,
						delete: true,
						submit: true,
						cancel: true,
						amend: true,
						report: true,
						export: true,
						import: true,
						share: true,
						print: true,
						email: true,
						select: true,
						permlevel: 0,
						if_owner: false,
						apply_to_all: true,
						condition: '',
						description: 'Full permission'
					}
				],
				indexes: [
					{
						name: 'idx_title',
						columns: ['title'],
						unique: true,
						type: 'btree'
					}
				],
				actions: [
					{
						label: 'Submit',
						action_type: 'Server Action',
						action: 'submit_doc',
						group: 'Actions',
						hidden: false,
						condition: '',
						order: 1,
						is_standard: true
					}
				],
				links: [
					{
						group: 'Related',
						link_doctype: 'RelatedDoc',
						link_fieldname: 'related_doc',
						parent_doctype: 'TestDocType',
						label: 'Related Document',
						hidden: false,
						condition: '',
						order: 1
					}
				]
			};
			
			expect(() => MetaFactory.create(complexDocType)).not.toThrow();
			const meta = MetaFactory.create(complexDocType);
			expect(meta).toBeInstanceOf(DocTypeMeta);
			expect(meta.has_field('title')).toBe(true);
		});

		it('should handle concurrent creation requests', async () => {
			await engine.registerDocType(sampleDocType);
			
			// Make concurrent requests
			const promises = Array(10).fill(0).map(() => 
				MetaFactory.createFromName('TestDocType', engine)
			);
			const results = await Promise.all(promises);
			
			// All should return valid instances
			for (const meta of results) {
				expect(meta).toBeInstanceOf(DocTypeMeta);
				expect(meta?.get_doctype().name).toBe('TestDocType');
			}
		});
	});
});