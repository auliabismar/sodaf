/**
 * Form View Types and Interfaces
 * 
 * This file defines TypeScript interfaces for form view state and controller
 * used in the desk admin interface.
 */

import type { DocType, DocField } from '../../meta/doctype/types';

/**
 * State of an individual field in the form
 */
export interface FieldState {
    /** Current value of the field */
    value: any;

    /** Validation error message for the field */
    error?: string;

    /** Whether the field has been interacted with */
    touched: boolean;

    /** Whether the field is disabled */
    disabled: boolean;

    /** Whether the field is hidden */
    hidden: boolean;

    /** Original value before changes */
    original_value?: any;

    /** Whether the field value has changed */
    is_dirty?: boolean;
}

/**
 * Mapping of field names to error messages
 */
export interface FormErrors {
    /** Field-level error messages */
    [fieldname: string]: string | string[];
}

/**
 * Form permission flags
 */
export interface FormPermissions {
    /** Whether user can save the document */
    can_save: boolean;

    /** Whether user can submit the document (for submittable DocTypes) */
    can_submit: boolean;

    /** Whether user can cancel the document */
    can_cancel: boolean;

    /** Whether user can delete the document */
    can_delete: boolean;

    /** Whether user can amend the document */
    can_amend?: boolean;

    /** Whether user can print the document */
    can_print?: boolean;

    /** Whether user can email the document */
    can_email?: boolean;

    /** Whether user can share the document */
    can_share?: boolean;
}

/**
 * Form UI state for tracking visual/interactive state
 */
export interface FormUIState {
    /** Currently active tab name */
    active_tab?: string;

    /** List of collapsed section fieldnames */
    collapsed_sections: string[];

    /** List of hidden field fieldnames */
    hidden_fields: string[];

    /** List of disabled field fieldnames */
    disabled_fields: string[];

    /** Whether form is in quick entry mode */
    quick_entry_mode?: boolean;

    /** Whether form is in edit mode vs read mode */
    edit_mode: boolean;

    /** Whether the sidebar is expanded */
    sidebar_expanded?: boolean;

    /** Timeline entries for the view */
    timeline?: FormTimelineEntry[];
}

/**
 * Main form view state interface
 */
export interface FormViewState {
    /** The current document data */
    doc: Record<string, any>;

    /** The DocType definition */
    doctype: DocType;

    /** Whether this is a new document */
    is_new: boolean;

    /** Whether form has unsaved changes */
    is_dirty: boolean;

    /** Whether form is loading data */
    is_loading: boolean;

    /** Whether form is saving */
    is_saving: boolean;

    /** Whether form is submitting */
    is_submitting: boolean;

    /** Current validation errors */
    errors: FormErrors;

    /** Per-field state tracking */
    field_states: Record<string, FieldState>;

    /** Permission flags */
    permissions: FormPermissions;

    /** UI state */
    ui_state: FormUIState;

    /** Original document data before changes */
    original_doc?: Record<string, any>;

    /** Document workflow state (if applicable) */
    workflow_state?: string;

    /** Document docstatus (0: Draft, 1: Submitted, 2: Cancelled) */
    docstatus?: number;

    /** Document name/ID */
    name?: string;
}

/**
 * Form event handler types
 */
export interface FormEvents {
    /** Called when form is loaded with document data */
    on_load?: (state: FormViewState) => void | Promise<void>;

    /** Called when form is refreshed */
    on_refresh?: (state: FormViewState) => void | Promise<void>;

    /** Called before form is saved */
    on_before_save?: (state: FormViewState) => boolean | Promise<boolean>;

    /** Called when form is saved */
    on_save?: (state: FormViewState, result: SaveResult) => void | Promise<void>;

    /** Called after form is saved successfully */
    on_after_save?: (state: FormViewState, result: SaveResult) => void | Promise<void>;

    /** Called before form is submitted */
    on_before_submit?: (state: FormViewState) => boolean | Promise<boolean>;

    /** Called when form is submitted */
    on_submit?: (state: FormViewState, result: SaveResult) => void | Promise<void>;

    /** Called after form is submitted successfully */
    on_after_submit?: (state: FormViewState, result: SaveResult) => void | Promise<void>;

    /** Called when form is cancelled */
    on_cancel?: (state: FormViewState) => void | Promise<void>;

    /** Called before form is deleted */
    on_before_delete?: (state: FormViewState) => boolean | Promise<boolean>;

    /** Called when form is deleted */
    on_delete?: (state: FormViewState) => void | Promise<void>;

    /** Called when a field value changes */
    on_field_change?: (fieldname: string, value: any, state: FormViewState) => void | Promise<void>;

    /** Called when form validation runs */
    on_validate?: (state: FormViewState) => boolean | Promise<boolean>;

    /** Called when validation error occurs */
    on_validation_error?: (errors: FormErrors, state: FormViewState) => void;

    /** Called when form encounters an error */
    on_error?: (error: Error, state: FormViewState) => void;

    /** Called when auto-save completes successfully */
    on_auto_save?: (state: FormViewState, result: SaveResult) => void | Promise<void>;

