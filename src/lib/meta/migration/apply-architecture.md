# P2-008 Apply Migrations - Architecture Design

## Overview

P2-008 Apply Migrations is responsible for executing schema migrations with transaction support, history tracking, and data preservation. It builds upon the foundation established by P2-005 (Migration Types), P2-006 (Schema Comparison), and P2-007 (SQL Generation).

## Core Components

### 1. MigrationApplier Class

The main orchestrator class that coordinates all migration operations.

```typescript
export class MigrationApplier {
	private database: Database;
	private schemaEngine: SchemaComparisonEngine;
	private sqlGenerator: SQLGenerator;
	private historyManager: MigrationHistoryManager;
	private backupManager: MigrationBackupManager;
	private validator: MigrationValidator;
	
	constructor(
		database: Database,
		doctypeEngine: DocTypeEngine,
		options?: ApplyOptions
	);
	
	// Core migration operations
	async syncDocType(doctypeName: string, options?: SyncOptions): Promise<MigrationResult>;
	async syncAllDocTypes(options?: SyncOptions): Promise<BatchMigrationResult>;
	async applyMigration(migration: Migration, options?: ApplyOptions): Promise<MigrationResult>;
	async rollbackMigration(migrationId: string, options?: RollbackOptions): Promise<MigrationResult>;
	
	// Dry run operations
	async dryRun(doctypeName: string, options?: DryRunOptions): Promise<DryRunResult>;
	
	// History and status
	async getMigrationHistory(doctypeName?: string): Promise<MigrationHistory>;
	async getPendingMigrations(doctypeName?: string): Promise<Migration[]>;
	async isMigrationApplied(migrationId: string): Promise<boolean>;
}
```

### 2. MigrationHistoryManager

Responsible for tracking migration execution history in the database.

```typescript
export class MigrationHistoryManager {
	private database: Database;
	
	constructor(database: Database);
	
	async initializeHistoryTable(): Promise<void>;
	async recordMigration(migration: AppliedMigration): Promise<void>;
	async updateMigrationStatus(migrationId: string, status: MigrationStatus, error?: string): Promise<void>;
	async getMigrationHistory(doctypeName?: string, limit?: number): Promise<MigrationHistory>;
	async getMigrationById(migrationId: string): Promise<Migration | null>;
	async getLatestMigration(doctypeName: string): Promise<Migration | null>;
	async getPendingMigrations(doctypeName?: string): Promise<Migration[]>;
	async clearHistory(doctypeName?: string): Promise<void>;
}
```

### 3. MigrationBackupManager

Handles data backup and restoration for destructive operations.

```typescript
export class MigrationBackupManager {
	private database: Database;
	private options: BackupOptions;
	
	constructor(database: Database, options?: BackupOptions);
	
	async createBackup(doctypeName: string, backupType: BackupType = 'FULL'): Promise<string>;
	async createColumnBackup(doctypeName: string, columnName: string): Promise<string>;
	async restoreFromBackup(backupPath: string): Promise<RestoreResult>;
	async cleanupOldBackups(retentionDays?: number): Promise<void>;
	async listBackups(doctypeName?: string): Promise<BackupInfo[]>;
}
```

### 4. MigrationValidator

Validates migrations before execution to ensure safety and correctness.

```typescript
export class MigrationValidator {
	private database: Database;
	private options: ValidationOptions;
	
	constructor(database: Database, options?: ValidationOptions);
	
	async validateMigration(migration: Migration): Promise<MigrationValidation>;
	async validateSchemaDiff(diff: SchemaDiff): Promise<SchemaValidation>;
	async validateSQLStatements(statements: SQLStatement[]): Promise<SQLValidation>;
	async checkDataLossRisks(diff: SchemaDiff): Promise<DataLossRisk[]>;
	async validateRollbackPossibility(migration: Migration): Promise<RollbackValidation>;
}
```

### 5. MigrationExecutor

