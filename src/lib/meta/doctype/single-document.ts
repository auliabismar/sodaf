/**
 * Single DocType Implementation - Settings-style Documents
 *
 * This module implements Single DocTypes (settings-style, one record only).
 * Single DocTypes store values in the tabSingles table as key-value pairs
 * instead of having their own table.
 *
 * Key features:
 * - Name always equals doctype name
 * - Stored in tabSingles table (doctype, fieldname, value)
 * - insert() not allowed - throws SingleDocTypeError
 * - delete() not allowed - throws SingleDocTypeError
 * - save() updates values in Singles table
 *
 * @module meta/doctype/single-document
 */

import { Doc, DuplicateEntryError, DocumentNotFoundError } from '../../core/document/document';
import type { DocumentHooks, DocStatus } from '../../core/document/types';
import type { Database } from '../../core/database';
import type { DocType } from './types';

// =============================================================================
// Error Classes
// =============================================================================

/**
 * Error thrown when attempting invalid operations on Single DocTypes
 */
export class SingleDocTypeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SingleDocTypeError';
    }
}

// =============================================================================
// Types and Interfaces
// =============================================================================

/**
 * Options for creating a SingleDocument
 */
export interface SingleDocumentOptions {
    /** DocType name (required) */
    doctype: string;
    /** Initial field values */
    data?: Record<string, any>;
    /** Document lifecycle hooks */
    hooks?: DocumentHooks;
}

/**
 * Structure of a row in tabSingles
 */
export interface SinglesTableRow {
    doctype: string;
    field: string;
    value: string | null;
}

// =============================================================================
// SingleDocument Class
// =============================================================================

/**
 * SingleDocument class - Settings-style documents with one record only
 *
 * This class extends the base Doc class but overrides CRUD operations
 * to work with the tabSingles table instead of individual tables.
 *
 * Key differences from standard Doc:
 * - Name always equals doctype
 * - Stored in tabSingles table (key-value pairs), not tab{DocType}
 * - insert() throws SingleDocTypeError
 * - delete() throws SingleDocTypeError
 * - save() updates values in Singles table
 *
 * @example
 * ```typescript
 * // Load existing single doc
 * const settings = await SingleDocument.load('System Settings', db);
 * settings.set('allow_login_using_mobile_number', 1);
 * await settings.save();
 *
 * // Or get/set individual values
 * const value = await get_single_value(db, 'System Settings', 'allow_login_using_mobile_number');
 * await set_single_value(db, 'System Settings', 'enable_password_policy', 1);
 * ```
 */
export class SingleDocument extends Doc {
    /**
     * Flag indicating this is a single document
     */
    public readonly __issingle: boolean = true;

    /**
     * Original field values loaded from database
     */
    protected __original_values: Record<string, any> = {};

    /**
     * Constructor
     * @param data Document data including doctype
     * @param db Database instance
     * @param hooks Optional document hooks
     */
    constructor(
        data: { doctype: string } & Record<string, any>,
        db: Database,
        hooks?: DocumentHooks
    ) {
        // For single docs, name always equals doctype
        const docData = {
            ...data,
            name: data.doctype
        };

        super(docData, db, hooks);

        // Mark as not new since singles always "exist"
        this.__isnew = false;
        this.__unsaved = false;
    }

    // =========================================================================
    // Overridden CRUD Operations
    // =========================================================================

    /**
     * Insert is not allowed for Single DocTypes
     * @throws SingleDocTypeError always
     */
    async insert(): Promise<string> {
        throw new SingleDocTypeError(
            `Cannot insert Single DocType '${this.doctype}'. Single DocTypes do not support insert operation.`
        );
    }

    /**
     * Delete is not allowed for Single DocTypes
     * @throws SingleDocTypeError always
     */
    async delete(): Promise<void> {
        throw new SingleDocTypeError(
            `Cannot delete Single DocType '${this.doctype}'. Single DocTypes do not support delete operation.`
        );
    }