    /** Called when auto-save encounters an error */
    on_auto_save_error?: (error: Error, state: FormViewState, result?: SaveResult) => void | Promise<void>;
}

/**
 * Result of a save/submit operation
 */
export interface SaveResult {
    /** Whether the operation was successful */
    success: boolean;

    /** Document name (may be new if auto-generated) */
    name?: string;

    /** The saved document data */
    doc?: Record<string, any>;

    /** Validation or server errors */
    errors?: FormErrors;

    /** Server-side error message */
    message?: string;

    /** Server HTTP status code */
    status?: number;

    /** Exception details (for debugging) */
    exception?: string;
}

/**
 * Form controller configuration
 */
export interface FormControllerConfig {
    /** DocType name */
    doctype: string;

    /** Document name (for existing documents) */
    name?: string;

    /** Initial document values (for new documents) */
    initial_values?: Record<string, any>;

    /** Event handlers */
    events?: FormEvents;

    /** Whether to auto-save form */
    auto_save?: boolean;

    /** Auto-save debounce interval in ms */
    auto_save_interval?: number;

    /** Whether to validate on field change */
    validate_on_change?: boolean;

    /** Whether to validate before auto-save */
    validate_on_auto_save?: boolean;

    /** Maximum number of auto-save retries */
    auto_save_max_retries?: number;

    /** Whether to show auto-save notifications */
    show_auto_save_notifications?: boolean;

    /** Whether to show loading state */
    show_loading?: boolean;

    /** Callback URLs for navigation */
    routes?: {
        /** URL to navigate after save */
        after_save?: string;
        /** URL to navigate after delete */
        after_delete?: string;
        /** URL for cancel/back action */
        cancel?: string;
    };
}

/**
 * Form action button configuration
 */
export interface FormAction {
    /** Action label */
    label: string;

    /** Action icon */
    icon?: string;

    /** Action handler */
    action: (state: FormViewState) => void | Promise<void>;

    /** Whether action is primary */
    primary?: boolean;

    /** Whether action is danger (destructive) */
    danger?: boolean;

    /** Condition for showing action */
    condition?: (state: FormViewState) => boolean;

    /** Whether action is disabled */
    disabled?: (state: FormViewState) => boolean;

    /** Keyboard shortcut */
    shortcut?: string;

    /** Action group (for dropdown menus) */
    group?: string;
}

/**
 * Child table row state
 */
export interface ChildTableRowState {
    /** Row index */
    idx: number;

    /** Row name/ID */
    name?: string;

    /** Row data */
    data: Record<string, any>;

    /** Row validation errors */
    errors?: FormErrors;

    /** Whether row is being edited */
    is_editing?: boolean;

    /** Whether row is selected */
    is_selected?: boolean;

    /** Whether row is new (unsaved) */
    is_new?: boolean;
}

/**
 * Child table state
 */
export interface ChildTableState {
    /** Table fieldname */
    fieldname: string;

    /** Child DocType name */
    child_doctype: string;

    /** Rows in the table */
    rows: ChildTableRowState[];

    /** Currently editing row index */
    editing_idx?: number;

    /** Selected row indices */
    selected_rows: number[];

    /** Sort configuration */
    sort?: {
        field: string;
        order: 'asc' | 'desc';
    };
}

/**
 * Form timeline entry
 */
export interface FormTimelineEntry {
    /** Entry type */
    type: 'comment' | 'version' | 'assignment' | 'share' | 'attachment' | 'like' | 'workflow';

    /** Timestamp */
    timestamp: Date | string;

    /** User who performed the action */
    user: string;

    /** Entry content/message */
    content: string;

    /** Additional data */
    data?: Record<string, any>;
}

/**
 * Form sidebar state
 */
export interface FormSidebarState {
    /** Whether sidebar is visible */
    visible: boolean;

    /** Active sidebar section */
    active_section?: 'timeline' | 'attachments' | 'comments' | 'tags' | 'links' | 'versions';

    /** Timeline entries */
    timeline?: FormTimelineEntry[];

    /** Attachments */
    attachments?: Array<{
        name: string;
        file_url: string;
        file_name: string;
        file_size?: number;
        is_private?: boolean;
    }>;

    /** Comments */
    comments?: Array<{
        name: string;
        content: string;
        user: string;
        timestamp: Date | string;
    }>;

    /** Tags */
    tags?: string[];

    /** Linked documents */
    links?: Array<{
        doctype: string;
        name: string;
        link_type: string;
    }>;
}

/**
 * Print format configuration
 */
export interface PrintFormatConfig {
    /** Print format name */
    name: string;

    /** Print format doc type */
    doctype: string;

    /** Whether this is the default format */
    is_default?: boolean;

    /** Paper size */
    paper_size?: string;

    /** Orientation */
    orientation?: 'Portrait' | 'Landscape';
}

/**
 * Form print settings
 */
export interface FormPrintSettings {
    /** Available print formats */
    print_formats: PrintFormatConfig[];

    /** Selected print format */
    selected_format?: string;

    /** Letter head */
    letter_head?: string;

    /** Available letter heads */
    letter_heads?: string[];
}
