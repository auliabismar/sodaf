/**
 * DocType Module Index
 *
 * Exports all DocType-related types, interfaces, and classes
 */

// P2-001: Type definitions
export type {
	DocType,
	DocField,
	DocPerm,
	DocIndex,
	DocTypeAction,
	DocTypeLink,
	FieldType
} from './types';

// P2-002: DocType Engine
export { DocTypeEngine } from './doctype-engine';
export { DocTypeValidator } from './validator';

// P2-003: JSON Parser
export { DocTypeJSONParser } from './json-parser';

// P2-002: Error classes
export {
	DocTypeError,
	DocTypeExistsError,
	DocTypeNotFoundError,
	DocTypeValidationError
} from './doctype-engine';

// P2-003: JSON Parser Error Classes
export {
	JSONParseError,
	FileNotFoundError,
	FileIOError,
	SerializationError
} from './json-parser-errors';

// P2-004: DocType Meta Classes
export { DocTypeMeta } from './meta';
export { MetaCache } from './meta-cache';
export { MetaFactory } from './meta-factory';

// P2-002: Validation types
export type { ValidationResult } from './errors';
export type { ValidationError } from './errors';