/**
 * OpenAPI Route Generator Tests
 * 
 * This file contains unit tests for OpenAPI route generator,
 * testing route creation, parameter handling, and path generation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RouteGenerator } from '../route-generator';
import type { DocType, DocTypeAction } from '../../doctype/types';
import type { OpenAPIPathItem, OpenAPIOperation } from '../types';

describe('OpenAPI Route Generator', () => {
	let routeGenerator: RouteGenerator;
	let mockDocType: DocType;

	beforeEach(() => {
		routeGenerator = new RouteGenerator();
		
		// Create mock DocType
		mockDocType = {
			name: 'User',
			module: 'Core',
			issingle: false,
			istable: false,
			is_submittable: false,
			is_tree: false,
			is_virtual: false,
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
					name: 'idx_user_email',
					columns: ['email'],
					unique: true
				}
			],
			unique_constraints: []
		} as DocType;
	});

	describe('Route Generation', () => {
		it('should generate CRUD routes', () => {
			// Act
			const routes = routeGenerator.generatePaths(mockDocType);

			// Assert
			expect(routes).toBeDefined();
			expect(typeof routes).toBe('object');
			
			// Check for standard CRUD operations (DocType name is normalized to lowercase)
			expect(routes['/api/resource/user']).toBeDefined(); // GET list
			expect(routes['/api/resource/user/{name}']).toBeDefined(); // GET single
			expect(routes['/api/resource/user']).toBeDefined(); // POST create
			expect(routes['/api/resource/user/{name}']).toBeDefined(); // PUT update
			expect(routes['/api/resource/user/{name}']).toBeDefined(); // DELETE delete
		});

		it('should generate routes with correct HTTP methods', () => {
			// Act
			const routes = routeGenerator.generatePaths(mockDocType);

			// Assert
			const userRoutes = routes['/api/resource/user'];
			const userDocRoutes = routes['/api/resource/user/{name}'];
			
			expect(userRoutes.get).toBeDefined();
			expect(userRoutes.post).toBeDefined();
			expect(userDocRoutes.get).toBeDefined();
			expect(userDocRoutes.put).toBeDefined();
			expect(userDocRoutes.delete).toBeDefined();
		});

		it('should generate routes with proper operation structure', () => {
			// Act
			const routes = routeGenerator.generatePaths(mockDocType);

			// Assert
			const userRoutes = routes['/api/resource/user'];
			const getOperation = userRoutes.get as OpenAPIOperation;
			
			expect(getOperation.operationId).toBe('listUser');
			expect(getOperation.summary).toBe('List User documents');
			expect(getOperation.description).toBe('Retrieve a list of User documents with optional filtering and pagination');
			expect(getOperation.parameters).toBeDefined();
			expect(getOperation.responses).toBeDefined();
		});

		it('should include proper parameters', () => {
			// Act
			const routes = routeGenerator.generatePaths(mockDocType);

			// Assert
			const userRoutes = routes['/api/resource/user'];
			const getListOperation = userRoutes.get as OpenAPIOperation;
			
			expect(getListOperation.parameters).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: 'doctype',
						in: 'path',
						required: true,
						description: 'DocType name'
					})
				])
			);
		});

		it('should include proper responses', () => {
			// Act
			const routes = routeGenerator.generatePaths(mockDocType);

			// Assert
			const userRoutes = routes['/api/resource/user'];
			const getOperation = userRoutes.get as OpenAPIOperation;
			
			expect(getOperation.responses).toBeDefined();
			expect(getOperation.responses['200']).toBeDefined();
			// List operation doesn't have 404, but has 400, 401, 403, 500
			expect(getOperation.responses['400']).toBeDefined();
			expect(getOperation.responses['401']).toBeDefined();
			expect(getOperation.responses['403']).toBeDefined();
			expect(getOperation.responses['500']).toBeDefined();
		});

		it('should handle custom action routes', () => {
			// Arrange
			const docTypeWithActions = {
				...mockDocType,
				actions: [
					{
						action: 'approve',
						label: 'Approve User',
						action_type: 'Server Action' as const
					}
				]
			};

			// Act
			const customRoutes = routeGenerator.generateActionPaths(docTypeWithActions);

			// Assert
			expect(customRoutes).toBeDefined();
			expect(customRoutes['/api/resource/user/{name}/approve']).toBeDefined();
		});

		it('should generate complete OpenAPI paths object', () => {
			// Act
			const routes = routeGenerator.generatePaths(mockDocType);

			// Assert
			expect(typeof routes).toBe('object');
			expect(Object.keys(routes)).toContain('/api/resource/user');
		});
	});

	describe('Parameter Handling', () => {
		it('should generate path parameters', () => {
			// Act
			const routes = routeGenerator.generatePaths(mockDocType);

			// Assert
			const userRoutes = routes['/api/resource/user'];
			const getListOperation = userRoutes.get as OpenAPIOperation;
			
			expect(getListOperation.parameters).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: 'doctype',
						in: 'path',
						required: true,
						description: 'DocType name'
					})
				])
			);
		});

		it('should generate query parameters', () => {
			// Act
			const routes = routeGenerator.generatePaths(mockDocType);

			// Assert
			const userRoutes = routes['/api/resource/user'];
			const getListOperation = userRoutes.get as OpenAPIOperation;
			
			expect(getListOperation.parameters).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: 'fields',
						in: 'query',
						required: false,
						description: 'Fields to return (comma-separated)'
					}),
					expect.objectContaining({
						name: 'limit_start',
						in: 'query',
						required: false,
						description: 'Starting offset for pagination'
					})
				])
			);
		});

		it('should generate request body parameters', () => {
			// Act
			const routes = routeGenerator.generatePaths(mockDocType);

			// Assert
			const userRoutes = routes['/api/resource/user'];
			const createOperation = userRoutes.post as OpenAPIOperation;
			
			expect(createOperation.requestBody).toBeDefined();
			expect(createOperation.requestBody?.content).toBeDefined();
		});
	});

	describe('Response Generation', () => {
		it('should generate success responses', () => {
			// Act
			const routes = routeGenerator.generatePaths(mockDocType);

			// Assert
			const userRoutes = routes['/api/resource/user'];
			const getOperation = userRoutes.get as OpenAPIOperation;
			
			expect(getOperation.responses['200']).toBeDefined();
			expect(getOperation.responses['200']?.description).toBeDefined();
			expect(getOperation.responses['200']?.content).toBeDefined();
		});

		it('should generate error responses', () => {
			// Act
			const routes = routeGenerator.generatePaths(mockDocType);

			// Assert
			const userRoutes = routes['/api/resource/user'];
			const getListOperation = userRoutes.get as OpenAPIOperation;
			const userDocRoutes = routes['/api/resource/user/{name}'];
			const getDocOperation = userDocRoutes.get as OpenAPIOperation;
			
			// List operation has 400, 401, 403, 500
			expect(getListOperation.responses['400']).toBeDefined();
			expect(getListOperation.responses['401']).toBeDefined();
			expect(getListOperation.responses['403']).toBeDefined();
			expect(getListOperation.responses['500']).toBeDefined();
			
			// Document operation has 404
			expect(getDocOperation.responses['404']).toBeDefined();
			expect(getDocOperation.responses['404']?.description).toBeDefined();
		});

		it('should generate validation error responses', () => {
			// Act
			const routes = routeGenerator.generatePaths(mockDocType);

			// Assert
			const userRoutes = routes['/api/resource/user'];
			const createOperation = userRoutes.post as OpenAPIOperation;
			
			expect(createOperation.responses['400']).toBeDefined();
			expect(createOperation.responses['400']?.description).toBeDefined();
		});
	});

	describe('Configuration Options', () => {
		it('should respect configuration options', () => {
			// Act
			const routes = routeGenerator.generatePaths(mockDocType, '/api/resource', {
				tags: ['Custom', 'User'],
				descriptions: {
					list: 'Custom list description',
					create: 'Custom create description',
					read: 'Custom read description',
					update: 'Custom update description',
					delete: 'Custom delete description'
				},
				operationIds: {
					list: 'customListUser',
					create: 'customCreateUser',
					read: 'customGetUser',
					update: 'customUpdateUser',
					delete: 'customDeleteUser'
				}
			});

			// Assert
			const userRoutes = routes['/api/resource/user'];
			const getOperation = userRoutes.get as OpenAPIOperation;
			
			expect(getOperation.responses).toBeDefined();
			expect(getOperation.parameters).toBeDefined();
			expect(getOperation.tags).toEqual(['Custom', 'User']);
		});

		it('should handle excluded DocType', () => {
			// Act
			const routes = routeGenerator.generatePaths(mockDocType, '/api/resource', {
				exclude: true
			});

			// Assert
			expect(Object.keys(routes)).toHaveLength(0);
		});
	});

	describe('Error Handling', () => {
		it('should handle null DocType gracefully', () => {
			// Act & Assert
			expect(() => {
				routeGenerator.generatePaths(null as any);
			}).toThrow();
		});

		it('should handle empty DocType', () => {
			// Act
			const routes = routeGenerator.generatePaths({
				...mockDocType,
				fields: []
			});

			// Assert
			expect(routes).toBeDefined();
			expect(typeof routes).toBe('object');
		});

		it('should handle invalid field types', () => {
			// Act
			const invalidDocType = {
				...mockDocType,
				fields: [
					{
						fieldname: 'invalid',
						fieldtype: 'InvalidType' as any,
						label: 'Invalid Field',
						required: true,
						unique: false,
						options: 'Invalid'
					}
				]
			};

			// Assert
			const routes = routeGenerator.generatePaths(invalidDocType);
			expect(routes).toBeDefined();
		});
	});

	describe('Performance', () => {
		it('should handle large DocTypes efficiently', () => {
			// Arrange
			const largeDocType: DocType = {
				...mockDocType,
				fields: Array.from({ length: 100 }, (_, i) => ({
					fieldname: `field_${i}`,
					fieldtype: 'Data',
					label: `Field ${i}`,
					required: i % 10 === 0,
					unique: false,
					options: `Field ${i}`
				}))
			};

			// Act
			const startTime = Date.now();
			const routes = routeGenerator.generatePaths(largeDocType);
			const endTime = Date.now();

			// Assert
			expect(routes).toBeDefined();
			expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
		});

		it('should handle multiple route generation efficiently', () => {
			// Act
			const startTime = Date.now();
			
			for (let i = 0; i < 10; i++) {
				routeGenerator.generatePaths(mockDocType);
			}
			
			const endTime = Date.now();

			// Assert
			expect(endTime - startTime).toBeLessThan(500); // Should complete 10 generations within 0.5 seconds
		});
	});

	describe('Integration with OpenAPI Generator', () => {
		it('should work with OpenAPI generator integration', () => {
			// Act
			const routes = routeGenerator.generatePaths(mockDocType);
			const multipleRoutes = routeGenerator.generatePathsForDocTypes([mockDocType]);

			// Assert
			expect(routes).toBeDefined();
			expect(typeof routes).toBe('object');
			expect(Object.keys(routes)).toContain('/api/resource/user');
			expect(multipleRoutes).toBeDefined();
			expect(typeof multipleRoutes).toBe('object');
		});
	});
});