/**
 * Field Mapping Registry - P2-011
 *
 * Central registry for managing DocType field type to Carbon component mappings.
 * Supports both global defaults and per-form overrides.
 */

import type { FieldType } from '../../doctype/types';
import type { FormField } from '../types';
import type {
    ComponentMapping,
    FieldMappingEntry,
    FieldMappingConfig,
    FieldMappingResult,
    PropsGeneratorOptions
} from './types';
import { DEFAULT_FIELD_MAPPINGS, getDefaultMapping } from './default-mappings';
import { textInputPropsGenerator } from './prop-generators';

/**
 * Default configuration for the field mapping registry
 */
const DEFAULT_CONFIG: FieldMappingConfig = {
    strictMode: false,
    defaultSize: 'md',
    labelPlacement: 'top'
};

/**
 * Fallback component mapping for unregistered field types
 */
const FALLBACK_MAPPING: ComponentMapping = {
    component: 'TextInput',
    importPath: 'carbon-components-svelte/src/TextInput',
    defaultProps: {},
    propsGenerator: textInputPropsGenerator,
    validation: {
        inline: true,
        invalidProp: 'invalid',
        invalidTextProp: 'invalidText'
    },
    events: {
        change: 'change',
        input: 'input',
        blur: 'blur',
        focus: 'focus'
    }
};

/**
 * FieldMappingRegistry - Central registry for Carbon component mappings
 *
 * Features:
 * - Type-safe field type to component mapping
 * - Override mechanisms for custom components
 * - Conditional mappings based on field properties
 * - Validation and event mapping integration
 * - Global and per-form instance support
 */
export class FieldMappingRegistry {
    private mappings: Map<FieldType, FieldMappingEntry[]>;
    private config: FieldMappingConfig;

    constructor(config?: Partial<FieldMappingConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.mappings = new Map();
        this.initializeDefaultMappings();
    }

    /**
     * Initialize registry with default mappings
     */
    private initializeDefaultMappings(): void {
        const fieldTypes = Object.keys(DEFAULT_FIELD_MAPPINGS) as FieldType[];

        for (const fieldType of fieldTypes) {
            const mapping = DEFAULT_FIELD_MAPPINGS[fieldType];
            this.mappings.set(fieldType, [
                {
                    mapping,
                    priority: 0
                }
            ]);
        }
    }

    /**
     * Register a mapping for a field type
     * @param fieldType - The field type to register
     * @param mapping - The component mapping
     * @param priority - Priority for override resolution (higher wins)
     */
    register(fieldType: FieldType, mapping: ComponentMapping, priority: number = 10): void {
        const entries = this.mappings.get(fieldType) || [];
        entries.push({ mapping, priority });
        // Sort by priority descending
        entries.sort((a, b) => b.priority - a.priority);
        this.mappings.set(fieldType, entries);
    }

    /**
     * Register a conditional mapping that applies based on field properties
     * @param fieldType - The field type to register
     * @param mapping - The component mapping
     * @param condition - Function to determine if this mapping applies
     * @param priority - Priority for override resolution (higher wins)
     */
    registerConditional(
        fieldType: FieldType,
        mapping: ComponentMapping,
        condition: (field: FormField) => boolean,
        priority: number = 20
    ): void {
        const entries = this.mappings.get(fieldType) || [];
        entries.push({ mapping, priority, condition });
        // Sort by priority descending
        entries.sort((a, b) => b.priority - a.priority);
        this.mappings.set(fieldType, entries);
    }

    /**
     * Get the appropriate mapping for a field
     * @param field - The FormField to get mapping for
     * @returns The ComponentMapping or undefined
     */
    getMapping(field: FormField): ComponentMapping | undefined {
        const entries = this.mappings.get(field.fieldtype);

        if (!entries || entries.length === 0) {
            if (this.config.strictMode) {
                throw new Error(`No mapping found for field type: ${field.fieldtype}`);
            }
            return this.config.fallbackComponent || FALLBACK_MAPPING;
        }

        // Find first matching entry (highest priority that passes condition)
        for (const entry of entries) {
            if (!entry.condition || entry.condition(field)) {
                return entry.mapping;
            }
        }

        // Fallback to first entry without condition
        const defaultEntry = entries.find((e) => !e.condition);
        return defaultEntry?.mapping || (this.config.fallbackComponent || FALLBACK_MAPPING);
    }

