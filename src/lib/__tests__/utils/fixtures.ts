/**
 * Test Fixtures
 *
 * Provides common test data, mock objects, and fixtures
 * for use across all test suites in the SODAF project.
 */

import { vi } from 'vitest';
import type { DocType, DocField, DocPerm } from '../../meta/doctype/types';
import type { Migration, SchemaDiff, ColumnChange, IndexChange } from '../../meta/migration/types';

/**
 * Common test constants
 */
export const TestConstants = {
	/** Test database name */
	TEST_DB_NAME: 'sodaf_test',
	
	/** Test user data */
	TEST_USER: {
		id: 1,
		name: 'Test User',
		email: 'test@example.com',
		role: 'System Manager'
	},
	
	/** Test timestamps */
	TEST_TIMESTAMP: '2024-01-01T00:00:00.000Z',
	
	/** Test strings */
	TEST_STRING: 'test_value',
	TEST_LONG_STRING: 'This is a longer test string with more content for testing purposes',
	
	/** Test numbers */
	TEST_NUMBER: 42,
	TEST_DECIMAL: 42.5,
	TEST_CURRENCY: 100.50,
	
	/** Test dates */
	TEST_DATE: '2024-01-01',
	TEST_DATETIME: '2024-01-01 12:00:00',
	
	/** Test boolean */
	TEST_BOOLEAN: true,
	
	/** Test arrays */
	TEST_ARRAY: ['item1', 'item2', 'item3'],
	
	/** Test objects */
	TEST_OBJECT: { key1: 'value1', key2: 'value2' }
};

/**
 * Mock DocType fixtures
 */
export const DocTypeFixtures = {
	/**
	 * Minimal DocType with just required fields
	 */
	minimalDocType: {
		name: 'TestDocType',
		module: 'TestModule',
		fields: [
			{ fieldname: 'name', label: 'Name', fieldtype: 'Data' as const }
		],
		permissions: [
			{ role: 'System Manager', read: true, write: true, create: true, delete: true }
		]
	} as DocType,

	/**
	 * Comprehensive DocType with all field types
	 */
	comprehensiveDocType: {
		name: 'ComprehensiveDocType',
		module: 'TestModule',
		fields: [
			{ fieldname: 'name', label: 'Name', fieldtype: 'Data' as const, required: true },
			{ fieldname: 'description', label: 'Description', fieldtype: 'Long Text' as const },
			{ fieldname: 'status', label: 'Status', fieldtype: 'Select' as const, options: 'Draft\nSubmitted\nCancelled' },
			{ fieldname: 'created_date', label: 'Created Date', fieldtype: 'Date' as const },
			{ fieldname: 'amount', label: 'Amount', fieldtype: 'Currency' as const },
			{ fieldname: 'is_active', label: 'Is Active', fieldtype: 'Check' as const },
			{ fieldname: 'link_field', label: 'Link Field', fieldtype: 'Link' as const, options: 'User' },
			{ fieldname: 'table_field', label: 'Table Field', fieldtype: 'Table' as const, options: 'ChildDoc' }
		],
		permissions: [
			{ role: 'System Manager', read: true, write: true, create: true, delete: true },
			{ role: 'User', read: true, write: false, create: false, delete: false }
		],
		indexes: [
			{ name: 'idx_name', columns: ['name'], unique: true },
			{ name: 'idx_status', columns: ['status'], unique: false }
		]
	} as DocType,

	/**
	 * Child table DocType
	 */
	childTableDocType: {
		name: 'ChildTableDocType',
		module: 'TestModule',
		istable: true,
		fields: [
			{ fieldname: 'parent', label: 'Parent', fieldtype: 'Link' as const, options: 'ParentDocType' },
			{ fieldname: 'parenttype', label: 'Parent Type', fieldtype: 'Data' as const },
			{ fieldname: 'parentfield', label: 'Parent Field', fieldtype: 'Data' as const },
			{ fieldname: 'idx', label: 'Index', fieldtype: 'Int' as const },
			{ fieldname: 'item_name', label: 'Item Name', fieldtype: 'Data' as const },
			{ fieldname: 'amount', label: 'Amount', fieldtype: 'Currency' as const }
		],
		permissions: [
			{ role: 'System Manager', read: true, write: true, create: true, delete: true }
		]
	} as DocType,

	/**
	 * Single document DocType
	 */
	singleDocType: {
		name: 'SingleDocType',
		module: 'TestModule',
		issingle: true,
		fields: [
			{ fieldname: 'company_name', label: 'Company Name', fieldtype: 'Data' as const, required: true },
			{ fieldname: 'default_currency', label: 'Default Currency', fieldtype: 'Link' as const, options: 'Currency' },
			{ fieldname: 'fiscal_year_start', label: 'Fiscal Year Start', fieldtype: 'Date' as const },
			{ fieldname: 'timezone', label: 'Timezone', fieldtype: 'Data' as const }
		],
		permissions: [
			{ role: 'System Manager', read: true, write: true, create: true, delete: true }
		]
	} as DocType,

	/**
	 * Virtual DocType
	 */
	virtualDocType: {
		name: 'VirtualDocType',
		module: 'TestModule',
		is_virtual: true,
		fields: [
			{ fieldname: 'name', label: 'Name', fieldtype: 'Data' as const },
			{ fieldname: 'total_count', label: 'Total Count', fieldtype: 'Int' as const },
			{ fieldname: 'last_updated', label: 'Last Updated', fieldtype: 'Datetime' as const }
		],
		permissions: [
			{ role: 'System Manager', read: true, write: false, create: false, delete: false }
		]
	} as DocType
};

