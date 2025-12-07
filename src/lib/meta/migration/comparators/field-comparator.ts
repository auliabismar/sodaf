/**
 * Field Comparator Utility
 * 
 * This utility class provides methods for comparing DocType fields with database columns,
 * detecting differences, and determining migration requirements.
 */

import type { DocField } from '../../doctype/types';
import type { ColumnInfo } from '../../../core/database/types';
import type { ColumnDefinition, FieldChange } from '../types';
import type { SchemaComparisonOptions } from '../schema-comparison-types';

/**
 * Static utility class for comparing DocType fields with database columns
 */
export class FieldComparator {
	/**
	 * Default field type mappings from DocType to SQLite
	 */
	private static readonly DEFAULT_TYPE_MAPPINGS: Record<string, string> = {
		'Data': 'text',
		'Long Text': 'text',
		'Small Text': 'text',
		'Text Editor': 'text',
		'Code': 'text',
		'Markdown Editor': 'text',
		'HTML Editor': 'text',
		'Int': 'integer',
		'Float': 'real',
		'Currency': 'real',
		'Percent': 'real',
		'Check': 'integer',
		'Select': 'text',
		'Link': 'text',
		'Dynamic Link': 'text',
		'Date': 'text',
		'Datetime': 'text',
		'Time': 'text',
		'Duration': 'text',
		'Geolocation': 'text',
		'Attach': 'text',
		'Attach Image': 'text',
		'Signature': 'text',
		'Color': 'text',
		'Rating': 'integer',
		'Password': 'text',
		'Read Only': 'text',
		'Image': 'text',
		'HTML': 'text'
	};

	/**
	 * System field names that should be filtered out when requested
	 */
	private static readonly SYSTEM_FIELDS = [
		'name',
		'creation',
		'modified',
		'modified_by',
		'owner',
		'docstatus',
		'idx',
		'parent',
		'parentfield',
		'parenttype',
		'is_active'
	];

	/**
	 * Compare a DocType field with a database column
	 * @param field DocType field definition
	 * @param column Database column information
	 * @param options Comparison options
	 * @returns FieldChange if differences found, null if identical
	 */
	static compareFieldToColumn(
		field: DocField,
		column: ColumnInfo,
		options?: SchemaComparisonOptions
	): FieldChange | null {
		const changes: FieldChange['changes'] = {};
		let hasChanges = false;
		let requiresDataMigration = false;
		let destructive = false;

		// Compare data types
		const expectedType = this.mapFieldTypeToSQLiteType(
			field.fieldtype,
			field,
			options?.fieldTypeMappings
		);
		
		if (!this.areTypesEquivalent(column.type, expectedType)) {
			changes.type = { from: column.type, to: expectedType };
			hasChanges = true;
			requiresDataMigration = true;
			destructive = this.isTypeChangeDestructive(column.type, expectedType);
		}

		// Compare nullable constraint
		const expectedNullable = !field.required;
		if (column.nullable !== expectedNullable) {
			changes.nullable = { from: column.nullable, to: expectedNullable };
			hasChanges = true;
			if (!expectedNullable && column.nullable) {
				requiresDataMigration = true;
			}
		}

		// Compare unique constraint
		const expectedUnique = !!field.unique;
		if (column.unique !== expectedUnique) {
			changes.unique = { from: column.unique, to: expectedUnique };
			hasChanges = true;
			if (expectedUnique && !column.unique) {
				requiresDataMigration = true;
			}
		}

		// Compare default values
		if (!options?.ignoreDefaultValues) {
			const columnDefault = column.default_value;
			const fieldDefault = field.default;
			
			if (!this.areDefaultsEqual(columnDefault, fieldDefault)) {
				changes.default = { from: columnDefault, to: fieldDefault };
				hasChanges = true;
			}
		}

		// Compare length for text fields
		if (!options?.ignoreLengthDifferences && field.length) {
			const columnLength = this.extractLengthFromType(column.type);
			if (columnLength && columnLength !== field.length) {
				changes.length = { from: columnLength, to: field.length };
				hasChanges = true;
				if (columnLength > field.length) {
					destructive = true;
				}
			}
		}

		// Compare precision for numeric fields
		if (!options?.ignorePrecisionDifferences && field.precision) {
			const columnPrecision = this.extractPrecisionFromType(column.type);
			if (columnPrecision && columnPrecision !== field.precision) {
				changes.precision = { from: columnPrecision, to: field.precision };
				hasChanges = true;
				if (columnPrecision > field.precision) {
					destructive = true;
				}
			}
		}

		if (!hasChanges) {
			return null;
		}

		return {
			fieldname: field.fieldname,
			changes,
			requiresDataMigration,
			destructive
		};
	}

