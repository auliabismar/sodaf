/**
 * Property Setter Manager
 * 
 * This module implements the PropertySetterManager class which manages property setters
 * for DocTypes, allowing modification of field properties without touching original DocType.
 */

import type {
	DocType,
	DocField
} from '../doctype/types';

import type {
	PropertySetter,
	SetPropertyOptions,
	PropertySetterQueryOptions,
	PropertySetterValidationResult,
	PropertySetterManagerConfig
} from './types';

import {
	PropertySetterExistsError,
	PropertySetterNotFoundError,
	PropertySetterValidationError,
	PropertySetterOperationNotSupportedError,
	PropertySetterPropertyNotSupportedError,
	PropertySetterOperationError,
	PropertySetterDatabaseError,
	PropertySetterCacheError,
	PropertySetterConfigurationError
} from './errors';

import {
	validatePropertySetter,
	validateSetPropertyOptions
} from './validators';

/**
 * PropertySetterManager class for managing property setters
 * Implements singleton pattern for global access
 */
export class PropertySetterManager {
	private static instance: PropertySetterManager | null = null;
	private propertySetters: Map<string, PropertySetter[]> = new Map();
	private config: PropertySetterManagerConfig;
	private cache: Map<string, any> = new Map();
	private cacheTimestamps: Map<string, number> = new Map();
	private docTypeEngine: any = null; // Reference to DocTypeEngine for field validation

	/**
	 * Default configuration for PropertySetterManager
	 */
	private static readonly DEFAULT_CONFIG: PropertySetterManagerConfig = {
		enable_cache: true,
		cache_ttl: 300, // 5 minutes
		enable_validation: true,
		enable_database_persistence: true,
		property_setter_table_name: 'Property Setter'
	};

	/**
	 * Private constructor for singleton pattern
	 * @param config Configuration options
	 */
	private constructor(config: Partial<PropertySetterManagerConfig> = {}) {
		this.config = { ...PropertySetterManager.DEFAULT_CONFIG, ...config };

		// Initialize property setters from database if enabled
		if (this.config.enable_database_persistence) {
			this.initializeFromDatabase().catch(error => {
				console.warn('Failed to initialize property setters from database:', error);
			});
		}
	}

	/**
	 * Get the singleton instance of PropertySetterManager
	 * @param config Configuration options (only used on first call)
	 * @returns PropertySetterManager instance
	 */
	public static getInstance(config?: Partial<PropertySetterManagerConfig>): PropertySetterManager {
		if (!PropertySetterManager.instance) {
			PropertySetterManager.instance = new PropertySetterManager(config);
		}
		return PropertySetterManager.instance;
	}

	/**
	 * Create a fresh instance for testing (bypasses singleton)
	 * @param config Configuration options
	 * @returns New PropertySetterManager instance
	 */
	public static createTestInstance(config?: Partial<PropertySetterManagerConfig>): PropertySetterManager {
		// Reset first to clean up any existing state
		PropertySetterManager.resetInstance();
		// Create new instance
		PropertySetterManager.instance = new PropertySetterManager(config);
		return PropertySetterManager.instance;
	}

	/**
	 * Create a non-singleton instance for isolated testing
	 * This creates a completely independent instance that does not affect the static singleton
	 * @param config Configuration options
	 * @returns New PropertySetterManager instance that is NOT the singleton
	 */
	public static createNonSingletonInstance(config?: Partial<PropertySetterManagerConfig>): PropertySetterManager {
		// Using Object.create and constructor assignment to create a true standalone instance
		const instance = Object.create(PropertySetterManager.prototype);
		instance.propertySetters = new Map();
		instance.cache = new Map();
		instance.cacheTimestamps = new Map();
		instance.docTypeEngine = null;
		instance.config = { ...PropertySetterManager.DEFAULT_CONFIG, ...config };
		instance._instanceId = Math.random().toString(36).substring(7);
		return instance;
	}

	/**
	 * Reset the singleton instance (for testing purposes)
	 */
	public static resetInstance(): void {
		if (PropertySetterManager.instance) {
			// Clear internal state before resetting
			PropertySetterManager.instance.propertySetters.clear();
			PropertySetterManager.instance.cache.clear();
			PropertySetterManager.instance.cacheTimestamps.clear();
			PropertySetterManager.instance.docTypeEngine = null;
		}
		PropertySetterManager.instance = null;
	}

	/**
	 * Set the DocTypeEngine reference for field validation
	 * @param engine DocTypeEngine instance
	 */
	public setDocTypeEngine(engine: any): void {
		this.docTypeEngine = engine;
	}

	/**
	 * Clear all property setters (for testing purposes)
	 */
	public clearAll(): void {
		this.propertySetters.clear();
		this.cache.clear();
		this.cacheTimestamps.clear();
	}

