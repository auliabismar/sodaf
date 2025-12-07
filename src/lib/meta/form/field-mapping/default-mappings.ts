/**
 * Default Field Mappings - P2-011
 *
 * Contains the default mappings for all 40+ DocType field types
 * to their corresponding Carbon Design System Svelte components.
 */

import type { FieldType } from '../../doctype/types';
import type { ComponentMapping, EventMapping, ValidationMapping } from './types';
import {
    textInputPropsGenerator,
    textAreaPropsGenerator,
    passwordInputPropsGenerator,
    numberInputPropsGenerator,
    dropdownPropsGenerator,
    comboBoxPropsGenerator,
    multiSelectPropsGenerator,
    datePickerPropsGenerator,
    dateTimePropsGenerator,
    timePickerPropsGenerator,
    checkboxPropsGenerator,
    togglePropsGenerator,
    fileUploaderPropsGenerator,
    buttonPropsGenerator,
    readOnlyPropsGenerator,
    codeSnippetPropsGenerator
} from './prop-generators';

// ============================================================================
// Common Configurations
// ============================================================================

/**
 * Standard validation mapping for text-based inputs
 */
const TEXT_VALIDATION: ValidationMapping = {
    inline: true,
    invalidProp: 'invalid',
    invalidTextProp: 'invalidText',
    warnProp: 'warn',
    warnTextProp: 'warnText'
};

/**
 * Standard event mapping for text-based inputs
 */
const TEXT_EVENTS: EventMapping = {
    change: 'change',
    input: 'input',
    blur: 'blur',
    focus: 'focus'
};

/**
 * Standard event mapping for selection inputs
 */
const SELECT_EVENTS: EventMapping = {
    change: 'select',
    blur: 'blur',
    focus: 'focus'
};

/**
 * Standard event mapping for checkbox/toggle
 */
const BOOLEAN_EVENTS: EventMapping = {
    change: 'change'
};

/**
 * Standard event mapping for file uploads
 */
const FILE_EVENTS: EventMapping = {
    change: 'change',
    custom: {
        add: 'add',
        delete: 'delete'
    }
};

// ============================================================================
// Default Field Mappings
// ============================================================================

/**
 * Default mappings for all DocType field types to Carbon components
 */
