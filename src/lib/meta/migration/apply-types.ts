/**
 * Apply Migration Types and Interfaces
 * 
 * This file defines TypeScript interfaces specific to migration application operations,
 * including options, results, and various supporting types for the P2-008 Apply Migrations.
 */

import type { Migration, MigrationResult } from './types';
import type { Database } from '../../core/database/database';

/**
 * Migration application options
 */
export interface ApplyOptions {
	/** Perform dry run without executing changes */
	dryRun?: boolean;
	
	/** Force migration even if potentially destructive */
	force?: boolean;
	
	/** Preserve data during destructive operations */
	preserveData?: boolean;
	
	/** Create backup before migration */
	backup?: boolean;
	
	/** Continue on error instead of rolling back */
	continueOnError?: boolean;
	
	/** Batch size for large data migrations */
	batchSize?: number;
	
	/** Timeout for migration execution in seconds */
	timeout?: number;
	
	/** Whether to validate data after migration */
	validateData?: boolean;
	
	/** Custom migration context */
	context?: Record<string, any>;
}

/**
 * Synchronization options for DocType migration
 */
export interface SyncOptions extends ApplyOptions {
	/** Whether to sync only specific changes */
	changeTypes?: ('add' | 'remove' | 'modify' | 'index')[];
	
	/** Whether to validate schema before sync */
	validateSchema?: boolean;
	
	/** Whether to check dependencies before sync */
	checkDependencies?: boolean;
}

/**
 * Rollback options
 */
export interface RollbackOptions {
	/** Whether to create backup before rollback */
	backup?: boolean;
	
	/** Whether to validate rollback possibility */
	validate?: boolean;
	
	/** Whether to force rollback despite warnings */
	force?: boolean;
	
	/** Custom rollback context */
	context?: Record<string, any>;
}

/**
 * Dry run options
 */
export interface DryRunOptions {
	/** Whether to include SQL statements in result */
	includeSQL?: boolean;
	
	/** Whether to analyze performance impact */
	analyzePerformance?: boolean;
	
	/** Whether to check for data loss risks */
	checkDataLoss?: boolean;
	
	/** Whether to validate rollback possibility */
	validateRollback?: boolean;
}

/**
 * Dry run result
 */
export interface DryRunResult {
	/** Whether migration would be successful */
	success: boolean;
	
	/** SQL statements that would be executed */
	sql: string[];
	
	/** Warnings about potential issues */
	warnings: string[];
	
	/** Errors that would occur */
	errors: string[];
	
	/** Estimated execution time in seconds */
	estimatedTime?: number;
	
	/** Number of rows that would be affected */
	estimatedAffectedRows?: number;
	
	/** Data loss risks identified */
	dataLossRisks: DataLossRisk[];
	
	/** Performance impact analysis */
	performanceImpact?: PerformanceImpact;
}

/**
 * Batch migration result
 */
export interface BatchMigrationResult {
	/** Overall success status */
	success: boolean;
	
	/** Individual migration results */
	results: Map<string, MigrationResult>;
	
	/** Successful migrations */
	successful: string[];
	
	/** Failed migrations */
	failed: string[];
	
	/** Skipped migrations */
	skipped: string[];
	
	/** Total execution time */
	totalTime: number;
	
	/** Combined warnings */
	warnings: string[];
	
	/** Combined errors */
	errors: string[];
}

/**
 * Migration status enumeration
 */
export enum MigrationStatus {
	PENDING = 'pending',
	RUNNING = 'running',
	APPLIED = 'applied',
	FAILED = 'failed',
	ROLLED_BACK = 'rolled_back'
}

/**
 * Applied migration with execution details
 */
export interface AppliedMigration extends Migration {
	/** Actual execution timestamp */
	appliedAt: Date;
	
	/** Execution duration in milliseconds */
	executionTime: number;
	
	/** Number of affected rows */
	affectedRows?: number;
	
	/** Backup path if created */
	backupPath?: string;
	
	/** User who applied the migration */
	appliedBy?: string;
	
	/** Migration status */
	status: MigrationStatus;
	
	/** Error details if failed */
	error?: string;
	
	/** Rollback information */
	rollbackInfo?: RollbackInfo;
	
	/** Execution environment details */
	environment?: ExecutionEnvironment;
}

/**
 * Migration history with statistics
 */
export interface MigrationHistory {
	/** All migrations in chronological order */
	migrations: AppliedMigration[];
	
	/** Last successfully applied migration */
	lastMigration?: AppliedMigration;
	
	/** Migrations that have not been applied yet */
	pendingMigrations: Migration[];
	
	/** Migrations that failed to apply */
	failedMigrations: AppliedMigration[];
	
	/** Migration statistics */
	stats: MigrationStats;
}

/**
 * Rollback information
 */
