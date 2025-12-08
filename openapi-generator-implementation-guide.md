# OpenAPI Generator Implementation Guide

## Overview

This guide provides detailed implementation examples for the OpenAPI Generator feature (P2-018) in SODAF framework. It includes code examples, interfaces, and implementation details for each component.

## 1. OpenAPI Types Definition

Create `src/lib/meta/api/openapi-types.ts`:

```typescript
/**
 * OpenAPI 3.0 Specification Types
 * 
 * This file defines TypeScript interfaces for OpenAPI 3.0 specification
 * based on the official OpenAPI 3.0.3 specification.
 */

// =============================================================================
// Core OpenAPI Types
// =============================================================================

/**
 * Main OpenAPI document interface
 */
export interface OpenAPIDocument {
	/** OpenAPI version */
	openapi: string;
	
	/** API information */
	info: InfoObject;
	
	/** Array of Server objects */
	servers?: ServerObject[];
	
	/** Available paths and operations */
	paths: PathsObject;
	
	/** Reusable components */
	components?: ComponentsObject;
	
	/** Security requirements */
	security?: SecurityRequirementObject[];
	
	/** Tags for grouping operations */
	tags?: TagObject[];
	
	/** External documentation */
	externalDocs?: ExternalDocumentationObject;
}

/**
 * API information object
 */
export interface InfoObject {
	/** API title */
	title: string;
	
	/** API description */
	description?: string;
	
	/** API version */
	version: string;
	
	/** Terms of service URL */
	termsOfService?: string;
	
	/** Contact information */
	contact?: ContactObject;
	
	/** License information */
	license?: LicenseObject;
}

/**
 * Server object
 */
export interface ServerObject {
	/** Server URL */
	url: string;
	
	/** Server description */
	description?: string;
	
	/** Server variables */
	variables?: Record<string, ServerVariableObject>;
}

/**
 * Server variable object
 */
export interface ServerVariableObject {
	/** Default value */
	default: string;
	
	/** Enumeration of values */
	enum?: string[];
	
	/** Variable description */
	description?: string;
}

/**
 * Paths object
 */
export interface PathsObject {
	/** Path item objects */
	[path: string]: PathItemObject;
}

/**
 * Path item object
 */
export interface PathItemObject {
	/** GET operation */
	get?: OperationObject;
	
	/** PUT operation */
	put?: OperationObject;
	
	/** POST operation */
	post?: OperationObject;
	
	/** DELETE operation */
	delete?: OperationObject;
	
	/** OPTIONS operation */
	options?: OperationObject;
	
	/** HEAD operation */
	head?: OperationObject;
	
	/** PATCH operation */
	patch?: OperationObject;
	
	/** TRACE operation */
	trace?: OperationObject;
	
	/** Parameters for all operations */
	parameters?: ParameterObject[];
}

/**
 * Operation object
 */
export interface OperationObject {
	/** Operation tags */
	tags?: string[];
	
	/** Operation summary */
	summary?: string;
	
	/** Operation description */
	description?: string;
	
	/** External documentation */
	externalDocs?: ExternalDocumentationObject;
	
	/** Operation ID */
	operationId?: string;
	
	/** Parameters */
	parameters?: ParameterObject[];
	
	/** Request body */
	requestBody?: RequestBodyObject;
	
	/** Responses */
	responses: ResponsesObject;
	
	/** Callbacks */
	callbacks?: CallbackObject;
	
	/** Deprecated flag */
	deprecated?: boolean;
	
	/** Security requirements */
	security?: SecurityRequirementObject[];
	
	/** Servers */
	servers?: ServerObject[];
}

/**
 * Parameter object
 */
export interface ParameterObject {
	/** Parameter name */
	name: string;
	
	/** Parameter location */
	in: 'query' | 'header' | 'path' | 'cookie';
	
	/** Parameter description */
	description?: string;
	
	/** Required flag */
	required?: boolean;
	
	/** Deprecated flag */
	deprecated?: boolean;
	
	/** Allow empty value */
	allowEmptyValue?: boolean;
	
	/** Style */
	style?: string;
	
	/** Explode flag */
	explode?: boolean;
	
	/** Allow reserved characters */
	allowReserved?: boolean;
	
	/** Schema */
	schema?: SchemaObject;
	
	/** Example */
	example?: unknown;
	
	/** Examples */
	examples?: Record<string, ExampleObject>;
	
	/** Content */
	content?: Record<string, MediaTypeObject>;
}

/**
 * Request body object
 */
export interface RequestBodyObject {
	/** Body description */
	description?: string;
	
	/** Content */
	content: Record<string, MediaTypeObject>;
	
	/** Required flag */
	required?: boolean;
}

/**
 * Media type object
 */
export interface MediaTypeObject {
	/** Schema */
	schema?: SchemaObject;
	
	/** Example */
	example?: unknown;
	
	/** Examples */
	examples?: Record<string, ExampleObject>;
	
	/** Encoding */
	encoding?: Record<string, EncodingObject>;
}

/**
 * Encoding object
 */
export interface EncodingObject {
	/** Content type */
	contentType?: string;
	
	/** Headers */
	headers?: Record<string, HeaderObject>;
	
	/** Style */
	style?: string;
	
	/** Explode flag */
	explode?: boolean;
	
	/** Allow reserved characters */
	allowReserved?: boolean;
}

/**
 * Responses object
 */
export interface ResponsesObject {
	/** Response objects */
	[response_code: string]: ResponseObject | ReferenceObject;
}

/**
 * Response object
 */
export interface ResponseObject {
	/** Response description */
	description: string;
	
	/** Headers */
	headers?: Record<string, HeaderObject>;
	
	/** Content */
	content?: Record<string, MediaTypeObject>;
	
	/** Links */
	links?: Record<string, LinkObject>;
}

/**
 * Header object
 */
export interface HeaderObject {
	/** Header description */
	description?: string;
	
	/** Required flag */
	required?: boolean;
	
	/** Deprecated flag */
	deprecated?: boolean;
	
	/** Allow empty value */
	allowEmptyValue?: boolean;
	
	/** Style */
	style?: string;
	
	/** Explode flag */
	explode?: boolean;
	
	/** Allow reserved characters */
	allowReserved?: boolean;
	
	/** Schema */
	schema?: SchemaObject;
	
	/** Example */
	example?: unknown;
	
	/** Examples */
	examples?: Record<string, ExampleObject>;
}

/**
 * Example object
 */
export interface ExampleObject {
	/** Example summary */
	summary?: string;
	
	/** Example description */
	description?: string;
	
	/** Example value */
	value?: unknown;
	
	/** External value URL */
	externalValue?: string;
}

/**
 * Link object
 */
export interface LinkObject {
	/** Operation reference */
	operationRef?: string;
	
	/** Operation ID */
	operationId?: string;
	
	/** Parameters */
	parameters?: Record<string, unknown>;
	
	/** Request body */
	requestBody?: unknown;
	
	/** Description */
	description?: string;
	
	/** Server */
	server?: ServerObject;
}

/**
 * Callback object
 */
export interface CallbackObject {
	/** Callback path items */
	[path: string]: PathItemObject;
}

/**
 * Components object
 */
export interface ComponentsObject {
	/** Schema components */
	schemas?: Record<string, SchemaObject>;
	
	/** Response components */
	responses?: Record<string, ResponseObject>;
	
	/** Parameter components */
	parameters?: Record<string, ParameterObject>;
	
	/** Example components */
	examples?: Record<string, ExampleObject>;
	
	/** Request body components */
	requestBodies?: Record<string, RequestBodyObject>;
	
	/** Header components */
	headers?: Record<string, HeaderObject>;
	
	/** Security scheme components */
	securitySchemes?: Record<string, SecuritySchemeObject>;
	
	/** Link components */
	links?: Record<string, LinkObject>;
	
	/** Callback components */
	callbacks?: Record<string, CallbackObject>;
}

/**
 * Schema object
 */
export interface SchemaObject {
	/** Schema title */
	title?: string;
	
	/** Multiple of */
	multipleOf?: number;
	
	/** Maximum */
	maximum?: number;
	
	/** Exclusive maximum */
	exclusiveMaximum?: boolean;
	
	/** Minimum */
	minimum?: number;
	
	/** Exclusive minimum */
	exclusiveMinimum?: boolean;
	
	/** Maximum length */
	maxLength?: number;
	
	/** Minimum length */
	minLength?: number;
	
	/** Pattern */
	pattern?: string;
	
	/** Max items */
	maxItems?: number;
	
	/** Min items */
	minItems?: number;
	
	/** Unique items */
	uniqueItems?: boolean;
	
	/** Max properties */
	maxProperties?: number;
	
	/** Min properties */
	minProperties?: number;
	
	/** Required properties */
	required?: string[];
	
	/** Enum values */
	enum?: unknown[];
	
	/** Type */
	type?: string | string[];
	
	/** All of schemas */
	allOf?: (SchemaObject | ReferenceObject)[];
	
	/** Any of schemas */
	anyOf?: (SchemaObject | ReferenceObject)[];
	
	/** One of schemas */
	oneOf?: (SchemaObject | ReferenceObject)[];
	
	/** Not schema */
	not?: SchemaObject | ReferenceObject;
	
	/** Properties */
	properties?: Record<string, SchemaObject | ReferenceObject>;
	
	/** Additional properties */
	additionalProperties?: boolean | SchemaObject | ReferenceObject;
	
	/** Property names */
	propertyNames?: SchemaObject | ReferenceObject;
	
	/** Items */
	items?: SchemaObject | ReferenceObject;
	
	/** Additional items */
	additionalItems?: boolean | SchemaObject | ReferenceObject;
	
	/** Description */
	description?: string;
	
	/** Format */
	format?: string;
	
	/** Default value */
	default?: unknown;
	
	/** Nullable flag */
	nullable?: boolean;
	
	/** Discriminator */
	discriminator?: DiscriminatorObject;
	
	/** Read only flag */
	readOnly?: boolean;
	
	/** Write only flag */
	writeOnly?: boolean;
	
	/** XML representation */
	xml?: XMLObj;
	
	/** External docs */
	externalDocs?: ExternalDocumentationObject;
	
	/** Example */
	example?: unknown;
	
	/** Deprecated flag */
	deprecated?: boolean;
}

/**
 * Discriminator object
 */
export interface DiscriminatorObject {
	/** Property name */
	propertyName: string;
	
	/** Mapping */
	mapping?: Record<string, string>;
}

/**
 * XML object
 */
export interface XMLObj {
	/** Name */
	name?: string;
	
	/** Namespace */
	namespace?: string;
	
	/** Prefix */
	prefix?: string;
	
	/** Attribute flag */
	attribute?: boolean;
	
	/** Wrapped flag */
	wrapped?: boolean;
}

/**
 * Reference object
 */
export interface ReferenceObject {
	/** Reference path */
	$ref: string;
}

/**
 * Security requirement object
 */
export interface SecurityRequirementObject {
	/** Security schemes */
	[scheme_name: string]: string[];
}

/**
 * Security scheme object
 */
export interface SecuritySchemeObject {
	/** Scheme type */
	type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
	
	/** Description */
	description?: string;
	
	/** Name */
	name?: string;
	
	/** Location */
	in?: 'query' | 'header' | 'cookie';
	
	/** Scheme */
	scheme?: string;
	
	/** Bearer format */
	bearerFormat?: string;
	
	/** Flows */
	flows?: OAuthFlowsObject;
	
	/** Open ID Connect URL */
	openIdConnectUrl?: string;
}

/**
 * OAuth flows object
 */
export interface OAuthFlowsObject {
	/** Implicit flow */
	implicit?: OAuthFlowObject;
	
	/** Password flow */
	password?: OAuthFlowObject;
	
	/** Client credentials flow */
	clientCredentials?: OAuthFlowObject;
	
	/** Authorization code flow */
	authorizationCode?: OAuthFlowObject;
}

/**
 * OAuth flow object
 */
export interface OAuthFlowObject {
	/** Authorization URL */
	authorizationUrl?: string;
	
	/** Token URL */
	tokenUrl?: string;
	
	/** Refresh URL */
	refreshUrl?: string;
	
	/** Scopes */
	scopes: Record<string, string>;
}

/**
 * Tag object
 */
export interface TagObject {
	/** Tag name */
	name: string;
	
	/** Tag description */
	description?: string;
	
	/** External docs */
	externalDocs?: ExternalDocumentationObject;
}

/**
 * External documentation object
 */
export interface ExternalDocumentationObject {
	/** Description */
	description?: string;
	
	/** URL */
	url: string;
}

/**
 * Contact object
 */
export interface ContactObject {
	/** Name */
	name?: string;
	
	/** URL */
	url?: string;
	
	/** Email */
	email?: string;
}

/**
 * License object
 */
export interface LicenseObject {
	/** License name */
	name: string;
	
	/** License URL */
	url?: string;
}
```

