/**
 * Security Generator - Authentication Documentation for OpenAPI
 *
 * This module implements generation of OpenAPI security schemes and requirements
 * for authentication and authorization in SODAF APIs.
 *
 * @module meta/openapi/security-generator
 */

import type { DocType, DocPerm } from '../doctype/types';
import type {
	OpenAPISecurityScheme,
	OpenAPISecurityRequirement,
	OpenAPIComponents,
	OpenAPIOperation
} from './types';

// =============================================================================
// Standard Security Schemes
// =============================================================================

/**
 * Standard API Key security scheme
 */
const API_KEY_SCHEME: OpenAPISecurityScheme = {
	type: 'apiKey',
	name: 'Authorization',
	in: 'header',
	description: 'API key authentication using Authorization header',
	bearerFormat: 'JWT'
};

/**
 * Standard Bearer Token security scheme
 */
const BEARER_TOKEN_SCHEME: OpenAPISecurityScheme = {
	type: 'http',
	scheme: 'bearer',
	bearerFormat: 'JWT',
	description: 'JWT Bearer token authentication'
};

/**
 * Basic Authentication scheme
 */
const BASIC_AUTH_SCHEME: OpenAPISecurityScheme = {
	type: 'http',
	scheme: 'basic',
	description: 'Basic HTTP authentication'
};

/**
 * Session Cookie authentication scheme
 */
const SESSION_COOKIE_SCHEME: OpenAPISecurityScheme = {
	type: 'apiKey',
	name: 'sid',
	in: 'cookie',
	description: 'Session-based authentication using session cookie'
};

/**
 * OAuth2 Authorization Code flow
 */
const OAUTH2_SCHEME: OpenAPISecurityScheme = {
	type: 'oauth2',
	description: 'OAuth2 Authorization Code flow',
	flows: {
		authorizationCode: {
			authorizationUrl: '/api/oauth/authorize',
			tokenUrl: '/api/oauth/token',
			scopes: {
				'read': 'Read access to resources',
				'write': 'Write access to resources',
				'admin': 'Administrative access to all resources'
			}
		}
	}
};

// =============================================================================
// Security Generator Class
// =============================================================================

/**
 * SecurityGenerator class for creating OpenAPI security documentation
 */
export class SecurityGenerator {
	private customSchemes: Record<string, OpenAPISecurityScheme> = {};

	/**
	 * Generate security schemes for SODAF
	 * @param includeSchemes Array of scheme names to include
	 * @returns OpenAPI security schemes object
	 */
	generateSecuritySchemes(
		includeSchemes: string[] = ['bearer', 'session']
	): Record<string, OpenAPISecurityScheme> {
		const schemes: Record<string, OpenAPISecurityScheme> = {};

		// Add standard schemes based on inclusion
		if (includeSchemes.includes('apiKey')) {
			schemes.apiKey = API_KEY_SCHEME;
		}

		if (includeSchemes.includes('bearer')) {
			schemes.bearer = BEARER_TOKEN_SCHEME;
		}

		if (includeSchemes.includes('basic')) {
			schemes.basic = BASIC_AUTH_SCHEME;
		}

		if (includeSchemes.includes('session')) {
			schemes.session = SESSION_COOKIE_SCHEME;
		}

		if (includeSchemes.includes('oauth2')) {
			schemes.oauth2 = OAUTH2_SCHEME;
		}

		// Add custom schemes
		Object.assign(schemes, this.customSchemes);

		return schemes;
	}

	/**
	 * Generate default security requirements
	 * @param defaultSchemes Array of default scheme names
	 * @returns OpenAPI security requirements array
	 */
	generateDefaultSecurity(
		defaultSchemes: string[] = ['bearer', 'session']
	): OpenAPISecurityRequirement[] {
		const requirements: OpenAPISecurityRequirement[] = [];

		for (const scheme of defaultSchemes) {
			if (scheme === 'oauth2') {
				requirements.push({ oauth2: ['read'] });
			} else {
				requirements.push({ [scheme]: [] });
			}
		}

		return requirements;
	}

