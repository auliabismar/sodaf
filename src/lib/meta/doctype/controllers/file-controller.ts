/**
 * File Controller - File System Data Source
 * 
 * This module implements the file controller for fetching data from file systems.
 * Supports various file formats including JSON, CSV, XML, and YAML.
 */

import type {
	VirtualDocTypeConfig,
	VirtualQueryOptions,
	VirtualQueryResult,
	VirtualSourceConfig
} from '../virtual-doctype';
import { VirtualController } from '../virtual-controller';
import {
	VirtualControllerError,
	VirtualConnectionError,
	VirtualDataError,
	VirtualParseError
} from '../virtual-errors';
import { readFileSync, watchFile, unwatchFile, existsSync } from 'fs';
import { resolve, extname } from 'path';

// =============================================================================
// File Controller Implementation
// =============================================================================

/**
 * Controller for fetching data from file system
 */
export class FileController extends VirtualController {
	/** File watcher for change detection */
	private fileWatcher?: any;

	/** Last file modification time */
	private lastModified?: Date;

	/** Cached file content */
	private cachedContent?: any;

	/**
	 * Create a new FileController
	 * @param config Virtual DocType configuration
	 */
	constructor(config: VirtualDocTypeConfig) {
		super('file', config);
	}

	// =============================================================================
	// Controller Interface Implementation
	// =============================================================================