export interface RollbackInfo {
	/** Rollback migration ID */
	rollbackId: string;
	
	/** Original migration ID */
	originalMigrationId: string;
	
	/** Rollback timestamp */
	rolledBackAt: Date;
	
	/** Rollback execution time */
	executionTime: number;
	
	/** Whether rollback was successful */
	success: boolean;
	
	/** Error details if rollback failed */
	error?: string;
	
	/** User who performed rollback */
	rolledBackBy?: string;
}

/**
 * Execution environment details
 */
export interface ExecutionEnvironment {
	/** Database version */
	databaseVersion: string;
	
	/** SODAF framework version */
	frameworkVersion: string;
	
	/** Node.js version */
	nodeVersion: string;
	
	/** Operating system */
	platform: string;
	
	/** Memory usage at time of execution */
	memoryUsage?: NodeJS.MemoryUsage;
	
	/** Additional environment variables */
	variables?: Record<string, string>;
}

/**
 * Migration statistics
 */
export interface MigrationStats {
	/** Total number of migrations */
	total: number;
	
	/** Number of applied migrations */
	applied: number;
	
	/** Number of pending migrations */
	pending: number;
	
	/** Number of failed migrations */
	failed: number;
	
	/** Number of destructive migrations */
	destructive: number;
	
	/** Date of last migration */
	lastMigrationDate?: Date;
	
	/** Total migration execution time */
	totalExecutionTime: number;
}

/**
 * Backup type enumeration
 */
export enum BackupType {
	FULL = 'full',           // Complete table backup
	COLUMN = 'column',       // Specific column backup
	SCHEMA = 'schema',       // Schema-only backup
	INCREMENTAL = 'incremental' // Incremental backup
}

/**
 * Backup options
 */
export interface BackupOptions {
	/** Default backup type */
	defaultType?: BackupType;
	
	/** Backup storage location */
	storagePath?: string;
	
	/** Compression settings */
	compression?: 'gzip' | 'brotli' | 'none';
	
	/** Retention period in days */
	retentionDays?: number;
	
	/** Whether to encrypt backups */
	encrypt?: boolean;
	
	/** Custom backup naming pattern */
	namingPattern?: string;
	
	/** Whether to verify backup integrity */
	verifyIntegrity?: boolean;
	
	/** Whether to include indexes in backup */
	includeIndexes?: boolean;
	
	/** Whether to include triggers in backup */
	includeTriggers?: boolean;
}

/**
 * Backup information
 */
export interface BackupInfo {
	/** Unique backup identifier */
	id: string;
	
	/** Associated DocType */
	doctype: string;
	
	/** Backup type */
	type: BackupType;
	
	/** Backup creation timestamp */
	createdAt: Date;
	
	/** Backup file path */
	path: string;
	
	/** Backup file size in bytes */
	size: number;
	
	/** Whether backup is compressed */
	compressed: boolean;
	
	/** Whether backup is encrypted */
	encrypted: boolean;
	
	/** Number of records in backup */
	recordCount?: number;
	
	/** Backup checksum for integrity verification */
	checksum: string;
	
	/** Additional metadata */
	metadata?: Record<string, any>;
}

/**
 * Restore result
 */
export interface RestoreResult {
	/** Whether restore was successful */
	success: boolean;
	
	/** Number of records restored */
	recordCount?: number;
	
	/** Restore execution time in milliseconds */
	executionTime: number;
	
	/** Warnings during restore */
	warnings: string[];
	
	/** Errors during restore */
	errors: string[];
	
	/** Whether data was validated after restore */
	validated: boolean;
	
	/** Validation results */
	validation?: ValidationResults;
}

/**
 * Validation options
 */
export interface ValidationOptions {
	/** Whether to check for data loss risks */
	checkDataLoss?: boolean;
	
	/** Whether to validate SQL syntax */
	validateSQL?: boolean;
	
	/** Whether to check rollback possibility */
	checkRollback?: boolean;
	
	/** Whether to validate data integrity */
	validateData?: boolean;
	
	/** Whether to check performance impact */
	checkPerformance?: boolean;
	
	/** Custom validation rules */
	customRules?: ValidationRule[];
}

/**
 * Migration validation result
 */
export interface MigrationValidation {
	/** Whether migration is valid */
	valid: boolean;
	
	/** Validation errors */
	errors: ValidationError[];
	
	/** Validation warnings */
	warnings: ValidationWarning[];
	
	/** Recommended actions */
	recommendations: string[];
	
	/** Validation score (0-100) */
	score: number;
	
	/** Validation timestamp */
	validatedAt: Date;
}

/**
 * Schema validation result
 */
export interface SchemaValidation {
	/** Whether schema is valid */
	valid: boolean;
	
