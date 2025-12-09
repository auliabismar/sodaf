/**
 * Tree DocType Interfaces
 * 
 * Defines interfaces for tree-structured DocTypes using the nested set model.
 */

import type { DocType } from '../doctype/types';

/**
 * Tree structure fields interface (Nested Set Model)
 */
export interface TreeNode {
    /** Left bound of the nested set */
    lft: number;

    /** Right bound of the nested set */
    rgt: number;

    /** Whether this node is a group (can have children) */
    is_group: boolean;

    /** Old parent field for move tracking */
    old_parent?: string;

    /** Parent field (dynamically named based on parent_doctype or standard parent) */
    parent_value?: string;
}

/**
 * Tree view options for DocType
 */
export interface TreeOptions {
    /** Root label for the tree view */
    root_label?: string;

    /** Root value/ID */
    root_value?: string;

    /** Field to use for the icon */
    icon_field?: string;

    /** Field to use for the label (defaults to title_field or name) */
    label_field?: string;

    /** Whether to expand all nodes by default */
    expand_all?: boolean;
}

/**
 * Tree DocType extension
 */
export interface TreeDocType extends DocType {
    /** Must be true for tree structures */
    is_tree: true;

    /** Field name that stores the parent reference */
    nsm_parent_field?: string;

    /** Tree view options */
    tree_options?: TreeOptions;
}
