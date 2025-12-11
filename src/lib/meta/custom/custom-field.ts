/**
 * Custom Field Manager
 * 
 * This module implements the CustomFieldManager class which manages custom fields
 * for DocTypes, providing CRUD operations, validation, and caching.
 */

import type {
	CustomField,
	CreateCustomFieldOptions,
	UpdateCustomFieldOptions,
	CustomFieldQueryOptions,
	CustomFieldManagerConfig,
	CustomFieldValidationResult
} from './types';
import type { DocType } from '../doctype/types';
import {
	CustomFieldExistsError,
	CustomFieldNotFoundError,
	CustomFieldValidationError,
	CustomFieldOperationError,
	CustomFieldDatabaseError,
	CustomFieldCacheError,
	CustomFieldConfigurationError,
	type ValidationResult
} from './errors';
import {
	validateCustomField,
	validateCreateCustomFieldOptions,
	validateUpdateCustomFieldOptions
} from './validators';

/**
 * Custom field cache entry
 */
interface CacheEntry {
	/** Cached custom field */
	customField: CustomField;

	/** Cache entry timestamp */
	timestamp: number;

	/** Cache entry TTL in seconds */
	ttl: number;
}

/**
 * Custom field manager class
 * Implements singleton pattern for global access
 */
export class CustomFieldManager {
	private static instance: CustomFieldManager | null = null;
	private config: Required<CustomFieldManagerConfig>;
	private cache: Map<string, CacheEntry> = new Map();
	private customFields: Map<string, Map<string, CustomField>> = new Map(); // doctype -> fieldname -> customField
	private registrationLock: Promise<void> = Promise.resolve();

	/**
	 * Private constructor for singleton pattern
	 * @param config Custom field manager configuration
	 */
	private constructor(config: CustomFieldManagerConfig = {}) {
		this.config = {
			enable_cache: config.enable_cache ?? true,
			cache_ttl: config.cache_ttl ?? 300, // 5 minutes
			enable_validation: config.enable_validation ?? true,
			enable_migration_support: config.enable_migration_support ?? true,
			enable_api_support: config.enable_api_support ?? true,
			custom_field_table_name: config.custom_field_table_name ?? 'tabCustom Field',
			custom_field_value_table_name: config.custom_field_value_table_name ?? 'tabCustom Field Value'
		};
	}

	/**
	 * Get the singleton instance of CustomFieldManager
	 * @param config Optional configuration (only used on first call)
	 * @returns CustomFieldManager instance
	 */
	public static getInstance(config?: CustomFieldManagerConfig): CustomFieldManager {
		if (!CustomFieldManager.instance) {
			CustomFieldManager.instance = new CustomFieldManager(config);
		}
		return CustomFieldManager.instance;
	}

	/**
	 * Reset the singleton instance (for testing purposes)
	 */
	public static resetInstance(): void {
		if (CustomFieldManager.instance) {
			// Clear internal state before resetting
			CustomFieldManager.instance.cache.clear();
			CustomFieldManager.instance.customFields.clear();
			CustomFieldManager.instance.registrationLock = Promise.resolve();
		}
		CustomFieldManager.instance = null;
	}

