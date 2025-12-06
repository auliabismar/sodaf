/**
 * Document Base Class - Core CRUD Operations
 * 
 * This module implements the base Document class with CRUD operations (insert, save, delete, reload).
 * It provides automatic timestamp management, dirty tracking, and proper error handling.
 */

import type { BaseDocFields, DocStatus, DocumentHooks, DocumentOptions } from './types';
import type { Database } from '../database';

/**
 * Custom error classes for document operations
 */
export class DuplicateEntryError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'DuplicateEntryError';
	}
}

export class DocumentNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'DocumentNotFoundError';
	}
}

export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ValidationError';
	}
}

/**
 * Base Document class with CRUD operations
 * 
 * This class provides the core functionality for document management including
 * creation, reading, updating, and deletion of documents.
 */
export class Doc implements BaseDocFields {
	/** Unique identifier for the document */
	name: string = '';
	
	/** Document type identifier */
	doctype: string;
	
	/** Document status: 0=Draft, 1=Submitted, 2=Cancelled */
	docstatus: DocStatus = 0;
	
	/** Creation timestamp */
	creation: Date = new Date();
	
	/** Last modification timestamp */
	modified: Date = new Date();
	
	/** User who created the document */
	owner: string = 'Administrator';
	
	/** User who last modified the document */
	modified_by: string = 'Administrator';
	
	/** Index for child documents */
	idx?: number;
	
	/** Parent document name for child documents */
	parent?: string;
	
	/** Parent document type for child documents */
	parenttype?: string;
	
	/** Parent field name for child documents */
	parentfield?: string;
	
	/**
	 * Internal flag to track if document has unsaved changes
	 */
	protected __unsaved: boolean = true;
	
	/**
	 * Internal flag to track if document is loaded from database
	 */
	protected __isnew: boolean = true;
	
	/**
	 * Previous document state before save
	 */
	protected __doc_before_save?: any;
	
	/**
	 * Database instance for operations
	 */
	protected db: Database;
	
	/**
	 * Document hooks
	 */
	protected hooks?: DocumentHooks;
	
	/**
	 * Additional document fields beyond base fields
	 */
	[key: string]: any;
	
	/**
	 * Constructor
	 * @param data Initial document data
	 * @param db Database instance
	 * @param hooks Document hooks
	 */
	constructor(data: Partial<BaseDocFields> & Record<string, any>, db: Database, hooks?: DocumentHooks) {
		// Set doctype first as it's required
		if (!data.doctype) {
			throw new ValidationError('doctype is required');
		}
		this.doctype = data.doctype;
		
		// Set database instance
		this.db = db;
		this.hooks = hooks;
		
		// Copy all data to this instance
		Object.assign(this, data);
		
		// Set default values if not provided
		if (!this.name) {
			this.name = '';
		}
		if (!this.owner) {
			this.owner = 'Administrator';
		}
		if (!this.modified_by) {
			this.modified_by = 'Administrator';
		}
		if (this.docstatus === undefined) {
			this.docstatus = 0;
		}
		
		// Set timestamps
		const now = new Date();
		if (!this.creation) {
			this.creation = now;
		}
		if (!this.modified) {
			this.modified = now;
		}
		
		// If name is provided, check if document exists in database
		if (this.name) {
			this.__isnew = false;
			this.__unsaved = false;
		}
	}
	
	/**
	 * Insert the document into the database
	 * @returns Promise that resolves to the document name
	 */
	async insert(): Promise<string> {
		if (!this.__isnew) {
			throw new DuplicateEntryError(`Document ${this.name} already exists`);
		}
		
		// Generate name if not set
		if (!this.name) {
			this.name = await this.generateName();
		}
		
		// Set timestamps and user
		const now = new Date();
		this.creation = now;
		this.modified = now;
		this.owner = 'Administrator';
		this.modified_by = 'Administrator';
		
		// Execute before_insert hook
		if (this.hooks?.before_insert) {
			await this.hooks.before_insert.call(this);
		}
		
		try {
			// Insert into database
			await this.db.insert(this.doctype, this.get_valid_dict());
			
			// Mark as saved
			this.__isnew = false;
			this.__unsaved = false;
			
			// Execute after_insert hook
			if (this.hooks?.after_insert) {
				await this.hooks.after_insert.call(this);
			}
			
			return this.name;
		} catch (error) {
			throw new Error(`Failed to insert document: ${(error as Error).message}`);
		}
	}
	
	/**
	 * Save the document (insert if new, update if existing)
	 * @returns Promise that resolves when saved
	 */
	async save(): Promise<void> {
		if (this.__isnew) {
			await this.insert();
			return;
		}
		
		if (!this.__unsaved) {
			return; // No changes to save
		}
		
		// Store previous state
		this.__doc_before_save = { ...this.get_valid_dict() };
		
		// Update modified timestamp
		this.modified = new Date();
		this.modified_by = 'Administrator';
		
		// Execute before_save hook
		if (this.hooks?.before_save) {
			await this.hooks.before_save.call(this);
		}
		
		try {
			// Update in database
			await this.db.update(this.doctype, this.name, this.get_valid_dict());
			
			// Mark as saved
			this.__unsaved = false;
			this.__doc_before_save = undefined;
			
			// Execute after_save hook
			if (this.hooks?.after_save) {
				await this.hooks.after_save.call(this);
			}
		} catch (error) {
			throw new Error(`Failed to save document: ${(error as Error).message}`);
		}
	}
	
