<script lang="ts">
	import { enhance } from '$app/forms';
	import { TextInput, Button, InlineNotification, InlineLoading, Link } from 'carbon-components-svelte';
	import { Email, ArrowLeft } from 'carbon-icons-svelte';

	interface Props {
		form?: {
			error?: string;
			email?: string;
			success?: boolean;
		};
	}

	let { form }: Props = $props();

	// Form state
	let email = $state(form?.email || '');
	let isSubmitting = $state(false);

	// Derived state
	let errorMessage = $derived(form?.error || '');
	let isSuccess = $derived(form?.success === true);

	// Form validation
	let emailError = $state('');

	function validateEmail(value: string): boolean {
		if (!value) {
			emailError = 'Email is required';
			return false;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
			emailError = 'Please enter a valid email address';
			return false;
		}
		emailError = '';
		return true;
	}

	function handleEmailBlur() {
		validateEmail(email);
	}
</script>

<svelte:head>
	<title>Forgot Password - SODAF</title>
</svelte:head>

<div class="forgot-container">
	<div class="forgot-card">
		<div class="forgot-header">
			<Email size={48} class="forgot-icon" />
			<h1>Forgot Password</h1>
			<p>Enter your email and we'll send you a reset link</p>
		</div>

		{#if isSuccess}
			<InlineNotification
				kind="success"
				title="Check your email"
				subtitle="If an account exists with this email, you'll receive a password reset link."
				hideCloseButton
			/>
			<div class="back-to-login">
				<Link href="/login">
					<ArrowLeft size={16} />
					Back to login
				</Link>
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
					<TextInput
						id="email"
						name="email"
						labelText="Email"
						placeholder="you@example.com"
						bind:value={email}
						invalid={!!emailError}
						invalidText={emailError}
						onblur={handleEmailBlur}
						disabled={isSubmitting}
						autocomplete="email"
					/>
				</div>

				<div class="form-actions">
					{#if isSubmitting}
						<InlineLoading description="Sending..." />
					{:else}
						<Button type="submit" icon={Email} disabled={isSubmitting}>Send Reset Link</Button>
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
	.forgot-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--cds-background);
		padding: 1rem;
	}

	.forgot-card {
		width: 100%;
		max-width: 400px;
		background: var(--cds-layer-01);
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.forgot-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.forgot-header :global(.forgot-icon) {
		color: var(--cds-interactive-01);
		margin-bottom: 1rem;
	}

	.forgot-header h1 {
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--cds-text-primary);
		margin: 0 0 0.5rem 0;
	}

	.forgot-header p {
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

	.back-to-login {
		text-align: center;
	}

	.back-to-login :global(a) {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	:global(.cds--inline-notification) {
		margin-bottom: 1.5rem;
		max-width: 100%;
	}
</style>
