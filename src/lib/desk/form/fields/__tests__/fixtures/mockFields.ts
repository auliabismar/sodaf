import type { DocField, DocType } from '../../../../../meta/doctype/types';

/**
 * Creates a mock DocField with default values and optional overrides
 */
export function createMockField(overrides: Partial<DocField> = {}): DocField {
	return {
		fieldname: 'test_field',
		label: 'Test Field',
		fieldtype: 'Data',
		required: false,
		unique: false,
		hidden: false,
		read_only: false,
		length: 0,
		precision: undefined,
		default: undefined,
		options: undefined,
		description: undefined,
		comment: undefined,
		order: 1,
		in_list_view: false,
		depends_on: undefined,
		mandatory_depends_on: undefined,
		permlevel: 0,
		fetch_from: undefined,
		fetch_if_empty: false,
		ignore_user_permissions: false,
		ignore_xss_filtered: false,
		in_global_search: false,
		in_standard_filter: false,
		allow_on_submit: false,
		print_hide: false,
		report_hide: false,
		no_copy: false,
		search_index: false,
		collapsible: false,
		collapsible_depends_on: undefined,
		...overrides
	};
}

/**
 * Creates a mock DocType with specified fields
 */
export function createMockDocType(fields: DocField[] = []): DocType {
	return {
		name: 'TestDocType',
		module: 'Test',
		issingle: false,
		istable: false,
		fields: fields.length > 0 ? fields : [createMockField()],
		permissions: [],
		indexes: [],
	};
}

/**
 * Pre-configured mock fields for common field types
 */
export const mockFields = {
	data: createMockField({ fieldname: 'data_field', label: 'Data Field', fieldtype: 'Data' }),
	int: createMockField({ fieldname: 'int_field', label: 'Int Field', fieldtype: 'Int' }),
	float: createMockField({ fieldname: 'float_field', label: 'Float Field', fieldtype: 'Float' }),
	currency: createMockField({ fieldname: 'currency_field', label: 'Currency Field', fieldtype: 'Currency', options: 'USD' }),
	percent: createMockField({ fieldname: 'percent_field', label: 'Percent Field', fieldtype: 'Percent' }),
	check: createMockField({ fieldname: 'check_field', label: 'Check Field', fieldtype: 'Check' }),
	select: createMockField({ 
		fieldname: 'select_field', 
		label: 'Select Field', 
		fieldtype: 'Select', 
		options: 'Option 1\nOption 2\nOption 3' 
	}),
	link: createMockField({ fieldname: 'link_field', label: 'Link Field', fieldtype: 'Link', options: 'User' }),
	dynamicLink: createMockField({
		fieldname: 'dynamic_link_field',
		label: 'Dynamic Link Field',
		fieldtype: 'Dynamic Link',
		options: 'reference_type\nUser\nCustomer\nSupplier'
	}),
	date: createMockField({ fieldname: 'date_field', label: 'Date Field', fieldtype: 'Date' }),
	datetime: createMockField({ fieldname: 'datetime_field', label: 'Datetime Field', fieldtype: 'Datetime' }),
	time: createMockField({ fieldname: 'time_field', label: 'Time Field', fieldtype: 'Time' }),
	duration: createMockField({ fieldname: 'duration_field', label: 'Duration Field', fieldtype: 'Duration' }),
	text: createMockField({ fieldname: 'text_field', label: 'Text Field', fieldtype: 'Long Text' }),
	smallText: createMockField({ fieldname: 'small_text_field', label: 'Small Text Field', fieldtype: 'Small Text' }),
	textEditor: createMockField({ fieldname: 'text_editor_field', label: 'Text Editor Field', fieldtype: 'Text Editor' }),
	code: createMockField({ fieldname: 'code_field', label: 'Code Field', fieldtype: 'Code', options: 'javascript' }),
	html: createMockField({ fieldname: 'html_field', label: 'HTML Field', fieldtype: 'HTML' }),
	markdown: createMockField({ fieldname: 'markdown_field', label: 'Markdown Field', fieldtype: 'Markdown Editor' }),
	attach: createMockField({ fieldname: 'attach_field', label: 'Attach Field', fieldtype: 'Attach' }),
	attachImage: createMockField({ fieldname: 'attach_image_field', label: 'Attach Image Field', fieldtype: 'Attach Image' }),
	table: createMockField({ fieldname: 'table_field', label: 'Table Field', fieldtype: 'Table', options: 'ChildDocType' }),
	password: createMockField({ fieldname: 'password_field', label: 'Password Field', fieldtype: 'Password' }),
	color: createMockField({ fieldname: 'color_field', label: 'Color Field', fieldtype: 'Color' }),
	rating: createMockField({ fieldname: 'rating_field', label: 'Rating Field', fieldtype: 'Rating' }),
	signature: createMockField({ fieldname: 'signature_field', label: 'Signature Field', fieldtype: 'Signature' }),
	geolocation: createMockField({ fieldname: 'geolocation_field', label: 'Geolocation Field', fieldtype: 'Geolocation' }),
	readOnly: createMockField({ fieldname: 'read_only_field', label: 'Read Only Field', fieldtype: 'Read Only' })
};

/**
 * Creates a required field
 */
export function createRequiredField(fieldtype: DocField['fieldtype'], overrides: Partial<DocField> = {}): DocField {
	return createMockField({
		fieldtype,
		required: true,
		...overrides
	});
}

/**
 * Creates a read-only field
 */
export function createReadOnlyField(fieldtype: DocField['fieldtype'], overrides: Partial<DocField> = {}): DocField {
	return createMockField({
		fieldtype,
		read_only: true,
		...overrides
	});
}

/**
 * Creates a field with description
 */
export function createFieldWithDescription(fieldtype: DocField['fieldtype'], description: string, overrides: Partial<DocField> = {}): DocField {
	return createMockField({
		fieldtype,
		description,
		...overrides
	});
}

/**
 * Creates a field with options
 */
export function createFieldWithOptions(fieldtype: DocField['fieldtype'], options: string, overrides: Partial<DocField> = {}): DocField {
	return createMockField({
		fieldtype,
		options,
		...overrides
	});
}