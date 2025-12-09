/**
 * Custom Field Validators
 * 
 * This module provides validation logic for custom fields, ensuring that
 * custom field definitions are valid before they are created or updated.
 */

import type {
	CustomField,
	CreateCustomFieldOptions,
	UpdateCustomFieldOptions,
	PropertySetter,
	SetPropertyOptions,
	SupportedFieldProperty,
	SupportedDocTypeProperty
} from './types';
import {
	SUPPORTED_FIELD_PROPERTIES,
	SUPPORTED_DOCTYPE_PROPERTIES
} from './types';
import type { FieldType } from '../doctype/types';
import {
	createFailureValidationResult,
	createSuccessValidationResult,
	type ValidationResult
} from './errors';

/**
 * Supported field types for custom fields
 */
const SUPPORTED_FIELD_TYPES: FieldType[] = [
	'Data',
	'Long Text',
	'Small Text',
	'Text Editor',
	'Code',
	'Markdown Editor',
	'HTML Editor',
	'Int',
	'Float',
	'Currency',
	'Percent',
	'Check',
	'Select',
	'Link',
	'Dynamic Link',
	'Date',
	'Datetime',
	'Time',
	'Duration',
	'Geolocation',
	'Attach',
	'Attach Image',
	'Signature',
	'Color',
	'Rating',
	'Password',
	'Read Only'
];

/**
 * Reserved field names that cannot be used for custom fields
 */
const RESERVED_FIELD_NAMES = [
	'name',
	'creation',
	'modified',
	'modified_by',
	'owner',
	'docstatus',
	'parent',
	'parentfield',
	'parenttype',
	'idx',
	'__last_sync',
	'__islocal',
	'__unsaved',
	'__newname',
	'__oldname',
	'__is synced',
	'__run_triggers',
	'__workflow',
	'__workflow_actions',
	'__workflow_comments',
	'__workflow_documents',
	'__workflow_history',
	'__workflow_state',
	'__workflow_status',
	'__workflow_transition',
	'__workflow_transitions',
	'__workflow_users',
	'__workflow_validations',
	'__workflow_variables'
];

