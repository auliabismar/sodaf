/**
 * OpenAPI Generator - Main Generator Class
 *
 * This module implements the main OpenAPI generator class that coordinates
 * all other components to generate complete OpenAPI 3.0 specifications.
 *
 * @module meta/openapi/generator
 */

import type { DocType } from '../doctype/types';
import type { VirtualDocType } from '../doctype/virtual-doctype';
import type {
	OpenAPISpec,
	OpenAPIInfo,
	OpenAPIServer,
	OpenAPITag,
	OpenAPIComponents,
	OpenAPISecurityRequirement,
	OpenAPIGeneratorOptions,
	DocTypeOpenAPIConfig
} from './types';
import { fieldMapper } from './field-mapper';
import { schemaGenerator } from './schema-generator';
import { routeGenerator } from './route-generator';
import { securityGenerator } from './security-generator';

// =============================================================================
// OpenAPI Generator Class
// =============================================================================

/**
 * OpenAPIGenerator class for generating complete OpenAPI 3.0 specifications
 */
export class OpenAPIGenerator {
	private options: Required<OpenAPIGeneratorOptions>;

	/**
	 * Create a new OpenAPIGenerator instance
	 * @param options Generator options
	 */
	constructor(options: OpenAPIGeneratorOptions = {}) {
		this.options = {
			baseUrl: options.baseUrl ?? 'http://localhost:5173',
			version: options.version ?? '1.0.0',
			title: options.title ?? 'SODAF API',
			description: options.description ?? 'SODAF (Frappe framework clone) REST API',
			contact: options.contact ?? {
				name: 'SODAF Team',
				email: 'team@sodaf.dev'
			},
			license: options.license ?? {
				name: 'MIT',
				url: 'https://opensource.org/licenses/MIT'
			},
			includeDeprecated: options.includeDeprecated ?? false,
			includeInternal: options.includeInternal ?? false,
			securitySchemes: options.securitySchemes ?? {},
			defaultSecurity: options.defaultSecurity ?? [{ bearer: [] }],
			customTags: options.customTags ?? {},
			includeExamples: options.includeExamples ?? true,
			includeExternalDocs: options.includeExternalDocs ?? true
		};

		// Register custom security schemes
		Object.entries(this.options.securitySchemes).forEach(([name, scheme]) => {
			securityGenerator.registerCustomScheme(name, scheme);
		});
	}

	/**
	 * Generate complete OpenAPI specification for DocTypes
	 * @param doctypes Array of DocType definitions
	 * @param configs Optional DocType OpenAPI configurations by name
	 * @returns Complete OpenAPI 3.0 specification
	 */
	generateSpecification(
		doctypes: (DocType | VirtualDocType)[],
		configs?: Record<string, DocTypeOpenAPIConfig>
	): OpenAPISpec {
		// Filter DocTypes based on options
		const filteredDoctypes = this.filterDoctypes(doctypes);

		// Generate OpenAPI components
		const info = this.generateInfo();
		const servers = this.generateServers();
		const paths = this.generatePaths(filteredDoctypes, configs);
		const components = this.generateComponents();
		const security = this.options.defaultSecurity;
		const tags = this.generateTags(filteredDoctypes, configs);

		const spec: OpenAPISpec = {
			openapi: '3.0.3',
			info,
			servers,
			paths,
			components,
			security,
			tags
		};

		// Add external documentation if enabled
		if (this.options.includeExternalDocs) {
			spec.externalDocs = {
				description: 'SODAF Documentation',
				url: `${this.options.baseUrl}/docs`
			};
		}

		return spec;
	}

