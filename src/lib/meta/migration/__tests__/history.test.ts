/**
 * Migration History Tests (P2-005-H1 to H6)
 * 
 * This file contains tests for migration history types to ensure they compile
 * correctly and handle various migration history scenarios.
 */

import { describe, it, expect } from 'vitest';
import type {
	Migration,
	MigrationHistory,
	MigrationStats
} from '../types';
import { createTestDate, createMigrationId, createTestVersion } from './fixtures/test-data';

describe('Migration History Tests', () => {
	/**
	 * Test P2-005-H1: Create MigrationHistory with migrations
	 */
	it('P2-005-H1: should create MigrationHistory with migrations', () => {
		const migration1: Migration = {
			id: createMigrationId('migration1'),
			doctype: 'TestDocType',
			timestamp: createTestDate(0),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN field1 VARCHAR(255);',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN field1;',
			applied: true,
			version: createTestVersion(1, 0, 0),
			destructive: false,
			requiresBackup: false
		};
		
		const migration2: Migration = {
			id: createMigrationId('migration2'),
			doctype: 'TestDocType',
			timestamp: createTestDate(1),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN field2 INTEGER;',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN field2;',
			applied: true,
			version: createTestVersion(1, 1, 0),
			destructive: false,
			requiresBackup: false
		};
		
		const migration3: Migration = {
			id: createMigrationId('migration3'),
			doctype: 'TestDocType',
			timestamp: createTestDate(2),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN field3 TEXT;',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN field3;',
			applied: false,
			version: createTestVersion(1, 2, 0),
			destructive: false,
			requiresBackup: false
		};
		
		const history: MigrationHistory = {
			migrations: [migration1, migration2, migration3],
			pendingMigrations: [migration3],
			failedMigrations: [],
			stats: {
				total: 3,
				applied: 2,
				pending: 1,
				failed: 0,
				destructive: 0,
				lastMigrationDate: migration2.timestamp,
				totalExecutionTime: 5000
			}
		};
		
		expect(history).toBeDefined();
		expect(history.migrations).toHaveLength(3);
		expect(history.migrations[0].id).toBe(migration1.id);
		expect(history.migrations[1].id).toBe(migration2.id);
		expect(history.migrations[2].id).toBe(migration3.id);
		expect(history.stats.total).toBe(3);
		expect(history.stats.applied).toBe(2);
		expect(history.stats.pending).toBe(1);
		expect(history.stats.failed).toBe(0);
		expect(history.stats.destructive).toBe(0);
		expect(history.stats.lastMigrationDate).toBe(migration2.timestamp);
		expect(history.stats.totalExecutionTime).toBe(5000);
	});

	/**
	 * Test P2-005-H2: MigrationHistory with last migration
	 */
	it('P2-005-H2: should create MigrationHistory with last migration', () => {
		const migration1: Migration = {
			id: createMigrationId('migration1'),
			doctype: 'TestDocType',
			timestamp: createTestDate(0),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN field1 VARCHAR(255);',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN field1;',
			applied: true,
			version: createTestVersion(1, 0, 0),
			destructive: false,
			requiresBackup: false
		};
		
		const migration2: Migration = {
			id: createMigrationId('migration2'),
			doctype: 'TestDocType',
			timestamp: createTestDate(1),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN field2 INTEGER;',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN field2;',
			applied: true,
			version: createTestVersion(1, 1, 0),
			destructive: false,
			requiresBackup: false
		};
		
		const history: MigrationHistory = {
			migrations: [migration1, migration2],
			lastMigration: migration2,
			pendingMigrations: [],
			failedMigrations: [],
			stats: {
				total: 2,
				applied: 2,
				pending: 0,
				failed: 0,
				destructive: 0,
				lastMigrationDate: migration2.timestamp,
				totalExecutionTime: 3000
			}
		};
		
		expect(history).toBeDefined();
		expect(history.lastMigration).toBeDefined();
		expect(history.lastMigration?.id).toBe(migration2.id);
		expect(history.lastMigration?.doctype).toBe('TestDocType');
		expect(history.lastMigration?.applied).toBe(true);
		expect(history.lastMigration?.version).toBe('1.1.0');
		expect(history.lastMigration?.timestamp).toBe(migration2.timestamp);
	});

	/**
	 * Test P2-005-H3: MigrationHistory with pending migrations
	 */
	it('P2-005-H3: should create MigrationHistory with pending migrations', () => {
		const appliedMigration: Migration = {
			id: createMigrationId('applied'),
			doctype: 'TestDocType',
			timestamp: createTestDate(0),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN applied_field VARCHAR(255);',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN applied_field;',
			applied: true,
			version: createTestVersion(1, 0, 0),
			destructive: false,
			requiresBackup: false
		};
		
		const pendingMigration1: Migration = {
			id: createMigrationId('pending1'),
			doctype: 'TestDocType',
			timestamp: createTestDate(1),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN pending_field1 INTEGER;',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN pending_field1;',
			applied: false,
			version: createTestVersion(1, 1, 0),
			destructive: false,
			requiresBackup: false
		};
		
		const pendingMigration2: Migration = {
			id: createMigrationId('pending2'),
			doctype: 'TestDocType',
			timestamp: createTestDate(2),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN pending_field2 TEXT;',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN pending_field2;',
			applied: false,
			version: createTestVersion(1, 2, 0),
			destructive: false,
			requiresBackup: false
		};
		
		const history: MigrationHistory = {
			migrations: [appliedMigration, pendingMigration1, pendingMigration2],
			lastMigration: appliedMigration,
			pendingMigrations: [pendingMigration1, pendingMigration2],
			failedMigrations: [],
			stats: {
				total: 3,
				applied: 1,
				pending: 2,
				failed: 0,
				destructive: 0,
				lastMigrationDate: appliedMigration.timestamp,
				totalExecutionTime: 2000
			}
		};
		
		expect(history).toBeDefined();
		expect(history.pendingMigrations).toHaveLength(2);
		expect(history.pendingMigrations[0].id).toBe(pendingMigration1.id);
		expect(history.pendingMigrations[1].id).toBe(pendingMigration2.id);
		expect(history.pendingMigrations[0].applied).toBe(false);
		expect(history.pendingMigrations[1].applied).toBe(false);
		expect(history.pendingMigrations[0].version).toBe('1.1.0');
		expect(history.pendingMigrations[1].version).toBe('1.2.0');
	});

	/**
	 * Test P2-005-H4: MigrationHistory with failed migrations
	 */
	it('P2-005-H4: should create MigrationHistory with failed migrations', () => {
		const appliedMigration: Migration = {
			id: createMigrationId('applied'),
			doctype: 'TestDocType',
			timestamp: createTestDate(0),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN applied_field VARCHAR(255);',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN applied_field;',
			applied: true,
			version: createTestVersion(1, 0, 0),
			destructive: false,
			requiresBackup: false
		};
		
		const failedMigration1: Migration = {
			id: createMigrationId('failed1'),
			doctype: 'TestDocType',
			timestamp: createTestDate(1),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'INVALID SQL STATEMENT 1',
			rollbackSql: '',
			applied: false,
			version: createTestVersion(1, 1, 0),
			destructive: false,
			requiresBackup: false,
			error: 'SQL syntax error in statement 1'
		};
		
		const failedMigration2: Migration = {
			id: createMigrationId('failed2'),
			doctype: 'TestDocType',
			timestamp: createTestDate(2),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'INVALID SQL STATEMENT 2',
			rollbackSql: '',
			applied: false,
			version: createTestVersion(1, 2, 0),
			destructive: false,
			requiresBackup: false,
			error: 'SQL syntax error in statement 2'
		};
		
		const history: MigrationHistory = {
			migrations: [appliedMigration, failedMigration1, failedMigration2],
			lastMigration: appliedMigration,
			pendingMigrations: [],
			failedMigrations: [failedMigration1, failedMigration2],
			stats: {
				total: 3,
				applied: 1,
				pending: 0,
				failed: 2,
				destructive: 0,
				lastMigrationDate: appliedMigration.timestamp,
				totalExecutionTime: 2000
			}
		};
		
		expect(history).toBeDefined();
		expect(history.failedMigrations).toHaveLength(2);
		expect(history.failedMigrations[0].id).toBe(failedMigration1.id);
		expect(history.failedMigrations[1].id).toBe(failedMigration2.id);
		expect(history.failedMigrations[0].applied).toBe(false);
		expect(history.failedMigrations[1].applied).toBe(false);
		expect(history.failedMigrations[0].error).toBe('SQL syntax error in statement 1');
		expect(history.failedMigrations[1].error).toBe('SQL syntax error in statement 2');
		expect(history.failedMigrations[0].version).toBe('1.1.0');
		expect(history.failedMigrations[1].version).toBe('1.2.0');
	});

	/**
	 * Test P2-005-H5: MigrationStats calculation
	 */
	it('P2-005-H5: should calculate MigrationStats correctly', () => {
		const stats: MigrationStats = {
			total: 10,
			applied: 7,
			pending: 2,
			failed: 1,
			destructive: 3,
			lastMigrationDate: createTestDate(5),
			totalExecutionTime: 15000
		};
		
		expect(stats).toBeDefined();
		expect(stats.total).toBe(10);
		expect(stats.applied).toBe(7);
		expect(stats.pending).toBe(2);
		expect(stats.failed).toBe(1);
		expect(stats.destructive).toBe(3);
		expect(stats.lastMigrationDate).toBeInstanceOf(Date);
		expect(stats.lastMigrationDate).toEqual(createTestDate(5));
		expect(stats.totalExecutionTime).toBe(15000);
		
		// Verify that the stats add up correctly
		expect(stats.applied + stats.pending + stats.failed).toBe(stats.total);
	});

	/**
	 * Test P2-005-H6: Empty MigrationHistory
	 */
	it('P2-005-H6: should create empty MigrationHistory', () => {
		const emptyHistory: MigrationHistory = {
			migrations: [],
			pendingMigrations: [],
			failedMigrations: [],
			stats: {
				total: 0,
				applied: 0,
				pending: 0,
				failed: 0,
				destructive: 0,
				totalExecutionTime: 0
			}
		};
		
		expect(emptyHistory).toBeDefined();
		expect(emptyHistory.migrations).toHaveLength(0);
		expect(emptyHistory.lastMigration).toBeUndefined();
		expect(emptyHistory.pendingMigrations).toHaveLength(0);
		expect(emptyHistory.failedMigrations).toHaveLength(0);
		expect(emptyHistory.stats.total).toBe(0);
		expect(emptyHistory.stats.applied).toBe(0);
		expect(emptyHistory.stats.pending).toBe(0);
		expect(emptyHistory.stats.failed).toBe(0);
		expect(emptyHistory.stats.destructive).toBe(0);
		expect(emptyHistory.stats.lastMigrationDate).toBeUndefined();
		expect(emptyHistory.stats.totalExecutionTime).toBe(0);
		
		// All arrays should be empty
		expect(Array.isArray(emptyHistory.migrations)).toBe(true);
		expect(Array.isArray(emptyHistory.pendingMigrations)).toBe(true);
		expect(Array.isArray(emptyHistory.failedMigrations)).toBe(true);
	});
});

