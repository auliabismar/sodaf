/**
 * Field Mapping Integration Tests (P2-019)
 *
 * Tests for the Field Mapping module integration.
 */

import { describe, it, expect } from 'vitest';
import {
    mapFieldToCarbon,
    mapFieldsToCarbon,
    getComponentForField,
    generatePropsForField
} from '../index';
import type { FormField } from '../types';
import type { FieldType } from '../../../doctype/types';

describe('Field Mapping Integration', () => {
    const createField = (type: FieldType, name: string = 'test_field'): FormField => ({
        fieldname: name,
        fieldtype: type,
        label: 'Test Label',
        required: false
    });

    describe('mapFieldToCarbon', () => {
        it('should map Data field to TextInput', () => {
            const field = createField('Data');
            const result = mapFieldToCarbon(field, 'test value');

            expect(result).toBeDefined();
            expect(result?.component).toBe('TextInput');
            expect(result?.props.value).toBe('test value');
            expect(result?.props.labelText).toBe('Test Label');
        });

        it('should map Int field to NumberInput', () => {
            const field = createField('Int');
            const result = mapFieldToCarbon(field, 42);

            expect(result).toBeDefined();
            expect(result?.component).toBe('NumberInput');
            expect(result?.props.value).toBe(42);
        });

        it('should map Select field to Dropdown', () => {
            const field = createField('Select');
            field.options = 'Option 1\nOption 2';
            const result = mapFieldToCarbon(field, 'Option 1');

            expect(result).toBeDefined();
            expect(result?.component).toBe('Dropdown');
            expect(result?.props.titleText).toBe('Test Label');
            // Dropdown uses items array
            expect(result?.props.items).toHaveLength(2);
        });

        it('should map Date field to DatePicker', () => {
            const field = createField('Date');
            const result = mapFieldToCarbon(field, '2023-01-01');

            expect(result).toBeDefined();
            expect(result?.component).toBe('DatePicker');
            // DatePicker expects array of date strings
            expect(result?.props.value).toEqual(['2023-01-01']);
        });
    });

    describe('mapFieldsToCarbon', () => {
        it('should map multiple fields correctly', () => {
            const fields: FormField[] = [
                createField('Data', 'name'),
                createField('Int', 'age'),
                createField('Section Break', 'section') // Should be skipped
            ];

            const values = {
                name: 'John Doe',
                age: 30
            };

            const result = mapFieldsToCarbon(fields, values);

            expect(result.name).toBeDefined();
            expect(result.name.component).toBe('TextInput');
            expect(result.age).toBeDefined();
            expect(result.age.component).toBe('NumberInput');

            // Layout fields are skipped
            expect(result.section).toBeUndefined();
        });
    });

    describe('getComponentForField', () => {
        it('should return correct component name for known types', () => {
            expect(getComponentForField(createField('Check'))?.component).toBe('Checkbox');
            // Text Editor maps to TextArea
            expect(getComponentForField(createField('Text Editor'))?.component).toBe('TextArea');
            expect(getComponentForField(createField('Button'))?.component).toBe('Button');
        });

        it('should return default component (TextInput) for unknown types', () => {
            // Falls back to TextInput by default as per registry configuration
            const component = getComponentForField(createField('Unknown' as any));
            expect(component).toBeDefined();
            expect(component?.component).toBe('TextInput');
        });
    });

    describe('generatePropsForField', () => {
        it('should generate common props', () => {
            const field = createField('Data');
            // read_only maps to disabled in basePropsGenerator
            field.read_only = true;
            field.required = true;
            field.description = 'Help text';

            const props = generatePropsForField(field, 'val');

            expect(props.id).toBe(field.fieldname);
            expect(props.name).toBe(field.fieldname);
            expect(props.required).toBe(true);
            // Check disabled instead of readonly
            expect(props.disabled).toBe(true);
            expect(props.helperText).toBe('Help text');
        });
    });
});
