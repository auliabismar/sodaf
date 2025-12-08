/**
 * DocTypeMeta Class - Runtime Access to DocType Definitions
 * 
 * This module implements the DocTypeMeta class which provides convenient runtime
 * access to DocType definitions with efficient field querying capabilities.
 */

import type { DocType, DocField, FieldType } from './types';
import { DocTypeError } from './errors';
import { CustomFieldManager } from '../custom';

/**
 * DocTypeMeta class for accessing DocType definitions at runtime
 */
export class DocTypeMeta {
	private readonly doctype: DocType;
	private readonly fieldIndex: Map<string, DocField>;
	private readonly fieldsByType: Map<FieldType, DocField[]>;
	private readonly computedFields: Map<string, any>;
	private readonly customFieldManager: CustomFieldManager;
	private readonly includeCustomFields: boolean;

	/**
	 * Create a new DocTypeMeta instance
	 * @param doctype DocType definition to wrap
	 */
	constructor(doctype: DocType, includeCustomFields: boolean = true) {
		if (!doctype) {
			throw new DocTypeError('DocType cannot be null or undefined');
		}

		this.doctype = doctype;
		this.fieldIndex = new Map();
		this.fieldsByType = new Map();
		this.computedFields = new Map();
		this.customFieldManager = CustomFieldManager.getInstance();
		this.includeCustomFields = includeCustomFields;

		// Build indexes for efficient field access
		this.buildIndexes();
	}

	/**
	 * Get a specific field by name
	 * @param fieldname Name of the field to retrieve
	 * @returns DocField or null if not found
	 */
	public get_field(fieldname: string): DocField | null {
		return this.fieldIndex.get(fieldname) || null;
	}

	/**
	 * Check if a field exists in this DocType
	 * @param fieldname Name of the field to check
	 * @returns True if field exists, false otherwise
	 */
	public has_field(fieldname: string): boolean {
		return this.fieldIndex.has(fieldname);
	}

	/**
	 * Get all Link and Dynamic Link fields
	 * @returns Array of Link-type fields
	 */
	public get_link_fields(): DocField[] {
		const linkFields: DocField[] = [];
		const linkTypes: FieldType[] = ['Link', 'Dynamic Link'];

		for (const type of linkTypes) {
			const fields = this.fieldsByType.get(type) || [];
			linkFields.push(...fields);
		}

		return linkFields;
	}

	/**
	 * Get all Table fields
	 * @returns Array of Table-type fields
	 */
	public get_table_fields(): DocField[] {
		return this.fieldsByType.get('Table') || [];
	}

	/**
	 * Get all Select fields
	 * @returns Array of Select-type fields
	 */
	public get_select_fields(): DocField[] {
		return this.fieldsByType.get('Select') || [];
	}

	/**
	 * Get valid database column names (excludes layout fields)
	 * @returns Array of column names
	 */
	public get_valid_columns(): string[] {
		if (this.computedFields.has('valid_columns')) {
			return this.computedFields.get('valid_columns');
		}

		const validColumns: string[] = [];
		const layoutFieldTypes: FieldType[] = [
			'Section Break', 'Column Break', 'Tab Break', 'Fold', 'Button', 'HTML', 'Image'
		];

		for (const field of this.doctype.fields) {
			if (!layoutFieldTypes.includes(field.fieldtype)) {
				validColumns.push(field.fieldname);
			}
		}

		this.computedFields.set('valid_columns', validColumns);
		return validColumns;
	}

	/**
	 * Get fields by type
	 * @param fieldtype Type of fields to retrieve
	 * @returns Array of fields of specified type
	 */
	public get_fields_by_type(fieldtype: FieldType): DocField[] {
		return this.fieldsByType.get(fieldtype) || [];
	}

	/**
	 * Get required fields
	 * @returns Array of required fields
	 */
	public get_required_fields(): DocField[] {
		const requiredFields: DocField[] = [];
		for (const field of this.doctype.fields) {
			if (field.required) {
				requiredFields.push(field);
			}
		}
		return requiredFields;
	}

	/**
	 * Get unique fields
	 * @returns Array of unique fields
	 */
	public get_unique_fields(): DocField[] {
		const uniqueFields: DocField[] = [];
		for (const field of this.doctype.fields) {
			if (field.unique) {
				uniqueFields.push(field);
			}
		}
		return uniqueFields;
	}

	/**
	 * Check if DocType is submittable
	 * @returns True if submittable, false otherwise
	 */
	public is_submittable(): boolean {
		return this.doctype.is_submittable || false;
	}

	/**
	 * Check if DocType is a single document type
	 * @returns True if single, false otherwise
	 */
	public is_single(): boolean {
		return this.doctype.issingle || false;
	}

	/**
	 * Check if DocType is a child table
	 * @returns True if table, false otherwise
	 */
	public is_table(): boolean {
		return this.doctype.istable || false;
	}

