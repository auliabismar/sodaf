/**
 * Form Schema Helper Functions
 * 
 * This file provides helper functions for form processing, data manipulation,
 * and form state management.
 */

import type {
	FormSchema,
	FormSection,
	FormColumn,
	FormField,
	FormTab,
	FormState,
	FormConfig,
	ValidationRule,
	FormEvent,
	FormScript,
	FormMetadata
} from './types';
import type { DocType, DocField } from '../doctype/types';
import { docFieldToFormField, getAllFieldNames, getFieldByName } from './utils';

/**
 * Adapter class for converting DocType to FormSchema
 */
export class DocTypeFormAdapter {
	/**
	 * Convert a DocType to a FormSchema
	 */
	static toFormSchema(doctype: DocType): FormSchema {
		const formSchema: FormSchema = {
			doctype: doctype.name,
			layout: {
				has_tabs: false,
				quick_entry: false,
				print_hide: false,
				class: 'sodaf-form',
				style: {},
				responsive: {
					mobile: 768,
					tablet: 1024,
					desktop: 1200
				},
				grid: {
					columns: 12,
					gap: '1rem',
					min_width: '200px'
				},
				animations: {
					enabled: true,
					duration: '0.3s',
					easing: 'ease-in-out'
				}
			},
			metadata: {
				version: '1.0.0',
				created_at: new Date().toISOString(),
				author: 'SODAF System',
				description: `Form for ${doctype.name} DocType`,
				tags: [doctype.module]
			}
		};

		// Process fields to create form structure
		const sections: FormSection[] = [];
		let currentSection: FormSection | null = null;
		let currentColumn: FormColumn | null = null;
		let hasTabs = false;

		// Check if form has tabs
		const hasTabBreaks = doctype.fields.some(field => field.fieldtype === 'Tab Break');
		
		if (hasTabBreaks) {
			// Process fields with tabs
			const tabs: FormTab[] = [];
			let currentTab: FormTab | null = null;
			let tabOrder = 0;

			for (const docField of doctype.fields) {
				if (docField.fieldtype === 'Tab Break') {
					// Save previous tab if exists
					if (currentTab) {
						tabs.push(currentTab);
					}
					
					// Create new tab
					currentTab = {
						fieldname: docField.fieldname,
						label: docField.label,
						sections: [],
						order: tabOrder++
					};
				} else if (currentTab) {
					// Process field within tab
					this.processFieldForTab(docField, currentTab);
				}
			}

			// Add the last tab
			if (currentTab) {
				tabs.push(currentTab);
			}

			formSchema.tabs = tabs;
			formSchema.layout.has_tabs = true;
			hasTabs = true;
		} else {
			// Process fields without tabs
			for (const docField of doctype.fields) {
				if (docField.fieldtype === 'Section Break') {
					// Save previous section if exists
					if (currentSection) {
						sections.push(currentSection);
					}
					
					// Create new section
					currentSection = {
						fieldname: docField.fieldname,
						label: docField.label,
						collapsible: docField.collapsible,
						collapsed: false,
						columns: [],
						fields: [],
						order: docField.order
					};
				} else if (docField.fieldtype === 'Column Break') {
					// Save previous column if exists
					if (currentColumn) {
						if (currentSection) {
							if (!currentSection.columns) {
								currentSection.columns = [];
							}
							currentSection.columns.push(currentColumn);
						}
					}
					
					// Create new column
					currentColumn = {
						fields: [],
						width: docField.width,
						order: docField.order
					};
				} else if (currentSection) {
					// Process field within section
					const formField = docFieldToFormField(docField);
					
					if (currentColumn) {
						// Add field to current column
						currentColumn.fields.push(formField);
					} else {
						// Add field directly to section
						if (!currentSection.fields) {
							currentSection.fields = [];
						}
						currentSection.fields.push(formField);
					}
				}
			}

			// Add the last section and column
			if (currentColumn && currentSection) {
				if (!currentSection.columns) {
					currentSection.columns = [];
				}
				currentSection.columns.push(currentColumn);
			}
			
			if (currentSection) {
				sections.push(currentSection);
			}

			formSchema.sections = sections;
		}

		// Add form-level validation rules if any
		const validationRules: ValidationRule[] = [];
		
		// Check if DocType has any global validation rules
		// This would typically be stored in a custom field or metadata
		if (validationRules.length > 0) {
			formSchema.validation = validationRules;
		}

		// Add form event handlers if any
		const events: FormEvent = {};
		
		// Check if DocType has any event handlers
		// This would typically be stored in a custom field or metadata
		if (Object.keys(events).length > 0) {
			formSchema.events = events;
		}

		// Add form scripts if any
		const scripts: FormScript[] = [];
		
		// Check if DocType has any custom scripts
		// This would typically be stored in a custom field or metadata
		if (scripts.length > 0) {
			formSchema.scripts = scripts;
		}

		return formSchema;
	}

