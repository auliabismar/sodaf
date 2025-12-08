/**
 * OpenAPI 3.0 Specification Types
 *
 * This file defines TypeScript interfaces for OpenAPI 3.0 specification
 * structures used in the SODAF OpenAPI Generator.
 *
 * @module meta/openapi/types
 */

// =============================================================================
// Core OpenAPI Types
// =============================================================================

/**
 * OpenAPI Specification Object
 */
export interface OpenAPISpec {
	/** OpenAPI Specification version */
	openapi: string;

	/** API metadata */
	info: OpenAPIInfo;

	/** Array of Server objects */
	servers?: OpenAPIServer[];

	/** Available paths for the API */
	paths: OpenAPIPaths;

	/** Declaration of security schemes */
	components?: OpenAPIComponents;

	/** Declaration of global security */
	security?: OpenAPISecurityRequirement[];

	/** Array of tags used by the specification */
	tags?: OpenAPITag[];

	/** External documentation */
	externalDocs?: OpenAPIExternalDocumentation;
}

/**
 * OpenAPI Info Object
 */
export interface OpenAPIInfo {
	/** Title of the API */
	title: string;

	/** Description of the API */
	description?: string;

	/** Terms of service URL */
	termsOfService?: string;

	/** Contact information */
	contact?: OpenAPIContact;

	/** License information */
	license?: OpenAPILicense;

	/** API version */
	version: string;
}

/**
 * OpenAPI Server Object
 */
export interface OpenAPIServer {
	/** Server URL */
	url: string;

	/** Server description */
	description?: string;

	/** Server variables */
	variables?: Record<string, OpenAPIServerVariable>;
}

/**
 * OpenAPI Server Variable Object
 */
export interface OpenAPIServerVariable {
	/** Default value */
	default: string;

	/** Enumeration of values */
	enum?: string[];

	/** Variable description */
	description?: string;
}

/**
 * OpenAPI Contact Object
 */
export interface OpenAPIContact {
	/** Contact name */
	name?: string;

	/** Contact URL */
	url?: string;

	/** Contact email */
	email?: string;
}

/**
 * OpenAPI License Object
 */
export interface OpenAPILicense {
	/** License name */
	name: string;

	/** License URL */
	url?: string;
}

/**
 * OpenAPI Paths Object
 */
export interface OpenAPIPaths {
	/** Path items mapped by path */
	[path: string]: OpenAPIPathItem;
}

/**
 * OpenAPI Path Item Object
 */
export interface OpenAPIPathItem {
	/** Summary for this path */
	summary?: string;

	/** Description for this path */
	description?: string;

	/** GET operation */
	get?: OpenAPIOperation;

	/** PUT operation */
	put?: OpenAPIOperation;

	/** POST operation */
	post?: OpenAPIOperation;

	/** DELETE operation */
	delete?: OpenAPIOperation;

	/** OPTIONS operation */
	options?: OpenAPIOperation;

	/** HEAD operation */
	head?: OpenAPIOperation;

	/** PATCH operation */
	patch?: OpenAPIOperation;

	/** TRACE operation */
	trace?: OpenAPIOperation;

	/** Array of servers for this path */
	servers?: OpenAPIServer[];

	/** Array of parameters for this path */
	parameters?: OpenAPIParameter[];
}

/**
 * OpenAPI Operation Object
 */
export interface OpenAPIOperation {
	/** List of tags for documentation */
	tags?: string[];

	/** Summary of the operation */
	summary?: string;

	/** Description of the operation */
	description?: string;

	/** External documentation */
	externalDocs?: OpenAPIExternalDocumentation;

	/** Unique string for the operation */
	operationId?: string;

	/** Array of parameters */
	parameters?: OpenAPIParameter[];

	/** Request body */
	requestBody?: OpenAPIRequestBody;

	/** Responses */
	responses: OpenAPIResponses;

	/** Callbacks */
	callbacks?: Record<string, OpenAPICallback>;

	/** Whether operation is deprecated */
	deprecated?: boolean;

	/** Security requirements */
	security?: OpenAPISecurityRequirement[];

	/** Array of servers */
	servers?: OpenAPIServer[];
}

