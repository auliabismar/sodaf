/**
 * Custom Field Module
 * 
 * This module exports all the custom field functionality including types, errors,
 * validators, and the CustomFieldManager class.
 */

// Types and interfaces
export type {
	CustomField,
	CreateCustomFieldOptions,
	UpdateCustomFieldOptions,
	CustomFieldQueryOptions,
	CustomFieldValidationResult,
	CustomFieldManagerConfig
} from './types';

// Error classes
export {
	CustomFieldError,
	CustomFieldExistsError,
	CustomFieldNotFoundError,
	CustomFieldValidationError,
	CustomFieldOperationNotSupportedError,
	CustomFieldDependencyNotFoundError,
	CustomFieldTypeNotSupportedError,
	CustomFieldOperationError,
	CustomFieldDatabaseError,
	CustomFieldCacheError,
	CustomFieldConfigurationError,
	CustomFieldMigrationError,
	CustomFieldApiError,
	type ValidationResult,
	createValidationResult,
	createSuccessValidationResult,
	createFailureValidationResult
} from './errors';

// Validators
export {
	validateFieldName,
	validateFieldLabel,
	validateFieldType,
	validateFieldOptions,
	validateFieldLength,
	validateFieldDefaultValue,
	validateFieldDependencies,
	validateCustomField,
	validateCreateCustomFieldOptions,
	validateUpdateCustomFieldOptions
} from './validators';

// CustomFieldManager class
export { CustomFieldManager } from './custom-field';