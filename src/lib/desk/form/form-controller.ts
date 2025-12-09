/**
 * Form Controller
 * 
 * Controller for form view state management, document CRUD operations,
 * validation, and event handling.
 * 
 * @module desk/form/form-controller
 */

import { writable, get, type Writable, type Unsubscriber } from 'svelte/store';
import type {
    FormViewState,
    FormErrors,
    FormEvents,
    SaveResult,
    FormControllerConfig,
    FormPermissions,
    FormUIState,
    FieldState
} from './types';
import type { DocType, DocField } from '../../meta/doctype/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Permission type for form operations
 */
export type FormPermissionType = 'save' | 'submit' | 'cancel' | 'delete' | 'amend';

/**
 * Event handler remover function
 */
type EventRemover = () => void;

// =============================================================================
// Form Controller Class
// =============================================================================

/**
 * FormController manages form state, document operations, and validation.
 * 
 * Provides complete CRUD operations, validation integration, state management,
 * and event system for document editing in the desk admin interface.
 */
export class FormController {
    // === State Management ===
    private store: Writable<FormViewState>;
    private readonly _doctype: string;
    private doctypeInfo?: DocType;
    private eventHandlers: Map<keyof FormEvents, Set<Function>>;
    private autoSaveTimeout?: ReturnType<typeof setTimeout>;
    private autoSaveInterval: number;
    private validateOnChange: boolean;
    private config?: FormControllerConfig;
    private autoSaveRetries: number = 0;

    /**
     * Create a new FormController instance
     * 
     * @param doctype - DocType name for this form
     * @param config - Optional configuration
     */
    constructor(doctype: string, config?: FormControllerConfig) {
        this._doctype = doctype;
        this.config = config;
        this.eventHandlers = new Map();
        this.autoSaveInterval = config?.auto_save_interval ?? 30000;
        this.validateOnChange = config?.validate_on_change ?? false;

        // Initialize with empty state
        this.store = writable<FormViewState>(this.buildInitialState());

        // Register config event handlers
        if (config?.events) {
            for (const [event, handler] of Object.entries(config.events)) {
                if (handler) {
                    this.on(event as keyof FormEvents, handler as FormEvents[keyof FormEvents]);
                }
            }
        }
    }

    /**
     * Get the doctype name
     */
    get doctype(): string {
        return this._doctype;
    }

    // =========================================================================
    // Store Access
    // =========================================================================

    /**
     * Subscribe to store updates
     * 
     * @param run - Callback function called with current state
     * @param invalidate - Optional invalidation callback
     * @returns Unsubscriber function
     */
    subscribe(
        run: (value: FormViewState) => void,
        invalidate?: (value?: FormViewState) => void
    ): Unsubscriber {
        return this.store.subscribe(run, invalidate);
    }

    /**
     * Get current state snapshot
     * 
     * @returns Current form view state
     */
    getState(): FormViewState {
        return get(this.store);
    }

    // =========================================================================
    // Document Loading
    // =========================================================================

    /**
     * Load a document by name or create a new document state
     * 
     * @param name - Document name to load, or undefined for new document
     */
    async load(name?: string): Promise<void> {
        this.updateState({ is_loading: true });

        try {
            // Load DocType info first if not loaded
            if (!this.doctypeInfo) {
                await this.loadDocTypeInfo();
            }

            if (name) {
                // Load existing document
                const response = await fetch(`/api/resource/${this.normalizeForUrl(this._doctype)}/${name}`);

                if (!response.ok) {
                    throw new Error(`Failed to load document: ${response.statusText}`);
                }

                const result = await response.json();
                const doc = result.data;

                this.updateState({
                    doc,
                    original_doc: { ...doc },
                    is_new: false,
                    is_dirty: false,
                    is_loading: false,
                    name: doc.name,
                    docstatus: doc.docstatus ?? 0,
                    workflow_state: doc.workflow_state,
                    field_states: this.buildFieldStates(doc),
                    errors: {}
                });

                await this.triggerEvent('on_load', this.getState());
            } else {
                // Create new document
                const emptyDoc = this.createEmptyDoc();

                this.updateState({
                    doc: emptyDoc,
                    original_doc: { ...emptyDoc },
                    is_new: true,
                    is_dirty: false,
                    is_loading: false,
                    name: undefined,
                    docstatus: 0,
                    field_states: this.buildFieldStates(emptyDoc),
                    errors: {}
                });

                await this.triggerEvent('on_load', this.getState());
            }
        } catch (error) {
            this.updateState({ is_loading: false });
            await this.triggerEvent('on_error', error as Error, this.getState());
            throw error;
        }
    }

