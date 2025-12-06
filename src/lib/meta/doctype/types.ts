/**
 * DocType Types and Interfaces
 * 
 * This file defines comprehensive TypeScript interfaces for DocType, DocField, DocPerm,
 * and related structures for the metadata system.
 */

/**
 * Union type of all supported field types in DocType
 */
export type FieldType =
	| 'Data'           // Single line text
	| 'Long Text'      // Multi-line text
	| 'Small Text'     // Small text area
	| 'Text Editor'    // Rich text editor
	| 'Code'           // Code editor with syntax highlighting
	| 'Markdown Editor' // Markdown editor
	| 'HTML Editor'    // HTML editor
	| 'Int'            // Integer number
	| 'Float'          // Decimal number
	| 'Currency'       // Currency with formatting
	| 'Percent'        // Percentage (0-100)
	| 'Check'          // Checkbox
	| 'Select'         // Dropdown selection
	| 'Link'           // Link to another DocType
	| 'Dynamic Link'   // Dynamic link based on another field
	| 'Table'          // Child table
	| 'Table MultiSelect' // Multi-select table
	| 'Date'           // Date picker
	| 'Datetime'       // Date and time picker
	| 'Time'           // Time picker
	| 'Duration'       // Duration input
	| 'Geolocation'    // GPS coordinates
	| 'Attach'         // File attachment
	| 'Attach Image'   // Image attachment with preview
	| 'Signature'      // Digital signature
	| 'Color'          // Color picker
	| 'Rating'         // Star rating
	| 'Password'       // Password field
	| 'Read Only'      // Read-only display
	| 'Button'         // Action button
	| 'Image'          // Image display
	| 'HTML'           // HTML content
	| 'Section Break'  // Visual section separator
	| 'Column Break'   // Column separator
	| 'Tab Break'      // Tab separator
	| 'Fold'           // Collapsible section;

/**
 * DocField interface representing a field in a DocType
 */
export interface DocField {
	/** Field name (unique within DocType) */
	fieldname: string;
	
	/** Field label for display */
	label: string;
	
	/** Field type from FieldType union */
	fieldtype: FieldType;
	
	/** Field options (for Select, Link, etc.) */
	options?: string;
	
	/** Whether field is required */
	required?: boolean;
	
	/** Whether field value must be unique */
	unique?: boolean;
	
	/** Default value for field */
	default?: any;
	
	/** Maximum length for text fields */
	length?: number;
	
	/** Number of decimal places for numeric fields */
	precision?: number;
	
	/** Whether field is hidden */
	hidden?: boolean;
	
	/** Whether field is read-only */
	read_only?: boolean;
	
	/** Whether field is indexed */
	indexed?: boolean;
	
	/** Field description for help text */
	description?: string;
	
	/** Field comment for documentation */
	comment?: string;
	
	/** Field order in form */
	order?: number;
	
	/** Whether field appears in list view */
	in_list_view?: boolean;
	
	/** Whether field appears in standard filter */
	in_standard_filter?: boolean;
	
	/** Whether field appears in global search */
	in_global_search?: boolean;
	
	/** Whether field is printed */
	print_hide?: boolean;
	
	/** Whether field is exported */
	export_hide?: boolean;
	
	/** Whether field is imported */
	import_hide?: boolean;
	
	/** Whether field is reportable */
	report_hide?: boolean;
	
	/** Permission level for this field (0-9) */
	permlevel?: number;
	
	/** Field depends on another field */
	depends_on?: string;
	
	/** Field label depends on another field */
	label_depends_on?: string;
	
	/** Field is mandatory depends on condition */
	mandatory_depends_on?: string;
	
	/** Field is read-only depends on condition */
	read_only_depends_on?: string;
	
	/** Field is hidden depends on condition */
	hidden_depends_on?: string;
	
	/** Field validation as JavaScript expression */
	validate?: string;
	
	/** Field change event handler */
	change?: string;
	
	/** Field options filter for Link fields */
	filters?: string;
	
	/** Field fetch from for Link fields */
	fetch_from?: string;
	
	/** Field fetch if empty for Link fields */
	fetch_if_empty?: boolean;
	
	/** Field allow in quick entry */
	allow_in_quick_entry?: boolean;
	
	/** Field is translatable */
	translatable?: boolean;
	
	/** Field is no copy */
	no_copy?: boolean;
	
	/** Field is remember last */
	remember_last_selected?: boolean;
	