	/**
	 * Check if DocType is a tree structure
	 * @returns True if tree, false otherwise
	 */
	public is_tree(): boolean {
		return this.doctype.is_tree || false;
	}

	/**
	 * Check if DocType is virtual (no database table)
	 * @returns True if virtual, false otherwise
	 */
	public is_virtual(): boolean {
		return this.doctype.is_virtual || false;
	}

	/**
	 * Get search fields for global search
	 * @returns Array of search field names
	 */
	public get_search_fields(): string[] {
		if (this.doctype.search_fields) {
			return this.doctype.search_fields.split(',').map(s => s.trim());
		}
		return [];
	}

	/**
	 * Get title field for display
	 * @returns Title field name or null
	 */
	public get_title_field(): string | null {
		return this.doctype.title_field || null;
	}

	/**
	 * Get image field for display
	 * @returns Image field name or null
	 */
	public get_image_field(): string | null {
		return this.doctype.image_field || null;
	}

	/**
	 * Get field label
	 * @param fieldname Name of the field
	 * @returns Field label or null if not found
	 */
	public get_label(fieldname: string): string | null {
		const field = this.get_field(fieldname);
		return field ? field.label : null;
	}

	/**
	 * Get field options (for Select, Link, etc.)
	 * @param fieldname Name of the field
	 * @returns Field options or null if not found
	 */
	public get_options(fieldname: string): string | null {
		const field = this.get_field(fieldname);
		return field ? (field.options || null) : null;
	}

	/**
	 * Get the underlying DocType definition
	 * @returns The DocType definition
	 */
	public get_doctype(): DocType {
		return this.doctype;
	}

	/**
	 * Get all fields in the DocType
	 * @returns Array of all fields
	 */
	public get_all_fields(): DocField[] {
		return [...this.doctype.fields];
	}

	/**
	 * Build indexes for efficient field access
	 */
	private buildIndexes(): void {
		// Clear existing indexes
		this.fieldIndex.clear();
		this.fieldsByType.clear();

		// Build field name index and type index
		for (const field of this.doctype.fields) {
			// Field name index
			this.fieldIndex.set(field.fieldname, field);

			// Field type index
			if (!this.fieldsByType.has(field.fieldtype)) {
				this.fieldsByType.set(field.fieldtype, []);
			}
			this.fieldsByType.get(field.fieldtype)!.push(field);
		}
	}

	/**
	 * Get all fields including custom fields if enabled
	 * @returns Array of all fields including custom fields
	 */
	private async getAllFieldsIncludingCustom(): Promise<DocField[]> {
		if (!this.includeCustomFields) {
			return [...this.doctype.fields];
		}

		try {
			// Get custom fields for this DocType
			const customFields = await this.customFieldManager.getCustomFields(this.doctype.name);
			
			// Merge standard fields with custom fields
			return [...this.doctype.fields, ...customFields];
		} catch (error) {
			// If custom field manager fails, return standard fields only
			console.warn('Failed to get custom fields:', error);
			return [...this.doctype.fields];
		}
	}

	/**
	 * Rebuild indexes with custom fields
	 */
	private async rebuildIndexesWithCustomFields(): Promise<void> {
		// Get all fields including custom fields
		const allFields = await this.getAllFieldsIncludingCustom();

		// Clear existing indexes
		this.fieldIndex.clear();
		this.fieldsByType.clear();

		// Build field name index and type index
		for (const field of allFields) {
			// Field name index
			this.fieldIndex.set(field.fieldname, field);

			// Field type index
			if (!this.fieldsByType.has(field.fieldtype)) {
				this.fieldsByType.set(field.fieldtype, []);
			}
			this.fieldsByType.get(field.fieldtype)!.push(field);
		}
	}

	/**
	 * Refresh custom fields and rebuild indexes
	 */
	public async refreshCustomFields(): Promise<void> {
		if (this.includeCustomFields) {
			await this.rebuildIndexesWithCustomFields();
			// Clear computed fields cache
			this.computedFields.clear();
		}
	}

	/**
	 * Get custom fields for this DocType
	 * @returns Array of custom fields
	 */
	public async getCustomFields(): Promise<any[]> {
		if (!this.includeCustomFields) {
			return [];
		}

		try {
			return await this.customFieldManager.getCustomFields(this.doctype.name);
		} catch (error) {
			console.warn('Failed to get custom fields:', error);
			return [];
		}
	}

	/**
	 * Check if a field is a custom field
	 * @param fieldname Name of the field to check
	 * @returns True if field is a custom field, false otherwise
	 */
	public async isCustomField(fieldname: string): Promise<boolean> {
		if (!this.includeCustomFields) {
			return false;
		}

		try {
			const customField = await this.customFieldManager.getCustomField(this.doctype.name, fieldname);
			return customField !== null;
		} catch (error) {
			console.warn('Failed to check if field is custom:', error);
			return false;
		}
	}
}