/**
 * P3-008: FormSidebar Component Tests
 * - P3-008-T10: Sidebar shows links
 * - P3-008-T11: Sidebar shows attachments
 */

import { render } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import FormSidebar from '../FormSidebar.svelte';
import type { FormViewState } from '../types';

describe('P3-008: FormSidebar Component', () => {
    const createState = (overrides: Partial<FormViewState> = {}): FormViewState => ({
        doc: {
            name: 'DOC-001',
            owner: 'admin@example.com',
            creation: '2024-01-15T10:30:00',
            modified: '2024-01-16T14:45:00',
            modified_by: 'user@example.com'
        },
        doctype: { name: 'Test', module: 'Test', fields: [], permissions: [] },
        is_new: false,
        is_dirty: false,
        is_loading: false,
        is_saving: false,
        is_submitting: false,
        errors: {},
        field_states: {},
        permissions: { can_save: true, can_submit: true, can_cancel: true, can_delete: true },
        ui_state: { collapsed_sections: [], hidden_fields: [], disabled_fields: [], edit_mode: true },
        ...overrides
    });

    beforeEach(() => { vi.clearAllMocks(); });

    describe('P3-008-T10: Sidebar shows links', () => {
        it('displays Assigned To section', async () => {
            render(FormSidebar, { state: createState() });
            await expect.element(page.getByText('Assigned To')).toBeVisible();
        });

        it('displays Shared With section', async () => {
            render(FormSidebar, { state: createState() });
            await expect.element(page.getByText('Shared With')).toBeVisible();
        });

        it('displays Add buttons', async () => {
            render(FormSidebar, { state: createState() });
            const addButtons = page.getByText('+ Add');
            await expect.element(addButtons.first()).toBeVisible();
        });
    });

    describe('Tags section', () => {
        it('displays Tags section', async () => {
            render(FormSidebar, { state: createState() });
            await expect.element(page.getByText('Tags')).toBeVisible();
        });

        it('displays tag input field', async () => {
            render(FormSidebar, { state: createState() });
            await expect.element(page.getByPlaceholder('Add a tag...')).toBeVisible();
        });
    });

    describe('Metadata display', () => {
        it('displays Created and Modified labels', async () => {
            render(FormSidebar, { state: createState() });
            await expect.element(page.getByText('Created')).toBeVisible();
            await expect.element(page.getByText('Modified')).toBeVisible();
        });

        it('displays owner information', async () => {
            render(FormSidebar, { state: createState() });
            await expect.element(page.getByText('admin@example.com')).toBeVisible();
        });

        it('displays modified_by information', async () => {
            render(FormSidebar, { state: createState() });
            await expect.element(page.getByText('user@example.com')).toBeVisible();
        });
    });

    describe('Sidebar structure', () => {
        it('renders correctly with empty doc', async () => {
            render(FormSidebar, { state: createState({ doc: {} }) });
            // Should still render sidebar sections
            await expect.element(page.getByText('Assigned To')).toBeVisible();
        });
    });
});
