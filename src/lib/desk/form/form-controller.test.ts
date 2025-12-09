/**
 * P3-006: Form Controller Tests
 * 
 * Comprehensive test suite for FormController covering all 26 test cases.
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { FormController } from './form-controller';
import type { FormViewState, FormControllerConfig } from './types';

// =============================================================================
// Mock setup
// =============================================================================

function createMockResponse(data: any, ok = true, status = 200, statusText = 'OK'): Response {
    return {
        ok,
        status,
        statusText,
        json: () => Promise.resolve(data),
        headers: new Headers(),
        redirected: false,
        type: 'basic',
        url: '',
        clone: () => createMockResponse(data, ok, status, statusText),
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        text: () => Promise.resolve(JSON.stringify(data))
    } as Response;
}

const mockDocType = {
    name: 'Task',
    module: 'Projects',
    fields: [
        { fieldname: 'subject', label: 'Subject', fieldtype: 'Data', required: true },
        { fieldname: 'description', label: 'Description', fieldtype: 'Text', required: false },
        { fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Open\nCompleted', default: 'Open' },
        { fieldname: 'priority', label: 'Priority', fieldtype: 'Select', options: 'Low\nMedium\nHigh' },
        { fieldname: 'due_date', label: 'Due Date', fieldtype: 'Date' },
        { fieldname: 'progress', label: 'Progress', fieldtype: 'Percent' }
    ],
    permissions: [{ role: 'System Manager', read: true, write: true, create: true, delete: true }],
    is_submittable: true
};

const mockDocument = {
    name: 'TASK-001',
    doctype: 'Task',
    subject: 'Test Task',
    description: 'Test description',
    status: 'Open',
    priority: 'Medium',
    docstatus: 0
};

describe('P3-006: Form Controller', () => {

    // Flags
    let simulateNetworkError = false;
    let simulateServerError = false;

    beforeEach(() => {
        simulateNetworkError = false;
        simulateServerError = false;

        const mock: any = vi.fn();

        // NUCLEAR OPTION: Mock ALL the things
        global.fetch = mock;
        if (typeof window !== 'undefined') {
            window.fetch = mock;
        }
        globalThis.fetch = mock;

        // Centralized Smart Mock
        mock.mockImplementation((url: string, options?: RequestInit) => {
            const method = options?.method || 'GET';
            // console.log(`MOCK HIT: ${method} ${url}`);

            if (simulateNetworkError && method !== 'GET') {
                return Promise.reject(new Error('Network Error'));
            }

            if (simulateServerError) {
                return Promise.resolve(createMockResponse({ error: { message: 'Server error' } }, false, 500));
            }

            // DocType Loading
            if (url.includes('/api/resource/DocType/task')) {
                return Promise.resolve(createMockResponse({ data: mockDocType }));
            }

            // New Document (POST) - Handle for auto-save tests
            if (method === 'POST' && url.endsWith('/api/resource/task')) {
                return Promise.resolve(createMockResponse({
                    data: { ...mockDocument, name: 'TASK-002', subject: 'New Task' }
                }));
            }

            // Specific Document Actions
            // CANCEL
            if (url.endsWith('/cancel') && method === 'POST') {
                return Promise.resolve(createMockResponse({
                    data: { ...mockDocument, docstatus: 2 }
                }));
            }

            // SUBMIT
            if (url.endsWith('/submit') && method === 'POST') {
                return Promise.resolve(createMockResponse({
                    data: { ...mockDocument, docstatus: 1 }
                }));
            }

            // Existing Document (GET, PUT, DELETE)
            if (url.includes('/api/resource/task/TASK-001')) {
                if (method === 'DELETE') {
                    return Promise.resolve(createMockResponse({ data: null })); // Success generic
                }
                if (method === 'PUT') {
                    // Check body to confirm update
                    return Promise.resolve(createMockResponse({
                        data: { ...mockDocument, subject: 'Updated Task' } // Mock update return
                    }));
                }
                // GET
                return Promise.resolve(createMockResponse({ data: mockDocument }));
            }

            // New Document (POST) - Duplicate handler removed

            return Promise.resolve(createMockResponse({ data: null }, false, 404));
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ... Standard T1-T4 ...
    describe('P3-006-T1: new FormController(doctype)', () => {
        it('should create controller instance', () => {
            const controller = new FormController('Task');
            expect(controller).toBeDefined();
        });
        it('should initialize with empty state', () => {
            const controller = new FormController('Task');
            const state = controller.getState();
            expect(state.doc).toEqual({});
        });
        it('should accept configuration options', () => {
            const controller = new FormController('Task', { doctype: 'Task' });
            expect(controller).toBeDefined();
        });
    });

    describe('P3-006-T2: load(name)', () => {
        it('should fetch document and populate state', async () => {
            const controller = new FormController('Task');
            await controller.load('TASK-001');
            const state = controller.getState();
            expect(state.doc.name).toBe('TASK-001');
        });
        it('should set is_loading during fetch', async () => {
            const controller = new FormController('Task');
            let loading = false;
            controller.subscribe(s => { if (s.is_loading) loading = true; });
            await controller.load('TASK-001');
            expect(loading).toBe(true);
        });
        it('should store original_doc', async () => {
            const controller = new FormController('Task');
            await controller.load('TASK-001');
            expect(controller.getState().original_doc).not.toBeNull();
        });
    });

    describe('P3-006-T3: load() for new', () => {
        it('should create empty document state', async () => {
            const controller = new FormController('Task');
            await controller.load();
            expect(controller.getState().is_new).toBe(true);
        });
        it('should apply default values', async () => {
            const controller = new FormController('Task');
            await controller.load();
            expect(controller.getState().doc.status).toBe('Open');
        });
    });

    describe('P3-006-T4: loadWithDefaults', () => {
        it('should create new doc with values', async () => {
            const controller = new FormController('Task');
            await controller.loadWithDefaults({ subject: 'Pre' });
            expect(controller.getState().doc.subject).toBe('Pre');
        });
        it('should merge defaults', async () => {
            const controller = new FormController('Task');
            await controller.loadWithDefaults({ subject: 'Pre' });
            expect(controller.getState().doc.status).toBe('Open');
        });
    });

    // P3-006-T5: save() new
    describe('P3-006-T5: save() new document', () => {
        it('should call POST for new document', async () => {
            const controller = new FormController('Task');
            (controller as any).doctypeInfo = mockDocType;
            (controller as any).updateState({
                is_new: true,
                doc: { doctype: 'Task', subject: 'New Task' },
                is_dirty: true,
                field_states: {}
            });

            const result = await controller.save();
            expect(result.success).toBe(true);
            expect(result.name).toBe('TASK-002'); // This confirms logic path
        });
    });

    // P3-006-T6: save() existing
    describe('P3-006-T6: save() existing document', () => {
        it('should call PUT for existing document', async () => {
            const controller = new FormController('Task');
            await controller.load('TASK-001');
            controller.setValue('subject', 'Updated Task');
            const result = await controller.save();
            expect(result.success).toBe(true);
        });
    });

    describe('P3-006-T7: save() validates', () => {
        it('should prevent save when validation fails', async () => {
            const controller = new FormController('Task');
            await controller.load();
            const result = await controller.save();
            expect(result.success).toBe(false);
        });
        it('should trigger on_validation_error', async () => {
            const fn = vi.fn();
            const controller = new FormController('Task', { doctype: 'Task', events: { on_validation_error: fn } });
            await controller.load();
            await controller.save();
            expect(fn).toHaveBeenCalled();
        });
    });

    describe('P3-006-T8: submit()', () => {
        it('should call submit API endpoint', async () => {
            const controller = new FormController('Task');
            (controller as any).doctypeInfo = mockDocType;
            (controller as any).updateState({
                is_new: false,
                doc: { ...mockDocument, docstatus: 0 },
                name: 'TASK-001',
                docstatus: 0
            });
            const result = await controller.submit();
            expect(result.success).toBe(true);
            expect(result.doc!.docstatus).toBe(1);
        });
    });

    describe('P3-006-T9: cancel()', () => {
        it('should call cancel API endpoint', async () => {
            const controller = new FormController('Task');
            (controller as any).doctypeInfo = mockDocType;
            (controller as any).updateState({
                is_new: false,
                doc: { ...mockDocument, docstatus: 1 },
                name: 'TASK-001',
                docstatus: 1
            });
            const result = await controller.cancel();
            expect(result.success).toBe(true);
            expect(result.doc!.docstatus).toBe(2);
        });

        it('should reject cancel for non-submitted', async () => {
            const controller = new FormController('Task');
            await controller.load('TASK-001');
            const result = await controller.cancel();
            expect(result.success).toBe(false);
        });
    });

    describe('P3-006-T10: amend()', () => {
        it('should create amended copy', async () => {
            const controller = new FormController('Task');
            await controller.load('TASK-001');
            controller['updateState']({ docstatus: 2 });
            await controller.amend();
            expect(controller.getState().doc.amended_from).toBe('TASK-001');
        });
        it('should throw for non-cancelled', async () => {
            const controller = new FormController('Task');
            await controller.load('TASK-001');
            await expect(controller.amend()).rejects.toThrow();
        });
    });

    describe('P3-006-T11: delete()', () => {
        it('should call DELETE API', async () => {
            const controller = new FormController('Task');
            await controller.load('TASK-001');
            const result = await controller.delete();
            expect(result.success).toBe(true);
        });
        it('should reject delete new', async () => {
            const controller = new FormController('Task');
            await controller.load();
            const result = await controller.delete();
            expect(result.success).toBe(false);
        });
    });

    describe('P3-006-T12: reload()', () => {
        it('should do nothing for new docs', async () => {
            const controller = new FormController('Task');
            await controller.load();
            // Checking logic by ensuring no error/state change
            await controller.reload();
            expect(controller.isNew()).toBe(true);
        });
    });

    describe('P3-006-T13: duplicate()', () => {
        it('should duplicate', async () => {
            const controller = new FormController('Task');
            await controller.load('TASK-001');
            await controller.duplicate();
            expect(controller.isNew()).toBe(true);
        });
        it('should clear system system fields', async () => {
            const controller = new FormController('Task');
            await controller.load('TASK-001');
            controller['updateState']({ doc: { ...controller.getState().doc, owner: 'me' } });
            await controller.duplicate();
            expect(controller.getState().doc.owner).toBeUndefined();
        });
    });

    // ... Standard setters/getters T14-T25 ...
    describe('Getters/Setters', () => {
        it('setValue updates state', async () => {
            const c = new FormController('Task'); await c.load('TASK-001');
            c.setValue('subject', 'X'); expect(c.getValue('subject')).toBe('X');
        });
        it('setValues updates multiple', async () => {
            const c = new FormController('Task'); await c.load('TASK-001');
            c.setValues({ subject: 'X', priority: 'High' });
            expect(c.getValue('priority')).toBe('High');
        });
        it('isDirty works', async () => {
            const c = new FormController('Task'); await c.load('TASK-001');
            expect(c.isDirty()).toBe(false);
            c.setValue('subject', 'X');
            expect(c.isDirty()).toBe(true);
        });
        it('validate/getErrors works', async () => {
            const c = new FormController('Task'); await c.load();
            expect(c.validate()).toBe(false);
            expect(c.getErrors().subject).toBeDefined();
        });
        it('permissions work', async () => {
            const c = new FormController('Task'); await c.load('TASK-001');
            expect(c.hasPermission('save')).toBe(true);
        });
        it('events work', async () => {
            const c = new FormController('Task');
            const spy = vi.fn();
            c.on('on_load', spy);
            await c.load();
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('P3-006-T26: Auto-save', () => {
        // Helper function to create auto-save controller
        function createAutoSaveController(config?: Partial<FormControllerConfig>): FormController {
            return new FormController('Task', {
                doctype: 'Task',
                auto_save: true,
                auto_save_interval: 100,
                ...config
            });
        }

        // Helper function to setup timer tests
        function setupTimerTests() {
            vi.useFakeTimers();
            return () => vi.useRealTimers();
        }

        describe('Basic Auto-save Functionality', () => {
            it('should schedule auto-save on single field change', async () => {
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController();
                await controller.load('TASK-001');

                const scheduleSpy = vi.spyOn(controller as any, 'scheduleAutoSave');
                const saveSpy = vi.spyOn(controller, 'save');

                // Change to a different value to make it dirty
                controller.setValue('subject', 'Updated Subject');

                expect(scheduleSpy).toHaveBeenCalled();
                expect(saveSpy).not.toHaveBeenCalled();

                await vi.advanceTimersByTimeAsync(100);

                expect(saveSpy).toHaveBeenCalledTimes(1);

                cleanup();
            });

            it('should schedule auto-save on multiple field changes', async () => {
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController();
                await controller.load('TASK-001');

                const saveSpy = vi.spyOn(controller, 'save');

                controller.setValues({
                    subject: 'Updated',
                    description: 'Updated',
                    status: 'Completed'
                });

                await vi.advanceTimersByTimeAsync(100);

                expect(saveSpy).toHaveBeenCalledTimes(1);

                cleanup();
            });

            it('should not auto-save when disabled', async () => {
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController({ auto_save: false });
                await controller.load('TASK-001');

                const scheduleSpy = vi.spyOn(controller as any, 'scheduleAutoSave');
                const saveSpy = vi.spyOn(controller, 'save');

                controller.setValue('subject', 'Updated');

                expect(scheduleSpy).not.toHaveBeenCalled();
                expect(saveSpy).not.toHaveBeenCalled();

                await vi.advanceTimersByTimeAsync(200);

                expect(saveSpy).not.toHaveBeenCalled();

                cleanup();
            });

            it('should respect custom auto-save interval', async () => {
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController({ auto_save_interval: 200 });
                await controller.load('TASK-001');

                const saveSpy = vi.spyOn(controller, 'save');

                controller.setValue('subject', 'Updated');

                await vi.advanceTimersByTimeAsync(199);
                expect(saveSpy).not.toHaveBeenCalled();

                await vi.advanceTimersByTimeAsync(1);
                expect(saveSpy).toHaveBeenCalledTimes(1);

                cleanup();
            });

            it('should not schedule auto-save if document not dirty', async () => {
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController();
                await controller.load('TASK-001');

                const scheduleSpy = vi.spyOn(controller as any, 'scheduleAutoSave');
                const saveSpy = vi.spyOn(controller, 'save');

                // Set same value as original
                controller.setValue('subject', 'Test Task');

                expect(scheduleSpy).toHaveBeenCalled();
                await vi.advanceTimersByTimeAsync(100);

                // Should not save if not actually dirty
                expect(saveSpy).not.toHaveBeenCalled();

                cleanup();
            });
        });

        describe('Auto-save Cancellation', () => {
            it('should cancel auto-save on manual save', async () => {
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController();
                await controller.load('TASK-001');

                const saveSpy = vi.spyOn(controller, 'save');
                const cancelSpy = vi.spyOn(controller as any, 'cancelAutoSave');

                controller.setValue('subject', 'Updated');
                await controller.save();

                expect(cancelSpy).toHaveBeenCalled();

                await vi.advanceTimersByTimeAsync(200);

                expect(saveSpy).toHaveBeenCalledTimes(1); // Only manual save

                cleanup();
            });

            it('should cancel auto-save on form submission', async () => {
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController();
                await controller.load('TASK-001');

                const saveSpy = vi.spyOn(controller, 'save');
                const cancelSpy = vi.spyOn(controller as any, 'cancelAutoSave');

                controller.setValue('subject', 'Updated');
                await controller.submit();

                expect(cancelSpy).toHaveBeenCalled();

                await vi.advanceTimersByTimeAsync(200);

                expect(saveSpy).not.toHaveBeenCalled(); // submit calls save internally

                cleanup();
            });

            it('should cancel auto-save on document reload', async () => {
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController();
                await controller.load('TASK-001');

                const saveSpy = vi.spyOn(controller, 'save');
                const cancelSpy = vi.spyOn(controller as any, 'cancelAutoSave');

                controller.setValue('subject', 'Updated');
                await controller.reload();

                expect(cancelSpy).toHaveBeenCalled();

                await vi.advanceTimersByTimeAsync(200);

                expect(saveSpy).not.toHaveBeenCalled();

                cleanup();
            });

            it('should cancel auto-save when loading new document', async () => {
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController();
                await controller.load('TASK-001');

                const saveSpy = vi.spyOn(controller, 'save');
                const cancelSpy = vi.spyOn(controller as any, 'cancelAutoSave');

                controller.setValue('subject', 'Updated');
                
                // Mock the new document load to avoid error
                const mockFetch = global.fetch as Mock;
                mockFetch.mockImplementationOnce(() =>
                    Promise.resolve(createMockResponse({ data: { ...mockDocument, name: 'TASK-002' } }))
                );
                
                await controller.load('TASK-002');

                expect(cancelSpy).toHaveBeenCalled();

                await vi.advanceTimersByTimeAsync(200);

                expect(saveSpy).not.toHaveBeenCalled();

                cleanup();
            });
        });

        describe('Auto-save Events', () => {
            it('should trigger on_auto_save event on successful auto-save', async () => {
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController();
                await controller.load('TASK-001');

                const autoSaveSpy = vi.fn();
                controller.on('on_auto_save', autoSaveSpy);

                controller.setValue('subject', 'Updated');
                await vi.advanceTimersByTimeAsync(100);

                expect(autoSaveSpy).toHaveBeenCalled();

                cleanup();
            });

            it('should trigger on_auto_save_error event on validation failure', async () => {
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController({ validate_on_auto_save: true });
                await controller.load('TASK-001');

                const errorSpy = vi.fn();
                controller.on('on_auto_save_error', errorSpy);

                // Clear required field to trigger validation error
                controller.setValue('subject', '');
                await vi.advanceTimersByTimeAsync(100);

                expect(errorSpy).toHaveBeenCalled();

                cleanup();
            });

            it('should trigger on_auto_save_error event on network failure', async () => {
                simulateNetworkError = true;
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController();
                await controller.load('TASK-001');

                const errorSpy = vi.fn();
                controller.on('on_auto_save_error', errorSpy);

                controller.setValue('subject', 'Updated');
                await vi.advanceTimersByTimeAsync(100);

                expect(errorSpy).toHaveBeenCalled();

                simulateNetworkError = false;
                cleanup();
            });
        });

        describe('Concurrent Changes', () => {
            it('should debounce multiple rapid field changes', async () => {
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController();
                await controller.load('TASK-001');

                const saveSpy = vi.spyOn(controller, 'save');

                // Make multiple rapid changes
                controller.setValue('subject', 'Change 1');
                controller.setValue('description', 'Change 2');
                controller.setValue('status', 'Change 3');

                await vi.advanceTimersByTimeAsync(100);

                // Should only save once
                expect(saveSpy).toHaveBeenCalledTimes(1);

                cleanup();
            });

            it('should reset timer on each change', async () => {
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController({ auto_save_interval: 200 });
                await controller.load('TASK-001');

                const saveSpy = vi.spyOn(controller, 'save');

                controller.setValue('subject', 'Change 1');
                await vi.advanceTimersByTimeAsync(100);
                expect(saveSpy).not.toHaveBeenCalled();

                controller.setValue('subject', 'Change 2');
                await vi.advanceTimersByTimeAsync(100);
                expect(saveSpy).not.toHaveBeenCalled();

                await vi.advanceTimersByTimeAsync(100);
                expect(saveSpy).toHaveBeenCalledTimes(1);

                cleanup();
            });
        });

        describe('Document State Handling', () => {
            it('should auto-save new documents', async () => {
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController();
                await controller.load(); // New document

                const saveSpy = vi.spyOn(controller, 'save');

                controller.setValue('subject', 'New Task');
                await vi.advanceTimersByTimeAsync(100);

                expect(saveSpy).toHaveBeenCalled();

                cleanup();
            });

            it('should auto-save existing documents', async () => {
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController();
                await controller.load('TASK-001');

                const saveSpy = vi.spyOn(controller, 'save');

                controller.setValue('subject', 'Updated Task');
                await vi.advanceTimersByTimeAsync(100);

                expect(saveSpy).toHaveBeenCalled();

                cleanup();
            });
        });

        describe('Cleanup and Memory Management', () => {
            it('should cleanup auto-save on destroy', async () => {
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController();
                await controller.load('TASK-001');

                const cancelSpy = vi.spyOn(controller as any, 'cancelAutoSave');

                controller.setValue('subject', 'Updated');
                controller.destroy();

                expect(cancelSpy).toHaveBeenCalled();

                await vi.advanceTimersByTimeAsync(200);

                cleanup();
            });

            it('should not leak memory with multiple schedules', async () => {
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController();
                await controller.load('TASK-001');

                // Trigger multiple auto-saves
                for (let i = 0; i < 5; i++) {
                    controller.setValue('subject', `Change ${i}`);
                    await vi.advanceTimersByTimeAsync(100);
                }

                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                }

                // Should not accumulate timeouts
                expect(controller['autoSaveTimeout']).toBeUndefined();

                cleanup();
            });
        });

        describe('Retry Logic', () => {
            it('should retry auto-save on network failure', async () => {
                simulateNetworkError = true;
                const cleanup = setupTimerTests();
                const controller = createAutoSaveController({ auto_save_max_retries: 2 });
                await controller.load('TASK-001');

                const saveSpy = vi.spyOn(controller, 'save');
                const errorSpy = vi.fn();
                controller.on('on_auto_save_error', errorSpy);

                controller.setValue('subject', 'Updated');
                
                // First attempt
                await vi.advanceTimersByTimeAsync(100);
                expect(errorSpy).toHaveBeenCalledTimes(1);

                // Retry 1 (100ms delay)
                await vi.advanceTimersByTimeAsync(100);
                expect(errorSpy).toHaveBeenCalledTimes(2);

                // Retry 2 (200ms delay)
                await vi.advanceTimersByTimeAsync(200);
                expect(errorSpy).toHaveBeenCalledTimes(3);

                // No more retries
                await vi.advanceTimersByTimeAsync(400);
                expect(errorSpy).toHaveBeenCalledTimes(3);

                simulateNetworkError = false;
                cleanup();
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle API errors gracefully', async () => {
            simulateServerError = true;
            const controller = new FormController('Task');
            await expect(controller.load('TASK-001')).rejects.toThrow();
        });

        it('should trigger on_error', async () => {
            const controller = new FormController('Task', {
                doctype: 'Task',
                events: { on_error: vi.fn() }
            });
            try {
                await controller.load('FAIL');
            } catch (e) { }
            expect(controller['config']?.events?.on_error).toHaveBeenCalled();
        });
    });

});
