/**
 * Apply Migration Test Fixtures
 * 
 * This file contains test fixtures specific to P2-008 Apply Migrations
 * including sample migrations, mock implementations, and test data.
 */

import type { DocType } from '../../../doctype/types';
import type { Migration, MigrationResult, SchemaDiff } from '../../types';
import type {
	ApplyOptions,
	SyncOptions,
	DryRunOptions,
	RollbackOptions,
	BatchMigrationResult,
	DryRunResult,
	AppliedMigration,
	MigrationHistory,
	RollbackInfo,
	ExecutionEnvironment,
	BackupInfo,
	ValidationOptions,
	MigrationValidation,
	DataLossRisk
} from '../../apply-types';
import { MigrationStatus, BackupType } from '../../apply-types';
import { sampleDocFields, sampleDocIndexes, testConstants } from './test-data';
import { addColumnsSchemaDiff, removeColumnsSchemaDiff, complexSchemaDiff } from './schema-diffs';

/**
 * Sample DocType for testing migration application
 */
export const testDocType: DocType = {
	name: testConstants.TEST_DOCTYPE,
	module: 'Test',
	issingle: false,
	istable: false,
	is_submittable: false,
	is_tree: false,
	is_virtual: false,
	fields: [
		sampleDocFields.basicText,
		sampleDocFields.email,
		sampleDocFields.number,
		sampleDocFields.checkbox
	],
	permissions: [],
	indexes: [
		sampleDocIndexes.basicIndex,
		sampleDocIndexes.uniqueIndex
	],
	actions: [],
	links: [],
	autoname: '',
	title_field: 'name',
	image_field: '',
	search_fields: 'name',
	allow_rename: true,
	engine: 'InnoDB',
	track_changes: true,
	track_seen: false,
	default_sort_order: 'asc',
	hide_toolbar: false,
	allow_import: true,
	modified_by: undefined,
};

/**
 * Sample migration objects for testing
 */
export const sampleMigrations: Record<string, Migration> = {
	// Simple column addition migration
	addColumn: {
		id: 'add_email_column_20231201',
		doctype: testConstants.TEST_DOCTYPE,
		timestamp: new Date('2023-12-01T10:00:00Z'),
		diff: addColumnsSchemaDiff,
		sql: [
			'ALTER TABLE `tabTestDocType` ADD COLUMN `email` varchar(255);',
			'ALTER TABLE `tabTestDocType` ADD COLUMN `created_at` datetime DEFAULT CURRENT_TIMESTAMP;'
		],
		rollbackSql: [
			'ALTER TABLE `tabTestDocType` DROP COLUMN `email`;',
			'ALTER TABLE `tabTestDocType` DROP COLUMN `created_at`;'
		],
		applied: false,
		version: '1.0.0',
		destructive: false,
		requiresBackup: false
	},
	
	// Column removal migration (destructive)
	removeColumn: {
		id: 'remove_legacy_field_20231202',
		doctype: testConstants.TEST_DOCTYPE,
		timestamp: new Date('2023-12-02T10:00:00Z'),
		diff: removeColumnsSchemaDiff,
		sql: [
			'ALTER TABLE `tabTestDocType` DROP COLUMN `legacy_field`;'
		],
		rollbackSql: [
			'ALTER TABLE `tabTestDocType` ADD COLUMN `legacy_field` text;'
		],
		applied: false,
		version: '1.0.0',
		destructive: true,
		requiresBackup: true
	},
	
	// Complex migration with multiple changes
	complex: {
		id: 'complex_schema_update_20231203',
		doctype: testConstants.TEST_DOCTYPE,
		timestamp: new Date('2023-12-03T10:00:00Z'),
		diff: complexSchemaDiff,
		sql: [
			'ALTER TABLE `tabTestDocType` ADD COLUMN `new_field` text;',
			'ALTER TABLE `tabTestDocType` DROP COLUMN `removed_field`;',
			'ALTER TABLE `tabTestDocType` MODIFY COLUMN `modified_field` text NOT NULL;',
			'CREATE INDEX `idx_new_index` ON `tabTestDocType` (`new_field`);',
			'DROP INDEX `idx_removed_index` ON `tabTestDocType`;'
		],
		rollbackSql: [
			'DROP INDEX `idx_new_index` ON `tabTestDocType`;',
			'CREATE INDEX `idx_removed_index` ON `tabTestDocType` (`removed_field`);',
			'ALTER TABLE `tabTestDocType` MODIFY COLUMN `modified_field` varchar(100);',
			'ALTER TABLE `tabTestDocType` ADD COLUMN `removed_field` varchar(100);',
			'ALTER TABLE `tabTestDocType` DROP COLUMN `new_field`;'
		],
		applied: false,
		version: '1.0.0',
		destructive: true,
		requiresBackup: true
	}
};

