import type { QueryExecutor } from '../../core/database/query-types';
import type { TreeDocType, TreeNode } from './types';
import { getTreeFields } from './schema';

/**
 * Nested Set Model implementation
 * Handles the logic for maintaining lft/rgt indexes on tree structures.
 */
export class NestedSetModel {
    private executor: QueryExecutor;
    private doctype: TreeDocType;
    private table: string;
    private parentField: string;

    constructor(executor: QueryExecutor, doctype: TreeDocType) {
        this.executor = executor;
        this.doctype = doctype;
        this.table = `tab${doctype.name}`;
        // Standard parent field or custom one? Usually 'parent' if it's a child table, 
        // but for Tree DocTypes, the parent reference is often a field pointing to the same DocType.
        // We use 'parent_value' property in the TreeNode interface conceptually, 
        // but in the DB it is stored in the field specified by nsm_parent_field or 'parent_doctype' logic.
        // For simplicity in this engine, we assume there is a field that holds the parent ID.
        this.parentField = doctype.nsm_parent_field || 'parent_node';
        // Note: 'parent' is reserved in standard DocTypes for child table parent reference.
    }

    /**
     * Add a new node to the tree
     * @param node The node data (must contain the name)
     * @param parent The parent node name (optional, if root)
     */
    async addNode(nodeName: string, parentName?: string): Promise<void> {
        if (!parentName) {
            await this.addRootNode(nodeName);
            return;
        }

        // 1. Get parent's right value
        const parent = await this.getNode(parentName);
        if (!parent) {
            throw new Error(`Parent node ${parentName} not found`);
        }

        const rgt = parent.rgt;

        // 2. Shift all nodes with lft > rgt by 2
        if (this.executor.run) {
            await this.executor.run(
                `UPDATE \`${this.table}\` SET lft = lft + 2 WHERE lft > ?`,
                [rgt]
            );
        } else {
            await this.executor.sql(
                `UPDATE \`${this.table}\` SET lft = lft + 2 WHERE lft > ?`,
                [rgt]
            );
        }

        // 3. Shift all nodes with rgt >= rgt by 2 (>= because parent needs to expand)
        if (this.executor.run) {
            await this.executor.run(
                `UPDATE \`${this.table}\` SET rgt = rgt + 2 WHERE rgt >= ?`,
                [rgt]
            );
        } else {
            await this.executor.sql(
                `UPDATE \`${this.table}\` SET rgt = rgt + 2 WHERE rgt >= ?`,
                [rgt]
            );
        }

        // 4. Update the new node with lft = parent.rgt, rgt = parent.rgt + 1
        // Note: The caller (TreeEngine) is responsible for the actual INSERT of the record.
        // This method assumes the record might already exist or will be updated. 
        // But usually, we insert with 0/0 and then update, or we calculate before insert.
        // Let's assume this method is called AFTER insert (hooks) or we update the record specifically.
        // If checking 'onInsert' hook, the record exists.
        if (this.executor.run) {
            await this.executor.run(
                `UPDATE \`${this.table}\` SET lft = ?, rgt = ?, is_group = 0 WHERE name = ?`,
                [rgt, rgt + 1, nodeName]
            );
        } else {
            await this.executor.sql(
                `UPDATE \`${this.table}\` SET lft = ?, rgt = ?, is_group = 0 WHERE name = ?`,
                [rgt, rgt + 1, nodeName]
            );
        }

        // 5. Update parent to be a group if not already
        if (!parent.is_group) {
            if (this.executor.run) {
                await this.executor.run(
                    `UPDATE \`${this.table}\` SET is_group = 1 WHERE name = ?`,
                    [parentName]
                );
            } else {
                await this.executor.sql(
                    `UPDATE \`${this.table}\` SET is_group = 1 WHERE name = ?`,
                    [parentName]
                );
            }
        }
    }

    /**
     * Add a root node (no parent)
     * It goes to the end of the tree (max rgt + 1)
     */
    async addRootNode(nodeName: string): Promise<void> {
        const maxRgtResult = await this.executor.sql(
            `SELECT MAX(rgt) as max_rgt FROM \`${this.table}\``
        );
        const maxRgt = maxRgtResult[0]?.max_rgt || 0;
        const lft = maxRgt + 1;
        const rgt = maxRgt + 2;

        if (this.executor.run) {
            await this.executor.run(
                `UPDATE \`${this.table}\` SET lft = ?, rgt = ?, is_group = 0 WHERE name = ?`,
                [lft, rgt, nodeName]
            );
        } else {
            await this.executor.sql(
                `UPDATE \`${this.table}\` SET lft = ?, rgt = ?, is_group = 0 WHERE name = ?`,
                [lft, rgt, nodeName]
            );
        }
    }

