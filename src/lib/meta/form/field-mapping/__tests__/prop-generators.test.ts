/**
 * Prop Generators Tests - P2-011
 *
 * Tests for prop generation functions.
 */

import { describe, it, expect } from 'vitest';
import {
    basePropsGenerator,
    textInputPropsGenerator,
    textAreaPropsGenerator,
    passwordInputPropsGenerator,
    numberInputPropsGenerator,
    dropdownPropsGenerator,
    comboBoxPropsGenerator,
    multiSelectPropsGenerator,
    datePickerPropsGenerator,
    timePickerPropsGenerator,
    checkboxPropsGenerator,
    togglePropsGenerator,
    fileUploaderPropsGenerator,
    buttonPropsGenerator,
    readOnlyPropsGenerator,
    parseSelectOptions,
    parseDateValue,
    parseDateTimeValue,
    formatDisplayValue,
    formatCurrencyValue
} from '../prop-generators';
import type { FormField } from '../../types';
import type { PropsGeneratorOptions } from '../types';

describe('P2-011: Prop Generators', () => {
    const defaultOptions: PropsGeneratorOptions = {};

    describe('basePropsGenerator', () => {
        it('should generate base props for any field', () => {
            const field: FormField = {
                fieldname: 'test_field',
                fieldtype: 'Data',
                label: 'Test Field',
                description: 'A test field',
                placeholder: 'Enter value'
            };

            const props = basePropsGenerator(field, 'value', defaultOptions);

            expect(props.id).toBe('test_field');
            expect(props.name).toBe('test_field');
            expect(props.labelText).toBe('Test Field');
            expect(props.helperText).toBe('A test field');
            expect(props.placeholder).toBe('Enter value');
        });

        it('should include size when specified', () => {
            const field: FormField = {
                fieldname: 'test',
                fieldtype: 'Data',
                label: 'Test'
            };

            const props = basePropsGenerator(field, '', { size: 'lg' });

            expect(props.size).toBe('lg');
        });

        it('should include validation errors', () => {
            const field: FormField = {
                fieldname: 'test',
                fieldtype: 'Data',
                label: 'Test'
            };

            const props = basePropsGenerator(field, '', {
                errors: ['Field is required']
            });

            expect(props.invalid).toBe(true);
            expect(props.invalidText).toBe('Field is required');
        });

        it('should handle disabled state', () => {
            const field: FormField = {
                fieldname: 'test',
                fieldtype: 'Data',
                label: 'Test'
            };

            const props = basePropsGenerator(field, '', { disabled: true });

            expect(props.disabled).toBe(true);
        });

        it('should handle read-only from field property', () => {
            const field: FormField = {
                fieldname: 'test',
                fieldtype: 'Data',
                label: 'Test',
                read_only: true
            };

            const props = basePropsGenerator(field, '', {});

            expect(props.disabled).toBe(true);
        });
    });

    describe('textInputPropsGenerator', () => {
        it('should generate text input props', () => {
            const field: FormField = {
                fieldname: 'name',
                fieldtype: 'Data',
                label: 'Name',
                length: 100
            };

            const props = textInputPropsGenerator(field, 'John Doe', defaultOptions);

            expect(props.value).toBe('John Doe');
            expect(props.maxlength).toBe(100);
            expect(props.autocomplete).toBe('off');
        });

        it('should use default value when value is null', () => {
            const field: FormField = {
                fieldname: 'name',
                fieldtype: 'Data',
                label: 'Name',
                default: 'Default Name'
            };

            const props = textInputPropsGenerator(field, null, defaultOptions);

            expect(props.value).toBe('Default Name');
        });

        it('should use empty string when no value or default', () => {
            const field: FormField = {
                fieldname: 'name',
                fieldtype: 'Data',
                label: 'Name'
            };

            const props = textInputPropsGenerator(field, null, defaultOptions);

            expect(props.value).toBe('');
        });
    });

    describe('textAreaPropsGenerator', () => {
        it('should generate textarea props with rows for Small Text', () => {
            const field: FormField = {
                fieldname: 'description',
                fieldtype: 'Small Text',
                label: 'Description'
            };

            const props = textAreaPropsGenerator(field, 'Some text', defaultOptions);

            expect(props.value).toBe('Some text');
            expect(props.rows).toBe(3);
        });

        it('should generate textarea props with more rows for Long Text', () => {
            const field: FormField = {
                fieldname: 'content',
                fieldtype: 'Long Text',
                label: 'Content'
            };

            const props = textAreaPropsGenerator(field, '', defaultOptions);

            expect(props.rows).toBe(6);
        });

        it('should enable counter when length is specified', () => {
            const field: FormField = {
                fieldname: 'notes',
                fieldtype: 'Long Text',
                label: 'Notes',
                length: 500
            };

            const props = textAreaPropsGenerator(field, '', defaultOptions);

            expect(props.enableCounter).toBe(true);
            expect(props.maxCount).toBe(500);
        });
    });

    describe('numberInputPropsGenerator', () => {
        it('should generate integer props for Int field', () => {
            const field: FormField = {
                fieldname: 'count',
                fieldtype: 'Int',
                label: 'Count'
            };

            const props = numberInputPropsGenerator(field, 10, defaultOptions);

            expect(props.value).toBe(10);
            expect(props.step).toBe(1);
        });

        it('should generate float props for Float field', () => {
            const field: FormField = {
                fieldname: 'amount',
                fieldtype: 'Float',
                label: 'Amount'
            };

            const props = numberInputPropsGenerator(field, 10.5, defaultOptions);

            expect(props.value).toBe(10.5);
            expect(props.step).toBe('any');
        });

        it('should constrain Percent field to 0-100', () => {
            const field: FormField = {
                fieldname: 'percentage',
                fieldtype: 'Percent',
                label: 'Percentage'
            };

            const props = numberInputPropsGenerator(field, 50, defaultOptions);

            expect(props.min).toBe(0);
            expect(props.max).toBe(100);
        });

        it('should use custom min/max when specified', () => {
            const field: FormField = {
                fieldname: 'quantity',
                fieldtype: 'Int',
                label: 'Quantity',
                min: 1,
                max: 999
            };

            const props = numberInputPropsGenerator(field, 50, defaultOptions);

            expect(props.min).toBe(1);
            expect(props.max).toBe(999);
        });
    });

    describe('dropdownPropsGenerator', () => {
        it('should parse newline-separated options', () => {
            const field: FormField = {
                fieldname: 'status',
                fieldtype: 'Select',
                label: 'Status',
                options: 'Active\nInactive\nPending'
            };

            const props = dropdownPropsGenerator(field, 'Active', defaultOptions);

            expect(props.items).toEqual([
                { id: 'Active', text: 'Active' },
                { id: 'Inactive', text: 'Inactive' },
                { id: 'Pending', text: 'Pending' }
            ]);
            expect(props.selectedIndex).toBe(0);
        });

        it('should find selected index correctly', () => {
            const field: FormField = {
                fieldname: 'status',
                fieldtype: 'Select',
                label: 'Status',
                options: 'Active\nInactive\nPending'
            };

            const props = dropdownPropsGenerator(field, 'Pending', defaultOptions);

            expect(props.selectedIndex).toBe(2);
        });

        it('should handle no selection', () => {
            const field: FormField = {
                fieldname: 'status',
                fieldtype: 'Select',
                label: 'Status',
                options: 'Active\nInactive'
            };

            const props = dropdownPropsGenerator(field, null, defaultOptions);

            expect(props.selectedIndex).toBeUndefined();
        });
    });

    describe('comboBoxPropsGenerator', () => {
        it('should generate combobox props for Link field', () => {
            const field: FormField = {
                fieldname: 'customer',
                fieldtype: 'Link',
                label: 'Customer',
                options: 'Customer'
            };

            const props = comboBoxPropsGenerator(field, 'CUST-001', defaultOptions);

            expect(props.selectedId).toBe('CUST-001');
            expect(props.placeholder).toContain('Customer');
            expect(props.items).toEqual([]);
        });
    });

    describe('datePickerPropsGenerator', () => {
        it('should generate date picker props', () => {
            const field: FormField = {
                fieldname: 'start_date',
                fieldtype: 'Date',
                label: 'Start Date'
            };

            const props = datePickerPropsGenerator(field, '2024-01-15', defaultOptions);

            expect(props.datePickerType).toBe('single');
            expect(props.value).toEqual(['2024-01-15']);
            expect(props.dateFormat).toBe('Y-m-d');
        });

        it('should handle empty date', () => {
            const field: FormField = {
                fieldname: 'start_date',
                fieldtype: 'Date',
                label: 'Start Date'
            };

            const props = datePickerPropsGenerator(field, null, defaultOptions);

            expect(props.value).toEqual([]);
        });
    });

    describe('checkboxPropsGenerator', () => {
        it('should generate checkbox props for checked state', () => {
            const field: FormField = {
                fieldname: 'is_active',
                fieldtype: 'Check',
                label: 'Active'
            };

            const props = checkboxPropsGenerator(field, true, defaultOptions);

            expect(props.checked).toBe(true);
            expect(props.labelText).toBe('Active');
        });

        it('should generate checkbox props for unchecked state', () => {
            const field: FormField = {
                fieldname: 'is_active',
                fieldtype: 'Check',
                label: 'Active'
            };

            const props = checkboxPropsGenerator(field, false, defaultOptions);

            expect(props.checked).toBe(false);
        });

        it('should handle truthy values', () => {
            const field: FormField = {
                fieldname: 'is_active',
                fieldtype: 'Check',
                label: 'Active'
            };

            const props = checkboxPropsGenerator(field, 1, defaultOptions);

            expect(props.checked).toBe(true);
        });
    });

    describe('togglePropsGenerator', () => {
        it('should generate toggle props', () => {
            const field: FormField = {
                fieldname: 'enabled',
                fieldtype: 'Check',
                label: 'Enabled'
            };

            const props = togglePropsGenerator(field, true, defaultOptions);

            expect(props.toggled).toBe(true);
            expect(props.labelA).toBe('Off');
            expect(props.labelB).toBe('On');
        });
    });

    describe('fileUploaderPropsGenerator', () => {
        it('should generate file uploader props', () => {
            const field: FormField = {
                fieldname: 'attachment',
                fieldtype: 'Attach',
                label: 'Attachment'
            };

            const props = fileUploaderPropsGenerator(field, null, defaultOptions);

            expect(props.labelTitle).toBe('Attachment');
            expect(props.buttonLabel).toBe('Add file');
        });

        it('should restrict to images for Attach Image', () => {
            const field: FormField = {
                fieldname: 'photo',
                fieldtype: 'Attach Image',
                label: 'Photo'
            };

            const props = fileUploaderPropsGenerator(field, null, defaultOptions);

            expect(props.accept).toBe('image/*');
        });
    });

    describe('buttonPropsGenerator', () => {
        it('should generate button props', () => {
            const field: FormField = {
                fieldname: 'submit_btn',
                fieldtype: 'Button',
                label: 'Submit'
            };

            const props = buttonPropsGenerator(field, null, defaultOptions);

            expect(props.id).toBe('submit_btn');
            expect(props.kind).toBe('primary');
        });
    });

    describe('readOnlyPropsGenerator', () => {
        it('should generate read-only props', () => {
            const field: FormField = {
                fieldname: 'created_by',
                fieldtype: 'Read Only',
                label: 'Created By'
            };

            const props = readOnlyPropsGenerator(field, 'Admin', defaultOptions);

            expect(props.value).toBe('Admin');
            expect(props.disabled).toBe(true);
            expect(props.readonly).toBe(true);
        });
    });
});

