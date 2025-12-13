<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		TextInput,
		PasswordInput,
		Button,
		Checkbox,
		InlineNotification,
		InlineLoading,
		Link
	} from 'carbon-components-svelte';
	import { Login } from 'carbon-icons-svelte';

	interface Props {
		form?: {
			error?: string;
			email?: string;
		};
	}

	let { form }: Props = $props();

	// Form state
	let email = $state(form?.email || '');
	let password = $state('');
	let rememberMe = $state(false);
	let isSubmitting = $state(false);

	// Error state from form action
	let errorMessage = $derived(form?.error || '');

	// Form validation
	let emailError = $state('');
	let passwordError = $state('');

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

	function validatePassword(value: string): boolean {
		if (!value) {
			passwordError = 'Password is required';
			return false;
		}
		passwordError = '';
		return true;
	}

	function handleEmailBlur() {
		validateEmail(email);
	}

	function handlePasswordBlur() {
		validatePassword(password);
	}
</script>

<svelte:head>
	<title>Login - SODAF</title>
</svelte:head>

<div class="login-container">
	<div class="login-card">
		<div class="login-header">
			<Login size={48} class="login-icon" />
			<h1>Welcome Back</h1>
			<p>Sign in to continue to SODAF</p>
		</div>

		{#if errorMessage}
			<InlineNotification kind="error" title="Login failed" subtitle={errorMessage} hideCloseButton />
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				// P3-021-T12: Loading state during submission
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

			<div class="form-field">
				<PasswordInput
					id="password"
					name="password"
					labelText="Password"
					placeholder="Enter your password"
					bind:value={password}
					invalid={!!passwordError}
					invalidText={passwordError}
					onblur={handlePasswordBlur}
					disabled={isSubmitting}
					autocomplete="current-password"
				/>
			</div>

			<div class="form-options">
				<Checkbox
					id="remember_me"
					name="remember_me"
					labelText="Remember me"
					bind:checked={rememberMe}
					disabled={isSubmitting}
				/>

				<!-- P3-021-T5: Forgot password link -->
				<Link href="/forgot-password" class="forgot-link">Forgot password?</Link>
			</div>

			<div class="form-actions">
				{#if isSubmitting}
					<InlineLoading description="Signing in..." />
				{:else}
					<Button type="submit" icon={Login} disabled={isSubmitting}>Sign in</Button>
				{/if}
			</div>
		</form>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--cds-background);
		padding: 1rem;
	}

	.login-card {
		width: 100%;
		max-width: 400px;
		background: var(--cds-layer-01);
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.login-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.login-header :global(.login-icon) {
		color: var(--cds-interactive-01);
		margin-bottom: 1rem;
	}

	.login-header h1 {
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--cds-text-primary);
		margin: 0 0 0.5rem 0;
	}

	.login-header p {
		color: var(--cds-text-secondary);
		margin: 0;
	}

	.form-field {
		margin-bottom: 1.5rem;
	}

	.form-options {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	:global(.forgot-link) {
		font-size: 0.875rem;
	}

	.form-actions {
		display: flex;
		justify-content: center;
	}

	.form-actions :global(.cds--btn) {
		width: 100%;
		max-width: 100%;
		justify-content: center;
	}

	:global(.cds--inline-notification) {
		margin-bottom: 1.5rem;
		max-width: 100%;
	}
</style>
