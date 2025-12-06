/**
 * Document Lifecycle Hooks
 * 
 * This module implements lifecycle hook execution during document operations.
 * It provides correct execution order, rollback on error, and previous state tracking.
 */

import { Doc } from './document';
import type { DocumentHooks } from './types';
import type { Database } from '../database';

/**
 * Hook execution context
 */
interface HookContext {
	/** Current operation being performed */
	operation: 'insert' | 'save' | 'submit' | 'cancel' | 'delete' | 'rename';
	/** Previous document state */
	previous_doc?: any;
	/** Current document instance */
	doc: Doc;
}

/**
 * Hook executor for document lifecycle events
 */
export class HookExecutor {
	/**
	 * Execute hooks for document insertion
	 * @param doc Document instance
	 * @param hooks Document hooks
	 * @param db Database instance
	 */
	static async executeInsertHooks(doc: Doc, hooks?: DocumentHooks, db?: Database): Promise<void> {
		const context: HookContext = { operation: 'insert', doc };
		
		try {
			// before_insert
			if (hooks?.before_insert) {
				await hooks.before_insert.call(doc);
			}
			
			// before_naming
			if (hooks?.before_naming) {
				await hooks.before_naming.call(doc);
			}
			
			// autoname
			if (hooks?.autoname) {
				await hooks.autoname.call(doc);
			}
			
			// before_validate
			if (hooks?.before_validate) {
				await hooks.before_validate.call(doc);
			}
			
			// validate
			if (hooks?.validate) {
				await hooks.validate.call(doc);
			}
			
			// before_save
			if (hooks?.before_save) {
				await hooks.before_save.call(doc);
			}
			
			// Insert into database
			if (db) {
				await db.insert(doc.doctype, doc.get_valid_dict());
			}
			
			// after_insert
			if (hooks?.after_insert) {
				await hooks.after_insert.call(doc);
			}
			
			// on_update
			if (hooks?.on_update) {
				await hooks.on_update.call(doc);
			}
			
			// on_change
			if (hooks?.on_change) {
				await hooks.on_change.call(doc);
			}
		} catch (error) {
			// Rollback on error
			await this.handleHookError(error, context, hooks);
			throw error;
		}
	}
	
	/**
	 * Execute hooks for document save
	 * @param doc Document instance
	 * @param hooks Document hooks
	 * @param db Database instance
	 */
	static async executeSaveHooks(doc: Doc, hooks?: DocumentHooks, db?: Database): Promise<void> {
		const context: HookContext = { operation: 'save', doc, previous_doc: doc.get_doc_before_save() };
		
		try {
			// before_validate
			if (hooks?.before_validate) {
				await hooks.before_validate.call(doc);
			}
			
			// validate
			if (hooks?.validate) {
				await hooks.validate.call(doc);
			}
			
			// before_save
			if (hooks?.before_save) {
				if (Array.isArray(hooks.before_save)) {
					// Execute all hooks in array
					for (const hook of hooks.before_save) {
						await hook.call(doc);
					}
				} else {
					// Execute single hook
					await hooks.before_save.call(doc);
				}
			}
			
			// Update in database
			if (db) {
				await db.update(doc.doctype, doc.name, doc.get_valid_dict());
			}
			
			// on_update
			if (hooks?.on_update) {
				await hooks.on_update.call(doc);
			}
			
			// on_change
			if (hooks?.on_change) {
				await hooks.on_change.call(doc);
			}
		} catch (error) {
			// Rollback on error
			await this.handleHookError(error, context, hooks);
			throw error;
		}
	}
	
	/**
	 * Execute hooks for document submit
	 * @param doc Document instance
	 * @param hooks Document hooks
	 * @param db Database instance
	 */
	static async executeSubmitHooks(doc: Doc, hooks?: DocumentHooks, db?: Database): Promise<void> {
		const context: HookContext = { operation: 'submit', doc };
		
		try {
			// before_validate
			if (hooks?.before_validate) {
				await hooks.before_validate.call(doc);
			}
			
			// validate
			if (hooks?.validate) {
				await hooks.validate.call(doc);
			}
			
			// before_submit
			if (hooks?.before_submit) {
				await hooks.before_submit.call(doc);
			}
			
			// Update in database
			if (db) {
				await db.update(doc.doctype, doc.name, doc.get_valid_dict());
			}
			
			// on_submit
			if (hooks?.on_submit) {
				await hooks.on_submit.call(doc);
			}
			
			// after_submit
			if (hooks?.after_submit) {
				await hooks.after_submit.call(doc);
			}
			
			// on_update
			if (hooks?.on_update) {
				await hooks.on_update.call(doc);
			}
			
			// on_change
			if (hooks?.on_change) {
				await hooks.on_change.call(doc);
			}
		} catch (error) {
			// Rollback on error
			await this.handleHookError(error, context, hooks);
			throw error;
		}
	}
	
