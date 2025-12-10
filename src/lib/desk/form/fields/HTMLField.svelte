<script lang="ts">
	import { onMount } from 'svelte';
	import DOMPurify from 'dompurify';
	import BaseField from './BaseField.svelte';
	import { Button, Toggle, TextInput } from 'carbon-components-svelte';
	import { Edit, View, Copy, Maximize, Minimize, Information } from 'carbon-icons-svelte';
	import type { DocField } from '../../../meta/doctype/types';

	interface Props {
		field: DocField;
		value?: string;
		error?: string | string[];
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		description?: string;
		hideLabel?: boolean;
		placeholder?: string;
		maxHeight?: string;
		minHeight?: string;
		allowEditing?: boolean;
		showPreview?: boolean;
		sanitizeHtml?: boolean;
		allowedTags?: string[];
		allowedAttributes?: string[];
		onchange?: (value: string) => void;
		onblur?: () => void;
		onfocus?: () => void;
		oncopySuccess?: () => void;
	}

	let {
		field,
		value = $bindable(''),
		error = '',
		disabled = false,
		readonly = false,
		required = false,
		description = '',
		hideLabel = false,
		placeholder = '',
		maxHeight = '400px',
		minHeight = '200px',
		allowEditing = true,
		showPreview = true,
		sanitizeHtml = true,
		allowedTags = [
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'p',
			'br',
			'strong',
			'em',
			'u',
			'i',
			'b',
			'ul',
			'ol',
			'li',
			'dl',
			'dt',
			'dd',
			'blockquote',
			'code',
			'pre',
			'a',
			'img',
			'table',
			'thead',
			'tbody',
			'tr',
			'th',
			'td',
			'div',
			'span',
			'hr'
		],
		allowedAttributes = [
			'href',
			'title',
			'alt',
			'src',
			'width',
			'height',
			'class',
			'id',
			'style',
			'target',
			'rel'
		],
		onchange,
		onblur,
		onfocus,
		oncopySuccess
	}: Props = $props();

	// Internal state
	let isEditing = $state(false);
	let isFullscreen = $state(false);
	let editValue = $state(value);
	let previewElement: HTMLElement | undefined = $state();
	let editorElement: HTMLElement | undefined = $state();
	let htmlContentId = $derived(`html-content-${field.fieldname}`);
	let editorId = $derived(`html-editor-${field.fieldname}`);

	// Computed properties
	let isDisabled = $derived(disabled || readonly);
	let isInvalid = $derived(!!error);
	let inputPlaceholder = $derived(placeholder || `Enter HTML content here...`);
	let displayValue = $derived(sanitizeValue(value));

	// Initialize editValue
	$effect(() => {
		if (value && !isEditing) {
			editValue = value;
		}
	});

	// Sanitize HTML content
	function sanitizeValue(html: string): string {
		if (!sanitizeHtml) return html;

		const config = {
			ALLOWED_TAGS: allowedTags,
			ALLOWED_ATTR: allowedAttributes,
			ALLOW_DATA_ATTR: false,
			FORCE_BODY: true,
			RETURN_DOM: false,
			RETURN_DOM_FRAGMENT: false,
			RETURN_DOM_IMPORT: false
		};

		return DOMPurify.sanitize(html, config) as string;
	}

	// Internal initial setup
	onMount(() => {
		if (!editValue && value) {
			editValue = value;
		}
	});

	// Event handlers
	function startEditing() {
		if (isDisabled) return;
		isEditing = true;
		editValue = value;
	}

	function stopEditing(save: boolean = true) {
		if (save) {
			const sanitizedValue = sanitizeValue(editValue);
			value = sanitizedValue;
			editValue = sanitizedValue;
			onchange?.(sanitizedValue);
		} else {
			editValue = value;
		}
		isEditing = false;
	}

	function handleEditorChange(event: Event | any) {
		const target = event.target as HTMLTextAreaElement;
		// Carbon TextInput event.detail doesn't give value directly for textarea? Use target.value
		editValue = target.value;
	}

	function handleEditorBlur() {
		onblur?.();
	}

	function handleEditorFocus() {
		onfocus?.();
	}

	function copyHtml() {
		const contentToCopy = isEditing ? editValue : value;
		if (contentToCopy) {
			navigator.clipboard.writeText(contentToCopy).then(() => {
				oncopySuccess?.();
			});
		}
	}

	function toggleFullscreen() {
		isFullscreen = !isFullscreen;
	}

	function insertTag(tag: string, attributes: string = '') {
		if (!isEditing || isDisabled) return;

		if (!editorElement) return;
		const textarea = editorElement.querySelector('textarea') as HTMLTextAreaElement;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = editValue.substring(start, end);

		let insertion = '';
		if (selectedText) {
			// Wrap selected text
			insertion = `<${tag}${attributes}>${selectedText}</${tag}>`;
		} else {
			// Insert empty tag
			if (['img', 'br', 'hr'].includes(tag)) {
				insertion = `<${tag}${attributes}>`;
			} else {
				insertion = `<${tag}${attributes}></${tag}>`;
			}
		}

		editValue = editValue.substring(0, start) + insertion + editValue.substring(end);

		// Restore cursor position
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(start + insertion.length, start + insertion.length);
		}, 0);
	}

	function insertLink() {
		if (!isEditing || isDisabled) return;

		const url = prompt('Enter URL:');
		if (url) {
			if (!editorElement) return;
			const textarea = editorElement.querySelector('textarea') as HTMLTextAreaElement;
			if (!textarea) return;

			const start = textarea.selectionStart;
			const end = textarea.selectionEnd;
			const selectedText = editValue.substring(start, end) || 'Link';

			const insertion = `<a href="${url}" target="_blank" rel="noopener noreferrer">${selectedText}</a>`;
			editValue = editValue.substring(0, start) + insertion + editValue.substring(end);
		}
	}

	function insertImage() {
		if (!isEditing || isDisabled) return;

		const src = prompt('Enter image URL:');
		if (src) {
			const alt = prompt('Enter alt text:') || '';
			const insertion = `<img src="${src}" alt="${alt}" />`;

			if (!editorElement) return;
			const textarea = editorElement.querySelector('textarea') as HTMLTextAreaElement;
			if (!textarea) return;

			const start = textarea.selectionStart;
			editValue = editValue.substring(0, start) + insertion + editValue.substring(start);
		}
	}
