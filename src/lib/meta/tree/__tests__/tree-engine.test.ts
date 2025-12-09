import { describe, it, expect } from 'vitest';
import { SQLiteDatabase } from '../../../core/database/sqlite-database';
import { TreeEngine } from '../tree-engine';
import type { TreeDocType } from '../types';

describe('TreeEngine (Nested Set Model)', () => {

    const baseDocType: TreeDocType = {
        name: 'TestTree',
        module: 'Test',
        is_tree: true,
        nsm_parent_field: 'parent_node',
        fields: [
            { fieldname: 'name', fieldtype: 'Data', label: 'Name' },
            { fieldname: 'parent_node', fieldtype: 'Data', label: 'Parent' },
            { fieldname: 'lft', fieldtype: 'Int', label: 'Left', hidden: true },
            { fieldname: 'rgt', fieldtype: 'Int', label: 'Right', hidden: true },
            { fieldname: 'is_group', fieldtype: 'Check', label: 'Is Group' }
        ]
    } as any;

    async function setupTreeTest() {
        // Generate unique suffix
        const suffix = Math.random().toString(36).substring(7);
        const doctypeName = `TestTree_${suffix}`;
        const tableName = `tab${doctypeName}`;
        const dynamicDocType = { ...baseDocType, name: doctypeName };

        const db = new SQLiteDatabase({ path: ':memory:' });

        // Create table
        await db.run(`
            CREATE TABLE \`${tableName}\` (
                name TEXT PRIMARY KEY,
                parent_node TEXT,
                lft INTEGER DEFAULT 0,
                rgt INTEGER DEFAULT 0,
                is_group INTEGER DEFAULT 0,
                creation TEXT,
                modified TEXT,
                modified_by TEXT,
                owner TEXT,
                docstatus INTEGER DEFAULT 0
            )
        `);

        const engine = new TreeEngine(db, dynamicDocType);
        return { db, engine, tableName };
    }

    async function insertRaw(db: SQLiteDatabase, tableName: string, name: string, parent: string | null = null) {
        await db.run(
            `INSERT INTO \`${tableName}\` (name, parent_node) VALUES (?, ?)`,
            [name, parent]
        );
    }

    async function getNode(db: SQLiteDatabase, tableName: string, name: string) {
        return (await db.sql(`SELECT * FROM \`${tableName}\` WHERE name = ?`, [name]))[0];
    }

    // P2-024-T9: addNode
    describe('addNode / onInsert', () => {
        it('should insert root node with correct bounds', async () => {
            const { db, engine, tableName } = await setupTreeTest();
            await insertRaw(db, tableName, 'Root');
            await engine.onInsert({ name: 'Root', parent_node: null });

            const root = await getNode(db, tableName, 'Root');
            expect(root.lft).toBe(1);
            expect(root.rgt).toBe(2);
            expect(root.parent_node).toBeNull();
        });

        it('should insert child node and update parent bounds', async () => {
            const { db, engine, tableName } = await setupTreeTest();
            await insertRaw(db, tableName, 'Root');
            await engine.onInsert({ name: 'Root', parent_node: null });

            await insertRaw(db, tableName, 'Child', 'Root');
            await engine.onInsert({ name: 'Child', parent_node: 'Root' });

            const root = await getNode(db, tableName, 'Root');
            const child = await getNode(db, tableName, 'Child');

            expect(root.lft).toBe(1);
            expect(root.rgt).toBe(4);
            expect(root.is_group).toBe(1);

            expect(child.lft).toBe(2);
            expect(child.rgt).toBe(3);
            expect(child.parent_node).toBe('Root');
        });

        it('should handle multiple children at same level', async () => {
            const { db, engine, tableName } = await setupTreeTest();
            await insertRaw(db, tableName, 'Root');
            await engine.onInsert({ name: 'Root', parent_node: null });

            await insertRaw(db, tableName, 'C1', 'Root');
            await engine.onInsert({ name: 'C1', parent_node: 'Root' });

            await insertRaw(db, tableName, 'C2', 'Root');
            await engine.onInsert({ name: 'C2', parent_node: 'Root' });

            const root = await getNode(db, tableName, 'Root');
            const c1 = await getNode(db, tableName, 'C1');
            const c2 = await getNode(db, tableName, 'C2');

            expect(root.lft).toBe(1);
            expect(root.rgt).toBe(6);
            expect(c1.lft).toBe(2);
            expect(c1.rgt).toBe(3);
            expect(c2.lft).toBe(4);
            expect(c2.rgt).toBe(5);
        });

        it('should handle nested hierarchy (Depth 3)', async () => {
            const { db, engine, tableName } = await setupTreeTest();
            await insertRaw(db, tableName, 'Root'); await engine.onInsert({ name: 'Root', parent_node: null });
            await insertRaw(db, tableName, 'C1', 'Root'); await engine.onInsert({ name: 'C1', parent_node: 'Root' });
            await insertRaw(db, tableName, 'C2', 'C1'); await engine.onInsert({ name: 'C2', parent_node: 'C1' });

            const root = await getNode(db, tableName, 'Root');
            const c1 = await getNode(db, tableName, 'C1');
            const c2 = await getNode(db, tableName, 'C2');

            expect(root.lft).toBe(1);
            expect(root.rgt).toBe(6);
            expect(c1.lft).toBe(2);
            expect(c1.rgt).toBe(5);
            expect(c2.lft).toBe(3);
            expect(c2.rgt).toBe(4);
        });
    });

    // P2-024-T10: moveNode
    describe('moveNode / onUpdate', () => {
        it('should move a subtree to a new parent', async () => {
            const { db, engine, tableName } = await setupTreeTest();
            await insertRaw(db, tableName, 'Root'); await engine.onInsert({ name: 'Root', parent_node: null });
            await insertRaw(db, tableName, 'A', 'Root'); await engine.onInsert({ name: 'A', parent_node: 'Root' });
            await insertRaw(db, tableName, 'B', 'A'); await engine.onInsert({ name: 'B', parent_node: 'A' });
            await insertRaw(db, tableName, 'C', 'Root'); await engine.onInsert({ name: 'C', parent_node: 'Root' });

            let root = await getNode(db, tableName, 'Root');
            let a = await getNode(db, tableName, 'A');
            let c = await getNode(db, tableName, 'C');

            expect(root.rgt).toBe(8);
            expect(a.lft).toBe(2);
            expect(a.rgt).toBe(5);
            expect(c.lft).toBe(6);

            // Move A to C
            await db.run(`UPDATE \`${tableName}\` SET parent_node = 'C' WHERE name = 'A'`);

            const docA = { name: 'A', parent_node: 'C' };
            const oldDocA = { name: 'A', parent_node: 'Root' };
            await engine.onUpdate(docA, oldDocA);

            root = await getNode(db, tableName, 'Root');
            a = await getNode(db, tableName, 'A');
            const b = await getNode(db, tableName, 'B');
            c = await getNode(db, tableName, 'C');

            expect(root.rgt).toBe(8);
            expect(c.lft).toBe(2);
            expect(c.rgt).toBe(7);
            expect(a.lft).toBe(3);
            expect(a.rgt).toBe(6);
            expect(b.lft).toBe(4);
            expect(b.rgt).toBe(5);

            expect(await engine.isDescendantOf('A', 'C')).toBe(true);
            expect(await engine.isDescendantOf('B', 'C')).toBe(true);
        });

        it('should prevent moving node into its own descendant', async () => {
            const { db, engine, tableName } = await setupTreeTest();
            await insertRaw(db, tableName, 'Root'); await engine.onInsert({ name: 'Root', parent_node: null });
            await insertRaw(db, tableName, 'A', 'Root'); await engine.onInsert({ name: 'A', parent_node: 'Root' });
            await insertRaw(db, tableName, 'B', 'A'); await engine.onInsert({ name: 'B', parent_node: 'A' });

            const docA = { name: 'A', parent_node: 'B' };
            const oldDocA = { name: 'A', parent_node: 'Root' };

            await expect(engine.onUpdate(docA, oldDocA)).rejects.toThrow(/descendant/);
        });
    });

    // P2-024-T11: deleteNode
    describe('deleteNode / onDelete', () => {
        it('should remove node and descendants and close gaps', async () => {
            const { db, engine, tableName } = await setupTreeTest();
            await insertRaw(db, tableName, 'Root'); await engine.onInsert({ name: 'Root', parent_node: null });
            await insertRaw(db, tableName, 'A', 'Root'); await engine.onInsert({ name: 'A', parent_node: 'Root' });
            await insertRaw(db, tableName, 'B', 'A'); await engine.onInsert({ name: 'B', parent_node: 'A' });
            await insertRaw(db, tableName, 'C', 'Root'); await engine.onInsert({ name: 'C', parent_node: 'Root' });

            await engine.onDelete({ name: 'A' });

            const root = await getNode(db, tableName, 'Root');
            const a = await getNode(db, tableName, 'A');
            const b = await getNode(db, tableName, 'B');
            const c = await getNode(db, tableName, 'C');

            expect(a).toBeUndefined();
            expect(b).toBeUndefined();
            expect(root.lft).toBe(1);
            expect(root.rgt).toBe(4);
            expect(c.lft).toBe(2);
            expect(c.rgt).toBe(3);
        });
    });

    // Traversal Tests
    describe('Traversal', () => {
        async function setupTraversal() {
            const ctx = await setupTreeTest();
            const { db, engine, tableName } = ctx;
            // Root (1, 10)
            //  - A (2, 7)
            //     - A1 (3, 4)
            //     - A2 (5, 6)
            //  - B (8, 9)
            await insertRaw(db, tableName, 'Root'); await engine.onInsert({ name: 'Root', parent_node: null });
            await insertRaw(db, tableName, 'A', 'Root'); await engine.onInsert({ name: 'A', parent_node: 'Root' });
            await insertRaw(db, tableName, 'A1', 'A'); await engine.onInsert({ name: 'A1', parent_node: 'A' });
            await insertRaw(db, tableName, 'A2', 'A'); await engine.onInsert({ name: 'A2', parent_node: 'A' });
            await insertRaw(db, tableName, 'B', 'Root'); await engine.onInsert({ name: 'B', parent_node: 'Root' });
            return ctx;
        }

        it('getChildren returns direct children', async () => {
            const { engine } = await setupTraversal();
            const children = await engine.getChildren('A');
            expect(children.map(x => x.name)).toEqual(['A1', 'A2']);
        });

        it('getAncestors returns ancestors to root', async () => {
            const { engine } = await setupTraversal();
            const ancestors = await engine.getAncestors('A1');
            expect(ancestors.map(x => x.name)).toEqual(['Root', 'A']);
        });

        it('getDescendants returns all descendants', async () => {
            const { engine } = await setupTraversal();
            const descendants = await engine.getDescendants('Root');
            expect(descendants.map(x => x.name)).toEqual(['A', 'A1', 'A2', 'B']);
        });

        it('getSiblings returns nodes at same level', async () => {
            const { engine } = await setupTraversal();
            const siblingsA = await engine.getSiblings('A');
            expect(siblingsA.map(x => x.name)).toEqual(['B']);

            const siblingsA1 = await engine.getSiblings('A1');
            expect(siblingsA1.map(x => x.name)).toEqual(['A2']);
        });

        it('getPath returns full path', async () => {
            const { engine } = await setupTraversal();
            const path = await engine.getPath('A1');
            expect(path.map(x => x.name)).toEqual(['Root', 'A', 'A1']);
        });

        it('getLeaves returns nodes with no children', async () => {
            const { engine } = await setupTraversal();
            const leaves = await engine.getLeaves();
            const names = leaves.map(x => x.name).sort();
            expect(names).toEqual(['A1', 'A2', 'B']);
        });

        it('getRoots returns top level nodes', async () => {
            const { engine } = await setupTraversal();
            const roots = await engine.getRoots();
            expect(roots.length).toBe(1);
            expect(roots[0].name).toBe('Root');
        });

        it('getLevel returns depth', async () => {
            const { engine } = await setupTraversal();
            expect(await engine.getLevel('Root')).toBe(0);
            expect(await engine.getLevel('A')).toBe(1);
            expect(await engine.getLevel('A1')).toBe(2);
        });
    });

    // P2-024-T12: rebuildTree
    describe('rebuildTree', () => {
        it('should recalculate lft/rgt correctly', async () => {
            const { db, engine, tableName } = await setupTreeTest();

            await insertRaw(db, tableName, 'R', null);
            await insertRaw(db, tableName, 'C1', 'R');
            await insertRaw(db, tableName, 'C2', 'R');

            await db.run(`UPDATE \`${tableName}\` SET lft=0, rgt=0`);

            await engine.rebuild();

            const r = await getNode(db, tableName, 'R');
            const c1 = await getNode(db, tableName, 'C1');
            const c2 = await getNode(db, tableName, 'C2');

            expect(r.lft).toBe(1);
            expect(r.rgt).toBe(6);

            if (c1.lft === 2) {
                expect(c1.rgt).toBe(3);
                expect(c2.lft).toBe(4);
                expect(c2.rgt).toBe(5);
            } else {
                expect(c1.lft).toBe(4);
                expect(c1.rgt).toBe(5);
                expect(c2.lft).toBe(2);
                expect(c2.rgt).toBe(3);
            }
        });
    });
});
