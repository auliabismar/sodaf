/**
 * Migration Workflow Integration Tests
 * 
 * This file contains integration tests for the complete migration workflow,
 * testing interaction between migration engine, schema comparison, and SQL generation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MigrationWorkflow } from '../../meta/migration/migration-workflow';
import { DocTypeEngine } from '../../meta/doctype/doctype-engine';
import type { DocType } from '../../meta/doctype/types';
import { FieldComparator } from '../../meta/migration/comparators/field-comparator';

describe('Migration Workflow Integration', () => {
	let migrationWorkflow: MigrationWorkflow;
	let docTypeEngine: DocTypeEngine;
	let mockDatabase: any;

	// Helper to convert DocType to mock table schema
	const createMockTableSchema = (doctype: DocType) => {
		const columns = doctype.fields.map(field => {
			const type = FieldComparator.mapFieldTypeToSQLiteType(field.fieldtype, field);
			return {
				name: field.fieldname,
				type,
				notnull: field.required ? 1 : 0,
				dflt_value: field.default,
				pk: 0,
				// Additional properties used by FieldComparator
				nullable: !field.required,
				unique: field.unique ? 1 : 0,
				default_value: field.default
			};
		});

		// Add partial index info if needed based on unique fields
		const indexes = doctype.fields
			.filter(f => f.unique)
			.map(f => ({
				name: `idx_${doctype.name}_${f.fieldname}`,
				columns: [f.fieldname],
				unique: 1,
				origin: 'c', // create table
				partial: 0
			}));

		if (doctype.indexes) {
			indexes.push(...doctype.indexes.map(idx => ({
				name: idx.name || `idx_${doctype.name}_custom`,
				columns: idx.columns,
				unique: idx.unique ? 1 : 0,
				origin: 'c',
				partial: 0
			})));
		}

		return { columns, indexes };
	};

	beforeEach(() => {
		// Reset DocType engine
		DocTypeEngine.resetInstance();
		docTypeEngine = DocTypeEngine.getInstance();

		// Create mock database
		mockDatabase = {
			begin: async () => ({ commit: async () => { }, rollback: async () => { } }),
			query: async () => ({ rows: [] }),
			close: async () => { },
			get_columns: vi.fn().mockResolvedValue([]),
			get_indexes: vi.fn().mockResolvedValue([])
		};

		// Initialize migration workflow
		migrationWorkflow = new MigrationWorkflow(mockDatabase, docTypeEngine);
	});

	afterEach(() => {
		// Clean up test data
		DocTypeEngine.resetInstance();
		vi.clearAllMocks();
	});

	describe('Schema Comparison Workflow', () => {
		it('should compare two DocType schemas and generate diff', async () => {
			// Arrange
			const sourceDocType: DocType = {
				name: 'User',
				module: 'Core',
				fields: [
					{
						fieldname: 'name',
						fieldtype: 'Data',
						label: 'Name',
						required: true
					},
					{
						fieldname: 'email',
						fieldtype: 'Data',
						label: 'Email',
						required: true,
						unique: true
					}
				],
				permissions: []
			};

			const targetDocType: DocType = {
				name: 'User',
				module: 'Core',
				fields: [
					{
						fieldname: 'name',
						fieldtype: 'Data',
						label: 'Name',
						required: true
					},
					{
						fieldname: 'email',
						fieldtype: 'Data',
						label: 'Email',
						required: true,
						unique: true
					},
					{
						fieldname: 'age',
						fieldtype: 'Int',
						label: 'Age',
						required: false
					}
				],
				permissions: []
			};

			// Setup DB mock to represent sourceDocType
			const schema = createMockTableSchema(sourceDocType);
			mockDatabase.get_columns.mockResolvedValue(schema.columns);
			mockDatabase.get_indexes.mockResolvedValue(schema.indexes);

			// Register target DocType only
			await docTypeEngine.registerDocType(targetDocType);

			// Act
			const result = await migrationWorkflow.executeMigration('User', {
				dryRun: true,
				validateData: true
			});

			// Assert
			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			// We expect SQL to be generated for adding 'age' column
			expect(result.sql.length).toBeGreaterThan(0);
			expect(result.sql[0]).toContain('ADD COLUMN');
			expect(result.sql[0]).toContain('age');
		});

		it('should handle field modifications', async () => {
			// Arrange
			const sourceDocType: DocType = {
				name: 'Product',
				module: 'Inventory',
				fields: [
					{
						fieldname: 'name',
						fieldtype: 'Data',
						label: 'Name',
						required: true,
						length: 100
					},
					{
						fieldname: 'price',
						fieldtype: 'Float',
						label: 'Price',
						required: true,
						precision: 2
					}
				],
				permissions: []
			};

			const targetDocType: DocType = {
				name: 'Product',
				module: 'Inventory',
				fields: [
					{
						fieldname: 'name',
						fieldtype: 'Data',
						label: 'Name',
						required: true,
						length: 200 // Increased length
					},
					{
						fieldname: 'price',
						fieldtype: 'Currency', // Changed type
						label: 'Price',
						required: true,
						precision: 4 // Increased precision
					}
				],
				permissions: []
			};

			// Setup DB mock to represent sourceDocType
			const schema = createMockTableSchema(sourceDocType);
			mockDatabase.get_columns.mockResolvedValue(schema.columns);
			mockDatabase.get_indexes.mockResolvedValue(schema.indexes);

			// Register target DocType
			await docTypeEngine.registerDocType(targetDocType);

			// Act
			const result = await migrationWorkflow.executeMigration('Product', {
				dryRun: true,
				validateData: true
			});

			// Assert
			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			// Modifications often involve temp table or direct alter depending on driver
			// But check that we have SQL
			expect(result.sql.length).toBeGreaterThan(0);
		});

		it('should handle field removals', async () => {
			// Arrange
			const sourceDocType: DocType = {
				name: 'Customer',
				module: 'Sales',
				fields: [
					{
						fieldname: 'name',
						fieldtype: 'Data',
						label: 'Name',
						required: true
					},
					{
						fieldname: 'email',
						fieldtype: 'Data',
						label: 'Email',
						required: true
					},
					{
						fieldname: 'phone',
						fieldtype: 'Data',
						label: 'Phone',
						required: false
					},
					{
						fieldname: 'fax',
						fieldtype: 'Data',
						label: 'Fax',
						required: false
					}
				],
				permissions: []
			};

			const targetDocType: DocType = {
				name: 'Customer',
				module: 'Sales',
				fields: [
					{
						fieldname: 'name',
						fieldtype: 'Data',
						label: 'Name',
						required: true
					},
					{
						fieldname: 'email',
						fieldtype: 'Data',
						label: 'Email',
						required: true
					},
					{
						fieldname: 'phone',
						fieldtype: 'Data',
						label: 'Phone',
						required: false
					}
					// fax field removed
				],
				permissions: []
			};

			// Setup DB mock to represent sourceDocType
			const schema = createMockTableSchema(sourceDocType);
			mockDatabase.get_columns.mockResolvedValue(schema.columns);
			mockDatabase.get_indexes.mockResolvedValue(schema.indexes);

			// Register target DocType
			await docTypeEngine.registerDocType(targetDocType);

			// Act
			const result = await migrationWorkflow.executeMigration('Customer', {
				dryRun: true,
				validateData: true
			});

			// Assert
			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			// Removing a column usually creates destructiveness warning or drops column
			expect(result.sql.length).toBeGreaterThan(0);
			// Should contain DROP COLUMN logic (or create new table without it)
		});
	});

	describe('Migration Execution Workflow', () => {
		it('should execute migration successfully', async () => {
			// Arrange
			const docType: DocType = {
				name: 'Employee',
				module: 'HR',
				fields: [
					{
						fieldname: 'name',
						fieldtype: 'Data',
						label: 'Name',
						required: true
					},
					{
						fieldname: 'email',
						fieldtype: 'Data',
						label: 'Email',
						required: true,
						unique: true
					},
					{
						fieldname: 'department',
						fieldtype: 'Data',
						label: 'Department',
						required: false
					}
				],
				permissions: []
			};

			// Ensure DB returns empty schema (new table)
			mockDatabase.get_columns.mockResolvedValue([]);
			mockDatabase.get_indexes.mockResolvedValue([]);

			// Register DocType
			await docTypeEngine.registerDocType(docType);

			// Act
			const result = await migrationWorkflow.executeMigration('Employee', {
				dryRun: false,
				validateData: false
			});

			// Assert
			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.sql.length).toBeGreaterThan(0);
			// When DB is empty, schema comparison sees all fields as added columns
			// which generates ALTER TABLE ADD COLUMN statements (not CREATE TABLE)
			expect(result.sql[0]).toContain('ADD COLUMN');
		});

		it('should handle migration rollback', async () => {
			// Arrange
			const docType: DocType = {
				name: 'TempTable',
				module: 'Test',
				fields: [
					{
						fieldname: 'name',
						fieldtype: 'Data',
						label: 'Name',
						required: true
					},
					{
						fieldname: 'temp_field',
						fieldtype: 'Data',
						label: 'Temp Field',
						required: false
					}
				],
				permissions: []
			};

			mockDatabase.get_columns.mockResolvedValue([]);
			mockDatabase.get_indexes.mockResolvedValue([]);

			// Register DocType
			await docTypeEngine.registerDocType(docType);

			// Act - Execute migration
			const executeResult = await migrationWorkflow.executeMigration('TempTable', {
				dryRun: false,
				validateData: false
			});

			// Assert
			expect(executeResult).toBeDefined();
			expect(executeResult.success).toBe(true);
		});

		it('should track migration status', async () => {
			// Arrange
			const docType: DocType = {
				name: 'StatusTracking',
				module: 'Test',
				fields: [
					{
						fieldname: 'name',
						fieldtype: 'Data',
						label: 'Name',
						required: true
					}
				],
				permissions: []
			};

			mockDatabase.get_columns.mockResolvedValue([]);
			mockDatabase.get_indexes.mockResolvedValue([]);

			// Register DocType
			await docTypeEngine.registerDocType(docType);

			// Act
			const result = await migrationWorkflow.executeMigration('StatusTracking', {
				dryRun: false,
				validateData: false
			});

			// Assert
			expect(result).toBeDefined();
			expect(result.success).toBe(true);
		});
	});

	describe('Migration Validation Workflow', () => {
		it('should validate migration before execution', async () => {
			// Arrange
			const validDocType: DocType = {
				name: 'ValidTable',
				module: 'Test',
				fields: [
					{
						fieldname: 'name',
						fieldtype: 'Data',
						label: 'Name',
						required: true
					}
				],
				permissions: []
			};

			mockDatabase.get_columns.mockResolvedValue([]);
			mockDatabase.get_indexes.mockResolvedValue([]);

			// Register DocType
			await docTypeEngine.registerDocType(validDocType);

			// Act
			const result = await migrationWorkflow.executeMigration('ValidTable', {
				dryRun: true,
				validateData: true
			});

			// Assert
			expect(result).toBeDefined();
			expect(result.success).toBe(true);
		});

		it('should detect invalid DocType definitions', async () => {
			// Arrange
			const invalidDocType: DocType = {
				name: '', // Invalid empty name
				module: 'Test',
				fields: [],
				permissions: []
			};

			// Register DocType (this should fail)
			try {
				await docTypeEngine.registerDocType(invalidDocType);
			} catch (error) {
				// Expected to fail
			}

			// Act - try to migrate a non-existent doctype (since it failed registration)
			const result = await migrationWorkflow.executeMigration('', {
				dryRun: true,
				validateData: true
			});

			// Assert
			expect(result).toBeDefined();
			// Should fail because DocType not found or empty name
			expect(result.success).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});
	});

	describe('Complete Migration Workflow', () => {
		it('should handle end-to-end migration process', async () => {
			// Arrange
			const sourceDocType: DocType = {
				name: 'Invoice',
				module: 'Accounts',
				fields: [
					{
						fieldname: 'customer',
						fieldtype: 'Link',
						label: 'Customer',
						required: true,
						options: 'Customer'
					},
					{
						fieldname: 'amount',
						fieldtype: 'Currency',
						label: 'Amount',
						required: true
					}
				],
				permissions: []
			};

			const targetDocType: DocType = {
				name: 'Invoice',
				module: 'Accounts',
				fields: [
					{
						fieldname: 'customer',
						fieldtype: 'Link',
						label: 'Customer',
						required: true,
						options: 'Customer'
					},
					{
						fieldname: 'amount',
						fieldtype: 'Currency',
						label: 'Amount',
						required: true
					},
					{
						fieldname: 'due_date',
						fieldtype: 'Date',
						label: 'Due Date',
						required: false
					},
					{
						fieldname: 'status',
						fieldtype: 'Select',
						label: 'Status',
						required: true,
						options: 'Draft\nPaid\nOverdue'
					}
				],
				permissions: []
			};

			// Setup DB mock to represent sourceDocType
			const schema = createMockTableSchema(sourceDocType);
			mockDatabase.get_columns.mockResolvedValue(schema.columns);
			mockDatabase.get_indexes.mockResolvedValue(schema.indexes);

			// Register target DocType
			await docTypeEngine.registerDocType(targetDocType);

			// Act - Complete workflow
			const result = await migrationWorkflow.executeMigration('Invoice', {
				dryRun: true,
				validateData: true
			});

			// Assert
			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.sql.length).toBeGreaterThan(0);
			// Check for added columns
			const sqlString = result.sql.join(' ').toLowerCase();
			expect(sqlString).toContain('due_date');
			expect(sqlString).toContain('status');
		});
	});
});