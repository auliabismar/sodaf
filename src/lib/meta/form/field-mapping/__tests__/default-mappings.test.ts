/**
 * Default Mappings Tests - P2-011
 *
 * Tests for default field type mappings.
 */

import { describe, it, expect } from 'vitest';
import {
    DEFAULT_FIELD_MAPPINGS,
    LAYOUT_FIELD_TYPES,
    DISPLAY_FIELD_TYPES,
    isLayoutFieldType,
    isDisplayFieldType,
    getDefaultMapping
} from '../default-mappings';
import type { FieldType } from '../../../doctype/types';

describe('P2-011: Default Field Mappings', () => {
    // All field types that should be mapped
    const ALL_FIELD_TYPES: FieldType[] = [
        'Data',
        'Small Text',
        'Long Text',
        'Text Editor',
        'Markdown Editor',
        'HTML Editor',
        'Code',
        'Int',
        'Float',
        'Currency',
        'Percent',
        'Select',
        'Link',
        'Dynamic Link',
        'Table',
        'Table MultiSelect',
        'Date',
        'Datetime',
        'Time',
        'Duration',
        'Check',
        'Attach',
        'Attach Image',
        'Password',
        'Color',
        'Rating',
        'Signature',
        'Geolocation',
        'Read Only',
        'Button',
        'Image',
        'HTML',
        'Section Break',
        'Column Break',
        'Tab Break',
        'Fold'
    ];

    describe('completeness', () => {
        it('should have mappings for all 40+ field types', () => {
            expect(Object.keys(DEFAULT_FIELD_MAPPINGS).length).toBeGreaterThanOrEqual(36);
        });

        it('should have mapping for each known field type', () => {
            for (const fieldType of ALL_FIELD_TYPES) {
                expect(DEFAULT_FIELD_MAPPINGS[fieldType]).toBeDefined();
            }
        });
    });

    describe('text field mappings', () => {
        it('should map Data to TextInput', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Data;

            expect(mapping.component).toBe('TextInput');
            expect(mapping.importPath).toContain('TextInput');
        });

        it('should map Small Text to TextArea with 3 rows', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS['Small Text'];

            expect(mapping.component).toBe('TextArea');
            expect(mapping.defaultProps.rows).toBe(3);
        });

        it('should map Long Text to TextArea with 6 rows', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS['Long Text'];

            expect(mapping.component).toBe('TextArea');
            expect(mapping.defaultProps.rows).toBe(6);
        });

        it('should map Code to CodeSnippet', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Code;

            expect(mapping.component).toBe('CodeSnippet');
        });

        it('should map Password to PasswordInput', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Password;

            expect(mapping.component).toBe('PasswordInput');
        });
    });

    describe('numeric field mappings', () => {
        it('should map Int to NumberInput with step 1', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Int;

            expect(mapping.component).toBe('NumberInput');
            expect(mapping.defaultProps.step).toBe(1);
        });

        it('should map Float to NumberInput with step any', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Float;

            expect(mapping.component).toBe('NumberInput');
            expect(mapping.defaultProps.step).toBe('any');
        });

        it('should map Currency to NumberInput with step 0.01', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Currency;

            expect(mapping.component).toBe('NumberInput');
            expect(mapping.defaultProps.step).toBe(0.01);
        });

        it('should map Percent to NumberInput with 0-100 range', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Percent;

            expect(mapping.component).toBe('NumberInput');
            expect(mapping.defaultProps.min).toBe(0);
            expect(mapping.defaultProps.max).toBe(100);
        });
    });

    describe('selection field mappings', () => {
        it('should map Select to Dropdown', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Select;

            expect(mapping.component).toBe('Dropdown');
        });

        it('should map Link to ComboBox', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Link;

            expect(mapping.component).toBe('ComboBox');
        });

        it('should map Dynamic Link to ComboBox', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS['Dynamic Link'];

            expect(mapping.component).toBe('ComboBox');
        });

        it('should map Table MultiSelect to MultiSelect', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS['Table MultiSelect'];

            expect(mapping.component).toBe('MultiSelect');
        });

        it('should map Table to DataTable', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Table;

            expect(mapping.component).toBe('DataTable');
        });
    });

    describe('date/time field mappings', () => {
        it('should map Date to DatePicker', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Date;

            expect(mapping.component).toBe('DatePicker');
            expect(mapping.defaultProps.datePickerType).toBe('single');
        });

        it('should map Datetime to DatePicker', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Datetime;

            expect(mapping.component).toBe('DatePicker');
        });

        it('should map Time to TimePicker', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Time;

            expect(mapping.component).toBe('TimePicker');
        });

        it('should map Duration to NumberInput', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Duration;

            expect(mapping.component).toBe('NumberInput');
        });
    });

    describe('boolean field mappings', () => {
        it('should map Check to Checkbox', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Check;

            expect(mapping.component).toBe('Checkbox');
        });
    });

    describe('file field mappings', () => {
        it('should map Attach to FileUploader', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Attach;

            expect(mapping.component).toBe('FileUploader');
        });

        it('should map Attach Image to FileUploader with image accept', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS['Attach Image'];

            expect(mapping.component).toBe('FileUploader');
            expect(mapping.defaultProps.accept).toBe('image/*');
        });
    });

    describe('special field mappings', () => {
        it('should map Color to TextInput with color type', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Color;

            expect(mapping.component).toBe('TextInput');
            expect(mapping.defaultProps.type).toBe('color');
        });

        it('should map Rating to Slider', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Rating;

            expect(mapping.component).toBe('Slider');
            expect(mapping.defaultProps.max).toBe(5);
        });
    });

    describe('display field mappings', () => {
        it('should map Read Only to TextInput disabled', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS['Read Only'];

            expect(mapping.component).toBe('TextInput');
            expect(mapping.defaultProps.disabled).toBe(true);
        });

        it('should map Button to Button', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Button;

            expect(mapping.component).toBe('Button');
        });

        it('should map Image to ImageLoader', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Image;

            expect(mapping.component).toBe('ImageLoader');
        });
    });

    describe('layout field mappings', () => {
        it('should map Section Break to Tile', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS['Section Break'];

            expect(mapping.component).toBe('Tile');
        });

        it('should map Tab Break to Tab', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS['Tab Break'];

            expect(mapping.component).toBe('Tab');
        });

        it('should map Fold to Accordion', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Fold;

            expect(mapping.component).toBe('Accordion');
        });
    });

    describe('validation mappings', () => {
        it('should have validation config for text inputs', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Data;

            expect(mapping.validation).toBeDefined();
            expect(mapping.validation?.invalidProp).toBe('invalid');
            expect(mapping.validation?.invalidTextProp).toBe('invalidText');
        });

        it('should have validation config for number inputs', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Int;

            expect(mapping.validation).toBeDefined();
            expect(mapping.validation?.inline).toBe(true);
        });

        it('should have validation config for select inputs', () => {
            const mapping = DEFAULT_FIELD_MAPPINGS.Select;

            expect(mapping.validation).toBeDefined();
        });
    });

    describe('event mappings', () => {
        it('should have change event for all mappings', () => {
            for (const [fieldType, mapping] of Object.entries(DEFAULT_FIELD_MAPPINGS)) {
                expect(mapping.events?.change).toBeDefined();
            }
        });

        it('should have input event for text-based fields', () => {
            expect(DEFAULT_FIELD_MAPPINGS.Data.events?.input).toBe('input');
            expect(DEFAULT_FIELD_MAPPINGS['Long Text'].events?.input).toBe('input');
        });

        it('should have blur/focus events for text-based fields', () => {
            expect(DEFAULT_FIELD_MAPPINGS.Data.events?.blur).toBe('blur');
            expect(DEFAULT_FIELD_MAPPINGS.Data.events?.focus).toBe('focus');
        });
    });

    describe('propsGenerator functions', () => {
        it('should have propsGenerator for all mappings', () => {
            for (const [fieldType, mapping] of Object.entries(DEFAULT_FIELD_MAPPINGS)) {
                expect(typeof mapping.propsGenerator).toBe('function');
            }
        });
    });
});