/**
 * OpenAPI Parameter Object
 */
export interface OpenAPIParameter {
	/** Parameter name */
	name: string;

	/** Parameter location */
	in: 'query' | 'header' | 'path' | 'cookie';

	/** Description */
	description?: string;

	/** Whether parameter is required */
	required?: boolean;

	/** Whether parameter is deprecated */
	deprecated?: boolean;

	/** Whether parameter allows empty values */
	allowEmptyValue?: boolean;

	/** Parameter style */
	style?: 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' |
		'pipeDelimited' | 'deepObject';

	/** Whether to explode */
	explode?: boolean;

	/** Whether to allow reserved characters */
	allowReserved?: boolean;

	/** Schema or reference */
	schema?: OpenAPISchema;

	/** Example value */
	example?: any;

	/** Examples */
	examples?: Record<string, OpenAPIExample>;

	/** Parameter content */
	content?: Record<string, OpenAPIMediaType>;
}

/**
 * OpenAPI Request Body Object
 */
export interface OpenAPIRequestBody {
	/** Description */
	description?: string;

	/** Content of the request body */
	content: Record<string, OpenAPIMediaType>;

	/** Whether request body is required */
	required?: boolean;
}

/**
 * OpenAPI Media Type Object
 */
export interface OpenAPIMediaType {
	/** Schema */
	schema?: OpenAPISchema;

	/** Example value */
	example?: any;

	/** Examples */
	examples?: Record<string, OpenAPIExample>;

	/** Encoding */
	encoding?: Record<string, OpenAPIEncoding>;
}

/**
 * OpenAPI Encoding Object
 */
export interface OpenAPIEncoding {
	/** Content type for this specific part */
	contentType?: string;

	/** Headers for this specific part */
	headers?: Record<string, OpenAPIHeader>;

	/** Style for this specific part */
	style?: 'form' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject';

	/** Whether to explode */
	explode?: boolean;

	/** Whether to allow reserved characters */
	allowReserved?: boolean;
}

/**
 * OpenAPI Responses Object
 */
export interface OpenAPIResponses {
	/** Default response */
	default?: OpenAPIResponse;

	/** Responses mapped by status code */
	[statusCode: string]: OpenAPIResponse | undefined;
}

/**
 * OpenAPI Response Object
 */
export interface OpenAPIResponse {
	/** Description */
	description: string;

	/** Headers */
	headers?: Record<string, OpenAPIHeader>;

	/** Content */
	content?: Record<string, OpenAPIMediaType>;

	/** Links */
	links?: Record<string, OpenAPILink>;
}

/**
 * OpenAPI Header Object
 */
export interface OpenAPIHeader {
	/** Description */
	description?: string;

	/** Whether header is required */
	required?: boolean;

	/** Whether header is deprecated */
	deprecated?: boolean;

	/** Whether header allows empty values */
	allowEmptyValue?: boolean;

	/** Header style */
	style?: 'simple' | 'exploded';

	/** Whether to explode */
	explode?: boolean;

	/** Whether to allow reserved characters */
	allowReserved?: boolean;

	/** Schema or reference */
	schema?: OpenAPISchema;

	/** Example value */
	example?: any;

	/** Examples */
	examples?: Record<string, OpenAPIExample>;
}

/**
 * OpenAPI Example Object
 */
export interface OpenAPIExample {
	/** Summary */
	summary?: string;

	/** Description */
	description?: string;

	/** Embedded literal example */
	value?: any;

	/** External URL to example */
	externalValue?: string;
}

/**
 * OpenAPI Link Object
 */
export interface OpenAPILink {
	/** Operation reference */
	operationRef?: string;

	/** Operation ID */
	operationId?: string;

	/** Parameters */
	parameters?: Record<string, any>;

	/** Request body */
	requestBody?: any;

	/** Description */
	description?: string;

	/** Server */
	server?: OpenAPIServer;
}

/**
 * OpenAPI Callback Object
 */
export interface OpenAPICallback {
	/** Path items mapped by expression */
	[expression: string]: OpenAPIPathItem;
}

/**
 * OpenAPI Security Requirement Object
 */
