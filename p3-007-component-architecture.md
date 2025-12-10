# P3-007 Component Architecture

## Component Hierarchy

```mermaid
graph TD
    A[FormView.svelte] --> B[FieldRenderer.svelte]
    B --> C[BaseField.svelte]
    C --> D[Field Components]
    
    D --> E[Basic Inputs]
    D --> F[Selection Fields]
    D --> G[Link Fields]
    D --> H[Date/Time Fields]
    D --> I[Text Fields]
    D --> J[Rich Content Fields]
    D --> K[File Fields]
    D --> L[Specialized Fields]
    D --> M[Complex Fields]
    
    E --> E1[DataField.svelte]
    E --> E2[IntField.svelte]
    E --> E3[FloatField.svelte]
    E --> E4[CurrencyField.svelte]
    E --> E5[PercentField.svelte]
    
    F --> F1[CheckField.svelte]
    F --> F2[SelectField.svelte]
    
    G --> G1[LinkField.svelte]
    G --> G2[DynamicLinkField.svelte]
    
    H --> H1[DateField.svelte]
    H --> H2[DatetimeField.svelte]
    H --> H3[TimeField.svelte]
    H --> H4[DurationField.svelte]
    
    I --> I1[TextField.svelte]
    I --> I2[SmallTextField.svelte]
    
    J --> J1[TextEditorField.svelte]
    J --> J2[CodeField.svelte]
    J --> J3[HTMLField.svelte]
    J --> J4[MarkdownField.svelte]
    
    K --> K1[AttachField.svelte]
    K --> K2[AttachImageField.svelte]
    
    L --> L1[PasswordField.svelte]
    L --> L2[ColorField.svelte]
    L --> L3[RatingField.svelte]
    L --> L4[SignatureField.svelte]
    L --> L5[GeolocationField.svelte]
    L --> L6[ReadOnlyField.svelte]
    
    M --> M1[TableField.svelte]
```

## Data Flow

```mermaid
sequenceDiagram
    participant FC as FormController
    participant FV as FormView
    participant FR as FieldRenderer
    participant BF as BaseField
    participant DF as DataField
    participant CC as CarbonComponent
    
    FV->>FC: subscribe to state
    FC->>FV: state updates
    FV->>FR: render field with DocField
    FR->>BF: field props + value
    BF->>DF: render specific field
    DF->>CC: Carbon component
    CC->>DF: user input
    DF->>BF: change event
    BF->>FR: change event
    FR->>FV: field change
    FV->>FC: update field value
    FC->>FV: new state
```

## Field Type Mapping

```mermaid
graph LR
    A[FieldType] --> B[Carbon Component]
    
    A1[Data] --> B1[TextInput]
    A2[Int] --> B2[NumberInput]
    A3[Float] --> B2
    A4[Currency] --> B1
    A5[Percent] --> B2
    A6[Check] --> B3[Checkbox]
    A7[Select] --> B4[Select/Dropdown]
    A8[Link] --> B5[ComboBox]
    A9[Date] --> B6[DatePicker]
    A10[Time] --> B7[TimePicker]
    A11[Text] --> B8[TextArea]
    A12[Password] --> B1
    A13[Color] --> B9[ColorPicker]
```

## Component Relationships

```mermaid
classDiagram
    class FormController {
        +doctype: string
        +store: Writable~FormViewState~
        +load(name)
        +save()
        +setValue(field, value)
        +getValue(field)
    }
    
    class BaseField {
        +field: DocField
        +value: any
        +error: string
        +disabled: boolean
        +readonly: boolean
        +required: boolean
        +description: string
    }
    
    class FieldRenderer {
        +field: DocField
        +value: any
        +error: string
        +disabled: boolean
        +readonly: boolean
        +getFieldComponent(fieldtype)
    }
    
    class DataField {
        +field: DocField
        +value: string
        +onchange(event)
    }
    
    class IntField {
        +field: DocField
        +value: number
        +step: 1
        +onchange(event)
    }
    
    FormController --> FormView
    FormView --> FieldRenderer
    FieldRenderer --> BaseField
    BaseField <|-- DataField
    BaseField <|-- IntField
    FieldRenderer --> DataField
    FieldRenderer --> IntField
```

## State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> Loaded
    Loaded --> Editing
    Editing --> Validating
    Validating --> Valid
    Validating --> Invalid
    Invalid --> Editing
    Valid --> Saving
    Saving --> Saved
    Saving --> Error
    Error --> Editing
    Saved --> [*]
```

## Testing Architecture

```mermaid
graph TD
    A[Unit Tests] --> B[Component Tests]
    A --> C[Function Tests]
    B --> D[Rendering Tests]
    B --> E[Event Tests]
    B --> F[Validation Tests]
    C --> G[FieldRenderer Tests]
    C --> H[BaseField Tests]
    
    I[Integration Tests] --> J[FormController Integration]
    I --> K[Field Type Tests]
    I --> L[Workflow Tests]
    
    M[E2E Tests] --> N[Form Submission]
    M --> O[Field Navigation]
    M --> P[Validation Flow]