	/**
	 * Process a field for a tab
	 */
	private static processFieldForTab(docField: DocField, tab: FormTab): void {
		if (docField.fieldtype === 'Section Break') {
			// Create new section in tab
			const section: FormSection = {
				fieldname: docField.fieldname,
				label: docField.label,
				collapsible: docField.collapsible,
				collapsed: false,
				columns: [],
				fields: [],
				order: docField.order
			};
			tab.sections.push(section);
		} else if (docField.fieldtype === 'Column Break') {
			// Add column to current section
			const currentSection = tab.sections[tab.sections.length - 1];
			if (currentSection) {
				const column: FormColumn = {
					fields: [],
					width: docField.width,
					order: docField.order
				};
				if (!currentSection.columns) {
					currentSection.columns = [];
				}
				currentSection.columns.push(column);
			}
		} else {
			// Add field to current section or column
			const currentSection = tab.sections[tab.sections.length - 1];
			if (currentSection) {
				const formField = docFieldToFormField(docField);
				
				// Check if there's a current column
				const currentColumn = currentSection.columns && 
					currentSection.columns[currentSection.columns.length - 1];
				
				if (currentColumn) {
					// Add field to current column
					currentColumn.fields.push(formField);
				} else {
					// Add field directly to section
					if (!currentSection.fields) {
						currentSection.fields = [];
					}
					currentSection.fields.push(formField);
				}
			}
		}
	}

	/**
	 * Convert a DocField to a FormField
	 */
	static toFormField(docField: DocField): FormField {
		return docFieldToFormField(docField);
	}
}

/**
 * Form state manager class
 */
export class FormStateManager {
	/**
	 * Initialize form state with data
	 */
	static initializeState(
		formSchema: FormSchema,
		data: Record<string, any> = {},
		config: FormConfig = {} as FormConfig
	): FormState {
		const fieldNames = getAllFieldNames(formSchema);
		const initialData: Record<string, any> = {};
		
		// Initialize data with default values from form fields
		for (const fieldName of fieldNames) {
			const field = getFieldByName(formSchema, fieldName);
			if (field && field.default !== undefined) {
				initialData[fieldName] = field.default;
			}
		}
		
		// Override with provided data
		Object.assign(initialData, data);
		
		return {
			data: { ...initialData },
			original_data: { ...initialData },
			errors: {},
			dirty: false,
			valid: true,
			loading: false,
			submitting: false,
			active_tab: formSchema.tabs?.[0]?.fieldname,
			collapsed_sections: [],
			hidden_fields: [],
			disabled_fields: []
		};
	}

	/**
	 * Update field value in form state
	 */
	static updateFieldValue(
		state: FormState,
		fieldName: string,
		value: any
	): FormState {
		const newData = { ...state.data };
		newData[fieldName] = value;
		
		// Check if form is dirty
		const dirty = JSON.stringify(newData) !== JSON.stringify(state.original_data);
		
		return {
			...state,
			data: newData,
			dirty
		};
	}

	/**
	 * Update multiple field values in form state
	 */
	static updateFieldValues(
		state: FormState,
		values: Record<string, any>
	): FormState {
		const newData = { ...state.data, ...values };
		
		// Check if form is dirty
		const dirty = JSON.stringify(newData) !== JSON.stringify(state.original_data);
		
		return {
			...state,
			data: newData,
			dirty
		};
	}

	/**
	 * Set form errors
	 */
	static setErrors(
		state: FormState,
		errors: Record<string, string[]>
	): FormState {
		return {
			...state,
			errors,
			valid: Object.keys(errors).length === 0
		};
	}

	/**
	 * Clear form errors
	 */
	static clearErrors(state: FormState): FormState {
		return {
			...state,
			errors: {},
			valid: true
		};
	}

	/**
	 * Set field error
	 */
	static setFieldError(
		state: FormState,
		fieldName: string,
		errors: string[]
	): FormState {
		const newErrors = { ...state.errors };
		if (errors.length > 0) {
			newErrors[fieldName] = errors;
		} else {
			delete newErrors[fieldName];
		}
		
		return {
			...state,
			errors: newErrors,
			valid: Object.keys(newErrors).length === 0
		};
	}

	/**
	 * Reset form to original data
	 */
	static resetForm(state: FormState): FormState {
		return {
			...state,
			data: { ...state.original_data },
			dirty: false,
			errors: {},
			valid: true
		};
	}

	/**
	 * Mark form as saved (update original data)
	 */
	static markAsSaved(state: FormState): FormState {
		return {
			...state,
			original_data: { ...state.data },
			dirty: false
		};
	}

