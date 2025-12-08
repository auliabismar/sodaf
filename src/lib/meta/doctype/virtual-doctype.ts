/**
 * Virtual DocType - Core Interfaces and Types
 * 
 * This module defines the core interfaces and types for Virtual DocTypes,
 * which are DocTypes that don't have database tables but fetch data from
 * external sources like APIs, file systems, or computed data.
 */

import type { DocType, DocField, DocPerm } from './types';

// =============================================================================
// Virtual DocType Types
// =============================================================================

/**
 * Virtual DocType source types
 */
export type VirtualSourceType = 
	| 'api'           // External API endpoint
	| 'file'          // File system (JSON, CSV, XML, etc.)
	| 'computed'      // Computed data from other DocTypes
	| 'hybrid';       // Combination of multiple sources

/**
 * Virtual DocType data format
 */
export type VirtualDataFormat = 
	| 'json'          // JSON format
	| 'xml'           // XML format
	| 'csv'           // CSV format
	| 'yaml'          // YAML format
	| 'custom';       // Custom parser

/**
 * Cache strategy for Virtual DocTypes
 */
export type CacheStrategy = 
	| 'none'          // No caching
	| 'memory'        // In-memory caching
	| 'redis'         // Redis caching
	| 'file'          // File-based caching
	| 'database';     // Database caching

/**
 * Refresh strategy for cached data
 */
export type RefreshStrategy = 
	| 'manual'        // Manual refresh only
	| 'time-based'    // Time-based refresh
	| 'event-based'   // Event-based refresh
	| 'hybrid';       // Combination of strategies

/**
 * Virtual DocType configuration interface
 */
export interface VirtualDocTypeConfig {
	/** Comma-separated list of fields for quick entry */
	quick_entry_fields?: string;
	/** Whether the Virtual DocType is read-only */
	read_only?: boolean;
	/** Source type for this Virtual DocType */
	source_type: VirtualSourceType;

	/** Data format of the source */
	data_format: VirtualDataFormat;

	/** Cache strategy */
	cache_strategy: CacheStrategy;

	/** Refresh strategy */
	refresh_strategy: RefreshStrategy;

	/** Cache duration in seconds (for time-based refresh) */
	cache_duration?: number;

	/** Maximum number of records to fetch */
	max_records?: number;

	/** Timeout for API requests in milliseconds */
	timeout?: number;

	/** Retry attempts for failed requests */
	retry_attempts?: number;

	/** Retry delay in milliseconds */
	retry_delay?: number;

	/** Whether to enable pagination */
	enable_pagination?: boolean;

	/** Page size for pagination */
	page_size?: number;

	/** Whether to enable filtering */
	enable_filtering?: boolean;

	/** Whether to enable sorting */
	enable_sorting?: boolean;

	/** Whether to enable searching */
	enable_searching?: boolean;

	/** Custom headers for API requests */
	custom_headers?: Record<string, string>;

	/** Authentication configuration */
	auth_config?: VirtualAuthConfig;

	/** Source-specific configuration */
	source_config: VirtualSourceConfig;

	/** Field mapping configuration */
	field_mapping?: VirtualFieldMapping;

	/** Transformation configuration */
	transformation?: VirtualTransformation;

	/** Validation configuration */
	validation?: VirtualValidation;

	/** Error handling configuration */
	error_handling?: VirtualErrorHandling;

	/** Performance configuration */
	performance?: VirtualPerformance;

	/** Debug configuration */
	debug?: VirtualDebug;
}

/**
 * Authentication configuration for Virtual DocTypes
 */
export interface VirtualAuthConfig {
	/** Authentication type */
	auth_type: 'none' | 'basic' | 'bearer' | 'oauth2' | 'api_key' | 'custom';

	/** Username for basic auth */
	username?: string;

	/** Password for basic auth */
	password?: string;

	/** Bearer token */
	bearer_token?: string;

	/** API key */
	api_key?: string;

	/** API key header name */
	api_key_header?: string;

	/** OAuth2 configuration */
	oauth2_config?: {
		client_id: string;
		client_secret: string;
		token_url: string;
		scope?: string;
	};

	/** Custom authentication function */
	custom_auth?: string;
}

/**
 * Source-specific configuration
 */
export interface VirtualSourceConfig {
	/** API source configuration */
	api?: {
		/** Base URL for API */
		base_url: string;

		/** Endpoint path */
		endpoint: string;

		/** HTTP method */
		method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

		/** Query parameters */
		query_params?: Record<string, any>;

		/** Request body template */
		body_template?: string;

		/** Response path to data (JSONPath) */
		data_path?: string;

		/** Total count path (JSONPath) */
		count_path?: string;

		/** Pagination configuration */
		pagination?: {
			type: 'offset' | 'cursor' | 'page';
			page_param?: string;
			limit_param?: string;
			offset_param?: string;
			cursor_param?: string;
		};
	};

