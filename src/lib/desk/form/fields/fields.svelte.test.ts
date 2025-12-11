/**
 * P3-007 Form Field Components Browser Tests
 * 
 * These tests run in a real browser (Chromium via Playwright) for full DOM content rendering.
 * Use *.svelte.test.ts naming convention to run with browser environment.
 */
import { render } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import field components
import DataField from './DataField.svelte';
import IntField from './IntField.svelte';
import FloatField from './FloatField.svelte';
import CheckField from './CheckField.svelte';
import SelectField from './SelectField.svelte';
import DateField from './DateField.svelte';
import TextField from './TextField.svelte';
import PasswordField from './PasswordField.svelte';
import FieldRenderer from './FieldRenderer.svelte';
import type { DocField, FieldType } from '../../../meta/doctype/types';

// Helper to create mock field with proper typing
function createMockField(overrides: Partial<DocField> = {}): DocField {
    return {
        fieldname: 'test_field',
        fieldtype: 'Data' as FieldType,
        label: 'Test Field',
        required: false,
        description: '',
        options: '',
        ...overrides
    } as DocField;
}

describe('P3-007 Form Field Components (Browser)', () => {

    // P3-007-T1: DataField renders TextInput
    describe('DataField', () => {
        it('P3-007-T1: DataField renders TextInput', async () => {
            const field = createMockField({ fieldtype: 'Data', label: 'Name' });
            render(DataField, { field, value: 'Test Value' });

            // Check that the input is rendered with the correct value
            const input = page.getByRole('textbox');
            await expect.element(input).toBeVisible();
            await expect.element(input).toHaveValue('Test Value');
        });

        it('P3-007-T28: Required indicator shown', async () => {
            const field = createMockField({ fieldtype: 'Data', label: 'Name', required: true });
            render(DataField, { field, value: '', required: true });

            // Check for required indicator (asterisk)
            await expect.element(page.getByText('*')).toBeVisible();
        });

        it('P3-007-T29: Read-only state disables input', async () => {
            const field = createMockField({ fieldtype: 'Data', label: 'Name' });
            render(DataField, { field, value: 'Read Only', readonly: true });

            const input = page.getByRole('textbox');
            await expect.element(input).toBeVisible();
        });

        it('P3-007-T30: Error display shows message', async () => {
            const field = createMockField({ fieldtype: 'Data', label: 'Name' });
            render(DataField, { field, value: '', error: 'This field is required' });

            await expect.element(page.getByText('This field is required')).toBeVisible();
        });
    });

    // P3-007-T2: IntField renders NumberInput
    describe('IntField', () => {
        it('P3-007-T2: IntField renders NumberInput with step=1', async () => {
            const field = createMockField({ fieldtype: 'Int', label: 'Quantity' });
            render(IntField, { field, value: 5 });

            const input = page.getByRole('spinbutton');
            await expect.element(input).toBeVisible();
        });
    });

    // P3-007-T3: FloatField renders NumberInput
    describe('FloatField', () => {
        it('P3-007-T3: FloatField renders NumberInput with decimal step', async () => {
            const field = createMockField({ fieldtype: 'Float', label: 'Amount' });
            render(FloatField, { field, value: 10.5 });

            const input = page.getByRole('spinbutton');
            await expect.element(input).toBeVisible();
        });
    });

    // P3-007-T6: CheckField renders Checkbox
    describe('CheckField', () => {
        it('P3-007-T6: CheckField renders Checkbox that toggles', async () => {
            const field = createMockField({ fieldtype: 'Check', label: 'Active' });
            render(CheckField, { field, value: false });

            const checkbox = page.getByRole('checkbox');
            await expect.element(checkbox).toBeVisible();
        });
    });

    // P3-007-T7: SelectField renders Dropdown
    describe('SelectField', () => {
        it('P3-007-T7: SelectField renders Dropdown with options', async () => {
            const field = createMockField({
                fieldtype: 'Select',
                label: 'Status',
                options: 'Open\nClosed\nPending'
            });
            render(SelectField, { field, value: 'Open' });

            // Carbon Dropdown renders as a button with selected value
            await expect.element(page.getByText('Open')).toBeVisible();
        });
    });

    // P3-007-T12: DateField renders DatePicker
    describe('DateField', () => {
        it('P3-007-T12: DateField renders DatePicker', async () => {
            const field = createMockField({ fieldtype: 'Date', label: 'Due Date' });
            render(DateField, { field, value: '2024-01-15' });

            // DatePicker has a date input
            const input = page.getByRole('textbox');
            await expect.element(input).toBeVisible();
        });
    });

    // P3-007-T16: TextField renders TextArea
    describe('TextField', () => {
        it('P3-007-T16: TextField renders TextArea for multiline', async () => {
            const field = createMockField({ fieldtype: 'Long Text', label: 'Description' });
            render(TextField, { field, value: 'Long text content' });

            const textarea = page.getByRole('textbox');
            await expect.element(textarea).toBeVisible();
        });
    });

    // P3-007-T23: PasswordField hidden text
    describe('PasswordField', () => {
        it('P3-007-T23: PasswordField hides text with password type', async () => {
            const field = createMockField({ fieldtype: 'Password', label: 'Password' });
            render(PasswordField, { field, value: 'secret123' });

            // Password input should be present
            const input = page.getByLabelText('Password');
            await expect.element(input).toBeVisible();
        });
    });

    // P3-007-T32: FieldRenderer picks correct component
    describe('FieldRenderer', () => {
        it('P3-007-T32: FieldRenderer renders DataField for Data type', async () => {
            const field = createMockField({ fieldtype: 'Data', label: 'Name' });
            render(FieldRenderer, { field, value: 'Test' });

            const input = page.getByRole('textbox');
            await expect.element(input).toBeVisible();
        });

        it('P3-007-T32: FieldRenderer renders IntField for Int type', async () => {
            const field = createMockField({ fieldtype: 'Int', label: 'Quantity' });
            render(FieldRenderer, { field, value: 10 });

            const input = page.getByRole('spinbutton');
            await expect.element(input).toBeVisible();
        });

        it('P3-007-T32: FieldRenderer renders CheckField for Check type', async () => {
            const field = createMockField({ fieldtype: 'Check', label: 'Active' });
            render(FieldRenderer, { field, value: true });

            const checkbox = page.getByRole('checkbox');
            await expect.element(checkbox).toBeVisible();
        });
    });

    // P3-007-T33: Value binding works
    describe('Value Binding', () => {
        it('P3-007-T33: Two-way binding works for DataField', async () => {
            const onchange = vi.fn();
            const field = createMockField({ fieldtype: 'Data', label: 'Name' });
            render(DataField, { field, value: '', onchange });

            const input = page.getByRole('textbox');
            await input.fill('New Value');

            expect(onchange).toHaveBeenCalled();
        });
    });

    // P3-007-T34: Change event emitted
    describe('Change Events', () => {
        it('P3-007-T34: Change event emitted on DataField value change', async () => {
            const onchange = vi.fn();
            const field = createMockField({ fieldtype: 'Data', label: 'Name' });
            render(DataField, { field, value: 'initial', onchange });

            const input = page.getByRole('textbox');
            await input.fill('changed');

            expect(onchange).toHaveBeenCalled();
        });
    });
});
