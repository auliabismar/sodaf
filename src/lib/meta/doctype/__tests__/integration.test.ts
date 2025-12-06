/**
 * Integration Tests for DocType JSON Parser and DocTypeEngine
 * 
 * Tests the complete workflow:
 * 1. Create a DocType
 * 2. Serialize it to JSON
 * 3. Parse it back from JSON
 * 4. Register with DocTypeEngine
 * 5. Validate the final result
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';

import { DocTypeJSONParser } from '../json-parser';
import { DocTypeEngine } from '../doctype-engine';
import type { DocType } from '../types';

import {
	createTempDir,
	cleanupTempDir,
	writeTempFile,
	readFileContent,
	fileExists
} from './helpers/file-utils';

describe('DocType JSON Parser and DocTypeEngine Integration', () => {
	let tempDir: string;
	let engine: DocTypeEngine;

	beforeEach(async () => {
		tempDir = await createTempDir();
		DocTypeEngine.resetInstance();
		engine = DocTypeEngine.getInstance();
	});

	afterEach(async () => {
		await cleanupTempDir(tempDir);
	});

	describe('Complete Workflow Integration', () => {
		it('should complete full workflow: create → serialize → parse → register → validate', async () => {
			// Step 1: Create a comprehensive DocType
			const originalDocType: DocType = {
				name: 'IntegrationTestDocType',
				module: 'TestModule',
				issingle: false,
				istable: false,
				is_submittable: true,
				is_tree: false,
				is_virtual: false,
				autoname: 'INT-.#####',
				naming_series: 'INT-.#####',
				title_field: 'name',
				image_field: 'image',
				search_fields: 'name,status',
				keyword_fields: 'name,description',
				default_sort_order: 'modified desc',
				max_attachments: 5,
				track_changes: true,
				track_seen: false,
				track_visits: false,
				show_in_global_search: true,
				allow_auto_repeat: false,
				allow_events: true,
				allow_import: true,
				allow_rename: true,
				engine: 'InnoDB',
				table_name: 'tab_integration_test',
				subject_field: 'subject',
				sender_field: 'sender',
				email_template: 'Test Template',
				timeline_fields: 'status,modified_by',
				grid_view_fields: 'name,status,modified',
				list_view_settings: {
					add_row: true,
					get_report: true
				},
				fields: [
					{
						fieldname: 'name',
						label: 'Name',
						fieldtype: 'Data',
						required: true,
						unique: true,
						length: 100,
						in_list_view: true,
						in_standard_filter: true,
						in_global_search: true,
						search_index: true
					},
					{
						fieldname: 'status',
						label: 'Status',
						fieldtype: 'Select',
						options: 'Draft\nSubmitted\nCancelled',
						default: 'Draft',
						required: true,
						in_list_view: true,
						in_standard_filter: true
					},
					{
						fieldname: 'description',
						label: 'Description',
						fieldtype: 'Long Text',
						length: 1000,
						description: 'Detailed description'
					},
					{
						fieldname: 'customer',
						label: 'Customer',
						fieldtype: 'Link',
						options: 'Customer',
						filters: '{"status": "Active"}',
						fetch_from: 'customer.name'
					},
					{
						fieldname: 'items',
						label: 'Items',
						fieldtype: 'Table',
						options: 'IntegrationTestItem'
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
						condition: 'doc.status !== "Submitted"',
						description: 'Full access for system managers'
					},
					{
						role: 'Manager',
						read: true,
						write: true,
						create: true,
						delete: false,
						submit: true,
						cancel: true,
						amend: false,
						report: true,
						export: true,
						import: false,
						share: false,
						print: true,
						email: true,
						select: true,
						permlevel: 0,
						if_owner: false,
						apply_to_all: true,
						condition: 'doc.owner === frappe.session.user',
						description: 'Manager access with restrictions'
					},
					{
						role: 'User',
						read: true,
						write: false,
						create: false,
						delete: false,
						submit: false,
						cancel: false,
						amend: false,
						report: true,
						export: false,
						import: false,
						share: false,
						print: true,
						email: false,
						select: true,
						permlevel: 0,
						if_owner: true,
						apply_to_all: false,
						condition: 'doc.owner === frappe.session.user',
						description: 'User can only read their own documents'
					}
				],
				indexes: [
					{
						name: 'idx_name',
						columns: ['name'],
						unique: true,
						type: 'btree'
					},
					{
						name: 'idx_status_modified',
						columns: ['status', 'modified'],
						unique: false,
						type: 'btree',
						where: 'status != \'Deleted\''
					},
					{
						name: 'idx_customer',
						columns: ['customer'],
						unique: false,
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
						condition: 'doc.status === "Draft"',
						order: 10,
						is_standard: true
					},
					{
						label: 'Cancel',
						action_type: 'Server Action',
						action: 'cancel_doc',
						group: 'Actions',
						hidden: false,
						condition: 'doc.status === "Submitted"',
						order: 20,
						is_standard: true
					}
				],
				links: [
					{
						group: 'Related Documents',
						link_doctype: 'IntegrationTestItem',
						link_fieldname: 'parent',
						parent_doctype: 'IntegrationTestDocType',
						label: 'Items',
						hidden: false,
						condition: 'doc.status !== "Deleted"',
						order: 10
					}
				]
			};

			// Step 2: Serialize it to JSON
			const jsonString = DocTypeJSONParser.serializeDocType(originalDocType);
			expect(jsonString).toBeDefined();
			expect(typeof jsonString).toBe('string');

			// Verify it's valid JSON
			const parsedFromJson = JSON.parse(jsonString);
			expect(parsedFromJson.name).toBe('IntegrationTestDocType');

			// Step 3: Parse it back from JSON
			const parsedDocType = DocTypeJSONParser.parseDocTypeJSON(jsonString);
			expect(parsedDocType).toBeDefined();
			expect(parsedDocType.name).toBe(originalDocType.name);
			expect(parsedDocType.module).toBe(originalDocType.module);

			// Verify all complex properties are preserved
			expect(parsedDocType.fields).toHaveLength(originalDocType.fields.length);
			expect(parsedDocType.permissions).toHaveLength(originalDocType.permissions.length);
			expect(parsedDocType.indexes).toHaveLength(originalDocType.indexes?.length || 0);
			expect(parsedDocType.actions).toHaveLength(originalDocType.actions?.length || 0);
			expect(parsedDocType.links).toHaveLength(originalDocType.links?.length || 0);

			// Step 4: Register with DocTypeEngine
			await engine.registerDocType(parsedDocType);
			
			// Verify it's registered
			const isRegistered = await engine.isRegistered('IntegrationTestDocType');
			expect(isRegistered).toBe(true);

			// Step 5: Retrieve from DocTypeEngine
			const retrievedDocType = await engine.getDocType('IntegrationTestDocType');
			expect(retrievedDocType).toBeDefined();
			expect(retrievedDocType?.name).toBe('IntegrationTestDocType');
			expect(retrievedDocType?.module).toBe('TestModule');

			// Step 6: Validate the final result
			const validationResult = await engine.validateDocType(retrievedDocType!);
			expect(validationResult.valid).toBe(true);
			expect(validationResult.errors).toHaveLength(0);

			// Verify data integrity throughout the process
			expect(retrievedDocType?.issingle).toBe(originalDocType.issingle);
			expect(retrievedDocType?.is_submittable).toBe(originalDocType.is_submittable);
			expect(retrievedDocType?.autoname).toBe(originalDocType.autoname);
			expect(retrievedDocType?.title_field).toBe(originalDocType.title_field);
			expect(retrievedDocType?.max_attachments).toBe(originalDocType.max_attachments);

			// Verify complex field properties
			const nameField = retrievedDocType?.fields.find(f => f.fieldname === 'name');
			expect(nameField?.required).toBe(true);
			expect(nameField?.unique).toBe(true);
			expect(nameField?.length).toBe(100);

			const statusField = retrievedDocType?.fields.find(f => f.fieldname === 'status');
			expect(statusField?.options).toBe('Draft\nSubmitted\nCancelled');
			expect(statusField?.default).toBe('Draft');

			const customerField = retrievedDocType?.fields.find(f => f.fieldname === 'customer');
			expect(customerField?.fieldtype).toBe('Link');
			expect(customerField?.options).toBe('Customer');
			expect(customerField?.filters).toBe('{"status": "Active"}');

			// Verify permission properties
			const sysManagerPerm = retrievedDocType?.permissions.find(p => p.role === 'System Manager');
			expect(sysManagerPerm?.read).toBe(true);
			expect(sysManagerPerm?.write).toBe(true);
			expect(sysManagerPerm?.delete).toBe(true);
			expect(sysManagerPerm?.condition).toBe('doc.status !== "Submitted"');

			// Verify index properties
			const nameIndex = retrievedDocType?.indexes?.find(i => i.name === 'idx_name');
			expect(nameIndex?.columns).toEqual(['name']);
			expect(nameIndex?.unique).toBe(true);
			expect(nameIndex?.type).toBe('btree');

			// Verify action properties
			const submitAction = retrievedDocType?.actions?.find(a => a.label === 'Submit');
			expect(submitAction?.action_type).toBe('Server Action');
			expect(submitAction?.action).toBe('submit_doc');
			expect(submitAction?.condition).toBe('doc.status === "Draft"');

			// Verify link properties
			const itemsLink = retrievedDocType?.links?.find(l => l.link_doctype === 'IntegrationTestItem');
			expect(itemsLink?.group).toBe('Related Documents');
			expect(itemsLink?.link_fieldname).toBe('parent');
			expect(itemsLink?.label).toBe('Items');
		});

		it('should handle file-based workflow: save → load → register → retrieve', async () => {
			// Create a simple DocType
			const doctype: DocType = {
				name: 'FileWorkflowDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'name',
						label: 'Name',
						fieldtype: 'Data',
						required: true
					},
					{
						fieldname: 'email',
						label: 'Email',
						fieldtype: 'Data',
						length: 255
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

			// Step 1: Save to file
			const filePath = path.join(tempDir, 'file-workflow-doctype.json');
			await DocTypeJSONParser.saveDocTypeToFile(doctype, filePath);

			// Verify file was created
			const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
			expect(fileExists).toBe(true);

			// Step 2: Load from file
			const loadedDocType = await DocTypeJSONParser.loadDocTypeFromFile(filePath);
			expect(loadedDocType.name).toBe('FileWorkflowDocType');
			expect(loadedDocType.fields).toHaveLength(2);

			// Step 3: Register with engine
			await engine.registerDocType(loadedDocType);

			// Step 4: Retrieve from engine
			const retrieved = await engine.getDocType('FileWorkflowDocType');
			expect(retrieved).toBeDefined();
			expect(retrieved?.name).toBe('FileWorkflowDocType');
			expect(retrieved?.fields).toHaveLength(2);

			// Step 5: Validate
			const validation = await engine.validateDocType(retrieved!);
			expect(validation.valid).toBe(true);
		});

		it('should handle batch loading from directory', async () => {
			// Create multiple DocType files
			const doctype1 = {
				name: 'BatchDocType1',
				module: 'TestModule',
				fields: [],
				permissions: [
					{
						role: 'System Manager',
						read: true
					}
				]
			};

			const doctype2 = {
				name: 'BatchDocType2',
				module: 'TestModule',
				fields: [],
				permissions: [
					{
						role: 'System Manager',
						read: true
					}
				]
			};

			// Write files to directory
			await writeTempFile(tempDir, 'batch1.json', JSON.stringify(doctype1));
			await writeTempFile(tempDir, 'batch2.json', JSON.stringify(doctype2));
			await writeTempFile(tempDir, 'readme.txt', 'This is not a JSON file');

			// Load all DocTypes from directory
			const loadedDocTypes = await DocTypeJSONParser.loadAllDocTypesFromDir(tempDir);
			expect(loadedDocTypes).toHaveLength(2);

			// Register all with engine
			for (const doctype of loadedDocTypes) {
				await engine.registerDocType(doctype);
			}

			// Verify all are registered
			const isRegistered1 = await engine.isRegistered('BatchDocType1');
			const isRegistered2 = await engine.isRegistered('BatchDocType2');
			expect(isRegistered1).toBe(true);
			expect(isRegistered2).toBe(true);

			// Verify module count
			const moduleCount = await engine.getDocTypeCountByModule('TestModule');
			expect(moduleCount).toBe(2);

			// Verify all modules
			const allModules = await engine.getAllModules();
			expect(allModules).toContain('TestModule');
		});

		it('should handle error propagation correctly', async () => {
			// Test invalid JSON
			expect(() => {
				DocTypeJSONParser.parseDocTypeJSON('invalid json');
			}).toThrow();

			// Test invalid DocType
			const invalidDocType = {
				name: '',  // Invalid empty name
				module: 'TestModule',
				fields: [],
				permissions: []
			} as DocType;

			expect(() => {
				DocTypeJSONParser.serializeDocType(invalidDocType);
			}).toThrow();

			// Test registration of invalid DocType
			const validDocType = {
				name: 'ValidDocType',
				module: 'TestModule',
				fields: [],
				permissions: [
					{
						role: 'System Manager',
						read: true
					}
				]
			};

			await engine.registerDocType(validDocType);

			// Test duplicate registration
			await expect(
				engine.registerDocType(validDocType)
			).rejects.toThrow('DocType \'ValidDocType\' already exists');

			// Test retrieval of non-existent DocType
			const nonExistent = await engine.getDocType('NonExistentDocType');
			expect(nonExistent).toBeNull();
		});
	});

	describe('Data Integrity Verification', () => {
		it('should preserve all DocType properties through round-trip', async () => {
			// Create a DocType with all possible properties
			const originalDocType: DocType = {
				name: 'RoundTripDocType',
				module: 'TestModule',
				issingle: true,
				istable: false,
				is_submittable: true,
				is_tree: false,
				is_virtual: false,
				autoname: 'RT-.#####',
				naming_series: 'RT-.#####',
				title_field: 'title',
				image_field: 'image',
				search_fields: 'title,status',
				keyword_fields: 'title,description',
				default_sort_order: 'modified desc',
				max_attachments: 10,
				track_changes: false,
				track_seen: true,
				track_visits: true,
				show_in_global_search: false,
				allow_auto_repeat: true,
				allow_events: false,
				allow_import: false,
				allow_rename: false,
				engine: 'MyISAM',
				table_name: 'custom_table_name',
				subject_field: 'subject',
				sender_field: 'sender',
				email_template: 'Custom Template',
				timeline_fields: 'status,modified',
				grid_view_fields: 'title,status',
				quick_entry_fields: 'title,description',
				print_heading: 'Custom Print Heading',
				custom_css: '.custom { color: red; }',
				custom_js: 'console.log("custom");',
				custom_html: '<div>Custom HTML</div>',
				fields: [
					{
						fieldname: 'title',
						label: 'Title',
						fieldtype: 'Data',
						required: true,
						unique: true,
						length: 200,
						description: 'Document title',
						comment: 'Enter a descriptive title'
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
						description: 'Full system access'
					}
				],
				indexes: [
					{
						name: 'idx_title',
						columns: ['title'],
						unique: true,
						type: 'hash'
					}
				],
				actions: [
					{
						label: 'Custom Action',
						action_type: 'Client Action',
						action: 'custom_action',
						group: 'Custom',
						hidden: false,
						condition: 'doc.status === "Draft"',
						order: 100,
						is_standard: false
					}
				],
				links: [
					{
						group: 'Custom Links',
						link_doctype: 'RelatedDocType',
						link_fieldname: 'reference',
						parent_doctype: 'RoundTripDocType',
						label: 'Related Documents',
						hidden: false,
						condition: 'doc.status !== "Deleted"',
						order: 10
					}
				]
			};

			// Serialize and parse
			const jsonString = DocTypeJSONParser.serializeDocType(originalDocType);
			const parsedDocType = DocTypeJSONParser.parseDocTypeJSON(jsonString);

			// Register and retrieve
			await engine.registerDocType(parsedDocType);
			const retrievedDocType = await engine.getDocType('RoundTripDocType');

			// Verify all properties are preserved
			expect(retrievedDocType?.name).toBe(originalDocType.name);
			expect(retrievedDocType?.module).toBe(originalDocType.module);
			expect(retrievedDocType?.issingle).toBe(originalDocType.issingle);
			expect(retrievedDocType?.istable).toBe(originalDocType.istable);
			expect(retrievedDocType?.is_submittable).toBe(originalDocType.is_submittable);
			expect(retrievedDocType?.is_tree).toBe(originalDocType.is_tree);
			expect(retrievedDocType?.is_virtual).toBe(originalDocType.is_virtual);
			expect(retrievedDocType?.autoname).toBe(originalDocType.autoname);
			expect(retrievedDocType?.naming_series).toBe(originalDocType.naming_series);
			expect(retrievedDocType?.title_field).toBe(originalDocType.title_field);
			expect(retrievedDocType?.image_field).toBe(originalDocType.image_field);
			expect(retrievedDocType?.search_fields).toBe(originalDocType.search_fields);
			expect(retrievedDocType?.keyword_fields).toBe(originalDocType.keyword_fields);
			expect(retrievedDocType?.default_sort_order).toBe(originalDocType.default_sort_order);
			expect(retrievedDocType?.max_attachments).toBe(originalDocType.max_attachments);
			expect(retrievedDocType?.track_changes).toBe(originalDocType.track_changes);
			expect(retrievedDocType?.track_seen).toBe(originalDocType.track_seen);
			expect(retrievedDocType?.track_visits).toBe(originalDocType.track_visits);
			expect(retrievedDocType?.show_in_global_search).toBe(originalDocType.show_in_global_search);
			expect(retrievedDocType?.allow_auto_repeat).toBe(originalDocType.allow_auto_repeat);
			expect(retrievedDocType?.allow_events).toBe(originalDocType.allow_events);
			expect(retrievedDocType?.allow_import).toBe(originalDocType.allow_import);
			expect(retrievedDocType?.allow_rename).toBe(originalDocType.allow_rename);
			expect(retrievedDocType?.engine).toBe(originalDocType.engine);
			expect(retrievedDocType?.table_name).toBe(originalDocType.table_name);
			expect(retrievedDocType?.subject_field).toBe(originalDocType.subject_field);
			expect(retrievedDocType?.sender_field).toBe(originalDocType.sender_field);
			expect(retrievedDocType?.email_template).toBe(originalDocType.email_template);
			expect(retrievedDocType?.timeline_fields).toBe(originalDocType.timeline_fields);
			expect(retrievedDocType?.grid_view_fields).toBe(originalDocType.grid_view_fields);
			expect(retrievedDocType?.quick_entry_fields).toBe(originalDocType.quick_entry_fields);
			expect(retrievedDocType?.print_heading).toBe(originalDocType.print_heading);
			expect(retrievedDocType?.custom_css).toBe(originalDocType.custom_css);
			expect(retrievedDocType?.custom_js).toBe(originalDocType.custom_js);
			expect(retrievedDocType?.custom_html).toBe(originalDocType.custom_html);
		});
	});
});