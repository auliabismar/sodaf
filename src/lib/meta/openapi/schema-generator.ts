/**
 * Schema Generator - Request/Response Schemas for OpenAPI
 *
 * This module implements generation of OpenAPI request and response schemas
 * for DocType operations, including CRUD operations and custom actions.
 *
 * @module meta/openapi/schema-generator
 */

import type { DocType, DocField } from '../doctype/types';
import type { VirtualDocType } from '../doctype/virtual-doctype';
import type {
	OpenAPISchema,
	OpenAPIResponse,
	OpenAPIMediaType,
	OpenAPIRequestBody,
	DocTypeOpenAPIConfig,
	FieldOpenAPIConfig
} from './types';
import { fieldMapper } from './field-mapper';

// =============================================================================
// Standard Response Schemas
// =============================================================================

/**
 * Standard error response schema
 */
const ERROR_RESPONSE_SCHEMA: OpenAPISchema = {
	type: 'object',
	description: 'Error response',
	properties: {
		error: {
			type: 'boolean',
			description: 'Whether the response represents an error',
			example: true
		},
		message: {
			type: 'string',
			description: 'Error message',
			example: 'An error occurred while processing your request'
		},
		exc_type: {
			type: 'string',
			description: 'Exception type',
			example: 'ValidationError'
		},
		error_code: {
			type: 'string',
			description: 'Error code for client handling',
			example: 'VALIDATION_ERROR'
		},
		validation_errors: {
			type: 'array',
			description: 'Validation errors (for 400/422 responses)',
			items: {
				type: 'object',
				properties: {
					field: {
						type: 'string',
						description: 'Field name',
						example: 'email'
					},
					message: {
						type: 'string',
						description: 'Error message',
						example: 'Invalid email format'
					},
					code: {
						type: 'string',
						description: 'Error code',
						example: 'INVALID_FORMAT'
					}
				}
			}
		}
	},
	required: ['error', 'message']
};

/**
 * Standard success response schema wrapper
 */
const SUCCESS_RESPONSE_WRAPPER: OpenAPISchema = {
	type: 'object',
	description: 'Success response wrapper',
	properties: {
		data: {
			description: 'Response data',
			example: null
		},
		message: {
			type: 'string',
			description: 'Success message',
			example: 'Operation completed successfully'
		}
	},
	required: ['data']
};

/**
 * Pagination info schema
 */
const PAGINATION_SCHEMA: OpenAPISchema = {
	type: 'object',
	description: 'Pagination information',
	properties: {
		start: {
			type: 'integer',
			description: 'Starting offset',
			example: 0
		},
		limit: {
			type: 'integer',
			description: 'Page size limit',
			example: 20
		},
		total_count: {
			type: 'integer',
			description: 'Total count of records',
			example: 100
		},
		has_more: {
			type: 'boolean',
			description: 'Whether there are more records',
			example: true
		}
	},
	required: ['start', 'limit']
};

// =============================================================================
// Schema Generator Class
// =============================================================================

/**
 * SchemaGenerator class for creating OpenAPI request and response schemas
 */
