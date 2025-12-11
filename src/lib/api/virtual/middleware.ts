/**
 * Virtual DocType API Middleware
 * 
 * This module implements middleware functions for Virtual DocType API handlers,
 * providing authentication, rate limiting, logging, and error handling.
 */

import type { Request, Response, MiddlewareFunction } from './types';
import { VirtualDocTypeManager } from '../../meta/doctype/virtual-manager';
import type { VirtualRequestContext } from './handlers';

// =============================================================================
// Authentication Middleware
// =============================================================================

/**
 * Authentication middleware for Virtual DocType API
 * @param authFunction Authentication function
 * @returns Middleware function
 */
export function createAuthMiddleware(
	authFunction: (request: Request) => Promise<VirtualRequestContext['user'] | null>
): MiddlewareFunction {
	return async (request: Request, response: Response, next: () => Promise<void>): Promise<void> => {
		try {
			// Authenticate request
			const user = await authFunction(request);

			if (!user) {
				response.status = 401;
				response.headers = {
					'Content-Type': 'application/json',
					'WWW-Authenticate': 'Bearer realm="SODAF Virtual"'
				};
				response.body = JSON.stringify({
					error: {
						message: 'Authentication required',
						code: 'AUTH_REQUIRED'
					}
				});
				return;
			}

			// Add user to request context
			(request as any).user = user;

			await next();
		} catch (error) {
			response.status = 500;
			response.headers = { 'Content-Type': 'application/json' };
			response.body = JSON.stringify({
				error: {
					message: 'Authentication error',
					details: error instanceof Error ? error.message : String(error)
				}
			});
		}
	};
}

/**
 * Role-based authorization middleware
 * @param requiredRoles Required roles to access
 * @returns Middleware function
 */
export function createRoleMiddleware(requiredRoles: string[]): MiddlewareFunction {
	return async (request: Request, response: Response, next: () => Promise<void>): Promise<void> => {
		try {
			const user = (request as any).user;

			if (!user) {
				response.status = 401;
				response.headers = { 'Content-Type': 'application/json' };
				response.body = JSON.stringify({
					error: {
						message: 'Authentication required',
						code: 'AUTH_REQUIRED'
					}
				});
				return;
			}

			// Check if user has required roles
			const hasRequiredRole = requiredRoles.some(role =>
				user.roles && user.roles.includes(role)
			);

			if (!hasRequiredRole) {
				response.status = 403;
				response.headers = { 'Content-Type': 'application/json' };
				response.body = JSON.stringify({
					error: {
						message: 'Insufficient permissions',
						code: 'INSUFFICIENT_PERMISSIONS',
						required_roles: requiredRoles,
						user_roles: user.roles
					}
				});
				return;
			}

			await next();
		} catch (error) {
			response.status = 500;
			response.headers = { 'Content-Type': 'application/json' };
			response.body = JSON.stringify({
				error: {
					message: 'Authorization error',
					details: error instanceof Error ? error.message : String(error)
				}
			});
		}
	};
}

/**
 * Permission-based authorization middleware
 * @param requiredPermissions Required permissions to access
 * @returns Middleware function
 */
export function createPermissionMiddleware(requiredPermissions: string[]): MiddlewareFunction {
	return async (request: Request, response: Response, next: () => Promise<void>): Promise<void> => {
		try {
			const user = (request as any).user;

			if (!user) {
				response.status = 401;
				response.headers = { 'Content-Type': 'application/json' };
				response.body = JSON.stringify({
					error: {
						message: 'Authentication required',
						code: 'AUTH_REQUIRED'
					}
				});
				return;
			}

			// Check if user has required permissions
			const hasRequiredPermission = requiredPermissions.some(permission =>
				user.permissions && user.permissions.includes(permission)
			);

			if (!hasRequiredPermission) {
				response.status = 403;
				response.headers = { 'Content-Type': 'application/json' };
				response.body = JSON.stringify({
					error: {
						message: 'Insufficient permissions',
						code: 'INSUFFICIENT_PERMISSIONS',
						required_permissions: requiredPermissions,
						user_permissions: user.permissions
					}
				});
				return;
			}

			await next();
		} catch (error) {
			response.status = 500;
			response.headers = { 'Content-Type': 'application/json' };
			response.body = JSON.stringify({
				error: {
					message: 'Authorization error',
					details: error instanceof Error ? error.message : String(error)
				}
			});
		}
	};
}

// =============================================================================
// Rate Limiting Middleware
// =============================================================================

/**
 * Rate limiting middleware
 * @param options Rate limiting options
 * @returns Middleware function
 */
