/**
 * JSON Parser Tests
 * 
 * Tests for DocType JSON parser implementation to ensure
 * proper parsing, validation, and error handling.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DocTypeJSONParser } from '../json-parser';
import {
	JSONParseError,
	FileNotFoundError,
	FileIOError,
	SerializationError
} from '../json-parser-errors';
import { DocTypeValidationError } from '../errors';
import type { DocType } from '../types';

describe('DocTypeJSONParser', () => {
	beforeEach(() => {
		// No setup needed as all methods are static
	});

	describe('Basic Parsing', () => {
		it('should parse valid JSON DocType definition', () => {
			const docType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{ fieldname: 'name', label: 'Name', fieldtype: 'Data' }
				],
				permissions: [
					{ role: 'System Manager', read: true, write: true, create: true, delete: true }
				]
			};
			const json = JSON.stringify(docType);
			const result = DocTypeJSONParser.parseDocTypeJSON(json);
			
			expect(result).toBeDefined();
			expect(result.name).toBe(docType.name);
			expect(result.module).toBe(docType.module);
			expect(result.fields).toHaveLength(docType.fields.length);
			expect(result.permissions).toHaveLength(docType.permissions.length);
		});

		it('should parse comprehensive JSON DocType definition', () => {
			const docType = {
				name: 'ComprehensiveDocType',
				module: 'TestModule',
				fields: [
					{ fieldname: 'name', label: 'Name', fieldtype: 'Data', required: true },
					{ fieldname: 'description', label: 'Description', fieldtype: 'Long Text' },
					{ fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Draft\nSubmitted\nCancelled' },
					{ fieldname: 'created_date', label: 'Created Date', fieldtype: 'Date' },
					{ fieldname: 'amount', label: 'Amount', fieldtype: 'Currency' },
					{ fieldname: 'is_active', label: 'Is Active', fieldtype: 'Check' },
					{ fieldname: 'link_field', label: 'Link Field', fieldtype: 'Link', options: 'User' },
					{ fieldname: 'table_field', label: 'Table Field', fieldtype: 'Table', options: 'ChildDoc' }
				],
				permissions: [
					{ role: 'System Manager', read: true, write: true, create: true, delete: true },
					{ role: 'User', read: true, write: false, create: false, delete: false }
				],
				indexes: [
					{ name: 'idx_name', columns: ['name'], unique: true },
					{ name: 'idx_status', columns: ['status'], unique: false }
				]
			};
			const json = JSON.stringify(docType);
			const result = DocTypeJSONParser.parseDocTypeJSON(json);
			
			expect(result).toBeDefined();
			expect(result.name).toBe(docType.name);
			expect(result.module).toBe(docType.module);
			expect(result.fields).toHaveLength(docType.fields.length);
			expect(result.permissions).toHaveLength(docType.permissions.length);
			expect(result.indexes).toHaveLength(docType.indexes?.length || 0);
		});

		it('should parse child table DocType definition', () => {
			const docType = {
				name: 'ChildTableDocType',
				module: 'TestModule',
				istable: true,
				fields: [
					{ fieldname: 'parent', label: 'Parent', fieldtype: 'Link', options: 'ParentDocType' },
					{ fieldname: 'parenttype', label: 'Parent Type', fieldtype: 'Data' },
					{ fieldname: 'parentfield', label: 'Parent Field', fieldtype: 'Data' },
					{ fieldname: 'idx', label: 'Index', fieldtype: 'Int' },
					{ fieldname: 'item_name', label: 'Item Name', fieldtype: 'Data' },
					{ fieldname: 'amount', label: 'Amount', fieldtype: 'Currency' }
				],
				permissions: [
					{ role: 'System Manager', read: true, write: true, create: true, delete: true }
				]
			};
			const json = JSON.stringify(docType);
			const result = DocTypeJSONParser.parseDocTypeJSON(json);
			
			expect(result).toBeDefined();
			expect(result.name).toBe(docType.name);
			expect(result.istable).toBe(true);
			expect(result.fields).toHaveLength(docType.fields.length);
		});

		it('should parse single document DocType definition', () => {
			const docType = {
				name: 'SingleDocType',
				module: 'TestModule',
				issingle: true,
				fields: [
					{ fieldname: 'company_name', label: 'Company Name', fieldtype: 'Data', required: true },
					{ fieldname: 'default_currency', label: 'Default Currency', fieldtype: 'Link', options: 'Currency' },
					{ fieldname: 'fiscal_year_start', label: 'Fiscal Year Start', fieldtype: 'Date' },
					{ fieldname: 'timezone', label: 'Timezone', fieldtype: 'Data' }
				],
				permissions: [
					{ role: 'System Manager', read: true, write: true, create: true, delete: true }
				]
			};
			const json = JSON.stringify(docType);
			const result = DocTypeJSONParser.parseDocTypeJSON(json);
			
			expect(result).toBeDefined();
			expect(result.name).toBe(docType.name);
			expect(result.issingle).toBe(true);
			expect(result.fields).toHaveLength(docType.fields.length);
		});

		it('should parse virtual DocType definition', () => {
			const docType = {
				name: 'VirtualDocType',
				module: 'TestModule',
				is_virtual: true,
				fields: [
					{ fieldname: 'name', label: 'Name', fieldtype: 'Data' },
					{ fieldname: 'total_count', label: 'Total Count', fieldtype: 'Int' },
					{ fieldname: 'last_updated', label: 'Last Updated', fieldtype: 'Datetime' }
				],
				permissions: [
					{ role: 'System Manager', read: true, write: false, create: false, delete: false }
				]
			};
			const json = JSON.stringify(docType);
			const result = DocTypeJSONParser.parseDocTypeJSON(json);
			
			expect(result).toBeDefined();
			expect(result.name).toBe(docType.name);
			expect(result.is_virtual).toBe(true);
			expect(result.fields).toHaveLength(docType.fields.length);
		});
	});

	describe('Error Handling', () => {
		it('should throw JSONParseError for invalid JSON syntax', () => {
			const invalidJson = '{ "name": "Test", "invalid": }';
			
			expect(() => DocTypeJSONParser.parseDocTypeJSON(invalidJson)).toThrow(JSONParseError);
		});

		it('should throw JSONParseError for empty string', () => {
			const emptyJson = '';
			
			expect(() => DocTypeJSONParser.parseDocTypeJSON(emptyJson)).toThrow(JSONParseError);
		});

		it('should throw JSONParseError for null input', () => {
			const nullJson = null as any;
			
			expect(() => DocTypeJSONParser.parseDocTypeJSON(nullJson)).toThrow();
		});

		it('should throw DocTypeValidationError for missing required fields', () => {
			const incompleteDocType = {
				module: 'TestModule'
				// Missing 'name' field
			};
			const json = JSON.stringify(incompleteDocType);
			
			expect(() => DocTypeJSONParser.parseDocTypeJSON(json)).toThrow(DocTypeValidationError);
		});

		it('should throw DocTypeValidationError for invalid field types', () => {
			const invalidDocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'name',
						label: 'Name',
						fieldtype: 'InvalidType'
					}
				],
				permissions: []
			};
			const json = JSON.stringify(invalidDocType);
			
			expect(() => DocTypeJSONParser.parseDocTypeJSON(json)).toThrow(DocTypeValidationError);
		});

		it('should throw DocTypeValidationError for Link field without options', () => {
			const invalidDocType = {
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
			const json = JSON.stringify(invalidDocType);
			
			expect(() => DocTypeJSONParser.parseDocTypeJSON(json)).toThrow(DocTypeValidationError);
		});

		it('should throw DocTypeValidationError for Table field without options', () => {
			const invalidDocType = {
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
			const json = JSON.stringify(invalidDocType);
			
			expect(() => DocTypeJSONParser.parseDocTypeJSON(json)).toThrow(DocTypeValidationError);
		});

		it('should throw DocTypeValidationError for duplicate field names', () => {
			const invalidDocType = {
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
			const json = JSON.stringify(invalidDocType);
			
			expect(() => DocTypeJSONParser.parseDocTypeJSON(json)).toThrow(DocTypeValidationError);
		});
	});

	describe('Schema Validation', () => {
		it('should validate field name format', () => {
			const invalidDocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'invalid-field-name',
						label: 'Invalid Field Name',
						fieldtype: 'Data'
					}
				],
				permissions: []
			};
			const json = JSON.stringify(invalidDocType);
			
			expect(() => DocTypeJSONParser.parseDocTypeJSON(json)).toThrow(DocTypeValidationError);
		});

		it('should validate field label presence', () => {
			const invalidDocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'name',
						fieldtype: 'Data'
						// Missing label
					}
				],
				permissions: []
			};
			const json = JSON.stringify(invalidDocType);
			
			expect(() => DocTypeJSONParser.parseDocTypeJSON(json)).toThrow(DocTypeValidationError);
		});

		it('should validate permission role presence', () => {
			const invalidDocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [],
				permissions: [
					{
						read: true,
						write: true,
						create: true,
						delete: true
						// Missing role
					}
				]
			};
			const json = JSON.stringify(invalidDocType);
			
			expect(() => DocTypeJSONParser.parseDocTypeJSON(json)).toThrow(DocTypeValidationError);
		});

		it('should validate index column names', () => {
			const invalidDocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'name',
						label: 'Name',
						fieldtype: 'Data'
					}
				],
				permissions: [],
				indexes: [
					{
						name: 'idx_invalid',
						columns: ['nonexistent_field']
					}
				]
			};
			const json = JSON.stringify(invalidDocType);
			
			expect(() => DocTypeJSONParser.parseDocTypeJSON(json)).toThrow(DocTypeValidationError);
		});
	});

	describe('Data Type Conversion', () => {
		it('should convert string numbers to numbers', () => {
			const docTypeWithStringNumbers = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'amount',
						label: 'Amount',
						fieldtype: 'Currency',
						precision: '2' // String that should be converted to number
					}
				],
				permissions: []
			};
			const json = JSON.stringify(docTypeWithStringNumbers);
			const result = DocTypeJSONParser.parseDocTypeJSON(json);
			
			expect(result.fields[0].precision).toBe(2);
		});

		it('should convert string booleans to booleans', () => {
			const docTypeWithStringBooleans = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'is_active',
						label: 'Is Active',
						fieldtype: 'Check',
						required: 'true' // String that should be converted to boolean
					}
				],
				permissions: []
			};
			const json = JSON.stringify(docTypeWithStringBooleans);
			const result = DocTypeJSONParser.parseDocTypeJSON(json);
			
			expect(result.fields[0].required).toBe(true);
		});

		it('should handle null values correctly', () => {
			const docTypeWithNulls = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'name',
						label: 'Name',
						fieldtype: 'Data',
						default: null
					}
				],
				permissions: []
			};
			const json = JSON.stringify(docTypeWithNulls);
			const result = DocTypeJSONParser.parseDocTypeJSON(json);
			
			expect(result.fields[0].default).toBeNull();
		});
	});

	describe('Advanced Features', () => {
		it('should parse DocType with custom properties', () => {
			const docTypeWithCustomProps = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'name',
						label: 'Name',
						fieldtype: 'Data'
					}
				],
				permissions: [],
				custom_property: 'custom_value',
				nested_custom: {
					prop1: 'value1',
					prop2: 'value2'
				}
			};
			const json = JSON.stringify(docTypeWithCustomProps);
			const result = DocTypeJSONParser.parseDocTypeJSON(json);
			
			expect(result).toBeDefined();
			expect((result as any).custom_property).toBe('custom_value');
			expect((result as any).nested_custom.prop1).toBe('value1');
			expect((result as any).nested_custom.prop2).toBe('value2');
		});

		it('should parse DocType with field dependencies', () => {
			const docTypeWithDependencies = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'field1',
						label: 'Field 1',
						fieldtype: 'Data'
					},
					{
						fieldname: 'field2',
						label: 'Field 2',
						fieldtype: 'Data',
						depends_on: 'field1'
					},
					{
						fieldname: 'field3',
						label: 'Field 3',
						fieldtype: 'Data',
						mandatory_depends_on: 'field1'
					}
				],
				permissions: []
			};
			const json = JSON.stringify(docTypeWithDependencies);
			const result = DocTypeJSONParser.parseDocTypeJSON(json);
			
			expect(result.fields[1].depends_on).toBe('field1');
			expect(result.fields[2].mandatory_depends_on).toBe('field1');
		});

		it('should parse DocType with field validation', () => {
			const docTypeWithValidation = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'email',
						label: 'Email',
						fieldtype: 'Data',
						validate: 'validate_email'
					},
					{
						fieldname: 'phone',
						label: 'Phone',
						fieldtype: 'Data',
						validate: 'validate_phone'
					}
				],
				permissions: []
			};
			const json = JSON.stringify(docTypeWithValidation);
			const result = DocTypeJSONParser.parseDocTypeJSON(json);
			
			expect(result.fields[0].validate).toBe('validate_email');
			expect(result.fields[1].validate).toBe('validate_phone');
		});
	});

	describe('Performance', () => {
		it('should handle large DocType definitions efficiently', () => {
			const largeDocType = {
				name: 'LargeDocType',
				module: 'TestModule',
				fields: Array.from({ length: 100 }, (_, i) => ({
					fieldname: `field_${i}`,
					label: `Field ${i}`,
					fieldtype: 'Data'
				})),
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
			const json = JSON.stringify(largeDocType);
			
			const startTime = Date.now();
			const result = DocTypeJSONParser.parseDocTypeJSON(json);
			const endTime = Date.now();
			
			expect(result).toBeDefined();
			expect(result.fields).toHaveLength(100);
			expect(endTime - startTime).toBeLessThan(1000); // Should parse within 1 second
		});
	});

	describe('Error Messages', () => {
		it('should provide descriptive error messages', () => {
			const invalidJson = '{ "name": "Test", "invalid": }';
			
			try {
				DocTypeJSONParser.parseDocTypeJSON(invalidJson);
			} catch (error) {
				expect(error).toBeInstanceOf(JSONParseError);
				if (error instanceof JSONParseError) {
					expect(error.message).toContain('JSON');
					expect(error.message).toContain('syntax');
					expect(error.line).toBeDefined();
					expect(error.column).toBeDefined();
				}
			}
		});

		it('should provide validation error details', () => {
			const invalidDocType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{
						fieldname: 'name',
						label: 'Name',
						fieldtype: 'InvalidType'
					}
				],
				permissions: []
			};
			const json = JSON.stringify(invalidDocType);
			
			try {
				DocTypeJSONParser.parseDocTypeJSON(json);
			} catch (error) {
				expect(error).toBeInstanceOf(DocTypeValidationError);
				if (error instanceof DocTypeValidationError) {
					expect(error.message).toContain('validation');
				}
			}
		});
	});

	describe('Serialization', () => {
		it('should serialize valid DocType to JSON', () => {
			const docType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{ fieldname: 'name', label: 'Name', fieldtype: 'Data' }
				],
				permissions: [
					{ role: 'System Manager', read: true, write: true, create: true, delete: true }
				]
			} as DocType;
			
			const jsonString = DocTypeJSONParser.serializeDocType(docType);
			const parsed = JSON.parse(jsonString);
			
			expect(parsed.name).toBe(docType.name);
			expect(parsed.module).toBe(docType.module);
			expect(parsed.fields).toHaveLength(docType.fields.length);
			expect(parsed.permissions).toHaveLength(docType.permissions.length);
		});

		it('should throw SerializationError for circular references', () => {
			const docType = {
				name: 'TestDocType',
				module: 'TestModule',
				fields: [
					{ fieldname: 'name', label: 'Name', fieldtype: 'Data' }
				],
				permissions: []
			} as DocType;
			
			// Create circular reference
			(docType as any).circular = docType;
			
			expect(() => DocTypeJSONParser.serializeDocType(docType)).toThrow(SerializationError);
		});

		it('should throw DocTypeValidationError for invalid DocType during serialization', () => {
			const invalidDocType = {
				name: '', // Invalid empty name
				module: 'TestModule',
				fields: [],
				permissions: []
			} as DocType;
			
			expect(() => DocTypeJSONParser.serializeDocType(invalidDocType)).toThrow(DocTypeValidationError);
		});
	});

	describe('File Operations', () => {
		it('should throw FileNotFoundError for non-existent file', async () => {
			const nonExistentPath = '/path/to/non/existent/file.json';
			
			await expect(DocTypeJSONParser.loadDocTypeFromFile(nonExistentPath))
				.rejects.toThrow(FileNotFoundError);
		});

		it('should throw FileIOError for directory access errors', async () => {
			const invalidDirPath = '/root/invalid/path/file.json';
			
			await expect(DocTypeJSONParser.loadDocTypeFromFile(invalidDirPath))
				.rejects.toThrow(FileNotFoundError);
		});
	});
});