    /**
     * Move a node (and its subtree) to a new parent
     */
    async moveNode(nodeName: string, newParentName?: string): Promise<void> {
        const node = await this.getNode(nodeName);
        if (!node) throw new Error(`Node ${nodeName} not found`);

        // If new parent is same as old parent, do nothing (except validation?)
        // In this implementation, we assume validation happened before.

        let newParentRgt: number;

        if (newParentName) {
            const newParent = await this.getNode(newParentName);
            if (!newParent) throw new Error(`New parent ${newParentName} not found`);

            // Check if moving into itself or its descendants
            if (newParent.lft >= node.lft && newParent.rgt <= node.rgt) {
                throw new Error(`Cannot move node ${nodeName} into its own descendant ${newParentName}`);
            }
            newParentRgt = newParent.rgt;
        } else {
            // Moving to root: append to end of tree
            const maxRgtResult = await this.executor.sql(
                `SELECT MAX(rgt) as max_rgt FROM \`${this.table}\``
            );
            newParentRgt = (maxRgtResult[0]?.max_rgt || 0) + 1;
        }

        const width = node.rgt - node.lft + 1;
        const distance = newParentRgt - node.lft;
        const tmppos = node.lft;

        // Implementation strategy:
        // 1. Unlink the subtree: set lft and rgt to negative values to effectively remove them from the tree space temporary
        // This prevents them from being affected by the shifts.
        // We use -lft to distinguish them uniquely if needed, or just offset them by a large negative number.
        // Let's use negative values to "hide" them.

        // However, standard SQL approach often does it in one go or uses a gap.
        // The robust way:
        // a) Create new space at destination
        // b) Move subtree to new space
        // c) Close old space

        // But wait, if we create space first, the 'node' coordinates change if it is to the right of destination.
        // If we close space first, 'node' coordinates change.

        // Alternative:
        // 1. Identify all nodes in subtree
        const subtreeIds = (await this.executor.sql(
            `SELECT name FROM \`${this.table}\` WHERE lft >= ? AND rgt <= ?`,
            [node.lft, node.rgt]
        )).map(r => r.name);

        // 2. Remove subtree from tree logic (make lft/rgt negative)
        if (this.executor.run) {
            await this.executor.run(
                `UPDATE \`${this.table}\` SET lft = -lft, rgt = -rgt WHERE lft >= ? AND rgt <= ?`,
                [node.lft, node.rgt]
            );
        } else {
            await this.executor.sql(
                `UPDATE \`${this.table}\` SET lft = -lft, rgt = -rgt WHERE lft >= ? AND rgt <= ?`,
                [node.lft, node.rgt]
            );
        }

        // 3. Close the gap left by the subtree
        if (this.executor.run) {
            await this.executor.run(
                `UPDATE \`${this.table}\` SET rgt = rgt - ? WHERE rgt > ?`,
                [width, node.rgt]
            );
            await this.executor.run(
                `UPDATE \`${this.table}\` SET lft = lft - ? WHERE lft > ?`,
                [width, node.rgt]
            );
        } else {
            await this.executor.sql(
                `UPDATE \`${this.table}\` SET rgt = rgt - ? WHERE rgt > ?`,
                [width, node.rgt]
            );
            await this.executor.sql(
                `UPDATE \`${this.table}\` SET lft = lft - ? WHERE lft > ?`,
                [width, node.rgt]
            );
        }

        // 4. Prepare target gap
        // We need to fetch newParentRgt again because it might have changed if it was to the right of the removed node?
        // Yes, if newParent.rgt > node.rgt, then newParent.rgt decreased by width.

        // Let's refresh new parent info
        let targetRight: number;
        if (newParentName) {
            const freshParent = await this.getNode(newParentName);
            if (!freshParent) throw new Error('Parent disappeared');
            targetRight = freshParent.rgt; // Insert inside, at the end (just before rgt)

            // Also ensure parent is marked as group
            if (!freshParent.is_group) {
                if (this.executor.run) {
                    await this.executor.run(
                        `UPDATE \`${this.table}\` SET is_group = 1 WHERE name = ?`,
                        [newParentName]
                    );
                } else {
                    await this.executor.sql(
                        `UPDATE \`${this.table}\` SET is_group = 1 WHERE name = ?`,
                        [newParentName]
                    );
                }
            }
        } else {
            const maxRgtResult = await this.executor.sql(
                `SELECT MAX(rgt) as max_rgt FROM \`${this.table}\``
            );
            targetRight = (maxRgtResult[0]?.max_rgt || 0) + 1;
        }

        // 5. Open gap at target
        if (this.executor.run) {
            await this.executor.run(
                `UPDATE \`${this.table}\` SET lft = lft + ? WHERE lft >= ?`,
                [width, targetRight]
            );
            await this.executor.run(
                `UPDATE \`${this.table}\` SET rgt = rgt + ? WHERE rgt >= ?`,
                [width, targetRight]
            );
        } else {
            await this.executor.sql(
                `UPDATE \`${this.table}\` SET lft = lft + ? WHERE lft >= ?`,
                [width, targetRight]
            );
            await this.executor.sql(
                `UPDATE \`${this.table}\` SET rgt = rgt + ? WHERE rgt >= ?`,
                [width, targetRight]
            );
        }

        // 6. Move subtree into gap
        // We need to calculate the shift amount.
        // The subtree was at 'node.lft' (before negation).
        // It needs to start at 'targetRight'.
        // So the new lft should be 'targetRight'.
        // The shift amount is: new_lft - old_lft
        // But wait, our subtree has negative values now: -old_lft.
        // We want to transform -old_lft -> targetRight.
        // So we do: -lft + (targetRight + old_lft) ?? No.

        // Equation: new_val = -curr_val + shift
        // where -curr_val is the original positive value
        // We want original_val + diff = new_val
        // shift = targetRight - original_node_lft

        const offset = targetRight - node.lft;

        // We need to apply this offset to all nodes in the subtree, preserving their internal structure.
        // The internal structure is relative.
        // new_child_lft = old_child_lft + offset

        if (this.executor.run) {
            await this.executor.run(
                `UPDATE \`${this.table}\` SET lft = ABS(lft) + ?, rgt = ABS(rgt) + ? WHERE name IN (${subtreeIds.map(() => '?').join(',')})`,
                [offset, offset, ...subtreeIds]
            );
        } else {
            await this.executor.sql(
                `UPDATE \`${this.table}\` SET lft = ABS(lft) + ?, rgt = ABS(rgt) + ? WHERE name IN (${subtreeIds.map(() => '?').join(',')})`,
                [offset, offset, ...subtreeIds]
            );
        }
    }