export interface OpenAPISecurityRequirement {
	/** Security schemes mapped to required scopes */
	[schemeName: string]: string[];
}

/**
 * OpenAPI Components Object
 */
export interface OpenAPIComponents {
	/** Reusable schemas */
	schemas?: Record<string, OpenAPISchema>;

	/** Reusable responses */
	responses?: Record<string, OpenAPIResponse>;

	/** Reusable parameters */
	parameters?: Record<string, OpenAPIParameter>;

	/** Reusable examples */
	examples?: Record<string, OpenAPIExample>;

	/** Reusable request bodies */
	requestBodies?: Record<string, OpenAPIRequestBody>;

	/** Reusable headers */
	headers?: Record<string, OpenAPIHeader>;

	/** Reusable security schemes */
	securitySchemes?: Record<string, OpenAPISecurityScheme>;

	/** Reusable links */
	links?: Record<string, OpenAPILink>;

	/** Reusable callbacks */
	callbacks?: Record<string, OpenAPICallback>;
}

/**
 * OpenAPI Schema Object
 */
export interface OpenAPISchema {
	/** Title */
	title?: string;

	/** Multiple of for numbers */
	multipleOf?: number;

	/** Maximum value for numbers */
	maximum?: number;

	/** Exclusive maximum for numbers */
	exclusiveMaximum?: number;

	/** Minimum value for numbers */
	minimum?: number;

	/** Exclusive minimum for numbers */
	exclusiveMinimum?: number;

	/** Maximum length for strings */
	maxLength?: number;

	/** Minimum length for strings */
	minLength?: number;

	/** Pattern for strings */
	pattern?: string;

	/** Maximum items for arrays */
	maxItems?: number;

	/** Minimum items for arrays */
	minItems?: number;

	/** Whether array items must be unique */
	uniqueItems?: boolean;

	/** Maximum properties for objects */
	maxProperties?: number;

	/** Minimum properties for objects */
	minProperties?: number;

	/** Required properties for objects */
	required?: string[];

	/** Array of enums */
	enum?: any[];

	/** Type */
	type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';

	/** Array of types */
	allOf?: OpenAPISchema[];

	/** Array of types */
	anyOf?: OpenAPISchema[];

	/** Array of types */
	oneOf?: OpenAPISchema[];

	/** Schema for not */
	not?: OpenAPISchema;

	/** Schema for items in array */
	items?: OpenAPISchema | OpenAPISchema[];

	/** Properties for objects */
	properties?: Record<string, OpenAPISchema>;

	/** Additional properties */
	additionalProperties?: OpenAPISchema | boolean;

	/** Schema description */
	description?: string;

	/** Default value */
	default?: any;

	/** Whether value is nullable */
	nullable?: boolean;

	/** Discriminator property */
	discriminator?: OpenAPIDiscriminator;

	/** Whether schema is read-only */
	readOnly?: boolean;

	/** Whether schema is write-only */
	writeOnly?: boolean;

	/** Whether schema is deprecated */
	deprecated?: boolean;

	/** XML representation */
	xml?: OpenAPIXML;

	/** External schema reference */
	externalDocs?: OpenAPIExternalDocumentation;

	/** Example value */
	example?: any;

	/** Whether to preserve unknown fields */
	additionalPropertiesAllowed?: boolean;

	/** Format */
	format?: string;

	/** Reference to another schema */
	$ref?: string;
}

/**
 * OpenAPI Discriminator Object
 */
export interface OpenAPIDiscriminator {
	/** Property name */
	propertyName: string;

	/** Mapping */
	mapping?: Record<string, string>;
}

/**
 * OpenAPI XML Object
 */
export interface OpenAPIXML {
	/** Name */
	name?: string;

	/** Namespace */
	namespace?: string;

	/** Prefix */
	prefix?: string;

	/** Whether attribute is wrapped */
	attribute?: boolean;

	/** Whether to wrap content */
	wrapped?: boolean;
}

/**
 * OpenAPI Security Scheme Object
 */
export interface OpenAPISecurityScheme {
	/** Type of security scheme */
	type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';

	/** Description */
	description?: string;

	/** Name of the header or query parameter */
	name?: string;

