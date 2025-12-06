/**
 * Schema Types and Field Types
 * 
 * This module defines TypeScript interfaces for DocField, field types, and schema management.
 */

/**
 * Field type union - Core field types
 */
export type FieldType = 
	// Basic data types
	| 'Data'           // Text data
	| 'Text'           // Long text
	| 'Int'            // Integer number
	| 'Float'          // Floating point number
	| 'Check'          // Boolean checkbox
	| 'Date'           // Date field
	| 'Datetime'        // Date and time field
	| 'Time'           // Time field
	| 'Duration'       // Duration field
	// Link types
	| 'Link'           // Link to another document
	| 'Dynamic Link'   // Dynamic link based on condition
	| 'Table'          // Child table
	// File types
	| 'Attach'         // File attachment
	| 'Attach Image'  // Image attachment
	| 'Signature'      // Digital signature
	// Layout types
	| 'Section Break'  // Visual section break
	| 'Column Break'  // Visual column break
	| 'Tab Break'     // Visual tab break
	// Special types
	| 'HTML'          // HTML content
	| 'Code'          // Code editor
	| 'Read Only'     // Read-only field
	| 'Password'       // Password field
	| 'Color'         // Color picker
	| 'Select'        // Select dropdown
	| 'Rating'         // Rating field
	| 'Percent'        // Percentage field
	| 'Currency'       // Currency field
	| 'Small Text'     // Small text field
	| 'Long Text'      // Long text field
	| 'Text Editor'    // Rich text editor
	| 'Markdown'       // Markdown editor
	| 'JSON'          // JSON field
	| 'Geolocation'    // Geolocation field
	| 'Barcode'        // Barcode field
	| 'Button'        // Button field
	| 'Image'         // Image field (alias for Attach Image)
	| 'File'          // File field (alias for Attach);

/**
 * Standard columns that exist in every document
 */
export const STANDARD_COLUMNS = [
	'name',          // Document name/identifier
	'owner',         // Document owner
	'creation',      // Creation timestamp
	'modified',      // Last modified timestamp
	'modified_by',   // Last modified by user
	'docstatus',     // Document status (0=Saved, 1=Submitted, 2=Cancelled)
	'idx',           // Index
	'parent',        // Parent document
	'parentfield',   // Parent field
	'parenttype'     // Parent document type
] as const;

/**
 * Document field interface
 */
export interface DocField {
	fieldname: string;           // Field name in database
	fieldtype: FieldType;        // Field type
	label?: string;             // Display label
	options?: string;           // Options for select fields
	reqd?: boolean;            // Required field
	unique?: boolean;          // Unique constraint
	hidden?: boolean;          // Hidden field
	read_only?: boolean;        // Read-only field
	length?: number;           // Maximum length
	precision?: number;        // Decimal precision for numbers
	default?: any;             // Default value
	description?: string;       // Field description
	depends_on?: string;       // Dependency field
	mandatory_depends_on?: string; // Mandatory dependency
	allow_in_quick_entry?: boolean; // Show in quick entry
	fetch_from?: string;       // Fetch value from another field
	fetch_if_empty?: boolean;  // Only fetch if empty
	ignore_user_permissions?: boolean; // Ignore permissions
	ignore_xss_filter?: boolean; // Ignore XSS filtering
	no_copy?: boolean;         // Don't copy on duplicate
	print_hide?: boolean;      // Hide in print
	report_hide?: boolean;     // Hide in reports
	permlevel?: number;        // Permission level
	columns?: number;          // Number of columns for layout
	collapsible?: boolean;     // Collapsible section
	collapsed?: boolean;       // Default collapsed state
}

/**
 * Document index interface
 */
export interface DocIndex {
	name: string;              // Index name
	fields: string[];          // Fields in index
	unique?: boolean;          // Unique index
	partial?: string;          // Partial index condition
}

/**
 * Document schema interface
 */
export interface DocSchema {
	name: string;              // Schema name
	fields: DocField[];        // Field definitions
	indexes?: DocIndex[];      // Index definitions
	permissions?: DocPermission[]; // Permission definitions
}

/**
 * Document permission interface
 */
export interface DocPermission {
	role: string;              // Role name
	read?: boolean;            // Read permission
	write?: boolean;           // Write permission
	create?: boolean;          // Create permission
	delete?: boolean;          // Delete permission
	submit?: boolean;          // Submit permission
	cancel?: boolean;          // Cancel permission
	amend?: boolean;           // Amend permission
	report?: boolean;          // Report permission
	export?: boolean;          // Export permission
	print?: boolean;           // Print permission
	email?: boolean;           // Email permission
	share?: boolean;           // Share permission
	import?: boolean;          // Import permission
	set_user_permissions?: boolean; // Set user permissions
	permlevel?: number;        // Permission level
	if_owner?: boolean;        // Only if owner
	apply_to_all_doctypes?: boolean; // Apply to all document types
}

/**
 * Field constraint interface
 */
export interface FieldConstraint {
	name: string;              // Constraint name
	type: 'unique' | 'check' | 'foreign_key' | 'primary_key'; // Constraint type
	fields: string[];          // Fields in constraint
	condition?: string;        // Condition for check constraints
	references?: {             // Foreign key reference
		table: string;          // Referenced table
		field: string;          // Referenced field
		on_delete?: 'cascade' | 'restrict' | 'set_null' | 'set_default'; // Delete action
		on_update?: 'cascade' | 'restrict' | 'set_null' | 'set_default'; // Update action
	};
}

/**
 * Field display options interface
 */
