# CLI File Structure Plan

This document outlines the complete file structure for CLI components in SODAF framework, including file responsibilities and organization.

## Complete Directory Structure

```
src/
├── cli/                                    # CLI root directory
│   ├── index.ts                             # Main CLI entry point
│   ├── types.ts                             # CLI-specific types and interfaces
│   ├── constants.ts                          # CLI constants and enums
│   ├── errors.ts                             # CLI-specific error classes
│   ├── commands/                             # Command implementations
│   │   ├── index.ts                         # Command registry and exports
│   │   ├── base-command.ts                   # Base command class
│   │   ├── command-registry.ts               # Command registry implementation
│   │   ├── migrate/                          # Migration commands
│   │   │   ├── index.ts                     # Migrate command exports
│   │   │   ├── migrate.ts                   # Main migrate command
│   │   │   ├── dry-run.ts                   # Dry-run command
│   │   │   ├── status.ts                    # Status command
│   │   │   └── rollback.ts                  # Rollback command
│   │   └── [future-commands]/               # Future command categories
│   ├── services/                             # Business logic services
│   │   ├── index.ts                         # Service exports
│   │   ├── migration-service.ts              # Migration operations service
│   │   ├── site-service.ts                  # Site management service
│   │   ├── config-service.ts                 # Configuration management service
│   │   └── database-service.ts               # Database connection service
│   ├── config/                               # Configuration management
│   │   ├── index.ts                         # Config exports
│   │   ├── cli-config.ts                    # CLI configuration
│   │   ├── site-config.ts                   # Site configuration
│   │   ├── defaults.ts                      # Default values
│   │   └── schema.ts                        # Configuration validation schemas
│   ├── output/                               # Output formatting and display
│   │   ├── index.ts                         # Output exports
│   │   ├── formatter.ts                     # Output formatting
│   │   ├── table-formatter.ts               # Table formatting
│   │   ├── json-formatter.ts                # JSON formatting
│   │   ├── progress.ts                      # Progress reporting
│   │   ├── colors.ts                        # Color utilities
│   │   └── symbols.ts                       # Unicode symbols and icons
│   ├── utils/                                # Utility functions
│   │   ├── index.ts                         # Utility exports
│   │   ├── args-parser.ts                   # Command line argument parsing
│   │   ├── error-handler.ts                 # Error handling utilities
│   │   ├── logger.ts                        # Logging utilities
│   │   ├── file-utils.ts                    # File system utilities
│   │   ├── string-utils.ts                  # String manipulation utilities
│   │   ├── date-utils.ts                    # Date/time utilities
│   │   └── validation.ts                    # Validation utilities
│   └── __tests__/                           # CLI tests
│       ├── commands/                         # Command tests
│       ├── services/                         # Service tests
│       ├── config/                          # Configuration tests
│       ├── output/                          # Output tests
│       ├── utils/                           # Utility tests
│       ├── fixtures/                        # Test fixtures
│       └── integration/                     # Integration tests
├── lib/
│   └── cli/                                 # Shared CLI library code
│       ├── index.ts                         # Library exports
│       ├── adapters/                         # Adapters for external systems
│       │   ├── migration-adapter.ts          # Migration system adapter
│       │   ├── database-adapter.ts           # Database adapter
│       │   └── doctype-adapter.ts           # DocType engine adapter
│       └── middleware/                      # Command middleware
│           ├── auth-middleware.ts             # Authentication middleware
│           ├── logging-middleware.ts         # Logging middleware
│           └── validation-middleware.ts     # Validation middleware
├── sites/                                   # Site configurations (runtime)
│   ├── default/                             # Default site
│   │   ├── site.json                        # Site configuration
│   │   └── database/                       # Database files
│   └── [site-name]/                        # Additional sites
│       ├── site.json                        # Site configuration
│       └── database/                       # Database files
└── config/                                  # Global configuration
    ├── cli.json                             # Global CLI configuration
    └── sites.json                           # Sites registry
```

## File Responsibilities

### Core CLI Files

#### `src/cli/index.ts`
- Main CLI entry point
- Parse command line arguments
- Initialize CLI system
- Route to appropriate command
- Handle global errors
- Set up exit codes

