/**
 * Virtual DocType Manager - Central Management
 * 
 * This module implements the VirtualDocTypeManager class for managing
 * Virtual DocTypes, their controllers, and lifecycle operations.
 */

import type {
	IVirtualController,
	IVirtualManager,
	VirtualDocType,
	VirtualQueryOptions,
	VirtualQueryResult,
	VirtualSourceType,
	VirtualDocTypeConfig
} from './virtual-doctype';
import { VirtualController } from './virtual-controller';
import { APIController } from './controllers/api-controller';
import { FileController } from './controllers/file-controller';
import { ComputedController } from './controllers/computed-controller';
import {
	VirtualManagerError,
	VirtualDocTypeNotFoundError,
	VirtualDocTypeExistsError,
	VirtualControllerNotFoundError,
	VirtualConfigError,
	VirtualErrorFactory
} from './virtual-errors';

// =============================================================================
// Virtual DocType Manager Implementation
// =============================================================================

/**
 * Manager for Virtual DocTypes and their controllers
 */
export class VirtualDocTypeManager implements IVirtualManager {
	/** Singleton instance */
	private static instance: VirtualDocTypeManager | null = null;

	/** Registered Virtual DocTypes */
	private virtualDocTypes: Map<string, VirtualDocType> = new Map();

	/** Active controllers by DocType name */
	private controllers: Map<string, IVirtualController> = new Map();

	/** Controller registry by type */
	private controllerRegistry: Map<VirtualSourceType, typeof VirtualController> = new Map();

	/** Registration lock for thread safety */
	private registrationLock: Promise<void> = Promise.resolve();

	/**
	 * Private constructor for singleton pattern
	 */
	private constructor() {
		// Register controller types
		this.controllerRegistry.set('api', APIController as any);
		this.controllerRegistry.set('file', FileController as any);
		this.controllerRegistry.set('computed', ComputedController as any);
		console.log(`[DEBUG] Registry initialized. Size: ${this.controllerRegistry.size}`);
	}

	/**
	 * Get the singleton instance
	 * @returns VirtualDocTypeManager instance
	 */
	public static getInstance(): VirtualDocTypeManager {
		if (!VirtualDocTypeManager.instance) {
			VirtualDocTypeManager.instance = new VirtualDocTypeManager();
		}
		return VirtualDocTypeManager.instance;
	}

	/**
	 * Reset the singleton instance (for testing)
	 */
	public static resetInstance(): void {
		VirtualDocTypeManager.instance = null;
	}

	// =============================================================================
	// Manager Interface Implementation
	// =============================================================================

	/**
	 * Register a Virtual DocType
	 * @param virtualDocType Virtual DocType to register
	 */
	public async registerVirtualDocType(virtualDocType: VirtualDocType): Promise<void> {
		const self = this;
		console.log(`[DEBUG] Registering ${virtualDocType.name}`);
		return this.acquireRegistrationLock(async () => {
			console.log('[DEBUG] Inside Registration Lock Operation. self matches this?', self === this);
			// Validate Virtual DocType
			// await self.validateVirtualDocType(virtualDocType);

			// Check if already exists
			if (this.virtualDocTypes.has(virtualDocType.name)) {
				console.log(`[DEBUG] ${virtualDocType.name} is already registered. Map size: ${this.virtualDocTypes.size}`);
				throw new VirtualDocTypeExistsError(virtualDocType.name);
			}

			// Create and initialize controller
			console.log('[DEBUG] Creating controller...');
			const controller = await this.createController(virtualDocType);
			console.log('[DEBUG] Controller created:', controller);
			await controller.initialize();

			// Store Virtual DocType and controller
			this.virtualDocTypes.set(virtualDocType.name, virtualDocType);
			this.controllers.set(virtualDocType.name, controller);
			console.log(`[DEBUG] Registered ${virtualDocType.name}. Map size: ${this.virtualDocTypes.size}. Controller map size: ${this.controllers.size}`);

			// Update Virtual DocType status
			virtualDocType.status = 'active';
			virtualDocType.last_refreshed = new Date();
		});
	}

	/**
	 * Unregister a Virtual DocType
	 * @param name Name of Virtual DocType to unregister
	 */
	public async unregisterVirtualDocType(name: string): Promise<void> {
		return this.acquireRegistrationLock(async () => {
			const virtualDocType = this.virtualDocTypes.get(name);
			if (!virtualDocType) {
				throw new VirtualDocTypeNotFoundError(name);
			}

			const controller = this.controllers.get(name);
			if (controller) {
				try {
					await controller.cleanup();
				} catch (error) {
					console.warn(`Error cleaning up controller for '${name}':`, error);
				}
			}

			// Remove from storage
			this.virtualDocTypes.delete(name);
			this.controllers.delete(name);
		});
	}