## 2. OpenAPI Generator Implementation

Create `src/lib/meta/api/openapi-generator.ts`:

```typescript
/**
 * OpenAPI Generator - Automatic OpenAPI Specification Generation
 *
 * This module implements automatic OpenAPI 3.0 specification generation from DocType
 * definitions, including routes, schemas, security, and documentation.
 */

import type { DocType, DocField, FieldType } from '../doctype/types';
import type { OpenAPIDocument, InfoObject, ServerObject, TagObject, ComponentsObject, SecuritySchemeObject } from './openapi-types';
import { FieldTypeMapper } from './field-type-mapper';
import { RouteGenerator } from './route-generator';
import { SchemaGenerator } from './schema-generator';
import { SecurityGenerator } from './security-generator';

// =============================================================================
// OpenAPI Generator Options
// =============================================================================

/**
 * Options for OpenAPI Generator
 */
export interface OpenAPIGeneratorOptions {
	/** API title */
	title?: string;
	
	/** API version */
	version?: string;
	
	/** API description */
	description?: string;
	
	/** Terms of service URL */
	termsOfService?: string;
	
	/** Contact information */
	contact?: {
		name?: string;
		url?: string;
		email?: string;
	};
	
	/** License information */
	license?: {
		name: string;
		url?: string;
	};
	
	/** Server URLs */
	servers?: Array<{
		url: string;
		description?: string;
		variables?: Record<string, {
			default: string;
			enum?: string[];
			description?: string;
		}>;
	}>;
	
	/** Include deprecated fields */
	includeDeprecated?: boolean;
	
	/** Include internal fields */
	includeInternalFields?: boolean;
	
	/** Group endpoints by module */
	groupByModule?: boolean;
	
	/** Default security requirements */
	defaultSecurity?: Record<string, string[]>;
	
	/** Security schemes */
	securitySchemes?: Record<string, SecuritySchemeObject>;
	
	/** Include examples in documentation */
	includeExamples?: boolean;
	
	/** Include OpenAPI extensions */
	includeExtensions?: boolean;
	
	/** Custom tags */
	customTags?: Array<{
		name: string;
		description?: string;
	}>;
}

// =============================================================================
// OpenAPI Generator Class
// =============================================================================

/**
 * OpenAPI Generator class for automatic OpenAPI 3.0 specification generation
 */
export class OpenAPIGenerator {
	private options: Required<OpenAPIGeneratorOptions>;
	private fieldMapper: FieldTypeMapper;
	private routeGenerator: RouteGenerator;
	private schemaGenerator: SchemaGenerator;
	private securityGenerator: SecurityGenerator;
	
	/**
	 * Create a new OpenAPIGenerator instance
	 * @param options Generator options
	 */
	constructor(options: OpenAPIGeneratorOptions = {}) {
		this.options = {
			title: options.title ?? 'SODAF API',
			version: options.version ?? '1.0.0',
			description: options.description ?? 'SODAF Framework REST API',
			termsOfService: options.termsOfService,
			contact: options.contact,
			license: options.license,
			servers: options.servers ?? [
				{
					url: 'http://localhost:5173/api',
					description: 'Development Server'
				}
			],
			includeDeprecated: options.includeDeprecated ?? false,
			includeInternalFields: options.includeInternalFields ?? false,
			groupByModule: options.groupByModule ?? true,
			defaultSecurity: options.defaultSecurity ?? [{ bearerAuth: [] }],
			securitySchemes: options.securitySchemes,
			includeExamples: options.includeExamples ?? true,
			includeExtensions: options.includeExtensions ?? false,
			customTags: options.customTags ?? []
		};
		
		this.fieldMapper = new FieldTypeMapper();
		this.routeGenerator = new RouteGenerator('/api/resource');
		this.schemaGenerator = new SchemaGenerator(this.fieldMapper);
		this.securityGenerator = new SecurityGenerator();
	}
	
	// =========================================================================
	// Main Generation Methods
	// =========================================================================
	
	/**
	 * Generate OpenAPI specification from DocTypes
	 * @param doctypes Array of DocType definitions
	 * @returns OpenAPI 3.0 specification
	 */
	generateSpec(doctypes: DocType[]): OpenAPIDocument {
		const info = this.generateInfo();
		const servers = this.generateServers();
		const paths = this.generatePaths(doctypes);
		const components = this.generateComponents(doctypes);
		const security = this.generateSecurity();
		const tags = this.generateTags(doctypes);
		
		const spec: OpenAPIDocument = {
			openapi: '3.0.0',
			info,
			servers,
			paths,
			components,
			security,
			tags
		};
		
		return spec;
	}
	
	// =========================================================================
	// Component Generation Methods
	// =========================================================================
	
	/**
	 * Generate API information object
	 */
	private generateInfo(): InfoObject {
		const info: InfoObject = {
			title: this.options.title,
			version: this.options.version
		};
		
		if (this.options.description) {
			info.description = this.options.description;
		}
		
		if (this.options.termsOfService) {
			info.termsOfService = this.options.termsOfService;
		}
		
		if (this.options.contact) {
			info.contact = {
				name: this.options.contact.name,
				url: this.options.contact.url,
				email: this.options.contact.email
			};
		}
		
		if (this.options.license) {
			info.license = {
				name: this.options.license.name,
				url: this.options.license.url
			};
		}
		
		return info;
	}
	
	/**
	 * Generate server objects
	 */
	private generateServers(): ServerObject[] {
		return this.options.servers.map(server => ({
			url: server.url,
			description: server.description,
			variables: server.variables
		}));
	}
	
	/**
	 * Generate paths object from DocTypes
	 */
	private generatePaths(doctypes: DocType[]) {
		const paths: Record<string, any> = {};
		
		for (const doctype of doctypes) {
			const doctypePaths = this.routeGenerator.generateDocTypeRoutes(doctype);
			Object.assign(paths, doctypePaths);
		}
		
		return paths;
	}
	
	/**
	 * Generate components object from DocTypes
	 */
	private generateComponents(doctypes: DocType[]): ComponentsObject {
		const components: ComponentsObject = {
			schemas: {},
			responses: {},
			parameters: {},
			examples: {},
			requestBodies: {},
			headers: {},
			securitySchemes: {}
		};
		
		// Generate schemas
		for (const doctype of doctypes) {
			const schema = this.schemaGenerator.generateDocTypeSchema(doctype);
			components.schemas![doctype.name] = schema;
			
			// Generate list response schema
			const listSchema = this.schemaGenerator.generateListResponseSchema(doctype);
			components.schemas![`${doctype.name}List`] = listSchema;
		}
		
		// Generate error schemas
		const errorSchemas = this.schemaGenerator.generateErrorSchemas();
		Object.assign(components.schemas!, errorSchemas);
		
		// Generate security schemes
		if (this.options.securitySchemes) {
			components.securitySchemes = this.options.securitySchemes;
		} else {
			components.securitySchemes = this.securityGenerator.generateSecuritySchemes();
		}
		
		return components;
	}
	
	/**
	 * Generate security requirements
	 */
	private generateSecurity() {
		return this.options.defaultSecurity;
	}
	
	/**
	 * Generate tags from DocTypes
	 */
	private generateTags(doctypes: DocType[]): TagObject[] {
		const tags: TagObject[] = [];
		const moduleNames = new Set<string>();
		
		// Add module tags
		if (this.options.groupByModule) {
			for (const doctype of doctypes) {
				if (!moduleNames.has(doctype.module)) {
					moduleNames.add(doctype.module);
					tags.push({
						name: doctype.module,
						description: `${doctype.module} module APIs`
					});
				}
			}
		}
		
		// Add custom tags
		tags.push(...this.options.customTags);
		
		return tags;
	}
}
```

