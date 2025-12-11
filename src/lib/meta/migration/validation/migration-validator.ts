/**
 * Migration Validator
 * 
 * Validates migrations before execution to ensure safety and correctness.
 * Checks for data loss risks, SQL syntax, rollback possibility, and more.
 */

import type { Database } from '../../../core/database/database';
import type { Migration, SchemaDiff } from '../types';
import type {
	ValidationOptions,
	MigrationValidation,
	SchemaValidation,
	SQLValidation,
	RollbackValidation,
	DataLossRisk,
	MigrationStatus
} from '../apply-types';

/**
 * Validates migrations before execution
 */
export class MigrationValidator {
	private database: Database;
	private options: Required<ValidationOptions>;

	/**
	 * Create a new MigrationValidator instance
	 * @param database Database connection
	 * @param options Validation options
	 */
	constructor(database: Database, options: ValidationOptions = {}) {
		this.database = database;
		this.options = {
			checkDataLoss: true,
			validateSQL: true,
			checkRollback: true,
			validateData: true,
			checkPerformance: true,
			customRules: [],
			...options
		};
	}

	/**
	 * Validate a migration
	 * @param migration Migration to validate
	 * @returns Promise resolving to MigrationValidation
	 */
	async validateMigration(migration: Migration): Promise<MigrationValidation> {
		const errors: any[] = [];
		const warnings: any[] = [];
		const recommendations: string[] = [];
		let score = 100;

		try {
			// Validate migration structure
			const structureValidation = this.validateMigrationStructure(migration);
			if (!structureValidation.valid) {
				errors.push(...structureValidation.errors);
				score -= 20;
			}
			warnings.push(...structureValidation.warnings);

			// Validate SQL statements
			if (this.options.validateSQL) {
				const sqlValidation = await this.validateMigrationSQL(migration);
				if (!sqlValidation.valid) {
					errors.push(...sqlValidation.syntaxErrors);
					score -= 30;
				}
				warnings.push(...sqlValidation.performanceWarnings);

				if (sqlValidation.securityIssues.length > 0) {
					errors.push(...sqlValidation.securityIssues);
					score -= 40;
				}
			}

			// Check for data loss risks
			if (this.options.checkDataLoss) {
				const dataLossRisks = await this.checkDataLossRisks(migration.diff);
				if (dataLossRisks.length > 0) {
					const highRiskRisks = dataLossRisks.filter((r: any) =>
						r.severity === 'high' || r.severity === 'critical'
					);
					if (highRiskRisks.length > 0) {
						errors.push(...highRiskRisks);
						score -= 50;
					} else {
						warnings.push(...dataLossRisks);
						score -= 10;
					}
				}
			}

			// Check rollback possibility
			if (this.options.checkRollback) {
				const rollbackValidation = await this.validateRollbackPossibility(migration);
				if (!rollbackValidation.possible) {
					warnings.push(...rollbackValidation.blockers);
					score -= 15;
				}
				warnings.push(...rollbackValidation.risks.map(r => r.description));
				recommendations.push(...rollbackValidation.recommendations.map(r => r.description));
			}

			// Generate recommendations based on validation results
			if (errors.length > 0) {
				recommendations.push('Fix validation errors before proceeding');
			}

			if (score < 70) {
				recommendations.push('Migration has significant validation issues - review carefully');
			} else if (score < 90) {
				recommendations.push('Migration has minor validation issues - consider review');
			}

			return {
				valid: errors.length === 0,
				errors,
				warnings,
				recommendations,
				score: Math.max(0, score),
				validatedAt: new Date()
			};

		} catch (error) {
			return {
				valid: false,
				errors: [{
					code: 'VALIDATION_ERROR',
					message: `Validation failed: ${error instanceof Error ? error.message : String(error)
						}`,
					severity: 'error',
					suggestion: 'Check migration configuration and dependencies'
				}],
				warnings,
				recommendations: ['Fix validation errors before proceeding'],
				score: 0,
				validatedAt: new Date()
			};
		}
	}

