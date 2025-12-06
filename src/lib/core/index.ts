/**
 * Core Module Exports
 * 
 * This module exports all core SODAF framework modules.
 */

// Database exports
export { Database } from './database/database';
export { SQLiteDatabase } from './database/sqlite-database';
export type {
	DatabaseConfig,
	QueryOptions,
	QueryResult,
	TransactionOptions,
	TableInfo,
	ColumnInfo,
	ForeignKeyInfo,
	IndexInfo,
	Migration,
	FilterCondition,
	FilterOperator
} from './database/types';

// Schema exports
export { SchemaManager } from './schema/schema-manager';
export { IndexManager } from './schema/index-manager';
export type {
	FieldType
} from './schema/types';

// Document exports
export { Doc, DuplicateEntryError, DocumentNotFoundError, ValidationError } from './document/document';
export { SubmittableDoc } from './document/submittable';
export { FieldOperationsDoc } from './document/field-ops';
export { DocumentWithHooks } from './document/hooks';
export type {
	BaseDocFields,
	DocStatus,
	DocumentHooks
} from './document/types';

// Naming exports
export { NamingManager } from './naming/naming-manager';
export type {
	NamingRule,
	NamingConfig,
	NamingSeries,
	NamingRuleType
} from './naming/types';

// Site exports
export { SiteManager } from './site/site-manager';
export { SiteBackupManager } from './site/backup';
export type {
	SiteConfig
} from './site/types';

// Defaults exports
export { DefaultManager, createDefaultManager } from './defaults/default-manager';
export type {
	DefaultScope,
	DefaultEntry,
	DefaultManagerOptions,
	DefaultDatabase
} from './defaults/types';