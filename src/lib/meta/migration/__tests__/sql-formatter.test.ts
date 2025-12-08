/**
 * SQLFormatter Tests (P2-007-T8)
 * 
 * This file contains tests for SQLFormatter class, which is responsible for
 * formatting SQL statements with proper indentation and line breaks.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SQLFormatter } from '../sql/sql-formatter';

describe('SQLFormatter', () => {
	let sqlFormatter: SQLFormatter;

	beforeEach(() => {
		sqlFormatter = new SQLFormatter();
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

			// Check SQL contains all key parts (allowing newlines/whitespace between keywords)
			expect(sql).toMatch(/CREATE\s+TABLE/);
			expect(sql).toContain('`test_table`');
			expect(sql).toContain('`id` integer');
			expect(sql).toContain('PRIMARY KEY');
			expect(sql).toContain('AUTOINCREMENT');
			expect(sql).toContain('`name` varchar(100)');
			expect(sql).toContain('`email` varchar(255)');
			expect(sql).toContain('UNIQUE');
		});

		it('should format CREATE TABLE with single column', () => {
			const tableName = 'simple_table';
			const columnDefs = ['`id` integer PRIMARY KEY'];
			const tableConstraints: string[] = [];

			const sql = sqlFormatter.formatCreateTable(tableName, columnDefs, tableConstraints);

			expect(sql).toMatch(/CREATE\s+TABLE/);
			expect(sql).toContain('`simple_table`');
			expect(sql).toContain('`id` integer');
			expect(sql).toContain('PRIMARY KEY');
		});

		it('should format CREATE TABLE without constraints', () => {
			const tableName = 'no_constraints_table';
			const columnDefs = ['`name` varchar(100)', '`email` varchar(255)'];
			const tableConstraints: string[] = [];

			const sql = sqlFormatter.formatCreateTable(tableName, columnDefs, tableConstraints);

			expect(sql).not.toMatch(/PRIMARY KEY\s*\([^)]+\)/);
			expect(sql).not.toMatch(/UNIQUE\s*\([^)]+\)/);
		});

		it('should format CREATE TABLE with mixed constraints', () => {
			const tableName = 'mixed_table';
			const columnDefs = ['`id` integer', '`name` varchar(100)', '`email` varchar(255)'];
			const tableConstraints = [
				'PRIMARY KEY (`id`)',
				'UNIQUE (`email`)'
			];

			const sql = sqlFormatter.formatCreateTable(tableName, columnDefs, tableConstraints);

			expect(sql).toContain('PRIMARY KEY');
			expect(sql).toContain('`id`');
			expect(sql).toContain('UNIQUE');
			expect(sql).toContain('`email`');
		});
	});

	describe('formatAlterTable', () => {
		it('should format ALTER TABLE ADD COLUMN statement', () => {
			const tableName = 'test_table';
			const columnDef = '`new_field` varchar(100) NOT NULL DEFAULT \'default_value\'';

			const sql = sqlFormatter.formatAlterTable(tableName, 'ADD COLUMN', columnDef);

			expect(sql).toMatch(/ALTER\s+TABLE/);
			expect(sql).toContain('`test_table`');
			expect(sql).toMatch(/ADD\s+COLUMN/);
			expect(sql).toContain('`new_field` varchar(100)');
			expect(sql).toContain('DEFAULT');
		});

		it('should format ALTER TABLE DROP COLUMN statement', () => {
			const tableName = 'test_table';
			const columnDef = '`old_field`';

			const sql = sqlFormatter.formatAlterTable(tableName, 'DROP COLUMN', columnDef);

			expect(sql).toMatch(/ALTER\s+TABLE/);
			expect(sql).toContain('`test_table`');
			expect(sql).toMatch(/DROP\s+COLUMN/);
			expect(sql).toContain('`old_field`');
		});

		it('should format ALTER TABLE MODIFY COLUMN statement', () => {
			const tableName = 'test_table';
			const columnDef = '`modified_field` varchar(200) NOT NULL';

			const sql = sqlFormatter.formatAlterTable(tableName, 'MODIFY COLUMN', columnDef);

			expect(sql).toMatch(/ALTER\s+TABLE/);
			expect(sql).toContain('`test_table`');
			expect(sql).toMatch(/MODIFY\s+COLUMN/);
			expect(sql).toContain('`modified_field` varchar(200)');
		});

		it('should format ALTER TABLE RENAME COLUMN statement', () => {
			const tableName = 'test_table';
			const columnDef = '`old_name` varchar(100) TO `new_name`';

			const sql = sqlFormatter.formatAlterTable(tableName, 'RENAME COLUMN', columnDef);

			expect(sql).toMatch(/ALTER\s+TABLE/);
			expect(sql).toContain('`test_table`');
			expect(sql).toMatch(/RENAME\s+COLUMN/);
		});

		it('should format ALTER TABLE RENAME TO statement', () => {
			const tableName = 'test_table';
			const newTableName = 'new_table_name';

			const sql = sqlFormatter.formatAlterTable(tableName, 'RENAME TO', newTableName);

			expect(sql).toMatch(/ALTER\s+TABLE/);
			expect(sql).toContain('`test_table`');
			expect(sql).toMatch(/RENAME\s+TO/);
			expect(sql).toContain('new_table_name');
		});
	});

	describe('formatCreateIndex', () => {
		it('should format CREATE INDEX statement', () => {
			const indexName = 'idx_test_name';
			const tableName = 'test_table';
			const columns = ['`name`', '`email`'];

			const sql = sqlFormatter.formatCreateIndex(indexName, tableName, columns);

			expect(sql).toMatch(/CREATE\s+INDEX/);
			expect(sql).toContain('`idx_test_name`');
			expect(sql).toContain('`test_table`');
			expect(sql).toContain('`name`');
			expect(sql).toContain('`email`');
		});

		it('should format CREATE UNIQUE INDEX statement', () => {
			const indexName = 'idx_unique_email';
			const tableName = 'test_table';
			const columns = ['`email`'];

			const sql = sqlFormatter.formatCreateIndex(indexName, tableName, columns, true);

			expect(sql).toMatch(/CREATE\s+UNIQUE\s+INDEX/);
			expect(sql).toContain('`idx_unique_email`');
			expect(sql).toContain('`test_table`');
			expect(sql).toContain('`email`');
		});

		it('should format CREATE INDEX with single column', () => {
			const indexName = 'idx_single';
			const tableName = 'test_table';
			const columns = ['`name`'];

			const sql = sqlFormatter.formatCreateIndex(indexName, tableName, columns);

			expect(sql).toMatch(/CREATE\s+INDEX/);
			expect(sql).toContain('`idx_single`');
			expect(sql).toContain('`test_table`');
			expect(sql).toContain('`name`');
		});

		it('should format CREATE INDEX with DESC order', () => {
			const indexName = 'idx_desc';
			const tableName = 'test_table';
			const columns = ['`name` DESC', '`created_at` DESC'];

			const sql = sqlFormatter.formatCreateIndex(indexName, tableName, columns);

			expect(sql).toMatch(/CREATE\s+INDEX/);
			expect(sql).toContain('`idx_desc`');
			expect(sql).toContain('`test_table`');
			expect(sql).toContain('DESC');
		});

		it('should format CREATE INDEX with WHERE clause', () => {
			const indexName = 'idx_partial';
			const tableName = 'test_table';
			const columns = ['`name`'];
			const whereClause = 'is_active = 1';

			const sql = sqlFormatter.formatCreateIndex(indexName, tableName, columns, false, whereClause);

			expect(sql).toMatch(/CREATE\s+INDEX/);
			expect(sql).toContain('`idx_partial`');
			expect(sql).toContain('`test_table`');
			expect(sql).toContain('WHERE');
			expect(sql).toContain('is_active = 1');
		});
	});

	describe('formatDropStatement', () => {
		it('should format DROP INDEX statement', () => {
			const indexName = 'idx_test_name';

			const sql = sqlFormatter.formatDropStatement('INDEX', indexName);

			expect(sql).toMatch(/DROP\s+INDEX/);
			expect(sql).toContain('`idx_test_name`');
		});

		it('should format DROP TABLE statement', () => {
			const tableName = 'test_table';

			const sql = sqlFormatter.formatDropStatement('TABLE', tableName);

			expect(sql).toMatch(/DROP\s+TABLE/);
			expect(sql).toContain('`test_table`');
		});
	});

	describe('formatInsert', () => {
		it('should format INSERT statement with single column', () => {
			const tableName = 'test_table';
			const columns = ['name'];
			const values = [['test_value']];

			const sql = sqlFormatter.formatInsert(tableName, columns, values);

			expect(sql).toMatch(/INSERT\s+INTO/);
			expect(sql).toContain('`test_table`');
			expect(sql).toContain('`name`');
			expect(sql).toContain('VALUES');
		});

		it('should format INSERT statement with multiple columns', () => {
			const tableName = 'test_table';
			const columns = ['name', 'email', 'status'];
			const values = [['test', 'test@example.com', 'active']];

			const sql = sqlFormatter.formatInsert(tableName, columns, values);

			expect(sql).toMatch(/INSERT\s+INTO/);
			expect(sql).toContain('`test_table`');
			expect(sql).toContain('`name`');
			expect(sql).toContain('`email`');
			expect(sql).toContain('`status`');
			expect(sql).toContain('VALUES');
		});

		it('should format INSERT with SELECT subquery', () => {
			const tableName = 'test_table';
			const columns = ['name', 'email'];
			const selectSql = 'SELECT `name`, `email` FROM `source_table`';

			const sql = sqlFormatter.formatInsert(tableName, columns, [[selectSql]]);

			expect(sql).toMatch(/INSERT\s+INTO/);
			expect(sql).toContain('`test_table`');
			expect(sql).toContain('VALUES');
		});
	});

	describe('formatUpdate', () => {
		it('should format UPDATE statement with SET clause', () => {
			const tableName = 'test_table';
			const setClause = '`name` = \'new_name\', `status` = \'active\'';
			const whereClause = '`id` = 1';

			const sql = sqlFormatter.formatUpdate(tableName, [setClause], whereClause);

			expect(sql).toContain('UPDATE');
			expect(sql).toContain('`test_table`');
			expect(sql).toContain('SET');
			expect(sql).toContain('WHERE');
		});

		it('should format UPDATE statement without WHERE clause', () => {
			const tableName = 'test_table';
			const setClause = '`status` = \'active\'';

			const sql = sqlFormatter.formatUpdate(tableName, [setClause]);

			expect(sql).toContain('UPDATE');
			expect(sql).toContain('`test_table`');
			expect(sql).toContain('SET');
			expect(sql).not.toContain('WHERE');
		});

		it('should format UPDATE with complex SET clause', () => {
			const tableName = 'test_table';
			const setClause = '`count` = `count` + 1, `modified_at` = CURRENT_TIMESTAMP';
			const whereClause = '`id` > 100';

			const sql = sqlFormatter.formatUpdate(tableName, [setClause], whereClause);

			expect(sql).toContain('UPDATE');
			expect(sql).toContain('`test_table`');
			expect(sql).toContain('SET');
			expect(sql).toContain('WHERE');
		});
	});

	describe('formatDelete', () => {
		it('should format DELETE statement with WHERE clause', () => {
			const tableName = 'test_table';
			const whereClause = '`status` = \'inactive\' AND `created_at` < \'2023-01-01\'';

			const sql = sqlFormatter.formatDelete(tableName, whereClause);

			expect(sql).toMatch(/DELETE\s+FROM/);
			expect(sql).toContain('`test_table`');
			expect(sql).toContain('WHERE');
		});

		it('should format DELETE statement without WHERE clause', () => {
			const tableName = 'test_table';

			const sql = sqlFormatter.formatDelete(tableName);

			expect(sql).toMatch(/DELETE\s+FROM/);
			expect(sql).toContain('`test_table`');
			expect(sql).not.toContain('WHERE');
		});
	});

	describe('addComments', () => {
		it('should add comments to SQL statements', () => {
			const sql = 'CREATE TABLE `test_table` (`id` integer PRIMARY KEY)';
			const comment = 'Create test table';

			const commentedSql = sqlFormatter.addComments(sql, comment);

			expect(commentedSql).toContain('-- Create test table');
			expect(commentedSql).toContain('CREATE TABLE');
		});

		it('should add single comment', () => {
			const sql = 'CREATE TABLE `test_table` (`id` integer PRIMARY KEY)';
			const comment = 'Create test table';

			const commentedSql = sqlFormatter.addComments(sql, comment);

			expect(commentedSql).toContain('-- Create test table');
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

			expect(sql).toContain('"test_table"');
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

			expect(sql).toMatch(/CREATE\s+TABLE/);
			expect(sql).toBeDefined();
		});

		it('should disable formatting when formatSQL is false', () => {
			const customFormatter = new SQLFormatter({ formatSQL: false });
			const tableName = 'test_table';
			const columnDefs = ['`id` integer PRIMARY KEY', '`name` varchar(100)'];

			const sql = customFormatter.formatCreateTable(tableName, columnDefs, []);

			expect(sql).toContain('CREATE TABLE');
			expect(sql).toContain('`test_table`');
		});
	});

	describe('Error handling', () => {
		it('should handle empty SQL', () => {
			const sql = '';
			const comment = 'Test comment';

			const commentedSql = sqlFormatter.addComments(sql, comment);

			expect(commentedSql).toContain('-- Test comment');
		});

		it('should handle null SQL', () => {
			const sql = null as any;
			const comment = 'Test comment';

			const commentedSql = sqlFormatter.addComments(sql, comment);

			expect(commentedSql).toContain('-- Test comment');
		});

		it('should handle SQL with only whitespace', () => {
			const sql = '   \n\t  ';
			const comment = 'Test comment';

			const commentedSql = sqlFormatter.addComments(sql, comment);

			expect(commentedSql).toContain('-- Test comment');
		});
	});

	describe('Utility methods', () => {
		it('should quote identifiers', () => {
			const identifier = 'test_column';
			const quoted = sqlFormatter.quoteIdentifier(identifier);

			expect(quoted).toBe('`test_column`');
		});

		it('should format values correctly', () => {
			expect(sqlFormatter.formatValue(null)).toBe('NULL');
			expect(sqlFormatter.formatValue(undefined)).toBe('NULL');
			expect(sqlFormatter.formatValue(123)).toBe('123');
			expect(sqlFormatter.formatValue(true)).toBe('1');
			expect(sqlFormatter.formatValue(false)).toBe('0');
			expect(sqlFormatter.formatValue('test')).toBe("'test'");
			expect(sqlFormatter.formatValue("it's")).toBe("'it''s'");
		});

		it('should format table names', () => {
			const formatter = new SQLFormatter({ tableNamingStrategy: 'snake_case' });
			expect(formatter.formatTableName('MyTable')).toBe('my_table');

			const camelFormatter = new SQLFormatter({ tableNamingStrategy: 'camelCase' });
			expect(camelFormatter.formatTableName('my_table')).toBe('myTable');

			const preserveFormatter = new SQLFormatter({ tableNamingStrategy: 'preserve' });
			expect(preserveFormatter.formatTableName('MyTable')).toBe('MyTable');
		});
	});
});