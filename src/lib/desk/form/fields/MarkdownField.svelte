<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import BaseField from './BaseField.svelte';
	import { Button, Toggle, TextInput } from 'carbon-components-svelte';
	import {
		Edit,
		View,
		Copy,
		Maximize,
		Minimize,
		Information,
		TextBold,
		TextItalic,
		TextUnderline,
		Heading,
		ListBulleted,
		ListNumbered,
		Code as CodeIcon,
		Quotes,
		Link as LinkIcon,
		Image as ImageIcon
	} from 'carbon-icons-svelte';
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
		splitView?: boolean;
		sanitizeHtml?: boolean;
		lineNumbers?: boolean;
		tabSize?: number;
		onchange?: (value: string) => void;
		onblur?: () => void;
		onfocus?: () => void;
		oncopySuccess?: () => void;
		oncopyHtmlSuccess?: () => void;
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
		splitView = true,
		sanitizeHtml = true,
		lineNumbers = false, // unused in original?
		tabSize = 4, // unused in original?
		onchange,
		onblur,
		onfocus,
		oncopySuccess,
		oncopyHtmlSuccess
	}: Props = $props();

	// Internal state
	let isEditing = $state(false);
	let isFullscreen = $state(false);
	let editValue = $state(value);
	let previewElement: HTMLElement | undefined = $state();
	let editorElement: HTMLElement | undefined = $state();
	let markdownContentId = $derived(`markdown-content-${field.fieldname}`);
	let editorId = $derived(`markdown-editor-${field.fieldname}`);
	let defaultSplitView = $derived(splitView || false);
	let showSplitView = $state<boolean>();

	// Initialize showSplitView
	$effect(() => {
		showSplitView = defaultSplitView;
	});

	// Computed properties
	let isDisabled = $derived(disabled || readonly);
	let isInvalid = $derived(!!error);
	let inputPlaceholder = $derived(placeholder || `Enter markdown content here...`);
	let displayValue = $derived(getDisplayValue(value));

	function getDisplayValue(val: string): string {
		const rawHtml = typeof marked.parse(val || '') === 'string' ? (marked.parse(val || '') as string) : '';
		return sanitizeHtml ? (DOMPurify.sanitize(rawHtml) as string) : rawHtml;
	}

	// Initialize editValue from props
	$effect(() => {
		// Sync editValue only if not currently editing (or initial load)
		if (value && !isEditing && value !== editValue) {
			editValue = value;
		}
	});

	// Configure marked
	onMount(() => {
		editValue = value;

		// Configure marked options
		marked.use({
			gfm: true, // GitHub Flavored Markdown
			breaks: true, // Convert \n to <br>
			pedantic: false // Conform to the original markdown.pl
		});
	});

	// Event handlers
	function startEditing() {
		if (isDisabled) return;
		isEditing = true;
		editValue = value;
	}

	function stopEditing(save: boolean = true) {
		if (save) {
			value = editValue;
			onchange?.(editValue);
		} else {
			editValue = value;
		}
		isEditing = false;
	}

	function handleEditorChange(event: Event | any) {
		const target = event.target as HTMLTextAreaElement;
		editValue = target.value;
	}

	function handleEditorBlur() {
		onblur?.();
	}

	function handleEditorFocus() {
		onfocus?.();
	}

	function copyMarkdown() {
		const contentToCopy = isEditing ? editValue : value;
		if (contentToCopy) {
			navigator.clipboard.writeText(contentToCopy).then(() => {
				oncopySuccess?.();
			});
		}
	}

	function copyHtml() {
		if (value) {
			const htmlContent = marked.parse(value);
			const parsedHtml = typeof htmlContent === 'string' ? htmlContent : '';
			const finalHtml = sanitizeHtml ? DOMPurify.sanitize(parsedHtml) : parsedHtml;
			navigator.clipboard.writeText(finalHtml).then(() => {
				oncopyHtmlSuccess?.();
			});
		}
	}

	function toggleFullscreen() {
		isFullscreen = !isFullscreen;
	}

	function toggleSplitView() {
		showSplitView = !showSplitView;
	}

	function insertMarkdown(markdown: string) {
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
			insertion = markdown.replace('{text}', selectedText);
		} else {
			// Insert empty markdown
			insertion = markdown.replace('{text}', '');
		}

		editValue = editValue.substring(0, start) + insertion + editValue.substring(end);

		// Restore cursor position
		setTimeout(() => {
			textarea.focus();
			const cursorPos =
				start + insertion.indexOf('{text}') !== -1
					? start + insertion.indexOf('{text}') + selectedText.length
					: start + insertion.length;
			textarea.setSelectionRange(cursorPos, cursorPos);
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

			const insertion = `[${selectedText}](${url})`;
			editValue = editValue.substring(0, start) + insertion + editValue.substring(end);
		}
	}

	function insertImage() {
		if (!isEditing || isDisabled) return;

		const src = prompt('Enter image URL:');
		if (src) {
			const alt = prompt('Enter alt text:') || '';
			const insertion = `![${alt}](${src})`;

			if (!editorElement) return;
			const textarea = editorElement.querySelector('textarea') as HTMLTextAreaElement;
			if (!textarea) return;

			const start = textarea.selectionStart;
			editValue = editValue.substring(0, start) + insertion + editValue.substring(start);
		}
	}

	function insertCodeBlock() {
		if (!isEditing || isDisabled) return;

		if (!editorElement) return;
		const textarea = editorElement.querySelector('textarea') as HTMLTextAreaElement;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = editValue.substring(start, end);

		const insertion = selectedText ? `\`\`\`\n${selectedText}\n\`\`\`` : '\`\`\`\n\n\`\`\`';

		editValue = editValue.substring(0, start) + insertion + editValue.substring(end);
	}

	function insertTable() {
		if (!isEditing || isDisabled) return;

		const insertion = `| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`;

		if (!editorElement) return;
		const textarea = editorElement.querySelector('textarea') as HTMLTextAreaElement;
		if (!textarea) return;

		const start = textarea.selectionStart;
		editValue = editValue.substring(0, start) + insertion + editValue.substring(start);
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
		class="markdown-field-container"
		class:disabled={isDisabled}
		class:invalid={isInvalid}
		class:fullscreen={isFullscreen}
	>
		{#if allowEditing && !isDisabled}
			<div class="field-toolbar" role="toolbar" aria-label="Markdown field toolbar">
				<div class="toolbar-left">
					{#if showPreview}
						<Toggle
							size="sm"
							toggled={!isEditing}
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
					{#if showPreview && !isEditing}
						<Toggle
							size="sm"
							toggled={showSplitView}
							onchange={(event: any) => (showSplitView = event.target.checked)}
						>
							<span style="margin-left: 0.5rem">Split View</span>
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
						iconDescription="Copy Markdown"
						aria-label="Copy Markdown"
						onclick={copyMarkdown}
						disabled={!value}
					/>
					{#if !isEditing}
						<Button
							kind="ghost"
							size="small"
							icon={Copy}
							iconDescription="Copy HTML"
							aria-label="Copy HTML"
							onclick={copyHtml}
							disabled={!value}
						/>
					{/if}
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
				<div class="editor-toolbar" role="toolbar" aria-label="Markdown editor toolbar">
					<div class="toolbar-group">
						<Button
							kind="ghost"
							size="small"
							icon={TextBold}
							onclick={() => insertMarkdown('**{text}**')}
							title="Bold"
						/>
						<Button
							kind="ghost"
							size="small"
							icon={TextItalic}
							onclick={() => insertMarkdown('*{text}*')}
							title="Italic"
						/>
						<Button
							kind="ghost"
							size="small"
							icon={TextUnderline}
							onclick={() => insertMarkdown('_{text}_')}
							title="Underline"
						/>
						<Button
							kind="ghost"
							size="small"
							icon={CodeIcon}
							onclick={() => insertMarkdown('`{text}`')}
							title="Inline code"
						/>
					</div>
					<div class="toolbar-group">
						<Button
							kind="ghost"
							size="small"
							icon={Heading}
							onclick={() => insertMarkdown('# {text}')}
							title="Heading"
						/>
						<Button
							kind="ghost"
							size="small"
							icon={ListBulleted}
							onclick={() => insertMarkdown('- {text}')}
							title="Bullet list"
						/>
						<Button
							kind="ghost"
							size="small"
							icon={ListNumbered}
							onclick={() => insertMarkdown('1. {text}')}
							title="Numbered list"
						/>
						<Button
							kind="ghost"
							size="small"
							icon={Quotes}
							onclick={() => insertMarkdown('> {text}')}
							title="Quote"
						/>
					</div>
					<div class="toolbar-group">
						<Button kind="ghost" size="small" icon={LinkIcon} onclick={insertLink} title="Link" />
						<Button kind="ghost" size="small" icon={ImageIcon} onclick={insertImage} title="Image" />
						<Button kind="ghost" size="small" onclick={insertCodeBlock} title="Code block">{'</>'}</Button>
						<Button kind="ghost" size="small" onclick={insertTable} title="Table">Table</Button>
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
					style={`min-height: ${minHeight}; max-height: ${isFullscreen ? '70vh' : maxHeight}; font-family: monospace;`}
				/>
				<div class="editor-actions">
					<Button kind="secondary" onclick={() => stopEditing(false)}>Cancel</Button>
					<Button kind="primary" onclick={() => stopEditing(true)}>Save</Button>
				</div>
			</div>
		{:else}
			<div
				class="preview-container"
				class:split-view={showSplitView && showPreview}
				bind:this={previewElement}
			>
				{#if showSplitView && showPreview}
					<div class="split-pane editor-pane">
						<div class="pane-header">
							<h4>Markdown</h4>
						</div>
						<div class="pane-content">
							<pre class="markdown-source">{value || ''}</pre>
						</div>
					</div>
					<div class="split-pane preview-pane">
						<div class="pane-header">
							<h4>Preview</h4>
						</div>
						<div class="pane-content">
							<div
								id={markdownContentId}
								class="markdown-content"
								style={`min-height: ${minHeight}; max-height: ${isFullscreen ? '70vh' : maxHeight};`}
								role="document"
								aria-label={`${field.label} markdown preview`}
							>
								{@html displayValue}
							</div>
						</div>
					</div>
				{:else}
					<div
						id={markdownContentId}
						class="markdown-content"
						style={`min-height: ${minHeight}; max-height: ${isFullscreen ? '70vh' : maxHeight};`}
						role="document"
						aria-label={`${field.label} markdown preview`}
					>
						{@html displayValue}
					</div>
					{#if !value}
						<div class="empty-state">
							<p>No markdown content to display</p>
							{#if allowEditing && !isDisabled}
								<Button kind="primary" onclick={startEditing}>Add Markdown Content</Button>
							{/if}
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
</BaseField>

<style>
	.markdown-field-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		border: 1px solid var(--cds-ui-03);
		border-radius: 0.25rem;
		background-color: var(--cds-background);
		transition: border-color 0.15s ease-in-out;
		position: relative;
	}

	.markdown-field-container:focus-within {
		border-color: var(--cds-focus);
		outline: 2px solid var(--cds-focus);
		outline-offset: -2px;
	}

	.markdown-field-container.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.markdown-field-container.invalid {
		border-color: var(--cds-support-error);
	}

	.markdown-field-container.fullscreen {
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

	.preview-container.split-view {
		flex-direction: row;
	}

	.split-pane {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.editor-pane {
		border-right: 1px solid var(--cds-ui-03);
	}

	.pane-header {
		padding: 0.5rem;
		background-color: var(--cds-ui-01);
		border-bottom: 1px solid var(--cds-ui-03);
	}

	.pane-header h4 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--cds-text-primary);
	}

	.pane-content {
		flex: 1;
		overflow: auto;
	}

	.markdown-source {
		padding: 1rem;
		margin: 0;
		font-family: monospace;
		font-size: 0.875rem;
		line-height: 1.5;
		white-space: pre-wrap;
		word-wrap: break-word;
		background-color: var(--cds-background);
	}

	.markdown-content {
		padding: 1rem;
		overflow: auto;
		flex: 1;
		background-color: var(--cds-background);
	}

	/* Markdown content styles */
	:global(.markdown-content h1),
	:global(.markdown-content h2),
	:global(.markdown-content h3),
	:global(.markdown-content h4),
	:global(.markdown-content h5),
	:global(.markdown-content h6) {
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		font-weight: 600;
		line-height: 1.25;
	}

	:global(.markdown-content h1) {
		font-size: 2rem;
		border-bottom: 1px solid var(--cds-ui-03);
		padding-bottom: 0.5rem;
	}

	:global(.markdown-content h2) {
		font-size: 1.5rem;
		border-bottom: 1px solid var(--cds-ui-03);
		padding-bottom: 0.25rem;
	}

	:global(.markdown-content h3) {
		font-size: 1.25rem;
	}

	:global(.markdown-content p) {
		margin-bottom: 1rem;
		line-height: 1.5;
	}

	:global(.markdown-content ul),
	:global(.markdown-content ol) {
		margin-bottom: 1rem;
		padding-left: 1.5rem;
	}

	:global(.markdown-content li) {
		margin-bottom: 0.25rem;
		line-height: 1.5;
	}

	:global(.markdown-content blockquote) {
		border-left: 4px solid var(--cds-ui-03);
		padding-left: 1rem;
		margin: 1rem 0;
		font-style: italic;
		color: var(--cds-text-secondary);
	}

	:global(.markdown-content code) {
		background-color: var(--cds-ui-02);
		padding: 0.125rem 0.25rem;
		border-radius: 0.125rem;
		font-family: monospace;
		font-size: 0.875rem;
	}

	:global(.markdown-content pre) {
		background-color: var(--cds-ui-02);
		padding: 1rem;
		border-radius: 0.25rem;
		overflow-x: auto;
		margin: 1rem 0;
	}

	:global(.markdown-content pre code) {
		background-color: transparent;
		padding: 0;
	}

	:global(.markdown-content a) {
		color: var(--cds-interactive);
		text-decoration: underline;
	}

	:global(.markdown-content a:hover) {
		color: var(--cds-interactive-hover);
	}

	:global(.markdown-content img) {
		max-width: 100%;
		height: auto;
		margin: 0.5rem 0;
	}

	:global(.markdown-content table) {
		border-collapse: collapse;
		width: 100%;
		margin: 1rem 0;
	}

	:global(.markdown-content th),
	:global(.markdown-content td) {
		border: 1px solid var(--cds-ui-03);
		padding: 0.5rem;
		text-align: left;
	}

	:global(.markdown-content th) {
		background-color: var(--cds-ui-01);
		font-weight: 600;
	}

	:global(.markdown-content hr) {
		border: 0;
		border-top: 1px solid var(--cds-ui-03);
		margin: 2rem 0;
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

		.preview-container.split-view {
			flex-direction: column;
		}

		.editor-pane {
			border-right: none;
			border-bottom: 1px solid var(--cds-ui-03);
		}
	}
</style>
