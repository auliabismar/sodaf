/**
 * DocType Engine - Core Implementation
 * 
 * This module implements the DocTypeEngine class for registering, retrieving,
 * and managing DocType definitions with comprehensive validation and thread safety.
 */

import type { DocType } from './types';
import { DocTypeValidator } from './validator';
import {
	DocTypeError,
	DocTypeExistsError,
	DocTypeNotFoundError,
	DocTypeValidationError
} from './errors';
import type { ValidationResult } from './errors';
import { MetaCache } from './meta-cache';
import type { DocTypeMeta } from './meta';

// Re-export error classes for convenience
export {
	DocTypeError,
	DocTypeExistsError,
	DocTypeNotFoundError,
	DocTypeValidationError
};

export type { ValidationResult };

/**
 * DocTypeEngine class for managing DocType definitions
 * Implements singleton pattern for global access
 */
export class DocTypeEngine {
	private static instance: DocTypeEngine | null = null;
	private doctypes: Map<string, DocType> = new Map();
	private moduleIndex: Map<string, Set<string>> = new Map();
	private registrationLock: Promise<void> = Promise.resolve();

	/**
	 * Private constructor for singleton pattern
	 */
	private constructor() {}

	/**
	 * Get the singleton instance of DocTypeEngine
	 * @returns DocTypeEngine instance
	 */
	public static getInstance(): DocTypeEngine {
		if (!DocTypeEngine.instance) {
			DocTypeEngine.instance = new DocTypeEngine();
		}
		return DocTypeEngine.instance;
	}

	/**
	 * Reset the singleton instance (for testing purposes)
	 */
	public static resetInstance(): void {
		DocTypeEngine.instance = null;
	}

	/**
	 * Register a new DocType definition
	 * @param doctype DocType definition to register
	 * @throws DocTypeExistsError if DocType already exists
	 * @throws DocTypeValidationError if validation fails
	 */
	public async registerDocType(doctype: DocType): Promise<void> {
		return this.acquireRegistrationLock(async () => {
			// Validate DocType
			const validationResult = DocTypeValidator.validateDocType(doctype);
			if (!validationResult.valid) {
				throw new DocTypeValidationError(
					`DocType validation failed for '${doctype.name}'`,
					validationResult.errors
				);
			}

			// Check if DocType already exists
			if (this.doctypes.has(doctype.name)) {
				throw new DocTypeExistsError(doctype.name);
			}

			// Store DocType
			this.doctypes.set(doctype.name, doctype);

			// Update module index
			if (!this.moduleIndex.has(doctype.module)) {
				this.moduleIndex.set(doctype.module, new Set());
			}
			this.moduleIndex.get(doctype.module)!.add(doctype.name);

			// Invalidate cache for this DocType
			try {
				const cache = MetaCache.getInstance(this);
				cache.invalidateMeta(doctype.name);
			} catch {
				// Cache not initialized yet, ignore
			}
		});
	}

	/**
	 * Unregister a DocType definition
	 * @param doctypeName Name of DocType to unregister
	 * @throws DocTypeNotFoundError if DocType not found
	 */
	public async unregisterDocType(doctypeName: string): Promise<void> {
		return this.acquireRegistrationLock(async () => {
			const doctype = this.doctypes.get(doctypeName);
			if (!doctype) {
				throw new DocTypeNotFoundError(doctypeName);
			}

			// Remove from main storage
			this.doctypes.delete(doctypeName);

			// Remove from module index
			const moduleDocTypes = this.moduleIndex.get(doctype.module);
			if (moduleDocTypes) {
				moduleDocTypes.delete(doctypeName);
				if (moduleDocTypes.size === 0) {
					this.moduleIndex.delete(doctype.module);
				}
			}

			// Invalidate cache for this DocType
			try {
				const cache = MetaCache.getInstance(this);
				cache.invalidateMeta(doctypeName);
			} catch {
				// Cache not initialized yet, ignore
			}
		});
	}

	/**
	 * Get a specific DocType by name
	 * @param doctypeName Name of DocType to retrieve
	 * @returns DocType definition or null if not found
	 */
	public async getDocType(doctypeName: string): Promise<DocType | null> {
		// No lock needed for read operations
		return this.doctypes.get(doctypeName) || null;
	}