/**
 * Validate a field name
 * @param fieldname Field name to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateFieldName(fieldname: string): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	// Check if fieldname is provided
	if (!fieldname || fieldname.trim() === '') {
		errors.push('Field name is required');
		return createFailureValidationResult(errors, warnings);
	}
	
	// Check if fieldname is a string
	if (typeof fieldname !== 'string') {
		errors.push('Field name must be a string');
		return createFailureValidationResult(errors, warnings);
	}
	
	// Check if fieldname is too long
	if (fieldname.length > 140) {
		errors.push('Field name cannot be longer than 140 characters');
	}
	
	// Check if fieldname contains invalid characters
	if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldname)) {
		errors.push(
			'Field name must start with a letter or underscore and contain only letters, numbers, and underscores'
		);
	}
	
	// Check if fieldname is a reserved name
	if (RESERVED_FIELD_NAMES.includes(fieldname)) {
		errors.push(`Field name '${fieldname}' is reserved and cannot be used`);
	}
	
	// Check if fieldname is a JavaScript keyword
	const jsKeywords = [
		'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else',
		'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new',
		'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield'
	];
	if (jsKeywords.includes(fieldname)) {
		warnings.push(`Field name '${fieldname}' is a JavaScript keyword and may cause issues`);
	}
	
	// Check if fieldname starts with 'cf_' (custom field prefix)
	if (!fieldname.startsWith('cf_')) {
		warnings.push("Custom field names should start with 'cf_' to avoid conflicts with standard fields");
	}
	
	return errors.length > 0 ? createFailureValidationResult(errors, warnings) : createSuccessValidationResult(warnings);
}

/**
 * Validate a field label
 * @param label Field label to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateFieldLabel(label: string): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	// Check if label is provided
	if (!label || label.trim() === '') {
		errors.push('Field label is required');
		return createFailureValidationResult(errors, warnings);
	}
	
	// Check if label is a string
	if (typeof label !== 'string') {
		errors.push('Field label must be a string');
		return createFailureValidationResult(errors, warnings);
	}
	
	// Check if label is too long
	if (label.length > 255) {
		errors.push('Field label cannot be longer than 255 characters');
	}
	
	return errors.length > 0 ? createFailureValidationResult(errors, warnings) : createSuccessValidationResult(warnings);
}

/**
 * Validate a field type
 * @param fieldtype Field type to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateFieldType(fieldtype: FieldType): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	// Check if fieldtype is provided
	if (!fieldtype) {
		errors.push('Field type is required');
		return createFailureValidationResult(errors, warnings);
	}
	
	// Check if fieldtype is supported
	if (!SUPPORTED_FIELD_TYPES.includes(fieldtype)) {
		errors.push(`Field type '${fieldtype}' is not supported for custom fields`);
	}
	
	return errors.length > 0 ? createFailureValidationResult(errors, warnings) : createSuccessValidationResult(warnings);
}

/**
 * Validate field options based on field type
 * @param fieldtype Field type
 * @param options Field options to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateFieldOptions(fieldtype: FieldType, options?: string): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	// Check if options are required for this field type
	if (['Select', 'Link', 'Dynamic Link'].includes(fieldtype) && (!options || options.trim() === '')) {
		errors.push(`Field options are required for field type '${fieldtype}'`);
	}
	
	// Check if options are provided for field types that don't use them
	if (!['Select', 'Link', 'Dynamic Link'].includes(fieldtype) && options && options.trim() !== '') {
		warnings.push(`Field options are not typically used for field type '${fieldtype}'`);
	}
	
	return errors.length > 0 ? createFailureValidationResult(errors, warnings) : createSuccessValidationResult(warnings);
}

/**
 * Validate field length based on field type
 * @param fieldtype Field type
 * @param length Field length to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateFieldLength(fieldtype: FieldType, length?: number): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	// Check if length is provided for text fields
	if (['Data', 'Small Text'].includes(fieldtype) && !length) {
		warnings.push(`Field length should be specified for field type '${fieldtype}'`);
	}
	
	// Check if length is provided for non-text fields
	if (!['Data', 'Long Text', 'Small Text', 'Text Editor', 'Code', 'Markdown Editor', 'HTML Editor', 'Password'].includes(fieldtype) && length) {
		warnings.push(`Field length is not typically used for field type '${fieldtype}'`);
	}
	
	// Check if length is valid
	if (length !== undefined && (length <= 0 || length > 1000000)) {
		errors.push('Field length must be between 1 and 1000000');
	}
	
	return errors.length > 0 ? createFailureValidationResult(errors, warnings) : createSuccessValidationResult(warnings);
}

/**
 * Validate field default value based on field type
 * @param fieldtype Field type
 * @param defaultValue Default value to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateFieldDefaultValue(fieldtype: FieldType, defaultValue?: any): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	if (defaultValue === undefined || defaultValue === null) {
		return createSuccessValidationResult(warnings);
	}
	
	// Check if default value is valid for field type
	switch (fieldtype) {
		case 'Int':
			if (!Number.isInteger(defaultValue)) {
				errors.push('Default value for Int field must be an integer');
			}
			break;
		case 'Float':
		case 'Currency':
		case 'Percent':
			if (typeof defaultValue !== 'number') {
				errors.push(`Default value for ${fieldtype} field must be a number`);
			}
			break;
		case 'Check':
			if (typeof defaultValue !== 'boolean') {
				errors.push('Default value for Check field must be a boolean');
			}
			break;
		case 'Date':
			if (!(defaultValue instanceof Date) && typeof defaultValue !== 'string') {
				errors.push('Default value for Date field must be a Date object or string');
			}
			break;
		case 'Datetime':
			if (!(defaultValue instanceof Date) && typeof defaultValue !== 'string') {
				errors.push('Default value for Datetime field must be a Date object or string');
			}
			break;
		case 'Time':
			if (typeof defaultValue !== 'string') {
				errors.push('Default value for Time field must be a string');
			}
			break;
		case 'Data':
		case 'Long Text':
		case 'Small Text':
		case 'Text Editor':
		case 'Code':
		case 'Markdown Editor':
		case 'HTML Editor':
		case 'Password':
		case 'Select':
		case 'Link':
		case 'Dynamic Link':
		case 'Duration':
		case 'Geolocation':
		case 'Color':
		case 'Read Only':
			if (typeof defaultValue !== 'string') {
				errors.push(`Default value for ${fieldtype} field must be a string`);
			}
			break;
	}
	
	return errors.length > 0 ? createFailureValidationResult(errors, warnings) : createSuccessValidationResult(warnings);
}

/**
 * Validate field dependencies
 * @param dependsOn Field dependencies to validate
 * @param existingFields Existing field names in the DocType
 * @returns ValidationResult with validation status and errors
 */
