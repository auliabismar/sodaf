/**
 * Unit Tests for P2-015: Single DocType Implementation
 *
 * Tests cover all 12 test cases from the task specification:
 * - Singles table storage
 * - Name handling
 * - CRUD restrictions
 * - get_single_value / set_single_value helpers
 * - API integration (mocked)
 * - Hooks execution
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    SingleDocument,
    SingleDocTypeError,
    get_single_value,
    set_single_value,
    is_single_doctype,
    get_single_doc
} from '../single-document';
import type { DocType } from '../types';
import { SQLiteDatabase } from '../../../core/database/sqlite-database';

// =============================================================================
// Test Setup
// =============================================================================

describe('P2-015: Single DocType Implementation', () => {
    let db: SQLiteDatabase;

    beforeEach(() => {
        // Create fresh in-memory database for each test
        db = new SQLiteDatabase({ path: ':memory:' });
    });

    afterEach(() => {
        // Close database connection
        db.close();
    });

    // =========================================================================
    // P2-015-T1: Single DocType storage
    // =========================================================================

    describe('P2-015-T1: Single DocType uses Singles table storage', () => {
        it('should store values in tabSingles table, not tab{DocType}', async () => {
            const doc = new SingleDocument({ doctype: 'System Settings' }, db);
            doc.set('enable_password_policy', 1);
            doc.set('session_expiry', '06:00:00');

            await doc.save();

            // Verify values are in tabSingles
            const rows = await db.sql(
                `SELECT * FROM tabSingles WHERE doctype = ?`,
                ['System Settings']
            );

            expect(rows.length).toBeGreaterThan(0);
            expect(rows.some((r: any) => r.field === 'enable_password_policy')).toBe(true);
            expect(rows.some((r: any) => r.field === 'session_expiry')).toBe(true);

            // Verify no separate table was created
            const tables = await db.sql(
                `SELECT name FROM sqlite_master WHERE type='table' AND name='tabSystem Settings'`
            );
            expect(tables.length).toBe(0);
        });

        it('should use key-value structure (doctype, field, value)', async () => {
            await set_single_value(db, 'App Settings', 'app_name', 'SODAF');
            await set_single_value(db, 'App Settings', 'version', '1.0.0');

            const rows = await db.sql(
                `SELECT doctype, field, value FROM tabSingles WHERE doctype = ?`,
                ['App Settings']
            );

            const appNameRow = rows.find((r: any) => r.field === 'app_name');
            const versionRow = rows.find((r: any) => r.field === 'version');

            expect(appNameRow).toBeDefined();
            expect(appNameRow!.value).toBe('SODAF');
            expect(versionRow).toBeDefined();
            expect(versionRow!.value).toBe('1.0.0');
        });
    });

    // =========================================================================
    // P2-015-T2: Single DocType name equals doctype
    // =========================================================================

    describe('P2-015-T2: Single DocType name equals doctype', () => {
        it('should have name equal to doctype', () => {
            const doc = new SingleDocument({ doctype: 'Website Settings' }, db);

            expect(doc.name).toBe('Website Settings');
            expect(doc.doctype).toBe('Website Settings');
        });

        it('should ignore provided name and use doctype', () => {
            const doc = new SingleDocument(
                { doctype: 'Email Settings', name: 'some-other-name' },
                db
            );

            expect(doc.name).toBe('Email Settings');
        });

        it('should maintain name after save', async () => {
            const doc = new SingleDocument({ doctype: 'Print Settings' }, db);
            doc.set('paper_size', 'A4');
            await doc.save();

            expect(doc.name).toBe('Print Settings');
        });
    });

    // =========================================================================
    // P2-015-T3: get_doc(doctype) no name returns single doc
    // =========================================================================

    describe('P2-015-T3: get_doc(doctype) no name returns single doc', () => {
        it('should load single doc by doctype only using SingleDocument.load()', async () => {
            // First save some values
            await set_single_value(db, 'System Settings', 'enable_login', 1);
            await set_single_value(db, 'System Settings', 'login_page', '/login');

            // Load using static method (similar to get_doc)
            const doc = await SingleDocument.load('System Settings', db);

            expect(doc.name).toBe('System Settings');
            expect(doc.doctype).toBe('System Settings');
            expect(doc.get('enable_login')).toBe(1);
            expect(doc.get('login_page')).toBe('/login');
        });

        it('should return empty doc if no values exist', async () => {
            const doc = await SingleDocument.load('New Settings', db);

            expect(doc.name).toBe('New Settings');
            expect(doc.doctype).toBe('New Settings');
        });

        it('should support get_single_doc helper', async () => {
            await set_single_value(db, 'Site Settings', 'site_name', 'My Site');
            await set_single_value(db, 'Site Settings', 'tagline', 'Welcome');

            const docObj = await get_single_doc(db, 'Site Settings');

            expect(docObj.name).toBe('Site Settings');
            expect(docObj.doctype).toBe('Site Settings');
            expect(docObj.site_name).toBe('My Site');
            expect(docObj.tagline).toBe('Welcome');
        });
    });

    // =========================================================================
    // P2-015-T4: save() updates values in Singles table
    // =========================================================================

    describe('P2-015-T4: save() updates values in Singles table', () => {
        it('should update existing values on save', async () => {
            // Set initial value
            await set_single_value(db, 'Test Settings', 'value1', 'initial');

            // Load and update
            const doc = await SingleDocument.load('Test Settings', db);
            doc.set('value1', 'updated');
            await doc.save();

            // Verify update
            const value = await get_single_value(db, 'Test Settings', 'value1');
            expect(value).toBe('updated');
        });

        it('should add new values on save', async () => {
            const doc = new SingleDocument({ doctype: 'New Test' }, db);
            doc.set('field1', 'value1');
            doc.set('field2', 'value2');
            await doc.save();

            expect(await get_single_value(db, 'New Test', 'field1')).toBe('value1');
            expect(await get_single_value(db, 'New Test', 'field2')).toBe('value2');
        });

        it('should update modified timestamp on save', async () => {
            const doc = new SingleDocument({ doctype: 'Timestamp Test' }, db);
            doc.set('test', 1);
            await doc.save();

            const modified = await get_single_value(db, 'Timestamp Test', 'modified');
            expect(modified).toBeTruthy();
            expect(typeof modified).toBe('string');
        });

        it('should not save if no changes', async () => {
            const doc = await SingleDocument.load('No Changes', db);
            // No changes made

            const saveSpy = vi.spyOn(db, 'run');
            await doc.save();

            // Should not have called db.run since no changes
            expect(saveSpy).not.toHaveBeenCalled();
            saveSpy.mockRestore();
        });
    });

    // =========================================================================
    // P2-015-T5: No insert for Single
    // =========================================================================

    describe('P2-015-T5: No insert for Single', () => {
        it('should throw SingleDocTypeError on insert()', async () => {
            const doc = new SingleDocument({ doctype: 'Cannot Insert' }, db);

            await expect(doc.insert()).rejects.toThrow(SingleDocTypeError);
        });

        it('should include doctype name in error message', async () => {
            const doc = new SingleDocument({ doctype: 'My Settings' }, db);

            await expect(doc.insert()).rejects.toThrow("Cannot insert Single DocType 'My Settings'");
        });

        it('should not modify database on failed insert', async () => {
            const doc = new SingleDocument({ doctype: 'Failed Insert' }, db);
            doc.set('test', 'value');

            try {
                await doc.insert();
            } catch (e) {
                // Expected
            }

            const value = await get_single_value(db, 'Failed Insert', 'test');
            expect(value).toBeNull();
        });
    });

    // =========================================================================
    // P2-015-T6: No delete for Single
    // =========================================================================

    describe('P2-015-T6: No delete for Single', () => {
        it('should throw SingleDocTypeError on delete()', async () => {
            const doc = new SingleDocument({ doctype: 'Cannot Delete' }, db);

            await expect(doc.delete()).rejects.toThrow(SingleDocTypeError);
        });

        it('should include doctype name in error message', async () => {
            const doc = new SingleDocument({ doctype: 'Important Settings' }, db);

            await expect(doc.delete()).rejects.toThrow("Cannot delete Single DocType 'Important Settings'");
        });

        it('should not modify database on failed delete', async () => {
            await set_single_value(db, 'Protected Settings', 'data', 'important');

            const doc = await SingleDocument.load('Protected Settings', db);

            try {
                await doc.delete();
            } catch (e) {
                // Expected
            }

            const value = await get_single_value(db, 'Protected Settings', 'data');
            expect(value).toBe('important');
        });
    });

    // =========================================================================
    // P2-015-T7: get_single_value(doctype, field)
    // =========================================================================

    describe('P2-015-T7: get_single_value returns field value', () => {
        it('should return string value', async () => {
            await set_single_value(db, 'Test', 'string_field', 'hello');

            const value = await get_single_value(db, 'Test', 'string_field');
            expect(value).toBe('hello');
        });

        it('should return integer value', async () => {
            await set_single_value(db, 'Test', 'int_field', 42);

            const value = await get_single_value(db, 'Test', 'int_field');
            expect(value).toBe(42);
        });

        it('should return float value', async () => {
            await set_single_value(db, 'Test', 'float_field', 3.14);

            const value = await get_single_value(db, 'Test', 'float_field');
            expect(value).toBe(3.14);
        });

        it('should return object value (JSON parsed)', async () => {
            await set_single_value(db, 'Test', 'obj_field', { key: 'value' });

            const value = await get_single_value(db, 'Test', 'obj_field');
            expect(value).toEqual({ key: 'value' });
        });

        it('should return null for non-existent field', async () => {
            const value = await get_single_value(db, 'NonExistent', 'no_field');
            expect(value).toBeNull();
        });

        it('should return null for non-existent doctype', async () => {
            const value = await get_single_value(db, 'NoSuchDocType', 'field');
            expect(value).toBeNull();
        });
    });

    // =========================================================================
    // P2-015-T8: set_single_value(doctype, field, value)
    // =========================================================================

    describe('P2-015-T8: set_single_value updates field value', () => {
        it('should set new value', async () => {
            await set_single_value(db, 'Settings', 'new_field', 'new_value');

            const value = await get_single_value(db, 'Settings', 'new_field');
            expect(value).toBe('new_value');
        });

        it('should update existing value', async () => {
            await set_single_value(db, 'Settings', 'field', 'old');
            await set_single_value(db, 'Settings', 'field', 'new');

            const value = await get_single_value(db, 'Settings', 'field');
            expect(value).toBe('new');
        });

        it('should handle null value', async () => {
            await set_single_value(db, 'Settings', 'nullable', 'value');
            await set_single_value(db, 'Settings', 'nullable', null);

            const value = await get_single_value(db, 'Settings', 'nullable');
            expect(value).toBeNull();
        });

        it('should update modified timestamp', async () => {
            await set_single_value(db, 'Settings', 'field', 'value');

            const modified = await get_single_value(db, 'Settings', 'modified');
            expect(modified).toBeTruthy();
        });

        it('should update modified_by', async () => {
            await set_single_value(db, 'Settings', 'field', 'value');

            const modifiedBy = await get_single_value(db, 'Settings', 'modified_by');
            expect(modifiedBy).toBe('Administrator');
        });
    });

    // =========================================================================
    // P2-015-T9: API GET /api/resource/Settings returns single doc
    // =========================================================================

    describe('P2-015-T9: API GET returns single doc directly', () => {
        // Note: This tests the data structure that would be returned by API
        // The actual API route is handled by generateSingleRoutes in APIGenerator

        it('should return document with all fields including name and doctype', async () => {
            await set_single_value(db, 'API Settings', 'field1', 'value1');
            await set_single_value(db, 'API Settings', 'field2', 'value2');

            const doc = await get_single_doc(db, 'API Settings');

            expect(doc.name).toBe('API Settings');
            expect(doc.doctype).toBe('API Settings');
            expect(doc.field1).toBe('value1');
            expect(doc.field2).toBe('value2');
        });

        it('should not return list format for single doctype', async () => {
            await set_single_value(db, 'Single API', 'data', 'test');

            const doc = await get_single_doc(db, 'Single API');

            // Should be an object, not an array
            expect(Array.isArray(doc)).toBe(false);
            expect(typeof doc).toBe('object');
        });
    });

    // =========================================================================
    // P2-015-T10: API PUT /api/resource/Settings updates single doc
    // =========================================================================

    describe('P2-015-T10: API PUT updates single doc', () => {
        // Note: This tests the update behavior that would be triggered by API
        // The actual API route is handled by generateSingleRoutes in APIGenerator

        it('should update multiple fields at once via SingleDocument.save()', async () => {
            await set_single_value(db, 'Update Test', 'field1', 'old1');
            await set_single_value(db, 'Update Test', 'field2', 'old2');

            const doc = await SingleDocument.load('Update Test', db);
            doc.set('field1', 'new1');
            doc.set('field2', 'new2');
            await doc.save();

            expect(await get_single_value(db, 'Update Test', 'field1')).toBe('new1');
            expect(await get_single_value(db, 'Update Test', 'field2')).toBe('new2');
        });

        it('should preserve unmodified fields', async () => {
            await set_single_value(db, 'Preserve Test', 'unchanged', 'keep');
            await set_single_value(db, 'Preserve Test', 'changed', 'old');

            const doc = await SingleDocument.load('Preserve Test', db);
            doc.set('changed', 'new');
            await doc.save();

            expect(await get_single_value(db, 'Preserve Test', 'unchanged')).toBe('keep');
            expect(await get_single_value(db, 'Preserve Test', 'changed')).toBe('new');
        });
    });

    // =========================================================================
    // P2-015-T11: No list API for Single - GET list returns single doc
    // =========================================================================

    describe('P2-015-T11: GET list returns single doc (not list)', () => {
        it('should return single document object, not array', async () => {
            await set_single_value(db, 'List Test', 'data', 'value');

            const doc = await get_single_doc(db, 'List Test');

            // Verify not a list
            expect(Array.isArray(doc)).toBe(false);
            expect(doc.data).toBe('value');
        });

        it('should have only one record per doctype', async () => {
            await set_single_value(db, 'One Record', 'field', 'first');
            await set_single_value(db, 'One Record', 'field', 'second');

            const value = await get_single_value(db, 'One Record', 'field');
            expect(value).toBe('second'); // Should be updated, not appended
        });
    });

    // =========================================================================
    // P2-015-T12: Hooks work on Single (on_update, validate called)
    // =========================================================================

    describe('P2-015-T12: Hooks work on Single', () => {
        it('should call validate hook on save', async () => {
            const validateFn = vi.fn();

            const doc = new SingleDocument(
                { doctype: 'Hook Test' },
                db,
                { validate: validateFn }
            );
            doc.set('field', 'value');
            await doc.save();

            expect(validateFn).toHaveBeenCalled();
        });

        it('should call before_save hook on save', async () => {
            const beforeSaveFn = vi.fn();

            const doc = new SingleDocument(
                { doctype: 'Before Save Test' },
                db,
                { before_save: beforeSaveFn }
            );
            doc.set('field', 'value');
            await doc.save();

            expect(beforeSaveFn).toHaveBeenCalled();
        });

        it('should call on_update hook on save', async () => {
            const onUpdateFn = vi.fn();

            const doc = new SingleDocument(
                { doctype: 'On Update Test' },
                db,
                { on_update: onUpdateFn }
            );
            doc.set('field', 'value');
            await doc.save();

            expect(onUpdateFn).toHaveBeenCalled();
        });

        it('should call after_save hook on save', async () => {
            const afterSaveFn = vi.fn();

            const doc = new SingleDocument(
                { doctype: 'After Save Test' },
                db,
                { after_save: afterSaveFn }
            );
            doc.set('field', 'value');
            await doc.save();

            expect(afterSaveFn).toHaveBeenCalled();
        });

        it('should call on_reload hook on reload', async () => {
            const onReloadFn = vi.fn();

            await set_single_value(db, 'Reload Hook', 'field', 'value');

            const doc = new SingleDocument(
                { doctype: 'Reload Hook' },
                db,
                { on_reload: onReloadFn }
            );
            await doc.reload();

            expect(onReloadFn).toHaveBeenCalled();
        });

        it('should execute hooks in correct order', async () => {
            const order: string[] = [];

            const doc = new SingleDocument(
                { doctype: 'Order Test' },
                db,
                {
                    validate: () => { order.push('validate'); },
                    before_save: () => { order.push('before_save'); },
                    on_update: () => { order.push('on_update'); },
                    after_save: () => { order.push('after_save'); }
                }
            );
            doc.set('field', 'value');
            await doc.save();

            expect(order).toEqual(['validate', 'before_save', 'on_update', 'after_save']);
        });
    });

    // =========================================================================
    // Additional Tests: is_single_doctype helper
    // =========================================================================

    describe('is_single_doctype helper', () => {
        it('should return true for doctype with issingle=true', () => {
            const doctype: DocType = {
                name: 'System Settings',
                module: 'Core',
                issingle: true,
                fields: [],
                permissions: []
            };

            expect(is_single_doctype(doctype)).toBe(true);
        });

        it('should return false for doctype with issingle=false', () => {
            const doctype: DocType = {
                name: 'User',
                module: 'Core',
                issingle: false,
                fields: [],
                permissions: []
            };

            expect(is_single_doctype(doctype)).toBe(false);
        });

        it('should return false for doctype without issingle property', () => {
            const doctype: DocType = {
                name: 'Item',
                module: 'Stock',
                fields: [],
                permissions: []
            };

            expect(is_single_doctype(doctype)).toBe(false);
        });
    });

    // =========================================================================
    // Additional Tests: SingleDocument.exists()
    // =========================================================================

    describe('SingleDocument.exists()', () => {
        it('should return true if values exist', async () => {
            await set_single_value(db, 'Exists Test', 'field', 'value');

            const exists = await SingleDocument.exists('Exists Test', db);
            expect(exists).toBe(true);
        });

        it('should return false if no values exist', async () => {
            const exists = await SingleDocument.exists('No Exist Test', db);
            expect(exists).toBe(false);
        });
    });

    // =========================================================================
    // Additional Tests: Error handling
    // =========================================================================

    describe('Error handling', () => {
        it('should have correct error name for SingleDocTypeError', () => {
            const error = new SingleDocTypeError('test');
            expect(error.name).toBe('SingleDocTypeError');
        });

        it('should have __issingle flag set to true', () => {
            const doc = new SingleDocument({ doctype: 'Flag Test' }, db);
            expect(doc.__issingle).toBe(true);
        });
    });
});
