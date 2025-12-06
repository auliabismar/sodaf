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

// P2-002: Error classes
export {
	DocTypeError,
	DocTypeExistsError,
	DocTypeNotFoundError,
	DocTypeValidationError
} from './doctype-engine';

// P2-002: Validation types
export type { ValidationResult } from './doctype-engine';
export type { ValidationError } from './errors';