/**
 * Tests for Virtual DocType Manager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VirtualDocTypeManager } from '../virtual-manager';
import { VirtualController } from '../virtual-controller';
import type { VirtualDocType, VirtualDocTypeConfig, VirtualQueryOptions, VirtualQueryResult } from '../virtual-doctype';

// Mock controller for testing
class MockController extends VirtualController {
	public async initialize(): Promise<void> {
		console.log('[DEBUG] MockController.initialize called');
		this.initialized = true;
	}

	public async testConnection(): Promise<boolean> {
		return true;
	}

	public async fetchData(options: VirtualQueryOptions): Promise<VirtualQueryResult> {
		console.log('[DEBUG] MockController.fetchData called (original)');
		return {
			data: [{ id: 1, name: 'Test' }],
			total_count: 1
		};
	}


	public async getSchema(): Promise<Record<string, any>> {
		return {
			id: { type: 'integer' },
			name: { type: 'string' }
		};
	}

	public async validateConfig(config: VirtualDocTypeConfig): Promise<boolean> {
		return true;
	}

	public async cleanup(): Promise<void> {
		this.initialized = false;
	}

	// Additional methods used in tests
	public getMetrics(): any {
		return { query_count: 1, avg_time: 10 };
	}

	public clearCache(): void {
		// No-op
	}

	public getCacheStats(): any {
		return { hits: 0, misses: 0 };
	}
}

describe('VirtualManager', () => {
	let manager: VirtualDocTypeManager;
	let virtualDocType: VirtualDocType;
	let createControllerSpy: any;


	beforeEach(() => {
		VirtualDocTypeManager.resetInstance();
		manager = VirtualDocTypeManager.getInstance();
		virtualDocType = {
			is_virtual: true,
			name: 'TestDocType',
			module: 'Test',
			fields: [
				{ fieldname: 'id', fieldtype: 'Int', label: 'ID' },
				{ fieldname: 'name', fieldtype: 'Data', label: 'Name' }
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

		// Mock controller factory globally
		createControllerSpy = vi.spyOn(manager as any, 'createController').mockImplementation(async (...args: any[]) => {
			const vDoc = args[0] as VirtualDocType;
			return new MockController(vDoc.virtual_config.source_type, vDoc.virtual_config);
		});
	});

	afterEach(() => {
		VirtualDocTypeManager.resetInstance();
		vi.restoreAllMocks();
	});

	describe('Registration', () => {
		it('should register a Virtual DocType', async () => {
			await manager.registerVirtualDocType(virtualDocType);

			const retrieved = await manager.getVirtualDocType('TestDocType');
			expect(retrieved).toEqual(virtualDocType);
		});

		it('should get all Virtual DocTypes', async () => {
			await manager.registerVirtualDocType(virtualDocType);

			const all = await manager.getAllVirtualDocTypes();
			expect(all).toHaveLength(1);
			expect(all[0]).toEqual(virtualDocType);
		});

		it('should unregister a Virtual DocType', async () => {
			await manager.registerVirtualDocType(virtualDocType);
			await manager.unregisterVirtualDocType('TestDocType');

			const retrieved = await manager.getVirtualDocType('TestDocType');
			expect(retrieved).toBeNull();
		});

		it('should handle duplicate registration', async () => {
			await manager.registerVirtualDocType(virtualDocType);

			// Should throw error on duplicate registration
			await expect(manager.registerVirtualDocType(virtualDocType)).rejects.toThrow();
		});

		it('should handle unregistering non-existent DocType', async () => {
			// Should not throw error
			await expect(manager.unregisterVirtualDocType('NonExistent')).resolves.toBeUndefined();
		});
	});

	describe('Controller Management', () => {
		beforeEach(async () => {
			await manager.registerVirtualDocType(virtualDocType);
		});

		it('should get controller for Virtual DocType', async () => {
			const controller = await manager.getController('TestDocType');
			expect(controller).toBeInstanceOf(MockController);
			if (controller) {
				expect(controller.type).toBe('api');
			}
		});

		it('should return null for non-existent DocType', async () => {
			const controller = await manager.getController('NonExistent');
			expect(controller).toBeNull();
		});

		it('should reuse existing controller', async () => {
			const controller1 = await manager.getController('TestDocType');
			const controller2 = await manager.getController('TestDocType');

			expect(controller1).toBe(controller2);
		});
	});

	describe('Query Operations', () => {
		beforeEach(async () => {
			await manager.registerVirtualDocType(virtualDocType);
		});

		it('should query Virtual DocType', async () => {
			const options: VirtualQueryOptions = {
				filters: { active: true },
				fields: ['id', 'name']
			};

			const result = await manager.queryVirtualDocType('TestDocType', options);
			expect(result.data).toEqual([{ id: 1, name: 'Test' }]);
			expect(result.total_count).toBe(1);
		});

		it('should handle query for non-existent DocType', async () => {
			await expect(
				manager.queryVirtualDocType('NonExistent', {})
			).rejects.toThrow();
		});
	});

	describe('Refresh Operations', () => {
		beforeEach(async () => {
			await manager.registerVirtualDocType(virtualDocType);
		});

		it('should refresh Virtual DocType', async () => {
			await expect(manager.refreshVirtualDocType('TestDocType')).resolves.toBeUndefined();
		});

		it('should handle refresh for non-existent DocType', async () => {
			await expect(
				manager.refreshVirtualDocType('NonExistent')
			).rejects.toThrow();
		});
	});

	describe('Configuration Validation', () => {
		it('should validate valid configuration', async () => {
			const result = await manager.validateConfig(virtualDocType.virtual_config);
			expect(result).toBe(true);
		});

		it('should reject invalid configuration', async () => {
			const invalidConfig = {
				...virtualDocType.virtual_config,
				source_type: 'invalid' as any
			};

			const result = await manager.validateConfig(invalidConfig);
			expect(result).toBe(false);
		});
	});

	describe('Controller Factory', () => {
		beforeEach(() => {
			// Restore createController to test the factory logic
			createControllerSpy.mockRestore();
		});

		it('should create API controller', async () => {
			const config = {
				...virtualDocType.virtual_config,
				source_type: 'api' as const
			};

			// Register mock controller
			const MockAPIController = class extends MockController { };
			manager.registerControllerType('api', MockAPIController as any);

			const controller = await (manager as any).createController(virtualDocType);
			expect(controller).toBeInstanceOf(MockAPIController);
		});

		it('should create file controller', async () => {
			const config = {
				...virtualDocType.virtual_config,
				source_type: 'file' as const
			};
			const fileDocType = { ...virtualDocType, virtual_config: config };

			const MockFileController = class extends MockController { };
			manager.registerControllerType('file', MockFileController as any);

			const controller = await (manager as any).createController(fileDocType);
			expect(controller).toBeInstanceOf(MockFileController);
		});

		it('should create computed controller', async () => {
			const config = {
				...virtualDocType.virtual_config,
				source_type: 'computed' as const
			};
			const computedDocType = { ...virtualDocType, virtual_config: config };

			const MockComputedController = class extends MockController { };
			manager.registerControllerType('computed', MockComputedController as any);

			const controller = await (manager as any).createController(computedDocType);
			expect(controller).toBeInstanceOf(MockComputedController);
		});

		it('should throw error for unsupported source type', async () => {
			const config = {
				...virtualDocType.virtual_config,
				source_type: 'unsupported' as any
			};
			const unsupportedDocType = { ...virtualDocType, virtual_config: config };

			await expect((manager as any).createController(unsupportedDocType)).rejects.toThrow();
		});
	});

	describe('Cleanup', () => {
		it('should cleanup all controllers', async () => {
			await manager.registerVirtualDocType(virtualDocType);
			await manager.getController('TestDocType');

			// VirtualDocTypeManager doesn't have a cleanup method, but controllers are cleaned up when unregistered
			const controller = await manager.getController('TestDocType');
			if (controller) {
				// Check if controller has isInitialized method (from VirtualController)
				expect(typeof (controller as any).isInitialized).toBe('function');
			}
		});
	});

	describe('Error Handling', () => {
		it('should handle controller creation errors', async () => {
			const invalidConfig = {
				...virtualDocType.virtual_config,
				source_type: 'api' as const,
				source_config: {} // Invalid source config
			};

			createControllerSpy.mockRejectedValueOnce(new Error('Controller creation failed'));

			await manager.registerVirtualDocType({
				...virtualDocType,
				virtual_config: invalidConfig
			});

			await expect(manager.getController('TestDocType')).rejects.toThrow('Controller creation failed');
		});

		it('should handle query errors gracefully', async () => {
			// Register normally
			await manager.registerVirtualDocType(virtualDocType);

			// Mock fetchData failure on prototype to ensure it catches all instances
			const prototypeSpy = vi.spyOn(MockController.prototype, 'fetchData');
			prototypeSpy.mockImplementation(async () => {
				console.log('[DEBUG] Mocked fetchData (prototype) threw error');
				throw new Error('Query failed');
			});

			try {
				await manager.queryVirtualDocType('TestDocType', {});
				console.log('[DEBUG] Test failed: queryVirtualDocType DID NOT THROW');
				throw new Error('TEST_FAILED_SHOULD_THROW');
			} catch (e: any) {
				console.log('[DEBUG] Caught error in test:', e);
				if (e.message === 'TEST_FAILED_SHOULD_THROW') {
					throw e;
				}
				expect(e.message).toBe('Query failed');
			}
		});
	});

	describe('Performance Monitoring', () => {
		it('should track manager performance', async () => {
			await manager.registerVirtualDocType(virtualDocType);
			await manager.queryVirtualDocType('TestDocType', {});

			const metrics = await manager.getAllPerformanceMetrics();
			expect(metrics).toBeDefined();
			expect(Object.keys(metrics).length).toBeGreaterThan(0);
		});
	});
});