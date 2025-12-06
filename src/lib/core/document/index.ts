/**
 * Document module exports
 */

export type {
	BaseDocFields,
	DocStatus,
	DocumentHooks,
	ValidationError,
	DocumentPermissions,
	DocumentOptions
} from './types';

export {
	Doc,
	DuplicateEntryError,
	DocumentNotFoundError,
	ValidationError as DocumentValidationError
} from './document';

export {
	SubmittableDoc,
	InvalidStateError,
	NotSubmittableError,
	CannotEditSubmittedError,
	CannotDeleteSubmittedError
} from './submittable';

export {
	HookExecutor,
	DocumentWithHooks
} from './hooks';

export type {
	ChildDoc
} from './field-ops';

export {
	FieldOperationsDoc
} from './field-ops';