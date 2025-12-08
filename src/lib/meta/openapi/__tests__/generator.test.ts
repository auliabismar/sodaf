/**
 * OpenAPI Generator Tests
 * 
 * This file contains unit tests for OpenAPI generator,
 * testing specification generation, options handling, and output formats.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAPIGenerator } from '../generator';
import type {
	OpenAPISpec,
	OpenAPIGeneratorOptions,
	DocTypeOpenAPIConfig
} from '../types';
import type { DocType } from '../../doctype/types';
import type { VirtualDocType } from '../../doctype/virtual-doctype';

describe('OpenAPI Generator', () => {
	let generator: OpenAPIGenerator;
	let mockDocTypes: (DocType | VirtualDocType)[];

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Create generator instance
		generator = new OpenAPIGenerator({
			baseUrl: 'http://localhost:5173',
			version: '1.0.0',
			title: 'Test API',
			description: 'Test API description',
			contact: {
				name: 'Test Team',
				email: 'test@example.com'
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
		});

		// Create mock DocTypes
		mockDocTypes = [
			{
				name: 'User',
				module: 'Core',
				is_single: 0,
				is_deprecated: false,
				is_private: false,
				fields: [
					{
						fieldname: 'name',
						fieldtype: 'Data',
						label: 'Name',
						required: true,
						unique: true,
						options: 'Name'
					},
					{
						fieldname: 'email',
						fieldtype: 'Data',
						label: 'Email',
						required: true,
						unique: true,
						options: 'Email'
					},
					{
						fieldname: 'age',
						fieldtype: 'Int',
						label: 'Age',
						required: false,
						unique: false,
						options: 'Age'
					}
				],
				permissions: [
					{
						role: 'System Manager',
						read: true,
						write: true,
						create: true,
						delete: true,
						submit: false,
						cancel: false,
						amend: false,
						export: true,
						print: true,
						email: true,
						report: true,
						share: true,
						import: true
					}
				],
				indexes: [
					{
						name: 'idx_user_name',
						columns: ['name'],
						unique: true
					}
				],
				unique_constraints: []
			} as DocType,
			{
				name: 'Document',
				module: 'Core',
				is_single: 0,
				is_deprecated: true,
				is_private: false,
				fields: [
					{
						fieldname: 'title',
						fieldtype: 'Data',
						label: 'Title',
						required: true,
						unique: false,
						options: 'Title'
					},
					{
						fieldname: 'content',
						fieldtype: 'Long Text',
						label: 'Content',
						required: true,
						unique: false,
						options: 'Content'
					}
				],
				permissions: [
					{
						role: 'System Manager',
						read: true,
						write: true,
						create: true,
						delete: true,
						submit: false,
						cancel: false,
						amend: false,
						export: true,
						print: true,
						email: true,
						report: true,
						share: true,
						import: true
					}
				],
				indexes: [],
				unique_constraints: []
			} as DocType,
			{
				name: 'InternalLog',
				module: 'System',
				is_single: 0,
				is_deprecated: false,
				is_private: true,
				fields: [
					{
						fieldname: 'message',
						fieldtype: 'Long Text',
						label: 'Message',
						required: true,
						unique: false,
						options: 'Message'
					}
				],
				permissions: [
					{
						role: 'System Manager',
						read: true,
						write: true,
						create: true,
						delete: true,
						submit: false,
						cancel: false,
						amend: false,
						export: true,
						print: true,
						email: true,
						report: true,
						share: true,
						import: true
					}
				],
				indexes: [],
				unique_constraints: []
			} as DocType
		];
	});

	describe('Constructor', () => {
		it('should create generator with default options', () => {
			// Arrange & Act
			const defaultGenerator = new OpenAPIGenerator();

			// Assert
			const options = defaultGenerator.getOptions();
			expect(options.baseUrl).toBe('http://localhost:5173');
			expect(options.version).toBe('1.0.0');
			expect(options.title).toBe('SODAF API');
		});

		it('should create generator with custom options', () => {
			// Arrange & Act
			const customOptions: OpenAPIGeneratorOptions = {
				baseUrl: 'https://api.example.com',
				version: '2.0.0',
				title: 'Custom API'
			};
			const customGenerator = new OpenAPIGenerator(customOptions);

			// Assert
			const options = customGenerator.getOptions();
			expect(options.baseUrl).toBe('https://api.example.com');
			expect(options.version).toBe('2.0.0');
			expect(options.title).toBe('Custom API');
		});
	});

	describe('Specification Generation', () => {
		it('should generate complete OpenAPI specification', () => {
			// Act
			const spec = generator.generateSpecification(mockDocTypes);

			// Assert
			expect(spec.openapi).toBe('3.0.3');
			expect(spec.info.title).toBe('Test API');
			expect(spec.paths).toBeDefined();
			expect(spec.components).toBeDefined();
			expect(spec.tags).toBeDefined();
		});

		it('should filter deprecated DocTypes when configured', () => {
			// Arrange
			const filterGenerator = new OpenAPIGenerator({
				includeDeprecated: false
			});

			// Act
			const spec = filterGenerator.generateSpecification(mockDocTypes);

			// Assert
			// Should include User (not deprecated)
			expect(spec.paths).toHaveProperty('/api/resource/user');
			// Should exclude Document (deprecated)
			expect(spec.paths).not.toHaveProperty('/api/resource/document');
		});

		it('should filter internal DocTypes when configured', () => {
			// Arrange
			const filterGenerator = new OpenAPIGenerator({
				includeInternal: false
			});

			// Act
			const spec = filterGenerator.generateSpecification(mockDocTypes);

			// Assert
			// Should include User (not internal)
			expect(spec.paths).toHaveProperty('/api/resource/user');
			// Should exclude InternalLog (internal)
			expect(spec.paths).not.toHaveProperty('/api/resource/internallog');
		});

		it('should include external documentation when configured', () => {
			// Arrange
			const docsGenerator = new OpenAPIGenerator({
				includeExternalDocs: true,
				baseUrl: 'https://api.example.com'
			});

			// Act
			const spec = docsGenerator.generateSpecification(mockDocTypes);

			// Assert
			expect(spec.externalDocs).toBeDefined();
			expect(spec.externalDocs?.description).toBe('SODAF Documentation');
			expect(spec.externalDocs?.url).toBe('https://api.example.com/docs');
		});
	});

	describe('Single DocType Specification', () => {
		it('should generate specification for single DocType', () => {
			// Arrange
			const userDocType = mockDocTypes[0];

			// Act
			const spec = generator.generateDocTypeSpecification(userDocType);

			// Assert
			expect(spec.openapi).toBe('3.0.3');
			expect(spec.info.title).toBe('Test API');
			expect(spec.paths).toHaveProperty('/api/resource/user');
		});

		it('should throw error for excluded DocType', () => {
			// Arrange
			const userDocType = mockDocTypes[0];
			const config: DocTypeOpenAPIConfig = {
				exclude: true
			};

			// Act & Assert
			expect(() => {
				generator.generateDocTypeSpecification(userDocType, config);
			}).toThrow('DocType User is excluded from OpenAPI generation');
		});
	});

	describe('JSON Output', () => {
		it('should generate specification as JSON', () => {
			// Act
			const json = generator.generateSpecificationJSON(mockDocTypes);

			// Assert
			const parsed = JSON.parse(json);
			expect(parsed.openapi).toBe('3.0.3');
			expect(parsed.info.title).toBe('Test API');
		});

		it('should generate valid JSON structure', () => {
			// Act
			const json = generator.generateSpecificationJSON(mockDocTypes);

			// Assert
			expect(() => JSON.parse(json)).not.toThrow();
		});
	});

	describe('YAML Output', () => {
		it('should generate specification as YAML', () => {
			// Act
			const yaml = generator.generateSpecificationYAML(mockDocTypes);

			// Assert
			// For now, should return JSON as placeholder
			expect(yaml).toContain('"openapi": "3.0.3"');
			expect(yaml).toContain('"title": "Test API"');
		});
	});

	describe('Paths Generation', () => {
		it('should generate paths for all DocTypes', () => {
			// Act
			const paths = generator.generatePaths(mockDocTypes);

			// Assert
			expect(Object.keys(paths)).toContain('/api/resource/user');
			expect(Object.keys(paths)).toContain('/api/resource/document');
		});

		it('should respect DocType configurations', () => {
			// Arrange
			const configs: Record<string, DocTypeOpenAPIConfig> = {
				User: {
					exclude: true
				},
				Document: {
					tags: ['custom-tag']
				}
			};

			// Act
			const paths = generator.generatePaths(mockDocTypes, configs);

			// Assert
			expect(Object.keys(paths)).not.toContain('/api/resource/user');
			expect(Object.keys(paths)).toContain('/api/resource/document');
		});
	});

	describe('Schemas Generation', () => {
		it('should generate schemas for all DocTypes', () => {
			// Act
			const schemas = generator.generateSchemas(mockDocTypes);

			// Assert
			expect(Object.keys(schemas)).toContain('User');
			expect(Object.keys(schemas)).toContain('Document');
			expect(schemas.User).toBeDefined();
			expect(schemas.Document).toBeDefined();
		});

		it('should respect DocType exclusions', () => {
			// Arrange
			const configs: Record<string, DocTypeOpenAPIConfig> = {
				User: {
					exclude: true
				}
			};

			// Act
			const schemas = generator.generateSchemas(mockDocTypes, configs);

			// Assert
			expect(Object.keys(schemas)).not.toContain('User');
			expect(Object.keys(schemas)).toContain('Document');
		});
	});

	describe('Options Management', () => {
		it('should update generator options', () => {
			// Arrange
			const newOptions: Partial<OpenAPIGeneratorOptions> = {
				title: 'Updated API',
				version: '2.0.0'
			};

			// Act
			generator.updateOptions(newOptions);

			// Assert
			const options = generator.getOptions();
			expect(options.title).toBe('Updated API');
			expect(options.version).toBe('2.0.0');
		});

		it('should register custom security schemes', () => {
			// Arrange
			const customOptions: Partial<OpenAPIGeneratorOptions> = {
				securitySchemes: {
					apiKey: {
						type: 'apiKey',
						name: 'X-API-Key',
						in: 'header'
					}
				}
			};

			// Act
			generator.updateOptions(customOptions);

			// Assert
			const options = generator.getOptions();
			expect(options.securitySchemes).toHaveProperty('apiKey');
		});
	});

	describe('Tags Generation', () => {
		it('should generate module-based tags', () => {
			// Act
			const spec = generator.generateSpecification(mockDocTypes);

			// Assert
			expect(spec.tags).toEqual(
				expect.arrayContaining([
					{
						name: 'Core',
						description: 'Core module APIs'
					}
				])
			);
		});

		it('should include custom tags', () => {
			// Arrange
			const customOptions: Partial<OpenAPIGeneratorOptions> = {
				customTags: {
					'custom-tag': 'Custom tag description'
				}
			};
			generator.updateOptions(customOptions);

			// Act
			const spec = generator.generateSpecification(mockDocTypes);

			// Assert
			expect(spec.tags).toEqual(
				expect.arrayContaining([
					{
						name: 'custom-tag',
						description: 'Custom tag description'
					}
				])
			);
		});
	});

	describe('Servers Generation', () => {
		it('should generate default servers', () => {
			// Act
			const spec = generator.generateSpecification(mockDocTypes);

			// Assert
			expect(spec.servers).toHaveLength(2);
			expect(spec.servers?.[0].url).toBe('http://localhost:5173');
			expect(spec.servers?.[0].description).toBe('Development server');
			expect(spec.servers?.[1].url).toBe('http://api.sodaf.dev:5173');
			expect(spec.servers?.[1].description).toBe('Production server');
		});

		it('should include version variables', () => {
			// Act
			const spec = generator.generateSpecification(mockDocTypes);

			// Assert
			expect(spec.servers?.[0].variables).toHaveProperty('version');
			expect(spec.servers?.[0].variables?.version.default).toBe('1.0.0');
		});
	});

	describe('Security Generation', () => {
		it('should include default security', () => {
			// Act
			const spec = generator.generateSpecification(mockDocTypes);

			// Assert
			expect(spec.security).toEqual([{ bearer: [] }]);
		});

		it('should generate security components', () => {
			// Act
			const spec = generator.generateSpecification(mockDocTypes);

			// Assert
			expect(spec.components?.securitySchemes).toBeDefined();
		});
	});

	describe('Error Handling', () => {
		it('should handle missing DocType gracefully', () => {
			// Arrange
			const incompleteDocTypes = [
				{
					name: 'Incomplete',
					module: 'Test',
					fields: [],
					permissions: []
				} as any
			];

			// Act & Assert
			expect(() => {
				generator.generateSpecification(incompleteDocTypes);
			}).not.toThrow();
		});

		it('should handle invalid options gracefully', () => {
			// Arrange & Act & Assert
			expect(() => {
				new OpenAPIGenerator({
					baseUrl: 'invalid-url'
				} as any);
			}).not.toThrow();
		});
	});

	describe('Performance', () => {
		it('should generate specification quickly', () => {
			// Act
			const startTime = Date.now();
			generator.generateSpecification(mockDocTypes);
			const endTime = Date.now();

			// Assert
			expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
		});

		it('should handle large DocType arrays efficiently', () => {
			// Arrange
			const largeDocTypes = Array(100).fill(null).map((_, i) => ({
				name: `DocType${i}`,
				module: 'Test',
				is_single: 0,
				is_deprecated: false,
				is_private: false,
				fields: [
					{
						fieldname: 'field1',
						fieldtype: 'Data',
						label: 'Field 1',
						required: true,
						unique: false,
						options: 'Field 1'
					}
				],
				permissions: [],
				indexes: [],
				unique_constraints: []
			} as DocType));

			// Act
			const startTime = Date.now();
			generator.generateSpecification(largeDocTypes);
			const endTime = Date.now();

			// Assert
			expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
		});
	});
});