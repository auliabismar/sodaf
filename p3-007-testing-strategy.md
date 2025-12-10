# P3-007 Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for P3-007 Form Field Components, covering all 34 test cases specified in the backlog.

## Test Structure

### Test File Organization

```
src/lib/desk/form/fields/__tests__/
├── BaseField.test.ts
├── DataField.test.ts
├── IntField.test.ts
├── FloatField.test.ts
├── CurrencyField.test.ts
├── PercentField.test.ts
├── CheckField.test.ts
├── SelectField.test.ts
├── LinkField.test.ts
├── DynamicLinkField.test.ts
├── DateField.test.ts
├── DatetimeField.test.ts
├── TimeField.test.ts
├── DurationField.test.ts
├── TextField.test.ts
├── SmallTextField.test.ts
├── TextEditorField.test.ts
├── CodeField.test.ts
├── HTMLField.test.ts
├── MarkdownField.test.ts
├── AttachField.test.ts
├── AttachImageField.test.ts
├── TableField.test.ts
├── PasswordField.test.ts
├── ColorField.test.ts
├── RatingField.test.ts
├── SignatureField.test.ts
├── GeolocationField.test.ts
├── ReadOnlyField.test.ts
├── FieldRenderer.test.ts
├── integration/
│   ├── FormController.test.ts
│   ├── FieldValidation.test.ts
│   └── FieldEvents.test.ts
└── fixtures/
    ├── mockFields.ts
    ├── mockDocTypes.ts
    └── testUtils.ts
```

## Test Cases Mapping

### Basic Input Fields (P3-007-T1 to T5)

```typescript
// DataField.test.ts
describe('DataField', () => {
    // P3-007-T1: DataField renders TextInput
    it('renders TextInput component', async () => {
        const field = createMockField({ fieldtype: 'Data' });
        const { getByRole } = render(DataField, { props: { field, value: '' } });
        
        expect(getByRole('textbox')).toBeInTheDocument();
        expect(getByRole('textbox')).toHaveClass('cds--text-input');
    });

    // P3-007-T33: Value binding works
    it('supports two-way value binding', async () => {
        const field = createMockField({ fieldtype: 'Data' });
        const { getByRole, component } = render(DataField, { props: { field, value: '' } });
        
        const input = getByRole('textbox');
        await fireEvent.input(input, { target: { value: 'test' } });
        
        expect(component.value).toBe('test');
    });

    // P3-007-T34: Change event emitted
    it('emits change event on value change', async () => {
        const field = createMockField({ fieldtype: 'Data' });
        const { getByRole, component } = render(DataField, { props: { field, value: '' } });
        
        const onChange = vi.fn();
        component.$on('change', onChange);
        
        const input = getByRole('textbox');
        await fireEvent.input(input, { target: { value: 'test' } });
        
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
            detail: 'test'
        }));
    });
});

// IntField.test.ts
describe('IntField', () => {
    // P3-007-T2: IntField renders NumberInput
    it('renders NumberInput with step=1', async () => {
        const field = createMockField({ fieldtype: 'Int' });
        const { getByRole } = render(IntField, { props: { field, value: 0 } });
        
        const input = getByRole('spinbutton');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('step', '1');
    });

    // P3-007-T2: Integer only validation
    it('accepts only integer values', async () => {
        const field = createMockField({ fieldtype: 'Int' });
        const { getByRole, component } = render(IntField, { props: { field, value: 0 } });
        
        const input = getByRole('spinbutton');
        await fireEvent.input(input, { target: { value: '123.45' } });
        
        // Should round or reject decimal values
        expect(component.value).toBe(123);
    });
});

// FloatField.test.ts
describe('FloatField', () => {
    // P3-007-T3: FloatField renders NumberInput
    it('renders NumberInput with decimal step', async () => {
        const field = createMockField({ fieldtype: 'Float', precision: 2 });
        const { getByRole } = render(FloatField, { props: { field, value: 0 } });
        
        const input = getByRole('spinbutton');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('step', '0.01');
    });
});

// CurrencyField.test.ts
describe('CurrencyField', () => {
    // P3-007-T4: CurrencyField formatting
    it('formats currency with symbol and decimal places', async () => {
        const field = createMockField({ fieldtype: 'Currency', options: 'USD' });
        const { component } = render(CurrencyField, { props: { field, value: 1234.56 } });
        
        expect(component.formattedValue).toBe('$1,234.56');
    });
});

// PercentField.test.ts
describe('PercentField', () => {
    // P3-007-T5: PercentField range
    it('enforces 0-100 range with % suffix', async () => {
        const field = createMockField({ fieldtype: 'Percent' });
        const { getByRole, component } = render(PercentField, { props: { field, value: 50 } });
        
        const input = getByRole('spinbutton');
        expect(input).toHaveAttribute('min', '0');
        expect(input).toHaveAttribute('max', '100');
        
        expect(component.displayValue).toBe('50%');
    });
});
```

