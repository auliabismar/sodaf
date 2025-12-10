<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, TextInput } from 'carbon-components-svelte';
	import { Location, LocationFilled, Search, ErrorFilled } from 'carbon-icons-svelte';
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
		width?: number;
		height?: number;
		defaultZoom?: number;
		showCoordinates?: boolean;
		showAddressLookup?: boolean;
		enableGeolocation?: boolean;
		onchange?: (value: string) => void;
		onblur?: () => void;
		onfocus?: () => void;
	}

	let {
		field,
		value = $bindable(''),
		error = '',
		disabled = false,
		readonly = false,
		required = false,
		description = '',
		hideLabel = false,
		width = 400,
		height = 300,
		defaultZoom = 13,
		showCoordinates = true,
		showAddressLookup = true,
		enableGeolocation = true,
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	// Internal state
	let mapContainer = $state<HTMLDivElement>();
	let isLocating = $state(false);
	let locationError = $state<string | null>(null);
	let currentPosition = $state<GeolocationPosition | null>(null);
	let mapMarker = $state<{ lat: number; lng: number } | null>(null);
	let addressInput = $state('');
	let isSearchingAddress = $state(false);

	// Computed properties
	let inputId = $derived(`input-${field.fieldname}`);
	let isInvalid = $derived(!!error || !!locationError);
	let isDisabled = $derived(disabled || readonly || field.read_only);
	let hasValue = $derived(value && value.length > 0);
	let coordinates = $derived(parseCoordinates(value));
	let displayCoordinates = $derived(
		coordinates ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}` : ''
	);

	// Event handlers
	function handleChange(newValue: string) {
		value = newValue;
		onchange?.(newValue);
	}

	function handleBlur() {
		onblur?.();
	}

	function handleFocus() {
		onfocus?.();
	}

	// Geolocation functions
	async function getCurrentLocation() {
		if (!enableGeolocation || isDisabled || isLocating) return;

		isLocating = true;
		locationError = null;

		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 300000 // 5 minutes
				});
			});

			currentPosition = position;
			mapMarker = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};

			const locationString = `${position.coords.latitude},${position.coords.longitude}`;
			handleChange(locationString);

			// Update map
			updateSimpleMap();
		} catch (error) {
			locationError = getGeolocationError(error);
		} finally {
			isLocating = false;
		}
	}

	function getGeolocationError(error: any): string {
		switch (error.code) {
			case error.PERMISSION_DENIED:
				return 'Location access denied. Please enable location permissions.';
			case error.POSITION_UNAVAILABLE:
				return 'Location information is unavailable.';
			case error.TIMEOUT:
				return 'Location request timed out.';
			default:
				return 'An unknown error occurred while getting location.';
		}
	}

	// Address lookup functions
	async function searchAddress() {
		if (!addressInput.trim() || isDisabled || isSearchingAddress) return;

		isSearchingAddress = true;
		locationError = null;

		try {
			// Using Nominatim OpenStreetMap geocoding service
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressInput)}&limit=1`
			);

			if (!response.ok) {
				throw new Error('Address lookup failed');
			}

			const data = await response.json();

			if (data && data.length > 0) {
				const result = data[0];
				const lat = parseFloat(result.lat);
				const lng = parseFloat(result.lon);

				mapMarker = { lat, lng };
				handleChange(`${lat},${lng}`);

				// Update map
				updateSimpleMap();
			} else {
				locationError = 'Address not found. Please try a different search term.';
			}
		} catch (error) {
			locationError = 'Failed to lookup address. Please try again.';
		} finally {
			isSearchingAddress = false;
		}
	}

	async function reverseGeocode(lat: number, lng: number) {
		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
			);

			if (!response.ok) {
				throw new Error('Reverse geocoding failed');
			}

			const data = await response.json();

			if (data && data.display_name) {
				addressInput = data.display_name;
			}
		} catch (error) {
			// Silently fail for reverse geocoding
			console.warn('Reverse geocoding failed:', error);
		}
	}

	// Map functions
	function updateSimpleMap() {
		if (!mapContainer || !mapMarker) return;

		// Clear existing content
		mapContainer.innerHTML = '';

		// Create simple map representation
		const mapElement = createSimpleMapElement(mapMarker.lat, mapMarker.lng);
		mapContainer.appendChild(mapElement);

		// Try to get address for the coordinates
		reverseGeocode(mapMarker.lat, mapMarker.lng);
	}

	function createSimpleMapElement(lat: number, lng: number): HTMLElement {
		const mapWrapper = document.createElement('div');
		mapWrapper.className = 'simple-map';
		mapWrapper.style.cssText = `
			width: 100%;
			height: 100%;
			background: #f0f0f0;
			border: 1px solid #ccc;
			border-radius: 4px;
			position: relative;
			overflow: hidden;
		`;

		// Create a simple static map using OpenStreetMap tiles
		const zoom = defaultZoom;
		const tileSize = 256;
		const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom) * tileSize);
		const y = Math.floor(
			((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
				Math.pow(2, zoom) *
				tileSize
		);

		const mapImage = document.createElement('img');
		mapImage.src = `https://tile.openstreetmap.org/${zoom}/${Math.floor(x / tileSize)}/${Math.floor(y / tileSize)}.png`;
		mapImage.style.cssText = `
			width: 100%;
			height: 100%;
			object-fit: cover;
		`;
		mapImage.alt = 'Map';

		// Add marker
		const marker = document.createElement('div');
		marker.style.cssText = `
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 24px;
			height: 24px;
			background: #ff4444;
			border: 2px solid white;
			border-radius: 50% 50% 50% 0;
			transform: translate(-50%, -100%) rotate(-45deg);
			box-shadow: 0 2px 4px rgba(0,0,0,0.3);
		`;

		mapWrapper.appendChild(mapImage);
		mapWrapper.appendChild(marker);

		return mapWrapper;
	}

	function handleMapClick(event: MouseEvent) {
		if (isDisabled || !mapContainer) return;

		const rect = mapContainer.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		// Convert pixel coordinates to lat/lng (simplified)
		// This is a basic approximation - for production use, use a proper mapping library
		// const lat = 0; // This would need proper calculation
		// const lng = 0; // This would need proper calculation

		// For now, just show a placeholder
		locationError =
			'Map click detected. For precise location selection, please use the GPS button or address search.';
	}

	// Utility functions
	function parseCoordinates(value: string | undefined): { lat: number; lng: number } | null {
		if (!value || typeof value !== 'string') return null;

		const parts = value.split(',');
		if (parts.length !== 2) return null;

		const lat = parseFloat(parts[0].trim());
		const lng = parseFloat(parts[1].trim());

		if (isNaN(lat) || isNaN(lng)) return null;

		return { lat, lng };
	}

	// Lifecycle
	onMount(() => {
		// Initialize map if we have coordinates
		if (coordinates) {
			mapMarker = coordinates;
			updateSimpleMap();
			reverseGeocode(coordinates.lat, coordinates.lng);
		} else {
			// Show empty map
			if (mapContainer) {
				mapContainer.innerHTML = `
					<div style="
						width: 100%;
						height: 100%;
						background: #f0f0f0;
						border: 1px solid #ccc;
						border-radius: 4px;
						display: flex;
						align-items: center;
						justify-content: center;
						color: #666;
						font-size: 14px;
					">
						<div style="text-align: center;">
							<div style="margin-bottom: 8px;">📍</div>
							<div>No location selected</div>
							<div style="font-size: 12px; margin-top: 4px;">Use GPS or search for an address</div>
						</div>
					</div>
				`;
			}
		}
	});

	// Update map when coordinates change
	$effect(() => {
		if (coordinates && mapContainer) {
			mapMarker = coordinates;
			updateSimpleMap();
		}
	});
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
	onchange={(event: CustomEvent | any) => handleChange(event.detail || event)}
	onblur={handleBlur}
	onfocus={handleFocus}
>
	<div class="geolocation-field-container">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="map-container"
			bind:this={mapContainer}
			style="width: {width}px; height: {height}px;"
			onclick={handleMapClick}
		></div>

		<div class="geolocation-controls">
			{#if enableGeolocation}
				<Button
					kind="primary"
					size="small"
					disabled={isDisabled || isLocating}
					icon={isLocating ? LocationFilled : Location}
					iconDescription={isLocating ? 'Getting location...' : 'Get current location'}
					onclick={getCurrentLocation}
				>
					{isLocating ? 'Getting Location...' : 'Use Current Location'}
				</Button>
			{/if}

			{#if showAddressLookup}
				<div class="address-search">
					<TextInput
						placeholder="Search for an address..."
						value={addressInput}
						disabled={isDisabled || isSearchingAddress}
						oninput={(e: any) => (addressInput = e.target.value)}
					/>
					<Button
						kind="secondary"
						size="small"
						disabled={isDisabled || isSearchingAddress || !addressInput.trim()}
						icon={Search}
						iconDescription="Search address"
						onclick={searchAddress}
					>
						Search
					</Button>
				</div>
			{/if}
		</div>

		{#if showCoordinates}
			<div class="coordinates-display">
				<div class="coordinates-label">Coordinates:</div>
				<div class="coordinates-value">
					{#if coordinates}
						<span class="coord-text">{displayCoordinates}</span>
						<LocationFilled class="coord-icon" size={16} />
					{:else}
						<span class="coord-placeholder">No location selected</span>
					{/if}
				</div>
			</div>
		{/if}

		{#if locationError}
			<div class="location-error">
				<ErrorFilled class="error-icon" size={16} />
				<span class="error-text">{locationError}</span>
			</div>
		{/if}

		{#if currentPosition}
			<div class="location-info">
				<div class="info-item">
					<span class="info-label">Accuracy:</span>
					<span class="info-value">±{Math.round(currentPosition.coords.accuracy)}m</span>
				</div>
				{#if currentPosition.coords.altitude}
					<div class="info-item">
						<span class="info-label">Altitude:</span>
						<span class="info-value">{Math.round(currentPosition.coords.altitude)}m</span>
					</div>
				{/if}
				<div class="info-item">
					<span class="info-label">Last updated:</span>
					<span class="info-value">{new Date(currentPosition.timestamp).toLocaleTimeString()}</span>
				</div>
			</div>
		{/if}
	</div>
</BaseField>

<style>
	.geolocation-field-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	.map-container {
		border: 1px solid var(--cds-ui-03);
		border-radius: 0.25rem;
		overflow: hidden;
		background-color: var(--cds-layer-01);
		cursor: crosshair;
	}

	.map-container:focus {
		outline: 2px solid var(--cds-focus);
		outline-offset: 2px;
	}

	.geolocation-controls {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.address-search {
		display: flex;
		gap: 0.5rem;
		align-items: stretch;
	}

	.address-search :global(.cds--text-input) {
		flex: 1;
	}

	.coordinates-display {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.75rem;
		background-color: var(--cds-layer-02);
		border-radius: 0.25rem;
		border: 1px solid var(--cds-ui-03);
	}

	.coordinates-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--cds-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.coordinates-value {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.coord-text {
		font-family: monospace;
		font-size: 0.875rem;
		color: var(--cds-text-primary);
		font-weight: 500;
	}

	/* .coord-icon {
		color: var(--cds-support-success);
		flex-shrink: 0;
	} */

	.coord-placeholder {
		color: var(--cds-text-disabled);
		font-style: italic;
	}

	.location-error {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: var(--cds-layer-01);
		border: 1px solid var(--cds-support-error);
		border-radius: 0.25rem;
		color: var(--cds-support-error);
	}

	/* .error-icon {
		flex-shrink: 0;
	} */

	.error-text {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.location-info {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		padding: 0.75rem;
		background-color: var(--cds-layer-02);
		border-radius: 0.25rem;
		border: 1px solid var(--cds-ui-03);
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 120px;
	}

	.info-label {
		font-size: 0.75rem;
		color: var(--cds-text-secondary);
		font-weight: 500;
	}

	.info-value {
		font-size: 0.875rem;
		color: var(--cds-text-primary);
		font-weight: 600;
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.map-container {
			border: 2px solid WindowText;
		}

		.coordinates-display,
		.location-info {
			border: 2px solid WindowText;
		}

		.location-error {
			border: 2px solid Highlight;
			color: Highlight;
		}
	}

	/* Mobile responsiveness */
	@media (max-width: 672px) {
		.geolocation-controls {
			gap: 0.5rem;
		}

		.address-search {
			flex-direction: column;
		}

		.location-info {
			flex-direction: column;
			gap: 0.75rem;
		}

		.info-item {
			min-width: auto;
		}
	}
</style>
