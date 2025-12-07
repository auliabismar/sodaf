/**
 * Form Schema Types and Interfaces
 * 
 * This file defines comprehensive TypeScript interfaces for FormSchema, FormField,
 * FormSection, and related structures for the form generation system.
 */

import type { DocField, DocType } from '../doctype/types';

/**
 * FormSchema interface representing a complete form definition derived from a DocType
 */
export interface FormSchema {
	/** Reference to the source DocType */
	doctype: string;
	
	/** Array of form sections (if no tabs) */
	sections?: FormSection[];
	
	/** Array of tabs (alternative to sections) */
	tabs?: FormTab[];
	
	/** Form layout configuration */
	layout: FormLayout;
	
	/** Form-level validation rules */
	validation?: ValidationRule[];
	
	/** Form event handlers */
	events?: FormEvent;
	
	/** Custom scripts for form behavior */
	scripts?: FormScript[];
	
	/** Form metadata */
	metadata?: FormMetadata;
}

/**
 * FormSection interface representing a logical grouping of fields within a form
 */
export interface FormSection {
	/** Section identifier (unique within form) */
	fieldname: string;
	
	/** Section display label */
	label: string;
	
	/** Whether section is collapsible */
	collapsible?: boolean;
	
	/** Whether section starts collapsed */
	collapsed?: boolean;
	
	/** Section visibility condition */
	condition?: string;
	
	/** Columns within this section */
	columns?: FormColumn[];
	
	/** Fields directly in section (if no columns) */
	fields?: FormField[];
	
	/** CSS class for section styling */
	class?: string;
	
	/** Section description */
	description?: string;
	
	/** Section order in form */
	order?: number;
	
	/** Whether section depends on other fields */
	depends_on?: string;
	
	/** Whether section is hidden */
	hidden?: boolean;
}

/**
 * FormColumn interface representing column layouts within sections
 */
export interface FormColumn {
	/** Fields in this column */
	fields: FormField[];
	
	/** Column width (percentage or fraction) */
	width?: string | number;
	
	/** CSS class for column styling */
	class?: string;
	
	/** Column order within section */
	order?: number;
	
	/** Whether column is responsive */
	responsive?: {
		/** Width for small screens */
		sm?: string | number;
		/** Width for medium screens */
		md?: string | number;
		/** Width for large screens */
		lg?: string | number;
	};
}

/**
 * FormField interface representing an individual field in the form
 */
export interface FormField {
	/** Field name (matches DocField.fieldname) */
	fieldname: string;
	
	/** Field type (matches DocField.fieldtype) */
	fieldtype: import('../doctype/types').FieldType;
	
	/** Field display label */
	label: string;
	
	/** Whether field is required */
	required?: boolean;
	
	/** Whether field is read-only */
	read_only?: boolean;
	
	/** Whether field is hidden */
	hidden?: boolean;
	
	/** Default value for field */
	default?: any;
	
	/** Field options (for Select, Link, etc.) */
	options?: string;
	
	/** Field validation rules */
	validation?: ValidationRule[];
	
	/** Field visibility condition */
	condition?: string;
	
	/** Field change event handler */
	on_change?: string;
	
	/** Field width */
	width?: string;
	
	/** CSS class for field styling */
	class?: string;
	
	/** Field description/help text */
	description?: string;
	
	/** Field placeholder text */
	placeholder?: string;
	
	/** Field order in form */
	order?: number;
	
	/** Whether field depends on other fields */
	depends_on?: string;
	
	/** Field-specific properties */
	properties?: Record<string, any>;
	
	/** Field group for related fields */
	group?: string;
	
	/** Whether field is translatable */
	translatable?: boolean;
	
	/** Field precision for numeric fields */
	precision?: number;
	
	/** Field length for text fields */
	length?: number;
	
	/** Field minimum value */
	min?: number;
	
	/** Field maximum value */
	max?: number;
	
	/** Field step for numeric inputs */
	step?: number;
	
	/** Field pattern for validation */
	pattern?: string;
	
	/** Field multiple selection support */
	multiple?: boolean;
	
	/** Field autocomplete settings */
	autocomplete?: string;
	
	/** Field spellcheck setting */
	spellcheck?: boolean;
}

/**
 * FormLayout interface defining the overall layout configuration of the form
 */
export interface FormLayout {
	/** Fields for quick entry form */
	quick_entry_fields?: string[];
	
	/** Whether form has tabs */
	has_tabs?: boolean;
	
	/** Whether form is in quick entry mode */
	quick_entry?: boolean;
	
	/** Whether form is printable */
	print_hide?: boolean;
	
	/** Form CSS class */
	class?: string;
	
	/** Form style properties */
	style?: Record<string, string>;
	
	/** Form responsive settings */
	responsive?: {
		/** Breakpoint for mobile layout */
		mobile?: number;
		/** Breakpoint for tablet layout */
		tablet?: number;
		/** Breakpoint for desktop layout */
		desktop?: number;
	};
	
	/** Form grid settings */
	grid?: {
		/** Number of columns in grid */
		columns?: number;
		/** Gap between grid items */
		gap?: string;
		/** Minimum column width */
		min_width?: string;
	};
	
	/** Form animation settings */
	animations?: {
		/** Enable form animations */
		enabled?: boolean;
		/** Animation duration */
		duration?: string;
		/** Animation easing */
		easing?: string;
	};
}

/**
 * FormTab interface representing tabbed sections in the form
 */
export interface FormTab {
	/** Tab identifier (unique within form) */
	fieldname: string;
	
	/** Tab display label */
	label: string;
	
	/** Sections within this tab */
	sections: FormSection[];
	
	/** Tab visibility condition */
	condition?: string;
	