	/**
	 * Validate a schema diff
	 * @param diff SchemaDiff to validate
	 * @returns Promise resolving to SchemaValidation
	 */
	async validateSchemaDiff(diff: SchemaDiff): Promise<SchemaValidation> {
		const errors: any[] = [];
		const warnings: any[] = [];
		const inconsistencies: any[] = [];
		const recommendations: any[] = [];

		try {
			// Check for conflicting changes
			const conflictingChanges = this.detectConflictingChanges(diff);
			if (conflictingChanges.length > 0) {
				errors.push(...conflictingChanges);
			}

			// Check for inconsistent column definitions
			const columnInconsistencies = this.validateColumnConsistency(diff);
			if (columnInconsistencies.length > 0) {
				warnings.push(...columnInconsistencies);
			}

			// Check for index conflicts
			const indexConflicts = this.validateIndexConsistency(diff);
			if (indexConflicts.length > 0) {
				warnings.push(...indexConflicts);
			}

			// Generate recommendations
			if (diff.removedColumns.length > 0) {
				recommendations.push({
					type: 'DATA_PRESERVATION',
					description: 'Consider creating backup before removing columns',
					priority: 'high',
					steps: [
						'Create full backup of table',
						'Export data from columns to be removed',
						'Apply migration',
						'Verify data integrity'
					]
				});
			}

			if (diff.modifiedColumns.some((c: any) => c.requiresDataMigration)) {
				recommendations.push({
					type: 'DATA_MIGRATION',
					description: 'Data migration required for type conversions',
					priority: 'medium',
					steps: [
						'Identify affected records',
						'Create data migration script',
						'Test migration on sample data',
						'Apply migration with data conversion'
					]
				});
			}

			return {
				valid: errors.length === 0,
				errors,
				warnings,
				inconsistencies,
				recommendations
			};

		} catch (error) {
			return {
				valid: false,
				errors: [{
					code: 'SCHEMA_VALIDATION_ERROR',
					message: `Schema validation failed: ${error instanceof Error ? error.message : String(error)
						}`,
					table: 'unknown',
					details: error
				}],
				warnings,
				inconsistencies,
				recommendations
			};
		}
	}

	/**
	 * Validate SQL statements
	 * @param migration Migration to validate SQL for
	 * @returns Promise resolving to SQLValidation
	 */
	async validateSQLStatements(statements: string[]): Promise<SQLValidation> {
		const syntaxErrors: any[] = [];
		const performanceWarnings: any[] = [];
		const securityIssues: any[] = [];
		const optimizations: any[] = [];

		for (const sql of statements) {
			try {
				// Basic SQL syntax validation (simplified)
				if (!this.isValidSQLSyntax(sql)) {
					syntaxErrors.push({
						message: 'Invalid SQL syntax',
						sql,
						position: this.findSQLErrorPosition(sql)
					});
				}

				// Performance analysis
				const perfAnalysis = this.analyzeSQLPerformance(sql);
				if (perfAnalysis.impact !== 'low') {
					performanceWarnings.push({
						message: perfAnalysis.description,
						sql,
						impact: perfAnalysis.impact,
						optimization: perfAnalysis.suggestion
					});
				}

				// Security analysis
				const secAnalysis = this.analyzeSQLSecurity(sql);
				if (secAnalysis.issues.length > 0) {
					securityIssues.push(...secAnalysis.issues);
				}

				// Optimization suggestions
				const optAnalysis = this.analyzeSQLOptimizations(sql);
				if (optAnalysis.optimizations.length > 0) {
					optimizations.push(...optAnalysis.optimizations);
				}

			} catch (error) {
				syntaxErrors.push({
					message: `SQL analysis failed: ${error instanceof Error ? error.message : String(error)
						}`,
					sql
				});
			}
		}

		return {
			valid: syntaxErrors.length === 0,
			syntaxErrors,
			performanceWarnings,
			securityIssues,
			optimizations
		};
	}

