/**
 * DocType JSON Parser
 *
 * Provides comprehensive parsing and serialization capabilities for DocType definitions
 * stored in JSON format, with full validation and error handling.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

import type {
	DocType,
	DocField,
	DocPerm,
	DocIndex,
	DocTypeAction,
	DocTypeLink
} from './types';

import {
	DocTypeError,
	DocTypeValidationError
} from './errors';

import type {
	ValidationResult,
	ValidationError
} from './errors';

import {
	JSONParseError,
	FileNotFoundError,
	FileIOError,
	SerializationError
} from './json-parser-errors';

import { DocTypeValidator } from './validator';

/**
 * Default values for DocType properties
 */
const DEFAULT_DOCTYPE: Partial<DocType> = {
	issingle: false,
	istable: false,
	is_submittable: false,
	is_tree: false,
	is_virtual: false,
	track_changes: true,
	track_seen: false,
	track_visits: false,
	show_in_global_search: true,
	allow_auto_repeat: false,
	allow_events: true,
	allow_import: true,
	allow_rename: true,
	max_attachments: 0,
	fields: [],
	permissions: [],
	indexes: [],
	actions: [],
	links: []
};

/**
 * Default values for DocField properties
 */
const DEFAULT_DOCFIELD: Partial<DocField> = {
	required: false,
	unique: false,
	hidden: false,
	read_only: false,
	indexed: false,
	in_list_view: false,
	in_standard_filter: false,
	in_global_search: false,
	print_hide: false,
	export_hide: false,
	import_hide: false,
	report_hide: false,
	permlevel: 0,
	allow_in_quick_entry: true,
	translatable: false,
	no_copy: false,
	remember_last_selected: false,
	bold: false,
	deprecated: false,
	search_index: false,
	email_trigger: false,
	timeline: false,
	track_seen: false,
	track_visits: false,
	unique_across_doctypes: false,
	ignore_user_permissions: false,
	ignore_xss_filtered: false,
	allow_on_submit: false,
	collapsible: false,
	set_user_permissions: false,
	ignore_strict_user_permissions: false
};

/**
 * Default values for DocPerm properties
 */
const DEFAULT_DOCPERM: Partial<DocPerm> = {
	read: true,
	write: false,
	create: false,
	delete: false,
	submit: false,
	cancel: false,
	amend: false,
	report: true,
	export: true,
	import: true,
	share: false,
	print: true,
	email: true,
	select: true,
	permlevel: 0,
	if_owner: false,
	apply_to_all: true
};

/**
 * DocType JSON Parser class
 * 
 * Provides comprehensive parsing and serialization capabilities for DocType definitions
 * stored in JSON format, with full validation and error handling.
 */
export class DocTypeJSONParser {
	/**
	 * Parse a JSON string into a DocType object
	 * 
	 * @param jsonString - Valid JSON string containing DocType definition
	 * @returns Fully validated DocType object with defaults applied
	 * @throws JSONParseError - When JSON syntax is invalid
	 * @throws DocTypeValidationError - When DocType validation fails
	 */
	public static parseDocTypeJSON(jsonString: string): DocType {
		try {
			// Step 1: Parse JSON
			const jsonData = JSON.parse(jsonString);
			
			// Step 2: Validate JSON structure
			const structureValidation = this.validateJSONStructure(jsonData);
			if (!structureValidation.valid) {
				throw new DocTypeValidationError(
					'Invalid JSON structure',
					structureValidation.errors
				);
			}
			
			// Step 3: Apply defaults
			const doctypeWithDefaults = this.applyDefaults(jsonData);
			
			// Step 4: Validate DocType
			const docTypeValidation = DocTypeValidator.validateDocType(doctypeWithDefaults);
			if (!docTypeValidation.valid) {
				throw new DocTypeValidationError(
					'DocType validation failed',
					docTypeValidation.errors
				);
			}
			
			return doctypeWithDefaults;
			
		} catch (error) {
			if (error instanceof SyntaxError) {
				// Convert native JSON error to our custom error
				throw JSONParseError.fromNativeError(error, jsonString);
			}
			
			if (error instanceof DocTypeError) {
				// Re-throw our custom errors
				throw error;
			}
			
			// Wrap unexpected errors
			throw new DocTypeError(`Unexpected error during parsing: ${(error as Error).message}`);
		}
	}

