/**
 * Virtual DocType Controller - Base Implementation
 * 
 * This module implements the base VirtualController class that provides
 * common functionality for all Virtual DocType controllers.
 */

import type {
	IVirtualController,
	VirtualDocType,
	VirtualDocTypeConfig,
	VirtualQueryOptions,
	VirtualQueryResult,
	VirtualSourceType,
	VirtualPerformanceMetrics
} from './virtual-doctype';
import {
	VirtualControllerError,
	VirtualConnectionError,
	VirtualConfigError,
	VirtualDataError,
	VirtualCacheError,
	VirtualErrorFactory
} from './virtual-errors';

// =============================================================================
// Base Controller Implementation
// =============================================================================

/**
 * Abstract base class for all Virtual DocType controllers
 * Provides common functionality and enforces the controller interface
 */
export abstract class VirtualController implements IVirtualController {
	/** Controller type */
	public readonly type: VirtualSourceType;

	/** Virtual DocType configuration */
	protected config: VirtualDocTypeConfig;

	/** Controller initialization status */
	protected initialized: boolean = false;

	/** Performance metrics */
	protected metrics: VirtualPerformanceMetrics = {
		total_requests: 0,
		successful_requests: 0,
		failed_requests: 0,
		cache_hit_ratio: 0
	};

	/** Last error that occurred */
	protected lastError?: Error;

	/** Cache for storing results */
	protected cache: Map<string, { data: any; expires: number }> = new Map();

	/**
	 * Create a new VirtualController
	 * @param type Controller type
	 * @param config Virtual DocType configuration
	 */
	constructor(type: VirtualSourceType, config: VirtualDocTypeConfig) {
		this.type = type;
		this.config = config;
	}

	// =============================================================================
	// Abstract Methods (must be implemented by subclasses)
	// =============================================================================

	/**
	 * Initialize the controller with specific source logic
	 * Must be implemented by subclasses
	 */
	public abstract initialize(): Promise<void>;

	/**
	 * Test connection to the specific source
	 * Must be implemented by subclasses
	 */
	public abstract testConnection(): Promise<boolean>;

	/**
	 * Fetch data from the specific source
	 * Must be implemented by subclasses
	 * @param options Query options
	 */
	public abstract fetchData(options: VirtualQueryOptions): Promise<VirtualQueryResult>;

	/**
	 * Get schema information from the specific source
	 * Must be implemented by subclasses
	 */
	public abstract getSchema(): Promise<Record<string, any>>;

	/**
	 * Validate configuration for the specific source
	 * Must be implemented by subclasses
	 * @param config Configuration to validate
	 */
	public abstract validateConfig(config: VirtualDocTypeConfig): Promise<boolean>;

	/**
	 * Cleanup resources specific to the source
	 * Must be implemented by subclasses
	 */
	public abstract cleanup(): Promise<void>;

	// =============================================================================
	// Common Implementation
	// =============================================================================

	/**
	 * Get current performance metrics
	 * @returns Performance metrics
	 */
	public getMetrics(): VirtualPerformanceMetrics {
		return { ...this.metrics };
	}

	/**
	 * Reset performance metrics
	 */
	public resetMetrics(): void {
		this.metrics = {
			total_requests: 0,
			successful_requests: 0,
			failed_requests: 0,
			cache_hit_ratio: 0
		};
	}

	/**
	 * Get last error that occurred
	 * @returns Last error or undefined
	 */
	public getLastError(): Error | undefined {
		return this.lastError;
	}

	/**
	 * Check if controller is initialized
	 * @returns True if initialized
	 */
	public isInitialized(): boolean {
		return this.initialized;
	}

	/**
	 * Get cache statistics
	 * @returns Cache statistics
	 */
	public getCacheStats(): {
		size: number;
		entries: number;
		hitRatio: number;
	} {
		const total = this.metrics.total_requests || 1;
		const hits = (this.metrics.cache_hit_ratio || 0) * total;
		return {
			size: this.cache.size,
			entries: this.cache.size,
			hitRatio: this.metrics.cache_hit_ratio || 0
		};
	}