    /**
     * Save the single document to tabSingles
     * Updates values as key-value pairs in the Singles table
     */
    async save(): Promise<void> {
        if (!this.__unsaved) {
            return; // No changes to save
        }

        // Execute validate hook
        if (this.hooks?.validate) {
            await this.hooks.validate.call(this);
        }

        // Execute before_save hook
        if (this.hooks?.before_save) {
            await this.hooks.before_save.call(this);
        }

        try {
            // Update modified timestamp
            this.modified = new Date();
            this.modified_by = 'Administrator';

            // Get all field values to save
            const values: Record<string, any> = {};
            for (const [key, val] of Object.entries(this)) {
                if (typeof val !== 'function' && !key.startsWith('__')) {
                    values[key] = val;
                }
            }

            // Remove metadata fields that don't go in Singles table
            const excludeFields = ['name', 'doctype', 'db', 'hooks', '__isnew', '__unsaved', '__issingle', '__original_values', '__doc_before_save'];

            // Ensure Singles table exists
            await this.ensureSinglesTable();

            // Update each field as a separate row in tabSingles
            for (const [field, value] of Object.entries(values)) {
                if (excludeFields.some(f => field === f || field.startsWith('__'))) {
                    continue;
                }

                // Convert value to string for storage
                let stringValue: string | null;

                if (value === null || value === undefined) {
                    stringValue = null;
                } else if (value instanceof Date) {
                    stringValue = value.toISOString().replace('T', ' ').substring(0, 19);
                } else if (typeof value === 'object') {
                    stringValue = JSON.stringify(value);
                } else {
                    stringValue = String(value);
                }

                // Upsert the value
                // Handle both direct Database and TestDatabase interfaces
                if ((this.db as any).getDatabase && typeof (this.db as any).getDatabase === 'function') {
                    // TestDatabase wrapper - use run method directly
                    await (this.db as any).run(
                        'INSERT OR REPLACE INTO tabSingles (doctype, field, value) VALUES (?, ?, ?)',
                        [this.doctype, field, stringValue]
                    );
                } else {
                    // Direct Database interface
                    await this.db.run(
                        'INSERT OR REPLACE INTO tabSingles (doctype, field, value) VALUES (?, ?, ?)',
                        [this.doctype, field, stringValue]
                    );
                }
            }

            // Mark as saved
            this.__unsaved = false;
            this.__original_values = { ...values };

            // Execute on_update hook
            if (this.hooks?.on_update) {
                await this.hooks.on_update.call(this);
            }

            // Execute after_save hook
            if (this.hooks?.after_save) {
                await this.hooks.after_save.call(this);
            }
        } catch (error) {
            throw new Error(`Failed to save single document '${this.doctype}': ${(error as Error).message}`);
        }
    }