	/**
	 * Get a Virtual DocType
	 * @param name Name of Virtual DocType to retrieve
	 * @returns Virtual DocType or null if not found
	 */
	public async getVirtualDocType(name: string): Promise<VirtualDocType | null> {
		return this.virtualDocTypes.get(name) || null;
	}

	/**
	 * Get all Virtual DocTypes
	 * @returns Array of all Virtual DocTypes
	 */
	public async getAllVirtualDocTypes(): Promise<VirtualDocType[]> {
		return Array.from(this.virtualDocTypes.values());
	}

	/**
	 * Query a Virtual DocType
	 * @param name Name of Virtual DocType to query
	 * @param options Query options
	 * @returns Query result
	 */
	public async queryVirtualDocType(
		name: string,
		options: VirtualQueryOptions
	): Promise<VirtualQueryResult> {
		const controller = await this.getController(name);
		if (!controller) {
			throw new VirtualControllerNotFoundError(name, 'unknown');
		}

		try {
			const result = await controller.fetchData(options);

			// Update Virtual DocType metrics
			const virtualDocType = this.virtualDocTypes.get(name);
			if (virtualDocType && (controller as any).getMetrics) {
				virtualDocType.performance_metrics = (controller as any).getMetrics();
			}

			return result;
		} catch (error) {
			// Update Virtual DocType status on error
			const virtualDocType = this.virtualDocTypes.get(name);
			if (virtualDocType) {
				virtualDocType.status = 'error';
				virtualDocType.error_message = error instanceof Error ? error.message : String(error);
			}

			throw error;
		}
	}

	/**
	 * Refresh a Virtual DocType
	 * @param name Name of Virtual DocType to refresh
	 */
	public async refreshVirtualDocType(name: string): Promise<void> {
		const controller = await this.getController(name);
		if (!controller) {
			throw new VirtualControllerNotFoundError(name, 'unknown');
		}

		const virtualDocType = this.virtualDocTypes.get(name);
		if (!virtualDocType) {
			throw new VirtualDocTypeNotFoundError(name);
		}

		try {
			// Clear controller cache
			if ((controller as any).clearCache) {
				(controller as any).clearCache();
			}

			// Force refresh with empty options
			await controller.fetchData({ force_refresh: true });

			// Update Virtual DocType status
			virtualDocType.status = 'active';
			virtualDocType.last_refreshed = new Date();
			virtualDocType.error_message = undefined;

			// Calculate next refresh time based on refresh strategy
			virtualDocType.next_refresh = this.calculateNextRefresh(virtualDocType);
		} catch (error) {
			virtualDocType.status = 'error';
			virtualDocType.error_message = error instanceof Error ? error.message : String(error);
			throw error;
		}
	}

	/**
	 * Get controller for a Virtual DocType
	 * @param name Name of Virtual DocType
	 * @returns Controller instance or null if not found
	 */
	public async getController(name: string): Promise<IVirtualController | null> {
		const controller = this.controllers.get(name) || null;
		console.log(`[DEBUG] getController(${name}) -> ${controller ? 'Found' : 'Null'}. Map size: ${this.controllers.size}. Keys: ${Array.from(this.controllers.keys()).join(', ')}`);
		return controller;
	}

	/**
	 * Validate Virtual DocType configuration
	 * @param config Configuration to validate
	 * @returns True if valid
	 */
	public async validateConfig(config: VirtualDocTypeConfig): Promise<boolean> {
		try {
			// Get controller class for source type
			const ControllerClass = this.controllerRegistry.get(config.source_type);
			if (!ControllerClass) {
				console.log(`[DEBUG] Unsupported source type: ${config.source_type}. Registry keys: ${Array.from(this.controllerRegistry.keys()).join(', ')}`);
				throw new Error(`Unsupported source type: ${config.source_type}`);
			}

			// Create temporary controller instance for validation
			const tempController = new (ControllerClass as any)(config);
			return await tempController.validateConfig(config);
		} catch (error) {
			console.log('[DEBUG] validateConfig failed:', error);
			return false;
		}
	}

	// =============================================================================
	// Additional Management Methods
	// =============================================================================

