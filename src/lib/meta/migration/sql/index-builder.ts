/**
 * Index Builder
 * 
 * Generates SQL for index operations.
 */

import type { DocIndex } from '../../doctype/types';
import type { IndexDefinition } from '../types';
import type {
	IndexDefinitionSQL,
	IndexColumnSQL,
	SQLOptions
} from './sql-types';

/**
 * Index Builder class
 */
export class IndexBuilder {
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
	 * Build index definition for SQL generation
	 */
	buildIndexDefinition(tableName: string, index: DocIndex): IndexDefinitionSQL {
		const indexColumns: IndexColumnSQL[] = [];
		
		// Process each column in the index
		for (let i = 0; i < index.columns.length; i++) {
			const columnName = index.columns[i];
			// Default to ASC since DocIndex doesn't have order property
			const order = 'ASC';
			
			indexColumns.push({
				name: this.quoteIdentifier(columnName),
				order: order
			});
		}
		
		return {
			name: this.quoteIdentifier(index.name),
			table: this.quoteIdentifier(tableName),
			columns: indexColumns,
			unique: index.unique || false,
			type: index.type || 'btree',
			where: index.where,
			comment: `Index on ${tableName} for columns: ${index.columns.join(', ')}`
		};
	}
	
	/**
	 * Build CREATE INDEX SQL statement
	 */
	buildCreateIndexStatement(indexDef: IndexDefinitionSQL): string {
		const parts: string[] = [];
		
		// Start with CREATE INDEX
		if (indexDef.unique) {
			parts.push('CREATE UNIQUE INDEX');
		} else {
			parts.push('CREATE INDEX');
		}
		
		// Index name
		parts.push(indexDef.name);
		
		// ON table
		parts.push(`ON ${indexDef.table}`);
		
		// Column list
		const columnList = indexDef.columns
			.map(col => `${col.name}${col.order !== 'ASC' ? ` ${col.order}` : ''}`)
			.join(', ');
		parts.push(`(${columnList})`);
		
		// WHERE clause for partial index
		if (indexDef.where) {
			parts.push(`WHERE ${indexDef.where}`);
		}
		
		const sql = parts.join(' ');
		
		// Add comment if enabled
		if (this.options.includeComments && indexDef.comment) {
			return `-- ${indexDef.comment}\n${sql}`;
		}
		
		return sql;
	}
	
	/**
	 * Build DROP INDEX SQL statement
	 */
	buildDropIndexStatement(indexName: string): string {
		const quotedName = this.quoteIdentifier(indexName);
		const sql = `DROP INDEX ${quotedName}`;
		
		// Add comment if enabled
		if (this.options.includeComments) {
			return `-- Drop index: ${indexName}\n${sql}`;
		}
		
		return sql;
	}
	
	/**
	 * Build index columns SQL
	 */
	buildIndexColumns(columns: string[], order?: ('ASC' | 'DESC')[]): string {
		const result: string[] = [];
		
		for (let i = 0; i < columns.length; i++) {
			const column = this.quoteIdentifier(columns[i]);
			const sortOrder = order && order[i] ? ` ${order[i]}` : '';
			result.push(column + sortOrder);
		}
		
		return result.join(', ');
	}
	
	/**
	 * Build partial index condition
	 */
	buildPartialIndexCondition(where?: string): string | undefined {
		if (!where || where.trim() === '') {
			return undefined;
		}
		
		return where.trim();
	}
	
	/**
	 * Generate index name based on table and columns
	 */
	generateIndexName(tableName: string, columns: string[], unique?: boolean): string {
		const prefix = unique ? 'uidx' : 'idx';
		const tablePart = tableName.replace(/[^a-zA-Z0-9]/g, '_');
		const columnPart = columns.join('_').replace(/[^a-zA-Z0-9]/g, '_');
		
		// Limit length to avoid SQLite identifier limits
		const maxLength = 63; // SQLite default limit
		let indexName = `${prefix}_${tablePart}_${columnPart}`;
		
		if (indexName.length > maxLength) {
			// Truncate column part if too long
			const availableLength = maxLength - prefix.length - tablePart.length - 2; // 2 for underscores
			indexName = `${prefix}_${tablePart}_${columnPart.substring(0, availableLength)}`;
		}
		
		return indexName;
	}
	
	/**
	 * Validate index definition
	 */
	validateIndex(index: DocIndex): boolean {
		// Check required fields
		if (!index.name || index.name.trim() === '') {
			return false;
		}
		
		if (!index.columns || index.columns.length === 0) {
			return false;
		}
		
		// Check column names
		for (const column of index.columns) {
			if (!column || column.trim() === '') {
				return false;
			}
		}
		
		// Note: DocIndex doesn't have order property, so we skip order validation
		// Order is handled as default ASC in buildIndexDefinition
		
		// Check index type
		if (index.type) {
			const validTypes = ['btree', 'hash', 'rtree', 'gist'];
			if (!validTypes.includes(index.type.toLowerCase())) {
				return false;
			}
		}
		
		return true;
	}
	
	/**
	 * Check if index is unique
	 */
	isUniqueIndex(index: DocIndex): boolean {
		return !!index.unique;
	}
	
	/**
	 * Check if index is partial (has WHERE clause)
	 */
	isPartialIndex(index: DocIndex): boolean {
		return !!(index.where && index.where.trim() !== '');
	}
	
	/**
	 * Check if index is a composite index (multiple columns)
	 */
	isCompositeIndex(index: DocIndex): boolean {
		return index.columns && index.columns.length > 1;
	}
	
	/**
	 * Get index type
	 */
	getIndexType(index: DocIndex): string {
		return index.type || 'btree';
	}
	
	/**
	 * Quote identifier according to options
	 */
	private quoteIdentifier(name: string): string {
		return `${this.options.identifierQuote}${name}${this.options.identifierQuote}`;
	}
}