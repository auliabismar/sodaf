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

// Property Setter types and interfaces
export type {
	PropertySetter,
	SetPropertyOptions,
	PropertySetterQueryOptions,
	PropertySetterValidationResult,
	PropertySetterManagerConfig,
	SupportedFieldProperty,
	SupportedDocTypeProperty
} from './types';

export {
	SUPPORTED_FIELD_PROPERTIES,
	SUPPORTED_DOCTYPE_PROPERTIES
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

// Property Setter error classes
export {
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

// Property Setter validators
export {
	validateDocTypeName,
	validateFieldnameForPropertySetter,
	validatePropertyName,
	validatePropertyValue,
	validatePropertySetter,
	validateSetPropertyOptions
} from './validators';

// CustomFieldManager class
export { CustomFieldManager } from './custom-field';

// PropertySetterManager class
export { PropertySetterManager } from './property-setter';