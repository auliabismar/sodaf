/**
 * Field Mapping Types and Interfaces - P2-011
 *
 * This file defines comprehensive TypeScript interfaces for mapping DocType field types
 * to Carbon Design System Svelte components.
 */

import type { FieldType } from '../../doctype/types';
import type { FormField } from '../types';

export type { FormField };

/**
 * Represents a Carbon component mapping for a DocType field
 */
export interface ComponentMapping {
    /** Carbon component name (e.g., 'TextInput', 'NumberInput') */
    component: string;

    /** Import path for the component */
    importPath: string;

    /** Default props for this component */
    defaultProps: Record<string, unknown>;

    /** Function to generate props from FormField */
    propsGenerator: PropsGeneratorFn;

    /** Validation configuration */
    validation?: ValidationMapping;

    /** Supported events for this component */
    events?: EventMapping;
}

/**
 * Function type for generating component props
 */
export type PropsGeneratorFn = (
    field: FormField,
    value: unknown,
    options: PropsGeneratorOptions
) => Record<string, unknown>;

/**
 * Options passed to prop generators
 */
export interface PropsGeneratorOptions {
    /** Whether the form is in read-only mode */
    readOnly?: boolean;

    /** Whether the field is disabled */
    disabled?: boolean;

    /** Validation errors for this field */
    errors?: string[];

    /** Current form data for dependent fields */
    formData?: Record<string, unknown>;

    /** Theme settings */
    theme?: 'light' | 'dark';

    /** Size variant */
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Maps validation rules to Carbon component feedback
 */
export interface ValidationMapping {
    /** Whether to show inline validation */
    inline?: boolean;

    /** Error state prop name */
    invalidProp: string;

    /** Error message prop name */
    invalidTextProp: string;

    /** Warning state prop name */
    warnProp?: string;

    /** Warning message prop name */
    warnTextProp?: string;
}

/**
 * Maps component events to form handlers
 */
export interface EventMapping {
    /** Change event name */
    change: string;

    /** Input event name (for real-time updates) */
    input?: string;

    /** Blur event name */
    blur?: string;

    /** Focus event name */
    focus?: string;

    /** Custom events */
    custom?: Record<string, string>;
}

/**
 * Registry entry with override capability
 */
export interface FieldMappingEntry {
    /** Base mapping */
    mapping: ComponentMapping;

    /** Priority for override resolution (higher wins) */
    priority: number;

    /** Optional condition for when this mapping applies */
    condition?: (field: FormField) => boolean;
}

/**
 * Configuration for the field mapping registry
 */
export interface FieldMappingConfig {
    /** Whether to throw on unmapped field types */
    strictMode?: boolean;

    /** Fallback component for unmapped types */
    fallbackComponent?: ComponentMapping;

    /** Size variant for all components */
    defaultSize?: 'sm' | 'md' | 'lg' | 'xl';

    /** Default label placement */
    labelPlacement?: 'top' | 'left' | 'inline';
}

/**
 * Result of mapping a field to a Carbon component
 */
export interface FieldMappingResult {
    /** Carbon component name */
    component: string;

    /** Import path for the component */
    importPath: string;

    /** Generated props for the component */
    props: Record<string, unknown>;

    /** Event mappings */
    events: EventMapping;

    /** Validation configuration */
    validation?: ValidationMapping;
}

/**
 * Field type categories for grouped mappings
 */
export type FieldTypeCategory =
    | 'text'
    | 'richText'
    | 'code'
    | 'number'
    | 'select'
    | 'multiSelect'
    | 'dateTime'
    | 'boolean'
    | 'file'
    | 'special'
    | 'display'
    | 'layout';

/**
 * Mapping of field type categories to their component configurations
 */
export interface FieldTypeCategoryMapping {
    category: FieldTypeCategory;
    fieldTypes: FieldType[];
    defaultComponent: string;
    defaultImportPath: string;
}
