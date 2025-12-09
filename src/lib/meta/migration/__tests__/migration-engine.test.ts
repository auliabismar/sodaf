/**
 * Migration Engine Tests (P2-019)
 *
 * Tests for the MigrationWorkflow class which orchestrates the migration process.
 */

import { describe, it, expect, vi } from 'vitest';
import type { DocTypeEngine } from '../../doctype';
import type { DocType } from '../../doctype/types';

// Mock dependencies using manual mocks from __mocks__
vi.mock('../schema-comparison-engine');
vi.mock('../sql-generator');

import { MigrationWorkflow } from '../migration-workflow';

describe('MigrationWorkflow', () => {
    // Setup helper to replace beforeEach and shared state
    const setup = () => {
        vi.clearAllMocks();

        const mockDatabase = {
            run: vi.fn(),
            all: vi.fn()
        };

        const mockDocType: DocType = {
            name: 'TestDocType',
            module: 'TestModule',
            fields: [
                {
                    fieldname: 'test_field',
                    fieldtype: 'Data',
                    label: 'Test Field',
                    required: false
                }
            ],
            permissions: []
        };

        const mockDocTypeEngine = {
            getDocType: vi.fn().mockResolvedValue(mockDocType)
        } as any;

        const workflow = new MigrationWorkflow(mockDatabase, mockDocTypeEngine);

        // Helper to access private mock instances specific to this workflow
        const mocks = {
            compareSchema: (workflow as any).schemaEngine.compareSchema,
            generateMigrationSQL: (workflow as any).sqlGenerator.generateMigrationSQL
        };

        return { workflow, mocks, mockDatabase, mockDocTypeEngine };
    };

    describe('executeMigration', () => {
        it('should execute migration successfully when changes exist', async () => {
            const { workflow, mocks } = setup();

            const diff = {
                addedColumns: [{ fieldname: 'c', column: {}, destructive: false }],
                removedColumns: [], modifiedColumns: [], addedIndexes: [], removedIndexes: [], renamedColumns: []
            };

            mocks.compareSchema.mockResolvedValue(diff);
            mocks.generateMigrationSQL.mockReturnValue({
                forward: [{ sql: 'ALTER TABLE tabTestDocType ADD COLUMN c TEXT', type: 'alter_table' }],
                rollback: [],
                destructive: false,
                metadata: { id: 'test', version: '1.0', timestamp: new Date() }
            });

            const result = await workflow.executeMigration('TestDocType');

            if (!result.success) {
                console.error('Migration failed with errors:', result.errors);
            }
            expect(result.success).toBe(true);
            expect(result.sql).toEqual(['ALTER TABLE tabTestDocType ADD COLUMN c TEXT']);
        });

        it('should successfuly complete when no changes detected', async () => {
            const { workflow, mocks } = setup();

            // Explicitly set "no changes" diff
            mocks.compareSchema.mockResolvedValue({
                addedColumns: [], removedColumns: [], modifiedColumns: [], addedIndexes: [], removedIndexes: [], renamedColumns: []
            });
            mocks.generateMigrationSQL.mockReturnValue({
                forward: [], rollback: [], destructive: false, metadata: { id: 'test', version: '1.0', timestamp: new Date() }
            });

            const result = await workflow.executeMigration('TestDocType');

            expect(result.success).toBe(true);
            expect(result.warnings).toContain('No schema changes detected');
            expect(result.sql).toHaveLength(0);
        });

        it('should handle dry run correctly', async () => {
            const { workflow, mocks } = setup();

            const diff = {
                addedColumns: [{ fieldname: 'c', column: {} }],
                removedColumns: [], modifiedColumns: [], addedIndexes: [], removedIndexes: [], renamedColumns: []
            };

            mocks.compareSchema.mockResolvedValue(diff);
            // Valid SQL
            mocks.generateMigrationSQL.mockReturnValue({
                forward: [{ sql: 'ALTER TABLE test ADD COLUMN c TEXT', type: 'alter_table' }],
                rollback: [],
                destructive: false,
                metadata: { id: 'test', version: '1.0', timestamp: new Date() }
            });

            const result = await workflow.executeMigration('TestDocType', { dryRun: true });

            if (!result.success) {
                console.error('Dry run failed with errors:', result.errors);
            }
            expect(result.success).toBe(true);
            expect(result.warnings).toContain('Dry run - no changes applied');
        });

        it('should return errors when validation fails', async () => {
            const { workflow, mocks } = setup();

            const diff = {
                addedColumns: [{ fieldname: 'c', column: {} }],
                removedColumns: [], modifiedColumns: [], addedIndexes: [], removedIndexes: [], renamedColumns: []
            };

            mocks.compareSchema.mockResolvedValue(diff);
            // Invalid SQL
            mocks.generateMigrationSQL.mockReturnValue({
                forward: [{ sql: 'INVALID QUERY', type: 'test' }],
                rollback: [],
                destructive: false,
                metadata: { id: 'test', version: '1.0', timestamp: new Date() }
            });

            const result = await workflow.executeMigration('TestDocType');

            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('Invalid SQL syntax');
        });
    });

    describe('Initialization', () => {
        it('should initialize with dependencies', () => {
            const { workflow } = setup();
            expect(workflow).toBeDefined();
        });
    });

    describe('generateMigrationSQL', () => {
        it('should generate SQL without applying', async () => {
            const { workflow, mocks } = setup();
            mocks.compareSchema.mockResolvedValue({} as any);
            mocks.generateMigrationSQL.mockReturnValue({ forward: [], rollback: [], metadata: {} } as any);

            const result = await workflow.generateMigrationSQL('TestDocType');
            expect(result).toBeDefined();
        });
    });

    describe('Rollback', () => {
        it('should generate rollback SQL', async () => {
            const { workflow, mocks } = setup();
            mocks.generateMigrationSQL.mockReturnValue({
                forward: [],
                rollback: [{ sql: 'DROP COLUMN' }],
                metadata: { id: 'test', version: '1.0', timestamp: new Date() }
            });
            const sql = await workflow.generateRollbackSQL('TestDocType');
            expect(sql[0]).toBe('DROP COLUMN');
        });

        it('should execute rollback', async () => {
            const { workflow, mocks } = setup();
            mocks.generateMigrationSQL.mockReturnValue({
                forward: [],
                rollback: [{ sql: 'DROP COLUMN' }],
                metadata: { id: 'test', version: '1.0', timestamp: new Date() }
            });
            const result = await workflow.executeRollback('TestDocType');
            expect(result.success).toBe(true);
        });
    });
});
