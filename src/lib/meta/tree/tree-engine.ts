import type { QueryExecutor } from '../../core/database/query-types';
import type { TreeDocType, TreeNode } from './types';
import { NestedSetModel } from './nested-set';
import { createQueryBuilder } from '../../core/database/query-builder';

/**
 * Tree Engine for Tree-structured DocTypes
 */
export class TreeEngine {
    private executor: QueryExecutor;
    private nsm: NestedSetModel;
    private doctype: TreeDocType;
    private table: string;
    private parentField: string;

    constructor(executor: QueryExecutor, doctype: TreeDocType) {
        this.executor = executor;
        this.doctype = doctype;
        this.nsm = new NestedSetModel(executor, doctype);
        this.table = `tab${doctype.name}`;
        this.parentField = doctype.nsm_parent_field || 'parent_node';
    }

    /**
     * Hook: Called after a new document is inserted
     * Ensures the node is correctly placed in the nested set
     */
    async onInsert(doc: any): Promise<void> {
        const parent = doc[this.parentField];
        await this.nsm.addNode(doc.name, parent);
    }

    /**
     * Hook: Called before/after update to handle moves
     * @param doc The document being updated
     * @param oldDoc The previous state of the document (optional but needed for detection)
     */
    async onUpdate(doc: any, oldDoc?: any): Promise<void> {
        if (!oldDoc) return;

        const oldParent = oldDoc[this.parentField];
        const newParent = doc[this.parentField];

        if (oldParent !== newParent) {
            // Validate circular reference if needed (moveNode handles basic self-descendant check)
            // But we might want to check hooks here.

            // Execute move
            await this.nsm.moveNode(doc.name, newParent);
        }
    }

    /**
     * Hook: Called before deletion
     */
    async onDelete(doc: any): Promise<void> {
        await this.nsm.deleteNode(doc.name);
    }

    // --- Traversal Queries ---

    private qb() {
        return createQueryBuilder(this.executor)(this.table);
    }

    /**
     * Get children of a node
     * @param parentName Name of parent node. If null, gets roots.
     */
    async getChildren(parentName?: string): Promise<any[]> {
        if (!parentName) {
            return this.getRoots();
        }

        const parent = await this.nsm.getNode(parentName);
        if (!parent) return [];

        // Direct children are those where parent is this node
        // We can rely on the parent field for immediate children
        return this.qb()
            .select('*')
            .where(this.parentField, '=', parentName)
            .orderBy('lft', 'ASC') // Standard tree sort
            .run();
    }

    /**
     * Get parent of a node
     */
    async getParent(nodeName: string): Promise<any | null> {
        const node = await this.nsm.getNode(nodeName);
        if (!node || !node.parent_value) return null;

        const parents = await this.qb()
            .select('*')
            .where('name', '=', node.parent_value)
            .run();

        return parents[0] || null;
    }

    /**
     * Get all ancestors of a node
     */
    async getAncestors(nodeName: string): Promise<any[]> {
        const node = await this.nsm.getNode(nodeName);
        if (!node) return [];

        return this.qb()
            .select('*')
            .where('lft', '<', node.lft)
            .where('rgt', '>', node.rgt)
            .orderBy('lft', 'ASC')
            .run();
    }

    /**
     * Get all descendants of a node
     */
    async getDescendants(nodeName: string): Promise<any[]> {
        const node = await this.nsm.getNode(nodeName);
        if (!node) return [];

        return this.qb()
            .select('*')
            .where('lft', '>', node.lft)
            .where('rgt', '<', node.rgt)
            .orderBy('lft', 'ASC')
            .run();
    }

    /**
     * Get siblings (nodes with same parent)
     */
    async getSiblings(nodeName: string): Promise<any[]> {
        const node = await this.nsm.getNode(nodeName);
        if (!node) return [];

        const parentVal = node.parent_value;

        const q = this.qb().select('*');

        if (parentVal) {
            q.where(this.parentField, '=', parentVal);
        } else {
            // Roots
            q.where(this.parentField, 'is', null)
                .orWhere(this.parentField, '=', ''); // Handle empty string as null for parent
        }

        const siblings = await q.orderBy('lft', 'ASC').run();
        return siblings.filter(s => s.name !== nodeName);
    }

    /**
     * Get path from root to node (inclusive)
     */
    async getPath(nodeName: string): Promise<any[]> {
        const ancestors = await this.getAncestors(nodeName);
        const node = await this.qb().select('*').where('name', '=', nodeName).run();
        return [...ancestors, ...node];
    }

    /**
     * Get all leaf nodes (no children)
     * Definition: rgt = lft + 1
     */
    async getLeaves(): Promise<any[]> {
        // Limitation: SQL math in query builder might be tricky if not supported natively.
        // But standard SQL 'rgt = lft + 1' works.
        // Our QueryBuilder supports string conditions in where?
        // It supports operator queries. 'lft', '=', 'rgt - 1' wont work directly if value is treated as string literal.

        // We can execute raw SQL for this specific query
        return this.executor.sql(
            `SELECT * FROM \`${this.table}\` WHERE rgt = lft + 1 ORDER BY lft ASC`
        );
    }

    /**
     * Get root nodes
     */
    async getRoots(): Promise<any[]> {
        return this.qb()
            .select('*')
            .where(this.parentField, 'is', null) // or empty string check? 
            .orderBy('lft', 'ASC')
            .run();
    }

    /**
     * Get level (depth) of a node
     */
    async getLevel(nodeName: string): Promise<number> {
        const ancestors = await this.getAncestors(nodeName);
        return ancestors.length; // Level 0 for root? or Level 1?
        // Usually, root is level 0 or 1.
        // If 0 ancestors, it's root. So ancestors.length is 0-based index.
    }

    /**
     * Check if ancestor
     */
    async isAncestorOf(ancestor: string, descendant: string): Promise<boolean> {
        const a = await this.nsm.getNode(ancestor);
        const d = await this.nsm.getNode(descendant);
        if (!a || !d) return false;

        return a.lft < d.lft && a.rgt > d.rgt;
    }

    /**
     * Check if descendant
     */
    async isDescendantOf(descendant: string, ancestor: string): Promise<boolean> {
        return this.isAncestorOf(ancestor, descendant);
    }

    /**
     * Public access to rebuild
     */
    async rebuild(): Promise<void> {
        await this.nsm.rebuildTree();
    }
}
