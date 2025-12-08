/**
 * Unit tests for OpenAPI Security Generator
 */

import { describe, it, expect } from 'vitest';
import type { DocType } from '../../doctype/types';
import { SecurityGenerator } from '../security-generator';

describe('SecurityGenerator', () => {
    const sampleDocType: DocType = {
        name: 'User',
        module: 'Core',
        fields: [
            {
                fieldname: 'name',
                label: 'Name',
                fieldtype: 'Data',
                required: true
            }
        ],
        permissions: [
            { role: 'System Manager', read: true, write: true, create: true, delete: true },
            { role: 'User', read: true, write: false, create: false, delete: false }
        ]
    };

    describe('generateSecuritySchemes', () => {
        it('should generate security schemes', () => {
            const generator = new SecurityGenerator();
            const options = {
                includeSchemes: ['bearer', 'session', 'apiKey'],
                defaultSchemes: ['bearer'],
                customSchemes: {
                    'CustomAuth': {
                        type: 'apiKey' as const,
                        in: 'header' as const,
                        name: 'X-Custom-Auth'
                    }
                }
            };

            const components = generator.generateSecurityComponents(options);
            const schemes = components.securitySchemes;

            expect(schemes).toHaveProperty('bearer');
            expect(schemes).toHaveProperty('session');
            expect(schemes).toHaveProperty('apiKey');
            expect(schemes).toHaveProperty('CustomAuth');
        });

        it('should include only specified schemes', () => {
            const generator = new SecurityGenerator();
            const includeSchemes = ['bearer'];

            const schemes = generator.generateSecuritySchemes(includeSchemes);

            expect(schemes).toHaveProperty('bearer');
            expect(schemes).not.toHaveProperty('session');
            expect(schemes).not.toHaveProperty('apiKey');
        });
    });

    describe('generateDefaultSecurity', () => {
        it('should generate default security requirements', () => {
            const generator = new SecurityGenerator();
            const requirements = generator.generateDefaultSecurity();

            expect(requirements).toBeDefined();
            expect(requirements.length).toBeGreaterThan(0);
            expect(requirements[0]).toHaveProperty('bearer');
        });

        it('should include specified default schemes', () => {
            const generator = new SecurityGenerator();
            const defaultSchemes = ['bearer', 'session'];

            const requirements = generator.generateDefaultSecurity(defaultSchemes);

            expect(requirements.length).toBe(2);
            expect(requirements[0]).toHaveProperty('bearer');
            expect(requirements[1]).toHaveProperty('session');
        });
    });

    describe('applySecurityToOperation', () => {
        it('should apply security to operation', () => {
            const generator = new SecurityGenerator();
            const operation = {
                summary: 'Test operation',
                description: 'Test operation description',
                responses: {
                    '200': { description: 'Success' }
                }
            };

            const securedOperation = generator.applySecurityToOperation(
                operation as any,
                sampleDocType,
                'read'
            );

            expect(securedOperation.security).toBeDefined();
            expect(securedOperation.security!.length).toBeGreaterThan(0);
            expect(securedOperation.security![0]).toHaveProperty('bearer');
        });

        it('should not apply security for public operations', () => {
            const generator = new SecurityGenerator();
            const operation = {
                summary: 'Public operation',
                description: 'Public operation description',
                responses: {
                    '200': { description: 'Success' }
                }
            };

            const publicDocType: DocType = {
                ...sampleDocType,
                name: 'PublicDoc',
                is_public: true
            };

            const securedOperation = generator.applySecurityToOperation(
                operation as any,
                publicDocType,
                'read'
            );

            expect(securedOperation.security).toEqual([]);
        });

        it('should add role-based security', () => {
            const generator = new SecurityGenerator();
            const operation = {
                summary: 'Role-based operation',
                description: 'Role-based operation description',
                responses: {
                    '200': { description: 'Success' }
                }
            };

            const securedOperation = generator.applySecurityToOperation(
                operation as any,
                sampleDocType,
                'read',
                ['System Manager']
            );

            expect(securedOperation.security).toBeDefined();
            expect(securedOperation.security!.length).toBeGreaterThan(0);

            const security = securedOperation.security![0];
            expect(security).toHaveProperty('bearer');
            expect(Array.isArray(security.bearer)).toBe(true);
            expect(security.bearer.length).toBeGreaterThan(0);
            expect(security.bearer).toContain('System Manager');
        });

        it('should use operation-specific security', () => {
            const generator = new SecurityGenerator();
            const operation = {
                summary: 'Operation with security',
                description: 'Operation with security description',
                responses: {
                    '200': { description: 'Success' }
                }
            };

            const docTypeWithSecurity: DocType = {
                ...sampleDocType,
                name: 'SecureDoc',
                openapi_security: [
                    { bearer: 'read' },
                    { apiKey: '' }
                ]
            };

            const securedOperation = generator.applySecurityToOperation(
                operation as any,
                docTypeWithSecurity,
                'read'
            );

            expect(securedOperation.security).toBeDefined();
            expect(securedOperation.security!.length).toBe(2);
            expect(securedOperation.security![0]).toHaveProperty('bearer');
            expect(securedOperation.security![1]).toHaveProperty('apiKey');
        });
    });

    describe('registerCustomScheme', () => {
        it('should register custom security scheme', () => {
            const generator = new SecurityGenerator();

            generator.registerCustomScheme('CustomAuth', {
                type: 'apiKey' as const,
                in: 'header' as const,
                name: 'X-Custom-Auth',
                description: 'Custom authentication scheme'
            });

            const includeSchemes = ['CustomAuth'];

            const schemes = generator.generateSecuritySchemes(includeSchemes);

            expect(schemes).toHaveProperty('CustomAuth');
            expect(schemes.CustomAuth.type).toBe('apiKey');
            expect(schemes.CustomAuth.description).toBe('Custom authentication scheme');
        });
    });

    describe('getAllSecuritySchemes', () => {
        it('should return all registered security schemes', () => {
            const generator = new SecurityGenerator();

            generator.registerCustomScheme('TestScheme', {
                type: 'http' as const,
                scheme: 'test'
            });

            const schemes = generator.getAllSecuritySchemes();

            expect(schemes).toHaveProperty('apiKey');
            expect(schemes).toHaveProperty('bearer');
            expect(schemes).toHaveProperty('session');
            expect(schemes).toHaveProperty('basic');
            expect(schemes).toHaveProperty('oauth2');
            expect(schemes).toHaveProperty('TestScheme');
        });
    });

    describe('isPublicOperation', () => {
        it('should return true for public DocType', () => {
            const generator = new SecurityGenerator();
            const publicDocType: DocType = {
                ...sampleDocType,
                name: 'PublicDoc',
                is_public: true
            };

            // isPublicOperation is a private method, so we need to test it indirectly
            const security = generator.generateDocTypeSecurity(publicDocType, 'read');
            const isPublic = security.length === 0;

            expect(isPublic).toBe(true);
        });

        it('should return true for operation with public permission', () => {
            const generator = new SecurityGenerator();
            const docTypeWithPublicPerm: DocType = {
                ...sampleDocType,
                permissions: [
                    { role: 'Guest', read: true }
                ]
            };

            // isPublicOperation is a private method, so we need to test it indirectly
            const security = generator.generateDocTypeSecurity(docTypeWithPublicPerm, 'read');
            const isPublic = security.length === 0;

            expect(isPublic).toBe(true);
        });

        it('should return false for private DocType', () => {
            const generator = new SecurityGenerator();
            const privateDocType: DocType = {
                ...sampleDocType,
                permissions: [
                    { role: 'Private', read: false }
                ]
            };

            // isPublicOperation is a private method, so we need to test it indirectly
            const security = generator.generateDocTypeSecurity(privateDocType, 'read');
            const isPublic = security.length === 0;

            expect(isPublic).toBe(false);
        });
    });

    describe('getPermissionRoles', () => {
        it('should extract roles for operation', () => {
            const generator = new SecurityGenerator();
            // getPermissionRoles is not a method, let's test the functionality indirectly
            const security = generator.generateDocTypeSecurity(sampleDocType, 'read');
            const roles = security.flatMap(s => s.bearer || []);

            expect(roles).toContain('System Manager');
            expect(roles).toContain('User');
            expect(roles.length).toBe(2);
        });

        it('should return empty array for DocType without permissions', () => {
            const generator = new SecurityGenerator();
            const docTypeWithoutPerms: DocType = {
                ...sampleDocType,
                permissions: []
            };

            // getPermissionRoles is not a method, let's test the functionality indirectly
            const security = generator.generateDocTypeSecurity(docTypeWithoutPerms, 'read');
            const roles = security.flatMap(s => s.bearer || []);

            expect(roles).toEqual([]);
        });

        it('should filter roles by permission type', () => {
            const generator = new SecurityGenerator();
            // getPermissionRoles is not a method, let's test the functionality indirectly
            const readSecurity = generator.generateDocTypeSecurity(sampleDocType, 'read');
            const writeSecurity = generator.generateDocTypeSecurity(sampleDocType, 'write');
            const createSecurity = generator.generateDocTypeSecurity(sampleDocType, 'create');
            const deleteSecurity = generator.generateDocTypeSecurity(sampleDocType, 'delete');

            const readRoles = readSecurity.flatMap(s => s.bearer || []);
            const writeRoles = writeSecurity.flatMap(s => s.bearer || []);
            const createRoles = createSecurity.flatMap(s => s.bearer || []);
            const deleteRoles = deleteSecurity.flatMap(s => s.bearer || []);

            expect(readRoles).toContain('System Manager');
            expect(readRoles).toContain('User');
            expect(writeRoles).toContain('System Manager');
            expect(writeRoles).not.toContain('User');
            expect(createRoles).toContain('System Manager');
            expect(createRoles).not.toContain('User');
            expect(deleteRoles).toContain('System Manager');
            expect(deleteRoles).not.toContain('User');
        });
    });

    describe('generateSecuritySchemes', () => {
        it('should generate all security schemes', () => {
            const generator = new SecurityGenerator();
            const includeSchemes = ['bearer', 'session', 'apiKey', 'basic', 'oauth2'];

            const schemes = generator.generateSecuritySchemes(includeSchemes);

            expect(schemes.bearer).toBeDefined();
            expect(schemes.bearer.type).toBe('http');
            expect(schemes.bearer.scheme).toBe('bearer');
            expect(schemes.bearer.bearerFormat).toBe('JWT');

            expect(schemes.session).toBeDefined();
            expect(schemes.session.type).toBe('apiKey');
            expect(schemes.session.in).toBe('cookie');
            expect(schemes.session.name).toBe('sid');

            expect(schemes.apiKey).toBeDefined();
            expect(schemes.apiKey.type).toBe('apiKey');
            expect(schemes.apiKey.in).toBe('header');
            expect(schemes.apiKey.name).toBe('Authorization');

            expect(schemes.basic).toBeDefined();
            expect(schemes.basic.type).toBe('http');
            expect(schemes.basic.scheme).toBe('basic');

            expect(schemes.oauth2).toBeDefined();
            expect(schemes.oauth2.type).toBe('oauth2');
            expect(schemes.oauth2.flows).toBeDefined();
        });
    });

    describe('generateSecurityComponents', () => {
        it('should generate security components with schemes and responses', () => {
            const generator = new SecurityGenerator();
            const options = {
                includeSchemes: ['bearer', 'session', 'apiKey'],
                defaultSchemes: ['bearer']
            };

            const components = generator.generateSecurityComponents(options);

            expect(components).toHaveProperty('securitySchemes');
            expect(components.securitySchemes!.bearer).toBeDefined();
            expect(components.securitySchemes!.session).toBeDefined();
            expect(components.securitySchemes!.apiKey).toBeDefined();
        });
    });

    describe('generateSecurityDocumentation', () => {
        it('should generate security documentation', () => {
            const generator = new SecurityGenerator();
            const documentation = generator.generateSecurityDocumentation({
                includeSchemes: ['bearer', 'session'],
                authEndpoint: '/api/auth/login',
                tokenEndpoint: '/api/auth/token'
            });

            expect(documentation).toContain('Authentication');
            expect(documentation).toContain('Bearer Token');
            expect(documentation).toContain('Session');
            expect(documentation).toContain('/api/auth/login');
            expect(documentation).toContain('/api/auth/token');
        });
    });
});