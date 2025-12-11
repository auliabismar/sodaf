/**
 * CLI Commands Tests
 * 
 * This file contains unit tests for CLI commands, testing command parsing,
 * option handling, and execution flow.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MigrationService } from '../services/migration-service';
import { TerminalOutputFormatter } from '../output';
import { CLILogger } from '../logger';
import { MigrateCommand } from '../commands/migrate';
import { MigrateDryRunCommand } from '../commands/migrate-dry-run';
import { MigrateStatusCommand } from '../commands/migrate-status';
import { MigrateRollbackCommand } from '../commands/migrate-rollback';
import type { CommandArgs, ExecutionContext } from '../types';
import { ExitCode } from '../types';

// Mock services
vi.mock('../services/migration-service');
vi.mock('../output');
vi.mock('../logger');

describe('CLI Commands', () => {
	let mockContext: ExecutionContext;
	let mockArgs: CommandArgs;

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Create mock context
		mockContext = {
			config: {
				defaultSite: 'test-site',
				verbose: false,
				force: false,
				timeout: 300,
				backup: true,
				outputFormat: 'text',
				colors: true,
				progress: true,
				logLevel: 'info'
			},
			output: {
				format: vi.fn(),
				error: vi.fn(),
				warn: vi.fn(),
				success: vi.fn(),
				info: vi.fn(),
				table: vi.fn(),
				json: vi.fn(),
				migrationResult: vi.fn(),
				migrationHistory: vi.fn()
			} as any,
			progress: {
				start: vi.fn(),
				spinner: vi.fn(),
				warning: vi.fn(),
				error: vi.fn()
			} as any,
			errorHandler: {
				handle: vi.fn(),
				categorize: vi.fn(),
				format: vi.fn()
			} as any,
			logger: {
				error: vi.fn(),
				warn: vi.fn(),
				info: vi.fn(),
				debug: vi.fn()
			} as any,
			workingDirectory: '/test',
			env: {},
			startTime: new Date(),
			site: {} as any
		};

		// Create mock args
		mockArgs = {
			command: 'migrate',
			positionals: [],
			options: {},
			raw: [],
			getOption: vi.fn() as any,
			hasOption: vi.fn() as any,
			hasFlag: vi.fn() as any,
			getOptions: vi.fn() as any
		};
	});

	describe('MigrateCommand', () => {
		it('should have correct command metadata', () => {
			// Arrange
			const command = new MigrateCommand();

			// Assert
			expect(command.name).toBe('migrate');
			expect(command.description).toBe('Run pending migrations');
			expect(command.usage).toBe('sodaf migrate [options]');
			expect(command.options).toHaveLength(7);
			expect(command.requiresSite).toBe(true);
		});

		it('should have correct examples', () => {
			// Arrange
			const command = new MigrateCommand();

			// Assert
			expect(command.examples).toContain('sodaf migrate');
			expect(command.examples).toContain('sodaf migrate --site=mysite');
			expect(command.examples).toContain('sodaf migrate --force');
			expect(command.examples).toContain('sodaf migrate --verbose');
		});

		it('should run migrations successfully', async () => {
			// Arrange
			const mockResult = {
				success: true,
				sql: ['CREATE TABLE test (...)'],
				warnings: [],
				errors: [],
				executionTime: 150
			};

			const mockRunMigrations = vi.fn().mockResolvedValue(mockResult);
			MigrationService.prototype.runMigrations = mockRunMigrations;

			(mockArgs.getOption as any).mockImplementation((name: string) => {
				switch (name) {
					case 'site': return undefined;
					case 'backup': return true;
					case 'timeout': return 300;
					case 'batch-size': return 1000;
					default: return undefined;
				}
			});

			(mockArgs.hasFlag as any).mockImplementation((name: string) => {
				return name === 'verbose';
			});

			const command = new MigrateCommand();

			// Act
			const result = await command.execute(mockArgs, mockContext);

			// Assert
			expect(result).toBe(ExitCode.SUCCESS);
			expect(mockRunMigrations).toHaveBeenCalledWith(
				{
					site: undefined,
					force: false,
					backup: true,
					timeout: 300,
					batchSize: 1000,
					continueOnError: false,
					verbose: true
				},
				mockContext
			);
			expect(mockContext.output.migrationResult).toHaveBeenCalledWith(mockResult);
		});

		it('should handle migration failures', async () => {
			// Arrange
			const mockRunMigrations = vi.fn().mockRejectedValue(new Error('Migration failed'));
			MigrationService.prototype.runMigrations = mockRunMigrations;

			(mockArgs.getOption as any).mockImplementation((name: string) => {
				switch (name) {
					case 'site': return undefined;
					case 'backup': return true;
					case 'timeout': return 300;
					case 'batch-size': return 1000;
					default: return undefined;
				}
			});

			(mockArgs.hasFlag as any).mockImplementation((name: string) => {
				return name === 'verbose';
			});

			const command = new MigrateCommand();

			// Act
			const result = await command.execute(mockArgs, mockContext);

			// Assert
			expect(result).toBe(ExitCode.MIGRATION_ERROR);
			expect(mockContext.output.error).toHaveBeenCalledWith(
				expect.stringContaining('Migration failed')
			);
		});
	});

	describe('MigrateDryRunCommand', () => {
		it('should perform dry run successfully', async () => {
			// Arrange
			const mockResult = {
				success: true,
				sql: ['CREATE TABLE test (...)'],
				warnings: ['This is a dry run'],
				errors: [],
				executionTime: 50
			};

			const mockDryRunMigrations = vi.fn().mockResolvedValue(mockResult);
			MigrationService.prototype.dryRunMigrations = mockDryRunMigrations;

			(mockArgs.getOption as any).mockImplementation((name: string) => {
				switch (name) {
					case 'site': return undefined;
					case 'backup': return true;
					case 'timeout': return 300;
					case 'batch-size': return 1000;
					default: return undefined;
				}
			});

			(mockArgs.hasFlag as any).mockImplementation((name: string) => {
				return name === 'verbose';
			});

			const command = new MigrateDryRunCommand();

			// Act
			const result = await command.execute(mockArgs, mockContext);

			// Assert
			expect(result).toBe(ExitCode.SUCCESS);
			expect(mockDryRunMigrations).toHaveBeenCalledWith(
				{
					site: undefined,
					dryRun: true,
					timeout: 300,
					batchSize: 1000,
					continueOnError: false,
					verbose: true
				},
				mockContext
			);
			expect(mockContext.output.migrationResult).toHaveBeenCalledWith(mockResult);
		});
	});

	describe('MigrateStatusCommand', () => {
		it('should show migration status', async () => {
			// Arrange
			const mockHistory = {
				migrations: [
					{
						id: '001_initial',
						doctype: 'User',
						applied: true,
						timestamp: new Date('2023-01-01'),
						destructive: false
					}
				],
				stats: {
					total: 1,
					applied: 1,
					pending: 0,
					failed: 0,
					lastMigrationDate: new Date('2023-01-01')
				}
			};

			const mockGetMigrationStatus = vi.fn().mockResolvedValue(mockHistory);
			MigrationService.prototype.getMigrationStatus = mockGetMigrationStatus;

			(mockArgs.getOption as any).mockReturnValue(undefined);

			const command = new MigrateStatusCommand();

			// Act
			const result = await command.execute(mockArgs, mockContext);

			// Assert
			expect(result).toBe(ExitCode.SUCCESS);
			expect(mockGetMigrationStatus).toHaveBeenCalledWith('default', mockContext);
			expect(mockContext.output.info).toHaveBeenCalledWith(expect.stringContaining('Migration Status'));
		});
	});

	describe('MigrateRollbackCommand', () => {
		it('should rollback migrations successfully', async () => {
			// Arrange
			const mockResult = {
				success: true,
				sql: ['DROP TABLE test'],
				warnings: [],
				errors: [],
				executionTime: 100
			};

			const mockRollbackMigrations = vi.fn().mockResolvedValue(mockResult);
			MigrationService.prototype.rollbackMigrations = mockRollbackMigrations;

			(mockArgs.getOption as any).mockImplementation((name: string) => {
				switch (name) {
					case 'site': return undefined;
					case 'backup': return true;
					case 'timeout': return 300;
					case 'batch-size': return 1000;
					default: return undefined;
				}
			});

			(mockArgs.hasFlag as any).mockImplementation((name: string) => {
				return name === 'verbose';
			});

			const command = new MigrateRollbackCommand();

			// Act
			const result = await command.execute(mockArgs, mockContext);

			// Assert
			expect(result).toBe(ExitCode.SUCCESS);
			expect(mockRollbackMigrations).toHaveBeenCalledWith(
				{
					site: undefined,
					steps: undefined,
					id: undefined,
					force: false,
					backup: true,
					timeout: 300,
					verbose: true
				},
				mockContext
			);
			expect(mockContext.output.migrationResult).toHaveBeenCalledWith(mockResult);
		});

		it('should handle rollback failures', async () => {
			// Arrange
			const mockRollbackMigrations = vi.fn().mockRejectedValue(new Error('Rollback failed'));
			MigrationService.prototype.rollbackMigrations = mockRollbackMigrations;

			(mockArgs.getOption as any).mockImplementation((name: string) => {
				switch (name) {
					case 'site': return undefined;
					case 'backup': return true;
					case 'timeout': return 300;
					case 'batch-size': return 1000;
					default: return undefined;
				}
			});

			(mockArgs.hasFlag as any).mockImplementation((name: string) => {
				return name === 'verbose';
			});

			const command = new MigrateRollbackCommand();

			// Act
			const result = await command.execute(mockArgs, mockContext);

			// Assert
			expect(result).toBe(ExitCode.MIGRATION_ERROR);
			expect(mockContext.output.error).toHaveBeenCalledWith(
				expect.stringContaining('Rollback failed')
			);
		});
	});

	describe('Command Options', () => {
		it('should parse site option correctly', async () => {
			// Arrange
			const mockResult = {
				success: true,
				sql: [],
				warnings: [],
				errors: [],
				executionTime: 0
			};

			const mockRunMigrations = vi.fn().mockResolvedValue(mockResult);
			MigrationService.prototype.runMigrations = mockRunMigrations;

			(mockArgs.getOption as any).mockImplementation((name: string) => {
				switch (name) {
					case 'site': return 'custom-site';
					case 'backup': return true;
					case 'timeout': return 300;
					case 'batch-size': return 1000;
					default: return undefined;
				}
			});

			(mockArgs.hasFlag as any).mockReturnValue(false);

			const command = new MigrateCommand();

			// Act
			await command.execute(mockArgs, mockContext);

			// Assert
			expect(mockRunMigrations).toHaveBeenCalledWith(
				expect.objectContaining({
					site: 'custom-site'
				}),
				mockContext
			);
		});

		it('should parse force option correctly', async () => {
			// Arrange
			const mockResult = {
				success: true,
				sql: [],
				warnings: [],
				errors: [],
				executionTime: 0
			};

			const mockRunMigrations = vi.fn().mockResolvedValue(mockResult);
			MigrationService.prototype.runMigrations = mockRunMigrations;

			(mockArgs.getOption as any).mockImplementation((name: string) => {
				switch (name) {
					case 'site': return undefined;
					case 'backup': return true;
					case 'timeout': return 300;
					case 'batch-size': return 1000;
					default: return undefined;
				}
			});

			(mockArgs.hasFlag as any).mockImplementation((name: string) => {
				return name === 'force';
			});

			const command = new MigrateCommand();

			// Act
			await command.execute(mockArgs, mockContext);

			// Assert
			expect(mockRunMigrations).toHaveBeenCalledWith(
				expect.objectContaining({
					force: true
				}),
				mockContext
			);
		});

		it('should parse multiple options correctly', async () => {
			// Arrange
			const mockResult = {
				success: true,
				sql: [],
				warnings: [],
				errors: [],
				executionTime: 0
			};

			const mockRunMigrations = vi.fn().mockResolvedValue(mockResult);
			MigrationService.prototype.runMigrations = mockRunMigrations;

			(mockArgs.getOption as any).mockImplementation((name: string) => {
				switch (name) {
					case 'site': return undefined;
					case 'backup': return true;
					case 'timeout': return 300;
					case 'batch-size': return 1000;
					default: return undefined;
				}
			});

			(mockArgs.hasFlag as any).mockImplementation((name: string) => {
				return name === 'verbose' || name === 'force';
			});

			const command = new MigrateCommand();

			// Act
			await command.execute(mockArgs, mockContext);

			// Assert
			expect(mockRunMigrations).toHaveBeenCalledWith(
				expect.objectContaining({
					verbose: true,
					force: true
				}),
				mockContext
			);
		});
	});

	describe('Error Handling', () => {
		it('should handle service unavailable error', async () => {
			// Arrange
			const mockRunMigrations = vi.fn().mockRejectedValue(new Error('Service unavailable'));
			MigrationService.prototype.runMigrations = mockRunMigrations;

			(mockArgs.getOption as any).mockImplementation((name: string) => {
				switch (name) {
					case 'site': return undefined;
					case 'backup': return true;
					case 'timeout': return 300;
					case 'batch-size': return 1000;
					default: return undefined;
				}
			});

			(mockArgs.hasFlag as any).mockReturnValue(false);

			const command = new MigrateCommand();

			// Act
			const result = await command.execute(mockArgs, mockContext);

			// Assert
			expect(result).toBe(ExitCode.MIGRATION_ERROR);
			expect(mockContext.output.error).toHaveBeenCalledWith(
				expect.stringContaining('Migration failed')
			);
		});

		it('should handle database locked error', async () => {
			// Arrange
			const mockRunMigrations = vi.fn().mockRejectedValue(new Error('Database locked'));
			MigrationService.prototype.runMigrations = mockRunMigrations;

			(mockArgs.getOption as any).mockImplementation((name: string) => {
				switch (name) {
					case 'site': return undefined;
					case 'backup': return true;
					case 'timeout': return 300;
					case 'batch-size': return 1000;
					default: return undefined;
				}
			});

			(mockArgs.hasFlag as any).mockReturnValue(false);

			const command = new MigrateCommand();

			// Act
			const result = await command.execute(mockArgs, mockContext);

			// Assert
			expect(result).toBe(ExitCode.MIGRATION_ERROR);
			expect(mockContext.output.error).toHaveBeenCalledWith(
				expect.stringContaining('Migration failed')
			);
		});
	});
});