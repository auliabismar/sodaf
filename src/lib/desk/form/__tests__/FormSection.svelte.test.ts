/**
 * P3-008: FormSection Component Tests
 * - P3-008-T5: Collapsible sections
 * - Grid layout with columns
 */

import { render } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FormSection from '../FormSection.svelte';
import type { DocField } from '../../../meta/doctype/types';
import type { FormViewState } from '../types';
import { writable, get } from 'svelte/store';

describe('P3-008: FormSection Component', () => {
    let mockController: any;

    const createSectionField = (overrides: Partial<DocField> = {}): DocField => ({
        fieldname: 'test_section',
        fieldtype: 'Section Break',
        label: 'Test Section',
        ...overrides
    } as DocField);

    const createFieldColumn = (fields: Partial<DocField>[] = []): DocField[][] => [
        fields.map((f, i) => ({
            fieldname: f.fieldname || `field_${i}`,
            fieldtype: f.fieldtype || 'Data',
            label: f.label || `Field ${i}`,
            ...f
        } as DocField))
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        const mockStore = writable<FormViewState>({
            doc: {},
            doctype: { name: 'Test', module: 'Test', fields: [], permissions: [] },
            is_new: false,
            is_dirty: false,
            is_loading: false,
            is_saving: false,
            is_submitting: false,
            errors: {},
            field_states: {},
            permissions: { can_save: true, can_submit: true, can_cancel: true, can_delete: true },
            ui_state: { collapsed_sections: [], hidden_fields: [], disabled_fields: [], edit_mode: true }
        });

        mockController = {
            getState: vi.fn(() => get(mockStore)),
            subscribe: mockStore.subscribe,
            setValue: vi.fn(),
            doctype: 'Test'
        };
    });

    describe('P3-008-T5: Collapsible sections', () => {
        it('renders section with label', async () => {
            const section = createSectionField({ label: 'Collapsible Section' });
            const columns = createFieldColumn([{ fieldname: 'field1', label: 'Field 1' }]);

            render(FormSection, { section, columns, controller: mockController });

            await expect.element(page.getByText('Collapsible Section')).toBeVisible();
        });

        it('shows content when not collapsed', async () => {
            const section = createSectionField({ label: 'Test Section' });
            const columns = createFieldColumn([{ fieldname: 'field1', label: 'Field 1' }]);

            const { container } = render(FormSection, {
                section, columns, controller: mockController, isCollapsed: false
            });

            // Section body should be visible
            expect(container.querySelector('.section-body')).toBeTruthy();
        });

        it('hides content when collapsed', async () => {
            const section = createSectionField({ label: 'Test Section' });
            const columns = createFieldColumn([{ fieldname: 'field1', label: 'Field 1' }]);

            const { container } = render(FormSection, {
                section, columns, controller: mockController, isCollapsed: true
            });

            // Section body should not be rendered
            expect(container.querySelector('.section-body')).toBeNull();
        });

        it('toggles collapse state on click', async () => {
            const section = createSectionField({ label: 'Toggle Section' });
            const columns = createFieldColumn([{ fieldname: 'field1', label: 'Field 1' }]);

            const { container } = render(FormSection, {
                section, columns, controller: mockController, isCollapsed: false
            });

            // Initially expanded
            expect(container.querySelector('.section-body')).toBeTruthy();

            // Click to collapse
            const toggleBtn = page.getByText('Toggle Section');
            await toggleBtn.click();

            // Should now be collapsed
            expect(container.querySelector('.section-body')).toBeNull();

            // Click to expand again
            await toggleBtn.click();

            // Should be expanded again
            expect(container.querySelector('.section-body')).toBeTruthy();
        });

        it('shows expand icon (▶) when collapsed', async () => {
            const section = createSectionField({ label: 'Test Section' });
            const columns = createFieldColumn([]);

            render(FormSection, {
                section, columns, controller: mockController, isCollapsed: true
            });

            await expect.element(page.getByText('▶')).toBeVisible();
        });

        it('shows collapse icon (▼) when expanded', async () => {
            const section = createSectionField({ label: 'Test Section' });
            const columns = createFieldColumn([]);

            render(FormSection, {
                section, columns, controller: mockController, isCollapsed: false
            });

            await expect.element(page.getByText('▼')).toBeVisible();
        });
    });

    describe('Section without label', () => {
        it('does not render header for sections without label', async () => {
            const section = createSectionField({ label: '' });
            const columns = createFieldColumn([{ fieldname: 'field1', label: 'Field 1' }]);

            const { container } = render(FormSection, {
                section, columns, controller: mockController
            });

            expect(container.querySelector('.section-header')).toBeNull();
        });
    });

    describe('Grid layout with columns', () => {
        it('renders multi-column layout', async () => {
            const section = createSectionField({ label: 'Two Columns' });
            const columns: DocField[][] = [
                [{ fieldname: 'field1', fieldtype: 'Data', label: 'Field 1' } as DocField],
                [{ fieldname: 'field2', fieldtype: 'Data', label: 'Field 2' } as DocField]
            ];

            const { container } = render(FormSection, {
                section, columns, controller: mockController
            });

            const sectionBody = container.querySelector('.section-body');
            expect(sectionBody).toBeTruthy();
            expect(sectionBody?.getAttribute('style')).toContain('repeat(2, 1fr)');
        });
    });
});