	/**
	 * Reload the document from the database
	 * @returns Promise that resolves when reloaded
	 */
	async reload(): Promise<void> {
		if (this.__isnew) {
			throw new ValidationError('Cannot reload a document that has not been saved');
		}
		
		if (this.__unsaved) {
			throw new ValidationError('Cannot reload a document with unsaved changes');
		}
		
		try {
			// Get fresh data from database
			const doc = await this.db.get_doc(this.doctype, this.name);
			if (!doc) {
				throw new DocumentNotFoundError(`Document ${this.name} not found`);
			}
			
			// Update all fields
			Object.assign(this, doc);
			
			// Convert date strings to Date objects
			if (typeof this.creation === 'string') {
				this.creation = new Date(this.creation);
			}
			if (typeof this.modified === 'string') {
				this.modified = new Date(this.modified);
			}
			
			// Execute on_reload hook
			if (this.hooks?.on_reload) {
				await this.hooks.on_reload.call(this);
			}
		} catch (error) {
			throw new Error(`Failed to reload document: ${(error as Error).message}`);
		}
	}
	
	/**
	 * Delete the document from the database
	 * @returns Promise that resolves when deleted
	 */
	async delete(): Promise<void> {
		if (this.__isnew) {
			throw new ValidationError('Cannot delete a document that has not been saved');
		}
		
		// Execute before_delete hook
		if (this.hooks?.before_delete) {
			await this.hooks.before_delete.call(this);
		}
		
		try {
			// Delete from database
			await this.db.delete(this.doctype, this.name);
			
			// Mark as new (deleted)
			this.__isnew = true;
			this.__unsaved = true;
			
			// Execute after_delete hook
			if (this.hooks?.after_delete) {
				await this.hooks.after_delete.call(this);
			}
		} catch (error) {
			throw new Error(`Failed to delete document: ${(error as Error).message}`);
		}
	}
	
	/**
	 * Check if document is new (not yet saved)
	 * @returns True if document is new
	 */
	is_new(): boolean {
		return this.__isnew;
	}
	
	/**
	 * Get document as plain object
	 * @returns Plain object representation of document
	 */
	as_dict(): Record<string, any> {
		const result: Record<string, any> = {};
		
		// Copy all properties
		for (const key in this) {
			if (this.hasOwnProperty(key) && !key.startsWith('__')) {
				result[key] = (this as any)[key];
			}
		}
		
		return result;
	}
	
	/**
	 * Get document as dictionary with only valid database columns
	 * @returns Dictionary with only database columns
	 */
	get_valid_dict(): Record<string, any> {
		const result: Record<string, any> = {};
		
		// Copy all properties except internal ones
		for (const key in this) {
			if (this.hasOwnProperty(key) && !key.startsWith('__')) {
				result[key] = (this as any)[key];
			}
		}
		
		// Convert dates to strings for database
		if (result.creation instanceof Date) {
			result.creation = result.creation.toISOString().replace('T', ' ').substring(0, 19);
		}
		if (result.modified instanceof Date) {
			result.modified = result.modified.toISOString().replace('T', ' ').substring(0, 19);
		}
		
		return result;
	}
	
	/**
	 * Get a field value
	 * @param fieldname Field name
	 * @returns Field value
	 */
	get(fieldname: string): any {
		return (this as any)[fieldname];
	}
	
	/**
	 * Set a field value
	 * @param fieldname Field name
	 * @param value Field value
	 */
	set(fieldname: string, value: any): void {
		// Check if value is actually changing
		if ((this as any)[fieldname] !== value) {
			(this as any)[fieldname] = value;
			this.__unsaved = true;
		}
	}
	
	/**
	 * Check if document has unsaved changes
	 * @returns True if document has unsaved changes
	 */
	has_unsaved_changes(): boolean {
		return this.__unsaved;
	}
	
	/**
	 * Get document state before save
	 * @returns Previous document state
	 */
	get_doc_before_save(): any {
		return this.__doc_before_save;
	}
	
	/**
	 * Check if a field value has changed
	 * @param fieldname Field name
	 * @returns True if field value has changed
	 */
	has_value_changed(fieldname: string): boolean {
		if (!this.__doc_before_save) {
			return false;
		}
		
		const oldValue = this.__doc_before_save[fieldname];
		const newValue = (this as any)[fieldname];
		
		return oldValue !== newValue;
	}
	
	/**
	 * Generate a unique name for the document
	 * @returns Promise that resolves to generated name
	 */
	private async generateName(): Promise<string> {
		const timestamp = Date.now();
		const random = Math.floor(Math.random() * 10000);
		return `${this.doctype}-${timestamp}-${random}`;
	}
}