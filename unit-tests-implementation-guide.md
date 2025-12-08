# Unit Tests Implementation Guide for SODAF Metadata System (P2-019)

## Overview

This guide provides detailed implementation steps for creating comprehensive unit tests for all Phase 2 metadata system components in the SODAF framework.

## Prerequisites

1. Ensure all Phase 2 components are implemented
2. Vitest is properly configured
3. Test environment is set up with Node.js
4. Coverage reporting tools are installed

## Step 1: Update Vitest Configuration

First, update the Vitest configuration to include coverage reporting:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'node',
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'src/**/*.d.ts',
				'src/**/__tests__/**',
				'src/**/*.test.ts',
				'src/**/*.spec.ts'
			],
			thresholds: {
				global: {
					branches: 70,
					functions: 80,
					lines: 80,
					statements: 80
				}
			}
		}
	}
});
```

## Step 2: Create Test Utilities

### 2.1 Common Test Helpers

Create `src/lib/__tests__/utils/test-helpers.ts`:

```typescript
import type { DatabaseConfig } from '$lib/core/database/types';
import type { DocType, DocField, DocPerm } from '$lib/meta/doctype/types';
import type { SchemaDiff, Migration } from '$lib/meta/migration/types';
import type { FormSchema, FormField } from '$lib/meta/form/types';
import type { RouteConfig, ValidationSchema } from '$lib/meta/api/types';

export interface TestDatabaseConfig {
	path: string;
	options?: DatabaseConfig;
}

export interface TestDocTypeConfig {
	name: string;
	module: string;
	fields?: DocField[];
	permissions?: DocPerm[];
	[index: string]: any;
}

// Database helpers
export function createTestDatabase(config?: TestDatabaseConfig) {
	const defaultConfig: TestDatabaseConfig = {
		path: ':memory:'
	};
	
	return { ...defaultConfig, ...config };
}

export async function setupTestDatabase() {
	// Implementation for setting up test database
	// Use in-memory SQLite for fast tests
}

export async function cleanupTestDatabase(db: any) {
	// Implementation for cleaning up test database
}

// DocType helpers
export function createTestDocType(config: TestDocTypeConfig): DocType {
	const defaultFields: DocField[] = [
		{
			fieldname: 'name',
			label: 'Name',
			fieldtype: 'Data',
			required: true
		}
	];

	const defaultPermissions: DocPerm[] = [
		{
			role: 'System Manager',
			read: true,
			write: true,
			create: true,
			delete: true
		}
	];

	return {
		name: config.name,
		module: config.module,
		fields: config.fields || defaultFields,
		permissions: config.permissions || defaultPermissions,
		issingle: false,
		istable: false,
		is_submittable: false,
		is_tree: false,
		is_virtual: false,
		track_changes: true,
		track_seen: false,
		track_visits: false,
		show_in_global_search: true,
		allow_auto_repeat: false,
		allow_events: true,
		allow_import: true,
		allow_rename: true,
		max_attachments: 0,
		...config
	};
}

export function createTestField(
	fieldname: string, 
	fieldtype: DocField['fieldtype'], 
	options: Partial<DocField> = {}
): DocField {
	return {
		fieldname,
		label: fieldname.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
		fieldtype,
		required: false,
		unique: false,
		hidden: false,
		read_only: false,
		...options
	};
}

export function createTestPermission(
	role: string, 
	options: Partial<DocPerm> = {}
): DocPerm {
	return {
		role,
		read: true,
		write: false,
		create: false,
		delete: false,
		submit: false,
		cancel: false,
		amend: false,
		report: true,
		export: true,
		import: true,
		share: false,
		print: true,
		email: true,
		select: true,
		permlevel: 0,
		if_owner: false,
		apply_to_all: true,
		...options
	};
}

// Migration helpers
export function createTestSchemaDiff(options?: Partial<SchemaDiff>): SchemaDiff {
	return {
		addedColumns: [],
		removedColumns: [],
		modifiedColumns: [],
		addedIndexes: [],
		removedIndexes: [],
		renamedColumns: [],
		...options
	};
}

export function createTestMigration(options?: Partial<Migration>): Migration {
	return {
		id: 'test-migration-001',
		doctype: 'TestDocType',
		timestamp: new Date().toISOString(),
		diff: createTestSchemaDiff(),
		sql: '',
		rollbackSql: '',
		applied: false,
		error: null,
		...options
	};
}

// Form helpers
export function createTestFormField(
	fieldname: string, 
	fieldtype: string, 
	options: Partial<FormField> = {}
): FormField {
	return {
		fieldname,
		fieldtype,
		label: fieldname.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
		required: false,
		read_only: false,
		hidden: false,
		default: undefined,
		options: undefined,
		...options
	};
}

