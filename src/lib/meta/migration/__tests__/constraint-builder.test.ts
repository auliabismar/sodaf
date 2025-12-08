/**
 * ConstraintBuilder Tests (P2-007-T10)
 * 
 * This file contains tests for ConstraintBuilder class, which is responsible for
 * building SQL constraints for columns and tables.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConstraintBuilder } from '../sql/constraint-builder';
import type { DocField } from '../../doctype/types';
import type { ColumnDefinition } from '../types';
import type { ColumnConstraintsSQL } from '../sql/sql-types';

describe('ConstraintBuilder', () => {
	let constraintBuilder: ConstraintBuilder;

	beforeEach(() => {
		constraintBuilder = new ConstraintBuilder();
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
			expect(constraints.unique).toBe(false);
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

			expect(constraints.notNull).toBe(false);
			expect(constraints.unique).toBe(false);
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
			expect(constraints.notNull).toBe(false);
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

			expect(constraints.defaultValue).toBe("'Active'");
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

			// null defaults are not set as constraint
			expect(constraints.defaultValue).toBeUndefined();
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
			expect(constraints.foreignKey?.referencedTable).toBe('`UserRole`');
			expect(constraints.foreignKey?.referencedColumn).toBe('`name`');
			expect(constraints.foreignKey?.onDelete).toBe('SET NULL');
			expect(constraints.foreignKey?.onUpdate).toBe('CASCADE');
		});

		it('should not create foreign key for non-Link fields', () => {
			const field: DocField = {
				fieldname: 'data_field',
				label: 'Data Field',
				fieldtype: 'Data',
				required: false,
				unique: false
			};

			const constraints = constraintBuilder.buildColumnConstraints(field);

			expect(constraints.foreignKey).toBeUndefined();
		});

		it('should escape string default values properly', () => {
			const field: DocField = {
				fieldname: 'quote_field',
				label: 'Quote Field',
				fieldtype: 'Data',
				required: false,
				unique: false,
				default: "O'Reilly"
			};

			const constraints = constraintBuilder.buildColumnConstraints(field);

			expect(constraints.defaultValue).toBe("'O''Reilly'");
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
				defaultValue: "'default_value'"
			};

			const columnDef = constraintBuilder.buildColumnDefinition(column, constraints);

			expect(columnDef).toContain('`test_column`');
			expect(columnDef).toContain('varchar');
			expect(columnDef).toContain("DEFAULT 'default_value'");
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
			expect(columnDef).toContain('varchar');
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
				check: 'CHECK (age >= 0)'
			};

			const columnDef = constraintBuilder.buildColumnDefinition(column, constraints);

			expect(columnDef).toContain('`age_column`');
			expect(columnDef).toContain('integer');
			expect(columnDef).toContain('CHECK (age >= 0)');
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
		});

		it('should handle all constraint types together', () => {
			const column: ColumnDefinition = {
				name: 'full_column',
				type: 'varchar',
				nullable: false,
				default_value: 'test',
				primary_key: false,
				auto_increment: false,
				unique: true,
				length: 100
			};

			const constraints: ColumnConstraintsSQL = {
				notNull: true,
				unique: true,
				defaultValue: "'test'",
				collate: 'BINARY'
			};

			const columnDef = constraintBuilder.buildColumnDefinition(column, constraints);

			expect(columnDef).toContain('`full_column`');
			expect(columnDef).toContain('varchar');
			expect(columnDef).toContain('NOT NULL');
			expect(columnDef).toContain('UNIQUE');
			expect(columnDef).toContain("DEFAULT 'test'");
			expect(columnDef).toContain('COLLATE BINARY');
		});
	});

	describe('buildTableConstraints', () => {
		it('should build empty constraints for no columns', () => {
			const columns: ColumnDefinition[] = [];

			const constraints = constraintBuilder.buildTableConstraints(columns);

			expect(constraints).toHaveLength(0);
		});

		it('should return empty for single primary key column', () => {
			// Single primary key is handled in column definition, not table constraints
			const columns: ColumnDefinition[] = [
				{
					name: 'id',
					type: 'integer',
					nullable: false,
					default_value: null,
					primary_key: true,
					auto_increment: true,
					unique: true
				}
			];

			const constraints = constraintBuilder.buildTableConstraints(columns);

			// Single PK is part of column definition, so table constraints should be empty
			expect(constraints).toHaveLength(0);
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
				}
			];

			const constraints = constraintBuilder.buildTableConstraints(columns);

			expect(constraints).toHaveLength(1);
			expect(constraints[0]).toContain('PRIMARY KEY');
			expect(constraints[0]).toContain('`user_id`');
			expect(constraints[0]).toContain('`role_id`');
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
			expect(constraints[0]).toContain('FOREIGN KEY');
			expect(constraints[0]).toContain('`user_id`');
			expect(constraints[0]).toContain('tabUser');
			expect(constraints[0]).toContain('ON DELETE SET NULL');
			expect(constraints[0]).toContain('ON UPDATE CASCADE');
		});
	});

	describe('buildNotNullConstraint', () => {
		it('should return NOT NULL for required fields', () => {
			expect(constraintBuilder.buildNotNullConstraint(true)).toBe('NOT NULL');
		});

		it('should return undefined for optional fields', () => {
			expect(constraintBuilder.buildNotNullConstraint(false)).toBeUndefined();
		});
	});

	describe('buildUniqueConstraint', () => {
		it('should return UNIQUE for unique fields', () => {
			expect(constraintBuilder.buildUniqueConstraint(true)).toBe('UNIQUE');
		});

		it('should return undefined for non-unique fields', () => {
			expect(constraintBuilder.buildUniqueConstraint(false)).toBeUndefined();
		});
	});

	describe('validateConstraint', () => {
		it('should validate NOT NULL constraint', () => {
			expect(constraintBuilder.validateConstraint('NOT NULL', 'Data')).toBe(true);
		});

		it('should validate UNIQUE constraint', () => {
			expect(constraintBuilder.validateConstraint('UNIQUE', 'Data')).toBe(true);
		});

		it('should validate CHECK constraint', () => {
			expect(constraintBuilder.validateConstraint('CHECK (age >= 0)', 'Int')).toBe(true);
		});

		it('should reject invalid constraint', () => {
			expect(constraintBuilder.validateConstraint('INVALID', 'Data')).toBe(false);
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