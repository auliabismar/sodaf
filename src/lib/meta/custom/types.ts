/**
 * Custom Field Types and Interfaces
 * 
 * This file defines TypeScript interfaces for custom fields, extending the base DocField
 * with custom-specific properties and behaviors.
 */

import type { DocField, FieldType } from '../doctype/types';

/**
 * Custom field definition extending DocField with custom-specific properties
 */
export interface CustomField extends DocField {
	/** Whether this is a custom field (always true for CustomField) */
	is_custom: true;
	
	/** DocType this custom field belongs to */
	dt: string;
	
	/** Field name in the database (may differ from fieldname) */
	fieldname: string;
	
	/** Field type from FieldType union */
	fieldtype: FieldType;
	
	/** Field label for display */
	label: string;
	
	/** Field options (for Select, Link, etc.) */
	options?: string;
	
	/** Default value for field */
	default?: any;
	
	/** Whether field is required */
	required?: boolean;
	
	/** Whether field value must be unique */
	unique?: boolean;
	
	/** Maximum length for text fields */
	length?: number;
	
	/** Field description for help text */
	description?: string;
	
	/** Field comment for documentation */
	comment?: string;
	
	/** Field order in form */
	order?: number;
	
	/** Whether field appears in list view */
	in_list_view?: boolean;
	
	/** Whether field appears in standard filter */
	in_standard_filter?: boolean;
	
	/** Whether field appears in global search */
	in_global_search?: boolean;
	
	/** Whether field is hidden */
	hidden?: boolean;
	
	/** Whether field is read-only */
	read_only?: boolean;
	
	/** Field validation as JavaScript expression */
	validate?: string;
	
	/** Field depends on another field */
	depends_on?: string;
	
	/** Field label depends on another field */
	label_depends_on?: string;
	
	/** Field is mandatory depends on condition */
	mandatory_depends_on?: string;
	
	/** Field is read-only depends on condition */
	read_only_depends_on?: string;
	
	/** Field is hidden depends on condition */
	hidden_depends_on?: string;
	
	/** Field change event handler */
	change?: string;
	
	/** Field options filter for Link fields */
	filters?: string;
	
	/** Field fetch from for Link fields */
	fetch_from?: string;
	
	/** Field fetch if empty for Link fields */
	fetch_if_empty?: boolean;
	
	/** Field allow in quick entry */
	allow_in_quick_entry?: boolean;
	
	/** Field is translatable */
	translatable?: boolean;
	
	/** Field is no copy */
	no_copy?: boolean;
	
	/** Field is remember last */
	remember_last_selected?: boolean;
	
	/** Field is bold */
	bold?: boolean;
	
	/** Field is deprecated */
	deprecated?: boolean;
	
	/** Field precision for currency fields */
	precision_based_on?: string;
	
	/** Field width percentage */
	width?: string;
	
	/** Field columns for Table fields */
	columns?: string;
	
	/** Field child table name */
	child_doctype?: string;
	
	/** Field image field for Image types */
	image_field?: string;
	
	/** Field is search index */
	search_index?: boolean;
	
	/** Field is email trigger */
	email_trigger?: boolean;
	
	/** Field is timeline */
	timeline?: boolean;
	
	/** Field is track seen */
	track_seen?: boolean;
	
	/** Field is track visits */
	track_visits?: boolean;
	
	/** Field old field name for migration */
	old_fieldname?: string;
	
	/** Field is unique across doctypes */
	unique_across_doctypes?: boolean;
	
	/** Field ignore user permissions */
	ignore_user_permissions?: boolean;
	
	/** Field ignore xss filtered */
	ignore_xss_filtered?: boolean;
	
	/** Field allow on submit */
	allow_on_submit?: boolean;
	
	/** Field is collapsible */
	collapsible?: boolean;
	
	/** Field is collapsible depends on */
	collapsible_depends_on?: string;
	
	/** Field fetch to include */
	fetch_to_include?: string;
	
	/** Field set user permissions */
	set_user_permissions?: boolean;
	
	/** Field ignore strict user permissions */
	ignore_strict_user_permissions?: boolean;
	
	/** Field table fieldname */
	table_fieldname?: string;
	
	/** Field real fieldname */
	real_fieldname?: string;
	
	/** Custom field creation timestamp */
	creation?: Date;
	
	/** Custom field modification timestamp */
	modified?: Date;
	
	/** Custom field owner */
	owner?: string;
	
