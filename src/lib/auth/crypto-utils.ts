/**
 * Cross-platform Crypto Utilities
 * 
 * Provides cryptographic functions that work in both Node.js and browser environments.
 * Uses Web Crypto API when available, falls back to Node.js crypto.
 */

/**
 * Generate random bytes in a cross-platform way (Node.js and browser)
 */
export function getRandomBytes(length: number): Uint8Array {
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
        // Browser or Node 19+
        const array = new Uint8Array(length);
        globalThis.crypto.getRandomValues(array);
        return array;
    } else if (typeof require !== 'undefined') {
        // Node.js fallback
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const nodeCrypto = require('crypto');
        return new Uint8Array(nodeCrypto.randomBytes(length));
    }
    throw new Error('No crypto implementation available');
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}

/**
 * Securely hash a password using PBKDF2
 * Works in both browser (Web Crypto) and Node.js environments
 */
export async function hashPassword(
    password: string,
    salt?: string,
    iterations: number = 100000
): Promise<{ hash: string; salt: string }> {
    const saltBytes = salt ? hexToBytes(salt) : getRandomBytes(32);
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    // Try Web Crypto first
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
        try {
            // Import key
            const keyMaterial = await globalThis.crypto.subtle.importKey(
                'raw',
                passwordData,
                { name: 'PBKDF2' },
                false,
                ['deriveBits']
            );

            // Derive bits
            const derivedBits = await globalThis.crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: saltBytes,
                    iterations: iterations,
                    hash: 'SHA-512'
                },
                keyMaterial,
                512 // 64 bytes * 8 bits
            );

            return {
                hash: bytesToHex(new Uint8Array(derivedBits)),
                salt: bytesToHex(saltBytes)
            };
        } catch {
            // Fall through to Node.js implementation
        }
    }

    // Node.js fallback
    if (typeof require !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const nodeCrypto = require('crypto');
        return new Promise((resolve, reject) => {
            nodeCrypto.pbkdf2(
                password,
                Buffer.from(saltBytes),
                iterations,
                64,
                'sha512',
                (err: Error | null, derivedKey: Buffer) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            hash: derivedKey.toString('hex'),
                            salt: bytesToHex(saltBytes)
                        });
                    }
                }
            );
        });
    }

    throw new Error('No crypto implementation available for PBKDF2');
}

/**
 * Simple hash function using SHA-256 (cross-platform)
 * Suitable for API key hashing (not passwords)
 */
export async function hashWithSalt(data: string, salt: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);

    // Combine salt and data
    const combined = new Uint8Array(salt.length + dataBytes.length);
    combined.set(salt);
    combined.set(dataBytes, salt.length);

    // Use SubtleCrypto if available
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
        const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', combined);
        return bytesToHex(new Uint8Array(hashBuffer));
    } else if (typeof require !== 'undefined') {
        // Node.js fallback
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const nodeCrypto = require('crypto');
        const hash = nodeCrypto.createHash('sha256');
        hash.update(Buffer.from(combined));
        return hash.digest('hex');
    }
    throw new Error('No crypto implementation available');
}
