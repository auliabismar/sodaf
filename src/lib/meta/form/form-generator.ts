/**
 * Form Generator - P2-010
 * 
 * Creates FormSchemas from DocType definitions with support for:
 * - Section/Column/Tab layouts
 * - Validation rule generation
 * - Condition evaluation
 * - Default values extraction
 */

import type {
    FormSchema,
    FormSection,
    FormColumn,
    FormField,
    FormTab,
    FormLayout,
    ValidationRule,
    ValidationType
} from './types';
import type { DocType, DocField, FieldType } from '../doctype/types';
import { docFieldToFormField } from './utils';
import { ERROR_MESSAGES } from './constants';

/**
 * Options for form generation
 */
export interface FormGeneratorOptions {
    /** Whether to include hidden fields (default: false) */
    includeHidden?: boolean;

    /** Whether to generate validation rules (default: true) */
    generateValidation?: boolean;

    /** Whether to evaluate conditions (default: false, needs doc context) */
    evaluateConditions?: boolean;

    /** Document data for condition evaluation */
    documentData?: Record<string, any>;

    /** Custom section for fields before first Section Break */
    defaultSectionLabel?: string;
}

/**
 * Result of form generation with metadata
 */
export interface FormGenerationResult {
    /** The generated FormSchema */
    schema: FormSchema;

    /** Default values extracted from fields */
    defaults: Record<string, any>;

    /** List of hidden field names (if any were encountered) */
    hiddenFields: string[];

    /** List of read-only field names */
    readOnlyFields: string[];

    /** Total field count (excluding layout fields) */
    fieldCount: number;
}

/**
 * Field types that require numeric validation
 */
const NUMERIC_FIELD_TYPES: FieldType[] = ['Int', 'Float', 'Currency', 'Percent'];

/**
 * Field types that require date/time validation
 */
const DATETIME_FIELD_TYPES: FieldType[] = ['Date', 'Datetime', 'Time'];

/**
 * Layout field types that don't store data
 */
const LAYOUT_FIELD_TYPES: FieldType[] = ['Section Break', 'Column Break', 'Tab Break', 'Fold'];

/**
 * FormGenerator - Creates FormSchemas from DocType definitions
 * 
 * Main responsibilities:
 * - Generate complete FormSchema with sections/columns/tabs
 * - Generate validation rules from DocField properties
 * - Evaluate visibility conditions
 * - Extract default values
 * - Filter hidden fields
 * - Preserve field order
 */
export class FormGenerator {
    private options: FormGeneratorOptions;

    constructor(options: FormGeneratorOptions = {}) {
        this.options = {
            includeHidden: false,
            generateValidation: true,
            evaluateConditions: false,
            defaultSectionLabel: 'Details',
            ...options
        };
    }

    /**
     * Generate a FormSchema from a DocType definition
     * @param doctype - The DocType to convert
     * @returns FormSchema with sections, validation, and layout
     */
    generateFormSchema(doctype: DocType): FormSchema {
        const result = this.generateFormSchemaWithResult(doctype);
        return result.schema;
    }

    /**
     * Generate a FormSchema with additional metadata
     * @param doctype - The DocType to convert
     * @returns FormGenerationResult with schema and metadata
     */
    generateFormSchemaWithResult(doctype: DocType): FormGenerationResult {
        const hiddenFields: string[] = [];
        const readOnlyFields: string[] = [];
        let fieldCount = 0;

        // Determine if we have tabs
        const hasTabs = doctype.fields.some(f => f.fieldtype === 'Tab Break');

        // Initialize form schema
        const schema: FormSchema = {
            doctype: doctype.name,
            layout: this.createFormLayout(doctype)
        };

        if (hasTabs) {
            schema.tabs = this.processFieldsWithTabs(
                doctype.fields,
                hiddenFields,
                readOnlyFields,
                () => fieldCount++
            );
        } else {
            schema.sections = this.processFieldsWithSections(
                doctype.fields,
                hiddenFields,
                readOnlyFields,
                () => fieldCount++
            );
        }

        // Extract default values
        const defaults = this.generateDefaultValues(doctype);

        return {
            schema,
            defaults,
            hiddenFields,
            readOnlyFields,
            fieldCount
        };
    }

