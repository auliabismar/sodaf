<script lang="ts">
	import { Star, StarFilled } from 'carbon-icons-svelte';
	import BaseField from './BaseField.svelte';
	import type { DocField } from '../../../meta/doctype/types';

	interface Props {
		field: DocField;
		value?: number;
		error?: string | string[];
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		description?: string;
		hideLabel?: boolean;
		maxRating?: number;
		showValue?: boolean;
		allowHalfStars?: boolean;
		size?: 'small' | 'medium' | 'large';
		onchange?: (value: number) => void;
		onblur?: (event: FocusEvent) => void;
		onfocus?: (event: FocusEvent) => void;
	}

	let {
		field,
		value = $bindable(0),
		error = '',
		disabled = false,
		readonly = false,
		required = false,
		description = '',
		hideLabel = false,
		maxRating = 5,
		showValue = true,
		allowHalfStars = false,
		size = 'medium',
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Internal state
	let hoverValue = $state(0);
	let isHovering = $state(false);

	// Computed properties
	let inputId = $derived(`input-${field.fieldname}`);
	let isInvalid = $derived(!!error);
	let isDisabled = $derived(disabled || readonly || field.read_only);
	let displayValue = $derived(allowHalfStars ? Math.round(value * 2) / 2 : Math.round(value));
	let ratingPercentage = $derived((displayValue / maxRating) * 100);
	let starSize = $derived(getStarSize(size));
	let hasValue = $derived(value > 0);

	// Event handlers
	function handleChange(newValue: number) {
		value = newValue;
		onchange?.(newValue);
	}

	function handleBlur(event: FocusEvent) {
		onblur?.(event);
	}

	function handleFocus(event: FocusEvent) {
		onfocus?.(event);
	}

	function handleStarClick(rating: number) {
		if (isDisabled) return;

		const newValue = rating;
		handleChange(newValue);
	}

	function handleStarHover(rating: number) {
		if (isDisabled) return;

		hoverValue = rating;
		isHovering = true;
	}

	function handleStarLeave() {
		if (isDisabled) return;

		hoverValue = 0;
		isHovering = false;
	}

	function handleHalfStarClick(rating: number) {
		if (isDisabled || !allowHalfStars) return;

		const newValue = rating - 0.5;
		handleChange(newValue);
	}

	function handleHalfStarHover(rating: number) {
		if (isDisabled || !allowHalfStars) return;

		hoverValue = rating - 0.5;
		isHovering = true;
	}

	// Keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		if (isDisabled) return;

		let newValue = value;

		switch (event.key) {
			case 'ArrowRight':
			case 'ArrowUp':
				event.preventDefault();
				newValue = Math.min(value + (allowHalfStars ? 0.5 : 1), maxRating);
				break;
			case 'ArrowLeft':
			case 'ArrowDown':
				event.preventDefault();
				newValue = Math.max(value - (allowHalfStars ? 0.5 : 1), 0);
				break;
			case 'Home':
				event.preventDefault();
				newValue = 0;
				break;
			case 'End':
				event.preventDefault();
				newValue = maxRating;
				break;
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9':
				event.preventDefault();
				const rating = parseInt(event.key, 10);
				if (rating <= maxRating) {
					newValue = rating;
				}
				break;
			default:
				return;
		}

		if (newValue !== value) {
			handleChange(newValue);
		}
	}

	// Helper functions
	function getStarSize(size: string): 16 | 20 | 24 | 32 {
		switch (size) {
			case 'small':
				return 16;
			case 'large':
				return 32;
			default:
				return 24;
		}
	}

	function getStarFill(starIndex: number): 'empty' | 'half' | 'full' {
		const rating = isHovering ? hoverValue : displayValue;
		const starPosition = starIndex + 1;

		if (rating >= starPosition) {
			return 'full';
		} else if (allowHalfStars && rating >= starPosition - 0.5) {
			return 'half';
		} else {
			return 'empty';
		}
	}

	function getAriaLabel(starIndex: number): string {
		const starPosition = starIndex + 1;
		return `Rate ${starPosition} ${starPosition === 1 ? 'star' : 'stars'}`;
	}

	function getRatingText(): string {
		if (!hasValue) return 'Not rated';

		let ratingText = '';
		const rating = displayValue;

		if (maxRating === 5) {
			switch (Math.round(rating)) {
				case 0:
					ratingText = 'Not rated';
					break;
				case 1:
					ratingText = 'Poor';
					break;
				case 2:
					ratingText = 'Fair';
					break;
				case 3:
					ratingText = 'Good';
					break;
				case 4:
					ratingText = 'Very Good';
					break;
				case 5:
					ratingText = 'Excellent';
					break;
				default:
					ratingText = `${rating} out of ${maxRating}`;
			}
		} else {
			ratingText = `${rating} out of ${maxRating}`;
		}

		return ratingText;
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
	{onchange}
	onblur={() => onblur?.(new FocusEvent('blur'))}
	onfocus={() => onfocus?.(new FocusEvent('focus'))}
>
	<div class="rating-field-container">
		<div
			class="rating-stars"
			role="slider"
			tabindex={isDisabled ? -1 : 0}
			aria-label={`Rating, current value ${displayValue} of ${maxRating}`}
			aria-valuemin="0"
			aria-valuemax={maxRating}
			aria-valuenow={displayValue}
			aria-disabled={isDisabled}
			aria-readonly={readonly}
			onkeydown={handleKeydown}
			onmouseleave={handleStarLeave}
		>
			{#each Array(maxRating) as _, starIndex}
				<div class="star-container" class:hovering={isHovering}>
					{#if allowHalfStars}
						<div class="star-half-container">
							<button
								class="star-half star-left"
								type="button"
								disabled={isDisabled}
								aria-label={getAriaLabel(starIndex) + ' (half)'}
								onclick={() => handleHalfStarClick(starIndex + 1)}
								onmouseenter={() => handleHalfStarHover(starIndex + 1)}
							>
								{#if getStarFill(starIndex) === 'full'}
									<StarFilled class="star-icon star-filled" size={starSize} />
								{:else if getStarFill(starIndex) === 'half'}
									<StarFilled class="star-icon star-half-left" size={starSize} />
								{:else}
									<Star class="star-icon" size={starSize} />
								{/if}
							</button>
							<button
								class="star-half star-right"
								type="button"
								disabled={isDisabled}
								aria-label={getAriaLabel(starIndex)}
								onclick={() => handleStarClick(starIndex + 1)}
								onmouseenter={() => handleStarHover(starIndex + 1)}
							>
								{#if getStarFill(starIndex) === 'full'}
									<StarFilled class="star-icon" size={starSize} />
								{:else if getStarFill(starIndex) === 'half'}
									<StarFilled class="star-icon star-half-right" size={starSize} />
								{:else}
									<Star class="star-icon" size={starSize} />
								{/if}
							</button>
						</div>
					{:else}
						<button
							class="star-button"
							type="button"
							disabled={isDisabled}
							aria-label={getAriaLabel(starIndex)}
							onclick={() => handleStarClick(starIndex + 1)}
							onmouseenter={() => handleStarHover(starIndex + 1)}
						>
							{#if getStarFill(starIndex) === 'full'}
								<StarFilled class="star-icon" size={starSize} />
							{:else}
								<Star class="star-icon" size={starSize} />
							{/if}
						</button>
					{/if}
				</div>
			{/each}
		</div>

		{#if showValue}
			<div class="rating-value">
				<span class="rating-number">{displayValue}</span>
				<span class="rating-max">/ {maxRating}</span>
				{#if maxRating === 5}
					<span class="rating-text">({getRatingText()})</span>
				{/if}
			</div>
		{/if}

		{#if hasValue}
			<div class="rating-percentage">
				<div class="percentage-bar">
					<div class="percentage-fill" style="width: {ratingPercentage}%"></div>
				</div>
				<span class="percentage-text">{Math.round(ratingPercentage)}%</span>
			</div>
		{/if}
	</div>
</BaseField>

<style>
	.rating-field-container {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
	}

	.rating-stars {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		outline: none;
	}

	.rating-stars:focus {
		outline: 2px solid var(--cds-focus);
		outline-offset: 2px;
		border-radius: 0.25rem;
		padding: 0.25rem;
	}

	.star-container {
		position: relative;
		display: flex;
		align-items: center;
	}

	.star-container.hovering {
		transform: scale(1.05);
	}

	.star-button,
	.star-half {
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		border-radius: 0.25rem;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--cds-icon-secondary);
	}

	.star-button:hover:not(:disabled),
	.star-half:hover:not(:disabled) {
		background-color: var(--cds-background-hover);
		color: var(--cds-icon-primary);
	}

	.star-button:focus,
	.star-half:focus {
		outline: 2px solid var(--cds-focus);
		outline-offset: 1px;
	}

	.star-button:disabled,
	.star-half:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	/* .star-button:hover .star-icon:not(:disabled),
	.star-half:hover .star-icon:not(:disabled) {
		transform: scale(1.1);
	} */

	.star-half-container {
		position: relative;
		display: flex;
		align-items: center;
	}

	.star-half {
		width: 50%;
		position: relative;
		overflow: hidden;
	}

	.star-left {
		z-index: 2;
	}

	.star-right {
		z-index: 1;
	}

	/* .star-half-left {
		clip-path: inset(0 50% 0 0);
	}

	.star-half-right {
		clip-path: inset(0 0 0 50%);
	} */

	/* Filled stars */
	/* .star-button:has(.star-filled) .star-icon,
	.star-half:has(.star-filled) .star-icon {
		color: var(--cds-support-warning);
	}

	.star-filled {
		color: var(--cds-support-warning);
	} */


	.rating-value {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: var(--cds-text-primary);
	}

	.rating-number {
		font-weight: 600;
		font-size: 1.125rem;
	}

	.rating-max {
		color: var(--cds-text-secondary);
	}

	.rating-text {
		color: var(--cds-text-secondary);
		font-style: italic;
	}

	.rating-percentage {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.percentage-bar {
		flex: 1;
		height: 4px;
		background-color: var(--cds-ui-02);
		border-radius: 2px;
		overflow: hidden;
		min-width: 100px;
	}

	.percentage-fill {
		height: 100%;
		background-color: var(--cds-support-warning);
		transition: width 0.3s ease;
	}

	.percentage-text {
		font-size: 0.75rem;
		color: var(--cds-text-secondary);
		font-weight: 500;
		min-width: 40px;
		text-align: right;
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.star-button,
		.star-half {
			border: 1px solid WindowText;
		}

		.star-button:hover:not(:disabled),
		.star-half:hover:not(:disabled) {
			background-color: Highlight;
			color: HighlightText;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.star-button,
		.star-half {
			transition: none !important;
		}

		.rating-percentage .percentage-fill {
			transition: none !important;
		}
	}

	/* Responsive design */
	@media (max-width: 672px) {
		.rating-field-container {
			gap: 0.5rem;
		}

		.rating-stars {
			gap: 0.125rem;
		}

		.rating-value {
			font-size: 0.75rem;
		}

		.rating-number {
			font-size: 1rem;
		}

		.percentage-bar {
			min-width: 80px;
		}

		.percentage-text {
			min-width: 32px;
			font-size: 0.6875rem;
		}
	}
</style>
