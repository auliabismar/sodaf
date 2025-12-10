# P3-007: Form Field Components - Implementation Plan

## Overview

This document outlines the implementation plan for P3-007: Form Field Components, which involves creating 30+ Svelte components for each field type using Carbon Design System components.

## Dependencies

- **P2-011**: Field validation and types (assumed to be completed)
- **P3-006**: Form Controller and types (already implemented)

## Architecture

### Component Structure

```
src/lib/desk/form/fields/
├── BaseField.svelte          # Base component with common functionality
├── DataField.svelte          # Single line text input
├── IntField.svelte           # Integer number input
├── FloatField.svelte         # Decimal number input
├── CurrencyField.svelte      # Currency with formatting
├── PercentField.svelte       # Percentage (0-100)
├── CheckField.svelte         # Checkbox
├── SelectField.svelte        # Dropdown selection
├── LinkField.svelte          # Link to another DocType
├── DynamicLinkField.svelte   # Dynamic link based on another field
├── DateField.svelte          # Date picker
├── DatetimeField.svelte      # Date and time picker
├── TimeField.svelte          # Time picker
├── DurationField.svelte      # Duration input
├── TextField.svelte          # Multiline text area
├── SmallTextField.svelte    # Small text area
├── TextEditorField.svelte    # Rich text editor
├── CodeField.svelte          # Code editor with syntax highlighting
├── HTMLField.svelte          # HTML content display
├── MarkdownField.svelte      # Markdown editor
├── AttachField.svelte        # File attachment
├── AttachImageField.svelte   # Image attachment with preview
├── TableField.svelte         # Child table
├── PasswordField.svelte      # Password field
├── ColorField.svelte         # Color picker
├── RatingField.svelte        # Star rating
├── SignatureField.svelte     # Digital signature
├── GeolocationField.svelte   # GPS coordinates
├── ReadOnlyField.svelte      # Read-only display
└── FieldRenderer.svelte      # Dynamic field component selector
```

### BaseField Component Architecture

The `BaseField.svelte` component will provide:

1. **Common Props Interface**:
   ```typescript
   interface BaseFieldProps {
       field: DocField;
       value: any;
       error?: string;
       disabled?: boolean;
       readonly?: boolean;
       required?: boolean;
       description?: string;
       onchange?: (value: any) => void;
       onblur?: () => void;
   }
   ```

2. **Common Functionality**:
   - Required indicator (asterisk)
   - Error message display
   - Description tooltip
   - Label rendering
   - Disabled/readonly state handling
   - Consistent styling and layout

3. **Slot System**:
   - Default slot for the actual input component
   - Named slots for additional elements (prefix, suffix, actions)

## Component Implementation Groups

### Group 1: Foundation
- **BaseField.svelte**: Common functionality and layout
- **FieldRenderer.svelte**: Dynamic component selection based on fieldtype

### Group 2: Basic Input Fields
- **DataField.svelte**: Uses Carbon `TextInput`
- **IntField.svelte**: Uses Carbon `NumberInput` with step=1
- **FloatField.svelte**: Uses Carbon `NumberInput` with decimal step
- **CurrencyField.svelte**: Uses Carbon `TextInput` with currency formatting
- **PercentField.svelte**: Uses Carbon `NumberInput` with 0-100 range

### Group 3: Selection Fields
- **CheckField.svelte**: Uses Carbon `Checkbox`
- **SelectField.svelte**: Uses Carbon `Select` or `Dropdown`

### Group 4: Link Fields
- **LinkField.svelte**: Uses Carbon `ComboBox` with search functionality
- **DynamicLinkField.svelte**: Dynamic DocType selection based on options field

### Group 5: Date/Time Fields
- **DateField.svelte**: Uses Carbon `DatePicker`
- **DatetimeField.svelte**: Uses Carbon `DatePicker` with time selection
- **TimeField.svelte**: Uses Carbon `TimePicker`
- **DurationField.svelte**: Custom component with days, hours, minutes inputs

### Group 6: Text Fields
- **TextField.svelte**: Uses Carbon `TextArea`
- **SmallTextField.svelte**: Uses Carbon `TextArea` with smaller size

### Group 7: Rich Content Fields
- **TextEditorField.svelte**: WYSIWYG editor (may need additional library)
- **CodeField.svelte**: Code editor with syntax highlighting
- **HTMLField.svelte**: HTML content display
- **MarkdownField.svelte**: Markdown editor

### Group 8: File Fields
- **AttachField.svelte**: File upload with preview
- **AttachImageField.svelte**: Image upload with preview and crop

