/**
 * Field Mapping Module Exports - P2-011
 *
 * This file exports all field mapping types, utilities, and classes.
 */

// Export types
export type {
    ComponentMapping,
    PropsGeneratorFn,
    PropsGeneratorOptions,
    ValidationMapping,
    EventMapping,
    FieldMappingEntry,
    FieldMappingConfig,
    FieldMappingResult,
    FieldTypeCategory,
    FieldTypeCategoryMapping
} from './types';

// Export registry
export {
    FieldMappingRegistry,
    getDefaultRegistry,
    defaultRegistry,
    createFieldMappingRegistry,
    resetDefaultRegistry
} from './registry';

// Export default mappings
export {
    DEFAULT_FIELD_MAPPINGS,
    LAYOUT_FIELD_TYPES,
    DISPLAY_FIELD_TYPES,
    isLayoutFieldType,
    isDisplayFieldType,
    getDefaultMapping
} from './default-mappings';

// Export prop generators
export {
    basePropsGenerator,
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
    codeSnippetPropsGenerator,
    parseSelectOptions,
    parseDateValue,
    parseDateTimeValue,
    formatDisplayValue,
    formatCurrencyValue
} from './prop-generators';

// Export utility functions
export {
    getComponentForField,
    generatePropsForField,
    mapFieldToCarbon,
    mapFieldsToCarbon,
    getRequiredComponents,
    hasFieldMapping,
    getFieldCategory,
    formatFieldValue,
    validateFieldValue
} from './utils';