    /**
     * Process fields and create tabs structure
     */
    private processFieldsWithTabs(
        fields: DocField[],
        hiddenFields: string[],
        readOnlyFields: string[],
        incrementFieldCount: () => void
    ): FormTab[] {
        const tabs: FormTab[] = [];
        let currentTab: FormTab | null = null;
        let currentSection: FormSection | null = null;
        let currentColumn: FormColumn | null = null;
        let tabOrder = 0;

        for (const field of fields) {
            if (field.fieldtype === 'Tab Break') {
                // Create new tab
                currentTab = {
                    fieldname: field.fieldname,
                    label: field.label || field.fieldname,
                    sections: [],
                    order: tabOrder++,
                    hidden: field.hidden,
                    depends_on: field.depends_on
                };
                tabs.push(currentTab);
                currentSection = null;
                currentColumn = null;
                continue;
            }

            // Ensure we have a tab (create default if needed)
            if (!currentTab) {
                currentTab = {
                    fieldname: '__default_tab',
                    label: this.options.defaultSectionLabel || 'Details',
                    sections: [],
                    order: tabOrder++
                };
                tabs.push(currentTab);
            }

            if (field.fieldtype === 'Section Break') {
                // Create new section within current tab
                currentSection = this.createSection(field);
                currentTab.sections.push(currentSection);
                currentColumn = null;
                continue;
            }

            if (field.fieldtype === 'Column Break') {
                // Create new column within current section
                if (!currentSection) {
                    currentSection = this.createDefaultSection();
                    currentTab.sections.push(currentSection);
                }
                currentColumn = { fields: [] };
                if (!currentSection.columns) {
                    currentSection.columns = [];
                }
                currentSection.columns.push(currentColumn);
                continue;
            }

            // Skip layout fields
            if (LAYOUT_FIELD_TYPES.includes(field.fieldtype)) {
                continue;
            }

            // Handle hidden/read-only tracking
            if (field.hidden) {
                hiddenFields.push(field.fieldname);
                if (!this.options.includeHidden) {
                    continue;
                }
            }

            if (field.read_only) {
                readOnlyFields.push(field.fieldname);
            }

            // Ensure we have a section
            if (!currentSection) {
                currentSection = this.createDefaultSection();
                currentTab.sections.push(currentSection);
            }

            // Convert to FormField
            const formField = this.convertToFormField(field);
            incrementFieldCount();

            // Add to current column or section
            if (currentColumn) {
                currentColumn.fields.push(formField);
            } else if (currentSection.columns && currentSection.columns.length > 0) {
                currentSection.columns[currentSection.columns.length - 1].fields.push(formField);
            } else {
                if (!currentSection.fields) {
                    currentSection.fields = [];
                }
                currentSection.fields.push(formField);
            }
        }

        return tabs;
    }

    /**
     * Process fields and create sections structure (no tabs)
     */
    private processFieldsWithSections(
        fields: DocField[],
        hiddenFields: string[],
        readOnlyFields: string[],
        incrementFieldCount: () => void
    ): FormSection[] {
        const sections: FormSection[] = [];
        let currentSection: FormSection | null = null;
        let currentColumn: FormColumn | null = null;
        let sectionOrder = 0;

        for (const field of fields) {
            if (field.fieldtype === 'Section Break') {
                // Create new section
                currentSection = this.createSection(field, sectionOrder++);
                sections.push(currentSection);
                currentColumn = null;
                continue;
            }

            if (field.fieldtype === 'Column Break') {
                // Create new column within current section
                if (!currentSection) {
                    currentSection = this.createDefaultSection(sectionOrder++);
                    sections.push(currentSection);
                }
                currentColumn = { fields: [] };
                if (!currentSection.columns) {
                    currentSection.columns = [];
                }
                currentSection.columns.push(currentColumn);
                continue;
            }

            // Skip other layout fields
            if (LAYOUT_FIELD_TYPES.includes(field.fieldtype)) {
                continue;
            }

            // Handle hidden/read-only tracking
            if (field.hidden) {
                hiddenFields.push(field.fieldname);
                if (!this.options.includeHidden) {
                    continue;
                }
            }

            if (field.read_only) {
                readOnlyFields.push(field.fieldname);
            }

            // Ensure we have a section (default section for fields before first Section Break)
            if (!currentSection) {
                currentSection = this.createDefaultSection(sectionOrder++);
                sections.push(currentSection);
            }

            // Convert to FormField
            const formField = this.convertToFormField(field);
            incrementFieldCount();

            // Add to current column or section
            if (currentColumn) {
                currentColumn.fields.push(formField);
            } else if (currentSection.columns && currentSection.columns.length > 0) {
                currentSection.columns[currentSection.columns.length - 1].fields.push(formField);
            } else {
                if (!currentSection.fields) {
                    currentSection.fields = [];
                }
                currentSection.fields.push(formField);
            }
        }

        return sections;
    }

    /**
     * Create a section from a Section Break field
     */
    private createSection(field: DocField, order?: number): FormSection {
        return {
            fieldname: field.fieldname,
            label: field.label || '',
            collapsible: field.collapsible,
            collapsed: field.collapsible ? true : undefined,
            depends_on: field.depends_on,
            description: field.description,
            hidden: field.hidden,
            order
        };
    }

    /**
     * Create a default section for fields before first Section Break
     */
    private createDefaultSection(order?: number): FormSection {
        return {
            fieldname: '__default_section',
            label: this.options.defaultSectionLabel || 'Details',
            order
        };
    }

