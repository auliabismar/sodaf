/**
 * P3-008: FormColumn Component Tests
 * - P3-008-T2: Columns layout correct
 */

import { render } from 'vitest-browser-svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FormColumn from '../FormColumn.svelte';
import type { DocField } from '../../../meta/doctype/types';
import type { FormViewState } from '../types';
import { writable, get } from 'svelte/store';

describe('P3-008: FormColumn Component', () => {
    let mockController: any;

    const createFields = (count: number): DocField[] => {
        return Array.from({ length: count }, (_, i) => ({
            fieldname: `field_${i}`,
            fieldtype: 'Data' as const,
            label: `Field ${i}`
        } as DocField));
    };

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

    describe('P3-008-T2: Columns layout', () => {
        it('renders column container', async () => {
            const fields = createFields(2);
            const { container } = render(FormColumn, { fields, controller: mockController });
            expect(container.querySelector('.form-column')).toBeTruthy();
        });

        it('renders field wrappers for each field', async () => {
            const fields = createFields(3);
            const { container } = render(FormColumn, { fields, controller: mockController });
            const wrappers = container.querySelectorAll('.field-wrapper');
            expect(wrappers.length).toBe(3);
        });

        it('adds data-fieldname attribute to field wrappers', async () => {
            const fields = createFields(2);
            const { container } = render(FormColumn, { fields, controller: mockController });
            expect(container.querySelector('[data-fieldname="field_0"]')).toBeTruthy();
            expect(container.querySelector('[data-fieldname="field_1"]')).toBeTruthy();
        });

        it('renders empty column without errors', async () => {
            const { container } = render(FormColumn, { fields: [], controller: mockController });
            expect(container.querySelector('.form-column')).toBeTruthy();
        });
    });
});
