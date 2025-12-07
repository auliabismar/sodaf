# Form Schema Types Architecture Design

## Overview

This document outlines the architecture design for P2-009: Form Schema Types, which defines interfaces for form generation and layout in the SODAF project. This component will serve as the foundation for generating dynamic forms based on DocType definitions.

## Purpose

The Form Schema Types provide a structured way to:
- Define form layouts derived from DocType definitions
- Support complex form structures with sections, columns, and tabs
- Enable field-level validation rules
- Support conditional visibility and dependencies
- Provide event handling capabilities for form interactions

## Integration with Existing Components

The Form Schema Types will integrate with:
- **P2-001 DocType Types**: Using the DocField, DocType interfaces as the foundation
- **P2-010 Form Generator**: Will consume these types to generate actual form schemas
- **P2-011 Carbon-Svelte Field Mapping**: Will use these types to map to UI components
- **Migration System**: Forms will adapt to schema changes over time

## Core Design Principles

1. **Type Safety**: Leverage TypeScript's strict typing for all form structures
2. **Extensibility**: Support custom field types and validation rules
3. **Performance**: Optimize for form rendering and validation
4. **Consistency**: Align with existing DocType patterns and conventions
5. **Flexibility**: Support various form layouts and responsive design

## File Structure

```
src/lib/meta/form/
├── types.ts              # Main form schema types
├── index.ts              # Export barrel
├── __tests__/            # Test files
│   └── types.test.ts     # Type tests
└── architecture-design.md # This design document
```

## Type Hierarchy

```
FormSchema (root)
├── FormLayout (layout configuration)
├── FormTab[] (tabs)
│   └── FormSection[] (sections per tab)
│       ├── FormColumn[] (columns per section)
│       │   └── FormField[] (fields per column)
│       └── FormField[] (direct fields in section)
├── ValidationRule[] (global validation rules)
└── FormEvent (event handlers)
```

## Key Interfaces

### 1. FormSchema
The root interface representing a complete form definition derived from a DocType.

### 2. FormSection
Represents a logical grouping of fields within a form, corresponding to Section Break fields.

### 3. FormColumn
Represents column layouts within sections, corresponding to Column Break fields.

### 4. FormField
Represents an individual field in the form, derived from DocField but with form-specific properties.

### 5. FormLayout
Defines the overall layout configuration of the form.

### 6. FormTab
Represents tabbed sections in the form, corresponding to Tab Break fields.

### 7. ValidationRule
Defines validation rules that can be applied to fields or the form as a whole.

### 8. FormEvent
Defines event handlers for form interactions.

## Design Considerations

### Field Visibility and Dependencies
- Support conditional field visibility based on other field values
- Handle complex dependency chains
- Evaluate JavaScript expressions for dynamic conditions

### Responsive Design
- Support different column layouts for different screen sizes
- Allow field width specifications
- Handle collapsible sections

### Validation Strategy
- Support both field-level and form-level validation
- Allow custom validation functions
- Provide clear error messages and localization support

### Performance Optimization
- Lazy loading of tab content
- Efficient validation execution
- Minimal re-renders on field changes

## Testing Strategy

The types will be tested using:
- Type compilation tests to ensure interface correctness
- Instance creation tests to validate type constraints
- Integration tests with DocType types
- Edge case testing for complex form structures

## Future Enhancements

The design allows for future additions:
- Form themes and styling
- Advanced field types (custom components)
- Form workflow integration
- Multi-language support
- Form analytics and tracking

## Detailed Interface Specifications

### 1. FormSchema Interface

```typescript
interface FormSchema {
	/** Reference to the source DocType */
	doctype: string;
	
	/** Array of form sections (if no tabs) */
	sections?: FormSection[];
	
	/** Array of tabs (alternative to sections) */
	tabs?: FormTab[];
	
	/** Form layout configuration */
	layout: FormLayout;
	
	/** Form-level validation rules */
	validation?: ValidationRule[];
	
	/** Form event handlers */
	events?: FormEvent;
	
	/** Custom scripts for form behavior */
	scripts?: FormScript[];
	
	/** Form metadata */
	metadata?: FormMetadata;
}
```

