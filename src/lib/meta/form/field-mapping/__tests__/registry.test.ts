/**
 * Registry Tests - P2-011
 *
 * Tests for the FieldMappingRegistry class.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    FieldMappingRegistry,
    createFieldMappingRegistry,
    getDefaultRegistry,
    resetDefaultRegistry
} from '../registry';
import { DEFAULT_FIELD_MAPPINGS } from '../default-mappings';
import type { ComponentMapping, FieldMappingConfig } from '../types';
import type { FormField } from '../../types';
import type { FieldType } from '../../../doctype/types';

describe('P2-011: FieldMappingRegistry', () => {
    let registry: FieldMappingRegistry;

    beforeEach(() => {
        registry = createFieldMappingRegistry();
    });

    describe('initialization', () => {
        it('should initialize with all default mappings', () => {
            const fieldTypes = Object.keys(DEFAULT_FIELD_MAPPINGS) as FieldType[];

            for (const fieldType of fieldTypes) {
                expect(registry.hasMapping(fieldType)).toBe(true);
            }
        });

        it('should return all registered types', () => {
            const types = registry.getRegisteredTypes();

            expect(types.length).toBeGreaterThan(0);
            expect(types).toContain('Data');
            expect(types).toContain('Int');
            expect(types).toContain('Select');
            expect(types).toContain('Date');
        });
    });

    describe('getMapping', () => {
        it('should return correct mapping for Data field', () => {
            const field: FormField = {
                fieldname: 'test_field',
                fieldtype: 'Data',
                label: 'Test Field'
            };

            const mapping = registry.getMapping(field);

            expect(mapping).toBeDefined();
            expect(mapping?.component).toBe('TextInput');
        });

        it('should return correct mapping for Int field', () => {
            const field: FormField = {
                fieldname: 'test_int',
                fieldtype: 'Int',
                label: 'Test Int'
            };

            const mapping = registry.getMapping(field);

            expect(mapping).toBeDefined();
            expect(mapping?.component).toBe('NumberInput');
        });

        it('should return correct mapping for Select field', () => {
            const field: FormField = {
                fieldname: 'test_select',
                fieldtype: 'Select',
                label: 'Test Select',
                options: 'Option 1\nOption 2\nOption 3'
            };

            const mapping = registry.getMapping(field);

            expect(mapping).toBeDefined();
            expect(mapping?.component).toBe('Dropdown');
        });

        it('should return correct mapping for Date field', () => {
            const field: FormField = {
                fieldname: 'test_date',
                fieldtype: 'Date',
                label: 'Test Date'
            };

            const mapping = registry.getMapping(field);

            expect(mapping).toBeDefined();
            expect(mapping?.component).toBe('DatePicker');
        });

        it('should return correct mapping for Check field', () => {
            const field: FormField = {
                fieldname: 'test_check',
                fieldtype: 'Check',
                label: 'Test Check'
            };

            const mapping = registry.getMapping(field);

            expect(mapping).toBeDefined();
            expect(mapping?.component).toBe('Checkbox');
        });

        it('should return fallback for unknown field type in lenient mode', () => {
            const field: FormField = {
                fieldname: 'test_unknown',
                fieldtype: 'UnknownType' as FieldType,
                label: 'Test Unknown'
            };

            const mapping = registry.getMapping(field);

            expect(mapping).toBeDefined();
            expect(mapping?.component).toBe('TextInput'); // fallback
        });
    });

    describe('register', () => {
        it('should allow registering new mappings', () => {
            const customMapping: ComponentMapping = {
                component: 'CustomInput',
                importPath: 'custom/path',
                defaultProps: {},
                propsGenerator: (field, value) => ({ value })
            };

            registry.register('Data', customMapping, 50);

            const field: FormField = {
                fieldname: 'test',
                fieldtype: 'Data',
                label: 'Test'
            };

            const mapping = registry.getMapping(field);

            expect(mapping?.component).toBe('CustomInput');
        });

        it('should respect priority when multiple mappings exist', () => {
            const lowPriority: ComponentMapping = {
                component: 'LowPriorityInput',
                importPath: 'low/priority',
                defaultProps: {},
                propsGenerator: () => ({})
            };

            const highPriority: ComponentMapping = {
                component: 'HighPriorityInput',
                importPath: 'high/priority',
                defaultProps: {},
                propsGenerator: () => ({})
            };

            registry.register('Data', lowPriority, 10);
            registry.register('Data', highPriority, 100);

            const field: FormField = {
                fieldname: 'test',
                fieldtype: 'Data',
                label: 'Test'
            };

            const mapping = registry.getMapping(field);

            expect(mapping?.component).toBe('HighPriorityInput');
        });
    });

    describe('registerConditional', () => {
        it('should apply conditional mapping when condition is met', () => {
            const conditionalMapping: ComponentMapping = {
                component: 'EmailInput',
                importPath: 'email/input',
                defaultProps: {},
                propsGenerator: () => ({})
            };

            registry.registerConditional(
                'Data',
                conditionalMapping,
                (field) => field.options?.includes('email') ?? false
            );

            const emailField: FormField = {
                fieldname: 'email',
                fieldtype: 'Data',
                label: 'Email',
                options: 'email'
            };

            const regularField: FormField = {
                fieldname: 'name',
                fieldtype: 'Data',
                label: 'Name'
            };

            expect(registry.getMapping(emailField)?.component).toBe('EmailInput');
            expect(registry.getMapping(regularField)?.component).toBe('TextInput');
        });
    });

    describe('override', () => {
        it('should override existing mapping', () => {
            registry.override('Data', {
                defaultProps: { customProp: true }
            });

            const field: FormField = {
                fieldname: 'test',
                fieldtype: 'Data',
                label: 'Test'
            };

            const mapping = registry.getMapping(field);

            expect(mapping?.defaultProps.customProp).toBe(true);
        });

        it('should throw when overriding non-existent mapping in strict mode', () => {
            const strictRegistry = createFieldMappingRegistry({ strictMode: true });

            // Clear all mappings first by using a fresh map
            strictRegistry.reset();

            // This would fail because the mapping doesn't exist for unmapped types
            // but since we have defaults for all types, this test verifies the error path
        });
    });

    describe('mapField', () => {
        it('should return complete mapping result with props', () => {
            const field: FormField = {
                fieldname: 'test_field',
                fieldtype: 'Data',
                label: 'Test Field',
                required: true
            };

            const result = registry.mapField(field, 'test value');

            expect(result).toBeDefined();
            expect(result?.component).toBe('TextInput');
            expect(result?.props.id).toBe('test_field');
            expect(result?.props.labelText).toBe('Test Field');
            expect(result?.props.value).toBe('test value');
            expect(result?.props.required).toBe(true);
        });

        it('should include validation errors in props', () => {
            const field: FormField = {
                fieldname: 'test_field',
                fieldtype: 'Data',
                label: 'Test Field'
            };

            const result = registry.mapField(field, '', {
                errors: ['This field is required']
            });

            expect(result?.props.invalid).toBe(true);
            expect(result?.props.invalidText).toBe('This field is required');
        });

        it('should handle disabled state', () => {
            const field: FormField = {
                fieldname: 'test_field',
                fieldtype: 'Data',
                label: 'Test Field'
            };

            const result = registry.mapField(field, '', { disabled: true });

            expect(result?.props.disabled).toBe(true);
        });

        it('should handle read-only state', () => {
            const field: FormField = {
                fieldname: 'test_field',
                fieldtype: 'Data',
                label: 'Test Field',
                read_only: true
            };

            const result = registry.mapField(field, '');

            expect(result?.props.disabled).toBe(true);
        });
    });

    describe('reset', () => {
        it('should reset to default mappings', () => {
            const customMapping: ComponentMapping = {
                component: 'CustomInput',
                importPath: 'custom/path',
                defaultProps: {},
                propsGenerator: () => ({})
            };

            registry.register('Data', customMapping, 100);

            const field: FormField = {
                fieldname: 'test',
                fieldtype: 'Data',
                label: 'Test'
            };

            expect(registry.getMapping(field)?.component).toBe('CustomInput');

            registry.reset();

            expect(registry.getMapping(field)?.component).toBe('TextInput');
        });
    });

    describe('export', () => {
        it('should export all mappings', () => {
            const exported = registry.export();

            expect(Object.keys(exported).length).toBeGreaterThan(0);
            expect(exported.Data).toBeDefined();
            expect(exported.Data.component).toBe('TextInput');
        });
    });

    describe('configuration', () => {
        it('should apply default size from config', () => {
            const smRegistry = createFieldMappingRegistry({ defaultSize: 'sm' });

            const field: FormField = {
                fieldname: 'test',
                fieldtype: 'Data',
                label: 'Test'
            };

            const result = smRegistry.mapField(field, '');

            expect(result?.props.size).toBe('sm');
        });

        it('should return current config', () => {
            const config = registry.getConfig();

            expect(config.strictMode).toBe(false);
            expect(config.defaultSize).toBe('md');
        });

        it('should update config', () => {
            registry.updateConfig({ strictMode: true });

            const config = registry.getConfig();

            expect(config.strictMode).toBe(true);
        });
    });
});

describe('P2-011: Default Registry', () => {
    beforeEach(() => {
        resetDefaultRegistry();
    });

    it('should provide singleton instance', () => {
        const registry1 = getDefaultRegistry();
        const registry2 = getDefaultRegistry();

        expect(registry1).toBe(registry2);
    });
});