	/**
	 * Generate security requirements for a DocType operation
	 * @param doctype DocType definition
	 * @param operationType Type of operation (read, write, create, etc.)
	 * @param allowedRoles Optional array of allowed roles
	 * @returns OpenAPI security requirements array
	 */
	generateDocTypeSecurity(
		doctype: DocType,
		operationType: 'read' | 'write' | 'create' | 'delete' | 'submit' | 'cancel' | 'amend',
		allowedRoles?: string[]
	): OpenAPISecurityRequirement[] {
		const requirements: OpenAPISecurityRequirement[] = [];

		// Check for explicit OpenAPI security override
		if ('openapi_security' in doctype && Array.isArray((doctype as any).openapi_security)) {
			return (doctype as any).openapi_security;
		}

		// Check if operation is public (no authentication required)
		if (this.isPublicOperation(doctype, operationType)) {
			return []; // No security requirements for public operations
		}

		// Get required permissions for this operation
		const requiredPermissions = this.getRequiredPermissions(doctype, operationType);

		// If no permissions are defined, use default authentication
		if (requiredPermissions.length === 0) {
			return [{ bearer: [] }];
		}

		// Generate requirements based on permissions
		for (const permission of requiredPermissions) {
			if (allowedRoles && allowedRoles.length > 0) {
				// Filter permissions by allowed roles
				if (allowedRoles.includes(permission.role)) {
					requirements.push({
						bearer: [permission.role]
					});
				}
			} else {
				// Use all roles for this permission
				requirements.push({
					bearer: [permission.role]
				});
			}
		}

		// If no requirements were generated, use default
		if (requirements.length === 0) {
			return [{ bearer: [] }];
		}

		return requirements;
	}

	/**
	 * Apply security to an OpenAPI operation
	 * @param operation OpenAPI operation object
	 * @param doctype DocType definition
	 * @param operationType Type of operation
	 * @param allowedRoles Optional array of allowed roles
	 * @returns Modified OpenAPI operation with security
	 */
	applySecurityToOperation(
		operation: OpenAPIOperation,
		doctype: DocType,
		operationType: 'read' | 'write' | 'create' | 'delete' | 'submit' | 'cancel' | 'amend',
		allowedRoles?: string[]
	): OpenAPIOperation {
		const security = this.generateDocTypeSecurity(doctype, operationType, allowedRoles);

		return {
			...operation,
			security
		};
	}

	/**
	 * Generate security components for OpenAPI specification
	 * @param options Security generation options
	 * @returns OpenAPI components with security
	 */
	generateSecurityComponents(options: {
		includeSchemes?: string[];
		defaultSchemes?: string[];
		customSchemes?: Record<string, OpenAPISecurityScheme>;
	}): OpenAPIComponents {
		const {
			includeSchemes = ['bearer', 'session'],
			defaultSchemes = ['bearer', 'session'],
			customSchemes = {}
		} = options;

		// Merge custom schemes
		Object.assign(this.customSchemes, customSchemes);

		const securitySchemes = this.generateSecuritySchemes(includeSchemes);
		const security = this.generateDefaultSecurity(defaultSchemes);

		return {
			securitySchemes,
			// Note: security is not part of components, but of the main spec
		} as OpenAPIComponents;
	}

	/**
	 * Register a custom security scheme
	 * @param name Scheme name
	 * @param scheme OpenAPI security scheme definition
	 */
	registerCustomScheme(name: string, scheme: OpenAPISecurityScheme): void {
		this.customSchemes[name] = scheme;
	}

	/**
	 * Get all registered security schemes
	 * @returns Object with all security schemes
	 */
	getAllSecuritySchemes(): Record<string, OpenAPISecurityScheme> {
		return {
			apiKey: API_KEY_SCHEME,
			bearer: BEARER_TOKEN_SCHEME,
			basic: BASIC_AUTH_SCHEME,
			session: SESSION_COOKIE_SCHEME,
			oauth2: OAUTH2_SCHEME,
			...this.customSchemes
		};
	}

	/**
	 * Check if an operation should be public (no authentication)
	 * @param doctype DocType definition
	 * @param operationType Type of operation
	 * @returns Whether operation is public
	 */
	private isPublicOperation(
		doctype: DocType,
		operationType: 'read' | 'write' | 'create' | 'delete' | 'submit' | 'cancel' | 'amend'
	): boolean {
		// Check if DocType is public
		if (doctype.is_public) {
			return true;
		}

		// Check if any permission for this operation is public
		for (const perm of doctype.permissions) {
			if (perm.role === 'Guest' && this.hasPermissionForOperation(perm, operationType)) {
				return true; // Public if Guest has permission
			}
		}

		return false;
	}

	/**
	 * Get required permissions for an operation
	 * @param doctype DocType definition
	 * @param operationType Type of operation
	 * @returns Array of permission objects
	 */
	private getRequiredPermissions(
		doctype: DocType,
		operationType: 'read' | 'write' | 'create' | 'delete' | 'submit' | 'cancel' | 'amend'
	): DocPerm[] {
		const permissions: DocPerm[] = [];

		for (const perm of doctype.permissions) {
			if (this.hasPermissionForOperation(perm, operationType)) {
				permissions.push(perm);
			}
		}

		return permissions;
	}

	/**
	 * Check if a permission applies to an operation
	 * @param permission DocPerm object
	 * @param operationType Type of operation
	 * @returns Whether permission applies
	 */
	private hasPermissionForOperation(
		permission: DocPerm,
		operationType: 'read' | 'write' | 'create' | 'delete' | 'submit' | 'cancel' | 'amend'
	): boolean {
		switch (operationType) {
			case 'read':
				return permission.read === true;
			case 'write':
				return permission.write === true;
			case 'create':
				return permission.create === true;
			case 'delete':
				return permission.delete === true;
			case 'submit':
				return permission.submit === true;
			case 'cancel':
				return permission.cancel === true;
			case 'amend':
				return permission.amend === true;
			default:
				return false;
		}
	}