export interface FieldDisplayOptions {
	width?: string;            // Field width (CSS)
	height?: string;           // Field height (CSS)
	align?: 'left' | 'center' | 'right'; // Text alignment
	bold?: boolean;           // Bold text
	italic?: boolean;         // Italic text
	underline?: boolean;       // Underline text
	color?: string;            // Text color
	background_color?: string; // Background color
	border?: string;           // Border style
	padding?: string;         // Padding
	margin?: string;          // Margin
	font_size?: string;        // Font size
	font_family?: string;     // Font family
}

/**
 * Field condition interface
 */
export interface FieldCondition {
	field: string;             // Field name
	operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'not in' | 'like' | 'not like'; // Operator
	value: any;               // Condition value
	logical_operator?: 'and' | 'or'; // Logical operator with next condition
}

/**
 * Field validation interface
 */
export interface FieldValidation {
	required?: boolean;        // Required field
	min_length?: number;       // Minimum length
	max_length?: number;       // Maximum length
	min_value?: number;       // Minimum value
	max_value?: number;       // Maximum value
	pattern?: string;         // Regex pattern
	custom_validation?: string; // Custom validation function
	error_message?: string;   // Custom error message
}

/**
 * Field options interface for select fields
 */
export interface FieldOption {
	label: string;             // Option label
	value: any;               // Option value
	description?: string;      // Option description
	disabled?: boolean;        // Disabled option
	selected?: boolean;        // Selected by default
	icon?: string;             // Option icon
	color?: string;            // Option color
}

/**
 * Schema validation result interface
 */
export interface SchemaValidationResult {
	valid: boolean;            // Validation status
	errors: ValidationError[];  // Validation errors
	warnings: ValidationWarning[]; // Validation warnings
}

/**
 * Validation error interface
 */
export interface ValidationError {
	field: string;             // Field name
	message: string;           // Error message
	code: string;             // Error code
	severity: 'error' | 'warning' | 'info'; // Error severity
}

/**
 * Validation warning interface
 */
export interface ValidationWarning {
	field: string;             // Field name
	message: string;           // Warning message
	code: string;             // Warning code
	severity: 'error' | 'warning' | 'info'; // Warning severity
}

/**
 * Schema migration interface
 */
export interface SchemaMigration {
	version: string;           // Migration version
	description: string;       // Migration description
	up: string[];             // Up migration SQL
	down: string[];           // Down migration SQL
	applied_at?: Date;        // Applied timestamp
	rollback?: boolean;        // Can be rolled back
}

/**
 * Schema diff interface
 */
export interface SchemaDiff {
	type: 'add' | 'remove' | 'modify' | 'rename'; // Diff type
	table: string;             // Table name
	field?: string;            // Field name (for field changes)
	old_value?: any;           // Old value (for modifications)
	new_value?: any;           // New value (for modifications)
	sql?: string;              // SQL to apply the change
}

/**
 * Schema export options interface
 */
export interface SchemaExportOptions {
	include_data?: boolean;     // Include data in export
	include_permissions?: boolean; // Include permissions
	include_indexes?: boolean;   // Include indexes
	format?: 'json' | 'sql' | 'yaml'; // Export format
	pretty_print?: boolean;     // Pretty print output
	compress?: boolean;         // Compress output
}

/**
 * Schema import options interface
 */
export interface SchemaImportOptions {
	overwrite?: boolean;        // Overwrite existing schema
	skip_validation?: boolean;  // Skip validation
	dry_run?: boolean;         // Dry run (don't apply)
	backup?: boolean;           // Backup before import
	migrate?: boolean;          // Run migrations
}

/**
 * Type guard to check if a value is a valid FieldType
 */
export function isFieldType(value: string): value is FieldType {
	const validTypes: FieldType[] = [
		'Data', 'Text', 'Int', 'Float', 'Check', 'Date', 'Datetime', 'Time', 'Duration',
		'Link', 'Dynamic Link', 'Table', 'Attach', 'Attach Image', 'Signature',
		'Section Break', 'Column Break', 'Tab Break', 'HTML', 'Code', 'Read Only',
		'Password', 'Color', 'Select', 'Rating', 'Percent', 'Currency', 'Small Text',
		'Long Text', 'Text Editor', 'Markdown', 'JSON', 'Geolocation', 'Barcode',
		'Button', 'Image', 'File'
	];
	return validTypes.includes(value as FieldType);
}

/**
 * Type guard to check if a field is a standard column
 */
export function isStandardColumn(fieldname: string): boolean {
	return STANDARD_COLUMNS.includes(fieldname as any);
}

/**
 * Get field type category
 */
export function getFieldTypeCategory(fieldtype: FieldType): string {
	if (['Data', 'Text', 'Small Text', 'Long Text', 'Text Editor', 'Markdown'].includes(fieldtype)) {
		return 'text';
	}
	if (['Int', 'Float', 'Currency', 'Percent'].includes(fieldtype)) {
		return 'number';
	}
	if (['Check'].includes(fieldtype)) {
		return 'boolean';
	}
	if (['Date', 'Datetime', 'Time', 'Duration'].includes(fieldtype)) {
		return 'datetime';
	}
	if (['Link', 'Dynamic Link'].includes(fieldtype)) {
		return 'link';
	}
	if (['Table'].includes(fieldtype)) {
		return 'table';
	}
	if (['Attach', 'Attach Image', 'Signature', 'Image', 'File'].includes(fieldtype)) {
		return 'file';
	}
	if (['Section Break', 'Column Break', 'Tab Break'].includes(fieldtype)) {
		return 'layout';
	}
	if (['HTML', 'Code', 'Read Only', 'Password', 'Color', 'Select', 'Rating', 'JSON',
		 'Geolocation', 'Barcode', 'Button'].includes(fieldtype)) {
		return 'special';
	}
	return 'unknown';
}