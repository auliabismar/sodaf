/**
 * API Generator - Automatic REST API Endpoint Generation
 *
 * This module implements automatic REST API endpoint generation for DocTypes,
 * including route configuration, validation schemas, and middleware.
 *
 * @module meta/api/api-generator
 */

import type { DocType, DocField, DocPerm, FieldType } from '../doctype/types';
import type { VirtualDocType } from '../doctype/virtual-doctype';
import type {
    RouteConfig,
    RouteType,
    HTTPMethod,
    ValidationSchema,
    FieldValidationRule,
    RequestValidationType,
    RouteMiddleware,
    RoutePermissions
} from './types';
import { generateOpenAPISpecification, generateOpenAPIJSON } from '../openapi';
import { CustomFieldManager } from '../custom';

// =============================================================================
// Types and Interfaces
// =============================================================================

/**
 * Options for API Generator
 */
export interface APIGeneratorOptions {
    /** Base path for API routes (default: '/api/resource') */
    basePath?: string;

    /** Whether to include deprecated fields in validation */
    includeDeprecated?: boolean;

    /** Custom permission checks to inject */
    customPermissionChecks?: string[];

    /** Whether to generate rate limiting config */
    enableRateLimiting?: boolean;
}

/**
 * Extended route info returned by generator
 */
export interface GeneratedRoute extends RouteConfig {
    /** Source DocType name */
    source_doctype: string;

    /** Whether route was auto-generated */
    auto_generated: true;

    /** Generation timestamp */
    generated_at: Date;
}

// =============================================================================
// Field Type to Validation Type Mapping
// =============================================================================

/**
 * Maps DocField types to validation types
 */
const FIELD_TYPE_TO_VALIDATION: Partial<Record<FieldType, RequestValidationType>> = {
    'Data': 'string',
    'Long Text': 'string',
    'Small Text': 'string',
    'Text Editor': 'string',
    'Code': 'string',
    'Markdown Editor': 'string',
    'HTML Editor': 'string',
    'Int': 'integer',
    'Float': 'number',
    'Currency': 'number',
    'Percent': 'number',
    'Check': 'boolean',
    'Select': 'string',
    'Link': 'string',
    'Dynamic Link': 'string',
    'Date': 'date',
    'Datetime': 'date',
    'Time': 'string',
    'Duration': 'string',
    'Attach': 'string',
    'Attach Image': 'string',
    'Color': 'string',
    'Rating': 'number',
    'Password': 'string',
    'Read Only': 'string',
    'Image': 'string',
    'HTML': 'string',
    'Geolocation': 'object',
    'Signature': 'string'
};

/**
 * Layout field types that should be excluded from validation
 */
const LAYOUT_FIELD_TYPES: FieldType[] = [
    'Section Break',
    'Column Break',
    'Tab Break',
    'Fold',
    'Button'
];

// =============================================================================
// API Generator Class
// =============================================================================

/**
 * APIGenerator class for automatic REST API endpoint generation
 *
 * Generates RouteConfig arrays, validation schemas, and middleware
 * based on DocType definitions.
 */
export class APIGenerator {
    private options: Required<APIGeneratorOptions>;
    private customFieldManager: CustomFieldManager;

    /**
     * Create a new APIGenerator instance
     * @param options Generator options
     */
    constructor(options: APIGeneratorOptions = {}) {
        this.options = {
            basePath: options.basePath ?? '/api/resource',
            includeDeprecated: options.includeDeprecated ?? false,
            customPermissionChecks: options.customPermissionChecks ?? [],
            enableRateLimiting: options.enableRateLimiting ?? false
        };
        this.customFieldManager = CustomFieldManager.getInstance();
    }

    // =========================================================================
    // Route Generation
    // =========================================================================

    /**
     * Generate all routes for a DocType
     * @param doctype DocType definition
     * @returns Array of RouteConfig objects
     */
    generateRoutes(doctype: DocType): RouteConfig[] {
        // Virtual DocTypes get custom handler placeholders
        if ((doctype as any).is_virtual) {
            return this.generateVirtualRoutes(doctype as VirtualDocType);
        }

        // Single DocTypes only have GET and PUT
        if (doctype.issingle) {
            return this.generateSingleRoutes(doctype);
        }

        // Standard DocTypes get full CRUD
        const routes = this.generateCRUDRoutes(doctype);

        // Add submittable routes if applicable
        if (doctype.is_submittable) {
            routes.push(...this.generateSubmittableRoutes(doctype));
        }

        return routes;
    }