export const DEFAULT_FIELD_MAPPINGS: Record<FieldType, ComponentMapping> = {
    // =========================================================================
    // Text Fields
    // =========================================================================

    Data: {
        component: 'TextInput',
        importPath: 'carbon-components-svelte/src/TextInput',
        defaultProps: {
            type: 'text'
        },
        propsGenerator: textInputPropsGenerator,
        validation: TEXT_VALIDATION,
        events: TEXT_EVENTS
    },

    'Small Text': {
        component: 'TextArea',
        importPath: 'carbon-components-svelte/src/TextArea',
        defaultProps: {
            rows: 3
        },
        propsGenerator: textAreaPropsGenerator,
        validation: TEXT_VALIDATION,
        events: TEXT_EVENTS
    },

    'Long Text': {
        component: 'TextArea',
        importPath: 'carbon-components-svelte/src/TextArea',
        defaultProps: {
            rows: 6
        },
        propsGenerator: textAreaPropsGenerator,
        validation: TEXT_VALIDATION,
        events: TEXT_EVENTS
    },

    'Text Editor': {
        component: 'TextArea',
        importPath: 'carbon-components-svelte/src/TextArea',
        defaultProps: {
            rows: 10
        },
        propsGenerator: textAreaPropsGenerator,
        validation: TEXT_VALIDATION,
        events: TEXT_EVENTS
    },

    'Markdown Editor': {
        component: 'TextArea',
        importPath: 'carbon-components-svelte/src/TextArea',
        defaultProps: {
            rows: 10
        },
        propsGenerator: textAreaPropsGenerator,
        validation: TEXT_VALIDATION,
        events: TEXT_EVENTS
    },

    'HTML Editor': {
        component: 'TextArea',
        importPath: 'carbon-components-svelte/src/TextArea',
        defaultProps: {
            rows: 10
        },
        propsGenerator: textAreaPropsGenerator,
        validation: TEXT_VALIDATION,
        events: TEXT_EVENTS
    },

    Code: {
        component: 'CodeSnippet',
        importPath: 'carbon-components-svelte/src/CodeSnippet',
        defaultProps: {
            type: 'multi',
            wrapText: true
        },
        propsGenerator: codeSnippetPropsGenerator,
        events: {
            change: 'copy'
        }
    },

    // =========================================================================
    // Numeric Fields
    // =========================================================================

    Int: {
        component: 'NumberInput',
        importPath: 'carbon-components-svelte/src/NumberInput',
        defaultProps: {
            step: 1
        },
        propsGenerator: numberInputPropsGenerator,
        validation: TEXT_VALIDATION,
        events: TEXT_EVENTS
    },

    Float: {
        component: 'NumberInput',
        importPath: 'carbon-components-svelte/src/NumberInput',
        defaultProps: {
            step: 'any'
        },
        propsGenerator: numberInputPropsGenerator,
        validation: TEXT_VALIDATION,
        events: TEXT_EVENTS
    },

    Currency: {
        component: 'NumberInput',
        importPath: 'carbon-components-svelte/src/NumberInput',
        defaultProps: {
            step: 0.01
        },
        propsGenerator: numberInputPropsGenerator,
        validation: TEXT_VALIDATION,
        events: TEXT_EVENTS
    },

    Percent: {
        component: 'NumberInput',
        importPath: 'carbon-components-svelte/src/NumberInput',
        defaultProps: {
            step: 1,
            min: 0,
            max: 100
        },
        propsGenerator: numberInputPropsGenerator,
        validation: TEXT_VALIDATION,
        events: TEXT_EVENTS
    },

    // =========================================================================
    // Selection Fields
    // =========================================================================

    Select: {
        component: 'Dropdown',
        importPath: 'carbon-components-svelte/src/Dropdown',
        defaultProps: {},
        propsGenerator: dropdownPropsGenerator,
        validation: {
            inline: true,
            invalidProp: 'invalid',
            invalidTextProp: 'invalidText'
        },
        events: SELECT_EVENTS
    },

    Link: {
        component: 'ComboBox',
        importPath: 'carbon-components-svelte/src/ComboBox',
        defaultProps: {},
        propsGenerator: comboBoxPropsGenerator,
        validation: {
            inline: true,
            invalidProp: 'invalid',
            invalidTextProp: 'invalidText'
        },
        events: {
            change: 'select',
            input: 'input',
            blur: 'blur',
            focus: 'focus',
            custom: {
                clear: 'clear'
            }
        }
    },

    'Dynamic Link': {
        component: 'ComboBox',
        importPath: 'carbon-components-svelte/src/ComboBox',
        defaultProps: {},
        propsGenerator: comboBoxPropsGenerator,
        validation: {
            inline: true,
            invalidProp: 'invalid',
            invalidTextProp: 'invalidText'
        },
        events: {
            change: 'select',
            input: 'input',
            blur: 'blur',
            focus: 'focus'
        }
    },

    Table: {
        component: 'DataTable',
        importPath: 'carbon-components-svelte/src/DataTable',
        defaultProps: {
            sortable: true,
            zebra: true
        },
        propsGenerator: (field, value, options) => ({
            headers: [],
            rows: Array.isArray(value) ? value : []
        }),
        events: {
            change: 'update'
        }
    },

    'Table MultiSelect': {
        component: 'MultiSelect',
        importPath: 'carbon-components-svelte/src/MultiSelect',
        defaultProps: {},
        propsGenerator: multiSelectPropsGenerator,
        validation: {
            inline: true,
            invalidProp: 'invalid',
            invalidTextProp: 'invalidText'
        },
        events: SELECT_EVENTS
    },

    // =========================================================================
    // Date/Time Fields
    // =========================================================================

    Date: {
        component: 'DatePicker',
        importPath: 'carbon-components-svelte/src/DatePicker',
        defaultProps: {
            datePickerType: 'single',
            dateFormat: 'Y-m-d'
        },
        propsGenerator: datePickerPropsGenerator,
        validation: {
            inline: true,
            invalidProp: 'invalid',
            invalidTextProp: 'invalidText'
        },
        events: {
            change: 'change'
        }
    },

    Datetime: {
        component: 'DatePicker',
        importPath: 'carbon-components-svelte/src/DatePicker',
        defaultProps: {
            datePickerType: 'single',
            dateFormat: 'Y-m-d'
        },
        propsGenerator: dateTimePropsGenerator,
        validation: {
            inline: true,
            invalidProp: 'invalid',
            invalidTextProp: 'invalidText'
        },
        events: {
            change: 'change'
        }
    },

    Time: {
        component: 'TimePicker',
        importPath: 'carbon-components-svelte/src/TimePicker',
        defaultProps: {
            type: 'time'
        },
        propsGenerator: timePickerPropsGenerator,
        validation: TEXT_VALIDATION,
        events: TEXT_EVENTS
    },

    Duration: {
        component: 'NumberInput',
        importPath: 'carbon-components-svelte/src/NumberInput',
        defaultProps: {
            step: 1,
            min: 0
        },
        propsGenerator: numberInputPropsGenerator,
        validation: TEXT_VALIDATION,
        events: TEXT_EVENTS
    },

    // =========================================================================
    // Boolean Fields
    // =========================================================================

    Check: {
        component: 'Checkbox',
        importPath: 'carbon-components-svelte/src/Checkbox',
        defaultProps: {},
        propsGenerator: checkboxPropsGenerator,
        events: BOOLEAN_EVENTS
    },

    // =========================================================================
    // File Fields
    // =========================================================================

    Attach: {
        component: 'FileUploader',
        importPath: 'carbon-components-svelte/src/FileUploader',
        defaultProps: {
            buttonLabel: 'Add file',
            labelDescription: 'Max file size is 10MB'
        },
        propsGenerator: fileUploaderPropsGenerator,
        events: FILE_EVENTS
    },

    'Attach Image': {
        component: 'FileUploader',
        importPath: 'carbon-components-svelte/src/FileUploader',
        defaultProps: {
            buttonLabel: 'Add image',
            accept: 'image/*',
            labelDescription: 'Supported formats: JPEG, PNG, GIF'
        },
        propsGenerator: fileUploaderPropsGenerator,
        events: FILE_EVENTS
    },

    // =========================================================================
    // Special Fields
    // =========================================================================

    Password: {
        component: 'PasswordInput',
        importPath: 'carbon-components-svelte/src/PasswordInput',
        defaultProps: {
            type: 'password'
        },
        propsGenerator: passwordInputPropsGenerator,
        validation: TEXT_VALIDATION,
        events: TEXT_EVENTS
    },

    Color: {
        component: 'TextInput',
        importPath: 'carbon-components-svelte/src/TextInput',
        defaultProps: {
            type: 'color'
        },
        propsGenerator: textInputPropsGenerator,
        validation: TEXT_VALIDATION,
        events: TEXT_EVENTS
    },

    Rating: {
        component: 'Slider',
        importPath: 'carbon-components-svelte/src/Slider',
        defaultProps: {
            min: 0,
            max: 5,
            step: 1,
            hideTextInput: true
        },
        propsGenerator: (field, value, options) => ({
            id: field.fieldname,
            labelText: field.label,
            value: (value as number) ?? 0,
            disabled: options.disabled || field.read_only,
            min: field.min ?? 0,
            max: field.max ?? 5,
            step: 1
        }),
        events: {
            change: 'change'
        }
    },

    Signature: {
        component: 'TextArea',
        importPath: 'carbon-components-svelte/src/TextArea',
        defaultProps: {
            rows: 3,
            placeholder: 'Signature data (base64)'
        },
        propsGenerator: textAreaPropsGenerator,
        validation: TEXT_VALIDATION,
        events: TEXT_EVENTS
    },

    Geolocation: {
        component: 'TextInput',
        importPath: 'carbon-components-svelte/src/TextInput',
        defaultProps: {
            placeholder: 'Latitude, Longitude'
        },
        propsGenerator: textInputPropsGenerator,
        validation: TEXT_VALIDATION,
        events: TEXT_EVENTS
    },

    // =========================================================================
    // Display Fields
    // =========================================================================

    'Read Only': {
        component: 'TextInput',
        importPath: 'carbon-components-svelte/src/TextInput',
        defaultProps: {
            readonly: true,
            disabled: true
        },
        propsGenerator: readOnlyPropsGenerator,
        events: {
            change: 'change'
        }
    },

    Button: {
        component: 'Button',
        importPath: 'carbon-components-svelte/src/Button',
        defaultProps: {
            kind: 'primary'
        },
        propsGenerator: buttonPropsGenerator,
        events: {
            change: 'click'
        }
    },

    Image: {
        component: 'ImageLoader',
        importPath: 'carbon-components-svelte/src/ImageLoader',
        defaultProps: {},
        propsGenerator: (field, value, options) => ({
            src: value as string,
            alt: field.label
        }),
        events: {
            change: 'load'
        }
    },

    HTML: {
        component: 'div',
        importPath: 'svelte/internal',
        defaultProps: {},
        propsGenerator: (field, value) => ({
            innerHTML: value as string
        }),
        events: {
            change: 'change'
        }
    },

    // =========================================================================
    // Layout Fields (typically not rendered as inputs)
    // =========================================================================

    'Section Break': {
        component: 'Tile',
        importPath: 'carbon-components-svelte/src/Tile',
        defaultProps: {},
        propsGenerator: (field) => ({
            light: true
        }),
        events: {
            change: 'change'
        }
    },

    'Column Break': {
        component: 'Column',
        importPath: 'carbon-components-svelte/src/Grid',
        defaultProps: {},
        propsGenerator: () => ({}),
        events: {
            change: 'change'
        }
    },

    'Tab Break': {
        component: 'Tab',
        importPath: 'carbon-components-svelte/src/Tabs',
        defaultProps: {},
        propsGenerator: (field) => ({
            label: field.label
        }),
        events: {
            change: 'change'
        }
    },

    Fold: {
        component: 'Accordion',
        importPath: 'carbon-components-svelte/src/Accordion',
        defaultProps: {},
        propsGenerator: (field) => ({
            title: field.label
        }),
        events: {
            change: 'change'
        }
    }
};

/**
 * Field types that are considered layout elements (not data fields)
 */
export const LAYOUT_FIELD_TYPES: FieldType[] = [
    'Section Break',
    'Column Break',
    'Tab Break',
    'Fold'
];

/**
 * Field types that are read-only display elements
 */
export const DISPLAY_FIELD_TYPES: FieldType[] = ['Read Only', 'Button', 'Image', 'HTML'];

/**
 * Get whether a field type is a layout field
 */
export function isLayoutFieldType(fieldType: FieldType): boolean {
    return LAYOUT_FIELD_TYPES.includes(fieldType);
}

/**
 * Get whether a field type is a display-only field
 */
export function isDisplayFieldType(fieldType: FieldType): boolean {
    return DISPLAY_FIELD_TYPES.includes(fieldType);
}

/**
 * Get the default mapping for a field type
 */
export function getDefaultMapping(fieldType: FieldType): ComponentMapping | undefined {
    return DEFAULT_FIELD_MAPPINGS[fieldType];
}
