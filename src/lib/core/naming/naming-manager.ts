/**
 * Naming Manager
 * 
 * This module implements document naming functionality with various naming rules.
 */

import type { NamingRule, NamingConfig, NamingSeries, NamingRuleType } from './types';
import { Database } from '../database/database';

/**
 * Naming Manager class
 * 
 * Provides methods for generating and managing document names.
 */
export class NamingManager {
	/**
	 * Database instance
	 */
	private db: Database;

	/**
	 * Cache for naming series counters
	 */
	private seriesCache: Map<string, NamingSeries> = new Map();

	/**
	 * Constructor
	 * @param db Database instance
	 */
	constructor(db: Database) {
		this.db = db;
	}

	/**
	 * Generate a name based on the naming configuration
	 * @param config Naming configuration
	 * @param doc Document data (optional, used for field-based naming)
	 * @returns Generated name
	 */
	public async generateName(config: NamingConfig, doc?: any): Promise<string> {
		if (!config.autoname) {
			throw new Error('Auto-naming is disabled');
		}

		const { type, options } = config.naming_rule;

		switch (type) {
			case 'autoincrement':
				return this.generateAutoincrement();
			case 'hash':
				return this.generateHash(options?.length || 10);
			case 'prompt':
				throw new Error('Prompt naming requires user interaction');
			case 'by_fieldname':
				return this.generateByFieldname(options?.fieldname, doc);
			case 'by_naming_series':
				return this.generateByNamingSeries(options?.series);
			case 'by_script':
				return this.generateByScript(options?.script, doc);
			default:
				throw new Error(`Unknown naming rule type: ${type}`);
		}
	}

	/**
	 * Generate a sequential autoincrement number
	 * @returns Next number in sequence
	 */
	private async generateAutoincrement(): Promise<string> {
		// Get the highest existing name that's a number
		try {
			const result = await this.db.sql(`
				SELECT MAX(CAST(name AS INTEGER)) as max_num
				FROM tabDoc
				WHERE name GLOB '^[0-9]+$'
			`);

			const maxNum = result[0]?.max_num || 0;
			return String(maxNum + 1);
		} catch (error) {
			// If table doesn't exist, start with 1
			if ((error as Error).message.includes('no such table')) {
				return '1';
			}
			throw error;
		}
	}

	/**
	 * Generate a random hash
	 * @param length Length of the hash
	 * @returns Random hash string
	 */
	private generateHash(length: number): string {
		const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}

	/**
	 * Generate a name based on a field value
	 * @param fieldname Field name to use
	 * @param doc Document data
	 * @returns Field-based name
	 */
	private generateByFieldname(fieldname: string, doc: any): string {
		if (!fieldname) {
			throw new Error('Fieldname is required for by_fieldname naming rule');
		}
		if (!doc || doc[fieldname] === undefined || doc[fieldname] === null) {
			throw new Error(`Field '${fieldname}' is empty or not found in document`);
		}
		return String(doc[fieldname]);
	}

	/**
	 * Generate a name based on a naming series
	 * @param seriesName Name of the series
	 * @returns Series-based name
	 */
	private async generateByNamingSeries(seriesName: string): Promise<string> {
		if (!seriesName) {
			throw new Error('Series name is required for by_naming_series naming rule');
		}

		let series = this.seriesCache.get(seriesName);
		if (!series) {
			// Load series from database or create default
			series = await this.loadOrCreateSeries(seriesName);
			this.seriesCache.set(seriesName, series);
		}

		// Increment counter
		series.counter++;
		
		// Update series in cache
		this.seriesCache.set(seriesName, series);

		// Update in database
		await this.updateSeriesCounter(seriesName, series.counter);

		// Generate name using format
		return this.formatSeriesName(series);
	}

