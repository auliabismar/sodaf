<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Props
	export let config: {
		url: string;
		dom_id: string;
		deepLinking: boolean;
		presets: any[];
		plugins: any[];
		layout?: any;
		defaultModelsExpandDepth?: number;
		defaultModelExpandDepth?: number;
		displayOperationId?: boolean;
		displayRequestDuration?: boolean;
		docExpansion?: string;
		filter?: boolean;
		showExtensions?: boolean;
		showCommonExtensions?: boolean;
		tryItOutEnabled?: boolean;
	};

	let swaggerContainer: HTMLElement;
	let swaggerInitialized = false;

	onMount(async () => {
		if (browser) {
			await loadSwaggerUI();
		}
	});

	async function loadSwaggerUI() {
		if (swaggerInitialized) return;

		try {
			// Load Swagger UI CSS
			await loadStylesheet(
				'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css'
			);

			// Load Swagger UI bundle
			await loadScript(
				'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js'
			);

			// Wait for Swagger UI to be available
			await waitForSwaggerUI();

			// Initialize Swagger UI
			if ((window as any).SwaggerUIBundle) {
				(window as any).SwaggerUIBundle(config.url, config);

				swaggerInitialized = true;
			}
		} catch (error) {
			console.error('Failed to load Swagger UI:', error);
		}
	}

	function loadStylesheet(href: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.type = 'text/css';
			link.href = href;
			link.onload = () => resolve();
			link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
			document.head.appendChild(link);
		});
	}

	function loadScript(src: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = src;
			script.async = true;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
			document.body.appendChild(script);
		});
	}

	function waitForSwaggerUI(): Promise<void> {
		return new Promise((resolve) => {
			const checkInterval = setInterval(() => {
				if ((window as any).SwaggerUIBundle) {
					clearInterval(checkInterval);
					resolve();
				}
			}, 100);

			// Timeout after 10 seconds
			setTimeout(() => {
				clearInterval(checkInterval);
				resolve();
			}, 10000);
		});
	}
</script>

<div bind:this={swaggerContainer} class="swagger-ui-container"></div>