### 2. FormSection Interface

```typescript
interface FormSection {
	/** Section identifier (unique within form) */
	fieldname: string;
	
	/** Section display label */
	label: string;
	
	/** Whether section is collapsible */
	collapsible?: boolean;
	
	/** Whether section starts collapsed */
	collapsed?: boolean;
	
	/** Section visibility condition */
	condition?: string;
	
	/** Columns within this section */
	columns?: FormColumn[];
	
	/** Fields directly in section (if no columns) */
	fields?: FormField[];
	
	/** CSS class for section styling */
	class?: string;
	
	/** Section description */
	description?: string;
	
	/** Section order in form */
	order?: number;
	
	/** Whether section depends on other fields */
	depends_on?: string;
	
	/** Whether section is hidden */
	hidden?: boolean;
}
```

### 3. FormColumn Interface

```typescript
interface FormColumn {
	/** Fields in this column */
	fields: FormField[];
	
	/** Column width (percentage or fraction) */
	width?: string | number;
	
	/** CSS class for column styling */
	class?: string;
	
	/** Column order within section */
	order?: number;
	
	/** Whether column is responsive */
	responsive?: {
		/** Width for small screens */
		sm?: string | number;
		/** Width for medium screens */
		md?: string | number;
		/** Width for large screens */
		lg?: string | number;
	};
}
```

### 4. FormField Interface

```typescript
interface FormField {
	/** Field name (matches DocField.fieldname) */
	fieldname: string;
	
	/** Field type (matches DocField.fieldtype) */
	fieldtype: FieldType;
	
	/** Field display label */
	label: string;
	
	/** Whether field is required */
	required?: boolean;
	
	/** Whether field is read-only */
	read_only?: boolean;
	
	/** Whether field is hidden */
	hidden?: boolean;
	
	/** Default value for field */
	default?: any;
	
	/** Field options (for Select, Link, etc.) */
	options?: string;
	
	/** Field validation rules */
	validation?: ValidationRule[];
	
	/** Field visibility condition */
	condition?: string;
	
	/** Field change event handler */
	on_change?: string;
	
	/** Field width */
	width?: string;
	
	/** CSS class for field styling */
	class?: string;
	
	/** Field description/help text */
	description?: string;
	
	/** Field placeholder text */
	placeholder?: string;
	
	/** Field order in form */
	order?: number;
	
	/** Whether field depends on other fields */
	depends_on?: string;
	
	/** Field-specific properties */
	properties?: Record<string, any>;
	
	/** Field group for related fields */
	group?: string;
	
	/** Whether field is translatable */
	translatable?: boolean;
	
	/** Field precision for numeric fields */
	precision?: number;
	
	/** Field length for text fields */
	length?: number;
	
	/** Field minimum value */
	min?: number;
	
	/** Field maximum value */
	max?: number;
	
	/** Field step for numeric inputs */
	step?: number;
	
	/** Field pattern for validation */
	pattern?: string;
	
	/** Field multiple selection support */
	multiple?: boolean;
	
	/** Field autocomplete settings */
	autocomplete?: string;
	
	/** Field spellcheck setting */
	spellcheck?: boolean;
}
```

### 5. FormLayout Interface

```typescript
interface FormLayout {
	/** Fields for quick entry form */
	quick_entry_fields?: string[];
	
	/** Whether form has tabs */
	has_tabs?: boolean;
	
	/** Whether form is in quick entry mode */
	quick_entry?: boolean;
	
	/** Whether form is printable */
	print_hide?: boolean;
	
	/** Form CSS class */
	class?: string;
	
	/** Form style properties */
	style?: Record<string, string>;
	
	/** Form responsive settings */
	responsive?: {
		/** Breakpoint for mobile layout */
		mobile?: number;
		/** Breakpoint for tablet layout */
		tablet?: number;
		/** Breakpoint for desktop layout */
		desktop?: number;
	};
	
	/** Form grid settings */
	grid?: {
		/** Number of columns in grid */
		columns?: number;
		/** Gap between grid items */
		gap?: string;
		/** Minimum column width */
		min_width?: string;
	};
	
	/** Form animation settings */
	animations?: {
		/** Enable form animations */
		enabled?: boolean;
		/** Animation duration */
		duration?: string;
		/** Animation easing */
		easing?: string;
	};
}
```

