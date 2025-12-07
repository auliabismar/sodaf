/**
 * Form Schema Constants
 * 
 * This file defines constants used throughout the form schema system.
 */

/**
 * Default form configuration values
 */
export const DEFAULT_FORM_CONFIG = {
	/** Default validation trigger */
	DEFAULT_VALIDATION_TRIGGER: 'change' as const,
	
	/** Default validation debounce time in milliseconds */
	DEFAULT_VALIDATION_DEBOUNCE: 300,
	
	/** Default auto-save interval in milliseconds */
	DEFAULT_AUTO_SAVE_INTERVAL: 30000,
	
	/** Default grid columns */
	DEFAULT_GRID_COLUMNS: 12,
	
	/** Default grid gap */
	DEFAULT_GRID_GAP: '1rem',
	
	/** Default minimum column width */
	DEFAULT_MIN_COLUMN_WIDTH: '200px',
	
	/** Default animation duration */
	DEFAULT_ANIMATION_DURATION: '0.3s',
	
	/** Default animation easing */
	DEFAULT_ANIMATION_EASING: 'ease-in-out',
	
	/** Default responsive breakpoints */
	DEFAULT_RESPONSIVE_BREAKPOINTS: {
		mobile: 768,
		tablet: 1024,
		desktop: 1200
	}
} as const;

/**
 * Form field type constants
 */
export const FIELD_TYPES = {
	/** Text input fields */
	TEXT: ['Data', 'Small Text'],
	
	/** Rich text fields */
	RICH_TEXT: ['Long Text', 'Text Editor', 'Markdown Editor', 'HTML Editor'],
	
	/** Code fields */
	CODE: ['Code'],
	
	/** Numeric fields */
	NUMBER: ['Int', 'Float', 'Currency', 'Percent'],
	
	/** Selection fields */
	SELECT: ['Select', 'Link', 'Dynamic Link'],
	
	/** Multi-select fields */
	MULTI_SELECT: ['Table MultiSelect'],
	
	/** Date/time fields */
	DATE_TIME: ['Date', 'Datetime', 'Time', 'Duration'],
	
	/** Boolean fields */
	BOOLEAN: ['Check'],
	
	/** File fields */
	FILE: ['Attach', 'Attach Image'],
	
	/** Special fields */
	SPECIAL: ['Geolocation', 'Signature', 'Color', 'Rating', 'Password'],
	
	/** Display fields */
	DISPLAY: ['Read Only', 'Button', 'Image', 'HTML'],
	
	/** Layout fields */
	LAYOUT: ['Section Break', 'Column Break', 'Tab Break', 'Fold']
} as const;

/**
 * Validation rule constants
 */
export const VALIDATION_RULES = {
	/** Required field validation */
	REQUIRED: 'required',
	
	/** Email validation */
	EMAIL: 'email',
	
	/** Phone validation */
	PHONE: 'phone',
	
	/** URL validation */
	URL: 'url',
	
	/** Number validation */
	NUMBER: 'number',
	
	/** Integer validation */
	INTEGER: 'integer',
	
	/** Float validation */
	FLOAT: 'float',
	
	/** Currency validation */
	CURRENCY: 'currency',
	
	/** Date validation */
	DATE: 'date',
	
	/** Time validation */
	TIME: 'time',
	
	/** DateTime validation */
	DATETIME: 'datetime',
	
	/** Minimum length validation */
	MIN_LENGTH: 'minlength',
	
	/** Maximum length validation */
	MAX_LENGTH: 'maxlength',
	
	/** Minimum value validation */
	MIN_VALUE: 'min',
	
	/** Maximum value validation */
	MAX_VALUE: 'max',
	
	/** Pattern validation */
	PATTERN: 'pattern',
	
	/** Unique validation */
	UNIQUE: 'unique',
	
	/** Custom validation */
	CUSTOM: 'custom',
	
	/** Async validation */
	ASYNC: 'async'
} as const;

/**
 * Validation trigger constants
 */
export const VALIDATION_TRIGGERS = {
	/** Validate on field change */
	CHANGE: 'change',
	
	/** Validate on field blur */
	BLUR: 'blur',
	
	/** Validate on form submit */
	SUBMIT: 'submit',
	
	/** Manual validation */
	MANUAL: 'manual'
} as const;

/**
 * Form event types
 */
export const FORM_EVENTS = {
	/** Form load event */
	LOAD: 'load',
	
	/** Form refresh event */
	REFRESH: 'refresh',
	
	/** Form validate event */
	VALIDATE: 'validate',
	
	/** Form submit event */
	SUBMIT: 'submit',
	
	/** Form cancel event */
	CANCEL: 'cancel',
	
	/** Form save event */
	SAVE: 'save',
	
	/** Form delete event */
	DELETE: 'delete',
	
	/** Field change event */
	CHANGE: 'change',
	
	/** Field focus event */
	FOCUS: 'focus',
	
	/** Field blur event */
	BLUR: 'blur'
} as const;

