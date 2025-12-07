/**
 * Field Type Mapper
 * 
 * Maps DocType field types to SQLite data types with appropriate constraints.
 */

import type { DocField, FieldType } from '../../doctype/types';
import type { 
	ColumnDefinition, 
	ForeignKeyDefinition 
} from '../types';
import type {
	SQLiteTypeMapping
} from './sql-types';
import {
	UnsupportedFieldTypeError,
	LayoutFieldError
} from './sql-types';

/**
 * Default field type mappings for DocType to SQLite
 */
export const DEFAULT_FIELD_TYPE_MAPPINGS: Record<FieldType, SQLiteTypeMapping> = {
	// Text-based fields
	'Data': {
		sqliteType: 'TEXT',
		supportsLength: true,
		defaultLength: 255,
		supportsPrecision: false,
		canBePrimaryKey: true,
		canBeUnique: true,
		canBeIndexed: true
	},
	
	'Long Text': {
		sqliteType: 'TEXT',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: true
	},
	
	'Small Text': {
		sqliteType: 'TEXT',
		supportsLength: true,
		defaultLength: 140,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: true
	},
	
	'Text Editor': {
		sqliteType: 'TEXT',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	'Code': {
		sqliteType: 'TEXT',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	'Markdown Editor': {
		sqliteType: 'TEXT',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	'HTML Editor': {
		sqliteType: 'TEXT',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	// Numeric fields
	'Int': {
		sqliteType: 'INTEGER',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: true,
		canBeUnique: true,
		canBeIndexed: true
	},
	
	'Float': {
		sqliteType: 'REAL',
		supportsLength: false,
		supportsPrecision: true,
		defaultPrecision: 8,
		canBePrimaryKey: false,
		canBeUnique: true,
		canBeIndexed: true
	},
	
	'Currency': {
		sqliteType: 'REAL',
		supportsLength: false,
		supportsPrecision: true,
		defaultPrecision: 2,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: true,
		validator: (from: string, to: string): boolean => {
			// Validate currency precision changes
			return true;
		}
	},
	
	'Percent': {
		sqliteType: 'REAL',
		supportsLength: false,
		supportsPrecision: true,
		defaultPrecision: 2,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: true
	},
	
	// Boolean field
	'Check': {
		sqliteType: 'INTEGER',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: true,
		converter: (value: any): number => {
			// Convert boolean/checkbox to 0/1
			return value ? 1 : 0;
		}
	},
	
	// Selection fields
	'Select': {
		sqliteType: 'TEXT',
		supportsLength: true,
		defaultLength: 255,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: true,
		validator: (from: string, to: string): boolean => {
			// Validate select options compatibility
			return true;
		}
	},
	
	// Link fields
	'Link': {
		sqliteType: 'TEXT',
		supportsLength: true,
		defaultLength: 255,
		supportsPrecision: false,
		canBePrimaryKey: true,
		canBeUnique: true,
		canBeIndexed: true
	},
	
	'Dynamic Link': {
		sqliteType: 'TEXT',
		supportsLength: true,
		defaultLength: 255,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: true
	},
	
	// Date/Time fields
	'Date': {
		sqliteType: 'TEXT',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: true,
		validator: (from: string, to: string): boolean => {
			// Validate date format compatibility
			return true;
		}
	},
	
	'Datetime': {
		sqliteType: 'TEXT',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: true
	},
	
	'Time': {
		sqliteType: 'TEXT',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: true
	},
	
	'Duration': {
		sqliteType: 'TEXT',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	// Special fields
	'Geolocation': {
		sqliteType: 'TEXT',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	'Attach': {
		sqliteType: 'TEXT',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	'Attach Image': {
		sqliteType: 'TEXT',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	'Signature': {
		sqliteType: 'TEXT',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	'Color': {
		sqliteType: 'TEXT',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: true
	},
	
	'Rating': {
		sqliteType: 'INTEGER',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: true
	},
	
	'Password': {
		sqliteType: 'TEXT',
		supportsLength: true,
		defaultLength: 255,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	'Read Only': {
		sqliteType: 'TEXT',
		supportsLength: true,
		defaultLength: 255,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: true
	},
	
	'Image': {
		sqliteType: 'TEXT',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	'HTML': {
		sqliteType: 'TEXT',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	// Layout fields (no database column)
	'Section Break': {
		sqliteType: '',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	'Column Break': {
		sqliteType: '',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	'Tab Break': {
		sqliteType: '',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	'Fold': {
		sqliteType: '',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	// Special handling for Table fields
	'Table': {
		sqliteType: '',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	'Table MultiSelect': {
		sqliteType: '',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	},
	
	// UI-only fields
	'Button': {
		sqliteType: '',
		supportsLength: false,
		supportsPrecision: false,
		canBePrimaryKey: false,
		canBeUnique: false,
		canBeIndexed: false
	}
};

/**
 * Field Type Mapper class
 */
export class FieldTypeMapper {
	private typeMappings: Map<FieldType, SQLiteTypeMapping>;
	private customMappings: Record<string, SQLiteTypeMapping>;
	
	constructor(customMappings?: Record<string, SQLiteTypeMapping>) {
		this.typeMappings = new Map(Object.entries(DEFAULT_FIELD_TYPE_MAPPINGS) as [FieldType, SQLiteTypeMapping][]);
		this.customMappings = customMappings || {};
		
		if (customMappings) {
			this.applyCustomMappings(customMappings);
		}
	}
	
	/**
	 * Map a DocField to a ColumnDefinition
	 */
	mapFieldType(field: DocField): ColumnDefinition {
		// Skip layout fields
		if (this.isLayoutField(field.fieldtype)) {
			throw new Error(`Layout field: ${field.fieldtype}`);
		}
		
		const mapping = this.typeMappings.get(field.fieldtype);
		
		if (!mapping || !mapping.sqliteType) {
			throw new UnsupportedFieldTypeError(field.fieldtype);
		}
		
		// Layout fields don't create database columns
		if (!mapping.sqliteType) {
			throw new LayoutFieldError(field.fieldtype);
		}
		
		const columnType = this.getSQLiteType(field.fieldtype, field.length);
		const isNullable = !field.required;
		const defaultValue = field.default !== undefined ? this.formatDefaultValue(field.default, field.fieldtype) : undefined;
		
		return {
			name: field.fieldname,
			type: columnType,
			nullable: isNullable,
			default_value: defaultValue,
			primary_key: false, // Set separately based on DocType configuration
			auto_increment: false, // Set separately based on DocType configuration
			unique: field.unique || false,
			length: mapping.supportsLength ? (field.length || mapping.defaultLength) : undefined,
			precision: mapping.supportsPrecision ? (field.precision || mapping.defaultPrecision) : undefined,
			foreign_key: this.buildForeignKeyDefinition(field)
		};
	}
	
	/**
	 * Get SQLite type for a field type
	 */
	getSQLiteType(fieldType: FieldType, length?: number): string {
		const mapping = this.typeMappings.get(fieldType);
		
		if (!mapping) {
			throw new UnsupportedFieldTypeError(fieldType);
		}
		
		let sqliteType = mapping.sqliteType;
		
		// Add length specification if supported
		if (mapping.supportsLength && length && length !== mapping.defaultLength) {
			sqliteType += `(${length})`;
		}
		
		// Add precision specification if supported
		if (mapping.supportsPrecision && mapping.defaultPrecision) {
			sqliteType += `(${mapping.defaultPrecision})`;
		}
		
		return sqliteType;
	}
	
	/**
	 * Get default constraints for a field type
	 */
	getDefaultConstraints(fieldType: FieldType) {
		const mapping = this.typeMappings.get(fieldType);
		
		if (!mapping) {
			throw new UnsupportedFieldTypeError(fieldType);
		}
		
		return {
			canBePrimaryKey: mapping.canBePrimaryKey,
			canBeUnique: mapping.canBeUnique,
			canBeIndexed: mapping.canBeIndexed
		};
	}
	
	/**
	 * Validate type compatibility for migrations
	 */
	validateTypeMapping(from: string, to: string): boolean {
		// Check if conversion is safe
		const fromType = this.normalizeType(from);
		const toType = this.normalizeType(to);
		
		// Same type is always compatible
		if (fromType === toType) {
			return true;
		}
		
		// TEXT to TEXT with different length is compatible
		if (fromType === 'TEXT' && toType === 'TEXT') {
			return true;
		}
		
		// INTEGER to REAL is compatible (upcasting)
		if (fromType === 'INTEGER' && toType === 'REAL') {
			return true;
		}
		
		// REAL to INTEGER may result in data loss
		if (fromType === 'REAL' && toType === 'INTEGER') {
			return false;
		}
		
		// Other conversions are considered incompatible
		return false;
	}
	
	/**
	 * Apply custom type mappings
	 */
	private applyCustomMappings(customMappings: Record<string, SQLiteTypeMapping>): void {
		for (const [fieldType, mapping] of Object.entries(customMappings)) {
			this.typeMappings.set(fieldType as FieldType, mapping);
			this.customMappings[fieldType] = mapping;
		}
	}
	
	/**
	 * Normalize type string for comparison
	 */
	private normalizeType(type: string): string {
		// Extract base type from length/precision specifications
		const match = type.match(/^([A-Z]+)/i);
		return match ? match[1].toUpperCase() : type.toUpperCase();
	}
	
	/**
	 * Format default value for SQL
	 */
	private formatDefaultValue(value: any, fieldType: FieldType): string {
		if (value === null || value === undefined) {
			return 'NULL';
		}
		
		if (typeof value === 'number') {
			return String(value);
		}
		
		if (typeof value === 'boolean') {
			return value ? '1' : '0';
		}
		
		// Escape single quotes and wrap in single quotes
		return `'${String(value).replace(/'/g, "''")}'`;
	}
	
	/**
	 * Build foreign key definition for Link fields
	 */
	private buildForeignKeyDefinition(field: DocField): ForeignKeyDefinition | undefined {
		// Only Link fields can have foreign keys
		if (field.fieldtype !== 'Link' && field.fieldtype !== 'Dynamic Link') {
			return undefined;
		}
		
		// Get referenced table from options
		const referencedTable = field.options;
		if (!referencedTable) {
			return undefined;
		}
		
		return {
			referenced_table: referencedTable,
			referenced_column: 'name', // Default to name field
			on_delete: 'SET NULL',
			on_update: 'CASCADE'
		};
	}
	
	/**
	 * Check if a field type is a layout field
	 */
	private isLayoutField(fieldtype: string): boolean {
		const layoutFields = [
			'Section Break',
			'Column Break',
			'Tab Break',
			'Fold',
			'HTML',
			'Button',
			'Image'
		];
		return layoutFields.includes(fieldtype);
	}
}