/**
 * Tree Schema Helpers
 * 
 * Provides utilities for managing tree structure schema (Standard Nested Set Model).
 */

import type { DocType, DocField } from '../doctype/types';
import type { TreeDocType } from './types';

/**
 * Standard tree fields for Nested Set Model
 */
export const TREE_FIELDS: DocField[] = [
    {
        fieldname: 'lft',
        label: 'Left',
        fieldtype: 'Int',
        required: true,
        default: 0,
        hidden: true,
        read_only: true,
        indexed: true
    },
    {
        fieldname: 'rgt',
        label: 'Right',
        fieldtype: 'Int',
        required: true,
        default: 0,
        hidden: true,
        read_only: true,
        indexed: true
    },
    {
        fieldname: 'is_group',
        label: 'Is Group',
        fieldtype: 'Check',
        default: 0,
        hidden: false
    },
    {
        fieldname: 'old_parent',
        label: 'Old Parent',
        fieldtype: 'Data',
        hidden: true,
        read_only: true
    }
];

/**
 * Get tree fields for a DocType
 * Helper to inject tree fields into schema if they don't exist
 */
export function getTreeFields(doctype: DocType): DocField[] {
    if (!doctype.is_tree) {
        return [];
    }

    const treeFields: DocField[] = [...TREE_FIELDS];

    // Add parent field if specified in nsm_parent_field, otherwise assume standard parent link
    // Note: The actual parent link usually needs to point to the same DocType
    const treeDocType = doctype as TreeDocType;
    if (treeDocType.nsm_parent_field) {
        // Check if it already exists in doctype.fields is not our responsibility here,
        // but we provide the standard fields that *must* exist.
    }

    return treeFields;
}

/**
 * Check if a field is a tree-specific field
 */
export function isTreeField(fieldname: string): boolean {
    return ['lft', 'rgt', 'is_group', 'old_parent'].includes(fieldname);
}