	/**
	 * Find a database column that matches a DocType field
	 * @param field DocType field to match
	 * @param columns Array of database columns
	 * @param options Comparison options
	 * @returns Matching ColumnInfo or null if not found
	 */
	static findMatchingColumn(
		field: DocField,
		columns: ColumnInfo[],
		options?: SchemaComparisonOptions
	): ColumnInfo | null {
		const caseSensitive = options?.caseSensitive ?? true;

		for (const column of columns) {
			if (this.isFieldMatchingColumn(field, column, caseSensitive)) {
				return column;
			}
		}

		// Check for old field name if specified
		if (field.old_fieldname) {
			for (const column of columns) {
				if (this.isNameMatching(column.name, field.old_fieldname, caseSensitive)) {
					return column;
				}
			}
		}

		return null;
	}

	/**
	 * Convert DocType field to ColumnDefinition
	 * @param field DocType field to convert
	 * @param options Conversion options
	 * @returns ColumnDefinition
	 */
	static fieldToColumnDefinition(
		field: DocField,
		options?: SchemaComparisonOptions
	): ColumnDefinition {
		const type = this.mapFieldTypeToSQLiteType(
			field.fieldtype,
			field,
			options?.fieldTypeMappings
		);

		return {
			name: field.fieldname,
			type,
			nullable: !field.required,
			default_value: field.default,
			primary_key: false,
			auto_increment: false,
			unique: !!field.unique,
			length: field.length,
			precision: field.precision
		};
	}

	/**
	 * Convert ColumnInfo to ColumnDefinition
	 * @param column ColumnInfo to convert
	 * @returns ColumnDefinition
	 */
	static columnInfoToColumnDefinition(column: ColumnInfo): ColumnDefinition {
		return {
			name: column.name,
			type: column.type,
			nullable: column.nullable,
			default_value: column.default_value,
			primary_key: column.primary_key,
			auto_increment: column.auto_increment,
			unique: column.unique,
			length: this.extractLengthFromType(column.type),
			precision: this.extractPrecisionFromType(column.type)
		};
	}

	/**
	 * Map DocType field type to SQLite data type
	 * @param fieldType DocType field type
	 * @param field Field for additional context
	 * @param customMappings Custom field type mappings
	 * @returns SQLite data type string
	 */
	static mapFieldTypeToSQLiteType(
		fieldType: string,
		field?: DocField,
		customMappings?: Record<string, string>
	): string {
		// Check custom mappings first
		if (customMappings && customMappings[fieldType]) {
			return customMappings[fieldType];
		}

		// Check default mappings
		if (this.DEFAULT_TYPE_MAPPINGS[fieldType]) {
			let mappedType = this.DEFAULT_TYPE_MAPPINGS[fieldType];
			
			// Add length for text fields if specified
			if (field?.length && (mappedType === 'text' || mappedType === 'varchar')) {
				mappedType = `varchar(${field.length})`;
			}
			
			// Add precision for numeric fields if specified
			if (field?.precision && (mappedType === 'real' || mappedType === 'decimal')) {
				mappedType = `decimal(${field.precision})`;
			}
			
			return mappedType;
		}

		// Default to text for unknown types
		return 'text';
	}