	/**
	 * Create a new custom field
	 * @param options Custom field creation options
	 * @param existingFields Existing field names in the DocType
	 * @returns Created custom field
	 * @throws CustomFieldValidationError if validation fails
	 * @throws CustomFieldExistsError if field already exists
	 * @throws CustomFieldOperationError if operation fails
	 */
	public async createCustomField(
		options: CreateCustomFieldOptions,
		existingFields: string[] = []
	): Promise<CustomField> {
		return this.performOperation(async () => {
			// Validate options if validation is enabled
			if (this.config.enable_validation) {
				const validationResult = validateCreateCustomFieldOptions(options, existingFields);
				if (!validationResult.valid) {
					throw new CustomFieldValidationError(
						`Custom field validation failed for '${options.fieldname}'`,
						validationResult.errors
					);
				}
			}

			// Check if custom field already exists
			if (this.customFields.has(options.dt) &&
				this.customFields.get(options.dt)!.has(options.fieldname)) {
				throw new CustomFieldExistsError(options.fieldname, options.dt);
			}

			// Create custom field
			const customField: CustomField = {
				is_custom: true,
				dt: options.dt,
				fieldname: options.fieldname,
				fieldtype: options.fieldtype,
				label: options.label,
				options: options.options,
				default: options.default,
				required: options.required,
				unique: options.unique,
				length: options.length,
				description: options.description,
				comment: options.comment,
				order: options.order,
				in_list_view: options.in_list_view,
				in_standard_filter: options.in_standard_filter,
				in_global_search: options.in_global_search,
				hidden: options.hidden,
				read_only: options.read_only,
				validate: options.validate,
				depends_on: options.depends_on,
				label_depends_on: options.label_depends_on,
				mandatory_depends_on: options.mandatory_depends_on,
				read_only_depends_on: options.read_only_depends_on,
				hidden_depends_on: options.hidden_depends_on,
				change: options.change,
				filters: options.filters,
				fetch_from: options.fetch_from,
				fetch_if_empty: options.fetch_if_empty,
				allow_in_quick_entry: options.allow_in_quick_entry,
				translatable: options.translatable,
				no_copy: options.no_copy,
				remember_last_selected: options.remember_last_selected,
				bold: options.bold,
				deprecated: options.deprecated,
				precision_based_on: options.precision_based_on,
				width: options.width,
				columns: options.columns,
				child_doctype: options.child_doctype,
				image_field: options.image_field,
				search_index: options.search_index,
				email_trigger: options.email_trigger,
				timeline: options.timeline,
				track_seen: options.track_seen,
				track_visits: options.track_visits,
				old_fieldname: options.old_fieldname,
				unique_across_doctypes: options.unique_across_doctypes,
				ignore_user_permissions: options.ignore_user_permissions,
				ignore_xss_filtered: options.ignore_xss_filtered,
				allow_on_submit: options.allow_on_submit,
				collapsible: options.collapsible,
				collapsible_depends_on: options.collapsible_depends_on,
				fetch_to_include: options.fetch_to_include,
				set_user_permissions: options.set_user_permissions,
				ignore_strict_user_permissions: options.ignore_strict_user_permissions,
				table_fieldname: options.table_fieldname,
				real_fieldname: options.real_fieldname,
				creation: new Date(),
				modified: new Date(),
				owner: 'Administrator',
				modified_by: 'Administrator',
				name: `${options.dt}-${options.fieldname}`,
				parent: options.dt,
				parentfield: 'custom_fields',
				parenttype: 'DocType',
				idx: 0,
				docstatus: 0
			};

			// Validate custom field if validation is enabled
			if (this.config.enable_validation) {
				const validationResult = validateCustomField(customField, existingFields);
				if (!validationResult.valid) {
					throw new CustomFieldValidationError(
						`Custom field validation failed for '${customField.fieldname}'`,
						validationResult.errors
					);
				}
			}

			// Store custom field
			if (!this.customFields.has(options.dt)) {
				this.customFields.set(options.dt, new Map());
			}
			this.customFields.get(options.dt)!.set(options.fieldname, customField);

			// Invalidate cache for this DocType
			this.invalidateCache(options.dt);

			return customField;
		});
	}

	/**
	 * Update an existing custom field
	 * @param doctype DocType name
	 * @param fieldname Field name
	 * @param options Update options
	 * @param existingFields Existing field names in the DocType
	 * @returns Updated custom field
	 * @throws CustomFieldNotFoundError if field not found
	 * @throws CustomFieldValidationError if validation fails
	 * @throws CustomFieldOperationError if operation fails
	 */
	public async updateCustomField(
		doctype: string,
		fieldname: string,
		options: UpdateCustomFieldOptions,
		existingFields: string[] = []
	): Promise<CustomField> {
		return this.performOperation(async () => {
			// Check if custom field exists
			if (!this.customFields.has(doctype) || !this.customFields.get(doctype)!.has(fieldname)) {
				throw new CustomFieldNotFoundError(fieldname, doctype);
			}

			// Get existing custom field
			const existingCustomField = this.customFields.get(doctype)!.get(fieldname)!;

			// Validate options if validation is enabled
			if (this.config.enable_validation) {
				const validationResult = validateUpdateCustomFieldOptions(options);
				if (!validationResult.valid) {
					throw new CustomFieldValidationError(
						`Custom field validation failed for '${fieldname}'`,
						validationResult.errors
					);
				}
			}

			// Update custom field
			const updatedCustomField: CustomField = {
				...existingCustomField,
				...options,
				modified: new Date(),
				modified_by: 'Administrator'
			};

			// Validate updated custom field if validation is enabled
			if (this.config.enable_validation) {
				const validationResult = validateCustomField(updatedCustomField, existingFields);
				if (!validationResult.valid) {
					throw new CustomFieldValidationError(
						`Custom field validation failed for '${updatedCustomField.fieldname}'`,
						validationResult.errors
					);
				}
			}

			// Store updated custom field
			this.customFields.get(doctype)!.set(fieldname, updatedCustomField);

			// Invalidate cache for this DocType
			this.invalidateCache(doctype);

			return updatedCustomField;
		});
	}