#### `src/cli/types.ts`
- All CLI-specific TypeScript interfaces
- Type definitions for commands, options, context
- Result types and error types
- Service interface definitions

#### `src/cli/constants.ts`
- CLI constants and enums
- Default values
- Error codes
- Exit codes
- Configuration keys

#### `src/cli/errors.ts`
- CLI-specific error classes
- Error categorization
- Error formatting utilities
- Error recovery strategies

### Command System Files

#### `src/cli/commands/base-command.ts`
- Abstract base class for all commands
- Common command functionality
- Option parsing and validation
- Error handling patterns
- Help generation

#### `src/cli/commands/command-registry.ts`
- Command registration and discovery
- Command lookup and routing
- Command metadata management
- Command validation

#### `src/cli/commands/migrate/migrate.ts`
- Main migrate command implementation
- Execute all pending migrations
- Handle migration options
- Report migration results
- Error handling for migrations

#### `src/cli/commands/migrate/status.ts`
- Migration status command
- Display current migration state
- Format status tables
- Filter and sort options
- Site-specific status

#### `src/cli/commands/migrate/rollback.ts`
- Migration rollback command
- Rollback by steps or ID
- Safety checks and confirmations
- Rollback progress reporting
- Error recovery

### Service Layer Files

#### `src/cli/services/migration-service.ts`
- High-level migration operations
- Integration with MigrationApplier
- Site context management
- Migration orchestration
- Result aggregation

#### `src/cli/services/site-service.ts`
- Site management operations
- Site configuration loading
- Site context creation
- Site validation
- Multi-site support

#### `src/cli/services/config-service.ts`
- Configuration management
- Load/save configuration
- Environment variable handling
- Configuration validation
- Default value management

### Configuration Files

#### `src/cli/config/cli-config.ts`
- CLI configuration management
- Default CLI settings
- User preferences
- Environment-specific config
- Configuration migration

#### `src/cli/config/site-config.ts`
- Site configuration management
- Site-specific settings
- Database configuration
- Site validation
- Site creation templates

#### `src/cli/config/schema.ts`
- Configuration validation schemas
- JSON schema definitions
- Validation rules
- Error messages
- Type safety

### Output System Files

#### `src/cli/output/formatter.ts`
- Base output formatting
- Message formatting
- Color and styling
- Output consistency
- Format abstraction

#### `src/cli/output/table-formatter.ts`
- Table formatting and display
- Column alignment
- Border styles
- Header formatting
- Responsive tables

#### `src/cli/output/progress.ts`
- Progress reporting
- Progress bars
- Status updates
- Multi-progress support
- Progress persistence

#### `src/cli/output/colors.ts`
- Color management
- Terminal color support
- Color themes
- Color detection
- Fallback handling

### Utility Files

#### `src/cli/utils/args-parser.ts`
- Command line argument parsing
- Option validation
- Help generation
- Argument transformation
- Error reporting

#### `src/cli/utils/error-handler.ts`
- Error handling utilities
- Error categorization
- Error formatting
- Recovery suggestions
- Exit code management

#### `src/cli/utils/logger.ts`
- Logging utilities
- Log level management
- Output formatting
- File logging
- Structured logging

#### `src/cli/utils/file-utils.ts`
- File system utilities
- Path manipulation
- File operations
- Directory management
- Permission handling

### Test Files

#### `src/cli/__tests__/commands/migrate.test.ts`
- Migrate command tests
- Option parsing tests
- Integration with migration system
- Error handling tests
- Output formatting tests

#### `src/cli/__tests__/services/migration-service.test.ts`
- Migration service tests
- Site context tests
- Integration tests
- Error scenarios
- Performance tests

#### `src/cli/__tests__/integration/end-to-end.test.ts`
- End-to-end CLI tests
- Full workflow tests
- Multi-site tests
- Error recovery tests
- Performance tests

### Configuration Files (Runtime)

#### `sites/default/site.json`
- Default site configuration
- Database settings
- Site-specific options
- Migration settings
- Development defaults

#### `config/cli.json`
- Global CLI configuration
- User preferences
- Default values
- System settings
- Environment overrides

## File Dependencies