	/**
	 * Get Virtual DocTypes by source type
	 * @param sourceType Source type to filter by
	 * @returns Array of Virtual DocTypes with specified source type
	 */
	public async getVirtualDocTypesBySourceType(
		sourceType: VirtualSourceType
	): Promise<VirtualDocType[]> {
		return Array.from(this.virtualDocTypes.values()).filter(
			vdoct => vdoct.virtual_config.source_type === sourceType
		);
	}

	/**
	 * Get Virtual DocTypes by status
	 * @param status Status to filter by
	 * @returns Array of Virtual DocTypes with specified status
	 */
	public async getVirtualDocTypesByStatus(
		status: 'active' | 'inactive' | 'error' | 'refreshing'
	): Promise<VirtualDocType[]> {
		return Array.from(this.virtualDocTypes.values()).filter(
			vdoct => vdoct.status === status
		);
	}

	/**
	 * Update Virtual DocType status
	 * @param name Name of Virtual DocType
	 * @param status New status
	 * @param errorMessage Optional error message
	 */
	public async updateVirtualDocTypeStatus(
		name: string,
		status: 'active' | 'inactive' | 'error' | 'refreshing',
		errorMessage?: string
	): Promise<void> {
		const virtualDocType = this.virtualDocTypes.get(name);
		if (!virtualDocType) {
			throw new VirtualDocTypeNotFoundError(name);
		}

		virtualDocType.status = status;
		if (errorMessage) {
			virtualDocType.error_message = errorMessage;
		} else {
			virtualDocType.error_message = undefined;
		}

		if (status === 'active') {
			virtualDocType.last_refreshed = new Date();
			virtualDocType.next_refresh = this.calculateNextRefresh(virtualDocType);
		}
	}

	/**
	 * Get performance metrics for all Virtual DocTypes
	 * @returns Performance metrics by DocType name
	 */
	public async getAllPerformanceMetrics(): Promise<Record<string, any>> {
		const metrics: Record<string, any> = {};

		for (const [name, controller] of this.controllers.entries()) {
			if ((controller as any).getMetrics) {
				metrics[name] = (controller as any).getMetrics();
			}
		}

		return metrics;
	}

	/**
	 * Get cache statistics for all Virtual DocTypes
	 * @returns Cache statistics by DocType name
	 */
	public async getAllCacheStats(): Promise<Record<string, any>> {
		const stats: Record<string, any> = {};

		for (const [name, controller] of this.controllers.entries()) {
			if ((controller as any).getCacheStats) {
				stats[name] = (controller as any).getCacheStats();
			}
		}

		return stats;
	}

	/**
	 * Clear all caches
	 */
	public async clearAllCaches(): Promise<void> {
		for (const controller of this.controllers.values()) {
			if ((controller as any).clearCache) {
				try {
					(controller as any).clearCache();
				} catch (error) {
					console.warn(`Error clearing cache:`, error);
				}
			}
		}
	}

	/**
	 * Test all Virtual DocType connections
	 * @returns Connection test results by DocType name
	 */
	public async testAllConnections(): Promise<Record<string, boolean>> {
		const results: Record<string, boolean> = {};

		for (const [name, controller] of this.controllers.entries()) {
			try {
				results[name] = await controller.testConnection();
			} catch (error) {
				results[name] = false;
			}
		}

		return results;
	}

	/**
	 * Get Virtual DocTypes that need refresh
	 * @returns Array of Virtual DocTypes that need refresh
	 */
	public async getVirtualDocTypesNeedingRefresh(): Promise<VirtualDocType[]> {
		const now = new Date();
		return Array.from(this.virtualDocTypes.values()).filter(vdoct =>
			vdoct.next_refresh && vdoct.next_refresh <= now
		);
	}

	/**
	 * Refresh all Virtual DocTypes that need refresh
	 * @returns Refresh results by DocType name
	 */
	public async refreshNeededVirtualDocTypes(): Promise<Record<string, boolean>> {
		const results: Record<string, boolean> = {};
		const needingRefresh = await this.getVirtualDocTypesNeedingRefresh();

		for (const virtualDocType of needingRefresh) {
			try {
				await this.refreshVirtualDocType(virtualDocType.name);
				results[virtualDocType.name] = true;
			} catch (error) {
				results[virtualDocType.name] = false;
			}
		}

		return results;
	}

	/**
	 * Get registered controller types
	 * @returns Array of registered controller types
	 */
	public getRegisteredControllerTypes(): VirtualSourceType[] {
		return Array.from(this.controllerRegistry.keys());
	}

