/**
 * DocType Module Index
 *
 * Exports all DocType-related types, interfaces, and classes
 */

// P2-001: Type definitions
export type {
	DocType,
	DocField,
	DocPerm,
	DocIndex,
	DocTypeAction,
	DocTypeLink,
	FieldType
} from './types';

// P2-002: DocType Engine
export { DocTypeEngine } from './doctype-engine';
export { DocTypeValidator } from './validator';

// P2-003: JSON Parser
export { DocTypeJSONParser } from './json-parser';

// P2-002: Error classes
export {
	DocTypeError,
	DocTypeExistsError,
	DocTypeNotFoundError,
	DocTypeValidationError
} from './doctype-engine';

// P2-003: JSON Parser Error Classes
export {
	JSONParseError,
	FileNotFoundError,
	FileIOError,
	SerializationError
} from './json-parser-errors';

// P2-004: DocType Meta Classes
export { DocTypeMeta } from './meta';
export { MetaCache } from './meta-cache';
export { MetaFactory } from './meta-factory';

// P2-002: Validation types
export type { ValidationResult as DocTypeValidationResult } from './errors';
export type { ValidationError } from './errors';// P2-015: Single DocType Implementation
export {
SingleDocument,
SingleDocTypeError,
get_single_value,
set_single_value,
is_single_doctype,
get_single_doc
} from './single-document';
export type { SingleDocumentOptions, SinglesTableRow } from './single-document';

// P2-020: Custom Field Integration
export { CustomFieldManager } from '../custom';
export type {
	CustomField,
	CreateCustomFieldOptions,
	UpdateCustomFieldOptions,
	CustomFieldQueryOptions,
	CustomFieldValidationResult,
	CustomFieldManagerConfig
} from '../custom';
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
} from '../custom';
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
} from '../custom';

// P2-021: Property Setter Integration
export { PropertySetterManager } from '../custom';
export type {
	PropertySetter,
	SetPropertyOptions,
	PropertySetterQueryOptions,
	PropertySetterValidationResult,
	PropertySetterManagerConfig,
	SupportedFieldProperty,
	SupportedDocTypeProperty
} from '../custom';
export {
	SUPPORTED_FIELD_PROPERTIES,
	SUPPORTED_DOCTYPE_PROPERTIES
} from '../custom';
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
} from '../custom';
export {
	validateDocTypeName,
	validateFieldnameForPropertySetter,
	validatePropertyName,
	validatePropertyValue,
	validatePropertySetter,
	validateSetPropertyOptions
} from '../custom';