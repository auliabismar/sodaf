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
import { CustomFieldManager, PropertySetterManager } from '../custom';

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
	private customFieldManager: CustomFieldManager;
	private propertySetterManager: PropertySetterManager;

	/**
	 * Private constructor for singleton pattern
	 */
	private constructor() {
		this.customFieldManager = CustomFieldManager.getInstance();
		this.propertySetterManager = PropertySetterManager.getInstance();
	}

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
		if (DocTypeEngine.instance) {
			// Clear internal state before resetting
			DocTypeEngine.instance.doctypes.clear();
			DocTypeEngine.instance.moduleIndex.clear();
		}
		DocTypeEngine.instance = null;
		
		// Also reset the MetaCache singleton
		MetaCache.resetInstance();
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
			// Note: We don't directly invalidate cache here to avoid circular dependencies
			// The cache should be invalidated by the caller if needed
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
	 * @param includeCustomFields Whether to include custom fields in the meta
	 * @returns Promise resolving to DocTypeMeta instance or null if not found
	 */
	public async getDocTypeMeta(
		doctypeName: string,
		includeCustomFields: boolean = true,
		includePropertySetters: boolean = true
	): Promise<DocTypeMeta | null> {
		const cache = this.getMetaCache();
		return cache.getMeta(doctypeName, includeCustomFields, includePropertySetters);
	}

	/**
	 * Reload DocTypeMeta instance for a DocType
	 * @param doctypeName Name of the DocType to reload Meta for
	 * @param includeCustomFields Whether to include custom fields in the meta
	 * @returns Promise resolving to DocTypeMeta instance or null if not found
	 */
	public async reloadDocTypeMeta(
		doctypeName: string,
		includeCustomFields: boolean = true,
		includePropertySetters: boolean = true
	): Promise<DocTypeMeta | null> {
		const cache = this.getMetaCache();
		return cache.reloadMeta(doctypeName, includeCustomFields, includePropertySetters);
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

	// =============================================================================
	// Virtual DocType Support
	// =============================================================================

	/**
	* Check if a DocType is virtual
	* @param doctypeName Name of the DocType to check
	* @returns True if DocType is virtual
	*/
	public async isVirtualDocType(doctypeName: string): Promise<boolean> {
		const doctype = await this.getDocType(doctypeName);
		return doctype?.is_virtual || false;
	}

	/**
	* Get Virtual DocType manager instance
	* @returns Virtual DocType manager instance
	*/
	public getVirtualDocTypeManager(): any {
		try {
			// Import VirtualDocTypeManager dynamically to avoid circular dependencies
			const { VirtualDocTypeManager } = require('./virtual-manager');
			return VirtualDocTypeManager.getInstance();
		} catch (error) {
			console.warn('Failed to get Virtual DocType manager:', error);
			return null;
		}
	}

	/**
	* Register a Virtual DocType
	* @param virtualDocType Virtual DocType to register
	*/
	public async registerVirtualDocType(virtualDocType: any): Promise<void> {
		const virtualManager = this.getVirtualDocTypeManager();
		if (virtualManager) {
			await virtualManager.registerVirtualDocType(virtualDocType);
		} else {
			throw new Error('Virtual DocType manager not available');
		}
	}

	/**
	* Unregister a Virtual DocType
	* @param doctypeName Name of the Virtual DocType to unregister
	*/
	public async unregisterVirtualDocType(doctypeName: string): Promise<void> {
		const virtualManager = this.getVirtualDocTypeManager();
		if (virtualManager) {
			await virtualManager.unregisterVirtualDocType(doctypeName);
		} else {
			throw new Error('Virtual DocType manager not available');
		}
	}

	/**
	* Get a Virtual DocType
	* @param doctypeName Name of the Virtual DocType to get
	* @returns Virtual DocType or null
	*/
	public async getVirtualDocType(doctypeName: string): Promise<any> {
		const virtualManager = this.getVirtualDocTypeManager();
		if (virtualManager) {
			return await virtualManager.getVirtualDocType(doctypeName);
		} else {
			throw new Error('Virtual DocType manager not available');
		}
	}

	/**
	* Query a Virtual DocType
	* @param doctypeName Name of the Virtual DocType to query
	* @param options Query options
	* @returns Query result
	*/
	public async queryVirtualDocType(doctypeName: string, options: any): Promise<any> {
		const virtualManager = this.getVirtualDocTypeManager();
		if (virtualManager) {
			return await virtualManager.queryVirtualDocType(doctypeName, options);
		} else {
			throw new Error('Virtual DocType manager not available');
		}
	}

	/**
	* Refresh a Virtual DocType
	* @param doctypeName Name of the Virtual DocType to refresh
	*/
	public async refreshVirtualDocType(doctypeName: string): Promise<void> {
		const virtualManager = this.getVirtualDocTypeManager();
		if (virtualManager) {
			await virtualManager.refreshVirtualDocType(doctypeName);
		} else {
			throw new Error('Virtual DocType manager not available');
		}
	}

	// =============================================================================
	// Custom Field Support
	// =============================================================================

	/**
	 * Get CustomFieldManager instance
	 * @returns CustomFieldManager instance
	 */
	public getCustomFieldManager(): CustomFieldManager {
		return this.customFieldManager;
	}

	/**
	 * Get PropertySetterManager instance
	 * @returns PropertySetterManager instance
	 */
	public getPropertySetterManager(): PropertySetterManager {
		return this.propertySetterManager;
	}

	/**
	 * Set PropertySetterManager instance (for testing)
	 * @param propertySetterManager PropertySetterManager instance to set
	 */
	public setPropertySetterManager(propertySetterManager: PropertySetterManager): void {
		this.propertySetterManager = propertySetterManager;
	}

	/**
	 * Get a DocType with custom fields merged
	 * @param doctypeName Name of the DocType to get
	 * @returns Promise resolving to DocType with custom fields merged or null if not found
	 */
	public async getDocTypeWithCustomFields(doctypeName: string): Promise<DocType | null> {
		const doctype = await this.getDocType(doctypeName);
		if (!doctype) {
			return null;
		}

		return await this.customFieldManager.mergeCustomFields(doctype);
	}

	/**
	 * Create a custom field for a DocType
	 * @param doctypeName Name of the DocType to add custom field to
	 * @param options Custom field creation options
	 * @returns Promise resolving to created custom field
	 */
	public async createCustomField(doctypeName: string, options: any): Promise<any> {
		// Check if DocType exists
		const doctype = await this.getDocType(doctypeName);
		if (!doctype) {
			throw new DocTypeNotFoundError(doctypeName);
		}

		// Get existing field names
		const existingFields = doctype.fields.map(f => f.fieldname);

		// Create custom field with DocType context
		const customFieldOptions = {
			...options,
			dt: doctypeName
		};

		const customField = await this.customFieldManager.createCustomField(customFieldOptions, existingFields);

		// Invalidate cache for this DocType
		this.invalidateDocTypeMeta(doctypeName);

		return customField;
	}

	/**
	 * Update a custom field for a DocType
	 * @param doctypeName Name of the DocType
	 * @param fieldname Name of the field to update
	 * @param options Update options
	 * @returns Promise resolving to updated custom field
	 */
	public async updateCustomField(doctypeName: string, fieldname: string, options: any): Promise<any> {
		// Check if DocType exists
		const doctype = await this.getDocType(doctypeName);
		if (!doctype) {
			throw new DocTypeNotFoundError(doctypeName);
		}

		// Get existing field names
		const existingFields = doctype.fields.map(f => f.fieldname);

		// Update custom field
		const customField = await this.customFieldManager.updateCustomField(doctypeName, fieldname, options, existingFields);

		// Invalidate cache for this DocType
		this.invalidateDocTypeMeta(doctypeName);

		return customField;
	}

	// =============================================================================
	// Property Setter Support
	// =============================================================================

	/**
		* Set a property for a DocType or field
		* @param doctypeName Name of the DocType
		* @param fieldname Name of the field (undefined for DocType-level setters)
		* @param property Property name to set
		* @param value Property value
		* @param options Additional options
		* @returns Promise resolving to created property setter
		*/
	public async setProperty(
		doctypeName: string,
		fieldname: string | undefined,
		property: string,
		value: any,
		options: any = {}
	): Promise<any> {
		// Check if DocType exists
		const doctype = await this.getDocType(doctypeName);
		if (!doctype) {
			throw new DocTypeNotFoundError(doctypeName);
		}

		// Create property setter
		const propertySetter = await this.propertySetterManager.setProperty({
			doctype: doctypeName,
			fieldname,
			property,
			value,
			...options
		});

		// Invalidate cache for this DocType
		this.invalidateDocTypeMeta(doctypeName);

		return propertySetter;
	}

	/**
		* Remove a property setter
		* @param doctypeName Name of the DocType
		* @param fieldname Name of the field (undefined for DocType-level setters)
		* @param property Property name (undefined to remove all properties for field/DocType)
		* @returns Promise resolving to removed property setter(s)
		*/
	public async removeProperty(
		doctypeName: string,
		fieldname: string | undefined,
		property?: string
	): Promise<any> {
		// Check if DocType exists
		const doctype = await this.getDocType(doctypeName);
		if (!doctype) {
			throw new DocTypeNotFoundError(doctypeName);
		}

		// Remove property setter
		const removedSetter = await this.propertySetterManager.removeProperty(
			doctypeName,
			fieldname,
			property
		);

		// Invalidate cache for this DocType
		this.invalidateDocTypeMeta(doctypeName);

		return removedSetter;
	}

	/**
		* Get a property setter
		* @param doctypeName Name of the DocType
		* @param fieldname Name of the field (undefined for DocType-level setters)
		* @param property Property name
		* @returns Promise resolving to property setter or null if not found
		*/
	public async getProperty(
		doctypeName: string,
		fieldname: string | undefined,
		property: string
	): Promise<any> {
		return await this.propertySetterManager.getProperty(doctypeName, fieldname, property);
	}

	/**
		* Get all property setters for a DocType
		* @param doctypeName Name of the DocType
		* @param options Query options
		* @returns Promise resolving to array of property setters
		*/
	public async getProperties(doctypeName: string, options: any = {}): Promise<any[]> {
		return await this.propertySetterManager.getProperties(doctypeName, options);
	}

	/**
		* Get a DocType with property setters applied
		* @param doctypeName Name of the DocType
		* @returns Promise resolving to DocType with property setters applied or null if not found
		*/
	public async getDocTypeWithPropertySetters(doctypeName: string): Promise<any> {
		const doctype = await this.getDocType(doctypeName);
		if (!doctype) {
			return null;
		}

		return await this.propertySetterManager.applyProperties(doctype);
	}

	/**
	 * Delete a custom field for a DocType
	 * @param doctypeName Name of the DocType
	 * @param fieldname Name of the field to delete
	 * @returns Promise resolving when deletion is complete
	 */
	public async deleteCustomField(doctypeName: string, fieldname: string): Promise<void> {
		// Check if DocType exists
		const doctype = await this.getDocType(doctypeName);
		if (!doctype) {
			throw new DocTypeNotFoundError(doctypeName);
		}

		// Delete custom field
		await this.customFieldManager.deleteCustomField(doctypeName, fieldname);

		// Invalidate cache for this DocType
		this.invalidateDocTypeMeta(doctypeName);
	}

	/**
	 * Get custom fields for a DocType
	 * @param doctypeName Name of the DocType
	 * @param options Query options
	 * @returns Promise resolving to array of custom fields
	 */
	public async getCustomFields(doctypeName: string, options?: any): Promise<any[]> {
		return await this.customFieldManager.getCustomFields(doctypeName, options);
	}

	/**
	 * Get all DocTypes that have custom fields
	 * @returns Promise resolving to array of DocType names
	 */
	public async getDocTypesWithCustomFields(): Promise<string[]> {
		const docTypesWithCustomFields = await this.customFieldManager.getDocTypesWithCustomFields();
		
		// Filter to only include registered DocTypes
		return docTypesWithCustomFields.filter(doctypeName => this.doctypes.has(doctypeName));
	}

	/**
	 * Refresh custom fields for all DocTypes
	 * @returns Promise resolving when refresh is complete
	 */
	public async refreshCustomFields(): Promise<void> {
		// Get all DocTypes with custom fields
		const docTypesWithCustomFields = await this.getDocTypesWithCustomFields();
		
		// Invalidate cache for all DocTypes with custom fields
		for (const doctypeName of docTypesWithCustomFields) {
			this.invalidateDocTypeMeta(doctypeName);
		}
	}
}