<style>
	.swagger-ui-container {
		width: 100%;
		height: calc(100vh - 200px);
		min-height: 600px;
	}

	/* Override Swagger UI styles for SODAF branding */
	:global(.swagger-ui) {
		--swagger-ui-color-primary: #161616;
		--swagger-ui-color-primary-border: #161616;
		--swagger-ui-color-primary-text: #ffffff;
		--swagger-ui-color-secondary: #f8f9fa;
		--swagger-ui-color-secondary-border: #e9ecef;
		--swagger-ui-color-secondary-text: #495057;
		--swagger-ui-color-accent: #007bff;
		--swagger-ui-color-accent-border: #007bff;
		--swagger-ui-color-accent-text: #ffffff;
		--swagger-ui-color-success: #28a745;
		--swagger-ui-color-success-border: #28a745;
		--swagger-ui-color-success-text: #ffffff;
		--swagger-ui-color-warning: #ffc107;
		--swagger-ui-color-warning-border: #ffc107;
		--swagger-ui-color-warning-text: #212529;
		--swagger-ui-color-danger: #dc3545;
		--swagger-ui-color-danger-border: #dc3545;
		--swagger-ui-color-danger-text: #ffffff;
		--swagger-ui-color-info: #17a2b8;
		--swagger-ui-color-info-border: #17a2b8;
		--swagger-ui-color-info-text: #ffffff;
		--swagger-ui-color-light: #f8f9fa;
		--swagger-ui-color-light-border: #e9ecef;
		--swagger-ui-color-light-text: #495057;
		--swagger-ui-color-dark: #343a40;
		--swagger-ui-color-dark-border: #343a40;
		--swagger-ui-color-dark-text: #ffffff;
		--swagger-ui-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		--swagger-ui-font-size: 14px;
		--swagger-ui-font-size-small: 12px;
		--swagger-ui-font-size-large: 16px;
		--swagger-ui-border-radius: 4px;
		--swagger-ui-border-radius-large: 6px;
		--swagger-ui-border-radius-small: 2px;
		--swagger-ui-border-width: 1px;
		--swagger-ui-border-width-large: 2px;
		--swagger-ui-border-width-small: 0;
	}

	/* Custom SODAF theme overrides */
	:global(.swagger-ui .topbar) {
		background-color: #161616;
		border-bottom: 1px solid #343a40;
	}

	:global(.swagger-ui .topbar .download-url-wrapper) {
		background-color: #343a40;
	}

	:global(.swagger-ui .topbar .download-url-wrapper .select-label) {
		color: #ffffff;
	}

	:global(.swagger-ui .topbar .download-url-wrapper select) {
		background-color: #495057;
		border-color: #6c757d;
		color: #ffffff;
	}

	:global(.swagger-ui .info) {
		margin: 2rem 0;
	}

	:global(.swagger-ui .info .title) {
		color: #161616;
		font-size: 2rem;
		font-weight: 600;
	}

	:global(.swagger-ui .info .description) {
		color: #495057;
		font-size: 1rem;
		line-height: 1.5;
	}

	:global(.swagger-ui .scheme-container) {
		background-color: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: var(--swagger-ui-border-radius);
		margin: 1rem 0;
	}

	:global(.swagger-ui .opblock.opblock-section) {
		background-color: #ffffff;
		border: 1px solid #e9ecef;
		border-radius: var(--swagger-ui-border-radius);
		margin-bottom: 1rem;
	}

	:global(.swagger-ui .opblock.opblock-section .opblock-summary) {
		color: #161616;
		font-weight: 600;
		background-color: #f8f9fa;
		border-bottom: 1px solid #e9ecef;
	}

	:global(.swagger-ui .opblock.opblock-section .opblock-summary-control) {
		background-color: #e9ecef;
		border-radius: 0 var(--swagger-ui-border-radius) var(--swagger-ui-border-radius) 0;
	}

	:global(.swagger-ui .opblock.opblock-section .opblock-summary-control .arrow) {
		color: #495057;
	}

	:global(.swagger-ui .opblock.opblock-section .opblock-description-wrapper) {
		background-color: #ffffff;
		padding: 1rem;
	}

	:global(.swagger-ui .opblock.opblock-section .opblock-description-wrapper p) {
		color: #495057;
		line-height: 1.6;
	}

	:global(.swagger-ui .opblock.opblock-section .opblock-description-wrapper .renderedMarkdown) {
		color: #495057;
	}

	:global(.swagger-ui .opblock.opblock-section table) {
		border: 1px solid #e9ecef;
		border-radius: var(--swagger-ui-border-radius);
	}

	:global(.swagger-ui .opblock.opblock-section table thead th) {
		background-color: #f8f9fa;
		border-bottom: 2px solid #e9ecef;
		color: #495057;
		font-weight: 600;
	}

	:global(.swagger-ui .opblock.opblock-section table tbody tr:nth-child(odd)) {
		background-color: #f8f9fa;
	}

	:global(.swagger-ui .opblock.opblock-section table tbody tr:nth-child(even)) {
		background-color: #ffffff;
	}

	:global(.swagger-ui .opblock.opblock-section table td) {
		border-bottom: 1px solid #e9ecef;
		color: #495057;
	}

	:global(.swagger-ui .opblock.opblock-section .parameter__name) {
		font-weight: 600;
		color: #161616;
	}

	:global(.swagger-ui .opblock.opblock-section .parameter__type) {
		color: #007bff;
		background-color: #e7f3ff;
		border-radius: var(--swagger-ui-border-radius-small);
		padding: 0.25rem 0.5rem;
		font-size: var(--swagger-ui-font-size-small);
		font-weight: 600;
	}

	:global(.swagger-ui .opblock.opblock-section .parameter__in) {
		color: #28a745;
		background-color: #d4edda;
		border-radius: var(--swagger-ui-border-radius-small);
		padding: 0.25rem 0.5rem;
		font-size: var(--swagger-ui-font-size-small);
		font-weight: 600;
	}

	:global(.swagger-ui .btn) {
		background-color: #007bff;
		border-color: #007bff;
		color: #ffffff;
		border-radius: var(--swagger-ui-border-radius);
		font-weight: 500;
	}

	:global(.swagger-ui .btn:hover) {
		background-color: #0056b3;
		border-color: #0056b3;
	}

	:global(.swagger-ui .btn.authorize) {
		background-color: #28a745;
		border-color: #28a745;
	}

	:global(.swagger-ui .btn.authorize:hover) {
		background-color: #1e7e34;
		border-color: #1e7e34;
	}

	:global(.swagger-ui .response-control-status) {
		color: #28a745;
		background-color: #d4edda;
		border-radius: var(--swagger-ui-border-radius-small);
		padding: 0.25rem 0.5rem;
		font-size: var(--swagger-ui-font-size-small);
		font-weight: 600;
	}

	:global(.swagger-ui .response-control-status.success) {
		color: #ffffff;
		background-color: #28a745;
	}

	:global(.swagger-ui .response-control-status.error) {
		color: #ffffff;
		background-color: #dc3545;
	}

	:global(.swagger-ui .response-control-status.warning) {
		color: #212529;
		background-color: #ffc107;
	}

	:global(.swagger-ui .tab li.active) {
		background-color: #007bff;
		border-color: #007bff;
		color: #ffffff;
	}

	:global(.swagger-ui .tab li:hover) {
		background-color: #e9ecef;
		border-color: #dee2e6;
	}

	:global(.swagger-ui .scheme-container) {
		background-color: #ffffff;
		border: 1px solid #e9ecef;
		border-radius: var(--swagger-ui-border-radius);
		margin: 1rem 0;
	}

	:global(.swagger-ui .loading-container) {
		background-color: #ffffff;
		border-radius: var(--swagger-ui-border-radius);
		padding: 2rem;
		text-align: center;
	}

	:global(.swagger-ui .loading-container .loading) {
		color: #495057;
		font-size: var(--swagger-ui-font-size-large);
		font-weight: 500;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.swagger-ui-container {
			height: calc(100vh - 150px);
		}
	}

	@media (max-width: 480px) {
		.swagger-ui-container {
			height: calc(100vh - 100px);
		}
	}
</style>