describe('Migration History Type Safety', () => {
	/**
	 * Test that MigrationHistory enforces correct structure
	 */
	it('should enforce MigrationHistory structure', () => {
		const migration: Migration = {
			id: createMigrationId('test'),
			doctype: 'TestDocType',
			timestamp: createTestDate(),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN test_field VARCHAR(255);',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN test_field;',
			applied: false,
			version: createTestVersion(1, 0, 0),
			destructive: false,
			requiresBackup: false
		};
		
		const history: MigrationHistory = {
			migrations: [migration],
			lastMigration: migration,
			pendingMigrations: [migration],
			failedMigrations: [],
			stats: {
				total: 1,
				applied: 0,
				pending: 1,
				failed: 0,
				destructive: 0,
				lastMigrationDate: migration.timestamp,
				totalExecutionTime: 1000
			}
		};
		
		// All properties should be correctly typed
		expect(Array.isArray(history.migrations)).toBe(true);
		expect(history.migrations).toHaveLength(1);
		expect(history.lastMigration?.id).toBe(migration.id);
		expect(Array.isArray(history.pendingMigrations)).toBe(true);
		expect(Array.isArray(history.failedMigrations)).toBe(true);
		expect(typeof history.stats.total).toBe('number');
		expect(typeof history.stats.applied).toBe('number');
		expect(typeof history.stats.pending).toBe('number');
		expect(typeof history.stats.failed).toBe('number');
		expect(typeof history.stats.destructive).toBe('number');
		expect(typeof history.stats.totalExecutionTime).toBe('number');
	});

	/**
	 * Test MigrationStats type safety
	 */
	it('should enforce MigrationStats type safety', () => {
		const stats: MigrationStats = {
			total: 5,
			applied: 3,
			pending: 1,
			failed: 1,
			destructive: 2,
			lastMigrationDate: createTestDate(),
			totalExecutionTime: 7500
		};
		
		expect(typeof stats.total).toBe('number');
		expect(typeof stats.applied).toBe('number');
		expect(typeof stats.pending).toBe('number');
		expect(typeof stats.failed).toBe('number');
		expect(typeof stats.destructive).toBe('number');
		expect(typeof stats.totalExecutionTime).toBe('number');
		
		if (stats.lastMigrationDate) {
			expect(stats.lastMigrationDate).toBeInstanceOf(Date);
		}
	});
});

