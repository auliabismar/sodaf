/**
 * SQL Formatter
 * 
 * Formats SQL statements with proper indentation and line breaks.
 */

import type { SQLOptions } from './sql-types';

/**
 * SQL Formatter class
 */
export class SQLFormatter {
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
	 * Format SQL statement with proper indentation
	 */
	formatSQL(sql: string): string {
		if (!this.options.formatSQL) {
			return sql;
		}
		
		// Remove existing formatting
		let formatted = sql.replace(/\s+/g, ' ').trim();
		
		// Add newlines after major keywords
		formatted = formatted.replace(
			/\b(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT|FROM|WHERE|JOIN|GROUP BY|ORDER BY|HAVING|UNION|VALUES|SET|PRIMARY KEY|FOREIGN KEY|CHECK|DEFAULT|NOT NULL|UNIQUE|COLLATE|REFERENCES|ON DELETE|ON UPDATE|CASCADE|SET NULL|RESTRICT|NO ACTION)\b/gi,
			'\n$1'
		);
		
		// Add newlines after commas in column lists
		formatted = formatted.replace(/,(\w)/g, ',\n\t$1');
		
		// Add newlines after commas in parentheses
		formatted = formatted.replace(/,\s*(?![^()]*\))/g, ',\n\t');
		
		// Fix parentheses spacing
		formatted = formatted.replace(/\(\s+/g, '(\n\t');
		formatted = formatted.replace(/\s+\)/g, '\n)');
		
		// Remove extra whitespace
		formatted = formatted.replace(/\n\s*\n/g, '\n');
		formatted = formatted.replace(/\n\s+/g, '\n');
		
		// Trim lines
		const lines = formatted.split('\n').map(line => line.trim());
		formatted = lines.join('\n');
		
		// Add proper indentation
		formatted = this.addIndentation(formatted);
		
		// Ensure max line length
		if (this.options.maxLineLength) {
			formatted = this.enforceMaxLineLength(formatted);
		}
		