	/**
	 * Get all registered DocTypes
	 * @returns Array of all DocType definitions
	 */
	public async getAllDocTypes(): Promise<DocType[]> {
		// No lock needed for read operations
		return Array.from(this.doctypes.values());
	}

	/**
	 * Get DocTypes by module
	 * @param moduleName Module name to filter by
	 * @returns Array of DocType definitions in the specified module
	 */
	public async getDocTypesByModule(moduleName: string): Promise<DocType[]> {
		// No lock needed for read operations
		const moduleDocTypes = this.moduleIndex.get(moduleName);
		if (!moduleDocTypes) {
			return [];
		}

		const result: DocType[] = [];
		for (const doctypeName of moduleDocTypes) {
			const doctype = this.doctypes.get(doctypeName);
			if (doctype) {
				result.push(doctype);
			}
		}

		return result;
	}

	/**
	 * Check if DocType is registered
	 * @param doctypeName Name of DocType to check
	 * @returns True if registered, false otherwise
	 */
	public async isRegistered(doctypeName: string): Promise<boolean> {
		// No lock needed for read operations
		return this.doctypes.has(doctypeName);
	}

	/**
	 * Get total count of registered DocTypes
	 * @returns Total number of registered DocTypes
	 */
	public async getDocTypeCount(): Promise<number> {
		// No lock needed for read operations
		return this.doctypes.size;
	}

	/**
	 * Validate a DocType definition without registering it
	 * @param doctype DocType definition to validate
	 * @returns ValidationResult with validation status and errors
	 */
	public async validateDocType(doctype: DocType): Promise<ValidationResult> {
		// No lock needed for validation operations
		return DocTypeValidator.validateDocType(doctype);
	}

	/**
	 * Get all modules that have registered DocTypes
	 * @returns Array of module names
	 */
	public async getAllModules(): Promise<string[]> {
		// No lock needed for read operations
		return Array.from(this.moduleIndex.keys());
	}

	/**
	 * Get count of DocTypes in a specific module
	 * @param moduleName Module name to count DocTypes for
	 * @returns Number of DocTypes in the specified module
	 */
	public async getDocTypeCountByModule(moduleName: string): Promise<number> {
		// No lock needed for read operations
		const moduleDocTypes = this.moduleIndex.get(moduleName);
		return moduleDocTypes ? moduleDocTypes.size : 0;
	}

	/**
	 * Thread-safe registration using promise-based locking
	 * @param operation Async operation to perform with lock
	 * @returns Promise that resolves to the operation result
	 */
	private async acquireRegistrationLock<T>(
		operation: () => Promise<T>
	): Promise<T> {
		// Wait for any ongoing operation to complete
		await this.registrationLock;

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
			return await operation();
		} finally {
			// Clear the lock when operation is complete
			this.registrationLock = Promise.resolve();
		}
	}

	/**
		* Get MetaCache instance for this DocTypeEngine
		* @returns MetaCache instance
		*/
	public getMetaCache(): MetaCache {
		return MetaCache.getInstance(this);
	}

	/**
		* Get DocTypeMeta instance for a DocType
		* @param doctypeName Name of the DocType to get Meta for
		* @returns Promise resolving to DocTypeMeta instance or null if not found
		*/
	public async getDocTypeMeta(doctypeName: string): Promise<DocTypeMeta | null> {
		const cache = this.getMetaCache();
		return cache.getMeta(doctypeName);
	}

	/**
		* Reload DocTypeMeta instance for a DocType
		* @param doctypeName Name of the DocType to reload Meta for
		* @returns Promise resolving to DocTypeMeta instance or null if not found
		*/
	public async reloadDocTypeMeta(doctypeName: string): Promise<DocTypeMeta | null> {
		const cache = this.getMetaCache();
		return cache.reloadMeta(doctypeName);
	}

	/**
		* Invalidate DocTypeMeta cache for a DocType
		* @param doctypeName Name of the DocType to invalidate cache for
		*/
	public invalidateDocTypeMeta(doctypeName: string): void {
		const cache = this.getMetaCache();
		cache.invalidateMeta(doctypeName);
	}

	/**
		* Clear all DocTypeMeta cache
		*/
	public clearDocTypeMetaCache(): void {
		const cache = this.getMetaCache();
		cache.clearCache();
	}
}