	/**
	 * Set a property for a field or DocType
	 * @param options Property setter options
	 * @returns Promise resolving to created property setter
	 * @throws PropertySetterValidationError if validation fails
	 * @throws PropertySetterExistsError if property setter already exists
	 */
	public async setProperty(options: SetPropertyOptions): Promise<PropertySetter> {
		// Validate options if validation is enabled
		if (this.config.enable_validation) {
			const existingFields = await this.getExistingFields(options.doctype);
			const validationResult = validateSetPropertyOptions(options, existingFields);

			if (!validationResult.valid) {
				throw new PropertySetterValidationError(
					`Property setter validation failed for '${options.property}' on ${options.fieldname ? `field '${options.fieldname}'` : 'DocType'} of DocType '${options.doctype}'`,
					validationResult.errors
				);
			}
		}

		// Check if property setter already exists with same priority
		const existingSetters = await this.getProperties(options.doctype, {
			fieldname: options.fieldname,
			property: options.property
		});
		const existingSetter = existingSetters.find(ps => ps.priority === (options.priority || 0));
		if (existingSetter) {
			throw new PropertySetterExistsError(options.doctype, options.fieldname, options.property);
		}

		// Create property setter
		const propertySetter: PropertySetter = {
			doctype: options.doctype,
			fieldname: options.fieldname,
			property: options.property,
			value: options.value,
			enabled: options.enabled !== undefined ? options.enabled : true,
			priority: options.priority !== undefined ? options.priority : 0,
			description: options.description,
			creation: new Date(),
			modified: new Date()
		};

		// Store property setter
		await this.storePropertySetter(propertySetter);

		// Invalidate cache
		this.invalidateCache(options.doctype);

		return propertySetter;
	}

	/**
	 * Remove a property setter
	 * @param doctype DocType name
	 * @param fieldname Field name (undefined for DocType-level setters)
	 * @param property Property name (undefined to remove all properties for field/DocType)
	 * @returns Promise resolving to removed property setter(s)
	 * @throws PropertySetterNotFoundError if property setter not found
	 */
	public async removeProperty(
		doctype: string,
		fieldname?: string,
		property?: string
	): Promise<PropertySetter | PropertySetter[]> {
		if (property) {
			const key = this.getPropertySetterKey(doctype, fieldname);
			const propertySetters = this.propertySetters.get(key) || [];

			// Remove specific property setter
			const index = propertySetters.findIndex(ps => ps.property === property);
			if (index === -1) {
				throw new PropertySetterNotFoundError(doctype, fieldname, property);
			}

			const removedSetter = propertySetters.splice(index, 1)[0];
			this.propertySetters.set(key, propertySetters);

			// Remove from database if enabled
			if (this.config.enable_database_persistence) {
				await this.removeFromDatabase(removedSetter);
			}

			// Invalidate cache
			this.invalidateCache(doctype);

			return removedSetter;
		}

		// Remove all property setters for Logic
		if (fieldname) {
			// Remove all property setters for specific field
			const key = this.getPropertySetterKey(doctype, fieldname);
			const propertySetters = this.propertySetters.get(key) || [];

			if (propertySetters.length === 0) {
				throw new Error(`No property setters found for field '${fieldname}' of DocType '${doctype}'`);
			}

			const removedSetters = [...propertySetters];
			this.propertySetters.delete(key);

			// Remove from database if enabled
			if (this.config.enable_database_persistence) {
				await Promise.all(removedSetters.map(ps => this.removeFromDatabase(ps)));
			}

			// Invalidate cache
			this.invalidateCache(doctype);

			return removedSetters;
		} else {
			// Remove ALL property setters for DocType (DocType-level AND ALL fields)
			let allRemovedSetters: PropertySetter[] = [];

			// Find all keys for this DocType
			const keysToRemove: string[] = [];
			for (const key of this.propertySetters.keys()) {
				if (key.startsWith(`${doctype}:`)) {
					keysToRemove.push(key);
					const setters = this.propertySetters.get(key) || [];
					allRemovedSetters = [...allRemovedSetters, ...setters];
				}
			}

			if (allRemovedSetters.length === 0) {
				throw new Error(`No property setters found for DocType '${doctype}'`);
			}

			// Delete all keys
			keysToRemove.forEach(key => this.propertySetters.delete(key));

			// Remove from database if enabled
			if (this.config.enable_database_persistence) {
				await Promise.all(allRemovedSetters.map(ps => this.removeFromDatabase(ps)));
			}

			// Invalidate cache
			this.invalidateCache(doctype);

			return allRemovedSetters;
		}
	}

