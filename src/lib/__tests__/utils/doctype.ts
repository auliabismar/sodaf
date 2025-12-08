/**
 * DocType Test Utilities
 * 
 * Provides utilities for creating test DocType definitions,
 * setting up test scenarios, and validating DocType behavior.
 */

import type { DocType, DocField, DocPerm, DocIndex } from '../../meta/doctype/types';

/**
 * Test DocType configuration
 */
export interface TestDocTypeConfig {
	/** DocType name */
	name: string;
	/** Module name */
	module: string;
	/** Whether this is a single document type */
	isSingle?: boolean;
	/** Whether this is a child table */
	isTable?: boolean;
	/** Whether this document type is submittable */
	isSubmittable?: boolean;
	/** Whether this document type is a tree structure */
	isTree?: boolean;
	/** Whether this document type is virtual */
	isVirtual?: boolean;
	/** Fields to include */
	fields?: Partial<DocField>[];
	/** Permissions to include */
	permissions?: Partial<DocPerm>[];
	/** Indexes to include */
	indexes?: Partial<DocIndex>[];
}

/**
 * DocType test factory
 */
export class DocTypeTestFactory {
	/**
	 * Create a minimal valid DocType
	 */
	public static createMinimalDocType(config: TestDocTypeConfig): DocType {
		return {
			name: config.name,
			module: config.module,
			issingle: config.isSingle || false,
			istable: config.isTable || false,
			is_submittable: config.isSubmittable || false,
			is_tree: config.isTree || false,
			is_virtual: config.isVirtual || false,
			fields: config.fields?.map(this.createField) || [this.createField({ fieldname: 'name', label: 'Name', fieldtype: 'Data' })],
			permissions: config.permissions?.map(this.createPermission) || [this.createPermission({ role: 'System Manager' })]
		};
	}

