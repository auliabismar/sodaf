/**
 * Prop Generators - P2-011
 *
 * Specialized prop generation functions for each Carbon component type.
 * These functions convert FormField properties to Carbon component props.
 */

import type { FormField } from '../types';
import type { PropsGeneratorOptions } from './types';

/**
 * Base prop generator - applies common props to all components
 */
export function basePropsGenerator(
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
): Record<string, unknown> {
    const props: Record<string, unknown> = {
        id: field.fieldname,
        name: field.fieldname,
        labelText: field.label,
        disabled: options.disabled || field.read_only,
        readonly: options.readOnly,
        required: field.required,
        helperText: field.description,
        placeholder: field.placeholder
    };

    // Add size if specified
    if (options.size) {
        props.size = options.size;
    }

    // Add validation error state
    if (options.errors && options.errors.length > 0) {
        props.invalid = true;
        props.invalidText = options.errors[0];
    }

    return props;
}

/**
 * Text input prop generator for Data, Small Text fields
 */
export function textInputPropsGenerator(
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
): Record<string, unknown> {
    const baseProps = basePropsGenerator(field, value, options);

    return {
        ...baseProps,
        value: value ?? field.default ?? '',
        maxlength: field.length,
        autocomplete: field.autocomplete || 'off',
        spellcheck: field.spellcheck
    };
}

/**
 * Text area prop generator for Long Text, Small Text fields
 */
export function textAreaPropsGenerator(
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
): Record<string, unknown> {
    const baseProps = basePropsGenerator(field, value, options);

    // Determine row count based on field type
    const rows = field.fieldtype === 'Small Text' ? 3 : 6;

    return {
        ...baseProps,
        value: value ?? field.default ?? '',
        maxlength: field.length,
        rows,
        enableCounter: field.length !== undefined,
        maxCount: field.length
    };
}

/**
 * Password input prop generator
 */
export function passwordInputPropsGenerator(
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
): Record<string, unknown> {
    const baseProps = basePropsGenerator(field, value, options);

    return {
        ...baseProps,
        value: value ?? '',
        type: 'password',
        hidePasswordLabel: 'Hide password',
        showPasswordLabel: 'Show password'
    };
}

/**
 * Number input prop generator for Int, Float, Currency, Percent fields
 */
export function numberInputPropsGenerator(
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
): Record<string, unknown> {
    const baseProps = basePropsGenerator(field, value, options);

    // Determine step based on field type
    let step: number | string = 'any';
    if (field.fieldtype === 'Int') {
        step = 1;
    } else if (field.precision !== undefined) {
        step = Math.pow(10, -field.precision);
    }

    const props: Record<string, unknown> = {
        ...baseProps,
        value: value ?? field.default ?? null,
        step,
        min: field.min,
        max: field.max,
        allowEmpty: !field.required
    };

    // Add percent max constraint
    if (field.fieldtype === 'Percent') {
        props.max = field.max ?? 100;
        props.min = field.min ?? 0;
    }

    return props;
}

/**
 * Dropdown prop generator for Select fields
 */
export function dropdownPropsGenerator(
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
): Record<string, unknown> {
    const baseProps = basePropsGenerator(field, value, options);

    // Parse options from field.options string (newline or comma separated)
    const items = parseSelectOptions(field.options);

    // Find selected item index
    const selectedIndex = items.findIndex((item) => item.id === value);

    return {
        ...baseProps,
        items,
        selectedIndex: selectedIndex >= 0 ? selectedIndex : undefined,
        titleText: field.label,
        label: field.placeholder || 'Select an option'
    };
}

/**
 * ComboBox prop generator for Link and Dynamic Link fields
 */
export function comboBoxPropsGenerator(
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
): Record<string, unknown> {
    const baseProps = basePropsGenerator(field, value, options);

    // For Link fields, options contains the linked DocType name
    // Items will be loaded dynamically
    return {
        ...baseProps,
        items: [], // Items loaded dynamically
        selectedId: value as string | undefined,
        titleText: field.label,
        placeholder: field.placeholder || `Search ${field.options || 'items'}...`,
        shouldFilterItem: () => true // Client-side filtering disabled, server handles it
    };
}

/**
 * MultiSelect prop generator for Table MultiSelect fields
 */
export function multiSelectPropsGenerator(
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
): Record<string, unknown> {
    const baseProps = basePropsGenerator(field, value, options);

    return {
        ...baseProps,
        items: [], // Items loaded dynamically
        selectedIds: Array.isArray(value) ? value : [],
        titleText: field.label,
        label: field.placeholder || 'Select items...'
    };
}

/**
 * Date picker prop generator for Date fields
 */
export function datePickerPropsGenerator(
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
): Record<string, unknown> {
    const baseProps = basePropsGenerator(field, value, options);

    // Convert value to date string array for Carbon DatePicker
    const dateValue = parseDateValue(value);

    return {
        ...baseProps,
        datePickerType: 'single',
        value: dateValue,
        dateFormat: 'Y-m-d',
        locale: 'en'
    };
}

/**
 * DateTime picker prop generator for Datetime fields
 */
export function dateTimePropsGenerator(
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
): Record<string, unknown> {
    const baseProps = basePropsGenerator(field, value, options);

    // Parse datetime value
    const dateTimeValue = parseDateTimeValue(value);

    return {
        ...baseProps,
        dateValue: dateTimeValue.date,
        timeValue: dateTimeValue.time,
        dateFormat: 'Y-m-d',
        timeFormat: 'H:i'
    };
}