	/**
	 * Toggle section collapsed state
	 */
	static toggleSectionCollapsed(
		state: FormState,
		sectionFieldname: string
	): FormState {
		const collapsedSections = [...state.collapsed_sections];
		const index = collapsedSections.indexOf(sectionFieldname);
		
		if (index >= 0) {
			collapsedSections.splice(index, 1);
		} else {
			collapsedSections.push(sectionFieldname);
		}
		
		return {
			...state,
			collapsed_sections: collapsedSections
		};
	}

	/**
	 * Set active tab
	 */
	static setActiveTab(
		state: FormState,
		tabFieldname: string
	): FormState {
		return {
			...state,
			active_tab: tabFieldname
		};
	}

	/**
	 * Set loading state
	 */
	static setLoading(state: FormState, loading: boolean): FormState {
		return {
			...state,
			loading
		};
	}

	/**
	 * Set submitting state
	 */
	static setSubmitting(state: FormState, submitting: boolean): FormState {
		return {
			...state,
			submitting
		};
	}

	/**
	 * Hide fields
	 */
	static hideFields(state: FormState, fieldNames: string[]): FormState {
		const hiddenFields = [...new Set([...state.hidden_fields, ...fieldNames])];
		return {
			...state,
			hidden_fields: hiddenFields
		};
	}

	/**
	 * Show fields
	 */
	static showFields(state: FormState, fieldNames: string[]): FormState {
		const hiddenFields = state.hidden_fields.filter(
			fieldName => !fieldNames.includes(fieldName)
		);
		return {
			...state,
			hidden_fields: hiddenFields
		};
	}

	/**
	 * Disable fields
	 */
	static disableFields(state: FormState, fieldNames: string[]): FormState {
		const disabledFields = [...new Set([...state.disabled_fields, ...fieldNames])];
		return {
			...state,
			disabled_fields: disabledFields
		};
	}

	/**
	 * Enable fields
	 */
	static enableFields(state: FormState, fieldNames: string[]): FormState {
		const disabledFields = state.disabled_fields.filter(
			fieldName => !fieldNames.includes(fieldName)
		);
		return {
			...state,
			disabled_fields: disabledFields
		};
	}
}

/**
 * Form data processor class
 */
export class FormDataProcessor {
	/**
	 * Extract form data for submission
	 */
	static extractData(state: FormState): Record<string, any> {
		return { ...state.data };
	}

	/**
	 * Extract changed data for submission
	 */
	static extractChangedData(state: FormState): Record<string, any> {
		const changedData: Record<string, any> = {};
		
		for (const [key, value] of Object.entries(state.data)) {
			if (state.original_data[key] !== value) {
				changedData[key] = value;
			}
		}
		
		return changedData;
	}

	/**
	 * Validate form data before submission
	 */
	static validateForSubmission(
		state: FormState,
		formSchema: FormSchema
	): { valid: boolean; errors: Record<string, string[]> } {
		// This would typically use the validation functions from validators.ts
		// For now, we'll just check if there are any errors in the state
		return {
			valid: state.valid,
			errors: state.errors
		};
	}

	/**
	 * Format form data for API submission
	 */
	static formatForSubmission(
		data: Record<string, any>,
		formSchema: FormSchema
	): Record<string, any> {
		// This would typically format the data according to the requirements
		// of the backend API
		return {
			doctype: formSchema.doctype,
			doc: data
		};
	}

	/**
	 * Process API response data for form
	 */
	static processApiResponse(
		response: any,
		formSchema: FormSchema
	): Record<string, any> {
		// This would typically process the API response to extract form data
		// For now, we'll just return the response data
		return response.data || response;
	}
}

/**
 * Form dependency processor class
 */
export class FormDependencyProcessor {
	/**
	 * Evaluate field dependencies
	 */
	static evaluateDependencies(
		formSchema: FormSchema,
		data: Record<string, any>
	): { hidden: string[]; disabled: string[] } {
		const hidden: string[] = [];
		const disabled: string[] = [];
		
		// Get all fields in the form
		const fieldNames = getAllFieldNames(formSchema);
		
		for (const fieldName of fieldNames) {
			const field = getFieldByName(formSchema, fieldName);
			if (field && field.depends_on) {
				const shouldShow = this.evaluateDependency(
					field.depends_on,
					data
				);
				
				if (!shouldShow) {
					hidden.push(fieldName);
				}
			}
		}
		
		return { hidden, disabled };
	}

	/**
	 * Evaluate a single dependency expression
	 */
	private static evaluateDependency(
		expression: string,
		data: Record<string, any>
	): boolean {
		try {
			// Create a safe evaluation context
			const func = new Function(
				'data',
				`
				with (data) {
					return ${expression};
				}
				`
			);
			return func(data);
		} catch (error) {
			console.error('Dependency evaluation error:', error);
			return true; // Default to showing the field
		}
	}
}