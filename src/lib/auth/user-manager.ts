/**
 * User Manager
 * 
 * P3-012: Implement UserManager for user CRUD operations.
 * Provides comprehensive user management including CRUD, role management,
 * password handling, and user preferences.
 */

import { hashPassword as cryptoHashPassword, getRandomBytes, bytesToHex } from './crypto-utils';
import type { User, UserRole, UserType, PasswordPolicy } from './types';

/**
 * Input data for creating a new user
 */
export interface CreateUserData {
    /** User email (required, must be unique) */
    email: string;
    /** User's full name (required) */
    full_name: string;
    /** Password (required for creation) */
    password: string;
    /** User type (default: 'System User') */
    user_type?: UserType;
    /** First name (optional) */
    first_name?: string;
    /** Last name (optional) */
    last_name?: string;
    /** Whether user is enabled (default: true) */
    enabled?: boolean;
    /** Initial roles to assign */
    roles?: string[];
}

/**
 * Input data for updating a user
 */
export interface UpdateUserData {
    /** User's full name */
    full_name?: string;
    /** First name */
    first_name?: string;
    /** Last name */
    last_name?: string;
    /** User type */
    user_type?: UserType;
    /** Profile image URL */
    user_image?: string;
    /** Preferred language */
    language?: string;
    /** Timezone */
    time_zone?: string;
    /** Username */
    username?: string;
}

/**
 * Filter options for getting all users
 */
export interface UserFilters {
    /** Filter by enabled status */
    enabled?: boolean;
    /** Filter by user type */
    user_type?: UserType;
    /** Filter by role */
    role?: string;
    /** Search in name/email */
    search?: string;
    /** Limit results */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
}

/**
 * Result of delete operation with reference warnings
 */
export interface DeleteUserResult {
    /** Whether delete was successful */
    success: boolean;
    /** Warning about linked documents */
    warning?: string;
    /** Number of linked documents found */
    linked_documents?: number;
}

/**
 * Password reset token data
 */
export interface PasswordResetToken {
    /** Reset key/token */
    key: string;
    /** Expiry timestamp (ISO 8601) */
    expiry: string;
    /** User the token belongs to */
    user: string;
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
    /** Whether password is valid */
    valid: boolean;
    /** Validation errors */
    errors: string[];
}

/**
 * Internal user storage with password hash
 */
interface StoredUser extends Omit<User, 'api_secret'> {
    /** Hashed password */
    password_hash?: string;
    /** Password salt */
    password_salt?: string;
    /** Reset token key */
    reset_password_key?: string;
    /** Reset token expiry */
    reset_key_expiry?: string;
}

/**
 * Configuration for UserManager
 */
export interface UserManagerConfig {
    /** Password policy configuration */
    passwordPolicy?: PasswordPolicy;
    /** PBKDF2 iterations (default: 100000) */
    hashIterations?: number;
    /** Function to check for linked documents */
    checkLinkedDocuments?: (user: string) => Promise<number>;
}

/**
 * Default password policy
 */
const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
    min_length: 8,
    max_length: 128,
    require_uppercase: true,
    require_lowercase: true,
    require_number: true,
    require_special: false,
};

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * UserManager class for user CRUD operations
 * 
 * Provides methods for:
 * - User CRUD (create, read, update, delete)
 * - Role management
 * - Password handling with secure hashing
 * - User preferences storage
 */
export class UserManager {
    private users: Map<string, StoredUser> = new Map();
    private userRoles: Map<string, UserRole[]> = new Map();
    private userDefaults: Map<string, Map<string, unknown>> = new Map();
    private resetTokens: Map<string, PasswordResetToken> = new Map();
    private passwordPolicy: PasswordPolicy;
    private hashIterations: number;
    private checkLinkedDocuments?: (user: string) => Promise<number>;

    constructor(config: UserManagerConfig = {}) {
        this.passwordPolicy = config.passwordPolicy ?? DEFAULT_PASSWORD_POLICY;
        this.hashIterations = config.hashIterations ?? 100000;
        this.checkLinkedDocuments = config.checkLinkedDocuments;
    }

    // ==================== Password Hashing ====================