### Group 9: Specialized Fields
- **PasswordField.svelte**: Uses Carbon `TextInput` with password type
- **ColorField.svelte**: Uses Carbon `ColorPicker`
- **RatingField.svelte**: Star rating component
- **SignatureField.svelte**: Canvas-based signature drawing
- **GeolocationField.svelte**: Map integration with marker

### Group 10: Complex Fields
- **TableField.svelte**: Child table with add/remove/reorder functionality
- **ReadOnlyField.svelte**: Read-only display for any field type

## Carbon Components Mapping

| Field Type | Carbon Component | Additional Features |
|------------|------------------|---------------------|
| Data | TextInput | - |
| Int | NumberInput | step=1 |
| Float | NumberInput | decimal step |
| Currency | TextInput | prefix/suffix formatting |
| Percent | NumberInput | 0-100 range, % suffix |
| Check | Checkbox | - |
| Select | Select/Dropdown | options from field.options |
| Link | ComboBox | search functionality |
| Date | DatePicker | - |
| Time | TimePicker | - |
| Text | TextArea | multiline |
| Password | TextInput | password type |
| Color | ColorPicker | - |

## Integration with Form Controller

All field components will integrate with the `FormController` through:

1. **Two-way Binding**: Components accept `value` prop and emit `onchange` events
2. **Validation**: Display validation errors from `FormController`
3. **State Management**: Respect disabled/readonly states from controller
4. **Event Handling**: Trigger field change events in controller

## Testing Strategy

### Unit Tests
Each component will have comprehensive unit tests covering:
- Rendering with different props
- Value changes and events
- Validation error display
- Disabled/readonly states
- Required indicators
- Description tooltips

### Integration Tests
- Integration with `FormController`
- Field selection via `FieldRenderer`
- Form submission with various field types
- Validation workflow

### Test Cases from Backlog
All 34 test cases from P3-007-T1 to P3-007-T34 will be implemented.

## Implementation Details

### Field Component Template

Each field component will follow this structure:

```svelte
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import BaseField from './BaseField.svelte';
    import { TextInput } from 'carbon-components-svelte';
    import type { DocField } from '../../../meta/doctype/types';
    
    export let field: DocField;
    export let value: any;
    export let error?: string;
    export let disabled = false;
    export let readonly = false;
    
    const dispatch = createEventDispatcher();
    
    function handleChange(event: CustomEvent) {
        dispatch('change', event.detail);
    }
</script>

<BaseField {field} {error} {disabled} {readonly}>
    <TextInput
        value={value}
        disabled={disabled || readonly}
        placeholder={field.placeholder}
        on:change={handleChange}
    />
</BaseField>
```

### FieldRenderer Implementation

```svelte
<script lang="ts">
    import DataField from './DataField.svelte';
    import IntField from './IntField.svelte';
    // ... import all field components
    
    export let field: DocField;
    export let value: any;
    export let error?: string;
    export let disabled = false;
    export let readonly = false;
    
    $: fieldComponent = getFieldComponent(field.fieldtype);
    
    function getFieldComponent(fieldtype: string) {
        const componentMap = {
            'Data': DataField,
            'Int': IntField,
            'Float': FloatField,
            // ... map all field types
        };
        return componentMap[fieldtype] || DataField;
    }
</script>

<svelte:component this={fieldComponent} 
    {field} {value} {error} {disabled} {readonly}
    on:change
/>
```

## Accessibility Considerations

1. **ARIA Labels**: Proper labels and descriptions
2. **Keyboard Navigation**: Tab order and shortcuts
3. **Screen Reader Support**: Announce changes and errors
4. **Focus Management**: Proper focus handling
5. **Color Contrast**: Ensure WCAG compliance

## Performance Considerations

1. **Lazy Loading**: Load rich editors only when needed
2. **Component Reuse**: Share common functionality
3. **Event Debouncing**: For rapid input changes
4. **Memory Management**: Clean up event listeners

## Next Steps

1. Create the fields directory structure
2. Implement BaseField component with common functionality
3. Implement field components in logical groups
4. Create FieldRenderer for dynamic component selection
5. Write comprehensive tests
6. Update form module exports
7. Integration testing with FormController

## Acceptance Criteria

- [ ] All 30+ field types implemented
- [ ] Proper Carbon components used
- [ ] Validation display working
- [ ] Accessibility features implemented
- [ ] All test cases passing
- [ ] Integration with FormController working
- [ ] Error handling and edge cases covered