    /**
     * Create form layout configuration
     */
    private createFormLayout(doctype: DocType): FormLayout {
        const hasTabs = doctype.fields.some(f => f.fieldtype === 'Tab Break');

        return {
            has_tabs: hasTabs,
            quick_entry_fields: doctype.quick_entry_fields?.split(',').map(s => s.trim()).filter(Boolean)
        };
    }

    /**
     * Convert DocField to FormField with validation rules
     */
    private convertToFormField(field: DocField): FormField {
        const formField = docFieldToFormField(field);

        // Add validation rules if enabled
        if (this.options.generateValidation) {
            const validationRules = this.generateValidationRules(field);
            if (validationRules.length > 0) {
                formField.validation = validationRules;
            }
        }

        // Preserve condition for runtime evaluation
        if (field.depends_on) {
            formField.condition = field.depends_on;
            formField.depends_on = field.depends_on;
        }

        return formField;
    }

    /**
     * Generate validation rules for a field based on its properties
     * @param field - The DocField to generate rules for
     * @returns Array of ValidationRule objects
     */
    generateValidationRules(field: DocField): ValidationRule[] {
        const rules: ValidationRule[] = [];

        // Required validation
        if (field.required) {
            rules.push({
                type: 'required',
                message: `${field.label || field.fieldname}: ${ERROR_MESSAGES.REQUIRED_FIELD}`,
                validator: 'required'
            });
        }

        // Type-based validation
        switch (field.fieldtype) {
            case 'Int':
                rules.push({
                    type: 'integer',
                    message: `${field.label || field.fieldname}: ${ERROR_MESSAGES.INVALID_INTEGER}`,
                    validator: 'integer'
                });
                break;

            case 'Float':
            case 'Percent':
                rules.push({
                    type: 'float',
                    message: `${field.label || field.fieldname}: ${ERROR_MESSAGES.INVALID_FLOAT}`,
                    validator: 'float'
                });
                break;

            case 'Currency':
                rules.push({
                    type: 'currency',
                    message: `${field.label || field.fieldname}: ${ERROR_MESSAGES.INVALID_CURRENCY}`,
                    validator: 'currency'
                });
                break;

            case 'Date':
                rules.push({
                    type: 'date',
                    message: `${field.label || field.fieldname}: ${ERROR_MESSAGES.INVALID_DATE}`,
                    validator: 'date'
                });
                break;

            case 'Time':
                rules.push({
                    type: 'time',
                    message: `${field.label || field.fieldname}: ${ERROR_MESSAGES.INVALID_TIME}`,
                    validator: 'time'
                });
                break;

            case 'Datetime':
                rules.push({
                    type: 'datetime',
                    message: `${field.label || field.fieldname}: ${ERROR_MESSAGES.INVALID_DATETIME}`,
                    validator: 'datetime'
                });
                break;
        }

        // Length validation
        if (field.length && field.length > 0) {
            rules.push({
                type: 'maxlength',
                message: `${field.label || field.fieldname}: ${ERROR_MESSAGES.MAX_LENGTH.replace('{0}', String(field.length))}`,
                validator: 'maxlength',
                params: { maxLength: field.length }
            });
        }

        // Pattern validation based on field options
        if (field.fieldtype === 'Data' && field.options) {
            const options = field.options.toLowerCase();

            if (options.includes('email')) {
                rules.push({
                    type: 'email',
                    message: `${field.label || field.fieldname}: ${ERROR_MESSAGES.INVALID_EMAIL}`,
                    validator: 'email'
                });
            } else if (options.includes('phone')) {
                rules.push({
                    type: 'phone',
                    message: `${field.label || field.fieldname}: ${ERROR_MESSAGES.INVALID_PHONE}`,
                    validator: 'phone'
                });
            } else if (options.includes('url')) {
                rules.push({
                    type: 'url',
                    message: `${field.label || field.fieldname}: ${ERROR_MESSAGES.INVALID_URL}`,
                    validator: 'url'
                });
            }
        }

        return rules;
    }

    /**
     * Generate default values object from DocType fields
     * @param doctype - The DocType to extract defaults from
     * @returns Object mapping fieldnames to their default values
     */
    generateDefaultValues(doctype: DocType): Record<string, any> {
        const defaults: Record<string, any> = {};

        for (const field of doctype.fields) {
            // Skip layout fields
            if (LAYOUT_FIELD_TYPES.includes(field.fieldtype)) {
                continue;
            }

            // Only include fields with default values
            if (field.default !== undefined && field.default !== null) {
                defaults[field.fieldname] = this.parseDefaultValue(field.default, field.fieldtype);
            }
        }

        return defaults;
    }

