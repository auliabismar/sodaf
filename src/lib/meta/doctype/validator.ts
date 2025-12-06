/**
 * DocType Validator
 * 
 * This module implements validation logic for DocType definitions,
 * ensuring data integrity and compliance with the schema requirements.
 */

import type {
	DocType,
	DocField,
	DocPerm,
	FieldType
} from './types';
import type {
	ValidationResult,
	ValidationError
} from './errors';

/**
 * Array of all valid field types
 */
const VALID_FIELD_TYPES: FieldType[] = [
	'Data', 'Long Text', 'Small Text', 'Text Editor', 'Code',
	'Markdown Editor', 'HTML Editor', 'Int', 'Float', 'Currency',
	'Percent', 'Check', 'Select', 'Link', 'Dynamic Link',
	'Table', 'Table MultiSelect', 'Date', 'Datetime', 'Time',
	'Duration', 'Geolocation', 'Attach', 'Attach Image',
	'Signature', 'Color', 'Rating', 'Password', 'Read Only',
	'Button', 'Image', 'HTML', 'Section Break', 'Column Break',
	'Tab Break', 'Fold'
];

/**
 * Field types that require options
 */
const FIELD_TYPES_REQUIRING_OPTIONS: FieldType[] = [
	'Link', 'Table'
];

/**
 * Validator class for DocType definitions
 */
export class DocTypeValidator {
	/**
	 * Validate a complete DocType definition
	 * @param doctype DocType definition to validate
	 * @returns ValidationResult with validation status and errors
	 */
	public static validateDocType(doctype: DocType): ValidationResult {
		const errors: ValidationError[] = [];

		// Validate required properties
		errors.push(...this.validateRequiredProperties(doctype));

		// Validate fields if present
		if (doctype.fields) {
			errors.push(...this.validateFields(doctype.fields));
		}

		// Validate permissions if present
		if (doctype.permissions) {
			errors.push(...this.validatePermissions(doctype.permissions));
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}

	/**
	 * Validate required DocType properties
	 * @param doctype DocType to validate
	 * @returns Array of validation errors
	 */
	private static validateRequiredProperties(doctype: DocType): ValidationError[] {
		const errors: ValidationError[] = [];

		// Check name
		if (!doctype.name || typeof doctype.name !== 'string' || doctype.name.trim() === '') {
			errors.push({
				type: 'required',
				field: 'name',
				message: 'DocType name is required and must be a non-empty string',
				severity: 'error'
			});
		}

		// Check module
		if (!doctype.module || typeof doctype.module !== 'string' || doctype.module.trim() === '') {
			errors.push({
				type: 'required',
				field: 'module',
				message: 'DocType module is required and must be a non-empty string',
				severity: 'error'
			});
		}

		// Check fields array
		if (!Array.isArray(doctype.fields)) {
			errors.push({
				type: 'required',
				field: 'fields',
				message: 'DocType fields must be an array',
				severity: 'error'
			});
		}

		// Check permissions array
		if (!Array.isArray(doctype.permissions)) {
			errors.push({
				type: 'required',
				field: 'permissions',
				message: 'DocType permissions must be an array',
				severity: 'error'
			});
		}

		return errors;
	}

	/**
	 * Validate DocType fields
	 * @param fields Array of DocField objects to validate
	 * @returns Array of validation errors
	 */
	private static validateFields(fields: DocField[]): ValidationError[] {
		const errors: ValidationError[] = [];

		// Check for duplicate field names
		errors.push(...this.checkDuplicateFieldNames(fields));

		// Validate each field
		fields.forEach((field, index) => {
			errors.push(...this.validateField(field, index));
		});

		return errors;
	}

	/**
	 * Validate DocType permissions
	 * @param permissions Array of DocPerm objects to validate
	 * @returns Array of validation errors
	 */
	private static validatePermissions(permissions: DocPerm[]): ValidationError[] {
		const errors: ValidationError[] = [];

		permissions.forEach((permission, index) => {
			// Check role
			if (!permission.role || typeof permission.role !== 'string' || permission.role.trim() === '') {
				errors.push({
					type: 'required',
					field: `permissions[${index}].role`,
					message: 'Permission role is required and must be a non-empty string',
					severity: 'error'
				});
			}
		});

		return errors;
	}

	/**
	 * Validate a single field
	 * @param field DocField to validate
	 * @param index Index of the field in the fields array
	 * @returns Array of validation errors
	 */
	private static validateField(field: DocField, index: number): ValidationError[] {
		const errors: ValidationError[] = [];
		const fieldPrefix = `fields[${index}]`;

		// Check fieldname
		if (!field.fieldname || typeof field.fieldname !== 'string' || field.fieldname.trim() === '') {
			errors.push({
				type: 'required',
				field: `${fieldPrefix}.fieldname`,
				message: 'Field name is required and must be a non-empty string',
				severity: 'error'
			});
		}

		// Check label
		if (!field.label || typeof field.label !== 'string' || field.label.trim() === '') {
			errors.push({
				type: 'required',
				field: `${fieldPrefix}.label`,
				message: 'Field label is required and must be a non-empty string',
				severity: 'error'
			});
		}

		// Check fieldtype
		if (!field.fieldtype || typeof field.fieldtype !== 'string') {
			errors.push({
				type: 'required',
				field: `${fieldPrefix}.fieldtype`,
				message: 'Field type is required and must be a string',
				severity: 'error'
			});
		} else if (!this.isValidFieldType(field.fieldtype)) {
			errors.push({
				type: 'invalid_type',
				field: `${fieldPrefix}.fieldtype`,
				message: `Invalid field type '${field.fieldtype}'. Must be one of: ${VALID_FIELD_TYPES.join(', ')}`,
				severity: 'error'
			});
		}

		// Check options for field types that require them
		if (field.fieldtype && this.fieldTypeRequiresOptions(field.fieldtype)) {
			if (!field.options || typeof field.options !== 'string' || field.options.trim() === '') {
				errors.push({
					type: 'missing_options',
					field: `${fieldPrefix}.options`,
					message: `Field type '${field.fieldtype}' requires options to be specified`,
					severity: 'error'
				});
			}
		}

		return errors;
	}

	/**
	 * Check for duplicate field names
	 * @param fields Array of DocField objects to check
	 * @returns Array of validation errors
	 */
	private static checkDuplicateFieldNames(fields: DocField[]): ValidationError[] {
		const errors: ValidationError[] = [];
		const fieldNames = new Map<string, number>();

		fields.forEach((field, index) => {
			if (field.fieldname) {
				if (fieldNames.has(field.fieldname)) {
					const firstIndex = fieldNames.get(field.fieldname);
					errors.push({
						type: 'duplicate',
						field: `fields[${index}].fieldname`,
						message: `Duplicate field name '${field.fieldname}'. First occurrence at index ${firstIndex}`,
						severity: 'error'
					});
				} else {
					fieldNames.set(field.fieldname, index);
				}
			}
		});

		return errors;
	}

	/**
	 * Check if field type is valid
	 * @param type Field type to check
	 * @returns True if valid, false otherwise
	 */
	private static isValidFieldType(type: string): type is FieldType {
		return VALID_FIELD_TYPES.includes(type as FieldType);
	}

	/**
	 * Check if field type requires options
	 * @param type Field type to check
	 * @returns True if options are required, false otherwise
	 */
	private static fieldTypeRequiresOptions(type: FieldType): boolean {
		return FIELD_TYPES_REQUIRING_OPTIONS.includes(type);
	}
}