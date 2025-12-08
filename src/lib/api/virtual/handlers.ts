/**
 * Virtual DocType API Handlers
 * 
 * This module implements API route handlers for Virtual DocTypes,
 * providing REST endpoints for querying and managing Virtual DocTypes.
 */

import type { VirtualDocType, VirtualQueryOptions, VirtualQueryResult } from '../../meta/doctype/virtual-doctype';
import { VirtualDocTypeManager } from '../../meta/doctype/virtual-manager';
import {
	VirtualDocTypeNotFoundError,
	VirtualManagerError,
	VirtualControllerError,
	VirtualErrorFactory
} from '../../meta/doctype/virtual-errors';
import type { Request, Response } from './types';

// =============================================================================
// Handler Types
// =============================================================================

/**
 * Request context for Virtual DocType handlers
 */
export interface VirtualRequestContext {
	/** Virtual DocType name */
	doctypeName: string;

	/** Virtual DocType instance */
	virtualDocType: VirtualDocType;

	/** Query options extracted from request */
	queryOptions: VirtualQueryOptions;

	/** User information */
	user?: {
		id: string;
		roles: string[];
		permissions: string[];
	};
}

/**
 * Handler response options
 */
export interface HandlerResponseOptions {
	/** Response status code */
	status?: number;

	/** Response headers */
	headers?: Record<string, string>;

	/** Whether to include metadata */
	includeMetadata?: boolean;

