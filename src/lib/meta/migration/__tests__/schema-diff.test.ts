/**
 * Schema Diff Type Tests (P2-005-SD1 to SD7)
 * 
 * This file contains tests for schema diff types to ensure they compile
 * correctly and handle various schema change scenarios.
 */

import { describe, it, expect } from 'vitest';
import type {
	SchemaDiff,
	ColumnChange,
	FieldChange,
	IndexChange,
	ColumnRename,
	ColumnDefinition,
	IndexDefinition
} from '../types';
import {
	addColumnsSchemaDiff,
	removeColumnsSchemaDiff,
	modifyColumnsSchemaDiff,
	renameColumnsSchemaDiff,
	indexChangesSchemaDiff,
	emptySchemaDiff,
	complexSchemaDiff
} from './fixtures/schema-diffs';

describe('Schema Diff Tests', () => {
	/**
	 * Test P2-005-SD1: Create SchemaDiff with added columns
	 */
	it('P2-005-SD1: should create SchemaDiff with added columns', () => {
		const diff: SchemaDiff = addColumnsSchemaDiff;
		
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(2);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
		
		// Check first added column
		const firstAddedColumn = diff.addedColumns[0] as ColumnChange;
		expect(firstAddedColumn.fieldname).toBe('email');
		expect(firstAddedColumn.column.name).toBe('email');
		expect(firstAddedColumn.column.type).toBe('varchar');
		expect(firstAddedColumn.column.nullable).toBe(true);
		expect(firstAddedColumn.column.unique).toBe(true);
		expect(firstAddedColumn.column.length).toBe(255);
		expect(firstAddedColumn.destructive).toBe(false);
		
		// Check second added column
		const secondAddedColumn = diff.addedColumns[1] as ColumnChange;
		expect(secondAddedColumn.fieldname).toBe('created_at');
		expect(secondAddedColumn.column.name).toBe('created_at');
		expect(secondAddedColumn.column.type).toBe('datetime');
		expect(secondAddedColumn.column.nullable).toBe(false);
		expect(secondAddedColumn.column.default_value).toBe('CURRENT_TIMESTAMP');
		expect(secondAddedColumn.destructive).toBe(false);
	});

	/**
	 * Test P2-005-SD2: Create SchemaDiff with removed columns
	 */
	it('P2-005-SD2: should create SchemaDiff with removed columns', () => {
		const diff: SchemaDiff = removeColumnsSchemaDiff;
		
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(1);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
		
		// Check removed column
		const removedColumn = diff.removedColumns[0] as ColumnChange;
		expect(removedColumn.fieldname).toBe('legacy_field');
		expect(removedColumn.column.name).toBe('legacy_field');
		expect(removedColumn.column.type).toBe('text');
		expect(removedColumn.column.nullable).toBe(true);
		expect(removedColumn.destructive).toBe(true);
	});

	/**
	 * Test P2-005-SD3: Create SchemaDiff with modified columns
	 */
	it('P2-005-SD3: should create SchemaDiff with modified columns', () => {
		const diff: SchemaDiff = modifyColumnsSchemaDiff;
		
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(2);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
		
		// Check first modified column
		const firstModifiedColumn = diff.modifiedColumns[0] as FieldChange;
		expect(firstModifiedColumn.fieldname).toBe('username');
		expect(firstModifiedColumn.changes.length?.from).toBe(50);
		expect(firstModifiedColumn.changes.length?.to).toBe(100);
		expect(firstModifiedColumn.changes.required?.from).toBe(false);
		expect(firstModifiedColumn.changes.required?.to).toBe(true);
		expect(firstModifiedColumn.changes.unique?.from).toBe(false);
		expect(firstModifiedColumn.changes.unique?.to).toBe(true);
		expect(firstModifiedColumn.changes.default?.from).toBe(null);
		expect(firstModifiedColumn.changes.default?.to).toBe('guest_user');
		expect(firstModifiedColumn.requiresDataMigration).toBe(true);
		expect(firstModifiedColumn.destructive).toBe(false);
		
		// Check second modified column
		const secondModifiedColumn = diff.modifiedColumns[1] as FieldChange;
		expect(secondModifiedColumn.fieldname).toBe('status');
		expect(secondModifiedColumn.changes.type?.from).toBe('varchar');
		expect(secondModifiedColumn.changes.type?.to).toBe('enum');
		expect(secondModifiedColumn.changes.length?.from).toBe(20);
		expect(secondModifiedColumn.changes.length?.to).toBe(10);
		expect(secondModifiedColumn.changes.nullable?.from).toBe(true);
		expect(secondModifiedColumn.changes.nullable?.to).toBe(false);
		expect(secondModifiedColumn.requiresDataMigration).toBe(true);
		expect(secondModifiedColumn.destructive).toBe(false);
	});

	/**
	 * Test P2-005-SD4: Create SchemaDiff with renamed columns
	 */
	it('P2-005-SD4: should create SchemaDiff with renamed columns', () => {
		const diff: SchemaDiff = renameColumnsSchemaDiff;
		
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(2);
		
		// Check first renamed column
		const firstRenamedColumn = diff.renamedColumns[0] as ColumnRename;
		expect(firstRenamedColumn.from).toBe('old_name');
		expect(firstRenamedColumn.to).toBe('new_name');
		expect(firstRenamedColumn.column.name).toBe('new_name');
		expect(firstRenamedColumn.column.type).toBe('varchar');
		expect(firstRenamedColumn.column.length).toBe(100);
		
		// Check second renamed column
		const secondRenamedColumn = diff.renamedColumns[1] as ColumnRename;
		expect(secondRenamedColumn.from).toBe('legacy_id');
		expect(secondRenamedColumn.to).toBe('reference_id');
		expect(secondRenamedColumn.column.name).toBe('reference_id');
		expect(secondRenamedColumn.column.type).toBe('integer');
		expect(secondRenamedColumn.column.nullable).toBe(false);
	});

	/**
	 * Test P2-005-SD5: Create SchemaDiff with index changes
	 */
	it('P2-005-SD5: should create SchemaDiff with index changes', () => {
		const diff: SchemaDiff = indexChangesSchemaDiff;
		
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(2);
		expect(diff.removedIndexes).toHaveLength(1);
		expect(diff.renamedColumns).toHaveLength(0);
		
		// Check first added index
		const firstAddedIndex = diff.addedIndexes[0] as IndexChange;
		expect(firstAddedIndex.name).toBe('idx_email_unique');
		expect(firstAddedIndex.index.name).toBe('idx_email_unique');
		expect(firstAddedIndex.index.columns).toEqual(['email']);
		expect(firstAddedIndex.index.unique).toBe(true);
		expect(firstAddedIndex.index.type).toBe('btree');
		expect(firstAddedIndex.destructive).toBe(false);
		
		// Check second added index
		const secondAddedIndex = diff.addedIndexes[1] as IndexChange;
		expect(secondAddedIndex.name).toBe('idx_name_status');
		expect(secondAddedIndex.index.name).toBe('idx_name_status');
		expect(secondAddedIndex.index.columns).toEqual(['name', 'status']);
		expect(secondAddedIndex.index.unique).toBe(false);
		expect(secondAddedIndex.index.type).toBe('btree');
		expect(secondAddedIndex.index.where).toBe('status = "active"');
		expect(secondAddedIndex.destructive).toBe(false);
		
		// Check removed index
		const removedIndex = diff.removedIndexes[0] as IndexChange;
		expect(removedIndex.name).toBe('idx_old_index');
		expect(removedIndex.index.name).toBe('idx_old_index');
		expect(removedIndex.index.columns).toEqual(['obsolete_field']);
		expect(removedIndex.index.unique).toBe(false);
		expect(removedIndex.destructive).toBe(false);
	});

	/**
	 * Test P2-005-SD6: Empty SchemaDiff validation
	 */
	it('P2-005-SD6: should validate empty SchemaDiff', () => {
		const diff: SchemaDiff = emptySchemaDiff;
		
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(0);
		expect(diff.removedColumns).toHaveLength(0);
		expect(diff.modifiedColumns).toHaveLength(0);
		expect(diff.addedIndexes).toHaveLength(0);
		expect(diff.removedIndexes).toHaveLength(0);
		expect(diff.renamedColumns).toHaveLength(0);
		
		// All arrays should be empty
		expect(Array.isArray(diff.addedColumns)).toBe(true);
		expect(Array.isArray(diff.removedColumns)).toBe(true);
		expect(Array.isArray(diff.modifiedColumns)).toBe(true);
		expect(Array.isArray(diff.addedIndexes)).toBe(true);
		expect(Array.isArray(diff.removedIndexes)).toBe(true);
		expect(Array.isArray(diff.renamedColumns)).toBe(true);
	});

	/**
	 * Test P2-005-SD7: Complex SchemaDiff with all changes
	 */
	it('P2-005-SD7: should create complex SchemaDiff with all changes', () => {
		const diff: SchemaDiff = complexSchemaDiff;
		
		expect(diff).toBeDefined();
		expect(diff.addedColumns).toHaveLength(1);
		expect(diff.removedColumns).toHaveLength(1);
		expect(diff.modifiedColumns).toHaveLength(1);
		expect(diff.addedIndexes).toHaveLength(1);
		expect(diff.removedIndexes).toHaveLength(1);
		expect(diff.renamedColumns).toHaveLength(1);
		
		// Check added column
		const addedColumn = diff.addedColumns[0] as ColumnChange;
		expect(addedColumn.fieldname).toBe('new_field');
		expect(addedColumn.column.name).toBe('new_field');
		expect(addedColumn.column.type).toBe('text');
		expect(addedColumn.destructive).toBe(false);
		
		// Check removed column
		const removedColumn = diff.removedColumns[0] as ColumnChange;
		expect(removedColumn.fieldname).toBe('removed_field');
		expect(removedColumn.column.name).toBe('removed_field');
		expect(removedColumn.column.type).toBe('varchar');
		expect(removedColumn.column.length).toBe(100);
		expect(removedColumn.destructive).toBe(true);
		
		// Check modified column
		const modifiedColumn = diff.modifiedColumns[0] as FieldChange;
		expect(modifiedColumn.fieldname).toBe('modified_field');
		expect(modifiedColumn.changes.type?.from).toBe('varchar');
		expect(modifiedColumn.changes.type?.to).toBe('text');
		expect(modifiedColumn.changes.length?.from).toBe(100);
		expect(modifiedColumn.changes.length?.to).toBe(1000);
		expect(modifiedColumn.changes.required?.from).toBe(false);
		expect(modifiedColumn.changes.required?.to).toBe(true);
		expect(modifiedColumn.changes.unique?.from).toBe(false);
		expect(modifiedColumn.changes.unique?.to).toBe(true);
		expect(modifiedColumn.requiresDataMigration).toBe(true);
		expect(modifiedColumn.destructive).toBe(false);
		
		// Check added index
		const addedIndex = diff.addedIndexes[0] as IndexChange;
		expect(addedIndex.name).toBe('idx_new_index');
		expect(addedIndex.index.name).toBe('idx_new_index');
		expect(addedIndex.index.columns).toEqual(['new_field']);
		expect(addedIndex.index.unique).toBe(false);
		expect(addedIndex.index.type).toBe('btree');
		expect(addedIndex.destructive).toBe(false);
		
		// Check removed index
		const removedIndex = diff.removedIndexes[0] as IndexChange;
		expect(removedIndex.name).toBe('idx_removed_index');
		expect(removedIndex.index.name).toBe('idx_removed_index');
		expect(removedIndex.index.columns).toEqual(['removed_field']);
		expect(removedIndex.index.unique).toBe(false);
		expect(removedIndex.destructive).toBe(false);
		
		// Check renamed column
		const renamedColumn = diff.renamedColumns[0] as ColumnRename;
		expect(renamedColumn.from).toBe('old_column');
		expect(renamedColumn.to).toBe('new_column');
		expect(renamedColumn.column.name).toBe('new_column');
		expect(renamedColumn.column.type).toBe('integer');
		expect(renamedColumn.column.nullable).toBe(false);
	});
});

