/**
 * P3-011: User Types and Interfaces Tests
 * 
 * Test that all types compile correctly with expected properties.
 */
import { describe, it, expect } from 'vitest';
import type {
    User,
    UserType,
    UserRole,
    Session,
    AuthToken,
    LoginCredentials,
    APICredentials,
} from '../types';

describe('P3-011: User Types and Interfaces', () => {
    // P3-011-T1: User interface compiles
    describe('User interface', () => {
        it('P3-011-T1: should compile with all user properties', () => {
            const user: User = {
                name: 'admin@example.com',
                email: 'admin@example.com',
                full_name: 'Admin User',
                enabled: true,
                user_type: 'System User',
            };

            expect(user).toBeDefined();
            expect(user.name).toBe('admin@example.com');
            expect(user.email).toBe('admin@example.com');
            expect(user.full_name).toBe('Admin User');
            expect(user.enabled).toBe(true);
            expect(user.user_type).toBe('System User');
        });

        // P3-011-T2: User has identification
        it('P3-011-T2: should have identification properties (name, email, full_name)', () => {
            const user: User = {
                name: 'john@example.com',
                email: 'john@example.com',
                full_name: 'John Doe',
                enabled: true,
                user_type: 'Website User',
                first_name: 'John',
                last_name: 'Doe',
                username: 'johndoe',
            };

            // Verify identification properties exist
            expect(user.name).toBeDefined();
            expect(user.email).toBeDefined();
            expect(user.full_name).toBeDefined();
            expect(user.first_name).toBe('John');
            expect(user.last_name).toBe('Doe');
            expect(user.username).toBe('johndoe');
        });

        // P3-011-T3: User has status
        it('P3-011-T3: should have status properties (enabled, user_type)', () => {
            const enabledUser: User = {
                name: 'active@example.com',
                email: 'active@example.com',
                full_name: 'Active User',
                enabled: true,
                user_type: 'System User',
            };

            const disabledUser: User = {
                name: 'disabled@example.com',
                email: 'disabled@example.com',
                full_name: 'Disabled User',
                enabled: false,
                user_type: 'Website User',
            };

            expect(enabledUser.enabled).toBe(true);
            expect(enabledUser.user_type).toBe('System User');
            expect(disabledUser.enabled).toBe(false);
            expect(disabledUser.user_type).toBe('Website User');
        });

        it('should support all UserType values', () => {
            const userTypes: UserType[] = ['System User', 'Website User', 'Admin'];

            userTypes.forEach(type => {
                const user: User = {
                    name: 'test@example.com',
                    email: 'test@example.com',
                    full_name: 'Test User',
                    enabled: true,
                    user_type: type,
                };
                expect(user.user_type).toBe(type);
            });
        });

        it('should support optional properties', () => {
            const user: User = {
                name: 'full@example.com',
                email: 'full@example.com',
                full_name: 'Full User',
                enabled: true,
                user_type: 'System User',
                first_name: 'Full',
                last_name: 'User',
                username: 'fulluser',
                user_image: '/images/avatar.png',
                language: 'en',
                time_zone: 'UTC',
                last_login: '2024-01-01T00:00:00Z',
                last_ip: '192.168.1.1',
                last_active: '2024-01-01T01:00:00Z',
                api_key: 'abc123',
                api_secret: 'secret_hash',
                creation: '2023-01-01T00:00:00Z',
                modified: '2024-01-01T00:00:00Z',
                modified_by: 'admin@example.com',
            };

            expect(user.first_name).toBe('Full');
            expect(user.last_name).toBe('User');
            expect(user.user_image).toBe('/images/avatar.png');
            expect(user.language).toBe('en');
            expect(user.time_zone).toBe('UTC');
            expect(user.last_login).toBeDefined();
            expect(user.last_ip).toBe('192.168.1.1');
            expect(user.api_key).toBe('abc123');
        });
    });

    // P3-011-T4: UserRole interface compiles
    describe('UserRole interface', () => {
        it('P3-011-T4: should compile with role and is_desk_user', () => {
            const role: UserRole = {
                role: 'System Manager',
                is_desk_user: true,
            };

            expect(role).toBeDefined();
            expect(role.role).toBe('System Manager');
            expect(role.is_desk_user).toBe(true);
        });

        it('should support optional parent and idx', () => {
            const role: UserRole = {
                role: 'Sales User',
                is_desk_user: true,
                parent: 'admin@example.com',
                idx: 1,
            };

            expect(role.parent).toBe('admin@example.com');
            expect(role.idx).toBe(1);
        });

        it('should distinguish desk and non-desk users', () => {
            const deskRole: UserRole = {
                role: 'System Manager',
                is_desk_user: true,
            };

            const nonDeskRole: UserRole = {
                role: 'Customer',
                is_desk_user: false,
            };

            expect(deskRole.is_desk_user).toBe(true);
            expect(nonDeskRole.is_desk_user).toBe(false);
        });
    });

    // P3-011-T5: Session interface compiles
    describe('Session interface', () => {
        it('P3-011-T5: should compile with user, session_id, device, ip_address, created', () => {
            const session: Session = {
                session_id: 'sess_abc123xyz',
                user: 'admin@example.com',
                device: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                ip_address: '192.168.1.100',
                created: '2024-01-15T10:30:00Z',
            };

            expect(session).toBeDefined();
            expect(session.session_id).toBe('sess_abc123xyz');
            expect(session.user).toBe('admin@example.com');
            expect(session.device).toBeDefined();
            expect(session.ip_address).toBe('192.168.1.100');
            expect(session.created).toBeDefined();
        });

        it('should support optional session properties', () => {
            const session: Session = {
                session_id: 'sess_full123',
                user: 'user@example.com',
                device: 'Chrome/120.0',
                ip_address: '10.0.0.1',
                created: '2024-01-15T10:30:00Z',
                last_active: '2024-01-15T11:00:00Z',
                status: 'active',
                geo_location: 'New York, US',
                browser: 'Chrome',
                os: 'Windows 10',
            };

            expect(session.last_active).toBeDefined();
            expect(session.status).toBe('active');
            expect(session.geo_location).toBe('New York, US');
            expect(session.browser).toBe('Chrome');
            expect(session.os).toBe('Windows 10');
        });

        it('should support all status values', () => {
            const statuses: Array<'active' | 'expired' | 'revoked'> = ['active', 'expired', 'revoked'];

            statuses.forEach(status => {
                const session: Session = {
                    session_id: 'sess_test',
                    user: 'test@example.com',
                    device: 'Test Device',
                    ip_address: '127.0.0.1',
                    created: '2024-01-01T00:00:00Z',
                    status,
                };
                expect(session.status).toBe(status);
            });
        });
    });

    // P3-011-T6: AuthToken interface compiles
    describe('AuthToken interface', () => {
        it('P3-011-T6: should compile with token, expiry, refresh_token', () => {
            const token: AuthToken = {
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                expiry: '2024-01-15T12:00:00Z',
                refresh_token: 'refresh_abc123',
            };

            expect(token).toBeDefined();
            expect(token.token).toBeDefined();
            expect(token.expiry).toBeDefined();
            expect(token.refresh_token).toBe('refresh_abc123');
        });

        it('should support optional token properties', () => {
            const token: AuthToken = {
                token: 'access_token_123',
                expiry: '2024-01-15T12:00:00Z',
                refresh_token: 'refresh_456',
                token_type: 'Bearer',
                scopes: ['read', 'write'],
                user: 'admin@example.com',
                issued_at: '2024-01-15T10:00:00Z',
            };

            expect(token.token_type).toBe('Bearer');
            expect(token.scopes).toEqual(['read', 'write']);
            expect(token.user).toBe('admin@example.com');
            expect(token.issued_at).toBeDefined();
        });
    });

    // P3-011-T7: LoginCredentials interface
    describe('LoginCredentials interface', () => {
        it('P3-011-T7: should compile with email and password', () => {
            const credentials: LoginCredentials = {
                email: 'user@example.com',
                password: 'securePassword123!',
            };

            expect(credentials).toBeDefined();
            expect(credentials.email).toBe('user@example.com');
            expect(credentials.password).toBe('securePassword123!');
        });

        it('should support optional login properties', () => {
            const credentials: LoginCredentials = {
                email: 'user@example.com',
                password: 'password123',
                device_id: 'device_abc123',
                remember_me: true,
            };

            expect(credentials.device_id).toBe('device_abc123');
            expect(credentials.remember_me).toBe(true);
        });
    });

    // P3-011-T8: APICredentials interface
    describe('APICredentials interface', () => {
        it('P3-011-T8: should compile with api_key and api_secret', () => {
            const apiCreds: APICredentials = {
                api_key: 'key_abc123',
                api_secret: 'secret_xyz789',
            };

            expect(apiCreds).toBeDefined();
            expect(apiCreds.api_key).toBe('key_abc123');
            expect(apiCreds.api_secret).toBe('secret_xyz789');
        });
    });
});
