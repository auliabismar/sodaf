/**
 * Computed Controller - Computed Data Source
 * 
 * This module implements the computed controller for generating data from other DocTypes.
 * Supports aggregations, joins, and custom computation functions.
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
	VirtualDataError,
	VirtualValidationError
} from '../virtual-errors';
import type { DocType } from '../../doctype/types';

// =============================================================================
// Computed Controller Implementation
// =============================================================================

/**
 * Controller for generating computed data from other DocTypes
 */
export class ComputedController extends VirtualController {
	/** DocType engine for accessing source DocTypes */
	private docTypeEngine?: any;

	/** Computed function cache */
	private functionCache: Map<string, Function> = new Map();

	/**
	 * Create a new ComputedController
	 * @param config Virtual DocType configuration
	 * @param docTypeEngine DocType engine instance
	 */
	constructor(config: VirtualDocTypeConfig, docTypeEngine?: any) {
		super('computed', config);
		this.docTypeEngine = docTypeEngine;
	}

	// =============================================================================
	// Controller Interface Implementation
	// =============================================================================

	/**
	 * Initialize the computed controller
	 */
	public async initialize(): Promise<void> {
		try {
			this.validateBaseConfig(this.config);
			this.validateComputedConfig(this.config);

			// Pre-compile computation function
			if (this.config.source_config.computed?.computation_function) {
				this.compileFunction(
					'computation',
					this.config.source_config.computed.computation_function
				);
			}

			// Pre-compile merge function for hybrid sources
			if (this.config.source_config.hybrid?.merge_function) {
				this.compileFunction(
					'merge',
					this.config.source_config.hybrid.merge_function
				);
			}

			this.initialized = true;
		} catch (error) {
			throw this.createError(
				`Failed to initialize computed controller: ${error}`,
				'initialize',
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Test connection to source DocTypes
	 */
	public async testConnection(): Promise<boolean> {
		if (!this.initialized) {
			throw this.createError('Controller not initialized', 'testConnection');
		}

		try {
			const computedConfig = this.config.source_config.computed;
			if (!computedConfig) {
				throw new Error('Computed configuration not found');
			}

			// Test connection to all source DocTypes
			for (const doctypeName of computedConfig.source_doctypes) {
				if (!this.docTypeEngine) {
					throw new Error('DocType engine not available');
				}

				const doctype = await this.docTypeEngine.getDocType(doctypeName);
				if (!doctype) {
					throw new Error(`Source DocType '${doctypeName}' not found`);
				}
			}

			return true;
		} catch (error) {
			this.lastError = error instanceof Error ? error : new Error(String(error));
			return false;
		}
	}

	/**
	 * Fetch computed data
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

			let data: Record<string, any>[] = [];

			// Determine source type and fetch data accordingly
			if (this.config.source_config.computed) {
				data = await this.fetchComputedData(options);
			} else if (this.config.source_config.hybrid) {
				data = await this.fetchHybridData(options);
			} else {
				throw new Error('Neither computed nor hybrid configuration found');
			}

			// Apply transformations
			data = this.applyDataTransformations(data);

			// Apply field mapping
			data = this.applyFieldMapping(data);

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
				`Failed to fetch computed data: ${error}`,
				'fetchData',
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Get schema information from computed configuration
	 */
	public async getSchema(): Promise<Record<string, any>> {
		if (!this.initialized) {
			throw this.createError('Controller not initialized', 'getSchema');
		}

		try {
			const properties: Record<string, any> = {};

			// Infer schema from field mapping if available
			if (this.config.field_mapping?.field_map) {
				for (const [sourceField, targetField] of Object.entries(
					this.config.field_mapping.field_map
				)) {
					properties[targetField] = {
						type: 'string',
						source: sourceField,
						computed: true
					};
				}
			}

			// Add aggregation fields if configured
			const computedConfig = this.config.source_config.computed;
			if (computedConfig?.aggregation) {
				for (const [field, aggregation] of Object.entries(
					computedConfig.aggregation.aggregations
				)) {
					properties[field] = {
						type: this.getAggregationType(aggregation as any),
						source: 'aggregation',
						aggregation
					};
				}
			}

			return {
				type: 'object',
				properties,
				source: 'computed',
				computed: true
			};
		} catch (error) {
			throw this.createError(
				`Failed to get schema from computed config: ${error}`,
				'getSchema',
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Validate computed configuration
	 * @param config Configuration to validate
	 */
	public async validateConfig(config: VirtualDocTypeConfig): Promise<boolean> {
		try {
			this.validateBaseConfig(config);
			this.validateComputedConfig(config);
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
		this.functionCache.clear();
		this.initialized = false;
	}

	// =============================================================================
	// Private Helper Methods
	// =============================================================================

	/**
	 * Validate computed-specific configuration
	 * @param config Configuration to validate
	 */
	private validateComputedConfig(config: VirtualDocTypeConfig): void {
		const computedConfig = config.source_config.computed;
		const hybridConfig = config.source_config.hybrid;

		if (!computedConfig && !hybridConfig) {
			throw new Error('Either computed or hybrid configuration is required');
		}

		if (computedConfig) {
			if (!computedConfig.source_doctypes || computedConfig.source_doctypes.length === 0) {
				throw new Error('Source DocTypes are required for computed configuration');
			}

			if (!computedConfig.computation_function) {
				throw new Error('Computation function is required');
			}

			// Validate aggregation configuration
			if (computedConfig.aggregation) {
				if (!computedConfig.aggregation.group_by ||
					computedConfig.aggregation.group_by.length === 0) {
					throw new Error('Group by fields are required for aggregation');
				}

				if (!computedConfig.aggregation.aggregations ||
					Object.keys(computedConfig.aggregation.aggregations).length === 0) {
					throw new Error('Aggregation fields are required for aggregation');
				}
			}

			// Validate join configuration
			if (computedConfig.joins) {
				for (const join of computedConfig.joins) {
					if (!join.source_doctype || !join.local_field || !join.foreign_field) {
						throw new Error('Invalid join configuration');
					}
				}
			}
		}

		if (hybridConfig) {
			if (!hybridConfig.sources || hybridConfig.sources.length === 0) {
				throw new Error('Sources are required for hybrid configuration');
			}

			if (!hybridConfig.merge_strategy) {
				throw new Error('Merge strategy is required for hybrid configuration');
			}
		}
	}

	/**
	 * Fetch data from computed sources
	 * @param options Query options
	 * @returns Computed data
	 */
	private async fetchComputedData(
		options: VirtualQueryOptions
	): Promise<Record<string, any>[]> {
		const computedConfig = this.config.source_config.computed;
		if (!computedConfig) {
			throw new Error('Computed configuration not found');
		}

		// Fetch data from source DocTypes
		const sourceData: Record<string, Record<string, any>[]> = {};
		for (const doctypeName of computedConfig.source_doctypes) {
			sourceData[doctypeName] = await this.fetchDocTypeData(doctypeName, options);
		}

		// Apply joins if configured
		if (computedConfig.joins) {
			return this.applyJoins(sourceData, computedConfig.joins, options);
		}

		// Apply aggregation if configured
		if (computedConfig.aggregation) {
			return this.applyAggregation(
				Object.values(sourceData).flat(),
				computedConfig.aggregation
			);
		}

		// Apply custom computation function
		if (computedConfig.computation_function) {
			return this.applyComputation(sourceData, 'computation');
		}

		// Default: combine all data
		return Object.values(sourceData).flat();
	}

	/**
	 * Fetch data from hybrid sources
	 * @param options Query options
	 * @returns Hybrid data
	 */
	private async fetchHybridData(
		options: VirtualQueryOptions
	): Promise<Record<string, any>[]> {
		const hybridConfig = this.config.source_config.hybrid;
		if (!hybridConfig) {
			throw new Error('Hybrid configuration not found');
		}

		const sourceResults: Array<{ name: string; data: Record<string, any>[] }> = [];

		// Fetch data from each source
		for (const source of hybridConfig.sources) {
			try {
				let data: Record<string, any>[] = [];

				// This would need to be implemented based on source type
				// For now, we'll assume the source data is available
				// In a real implementation, this would delegate to appropriate controllers

				sourceResults.push({ name: source.name, data });
			} catch (error) {
				console.warn(`Failed to fetch from source '${source.name}':`, error);
			}
		}

		// Apply merge strategy
		return this.applyMergeStrategy(sourceResults, hybridConfig.merge_strategy);
	}

	/**
	 * Fetch data from a specific DocType
	 * @param doctypeName DocType name
	 * @param options Query options
	 * @returns DocType data
	 */
	private async fetchDocTypeData(
		doctypeName: string,
		options: VirtualQueryOptions
	): Promise<Record<string, any>[]> {
		if (!this.docTypeEngine) {
			throw new Error('DocType engine not available');
		}

		// This is a simplified implementation
		// In a real implementation, this would use the DocType engine to fetch data
		// For now, return empty array
		return [];
	}

	/**
	 * Apply joins to source data
	 * @param sourceData Source data by DocType name
	 * @param joins Join configurations
	 * @param options Query options
	 * @returns Joined data
	 */
	private applyJoins(
		sourceData: Record<string, Record<string, any>[]>,
		joins: any[],
		options: VirtualQueryOptions
	): Record<string, any>[] {
		// Start with primary data (first source)
		const primaryDoctype = Object.keys(sourceData)[0];
		let result = [...sourceData[primaryDoctype]];

		// Apply each join
		for (const join of joins) {
			const foreignData = sourceData[join.source_doctype];
			if (!foreignData) continue;

			result = result.map(record => {
				const foreignRecords = foreignData.filter(foreign =>
					foreign[join.foreign_field] === record[join.local_field]
				);

				if (foreignRecords.length > 0) {
					// Simple join - take first match
					// In production, this should support different join types
					return { ...record, ...foreignRecords[0] };
				}

				return record;
			});
		}

		return result;
	}

	/**
	 * Apply aggregation to data
	 * @param data Data to aggregate
	 * @param aggregationConfig Aggregation configuration
	 * @returns Aggregated data
	 */
	private applyAggregation(
		data: Record<string, any>[],
		aggregationConfig: any
	): Record<string, any>[] {
		const { group_by, aggregations } = aggregationConfig;

		// Group data
		const groups: Record<string, Record<string, any>[]> = {};
		for (const record of data) {
			const key = group_by.map((field: string) => record[field]).join('|');
			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(record);
		}

		// Apply aggregations to each group
		const result: Record<string, any>[] = [];
		for (const [groupKey, groupData] of Object.entries(groups)) {
			const groupRecord: Record<string, any> = {};

			// Add group by fields
			const groupFields = groupKey.split('|');
			group_by.forEach((field: string, index: number) => {
				groupRecord[field] = groupFields[index];
			});

			// Apply aggregations
			for (const [field, aggregation] of Object.entries(aggregations)) {
				switch (aggregation) {
					case 'sum':
						groupRecord[field] = groupData.reduce(
							(sum, record) => sum + (record[field] || 0), 0
						);
						break;

					case 'avg':
						const sum = groupData.reduce(
							(sum, record) => sum + (record[field] || 0), 0
						);
						groupRecord[field] = sum / groupData.length;
						break;

					case 'count':
						groupRecord[field] = groupData.length;
						break;

					case 'min':
						groupRecord[field] = Math.min(
							...groupData.map(record => record[field] || 0)
						);
						break;

					case 'max':
						groupRecord[field] = Math.max(
							...groupData.map(record => record[field] || 0)
						);
						break;
				}
			}

			result.push(groupRecord);
		}

		return result;
	}

	/**
	 * Apply merge strategy to source results
	 * @param sourceResults Source results
	 * @param mergeStrategy Merge strategy
	 * @returns Merged data
	 */
	private applyMergeStrategy(
		sourceResults: Array<{ name: string; data: Record<string, any>[] }>,
		mergeStrategy: string
	): Record<string, any>[] {
		switch (mergeStrategy) {
			case 'union':
				// Combine all data
				return sourceResults.flatMap(result => result.data);

			case 'intersection':
				// Find common records (simplified implementation)
				if (sourceResults.length < 2) return [];

				const firstData = sourceResults[0].data;
				return firstData.filter(record =>
					sourceResults.every(result =>
						result.data.some(r => this.recordsEqual(r, record))
					)
				);

			case 'custom':
				// Apply custom merge function
				return this.applyComputation(
					Object.fromEntries(
						sourceResults.map(result => [result.name, result.data])
					) as Record<string, any>,
					'merge'
				);

			default:
				throw new Error(`Unsupported merge strategy: ${mergeStrategy}`);
		}
	}

	/**
	 * Apply custom computation function
	 * @param sourceData Source data
	 * @param functionType Function type ('computation' or 'merge')
	 * @returns Computed data
	 */
	private applyComputation(
		sourceData: Record<string, any>,
		functionType: string
	): Record<string, any>[] {
		const func = this.functionCache.get(functionType);
		if (!func) {
			throw new Error(`${functionType} function not compiled`);
		}

		try {
			const result = func(sourceData);
			if (!Array.isArray(result)) {
				throw new Error(`${functionType} function must return an array`);
			}
			return result;
		} catch (error) {
			throw new VirtualValidationError(
				`${functionType} function execution failed: ${error}`,
				undefined,
				{},
				{ [functionType]: sourceData }
			);
		}
	}

	/**
	 * Compile and cache a function
	 * @param functionType Function type
	 * @param functionCode Function code
	 */
	private compileFunction(functionType: string, functionCode: string): void {
		try {
			// Safe function compilation (in production, this should be more secure)
			const func = new Function('data', functionCode);
			this.functionCache.set(functionType, func);
		} catch (error) {
			const errorContext: Record<string, any> = {};
			errorContext[functionType] = functionCode;
			throw new VirtualValidationError(
				`Failed to compile ${functionType} function: ${error}`,
				undefined,
				{},
				undefined,
				errorContext
			);
		}
	}

	/**
	 * Check if two records are equal
	 * @param a First record
	 * @param b Second record
	 * @returns True if records are equal
	 */
	private recordsEqual(a: Record<string, any>, b: Record<string, any>): boolean {
		const keysA = Object.keys(a);
		const keysB = Object.keys(b);

		if (keysA.length !== keysB.length) return false;

		for (const key of keysA) {
			if (a[key] !== b[key]) return false;
		}

		return true;
	}

	/**
	 * Get aggregation type for aggregation function
	 * @param aggregation Aggregation function
	 * @returns Type string
	 */
	private getAggregationType(aggregation: string): string {
		switch (aggregation) {
			case 'sum':
			case 'avg':
				return 'number';
			case 'count':
				return 'integer';
			case 'min':
			case 'max':
				return 'number';
			default:
				return 'unknown';
		}
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
				if (record[field] !== value) {
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
}