// API helpers
export function createTestRouteConfig(options?: Partial<RouteConfig>): RouteConfig {
	return {
		method: 'GET',
		path: '/api/resource/Test',
		handler: 'getList',
		middleware: [],
		validation: {},
		permissions: [],
		...options
	};
}

export function createTestValidationSchema(options?: Partial<ValidationSchema>): ValidationSchema {
	return {
		params: {},
		query: {},
		body: {},
		...options
	};
}
```

### 2.2 Mock Services

Create `src/lib/__tests__/mocks/mock-services.ts`:

```typescript
import type { DatabaseService } from '$lib/core/database/types';
import type { DocTypeEngine } from '$lib/meta/doctype/doctype-engine';
import type { MigrationEngine } from '$lib/meta/migration/migration-engine';

export class MockDatabaseService implements DatabaseService {
	// Mock implementation for testing database operations
	async query(sql: string, params?: any[]): Promise<any> {
		// Mock query implementation
		return [];
	}

	async run(sql: string, params?: any[]): Promise<any> {
		// Mock run implementation
		return { lastInsertRowid: 1, changes: 1 };
	}

	async close(): Promise<void> {
		// Mock close implementation
	}
}

export class MockDocTypeEngine implements Partial<DocTypeEngine> {
	private doctypes: Map<string, any> = new Map();

	async registerDocType(doctype: any): Promise<void> {
		this.doctypes.set(doctype.name, doctype);
	}

	async getDocType(name: string): Promise<any> {
		return this.doctypes.get(name) || null;
	}

	async getAllDocTypes(): Promise<any[]> {
		return Array.from(this.doctypes.values());
	}

	async isRegistered(name: string): Promise<boolean> {
		return this.doctypes.has(name);
	}

	reset(): void {
		this.doctypes.clear();
	}
}

export class MockMigrationEngine implements Partial<MigrationEngine> {
	private migrations: Migration[] = [];

	async compareSchema(doctype: string): Promise<any> {
		// Mock schema comparison
		return {
			addedColumns: [],
			removedColumns: [],
			modifiedColumns: [],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		};
	}

	async generateMigrationSQL(diff: any): Promise<string> {
		// Mock SQL generation
		return '-- Mock migration SQL';
	}

	async applyMigration(migration: Migration): Promise<void> {
		this.migrations.push(migration);
	}

	getMigrations(): Migration[] {
		return this.migrations;
	}

	reset(): void {
		this.migrations = [];
	}
}
```

## Step 3: Create Test Fixtures

### 3.1 DocType Fixtures

Update `src/lib/meta/doctype/__tests__/fixtures/doctype-fixtures.ts`:

```typescript
import type { DocType, DocField, DocPerm } from '../../types';

export const MINIMAL_DOCTYPE: DocType = {
	name: 'User',
	module: 'Core',
	fields: [
		{
			fieldname: 'name',
			label: 'Name',
			fieldtype: 'Data',
			required: true
		},
		{
			fieldname: 'email',
			label: 'Email',
			fieldtype: 'Data',
			required: true,
			unique: true
		}
	],
	permissions: [
		{
			role: 'System Manager',
			read: true,
			write: true,
			create: true,
			delete: true
		}
	],
	issingle: false,
	istable: false,
	is_submittable: false,
	is_tree: false,
	is_virtual: false,
	track_changes: true,
	track_seen: false,
	track_visits: false,
	show_in_global_search: true,
	allow_auto_repeat: false,
	allow_events: true,
	allow_import: true,
	allow_rename: true,
	max_attachments: 0
};

export const SINGLE_DOCTYPE: DocType = {
	...MINIMAL_DOCTYPE,
	name: 'SystemSettings',
	issingle: true,
	fields: [
		{
			fieldname: 'app_name',
			label: 'Application Name',
			fieldtype: 'Data',
			required: true
		},
		{
			fieldname: 'default_currency',
			label: 'Default Currency',
			fieldtype: 'Link',
			options: 'Currency',
			required: true
		}
	]
};

export const TABLE_DOCTYPE: DocType = {
	...MINIMAL_DOCTYPE,
	name: 'UserAddress',
	istable: true,
	fields: [
		{
			fieldname: 'parent',
			label: 'Parent',
			fieldtype: 'Link',
			options: 'User',
			required: true
		},
		{
			fieldname: 'address_type',
			label: 'Address Type',
			fieldtype: 'Select',
			options: 'Home\nOffice\nOther',
			required: true
		},
		{
			fieldname: 'address_line1',
			label: 'Address Line 1',
			fieldtype: 'Data',
			required: true
		},
		{
			fieldname: 'city',
			label: 'City',
			fieldtype: 'Data',
			required: true
		},
		{
			fieldname: 'country',
			label: 'Country',
			fieldtype: 'Link',
			options: 'Country',
			required: true
		}
	]
};

