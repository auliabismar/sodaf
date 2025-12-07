/**
 * Form Schema Validation Functions
 * 
 * This file provides built-in validation functions for form fields.
 */

import type {
	ValidationFunction,
	FormField,
	FormSchema,
	ValidationContext,
	ValidationRule
} from './types';
import { ERROR_MESSAGES } from './constants';

/**
 * Required field validation function
 */
export const validateRequired: ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): boolean => {
	if (field.fieldtype === 'Check') {
		return value === true;
	}
	return value !== null && value !== undefined && value !== '';
};

/**
 * Email validation function
 */
export const validateEmail: ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): boolean => {
	if (!value) return true; // Skip validation for empty fields unless required
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(value);
};

/**
 * Phone validation function
 */
export const validatePhone: ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): boolean => {
	if (!value) return true; // Skip validation for empty fields unless required
	const phoneRegex = /^\+?[\d\s-()]+$/;
	return phoneRegex.test(value);
};

/**
 * URL validation function
 */
export const validateUrl: ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): boolean => {
	if (!value) return true; // Skip validation for empty fields unless required
	try {
		new URL(value);
		return true;
	} catch {
		return false;
	}
};

/**
 * Number validation function
 */
export const validateNumber: ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): boolean => {
	if (!value) return true; // Skip validation for empty fields unless required
	return !isNaN(Number(value));
};

/**
 * Integer validation function
 */
export const validateInteger: ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): boolean => {
	if (!value) return true; // Skip validation for empty fields unless required
	const num = Number(value);
	return !isNaN(num) && Number.isInteger(num);
};

/**
 * Float validation function
 */
export const validateFloat: ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): boolean => {
	if (!value) return true; // Skip validation for empty fields unless required
	return !isNaN(parseFloat(value));
};

/**
 * Currency validation function
 */
export const validateCurrency: ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): boolean => {
	if (!value) return true; // Skip validation for empty fields unless required
	const currencyRegex = /^\$?\-?([1-9]\d{0,2}(,\d{3})*(\.\d{0,2})?|[1-9]\d*|0)(\.\d{0,2})?$/;
	return currencyRegex.test(value.toString());
};

/**
 * Date validation function
 */
export const validateDate: ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): boolean => {
	if (!value) return true; // Skip validation for empty fields unless required
	const date = new Date(value);
	return !isNaN(date.getTime());
};

/**
 * Time validation function
 */
export const validateTime: ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): boolean => {
	if (!value) return true; // Skip validation for empty fields unless required
	const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
	return timeRegex.test(value);
};

/**
 * DateTime validation function
 */
export const validateDateTime: ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): boolean => {
	if (!value) return true; // Skip validation for empty fields unless required
	const dateTime = new Date(value);
	return !isNaN(dateTime.getTime());
};

/**
 * Minimum length validation function
 */
export const validateMinLength: ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): boolean => {
	if (!value) return true; // Skip validation for empty fields unless required
	const minLength = (field as any).params?.minLength || 0;
	return value.toString().length >= minLength;
};

/**
 * Maximum length validation function
 */
export const validateMaxLength: ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): boolean => {
	if (!value) return true; // Skip validation for empty fields unless required
	const maxLength = (field as any).params?.maxLength || Number.MAX_SAFE_INTEGER;
	return value.toString().length <= maxLength;
};

/**
 * Minimum value validation function
 */
export const validateMin: ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): boolean => {
	if (!value) return true; // Skip validation for empty fields unless required
	const minValue = (field as any).params?.min || Number.MIN_SAFE_INTEGER;
	const numValue = Number(value);
	return !isNaN(numValue) && numValue >= minValue;
};

/**
 * Maximum value validation function
 */
export const validateMax: ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): boolean => {
	if (!value) return true; // Skip validation for empty fields unless required
	const maxValue = (field as any).params?.max || Number.MAX_SAFE_INTEGER;
	const numValue = Number(value);
	return !isNaN(numValue) && numValue <= maxValue;
};

/**
 * Pattern validation function
 */
export const validatePattern: ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): boolean => {
	if (!value) return true; // Skip validation for empty fields unless required
	const pattern = (field as any).params?.pattern;
	if (!pattern) return true;
	const regex = new RegExp(pattern);
	return regex.test(value.toString());
};

/**
 * Unique validation function (async)
 */
export const validateUnique: ValidationFunction = async (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): Promise<boolean> => {
	if (!value) return true; // Skip validation for empty fields unless required
	
	// This would typically make an API call to check uniqueness
	// For now, we'll just return true as a placeholder
	// In a real implementation, this would check against the database
	return true;
};

/**
 * Custom validation function
 */
export const validateCustom: ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): boolean => {
	const validator = (field as any).validator;
	if (!validator || typeof validator !== 'string') return true;
	
	try {
		// Create a safe evaluation context
		const func = new Function(
			'value', 'field', 'form', 'context', 'data',
			validator
		);
		return func(value, field, form, context, context.data);
	} catch (error) {
		console.error('Custom validation error:', error);
		return false;
	}
};

/**
 * Async validation function
 */
export const validateAsync: ValidationFunction = async (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): Promise<boolean> => {
	const validator = (field as any).validator;
	if (!validator || typeof validator !== 'string') return true;
	
	try {
		// Create a safe evaluation context for async functions
		const func = new Function(
			'value', 'field', 'form', 'context', 'data',
			`
			return (async () => {
				${validator}
			})();
			`
		);
		return await func(value, field, form, context, context.data);
	} catch (error) {
		console.error('Async validation error:', error);
		return false;
	}
};