export function validateFieldDependencies(
	dependsOn?: string,
	existingFields: string[] = []
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	if (!dependsOn || dependsOn.trim() === '') {
		return createSuccessValidationResult(warnings);
	}
	
	// Check if dependency field exists
	if (existingFields.length > 0 && !existingFields.includes(dependsOn)) {
		errors.push(`Dependency field '${dependsOn}' does not exist in the DocType`);
	}
	
	return errors.length > 0 ? createFailureValidationResult(errors, warnings) : createSuccessValidationResult(warnings);
}

/**
 * Validate a complete custom field definition
 * @param customField Custom field to validate
 * @param existingFields Existing field names in the DocType
 * @returns ValidationResult with validation status and errors
 */
export function validateCustomField(
	customField: CustomField,
	existingFields: string[] = []
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	// Validate field name
	const fieldNameResult = validateFieldName(customField.fieldname);
	errors.push(...fieldNameResult.errors);
	warnings.push(...fieldNameResult.warnings);
	
	// Validate field label
	const fieldLabelResult = validateFieldLabel(customField.label);
	errors.push(...fieldLabelResult.errors);
	warnings.push(...fieldLabelResult.warnings);
	
	// Validate field type
	const fieldTypeResult = validateFieldType(customField.fieldtype);
	errors.push(...fieldTypeResult.errors);
	warnings.push(...fieldTypeResult.warnings);
	
	// Validate field options
	const fieldOptionsResult = validateFieldOptions(customField.fieldtype, customField.options);
	errors.push(...fieldOptionsResult.errors);
	warnings.push(...fieldOptionsResult.warnings);
	
	// Validate field length
	const fieldLengthResult = validateFieldLength(customField.fieldtype, customField.length);
	errors.push(...fieldLengthResult.errors);
	warnings.push(...fieldLengthResult.warnings);
	
	// Validate default value
	const defaultValueResult = validateFieldDefaultValue(customField.fieldtype, customField.default);
	errors.push(...defaultValueResult.errors);
	warnings.push(...defaultValueResult.warnings);
	
	// Validate dependencies
	const dependenciesResult = validateFieldDependencies(customField.depends_on, existingFields);
	errors.push(...dependenciesResult.errors);
	warnings.push(...dependenciesResult.warnings);
	
	return errors.length > 0 ? createFailureValidationResult(errors, warnings) : createSuccessValidationResult(warnings);
}

/**
 * Validate custom field creation options
 * @param options Custom field creation options to validate
 * @param existingFields Existing field names in the DocType
 * @returns ValidationResult with validation status and errors
 */