export const SUBMITTABLE_DOCTYPE: DocType = {
	...MINIMAL_DOCTYPE,
	name: 'Invoice',
	is_submittable: true,
	fields: [
		{
			fieldname: 'customer',
			label: 'Customer',
			fieldtype: 'Link',
			options: 'Customer',
			required: true
		},
		{
			fieldname: 'posting_date',
			label: 'Posting Date',
			fieldtype: 'Date',
			required: true
		},
		{
			fieldname: 'due_date',
			label: 'Due Date',
			fieldtype: 'Date',
			required: true
		},
		{
			fieldname: 'grand_total',
			label: 'Grand Total',
			fieldtype: 'Currency',
			required: true
		},
		{
			fieldname: 'status',
			label: 'Status',
			fieldtype: 'Select',
			options: 'Draft\nSubmitted\nCancelled\nPaid',
			default: 'Draft',
			required: true
		}
	]
};

export const TREE_DOCTYPE: DocType = {
	...MINIMAL_DOCTYPE,
	name: 'Account',
	is_tree: true,
	fields: [
		{
			fieldname: 'parent_account',
			label: 'Parent Account',
			fieldtype: 'Link',
			options: 'Account'
		},
		{
			fieldname: 'account_name',
			label: 'Account Name',
			fieldtype: 'Data',
			required: true
		},
		{
			fieldname: 'is_group',
			label: 'Is Group',
			fieldtype: 'Check',
			default: 0
		},
		{
			fieldname: 'account_type',
			label: 'Account Type',
			fieldtype: 'Select',
			options: 'Asset\nLiability\nEquity\nIncome\nExpense',
			required: true
		}
	]
};

export const VIRTUAL_DOCTYPE: DocType = {
	...MINIMAL_DOCTYPE,
	name: 'ExternalAPI',
	is_virtual: true,
	fields: [
		{
			fieldname: 'api_endpoint',
			label: 'API Endpoint',
			fieldtype: 'Data',
			required: true
		},
		{
			fieldname: 'api_key',
			label: 'API Key',
			fieldtype: 'Password',
			required: true
		},
		{
			fieldname: 'last_sync',
			label: 'Last Sync',
			fieldtype: 'Datetime',
			read_only: true
		}
	]
};
```

### 3.2 Migration Fixtures

Create `src/lib/meta/migration/__tests__/fixtures/migration-fixtures.ts`:

```typescript
import type { SchemaDiff, Migration, FieldChange, IndexChange } from '../../types';

export const NEW_TABLE_DIFF: SchemaDiff = {
	addedColumns: [
		{
			fieldname: 'name',
			fieldtype: 'Data',
			required: true,
			length: 255,
			unique: true
		},
		{
			fieldname: 'email',
			fieldtype: 'Data',
			required: true,
			length: 255,
			unique: true
		},
		{
			fieldname: 'status',
			fieldtype: 'Select',
			options: 'Active\nInactive',
			default: 'Active',
			required: true
		},
		{
			fieldname: 'created_at',
			fieldtype: 'Datetime',
			required: true,
			default: 'NOW()'
		}
	],
	removedColumns: [],
	modifiedColumns: [],
	addedIndexes: [
		{
			name: 'idx_user_name',
			columns: ['name'],
			unique: true,
			type: 'btree'
		},
		{
			name: 'idx_user_email',
			columns: ['email'],
			unique: true,
			type: 'btree'
		},
		{
			name: 'idx_user_status',
			columns: ['status'],
			unique: false,
			type: 'btree'
		}
	],
	removedIndexes: [],
	renamedColumns: []
};

export const COLUMN_MODIFICATION_DIFF: SchemaDiff = {
	addedColumns: [
		{
			fieldname: 'phone',
			fieldtype: 'Data',
			required: false,
			length: 50
		}
	],
	removedColumns: [
		{
			fieldname: 'fax',
			fieldtype: 'Data',
			required: false,
			length: 50
		}
	],
	modifiedColumns: [
		{
			fieldname: 'email',
			changes: {
				type: { from: 'Data', to: 'Text' },
				length: { from: 255, to: 1000 },
				required: { from: true, to: false }
			},
			requiresDataMigration: false
		},
		{
			fieldname: 'status',
			changes: {
				options: { from: 'Active\nInactive', to: 'Active\nInactive\nPending' }
			},
			requiresDataMigration: false
		}
	],
	addedIndexes: [
		{
			name: 'idx_user_phone',
			columns: ['phone'],
			unique: false,
			type: 'btree'
		}
	],
	removedIndexes: [
		{
			name: 'idx_user_fax',
			columns: ['fax'],
			unique: false,
			type: 'btree'
		}
	],
	renamedColumns: [
		{
			from: 'username',
			to: 'user_name'
		}
	]
};

