/**
 * Form Schema Utility Functions and Type Guards
 * 
 * This file provides utility functions and type guards for working with form schemas.
 */

import type {
	FormSchema,
	FormSection,
	FormColumn,
	FormField,
	FormTab,
	ValidationRule,
	FormEvent,
	FormScript,
	FormMetadata,
	ValidationType,
	ValidationTrigger,
	FieldMapping,
	FormState,
	FormConfig,
	ValidationContext,
	ValidationOptions
} from './types';
import type { DocField, DocType } from '../doctype/types';
import { FIELD_TYPES, VALIDATION_RULES, VALIDATION_TRIGGERS } from './constants';

/**
 * Type guard function to check if an object is a FormSchema
 */
export function isFormSchema(obj: any): obj is FormSchema {
	return (
		obj &&
		typeof obj === 'object' &&
		typeof obj.doctype === 'string' &&
		obj.layout !== undefined
	);
}

/**
 * Type guard function to check if an object is a FormSection
 */
export function isFormSection(obj: any): obj is FormSection {
	return (
		obj &&
		typeof obj === 'object' &&
		typeof obj.fieldname === 'string' &&
		typeof obj.label === 'string'
	);
}

/**
 * Type guard function to check if an object is a FormColumn
 */
export function isFormColumn(obj: any): obj is FormColumn {
	return (
		obj &&
		typeof obj === 'object' &&
		Array.isArray(obj.fields) &&
		obj.fields.every((field: any) => isFormField(field))
	);
}

/**
 * Type guard function to check if an object is a FormField
 */
export function isFormField(obj: any): obj is FormField {
	return (
		obj &&
		typeof obj === 'object' &&
		typeof obj.fieldname === 'string' &&
		typeof obj.fieldtype === 'string' &&
		typeof obj.label === 'string'
	);
}

/**
 * Type guard function to check if an object is a FormTab
 */
export function isFormTab(obj: any): obj is FormTab {
	return (
		obj &&
		typeof obj === 'object' &&
		typeof obj.fieldname === 'string' &&
		typeof obj.label === 'string' &&
		Array.isArray(obj.sections) &&
		obj.sections.every((section: any) => isFormSection(section))
	);
}

/**
 * Type guard function to check if an object is a ValidationRule
 */
export function isValidationRule(obj: any): obj is ValidationRule {
	return (
		obj &&
		typeof obj === 'object' &&
		Object.values(VALIDATION_RULES).includes(obj.type) &&
		typeof obj.message === 'string' &&
		(obj.validator !== undefined)
	);
}

/**
 * Type guard function to check if an object is a FormEvent
 */
export function isFormEvent(obj: any): obj is FormEvent {
	return (
		obj &&
		typeof obj === 'object' &&
		(
			obj.on_load !== undefined ||
			obj.on_refresh !== undefined ||
			obj.on_validate !== undefined ||
			obj.on_submit !== undefined ||
			obj.on_cancel !== undefined ||
			obj.on_save !== undefined ||
			obj.on_delete !== undefined ||
			obj.on_change !== undefined ||
			obj.on_focus !== undefined ||
			obj.on_blur !== undefined ||
			obj.custom !== undefined
		)
	);
}

/**
 * Type guard function to check if an object is a FormScript
 */
export function isFormScript(obj: any): obj is FormScript {
	return (
		obj &&
		typeof obj === 'object' &&
		typeof obj.name === 'string' &&
		typeof obj.code === 'string' &&
		(obj.type === 'javascript' || obj.type === 'typescript')
	);
}

/**
 * Type guard function to check if an object is a FormMetadata
 */
export function isFormMetadata(obj: any): obj is FormMetadata {
	return (
		obj &&
		typeof obj === 'object'
	);
}

/**
 * Type guard function to check if a value is a valid ValidationType
 */
export function isValidationType(value: any): value is ValidationType {
	return Object.values(VALIDATION_RULES).includes(value);
}

/**
 * Type guard function to check if a value is a valid ValidationTrigger
 */
export function isValidationTrigger(value: any): value is ValidationTrigger {
	return Object.values(VALIDATION_TRIGGERS).includes(value);
}

/**
 * Type guard function to check if a field type is a text field
 */
export function isTextField(fieldType: string): boolean {
	return [...FIELD_TYPES.TEXT, ...FIELD_TYPES.RICH_TEXT, ...FIELD_TYPES.CODE]
		.includes(fieldType as any);
}

/**
 * Type guard function to check if a field type is a numeric field
 */
export function isNumericField(fieldType: string): boolean {
	return FIELD_TYPES.NUMBER.includes(fieldType as any);
}

/**
 * Type guard function to check if a field type is a selection field
 */
export function isSelectionField(fieldType: string): boolean {
	return [...FIELD_TYPES.SELECT, ...FIELD_TYPES.MULTI_SELECT]
		.includes(fieldType as any);
}

/**
 * Type guard function to check if a field type is a date/time field
 */
export function isDateTimeField(fieldType: string): boolean {
	return FIELD_TYPES.DATE_TIME.includes(fieldType as any);
}

/**
 * Type guard function to check if a field type is a boolean field
 */
export function isBooleanField(fieldType: string): boolean {
	return FIELD_TYPES.BOOLEAN.includes(fieldType as any);
}

/**
 * Type guard function to check if a field type is a file field
 */
export function isFileField(fieldType: string): boolean {
	return FIELD_TYPES.FILE.includes(fieldType as any);
}

/**
 * Type guard function to check if a field type is a layout field
 */
export function isLayoutField(fieldType: string): boolean {
	return FIELD_TYPES.LAYOUT.includes(fieldType as any);
}