    /**
     * Generate CRUD routes for standard DocTypes
     */
    private generateCRUDRoutes(doctype: DocType): RouteConfig[] {
        const basePath = this.options.basePath;
        const doctypePath = this.normalizePath(doctype.name);
        const validation = this.generateValidators(doctype);
        const middleware = this.generateMiddleware(doctype);

        const routes: RouteConfig[] = [
            // GET /api/resource/{doctype} - List
            {
                method: 'GET' as HTTPMethod,
                path: `${basePath}/${doctypePath}`,
                type: 'list' as RouteType,
                doctype: doctype.name,
                description: `List all ${doctype.name} documents`,
                permissions: this.extractReadPermissions(doctype),
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            },
            // POST /api/resource/{doctype} - Create
            {
                method: 'POST' as HTTPMethod,
                path: `${basePath}/${doctypePath}`,
                type: 'create' as RouteType,
                doctype: doctype.name,
                description: `Create a new ${doctype.name} document`,
                validation,
                permissions: this.extractCreatePermissions(doctype),
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            },
            // GET /api/resource/{doctype}/{name} - Read
            {
                method: 'GET' as HTTPMethod,
                path: `${basePath}/${doctypePath}/{name}`,
                type: 'read' as RouteType,
                doctype: doctype.name,
                description: `Get a ${doctype.name} document by name`,
                permissions: this.extractReadPermissions(doctype),
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            },
            // PUT /api/resource/{doctype}/{name} - Update
            {
                method: 'PUT' as HTTPMethod,
                path: `${basePath}/${doctypePath}/{name}`,
                type: 'update' as RouteType,
                doctype: doctype.name,
                description: `Update a ${doctype.name} document`,
                validation: { ...validation, partial: true },
                permissions: this.extractWritePermissions(doctype),
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            },
            // DELETE /api/resource/{doctype}/{name} - Delete
            {
                method: 'DELETE' as HTTPMethod,
                path: `${basePath}/${doctypePath}/{name}`,
                type: 'delete' as RouteType,
                doctype: doctype.name,
                description: `Delete a ${doctype.name} document`,
                permissions: this.extractDeletePermissions(doctype),
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            }
        ];

        // Add special endpoints

        // List View endpoint
        if (doctype.fields.some(f => f.in_list_view)) {
            routes.push({
                method: 'GET' as HTTPMethod,
                path: `${basePath}/${doctypePath}/list-view`,
                type: 'custom' as RouteType,
                doctype: doctype.name,
                description: `List view for ${doctype.name}`,
                permissions: this.extractReadPermissions(doctype),
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            });
        }

        // Report endpoint
        if (doctype.permissions.some(p => p.report)) {
            routes.push({
                method: 'GET' as HTTPMethod,
                path: `${basePath}/${doctypePath}/report`,
                type: 'custom' as RouteType,
                doctype: doctype.name,
                description: `Report for ${doctype.name}`,
                permissions: {
                    roles: doctype.permissions.filter(p => p.report).map(p => p.role)
                },
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            });
        }

        // Search endpoint
        if (doctype.fields.some(f => f.in_global_search)) {
            routes.push({
                method: 'GET' as HTTPMethod,
                path: `${basePath}/${doctypePath}/search`,
                type: 'custom' as RouteType,
                doctype: doctype.name,
                description: `Search ${doctype.name}`,
                permissions: this.extractReadPermissions(doctype),
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            });
        }

        // Link/Table field endpoints
        for (const field of doctype.fields) {
            if (['Link', 'Table'].includes(field.fieldtype)) {
                routes.push({
                    method: 'GET' as HTTPMethod,
                    path: `${basePath}/${doctypePath}/{name}/${field.fieldname}`,
                    type: 'custom' as RouteType,
                    doctype: doctype.name,
                    description: `Get ${field.fieldname} for ${doctype.name}`,
                    permissions: this.extractReadPermissions(doctype),
                    middleware,
                    requires_auth: true,
                    tags: [doctype.module, doctype.name]
                });
            }
        }

        return routes;
    }