/**
 * Invalid DocType fixtures for testing validation
 */
export const InvalidDocTypeFixtures = {
	/**
	 * DocType with empty name
	 */
	emptyName: {
		name: '',
		module: 'TestModule',
		fields: [],
		permissions: []
	} as DocType,

	/**
	 * DocType with duplicate field names
	 */
	duplicateFields: {
		name: 'TestDocType',
		module: 'TestModule',
		fields: [
			{ fieldname: 'name', label: 'Name', fieldtype: 'Data' as const },
			{ fieldname: 'name', label: 'Another Name', fieldtype: 'Data' as const }
		],
		permissions: []
	} as DocType,

	/**
	 * DocType with invalid field type
	 */
	invalidFieldType: {
		name: 'TestDocType',
		module: 'TestModule',
		fields: [
			{ fieldname: 'name', label: 'Name', fieldtype: 'InvalidType' as any }
		],
		permissions: []
	} as DocType,

	/**
	 * DocType with Link field missing options
	 */
	linkWithoutOptions: {
		name: 'TestDocType',
		module: 'TestModule',
		fields: [
			{ fieldname: 'link_field', label: 'Link Field', fieldtype: 'Link' as const }
		],
		permissions: []
	} as DocType,

	/**
	 * DocType with Table field missing options
	 */
	tableWithoutOptions: {
		name: 'TestDocType',
		module: 'TestModule',
		fields: [
			{ fieldname: 'table_field', label: 'Table Field', fieldtype: 'Table' as const }
		],
		permissions: []
	} as DocType
};

/**
 * Migration fixtures
 */