	/**
	 * Check if a field change requires data migration
	 * @param change FieldChange to check
	 * @returns True if data migration is required
	 */
	static requiresDataMigration(change: FieldChange): boolean {
		return change.requiresDataMigration;
	}

	/**
	 * Check if a field change is potentially destructive
	 * @param change FieldChange to check
	 * @returns True if change is destructive
	 */
	static isDestructive(change: FieldChange): boolean {
		return change.destructive;
	}

	/**
	 * Check if two data types are compatible for migration
	 * @param fromType Source data type
	 * @param toType Target data type
	 * @returns True if types are compatible
	 */
	static areTypesCompatible(fromType: string, toType: string): boolean {
		const fromBase = this.getBaseType(fromType);
		const toBase = this.getBaseType(toType);

		// Same base type is always compatible
		if (fromBase === toBase) {
			return true;
		}

		// Text types are generally compatible with each other
		if ((fromBase === 'text' || fromBase === 'varchar') && 
			(toBase === 'text' || toBase === 'varchar')) {
			return true;
		}

		// Numeric types have some compatibility
		if ((fromBase === 'integer' || fromBase === 'int') && 
			(toBase === 'integer' || toBase === 'int' || toBase === 'real')) {
			return true;
		}

		if ((fromBase === 'real' || fromBase === 'float' || fromBase === 'decimal') && 
			(toBase === 'real' || toBase === 'float' || toBase === 'decimal')) {
			return true;
		}

		return false;
	}

	/**
	 * Get complexity score for a field change
	 * @param change FieldChange to score
	 * @returns Complexity score (higher = more complex)
	 */
	static getChangeComplexity(change: FieldChange): number {
		let score = 0;

		// Type changes are most complex
		if (change.changes.type) {
			score += 10;
			if (!this.areTypesCompatible(change.changes.type.from, change.changes.type.to)) {
				score += 20; // Incompatible type change is very complex
			}
		}

		// Nullable changes are moderately complex
		if (change.changes.nullable) {
			score += 5;
			if (!change.changes.nullable.to) {
				score += 5; // Adding NOT NULL is more complex
			}
		}

		// Unique constraint changes
		if (change.changes.unique) {
			score += 7;
			if (change.changes.unique.to) {
				score += 3; // Adding unique constraint is more complex
			}
		}

		// Length changes
		if (change.changes.length) {
			score += 3;
			if (change.changes.length.to < change.changes.length.from) {
				score += 5; // Reducing length is more complex
			}
		}

		// Precision changes
		if (change.changes.precision) {
			score += 3;
			if (change.changes.precision.to < change.changes.precision.from) {
				score += 5; // Reducing precision is more complex
			}
		}

		// Default value changes are least complex
		if (change.changes.default) {
			score += 2;
		}

		return score;
	}

	/**
	 * Check if a field name is a system field
	 * @param fieldName Field name to check
	 * @returns True if field is a system field
	 */
	static isSystemField(fieldName: string): boolean {
		return this.SYSTEM_FIELDS.includes(fieldName);
	}

	/**
	 * Check if field name matches column name
	 * @param fieldName Field name
	 * @param columnName Column name
	 * @param caseSensitive Whether comparison is case sensitive
	 * @returns True if names match
	 */
	private static isNameMatching(
		fieldName: string,
		columnName: string,
		caseSensitive: boolean
	): boolean {
		if (caseSensitive) {
			return fieldName === columnName;
		}
		return fieldName.toLowerCase() === columnName.toLowerCase();
	}