    /**
     * Hash a password using PBKDF2-SHA512
     * P3-012-T23: Uses secure hashing (cross-platform)
     */
    private async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
        return cryptoHashPassword(password, salt, this.hashIterations);
    }

    /**
     * Verify a password against stored hash
     */
    async verifyPassword(user: string, password: string): Promise<boolean> {
        const storedUser = this.users.get(user);
        if (!storedUser || !storedUser.password_hash || !storedUser.password_salt) {
            return false;
        }

        const { hash } = await this.hashPassword(password, storedUser.password_salt);
        return hash === storedUser.password_hash;
    }

    // ==================== Email Validation ====================

    /**
     * Validate email format
     * P3-012-T2: Validates email
     */
    private validateEmail(email: string): boolean {
        return EMAIL_REGEX.test(email);
    }

    /**
     * Check if email already exists
     * P3-012-T3: Checks duplicate
     */
    private emailExists(email: string, excludeUser?: string): boolean {
        for (const [name, user] of Array.from(this.users.entries())) {
            if (user.email === email && name !== excludeUser) {
                return true;
            }
        }
        return false;
    }

    // ==================== User CRUD ====================

    /**
     * Create a new user
     * P3-012-T1: Creates user, hashes password
     * P3-012-T2: Validates email
     * P3-012-T3: Checks duplicate
     */
    async createUser(data: CreateUserData): Promise<User> {
        // Validate email format
        if (!this.validateEmail(data.email)) {
            throw new Error('Invalid email format');
        }

        // Check for duplicate email
        if (this.emailExists(data.email)) {
            throw new Error('Email already exists');
        }

        // Validate password strength
        const passwordValidation = this.validatePassword(data.password);
        if (!passwordValidation.valid) {
            throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
        }

        // Hash password
        const { hash, salt } = await this.hashPassword(data.password);

        // Create user
        const now = new Date().toISOString();
        const storedUser: StoredUser = {
            name: data.email,
            email: data.email,
            full_name: data.full_name,
            first_name: data.first_name,
            last_name: data.last_name,
            user_type: data.user_type ?? 'System User',
            enabled: data.enabled ?? true,
            password_hash: hash,
            password_salt: salt,
            creation: now,
            modified: now,
        };

        this.users.set(data.email, storedUser);

        // Initialize roles
        this.userRoles.set(data.email, []);

        // Assign initial roles if provided
        if (data.roles) {
            for (const role of data.roles) {
                await this.assignRole(data.email, role);
            }
        }

        // Initialize user defaults
        this.userDefaults.set(data.email, new Map());

        return this.sanitizeUser(storedUser);
    }

    /**
     * Get a user by ID (name)
     * P3-012-T7: Returns user object
     * P3-012-T8: Password not returned
     */
    getUser(id: string): User | null {
        const storedUser = this.users.get(id);
        if (!storedUser) {
            return null;
        }
        return this.sanitizeUser(storedUser);
    }

    /**
     * Get a user by email
     * P3-012-T9: Returns user by email
     */
    getUserByEmail(email: string): User | null {
        for (const storedUser of Array.from(this.users.values())) {
            if (storedUser.email === email) {
                return this.sanitizeUser(storedUser);
            }
        }
        return null;
    }

    /**
     * Get all users with optional filters
     * P3-012-T10: Returns filtered users
     */
    getAllUsers(filters?: UserFilters): User[] {
        let users = Array.from(this.users.values());

        if (filters) {
            // Filter by enabled status
            if (filters.enabled !== undefined) {
                users = users.filter(u => u.enabled === filters.enabled);
            }

            // Filter by user type
            if (filters.user_type) {
                users = users.filter(u => u.user_type === filters.user_type);
            }

            // Filter by role
            if (filters.role) {
                users = users.filter(u => {
                    const roles = this.userRoles.get(u.name) ?? [];
                    return roles.some(r => r.role === filters.role);
                });
            }

            // Search in name/email
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                users = users.filter(u =>
                    u.email.toLowerCase().includes(searchLower) ||
                    u.full_name.toLowerCase().includes(searchLower) ||
                    (u.first_name?.toLowerCase().includes(searchLower)) ||
                    (u.last_name?.toLowerCase().includes(searchLower))
                );
            }

            // Apply pagination
            if (filters.offset !== undefined) {
                users = users.slice(filters.offset);
            }
            if (filters.limit !== undefined) {
                users = users.slice(0, filters.limit);
            }
        }

        return users.map(u => this.sanitizeUser(u));
    }

    /**
     * Update a user
     * P3-012-T4: Updates user fields
     */
    async updateUser(id: string, data: UpdateUserData): Promise<User> {
        const storedUser = this.users.get(id);
        if (!storedUser) {
            throw new Error('User not found');
        }

        // Update fields
        if (data.full_name !== undefined) storedUser.full_name = data.full_name;
        if (data.first_name !== undefined) storedUser.first_name = data.first_name;
        if (data.last_name !== undefined) storedUser.last_name = data.last_name;
        if (data.user_type !== undefined) storedUser.user_type = data.user_type;
        if (data.user_image !== undefined) storedUser.user_image = data.user_image;
        if (data.language !== undefined) storedUser.language = data.language;
        if (data.time_zone !== undefined) storedUser.time_zone = data.time_zone;
        if (data.username !== undefined) storedUser.username = data.username;

        storedUser.modified = new Date().toISOString();

        this.users.set(id, storedUser);
        return this.sanitizeUser(storedUser);
    }

    /**
     * Delete a user
     * P3-012-T5: Removes user
     * P3-012-T6: Warns on linked documents
     */
    async deleteUser(id: string): Promise<DeleteUserResult> {
        const storedUser = this.users.get(id);
        if (!storedUser) {
            throw new Error('User not found');
        }

        // Check for linked documents
        let linkedCount = 0;
        let warning: string | undefined;

        if (this.checkLinkedDocuments) {
            linkedCount = await this.checkLinkedDocuments(id);
            if (linkedCount > 0) {
                warning = `User has ${linkedCount} linked document(s). These references may become orphaned.`;
            }
        }

        // Remove user data
        this.users.delete(id);
        this.userRoles.delete(id);
        this.userDefaults.delete(id);

        // Remove any reset tokens
        for (const [key, token] of Array.from(this.resetTokens.entries())) {
            if (token.user === id) {
                this.resetTokens.delete(key);
            }
        }

        return {
            success: true,
            warning,
            linked_documents: linkedCount > 0 ? linkedCount : undefined,
        };
    }

    /**
     * Remove password and internal fields from user object
     * P3-012-T8: Password not returned
     */
    private sanitizeUser(storedUser: StoredUser): User {
        const { password_hash, password_salt, reset_password_key, reset_key_expiry, ...user } = storedUser;
        return user as User;
    }

    // ==================== Role Management ====================

    /**
     * Assign a role to a user
     * P3-012-T11: Adds role to user
     */
    async assignRole(user: string, role: string, isDeskUser: boolean = true): Promise<UserRole> {
        if (!this.users.has(user)) {
            throw new Error('User not found');
        }

        const roles = this.userRoles.get(user) ?? [];

        // Check if role already assigned
        const existingRole = roles.find(r => r.role === role);
        if (existingRole) {
            return existingRole;
        }

        const newRole: UserRole = {
            role,
            is_desk_user: isDeskUser,
            parent: user,
            idx: roles.length,
        };

        roles.push(newRole);
        this.userRoles.set(user, roles);

        return newRole;
    }

    /**
     * Remove a role from a user
     * P3-012-T12: Removes role from user
     */
    async removeRole(user: string, role: string): Promise<boolean> {
        if (!this.users.has(user)) {
            throw new Error('User not found');
        }

        const roles = this.userRoles.get(user) ?? [];
        const initialLength = roles.length;

        const filteredRoles = roles.filter(r => r.role !== role);

        // Re-index
        filteredRoles.forEach((r, idx) => r.idx = idx);

        this.userRoles.set(user, filteredRoles);

        return filteredRoles.length < initialLength;
    }

    /**
     * Get all roles for a user
     * P3-012-T13: Returns user's roles
     */
    getUserRoles(user: string): UserRole[] {
        if (!this.users.has(user)) {
            throw new Error('User not found');
        }

        return [...(this.userRoles.get(user) ?? [])];
    }

    // ==================== Password Management ====================

    /**
     * Validate password against policy
     * P3-012-T15: Checks strength
     */
    validatePassword(password: string): PasswordValidationResult {
        const errors: string[] = [];
        const policy = this.passwordPolicy;

        // Check minimum length
        if (password.length < policy.min_length) {
            errors.push(`Password must be at least ${policy.min_length} characters`);
        }

        // Check maximum length
        if (policy.max_length && password.length > policy.max_length) {
            errors.push(`Password must be at most ${policy.max_length} characters`);
        }

        // Check uppercase
        if (policy.require_uppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        // Check lowercase
        if (policy.require_lowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        // Check number
        if (policy.require_number && !/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        // Check special character
        if (policy.require_special && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Set a new password for a user
     * P3-012-T14: Updates hashed password
     */
    async setPassword(user: string, password: string): Promise<void> {
        const storedUser = this.users.get(user);
        if (!storedUser) {
            throw new Error('User not found');
        }

        // Validate password
        const validation = this.validatePassword(password);
        if (!validation.valid) {
            throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
        }

        // Hash and store
        const { hash, salt } = await this.hashPassword(password);
        storedUser.password_hash = hash;
        storedUser.password_salt = salt;
        storedUser.modified = new Date().toISOString();

        // Clear any reset tokens
        storedUser.reset_password_key = undefined;
        storedUser.reset_key_expiry = undefined;

        this.users.set(user, storedUser);
    }

    /**
     * Generate a password reset token
     * P3-012-T16: Generates reset key
     */
    async resetPassword(user: string): Promise<PasswordResetToken> {
        const storedUser = this.users.get(user);
        if (!storedUser) {
            throw new Error('User not found');
        }

        // Generate secure random key (cross-platform)
        const key = bytesToHex(getRandomBytes(32));

        // Set expiry (1 hour from now)
        const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        // Store in user record
        storedUser.reset_password_key = key;
        storedUser.reset_key_expiry = expiry;
        this.users.set(user, storedUser);

        // Also store in tokens map for quick lookup
        const token: PasswordResetToken = {
            key,
            expiry,
            user,
        };
        this.resetTokens.set(key, token);

        return token;
    }

    /**
     * Confirm password reset with token
     * P3-012-T17: Sets new password
     */
    async confirmResetPassword(key: string, newPassword: string): Promise<boolean> {
        const token = this.resetTokens.get(key);
        if (!token) {
            throw new Error('Invalid or expired reset key');
        }

        // Check expiry
        if (new Date(token.expiry) < new Date()) {
            this.resetTokens.delete(key);
            throw new Error('Reset key has expired');
        }

        const storedUser = this.users.get(token.user);
        if (!storedUser) {
            throw new Error('User not found');
        }

        // Verify key matches stored key
        if (storedUser.reset_password_key !== key) {
            throw new Error('Invalid reset key');
        }

        // Set new password
        await this.setPassword(token.user, newPassword);

        // Remove token
        this.resetTokens.delete(key);

        return true;
    }

    // ==================== User Status ====================

    /**
     * Enable a user
     * P3-012-T18: Sets enabled=true
     */
    async enableUser(user: string): Promise<User> {
        const storedUser = this.users.get(user);
        if (!storedUser) {
            throw new Error('User not found');
        }

        storedUser.enabled = true;
        storedUser.modified = new Date().toISOString();
        this.users.set(user, storedUser);

        return this.sanitizeUser(storedUser);
    }

    /**
     * Disable a user
     * P3-012-T19: Sets enabled=false
     */
    async disableUser(user: string): Promise<User> {
        const storedUser = this.users.get(user);
        if (!storedUser) {
            throw new Error('User not found');
        }

        storedUser.enabled = false;
        storedUser.modified = new Date().toISOString();
        this.users.set(user, storedUser);

        return this.sanitizeUser(storedUser);
    }

    // ==================== User Preferences ====================

    /**
     * Set a user preference/default
     * P3-012-T20: Stores user preference
     */
    setDefault(user: string, key: string, value: unknown): void {
        if (!this.users.has(user)) {
            throw new Error('User not found');
        }

        let defaults = this.userDefaults.get(user);
        if (!defaults) {
            defaults = new Map();
            this.userDefaults.set(user, defaults);
        }

        defaults.set(key, value);
    }

    /**
     * Get a user preference/default
     * P3-012-T21: Returns user preference
     */
    getDefault(user: string, key: string): unknown {
        if (!this.users.has(user)) {
            throw new Error('User not found');
        }

        const defaults = this.userDefaults.get(user);
        return defaults?.get(key);
    }

    /**
     * Get all preferences for a user
     * P3-012-T22: Returns all preferences
     */
    getDefaults(user: string): Record<string, unknown> {
        if (!this.users.has(user)) {
            throw new Error('User not found');
        }

        const defaults = this.userDefaults.get(user);
        if (!defaults) {
            return {};
        }

        const result: Record<string, unknown> = {};
        for (const [key, value] of Array.from(defaults.entries())) {
            result[key] = value;
        }
        return result;
    }

    // ==================== Utility Methods ====================

    /**
     * Get total user count
     */
    getUserCount(): number {
        return this.users.size;
    }

    /**
     * Check if a user exists
     */
    userExists(id: string): boolean {
        return this.users.has(id);
    }

    /**
     * Update password policy
     */
    setPasswordPolicy(policy: PasswordPolicy): void {
        this.passwordPolicy = policy;
    }

    /**
     * Get current password policy
     */
    getPasswordPolicy(): PasswordPolicy {
        return { ...this.passwordPolicy };
    }
}
