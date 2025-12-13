<script lang="ts">
	import { enhance } from '$app/forms';
	import { PasswordInput, Button, InlineNotification, InlineLoading, Link } from 'carbon-components-svelte';
	import { Password, ArrowLeft, Checkmark } from 'carbon-icons-svelte';

	interface Props {
		data: {
			valid: boolean;
			error?: string;
			key?: string;
		};
		form?: {
			error?: string;
			success?: boolean;
		};
	}

	let { data, form }: Props = $props();

	// Form state
	let password = $state('');
	let confirmPassword = $state('');
	let isSubmitting = $state(false);

	// Derived state
	let errorMessage = $derived(form?.error || data.error || '');
	let isSuccess = $derived(form?.success === true);
	let isValidLink = $derived(data.valid);

	// Form validation
	let passwordError = $state('');
	let confirmError = $state('');

	function validatePassword(value: string): boolean {
		if (!value) {
			passwordError = 'Password is required';
			return false;
		}
		if (value.length < 8) {
			passwordError = 'Password must be at least 8 characters';
			return false;
		}
		passwordError = '';
		return true;
	}

	function validateConfirm(value: string): boolean {
		if (!value) {
			confirmError = 'Please confirm your password';
			return false;
		}
		if (value !== password) {
			confirmError = 'Passwords do not match';
			return false;
		}
		confirmError = '';
		return true;
	}

	function handlePasswordBlur() {
		validatePassword(password);
	}

	function handleConfirmBlur() {
		validateConfirm(confirmPassword);
	}
</script>

<svelte:head>
	<title>Reset Password - SODAF</title>
</svelte:head>

<div class="reset-container">
	<div class="reset-card">
		<div class="reset-header">
			<Password size={48} class="reset-icon" />
			<h1>Reset Password</h1>
			<p>Enter your new password</p>
		</div>

		{#if isSuccess}
			<InlineNotification
				kind="success"
				title="Password updated"
				subtitle="Your password has been successfully reset."
				hideCloseButton
			/>
			<div class="success-action">
				<Link href="/login">
					<Checkmark size={16} />
					Continue to login
				</Link>
			</div>
		{:else if !isValidLink}
			<InlineNotification
				kind="error"
				title="Invalid link"
				subtitle={errorMessage || 'This password reset link is invalid or has expired.'}
				hideCloseButton
			/>
			<div class="back-to-forgot">
				<Link href="/forgot-password">Request a new reset link</Link>
			</div>
		{:else}
			{#if errorMessage}
				<InlineNotification kind="error" title="Error" subtitle={errorMessage} hideCloseButton />
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					isSubmitting = true;

					return async ({ update }) => {
						isSubmitting = false;
						await update();
					};
				}}
			>
				<div class="form-field">
					<PasswordInput
						id="password"
						name="password"
						labelText="New Password"
						placeholder="Enter new password"
						bind:value={password}
						invalid={!!passwordError}
						invalidText={passwordError}
						onblur={handlePasswordBlur}
						disabled={isSubmitting}
						autocomplete="new-password"
					/>
				</div>

				<div class="form-field">
					<PasswordInput
						id="confirm_password"
						name="confirm_password"
						labelText="Confirm Password"
						placeholder="Confirm new password"
						bind:value={confirmPassword}
						invalid={!!confirmError}
						invalidText={confirmError}
						onblur={handleConfirmBlur}
						disabled={isSubmitting}
						autocomplete="new-password"
					/>
				</div>

				<div class="form-actions">
					{#if isSubmitting}
						<InlineLoading description="Resetting..." />
					{:else}
						<Button type="submit" icon={Password} disabled={isSubmitting}>Reset Password</Button>
					{/if}
				</div>

				<div class="back-to-login">
					<Link href="/login">
						<ArrowLeft size={16} />
						Back to login
					</Link>
				</div>
			</form>
		{/if}
	</div>
</div>

<style>
	.reset-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--cds-background);
		padding: 1rem;
	}

	.reset-card {
		width: 100%;
		max-width: 400px;
		background: var(--cds-layer-01);
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.reset-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.reset-header :global(.reset-icon) {
		color: var(--cds-interactive-01);
		margin-bottom: 1rem;
	}

	.reset-header h1 {
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--cds-text-primary);
		margin: 0 0 0.5rem 0;
	}

	.reset-header p {
		color: var(--cds-text-secondary);
		margin: 0;
	}

	.form-field {
		margin-bottom: 1.5rem;
	}

	.form-actions {
		display: flex;
		justify-content: center;
		margin-bottom: 1.5rem;
	}

	.form-actions :global(.cds--btn) {
		width: 100%;
		max-width: 100%;
		justify-content: center;
	}

	.back-to-login,
	.back-to-forgot,
	.success-action {
		text-align: center;
	}

	.back-to-login :global(a),
	.success-action :global(a) {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	:global(.cds--inline-notification) {
		margin-bottom: 1.5rem;
		max-width: 100%;
	}
</style>