## 3. Field Type Mapper Implementation

Create `src/lib/meta/api/field-type-mapper.ts`:

```typescript
/**
 * Field Type Mapper - DocField to OpenAPI Schema Mapping
 *
 * This module maps DocField types to OpenAPI schema properties.
 */

import type { DocField, FieldType } from '../doctype/types';
import type { SchemaObject } from './openapi-types';

// =============================================================================
// Field Type Mapping Configuration
// =============================================================================

/**
 * Maps DocField types to OpenAPI schema properties
 */
const FIELD_TYPE_MAPPING: Record<FieldType, Omit<SchemaObject, 'description'>> = {
	'Data': { type: 'string' },
	'Long Text': { type: 'string' },
	'Small Text': { type: 'string' },
	'Text Editor': { type: 'string' },
	'Code': { type: 'string' },
	'Markdown Editor': { type: 'string' },
	'HTML Editor': { type: 'string' },
	'Int': { type: 'integer', format: 'int32' },
	'Float': { type: 'number', format: 'double' },
	'Currency': { type: 'number', format: 'double' },
	'Percent': { type: 'number', minimum: 0, maximum: 100 },
	'Check': { type: 'boolean' },
	'Select': { type: 'string' },
	'Link': { type: 'string' },
	'Dynamic Link': { type: 'string' },
	'Table': { type: 'array', items: { type: 'object' } },
	'Table MultiSelect': { type: 'array', items: { type: 'string' } },
	'Date': { type: 'string', format: 'date' },
	'Datetime': { type: 'string', format: 'date-time' },
	'Time': { type: 'string', format: 'time' },
	'Duration': { type: 'string' },
	'Geolocation': { 
		type: 'object',
		properties: {
			latitude: { type: 'number', format: 'double' },
			longitude: { type: 'number', format: 'double' }
		},
		required: ['latitude', 'longitude']
	},
	'Attach': { type: 'string', format: 'uri' },
	'Attach Image': { type: 'string', format: 'uri' },
	'Signature': { type: 'string', format: 'uri' },
	'Color': { type: 'string', format: 'color' },
	'Rating': { type: 'number', minimum: 0, maximum: 5 },
	'Password': { type: 'string', format: 'password' },
	'Read Only': { type: 'string' },
	'Button': { type: 'string' },
	'Image': { type: 'string', format: 'uri' },
	'HTML': { type: 'string' },
	'Section Break': { type: 'string' },
	'Column Break': { type: 'string' },
	'Tab Break': { type: 'string' },
	'Fold': { type: 'string' }
};

/**
 * Layout field types that should be excluded from schema generation
 */
const LAYOUT_FIELD_TYPES: FieldType[] = [
	'Section Break',
	'Column Break',
	'Tab Break',
	'Fold',
	'Button'
];

// =============================================================================
// Field Type Mapper Class
// =============================================================================

/**
 * Field Type Mapper class for converting DocFields to OpenAPI schemas
 */
export class FieldTypeMapper {
	/**
	 * Map a DocField to an OpenAPI schema
	 * @param field DocField definition
	 * @returns OpenAPI schema object
	 */
	mapFieldToSchema(field: DocField): SchemaObject | null {
		// Skip layout fields
		if (LAYOUT_FIELD_TYPES.includes(field.fieldtype)) {
			return null;
		}
		
		// Get base schema from field type mapping
		const baseSchema = FIELD_TYPE_MAPPING[field.fieldtype];
		if (!baseSchema) {
			return null;
		}
		
		// Create schema with field-specific properties
		const schema: SchemaObject = {
			...baseSchema,
			description: field.description || field.label
		};
		
		// Add field-specific properties
		this.addRequiredProperty(schema, field);
		this.addLengthConstraints(schema, field);
		this.addDefaultValue(schema, field);
		this.addEnumValues(schema, field);
		this.addNumericConstraints(schema, field);
		this.addUniqueConstraint(schema, field);
		
		return schema;
	}
	
	/**
	 * Map Select field options to enum values
	 * @param options Select field options string
	 * @returns Array of option values
	 */
	mapSelectOptions(options: string): string[] {
		return options
			.split('\n')
			.map(opt => opt.trim())
			.filter(Boolean);
	}
	
	/**
	 * Map Table field to child table schema
	 * @param field Table field definition
	 * @param childFields Child table fields
	 * @returns OpenAPI schema for table
	 */
	mapTableField(field: DocField, childFields: DocField[]): SchemaObject {
		const properties: Record<string, SchemaObject> = {};
		
		for (const childField of childFields) {
			const childSchema = this.mapFieldToSchema(childField);
			if (childSchema) {
				properties[childField.fieldname] = childSchema;
			}
		}
		
		return {
			type: 'array',
			items: {
				type: 'object',
				properties,
				required: childFields
					.filter(f => f.required)
					.map(f => f.fieldname)
			}
		};
	}
	
	// ========================================================================
	// Private Helper Methods
	// ========================================================================
	
	/**
	 * Add required property to schema
	 */
	private addRequiredProperty(schema: SchemaObject, field: DocField): void {
		if (field.required) {
			// Note: This is handled at the parent schema level
			// by collecting all required field names
		}
	}
	
	/**
	 * Add length constraints to schema
	 */
	private addLengthConstraints(schema: SchemaObject, field: DocField): void {
		if (field.length && (schema.type === 'string' || Array.isArray(schema.type) && schema.type.includes('string'))) {
			schema.maxLength = field.length;
		}
		
		if (schema.type === 'array') {
			if (field.length) {
				schema.maxItems = field.length;
			}
		}
	}
	
	/**
	 * Add default value to schema
	 */
	private addDefaultValue(schema: SchemaObject, field: DocField): void {
		if (field.default !== undefined) {
			schema.default = field.default;
		}
	}
	
	/**
	 * Add enum values to schema
	 */
	private addEnumValues(schema: SchemaObject, field: DocField): void {
		if (field.fieldtype === 'Select' && field.options) {
			const options = this.mapSelectOptions(field.options);
			if (options.length > 0) {
				schema.enum = options;
			}
		}
	}
	
	/**
	 * Add numeric constraints to schema
	 */
	private addNumericConstraints(schema: SchemaObject, field: DocField): void {
		if (field.precision && (schema.type === 'number' || schema.type === 'integer')) {
			// OpenAPI doesn't have a precision field, but we can add it as an extension
			if (!schema.extensions) {
				schema.extensions = {};
			}
			schema.extensions['x-precision'] = field.precision;
		}
	}
	
	/**
	 * Add unique constraint to schema
	 */
	private addUniqueConstraint(schema: SchemaObject, field: DocField): void {
		if (field.unique) {
			// OpenAPI doesn't have a unique constraint at the schema level
			// This is typically handled at the API level
			if (!schema.extensions) {
				schema.extensions = {};
			}
			schema.extensions['x-unique'] = true;
		}
	}
}
```

