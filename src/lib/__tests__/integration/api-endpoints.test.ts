/**
 * API Endpoints Integration Tests
 * 
 * This file contains integration tests for API endpoints generated from DocTypes,
 * testing interaction between API generator, virtual handlers, and middleware.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { APIGenerator } from '../../meta/api/api-generator';
import { DocTypeEngine } from '../../meta/doctype/doctype-engine';
import { MetaFactory } from '../../meta/doctype/meta-factory';
import type { DocType } from '../../meta/doctype/types';

describe('API Endpoints Integration', () => {
	let apiGenerator: APIGenerator;
	let docTypeEngine: DocTypeEngine;
	let metaFactory: MetaFactory;

	beforeEach(() => {
		// Reset DocType engine
		DocTypeEngine.resetInstance();
		docTypeEngine = DocTypeEngine.getInstance();
		metaFactory = new MetaFactory();
		apiGenerator = new APIGenerator();
	});

	afterEach(() => {
		// Clean up test data
		DocTypeEngine.resetInstance();
	});

	describe('CRUD Operations API', () => {
		it('should generate standard CRUD endpoints', async () => {
			// Arrange
			const docType: DocType = {
				name: 'Customer',
				module: 'Sales',
				fields: [
					{
						fieldname: 'name',
						fieldtype: 'Data',
						label: 'Name',
						required: true
					},
					{
						fieldname: 'email',
						fieldtype: 'Data',
						label: 'Email',
						required: true,
						unique: true
					},
					{
						fieldname: 'phone',
						fieldtype: 'Data',
						label: 'Phone',
						required: false
					}
				],
				permissions: [
					{
						role: 'System Manager',
						read: true,
						write: true,
						create: true,
						delete: true
					},
					{
						role: 'Sales User',
						read: true,
						write: true,
						create: true,
						delete: false
					}
				]
			};

			await docTypeEngine.registerDocType(docType);

			// Act
			const routes = apiGenerator.generateRoutes(docType);

			// Assert
			expect(routes).toBeDefined();
			expect(routes.length).toBeGreaterThan(0);
			
			// Check for standard CRUD endpoints
			const listRoute = routes.find(r => r.type === 'list');
			const createRoute = routes.find(r => r.type === 'create');
			const readRoute = routes.find(r => r.type === 'read');
			const updateRoute = routes.find(r => r.type === 'update');
			const deleteRoute = routes.find(r => r.type === 'delete');
			
			expect(listRoute).toBeDefined();
			expect(createRoute).toBeDefined();
			expect(readRoute).toBeDefined();
			expect(updateRoute).toBeDefined();
			expect(deleteRoute).toBeDefined();
		});

		it('should respect field permissions in API', async () => {
			// Arrange
			const docType: DocType = {
				name: 'Employee',
				module: 'HR',
				fields: [
					{
						fieldname: 'name',
						fieldtype: 'Data',
						label: 'Name',
						required: true
					},
					{
						fieldname: 'salary',
						fieldtype: 'Currency',
						label: 'Salary',
						required: true,
						permlevel: 1 // Higher permission level
					},
					{
						fieldname: 'department',
						fieldtype: 'Link',
						label: 'Department',
						required: true,
						options: 'Department'
					}
				],
				permissions: [
					{
						role: 'HR Manager',
						read: true,
						write: true,
						create: true,
						delete: true,
						permlevel: 0
					},
					{
						role: 'Employee',
						read: true,
						write: false,
						create: false,
						delete: false,
						permlevel: 0
					}
				]
			};

			await docTypeEngine.registerDocType(docType);

			// Act
			const routes = apiGenerator.generateRoutes(docType);

			// Assert
			expect(routes).toBeDefined();
			
			// Check that routes include permission level information
			const updateRoute = routes.find(r => r.type === 'update');
			expect(updateRoute).toBeDefined();
			expect(updateRoute?.permissions).toBeDefined();
		});

		it('should handle field validation in API', async () => {
			// Arrange
			const docType: DocType = {
				name: 'Product',
				module: 'Inventory',
				fields: [
					{
						fieldname: 'name',
						fieldtype: 'Data',
						label: 'Name',
						required: true,
						length: 100
					},
					{
						fieldname: 'price',
						fieldtype: 'Currency',
						label: 'Price',
						required: true,
						precision: 2,
						validate: 'price > 0'
					},
					{
						fieldname: 'quantity',
						fieldtype: 'Int',
						label: 'Quantity',
						required: true,
						validate: 'quantity >= 0'
					}
				],
				permissions: [
					{
						role: 'System Manager',
						read: true,
						write: true,
						create: true,
						delete: true
					}
				]
			};

			await docTypeEngine.registerDocType(docType);

			// Act
			const routes = apiGenerator.generateRoutes(docType);

			// Assert
			expect(routes).toBeDefined();
			
			// Check that routes include validation constraints
			const createRoute = routes.find(r => r.type === 'create');
			expect(createRoute).toBeDefined();
			expect(createRoute?.validation).toBeDefined();
		});
	});

	describe('Special Endpoints API', () => {
		it('should generate list view endpoint', async () => {
			// Arrange
			const docType: DocType = {
				name: 'Invoice',
				module: 'Accounts',
				fields: [
					{
						fieldname: 'customer',
						fieldtype: 'Link',
						label: 'Customer',
						required: true,
						options: 'Customer',
						in_list_view: true
					},
					{
						fieldname: 'amount',
						fieldtype: 'Currency',
						label: 'Amount',
						required: true,
						in_list_view: true
					},
					{
						fieldname: 'status',
						fieldtype: 'Select',
						label: 'Status',
						required: true,
						options: 'Draft\nPaid\nOverdue',
						in_list_view: true
					}
				],
				permissions: [
					{
						role: 'Accounts User',
						read: true,
						write: true,
						create: true,
						delete: false
					}
				]
			};

			await docTypeEngine.registerDocType(docType);

			// Act
			const routes = apiGenerator.generateRoutes(docType);

			// Assert
			expect(routes).toBeDefined();
			
			// Check for list view endpoint
			const listViewRoute = routes.find(r => r.path?.includes('list-view'));
			expect(listViewRoute).toBeDefined();
		});

		it('should generate report endpoints', async () => {
			// Arrange
			const docType: DocType = {
				name: 'SalesOrder',
				module: 'Sales',
				fields: [
					{
						fieldname: 'customer',
						fieldtype: 'Link',
						label: 'Customer',
						required: true,
						options: 'Customer'
					},
					{
						fieldname: 'total_amount',
						fieldtype: 'Currency',
						label: 'Total Amount',
						required: true
					},
					{
						fieldname: 'order_date',
						fieldtype: 'Date',
						label: 'Order Date',
						required: true
					}
				],
				permissions: [
					{
						role: 'Sales Manager',
						read: true,
						write: true,
						create: true,
						delete: true,
						report: true
					}
				]
			};

			await docTypeEngine.registerDocType(docType);

			// Act
			const routes = apiGenerator.generateRoutes(docType);

			// Assert
			expect(routes).toBeDefined();
			
			// Check for report endpoints
			const reportRoute = routes.find(r => r.path?.includes('report'));
			expect(reportRoute).toBeDefined();
		});

		it('should generate search endpoints', async () => {
			// Arrange
			const docType: DocType = {
				name: 'Article',
				module: 'Content',
				fields: [
					{
						fieldname: 'title',
						fieldtype: 'Data',
						label: 'Title',
						required: true,
						in_global_search: true
					},
					{
						fieldname: 'content',
						fieldtype: 'Text Editor',
						label: 'Content',
						required: true,
						in_global_search: true
					},
					{
						fieldname: 'tags',
						fieldtype: 'Data',
						label: 'Tags',
						required: false,
						in_global_search: true
					}
				],
				permissions: [
					{
						role: 'Content Manager',
						read: true,
						write: true,
						create: true,
						delete: true
					}
				]
			};

			await docTypeEngine.registerDocType(docType);

			// Act
			const routes = apiGenerator.generateRoutes(docType);

			// Assert
			expect(routes).toBeDefined();
			
			// Check for search endpoints
			const searchRoute = routes.find(r => r.path?.includes('search'));
			expect(searchRoute).toBeDefined();
		});
	});

	describe('Relationship Endpoints API', () => {
		it('should generate Link field endpoints', async () => {
			// Arrange
			const docType: DocType = {
				name: 'Order',
				module: 'Sales',
				fields: [
					{
						fieldname: 'customer',
						fieldtype: 'Link',
						label: 'Customer',
						required: true,
						options: 'Customer'
					},
					{
						fieldname: 'items',
						fieldtype: 'Table',
						label: 'Items',
						required: true,
						child_doctype: 'OrderItem'
					}
				],
				permissions: [
					{
						role: 'Sales User',
						read: true,
						write: true,
						create: true,
						delete: false
					}
				]
			};

			await docTypeEngine.registerDocType(docType);

			// Act
			const routes = apiGenerator.generateRoutes(docType);

			// Assert
			expect(routes).toBeDefined();
			
			// Check for Link field endpoints
			const itemsRoute = routes.find(r => r.path?.includes('items'));
			expect(itemsRoute).toBeDefined();
		});

		it('should handle child table endpoints', async () => {
			// Arrange
			const childDocType: DocType = {
				name: 'OrderItem',
				module: 'Sales',
				fields: [
					{
						fieldname: 'parent',
						fieldtype: 'Link',
						label: 'Order',
						required: true,
						options: 'Order'
					},
					{
						fieldname: 'product',
						fieldtype: 'Link',
						label: 'Product',
						required: true,
						options: 'Product'
					},
					{
						fieldname: 'quantity',
						fieldtype: 'Int',
						label: 'Quantity',
						required: true
					},
					{
						fieldname: 'rate',
						fieldtype: 'Currency',
						label: 'Rate',
						required: true
					}
				],
				permissions: [
					{
						role: 'Sales User',
						read: true,
						write: true,
						create: true,
						delete: false
					}
				]
			};

			await docTypeEngine.registerDocType(childDocType);

			// Act
			const routes = apiGenerator.generateRoutes(childDocType);

			// Assert
			expect(routes).toBeDefined();
			
			// Check for child table endpoints
			const itemRoute = routes.find(r => r.type === 'list');
			expect(itemRoute).toBeDefined();
			
			// Check that routes have parent filtering
			if (itemRoute?.middleware) {
				const parentMiddleware = itemRoute.middleware.find(m => m.name === 'parent_filter');
				expect(parentMiddleware).toBeDefined();
			}
		});
	});

	describe('API Documentation Generation', () => {
		it('should generate complete OpenAPI specification', async () => {
			// Arrange
			const docType: DocType = {
				name: 'User',
				module: 'Core',
				fields: [
					{
						fieldname: 'username',
						fieldtype: 'Data',
						label: 'Username',
						required: true,
						unique: true,
						length: 50
					},
					{
						fieldname: 'email',
						fieldtype: 'Data',
						label: 'Email',
						required: true,
						unique: true,
						length: 100
					},
					{
						fieldname: 'full_name',
						fieldtype: 'Data',
						label: 'Full Name',
						required: true,
						length: 100
					},
					{
						fieldname: 'role',
						fieldtype: 'Select',
						label: 'Role',
						required: true,
						options: 'Admin\nUser\nGuest'
					}
				],
				permissions: [
					{
						role: 'System Manager',
						read: true,
						write: true,
						create: true,
						delete: true
					},
					{
						role: 'User',
						read: true,
						write: false,
						create: false,
						delete: false
					}
				]
			};

			await docTypeEngine.registerDocType(docType);

			// Act
			const openAPISpec = apiGenerator.generateOpenAPISpecification([docType]);

			// Assert
			expect(openAPISpec).toBeDefined();
			expect(typeof openAPISpec).toBe('string');
			
			// Parse the JSON to check structure
			const apiSpec = JSON.parse(openAPISpec);
			expect(apiSpec.openapi).toBe('3.0.0');
			expect(apiSpec.info).toBeDefined();
			expect(apiSpec.paths).toBeDefined();
			expect(apiSpec.components).toBeDefined();
		});

		it('should include authentication requirements', async () => {
			// Arrange
			const docType: DocType = {
				name: 'SecureDocument',
				module: 'Security',
				fields: [
					{
						fieldname: 'title',
						fieldtype: 'Data',
						label: 'Title',
						required: true
					},
					{
						fieldname: 'content',
						fieldtype: 'Text Editor',
						label: 'Content',
						required: true
					}
				],
				permissions: [
					{
						role: 'Admin',
						read: true,
						write: true,
						create: true,
						delete: true
					},
					{
						role: 'User',
						read: true,
						write: true,
						create: false,
						delete: false
					}
				]
			};

			await docTypeEngine.registerDocType(docType);

			// Act
			const openAPISpec = apiGenerator.generateOpenAPISpecification([docType]);

			// Assert
			expect(openAPISpec).toBeDefined();
			
			// Parse the JSON to check structure
			const apiSpec = JSON.parse(openAPISpec);
			expect(apiSpec.components?.securitySchemes).toBeDefined();
			
			// Check that endpoints require authentication
			if (apiSpec.security) {
				expect(apiSpec.security.length).toBeGreaterThan(0);
			}
		});
	});

	describe('API Error Handling', () => {
		it('should generate proper error responses', async () => {
			// Arrange
			const docType: DocType = {
				name: 'ValidatedDoc',
				module: 'Test',
				fields: [
					{
						fieldname: 'name',
						fieldtype: 'Data',
						label: 'Name',
						required: true,
						length: 50
					},
					{
						fieldname: 'email',
						fieldtype: 'Data',
						label: 'Email',
						required: true,
						unique: true,
						length: 100,
						validate: 'email.includes("@")'
					}
				],
				permissions: [
					{
						role: 'System Manager',
						read: true,
						write: true,
						create: true,
						delete: true
					}
				]
			};

			await docTypeEngine.registerDocType(docType);

			// Act
			const routes = apiGenerator.generateRoutes(docType);

			// Assert
			expect(routes).toBeDefined();
			
			// Check that routes include validation
			const createRoute = routes.find(r => r.type === 'create');
			expect(createRoute).toBeDefined();
			expect(createRoute?.validation).toBeDefined();
		});

		it('should handle permission denied responses', async () => {
			// Arrange
			const docType: DocType = {
				name: 'RestrictedDoc',
				module: 'Test',
				fields: [
					{
						fieldname: 'public_field',
						fieldtype: 'Data',
						label: 'Public Field',
						required: true
					},
					{
						fieldname: 'restricted_field',
						fieldtype: 'Data',
						label: 'Restricted Field',
						required: true,
						permlevel: 1
					}
				],
				permissions: [
					{
						role: 'Admin',
						read: true,
						write: true,
						create: true,
						delete: true,
						permlevel: 0
					},
					{
						role: 'User',
						read: true,
						write: true,
						create: true,
						delete: false,
						permlevel: 0
					}
				]
			};

			await docTypeEngine.registerDocType(docType);

			// Act
			const routes = apiGenerator.generateRoutes(docType);

			// Assert
			expect(routes).toBeDefined();
			
			// Check for permission middleware
			const updateRoute = routes.find(r => r.type === 'update');
			expect(updateRoute).toBeDefined();
			expect(updateRoute?.middleware).toBeDefined();
			
			// Check that permission middleware is included
			const permissionMiddleware = updateRoute?.middleware?.find(m => m.name === 'permission_check');
			expect(permissionMiddleware).toBeDefined();
		});
	});
});