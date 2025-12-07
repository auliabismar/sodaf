/**
 * SQLFormatter Tests (P2-007-T8)
 * 
 * This file contains tests for SQLFormatter class, which is responsible for
 * formatting SQL statements with proper indentation and line breaks.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLFormatter } from '../sql/sql-formatter';
import type { SQLOptions } from '../sql/sql-types';

describe('SQLFormatter', () => {
	let sqlFormatter: SQLFormatter;
	
	beforeEach(() => {
		sqlFormatter = new SQLFormatter();
	});
	
	afterEach(() => {
		sqlFormatter = null as any;
	});
	
	describe('formatCreateTable', () => {
		it('should format CREATE TABLE statement with proper indentation', () => {
			const tableName = 'test_table';
			const columnDefs = [
				'`id` integer PRIMARY KEY AUTOINCREMENT',
				'`name` varchar(100) NOT NULL',
				'`email` varchar(255) UNIQUE',
				'`created_at` datetime DEFAULT CURRENT_TIMESTAMP'
			];
			const tableConstraints = [
				'PRIMARY KEY (`id`)',
				'UNIQUE (`email`)'
			];
			
			const sql = sqlFormatter.formatCreateTable(tableName, columnDefs, tableConstraints);
			
			// Should have proper line breaks and indentation
			expect(sql).toContain('CREATE TABLE `test_table` (\n');
			expect(sql).toContain('\t`id` integer PRIMARY KEY AUTOINCREMENT,\n');
			expect(sql).toContain('\t`name` varchar(100) NOT NULL,\n');
			expect(sql).toContain('\t`email` varchar(255) UNIQUE,\n');
			expect(sql).toContain('\t`created_at` datetime DEFAULT CURRENT_TIMESTAMP\n');
			expect(sql).toContain(');\n');
		});
		
		it('should format CREATE TABLE with single column', () => {
			const tableName = 'simple_table';
			const columnDefs = ['`id` integer PRIMARY KEY'];
			const tableConstraints: string[] = [];
			
			const sql = sqlFormatter.formatCreateTable(tableName, columnDefs, tableConstraints);
			
			expect(sql).toContain('CREATE TABLE `simple_table` (\n');
			expect(sql).toContain('\t`id` integer PRIMARY KEY\n');
			expect(sql).toContain(');\n');
		});
		
		it('should format CREATE TABLE without constraints', () => {
			const tableName = 'no_constraints_table';
			const columnDefs = ['`name` varchar(100)', '`email` varchar(255)'];
			const tableConstraints: string[] = [];
			
			const sql = sqlFormatter.formatCreateTable(tableName, columnDefs, tableConstraints);
			
			expect(sql).not.toContain('PRIMARY KEY');
			expect(sql).not.toContain('UNIQUE');
		});
		
		it('should format CREATE TABLE with mixed constraints', () => {
			const tableName = 'mixed_table';
			const columnDefs = ['`id` integer', '`name` varchar(100)', '`email` varchar(255)'];
			const tableConstraints = [
				'PRIMARY KEY (`id`)',
				'UNIQUE (`email`)'
			];
			
			const sql = sqlFormatter.formatCreateTable(tableName, columnDefs, tableConstraints);
			
			expect(sql).toContain('PRIMARY KEY (`id`)');
			expect(sql).toContain('UNIQUE (`email`)');
		});
	});
	
	describe('formatAlterTable', () => {
		it('should format ALTER TABLE ADD COLUMN statement', () => {
			const tableName = 'test_table';
			const columnDef = '`new_field` varchar(100) NOT NULL DEFAULT \'default_value\'';
			
			const sql = sqlFormatter.formatAlterTable(tableName, 'ADD COLUMN', columnDef);
			
			expect(sql).toContain('ALTER TABLE `test_table`\n');
			expect(sql).toContain('ADD COLUMN `new_field` varchar(100) NOT NULL DEFAULT \'default_value\'');
		});
		
		it('should format ALTER TABLE DROP COLUMN statement', () => {
			const tableName = 'test_table';
			const columnDef = '`old_field`';
			
			const sql = sqlFormatter.formatAlterTable(tableName, 'DROP COLUMN', columnDef);
			
			expect(sql).toContain('ALTER TABLE `test_table`\n');
			expect(sql).toContain('DROP COLUMN `old_field`');
		});
		
		it('should format ALTER TABLE MODIFY COLUMN statement', () => {
			const tableName = 'test_table';
			const columnDef = '`modified_field` varchar(200) NOT NULL';
			
			const sql = sqlFormatter.formatAlterTable(tableName, 'MODIFY COLUMN', columnDef);
			
			expect(sql).toContain('ALTER TABLE `test_table`\n');
			expect(sql).toContain('MODIFY COLUMN `modified_field` varchar(200) NOT NULL');
		});
		
		it('should format ALTER TABLE RENAME COLUMN statement', () => {
			const tableName = 'test_table';
			const columnDef = '`old_name` varchar(100) TO `new_name`';
			
			const sql = sqlFormatter.formatAlterTable(tableName, 'RENAME COLUMN', columnDef);
			
			expect(sql).toContain('ALTER TABLE `test_table`\n');
			expect(sql).toContain('RENAME COLUMN `old_name` varchar(100) TO `new_name`');
		});
		
		it('should format ALTER TABLE RENAME TO statement', () => {
			const tableName = 'test_table';
			const newTableName = 'new_table_name';
			
			const sql = sqlFormatter.formatAlterTable(tableName, 'RENAME TO', newTableName);
			
			expect(sql).toContain('ALTER TABLE `test_table`\n');
			expect(sql).toContain('RENAME TO `new_table_name`');
		});
	});
	
	describe('formatCreateIndex', () => {
		it('should format CREATE INDEX statement', () => {
			const indexName = 'idx_test_name';
			const tableName = 'test_table';
			const columns = ['`name`', '`email`'];
			
			const sql = sqlFormatter.formatCreateIndex(indexName, tableName, columns);
			
			expect(sql).toContain('CREATE INDEX `idx_test_name`\n');
			expect(sql).toContain('ON `test_table` (\n');
			expect(sql).toContain('\t`name`,\n');
			expect(sql).toContain('\t`email`\n');
			expect(sql).toContain(');\n');
		});
		
		it('should format CREATE UNIQUE INDEX statement', () => {
			const indexName = 'idx_unique_email';
			const tableName = 'test_table';
			const columns = ['`email`'];
			
			const sql = sqlFormatter.formatCreateIndex(indexName, tableName, columns, true);
			
			expect(sql).toContain('CREATE UNIQUE INDEX `idx_unique_email`\n');
			expect(sql).toContain('ON `test_table` (\n');
			expect(sql).toContain('\t`email`\n');
			expect(sql).toContain(');\n');
		});
		
		it('should format CREATE INDEX with single column', () => {
			const indexName = 'idx_single';
			const tableName = 'test_table';
			const columns = ['`name`'];
			
			const sql = sqlFormatter.formatCreateIndex(indexName, tableName, columns);
			
			expect(sql).toContain('CREATE INDEX `idx_single`\n');
			expect(sql).toContain('ON `test_table` (\n');
			expect(sql).toContain('\t`name`\n');
			expect(sql).toContain(');\n');
		});
		
		it('should format CREATE INDEX with DESC order', () => {
			const indexName = 'idx_desc';
			const tableName = 'test_table';
			const columns = ['`name` DESC', '`created_at` DESC'];
			
			const sql = sqlFormatter.formatCreateIndex(indexName, tableName, columns);
			
			expect(sql).toContain('CREATE INDEX `idx_desc`\n');
			expect(sql).toContain('ON `test_table` (\n');
			expect(sql).toContain('\t`name` DESC,\n');
			expect(sql).toContain('\t`created_at` DESC\n');
			expect(sql).toContain(');\n');
		});
		
		it('should format CREATE INDEX with WHERE clause', () => {
			const indexName = 'idx_partial';
			const tableName = 'test_table';
			const columns = ['`name`'];
			const whereClause = 'is_active = 1';
			
			const sql = sqlFormatter.formatCreateIndex(indexName, tableName, columns, false, whereClause);
			
			expect(sql).toContain('CREATE INDEX `idx_partial`\n');
			expect(sql).toContain('ON `test_table` (\n');
			expect(sql).toContain('\t`name`\n');
			expect(sql).toContain(')\n');
			expect(sql).toContain('WHERE is_active = 1\n');
		});
	});
	
	describe('formatDropIndex', () => {
		it('should format DROP INDEX statement', () => {
			const indexName = 'idx_test_name';
			
			const sql = sqlFormatter.formatCreateIndex(indexName, 'test_table', []);
			
			expect(sql).toContain('DROP INDEX `idx_test_name`');
		});
	});
	
	describe('formatInsert', () => {
		it('should format INSERT statement with single column', () => {
			const tableName = 'test_table';
			const columns = ['`name`'];
			const values = ['\'test_value\''];
			
			const sql = sqlFormatter.formatInsert(tableName, columns, [values]);
			
			expect(sql).toContain('INSERT INTO `test_table` (\n');
			expect(sql).toContain('\t`name`\n');
			expect(sql).toContain(') VALUES (\n');
			expect(sql).toContain('\t\'test_value\'\n');
			expect(sql).toContain(');\n');
		});
		
		it('should format INSERT statement with multiple columns', () => {
			const tableName = 'test_table';
			const columns = ['`name`', '`email`', '`status`'];
			const values = ['\'test\'', '\'test@example.com\'', '\'active\''];
			
			const sql = sqlFormatter.formatInsert(tableName, columns, [values]);
			
			expect(sql).toContain('INSERT INTO `test_table` (\n');
			expect(sql).toContain('\t`name`,\n');
			expect(sql).toContain('\t`email`,\n');
			expect(sql).toContain('\t`status`\n');
			expect(sql).toContain(') VALUES (\n');
			expect(sql).toContain('\t\'test\',\n');
			expect(sql).toContain('\t\'test@example.com\',\n');
			expect(sql).toContain('\t\'active\'\n');
			expect(sql).toContain(');\n');
		});
		
		it('should format INSERT with SELECT subquery', () => {
			const tableName = 'test_table';
			const columns = ['`name`', '`email`'];
			const selectSql = 'SELECT `name`, `email` FROM `source_table`';
			
			const sql = sqlFormatter.formatInsert(tableName, columns, [[selectSql]]);
			
			expect(sql).toContain('INSERT INTO `test_table` (\n');
			expect(sql).toContain('\t`name`,\n');
			expect(sql).toContain('\t`email`\n');
			expect(sql).toContain(') VALUES (\n');
			expect(sql).toContain('\t' + selectSql + '\n');
			expect(sql).toContain(');\n');
		});
	});
	
	describe('formatUpdate', () => {
		it('should format UPDATE statement with SET clause', () => {
			const tableName = 'test_table';
			const setClause = '`name` = \'new_name\', `status` = \'active\'';
			const whereClause = '`id` = 1';
			
			const sql = sqlFormatter.formatUpdate(tableName, [setClause], whereClause);
			
			expect(sql).toContain('UPDATE `test_table`\n');
			expect(sql).toContain('SET\n');
			expect(sql).toContain('\t`name` = \'new_name\',\n');
			expect(sql).toContain('\t`status` = \'active\'\n');
			expect(sql).toContain('WHERE\n');
			expect(sql).toContain('\t`id` = 1\n');
		});
		
		it('should format UPDATE statement without WHERE clause', () => {
			const tableName = 'test_table';
			const setClause = '`status` = \'active\'';
			
			const sql = sqlFormatter.formatUpdate(tableName, [setClause]);
			
			expect(sql).toContain('UPDATE `test_table`\n');
			expect(sql).toContain('SET\n');
			expect(sql).toContain('\t`status` = \'active\'\n');
			expect(sql).not.toContain('WHERE');
		});
		
		it('should format UPDATE with complex SET clause', () => {
			const tableName = 'test_table';
			const setClause = '`count` = `count` + 1, `modified_at` = CURRENT_TIMESTAMP';
			const whereClause = '`id` > 100';
			
			const sql = sqlFormatter.formatUpdate(tableName, [setClause], whereClause);
			
			expect(sql).toContain('UPDATE `test_table`\n');
			expect(sql).toContain('SET\n');
			expect(sql).toContain('\t`count` = `count` + 1,\n');
			expect(sql).toContain('\t`modified_at` = CURRENT_TIMESTAMP\n');
			expect(sql).toContain('WHERE\n');
			expect(sql).toContain('\t`id` > 100\n');
		});
	});
	
	describe('formatDelete', () => {
		it('should format DELETE statement with WHERE clause', () => {
			const tableName = 'test_table';
			const whereClause = '`status` = \'inactive\' AND `created_at` < \'2023-01-01\'';
			
			const sql = sqlFormatter.formatDelete(tableName, whereClause);
			
			expect(sql).toContain('DELETE FROM `test_table`\n');
			expect(sql).toContain('WHERE\n');
			expect(sql).toContain('\t`status` = \'inactive\' AND\n');
			expect(sql).toContain('\t`created_at` < \'2023-01-01\'\n');
		});
		
		it('should format DELETE statement without WHERE clause', () => {
			const tableName = 'test_table';
			
			const sql = sqlFormatter.formatDelete(tableName);
			
			expect(sql).toContain('DELETE FROM `test_table`');
			expect(sql).not.toContain('WHERE');
		});
	});
	
	describe('addComments', () => {
		it('should add comments to SQL statements', () => {
			const sql = 'CREATE TABLE `test_table` (`id` integer PRIMARY KEY)';
			const comment = 'Create test table';
			
			const commentedSql = sqlFormatter.addComments(sql, comment);
			
			expect(commentedSql).toContain('-- Create test table');
			expect(commentedSql).toContain('CREATE TABLE `test_table` (`id` integer PRIMARY KEY)');
		});
		
		it('should add multiple comments', () => {
			const sql = 'CREATE TABLE `test_table` (`id` integer PRIMARY KEY)';
			const comments = ['Create test table', 'Primary key for auto-increment'];
			
			const commentedSql = sqlFormatter.addComments(sql, comments[0]);
			
			expect(commentedSql).toContain('-- Create test table');
			expect(commentedSql).toContain('-- Primary key for auto-increment');
			expect(commentedSql).toContain('CREATE TABLE `test_table` (`id` integer PRIMARY KEY)');
		});
		
		it('should add comments with default prefix', () => {
			const customFormatter = new SQLFormatter({ includeComments: true });
			const sql = 'CREATE TABLE `test_table` (`id` integer PRIMARY KEY)';
			const comment = 'Create test table';
			
			const commentedSql = customFormatter.addComments(sql, comment);
			
			expect(commentedSql).toContain('-- Create test table');
		});
	});
	
	describe('Custom options', () => {
		it('should use custom identifier quote', () => {
			const customFormatter = new SQLFormatter({ identifierQuote: '"' });
			const tableName = 'test_table';
			const columnDefs = ['`id` integer PRIMARY KEY', '`name` varchar(100)'];
			
			const sql = customFormatter.formatCreateTable(tableName, columnDefs, []);
			
			// Should use double quotes instead of backticks
			expect(sql).toContain('"test_table"');
			expect(sql).toContain('"id" integer PRIMARY KEY');
		});
		
		it('should use custom max line length', () => {
			const customFormatter = new SQLFormatter({ maxLineLength: 50 });
			const tableName = 'test_table';
			const columnDefs = [
				'`id` integer PRIMARY KEY AUTOINCREMENT',
				'`name` varchar(100) NOT NULL',
				'`email` varchar(255) UNIQUE',
				'`created_at` datetime DEFAULT CURRENT_TIMESTAMP'
			];
			
			const sql = customFormatter.formatCreateTable(tableName, columnDefs, []);
			
			// Should break lines at 50 characters
			const lines = sql.split('\n');
			for (const line of lines) {
				expect(line.length).toBeLessThanOrEqual(50);
			}
		});
		
		it('should use custom max line length', () => {
			const customFormatter = new SQLFormatter({ maxLineLength: 50 });
			const tableName = 'test_table';
			const columnDefs = [
				'`id` integer PRIMARY KEY AUTOINCREMENT',
				'`name` varchar(100) NOT NULL',
				'`email` varchar(255) UNIQUE',
				'`created_at` datetime DEFAULT CURRENT_TIMESTAMP'
			];
			
			const sql = customFormatter.formatCreateTable(tableName, columnDefs, []);
			
			// Should break lines at 50 characters
			const lines = sql.split('\n');
			for (const line of lines) {
				expect(line.length).toBeLessThanOrEqual(50);
			}
		});
		
		it('should disable formatting when disabled', () => {
			const customFormatter = new SQLFormatter({ formatSQL: false });
			const tableName = 'test_table';
			const columnDefs = ['`id` integer PRIMARY KEY', '`name` varchar(100)'];
			
			const sql = customFormatter.formatCreateTable(tableName, columnDefs, []);
			
			// Should return SQL as-is without formatting
			expect(sql).toBe('CREATE TABLE `test_table` (`id` integer PRIMARY KEY, `name` varchar(100));');
		});
	});
	
	describe('Error handling', () => {
		it('should handle empty SQL', () => {
			const sql = '';
			const comment = 'Test comment';
			
			const commentedSql = sqlFormatter.addComments(sql, comment);
			
			// Should return empty SQL with comment
			expect(commentedSql).toBe('-- Test comment');
		});
		
		it('should handle null SQL', () => {
			const sql = null as any;
			const comment = 'Test comment';
			
			const commentedSql = sqlFormatter.addComments(sql, comment);
			
			// Should return empty SQL with comment
			expect(commentedSql).toBe('-- Test comment');
		});
		
		it('should handle SQL with only whitespace', () => {
			const sql = '   \n\t  ';
			const comment = 'Test comment';
			
			const commentedSql = sqlFormatter.addComments(sql, comment);
			
			// Should return empty SQL with comment
			expect(commentedSql).toBe('-- Test comment');
		});
	});
});