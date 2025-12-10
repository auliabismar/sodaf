<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from 'carbon-components-svelte';
	import { Edit, TrashCan, Download, Checkmark } from 'carbon-icons-svelte';
	import BaseField from './BaseField.svelte';
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
		width?: number;
		height?: number;
		penColor?: string;
		penWidth?: number;
		backgroundColor?: string;
		showDownloadButton?: boolean;
		format?: 'png' | 'jpeg' | 'svg';
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
		width = 400,
		height = 200,
		penColor = '#000000',
		penWidth = 2,
		backgroundColor = '#ffffff',
		showDownloadButton = true,
		format = 'png',
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Internal state
	let canvas = $state<HTMLCanvasElement>();
	let ctx = $state<CanvasRenderingContext2D>();
	let isDrawing = $state(false);
	let isEmpty = $state(true);
	let lastX = $state(0);
	let lastY = $state(0);

	// Computed properties
	let inputId = $derived(`input-${field.fieldname}`);
	let isInvalid = $derived(!!error);
	let isDisabled = $derived(disabled || readonly || field.read_only);
	let hasValue = $derived(value && value.length > 0);

	// Event handlers
	function handleChange(newValue: string) {
		value = newValue;
		onchange?.(newValue);
	}

	function handleBlur() {
		onblur?.();
	}

	function handleFocus() {
		onfocus?.();
	}

	// Canvas event handlers
	function handleMouseDown(event: MouseEvent) {
		if (isDisabled || !canvas) return;

		isDrawing = true;
		isEmpty = false;

		const rect = canvas.getBoundingClientRect();
		lastX = event.clientX - rect.left;
		lastY = event.clientY - rect.top;

		if (ctx) {
			ctx.beginPath();
			ctx.moveTo(lastX, lastY);
		}
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDrawing || isDisabled || !canvas || !ctx) return;

		const rect = canvas.getBoundingClientRect();
		const currentX = event.clientX - rect.left;
		const currentY = event.clientY - rect.top;

		ctx.lineTo(currentX, currentY);
		ctx.stroke();

		lastX = currentX;
		lastY = currentY;
	}

	function handleMouseUp() {
		if (!isDrawing) return;

		isDrawing = false;
		saveSignature();
	}

	function handleMouseLeave() {
		if (isDrawing) {
			isDrawing = false;
			saveSignature();
		}
	}

	// Touch event handlers
	function handleTouchStart(event: TouchEvent) {
		if (isDisabled || !canvas) return;

		event.preventDefault();
		isDrawing = true;
		isEmpty = false;

		const rect = canvas.getBoundingClientRect();
		const touch = event.touches[0];
		lastX = touch.clientX - rect.left;
		lastY = touch.clientY - rect.top;

		if (ctx) {
			ctx.beginPath();
			ctx.moveTo(lastX, lastY);
		}
	}

	function handleTouchMove(event: TouchEvent) {
		if (!isDrawing || isDisabled || !canvas || !ctx) return;

		event.preventDefault();
		const rect = canvas.getBoundingClientRect();
		const touch = event.touches[0];
		const currentX = touch.clientX - rect.left;
		const currentY = touch.clientY - rect.top;

		ctx.lineTo(currentX, currentY);
		ctx.stroke();

		lastX = currentX;
		lastY = currentY;
	}

	function handleTouchEnd(event: TouchEvent) {
		if (!isDrawing) return;

		event.preventDefault();
		isDrawing = false;
		saveSignature();
	}

	// Canvas operations
	function clearSignature() {
		if (isDisabled || !canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		isEmpty = true;
		handleChange('');
	}

	function saveSignature() {
		if (isEmpty || isDisabled || !canvas || !ctx) return;

		let signatureData = '';

		switch (format) {
			case 'png':
				signatureData = canvas.toDataURL('image/png');
				break;
			case 'jpeg':
				signatureData = canvas.toDataURL('image/jpeg', 0.9);
				break;
			case 'svg':
				signatureData = canvasToSVG();
				break;
		}

		handleChange(signatureData);
	}

	function downloadSignature() {
		if (!hasValue || isDisabled) return;

		const link = document.createElement('a');
		link.download = `signature-${field.fieldname}-${Date.now()}.${format}`;
		link.href = value;
		link.click();
	}

	function canvasToSVG(): string {
		if (!canvas || !ctx) return '';

		// Convert canvas to SVG format (basic implementation)
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const paths: string[] = [];

		for (let y = 0; y < canvas.height; y++) {
			for (let x = 0; x < canvas.width; x++) {
				const index = (y * canvas.width + x) * 4;
				const r = imageData.data[index];
				const g = imageData.data[index + 1];
				const b = imageData.data[index + 2];
				const a = imageData.data[index + 3];

				// Check if pixel is not background color (assumes white/solid background check roughly)
				// Or check alpha?
				// Simple check: if alpha > 0 and not fully white (if bg is white)
				// For simplicity, just checking if not fully transparent/white logic from original
				if (a > 0 && (r !== 255 || g !== 255 || b !== 255)) {
					paths.push(`M${x},${y} L${x + 1},${y + 1}`);
				}
			}
		}

		const svg = `
			<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
				<rect width="100%" height="100%" fill="${backgroundColor}"/>
				<path d="${paths.join(' ')}" stroke="${penColor}" stroke-width="${penWidth}" fill="none"/>
			</svg>
		`;

		return `data:image/svg+xml;base64,${btoa(svg)}`;
	}

	function initializeCanvas() {
		if (!canvas) return;

		// Set canvas size
		canvas.width = width;
		canvas.height = height;

		// Get context
		const context = canvas.getContext('2d');
		if (!context) return;
		ctx = context;

		// Set drawing styles
		ctx.strokeStyle = penColor;
		ctx.lineWidth = penWidth;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

		// Set background
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Load existing signature if available
		if (value) {
			loadSignature(value);
		}
	}

	function loadSignature(signatureData: string) {
		if (!ctx || !canvas) return;

		const img = new Image();
		img.onload = () => {
			if (!ctx || !canvas) return;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, 0, 0);
			isEmpty = false;
		};
		img.src = signatureData;
	}

	// Lifecycle
	onMount(() => {
		initializeCanvas();

		// Handle window resize
		const handleResize = () => {
			// Save current signature
			const currentSignature = value;
			initializeCanvas();
			if (currentSignature) {
				loadSignature(currentSignature);
			}
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	// Update canvas when properties change
	$effect(() => {
		if (canvas && ctx) {
			ctx.strokeStyle = penColor;
			ctx.lineWidth = penWidth;
		}
	});
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
	onchange={(event: CustomEvent | any) => handleChange(event.detail || event)}
	onblur={handleBlur}
	onfocus={handleFocus}
>
	<div class="signature-field-container">
		<div class="signature-canvas-wrapper">
			<canvas
				bind:this={canvas}
				class="signature-canvas"
				class:disabled={isDisabled}
				{width}
				{height}
				aria-label="Signature canvas"
				tabindex={isDisabled ? -1 : 0}
				onmousedown={handleMouseDown}
				onmousemove={handleMouseMove}
				onmouseup={handleMouseUp}
				onmouseleave={handleMouseLeave}
				ontouchstart={handleTouchStart}
				ontouchmove={handleTouchMove}
				ontouchend={handleTouchEnd}
				onkeydown={(e) => {
					if (isDisabled) return;
					if (e.key === 'Delete' || e.key === 'Backspace') {
						e.preventDefault();
						clearSignature();
					}
				}}
			></canvas>

			{#if isEmpty && !isDisabled}
				<div class="signature-placeholder">
					<Edit class="placeholder-icon" size={24} />
					<span class="placeholder-text">Click or touch to sign</span>
				</div>
			{/if}
		</div>

		<div class="signature-controls">
			<Button
				kind="secondary"
				size="small"
				disabled={isDisabled || isEmpty}
				icon={TrashCan}
				iconDescription="Clear signature"
				onclick={clearSignature}
			>
				Clear
			</Button>

			{#if showDownloadButton}
				<Button
					kind="primary"
					size="small"
					disabled={isDisabled || !hasValue}
					icon={Download}
					iconDescription="Download signature"
					onclick={downloadSignature}
				>
					Download
				</Button>
			{/if}

			{#if hasValue}
				<div class="signature-status">
					<Checkmark class="status-icon" size={16} />
					<span class="status-text">Signature captured</span>
				</div>
			{/if}
		</div>

		{#if hasValue}
			<div class="signature-preview">
				<img src={value} alt="Signature preview" class="preview-image" />
			</div>
		{/if}
	</div>
</BaseField>

<style>
	.signature-field-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	.signature-canvas-wrapper {
		position: relative;
		display: inline-block;
		border: 2px solid var(--cds-ui-03);
		border-radius: 0.25rem;
		overflow: hidden;
		background-color: var(--cds-layer-01);
	}

	.signature-canvas {
		display: block;
		cursor: crosshair;
		touch-action: none;
	}

	.signature-canvas.disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.signature-canvas:focus {
		outline: 2px solid var(--cds-focus);
		outline-offset: 2px;
	}

	.signature-placeholder {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: var(--cds-text-disabled);
		background-color: var(--cds-layer-01);
		pointer-events: none;
		gap: 0.5rem;
	}

	/* .placeholder-icon {
		opacity: 0.5;
	} */

	.placeholder-text {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.signature-controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.signature-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-left: auto;
		color: var(--cds-support-success);
		font-size: 0.875rem;
		font-weight: 500;
	}

	/* .status-icon {
		flex-shrink: 0;
	} */

	.signature-preview {
		margin-top: 0.5rem;
		border: 1px solid var(--cds-ui-03);
		border-radius: 0.25rem;
		padding: 0.5rem;
		background-color: var(--cds-layer-01);
		max-width: 200px;
	}

	.preview-image {
		width: 100%;
		height: auto;
		border-radius: 0.125rem;
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.signature-canvas-wrapper {
			border: 2px solid WindowText;
		}

		.signature-canvas:focus {
			outline: 3px solid WindowText;
			outline-offset: 2px;
		}

		.signature-preview {
			border: 2px solid WindowText;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.signature-canvas {
			transition: none;
		}
	}

	/* Mobile responsiveness */
	@media (max-width: 672px) {
		.signature-controls {
			flex-direction: column;
			align-items: stretch;
		}

		.signature-status {
			margin-left: 0;
			align-self: center;
		}

		.signature-preview {
			max-width: 100%;
		}
	}
</style>
