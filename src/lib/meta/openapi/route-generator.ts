/**
 * Route Generator - OpenAPI Paths from DocTypes
 *
 * This module implements generation of OpenAPI path objects from DocType definitions,
 * handling CRUD operations, submittable operations, and custom actions.
 *
 * @module meta/openapi/route-generator
 */

import type { DocType, DocField } from '../doctype/types';
import type { VirtualDocType } from '../doctype/virtual-doctype';
import type {
	OpenAPIPaths,
	OpenAPIPathItem,
	OpenAPIOperation,
	OpenAPIParameter,
	DocTypeOpenAPIConfig
} from './types';
import { schemaGenerator } from './schema-generator';

// =============================================================================
// Standard Parameters
// =============================================================================

/**
 * Standard name parameter for document operations
 */
const NAME_PARAMETER: OpenAPIParameter = {
	name: 'name',
	in: 'path',
	description: 'Document name or ID',
	required: true,
	schema: {
		type: 'string',
		pattern: '^[a-zA-Z0-9_.-]+$',
		example: 'document-001'
	}
};

/**
 * Standard doctype parameter for document operations
 */
const DOCTYPE_PARAMETER: OpenAPIParameter = {
	name: 'doctype',
	in: 'path',
	description: 'DocType name',
	required: true,
	schema: {
		type: 'string',
		pattern: '^[a-zA-Z][a-zA-Z0-9_]*$',
		example: 'User'
	}
};

/**
 * Standard query parameters for list operations
 */
const LIST_QUERY_PARAMETERS: OpenAPIParameter[] = [
	{
		name: 'fields',
		in: 'query',
		description: 'Fields to return (comma-separated)',
		required: false,
		schema: {
			type: 'string',
			example: 'name,email,status'
		}
	},
	{
		name: 'limit_start',
		in: 'query',
		description: 'Starting offset for pagination',
		required: false,
		schema: {
			type: 'integer',
			minimum: 0,
			default: 0,
			example: 0
		}
	},
	{
		name: 'limit_page_length',
		in: 'query',
		description: 'Number of records to return',
		required: false,
		schema: {
			type: 'integer',
			minimum: 1,
			maximum: 500,
			default: 20,
			example: 20
		}
	},
	{
		name: 'order_by',
		in: 'query',
		description: 'Sort order (field:direction)',
		required: false,
		schema: {
			type: 'string',
			example: 'modified:desc'
		}
	},
	{
		name: 'filters',
		in: 'query',
		description: 'Filter conditions (JSON string)',
		required: false,
		schema: {
			type: 'string',
			example: '{"status": "Active"}'
		}
	}
];

// =============================================================================
// Route Generator Class
// =============================================================================

/**
 * RouteGenerator class for creating OpenAPI paths from DocTypes
 */
export class RouteGenerator {
	/**
	 * Generate OpenAPI paths for a DocType
	 * @param doctype DocType definition
	 * @param basePath Base path for API routes
	 * @param config Optional DocType OpenAPI configuration
	 * @returns OpenAPI paths object
	 */
	generatePaths(
		doctype: DocType | VirtualDocType,
		basePath: string = '/api/resource',
		config?: DocTypeOpenAPIConfig
	): OpenAPIPaths {
		const paths: OpenAPIPaths = {};
		const doctypePath = this.normalizeDocTypePath(doctype.name);
		const fullPath = `${basePath}/${doctypePath}`;

		// Skip if DocType is excluded
		if (config?.exclude) {
			return paths;
		}

		// Generate paths based on DocType type
		if ((doctype as any).is_virtual) {
			this.generateVirtualPaths(doctype as VirtualDocType, fullPath, paths, config);
		} else if (doctype.issingle) {
			this.generateSinglePaths(doctype, fullPath, paths, config);
		} else {
			this.generateStandardPaths(doctype, fullPath, paths, config);
		}

		return paths;
	}

	/**
	 * Generate paths for standard DocTypes (full CRUD)
	 */
	private generateStandardPaths(
		doctype: DocType,
		fullPath: string,
		paths: OpenAPIPaths,
		config?: DocTypeOpenAPIConfig
	): void {
		// List path: GET /api/resource/{doctype}
		paths[fullPath] = {
			get: this.generateListOperation(doctype, config)
		};

		// Create path: POST /api/resource/{doctype}
		paths[fullPath].post = this.generateCreateOperation(doctype, config);

		// Document path: /api/resource/{doctype}/{name}
		const documentPath = `${fullPath}/{name}`;
		paths[documentPath] = {
			get: this.generateReadOperation(doctype, config),
			put: this.generateUpdateOperation(doctype, config),
			delete: this.generateDeleteOperation(doctype, config)
		};

		// Submittable paths if applicable
		if (doctype.is_submittable) {
			paths[documentPath].post = this.generateSubmittableOperations(doctype, config);
		}
	}