### 6. FormTab Interface

```typescript
interface FormTab {
	/** Tab identifier (unique within form) */
	fieldname: string;
	
	/** Tab display label */
	label: string;
	
	/** Sections within this tab */
	sections: FormSection[];
	
	/** Tab visibility condition */
	condition?: string;
	
	/** CSS class for tab styling */
	class?: string;
	
	/** Tab order in form */
	order?: number;
	
	/** Whether tab is disabled */
	disabled?: boolean;
	
	/** Whether tab is hidden */
	hidden?: boolean;
	
	/** Tab icon */
	icon?: string;
	
	/** Tab badge */
	badge?: string | number;
	
	/** Whether tab depends on other fields */
	depends_on?: string;
}
```

### 7. ValidationRule Interface

```typescript
interface ValidationRule {
	/** Validation type */
	type: ValidationType;
	
	/** Validation error message */
	message: string;
	
	/** Validation function or expression */
	validator: string | ValidationFunction;
	
	/** Validation trigger */
	trigger?: ValidationTrigger;
	
	/** Validation priority */
	priority?: number;
	
	/** Whether validation is async */
	async?: boolean;
	
	/** Validation parameters */
	params?: Record<string, any>;
	
	/** Custom validation options */
	options?: ValidationOptions;
}

/** Validation type enumeration */
type ValidationType =
	| 'required'
	| 'email'
	| 'phone'
	| 'url'
	| 'number'
	| 'integer'
	| 'float'
	| 'currency'
	| 'date'
	| 'time'
	| 'datetime'
	| 'minlength'
	| 'maxlength'
	| 'min'
	| 'max'
	| 'pattern'
	| 'unique'
	| 'custom'
	| 'async';

/** Validation trigger enumeration */
type ValidationTrigger =
	| 'change'
	| 'blur'
	| 'submit'
	| 'manual';

/** Validation function type */
type ValidationFunction = (
	value: any,
	field: FormField,
	form: FormSchema,
	context: ValidationContext
) => boolean | Promise<boolean>;

/** Validation context interface */
interface ValidationContext {
	/** Current form data */
	data: Record<string, any>;
	
	/** User permissions */
	permissions?: string[];
	
	/** Additional context */
	extra?: Record<string, any>;
}

/** Validation options interface */
interface ValidationOptions {
	/** Whether to show error immediately */
	immediate?: boolean;
	
	/** Whether to validate on empty field */
	validate_empty?: boolean;
	
	/** Custom error message template */
	message_template?: string;
	
	/** Validation debounce time */
	debounce?: number;
}
```

### 8. FormEvent Interface

```typescript
interface FormEvent {
	/** Form load event handler */
	on_load?: string;
	
	/** Form refresh event handler */
	on_refresh?: string;
	
	/** Form validate event handler */
	on_validate?: string;
	
	/** Form submit event handler */
	on_submit?: string;
	
	/** Form cancel event handler */
	on_cancel?: string;
	
	/** Form save event handler */
	on_save?: string;
	
	/** Form delete event handler */
	on_delete?: string;
	
	/** Field change event handlers */
	on_change?: Record<string, string>;
	
	/** Field focus event handlers */
	on_focus?: Record<string, string>;
	
	/** Field blur event handlers */
	on_blur?: Record<string, string>;
	
	/** Custom event handlers */
	custom?: Record<string, string>;
}
```

### 9. Supporting Interfaces

