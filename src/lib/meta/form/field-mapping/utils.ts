/**
 * Field Mapping Utilities - P2-011
 *
 * Utility functions for working with field mappings.
 */

import type { FieldType } from '../../doctype/types';
import type { FormField } from '../types';
import type {
    ComponentMapping,
    PropsGeneratorOptions,
    FieldMappingResult
} from './types';
import { FieldMappingRegistry, getDefaultRegistry } from './registry';
import { getDefaultMapping, isLayoutFieldType, isDisplayFieldType } from './default-mappings';

/**
 * Get the appropriate Carbon component for a FormField
 * @param field - The FormField to get component for
 * @param registry - Optional registry to use (defaults to global)
 * @returns The ComponentMapping or undefined
 */
export function getComponentForField(
    field: FormField,
    registry?: FieldMappingRegistry
): ComponentMapping | undefined {
    const reg = registry || getDefaultRegistry();
    return reg.getMapping(field);
}

/**
 * Generate props for a field's Carbon component
 * @param field - The FormField to generate props for
 * @param value - Current field value
 * @param options - Prop generation options
 * @param registry - Optional registry to use (defaults to global)
 * @returns Generated props for the component
 */
export function generatePropsForField(
    field: FormField,
    value: unknown,
    options?: PropsGeneratorOptions,
    registry?: FieldMappingRegistry
): Record<string, unknown> {
    const reg = registry || getDefaultRegistry();
    const result = reg.mapField(field, value, options);
    return result?.props || {};
}

/**
 * Complete mapping function - returns component, props, and events
 * @param field - The FormField to map
 * @param value - Current field value
 * @param options - Prop generation options
 * @param registry - Optional registry to use (defaults to global)
 * @returns Complete mapping result or undefined
 */
export function mapFieldToCarbon(
    field: FormField,
    value: unknown,
    options?: PropsGeneratorOptions,
    registry?: FieldMappingRegistry
): FieldMappingResult | undefined {
    const reg = registry || getDefaultRegistry();
    return reg.mapField(field, value, options);
}

/**
 * Map multiple fields at once
 * @param fields - Array of FormFields to map
 * @param values - Record of field values
 * @param options - Prop generation options
 * @param registry - Optional registry to use (defaults to global)
 * @returns Record of fieldname to mapping results
 */
export function mapFieldsToCarbon(
    fields: FormField[],
    values: Record<string, unknown>,
    options?: PropsGeneratorOptions,
    registry?: FieldMappingRegistry
): Record<string, FieldMappingResult> {
    const result: Record<string, FieldMappingResult> = {};

    for (const field of fields) {
        // Skip layout fields
        if (isLayoutFieldType(field.fieldtype)) {
            continue;
        }

        const mapping = mapFieldToCarbon(field, values[field.fieldname], options, registry);
        if (mapping) {
            result[field.fieldname] = mapping;
        }
    }

    return result;
}

/**
 * Get all unique Carbon components required for a set of fields
 * Useful for determining imports
 * @param fields - Array of FormFields
 * @param registry - Optional registry to use (defaults to global)
 * @returns Array of unique component import paths
 */
export function getRequiredComponents(
    fields: FormField[],
    registry?: FieldMappingRegistry
): Array<{ component: string; importPath: string }> {
    const componentSet = new Map<string, string>();

    for (const field of fields) {
        const mapping = getComponentForField(field, registry);
        if (mapping && !componentSet.has(mapping.component)) {
            componentSet.set(mapping.component, mapping.importPath);
        }
    }

    return Array.from(componentSet.entries()).map(([component, importPath]) => ({
        component,
        importPath
    }));
}

/**
 * Check if a field type has a registered mapping
 * @param fieldType - The field type to check
 * @param registry - Optional registry to use (defaults to global)
 */
export function hasFieldMapping(
    fieldType: FieldType,
    registry?: FieldMappingRegistry
): boolean {
    const reg = registry || getDefaultRegistry();
    return reg.hasMapping(fieldType);
}

/**
 * Get field category based on field type
 * @param fieldType - The field type to categorize
 * @returns The field category
 */