describe('P2-011: Helper Functions', () => {
    describe('parseSelectOptions', () => {
        it('should parse newline-separated options', () => {
            const result = parseSelectOptions('Option 1\nOption 2\nOption 3');

            expect(result).toEqual([
                { id: 'Option 1', text: 'Option 1' },
                { id: 'Option 2', text: 'Option 2' },
                { id: 'Option 3', text: 'Option 3' }
            ]);
        });

        it('should parse comma-separated options', () => {
            const result = parseSelectOptions('A, B, C');

            expect(result).toEqual([
                { id: 'A', text: 'A' },
                { id: 'B', text: 'B' },
                { id: 'C', text: 'C' }
            ]);
        });

        it('should parse value:label format', () => {
            const result = parseSelectOptions('active:Active\ninactive:Inactive');

            expect(result).toEqual([
                { id: 'active', text: 'Active' },
                { id: 'inactive', text: 'Inactive' }
            ]);
        });

        it('should handle empty options', () => {
            expect(parseSelectOptions('')).toEqual([]);
            expect(parseSelectOptions(undefined)).toEqual([]);
        });
    });

    describe('parseDateValue', () => {
        it('should parse ISO date string', () => {
            const result = parseDateValue('2024-01-15');

            expect(result).toEqual(['2024-01-15']);
        });

        it('should parse datetime string', () => {
            const result = parseDateValue('2024-01-15T10:30:00');

            expect(result).toEqual(['2024-01-15']);
        });

        it('should parse Date object', () => {
            const date = new Date('2024-01-15');
            const result = parseDateValue(date);

            expect(result[0]).toContain('2024-01-15');
        });

        it('should handle null/undefined', () => {
            expect(parseDateValue(null)).toEqual([]);
            expect(parseDateValue(undefined)).toEqual([]);
        });
    });

    describe('parseDateTimeValue', () => {
        it('should parse datetime string', () => {
            const result = parseDateTimeValue('2024-01-15T10:30:00');

            expect(result.date).toEqual(['2024-01-15']);
            expect(result.time).toBe('10:30');
        });

        it('should parse Date object', () => {
            const date = new Date('2024-01-15T10:30:00');
            const result = parseDateTimeValue(date);

            expect(result.date[0]).toContain('2024-01');
            expect(result.time).toMatch(/\d{2}:\d{2}/);
        });

        it('should handle null/undefined', () => {
            const result = parseDateTimeValue(null);

            expect(result.date).toEqual([]);
            expect(result.time).toBe('');
        });
    });

    describe('formatDisplayValue', () => {
        it('should format boolean as Yes/No', () => {
            const field: FormField = {
                fieldname: 'active',
                fieldtype: 'Check',
                label: 'Active'
            };

            expect(formatDisplayValue(true, field)).toBe('Yes');
            expect(formatDisplayValue(false, field)).toBe('No');
        });

        it('should format percent with % symbol', () => {
            const field: FormField = {
                fieldname: 'percentage',
                fieldtype: 'Percent',
                label: 'Percentage'
            };

            expect(formatDisplayValue(75, field)).toBe('75%');
        });

        it('should return empty string for null/undefined', () => {
            const field: FormField = {
                fieldname: 'test',
                fieldtype: 'Data',
                label: 'Test'
            };

            expect(formatDisplayValue(null, field)).toBe('');
            expect(formatDisplayValue(undefined, field)).toBe('');
        });
    });

    describe('formatCurrencyValue', () => {
        it('should format with default USD', () => {
            const result = formatCurrencyValue(1234.56);

            expect(result).toContain('1,234.56');
        });

        it('should format with specified currency', () => {
            const result = formatCurrencyValue(1234.56, 'EUR', 'de-DE');

            expect(result).toContain('1.234,56');
        });

        it('should fallback for invalid currency code', () => {
            const result = formatCurrencyValue(100, 'INVALID');

            expect(result).toContain('100');
        });
    });
});