	/**
	 * Generate OpenAPI specification for a single DocType
	 * @param doctype DocType definition
	 * @param config Optional DocType OpenAPI configuration
	 * @returns OpenAPI 3.0 specification for single DocType
	 */
	generateDocTypeSpecification(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPISpec {
		// Skip if DocType is excluded
		if (config?.exclude) {
			throw new Error(`DocType ${doctype.name} is excluded from OpenAPI generation`);
		}

		// Generate OpenAPI components
		const info = this.generateInfo();
		const servers = this.generateServers();
		const paths = routeGenerator.generatePaths(doctype, '/api/resource', config);
		const components = this.generateComponents();
		const security = this.options.defaultSecurity;
		const tags = this.generateDocTypeTags(doctype, config);

		const spec: OpenAPISpec = {
			openapi: '3.0.3',
			info,
			servers,
			paths,
			components,
			security,
			tags
		};

		// Add external documentation if enabled
		if (this.options.includeExternalDocs) {
			spec.externalDocs = {
				description: 'SODAF Documentation',
				url: `${this.options.baseUrl}/docs`
			};
		}

		return spec;
	}

	/**
	 * Generate OpenAPI specification as JSON string
	 * @param doctypes Array of DocType definitions
	 * @param configs Optional DocType OpenAPI configurations by name
	 * @returns OpenAPI specification as JSON string
	 */
	generateSpecificationJSON(
		doctypes: (DocType | VirtualDocType)[],
		configs?: Record<string, DocTypeOpenAPIConfig>
	): string {
		const spec = this.generateSpecification(doctypes, configs);
		return JSON.stringify(spec, null, 2);
	}

	/**
	 * Generate OpenAPI specification as YAML string
	 * @param doctypes Array of DocType definitions
	 * @param configs Optional DocType OpenAPI configurations by name
	 * @returns OpenAPI specification as YAML string
	 */
	generateSpecificationYAML(
		doctypes: (DocType | VirtualDocType)[],
		configs?: Record<string, DocTypeOpenAPIConfig>
	): string {
		// This would require a YAML library like js-yaml
		// For now, return JSON as placeholder
		return this.generateSpecificationJSON(doctypes, configs);
	}

	/**
	 * Generate OpenAPI paths for DocTypes
	 * @param doctypes Array of DocType definitions
	 * @param configs Optional DocType OpenAPI configurations by name
	 * @returns OpenAPI paths object
	 */
	generatePaths(
		doctypes: (DocType | VirtualDocType)[],
		configs?: Record<string, DocTypeOpenAPIConfig>
	): Record<string, any> {
		return routeGenerator.generatePathsForDocTypes(doctypes, '/api/resource', configs);
	}

	/**
	 * Generate OpenAPI schemas for DocTypes
	 * @param doctypes Array of DocType definitions
	 * @param configs Optional DocType OpenAPI configurations by name
	 * @returns OpenAPI schemas object
	 */
	generateSchemas(
		doctypes: (DocType | VirtualDocType)[],
		configs?: Record<string, DocTypeOpenAPIConfig>
	): Record<string, any> {
		const schemas: Record<string, any> = {};

		for (const doctype of doctypes) {
			const config = configs?.[doctype.name];
			if (!config?.exclude) {
				schemas[doctype.name] = schemaGenerator.generateDocTypeSchema(doctype, config);
			}
		}

		return schemas;
	}

	/**
	 * Update generator options
	 * @param newOptions New options to merge
	 */
	updateOptions(newOptions: Partial<OpenAPIGeneratorOptions>): void {
		this.options = { ...this.options, ...newOptions } as Required<OpenAPIGeneratorOptions>;

		// Re-register custom security schemes if updated
		if (newOptions.securitySchemes) {
			Object.entries(newOptions.securitySchemes).forEach(([name, scheme]) => {
				securityGenerator.registerCustomScheme(name, scheme);
			});
		}
	}

	/**
	 * Get current generator options
	 * @returns Current options
	 */
	getOptions(): Required<OpenAPIGeneratorOptions> {
		return { ...this.options };
	}

	// =========================================================================
	// Private Helper Methods
	// =========================================================================

	/**
	 * Filter DocTypes based on generator options
	 */
	private filterDoctypes(
		doctypes: (DocType | VirtualDocType)[]
	): (DocType | VirtualDocType)[] {
		return doctypes.filter(doctype => {
			// Skip deprecated DocTypes unless configured to include
			if (doctype.is_deprecated && !this.options.includeDeprecated) {
				return false;
			}

			// Skip internal DocTypes unless configured to include
			if (doctype.is_private && !this.options.includeInternal) {
				return false;
			}

			return true;
		});
	}

	/**
	 * Generate OpenAPI info object
	 */
	private generateInfo(): OpenAPIInfo {
		return {
			title: this.options.title,
			description: this.options.description,
			version: this.options.version,
			contact: this.options.contact,
			license: this.options.license,
			termsOfService: `${this.options.baseUrl}/terms`
		};
	}

	/**
	 * Generate OpenAPI servers array
	 */
	private generateServers(): OpenAPIServer[] {
		return [
			{
				url: this.options.baseUrl,
				description: 'Development server',
				variables: {
					version: {
						default: this.options.version,
						description: 'API version'
					}
				}
			},
			{
				url: this.options.baseUrl.replace('localhost', 'api.sodaf.dev'),
				description: 'Production server',
				variables: {
					version: {
						default: this.options.version,
						description: 'API version'
					}
				}
			}
		];
	}

	/**
	 * Generate OpenAPI components object
	 */
	private generateComponents(): OpenAPIComponents {
		const securityComponents = securityGenerator.generateSecurityComponents({
			includeSchemes: ['bearer', 'session', 'apiKey'],
			defaultSchemes: ['bearer'],
			customSchemes: this.options.securitySchemes
		});

		return {
			...securityComponents,
			// Schemas will be added during path generation
		};
	}

	/**
	 * Generate OpenAPI tags array
	 */
	private generateTags(
		doctypes: (DocType | VirtualDocType)[],
		configs?: Record<string, DocTypeOpenAPIConfig>
	): OpenAPITag[] {
		const tags: OpenAPITag[] = [];
		const tagNames = new Set<string>();

		// Add module-based tags
		for (const doctype of doctypes) {
			const config = configs?.[doctype.name];
			if (config?.exclude) {
				continue;
			}

			// Add module tag if not already added
			if (doctype.module && !tagNames.has(doctype.module)) {
				tags.push({
					name: doctype.module,
					description: `${doctype.module} module APIs`
				});
				tagNames.add(doctype.module);
			}

			// Add custom tags if configured
			if (config?.tags) {
				for (const tagName of config.tags) {
					if (!tagNames.has(tagName)) {
						tags.push({
							name: tagName,
							description: `${tagName} APIs`
						});
						tagNames.add(tagName);
					}
				}
			}
		}

		// Add custom tags from options
		Object.entries(this.options.customTags).forEach(([name, description]) => {
			if (!tagNames.has(name)) {
				tags.push({ name, description });
				tagNames.add(name);
			}
		});

		return tags;
	}

	/**
	 * Generate tags for a single DocType
	 */
	private generateDocTypeTags(
		doctype: DocType | VirtualDocType,
		config?: DocTypeOpenAPIConfig
	): OpenAPITag[] {
		const tags: OpenAPITag[] = [];

		// Add module tag
		if (doctype.module) {
			tags.push({
				name: doctype.module,
				description: `${doctype.module} module APIs`
			});
		}

		// Add custom tags if configured
		if (config?.tags) {
			for (const tagName of config.tags) {
				tags.push({
					name: tagName,
					description: `${tagName} APIs`
				});
			}
		}

		return tags;
	}

	/**
	 * Apply security to all operations in paths
	 */
	private applySecurityToPaths(
		paths: Record<string, any>,
		doctypes: (DocType | VirtualDocType)[],
		configs?: Record<string, DocTypeOpenAPIConfig>
	): Record<string, any> {
		const securedPaths: Record<string, any> = {};

		for (const [path, pathItem] of Object.entries(paths)) {
			const securedPathItem: any = {};

			for (const [method, operation] of Object.entries(pathItem)) {
				// Find the DocType for this operation
				const doctype = this.findDocTypeForPath(path, doctypes);
				if (doctype) {
					const config = configs?.[doctype.name];
					const operationType = this.getOperationTypeFromPath(path, method);
					
					if (operationType) {
						const securedOperation = securityGenerator.applySecurityToOperation(
							operation as any,
							doctype,
							operationType
						);
						securedPathItem[method] = securedOperation;
					} else {
						securedPathItem[method] = operation;
					}
				} else {
					securedPathItem[method] = operation;
				}
			}

			securedPaths[path] = securedPathItem;
		}

		return securedPaths;
	}

	/**
	 * Find DocType for a given path
	 */
	private findDocTypeForPath(
		path: string,
		doctypes: (DocType | VirtualDocType)[]
	): DocType | VirtualDocType | null {
		// Extract DocType name from path
		const pathMatch = path.match(/\/api\/resource\/([^\/]+)/);
		if (pathMatch) {
			const doctypeName = pathMatch[1].replace(/_/g, ' ');
			return doctypes.find(dt => dt.name.toLowerCase() === doctypeName.toLowerCase()) || null;
		}

		return null;
	}

	/**
	 * Get operation type from path and method
	 */
	private getOperationTypeFromPath(
		path: string,
		method: string
	): 'read' | 'write' | 'create' | 'delete' | 'submit' | 'cancel' | 'amend' | null {
		// Check if it's a document operation (has name parameter)
		const isDocumentOperation = path.includes('/{name}');

		switch (method.toLowerCase()) {
			case 'get':
				return isDocumentOperation ? 'read' : 'read'; // Both list and read use read permission
			case 'post':
				return isDocumentOperation ? 'submit' : 'create';
			case 'put':
				return 'write';
			case 'delete':
				return 'delete';
			default:
				return null;
		}
	}
}

// =============================================================================
// Default Export
// =============================================================================

export const openAPIGenerator = new OpenAPIGenerator();
export default openAPIGenerator;