	/**
	 * Delete a custom field
	 * @param doctype DocType name
	 * @param fieldname Field name
	 * @throws CustomFieldNotFoundError if field not found
	 * @throws CustomFieldOperationError if operation fails
	 */
	public async deleteCustomField(doctype: string, fieldname: string): Promise<void> {
		return this.performOperation(async () => {
			// Check if custom field exists
			if (!this.customFields.has(doctype) || !this.customFields.get(doctype)!.has(fieldname)) {
				throw new CustomFieldNotFoundError(fieldname, doctype);
			}

			// Remove custom field
			this.customFields.get(doctype)!.delete(fieldname);

			// Remove DocType entry if no more custom fields
			if (this.customFields.get(doctype)!.size === 0) {
				this.customFields.delete(doctype);
			}

			// Invalidate cache for this DocType
			this.invalidateCache(doctype);
		});
	}

	/**
	 * Get a custom field
	 * @param doctype DocType name
	 * @param fieldname Field name
	 * @returns Custom field or null if not found
	 */
	public async getCustomField(doctype: string, fieldname: string): Promise<CustomField | null> {
		// Check cache first
		if (this.config.enable_cache) {
			const cacheKey = `${doctype}.${fieldname}`;
			const cachedEntry = this.cache.get(cacheKey);

			if (cachedEntry && this.isCacheEntryValid(cachedEntry)) {
				return cachedEntry.customField;
			}
		}

		// Get from storage
		const doctypeFields = this.customFields.get(doctype);
		if (!doctypeFields) {
			return null;
		}

		const customField = doctypeFields.get(fieldname) ? { ...doctypeFields.get(fieldname)! } : null;

		// Update cache
		if (this.config.enable_cache && customField) {
			const cacheKey = `${doctype}.${fieldname}`;
			this.cache.set(cacheKey, {
				customField,
				timestamp: Date.now(),
				ttl: this.config.cache_ttl
			});
		}

		return customField;
	}

	/**
	 * Get all custom fields for a DocType
	 * @param doctype DocType name
	 * @param options Query options
	 * @returns Array of custom fields
	 */
	public async getCustomFields(
		doctype: string,
		options: CustomFieldQueryOptions = {}
	): Promise<CustomField[]> {
		const doctypeFields = this.customFields.get(doctype);
		if (!doctypeFields) {
			return [];
		}

		let customFields = Array.from(doctypeFields.values());

		// Apply filters
		if (options.fieldtype) {
			customFields = customFields.filter(field => field.fieldtype === options.fieldtype);
		}

		if (options.in_list_view !== undefined) {
			customFields = customFields.filter(field => field.in_list_view === options.in_list_view);
		}

		if (!options.include_hidden) {
			customFields = customFields.filter(field => !field.hidden);
		}

		if (!options.include_deprecated) {
			customFields = customFields.filter(field => !field.deprecated);
		}

		// Apply sorting
		if (options.sort_by) {
			customFields.sort((a, b) => {
				const aValue = (a as any)[options.sort_by!];
				const bValue = (b as any)[options.sort_by!];

				if (aValue === undefined && bValue === undefined) return 0;
				if (aValue === undefined) return 1;
				if (bValue === undefined) return -1;

				if (aValue < bValue) return options.sort_order === 'desc' ? 1 : -1;
				if (aValue > bValue) return options.sort_order === 'desc' ? -1 : 1;
				return 0;
			});
		} else {
			// Default sort by order
			customFields.sort((a, b) => (a.order || 0) - (b.order || 0));
		}

		// Apply pagination
		if (options.offset !== undefined) {
			customFields = customFields.slice(options.offset);
		}

		if (options.limit !== undefined) {
			customFields = customFields.slice(0, options.limit);
		}

		return customFields;
	}

