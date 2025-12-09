/**
 * Tests for P2-023 Tree DocType Types
 */

import { describe, it, expect } from 'vitest';
import type { TreeDocType, TreeNode, TreeOptions } from '../types';
import { getTreeFields, isTreeField, TREE_FIELDS } from '../schema';
import { SQLGenerator } from '../../migration/sql-generator';
import type { DocType } from '../../doctype/types';

describe('P2-023: Tree DocType Types', () => {
    describe('Types and Interfaces', () => {
        it('P2-023-T1: TreeDocType interface compiles', () => {
            const treeDoc: TreeDocType = {
                name: 'Test Tree',
                module: 'Test',
                fields: [],
                permissions: [],
                is_tree: true,
                nsm_parent_field: 'parent_node',
                tree_options: {
                    root_label: 'Root',
                    expand_all: true
                }
            };
            expect(treeDoc.is_tree).toBe(true);
            expect(treeDoc.nsm_parent_field).toBe('parent_node');
        });

        it('P2-023-T2: TreeNode interface compiles', () => {
            const node: TreeNode = {
                lft: 1,
                rgt: 2,
                is_group: false,
                old_parent: 'OldRoot'
            };
            expect(node.lft).toBe(1);
            expect(node.rgt).toBe(2);
        });

        it('P2-023-T3: TreeOptions interface compiles', () => {
            const options: TreeOptions = {
                root_label: 'Root',
                icon_field: 'icon',
                label_field: 'name'
            };
            expect(options.root_label).toBe('Root');
        });
    });

    describe('Tree Schema Helpers', () => {
        it('should identify tree fields', () => {
            expect(isTreeField('lft')).toBe(true);
            expect(isTreeField('rgt')).toBe(true);
            expect(isTreeField('is_group')).toBe(true);
            expect(isTreeField('some_other_field')).toBe(false);
        });

        it('should return empty list for non-tree doctype', () => {
            const doc: DocType = {
                name: 'Standard Doc',
                module: 'Core',
                fields: [],
                permissions: []
            };
            expect(getTreeFields(doc)).toEqual([]);
        });

        it('should return tree fields for tree doctype', () => {
            const doc: DocType = {
                name: 'Tree Doc',
                module: 'Core',
                fields: [],
                permissions: [],
                is_tree: true
            };
            const fields = getTreeFields(doc);
            expect(fields.length).toBeGreaterThan(0);
            expect(fields.find(f => f.fieldname === 'lft')).toBeDefined();
            expect(fields.find(f => f.fieldname === 'rgt')).toBeDefined();
            expect(fields.find(f => f.fieldname === 'is_group')).toBeDefined();
        });
    });

    describe('SQLGenerator Integration', () => {
        it('P2-023-T4-T7: SQLGenerator should add tree columns', () => {
            const generator = new SQLGenerator();
            const doc: DocType = {
                name: 'Category',
                module: 'Core',
                fields: [
                    { fieldname: 'name', label: 'Name', fieldtype: 'Data', required: true }
                ],
                permissions: [],
                is_tree: true
            };

            const statements = generator.generateCreateTableSQL(doc);
            const createSql = statements[0].sql;

            // Check for presence of tree columns in the SQL
            expect(createSql).toContain('`lft`');
            expect(createSql).toContain('`rgt`');
            expect(createSql).toContain('`is_group`');
            expect(createSql).toContain('`old_parent`');
        });

        it('should NOT add tree columns for standard doctypes', () => {
            const generator = new SQLGenerator();
            const doc: DocType = {
                name: 'Tag',
                module: 'Core',
                fields: [
                    { fieldname: 'name', label: 'Name', fieldtype: 'Data', required: true }
                ],
                permissions: []
            };

            const statements = generator.generateCreateTableSQL(doc);
            const createSql = statements[0].sql;

            expect(createSql).not.toContain('`lft`');
            expect(createSql).not.toContain('`rgt`');
            // is_group might be a common field name, so be careful, but here we haven't added it
            expect(createSql).not.toContain('`is_group`');
        });
    });
});
