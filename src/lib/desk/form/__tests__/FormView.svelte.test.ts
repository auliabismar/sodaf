/**
 * P3-008: FormView Component Tests
 *
 * Tests for the main FormView.svelte component including:
 * - P3-008-T1: Form renders sections
 * - P3-008-T3 & T4: Tabs render and switching
 * - P3-008-T16: Loading state
 * - P3-008-T18: Dirty indicator
 * - P3-008-T20: Status indicator (Draft, Submitted, Cancelled)
 * - P3-008-T21: Title display
 * - P3-008-T10 & T11: Sidebar
 */

import { render } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FormView from '../FormView.svelte';
import { FormController } from '../form-controller';
import { writable, get } from 'svelte/store';
import type { FormViewState } from '../types';
import type { DocType, DocField } from '../../../meta/doctype/types';

// Mock FormController
vi.mock('../form-controller', () => {
    return {
        FormController: vi.fn()
    };
});

describe('P3-008: FormView Component', () => {
    let mockStore: ReturnType<typeof writable<FormViewState>>;
    let mockController: any;

    const createMockDocType = (fields: Partial<DocField>[] = []): DocType => ({
        name: 'Test DocType',
        module: 'Test Module',
        fields: fields.map((f, i) => ({
            fieldname: f.fieldname || `field_${i}`,
            fieldtype: f.fieldtype || 'Data',
            label: f.label || `Field ${i}`,
            hidden: f.hidden,
            depends_on: f.depends_on,
            ...f
        })) as DocField[],
        permissions: []
    });

    const defaultDocType = createMockDocType([
        { fieldname: 'sb1', fieldtype: 'Section Break', label: 'Section 1' },
        { fieldname: 'title', fieldtype: 'Data', label: 'Title' },
        { fieldname: 'cb1', fieldtype: 'Column Break', label: '' },
        { fieldname: 'status', fieldtype: 'Select', label: 'Status' },
        { fieldname: 'tb1', fieldtype: 'Tab Break', label: 'More Info' },
        { fieldname: 'description', fieldtype: 'Text Editor', label: 'Description' }
    ]);

    const createInitialState = (overrides: Partial<FormViewState> = {}): FormViewState => ({
        doc: { name: 'DOC-001', title: 'Test', status: 'Draft' },
        doctype: defaultDocType,
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
        ui_state: {
            collapsed_sections: [],
            hidden_fields: [],
            disabled_fields: [],
            edit_mode: true
        },
        ...overrides
    });

    beforeEach(() => {
        vi.clearAllMocks();

        const initialState = createInitialState();
        mockStore = writable(initialState);

        mockController = {
            getState: vi.fn(() => get(mockStore)),
            subscribe: mockStore.subscribe,
            load: vi.fn().mockResolvedValue(undefined),
            save: vi.fn().mockResolvedValue({ success: true }),
            submit: vi.fn().mockResolvedValue({ success: true }),
            cancel: vi.fn().mockResolvedValue({ success: true }),
            delete: vi.fn().mockResolvedValue({ success: true }),
            amend: vi.fn().mockResolvedValue({ success: true }),
            reload: vi.fn().mockResolvedValue(undefined),
            setValue: vi.fn(),
            doctype: 'Test DocType'
        };

        (FormController as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockController);
    });

    describe('P3-008-T1: Form renders sections', () => {
        it('renders sections from FormSchema', async () => {
            render(FormView, { doctype: 'Test DocType', name: 'DOC-001' });
            await expect.element(page.getByText('Section 1')).toBeVisible();
        });

        it('renders multiple sections correctly', async () => {
            const multiSectionDocType = createMockDocType([
                { fieldname: 'sb1', fieldtype: 'Section Break', label: 'Basic Info' },
                { fieldname: 'name_field', fieldtype: 'Data', label: 'Name' },
                { fieldname: 'sb2', fieldtype: 'Section Break', label: 'Advanced Settings' },
                { fieldname: 'setting', fieldtype: 'Check', label: 'Enable Feature' }
            ]);
            mockStore.set(createInitialState({ doctype: multiSectionDocType }));

            render(FormView, { doctype: 'Test DocType', name: 'DOC-001' });

            await expect.element(page.getByText('Basic Info')).toBeVisible();
            await expect.element(page.getByText('Advanced Settings')).toBeVisible();
        });
    });

    describe('P3-008-T3 & T4: Tabs render and switching', () => {
        it('renders tab navigation', async () => {
            render(FormView, { doctype: 'Test DocType', name: 'DOC-001' });

            await expect.element(page.getByRole('tab', { name: 'Details' })).toBeVisible();
            await expect.element(page.getByRole('tab', { name: 'More Info' })).toBeVisible();
        });

        it('switches tab content on click', async () => {
            render(FormView, { doctype: 'Test DocType', name: 'DOC-001' });

            const moreInfoTab = page.getByRole('tab', { name: 'More Info' });
            await moreInfoTab.click();

            await expect.element(moreInfoTab).toHaveAttribute('aria-selected', 'true');
        });
    });

    describe('P3-008-T7 & T8: Toolbar shows actions', () => {
        it('renders toolbar with Save and Submit buttons', async () => {
            render(FormView, { doctype: 'Test DocType', name: 'DOC-001' });
            await expect.element(page.getByText('Save')).toBeVisible();
        });

        it('disables Save button when saving', async () => {
            mockStore.set(createInitialState({ is_saving: true }));
            render(FormView, { doctype: 'Test DocType', name: 'DOC-001' });
            const saveButton = page.getByText('Saving...');
            await expect.element(saveButton).toBeDisabled();
        });
    });

    describe('P3-008-T16: Loading state', () => {
        it('shows loading overlay when is_loading is true', async () => {
            mockStore.set(createInitialState({
                is_loading: true,
                doctype: undefined as unknown as DocType
            }));

            render(FormView, { doctype: 'Test DocType', name: 'DOC-001' });

            await expect.element(page.getByText('Loading...')).toBeVisible();
        });

        it('hides loading overlay when loaded', async () => {
            const { container } = render(FormView, { doctype: 'Test DocType', name: 'DOC-001' });
            expect(container.querySelector('.loading-overlay')).toBeNull();
        });
    });

    describe('P3-008-T18: Dirty indicator', () => {
        it('shows "Not Saved" badge when form is dirty', async () => {
            mockStore.set(createInitialState({ is_dirty: true }));
            render(FormView, { doctype: 'Test DocType', name: 'DOC-001' });
            await expect.element(page.getByText('Not Saved')).toBeVisible();
        });

        it('hides dirty indicator when form is clean', async () => {
            mockStore.set(createInitialState({ is_dirty: false }));
            const { container } = render(FormView, { doctype: 'Test DocType', name: 'DOC-001' });
            expect(container.querySelector('.status-badge.dirty')).toBeNull();
        });
    });

    describe('P3-008-T20: Status indicator', () => {
        it('shows "New" badge for new documents', async () => {
            mockStore.set(createInitialState({ is_new: true, is_dirty: false, name: undefined }));
            render(FormView, { doctype: 'Test DocType' });
            await expect.element(page.getByText('New')).toBeVisible();
        });

        it('shows "Submitted" badge for docstatus=1', async () => {
            mockStore.set(createInitialState({ docstatus: 1, is_dirty: false }));
            render(FormView, { doctype: 'Test DocType', name: 'DOC-001' });
            await expect.element(page.getByText('Submitted')).toBeVisible();
        });

        it('shows "Cancelled" badge for docstatus=2', async () => {
            mockStore.set(createInitialState({ docstatus: 2, is_dirty: false }));
            render(FormView, { doctype: 'Test DocType', name: 'DOC-001' });
            await expect.element(page.getByText('Cancelled')).toBeVisible();
        });
    });

    describe('P3-008-T21: Title display', () => {
        it('displays document name in header', async () => {
            render(FormView, { doctype: 'Test DocType', name: 'DOC-001' });
            await expect.element(page.getByText('DOC-001')).toBeVisible();
        });

        it('displays "New DocType" for new documents', async () => {
            mockStore.set(createInitialState({ is_new: true, name: undefined, doc: {} }));
            render(FormView, { doctype: 'Test DocType' });
            await expect.element(page.getByText('New Test DocType')).toBeVisible();
        });
    });

    describe('P3-008-T10 & T11: Sidebar', () => {
        it('displays sidebar with Assigned To section', async () => {
            render(FormView, { doctype: 'Test DocType', name: 'DOC-001' });
            await expect.element(page.getByText('Assigned To')).toBeVisible();
        });

        it('displays sidebar with Shared With section', async () => {
            render(FormView, { doctype: 'Test DocType', name: 'DOC-001' });
            await expect.element(page.getByText('Shared With')).toBeVisible();
        });

        it('displays sidebar with Tags section', async () => {
            render(FormView, { doctype: 'Test DocType', name: 'DOC-001' });
            await expect.element(page.getByText('Tags')).toBeVisible();
        });
    });

    describe('Controller Integration', () => {
        it('calls controller.load on mount with document name', async () => {
            render(FormView, { doctype: 'Test DocType', name: 'DOC-001' });
            expect(mockController.load).toHaveBeenCalledWith('DOC-001');
        });

        it('calls controller.load without name for new documents', async () => {
            render(FormView, { doctype: 'Test DocType' });
            expect(mockController.load).toHaveBeenCalledWith(undefined);
        });
    });
});