## 4. SvelteKit Route Implementation

Create `src/routes/api/openapi.json/+server.ts`:

```typescript
/**
 * OpenAPI Specification Endpoint
 * 
 * This endpoint serves the OpenAPI 3.0 specification for all registered DocTypes.
 */

import { OpenAPIGenerator } from '$lib/meta/api/openapi-generator';
import { DocTypeEngine } from '$lib/meta/doctype/doctype-engine';
import type { OpenAPIDocument } from '$lib/meta/api/openapi-types';
import { error, json } from '@sveltejs/kit';

// Cache for generated specification
let cachedSpec: OpenAPIDocument | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET handler for OpenAPI specification
 */
export async function GET({ url }) {
	try {
		// Check if we have a valid cached specification
		const now = Date.now();
		if (cachedSpec && (now - cacheTimestamp) < CACHE_TTL) {
			return json(cachedSpec, {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'Cache-Control': 'public, max-age=300'
				}
			});
		}
		
		// Get query parameters
		const includeDeprecated = url.searchParams.get('deprecated') === 'true';
		const groupByModule = url.searchParams.get('group') !== 'false';
		
		// Get all DocTypes
		const doctypeEngine = new DocTypeEngine();
		const allDocTypes = doctypeEngine.getAllDocTypes();
		
		// Filter DocTypes if needed
		const filteredDocTypes = includeDeprecated 
			? allDocTypes 
			: allDocTypes.filter(dt => !dt.deprecated);
		
		// Generate OpenAPI specification
		const generator = new OpenAPIGenerator({
			title: 'SODAF API',
			version: '1.0.0',
			description: 'SODAF Framework REST API Documentation',
			servers: [
				{
					url: `${url.origin}/api`,
					description: 'Production Server'
				}
			],
			includeDeprecated,
			groupByModule,
			includeExamples: true
		});
		
		const spec = generator.generateSpec(filteredDocTypes);
		
		// Cache the specification
		cachedSpec = spec;
		cacheTimestamp = now;
		
		return json(spec, {
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Cache-Control': 'public, max-age=300'
			}
		});
	} catch (err) {
		console.error('Error generating OpenAPI specification:', err);
		return error(500, 'Internal Server Error');
	}
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
	return new Response(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
}
```

