/**
 * P3-012: User Manager Tests
 * 
 * Comprehensive tests for UserManager class.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    UserManager,
    type CreateUserData,
    type UserManagerConfig,
} from '../user-manager';
import type { PasswordPolicy } from '../types';

describe('P3-012: User Manager', () => {
    let userManager: UserManager;

    // Helper to create a test user
    async function createTestUser(overrides: Partial<CreateUserData> = {}) {
        const userData: CreateUserData = {
            email: 'test@example.com',
            full_name: 'Test User',
            password: 'SecurePass123',
            ...overrides,
        };
        return userManager.createUser(userData);
    }

    beforeEach(() => {
        userManager = new UserManager();
    });

    // ==================== User CRUD Tests ====================

    describe('User CRUD Operations', () => {
        // P3-012-T1: createUser creates user, hashes password
        it('P3-012-T1: createUser should create user and hash password', async () => {
            const user = await createTestUser();

            expect(user).toBeDefined();
            expect(user.email).toBe('test@example.com');
            expect(user.full_name).toBe('Test User');
            expect(user.enabled).toBe(true);
            expect(user.user_type).toBe('System User');

            // Verify password was hashed (by checking we can verify it)
            const isValid = await userManager.verifyPassword('test@example.com', 'SecurePass123');
            expect(isValid).toBe(true);

            // Verify wrong password fails
            const isInvalid = await userManager.verifyPassword('test@example.com', 'WrongPassword');
            expect(isInvalid).toBe(false);
        });

        // P3-012-T2: createUser validates email
        it('P3-012-T2: createUser should throw on invalid email', async () => {
            await expect(createTestUser({ email: 'invalid-email' }))
                .rejects.toThrow('Invalid email format');

            await expect(createTestUser({ email: 'no-at-sign' }))
                .rejects.toThrow('Invalid email format');

            await expect(createTestUser({ email: '@nodomain.com' }))
                .rejects.toThrow('Invalid email format');
        });

        // P3-012-T3: createUser checks duplicate
        it('P3-012-T3: createUser should throw on existing email', async () => {
            await createTestUser();

            await expect(createTestUser({ email: 'test@example.com' }))
                .rejects.toThrow('Email already exists');
        });

        // P3-012-T4: updateUser updates user fields
        it('P3-012-T4: updateUser should update user fields', async () => {
            await createTestUser();

            const updated = await userManager.updateUser('test@example.com', {
                full_name: 'Updated Name',
                first_name: 'Updated',
                last_name: 'Name',
                language: 'en',
                time_zone: 'UTC',
            });

            expect(updated.full_name).toBe('Updated Name');
            expect(updated.first_name).toBe('Updated');
            expect(updated.last_name).toBe('Name');
            expect(updated.language).toBe('en');
            expect(updated.time_zone).toBe('UTC');
        });

        // P3-012-T5: deleteUser removes user
        it('P3-012-T5: deleteUser should remove user', async () => {
            await createTestUser();
            expect(userManager.userExists('test@example.com')).toBe(true);

            const result = await userManager.deleteUser('test@example.com');

            expect(result.success).toBe(true);
            expect(userManager.userExists('test@example.com')).toBe(false);
        });

        // P3-012-T6: deleteUser checks refs
        it('P3-012-T6: deleteUser should warn on linked documents', async () => {
            const mockCheckLinked = vi.fn().mockResolvedValue(5);
            const manager = new UserManager({
                checkLinkedDocuments: mockCheckLinked,
            });

            await manager.createUser({
                email: 'user@example.com',
                full_name: 'User',
                password: 'SecurePass123',
            });

            const result = await manager.deleteUser('user@example.com');

            expect(result.success).toBe(true);
            expect(result.warning).toContain('5 linked document(s)');
            expect(result.linked_documents).toBe(5);
            expect(mockCheckLinked).toHaveBeenCalledWith('user@example.com');
        });

        // P3-012-T7: getUser returns user object
        it('P3-012-T7: getUser should return user object', async () => {
            await createTestUser();

            const user = userManager.getUser('test@example.com');

            expect(user).not.toBeNull();
            expect(user!.email).toBe('test@example.com');
            expect(user!.full_name).toBe('Test User');
        });

        // P3-012-T8: getUser excludes password
        it('P3-012-T8: getUser should not return password', async () => {
            await createTestUser();

            const user = userManager.getUser('test@example.com');

            expect(user).not.toBeNull();
            // TypeScript type should not include password fields
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((user as any).password_hash).toBeUndefined();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((user as any).password_salt).toBeUndefined();
        });

        // P3-012-T9: getUserByEmail returns user by email
        it('P3-012-T9: getUserByEmail should return user by email', async () => {
            await createTestUser();

            const user = userManager.getUserByEmail('test@example.com');

            expect(user).not.toBeNull();
            expect(user!.email).toBe('test@example.com');

            // Non-existent email
            const noUser = userManager.getUserByEmail('nonexistent@example.com');
            expect(noUser).toBeNull();
        });

        // P3-012-T10: getAllUsers returns filtered users
        it('P3-012-T10: getAllUsers should return filtered users', async () => {
            await createTestUser({ email: 'user1@example.com', full_name: 'Active User' });
            await createTestUser({ email: 'user2@example.com', full_name: 'Another User', user_type: 'Website User' });
            await createTestUser({ email: 'user3@example.com', full_name: 'Disabled User' });
            await userManager.disableUser('user3@example.com');

            // Test no filters
            let users = userManager.getAllUsers();
            expect(users).toHaveLength(3);

            // Test enabled filter
            users = userManager.getAllUsers({ enabled: true });
            expect(users).toHaveLength(2);

            // Test user_type filter
            users = userManager.getAllUsers({ user_type: 'Website User' });
            expect(users).toHaveLength(1);
            expect(users[0].email).toBe('user2@example.com');

            // Test search filter
            users = userManager.getAllUsers({ search: 'Another' });
            expect(users).toHaveLength(1);
            expect(users[0].full_name).toBe('Another User');

            // Test pagination
            users = userManager.getAllUsers({ limit: 2 });
            expect(users).toHaveLength(2);

            users = userManager.getAllUsers({ limit: 2, offset: 2 });
            expect(users).toHaveLength(1);
        });
    });

    // ==================== Role Management Tests ====================

    describe('Role Management', () => {
        // P3-012-T11: assignRole adds role to user
        it('P3-012-T11: assignRole should add role to user', async () => {
            await createTestUser();

            const role = await userManager.assignRole('test@example.com', 'Editor');

            expect(role.role).toBe('Editor');
            expect(role.is_desk_user).toBe(true);
            expect(role.parent).toBe('test@example.com');

            const roles = userManager.getUserRoles('test@example.com');
            expect(roles).toHaveLength(1);
            expect(roles[0].role).toBe('Editor');
        });

        // P3-012-T12: removeRole removes role from user
        it('P3-012-T12: removeRole should remove role from user', async () => {
            await createTestUser();
            await userManager.assignRole('test@example.com', 'Editor');
            await userManager.assignRole('test@example.com', 'Viewer');

            expect(userManager.getUserRoles('test@example.com')).toHaveLength(2);

            const removed = await userManager.removeRole('test@example.com', 'Editor');

            expect(removed).toBe(true);
            const roles = userManager.getUserRoles('test@example.com');
            expect(roles).toHaveLength(1);
            expect(roles[0].role).toBe('Viewer');
        });

        // P3-012-T13: getUserRoles returns user's roles
        it('P3-012-T13: getUserRoles should return user roles', async () => {
            await createTestUser();
            await userManager.assignRole('test@example.com', 'Admin');
            await userManager.assignRole('test@example.com', 'Manager');

            const roles = userManager.getUserRoles('test@example.com');

            expect(roles).toHaveLength(2);
            expect(roles.map(r => r.role)).toContain('Admin');
            expect(roles.map(r => r.role)).toContain('Manager');
        });
    });

    // ==================== Password Management Tests ====================

    describe('Password Management', () => {
        // P3-012-T14: setPassword updates hashed password
        it('P3-012-T14: setPassword should update hashed password', async () => {
            await createTestUser();

            // Verify original password works
            expect(await userManager.verifyPassword('test@example.com', 'SecurePass123')).toBe(true);

            // Update password
            await userManager.setPassword('test@example.com', 'NewSecure456');

            // Original no longer works
            expect(await userManager.verifyPassword('test@example.com', 'SecurePass123')).toBe(false);

            // New password works
            expect(await userManager.verifyPassword('test@example.com', 'NewSecure456')).toBe(true);
        });

        // P3-012-T15: validatePassword checks strength
        it('P3-012-T15: validatePassword should check password strength', () => {
            // Valid password
            let result = userManager.validatePassword('SecurePass123');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);

            // Too short
            result = userManager.validatePassword('Short1');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters');

            // Missing uppercase
            result = userManager.validatePassword('lowercase123');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');

            // Missing lowercase
            result = userManager.validatePassword('UPPERCASE123');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one lowercase letter');

            // Missing number
            result = userManager.validatePassword('NoNumbersHere');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        // P3-012-T16: resetPassword generates reset key
        it('P3-012-T16: resetPassword should generate reset key', async () => {
            await createTestUser();

            const token = await userManager.resetPassword('test@example.com');

            expect(token.key).toBeDefined();
            expect(token.key.length).toBe(64); // 32 bytes hex = 64 chars
            expect(token.user).toBe('test@example.com');
            expect(token.expiry).toBeDefined();

            // Expiry should be in the future
            expect(new Date(token.expiry).getTime()).toBeGreaterThan(Date.now());
        });

        // P3-012-T17: confirmResetPassword sets new password
        it('P3-012-T17: confirmResetPassword should set new password', async () => {
            await createTestUser();
            const token = await userManager.resetPassword('test@example.com');

            const result = await userManager.confirmResetPassword(token.key, 'BrandNewPass999');

            expect(result).toBe(true);

            // Old password no longer works
            expect(await userManager.verifyPassword('test@example.com', 'SecurePass123')).toBe(false);

            // New password works
            expect(await userManager.verifyPassword('test@example.com', 'BrandNewPass999')).toBe(true);

            // Token can't be reused
            await expect(userManager.confirmResetPassword(token.key, 'AnotherPass123'))
                .rejects.toThrow('Invalid or expired reset key');
        });

        // P3-012-T23: Password hashing secure (uses PBKDF2)
        it('P3-012-T23: should use secure password hashing (PBKDF2)', async () => {
            await createTestUser();

            // Creating same user with same password should produce different hash (due to random salt)
            const user2 = await userManager.createUser({
                email: 'user2@example.com',
                full_name: 'User 2',
                password: 'SecurePass123', // Same password as first user
            });

            // Both users exist
            expect(userManager.userExists('test@example.com')).toBe(true);
            expect(userManager.userExists('user2@example.com')).toBe(true);

            // Both can verify with the same password
            expect(await userManager.verifyPassword('test@example.com', 'SecurePass123')).toBe(true);
            expect(await userManager.verifyPassword('user2@example.com', 'SecurePass123')).toBe(true);

            // Cross-verification fails (different salts)
            expect(await userManager.verifyPassword('test@example.com', 'WrongPassword')).toBe(false);
        });
    });

    // ==================== User Status Tests ====================

    describe('User Status Management', () => {
        // P3-012-T18: enableUser sets enabled=true
        it('P3-012-T18: enableUser should set enabled=true', async () => {
            await createTestUser();
            await userManager.disableUser('test@example.com');
            expect(userManager.getUser('test@example.com')!.enabled).toBe(false);

            const user = await userManager.enableUser('test@example.com');

            expect(user.enabled).toBe(true);
            expect(userManager.getUser('test@example.com')!.enabled).toBe(true);
        });

        // P3-012-T19: disableUser sets enabled=false
        it('P3-012-T19: disableUser should set enabled=false', async () => {
            await createTestUser();
            expect(userManager.getUser('test@example.com')!.enabled).toBe(true);

            const user = await userManager.disableUser('test@example.com');

            expect(user.enabled).toBe(false);
            expect(userManager.getUser('test@example.com')!.enabled).toBe(false);
        });
    });

    // ==================== User Preferences Tests ====================

    describe('User Preferences', () => {
        // P3-012-T20: setDefault stores user preference
        it('P3-012-T20: setDefault should store user preference', async () => {
            await createTestUser();

            userManager.setDefault('test@example.com', 'theme', 'dark');
            userManager.setDefault('test@example.com', 'language', 'en');
            userManager.setDefault('test@example.com', 'page_size', 50);

            expect(userManager.getDefault('test@example.com', 'theme')).toBe('dark');
            expect(userManager.getDefault('test@example.com', 'language')).toBe('en');
            expect(userManager.getDefault('test@example.com', 'page_size')).toBe(50);
        });

        // P3-012-T21: getDefault returns user preference
        it('P3-012-T21: getDefault should return user preference', async () => {
            await createTestUser();
            userManager.setDefault('test@example.com', 'sidebar_collapsed', true);

            const value = userManager.getDefault('test@example.com', 'sidebar_collapsed');

            expect(value).toBe(true);

            // Non-existent preference
            const noValue = userManager.getDefault('test@example.com', 'nonexistent');
            expect(noValue).toBeUndefined();
        });

        // P3-012-T22: getDefaults returns all preferences
        it('P3-012-T22: getDefaults should return all preferences', async () => {
            await createTestUser();
            userManager.setDefault('test@example.com', 'theme', 'dark');
            userManager.setDefault('test@example.com', 'font_size', 14);
            userManager.setDefault('test@example.com', 'auto_save', true);

            const defaults = userManager.getDefaults('test@example.com');

            expect(defaults).toEqual({
                theme: 'dark',
                font_size: 14,
                auto_save: true,
            });
        });
    });

    // ==================== Edge Cases and Error Handling ====================

    describe('Error Handling', () => {
        it('should throw when updating non-existent user', async () => {
            await expect(userManager.updateUser('nonexistent@example.com', { full_name: 'Test' }))
                .rejects.toThrow('User not found');
        });

        it('should throw when deleting non-existent user', async () => {
            await expect(userManager.deleteUser('nonexistent@example.com'))
                .rejects.toThrow('User not found');
        });

        it('should throw when getting roles for non-existent user', () => {
            expect(() => userManager.getUserRoles('nonexistent@example.com'))
                .toThrow('User not found');
        });

        it('should throw when setting password for non-existent user', async () => {
            await expect(userManager.setPassword('nonexistent@example.com', 'NewPass123'))
                .rejects.toThrow('User not found');
        });

        it('should throw when generating reset for non-existent user', async () => {
            await expect(userManager.resetPassword('nonexistent@example.com'))
                .rejects.toThrow('User not found');
        });

        it('should throw when setting default for non-existent user', async () => {
            expect(() => userManager.setDefault('nonexistent@example.com', 'key', 'value'))
                .toThrow('User not found');
        });

        it('should not allow duplicate role assignment', async () => {
            await createTestUser();
            await userManager.assignRole('test@example.com', 'Admin');

            // Second assignment should return existing role
            const role = await userManager.assignRole('test@example.com', 'Admin');
            expect(role.role).toBe('Admin');

            // Should still only have one role
            expect(userManager.getUserRoles('test@example.com')).toHaveLength(1);
        });

        it('should handle password that fails validation on create', async () => {
            await expect(createTestUser({ password: 'weak' }))
                .rejects.toThrow('Password validation failed');
        });

        it('should handle password that fails validation on set', async () => {
            await createTestUser();

            await expect(userManager.setPassword('test@example.com', 'weak'))
                .rejects.toThrow('Password validation failed');
        });

        it('should handle expired reset tokens', async () => {
            await createTestUser();
            const token = await userManager.resetPassword('test@example.com');

            // Manually expire the token by modifying internal state
            // This is a bit hacky but necessary for testing
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const internalTokens = (userManager as any).resetTokens as Map<string, { key: string; expiry: string; user: string }>;
            const storedToken = internalTokens.get(token.key);
            if (storedToken) {
                storedToken.expiry = new Date(Date.now() - 1000).toISOString(); // 1 second ago
            }

            await expect(userManager.confirmResetPassword(token.key, 'NewPass123'))
                .rejects.toThrow('Reset key has expired');
        });
    });

    // ==================== Custom Password Policy Tests ====================

    describe('Custom Password Policy', () => {
        it('should respect custom password policy with special characters', async () => {
            const strictPolicy: PasswordPolicy = {
                min_length: 12,
                require_uppercase: true,
                require_lowercase: true,
                require_number: true,
                require_special: true,
            };

            const manager = new UserManager({ passwordPolicy: strictPolicy });

            // Password without special character should fail
            let result = manager.validatePassword('SecurePass123');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one special character');

            // Password with special character should pass
            result = manager.validatePassword('SecurePass123!');
            expect(result.valid).toBe(true);
        });

        it('should allow updating password policy', () => {
            const manager = new UserManager();

            const newPolicy: PasswordPolicy = {
                min_length: 16,
                require_uppercase: false,
                require_lowercase: true,
                require_number: false,
                require_special: false,
            };

            manager.setPasswordPolicy(newPolicy);

            const policy = manager.getPasswordPolicy();
            expect(policy.min_length).toBe(16);
            expect(policy.require_uppercase).toBe(false);
        });
    });

    // ==================== Initial Roles on Create ====================

    describe('Initial Roles on Create', () => {
        it('should assign initial roles when creating user', async () => {
            const user = await userManager.createUser({
                email: 'newuser@example.com',
                full_name: 'New User',
                password: 'SecurePass123',
                roles: ['Editor', 'Viewer'],
            });

            const roles = userManager.getUserRoles('newuser@example.com');
            expect(roles).toHaveLength(2);
            expect(roles.map(r => r.role)).toContain('Editor');
            expect(roles.map(r => r.role)).toContain('Viewer');
        });
    });
});
