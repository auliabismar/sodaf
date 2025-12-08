/**
 * OpenAPI Module - Entry Point
 *
 * This module exports all OpenAPI generator components and provides
 * a unified interface for OpenAPI generation in SODAF.
 *
 * @module meta/openapi
 */

// =============================================================================
// Type Exports
// =============================================================================

export type {
	// Core OpenAPI Types
	OpenAPISpec,
	OpenAPIInfo,
	OpenAPIServer,
	OpenAPIServerVariable,
	OpenAPIContact,
	OpenAPILicense,
	OpenAPIPaths,
	OpenAPIPathItem,
	OpenAPIOperation,
	OpenAPIParameter,
	OpenAPIRequestBody,
	OpenAPIMediaType,
	OpenAPIEncoding,
	OpenAPIResponses,
	OpenAPIResponse,
	OpenAPIHeader,
	OpenAPIExample,
	OpenAPILink,
	OpenAPICallback,
	OpenAPISecurityRequirement,
	OpenAPIComponents,
	OpenAPISchema,
	OpenAPIDiscriminator,
	OpenAPIXML,
	OpenAPISecurityScheme,
	OpenAPIOAuthFlows,
	OpenAPIOAuthFlow,
	OpenAPITag,
	OpenAPIExternalDocumentation,

	// SODAF-specific OpenAPI Types
	OpenAPIGeneratorOptions,
	DocTypeOpenAPIConfig,
	FieldOpenAPIConfig
} from './types';

// =============================================================================
// Class Exports
// =============================================================================

export { FieldMapper } from './field-mapper';
export { SchemaGenerator } from './schema-generator';
export { RouteGenerator } from './route-generator';
export { SecurityGenerator } from './security-generator';
export { OpenAPIGenerator } from './generator';

// =============================================================================
// Default Instance Exports
// =============================================================================

export { fieldMapper } from './field-mapper';
export { schemaGenerator } from './schema-generator';
export { routeGenerator } from './route-generator';
export { securityGenerator } from './security-generator';
export { openAPIGenerator } from './generator';

// =============================================================================
// Utility Functions
// =============================================================================

import type { DocType } from '../doctype/types';
import type { VirtualDocType } from '../doctype/virtual-doctype';
import type { OpenAPIGeneratorOptions, DocTypeOpenAPIConfig } from './types';
import { openAPIGenerator } from './generator';

/**
 * Generate OpenAPI specification for DocTypes
 * @param doctypes Array of DocType definitions
 * @param options Generator options
 * @param configs Optional DocType configurations
 * @returns OpenAPI specification
 */
export function generateOpenAPISpecification(
	doctypes: (DocType | VirtualDocType)[],
	options?: OpenAPIGeneratorOptions,
	configs?: Record<string, DocTypeOpenAPIConfig>
) {
	if (options) {
		openAPIGenerator.updateOptions(options);
	}
	return openAPIGenerator.generateSpecification(doctypes, configs);
}

/**
 * Generate OpenAPI specification as JSON string
 * @param doctypes Array of DocType definitions
 * @param options Generator options
 * @param configs Optional DocType configurations
 * @returns OpenAPI specification as JSON string
 */
export function generateOpenAPIJSON(
	doctypes: (DocType | VirtualDocType)[],
	options?: OpenAPIGeneratorOptions,
	configs?: Record<string, DocTypeOpenAPIConfig>
): string {
	if (options) {
		openAPIGenerator.updateOptions(options);
	}
	return openAPIGenerator.generateSpecificationJSON(doctypes, configs);
}

/**
 * Generate OpenAPI specification as YAML string
 * @param doctypes Array of DocType definitions
 * @param options Generator options
 * @param configs Optional DocType configurations
 * @returns OpenAPI specification as YAML string
 */