Create `src/routes/api/docs/+server.ts`:

```typescript
/**
 * Swagger UI Endpoint
 * 
 * This endpoint serves the Swagger UI for API documentation.
 */

import { error } from '@sveltejs/kit';

/**
 * GET handler for Swagger UI
 */
export async function GET() {
	try {
		const swaggerHtml = `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>SODAF API Documentation</title>
				<link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
				<link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
				<style>
					html {
						box-sizing: border-box;
						overflow: -moz-scrollbars-vertical;
						overflow-y: scroll;
					}
					*, *:before, *:after {
						box-sizing: inherit;
					}
					body {
						margin: 0;
						background: #fafafa;
					}
					.swagger-ui .topbar {
						background-color: #1a73e8;
					}
					.swagger-ui .topbar .download-url-wrapper .select-label {
						color: white;
					}
				</style>
			</head>
			<body>
				<div id="swagger-ui"></div>
				<script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
				<script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
				<script>
					window.onload = function() {
						const ui = SwaggerUIBundle({
							url: '/api/openapi.json',
							dom_id: '#swagger-ui',
							deepLinking: true,
							presets: [
								SwaggerUIBundle.presets.apis,
								SwaggerUIStandalonePreset
							],
							plugins: [
								SwaggerUIBundle.plugins.DownloadUrl
							],
							layout: "StandaloneLayout",
							validatorUrl: null,
							tryItOutEnabled: true,
							displayRequestDuration: true,
							docExpansion: "list",
							defaultModelsExpandDepth: 2,
							defaultModelExpandDepth: 2,
							filter: true,
							showExtensions: true,
							showCommonExtensions: true
						});
						
						// Add custom branding
						const topbar = document.querySelector('.swagger-ui .topbar');
						if (topbar) {
							const logo = document.createElement('div');
							logo.innerHTML = '<span style="color: white; font-weight: bold; margin-left: 10px;">SODAF API</span>';
							topbar.appendChild(logo);
						}
					};
				</script>
			</body>
			</html>
		`;
		
		return new Response(swaggerHtml, {
			headers: {
				'Content-Type': 'text/html; charset=utf-8'
			}
		});
	} catch (err) {
		console.error('Error generating Swagger UI:', err);
		return error(500, 'Internal Server Error');
	}
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
	return new Response(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
}
```