	/**
	 * Check if field matches column based on name and type
	 * @param field DocType field
	 * @param column Database column
	 * @param caseSensitive Whether comparison is case sensitive
	 * @returns True if field matches column
	 */
	private static isFieldMatchingColumn(
		field: DocField,
		column: ColumnInfo,
		caseSensitive: boolean
	): boolean {
		// Check name match
		if (!this.isNameMatching(field.fieldname, column.name, caseSensitive)) {
			return false;
		}

		// Check type compatibility
		const expectedType = this.mapFieldTypeToSQLiteType(field.fieldtype, field);
		return this.areTypesCompatible(column.type, expectedType);
	}

	/**
	 * Check if two data types are equivalent for comparison purposes
	 * @param type1 First type
	 * @param type2 Second type
	 * @returns True if types are equivalent
	 */
	private static areTypesEquivalent(type1: string, type2: string): boolean {
		const base1 = this.getBaseType(type1);
		const base2 = this.getBaseType(type2);
		
		// Direct match
		if (base1 === base2) {
			return true;
		}
		
		// Text types are equivalent (text, varchar)
		if ((base1 === 'text' || base1 === 'varchar') &&
			(base2 === 'text' || base2 === 'varchar')) {
			return true;
		}
		
		return false;
	}

	/**
	 * Extract base type from type string (remove length/precision)
	 * @param type Type string
	 * @returns Base type
	 */
	private static getBaseType(type: string): string {
		const match = type.match(/^([a-zA-Z]+)/);
		return match ? match[1].toLowerCase() : type.toLowerCase();
	}

	/**
	 * Extract length from type string
	 * @param type Type string
	 * @returns Length if specified, undefined otherwise
	 */
	private static extractLengthFromType(type: string): number | undefined {
		const match = type.match(/(?:varchar|text)\((\d+)\)/i);
		return match ? parseInt(match[1], 10) : undefined;
	}

	/**
	 * Extract precision from type string
	 * @param type Type string
	 * @returns Precision if specified, undefined otherwise
	 */
	private static extractPrecisionFromType(type: string): number | undefined {
		const match = type.match(/(?:decimal|real)\((\d+)\)/i);
		return match ? parseInt(match[1], 10) : undefined;
	}

	/**
	 * Check if type change is destructive
	 * @param fromType Source type
	 * @param toType Target type
	 * @returns True if change is destructive
	 */
	private static isTypeChangeDestructive(fromType: string, toType: string): boolean {
		const fromBase = this.getBaseType(fromType);
		const toBase = this.getBaseType(toType);

		// Changing from text to numeric is potentially destructive
		if ((fromBase === 'text' || fromBase === 'varchar') && 
			(toBase === 'integer' || toBase === 'real' || toBase === 'decimal')) {
			return true;
		}

		// Reducing text length is destructive
		if (fromBase === 'varchar' && toBase === 'varchar') {
			const fromLength = this.extractLengthFromType(fromType);
			const toLength = this.extractLengthFromType(toType);
			return !!(fromLength && toLength && fromLength > toLength);
		}

		// Reducing precision is destructive
		if ((fromBase === 'decimal' || fromBase === 'real') && 
			(toBase === 'decimal' || toBase === 'real')) {
			const fromPrecision = this.extractPrecisionFromType(fromType);
			const toPrecision = this.extractPrecisionFromType(toType);
			return !!(fromPrecision && toPrecision && fromPrecision > toPrecision);
		}

		return false;
	}

	/**
	 * Check if two default values are equivalent
	 * @param default1 First default value
	 * @param default2 Second default value
	 * @returns True if defaults are equivalent
	 */
	private static areDefaultsEqual(default1: any, default2: any): boolean {
		// Handle null/undefined
		if (default1 == null && default2 == null) {
			return true;
		}
		if (default1 == null || default2 == null) {
			// Handle checkbox field: 0 in DocType is equivalent to null in database
			if ((default1 === 0 && default2 == null) || (default1 == null && default2 === 0)) {
				return true;
			}
			return false;
		}

		// String comparison for SQL defaults
		const str1 = String(default1).trim();
		const str2 = String(default2).trim();
		return str1 === str2;
	}
}