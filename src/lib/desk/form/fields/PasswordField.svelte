<script lang="ts">
	import { TextInput, Button } from 'carbon-components-svelte';
	import { View, ViewOff, Checkmark, Warning, ErrorFilled } from 'carbon-icons-svelte';
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
		placeholder?: string;
		showStrengthIndicator?: boolean;
		minLength?: number;
		requireUppercase?: boolean;
		requireLowercase?: boolean;
		requireNumbers?: boolean;
		requireSpecialChars?: boolean;
		onchange?: (value: string) => void;
		onblur?: () => void;
		onfocus?: () => void;
	}

	let {
		field,
		value = '',
		error = '',
		disabled = false,
		readonly = false,
		required = false,
		description = '',
		hideLabel = false,
		placeholder = '',
		showStrengthIndicator = true,
		minLength = 8,
		requireUppercase = true,
		requireLowercase = true,
		requireNumbers = true,
		requireSpecialChars = true,
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Internal state
	let showPassword = $state(false);
	let passwordStrength = $state<'weak' | 'medium' | 'strong' | 'very-strong'>('weak');
	let strengthScore = $state(0);
	let strengthFeedback: string[] = $state([]);

	// Computed properties
	let inputId = $derived(`input-${field.fieldname}`);
	let inputPlaceholder = $derived(placeholder || field.label || '');
	let isInvalid = $derived(!!error);
	let isDisabled = $derived(disabled || readonly || field.read_only);
	let hasValue = $derived(value && value.length > 0);

	// Event handlers
	function handleChange(event: CustomEvent<string>) {
		const newValue = event.detail;
		// Note: calculatePasswordStrength calculates from newValue
		// but since we want strength to reflect current input, and this component doesn't bind value locally,
		// we rely on parent updation OR we calculate here.
		// Since we use 'value' prop for reactivity, and onchange notifies parent,
		// we should rely on 'value' prop updating to trigger recalculation via $effect.

		// HOWEVER, to improve responsiveness, we can recalculate immediately for feedback,
		// OR we can trust $effect on 'value'. Let's trust $effect on 'value' for cleaner code if latency is low.
		onchange?.(newValue);
	}

	// Recalculate strength when value matches
	$effect(() => {
		if (value) {
			calculatePasswordStrength(value);
		} else {
			calculatePasswordStrength('');
		}
	});

	function handleBlur(event: FocusEvent) {
		onblur?.();
	}

	function handleFocus(event: FocusEvent) {
		onfocus?.();
	}

	function togglePasswordVisibility() {
		if (isDisabled) return;
		showPassword = !showPassword;
	}

	// Password strength calculation
	function calculatePasswordStrength(password: string) {
		if (!password) {
			passwordStrength = 'weak';
			strengthScore = 0;
			strengthFeedback = [];
			return;
		}

		let score = 0;
		const feedback: string[] = [];

		// Length check
		if (password.length >= minLength) {
			score += 1;
		} else {
			feedback.push(`At least ${minLength} characters`);
		}

		// Uppercase check
		if (requireUppercase && /[A-Z]/.test(password)) {
			score += 1;
		} else if (requireUppercase) {
			feedback.push('At least one uppercase letter');
		}

		// Lowercase check
		if (requireLowercase && /[a-z]/.test(password)) {
			score += 1;
		} else if (requireLowercase) {
			feedback.push('At least one lowercase letter');
		}

		// Numbers check
		if (requireNumbers && /\d/.test(password)) {
			score += 1;
		} else if (requireNumbers) {
			feedback.push('At least one number');
		}

		// Special characters check
		if (requireSpecialChars && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
			score += 1;
		} else if (requireSpecialChars) {
			feedback.push('At least one special character');
		}

		// Bonus points for length
		if (password.length >= 12) {
			score += 1;
		}
		if (password.length >= 16) {
			score += 1;
		}

		strengthScore = score;
		strengthFeedback = feedback;

		// Determine strength level
		if (score <= 2) {
			passwordStrength = 'weak';
		} else if (score <= 4) {
			passwordStrength = 'medium';
		} else if (score <= 6) {
			passwordStrength = 'strong';
		} else {
			passwordStrength = 'very-strong';
		}
	}

	// Get strength indicator color
	function getStrengthColor(): string {
		switch (passwordStrength) {
			case 'weak':
				return 'var(--cds-support-error)';
			case 'medium':
				return 'var(--cds-support-warning)';
			case 'strong':
				return 'var(--cds-support-success)';
			case 'very-strong':
				return 'var(--cds-support-success)';
			default:
				return 'var(--cds-support-error)';
		}
	}

	// Get strength indicator text
	function getStrengthText(): string {
		switch (passwordStrength) {
			case 'weak':
				return 'Weak';
			case 'medium':
				return 'Medium';
			case 'strong':
				return 'Strong';
			case 'very-strong':
				return 'Very Strong';
			default:
				return 'Weak';
		}
	}

	// Get strength icon
	function getStrengthIcon() {
		switch (passwordStrength) {
			case 'weak':
				return ErrorFilled;
			case 'medium':
				return Warning;
			case 'strong':
			case 'very-strong':
				return Checkmark;
			default:
				return ErrorFilled;
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
	{onchange}
	{onblur}
	{onfocus}
>
	<div class="password-field-container">
		<div class="password-input-wrapper">
			<TextInput
				id={inputId}
				type={showPassword ? 'text' : 'password'}
				{value}
				disabled={isDisabled}
				{readonly}
				placeholder={inputPlaceholder}
				invalid={isInvalid}
				invalidText={Array.isArray(error) ? error.join(', ') : error}
				onchange={(e) => {
					const customEvent = new CustomEvent('change', {
						detail: (e.target as HTMLInputElement).value
					});
					handleChange(customEvent);
				}}
				onblur={handleBlur}
				onfocus={handleFocus}
			/>
			<Button
				class="password-toggle-button"
				kind="ghost"
				size="small"
				disabled={isDisabled}
				icon={showPassword ? ViewOff : View}
				iconDescription={showPassword ? 'Hide password' : 'Show password'}
				aria-label={showPassword ? 'Hide password' : 'Show password'}
				onclick={togglePasswordVisibility}
			/>
		</div>

		{#if showStrengthIndicator && hasValue}
			<div class="password-strength-indicator">
				<div class="strength-bar-container">
					<div
						class="strength-bar"
						style="width: {Math.min(strengthScore * 16.67, 100)}%; background-color: {getStrengthColor()}"
					></div>
				</div>
				<div class="strength-info">
					<span class="strength-text" style="color: {getStrengthColor()}">
						{getStrengthIcon()}
						{getStrengthText()}
					</span>
				</div>
			</div>

			{#if strengthFeedback.length > 0}
				<div class="password-feedback">
					<ul class="feedback-list">
						{#each strengthFeedback as feedback}
							<li class="feedback-item">
								<Warning class="feedback-icon" size={16} />
								{feedback}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		{/if}
	</div>
</BaseField>

<style>
	.password-field-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}

	.password-input-wrapper {
		position: relative;
		display: flex;
		align-items: stretch;
		width: 100%;
	}

	.password-input-wrapper :global(.cds--text-input) {
		flex: 1;
		padding-right: 3rem;
	}

	:global(.password-toggle-button) {
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		z-index: 1;
		min-width: 2.5rem;
		height: 2.5rem;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.password-strength-indicator {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: 0.25rem;
	}

	.strength-bar-container {
		width: 100%;
		height: 4px;
		background-color: var(--cds-ui-02);
		border-radius: 2px;
		overflow: hidden;
	}

	.strength-bar {
		height: 100%;
		transition:
			width 0.3s ease,
			background-color 0.3s ease;
	}

	.strength-info {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.25rem;
	}

	.strength-text {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.password-feedback {
		margin-top: 0.25rem;
	}

	.feedback-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.feedback-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: var(--cds-text-secondary);
		margin-bottom: 0.125rem;
	}

	/* .feedback-icon {
		color: var(--cds-support-warning);
		flex-shrink: 0;
	} */

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.strength-bar-container {
			border: 1px solid WindowText;
		}

		.strength-text {
			color: WindowText;
		}

		.feedback-item {
			color: WindowText;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.strength-bar {
			transition: none;
		}
	}
</style>
