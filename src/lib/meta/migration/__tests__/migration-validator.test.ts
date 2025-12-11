/**
 * Migration Validator Tests
 * 
 * This file contains tests for MigrationValidator class, which is responsible
 * for validating migrations before execution to ensure safety and correctness.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MigrationValidator } from '../validation/migration-validator';
import type { Database } from '../../../core/database/database';
import type { Migration, SchemaDiff } from '../types';
import type {
	MigrationValidation,
	SchemaValidation,
	SQLValidation,
	RollbackValidation,
	ValidationOptions,
	DataLossRisk
} from '../apply-types';
import { sampleMigrations, sampleMigrationValidation, sampleDataLossRisks } from './fixtures/apply-fixtures';
import { complexSchemaDiff } from './fixtures/schema-diffs';

// Mock database implementation
const mockDatabase = {
	sql: vi.fn().mockResolvedValue([])
} as unknown as Database;

describe('MigrationValidator', () => {
	let validator: MigrationValidator;

	beforeEach(() => {
		validator = new MigrationValidator(mockDatabase, {
			checkDataLoss: true,
			validateSQL: true,
			checkRollback: true,
			validateData: true,
			checkPerformance: true,
			customRules: []
		});
		vi.clearAllMocks();
	});



	describe('validateMigration', () => {
		it('should return valid for simple migration', async () => {
			const migration = sampleMigrations.addColumn;

			const validation = await validator.validateMigration(migration);

			expect(validation.valid).toBe(true);
			expect(validation.errors).toHaveLength(0);
			expect(validation.score).toBeGreaterThan(90);
			expect(validation.validatedAt).toBeInstanceOf(Date);
		});

		it('should return invalid for migration with data loss risks', async () => {
			const migration = sampleMigrations.removeColumn;

			// Mock checkDataLossRisks to return risks
			vi.spyOn(validator, 'checkDataLossRisks').mockResolvedValue(
				sampleDataLossRisks.columnRemoval
			);

			const validation = await validator.validateMigration(migration);

			expect(validation.valid).toBe(false);
			expect(validation.errors.length).toBeGreaterThan(0);
			expect(validation.warnings.length).toBeGreaterThan(0);
			expect(validation.score).toBeLessThan(50);
		});

		it('should include recommendations for complex migrations', async () => {
			const migration = sampleMigrations.complex;

			// Mock all validation methods to return issues
			vi.spyOn(validator, 'checkDataLossRisks').mockResolvedValue(
				sampleDataLossRisks.columnRemoval
			);
			vi.spyOn(validator, 'validateRollbackPossibility').mockResolvedValue({
				possible: false,
				blockers: [{
					type: 'irreversible',
					description: 'Table rebuild cannot be rolled back',
					migrationId: 'test_migration',
					severity: 'critical',
					resolution: ['Design reversible migration']
				}],
				risks: [],
				recommendations: [],
				difficulty: 'impossible'
			});

			const validation = await validator.validateMigration(migration);

			expect(validation.recommendations.length).toBeGreaterThan(0);
			expect(validation.recommendations[0]).toContain('Fix validation errors before proceeding');
		});
	});

	describe('validateSchemaDiff', () => {
		it('should return valid for simple schema diff', async () => {
			const diff = {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			};

			const validation = await validator.validateSchemaDiff(diff);

			expect(validation.valid).toBe(true);
			expect(validation.errors).toHaveLength(0);
			expect(validation.inconsistencies).toHaveLength(0);
		});

		it('should detect conflicting changes', async () => {
			const diff = {
				addedColumns: [
					{ fieldname: 'email', column: { name: 'email', type: 'varchar' }, destructive: false }
				],
				removedColumns: [
					{ fieldname: 'email', column: { name: 'email', type: 'varchar' }, destructive: true }
				],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			};

			const validation = await validator.validateSchemaDiff({
				...diff,
				addedColumns: diff.addedColumns.map(col => ({
					...col,
					column: {
						...col.column,
						nullable: true,
						primary_key: false,
						auto_increment: false,
						unique: false
					}
				})),
				removedColumns: diff.removedColumns.map(col => ({
					...col,
					column: {
						...col.column,
						nullable: true,
						primary_key: false,
						auto_increment: false,
						unique: false
					}
				}))
			});

			expect(validation.valid).toBe(false);
			expect(validation.errors.length).toBeGreaterThan(0);
			expect(validation.errors[0].message).toContain('Conflicting changes');
		});

		it('should provide recommendations for destructive changes', async () => {
			const diff = {
				addedColumns: [],
				removedColumns: [
					{ fieldname: 'legacy_field', column: { name: 'legacy_field', type: 'text' }, destructive: true }
				],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			};

			const validation = await validator.validateSchemaDiff({
				...diff,
				removedColumns: diff.removedColumns.map(col => ({
					...col,
					column: {
						...col.column,
						nullable: true,
						primary_key: false,
						auto_increment: false,
						unique: false
					}
				}))
			});

			expect(validation.recommendations.length).toBeGreaterThan(0);
			expect(validation.recommendations[0].type).toBe('DATA_PRESERVATION');
			expect(validation.recommendations[0].description).toContain('backup');
		});
	});

	describe('validateSQLStatements', () => {
		it('should return valid for correct SQL statements', async () => {
			const statements = [
				'ALTER TABLE `test_table` ADD COLUMN `email` varchar(255);',
				'CREATE INDEX `idx_email` ON `test_table` (`email`);'
			];

			const validation = await validator.validateSQLStatements(statements);

			expect(validation.valid).toBe(true);
			expect(validation.syntaxErrors).toHaveLength(0);
			expect(validation.optimizations.length).toBeGreaterThanOrEqual(0);
		});

		it('should detect syntax errors', async () => {
			const statements = [
				'ALTER TABLE `test_table` ADD COLUMN;', // Missing column definition
				'CREATE INDEX WITH INVALID SYNTAX' // Invalid syntax
			];

			const validation = await validator.validateSQLStatements(statements);

			expect(validation.valid).toBe(false);
			expect(validation.syntaxErrors.length).toBeGreaterThan(0);
		});

		it('should detect performance issues', async () => {
			const statements = [
				'SELECT * FROM `large_table`;', // Unbounded SELECT
				'UPDATE `test_table` SET `field` = `value`;' // Missing WHERE clause
			];

			const validation = await validator.validateSQLStatements(statements);

			expect(validation.performanceWarnings.length).toBeGreaterThan(0);
			expect(validation.performanceWarnings[0].message).toContain('Unbounded SELECT');
		});

		it('should detect security issues', async () => {
			const userInput = 'admin"; DROP TABLE users; --';
			const statements = [
				"SELECT * FROM `users` WHERE `name` = '" + userInput + "';" // SQL injection risk
			];

			const validation = await validator.validateSQLStatements(statements);

			expect(validation.securityIssues.length).toBeGreaterThan(0);
			expect(validation.securityIssues[0].type).toBe('sql_injection');
		});
	});

	describe('validateRollbackPossibility', () => {
		it('should return possible for simple migration', async () => {
			const migration = sampleMigrations.addColumn;

			const validation = await validator.validateRollbackPossibility(migration);

			expect(validation.possible).toBe(true);
			expect(validation.blockers).toHaveLength(0);
			expect(validation.difficulty).toBe('easy');
			expect(validation.recommendations.length).toBeGreaterThan(0);
		});

		it('should return impossible for destructive operations', async () => {
			const migration = sampleMigrations.removeColumn;

			const validation = await validator.validateRollbackPossibility(migration);

			expect(validation.possible).toBe(false);
			expect(validation.blockers.length).toBeGreaterThan(0);
			expect(validation.difficulty).toBe('impossible');
		});

		it('should identify rollback risks', async () => {
			const migration = {
				...sampleMigrations.complex,
				sql: ["UPDATE `tabTestDocType` SET `modified_field` = 'value'"] // Risk: UPDATE without WHERE
			};

			const validation = await validator.validateRollbackPossibility(migration);

			expect(validation.risks.length).toBeGreaterThan(0);
			expect(validation.risks[0].type).toBeDefined();
		});
	});

	describe('checkDataLossRisks', () => {
		it('should identify column removal risks', async () => {
			const diff = {
				addedColumns: [],
				removedColumns: [
					{
						fieldname: 'legacy_field',
						column: {
							name: 'legacy_field',
							type: 'text',
							nullable: true,
							primary_key: false,
							auto_increment: false,
							unique: false
						},
						destructive: true
					}
				],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			};

			// Mock database to return record count
			mockDatabase.sql = vi.fn().mockResolvedValue([{ count: 1000 }]);

			const risks = await validator.checkDataLossRisks(diff);

			expect(risks).toHaveLength(1);
			expect(risks[0].type).toBe('column_removal');
			expect(risks[0].severity).toBe('high');
			expect(risks[0].target).toContain('legacy_field');
			expect(risks[0].estimatedAffectedRecords).toBe(1000);
			expect(risks[0].mitigation.some(m => m.includes('Export column data'))).toBe(true);
		});

		it('should identify type conversion risks', async () => {
			const diff = {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [
					{
						fieldname: 'status',
						changes: {
							type: { from: 'varchar', to: 'enum' }
						},
						requiresDataMigration: true,
						destructive: true
					}
				],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			};

			// Mock database to return record count
			mockDatabase.sql = vi.fn().mockResolvedValue([{ count: 500 }]);

			const risks = await validator.checkDataLossRisks(diff);

			expect(risks.length).toBeGreaterThanOrEqual(1);
			expect(risks[0].type).toBe('type_conversion');
			expect(risks[0].severity).toBe('medium');
			expect(risks[0].target).toContain('status');
			expect(risks[0].mitigation.some(m => m.includes('Test conversion'))).toBe(true);
		});

		it('should identify table rebuild risks', async () => {
			const diff = {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [
					{
						fieldname: 'modified_field',
						changes: { type: { from: 'varchar', to: 'text' } },
						requiresDataMigration: true,
						destructive: false
					}
				],
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
							primary_key: false,
							auto_increment: false,
							unique: false
						}
					}
				]
			};

			// Mock database to return record count
			mockDatabase.sql = vi.fn().mockResolvedValue([{ count: 1000 }]);

			const risks = await validator.checkDataLossRisks(diff);

			const tableRebuildRisks = risks.filter(r => r.type === 'table_rebuild');
			expect(tableRebuildRisks.length).toBeGreaterThan(0);
			expect(tableRebuildRisks[0].severity).toBe('medium');
			expect(tableRebuildRisks[0].mitigation.some(m => m.includes('maintenance window'))).toBe(true);
		});
	});
});