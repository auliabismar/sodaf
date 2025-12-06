/**
 * DocType JSON Parser Tests
 * 
 * Comprehensive test suite for the DocType JSON parser implementation
 * covering all 14 test cases from the backlog P2-003.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';

import { DocTypeJSONParser } from '../json-parser';
import {
	JSONParseError,
	FileNotFoundError,
	FileIOError,
	SerializationError
} from '../json-parser-errors';
import { DocTypeValidationError } from '../errors';
import type { DocType } from '../types';

import {
	createTempDir,
	cleanupTempDir,
	writeTempFile,
	readFileContent,
	fileExists,
	getFileStats,
	listFiles,
	filterByExtension
} from './helpers/file-utils';

describe('DocTypeJSONParser', () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await createTempDir();
	});

	afterEach(async () => {
		await cleanupTempDir(tempDir);
	});

	describe('P2-003-T1: parseDocTypeJSON valid - Returns DocType object', () => {
		it('should parse a valid minimal DocType JSON', () => {
			const validJson = `{
				"name": "TestDocType",
				"module": "TestModule",
				"fields": [
					{
						"fieldname": "name",
						"label": "Name",
						"fieldtype": "Data",
						"required": true
					}
				],
				"permissions": [
					{
						"role": "System Manager",
						"read": true,
						"write": true,
						"create": true,
						"delete": true
					}
				]
			}`;

			const result = DocTypeJSONParser.parseDocTypeJSON(validJson);

			expect(result).toBeDefined();
			expect(result.name).toBe('TestDocType');
			expect(result.module).toBe('TestModule');
			expect(result.fields).toHaveLength(1);
			expect(result.permissions).toHaveLength(1);
			expect(result.fields[0].fieldname).toBe('name');
			expect(result.permissions[0].role).toBe('System Manager');
		});
	});

	describe('P2-003-T2: Parse with all properties - All properties correctly parsed', () => {
		it('should parse a comprehensive DocType with all properties', () => {
			const comprehensiveJson = `{
				"name": "ComprehensiveDocType",
				"module": "TestModule",
				"issingle": false,
				"istable": false,
				"is_submittable": true,
				"is_tree": false,
				"is_virtual": false,
				"autoname": "COMP-.#####",
				"naming_series": "COMP-.#####",
				"title_field": "name",
				"image_field": "image",
				"search_fields": "name,status",
				"keyword_fields": "name,description",
				"default_sort_order": "modified desc",
				"max_attachments": 5,
				"track_changes": true,
				"track_seen": false,
				"track_visits": false,
				"show_in_global_search": true,
				"allow_auto_repeat": false,
				"allow_events": true,
				"allow_import": true,
				"allow_rename": true,
				"engine": "InnoDB",
				"table_name": "tab_comprehensive_doctype",
				"subject_field": "subject",
				"sender_field": "sender",
				"email_template": "Test Template",
				"timeline_fields": "status,modified_by",
				"grid_view_fields": "name,status,modified",
				"list_view_settings": {
					"add_row": true,
					"get_report": true
				},
				"fields": [
					{
						"fieldname": "name",
						"label": "Name",
						"fieldtype": "Data",
						"required": true,
						"unique": true,
						"length": 100,
						"in_list_view": true,
						"in_standard_filter": true,
						"in_global_search": true,
						"search_index": true
					},
					{
						"fieldname": "status",
						"label": "Status",
						"fieldtype": "Select",
						"options": "Draft\\nSubmitted\\nCancelled",
						"default": "Draft",
						"required": true,
						"in_list_view": true,
						"in_standard_filter": true
					}
				],
				"permissions": [
					{
						"role": "System Manager",
						"read": true,
						"write": true,
						"create": true,
						"delete": true,
						"submit": true,
						"cancel": true,
						"amend": true,
						"report": true,
						"export": true,
						"import": true,
						"share": true,
						"print": true,
						"email": true,
						"select": true,
						"permlevel": 0,
						"if_owner": false,
						"apply_to_all": true,
						"condition": "doc.status !== \\"Submitted\\"",
						"description": "Full access for system managers"
					}
				],
				"indexes": [
					{
						"name": "idx_name",
						"columns": ["name"],
						"unique": true,
						"type": "btree"
					}
				],
				"actions": [
					{
						"label": "Submit",
						"action_type": "Server Action",
						"action": "submit_doc",
						"group": "Actions",
						"hidden": false,
						"condition": "doc.status === \\"Draft\\"",
						"order": 10,
						"is_standard": true
					}
				],
				"links": [
					{
						"group": "Related Documents",
						"link_doctype": "ChildDocType",
						"link_fieldname": "parent",
						"parent_doctype": "ComprehensiveDocType",
						"label": "Child Documents",
						"hidden": false,
						"condition": "doc.status !== \\"Deleted\\"",
						"order": 10
					}
				]
			}`;

			const result = DocTypeJSONParser.parseDocTypeJSON(comprehensiveJson);

			expect(result).toBeDefined();
			expect(result.name).toBe('ComprehensiveDocType');
			expect(result.module).toBe('TestModule');
			expect(result.issingle).toBe(false);
			expect(result.istable).toBe(false);
			expect(result.is_submittable).toBe(true);
			expect(result.autoname).toBe('COMP-.#####');
			expect(result.title_field).toBe('name');
			expect(result.image_field).toBe('image');
			expect(result.search_fields).toBe('name,status');
			expect(result.max_attachments).toBe(5);
			expect(result.track_changes).toBe(true);
			expect(result.track_seen).toBe(false);
			expect(result.track_visits).toBe(false);
			expect(result.show_in_global_search).toBe(true);
			expect(result.allow_auto_repeat).toBe(false);
			expect(result.allow_events).toBe(true);
			expect(result.allow_import).toBe(true);
			expect(result.allow_rename).toBe(true);
			expect(result.engine).toBe('InnoDB');
			expect(result.table_name).toBe('tab_comprehensive_doctype');
			
			expect(result.fields).toHaveLength(2);
			expect(result.permissions).toHaveLength(1);
			expect(result.indexes).toHaveLength(1);
			expect(result.actions).toHaveLength(1);
			expect(result.links).toHaveLength(1);
			
			// Check field properties
			const nameField = result.fields.find(f => f.fieldname === 'name');
			expect(nameField).toBeDefined();
			expect(nameField?.required).toBe(true);
			expect(nameField?.unique).toBe(true);
			expect(nameField?.length).toBe(100);
			expect(nameField?.in_list_view).toBe(true);
			expect(nameField?.in_standard_filter).toBe(true);
			expect(nameField?.in_global_search).toBe(true);
			expect(nameField?.search_index).toBe(true);
			
			const statusField = result.fields.find(f => f.fieldname === 'status');
			expect(statusField).toBeDefined();
			expect(statusField?.options).toBe('Draft\nSubmitted\nCancelled');
			expect(statusField?.default).toBe('Draft');
			
			// Check permission properties
			const perm = result.permissions[0];
			expect(perm.role).toBe('System Manager');
			expect(perm.read).toBe(true);
			expect(perm.write).toBe(true);
			expect(perm.create).toBe(true);
			expect(perm.delete).toBe(true);
			expect(perm.submit).toBe(true);
			expect(perm.cancel).toBe(true);
			expect(perm.amend).toBe(true);
			expect(perm.report).toBe(true);
			expect(perm.export).toBe(true);
			expect(perm.import).toBe(true);
			expect(perm.share).toBe(true);
			expect(perm.print).toBe(true);
			expect(perm.email).toBe(true);
			expect(perm.select).toBe(true);
			expect(perm.permlevel).toBe(0);
			expect(perm.if_owner).toBe(false);
			expect(perm.apply_to_all).toBe(true);
			expect(perm.condition).toBe('doc.status !== "Submitted"');
			expect(perm.description).toBe('Full access for system managers');
			
			// Check index properties
			const index = result.indexes?.[0];
			if (index) {
				expect(index.name).toBe('idx_name');
				expect(index.columns).toEqual(['name']);
				expect(index.unique).toBe(true);
				expect(index.type).toBe('btree');
			}
			
			// Check action properties
			const action = result.actions?.[0];
			if (action) {
				expect(action.label).toBe('Submit');
				expect(action.action_type).toBe('Server Action');
				expect(action.action).toBe('submit_doc');
				expect(action.group).toBe('Actions');
				expect(action.hidden).toBe(false);
				expect(action.condition).toBe('doc.status === "Draft"');
				expect(action.order).toBe(10);
				expect(action.is_standard).toBe(true);
			}
			
			// Check link properties
			const link = result.links?.[0];
			if (link) {
				expect(link.group).toBe('Related Documents');
				expect(link.link_doctype).toBe('ChildDocType');
				expect(link.link_fieldname).toBe('parent');
				expect(link.parent_doctype).toBe('ComprehensiveDocType');
				expect(link.label).toBe('Child Documents');
				expect(link.hidden).toBe(false);
				expect(link.condition).toBe('doc.status !== "Deleted"');
				expect(link.order).toBe(10);
			}
		});
	});

	describe('P2-003-T3: Parse with missing optional fields - Uses defaults for optional fields', () => {
		it('should apply defaults for missing optional DocType properties', () => {
			const minimalJson = `{
				"name": "MinimalDocType",
				"module": "TestModule",
				"fields": [
					{
						"fieldname": "name",
						"label": "Name",
						"fieldtype": "Data"
					}
				],
				"permissions": [
					{
						"role": "System Manager",
						"read": true
					}
				]
			}`;

			const result = DocTypeJSONParser.parseDocTypeJSON(minimalJson);

			// Check DocType defaults
			expect(result.issingle).toBe(false);
			expect(result.istable).toBe(false);
			expect(result.is_submittable).toBe(false);
			expect(result.is_tree).toBe(false);
			expect(result.is_virtual).toBe(false);
			expect(result.track_changes).toBe(true);
			expect(result.track_seen).toBe(false);
			expect(result.track_visits).toBe(false);
			expect(result.show_in_global_search).toBe(true);
			expect(result.allow_auto_repeat).toBe(false);
			expect(result.allow_events).toBe(true);
			expect(result.allow_import).toBe(true);
			expect(result.allow_rename).toBe(true);
			expect(result.max_attachments).toBe(0);
			expect(result.fields).toBeDefined();
			expect(result.permissions).toBeDefined();
			expect(result.indexes).toEqual([]);
			expect(result.actions).toEqual([]);
			expect(result.links).toEqual([]);
			
			// Check field defaults
			const field = result.fields[0];
			expect(field.required).toBe(false);
			expect(field.unique).toBe(false);
			expect(field.hidden).toBe(false);
			expect(field.read_only).toBe(false);
			expect(field.indexed).toBe(false);
			expect(field.in_list_view).toBe(false);
			expect(field.in_standard_filter).toBe(false);
			expect(field.in_global_search).toBe(false);
			expect(field.print_hide).toBe(false);
			expect(field.export_hide).toBe(false);
			expect(field.import_hide).toBe(false);
			expect(field.report_hide).toBe(false);
			expect(field.permlevel).toBe(0);
			expect(field.allow_in_quick_entry).toBe(true);
			expect(field.translatable).toBe(false);
			expect(field.no_copy).toBe(false);
			expect(field.remember_last_selected).toBe(false);
			expect(field.bold).toBe(false);
			expect(field.deprecated).toBe(false);
			expect(field.search_index).toBe(false);
			expect(field.email_trigger).toBe(false);
			expect(field.timeline).toBe(false);
			expect(field.track_seen).toBe(false);
			expect(field.track_visits).toBe(false);
			expect(field.unique_across_doctypes).toBe(false);
			expect(field.ignore_user_permissions).toBe(false);
			expect(field.ignore_xss_filtered).toBe(false);
			expect(field.allow_on_submit).toBe(false);
			expect(field.collapsible).toBe(false);
			expect(field.set_user_permissions).toBe(false);
			expect(field.ignore_strict_user_permissions).toBe(false);
			
			// Check permission defaults
			const permission = result.permissions[0];
			expect(permission.read).toBe(true);
			expect(permission.write).toBe(false);
			expect(permission.create).toBe(false);
			expect(permission.delete).toBe(false);
			expect(permission.submit).toBe(false);
			expect(permission.cancel).toBe(false);
			expect(permission.amend).toBe(false);
			expect(permission.report).toBe(true);
			expect(permission.export).toBe(true);
			expect(permission.import).toBe(true);
			expect(permission.share).toBe(false);
			expect(permission.print).toBe(true);
			expect(permission.email).toBe(true);
			expect(permission.select).toBe(true);
			expect(permission.permlevel).toBe(0);
			expect(permission.if_owner).toBe(false);
			expect(permission.apply_to_all).toBe(true);
		});
	});

	describe('P2-003-T4: Parse invalid JSON syntax - Throws JSONParseError', () => {
		it('should throw JSONParseError for invalid JSON syntax', () => {
			const invalidJson = `{
				"name": "InvalidJSON",
				"module": "TestModule",
				"fields": [
					{
						"fieldname": "name",
						"label": "Name",
						"fieldtype": "Data",
						"required": true,
					}
				],
				"permissions": [
					{
						"role": "System Manager",
						"read": true,
						"write": true,
						"create": true,
						"delete": true
					}
				]
			}`; // Missing closing brace

			expect(() => {
				DocTypeJSONParser.parseDocTypeJSON(invalidJson);
			}).toThrow(JSONParseError);
		});

		it('should provide detailed error information for JSON syntax errors', () => {
			const invalidJson = `{
				"name": "InvalidJSON",
				"module": "TestModule"
			`; // Missing closing brace and other properties

			try {
				DocTypeJSONParser.parseDocTypeJSON(invalidJson);
				expect.fail('Expected JSONParseError to be thrown');
			} catch (error) {
				expect(error).toBeInstanceOf(JSONParseError);
				const jsonError = error as JSONParseError;
				expect(jsonError.name).toBe('JSONParseError');
				expect(jsonError.message).toContain('Invalid JSON syntax');
				expect(jsonError.source).toBe(invalidJson);
			}
		});
	});

	describe('P2-003-T5: Parse missing required field - Throws ValidationError', () => {
		it('should throw DocTypeValidationError when name is missing', () => {
			const invalidJson = `{
				"module": "TestModule",
				"fields": [],
				"permissions": []
			}`;

			expect(() => {
				DocTypeJSONParser.parseDocTypeJSON(invalidJson);
			}).toThrow(DocTypeValidationError);
		});

		it('should throw DocTypeValidationError when module is missing', () => {
			const invalidJson = `{
				"name": "TestDocType",
				"fields": [],
				"permissions": []
			}`;

			expect(() => {
				DocTypeJSONParser.parseDocTypeJSON(invalidJson);
			}).toThrow(DocTypeValidationError);
		});

		it('should throw DocTypeValidationError when fields is missing', () => {
			const invalidJson = `{
				"name": "TestDocType",
				"module": "TestModule",
				"permissions": []
			}`;

			expect(() => {
				DocTypeJSONParser.parseDocTypeJSON(invalidJson);
			}).toThrow(DocTypeValidationError);
		});

		it('should throw DocTypeValidationError when permissions is missing', () => {
			const invalidJson = `{
				"name": "TestDocType",
				"module": "TestModule",
				"fields": []
			}`;

			expect(() => {
				DocTypeJSONParser.parseDocTypeJSON(invalidJson);
			}).toThrow(DocTypeValidationError);
		});

		it('should provide detailed validation error information', () => {
			const invalidJson = `{
				"module": "TestModule",
				"fields": [],
				"permissions": []
			}`;

			try {
				DocTypeJSONParser.parseDocTypeJSON(invalidJson);
				expect.fail('Expected DocTypeValidationError to be thrown');
			} catch (error) {
				expect(error).toBeInstanceOf(DocTypeValidationError);
				const validationError = error as DocTypeValidationError;
				expect(validationError.name).toBe('DocTypeValidationError');
				expect(validationError.validationErrors).toBeDefined();
				expect(validationError.validationErrors.length).toBeGreaterThan(0);
				
				const nameError = validationError.validationErrors.find(e => e.field === 'name');
				expect(nameError).toBeDefined();
				expect(nameError?.type).toBe('required');
				expect(nameError?.severity).toBe('error');
			}
		});
	});

	describe('P2-003-T6: serializeDocType(doctype) - Returns formatted JSON string', () => {
		it('should serialize a DocType to formatted JSON string', () => {
			const doctype: DocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'name',
						label: 'Name',
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

			const jsonString = DocTypeJSONParser.serializeDocType(doctype);

			expect(jsonString).toBeDefined();
			expect(typeof jsonString).toBe('string');
			
			// Check that it's valid JSON
			const parsed = JSON.parse(jsonString);
			expect(parsed.name).toBe('TestDocType');
			expect(parsed.module).toBe('TestModule');
			expect(parsed.fields).toHaveLength(1);
			expect(parsed.permissions).toHaveLength(1);
			
			// Check formatting (should be indented with 2 spaces)
			const lines = jsonString.split('\n');
			expect(lines.length).toBeGreaterThan(1);
			expect(lines[1]).toMatch(/^  /); // Second line should start with 2 spaces
		});

		it('should throw DocTypeValidationError for invalid DocType', () => {
			const invalidDoctype = {
				name: '',
				module: '',
				fields: [],
				permissions: []
			} as DocType;

			expect(() => {
				DocTypeJSONParser.serializeDocType(invalidDoctype);
			}).toThrow(DocTypeValidationError);
		});
	});

	describe('P2-003-T7: Round-trip parse/serialize - Object unchanged', () => {
		it('should maintain object integrity through parse/serialize round-trip', () => {
			const originalJson = `{
				"name": "RoundTripDocType",
				"module": "TestModule",
				"issingle": false,
				"istable": false,
				"is_submittable": true,
				"autoname": "RT-.#####",
				"title_field": "name",
				"search_fields": "name,status",
				"track_changes": true,
				"allow_import": true,
				"allow_rename": true,
				"fields": [
					{
						"fieldname": "name",
						"label": "Name",
						"fieldtype": "Data",
						"required": true,
						"unique": true,
						"length": 100,
						"in_list_view": true,
						"search_index": true
					},
					{
						"fieldname": "status",
						"label": "Status",
						"fieldtype": "Select",
						"options": "Draft\\nSubmitted\\nCancelled",
						"default": "Draft",
						"required": true,
						"in_list_view": true,
						"in_standard_filter": true
					},
					{
						"fieldname": "description",
						"label": "Description",
						"fieldtype": "Long Text",
						"length": 1000,
						"description": "Detailed description"
					}
				],
				"permissions": [
					{
						"role": "System Manager",
						"read": true,
						"write": true,
						"create": true,
						"delete": true,
						"submit": true,
						"cancel": true,
						"permlevel": 0,
						"apply_to_all": true
					},
					{
						"role": "All",
						"read": true,
						"permlevel": 0,
						"apply_to_all": true
					}
				],
				"indexes": [
					{
						"name": "idx_name",
						"columns": ["name"],
						"unique": true,
						"type": "btree"
					},
					{
						"name": "idx_status",
						"columns": ["status"],
						"unique": false
					}
				],
				"actions": [
					{
						"label": "Submit",
						"action_type": "Server Action",
						"action": "submit_doc",
						"condition": "doc.status === \\"Draft\\"",
						"order": 10
					}
				],
				"links": [
					{
						"group": "Related",
						"link_doctype": "ChildDocType",
						"link_fieldname": "parent",
						"label": "Child Documents"
					}
				]
			}`;

			// Parse the original JSON
			const parsed1 = DocTypeJSONParser.parseDocTypeJSON(originalJson);
			
			// Serialize it back to JSON
			const serialized = DocTypeJSONParser.serializeDocType(parsed1);
			
			// Parse the serialized JSON
			const parsed2 = DocTypeJSONParser.parseDocTypeJSON(serialized);

			// Compare the two parsed objects
			expect(parsed2.name).toBe(parsed1.name);
			expect(parsed2.module).toBe(parsed1.module);
			expect(parsed2.issingle).toBe(parsed1.issingle);
			expect(parsed2.istable).toBe(parsed1.istable);
			expect(parsed2.is_submittable).toBe(parsed1.is_submittable);
			expect(parsed2.autoname).toBe(parsed1.autoname);
			expect(parsed2.title_field).toBe(parsed1.title_field);
			expect(parsed2.search_fields).toBe(parsed1.search_fields);
			expect(parsed2.track_changes).toBe(parsed1.track_changes);
			expect(parsed2.allow_import).toBe(parsed1.allow_import);
			expect(parsed2.allow_rename).toBe(parsed1.allow_rename);
			
			expect(parsed2.fields).toHaveLength(parsed1.fields.length);
			for (let i = 0; i < parsed1.fields.length; i++) {
				expect(parsed2.fields[i].fieldname).toBe(parsed1.fields[i].fieldname);
				expect(parsed2.fields[i].label).toBe(parsed1.fields[i].label);
				expect(parsed2.fields[i].fieldtype).toBe(parsed1.fields[i].fieldtype);
				expect(parsed2.fields[i].required).toBe(parsed1.fields[i].required);
				expect(parsed2.fields[i].unique).toBe(parsed1.fields[i].unique);
				expect(parsed2.fields[i].length).toBe(parsed1.fields[i].length);
				expect(parsed2.fields[i].in_list_view).toBe(parsed1.fields[i].in_list_view);
				expect(parsed2.fields[i].search_index).toBe(parsed1.fields[i].search_index);
				expect(parsed2.fields[i].options).toBe(parsed1.fields[i].options);
				expect(parsed2.fields[i].default).toBe(parsed1.fields[i].default);
				expect(parsed2.fields[i].description).toBe(parsed1.fields[i].description);
			}
			
			expect(parsed2.permissions).toHaveLength(parsed1.permissions.length);
			for (let i = 0; i < parsed1.permissions.length; i++) {
				expect(parsed2.permissions[i].role).toBe(parsed1.permissions[i].role);
				expect(parsed2.permissions[i].read).toBe(parsed1.permissions[i].read);
				expect(parsed2.permissions[i].write).toBe(parsed1.permissions[i].write);
				expect(parsed2.permissions[i].create).toBe(parsed1.permissions[i].create);
				expect(parsed2.permissions[i].delete).toBe(parsed1.permissions[i].delete);
				expect(parsed2.permissions[i].submit).toBe(parsed1.permissions[i].submit);
				expect(parsed2.permissions[i].cancel).toBe(parsed1.permissions[i].cancel);
				expect(parsed2.permissions[i].permlevel).toBe(parsed1.permissions[i].permlevel);
				expect(parsed2.permissions[i].apply_to_all).toBe(parsed1.permissions[i].apply_to_all);
			}
			
			expect(parsed2.indexes?.length).toBe(parsed1.indexes?.length || 0);
			if (parsed1.indexes && parsed2.indexes) {
				for (let i = 0; i < parsed1.indexes.length; i++) {
					expect(parsed2.indexes[i].name).toBe(parsed1.indexes[i].name);
					expect(parsed2.indexes[i].columns).toEqual(parsed1.indexes[i].columns);
					expect(parsed2.indexes[i].unique).toBe(parsed1.indexes[i].unique);
					expect(parsed2.indexes[i].type).toBe(parsed1.indexes[i].type);
				}
			}
			
			expect(parsed2.actions?.length).toBe(parsed1.actions?.length || 0);
			if (parsed1.actions && parsed2.actions) {
				for (let i = 0; i < parsed1.actions.length; i++) {
					expect(parsed2.actions[i].label).toBe(parsed1.actions[i].label);
					expect(parsed2.actions[i].action_type).toBe(parsed1.actions[i].action_type);
					expect(parsed2.actions[i].action).toBe(parsed1.actions[i].action);
					expect(parsed2.actions[i].condition).toBe(parsed1.actions[i].condition);
					expect(parsed2.actions[i].order).toBe(parsed1.actions[i].order);
				}
			}
			
			expect(parsed2.links?.length).toBe(parsed1.links?.length || 0);
			if (parsed1.links && parsed2.links) {
				for (let i = 0; i < parsed1.links.length; i++) {
					expect(parsed2.links[i].group).toBe(parsed1.links[i].group);
					expect(parsed2.links[i].link_doctype).toBe(parsed1.links[i].link_doctype);
					expect(parsed2.links[i].link_fieldname).toBe(parsed1.links[i].link_fieldname);
					expect(parsed2.links[i].label).toBe(parsed1.links[i].label);
				}
			}
		});
	});

	describe('P2-003-T8: loadDocTypeFromFile(path) - Reads and parses file', () => {
		it('should load and parse a DocType from a file', async () => {
			const validJson = `{
				"name": "FileDocType",
				"module": "TestModule",
				"fields": [
					{
						"fieldname": "name",
						"label": "Name",
						"fieldtype": "Data",
						"required": true
					}
				],
				"permissions": [
					{
						"role": "System Manager",
						"read": true,
						"write": true,
						"create": true,
						"delete": true
					}
				]
			}`;

			const filePath = await writeTempFile(tempDir, 'test-doctype.json', validJson);
			const result = await DocTypeJSONParser.loadDocTypeFromFile(filePath);

			expect(result).toBeDefined();
			expect(result.name).toBe('FileDocType');
			expect(result.module).toBe('TestModule');
			expect(result.fields).toHaveLength(1);
			expect(result.permissions).toHaveLength(1);
		});
	});

	describe('P2-003-T9: loadDocTypeFromFile not found - Throws FileNotFoundError', () => {
		it('should throw FileNotFoundError when file does not exist', async () => {
			const nonExistentPath = path.join(tempDir, 'non-existent.json');

			await expect(
				DocTypeJSONParser.loadDocTypeFromFile(nonExistentPath)
			).rejects.toThrow(FileNotFoundError);
		});

		it('should provide detailed error information for file not found', async () => {
			const nonExistentPath = path.join(tempDir, 'non-existent.json');

			try {
				await DocTypeJSONParser.loadDocTypeFromFile(nonExistentPath);
				expect.fail('Expected FileNotFoundError to be thrown');
			} catch (error) {
				expect(error).toBeInstanceOf(FileNotFoundError);
				const fileError = error as FileNotFoundError;
				expect(fileError.name).toBe('FileNotFoundError');
				expect(fileError.filePath).toBe(nonExistentPath);
				expect(fileError.type).toBe('file');
			}
		});
	});

	describe('P2-003-T10: saveDocTypeToFile(doctype, path) - Writes formatted JSON', () => {
		it('should save a DocType to a file with formatted JSON', async () => {
			const doctype: DocType = {
				name: 'SaveDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'name',
						label: 'Name',
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

			const filePath = path.join(tempDir, 'saved-doctype.json');
			await DocTypeJSONParser.saveDocTypeToFile(doctype, filePath);

			// Check that file was created
			const exists = await fileExists(filePath);
			expect(exists).toBe(true);

			// Check file content
			const content = await readFileContent(filePath);
			expect(content).toBeDefined();
			expect(typeof content).toBe('string');

			// Parse the content to verify it's valid JSON
			const parsed = JSON.parse(content);
			expect(parsed.name).toBe('SaveDocType');
			expect(parsed.module).toBe('TestModule');
			expect(parsed.fields).toHaveLength(1);
			expect(parsed.permissions).toHaveLength(1);

			// Check formatting (should be indented with 2 spaces)
			const lines = content.split('\n');
			expect(lines.length).toBeGreaterThan(1);
			expect(lines[1]).toMatch(/^  /); // Second line should start with 2 spaces
		});

		it('should create directory structure if needed', async () => {
			const doctype: DocType = {
				name: 'NestedDocType',
				module: 'TestModule',
				fields: [],
				permissions: []
			};

			const filePath = path.join(tempDir, 'nested', 'dir', 'doctype.json');
			await DocTypeJSONParser.saveDocTypeToFile(doctype, filePath);

			// Check that file was created
			const exists = await fileExists(filePath);
			expect(exists).toBe(true);

			// Check file content
			const content = await readFileContent(filePath);
			const parsed = JSON.parse(content);
			expect(parsed.name).toBe('NestedDocType');
		});
	});

	describe('P2-003-T11: loadAllDocTypesFromDir(dir) - Returns all DocTypes from directory', () => {
		it('should load all DocTypes from a directory', async () => {
			// Create multiple DocType files
			const doctype1 = `{
				"name": "DocType1",
				"module": "TestModule",
				"fields": [],
				"permissions": []
			}`;

			const doctype2 = `{
				"name": "DocType2",
				"module": "TestModule",
				"fields": [],
				"permissions": []
			}`;

			const nonJsonFile = 'This is not a JSON file';

			await writeTempFile(tempDir, 'doctype1.json', doctype1);
			await writeTempFile(tempDir, 'doctype2.json', doctype2);
			await writeTempFile(tempDir, 'readme.txt', nonJsonFile);

			const results = await DocTypeJSONParser.loadAllDocTypesFromDir(tempDir);

			expect(results).toHaveLength(2);
			expect(results.some(d => d.name === 'DocType1')).toBe(true);
			expect(results.some(d => d.name === 'DocType2')).toBe(true);
		});

		it('should throw FileNotFoundError when directory does not exist', async () => {
			const nonExistentDir = path.join(tempDir, 'non-existent');

			await expect(
				DocTypeJSONParser.loadAllDocTypesFromDir(nonExistentDir)
			).rejects.toThrow(FileNotFoundError);
		});

		it('should throw FileNotFoundError when path is not a directory', async () => {
			const filePath = await writeTempFile(tempDir, 'not-a-dir.json', '{}');

			await expect(
				DocTypeJSONParser.loadAllDocTypesFromDir(filePath)
			).rejects.toThrow(FileNotFoundError);
		});

		it('should handle empty directory', async () => {
			const emptyDir = path.join(tempDir, 'empty');
			await fs.mkdir(emptyDir);

			const results = await DocTypeJSONParser.loadAllDocTypesFromDir(emptyDir);
			expect(results).toHaveLength(0);
		});
	});

	describe('P2-003-T12: Parse nested fields array - Fields correctly parsed', () => {
		it('should parse complex nested fields with all properties', () => {
			const nestedFieldsJson = `{
				"name": "NestedFieldsDocType",
				"module": "TestModule",
				"fields": [
					{
						"fieldname": "name",
						"label": "Name",
						"fieldtype": "Data",
						"required": true,
						"unique": true,
						"default": "Default Name",
						"length": 100,
						"precision": 2,
						"hidden": false,
						"read_only": false,
						"indexed": true,
						"description": "Name field description",
						"comment": "Name field comment",
						"order": 1,
						"in_list_view": true,
						"in_standard_filter": true,
						"in_global_search": true,
						"print_hide": false,
						"export_hide": false,
						"import_hide": false,
						"report_hide": false,
						"permlevel": 0,
						"depends_on": "other_field",
						"label_depends_on": "other_field",
						"mandatory_depends_on": "other_field",
						"read_only_depends_on": "other_field",
						"hidden_depends_on": "other_field",
						"validate": "return doc.name !== \\"\\"",
						"change": "console.log(\\"Field changed\\")",
						"filters": "{\\"status\\": \\"Active\\"}",
						"fetch_from": "other_doc.field_name",
						"fetch_if_empty": true,
						"allow_in_quick_entry": true,
						"translatable": false,
						"no_copy": false,
						"remember_last_selected": true,
						"bold": false,
						"deprecated": false,
						"precision_based_on": "currency",
						"width": "50%",
						"columns": "col1\\ncol2\\ncol3",
						"child_doctype": "ChildDocType",
						"image_field": "image",
						"search_index": true,
						"email_trigger": true,
						"timeline": true,
						"track_seen": true,
						"track_visits": true,
						"old_fieldname": "old_name",
						"unique_across_doctypes": true,
						"ignore_user_permissions": false,
						"ignore_xss_filtered": false,
						"allow_on_submit": false,
						"collapsible": false,
						"collapsible_depends_on": "show_details",
						"fetch_to_include": "related_field",
						"set_user_permissions": false,
						"ignore_strict_user_permissions": false,
						"table_fieldname": "table_field",
						"real_fieldname": "real_field"
					},
					{
						"fieldname": "section_break",
						"label": "Section Break",
						"fieldtype": "Section Break",
						"order": 2
					},
					{
						"fieldname": "link_field",
						"label": "Related Document",
						"fieldtype": "Link",
						"options": "OtherDocType",
						"filters": "{\\"status\\": \\"Active\\"}",
						"fetch_from": "other_doc.name",
						"order": 3
					},
					{
						"fieldname": "table_field",
						"label": "Child Table",
						"fieldtype": "Table",
						"options": "ChildDocType",
						"order": 4
					},
					{
						"fieldname": "select_field",
						"label": "Status",
						"fieldtype": "Select",
						"options": "Draft\\nSubmitted\\nCancelled",
						"default": "Draft",
						"required": true,
						"order": 5
					}
				],
				"permissions": [
					{
						"role": "System Manager",
						"read": true,
						"write": true,
						"create": true,
						"delete": true
					}
				]
			}`;

			const result = DocTypeJSONParser.parseDocTypeJSON(nestedFieldsJson);

			expect(result.fields).toHaveLength(5);

			// Check complex field
			const complexField = result.fields.find(f => f.fieldname === 'name');
			expect(complexField).toBeDefined();
			expect(complexField?.fieldname).toBe('name');
			expect(complexField?.label).toBe('Name');
			expect(complexField?.fieldtype).toBe('Data');
			expect(complexField?.required).toBe(true);
			expect(complexField?.unique).toBe(true);
			expect(complexField?.default).toBe('Default Name');
			expect(complexField?.length).toBe(100);
			expect(complexField?.precision).toBe(2);
			expect(complexField?.hidden).toBe(false);
			expect(complexField?.read_only).toBe(false);
			expect(complexField?.indexed).toBe(true);
			expect(complexField?.description).toBe('Name field description');
			expect(complexField?.comment).toBe('Name field comment');
			expect(complexField?.order).toBe(1);
			expect(complexField?.in_list_view).toBe(true);
			expect(complexField?.in_standard_filter).toBe(true);
			expect(complexField?.in_global_search).toBe(true);
			expect(complexField?.print_hide).toBe(false);
			expect(complexField?.export_hide).toBe(false);
			expect(complexField?.import_hide).toBe(false);
			expect(complexField?.report_hide).toBe(false);
			expect(complexField?.permlevel).toBe(0);
			expect(complexField?.depends_on).toBe('other_field');
			expect(complexField?.label_depends_on).toBe('other_field');
			expect(complexField?.mandatory_depends_on).toBe('other_field');
			expect(complexField?.read_only_depends_on).toBe('other_field');
			expect(complexField?.hidden_depends_on).toBe('other_field');
			expect(complexField?.validate).toBe('return doc.name !== ""');
			expect(complexField?.change).toBe('console.log("Field changed")');
			expect(complexField?.filters).toBe('{"status": "Active"}');
			expect(complexField?.fetch_from).toBe('other_doc.field_name');
			expect(complexField?.fetch_if_empty).toBe(true);
			expect(complexField?.allow_in_quick_entry).toBe(true);
			expect(complexField?.translatable).toBe(false);
			expect(complexField?.no_copy).toBe(false);
			expect(complexField?.remember_last_selected).toBe(true);
			expect(complexField?.bold).toBe(false);
			expect(complexField?.deprecated).toBe(false);
			expect(complexField?.precision_based_on).toBe('currency');
			expect(complexField?.width).toBe('50%');
			expect(complexField?.columns).toBe('col1\ncol2\ncol3');
			expect(complexField?.child_doctype).toBe('ChildDocType');
			expect(complexField?.image_field).toBe('image');
			expect(complexField?.search_index).toBe(true);
			expect(complexField?.email_trigger).toBe(true);
			expect(complexField?.timeline).toBe(true);
			expect(complexField?.track_seen).toBe(true);
			expect(complexField?.track_visits).toBe(true);
			expect(complexField?.old_fieldname).toBe('old_name');
			expect(complexField?.unique_across_doctypes).toBe(true);
			expect(complexField?.ignore_user_permissions).toBe(false);
			expect(complexField?.ignore_xss_filtered).toBe(false);
			expect(complexField?.allow_on_submit).toBe(false);
			expect(complexField?.collapsible).toBe(false);
			expect(complexField?.collapsible_depends_on).toBe('show_details');
			expect(complexField?.fetch_to_include).toBe('related_field');
			expect(complexField?.set_user_permissions).toBe(false);
			expect(complexField?.ignore_strict_user_permissions).toBe(false);
			expect(complexField?.table_fieldname).toBe('table_field');
			expect(complexField?.real_fieldname).toBe('real_field');

			// Check section break
			const sectionBreak = result.fields.find(f => f.fieldname === 'section_break');
			expect(sectionBreak).toBeDefined();
			expect(sectionBreak?.fieldtype).toBe('Section Break');

			// Check link field
			const linkField = result.fields.find(f => f.fieldname === 'link_field');
			expect(linkField).toBeDefined();
			expect(linkField?.fieldtype).toBe('Link');
			expect(linkField?.options).toBe('OtherDocType');
			expect(linkField?.filters).toBe('{"status": "Active"}');
			expect(linkField?.fetch_from).toBe('other_doc.name');

			// Check table field
			const tableField = result.fields.find(f => f.fieldname === 'table_field');
			expect(tableField).toBeDefined();
			expect(tableField?.fieldtype).toBe('Table');
			expect(tableField?.options).toBe('ChildDocType');

			// Check select field
			const selectField = result.fields.find(f => f.fieldname === 'select_field');
			expect(selectField).toBeDefined();
			expect(selectField?.fieldtype).toBe('Select');
			expect(selectField?.options).toBe('Draft\nSubmitted\nCancelled');
			expect(selectField?.default).toBe('Draft');
			expect(selectField?.required).toBe(true);
		});
	});

	describe('P2-003-T13: Parse permissions array - Permissions correctly parsed', () => {
		it('should parse complex permissions with all properties', () => {
			const permissionsJson = `{
				"name": "PermissionsDocType",
				"module": "TestModule",
				"fields": [],
				"permissions": [
					{
						"role": "System Manager",
						"read": true,
						"write": true,
						"create": true,
						"delete": true,
						"submit": true,
						"cancel": true,
						"amend": true,
						"report": true,
						"export": true,
						"import": true,
						"share": true,
						"print": true,
						"email": true,
						"select": true,
						"permlevel": 0,
						"if_owner": false,
						"apply_to_all": true,
						"condition": "doc.status !== \\"Submitted\\"",
						"description": "Full access for system managers"
					},
					{
						"role": "Manager",
						"read": true,
						"write": true,
						"create": true,
						"delete": false,
						"submit": true,
						"cancel": true,
						"amend": false,
						"report": true,
						"export": true,
						"import": false,
						"share": false,
						"print": true,
						"email": true,
						"select": true,
						"permlevel": 0,
						"if_owner": false,
						"apply_to_all": true,
						"condition": "doc.owner === frappe.session.user",
						"description": "Manager access with restrictions"
					},
					{
						"role": "User",
						"read": true,
						"write": false,
						"create": false,
						"delete": false,
						"submit": false,
						"cancel": false,
						"amend": false,
						"report": true,
						"export": false,
						"import": false,
						"share": false,
						"print": true,
						"email": false,
						"select": true,
						"permlevel": 0,
						"if_owner": true,
						"apply_to_all": false,
						"condition": "doc.owner === frappe.session.user",
						"description": "User can only read their own documents"
					},
					{
						"role": "All",
						"read": true,
						"permlevel": 0,
						"if_owner": false,
						"apply_to_all": true,
						"description": "Everyone can read"
					}
				]
			}`;

			const result = DocTypeJSONParser.parseDocTypeJSON(permissionsJson);

			expect(result.permissions).toHaveLength(4);

			// Check System Manager permission
			const sysManagerPerm = result.permissions.find(p => p.role === 'System Manager');
			expect(sysManagerPerm).toBeDefined();
			expect(sysManagerPerm?.read).toBe(true);
			expect(sysManagerPerm?.write).toBe(true);
			expect(sysManagerPerm?.create).toBe(true);
			expect(sysManagerPerm?.delete).toBe(true);
			expect(sysManagerPerm?.submit).toBe(true);
			expect(sysManagerPerm?.cancel).toBe(true);
			expect(sysManagerPerm?.amend).toBe(true);
			expect(sysManagerPerm?.report).toBe(true);
			expect(sysManagerPerm?.export).toBe(true);
			expect(sysManagerPerm?.import).toBe(true);
			expect(sysManagerPerm?.share).toBe(true);
			expect(sysManagerPerm?.print).toBe(true);
			expect(sysManagerPerm?.email).toBe(true);
			expect(sysManagerPerm?.select).toBe(true);
			expect(sysManagerPerm?.permlevel).toBe(0);
			expect(sysManagerPerm?.if_owner).toBe(false);
			expect(sysManagerPerm?.apply_to_all).toBe(true);
			expect(sysManagerPerm?.condition).toBe('doc.status !== "Submitted"');
			expect(sysManagerPerm?.description).toBe('Full access for system managers');

			// Check Manager permission
			const managerPerm = result.permissions.find(p => p.role === 'Manager');
			expect(managerPerm).toBeDefined();
			expect(managerPerm?.read).toBe(true);
			expect(managerPerm?.write).toBe(true);
			expect(managerPerm?.create).toBe(true);
			expect(managerPerm?.delete).toBe(false);
			expect(managerPerm?.submit).toBe(true);
			expect(managerPerm?.cancel).toBe(true);
			expect(managerPerm?.amend).toBe(false);
			expect(managerPerm?.report).toBe(true);
			expect(managerPerm?.export).toBe(true);
			expect(managerPerm?.import).toBe(false);
			expect(managerPerm?.share).toBe(false);
			expect(managerPerm?.print).toBe(true);
			expect(managerPerm?.email).toBe(true);
			expect(managerPerm?.select).toBe(true);
			expect(managerPerm?.permlevel).toBe(0);
			expect(managerPerm?.if_owner).toBe(false);
			expect(managerPerm?.apply_to_all).toBe(true);
			expect(managerPerm?.condition).toBe('doc.owner === frappe.session.user');
			expect(managerPerm?.description).toBe('Manager access with restrictions');

			// Check User permission
			const userPerm = result.permissions.find(p => p.role === 'User');
			expect(userPerm).toBeDefined();
			expect(userPerm?.read).toBe(true);
			expect(userPerm?.write).toBe(false);
			expect(userPerm?.create).toBe(false);
			expect(userPerm?.delete).toBe(false);
			expect(userPerm?.submit).toBe(false);
			expect(userPerm?.cancel).toBe(false);
			expect(userPerm?.amend).toBe(false);
			expect(userPerm?.report).toBe(true);
			expect(userPerm?.export).toBe(false);
			expect(userPerm?.import).toBe(false);
			expect(userPerm?.share).toBe(false);
			expect(userPerm?.print).toBe(true);
			expect(userPerm?.email).toBe(false);
			expect(userPerm?.select).toBe(true);
			expect(userPerm?.permlevel).toBe(0);
			expect(userPerm?.if_owner).toBe(true);
			expect(userPerm?.apply_to_all).toBe(false);
			expect(userPerm?.condition).toBe('doc.owner === frappe.session.user');
			expect(userPerm?.description).toBe('User can only read their own documents');

			// Check All permission
			const allPerm = result.permissions.find(p => p.role === 'All');
			expect(allPerm).toBeDefined();
			expect(allPerm?.read).toBe(true);
			expect(allPerm?.write).toBe(false);
			expect(allPerm?.create).toBe(false);
			expect(allPerm?.delete).toBe(false);
			expect(allPerm?.submit).toBe(false);
			expect(allPerm?.cancel).toBe(false);
			expect(allPerm?.amend).toBe(false);
			expect(allPerm?.report).toBe(true);
			expect(allPerm?.export).toBe(true);
			expect(allPerm?.import).toBe(true);
			expect(allPerm?.share).toBe(false);
			expect(allPerm?.print).toBe(true);
			expect(allPerm?.email).toBe(true);
			expect(allPerm?.select).toBe(true);
			expect(allPerm?.permlevel).toBe(0);
			expect(allPerm?.if_owner).toBe(false);
			expect(allPerm?.apply_to_all).toBe(true);
			expect(allPerm?.description).toBe('Everyone can read');
		});
	});

	describe('P2-003-T14: Parse indexes array - Indexes correctly parsed', () => {
		it('should parse complex indexes with all properties', () => {
			const indexesJson = `{
				"name": "IndexesDocType",
				"module": "TestModule",
				"fields": [],
				"permissions": [
					{
						"role": "System Manager",
						"read": true,
						"write": true,
						"create": true,
						"delete": true
					}
				],
				"indexes": [
					{
						"name": "idx_name",
						"columns": ["name"],
						"unique": true,
						"type": "btree"
					},
					{
						"name": "idx_status_modified",
						"columns": ["status", "modified"],
						"unique": false,
						"type": "btree",
						"where": "status != 'Deleted'"
					},
					{
						"name": "idx_customer_date",
						"columns": ["customer", "date"],
						"unique": false,
						"type": "hash",
						"where": "date > '2023-01-01'"
					},
					{
						"name": "idx_child_table",
						"columns": ["parent", "child_field"],
						"unique": false,
						"type": "btree",
						"child_table": "ChildTable"
					}
				]
			}`;

			const result = DocTypeJSONParser.parseDocTypeJSON(indexesJson);

			expect(result.indexes).toHaveLength(4);

			// Check first index
			const idx1 = result.indexes?.find(i => i.name === 'idx_name');
			expect(idx1).toBeDefined();
			expect(idx1?.name).toBe('idx_name');
			expect(idx1?.columns).toEqual(['name']);
			expect(idx1?.unique).toBe(true);
			expect(idx1?.type).toBe('btree');
			expect(idx1?.where).toBeUndefined();
			expect(idx1?.child_table).toBeUndefined();

			// Check second index
			const idx2 = result.indexes?.find(i => i.name === 'idx_status_modified');
			expect(idx2).toBeDefined();
			expect(idx2?.name).toBe('idx_status_modified');
			expect(idx2?.columns).toEqual(['status', 'modified']);
			expect(idx2?.unique).toBe(false);
			expect(idx2?.type).toBe('btree');
			expect(idx2?.where).toBe("status != 'Deleted'");
			expect(idx2?.child_table).toBeUndefined();

			// Check third index
			const idx3 = result.indexes?.find(i => i.name === 'idx_customer_date');
			expect(idx3).toBeDefined();
			expect(idx3?.name).toBe('idx_customer_date');
			expect(idx3?.columns).toEqual(['customer', 'date']);
			expect(idx3?.unique).toBe(false);
			expect(idx3?.type).toBe('hash');
			expect(idx3?.where).toBe("date > '2023-01-01'");
			expect(idx3?.child_table).toBeUndefined();

			// Check fourth index
			const idx4 = result.indexes?.find(i => i.name === 'idx_child_table');
			expect(idx4).toBeDefined();
			expect(idx4?.name).toBe('idx_child_table');
			expect(idx4?.columns).toEqual(['parent', 'child_field']);
			expect(idx4?.unique).toBe(false);
			expect(idx4?.type).toBe('btree');
			expect(idx4?.where).toBeUndefined();
			expect(idx4?.child_table).toBe('ChildTable');
		});
	});

	describe('Error handling for all custom error classes', () => {
		it('should handle JSONParseError with proper error details', () => {
			const invalidJson = `{
				"name": "Test",
				"module": "Test"
			`; // Missing closing brace

			try {
				DocTypeJSONParser.parseDocTypeJSON(invalidJson);
				expect.fail('Expected JSONParseError to be thrown');
			} catch (error) {
				expect(error).toBeInstanceOf(JSONParseError);
				const jsonError = error as JSONParseError;
				expect(jsonError.name).toBe('JSONParseError');
				expect(jsonError.message).toContain('Invalid JSON syntax');
				expect(jsonError.source).toBe(invalidJson);
			}
		});

		it('should handle FileNotFoundError with proper error details', async () => {
			const nonExistentPath = path.join(tempDir, 'non-existent.json');

			try {
				await DocTypeJSONParser.loadDocTypeFromFile(nonExistentPath);
				expect.fail('Expected FileNotFoundError to be thrown');
			} catch (error) {
				expect(error).toBeInstanceOf(FileNotFoundError);
				const fileError = error as FileNotFoundError;
				expect(fileError.name).toBe('FileNotFoundError');
				expect(fileError.filePath).toBe(nonExistentPath);
				expect(fileError.type).toBe('file');
			}
		});

		it('should handle FileIOError with proper error details', async () => {
			// Create a directory instead of a file to trigger read error
			const dirPath = path.join(tempDir, 'test-dir');
			await fs.mkdir(dirPath);

			try {
				await DocTypeJSONParser.loadDocTypeFromFile(dirPath);
				expect.fail('Expected FileIOError to be thrown');
			} catch (error) {
				expect(error).toBeInstanceOf(FileIOError);
				const ioError = error as FileIOError;
				expect(ioError.name).toBe('FileIOError');
				expect(ioError.filePath).toBe(dirPath);
				expect(ioError.operation).toBe('read');
			}
		});

		it('should handle SerializationError with proper error details', () => {
			// Create a DocType with a circular reference to trigger SerializationError
			const doctype: DocType = {
				name: 'CircularDocType',
				module: 'TestModule',
				fields: [],
				permissions: []
			};

			// Create circular reference
			(doctype as any).self = doctype;

			try {
				DocTypeJSONParser.serializeDocType(doctype);
				expect.fail('Expected SerializationError to be thrown');
			} catch (error) {
				expect(error).toBeInstanceOf(SerializationError);
				const serialError = error as SerializationError;
				expect(serialError.name).toBe('SerializationError');
				expect(serialError.doctypeName).toBe('CircularDocType');
			}
		});

		it('should handle DocTypeValidationError with proper error details', () => {
			const invalidJson = `{
				"name": "",
				"module": "",
				"fields": [],
				"permissions": []
			}`;

			try {
				DocTypeJSONParser.parseDocTypeJSON(invalidJson);
				expect.fail('Expected DocTypeValidationError to be thrown');
			} catch (error) {
				expect(error).toBeInstanceOf(DocTypeValidationError);
				const validationError = error as DocTypeValidationError;
				expect(validationError.name).toBe('DocTypeValidationError');
				expect(validationError.validationErrors).toBeDefined();
				expect(validationError.validationErrors.length).toBeGreaterThan(0);
			}
		});
	});

	describe('Default value population for all DocField properties', () => {
		it('should populate all 40+ DocField properties with defaults', () => {
			const minimalJson = `{
				"name": "DefaultsDocType",
				"module": "TestModule",
				"fields": [
					{
						"fieldname": "name",
						"label": "Name",
						"fieldtype": "Data"
					}
				],
				"permissions": [
					{
						"role": "System Manager",
						"read": true
					}
				]
			}`;

			const result = DocTypeJSONParser.parseDocTypeJSON(minimalJson);
			const field = result.fields[0];

			// Check all default values
			expect(field.required).toBe(false);
			expect(field.unique).toBe(false);
			expect(field.hidden).toBe(false);
			expect(field.read_only).toBe(false);
			expect(field.indexed).toBe(false);
			expect(field.in_list_view).toBe(false);
			expect(field.in_standard_filter).toBe(false);
			expect(field.in_global_search).toBe(false);
			expect(field.print_hide).toBe(false);
			expect(field.export_hide).toBe(false);
			expect(field.import_hide).toBe(false);
			expect(field.report_hide).toBe(false);
			expect(field.permlevel).toBe(0);
			expect(field.allow_in_quick_entry).toBe(true);
			expect(field.translatable).toBe(false);
			expect(field.no_copy).toBe(false);
			expect(field.remember_last_selected).toBe(false);
			expect(field.bold).toBe(false);
			expect(field.deprecated).toBe(false);
			expect(field.search_index).toBe(false);
			expect(field.email_trigger).toBe(false);
			expect(field.timeline).toBe(false);
			expect(field.track_seen).toBe(false);
			expect(field.track_visits).toBe(false);
			expect(field.unique_across_doctypes).toBe(false);
			expect(field.ignore_user_permissions).toBe(false);
			expect(field.ignore_xss_filtered).toBe(false);
			expect(field.allow_on_submit).toBe(false);
			expect(field.collapsible).toBe(false);
			expect(field.set_user_permissions).toBe(false);
			expect(field.ignore_strict_user_permissions).toBe(false);
		});
	});

	describe('Edge cases and boundary conditions', () => {
		it('should handle empty strings for optional properties', () => {
			const emptyStringsJson = `{
				"name": "EmptyStringsDocType",
				"module": "TestModule",
				"autoname": "",
				"title_field": "",
				"image_field": "",
				"search_fields": "",
				"keyword_fields": "",
				"default_sort_order": "",
				"subject_field": "",
				"sender_field": "",
				"email_template": "",
				"timeline_fields": "",
				"grid_view_fields": "",
				"quick_entry_fields": "",
				"print_heading": "",
				"custom_css": "",
				"custom_js": "",
				"custom_html": "",
				"fields": [
					{
						"fieldname": "name",
						"label": "Name",
						"fieldtype": "Data"
					}
				],
				"permissions": [
					{
						"role": "System Manager",
						"read": true
					}
				]
			}`;

			const result = DocTypeJSONParser.parseDocTypeJSON(emptyStringsJson);

			expect(result.name).toBe('EmptyStringsDocType');
			expect(result.module).toBe('TestModule');
			expect(result.autoname).toBe('');
			expect(result.title_field).toBe('');
			expect(result.image_field).toBe('');
			expect(result.search_fields).toBe('');
			expect(result.keyword_fields).toBe('');
			expect(result.default_sort_order).toBe('');
			expect(result.subject_field).toBe('');
			expect(result.sender_field).toBe('');
			expect(result.email_template).toBe('');
			expect(result.timeline_fields).toBe('');
			expect(result.grid_view_fields).toBe('');
			expect(result.quick_entry_fields).toBe('');
			expect(result.print_heading).toBe('');
			expect(result.custom_css).toBe('');
			expect(result.custom_js).toBe('');
			expect(result.custom_html).toBe('');
		});

		it('should handle zero values for numeric properties', () => {
			const zeroValuesJson = `{
				"name": "ZeroValuesDocType",
				"module": "TestModule",
				"max_attachments": 0,
				"fields": [
					{
						"fieldname": "name",
						"label": "Name",
						"fieldtype": "Data",
						"length": 0,
						"precision": 0,
						"order": 0,
						"permlevel": 0
					}
				],
				"permissions": [
					{
						"role": "System Manager",
						"read": true,
						"permlevel": 0
					}
				]
			}`;

			const result = DocTypeJSONParser.parseDocTypeJSON(zeroValuesJson);

			expect(result.max_attachments).toBe(0);
			expect(result.fields[0].length).toBe(0);
			expect(result.fields[0].precision).toBe(0);
			expect(result.fields[0].order).toBe(0);
			expect(result.fields[0].permlevel).toBe(0);
			expect(result.permissions[0].permlevel).toBe(0);
		});

		it('should handle special characters in strings', () => {
			const specialCharsJson = `{
				"name": "SpecialCharsDocType",
				"module": "TestModule",
				"title_field": "Name with special chars: !@#$%^&*()_+-=[]{}|;':,.<>/?",
				"fields": [
					{
						"fieldname": "name",
						"label": "Name with unicode: ñáéíóú 中文 العربية",
						"fieldtype": "Data",
						"description": "Description with quotes: \\"Single\\" and \\"Double\\"",
						"comment": "Comment with backslashes: \\\\",
						"validate": "return doc.name !== 'test'",
						"change": "console.log(\\"Changed to: \\" + doc.name)",
						"condition": "doc.status !== \\"Cancelled\\""
					}
				],
				"permissions": [
					{
						"role": "System Manager",
						"read": true,
						"condition": "doc.owner !== 'admin'"
					}
				]
			}`;

			const result = DocTypeJSONParser.parseDocTypeJSON(specialCharsJson);

			expect(result.title_field).toBe('Name with special chars: !@#$%^&*()_+-=[]{}|;\':,.<>/?');
			expect(result.fields[0].label).toBe('Name with unicode: ñáéíóú 中文 العربية');
			expect(result.fields[0].description).toBe('Description with quotes: "Single" and "Double"');
			expect(result.fields[0].comment).toBe('Comment with backslashes: \\');
			expect(result.fields[0].validate).toBe("return doc.name !== 'test'");
			expect(result.fields[0].change).toBe('console.log("Changed to: " + doc.name)');
			// Note: condition is not a property of DocField, it's a property of DocPerm
			// This test is checking the field's condition property which doesn't exist in the type
			// We'll remove this assertion as it's testing a non-existent property
			expect(result.permissions[0].condition).toBe("doc.owner !== 'admin'");
		});

		it('should handle very large JSON strings', () => {
			// Create a large JSON with many fields
			const fields = [];
			for (let i = 0; i < 100; i++) {
				fields.push({
					fieldname: `field_${i}`,
					label: `Field ${i}`,
					fieldtype: 'Data',
					length: 100,
					description: `Description for field ${i}`.repeat(10) // Make it longer
				});
			}

			const largeJson = {
				name: 'LargeDocType',
				module: 'TestModule',
				fields: fields,
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

			const jsonString = JSON.stringify(largeJson);
			const result = DocTypeJSONParser.parseDocTypeJSON(jsonString);

			expect(result.name).toBe('LargeDocType');
			expect(result.module).toBe('TestModule');
			expect(result.fields).toHaveLength(100);
			expect(result.permissions).toHaveLength(1);
		});
	});

	describe('Integration with existing DocTypeEngine', () => {
		it('should work with DocTypeEngine registration', async () => {
			const { DocTypeEngine } = await import('../doctype-engine');
			
			const validJson = `{
				"name": "EngineDocType",
				"module": "TestModule",
				"fields": [
					{
						"fieldname": "name",
						"label": "Name",
						"fieldtype": "Data",
						"required": true
					}
				],
				"permissions": [
					{
						"role": "System Manager",
						"read": true,
						"write": true,
						"create": true,
						"delete": true
					}
				]
			}`;

			const doctype = DocTypeJSONParser.parseDocTypeJSON(validJson);
			
			// Reset the engine for testing
			DocTypeEngine.resetInstance();
			const engine = DocTypeEngine.getInstance();
			
			// Register the parsed DocType
			await engine.registerDocType(doctype);
			
			// Retrieve it from the engine
			const retrieved = await engine.getDocType('EngineDocType');
			
			expect(retrieved).toBeDefined();
			expect(retrieved?.name).toBe('EngineDocType');
			expect(retrieved?.module).toBe('TestModule');
			expect(retrieved?.fields).toHaveLength(1);
			expect(retrieved?.permissions).toHaveLength(1);
		});

		it('should validate DocType through DocTypeEngine', async () => {
			const { DocTypeEngine } = await import('../doctype-engine');
			
			const validJson = `{
				"name": "ValidationDocType",
				"module": "TestModule",
				"fields": [
					{
						"fieldname": "name",
						"label": "Name",
						"fieldtype": "Data",
						"required": true
					}
				],
				"permissions": [
					{
						"role": "System Manager",
						"read": true,
						"write": true,
						"create": true,
						"delete": true
					}
				]
			}`;

			const doctype = DocTypeJSONParser.parseDocTypeJSON(validJson);
			
			// Reset the engine for testing
			DocTypeEngine.resetInstance();
			const engine = DocTypeEngine.getInstance();
			
			// Validate through the engine
			const validationResult = await engine.validateDocType(doctype);
			
			expect(validationResult.valid).toBe(true);
			expect(validationResult.errors).toHaveLength(0);
		});
	});
});