describe('Schema Diff Type Safety', () => {
	/**
	 * Test that SchemaDiff enforces correct structure
	 */
	it('should enforce SchemaDiff structure', () => {
		const validDiff: SchemaDiff = {
			addedColumns: [],
			removedColumns: [],
			modifiedColumns: [],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		};
		
		// All properties should be arrays
		expect(Array.isArray(validDiff.addedColumns)).toBe(true);
		expect(Array.isArray(validDiff.removedColumns)).toBe(true);
		expect(Array.isArray(validDiff.modifiedColumns)).toBe(true);
		expect(Array.isArray(validDiff.addedIndexes)).toBe(true);
		expect(Array.isArray(validDiff.removedIndexes)).toBe(true);
		expect(Array.isArray(validDiff.renamedColumns)).toBe(true);
	});

	/**
	 * Test ColumnChange type safety
	 */
	it('should enforce ColumnChange type safety', () => {
		const columnDef: ColumnDefinition = {
			name: 'test_column',
			type: 'varchar',
			nullable: true,
			primary_key: false,
			auto_increment: false,
			unique: false,
			length: 255
		};
		
		const columnChange: ColumnChange = {
			fieldname: 'test_column',
			column: columnDef,
			destructive: false
		};
		
		expect(columnChange.fieldname).toBe('test_column');
		expect(columnChange.column.name).toBe('test_column');
		expect(columnChange.column.type).toBe('varchar');
		expect(columnChange.destructive).toBe(false);
	});

	/**
	 * Test FieldChange type safety
	 */
	it('should enforce FieldChange type safety', () => {
		const fieldChange: FieldChange = {
			fieldname: 'test_field',
			changes: {
				type: { from: 'varchar', to: 'text' },
				length: { from: 100, to: 255 },
				required: { from: false, to: true },
				unique: { from: false, to: true },
				default: { from: null, to: 'default_value' },
				precision: { from: 2, to: 4 },
				nullable: { from: true, to: false }
			},
			requiresDataMigration: true,
			destructive: false
		};
		
		expect(fieldChange.fieldname).toBe('test_field');
		expect(fieldChange.changes.type?.from).toBe('varchar');
		expect(fieldChange.changes.type?.to).toBe('text');
		expect(fieldChange.changes.length?.from).toBe(100);
		expect(fieldChange.changes.length?.to).toBe(255);
		expect(fieldChange.changes.required?.from).toBe(false);
		expect(fieldChange.changes.required?.to).toBe(true);
		expect(fieldChange.changes.unique?.from).toBe(false);
		expect(fieldChange.changes.unique?.to).toBe(true);
		expect(fieldChange.changes.default?.from).toBe(null);
		expect(fieldChange.changes.default?.to).toBe('default_value');
		expect(fieldChange.changes.precision?.from).toBe(2);
		expect(fieldChange.changes.precision?.to).toBe(4);
		expect(fieldChange.changes.nullable?.from).toBe(true);
		expect(fieldChange.changes.nullable?.to).toBe(false);
		expect(fieldChange.requiresDataMigration).toBe(true);
		expect(fieldChange.destructive).toBe(false);
	});

	/**
	 * Test IndexChange type safety
	 */
	it('should enforce IndexChange type safety', () => {
		const indexDef: IndexDefinition = {
			name: 'idx_test',
			columns: ['test_column'],
			unique: false,
			type: 'btree'
		};
		
		const indexChange: IndexChange = {
			name: 'idx_test',
			index: indexDef,
			destructive: false
		};
		
		expect(indexChange.name).toBe('idx_test');
		expect(indexChange.index.name).toBe('idx_test');
		expect(indexChange.index.columns).toEqual(['test_column']);
		expect(indexChange.index.unique).toBe(false);
		expect(indexChange.index.type).toBe('btree');
		expect(indexChange.destructive).toBe(false);
	});

	/**
	 * Test ColumnRename type safety
	 */
	it('should enforce ColumnRename type safety', () => {
		const columnDef: ColumnDefinition = {
			name: 'new_column',
			type: 'varchar',
			nullable: true,
			primary_key: false,
			auto_increment: false,
			unique: false,
			length: 100
		};
		
		const columnRename: ColumnRename = {
			from: 'old_column',
			to: 'new_column',
			column: columnDef
		};
		
		expect(columnRename.from).toBe('old_column');
		expect(columnRename.to).toBe('new_column');
		expect(columnRename.column.name).toBe('new_column');
		expect(columnRename.column.type).toBe('varchar');
		expect(columnRename.column.length).toBe(100);
	});
});