### Selection Fields (P3-007-T6 to T7)

```typescript
// CheckField.test.ts
describe('CheckField', () => {
    // P3-007-T6: CheckField renders Checkbox
    it('renders Checkbox component', async () => {
        const field = createMockField({ fieldtype: 'Check' });
        const { getByRole } = render(CheckField, { props: { field, value: false } });
        
        const checkbox = getByRole('checkbox');
        expect(checkbox).toBeInTheDocument();
        expect(checkbox).not.toBeChecked();
    });

    it('toggles value on click', async () => {
        const field = createMockField({ fieldtype: 'Check' });
        const { getByRole, component } = render(CheckField, { props: { field, value: false } });
        
        const checkbox = getByRole('checkbox');
        await fireEvent.click(checkbox);
        
        expect(component.value).toBe(true);
        expect(checkbox).toBeChecked();
    });
});

// SelectField.test.ts
describe('SelectField', () => {
    // P3-007-T7: SelectField renders Dropdown
    it('renders Dropdown with options from field.options', async () => {
        const field = createMockField({ 
            fieldtype: 'Select', 
            options: 'Option 1\nOption 2\nOption 3' 
        });
        const { getByRole, getByText } = render(SelectField, { props: { field, value: '' } });
        
        const combobox = getByRole('combobox');
        expect(combobox).toBeInTheDocument();
        
        // Open dropdown
        await fireEvent.click(combobox);
        
        expect(getByText('Option 1')).toBeInTheDocument();
        expect(getByText('Option 2')).toBeInTheDocument();
        expect(getByText('Option 3')).toBeInTheDocument();
    });
});
```

### Link Fields (P3-007-T8 to T11)

```typescript
// LinkField.test.ts
describe('LinkField', () => {
    // P3-007-T8: LinkField renders ComboBox
    it('renders ComboBox for searching linked doctype', async () => {
        const field = createMockField({ fieldtype: 'Link', options: 'User' });
        const { getByRole } = render(LinkField, { props: { field, value: '' } });
        
        const combobox = getByRole('combobox');
        expect(combobox).toBeInTheDocument();
    });

    // P3-007-T9: LinkField creates new
    it('shows quick create button for new documents', async () => {
        const field = createMockField({ fieldtype: 'Link', options: 'User' });
        const { getByText } = render(LinkField, { props: { field, value: '' } });
        
        // Look for add/create button
        expect(getByText('Create New')).toBeInTheDocument();
    });

    // P3-007-T10: LinkField filters
    it('respects get_query filters from field options', async () => {
        const field = createMockField({ 
            fieldtype: 'Link', 
            options: 'User',
            get_query: `SELECT name FROM tabUser WHERE status='Active'`
        });
        const { component } = render(LinkField, { props: { field, value: '' } });
        
        expect(component.queryFilters).toEqual({ status: 'Active' });
    });
});

// DynamicLinkField.test.ts
describe('DynamicLinkField', () => {
    // P3-007-T11: DynamicLinkField
    it('determines DocType from options field', async () => {
        const field = createMockField({ 
            fieldtype: 'Dynamic Link', 
            options: 'reference_type' 
        });
        const { component } = render(DynamicLinkField, { 
            props: { 
                field, 
                value: '',
                doc: { reference_type: 'User' }
            } 
        });
        
        expect(component.targetDocType).toBe('User');
    });
});
```

### Date/Time Fields (P3-007-T12 to T15)