    /**
     * Generate routes for submittable DocTypes
     */
    private generateSubmittableRoutes(doctype: DocType): RouteConfig[] {
        const basePath = this.options.basePath;
        const doctypePath = this.normalizePath(doctype.name);
        const middleware = this.generateMiddleware(doctype);

        return [
            // POST /api/resource/{doctype}/{name}/submit
            {
                method: 'POST' as HTTPMethod,
                path: `${basePath}/${doctypePath}/{name}/submit`,
                type: 'submit' as RouteType,
                doctype: doctype.name,
                description: `Submit a ${doctype.name} document`,
                permissions: this.extractSubmitPermissions(doctype),
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            },
            // POST /api/resource/{doctype}/{name}/cancel
            {
                method: 'POST' as HTTPMethod,
                path: `${basePath}/${doctypePath}/{name}/cancel`,
                type: 'cancel' as RouteType,
                doctype: doctype.name,
                description: `Cancel a ${doctype.name} document`,
                permissions: this.extractCancelPermissions(doctype),
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            },
            // POST /api/resource/{doctype}/{name}/amend
            {
                method: 'POST' as HTTPMethod,
                path: `${basePath}/${doctypePath}/{name}/amend`,
                type: 'amend' as RouteType,
                doctype: doctype.name,
                description: `Amend a ${doctype.name} document`,
                permissions: this.extractAmendPermissions(doctype),
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            }
        ];
    }

    /**
     * Generate routes for Single DocTypes (only GET and PUT)
     */
    private generateSingleRoutes(doctype: DocType): RouteConfig[] {
        const basePath = this.options.basePath;
        const doctypePath = this.normalizePath(doctype.name);
        const validation = this.generateValidators(doctype);
        const middleware = this.generateMiddleware(doctype);

        return [
            // GET /api/resource/{doctype} - Read single
            {
                method: 'GET' as HTTPMethod,
                path: `${basePath}/${doctypePath}`,
                type: 'read' as RouteType,
                doctype: doctype.name,
                description: `Get the ${doctype.name} settings`,
                permissions: this.extractReadPermissions(doctype),
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            },
            // PUT /api/resource/{doctype} - Update single
            {
                method: 'PUT' as HTTPMethod,
                path: `${basePath}/${doctypePath}`,
                type: 'update' as RouteType,
                doctype: doctype.name,
                description: `Update the ${doctype.name} settings`,
                validation: { ...validation, partial: true },
                permissions: this.extractWritePermissions(doctype),
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            }
        ];
    }

    /**
     * Generate routes for Virtual DocTypes (custom handlers)
     */
    private generateVirtualRoutes(doctype: DocType): RouteConfig[] {
        const basePath = this.options.basePath;
        const doctypePath = this.normalizePath(doctype.name);
        const middleware = this.generateMiddleware(doctype);

        // Virtual DocTypes get placeholder routes with undefined handlers
        return [
            {
                method: 'GET' as HTTPMethod,
                path: `${basePath}/${doctypePath}`,
                type: 'custom' as RouteType,
                doctype: doctype.name,
                description: `Custom list handler for ${doctype.name}`,
                handler: undefined,
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            },
            {
                method: 'GET' as HTTPMethod,
                path: `${basePath}/${doctypePath}/{name}`,
                type: 'custom' as RouteType,
                doctype: doctype.name,
                description: `Custom read handler for ${doctype.name}`,
                handler: undefined,
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            },
            {
                method: 'POST' as HTTPMethod,
                path: `${basePath}/${doctypePath}`,
                type: 'custom' as RouteType,
                doctype: doctype.name,
                description: `Custom create handler for ${doctype.name}`,
                handler: undefined,
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            },
            {
                method: 'PUT' as HTTPMethod,
                path: `${basePath}/${doctypePath}/{name}`,
                type: 'custom' as RouteType,
                doctype: doctype.name,
                description: `Custom update handler for ${doctype.name}`,
                handler: undefined,
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            },
            {
                method: 'DELETE' as HTTPMethod,
                path: `${basePath}/${doctypePath}/{name}`,
                type: 'custom' as RouteType,
                doctype: doctype.name,
                description: `Custom delete handler for ${doctype.name}`,
                handler: undefined,
                middleware,
                requires_auth: true,
                tags: [doctype.module, doctype.name]
            }
        ];
    }

