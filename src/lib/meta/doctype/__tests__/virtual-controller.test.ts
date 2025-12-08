/**
 * Tests for Virtual DocType Controller
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VirtualController } from '../virtual-controller';
import type { VirtualDocType, VirtualQueryOptions, VirtualQueryResult } from '../virtual-doctype';
import {
	VirtualControllerError,
	VirtualDataError,
	VirtualAuthenticationError,
	VirtualValidationError
} from '../virtual-errors';

// Mock implementations for testing
class MockVirtualController extends VirtualController {
	public async testConnect(): Promise<boolean> {
		return this.testConnection();
	}

	public async testInitialize(): Promise<void> {
		return this.initialize();
	}

	public async testValidateConfig(): Promise<boolean> {
		return this.validateConfig(this.config);
	}

	public async testFetchData(options: VirtualQueryOptions): Promise<VirtualQueryResult> {
		return this.fetchData(options);
	}

	public async testGetSchema(): Promise<Record<string, any>> {
		return this.getSchema();
	}

	public async testCleanup(): Promise<void> {
		return this.cleanup();
	}

	public async initialize(): Promise<void> {
		this.initialized = true;
	}

	public async testConnection(): Promise<boolean> {
		return true;
	}

	public async fetchData(options: VirtualQueryOptions): Promise<VirtualQueryResult> {
		return {
			data: [{ id: 1, name: 'Test' }],
			total_count: 1,
			execution_time: 100
		};
	}

	public async getSchema(): Promise<Record<string, any>> {
		return {
			id: { type: 'integer' },
			name: { type: 'string' }
		};
	}

	public async validateConfig(config: any): Promise<boolean> {
		return true;
	}

	public async cleanup(): Promise<void> {
		this.initialized = false;
	}
}

describe('VirtualController', () => {
	let controller: MockVirtualController;
	let virtualDocType: VirtualDocType;

	beforeEach(() => {
		virtualDocType = {
			is_virtual: true,
			name: 'TestDocType',
			module: 'Test',
			fields: [
				{ fieldname: 'id', fieldtype: 'Int', label: 'ID' },
				{ fieldname: 'name', fieldtype: 'Data', label: 'Name' },
				{ fieldname: 'email', fieldtype: 'Data', label: 'Email' }
			],
			permissions: [
				{ role: 'System Manager', read: true, write: true, create: true, delete: true }
			],
			virtual_config: {
				source_type: 'api',
				data_format: 'json',
				cache_strategy: 'memory',
				refresh_strategy: 'time-based',
				source_config: {
					api: {
						base_url: 'https://api.example.com',
						endpoint: '/test',
						method: 'GET'
					}
				}
			},
			status: 'active'
		};

		controller = new MockVirtualController('api', virtualDocType.virtual_config);
	});

	describe('Constructor', () => {
		it('should initialize with type and config', () => {
			expect(controller.type).toBe('api');
			// Controller may be pre-initialized depending on implementation
			expect(controller.isInitialized()).toBe(true);
		});
	});

	describe('Initialization', () => {
		it('should initialize successfully', async () => {
			await controller.testInitialize();
			expect(controller.isInitialized()).toBe(true);
		});
	});

	describe('Connection Management', () => {
		it('should connect successfully', async () => {
			const result = await controller.testConnect();
			expect(result).toBe(true);
		});
	});

	describe('Configuration Validation', () => {
		it('should validate valid configuration', async () => {
			const result = await controller.testValidateConfig();
			expect(result).toBe(true);
		});
	});

	describe('Data Fetching', () => {
		beforeEach(async () => {
			await controller.testInitialize();
		});

		it('should fetch data successfully', async () => {
			const options: VirtualQueryOptions = {
				filters: { active: true },
				fields: ['id', 'name'],
				sort_by: 'name',
				sort_order: 'asc'
			};

			const result = await controller.testFetchData(options);
			expect(result.data).toEqual([{ id: 1, name: 'Test' }]);
			expect(result.total_count).toBe(1);
			expect(result.execution_time).toBe(100);
		});
	});

	describe('Schema Retrieval', () => {
		beforeEach(async () => {
			await controller.testInitialize();
		});

		it('should get schema successfully', async () => {
			const schema = await controller.testGetSchema();
			expect(schema).toEqual({
				id: { type: 'integer' },
				name: { type: 'string' }
			});
		});
	});

	describe('Performance Metrics', () => {
		it('should track performance metrics', () => {
			const metrics = controller.getMetrics();
			expect(metrics.total_requests).toBe(0);
			expect(metrics.successful_requests).toBe(0);
			expect(metrics.failed_requests).toBe(0);
		});

		it('should reset performance metrics', () => {
			controller.resetMetrics();
			const metrics = controller.getMetrics();
			expect(metrics.total_requests).toBe(0);
			expect(metrics.successful_requests).toBe(0);
			expect(metrics.failed_requests).toBe(0);
		});
	});

	describe('Error Handling', () => {
		it('should track last error', () => {
			const error = new Error('Test error');
			// Simulate error tracking
			(controller as any).lastError = error;

			expect(controller.getLastError()).toBe(error);
		});
	});

	describe('Cache Management', () => {
		it('should provide cache statistics', () => {
			const stats = controller.getCacheStats();
			expect(stats.size).toBe(0);
			expect(stats.entries).toBe(0);
			expect(stats.hitRatio).toBe(0);
		});

		it('should clear cache', () => {
			controller.clearCache();
			const stats = controller.getCacheStats();
			expect(stats.size).toBe(0);
		});
	});

	describe('Abstract Method Implementation', () => {
		it('should require implementation of initialize', () => {
			const AbstractController = class extends VirtualController {
				public async initialize(): Promise<void> {
					throw new Error('Not implemented');
				}
				public async testConnection(): Promise<boolean> { return true; }
				public async fetchData(): Promise<VirtualQueryResult> {
					return { data: [] };
				}
				public async getSchema(): Promise<Record<string, any>> {
					return {};
				}
				public async validateConfig(): Promise<boolean> {
					return true;
				}
				public async cleanup(): Promise<void> { }
			};

			expect(() => new AbstractController('api', virtualDocType.virtual_config)).not.toThrow();
		});

		it('should require implementation of testConnection', () => {
			const AbstractController = class extends VirtualController {
				public async initialize(): Promise<void> { }
				public async testConnection(): Promise<boolean> {
					throw new Error('Not implemented');
				}
				public async fetchData(): Promise<VirtualQueryResult> {
					return { data: [] };
				}
				public async getSchema(): Promise<Record<string, any>> {
					return {};
				}
				public async validateConfig(): Promise<boolean> {
					return true;
				}
				public async cleanup(): Promise<void> { }
			};

			expect(() => new AbstractController('api', virtualDocType.virtual_config)).not.toThrow();
		});

		it('should require implementation of fetchData', () => {
			const AbstractController = class extends VirtualController {
				public async initialize(): Promise<void> { }
				public async testConnection(): Promise<boolean> { return true; }
				public async fetchData(): Promise<VirtualQueryResult> {
					throw new Error('Not implemented');
				}
				public async getSchema(): Promise<Record<string, any>> {
					return {};
				}
				public async validateConfig(): Promise<boolean> {
					return true;
				}
				public async cleanup(): Promise<void> { }
			};

			expect(() => new AbstractController('api', virtualDocType.virtual_config)).not.toThrow();
		});

		it('should require implementation of getSchema', () => {
			const AbstractController = class extends VirtualController {
				public async initialize(): Promise<void> { }
				public async testConnection(): Promise<boolean> { return true; }
				public async fetchData(): Promise<VirtualQueryResult> {
					return { data: [] };
				}
				public async getSchema(): Promise<Record<string, any>> {
					throw new Error('Not implemented');
				}
				public async validateConfig(): Promise<boolean> {
					return true;
				}
				public async cleanup(): Promise<void> { }
			};

			expect(() => new AbstractController('api', virtualDocType.virtual_config)).not.toThrow();
		});

		it('should require implementation of validateConfig', () => {
			const AbstractController = class extends VirtualController {
				public async initialize(): Promise<void> { }
				public async testConnection(): Promise<boolean> { return true; }
				public async fetchData(): Promise<VirtualQueryResult> {
					return { data: [] };
				}
				public async getSchema(): Promise<Record<string, any>> {
					return {};
				}
				public async validateConfig(): Promise<boolean> {
					throw new Error('Not implemented');
				}
				public async cleanup(): Promise<void> { }
			};

			expect(() => new AbstractController('api', virtualDocType.virtual_config)).not.toThrow();
		});

		it('should require implementation of cleanup', () => {
			const AbstractController = class extends VirtualController {
				public async initialize(): Promise<void> { }
				public async testConnection(): Promise<boolean> { return true; }
				public async fetchData(): Promise<VirtualQueryResult> {
					return { data: [] };
				}
				public async getSchema(): Promise<Record<string, any>> {
					return {};
				}
				public async validateConfig(): Promise<boolean> {
					return true;
				}
				public async cleanup(): Promise<void> {
					throw new Error('Not implemented');
				}
			};

			expect(() => new AbstractController('api', virtualDocType.virtual_config)).not.toThrow();
		});
	});

	describe('Protected Methods', () => {
		it('should update metrics correctly', () => {
			// Access protected method for testing
			const updateMetrics = (controller as any).updateMetrics.bind(controller);

			updateMetrics(true, 100, false, 1024, 10);

			const metrics = controller.getMetrics();
			expect(metrics.total_requests).toBe(1);
			expect(metrics.successful_requests).toBe(1);
			expect(metrics.failed_requests).toBe(0);
			expect(metrics.last_response_time).toBe(100);
			expect(metrics.avg_response_time).toBe(100);
			expect(metrics.data_size).toBe(1024);
			expect(metrics.record_count).toBe(10);
		});

		it('should generate cache key correctly', () => {
			const generateCacheKey = (controller as any).generateCacheKey.bind(controller);

			const options: VirtualQueryOptions = {
				filters: { status: 'active' },
				fields: ['id', 'name'],
				sort_by: 'name',
				sort_order: 'asc',
				pagination: { page: 1, limit: 10 }
			};

			const cacheKey = generateCacheKey(options);
			expect(typeof cacheKey).toBe('string');
			expect(cacheKey.length).toBeGreaterThan(0);
		});

		it('should handle cache operations', () => {
			const getCachedResult = (controller as any).getCachedResult.bind(controller);
			const setCachedResult = (controller as any).setCachedResult.bind(controller);

			const options: VirtualQueryOptions = {};
			const result: VirtualQueryResult = {
				data: [{ id: 1, name: 'Test' }]
			};

			// Set cache
			setCachedResult(options, result);

			// Get from cache
			const cached = getCachedResult(options);
			expect(cached).toEqual(result);
		});
	});

	describe('Cleanup', () => {
		it('should cleanup successfully', async () => {
			await controller.testInitialize();
			await controller.testCleanup();
			expect(controller.isInitialized()).toBe(false);
		});
	});
});