	/**
	 * Clear cache
	 */
	public clearCache(): void {
		this.cache.clear();
	}

	// =============================================================================
	// Protected Helper Methods
	// =============================================================================

	/**
	 * Update performance metrics after a request
	 * @param success Whether request was successful
	 * @param responseTime Response time in milliseconds
	 * @param cacheHit Whether result came from cache
	 * @param dataSize Size of data in bytes
	 * @param recordCount Number of records returned
	 */
	protected updateMetrics(
		success: boolean,
		responseTime?: number,
		cacheHit?: boolean,
		dataSize?: number,
		recordCount?: number
	): void {
		this.metrics.total_requests = (this.metrics.total_requests || 0) + 1;

		if (success) {
			this.metrics.successful_requests = (this.metrics.successful_requests || 0) + 1;
		} else {
			this.metrics.failed_requests = (this.metrics.failed_requests || 0) + 1;
		}

		if (responseTime !== undefined) {
			this.metrics.last_response_time = responseTime;
			if (this.metrics.avg_response_time === undefined) {
				this.metrics.avg_response_time = responseTime;
			} else {
				// Calculate running average
				this.metrics.avg_response_time = 
					(this.metrics.avg_response_time * 0.8) + (responseTime * 0.2);
			}
		}

		if (cacheHit !== undefined) {
			const total = this.metrics.total_requests || 1;
			const hits = (this.metrics.cache_hit_ratio || 0) * (total - 1) + (cacheHit ? 1 : 0);
			this.metrics.cache_hit_ratio = hits / total;
		}

		if (dataSize !== undefined) {
			this.metrics.data_size = dataSize;
		}

		if (recordCount !== undefined) {
			this.metrics.record_count = recordCount;
		}
	}

	/**
	 * Generate cache key for query options
	 * @param options Query options
	 * @returns Cache key
	 */
	protected generateCacheKey(options: VirtualQueryOptions): string {
		const keyData = {
			filters: options.filters || {},
			fields: options.fields || [],
			sortBy: options.sort_by,
			sortOrder: options.sort_order,
			pagination: options.pagination,
			search: options.search,
			customParams: options.custom_params || {}
		};
		return Buffer.from(JSON.stringify(keyData)).toString('base64');
	}

	/**
	 * Get cached result for query options
	 * @param options Query options
	 * @returns Cached result or null
	 */
	protected getCachedResult<T = Record<string, any>>(
		options: VirtualQueryOptions
	): VirtualQueryResult<T> | null {
		if (this.config.cache_strategy === 'none') {
			return null;
		}

		const cacheKey = this.generateCacheKey(options);
		const cached = this.cache.get(cacheKey);

		if (!cached) {
			return null;
		}

		// Check if cache entry has expired
		if (Date.now() > cached.expires) {
			this.cache.delete(cacheKey);
			return null;
		}

		this.updateMetrics(true, undefined, true);
		return cached.data;
	}

	/**
	 * Set cached result for query options
	 * @param options Query options
	 * @param result Result to cache
	 */
	protected setCachedResult<T = Record<string, any>>(
		options: VirtualQueryOptions,
		result: VirtualQueryResult<T>
	): void {
		if (this.config.cache_strategy === 'none') {
			return;
		}

		const cacheKey = this.generateCacheKey(options);
		const expires = Date.now() + (this.config.cache_duration || 300) * 1000; // Default 5 minutes

		this.cache.set(cacheKey, { data: result, expires });
	}