/**
 * Time picker prop generator for Time fields
 */
export function timePickerPropsGenerator(
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
): Record<string, unknown> {
    const baseProps = basePropsGenerator(field, value, options);

    return {
        ...baseProps,
        value: value ?? '',
        type: 'time'
    };
}

/**
 * Checkbox prop generator for Check fields
 */
export function checkboxPropsGenerator(
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
): Record<string, unknown> {
    return {
        id: field.fieldname,
        name: field.fieldname,
        labelText: field.label,
        checked: Boolean(value),
        disabled: options.disabled || field.read_only,
        readonly: options.readOnly
    };
}

/**
 * Toggle prop generator for Check fields (alternative)
 */
export function togglePropsGenerator(
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
): Record<string, unknown> {
    return {
        id: field.fieldname,
        name: field.fieldname,
        labelText: field.label,
        toggled: Boolean(value),
        disabled: options.disabled || field.read_only,
        labelA: 'Off',
        labelB: 'On'
    };
}

/**
 * File uploader prop generator for Attach and Attach Image fields
 */
export function fileUploaderPropsGenerator(
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
): Record<string, unknown> {
    const baseProps = basePropsGenerator(field, value, options);

    // Determine accepted file types
    let accept: string | undefined;
    if (field.fieldtype === 'Attach Image') {
        accept = 'image/*';
    }

    return {
        ...baseProps,
        labelTitle: field.label,
        labelDescription: field.description || 'Max file size is 10MB',
        buttonLabel: 'Add file',
        accept,
        multiple: field.multiple
    };
}

/**
 * Button prop generator for Button fields
 */
export function buttonPropsGenerator(
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
): Record<string, unknown> {
    return {
        id: field.fieldname,
        disabled: options.disabled || field.read_only,
        kind: 'primary',
        size: options.size || 'md'
    };
}

/**
 * Read-only display prop generator
 */
export function readOnlyPropsGenerator(
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
): Record<string, unknown> {
    return {
        id: field.fieldname,
        name: field.fieldname,
        labelText: field.label,
        value: formatDisplayValue(value, field),
        disabled: true,
        readonly: true
    };
}

/**
 * Code snippet prop generator for Code fields
 */
export function codeSnippetPropsGenerator(
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
): Record<string, unknown> {
    // Determine language from options
    const language = field.options?.toLowerCase() || 'javascript';

    return {
        type: options.readOnly ? 'single' : 'multi',
        code: (value as string) ?? '',
        language,
        hideCopyButton: options.readOnly,
        wrapText: true
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse select options from field.options string
 * Supports newline-separated and comma-separated formats
 */
export function parseSelectOptions(
    options: string | undefined
): Array<{ id: string; text: string }> {
    if (!options) {
        return [];
    }

    // Split by newline first, then by comma if no newlines
    const separator = options.includes('\n') ? '\n' : ',';
    const items = options.split(separator).map((item) => item.trim()).filter(Boolean);

    return items.map((item) => {
        // Support "value:label" format
        if (item.includes(':')) {
            const [value, label] = item.split(':').map((s) => s.trim());
            return { id: value, text: label || value };
        }
        return { id: item, text: item };
    });
}

/**
 * Parse date value to Carbon DatePicker format
 */
export function parseDateValue(value: unknown): string[] {
    if (!value) {
        return [];
    }

    if (value instanceof Date) {
        return [value.toISOString().split('T')[0]];
    }

    if (typeof value === 'string') {
        // Handle ISO date string
        const dateStr = value.split('T')[0];
        return [dateStr];
    }

    return [];
}

/**
 * Parse datetime value to separate date and time components
 */
export function parseDateTimeValue(value: unknown): { date: string[]; time: string } {
    if (!value) {
        return { date: [], time: '' };
    }

    if (value instanceof Date) {
        return {
            date: [value.toISOString().split('T')[0]],
            time: value.toTimeString().split(' ')[0].substring(0, 5)
        };
    }

    if (typeof value === 'string') {
        const [datePart, timePart] = value.split('T');
        return {
            date: datePart ? [datePart] : [],
            time: timePart ? timePart.substring(0, 5) : ''
        };
    }

    return { date: [], time: '' };
}

/**
 * Format a value for display in read-only mode
 */
export function formatDisplayValue(value: unknown, field: FormField): string {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    if (field.fieldtype === 'Currency' && typeof value === 'number') {
        return formatCurrencyValue(value, field.options);
    }

    if (field.fieldtype === 'Percent' && typeof value === 'number') {
        return `${value}%`;
    }

    if (field.fieldtype === 'Date' && value) {
        return new Date(value as string).toLocaleDateString();
    }

    if (field.fieldtype === 'Datetime' && value) {
        return new Date(value as string).toLocaleString();
    }

    return String(value);
}

/**
 * Format currency value with symbol
 */
export function formatCurrencyValue(
    value: number,
    currency?: string,
    locale: string = 'en-US'
): string {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency || 'USD'
        }).format(value);
    } catch {
        // Fallback if currency code is invalid
        return `${currency || '$'}${value.toFixed(2)}`;
    }
}