	/**
	 * Serialize a DocType object to a formatted JSON string
	 * 
	 * @param doctype - Valid DocType object to serialize
	 * @returns Formatted JSON string with proper indentation
	 * @throws SerializationError - When serialization fails
	 * @throws DocTypeValidationError - When DocType is invalid
	 */
	public static serializeDocType(doctype: DocType): string {
		try {
			// Step 1: Validate DocType
			const validation = DocTypeValidator.validateDocType(doctype);
			if (!validation.valid) {
				throw new DocTypeValidationError(
					'Cannot serialize invalid DocType',
					validation.errors
				);
			}
			
			// Step 2: Serialize with circular reference detection
			const seen = new WeakSet();
			const jsonString = JSON.stringify(doctype, (key, value) => {
				if (typeof value === 'object' && value !== null) {
					if (seen.has(value)) {
						throw SerializationError.fromCircularReference(doctype.name, key);
					}
					seen.add(value);
				}
				
				// Check for non-serializable values
				if (typeof value === 'function' || typeof value === 'symbol') {
					throw SerializationError.fromNonSerializableValue(doctype.name, key, value);
				}
				
				return value;
			}, 2);
			
			return jsonString;
			
		} catch (error) {
			if (error instanceof DocTypeError) {
				// Re-throw our custom errors
				throw error;
			}
			
			// Wrap unexpected errors
			throw new SerializationError(
				`Unexpected error during serialization: ${(error as Error).message}`,
				doctype.name,
				undefined,
				error as Error
			);
		}
	}

	/**
	 * Load and parse a DocType from a JSON file
	 * 
	 * @param filePath - Path to the JSON file containing DocType definition
	 * @returns Promise resolving to parsed DocType object
	 * @throws FileNotFoundError - When file doesn't exist
	 * @throws FileIOError - When file read/access errors occur
	 * @throws JSONParseError - When JSON content is invalid
	 * @throws DocTypeValidationError - When DocType validation fails
	 */
	public static async loadDocTypeFromFile(filePath: string): Promise<DocType> {
		try {
			// Step 1: Check file existence
			try {
				await fs.access(filePath);
			} catch (error) {
				throw new FileNotFoundError(filePath, 'file');
			}
			
			// Step 2: Read file content
			let fileContent: string;
			try {
				fileContent = await fs.readFile(filePath, 'utf-8');
			} catch (error) {
				throw FileIOError.fromNativeError(error as Error, filePath, 'read');
			}
			
			// Step 3: Parse content
			return this.parseDocTypeJSON(fileContent);
			
		} catch (error) {
			if (error instanceof DocTypeError) {
				// Re-throw our custom errors
				throw error;
			}
			
			// Wrap unexpected errors
			throw new FileIOError(
				`Unexpected error loading file: ${(error as Error).message}`,
				filePath,
				'read',
				error as Error
			);
		}
	}

	/**
	 * Save a DocType object to a JSON file
	 * 
	 * @param doctype - DocType object to save
	 * @param filePath - Target file path for saving
	 * @returns Promise that resolves when file is successfully written
	 * @throws FileIOError - When file write/access errors occur
	 * @throws SerializationError - When serialization fails
	 * @throws DocTypeValidationError - When DocType is invalid
	 */
	public static async saveDocTypeToFile(doctype: DocType, filePath: string): Promise<void> {
		try {
			// Step 1: Validate DocType
			const validation = DocTypeValidator.validateDocType(doctype);
			if (!validation.valid) {
				throw new DocTypeValidationError(
					'Cannot save invalid DocType',
					validation.errors
				);
			}
			
			// Step 2: Serialize DocType to JSON
			const jsonString = this.serializeDocType(doctype);
			
			// Step 3: Create directory structure if needed
			const dir = path.dirname(filePath);
			try {
				await fs.mkdir(dir, { recursive: true });
			} catch (error) {
				// Directory might already exist, ignore
				if ((error as any).code !== 'EEXIST') {
					throw FileIOError.fromNativeError(error as Error, dir, 'create');
				}
			}
			
			// Step 4: Write JSON content to file
			try {
				await fs.writeFile(filePath, jsonString, 'utf-8');
			} catch (error) {
				throw FileIOError.fromNativeError(error as Error, filePath, 'write');
			}
			
		} catch (error) {
			if (error instanceof DocTypeError) {
				// Re-throw our custom errors
				throw error;
			}
			
			// Wrap unexpected errors
			throw new FileIOError(
				`Unexpected error saving file: ${(error as Error).message}`,
				filePath,
				'write',
				error as Error
			);
		}
	}