```typescript
// DateField.test.ts
describe('DateField', () => {
    // P3-007-T12: DateField renders DatePicker
    it('renders DatePicker component', async () => {
        const field = createMockField({ fieldtype: 'Date' });
        const { getByRole } = render(DateField, { props: { field, value: '' } });
        
        // Carbon DatePicker uses a button to open calendar
        const calendarButton = getByRole('button');
        expect(calendarButton).toBeInTheDocument();
    });

    it('handles date selection', async () => {
        const field = createMockField({ fieldtype: 'Date' });
        const { component, getByRole } = render(DateField, { props: { field, value: '' } });
        
        const calendarButton = getByRole('button');
        await fireEvent.click(calendarButton);
        
        // Select a date (implementation depends on Carbon DatePicker)
        const selectedDate = new Date('2024-01-15');
        await fireEvent.change(getByRole('textbox'), { 
            target: { value: '2024-01-15' } 
        });
        
        expect(component.value).toBe('2024-01-15');
    });
});

// DatetimeField.test.ts
describe('DatetimeField', () => {
    // P3-007-T13: DatetimeField
    it('renders date and time selection', async () => {
        const field = createMockField({ fieldtype: 'Datetime' });
        const { getByRole } = render(DatetimeField, { props: { field, value: '' } });
        
        // Should have both date and time inputs
        const dateInput = getByRole('textbox', { name: /date/i });
        const timeInput = getByRole('textbox', { name: /time/i });
        
        expect(dateInput).toBeInTheDocument();
        expect(timeInput).toBeInTheDocument();
    });
});

// TimeField.test.ts
describe('TimeField', () => {
    // P3-007-T14: TimeField renders TimePicker
    it('renders TimePicker component', async () => {
        const field = createMockField({ fieldtype: 'Time' });
        const { getByRole } = render(TimeField, { props: { field, value: '' } });
        
        const timeInput = getByRole('textbox', { name: /time/i });
        expect(timeInput).toBeInTheDocument();
    });
});

// DurationField.test.ts
describe('DurationField', () => {
    // P3-007-T15: DurationField
    it('provides days, hours, minutes input', async () => {
        const field = createMockField({ fieldtype: 'Duration' });
        const { getByRole } = render(DurationField, { props: { field, value: '' } });
        
        const daysInput = getByRole('spinbutton', { name: /days/i });
        const hoursInput = getByRole('spinbutton', { name: /hours/i });
        const minutesInput = getByRole('spinbutton', { name: /minutes/i });
        
        expect(daysInput).toBeInTheDocument();
        expect(hoursInput).toBeInTheDocument();
        expect(minutesInput).toBeInTheDocument();
    });
});
```

### Text Fields (P3-007-T16)

```typescript
// TextField.test.ts
describe('TextField', () => {
    // P3-007-T16: TextField renders TextArea
    it('renders TextArea for multiline input', async () => {
        const field = createMockField({ fieldtype: 'Long Text' });
        const { getByRole } = render(TextField, { props: { field, value: '' } });
        
        const textarea = getByRole('textbox');
        expect(textarea).toBeInTheDocument();
        expect(textarea).toHaveAttribute('rows');
    });
});
```

### Rich Content Fields (P3-007-T17 to T18)

```typescript
// TextEditorField.test.ts
describe('TextEditorField', () => {
    // P3-007-T17: TextEditorField
    it('renders WYSIWYG editor', async () => {
        const field = createMockField({ fieldtype: 'Text Editor' });
        const { getByRole } = render(TextEditorField, { props: { field, value: '' } });
        
        // TipTap editor renders as contenteditable div
        const editor = getByRole('textbox');
        expect(editor).toHaveAttribute('contenteditable', 'true');
    });

    it('provides toolbar with formatting options', async () => {
        const field = createMockField({ fieldtype: 'Text Editor' });
        const { getByRole, getByLabelText } = render(TextEditorField, { props: { field, value: '' } });
        
        expect(getByLabelText('Bold')).toBeInTheDocument();
        expect(getByLabelText('Italic')).toBeInTheDocument();
        expect(getByLabelText('Bullet List')).toBeInTheDocument();
    });
});

// CodeField.test.ts
describe('CodeField', () => {
    // P3-007-T18: CodeField syntax highlight
    it('applies syntax highlighting based on options', async () => {
        const field = createMockField({ fieldtype: 'Code', options: 'javascript' });
        const { container } = render(CodeField, { props: { field, value: 'const x = 1;' } });
        
        // CodeMirror should apply syntax highlighting classes
        expect(container.querySelector('.cm-keyword')).toBeInTheDocument();
        expect(container.querySelector('.cm-variable')).toBeInTheDocument();
    });
});
```

