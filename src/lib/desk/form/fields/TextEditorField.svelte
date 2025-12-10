<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Underline from '@tiptap/extension-underline';
	import Link from '@tiptap/extension-link';
	import Image from '@tiptap/extension-image';
	import BaseField from './BaseField.svelte';
	import { Button, ButtonSet } from 'carbon-components-svelte';
	import {
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
		maxLength?: number | undefined;
		toolbar?: string[];
		onchange?: (value: string) => void;
		onblur?: () => void;
		onfocus?: () => void;
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
		maxLength = undefined,
		toolbar = [
			'bold',
			'italic',
			'underline',
			'heading1',
			'heading2',
			'heading3',
			'bulletList',
			'orderedList',
			'code',
			'blockquote',
			'link',
			'image'
		],
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Editor state
	let editor = $state<Editor | null>(null);
	let editorElement: HTMLElement;
	let editorId = $derived(`editor-${field.fieldname}`);
	let linkUrl = $state('');
	let showLinkDialog = $state(false);
	let imageUrl = $state('');
	let showImageDialog = $state(false);
	let editorValueLength = $state(0);

	// Force update reactivity for active state checks
	let activeStateUpdate = $state(0);

	// Computed properties
	let isDisabled = $derived(disabled || readonly);
	let isInvalid = $derived(!!error);
	let inputPlaceholder = $derived(placeholder || field.label || '');

	// Initialize editor
	onMount(() => {
		if (!isDisabled || (isDisabled && value)) {
			// Allow init even if disabled to show content? Original said `if (!isDisabled)`
			// Original code: if (!isDisabled) ...
			// But if it is disabled, we probably want to show content in read-only mode?
			// Tiptap supports `editable: false`.
			// Let's create it always but set editable correct.

			editor = new Editor({
				element: editorElement,
				extensions: [
					StarterKit.configure({
						heading: {
							levels: [1, 2, 3]
						}
					}),
					Underline,
					Link.configure({
						openOnClick: false,
						HTMLAttributes: {
							class: 'text-blue-600 underline hover:text-blue-800'
						}
					}),
					Image.configure({
						HTMLAttributes: {
							class: 'max-w-full h-auto'
						}
					})
				],
				content: value || '',
				editable: !isDisabled,
				onUpdate: ({ editor }) => {
					const newValue = editor.getHTML();
					if (value !== newValue) {
						value = newValue; // Sync bound value
						onchange?.(newValue);
					}
					editorValueLength = editor.getText().length;
					activeStateUpdate++; // Trigger reactivity for buttons
				},
				onSelectionUpdate: () => {
					activeStateUpdate++; // Trigger reactivity for buttons
				},
				onTransaction: () => {
					activeStateUpdate++;
				},
				onBlur: () => {
					onblur?.();
				},
				onFocus: () => {
					onfocus?.();
				}
			});

			// Initial length check
			editorValueLength = editor.getText().length;
		}
	});

	//Cleanup editor
	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	// Update editor content when value prop changes
	$effect(() => {
		if (editor && value !== editor.getHTML()) {
			// Avoid cursor jumping by only setting if content is different
			// editor.commands.setContent(value || '') does full replacement
			// Is there a better way? Tiptap usually recommends this.
			// But check is needed to avoid loop.
			editor.commands.setContent(value || '');
			editorValueLength = editor.getText().length;
		}
	});

	// Update editor editable state when disabled state changes
	$effect(() => {
		if (editor) {
			editor.setEditable(!isDisabled);
		}
	});

	// Toolbar functions
	function toggleBold() {
		editor?.chain().focus().toggleBold().run();
	}

	function toggleItalic() {
		editor?.chain().focus().toggleItalic().run();
	}

	function toggleUnderline() {
		editor?.chain().focus().toggleUnderline().run();
	}

	function toggleHeading(level: 1 | 2 | 3) {
		editor?.chain().focus().toggleHeading({ level }).run();
	}

	function toggleBulletList() {
		editor?.chain().focus().toggleBulletList().run();
	}

	function toggleOrderedList() {
		editor?.chain().focus().toggleOrderedList().run();
	}

	function toggleCode() {
		editor?.chain().focus().toggleCode().run();
	}

	function toggleBlockquote() {
		editor?.chain().focus().toggleBlockquote().run();
	}

	function setLink() {
		if (linkUrl) {
			editor?.chain().focus().setLink({ href: linkUrl }).run();
			linkUrl = '';
			showLinkDialog = false;
		}
	}

	function unsetLink() {
		editor?.chain().focus().unsetLink().run();
	}

	function setImage() {
		if (imageUrl) {
			editor?.chain().focus().setImage({ src: imageUrl }).run();
			imageUrl = '';
			showImageDialog = false;
		}
	}

	// Helper to track active state, dependent on activeStateUpdate
	function isCommandActive(name: string, attributes?: Record<string, any>): boolean {
		// Use the reactive variable to depend on it
		const _ = activeStateUpdate;
		if (!editor) return false;
		return editor.isActive(name, attributes);
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
	<div class="text-editor-container" class:disabled={isDisabled} class:invalid={isInvalid}>
		{#if !isDisabled && toolbar.length > 0}
			<div class="editor-toolbar" role="toolbar" aria-label="Text formatting toolbar">
				<ButtonSet>
					{#if toolbar.includes('bold')}
						<Button
							kind="ghost"
							size="small"
							icon={TextBold}
							iconDescription="Bold"
							aria-label="Bold"
							class={isCommandActive('bold') ? 'active' : ''}
							onclick={toggleBold}
							disabled={isDisabled}
						/>
					{/if}
					{#if toolbar.includes('italic')}
						<Button
							kind="ghost"
							size="small"
							icon={TextItalic}
							iconDescription="Italic"
							aria-label="Italic"
							class={isCommandActive('italic') ? 'active' : ''}
							onclick={toggleItalic}
							disabled={isDisabled}
						/>
					{/if}
					{#if toolbar.includes('underline')}
						<Button
							kind="ghost"
							size="small"
							icon={TextUnderline}
							iconDescription="Underline"
							aria-label="Underline"
							class={isCommandActive('underline') ? 'active' : ''}
							onclick={toggleUnderline}
							disabled={isDisabled}
						/>
					{/if}
					{#if toolbar.includes('heading1')}
						<Button
							kind="ghost"
							size="small"
							icon={Heading}
							iconDescription="Heading 1"
							aria-label="Heading 1"
							class={isCommandActive('heading', { level: 1 }) ? 'active' : ''}
							onclick={() => toggleHeading(1)}
							disabled={isDisabled}
						/>
					{/if}
					{#if toolbar.includes('heading2')}
						<Button
							kind="ghost"
							size="small"
							icon={Heading}
							iconDescription="Heading 2"
							aria-label="Heading 2"
							class={isCommandActive('heading', { level: 2 }) ? 'active' : ''}
							onclick={() => toggleHeading(2)}
							disabled={isDisabled}
						/>
					{/if}
					{#if toolbar.includes('heading3')}
						<Button
							kind="ghost"
							size="small"
							icon={Heading}
							iconDescription="Heading 3"
							aria-label="Heading 3"
							class={isCommandActive('heading', { level: 3 }) ? 'active' : ''}
							onclick={() => toggleHeading(3)}
							disabled={isDisabled}
						/>
					{/if}
					{#if toolbar.includes('bulletList')}
						<Button
							kind="ghost"
							size="small"
							icon={ListBulleted}
							iconDescription="Bullet List"
							aria-label="Bullet List"
							class={isCommandActive('bulletList') ? 'active' : ''}
							onclick={toggleBulletList}
							disabled={isDisabled}
						/>
					{/if}
					{#if toolbar.includes('orderedList')}
						<Button
							kind="ghost"
							size="small"
							icon={ListNumbered}
							iconDescription="Numbered List"
							aria-label="Numbered List"
							class={isCommandActive('orderedList') ? 'active' : ''}
							onclick={toggleOrderedList}
							disabled={isDisabled}
						/>
					{/if}
					{#if toolbar.includes('code')}
						<Button
							kind="ghost"
							size="small"
							icon={CodeIcon}
							iconDescription="Code"
							aria-label="Code"
							class={isCommandActive('code') ? 'active' : ''}
							onclick={toggleCode}
							disabled={isDisabled}
						/>
					{/if}
					{#if toolbar.includes('blockquote')}
						<Button
							kind="ghost"
							size="small"
							icon={Quotes}
							iconDescription="Blockquote"
							aria-label="Blockquote"
							class={isCommandActive('blockquote') ? 'active' : ''}
							onclick={toggleBlockquote}
							disabled={isDisabled}
						/>
					{/if}
					{#if toolbar.includes('link')}
						<Button
							kind="ghost"
							size="small"
							icon={LinkIcon}
							iconDescription="Link"
							aria-label="Link"
							class={isCommandActive('link') ? 'active' : ''}
							onclick={() => (showLinkDialog = !showLinkDialog)}
							disabled={isDisabled}
						/>
					{/if}
					{#if toolbar.includes('image')}
						<Button
							kind="ghost"
							size="small"
							icon={ImageIcon}
							iconDescription="Image"
							aria-label="Image"
							onclick={() => (showImageDialog = !showImageDialog)}
							disabled={isDisabled}
						/>
					{/if}
				</ButtonSet>
			</div>
		{/if}

		{#if showLinkDialog}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div class="dialog-overlay" role="dialog" aria-modal="true" tabindex="0" onclick={() => (showLinkDialog = false)}>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="dialog-content" onclick={(e) => e.stopPropagation()}>
					<h3>Add Link</h3>
					<input type="url" bind:value={linkUrl} placeholder="https://example.com" class="dialog-input" />
					<div class="dialog-actions">
						<Button kind="secondary" onclick={() => (showLinkDialog = false)}>Cancel</Button>
						<Button kind="primary" onclick={setLink}>Add Link</Button>
						{#if isCommandActive('link')}
							<Button kind="danger" onclick={unsetLink}>Remove Link</Button>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		{#if showImageDialog}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div class="dialog-overlay" role="dialog" aria-modal="true" tabindex="0" onclick={() => (showImageDialog = false)}>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="dialog-content" onclick={(e) => e.stopPropagation()}>
					<h3>Add Image</h3>
					<input
						type="url"
						bind:value={imageUrl}
						placeholder="https://example.com/image.jpg"
						class="dialog-input"
					/>
					<div class="dialog-actions">
						<Button kind="secondary" onclick={() => (showImageDialog = false)}>Cancel</Button>
						<Button kind="primary" onclick={setImage}>Add Image</Button>
					</div>
				</div>
			</div>
		{/if}

		<div
			bind:this={editorElement}
			id={editorId}
			class="editor-content"
			class:disabled={isDisabled}
			class:invalid={isInvalid}
			role="textbox"
			aria-multiline="true"
			aria-label={field.label}
			aria-describedby={isInvalid ? `error-${field.fieldname}` : undefined}
		></div>

		{#if maxLength}
			<div class="character-count">
				{editorValueLength} / {maxLength}
			</div>
		{/if}
	</div>

	<script>
		function handleDialogKeydown(event: KeyboardEvent, dialogType: 'link' | 'image') {
			if (event.key === 'Escape') {
				if (dialogType === 'link') {
					showLinkDialog = false;
				} else if (dialogType === 'image') {
					showImageDialog = false;
				}
			}
		}
	</script>
</BaseField>

<style>
	.text-editor-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		border: 1px solid var(--cds-ui-03);
		border-radius: 0.25rem;
		background-color: var(--cds-background);
		transition: border-color 0.15s ease-in-out;
	}

	.text-editor-container:focus-within {
		border-color: var(--cds-focus);
		outline: 2px solid var(--cds-focus);
		outline-offset: -2px;
	}

	.text-editor-container.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.text-editor-container.invalid {
		border-color: var(--cds-support-error);
	}

	.editor-toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding: 0.5rem;
		border-bottom: 1px solid var(--cds-ui-03);
		background-color: var(--cds-ui-01);
	}

	.editor-toolbar :global(.bx--btn.active) {
		background-color: var(--cds-primary);
		color: white;
	}

	.editor-content {
		min-height: 150px;
		padding: 1rem;
		overflow-y: auto;
	}

	.editor-content.disabled {
		background-color: var(--cds-ui-02);
	}

	.editor-content.invalid {
		border-color: var(--cds-support-error);
	}

	/* TipTap editor styles */
	:global(.editor-content p) {
		margin: 0 0 1rem 0;
	}

	:global(.editor-content p:last-child) {
		margin-bottom: 0;
	}

	:global(.editor-content h1) {
		font-size: 2rem;
		font-weight: 700;
		margin: 1rem 0;
	}

	:global(.editor-content h2) {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0.75rem 0;
	}

	:global(.editor-content h3) {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0.5rem 0;
	}

	:global(.editor-content ul) {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	:global(.editor-content ol) {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	:global(.editor-content li) {
		margin: 0.25rem 0;
	}

	:global(.editor-content code) {
		background-color: var(--cds-ui-02);
		padding: 0.125rem 0.25rem;
		border-radius: 0.125rem;
		font-family: monospace;
		font-size: 0.875rem;
	}

	:global(.editor-content pre) {
		background-color: var(--cds-ui-02);
		padding: 1rem;
		border-radius: 0.25rem;
		overflow-x: auto;
		margin: 0.5rem 0;
	}

	:global(.editor-content pre code) {
		background-color: transparent;
		padding: 0;
	}

	:global(.editor-content blockquote) {
		border-left: 4px solid var(--cds-ui-03);
		padding-left: 1rem;
		margin: 0.5rem 0;
		font-style: italic;
		color: var(--cds-text-secondary);
	}

	:global(.editor-content a) {
		color: var(--cds-interactive);
		text-decoration: underline;
	}

	:global(.editor-content a:hover) {
		color: var(--cds-interactive-hover);
	}

	:global(.editor-content img) {
		max-width: 100%;
		height: auto;
		margin: 0.5rem 0;
	}

	/* Dialog styles */
	.dialog-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.dialog-content {
		background-color: var(--cds-background);
		padding: 1.5rem;
		border-radius: 0.25rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		min-width: 300px;
		max-width: 500px;
	}

	.dialog-content h3 {
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.dialog-input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--cds-ui-03);
		border-radius: 0.25rem;
		margin-bottom: 1rem;
	}

	.dialog-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.character-count {
		font-size: 0.75rem;
		color: var(--cds-text-secondary);
		text-align: right;
		padding: 0.25rem 0.5rem;
		border-top: 1px solid var(--cds-ui-03);
	}

	/* Responsive design */
	@media (max-width: 672px) {
		.editor-toolbar {
			justify-content: center;
		}

		.editor-content {
			min-height: 120px;
			padding: 0.75rem;
		}
	}
</style>
