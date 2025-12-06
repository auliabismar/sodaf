/**
 * Naming Types and Interfaces
 * 
 * This module defines TypeScript interfaces for naming rules and patterns
 * used in document naming conventions.
 */

/**
 * Naming rule types
 */
export type NamingRuleType = 
	| 'autoincrement'  // Sequential numbering: 1, 2, 3...
	| 'hash'          // Random hash: abc123def456
	| 'prompt'        // User input via prompt
	| 'by_fieldname'  // Use value from specified field
	| 'by_naming_series' // Use naming series with pattern
	| 'by_script';    // Use custom naming script

/**
 * Naming rule interface
 * Defines how document names are generated
 */
export interface NamingRule {
	/**
	 * The type of naming rule to use
	 */
	type: NamingRuleType;
	
	/**
	 * Additional options specific to the naming rule type
	 */
	options?: Record<string, any>;
}

/**
 * Naming configuration interface
 * Combines naming rule with autoname flag
 */
export interface NamingConfig {
	/**
	 * The naming rule to apply
	 */
	naming_rule: NamingRule;
	
	/**
	 * Whether to automatically name documents
	 */
	autoname: boolean;
}

/**
 * Naming series interface
 * Defines a pattern for sequential naming
 */
export interface NamingSeries {
	/**
	 * The name of the series
	 */
	name: string;
	
	/**
	 * The pattern format with placeholders
	 * Placeholders: .YYYY. .YY. .MM. .DD. .#####
	 */
	format: string;
	
	/**
	 * The current counter value
	 */
	counter: number;
}

/**
 * Format placeholder types for naming series
 */
export type FormatPlaceholder = 
	| '.YYYY.'  // 4-digit year (2023)
	| '.YY.'    // 2-digit year (23)
	| '.MM.'    // 2-digit month (01-12)
	| '.DD.'    // 2-digit day (01-31)
	| '.#####'; // Zero-padded number (00001)