	/**
	 * Load all DocType JSON files from a directory
	 * 
	 * @param dirPath - Path to directory containing JSON files
	 * @returns Promise resolving to array of DocType objects
	 * @throws FileNotFoundError - When directory doesn't exist
	 * @throws FileIOError - When directory access errors occur
	 */
	public static async loadAllDocTypesFromDir(dirPath: string): Promise<DocType[]> {
		try {
			// Step 1: Check directory existence
			try {
				const stats = await fs.stat(dirPath);
				if (!stats.isDirectory()) {
					throw new FileNotFoundError(dirPath, 'directory');
				}
			} catch (error) {
				throw new FileNotFoundError(dirPath, 'directory');
			}
			
			// Step 2: Get JSON files
			let files: string[];
			try {
				files = await fs.readdir(dirPath);
			} catch (error) {
				throw FileIOError.fromNativeError(error as Error, dirPath, 'read');
			}
			
			const jsonFiles = files.filter(file => file.endsWith('.json'));
			
			// Step 3: Process files with error collection
			const results: DocType[] = [];
			const errors: Array<{ file: string; error: Error }> = [];
			
			for (const file of jsonFiles) {
				const filePath = path.join(dirPath, file);
				
				try {
					const doctype = await this.loadDocTypeFromFile(filePath);
					results.push(doctype);
				} catch (error) {
					errors.push({ file, error: error as Error });
					// Log error but continue processing other files
					console.error(`Failed to load ${file}:`, (error as Error).message);
				}
			}
			
			// Step 4: Return results with summary
			if (results.length === 0 && errors.length > 0) {
				throw new FileIOError(
					`Failed to load any DocTypes from ${dirPath}. ${errors.length} errors occurred.`,
					dirPath,
					'read'
				);
			}
			
			return results;
			
		} catch (error) {
			if (error instanceof DocTypeError) {
				// Re-throw our custom errors
				throw error;
			}
			
			// Wrap unexpected errors
			throw new FileIOError(
				`Unexpected error loading directory: ${(error as Error).message}`,
				dirPath,
				'read',
				error as Error
			);
		}
	}

	/**
	 * Validate raw JSON structure before DocType conversion
	 * 
	 * @param json - Parsed JSON object to validate
	 * @returns ValidationResult with validation status and errors
	 */
	public static validateJSONStructure(json: any): ValidationResult {
		const errors: ValidationError[] = [];

		// Check for required top-level properties
		if (!json.name || typeof json.name !== 'string' || json.name.trim() === '') {
			errors.push({
				type: 'required',
				field: 'name',
				message: 'DocType name is required and must be a non-empty string',
				severity: 'error'
			});
		}

		if (!json.module || typeof json.module !== 'string' || json.module.trim() === '') {
			errors.push({
				type: 'required',
				field: 'module',
				message: 'DocType module is required and must be a non-empty string',
				severity: 'error'
			});
		}

		if (!Array.isArray(json.fields)) {
			errors.push({
				type: 'required',
				field: 'fields',
				message: 'DocType fields must be an array',
				severity: 'error'
			});
		}

		if (!Array.isArray(json.permissions)) {
			errors.push({
				type: 'required',
				field: 'permissions',
				message: 'DocType permissions must be an array',
				severity: 'error'
			});
		}

		// Check for unknown top-level properties (warning)
		const knownProperties = [
			'name', 'module', 'issingle', 'istable', 'is_submittable',
			'is_tree', 'is_virtual', 'autoname', 'naming_series',
			'title_field', 'image_field', 'search_fields', 'keyword_fields',
			'default_sort_order', 'max_attachments', 'track_changes',
			'track_seen', 'track_visits', 'show_in_global_search',
			'allow_auto_repeat', 'allow_events', 'allow_import',
			'allow_rename', 'engine', 'table_name', 'subject_field',
			'sender_field', 'email_template', 'timeline_fields',
			'grid_view_fields', 'list_view_settings', 'custom_fields',
			'fields', 'permissions', 'indexes', 'actions', 'links'
		];

		for (const prop in json) {
			if (!knownProperties.includes(prop)) {
				errors.push({
					type: 'invalid_type',
					field: prop,
					message: `Unknown property '${prop}' will be ignored`,
					severity: 'warning'
				});
			}
		}

		return {
			valid: errors.filter(e => e.severity === 'error').length === 0,
			errors
		};
	}

	/**
	 * Apply default values for missing optional properties
	 * 
	 * @param doctype - Partial DocType object with missing properties
	 * @returns Complete DocType object with all defaults applied
	 */
	public static applyDefaults(doctype: Partial<DocType>): DocType {
		// Ensure required properties are present
		if (!doctype.name) {
			throw new DocTypeError('DocType name is required');
		}
		if (!doctype.module) {
			throw new DocTypeError('DocType module is required');
		}

		// Apply DocType-level defaults
		const completeDocType: DocType = {
			...DEFAULT_DOCTYPE,
			...doctype
		} as DocType;

		// Apply field defaults
		completeDocType.fields = completeDocType.fields.map(field => ({
			...DEFAULT_DOCFIELD,
			...field
		}));

		// Apply permission defaults
		completeDocType.permissions = completeDocType.permissions.map(perm => ({
			...DEFAULT_DOCPERM,
			...perm
		}));

		// Ensure optional arrays exist
		completeDocType.indexes = completeDocType.indexes || [];
		completeDocType.actions = completeDocType.actions || [];
		completeDocType.links = completeDocType.links || [];
		completeDocType.custom_fields = completeDocType.custom_fields || [];

		return completeDocType;
	}
}