    // =========================================================================
    // Validation Schema Generation
    // =========================================================================

    /**
     * Generate validation schema for a DocType
     * @param doctype DocType definition
     * @returns ValidationSchema object
     */
    generateValidators(doctype: DocType): ValidationSchema {
        const bodyRules: FieldValidationRule[] = [];

        // Process main fields
        for (const field of doctype.fields) {
            const rule = this.mapFieldToValidation(field);
            if (rule) {
                bodyRules.push(rule);
            }
        }

        // Process custom fields if present
        if (doctype.custom_fields) {
            for (const field of doctype.custom_fields) {
                const rule = this.mapFieldToValidation(field);
                if (rule) {
                    bodyRules.push(rule);
                }
            }
        }

        return {
            body: bodyRules,
            strip_unknown: true
        };
    }

    /**
     * Map a DocField to a validation rule
     */
    private mapFieldToValidation(field: DocField): FieldValidationRule | null {
        // Skip layout fields
        if (LAYOUT_FIELD_TYPES.includes(field.fieldtype)) {
            return null;
        }

        // Skip deprecated fields unless configured
        if (field.deprecated && !this.options.includeDeprecated) {
            return null;
        }

        // Skip hidden fields with read_only
        if (field.hidden && field.read_only) {
            return null;
        }

        // Get validation type
        const validationType = FIELD_TYPE_TO_VALIDATION[field.fieldtype];
        if (!validationType) {
            return null;
        }

        const rule: FieldValidationRule = {
            name: field.fieldname,
            type: validationType,
            required: field.required ?? false,
            description: field.description ?? field.label
        };

        // Add default value
        if (field.default !== undefined) {
            rule.default = field.default;
        }

        // Add max length for string fields
        if (validationType === 'string' && field.length) {
            rule.max = field.length;
        }

        // Add precision for number fields
        if ((validationType === 'number' || validationType === 'integer') && field.precision) {
            // We don't have a precision field in FieldValidationRule, so we skip this
        }

        // Add enum options for Select fields
        if (field.fieldtype === 'Select' && field.options) {
            const options = field.options.split('\n').map(opt => opt.trim()).filter(Boolean);
            if (options.length > 0) {
                rule.enum = options;
            }
        }

        return rule;
    }

    // =========================================================================
    // Middleware Generation
    // =========================================================================