	/**
	 * Validate rollback possibility for a migration
	 * @param migration Migration to validate rollback for
	 * @returns Promise resolving to RollbackValidation
	 */
	async validateRollbackPossibility(migration: Migration): Promise<RollbackValidation> {
		const blockers: any[] = [];
		const risks: any[] = [];
		const recommendations: string[] = [];
		let difficulty: 'easy' | 'medium' | 'hard' | 'impossible' = 'easy';

		try {
			// Check for irreversible operations
			const irreversibleOps = this.identifyIrreversibleOperations(migration);
			if (irreversibleOps.length > 0) {
				blockers.push(...irreversibleOps);
				difficulty = 'impossible';
			}

			// Check for data dependency issues
			const dependencyIssues = this.checkRollbackDependencies(migration);
			if (dependencyIssues.length > 0) {
				risks.push(...dependencyIssues);
				if (difficulty !== 'impossible') {
					difficulty = 'hard';
				}
			}

			// Check for data consistency risks
			const consistencyRisks = this.assessRollbackDataConsistency(migration);
			if (consistencyRisks.length > 0) {
				risks.push(...consistencyRisks);
				if (difficulty === 'easy') {
					difficulty = 'medium';
				}
			}

			// Generate recommendations
			if (blockers.length === 0) {
				recommendations.push('Rollback appears safe - consider creating backup before proceeding');
			} else {
				recommendations.push('Consider alternative migration approach to avoid irreversible changes');
			}

			return {
				possible: blockers.length === 0,
				blockers,
				risks,
				recommendations: recommendations.map(r => ({ type: 'GENERAL', description: r, priority: 'medium', steps: [], prerequisites: [] })),
				difficulty
			};

		} catch (error) {
			return {
				possible: false,
				blockers: [{
					type: 'VALIDATION_ERROR',
					description: `Rollback validation failed: ${error instanceof Error ? error.message : String(error)
						}`,
					migrationId: migration.id,
					severity: 'critical',
					resolution: ['Fix validation errors', 'Review migration design']
				}],
				risks: [{
					type: 'other',
					description: 'Unable to complete rollback validation',
					level: 'critical',
					affectedTables: [migration.doctype],
					mitigation: ['Fix validation errors', 'Re-run validation']
				}],
				recommendations: [{
					type: 'ERROR_RESOLUTION',
					description: 'Resolve validation errors before proceeding',
					priority: 'high',
					steps: ['Fix validation errors', 'Re-run validation'],
					prerequisites: ['Identify root cause', 'Review validation logic']
				}],
				difficulty: 'impossible'
			};
		}
	}

	/**
	 * Check for data loss risks in a schema diff
	 * @param diff SchemaDiff to analyze
	 * @returns Promise resolving to array of DataLossRisk
	 */
	async checkDataLossRisks(diff: SchemaDiff): Promise<DataLossRisk[]> {
		const risks: DataLossRisk[] = [];

		// Check for column removal
		for (const column of diff.removedColumns) {
			if (column.destructive) {
				// Estimate affected records (simplified)
				const estimatedRecords = await this.estimateTableRecords(diff);

				risks.push({
					type: 'column_removal',
					severity: 'high',
					target: `${column.fieldname} column`,
					description: `Removing column '${column.fieldname}' will permanently delete all data in this column`,
					estimatedAffectedRecords: estimatedRecords,
					mitigation: [
						'Export column data before removal',
						'Create backup of entire table',
						'Consider marking column as unused instead of removing'
					]
				});
			}
		}

		// Check for destructive type changes
		for (const change of diff.modifiedColumns) {
			if (change.destructive) {
				const typeChange = change.changes.type;
				if (typeChange) {
					const riskLevel = this.assessTypeConversionRisk(typeChange.from, typeChange.to);

					risks.push({
						type: 'type_conversion',
						severity: riskLevel,
						target: `${change.fieldname} column (${typeChange.from} → ${typeChange.to})`,
						description: `Converting column '${change.fieldname}' from ${typeChange.from} to ${typeChange.to} may cause data loss`,
						estimatedAffectedRecords: await this.estimateTableRecords(diff),
						mitigation: [
							'Test conversion on sample data',
							'Create data migration script',
							'Provide default values for incompatible conversions',
							'Consider using temporary column for migration'
						]
					});
				}
			}
		}

		// Check for table rebuild operations
		const hasTableRebuild = diff.modifiedColumns.some((c: any) => c.requiresDataMigration) ||
			diff.renamedColumns.length > 0;

		if (hasTableRebuild) {
			risks.push({
				type: 'table_rebuild',
				severity: 'medium',
				target: diff.modifiedColumns.map((c: any) => c.fieldname).join(', ') || 'table structure',
				description: 'Table rebuild operation may cause temporary data inaccessibility',
				estimatedAffectedRecords: await this.estimateTableRecords(diff),
				mitigation: [
					'Schedule during maintenance window',
					'Create full backup before rebuild',
					'Use transaction to ensure atomicity',
					'Test rebuild process on non-production data'
				]
			});
		}

		return risks;
	}

