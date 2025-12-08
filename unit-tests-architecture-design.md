# Unit Tests Architecture Design for SODAF Metadata System (P2-019)

## Overview

This document outlines the comprehensive architecture for implementing unit tests for all Phase 2 metadata system components in the SODAF framework. The testing strategy ensures >80% statement coverage and >70% branch coverage while maintaining test isolation and performance.

## Testing Framework Configuration

### Current Setup
- **Testing Framework**: Vitest
- **Test Environment**: Node.js
- **Test Pattern**: `src/**/*.{test,spec}.{js,ts}`
- **Global Test Functions**: Enabled
- **Test Scripts**:
  - `npm run test` - Run all tests
  - `npm run test:ui` - Run tests with UI
  - `npm run test:run` - Run tests once

### Coverage Configuration
```typescript
// vitest.config.ts - Additional configuration needed
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

## Test File Structure

```
src/lib/
├── meta/
│   ├── doctype/
│   │   ├── __tests__/
│   │   │   ├── doctype-engine.test.ts      ✅ (exists)
│   │   │   ├── json-parser.test.ts         ✅ (exists)
│   │   │   ├── meta.test.ts               ✅ (exists)
│   │   │   ├── types.test.ts              ✅ (exists)
│   │   │   ├── virtual-controller.test.ts  ✅ (exists)
│   │   │   ├── virtual-doctype.test.ts    ✅ (exists)
│   │   │   ├── virtual-manager.test.ts     ✅ (exists)
│   │   │   ├── meta-factory.test.ts       ✅ (exists)
│   │   │   └── fixtures/
│   │   │       ├── valid-doctype-comprehensive.json
│   │   │       ├── valid-doctype-minimal.json
│   │   │       ├── invalid-doctype-duplicates.json
│   │   │       ├── invalid-json-syntax.json
│   │   │       └── invalid-missing-required.json
│   │   └── ...
│   ├── migration/
│   │   ├── __tests__/
│   │   │   ├── migration-engine.test.ts     🆕 (to create)
│   │   │   ├── sql-generator.test.ts       🆕 (to create)
│   │   │   └── fixtures/
│   │   │       ├── schema-diffs.json
│   │   │       ├── migration-examples.json
│   │   │       └── test-schemas.json
│   │   └── ...
│   ├── form/
│   │   ├── __tests__/
│   │   │   ├── form-generator.test.ts     ✅ (exists)
│   │   │   ├── field-mapping.test.ts      🆕 (to create)
│   │   │   ├── types.test.ts              ✅ (exists)
│   │   │   ├── utils.test.ts              ✅ (exists)
│   │   │   ├── validators.test.ts         ✅ (exists)
│   │   │   ├── doctype-form-adapter.test.ts ✅ (exists)
│   │   │   ├── form-state-manager.test.ts  ✅ (exists)
│   │   │   ├── fixtures/
│   │   │   │   └── form-fixtures.ts       ✅ (exists)
│   │   │   └── field-mapping/
│   │   │       ├── default-mappings.test.ts ✅ (exists)
│   │   │       ├── prop-generators.test.ts  ✅ (exists)
│   │   │       └── registry.test.ts       ✅ (exists)
│   │   └── ...
│   ├── api/
│   │   ├── __tests__/
│   │   │   ├── api-generator.test.ts      🆕 (to create)
│   │   │   ├── types.test.ts              ✅ (exists)
│   │   │   └── fixtures/
│   │   │       ├── api-routes.json
│   │   │       └── validation-schemas.json
│   │   └── ...
│   └── openapi/
│       ├── __tests__/
│       │   ├── generator.test.ts           🆕 (to create)
│       │   ├── field-mapper.test.ts       ✅ (exists)
│       │   ├── route-generator.test.ts    ✅ (exists)
│       │   ├── schema-generator.test.ts   ✅ (exists)
│       │   └── security-generator.test.ts ✅ (exists)
└── __tests__/
    └── integration/
        ├── metadata-workflow.test.ts      🆕 (to create)
        ├── api-endpoints.test.ts          🆕 (to create)
        └── migration-workflow.test.ts     🆕 (to create)
```

## Test Utilities and Helpers

### Common Test Utilities
```typescript
// src/lib/__tests__/utils/test-helpers.ts
export interface TestDatabaseConfig {
	path: string;
	options?: DatabaseOptions;
}

export interface TestDocTypeConfig {
	name: string;
	module: string;
	fields?: DocField[];
	permissions?: DocPerm[];
	[index: string]: any;
}

