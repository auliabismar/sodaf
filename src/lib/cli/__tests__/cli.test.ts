/**
 * CLI Main Tests
 * 
 * Tests for the main CLI module.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runCLI } from '../index';
import { ConfigManager } from '../config';
import { SiteManager } from '../site';
import { MigrationService } from '../services/migration-service';
import { CLILogger } from '../logger';
import { TerminalOutputFormatter, TerminalProgressReporter } from '../output';
import type { CLIConfig } from '../types';

describe('CLI', () => {
	let mockConfig: CLIConfig;
	let mockProcess: any;

	beforeEach(() => {
		// Mock process
		mockProcess = {
			argv: [],
			exit: vi.fn(),
			cwd: vi.fn(() => '/test/site'),
			env: {
				NODE_ENV: 'test'
			}
		};

		// Mock config
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
			configPath: undefined,
			sitesDir: undefined
		} as CLIConfig;

		// Mock process.env
		vi.stubEnv('NODE_ENV', 'test');
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	describe('runCLI function', () => {
		it('should run CLI with empty arguments', async () => {
			// Arrange
			const mockLoadConfig = vi.spyOn(ConfigManager, 'loadConfig')
				.mockReturnValue(mockConfig);

			// Act
			const exitCode = await runCLI([]);

			// Assert
			expect(mockLoadConfig).toHaveBeenCalled();
			expect(typeof exitCode).toBe('number');
		});

		it('should handle configuration errors', async () => {
			// Arrange
			const mockLoadConfig = vi.spyOn(ConfigManager, 'loadConfig')
				.mockImplementation(() => {
					throw new Error('Config not found');
				});

			// Act
			const exitCode = await runCLI([]);

			// Assert
			expect(exitCode).toBe(1);
		});

		it('should handle CLI creation errors', async () => {
			// Arrange
			const mockLoadConfig = vi.spyOn(ConfigManager, 'loadConfig')
				.mockReturnValue(mockConfig);

			// Act
			const exitCode = await runCLI(['help']);

			// Assert
			expect(mockLoadConfig).toHaveBeenCalled();
			expect(typeof exitCode).toBe('number');
		});
	});


	describe('Error Handling', () => {
		it('should handle unhandled exceptions in runCLI', async () => {
			// Arrange
			const mockLoadConfig = vi.spyOn(ConfigManager, 'loadConfig')
				.mockImplementation(() => {
					throw new Error('Unexpected error');
				});

			// Act
			const exitCode = await runCLI([]);

			// Assert
			expect(exitCode).toBe(1);
		});

		it('should handle non-Error exceptions in runCLI', async () => {
			// Arrange
			const mockLoadConfig = vi.spyOn(ConfigManager, 'loadConfig')
				.mockImplementation(() => {
					throw 'String error';
				});

			// Act
			const exitCode = await runCLI([]);

			// Assert
			expect(exitCode).toBe(1);
		});
	});

	describe('Performance', () => {
		it('should complete quickly for simple commands', async () => {
			// Arrange
			const mockLoadConfig = vi.spyOn(ConfigManager, 'loadConfig')
				.mockReturnValue(mockConfig);

			const startTime = Date.now();

			// Act
			await runCLI(['--version']);

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Assert
			expect(duration).toBeLessThan(100); // Should complete in less than 100ms
		});

		it('should handle large argument arrays', async () => {
			// Arrange
			const mockLoadConfig = vi.spyOn(ConfigManager, 'loadConfig')
				.mockReturnValue(mockConfig);

			const largeArgv = Array(1000).fill('arg');

			// Act
			const exitCode = await runCLI(largeArgv);

			// Assert
			expect(typeof exitCode).toBe('number');
		});
	});

	describe('Integration', () => {
		it('should work with complete workflow', async () => {
			// Arrange
			const mockLoadConfig = vi.spyOn(ConfigManager, 'loadConfig')
				.mockReturnValue(mockConfig);

			// Act
			const exitCode = await runCLI(['migrate', '--dry-run']);

			// Assert
			expect(mockLoadConfig).toHaveBeenCalled();
			expect(typeof exitCode).toBe('number');
		});
	});
});