describe('Schema Diff Edge Cases', () => {
	/**
	 * Test SchemaDiff with minimal ColumnDefinition
	 */
	it('should handle minimal ColumnDefinition', () => {
		const minimalColumnDef: ColumnDefinition = {
			name: 'minimal_column',
			type: 'text',
			nullable: true,
			primary_key: false,
			auto_increment: false,
			unique: false
		};
		
		const columnChange: ColumnChange = {
			fieldname: 'minimal_column',
			column: minimalColumnDef,
			destructive: false
		};
		
		expect(columnChange.column.name).toBe('minimal_column');
		expect(columnChange.column.type).toBe('text');
		expect(columnChange.column.nullable).toBe(true);
		expect(columnChange.column.primary_key).toBe(false);
		expect(columnChange.column.auto_increment).toBe(false);
		expect(columnChange.column.unique).toBe(false);
	});

	/**
	 * Test SchemaDiff with minimal IndexDefinition
	 */
	it('should handle minimal IndexDefinition', () => {
		const minimalIndexDef: IndexDefinition = {
			name: 'idx_minimal',
			columns: ['minimal_column'],
			unique: false
		};
		
		const indexChange: IndexChange = {
			name: 'idx_minimal',
			index: minimalIndexDef,
			destructive: false
		};
		
		expect(indexChange.index.name).toBe('idx_minimal');
		expect(indexChange.index.columns).toEqual(['minimal_column']);
		expect(indexChange.index.unique).toBe(false);
	});

	/**
	 * Test FieldChange with minimal changes
	 */
	it('should handle minimal FieldChange', () => {
		const minimalFieldChange: FieldChange = {
			fieldname: 'minimal_field',
			changes: {
				type: { from: 'varchar', to: 'text' }
			},
			requiresDataMigration: false,
			destructive: false
		};
		
		expect(minimalFieldChange.fieldname).toBe('minimal_field');
		expect(minimalFieldChange.changes.type?.from).toBe('varchar');
		expect(minimalFieldChange.changes.type?.to).toBe('text');
		expect(minimalFieldChange.requiresDataMigration).toBe(false);
		expect(minimalFieldChange.destructive).toBe(false);
	});
});