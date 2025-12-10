import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CodeField from '../CodeField.svelte';
import { createMockField } from './fixtures/mockFields';

// Mock CodeMirror
vi.mock('@codemirror/view', () => ({
	EditorView: vi.fn().mockImplementation(() => ({
		state: {
			doc: { toString: vi.fn().mockReturnValue('console.log("test");') },
			readOnly: false
		},
		dispatch: vi.fn(),
		destroy: vi.fn(),
		focus: vi.fn(),
		blur: vi.fn()
	})),
	keymap: {
		of: vi.fn()
	},
	lineNumbers: vi.fn(),
	highlightActiveLineGutter: vi.fn(),
	highlightActiveLine: vi.fn()
}));

vi.mock('@codemirror/state', () => ({
	EditorState: {
		create: vi.fn().mockReturnValue({
			doc: { toString: vi.fn().mockReturnValue('console.log("test");') },
			readOnly: false
		})
	},
	ReadOnly: {
		of: vi.fn()
	}
}));

vi.mock('@codemirror/language', () => ({
	foldGutter: vi.fn(),
	bracketMatching: vi.fn()
}));

vi.mock('@codemirror/autocomplete', () => ({
	closeBrackets: vi.fn()
}));

vi.mock('@codemirror/lang-javascript', () => ({
	javascript: vi.fn().mockReturnValue({})
}));

vi.mock('@codemirror/lang-python', () => ({
	python: vi.fn().mockReturnValue({})
}));

vi.mock('@codemirror/lang-html', () => ({
	html: vi.fn().mockReturnValue({})
}));

vi.mock('@codemirror/lang-css', () => ({
	css: vi.fn().mockReturnValue({})
}));

vi.mock('@codemirror/theme-one-dark', () => ({
	oneDark: {}
}));

vi.mock('@codemirror/commands', () => ({
	defaultKeymap: []
}));

describe('CodeField', () => {
	let field: any;
	let component: any;

	beforeEach(() => {
		field = createMockField({ fieldtype: 'Code', options: 'javascript' });
		vi.clearAllMocks();
	});

	// P3-007-T18: CodeField renders CodeMirror editor
	it('renders CodeMirror editor component', async () => {
		component = render(CodeField, {
			props: { field, value: 'console.log("test");' }
		});
		
		const editorContainer = screen.getByRole('textbox');
		expect(editorContainer).toBeInTheDocument();
		expect(editorContainer).toHaveAttribute('aria-label', 'Test Field code editor');
	});

	// Test language indicator
	it('displays language indicator', async () => {
		component = render(CodeField, {
			props: { field, value: 'console.log("test");' }
		});
		
		const languageIndicator = screen.getByText('JAVASCRIPT');
		expect(languageIndicator).toBeInTheDocument();
	});

	// Test value binding
	it('supports two-way value binding', async () => {
		let testValue = 'console.log("test");';
		component = render(CodeField, {
			props: { field, value: testValue }
		});
		
		const editorContainer = screen.getByRole('textbox');
		expect(editorContainer).toBeInTheDocument();
	});

	// Test language support
	it('supports different programming languages', async () => {
		const pythonField = createMockField({ fieldtype: 'Code', options: 'python' });
		component = render(CodeField, {
			props: { field: pythonField, value: 'print("test")' }
		});
		
		const languageIndicator = screen.getByText('PYTHON');
		expect(languageIndicator).toBeInTheDocument();
	});

	// Test disabled state
	it('disables editor when disabled prop is true', async () => {
		component = render(CodeField, {
			props: { field, value: 'console.log("test");', disabled: true }
		});
		
		const editorContainer = screen.getByRole('textbox');
		expect(editorContainer).toHaveAttribute('aria-disabled', 'true');
	});

	// Test readonly state
	it('makes editor readonly when readonly prop is true', async () => {
		component = render(CodeField, {
			props: { field, value: 'console.log("test");', readonly: true }
		});
		
		const editorContainer = screen.getByRole('textbox');
		expect(editorContainer).toHaveAttribute('aria-readonly', 'true');
	});

	// Test required field
	it('shows required indicator when field is required', async () => {
		const requiredField = createMockField({ 
			fieldtype: 'Code', 
			required: true 
		});
		
		component = render(CodeField, {
			props: { field: requiredField, value: 'console.log("test");' }
		});
		
		const label = screen.getByText('Test Field *');
		expect(label).toBeInTheDocument();
	});

	// Test error display
	it('displays error message when error is provided', async () => {
		component = render(CodeField, {
			props: { field, value: 'console.log("test");', error: 'Syntax error' }
		});
		
		const errorMessage = screen.getByText('Syntax error');
		expect(errorMessage).toBeInTheDocument();
	});

	// Test placeholder
	it('uses placeholder when provided', async () => {
		component = render(CodeField, {
			props: { field, value: '', placeholder: '// Enter JavaScript code here...' }
		});
		
		const editorContainer = screen.getByRole('textbox');
		expect(editorContainer).toHaveAttribute('placeholder', '// Enter JavaScript code here...');
	});

	// Test field label
	it('uses field label when no placeholder provided', async () => {
		const labeledField = createMockField({ 
			fieldtype: 'Code', 
			label: 'Custom Code Field' 
		});
		
		component = render(CodeField, {
			props: { field: labeledField, value: '' }
		});
		
		const label = screen.getByText('Custom Code Field');
		expect(label).toBeInTheDocument();
	});

	// Test hide label
	it('hides label when hideLabel is true', async () => {
		component = render(CodeField, {
			props: { field, value: '', hideLabel: true }
		});
		
		const label = screen.queryByText('Test Field');
		expect(label).not.toBeInTheDocument();
	});

	// Test description tooltip
	it('shows description tooltip when description is provided', async () => {
		const fieldWithDescription = createMockField({ 
			fieldtype: 'Code', 
			description: 'Enter JavaScript code here' 
		});
		
		component = render(CodeField, {
			props: { field: fieldWithDescription, value: '' }
		});
		
		const infoButton = screen.getByRole('button', { name: /information/i });
		expect(infoButton).toBeInTheDocument();
	});

	// Test language options from field.options
	it('uses language from field.options when language prop not provided', async () => {
		const pythonField = createMockField({ fieldtype: 'Code', options: 'python' });
		component = render(CodeField, {
			props: { field: pythonField, value: 'print("test")' }
		});
		
		const languageIndicator = screen.getByText('PYTHON');
		expect(languageIndicator).toBeInTheDocument();
	});
});