### Table Field (P3-007-T19 to T20)

```typescript
// TableField.test.ts
describe('TableField', () => {
    // P3-007-T19: TableField editable grid
    it('renders editable grid with add/remove/reorder', async () => {
        const field = createMockField({ fieldtype: 'Table', options: 'ChildDocType' });
        const { getByRole, getByLabelText } = render(TableField, { 
            props: { field, value: [] } 
        });
        
        // Should have data table
        expect(getByRole('grid')).toBeInTheDocument();
        
        // Should have add row button
        expect(getByLabelText('Add Row')).toBeInTheDocument();
    });

    // P3-007-T20: TableField child validation
    it('validates child rows', async () => {
        const field = createMockField({ fieldtype: 'Table', options: 'ChildDocType' });
        const { component, getByRole } = render(TableField, { 
            props: { field, value: [] } 
        });
        
        // Add a row with invalid data
        await fireEvent.click(getByLabelText('Add Row'));
        
        // Check validation
        expect(component.hasValidationErrors).toBe(true);
    });
});
```

### File Fields (P3-007-T21 to T22)

```typescript
// AttachField.test.ts
describe('AttachField', () => {
    // P3-007-T21: AttachField file upload
    it('handles file upload and preview', async () => {
        const field = createMockField({ fieldtype: 'Attach' });
        const { getByRole, getByText } = render(AttachField, { props: { field, value: '' } });
        
        const fileInput = getByRole('button', { name: /upload/i });
        expect(fileInput).toBeInTheDocument();
        
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        await fireEvent.change(fileInput, { target: { files: [file] } });
        
        expect(getByText('test.txt')).toBeInTheDocument();
    });
});

// AttachImageField.test.ts
describe('AttachImageField', () => {
    // P3-007-T22: AttachImageField
    it('provides image preview and crop', async () => {
        const field = createMockField({ fieldtype: 'Attach Image' });
        const { getByRole, getByAltText } = render(AttachImageField, { 
            props: { field, value: '' } 
        });
        
        const fileInput = getByRole('button', { name: /upload/i });
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        await fireEvent.change(fileInput, { target: { files: [file] } });
        
        const image = getByAltText('Preview');
        expect(image).toBeInTheDocument();
        
        // Should have crop button
        expect(getByRole('button', { name: /crop/i })).toBeInTheDocument();
    });
});
```

### Specialized Fields (P3-007-T23 to T27)

