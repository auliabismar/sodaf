/**
 * Virtual API Types
 * 
 * This module defines types for Virtual DocType API handlers.
 */

// =============================================================================
// HTTP Types
// =============================================================================

/**
 * HTTP Request interface
 */
export interface Request {
	/** Request URL */
	url?: string;

	/** HTTP method */
	method?: string;

	/** Request headers */
	headers: Record<string, string>;

	/** Request body */
	body?: any;

	/** Query parameters */
	query?: Record<string, string>;
}

/**
 * HTTP Response interface
 */
export interface Response {
	/** Response status code */
	status: number;

	/** Response headers */
	headers: Record<string, string>;

	/** Response body */
	body?: any;
}

// =============================================================================
// Handler Types
// =============================================================================

/**
 * API handler function type
 */
export type APIHandler = (request: Request) => Promise<Response>;

/**
 * Middleware function type
 */
export type MiddlewareFunction = (
	request: Request,
	response: Response,
	next: () => Promise<void>
) => Promise<void>;

/**
 * Route configuration
 */
export interface RouteConfig {
	/** Route path */
	path: string;

	/** HTTP method */
	method: string;

	/** Handler function */
	handler: APIHandler;

	/** Middleware functions */
	middleware?: MiddlewareFunction[];
}

/**
 * API route registry
 */
export interface RouteRegistry {
	/** Registered routes */
	routes: Map<string, RouteConfig>;

	/** Global middleware */
	globalMiddleware: MiddlewareFunction[];

	/**
	 * Register a new route
	 * @param config Route configuration
	 */
	registerRoute(config: RouteConfig): void;

	/**
	 * Get route for request
	 * @param request HTTP request
	 * @returns Route configuration or null
	 */
	getRoute(request: Request): RouteConfig | null;

	/**
	 * Add global middleware
	 * @param middleware Middleware function
	 */
	addGlobalMiddleware(middleware: MiddlewareFunction): void;
}