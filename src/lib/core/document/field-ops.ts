/**
 * Document Field Operations
 * 
 * This module implements db_set, db_get, and child table operations.
 * It provides direct DB operations without full save and complete child table management.
 */

import { Doc } from './document';
import type { DocumentHooks } from './types';
import type { Database } from '../database';

/**
 * Child document interface
 */
export interface ChildDoc {
	/** Child document name */
	name?: string;
	/** Child document doctype */
	doctype?: string;
	/** Child document fields */
	[key: string]: any;
}

/**
 * Field Operations class extending Document with additional field methods
 */
export class FieldOperationsDoc extends Doc {
	/**
	 * Child documents storage
	 */
	private _children: Record<string, ChildDoc[]> = {};
	
	/**
	 * Constructor
	 * @param data Initial document data
	 * @param db Database instance
	 * @param hooks Document hooks
	 */
	constructor(data: any, db: Database, hooks?: DocumentHooks) {
		super(data, db, hooks);
	}
	
	/**
	 * Set a field value directly in database
	 * @param field Field name or object with multiple fields
	 * @param value Field value (if field is string)
	 * @param notify Whether to trigger on_change hook
	 */
	async db_set(field: string | Record<string, any>, value?: any, notify: boolean = true): Promise<void> {
		if (!this.db) throw new Error('Database not available');
		
		try {
			if (typeof field === 'string') {
				// Single field update
				await this.db.set_value(this.doctype, this.name, field, value as any);
			} else {
				// Multiple fields update
				await this.db.set_value(this.doctype, this.name, field as Record<string, any>);
			}
			
			// Update local document
			if (typeof field === 'string') {
				this.set(field, value);
			} else {
				// Update multiple fields locally
				for (const [key, val] of Object.entries(field as Record<string, any>)) {
					this.set(key, val);
				}
			}
			
			// Trigger on_change hook if notify is true
			if (notify && this.hooks?.on_change) {
				await this.hooks.on_change.call(this);
			}
		} catch (error) {
			throw new Error(`Failed to set field value: ${(error as Error).message}`);
		}
	}
	
	/**
	 * Get a field value directly from database
	 * @param field Field name
	 * @returns Promise that resolves to field value
	 */
	async db_get(field: string): Promise<any> {
		if (!this.db) throw new Error('Database not available');
		
		try {
			const value = await this.db.get_value(this.doctype, this.name, field);
			return value;
		} catch (error) {
			throw new Error(`Failed to get field value: ${(error as Error).message}`);
		}
	}
	
	/**
	 * Append a child document to a field
	 * @param fieldname Field name for child array
	 * @param data Child document data
	 */
	append(fieldname: string, data: ChildDoc): void {
		if (!this._children[fieldname]) {
			this._children[fieldname] = [];
		}
		
		// Create child document with proper properties
		const child: ChildDoc = {
			...data,
			name: data.name || this.generateChildName(),
			idx: this._children[fieldname].length,
			parent: this.name,
			parenttype: this.doctype,
			parentfield: fieldname
		};
		
		// Add to children array
		this._children[fieldname].push(child);
		
		// Mark document as unsaved
		this.__unsaved = true;
	}
	
	/**
	 * Remove a child document from a field
	 * @param child Child document to remove
	 */
	remove(child: ChildDoc): void {
		// Find the child in the array
		const fieldname = child.parentfield;
		if (!fieldname || !this._children[fieldname]) return;
		
		const index = this._children[fieldname].findIndex(c => c.name === child.name);
		if (index === -1) return;
		
		// Remove from array
		this._children[fieldname].splice(index, 1);
		
		// Reindex remaining children
		this.reindexChildren(fieldname);
		
		// Mark document as unsaved
		this.__unsaved = true;
	}
	
	/**
	 * Get all children for a field
	 * @param fieldname Field name
	 * @returns Array of child documents
	 */
	get_children(fieldname: string): ChildDoc[] {
		return this._children[fieldname] || [];
	}
	
	/**
	 * Reindex children after removal
	 * @param fieldname Field name
	 */
	private reindexChildren(fieldname: string): void {
		if (!this._children[fieldname]) return;
		
		for (let i = 0; i < this._children[fieldname].length; i++) {
			this._children[fieldname][i].idx = i;
		}
	}
	
	/**
	 * Generate a unique name for child document
	 * @returns Generated name
	 */
	private generateChildName(): string {
		const timestamp = Date.now();
		const random = Math.floor(Math.random() * 10000);
		return `child-${timestamp}-${random}`;
	}
	
	/**
	 * Override save to handle child documents
	 */
	async save(): Promise<void> {
		// Save parent document first
		await super.save();
		
		// Save all child documents
		for (const [fieldname, children] of Object.entries(this._children)) {
			for (const child of children) {
				if (child.name) {
					// Create child document object
					const childDoc = {
						...child,
						name: child.name,
						parent: this.name,
						parenttype: this.doctype,
						parentfield: fieldname,
						idx: child.idx
					};
					
					// Save child document
					await this.db.insert(childDoc.doctype || 'Child', childDoc);
				}
			}
		}
	}
	
	/**
	 * Override delete to handle child documents
	 */
	async delete(): Promise<void> {
		// Delete all child documents first
		for (const [fieldname, children] of Object.entries(this._children)) {
			for (const child of children) {
				if (child.name) {
					await this.db.delete(child.doctype || 'Child', child.name);
				}
			}
		}
		
		// Delete parent document
		await super.delete();
	}
	
	/**
	 * Get children as part of valid dictionary
	 * @returns Dictionary with only DB columns
	 */
	override get_valid_dict(): Record<string, any> {
		const dict = super.get_valid_dict();
		
		// Add child documents to dictionary
		for (const [fieldname, children] of Object.entries(this._children)) {
			dict[fieldname] = children.map(child => ({
				name: child.name,
				doctype: child.doctype,
				idx: child.idx,
				parent: child.parent,
				parenttype: child.parenttype,
				parentfield: child.parentfield,
				...child
			}));
		}
		
		return dict;
	}
}