    /**
     * Map a field to its Carbon component with generated props
     * @param field - The FormField to map
     * @param value - Current field value
     * @param options - Prop generation options
     * @returns Complete mapping result with component, props, and events
     */
    mapField(
        field: FormField,
        value: unknown,
        options: PropsGeneratorOptions = {}
    ): FieldMappingResult | undefined {
        const mapping = this.getMapping(field);

        if (!mapping) {
            return undefined;
        }

        // Merge default size from config
        const mergedOptions: PropsGeneratorOptions = {
            size: this.config.defaultSize,
            ...options
        };

        // Generate props using the mapping's generator
        const generatedProps = mapping.propsGenerator(field, value, mergedOptions);

        // Merge with default props
        const props = {
            ...mapping.defaultProps,
            ...generatedProps
        };

        return {
            component: mapping.component,
            importPath: mapping.importPath,
            props,
            events: mapping.events || { change: 'change' },
            validation: mapping.validation
        };
    }

    /**
     * Check if a field type is registered
     * @param fieldType - The field type to check
     */
    hasMapping(fieldType: FieldType): boolean {
        return this.mappings.has(fieldType);
    }

    /**
     * Get all registered field types
     */
    getRegisteredTypes(): FieldType[] {
        return Array.from(this.mappings.keys());
    }

    /**
     * Override a mapping for a specific field type
     * This creates a high-priority mapping that overrides existing ones
     * @param fieldType - The field type to override
     * @param mapping - Partial mapping with overrides
     */
    override(fieldType: FieldType, mapping: Partial<ComponentMapping>): void {
        const existingMapping = this.getMapping({ fieldtype: fieldType } as FormField);

        if (!existingMapping) {
            throw new Error(`Cannot override non-existent mapping for: ${fieldType}`);
        }

        const mergedMapping: ComponentMapping = {
            ...existingMapping,
            ...mapping,
            defaultProps: {
                ...existingMapping.defaultProps,
                ...mapping.defaultProps
            }
        };

        this.register(fieldType, mergedMapping, 100);
    }

    /**
     * Reset registry to default mappings
     */
    reset(): void {
        this.mappings.clear();
        this.initializeDefaultMappings();
    }

    /**
     * Export current registry configuration
     * @returns Record of field types to their mappings
     */
    export(): Record<FieldType, ComponentMapping> {
        const result: Partial<Record<FieldType, ComponentMapping>> = {};

        for (const [fieldType, entries] of this.mappings) {
            const entry = entries.find((e) => !e.condition);
            if (entry) {
                result[fieldType] = entry.mapping;
            }
        }

        return result as Record<FieldType, ComponentMapping>;
    }

    /**
     * Get the current configuration
     */
    getConfig(): FieldMappingConfig {
        return { ...this.config };
    }

    /**
     * Update configuration
     * @param config - Partial configuration to merge
     */
    updateConfig(config: Partial<FieldMappingConfig>): void {
        this.config = { ...this.config, ...config };
    }
}

/**
 * Singleton instance for global usage
 */
let _defaultRegistry: FieldMappingRegistry | null = null;

/**
 * Get the default global registry instance
 */
export function getDefaultRegistry(): FieldMappingRegistry {
    if (!_defaultRegistry) {
        _defaultRegistry = new FieldMappingRegistry();
    }
    return _defaultRegistry;
}

/**
 * Default registry singleton (lazy-initialized)
 */
export const defaultRegistry: FieldMappingRegistry = new Proxy({} as FieldMappingRegistry, {
    get(target, prop) {
        return Reflect.get(getDefaultRegistry(), prop);
    }
});

/**
 * Factory for creating per-form registries
 * @param config - Optional configuration for the registry
 * @returns A new FieldMappingRegistry instance
 */
export function createFieldMappingRegistry(
    config?: Partial<FieldMappingConfig>
): FieldMappingRegistry {
    return new FieldMappingRegistry(config);
}

/**
 * Reset the default registry to its initial state
 */
export function resetDefaultRegistry(): void {
    if (_defaultRegistry) {
        _defaultRegistry.reset();
    }
}
