/**
 * Form Schema Module Exports
 * 
 * This file exports all form schema types, utilities, and constants for the form system.
 */

// Export all types from types.ts
export type {
	FormSchema,
	FormSection,
	FormColumn,
	FormField,
	FormLayout,
	FormTab,
	ValidationRule,
	FormEvent,
	FormScript,
	FormMetadata,
	ValidationType,
	ValidationTrigger,
	ValidationFunction,
	ValidationContext,
	ValidationOptions,
	FieldMapping,
	FormState,
	FormConfig
} from './types';

// Re-export FieldType from DocType for convenience
export type { FieldType } from '../doctype/types';

// Export constants
export * from './constants';

// Export utility functions
export * from './utils'

// Export validation functions
export * from './validators';

// Export helper functions
export * from './helpers';

// Export Form Generator
export {
	FormGenerator,
	createFormGenerator,
	generateFormSchema,
	generateFormSchemaWithResult
} from './form-generator';

export type {
	FormGeneratorOptions,
	FormGenerationResult
} from './form-generator';

// Export Field Mapping (P2-011)
export * from './field-mapping';