```typescript
// PasswordField.test.ts
describe('PasswordField', () => {
    // P3-007-T23: PasswordField hidden
    it('hides password text', async () => {
        const field = createMockField({ fieldtype: 'Password' });
        const { getByRole } = render(PasswordField, { props: { field, value: 'secret' } });
        
        const input = getByRole('textbox', { name: /password/i });
        expect(input).toHaveAttribute('type', 'password');
        expect(input).not.toHaveDisplayValue('secret');
    });
});

// ColorField.test.ts
describe('ColorField', () => {
    // P3-007-T24: ColorField picker
    it('provides color picker UI', async () => {
        const field = createMockField({ fieldtype: 'Color' });
        const { getByRole } = render(ColorField, { props: { field, value: '#FF0000' } });
        
        const colorButton = getByRole('button', { name: /color/i });
        expect(colorButton).toBeInTheDocument();
        
        await fireEvent.click(colorButton);
        
        // Color picker should open
        expect(getByRole('dialog', { name: /color picker/i })).toBeInTheDocument();
    });
});

// RatingField.test.ts
describe('RatingField', () => {
    // P3-007-T25: RatingField stars
    it('renders star rating selection', async () => {
        const field = createMockField({ fieldtype: 'Rating' });
        const { getByRole } = render(RatingField, { props: { field, value: 3 } });
        
        // Should have 5 stars
        const stars = getAllByRole('button', { name: /star/i });
        expect(stars).toHaveLength(5);
        
        // 3 stars should be selected
        expect(stars.slice(0, 3).every(star => 
            star.classList.contains('selected')
        )).toBe(true);
    });
});

// SignatureField.test.ts
describe('SignatureField', () => {
    // P3-007-T26: SignatureField canvas
    it('provides signature drawing canvas', async () => {
        const field = createMockField({ fieldtype: 'Signature' });
        const { getByRole } = render(SignatureField, { props: { field, value: '' } });
        
        const canvas = getByRole('img', { name: /signature/i });
        expect(canvas).toBeInTheDocument();
        expect(canvas.tagName).toBe('CANVAS');
    });
});

// GeolocationField.test.ts
describe('GeolocationField', () => {
    // P3-007-T27: GeolocationField map
    it('renders map with marker', async () => {
        const field = createMockField({ fieldtype: 'Geolocation' });
        const { container } = render(GeolocationField, { 
            props: { field, value: { lat: 40.7128, lng: -74.0060 } } 
        });
        
        // Leaflet map container
        expect(container.querySelector('.leaflet-container')).toBeInTheDocument();
    });
});
```

### Common Field Features (P3-007-T28 to T31)

```typescript
// BaseField.test.ts
describe('BaseField', () => {
    // P3-007-T28: Required indicator
    it('shows asterisk on required fields', async () => {
        const field = createMockField({ fieldname: 'test', required: true });
        const { getByText } = render(BaseField, { props: { field, value: '' } });
        
        expect(getByText('Test *')).toBeInTheDocument();
    });

    // P3-007-T29: Read-only state
    it('disables input when read_only', async () => {
        const field = createMockField({ fieldname: 'test', read_only: true });
        const { getByRole } = render(BaseField, { 
            props: { field, value: '', readonly: true } 
        });
        
        const input = getByRole('textbox');
        expect(input).toBeDisabled();
    });

    // P3-007-T30: Error display
    it('displays error message', async () => {
        const field = createMockField({ fieldname: 'test' });
        const { getByText } = render(BaseField, { 
            props: { field, value: '', error: 'This field is required' } 
        });
        
        expect(getByText('This field is required')).toBeInTheDocument();
        expect(getByText('This field is required')).toHaveClass('error-message');
    });

    // P3-007-T31: Description tooltip
    it('shows help text on hover', async () => {
        const field = createMockField({ 
            fieldname: 'test', 
            description: 'This is a helpful description' 
        });
        const { getByRole, getByText } = render(BaseField, { props: { field, value: '' } });
        
        const infoButton = getByRole('button', { name: /information/i });
        expect(infoButton).toBeInTheDocument();
        
        await fireEvent.mouseEnter(infoButton);
        expect(getByText('This is a helpful description')).toBeInTheDocument();
    });
});
```

### FieldRenderer (P3-007-T32)

```typescript
// FieldRenderer.test.ts
describe('FieldRenderer', () => {
    // P3-007-T32: FieldRenderer dynamic
    it('picks correct component based on fieldtype', async () => {
        const dataField = createMockField({ fieldtype: 'Data' });
        const { component: dataComponent } = render(FieldRenderer, { 
            props: { field: dataField, value: '' } 
        });
        expect(dataComponent.constructor.name).toBe('DataField');
        
        const intField = createMockField({ fieldtype: 'Int' });
        const { component: intComponent } = render(FieldRenderer, { 
            props: { field: intField, value: 0 } 
        });
        expect(intComponent.constructor.name).toBe('IntField');
        
        const selectField = createMockField({ fieldtype: 'Select' });
        const { component: selectComponent } = render(FieldRenderer, { 
            props: { field: selectField, value: '' } 
        });
        expect(selectComponent.constructor.name).toBe('SelectField');
    });
});
```

## Test Utilities

### Mock Field Factory