	/** Custom field modified by */
	modified_by?: string;
	
	/** Custom field name */
	name?: string;
	
	/** Custom field parent */
	parent?: string;
	
	/** Custom field parent field */
	parentfield?: string;
	
	/** Custom field parent type */
	parenttype?: string;
	
	/** Custom field index */
	idx?: number;
	
	/** Custom field docstatus */
	docstatus?: number;
}

/**
 * Custom field creation options
 */
export interface CreateCustomFieldOptions {
	/** DocType to add the custom field to */
	dt: string;
	
	/** Field name */
	fieldname: string;
	
	/** Field type */
	fieldtype: FieldType;
	
	/** Field label */
	label: string;
	
	/** Field options */
	options?: string;
	
	/** Default value */
	default?: any;
	
	/** Whether field is required */
	required?: boolean;
	
	/** Whether field value must be unique */
	unique?: boolean;
	
	/** Maximum length for text fields */
	length?: number;
	
	/** Field description */
	description?: string;
	
	/** Field comment */
	comment?: string;
	
	/** Field order in form */
	order?: number;
	
	/** Whether field appears in list view */
	in_list_view?: boolean;
	
	/** Whether field appears in standard filter */
	in_standard_filter?: boolean;
	
	/** Whether field appears in global search */
	in_global_search?: boolean;
	
	/** Whether field is hidden */
	hidden?: boolean;
	
	/** Whether field is read-only */
	read_only?: boolean;
	
	/** Field validation */
	validate?: string;
	
	/** Field depends on */
	depends_on?: string;
	
	/** Field label depends on */
	label_depends_on?: string;
	
	/** Field is mandatory depends on */
	mandatory_depends_on?: string;
	
	/** Field is read-only depends on */
	read_only_depends_on?: string;
	
	/** Field is hidden depends on */
	hidden_depends_on?: string;
	
	/** Field change event handler */
	change?: string;
	
	/** Field options filter */
	filters?: string;
	
	/** Field fetch from */
	fetch_from?: string;
	
	/** Field fetch if empty */
	fetch_if_empty?: boolean;
	
	/** Field allow in quick entry */
	allow_in_quick_entry?: boolean;
	
	/** Field is translatable */
	translatable?: boolean;
	
	/** Field is no copy */
	no_copy?: boolean;
	
	/** Field is remember last */
	remember_last_selected?: boolean;
	
	/** Field is bold */
	bold?: boolean;
	
	/** Field is deprecated */
	deprecated?: boolean;
	
	/** Field precision for currency fields */
	precision_based_on?: string;
	
	/** Field width percentage */
	width?: string;
	
	/** Field columns for Table fields */
	columns?: string;
	
	/** Field child table name */
	child_doctype?: string;
	
	/** Field image field for Image types */
	image_field?: string;
	
	/** Field is search index */
	search_index?: boolean;
	
	/** Field is email trigger */
	email_trigger?: boolean;
	
	/** Field is timeline */
	timeline?: boolean;
	
	/** Field is track seen */
	track_seen?: boolean;
	
	/** Field is track visits */
	track_visits?: boolean;
	
	/** Field old field name for migration */
	old_fieldname?: string;
	
	/** Field is unique across doctypes */
	unique_across_doctypes?: boolean;
	
	/** Field ignore user permissions */
	ignore_user_permissions?: boolean;
	
	/** Field ignore xss filtered */
	ignore_xss_filtered?: boolean;
	
	/** Field allow on submit */
	allow_on_submit?: boolean;
	
	/** Field is collapsible */
	collapsible?: boolean;
	
	/** Field is collapsible depends on */
	collapsible_depends_on?: string;
	
	/** Field fetch to include */
	fetch_to_include?: string;
	
	/** Field set user permissions */
	set_user_permissions?: boolean;
	
	/** Field ignore strict user permissions */
	ignore_strict_user_permissions?: boolean;
	
	/** Field table fieldname */
	table_fieldname?: string;
	
	/** Field real fieldname */
	real_fieldname?: string;
}

/**
 * Custom field update options
 */
export interface UpdateCustomFieldOptions {
	/** Field label */
	label?: string;
	
	/** Field type */
	fieldtype?: FieldType;
	
	/** Field options */
	options?: string;
	
	/** Default value */
	default?: any;
	
	/** Whether field is required */
	required?: boolean;
	
	/** Whether field value must be unique */
	unique?: boolean;
	
	/** Maximum length for text fields */
	length?: number;
	
