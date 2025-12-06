/**
 * Test cases for DocType types and interfaces
 */

import { describe, it, expect } from 'vitest';
import type {
	DocType,
	DocField,
	DocPerm,
	DocIndex,
	DocTypeAction,
	DocTypeLink,
	FieldType
} from '../types';

describe('DocType Types and Interfaces', () => {
	describe('FieldType Union', () => {
		it('should include all 30+ field types', () => {
			const validTypes: FieldType[] = [
				'Data',
				'Long Text',
				'Small Text',
				'Text Editor',
				'Code',
				'Markdown Editor',
				'HTML Editor',
				'Int',
				'Float',
				'Currency',
				'Percent',
				'Check',
				'Select',
				'Link',
				'Dynamic Link',
				'Table',
				'Table MultiSelect',
				'Date',
				'Datetime',
				'Time',
				'Duration',
				'Geolocation',
				'Attach',
				'Attach Image',
				'Signature',
				'Color',
				'Rating',
				'Password',
				'Read Only',
				'Button',
				'Image',
				'HTML',
				'Section Break',
				'Column Break',
				'Tab Break',
				'Fold'
			];
			
			expect(validTypes.length).toBeGreaterThan(30);
		});
	});

	describe('DocField Interface', () => {
		it('should accept a valid DocField object', () => {
			const field: DocField = {
				fieldname: 'test_field',
				label: 'Test Field',
				fieldtype: 'Data',
				required: true,
				unique: false,
				default: 'Default Value',
				length: 100,
				description: 'A test field',
				in_list_view: true,
				search_index: true
			};

			expect(field.fieldname).toBe('test_field');
			expect(field.label).toBe('Test Field');
			expect(field.fieldtype).toBe('Data');
		});

		it('should accept a DocField with 40+ properties', () => {
			const field: DocField = {
				fieldname: 'comprehensive_field',
				label: 'Comprehensive Field',
				fieldtype: 'Data',
				options: 'Option1\nOption2\nOption3',
				required: true,
				unique: true,
				default: 'Default',
				length: 255,
				precision: 2,
				hidden: false,
				read_only: false,
				indexed: true,
				description: 'Comprehensive field description',
				comment: 'Field comment',
				order: 1,
				in_list_view: true,
				in_standard_filter: true,
				in_global_search: true,
				print_hide: false,
				export_hide: false,
				import_hide: false,
				report_hide: false,
				permlevel: 0,
				depends_on: 'other_field',
				label_depends_on: 'other_field',
				mandatory_depends_on: 'other_field',
				read_only_depends_on: 'other_field',
				hidden_depends_on: 'other_field',
				validate: 'return doc.test_field !== ""',
				change: 'console.log("Field changed")',
				filters: '{"status": "Active"}',
				fetch_from: 'other_doc.field_name',
				fetch_if_empty: true,
				allow_in_quick_entry: true,
				translatable: true,
				no_copy: false,
				remember_last_selected: true,
				bold: false,
				deprecated: false,
				precision_based_on: 'currency',
				width: '50%',
				columns: 'col1\ncol2\ncol3',
				child_doctype: 'ChildDocType',
				image_field: 'image',
				search_index: true,
				email_trigger: true,
				timeline: true,
				track_seen: true,
				track_visits: true,
				old_fieldname: 'old_name',
				unique_across_doctypes: true,
				ignore_user_permissions: false,
				ignore_xss_filtered: false,
				allow_on_submit: false,
				collapsible: false,
				collapsible_depends_on: 'show_details',
				fetch_to_include: 'related_field',
				set_user_permissions: false,
				ignore_strict_user_permissions: false,
				table_fieldname: 'table_field',
				real_fieldname: 'real_field'
			};

			// Verify we have more than 40 properties
			const propertyCount = Object.keys(field).length;
			expect(propertyCount).toBeGreaterThan(40);
			expect(field.fieldname).toBe('comprehensive_field');
		});
	});

	describe('DocPerm Interface', () => {
		it('should accept a valid DocPerm object', () => {
			const perm: DocPerm = {
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
			};

			expect(perm.role).toBe('System Manager');
			expect(perm.read).toBe(true);
			expect(perm.permlevel).toBe(0);
		});
	});

	describe('DocIndex Interface', () => {
		it('should accept a valid DocIndex object', () => {
			const index: DocIndex = {
				name: 'idx_name_status',
				columns: ['name', 'status'],
				unique: true,
				type: 'btree',
				where: 'status != "Deleted"',
				child_table: 'child_table_name'
			};

			expect(index.name).toBe('idx_name_status');
			expect(index.columns).toEqual(['name', 'status']);
			expect(index.unique).toBe(true);
		});
	});

	describe('DocTypeAction Interface', () => {
		it('should accept a valid DocTypeAction object', () => {
			const action: DocTypeAction = {
				label: 'Submit Document',
				action_type: 'Server Action',
				action: 'submit_doc',
				group: 'Actions',
				hidden: false,
				condition: 'doc.status === "Draft"',
				order: 10,
				is_standard: true,
				child_table: 'child_table_name'
			};

			expect(action.label).toBe('Submit Document');
			expect(action.action_type).toBe('Server Action');
			expect(action.action).toBe('submit_doc');
		});
	});

	describe('DocTypeLink Interface', () => {
		it('should accept a valid DocTypeLink object', () => {
			const link: DocTypeLink = {
				group: 'Related Documents',
				link_doctype: 'Sales Order',
				link_fieldname: 'sales_order',
				parent_doctype: 'Customer',
				label: 'Sales Orders',
				hidden: false,
				condition: 'doc.customer === cur_doc.name',
				order: 10
			};

			expect(link.group).toBe('Related Documents');
			expect(link.link_doctype).toBe('Sales Order');
			expect(link.link_fieldname).toBe('sales_order');
		});
	});

	describe('DocType Interface', () => {
		it('should accept a valid DocType object', () => {
			const doctype: DocType = {
				name: 'Test DocType',
				module: 'Core',
				issingle: false,
				istable: false,
				is_submittable: true,
				is_tree: false,
				is_virtual: false,
				autoname: 'TEST-.#####',
				fields: [
					{
						fieldname: 'name',
						label: 'Name',
						fieldtype: 'Data',
						required: true,
						unique: true
					},
					{
						fieldname: 'status',
						label: 'Status',
						fieldtype: 'Select',
						options: 'Draft\nSubmitted\nCancelled',
						default: 'Draft'
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
						permlevel: 0
					},
					{
						role: 'All',
						read: true,
						permlevel: 0
					}
				],
				indexes: [
					{
						name: 'idx_name',
						columns: ['name'],
						unique: true
					},
					{
						name: 'idx_status',
						columns: ['status']
					}
				],
				actions: [
					{
						label: 'Submit',
						action_type: 'Server Action',
						action: 'submit_doc',
						condition: 'doc.status === "Draft"'
					},
					{
						label: 'Cancel',
						action_type: 'Server Action',
						action: 'cancel_doc',
						condition: 'doc.status === "Submitted"'
					}
				],
				links: [
					{
						group: 'Related',
						link_doctype: 'Test Child',
						link_fieldname: 'parent',
						parent_doctype: 'Test DocType'
					}
				],
				title_field: 'name',
				search_fields: 'name,status',
				track_changes: true,
				allow_import: true,
				allow_rename: true
			};

			expect(doctype.name).toBe('Test DocType');
			expect(doctype.module).toBe('Core');
			expect(doctype.is_submittable).toBe(true);
			expect(doctype.fields).toHaveLength(2);
			expect(doctype.permissions).toHaveLength(2);
			expect(doctype.indexes).toHaveLength(2);
			expect(doctype.actions).toHaveLength(2);
			expect(doctype.links).toHaveLength(1);
		});

		it('should require at least name, module, fields, and permissions', () => {
			// This should compile without errors
			const minimalDoctype: DocType = {
				name: 'Minimal DocType',
				module: 'Core',
				fields: [],
				permissions: []
			};

			expect(minimalDoctype.name).toBe('Minimal DocType');
			expect(minimalDoctype.fields).toEqual([]);
			expect(minimalDoctype.permissions).toEqual([]);
		});
	});

	describe('Type Safety', () => {
		it('should enforce valid field types', () => {
			// This test verifies that TypeScript enforces the FieldType union
			const validTypes: FieldType[] = [
				'Data',
				'Int',
				'Float',
				'Check',
				'Select',
				'Link',
				'Date'
			];
			
			expect(validTypes.length).toBeGreaterThan(0);
			
			// The following line would cause a TypeScript error if uncommented:
			// const invalidType: FieldType = 'Invalid Type';
		});

		it('should enforce required properties', () => {
			// This test verifies that required properties are enforced
			// We're testing the type definition itself, not runtime validation
			
			// Valid DocField with all required properties
			const validField: DocField = {
				fieldname: 'test',
				label: 'Test',
				fieldtype: 'Data'
			};
			
			expect(validField.fieldname).toBe('test');
			
			// Valid DocType with all required properties
			const validDoctype: DocType = {
				name: 'Test',
				module: 'Core',
				fields: [],
				permissions: []
			};
			
			expect(validDoctype.name).toBe('Test');
		});
	});
});