	/** Field is bold */
	bold?: boolean;
	
	/** Field is deprecated */
	deprecated?: boolean;
	
	/** Field precision for currency fields */
	precision_based_on?: string;
	
	/** Field width percentage */
	width?: string;
	
	/** Field columns for Table fields */
	columns?: string;
	
	/** Field child table name */
	child_doctype?: string;
	
	/** Field image field for Image types */
	image_field?: string;
	
	/** Field is search index */
	search_index?: boolean;
	
	/** Field is email trigger */
	email_trigger?: boolean;
	
	/** Field is timeline */
	timeline?: boolean;
	
	/** Field is track seen */
	track_seen?: boolean;
	
	/** Field is track visits */
	track_visits?: boolean;
	
	/** Field old field name for migration */
	old_fieldname?: string;
	
	/** Field is unique across doctypes */
	unique_across_doctypes?: boolean;
	
	/** Field ignore user permissions */
	ignore_user_permissions?: boolean;
	
	/** Field ignore xss filtered */
	ignore_xss_filtered?: boolean;
	
	/** Field allow on submit */
	allow_on_submit?: boolean;
	
	/** Field is collapsible */
	collapsible?: boolean;
	
	/** Field is collapsible depends on */
	collapsible_depends_on?: string;
	
	/** Field fetch to include */
	fetch_to_include?: string;
	
	/** Field set user permissions */
	set_user_permissions?: boolean;
	
	/** Field ignore strict user permissions */
	ignore_strict_user_permissions?: boolean;
	
	/** Field table fieldname */
	table_fieldname?: string;
	
	/** Field real fieldname */
	real_fieldname?: string;
}

/**
 * DocPerm interface representing permissions for a DocType
 */
export interface DocPerm {
	/** Role name for this permission */
	role: string;
	
	/** Permission to read documents */
	read?: boolean;
	
	/** Permission to write/update documents */
	write?: boolean;
	
	/** Permission to create documents */
	create?: boolean;
	
	/** Permission to delete documents */
	delete?: boolean;
	
	/** Permission to submit documents */
	submit?: boolean;
	
	/** Permission to cancel documents */
	cancel?: boolean;
	
	/** Permission to amend documents */
	amend?: boolean;
	
	/** Permission to generate reports */
	report?: boolean;
	
	/** Permission to export documents */
	export?: boolean;
	
	/** Permission to import documents */
	import?: boolean;
	
	/** Permission to share documents */
	share?: boolean;
	
	/** Permission to print documents */
	print?: boolean;
	
	/** Permission to email documents */
	email?: boolean;
	
	/** Permission to select documents */
	select?: boolean;
	
	/** Permission level (0-9) */
	permlevel?: number;
	
	/** Whether permission applies only to document owner */
	if_owner?: boolean;
	
	/** Whether permission applies to all documents */
	apply_to_all?: boolean;
	
	/** Permission condition as JavaScript expression */
	condition?: string;
	
	/** Permission description */
	description?: string;
}

/**
 * DocIndex interface representing database indexes for a DocType
 */
export interface DocIndex {
	/** Index name */
	name: string;
	
	/** Indexed columns */
	columns: string[];
	
	/** Whether index is unique */
	unique?: boolean;
	
	/** Index type */
	type?: string;
	
	/** Index where condition */
	where?: string;
	
	/** Index is for child table */
	child_table?: string;
}

/**
 * DocTypeAction interface representing actions for a DocType
 */
export interface DocTypeAction {
	/** Action label for display */
	label: string;
	
	/** Action type */
	action_type: 'Server Action' | 'Client Action' | 'JavaScript' | 'Page' | 'URL';
	
	/** Action name or function */
	action: string;
	
	/** Action group */
	group?: string;
	
	/** Whether action is hidden */
	hidden?: boolean;
	
	/** Action condition as JavaScript expression */
	condition?: string;
	
	/** Action order */
	order?: number;
	
	/** Action is standard */
	is_standard?: boolean;
	
	/** Action is for child table */
	child_table?: string;
}

/**
 * DocTypeLink interface representing links for a DocType
 */
export interface DocTypeLink {
	/** Link group */
	group?: string;
	
	/** Linked DocType */
	link_doctype: string;
	
	/** Link field name */
	link_fieldname: string;
	
	/** Parent DocType */
	parent_doctype?: string;
	
	/** Link label */
	label?: string;
	
	/** Link is hidden */
	hidden?: boolean;
	
