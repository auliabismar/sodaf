/**
 * Configuration Service
 * 
 * This file implements the configuration service that provides
 * configuration-related operations for the CLI system.
 */

import type { CLIConfig, ExecutionContext } from '../types';
import { ConfigManager } from '../config';

/**
 * Configuration service interface
 */
export interface IConfigService {
	/**
	 * Get current configuration
	 * @param context Execution context
	 * @returns Current configuration
	 */
	getConfig(context: ExecutionContext): CLIConfig;
	
	/**
	 * Update configuration
	 * @param config New configuration
	 * @param context Execution context
	 * @returns Promise resolving when configuration is updated
	 */
	updateConfig(config: Partial<CLIConfig>, context: ExecutionContext): Promise<void>;
	
	/**
	 * Reset configuration to defaults
	 * @param context Execution context
	 * @returns Promise resolving when configuration is reset
	 */
	resetConfig(context: ExecutionContext): Promise<void>;
	
	/**
	 * Validate configuration
	 * @param config Configuration to validate
	 * @returns True if configuration is valid
	 */
	validateConfig(config: Partial<CLIConfig>): boolean;
	
	/**
	 * Get configuration file paths
	 * @param context Execution context
	 * @returns Array of configuration file paths
	 */
	getConfigPaths(context: ExecutionContext): string[];
}

/**
 * Configuration service implementation
 */
export class ConfigService implements IConfigService {
	/**
	 * Get current configuration
	 * @param context Execution context
	 * @returns Current configuration
	 */
	getConfig(context: ExecutionContext): CLIConfig {
		return context.config;
	}
	
	/**
	 * Update configuration
	 * @param config New configuration
	 * @param context Execution context
	 * @returns Promise resolving when configuration is updated
	 */
	async updateConfig(config: Partial<CLIConfig>, context: ExecutionContext): Promise<void> {
		// Validate new configuration
		if (!this.validateConfig(config)) {
			throw new Error('Invalid configuration provided');
		}
		
		// Get configuration file path
		const configPath = this.getConfigFilePath(context);
		
		try {
			// Save configuration
			ConfigManager.saveConfig(config, configPath, 'json');
			
			context.logger.info(`Configuration updated: ${configPath}`);
		} catch (error) {
			throw new Error(`Failed to update configuration: ${
				error instanceof Error ? error.message : String(error)
			}`);
		}
	}
	
	/**
	 * Reset configuration to defaults
	 * @param context Execution context
	 * @returns Promise resolving when configuration is reset
	 */
	async resetConfig(context: ExecutionContext): Promise<void> {
		const configPath = this.getConfigFilePath(context);
		
		try {
			// Save default configuration
			const defaultConfig = this.getDefaultConfig();
			ConfigManager.saveConfig(defaultConfig, configPath, 'json');
			
			context.logger.info(`Configuration reset to defaults: ${configPath}`);
		} catch (error) {
			throw new Error(`Failed to reset configuration: ${
				error instanceof Error ? error.message : String(error)
			}`);
		}
	}
	
	/**
	 * Validate configuration
	 * @param config Configuration to validate
	 * @returns True if configuration is valid
	 */
	validateConfig(config: Partial<CLIConfig>): boolean {
		// Validate timeout
		if (config.timeout !== undefined) {
			if (typeof config.timeout !== 'number' || config.timeout <= 0) {
				return false;
			}
		}
		
		// Validate output format
		if (config.outputFormat !== undefined) {
			if (!['text', 'json', 'table'].includes(config.outputFormat)) {
				return false;
			}
		}
		
		// Validate log level
		if (config.logLevel !== undefined) {
			if (!['error', 'warn', 'info', 'debug'].includes(config.logLevel)) {
				return false;
			}
		}
		
		// Validate sites directory
		if (config.sitesDir !== undefined) {
			if (typeof config.sitesDir !== 'string' || config.sitesDir.trim() === '') {
				return false;
			}
		}
		
		return true;
	}
	
	/**
	 * Get configuration file paths
	 * @param context Execution context
	 * @returns Array of configuration file paths
	 */
	getConfigPaths(context: ExecutionContext): string[] {
		return ConfigManager.getDefaultConfigPaths(context.workingDirectory);
	}
	
	/**
	 * Get configuration file path
	 * @param context Execution context
	 * @returns Configuration file path
	 */
	private getConfigFilePath(context: ExecutionContext): string {
		return context.config.configPath || this.getDefaultConfigPath(context);
	}
	
	/**
	 * Get default configuration file path
	 * @param context Execution context
	 * @returns Default configuration file path
	 */
	private getDefaultConfigPath(context: ExecutionContext): string {
		const paths = this.getConfigPaths(context);
		
		// Check for existing config files in order of preference
		for (const path of paths) {
			if (require('fs').existsSync(path)) {
				return path;
			}
		}
		
		// Return default path
		return paths[0];
	}
	
	/**
	 * Get default configuration
	 * @returns Default configuration
	 */
	private getDefaultConfig(): Partial<CLIConfig> {
		return {
			verbose: false,
			force: false,
			timeout: 300,
			backup: true,
			outputFormat: 'text',
			colors: true,
			progress: true,
			logLevel: 'info'
		};
	}
	
	/**
	 * Show current configuration
	 * @param context Execution context
	 */
	showConfig(context: ExecutionContext): void {
		const config = this.getConfig(context);
		
		context.output.info('Current Configuration:');
		context.output.info('');
		
		// Display configuration in requested format
		if (config.outputFormat === 'json') {
			context.output.info(JSON.stringify(config, null, 2));
		} else {
			// Text format
			context.output.info(`  Verbose: ${config.verbose}`);
			context.output.info(`  Force: ${config.force}`);
			context.output.info(`  Timeout: ${config.timeout}s`);
			context.output.info(`  Backup: ${config.backup}`);
			context.output.info(`  Output Format: ${config.outputFormat}`);
			context.output.info(`  Colors: ${config.colors}`);
			context.output.info(`  Progress: ${config.progress}`);
			context.output.info(`  Log Level: ${config.logLevel}`);
			context.output.info(`  Config Path: ${config.configPath || 'default'}`);
			context.output.info(`  Sites Dir: ${config.sitesDir || 'default'}`);
		}
	}
}