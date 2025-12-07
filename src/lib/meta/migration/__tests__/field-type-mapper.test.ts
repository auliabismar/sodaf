/**
 * FieldTypeMapper Tests (P2-007-T9)
 * 
 * This file contains tests for FieldTypeMapper class, which is responsible for
 * mapping DocField types to SQLite data types.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FieldTypeMapper } from '../sql/field-type-mapper';
import type { DocField } from '../../doctype/types';
import type { ColumnDefinition } from '../types';
import { DEFAULT_FIELD_TYPE_MAPPINGS } from '../sql/field-type-mapper';
import { UnsupportedFieldTypeError, LayoutFieldError } from '../sql/sql-types';

describe('FieldTypeMapper', () => {
	let fieldTypeMapper: FieldTypeMapper;
	
	beforeEach(() => {
		fieldTypeMapper = new FieldTypeMapper();
	});
	
	afterEach(() => {
		fieldTypeMapper = null as any;
	});
	
	describe('Basic field type mapping', () => {
		it('should map Data field to varchar', () => {
			const field: DocField = {
				fieldname: 'name',
				label: 'Name',
				fieldtype: 'Data',
				length: 100,
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('name');
			expect(columnDef.type).toBe('varchar');
			expect(columnDef.length).toBe(100);
			expect(columnDef.nullable).toBe(true);
			expect(columnDef.primary_key).toBe(false);
			expect(columnDef.auto_increment).toBe(false);
			expect(columnDef.unique).toBe(false);
		});
		
		it('should map Int field to integer', () => {
			const field: DocField = {
				fieldname: 'age',
				label: 'Age',
				fieldtype: 'Int',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('age');
			expect(columnDef.type).toBe('integer');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Float field to real', () => {
			const field: DocField = {
				fieldname: 'price',
				label: 'Price',
				fieldtype: 'Float',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('price');
			expect(columnDef.type).toBe('real');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Currency field to real', () => {
			const field: DocField = {
				fieldname: 'amount',
				label: 'Amount',
				fieldtype: 'Currency',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('amount');
			expect(columnDef.type).toBe('real');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Percent field to real', () => {
			const field: DocField = {
				fieldname: 'percentage',
				label: 'Percentage',
				fieldtype: 'Percent',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('percentage');
			expect(columnDef.type).toBe('real');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Check field to integer', () => {
			const field: DocField = {
				fieldname: 'is_active',
				label: 'Is Active',
				fieldtype: 'Check',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('is_active');
			expect(columnDef.type).toBe('integer');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Date field to datetime', () => {
			const field: DocField = {
				fieldname: 'birth_date',
				label: 'Birth Date',
				fieldtype: 'Date',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('birth_date');
			expect(columnDef.type).toBe('datetime');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Datetime field to datetime', () => {
			const field: DocField = {
				fieldname: 'created_at',
				label: 'Created At',
				fieldtype: 'Datetime',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('created_at');
			expect(columnDef.type).toBe('datetime');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Time field to time', () => {
			const field: DocField = {
				fieldname: 'start_time',
				label: 'Start Time',
				fieldtype: 'Time',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('start_time');
			expect(columnDef.type).toBe('time');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Text Editor field to text', () => {
			const field: DocField = {
				fieldname: 'description',
				label: 'Description',
				fieldtype: 'Text Editor',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('description');
			expect(columnDef.type).toBe('text');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Long Text field to text', () => {
			const field: DocField = {
				fieldname: 'content',
				label: 'Content',
				fieldtype: 'Long Text',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('content');
			expect(columnDef.type).toBe('text');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Small Text field to text', () => {
			const field: DocField = {
				fieldname: 'note',
				label: 'Note',
				fieldtype: 'Small Text',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('note');
			expect(columnDef.type).toBe('text');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Select field to varchar', () => {
			const field: DocField = {
				fieldname: 'status',
				label: 'Status',
				fieldtype: 'Select',
				options: 'Active\nInactive\nPending',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('status');
			expect(columnDef.type).toBe('varchar');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Link field to varchar with foreign key', () => {
			const field: DocField = {
				fieldname: 'user_role',
				label: 'User Role',
				fieldtype: 'Link',
				options: 'UserRole',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('user_role');
			expect(columnDef.type).toBe('varchar');
			expect(columnDef.nullable).toBe(true);
			expect(columnDef.foreign_key).toBeDefined();
			expect(columnDef.foreign_key?.referenced_table).toBe('tabUserRole');
			expect(columnDef.foreign_key?.referenced_column).toBe('name');
		});
		
		it('should map Dynamic Link field to varchar', () => {
			const field: DocField = {
				fieldname: 'dynamic_link',
				label: 'Dynamic Link',
				fieldtype: 'Dynamic Link',
				options: 'reference_doctype',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('dynamic_link');
			expect(columnDef.type).toBe('varchar');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Password field to varchar', () => {
			const field: DocField = {
				fieldname: 'password',
				label: 'Password',
				fieldtype: 'Password',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('password');
			expect(columnDef.type).toBe('varchar');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Read Only field to text (no column)', () => {
			const field: DocField = {
				fieldname: 'read_only_field',
				label: 'Read Only Field',
				fieldtype: 'Read Only',
				required: false,
				unique: false
			};
			
			expect(() => fieldTypeMapper.mapFieldType(field)).toThrow(LayoutFieldError);
		});
		
		it('should map HTML field to text', () => {
			const field: DocField = {
				fieldname: 'html_content',
				label: 'HTML Content',
				fieldtype: 'HTML',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('html_content');
			expect(columnDef.type).toBe('text');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Markdown Editor field to text', () => {
			const field: DocField = {
				fieldname: 'markdown_content',
				label: 'Markdown Content',
				fieldtype: 'Markdown Editor',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('markdown_content');
			expect(columnDef.type).toBe('text');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Code field to text', () => {
			const field: DocField = {
				fieldname: 'code_snippet',
				label: 'Code Snippet',
				fieldtype: 'Code',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('code_snippet');
			expect(columnDef.type).toBe('text');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Attach field to varchar', () => {
			const field: DocField = {
				fieldname: 'attachment',
				label: 'Attachment',
				fieldtype: 'Attach',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('attachment');
			expect(columnDef.type).toBe('varchar');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Attach Image field to varchar', () => {
			const field: DocField = {
				fieldname: 'image',
				label: 'Image',
				fieldtype: 'Attach Image',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('image');
			expect(columnDef.type).toBe('varchar');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Signature field to varchar', () => {
			const field: DocField = {
				fieldname: 'signature',
				label: 'Signature',
				fieldtype: 'Signature',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('signature');
			expect(columnDef.type).toBe('varchar');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Color field to varchar', () => {
			const field: DocField = {
				fieldname: 'color',
				label: 'Color',
				fieldtype: 'Color',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('color');
			expect(columnDef.type).toBe('varchar');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Rating field to integer', () => {
			const field: DocField = {
				fieldname: 'rating',
				label: 'Rating',
				fieldtype: 'Rating',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('rating');
			expect(columnDef.type).toBe('integer');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Duration field to varchar', () => {
			const field: DocField = {
				fieldname: 'duration',
				label: 'Duration',
				fieldtype: 'Duration',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('duration');
			expect(columnDef.type).toBe('varchar');
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should map Geolocation field to varchar', () => {
			const field: DocField = {
				fieldname: 'location',
				label: 'Location',
				fieldtype: 'Geolocation',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.name).toBe('location');
			expect(columnDef.type).toBe('varchar');
			expect(columnDef.nullable).toBe(true);
		});
	});
	
	describe('Layout field types', () => {
		it('should throw LayoutFieldError for Section Break', () => {
			const field: DocField = {
				fieldname: 'section_break',
				label: 'Section Break',
				fieldtype: 'Section Break',
				required: false,
				unique: false
			};
			
			expect(() => fieldTypeMapper.mapFieldType(field)).toThrow(LayoutFieldError);
		});
		
		it('should throw LayoutFieldError for Column Break', () => {
			const field: DocField = {
				fieldname: 'column_break',
				label: 'Column Break',
				fieldtype: 'Column Break',
				required: false,
				unique: false
			};
			
			expect(() => fieldTypeMapper.mapFieldType(field)).toThrow(LayoutFieldError);
		});
		
		it('should throw LayoutFieldError for Tab Break', () => {
			const field: DocField = {
				fieldname: 'tab_break',
				label: 'Tab Break',
				fieldtype: 'Tab Break',
				required: false,
				unique: false
			};
			
			expect(() => fieldTypeMapper.mapFieldType(field)).toThrow(LayoutFieldError);
		});
		
		it('should throw LayoutFieldError for HTML (layout)', () => {
			const field: DocField = {
				fieldname: 'html_layout',
				label: 'HTML Layout',
				fieldtype: 'HTML',
				required: false,
				unique: false
			};
			
			// Note: HTML can be both content and layout, depends on context
			// This test assumes it's being used as layout
			expect(() => fieldTypeMapper.mapFieldType(field)).toThrow(LayoutFieldError);
		});
	});
	
	describe('Unsupported field types', () => {
		it('should throw UnsupportedFieldTypeError for unknown field type', () => {
			const field: DocField = {
				fieldname: 'unknown_field',
				label: 'Unknown Field',
				fieldtype: 'UnknownType' as any,
				required: false,
				unique: false
			};
			
			expect(() => fieldTypeMapper.mapFieldType(field)).toThrow(UnsupportedFieldTypeError);
		});
	});
	
	describe('Field properties mapping', () => {
		it('should handle required fields (NOT NULL)', () => {
			const field: DocField = {
				fieldname: 'required_field',
				label: 'Required Field',
				fieldtype: 'Data',
				required: true,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.nullable).toBe(false);
		});
		
		it('should handle optional fields (NULLABLE)', () => {
			const field: DocField = {
				fieldname: 'optional_field',
				label: 'Optional Field',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.nullable).toBe(true);
		});
		
		it('should handle unique fields', () => {
			const field: DocField = {
				fieldname: 'unique_field',
				label: 'Unique Field',
				fieldtype: 'Data',
				required: false,
				unique: true
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.unique).toBe(true);
		});
		
		it('should handle default values', () => {
			const field: DocField = {
				fieldname: 'status',
				label: 'Status',
				fieldtype: 'Select',
				options: 'Active\nInactive',
				required: false,
				unique: false,
				default: 'Active'
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.default_value).toBe('Active');
		});
		
		it('should handle numeric default values', () => {
			const field: DocField = {
				fieldname: 'count',
				label: 'Count',
				fieldtype: 'Int',
				required: false,
				unique: false,
				default: 0
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.default_value).toBe(0);
		});
		
		it('should handle boolean default values for Check fields', () => {
			const field: DocField = {
				fieldname: 'is_active',
				label: 'Is Active',
				fieldtype: 'Check',
				required: false,
				unique: false,
				default: 1
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.default_value).toBe(1);
		});
	});
	
	describe('Custom type mappings', () => {
		it('should use custom type mappings when provided', () => {
			const customMappings = {
				'Data': {
					sqliteType: 'TEXT',
					supportsLength: false,
					supportsPrecision: false,
					canBePrimaryKey: true,
					canBeUnique: true,
					canBeIndexed: true
				}
			};
			
			const customMapper = new FieldTypeMapper(customMappings);
			
			const field: DocField = {
				fieldname: 'custom_field',
				label: 'Custom Field',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			const columnDef = customMapper.mapFieldType(field);
			
			expect(columnDef.type).toBe('TEXT');
		});
		
		it('should fall back to default mappings for unmapped types', () => {
			const customMappings = {
				'Int': {
					sqliteType: 'BIGINT',
					supportsLength: false,
					supportsPrecision: false,
					canBePrimaryKey: true,
					canBeUnique: true,
					canBeIndexed: true
				}
			};
			
			const customMapper = new FieldTypeMapper(customMappings);
			
			const intField: DocField = {
				fieldname: 'int_field',
				label: 'Int Field',
				fieldtype: 'Int',
				required: false,
				unique: false
			};
			
			const dataField: DocField = {
				fieldname: 'data_field',
				label: 'Data Field',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			const intColumnDef = customMapper.mapFieldType(intField);
			const dataColumnDef = customMapper.mapFieldType(dataField);
			
			// Should use custom mapping for Int
			expect(intColumnDef.type).toBe('BIGINT');
			
			// Should fall back to default mapping for Data
			expect(dataColumnDef.type).toBe('varchar');
		});
	});
	
	describe('Default field type mappings', () => {
		it('should provide default mappings for all standard field types', () => {
			expect(DEFAULT_FIELD_TYPE_MAPPINGS).toBeDefined();
			expect(Object.keys(DEFAULT_FIELD_TYPE_MAPPINGS).length).toBeGreaterThan(0);
			
			// Check that all required properties are present
			for (const [fieldType, mapping] of Object.entries(DEFAULT_FIELD_TYPE_MAPPINGS)) {
				expect(mapping.sqliteType).toBeDefined();
				expect(typeof mapping.canBePrimaryKey).toBe('boolean');
				expect(typeof mapping.canBeUnique).toBe('boolean');
				expect(typeof mapping.canBeIndexed).toBe('boolean');
			}
		});
	});
	
	describe('Special field handling', () => {
		it('should handle name field as primary key', () => {
			const field: DocField = {
				fieldname: 'name',
				label: 'Name',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			// Name field should be marked as primary key
			expect(columnDef.primary_key).toBe(true);
		});
		
		it('should handle table name generation for Link fields', () => {
			const field: DocField = {
				fieldname: 'customer',
				label: 'Customer',
				fieldtype: 'Link',
				options: 'Customer',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.foreign_key?.referenced_table).toBe('tabCustomer');
		});
		
		it('should handle table name with custom table_name in options', () => {
			const field: DocField = {
				fieldname: 'custom_link',
				label: 'Custom Link',
				fieldtype: 'Link',
				options: 'CustomDocType:custom_table_name',
				required: false,
				unique: false
			};
			
			const columnDef = fieldTypeMapper.mapFieldType(field);
			
			expect(columnDef.foreign_key?.referenced_table).toBe('custom_table_name');
		});
	});
});