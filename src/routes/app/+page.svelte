<script lang="ts">
	/**
	 * App Root Page
	 * P3-020-T1: Redirects to default workspace
	 */
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// Redirect to default workspace
		goto('/app/workspace/home', { replaceState: true });
	});
</script>

<div class="app-redirect" data-testid="app-redirect">
	<div class="loading-spinner"></div>
	<p>Redirecting to workspace...</p>
</div>

<style>
	.app-redirect {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		gap: 1rem;
		color: var(--text-muted, #6b7280);
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--border-subtle, #e5e7eb);
		border-top-color: var(--primary, #3b82f6);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