	/**
	 * Execute hooks for document cancel
	 * @param doc Document instance
	 * @param hooks Document hooks
	 * @param db Database instance
	 */
	static async executeCancelHooks(doc: Doc, hooks?: DocumentHooks, db?: Database): Promise<void> {
		const context: HookContext = { operation: 'cancel', doc };
		
		try {
			// before_cancel
			if (hooks?.before_cancel) {
				await hooks.before_cancel.call(doc);
			}
			
			// Update in database
			if (db) {
				await db.update(doc.doctype, doc.name, doc.get_valid_dict());
			}
			
			// on_cancel
			if (hooks?.on_cancel) {
				await hooks.on_cancel.call(doc);
			}
			
			// after_cancel
			if (hooks?.after_cancel) {
				await hooks.after_cancel.call(doc);
			}
			
			// on_update
			if (hooks?.on_update) {
				await hooks.on_update.call(doc);
			}
			
			// on_change
			if (hooks?.on_change) {
				await hooks.on_change.call(doc);
			}
		} catch (error) {
			// Rollback on error
			await this.handleHookError(error, context, hooks);
			throw error;
		}
	}
	
	/**
	 * Execute hooks for document delete
	 * @param doc Document instance
	 * @param hooks Document hooks
	 * @param db Database instance
	 */
	static async executeDeleteHooks(doc: Doc, hooks?: DocumentHooks, db?: Database): Promise<void> {
		const context: HookContext = { operation: 'delete', doc };
		
		try {
			// on_trash
			if (hooks?.on_trash) {
				await hooks.on_trash.call(doc);
			}
			
			// Delete from database
			if (db) {
				await db.delete(doc.doctype, doc.name);
			}
			
			// after_delete
			if (hooks?.after_delete) {
				await hooks.after_delete.call(doc);
			}
		} catch (error) {
			// Rollback on error
			await this.handleHookError(error, context, hooks);
			throw error;
		}
	}
	
	/**
	 * Execute hooks for document rename
	 * @param doc Document instance
	 * @param oldName Old document name
	 * @param newName New document name
	 * @param hooks Document hooks
	 * @param db Database instance
	 */
	static async executeRenameHooks(
		doc: Doc, 
		oldName: string, 
		newName: string, 
		hooks?: DocumentHooks, 
		db?: Database
	): Promise<void> {
		const context: HookContext = { operation: 'rename', doc };
		
		try {
			// before_rename
			if (hooks?.before_rename) {
				await hooks.before_rename.call(doc, oldName, newName);
			}
			
			// Update in database
			if (db) {
				await db.update(doc.doctype, oldName, { ...doc.get_valid_dict(), name: newName });
			}
			
			// after_rename
			if (hooks?.after_rename) {
				await hooks.after_rename.call(doc, oldName, newName);
			}
		} catch (error) {
			// Rollback on error
			await this.handleHookError(error, context, hooks);
			throw error;
		}
	}
	
	/**
	 * Handle hook execution errors
	 * @param error Error that occurred
	 * @param context Hook execution context
	 * @param hooks Document hooks
	 */
	private static async handleHookError(error: any, context: HookContext, hooks?: DocumentHooks): Promise<void> {
		// Log error
		console.error(`Hook error during ${context.operation}:`, error);
		
		// Execute error handling hook if available
		if (hooks?.on_error) {
			try {
				await hooks.on_error.call(context.doc, error, context);
			} catch (hookError) {
				console.error('Error in error handler hook:', hookError);
			}
		}
	}
}

/**
 * Enhanced Document class with integrated hook execution
 */
export class DocumentWithHooks extends Doc {
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
	 * Insert with hooks
	 */
	async insert(): Promise<string> {
		await HookExecutor.executeInsertHooks(this, this.hooks, this.db);
		return this.name;
	}
	
	/**
	 * Save with hooks
	 */
	async save(): Promise<void> {
		if (this.is_new()) {
			await this.insert();
			return;
		}
		
		await HookExecutor.executeSaveHooks(this, this.hooks, this.db);
	}
	
	/**
	 * Delete with hooks
	 */
	async delete(): Promise<void> {
		await HookExecutor.executeDeleteHooks(this, this.hooks, this.db);
	}
	
	/**
	 * Rename with hooks
	 * @param newName New name
	 */
	async rename(newName: string): Promise<void> {
		const oldName = this.name;
		await HookExecutor.executeRenameHooks(this, oldName, newName, this.hooks, this.db);
		this.name = newName;
	}
}