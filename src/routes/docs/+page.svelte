<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import SwaggerUI from '$lib/components/swagger-ui.svelte';
	import { DEFAULT_OPENAPI_OPTIONS, MODULE_INFO } from '$lib/meta/openapi';

	// OpenAPI specification URL
	let openApiUrl = '/api/openapi';
	let swaggerConfig = {
		url: openApiUrl,
		dom_id: '#swagger-ui',
		deepLinking: true,
		presets: [
			{
				name: 'SODAF API',
				url: openApiUrl
			}
		],
		plugins: [
			{
				name: 'SODAFTheme',
				components: {
					Layout: {
						options: {
							backgroundColor: '#ffffff',
							textColor: '#161616',
							sidebarBackgroundColor: '#f7f8fa',
							sidebarTextColor: '#323130'
						}
					}
				}
			}
		],
		layout: 'BaseLayout',
		defaultModelsExpandDepth: 1,
		defaultModelExpandDepth: 1,
		displayOperationId: false,
		displayRequestDuration: false,
		docExpansion: 'none',
		filter: true,
		showExtensions: true,
		showCommonExtensions: false,
		tryItOutEnabled: true
	};

	// Page metadata
	let pageTitle = 'API Documentation';
	let pageDescription = 'Interactive API documentation for SODAF';

	// Update page title
	onMount(() => {
		if (browser) {
			document.title = `${pageTitle} - ${DEFAULT_OPENAPI_OPTIONS.title}`;
		}
	});

	// Reactive updates to page URL
	$: if ($page.url.searchParams.has('format')) {
		const format = $page.url.searchParams.get('format');
		openApiUrl = `/api/openapi?format=${format}`;
	} else {
		openApiUrl = '/api/openapi';
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="canonical" href="/docs" />
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<div class="docs-header-content">
			<div class="docs-title">
				<h1>{pageTitle}</h1>
				<p class="docs-subtitle">{pageDescription}</p>
			</div>
			<div class="docs-actions">
				<div class="docs-actions-group">
					<h3>Export Format</h3>
					<div class="format-buttons">
						<a
							href="/api/openapi"
							class="format-button"
							target="_blank"
							rel="noopener noreferrer"
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
											d="M14 2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"
									/>
									<path
											d="M15 4.5a1.5 1.5 0 0 1 1.5h1a1.5 1.5 0 0 1-1.5v1a1.5 1.5 0 0 1-1.5h-1a1.5 1.5 0 0 1 1.5v-1a1.5 1.5 0 0 1 1.5h1a1.5 1.5 0 0 1 1.5v1a1.5 1.5 0 0 1 1.5h-1a1.5 1.5 0 0 1 1.5z"
									/>
							</svg>
							<span>JSON</span>
						</a>
						<a
								href="/api/openapi?format=yaml"
								class="format-button"
								target="_blank"
								rel="noopener noreferrer"
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
										d="M14 2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"
								/>
								<path
										d="M9 9l1.5 1.5L9 12l-1.5 1.5L9 9zm0 0l1.5 1.5L9 12l-1.5 1.5L9 9z"
								/>
							</svg>
							<span>YAML</span>
						</a>
					</div>
				</div>
				<div class="docs-actions-group">
					<h3>API Endpoints</h3>
					<div class="endpoint-links">
						<a href="/api/resource/User" class="endpoint-link">
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
										d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4v-2a4 4 0 0 0-4-4h2a4 4 0 0 0 4 4v2a4 4 0 0 0 4 4h-2a4 4 0 0 0-4-4z"
								/>
								<path
										d="M12 2v20M2 12h20M12 22v-20M2 12"
								/>
							</svg>
							<span>Users API</span>
						</a>
						<a href="/api/resource/ToDo" class="endpoint-link">
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
										d="M9 11l3 3L22 9l-3-3L9 11zm0 0l3 3L22 9l-3-3L9 11z"
								/>
								<path
										d="M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0z"
								/>
							</svg>
							<span>ToDos API</span>
						</a>
					</div>
				</div>
			</div>
		</div>
	</header>

	<main class="docs-main">
		<div class="swagger-container">
			<SwaggerUI config={swaggerConfig} />
		</div>
	</main>

	<footer class="docs-footer">
		<div class="docs-footer-content">
			<div class="docs-footer-info">
				<p>
					&copy; {new Date().getFullYear()} {DEFAULT_OPENAPI_OPTIONS.title}. Powered by
					<a
							href="https://swagger.io/tools/swagger-ui/"
							target="_blank"
							rel="noopener noreferrer"
							class="footer-link"
					>
						Swagger UI
					</a>
				</p>
			</div>
			<div class="docs-footer-links">
				<a href="/api/openapi" class="footer-link">OpenAPI Spec</a>
				<a
						href={DEFAULT_OPENAPI_OPTIONS.license?.url}
						target="_blank"
						rel="noopener noreferrer"
						class="footer-link"
				>
					{DEFAULT_OPENAPI_OPTIONS.license?.name}
				</a>
				<a
						href={MODULE_INFO.repository}
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
	.docs-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background-color: #f8f9fa;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.docs-header {
		background-color: #ffffff;
		border-bottom: 1px solid #e9ecef;
		padding: 1.5rem 0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.docs-header-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 2rem;
	}

	.docs-title {
		flex: 1;
		min-width: 300px;
	}

	.docs-title h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 600;
		color: #161616;
	}

	.docs-subtitle {
		margin: 0;
		font-size: 1rem;
		color: #6c757d;
		line-height: 1.5;
	}

	.docs-actions {
		display: flex;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.docs-actions-group {
		min-width: 200px;
	}

	.docs-actions-group h3 {
		margin: 0 0 1rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #495057;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.format-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.format-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background-color: #ffffff;
		border: 1px solid #dee2e6;
		border-radius: 0.375rem;
		color: #495057;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.format-button:hover {
		background-color: #f8f9fa;
		border-color: #adb5bd;
		color: #495057;
		transform: translateY(-1px);
	}

	.endpoint-links {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.endpoint-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background-color: #ffffff;
		border: 1px solid #dee2e6;
		border-radius: 0.375rem;
		color: #495057;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.endpoint-link:hover {
		background-color: #f8f9fa;
		border-color: #adb5bd;
		color: #495057;
		transform: translateY(-1px);
	}

	.docs-main {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.swagger-container {
		flex: 1;
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
		.docs-header-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 1.5rem;
		}

		.docs-actions {
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
		.docs-title h1 {
			font-size: 1.5rem;
		}

		.format-buttons,
		.endpoint-links {
			flex-direction: column;
			width: 100%;
		}

		.format-button,
		.endpoint-link {
			justify-content: center;
		}
	}
</style>