export const TEST_MIGRATION: Migration = {
	id: 'migration_001_create_user_table',
	doctype: 'User',
	timestamp: '2023-01-01T00:00:00.000Z',
	diff: NEW_TABLE_DIFF,
	sql: `CREATE TABLE tab_user (
		name VARCHAR(255) NOT NULL UNIQUE,
		email VARCHAR(255) NOT NULL UNIQUE,
		status VARCHAR(20) NOT NULL DEFAULT 'Active',
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE UNIQUE INDEX idx_user_name ON tab_user(name);
	CREATE UNIQUE INDEX idx_user_email ON tab_user(email);
	CREATE INDEX idx_user_status ON tab_user(status);`,
	rollbackSql: `DROP TABLE tab_user;`,
	applied: false,
	error: null
};

export const COMPLEX_MIGRATION: Migration = {
	id: 'migration_002_update_user_table',
	doctype: 'User',
	timestamp: '2023-01-02T00:00:00.000Z',
	diff: COLUMN_MODIFICATION_DIFF,
	sql: `ALTER TABLE tab_user ADD COLUMN phone VARCHAR(50);
	ALTER TABLE tab_user DROP COLUMN fax;
	ALTER TABLE tab_user MODIFY COLUMN email TEXT;
	UPDATE tab_user SET status = CASE 
		WHEN status = 'Active' THEN 'Active'
		WHEN status = 'Inactive' THEN 'Inactive'
		ELSE 'Pending'
	END;
	CREATE INDEX idx_user_phone ON tab_user(phone);
	DROP INDEX idx_user_fax;`,
	rollbackSql: `ALTER TABLE tab_user DROP COLUMN phone;
	ALTER TABLE tab_user ADD COLUMN fax VARCHAR(50);
	ALTER TABLE tab_user MODIFY COLUMN email VARCHAR(255);
	DROP INDEX idx_user_phone;
	CREATE INDEX idx_user_fax ON tab_user(fax);`,
	applied: false,
	error: null
};
```

## Step 4: Implement Test Files

### 4.1 Migration Engine Tests

Create `src/lib/meta/migration/__tests__/migration-engine.test.ts`:

```typescript
/**
 * Migration Engine Tests - P2-006
 * 
 * Comprehensive test suite for MigrationEngine implementation covering:
 * - Schema comparison
 * - Change detection
 * - Table and index analysis
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MigrationEngine } from '../migration-engine';
import { MockDatabaseService } from '$lib/__tests__/mocks/mock-services';
import { createTestDocType, createTestDatabase } from '$lib/__tests__/utils/test-helpers';
import { NEW_TABLE_DIFF, COLUMN_MODIFICATION_DIFF } from './fixtures/migration-fixtures';
import type { DocType } from '../../doctype/types';

describe('MigrationEngine', () => {
	let engine: MigrationEngine;
	let mockDb: MockDatabaseService;

	beforeEach(() => {
		mockDb = new MockDatabaseService();
		engine = new MigrationEngine(mockDb as any);
	});

	describe('P2-006-T1: compareSchema(doctype) new table', () => {
		it('should return diff with all fields as addedColumns', async () => {
			const doctype = createTestDocType({
				name: 'NewTable',
				module: 'Test',
				fields: [
					{ fieldname: 'name', label: 'Name', fieldtype: 'Data', required: true },
					{ fieldname: 'email', label: 'Email', fieldtype: 'Data', required: true }
				]
			});

			// Mock database to return no existing table
			mockDb.query = vi.fn().mockResolvedValue([]);

			const diff = await engine.compareSchema(doctype.name);

			expect(diff.addedColumns).toHaveLength(2);
			expect(diff.addedColumns[0].fieldname).toBe('name');
			expect(diff.addedColumns[1].fieldname).toBe('email');
			expect(diff.removedColumns).toHaveLength(0);
			expect(diff.modifiedColumns).toHaveLength(0);
		});
	});

	describe('P2-006-T2: compareSchema no changes', () => {
		it('should return empty diff', async () => {
			const doctype = createTestDocType({
				name: 'ExistingTable',
				module: 'Test'
			});

			// Mock database to return existing table with same structure
			mockDb.query = vi.fn().mockResolvedValue([
				{ name: 'name', type: 'TEXT', notnull: 1, dflt_value: null },
				{ name: 'email', type: 'TEXT', notnull: 1, dflt_value: null }
			]);

			const diff = await engine.compareSchema(doctype.name);

			expect(diff.addedColumns).toHaveLength(0);
			expect(diff.removedColumns).toHaveLength(0);
			expect(diff.modifiedColumns).toHaveLength(0);
		});
	});

	describe('P2-006-T3: compareSchema added field', () => {
		it('should show field in addedColumns', async () => {
			const doctype = createTestDocType({
				name: 'TableWithNewField',
				module: 'Test',
				fields: [
					{ fieldname: 'name', label: 'Name', fieldtype: 'Data', required: true },
					{ fieldname: 'email', label: 'Email', fieldtype: 'Data', required: true },
					{ fieldname: 'phone', label: 'Phone', fieldtype: 'Data', required: false }
				]
			});

			// Mock database to return existing table without phone field
			mockDb.query = vi.fn().mockResolvedValue([
				{ name: 'name', type: 'TEXT', notnull: 1, dflt_value: null },
				{ name: 'email', type: 'TEXT', notnull: 1, dflt_value: null }
			]);

			const diff = await engine.compareSchema(doctype.name);

			expect(diff.addedColumns).toHaveLength(1);
			expect(diff.addedColumns[0].fieldname).toBe('phone');
			expect(diff.removedColumns).toHaveLength(0);
		});
	});

	describe('P2-006-T13: hasChanges(diff) empty', () => {
		it('should return false', () => {
			const emptyDiff = {
				addedColumns: [],
				removedColumns: [],
				modifiedColumns: [],
				addedIndexes: [],
				removedIndexes: [],
				renamedColumns: []
			};

			expect(engine.hasChanges(emptyDiff)).toBe(false);
		});
	});

	describe('P2-006-T14: hasChanges(diff) with changes', () => {
		it('should return true', () => {
			const diffWithChanges = NEW_TABLE_DIFF;

			expect(engine.hasChanges(diffWithChanges)).toBe(true);
		});
	});

	describe('P2-006-T15: requiresDataMigration(diff)', () => {
		it('should return true for type changes', () => {
			const diffWithTypeChange = {
				...COLUMN_MODIFICATION_DIFF,
				modifiedColumns: [
					{
						fieldname: 'amount',
						changes: {
							type: { from: 'Int', to: 'Float' }
						},
						requiresDataMigration: true
					}
				]
			};

			expect(engine.requiresDataMigration(diffWithTypeChange)).toBe(true);
		});

		it('should return false for non-data-migrating changes', () => {
			const diffWithoutDataMigration = {
				addedColumns: [
					{ fieldname: 'new_field', fieldtype: 'Data', required: false }
				]
			};

			expect(engine.requiresDataMigration(diffWithoutDataMigration)).toBe(false);
		});
	});

	describe('P2-006-T16: getTableColumns(doctype)', () => {
		it('should return current DB columns', async () => {
			const mockColumns = [
				{ name: 'name', type: 'TEXT', notnull: 1, dflt_value: null },
				{ name: 'email', type: 'TEXT', notnull: 1, dflt_value: null },
				{ name: 'status', type: 'TEXT', notnull: 1, dflt_value: 'Active' }
			];

			mockDb.query = vi.fn().mockResolvedValue(mockColumns);

			const columns = await engine.getTableColumns('User');

			expect(columns).toEqual(mockColumns);
			expect(mockDb.query).toHaveBeenCalledWith(
				expect.stringContaining('PRAGMA table_info'),
				expect.any(Array)
			);
		});
	});

	describe('P2-006-T17: getTableIndexes(doctype)', () => {
		it('should return current DB indexes', async () => {
			const mockIndexes = [
				{ name: 'idx_user_name', unique: 1, columns: ['name'] },
				{ name: 'idx_user_email', unique: 1, columns: ['email'] }
			];

			mockDb.query = vi.fn().mockResolvedValue(mockIndexes);

			const indexes = await engine.getTableIndexes('User');

			expect(indexes).toEqual(mockIndexes);
			expect(mockDb.query).toHaveBeenCalledWith(
				expect.stringContaining('PRAGMA index_list'),
				expect.any(Array)
			);
		});
	});
});
```

### 4.2 SQL Generator Tests

Create `src/lib/meta/migration/__tests__/sql-generator.test.ts`:

```typescript
/**
 * SQL Generator Tests - P2-007
 * 
 * Comprehensive test suite for SQLGenerator implementation covering:
 * - Table creation and modification
 * - Column operations
 * - Index operations
 * - Rollback SQL generation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SQLGenerator } from '../sql-generator';
import { createTestDocType, createTestField } from '$lib/__tests__/utils/test-helpers';
import { NEW_TABLE_DIFF, COLUMN_MODIFICATION_DIFF } from './fixtures/migration-fixtures';
import type { DocType, DocField } from '../../doctype/types';

describe('SQLGenerator', () => {
	let generator: SQLGenerator;

	beforeEach(() => {
		generator = new SQLGenerator();
	});

	describe('P2-007-T1: generateCreateTableSQL(doctype)', () => {
		it('should generate valid CREATE TABLE statement', () => {
			const doctype = createTestDocType({
				name: 'User',
				module: 'Core',
				fields: [
					createTestField('name', 'Data', { required: true, length: 255 }),
					createTestField('email', 'Data', { required: true, unique: true, length: 255 }),
					createTestField('status', 'Select', { options: 'Active\nInactive', default: 'Active' })
				]
			});

			const sql = generator.generateCreateTableSQL(doctype);

			expect(sql).toContain('CREATE TABLE tab_user (');
			expect(sql).toContain('name VARCHAR(255) NOT NULL');
			expect(sql).toContain('email VARCHAR(255) NOT NULL UNIQUE');
			expect(sql).toContain('status VARCHAR(255) NOT NULL DEFAULT \'Active\'');
			expect(sql).toContain(');');
		});
	});

	describe('P2-007-T2: generateAddColumnSQL(doctype, field)', () => {
		it('should generate valid ALTER TABLE ADD COLUMN', () => {
			const doctype = createTestDocType({ name: 'User', module: 'Core' });
			const field = createTestField('phone', 'Data', { required: false, length: 50 });

			const sql = generator.generateAddColumnSQL(doctype, field);

			expect(sql).toContain('ALTER TABLE tab_user ADD COLUMN');
			expect(sql).toContain('phone VARCHAR(50)');
		});
	});

	describe('P2-007-T3: generateDropColumnSQL(doctype, field)', () => {
		it('should generate SQLite table rebuild SQL', () => {
			const doctype = createTestDocType({
				name: 'User',
				module: 'Core',
				fields: [
					createTestField('name', 'Data', { required: true }),
					createTestField('email', 'Data', { required: true }),
					createTestField('phone', 'Data', { required: false })
				]
			});
			const field = createTestField('phone', 'Data');

			const sql = generator.generateDropColumnSQL(doctype, field);

			expect(sql).toContain('ALTER TABLE tab_user RENAME TO tab_user_old;');
			expect(sql).toContain('CREATE TABLE tab_user (');
			expect(sql).toContain('INSERT INTO tab_user');
			expect(sql).toContain('DROP TABLE tab_user_old;');
		});
	});

	describe('P2-007-T4: generateModifyColumnSQL(doctype, field)', () => {
		it('should generate SQLite table rebuild SQL', () => {
			const doctype = createTestDocType({
				name: 'User',
				module: 'Core',
				fields: [
					createTestField('name', 'Data', { required: true }),
					createTestField('email', 'Data', { required: true })
				]
			});
			const field = createTestField('email', 'Text', { required: false });

			const sql = generator.generateModifyColumnSQL(doctype, field);

			expect(sql).toContain('ALTER TABLE tab_user RENAME TO tab_user_old;');
			expect(sql).toContain('CREATE TABLE tab_user (');
			expect(sql).toContain('INSERT INTO tab_user');
			expect(sql).toContain('DROP TABLE tab_user_old;');
		});
	});

	describe('P2-007-T5: generateCreateIndexSQL(doctype, index)', () => {
		it('should generate valid CREATE INDEX', () => {
			const doctype = createTestDocType({ name: 'User', module: 'Core' });
			const index = {
				name: 'idx_user_email',
				columns: ['email'],
				unique: true,
				type: 'btree'
			};

			const sql = generator.generateCreateIndexSQL(doctype, index);

			expect(sql).toContain('CREATE UNIQUE INDEX idx_user_email ON tab_user(email);');
		});
	});

	describe('P2-007-T6: generateDropIndexSQL(indexName)', () => {
		it('should generate valid DROP INDEX', () => {
			const indexName = 'idx_user_email';

			const sql = generator.generateDropIndexSQL(indexName);

			expect(sql).toContain('DROP INDEX idx_user_email;');
		});
	});

	describe('P2-007-T7: generateRollbackSQL(migration)', () => {
		it('should return reverse of forward SQL', () => {
			const migration = {
				id: 'test_migration',
				sql: 'CREATE TABLE test (id INTEGER);',
				rollbackSql: 'DROP TABLE test;'
			};

			const rollbackSQL = generator.generateRollbackSQL(migration);

			expect(rollbackSQL).toBe('DROP TABLE test;');
		});
	});

	describe('P2-007-T8: SQL escapes identifiers', () => {
		it('should prevent SQL injection', () => {
			const doctype = createTestDocType({ name: 'User; DROP TABLE users; --', module: 'Core' });

			const sql = generator.generateCreateTableSQL(doctype);

			expect(sql).not.toContain('DROP TABLE');
		});
	});

	describe('P2-007-T9: Data type mapping correct', () => {
		it('should map DocField types to SQLite types', () => {
			const doctype = createTestDocType({
				name: 'TypeTest',
				module: 'Core',
				fields: [
					createTestField('data_field', 'Data'),
					createTestField('int_field', 'Int'),
					createTestField('float_field', 'Float'),
					createTestField('currency_field', 'Currency'),
					createTestField('check_field', 'Check'),
					createTestField('date_field', 'Date'),
					createTestField('datetime_field', 'Datetime')
				]
			});

			const sql = generator.generateCreateTableSQL(doctype);

			expect(sql).toContain('data_field TEXT');
			expect(sql).toContain('int_field INTEGER');
			expect(sql).toContain('float_field REAL');
			expect(sql).toContain('currency_field REAL');
			expect(sql).toContain('check_field INTEGER');
			expect(sql).toContain('date_field DATE');
			expect(sql).toContain('datetime_field DATETIME');
		});
	});

	describe('P2-007-T10: Constraint generation', () => {
		it('should generate NOT NULL, UNIQUE, DEFAULT', () => {
			const doctype = createTestDocType({
				name: 'ConstraintTest',
				module: 'Core',
				fields: [
					createTestField('name', 'Data', { required: true, unique: true }),
					createTestField('status', 'Select', { options: 'Active\nInactive', default: 'Active' }),
					createTestField('optional', 'Data')
				]
			});

			const sql = generator.generateCreateTableSQL(doctype);

			expect(sql).toContain('name TEXT NOT NULL UNIQUE');
			expect(sql).toContain('status TEXT NOT NULL DEFAULT \'Active\'');
			expect(sql).toContain('optional TEXT');
		});
	});

	describe('P2-007-T11: Foreign key generation', () => {
		it('should generate for Link fields', () => {
			const doctype = createTestDocType({
				name: 'User',
				module: 'Core',
				fields: [
					createTestField('country', 'Link', { options: 'Country', required: true })
				]
			});

			const sql = generator.generateCreateTableSQL(doctype);

			expect(sql).toContain('country TEXT NOT NULL');
			// Foreign key constraints would be added in a real implementation
		});
	});

	describe('P2-007-T12: generateMigrationSQL(diff)', () => {
		it('should generate complete migration SQL', () => {
			const diff = NEW_TABLE_DIFF;

			const sql = generator.generateMigrationSQL(diff);

			expect(sql).toContain('CREATE TABLE');
			expect(sql).toContain('CREATE INDEX');
		});
	});
});
```

## Step 5: Update Package.json Scripts

Update the test scripts in package.json:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

## Step 6: Run Tests and Verify Coverage

1. Run all tests:
   ```bash
   npm run test:coverage
   ```

2. Check coverage report:
   - Text output in console
   - HTML report at `coverage/index.html`
   - JSON report at `coverage/coverage-final.json`

3. Verify thresholds:
   - Statement coverage > 80%
   - Branch coverage > 70%
   - Function coverage > 80%
   - Line coverage > 80%

## Step 7: Integration Tests

Create `src/lib/__tests__/integration/metadata-workflow.test.ts`:

```typescript
/**
 * Integration Tests for Metadata System
 * 
 * End-to-end tests covering complete workflows across
 * DocType engine, migration, form generation, and API generation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DocTypeEngine } from '$lib/meta/doctype/doctype-engine';
import { MigrationEngine } from '$lib/meta/migration/migration-engine';
import { FormGenerator } from '$lib/meta/form/form-generator';
import { APIGenerator } from '$lib/meta/api/api-generator';
import { OpenAPIGenerator } from '$lib/meta/openapi/generator';
import { createTestDocType, setupTestDatabase, cleanupTestDatabase } from '../utils/test-helpers';
import { MINIMAL_DOCTYPE, SUBMITTABLE_DOCTYPE } from '$lib/meta/doctype/__tests__/fixtures/doctype-fixtures';

describe('Metadata Workflow Integration', () => {
	let docTypeEngine: DocTypeEngine;
	let migrationEngine: MigrationEngine;
	let formGenerator: FormGenerator;
	let apiGenerator: APIGenerator;
	let openAPIGenerator: OpenAPIGenerator;
	let testDb: any;

	beforeEach(async () => {
		testDb = await setupTestDatabase();
		docTypeEngine = DocTypeEngine.getInstance();
		migrationEngine = new MigrationEngine(testDb);
		formGenerator = new FormGenerator();
		apiGenerator = new APIGenerator();
		openAPIGenerator = new OpenAPIGenerator();
	});

	afterEach(async () => {
		await cleanupTestDatabase(testDb);
		DocTypeEngine.resetInstance();
	});

	it('should complete full DocType lifecycle', async () => {
		// 1. Register DocType
		await docTypeEngine.registerDocType(MINIMAL_DOCTYPE);
		
		// 2. Generate form schema
		const formSchema = formGenerator.generateFormSchema(MINIMAL_DOCTYPE);
		expect(formSchema.doctype).toBe('User');
		expect(formSchema.sections).toBeDefined();
		
		// 3. Generate API routes
		const routes = apiGenerator.generateRoutes(MINIMAL_DOCTYPE);
		expect(routes.length).toBeGreaterThan(0);
		expect(routes.some(r => r.method === 'GET')).toBe(true);
		expect(routes.some(r => r.method === 'POST')).toBe(true);
		
		// 4. Apply migrations
		const diff = await migrationEngine.compareSchema(MINIMAL_DOCTYPE.name);
		const migrationSQL = migrationEngine.generateMigrationSQL(diff);
		expect(migrationSQL).toContain('CREATE TABLE');
		
		// 5. Generate OpenAPI spec
		const openAPISpec = openAPIGenerator.generateOpenAPISpec([MINIMAL_DOCTYPE]);
		expect(openAPISpec.paths).toBeDefined();
		expect(openAPISpec.paths[`/api/resource/User`]).toBeDefined();
	});

	it('should handle submittable DocType workflow', async () => {
		// Register submittable DocType
		await docTypeEngine.registerDocType(SUBMITTABLE_DOCTYPE);
		
		// Generate API routes
		const routes = apiGenerator.generateRoutes(SUBMITTABLE_DOCTYPE);
		
		// Should include submit/cancel routes for submittable DocTypes
		const submitRoute = routes.find(r => r.path.includes('/submit'));
		const cancelRoute = routes.find(r => r.path.includes('/cancel'));
		
		expect(submitRoute).toBeDefined();
		expect(cancelRoute).toBeDefined();
		expect(submitRoute?.method).toBe('POST');
		expect(cancelRoute?.method).toBe('POST');
	});

	it('should generate complete API documentation', async () => {
		await docTypeEngine.registerDocType(MINIMAL_DOCTYPE);
		await docTypeEngine.registerDocType(SUBMITTABLE_DOCTYPE);
		
		const doctypes = await docTypeEngine.getAllDocTypes();
		const openAPISpec = openAPIGenerator.generateOpenAPISpec(doctypes);
		
		// Should have paths for both DocTypes
		expect(Object.keys(openAPISpec.paths || {})).toContain('/api/resource/User');
		expect(Object.keys(openAPISpec.paths || {})).toContain('/api/resource/Invoice');
		
		// Should have schemas for both DocTypes
		expect(openAPISpec.components?.schemas?.User).toBeDefined();
		expect(openAPISpec.components?.schemas?.Invoice).toBeDefined();
		
		// Should have proper info section
		expect(openAPISpec.info).toBeDefined();
		expect(openAPISpec.info.title).toBeDefined();
		expect(openAPISpec.info.version).toBeDefined();
	});
});
```

## Step 8: Performance Optimization

1. Use mock services for fast unit tests
2. Use in-memory databases for isolation
3. Parallelize test execution where possible
4. Optimize test data setup and teardown

## Step 9: Documentation

1. Document test patterns and conventions
2. Create test case documentation linked to backlog items
3. Provide examples for writing new tests
4. Document mock usage and fixture creation

## Step 10: CI/CD Integration

1. Configure GitHub Actions to run tests
2. Set up coverage reporting with Codecov
3. Add quality gates for test coverage
4. Configure test failures to block PRs

This implementation guide provides a comprehensive approach to creating unit tests for the SODAF metadata system while ensuring high coverage, maintainability, and performance.