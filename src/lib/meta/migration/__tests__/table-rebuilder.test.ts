/**
 * TableRebuilder Tests (P2-007-T3, T4)
 * 
 * This file contains tests for TableRebuilder class, which is responsible for
 * generating SQLite table rebuild SQL statements for column operations that
 * SQLite doesn't support directly (DROP COLUMN, MODIFY COLUMN).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TableRebuilder } from '../sql/table-rebuilder';
import type { DocField } from '../../doctype/types';
import type { FieldChange, ColumnRename } from '../types';
import type { TableRebuildStrategy } from '../sql/sql-types';
import { sampleDocFields } from './fixtures/test-data';

describe('TableRebuilder', () => {
	let tableRebuilder: TableRebuilder;
	let defaultStrategy: TableRebuildStrategy;
	
	beforeEach(() => {
		tableRebuilder = new TableRebuilder();
		defaultStrategy = {
			useTempTable: true,
			tempTablePattern: '{table}_temp_{timestamp}',
			copyStrategy: 'batch',
			batchSize: 1000,
			dropOriginal: true,
			verifyData: true,
			preserveIndexes: false,
			preserveForeignKeys: false,
			preserveTriggers: false
		};
	});
	
	afterEach(() => {
		tableRebuilder = null as any;
	});
	
	describe('buildDropColumnRebuild', () => {
		it('should generate SQL to drop a column using table rebuild', () => {
			const fieldToDrop: DocField = {
				fieldname: 'old_field',
				label: 'Old Field',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			const statements = tableRebuilder.buildDropColumnRebuild(
				'TestDocType',
				'old_field',
				defaultStrategy
			);
			
			// Should have multiple statements for table rebuild
			expect(statements.length).toBeGreaterThan(1);
			
			// Should include temp table creation
			const createTempTable = statements.find(s => 
				s.sql.includes('CREATE TABLE') && s.sql.includes('_temp_')
			);
			expect(createTempTable).toBeDefined();
			
			// Should include data copy (excluding dropped column)
			const copyData = statements.find(s => 
				s.sql.includes('INSERT INTO') && s.sql.includes('_temp_')
			);
			expect(copyData).toBeDefined();
			expect(copyData?.sql).not.toContain('old_field');
			
			// Should include original table drop
			const dropOriginal = statements.find(s => 
				s.sql.includes('DROP TABLE') && !s.sql.includes('_temp_')
			);
			expect(dropOriginal).toBeDefined();
			
			// Should include table rename
			const renameTable = statements.find(s => 
				s.sql.includes('ALTER TABLE') && s.sql.includes('RENAME TO')
			);
			expect(renameTable).toBeDefined();
		});
		
		it('should generate temp table name with timestamp', () => {
			const fieldToDrop: DocField = {
				fieldname: 'field_to_drop',
				label: 'Field to Drop',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			const statements = tableRebuilder.buildDropColumnRebuild(
				'TestDocType',
				'field_to_drop',
				defaultStrategy
			);
			
			// Should include timestamp in temp table name
			const createTempTable = statements.find(s => 
				s.sql.includes('CREATE TABLE') && s.sql.includes('_temp_')
			);
			expect(createTempTable?.sql).toMatch(/tabTestDocType_temp_\d+/);
		});
		
		it('should preserve all columns except the one being dropped', () => {
			const fieldToDrop: DocField = {
				fieldname: 'drop_me',
				label: 'Drop Me',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			const statements = tableRebuilder.buildDropColumnRebuild(
				'TestDocType',
				'drop_me',
				defaultStrategy
			);
			
			// Find the INSERT statement
			const insertStatement = statements.find(s => 
				s.sql.includes('INSERT INTO') && s.sql.includes('SELECT')
			);
			
			// Should include other columns but not the dropped one
			expect(insertStatement?.sql).toContain('name');
			expect(insertStatement?.sql).toContain('email');
			expect(insertStatement?.sql).toContain('age');
			expect(insertStatement?.sql).not.toContain('drop_me');
		});
		
		it('should handle dropping multiple columns', () => {
			const fieldToDrop: DocField = {
				fieldname: 'field1',
				label: 'Field 1',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			const statements = tableRebuilder.buildDropColumnRebuild(
				'TestDocType',
				'field1,field2,field3',
				defaultStrategy
			);
			
			// Find the INSERT statement
			const insertStatement = statements.find(s => 
				s.sql.includes('INSERT INTO') && s.sql.includes('SELECT')
			);
			
			// Should exclude all dropped columns
			expect(insertStatement?.sql).not.toContain('field1');
			expect(insertStatement?.sql).not.toContain('field2');
			expect(insertStatement?.sql).not.toContain('field3');
		});
		
		it('should handle custom temp table pattern', () => {
			const customStrategy = {
				...defaultStrategy,
				tempTablePattern: 'temp_{table}_{timestamp}'
			};
			
			const fieldToDrop: DocField = {
				fieldname: 'custom_field',
				label: 'Custom Field',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			const statements = tableRebuilder.buildDropColumnRebuild(
				'TestDocType',
				'custom_field',
				customStrategy
			);
			
			// Should use custom pattern
			const createTempTable = statements.find(s => 
				s.sql.includes('CREATE TABLE') && s.sql.includes('temp_')
			);
			expect(createTempTable?.sql).toMatch(/temp_tabTestDocType_\d+/);
		});
	});
	
	describe('buildModifyColumnRebuild', () => {
		it('should generate SQL to modify a column using table rebuild', () => {
			const fieldChange: FieldChange = {
				fieldname: 'age',
				changes: {
					type: { from: 'integer', to: 'varchar' },
					required: { from: false, to: true }
				},
				requiresDataMigration: true,
				destructive: false
			};
			
			const statements = tableRebuilder.buildModifyColumnRebuild(
				'TestDocType',
				fieldChange,
				defaultStrategy
			);
			
			// Should have multiple statements for table rebuild
			expect(statements.length).toBeGreaterThan(1);
			
			// Should include temp table creation
			const createTempTable = statements.find(s => 
				s.sql.includes('CREATE TABLE') && s.sql.includes('_temp_')
			);
			expect(createTempTable).toBeDefined();
			
			// Should include data copy with type conversion
			const copyData = statements.find(s => 
				s.sql.includes('INSERT INTO') && s.sql.includes('_temp_')
			);
			expect(copyData).toBeDefined();
			
			// Should include original table drop
			const dropOriginal = statements.find(s => 
				s.sql.includes('DROP TABLE') && !s.sql.includes('_temp_')
			);
			expect(dropOriginal).toBeDefined();
			
			// Should include table rename
			const renameTable = statements.find(s => 
				s.sql.includes('ALTER TABLE') && s.sql.includes('RENAME TO')
			);
			expect(renameTable).toBeDefined();
		});
		
		it('should handle type conversion in data copy', () => {
			const fieldChange: FieldChange = {
				fieldname: 'status',
				changes: {
					type: { from: 'integer', to: 'varchar' }
				},
				requiresDataMigration: true,
				destructive: false
			};
			
			const statements = tableRebuilder.buildModifyColumnRebuild(
				'TestDocType',
				fieldChange,
				defaultStrategy
			);
			
			// Find the INSERT statement
			const insertStatement = statements.find(s => 
				s.sql.includes('INSERT INTO') && s.sql.includes('SELECT')
			);
			
			// Should include CAST for type conversion
			expect(insertStatement?.sql).toContain('CAST');
		});
		
		it('should handle length change', () => {
			const fieldChange: FieldChange = {
				fieldname: 'name',
				changes: {
					length: { from: 100, to: 200 }
				},
				requiresDataMigration: false,
				destructive: false
			};
			
			const statements = tableRebuilder.buildModifyColumnRebuild(
				'TestDocType',
				fieldChange,
				defaultStrategy
			);
			
			// Should create temp table with new column definition
			const createTempTable = statements.find(s => 
				s.sql.includes('CREATE TABLE') && s.sql.includes('_temp_')
			);
			expect(createTempTable?.sql).toContain('varchar(200)');
		});
		
		it('should handle default value change', () => {
			const fieldChange: FieldChange = {
				fieldname: 'status',
				changes: {
					default: { from: 'Active', to: 'Inactive' }
				},
				requiresDataMigration: false,
				destructive: false
			};
			
			const statements = tableRebuilder.buildModifyColumnRebuild(
				'TestDocType',
				fieldChange,
				defaultStrategy
			);
			
			// Should create temp table with new default value
			const createTempTable = statements.find(s => 
				s.sql.includes('CREATE TABLE') && s.sql.includes('_temp_')
			);
			expect(createTempTable?.sql).toContain('DEFAULT \'Inactive\'');
		});
		
		it('should handle nullable change', () => {
			const fieldChange: FieldChange = {
				fieldname: 'optional_field',
				changes: {
					required: { from: false, to: true }
				},
				requiresDataMigration: false,
				destructive: false
			};
			
			const statements = tableRebuilder.buildModifyColumnRebuild(
				'TestDocType',
				fieldChange,
				defaultStrategy
			);
			
			// Should create temp table with NOT NULL constraint
			const createTempTable = statements.find(s => 
				s.sql.includes('CREATE TABLE') && s.sql.includes('_temp_')
			);
			expect(createTempTable?.sql).toContain('NOT NULL');
		});
		
		it('should handle unique constraint change', () => {
			const fieldChange: FieldChange = {
				fieldname: 'email',
				changes: {
					unique: { from: false, to: true }
				},
				requiresDataMigration: false,
				destructive: false
			};
			
			const statements = tableRebuilder.buildModifyColumnRebuild(
				'TestDocType',
				fieldChange,
				defaultStrategy
			);
			
			// Should create temp table with UNIQUE constraint
			const createTempTable = statements.find(s => 
				s.sql.includes('CREATE TABLE') && s.sql.includes('_temp_')
			);
			expect(createTempTable?.sql).toContain('UNIQUE');
		});
	});
	
	describe('buildRenameColumnRebuild', () => {
		it('should generate SQL to rename a column using table rebuild', () => {
			const columnRename: ColumnRename = {
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
			};
			
			const statements = tableRebuilder.buildDropColumnRebuild(
				'TestDocType',
				'old_name',
				defaultStrategy
			);
			
			// Should have multiple statements for table rebuild
			expect(statements.length).toBeGreaterThan(1);
			
			// Should include temp table creation
			const createTempTable = statements.find((s: any) =>
				s.sql.includes('CREATE TABLE') && s.sql.includes('_temp_')
			);
			expect(createTempTable).toBeDefined();
			
			// Should include data copy with renamed column
			const copyData = statements.find((s: any) =>
				s.sql.includes('INSERT INTO') && s.sql.includes('_temp_')
			);
			expect(copyData).toBeDefined();
			expect(copyData?.sql).toContain('old_name AS new_name');
			
			// Should include original table drop
			const dropOriginal = statements.find((s: any) =>
				s.sql.includes('DROP TABLE') && !s.sql.includes('_temp_')
			);
			expect(dropOriginal).toBeDefined();
			
			// Should include table rename
			const renameTable = statements.find((s: any) =>
				s.sql.includes('ALTER TABLE') && s.sql.includes('RENAME TO')
			);
			expect(renameTable).toBeDefined();
		});
	});
	
	describe('generateTempTableName', () => {
		it('should generate temp table name with default pattern', () => {
			const tempTableName = tableRebuilder.generateTempTableName('TestDocType', defaultStrategy);
			
			expect(tempTableName).toMatch(/tabTestDocType_temp_\d+/);
		});
		
		it('should generate temp table name with custom pattern', () => {
			const customStrategy = {
				...defaultStrategy,
				tempTablePattern: 'tmp_{table}_{timestamp}'
			};
			
			const tempTableName = tableRebuilder.generateTempTableName('TestDocType', customStrategy);
			
			expect(tempTableName).toMatch(/tmp_tabTestDocType_\d+/);
		});
		
		it('should generate unique temp table names', () => {
			const tempName1 = tableRebuilder.generateTempTableName('TestDocType', defaultStrategy);
			const tempName2 = tableRebuilder.generateTempTableName('TestDocType', defaultStrategy);
			
			// Names should be different due to different timestamps
			expect(tempName1).not.toBe(tempName2);
		});
	});
	
	describe('Custom strategies', () => {
		it('should handle strategy without temp table', () => {
			const noTempStrategy = {
				...defaultStrategy,
				useTempTable: false
			};
			
			const fieldToDrop: DocField = {
				fieldname: 'field_to_drop',
				label: 'Field to Drop',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			const statements = tableRebuilder.buildDropColumnRebuild(
				'TestDocType',
				'field_to_drop',
				noTempStrategy
			);
			
			// Should not include temp table creation
			const createTempTable = statements.find(s => 
				s.sql.includes('CREATE TABLE') && s.sql.includes('_temp_')
			);
			expect(createTempTable).toBeUndefined();
		});
		
		it('should handle single copy strategy', () => {
			const singleCopyStrategy = {
				...defaultStrategy,
				copyStrategy: 'single' as const
			};
			
			const fieldToDrop: DocField = {
				fieldname: 'field_to_drop',
				label: 'Field to Drop',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			const statements = tableRebuilder.buildDropColumnRebuild(
				'TestDocType',
				'field_to_drop',
				singleCopyStrategy
			);
			
			// Should still generate the basic rebuild structure
			expect(statements.length).toBeGreaterThan(1);
		});
		
		it('should handle cursor copy strategy', () => {
			const cursorCopyStrategy = {
				...defaultStrategy,
				copyStrategy: 'cursor' as const
			};
			
			const fieldToDrop: DocField = {
				fieldname: 'field_to_drop',
				label: 'Field to Drop',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			const statements = tableRebuilder.buildDropColumnRebuild(
				'TestDocType',
				'field_to_drop',
				cursorCopyStrategy
			);
			
			// Should still generate the basic rebuild structure
			expect(statements.length).toBeGreaterThan(1);
		});
		
		it('should handle strategy without dropping original table', () => {
			const keepOriginalStrategy = {
				...defaultStrategy,
				dropOriginal: false
			};
			
			const fieldToDrop: DocField = {
				fieldname: 'field_to_drop',
				label: 'Field to Drop',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			const statements = tableRebuilder.buildDropColumnRebuild(
				'TestDocType',
				'field_to_drop',
				keepOriginalStrategy
			);
			
			// Should not include original table drop
			const dropOriginal = statements.find(s => 
				s.sql.includes('DROP TABLE') && !s.sql.includes('_temp_')
			);
			expect(dropOriginal).toBeUndefined();
		});
		
		it('should handle strategy without data verification', () => {
			const noVerifyStrategy = {
				...defaultStrategy,
				verifyData: false
			};
			
			const fieldToDrop: DocField = {
				fieldname: 'field_to_drop',
				label: 'Field to Drop',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			const statements = tableRebuilder.buildDropColumnRebuild(
				'TestDocType',
				'field_to_drop',
				noVerifyStrategy
			);
			
			// Should not include verification queries
			const verifyQuery = statements.find(s => 
				s.sql.includes('SELECT COUNT(*)') || s.sql.includes('SELECT COUNT(*)')
			);
			expect(verifyQuery).toBeUndefined();
		});
	});
	
	describe('Error handling', () => {
		it('should handle empty table name', () => {
			const fieldToDrop: DocField = {
				fieldname: 'field_to_drop',
				label: 'Field to Drop',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			expect(() => {
				tableRebuilder.buildDropColumnRebuild('', 'field_to_drop', defaultStrategy);
			}).toThrow();
		});
		
		it('should handle null table name', () => {
			const fieldToDrop: DocField = {
				fieldname: 'field_to_drop',
				label: 'Field to Drop',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			expect(() => {
				tableRebuilder.buildDropColumnRebuild(null as any, 'field_to_drop', defaultStrategy);
			}).toThrow();
		});
		
		it('should handle empty field name', () => {
			const fieldToDrop: DocField = {
				fieldname: 'field_to_drop',
				label: 'Field to Drop',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			expect(() => {
				tableRebuilder.buildDropColumnRebuild('TestDocType', '', defaultStrategy);
			}).toThrow();
		});
		
		it('should handle null field name', () => {
			const fieldToDrop: DocField = {
				fieldname: 'field_to_drop',
				label: 'Field to Drop',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			expect(() => {
				tableRebuilder.buildDropColumnRebuild('TestDocType', null as any, defaultStrategy);
			}).toThrow();
		});
	});
});