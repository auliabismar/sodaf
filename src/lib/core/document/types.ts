/**
 * Base document fields that are present in all documents
 */
export interface BaseDocFields {
	/** Unique identifier for the document */
	name: string;
	/** Document type identifier */
	doctype: string;
	/** Document status: 0=Draft, 1=Submitted, 2=Cancelled */
	docstatus: DocStatus;
	/** Creation timestamp */
	creation: Date;
	/** Last modification timestamp */
	modified: Date;
	/** User who created the document */
	owner: string;
	/** User who last modified the document */
	modified_by: string;
	/** Index for child documents */
	idx?: number;
	/** Parent document name for child documents */
	parent?: string;
	/** Parent document type for child documents */
	parenttype?: string;
	/** Parent field name for child documents */
	parentfield?: string;
}

/**
 * Document status type
 * 0 - Draft: Document is being edited
 * 1 - Submitted: Document is submitted and locked for editing
 * 2 - Cancelled: Document is cancelled
 */
export type DocStatus = 0 | 1 | 2;

/**
 * Lifecycle hooks that can be implemented on document classes
 */
export interface DocumentHooks {
	/** Called before document is inserted */
	before_insert?: () => void | Promise<void>;
	/** Called before document naming */
	before_naming?: () => void | Promise<void>;
	/** Called to auto-generate document name */
	autoname?: () => void | Promise<void>;
	/** Called before document validation */
	before_validate?: () => void | Promise<void>;
	/** Called to validate document before saving */
	validate?: () => void | Promise<void>;
	/** Called before document is saved (insert or update) */
	before_save?: () => void | Promise<void>;
	/** Called after document is inserted */
	after_insert?: () => void | Promise<void>;
	/** Called when document is updated */
	on_update?: () => void | Promise<void>;
	/** Called when document is changed */
	on_change?: () => void | Promise<void>;
	/** Called before document is updated */
	before_update?: () => void | Promise<void>;
	/** Called after document is updated */
	after_update?: () => void | Promise<void>;
	/** Called after document is saved (insert or update) */
	after_save?: () => void | Promise<void>;
	/** Called before document is deleted */
	before_delete?: () => void | Promise<void>;
	/** Called when document is trashed (before deletion) */
	on_trash?: () => void | Promise<void>;
	/** Called after document is deleted */
	after_delete?: () => void | Promise<void>;
	/** Called before document is submitted */
	before_submit?: () => void | Promise<void>;
	/** Called after document is submitted */
	on_submit?: () => void | Promise<void>;
	/** Called after document is submitted and saved */
	after_submit?: () => void | Promise<void>;
	/** Called before document is cancelled */
	before_cancel?: () => void | Promise<void>;
	/** Called after document is cancelled */
	on_cancel?: () => void | Promise<void>;
	/** Called after document is cancelled and saved */
	after_cancel?: () => void | Promise<void>;
	/** Called before document is amended */
	before_amend?: () => void | Promise<void>;
	/** Called after document is amended */
	after_amend?: () => void | Promise<void>;
	/** Called before document is renamed */
	before_rename?: (oldName: string, newName: string) => void | Promise<void>;
	/** Called after document is renamed */
	after_rename?: (oldName: string, newName: string) => void | Promise<void>;
	/** Called when document is reloaded */
	on_reload?: () => void | Promise<void>;
	/** Called when a hook encounters an error */
	on_error?: (error: any, context: any) => void | Promise<void>;
}

/**
 * Document validation error
 */
export interface ValidationError {
	/** Field name that failed validation */
	field?: string;
	/** Error message */
	message: string;
	/** Error code */
	code?: string;
}

/**
 * Document permissions
 */
export interface DocumentPermissions {
	/** Permission to read document */
	read?: boolean;
	/** Permission to create document */
	create?: boolean;
	/** Permission to update document */
	write?: boolean;
	/** Permission to delete document */
	delete?: boolean;
	/** Permission to submit document */
	submit?: boolean;
	/** Permission to cancel document */
	cancel?: boolean;
	/** Permission to amend document */
	amend?: boolean;
}

/**
 * Document options for operations
 */
export interface DocumentOptions {
	/** Skip validation */
	skip_validation?: boolean;
	/** Skip permissions check */
	skip_permissions?: boolean;
	/** Ignore permissions check */
	ignore_permissions?: boolean;
	/** Skip version update */
	skip_version_update?: boolean;
	/** Skip email notification */
	skip_email_notification?: boolean;
}