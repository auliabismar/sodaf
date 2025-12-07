/**
 * Constraint Builder
 * 
 * Builds SQL constraints for columns (NOT NULL, UNIQUE, DEFAULT, etc.).
 */

import type { DocField, FieldType } from '../../doctype/types';
import type { ColumnDefinition } from '../types';
import type {
	ColumnConstraintsSQL,
	ForeignKeySQL,
	SQLOptions,
	InvalidConstraintError
} from './sql-types';

/**
 * Constraint Builder class
 */
export class ConstraintBuilder {
	private options: Required<SQLOptions>;
	
	constructor(options: SQLOptions = {}) {
		this.options = {
			typeMappings: {},
			tableNamingStrategy: 'snake_case',
			identifierQuote: '`',
			includeComments: true,
			formatSQL: true,
			defaultRebuildStrategy: {
				useTempTable: true,
				tempTablePattern: '{table}_temp_{timestamp}',
				copyStrategy: 'batch',
				batchSize: 1000,
				dropOriginal: true,
				verifyData: true,
				preserveIndexes: false,
				preserveForeignKeys: false,
				preserveTriggers: false
			},
			foreignKeyStrategy: 'recreate',
			maxLineLength: 110,
			validateSQL: false,
			...options
		};
	}
	
	/**
	 * Build NOT NULL constraint
	 */
	buildNotNullConstraint(required?: boolean): string | undefined {
		if (required) {
			return 'NOT NULL';
		}
		return undefined;
	}
	
	/**
	 * Build UNIQUE constraint
	 */
	buildUniqueConstraint(unique?: boolean): string | undefined {
		if (unique) {
			return 'UNIQUE';
		}
		return undefined;
	}
	
	/**
	 * Build DEFAULT constraint
	 */
	buildDefaultConstraint(defaultValue: any, fieldType: FieldType): string | undefined {
		if (defaultValue === undefined || defaultValue === null) {
			return undefined;
		}
		
		const formattedValue = this.formatDefaultValue(defaultValue, fieldType);
		return `DEFAULT ${formattedValue}`;
	}
	
	/**
	 * Build CHECK constraint
	 */
	buildCheckConstraint(field: DocField): string | undefined {
		// Check field validation rules
		if (!field.validate) {
			return undefined;
		}
		
		// For Check field type, ensure value is 0 or 1
		if (field.fieldtype === 'Check') {
			return `CHECK (${this.quoteIdentifier(field.fieldname)} IN (0, 1))`;
		}
		
		// For Select field type, ensure value is in options
		if (field.fieldtype === 'Select' && field.options) {
			const options = field.options.split('\n').map(opt => opt.trim()).filter(opt => opt);
			const quotedOptions = options.map(opt => `'${opt.replace(/'/g, "''")}'`).join(', ');
			return `CHECK (${this.quoteIdentifier(field.fieldname)} IN (${quotedOptions}))`;
		}
		
		// For numeric fields with min/max validation
		if (field.fieldtype === 'Int' || field.fieldtype === 'Float' || field.fieldtype === 'Currency') {
			const constraints: string[] = [];
			
			// Check for minimum value
			if (field.validate.includes('>=') || field.validate.includes('>')) {
				const minMatch = field.validate.match(/[><=]+\s*(\d+)/);
				if (minMatch) {
					constraints.push(`${this.quoteIdentifier(field.fieldname)} >= ${minMatch[1]}`);
				}
			}
			
			// Check for maximum value
			if (field.validate.includes('<=') || field.validate.includes('<')) {
				const maxMatch = field.validate.match(/[><=]+\s*(\d+)/);
				if (maxMatch) {
					constraints.push(`${this.quoteIdentifier(field.fieldname)} <= ${maxMatch[1]}`);
				}
			}
			
			if (constraints.length > 0) {
				return `CHECK (${constraints.join(' AND ')})`;
			}
		}
		
		return undefined;
	}
	