	/** Schema errors */
	errors: SchemaError[];
	
	/** Schema warnings */
	warnings: SchemaWarning[];
	
	/** Inconsistencies found */
	inconsistencies: SchemaInconsistency[];
	
	/** Recommended fixes */
	recommendations: SchemaRecommendation[];
}

/**
 * SQL validation result
 */
export interface SQLValidation {
	/** Whether SQL is valid */
	valid: boolean;
	
	/** SQL syntax errors */
	syntaxErrors: SQLSyntaxError[];
	
	/** SQL performance warnings */
	performanceWarnings: SQLPerformanceWarning[];
	
	/** Security issues found */
	securityIssues: SQLSecurityIssue[];
	
	/** SQL optimization suggestions */
	optimizations: SQLOptimization[];
}

/**
 * Rollback validation result
 */
export interface RollbackValidation {
	/** Whether rollback is possible */
	possible: boolean;
	
	/** Rollback blockers */
	blockers: RollbackBlocker[];
	
	/** Rollback risks */
	risks: RollbackRisk[];
	
	/** Rollback recommendations */
	recommendations: RollbackRecommendation[];
	
	/** Estimated rollback difficulty */
	difficulty: 'easy' | 'medium' | 'hard' | 'impossible';
}

/**
 * Execution options
 */
export interface ExecutionOptions {
	/** Transaction isolation level */
	isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
	
	/** Execution timeout in seconds */
	timeout?: number;
	
	/** Whether to create savepoints */
	createSavepoints?: boolean;
	
	/** Savepoint naming pattern */
	savepointPattern?: string;
	
	/** Whether to continue on error */
	continueOnError?: boolean;
	
	/** Maximum retry attempts */
	maxRetries?: number;
	
	/** Retry delay in milliseconds */
	retryDelay?: number;
}

/**
 * Execution result
 */
export interface ExecutionResult {
	/** Whether execution was successful */
	success: boolean;
	
	/** Number of affected rows */
	affectedRows?: number;
	
	/** Execution time in milliseconds */
	executionTime: number;
	
	/** Warnings during execution */
	warnings: string[];
	
	/** Errors during execution */
	errors: string[];
	
	/** Savepoint information */
	savepoints?: Savepoint[];
}

/**
 * Transaction options
 */
export interface TransactionOptions {
	/** Transaction isolation level */
	isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
	
	/** Transaction timeout in seconds */
	timeout?: number;
	
	/** Whether to create savepoints */
	createSavepoints?: boolean;
	
	/** Whether to continue on error */
	continueOnError?: boolean;
}

/**
 * Savepoint information
 */
export interface Savepoint {
	/** Savepoint name */
	name: string;
	
	/** Savepoint creation timestamp */
	createdAt: Date;
	
	/** Whether savepoint is active */
	active: boolean;
}

/**
 * Data loss risk information
 */
export interface DataLossRisk {
	/** Type of data loss risk */
	type: 'column_removal' | 'type_conversion' | 'constraint_change' | 'table_rebuild';
	
	/** Severity level */
	severity: 'low' | 'medium' | 'high' | 'critical';
	
	/** Affected table or column */
	target: string;
	
	/** Description of the risk */
	description: string;
	
	/** Estimated number of affected records */
	estimatedAffectedRecords?: number;
	
	/** Mitigation suggestions */
	mitigation: string[];
}

/**
 * Performance impact analysis
 */
export interface PerformanceImpact {
	/** Overall impact level */
	impact: 'low' | 'medium' | 'high' | 'critical';
	
	/** Estimated execution time increase */
	timeIncrease?: number;
	
	/** Estimated memory usage increase */
	memoryIncrease?: number;
	
	/** Index rebuild requirements */
	indexRebuilds: string[];
	
	/** Table rebuild requirements */
	tableRebuilds: string[];
	
	/** Performance optimization suggestions */
	optimizations: string[];
}

/**
 * Validation rule interface
 */
export interface ValidationRule {
	/** Rule identifier */
	id: string;
	
	/** Rule name */
	name: string;
	
	/** Rule description */
	description: string;
	
	/** Validation function */
	validate: (input: any) => ValidationResult;
	
	/** Rule severity */
	severity: 'error' | 'warning' | 'info';
}

/**
 * Validation result
 */
export interface ValidationResult {
	/** Whether validation passed */
	valid: boolean;
	
	/** Validation message */
	message?: string;
	
	/** Suggested fix */
	suggestion?: string;
}

/**
 * Validation error
 */
export interface ValidationError {
	/** Error code */
	code: string;
	
	/** Error message */
	message: string;
	
	/** Related field or table */
	field?: string;
	
	/** Error severity */
	severity: 'error' | 'warning' | 'info';
	
	/** Suggested fix */
	suggestion?: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
	/** Warning code */
	code: string;
	