export function getFieldCategory(
    fieldType: FieldType
): 'text' | 'number' | 'select' | 'date' | 'boolean' | 'file' | 'special' | 'display' | 'layout' {
    const textTypes: FieldType[] = [
        'Data',
        'Small Text',
        'Long Text',
        'Text Editor',
        'Markdown Editor',
        'HTML Editor',
        'Code',
        'Password'
    ];

    const numberTypes: FieldType[] = ['Int', 'Float', 'Currency', 'Percent', 'Duration'];

    const selectTypes: FieldType[] = ['Select', 'Link', 'Dynamic Link', 'Table', 'Table MultiSelect'];

    const dateTypes: FieldType[] = ['Date', 'Datetime', 'Time'];

    const booleanTypes: FieldType[] = ['Check'];

    const fileTypes: FieldType[] = ['Attach', 'Attach Image'];

    const displayTypes: FieldType[] = ['Read Only', 'Button', 'Image', 'HTML'];

    const layoutTypes: FieldType[] = ['Section Break', 'Column Break', 'Tab Break', 'Fold'];

    if (textTypes.includes(fieldType)) return 'text';
    if (numberTypes.includes(fieldType)) return 'number';
    if (selectTypes.includes(fieldType)) return 'select';
    if (dateTypes.includes(fieldType)) return 'date';
    if (booleanTypes.includes(fieldType)) return 'boolean';
    if (fileTypes.includes(fieldType)) return 'file';
    if (displayTypes.includes(fieldType)) return 'display';
    if (layoutTypes.includes(fieldType)) return 'layout';

    return 'special';
}

/**
 * Format a field value for display
 * @param field - The FormField
 * @param value - The value to format
 * @returns Formatted string representation
 */
export function formatFieldValue(field: FormField, value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    switch (field.fieldtype) {
        case 'Check':
            return value ? 'Yes' : 'No';

        case 'Currency':
            return formatCurrency(value as number, field.options);

        case 'Percent':
            return `${value}%`;

        case 'Date':
            return formatDate(value as string);

        case 'Datetime':
            return formatDateTime(value as string);

        case 'Time':
            return formatTime(value as string);

        case 'Select':
            return String(value);

        default:
            return String(value);
    }
}

/**
 * Format a number as currency
 */
function formatCurrency(value: number, currency?: string): string {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(value);
    } catch {
        return `$${value.toFixed(2)}`;
    }
}

/**
 * Format a date string
 */
function formatDate(value: string): string {
    try {
        const date = new Date(value);
        return date.toLocaleDateString();
    } catch {
        return value;
    }
}

/**
 * Format a datetime string
 */
function formatDateTime(value: string): string {
    try {
        const date = new Date(value);
        return date.toLocaleString();
    } catch {
        return value;
    }
}

/**
 * Format a time string
 */
function formatTime(value: string): string {
    try {
        // If it's a full datetime, extract time part
        if (value.includes('T')) {
            value = value.split('T')[1].substring(0, 5);
        }
        return value;
    } catch {
        return value;
    }
}

/**
 * Validate that a value is appropriate for a field type
 * @param field - The FormField
 * @param value - The value to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateFieldValue(
    field: FormField,
    value: unknown
): { isValid: boolean; error?: string } {
    // Required check
    if (field.required && (value === null || value === undefined || value === '')) {
        return { isValid: false, error: `${field.label} is required` };
    }

    // Skip further validation if empty and not required
    if (value === null || value === undefined || value === '') {
        return { isValid: true };
    }

    // Type-specific validation
    switch (field.fieldtype) {
        case 'Int':
            if (!Number.isInteger(Number(value))) {
                return { isValid: false, error: `${field.label} must be a whole number` };
            }
            break;

        case 'Float':
        case 'Currency':
        case 'Percent':
            if (isNaN(Number(value))) {
                return { isValid: false, error: `${field.label} must be a number` };
            }
            break;

        case 'Date':
        case 'Datetime':
            const date = new Date(value as string);
            if (isNaN(date.getTime())) {
                return { isValid: false, error: `${field.label} must be a valid date` };
            }
            break;
    }

    // Range validation for numeric fields
    if (
        (field.fieldtype === 'Int' ||
            field.fieldtype === 'Float' ||
            field.fieldtype === 'Currency' ||
            field.fieldtype === 'Percent') &&
        typeof value === 'number'
    ) {
        if (field.min !== undefined && value < field.min) {
            return { isValid: false, error: `${field.label} must be at least ${field.min}` };
        }
        if (field.max !== undefined && value > field.max) {
            return { isValid: false, error: `${field.label} must be at most ${field.max}` };
        }
    }

    // Length validation for text fields
    if (
        (field.fieldtype === 'Data' ||
            field.fieldtype === 'Small Text' ||
            field.fieldtype === 'Long Text') &&
        typeof value === 'string' &&
        field.length !== undefined
    ) {
        if (value.length > field.length) {
            return {
                isValid: false,
                error: `${field.label} must be at most ${field.length} characters`
            };
        }
    }

    return { isValid: true };
}