/**
 * Sample applied migrations for testing
 */
export const sampleAppliedMigrations: Record<string, AppliedMigration> = {
	// Successfully applied migration
	successful: {
		...sampleMigrations.addColumn,
		applied: true,
		appliedAt: new Date('2023-12-01T10:05:00Z'),
		executionTime: 1500,
		affectedRows: 0,
		backupPath: undefined,
		appliedBy: 'test_user',
		status: MigrationStatus.APPLIED,
		environment: {
			databaseVersion: 'SQLite 3.40.0',
			frameworkVersion: 'SODAF 1.0.0',
			nodeVersion: '18.17.0',
			platform: 'linux'
		}
	},
	
	// Failed migration
	failed: {
		...sampleMigrations.removeColumn,
		applied: false,
		appliedAt: new Date('2023-12-02T10:05:00Z'),
		executionTime: 3000,
		affectedRows: undefined,
		backupPath: '/tmp/backup_20231202.sql',
		appliedBy: 'test_user',
		status: MigrationStatus.FAILED,
		error: 'Column removal failed: foreign key constraint violation',
		environment: {
			databaseVersion: 'SQLite 3.40.0',
			frameworkVersion: 'SODAF 1.0.0',
			nodeVersion: '18.17.0',
			platform: 'linux'
		}
	},
	
	// Rolled back migration
	rolledBack: {
		...sampleMigrations.complex,
		applied: true,
		appliedAt: new Date('2023-12-03T10:05:00Z'),
		executionTime: 5000,
		affectedRows: 100,
		backupPath: '/tmp/backup_20231203.sql',
		appliedBy: 'test_user',
		status: MigrationStatus.ROLLED_BACK,
		rollbackInfo: {
			rollbackId: 'rollback_complex_schema_update_20231203_20231204',
			originalMigrationId: 'complex_schema_update_20231203',
			rolledBackAt: new Date('2023-12-04T09:00:00Z'),
			executionTime: 4500,
			success: true,
			rolledBackBy: 'admin_user'
		},
		environment: {
			databaseVersion: 'SQLite 3.40.0',
			frameworkVersion: 'SODAF 1.0.0',
			nodeVersion: '18.17.0',
			platform: 'linux'
		}
	}
};

/**
 * Sample migration history for testing
 */
export const sampleMigrationHistory: MigrationHistory = {
	migrations: [
		sampleAppliedMigrations.successful,
		sampleAppliedMigrations.failed,
		sampleAppliedMigrations.rolledBack
	],
	lastMigration: sampleAppliedMigrations.successful,
	pendingMigrations: [
		sampleMigrations.addColumn,
		sampleMigrations.removeColumn
	],
	failedMigrations: [
		sampleAppliedMigrations.failed
	],
	stats: {
		total: 3,
		applied: 2,
		pending: 2,
		failed: 1,
		destructive: 2,
		lastMigrationDate: new Date('2023-12-03T10:05:00Z'),
		totalExecutionTime: 9500
	}
};

/**
 * Sample backup info for testing
 */
export const sampleBackupInfo: Record<string, BackupInfo> = {
	full: {
		id: 'backup_full_20231201_100000',
		doctype: testConstants.TEST_DOCTYPE,
		type: BackupType.FULL,
		createdAt: new Date('2023-12-01T10:00:00Z'),
		path: '/tmp/backups/tabTestDocType_full_20231201_100000.json',
		size: 1024000,
		compressed: true,
		encrypted: false,
		recordCount: 1000,
		checksum: 'sha256:abc123def456',
		metadata: {
			version: '1.0.0',
			compression: 'gzip',
			tableName: testConstants.TEST_TABLE
		}
	},
	
	column: {
		id: 'backup_column_email_20231202_110000',
		doctype: testConstants.TEST_DOCTYPE,
		type: BackupType.COLUMN,
		createdAt: new Date('2023-12-02T11:00:00Z'),
		path: '/tmp/backups/tabTestDocType_column_email_20231202_110000.json',
		size: 25600,
		compressed: true,
		encrypted: false,
		recordCount: 1000,
		checksum: 'sha256:def789ghi012',
		metadata: {
			column: 'email',
			version: '1.0.0'
		}
	}
};