	/**
	 * Get all custom fields for all DocTypes
	 * @param options Query options
	 * @returns Array of custom fields
	 */
	public async getAllCustomFields(options: CustomFieldQueryOptions = {}): Promise<CustomField[]> {
		let allCustomFields: CustomField[] = [];

		for (const [doctype, fields] of this.customFields) {
			const doctypeCustomFields = await this.getCustomFields(doctype, options);
			allCustomFields.push(...doctypeCustomFields);
		}

		// Apply DocType filter if specified
		if (options.dt) {
			allCustomFields = allCustomFields.filter(field => field.dt === options.dt);
		}

		return allCustomFields;
	}

	/**
	 * Check if a custom field exists
	 * @param doctype DocType name
	 * @param fieldname Field name
	 * @returns True if field exists, false otherwise
	 */
	public async hasCustomField(doctype: string, fieldname: string): Promise<boolean> {
		const customField = await this.getCustomField(doctype, fieldname);
		return customField !== null;
	}

	/**
	 * Get the count of custom fields for a DocType
	 * @param doctype DocType name
	 * @param options Query options
	 * @returns Count of custom fields
	 */
	public async getCustomFieldCount(doctype: string, options: CustomFieldQueryOptions = {}): Promise<number> {
		const customFields = await this.getCustomFields(doctype, options);
		return customFields.length;
	}

	/**
	 * Get all DocTypes that have custom fields
	 * @returns Array of DocType names
	 */
	public async getDocTypesWithCustomFields(): Promise<string[]> {
		return Array.from(this.customFields.keys());
	}

	/**
	 * Merge custom fields into a DocType definition
	 * @param doctype DocType definition to merge into
	 * @returns DocType definition with custom fields merged
	 */
	public async mergeCustomFields(doctype: DocType): Promise<DocType> {
		const customFields = await this.getCustomFields(doctype.name);

		if (customFields.length === 0) {
			return doctype;
		}

		// Create a new DocType with custom fields merged
		const mergedDocType: DocType = {
			...doctype,
			fields: [...doctype.fields, ...customFields],
			custom_fields: customFields
		};

		// Sort fields by order
		mergedDocType.fields.sort((a, b) => {
			const orderA = a.order || 0;
			const orderB = b.order || 0;
			return orderA - orderB;
		});

		return mergedDocType;
	}

	/**
	 * Validate a custom field
	 * @param customField Custom field to validate
	 * @param existingFields Existing field names in the DocType
	 * @returns Validation result
	 */
	public async validateCustomField(
		customField: CustomField,
		existingFields: string[] = []
	): Promise<CustomFieldValidationResult> {
		const validationResult = validateCustomField(customField, existingFields);

		return {
			valid: validationResult.valid,
			errors: validationResult.errors,
			warnings: validationResult.warnings
		};
	}

	/**
	 * Clear all custom fields
	 */
	public async clearAllCustomFields(): Promise<void> {
		return this.acquireRegistrationLock(async () => {
			this.customFields.clear();
			this.cache.clear();
		});
	}

	/**
	 * Clear custom fields for a specific DocType
	 * @param doctype DocType name
	 */
	public async clearCustomFields(doctype: string): Promise<void> {
		return this.acquireRegistrationLock(async () => {
			this.customFields.delete(doctype);
			this.invalidateCache(doctype);
		});
	}

	/**
	 * Get the configuration
	 * @returns Current configuration
	 */
	public getConfig(): Required<CustomFieldManagerConfig> {
		return { ...this.config };
	}

	/**
	 * Update the configuration
	 * @param newConfig New configuration values
	 */
	public updateConfig(newConfig: Partial<CustomFieldManagerConfig>): void {
		this.config = { ...this.config, ...newConfig };

		// Clear cache if caching is disabled
		if (!this.config.enable_cache) {
			this.cache.clear();
		}
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
	 * Check if a cache entry is still valid
	 * @param cacheEntry Cache entry to check
	 * @returns True if valid, false otherwise
	 */
	private isCacheEntryValid(cacheEntry: CacheEntry): boolean {
		const now = Date.now();
		const age = (now - cacheEntry.timestamp) / 1000; // Convert to seconds
		return age < cacheEntry.ttl;
	}

	/**
	 * Invalidate cache for a specific DocType
	 * @param doctype DocType name
	 */
	private invalidateCache(doctype: string): void {
		if (!this.config.enable_cache) {
			return;
		}

		// Remove all cache entries for this DocType
		const keysToDelete: string[] = [];

		for (const key of this.cache.keys()) {
			if (key.startsWith(`${doctype}.`)) {
				keysToDelete.push(key);
			}
		}

		for (const key of keysToDelete) {
			this.cache.delete(key);
		}
	}
}