```typescript
// src/lib/desk/form/fields/__tests__/fixtures/mockFields.ts
import type { DocField } from '../../../../meta/doctype/types';

export function createMockField(overrides: Partial<DocField> = {}): DocField {
    return {
        fieldname: 'test_field',
        label: 'Test Field',
        fieldtype: 'Data',
        required: false,
        unique: false,
        hidden: false,
        read_only: false,
        ...overrides
    };
}

export function createMockDocType(fields: DocField[] = []) {
    return {
        name: 'TestDocType',
        module: 'Test',
        fields: fields.length > 0 ? fields : [createMockField()],
        permissions: [],
        indexes: [],
        __newname: 'TestDocType'
    };
}
```

### Test Helpers

```typescript
// src/lib/desk/form/fields/__tests__/fixtures/testUtils.ts
import { render, RenderResult } from '@testing-library/svelte';
import type { ComponentType } from 'svelte';

interface RenderOptions {
    props?: Record<string, any>;
    target?: HTMLElement;
    context?: Map<any, any>;
}

export async function renderWithProps<T extends ComponentType>(
    component: T,
    options: RenderOptions = {}
): Promise<RenderResult<T>> {
    return render(component, {
        props: {
            field: createMockField(),
            value: '',
            error: '',
            disabled: false,
            readonly: false,
            ...options.props
        },
        target: options.target,
        context: options.context
    });
}

export function createMockFile(name: string, type: string): File {
    return new File(['test'], name, { type });
}

export function createMockEvent(type: string, detail: any = {}): CustomEvent {
    return new CustomEvent(type, { detail });
}
```

## Integration Tests

### FormController Integration

```typescript
// src/lib/desk/form/fields/__tests__/integration/FormController.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import FormController from '../../form-controller';
import FieldRenderer from '../FieldRenderer';
import { createMockField, createMockDocType } from '../fixtures/mockFields';

describe('Field Integration with FormController', () => {
    let controller: FormController;
    
    beforeEach(async () => {
        controller = new FormController('TestDocType');
        await controller.load();
    });
    
    it('updates FormController on field change', async () => {
        const field = createMockField({ fieldname: 'name' });
        const { component } = render(FieldRenderer, {
            props: { field, value: '', controller }
        });
        
        component.$on('change', (event) => {
            controller.setValue(field.fieldname, event.detail);
        });
        
        await fireEvent.change(component.querySelector('input'), {
            target: { value: 'Test Name' }
        });
        
        expect(controller.getValue('name')).toBe('Test Name');
    });
});
```

## Performance Testing

### Bundle Size Impact

```typescript
// src/lib/desk/form/fields/__tests__/performance/bundle-size.test.ts
describe('Bundle Size Impact', () => {
    it('should not significantly increase bundle size', async () => {
        // Test that lazy loading works for heavy components
        const { default: TextEditorField } = await import('../TextEditorField.svelte');
        expect(TextEditorField).toBeDefined();
        
        // Verify that heavy libraries are loaded only when needed
        const tipTapLoaded = !!window.tiptap;
        expect(tipTapLoaded).toBe(false);
    });
});
```

## Accessibility Testing

### ARIA Compliance

```typescript
// src/lib/desk/form/fields/__tests__/accessibility/aria.test.ts
import { render, axe } from 'jest-axe';
import { createMockField } from '../fixtures/mockFields';

describe('Field Accessibility', () => {
    it('should not have accessibility violations', async () => {
        const field = createMockField({ required: true, description: 'Test description' });
        const { container } = render(DataField, { props: { field, value: '' } });
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
```

## Test Coverage Requirements

- **Unit Tests**: 100% line coverage for all field components
- **Integration Tests**: Cover all FormController interactions
- **Accessibility Tests**: All components must pass axe-core validation
- **Performance Tests**: Verify lazy loading and bundle size impact
- **E2E Tests**: Complete form workflows with different field types

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test-p3-007.yml
name: P3-007 Form Field Tests

on:
  push:
    paths:
      - 'src/lib/desk/form/fields/**'
  pull_request:
    paths:
      - 'src/lib/desk/form/fields/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - run: npm ci
      - run: npm run test:fields
      - run: npm run test:accessibility
      - run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

This comprehensive testing strategy ensures all 34 test cases from the backlog are covered, along with additional integration, accessibility, and performance testing.