export function createRateLimitMiddleware(options: {
	requests: number;
	window: number;
}): MiddlewareFunction {
	const requests = new Map<string, number[]>();

	return async (request: Request, response: Response, next: () => Promise<void>): Promise<void> => {
		try {
			const now = Date.now();
			const clientId = request.headers['x-forwarded-for'] ||
				request.headers['x-real-ip'] ||
				'unknown';

			// Get existing requests for this client
			const clientRequests = requests.get(clientId) || [];

			// Remove old requests outside of window
			const validRequests = clientRequests.filter(time => time > now - options.window);
			validRequests.push(now);

			// Check if rate limit exceeded
			if (validRequests.length > options.requests) {
				response.status = 429;
				response.headers = {
					'Content-Type': 'application/json',
					'Retry-After': String(Math.ceil(options.window / 1000)),
					'X-RateLimit-Limit': String(options.requests),
					'X-RateLimit-Window': String(options.window),
					'X-RateLimit-Remaining': '0'
				};
				response.body = JSON.stringify({
					error: {
						message: 'Rate limit exceeded',
						code: 'RATE_LIMIT_EXCEEDED',
						limit: options.requests,
						window: options.window,
						retry_after: Math.ceil(options.window / 1000)
					}
				});
				return;
			}

			// Update requests tracking
			requests.set(clientId, validRequests);

			// Add rate limit headers to successful requests
			response.headers = {
				'X-RateLimit-Limit': String(options.requests),
				'X-RateLimit-Window': String(options.window),
				'X-RateLimit-Remaining': String(Math.max(0, options.requests - validRequests.length))
			};

			await next();
		} catch (error) {
			response.status = 500;
			response.headers = { 'Content-Type': 'application/json' };
			response.body = JSON.stringify({
				error: {
					message: 'Rate limiting error',
					details: error instanceof Error ? error.message : String(error)
				}
			});
		}
	};
}

// =============================================================================
// Logging Middleware
// =============================================================================

/**
 * Request logging middleware
 * @param options Logging options
 * @returns Middleware function
 */
export function createLoggingMiddleware(options: {
	logLevel?: 'debug' | 'info' | 'warn' | 'error';
	logBody?: boolean;
	logHeaders?: boolean;
} = {}): MiddlewareFunction {
	const {
		logLevel = 'info',
		logBody = false,
		logHeaders = false
	} = options;

	return async (request: Request, response: Response, next: () => Promise<void>): Promise<void> => {
		const startTime = Date.now();

		// Generate request ID (outside try so it's accessible in catch)
		const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		try {
			// Log request details
			const logData: Record<string, any> = {
				timestamp: new Date().toISOString(),
				request_id: requestId,
				method: request.method,
				url: request.url,
				user_agent: request.headers['user-agent'],
				ip: request.headers['x-forwarded-for'] ||
					request.headers['x-real-ip'] ||
					'unknown'
			};

			if (logHeaders) {
				logData.headers = request.headers;
			}

			if (logBody && request.body) {
				logData.body = request.body;
			}

			// Log based on level
			switch (logLevel) {
				case 'debug':
					console.debug('[Virtual API Request]', logData);
					break;
				case 'info':
					console.info('[Virtual API Request]', logData);
					break;
				case 'warn':
					console.warn('[Virtual API Request]', logData);
					break;
				case 'error':
					console.error('[Virtual API Request]', logData);
					break;
			}

			await next();

			// Log response details
			const duration = Date.now() - startTime;
			const responseLogData: Record<string, any> = {
				timestamp: new Date().toISOString(),
				request_id: requestId,
				status: response.status,
				duration_ms: duration
			};

			switch (logLevel) {
				case 'debug':
					console.debug('[Virtual API Response]', responseLogData);
					break;
				case 'info':
					console.info('[Virtual API Response]', responseLogData);
					break;
				case 'warn':
					console.warn('[Virtual API Response]', responseLogData);
					break;
				case 'error':
					console.error('[Virtual API Response]', responseLogData);
					break;
			}
		} catch (error) {
			const duration = Date.now() - startTime;
			const errorLogData: Record<string, any> = {
				timestamp: new Date().toISOString(),
				request_id: requestId || 'unknown',
				error: error instanceof Error ? error.message : String(error),
				duration_ms: duration
			};

			console.error('[Virtual API Error]', errorLogData);

			// Ensure error response is sent
			response.status = 500;
			response.headers = { 'Content-Type': 'application/json' };
			response.body = JSON.stringify({
				error: {
					message: 'Request logging error',
					details: error instanceof Error ? error.message : String(error)
				}
			});
		}
	};
}

/**
 * Performance monitoring middleware
 * @returns Middleware function
 */
export function createPerformanceMiddleware(): MiddlewareFunction {
	return async (request: Request, response: Response, next: () => Promise<void>): Promise<void> => {
		const startTime = process.hrtime.bigint();

		try {
			await next();

			// Calculate response time
			const endTime = process.hrtime.bigint();
			const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

			// Add performance headers
			response.headers = {
				...response.headers,
				'X-Response-Time': String(responseTime),
				'X-Performance-Metrics': JSON.stringify({
					response_time_ms: responseTime,
					timestamp: new Date().toISOString()
				})
			};
		} catch (error) {
			const endTime = process.hrtime.bigint();
			const responseTime = Number(endTime - startTime) / 1000000;

			console.error('[Virtual API Performance Error]', {
				timestamp: new Date().toISOString(),
				error: error instanceof Error ? error.message : String(error),
				response_time_ms: responseTime
			});
		}
	};
}