	/**
	 * Get a specific property setter
	 * @param doctype DocType name
	 * @param fieldname Field name (undefined for DocType-level setters)
	 * @param property Property name
	 * @returns Promise resolving to property setter or null if not found
	 */
	public async getProperty(
		doctype: string,
		fieldname?: string,
		property?: string
	): Promise<PropertySetter | null> {
		const key = this.getPropertySetterKey(doctype, fieldname);
		const propertySetters = this.propertySetters.get(key) || [];

		if (property) {
			// Get specific property setter
			return propertySetters.find(ps => ps.property === property) || null;
		} else {
			// Get highest priority property setter
			if (propertySetters.length === 0) {
				return null;
			}

			// Sort by priority (descending) and return the first one
			const sortedSetters = [...propertySetters].sort((a, b) => (b.priority || 0) - (a.priority || 0));
			return sortedSetters[0];
		}
	}

	/**
	 * Get all property setters for a DocType
	 * @param doctype DocType name
	 * @param options Query options
	 * @returns Promise resolving to array of property setters
	 */
	public async getProperties(
		doctype: string,
		options: PropertySetterQueryOptions = {}
	): Promise<PropertySetter[]> {
		let propertySetters: PropertySetter[] = [];

		// Get all property setters for the DocType
		for (const [key, setters] of this.propertySetters.entries()) {
			if (key.startsWith(`${doctype}:`)) {
				propertySetters.push(...setters);
			}
		}

		// Apply filters
		if (options.fieldname) {
			propertySetters = propertySetters.filter(ps => ps.fieldname === options.fieldname);
		}

		if (options.property) {
			propertySetters = propertySetters.filter(ps => ps.property === options.property);
		}

		if (options.include_disabled === false) {
			propertySetters = propertySetters.filter(ps => ps.enabled !== false);
		}

		// Apply sorting
		if (options.sort_by) {
			propertySetters.sort((a, b) => {
				const aValue = a[options.sort_by as keyof PropertySetter];
				const bValue = b[options.sort_by as keyof PropertySetter];

				if (aValue === undefined && bValue === undefined) return 0;
				if (aValue === undefined) return 1;
				if (bValue === undefined) return -1;

				if (aValue < bValue) return options.sort_order === 'desc' ? 1 : -1;
				if (aValue > bValue) return options.sort_order === 'desc' ? -1 : 1;
				return 0;
			});
		}

		// Apply pagination
		if (options.offset) {
			propertySetters = propertySetters.slice(options.offset);
		}

		if (options.limit) {
			propertySetters = propertySetters.slice(0, options.limit);
		}

		return propertySetters;
	}

	/**
	 * Apply all property setters to a DocType
	 * @param doctype DocType to apply property setters to
	 * @returns Promise resolving to modified DocType
	 */
	public async applyProperties(doctype: DocType): Promise<DocType> {
		// Create a copy of DocType to avoid modifying the original
		const modifiedDoctype: DocType = JSON.parse(JSON.stringify(doctype));

		// Get all property setters for this DocType
		const propertySetters = await this.getProperties(doctype.name);

		// Apply DocType-level property setters
		const doctypeSetters = propertySetters.filter(ps => !ps.fieldname && ps.enabled !== false);
		for (const setter of doctypeSetters) {
			(modifiedDoctype as any)[setter.property] = setter.value;
		}

		// Apply field-level property setters
		const fieldSetters = propertySetters.filter(ps => ps.fieldname && ps.enabled !== false);

		// Group setters by field and apply highest priority for each property
		const fieldSetterMap = new Map<string, Map<string, any>>();

		for (const setter of fieldSetters) {
			if (!fieldSetterMap.has(setter.fieldname!)) {
				fieldSetterMap.set(setter.fieldname!, new Map());
			}

			const fieldProperties = fieldSetterMap.get(setter.fieldname!)!;
			const currentPriority = fieldProperties.get(`${setter.property}_priority`) || 0;

			// Only apply if this setter has higher priority
			if ((setter.priority || 0) >= currentPriority) {
				fieldProperties.set(setter.property, setter.value);
				fieldProperties.set(`${setter.property}_priority`, setter.priority || 0);
			}
		}

		// Apply the highest priority setters to each field
		for (const [fieldname, properties] of fieldSetterMap.entries()) {
			const fieldIndex = modifiedDoctype.fields.findIndex(f => f.fieldname === fieldname);
			if (fieldIndex !== -1) {
				for (const [property, value] of properties.entries()) {
					if (!property.endsWith('_priority')) {
						(modifiedDoctype.fields[fieldIndex] as any)[property] = value;
					}
				}
			}
		}

		return modifiedDoctype;
	}