    /**
     * Reload the single document from tabSingles
     */
    async reload(): Promise<void> {
        try {
            // Ensure Singles table exists
            await this.ensureSinglesTable();

            // Get all values for this doctype from Singles table
            // Handle both direct Database and TestDatabase interfaces
            let rows: SinglesTableRow[];
            if ((this.db as any).getDatabase && typeof (this.db as any).getDatabase === 'function') {
                // TestDatabase wrapper - use sql method instead of direct db access
                try {
                    rows = await (this.db as any).sql(
                        'SELECT field, value FROM tabSingles WHERE doctype = ?',
                        [this.doctype]
                    ) as SinglesTableRow[];
                } catch (error) {
                    // Fallback to direct db access if sql method fails
                    const db = (this.db as any).getDatabase();
                    const stmt = db.prepare(
                        'SELECT field, value FROM tabSingles WHERE doctype = ?'
                    );
                    rows = stmt.all(this.doctype) as SinglesTableRow[];
                }
            } else {
                // Direct Database interface
                rows = await this.db.sql(
                    'SELECT field, value FROM tabSingles WHERE doctype = ?',
                    [this.doctype]
                ) as SinglesTableRow[];
            }

            // Build document from rows
            const data: Record<string, any> = {};
            for (const row of rows) {
                data[row.field] = this.parseValue(row.value);
            }

            // Update this instance with loaded values
            for (const [field, value] of Object.entries(data)) {
                (this as any)[field] = value;
            }
            Object.assign(this, data);

            // Restore standard Date fields
            if (typeof this.creation === 'string') {
                this.creation = new Date(this.creation);
            }
            if (typeof this.modified === 'string') {
                this.modified = new Date(this.modified);
            }

            // Store original values
            this.__original_values = { ...data };
            this.__unsaved = false;

            // Execute on_reload hook
            if (this.hooks?.on_reload) {
                await this.hooks.on_reload.call(this);
            }
        } catch (error) {
            throw new Error(`Failed to reload single document '${this.doctype}': ${(error as Error).message}`);
        }
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    /**
     * Ensure the Singles table exists
     */
    private async ensureSinglesTable(): Promise<void> {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS tabSingles (
                doctype TEXT NOT NULL,
                field TEXT NOT NULL,
                value TEXT,
                PRIMARY KEY (doctype, field)
            )
        `;

        // Handle both direct Database and TestDatabase interfaces
        if ((this.db as any).getDatabase && typeof (this.db as any).getDatabase === 'function') {
            await (this.db as any).run(createTableSQL);
        } else {
            await this.db.run(createTableSQL);
        }
    }

    /**
     * Parse a string value from the Singles table
     * @param value String value from database
     * @returns Parsed value
     */
    private parseValue(value: string | null): any {
        if (value === null || value === undefined) {
            return null;
        }

        // Try to parse as JSON (for objects/arrays)
        if (value.startsWith('{') || value.startsWith('[')) {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }

        // Try to parse as number
        if (/^-?\d+$/.test(value)) {
            return parseInt(value, 10);
        }
        if (/^-?\d+\.\d+$/.test(value)) {
            return parseFloat(value);
        }

        // Return as string
        return value;
    }

    /**
     * Override set to mark document as unsaved
     */
    set(fieldname: string, value: any): void {
        if ((this as any)[fieldname] !== value) {
            (this as any)[fieldname] = value;
            this.__unsaved = true;
        }
    }

    // =========================================================================
    // Static Factory Methods
    // =========================================================================

    /**
     * Load a single document from the database
     * @param doctype DocType name
     * @param db Database instance
     * @param hooks Optional document hooks
     * @returns Promise resolving to SingleDocument instance
     */
    static async load(
        doctype: string,
        db: Database,
        hooks?: DocumentHooks
    ): Promise<SingleDocument> {
        const doc = new SingleDocument({ doctype }, db, hooks);
        await doc.reload();
        return doc;
    }

    /**
     * Check if any values exist for this single doctype
     * @param doctype DocType name
     * @param db Database instance
     * @returns Promise resolving to true if values exist
     */
    static async exists(doctype: string, db: Database): Promise<boolean> {
        try {
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS tabSingles (
                    doctype TEXT NOT NULL,
                    field TEXT NOT NULL,
                    value TEXT,
                    PRIMARY KEY (doctype, field)
                )
            `;

            if (typeof (db as any).getDatabase === 'function') {
                await (db as any).run(createTableSQL);
                const result = await (db as any).sql(
                    'SELECT 1 FROM tabSingles WHERE doctype = ? LIMIT 1',
                    [doctype]
                );
                return result.length > 0;
            } else {
                await db.run(createTableSQL);
                const result = await db.sql(
                    'SELECT 1 FROM tabSingles WHERE doctype = ? LIMIT 1',
                    [doctype]
                );
                return result.length > 0;
            }
        } catch {
            return false;
        }
    }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get a single value from a Single DocType
 *
 * @param db Database instance
 * @param doctype Single DocType name
 * @param field Field name to retrieve
 * @returns Promise resolving to the field value, or null if not found
 */
export async function get_single_value(
    db: Database,
    doctype: string,
    field: string
): Promise<any> {
    try {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS tabSingles (
                doctype TEXT NOT NULL,
                field TEXT NOT NULL,
                value TEXT,
                PRIMARY KEY (doctype, field)
            )
        `;

        if (typeof (db as any).getDatabase === 'function') {
            await (db as any).run(createTableSQL);
        } else {
            await db.run(createTableSQL);
        }

        const result = await db.sql(
            'SELECT value FROM tabSingles WHERE doctype = ? AND field = ?',
            [doctype, field]
        ) as { value: string | null }[];

        if (result.length === 0) {
            return null;
        }

        const value = result[0].value;

        // Parse the value
        if (value === null || value === undefined) {
            return null;
        }

        // Try to parse as JSON
        if (value.startsWith('{') || value.startsWith('[')) {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }

        // Try to parse as number
        if (/^-?\d+$/.test(value)) {
            return parseInt(value, 10);
        }
        if (/^-?\d+\.\d+$/.test(value)) {
            return parseFloat(value);
        }

        return value;
    } catch {
        return null;
    }
}

/**
 * Set a single value in a Single DocType
 *
 * @param db Database instance
 * @param doctype Single DocType name
 * @param field Field name to set
 * @param value Value to set
 */
export async function set_single_value(
    db: Database,
    doctype: string,
    field: string,
    value: any
): Promise<void> {
    try {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS tabSingles (
                doctype TEXT NOT NULL,
                field TEXT NOT NULL,
                value TEXT,
                PRIMARY KEY (doctype, field)
            )
        `;

        if (typeof (db as any).getDatabase === 'function') {
            await (db as any).run(createTableSQL);
        } else {
            await db.run(createTableSQL);
        }

        // Convert value to string for storage
        const stringValue = value === null || value === undefined
            ? null
            : typeof value === 'object'
                ? JSON.stringify(value)
                : String(value);

        // Upsert the value
        if (typeof (db as any).getDatabase === 'function') {
            await (db as any).run(
                'INSERT OR REPLACE INTO tabSingles (doctype, field, value) VALUES (?, ?, ?)',
                [doctype, field, stringValue]
            );

            // Update modified timestamp
            const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
            await (db as any).run(
                'INSERT OR REPLACE INTO tabSingles (doctype, field, value) VALUES (?, ?, ?)',
                [doctype, 'modified', now]
            );
            await (db as any).run(
                'INSERT OR REPLACE INTO tabSingles (doctype, field, value) VALUES (?, ?, ?)',
                [doctype, 'modified_by', 'Administrator']
            );
        } else {
            await db.run(
                'INSERT OR REPLACE INTO tabSingles (doctype, field, value) VALUES (?, ?, ?)',
                [doctype, field, stringValue]
            );

            // Update modified timestamp
            const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
            await db.run(
                'INSERT OR REPLACE INTO tabSingles (doctype, field, value) VALUES (?, ?, ?)',
                [doctype, 'modified', now]
            );
            await db.run(
                'INSERT OR REPLACE INTO tabSingles (doctype, field, value) VALUES (?, ?, ?)',
                [doctype, 'modified_by', 'Administrator']
            );
        }
    } catch (error) {
        throw new Error(`Failed to set single value: ${(error as Error).message}`);
    }
}

/**
 * Check if a DocType is a Single DocType
 *
 * @param doctype DocType definition
 * @returns True if doctype.issingle is truthy
 */
export function is_single_doctype(doctype: DocType): boolean {
    return doctype.issingle === true;
}

/**
 * Get all values from a Single DocType as an object
 *
 * @param db Database instance
 * @param doctype Single DocType name
 * @returns Promise resolving to object with all field values
 */
export async function get_single_doc(
    db: Database,
    doctype: string
): Promise<Record<string, any>> {
    try {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS tabSingles (
                doctype TEXT NOT NULL,
                field TEXT NOT NULL,
                value TEXT,
                PRIMARY KEY (doctype, field)
            )
        `;

        // Handle both direct Database and TestDatabase interfaces
        if ((db as any).getDatabase && typeof (db as any).getDatabase === 'function') {
            await (db as any).run(createTableSQL);
        } else {
            await db.run(createTableSQL);
        }

        const rows = await db.sql(
            'SELECT field, value FROM tabSingles WHERE doctype = ?',
            [doctype]
        ) as { field: string; value: string | null }[];

        const result: Record<string, any> = {
            doctype,
            name: doctype
        };

        for (const row of rows) {
            const value = row.value;

            // Parse the value
            if (value === null || value === undefined) {
                result[row.field] = null;
                continue;
            }

            // Try to parse as JSON
            if (value.startsWith('{') || value.startsWith('[')) {
                try {
                    result[row.field] = JSON.parse(value);
                    continue;
                } catch {
                    // Fall through to other parsers
                }
            }

            // Try to parse as number
            if (/^-?\d+$/.test(value)) {
                result[row.field] = parseInt(value, 10);
                continue;
            }
            if (/^-?\d+\.\d+$/.test(value)) {
                result[row.field] = parseFloat(value);
                continue;
            }

            result[row.field] = value;
        }

        return result;
    } catch (error) {
        throw new Error(`Failed to get single doc: ${(error as Error).message}`);
    }
}