### Core Dependencies
```
index.ts
├── types.ts
├── constants.ts
├── errors.ts
├── commands/index.ts
├── services/index.ts
├── config/index.ts
├── output/index.ts
└── utils/index.ts
```

### Command Dependencies
```
commands/migrate/migrate.ts
├── base-command.ts
├── services/migration-service.ts
├── output/formatter.ts
├── output/progress.ts
├── utils/error-handler.ts
└── types.ts
```

### Service Dependencies
```
services/migration-service.ts
├── services/site-service.ts
├── services/config-service.ts
├── output/progress.ts
├── utils/logger.ts
├── lib/cli/adapters/migration-adapter.ts
└── types.ts
```

### Configuration Dependencies
```
config/cli-config.ts
├── config/schema.ts
├── config/defaults.ts
├── utils/file-utils.ts
├── utils/validation.ts
└── types.ts
```

## Implementation Order

### Phase 1: Core Infrastructure
1. `src/cli/types.ts` - Type definitions
2. `src/cli/constants.ts` - Constants and enums
3. `src/cli/errors.ts` - Error classes
4. `src/cli/utils/logger.ts` - Logging utilities
5. `src/cli/utils/args-parser.ts` - Argument parsing
6. `src/cli/commands/base-command.ts` - Base command class
7. `src/cli/commands/command-registry.ts` - Command registry
8. `src/cli/index.ts` - Main entry point

### Phase 2: Configuration System
1. `src/cli/config/schema.ts` - Configuration schemas
2. `src/cli/config/defaults.ts` - Default values
3. `src/cli/utils/file-utils.ts` - File utilities
4. `src/cli/utils/validation.ts` - Validation utilities
5. `src/cli/config/cli-config.ts` - CLI configuration
6. `src/cli/config/site-config.ts` - Site configuration
7. `src/cli/services/config-service.ts` - Configuration service

### Phase 3: Output System
1. `src/cli/output/colors.ts` - Color utilities
2. `src/cli/output/symbols.ts` - Unicode symbols
3. `src/cli/output/formatter.ts` - Base formatting
4. `src/cli/output/table-formatter.ts` - Table formatting
5. `src/cli/output/json-formatter.ts` - JSON formatting
6. `src/cli/output/progress.ts` - Progress reporting
7. `src/cli/utils/error-handler.ts` - Error handling

### Phase 4: Service Layer
1. `src/cli/services/database-service.ts` - Database service
2. `src/cli/services/site-service.ts` - Site service
3. `src/lib/cli/adapters/migration-adapter.ts` - Migration adapter
4. `src/cli/services/migration-service.ts` - Migration service

### Phase 5: Migration Commands
1. `src/cli/commands/migrate/status.ts` - Status command
2. `src/cli/commands/migrate/dry-run.ts` - Dry-run command
3. `src/cli/commands/migrate/rollback.ts` - Rollback command
4. `src/cli/commands/migrate/migrate.ts` - Main migrate command
5. `src/cli/commands/migrate/index.ts` - Migrate command exports

### Phase 6: Testing and Polish
1. Unit tests for all components
2. Integration tests
3. End-to-end tests
4. Performance optimization
5. Documentation and examples

## File Size Guidelines

### Small Files (< 100 lines)
- Constants, enums, simple utilities
- Single-purpose functions
- Type definitions
- Export files

### Medium Files (100-300 lines)
- Individual command implementations
- Service method implementations
- Utility classes
- Configuration schemas

### Large Files (300-500 lines)
- Complex command implementations
- Service classes with multiple methods
- Configuration managers
- Formatters with multiple modes

### Very Large Files (> 500 lines)
- Main entry point with extensive setup
- Complex service orchestrations
- Comprehensive test files
- Integration test suites

## File Naming Conventions

### TypeScript Files
- Use kebab-case for file names
- Use descriptive names that indicate purpose
- Group related files in subdirectories
- Use index.ts for exports

### Test Files
- Mirror source file structure
- Add `.test.ts` suffix
- Place in `__tests__` subdirectory
- Use descriptive test names

### Configuration Files
- Use JSON format for runtime config
- Use `.json` extension
- Place in appropriate config directories
- Use descriptive names

This file structure provides a solid foundation for implementing the CLI system with clear separation of concerns, maintainable code organization, and comprehensive testing coverage.