export function validateCreateCustomFieldOptions(
	options: CreateCustomFieldOptions,
	existingFields: string[] = []
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	// Check if DocType is provided
	if (!options.dt || options.dt.trim() === '') {
		errors.push('DocType is required');
	}
	
	// Validate field name
	const fieldNameResult = validateFieldName(options.fieldname);
	errors.push(...fieldNameResult.errors);
	warnings.push(...fieldNameResult.warnings);
	
	// Check if field name already exists
	if (existingFields.includes(options.fieldname)) {
		errors.push(`Field '${options.fieldname}' already exists in the DocType`);
	}
	
	// Validate field label
	const fieldLabelResult = validateFieldLabel(options.label);
	errors.push(...fieldLabelResult.errors);
	warnings.push(...fieldLabelResult.warnings);
	
	// Validate field type
	const fieldTypeResult = validateFieldType(options.fieldtype);
	errors.push(...fieldTypeResult.errors);
	warnings.push(...fieldTypeResult.warnings);
	
	// Validate field options
	const fieldOptionsResult = validateFieldOptions(options.fieldtype, options.options);
	errors.push(...fieldOptionsResult.errors);
	warnings.push(...fieldOptionsResult.warnings);
	
	// Validate field length
	const fieldLengthResult = validateFieldLength(options.fieldtype, options.length);
	errors.push(...fieldLengthResult.errors);
	warnings.push(...fieldLengthResult.warnings);
	
	// Validate default value
	const defaultValueResult = validateFieldDefaultValue(options.fieldtype, options.default);
	errors.push(...defaultValueResult.errors);
	warnings.push(...defaultValueResult.warnings);
	
	// Validate dependencies
	const dependenciesResult = validateFieldDependencies(options.depends_on, existingFields);
	errors.push(...dependenciesResult.errors);
	warnings.push(...dependenciesResult.warnings);
	
	return errors.length > 0 ? createFailureValidationResult(errors, warnings) : createSuccessValidationResult(warnings);
}

/**
 * Validate custom field update options
 * @param options Custom field update options to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateUpdateCustomFieldOptions(options: UpdateCustomFieldOptions): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	// Validate field label if provided
	if (options.label !== undefined) {
		const fieldLabelResult = validateFieldLabel(options.label);
		errors.push(...fieldLabelResult.errors);
		warnings.push(...fieldLabelResult.warnings);
	}
	
	// Validate field type if provided
	if (options.fieldtype !== undefined) {
		const fieldTypeResult = validateFieldType(options.fieldtype);
		errors.push(...fieldTypeResult.errors);
		warnings.push(...fieldTypeResult.warnings);
	}
	
	// Validate field options if provided
	if (options.options !== undefined) {
		const fieldOptionsResult = validateFieldOptions(options.fieldtype || 'Data', options.options);
		errors.push(...fieldOptionsResult.errors);
		warnings.push(...fieldOptionsResult.warnings);
	}
	
	// Validate field length if provided
	if (options.length !== undefined) {
		const fieldLengthResult = validateFieldLength(options.fieldtype || 'Data', options.length);
		errors.push(...fieldLengthResult.errors);
		warnings.push(...fieldLengthResult.warnings);
	}
	
	// Validate default value if provided
	if (options.default !== undefined) {
		const defaultValueResult = validateFieldDefaultValue(options.fieldtype || 'Data', options.default);
		errors.push(...defaultValueResult.errors);
		warnings.push(...defaultValueResult.warnings);
	}
	
	return errors.length > 0 ? createFailureValidationResult(errors, warnings) : createSuccessValidationResult(warnings);
}

/**
 * Validate a DocType name
 * @param doctype DocType name to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateDocTypeName(doctype: string): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	// Check if doctype is provided
	if (!doctype || doctype.trim() === '') {
		errors.push('DocType name is required');
		return createFailureValidationResult(errors, warnings);
	}
	
	// Check if doctype is a string
	if (typeof doctype !== 'string') {
		errors.push('DocType name must be a string');
		return createFailureValidationResult(errors, warnings);
	}
	
	// Check if doctype is too long
	if (doctype.length > 140) {
		errors.push('DocType name cannot be longer than 140 characters');
	}
	
	// Check if doctype contains invalid characters
	if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(doctype)) {
		errors.push(
			'DocType name must start with a letter or underscore and contain only letters, numbers, and underscores'
		);
	}
	
	return errors.length > 0 ? createFailureValidationResult(errors, warnings) : createSuccessValidationResult(warnings);
}

/**
 * Validate a field name for property setter
 * @param fieldname Field name to validate
 * @param existingFields Existing field names in the DocType
 * @returns ValidationResult with validation status and errors
 */