export function generateOpenAPIYAML(
	doctypes: (DocType | VirtualDocType)[],
	options?: OpenAPIGeneratorOptions,
	configs?: Record<string, DocTypeOpenAPIConfig>
): string {
	if (options) {
		openAPIGenerator.updateOptions(options);
	}
	return openAPIGenerator.generateSpecificationYAML(doctypes, configs);
}

/**
 * Generate OpenAPI paths for DocTypes
 * @param doctypes Array of DocType definitions
 * @param configs Optional DocType configurations
 * @returns OpenAPI paths object
 */
export function generateOpenAPIPaths(
	doctypes: (DocType | VirtualDocType)[],
	configs?: Record<string, DocTypeOpenAPIConfig>
) {
	return openAPIGenerator.generatePaths(doctypes, configs);
}

/**
 * Generate OpenAPI schemas for DocTypes
 * @param doctypes Array of DocType definitions
 * @param configs Optional DocType configurations
 * @returns OpenAPI schemas object
 */
export function generateOpenAPISchemas(
	doctypes: (DocType | VirtualDocType)[],
	configs?: Record<string, DocTypeOpenAPIConfig>
) {
	return openAPIGenerator.generateSchemas(doctypes, configs);
}

/**
 * Create a new OpenAPI generator instance
 * @param options Generator options
 * @returns OpenAPI generator instance
 */
export function createOpenAPIGenerator(options?: OpenAPIGeneratorOptions) {
	const { OpenAPIGenerator } = require('./generator');
	return new OpenAPIGenerator(options);
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Default OpenAPI generator options
 */
export const DEFAULT_OPENAPI_OPTIONS: Required<OpenAPIGeneratorOptions> = {
	baseUrl: 'http://localhost:5173',
	version: '1.0.0',
	title: 'SODAF API',
	description: 'SODAF (Frappe framework clone) REST API',
	contact: {
		name: 'SODAF Team',
		email: 'team@sodaf.dev'
	},
	license: {
		name: 'MIT',
		url: 'https://opensource.org/licenses/MIT'
	},
	includeDeprecated: false,
	includeInternal: false,
	securitySchemes: {},
	defaultSecurity: [{ bearer: [] }],
	customTags: {},
	includeExamples: true,
	includeExternalDocs: true
};

/**
 * Supported OpenAPI formats
 */
export const OPENAPI_FORMATS = {
	JSON: 'json',
	YAML: 'yaml'
} as const;

/**
 * Supported authentication schemes
 */
export const AUTH_SCHEMES = {
	BEARER: 'bearer',
	SESSION: 'session',
	BASIC: 'basic',
	OAUTH2: 'oauth2',
	API_KEY: 'apiKey'
} as const;

/**
 * Standard HTTP status codes for OpenAPI responses
 */
export const HTTP_STATUS_CODES = {
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	UNPROCESSABLE_ENTITY: 422,
	INTERNAL_SERVER_ERROR: 500
} as const;

// =============================================================================
// Version Information
// =============================================================================

/**
 * OpenAPI module version
 */
export const OPENAPI_MODULE_VERSION = '1.0.0';

/**
 * Supported OpenAPI specification version
 */
export const OPENAPI_SPEC_VERSION = '3.0.3';

// =============================================================================
// Module Metadata
// =============================================================================

/**
 * Module information
 */
export const MODULE_INFO = {
	name: 'sodaf-openapi-generator',
	version: OPENAPI_MODULE_VERSION,
	description: 'OpenAPI 3.0 specification generator for SODAF',
	author: 'SODAF Team',
	license: 'MIT',
	repository: 'https://github.com/sodaf/sodaf',
	supportedVersions: ['3.0.0', '3.0.1', '3.0.2', '3.0.3'],
	features: [
		'DocType to OpenAPI schema mapping',
		'CRUD operation generation',
		'Submittable DocType support',
		'Virtual DocType support',
		'Custom authentication schemes',
		'Role-based security',
		'Custom field mapping',
		'Pagination support',
		'Error response documentation',
		'Example generation',
		'Tag-based organization'
	]
} as const;