	/**
	 * Create a comprehensive DocType with all features
	 */
	public static createComprehensiveDocType(config: TestDocTypeConfig): DocType {
		const fields = [
			this.createField({ fieldname: 'name', label: 'Name', fieldtype: 'Data', required: true }),
			this.createField({ fieldname: 'description', label: 'Description', fieldtype: 'Long Text' }),
			this.createField({ fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Draft\nSubmitted\nCancelled', default: 'Draft' }),
			this.createField({ fieldname: 'created_date', label: 'Created Date', fieldtype: 'Date', default: 'Today' }),
			this.createField({ fieldname: 'amount', label: 'Amount', fieldtype: 'Currency', precision: 2 }),
			this.createField({ fieldname: 'is_active', label: 'Is Active', fieldtype: 'Check', default: 1 }),
			this.createField({ fieldname: 'link_field', label: 'Link Field', fieldtype: 'Link', options: 'User' }),
			this.createField({ fieldname: 'table_field', label: 'Table Field', fieldtype: 'Table', options: 'ChildDoc' }),
			this.createField({ fieldname: 'section_break', label: 'Section Break', fieldtype: 'Section Break' }),
			this.createField({ fieldname: 'column_break', label: 'Column Break', fieldtype: 'Column Break' }),
			this.createField({ fieldname: 'tab_break', label: 'Tab Break', fieldtype: 'Tab Break' }),
			this.createField({ fieldname: 'image_field', label: 'Image', fieldtype: 'Attach Image' }),
			this.createField({ fieldname: 'attachment', label: 'Attachment', fieldtype: 'Attach' }),
			this.createField({ fieldname: 'html_content', label: 'HTML Content', fieldtype: 'HTML Editor' }),
			this.createField({ fieldname: 'code_field', label: 'Code', fieldtype: 'Code' }),
			this.createField({ fieldname: 'rating', label: 'Rating', fieldtype: 'Rating' }),
			this.createField({ fieldname: 'color', label: 'Color', fieldtype: 'Color' }),
			this.createField({ fieldname: 'password', label: 'Password', fieldtype: 'Password' }),
			this.createField({ fieldname: 'read_only', label: 'Read Only', fieldtype: 'Read Only' })
		];

		const permissions = [
			this.createPermission({ role: 'System Manager', read: true, write: true, create: true, delete: true }),
			this.createPermission({ role: 'Admin', read: true, write: true, create: true, delete: false }),
			this.createPermission({ role: 'User', read: true, write: false, create: false, delete: false }),
			this.createPermission({ role: 'Guest', read: false, write: false, create: false, delete: false })
		];

		const indexes = [
			this.createIndex({ name: 'idx_name', columns: ['name'], unique: true }),
			this.createIndex({ name: 'idx_status', columns: ['status'] }),
			this.createIndex({ name: 'idx_created_date', columns: ['created_date'] }),
			this.createIndex({ name: 'idx_name_status', columns: ['name', 'status'], unique: false })
		];

		return {
			name: config.name,
			module: config.module,
			issingle: config.isSingle || false,
			istable: config.isTable || false,
			is_submittable: config.isSubmittable || false,
			is_tree: config.isTree || false,
			is_virtual: config.isVirtual || false,
			fields: [...fields, ...(config.fields?.map(this.createField) || [])],
			permissions: [...permissions, ...(config.permissions?.map(this.createPermission) || [])],
			indexes: [...indexes, ...(config.indexes?.map(this.createIndex) || [])],
			title_field: 'name',
			search_fields: 'name,description',
			keyword_fields: 'name,description',
			default_sort_order: 'modified desc',
			track_changes: true,
			track_seen: true,
			track_visits: true,
			show_in_global_search: true,
			allow_rename: true,
			autoname: 'naming_series',
			naming_series: 'TEST-.YYYY.-.#####',
			max_attachments: 5
		};
	}

	/**
	 * Create a child table DocType
	 */
	public static createChildTableDocType(config: TestDocTypeConfig): DocType {
		const fields = [
			this.createField({ fieldname: 'parent', label: 'Parent', fieldtype: 'Link', options: config.name, required: true }),
			this.createField({ fieldname: 'parenttype', label: 'Parent Type', fieldtype: 'Data', default: config.name }),
			this.createField({ fieldname: 'parentfield', label: 'Parent Field', fieldtype: 'Data' }),
			this.createField({ fieldname: 'idx', label: 'Index', fieldtype: 'Int', default: 0 }),
			this.createField({ fieldname: 'item_name', label: 'Item Name', fieldtype: 'Data', required: true }),
			this.createField({ fieldname: 'description', label: 'Description', fieldtype: 'Long Text' }),
			this.createField({ fieldname: 'amount', label: 'Amount', fieldtype: 'Currency' }),
			this.createField({ fieldname: 'quantity', label: 'Quantity', fieldtype: 'Float' }),
			this.createField({ fieldname: 'rate', label: 'Rate', fieldtype: 'Currency' })
		];

		return {
			name: config.name,
			module: config.module,
			istable: true,
			fields: [...fields, ...(config.fields?.map(this.createField) || [])],
			permissions: config.permissions?.map(this.createPermission) || [this.createPermission({ role: 'System Manager' })]
		};
	}

	/**
	 * Create a single document DocType
	 */
	public static createSingleDocType(config: TestDocTypeConfig): DocType {
		const fields = [
			this.createField({ fieldname: 'company_name', label: 'Company Name', fieldtype: 'Data', required: true }),
			this.createField({ fieldname: 'company_logo', label: 'Company Logo', fieldtype: 'Attach Image' }),
			this.createField({ fieldname: 'default_currency', label: 'Default Currency', fieldtype: 'Link', options: 'Currency', default: 'USD' }),
			this.createField({ fieldname: 'fiscal_year_start', label: 'Fiscal Year Start', fieldtype: 'Date' }),
			this.createField({ fieldname: 'fiscal_year_end', label: 'Fiscal Year End', fieldtype: 'Date' }),
			this.createField({ fieldname: 'timezone', label: 'Timezone', fieldtype: 'Data', default: 'UTC' }),
			this.createField({ fieldname: 'date_format', label: 'Date Format', fieldtype: 'Select', options: 'dd-mm-yyyy\nmm-dd-yyyy\nyyyy-mm-dd', default: 'dd-mm-yyyy' }),
			this.createField({ fieldname: 'time_format', label: 'Time Format', fieldtype: 'Select', options: '24 Hour\n12 Hour', default: '24 Hour' })
		];

		return {
			name: config.name,
			module: config.module,
			issingle: true,
			fields: [...fields, ...(config.fields?.map(this.createField) || [])],
			permissions: config.permissions?.map(this.createPermission) || [this.createPermission({ role: 'System Manager' })]
		};
	}

	/**
	 * Create a virtual DocType
	 */
	public static createVirtualDocType(config: TestDocTypeConfig): DocType {
		const fields = [
			this.createField({ fieldname: 'name', label: 'Name', fieldtype: 'Data' }),
			this.createField({ fieldname: 'total_count', label: 'Total Count', fieldtype: 'Int' }),
			this.createField({ fieldname: 'last_updated', label: 'Last Updated', fieldtype: 'Datetime' }),
			this.createField({ fieldname: 'status', label: 'Status', fieldtype: 'Data' })
		];

		return {
			name: config.name,
			module: config.module,
			is_virtual: true,
			fields: [...fields, ...(config.fields?.map(this.createField) || [])],
			permissions: config.permissions?.map(this.createPermission) || [this.createPermission({ role: 'System Manager' })]
		};
	}

	/**
	 * Create a field from partial configuration
	 */
	private static createField(config: Partial<DocField>): DocField {
		return {
			fieldname: config.fieldname || 'field',
			label: config.label || 'Field',
			fieldtype: config.fieldtype || 'Data',
			options: config.options,
			required: config.required || false,
			unique: config.unique || false,
			default: config.default,
			length: config.length,
			precision: config.precision,
			hidden: config.hidden || false,
			read_only: config.read_only || false,
			indexed: config.indexed || false,
			description: config.description,
			comment: config.comment,
			order: config.order,
			in_list_view: config.in_list_view || false,
			in_standard_filter: config.in_standard_filter || false,
			in_global_search: config.in_global_search || false,
			print_hide: config.print_hide || false,
			export_hide: config.export_hide || false,
			import_hide: config.import_hide || false,
			report_hide: config.report_hide || false,
			permlevel: config.permlevel || 0,
			depends_on: config.depends_on,
			label_depends_on: config.label_depends_on,
			mandatory_depends_on: config.mandatory_depends_on,
			read_only_depends_on: config.read_only_depends_on,
			hidden_depends_on: config.hidden_depends_on,
			validate: config.validate,
			change: config.change,
			filters: config.filters,
			fetch_from: config.fetch_from,
			fetch_if_empty: config.fetch_if_empty || false,
			allow_in_quick_entry: config.allow_in_quick_entry || false,
			translatable: config.translatable || false,
			no_copy: config.no_copy || false,
			remember_last_selected: config.remember_last_selected || false,
			bold: config.bold || false,
			deprecated: config.deprecated || false,
			precision_based_on: config.precision_based_on,
			width: config.width,
			columns: config.columns,
			child_doctype: config.child_doctype,
			image_field: config.image_field,
			search_index: config.search_index || false,
			email_trigger: config.email_trigger || false,
			timeline: config.timeline || false,
			track_seen: config.track_seen || false,
			track_visits: config.track_visits || false,
			old_fieldname: config.old_fieldname,
			unique_across_doctypes: config.unique_across_doctypes || false,
			ignore_user_permissions: config.ignore_user_permissions || false,
			ignore_xss_filtered: config.ignore_xss_filtered || false,
			allow_on_submit: config.allow_on_submit || false,
			collapsible: config.collapsible || false,
			collapsible_depends_on: config.collapsible_depends_on,
			fetch_to_include: config.fetch_to_include,
			set_user_permissions: config.set_user_permissions || false,
			ignore_strict_user_permissions: config.ignore_strict_user_permissions || false,
			table_fieldname: config.table_fieldname,
			real_fieldname: config.real_fieldname,
			openapi_format: config.openapi_format,
			openapi_pattern: config.openapi_pattern,
			openapi_minimum: config.openapi_minimum,
			openapi_maximum: config.openapi_maximum,
			openapi_min_length: config.openapi_min_length,
			openapi_max_length: config.openapi_max_length,
			openapi_example: config.openapi_example,
			openapi_examples: config.openapi_examples,
			openapi_deprecated: config.openapi_deprecated || false,
			openapi_nullable: config.openapi_nullable || false,
			openapi_write_only: config.openapi_write_only || false,
			openapi_read_only: config.openapi_read_only || false,
			openapi_schema: config.openapi_schema
		};
	}

	/**
	 * Create a permission from partial configuration
	 */
	private static createPermission(config: Partial<DocPerm>): DocPerm {
		return {
			role: config.role || 'System Manager',
			read: config.read !== undefined ? config.read : true,
			write: config.write !== undefined ? config.write : true,
			create: config.create !== undefined ? config.create : true,
			delete: config.delete !== undefined ? config.delete : true,
			submit: config.submit || false,
			cancel: config.cancel || false,
			amend: config.amend || false,
			report: config.report || false,
			export: config.export || false,
			import: config.import || false,
			share: config.share || false,
			print: config.print || false,
			email: config.email || false,
			select: config.select || false,
			permlevel: config.permlevel || 0,
			if_owner: config.if_owner || false,
			apply_to_all: config.apply_to_all !== undefined ? config.apply_to_all : true,
			condition: config.condition,
			description: config.description
		};
	}

	/**
	 * Create an index from partial configuration
	 */
	private static createIndex(config: Partial<DocIndex>): DocIndex {
		return {
			name: config.name || 'idx_default',
			columns: config.columns || [],
			unique: config.unique || false,
			type: config.type,
			where: config.where,
			child_table: config.child_table
		};
	}
}

/**
 * Predefined test DocTypes
 */
export const TestDocTypes = {
	/**
	 * Simple user DocType
	 */
	user: DocTypeTestFactory.createComprehensiveDocType({
		name: 'User',
		module: 'Core',
		isSubmittable: false
	}),

	/**
	 * Simple document DocType
	 */
	document: DocTypeTestFactory.createComprehensiveDocType({
		name: 'Document',
		module: 'Documents',
		isSubmittable: true
	}),

	/**
	 * Child table DocType
	 */
	documentItem: DocTypeTestFactory.createChildTableDocType({
		name: 'Document Item',
		module: 'Documents'
	}),

	/**
	 * Single document DocType
	 */
	systemSettings: DocTypeTestFactory.createSingleDocType({
		name: 'System Settings',
		module: 'Core'
	}),

	/**
	 * Virtual DocType
	 */
	systemInfo: DocTypeTestFactory.createVirtualDocType({
		name: 'System Info',
		module: 'Core'
	}),

	/**
	 * Minimal DocType
	 */
	minimal: DocTypeTestFactory.createMinimalDocType({
		name: 'Minimal',
		module: 'Test'
	})
};

/**
 * Invalid DocTypes for testing validation
 */
export const InvalidDocTypes = {
	/**
	 * DocType with empty name
	 */
	emptyName: {
		name: '',
		module: 'Test',
		fields: [],
		permissions: []
	} as DocType,

	/**
	 * DocType with duplicate field names
	 */
	duplicateFields: {
		name: 'Test',
		module: 'Test',
		fields: [
			{ fieldname: 'name', label: 'Name', fieldtype: 'Data' },
			{ fieldname: 'name', label: 'Another Name', fieldtype: 'Data' }
		],
		permissions: []
	} as DocType,

	/**
	 * DocType with invalid field type
	 */
	invalidFieldType: {
		name: 'Test',
		module: 'Test',
		fields: [
			{ fieldname: 'name', label: 'Name', fieldtype: 'InvalidType' as any }
		],
		permissions: []
	} as DocType,

	/**
	 * DocType with Link field missing options
	 */
	linkWithoutOptions: {
		name: 'Test',
		module: 'Test',
		fields: [
			{ fieldname: 'link_field', label: 'Link Field', fieldtype: 'Link' }
		],
		permissions: []
	} as DocType,

	/**
	 * DocType with Table field missing options
	 */
	tableWithoutOptions: {
		name: 'Test',
		module: 'Test',
		fields: [
			{ fieldname: 'table_field', label: 'Table Field', fieldtype: 'Table' }
		],
		permissions: []
	} as DocType
};

/**
 * DocType test helper class
 */
export class DocTypeTestHelper {
	private doctypes: DocType[] = [];

	/**
	 * Register a DocType for cleanup
	 */
	public registerDocType(doctype: DocType): void {
		this.doctypes.push(doctype);
	}

	/**
	 * Create and register a DocType
	 */
	public createDocType(config: TestDocTypeConfig): DocType {
		const doctype = DocTypeTestFactory.createComprehensiveDocType(config);
		this.registerDocType(doctype);
		return doctype;
	}

	/**
	 * Get all registered DocTypes
	 */
	public getDocTypes(): DocType[] {
		return [...this.doctypes];
	}

	/**
	 * Clear all registered DocTypes
	 */
	public clear(): void {
		this.doctypes = [];
	}

	/**
	 * Find a DocType by name
	 */
	public findDocType(name: string): DocType | undefined {
		return this.doctypes.find(dt => dt.name === name);
	}

	/**
	 * Get DocType names
	 */
	public getDocTypeNames(): string[] {
		return this.doctypes.map(dt => dt.name);
	}

	/**
	 * Get DocTypes by module
	 */
	public getDocTypesByModule(module: string): DocType[] {
		return this.doctypes.filter(dt => dt.module === module);
	}

	/**
	 * Get child table DocTypes
	 */
	public getChildTableDocTypes(): DocType[] {
		return this.doctypes.filter(dt => dt.istable);
	}

	/**
	 * Get single document DocTypes
	 */
	public getSingleDocTypes(): DocType[] {
		return this.doctypes.filter(dt => dt.issingle);
	}

	/**
	 * Get virtual DocTypes
	 */
	public getVirtualDocTypes(): DocType[] {
		return this.doctypes.filter(dt => dt.is_virtual);
	}

	/**
	 * Get submittable DocTypes
	 */
	public getSubmittableDocTypes(): DocType[] {
		return this.doctypes.filter(dt => dt.is_submittable);
	}
}