export function validateFieldnameForPropertySetter(
	fieldname: string | undefined,
	existingFields: string[] = []
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	// Field name is optional (undefined for DocType-level setters)
	if (fieldname === undefined) {
		return createSuccessValidationResult(warnings);
	}
	
	// Check if fieldname is a string
	if (typeof fieldname !== 'string') {
		errors.push('Field name must be a string');
		return createFailureValidationResult(errors, warnings);
	}
	
	// Check if fieldname is too long
	if (fieldname.length > 140) {
		errors.push('Field name cannot be longer than 140 characters');
	}
	
	// Check if fieldname contains invalid characters
	if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldname)) {
		errors.push(
			'Field name must start with a letter or underscore and contain only letters, numbers, and underscores'
		);
	}
	
	// Check if field exists in the DocType
	if (existingFields.length > 0 && !existingFields.includes(fieldname)) {
		errors.push(`Field '${fieldname}' does not exist in the DocType`);
	}
	
	return errors.length > 0 ? createFailureValidationResult(errors, warnings) : createSuccessValidationResult(warnings);
}

/**
 * Validate a property name for property setter
 * @param property Property name to validate
 * @param fieldname Field name (undefined for DocType-level setters)
 * @returns ValidationResult with validation status and errors
 */
export function validatePropertyName(
	property: string,
	fieldname?: string
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	// Check if property is provided
	if (!property || property.trim() === '') {
		errors.push('Property name is required');
		return createFailureValidationResult(errors, warnings);
	}
	
	// Check if property is a string
	if (typeof property !== 'string') {
		errors.push('Property name must be a string');
		return createFailureValidationResult(errors, warnings);
	}
	
	// Check if property is supported
	if (fieldname === undefined) {
		// DocType-level property
		if (!SUPPORTED_DOCTYPE_PROPERTIES.includes(property as SupportedDocTypeProperty)) {
			errors.push(`Property '${property}' is not supported for DocType-level setters`);
		}
	} else {
		// Field-level property
		if (!SUPPORTED_FIELD_PROPERTIES.includes(property as SupportedFieldProperty)) {
			errors.push(`Property '${property}' is not supported for field-level setters`);
		}
	}
	
	return errors.length > 0 ? createFailureValidationResult(errors, warnings) : createSuccessValidationResult(warnings);
}

/**
 * Validate a property value for property setter
 * @param property Property name
 * @param value Property value to validate
 * @param fieldname Field name (undefined for DocType-level setters)
 * @returns ValidationResult with validation status and errors
 */
export function validatePropertyValue(
	property: string,
	value: any,
	fieldname?: string
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	// Check if value is provided
	if (value === undefined) {
		errors.push('Property value is required');
		return createFailureValidationResult(errors, warnings);
	}
	
	// Validate specific property types
	switch (property) {
		case 'length':
			if (typeof value !== 'number' || value <= 0 || value > 1000000) {
				errors.push('Property value for length must be a number between 1 and 1000000');
			}
			break;
			
		case 'hidden':
		case 'reqd':
		case 'read_only':
		case 'unique':
		case 'in_list_view':
		case 'in_standard_filter':
		case 'in_global_search':
		case 'allow_in_quick_entry':
		case 'bold':
		case 'collapsible':
		case 'allow_rename':
		case 'translatable':
		case 'no_copy':
		case 'remember_last_selected':
		case 'deprecated':
		case 'search_index':
		case 'email_trigger':
		case 'timeline':
		case 'track_seen':
		case 'track_visits':
		case 'unique_across_doctypes':
		case 'ignore_user_permissions':
		case 'ignore_xss_filtered':
		case 'allow_on_submit':
		case 'set_user_permissions':
		case 'ignore_strict_user_permissions':
			if (typeof value !== 'boolean') {
				errors.push(`Property value for ${property} must be a boolean`);
			}
			break;
			
		case 'label':
		case 'description':
		case 'options':
		case 'depends_on':
		case 'mandatory_depends_on':
		case 'read_only_depends_on':
		case 'hidden_depends_on':
		case 'collapsible_depends_on':
		case 'change':
		case 'filters':
		case 'fetch_from':
		case 'fetch_to_include':
		case 'precision_based_on':
		case 'width':
		case 'columns':
		case 'child_doctype':
		case 'image_field':
		case 'old_fieldname':
		case 'table_fieldname':
		case 'real_fieldname':
		case 'search_fields':
		case 'title_field':
		case 'autoname':
		case 'engine':
		case 'module':
			if (typeof value !== 'string') {
				errors.push(`Property value for ${property} must be a string`);
			}
			break;
			
		case 'default':
			// Default value can be any type
			break;
			
		case 'priority':
			if (typeof value !== 'number' || value < 0) {
				errors.push('Property value for priority must be a non-negative number');
			}
			break;
	}
	
	return errors.length > 0 ? createFailureValidationResult(errors, warnings) : createSuccessValidationResult(warnings);
}