/**
 * Type guard function to check if a field type is a display field
 */
export function isDisplayField(fieldType: string): boolean {
	return FIELD_TYPES.DISPLAY.includes(fieldType as any);
}

/**
 * Function to convert a DocField to a FormField
 */
export function docFieldToFormField(docField: DocField): FormField {
	return {
		fieldname: docField.fieldname,
		fieldtype: docField.fieldtype,
		label: docField.label,
		required: docField.required,
		read_only: docField.read_only,
		hidden: docField.hidden,
		default: docField.default,
		options: docField.options,
		description: docField.description,
		width: docField.width,
		order: docField.order,
		depends_on: docField.depends_on,
		translatable: docField.translatable,
		precision: docField.precision,
		length: docField.length,
		multiple: false, // Default value, not in DocField
		autocomplete: 'off', // Default value, not in DocField
		spellcheck: true, // Default value, not in DocField
		properties: {}, // Default value, not in DocField
		group: undefined, // Default value, not in DocField
		placeholder: undefined, // Default value, not in DocField
		class: undefined, // Default value, not in DocField
		on_change: docField.change, // Map from DocField.change
		condition: undefined, // Default value, not in DocField
		validation: docField.validate ? [{
			type: 'custom',
			message: 'Validation failed',
			validator: docField.validate,
			trigger: 'change'
		}] : undefined
	};
}

/**
 * Function to create a default form state
 */
export function createDefaultFormState(): FormState {
	return {
		data: {},
		original_data: {},
		errors: {},
		dirty: false,
		valid: true,
		loading: false,
		submitting: false,
		active_tab: undefined,
		collapsed_sections: [],
		hidden_fields: [],
		disabled_fields: []
	};
}

/**
 * Function to create a default form configuration
 */
export function createDefaultFormConfig(): FormConfig {
	return {
		enable_validation: true,
		auto_save: false,
		auto_save_interval: 30000,
		enable_reset: true,
		enable_print: true,
		enable_export: true,
		enable_import: true,
		theme: 'default',
		language: 'en',
		custom_classes: {},
		custom_styles: {}
	};
}

/**
 * Function to create a default validation context
 */
export function createDefaultValidationContext(): ValidationContext {
	return {
		data: {},
		permissions: [],
		extra: {}
	};
}

/**
 * Function to create a default validation options
 */
export function createDefaultValidationOptions(): ValidationOptions {
	return {
		immediate: false,
		validate_empty: false,
		message_template: undefined,
		debounce: 300
	};
}

/**
 * Function to get all field names from a form schema
 */
export function getAllFieldNames(formSchema: FormSchema): string[] {
	const fieldNames: string[] = [];

	// If form has tabs
	if (formSchema.tabs) {
		for (const tab of formSchema.tabs) {
			for (const section of tab.sections) {
				// Fields directly in section
				if (section.fields) {
					fieldNames.push(...section.fields.map(field => field.fieldname));
				}
				// Fields in columns
				if (section.columns) {
					for (const column of section.columns) {
						fieldNames.push(...column.fields.map(field => field.fieldname));
					}
				}
			}
		}
	}
	// If form has sections directly
	else if (formSchema.sections) {
		for (const section of formSchema.sections) {
			// Fields directly in section
			if (section.fields) {
				fieldNames.push(...section.fields.map(field => field.fieldname));
			}
			// Fields in columns
			if (section.columns) {
				for (const column of section.columns) {
					fieldNames.push(...column.fields.map(field => field.fieldname));
				}
			}
		}
	}

	return fieldNames;
}

/**
 * Function to get a field by name from a form schema
 */
export function getFieldByName(formSchema: FormSchema, fieldName: string): FormField | undefined {
	// If form has tabs
	if (formSchema.tabs) {
		for (const tab of formSchema.tabs) {
			for (const section of tab.sections) {
				// Fields directly in section
				if (section.fields) {
					const field = section.fields.find(f => f.fieldname === fieldName);
					if (field) return field;
				}
				// Fields in columns
				if (section.columns) {
					for (const column of section.columns) {
						const field = column.fields.find(f => f.fieldname === fieldName);
						if (field) return field;
					}
				}
			}
		}
	}
	// If form has sections directly
	else if (formSchema.sections) {
		for (const section of formSchema.sections) {
			// Fields directly in section
			if (section.fields) {
				const field = section.fields.find(f => f.fieldname === fieldName);
				if (field) return field;
			}
			// Fields in columns
			if (section.columns) {
				for (const column of section.columns) {
					const field = column.fields.find(f => f.fieldname === fieldName);
					if (field) return field;
				}
			}
		}
	}

	return undefined;
}

/**
 * Function to check if a form schema has tabs
 */
export function hasTabs(formSchema: FormSchema): boolean {
	return !!(formSchema.tabs && formSchema.tabs.length > 0);
}

/**
 * Function to check if a form schema has sections
 */
export function hasSections(formSchema: FormSchema): boolean {
	return !!(formSchema.sections && formSchema.sections.length > 0);
}

/**
 * Function to get the total number of fields in a form schema
 */
export function getTotalFieldCount(formSchema: FormSchema): number {
	return getAllFieldNames(formSchema).length;
}

/**
 * Function to clone a form schema
 */
export function cloneFormSchema(formSchema: FormSchema): FormSchema {
	return JSON.parse(JSON.stringify(formSchema));
}

/**
 * Function to merge two form configurations
 */
export function mergeFormConfigs(base: FormConfig, override: Partial<FormConfig>): FormConfig {
	return {
		...base,
		...override,
		custom_classes: { ...base.custom_classes, ...override.custom_classes },
		custom_styles: { ...base.custom_styles, ...override.custom_styles }
	};
}