/**
 * Tests for Virtual DocType API Handlers
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	handleQueryVirtual,
	handleRefreshVirtual,
	handleSchemaVirtual,
	handleListVirtual,
	handleTestConnection,
	extractQueryOptions,
	parseFilterValue,
	createResponse,
	createErrorResponse,
	validateContext,
	type VirtualRequestContext
} from '../handlers';
import type { VirtualDocType } from '../../../meta/doctype/virtual-doctype';
import { VirtualDocTypeNotFoundError } from '../../../meta/doctype/virtual-errors';

// Mock the module - Vitest will use __mocks__/virtual-manager.ts
vi.mock('../../../meta/doctype/virtual-manager');

// Import the mocked module to access the spies
import * as VirtualManagerModule from '../../../meta/doctype/virtual-manager';
const { mockMethods } = VirtualManagerModule as any;

describe('Virtual API Handlers', () => {
	let virtualDocType: VirtualDocType;
	let mockRequest: any;

	beforeEach(() => {
		// Replace all methods with fresh mocks to ensure no state leaks
		mockMethods.getVirtualDocType = vi.fn();
		mockMethods.getController = vi.fn();
		mockMethods.queryVirtualDocType = vi.fn();
		mockMethods.refreshVirtualDocType = vi.fn();
		mockMethods.getAllVirtualDocTypes = vi.fn();
		mockMethods.getVirtualDocTypesBySourceType = vi.fn();
		mockMethods.getVirtualDocTypesByStatus = vi.fn();
		mockMethods.testConnection = vi.fn();
		mockMethods.getAllPerformanceMetrics = vi.fn();
		mockMethods.getAllCacheStats = vi.fn();

		// Setup default success values
		mockMethods.getVirtualDocType.mockResolvedValue(null);
		mockMethods.getController.mockResolvedValue(null);
		mockMethods.queryVirtualDocType.mockResolvedValue({});
		mockMethods.refreshVirtualDocType.mockResolvedValue(undefined);
		mockMethods.getAllVirtualDocTypes.mockResolvedValue([]);
		mockMethods.getVirtualDocTypesBySourceType.mockResolvedValue([]);
		mockMethods.getVirtualDocTypesByStatus.mockResolvedValue([]);
		mockMethods.testConnection.mockResolvedValue(false);
		mockMethods.getAllPerformanceMetrics.mockResolvedValue({});
		mockMethods.getAllCacheStats.mockResolvedValue({});

		virtualDocType = {
			is_virtual: true,
			name: 'TestVirtual',
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

		mockRequest = {
			url: 'http://localhost:3000/api/virtual/TestVirtual',
			method: 'GET',
			headers: { host: 'localhost:3000' }
		};
	});

	describe('handleQueryVirtual', () => {
		it('should handle query request successfully', async () => {
			mockMethods.getVirtualDocType.mockResolvedValue(virtualDocType);
			mockMethods.queryVirtualDocType.mockResolvedValue({
				data: [
					{ id: 1, name: 'Test 1', email: 'test1@example.com' },
					{ id: 2, name: 'Test 2', email: 'test2@example.com' }
				],
				total_count: 2,
				current_page: 1,
				page_size: 10
			});

			const result = await handleQueryVirtual(mockRequest);

			expect(result.status).toBe(200);
			const body = JSON.parse(result.body);
			expect(body).toHaveProperty('data');
			expect(body.data).toHaveProperty('data');
			expect(mockMethods.queryVirtualDocType).toHaveBeenCalledWith(
				'TestVirtual',
				expect.any(Object)
			);
		});

		it('should handle query request with parameters', async () => {
			mockMethods.getVirtualDocType.mockResolvedValue(virtualDocType);
			mockMethods.queryVirtualDocType.mockResolvedValue({
				data: [{ id: 1, name: 'Test' }],
				total_count: 1
			});

			const requestWithQuery = {
				...mockRequest,
				url: 'http://localhost:3000/api/virtual/TestVirtual?filter[status]=active&fields=id,name&sort_by=name&sort_order=desc&page=2&limit=5&search=test'
			};

			const result = await handleQueryVirtual(requestWithQuery);

			expect(result.status).toBe(200);
			expect(mockMethods.queryVirtualDocType).toHaveBeenCalled();
		});

		it('should handle non-existent Virtual DocType', async () => {
			mockMethods.getVirtualDocType.mockResolvedValue(null);

			const result = await handleQueryVirtual(mockRequest);

			expect(result.status).toBe(500);
			const body = JSON.parse(result.body);
			expect(body).toHaveProperty('error');
		});
	});

	describe('handleRefreshVirtual', () => {
		it('should handle refresh request successfully', async () => {
			mockMethods.getVirtualDocType.mockResolvedValue(virtualDocType);

			const result = await handleRefreshVirtual(mockRequest);

			expect(result.status).toBe(200);
			const body = JSON.parse(result.body);
			expect(body.data).toHaveProperty('message');
			expect(mockMethods.refreshVirtualDocType).toHaveBeenCalledWith('TestVirtual');
		});

		it('should handle refresh request for non-existent Virtual DocType', async () => {
			mockMethods.getVirtualDocType.mockResolvedValue(null);

			const result = await handleRefreshVirtual(mockRequest);

			expect(result.status).toBe(500);
		});
	});

	/*
	describe('handleSchemaVirtual', () => {
		// TODO: Fix mock controller interaction
	});
	*/

	describe('handleListVirtual', () => {
		it('should handle list request successfully', async () => {
			mockMethods.getAllVirtualDocTypes.mockResolvedValue([virtualDocType]);

			const listRequest = {
				...mockRequest,
				url: 'http://localhost:3000/api/virtual'
			};

			const result = await handleListVirtual(listRequest);

			expect(result.status).toBe(200);
			const body = JSON.parse(result.body);
			expect(body.data).toHaveProperty('virtual_doctypes');
			expect(mockMethods.getAllVirtualDocTypes).toHaveBeenCalled();
		});
	});

	describe('handleTestConnection', () => {
		it('should handle test connection request successfully', async () => {
			const mockController = {
				testConnection: vi.fn().mockResolvedValue(true)
			};

			mockMethods.getVirtualDocType.mockResolvedValue(virtualDocType);
			mockMethods.getController.mockResolvedValue(mockController);

			const result = await handleTestConnection(mockRequest);

			expect(result.status).toBe(200);
			const body = JSON.parse(result.body);
			expect(body.data).toHaveProperty('connected');
			expect(mockController.testConnection).toHaveBeenCalled();
		});
	});

	describe('Utility Functions', () => {
		describe('extractQueryOptions', () => {
			it('should extract basic options', () => {
				const req = {
					...mockRequest,
					url: 'http://localhost:3000/api/virtual/TestVirtual?fields=id,name&limit=10&page=2'
				};
				const options = extractQueryOptions(req);
				expect(options.fields).toEqual(['id', 'name']);
				expect(options.pagination?.limit).toBe(10);
				expect(options.pagination?.page).toBe(2);
			});
		});

		describe('validateContext', () => {
			it('should throw if doctypeName is missing', () => {
				const context = {} as VirtualRequestContext;
				expect(() => validateContext(context)).toThrow('DocType name is required');
			});
		});
	});
});