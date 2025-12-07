/**
 * Form Generator Unit Tests - P2-010
 * 
 * Comprehensive tests for the FormGenerator class covering:
 * - Form schema generation
 * - Section/Column/Tab handling
 * - Validation rule generation
 * - Default values extraction
 * - Condition evaluation
 * - Hidden field filtering
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    FormGenerator,
    createFormGenerator,
    generateFormSchema,
    generateFormSchemaWithResult
} from '../form-generator';
import type { FormGeneratorOptions, FormGenerationResult } from '../form-generator';
import type { DocType, DocField } from '../../doctype/types';

/**
 * Create a minimal DocType for testing
 */
function createTestDocType(fields: DocField[], options: Partial<DocType> = {}): DocType {
    return {
        name: 'Test DocType',
        module: 'Core',
        fields,
        permissions: [{ role: 'System Manager', read: true, write: true }],
        ...options
    };
}

/**
 * Create a minimal DocField for testing
 */
function createTestField(fieldname: string, fieldtype: DocField['fieldtype'], options: Partial<DocField> = {}): DocField {
    return {
        fieldname,
        fieldtype,
        label: options.label || fieldname.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        ...options
    };
}

describe('P2-010: Form Generator', () => {
    let generator: FormGenerator;

    beforeEach(() => {
        generator = new FormGenerator();
    });

    describe('P2-010-T1: generateFormSchema(doctype)', () => {
        it('should return a FormSchema with sections', () => {
            const doctype = createTestDocType([
                createTestField('name', 'Data'),
                createTestField('description', 'Long Text')
            ]);

            const schema = generator.generateFormSchema(doctype);

            expect(schema).toBeDefined();
            expect(schema.doctype).toBe('Test DocType');
            expect(schema.sections).toBeDefined();
            expect(schema.sections!.length).toBeGreaterThan(0);
        });

        it('should set layout properties correctly', () => {
            const doctype = createTestDocType([
                createTestField('name', 'Data')
            ]);

            const schema = generator.generateFormSchema(doctype);

            expect(schema.layout).toBeDefined();
            expect(schema.layout.has_tabs).toBe(false);
        });
    });

    describe('P2-010-T2: Section Break creates section', () => {
        it('should group fields by Section Break', () => {
            const doctype = createTestDocType([
                createTestField('name', 'Data'),
                createTestField('section1', 'Section Break', { label: 'First Section' }),
                createTestField('email', 'Data', { options: 'Email' }),
                createTestField('section2', 'Section Break', { label: 'Second Section' }),
                createTestField('phone', 'Data', { options: 'Phone' })
            ]);

            const schema = generator.generateFormSchema(doctype);

            // Should have 3 sections: default (for name), section1, section2
            expect(schema.sections).toBeDefined();
            expect(schema.sections!.length).toBe(3);
            expect(schema.sections![1].label).toBe('First Section');
            expect(schema.sections![2].label).toBe('Second Section');
        });
    });

    describe('P2-010-T3: Column Break creates columns', () => {
        it('should create columns within section', () => {
            const doctype = createTestDocType([
                createTestField('section1', 'Section Break', { label: 'Main Section' }),
                createTestField('left_field', 'Data'),
                createTestField('col1', 'Column Break'),
                createTestField('right_field', 'Data')
            ]);

            const schema = generator.generateFormSchema(doctype);

            expect(schema.sections).toBeDefined();
            expect(schema.sections!.length).toBe(1);

            const mainSection = schema.sections![0];
            expect(mainSection.columns).toBeDefined();
            expect(mainSection.columns!.length).toBe(1);

            // First field goes to section.fields, Column Break creates a column
            expect(mainSection.fields).toBeDefined();
            expect(mainSection.fields![0].fieldname).toBe('left_field');
            expect(mainSection.columns![0].fields[0].fieldname).toBe('right_field');
        });
    });

    describe('P2-010-T4: Tab Break creates tabs', () => {
        it('should create tabs with sections', () => {
            const doctype = createTestDocType([
                createTestField('tab1', 'Tab Break', { label: 'General' }),
                createTestField('name', 'Data'),
                createTestField('tab2', 'Tab Break', { label: 'Settings' }),
                createTestField('setting1', 'Check')
            ]);

            const schema = generator.generateFormSchema(doctype);

            expect(schema.tabs).toBeDefined();
            expect(schema.tabs!.length).toBe(2);
            expect(schema.tabs![0].label).toBe('General');
            expect(schema.tabs![1].label).toBe('Settings');
            expect(schema.layout.has_tabs).toBe(true);
        });
    });

    describe('P2-010-T5: Collapsible section', () => {
        it('should respect collapsible and collapsible_depends_on', () => {
            const doctype = createTestDocType([
                createTestField('section1', 'Section Break', {
                    label: 'Collapsible Section',
                    collapsible: true,
                    collapsible_depends_on: 'doc.show_details'
                }),
                createTestField('details', 'Long Text')
            ]);

            const schema = generator.generateFormSchema(doctype);

            expect(schema.sections).toBeDefined();
            expect(schema.sections![0].collapsible).toBe(true);
            expect(schema.sections![0].collapsed).toBe(true);
        });
    });

    describe('P2-010-T6: Required validation', () => {
        it('should generate required validation rule', () => {
            const doctype = createTestDocType([
                createTestField('name', 'Data', { required: true })
            ]);

            const schema = generator.generateFormSchema(doctype);

            const field = schema.sections![0].fields![0];
            expect(field.validation).toBeDefined();
            expect(field.validation!.find(r => r.type === 'required')).toBeDefined();
        });
    });

    describe('P2-010-T7: Int validation', () => {
        it('should generate integer validation rule', () => {
            const doctype = createTestDocType([
                createTestField('quantity', 'Int')
            ]);

            const schema = generator.generateFormSchema(doctype);

            const field = schema.sections![0].fields![0];
            expect(field.validation).toBeDefined();
            expect(field.validation!.find(r => r.type === 'integer')).toBeDefined();
        });
    });

    describe('P2-010-T8: Float validation', () => {
        it('should generate float validation rule', () => {
            const doctype = createTestDocType([
                createTestField('price', 'Float')
            ]);

            const schema = generator.generateFormSchema(doctype);

            const field = schema.sections![0].fields![0];
            expect(field.validation).toBeDefined();
            expect(field.validation!.find(r => r.type === 'float')).toBeDefined();
        });

        it('should generate float validation for Percent', () => {
            const doctype = createTestDocType([
                createTestField('discount', 'Percent')
            ]);

            const schema = generator.generateFormSchema(doctype);

            const field = schema.sections![0].fields![0];
            expect(field.validation!.find(r => r.type === 'float')).toBeDefined();
        });
    });

    describe('P2-010-T9: Date validation', () => {
        it('should generate date validation rule', () => {
            const doctype = createTestDocType([
                createTestField('birth_date', 'Date')
            ]);

            const schema = generator.generateFormSchema(doctype);

            const field = schema.sections![0].fields![0];
            expect(field.validation).toBeDefined();
            expect(field.validation!.find(r => r.type === 'date')).toBeDefined();
        });

        it('should generate datetime validation rule', () => {
            const doctype = createTestDocType([
                createTestField('created_at', 'Datetime')
            ]);

            const schema = generator.generateFormSchema(doctype);

            const field = schema.sections![0].fields![0];
            expect(field.validation!.find(r => r.type === 'datetime')).toBeDefined();
        });

        it('should generate time validation rule', () => {
            const doctype = createTestDocType([
                createTestField('start_time', 'Time')
            ]);

            const schema = generator.generateFormSchema(doctype);

            const field = schema.sections![0].fields![0];
            expect(field.validation!.find(r => r.type === 'time')).toBeDefined();
        });
    });

    describe('P2-010-T10: Length validation', () => {
        it('should generate maxlength rule from length property', () => {
            const doctype = createTestDocType([
                createTestField('title', 'Data', { length: 140 })
            ]);

            const schema = generator.generateFormSchema(doctype);

            const field = schema.sections![0].fields![0];
            expect(field.validation).toBeDefined();

            const maxLengthRule = field.validation!.find(r => r.type === 'maxlength');
            expect(maxLengthRule).toBeDefined();
            expect(maxLengthRule!.params?.maxLength).toBe(140);
        });
    });

    describe('P2-010-T11: Pattern validation (Email, Phone)', () => {
        it('should generate email validation for Email option', () => {
            const doctype = createTestDocType([
                createTestField('user_email', 'Data', { options: 'Email' })
            ]);

            const schema = generator.generateFormSchema(doctype);

            const field = schema.sections![0].fields![0];
            expect(field.validation).toBeDefined();
            expect(field.validation!.find(r => r.type === 'email')).toBeDefined();
        });

        it('should generate phone validation for Phone option', () => {
            const doctype = createTestDocType([
                createTestField('user_phone', 'Data', { options: 'Phone' })
            ]);

            const schema = generator.generateFormSchema(doctype);

            const field = schema.sections![0].fields![0];
            expect(field.validation!.find(r => r.type === 'phone')).toBeDefined();
        });

        it('should generate url validation for URL option', () => {
            const doctype = createTestDocType([
                createTestField('website', 'Data', { options: 'URL' })
            ]);

            const schema = generator.generateFormSchema(doctype);

            const field = schema.sections![0].fields![0];
            expect(field.validation!.find(r => r.type === 'url')).toBeDefined();
        });
    });

    describe('P2-010-T12: generateDefaultValues(doctype)', () => {
        it('should return object with field defaults', () => {
            const doctype = createTestDocType([
                createTestField('status', 'Select', { default: 'Draft', options: 'Draft\nActive\nClosed' }),
                createTestField('is_active', 'Check', { default: 1 }),
                createTestField('count', 'Int', { default: 0 }),
                createTestField('name', 'Data') // No default
            ]);

            const defaults = generator.generateDefaultValues(doctype);

            expect(defaults).toBeDefined();
            expect(defaults.status).toBe('Draft');
            expect(defaults.is_active).toBe(true);
            expect(defaults.count).toBe(0);
            expect(defaults.name).toBeUndefined();
        });

        it('should parse special date defaults', () => {
            const doctype = createTestDocType([
                createTestField('created_date', 'Date', { default: 'Today' }),
                createTestField('created_time', 'Datetime', { default: 'Now' })
            ]);

            const defaults = generator.generateDefaultValues(doctype);

            // Should be today's date in ISO format (YYYY-MM-DD)
            expect(defaults.created_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            // Should be current datetime in ISO format
            expect(defaults.created_time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });
    });

    describe('P2-010-T13: evaluateCondition(depends_on, doc)', () => {
        it('should return boolean for visibility condition', () => {
            const doc = { status: 'Active', amount: 1000 };

            expect(generator.evaluateCondition("doc.status == 'Active'", doc)).toBe(true);
            expect(generator.evaluateCondition("doc.status == 'Draft'", doc)).toBe(false);
            expect(generator.evaluateCondition("doc.amount > 500", doc)).toBe(true);
            expect(generator.evaluateCondition("doc.amount < 500", doc)).toBe(false);
        });

        it('should return true for empty condition', () => {
            expect(generator.evaluateCondition('', {})).toBe(true);
            expect(generator.evaluateCondition(null as any, {})).toBe(true);
        });
    });

    describe('P2-010-T14: evaluateCondition with eval: prefix', () => {
        it('should evaluate JavaScript expression', () => {
            const doc = { amount: 1500, discount: 10 };

            expect(generator.evaluateCondition('eval: doc.amount > 1000', doc)).toBe(true);
            expect(generator.evaluateCondition('eval: doc.amount * (100 - doc.discount) / 100 > 1000', doc)).toBe(true);
        });
    });

    describe('P2-010-T15: Hidden fields excluded', () => {
        it('should exclude hidden=true fields from form', () => {
            const doctype = createTestDocType([
                createTestField('visible_field', 'Data'),
                createTestField('hidden_field', 'Data', { hidden: true }),
                createTestField('another_visible', 'Data')
            ]);

            const result = generator.generateFormSchemaWithResult(doctype);

            expect(result.hiddenFields).toContain('hidden_field');
            expect(result.schema.sections![0].fields!.map(f => f.fieldname))
                .not.toContain('hidden_field');
            expect(result.fieldCount).toBe(2);
        });

        it('should include hidden fields when includeHidden is true', () => {
            const generatorWithHidden = new FormGenerator({ includeHidden: true });
            const doctype = createTestDocType([
                createTestField('visible_field', 'Data'),
                createTestField('hidden_field', 'Data', { hidden: true })
            ]);

            const result = generatorWithHidden.generateFormSchemaWithResult(doctype);

            expect(result.schema.sections![0].fields!.map(f => f.fieldname))
                .toContain('hidden_field');
        });
    });

    describe('P2-010-T16: Read-only fields marked', () => {
        it('should preserve read_only=true in FormField', () => {
            const doctype = createTestDocType([
                createTestField('editable_field', 'Data'),
                createTestField('readonly_field', 'Data', { read_only: true })
            ]);

            const result = generator.generateFormSchemaWithResult(doctype);

            expect(result.readOnlyFields).toContain('readonly_field');

            const readonlyField = result.schema.sections![0].fields!.find(f => f.fieldname === 'readonly_field');
            expect(readonlyField?.read_only).toBe(true);
        });
    });

    describe('P2-010-T17: Field order preserved', () => {
        it('should maintain original field order', () => {
            const doctype = createTestDocType([
                createTestField('first', 'Data'),
                createTestField('second', 'Data'),
                createTestField('third', 'Data'),
                createTestField('fourth', 'Data')
            ]);

            const schema = generator.generateFormSchema(doctype);

            const fieldNames = schema.sections![0].fields!.map(f => f.fieldname);
            expect(fieldNames).toEqual(['first', 'second', 'third', 'fourth']);
        });
    });

    describe('P2-010-T18: Default section created', () => {
        it('should create default section for fields before first Section Break', () => {
            const doctype = createTestDocType([
                createTestField('leading_field', 'Data'),
                createTestField('section1', 'Section Break', { label: 'Details' }),
                createTestField('details_field', 'Data')
            ]);

            const schema = generator.generateFormSchema(doctype);

            expect(schema.sections).toBeDefined();
            expect(schema.sections!.length).toBe(2);

            // First section should be the default section with leading_field
            expect(schema.sections![0].fieldname).toBe('__default_section');
            expect(schema.sections![0].fields![0].fieldname).toBe('leading_field');

            // Second section should be the explicit Section Break
            expect(schema.sections![1].fieldname).toBe('section1');
        });

        it('should use custom default section label', () => {
            const customGenerator = new FormGenerator({ defaultSectionLabel: 'Basic Info' });
            const doctype = createTestDocType([
                createTestField('name', 'Data')
            ]);

            const schema = customGenerator.generateFormSchema(doctype);

            expect(schema.sections![0].label).toBe('Basic Info');
        });
    });

    describe('Factory functions', () => {
        it('createFormGenerator should create instance with options', () => {
            const gen = createFormGenerator({ includeHidden: true });
            expect(gen).toBeInstanceOf(FormGenerator);
        });

        it('generateFormSchema should be a convenience function', () => {
            const doctype = createTestDocType([
                createTestField('name', 'Data')
            ]);

            const schema = generateFormSchema(doctype);
            expect(schema.doctype).toBe('Test DocType');
        });

        it('generateFormSchemaWithResult should return full result', () => {
            const doctype = createTestDocType([
                createTestField('name', 'Data', { default: 'Test' })
            ]);

            const result = generateFormSchemaWithResult(doctype);
            expect(result.schema).toBeDefined();
            expect(result.defaults).toBeDefined();
            expect(result.defaults.name).toBe('Test');
        });
    });

    describe('applyConditions', () => {
        it('should filter fields based on conditions', () => {
            const doctype = createTestDocType([
                createTestField('status', 'Select'),
                createTestField('active_only', 'Data', { depends_on: "doc.status == 'Active'" })
            ]);

            const schema = generator.generateFormSchema(doctype);

            // Apply conditions with doc.status = 'Active'
            const filtered = generator.applyConditions(schema, { status: 'Active' });
            expect(filtered.sections![0].fields!.length).toBe(2);

            // Apply conditions with doc.status = 'Draft'
            const filteredDraft = generator.applyConditions(schema, { status: 'Draft' });
            expect(filteredDraft.sections![0].fields!.length).toBe(1);
        });
    });

    describe('isFieldVisible', () => {
        it('should check field visibility based on depends_on', () => {
            const field = createTestField('conditional', 'Data', { depends_on: "doc.show == true" });

            expect(generator.isFieldVisible(field, { show: true })).toBe(true);
            expect(generator.isFieldVisible(field, { show: false })).toBe(false);
        });

        it('should return false for hidden fields', () => {
            const field = createTestField('hidden', 'Data', { hidden: true });

            expect(generator.isFieldVisible(field, {})).toBe(false);
        });
    });

    describe('Currency validation', () => {
        it('should generate currency validation rule', () => {
            const doctype = createTestDocType([
                createTestField('total_amount', 'Currency')
            ]);

            const schema = generator.generateFormSchema(doctype);

            const field = schema.sections![0].fields![0];
            expect(field.validation).toBeDefined();
            expect(field.validation!.find(r => r.type === 'currency')).toBeDefined();
        });
    });

    describe('Complex layout scenarios', () => {
        it('should handle mixed tabs and sections', () => {
            const doctype = createTestDocType([
                createTestField('tab1', 'Tab Break', { label: 'General' }),
                createTestField('section1', 'Section Break', { label: 'Info' }),
                createTestField('name', 'Data'),
                createTestField('col1', 'Column Break'),
                createTestField('email', 'Data'),
                createTestField('tab2', 'Tab Break', { label: 'Details' }),
                createTestField('description', 'Long Text')
            ]);

            const schema = generator.generateFormSchema(doctype);

            expect(schema.tabs).toBeDefined();
            expect(schema.tabs!.length).toBe(2);
            expect(schema.tabs![0].sections.length).toBeGreaterThan(0);
            expect(schema.tabs![1].sections.length).toBeGreaterThan(0);
        });

        it('should handle fields before first Tab Break', () => {
            const doctype = createTestDocType([
                createTestField('orphan_field', 'Data'),
                createTestField('tab1', 'Tab Break', { label: 'Main' }),
                createTestField('main_field', 'Data')
            ]);

            const schema = generator.generateFormSchema(doctype);

            expect(schema.tabs).toBeDefined();
            // Should create default tab for orphan_field
            expect(schema.tabs!.length).toBe(2);
        });
    });
});