	/**
	 * Load or create a naming series
	 * @param seriesName Name of the series
	 * @returns NamingSeries object
	 */
	private async loadOrCreateSeries(seriesName: string): Promise<NamingSeries> {
		// Try to load from database
		try {
			const result = await this.db.sql(`
				SELECT name, format, counter
				FROM tabNamingSeries
				WHERE name = ?
			`, [seriesName]);

			if (result.length > 0) {
				return {
					name: result[0].name,
					format: result[0].format,
					counter: result[0].counter
				};
			}

			// Create default series if not found
			const defaultSeries: NamingSeries = {
				name: seriesName,
				format: `${seriesName}.#####`,
				counter: 0
			};

			// Create table and save
			await this.createNamingSeriesTable();
			await this.db.run(`
				INSERT INTO tabNamingSeries (name, format, counter)
				VALUES (?, ?, ?)
			`, [defaultSeries.name, defaultSeries.format, defaultSeries.counter]);

			return defaultSeries;
		} catch (error) {
			// If table doesn't exist, create it first
			if ((error as Error).message.includes('no such table')) {
				const defaultSeries: NamingSeries = {
					name: seriesName,
					format: `${seriesName}.#####`,
					counter: 0
				};

				// Create table and save
				await this.createNamingSeriesTable();
				await this.db.run(`
					INSERT INTO tabNamingSeries (name, format, counter)
					VALUES (?, ?, ?)
			`, [defaultSeries.name, defaultSeries.format, defaultSeries.counter]);

				return defaultSeries;
			}
			throw error;
		}
	}

	/**
	 * Create the naming series table
	 */
	private async createNamingSeriesTable(): Promise<void> {
		try {
			await this.db.run(`
				CREATE TABLE IF NOT EXISTS tabNamingSeries (
					name TEXT PRIMARY KEY,
					format TEXT,
					counter INTEGER
				)
			`);
		} catch (error) {
			// Table might already exist, which is fine
			if (!((error as Error).message.includes('already exists'))) {
				throw error;
			}
		}
	}

	/**
	 * Format a series name with current counter
	 * @param series Naming series
	 * @returns Formatted name
	 */
	private formatSeriesName(series: NamingSeries): string {
		const now = new Date();
		let formatted = series.format;

		// Replace placeholders
		formatted = formatted.replace('.YYYY.', String(now.getFullYear()));
		formatted = formatted.replace('.YY.', String(now.getFullYear()).substring(2));
		formatted = formatted.replace('.MM.', String(now.getMonth() + 1).padStart(2, '0'));
		formatted = formatted.replace('.DD.', String(now.getDate()).padStart(2, '0'));
		formatted = formatted.replace('.#####', String(series.counter).padStart(5, '0'));

		return formatted;
	}

	/**
	 * Generate a name using a custom script
	 * @param scriptPath Path to the script
	 * @param doc Document data
	 * @returns Script-generated name
	 */
	private async generateByScript(scriptPath: string, doc: any): Promise<string> {
		if (!scriptPath) {
			throw new Error('Script path is required for by_script naming rule');
		}

		// In a real implementation, this would load and execute the script
		// For now, we'll throw an error as this is a placeholder
		throw new Error('Script-based naming is not implemented in this version');
	}

	/**
	 * Check if a name is available (not in use)
	 * @param name Name to check
	 * @param doctype Document type (optional)
	 * @returns True if name is available
	 */
	public async isNameAvailable(name: string, doctype?: string): Promise<boolean> {
		try {
			const query = doctype
				? `SELECT name FROM tab${doctype} WHERE name = ?`
				: `SELECT name FROM tabDoc WHERE name = ?`;

			const result = await this.db.sql(query, [name]);
			return result.length === 0;
		} catch (error) {
			// If table doesn't exist, name is available
			if ((error as Error).message.includes('no such table')) {
				return true;
			}
			return false;
		}
	}

	/**
	 * Get the next name in a naming series
	 * @param seriesName Name of the series
	 * @returns Next name in series
	 */
	public async getNextInSeries(seriesName: string): Promise<string> {
		const series = this.seriesCache.get(seriesName) || await this.loadOrCreateSeries(seriesName);
		series.counter++;
		this.seriesCache.set(seriesName, series);
		
		// Update in database
		await this.updateSeriesCounter(seriesName, series.counter);

		return this.formatSeriesName(series);
	}

