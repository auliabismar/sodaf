/**
 * Method Registry
 *
 * Registry for whitelisted server methods that can be called via the API.
 *
 * @module api/method-registry
 */

import type { WhitelistedMethod, MethodRegistry } from './types';

// =============================================================================
// Method Registry
// =============================================================================

/**
 * Registry of whitelisted methods that can be called via API
 *
 * Methods are registered with their dotted path as the key.
 * Each method specifies its handler function and required permission level.
 */
const methodRegistry: MethodRegistry = new Map();

/**
 * Register a whitelisted method
 *
 * @param path - Dotted method path (e.g., 'frappe.client.get_count')
 * @param method - Method definition
 */
export function registerMethod(path: string, method: WhitelistedMethod): void {
    methodRegistry.set(path, method);
}

/**
 * Get a registered method
 *
 * @param path - Dotted method path
 * @returns WhitelistedMethod or undefined if not found
 */
export function getMethod(path: string): WhitelistedMethod | undefined {
    return methodRegistry.get(path);
}

/**
 * Check if a method is registered
 *
 * @param path - Dotted method path
 * @returns True if method is registered
 */
export function hasMethod(path: string): boolean {
    return methodRegistry.has(path);
}

/**
 * Get all registered method paths
 *
 * @returns Array of registered method paths
 */
export function getAllMethodPaths(): string[] {
    return Array.from(methodRegistry.keys());
}

// =============================================================================
// Built-in Methods
// =============================================================================

// Register default utility methods on module load
registerMethod('frappe.ping', {
    handler: async () => {
        return { message: 'pong' };
    },
    permission: 'guest',
    description: 'Health check endpoint'
});

registerMethod('frappe.get_version', {
    handler: async () => {
        return { version: '0.1.0', framework: 'SODAF' };
    },
    permission: 'guest',
    description: 'Get framework version'
});
