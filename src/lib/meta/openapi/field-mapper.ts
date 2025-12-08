/**
 * Field Mapper - DocFields to OpenAPI Schemas
 *
 * This module implements mapping of DocType fields to OpenAPI schema definitions,
 * handling all 30+ field types with proper validation and documentation.
 *
 * @module meta/openapi/field-mapper
 */

import type { DocField, FieldType } from '../doctype/types';
import type { OpenAPISchema, FieldOpenAPIConfig } from './types';

// =============================================================================
// Field Type to OpenAPI Schema Mapping
// =============================================================================

/**
 * Maps DocField types to OpenAPI schema properties
 */
const FIELD_TYPE_MAPPING: Partial<Record<FieldType, (field: DocField) => OpenAPISchema>> = {
	// Text-based fields
	'Data': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		minLength: field.required ? 1 : undefined,
		maxLength: field.length,
		default: field.default,
		example: field.default || ''
	}),

	'Long Text': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'textarea',
		minLength: field.required ? 1 : undefined,
		maxLength: field.length,
		default: field.default,
		example: field.default || ''
	}),

	'Small Text': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		minLength: field.required ? 1 : undefined,
		maxLength: field.length || 255,
		default: field.default,
		example: field.default || ''
	}),

	'Text Editor': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'html',
		minLength: field.required ? 1 : undefined,
		maxLength: field.length,
		default: field.default,
		example: field.default || '<p>Sample content</p>'
	}),

	'Code': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'code',
		minLength: field.required ? 1 : undefined,
		maxLength: field.length,
		default: field.default,
		example: field.default || 'function example() {}'
	}),

	'Markdown Editor': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'markdown',
		minLength: field.required ? 1 : undefined,
		maxLength: field.length,
		default: field.default,
		example: field.default || '# Sample Markdown'
	}),

	'HTML Editor': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'html',
		minLength: field.required ? 1 : undefined,
		maxLength: field.length,
		default: field.default,
		example: field.default || '<div>Sample HTML</div>'
	}),

	// Numeric fields
	'Int': (field: DocField): OpenAPISchema => ({
		type: 'integer',
		description: field.description || field.label,
		minimum: field.required ? 0 : undefined,
		default: field.default,
		example: field.default || 0
	}),

	'Float': (field: DocField): OpenAPISchema => ({
		type: 'number',
		description: field.description || field.label,
		minimum: field.required ? 0 : undefined,
		default: field.default,
		example: field.default || 0.0
	}),

	'Currency': (field: DocField): OpenAPISchema => ({
		type: 'number',
		description: field.description || field.label,
		format: 'currency',
		minimum: field.required ? 0 : undefined,
		default: field.default,
		example: field.default || 0.0
	}),

	'Percent': (field: DocField): OpenAPISchema => ({
		type: 'number',
		description: field.description || field.label,
		format: 'percent',
		minimum: 0,
		maximum: 100,
		default: field.default,
		example: field.default || 0
	}),

	// Boolean and selection fields
	'Check': (field: DocField): OpenAPISchema => ({
		type: 'boolean',
		description: field.description || field.label,
		default: field.default,
		example: field.default || false
	}),

	'Select': (field: DocField): OpenAPISchema => {
		const options = field.options
			? field.options.split('\n').map(opt => opt.trim()).filter(Boolean)
			: [];
		return {
			type: 'string',
			description: field.description || field.label,
			enum: options.length > 0 ? options : undefined,
			default: field.default,
			example: field.default || (options.length > 0 ? options[0] : '')
		};
	},

	// Reference fields
	'Link': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'reference',
		pattern: '^[a-zA-Z0-9_-]+$',
		default: field.default,
		example: field.default || 'reference-id'
	}),

	'Dynamic Link': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'reference',
		pattern: '^[a-zA-Z0-9_-]+$',
		default: field.default,
		example: field.default || 'dynamic-reference-id'
	}),

	// Table fields
	'Table': (field: DocField): OpenAPISchema => ({
		type: 'array',
		description: field.description || field.label,
		items: {
			type: 'object',
			properties: {
				name: { type: 'string', description: 'Document name' },
				docstatus: { type: 'integer', description: 'Document status' }
			}
		},
		default: field.default,
		example: field.default || []
	}),

	'Table MultiSelect': (field: DocField): OpenAPISchema => ({
		type: 'array',
		description: field.description || field.label,
		items: {
			type: 'string'
		},
		default: field.default,
		example: field.default || []
	}),

	// Date and time fields
	'Date': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'date',
		pattern: '^\\d{4}-\\d{2}-\\d{2}$',
		default: field.default,
		example: field.default || '2023-01-01'
	}),

	'Datetime': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'date-time',
		pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$',
		default: field.default,
		example: field.default || '2023-01-01T00:00:00Z'
	}),

	'Time': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'time',
		pattern: '^\\d{2}:\\d{2}:\\d{2}$',
		default: field.default,
		example: field.default || '00:00:00'
	}),

	'Duration': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'duration',
		pattern: '^\\d{2}:\\d{2}:\\d{2}$',
		default: field.default,
		example: field.default || '00:00:00'
	}),

	// Location and media fields
	'Geolocation': (field: DocField): OpenAPISchema => ({
		type: 'object',
		description: field.description || field.label,
		format: 'geolocation',
		properties: {
			latitude: { type: 'number', minimum: -90, maximum: 90 },
			longitude: { type: 'number', minimum: -180, maximum: 180 }
		},
		required: ['latitude', 'longitude'],
		default: field.default,
		example: field.default || { latitude: 0, longitude: 0 }
	}),

	'Attach': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'uri',
		pattern: '^/files/.*$',
		default: field.default,
		example: field.default || '/files/sample.txt'
	}),

	'Attach Image': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'uri',
		pattern: '^/files/.*\\.(jpg|jpeg|png|gif|webp)$',
		default: field.default,
		example: field.default || '/files/sample.jpg'
	}),

	'Signature': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'uri',
		pattern: '^/files/.*\\.(png|jpg)$',
		default: field.default,
		example: field.default || '/files/signature.png'
	}),

	// UI fields
	'Color': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'color',
		pattern: '^#[0-9A-Fa-f]{6}$',
		default: field.default,
		example: field.default || '#000000'
	}),

	'Rating': (field: DocField): OpenAPISchema => ({
		type: 'integer',
		description: field.description || field.label,
		format: 'rating',
		minimum: 1,
		maximum: 5,
		default: field.default,
		example: field.default || 1
	}),

	'Password': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'password',
		minLength: field.required ? 8 : undefined,
		maxLength: field.length,
		default: field.default,
		example: '********'
	}),

	// Display fields (read-only)
	'Read Only': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		readOnly: true,
		default: field.default,
		example: field.default || 'Read-only value'
	}),

	'Image': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'uri',
		readOnly: true,
		default: field.default,
		example: field.default || '/files/image.jpg'
	}),

	'HTML': (field: DocField): OpenAPISchema => ({
		type: 'string',
		description: field.description || field.label,
		format: 'html',
		readOnly: true,
		default: field.default,
		example: field.default || '<div>HTML content</div>'
	})
};