	/**
	 * Generate role-based security requirements
	 * @param roles Array of role names
	 * @param schemeName Security scheme name (default: 'bearer')
	 * @returns OpenAPI security requirement
	 */
	generateRoleBasedSecurity(roles: string[], schemeName: string = 'bearer'): OpenAPISecurityRequirement {
		return {
			[schemeName]: roles
		};
	}

	/**
	 * Generate OAuth2 scope-based security requirements
	 * @param scopes Array of OAuth2 scopes
	 * @returns OpenAPI security requirement
	 */
	generateOAuth2Security(scopes: string[]): OpenAPISecurityRequirement {
		return {
			oauth2: scopes
		};
	}

	/**
	 * Generate API key security requirements
	 * @param keyName API key name (default: 'Authorization')
	 * @param keyLocation Location of API key (header, query, cookie)
	 * @returns OpenAPI security requirement
	 */
	generateApiKeySecurity(
		keyName: string = 'Authorization',
		keyLocation: 'header' | 'query' | 'cookie' = 'header'
	): OpenAPISecurityRequirement {
		const schemeName = keyLocation === 'header' ? 'apiKey' : `${keyLocation}Key`;
		return {
			[schemeName]: []
		};
	}

	/**
	 * Generate multi-scheme security requirements (OR logic)
	 * @param schemes Array of security requirement objects
	 * @returns Array of OpenAPI security requirements
	 */
	generateMultiSchemeSecurity(schemes: OpenAPISecurityRequirement[]): OpenAPISecurityRequirement[] {
		return schemes;
	}

	/**
	 * Generate combined security requirements (AND logic)
	 * @param schemes Object with multiple security schemes
	 * @returns OpenAPI security requirement
	 */
	generateCombinedSecurity(schemes: Record<string, string[]>): OpenAPISecurityRequirement {
		return schemes;
	}

	/**
	 * Generate security documentation for API overview
	 * @param options Security documentation options
	 * @returns Security documentation string
	 */
	generateSecurityDocumentation(options: {
		includeSchemes?: string[];
		authEndpoint?: string;
		tokenEndpoint?: string;
		registrationEndpoint?: string;
	}): string {
		const {
			includeSchemes = ['bearer', 'session'],
			authEndpoint = '/api/auth/login',
			tokenEndpoint = '/api/auth/token',
			registrationEndpoint = '/api/auth/register'
		} = options;

		let documentation = '# Authentication\n\n';
		documentation += 'This API uses multiple authentication methods. ';
		documentation += 'Choose the one that best fits your use case.\n\n';

		if (includeSchemes.includes('bearer')) {
			documentation += '## Bearer Token (JWT)\n\n';
			documentation += 'Use a JWT Bearer token for authentication. ';
			documentation += 'Include the token in the Authorization header:\n\n';
			documentation += '```\nAuthorization: Bearer <your-jwt-token>\n```\n\n';
			documentation += `To obtain a token, make a POST request to \`${tokenEndpoint}\`.\n\n`;
		}

		if (includeSchemes.includes('session')) {
			documentation += '## Session Cookie\n\n';
			documentation += 'Use session-based authentication. ';
			documentation += 'Login using the authentication endpoint and the session ';
			documentation += 'cookie will be automatically included in subsequent requests.\n\n';
			documentation += `Login endpoint: \`${authEndpoint}\`\n\n`;
		}

		if (includeSchemes.includes('basic')) {
			documentation += '## Basic Authentication\n\n';
			documentation += 'Use HTTP Basic authentication with your username and password.\n\n';
		}

		if (includeSchemes.includes('oauth2')) {
			documentation += '## OAuth2 Authorization Code Flow\n\n';
			documentation += 'Use OAuth2 for third-party integrations. ';
			documentation += 'Register your application to obtain client credentials.\n\n';
			documentation += `Authorization endpoint: \`${authEndpoint}/oauth/authorize\`\n`;
			documentation += `Token endpoint: \`${tokenEndpoint}/oauth/token\`\n`;
			documentation += `Registration endpoint: \`${registrationEndpoint}\`\n\n`;
		}

		if (includeSchemes.includes('apiKey')) {
			documentation += '## API Key\n\n';
			documentation += 'Use an API key for authentication. ';
			documentation += 'Include the key in the Authorization header:\n\n';
			documentation += '```\nAuthorization: <your-api-key>\n```\n\n';
		}

		return documentation;
	}
}

// =============================================================================
// Default Export
// =============================================================================

export const securityGenerator = new SecurityGenerator();
export default securityGenerator;