// Database helpers
export function createTestDatabase(config?: TestDatabaseConfig): Database;
export function setupTestDatabase(): Promise<Database>;
export function cleanupTestDatabase(db: Database): Promise<void>;

// DocType helpers
export function createTestDocType(config: TestDocTypeConfig): DocType;
export function createTestField(fieldname: string, fieldtype: string, options?: Partial<DocField>): DocField;
export function createTestPermission(role: string, options?: Partial<DocPerm>): DocPerm;

// Migration helpers
export function createTestSchemaDiff(options?: Partial<SchemaDiff>): SchemaDiff;
export function createTestMigration(options?: Partial<Migration>): Migration;

// Form helpers
export function createTestFormSchema(options?: Partial<FormSchema>): FormSchema;
export function createTestFormField(fieldname: string, fieldtype: string): FormField;

// API helpers
export function createTestRouteConfig(options?: Partial<RouteConfig>): RouteConfig;
export function createTestValidationSchema(options?: Partial<ValidationSchema>): ValidationSchema;
```

### Mock Services
```typescript
// src/lib/__tests__/mocks/mock-services.ts
export class MockDatabaseService implements DatabaseService {
	// Mock implementation for testing
}

export class MockDocTypeEngine implements DocTypeEngine {
	// Mock implementation for testing
}

export class MockMigrationEngine implements MigrationEngine {
	// Mock implementation for testing
}
```

## Test Fixtures

### DocType Fixtures
```typescript
// src/lib/meta/doctype/__tests__/fixtures/doctype-fixtures.ts
export const MINIMAL_DOCTYPE: DocType = {
	name: 'User',
	module: 'Core',
	fields: [
		{ fieldname: 'name', label: 'Name', fieldtype: 'Data' },
		{ fieldname: 'email', label: 'Email', fieldtype: 'Data' }
	],
	permissions: [
		{ role: 'System Manager', read: true, write: true, create: true, delete: true }
	]
};

export const COMPREHENSIVE_DOCTYPE: DocType = {
	// Complete doctype with all properties
};

export const SINGLE_DOCTYPE: DocType = {
	// Single doctype configuration
};

export const TABLE_DOCTYPE: DocType = {
	// Table doctype configuration
};

export const TREE_DOCTYPE: DocType = {
	// Tree doctype configuration
};
```

### Migration Fixtures
```typescript
// src/lib/meta/migration/__tests__/fixtures/migration-fixtures.ts
export const NEW_TABLE_DIFF: SchemaDiff = {
	addedColumns: [
		{ fieldname: 'name', fieldtype: 'Data', required: true },
		{ fieldname: 'email', fieldtype: 'Data', required: false }
	],
	removedColumns: [],
	modifiedColumns: [],
	addedIndexes: [],
	removedIndexes: [],
	renamedColumns: []
};