/**
 * Layout field types that should be excluded from OpenAPI schemas
 */
const LAYOUT_FIELD_TYPES: FieldType[] = [
	'Section Break',
	'Column Break',
	'Tab Break',
	'Fold',
	'Button'
];

// =============================================================================
// Field Mapper Class
// =============================================================================

/**
 * FieldMapper class for converting DocFields to OpenAPI schemas
 */
export class FieldMapper {
	/**
	 * Convert a DocField to OpenAPI schema
	 * @param field DocField definition
	 * @param config Optional field OpenAPI configuration
	 * @returns OpenAPI schema or null if field should be excluded
	 */
	mapField(field: DocField, config?: FieldOpenAPIConfig): OpenAPISchema | null {
		// Check if field should be excluded
		if (config?.exclude || this.shouldExcludeField(field)) {
			return null;
		}

		// Use custom schema if provided
		if (config?.schema) {
			return {
				...config.schema,
				description: config.schema.description || field.description || field.label
			};
		}

		// Get schema mapper for field type
		const mapper = FIELD_TYPE_MAPPING[field.fieldtype];
		if (!mapper) {
			// Default to string for unknown field types
			return {
				type: 'string',
				description: field.description || field.label,
				default: field.default,
				example: field.default || ''
			};
		}

		// Generate schema using mapper
		let schema = mapper(field);

		// Apply custom format if provided
		if (config?.format) {
			schema.format = config.format;
		}

		// Apply custom example if provided
		if (config?.example !== undefined) {
			schema.example = config.example;
		}

		// Apply deprecated flag
		if (field.deprecated || config?.deprecated) {
			schema.deprecated = true;
		}

		// Apply nullable flag for non-required fields
		if (!field.required) {
			schema.nullable = true;
		}

		return schema;
	}

