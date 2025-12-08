# OpenAPI Generator Architecture Design

## Overview

This document outlines the architecture design for the OpenAPI Generator feature (P2-018) in the SODAF framework. The OpenAPI Generator will automatically generate OpenAPI 3.0 specifications from DocType definitions, enabling automatic API documentation and Swagger UI integration.

## Requirements Analysis

Based on P2-018 from the Phase 2 backlog, the OpenAPI Generator must:

1. Generate valid OpenAPI 3.0 specifications from DocTypes
2. Document all auto-generated API endpoints
3. Generate request/response schemas from DocType fields
4. Include authentication and security documentation
5. Provide error response documentation
6. Group endpoints by module tags
7. Serve the specification via `/api/openapi.json`
8. Provide Swagger UI at `/api/docs`

## Architecture Components

### 1. OpenAPI Specification Types

```typescript
// Core OpenAPI 3.0 structure
interface OpenAPIDocument {
  openapi: string; // "3.0.0"
  info: InfoObject;
  servers?: ServerObject[];
  paths: PathsObject;
  components?: ComponentsObject;
  security?: SecurityRequirementObject[];
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
}

interface InfoObject {
  title: string;
  description?: string;
  version: string;
  termsOfService?: string;
  contact?: ContactObject;
  license?: LicenseObject;
}

interface PathsObject {
  [path: string]: PathItemObject;
}

interface PathItemObject {
  get?: OperationObject;
  put?: OperationObject;
  post?: OperationObject;
  delete?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  patch?: OperationObject;
  trace?: OperationObject;
  parameters?: ParameterObject[];
}

interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: ResponsesObject;
  security?: SecurityRequirementObject[];
  deprecated?: boolean;
}
```

### 2. OpenAPI Generator Class

```typescript
export class OpenAPIGenerator {
  private options: OpenAPIGeneratorOptions;
  private fieldMapper: FieldTypeMapper;
  private routeGenerator: RouteGenerator;
  private schemaGenerator: SchemaGenerator;
  
  constructor(options: OpenAPIGeneratorOptions = {});
  
  // Main generation method
  generateSpec(doctypes: DocType[]): OpenAPIDocument;
  
  // Component generation methods
  private generateInfo(): InfoObject;
  private generatePaths(doctypes: DocType[]): PathsObject;
  private generateComponents(doctypes: DocType[]): ComponentsObject;
  private generateTags(doctypes: DocType[]): TagObject[];
  private generateSecurity(): SecurityRequirementObject[];
  
  // Schema generation methods
  private generateDocTypeSchema(doctype: DocType): SchemaObject;
  private generateFieldSchema(field: DocField): SchemaObject;
  private generateResponseSchema(doctype: DocType, type: 'list' | 'single'): SchemaObject;
  private generateErrorSchemas(): Record<string, SchemaObject>;
  
  // Path generation methods
  private generateDocTypePaths(doctype: DocType): Record<string, PathItemObject>;
  private generateListPath(doctype: DocType): PathItemObject;
  private generateCreatePath(doctype: DocType): PathItemObject;
  private generateReadPath(doctype: DocType): PathItemObject;
  private generateUpdatePath(doctype: DocType): PathItemObject;
  private generateDeletePath(doctype: DocType): PathItemObject;
  private generateSubmittablePaths(doctype: DocType): Record<string, PathItemObject>;
}
```

### 3. Field Type to OpenAPI Schema Mapping

```typescript
export class FieldTypeMapper {
  // Maps DocField types to OpenAPI schema properties
  private static readonly FIELD_TYPE_MAPPING: Record<FieldType, SchemaObject> = {
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
    'Select': { type: 'string', enum: [] },
    'Link': { type: 'string' },
    'Dynamic Link': { type: 'string' },
    'Date': { type: 'string', format: 'date' },
    'Datetime': { type: 'string', format: 'date-time' },
    'Time': { type: 'string', format: 'time' },
    'Duration': { type: 'string' },
    'Attach': { type: 'string', format: 'uri' },
    'Attach Image': { type: 'string', format: 'uri' },
    'Color': { type: 'string', format: 'color' },
    'Rating': { type: 'number', minimum: 0, maximum: 5 },
    'Password': { type: 'string', format: 'password' },
    'Read Only': { type: 'string' },
    'Image': { type: 'string', format: 'uri' },
    'HTML': { type: 'string' },
    'Geolocation': { 
      type: 'object',
      properties: {
        latitude: { type: 'number', format: 'double' },
        longitude: { type: 'number', format: 'double' }
      }
    },
    'Signature': { type: 'string', format: 'uri' }
  };
  
  mapFieldToSchema(field: DocField): SchemaObject;
  mapSelectOptions(options: string): string[];
  mapTableFields(fields: DocField[]): SchemaObject;
}
```