	/** File source configuration */
	file?: {
		/** File path or pattern */
		file_path: string;

		/** Whether to watch for file changes */
		watch_changes?: boolean;

		/** File encoding */
		encoding?: string;

		/** Delimiter for CSV files */
		delimiter?: string;

		/** Root element for XML files */
		root_element?: string;

		/** Row element for XML files */
		row_element?: string;
	};

	/** Computed source configuration */
	computed?: {
		/** Source DocTypes to compute from */
		source_doctypes: string[];

		/** Computation function */
		computation_function: string;

		/** Dependencies between fields */
		field_dependencies?: Record<string, string[]>;

		/** Aggregation configuration */
		aggregation?: {
			group_by: string[];
			aggregations: Record<string, 'sum' | 'avg' | 'count' | 'min' | 'max'>;
		};

		/** Join configuration */
		joins?: Array<{
			source_doctype: string;
			local_field: string;
			foreign_field: string;
			join_type: 'inner' | 'left' | 'right' | 'full';
		}>;
	};

	/** Hybrid source configuration */
	hybrid?: {
		/** Array of source configurations */
		sources: Array<{
			name: string;
			source_type: VirtualSourceType;
			source_config: VirtualSourceConfig;
			priority?: number;
		}>;

		/** Merge strategy */
		merge_strategy: 'union' | 'intersection' | 'custom';

		/** Custom merge function */
		merge_function?: string;
	};
}

/**
 * Field mapping configuration
 */
export interface VirtualFieldMapping {
	/** Map source fields to DocType fields */
	field_map: Record<string, string>;

	/** Default values for unmapped fields */
	default_values?: Record<string, any>;

	/** Field transformations */
	field_transformations?: Record<string, {
		type: 'function' | 'expression' | 'lookup';
		transformation: string;
	}>;

	/** Conditional mappings */
	conditional_mappings?: Array<{
		condition: string;
		field_map: Record<string, string>;
	}>;
}

/**
 * Data transformation configuration
 */
export interface VirtualTransformation {
	/** Pre-processing transformations */
	pre_process?: Array<{
		type: 'filter' | 'map' | 'reduce' | 'sort';
		function: string;
	}>;

	/** Post-processing transformations */
	post_process?: Array<{
		type: 'filter' | 'map' | 'reduce' | 'sort';
		function: string;
	}>;

	/** Custom transformation function */
	custom_transform?: string;

	/** Data normalization */
	normalization?: {
		trim_strings?: boolean;
		normalize_case?: 'upper' | 'lower' | 'title';
		normalize_numbers?: boolean;
		normalize_dates?: boolean;
	};
}

/**
 * Validation configuration
 */
export interface VirtualValidation {
	/** Schema validation rules */
	schema_validation?: Record<string, any>;

	/** Custom validation function */
	custom_validation?: string;

	/** Data quality checks */
	quality_checks?: Array<{
		field: string;
		check: 'required' | 'unique' | 'format' | 'range' | 'custom';
		parameter?: any;
		error_message?: string;
	}>;

	/** Validation mode */
	validation_mode: 'strict' | 'lenient' | 'none';
}

/**
 * Error handling configuration
 */
export interface VirtualErrorHandling {
	/** Error retry strategy */
	retry_strategy: 'none' | 'exponential' | 'linear' | 'custom';

	/** Maximum retry attempts */
	max_retries?: number;

	/** Base delay for retries in milliseconds */
	base_delay?: number;

	/** Maximum delay for retries in milliseconds */
	max_delay?: number;

	/** Fallback data source */
	fallback_source?: {
		source_type: VirtualSourceType;
		source_config: VirtualSourceConfig;
	};

	/** Error notification configuration */
	notifications?: {
		email?: string[];
		webhook?: string;
		slack?: string;
	};

	/** Custom error handler */
	custom_handler?: string;
}

/**
 * Performance configuration
 */
export interface VirtualPerformance {
	/** Connection pool size for API requests */
	pool_size?: number;

	/** Request timeout in milliseconds */
	request_timeout?: number;

	/** Concurrent request limit */
	concurrent_limit?: number;

	/** Rate limiting configuration */
	rate_limit?: {
		requests_per_second: number;
		burst_size?: number;
	};

	/** Compression settings */
	compression?: {
		enabled: boolean;
		algorithm?: 'gzip' | 'deflate' | 'brotli';
	};

	/** Streaming configuration */
	streaming?: {
		enabled: boolean;
		chunk_size?: number;
		buffer_size?: number;
	};
}

/**
 * Debug configuration
 */
export interface VirtualDebug {
	/** Enable debug logging */
	enabled?: boolean;

	/** Log level */
	log_level?: 'debug' | 'info' | 'warn' | 'error';

	/** Log file path */
	log_file?: string;

	/** Enable request/response logging */
	log_requests?: boolean;

	/** Enable performance monitoring */
	monitor_performance?: boolean;