Executes SQL statements within transactions with proper error handling.

```typescript
export class MigrationExecutor {
	private database: Database;
	private transactionManager: TransactionManager;
	
	constructor(database: Database);
	
	async executeInTransaction<T>(
		operations: () => Promise<T>,
		options?: TransactionOptions
	): Promise<T>;
	
	async executeMigrationSQL(
		statements: SQLStatement[],
		options?: ExecutionOptions
	): Promise<ExecutionResult>;
	
	async executeRollbackSQL(
		statements: SQLStatement[],
		options?: ExecutionOptions
	): Promise<ExecutionResult>;
	
	async createSavepoint(name: string): Promise<Savepoint>;
	async rollbackToSavepoint(savepoint: Savepoint): Promise<void>;
	async releaseSavepoint(savepoint: Savepoint): Promise<void>;
}
```

## Key Features

### 1. Transaction Support

All migrations are executed within transactions to ensure atomicity:

```typescript
// Automatic transaction wrapping
const result = await migrationApplier.syncDocType('User', {
	backup: true,
	validateData: true
});

// Manual transaction control
await migrationExecutor.executeInTransaction(async () => {
	await executeMigrationSQL(forwardStatements);
	await historyManager.recordMigration(appliedMigration);
}, {
	isolationLevel: 'SERIALIZABLE',
	timeout: 300
});
```

### 2. Migration History Tracking

Comprehensive history tracking with metadata:

```typescript
interface AppliedMigration extends Migration {
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
}
```

### 3. Data Preservation Strategies

Multiple backup strategies for different scenarios:

```typescript
enum BackupType {
	FULL = 'full',           // Complete table backup
	COLUMN = 'column',       // Specific column backup
	SCHEMA = 'schema',       // Schema-only backup
	INCREMENTAL = 'incremental' // Incremental backup
}

interface BackupOptions {
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
}
```

### 4. Rollback Capabilities

Comprehensive rollback support with validation:

```typescript
interface RollbackOptions {
	/** Whether to create backup before rollback */
	backup?: boolean;
	
	/** Whether to validate rollback possibility */
	validate?: boolean;
	
	/** Whether to force rollback despite warnings */
	force?: boolean;
	
	/** Custom rollback context */
	context?: Record<string, any>;
}

interface RollbackInfo {
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
}
```

## Integration Points

### 1. With Schema Comparison Engine

```typescript
// Use existing schema comparison to detect changes
const diff = await schemaEngine.compareSchema(doctypeName, options);

// Check if migration is needed
if (await schemaEngine.hasChanges(diff)) {
	// Generate and apply migration
	const migration = await sqlGenerator.generateMigrationSQL(diff, doctypeName);
	await applyMigration(migration);
}
```

### 2. With SQL Generator

```typescript
// Generate SQL for different scenarios
const createSQL = sqlGenerator.generateCreateTableSQL(doctype);
const alterSQL = sqlGenerator.generateAlterTableSQL(doctype, changes);
const rollbackSQL = sqlGenerator.generateRollbackSQL(migration);
```

### 3. With Database Module

```typescript
// Use database for schema operations
await database.create_table(tableName, columns);
await database.add_column(tableName, column);
await database.create_index(indexName, tableName, columns);

// Use transaction support
await database.withTransaction(async (transaction) => {
	await database.run(sql1, values1);
	await database.run(sql2, values2);
});
```

## Error Handling

### 1. Migration-Specific Errors

```typescript
export class MigrationError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly doctype?: string,
		public readonly migrationId?: string,
		public readonly details?: any
	);
}

export class MigrationValidationError extends MigrationError {
	constructor(validation: MigrationValidation);
}

export class MigrationExecutionError extends MigrationError {
	constructor(statement: SQLStatement, originalError: Error);
}

export class MigrationRollbackError extends MigrationError {
	constructor(migrationId: string, originalError: Error);
}

export class DataLossRiskError extends MigrationError {
	constructor(risks: DataLossRisk[]);
}
```