/**
 * Registry of built-in validation functions
 */
export const ValidationFunctions = {
	required: validateRequired,
	email: validateEmail,
	phone: validatePhone,
	url: validateUrl,
	number: validateNumber,
	integer: validateInteger,
	float: validateFloat,
	currency: validateCurrency,
	date: validateDate,
	time: validateTime,
	datetime: validateDateTime,
	minlength: validateMinLength,
	maxlength: validateMaxLength,
	min: validateMin,
	max: validateMax,
	pattern: validatePattern,
	unique: validateUnique,
	custom: validateCustom,
	async: validateAsync
} as const;

/**
 * Function to get a validation function by type
 */
export function getValidationFunction(type: string): ValidationFunction | undefined {
	return ValidationFunctions[type as keyof typeof ValidationFunctions];
}

/**
 * Function to execute a validation rule
 */
export async function executeValidationRule(
	rule: ValidationRule,
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
): Promise<boolean> {
	let validationFunction: ValidationFunction | undefined;
	
	// Get the validation function
	if (typeof rule.validator === 'string') {
		// Check if it's a built-in validator
		validationFunction = getValidationFunction(rule.type);
		
		// If not a built-in validator, treat as custom validation
		if (!validationFunction) {
			validationFunction = validateCustom;
			// Override the validator with the custom expression
			(field as any).validator = rule.validator;
		}
	} else if (typeof rule.validator === 'function') {
		validationFunction = rule.validator;
	}
	
	if (!validationFunction) {
		console.warn(`No validation function found for type: ${rule.type}`);
		return true;
	}
	
	try {
		// Set validation parameters on the field for use in validation functions
		(field as any).params = rule.params;
		
		// Execute the validation function
		const result = await validationFunction(value, field, form, context);
		return result;
	} catch (error) {
		console.error('Validation execution error:', error);
		return false;
	}
}

/**
 * Function to validate a single field
 */
export async function validateField(
	field: FormField,
	value: any,
	form: FormSchema,
	context: ValidationContext
): Promise<{ valid: boolean; errors: string[] }> {
	const errors: string[] = [];
	
	// Skip validation if field is hidden
	if (field.hidden) {
		return { valid: true, errors };
	}
	
	// Skip validation if field is read-only
	if (field.read_only) {
		return { valid: true, errors };
	}
	
	// Get validation rules for the field
	const validationRules = field.validation || [];
	
	// Execute each validation rule
	for (const rule of validationRules) {
		const isValid = await executeValidationRule(rule, value, field, form, context);
		if (!isValid) {
			errors.push(rule.message);
		}
	}
	
	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Function to validate an entire form
 */
export async function validateForm(
	form: FormSchema,
	data: Record<string, any>,
	context: ValidationContext
): Promise<{ valid: boolean; errors: Record<string, string[]> }> {
	const errors: Record<string, string[]> = {};
	
	// Get all field names from the form
	const fieldNames = [];
	
	// If form has tabs
	if (form.tabs) {
		for (const tab of form.tabs) {
			for (const section of tab.sections) {
				// Fields directly in section
				if (section.fields) {
					fieldNames.push(...section.fields.map(f => f.fieldname));
				}
				// Fields in columns
				if (section.columns) {
					for (const column of section.columns) {
						fieldNames.push(...column.fields.map(f => f.fieldname));
					}
				}
			}
		}
	}
	// If form has sections directly
	else if (form.sections) {
		for (const section of form.sections) {
			// Fields directly in section
			if (section.fields) {
				fieldNames.push(...section.fields.map(f => f.fieldname));
			}
			// Fields in columns
			if (section.columns) {
				for (const column of section.columns) {
					fieldNames.push(...column.fields.map(f => f.fieldname));
				}
			}
		}
	}
	
	// Validate each field
	for (const fieldName of fieldNames) {
		// Find the field in the form
		let field: FormField | undefined;
		
		// Search in tabs
		if (form.tabs) {
			for (const tab of form.tabs) {
				for (const section of tab.sections) {
					// Fields directly in section
					if (section.fields) {
						field = section.fields.find(f => f.fieldname === fieldName);
						if (field) break;
					}
					// Fields in columns
					if (section.columns) {
						for (const column of section.columns) {
							field = column.fields.find(f => f.fieldname === fieldName);
							if (field) break;
						}
					}
					if (field) break;
				}
				if (field) break;
			}
		}
		// Search in sections
		else if (form.sections) {
			for (const section of form.sections) {
				// Fields directly in section
				if (section.fields) {
					field = section.fields.find(f => f.fieldname === fieldName);
					if (field) break;
				}
				// Fields in columns
				if (section.columns) {
					for (const column of section.columns) {
						field = column.fields.find(f => f.fieldname === fieldName);
						if (field) break;
					}
				}
				if (field) break;
			}
		}
		
		if (field) {
			const result = await validateField(field, data[fieldName], form, context);
			if (!result.valid) {
				errors[fieldName] = result.errors;
			}
		}
	}
	
	// Execute form-level validation rules
	if (form.validation) {
		for (const rule of form.validation) {
			const isValid = await executeValidationRule(rule, data, {} as FormField, form, context);
			if (!isValid) {
				// Add form-level error (using empty string as key for form-level errors)
				if (!errors['']) errors[''] = [];
				errors[''].push(rule.message);
			}
		}
	}
	
	return {
		valid: Object.keys(errors).length === 0,
		errors
	};
}