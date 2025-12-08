/**
 * Virtual API Middleware Tests
 * 
 * Tests for the Virtual API middleware functions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	createAuthMiddleware,
	createRoleMiddleware,
	createPermissionMiddleware,
	createRateLimitMiddleware,
	createLoggingMiddleware
} from '../middleware';
import type { Request, Response } from '../types';

describe('Virtual API Middleware', () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: ReturnType<typeof vi.fn> & (() => Promise<void>);

	beforeEach(() => {
		mockRequest = {
			method: 'GET',
			url: '/api/test',
			headers: {},
			body: null
		};

		mockResponse = {
			status: 200,
			headers: {},
			body: null
		};

		mockNext = vi.fn().mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Authentication Middleware', () => {
		it('should pass authentication to next middleware', async () => {
			const authFunction = vi.fn().mockResolvedValue({
				id: 'user123',
				name: 'Test User',
				roles: ['user'],
				permissions: ['read']
			});

			const middleware = createAuthMiddleware(authFunction);

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(authFunction).toHaveBeenCalledWith(mockRequest);
			expect(mockNext).toHaveBeenCalled();
			expect((mockRequest as any).user).toEqual({
				id: 'user123',
				name: 'Test User',
				roles: ['user'],
				permissions: ['read']
			});
		});

		it('should return 401 when authentication fails', async () => {
			const authFunction = vi.fn().mockResolvedValue(null);

			const middleware = createAuthMiddleware(authFunction);

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toBe(401);
			expect(mockResponse.headers).toEqual({
				'Content-Type': 'application/json',
				'WWW-Authenticate': 'Bearer realm="SODAF Virtual"'
			});
			expect(JSON.parse(mockResponse.body as string)).toEqual({
				error: {
					message: 'Authentication required',
					code: 'AUTH_REQUIRED'
				}
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should handle authentication errors', async () => {
			const authFunction = vi.fn().mockRejectedValue(new Error('Auth service down'));

			const middleware = createAuthMiddleware(authFunction);

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toBe(500);
			expect(mockResponse.headers).toEqual({
				'Content-Type': 'application/json'
			});
			expect(JSON.parse(mockResponse.body as string)).toEqual({
				error: {
					message: 'Authentication error',
					details: 'Auth service down'
				}
			});
			expect(mockNext).not.toHaveBeenCalled();
		});
	});

	describe('Role Middleware', () => {
		it('should pass when user has required role', async () => {
			(mockRequest as any).user = {
				id: 'user123',
				roles: ['admin', 'user']
			};

			const middleware = createRoleMiddleware(['admin']);

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockNext).toHaveBeenCalled();
		});

		it('should return 403 when user lacks required role', async () => {
			(mockRequest as any).user = {
				id: 'user123',
				roles: ['user']
			};

			const middleware = createRoleMiddleware(['admin']);

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toBe(403);
			expect(mockResponse.headers).toEqual({
				'Content-Type': 'application/json'
			});
			expect(JSON.parse(mockResponse.body as string)).toEqual({
				error: {
					message: 'Insufficient permissions',
					code: 'INSUFFICIENT_PERMISSIONS',
					required_roles: ['admin'],
					user_roles: ['user']
				}
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should return 401 when no user in request', async () => {
			const middleware = createRoleMiddleware(['admin']);

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toBe(401);
			expect(mockResponse.headers).toEqual({
				'Content-Type': 'application/json'
			});
			expect(JSON.parse(mockResponse.body as string)).toEqual({
				error: {
					message: 'Authentication required',
					code: 'AUTH_REQUIRED'
				}
			});
			expect(mockNext).not.toHaveBeenCalled();
		});
	});

	describe('Permission Middleware', () => {
		it('should pass when user has required permission', async () => {
			(mockRequest as any).user = {
				id: 'user123',
				permissions: ['read', 'write', 'delete']
			};

			const middleware = createPermissionMiddleware(['write']);

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockNext).toHaveBeenCalled();
		});

		it('should return 403 when user lacks required permission', async () => {
			(mockRequest as any).user = {
				id: 'user123',
				permissions: ['read']
			};

			const middleware = createPermissionMiddleware(['delete']);

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toBe(403);
			expect(mockResponse.headers).toEqual({
				'Content-Type': 'application/json'
			});
			expect(JSON.parse(mockResponse.body as string)).toEqual({
				error: {
					message: 'Insufficient permissions',
					code: 'INSUFFICIENT_PERMISSIONS',
					required_permissions: ['delete'],
					user_permissions: ['read']
				}
			});
			expect(mockNext).not.toHaveBeenCalled();
		});
	});

	describe('Rate Limit Middleware', () => {
		it('should pass when under rate limit', async () => {
			mockRequest.headers = {
				'x-forwarded-for': '192.168.1.1'
			};

			const middleware = createRateLimitMiddleware({
				requests: 10,
				window: 60000 // 1 minute
			});

			// Make 5 requests (under limit)
			for (let i = 0; i < 5; i++) {
				await middleware(
					mockRequest as Request,
					mockResponse as Response,
					mockNext
				);
			}

			expect(mockNext).toHaveBeenCalledTimes(5);
			expect(mockResponse.status).toBe(200);
			expect(mockResponse.headers).toHaveProperty('X-RateLimit-Limit', '10');
			expect(mockResponse.headers).toHaveProperty('X-RateLimit-Window', '60000');
			expect(mockResponse.headers).toHaveProperty('X-RateLimit-Remaining');
		});

		it('should return 429 when rate limit exceeded', async () => {
			mockRequest.headers = {
				'x-forwarded-for': '192.168.1.1'
			};

			const middleware = createRateLimitMiddleware({
				requests: 3,
				window: 60000 // 1 minute
			});

			// Make 5 requests (exceeds limit)
			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toBe(429);
			expect(mockResponse.headers).toEqual({
				'Content-Type': 'application/json',
				'Retry-After': '60',
				'X-RateLimit-Limit': '3',
				'X-RateLimit-Window': '60000',
				'X-RateLimit-Remaining': '0'
			});
			expect(JSON.parse(mockResponse.body as string)).toEqual({
				error: {
					message: 'Rate limit exceeded',
					code: 'RATE_LIMIT_EXCEEDED',
					limit: 3,
					window: 60000,
					retry_after: 60
				}
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should handle different client IPs separately', async () => {
			const middleware = createRateLimitMiddleware({
				requests: 2,
				window: 60000
			});

			// Request from client 1
			const request1 = { ...mockRequest, headers: { 'x-forwarded-for': '192.168.1.1' } };
			await middleware(
				request1 as Request,
				mockResponse as Response,
				mockNext
			);

			// Request from client 2
			const request2 = { ...mockRequest, headers: { 'x-forwarded-for': '192.168.1.2' } };
			await middleware(
				request2 as Request,
				mockResponse as Response,
				vi.fn().mockResolvedValue(undefined)
			);

			expect(mockNext).toHaveBeenCalledTimes(2);
		});

		it('should use x-real-ip header when available', async () => {
			mockRequest.headers = {
				'x-real-ip': '10.0.0.1'
			};

			const middleware = createRateLimitMiddleware({
				requests: 2,
				window: 60000
			});

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockNext).toHaveBeenCalled();
		});
	});

	describe('Logging Middleware', () => {
		it('should log requests at info level', async () => {
			const consoleSpy = vi.spyOn(console, 'info');

			const middleware = createLoggingMiddleware({
				logLevel: 'info',
				logHeaders: true,
				logBody: true
			});

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(consoleSpy).toHaveBeenCalledWith(
				'[Virtual API Request]',
				expect.objectContaining({
					method: 'GET',
					url: '/api/test',
					user_agent: undefined,
					ip: 'unknown'
				})
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				'[Virtual API Response]',
				expect.objectContaining({
					status: 200
				})
			);

			consoleSpy.mockRestore();
		});

		it('should log requests at debug level', async () => {
			const consoleSpy = vi.spyOn(console, 'debug');

			const middleware = createLoggingMiddleware({
				logLevel: 'debug'
			});

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(consoleSpy).toHaveBeenCalledWith(
				'[Virtual API Request]',
				expect.any(Object)
			);

			consoleSpy.mockRestore();
		});

		it('should include headers when logHeaders is true', async () => {
			const consoleSpy = vi.spyOn(console, 'info');

			mockRequest.headers = {
				'authorization': 'Bearer token123',
				'content-type': 'application/json'
			};

			const middleware = createLoggingMiddleware({
				logHeaders: true
			});

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(consoleSpy).toHaveBeenCalledWith(
				'[Virtual API Request]',
				expect.objectContaining({
					headers: {
						'authorization': 'Bearer token123',
						'content-type': 'application/json'
					}
				})
			);

			consoleSpy.mockRestore();
		});

		it('should include body when logBody is true', async () => {
			const consoleSpy = vi.spyOn(console, 'info');

			mockRequest.body = { test: 'data' };

			const middleware = createLoggingMiddleware({
				logBody: true
			});

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(consoleSpy).toHaveBeenCalledWith(
				'[Virtual API Request]',
				expect.objectContaining({
					body: { test: 'data' }
				})
			);

			consoleSpy.mockRestore();
		});

		it('should not include headers when logHeaders is false', async () => {
			const consoleSpy = vi.spyOn(console, 'info');

			mockRequest.headers = {
				'authorization': 'Bearer token123'
			};

			const middleware = createLoggingMiddleware({
				logHeaders: false
			});

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			const logCall = consoleSpy.mock.calls.find(call =>
				call[0] === '[Virtual API Request]' &&
				typeof call[1] === 'object' &&
				!('headers' in call[1])
			);

			expect(logCall).toBeDefined();
			consoleSpy.mockRestore();
		});

		it('should not include body when logBody is false', async () => {
			const consoleSpy = vi.spyOn(console, 'info');

			mockRequest.body = { test: 'data' };

			const middleware = createLoggingMiddleware({
				logBody: false
			});

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			const logCall = consoleSpy.mock.calls.find(call =>
				call[0] === '[Virtual API Request]' &&
				typeof call[1] === 'object' &&
				!('body' in call[1])
			);

			expect(logCall).toBeDefined();
			consoleSpy.mockRestore();
		});

		it('should log errors at error level', async () => {
			const consoleSpy = vi.spyOn(console, 'error');

			const middleware = createLoggingMiddleware();

			// Simulate error in next function
			mockNext.mockRejectedValue(new Error('Test error'));

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(consoleSpy).toHaveBeenCalledWith(
				'[Virtual API Error]',
				expect.objectContaining({
					error: 'Test error'
				})
			);

			consoleSpy.mockRestore();
		});

		it('should generate unique request IDs', async () => {
			const consoleSpy = vi.spyOn(console, 'info');
			const requestIds: string[] = [];

			const middleware = createLoggingMiddleware();

			// Make multiple requests
			for (let i = 0; i < 5; i++) {
				await middleware(
					mockRequest as Request,
					mockResponse as Response,
					mockNext
				);

				const logCall = consoleSpy.mock.calls.find(call =>
					call[0] === '[Virtual API Request]'
				);

				if (logCall && typeof logCall[1] === 'object') {
					requestIds.push((logCall[1] as any).request_id);
				}
			}

			// Check that all request IDs are unique
			const uniqueIds = new Set(requestIds);
			expect(uniqueIds.size).toBe(5);

			consoleSpy.mockRestore();
		});

		it('should measure request duration', async () => {
			const consoleSpy = vi.spyOn(console, 'info');

			const middleware = createLoggingMiddleware();

			// Simulate slow next function
			mockNext.mockImplementation(async () => {
				await new Promise(resolve => setTimeout(resolve, 100));
			});

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			const responseLogCall = consoleSpy.mock.calls.find(call =>
				call[0] === '[Virtual API Response]'
			);

			expect(responseLogCall).toBeDefined();
			expect(typeof (responseLogCall as any)[1].duration_ms).toBe('number');
			expect((responseLogCall as any)[1].duration_ms).toBeGreaterThan(90);

			consoleSpy.mockRestore();
		});
	});

	describe('Middleware Composition', () => {
		it('should work with multiple middleware', async () => {
			const authFunction = vi.fn().mockResolvedValue({
				id: 'user123',
				roles: ['admin'],
				permissions: ['all']
			});

			const authMiddleware = createAuthMiddleware(authFunction);
			const roleMiddleware = createRoleMiddleware(['admin']);
			const loggingMiddleware = createLoggingMiddleware({ logLevel: 'warn' });

			// Chain middleware
			const composedMiddleware = async (request: Request, response: Response, next: () => Promise<void>) => {
				await authMiddleware(request, response, async () => {});
				await roleMiddleware(request, response, async () => {});
				await loggingMiddleware(request, response, next);
			};

			await composedMiddleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(authFunction).toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalled();
			expect((mockRequest as any).user).toEqual({
				id: 'user123',
				roles: ['admin'],
				permissions: ['all']
			});
		});
	});

	describe('Error Handling', () => {
		it('should handle middleware errors gracefully', async () => {
			const consoleSpy = vi.spyOn(console, 'error');

			const middleware = createLoggingMiddleware();

			// Mock next to throw error
			mockNext.mockRejectedValue(new Error('Middleware error'));

			await middleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toBe(500);
			expect(mockResponse.headers).toEqual({
				'Content-Type': 'application/json'
			});
			expect(JSON.parse(mockResponse.body as string)).toEqual({
				error: {
					message: 'Request logging error',
					details: 'Middleware error'
				}
			});

			consoleSpy.mockRestore();
		});
	});

	describe('Performance', () => {
		it('should handle high request volume efficiently', async () => {
			const middleware = createRateLimitMiddleware({
				requests: 1000,
				window: 60000
			});

			const startTime = Date.now();

			// Simulate 100 requests
			for (let i = 0; i < 100; i++) {
				mockRequest.headers = { 'x-forwarded-for': `192.168.1.${i % 255}` };
				await middleware(
					mockRequest as Request,
					mockResponse as Response,
					mockNext
				);
			}

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Should handle 100 requests in reasonable time
			expect(duration).toBeLessThan(1000); // Less than 1 second
		});
	});
});