    /**
     * Remove a node (and its descendants) from the tree
     */
    async deleteNode(nodeName: string): Promise<void> {
        const node = await this.getNode(nodeName);
        if (!node) return; // Already gone

        const width = node.rgt - node.lft + 1;

        // 1. Delete the node and its descendants
        if (this.executor.run) {
            await this.executor.run(
                `DELETE FROM \`${this.table}\` WHERE lft >= ? AND rgt <= ?`,
                [node.lft, node.rgt]
            );
        } else {
            await this.executor.sql(
                `DELETE FROM \`${this.table}\` WHERE lft >= ? AND rgt <= ?`,
                [node.lft, node.rgt]
            );
        }

        // 2. Close the gap
        if (this.executor.run) {
            await this.executor.run(
                `UPDATE \`${this.table}\` SET lft = lft - ? WHERE lft > ?`,
                [width, node.rgt]
            );
            await this.executor.run(
                `UPDATE \`${this.table}\` SET rgt = rgt - ? WHERE rgt > ?`,
                [width, node.rgt]
            );
        } else {
            await this.executor.sql(
                `UPDATE \`${this.table}\` SET lft = lft - ? WHERE lft > ?`,
                [width, node.rgt]
            );
            await this.executor.sql(
                `UPDATE \`${this.table}\` SET rgt = rgt - ? WHERE rgt > ?`,
                [width, node.rgt]
            );
        }
    }

    /**
     * Get node structure data
     */
    async getNode(name: string): Promise<TreeNode & { name: string } | null> {
        const result = await this.executor.sql(
            `SELECT name, lft, rgt, is_group, parent_node as parent_value FROM \`${this.table}\` WHERE name = ?`,
            [name]
        );
        return result[0] || null;
    }

    /**
     * Rebuild the tree from parent pointers
     * Useful for recovery or initial import
     */
    async rebuildTree(): Promise<void> {
        // Clear all lft/rgt
        // We recalculate standard NSM logic

        // 1. Get all nodes
        const nodes = await this.executor.sql(
            `SELECT name, ${this.parentField} as parent FROM \`${this.table}\``
        );

        // Build adjacency list
        const children: Record<string, string[]> = {};
        const roots: string[] = [];

        for (const node of nodes) {
            const p = node.parent;
            if (!p) {
                roots.push(node.name);
            } else {
                if (!children[p]) children[p] = [];
                children[p].push(node.name);
            }
        }

        // Recursive traversal
        let currentLeft = 1;

        const traverse = async (nodeName: string) => {
            const lft = currentLeft++;
            const kids = children[nodeName] || [];

            // Sort kids by name or creation? Let's sort by name for deterministic results
            kids.sort();

            for (const kid of kids) {
                await traverse(kid);
            }

            const rgt = currentLeft++;
            const isGroup = kids.length > 0 ? 1 : 0;

            if (this.executor.run) {
                await this.executor.run(
                    `UPDATE \`${this.table}\` SET lft = ?, rgt = ?, is_group = ? WHERE name = ?`,
                    [lft, rgt, isGroup, nodeName]
                );
            } else {
                await this.executor.sql(
                    `UPDATE \`${this.table}\` SET lft = ?, rgt = ?, is_group = ? WHERE name = ?`,
                    [lft, rgt, isGroup, nodeName]
                );
            }
        };

        // Process roots
        roots.sort();
        for (const root of roots) {
            await traverse(root);
        }
    }
}