```typescript
/** Form script interface */
interface FormScript {
	/** Script identifier */
	name: string;
	
	/** Script code */
	code: string;
	
	/** Script type */
	type: 'javascript' | 'typescript';
	
	/** When to execute script */
	trigger?: 'load' | 'change' | 'submit' | 'custom';
	
	/** Script dependencies */
	dependencies?: string[];
}

/** Form metadata interface */
interface FormMetadata {
	/** Form version */
	version?: string;
	
	/** Form creation timestamp */
	created_at?: string;
	
	/** Form last modified timestamp */
	modified_at?: string;
	
	/** Form author */
	author?: string;
	
	/** Form description */
	description?: string;
	
	/** Form tags */
	tags?: string[];
	
	/** Custom metadata */
	custom?: Record<string, any>;
}
```

## Integration with DocType Types

The Form Schema Types will integrate with the existing DocType types as follows:

1. **FormField extends DocField**: FormField includes all DocField properties plus form-specific ones
2. **FormSchema references DocType**: FormSchema.doctype corresponds to DocType.name
3. **Field mapping**: FormField properties map directly to DocField properties
4. **Validation inheritance**: DocField.validate maps to FormField.validation
5. **Dependency handling**: DocField.depends_on maps to FormField.depends_on

## Type Relationships Diagram

```mermaid
graph TD
    A[FormSchema] --> B[FormLayout]
    A --> C[FormTab[]]
    A --> D[FormSection[]]
    A --> E[ValidationRule[]]
    A --> F[FormEvent]
    
    C --> G[FormTab]
    G --> D
    
    D --> H[FormSection]
    H --> I[FormColumn[]]
    H --> J[FormField[]]
    
    I --> K[FormColumn]
    K --> J
    
    J --> L[FormField]
    L --> E
    
    M[DocType] --> A
    N[DocField] --> L
```

## Implementation Plan

### Phase 1: Core Type Definitions
1. Create the basic interface definitions
2. Implement type guards and utility functions
3. Set up basic testing infrastructure
4. Ensure type compatibility with existing DocType types

### Phase 2: Advanced Features
1. Implement validation rule processing
2. Add event handling capabilities
3. Create form layout algorithms
4. Implement dependency resolution

### Phase 3: Integration & Testing
1. Integrate with DocType engine
2. Create comprehensive test suite
3. Performance optimization
4. Documentation completion

## File Structure and Organization

### Primary Files

```
src/lib/meta/form/
├── types.ts              # Main form schema types
├── index.ts              # Export barrel
├── utils.ts              # Utility functions and type guards
├── constants.ts          # Form-related constants
├── validators.ts         # Built-in validation functions
├── helpers.ts            # Helper functions for form processing
└── __tests__/            # Test files
    ├── types.test.ts     # Type compilation tests
    ├── utils.test.ts     # Utility function tests
    ├── validators.test.ts # Validation function tests
    ├── fixtures/         # Test fixtures
    │   ├── sample-form-schema.json
    │   ├── sample-doctype.json
    │   └── validation-examples.json
    └── integration/      # Integration tests
        ├── doctype-integration.test.ts
        └── migration-integration.test.ts
```

### Supporting Files

```
src/lib/meta/form/
├── builders/             # Form schema builders
│   ├── form-schema-builder.ts
│   ├── section-builder.ts
│   └── field-builder.ts
├── processors/           # Form data processors
│   ├── validation-processor.ts
│   ├── dependency-processor.ts
│   └── layout-processor.ts
└── adapters/             # Adapters for external systems
    ├── doctype-adapter.ts
    └── migration-adapter.ts
```

## Integration with Existing Components

### 1. DocType Integration

The Form Schema Types will integrate with the DocType system through:

```typescript
// Adapter pattern for converting DocType to FormSchema
class DocTypeFormAdapter {
 static toFormSchema(doctype: DocType): FormSchema {
  // Convert DocType fields to FormFields
  // Process Section Breaks into FormSections
  // Process Column Breaks into FormColumns
  // Process Tab Breaks into FormTabs
  // Generate validation rules from DocField properties
 }
 
 static toFormField(docField: DocField): FormField {
  // Map DocField properties to FormField
  // Convert validation expressions
  // Process dependencies
 }
}
```