	/** Location of the API key */
	in?: 'query' | 'header' | 'cookie';

	/** Scheme for HTTP authentication */
	scheme?: string;

	/** Bearer format */
	bearerFormat?: string;

	/** OAuth2 flows */
	flows?: OpenAPIOAuthFlows;

	/** OpenID Connect URL */
	openIdConnectUrl?: string;
}

/**
 * OpenAPI OAuth Flows Object
 */
export interface OpenAPIOAuthFlows {
	/** Implicit OAuth2 flow */
	implicit?: OpenAPIOAuthFlow;

	/** Password OAuth2 flow */
	password?: OpenAPIOAuthFlow;

	/** Client credentials OAuth2 flow */
	clientCredentials?: OpenAPIOAuthFlow;

	/** Authorization code OAuth2 flow */
	authorizationCode?: OpenAPIOAuthFlow;
}

/**
 * OpenAPI OAuth Flow Object
 */
export interface OpenAPIOAuthFlow {
	/** Authorization URL */
	authorizationUrl?: string;

	/** Token URL */
	tokenUrl?: string;

	/** Refresh URL */
	refreshUrl?: string;

	/** Available scopes */
	scopes: Record<string, string>;
}

/**
 * OpenAPI Tag Object
 */
export interface OpenAPITag {
	/** Tag name */
	name: string;

	/** Tag description */
	description?: string;

	/** External documentation */
	externalDocs?: OpenAPIExternalDocumentation;
}

/**
 * OpenAPI External Documentation Object
 */
export interface OpenAPIExternalDocumentation {
	/** Description */
	description?: string;

	/** URL */
	url: string;
}

// =============================================================================
// SODAF-specific OpenAPI Types
// =============================================================================

/**
 * OpenAPI Generator Options
 */
export interface OpenAPIGeneratorOptions {
	/** Base URL for the API */
	baseUrl?: string;

	/** API version */
	version?: string;

	/** API title */
	title?: string;

	/** API description */
	description?: string;

	/** Contact information */
	contact?: OpenAPIContact;

	/** License information */
	license?: OpenAPILicense;

	/** Whether to include deprecated DocTypes */
	includeDeprecated?: boolean;

	/** Whether to include internal DocTypes */
	includeInternal?: boolean;

	/** Custom security schemes */
	securitySchemes?: Record<string, OpenAPISecurityScheme>;

	/** Default security requirements */
	defaultSecurity?: OpenAPISecurityRequirement[];

	/** Custom tags for DocTypes */
	customTags?: Record<string, string>;

	/** Whether to include examples */
	includeExamples?: boolean;

	/** Whether to include external documentation */
	includeExternalDocs?: boolean;
}

/**
 * DocType OpenAPI Configuration
 */
export interface DocTypeOpenAPIConfig {
	/** Whether to exclude from OpenAPI generation */
	exclude?: boolean;

	/** Custom operation IDs */
	operationIds?: {
		list?: string;
		create?: string;
		read?: string;
		update?: string;
		delete?: string;
		submit?: string;
		cancel?: string;
		amend?: string;
	};

	/** Custom descriptions */
	descriptions?: {
		list?: string;
		create?: string;
		read?: string;
		update?: string;
		delete?: string;
		submit?: string;
		cancel?: string;
		amend?: string;
	};

	/** Custom tags */
	tags?: string[];

	/** Whether to mark as deprecated */
	deprecated?: boolean;

	/** External documentation */
	externalDocs?: OpenAPIExternalDocumentation;

	/** Custom security requirements */
	security?: OpenAPISecurityRequirement[];

	/** Custom parameters */
	parameters?: OpenAPIParameter[];

	/** Custom responses */
	responses?: Record<string, OpenAPIResponse>;
}

/**
 * Field OpenAPI Configuration
 */
export interface FieldOpenAPIConfig {
	/** Whether to exclude from OpenAPI schema */
	exclude?: boolean;

	/** Custom schema */
	schema?: OpenAPISchema;

	/** Custom example */
	example?: any;

	/** Custom format */
	format?: string;

	/** Whether to mark as deprecated */
	deprecated?: boolean;
}