export const COLUMN_MODIFICATION_DIFF: SchemaDiff = {
	addedColumns: [],
	removedColumns: [],
	modifiedColumns: [
		{
			fieldname: 'email',
			changes: {
				type: { from: 'Data', to: 'Text' },
				length: { from: 255, to: 1000 }
			}
		}
	],
	addedIndexes: [],
	removedIndexes: [],
	renamedColumns: []
};
```

### Form Fixtures
```typescript
// src/lib/meta/form/__tests__/fixtures/form-fixtures.ts
export const BASIC_FORM_SCHEMA: FormSchema = {
	doctype: 'User',
	sections: [
		{
			label: 'Basic Information',
			fieldname: 'basic_info',
			columns: [
				{
					fields: [
						{ fieldname: 'name', fieldtype: 'Data', label: 'Name' },
						{ fieldname: 'email', fieldtype: 'Data', label: 'Email' }
					]
				}
			]
		}
	],
	layout: {
		has_tabs: false,
		quick_entry_fields: ['name', 'email']
	}
};
```

### API Fixtures
```typescript
// src/lib/meta/api/__tests__/fixtures/api-fixtures.ts
export const CRUD_ROUTES: RouteConfig[] = [
	{
		method: 'GET',
		path: '/api/resource/User',
		handler: 'getList',
		validation: {
			query: {
				filters: { type: 'object', optional: true },
				limit: { type: 'number', optional: true },
				offset: { type: 'number', optional: true }
			}
		}
	},
	{
		method: 'POST',
		path: '/api/resource/User',
		handler: 'create',
		validation: {
			body: {
				name: { type: 'string', required: true },
				email: { type: 'string', required: true }
			}
		}
	}
];
```

## Test Implementation Strategy

### 1. DocType Engine Tests (doctype-engine.test.ts)
```typescript
describe('DocTypeEngine', () => {
	describe('Registration', () => {
		// P2-002-T1: registerDocType(doctype) - Stores DocType definition
		// P2-002-T2: registerDocType duplicate - Throws DocTypeExistsError
		// P2-002-T9: validateDocType(doctype) valid - Returns { valid: true, errors: [] }
		// ... more test cases
	});

	describe('Retrieval', () => {
		// P2-002-T3: getDocType('Test') exists - Returns registered DocType
		// P2-002-T4: getDocType('Nonexistent') - Returns null
		// ... more test cases
	});

	describe('Module Management', () => {
		// P2-002-T6: getDocTypesByModule('Core') - Returns DocTypes in module
		// ... more test cases
	});
});
```

### 2. JSON Parser Tests (json-parser.test.ts)
```typescript
describe('DocTypeJSONParser', () => {
	describe('Parsing', () => {
		// P2-003-T1: parseDocTypeJSON(jsonString) valid - Returns DocType object
		// P2-003-T2: Parse with all properties - All properties correctly parsed
		// P2-003-T3: Parse with missing optional fields - Uses defaults
		// ... more test cases
	});

	describe('File Operations', () => {
		// P2-003-T8: loadDocTypeFromFile(path) - Reads and parses file
		// P2-003-T11: loadAllDocTypesFromDir(dir) - Returns all DocTypes
		// ... more test cases
	});
});
```

### 3. Meta Class Tests (meta.test.ts)
```typescript
describe('DocTypeMeta', () => {
	describe('Field Access', () => {
		// P2-004-T2: meta.get_field('fieldname') exists - Returns DocField
		// P2-004-T3: meta.get_field('nonexistent') - Returns null
		// P2-004-T6: meta.get_link_fields() - Returns Link and Dynamic Link fields
		// ... more test cases
	});

	describe('DocType Properties', () => {
		// P2-004-T10: meta.is_submittable() - Returns is_submittable flag
		// P2-004-T11: meta.is_single() - Returns issingle flag
		// ... more test cases
	});
});
```

### 4. Migration Engine Tests (migration-engine.test.ts)
```typescript
describe('MigrationEngine', () => {
	describe('Schema Comparison', () => {
		// P2-006-T1: compareSchema(doctype) new table - Returns diff with all fields
		// P2-006-T2: compareSchema no changes - Returns empty diff
		// P2-006-T3: compareSchema added field - Diff shows field in addedColumns
		// ... more test cases
	});

	describe('Change Detection', () => {
		// P2-006-T13: hasChanges(diff) empty - Returns false
		// P2-006-T14: hasChanges(diff) with changes - Returns true
		// ... more test cases
	});
});
```

### 5. SQL Generator Tests (sql-generator.test.ts)
```typescript
describe('SQLGenerator', () => {
	describe('Table Operations', () => {
		// P2-007-T1: generateCreateTableSQL(doctype) - Valid CREATE TABLE
		// P2-007-T2: generateAddColumnSQL(doctype, field) - Valid ALTER TABLE
		// ... more test cases
	});

	describe('Index Operations', () => {
		// P2-007-T5: generateCreateIndexSQL(doctype, index) - Valid CREATE INDEX
		// P2-007-T6: generateDropIndexSQL(indexName) - Valid DROP INDEX
		// ... more test cases
	});
});
```

### 6. Form Generator Tests (form-generator.test.ts)
```typescript
describe('FormGenerator', () => {
	describe('Form Generation', () => {
		// P2-010-T1: generateForm(doctype) - Returns FormSchema with sections
		// P2-010-T2: Section Break creates section - Fields grouped by Section Break
		// P2-010-T3: Column Break creates columns - Fields in columns within section
		// ... more test cases
	});

	describe('Validation', () => {
		// P2-010-T7: generateValidation(doctype) - Returns validation rules per field
		// P2-010-T8: Required field validation - reqd=true generates required rule
		// ... more test cases
	});
});
```

### 7. Field Mapping Tests (field-mapping.test.ts)
```typescript
describe('FieldMapping', () => {
	describe('Component Mapping', () => {
		// P2-011-T1: Data → TextInput - Correct component and props
		// P2-011-T2: Int → NumberInput - step=1, integer validation
		// P2-011-T3: Float → NumberInput - decimal step, float validation
		// ... more test cases for all 30+ field types
	});

	describe('Props Generation', () => {
		// P2-011-T31: getPropsForField(field) - Returns correct props
		// ... more test cases
	});
});
```

### 8. API Generator Tests (api-generator.test.ts)
```typescript
describe('APIGenerator', () => {
	describe('Route Generation', () => {
		// P2-013-T1: generateRoutes(doctype) - Returns array of RouteConfig
		// P2-013-T2: GET list route generated - GET /api/resource/{doctype}
		// P2-013-T3: POST create route generated - POST /api/resource/{doctype}
		// ... more test cases
	});

	describe('Validation', () => {
		// P2-013-T10: generateValidators(doctype) - Returns validation schema
		// P2-013-T11: Required fields in validators - Body validation includes required
		// ... more test cases
	});
});
```

### 9. OpenAPI Generator Tests (openapi-generator.test.ts)
```typescript
describe('OpenAPIGenerator', () => {
	describe('Specification Generation', () => {
		// P2-018-T1: generateOpenAPISpec(doctypes) - Returns valid OpenAPI 3.0 object
		// P2-018-T2: Info section populated - title, version, description
		// P2-018-T3: All endpoints documented - Paths include all routes
		// ... more test cases
	});

	describe('Schema Generation', () => {
		// P2-018-T4: Request schemas generated - From DocType fields
		// P2-018-T5: Response schemas generated - Include standard fields
		// ... more test cases
	});
});
```

## Integration Tests

### End-to-End Workflow Tests
```typescript
// src/lib/__tests__/integration/metadata-workflow.test.ts
describe('Metadata Workflow Integration', () => {
	it('should complete full DocType lifecycle', async () => {
		// 1. Register DocType
		// 2. Generate form schema
		// 3. Generate API routes
		// 4. Apply migrations
		// 5. Generate OpenAPI spec
		// Verify all components work together
	});

	it('should handle complex form layouts', async () => {
		// Test integration between form generator and field mapping
	});

	it('should generate complete API documentation', async () => {
		// Test integration between API generator and OpenAPI generator
	});
});
```

## Performance Requirements

### Test Execution Time
- **Individual Test Files**: < 5 seconds
- **Full Test Suite**: < 60 seconds (P2-019-T7)
- **Integration Tests**: < 30 seconds

### Test Isolation
- Each test should be independent
- No shared state between tests
- Proper cleanup in afterEach hooks
- Mock external dependencies

## Coverage Requirements

### Thresholds
- **Statement Coverage**: > 80% (P2-019-T2)
- **Branch Coverage**: > 70% (P2-019-T3)
- **Function Coverage**: > 80%
- **Line Coverage**: > 80%

### Coverage Reporting
- Text output in console
- HTML report for detailed analysis
- JSON report for CI/CD integration
- Coverage badges in documentation

## Test Data Management

### Test Databases
- In-memory SQLite for unit tests
- Temporary file-based databases for integration tests
- Automatic cleanup after test execution
- Seed data for consistent test environments

### Mock Data
- Comprehensive fixtures for all DocType types
- Realistic test data that covers edge cases
- Version-controlled test data
- Data generators for dynamic test scenarios

## CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

### Quality Gates
- All tests must pass
- Coverage thresholds must be met
- Performance tests must complete within time limits
- No new test failures in PRs

## Documentation

### Test Documentation
- Test case documentation linked to backlog items
- Coverage reports published with each build
- Test architecture documentation
- Contributing guidelines for new tests

### API Documentation
- Generated from OpenAPI specifications
- Includes example requests and responses
- Documents all error scenarios
- Integration examples

## Implementation Timeline

### Phase 1: Foundation (Week 1)
1. Set up test infrastructure and utilities
2. Create test fixtures and helpers
3. Configure coverage reporting

### Phase 2: Core Component Tests (Week 2)
1. DocType engine tests
2. JSON parser tests
3. Meta class tests

### Phase 3: Migration Tests (Week 3)
1. Migration engine tests
2. SQL generator tests

### Phase 4: Form and API Tests (Week 4)
1. Form generator tests
2. Field mapping tests
3. API generator tests
4. OpenAPI generator tests

### Phase 5: Integration and Cleanup (Week 5)
1. Integration tests
2. Coverage optimization
3. Documentation
4. Performance tuning

## Success Criteria

1. ✅ All test files created as specified in P2-019
2. ✅ > 80% statement coverage achieved
3. ✅ > 70% branch coverage achieved
4. ✅ All tests passing consistently
5. ✅ Integration tests cover end-to-end workflows
6. ✅ Test suite completes in under 60 seconds
7. ✅ Tests are isolated and independent
8. ✅ Comprehensive documentation provided

This architecture provides a robust foundation for testing the SODAF metadata system while ensuring maintainability, performance, and comprehensive coverage.