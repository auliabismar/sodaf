/**
 * IndexBuilder Tests (P2-007-T5, T6)
 * 
 * This file contains tests for IndexBuilder class, which is responsible for
 * building CREATE INDEX and DROP INDEX SQL statements.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IndexBuilder } from '../sql/index-builder';
import type { DocIndex } from '../../doctype/types';
import type { IndexDefinitionSQL } from '../sql/sql-types';

describe('IndexBuilder', () => {
	let indexBuilder: IndexBuilder;

	beforeEach(() => {
		indexBuilder = new IndexBuilder();
	});

	describe('buildIndexDefinition', () => {
		it('should build basic index definition', () => {
			const docIndex: DocIndex = {
				name: 'idx_name',
				columns: ['name'],
				unique: false
			};

			const indexDef = indexBuilder.buildIndexDefinition('TestDocType', docIndex);

			// Implementation returns quoted identifiers
			expect(indexDef.name).toBe('`idx_name`');
			expect(indexDef.table).toBe('`TestDocType`');
			expect(indexDef.columns).toHaveLength(1);
			expect(indexDef.columns[0].name).toBe('`name`');
			expect(indexDef.columns[0].order).toBe('ASC');
			expect(indexDef.unique).toBe(false);
		});

		it('should build unique index definition', () => {
			const docIndex: DocIndex = {
				name: 'idx_email_unique',
				columns: ['email'],
				unique: true
			};

			const indexDef = indexBuilder.buildIndexDefinition('TestDocType', docIndex);

			expect(indexDef.name).toBe('`idx_email_unique`');
			expect(indexDef.table).toBe('`TestDocType`');
			expect(indexDef.unique).toBe(true);
		});

		it('should build composite index definition', () => {
			const docIndex: DocIndex = {
				name: 'idx_name_status',
				columns: ['name', 'status'],
				unique: false
			};

			const indexDef = indexBuilder.buildIndexDefinition('TestDocType', docIndex);

			expect(indexDef.columns).toHaveLength(2);
			expect(indexDef.columns[0].name).toBe('`name`');
			expect(indexDef.columns[0].order).toBe('ASC');
			expect(indexDef.columns[1].name).toBe('`status`');
			expect(indexDef.columns[1].order).toBe('ASC');
		});

		it('should build partial index definition with WHERE clause', () => {
			const docIndex: DocIndex = {
				name: 'idx_active_users',
				columns: ['name'],
				unique: false,
				where: 'is_active = 1'
			};

			const indexDef = indexBuilder.buildIndexDefinition('TestDocType', docIndex);

			expect(indexDef.where).toBe('is_active = 1');
		});

		it('should use default ASC order when not specified', () => {
			const docIndex: DocIndex = {
				name: 'idx_default_order',
				columns: ['field'],
				unique: false
			};

			const indexDef = indexBuilder.buildIndexDefinition('TestDocType', docIndex);

			expect(indexDef.columns[0].order).toBe('ASC');
		});
	});

	describe('buildCreateIndexStatement', () => {
		it('should build basic CREATE INDEX statement', () => {
			const indexDef: IndexDefinitionSQL = {
				name: '`idx_name`',
				table: '`tabTestDocType`',
				columns: [
					{ name: '`name`', order: 'ASC' }
				],
				unique: false
			};

			const sql = indexBuilder.buildCreateIndexStatement(indexDef);

			expect(sql).toContain('CREATE INDEX');
			expect(sql).toContain('`idx_name`');
			expect(sql).toContain('ON `tabTestDocType`');
			expect(sql).toContain('`name`');
		});

		it('should build CREATE UNIQUE INDEX statement', () => {
			const indexDef: IndexDefinitionSQL = {
				name: '`idx_email_unique`',
				table: '`tabTestDocType`',
				columns: [
					{ name: '`email`', order: 'ASC' }
				],
				unique: true
			};

			const sql = indexBuilder.buildCreateIndexStatement(indexDef);

			expect(sql).toContain('CREATE UNIQUE INDEX');
			expect(sql).toContain('`idx_email_unique`');
			expect(sql).toContain('ON `tabTestDocType`');
		});

		it('should build CREATE INDEX for composite index', () => {
			const indexDef: IndexDefinitionSQL = {
				name: '`idx_composite`',
				table: '`tabTestDocType`',
				columns: [
					{ name: '`name`', order: 'ASC' },
					{ name: '`status`', order: 'DESC' }
				],
				unique: false
			};

			const sql = indexBuilder.buildCreateIndexStatement(indexDef);

			expect(sql).toContain('CREATE INDEX');
			expect(sql).toContain('`idx_composite`');
			expect(sql).toContain('ON `tabTestDocType`');
			expect(sql).toContain('`name`');
			expect(sql).toContain('`status` DESC');
		});

		it('should build CREATE INDEX with WHERE clause', () => {
			const indexDef: IndexDefinitionSQL = {
				name: '`idx_partial`',
				table: '`tabTestDocType`',
				columns: [
					{ name: '`name`', order: 'ASC' }
				],
				unique: false,
				where: 'is_active = 1'
			};

			const sql = indexBuilder.buildCreateIndexStatement(indexDef);

			expect(sql).toContain('CREATE INDEX');
			expect(sql).toContain('`idx_partial`');
			expect(sql).toContain('ON `tabTestDocType`');
			expect(sql).toContain('WHERE is_active = 1');
		});
	});

	describe('buildDropIndexStatement', () => {
		it('should build basic DROP INDEX statement', () => {
			const indexName = 'idx_test';

			const sql = indexBuilder.buildDropIndexStatement(indexName);

			expect(sql).toContain('DROP INDEX');
			expect(sql).toContain('`idx_test`');
		});

		it('should handle IF EXISTS clause', () => {
			const indexName = 'idx_test_if_exists';

			const sql = indexBuilder.buildDropIndexStatement(indexName);

			expect(sql).toContain('DROP INDEX');
			expect(sql).toContain('`idx_test_if_exists`');
		});
	});

	describe('Custom options', () => {
		it('should use custom identifier quote character', () => {
			const customBuilder = new IndexBuilder({ identifierQuote: '"' });

			const docIndex: DocIndex = {
				name: 'idx_custom_quote',
				columns: ['name'],
				unique: false
			};

			const indexDef = customBuilder.buildIndexDefinition('TestDocType', docIndex);
			const sql = customBuilder.buildCreateIndexStatement(indexDef);

			expect(sql).toContain('"idx_custom_quote"');
			expect(sql).toContain('"name"');
			expect(sql).not.toContain('`idx_custom_quote`');
			expect(sql).not.toContain('`name`');
		});
	});

	describe('Utility methods', () => {
		it('should validate index with valid data', () => {
			const validIndex: DocIndex = {
				name: 'idx_valid',
				columns: ['name'],
				unique: false
			};

			expect(indexBuilder.validateIndex(validIndex)).toBe(true);
		});

		it('should reject index with empty name', () => {
			const invalidIndex: DocIndex = {
				name: '',
				columns: ['name'],
				unique: false
			};

			expect(indexBuilder.validateIndex(invalidIndex)).toBe(false);
		});

		it('should reject index with empty columns', () => {
			const invalidIndex: DocIndex = {
				name: 'idx_no_columns',
				columns: [],
				unique: false
			};

			expect(indexBuilder.validateIndex(invalidIndex)).toBe(false);
		});

		it('should check if index is unique', () => {
			const uniqueIndex: DocIndex = { name: 'idx', columns: ['col'], unique: true };
			const normalIndex: DocIndex = { name: 'idx', columns: ['col'], unique: false };

			expect(indexBuilder.isUniqueIndex(uniqueIndex)).toBe(true);
			expect(indexBuilder.isUniqueIndex(normalIndex)).toBe(false);
		});

		it('should check if index is partial', () => {
			const partialIndex: DocIndex = { name: 'idx', columns: ['col'], unique: false, where: 'active = 1' };
			const normalIndex: DocIndex = { name: 'idx', columns: ['col'], unique: false };

			expect(indexBuilder.isPartialIndex(partialIndex)).toBe(true);
			expect(indexBuilder.isPartialIndex(normalIndex)).toBe(false);
		});

		it('should check if index is composite', () => {
			const compositeIndex: DocIndex = { name: 'idx', columns: ['col1', 'col2'], unique: false };
			const singleIndex: DocIndex = { name: 'idx', columns: ['col'], unique: false };

			expect(indexBuilder.isCompositeIndex(compositeIndex)).toBe(true);
			expect(indexBuilder.isCompositeIndex(singleIndex)).toBe(false);
		});

		it('should generate index name', () => {
			const name = indexBuilder.generateIndexName('TestTable', ['col1', 'col2'], false);
			expect(name).toContain('idx_');
			expect(name).toContain('TestTable');

			const uniqueName = indexBuilder.generateIndexName('TestTable', ['col1'], true);
			expect(uniqueName).toContain('uidx_');
		});

		it('should build index columns SQL', () => {
			const columnsSQL = indexBuilder.buildIndexColumns(['col1', 'col2']);
			expect(columnsSQL).toContain('`col1`');
			expect(columnsSQL).toContain('`col2`');
		});
	});

	describe('Complex scenarios', () => {
		it('should build complex composite unique index with WHERE', () => {
			const docIndex: DocIndex = {
				name: 'idx_complex',
				columns: ['user_id', 'status', 'created_at'],
				unique: true,
				where: 'status = "active"'
			};

			const indexDef = indexBuilder.buildIndexDefinition('TestDocType', docIndex);
			const sql = indexBuilder.buildCreateIndexStatement(indexDef);

			expect(indexDef.columns).toHaveLength(3);
			expect(indexDef.unique).toBe(true);
			expect(indexDef.where).toBe('status = "active"');

			expect(sql).toContain('CREATE UNIQUE INDEX');
			expect(sql).toContain('`idx_complex`');
			expect(sql).toContain('WHERE status = "active"');
		});

		it('should handle special characters in index name', () => {
			const docIndex: DocIndex = {
				name: 'idx_special-chars_123',
				columns: ['field_name'],
				unique: false
			};

			const indexDef = indexBuilder.buildIndexDefinition('TestDocType', docIndex);
			const sql = indexBuilder.buildCreateIndexStatement(indexDef);

			expect(sql).toContain('`idx_special-chars_123`');
		});
	});
});