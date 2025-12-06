/**
 * Document Submit/Cancel Operations
 * 
 * This module implements submit and cancel operations for submittable documents.
 * It provides state machine for docstatus transitions and protection against invalid edits.
 */

import { Doc } from './document';
import type { DocStatus, DocumentHooks } from './types';
import type { Database } from '../database';

/**
 * Custom error classes for submittable document operations
 */
export class InvalidStateError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InvalidStateError';
	}
}

export class NotSubmittableError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NotSubmittableError';
	}
}

export class CannotEditSubmittedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CannotEditSubmittedError';
	}
}

export class CannotDeleteSubmittedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CannotDeleteSubmittedError';
	}
}

/**
 * Submittable Document class extending base Doc with submit/cancel operations
 * 
 * This class extends the base Document class to add support for document submission
 * and cancellation with proper state management and validation.
 */
export class SubmittableDoc extends Doc {
	/**
	 * Flag to indicate if document is submittable
	 */
	private _is_submittable: boolean = true;
	
	/**
	 * Fields that can be edited even when submitted (if allow_on_submit is true)
	 */
	private _allow_on_submit_fields: string[] = [];
	
	/**
	 * Constructor
	 * @param data Initial document data
	 * @param db Database instance
	 * @param hooks Document hooks
	 */
	constructor(
		data: any,
		db: Database,
		hooks?: DocumentHooks
	) {
		super(data, db, hooks);
	}
	
	/**
	 * Set whether document is submittable
	 * @param is_submittable Whether document can be submitted
	 */
	set_is_submittable(is_submittable: boolean): void {
		this._is_submittable = is_submittable;
	}
	
	/**
	 * Set fields that can be edited when submitted
	 * @param fields Array of field names
	 */
	set_allow_on_submit_fields(fields: string[]): void {
		this._allow_on_submit_fields = fields;
	}
	
	/**
	 * Submit the document
	 * @returns Promise that resolves when submitted
	 */
	async submit(): Promise<void> {
		// Check if document is submittable
		if (!this._is_submittable) {
			throw new NotSubmittableError('Document is not submittable');
		}
		
		// Check current state
		if (this.docstatus === 1) {
			throw new InvalidStateError('Document is already submitted');
		}
		
		if (this.docstatus === 2) {
			throw new InvalidStateError('Cannot submit a cancelled document');
		}
		
		// Execute before_submit hook
		if (this.hooks?.before_submit) {
			await this.hooks.before_submit.call(this);
		}
		
		// Update status to submitted
		this.docstatus = 1;
		this.modified = new Date();
		this.modified_by = 'Administrator';
		
		// Save the document
		await this.save();
		
		// Execute after_submit hook
		if (this.hooks?.after_submit) {
			await this.hooks.after_submit.call(this);
		}
	}
	
	/**
	 * Cancel the document
	 * @returns Promise that resolves when cancelled
	 */
	async cancel(): Promise<void> {
		// Check current state
		if (this.docstatus === 0) {
			throw new InvalidStateError('Cannot cancel a draft document');
		}
		
		if (this.docstatus === 2) {
			throw new InvalidStateError('Document is already cancelled');
		}
		
		// Execute before_cancel hook
		if (this.hooks?.before_cancel) {
			await this.hooks.before_cancel.call(this);
		}
		
		// Update status to cancelled
		this.docstatus = 2;
		this.modified = new Date();
		this.modified_by = 'Administrator';
		
		// Save the document
		await this.save();
		
		// Execute after_cancel hook
		if (this.hooks?.after_cancel) {
			await this.hooks.after_cancel.call(this);
		}
	}
	
	/**
	 * Amend the document (create amended copy)
	 * @returns Promise that resolves to amended document
	 */
	async amend(): Promise<SubmittableDoc> {
		// Check current state
		if (this.docstatus !== 2) {
			throw new InvalidStateError('Can only amend a cancelled document');
		}
		
		// Execute before_amend hook
		if (this.hooks?.before_amend) {
			await this.hooks.before_amend.call(this);
		}
		
		// Create amended copy
		const amendedData = { ...this.as_dict() };
		delete amendedData.name;
		delete amendedData.creation;
		delete amendedData.modified;
		delete amendedData.owner;
		delete amendedData.modified_by;
		
		// Set amended fields
		amendedData.docstatus = 0; // Reset to draft
		amendedData.amended_from = this.name;
		
		// Create new document
		const amendedDoc = new SubmittableDoc(amendedData, this.db, this.hooks);
		amendedDoc.set_is_submittable(this._is_submittable);
		amendedDoc.set_allow_on_submit_fields(this._allow_on_submit_fields);
		
		// Save the amended document
		await amendedDoc.save();
		
		// Execute after_amend hook
		if (this.hooks?.after_amend) {
			await this.hooks.after_amend.call(this);
		}
		
		return amendedDoc;
	}
	
	/**
	 * Override set method to check edit permissions
	 * @param fieldname Field name
	 * @param value Field value
	 */
	set(fieldname: string, value: any): void {
		// Check if document is submitted
		if (this.docstatus === 1) {
			// Check if field is allowed to be edited when submitted
			if (!this._allow_on_submit_fields.includes(fieldname)) {
				throw new CannotEditSubmittedError(
					`Cannot edit field '${fieldname}' in submitted document`
				);
			}
		}
		
		// Call parent set method
		super.set(fieldname, value);
	}
	
	/**
	 * Override delete method to check delete permissions
	 * @returns Promise that resolves when deleted
	 */
	async delete(): Promise<void> {
		// Check if document is submitted
		if (this.docstatus === 1) {
			throw new CannotDeleteSubmittedError(
				'Cannot delete a submitted document'
			);
		}
		
		// Call parent delete method
		await super.delete();
	}
	
	/**
	 * Check if document is submitted
	 * @returns True if document is submitted
	 */
	is_submitted(): boolean {
		return this.docstatus === 1;
	}
	
	/**
	 * Check if document is cancelled
	 * @returns True if document is cancelled
	 */
	is_cancelled(): boolean {
		return this.docstatus === 2;
	}
	
	/**
	 * Check if document is draft
	 * @returns True if document is draft
	 */
	is_draft(): boolean {
		return this.docstatus === 0;
	}
	
	/**
	 * Get allowed status transitions from current state
	 * @returns Array of allowed status values
	 */
	get_allowed_transitions(): DocStatus[] {
		switch (this.docstatus) {
			case 0: // Draft
				return [1]; // Can submit
			case 1: // Submitted
				return [2]; // Can cancel
			case 2: // Cancelled
				return []; // No transitions
			default:
				return [];
		}
	}
	
	/**
	 * Check if a transition is allowed
	 * @param new_status Target status
	 * @returns True if transition is allowed
	 */
	is_transition_allowed(new_status: DocStatus): boolean {
		return this.get_allowed_transitions().includes(new_status);
	}
}