	/** Field description */
	description?: string;
	
	/** Field comment */
	comment?: string;
	
	/** Field order in form */
	order?: number;
	
	/** Whether field appears in list view */
	in_list_view?: boolean;
	
	/** Whether field appears in standard filter */
	in_standard_filter?: boolean;
	
	/** Whether field appears in global search */
	in_global_search?: boolean;
	
	/** Whether field is hidden */
	hidden?: boolean;
	
	/** Whether field is read-only */
	read_only?: boolean;
	
	/** Field validation */
	validate?: string;
	
	/** Field depends on */
	depends_on?: string;
	
	/** Field label depends on */
	label_depends_on?: string;
	
	/** Field is mandatory depends on */
	mandatory_depends_on?: string;
	
	/** Field is read-only depends on */
	read_only_depends_on?: string;
	
	/** Field is hidden depends on */
	hidden_depends_on?: string;
	
	/** Field change event handler */
	change?: string;
	
	/** Field options filter */
	filters?: string;
	
	/** Field fetch from */
	fetch_from?: string;
	
	/** Field fetch if empty */
	fetch_if_empty?: boolean;
	
	/** Field allow in quick entry */
	allow_in_quick_entry?: boolean;
	
	/** Field is translatable */
	translatable?: boolean;
	
	/** Field is no copy */
	no_copy?: boolean;
	
	/** Field is remember last */
	remember_last_selected?: boolean;
	
	/** Field is bold */
	bold?: boolean;
	
	/** Field is deprecated */
	deprecated?: boolean;
	
	/** Field precision for currency fields */
	precision_based_on?: string;
	
	/** Field width percentage */
	width?: string;
	
	/** Field columns for Table fields */
	columns?: string;
	
	/** Field child table name */
	child_doctype?: string;
	
	/** Field image field for Image types */
	image_field?: string;
	
	/** Field is search index */
	search_index?: boolean;
	
	/** Field is email trigger */
	email_trigger?: boolean;
	
	/** Field is timeline */
	timeline?: boolean;
	
	/** Field is track seen */
	track_seen?: boolean;
	
	/** Field is track visits */
	track_visits?: boolean;
	
	/** Field old field name for migration */
	old_fieldname?: string;
	
	/** Field is unique across doctypes */
	unique_across_doctypes?: boolean;
	
	/** Field ignore user permissions */
	ignore_user_permissions?: boolean;
	
	/** Field ignore xss filtered */
	ignore_xss_filtered?: boolean;
	
	/** Field allow on submit */
	allow_on_submit?: boolean;
	
	/** Field is collapsible */
	collapsible?: boolean;
	
	/** Field is collapsible depends on */
	collapsible_depends_on?: string;
	
	/** Field fetch to include */
	fetch_to_include?: string;
	
	/** Field set user permissions */
	set_user_permissions?: boolean;
	
	/** Field ignore strict user permissions */
	ignore_strict_user_permissions?: boolean;
	
	/** Field table fieldname */
	table_fieldname?: string;
	
	/** Field real fieldname */
	real_fieldname?: string;
}

/**
 * Custom field query options
 */
export interface CustomFieldQueryOptions {
	/** DocType to filter by */
	dt?: string;
	
	/** Field type to filter by */
	fieldtype?: FieldType;
	
	/** Whether to include hidden fields */
	include_hidden?: boolean;
	
	/** Whether to include deprecated fields */
	include_deprecated?: boolean;
	
	/** Whether to include only list view fields */
	in_list_view?: boolean;
	
	/** Maximum number of results to return */
	limit?: number;
	
	/** Number of results to skip */
	offset?: number;
	
	/** Field to sort by */
	sort_by?: string;
	
	/** Sort order */
	sort_order?: 'asc' | 'desc';
}

/**
 * Custom field validation result
 */
export interface CustomFieldValidationResult {
	/** Whether the custom field is valid */
	valid: boolean;
	
	/** Array of validation errors */
	errors: string[];
	
	/** Array of validation warnings */
	warnings: string[];
}

/**
 * Custom field manager configuration
 */
export interface CustomFieldManagerConfig {
	/** Whether to enable caching */
	enable_cache?: boolean;
	
	/** Cache TTL in seconds */
	cache_ttl?: number;
	
	/** Whether to enable validation */
	enable_validation?: boolean;
	
	/** Whether to enable migration support */
	enable_migration_support?: boolean;
	
	/** Whether to enable API support */
	enable_api_support?: boolean;
	
