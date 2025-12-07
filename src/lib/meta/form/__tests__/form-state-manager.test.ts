/**
 * FormStateManager Tests
 * 
 * This file contains tests for the FormStateManager class which manages form state.
 */

import { describe, it, expect } from 'vitest';
import { FormStateManager } from '../helpers';
import type { FormSchema, FormState, FormConfig } from '../types';

describe('FormStateManager', () => {
	/**
	 * Test form state initialization
	 */
	it('should initialize form state with default values', () => {
		const formSchema: FormSchema = {
			doctype: 'TestDocType',
			sections: [
				{
					fieldname: 'section_1',
					label: 'Section 1',
					fields: [
						{
							fieldname: 'field1',
							fieldtype: 'Data',
							label: 'Field 1',
							default: 'default_value1'
						},
						{
							fieldname: 'field2',
							fieldtype: 'Data',
							label: 'Field 2'
						}
					]
				}
			],
			layout: {}
		};

		const formState = FormStateManager.initializeState(formSchema);

		expect(formState.data.field1).toBe('default_value1');
		expect(formState.data.field2).toBeUndefined();
		expect(formState.original_data.field1).toBe('default_value1');
		expect(formState.original_data.field2).toBeUndefined();
		expect(formState.errors).toEqual({});
		expect(formState.dirty).toBe(false);
		expect(formState.valid).toBe(true);
		expect(formState.loading).toBe(false);
		expect(formState.submitting).toBe(false);
		expect(formState.active_tab).toBeUndefined();
		expect(formState.collapsed_sections).toEqual([]);
		expect(formState.hidden_fields).toEqual([]);
		expect(formState.disabled_fields).toEqual([]);
	});

	/**
	 * Test form state initialization with provided data
	 */
	it('should initialize form state with provided data', () => {
		const formSchema: FormSchema = {
			doctype: 'TestDocType',
			sections: [
				{
					fieldname: 'section_1',
					label: 'Section 1',
					fields: [
						{
							fieldname: 'field1',
							fieldtype: 'Data',
							label: 'Field 1',
							default: 'default_value1'
						}
					]
				}
			],
			layout: {}
		};

		const initialData = {
			field1: 'provided_value1',
			field2: 'provided_value2'
		};

		const formState = FormStateManager.initializeState(formSchema, initialData);

		expect(formState.data.field1).toBe('provided_value1');
		expect(formState.data.field2).toBe('provided_value2');
		expect(formState.original_data.field1).toBe('provided_value1');
		expect(formState.original_data.field2).toBe('provided_value2');
	});

	/**
	 * Test form state initialization with tabs
	 */
	it('should initialize form state with active tab for tabbed forms', () => {
		const formSchema: FormSchema = {
			doctype: 'TestDocType',
			tabs: [
				{
					fieldname: 'tab_1',
					label: 'Tab 1',
					sections: [
						{
							fieldname: 'section_1',
							label: 'Section 1',
							fields: [
								{
									fieldname: 'field1',
									fieldtype: 'Data',
									label: 'Field 1'
								}
							]
						}
					]
				},
				{
					fieldname: 'tab_2',
					label: 'Tab 2',
					sections: []
				}
			],
			layout: {}
		};

		const formState = FormStateManager.initializeState(formSchema);

		expect(formState.active_tab).toBe('tab_1');
	});

	/**
	 * Test updating field value
	 */
	it('should update field value and set dirty flag', () => {
		const formState: FormState = {
			data: {
				field1: 'value1',
				field2: 'value2'
			},
			original_data: {
				field1: 'value1',
				field2: 'value2'
			},
			errors: {},
			dirty: false,
			valid: true,
			loading: false,
			submitting: false,
			active_tab: undefined,
			collapsed_sections: [],
			hidden_fields: [],
			disabled_fields: []
		};

		const updatedState = FormStateManager.updateFieldValue(formState, 'field1', 'new_value1');

		expect(updatedState.data.field1).toBe('new_value1');
		expect(updatedState.data.field2).toBe('value2');
		expect(updatedState.original_data.field1).toBe('value1');
		expect(updatedState.original_data.field2).toBe('value2');
		expect(updatedState.dirty).toBe(true);
	});

	/**
	 * Test updating field value to same value
	 */
	it('should not set dirty flag when updating field to same value', () => {
		const formState: FormState = {
			data: {
				field1: 'value1',
				field2: 'value2'
			},
			original_data: {
				field1: 'value1',
				field2: 'value2'
			},
			errors: {},
			dirty: false,
			valid: true,
			loading: false,
			submitting: false,
			active_tab: undefined,
			collapsed_sections: [],
			hidden_fields: [],
			disabled_fields: []
		};

		const updatedState = FormStateManager.updateFieldValue(formState, 'field1', 'value1');

		expect(updatedState.data.field1).toBe('value1');
		expect(updatedState.data.field2).toBe('value2');
		expect(updatedState.original_data.field1).toBe('value1');
		expect(updatedState.original_data.field2).toBe('value2');
		expect(updatedState.dirty).toBe(false);
	});

	/**
	 * Test updating multiple field values
	 */
	it('should update multiple field values and set dirty flag', () => {
		const formState: FormState = {
			data: {
				field1: 'value1',
				field2: 'value2'
			},
			original_data: {
				field1: 'value1',
				field2: 'value2'
			},
			errors: {},
			dirty: false,
			valid: true,
			loading: false,
			submitting: false,
			active_tab: undefined,
			collapsed_sections: [],
			hidden_fields: [],
			disabled_fields: []
		};

		const values = {
			field1: 'new_value1',
			field2: 'new_value2',
			field3: 'new_value3'
		};

		const updatedState = FormStateManager.updateFieldValues(formState, values);

		expect(updatedState.data.field1).toBe('new_value1');
		expect(updatedState.data.field2).toBe('new_value2');
		expect(updatedState.data.field3).toBe('new_value3');
		expect(updatedState.original_data.field1).toBe('value1');
		expect(updatedState.original_data.field2).toBe('value2');
		expect(updatedState.original_data.field3).toBeUndefined();
		expect(updatedState.dirty).toBe(true);
	});

	/**
	 * Test setting errors
	 */
	it('should set form errors and update valid flag', () => {
		const formState: FormState = {
			data: {},
			original_data: {},
			errors: {},
			dirty: false,
			valid: true,
			loading: false,
			submitting: false,
			active_tab: undefined,
			collapsed_sections: [],
			hidden_fields: [],
			disabled_fields: []
		};

		const errors = {
			field1: ['Field 1 is required'],
			field2: ['Field 2 must be a number', 'Field 2 is too small']
		};

		const updatedState = FormStateManager.setErrors(formState, errors);

		expect(updatedState.errors).toEqual(errors);
		expect(updatedState.valid).toBe(false);
	});

	/**
	 * Test clearing errors
	 */
	it('should clear form errors and update valid flag', () => {
		const formState: FormState = {
			data: {},
			original_data: {},
			errors: {
				field1: ['Field 1 is required'],
				field2: ['Field 2 must be a number']
			},
			dirty: false,
			valid: false,
			loading: false,
			submitting: false,
			active_tab: undefined,
			collapsed_sections: [],
			hidden_fields: [],
			disabled_fields: []
		};

		const updatedState = FormStateManager.clearErrors(formState);

		expect(updatedState.errors).toEqual({});
		expect(updatedState.valid).toBe(true);
	});

	/**
	 * Test setting field error
	 */
	it('should set field error and update valid flag', () => {
		const formState: FormState = {
			data: {},
			original_data: {},
			errors: {},
			dirty: false,
			valid: true,
			loading: false,
			submitting: false,
			active_tab: undefined,
			collapsed_sections: [],
			hidden_fields: [],
			disabled_fields: []
		};

		const errors = ['Field 1 is required'];

		const updatedState = FormStateManager.setFieldError(formState, 'field1', errors);

		expect(updatedState.errors.field1).toEqual(errors);
		expect(updatedState.valid).toBe(false);
	});

	/**
	 * Test clearing field error
	 */
	it('should clear field error and update valid flag', () => {
		const formState: FormState = {
			data: {},
			original_data: {},
			errors: {
				field1: ['Field 1 is required'],
				field2: ['Field 2 must be a number']
			},
			dirty: false,
			valid: false,
			loading: false,
			submitting: false,
			active_tab: undefined,
			collapsed_sections: [],
			hidden_fields: [],
			disabled_fields: []
		};

		const updatedState = FormStateManager.setFieldError(formState, 'field1', []);

		expect(updatedState.errors.field1).toBeUndefined();
		expect(updatedState.errors.field2).toEqual(['Field 2 must be a number']);
		expect(updatedState.valid).toBe(false);
	});

	/**
	 * Test resetting form
	 */
	it('should reset form to original data', () => {
		const formState: FormState = {
			data: {
				field1: 'modified_value1',
				field2: 'modified_value2'
			},
			original_data: {
				field1: 'original_value1',
				field2: 'original_value2'
			},
			errors: {
				field1: ['Field 1 is required']
			},
			dirty: true,
			valid: false,
			loading: false,
			submitting: false,
			active_tab: 'tab_2',
			collapsed_sections: ['section_1'],
			hidden_fields: ['field3'],
			disabled_fields: ['field4']
		};

		const resetState = FormStateManager.resetForm(formState);

		expect(resetState.data.field1).toBe('original_value1');
		expect(resetState.data.field2).toBe('original_value2');
		expect(resetState.original_data.field1).toBe('original_value1');
		expect(resetState.original_data.field2).toBe('original_value2');
		expect(resetState.errors).toEqual({});
		expect(resetState.dirty).toBe(false);
		expect(resetState.valid).toBe(true);
		// Other properties should remain unchanged
		expect(resetState.loading).toBe(false);
		expect(resetState.submitting).toBe(false);
		expect(resetState.active_tab).toBe('tab_2');
		expect(resetState.collapsed_sections).toEqual(['section_1']);
		expect(resetState.hidden_fields).toEqual(['field3']);
		expect(resetState.disabled_fields).toEqual(['field4']);
	});

	/**
	 * Test marking form as saved
	 */
	it('should mark form as saved by updating original data', () => {
		const formState: FormState = {
			data: {
				field1: 'modified_value1',
				field2: 'modified_value2'
			},
			original_data: {
				field1: 'original_value1',
				field2: 'original_value2'
			},
			errors: {},
			dirty: true,
			valid: true,
			loading: false,
			submitting: false,
			active_tab: undefined,
			collapsed_sections: [],
			hidden_fields: [],
			disabled_fields: []
		};

		const savedState = FormStateManager.markAsSaved(formState);

		expect(savedState.data.field1).toBe('modified_value1');
		expect(savedState.data.field2).toBe('modified_value2');
		expect(savedState.original_data.field1).toBe('modified_value1');
		expect(savedState.original_data.field2).toBe('modified_value2');
		expect(savedState.dirty).toBe(false);
		// Other properties should remain unchanged
		expect(savedState.errors).toEqual({});
		expect(savedState.valid).toBe(true);
		expect(savedState.loading).toBe(false);
		expect(savedState.submitting).toBe(false);
	});

	/**
	 * Test toggling section collapsed state
	 */
	it('should toggle section collapsed state', () => {
		const formState: FormState = {
			data: {},
			original_data: {},
			errors: {},
			dirty: false,
			valid: true,
			loading: false,
			submitting: false,
			active_tab: undefined,
			collapsed_sections: ['section_1', 'section_2'],
			hidden_fields: [],
			disabled_fields: []
		};

		// Toggle existing section (remove from collapsed list)
		let updatedState = FormStateManager.toggleSectionCollapsed(formState, 'section_1');
		expect(updatedState.collapsed_sections).toEqual(['section_2']);

		// Toggle non-existing section (add to collapsed list)
		updatedState = FormStateManager.toggleSectionCollapsed(updatedState, 'section_3');
		expect(updatedState.collapsed_sections).toEqual(['section_2', 'section_3']);
	});

	/**
	 * Test setting active tab
	 */
	it('should set active tab', () => {
		const formState: FormState = {
			data: {},
			original_data: {},
			errors: {},
			dirty: false,
			valid: true,
			loading: false,
			submitting: false,
			active_tab: 'tab_1',
			collapsed_sections: [],
			hidden_fields: [],
			disabled_fields: []
		};

		const updatedState = FormStateManager.setActiveTab(formState, 'tab_2');

		expect(updatedState.active_tab).toBe('tab_2');
		// Other properties should remain unchanged
		expect(updatedState.data).toEqual({});
		expect(updatedState.original_data).toEqual({});
		expect(updatedState.errors).toEqual({});
		expect(updatedState.dirty).toBe(false);
		expect(updatedState.valid).toBe(true);
	});

	/**
	 * Test setting loading state
	 */
	it('should set loading state', () => {
		const formState: FormState = {
			data: {},
			original_data: {},
			errors: {},
			dirty: false,
			valid: true,
			loading: false,
			submitting: false,
			active_tab: undefined,
			collapsed_sections: [],
			hidden_fields: [],
			disabled_fields: []
		};

		const loadingState = FormStateManager.setLoading(formState, true);
		expect(loadingState.loading).toBe(true);

		const notLoadingState = FormStateManager.setLoading(formState, false);
		expect(notLoadingState.loading).toBe(false);
	});

	/**
	 * Test setting submitting state
	 */
	it('should set submitting state', () => {
		const formState: FormState = {
			data: {},
			original_data: {},
			errors: {},
			dirty: false,
			valid: true,
			loading: false,
			submitting: false,
			active_tab: undefined,
			collapsed_sections: [],
			hidden_fields: [],
			disabled_fields: []
		};

		const submittingState = FormStateManager.setSubmitting(formState, true);
		expect(submittingState.submitting).toBe(true);

		const notSubmittingState = FormStateManager.setSubmitting(formState, false);
		expect(notSubmittingState.submitting).toBe(false);
	});

	/**
	 * Test hiding fields
	 */
	it('should hide fields', () => {
		const formState: FormState = {
			data: {},
			original_data: {},
			errors: {},
			dirty: false,
			valid: true,
			loading: false,
			submitting: false,
			active_tab: undefined,
			collapsed_sections: [],
			hidden_fields: ['field1'],
			disabled_fields: []
		};

		const updatedState = FormStateManager.hideFields(formState, ['field2', 'field3']);

		expect(updatedState.hidden_fields).toEqual(['field1', 'field2', 'field3']);
		expect(updatedState.hidden_fields).not.toBe(formState.hidden_fields); // Should be a new array
	});

	/**
	 * Test showing fields
	 */
	it('should show fields', () => {
		const formState: FormState = {
			data: {},
			original_data: {},
			errors: {},
			dirty: false,
			valid: true,
			loading: false,
			submitting: false,
			active_tab: undefined,
			collapsed_sections: [],
			hidden_fields: ['field1', 'field2', 'field3'],
			disabled_fields: []
		};

		const updatedState = FormStateManager.showFields(formState, ['field2', 'field3']);

		expect(updatedState.hidden_fields).toEqual(['field1']);
		expect(updatedState.hidden_fields).not.toBe(formState.hidden_fields); // Should be a new array
	});

	/**
	 * Test disabling fields
	 */
	it('should disable fields', () => {
		const formState: FormState = {
			data: {},
			original_data: {},
			errors: {},
			dirty: false,
			valid: true,
			loading: false,
			submitting: false,
			active_tab: undefined,
			collapsed_sections: [],
			hidden_fields: [],
			disabled_fields: ['field1']
		};

		const updatedState = FormStateManager.disableFields(formState, ['field2', 'field3']);

		expect(updatedState.disabled_fields).toEqual(['field1', 'field2', 'field3']);
		expect(updatedState.disabled_fields).not.toBe(formState.disabled_fields); // Should be a new array
	});

	/**
	 * Test enabling fields
	 */
	it('should enable fields', () => {
		const formState: FormState = {
			data: {},
			original_data: {},
			errors: {},
			dirty: false,
			valid: true,
			loading: false,
			submitting: false,
			active_tab: undefined,
			collapsed_sections: [],
			hidden_fields: [],
			disabled_fields: ['field1', 'field2', 'field3']
		};

		const updatedState = FormStateManager.enableFields(formState, ['field2', 'field3']);

		expect(updatedState.disabled_fields).toEqual(['field1']);
		expect(updatedState.disabled_fields).not.toBe(formState.disabled_fields); // Should be a new array
	});

	/**
	 * Test immutability of state updates
	 */
	it('should not mutate original state objects', () => {
		const formState: FormState = {
			data: {
				field1: 'value1'
			},
			original_data: {
				field1: 'value1'
			},
			errors: {},
			dirty: false,
			valid: true,
			loading: false,
			submitting: false,
			active_tab: undefined,
			collapsed_sections: [],
			hidden_fields: [],
			disabled_fields: []
		};

		const updatedState = FormStateManager.updateFieldValue(formState, 'field1', 'new_value1');

		// Original state should not be mutated
		expect(formState.data.field1).toBe('value1');
		expect(formState.dirty).toBe(false);
		expect(formState.data).not.toBe(updatedState.data); // Should be a new object
	});
});