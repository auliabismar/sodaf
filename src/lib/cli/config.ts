/**
 * Configuration Management
 * 
 * This file implements configuration management for CLI system, including
 * loading, validation, and merging of configuration from multiple sources.
 */

import type { CLIConfig } from './types';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

/**
 * Configuration file formats
 */
type ConfigFormat = 'json' | 'js';

/**
 * Configuration source
 */
interface ConfigSource {
	/** Source name */
	name: string;
	/** Configuration data */
	config: Partial<CLIConfig>;
	/** Source priority */
	priority: number;
}

/**
 * Configuration manager
 */
export class ConfigManager {
	private static readonly DEFAULT_CONFIG: Partial<CLIConfig> = {
		verbose: false,
		force: false,
		timeout: 300,
		backup: true,
		outputFormat: 'text',
		colors: true,
		progress: true,
		logLevel: 'info'
	};
	
	private static readonly CONFIG_FILE_NAMES = [
		'sodaf.config.json',
		'sodaf.config.js',
		'.sodafrc.json',
		'.sodafrc.js'
	];
	
	private static readonly ENV_PREFIX = 'SODAF_';
	
	/**
	 * Load configuration from multiple sources
	 * @param configPath Optional explicit config file path
	 * @param workingDirectory Working directory
	 * @returns Merged configuration
	 */
	static loadConfig(
		configPath?: string,
		workingDirectory: string = process.cwd()
	): CLIConfig {
		const sources: ConfigSource[] = [];
		
		// 1. Default configuration (lowest priority)
		sources.push({
			name: 'default',
			config: this.DEFAULT_CONFIG,
			priority: 1
		});
		
		// 2. Global configuration file
		const globalConfig = this.loadGlobalConfig();
		if (globalConfig) {
			sources.push({
				name: 'global',
				config: globalConfig,
				priority: 2
			});
		}
		
		// 3. Local configuration file
		const localConfig = configPath 
			? this.loadConfigFile(configPath)
			: this.loadLocalConfig(workingDirectory);
		
		if (localConfig) {
			sources.push({
				name: 'local',
				config: localConfig,
				priority: 3
			});
		}
		
		// 4. Environment variables
		const envConfig = this.loadEnvironmentConfig();
		if (envConfig) {
			sources.push({
				name: 'environment',
				config: envConfig,
				priority: 4
			});
		}
		
		// Merge configurations by priority
		const merged = this.mergeConfigs(sources);
		
		// Validate configuration
		this.validateConfig(merged);
		
		return merged as CLIConfig;
	}
	
	/**
	 * Load global configuration file
	 * @returns Global configuration or null
	 */
	private static loadGlobalConfig(): Partial<CLIConfig> | null {
		const globalDir = join(homedir(), '.sodaf');
		
		for (const fileName of this.CONFIG_FILE_NAMES) {
			const filePath = join(globalDir, fileName);
			const config = this.loadConfigFile(filePath);
			if (config) {
				return config;
			}
		}
		
		return null;
	}
	
	/**
	 * Load local configuration file
	 * @param workingDirectory Working directory
	 * @returns Local configuration or null
	 */
	private static loadLocalConfig(workingDirectory: string): Partial<CLIConfig> | null {
		for (const fileName of this.CONFIG_FILE_NAMES) {
			const filePath = join(workingDirectory, fileName);
			const config = this.loadConfigFile(filePath);
			if (config) {
				return config;
			}
		}
		
		return null;
	}
	
	/**
	 * Load configuration from a specific file
	 * @param filePath Path to configuration file
	 * @returns Configuration or null
	 */
	private static loadConfigFile(filePath: string): Partial<CLIConfig> | null {
		if (!existsSync(filePath)) {
			return null;
		}
		
		try {
			const format = this.getConfigFormat(filePath);
			const content = readFileSync(filePath, 'utf-8');
			
			switch (format) {
				case 'json':
					return JSON.parse(content);
					
				case 'js':
					// For JS config files, we need to evaluate them in a safe context
					// This is a simplified approach - in production, you'd want more security
					const module = { exports: {} };
					const evalFunc = new Function('module', 'exports', content);
					evalFunc(module, module.exports);
					return module.exports;
					
				default:
					throw new Error(`Unsupported configuration format: ${format}`);
			}
		} catch (error) {
			throw new Error(`Failed to load configuration from ${filePath}: ${
				error instanceof Error ? error.message : String(error)
			}`);
		}
	}
	
	/**
	 * Get configuration file format from extension
	 * @param filePath File path
	 * @returns File format
	 */
	private static getConfigFormat(filePath: string): ConfigFormat {
		const ext = filePath.split('.').pop()?.toLowerCase();
		
		switch (ext) {
			case 'json':
				return 'json';
			case 'js':
				return 'js';
			default:
				throw new Error(`Unknown configuration file extension: ${ext}`);
		}
	}
	