	/**
	 * Convert multiple DocFields to OpenAPI schema properties
	 * @param fields Array of DocField definitions
	 * @param configs Optional field configurations by field name
	 * @returns Object with OpenAPI schema properties
	 */
	mapFields(
		fields: DocField[],
		configs?: Record<string, FieldOpenAPIConfig>
	): Record<string, OpenAPISchema> {
		const properties: Record<string, OpenAPISchema> = {};

		for (const field of fields) {
			const config = configs?.[field.fieldname];
			const schema = this.mapField(field, config);

			if (schema) {
				properties[field.fieldname] = schema;
			}
		}

		return properties;
	}

	/**
	 * Get required field names from DocFields
	 * @param fields Array of DocField definitions
	 * @param configs Optional field configurations by field name
	 * @returns Array of required field names
	 */
	getRequiredFields(
		fields: DocField[],
		configs?: Record<string, FieldOpenAPIConfig>
	): string[] {
		const required: string[] = [];

		for (const field of fields) {
			// Skip excluded fields
			if (configs?.[field.fieldname]?.exclude || this.shouldExcludeField(field)) {
				continue;
			}

			// Include field if it's required
			if (field.required) {
				required.push(field.fieldname);
			}
		}

		return required;
	}

	/**
	 * Check if a field should be excluded from OpenAPI schema
	 * @param field DocField definition
	 * @returns Whether field should be excluded
	 */
	private shouldExcludeField(field: DocField): boolean {
		// Exclude layout field types
		if (LAYOUT_FIELD_TYPES.includes(field.fieldtype)) {
			return true;
		}

		// Exclude hidden read-only fields
		if (field.hidden && field.read_only) {
			return true;
		}

		return false;
	}

	/**
	 * Get field type mapping for debugging or customization
	 * @returns Copy of field type mapping
	 */
	getFieldTypeMapping(): Partial<Record<FieldType, (field: DocField) => OpenAPISchema>> {
		return { ...FIELD_TYPE_MAPPING };
	}

	/**
	 * Add or update a field type mapping
	 * @param fieldType DocField type
	 * @param mapper Function to convert DocField to OpenAPI schema
	 */
	registerFieldType(
		fieldType: FieldType,
		mapper: (field: DocField) => OpenAPISchema
	): void {
		FIELD_TYPE_MAPPING[fieldType] = mapper;
	}

	/**
	 * Get layout field types
	 * @returns Array of layout field types
	 */
	getLayoutFieldTypes(): FieldType[] {
		return [...LAYOUT_FIELD_TYPES];
	}

	/**
	 * Add a layout field type
	 * @param fieldType Field type to add to layout types
	 */
	addLayoutFieldType(fieldType: FieldType): void {
		if (!LAYOUT_FIELD_TYPES.includes(fieldType)) {
			LAYOUT_FIELD_TYPES.push(fieldType);
		}
	}
}

// =============================================================================
// Default Export
// =============================================================================

export const fieldMapper = new FieldMapper();
export default fieldMapper;