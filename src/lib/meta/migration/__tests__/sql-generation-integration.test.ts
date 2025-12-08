/**
 * SQL Generation Integration Tests (P2-007)
 * 
 * This file contains integration tests for the complete SQL generation workflow,
 * testing the interaction between all SQL generation components.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLGenerator } from '../sql-generator';
import { FieldTypeMapper } from '../sql/field-type-mapper';
import { ConstraintBuilder } from '../sql/constraint-builder';
import { IndexBuilder } from '../sql/index-builder';
import { TableRebuilder } from '../sql/table-rebuilder';
import { RollbackGenerator } from '../sql/rollback-generator';
import { SQLFormatter } from '../sql/sql-formatter';
import type { DocType, DocField, DocIndex } from '../../doctype/types';
import type { SchemaDiff, FieldChange, ColumnRename } from '../types';
import { sampleDocFields, sampleDocIndexes } from './fixtures/test-data';
import { complexSchemaDiff } from './fixtures/schema-diffs';

describe('SQL Generation Integration', () => {
	let sqlGenerator: SQLGenerator;
	
	beforeEach(() => {
		sqlGenerator = new SQLGenerator({
			includeComments: true,
			formatSQL: true,
			identifierQuote: '`',
			maxLineLength: 110
		});
	});
	
	
	
	describe('Complete workflow integration', () => {
		it('should generate complete migration SQL for complex schema diff', () => {
			const doctype: DocType = {
				name: 'ComplexDocType',
				module: 'Test',
				issingle: false,
				istable: false,
				is_submittable: false,
				is_tree: false,
				is_virtual: false,
				fields: [
					sampleDocFields.basicText,
					sampleDocFields.email,
					sampleDocFields.number,
					sampleDocFields.checkbox,
					{
						fieldname: 'new_field',
						label: 'New Field',
						fieldtype: 'Data',
						length: 200,
						required: true,
						unique: false
					}
				],
				permissions: [],
				indexes: [
					sampleDocIndexes.basicIndex,
					sampleDocIndexes.uniqueIndex,
					{
						name: 'idx_composite',
						columns: ['name', 'email'],
						unique: false
					}
				],
				actions: [],
				links: [],
				autoname: '',
				title_field: 'name',
				image_field: '',
				search_fields: 'name',
				allow_rename: true,
				engine: 'InnoDB',
				track_changes: true,
				track_seen: false,
				default_sort_order: 'asc',
				hide_toolbar: false,
			};
			
			const migrationSQL = sqlGenerator.generateMigrationSQL(complexSchemaDiff, 'ComplexDocType');
			
			// Should have forward and rollback statements
			expect(migrationSQL.forward).toBeDefined();
			expect(migrationSQL.rollback).toBeDefined();
			
			// Should be marked as destructive due to removed columns
			expect(migrationSQL.destructive).toBe(true);
			
			// Should have warnings about data loss
			expect(migrationSQL.warnings.length).toBeGreaterThan(0);
			expect(migrationSQL.warnings.some(w => w.includes('Removing column'))).toBe(true);
			
			// Should have metadata
			expect(migrationSQL.metadata).toBeDefined();
			expect(migrationSQL.metadata.doctype).toBe('ComplexDocType');
			expect(migrationSQL.metadata.diff).toBe(complexSchemaDiff);
			
			// Should have estimated execution time
			expect(migrationSQL.estimatedTime).toBeGreaterThan(0);
		});
		
		it('should handle empty schema diff', () => {
			const emptyDiff: SchemaDiff = {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			};
			
			const migrationSQL = sqlGenerator.generateMigrationSQL(emptyDiff, 'EmptyDocType');
			
			// Should have no statements
			expect(migrationSQL.forward).toHaveLength(0);
			expect(migrationSQL.rollback).toHaveLength(0);
			
			// Should not be destructive
			expect(migrationSQL.destructive).toBe(false);
			
			// Should have no warnings
			expect(migrationSQL.warnings).toHaveLength(0);
			
			// Should have metadata
			expect(migrationSQL.metadata).toBeDefined();
			expect(migrationSQL.metadata.doctype).toBe('EmptyDocType');
			expect(migrationSQL.metadata.diff).toBe(emptyDiff);
		});
		
		it('should generate proper SQL for table creation', () => {
			const createTableDiff: SchemaDiff = {
				addedColumns: [
					{
						fieldname: 'id',
						column: {
							name: 'id',
							type: 'integer',
							nullable: false,
							default_value: null,
							primary_key: true,
							auto_increment: true,
							unique: true
						},
						destructive: false
					},
					{
						fieldname: 'name',
						column: {
							name: 'name',
							type: 'varchar',
							nullable: false,
							default_value: null,
							primary_key: false,
							auto_increment: false,
							unique: false,
							length: 100
						},
						destructive: false
					}
				],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			};
			
			const migrationSQL = sqlGenerator.generateMigrationSQL(createTableDiff, 'NewDocType');
			
			// Should have CREATE TABLE statement
			const createTableStatement = migrationSQL.forward.find(s => s.type === 'create_table');
			expect(createTableStatement).toBeDefined();
			expect(createTableStatement?.sql).toContain('CREATE TABLE `tabNewDocType`');
			expect(createTableStatement?.sql).toContain('`id` integer PRIMARY KEY AUTOINCREMENT');
			expect(createTableStatement?.sql).toContain('`name` varchar(100) NOT NULL');
			
			// Should have proper DROP TABLE in rollback
			const dropTableStatement = migrationSQL.rollback.find(s => s.type === 'drop_table');
			expect(dropTableStatement).toBeDefined();
			expect(dropTableStatement?.sql).toContain('DROP TABLE `tabNewDocType`');
		});
		
		it('should generate proper SQL for column addition', () => {
			const addColumnDiff: SchemaDiff = {
				addedColumns: [
					{
						fieldname: 'email',
						column: {
							name: 'email',
							type: 'varchar',
							nullable: true,
							default_value: null,
							primary_key: false,
							auto_increment: false,
							unique: true,
							length: 255
						},
						destructive: false
					}
				],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			};
			
			const migrationSQL = sqlGenerator.generateMigrationSQL(addColumnDiff, 'ExistingDocType');
			
			// Should have ALTER TABLE ADD COLUMN statement
			const addColumnStatement = migrationSQL.forward.find(s => s.type === 'alter_table' && s.column === 'email');
			expect(addColumnStatement).toBeDefined();
			expect(addColumnStatement?.sql).toContain('ALTER TABLE `tabExistingDocType` ADD COLUMN `email` varchar(255) UNIQUE');
			
			// Should have ALTER TABLE DROP COLUMN in rollback
			const dropColumnStatement = migrationSQL.rollback.find(s => s.type === 'alter_table' && s.column === 'email');
			expect(dropColumnStatement).toBeDefined();
			expect(dropColumnStatement?.sql).toContain('ALTER TABLE `tabExistingDocType` DROP COLUMN `email`');
		});
		
		it('should generate proper SQL for index creation', () => {
			const addIndexDiff: SchemaDiff = {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [
					{
						name: 'idx_new_field',
						index: {
							name: 'idx_new_field',
							columns: ['new_field'],
							unique: false
						},
						destructive: false
					}
				],
				removedIndexes: [],
				renamedColumns: []
			};
			
			const migrationSQL = sqlGenerator.generateMigrationSQL(addIndexDiff, 'IndexedDocType');
			
			// Should have CREATE INDEX statement
			const createIndexStatement = migrationSQL.forward.find(s => s.type === 'create_index');
			expect(createIndexStatement).toBeDefined();
			expect(createIndexStatement?.sql).toContain('CREATE INDEX `idx_new_field` ON `tabIndexedDocType` (`new_field`)');
			
			// Should have DROP INDEX in rollback
			const dropIndexStatement = migrationSQL.rollback.find(s => s.type === 'drop_index');
			expect(dropIndexStatement).toBeDefined();
			expect(dropIndexStatement?.sql).toContain('DROP INDEX `idx_new_field`');
		});
		
		it('should generate proper SQL for column modification', () => {
			const modifyColumnDiff: SchemaDiff = {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [
					{
						fieldname: 'age',
						changes: {
							type: { from: 'varchar', to: 'integer' },
							required: { from: false, to: true }
						},
						requiresDataMigration: true,
						destructive: false
					}
				],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			};
			
			const migrationSQL = sqlGenerator.generateMigrationSQL(modifyColumnDiff, 'ModifiedDocType');
			
			// Should have table rebuild statements for column modification
			const rebuildStatements = migrationSQL.forward.filter(s => s.sql.includes('CREATE TABLE') && s.sql.includes('_temp_'));
			expect(rebuildStatements.length).toBeGreaterThan(0);
			
			// Should have data migration warning
			expect(migrationSQL.warnings.some(w => w.includes('data migration') || w.includes('type conversion'))).toBe(true);
		});
		
		it('should generate proper SQL for column rename', () => {
			const renameColumnDiff: SchemaDiff = {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: [
					{
						from: 'old_name',
						to: 'new_name',
						column: {
							name: 'new_name',
							type: 'varchar',
							nullable: true,
							default_value: null,
							primary_key: false,
							auto_increment: false,
							unique: false,
							length: 100
						}
					}
				]
			};
			
			const migrationSQL = sqlGenerator.generateMigrationSQL(renameColumnDiff, 'RenamedDocType');
			
			// Should have table rebuild statements for column rename
			const rebuildStatements = migrationSQL.forward.filter(s => s.sql.includes('CREATE TABLE') && s.sql.includes('_temp_'));
			expect(rebuildStatements.length).toBeGreaterThan(0);
			
			// Should have proper rename logic in SQL
			const allSQL = migrationSQL.forward.map(s => s.sql).join(' ');
			expect(allSQL).toContain('old_name AS new_name');
		});
	});
	
	describe('Component integration', () => {
		it('should integrate all components properly', () => {
			// Test that all components are working together
			const field: DocField = {
				fieldname: 'test_field',
				label: 'Test Field',
				fieldtype: 'Data',
				length: 100,
				required: true,
				unique: true
			};
			
			// Generate CREATE TABLE SQL
			const createTableSQL = sqlGenerator.generateCreateTableSQL({
				name: 'TestDocType',
				module: 'Test',
				fields: [field],
				permissions: [],
				indexes: [],
				actions: [],
				links: [],
				autoname: '',
				title_field: 'name',
				image_field: '',
				search_fields: 'name',
				allow_rename: true,
				engine: 'InnoDB',
				track_changes: true,
				track_seen: false,
				hide_toolbar: false,
			});
			
			// Verify SQL contains all expected elements
			expect(createTableSQL[0].sql).toContain('CREATE TABLE `tabTestDocType`');
			expect(createTableSQL[0].sql).toContain('`test_field` varchar(100) NOT NULL UNIQUE');
			expect(createTableSQL[0].sql).toContain('PRIMARY KEY (`name`)');
			expect(createTableSQL[0].sql).toContain('-- Create table for DocType: TestDocType');
		});
	});
	
	describe('Error handling', () => {
		it('should handle invalid DocType gracefully', () => {
			const invalidDocType = {
				name: '', // Invalid empty name
				module: 'Test',
				fields: [],
				permissions: [],
				indexes: [],
				actions: [],
				links: [],
				autoname: '',
				naming_rule: null,
				title_field: 'name',
				name_field: 'name',
				image_field: '',
				search_fields: 'name',
				allow_rename: true,
				engine: 'InnoDB',
				track_changes: true,
				track_seen: false,
				track_views: 0,
				sort_order: 'asc',
				sort_field: 'modified',
				hide_toolbar: false,
				hide_name_filter: false,
				hide_name_column: false,
				read_only: false,
				read_only_onload: false,
				in_create: false,
				allow_copy: true,
				allow_export: true,
				allow_events_in_timeline: true,
				email_append_to: false,
				quick_entry: 1,
				show_name_in_global_search: true,
				default_print_format: '',
				print_format_list: [],
				permissions_grant: [],
				permissions_revoke: [],
				workflow_states: [],
				doctype_list_view: null,
				doctype_list_view_settings: null,
				__newname: null,
				__last_sync_on: null,
				__islocal: null,
				__unedited: null
			};
			
			// Should handle gracefully without throwing
			expect(() => {
				sqlGenerator.generateCreateTableSQL(invalidDocType);
			}).not.toThrow();
		});
		
		it('should handle null values in options', () => {
			const generatorWithNulls = new SQLGenerator(null as any);
			
			const doctype: DocType = {
				name: 'TestDocType',
				module: 'Test',
				fields: [sampleDocFields.basicText],
				permissions: [],
				indexes: [],
				actions: [],
				links: [],
				autoname: '',
				title_field: 'name',
				image_field: '',
				search_fields: 'name',
				allow_rename: true,
				engine: 'InnoDB',
				track_changes: true,
				track_seen: false,
				hide_toolbar: false,
			};
			
			const createTableSQL = generatorWithNulls.generateCreateTableSQL(doctype);
			
			// Should work with default options
			expect(createTableSQL).toHaveLength(1);
			expect(createTableSQL[0].sql).toContain('CREATE TABLE `tabTestDocType`');
		});
	});
	
	describe('Performance', () => {
		it('should handle large schema diffs efficiently', () => {
			// Create a large schema diff with many changes
			const largeDiff: SchemaDiff = {
				addedColumns: Array.from({ length: 100 }, (_, i) => ({
						fieldname: `field_${i}`,
						column: {
							name: `field_${i}`,
							type: 'varchar',
							nullable: true,
							default_value: null,
							primary_key: false,
							auto_increment: false,
							unique: false,
							length: 50
						},
						destructive: false
					})),
				removedColumns: Array.from({ length: 50 }, (_, i) => ({
						fieldname: `old_field_${i}`,
						column: {
							name: `old_field_${i}`,
							type: 'varchar',
							nullable: true,
							default_value: null,
							primary_key: false,
							auto_increment: false,
							unique: false,
							length: 50
						},
						destructive: true
					})),
				modifiedColumns: Array.from({ length: 25 }, (_, i) => ({
						fieldname: `mod_field_${i}`,
						changes: {
							type: { from: 'varchar', to: 'text' }
						},
						requiresDataMigration: true,
						destructive: false
					})),
				addedIndexes: Array.from({ length: 10 }, (_, i) => ({
						name: `idx_${i}`,
						index: {
							name: `idx_${i}`,
							columns: [`field_${i}`],
							unique: i % 2 === 0
						},
						destructive: false
					})),
				removedIndexes: Array.from({ length: 5 }, (_, i) => ({
						name: `old_idx_${i}`,
						index: {
							name: `old_idx_${i}`,
							columns: [`field_${i}`],
							unique: false
						},
						destructive: false
					})),
				renamedColumns: Array.from({ length: 15 }, (_, i) => ({
						from: `old_rename_${i}`,
						to: `new_rename_${i}`,
						column: {
							name: `new_rename_${i}`,
							type: 'varchar',
							nullable: true,
							default_value: null,
							primary_key: false,
							auto_increment: false,
							unique: false,
							length: 50
						}
					}))
			};
			
			// Generate migration SQL
			const startTime = Date.now();
			const migrationSQL = sqlGenerator.generateMigrationSQL(largeDiff, 'LargeDocType');
			const endTime = Date.now();
			
			// Should complete in reasonable time
			expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
			
			// Should generate all statements
			expect(migrationSQL.forward.length).toBeGreaterThan(0);
			expect(migrationSQL.rollback.length).toBeGreaterThan(0);
			
			// Should have proper metadata
			expect(migrationSQL.metadata.doctype).toBe('LargeDocType');
			expect(migrationSQL.metadata.diff).toBe(largeDiff);
		});
	});
});