	/**
	 * Validate basic migration structure
	 * @param migration Migration to validate
	 * @returns Validation result
	 */
	private validateMigrationStructure(migration: Migration): {
		valid: boolean;
		errors: any[];
		warnings: any[];
	} {
		const errors: any[] = [];
		const warnings: any[] = [];

		// Check required fields
		if (!migration.id || migration.id.trim() === '') {
			errors.push({
				code: 'MISSING_ID',
				message: 'Migration ID is required',
				severity: 'error',
				suggestion: 'Provide a unique migration identifier'
			});
		}

		if (!migration.doctype || migration.doctype.trim() === '') {
			errors.push({
				code: 'MISSING_DOCTYPE',
				message: 'DocType name is required',
				severity: 'error',
				suggestion: 'Specify the target DocType for this migration'
			});
		}

		if (!migration.sql || (Array.isArray(migration.sql) && migration.sql.length === 0)) {
			errors.push({
				code: 'MISSING_SQL',
				message: 'Migration SQL statements are required',
				severity: 'error',
				suggestion: 'Provide SQL statements to execute for this migration'
			});
		}

		if (!migration.rollbackSql || (Array.isArray(migration.rollbackSql) && migration.rollbackSql.length === 0)) {
			warnings.push({
				code: 'MISSING_ROLLBACK',
				message: 'Rollback SQL statements are recommended',
				type: 'other',
				field: 'rollback'
			});
		}

		// Check version format
		if (!migration.version || !this.isValidVersionFormat(migration.version)) {
			errors.push({
				code: 'INVALID_VERSION',
				message: 'Migration version is required and must follow semantic versioning',
				severity: 'error',
				suggestion: 'Use semantic versioning (e.g., 1.0.0, 1.1.0)'
			});
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings
		};
	}

	/**
	 * Validate SQL syntax (simplified implementation)
	 * @param sql SQL statement to validate
	 * @returns True if syntax appears valid
	 */
	private isValidSQLSyntax(sql: string): boolean {
		const trimmedSQL = sql.trim();

		// Basic checks
		if (trimmedSQL === '') {
			return false;
		}

		// Check for balanced parentheses
		let parenCount = 0;
		for (const char of trimmedSQL) {
			if (char === '(') parenCount++;
			else if (char === ')') parenCount--;
		}
		if (parenCount !== 0) {
			return false;
		}

		const upperSQL = trimmedSQL.toUpperCase();

		// Check for CREATE INDEX without ON
		if (upperSQL.includes('CREATE INDEX') && !upperSQL.includes('ON')) {
			return false;
		}

		// Check for ALTER TABLE ... ADD COLUMN without column definition
		if (upperSQL.includes('ALTER TABLE') && upperSQL.includes('ADD COLUMN')) {
			const parts = upperSQL.split(/ADD COLUMN/i);
			if (parts.length > 1 && (parts[1].trim() === '' || parts[1].trim() === ';')) {
				return false;
			}
		}

		// Check for basic SQL keywords
		const dangerousKeywords = ['DROP TABLE', 'DELETE FROM', 'TRUNCATE TABLE'];

		for (const keyword of dangerousKeywords) {
			if (upperSQL.includes(keyword) && !upperSQL.includes('WHERE')) {
				// This might be intentional, so just warn
				return true; // Allow but would be flagged in security analysis
			}
		}

		return true;
	}

	/**
	 * Analyze SQL performance characteristics
	 * @param sql SQL statement to analyze
	 * @returns Performance analysis result
	 */
	private analyzeSQLPerformance(sql: string): {
		impact: 'low' | 'medium' | 'high';
		description: string;
		suggestion: string;
	} {
		const upperSQL = sql.toUpperCase();

		// Check for potentially slow operations
		if (upperSQL.includes('SELECT *') && !upperSQL.includes('LIMIT')) {
			return {
				impact: 'high',
				description: 'Unbounded SELECT * query may be slow on large tables',
				suggestion: 'Add LIMIT clause or specify required columns'
			};
		}

		if (upperSQL.includes('ALTER TABLE') && upperSQL.includes('MODIFY COLUMN')) {
			return {
				impact: 'medium',
				description: 'Column modification may lock table',
				suggestion: 'Consider using temporary column strategy'
			};
		}

		if (upperSQL.includes('CREATE INDEX') && upperSQL.includes('TEXT')) {
			return {
				impact: 'medium',
				description: 'Indexing TEXT columns may be inefficient',
				suggestion: 'Consider indexing specific prefixes or using FULLTEXT'
			};
		}

		return {
			impact: 'low',
			description: 'No obvious performance issues detected',
			suggestion: 'Monitor execution time on production data'
		};
	}

