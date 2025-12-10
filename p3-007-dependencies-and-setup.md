# P3-007 Dependencies and Setup

## Additional Dependencies Required

Based on the implementation preferences, the following additional packages need to be installed:

```bash
npm install @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
npm install codemirror @codemirror/lang-javascript @codemirror/lang-python @codemirror/lang-html @codemirror/lang-css
npm install @codemirror/theme-one-dark @codemirror/view
npm install leaflet @types/leaflet
npm install @testing-library/svelte @testing-library/jest-dom
npm install vitest @vitest/ui
```

## Updated package.json Dependencies

The dependencies section in package.json should be updated to include:

```json
{
  "dependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "better-sqlite3": "^12.5.0",
    "carbon-components-svelte": "^0.95.1",
    "carbon-icons-svelte": "^13.7.0",
    "xlsx": "^0.18.5",
    "@tiptap/core": "^2.1.13",
    "@tiptap/pm": "^2.1.13",
    "@tiptap/starter-kit": "^2.1.13",
    "@tiptap/extension-image": "^2.1.13",
    "@tiptap/extension-link": "^2.1.13",
    "codemirror": "^6.0.1",
    "@codemirror/lang-javascript": "^6.2.2",
    "@codemirror/lang-python": "^6.1.6",
    "@codemirror/lang-html": "^6.4.9",
    "@codemirror/lang-css": "^6.2.1",
    "@codemirror/theme-one-dark": "^6.1.2",
    "@codemirror/view": "^6.23.1",
    "leaflet": "^1.9.4",
    "@types/leaflet": "^1.9.8"
  },
  "devDependencies": {
    "@eslint/js": "^9.18.0",
    "@sveltejs/adapter-auto": "^7.0.0",
    "@sveltejs/kit": "^2.48.5",
    "@sveltejs/vite-plugin-svelte": "^6.2.1",
    "@testing-library/svelte": "^5.2.9",
    "@testing-library/jest-dom": "^6.4.2",
    "eslint": "^9.18.0",
    "eslint-plugin-svelte": "^2.46.1",
    "globals": "^15.14.0",
    "jsdom": "^27.3.0",
    "prettier": "^3.6.2",
    "prettier-plugin-svelte": "^3.4.0",
    "svelte": "^5.43.8",
    "svelte-check": "^4.3.4",
    "typescript": "^5.9.3",
    "typescript-eslint": "^8.18.2",
    "vite": "^7.2.2",
    "vitest": "^4.0.15",
    "@vitest/ui": "^4.0.15"
  }
}
```

## Library Integration Details

### 1. TipTap for Rich Text Editor

**TextEditorField.svelte** will use:
- `@tiptap/starter-kit` for basic editor functionality
- `@tiptap/extension-image` for image support
- `@tiptap/extension-link` for link support
- Custom toolbar with Carbon buttons

```typescript
import { EditorContent, useEditor } from '@tiptap/svelte';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
```

### 2. CodeMirror for Code Editor

**CodeField.svelte** will use:
- `codemirror` v6 for the editor core
- Language extensions for syntax highlighting
- Theme support for dark/light modes

```typescript
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
```

### 3. Leaflet for Geolocation

**GeolocationField.svelte** will use:
- `leaflet` for map functionality
- Custom marker handling
- Integration with Carbon styling

```typescript
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
```

### 4. Testing with Vitest and Testing Library

Test files will use:
- `vitest` for test runner
- `@testing-library/svelte` for component testing
- `@testing-library/jest-dom` for custom matchers

```typescript
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach } from 'vitest';
```

## File Upload API Endpoints

For direct API uploads, the following endpoints should be available:

```
POST /api/upload/file     - General file upload
POST /api/upload/image    - Image upload with processing
GET  /api/files/:id       - Retrieve uploaded file
DELETE /api/files/:id      - Delete uploaded file
```

## Component Import Structure

### BaseField Imports