	/**
	 * Build FOREIGN KEY constraint
	 */
	buildForeignKeyConstraint(field: DocField): ForeignKeySQL | undefined {
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
			referencedTable: this.quoteIdentifier(referencedTable),
			referencedColumn: this.quoteIdentifier('name'), // Default to name field
			onDelete: 'SET NULL',
			onUpdate: 'CASCADE'
		};
	}
	
	/**
	 * Build column constraints from DocField
	 */
	buildColumnConstraints(field: DocField): ColumnConstraintsSQL {
		const constraints: ColumnConstraintsSQL = {};
		
		// NOT NULL constraint
		constraints.notNull = !!field.required;
		
		// UNIQUE constraint
		constraints.unique = !!field.unique;
		
		// DEFAULT value
		if (field.default !== undefined && field.default !== null) {
			constraints.defaultValue = this.formatDefaultValue(field.default, field.fieldtype);
		}
		
		// CHECK constraint
		const checkConstraint = this.buildCheckConstraint(field);
		if (checkConstraint) {
			constraints.check = checkConstraint;
		}
		
		// FOREIGN KEY constraint
		const foreignKey = this.buildForeignKeyConstraint(field);
		if (foreignKey) {
			constraints.foreignKey = foreignKey;
		}
		
		// COLLATE for text fields
		if (this.isTextField(field.fieldtype)) {
			constraints.collate = 'BINARY'; // Default collation
		}
		
		return constraints;
	}
	
	/**
	 * Build column definition with constraints
	 */
	buildColumnDefinition(column: ColumnDefinition, constraints: ColumnConstraintsSQL): string {
		const parts: string[] = [];
		
		// Column name and type
		parts.push(`${this.quoteIdentifier(column.name)} ${column.type}`);
		
		// NOT NULL constraint
		if (constraints.notNull) {
			parts.push('NOT NULL');
		}
		
		// UNIQUE constraint
		if (constraints.unique) {
			parts.push('UNIQUE');
		}
		
		// DEFAULT value
		if (constraints.defaultValue) {
			parts.push(`DEFAULT ${constraints.defaultValue}`);
		}
		
		// CHECK constraint
		if (constraints.check) {
			parts.push(constraints.check);
		}
		
		// COLLATE clause
		if (constraints.collate) {
			parts.push(`COLLATE ${constraints.collate}`);
		}
		
		// PRIMARY KEY (for table-level definition)
		if (column.primary_key) {
			parts.push('PRIMARY KEY');
			
			if (column.auto_increment) {
				parts.push('AUTOINCREMENT');
			}
		}
		
		return parts.join(' ');
	}
	
	/**
	 * Combine multiple constraints
	 */
	combineConstraints(constraints: string[]): string {
		const validConstraints = constraints.filter(c => c && c.trim() !== '');
		return validConstraints.join(' ');
	}
	
	/**
	 * Build table-level constraints
	 */
	buildTableConstraints(columns: ColumnDefinition[]): string[] {
		const constraints: string[] = [];
		
		// Find primary key columns
		const primaryKeyColumns = columns.filter(col => col.primary_key);
		if (primaryKeyColumns.length === 1) {
			// Single column primary key is handled in column definition
			return constraints;
		} else if (primaryKeyColumns.length > 1) {
			// Composite primary key
			const columnNames = primaryKeyColumns.map(col => this.quoteIdentifier(col.name));
			constraints.push(`PRIMARY KEY (${columnNames.join(', ')})`);
		}
		
		// Find foreign key constraints
		const foreignKeyColumns = columns.filter(col => col.foreign_key);
		for (const column of foreignKeyColumns) {
			if (column.foreign_key) {
				const fk = column.foreign_key;
				constraints.push(
					`FOREIGN KEY (${this.quoteIdentifier(column.name)}) ` +
					`REFERENCES ${fk.referenced_table}(${fk.referenced_column}) ` +
					`ON DELETE ${fk.on_delete} ON UPDATE ${fk.on_update}`
				);
			}
		}
		
		return constraints;
	}
	
	/**
	 * Validate constraint
	 */
	validateConstraint(constraint: string, fieldType: FieldType): boolean {
		try {
			// Basic validation - check for common constraint patterns
			const upperConstraint = constraint.toUpperCase().trim();
			
			// Check for valid constraint keywords
			const validKeywords = [
				'NOT NULL', 'NULL', 'UNIQUE', 'PRIMARY KEY', 'FOREIGN KEY',
				'CHECK', 'DEFAULT', 'COLLATE', 'AUTOINCREMENT'
			];
			
			const hasValidKeyword = validKeywords.some(keyword => 
				upperConstraint.includes(keyword)
			);
			
			if (!hasValidKeyword) {
				return false;
			}
			
			// Validate CHECK constraint syntax
			if (upperConstraint.includes('CHECK')) {
				const checkMatch = constraint.match(/CHECK\s*\((.*)\)/i);
				if (!checkMatch) {
					return false;
				}
			}
			
			// Validate FOREIGN KEY constraint syntax
			if (upperConstraint.includes('FOREIGN KEY')) {
				const fkMatch = constraint.match(/FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s*(\w+)\s*\(([^)]+)\)/i);
				if (!fkMatch) {
					return false;
				}
			}
			
			return true;
		} catch (error) {
			return false;
		}
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
		
		// Handle special default values
		if (typeof value === 'string') {
			const upperValue = value.toUpperCase();
			
			// Current timestamp for datetime fields
			if (upperValue === 'NOW' || upperValue === 'CURRENT_TIMESTAMP') {
				if (fieldType === 'Datetime') {
					return 'CURRENT_TIMESTAMP';
				} else if (fieldType === 'Date') {
					return "date('now')";
				} else if (fieldType === 'Time') {
					return "time('now')";
				}
			}
			
			// Escape single quotes and wrap in single quotes
			return `'${value.replace(/'/g, "''")}'`;
		}
		
		return `'${String(value).replace(/'/g, "''")}'`;
	}
	
	/**
	 * Check if field type is a text field
	 */
	private isTextField(fieldType: FieldType): boolean {
		const textFields: FieldType[] = [
			'Data', 'Long Text', 'Small Text', 'Text Editor', 'Code',
			'Markdown Editor', 'HTML Editor', 'Select', 'Link', 'Dynamic Link',
			'Date', 'Datetime', 'Time', 'Duration', 'Geolocation', 'Attach',
			'Attach Image', 'Signature', 'Color', 'Password', 'Read Only',
			'Image', 'HTML'
		];
		
		return textFields.includes(fieldType);
	}
	
	/**
	 * Quote identifier according to options
	 */
	private quoteIdentifier(name: string): string {
		return `${this.options.identifierQuote}${name}${this.options.identifierQuote}`;
	}
}