	/**
	 * Update the counter for a naming series
	 * @param seriesName Name of the series
	 * @param counter New counter value
	 */
	public async updateSeriesCounter(seriesName: string, counter: number): Promise<void> {
		const series = this.seriesCache.get(seriesName) || await this.loadOrCreateSeries(seriesName);
		series.counter = counter;
		this.seriesCache.set(seriesName, series);
		
		// Update in database
		await this.db.run(`
			UPDATE tabNamingSeries
			SET counter = ?
			WHERE name = ?
		`, [counter, seriesName]);
	}

	/**
	 * Rename a document
	 * @param doctype Document type
	 * @param oldName Current name
	 * @param newName New name
	 */
	public async rename(doctype: string, oldName: string, newName: string): Promise<void> {
		// Check if new name is available
		const isAvailable = await this.isNameAvailable(newName, doctype);
		if (!isAvailable) {
			throw new Error(`Name '${newName}' is already in use`);
		}

		// Update document name
		await this.updateDocumentName(doctype, oldName, newName);

		// Update child references
		await this.updateChildReferences(doctype, oldName, newName);

		// Update linked references
		await this.updateLinkedReferences(doctype, oldName, newName);
	}

	/**
	 * Update a document name
	 * @param doctype Document type
	 * @param oldName Current name
	 * @param newName New name
	 */
	private async updateDocumentName(doctype: string, oldName: string, newName: string): Promise<void> {
		// First try to update in the doctype table
		try {
			const query = `UPDATE tab${doctype} SET name = ? WHERE name = ?`;
			await this.db.run(query, [newName, oldName]);
		} catch (error) {
			// If doctype table doesn't exist, try updating in tabDoc
			if ((error as Error).message.includes('no such table')) {
				const query = `UPDATE tabDoc SET name = ? WHERE name = ?`;
				await this.db.run(query, [newName, oldName]);
			} else {
				throw error;
			}
		}
	}

	/**
	 * Create a basic doctype table
	 * @param doctype Document type
	 */
	private async createDocTypeTable(doctype: string): Promise<void> {
		await this.db.run(`
			CREATE TABLE IF NOT EXISTS tab${doctype} (
				name TEXT PRIMARY KEY,
				doctype TEXT
			)
		`);
	}

	/**
	 * Update child document references after rename
	 * @param doctype Parent document type
	 * @param oldName Old parent name
	 * @param newName New parent name
	 */
	private async updateChildReferences(doctype: string, oldName: string, newName: string): Promise<void> {
		try {
			// Find all child tables
			const childTables = await this.db.sql(`
					SELECT name FROM sqlite_master
					WHERE type = 'table' AND sql LIKE '%parenttype%'
			`);

			for (const table of childTables) {
				const tableName = (table as any).name;
				if (tableName.startsWith('tab')) {
					const childDoctype = tableName.substring(3); // Remove 'tab' prefix
					
					await this.db.run(`
						UPDATE ${tableName}
						SET parent = ?
						WHERE parenttype = ? AND parent = ?
					`, [newName, doctype, oldName]);
				}
			}
		} catch (error) {
			// If there's an error (like missing tables), just continue
			// This is not critical for the rename operation
		}
	}

	/**
	 * Update linked document references after rename
	 * @param doctype Document type
	 * @param oldName Old document name
	 * @param newName New document name
	 */
	private async updateLinkedReferences(doctype: string, oldName: string, newName: string): Promise<void> {
		try {
			// Find all link fields
			const linkFields = await this.db.sql(`
					SELECT name FROM tabField
					WHERE fieldtype = 'Link' AND options LIKE ?
			`, [`%"doctype":"${doctype}"%`]);

			for (const field of linkFields) {
				const fieldName = (field as any).name;
				
				// Update link references in all tables that have this field
				const tablesWithField = await this.db.sql(`
					SELECT name FROM sqlite_master
					WHERE type = 'table' AND sql LIKE ?
				`, [`%${fieldName}%`]);

				for (const table of tablesWithField) {
					const tableName = (table as any).name;
					if (tableName.startsWith('tab')) {
						await this.db.run(`
							UPDATE ${tableName}
							SET ${fieldName} = ?
							WHERE ${fieldName} = ?
						`, [newName, oldName]);
					}
				}
			}
		} catch (error) {
			// If there's an error (like missing tables), just continue
			// This is not critical for the rename operation
		}
	}
}