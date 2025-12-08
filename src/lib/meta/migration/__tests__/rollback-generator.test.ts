/**
 * RollbackGenerator Tests (P2-007-T7)
 * 
 * This file contains tests for RollbackGenerator class, which is responsible for
 * generating rollback SQL statements for migration operations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RollbackGenerator } from '../sql/rollback-generator';
import type { SQLStatement } from '../sql/sql-types';

describe('RollbackGenerator', () => {
	let rollbackGenerator: RollbackGenerator;
	
	beforeEach(() => {
		rollbackGenerator = new RollbackGenerator();
	});
	
	
	
	describe('generateRollbackMigration', () => {
		it('should generate rollback statements for CREATE TABLE', () => {
			const forwardStatements: SQLStatement[] = [
				{
					sql: 'CREATE TABLE `test_table` (`id` integer PRIMARY KEY, `name` varchar(100))',
					type: 'create_table',
					destructive: false,
					table: 'test_table'
				}
			];
			
			const rollbackStatements = rollbackGenerator.generateRollbackMigration(forwardStatements);
			
			expect(rollbackStatements).toHaveLength(1);
			expect(rollbackStatements[0].type).toBe('drop_table');
			expect(rollbackStatements[0].sql).toContain('DROP TABLE `test_table`');
			expect(rollbackStatements[0].destructive).toBe(true);
		});
		
		it('should generate rollback statements for ALTER TABLE ADD COLUMN', () => {
			const forwardStatements: SQLStatement[] = [
				{
					sql: 'ALTER TABLE `test_table` ADD COLUMN `new_field` varchar(100)',
					type: 'alter_table',
					destructive: false,
					table: 'test_table',
					column: 'new_field'
				}
			];
			
			const rollbackStatements = rollbackGenerator.generateRollbackMigration(forwardStatements);
			
			expect(rollbackStatements).toHaveLength(1);
			expect(rollbackStatements[0].type).toBe('alter_table');
			expect(rollbackStatements[0].sql).toContain('ALTER TABLE `test_table` DROP COLUMN `new_field`');
			expect(rollbackStatements[0].destructive).toBe(true);
		});
		
		it('should generate rollback statements for CREATE INDEX', () => {
			const forwardStatements: SQLStatement[] = [
				{
					sql: 'CREATE INDEX `idx_name` ON `test_table` (`name`)',
					type: 'create_index',
					destructive: false,
					table: 'test_table'
				}
			];
			
			const rollbackStatements = rollbackGenerator.generateRollbackMigration(forwardStatements);
			
			expect(rollbackStatements).toHaveLength(1);
			expect(rollbackStatements[0].type).toBe('drop_index');
			expect(rollbackStatements[0].sql).toContain('DROP INDEX `idx_name`');
			expect(rollbackStatements[0].destructive).toBe(false);
		});
		
		it('should generate rollback statements for CREATE UNIQUE INDEX', () => {
			const forwardStatements: SQLStatement[] = [
				{
					sql: 'CREATE UNIQUE INDEX `idx_email` ON `test_table` (`email`)',
					type: 'create_index',
					destructive: false,
					table: 'test_table'
				}
			];
			
			const rollbackStatements = rollbackGenerator.generateRollbackMigration(forwardStatements);
			
			expect(rollbackStatements).toHaveLength(1);
			expect(rollbackStatements[0].type).toBe('drop_index');
			expect(rollbackStatements[0].sql).toContain('DROP INDEX `idx_email`');
			expect(rollbackStatements[0].destructive).toBe(false);
		});
		
		it('should generate rollback statements for DROP TABLE', () => {
			const forwardStatements: SQLStatement[] = [
				{
					sql: 'DROP TABLE `test_table`',
					type: 'drop_table',
					destructive: true,
					table: 'test_table'
				}
			];
			
			const rollbackStatements = rollbackGenerator.generateRollbackMigration(forwardStatements);
			
			expect(rollbackStatements).toHaveLength(1);
			expect(rollbackStatements[0].type).toBe('create_table');
			expect(rollbackStatements[0].sql).toContain('CREATE TABLE `test_table`');
			expect(rollbackStatements[0].destructive).toBe(false);
		});
		
		it('should generate rollback statements for DROP INDEX', () => {
			const forwardStatements: SQLStatement[] = [
				{
					sql: 'DROP INDEX `idx_name`',
					type: 'drop_index',
					destructive: false,
					table: 'test_table'
				}
			];
			
			const rollbackStatements = rollbackGenerator.generateRollbackMigration(forwardStatements);
			
			expect(rollbackStatements).toHaveLength(1);
			expect(rollbackStatements[0].type).toBe('create_index');
			expect(rollbackStatements[0].sql).toContain('CREATE INDEX `idx_name`');
			expect(rollbackStatements[0].destructive).toBe(false);
		});
		
		it('should generate rollback statements for INSERT', () => {
			const forwardStatements: SQLStatement[] = [
				{
					sql: 'INSERT INTO `test_table` (`name`, `email`) VALUES (\'test\', \'test@example.com\')',
					type: 'insert',
					destructive: false,
					table: 'test_table'
				}
			];
			
			const rollbackStatements = rollbackGenerator.generateRollbackMigration(forwardStatements);
			
			expect(rollbackStatements).toHaveLength(1);
			expect(rollbackStatements[0].type).toBe('delete');
			expect(rollbackStatements[0].sql).toContain('DELETE FROM `test_table`');
			expect(rollbackStatements[0].destructive).toBe(true);
		});
		
		it('should generate rollback statements for UPDATE', () => {
			const forwardStatements: SQLStatement[] = [
				{
					sql: 'UPDATE `test_table` SET `status` = \'inactive\' WHERE `id` = 1',
					type: 'update',
					destructive: false,
					table: 'test_table'
				}
			];
			
			const rollbackStatements = rollbackGenerator.generateRollbackMigration(forwardStatements);
			
			expect(rollbackStatements).toHaveLength(1);
			expect(rollbackStatements[0].type).toBe('update');
			expect(rollbackStatements[0].sql).toContain('UPDATE `test_table`');
			expect(rollbackStatements[0].destructive).toBe(false);
		});
		
		it('should generate rollback statements for DELETE', () => {
			const forwardStatements: SQLStatement[] = [
				{
					sql: 'DELETE FROM `test_table` WHERE `status` = \'inactive\'',
					type: 'delete',
					destructive: true,
					table: 'test_table'
				}
			];
			
			const rollbackStatements = rollbackGenerator.generateRollbackMigration(forwardStatements);
			
			expect(rollbackStatements).toHaveLength(1);
			expect(rollbackStatements[0].type).toBe('insert');
			expect(rollbackStatements[0].sql).toContain('INSERT INTO `test_table`');
			expect(rollbackStatements[0].destructive).toBe(false);
		});
		
		it('should handle multiple forward statements', () => {
			const forwardStatements: SQLStatement[] = [
				{
					sql: 'CREATE TABLE `test_table` (`id` integer PRIMARY KEY, `name` varchar(100))',
					type: 'create_table',
					destructive: false,
					table: 'test_table'
				},
				{
					sql: 'ALTER TABLE `test_table` ADD COLUMN `email` varchar(255)',
					type: 'alter_table',
					destructive: false,
					table: 'test_table',
					column: 'email'
				},
				{
					sql: 'CREATE INDEX `idx_name` ON `test_table` (`name`)',
					type: 'create_index',
					destructive: false,
					table: 'test_table'
				}
			];
			
			const rollbackStatements = rollbackGenerator.generateRollbackMigration(forwardStatements);
			
			// Should have 3 rollback statements in reverse order
			expect(rollbackStatements).toHaveLength(3);
			
			// Last forward statement (create_index) should be first rollback
			expect(rollbackStatements[0].type).toBe('drop_index');
			expect(rollbackStatements[0].sql).toContain('DROP INDEX `idx_name`');
			
			// Second forward statement (alter_table) should be second rollback
			expect(rollbackStatements[1].type).toBe('alter_table');
			expect(rollbackStatements[1].sql).toContain('ALTER TABLE `test_table` DROP COLUMN `email`');
			
			// First forward statement (create_table) should be last rollback
			expect(rollbackStatements[2].type).toBe('drop_table');
			expect(rollbackStatements[2].sql).toContain('DROP TABLE `test_table`');
		});
		
		it('should handle empty forward statements', () => {
			const forwardStatements: SQLStatement[] = [];
			
			const rollbackStatements = rollbackGenerator.generateRollbackMigration(forwardStatements);
			
			expect(rollbackStatements).toHaveLength(0);
		});
		
		it('should handle unknown statement type', () => {
			const forwardStatements: SQLStatement[] = [
				{
					sql: 'SELECT * FROM `test_table`',
					type: 'other',
					destructive: false,
					table: 'test_table'
				}
			];
			
			const rollbackStatements = rollbackGenerator.generateRollbackMigration(forwardStatements);
			
			// Unknown statement types should not have rollback
			expect(rollbackStatements).toHaveLength(0);
		});
	});
	
	describe('Custom options', () => {
		it('should use custom identifier quote character', () => {
			const customGenerator = new RollbackGenerator({ identifierQuote: '"' });
			
			const forwardStatement: SQLStatement = {
				sql: 'CREATE TABLE "test_table" ("id" integer PRIMARY KEY)',
				type: 'create_table',
				destructive: false,
				table: 'test_table'
			};
			
			const rollbackStatements = customGenerator.generateRollbackMigration([forwardStatement]);
			
			expect(rollbackStatements[0].sql).toContain('DROP TABLE "test_table"');
			expect(rollbackStatements[0].sql).not.toContain('`test_table`');
		});
		
		it('should include comments when enabled', () => {
			const customGenerator = new RollbackGenerator({ includeComments: true });
			
			const forwardStatement: SQLStatement = {
				sql: 'CREATE TABLE `test_table` (`id` integer PRIMARY KEY)',
				type: 'create_table',
				destructive: false,
				table: 'test_table'
			};
			
			const rollbackStatements = customGenerator.generateRollbackMigration([forwardStatement]);
			
			expect(rollbackStatements[0].comment).toBeDefined();
			expect(rollbackStatements[0].comment).toContain('Rollback: CREATE TABLE');
		});
		
		it('should not include comments when disabled', () => {
			const customGenerator = new RollbackGenerator({ includeComments: false });
			
			const forwardStatement: SQLStatement = {
				sql: 'CREATE TABLE `test_table` (`id` integer PRIMARY KEY)',
				type: 'create_table',
				destructive: false,
				table: 'test_table'
			};
			
			const rollbackStatements = customGenerator.generateRollbackMigration([forwardStatement]);
			
			expect(rollbackStatements[0].comment).toBeUndefined();
		});
	});
	
	describe('Error handling', () => {
		it('should handle null forward statement', () => {
			const forwardStatement = null as any;
			
			const rollbackStatements = rollbackGenerator.generateRollbackMigration([forwardStatement]);
			
			expect(rollbackStatements).toHaveLength(0);
		});
		
		it('should handle empty SQL statement', () => {
			const forwardStatement: SQLStatement = {
				sql: '',
				type: 'create_table',
				destructive: false,
				table: 'test_table'
			};
			
			const rollbackStatements = rollbackGenerator.generateRollbackMigration([forwardStatement]);
			
			expect(rollbackStatements).toHaveLength(0);
		});
		
		it('should handle malformed SQL statement', () => {
			const forwardStatement: SQLStatement = {
				sql: 'INVALID SQL SYNTAX',
				type: 'create_table',
				destructive: false,
				table: 'test_table'
			};
			
			const rollbackStatements = rollbackGenerator.generateRollbackMigration([forwardStatement]);
			
			// Should not crash but return empty for unparseable SQL
			expect(rollbackStatements).toHaveLength(0);
		});
	});
});