/**
 * Sample data loss risks for testing
 */
export const sampleDataLossRisks: Record<string, DataLossRisk[]> = {
	columnRemoval: [
		{
			type: 'column_removal',
			severity: 'high',
			target: 'legacy_field column',
			description: 'Removing column \'legacy_field\' will permanently delete all data in this column',
			estimatedAffectedRecords: 1000,
			mitigation: [
				'Export column data before removal',
				'Create backup of entire table',
				'Consider marking column as unused instead of removing'
			]
		}
	],
	
	typeConversion: [
		{
			type: 'type_conversion',
			severity: 'medium',
			target: 'status column (varchar → enum)',
			description: 'Converting column \'status\' from varchar to enum may cause data loss',
			estimatedAffectedRecords: 1000,
			mitigation: [
				'Test conversion on sample data',
				'Create data migration script',
				'Provide default values for incompatible conversions',
				'Consider using temporary column for migration'
			]
		}
	],
	
	tableRebuild: [
		{
			type: 'table_rebuild',
			severity: 'medium',
			target: 'modified_field, new_column',
			description: 'Table rebuild operation may cause temporary data inaccessibility',
			estimatedAffectedRecords: 1000,
			mitigation: [
				'Schedule during maintenance window',
				'Create full backup before rebuild',
				'Use transaction to ensure atomicity',
				'Test rebuild process on non-production data'
			]
		}
	]
};

/**
 * Sample migration validation results for testing
 */
export const sampleMigrationValidation: Record<string, MigrationValidation> = {
	valid: {
		valid: true,
		errors: [],
		warnings: [
			{
				code: 'PERFORMANCE_WARNING',
				message: 'Table rebuild may be slow on large datasets',
				type: 'performance'
			}
		],
		recommendations: [
			'Create backup before proceeding',
			'Test migration on development environment first'
		],
		score: 85,
		validatedAt: new Date('2023-12-01T09:55:00Z')
	},
	
	invalid: {
		valid: false,
		errors: [
			{
				code: 'DATA_LOSS_RISK',
				message: 'Removing column \'legacy_field\' will cause data loss',
				severity: 'error',
				suggestion: 'Export data before removing column'
			},
			{
				code: 'FOREIGN_KEY_VIOLATION',
				message: 'Cannot drop column referenced by foreign key',
				severity: 'error',
				suggestion: 'Remove foreign key constraints first'
			}
		],
		warnings: [
			{
				code: 'PERFORMANCE_WARNING',
				message: 'Multiple operations may impact performance',
				type: 'performance'
			}
		],
		recommendations: [
			'Fix validation errors before proceeding',
			'Review migration design',
			'Consider alternative approach'
		],
		score: 25,
		validatedAt: new Date('2023-12-02T09:55:00Z')
	}
};

/**
 * Sample migration results for testing
 */
export const sampleMigrationResults: Record<string, MigrationResult> = {
	success: {
		success: true,
		sql: [
			'ALTER TABLE `tabTestDocType` ADD COLUMN `email` varchar(255);'
		],
		warnings: [
			'Table rebuild may be slow on large datasets'
		],
		errors: [],
		affectedRows: 0,
		backupPath: undefined,
		executionTime: 1500,
		metadata: {
			doctype: testConstants.TEST_DOCTYPE,
			action: 'sync',
			changes: true,
			destructive: false,
			dryRun: false
		}
	},
	
	failure: {
		success: false,
		sql: [
			'ALTER TABLE `tabTestDocType` DROP COLUMN `legacy_field`;'
		],
		warnings: [
			'Data loss risk detected'
		],
		errors: [
			'Foreign key constraint violation'
		],
		affectedRows: undefined,
		backupPath: '/tmp/backup_20231202.sql',
		executionTime: 3000,
		metadata: {
			doctype: testConstants.TEST_DOCTYPE,
			action: 'sync',
			error: 'Foreign key constraint violation'
		}
	},
	
	dryRun: {
		success: true,
		sql: [
			'ALTER TABLE `tabTestDocType` ADD COLUMN `email` varchar(255);',
			'CREATE INDEX `idx_email` ON `tabTestDocType` (`email`);'
		],
		warnings: [
			'Data loss risk: column removal will delete data',
			'Performance impact: table rebuild required'
		],
		errors: [],
		executionTime: 0,
		metadata: {
			doctype: testConstants.TEST_DOCTYPE,
			action: 'dry_run',
			changes: true,
			destructive: true,
			dryRun: true
		}
	}
};