/**
 * Form script trigger types
 */
export const SCRIPT_TRIGGERS = {
	/** Script executes on form load */
	LOAD: 'load',
	
	/** Script executes on field change */
	CHANGE: 'change',
	
	/** Script executes on form submit */
	SUBMIT: 'submit',
	
	/** Custom script trigger */
	CUSTOM: 'custom'
} as const;

/**
 * Form state constants
 */
export const FORM_STATE = {
	/** Initial form state */
	INITIAL: 'initial',
	
	/** Form has unsaved changes */
	DIRTY: 'dirty',
	
	/** Form is currently loading */
	LOADING: 'loading',
	
	/** Form is currently submitting */
	SUBMITTING: 'submitting',
	
	/** Form validation failed */
	INVALID: 'invalid',
	
	/** Form is valid and ready */
	VALID: 'valid',
	
	/** Form has been saved */
	SAVED: 'saved'
} as const;

/**
 * CSS class constants for form styling
 */
export const CSS_CLASSES = {
	/** Base form class */
	FORM: 'sodaf-form',
	
	/** Form section class */
	SECTION: 'sodaf-form-section',
	
	/** Form column class */
	COLUMN: 'sodaf-form-column',
	
	/** Form field class */
	FIELD: 'sodaf-form-field',
	
	/** Form field label class */
	FIELD_LABEL: 'sodaf-form-field-label',
	
	/** Form field input class */
	FIELD_INPUT: 'sodaf-form-field-input',
	
	/** Form field error class */
	FIELD_ERROR: 'sodaf-form-field-error',
	
	/** Form field description class */
	FIELD_DESCRIPTION: 'sodaf-form-field-description',
	
	/** Form tab class */
	TAB: 'sodaf-form-tab',
	
	/** Form tab content class */
	TAB_CONTENT: 'sodaf-form-tab-content',
	
	/** Form validation error class */
	VALIDATION_ERROR: 'sodaf-validation-error',
	
	/** Form required field class */
	REQUIRED_FIELD: 'sodaf-required-field',
	
	/** Form disabled field class */
	DISABLED_FIELD: 'sodaf-disabled-field',
	
	/** Form hidden field class */
	HIDDEN_FIELD: 'sodaf-hidden-field',
	
	/** Form collapsible section class */
	COLLAPSIBLE_SECTION: 'sodaf-collapsible-section',
	
	/** Form collapsed section class */
	COLLAPSED_SECTION: 'sodaf-collapsed-section'
} as const;

/**
 * Error message constants
 */
export const ERROR_MESSAGES = {
	/** Generic required field error */
	REQUIRED_FIELD: 'This field is required',
	
	/** Generic email validation error */
	INVALID_EMAIL: 'Please enter a valid email address',
	
	/** Generic phone validation error */
	INVALID_PHONE: 'Please enter a valid phone number',
	
	/** Generic URL validation error */
	INVALID_URL: 'Please enter a valid URL',
	
	/** Generic number validation error */
	INVALID_NUMBER: 'Please enter a valid number',
	
	/** Generic integer validation error */
	INVALID_INTEGER: 'Please enter a whole number',
	
	/** Generic float validation error */
	INVALID_FLOAT: 'Please enter a decimal number',
	
	/** Generic currency validation error */
	INVALID_CURRENCY: 'Please enter a valid currency amount',
	
	/** Generic date validation error */
	INVALID_DATE: 'Please enter a valid date',
	
	/** Generic time validation error */
	INVALID_TIME: 'Please enter a valid time',
	
	/** Generic datetime validation error */
	INVALID_DATETIME: 'Please enter a valid date and time',
	
	/** Generic minimum length error */
	MIN_LENGTH: 'Minimum length is {0} characters',
	
	/** Generic maximum length error */
	MAX_LENGTH: 'Maximum length is {0} characters',
	
	/** Generic minimum value error */
	MIN_VALUE: 'Minimum value is {0}',
	
	/** Generic maximum value error */
	MAX_VALUE: 'Maximum value is {0}',
	
	/** Generic pattern mismatch error */
	PATTERN_MISMATCH: 'Please match the required format',
	
	/** Generic unique constraint error */
	UNIQUE_VIOLATION: 'This value must be unique',
	
	/** Generic custom validation error */
	CUSTOM_VALIDATION: 'Validation failed',
	
	/** Generic async validation error */
	ASYNC_VALIDATION: 'Validation in progress'
} as const;