```typescript
// BaseField.svelte
import { createEventDispatcher } from 'svelte';
import { Label, Tooltip, Button } from 'carbon-components-svelte';
import { Information, Warning, ErrorFilled } from 'carbon-icons-svelte';
import type { DocField } from '../../../meta/doctype/types';
```

### Field Component Imports Template

```typescript
// Example: DataField.svelte
import { createEventDispatcher } from 'svelte';
import BaseField from './BaseField.svelte';
import { TextInput } from 'carbon-components-svelte';
import type { DocField } from '../../../meta/doctype/types';
```

### Rich Content Field Imports

```typescript
// TextEditorField.svelte
import { createEventDispatcher, onMount, onDestroy } from 'svelte';
import BaseField from './BaseField.svelte';
import { EditorContent, useEditor } from '@tiptap/svelte';
import StarterKit from '@tiptap/starter-kit';
import { Button, ButtonSet } from 'carbon-components-svelte';
import { FormatBold, FormatItalic, FormatListBulleted, FormatListNumbered } from 'carbon-icons-svelte';
```

### Code Field Imports

```typescript
// CodeField.svelte
import { createEventDispatcher, onMount, onDestroy } from 'svelte';
import BaseField from './BaseField.svelte';
import { EditorView, basicSetup } from 'codemirror';
import { javascript, python, html, css } from '@codemirror/lang-...';
import { oneDark } from '@codemirror/theme-one-dark';
```

## CSS and Styling Considerations

### Carbon Design System Integration

All components should:
- Use Carbon components for UI elements
- Follow Carbon spacing and typography guidelines
- Support Carbon's theme system (light/dark)
- Use Carbon icons for actions and indicators

### Custom CSS Requirements

```css
/* For TipTap editor */
.ProseMirror {
  min-height: 200px;
  padding: 1rem;
  border: 1px solid var(--cds-ui-03);
  border-radius: 0.25rem;
}

.ProseMirror:focus {
  outline: 2px solid var(--cds-focus);
  outline-offset: -2px;
}

/* For CodeMirror */
.cm-editor {
  border: 1px solid var(--cds-ui-03);
  border-radius: 0.25rem;
}

.cm-editor:focus-within {
  outline: 2px solid var(--cds-focus);
  outline-offset: -2px;
}

/* For Leaflet map */
.leaflet-container {
  border-radius: 0.25rem;
  border: 1px solid var(--cds-ui-03);
}
```

## Test Setup Configuration

### vitest.config.ts Updates

```typescript
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  }
});
```

### Test Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Leaflet
vi.mock('leaflet', () => ({
  map: vi.fn(() => ({
    setView: vi.fn(),
    addLayer: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    remove: vi.fn()
  })),
  tileLayer: vi.fn(() => ({
    addTo: vi.fn()
  })),
  marker: vi.fn(() => ({
    addTo: vi.fn(),
    bindPopup: vi.fn(),
    setLatLng: vi.fn()
  })),
  icon: vi.fn()
}));

// Mock global fetch for file uploads
global.fetch = vi.fn();
```

## Performance Considerations

1. **Lazy Loading**: Rich editors should only load libraries when needed
2. **Code Splitting**: Large libraries (CodeMirror, TipTap) should be code-split
3. **Bundle Size**: Monitor bundle size impact of new dependencies
4. **Tree Shaking**: Ensure unused parts of libraries are tree-shaken

## Security Considerations

1. **File Upload**: Validate file types, sizes, and scan for malware
2. **XSS Prevention**: Sanitize HTML content in rich text editors
3. **CSRF Protection**: Include CSRF tokens in API calls
4. **Content Security Policy**: Configure CSP for external resources

## Accessibility Enhancements

1. **ARIA Labels**: Proper labeling for all custom components
2. **Keyboard Navigation**: Full keyboard support for all fields
3. **Screen Reader**: Announce changes and errors appropriately
4. **Focus Management**: Proper focus handling in complex components