	/**
	 * Validate a property setter definition
	 * @param propertySetter Property setter to validate
	 * @returns Promise resolving to validation result
	 */
	public async validatePropertySetter(propertySetter: PropertySetter): Promise<PropertySetterValidationResult> {
		if (!this.config.enable_validation) {
			return { valid: true, errors: [], warnings: [] };
		}

		const existingFields = await this.getExistingFields(propertySetter.doctype);
		const validationResult = validatePropertySetter(propertySetter, existingFields);

		return {
			valid: validationResult.valid,
			errors: validationResult.errors,
			warnings: validationResult.warnings
		};
	}

	/**
	 * Get existing field names for a DocType
	 * @param doctype DocType name
	 * @returns Promise resolving to array of field names
	 */
	private async getExistingFields(doctype: string): Promise<string[]> {
		try {
			// Use the stored DocTypeEngine reference if available
			if (this.docTypeEngine) {
				const docType = await this.docTypeEngine.getDocType(doctype);
				if (docType) {
					return docType.fields.map((f: any) => f.fieldname);
				}
			} else {
				// Fallback to dynamic import if no reference is set
				const { DocTypeEngine } = await import('../doctype');
				const engine = DocTypeEngine.getInstance();
				const docType = await engine.getDocType(doctype);

				if (docType) {
					return docType.fields.map((f: any) => f.fieldname);
				}
			}
		} catch (error) {
			// DocTypeEngine not available or error, return empty array
			console.warn('Failed to get existing fields from DocTypeEngine:', error);
		}

		return [];
	}

	/**
	 * Get the key for storing property setters
	 * @param doctype DocType name
	 * @param fieldname Field name (undefined for DocType-level setters)
	 * @returns Key for property setters map
	 */
	private getPropertySetterKey(doctype: string, fieldname?: string): string {
		return fieldname ? `${doctype}:${fieldname}` : `${doctype}:`;
	}

	/**
	 * Store a property setter
	 * @param propertySetter Property setter to store
	 */
	private async storePropertySetter(propertySetter: PropertySetter): Promise<void> {
		const key = this.getPropertySetterKey(propertySetter.doctype, propertySetter.fieldname);

		if (!this.propertySetters.has(key)) {
			this.propertySetters.set(key, []);
		}

		this.propertySetters.get(key)!.push(propertySetter);

		// Store in database if enabled
		if (this.config.enable_database_persistence) {
			await this.storeInDatabase(propertySetter);
		}
	}

	/**
	 * Store property setter in database
	 * @param propertySetter Property setter to store
	 */
	private async storeInDatabase(propertySetter: PropertySetter): Promise<void> {
		try {
			// This would integrate with the database layer
			// For now, we'll just log the operation
			console.log('Storing property setter in database:', propertySetter);
		} catch (error) {
			throw new PropertySetterDatabaseError('store', String(error));
		}
	}

	/**
	 * Remove property setter from database
	 * @param propertySetter Property setter to remove
	 */
	private async removeFromDatabase(propertySetter: PropertySetter): Promise<void> {
		try {
			// This would integrate with the database layer
			// For now, we'll just log the operation
			console.log('Removing property setter from database:', propertySetter);
		} catch (error) {
			throw new PropertySetterDatabaseError('remove', String(error));
		}
	}

	/**
	 * Initialize property setters from database
	 */
	private async initializeFromDatabase(): Promise<void> {
		try {
			// This would integrate with the database layer
			// For now, we'll just log the operation
			console.log('Initializing property setters from database');
		} catch (error) {
			throw new PropertySetterDatabaseError('initialize', String(error));
		}
	}

	/**
	 * Invalidate cache for a DocType
	 * @param doctype DocType name
	 */
	private invalidateCache(doctype: string): void {
		if (this.config.enable_cache) {
			// Remove all cache entries for this DocType
			for (const key of this.cache.keys()) {
				if (key.startsWith(`${doctype}:`)) {
					this.cache.delete(key);
					this.cacheTimestamps.delete(key);
				}
			}
		}
	}

	/**
	 * Check if cache entry is expired
	 * @param key Cache key
	 * @returns True if expired, false otherwise
	 */
	private isCacheExpired(key: string): boolean {
		if (!this.config.enable_cache || !this.config.cache_ttl) {
			return true;
		}

		const timestamp = this.cacheTimestamps.get(key);
		if (!timestamp) {
			return true;
		}

		return Date.now() - timestamp > (this.config.cache_ttl * 1000);
	}

	/**
	 * Get current configuration
	 * @returns Current configuration object
	 */
	public getConfig(): PropertySetterManagerConfig {
		return { ...this.config };
	}

	/**
	 * Update configuration
	 * @param newConfig Partial configuration to merge with current config
	 */
	public updateConfig(newConfig: Partial<PropertySetterManagerConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}
}