	/** Custom field table name */
	custom_field_table_name?: string;
	
	/** Custom field value table name */
	custom_field_value_table_name?: string;
}

/**
 * Property Setter Types and Interfaces
 *
 * This section defines TypeScript interfaces for property setters, which allow
 * modifying existing field properties without touching the original DocType.
 */

/**
 * Property Setter definition for modifying field or DocType properties
 */
export interface PropertySetter {
	/** Unique identifier for the property setter */
	name?: string;
	
	/** DocType this property setter applies to */
	doctype: string;
	
	/** Field name this property setter applies to (undefined for DocType-level setters) */
	fieldname?: string;
	
	/** Property name to modify */
	property: string;
	
	/** Property value to set */
	value: any;
	
	/** Whether this property setter is enabled */
	enabled?: boolean;
	
	/** Priority of this property setter (higher numbers have higher priority) */
	priority?: number;
	
	/** Description of what this property setter does */
	description?: string;
	
	/** Property setter creation timestamp */
	creation?: Date;
	
	/** Property setter modification timestamp */
	modified?: Date;
	
	/** Property setter owner */
	owner?: string;
	
	/** Property setter modified by */
	modified_by?: string;
	
	/** Property setter name */
	parent?: string;
	
	/** Property setter parent field */
	parentfield?: string;
	
	/** Property setter parent type */
	parenttype?: string;
	
	/** Property setter index */
	idx?: number;
	
	/** Property setter docstatus */
	docstatus?: number;
}

/**
 * Property Setter creation options
 */
export interface SetPropertyOptions {
	/** DocType to apply the property setter to */
	doctype: string;
	
	/** Field name to apply the property setter to (undefined for DocType-level setters) */
	fieldname?: string;
	
	/** Property name to modify */
	property: string;
	
	/** Property value to set */
	value: any;
	
	/** Whether this property setter is enabled */
	enabled?: boolean;
	
	/** Priority of this property setter (higher numbers have higher priority) */
	priority?: number;
	
	/** Description of what this property setter does */
	description?: string;
}

/**
 * Property Setter query options
 */
export interface PropertySetterQueryOptions {
	/** DocType to filter by */
	doctype?: string;
	
	/** Field name to filter by */
	fieldname?: string;
	
	/** Property name to filter by */
	property?: string;
	
	/** Whether to include disabled property setters */
	include_disabled?: boolean;
	
	/** Maximum number of results to return */
	limit?: number;
	
	/** Number of results to skip */
	offset?: number;
	
	/** Field to sort by */
	sort_by?: string;
	
	/** Sort order */
	sort_order?: 'asc' | 'desc';
}

/**
 * Property Setter validation result
 */
export interface PropertySetterValidationResult {
	/** Whether the property setter is valid */
	valid: boolean;
	
	/** Array of validation errors */
	errors: string[];
	
	/** Array of validation warnings */
	warnings: string[];
}

/**
 * Property Setter manager configuration
 */
export interface PropertySetterManagerConfig {
	/** Whether to enable caching */
	enable_cache?: boolean;
	
	/** Cache TTL in seconds */
	cache_ttl?: number;
	
	/** Whether to enable validation */
	enable_validation?: boolean;
	
	/** Whether to enable database persistence */
	enable_database_persistence?: boolean;
	
	/** Property setter table name */
	property_setter_table_name?: string;
}

/**
 * Supported field properties for property setters
 */
export const SUPPORTED_FIELD_PROPERTIES = [
	'label', 'hidden', 'default', 'reqd', 'read_only', 'description', 'options', 'length', 'unique',
	'depends_on', 'mandatory_depends_on', 'read_only_depends_on', 'hidden_depends_on',
	'in_list_view', 'in_standard_filter', 'in_global_search', 'allow_in_quick_entry',
	'bold', 'collapsible', 'collapsible_depends_on'
] as const;

/**
 * Supported DocType properties for property setters
 */
export const SUPPORTED_DOCTYPE_PROPERTIES = [
	'engine', 'name', 'module', 'label', 'search_fields', 'title_field', 'description',
	'allow_rename', 'autoname'
] as const;

/**
 * Type for supported field properties
 */
export type SupportedFieldProperty = typeof SUPPORTED_FIELD_PROPERTIES[number];

/**
 * Type for supported DocType properties
 */
export type SupportedDocTypeProperty = typeof SUPPORTED_DOCTYPE_PROPERTIES[number];