## 5. Unit Test Implementation

Create `src/lib/meta/api/__tests__/openapi-generator.test.ts`:

```typescript
/**
 * OpenAPI Generator Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OpenAPIGenerator } from '../openapi-generator';
import type { DocType, DocField } from '../../doctype/types';

describe('OpenAPIGenerator', () => {
	let generator: OpenAPIGenerator;
	let sampleDocType: DocType;
	
	beforeEach(() => {
		generator = new OpenAPIGenerator({
			title: 'Test API',
			version: '1.0.0',
			description: 'Test API Description'
		});
		
		sampleDocType = {
			name: 'User',
			module: 'Core',
			fields: [
				{
					fieldname: 'name',
					label: 'Name',
					fieldtype: 'Data',
					required: true
				},
				{
					fieldname: 'email',
					label: 'Email',
					fieldtype: 'Data',
					required: true,
					unique: true
				},
				{
					fieldname: 'age',
					label: 'Age',
					fieldtype: 'Int',
					required: false
				},
				{
					fieldname: 'status',
					label: 'Status',
					fieldtype: 'Select',
					options: 'Active\nInactive',
					required: true
				}
			],
			permissions: []
		};
	});
	
	describe('generateSpec', () => {
		it('should generate valid OpenAPI 3.0 specification', () => {
			const spec = generator.generateSpec([sampleDocType]);
			
			expect(spec.openapi).toBe('3.0.0');
			expect(spec.info.title).toBe('Test API');
			expect(spec.info.version).toBe('1.0.0');
			expect(spec.paths).toBeDefined();
			expect(spec.components).toBeDefined();
		});
		
		it('should include all CRUD paths for standard DocType', () => {
			const spec = generator.generateSpec([sampleDocType]);
			
			// Check for list path
			expect(spec.paths['/api/resource/User']).toBeDefined();
			expect(spec.paths['/api/resource/User'].get).toBeDefined();
			expect(spec.paths['/api/resource/User'].post).toBeDefined();
			
			// Check for single document paths
			expect(spec.paths['/api/resource/User/{name}']).toBeDefined();
			expect(spec.paths['/api/resource/User/{name}'].get).toBeDefined();
			expect(spec.paths['/api/resource/User/{name}'].put).toBeDefined();
			expect(spec.paths['/api/resource/User/{name}'].delete).toBeDefined();
		});
		
		it('should include submittable paths for submittable DocType', () => {
			const submittableDocType = {
				...sampleDocType,
				name: 'Invoice',
				is_submittable: true
			};
			
			const spec = generator.generateSpec([submittableDocType]);
			
			// Check for submittable paths
			expect(spec.paths['/api/resource/Invoice/{name}/submit']).toBeDefined();
			expect(spec.paths['/api/resource/Invoice/{name}/cancel']).toBeDefined();
			expect(spec.paths['/api/resource/Invoice/{name}/amend']).toBeDefined();
		});
		
		it('should generate schemas for all DocTypes', () => {
			const spec = generator.generateSpec([sampleDocType]);
			
			expect(spec.components?.schemas).toBeDefined();
			expect(spec.components?.schemas?.User).toBeDefined();
			expect(spec.components?.schemas?.UserList).toBeDefined();
		});
		
		it('should group endpoints by module when enabled', () => {
			const generatorWithGrouping = new OpenAPIGenerator({
				title: 'Test API',
				version: '1.0.0',
				groupByModule: true
			});
			
			const spec = generatorWithGrouping.generateSpec([sampleDocType]);
			
			expect(spec.tags).toBeDefined();
			expect(spec.tags?.some(tag => tag.name === 'Core')).toBe(true);
		});
	});
	
	describe('field type mapping', () => {
		it('should correctly map string fields', () => {
			const spec = generator.generateSpec([sampleDocType]);
			const userSchema = spec.components?.schemas?.User;
			
			expect(userSchema?.properties?.name).toEqual({
				type: 'string',
				description: 'Name'
			});
		});
		
		it('should correctly map integer fields', () => {
			const spec = generator.generateSpec([sampleDocType]);
			const userSchema = spec.components?.schemas?.User;
			
			expect(userSchema?.properties?.age).toEqual({
				type: 'integer',
				format: 'int32',
				description: 'Age'
			});
		});
		
		it('should correctly map select fields with enum', () => {
			const spec = generator.generateSpec([sampleDocType]);
			const userSchema = spec.components?.schemas?.User;
			
			expect(userSchema?.properties?.status).toEqual({
				type: 'string',
				enum: ['Active', 'Inactive'],
				description: 'Status'
			});
		});
	});
});
```

