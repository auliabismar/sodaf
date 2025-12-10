<script lang="ts">
	import { FileUploader, Button, ProgressBar } from 'carbon-components-svelte';
	import { Close, Document, FolderOpen } from 'carbon-icons-svelte';
	import BaseField from './BaseField.svelte';
	import type { DocField } from '../../../meta/doctype/types';

	interface Props {
		field: DocField;
		value?: File[] | null;
		error?: string | string[];
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		description?: string;
		hideLabel?: boolean;
		accept?: string;
		multiple?: boolean;
		maxSize?: number;
		maxFiles?: number;
		onchange?: (value: File[]) => void;
		onblur?: (event: FocusEvent) => void;
		onfocus?: (event: FocusEvent) => void;
		onerror?: (errors: string[]) => void;
	}

	let {
		field,
		value = $bindable([]),
		error = '',
		disabled = false,
		readonly = false,
		required = false,
		description = '',
		hideLabel = false,
		accept = '*',
		multiple = true,
		maxSize = 5 * 1024 * 1024,
		maxFiles = 10,
		onchange,
		onblur,
		onfocus,
		onerror
	}: Props = $props();

	// Internal state
	let files = $state<File[]>([]);
	let uploadProgress = $state<Record<string, number>>({});
	let isDragOver = $state(false);

	// Computed properties
	let uploaderId = $derived(`uploader-${field.fieldname}`);
	let hasFiles = $derived(files && files.length > 0);
	let hasError = $derived(!!error && error !== '');
	let isDisabled = $derived(disabled || readonly || field.read_only);
	// let isRequired = $derived(required || field.required); // unused in template?
	let totalFiles = $derived(files.length);
	let canAddMore = $derived(!multiple ? files.length === 0 : files.length < maxFiles);

	// Initialize files from value prop
	$effect(() => {
		if (value && Array.isArray(value)) {
			// Avoid loop if files match?
			// Comparison of File objects is tricky.
			// Assuming we just sync if length differs or value changed from outside.
			// Ideally we don't rebuild 'files' if it was just set by us.
			// But 'files' is local state. 'value' is prop.
			// If we update 'value', this effect runs.
			// We can check if arrays are identical reference (unlikely) or content.
			// For now, naive sync might cause re-renders but probably safe if no infinite loop.
			// To be safe, we can check lengths or names.
			if (files.length !== value.length || !files.every((f, i) => f === value![i])) {
				files = [...value];
			}
		}
	});

	// Event handlers
	function handleFileChange(event: CustomEvent<FileList> | any) {
		const fileList = event.detail; // detail is FileList or File[] depending on carbon version/usage? Carbon usually emits FileList in detail
		if (
			!fileList ||
			(fileList instanceof FileList && fileList.length === 0) ||
			(Array.isArray(fileList) && fileList.length === 0)
		)
			return;

		const newFiles = Array.from(fileList as FileList); // Cast to handle FileList
		const validFiles: File[] = [];
		const errors: string[] = [];

		// Validate files
		newFiles.forEach((file) => {
			// Check file size
			if (file.size > maxSize) {
				errors.push(`File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`);
				return;
			}

			// Check file type if accept is specified
			if (accept !== '*' && !isFileTypeAccepted(file, accept)) {
				errors.push(`File "${file.name}" is not an accepted file type`);
				return;
			}

			validFiles.push(file);
		});

		// Check max files limit
		if (multiple && files.length + validFiles.length > maxFiles) {
			errors.push(`Cannot add more than ${maxFiles} files`);
			return;
		}

		// If not multiple, replace existing files
		const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;

		if (errors.length > 0) {
			onerror?.(errors);
		}

		files = updatedFiles;
		value = updatedFiles;
		onchange?.(updatedFiles);

		// Simulate upload progress
		simulateUploadProgress(validFiles);
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;

		if (isDisabled) return;

		const fileList = event.dataTransfer?.files;
		if (fileList && fileList.length > 0) {
			handleFileChange({ detail: fileList });
		}
	}

	function removeFile(index: number) {
		const updatedFiles = files.filter((_, i) => i !== index);
		files = updatedFiles;
		value = updatedFiles;
		onchange?.(updatedFiles);
	}

	function clearAllFiles() {
		files = [];
		value = [];
		onchange?.([]);
	}

	function simulateUploadProgress(filesToUpload: File[]) {
		filesToUpload.forEach((file) => {
			uploadProgress[file.name] = 0;

			// Simulate progress
			const interval = setInterval(() => {
				// Use update pattern
				const current = uploadProgress[file.name] || 0;
				uploadProgress[file.name] = current + Math.random() * 30;

				if (uploadProgress[file.name] >= 100) {
					uploadProgress[file.name] = 100;
					clearInterval(interval);
				}
			}, 200);
		});
	}

	function isFileTypeAccepted(file: File, accept: string): boolean {
		const acceptedTypes = accept.split(',').map((type) => type.trim());
		return acceptedTypes.some((type) => {
			if (type.startsWith('.')) {
				return file.name.endsWith(type);
			}
			if (type.includes('*')) {
				const baseType = type.split('/')[0];
				return file.type.startsWith(baseType);
			}
			return file.type === type;
		});
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function getFileIcon(file: File) {
		if (file.type.startsWith('image/')) {
			return Document; // Could use Image icon if available
		}
		return Document;
	}

	function handleFieldChange(event: CustomEvent | any) {
		onchange?.(event.detail);
	}

	function handleFieldBlur(event?: FocusEvent) {
		if (event) {
			onblur?.(event);
		} else {
			// Create a synthetic FocusEvent when no event is available
			const syntheticEvent = new FocusEvent('blur');
			onblur?.(syntheticEvent);
		}
	}

	function handleFieldFocus(event?: FocusEvent) {
		if (event) {
			onfocus?.(event);
		} else {
			// Create a synthetic FocusEvent when no event is available
			const syntheticEvent = new FocusEvent('focus');
			onfocus?.(syntheticEvent);
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
	onchange={(event) => handleFieldChange(event)}
	onblur={() => handleFieldBlur()}
	onfocus={() => handleFieldFocus()}
>
	<div
		class="attach-field-container"
		class:drag-over={isDragOver}
		class:disabled={isDisabled}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		role="region"
		aria-label="File upload dropzone"
	>
		{#if !isDisabled && canAddMore}
			<FileUploader
				id={uploaderId}
				buttonLabel={multiple ? 'Drop files here or click to upload' : 'Drop file here or click to upload'}
				labelTitle={multiple ? 'Upload files' : 'Upload file'}
				labelDescription={`${multiple ? 'Maximum ' + maxFiles + ' files' : 'Maximum 1 file'}, up to ${formatFileSize(maxSize)} each`}
				accept={accept.split(',')}
				{multiple}
				disabled={isDisabled}
				onchange={(e) => handleFileChange({ detail: (e.target as HTMLInputElement)?.files })}
				kind="primary"
				size="field"
			/>
		{:else if isDisabled}
			<div class="disabled-message">
				<FolderOpen size={20} />
				<span>File upload is disabled</span>
			</div>
		{:else if !canAddMore}
			<div class="max-files-message">
				<span>Maximum number of files ({maxFiles}) reached</span>
			</div>
		{/if}

		{#if hasFiles}
			<div class="files-container">
				<div class="files-header">
					<h4>Files ({totalFiles})</h4>
					{#if !isDisabled}
						<Button kind="ghost" size="small" onclick={clearAllFiles} disabled={isDisabled}>Clear All</Button>
					{/if}
				</div>

				<div class="files-list">
					{#each files as file, index}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="file-item" class:uploading={uploadProgress[file.name] < 100}>
							<div class="file-info">
								{#if uploadProgress[file.name] !== undefined && uploadProgress[file.name] < 100}
									<ProgressBar value={uploadProgress[file.name] || 0} max={100} size="sm" />
								{:else}
									{@const FileIcon = getFileIcon(file)}
									<FileIcon />
								{/if}
								<div class="file-details">
									<span class="file-name" title={file.name}>{file.name}</span>
									<span class="file-size">{formatFileSize(file.size)}</span>
								</div>
							</div>
							{#if !isDisabled}
								<Button
									kind="ghost"
									size="small"
									icon={Close}
									iconDescription={`Remove ${file.name}`}
									onclick={() => removeFile(index)}
									disabled={isDisabled}
								/>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</BaseField>

<style>
	.attach-field-container {
		width: 100%;
		min-height: 120px;
		border: 2px dashed var(--cds-ui-03);
		border-radius: 4px;
		padding: 1rem;
		transition: all 0.2s ease;
		background-color: var(--cds-ui-01);
	}

	.attach-field-container.drag-over {
		border-color: var(--cds-interactive-04);
		background-color: var(--cds-highlight-01);
	}

	.attach-field-container.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.disabled-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		color: var(--cds-text-secondary);
		font-style: italic;
	}

	.max-files-message {
		padding: 1rem;
		color: var(--cds-text-secondary);
		font-style: italic;
		text-align: center;
	}

	.files-container {
		margin-top: 1rem;
		width: 100%;
	}

	.files-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.files-header h4 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--cds-text-primary);
	}

	.files-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.file-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background-color: var(--cds-ui-02);
		border-radius: 4px;
		border: 1px solid var(--cds-ui-03);
		transition: all 0.2s ease;
	}

	.file-item:hover {
		background-color: var(--cds-ui-03);
	}

	.file-item.uploading {
		background-color: var(--cds-ui-01);
		border-color: var(--cds-interactive-04);
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.file-details {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
	}

	.file-name {
		font-weight: 500;
		color: var(--cds-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.file-size {
		font-size: 0.75rem;
		color: var(--cds-text-secondary);
	}

	/* Responsive design */
	@media (max-width: 672px) {
		.attach-field-container {
			padding: 0.75rem;
			min-height: 100px;
		}

		.files-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.file-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.file-info {
			width: 100%;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.attach-field-container {
			border-color: ButtonText;
		}

		.attach-field-container.drag-over {
			border-color: Highlight;
		}

		.file-item {
			border-color: ButtonText;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.attach-field-container,
		.file-item {
			transition: none;
		}
	}
</style>