    /**
     * Load a new document with default values
     * 
     * @param defaults - Default field values
     */
    async loadWithDefaults(defaults: Record<string, any>): Promise<void> {
        this.updateState({ is_loading: true });

        try {
            if (!this.doctypeInfo) {
                await this.loadDocTypeInfo();
            }

            const emptyDoc = this.createEmptyDoc();
            const doc = { ...emptyDoc, ...defaults };

            this.updateState({
                doc,
                original_doc: { ...doc },
                is_new: true,
                is_dirty: false,
                is_loading: false,
                name: undefined,
                docstatus: 0,
                field_states: this.buildFieldStates(doc),
                errors: {}
            });

            await this.triggerEvent('on_load', this.getState());
        } catch (error) {
            this.updateState({ is_loading: false });
            await this.triggerEvent('on_error', error as Error, this.getState());
            throw error;
        }
    }

    /**
     * Reload the current document from the server
     */
    async reload(): Promise<void> {
        const state = this.getState();
        if (state.is_new || !state.name) {
            // Cannot reload a new document
            return;
        }

        await this.load(state.name);
        await this.triggerEvent('on_refresh', this.getState());
    }

    // =========================================================================
    // CRUD Operations
    // =========================================================================

    /**
     * Save the current document
     * 
     * @returns Save result with success status and document data
     */
    async save(isAutoSave = false): Promise<SaveResult> {
        const state = this.getState();

        // Run before_save hook
        const shouldContinue = await this.triggerBeforeEvent('on_before_save');
        if (!shouldContinue) {
            return {
                success: false,
                message: 'Save cancelled by event handler'
            };
        }

        // Skip validation for auto-save if configured
        if (!isAutoSave || this.config?.validate_on_auto_save) {
            // Validate first
            const isValid = this.validate();
            if (!isValid) {
                const errors = this.getErrors();
                await this.triggerEvent('on_validation_error', errors, this.getState());
                return {
                    success: false,
                    errors,
                    message: 'Validation failed'
                };
            }
        }

        this.updateState({ is_saving: true });

        try {
            let response: Response;
            const doctype = this.normalizeForUrl(this._doctype);

            if (state.is_new) {
                // Create new document (POST)
                response = await fetch(`/api/resource/${doctype}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ doc: state.doc })
                });
            } else {
                // Update existing document (PUT)
                response = await fetch(`/api/resource/${doctype}/${state.name}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ doc: state.doc })
                });
            }

            const result = await response.json();

            if (!response.ok) {
                const saveResult: SaveResult = {
                    success: false,
                    message: result.error?.message ?? 'Save failed',
                    errors: result.error?.validation_errors,
                    status: response.status
                };

                this.updateState({ is_saving: false });
                await this.triggerEvent('on_error', new Error(saveResult.message!), this.getState());
                return saveResult;
            }

            const savedDoc = result.data;
            const saveResult: SaveResult = {
                success: true,
                name: savedDoc.name,
                doc: savedDoc
            };

            this.updateState({
                doc: savedDoc,
                original_doc: { ...savedDoc },
                is_new: false,
                is_dirty: false,
                is_saving: false,
                name: savedDoc.name,
                field_states: this.buildFieldStates(savedDoc),
                errors: {}
            });

            await this.triggerEvent('on_save', this.getState(), saveResult);
            await this.triggerEvent('on_after_save', this.getState(), saveResult);

            this.cancelAutoSave();

            return saveResult;
        } catch (error) {
            this.updateState({ is_saving: false });
            await this.triggerEvent('on_error', error as Error, this.getState());

            return {
                success: false,
                message: (error as Error).message,
                exception: (error as Error).stack
            };
        }
    }

    /**
     * Delete the current document
     * 
     * @returns Delete result with success status
     */
    async delete(): Promise<SaveResult> {
        const state = this.getState();

        if (state.is_new || !state.name) {
            return {
                success: false,
                message: 'Cannot delete a new document'
            };
        }

        // Run before_delete hook
        const shouldContinue = await this.triggerBeforeEvent('on_before_delete');
        if (!shouldContinue) {
            return {
                success: false,
                message: 'Delete cancelled by event handler'
            };
        }

        this.updateState({ is_loading: true });

        try {
            const doctype = this.normalizeForUrl(this._doctype);
            const response = await fetch(`/api/resource/${doctype}/${state.name}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!response.ok) {
                const deleteResult: SaveResult = {
                    success: false,
                    message: result.error?.message ?? 'Delete failed',
                    status: response.status
                };

                this.updateState({ is_loading: false });
                return deleteResult;
            }

            const deleteResult: SaveResult = {
                success: true,
                message: 'Document deleted'
            };

            await this.triggerEvent('on_delete', this.getState());

            // Reset to new document state
            this.updateState({
                doc: this.createEmptyDoc(),
                original_doc: {},
                is_new: true,
                is_dirty: false,
                is_loading: false,
                name: undefined,
                errors: {}
            });

            return deleteResult;
        } catch (error) {
            this.updateState({ is_loading: false });
            await this.triggerEvent('on_error', error as Error, this.getState());

            return {
                success: false,
                message: (error as Error).message,
                exception: (error as Error).stack
            };
        }
    }

    // =========================================================================
    // Workflow Operations
    // =========================================================================

    /**
     * Submit the current document
     * 
     * @returns Submit result with success status
     */
    async submit(): Promise<SaveResult> {
        const state = this.getState();

        if (state.is_new) {
            // Save first if new
            const saveResult = await this.save();
            if (!saveResult.success) {
                return saveResult;
            }
        }

        // Run before_submit hook
        const shouldContinue = await this.triggerBeforeEvent('on_before_submit');
        if (!shouldContinue) {
            return {
                success: false,
                message: 'Submit cancelled by event handler'
            };
        }

        this.updateState({ is_submitting: true });

        try {
            const doctype = this.normalizeForUrl(this._doctype);
            const currentState = this.getState();

            const response = await fetch(`/api/resource/${doctype}/${currentState.name}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (!response.ok) {
                const submitResult: SaveResult = {
                    success: false,
                    message: result.error?.message ?? 'Submit failed',
                    status: response.status
                };

                this.updateState({ is_submitting: false });
                return submitResult;
            }

            const submittedDoc = result.data;
            const submitResult: SaveResult = {
                success: true,
                name: submittedDoc.name,
                doc: submittedDoc
            };

            this.updateState({
                doc: submittedDoc,
                original_doc: { ...submittedDoc },
                is_submitting: false,
                docstatus: 1,
                field_states: this.buildFieldStates(submittedDoc)
            });

            await this.triggerEvent('on_submit', this.getState(), submitResult);
            await this.triggerEvent('on_after_submit', this.getState(), submitResult);

            return submitResult;
        } catch (error) {
            this.updateState({ is_submitting: false });
            await this.triggerEvent('on_error', error as Error, this.getState());

            return {
                success: false,
                message: (error as Error).message,
                exception: (error as Error).stack
            };
        }
    }

    /**
     * Cancel the current document (for submitted documents)
     * 
     * @returns Cancel result with success status
     */
    async cancel(): Promise<SaveResult> {
        const state = this.getState();

        if (state.docstatus !== 1) {
            return {
                success: false,
                message: 'Only submitted documents can be cancelled'
            };
        }

        this.updateState({ is_loading: true });

        try {
            const doctype = this.normalizeForUrl(this._doctype);

            const response = await fetch(`/api/resource/${doctype}/${state.name}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (!response.ok) {
                const cancelResult: SaveResult = {
                    success: false,
                    message: result.error?.message ?? 'Cancel failed',
                    status: response.status
                };

                this.updateState({ is_loading: false });
                return cancelResult;
            }

            const cancelledDoc = result.data;
            const cancelResult: SaveResult = {
                success: true,
                name: cancelledDoc.name,
                doc: cancelledDoc
            };

            this.updateState({
                doc: cancelledDoc,
                original_doc: { ...cancelledDoc },
                is_loading: false,
                docstatus: 2,
                field_states: this.buildFieldStates(cancelledDoc)
            });

            await this.triggerEvent('on_cancel', this.getState());

            return cancelResult;
        } catch (error) {
            this.updateState({ is_loading: false });
            await this.triggerEvent('on_error', error as Error, this.getState());

            return {
                success: false,
                message: (error as Error).message,
                exception: (error as Error).stack
            };
        }
    }

    /**
     * Create an amended copy of the current document
     */
    async amend(): Promise<void> {
        const state = this.getState();

        if (state.docstatus !== 2) {
            throw new Error('Only cancelled documents can be amended');
        }

        const amendedDoc = { ...state.doc };

        // Clear name and set amended_from
        delete amendedDoc.name;
        amendedDoc.amended_from = state.name;
        amendedDoc.docstatus = 0;

        this.updateState({
            doc: amendedDoc,
            original_doc: { ...amendedDoc },
            is_new: true,
            is_dirty: true,
            name: undefined,
            docstatus: 0,
            field_states: this.buildFieldStates(amendedDoc)
        });
    }

    // =========================================================================
    // Document Operations
    // =========================================================================

    /**
     * Create a duplicate of the current document
     */
    async duplicate(): Promise<void> {
        const state = this.getState();

        const duplicatedDoc = { ...state.doc };

        // Clear name and identity fields
        delete duplicatedDoc.name;
        delete duplicatedDoc.creation;
        delete duplicatedDoc.modified;
        delete duplicatedDoc.modified_by;
        delete duplicatedDoc.owner;
        delete duplicatedDoc.docstatus;
        delete duplicatedDoc.amended_from;

        this.updateState({
            doc: duplicatedDoc,
            original_doc: {},
            is_new: true,
            is_dirty: true,
            name: undefined,
            docstatus: 0,
            field_states: this.buildFieldStates(duplicatedDoc)
        });
    }

    // =========================================================================
    // Value Management
    // =========================================================================

    /**
     * Set a single field value
     * 
     * @param field - Field name
     * @param value - New value
     */
    setValue(field: string, value: any): void {
        const state = this.getState();
        const newDoc = { ...state.doc, [field]: value };
        const fieldStates = { ...state.field_states };

        // Update field state
        fieldStates[field] = {
            ...fieldStates[field],
            value,
            touched: true,
            is_dirty: value !== state.original_doc?.[field]
        };

        this.updateState({
            doc: newDoc,
            field_states: fieldStates
        });

        this.markDirty();

        // Validate on change if enabled
        if (this.validateOnChange) {
            this.validateField(field);
        }

        // Trigger field change event
        this.triggerEvent('on_field_change', field, value, this.getState());

        // Schedule auto-save if enabled
        if (this.config?.auto_save) {
            this.scheduleAutoSave();
        }
    }

    /**
     * Get a field value
     * 
     * @param field - Field name
     * @returns Field value
     */
    getValue(field: string): any {
        const state = this.getState();
        return state.doc[field];
    }

    /**
     * Set multiple field values at once
     * 
     * @param values - Object with field->value pairs
     */
    setValues(values: Record<string, any>): void {
        const state = this.getState();
        const newDoc = { ...state.doc, ...values };
        const fieldStates = { ...state.field_states };

        for (const [field, value] of Object.entries(values)) {
            fieldStates[field] = {
                ...fieldStates[field],
                value,
                touched: true,
                is_dirty: value !== state.original_doc?.[field]
            };
        }

        this.updateState({
            doc: newDoc,
            field_states: fieldStates
        });

        this.markDirty();

        // Schedule auto-save if enabled
        if (this.config?.auto_save) {
            this.scheduleAutoSave();
        }
    }

    // =========================================================================
    // State Queries
    // =========================================================================

    /**
     * Check if the document has unsaved changes
     * 
     * @returns True if document has been modified
     */
    isDirty(): boolean {
        return this.getState().is_dirty;
    }

    /**
     * Check if this is a new (unsaved) document
     * 
     * @returns True if document has not been saved
     */
    isNew(): boolean {
        return this.getState().is_new;
    }

    // =========================================================================
    // Validation
    // =========================================================================

    /**
     * Validate all fields
     * 
     * @returns True if all validations pass
     */
    validate(): boolean {
        const state = this.getState();
        const errors: FormErrors = {};
        const fieldStates = { ...state.field_states };

        if (!this.doctypeInfo?.fields) {
            return true;
        }

        for (const field of this.doctypeInfo.fields) {
            const error = this.validateSingleField(field, state.doc[field.fieldname]);

            if (error) {
                errors[field.fieldname] = error;
                fieldStates[field.fieldname] = {
                    ...fieldStates[field.fieldname],
                    error
                };
            } else {
                fieldStates[field.fieldname] = {
                    ...fieldStates[field.fieldname],
                    error: undefined
                };
            }
        }

        this.updateState({ errors, field_states: fieldStates });

        // Trigger validate event
        this.triggerEvent('on_validate', this.getState());

        return Object.keys(errors).length === 0;
    }

    /**
     * Validate a single field
     * 
     * @param fieldname - Field name to validate
     * @returns Error message or null if valid
     */
    validateField(fieldname: string): string | null {
        const state = this.getState();
        const field = this.doctypeInfo?.fields?.find(f => f.fieldname === fieldname);

        if (!field) {
            return null;
        }

        const value = state.doc[fieldname];
        const error = this.validateSingleField(field, value);

        const errors = { ...state.errors };
        const fieldStates = { ...state.field_states };

        if (error) {
            errors[fieldname] = error;
            fieldStates[fieldname] = {
                ...fieldStates[fieldname],
                error
            };
        } else {
            delete errors[fieldname];
            fieldStates[fieldname] = {
                ...fieldStates[fieldname],
                error: undefined
            };
        }

        this.updateState({ errors, field_states: fieldStates });

        return error;
    }

    /**
     * Get all current validation errors
     * 
     * @returns Object mapping field names to error messages
     */
    getErrors(): FormErrors {
        return { ...this.getState().errors };
    }

    /**
     * Clear error for a specific field
     * 
     * @param field - Field name to clear error for
     */
    clearError(field: string): void {
        const state = this.getState();
        const errors = { ...state.errors };
        const fieldStates = { ...state.field_states };

        delete errors[field];

        if (fieldStates[field]) {
            fieldStates[field] = {
                ...fieldStates[field],
                error: undefined
            };
        }

        this.updateState({ errors, field_states: fieldStates });
    }

    // =========================================================================
    // Permissions
    // =========================================================================

    /**
     * Check if user has permission for the given operation
     * 
     * @param permission - Permission type to check
     * @returns True if user has permission
     */
    hasPermission(permission: FormPermissionType): boolean {
        const state = this.getState();
        const permissions = state.permissions;

        switch (permission) {
            case 'save':
                return permissions.can_save;
            case 'submit':
                return permissions.can_submit;
            case 'cancel':
                return permissions.can_cancel;
            case 'delete':
                return permissions.can_delete;
            case 'amend':
                return permissions.can_amend ?? false;
            default:
                return false;
        }
    }

    // =========================================================================
    // Event System
    // =========================================================================

    /**
     * Subscribe to a form event
     * 
     * @param event - Event name
     * @param handler - Event handler function
     * @returns Function to remove the event handler
     */
    on<K extends keyof FormEvents>(event: K, handler: FormEvents[K]): EventRemover {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }

        this.eventHandlers.get(event)!.add(handler as Function);

        return () => this.off(event, handler);
    }

    /**
     * Unsubscribe from a form event
     * 
     * @param event - Event name
     * @param handler - Event handler to remove
     */
    off<K extends keyof FormEvents>(event: K, handler: FormEvents[K]): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.delete(handler as Function);
        }
    }

    // =========================================================================
    // Auto-save
    // =========================================================================

    /**
     * Schedule an auto-save operation
     */
    private scheduleAutoSave(): void {
        // Only schedule if document is actually dirty and auto-save is enabled
        if (!this.config?.auto_save) {
            return;
        }

        // Check if dirty after scheduling
        const isDirty = this.isDirty();
        if (!isDirty) {
            return;
        }

        this.cancelAutoSave();
        this.autoSaveRetries = 0;

        this.autoSaveTimeout = setTimeout(async () => {
            if (this.isDirty() && !this.getState().is_saving) {
                try {
                    const result = await this.save(true);
                    if (result.success) {
                        await this.triggerEvent('on_auto_save', this.getState(), result);
                        this.autoSaveRetries = 0;
                    } else {
                        await this.triggerEvent('on_auto_save_error',
                            new Error(result.message || 'Auto-save failed'),
                            this.getState(),
                            result);
                        
                        // Retry logic
                        const maxRetries = this.config?.auto_save_max_retries ?? 3;
                        if (this.autoSaveRetries < maxRetries) {
                            this.autoSaveRetries++;
                            const retryDelay = this.autoSaveInterval * Math.pow(2, this.autoSaveRetries - 1);
                            setTimeout(() => this.scheduleAutoSave(), retryDelay);
                        }
                    }
                } catch (error) {
                    await this.triggerEvent('on_auto_save_error', error as Error, this.getState());
                    
                    // Retry logic
                    const maxRetries = this.config?.auto_save_max_retries ?? 3;
                    if (this.autoSaveRetries < maxRetries) {
                        this.autoSaveRetries++;
                        const retryDelay = this.autoSaveInterval * Math.pow(2, this.autoSaveRetries - 1);
                        setTimeout(() => this.scheduleAutoSave(), retryDelay);
                    }
                }
            }
        }, this.autoSaveInterval);
    }

    /**
     * Cancel any pending auto-save
     */
    private cancelAutoSave(): void {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = undefined;
        }
    }

    /**
     * Cleanup method to destroy the controller and clear all resources
     */
    destroy(): void {
        this.cancelAutoSave();
        this.eventHandlers.clear();
    }

    // =========================================================================
    // Private Helpers
    // =========================================================================

    /**
     * Update the store with partial state
     */
    private updateState(partial: Partial<FormViewState>): void {
        this.store.update(state => ({ ...state, ...partial }));
    }

    /**
     * Build initial empty form state
     */
    private buildInitialState(): FormViewState {
        const defaultDocType: DocType = {
            name: this._doctype,
            module: 'Core',
            fields: [],
            permissions: []
        };

        return {
            doc: {},
            doctype: defaultDocType,
            is_new: true,
            is_dirty: false,
            is_loading: false,
            is_saving: false,
            is_submitting: false,
            errors: {},
            field_states: {},
            permissions: {
                can_save: true,
                can_submit: false,
                can_cancel: false,
                can_delete: false
            },
            ui_state: {
                collapsed_sections: [],
                hidden_fields: [],
                disabled_fields: [],
                edit_mode: true
            }
        };
    }

    /**
     * Create an empty document with default values
     */
    private createEmptyDoc(): Record<string, any> {
        const doc: Record<string, any> = {
            doctype: this._doctype
        };

        // Set default values from DocType fields
        if (this.doctypeInfo?.fields) {
            for (const field of this.doctypeInfo.fields) {
                if (field.default !== undefined) {
                    doc[field.fieldname] = field.default;
                }
            }
        }

        return doc;
    }

    /**
     * Build field states from document data
     */
    private buildFieldStates(doc: Record<string, any>): Record<string, FieldState> {
        const fieldStates: Record<string, FieldState> = {};

        if (this.doctypeInfo?.fields) {
            for (const field of this.doctypeInfo.fields) {
                fieldStates[field.fieldname] = {
                    value: doc[field.fieldname],
                    original_value: doc[field.fieldname],
                    touched: false,
                    disabled: field.read_only === true,
                    hidden: field.hidden === true,
                    is_dirty: false
                };
            }
        }

        return fieldStates;
    }

    /**
     * Mark the document as dirty (modified)
     */
    private markDirty(): void {
        const state = this.getState();

        // Check if actually dirty by comparing with original
        const isDirty = JSON.stringify(state.doc) !== JSON.stringify(state.original_doc);
        this.updateState({ is_dirty: isDirty });
    }

    /**
     * Validate a single field value
     */
    private validateSingleField(field: DocField, value: any): string | null {
        // Skip non-data fields
        const skipTypes = ['Section Break', 'Column Break', 'Tab Break', 'HTML', 'Button', 'Fold'];
        if (skipTypes.includes(field.fieldtype)) {
            return null;
        }

        // Check required
        if (field.required && (value === undefined || value === null || value === '')) {
            return `${field.label} is required`;
        }

        // Type-specific validation
        if (value !== undefined && value !== null && value !== '') {
            switch (field.fieldtype) {
                case 'Int':
                    if (!Number.isInteger(Number(value))) {
                        return `${field.label} must be an integer`;
                    }
                    break;
                case 'Float':
                case 'Currency':
                case 'Percent':
                    if (isNaN(Number(value))) {
                        return `${field.label} must be a number`;
                    }
                    break;
                case 'Date':
                    if (isNaN(Date.parse(value))) {
                        return `${field.label} must be a valid date`;
                    }
                    break;
            }
        }

        return null;
    }

    /**
     * Trigger an event and await all handlers
     */
    private async triggerEvent<K extends keyof FormEvents>(
        event: K,
        ...args: Parameters<NonNullable<FormEvents[K]>>
    ): Promise<void> {
        const handlers = this.eventHandlers.get(event);

        if (handlers) {
            for (const handler of handlers) {
                await (handler as Function)(...args);
            }
        }
    }

    /**
     * Trigger a before event that can cancel the operation
     */
    private async triggerBeforeEvent(
        event: 'on_before_save' | 'on_before_submit' | 'on_before_delete'
    ): Promise<boolean> {
        const handlers = this.eventHandlers.get(event);

        if (handlers) {
            for (const handler of handlers) {
                const result = await (handler as Function)(this.getState());
                if (result === false) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Normalize DocType name for URL
     */
    private normalizeForUrl(doctype: string): string {
        return doctype.toLowerCase().replace(/\s+/g, '_');
    }

    /**
     * Load DocType information from the API
     */
    private async loadDocTypeInfo(): Promise<void> {
        try {
            const response = await fetch(`/api/resource/DocType/${this.normalizeForUrl(this._doctype)}`);

            if (response.ok) {
                const result = await response.json();
                this.doctypeInfo = result.data;

                if (this.doctypeInfo) {
                    // Update store with doctype info
                    this.updateState({
                        doctype: this.doctypeInfo,
                        permissions: this.buildPermissions(this.doctypeInfo)
                    });
                }
            } else {
                // API returned error, use fallback
                this.doctypeInfo = {
                    name: this._doctype,
                    module: 'Core',
                    fields: [],
                    permissions: []
                };
            }
        } catch {
            // Fall back to minimal doctype info if API fails
            this.doctypeInfo = {
                name: this._doctype,
                module: 'Core',
                fields: [],
                permissions: []
            };
        }
    }


    /**
     * Build permissions from DocType definition
     */
    private buildPermissions(doctype: DocType): FormPermissions {
        // TODO: Implement proper permission checking based on user roles
        return {
            can_save: true,
            can_submit: doctype.is_submittable === true,
            can_cancel: doctype.is_submittable === true,
            can_delete: true,
            can_amend: doctype.is_submittable === true
        };
    }
}
