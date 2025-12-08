/**
 * MetaFactory - Factory for Creating DocTypeMeta Instances
 * 
 * This module implements the MetaFactory class which provides methods for creating
 * DocTypeMeta instances with proper initialization and validation.
 */

import type { DocType } from './types';
import type { DocTypeEngine } from './doctype-engine';
import { DocTypeMeta } from './meta';
import { DocTypeError } from './errors';

/**
 * Factory for creating DocTypeMeta instances
 */
export class MetaFactory {
	/**
	 * Create Meta instance from DocType
	 * @param doctype DocType definition to create Meta for
	 * @returns DocTypeMeta instance
	 * @throws DocTypeError if DocType is invalid
	 */
	public static create(doctype: DocType, includeCustomFields: boolean = true): DocTypeMeta {
		if (!this.validateDocType(doctype)) {
			throw new DocTypeError('Invalid DocType provided');
		}

		const meta = new DocTypeMeta(doctype, includeCustomFields);
		this.initializeIndexes(meta);

		return meta;
	}

	/**
	 * Create Meta instance from DocType name
	 * @param doctypeName Name of the DocType to create Meta for
	 * @param engine DocTypeEngine instance to load DocType from
	 * @returns Promise resolving to DocTypeMeta instance or null if not found
	 */
	public static async createFromName(
		doctypeName: string,
		engine: DocTypeEngine,
		includeCustomFields: boolean = true
	): Promise<DocTypeMeta | null> {
		const doctype = await engine.getDocType(doctypeName);
		if (!doctype) {
			return null;
		}

		return this.create(doctype, includeCustomFields);
	}

	/**
	 * Create multiple Meta instances from DocType names
	 * @param doctypeNames Array of DocType names to create Meta for
	 * @param engine DocTypeEngine instance to load DocTypes from
	 * @returns Promise resolving to Map of doctypeName to DocTypeMeta instances
	 */
	public static async createFromNames(
		doctypeNames: string[],
		engine: DocTypeEngine,
		includeCustomFields: boolean = true
	): Promise<Map<string, DocTypeMeta | null>> {
		const results = new Map<string, DocTypeMeta | null>();

		// Process in parallel for better performance
		const promises = doctypeNames.map(async (doctypeName) => {
			const meta = await this.createFromName(doctypeName, engine, includeCustomFields);
			return { doctypeName, meta };
		});

		const resolved = await Promise.all(promises);
		for (const { doctypeName, meta } of resolved) {
			results.set(doctypeName, meta);
		}

		return results;
	}

	/**
	 * Validate DocType structure
	 * @param doctype DocType definition to validate
	 * @returns True if valid, false otherwise
	 */
	private static validateDocType(doctype: DocType): boolean {
		return !!doctype &&
			!!doctype.name &&
			!!doctype.module &&
			Array.isArray(doctype.fields) &&
			Array.isArray(doctype.permissions);
	}

	/**
	 * Initialize computed indexes for a Meta instance
	 * @param meta DocTypeMeta instance to initialize
	 */
	private static initializeIndexes(meta: DocTypeMeta): void {
		// Trigger computation of cached values
		meta.get_valid_columns();
		// Add other precomputations as needed
	}
}