	/**
	 * Initialize the file controller
	 */
	public async initialize(): Promise<void> {
		try {
			this.validateBaseConfig(this.config);
			this.validateFileConfig(this.config);

			const fileConfig = this.config.source_config.file;
			if (!fileConfig) {
				throw new Error('File configuration not found');
			}

			// Check if file exists
			if (!this.fileExists(fileConfig.file_path)) {
				throw new Error(`File not found: ${fileConfig.file_path}`);
			}

			// Setup file watcher if enabled
			if (fileConfig.watch_changes) {
				this.setupFileWatcher(fileConfig.file_path);
			}

			// Get initial file modification time
			this.lastModified = this.getFileModificationTime(fileConfig.file_path);

			this.initialized = true;
		} catch (error) {
			throw this.createError(
				`Failed to initialize file controller: ${error}`,
				'initialize',
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Test connection to file
	 */
	public async testConnection(): Promise<boolean> {
		if (!this.initialized) {
			throw this.createError('Controller not initialized', 'testConnection');
		}

		try {
			const fileConfig = this.config.source_config.file;
			if (!fileConfig) {
				throw new Error('File configuration not found');
			}

			return this.fileExists(fileConfig.file_path);
		} catch (error) {
			this.lastError = error instanceof Error ? error : new Error(String(error));
			return false;
		}
	}

	/**
	 * Fetch data from file
	 * @param options Query options
	 */
	public async fetchData(options: VirtualQueryOptions): Promise<VirtualQueryResult> {
		if (!this.initialized) {
			throw this.createError('Controller not initialized', 'fetchData');
		}

		const startTime = Date.now();

		try {
			// Check cache first
			const cachedResult = this.getCachedResult(options);
			if (cachedResult && !options.force_refresh) {
				return {
					...cachedResult,
					cache_hit: true,
					execution_time: Date.now() - startTime
				};
			}

			const fileConfig = this.config.source_config.file;
			if (!fileConfig) {
				throw new Error('File configuration not found');
			}

			// Check if file has been modified
			const currentModified = this.getFileModificationTime(fileConfig.file_path);
			const fileChanged = !this.lastModified ||
				(currentModified && this.lastModified && currentModified > this.lastModified);

			if (fileChanged || options.force_refresh) {
				// Read and parse file
				const rawData = await this.readFile(fileConfig.file_path);
				let data = this.parseFileData(rawData, fileConfig);

				// Apply transformations
				data = this.applyDataTransformations(data);

				// Apply field mapping
				data = this.applyFieldMapping(data);

				// Update cache
				this.cachedContent = data;
				this.lastModified = currentModified;
			}

			// Use cached content
			let data = this.cachedContent || [];

			// Apply filters
			data = this.applyFilters(data, options.filters);

			// Apply sorting
			data = this.applySorting(data, options.sort_by, options.sort_order);

			// Apply pagination
			const paginatedResult = this.applyPagination(data, options.pagination);

			// Cache result
			const result: VirtualQueryResult = {
				data: paginatedResult.data || [],
				...paginatedResult,
				cache_hit: false,
				execution_time: Date.now() - startTime
			};

			this.setCachedResult(options, result);

			// Update metrics
			this.updateMetrics(
				true,
				result.execution_time,
				false,
				JSON.stringify(result.data).length,
				result.data.length
			);

			return result;
		} catch (error) {
			this.updateMetrics(false, Date.now() - startTime);
			throw this.createError(
				`Failed to fetch data from file: ${error}`,
				'fetchData',
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Get schema information from file
	 */
	public async getSchema(): Promise<Record<string, any>> {
		if (!this.initialized) {
			throw this.createError('Controller not initialized', 'getSchema');
		}

		try {
			const fileConfig = this.config.source_config.file;
			if (!fileConfig) {
				throw new Error('File configuration not found');
			}

			// Read a small sample of the file to infer schema
			const rawData = await this.readFile(fileConfig.file_path);
			const data = this.parseFileData(rawData, fileConfig);

			if (!Array.isArray(data) || data.length === 0) {
				throw new Error('No data found to infer schema');
			}

			// Infer schema from first record
			const firstRecord = data[0];
			const properties: Record<string, any> = {};

			for (const [key, value] of Object.entries(firstRecord)) {
				properties[key] = {
					type: this.inferType(value),
					source: 'file',
					file_path: fileConfig.file_path
				};
			}

			return {
				type: 'object',
				properties,
				source: 'file',
				file_path: fileConfig.file_path,
				file_format: this.config.data_format
			};
		} catch (error) {
			throw this.createError(
				`Failed to get schema from file: ${error}`,
				'getSchema',
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Validate file configuration
	 * @param config Configuration to validate
	 */
	public async validateConfig(config: VirtualDocTypeConfig): Promise<boolean> {
		try {
			this.validateBaseConfig(config);
			this.validateFileConfig(config);
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Cleanup resources
	 */
	public async cleanup(): Promise<void> {
		this.clearCache();
		this.cachedContent = undefined;
		this.lastModified = undefined;

		if (this.fileWatcher) {
			this.fileWatcher.close();
			this.fileWatcher = undefined;
		}

		this.initialized = false;
	}

	// =============================================================================
	// Private Helper Methods
	// =============================================================================

	/**
	 * Validate file-specific configuration
	 * @param config Configuration to validate
	 */
	private validateFileConfig(config: VirtualDocTypeConfig): void {
		const fileConfig = config.source_config.file;
		if (!fileConfig) {
			throw new Error('File configuration is required');
		}

		if (!fileConfig.file_path) {
			throw new Error('File path is required');
		}

		// Validate file format
		const supportedFormats = ['json', 'csv', 'xml', 'yaml'];
		if (!supportedFormats.includes(config.data_format)) {
			throw new Error(
				`Unsupported file format: ${config.data_format}. ` +
				`Supported formats: ${supportedFormats.join(', ')}`
			);
		}

		// Validate CSV-specific settings
		if (config.data_format === 'csv') {
			if (fileConfig.delimiter && fileConfig.delimiter.length !== 1) {
				throw new Error('CSV delimiter must be a single character');
			}
		}

		// Validate XML-specific settings
		if (config.data_format === 'xml') {
			if (!fileConfig.root_element) {
				throw new Error('Root element is required for XML files');
			}
			if (!fileConfig.row_element) {
				throw new Error('Row element is required for XML files');
			}
		}
	}

	/**
	 * Check if file exists
	 * @param filePath File path to check
	 * @returns True if file exists
	 */
	private fileExists(filePath: string): boolean {
		try {
			return existsSync(filePath);
		} catch {
			return false;
		}
	}

	/**
	 * Get file modification time
	 * @param filePath File path
	 * @returns Modification time or undefined
	 */
	private getFileModificationTime(filePath: string): Date | undefined {
		try {
			const stats = require('fs').statSync(filePath);
			return stats.mtime;
		} catch {
			return undefined;
		}
	}

	/**
	 * Setup file watcher for change detection
	 * @param filePath File path to watch
	 */
	private setupFileWatcher(filePath: string): void {
		try {
			this.fileWatcher = watchFile(filePath, (curr: any, prev: any) => {
				if (curr.mtime > prev.mtime) {
					// File has changed, invalidate cache
					this.clearCache();
					this.cachedContent = undefined;
				}
			});
		} catch (error) {
			console.warn(`Failed to setup file watcher for ${filePath}:`, error);
		}
	}

	/**
	 * Read file content
	 * @param filePath File path to read
	 * @returns File content as string
	 */
	private async readFile(filePath: string): Promise<string> {
		try {
			const encoding = this.config.source_config.file?.encoding || 'utf8';
			const content = readFileSync(filePath, { encoding: encoding as any });
			return content.toString();
		} catch (error) {
			throw new VirtualDataError(
				`Failed to read file ${filePath}: ${error}`,
				undefined,
				'file',
				{ file_path: filePath },
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Parse file data based on format
	 * @param rawData Raw file content
	 * @param fileConfig File configuration
	 * @returns Parsed data array
	 */
	private parseFileData(rawData: string, fileConfig: any): Record<string, any>[] {
		try {
			switch (this.config.data_format) {
				case 'json':
					return this.parseJSON(rawData);

				case 'csv':
					return this.parseCSV(rawData, fileConfig);

				case 'xml':
					return this.parseXML(rawData, fileConfig);

				case 'yaml':
					return this.parseYAML(rawData);

				default:
					throw new Error(`Unsupported file format: ${this.config.data_format}`);
			}
		} catch (error) {
			throw new VirtualParseError(
				`Failed to parse ${this.config.data_format} file: ${error}`,
				undefined,
				this.config.data_format,
				rawData,
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Parse JSON file content
	 * @param rawData JSON string
	 * @returns Parsed data array
	 */
	private parseJSON(rawData: string): Record<string, any>[] {
		const parsed = JSON.parse(rawData);

		if (Array.isArray(parsed)) {
			return parsed;
		}

		// If not an array, try to find an array property
		for (const key in parsed) {
			if (Array.isArray(parsed[key])) {
				return parsed[key];
			}
		}

		throw new Error('JSON file does not contain an array');
	}

	/**
	 * Parse CSV file content
	 * @param rawData CSV string
	 * @param fileConfig File configuration
	 * @returns Parsed data array
	 */
	private parseCSV(rawData: string, fileConfig: any): Record<string, any>[] {
		const delimiter = fileConfig.delimiter || ',';
		const lines = rawData.split('\n').filter(line => line.trim() !== '');

		if (lines.length === 0) {
			return [];
		}

		// Parse headers
		const headers = lines[0].split(delimiter).map(h => h.trim());

		// Parse data rows
		const data = [];
		for (let i = 1; i < lines.length; i++) {
			const values = lines[i].split(delimiter);
			const record: Record<string, any> = {};

			for (let j = 0; j < headers.length; j++) {
				const value = values[j]?.trim() || '';
				// Try to convert to number if possible
				const numValue = parseFloat(value);
				record[headers[j]] = isNaN(numValue) ? value : numValue;
			}

			data.push(record);
		}

		return data;
	}

	/**
	 * Parse XML file content
	 * @param rawData XML string
	 * @param fileConfig File configuration
	 * @returns Parsed data array
	 */
	private parseXML(rawData: string, fileConfig: any): Record<string, any>[] {
		// This is a placeholder - in production, use a proper XML parser
		// For now, return empty array
		throw new Error('XML parsing not implemented in this version');
	}

	/**
	 * Parse YAML file content
	 * @param rawData YAML string
	 * @returns Parsed data array
	 */
	private parseYAML(rawData: string): Record<string, any>[] {
		// This is a placeholder - in production, use a proper YAML parser
		// For now, return empty array
		throw new Error('YAML parsing not implemented in this version');
	}

	/**
	 * Apply filters to data
	 * @param data Data array
	 * @param filters Filters to apply
	 * @returns Filtered data
	 */
	private applyFilters(
		data: Record<string, any>[],
		filters?: Record<string, any>
	): Record<string, any>[] {
		if (!filters || Object.keys(filters).length === 0) {
			return data;
		}

		return data.filter(record => {
			for (const [field, value] of Object.entries(filters)) {
				const recordValue = record[field];
				
				if (typeof value === 'string' && typeof recordValue === 'string') {
					// Case-insensitive string comparison
					if (recordValue.toLowerCase().indexOf(value.toLowerCase()) === -1) {
						return false;
					}
				} else if (recordValue !== value) {
					return false;
				}
			}
			return true;
		});
	}

	/**
	 * Apply sorting to data
	 * @param data Data array
	 * @param sortBy Field to sort by
	 * @param sortOrder Sort order
	 * @returns Sorted data
	 */
	private applySorting(
		data: Record<string, any>[],
		sortBy?: string,
		sortOrder: 'asc' | 'desc' = 'asc'
	): Record<string, any>[] {
		if (!sortBy) {
			return data;
		}

		return [...data].sort((a, b) => {
			const aVal = a[sortBy];
			const bVal = b[sortBy];

			if (aVal === undefined && bVal === undefined) return 0;
			if (aVal === undefined) return sortOrder === 'asc' ? 1 : -1;
			if (bVal === undefined) return sortOrder === 'asc' ? -1 : 1;

			let comparison = 0;
			if (aVal < bVal) comparison = -1;
			else if (aVal > bVal) comparison = 1;

			return sortOrder === 'desc' ? -comparison : comparison;
		});
	}

	/**
	 * Apply pagination to data
	 * @param data Data array
	 * @param pagination Pagination options
	 * @returns Paginated result
	 */
	private applyPagination(
		data: Record<string, any>[],
		pagination?: { page?: number; limit?: number; offset?: number }
	): Partial<VirtualQueryResult> {
		if (!pagination) {
			return { data, total_count: data.length };
		}

		const { page = 1, limit, offset = 0 } = pagination;
		const total_count = data.length;

		let startIndex = offset;
		if (limit) {
			startIndex = offset;
		} else if (page > 1) {
			startIndex = (page - 1) * (limit || 10);
		}

		let endIndex = startIndex + (limit || data.length);
		endIndex = Math.min(endIndex, data.length);

		const paginatedData = data.slice(startIndex, endIndex);

		const result: Partial<VirtualQueryResult> = {
			data: paginatedData,
			total_count
		};

		if (limit) {
			result.current_page = page;
			result.page_size = limit;
			result.total_pages = Math.ceil(total_count / limit);
			result.has_next = page < result.total_pages;
			result.has_previous = page > 1;
		}

		return result;
	}

	/**
	 * Infer type from value
	 * @param value Value to infer type from
	 * @returns Inferred type string
	 */
	private inferType(value: any): string {
		if (value === null || value === undefined) {
			return 'null';
		}

		if (typeof value === 'boolean') {
			return 'boolean';
		}

		if (typeof value === 'number') {
			return Number.isInteger(value) ? 'integer' : 'number';
		}

		if (typeof value === 'string') {
			// Try to detect date
			const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
			if (dateRegex.test(value)) {
				return 'date';
			}

			// Try to detect datetime
			const datetimeRegex = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/;
			if (datetimeRegex.test(value)) {
				return 'datetime';
			}

			return 'string';
		}

		if (Array.isArray(value)) {
			return 'array';
		}

		if (typeof value === 'object') {
			return 'object';
		}

		return 'unknown';
	}
}