	/**
	 * Execute operation with retry logic
	 * @param operation Operation to execute
	 * @param context Operation context for error reporting
	 * @returns Operation result
	 */
	protected async executeWithRetry<T>(
		operation: () => Promise<T>,
		context: string
	): Promise<T> {
		const maxAttempts = this.config.retry_attempts || 3;
		const baseDelay = this.config.retry_delay || 1000;
		let lastError: Error;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				return await operation();
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));

				if (attempt === maxAttempts) {
					// Last attempt failed, throw the error
					this.lastError = lastError;
					throw VirtualErrorFactory.wrapError(
						lastError,
						undefined,
						this.type,
						{ operation, attempt, context }
					);
				}

				// Wait before retrying
				const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
				await this.sleep(delay);
			}
		}

		// This should never be reached, but TypeScript requires it
		throw lastError!;
	}

	/**
	 * Sleep for specified milliseconds
	 * @param ms Milliseconds to sleep
	 * @returns Promise that resolves after specified time
	 */
	protected sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Validate basic configuration
	 * @param config Configuration to validate
	 * @throws VirtualConfigError if validation fails
	 */
	protected validateBaseConfig(config: VirtualDocTypeConfig): void {
		if (!config) {
			throw new VirtualConfigError('Configuration is required');
		}

		if (!config.source_config) {
			throw new VirtualConfigError('Source configuration is required');
		}

		if (!config.data_format) {
			throw new VirtualConfigError('Data format is required');
		}

		if (!config.cache_strategy) {
			throw new VirtualConfigError('Cache strategy is required');
		}

		if (!config.refresh_strategy) {
			throw new VirtualConfigError('Refresh strategy is required');
		}

		// Validate timeout
		if (config.timeout && config.timeout <= 0) {
			throw new VirtualConfigError('Timeout must be greater than 0');
		}

		// Validate cache duration
		if (config.cache_duration && config.cache_duration <= 0) {
			throw new VirtualConfigError('Cache duration must be greater than 0');
		}

		// Validate max records
		if (config.max_records && config.max_records <= 0) {
			throw new VirtualConfigError('Max records must be greater than 0');
		}
	}

	/**
	 * Apply field mapping to data
	 * @param data Raw data
	 * @returns Mapped data
	 */
	protected applyFieldMapping(data: Record<string, any>[]): Record<string, any>[] {
		if (!this.config.field_mapping || !this.config.field_mapping.field_map) {
			return data;
		}

		const { field_map, default_values, field_transformations } = this.config.field_mapping;

		return data.map(record => {
			const mappedRecord: Record<string, any> = {};

			// Apply field mapping
			for (const [sourceField, targetField] of Object.entries(field_map)) {
				if (record.hasOwnProperty(sourceField)) {
					mappedRecord[targetField] = record[sourceField];
				}
			}

			// Apply default values
			if (default_values) {
				for (const [field, value] of Object.entries(default_values)) {
					if (!mappedRecord.hasOwnProperty(field)) {
						mappedRecord[field] = value;
					}
				}
			}

			// Apply field transformations
			if (field_transformations) {
				for (const [field, transformation] of Object.entries(field_transformations)) {
					if (mappedRecord.hasOwnProperty(field)) {
						try {
							mappedRecord[field] = this.applyTransformation(
								mappedRecord[field],
								transformation
							);
						} catch (error) {
							// Log transformation error but don't fail the entire record
							console.warn(
								`Failed to transform field '${field}':`,
								error
							);
						}
					}
				}
			}

			return mappedRecord;
		});
	}

	/**
	 * Apply transformation to a value
	 * @param value Value to transform
	 * @param transformation Transformation configuration
	 * @returns Transformed value
	 */
	protected applyTransformation(
		value: any,
		transformation: { type: string; transformation: string }
	): any {
		switch (transformation.type) {
			case 'function':
				// Safe function evaluation (in production, this should be more secure)
				try {
					const func = new Function('value', transformation.transformation);
					return func(value);
				} catch {
					return value;
				}

			case 'expression':
				// Simple expression evaluation (in production, this should be more secure)
				try {
					// This is a simplified example - production should use proper expression parser
					const expr = transformation.transformation.replace(/\bvalue\b/g, JSON.stringify(value));
					return eval(expr);
				} catch {
					return value;
				}

			case 'lookup':
				// Lookup transformation would need access to lookup data
				// This is a placeholder implementation
				return value;

			default:
				return value;
		}
	}

	/**
	 * Apply data transformations
	 * @param data Raw data
	 * @returns Transformed data
	 */
	protected applyDataTransformations(data: Record<string, any>[]): Record<string, any>[] {
		if (!this.config.transformation) {
			return data;
		}

		const { pre_process, post_process, custom_transform, normalization } = this.config.transformation;

		let result = [...data];

		// Apply pre-processing transformations
		if (pre_process) {
			for (const transform of pre_process) {
				result = this.applyDataTransform(result, transform);
			}
		}

		// Apply custom transformation
		if (custom_transform) {
			try {
				// Safe function evaluation (in production, this should be more secure)
				const func = new Function('data', custom_transform);
				result = func(result);
			} catch (error) {
				throw new VirtualDataError(
					`Custom transformation failed: ${error}`,
					undefined,
					this.type,
					{ custom_transform }
				);
			}
		}

		// Apply post-processing transformations
		if (post_process) {
			for (const transform of post_process) {
				result = this.applyDataTransform(result, transform);
			}
		}

		// Apply normalization
		if (normalization) {
			result = this.applyNormalization(result, normalization);
		}

		return result;
	}

	/**
	 * Apply a single data transformation
	 * @param data Data to transform
	 * @param transform Transformation configuration
	 * @returns Transformed data
	 */
	protected applyDataTransform(
		data: Record<string, any>[],
		transform: { type: string; function: string }
	): Record<string, any>[] {
		try {
			// Safe function evaluation (in production, this should be more secure)
			const func = new Function('data', transform.function);
			return func(data);
		} catch (error) {
			throw new VirtualDataError(
				`Data transformation failed: ${error}`,
				undefined,
				this.type,
				{ transform }
			);
		}
	}

	/**
	 * Apply normalization to data
	 * @param data Data to normalize
	 * @param normalization Normalization configuration
	 * @returns Normalized data
	 */
	protected applyNormalization(
		data: Record<string, any>[],
		normalization: {
			trim_strings?: boolean;
			normalize_case?: 'upper' | 'lower' | 'title';
			normalize_numbers?: boolean;
			normalize_dates?: boolean;
		}
	): Record<string, any>[] {
		return data.map(record => {
			const normalizedRecord: Record<string, any> = {};

			for (const [key, value] of Object.entries(record)) {
				let processedValue = value;

				if (typeof processedValue === 'string' && normalization.trim_strings) {
					processedValue = processedValue.trim();
				}

				if (typeof processedValue === 'string' && normalization.normalize_case) {
					switch (normalization.normalize_case) {
						case 'upper':
							processedValue = processedValue.toUpperCase();
							break;
						case 'lower':
							processedValue = processedValue.toLowerCase();
							break;
						case 'title':
							processedValue = processedValue.replace(/\w\S*/g, txt =>
								txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
							);
							break;
					}
				}

				if (typeof processedValue === 'string' && normalization.normalize_numbers) {
					const num = parseFloat(processedValue);
					if (!isNaN(num)) {
						processedValue = num;
					}
				}

				normalizedRecord[key] = processedValue;
			}

			return normalizedRecord;
		});
	}

	/**
	 * Create error with context
	 * @param message Error message
	 * @param operation Operation that failed
	 * @param originalError Original error
	 * @returns VirtualControllerError
	 */
	protected createError(
		message: string,
		operation: string,
		originalError?: Error
	): VirtualControllerError {
		return new VirtualControllerError(
			message,
			undefined,
			this.type,
			operation,
			originalError
		);
	}
}