### 4. Route Generation from DocTypes

```typescript
export class RouteGenerator {
  private basePath: string;
  
  constructor(basePath: string = '/api/resource');
  
  generateDocTypeRoutes(doctype: DocType): Record<string, PathItemObject> {
    const routes: Record<string, PathItemObject> = {};
    
    // Standard CRUD routes
    routes[`${this.basePath}/${doctype.name}`] = {
      get: this.generateListOperation(doctype),
      post: this.generateCreateOperation(doctype)
    };
    
    routes[`${this.basePath}/${doctype.name}/{name}`] = {
      get: this.generateReadOperation(doctype),
      put: this.generateUpdateOperation(doctype),
      delete: this.generateDeleteOperation(doctype)
    };
    
    // Submittable routes
    if (doctype.is_submittable) {
      routes[`${this.basePath}/${doctype.name}/{name}/submit`] = {
        post: this.generateSubmitOperation(doctype)
      };
      routes[`${this.basePath}/${doctype.name}/{name}/cancel`] = {
        post: this.generateCancelOperation(doctype)
      };
      routes[`${this.basePath}/${doctype.name}/{name}/amend`] = {
        post: this.generateAmendOperation(doctype)
      };
    }
    
    return routes;
  }
  
  private generateListOperation(doctype: DocType): OperationObject;
  private generateCreateOperation(doctype: DocType): OperationObject;
  private generateReadOperation(doctype: DocType): OperationObject;
  private generateUpdateOperation(doctype: DocType): OperationObject;
  private generateDeleteOperation(doctype: DocType): OperationObject;
  private generateSubmitOperation(doctype: DocType): OperationObject;
  private generateCancelOperation(doctype: DocType): OperationObject;
  private generateAmendOperation(doctype: DocType): OperationObject;
}
```

### 5. Authentication and Security Documentation

```typescript
export class SecurityGenerator {
  generateSecuritySchemes(): SecuritySchemeObject[] {
    return [
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT authentication token'
      },
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API key for programmatic access'
      },
      {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: '/api/oauth/authorize',
            tokenUrl: '/api/oauth/token',
            scopes: {
              'read': 'Read access to resources',
              'write': 'Write access to resources',
              'admin': 'Administrative access'
            }
          }
        }
      }
    ];
  }
  
  generateSecurityRequirements(): SecurityRequirementObject[] {
    return [
      { bearerAuth: [] },
      { apiKeyAuth: [] },
      { oauth2: ['read', 'write'] }
    ];
  }
}
```

### 6. Swagger UI Integration

```typescript
// src/routes/api/docs/+server.ts
export async function GET() {
  const swaggerHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>SODAF API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui.css" />
        <style>
          html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
          *, *:before, *:after { box-sizing: inherit; }
          body { margin:0; background: #fafafa; }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-standalone-preset.js"></script>
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
              validatorUrl: null
            });
          };
        </script>
      </body>
    </html>
  `;
  
  return new Response(swaggerHtml, {
    headers: {
      'Content-Type': 'text/html'
    }
  });
}

// src/routes/api/openapi.json/+server.ts
import { OpenAPIGenerator } from '$lib/meta/api/openapi-generator';
import { DocTypeEngine } from '$lib/meta/doctype';

