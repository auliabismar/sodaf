/**
 * CLI Services Tests
 * 
 * This file contains unit tests for CLI services, testing service
 * implementations and their interactions with the system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MigrationService } from '../services/migration-service';
import { SiteService } from '../services/site-service';
import { ConfigService } from '../services/config-service';
import type { ExecutionContext, CLIConfig } from '../types';
import type { SiteInfo } from '../site';
import type { SiteContext } from '../../core/site/types';
import type { Database } from '../../core/database/database';

// Mock dependencies
vi.mock('../../meta/migration/apply');
vi.mock('../../meta/doctype/doctype-engine');
vi.mock('../../meta/migration/history/history-manager');
vi.mock('../site');
vi.mock('../../core/database/sqlite-database');

describe('CLI Services', () => {
	let mockContext: ExecutionContext;
	let mockConfig: CLIConfig;
	let mockSite: SiteContext;
	let mockDatabase: Database;

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Create mock config
		mockConfig = {
			defaultSite: 'test-site',
			verbose: false,
			force: false,
			timeout: 300,
			backup: true,
			outputFormat: 'text',
			colors: true,
			progress: true,
			logLevel: 'info',
			sitesDir: '/test/sites'
		};

		// Create mock site
		mockSite = {
			site_name: 'test-site',
			db_path: '/test/sites/test-site/db.sqlite',
			config: {
				db_name: 'test_site',
				db_type: 'sqlite',
				maintenance_mode: false,
				developer_mode: false,
				max_file_size: 1048576,
				allowed_file_types: ['jpg', 'png', 'pdf'],
				session_expiry: 3600
			},
			files_path: '/test/sites/test-site/files',
			private_files_path: '/test/sites/test-site/private',
			backup_path: '/test/sites/test-site/backups'
		} as SiteContext;

		// Create mock database
		mockDatabase = {
			query: vi.fn(),
			exec: vi.fn(),
			close: vi.fn()
		} as any;

		// Create mock context
		mockContext = {
			config: mockConfig,
			site: mockSite,
			database: mockDatabase,
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
			startTime: new Date()
		};
	});

	describe('MigrationService', () => {
		it('should create migration service instance', () => {
			// Arrange & Act
			const service = new MigrationService();

			// Assert
			expect(service).toBeInstanceOf(MigrationService);
		});

		it('should run migrations successfully', async () => {
			// Arrange
			const mockApplier = {
				syncAllDocTypes: vi.fn().mockResolvedValue({
					success: true,
					sql: ['CREATE TABLE test (...)'],
					warnings: [],
					errors: [],
					executionTime: 150
				})
			};

			const mockMigrationApplier = vi.fn().mockImplementation(() => mockApplier);
			const mockDocTypeEngine = vi.fn();

			// Mock dynamic imports
			const mockImport = vi.fn();
			(vi as any).import = mockImport;
			mockImport.mockImplementation((path: string) => {
				if (path === '../../meta/migration/apply') {
					return Promise.resolve({ MigrationApplier: mockMigrationApplier });
				}
				if (path === '../../meta/doctype/doctype-engine') {
					return Promise.resolve({ DocTypeEngine: mockDocTypeEngine });
				}
				return Promise.resolve({});
			}) as any;

			const service = new MigrationService();
			const options = {
				site: 'test-site',
				force: false,
				backup: true,
				timeout: 300,
				batchSize: 1000,
				continueOnError: false,
				verbose: true
			};

			// Act
			const result = await service.runMigrations(options, mockContext);

			// Assert
			expect(result.success).toBe(true);
			expect(mockApplier.syncAllDocTypes).toHaveBeenCalledWith({
				force: false,
				backup: true,
				timeout: 300,
				continueOnError: false
			});
		});

		it('should handle migration failures', async () => {
			// Arrange
			const mockApplier = {
				syncAllDocTypes: vi.fn().mockRejectedValue(new Error('Migration failed'))
			};

			const mockMigrationApplier = vi.fn().mockImplementation(() => mockApplier);
			const mockDocTypeEngine = vi.fn();

			// Mock dynamic imports
			const mockImport = vi.fn();
			(vi as any).import = mockImport;
			mockImport.mockImplementation((path: string) => {
				if (path === '../../meta/migration/apply') {
					return Promise.resolve({ MigrationApplier: mockMigrationApplier });
				}
				if (path === '../../meta/doctype/doctype-engine') {
					return Promise.resolve({ DocTypeEngine: mockDocTypeEngine });
				}
				return Promise.resolve({});
			}) as any;

			const service = new MigrationService();
			const options = {
				site: 'test-site',
				force: false,
				backup: true,
				timeout: 300,
				batchSize: 1000,
				continueOnError: false,
				verbose: true
			};

			// Act
			const result = await service.runMigrations(options, mockContext);

			// Assert
			expect(result.success).toBe(false);
			expect(result.errors).toContain('Migration failed');
		});

		it('should perform dry run migrations', async () => {
			// Arrange
			const service = new MigrationService();
			const options = {
				site: 'test-site',
				force: false,
				backup: true,
				timeout: 300,
				batchSize: 1000,
				continueOnError: false,
				verbose: true
			};

			const mockRunMigrations = vi.fn().mockResolvedValue({
				success: true,
				sql: ['CREATE TABLE test (...)'],
				warnings: ['This is a dry run'],
				errors: [],
				executionTime: 50
			});

			service.runMigrations = mockRunMigrations;

			// Act
			const result = await service.dryRunMigrations(options, mockContext);

			// Assert
			expect(result.success).toBe(true);
			expect(mockRunMigrations).toHaveBeenCalledWith(
				{ ...options, dryRun: true },
				mockContext
			);
		});

		it('should get migration status', async () => {
			// Arrange
			const mockHistoryManager = {
				getMigrationHistory: vi.fn().mockResolvedValue({
					migrations: [
						{
							id: '001_initial',
							doctype: 'User',
							applied: true,
							timestamp: new Date('2023-01-01'),
							destructive: false
						}
					]
				}),
				getMigrationStats: vi.fn().mockResolvedValue({
					total: 1,
					applied: 1,
					pending: 0,
					failed: 0,
					lastMigrationDate: new Date('2023-01-01')
				})
			};

			const mockMigrationHistoryManager = vi.fn().mockImplementation(() => mockHistoryManager);

			// Mock dynamic imports
			const mockImport = vi.fn();
			(vi as any).import = mockImport;
			mockImport.mockImplementation((path: string) => {
				if (path === '../../meta/migration/history/history-manager') {
					return Promise.resolve({ MigrationHistoryManager: mockMigrationHistoryManager });
				}
				return Promise.resolve({});
			}) as any;

			const service = new MigrationService();

			// Act
			const result = await service.getMigrationStatus('test-site', mockContext);

			// Assert
			expect(result.migrations).toHaveLength(1);
			expect(result.stats.total).toBe(1);
			expect(result.stats.applied).toBe(1);
			expect(mockHistoryManager.getMigrationHistory).toHaveBeenCalled();
			expect(mockHistoryManager.getMigrationStats).toHaveBeenCalled();
		});

		it('should rollback migrations successfully', async () => {
			// Arrange
			const mockHistoryManager = {
				getMigrationHistory: vi.fn().mockResolvedValue({
					migrations: [
						{
							id: '001_initial',
							doctype: 'User',
							applied: true,
							timestamp: new Date('2023-01-01'),
							destructive: false,
							rollbackSql: 'DROP TABLE test'
						}
					]
				}),
				updateMigrationStatus: vi.fn()
			};

			const mockMigrationHistoryManager = vi.fn().mockImplementation(() => mockHistoryManager);

			// Mock dynamic imports
			const mockImport = vi.fn();
			(vi as any).import = mockImport;
			mockImport.mockImplementation((path: string) => {
				if (path === '../../meta/migration/history/history-manager') {
					return Promise.resolve({ MigrationHistoryManager: mockMigrationHistoryManager });
				}
				return Promise.resolve({});
			}) as any;

			const service = new MigrationService();
			const options = {
				site: 'test-site',
				force: true,
				backup: true,
				timeout: 300,
				batchSize: 1000,
				continueOnError: false,
				verbose: true
			};

			// Act
			const result = await service.rollbackMigrations(options, mockContext);

			// Assert
			expect(result.success).toBe(true);
			expect(result.sql).toContain('DROP TABLE test');
			expect(mockHistoryManager.updateMigrationStatus).toHaveBeenCalledWith(
				'001_initial',
				'ROLLED_BACK'
			);
		});

		it('should handle rollback when no migrations to rollback', async () => {
			// Arrange
			const mockHistoryManager = {
				getMigrationHistory: vi.fn().mockResolvedValue({
					migrations: [] // No applied migrations
				})
			};

			const mockMigrationHistoryManager = vi.fn().mockImplementation(() => mockHistoryManager);

			// Mock dynamic imports
			const mockImport = vi.fn();
			(vi as any).import = mockImport;
			mockImport.mockImplementation((path: string) => {
				if (path === '../../meta/migration/history/history-manager') {
					return Promise.resolve({ MigrationHistoryManager: mockMigrationHistoryManager });
				}
				return Promise.resolve({});
			});

			const service = new MigrationService();
			const options = {
				site: 'test-site',
				force: true,
				backup: true,
				timeout: 300,
				batchSize: 1000,
				continueOnError: false,
				verbose: true
			};

			// Act
			const result = await service.rollbackMigrations(options, mockContext);

			// Assert
			expect(result.success).toBe(true);
			expect(result.warnings).toContain('No migrations to rollback');
		});
	});

	describe('SiteService', () => {
		it('should create site service instance', () => {
			// Arrange & Act
			const service = new SiteService();

			// Assert
			expect(service).toBeInstanceOf(SiteService);
		});

		it('should get site info', async () => {
			// Arrange
			const mockSiteManager = {
				getSite: vi.fn().mockResolvedValue({
					name: 'test-site',
					config: {
						db_name: 'test_site',
						db_type: 'sqlite',
						maintenance_mode: false,
						developer_mode: false,
						max_file_size: 1048576,
						allowed_file_types: ['jpg', 'png', 'pdf'],
						session_expiry: 3600
					},
					filePath: '/test/sites/test-site/test-site.json',
					active: true,
					createdAt: new Date('2023-01-01'),
					modifiedAt: new Date('2023-01-01')
				} as SiteInfo),
				createSiteContext: vi.fn().mockResolvedValue(mockSite)
			};

			// Mock dynamic imports
			const mockImport = vi.fn();
			(vi as any).import = mockImport;
			mockImport.mockImplementation((path: string) => {
				if (path === '../site') {
					return Promise.resolve({ SiteManager: vi.fn().mockImplementation(() => mockSiteManager) });
				}
				return Promise.resolve({});
			}) as any;

			const service = new SiteService();

			// Act
			const result = await service.getSite('test-site', mockContext);

			// Assert
			expect(result?.name).toBe('test-site');
			expect(result?.filePath).toBe('/test/sites/test-site/test-site.json');
		});

		it('should validate site', async () => {
			// Arrange
			const validConfig = {
				db_name: 'test_site',
				db_type: 'sqlite',
				maintenance_mode: false,
				developer_mode: false,
				max_file_size: 1048576,
				allowed_file_types: ['jpg', 'png', 'pdf'],
				session_expiry: 3600
			};

			const service = new SiteService();

			// Act
			const result = await service.createSite('test-site', validConfig, mockContext);

			// Assert
			expect(result.name).toBe('test-site');
		});

		it('should reject invalid site config', async () => {
			// Arrange
			const invalidConfig = {
				db_name: 'test_site',
				db_type: 'mysql', // Invalid type
				maintenance_mode: false,
				developer_mode: false,
				max_file_size: 1048576,
				allowed_file_types: ['jpg', 'png', 'pdf'],
				session_expiry: 3600
			};

			const service = new SiteService();

			// Act & Assert
			await expect(service.createSite('test-site', invalidConfig, mockContext))
				.rejects.toThrow('Only sqlite database type is currently supported');
		});
	});

	describe('ConfigService', () => {
		it('should create config service instance', () => {
			// Arrange & Act
			const service = new ConfigService();

			// Assert
			expect(service).toBeInstanceOf(ConfigService);
		});

		it('should get config', async () => {
			// Arrange
			const service = new ConfigService();

			// Act
			const result = service.getConfig(mockContext);

			// Assert
			expect(result.defaultSite).toBe('test-site');
			expect(result.verbose).toBe(false);
		});

		it('should validate config', async () => {
			// Arrange
			const service = new ConfigService();
			const validConfig = { ...mockConfig };

			// Act
			const result = service.validateConfig(validConfig);

			// Assert
			expect(result).toBe(true);
		});

		it('should reject invalid config', async () => {
			// Arrange
			const service = new ConfigService();
			const invalidConfig = { ...mockConfig, timeout: -1 }; // Invalid timeout

			// Act
			const result = service.validateConfig(invalidConfig);

			// Assert
			expect(result).toBe(false);
		});

		it('should reject invalid output format', async () => {
			// Arrange
			const service = new ConfigService();
			const invalidConfig = { ...mockConfig, outputFormat: 'xml' as any }; // Invalid format

			// Act
			const result = service.validateConfig(invalidConfig);

			// Assert
			expect(result).toBe(false);
		});

		it('should reject invalid log level', async () => {
			// Arrange
			const service = new ConfigService();
			const invalidConfig = { ...mockConfig, logLevel: 'trace' as any }; // Invalid level

			// Act
			const result = service.validateConfig(invalidConfig);

			// Assert
			expect(result).toBe(false);
		});
	});

	describe('Service Integration', () => {
		it('should handle service dependencies correctly', async () => {
			// Arrange
			const migrationService = new MigrationService();
			const siteService = new SiteService();
			const configService = new ConfigService();

			// Mock all dynamic imports
			const mockImport = vi.fn();
			(vi as any).import = mockImport;
			mockImport.mockImplementation((path: string) => {
				if (path === '../../meta/migration/apply') {
					return Promise.resolve({
						MigrationApplier: vi.fn().mockImplementation(() => ({
							syncAllDocTypes: vi.fn().mockResolvedValue({
								success: true,
								sql: [],
								warnings: [],
								errors: [],
								executionTime: 0
							})
						}))
					});
				}
				if (path === '../../meta/doctype/doctype-engine') {
					return Promise.resolve({ DocTypeEngine: vi.fn() });
				}
				if (path === '../site') {
					return Promise.resolve({
						SiteManager: vi.fn().mockImplementation(() => ({
							createSiteContext: vi.fn().mockResolvedValue(mockSite)
						}))
					});
				}
				return Promise.resolve({});
			}) as any;

			// Act
			const config = configService.getConfig(mockContext);
			const siteInfo = await siteService.getSite('test-site', mockContext);
			const migrationResult = await migrationService.runMigrations(
				{
					site: 'test-site',
					force: false,
					backup: true,
					timeout: 300,
					batchSize: 1000,
					continueOnError: false,
					verbose: false
				},
				mockContext
			);

			// Assert
			expect(config.defaultSite).toBe('test-site');
			expect(siteInfo?.name).toBe('test-site');
			expect(migrationResult.success).toBe(true);
		});
	});

	describe('Error Handling', () => {
		it('should handle database connection errors', async () => {
			// Arrange
			const service = new MigrationService();
			const options = {
				site: 'test-site',
				force: false,
				backup: true,
				timeout: 300,
				batchSize: 1000,
				continueOnError: false,
				verbose: true
			};

			// Mock dynamic imports to throw error
			const mockImport = vi.fn();
			(vi as any).import = mockImport;
			mockImport.mockImplementation((path: string) => {
				if (path === '../../meta/migration/apply') {
					return Promise.reject(new Error('Database connection failed'));
				}
				return Promise.resolve({});
			}) as any;

			// Act
			const result = await service.runMigrations(options, mockContext);

			// Assert
			expect(result.success).toBe(false);
			expect(result.errors).toContain('Database connection failed');
		});
	});

	describe('Performance', () => {
		it('should complete service operations quickly', async () => {
			// Arrange
			const service = new MigrationService();
			const options = {
				site: 'test-site',
				force: false,
				backup: true,
				timeout: 300,
				batchSize: 1000,
				continueOnError: false,
				verbose: false
			};

			// Mock fast operations
			const mockApplier = {
				syncAllDocTypes: vi.fn().mockResolvedValue({
					success: true,
					sql: [],
					warnings: [],
					errors: [],
					executionTime: 10
				})
			};

			const mockMigrationApplier = vi.fn().mockImplementation(() => mockApplier);
			const mockDocTypeEngine = vi.fn();

			const mockImport = vi.fn();
			(vi as any).import = mockImport;
			mockImport.mockImplementation((path: string) => {
				if (path === '../../meta/migration/apply') {
					return Promise.resolve({ MigrationApplier: mockMigrationApplier });
				}
				if (path === '../../meta/doctype/doctype-engine') {
					return Promise.resolve({ DocTypeEngine: mockDocTypeEngine });
				}
				return Promise.resolve({});
			}) as any;

			// Act
			const startTime = Date.now();
			const result = await service.runMigrations(options, mockContext);
			const endTime = Date.now();

			// Assert
			expect(result.success).toBe(true);
			expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
		});
	});
});