    /**
     * Generate middleware array for a DocType
     * @param doctype DocType definition
     * @returns Array of RouteMiddleware objects
     */
    generateMiddleware(doctype: DocType): RouteMiddleware[] {
        const middleware: RouteMiddleware[] = [];

        // Permission middleware is always first
        middleware.push({
            name: 'permission_check',
            config: {
                doctype: doctype.name,
                permissions: this.extractAllPermissions(doctype)
            },
            order: 1
        });

        // Add custom permission checks
        for (const check of this.options.customPermissionChecks) {
            middleware.push({
                name: check,
                config: { doctype: doctype.name },
                order: 2
            });
        }

        // Rate limiting if enabled
        if (this.options.enableRateLimiting) {
            middleware.push({
                name: 'rate_limit',
                config: {
                    max_requests: 100,
                    window_seconds: 60
                },
                order: 0
            });
        }

        // Parent filter for child tables
        if (doctype.istable || doctype.fields.some(f => f.fieldname === 'parent')) {
            middleware.push({
                name: 'parent_filter',
                config: { doctype: doctype.name },
                order: 0
            });
        }

        return middleware.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    // =========================================================================
    // Permission Extraction Helpers
    // =========================================================================

    /**
     * Extract all permissions from DocType
     */
    private extractAllPermissions(doctype: DocType): Record<string, string[]> {
        const permMap: Record<string, string[]> = {
            read: [],
            write: [],
            create: [],
            delete: [],
            submit: [],
            cancel: [],
            amend: []
        };

        for (const perm of doctype.permissions) {
            if (perm.read) permMap.read.push(perm.role);
            if (perm.write) permMap.write.push(perm.role);
            if (perm.create) permMap.create.push(perm.role);
            if (perm.delete) permMap.delete.push(perm.role);
            if (perm.submit) permMap.submit.push(perm.role);
            if (perm.cancel) permMap.cancel.push(perm.role);
            if (perm.amend) permMap.amend.push(perm.role);
        }

        return permMap;
    }

    /**
     * Extract read permissions
     */
    private extractReadPermissions(doctype: DocType): RoutePermissions {
        const roles = doctype.permissions
            .filter((p: DocPerm) => p.read)
            .map((p: DocPerm) => p.role);

        return {
            permission: 'read',
            roles
        };
    }

    /**
     * Extract write permissions
     */
    private extractWritePermissions(doctype: DocType): RoutePermissions {
        const roles = doctype.permissions
            .filter((p: DocPerm) => p.write)
            .map((p: DocPerm) => p.role);

        return {
            permission: 'write',
            roles
        };
    }

    /**
     * Extract create permissions
     */
    private extractCreatePermissions(doctype: DocType): RoutePermissions {
        const roles = doctype.permissions
            .filter((p: DocPerm) => p.create)
            .map((p: DocPerm) => p.role);

        return {
            permission: 'create',
            roles
        };
    }

    /**
     * Extract delete permissions
     */
    private extractDeletePermissions(doctype: DocType): RoutePermissions {
        const roles = doctype.permissions
            .filter((p: DocPerm) => p.delete)
            .map((p: DocPerm) => p.role);

        return {
            permission: 'delete',
            roles
        };
    }

    /**
     * Extract submit permissions
     */
    private extractSubmitPermissions(doctype: DocType): RoutePermissions {
        const roles = doctype.permissions
            .filter((p: DocPerm) => p.submit)
            .map((p: DocPerm) => p.role);

        return {
            permission: 'submit',
            roles
        };
    }

    /**
     * Extract cancel permissions
     */
    private extractCancelPermissions(doctype: DocType): RoutePermissions {
        const roles = doctype.permissions
            .filter((p: DocPerm) => p.cancel)
            .map((p: DocPerm) => p.role);

        return {
            permission: 'cancel',
            roles
        };
    }

    /**
     * Extract amend permissions
     */
    private extractAmendPermissions(doctype: DocType): RoutePermissions {
        const roles = doctype.permissions
            .filter((p: DocPerm) => p.amend)
            .map((p: DocPerm) => p.role);

        return {
            permission: 'amend',
            roles
        };
    }

    // =========================================================================
    // OpenAPI Generation
    // =========================================================================

    /**
     * Generate OpenAPI specification for DocTypes
     * @param doctypes Array of DocType definitions
     * @returns OpenAPI specification as JSON string
     */
    generateOpenAPISpecification(doctypes: (DocType | VirtualDocType)[]): string {
        const options = {
            baseUrl: this.options.basePath,
            version: '1.0.0',
            title: 'SODAF API',
            description: 'SODAF (Frappe framework clone) REST API'
        };

        return generateOpenAPIJSON(doctypes, options);
    }

    /**
     * Generate OpenAPI specification as JSON string
     * @param doctypes Array of DocType definitions
     * @returns OpenAPI specification as JSON string
     */
    generateOpenAPIJSON(doctypes: (DocType | VirtualDocType)[]): string {
        const options = {
            baseUrl: this.options.basePath,
            version: '1.0.0',
            title: 'SODAF API',
            description: 'SODAF (Frappe framework clone) REST API'
        };

        return generateOpenAPIJSON(doctypes, options);
    }

    // =========================================================================
    // Utility Methods
    // =========================================================================

    /**
     * Normalize DocType name for URL path
     * Converts spaces to underscores and lowercases
     */
    private normalizePath(name: string): string {
        return name.toLowerCase().replace(/\s+/g, '_');
    }
}