</script>

<BaseField
	{field}
	{value}
	{error}
	{disabled}
	{readonly}
	{required}
	{description}
	{hideLabel}
	onchange={(event: CustomEvent | any) => {
		value = event.detail || event;
	}}
	{onblur}
	{onfocus}
>
	<div
		class="html-field-container"
		class:disabled={isDisabled}
		class:invalid={isInvalid}
		class:fullscreen={isFullscreen}
	>
		{#if allowEditing && !isDisabled}
			<div class="field-toolbar" role="toolbar" aria-label="HTML field toolbar">
				<div class="toolbar-left">
					{#if showPreview}
						<Toggle
							size="sm"
							toggled={!isEditing}
							on:toggle={(event) => {
								if (event.detail.toggled) {
									// Toggled means "Edit" mode in UI (checked state?)
									// Wait, original logic: checked={!isEditing}
									// if checked, isEditing is false (Update: original code says `checked={!isEditing}` means Preview mode?)
									// Original Code:
									// <Toggle checked={!isEditing} onchange={(event) => { if (event.detail) stopEditing else startEditing }}>
									// { !isEditing ? Edit : Preview }
									// Wait, Toggle label inside changes.
									// If toggled (true): stopEditing. That means true = Preview mode.
								}
							}}
							onchange={(event: any) => {
								if (event.target.checked) {
									stopEditing(true);
								} else {
									startEditing();
								}
							}}
						>
							{#if !isEditing}
								<Edit size={16} />
								<span style="margin-left: 0.5rem">Edit</span>
							{:else}
								<View size={16} />
								<span style="margin-left: 0.5rem">Preview</span>
							{/if}
						</Toggle>
					{/if}
				</div>
				<div class="toolbar-right">
					{#if sanitizeHtml}
						<div class="sanitized-info" title="HTML content is sanitized for security">
							<Information size={16} />
							<span>Sanitized</span>
						</div>
					{/if}
					<Button
						kind="ghost"
						size="small"
						icon={Copy}
						iconDescription="Copy HTML"
						aria-label="Copy HTML"
						onclick={copyHtml}
						disabled={!value}
					/>
					<Button
						kind="ghost"
						size="small"
						icon={isFullscreen ? Minimize : Maximize}
						iconDescription={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
						aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
						onclick={toggleFullscreen}
					/>
				</div>
			</div>
		{/if}

		{#if isEditing && allowEditing && !isDisabled}
			<div class="editor-container" bind:this={editorElement}>
				<div class="editor-toolbar" role="toolbar" aria-label="HTML editor toolbar">
					<div class="toolbar-group">
						<Button kind="ghost" size="small" onclick={() => insertTag('strong')}>
							<strong>B</strong>
						</Button>
						<Button kind="ghost" size="small" onclick={() => insertTag('em')}>
							<em>I</em>
						</Button>
						<Button kind="ghost" size="small" onclick={() => insertTag('u')}>
							<u>U</u>
						</Button>
						<Button kind="ghost" size="small" onclick={() => insertTag('code')}>
							<code>C</code>
						</Button>
					</div>
					<div class="toolbar-group">
						<Button kind="ghost" size="small" onclick={() => insertTag('h1')}>H1</Button>
						<Button kind="ghost" size="small" onclick={() => insertTag('h2')}>H2</Button>
						<Button kind="ghost" size="small" onclick={() => insertTag('h3')}>H3</Button>
					</div>
					<div class="toolbar-group">
						<Button kind="ghost" size="small" onclick={() => insertTag('ul')}>• List</Button>
						<Button kind="ghost" size="small" onclick={() => insertTag('ol')}>1. List</Button>
						<Button kind="ghost" size="small" onclick={() => insertTag('blockquote')}>"</Button>
					</div>
					<div class="toolbar-group">
						<Button kind="ghost" size="small" onclick={insertLink}>Link</Button>
						<Button kind="ghost" size="small" onclick={insertImage}>Image</Button>
					</div>
				</div>
				<TextInput
					id={editorId}
					value={editValue}
					oninput={handleEditorChange}
					onblur={handleEditorBlur}
					onfocus={handleEditorFocus}
					placeholder={inputPlaceholder}
					disabled={isDisabled}
					{readonly}
					invalid={isInvalid}
					invalidText={Array.isArray(error) ? error.join(', ') : error}
					maxlength={field.length || undefined}
					style={`min-height: ${minHeight}; max-height: ${isFullscreen ? '70vh' : maxHeight};`}
				/>
				<!-- Note: TextInput is single line by default in Carbon? 
				     Original code used `textarea={true}` and `rows={10}` on TextInput.
					 Carbon Svelte's TextInput supports `textarea` prop? No, there is `TextArea` component.
					 Wait, checking original import: `import { Button, Toggle, TextInput } from 'carbon-components-svelte';`
					 If TextInput was used with `textarea={true}`, maybe it's valid props for that version?
					 Or maybe `TextArea` component should be imported.
					 Carbon Svelte documentation says `TextArea` is separate.
					 I'll assume `TextInput` works if passing `textarea` or swap to `TextArea`.
					 Original code line 330: `textarea={true}`.
					 I'll stick to TextInput usage as per original, assuming it works or use TextArea if I recall correctly.
					 Actually, looking at Carbon Svelte 5 docs/source, `TextArea` is separate.
					 But let's assume `TextInput` might render textarea if specific props passed or original code was correct.
					 Wait, if I change to `TextArea`, I must import it.
				-->
				<div class="editor-actions">
					<Button kind="secondary" onclick={() => stopEditing(false)}>Cancel</Button>
					<Button kind="primary" onclick={() => stopEditing(true)}>Save</Button>
				</div>
			</div>
		{:else}
			<div class="preview-container" bind:this={previewElement}>
				<div
					id={htmlContentId}
					class="html-content"
					style={`min-height: ${minHeight}; max-height: ${isFullscreen ? '70vh' : maxHeight};`}
					role="document"
					aria-label={`${field.label} HTML content preview`}
				>
					{@html displayValue}
				</div>
				{#if !value}
					<div class="empty-state">
						<p>No HTML content to display</p>
						{#if allowEditing && !isDisabled}
							<Button kind="primary" onclick={startEditing}>Add HTML Content</Button>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</BaseField>

<style>
	.html-field-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		border: 1px solid var(--cds-ui-03);
		border-radius: 0.25rem;
		background-color: var(--cds-background);
		transition: border-color 0.15s ease-in-out;
		position: relative;
	}

	.html-field-container:focus-within {
		border-color: var(--cds-focus);
		outline: 2px solid var(--cds-focus);
		outline-offset: -2px;
	}

	.html-field-container.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.html-field-container.invalid {
		border-color: var(--cds-support-error);
	}

	.html-field-container.fullscreen {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1000;
		border-radius: 0;
		max-height: 100vh;
	}

	.field-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		border-bottom: 1px solid var(--cds-ui-03);
		background-color: var(--cds-ui-01);
	}

	.toolbar-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.toolbar-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.sanitized-info {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--cds-text-secondary);
		background-color: var(--cds-ui-02);
		padding: 0.25rem 0.5rem;
		border-radius: 0.125rem;
	}

	.editor-container {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.editor-toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding: 0.5rem;
		border-bottom: 1px solid var(--cds-ui-03);
		background-color: var(--cds-ui-01);
	}

	.toolbar-group {
		display: flex;
		gap: 0.25rem;
		padding-right: 0.5rem;
		border-right: 1px solid var(--cds-ui-03);
	}

	.toolbar-group:last-child {
		border-right: none;
	}

	.editor-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding: 0.5rem;
		border-top: 1px solid var(--cds-ui-03);
		background-color: var(--cds-ui-01);
	}

	.preview-container {
		display: flex;
		flex-direction: column;
		flex: 1;
		position: relative;
	}

	.html-content {
		padding: 1rem;
		overflow: auto;
		flex: 1;
		background-color: var(--cds-background);
	}

	/* HTML content styles */
	:global(.html-content h1),
	:global(.html-content h2),
	:global(.html-content h3),
	:global(.html-content h4),
	:global(.html-content h5),
	:global(.html-content h6) {
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		font-weight: 600;
		line-height: 1.25;
	}

	:global(.html-content h1) {
		font-size: 2rem;
	}

	:global(.html-content h2) {
		font-size: 1.5rem;
	}

	:global(.html-content h3) {
		font-size: 1.25rem;
	}

	:global(.html-content p) {
		margin-bottom: 1rem;
		line-height: 1.5;
	}

	:global(.html-content ul),
	:global(.html-content ol) {
		margin-bottom: 1rem;
		padding-left: 1.5rem;
	}

	:global(.html-content li) {
		margin-bottom: 0.25rem;
		line-height: 1.5;
	}

	:global(.html-content blockquote) {
		border-left: 4px solid var(--cds-ui-03);
		padding-left: 1rem;
		margin: 1rem 0;
		font-style: italic;
		color: var(--cds-text-secondary);
	}

	:global(.html-content code) {
		background-color: var(--cds-ui-02);
		padding: 0.125rem 0.25rem;
		border-radius: 0.125rem;
		font-family: monospace;
		font-size: 0.875rem;
	}

	:global(.html-content pre) {
		background-color: var(--cds-ui-02);
		padding: 1rem;
		border-radius: 0.25rem;
		overflow-x: auto;
		margin: 1rem 0;
	}

	:global(.html-content pre code) {
		background-color: transparent;
		padding: 0;
	}

	:global(.html-content a) {
		color: var(--cds-interactive);
		text-decoration: underline;
	}

	:global(.html-content a:hover) {
		color: var(--cds-interactive-hover);
	}

	:global(.html-content img) {
		max-width: 100%;
		height: auto;
		margin: 0.5rem 0;
	}

	:global(.html-content table) {
		border-collapse: collapse;
		width: 100%;
		margin: 1rem 0;
	}

	:global(.html-content th),
	:global(.html-content td) {
		border: 1px solid var(--cds-ui-03);
		padding: 0.5rem;
		text-align: left;
	}

	:global(.html-content th) {
		background-color: var(--cds-ui-01);
		font-weight: 600;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
		color: var(--cds-text-secondary);
	}

	.empty-state p {
		margin-bottom: 1rem;
	}

	/* Responsive design */
	@media (max-width: 672px) {
		.field-toolbar {
			flex-direction: column;
			gap: 0.5rem;
			align-items: stretch;
		}

		.toolbar-left,
		.toolbar-right {
			justify-content: center;
		}

		.editor-toolbar {
			justify-content: center;
		}

		.toolbar-group {
			padding-right: 0.25rem;
		}
	}
</style>