// =============================================================================
// Validation Middleware
// =============================================================================

/**
 * Request validation middleware
 * @param validationSchema Validation schema
 * @returns Middleware function
 */
export function createValidationMiddleware(validationSchema: Record<string, any>): MiddlewareFunction {
	return async (request: Request, response: Response, next: () => Promise<void>): Promise<void> => {
		try {
			// Validate request body if present
			if (request.body && Object.keys(validationSchema).length > 0) {
				const validationErrors = validateRequestBody(request.body, validationSchema);

				if (validationErrors.length > 0) {
					response.status = 400;
					response.headers = { 'Content-Type': 'application/json' };
					response.body = JSON.stringify({
						error: {
							message: 'Validation failed',
							code: 'VALIDATION_ERROR',
							errors: validationErrors
						}
					});
					return;
				}
			}

			await next();
		} catch (error) {
			response.status = 500;
			response.headers = { 'Content-Type': 'application/json' };
			response.body = JSON.stringify({
				error: {
					message: 'Validation error',
					details: error instanceof Error ? error.message : String(error)
				}
			});
		}
	};
}

/**
 * Validate request body against schema
 * @param body Request body
 * @param schema Validation schema
 * @returns Array of validation errors
 */
function validateRequestBody(body: any, schema: Record<string, any>): string[] {
	const errors: string[] = [];

	for (const [field, rules] of Object.entries(schema)) {
		const value = body[field];

		// Check required fields
		if (rules.required && (value === undefined || value === null || value === '')) {
			errors.push(`${field} is required`);
			continue;
		}

		// Check field types
		if (rules.type && value !== undefined && value !== null) {
			switch (rules.type) {
				case 'string':
					if (typeof value !== 'string') {
						errors.push(`${field} must be a string`);
					}
					break;

				case 'number':
					if (typeof value !== 'number' || isNaN(value)) {
						errors.push(`${field} must be a number`);
					}
					break;

				case 'boolean':
					if (typeof value !== 'boolean') {
						errors.push(`${field} must be a boolean`);
					}
					break;

				case 'array':
					if (!Array.isArray(value)) {
						errors.push(`${field} must be an array`);
					}
					break;

				case 'object':
					if (typeof value !== 'object' || Array.isArray(value)) {
						errors.push(`${field} must be an object`);
					}
					break;
			}
		}

		// Check custom validation function
		if (rules.validate && typeof rules.validate === 'function') {
			try {
				const isValid = rules.validate(value);
				if (!isValid) {
					errors.push(`${field} is invalid`);
				}
			} catch (error) {
				errors.push(`${field} validation error: ${error}`);
			}
		}
	}

	return errors;
}

// =============================================================================
// CORS Middleware
// =============================================================================

/**
 * CORS middleware for cross-origin requests
	 * @param options CORS options
	 * @returns Middleware function
	 */
export function createCORSMiddleware(options: {
	allowedOrigins?: string[];
	allowedMethods?: string[];
	allowedHeaders?: string[];
	maxAge?: number;
} = {}): MiddlewareFunction {
	const {
		allowedOrigins = ['*'],
		allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders = ['Content-Type', 'Authorization'],
		maxAge = 86400 // 24 hours
	} = options;

	return async (request: Request, response: Response, next: () => Promise<void>): Promise<void> => {
		try {
			const origin = request.headers['origin'];

			// Handle preflight requests
			if (request.method === 'OPTIONS') {
				response.status = 200;
				response.headers = {
					'Access-Control-Allow-Origin': origin || '*',
					'Access-Control-Allow-Methods': allowedMethods.join(', '),
					'Access-Control-Allow-Headers': allowedHeaders.join(', '),
					'Access-Control-Max-Age': String(maxAge)
				};
				return;
			}

			// Add CORS headers to actual responses
			if (allowedOrigins.includes('*') || allowedOrigins.includes(origin || '')) {
				response.headers = {
					...response.headers,
					'Access-Control-Allow-Origin': origin || '*',
					'Access-Control-Allow-Credentials': 'true'
				};
			}

			await next();
		} catch (error) {
			response.status = 500;
			response.headers = { 'Content-Type': 'application/json' };
			response.body = JSON.stringify({
				error: {
					message: 'CORS error',
					details: error instanceof Error ? error.message : String(error)
				}
			});
		}
	};
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate a unique request ID
 * @returns Request ID string
 */
function generateRequestId(): string {
	return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create combined middleware chain
 * @param middlewares Array of middleware functions
 * @returns Combined middleware function
 */
export function combineMiddleware(middlewares: MiddlewareFunction[]): MiddlewareFunction {
	return async (request: Request, response: Response, next: () => Promise<void>): Promise<void> => {
		let index = 0;

		const nextWrapper = async (): Promise<void> => {
			if (index < middlewares.length) {
				const middleware = middlewares[index];
				index++;
				await middleware(request, response, nextWrapper);
			} else {
				await next();
			}
		};

		await nextWrapper();
	};
}