	/** Warning message */
	message: string;
	
	/** Related field or table */
	field?: string;
	
	/** Warning type */
	type: 'data_loss' | 'performance' | 'compatibility' | 'other';
}

/**
 * Schema error
 */
export interface SchemaError {
	/** Error code */
	code: string;
	
	/** Error message */
	message: string;
	
	/** Related table */
	table?: string;
	
	/** Related field */
	field?: string;
	
	/** Error details */
	details?: any;
}

/**
 * Schema warning
 */
export interface SchemaWarning {
	/** Warning code */
	code: string;
	
	/** Warning message */
	message: string;
	
	/** Related table */
	table?: string;
	
	/** Related field */
	field?: string;
	
	/** Warning details */
	details?: any;
}

/**
 * Schema inconsistency
 */
export interface SchemaInconsistency {
	/** Inconsistency type */
	type: string;
	
	/** Description */
	description: string;
	
	/** Expected value */
	expected: any;
	
	/** Actual value */
	actual: any;
	
	/** Related table */
	table?: string;
	
	/** Related field */
	field?: string;
}

/**
 * Schema recommendation
 */
export interface SchemaRecommendation {
	/** Recommendation type */
	type: string;
	
	/** Description */
	description: string;
	
	/** Priority */
	priority: 'low' | 'medium' | 'high';
	
	/** Implementation steps */
	steps: string[];
	
	/** Related table */
	table?: string;
	
	/** Related field */
	field?: string;
}

/**
 * SQL syntax error
 */
export interface SQLSyntaxError {
	/** Error message */
	message: string;
	
	/** SQL statement */
	sql: string;
	
	/** Error position */
	position?: number;
	
	/** Error line */
	line?: number;
	
	/** Error column */
	column?: number;
}

/**
 * SQL performance warning
 */
export interface SQLPerformanceWarning {
	/** Warning message */
	message: string;
	
	/** SQL statement */
	sql: string;
	
	/** Performance impact */
	impact: 'low' | 'medium' | 'high';
	
	/** Optimization suggestion */
	optimization?: string;
}

/**
 * SQL security issue
 */
export interface SQLSecurityIssue {
	/** Issue type */
	type: 'sql_injection' | 'privilege_escalation' | 'data_exposure' | 'other';
	
	/** Issue description */
	description: string;
	
	/** SQL statement */
	sql: string;
	
	/** Severity level */
	severity: 'low' | 'medium' | 'high' | 'critical';
	
	/** Fix recommendation */
	fix: string;
}

/**
 * SQL optimization
 */
export interface SQLOptimization {
	/** Optimization type */
	type: string;
	
	/** Description */
	description: string;
	
	/** SQL statement */
	sql: string;
	
	/** Optimized SQL */
	optimizedSql: string;
	
	/** Expected improvement */
	improvement: string;
}

/**
 * Rollback blocker
 */
export interface RollbackBlocker {
	/** Blocker type */
	type: string;
	
	/** Description */
	description: string;
	
	/** Related migration */
	migrationId: string;
	
	/** Blocker severity */
	severity: 'low' | 'medium' | 'high' | 'critical';
	
	/** Resolution steps */
	resolution: string[];
}

/**
 * Rollback risk
 */
export interface RollbackRisk {
	/** Risk type */
	type: 'data_loss' | 'schema_inconsistency' | 'dependency_conflict' | 'other';
	
	/** Description */
	description: string;
	
	/** Risk level */
	level: 'low' | 'medium' | 'high' | 'critical';
	
	/** Affected tables */
	affectedTables: string[];
	
	/** Mitigation strategies */
	mitigation: string[];
}

/**
 * Rollback recommendation
 */
export interface RollbackRecommendation {
	/** Recommendation type */
	type: string;
	
	/** Description */
	description: string;
	
	/** Priority */
	priority: 'low' | 'medium' | 'high';
	
	/** Implementation steps */
	steps: string[];
	
	/** Prerequisites */
	prerequisites: string[];
}

/**
 * Validation results
 */
export interface ValidationResults {
	/** Whether validation passed */
	valid: boolean;
	
	/** Validation errors */
	errors: string[];
	
	/** Validation warnings */
	warnings: string[];
	
	/** Validation details */
	details?: Record<string, any>;
}

/**
 * Error recovery strategy
 */
export interface ErrorRecoveryStrategy {
	/** Type of error */
	errorType: string;
	
	/** Recovery action */
	action: 'retry' | 'rollback' | 'skip' | 'abort';
	
	/** Maximum retry attempts */
	maxRetries?: number;
	
	/** Retry delay in milliseconds */
	retryDelay?: number;
	
	/** Whether to create backup before recovery */
	backupBeforeRecovery?: boolean;
}