	/** Link condition */
	condition?: string;
	
	/** Link order */
	order?: number;
}

/**
 * DocType interface representing a document type definition
 */
export interface DocType {
	/** DocType name (unique) */
	name: string;
	
	/** Module name */
	module: string;
	
	/** Whether this is a single document type (not table) */
	issingle?: boolean;
	
	/** Whether this is a child table */
	istable?: boolean;
	
	/** Whether this document type is submittable */
	is_submittable?: boolean;
	
	/** Whether this document type is a tree structure */
	is_tree?: boolean;
	
	/** Whether this document type is virtual (no database table) */
	is_virtual?: boolean;
	
	/** Auto-naming rule for documents */
	autoname?: string;
	
	/** Array of field definitions */
	fields: DocField[];
	
	/** Array of permission definitions */
	permissions: DocPerm[];
	
	/** Array of index definitions */
	indexes?: DocIndex[];
	
	/** Array of action definitions */
	actions?: DocTypeAction[];
	
	/** Array of link definitions */
	links?: DocTypeLink[];
	
	/** Document naming series */
	naming_series?: string;
	
	/** Title field for display */
	title_field?: string;
	
	/** Image field for display */
	image_field?: string;
	
	/** Search fields for global search */
	search_fields?: string;
	
	/** Keyword fields for search */
	keyword_fields?: string;
	
	/** Default sort order */
	default_sort_order?: string;
	
	/** Max attachments */
	max_attachments?: number;
	
	/** Track changes */
	track_changes?: boolean;
	
	/** Track seen */
	track_seen?: boolean;
	
	/** Track visits */
	track_visits?: boolean;
	
	/** Show in global search */
	show_in_global_search?: boolean;
	
	/** Allow auto repeat */
	allow_auto_repeat?: boolean;
	
	/** Allow events */
	allow_events?: boolean;
	
	/** Allow import */
	allow_import?: boolean;
	
	/** Allow rename */
	allow_rename?: boolean;
	
	/** Custom fields */
	custom_fields?: DocField[];
	
	/** Engine for document processing */
	engine?: string;
	
	/** Table name for database */
	table_name?: string;
	
	/** Subject field for emails */
	subject_field?: string;
	
	/** Sender field for emails */
	sender_field?: string;
	
	/** Email template */
	email_template?: string;
	
	/** Timeline fields */
	timeline_fields?: string;
	
	/** Grid view fields */
	grid_view_fields?: string;
	
	/** List view settings */
	list_view_settings?: Record<string, any>;
	
	/** Form view settings */
	form_view_settings?: Record<string, any>;
	
	/** Tree view settings */
	tree_view_settings?: Record<string, any>;
	
	/** Calendar view settings */
	calendar_view_settings?: Record<string, any>;
	
	/** Kanban view settings */
	kanban_view_settings?: Record<string, any>;
	
	/** Report view settings */
	report_view_settings?: Record<string, any>;
	
	/** Dashboard view settings */
	dashboard_view_settings?: Record<string, any>;
	
	/** Mobile view settings */
	mobile_view_settings?: Record<string, any>;
	
	/** Quick entry fields */
	quick_entry_fields?: string;
	
	/** Hide toolbar */
	hide_toolbar?: boolean;
	
	/** Print heading */
	print_heading?: string;
	
	/** Print format templates */
	print_format_templates?: string[];
	
	/** Email templates */
	email_templates?: string[];
	
	/** Custom scripts */
	custom_scripts?: Record<string, string>;
	
	/** Custom CSS */
	custom_css?: string;
	
	/** Custom JS */
	custom_js?: string;
	
	/** Custom HTML */
	custom_html?: string;
	
	/** Custom JSON */
	custom_json?: Record<string, any>;
	
	/** Version */
	version?: number;
	
	/** Created by */
	created_by?: string;
	
	/** Created at */
	created_at?: Date;
	
	/** Modified by */
	modified_by?: string;
	
	/** Modified at */
	modified_at?: Date;
	
	/** Is deprecated */
	is_deprecated?: boolean;
	
	/** Is standard */
	is_standard?: boolean;
	
	/** Is custom */
	is_custom?: boolean;
	
	/** Is module */
	is_module?: boolean;
	
	/** Is archived */
	is_archived?: boolean;
	
	/** Is active */
	is_active?: boolean;
	
	/** Is public */
	is_public?: boolean;
	
	/** Is private */
	is_private?: boolean;
}