	/**
	 * Analyze SQL for security issues
	 * @param sql SQL statement to analyze
	 * @returns Security analysis result
	 */
	private analyzeSQLSecurity(sql: string): {
		issues: any[];
	} {
		const issues: any[] = [];
		const upperSQL = sql.toUpperCase();

		// Check for SQL injection patterns (simplified)
		if (sql.includes('${') || sql.includes('%s') || sql.includes('?')) {
			// These are parameter placeholders, which is good
		}

		// Check for potentially malicious string concatenation and injection characters
		if (sql.match(/['"];\s*DROP|['"];\s*DELETE|['"];\s*UPDATE|['"];\s*INSERT/i) ||
			(sql.includes("'") && sql.includes(";") && sql.includes("--"))) {
			issues.push({
				type: 'sql_injection',
				description: 'Potential SQL injection pattern detected',
				sql,
				severity: 'critical',
				fix: 'Use parameterized queries'
			});
		}

		// Check for potentially dangerous operations
		if (upperSQL.includes('DROP TABLE') && !upperSQL.includes('IF EXISTS')) {
			issues.push({
				type: 'data_exposure',
				description: 'DROP TABLE without IF EXISTS check may cause errors',
				sql,
				severity: 'medium',
				fix: 'Add IF EXISTS clause or check table existence first'
			});
		}

		return { issues };
	}

	/**
	 * Analyze SQL for optimization opportunities
	 * @param sql SQL statement to analyze
	 * @returns Optimization analysis result
	 */
	private analyzeSQLOptimizations(sql: string): {
		optimizations: any[];
	} {
		const optimizations: any[] = [];
		const upperSQL = sql.toUpperCase();

		// Check for missing indexes hints
		if (upperSQL.includes('WHERE') && upperSQL.includes('JOIN') && !upperSQL.includes('INDEX')) {
			optimizations.push({
				type: 'missing_index',
				description: 'JOIN operation without index hint',
				sql,
				optimizedSql: 'Consider adding appropriate indexes for JOIN columns',
				improvement: 'Faster JOIN execution'
			});
		}

		// Check for inefficient column selection
		if (upperSQL.includes('SELECT *')) {
			optimizations.push({
				type: 'column_selection',
				description: 'SELECT * instead of specific columns',
				sql,
				optimizedSql: 'Specify only required columns',
				improvement: 'Reduced I/O and memory usage'
			});
		}

		return { optimizations };
	}

	/**
	 * Identify irreversible operations in a migration
	 * @param migration Migration to analyze
	 * @returns Array of irreversible operations
	 */
	private identifyIrreversibleOperations(migration: Migration): Array<{
		type: string;
		description: string;
		severity: 'low' | 'medium' | 'high' | 'critical';
		resolution: string[];
	}> {
		const operations: any[] = [];
		const sqlStatements = Array.isArray(migration.sql) ? migration.sql : [migration.sql];

		for (const sql of sqlStatements) {
			const upperSQL = sql.toUpperCase();

			// Check for DROP operations
			if (upperSQL.includes('DROP COLUMN') || upperSQL.includes('DROP TABLE')) {
				operations.push({
					type: 'data_destruction',
					description: 'Operation permanently deletes data or structure',
					severity: 'high',
					resolution: [
						'Create backup before operation',
						'Consider marking as deprecated instead',
						'Use soft delete pattern'
					]
				});
			}

			// Check for data type conversions that may lose precision
			if (upperSQL.includes('ALTER TABLE') && upperSQL.includes('MODIFY COLUMN')) {
				operations.push({
					type: 'type_conversion',
					description: 'Data type conversion may lose precision or information',
					severity: 'medium',
					resolution: [
						'Create backup before conversion',
						'Test conversion on sample data',
						'Provide data migration for incompatible types'
					]
				});
			}
		}

		return operations;
	}

	/**
	 * Check rollback dependencies
	 * @param migration Migration to check
	 * @returns Array of dependency issues
	 */
	private checkRollbackDependencies(migration: Migration): Array<{
		type: string;
		description: string;
		level: 'low' | 'medium' | 'high';
		tables: string[];
	}> {
		const dependencies: any[] = [];
		const sqlStatements = Array.isArray(migration.sql) ? migration.sql : [migration.sql];

		for (const sql of sqlStatements) {
			const upperSQL = sql.toUpperCase();

			// Check for foreign key constraints
			if (upperSQL.includes('ADD CONSTRAINT') && upperSQL.includes('FOREIGN KEY')) {
				dependencies.push({
					type: 'foreign_key_dependency',
					description: 'Foreign key constraints may complicate rollback',
					level: 'medium',
					tables: [migration.doctype]
				});
			}

			// Check for unique constraints
			if (upperSQL.includes('ADD UNIQUE') || upperSQL.includes('ADD CONSTRAINT UNIQUE')) {
				dependencies.push({
					type: 'unique_constraint_dependency',
					description: 'Unique constraints may conflict during rollback',
					level: 'low',
					tables: [migration.doctype]
				});
			}
		}

		return dependencies;
	}

	/**
	 * Assess rollback data consistency risks
	 * @param migration Migration to assess
	 * @returns Array of consistency risks
	 */
	private assessRollbackDataConsistency(migration: Migration): Array<{
		type: string;
		description: string;
		level: 'low' | 'medium' | 'high';
		affectedTables: string[];
	}> {
		const risks: any[] = [];

		// Check for operations that might leave data in inconsistent state
		const sqlStatements = Array.isArray(migration.sql) ? migration.sql : [migration.sql];

		for (const sql of sqlStatements) {
			const upperSQL = sql.toUpperCase();

			// Check for operations that don't validate data
			if (upperSQL.includes('UPDATE') && !upperSQL.includes('WHERE')) {
				risks.push({
					type: 'data_consistency',
					description: 'UPDATE without WHERE clause affects all rows',
					level: 'high',
					affectedTables: [migration.doctype]
				});
			}

			// Check for cascading operations
			if (upperSQL.includes('CASCADE')) {
				risks.push({
					type: 'cascade_operation',
					description: 'Cascading operations may have widespread effects',
					level: 'medium',
					affectedTables: [migration.doctype]
				});
			}
		}

		return risks;
	}

	/**
	 * Detect conflicting changes in schema diff
	 * @param diff SchemaDiff to analyze
	 * @returns Array of conflicting changes
	 */
	private detectConflictingChanges(diff: SchemaDiff): Array<{
		type: string;
		message: string;
		table: string;
		field: string;
	}> {
		const conflicts: any[] = [];

		// Check for column that is both added and removed
		const addedColumnNames = diff.addedColumns.map((c: any) => c.fieldname);
		const removedColumnNames = diff.removedColumns.map((c: any) => c.fieldname);

		for (const name of addedColumnNames) {
			if (removedColumnNames.includes(name)) {
				conflicts.push({
					type: 'column_conflict',
					message: `Conflicting changes: Column '${name}' is both added and removed`,
					table: 'unknown',
					field: name
				});
			}
		}

		// Check for index conflicts
		const addedIndexNames = diff.addedIndexes.map((i: any) => i.name);
		const removedIndexNames = diff.removedIndexes.map((i: any) => i.name);

		for (const name of addedIndexNames) {
			if (removedIndexNames.includes(name)) {
				conflicts.push({
					type: 'index_conflict',
					message: `Conflicting changes: Index '${name}' is both added and removed`,
					table: 'unknown',
					field: name
				});
			}
		}

		return conflicts;
	}

	/**
	 * Validate column consistency in schema diff
	 * @param diff SchemaDiff to analyze
	 * @returns Array of inconsistencies
	 */
	private validateColumnConsistency(diff: SchemaDiff): Array<{
		type: string;
		description: string;
		table: string;
		field: string;
	}> {
		const inconsistencies: any[] = [];

		// Check for inconsistent column definitions
		for (const column of diff.addedColumns) {
			if (!column.column.name || column.column.name.trim() === '') {
				inconsistencies.push({
					type: 'missing_column_name',
					description: 'Added column missing name',
					table: 'unknown',
					field: 'unknown'
				});
			}

			if (!column.column.type || column.column.type.trim() === '') {
				inconsistencies.push({
					type: 'missing_column_type',
					description: 'Added column missing type',
					table: 'unknown',
					field: column.column.name || 'unknown'
				});
			}
		}

		return inconsistencies;
	}

	/**
	 * Validate index consistency in schema diff
	 * @param diff SchemaDiff to analyze
	 * @returns Array of conflicts
	 */
	private validateIndexConsistency(diff: SchemaDiff): Array<{
		type: string;
		description: string;
		table: string;
	}> {
		const conflicts: any[] = [];

		// Check for index without columns
		for (const index of diff.addedIndexes) {
			if (!index.index.columns || index.index.columns.length === 0) {
				conflicts.push({
					type: 'index_without_columns',
					description: `Index '${index.name}' has no columns defined`,
					table: 'unknown'
				});
			}
		}

		return conflicts;
	}

	/**
	 * Estimate number of records in affected table
	 * @param diff SchemaDiff to analyze
	 * @returns Promise resolving to estimated record count
	 */
	private async estimateTableRecords(diff: SchemaDiff): Promise<number> {
		try {
			if (this.database && typeof this.database.sql === 'function') {
				const result = await this.database.sql('SELECT count(*) as count FROM sqlite_master'); // Dummy query or specific table if known
				if (Array.isArray(result) && result.length > 0 && (result[0].count !== undefined || result[0].COUNT !== undefined)) {
					return Number(result[0].count || result[0].COUNT);
				}
			}
		} catch (e) {
			// Ignore error and fall back
		}
		return 1000; // Placeholder estimate
	}

	/**
	 * Assess risk level of type conversion
	 * @param fromType Source type
	 * @param toType Target type
	 * @returns Risk level
	 */
	private assessTypeConversionRisk(fromType: string, toType: string): 'low' | 'medium' | 'high' | 'critical' {
		const from = fromType.toUpperCase();
		const to = toType.toUpperCase();

		// Define risk levels for common type conversions
		const highRiskConversions: Array<[string, string]> = [
			['TEXT', 'INTEGER'],
			['VARCHAR', 'INTEGER'],
			['REAL', 'INTEGER'],
			['TEXT', 'DATE'],
			['VARCHAR', 'DATE']
		];

		const mediumRiskConversions: Array<[string, string]> = [
			['INTEGER', 'TEXT'],
			['INTEGER', 'VARCHAR'],
			['DATE', 'TEXT'],
			['TEXT', 'REAL'],
			['VARCHAR', 'ENUM'],
			['TEXT', 'ENUM']
		];

		// Check for high risk conversions
		for (const [f, t] of highRiskConversions) {
			if ((from.includes(f) && to.includes(t)) ||
				(to.includes(f) && from.includes(t))) {
				return 'high';
			}
		}

		// Check for medium risk conversions
		for (const [f, t] of mediumRiskConversions) {
			if ((from.includes(f) && to.includes(t)) ||
				(to.includes(f) && from.includes(t))) {
				return 'medium';
			}
		}

		return 'low';
	}

	/**
	 * Check if version follows semantic versioning
	 * @param version Version string to check
	 * @returns True if valid semantic version
	 */
	private isValidVersionFormat(version: string): boolean {
		const semanticVersionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;
		return semanticVersionRegex.test(version);
	}

	/**
	 * Find approximate position of SQL error (simplified)
	 * @param sql SQL statement
	 * @returns Approximate error position
	 */
	private findSQLErrorPosition(sql: string): number {
		// This is a simplified implementation
		// In a real implementation, you would use an SQL parser
		return Math.floor(sql.length / 2);
	}

	/**
	 * Validate migration SQL (helper method)
	 * @param Migration Migration to validate
	 * @returns Promise resolving to SQLValidation
	 */
	private async validateMigrationSQL(migration: Migration): Promise<SQLValidation> {
		const sqlStatements = Array.isArray(migration.sql) ? migration.sql : [migration.sql];
		return await this.validateSQLStatements(sqlStatements);
	}
}