    /**
     * Parse a default value based on field type
     */
    private parseDefaultValue(value: any, fieldtype: FieldType): any {
        if (value === undefined || value === null) {
            return value;
        }

        // Handle special default values
        if (typeof value === 'string') {
            // Today's date
            if (value === 'Today' && (fieldtype === 'Date' || fieldtype === 'Datetime')) {
                return new Date().toISOString().split('T')[0];
            }

            // Now
            if (value === 'Now' && fieldtype === 'Datetime') {
                return new Date().toISOString();
            }

            // Current time
            if (value === 'Now' && fieldtype === 'Time') {
                return new Date().toTimeString().split(' ')[0];
            }
        }

        // Type conversion
        switch (fieldtype) {
            case 'Int':
                return parseInt(String(value), 10) || 0;
            case 'Float':
            case 'Currency':
            case 'Percent':
                return parseFloat(String(value)) || 0;
            case 'Check':
                return value === true || value === 1 || value === '1' || value === 'true';
            default:
                return value;
        }
    }

    /**
     * Evaluate a condition expression against document data
     * @param condition - The condition string (e.g., "doc.status == 'Active'" or "eval: doc.amount > 1000")
     * @param doc - The document data to evaluate against
     * @returns Boolean indicating if condition is met
     */
    evaluateCondition(condition: string, doc: Record<string, any>): boolean {
        if (!condition || typeof condition !== 'string') {
            return true;
        }

        // Trim the condition
        let expression = condition.trim();

        // Handle eval: prefix
        if (expression.startsWith('eval:')) {
            expression = expression.substring(5).trim();
        }

        try {
            // Create a safe evaluation context
            // Using Function constructor to evaluate the expression with doc context
            const evalFunction = new Function('doc', `
				try {
					return !!(${expression});
				} catch (e) {
					return false;
				}
			`);

            return evalFunction(doc);
        } catch (error) {
            console.warn(`Failed to evaluate condition: ${condition}`, error);
            return false;
        }
    }

    /**
     * Check if a field should be visible based on its depends_on condition
     * @param field - The field to check
     * @param doc - The document data
     * @returns Boolean indicating if field should be visible
     */
    isFieldVisible(field: DocField | FormField, doc: Record<string, any>): boolean {
        // Hidden fields are never visible (unless includeHidden is true)
        if ('hidden' in field && field.hidden && !this.options.includeHidden) {
            return false;
        }

        // Check depends_on condition
        const dependsOn = field.depends_on;
        if (!dependsOn) {
            return true;
        }

        return this.evaluateCondition(dependsOn, doc);
    }

    /**
     * Apply condition evaluation to a FormSchema
     * Filters out fields/sections/tabs that don't meet their conditions
     * @param schema - The FormSchema to process
     * @param doc - The document data
     * @returns New FormSchema with conditions applied
     */
    applyConditions(schema: FormSchema, doc: Record<string, any>): FormSchema {
        const result: FormSchema = {
            ...schema,
            layout: { ...schema.layout }
        };

        if (schema.tabs) {
            result.tabs = schema.tabs
                .filter(tab => !tab.condition || this.evaluateCondition(tab.condition, doc))
                .map(tab => ({
                    ...tab,
                    sections: this.filterSections(tab.sections, doc)
                }));
        }

        if (schema.sections) {
            result.sections = this.filterSections(schema.sections, doc);
        }

        return result;
    }

    /**
     * Filter sections based on conditions
     */
    private filterSections(sections: FormSection[], doc: Record<string, any>): FormSection[] {
        return sections
            .filter(section => !section.condition || this.evaluateCondition(section.condition, doc))
            .map(section => {
                const filteredSection: FormSection = { ...section };

                if (section.fields) {
                    filteredSection.fields = section.fields.filter(
                        field => !field.condition || this.evaluateCondition(field.condition, doc)
                    );
                }

                if (section.columns) {
                    filteredSection.columns = section.columns.map(column => ({
                        ...column,
                        fields: column.fields.filter(
                            field => !field.condition || this.evaluateCondition(field.condition, doc)
                        )
                    }));
                }

                return filteredSection;
            });
    }
}

/**
 * Create a FormGenerator instance with default options
 */
export function createFormGenerator(options?: FormGeneratorOptions): FormGenerator {
    return new FormGenerator(options);
}

/**
 * Convenience function to generate FormSchema from DocType
 */
export function generateFormSchema(doctype: DocType, options?: FormGeneratorOptions): FormSchema {
    const generator = new FormGenerator(options);
    return generator.generateFormSchema(doctype);
}

/**
 * Convenience function to generate FormSchema with full result
 */
export function generateFormSchemaWithResult(
    doctype: DocType,
    options?: FormGeneratorOptions
): FormGenerationResult {
    const generator = new FormGenerator(options);
    return generator.generateFormSchemaWithResult(doctype);
}
