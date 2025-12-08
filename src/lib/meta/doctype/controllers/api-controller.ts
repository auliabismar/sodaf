/**
 * API Controller - External API Data Source
 * 
 * This module implements the API controller for fetching data from external APIs.
 * Supports various authentication methods, pagination, and data formats.
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
	VirtualAuthenticationError,
	VirtualDataError,
	VirtualParseError
} from '../virtual-errors';

// =============================================================================
// API Controller Implementation
// =============================================================================

/**
 * Controller for fetching data from external APIs
 */
export class APIController extends VirtualController {
	/** HTTP client for making requests */
	private httpClient?: any;

	/** Authentication token */
	private authToken?: string;

	/**
	 * Create a new APIController
	 * @param config Virtual DocType configuration
	 */
	constructor(config: VirtualDocTypeConfig) {
		super('api', config);
	}

	// =============================================================================
	// Controller Interface Implementation
	// =============================================================================

	/**
	 * Initialize the API controller
	 */
	public async initialize(): Promise<void> {
		try {
			this.validateBaseConfig(this.config);
			this.validateAPIConfig(this.config);

			// Initialize HTTP client (using fetch API as default)
			this.httpClient = fetch;

			// Setup authentication if needed
			await this.setupAuthentication();

			this.initialized = true;
		} catch (error) {
			throw this.createError(
				`Failed to initialize API controller: ${error}`,
				'initialize',
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Test connection to the API
	 */
	public async testConnection(): Promise<boolean> {
		if (!this.initialized) {
			throw this.createError('Controller not initialized', 'testConnection');
		}

		try {
			const apiConfig = this.config.source_config.api;
			if (!apiConfig) {
				throw new Error('API configuration not found');
			}

			const testUrl = `${apiConfig.base_url}${apiConfig.endpoint}`;
			const response = await this.makeRequest('HEAD', testUrl);

			return response.ok;
		} catch (error) {
			this.lastError = error instanceof Error ? error : new Error(String(error));
			return false;
		}
	}

	/**
	 * Fetch data from the API
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

			const apiConfig = this.config.source_config.api;
			if (!apiConfig) {
				throw new Error('API configuration not found');
			}

			// Build request URL
			const url = this.buildRequestURL(apiConfig, options);

			// Make request
			const response = await this.makeRequest(apiConfig.method, url, options);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			// Parse response
			const rawData = await this.parseResponse(response);

			// Extract data from response
			let data = this.extractData(rawData, apiConfig);

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
				`Failed to fetch data from API: ${error}`,
				'fetchData',
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Get schema information from the API
	 */
	public async getSchema(): Promise<Record<string, any>> {
		if (!this.initialized) {
			throw this.createError('Controller not initialized', 'getSchema');
		}

		try {
			const apiConfig = this.config.source_config.api;
			if (!apiConfig) {
				throw new Error('API configuration not found');
			}

			// Try to get schema from API if available
			// This is implementation-specific and would need to be customized
			// For now, return a basic schema based on configuration
			return {
				type: 'object',
				properties: this.inferSchemaFromConfig(),
				source: 'api',
				url: `${apiConfig.base_url}${apiConfig.endpoint}`
			};
		} catch (error) {
			throw this.createError(
				`Failed to get schema from API: ${error}`,
				'getSchema',
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Validate API configuration
	 * @param config Configuration to validate
	 */
	public async validateConfig(config: VirtualDocTypeConfig): Promise<boolean> {
		try {
			console.log('[DEBUG] APIController.validateConfig called');
			this.validateBaseConfig(config);
			console.log('[DEBUG] APIController.validateBaseConfig passed');
			this.validateAPIConfig(config);
			console.log('[DEBUG] APIController.validateAPIConfig passed');
			return true;
		} catch (error) {
			console.log('[DEBUG] APIController.validateConfig failed:', error);
			return false;
		}
	}

	/**
	 * Cleanup resources
	 */
	public async cleanup(): Promise<void> {
		this.clearCache();
		this.authToken = undefined;
		this.httpClient = undefined;
		this.initialized = false;
	}

	// =============================================================================
	// Private Helper Methods
	// =============================================================================

	/**
	 * Validate API-specific configuration
	 * @param config Configuration to validate
	 */
	private validateAPIConfig(config: VirtualDocTypeConfig): void {
		const apiConfig = config.source_config.api;
		if (!apiConfig) {
			throw new Error('API configuration is required');
		}

		if (!apiConfig.base_url) {
			throw new Error('Base URL is required');
		}

		if (!apiConfig.endpoint) {
			throw new Error('Endpoint is required');
		}

		if (!apiConfig.method) {
			throw new Error('HTTP method is required');
		}

		// Validate URL format
		try {
			new URL(apiConfig.base_url);
		} catch {
			throw new Error('Invalid base URL format');
		}

		// Validate authentication configuration
		if (config.auth_config) {
			this.validateAuthConfig(config.auth_config);
		}
	}

	/**
	 * Validate authentication configuration
	 * @param authConfig Authentication configuration
	 */
	private validateAuthConfig(authConfig: any): void {
		switch (authConfig.auth_type) {
			case 'basic':
				if (!authConfig.username || !authConfig.password) {
					throw new Error('Username and password are required for basic auth');
				}
				break;

			case 'bearer':
				if (!authConfig.bearer_token) {
					throw new Error('Bearer token is required for bearer auth');
				}
				break;

			case 'api_key':
				if (!authConfig.api_key) {
					throw new Error('API key is required for API key auth');
				}
				break;

			case 'oauth2':
				if (!authConfig.oauth2_config) {
					throw new Error('OAuth2 configuration is required for OAuth2 auth');
				}
				break;
		}
	}

	/**
	 * Setup authentication based on configuration
	 */
	private async setupAuthentication(): Promise<void> {
		if (!this.config.auth_config) {
			return;
		}

		const authConfig = this.config.auth_config;

		switch (authConfig.auth_type) {
			case 'basic':
				// Basic auth is handled in request headers
				break;

			case 'bearer':
				this.authToken = authConfig.bearer_token;
				break;

			case 'api_key':
				this.authToken = authConfig.api_key;
				break;

			case 'oauth2':
				await this.setupOAuth2(authConfig.oauth2_config);
				break;

			case 'custom':
				// Custom authentication would need specific implementation
				break;
		}
	}

	/**
	 * Setup OAuth2 authentication
	 * @param oauth2Config OAuth2 configuration
	 */
	private async setupOAuth2(oauth2Config: any): Promise<void> {
		try {
			// This is a simplified OAuth2 implementation
			// In production, this should use a proper OAuth2 client library

			const tokenResponse = await fetch(oauth2Config.token_url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					grant_type: 'client_credentials',
					client_id: oauth2Config.client_id,
					client_secret: oauth2Config.client_secret,
					scope: oauth2Config.scope || ''
				})
			});

			if (!tokenResponse.ok) {
				throw new Error('OAuth2 token request failed');
			}

			const tokenData = await tokenResponse.json();
			this.authToken = tokenData.access_token;
		} catch (error) {
			throw new VirtualAuthenticationError(
				`OAuth2 setup failed: ${error}`,
				undefined,
				'oauth2'
			);
		}
	}

	/**
	 * Make HTTP request with authentication and error handling
	 * @param method HTTP method
	 * @param url Request URL
	 * @param options Query options
	 * @returns Response object
	 */
	private async makeRequest(
		method: string,
		url: string,
		options?: VirtualQueryOptions
	): Promise<Response> {
		const headers: Record<string, string> = {};

		// Add custom headers
		if (this.config.custom_headers) {
			Object.assign(headers, this.config.custom_headers);
		}

		// Add authentication headers
		this.addAuthHeaders(headers);

		// Add content type for POST/PUT requests
		if (['POST', 'PUT', 'PATCH'].includes(method)) {
			headers['Content-Type'] = 'application/json';
		}

		const requestOptions: RequestInit = {
			method,
			headers
		};

		// Add body for POST/PUT requests
		if (['POST', 'PUT', 'PATCH'].includes(method) && options) {
			const apiConfig = this.config.source_config.api;
			if (apiConfig?.body_template) {
				requestOptions.body = this.processBodyTemplate(
					apiConfig.body_template,
					options
				);
			}
		}

		return this.executeWithRetry(
			() => this.httpClient!(url, requestOptions),
			'makeRequest'
		);
	}

	/**
	 * Add authentication headers to request
	 * @param headers Headers object to modify
	 */
	private addAuthHeaders(headers: Record<string, string>): void {
		if (!this.config.auth_config || !this.authToken) {
			return;
		}

		const authConfig = this.config.auth_config;

		switch (authConfig.auth_type) {
			case 'basic':
				const credentials = Buffer.from(
					`${authConfig.username}:${authConfig.password}`
				).toString('base64');
				headers['Authorization'] = `Basic ${credentials}`;
				break;

			case 'bearer':
				headers['Authorization'] = `Bearer ${this.authToken}`;
				break;

			case 'api_key':
				const headerName = authConfig.api_key_header || 'X-API-Key';
				headers[headerName] = this.authToken;
				break;
		}
	}

	/**
	 * Build request URL with query parameters
	 * @param apiConfig API configuration
	 * @param options Query options
	 * @returns Complete URL
	 */
	private buildRequestURL(
		apiConfig: any,
		options: VirtualQueryOptions
	): string {
		let url = `${apiConfig.base_url}${apiConfig.endpoint}`;

		const queryParams: Record<string, any> = {};

		// Add configured query parameters
		if (apiConfig.query_params) {
			Object.assign(queryParams, apiConfig.query_params);
		}

		// Add pagination parameters
		if (options.pagination && apiConfig.pagination) {
			const { pagination } = apiConfig;
			const { page, limit, offset } = options.pagination;

			switch (pagination.type) {
				case 'page':
					if (page !== undefined && pagination.page_param) {
						queryParams[pagination.page_param] = page;
					}
					if (limit !== undefined && pagination.limit_param) {
						queryParams[pagination.limit_param] = limit;
					}
					break;

				case 'offset':
					if (offset !== undefined && pagination.offset_param) {
						queryParams[pagination.offset_param] = offset;
					}
					if (limit !== undefined && pagination.limit_param) {
						queryParams[pagination.limit_param] = limit;
					}
					break;

				case 'cursor':
					if (offset !== undefined && pagination.cursor_param) {
						queryParams[pagination.cursor_param] = offset;
					}
					break;
			}
		}

		// Add filters
		if (options.filters) {
			Object.assign(queryParams, options.filters);
		}

		// Add search
		if (options.search) {
			queryParams.search = options.search;
		}

		// Add custom parameters
		if (options.custom_params) {
			Object.assign(queryParams, options.custom_params);
		}

		// Build query string
		const queryString = new URLSearchParams(queryParams).toString();
		if (queryString) {
			url += `?${queryString}`;
		}

		return url;
	}

	/**
	 * Parse response based on data format
	 * @param response HTTP response
	 * @returns Parsed data
	 */
	private async parseResponse(response: Response): Promise<any> {
		try {
			switch (this.config.data_format) {
				case 'json':
					return await response.json();

				case 'xml':
					const xmlText = await response.text();
					// In production, use a proper XML parser
					return this.parseXML(xmlText);

				case 'csv':
					const csvText = await response.text();
					return this.parseCSV(csvText);

				case 'yaml':
					const yamlText = await response.text();
					// In production, use a proper YAML parser
					return this.parseYAML(yamlText);

				default:
					return await response.text();
			}
		} catch (error) {
			throw new VirtualParseError(
				`Failed to parse ${this.config.data_format} response: ${error}`,
				undefined,
				this.config.data_format,
				await response.text(),
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Extract data from parsed response
	 * @param rawData Parsed response data
	 * @param apiConfig API configuration
	 * @returns Extracted data array
	 */
	private extractData(rawData: any, apiConfig: any): Record<string, any>[] {
		try {
			// If data_path is specified, extract data from that path
			if (apiConfig.data_path) {
				const pathParts = apiConfig.data_path.split('.');
				let data = rawData;

				for (const part of pathParts) {
					if (data && typeof data === 'object' && part in data) {
						data = data[part];
					} else {
						throw new Error(`Data path '${apiConfig.data_path}' not found in response`);
					}
				}

				if (!Array.isArray(data)) {
					throw new Error('Data path does not point to an array');
				}

				return data;
			}

			// If no data path, assume the entire response is the data
			if (Array.isArray(rawData)) {
				return rawData;
			}

			// Try to find an array in the response
			for (const key in rawData) {
				if (Array.isArray(rawData[key])) {
					return rawData[key];
				}
			}

			throw new Error('No array data found in response');
		} catch (error) {
			throw new VirtualDataError(
				`Failed to extract data from response: ${error}`,
				undefined,
				'api',
				{ data_path: apiConfig.data_path }
			);
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

	/**
	 * Process body template with options
	 * @param template Body template
	 * @param options Query options
	 * @returns Processed body
	 */
	private processBodyTemplate(template: string, options: VirtualQueryOptions): string {
		// Simple template processing - in production, use a proper template engine
		return template
			.replace(/\{\{filters\}\}/g, JSON.stringify(options.filters || {}))
			.replace(/\{\{search\}\}/g, JSON.stringify(options.search || ''))
			.replace(
				/\{\{pagination\}\}/g,
				JSON.stringify(options.pagination || {})
			)
			.replace(
				/\{\{custom_params\}\}/g,
				JSON.stringify(options.custom_params || {})
			);
	}

	/**
	 * Infer schema from configuration
	 * @returns Inferred schema properties
	 */
	private inferSchemaFromConfig(): Record<string, any> {
		// This is a simplified implementation
		// In production, this should be more sophisticated
		const properties: Record<string, any> = {};

		if (this.config.field_mapping?.field_map) {
			for (const [sourceField, targetField] of Object.entries(
				this.config.field_mapping.field_map
			)) {
				properties[targetField] = {
					type: 'string',
					source: sourceField
				};
			}
		}

		return properties;
	}

	/**
	 * Parse XML string (simplified implementation)
	 * @param xmlText XML text
	 * @returns Parsed XML object
	 */
	private parseXML(xmlText: string): any {
		// This is a placeholder - in production, use a proper XML parser
		throw new Error('XML parsing not implemented in this version');
	}

	/**
	 * Parse CSV string (simplified implementation)
	 * @param csvText CSV text
	 * @returns Parsed CSV array
	 */
	private parseCSV(csvText: string): any[] {
		// This is a placeholder - in production, use a proper CSV parser
		const lines = csvText.split('\n');
		const headers = lines[0].split(',');
		const data = [];

		for (let i = 1; i < lines.length; i++) {
			const values = lines[i].split(',');
			const record: any = {};

			for (let j = 0; j < headers.length; j++) {
				record[headers[j].trim()] = values[j]?.trim();
			}

			data.push(record);
		}

		return data;
	}

	/**
	 * Parse YAML string (simplified implementation)
	 * @param yamlText YAML text
	 * @returns Parsed YAML object
	 */
	private parseYAML(yamlText: string): any {
		// This is a placeholder - in production, use a proper YAML parser
		throw new Error('YAML parsing not implemented in this version');
	}
}