export const MigrationFixtures = {
	/**
	 * Basic schema migration
	 */
	basicMigration: {
		id: '001_basic_migration',
		doctype: 'TestDocType',
		timestamp: new Date('2024-01-01T00:00:00.000Z'),
		version: '1.0.0',
		description: 'Basic schema migration',
		sql: ['CREATE TABLE test_doctype (id INTEGER PRIMARY KEY, name TEXT NOT NULL);'],
		rollbackSql: ['DROP TABLE test_doctype;'],
		applied: false,
		destructive: true,
		requiresBackup: true,
		diff: {
			addedColumns: [],
			removedColumns: [],
			modifiedColumns: [],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		}
	} as Migration,

	/**
	 * Data migration
	 */
	dataMigration: {
		id: '002_data_migration',
		doctype: 'TestDocType',
		timestamp: new Date('2024-01-02T00:00:00.000Z'),
		version: '1.1.0',
		description: 'Data migration',
		sql: ['UPDATE test_doctype SET updated_at = CURRENT_TIMESTAMP;'],
		rollbackSql: ['UPDATE test_doctype SET updated_at = NULL;'],
		applied: false,
		destructive: false,
		requiresBackup: false,
		diff: {
			addedColumns: [],
			removedColumns: [],
			modifiedColumns: [],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		}
	} as Migration,

	/**
	 * Complex migration with column changes
	 */
	complexMigration: {
		id: '003_complex_migration',
		doctype: 'TestDocType',
		timestamp: new Date('2024-01-03T00:00:00.000Z'),
		version: '1.2.0',
		description: 'Complex migration with column changes',
		sql: [
			'ALTER TABLE test_doctype ADD COLUMN new_field TEXT;',
			'UPDATE test_doctype SET new_field = "default_value" WHERE new_field IS NULL;'
		],
		rollbackSql: ['ALTER TABLE test_doctype DROP COLUMN new_field;'],
		applied: false,
		destructive: false,
		requiresBackup: true,
		diff: {
			addedColumns: [
				{
					fieldname: 'new_field',
					column: {
						name: 'new_field',
						type: 'TEXT',
						nullable: true,
						primary_key: false,
						auto_increment: false,
						unique: false
					},
					destructive: false
				}
			],
			removedColumns: [],
			modifiedColumns: [],
			addedIndexes: [],
			removedIndexes: [],
			renamedColumns: []
		}
	} as Migration
};

/**
 * Schema diff fixtures
 */
