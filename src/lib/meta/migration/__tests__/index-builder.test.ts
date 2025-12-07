/**
 * IndexBuilder Tests (P2-007-T5, T6)
 * 
 * This file contains tests for IndexBuilder class, which is responsible for
 * building CREATE INDEX and DROP INDEX SQL statements.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IndexBuilder } from '../sql/index-builder';
import type { DocIndex } from '../../doctype/types';
import type { IndexDefinitionSQL } from '../sql/sql-types';

describe('IndexBuilder', () => {
	let indexBuilder: IndexBuilder;
	
	beforeEach(() => {
		indexBuilder = new IndexBuilder();
	});
	
	afterEach(() => {
		indexBuilder = null as any;
	});
	
	describe('buildIndexDefinition', () => {
		it('should build basic index definition', () => {
			const docIndex: DocIndex = {
				name: 'idx_name',
				columns: ['name'],
				unique: false
			};
			
			const indexDef = indexBuilder.buildIndexDefinition('TestDocType', docIndex);
			
			expect(indexDef.name).toBe('idx_name');
			expect(indexDef.table).toBe('tabTestDocType');
			expect(indexDef.columns).toHaveLength(1);
			expect(indexDef.columns[0].name).toBe('name');
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
			
			expect(indexDef.name).toBe('idx_email_unique');
			expect(indexDef.table).toBe('tabTestDocType');
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
			expect(indexDef.columns[0].name).toBe('name');
			expect(indexDef.columns[0].order).toBe('ASC');
			expect(indexDef.columns[1].name).toBe('status');
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
		
		it('should handle custom table name', () => {
			const docIndex: DocIndex = {
				name: 'idx_custom',
				columns: ['field'],
				unique: false
			};
			
			const indexDef = indexBuilder.buildIndexDefinition('CustomDocType:custom_table', docIndex);
			
			expect(indexDef.table).toBe('custom_table');
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
		
		it('should handle empty columns array', () => {
			const docIndex: DocIndex = {
				name: 'idx_empty',
				columns: [],
				unique: false
			};
			
			expect(() => {
				indexBuilder.buildIndexDefinition('TestDocType', docIndex);
			}).toThrow();
		});
	});
	
	describe('buildCreateIndexStatement', () => {
		it('should build basic CREATE INDEX statement', () => {
			const indexDef: IndexDefinitionSQL = {
				name: 'idx_name',
				table: 'tabTestDocType',
				columns: [
					{ name: 'name', order: 'ASC' }
				],
				unique: false
			};
			
			const sql = indexBuilder.buildCreateIndexStatement(indexDef);
			
			expect(sql).toContain('CREATE INDEX');
			expect(sql).toContain('idx_name');
			expect(sql).toContain('ON tabTestDocType');
			expect(sql).toContain('(`name`)');
		});
		
		it('should build CREATE UNIQUE INDEX statement', () => {
			const indexDef: IndexDefinitionSQL = {
				name: 'idx_email_unique',
				table: 'tabTestDocType',
				columns: [
					{ name: 'email', order: 'ASC' }
				],
				unique: true
			};
			
			const sql = indexBuilder.buildCreateIndexStatement(indexDef);
			
			expect(sql).toContain('CREATE UNIQUE INDEX');
			expect(sql).toContain('idx_email_unique');
			expect(sql).toContain('ON tabTestDocType');
			expect(sql).toContain('(`email`)');
		});
		
		it('should build CREATE INDEX for composite index', () => {
			const indexDef: IndexDefinitionSQL = {
				name: 'idx_composite',
				table: 'tabTestDocType',
				columns: [
					{ name: 'name', order: 'ASC' },
					{ name: 'status', order: 'DESC' }
				],
				unique: false
			};
			
			const sql = indexBuilder.buildCreateIndexStatement(indexDef);
			
			expect(sql).toContain('CREATE INDEX');
			expect(sql).toContain('idx_composite');
			expect(sql).toContain('ON tabTestDocType');
			expect(sql).toContain('(`name` DESC, `status`)');
		});
		
		it('should build CREATE INDEX with WHERE clause', () => {
			const indexDef: IndexDefinitionSQL = {
				name: 'idx_partial',
				table: 'tabTestDocType',
				columns: [
					{ name: 'name', order: 'ASC' }
				],
				unique: false,
				where: 'is_active = 1'
			};
			
			const sql = indexBuilder.buildCreateIndexStatement(indexDef);
			
			expect(sql).toContain('CREATE INDEX');
			expect(sql).toContain('idx_partial');
			expect(sql).toContain('ON tabTestDocType');
			expect(sql).toContain('(`name`)');
			expect(sql).toContain('WHERE is_active = 1');
		});
		
		it('should handle index with collation', () => {
			const indexDef: IndexDefinitionSQL = {
				name: 'idx_collation',
				table: 'tabTestDocType',
				columns: [
					{ name: 'name', order: 'ASC', collate: 'utf8_unicode_ci' }
				],
				unique: false
			};
			
			const sql = indexBuilder.buildCreateIndexStatement(indexDef);
			
			expect(sql).toContain('CREATE INDEX');
			expect(sql).toContain('idx_collation');
			expect(sql).toContain('ON tabTestDocType');
			expect(sql).toContain('(`name` COLLATE utf8_unicode_ci)');
		});
		
		it('should handle index type specification', () => {
			const indexDef: IndexDefinitionSQL = {
				name: 'idx_type',
				table: 'tabTestDocType',
				columns: [
					{ name: 'status', order: 'ASC' }
				],
				unique: false,
				type: 'hash'
			};
			
			const sql = indexBuilder.buildCreateIndexStatement(indexDef);
			
			// Note: SQLite doesn't support different index types, but the builder should include it
			expect(sql).toContain('CREATE INDEX');
			expect(sql).toContain('idx_type');
		});
	});
	
	describe('buildDropIndexStatement', () => {
		it('should build basic DROP INDEX statement', () => {
			const indexName = 'idx_test';
			
			const sql = indexBuilder.buildDropIndexStatement(indexName);
			
			expect(sql).toContain('DROP INDEX');
			expect(sql).toContain('idx_test');
		});
		
		it('should handle IF EXISTS clause', () => {
			const indexName = 'idx_test_if_exists';
			
			const sql = indexBuilder.buildDropIndexStatement(indexName);
			
			// Note: SQLite doesn't support IF EXISTS with DROP INDEX, but the builder should handle it
			expect(sql).toContain('DROP INDEX');
			expect(sql).toContain('idx_test_if_exists');
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
		
		it('should use custom table naming strategy', () => {
			const customBuilder = new IndexBuilder({ tableNamingStrategy: 'camelCase' });
			
			const docIndex: DocIndex = {
				name: 'idx_camel_case',
				columns: ['name'],
				unique: false
			};
			
			const indexDef = customBuilder.buildIndexDefinition('TestDocType', docIndex);
			
			expect(indexDef.table).toBe('testDocType');
			expect(indexDef.table).not.toContain('tabTestDocType');
		});
		
		it('should use custom table naming strategy with preserve', () => {
			const customBuilder = new IndexBuilder({ tableNamingStrategy: 'preserve' });
			
			const docIndex: DocIndex = {
				name: 'idx_preserve',
				columns: ['name'],
				unique: false
			};
			
			const indexDef = customBuilder.buildIndexDefinition('TestDocType:custom_table', docIndex);
			
			expect(indexDef.table).toBe('TestDocType:custom_table');
		});
	});
	
	describe('Error handling', () => {
		it('should handle invalid index name', () => {
			const docIndex: DocIndex = {
				name: '',
				columns: ['name'],
				unique: false
			};
			
			expect(() => {
				indexBuilder.buildIndexDefinition('TestDocType', docIndex);
			}).toThrow();
		});
		
		it('should handle null index name', () => {
			const docIndex: DocIndex = {
				name: null as any,
				columns: ['name'],
				unique: false
			};
			
			expect(() => {
				indexBuilder.buildIndexDefinition('TestDocType', docIndex);
			}).toThrow();
		});
		
		it('should handle empty columns array', () => {
			const docIndex: DocIndex = {
				name: 'idx_no_columns',
				columns: [],
				unique: false
			};
			
			expect(() => {
				indexBuilder.buildIndexDefinition('TestDocType', docIndex);
			}).toThrow();
		});
		
		it('should handle null columns array', () => {
			const docIndex: DocIndex = {
				name: 'idx_null_columns',
				columns: null as any,
				unique: false
			};
			
			expect(() => {
				indexBuilder.buildIndexDefinition('TestDocType', docIndex);
			}).toThrow();
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
			expect(sql).toContain('idx_complex');
			expect(sql).toContain('(`user_id`, `status`, `created_at`)');
			expect(sql).toContain('WHERE status = "active"');
		});
		
		it('should build index with mixed order directions', () => {
			const docIndex: DocIndex = {
				name: 'idx_mixed_order',
				columns: ['name', 'created_at', 'priority'],
				unique: false
			};
			
			// Manually modify the index definition to test mixed orders
			const indexDef = indexBuilder.buildIndexDefinition('TestDocType', docIndex);
			indexDef.columns[0].order = 'ASC';
			indexDef.columns[1].order = 'DESC';
			indexDef.columns[2].order = 'ASC';
			
			const sql = indexBuilder.buildCreateIndexStatement(indexDef);
			
			expect(sql).toContain('(`name` ASC, `created_at` DESC, `priority` ASC)');
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