	/** CSS class for tab styling */
	class?: string;
	
	/** Tab order in form */
	order?: number;
	
	/** Whether tab is disabled */
	disabled?: boolean;
	
	/** Whether tab is hidden */
	hidden?: boolean;
	
	/** Tab icon */
	icon?: string;
	
	/** Tab badge */
	badge?: string | number;
	
	/** Whether tab depends on other fields */
	depends_on?: string;
}

/**
 * ValidationRule interface defining validation rules for fields or forms
 */
export interface ValidationRule {
	/** Validation type */
	type: ValidationType;
	
	/** Validation error message */
	message: string;
	
	/** Validation function or expression */
	validator: string | ValidationFunction;
	
	/** Validation trigger */
	trigger?: ValidationTrigger;
	
	/** Validation priority */
	priority?: number;
	
	/** Whether validation is async */
	async?: boolean;
	
	/** Validation parameters */
	params?: Record<string, any>;
	
	/** Custom validation options */
	options?: ValidationOptions;
}

/**
 * FormEvent interface defining event handlers for form interactions
 */
export interface FormEvent {
	/** Form load event handler */
	on_load?: string;
	
	/** Form refresh event handler */
	on_refresh?: string;
	
	/** Form validate event handler */
	on_validate?: string;
	
	/** Form submit event handler */
	on_submit?: string;
	
	/** Form cancel event handler */
	on_cancel?: string;
	
	/** Form save event handler */
	on_save?: string;
	
	/** Form delete event handler */
	on_delete?: string;
	
	/** Field change event handlers */
	on_change?: Record<string, string>;
	
	/** Field focus event handlers */
	on_focus?: Record<string, string>;
	
	/** Field blur event handlers */
	on_blur?: Record<string, string>;
	
	/** Custom event handlers */
	custom?: Record<string, string>;
}

/**
 * FormScript interface for custom form behavior scripts
 */
export interface FormScript {
	/** Script identifier */
	name: string;
	
	/** Script code */
	code: string;
	
	/** Script type */
	type: 'javascript' | 'typescript';
	
	/** When to execute script */
	trigger?: 'load' | 'change' | 'submit' | 'custom';
	
	/** Script dependencies */
	dependencies?: string[];
}

/**
 * FormMetadata interface for form metadata
 */
export interface FormMetadata {
	/** Form version */
	version?: string;
	
	/** Form creation timestamp */
	created_at?: string;
	
	/** Form last modified timestamp */
	modified_at?: string;
	
	/** Form author */
	author?: string;
	
	/** Form description */
	description?: string;
	
	/** Form tags */
	tags?: string[];
	
	/** Custom metadata */
	custom?: Record<string, any>;
}

/**
 * Validation type enumeration
 */
export type ValidationType =
	| 'required'
	| 'email'
	| 'phone'
	| 'url'
	| 'number'
	| 'integer'
	| 'float'
	| 'currency'
	| 'date'
	| 'time'
	| 'datetime'
	| 'minlength'
	| 'maxlength'
	| 'min'
	| 'max'
	| 'pattern'
	| 'unique'
	| 'custom'
	| 'async';

/**
 * Validation trigger enumeration
 */
export type ValidationTrigger =
	| 'change'
	| 'blur'
	| 'submit'
	| 'manual';

/**
 * Validation function type
 */
export type ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
) => boolean | Promise<boolean>;

/**
 * Validation context interface
 */
export interface ValidationContext {
	/** Current form data */
	data: Record<string, any>;
	
	/** User permissions */
	permissions?: string[];
	
	/** Additional context */
	extra?: Record<string, any>;
}

/**
 * Validation options interface
 */
export interface ValidationOptions {
	/** Whether to show error immediately */
	immediate?: boolean;
	
	/** Whether to validate on empty field */
	validate_empty?: boolean;
	
	/** Custom error message template */
	message_template?: string;
	
	/** Validation debounce time */
	debounce?: number;
}

/**
 * Field mapping interface for Carbon-Svelte integration
 */
export interface FieldMapping {
	/** Field type */
	fieldType: import('../doctype/types').FieldType;
	
	/** Component name */
	component: string;
	
	/** Component props */
	props: Record<string, any>;
}

/**
 * Form state interface for tracking form state
 */
export interface FormState {
	/** Current form data */
	data: Record<string, any>;
	
	/** Original form data */
	original_data: Record<string, any>;
	
	/** Form validation errors */
	errors: Record<string, string[]>;
	
	/** Form dirty state */
	dirty: boolean;
	
	/** Form valid state */
	valid: boolean;
	
	/** Form loading state */
	loading: boolean;
	
	/** Form submitting state */
	submitting: boolean;
	
	/** Current active tab */
	active_tab?: string;
	
	/** Collapsed sections */
	collapsed_sections: string[];
	
	/** Hidden fields */
	hidden_fields: string[];
	
	/** Disabled fields */
	disabled_fields: string[];
}

/**
 * Form configuration interface for form generator
 */
export interface FormConfig {
	/** Whether to enable form validation */
	enable_validation?: boolean;
	
	/** Whether to enable auto-save */
	auto_save?: boolean;
	
	/** Auto-save interval in milliseconds */
	auto_save_interval?: number;
	
	/** Whether to enable form reset */
	enable_reset?: boolean;
	
	/** Whether to enable form print */
	enable_print?: boolean;
	
	/** Whether to enable form export */
	enable_export?: boolean;
	
	/** Whether to enable form import */
	enable_import?: boolean;
	
	/** Form theme */
	theme?: string;
	
	/** Form language */
	language?: string;
	
	/** Custom CSS classes */
	custom_classes?: Record<string, string>;
	
	/** Custom form styles */
	custom_styles?: Record<string, string>;
}