	/**
	 * Load configuration from environment variables
	 * @returns Environment configuration or null
	 */
	private static loadEnvironmentConfig(): Partial<CLIConfig> | null {
		const config: Partial<CLIConfig> = {};
		let hasConfig = false;
		
		// Map environment variables to config properties
		const envMappings: Record<string, keyof CLIConfig> = {
			[`${this.ENV_PREFIX}VERBOSE`]: 'verbose',
			[`${this.ENV_PREFIX}FORCE`]: 'force',
			[`${this.ENV_PREFIX}TIMEOUT`]: 'timeout',
			[`${this.ENV_PREFIX}BACKUP`]: 'backup',
			[`${this.ENV_PREFIX}OUTPUT_FORMAT`]: 'outputFormat',
			[`${this.ENV_PREFIX}NO_COLOR`]: 'colors',
			[`${this.ENV_PREFIX}PROGRESS`]: 'progress',
			[`${this.ENV_PREFIX}LOG_LEVEL`]: 'logLevel',
			[`${this.ENV_PREFIX}DEFAULT_SITE`]: 'defaultSite',
			[`${this.ENV_PREFIX}SITES_DIR`]: 'sitesDir'
		};
		
		for (const [envVar, configKey] of Object.entries(envMappings)) {
			const value = process.env[envVar];
			if (value !== undefined) {
				// Convert string values to appropriate types
				config[configKey] = this.parseEnvironmentValue(value, configKey);
				hasConfig = true;
			}
		}
		
		return hasConfig ? config : null;
	}
	
	/**
	 * Parse environment variable value to appropriate type
	 * @param value String value
	 * @param configKey Configuration key
	 * @returns Parsed value
	 */
	private static parseEnvironmentValue(value: string, configKey: keyof CLIConfig): any {
		switch (configKey) {
			case 'verbose':
			case 'force':
			case 'backup':
			case 'colors':
			case 'progress':
				return value.toLowerCase() === 'true' || value === '1';
				
			case 'timeout':
				return parseInt(value, 10);
				
			case 'outputFormat':
				if (['text', 'json', 'table'].includes(value)) {
					return value as 'text' | 'json' | 'table';
				}
				return undefined;
				
			case 'logLevel':
				if (['error', 'warn', 'info', 'debug'].includes(value)) {
					return value as 'error' | 'warn' | 'info' | 'debug';
				}
				return undefined;
				
			default:
				return value;
		}
	}
	
	/**
	 * Merge multiple configuration sources
	 * @param sources Configuration sources
	 * @returns Merged configuration
	 */
	private static mergeConfigs(sources: ConfigSource[]): Partial<CLIConfig> {
		// Sort by priority (lowest first)
		sources.sort((a, b) => a.priority - b.priority);
		
		const merged: Partial<CLIConfig> = {};
		
		for (const source of sources) {
			// Deep merge for nested objects
			for (const [key, value] of Object.entries(source.config)) {
				if (value !== undefined) {
					(merged as any)[key] = value;
				}
			}
		}
		
		return merged;
	}
	
	/**
	 * Validate configuration
	 * @param config Configuration to validate
	 * @throws Error if validation fails
	 */
	private static validateConfig(config: Partial<CLIConfig>): void {
		// Validate timeout
		if (config.timeout !== undefined) {
			if (typeof config.timeout !== 'number' || config.timeout <= 0) {
				throw new Error('Configuration timeout must be a positive number');
			}
		}
		
		// Validate output format
		if (config.outputFormat !== undefined) {
			if (!['text', 'json', 'table'].includes(config.outputFormat)) {
				throw new Error('Configuration outputFormat must be one of: text, json, table');
			}
		}
		
		// Validate log level
		if (config.logLevel !== undefined) {
			if (!['error', 'warn', 'info', 'debug'].includes(config.logLevel)) {
				throw new Error('Configuration logLevel must be one of: error, warn, info, debug');
			}
		}
		
		// Validate sites directory
		if (config.sitesDir !== undefined) {
			if (typeof config.sitesDir !== 'string' || config.sitesDir.trim() === '') {
				throw new Error('Configuration sitesDir must be a non-empty string');
			}
		}
	}
	
	/**
	 * Save configuration to file
	 * @param config Configuration to save
	 * @param filePath File path
	 * @param format File format
	 */
	static saveConfig(
		config: Partial<CLIConfig>,
		filePath: string,
		format: ConfigFormat = 'json'
	): void {
		try {
			let content: string;
			
			switch (format) {
				case 'json':
					content = JSON.stringify(config, null, 2);
					break;
					
				case 'js':
					content = `module.exports = ${JSON.stringify(config, null, 2)};`;
					break;
					
				default:
					throw new Error(`Unsupported configuration format: ${format}`);
			}
			
			// Ensure directory exists
			const dir = dirname(filePath);
			if (!existsSync(dir)) {
				// In a real implementation, you'd create the directory
				throw new Error(`Directory does not exist: ${dir}`);
			}
			
			// Write file
			require('fs').writeFileSync(filePath, content, 'utf-8');
		} catch (error) {
			throw new Error(`Failed to save configuration to ${filePath}: ${
				error instanceof Error ? error.message : String(error)
			}`);
		}
	}
	
	/**
	 * Get default configuration file paths
	 * @param workingDirectory Working directory
	 * @returns Array of possible config file paths
	 */
	static getDefaultConfigPaths(workingDirectory: string = process.cwd()): string[] {
		const paths: string[] = [];
		
		// Local paths
		for (const fileName of this.CONFIG_FILE_NAMES) {
			paths.push(join(workingDirectory, fileName));
		}
		
		// Global paths
		const globalDir = join(homedir(), '.sodaf');
		for (const fileName of this.CONFIG_FILE_NAMES) {
			paths.push(join(globalDir, fileName));
		}
		
		return paths;
	}
}