	/** Enable data sampling */
	sample_data?: boolean;

	/** Sample rate (0-1) */
	sample_rate?: number;
}

/**
 * Virtual DocType interface extending DocType
 */
export interface VirtualDocType extends DocType {
	/** This is always true for Virtual DocTypes */
	is_virtual: true;

	/** Virtual DocType configuration */
	virtual_config: VirtualDocTypeConfig;

	/** Last refresh timestamp */
	last_refreshed?: Date;

	/** Next refresh timestamp */
	next_refresh?: Date;

	/** Current status */
	status: 'active' | 'inactive' | 'error' | 'refreshing';

	/** Error message if status is error */
	error_message?: string;

	/** Performance metrics */
	performance_metrics?: VirtualPerformanceMetrics;

	/** Cache statistics */
	cache_stats?: VirtualCacheStats;
}

/**
 * Virtual DocType performance metrics
 */
export interface VirtualPerformanceMetrics {
	/** Average response time in milliseconds */
	avg_response_time?: number;

	/** Last response time in milliseconds */
	last_response_time?: number;

	/** Total requests made */
	total_requests?: number;

	/** Successful requests */
	successful_requests?: number;

	/** Failed requests */
	failed_requests?: number;

	/** Cache hit ratio */
	cache_hit_ratio?: number;

	/** Data size in bytes */
	data_size?: number;

	/** Record count */
	record_count?: number;
}

/**
 * Virtual DocType cache statistics
 */
export interface VirtualCacheStats {
	/** Cache hits */
	hits?: number;

	/** Cache misses */
	misses?: number;

	/** Cache size in bytes */
	size?: number;

	/** Cache entry count */
	entries?: number;

	/** Last cache refresh */
	last_refresh?: Date;

	/** Cache expiry time */
	expires_at?: Date;
}

/**
 * Virtual DocType query options
 */
export interface VirtualQueryOptions {
	/** Filters to apply */
	filters?: Record<string, any>;

	/** Fields to return */
	fields?: string[];

	/** Sort order */
	sort_by?: string;

	/** Sort direction */
	sort_order?: 'asc' | 'desc';

	/** Pagination */
	pagination?: {
		page?: number;
		limit?: number;
		offset?: number;
	};

	/** Search query */
	search?: string;

	/** Force refresh from source */
	force_refresh?: boolean;

	/** Include performance metrics */
	include_metrics?: boolean;

	/** Custom parameters */
	custom_params?: Record<string, any>;
}

/**
 * Virtual DocType query result
 */
export interface VirtualQueryResult<T = Record<string, any>> {
	/** Query results */
	data: T[];

	/** Total count (if available) */
	total_count?: number;

	/** Current page (if paginated) */
	current_page?: number;

	/** Total pages (if paginated) */
	total_pages?: number;

	/** Page size (if paginated) */
	page_size?: number;

	/** Whether there's a next page */
	has_next?: boolean;

	/** Whether there's a previous page */
	has_previous?: boolean;

	/** Query execution time in milliseconds */
	execution_time?: number;

	/** Cache hit status */
	cache_hit?: boolean;

	/** Performance metrics */
	metrics?: VirtualPerformanceMetrics;

	/** Warnings that occurred during query */
	warnings?: string[];
}

/**
 * Virtual DocType controller interface
 */
export interface IVirtualController {
	/** Controller type */
	readonly type: VirtualSourceType;

	/** Initialize the controller */
	initialize(): Promise<void>;

	/** Test the connection to the source */
	testConnection(): Promise<boolean>;

	/** Fetch data from the source */
	fetchData(options: VirtualQueryOptions): Promise<VirtualQueryResult>;

	/** Get schema information */
	getSchema(): Promise<Record<string, any>>;

	/** Validate configuration */
	validateConfig(config: VirtualDocTypeConfig): Promise<boolean>;

	/** Cleanup resources */
	cleanup(): Promise<void>;
}

/**
 * Virtual DocType manager interface
 */
export interface IVirtualManager {
	/** Register a Virtual DocType */
	registerVirtualDocType(virtualDocType: VirtualDocType): Promise<void>;

	/** Unregister a Virtual DocType */
	unregisterVirtualDocType(name: string): Promise<void>;

	/** Get a Virtual DocType */
	getVirtualDocType(name: string): Promise<VirtualDocType | null>;

	/** Get all Virtual DocTypes */
	getAllVirtualDocTypes(): Promise<VirtualDocType[]>;

	/** Query a Virtual DocType */
	queryVirtualDocType(name: string, options: VirtualQueryOptions): Promise<VirtualQueryResult>;

	/** Refresh a Virtual DocType */
	refreshVirtualDocType(name: string): Promise<void>;

	/** Get controller for a Virtual DocType */
	getController(name: string): Promise<IVirtualController | null>;

	/** Validate Virtual DocType configuration */
	validateConfig(config: VirtualDocTypeConfig): Promise<boolean>;
}