describe('Migration History Edge Cases', () => {
	/**
	 * Test MigrationHistory with only applied migrations
	 */
	it('should handle MigrationHistory with only applied migrations', () => {
		const appliedMigration1: Migration = {
			id: createMigrationId('applied1'),
			doctype: 'TestDocType',
			timestamp: createTestDate(0),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN applied_field1 VARCHAR(255);',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN applied_field1;',
			applied: true,
			version: createTestVersion(1, 0, 0),
			destructive: false,
			requiresBackup: false
		};
		
		const appliedMigration2: Migration = {
			id: createMigrationId('applied2'),
			doctype: 'TestDocType',
			timestamp: createTestDate(1),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN applied_field2 INTEGER;',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN applied_field2;',
			applied: true,
			version: createTestVersion(1, 1, 0),
			destructive: false,
			requiresBackup: false
		};
		
		const history: MigrationHistory = {
			migrations: [appliedMigration1, appliedMigration2],
			lastMigration: appliedMigration2,
			pendingMigrations: [],
			failedMigrations: [],
			stats: {
				total: 2,
				applied: 2,
				pending: 0,
				failed: 0,
				destructive: 0,
				lastMigrationDate: appliedMigration2.timestamp,
				totalExecutionTime: 3000
			}
		};
		
		expect(history.migrations).toHaveLength(2);
		expect(history.pendingMigrations).toHaveLength(0);
		expect(history.failedMigrations).toHaveLength(0);
		expect(history.stats.applied).toBe(2);
		expect(history.stats.pending).toBe(0);
		expect(history.stats.failed).toBe(0);
	});

	/**
	 * Test MigrationHistory with only failed migrations
	 */
	it('should handle MigrationHistory with only failed migrations', () => {
		const failedMigration1: Migration = {
			id: createMigrationId('failed1'),
			doctype: 'TestDocType',
			timestamp: createTestDate(0),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'INVALID SQL STATEMENT 1',
			rollbackSql: '',
			applied: false,
			version: createTestVersion(1, 0, 0),
			destructive: false,
			requiresBackup: false,
			error: 'SQL syntax error in statement 1'
		};
		
		const failedMigration2: Migration = {
			id: createMigrationId('failed2'),
			doctype: 'TestDocType',
			timestamp: createTestDate(1),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'INVALID SQL STATEMENT 2',
			rollbackSql: '',
			applied: false,
			version: createTestVersion(1, 1, 0),
			destructive: false,
			requiresBackup: false,
			error: 'SQL syntax error in statement 2'
		};
		
		const history: MigrationHistory = {
			migrations: [failedMigration1, failedMigration2],
			pendingMigrations: [],
			failedMigrations: [failedMigration1, failedMigration2],
			stats: {
				total: 2,
				applied: 0,
				pending: 0,
				failed: 2,
				destructive: 0,
				totalExecutionTime: 500
			}
		};
		
		expect(history.migrations).toHaveLength(2);
		expect(history.lastMigration).toBeUndefined();
		expect(history.pendingMigrations).toHaveLength(0);
		expect(history.failedMigrations).toHaveLength(2);
		expect(history.stats.applied).toBe(0);
		expect(history.stats.pending).toBe(0);
		expect(history.stats.failed).toBe(2);
		expect(history.stats.lastMigrationDate).toBeUndefined();
	});

	/**
	 * Test MigrationHistory with mixed migration types
	 */
	it('should handle MigrationHistory with mixed migration types', () => {
		const appliedMigration: Migration = {
			id: createMigrationId('applied'),
			doctype: 'TestDocType',
			timestamp: createTestDate(0),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN applied_field VARCHAR(255);',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN applied_field;',
			applied: true,
			version: createTestVersion(1, 0, 0),
			destructive: false,
			requiresBackup: false
		};
		
		const pendingMigration: Migration = {
			id: createMigrationId('pending'),
			doctype: 'TestDocType',
			timestamp: createTestDate(1),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'ALTER TABLE tabTestDocType ADD COLUMN pending_field INTEGER;',
			rollbackSql: 'ALTER TABLE tabTestDocType DROP COLUMN pending_field;',
			applied: false,
			version: createTestVersion(1, 1, 0),
			destructive: false,
			requiresBackup: false
		};
		
		const failedMigration: Migration = {
			id: createMigrationId('failed'),
			doctype: 'TestDocType',
			timestamp: createTestDate(2),
			diff: {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			},
			sql: 'INVALID SQL STATEMENT',
			rollbackSql: '',
			applied: false,
			version: createTestVersion(1, 2, 0),
			destructive: true,
			requiresBackup: true,
			error: 'SQL syntax error'
		};
		
		const history: MigrationHistory = {
			migrations: [appliedMigration, pendingMigration, failedMigration],
			lastMigration: appliedMigration,
			pendingMigrations: [pendingMigration],
			failedMigrations: [failedMigration],
			stats: {
				total: 3,
				applied: 1,
				pending: 1,
				failed: 1,
				destructive: 1,
				lastMigrationDate: appliedMigration.timestamp,
				totalExecutionTime: 2500
			}
		};
		
		expect(history.migrations).toHaveLength(3);
		expect(history.lastMigration?.id).toBe(appliedMigration.id);
		expect(history.pendingMigrations).toHaveLength(1);
		expect(history.failedMigrations).toHaveLength(1);
		expect(history.stats.total).toBe(3);
		expect(history.stats.applied).toBe(1);
		expect(history.stats.pending).toBe(1);
		expect(history.stats.failed).toBe(1);
		expect(history.stats.destructive).toBe(1);
		expect(history.failedMigrations[0].destructive).toBe(true);
	});
});