export const SchemaDiffFixtures = {
	/**
	 * Empty schema diff
	 */
	emptyDiff: {
		addedColumns: [],
		removedColumns: [],
		modifiedColumns: [],
		addedIndexes: [],
		removedIndexes: [],
		renamedColumns: []
	} as SchemaDiff,

	/**
	 * Schema diff with added columns
	 */
	addedColumnsDiff: {
		addedColumns: [
			{
				fieldname: 'new_field',
				column: {
					name: 'new_field',
					type: 'TEXT',
					nullable: true,
					primary_key: false,
					auto_increment: false,
					unique: false
				},
				destructive: false
			}
		],
		removedColumns: [],
		modifiedColumns: [],
		addedIndexes: [],
		removedIndexes: [],
		renamedColumns: []
	} as SchemaDiff,

	/**
	 * Schema diff with removed columns
	 */
	removedColumnsDiff: {
		addedColumns: [],
		removedColumns: [
			{
				fieldname: 'old_field',
				column: {
					name: 'old_field',
					type: 'TEXT',
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
	} as SchemaDiff,

	/**
	 * Schema diff with modified columns
	 */
	modifiedColumnsDiff: {
		addedColumns: [],
		removedColumns: [],
		modifiedColumns: [
			{
				fieldname: 'modified_field',
				changes: {
					type: { from: 'TEXT', to: 'INTEGER' },
					nullable: { from: true, to: false }
				},
				requiresDataMigration: true,
				destructive: false
			}
		],
		addedIndexes: [],
		removedIndexes: [],
		renamedColumns: []
	} as SchemaDiff
};

/**
 * Field fixtures
 */
export const FieldFixtures = {
	/**
	 * Basic text field
	 */
	textField: {
		fieldname: 'name',
		label: 'Name',
		fieldtype: 'Data' as const,
		required: true
	} as DocField,

	/**
	 * Select field with options
	 */
	selectField: {
		fieldname: 'status',
		label: 'Status',
		fieldtype: 'Select' as const,
		options: 'Draft\nSubmitted\nCancelled',
		default: 'Draft'
	} as DocField,

	/**
	 * Link field
	 */
	linkField: {
		fieldname: 'user',
		label: 'User',
		fieldtype: 'Link' as const,
		options: 'User'
	} as DocField,

	/**
	 * Table field
	 */
	tableField: {
		fieldname: 'items',
		label: 'Items',
		fieldtype: 'Table' as const,
		options: 'ChildDoc'
	} as DocField,

	/**
	 * Currency field
	 */
	currencyField: {
		fieldname: 'amount',
		label: 'Amount',
		fieldtype: 'Currency' as const,
		precision: 2
	} as DocField,

	/**
	 * Date field
	 */
	dateField: {
		fieldname: 'created_date',
		label: 'Created Date',
		fieldtype: 'Date' as const
	} as DocField,

	/**
	 * Check field
	 */
	checkField: {
		fieldname: 'is_active',
		label: 'Is Active',
		fieldtype: 'Check' as const,
		default: 0
	} as DocField
};

/**
 * Permission fixtures
 */
export const PermissionFixtures = {
	/**
	 * Full permissions for System Manager
	 */
	systemManager: {
		role: 'System Manager',
		read: true,
		write: true,
		create: true,
		delete: true,
		submit: true,
		cancel: true,
		amend: true,
		report: true,
		export: true,
		import: true,
		share: true,
		print: true,
		email: true
	} as DocPerm,

	/**
	 * Read-only permissions for Guest
	 */
	guest: {
		role: 'Guest',
		read: true,
		write: false,
		create: false,
		delete: false,
		submit: false,
		cancel: false,
		amend: false,
		report: false,
		export: false,
		import: false,
		share: false,
		print: false,
		email: false
	} as DocPerm,

	/**
	 * Read and write permissions for User
	 */
	user: {
		role: 'User',
		read: true,
		write: true,
		create: false,
		delete: false,
		submit: false,
		cancel: false,
		amend: false,
		report: false,
		export: false,
		import: false,
		share: false,
		print: false,
		email: false
	} as DocPerm
};

/**
 * Mock objects for testing
 */
export const MockObjects = {
	/**
	 * Mock database connection
	 */
	mockDatabase: {
		prepare: vi.fn(),
		exec: vi.fn(),
		run: vi.fn(),
		get: vi.fn(),
		all: vi.fn(),
		close: vi.fn()
	},

	/**
	 * Mock logger
	 */
	mockLogger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn()
	},

	/**
	 * Mock event emitter
	 */
	mockEventEmitter: {
		on: vi.fn(),
		off: vi.fn(),
		emit: vi.fn(),
		once: vi.fn()
	},

	/**
	 * Mock file system
	 */
	mockFileSystem: {
		readFileSync: vi.fn(),
		writeFileSync: vi.fn(),
		existsSync: vi.fn(),
		mkdirSync: vi.fn(),
		readdirSync: vi.fn(),
		unlinkSync: vi.fn()
	}
};

/**
 * Test data generators
 */
export const TestDataGenerators = {
	/**
	 * Generate a random string
	 */
	randomString: (length: number = 10): string => {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	},

	/**
	 * Generate a random email
	 */
	randomEmail: (): string => {
		const username = TestDataGenerators.randomString(8);
		const domain = TestDataGenerators.randomString(6);
		return `${username}@${domain}.com`;
	},

	/**
	 * Generate a random number
	 */
	randomNumber: (min: number = 0, max: number = 100): number => {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},

	/**
	 * Generate a random date
	 */
	randomDate: (start: Date = new Date(2020, 0, 1), end: Date = new Date()): Date => {
		return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
	},

	/**
	 * Generate a random boolean
	 */
	randomBoolean: (): boolean => {
		return Math.random() < 0.5;
	},

	/**
	 * Generate test DocType data
	 */
	generateDocType: (overrides: Partial<DocType> = {}): DocType => {
		return {
			name: TestDataGenerators.randomString(10),
			module: 'TestModule',
			fields: [
				{
					fieldname: 'name',
					label: 'Name',
					fieldtype: 'Data',
					required: true
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
			...overrides
		};
	},

	/**
	 * Generate test field data
	 */
	generateField: (overrides: Partial<DocField> = {}): DocField => {
		return {
			fieldname: TestDataGenerators.randomString(8),
			label: TestDataGenerators.randomString(10),
			fieldtype: 'Data',
			...overrides
		};
	},

	/**
	 * Generate test permission data
	 */
	generatePermission: (overrides: Partial<DocPerm> = {}): DocPerm => {
		return {
			role: TestDataGenerators.randomString(10),
			read: true,
			write: true,
			create: true,
			delete: true,
			...overrides
		};
	}
};