		return formatted;
	}
	
	/**
	 * Format multiple SQL statements
	 */
	formatSQLStatements(statements: string[]): string[] {
		return statements.map(stmt => this.formatSQL(stmt));
	}
	
	/**
	 * Add comments to SQL
	 */
	addComments(sql: string, comment: string): string {
		if (!this.options.includeComments) {
			return sql;
		}
		
		return `-- ${comment}\n${sql}`;
	}
	
	/**
	 * Quote identifiers according to options
	 */
	quoteIdentifier(name: string): string {
		return `${this.options.identifierQuote}${name}${this.options.identifierQuote}`;
	}
	
	/**
	 * Format value for SQL
	 */
	formatValue(value: any): string {
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
	 * Format table name according to naming strategy
	 */
	formatTableName(name: string): string {
		switch (this.options.tableNamingStrategy) {
			case 'snake_case':
				return this.toSnakeCase(name);
			case 'camelCase':
				return this.toCamelCase(name);
			case 'preserve':
			default:
				return name;
		}
	}
	
	/**
	 * Format column name according to naming strategy
	 */
	formatColumnName(name: string): string {
		switch (this.options.tableNamingStrategy) {
			case 'snake_case':
				return this.toSnakeCase(name);
			case 'camelCase':
				return this.toCamelCase(name);
			case 'preserve':
			default:
				return name;
		}
	}
	
	/**
	 * Add proper indentation to SQL
	 */
	private addIndentation(sql: string): string {
		const lines = sql.split('\n');
		let indentLevel = 0;
		const formattedLines: string[] = [];
		
		for (const line of lines) {
			const trimmedLine = line.trim();
			
			// Decrease indent for closing parentheses
			if (trimmedLine.startsWith(')')) {
				indentLevel = Math.max(0, indentLevel - 1);
			}
			
			// Add current indentation
			const indentedLine = '\t'.repeat(indentLevel) + trimmedLine;
			formattedLines.push(indentedLine);
			
			// Increase indent for opening parentheses
			if (trimmedLine.endsWith('(')) {
				indentLevel++;
			}
			
			// Handle special keywords that don't need indentation
			if (trimmedLine.match(/^(PRIMARY KEY|FOREIGN KEY|CHECK|DEFAULT|NOT NULL|UNIQUE|COLLATE|REFERENCES|ON DELETE|ON UPDATE)$/i)) {
				// Keep current indent level
			}
		}
		
		return formattedLines.join('\n');
	}
	
	/**
	 * Enforce maximum line length
	 */
	private enforceMaxLineLength(sql: string): string {
		const maxLength = this.options.maxLineLength || 110;
		const lines = sql.split('\n');
		
		return lines.map(line => {
			if (line.length <= maxLength) {
				return line;
			}
			
			// Try to break at commas
			const commaIndex = line.lastIndexOf(',', maxLength);
			if (commaIndex > maxLength * 0.7) {
				return line.substring(0, commaIndex + 1) + '\n\t' + 
					this.enforceMaxLineLength(line.substring(commaIndex + 1));
			}
			
			// Try to break at spaces
			const spaceIndex = line.lastIndexOf(' ', maxLength);
			if (spaceIndex > maxLength * 0.7) {
				return line.substring(0, spaceIndex) + '\n\t' + 
					this.enforceMaxLineLength(line.substring(spaceIndex + 1));
			}
			
			// Force break at max length
			return line.substring(0, maxLength) + '\n\t' + 
				this.enforceMaxLineLength(line.substring(maxLength));
		}).join('\n');
	}
	
	/**
	 * Convert string to snake_case
	 */
	private toSnakeCase(str: string): string {
		return str
			.replace(/([a-z])([A-Z])/g, '$1_$2')
			.replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
			.replace(/[-\s]/g, '_')
			.toLowerCase();
	}
	
	/**
	 * Convert string to camelCase
	 */
	private toCamelCase(str: string): string {
		return str
			.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
			.replace(/^[A-Z]/, c => c.toLowerCase());
	}
	
	/**
	 * Format CREATE TABLE statement
	 */
	formatCreateTable(
		tableName: string,
		columns: string[],
		constraints: string[] = []
	): string {
		const quotedTableName = this.quoteIdentifier(tableName);
		const formattedColumns = columns.map(col => '\t' + col).join(',\n');
		
		let sql = `CREATE TABLE ${quotedTableName} (\n${formattedColumns}`;
		
		if (constraints.length > 0) {
			const formattedConstraints = constraints.map(constraint => '\t' + constraint).join(',\n');
			sql += ',\n' + formattedConstraints;
		}
		
		sql += '\n)';
		
		return this.formatSQL(sql);
	}
	
	/**
	 * Format ALTER TABLE statement
	 */
	formatAlterTable(
		tableName: string,
		operation: string,
		details: string
	): string {
		const quotedTableName = this.quoteIdentifier(tableName);
		const sql = `ALTER TABLE ${quotedTableName} ${operation} ${details}`;
		
		return this.formatSQL(sql);
	}
	
	/**
	 * Format CREATE INDEX statement
	 */
	formatCreateIndex(
		indexName: string,
		tableName: string,
		columns: string[],
		unique = false,
		where?: string
	): string {
		const quotedIndexName = this.quoteIdentifier(indexName);
		const quotedTableName = this.quoteIdentifier(tableName);
		const columnList = columns.join(', ');
		
		let sql = `CREATE ${unique ? 'UNIQUE ' : ''}INDEX ${quotedIndexName} ON ${quotedTableName} (${columnList})`;
		
		if (where) {
			sql += ` WHERE ${where}`;
		}
		
		return this.formatSQL(sql);
	}
	
	/**
	 * Format DROP statement
	 */
	formatDropStatement(type: 'TABLE' | 'INDEX', name: string): string {
		const quotedName = this.quoteIdentifier(name);
		const sql = `DROP ${type} ${quotedName}`;
		
		return this.formatSQL(sql);
	}
	
	/**
	 * Format INSERT statement
	 */
	formatInsert(
		tableName: string,
		columns: string[],
		values: string[][]
	): string {
		const quotedTableName = this.quoteIdentifier(tableName);
		const columnList = columns.map(col => this.quoteIdentifier(col)).join(', ');
		
		const valueRows = values.map(row => {
			const valueList = row.map(val => this.formatValue(val));
			return `(${valueList.join(', ')})`;
		});
		
		const sql = `INSERT INTO ${quotedTableName} (${columnList})\nVALUES\n${valueRows.join(',\n')}`;
		
		return this.formatSQL(sql);
	}
	
	/**
	 * Format UPDATE statement
	 */
	formatUpdate(
		tableName: string,
		assignments: string[],
		where?: string
	): string {
		const quotedTableName = this.quoteIdentifier(tableName);
		const assignmentList = assignments.join(',\n\t');
		
		let sql = `UPDATE ${quotedTableName}\nSET\n\t${assignmentList}`;
		
		if (where) {
			sql += `\nWHERE ${where}`;
		}
		
		return this.formatSQL(sql);
	}
	
	/**
	 * Format DELETE statement
	 */
	formatDelete(tableName: string, where?: string): string {
		const quotedTableName = this.quoteIdentifier(tableName);
		
		let sql = `DELETE FROM ${quotedTableName}`;
		
		if (where) {
			sql += `\nWHERE ${where}`;
		}
		
		return this.formatSQL(sql);
	}
	
	/**
	 * Format SELECT statement
	 */
	formatSelect(
		columns: string[],
		tableName: string,
		where?: string,
		orderBy?: string[],
		limit?: number
	): string {
		const quotedTableName = this.quoteIdentifier(tableName);
		const columnList = columns.length === 1 && columns[0] === '*' 
			? '*' 
			: columns.map(col => this.quoteIdentifier(col)).join(',\n\t');
		
		let sql = `SELECT\n\t${columnList}\nFROM\n\t${quotedTableName}`;
		
		if (where) {
			sql += `\nWHERE\n\t${where}`;
		}
		
		if (orderBy && orderBy.length > 0) {
			const orderList = orderBy.map(col => {
				const parts = col.split(/\s+/);
				const quotedCol = this.quoteIdentifier(parts[0]);
				const direction = parts[1] ? ' ' + parts[1].toUpperCase() : '';
				return quotedCol + direction;
			}).join(',\n\t');
			
			sql += `\nORDER BY\n\t${orderList}`;
		}
		
		if (limit) {
			sql += `\nLIMIT ${limit}`;
		}
		
		return this.formatSQL(sql);
	}
}