### 2. Migration System Integration

Form schemas will adapt to schema changes:

```typescript
// Migration handler for form schemas
class FormSchemaMigrator {
 static migrateFormSchema(
  oldSchema: FormSchema,
  schemaDiff: SchemaDiff
 ): FormSchema {
  // Handle added fields
  // Handle removed fields
  // Handle modified fields
  // Update validation rules
  // Preserve form layout where possible
 }
}
```

### 3. Carbon-Svelte Integration

Form fields will map to Carbon components:

```typescript
// Field mapping interface
interface FieldMapping {
 fieldType: FieldType;
 component: string;
 props: Record<string, any>;
}

// Mapping registry
class FieldMappingRegistry {
 static getMapping(fieldType: FieldType): FieldMapping;
 static registerMapping(mapping: FieldMapping): void;
}
```

## Type Safety and Validation

### Type Guards

```typescript
// Type guard functions
function isFormSchema(obj: any): obj is FormSchema;
function isFormField(obj: any): obj is FormField;
function isValidationRule(obj: any): obj is ValidationRule;
```

### Validation Functions

```typescript
// Built-in validation functions
const ValidationFunctions = {
 required: (value: any) => value != null && value !== '',
 email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
 phone: (value: string) => /^\+?[\d\s-()]+$/.test(value),
 url: (value: string) => /^https?:\/\/.+/.test(value),
 number: (value: any) => !isNaN(Number(value)),
 integer: (value: any) => Number.isInteger(Number(value)),
 float: (value: any) => !isNaN(parseFloat(value)),
 // ... more validation functions
};
```

## Performance Considerations

### 1. Lazy Loading
- Tab content should be loaded on demand
- Validation rules should be evaluated only when needed
- Large forms should support virtual scrolling

### 2. Caching
- Form schemas should be cached after generation
- Validation results should be cached where appropriate
- Dependency resolution should be memoized

### 3. Optimization
- Minimize re-renders on field changes
- Batch validation operations
- Use efficient dependency resolution algorithms

## Security Considerations

### 1. Input Validation
- All form inputs must be validated server-side
- Client-side validation is for UX only
- Sanitize all user-provided validation expressions

### 2. Expression Evaluation
- Validation expressions should be evaluated in a sandbox
- Limit access to global objects
- Prevent infinite loops in expressions

### 3. Permission Handling
- Form fields should respect user permissions
- Hidden fields should not contain sensitive data
- Read-only fields should be enforced server-side

## Testing Strategy

### 1. Unit Tests
- Type compilation tests
- Function behavior tests
- Edge case handling tests

### 2. Integration Tests
- DocType to FormSchema conversion
- Migration compatibility
- Component mapping tests

### 3. Performance Tests
- Large form rendering
- Validation performance
- Memory usage tests

### 4. Security Tests
- Input validation tests
- Expression injection tests
- Permission bypass tests

## Documentation Requirements

### 1. API Documentation
- Complete interface documentation
- Function signature documentation
- Usage examples

### 2. Integration Guide
- How to integrate with DocType system
- Migration handling procedures
- Custom component integration

### 3. Best Practices
- Form design guidelines
- Performance optimization tips
- Security considerations

## Future Enhancements

The architecture supports future additions:

### 1. Advanced Form Features
- Multi-step forms
- Conditional form flows
- Form wizards
- Dynamic field generation

### 2. Enhanced Validation
- Cross-field validation
- Async validation
- Custom validation rules
- Validation rule chaining

### 3. UI Enhancements
- Form themes
- Responsive layouts
- Accessibility features
- Internationalization support

### 4. Performance Optimizations
- Form virtualization
- Incremental loading
- Client-side caching
- Server-side rendering

### 5. Developer Tools
- Form builder UI
- Validation rule editor
- Form preview tools
- Debug utilities