<script lang="ts">
	import { onMount } from 'svelte';
	import { FileUploader, Button, Modal, Slider } from 'carbon-components-svelte';
	import { Close, ZoomIn, ZoomOut, Crop, Download, Document } from 'carbon-icons-svelte';
	import BaseField from './BaseField.svelte';
	import type { DocField } from '../../../meta/doctype/types';

	interface Props {
		field: DocField;
		value?: File | null;
		error?: string | string[];
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		description?: string;
		hideLabel?: boolean;
		accept?: string;
		maxSize?: number;
		maxWidth?: number;
		maxHeight?: number;
		enableCrop?: boolean;
		enableZoom?: boolean;
		onchange?: (value: File | null) => void;
		onblur?: (event: FocusEvent) => void;
		onfocus?: (event: FocusEvent) => void;
		onerror?: (errors: string[]) => void;
	}

	let {
		field,
		value = $bindable(null),
		error = '',
		disabled = false,
		readonly = false,
		required = false,
		description = '',
		hideLabel = false,
		accept = 'image/*',
		maxSize = 10 * 1024 * 1024,
		maxWidth = 1920,
		maxHeight = 1080,
		enableCrop = true,
		enableZoom = true,
		onchange,
		onblur,
		onfocus,
		onerror
	}: Props = $props();

	// Internal state
	let uploaderId = $derived(`uploader-${field.fieldname}`);
	let imagePreview = $state<string | null>(null);
	let originalImage = $state<HTMLImageElement | null>(null);
	let croppedImage = $state<string | null>(null);
	let cropModalOpen = $state(false);
	let zoomLevel = $state(1);
	let cropX = $state(0);
	let cropY = $state(0);
	let cropWidth = $state(100);
	let cropHeight = $state(100);
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let canvas = $state<HTMLCanvasElement>();
	let ctx = $state<CanvasRenderingContext2D>();

	// Computed properties
	let hasImage = $derived(value || imagePreview);
	let hasError = $derived(!!error && error !== '');
	let isDisabled = $derived(disabled || readonly || field.read_only);
	// let isRequired = $derived(required || field.required);
	let currentImageSrc = $derived(croppedImage || imagePreview);

	// Initialize image preview from value prop
	$effect(() => {
		if (value && value instanceof File && !imagePreview) {
			createImagePreview(value);
		}
	});

	// Setup canvas context on mount
	$effect(() => {
		if (canvas && !ctx) {
			ctx = canvas.getContext('2d')!;
		}
	});

	// Event handlers
	function handleFileChange(event: CustomEvent<FileList> | any) {
		const fileList = event.detail;
		if (!fileList || (fileList instanceof FileList && fileList.length === 0)) return;

		const file = fileList[0];

		// Validate file type
		if (!file.type.startsWith('image/')) {
			onerror?.(['Please select an image file']);
			return;
		}

		// Validate file size
		if (file.size > maxSize) {
			onerror?.([`Image size exceeds maximum of ${formatFileSize(maxSize)}`]);
			return;
		}

		value = file;
		createImagePreview(file);
		onchange?.(file);
	}

	function createImagePreview(file: File) {
		const reader = new FileReader();
		reader.onload = (e) => {
			imagePreview = e.target?.result as string;

			// Load image to get dimensions
			const img = new Image();
			img.onload = () => {
				originalImage = img;

				// Initialize crop area to cover the entire image
				cropX = 0;
				cropY = 0;
				cropWidth = img.width;
				cropHeight = img.height;
				zoomLevel = 1;
			};
			img.src = imagePreview;
		};
		reader.readAsDataURL(file);
	}

	function openCropModal() {
		if (!imagePreview) return;
		cropModalOpen = true;
	}

	function closeCropModal() {
		cropModalOpen = false;
	}

	function applyCrop() {
		if (!originalImage || !canvas || !ctx) return;

		// Calculate the actual crop dimensions based on zoom level
		const actualCropWidth = cropWidth / zoomLevel;
		const actualCropHeight = cropHeight / zoomLevel;
		const actualCropX = cropX / zoomLevel;
		const actualCropY = cropY / zoomLevel;

		// Set canvas size to the crop dimensions
		canvas.width = actualCropWidth;
		canvas.height = actualCropHeight;

		// Draw the cropped image
		ctx.drawImage(
			originalImage,
			actualCropX,
			actualCropY,
			actualCropWidth,
			actualCropHeight,
			0,
			0,
			actualCropWidth,
			actualCropHeight
		);

		// Convert canvas to blob and update value
		canvas.toBlob(
			(blob) => {
				if (blob) {
					const croppedFile = new File([blob], value?.name || 'cropped-image.jpg', {
						type: 'image/jpeg'
					});
					value = croppedFile;
					croppedImage = canvas!.toDataURL('image/jpeg');
					onchange?.(croppedFile);
					closeCropModal();
				}
			},
			'image/jpeg',
			0.9
		);
	}

	function resetCrop() {
		if (!originalImage) return;

		cropX = 0;
		cropY = 0;
		cropWidth = originalImage.width;
		cropHeight = originalImage.height;
		zoomLevel = 1;
	}

	function handleZoomIn() {
		if (zoomLevel < 3) {
			zoomLevel = Math.min(zoomLevel + 0.25, 3);
		}
	}

	function handleZoomOut() {
		if (zoomLevel > 0.5) {
			zoomLevel = Math.max(zoomLevel - 0.25, 0.5);
		}
	}

	function handleSliderChange(event: CustomEvent<number> | any) {
		zoomLevel = event.detail !== undefined ? event.detail : parseFloat(event.target.value);
	}

	function handleMouseDown(event: MouseEvent) {
		if (!enableCrop) return;
		isDragging = true;
		dragStartX = event.clientX - cropX;
		dragStartY = event.clientY - cropY;
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging || !enableCrop) return;

		const newX = event.clientX - dragStartX;
		const newY = event.clientY - dragStartY;

		// Constrain to image boundaries
		if (originalImage) {
			cropX = Math.max(0, Math.min(newX, originalImage.width - cropWidth));
			cropY = Math.max(0, Math.min(newY, originalImage.height - cropHeight));
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function downloadImage() {
		if (!currentImageSrc) return;

		const link = document.createElement('a');
		link.href = currentImageSrc;
		link.download = value?.name || 'image.jpg';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function removeImage() {
		value = null;
		imagePreview = null;
		croppedImage = null;
		originalImage = null;
		onchange?.(null);
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function handleFieldChange(event: CustomEvent | any) {
		onchange?.(event.detail);
	}

	function handleFieldBlur(event: FocusEvent) {
		onblur?.(event);
	}

	function handleFieldFocus(event: FocusEvent) {
		onfocus?.(event);
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
	onchange={handleFieldChange}
	onblur={() => handleFieldBlur(new FocusEvent('blur'))}
	onfocus={() => handleFieldFocus(new FocusEvent('focus'))}
>
	<div class="attach-image-field-container" class:disabled={isDisabled}>
		{#if !hasImage && !isDisabled}
			<FileUploader
				id={uploaderId}
				labelTitle="Upload image"
				labelDescription={`Maximum size: ${formatFileSize(maxSize)}`}
				accept={accept.split(',')}
				multiple={false}
				disabled={isDisabled}
				onchange={(e: any) => handleFileChange({ detail: e.target?.files })}
				kind="primary"
				size="field"
			/>
		{:else if isDisabled && !hasImage}
			<div class="disabled-message">
				<Document size={20} />
				<span>Image upload is disabled</span>
			</div>
		{/if}

		{#if hasImage}
			<div class="image-preview-container">
				<div class="image-preview">
					<img src={currentImageSrc} alt="Preview" class="preview-image" />
				</div>

				<div class="image-controls">
					{#if !isDisabled}
						{#if enableCrop}
							<Button
								kind="ghost"
								size="small"
								icon={Crop}
								iconDescription="Crop image"
								onclick={openCropModal}
								disabled={isDisabled}
							>
								Crop
							</Button>
						{/if}

						<Button
							kind="ghost"
							size="small"
							icon={Close}
							iconDescription="Remove image"
							onclick={removeImage}
							disabled={isDisabled}
						>
							Remove
						</Button>
					{/if}

					<Button
						kind="ghost"
						size="small"
						icon={Download}
						iconDescription="Download image"
						onclick={downloadImage}
					>
						Download
					</Button>
				</div>

				{#if value}
					<div class="image-info">
						<span class="image-name">{value.name}</span>
						<span class="image-size">{formatFileSize(value.size)}</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Crop Modal -->
	<Modal
		open={cropModalOpen}
		size="lg"
		modalHeading="Crop Image"
		modalLabel="Image Editor"
		primaryButtonText="Apply Crop"
		secondaryButtonText="Cancel"
		on:click:button--primary={applyCrop}
		on:click:button--secondary={closeCropModal}
		onclose={closeCropModal}
	>
		<div class="crop-modal-content">
			{#if imagePreview}
				<div class="crop-container">
					<div class="crop-controls">
						{#if enableZoom}
							<div class="zoom-controls">
								<Button
									kind="ghost"
									size="small"
									icon={ZoomOut}
									iconDescription="Zoom out"
									onclick={handleZoomOut}
									disabled={zoomLevel <= 0.5}
								/>
								<Slider
									min={0.5}
									max={3}
									step={0.25}
									value={zoomLevel}
									onchange={handleSliderChange}
									labelText="Zoom"
									hideLabel={true}
								/>
								<Button
									kind="ghost"
									size="small"
									icon={ZoomIn}
									iconDescription="Zoom in"
									onclick={handleZoomIn}
									disabled={zoomLevel >= 3}
								/>
							</div>
						{/if}

						<Button kind="ghost" size="small" onclick={resetCrop}>Reset</Button>
					</div>

					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<div
						class="crop-area"
						class:draggable={enableCrop}
						onmousedown={handleMouseDown}
						onmousemove={handleMouseMove}
						onmouseup={handleMouseUp}
						onmouseleave={handleMouseUp}
						role="application"
						aria-label="Image cropping area"
						tabindex="0"
					>
						<!-- svelte-ignore a11y_img_redundant_alt -->
						<img
							src={imagePreview}
							alt="Crop preview"
							class="crop-image"
							style="transform: scale({zoomLevel}); transform-origin: top left;"
						/>

						{#if enableCrop}
						<div
							class="crop-overlay"
							style="left: {cropX}px; top: {cropY}px; width: {cropWidth}px; height: {cropHeight}px;"
						></div>
						{/if}
					</div>
				</div>

				<!-- Hidden canvas for cropping -->
				<canvas bind:this={canvas} style="display: none;"></canvas>
				{/if}
			</div>
		</Modal>
</BaseField>

<style>
	.attach-image-field-container {
		width: 100%;
		min-height: 120px;
	}

	.disabled-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		color: var(--cds-text-secondary);
		font-style: italic;
	}

	.image-preview-container {
		margin-top: 1rem;
		width: 100%;
	}

	.image-preview {
		margin-bottom: 1rem;
		border: 1px solid var(--cds-ui-03);
		border-radius: 4px;
		overflow: hidden;
		background-color: var(--cds-ui-01);
	}

	.preview-image {
		max-width: 100%;
		max-height: 300px;
		display: block;
		margin: 0 auto;
		object-fit: contain;
	}

	.image-controls {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
	}

	.image-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
		color: var(--cds-text-secondary);
	}

	.image-name {
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 70%;
	}

	.image-size {
		color: var(--cds-text-secondary);
	}

	/* Crop Modal Styles */
	.crop-modal-content {
		padding: 1rem 0;
	}

	.crop-container {
		width: 100%;
		max-height: 500px;
		overflow: auto;
		border: 1px solid var(--cds-ui-03);
		border-radius: 4px;
		background-color: var(--cds-ui-01);
	}

	.crop-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		border-bottom: 1px solid var(--cds-ui-03);
		background-color: var(--cds-ui-02);
	}

	.zoom-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		max-width: 300px;
	}

	.crop-area {
		position: relative;
		display: inline-block;
		cursor: crosshair;
		overflow: hidden;
	}

	.crop-area.draggable {
		cursor: move;
	}

	.crop-image {
		display: block;
		max-width: 100%;
		user-select: none;
		pointer-events: none;
	}

	.crop-overlay {
		position: absolute;
		border: 2px solid var(--cds-interactive-04);
		background-color: rgba(255, 255, 255, 0.1);
		pointer-events: none;
		box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
	}

	/* Responsive design */
	@media (max-width: 672px) {
		.attach-image-field-container {
			min-height: 100px;
		}

		.image-controls {
			flex-direction: column;
			align-items: stretch;
		}

		.crop-controls {
			flex-direction: column;
			gap: 0.75rem;
		}

		.zoom-controls {
			max-width: 100%;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.image-preview {
			border-color: ButtonText;
		}

		.crop-overlay {
			border-color: Highlight;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.crop-image {
			transition: none;
		}
	}
</style>

export default AttachImageField;