/**
 * Sample batch migration results for testing
 */
export const sampleBatchMigrationResult: BatchMigrationResult = {
	success: false,
	results: new Map([
		[testConstants.TEST_DOCTYPE, sampleMigrationResults.success],
		['User', sampleMigrationResults.failure]
	]),
	successful: [testConstants.TEST_DOCTYPE],
	failed: ['User'],
	skipped: [],
	totalTime: 4500,
	sql: [
		'CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)',
		'ALTER TABLE user_table ADD COLUMN email TEXT'
	],
	warnings: [
		'Table rebuild may be slow on large datasets',
		'Data loss risk detected'
	],
	errors: [
		'Foreign key constraint violation'
	]
};

/**
 * Sample dry run results for testing
 */
export const sampleDryRunResult: DryRunResult = {
	success: true,
	sql: [
		'ALTER TABLE `tabTestDocType` ADD COLUMN `email` varchar(255);',
		'CREATE INDEX `idx_email` ON `tabTestDocType` (`email`);'
	],
	warnings: [
		'Data loss risk: column removal will delete data',
		'Performance impact: table rebuild required'
	],
	errors: [],
	estimatedTime: 5.5,
	estimatedAffectedRows: 1000,
	dataLossRisks: [
		...sampleDataLossRisks.columnRemoval,
		...sampleDataLossRisks.typeConversion
	],
	performanceImpact: {
		impact: 'medium',
		indexRebuilds: [],
		tableRebuilds: [testConstants.TEST_TABLE],
		optimizations: ['Consider running during off-peak hours']
	}
};

/**
 * Sample rollback info for testing
 */
export const sampleRollbackInfo: RollbackInfo = {
	rollbackId: 'rollback_complex_schema_update_20231203_20231204',
	originalMigrationId: 'complex_schema_update_20231203',
	rolledBackAt: new Date('2023-12-04T09:00:00Z'),
	executionTime: 4500,
	success: true,
	rolledBackBy: 'admin_user'
};

/**
 * Sample execution environment for testing
 */
export const sampleExecutionEnvironment: ExecutionEnvironment = {
	databaseVersion: 'SQLite 3.40.0',
	frameworkVersion: 'SODAF 1.0.0',
	nodeVersion: '18.17.0',
	platform: 'linux',
	memoryUsage: {
		rss: 50331648,
		heapTotal: 20971520,
		heapUsed: 15728640,
		external: 1048576,
		arrayBuffers: 0
	},
	variables: {
		ENV: 'test',
		LOG_LEVEL: 'info'
	}
};

/**
 * Sample options for testing
 */
export const sampleOptions: Record<string, any> = {
	applyOptions: {
		dryRun: false,
		force: false,
		preserveData: true,
		backup: true,
		continueOnError: false,
		batchSize: 1000,
		timeout: 300,
		validateData: true,
		context: {
			user: 'test_user',
			session: 'test_session_123'
		}
	} as ApplyOptions,
	
	syncOptions: {
		dryRun: false,
		force: false,
		preserveData: true,
		backup: true,
		continueOnError: false,
		changeTypes: ['add', 'remove', 'modify', 'index'],
		validateSchema: true,
		checkDependencies: true,
		context: {
			user: 'test_user'
		}
	} as SyncOptions,
	
	dryRunOptions: {
		includeSQL: true,
		analyzePerformance: true,
		checkDataLoss: true,
		validateRollback: true
	} as DryRunOptions,
	
	rollbackOptions: {
		backup: true,
		validate: true,
		force: false,
		context: {
			user: 'admin_user',
			reason: 'Data corruption detected'
		}
	} as RollbackOptions,
	
	validationOptions: {
		checkDataLoss: true,
		validateSQL: true,
		checkRollback: true,
		validateData: true,
		checkPerformance: true,
		customRules: []
	} as ValidationOptions
};

/**
 * Mock implementations for testing
 */
// Note: Mock implementations will be defined in individual test files
// to avoid vi import issues in fixtures