	/**
	 * Generate paths for Single DocTypes (only GET and PUT)
	 */
	private generateSinglePaths(
		doctype: DocType,
		fullPath: string,
		paths: OpenAPIPaths,
		config?: DocTypeOpenAPIConfig
	): void {
		// Single document path: GET /api/resource/{doctype}
		paths[fullPath] = {
			get: this.generateReadOperation(doctype, config),
			put: this.generateUpdateOperation(doctype, config)
		};
	}

	/**
	 * Generate paths for Virtual DocTypes (custom handlers)
	 */
	private generateVirtualPaths(
		doctype: VirtualDocType,
		fullPath: string,
		paths: OpenAPIPaths,
		config?: DocTypeOpenAPIConfig
	): void {
		// Virtual DocTypes get placeholder operations
		paths[fullPath] = {
			get: this.generateVirtualOperation(doctype, 'list', config),
			post: this.generateVirtualOperation(doctype, 'create', config)
		};

		const documentPath = `${fullPath}/{name}`;
		paths[documentPath] = {
			get: this.generateVirtualOperation(doctype, 'read', config),
			put: this.generateVirtualOperation(doctype, 'update', config),
			delete: this.generateVirtualOperation(doctype, 'delete', config)
		};
	}

	/**
	 * Generate list operation
	 */
	private generateListOperation(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPIOperation {
		return {
			tags: config?.tags || [doctype.module || 'Default', doctype.name],
			summary: config?.descriptions?.list || `List ${doctype.name} documents`,
			description: `Retrieve a list of ${doctype.name} documents with optional filtering and pagination`,
			operationId: config?.operationIds?.list || `list${doctype.name}`,
			parameters: [DOCTYPE_PARAMETER, ...LIST_QUERY_PARAMETERS],
			responses: {
				'200': schemaGenerator.generateListResponse(doctype, config),
				'400': schemaGenerator.generateErrorResponse(400, 'Bad request'),
				'401': schemaGenerator.generateErrorResponse(401, 'Unauthorized'),
				'403': schemaGenerator.generateErrorResponse(403, 'Forbidden'),
				'500': schemaGenerator.generateErrorResponse(500, 'Internal server error')
			},
			deprecated: config?.deprecated
		};
	}

	/**
	 * Generate create operation
	 */
	private generateCreateOperation(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPIOperation {
		return {
			tags: config?.tags || [doctype.module || 'Default', doctype.name],
			summary: config?.descriptions?.create || `Create ${doctype.name} document`,
			description: `Create a new ${doctype.name} document`,
			operationId: config?.operationIds?.create || `create${doctype.name}`,
			parameters: [DOCTYPE_PARAMETER],
			requestBody: schemaGenerator.generateCreateRequestBody(doctype, config),
			responses: {
				'201': schemaGenerator.generateCreateResponse(doctype, config),
				'400': schemaGenerator.generateErrorResponse(400, 'Validation error'),
				'401': schemaGenerator.generateErrorResponse(401, 'Unauthorized'),
				'403': schemaGenerator.generateErrorResponse(403, 'Forbidden'),
				'409': schemaGenerator.generateErrorResponse(409, 'Conflict'),
				'422': schemaGenerator.generateErrorResponse(422, 'Unprocessable entity'),
				'500': schemaGenerator.generateErrorResponse(500, 'Internal server error')
			},
			deprecated: config?.deprecated
		};
	}

	/**
	 * Generate read operation
	 */
	private generateReadOperation(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPIOperation {
		const isSingle = doctype.issingle;
		const parameters = isSingle ? [DOCTYPE_PARAMETER] : [DOCTYPE_PARAMETER, NAME_PARAMETER];

		return {
			tags: config?.tags || [doctype.module || 'Default', doctype.name],
			summary: config?.descriptions?.read || `Get ${doctype.name} document`,
			description: isSingle
				? `Get the ${doctype.name} document`
				: `Get a ${doctype.name} document by name`,
			operationId: config?.operationIds?.read || `get${doctype.name}`,
			parameters,
			responses: {
				'200': schemaGenerator.generateReadResponse(doctype, config),
				'401': schemaGenerator.generateErrorResponse(401, 'Unauthorized'),
				'403': schemaGenerator.generateErrorResponse(403, 'Forbidden'),
				'404': schemaGenerator.generateErrorResponse(404, 'Not found'),
				'500': schemaGenerator.generateErrorResponse(500, 'Internal server error')
			},
			deprecated: config?.deprecated
		};
	}

	/**
	 * Generate update operation
	 */
	private generateUpdateOperation(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPIOperation {
		const isSingle = doctype.issingle;
		const parameters = isSingle ? [DOCTYPE_PARAMETER] : [DOCTYPE_PARAMETER, NAME_PARAMETER];

		return {
			tags: config?.tags || [doctype.module || 'Default', doctype.name],
			summary: config?.descriptions?.update || `Update ${doctype.name} document`,
			description: isSingle
				? `Update the ${doctype.name} document`
				: `Update a ${doctype.name} document`,
			operationId: config?.operationIds?.update || `update${doctype.name}`,
			parameters,
			requestBody: schemaGenerator.generateUpdateRequestBody(doctype, config),
			responses: {
				'200': schemaGenerator.generateUpdateResponse(doctype, config),
				'400': schemaGenerator.generateErrorResponse(400, 'Validation error'),
				'401': schemaGenerator.generateErrorResponse(401, 'Unauthorized'),
				'403': schemaGenerator.generateErrorResponse(403, 'Forbidden'),
				'404': schemaGenerator.generateErrorResponse(404, 'Not found'),
				'409': schemaGenerator.generateErrorResponse(409, 'Conflict'),
				'422': schemaGenerator.generateErrorResponse(422, 'Unprocessable entity'),
				'500': schemaGenerator.generateErrorResponse(500, 'Internal server error')
			},
			deprecated: config?.deprecated
		};
	}

	/**
	 * Generate delete operation
	 */
	private generateDeleteOperation(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPIOperation {
		return {
			tags: config?.tags || [doctype.module || 'Default', doctype.name],
			summary: config?.descriptions?.delete || `Delete ${doctype.name} document`,
			description: `Delete a ${doctype.name} document`,
			operationId: config?.operationIds?.delete || `delete${doctype.name}`,
			parameters: [DOCTYPE_PARAMETER, NAME_PARAMETER],
			responses: {
				'200': schemaGenerator.generateDeleteResponse(doctype, config),
				'204': {
					description: 'Document deleted successfully',
					content: {}
				},
				'401': schemaGenerator.generateErrorResponse(401, 'Unauthorized'),
				'403': schemaGenerator.generateErrorResponse(403, 'Forbidden'),
				'404': schemaGenerator.generateErrorResponse(404, 'Not found'),
				'500': schemaGenerator.generateErrorResponse(500, 'Internal server error')
			},
			deprecated: config?.deprecated
		};
	}

	/**
	 * Generate submittable operations (submit, cancel, amend)
	 */
	private generateSubmittableOperations(
		doctype: DocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPIOperation {
		// This would be extended to handle multiple submittable operations
		// For now, we'll focus on the submit operation
		return {
			tags: config?.tags || [doctype.module || 'Default', doctype.name],
			summary: config?.descriptions?.submit || `Submit ${doctype.name} document`,
			description: `Submit a ${doctype.name} document for approval`,
			operationId: config?.operationIds?.submit || `submit${doctype.name}`,
			parameters: [DOCTYPE_PARAMETER, NAME_PARAMETER],
			responses: {
				'200': schemaGenerator.generateSubmittableResponse(doctype, 'submit', config),
				'400': schemaGenerator.generateErrorResponse(400, 'Validation error'),
				'401': schemaGenerator.generateErrorResponse(401, 'Unauthorized'),
				'403': schemaGenerator.generateErrorResponse(403, 'Forbidden'),
				'404': schemaGenerator.generateErrorResponse(404, 'Not found'),
				'409': schemaGenerator.generateErrorResponse(409, 'Document cannot be submitted'),
				'500': schemaGenerator.generateErrorResponse(500, 'Internal server error')
			},
			deprecated: config?.deprecated
		};
	}

	/**
	 * Generate virtual operation placeholder
	 */
	private generateVirtualOperation(
		doctype: VirtualDocType,
		operation: 'list' | 'create' | 'read' | 'update' | 'delete',
		config?: DocTypeOpenAPIConfig
	): OpenAPIOperation {
		const operationText = operation.charAt(0).toUpperCase() + operation.slice(1);
		const isDocumentOperation = ['read', 'update', 'delete'].includes(operation);
		const parameters = isDocumentOperation
			? [DOCTYPE_PARAMETER, NAME_PARAMETER]
			: [DOCTYPE_PARAMETER];

		return {
			tags: config?.tags || [doctype.module || 'Virtual', doctype.name],
			summary: `${operationText} ${doctype.name} (Virtual)`,
			description: `Custom ${operation} handler for virtual DocType ${doctype.name}`,
			operationId: config?.operationIds?.[operation] || `${operation}${doctype.name}`,
			parameters,
			responses: {
				'200': schemaGenerator.generateReadResponse(doctype, config),
				'400': schemaGenerator.generateErrorResponse(400, 'Bad request'),
				'401': schemaGenerator.generateErrorResponse(401, 'Unauthorized'),
				'403': schemaGenerator.generateErrorResponse(403, 'Forbidden'),
				'404': schemaGenerator.generateErrorResponse(404, 'Not found'),
				'500': schemaGenerator.generateErrorResponse(500, 'Internal server error')
			},
			deprecated: config?.deprecated
		};
	}

	/**
	 * Generate paths for multiple DocTypes
	 * @param doctypes Array of DocType definitions
	 * @param basePath Base path for API routes
	 * @param configs Optional DocType OpenAPI configurations by name
	 * @returns OpenAPI paths object
	 */
	generatePathsForDocTypes(
		doctypes: (DocType | VirtualDocType)[],
		basePath: string = '/api/resource',
		configs?: Record<string, DocTypeOpenAPIConfig>
	): OpenAPIPaths {
		const paths: OpenAPIPaths = {};

		for (const doctype of doctypes) {
			const config = configs?.[doctype.name];
			const doctypePaths = this.generatePaths(doctype, basePath, config);

			// Merge paths
			Object.assign(paths, doctypePaths);
		}

		return paths;
	}

	/**
	 * Generate custom action paths for DocType actions
	 * @param doctype DocType definition
	 * @param basePath Base path for API routes
	 * @param config Optional DocType OpenAPI configuration
	 * @returns OpenAPI paths object for custom actions
	 */
	generateActionPaths(
		doctype: DocType,
		basePath: string = '/api/resource',
		config?: DocTypeOpenAPIConfig
	): OpenAPIPaths {
		const paths: OpenAPIPaths = {};

		if (!doctype.actions || doctype.actions.length === 0) {
			return paths;
		}

		const doctypePath = this.normalizeDocTypePath(doctype.name);
		const documentPath = `${basePath}/${doctypePath}/{name}`;

		for (const action of doctype.actions) {
			const actionPath = `${documentPath}/${action.action}`;
			paths[actionPath] = {
				post: this.generateActionOperation(doctype, action, config)
			};
		}

		return paths;
	}

	/**
	 * Generate operation for custom DocType action
	 */
	private generateActionOperation(
		doctype: DocType,
		action: any, // DocTypeAction
		config?: DocTypeOpenAPIConfig
	): OpenAPIOperation {
		return {
			tags: config?.tags || [doctype.module || 'Default', doctype.name],
			summary: action.label || `${action.action} ${doctype.name}`,
			description: action.label || `Execute ${action.action} action on ${doctype.name}`,
			operationId: `${action.action}${doctype.name}`,
			parameters: [DOCTYPE_PARAMETER, NAME_PARAMETER],
			responses: {
				'200': schemaGenerator.generateReadResponse(doctype, config),
				'400': schemaGenerator.generateErrorResponse(400, 'Bad request'),
				'401': schemaGenerator.generateErrorResponse(401, 'Unauthorized'),
				'403': schemaGenerator.generateErrorResponse(403, 'Forbidden'),
				'404': schemaGenerator.generateErrorResponse(404, 'Not found'),
				'500': schemaGenerator.generateErrorResponse(500, 'Internal server error')
			},
			deprecated: action.hidden || config?.deprecated
		};
	}

	/**
	 * Normalize DocType name for URL path
	 * @param name DocType name
	 * @returns Normalized path
	 */
	private normalizeDocTypePath(name: string): string {
		return name.toLowerCase().replace(/\s+/g, '_');
	}

	/**
	 * Get standard parameters for reuse
	 * @returns Object containing standard parameters
	 */
	getStandardParameters(): {
		name: OpenAPIParameter;
		doctype: OpenAPIParameter;
		listQuery: OpenAPIParameter[];
	} {
		return {
			name: NAME_PARAMETER,
			doctype: DOCTYPE_PARAMETER,
			listQuery: LIST_QUERY_PARAMETERS
		};
	}
}

// =============================================================================
// Default Export
// =============================================================================

export const routeGenerator = new RouteGenerator();
export default routeGenerator;