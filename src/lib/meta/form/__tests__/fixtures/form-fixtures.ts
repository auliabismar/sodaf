/**
 * Form Schema Test Fixtures
 * 
 * This file contains test fixtures for form schema tests.
 */

import type { DocType, DocField } from '../../../doctype/types';
import type { FormSchema, FormSection, FormTab, FormField, FormColumn } from '../../types';

/**
 * Sample DocType for testing
 */
export const sampleDocType: DocType = {
	name: 'TestDocType',
	module: 'TestModule',
	issingle: false,
	istable: false,
	is_submittable: false,
	is_tree: false,
	is_virtual: false,
	autoname: 'TEST-.#####',
	fields: [
		{
			fieldname: 'name',
			label: 'Name',
			fieldtype: 'Data',
			required: true,
			unique: true,
			length: 100,
			description: 'Name of the document'
		},
		{
			fieldname: 'status',
			label: 'Status',
			fieldtype: 'Select',
			options: 'Draft\nSubmitted\nCancelled',
			default: 'Draft',
			required: true,
			description: 'Document status'
		},
		{
			fieldname: 'section_break_1',
			label: 'Personal Information',
			fieldtype: 'Section Break',
			collapsible: true,
			order: 10
		},
		{
			fieldname: 'first_name',
			label: 'First Name',
			fieldtype: 'Data',
			required: true,
			length: 50,
			order: 20
		},
		{
			fieldname: 'column_break_1',
			label: 'Column Break',
			fieldtype: 'Column Break',
			width: '50%',
			order: 30
		},
		{
			fieldname: 'last_name',
			label: 'Last Name',
			fieldtype: 'Data',
			required: true,
			length: 50,
			order: 40
		},
		{
			fieldname: 'email',
			label: 'Email',
			fieldtype: 'Data',
			required: true,
			unique: true,
			length: 100,
			order: 50
		},
		{
			fieldname: 'section_break_2',
			label: 'Additional Information',
			fieldtype: 'Section Break',
			order: 60
		},
		{
			fieldname: 'age',
			label: 'Age',
			fieldtype: 'Int',
			order: 70
		},
		{
			fieldname: 'tab_break_1',
			label: 'Contact Information',
			fieldtype: 'Tab Break',
			order: 80
		},
		{
			fieldname: 'section_break_3',
			label: 'Contact Details',
			fieldtype: 'Section Break',
			order: 90
		},
		{
			fieldname: 'phone',
			label: 'Phone',
			fieldtype: 'Data',
			length: 20,
			order: 100
		},
		{
			fieldname: 'address',
			label: 'Address',
			fieldtype: 'Long Text',
			order: 110
		}
	],
	permissions: [
		{
			role: 'System Manager',
			read: true,
			write: true,
			create: true,
			delete: true,
			submit: true,
			cancel: true,
			amend: true,
			report: true,
			export: true,
			import: true,
			share: true,
			print: true,
			email: true,
			select: true,
			permlevel: 0,
			if_owner: false,
			apply_to_all: true
		},
		{
			role: 'All',
			read: true,
			write: false,
			create: false,
			delete: false,
			submit: false,
			cancel: false,
			amend: false,
			report: true,
			export: false,
			import: false,
			share: false,
			print: true,
			email: false,
			select: true,
			permlevel: 0,
			if_owner: false,
			apply_to_all: true
		}
	],
	indexes: [
		{
			name: 'idx_name',
			columns: ['name'],
			unique: true,
			type: 'btree'
		},
		{
			name: 'idx_status',
			columns: ['status'],
			unique: false,
			type: 'btree'
		}
	],
	actions: [
		{
			label: 'Submit',
			action_type: 'Server Action',
			action: 'submit_doc',
			group: 'Actions',
			hidden: false,
			condition: 'doc.status === "Draft"',
			order: 10,
			is_standard: true
		},
		{
			label: 'Cancel',
			action_type: 'Server Action',
			action: 'cancel_doc',
			group: 'Actions',
			hidden: false,
			condition: 'doc.status === "Submitted"',
			order: 20,
			is_standard: true
		}
	],
	links: [
		{
			group: 'Related Documents',
			link_doctype: 'TestChild',
			link_fieldname: 'parent',
			parent_doctype: 'TestDocType',
			label: 'Test Children',
			hidden: false,
			condition: 'doc.status !== "Draft"',
			order: 10
		}
	],
	title_field: 'name',
	search_fields: 'name,status,email',
	track_changes: true,
	allow_import: true,
	allow_rename: true
};