	/**
	 * Register a custom controller type
	 * @param sourceType Source type
	 * @param controllerClass Controller class
	 */
	public registerControllerType(
		sourceType: VirtualSourceType,
		controllerClass: typeof VirtualController
	): void {
		this.controllerRegistry.set(sourceType, controllerClass);
	}

	/**
	 * Get total count of Virtual DocTypes
	 * @returns Total number of Virtual DocTypes
	 */
	public async getVirtualDocTypeCount(): Promise<number> {
		return this.virtualDocTypes.size;
	}

	/**
	 * Get total count of active controllers
	 * @returns Total number of active controllers
	 */
	public async getControllerCount(): Promise<number> {
		return this.controllers.size;
	}

	// =============================================================================
	// Private Helper Methods
	// =============================================================================

	/**
	 * Thread-safe registration using promise-based locking
	 * @param operation Async operation to perform
	 * @returns Promise that resolves to the operation result
	 */
	private async acquireRegistrationLock<T>(
		operation: () => Promise<T>
	): Promise<T> {
		console.log('[DEBUG] acquireRegistrationLock called');
		// Wait for any ongoing operation to complete
		try {
			await this.registrationLock;
		} catch (error) {
			// Ignore previous errors, continue with new operation
		}

		// Create new lock for this operation
		const newLock = this.performOperation(operation);
		this.registrationLock = newLock as Promise<void>;

		return newLock;
	}

	/**
	 * Perform operation with current lock
	 * @param operation Async operation to perform
	 * @returns Promise that resolves to the operation result
	 */
	private async performOperation<T>(
		operation: () => Promise<T>
	): Promise<T> {
		try {
			console.log('[DEBUG] performOperation: starting operation');
			const res = await operation();
			console.log('[DEBUG] performOperation: operation finished');
			return res;
		} finally {
			// Clear the lock when operation is complete
			// this.registrationLock = Promise.resolve();
		}
	}

	/**
	 * Validate Virtual DocType
	 * @param virtualDocType Virtual DocType to validate
	 */
	private async validateVirtualDocType(virtualDocType: VirtualDocType): Promise<void> {
		if (!virtualDocType) {
			throw new VirtualConfigError('Virtual DocType is required');
		}

		if (!virtualDocType.name) {
			throw new VirtualConfigError('Virtual DocType name is required');
		}

		if (!virtualDocType.virtual_config) {
			throw new VirtualConfigError('Virtual configuration is required');
		}

		// Validate configuration
		const isValid = await this.validateConfig(virtualDocType.virtual_config);
		if (!isValid) {
			throw new VirtualConfigError('Virtual configuration is invalid');
		}

		// Validate that Virtual DocType is marked as virtual
		if (!virtualDocType.is_virtual) {
			throw new VirtualConfigError('Virtual DocType must have is_virtual set to true');
		}
	}

	/**
	 * Create controller for Virtual DocType
	 * @param virtualDocType Virtual DocType to create controller for
	 * @returns Initialized controller
	 */
	private async createController(virtualDocType: VirtualDocType): Promise<IVirtualController> {
		const ControllerClass = this.controllerRegistry.get(
			virtualDocType.virtual_config.source_type
		);

		if (!ControllerClass) {
			throw new VirtualControllerNotFoundError(
				virtualDocType.name,
				virtualDocType.virtual_config.source_type
			);
		}

		// Create controller instance
		const controller = new (ControllerClass as any)(virtualDocType.virtual_config);

		// For computed controller, pass DocType engine
		if (virtualDocType.virtual_config.source_type === 'computed') {
			const computedController = controller as ComputedController;
			// In a real implementation, this would get the DocType engine
			// For now, we'll pass undefined
		}

		return controller;
	}

	/**
	 * Calculate next refresh time based on refresh strategy
	 * @param virtualDocType Virtual DocType
	 * @returns Next refresh time
	 */
	private calculateNextRefresh(virtualDocType: VirtualDocType): Date | undefined {
		const config = virtualDocType.virtual_config;

		switch (config.refresh_strategy) {
			case 'manual':
				return undefined;

			case 'time-based':
				if (!config.cache_duration) return undefined;
				const now = new Date();
				return new Date(now.getTime() + config.cache_duration * 1000);

			case 'event-based':
				// Event-based refresh would be triggered by external events
				return undefined;

			case 'hybrid':
				// Hybrid would combine time-based with events
				if (!config.cache_duration) return undefined;
				const hybridNow = new Date();
				return new Date(hybridNow.getTime() + config.cache_duration * 1000);

			default:
				return undefined;
		}
	}
}