/**
 * Validate a complete property setter definition
 * @param propertySetter Property setter to validate
 * @param existingFields Existing field names in the DocType
 * @returns ValidationResult with validation status and errors
 */
export function validatePropertySetter(
	propertySetter: PropertySetter,
	existingFields: string[] = []
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	// Validate DocType name
	const doctypeResult = validateDocTypeName(propertySetter.doctype);
	errors.push(...doctypeResult.errors);
	warnings.push(...doctypeResult.warnings);
	
	// Validate field name
	const fieldnameResult = validateFieldnameForPropertySetter(propertySetter.fieldname, existingFields);
	errors.push(...fieldnameResult.errors);
	warnings.push(...fieldnameResult.warnings);
	
	// Validate property name
	const propertyResult = validatePropertyName(propertySetter.property, propertySetter.fieldname);
	errors.push(...propertyResult.errors);
	warnings.push(...propertyResult.warnings);
	
	// Validate property value
	const valueResult = validatePropertyValue(propertySetter.property, propertySetter.value, propertySetter.fieldname);
	errors.push(...valueResult.errors);
	warnings.push(...valueResult.warnings);
	
	// Validate priority if provided
	if (propertySetter.priority !== undefined) {
		if (typeof propertySetter.priority !== 'number' || propertySetter.priority < 0) {
			errors.push('Priority must be a non-negative number');
		}
	}
	
	return errors.length > 0 ? createFailureValidationResult(errors, warnings) : createSuccessValidationResult(warnings);
}

/**
 * Validate property setter creation options
 * @param options Property setter creation options to validate
 * @param existingFields Existing field names in the DocType
 * @returns ValidationResult with validation status and errors
 */
export function validateSetPropertyOptions(
	options: SetPropertyOptions,
	existingFields: string[] = []
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	// Validate DocType name
	const doctypeResult = validateDocTypeName(options.doctype);
	errors.push(...doctypeResult.errors);
	warnings.push(...doctypeResult.warnings);
	
	// Validate field name
	const fieldnameResult = validateFieldnameForPropertySetter(options.fieldname, existingFields);
	errors.push(...fieldnameResult.errors);
	warnings.push(...fieldnameResult.warnings);
	
	// Validate property name
	const propertyResult = validatePropertyName(options.property, options.fieldname);
	errors.push(...propertyResult.errors);
	warnings.push(...propertyResult.warnings);
	
	// Validate property value
	const valueResult = validatePropertyValue(options.property, options.value, options.fieldname);
	errors.push(...valueResult.errors);
	warnings.push(...valueResult.warnings);
	
	// Validate priority if provided
	if (options.priority !== undefined) {
		if (typeof options.priority !== 'number' || options.priority < 0) {
			errors.push('Priority must be a non-negative number');
		}
	}
	
	return errors.length > 0 ? createFailureValidationResult(errors, warnings) : createSuccessValidationResult(warnings);
}