export class SchemaGenerator {
	/**
	 * Generate DocType schema for responses
	 * @param doctype DocType definition
	 * @param config Optional DocType OpenAPI configuration
	 * @returns OpenAPI schema for the DocType
	 */
	generateDocTypeSchema(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPISchema {
		const fieldConfigs = this.extractFieldConfigs(config);
		const properties = fieldMapper.mapFields(doctype.fields, fieldConfigs);
		const required = fieldMapper.getRequiredFields(doctype.fields, fieldConfigs);

		// Add standard SODAF fields
		properties.name = {
			type: 'string',
			description: 'Document name/ID',
			example: `${doctype.name.toLowerCase()}-001`
		};
		properties.creation = {
			type: 'string',
			description: 'Creation timestamp',
			format: 'date-time',
			example: '2023-01-01T00:00:00Z'
		};
		properties.modified = {
			type: 'string',
			description: 'Modification timestamp',
			format: 'date-time',
			example: '2023-01-01T00:00:00Z'
		};
		properties.modified_by = {
			type: 'string',
			description: 'Last modified by',
			example: 'admin@example.com'
		};
		properties.owner = {
			type: 'string',
			description: 'Document owner',
			example: 'admin@example.com'
		};
		properties.docstatus = {
			type: 'integer',
			description: 'Document status (0=Saved, 1=Submitted, 2=Cancelled)',
			enum: [0, 1, 2],
			example: 0
		};

		// Add name to required fields
		if (!required.includes('name')) {
			required.push('name');
		}

		return {
			type: 'object',
			description: config?.descriptions?.read || `${doctype.name} document`,
			title: doctype.name,
			properties,
			required,
			deprecated: config?.deprecated
		};
	}

	/**
	 * Generate request body schema for create operations
	 * @param doctype DocType definition
	 * @param config Optional DocType OpenAPI configuration
	 * @returns OpenAPI request body
	 */
	generateCreateRequestBody(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPIRequestBody {
		const schema = this.generateCreateSchema(doctype, config);
		const fieldConfigs = this.extractFieldConfigs(config);

		return {
			description: `${doctype.name} document to create`,
			required: true,
			content: {
				'application/json': {
					schema,
					example: this.generateCreateExample(doctype, fieldConfigs)
				}
			}
		};
	}

	/**
	 * Generate request body schema for update operations
	 * @param doctype DocType definition
	 * @param config Optional DocType OpenAPI configuration
	 * @returns OpenAPI request body
	 */
	generateUpdateRequestBody(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPIRequestBody {
		const schema = this.generateUpdateSchema(doctype, config);
		const fieldConfigs = this.extractFieldConfigs(config);

		return {
			description: `${doctype.name} document fields to update`,
			required: false,
			content: {
				'application/json': {
					schema,
					example: this.generateUpdateExample(doctype, fieldConfigs)
				}
			}
		};
	}

	/**
	 * Generate response schema for list operations
	 * @param doctype DocType definition
	 * @param config Optional DocType OpenAPI configuration
	 * @returns OpenAPI response
	 */
	generateListResponse(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPIResponse {
		const docSchema = this.generateDocTypeSchema(doctype, config);

		return {
			description: config?.descriptions?.list || `List of ${doctype.name} documents`,
			content: {
				'application/json': {
					schema: {
						type: 'object',
						description: 'List response with pagination',
						properties: {
							data: {
								type: 'array',
								description: `Array of ${doctype.name} documents`,
								items: docSchema
							},
							message: {
								type: 'string',
								description: 'Success message',
								example: 'Documents retrieved successfully'
							},
							pagination: PAGINATION_SCHEMA
						},
						required: ['data']
					},
					example: {
						data: [this.generateDocTypeExample(doctype, config)],
						message: 'Documents retrieved successfully',
						pagination: {
							start: 0,
							limit: 20,
							total_count: 1,
							has_more: false
						}
					}
				}
			}
		};
	}

	/**
	 * Generate response schema for read operations
	 * @param doctype DocType definition
	 * @param config Optional DocType OpenAPI configuration
	 * @returns OpenAPI response
	 */
	generateReadResponse(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPIResponse {
		const docSchema = this.generateDocTypeSchema(doctype, config);

		return {
			description: config?.descriptions?.read || `${doctype.name} document`,
			content: {
				'application/json': {
					schema: SUCCESS_RESPONSE_WRAPPER,
					example: {
						data: this.generateDocTypeExample(doctype, config),
						message: 'Document retrieved successfully'
					}
				}
			}
		};
	}

	/**
	 * Generate response schema for create operations
	 * @param doctype DocType definition
	 * @param config Optional DocType OpenAPI configuration
	 * @returns OpenAPI response
	 */
	generateCreateResponse(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPIResponse {
		const docSchema = this.generateDocTypeSchema(doctype, config);

		return {
			description: config?.descriptions?.create || `Created ${doctype.name} document`,
			content: {
				'application/json': {
					schema: SUCCESS_RESPONSE_WRAPPER,
					example: {
						data: this.generateDocTypeExample(doctype, config),
						message: 'Document created successfully'
					}
				}
			}
		};
	}

	/**
	 * Generate response schema for update operations
	 * @param doctype DocType definition
	 * @param config Optional DocType OpenAPI configuration
	 * @returns OpenAPI response
	 */
	generateUpdateResponse(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPIResponse {
		const docSchema = this.generateDocTypeSchema(doctype, config);

		return {
			description: config?.descriptions?.update || `Updated ${doctype.name} document`,
			content: {
				'application/json': {
					schema: SUCCESS_RESPONSE_WRAPPER,
					example: {
						data: this.generateDocTypeExample(doctype, config),
						message: 'Document updated successfully'
					}
				}
			}
		};
	}

	/**
	 * Generate response schema for delete operations
	 * @param doctype DocType definition
	 * @param config Optional DocType OpenAPI configuration
	 * @returns OpenAPI response
	 */
	generateDeleteResponse(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPIResponse {
		return {
			description: config?.descriptions?.delete || `Deleted ${doctype.name} document`,
			content: {
				'application/json': {
					schema: SUCCESS_RESPONSE_WRAPPER,
					example: {
						data: null,
						message: 'Document deleted successfully'
					}
				}
			}
		};
	}

	/**
	 * Generate response schema for submittable operations
	 * @param doctype DocType definition
	 * @param operation Operation type (submit, cancel, amend)
	 * @param config Optional DocType OpenAPI configuration
	 * @returns OpenAPI response
	 */
	generateSubmittableResponse(
		doctype: DocType | VirtualDocType,
		operation: 'submit' | 'cancel' | 'amend',
		config?: DocTypeOpenAPIConfig
	): OpenAPIResponse {
		const docSchema = this.generateDocTypeSchema(doctype, config);
		const operationText = operation.charAt(0).toUpperCase() + operation.slice(1);

		return {
			description: config?.descriptions?.[operation] || `${operationText}ed ${doctype.name} document`,
			content: {
				'application/json': {
					schema: SUCCESS_RESPONSE_WRAPPER,
					example: {
						data: this.generateDocTypeExample(doctype, config),
						message: `Document ${operation}ed successfully`
					}
				}
			}
		};
	}

	/**
	 * Generate standard error response
	 * @param statusCode HTTP status code
	 * @param description Response description
	 * @returns OpenAPI error response
	 */
	generateErrorResponse(statusCode: number, description?: string): OpenAPIResponse {
		return {
			description: description || `Error response (${statusCode})`,
			content: {
				'application/json': {
					schema: ERROR_RESPONSE_SCHEMA,
					example: {
						error: true,
						message: 'An error occurred while processing your request',
						exc_type: 'ValidationError',
						error_code: 'VALIDATION_ERROR'
					}
				}
			}
		};
	}

	// =========================================================================
	// Private Helper Methods
	// =========================================================================

	/**
	 * Generate schema for create operations
	 */
	private generateCreateSchema(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPISchema {
		const fieldConfigs = this.extractFieldConfigs(config);
		const properties = fieldMapper.mapFields(doctype.fields, fieldConfigs);
		const required = fieldMapper.getRequiredFields(doctype.fields, fieldConfigs);

		// Filter out system-generated fields for create
		const createProperties = { ...properties };
		delete createProperties.creation;
		delete createProperties.modified;
		delete createProperties.modified_by;
		delete createProperties.docstatus;

		// Filter out read-only fields
		for (const [fieldName, schema] of Object.entries(createProperties)) {
			if (schema.readOnly) {
				delete createProperties[fieldName];
				const index = required.indexOf(fieldName);
				if (index > -1) {
					required.splice(index, 1);
				}
			}
		}

		return {
			type: 'object',
			description: `${doctype.name} document to create`,
			properties: createProperties,
			required
		};
	}

	/**
	 * Generate schema for update operations
	 */
	private generateUpdateSchema(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPISchema {
		const fieldConfigs = this.extractFieldConfigs(config);
		const properties = fieldMapper.mapFields(doctype.fields, fieldConfigs);

		// Filter out system-generated fields for update
		const updateProperties = { ...properties };
		delete updateProperties.creation;
		delete updateProperties.modified;
		delete updateProperties.modified_by;
		delete updateProperties.docstatus;

		// Filter out read-only fields
		for (const [fieldName, schema] of Object.entries(updateProperties)) {
			if (schema.readOnly) {
				delete updateProperties[fieldName];
			}
		}

		return {
			type: 'object',
			description: `${doctype.name} document fields to update`,
			properties: updateProperties,
			required: [] // All fields optional for updates
		};
	}

	/**
	 * Generate example for create operations
	 */
	private generateCreateExample(
		doctype: DocType | VirtualDocType,
		fieldConfigs?: Record<string, FieldOpenAPIConfig>
	): Record<string, any> {
		const example: Record<string, any> = {};

		for (const field of doctype.fields) {
			const config = fieldConfigs?.[field.fieldname];
			if (config?.exclude || field.read_only || field.fieldname === 'name') {
				continue;
			}

			if (config?.example !== undefined) {
				example[field.fieldname] = config.example;
			} else if (field.default !== undefined) {
				example[field.fieldname] = field.default;
			} else {
				example[field.fieldname] = this.generateFieldExample(field);
			}
		}

		return example;
	}

	/**
	 * Generate example for update operations
	 */
	private generateUpdateExample(
		doctype: DocType | VirtualDocType,
		fieldConfigs?: Record<string, FieldOpenAPIConfig>
	): Record<string, any> {
		const example: Record<string, any> = {};
		let count = 0;

		for (const field of doctype.fields) {
			const config = fieldConfigs?.[field.fieldname];
			if (config?.exclude || field.read_only || field.fieldname === 'name') {
				continue;
			}

			// Limit to 3 fields for update example
			if (count >= 3) {
				break;
			}

			if (config?.example !== undefined) {
				example[field.fieldname] = config.example;
			} else if (field.default !== undefined) {
				example[field.fieldname] = field.default;
			} else {
				example[field.fieldname] = this.generateFieldExample(field);
			}

			count++;
		}

		return example;
	}

	/**
	 * Generate example for DocType document
	 */
	private generateDocTypeExample(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): Record<string, any> {
		const fieldConfigs = this.extractFieldConfigs(config);
		const example: Record<string, any> = {
			name: `${doctype.name.toLowerCase()}-001`,
			creation: '2023-01-01T00:00:00Z',
			modified: '2023-01-01T00:00:00Z',
			modified_by: 'admin@example.com',
			owner: 'admin@example.com',
			docstatus: 0
		};

		for (const field of doctype.fields) {
			const config = fieldConfigs?.[field.fieldname];
			if (config?.exclude) {
				continue;
			}

			if (config?.example !== undefined) {
				example[field.fieldname] = config.example;
			} else if (field.default !== undefined) {
				example[field.fieldname] = field.default;
			} else {
				example[field.fieldname] = this.generateFieldExample(field);
			}
		}

		return example;
	}

	/**
	 * Generate example for a specific field
	 */
	private generateFieldExample(field: DocField): any {
		switch (field.fieldtype) {
			case 'Data':
			case 'Long Text':
			case 'Small Text':
			case 'Text Editor':
			case 'Code':
			case 'Markdown Editor':
			case 'HTML Editor':
			case 'Password':
			case 'Read Only':
				return field.label || 'Sample text';

			case 'Int':
				return 0;

			case 'Float':
			case 'Currency':
			case 'Percent':
				return 0.0;

			case 'Check':
				return false;

			case 'Select':
				if (field.options) {
					const options = field.options.split('\n').map(opt => opt.trim()).filter(Boolean);
					return options[0] || '';
				}
				return '';

			case 'Link':
			case 'Dynamic Link':
				return 'reference-id';

			case 'Table':
			case 'Table MultiSelect':
				return [];

			case 'Date':
				return '2023-01-01';

			case 'Datetime':
				return '2023-01-01T00:00:00Z';

			case 'Time':
			case 'Duration':
				return '00:00:00';

			case 'Geolocation':
				return { latitude: 0, longitude: 0 };

			case 'Attach':
			case 'Attach Image':
			case 'Signature':
			case 'Image':
				return '/files/sample.jpg';

			case 'Color':
				return '#000000';

			case 'Rating':
				return 1;

			case 'HTML':
				return '<div>Sample HTML</div>';

			default:
				return null;
		}
	}

	/**
	 * Extract field configurations from DocType OpenAPI configuration
	 */
	private extractFieldConfigs(
		config?: DocTypeOpenAPIConfig
	): Record<string, FieldOpenAPIConfig> | undefined {
		// This would be implemented to extract field-specific configurations
		// from the DocType OpenAPI configuration
		return undefined;
	}
}

// =============================================================================
// Default Export
// =============================================================================

export const schemaGenerator = new SchemaGenerator();
export default schemaGenerator;