export async function GET() {
  const doctypeEngine = new DocTypeEngine();
  const allDocTypes = doctypeEngine.getAllDocTypes();
  
  const generator = new OpenAPIGenerator({
    title: 'SODAF API',
    version: '1.0.0',
    description: 'SODAF Framework REST API Documentation',
    servers: [
      { url: 'http://localhost:5173/api', description: 'Development Server' }
    ]
  });
  
  const spec = generator.generateSpec(allDocTypes);
  
  return Response.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
```

## File Structure

```
src/lib/meta/api/
├── openapi-generator.ts          # Main OpenAPI generator class
├── openapi-types.ts              # OpenAPI 3.0 type definitions
├── field-type-mapper.ts          # Field type to schema mapping
├── route-generator.ts            # Route generation from DocTypes
├── security-generator.ts         # Authentication/security documentation
├── schema-generator.ts           # Schema generation utilities
└── __tests__/
    └── openapi-generator.test.ts  # Unit tests

src/routes/api/
├── openapi.json/
│   └── +server.ts               # OpenAPI spec endpoint
└── docs/
    └── +server.ts               # Swagger UI endpoint
```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
1. Create OpenAPI 3.0 type definitions
2. Implement basic OpenAPIGenerator class structure
3. Implement FieldTypeMapper for basic field types
4. Create unit tests for core components

### Phase 2: Schema Generation (Week 2)
1. Implement SchemaGenerator for DocType schemas
2. Add support for complex field types (Table, Link, Select)
3. Implement response schema generation
4. Create error response schemas
5. Add comprehensive unit tests

### Phase 3: Route Generation (Week 3)
1. Implement RouteGenerator for standard CRUD operations
2. Add support for submittable DocType routes
3. Implement parameter and request body documentation
4. Add response documentation
5. Create unit tests

### Phase 4: Security and Authentication (Week 4)
1. Implement SecurityGenerator for authentication schemes
2. Add permission-based security requirements
3. Implement role-based access documentation
4. Add OAuth2 flow documentation
5. Create unit tests

### Phase 5: Integration and UI (Week 5)
1. Implement OpenAPI spec endpoint (/api/openapi.json)
2. Implement Swagger UI endpoint (/api/docs)
3. Add custom branding and styling
4. Implement real-time spec updates
5. Add integration tests

### Phase 6: Advanced Features (Week 6)
1. Add support for custom API endpoints
2. Implement API versioning documentation
3. Add rate limiting documentation
4. Implement webhook documentation
5. Add performance monitoring endpoints

## Integration with Existing Components

### API Generator Integration
The OpenAPI Generator will integrate with the existing API Generator (P2-013) to reuse:

1. Route configuration from `RouteConfig` objects
2. Validation schemas from `ValidationSchema` objects
3. Permission definitions from `RoutePermissions`
4. Middleware configurations from `RouteMiddleware`

### DocType Engine Integration
The OpenAPI Generator will use the DocType Engine to:

1. Retrieve registered DocTypes
2. Access DocType metadata and field definitions
3. Get permission configurations
4. Access custom field definitions

### SvelteKit Integration
The OpenAPI Generator will integrate with SvelteKit routing:

1. Use SvelteKit server routes for spec and UI endpoints
2. Leverage SvelteKit's response handling
3. Integrate with SvelteKit's authentication system
4. Use SvelteKit's error handling

## Testing Strategy

### Unit Tests
- Test each component independently
- Mock external dependencies
- Test edge cases and error conditions
- Achieve >90% code coverage

### Integration Tests
- Test full generation pipeline
- Test with real DocType definitions
- Test API endpoint responses
- Test Swagger UI rendering

### Performance Tests
- Test generation with large DocType sets
- Measure spec generation time
- Test memory usage
- Optimize for production use

## Configuration Options

```typescript
interface OpenAPIGeneratorOptions {
  // Basic info
  title?: string;
  version?: string;
  description?: string;
  termsOfService?: string;
  contact?: ContactObject;
  license?: LicenseObject;
  
  // Server configuration
  servers?: ServerObject[];
  
  // Generation options
  includeDeprecated?: boolean;
  includeInternalFields?: boolean;
  groupByModule?: boolean;
  
  // Security options
  defaultSecurity?: SecurityRequirementObject[];
  securitySchemes?: SecuritySchemeObject[];
  
  // Documentation options
  includeExamples?: boolean;
  includeExtensions?: boolean;
  customTags?: TagObject[];
}
```

## Error Handling

The OpenAPI Generator will handle:

1. Invalid DocType definitions
2. Missing required fields
3. Circular references in DocTypes
4. Invalid field configurations
5. Generation failures with detailed error messages

## Performance Considerations

1. **Caching**: Cache generated specs to avoid regeneration
2. **Lazy Loading**: Generate specs on-demand for large DocType sets
3. **Incremental Updates**: Update only changed DocTypes
4. **Memory Management**: Efficient handling of large specifications
5. **Compression**: Compress JSON responses for network transfer

## Security Considerations

1. **Information Disclosure**: Exclude sensitive fields from documentation
2. **Access Control**: Restrict access to documentation endpoints
3. **Input Validation**: Validate all input parameters
4. **Output Sanitization**: Sanitize all generated content
5. **Rate Limiting**: Apply rate limiting to documentation endpoints

## Future Enhancements

1. **Code Generation**: Generate client SDKs from OpenAPI specs
2. **API Testing**: Integrated API testing tools
3. **Versioning**: Automatic API versioning support
4. **Analytics**: API usage analytics and monitoring
5. **Custom Extensions**: Support for custom OpenAPI extensions

## Conclusion

The OpenAPI Generator architecture provides a comprehensive solution for automatic API documentation generation from DocType definitions. It integrates seamlessly with existing SODAF components while providing flexibility for customization and future enhancements.

The modular design ensures maintainability and testability, while the comprehensive feature set addresses all requirements from P2-018. The implementation plan provides a clear roadmap for development with measurable milestones.