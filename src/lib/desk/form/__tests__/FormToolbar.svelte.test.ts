/**
 * P3-008: FormToolbar Component Tests
 * - P3-008-T7: Toolbar shows actions
 * - P3-008-T8: Toolbar disabled states
 * - P3-008-T18: Dirty indicator
 * - P3-008-T20: Status indicator
 * - P3-008-T21: Title display
 */

import { render } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FormToolbar from '../FormToolbar.svelte';
import type { FormViewState } from '../types';
import type { DocType } from '../../../meta/doctype/types';
import { writable, get } from 'svelte/store';

describe('P3-008: FormToolbar Component', () => {
    let mockStore: ReturnType<typeof writable<FormViewState>>;
    let mockController: any;

    const mockDocType: DocType = {
        name: 'Test DocType',
        module: 'Test',
        fields: [],
        permissions: []
    };

    const createState = (overrides: Partial<FormViewState> = {}): FormViewState => ({
        doc: { name: 'DOC-001', title: 'Test Document' },
        doctype: mockDocType,
        is_new: false,
        is_dirty: false,
        is_loading: false,
        is_saving: false,
        is_submitting: false,
        name: 'DOC-001',
        docstatus: 0,
        errors: {},
        field_states: {},
        permissions: { can_save: true, can_submit: true, can_cancel: true, can_delete: true },
        ui_state: { collapsed_sections: [], hidden_fields: [], disabled_fields: [], edit_mode: true },
        ...overrides
    });

    beforeEach(() => {
        vi.clearAllMocks();
        const initialState = createState();
        mockStore = writable(initialState);

        mockController = {
            getState: vi.fn(() => get(mockStore)),
            subscribe: mockStore.subscribe,
            save: vi.fn().mockResolvedValue({ success: true }),
            submit: vi.fn().mockResolvedValue({ success: true }),
            cancel: vi.fn().mockResolvedValue({ success: true }),
            delete: vi.fn().mockResolvedValue({ success: true }),
            amend: vi.fn().mockResolvedValue({ success: true }),
            reload: vi.fn().mockResolvedValue(undefined),
            doctype: 'Test DocType'
        };
    });

    describe('P3-008-T7: Toolbar shows actions', () => {
        it('shows Save button for draft documents', async () => {
            render(FormToolbar, { controller: mockController });
            await expect.element(page.getByText('Save')).toBeVisible();
        });

        it('shows Submit button for saved draft documents', async () => {
            mockStore.set(createState({ is_new: false, is_dirty: false }));
            render(FormToolbar, { controller: mockController });
            await expect.element(page.getByText('Submit')).toBeVisible();
        });

        it('shows Cancel button for submitted documents', async () => {
            mockStore.set(createState({ docstatus: 1 }));
            render(FormToolbar, { controller: mockController });
            await expect.element(page.getByText('Cancel')).toBeVisible();
        });

        it('shows Amend button for cancelled documents', async () => {
            mockStore.set(createState({ docstatus: 2 }));
            render(FormToolbar, { controller: mockController });
            await expect.element(page.getByText('Amend')).toBeVisible();
        });

        it('shows Delete button for non-submitted documents', async () => {
            mockStore.set(createState({ is_new: false, docstatus: 0 }));
            render(FormToolbar, { controller: mockController });
            await expect.element(page.getByText('Delete')).toBeVisible();
        });

        it('shows Discard button when dirty and not new', async () => {
            mockStore.set(createState({ is_dirty: true, is_new: false }));
            render(FormToolbar, { controller: mockController });
            await expect.element(page.getByText('Discard')).toBeVisible();
        });
    });

    describe('P3-008-T8: Toolbar disabled states', () => {
        it('disables Save button while saving', async () => {
            mockStore.set(createState({ is_saving: true }));
            render(FormToolbar, { controller: mockController });
            const saveBtn = page.getByText('Saving...');
            await expect.element(saveBtn).toBeDisabled();
        });

        it('disables Submit button while saving', async () => {
            mockStore.set(createState({ is_saving: true, is_dirty: false, is_new: false }));
            render(FormToolbar, { controller: mockController });
            const submitBtn = page.getByText('Submit');
            await expect.element(submitBtn).toBeDisabled();
        });
    });

    describe('P3-008-T18: Dirty indicator', () => {
        it('shows "Not Saved" badge when dirty', async () => {
            mockStore.set(createState({ is_dirty: true }));
            render(FormToolbar, { controller: mockController });
            await expect.element(page.getByText('Not Saved')).toBeVisible();
        });
    });

    describe('P3-008-T20: Status indicator', () => {
        it('shows "New" badge for new documents', async () => {
            mockStore.set(createState({ is_new: true, is_dirty: false }));
            render(FormToolbar, { controller: mockController });
            await expect.element(page.getByText('New')).toBeVisible();
        });

        it('shows "Submitted" badge for docstatus=1', async () => {
            mockStore.set(createState({ docstatus: 1, is_dirty: false }));
            render(FormToolbar, { controller: mockController });
            await expect.element(page.getByText('Submitted')).toBeVisible();
        });

        it('shows "Cancelled" badge for docstatus=2', async () => {
            mockStore.set(createState({ docstatus: 2, is_dirty: false }));
            render(FormToolbar, { controller: mockController });
            await expect.element(page.getByText('Cancelled')).toBeVisible();
        });
    });

    describe('P3-008-T21: Title display', () => {
        it('displays document name in toolbar', async () => {
            render(FormToolbar, { controller: mockController });
            await expect.element(page.getByText('DOC-001')).toBeVisible();
        });

        it('displays custom title when provided', async () => {
            render(FormToolbar, { controller: mockController, title: 'Custom Title' });
            await expect.element(page.getByText('Custom Title')).toBeVisible();
        });

        it('displays "New DocType" for new documents without name', async () => {
            mockStore.set(createState({ is_new: true, name: undefined, doc: {} }));
            render(FormToolbar, { controller: mockController });
            await expect.element(page.getByText('New Test DocType')).toBeVisible();
        });
    });

    describe('Action handlers', () => {
        it('calls controller.save when Save button clicked', async () => {
            render(FormToolbar, { controller: mockController });
            const saveBtn = page.getByText('Save');
            await saveBtn.click();
            expect(mockController.save).toHaveBeenCalled();
        });

        it('calls controller.submit when Submit button clicked', async () => {
            mockStore.set(createState({ is_dirty: false, is_new: false }));
            render(FormToolbar, { controller: mockController });
            const submitBtn = page.getByText('Submit');
            await submitBtn.click();
            expect(mockController.submit).toHaveBeenCalled();
        });

        it('calls controller.cancel when Cancel button clicked', async () => {
            mockStore.set(createState({ docstatus: 1 }));
            render(FormToolbar, { controller: mockController });
            const cancelBtn = page.getByText('Cancel');
            await cancelBtn.click();
            expect(mockController.cancel).toHaveBeenCalled();
        });

        it('calls controller.reload when Discard button clicked', async () => {
            mockStore.set(createState({ is_dirty: true, is_new: false }));
            render(FormToolbar, { controller: mockController });
            const discardBtn = page.getByText('Discard');
            await discardBtn.click();
            expect(mockController.reload).toHaveBeenCalled();
        });
    });
});