### 2. Error Recovery Strategies

```typescript
interface ErrorRecoveryStrategy {
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
```

## File Structure

```
src/lib/meta/migration/
├── apply.ts                      # Main MigrationApplier class
├── apply-types.ts                # Types specific to apply operations
├── history/
│   ├── history-manager.ts         # MigrationHistoryManager
│   ├── history-types.ts          # History-related types
│   └── __tests__/
│       └── history-manager.test.ts
├── backup/
│   ├── backup-manager.ts         # MigrationBackupManager
│   ├── backup-types.ts          # Backup-related types
│   ├── strategies/
│   │   ├── full-backup.ts      # Full table backup strategy
│   │   ├── column-backup.ts    # Column-specific backup
│   │   └── incremental-backup.ts # Incremental backup
│   └── __tests__/
│       └── backup-manager.test.ts
├── validation/
│   ├── migration-validator.ts    # MigrationValidator
│   ├── validation-types.ts      # Validation-related types
│   ├── rules/
│   │   ├── data-loss-rules.ts  # Data loss validation rules
│   │   ├── sql-rules.ts        # SQL validation rules
│   │   └── rollback-rules.ts   # Rollback validation rules
│   └── __tests__/
│       └── migration-validator.test.ts
├── execution/
│   ├── migration-executor.ts    # MigrationExecutor
│   ├── execution-types.ts       # Execution-related types
│   ├── transaction-wrapper.ts   # Transaction wrapper utilities
│   └── __tests__/
│       └── migration-executor.test.ts
├── errors/
│   ├── apply-errors.ts          # Migration-specific errors
│   └── error-recovery.ts       # Error recovery strategies
└── __tests__/
    ├── apply.test.ts            # Main apply tests
    ├── integration.test.ts       # Integration tests
    └── fixtures/
        ├── test-migrations.ts   # Test migration data
        └── mock-database.ts     # Mock database for testing
```

## Testing Strategy

### 1. Unit Tests

- Test each component in isolation
- Mock external dependencies
- Cover all error scenarios
- Test edge cases and boundary conditions

### 2. Integration Tests

- Test complete migration workflows
- Test transaction rollback scenarios
- Test backup and restore operations
- Test error recovery mechanisms

### 3. Performance Tests

- Test with large datasets
- Test concurrent migrations
- Test backup/restore performance
- Test transaction overhead

### 4. Safety Tests

- Test data preservation during failures
- Test rollback correctness
- Test backup integrity
- Test error handling robustness

## Implementation Roadmap

### Phase 1: Core Infrastructure
1. Create basic MigrationApplier class
2. Implement MigrationHistoryManager
3. Set up basic transaction support
4. Create error handling framework

### Phase 2: Validation and Safety
1. Implement MigrationValidator
2. Add data loss detection
3. Create backup infrastructure
4. Implement rollback mechanisms

### Phase 3: Advanced Features
1. Add comprehensive backup strategies
2. Implement error recovery
3. Add performance optimizations
4. Create monitoring and metrics

### Phase 4: Integration and Testing
1. Integrate with existing components
2. Create comprehensive test suite
3. Add documentation and examples
4. Performance tuning and optimization

## Security Considerations

1. **SQL Injection Prevention**: All SQL statements must use parameterized queries
2. **Access Control**: Implement role-based access for migration operations
3. **Audit Trail**: Log all migration activities with user context
4. **Backup Encryption**: Encrypt sensitive data in backups
5. **Validation**: Strict validation of all inputs and generated SQL

## Performance Considerations

1. **Batch Processing**: Process large migrations in batches
2. **Index Management**: Temporarily disable indexes during bulk operations
3. **Memory Management**: Stream large datasets to avoid memory issues
4. **Connection Pooling**: Use connection pooling for concurrent operations
5. **Caching**: Cache schema information to reduce database queries