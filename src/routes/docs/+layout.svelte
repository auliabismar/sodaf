<script>
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	// Page metadata
	$: pageTitle = $page.url.pathname === '/docs'
		? 'API Documentation'
		: 'SODAF Documentation';

	$: pageDescription = $page.url.pathname === '/docs'
		? 'Interactive API documentation for SODAF'
		: 'Documentation for SODAF framework';

	// Update page title
	$: if (browser) {
		document.title = pageTitle;
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="canonical" href="/docs" />
</svelte:head>

<div class="docs-layout">
	<nav class="docs-nav">
		<div class="docs-nav-content">
			<div class="docs-nav-brand">
				<a href="/" class="brand-link">
					<svg
						width="32"
						height="32"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path
							d="M12 2L2 7a10 10 0 0 10-10 2 7a10 10 0 0 10-10V9a10 10 0 0 10-10h2a10 10 0 0 10-10z"
						/>
						<path
							d="M16 8v8a8 8 0 1 1-8H8a8 8 0 1 1-8v-8a8 8 0 1 1-8z"
						/>
						<path
							d="M20 8v-2a2 2 0 1 1-2H4a2 2 0 1 1-2v-2a2 2 0 1 1-2H4a2 2 0 1 1-2z"
						/>
						<path
							d="M14 6l4-4-4-4h-4v-4a4 4 0 1 1-4h-4v-4a4 4 0 1 1-4h-4v-4a4 4 0 1 1-4z"
						/>
						<path
							d="M22 12h-4l-4-4h-4v-4a4 4 0 1 1-4h-4v-4a4 4 0 1 1-4z"
						/>
					</svg>
					<span class="brand-text">SODAF</span>
				</a>
			</div>
			<div class="docs-nav-menu">
				<a
					href="/docs"
					class="nav-link {$page.url.pathname === '/docs' ? 'active' : ''}"
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path
							d="M3 9a9 9 0 1 1-9h6a9 9 0 1 1-9v-9a9 9 0 1 1-9h-3a9 9 0 1 1-9z"
						/>
						<path
							d="M9 19a10 10 0 1 1-10h3a10 10 0 1 1-10v-1a10 10 0 1 1-10h-3a10 10 0 1 1-10z"
						/>
					</svg>
					<span>API Docs</span>
				</a>
				<a
					href="/"
					class="nav-link {$page.url.pathname === '/' ? 'active' : ''}"
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path
							d="M10 20v-6H4a4 4 0 1 1-4v-4a4 4 0 1 1-4h-6a4 4 0 1 1-4v-1a4 4 0 1 1-4h-6a4 4 0 1 1-4v-1a4 4 0 1 1-4z"
						/>
						<path
							d="M3 5a2 2 0 1 1-2h14a2 2 0 1 1-2v-1a2 2 0 1 1-2h-14a2 2 0 1 1-2z"
						/>
					</svg>
					<span>Home</span>
				</a>
			</div>
		</div>
	</nav>

	<main class="docs-main">
		<slot />
	</main>

	<footer class="docs-footer">
		<div class="docs-footer-content">
			<div class="docs-footer-info">
				<p>
					&copy; {new Date().getFullYear()} SODAF. Powered by
					<a
						href="https://svelte.dev"
						target="_blank"
						rel="noopener noreferrer"
						class="footer-link"
					>
						SvelteKit
					</a>
				</p>
			</div>
			<div class="docs-footer-links">
				<a href="/api/openapi" class="footer-link">OpenAPI Spec</a>
				<a
					href="https://github.com/sodaf/sodaf"
					target="_blank"
					rel="noopener noreferrer"
					class="footer-link"
				>
					GitHub
				</a>
			</div>
		</div>
	</footer>
</div>

<style>
	.docs-layout {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background-color: #f8f9fa;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.docs-nav {
		background-color: #ffffff;
		border-bottom: 1px solid #e9ecef;
		padding: 1rem 0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.docs-nav-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 2rem;
	}

	.docs-nav-brand {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.brand-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: #495057;
		font-weight: 600;
		transition: color 0.2s ease;
	}

	.brand-link:hover {
		color: #212529;
	}

	.brand-text {
		font-size: 1.25rem;
		font-weight: 700;
		color: #161616;
	}

	.docs-nav-menu {
		display: flex;
		gap: 1rem;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background-color: transparent;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		color: #6c757d;
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.nav-link:hover {
		background-color: #f8f9fa;
		border-color: #e9ecef;
		color: #495057;
	}

	.nav-link.active {
		background-color: #007bff;
		border-color: #007bff;
		color: #ffffff;
	}

	.docs-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		background-color: #ffffff;
	}

	.docs-footer {
		background-color: #ffffff;
		border-top: 1px solid #e9ecef;
		padding: 1.5rem 0;
		margin-top: auto;
	}

	.docs-footer-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 2rem;
	}

	.docs-footer-info {
		flex: 1;
		color: #6c757d;
		font-size: 0.875rem;
	}

	.docs-footer-info p {
		margin: 0;
	}

	.footer-link {
		color: #495057;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s ease;
	}

	.footer-link:hover {
		color: #212529;
		text-decoration: underline;
	}

	.docs-footer-links {
		display: flex;
		gap: 1.5rem;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.docs-nav-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.docs-nav-menu {
			width: 100%;
			justify-content: space-between;
		}

		.docs-footer-content {
			flex-direction: column;
			align-items: center;
			gap: 1rem;
		}

		.docs-footer-links {
			flex-wrap: wrap;
			justify-content: center;
		}
	}

	@media (max-width: 480px) {
		.docs-nav-content {
			padding: 0 1rem;
		}

		.brand-text {
			font-size: 1.125rem;
		}

		.docs-nav-menu {
			flex-direction: column;
			gap: 0.75rem;
		}

		.nav-link {
			justify-content: center;
		}

		.docs-footer-content {
			padding: 0 1rem;
		}
	}
</style>