	/** Custom response data */
	customData?: Record<string, any>;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Extract query options from request
 * @param request HTTP request
 * @returns Query options
 */
export function extractQueryOptions(request: Request): VirtualQueryOptions {
	const url = new URL(request.url || '', `http://${request.headers.host}`);
	const options: VirtualQueryOptions = {};

	// Extract filters from query parameters
	const filters: Record<string, any> = {};
	for (const [key, value] of url.searchParams.entries()) {
		if (key.startsWith('filter[')) {
			const filterKey = key.slice(7, -1); // Remove 'filter[' and ']'
			filters[filterKey] = parseFilterValue(value);
		}
	}
	if (Object.keys(filters).length > 0) {
		options.filters = filters;
	}

	// Extract fields
	const fields = url.searchParams.get('fields');
	if (fields) {
		options.fields = fields.split(',').map(f => f.trim());
	}

	// Extract sorting
	const sortBy = url.searchParams.get('sort_by');
	if (sortBy) {
		options.sort_by = sortBy;
	}

	const sortOrder = url.searchParams.get('sort_order') as 'asc' | 'desc';
	if (sortOrder) {
		options.sort_order = sortOrder;
	}

	// Extract pagination
	const page = url.searchParams.get('page');
	if (page) {
		options.pagination = options.pagination || {};
		options.pagination.page = parseInt(page, 10);
	}

	const limit = url.searchParams.get('limit');
	if (limit) {
		options.pagination = options.pagination || {};
		options.pagination.limit = parseInt(limit, 10);
	}

	const offset = url.searchParams.get('offset');
	if (offset) {
		options.pagination = options.pagination || {};
		options.pagination.offset = parseInt(offset, 10);
	}

	// Extract search
	const search = url.searchParams.get('search');
	if (search) {
		options.search = search;
	}

	// Extract force refresh flag
	const forceRefresh = url.searchParams.get('force_refresh');
	if (forceRefresh === 'true') {
		options.force_refresh = true;
	}

	// Extract custom parameters
	const customParams: Record<string, any> = {};
	for (const [key, value] of url.searchParams.entries()) {
		if (!key.startsWith('filter[') && 
				!['fields', 'sort_by', 'sort_order', 'page', 'limit', 'offset', 'search', 'force_refresh'].includes(key)) {
				customParams[key] = parseFilterValue(value);
			}
		}
	if (Object.keys(customParams).length > 0) {
		options.custom_params = customParams;
	}

	return options;
}

/**
 * Parse filter value from string
 * @param value Filter value string
 * @returns Parsed filter value
 */
export function parseFilterValue(value: string): any {
	// Try to parse as JSON first
	try {
		return JSON.parse(value);
	} catch {
		// Try to parse as number
		const numValue = parseFloat(value);
		if (!isNaN(numValue)) {
			return numValue;
		}

		// Try to parse as boolean
		if (value === 'true') return true;
		if (value === 'false') return false;

		// Return as string
		return value;
	}
}

/**
 * Create standardized response
 * @param data Response data
 * @param options Response options
 * @returns Response object
 */
export function createResponse(
	data: any,
	options: HandlerResponseOptions = {}
): Response {
	const {
		status = 200,
		headers = {},
		includeMetadata = true,
		customData = {}
	} = options;

	let responseData: Record<string, any> = { ...customData };

	if (includeMetadata) {
		responseData.data = data;
		responseData.timestamp = new Date().toISOString();
		responseData.version = '1.0.0';
	} else {
		responseData = data;
	}

	return {
		status,
		headers: {
			'Content-Type': 'application/json',
			...headers
		},
		body: JSON.stringify(responseData)
	};
}

/**
 * Create error response
 * @param error Error object
 * @param options Response options
 * @returns Error response
 */
export function createErrorResponse(
	error: Error,
	options: HandlerResponseOptions = {}
): Response {
	const status = options.status || 500;
	let errorDetails: Record<string, any>;
	
	if (error instanceof Error && 'getDetails' in error) {
		errorDetails = (error as any).getDetails();
	} else {
		errorDetails = { name: error.name, message: error.message };
	}

	return createResponse({
		error: errorDetails,
		success: false
	}, { status, includeMetadata: false, ...options });
}

/**
 * Validate request context
 * @param context Request context
 * @throws Error if validation fails
 */
export function validateContext(context: VirtualRequestContext): void {
	if (!context.doctypeName) {
		throw new Error('DocType name is required');
	}

	if (!context.virtualDocType) {
		throw new VirtualDocTypeNotFoundError(context.doctypeName);
	}

	// Additional validation can be added here
	// For example, permission checks, rate limiting, etc.
}

// =============================================================================
// Specific Handler Functions
// =============================================================================

/**
 * Handle GET request for Virtual DocType data
 * @param request HTTP request
 * @returns Response
 */
export async function handleQueryVirtual(request: Request): Promise<Response> {
	try {
		const manager = VirtualDocTypeManager.getInstance();
		const url = new URL(request.url || '', `http://${request.headers.host}`);
		const doctypeName = url.pathname.split('/').pop();

		if (!doctypeName) {
			throw new Error('DocType name not found in URL');
		}

		const virtualDocType = await manager.getVirtualDocType(doctypeName);
		if (!virtualDocType) {
			throw new VirtualDocTypeNotFoundError(doctypeName);
		}

		const queryOptions = extractQueryOptions(request);

		// Query Virtual DocType
		const result = await manager.queryVirtualDocType(
			doctypeName,
			queryOptions
		);

		// Create response with metadata
		return createResponse(result, {
			headers: {
				'X-Total-Count': String(result.total_count || 0),
				'X-Page-Count': String(result.total_pages || 1),
				'X-Current-Page': String(result.current_page || 1),
				'X-Cache-Hit': String(result.cache_hit || false)
			}
		});
	} catch (error) {
		return createErrorResponse(error as Error);
	}
}

/**
 * Handle POST request to refresh Virtual DocType
 * @param request HTTP request
 * @returns Response
 */
export async function handleRefreshVirtual(request: Request): Promise<Response> {
	try {
		const manager = VirtualDocTypeManager.getInstance();
		const url = new URL(request.url || '', `http://${request.headers.host}`);
		const doctypeName = url.pathname.split('/').pop();

		if (!doctypeName) {
			throw new Error('DocType name not found in URL');
		}

		const virtualDocType = await manager.getVirtualDocType(doctypeName);
		if (!virtualDocType) {
			throw new VirtualDocTypeNotFoundError(doctypeName);
		}

		// Refresh Virtual DocType
		await manager.refreshVirtualDocType(doctypeName);

		// Get updated Virtual DocType
		const updatedDocType = await manager.getVirtualDocType(doctypeName);

		return createResponse({
			message: 'Virtual DocType refreshed successfully',
			doctype: updatedDocType
		});
	} catch (error) {
		return createErrorResponse(error as Error);
	}
}

/**
 * Handle GET request for Virtual DocType schema
 * @param request HTTP request
 * @returns Response
 */
export async function handleSchemaVirtual(request: Request): Promise<Response> {
	try {
		const manager = VirtualDocTypeManager.getInstance();
		const url = new URL(request.url || '', `http://${request.headers.host}`);
		const doctypeName = url.pathname.split('/').pop();

		if (!doctypeName) {
			throw new Error('DocType name not found in URL');
		}

		const virtualDocType = await manager.getVirtualDocType(doctypeName);
		if (!virtualDocType) {
			throw new VirtualDocTypeNotFoundError(doctypeName);
		}

		// Get controller for schema
		const controller = await manager.getController(doctypeName);
		if (!controller) {
			throw new Error(`Controller not found for Virtual DocType '${doctypeName}' of type 'unknown'`);
		}

		// Get schema from controller
		const schema = await (controller as any).getSchema();

		return createResponse({
			doctype: doctypeName,
			schema,
			virtual_config: virtualDocType.virtual_config
		});
	} catch (error) {
		return createErrorResponse(error as Error);
	}
}

/**
 * Handle GET request to list all Virtual DocTypes
 * @param request HTTP request
 * @returns Response
 */
export async function handleListVirtual(request: Request): Promise<Response> {
	try {
		const manager = VirtualDocTypeManager.getInstance();
		const url = new URL(request.url || '', `http://${request.headers.host}`);
		
		// Get filter parameters
		const sourceType = url.searchParams.get('source_type') as any;
		const status = url.searchParams.get('status') as any;

		let virtualDocTypes: VirtualDocType[];

		// Apply filters
		if (sourceType) {
			virtualDocTypes = await manager.getVirtualDocTypesBySourceType(sourceType);
		} else if (status) {
			virtualDocTypes = await manager.getVirtualDocTypesByStatus(status);
		} else {
			virtualDocTypes = await manager.getAllVirtualDocTypes();
		}

		// Add performance metrics if requested
		const includeMetrics = url.searchParams.get('include_metrics') === 'true';
		if (includeMetrics) {
			const metrics = await manager.getAllPerformanceMetrics();
			const stats = await manager.getAllCacheStats();

			virtualDocTypes = virtualDocTypes.map(vdoct => ({
				...vdoct,
				performance_metrics: metrics[vdoct.name],
				cache_stats: stats[vdoct.name]
			}));
		}

		return createResponse({
			virtual_doctypes: virtualDocTypes,
			total_count: virtualDocTypes.length
		});
	} catch (error) {
		return createErrorResponse(error as Error);
	}
}

/**
 * Handle POST request to test Virtual DocType connection
 * @param request HTTP request
 * @returns Response
 */
export async function handleTestConnection(request: Request): Promise<Response> {
	try {
		const manager = VirtualDocTypeManager.getInstance();
		const url = new URL(request.url || '', `http://${request.headers.host}`);
		const doctypeName = url.pathname.split('/').pop();

		if (!doctypeName) {
			throw new Error('DocType name not found in URL');
		}

		const virtualDocType = await manager.getVirtualDocType(doctypeName);
		if (!virtualDocType) {
			throw new VirtualDocTypeNotFoundError(doctypeName);
		}

		// Test connection
		const controller = await manager.getController(doctypeName);
		if (!controller) {
			throw new Error(`Controller not found for Virtual DocType '${doctypeName}' of type 'unknown'`);
		}

		const isConnected = await (controller as any).testConnection();

		return createResponse({
			doctype: doctypeName,
			connected: isConnected,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		return createErrorResponse(error as Error);
	}
}