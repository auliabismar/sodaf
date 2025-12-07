/**
 * ConstraintBuilder Tests (P2-007-T10)
 * 
 * This file contains tests for ConstraintBuilder class, which is responsible for
 * building SQL constraints for columns and tables.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConstraintBuilder } from '../sql/constraint-builder';
import type { DocField } from '../../doctype/types';
import type { ColumnDefinition } from '../types';
import type { ColumnDefinitionSQL, ColumnConstraintsSQL } from '../sql/sql-types';
import { InvalidConstraintError } from '../sql/sql-types';

describe('ConstraintBuilder', () => {
	let constraintBuilder: ConstraintBuilder;
	
	beforeEach(() => {
		constraintBuilder = new ConstraintBuilder();
	});
	
	afterEach(() => {
		constraintBuilder = null as any;
	});
	
	describe('buildColumnConstraints', () => {
		it('should build constraints for required field', () => {
			const field: DocField = {
				fieldname: 'required_field',
				label: 'Required Field',
				fieldtype: 'Data',
				required: true,
				unique: false
			};
			
			const constraints = constraintBuilder.buildColumnConstraints(field);
			
			expect(constraints.notNull).toBe(true);
			expect(constraints.unique).toBeUndefined();
			expect(constraints.defaultValue).toBeUndefined();
			expect(constraints.check).toBeUndefined();
			expect(constraints.foreignKey).toBeUndefined();
		});
		
		it('should build constraints for optional field', () => {
			const field: DocField = {
				fieldname: 'optional_field',
				label: 'Optional Field',
				fieldtype: 'Data',
				required: false,
				unique: false
			};
			
			const constraints = constraintBuilder.buildColumnConstraints(field);
			
			expect(constraints.notNull).toBeUndefined();
			expect(constraints.unique).toBeUndefined();
			expect(constraints.defaultValue).toBeUndefined();
		});
		
		it('should build constraints for unique field', () => {
			const field: DocField = {
				fieldname: 'unique_field',
				label: 'Unique Field',
				fieldtype: 'Data',
				required: false,
				unique: true
			};
			
			const constraints = constraintBuilder.buildColumnConstraints(field);
			
			expect(constraints.unique).toBe(true);
			expect(constraints.notNull).toBeUndefined();
			expect(constraints.defaultValue).toBeUndefined();
		});
		
		it('should build constraints for required and unique field', () => {
			const field: DocField = {
				fieldname: 'required_unique_field',
				label: 'Required Unique Field',
				fieldtype: 'Data',
				required: true,
				unique: true
			};
			
			const constraints = constraintBuilder.buildColumnConstraints(field);
			
			expect(constraints.notNull).toBe(true);
			expect(constraints.unique).toBe(true);
		});
		
		it('should build constraints for field with string default', () => {
			const field: DocField = {
				fieldname: 'status_field',
				label: 'Status Field',
				fieldtype: 'Data',
				required: false,
				unique: false,
				default: 'Active'
			};
			
			const constraints = constraintBuilder.buildColumnConstraints(field);
			
			expect(constraints.defaultValue).toBe('\'Active\'');
		});
		
		it('should build constraints for field with numeric default', () => {
			const field: DocField = {
				fieldname: 'count_field',
				label: 'Count Field',
				fieldtype: 'Int',
				required: false,
				unique: false,
				default: 0
			};
			
			const constraints = constraintBuilder.buildColumnConstraints(field);
			
			expect(constraints.defaultValue).toBe('0');
		});
		
		it('should build constraints for field with boolean default', () => {
			const field: DocField = {
				fieldname: 'is_active_field',
				label: 'Is Active Field',
				fieldtype: 'Check',
				required: false,
				unique: false,
				default: 1
			};
			
			const constraints = constraintBuilder.buildColumnConstraints(field);
			
			expect(constraints.defaultValue).toBe('1');
		});
		
		it('should build constraints for field with null default', () => {
			const field: DocField = {
				fieldname: 'nullable_field',
				label: 'Nullable Field',
				fieldtype: 'Data',
				required: false,
				unique: false,
				default: null
			};
			
			const constraints = constraintBuilder.buildColumnConstraints(field);
			
			expect(constraints.defaultValue).toBe('NULL');
		});
		
		it('should build constraints for Link field with foreign key', () => {
			const field: DocField = {
				fieldname: 'user_role_field',
				label: 'User Role Field',
				fieldtype: 'Link',
				options: 'UserRole',
				required: false,
				unique: false
			};
			
			const constraints = constraintBuilder.buildColumnConstraints(field);
			
			expect(constraints.foreignKey).toBeDefined();
			expect(constraints.foreignKey?.referencedTable).toBe('tabUserRole');
			expect(constraints.foreignKey?.referencedColumn).toBe('name');
			expect(constraints.foreignKey?.onDelete).toBe('SET NULL');
			expect(constraints.foreignKey?.onUpdate).toBe('CASCADE');
		});
		
		it('should handle Link field with custom table name', () => {
			const field: DocField = {
				fieldname: 'custom_link_field',
				label: 'Custom Link Field',
				fieldtype: 'Link',
				options: 'CustomDocType:custom_table_name',
				required: false,
				unique: false
			};
			
			const constraints = constraintBuilder.buildColumnConstraints(field);
			
			expect(constraints.foreignKey?.referencedTable).toBe('custom_table_name');
		});
		
		it('should escape string default values properly', () => {
			const field: DocField = {
				fieldname: 'quote_field',
				label: 'Quote Field',
				fieldtype: 'Data',
				required: false,
				unique: false,
				default: 'O\'Reilly'
			};
			
			const constraints = constraintBuilder.buildColumnConstraints(field);
			
			expect(constraints.defaultValue).toBe('\'O\'\'Reilly\'');
		});
	});
	
	describe('buildColumnDefinition', () => {
		it('should build complete column definition', () => {
			const column: ColumnDefinition = {
				name: 'test_column',
				type: 'varchar',
				nullable: true,
				default_value: 'default_value',
				primary_key: false,
				auto_increment: false,
				unique: false,
				length: 100
			};
			
			const constraints: ColumnConstraintsSQL = {
				notNull: false,
				unique: false,
				defaultValue: '\'default_value\''
			};
			
			const columnDef = constraintBuilder.buildColumnDefinition(column, constraints);
			
			expect(columnDef).toContain('`test_column`');
			expect(columnDef).toContain('varchar(100)');
			expect(columnDef).toContain('DEFAULT \'default_value\'');
		});
		
		it('should build column definition with NOT NULL', () => {
			const column: ColumnDefinition = {
				name: 'required_column',
				type: 'integer',
				nullable: false,
				default_value: null,
				primary_key: false,
				auto_increment: false,
				unique: false
			};
			
			const constraints: ColumnConstraintsSQL = {
				notNull: true
			};
			
			const columnDef = constraintBuilder.buildColumnDefinition(column, constraints);
			
			expect(columnDef).toContain('`required_column`');
			expect(columnDef).toContain('integer');
			expect(columnDef).toContain('NOT NULL');
		});
		
		it('should build column definition with UNIQUE', () => {
			const column: ColumnDefinition = {
				name: 'unique_column',
				type: 'varchar',
				nullable: true,
				default_value: null,
				primary_key: false,
				auto_increment: false,
				unique: true,
				length: 50
			};
			
			const constraints: ColumnConstraintsSQL = {
				unique: true
			};
			
			const columnDef = constraintBuilder.buildColumnDefinition(column, constraints);
			
			expect(columnDef).toContain('`unique_column`');
			expect(columnDef).toContain('varchar(50)');
			expect(columnDef).toContain('UNIQUE');
		});
		
		it('should build column definition with PRIMARY KEY', () => {
			const column: ColumnDefinition = {
				name: 'id_column',
				type: 'integer',
				nullable: false,
				default_value: null,
				primary_key: true,
				auto_increment: true,
				unique: true
			};
			
			const constraints: ColumnConstraintsSQL = {
				notNull: true,
				unique: true
			};
			
			const columnDef = constraintBuilder.buildColumnDefinition(column, constraints);
			
			expect(columnDef).toContain('`id_column`');
			expect(columnDef).toContain('integer');
			expect(columnDef).toContain('PRIMARY KEY');
			expect(columnDef).toContain('AUTOINCREMENT');
		});
		
		it('should build column definition with FOREIGN KEY', () => {
			const column: ColumnDefinition = {
				name: 'user_id_column',
				type: 'integer',
				nullable: true,
				default_value: null,
				primary_key: false,
				auto_increment: false,
				unique: false
			};
			
			const constraints: ColumnConstraintsSQL = {
				foreignKey: {
					referencedTable: 'tabUser',
					referencedColumn: 'id',
					onDelete: 'SET NULL',
					onUpdate: 'CASCADE'
				}
			};
			
			const columnDef = constraintBuilder.buildColumnDefinition(column, constraints);
			
			expect(columnDef).toContain('`user_id_column`');
			expect(columnDef).toContain('integer');
			expect(columnDef).toContain('REFERENCES `tabUser`(`id`)');
			expect(columnDef).toContain('ON DELETE SET NULL');
			expect(columnDef).toContain('ON UPDATE CASCADE');
		});
		
		it('should build column definition with CHECK constraint', () => {
			const column: ColumnDefinition = {
				name: 'age_column',
				type: 'integer',
				nullable: true,
				default_value: null,
				primary_key: false,
				auto_increment: false,
				unique: false
			};
			
			const constraints: ColumnConstraintsSQL = {
				check: 'age >= 0'
			};
			
			const columnDef = constraintBuilder.buildColumnDefinition(column, constraints);
			
			expect(columnDef).toContain('`age_column`');
			expect(columnDef).toContain('integer');
			expect(columnDef).toContain('CHECK (age >= 0)');
		});
		
		it('should build column definition with COLLATE', () => {
			const column: ColumnDefinition = {
				name: 'text_column',
				type: 'text',
				nullable: true,
				default_value: null,
				primary_key: false,
				auto_increment: false,
				unique: false,
				collation: 'utf8_unicode_ci'
			};
			
			const constraints: ColumnConstraintsSQL = {
				collate: 'utf8_unicode_ci'
			};
			
			const columnDef = constraintBuilder.buildColumnDefinition(column, constraints);
			
			expect(columnDef).toContain('`text_column`');
			expect(columnDef).toContain('text');
			expect(columnDef).toContain('COLLATE utf8_unicode_ci');
		});
		
		it('should build column definition with all constraints', () => {
			const column: ColumnDefinition = {
				name: 'full_column',
				type: 'varchar',
				nullable: false,
				default_value: 'test',
				primary_key: false,
				auto_increment: false,
				unique: true,
				length: 100,
				collation: 'utf8_unicode_ci'
			};
			
			const constraints: ColumnConstraintsSQL = {
				notNull: true,
				unique: true,
				defaultValue: '\'test\'',
				check: 'length(full_column) > 0',
				collate: 'utf8_unicode_ci'
			};
			
			const columnDef = constraintBuilder.buildColumnDefinition(column, constraints);
			
			expect(columnDef).toContain('`full_column`');
			expect(columnDef).toContain('varchar(100)');
			expect(columnDef).toContain('NOT NULL');
			expect(columnDef).toContain('UNIQUE');
			expect(columnDef).toContain('DEFAULT \'test\'');
			expect(columnDef).toContain('CHECK (length(full_column) > 0)');
			expect(columnDef).toContain('COLLATE utf8_unicode_ci');
		});
		
		it('should handle text type without length', () => {
			const column: ColumnDefinition = {
				name: 'text_column',
				type: 'text',
				nullable: true,
				default_value: null,
				primary_key: false,
				auto_increment: false,
				unique: false
			};
			
			const constraints: ColumnConstraintsSQL = {};
			
			const columnDef = constraintBuilder.buildColumnDefinition(column, constraints);
			
			expect(columnDef).toContain('`text_column`');
			expect(columnDef).toContain('text');
			// Should not include length for text type
			expect(columnDef).not.toContain('text(');
		});
		
		it('should handle numeric type with precision', () => {
			const column: ColumnDefinition = {
				name: 'decimal_column',
				type: 'decimal',
				nullable: true,
				default_value: null,
				primary_key: false,
				auto_increment: false,
				unique: false,
				length: 10,
				precision: 2
			};
			
			const constraints: ColumnConstraintsSQL = {};
			
			const columnDef = constraintBuilder.buildColumnDefinition(column, constraints);
			
			expect(columnDef).toContain('`decimal_column`');
			expect(columnDef).toContain('decimal(10,2)');
		});
	});
	
	describe('buildTableConstraints', () => {
		it('should build empty constraints for no columns', () => {
			const columns: ColumnDefinition[] = [];
			
			const constraints = constraintBuilder.buildTableConstraints(columns);
			
			expect(constraints).toHaveLength(0);
		});
		
		it('should build primary key constraint for single primary key column', () => {
			const columns: ColumnDefinition[] = [
				{
					name: 'id',
					type: 'integer',
					nullable: false,
					default_value: null,
					primary_key: true,
					auto_increment: true,
					unique: true
				},
				{
					name: 'name',
					type: 'varchar',
					nullable: true,
					default_value: null,
					primary_key: false,
					auto_increment: false,
					unique: false,
					length: 100
				}
			];
			
			const constraints = constraintBuilder.buildTableConstraints(columns);
			
			expect(constraints).toHaveLength(1);
			expect(constraints[0]).toContain('PRIMARY KEY (`id`)');
		});
		
		it('should build composite primary key constraint', () => {
			const columns: ColumnDefinition[] = [
				{
					name: 'user_id',
					type: 'integer',
					nullable: false,
					default_value: null,
					primary_key: true,
					auto_increment: false,
					unique: false
				},
				{
					name: 'role_id',
					type: 'integer',
					nullable: false,
					default_value: null,
					primary_key: true,
					auto_increment: false,
					unique: false
				},
				{
					name: 'name',
					type: 'varchar',
					nullable: true,
					default_value: null,
					primary_key: false,
					auto_increment: false,
					unique: false,
					length: 100
				}
			];
			
			const constraints = constraintBuilder.buildTableConstraints(columns);
			
			expect(constraints).toHaveLength(1);
			expect(constraints[0]).toContain('PRIMARY KEY (`user_id`, `role_id`)');
		});
		
		it('should build unique constraints for unique columns', () => {
			const columns: ColumnDefinition[] = [
				{
					name: 'email',
					type: 'varchar',
					nullable: true,
					default_value: null,
					primary_key: false,
					auto_increment: false,
					unique: true,
					length: 255
				},
				{
					name: 'username',
					type: 'varchar',
					nullable: true,
					default_value: null,
					primary_key: false,
					auto_increment: false,
					unique: true,
					length: 50
				}
			];
			
			const constraints = constraintBuilder.buildTableConstraints(columns);
			
			expect(constraints).toHaveLength(2);
			expect(constraints[0]).toContain('UNIQUE (`email`)');
			expect(constraints[1]).toContain('UNIQUE (`username`)');
		});
		
		it('should build foreign key constraints', () => {
			const columns: ColumnDefinition[] = [
				{
					name: 'user_id',
					type: 'integer',
					nullable: true,
					default_value: null,
					primary_key: false,
					auto_increment: false,
					unique: false,
					foreign_key: {
						referenced_table: 'tabUser',
						referenced_column: 'id',
						on_delete: 'SET NULL',
						on_update: 'CASCADE'
					}
				}
			];
			
			const constraints = constraintBuilder.buildTableConstraints(columns);
			
			expect(constraints).toHaveLength(1);
			expect(constraints[0]).toContain('FOREIGN KEY (`user_id`) REFERENCES `tabUser`(`id`)');
			expect(constraints[0]).toContain('ON DELETE SET NULL');
			expect(constraints[0]).toContain('ON UPDATE CASCADE');
		});
		
		it('should build check constraints', () => {
			const columns: ColumnDefinition[] = [
				{
					name: 'age',
					type: 'integer',
					nullable: true,
					default_value: null,
					primary_key: false,
					auto_increment: false,
					unique: false,
					check: 'age >= 0'
				},
				{
					name: 'status',
					type: 'varchar',
					nullable: true,
					default_value: null,
					primary_key: false,
					auto_increment: false,
					unique: false,
					length: 20,
					check: 'status IN (\'Active\', \'Inactive\')'
				}
			];
			
			const constraints = constraintBuilder.buildTableConstraints(columns);
			
			expect(constraints).toHaveLength(2);
			expect(constraints[0]).toContain('CHECK (age >= 0)');
			expect(constraints[1]).toContain('CHECK (status IN (\'Active\', \'Inactive\'))');
		});
		
		it('should build mixed constraints', () => {
			const columns: ColumnDefinition[] = [
				{
					name: 'id',
					type: 'integer',
					nullable: false,
					default_value: null,
					primary_key: true,
					auto_increment: true,
					unique: true
				},
				{
					name: 'email',
					type: 'varchar',
					nullable: true,
					default_value: null,
					primary_key: false,
					auto_increment: false,
					unique: true,
					length: 255
				},
				{
					name: 'user_id',
					type: 'integer',
					nullable: true,
					default_value: null,
					primary_key: false,
					auto_increment: false,
					unique: false,
					foreign_key: {
						referenced_table: 'tabUser',
						referenced_column: 'id',
						on_delete: 'SET NULL',
						on_update: 'CASCADE'
					}
				},
				{
					name: 'age',
					type: 'integer',
					nullable: true,
					default_value: null,
					primary_key: false,
					auto_increment: false,
					unique: false,
					check: 'age >= 0'
				}
			];
			
			const constraints = constraintBuilder.buildTableConstraints(columns);
			
			expect(constraints).toHaveLength(4);
			expect(constraints[0]).toContain('PRIMARY KEY (`id`)');
			expect(constraints[1]).toContain('UNIQUE (`email`)');
			expect(constraints[2]).toContain('FOREIGN KEY (`user_id`) REFERENCES `tabUser`(`id`)');
			expect(constraints[3]).toContain('CHECK (age >= 0)');
		});
	});
	
	describe('Error handling', () => {
		it('should throw InvalidConstraintError for invalid foreign key', () => {
			const column: ColumnDefinition = {
				name: 'invalid_fk_column',
				type: 'integer',
				nullable: true,
				default_value: null,
				primary_key: false,
				auto_increment: false,
				unique: false
			};
			
			const constraints: ColumnConstraintsSQL = {
				foreignKey: {
					referencedTable: '',
					referencedColumn: 'id',
					onDelete: 'CASCADE',
					onUpdate: 'CASCADE'
				}
			};
			
			expect(() => {
				constraintBuilder.buildColumnDefinition(column, constraints);
			}).toThrow(InvalidConstraintError);
		});
		
		it('should throw InvalidConstraintError for invalid check constraint', () => {
			const column: ColumnDefinition = {
				name: 'invalid_check_column',
				type: 'integer',
				nullable: true,
				default_value: null,
				primary_key: false,
				auto_increment: false,
				unique: false
			};
			
			const constraints: ColumnConstraintsSQL = {
				check: ''
			};
			
			expect(() => {
				constraintBuilder.buildColumnDefinition(column, constraints);
			}).toThrow(InvalidConstraintError);
		});
	});
	
	describe('Custom options', () => {
		it('should use custom identifier quote character', () => {
			const customBuilder = new ConstraintBuilder({ identifierQuote: '"' });
			
			const column: ColumnDefinition = {
				name: 'test_column',
				type: 'varchar',
				nullable: true,
				default_value: null,
				primary_key: false,
				auto_increment: false,
				unique: false,
				length: 100
			};
			
			const constraints: ColumnConstraintsSQL = {};
			
			const columnDef = customBuilder.buildColumnDefinition(column, constraints);
			
			expect(columnDef).toContain('"test_column"');
			expect(columnDef).not.toContain('`test_column`');
		});
		
	});
});