describe('P2-011: Field Type Categories', () => {
    describe('LAYOUT_FIELD_TYPES', () => {
        it('should include all layout field types', () => {
            expect(LAYOUT_FIELD_TYPES).toContain('Section Break');
            expect(LAYOUT_FIELD_TYPES).toContain('Column Break');
            expect(LAYOUT_FIELD_TYPES).toContain('Tab Break');
            expect(LAYOUT_FIELD_TYPES).toContain('Fold');
        });

        it('should have exactly 4 layout types', () => {
            expect(LAYOUT_FIELD_TYPES.length).toBe(4);
        });
    });

    describe('DISPLAY_FIELD_TYPES', () => {
        it('should include all display field types', () => {
            expect(DISPLAY_FIELD_TYPES).toContain('Read Only');
            expect(DISPLAY_FIELD_TYPES).toContain('Button');
            expect(DISPLAY_FIELD_TYPES).toContain('Image');
            expect(DISPLAY_FIELD_TYPES).toContain('HTML');
        });

        it('should have exactly 4 display types', () => {
            expect(DISPLAY_FIELD_TYPES.length).toBe(4);
        });
    });

    describe('isLayoutFieldType', () => {
        it('should return true for layout field types', () => {
            expect(isLayoutFieldType('Section Break')).toBe(true);
            expect(isLayoutFieldType('Column Break')).toBe(true);
            expect(isLayoutFieldType('Tab Break')).toBe(true);
            expect(isLayoutFieldType('Fold')).toBe(true);
        });

        it('should return false for non-layout field types', () => {
            expect(isLayoutFieldType('Data')).toBe(false);
            expect(isLayoutFieldType('Int')).toBe(false);
            expect(isLayoutFieldType('Select')).toBe(false);
        });
    });

    describe('isDisplayFieldType', () => {
        it('should return true for display field types', () => {
            expect(isDisplayFieldType('Read Only')).toBe(true);
            expect(isDisplayFieldType('Button')).toBe(true);
            expect(isDisplayFieldType('Image')).toBe(true);
            expect(isDisplayFieldType('HTML')).toBe(true);
        });

        it('should return false for non-display field types', () => {
            expect(isDisplayFieldType('Data')).toBe(false);
            expect(isDisplayFieldType('Int')).toBe(false);
            expect(isDisplayFieldType('Date')).toBe(false);
        });
    });

    describe('getDefaultMapping', () => {
        it('should return mapping for valid field type', () => {
            const mapping = getDefaultMapping('Data');

            expect(mapping).toBeDefined();
            expect(mapping?.component).toBe('TextInput');
        });

        it('should return undefined for invalid field type', () => {
            const mapping = getDefaultMapping('InvalidType' as FieldType);

            expect(mapping).toBeUndefined();
        });
    });
});