/**
 * Sample FormSchema for testing (without tabs)
 */
export const sampleFormSchema: FormSchema = {
	doctype: 'TestDocType',
	sections: [
		{
			fieldname: 'name',
			label: 'Name',
			fields: [
				{
					fieldname: 'name',
					fieldtype: 'Data',
					label: 'Name',
					required: true,
					length: 100,
					description: 'Name of the document'
				}
			]
		},
		{
			fieldname: 'section_break_1',
			label: 'Personal Information',
			collapsible: true,
			collapsed: false,
			order: 10,
			columns: [
				{
					fields: [
						{
							fieldname: 'first_name',
							fieldtype: 'Data',
							label: 'First Name',
							required: true,
							length: 50,
							order: 20
						}
					],
					width: '50%',
					order: 1
				},
				{
					fields: [
						{
							fieldname: 'last_name',
							fieldtype: 'Data',
							label: 'Last Name',
							required: true,
							length: 50,
							order: 40
						}
					],
					width: '50%',
					order: 2
				}
			]
		},
		{
			fieldname: 'section_break_2',
			label: 'Additional Information',
			order: 60,
			fields: [
				{
					fieldname: 'age',
					fieldtype: 'Int',
					label: 'Age',
					min: 0,
					max: 150,
					order: 70
				}
			]
		}
	],
	layout: {
		has_tabs: false,
		quick_entry: false,
		print_hide: false,
		class: 'sodaf-form',
		style: {
			backgroundColor: '#ffffff',
			padding: '20px'
		},
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
	validation: [
		{
			type: 'required',
			message: 'Name is required',
			validator: 'return value !== ""',
			trigger: 'change'
		}
	],
	events: {
		on_load: 'console.log("Form loaded")',
		on_submit: 'console.log("Form submitted")',
		on_change: {
			name: 'console.log("Name changed")',
			status: 'console.log("Status changed")'
		}
	},
	scripts: [
		{
			name: 'form-script',
			code: 'console.log("Form script executed")',
			type: 'javascript',
			trigger: 'load'
		}
	],
	metadata: {
		version: '1.0.0',
		created_at: '2023-12-01T10:00:00Z',
		modified_at: '2023-12-02T15:30:00Z',
		author: 'Test Author',
		description: 'Test form schema',
		tags: ['test', 'form'],
		custom: {
			category: 'test-forms',
			priority: 'high'
		}
	}
};

/**
 * Sample FormSchema for testing (with tabs)
 */
export const sampleTabbedFormSchema: FormSchema = {
	doctype: 'TestDocType',
	tabs: [
		{
			fieldname: 'tab_break_1',
			label: 'Personal Information',
			order: 10,
			sections: [
				{
					fieldname: 'section_break_1',
					label: 'Basic Information',
					order: 20,
					fields: [
						{
							fieldname: 'first_name',
							fieldtype: 'Data',
							label: 'First Name',
							required: true,
							length: 50,
							order: 30
						},
						{
							fieldname: 'last_name',
							fieldtype: 'Data',
							label: 'Last Name',
							required: true,
							length: 50,
							order: 40
						}
					]
				},
				{
					fieldname: 'section_break_2',
					label: 'Additional Information',
					order: 50,
					columns: [
						{
							fields: [
								{
									fieldname: 'age',
									fieldtype: 'Int',
									label: 'Age',
									min: 0,
									max: 150,
									order: 60
								}
							],
							width: '100%',
							order: 1
						}
					]
				}
			]
		},
		{
			fieldname: 'tab_break_2',
			label: 'Contact Information',
			order: 70,
			sections: [
				{
					fieldname: 'section_break_3',
					label: 'Contact Details',
					order: 80,
					fields: [
						{
							fieldname: 'email',
							fieldtype: 'Data',
							label: 'Email',
							required: true,
							length: 100,
							order: 90
						},
						{
							fieldname: 'phone',
							fieldtype: 'Data',
							label: 'Phone',
							length: 20,
							order: 100
						}
					]
				}
			]
		}
	],
	layout: {
		has_tabs: true,
		quick_entry: false,
		print_hide: false,
		class: 'sodaf-form',
		style: {
			backgroundColor: '#ffffff',
			padding: '20px'
		},
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
	validation: [
		{
			type: 'required',
			message: 'Name is required',
			validator: 'return value !== ""',
			trigger: 'change'
		}
	],
	events: {
		on_load: 'console.log("Form loaded")',
		on_submit: 'console.log("Form submitted")',
		on_change: {
			first_name: 'console.log("First name changed")',
			last_name: 'console.log("Last name changed")'
		}
	},
	scripts: [
		{
			name: 'form-script',
			code: 'console.log("Form script executed")',
			type: 'javascript',
			trigger: 'load'
		}
	],
	metadata: {
		version: '1.0.0',
		created_at: '2023-12-01T10:00:00Z',
		modified_at: '2023-12-02T15:30:00Z',
		author: 'Test Author',
		description: 'Test tabbed form schema',
		tags: ['test', 'form', 'tabbed'],
		custom: {
			category: 'test-forms',
			priority: 'high'
		}
	}
};

/**
 * Sample FormField for testing
 */
export const sampleFormField: FormField = {
	fieldname: 'test_field',
	fieldtype: 'Data',
	label: 'Test Field',
	required: true,
	read_only: false,
	hidden: false,
	default: 'Default Value',
	options: 'Option1\nOption2\nOption3',
	validation: [
		{
			type: 'required',
			message: 'This field is required',
			validator: 'return value !== ""',
			trigger: 'change'
		},
		{
			type: 'minlength',
			message: 'Minimum length is 5',
			validator: 'return value.length >= 5',
			params: {
				minLength: 5
			},
			trigger: 'blur'
		}
	],
	condition: 'doc.show_field === true',
	on_change: 'console.log("Field changed")',
	width: '100%',
	class: 'test-field',
	description: 'Test field description',
	placeholder: 'Enter value',
	order: 1,
	depends_on: 'other_field',
	properties: {
		customProp: 'customValue'
	},
	group: 'test_group',
	translatable: true,
	precision: 2,
	length: 100,
	min: 0,
	max: 100,
	step: 1,
	pattern: '^[a-zA-Z]+$',
	multiple: false,
	autocomplete: 'on',
	spellcheck: true
};

/**
 * Sample FormSection for testing
 */
export const sampleFormSection: FormSection = {
	fieldname: 'test_section',
	label: 'Test Section',
	collapsible: true,
	collapsed: false,
	condition: 'doc.show_section === true',
	columns: [
		{
			fields: [
				{
					fieldname: 'field1',
					fieldtype: 'Data',
					label: 'Field 1'
				}
			],
			width: '50%',
			class: 'test-column',
			order: 1,
			responsive: {
				sm: '100%',
				md: '50%',
				lg: '33%'
			}
		},
		{
			fields: [
				{
					fieldname: 'field2',
					fieldtype: 'Data',
					label: 'Field 2'
				}
			],
			width: '50%',
			class: 'test-column',
			order: 2
		}
	],
	fields: [
		{
			fieldname: 'field3',
			fieldtype: 'Data',
			label: 'Field 3'
		}
	],
	class: 'test-section',
	description: 'Test section description',
	order: 1,
	depends_on: 'other_field',
	hidden: false
};

/**
 * Sample FormColumn for testing
 */
export const sampleFormColumn: FormColumn = {
	fields: [
		{
			fieldname: 'field1',
			fieldtype: 'Data',
			label: 'Field 1'
		},
		{
			fieldname: 'field2',
			fieldtype: 'Data',
			label: 'Field 2'
		}
	],
	width: '60%',
	class: 'test-column',
	order: 1,
	responsive: {
		sm: '100%',
		md: '50%',
		lg: '33%'
	}
};

/**
 * Sample FormTab for testing
 */
export const sampleFormTab: FormTab = {
	fieldname: 'test_tab',
	label: 'Test Tab',
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
	],
	condition: 'doc.show_tab === true',
	class: 'test-tab',
	order: 1,
	disabled: false,
	hidden: false,
	icon: 'test-icon',
	badge: 'New',
	depends_on: 'other_field'
};

/**
 * Sample validation data for testing
 */
export const sampleValidationData = {
	validEmails: [
		'test@example.com',
		'user.name@domain.co.uk',
		'user+tag@example.org'
	],
	invalidEmails: [
		'invalid-email',
		'test@',
		'@example.com'
	],
	validPhones: [
		'+1-555-123-4567',
		'(555) 123-4567',
		'555.123.4567',
		'+44 20 7123 4567'
	],
	invalidPhones: [
		'invalid-phone',
		'123'
	],
	validUrls: [
		'https://www.example.com',
		'http://example.org',
		'https://subdomain.example.co.uk/path?query=value'
	],
	invalidUrls: [
		'invalid-url',
		'not-a-url'
	],
	validNumbers: [
		'123',
		'123.45',
		'-123',
		123,
		123.45
	],
	invalidNumbers: [
		'not-a-number',
		'123abc'
	],
	validIntegers: [
		'123',
		'-123',
		123,
		-123
	],
	invalidIntegers: [
		'123.45',
		'not-a-number',
		123.45
	],
	validFloats: [
		'123',
		'123.45',
		'-123.45',
		123,
		123.45
	],
	invalidFloats: [
		'not-a-number',
		'123abc'
	],
	validCurrencies: [
		'123',
		'123.45',
		'$123.45',
		'-123.45',
		'1,234.56',
		'$1,234.56'
	],
	invalidCurrencies: [
		'not-a-currency',
		'123.456'
	],
	validDates: [
		'2023-12-01',
		'12/01/2023',
		'December 1, 2023',
		new Date('2023-12-01')
	],
	invalidDates: [
		'invalid-date',
		'32/13/2023'
	],
	validTimes: [
		'12:00',
		'23:59',
		'00:00',
		'12:30:45'
	],
	invalidTimes: [
		'24:00',
		'12:60',
		'invalid-time'
	],
	validDateTimes: [
		'2023-12-01T12:00:00Z',
		'2023-12-01 12:00:00',
		new Date('2023-12-01T12:00:00Z')
	],
	invalidDateTimes: [
		'invalid-datetime'
	]
};

/**
 * Sample form state for testing
 */
export const sampleFormState = {
	data: {
		field1: 'value1',
		field2: 'value2',
		field3: 'value3'
	},
	original_data: {
		field1: 'original_value1',
		field2: 'original_value2',
		field3: 'original_value3'
	},
	errors: {
		field1: ['Field 1 is required'],
		field2: ['Field 2 must be a number', 'Field 2 is too small']
	},
	dirty: true,
	valid: false,
	loading: false,
	submitting: false,
	active_tab: 'tab1',
	collapsed_sections: ['section1', 'section2'],
	hidden_fields: ['field3', 'field4'],
	disabled_fields: ['field5', 'field6']
};

/**
 * Sample form configuration for testing
 */
export const sampleFormConfig = {
	enable_validation: true,
	auto_save: false,
	auto_save_interval: 30000,
	enable_reset: true,
	enable_print: true,
	enable_export: true,
	enable_import: true,
	theme: 'default',
	language: 'en',
	custom_classes: {
		form: 'custom-form',
		section: 'custom-section'
	},
	custom_styles: {
		backgroundColor: '#f5f5f5',
		padding: '20px'
	}
};

/**
 * Sample validation context for testing
 */
export const sampleValidationContext = {
	data: {
		field1: 'value1',
		field2: 'value2'
	},
	permissions: ['read', 'write'],
	extra: {
		user_id: 'user123',
		role: 'admin'
	}
};