## 6. Integration with Existing Components

Update `src/lib/meta/api/index.ts` to include OpenAPI exports:

```typescript
/**
 * API Module Exports
 *
 * This file exports all public types and interfaces from the API module.
 */

// Existing exports...
export type {
    // ... existing exports
} from './types';

export { APIGenerator } from './api-generator';
export type { APIGeneratorOptions, GeneratedRoute } from './api-generator';

// OpenAPI exports
export { OpenAPIGenerator } from './openapi-generator';
export type { OpenAPIGeneratorOptions } from './openapi-generator';
export type {
    OpenAPIDocument,
    InfoObject,
    ServerObject,
    PathsObject,
    PathItemObject,
    OperationObject,
    ParameterObject,
    RequestBodyObject,
    MediaTypeObject,
    ResponsesObject,
    ResponseObject,
    HeaderObject,
    ExampleObject,
    LinkObject,
    CallbackObject,
    ComponentsObject,
    SchemaObject,
    ReferenceObject,
    SecurityRequirementObject,
    SecuritySchemeObject,
    OAuthFlowsObject,
    OAuthFlowObject,
    TagObject,
    ExternalDocumentationObject,
    ContactObject,
    LicenseObject
} from './openapi-types';

export { FieldTypeMapper } from './field-type-mapper';
export { RouteGenerator } from './route-generator';
export { SchemaGenerator } from './schema-generator';
export { SecurityGenerator } from './security-generator';
```

## Conclusion

This implementation guide provides comprehensive code examples for implementing the OpenAPI Generator feature in SODAF. The implementation follows the architecture design and integrates seamlessly with existing components while providing a robust foundation for API documentation generation.

The modular design ensures maintainability and testability, while the comprehensive feature set addresses all requirements from P2-018. The implementation can be extended with additional features as needed while maintaining backward compatibility.