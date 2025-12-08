/**
 * OpenAPI Specification Server
 *
 * This SvelteKit server endpoint serves the OpenAPI 3.0 specification
 * for all available DocTypes in JSON format.
 *
 * @module routes/api/openapi
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { generateOpenAPIJSON, DEFAULT_OPENAPI_OPTIONS } from '$lib/meta/openapi';
import { DocTypeEngine } from '$lib/meta/doctype';

/**
 * GET /api/openapi - Serve OpenAPI specification
 *
 * Returns the complete OpenAPI 3.0 specification for all available DocTypes.
 * Supports query parameters for customization:
 * - format: 'json' | 'yaml' (default: 'json')
 * - includeDeprecated: boolean (default: false)
 * - includeInternal: boolean (default: false)
 * - baseUrl: string (default: http://localhost:5173)
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		// Parse query parameters
		const searchParams = url.searchParams;
		const format = searchParams.get('format') || 'json';
		const includeDeprecated = searchParams.get('includeDeprecated') === 'true';
		const includeInternal = searchParams.get('includeInternal') === 'true';
		const baseUrl = searchParams.get('baseUrl') || DEFAULT_OPENAPI_OPTIONS.baseUrl;

		// Validate format
		if (!['json', 'yaml'].includes(format)) {
			return json(
				{
					error: true,
					message: 'Invalid format parameter. Supported formats: json, yaml',
					error_code: 'INVALID_FORMAT'
				},
				{ status: 400 }
			);
		}

		// Get all DocTypes
		const docTypeEngine = DocTypeEngine.getInstance();
		const doctypes = await docTypeEngine.getAllDocTypes();

		// Generate OpenAPI specification
		const options = {
			...DEFAULT_OPENAPI_OPTIONS,
			baseUrl,
			includeDeprecated,
			includeInternal
		};

		const specification = generateOpenAPIJSON(doctypes, options);

		// Set appropriate content type and return
		if (format === 'yaml') {
			return new Response(specification, {
				headers: {
					'Content-Type': 'application/x-yaml',
					'Cache-Control': 'public, max-age=300' // 5 minutes cache
				}
			});
		}

		return json(JSON.parse(specification), {
			headers: {
				'Cache-Control': 'public, max-age=300' // 5 minutes cache
			}
		});
	} catch (error) {
		console.error('Error generating OpenAPI specification:', error);

		return json(
			{
				error: true,
				message: 'Failed to generate OpenAPI specification',
				exc_type: error instanceof Error ? error.constructor.name : 'Unknown',
				error_code: 'GENERATION_ERROR'
			},
			{ status: 500 }
		);
	}
};

/**
 * HEAD /api/openapi - Check if OpenAPI specification is available
 */
export const HEAD: RequestHandler = async () => {
	return new Response(null, {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=300'
		}
	});
};

/**
 * OPTIONS /api/openapi - CORS preflight request
 */
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			'Access-Control-Max-Age': '86400' // 24 hours
		}
	});
};