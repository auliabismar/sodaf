import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import GeolocationField from '../GeolocationField.svelte';
import { renderWithProps, createMockEvent, createMockKeyboardEvent } from './fixtures/testUtils';
import { mockFields } from './fixtures/mockFields';

describe('GeolocationField', () => {
	let mockGeolocation: {
		getCurrentPosition: ReturnType<typeof vi.fn>
	};
	let mockFetch: ReturnType<typeof vi.fn> & ((input: string | URL | Request, init?: RequestInit) => Promise<Response>);

	beforeEach(() => {
		vi.clearAllMocks();
		
		// Mock geolocation API
		mockGeolocation = {
			getCurrentPosition: vi.fn()
		};
		global.navigator = { 
			...global.navigator, 
			geolocation: mockGeolocation 
		} as any;

		// Mock fetch API
		mockFetch = vi.fn() as ReturnType<typeof vi.fn> & ((input: string | URL | Request, init?: RequestInit) => Promise<Response>);
		global.fetch = mockFetch;
	});

	describe('P3-007-T27: Geolocation Field Basic Functionality', () => {
		it('should render geolocation field with label', async () => {
			const { getByText } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: ''
			});

			expect(getByText(mockFields.geolocation.label)).toBeInTheDocument();
		});

		it('should render map container with correct dimensions', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				width: 400,
				height: 300
			});

			const mapContainer = container.querySelector('.map-container');
			expect(mapContainer).toHaveStyle('width: 400px');
			expect(mapContainer).toHaveStyle('height: 300px');
		});

		it('should display error message when error is provided', async () => {
			const { getByText } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				error: 'Location is required'
			});

			expect(getByText('Location is required')).toBeInTheDocument();
		});

		it('should show coordinates display when enabled', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '40.7128,-74.0060',
				props: {
					showCoordinates: true
				}
			});

			const coordinatesDisplay = container.querySelector('.coordinates-display');
			expect(coordinatesDisplay).toBeInTheDocument();
		});

		it('should not show coordinates display when disabled', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '40.7128,-74.0060',
				props: {
					showCoordinates: false
				}
			});

			const coordinatesDisplay = container.querySelector('.coordinates-display');
			expect(coordinatesDisplay).not.toBeInTheDocument();
		});
	});

	describe('P3-007-T27: GPS Location Capture', () => {
		it('should show GPS button when enabled', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				props: {
					enableGeolocation: true
				}
			});

			const gpsButton = container.querySelector('[icon-description="Get current location"]');
			expect(gpsButton).toBeInTheDocument();
		});

		it('should not show GPS button when disabled', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				props: {
					enableGeolocation: false
				}
			});

			const gpsButton = container.querySelector('[icon-description="Get current location"]');
			expect(gpsButton).not.toBeInTheDocument();
		});

		it('should request current location when GPS button is clicked', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				props: {
					enableGeolocation: true
				}
			});

			const gpsButton = container.querySelector('[icon-description="Get current location"]');
			await fireEvent.click(gpsButton!);

			expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
				expect.objectContaining({
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 300000
				})
			);
		});

		it('should handle successful GPS location', async () => {
			const mockPosition = {
				coords: {
					latitude: 40.7128,
					longitude: -74.0060,
					accuracy: 10,
					altitude: 50
				},
				timestamp: Date.now()
			};

			mockGeolocation.getCurrentPosition.mockImplementation((success) => {
				setTimeout(() => success(mockPosition as any), 0);
			});

			const mockChange = vi.fn();
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				props: {
					enableGeolocation: true
				},
				onchange: mockChange
			});

			const gpsButton = container.querySelector('[icon-description="Get current location"]');
			await fireEvent.click(gpsButton!);

			await waitFor(() => {
				expect(mockChange).toHaveBeenCalledWith(
					expect.objectContaining({ detail: '40.7128,-74.006' })
				);
			});
		});

		it('should handle GPS location error', async () => {
			mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
				setTimeout(() => error({ code: 1 } as any), 0);
			});

			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				props: {
					enableGeolocation: true
				}
			});

			const gpsButton = container.querySelector('[icon-description="Get current location"]');
			await fireEvent.click(gpsButton!);

			await waitFor(() => {
				const errorElement = container.querySelector('.location-error');
				expect(errorElement?.textContent).toContain('Location access denied');
			});
		});

		it('should show loading state while getting location', async () => {
			mockGeolocation.getCurrentPosition.mockImplementation(() => {
				// Don't call success/error to simulate loading
			});

			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				props: {
					enableGeolocation: true
				}
			});

			const gpsButton = container.querySelector('[icon-description="Get current location"]');
			await fireEvent.click(gpsButton!);

			expect(gpsButton?.textContent).toBe('Getting Location...');
		});
	});

	describe('P3-007-T27: Address Lookup', () => {
		it('should show address search when enabled', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				props: {
					showAddressLookup: true
				}
			});

			const addressSearch = container.querySelector('.address-search');
			expect(addressSearch).toBeInTheDocument();
		});

		it('should not show address search when disabled', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				props: {
					showAddressLookup: false
				}
			});

			const addressSearch = container.querySelector('.address-search');
			expect(addressSearch).not.toBeInTheDocument();
		});

		it('should search for address when search button is clicked', async () => {
			const mockResponse = [
				{
					lat: '40.7128',
					lon: '-74.0060',
					display_name: 'New York, NY, USA'
				}
			];

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => mockResponse
			} as Response);

			const mockChange = vi.fn();
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				props: {
					showAddressLookup: true
				},
				onchange: mockChange
			});

			const addressInput = container.querySelector('input[placeholder="Search for an address..."]') as HTMLInputElement;
			addressInput.value = 'New York';

			const searchButton = container.querySelector('[icon-description="Search address"]');
			await fireEvent.click(searchButton!);

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledWith(
					'https://nominatim.openstreetmap.org/search?format=json&q=New%20York&limit=1'
				);
				expect(mockChange).toHaveBeenCalledWith(
					expect.objectContaining({ detail: '40.7128,-74.006' })
				);
			});
		});

		it('should handle address search error', async () => {
			mockFetch.mockResolvedValue({
				ok: false
			} as Response);

			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				props: {
					showAddressLookup: true
				}
			});

			const addressInput = container.querySelector('input[placeholder="Search for an address..."]') as HTMLInputElement;
			addressInput.value = 'Invalid Address';

			const searchButton = container.querySelector('[icon-description="Search address"]');
			await fireEvent.click(searchButton!);

			await waitFor(() => {
				const errorElement = container.querySelector('.location-error');
				expect(errorElement?.textContent).toContain('Failed to lookup address');
			});
		});

		it('should handle address not found', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => []
			} as Response);

			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				props: {
					showAddressLookup: true
				}
			});

			const addressInput = container.querySelector('input[placeholder="Search for an address..."]') as HTMLInputElement;
			addressInput.value = 'Nonexistent Place';

			const searchButton = container.querySelector('[icon-description="Search address"]');
			await fireEvent.click(searchButton!);

			await waitFor(() => {
				const errorElement = container.querySelector('.location-error');
				expect(errorElement?.textContent).toContain('Address not found');
			});
		});
	});

	describe('P3-007-T27: Map Integration', () => {
		it('should display map when coordinates are provided', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '40.7128,-74.0060'
			});

			const mapContainer = container.querySelector('.map-container');
			expect(mapContainer?.innerHTML).toContain('img');
		});

		it('should show placeholder when no coordinates', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: ''
			});

			const mapContainer = container.querySelector('.map-container');
			expect(mapContainer?.innerHTML).toContain('No location selected');
		});

		it('should update map when coordinates change', async () => {
			const { container, rerender } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '40.7128,-74.0060'
			});

			// Change coordinates
			await rerender({
				field: mockFields.geolocation,
				value: '51.5074,-0.1278'
			});

			const mapContainer = container.querySelector('.map-container');
			// Map should be updated (simplified check)
			expect(mapContainer?.innerHTML).toContain('img');
		});
	});

	describe('P3-007-T27: Location Information Display', () => {
		it('should show coordinates in correct format', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '40.7128,-74.0060',
				props: {
					showCoordinates: true
				}
			});

			const coordText = container.querySelector('.coord-text');
			expect(coordText?.textContent).toBe('40.712800, -74.006000');
		});

		it('should show location icon when coordinates exist', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '40.7128,-74.0060',
				props: {
					showCoordinates: true
				}
			});

			const coordIcon = container.querySelector('.coord-icon');
			expect(coordIcon).toBeInTheDocument();
		});

		it('should show placeholder when no coordinates', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				props: {
					showCoordinates: true
				}
			});

			const coordPlaceholder = container.querySelector('.coord-placeholder');
			expect(coordPlaceholder?.textContent).toBe('No location selected');
		});

		it('should show location info when GPS position is available', async () => {
			const mockPosition = {
				coords: {
					latitude: 40.7128,
					longitude: -74.0060,
					accuracy: 10,
					altitude: 50
				},
				timestamp: Date.now()
			};

			mockGeolocation.getCurrentPosition.mockImplementation((success) => {
				setTimeout(() => success(mockPosition as any), 0);
			});

			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				props: {
					enableGeolocation: true
				}
			});

			const gpsButton = container.querySelector('[icon-description="Get current location"]');
			await fireEvent.click(gpsButton!);

			await waitFor(() => {
				const accuracyInfo = container.querySelector('.info-value');
				expect(accuracyInfo?.textContent).toContain('±10m');
			});
		});
	});

	describe('P3-007-T27: Accessibility', () => {
		it('should have proper ARIA labels', async () => {
			const { getByLabelText } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '40.7128,-74.0060'
			});

			expect(getByLabelText('Geolocation Field')).toBeInTheDocument();
		});

		it('should support keyboard navigation', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '40.7128,-74.0060',
				props: {
					enableGeolocation: true
				}
			});

			const gpsButton = container.querySelector('[icon-description="Get current location"]') as HTMLElement;
			gpsButton?.focus();

			await fireEvent.keyDown(gpsButton!, { key: 'Enter' });

			expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
		});
	});

	describe('P3-007-T27: Disabled and Readonly States', () => {
		it('should disable GPS button when disabled', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				props: {
					enableGeolocation: true
				},
				disabled: true
			});

			const gpsButton = container.querySelector('[icon-description="Get current location"]');
			expect(gpsButton).toBeDisabled();
		});

		it('should disable address search when disabled', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				props: {
					showAddressLookup: true
				},
				disabled: true
			});

			const addressInput = container.querySelector('input[placeholder="Search for an address..."]') as HTMLInputElement;
			const searchButton = container.querySelector('[icon-description="Search address"]');

			expect(addressInput.disabled).toBe(true);
			expect(searchButton).toBeDisabled();
		});

		it('should disable map interaction when disabled', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '40.7128,-74.0060',
				disabled: true
			});

			const mapContainer = container.querySelector('.map-container');
			expect(mapContainer).toHaveStyle('cursor: not-allowed');
		});
	});

	describe('P3-007-T27: Event Handling', () => {
		it('should dispatch change event on GPS location', async () => {
			const mockChange = vi.fn();
			const mockPosition = {
				coords: { latitude: 40.7128, longitude: -74.0060 },
				timestamp: Date.now()
			};

			mockGeolocation.getCurrentPosition.mockImplementation((success) => {
				setTimeout(() => success(mockPosition as any), 0);
			});

			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				props: {
					enableGeolocation: true
				},
				onchange: mockChange
			});

			const gpsButton = container.querySelector('[icon-description="Get current location"]');
			await fireEvent.click(gpsButton!);

			await waitFor(() => {
				expect(mockChange).toHaveBeenCalledTimes(1);
				expect(mockChange).toHaveBeenCalledWith(
					expect.objectContaining({ detail: '40.7128,-74.006' })
				);
			});
		});

		it('should dispatch change event on address search', async () => {
			const mockChange = vi.fn();
			const mockResponse = [
				{ lat: '40.7128', lon: '-74.0060' }
			];

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => mockResponse
			} as Response);

			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '',
				props: {
					showAddressLookup: true
				},
				onchange: mockChange
			});

			const addressInput = container.querySelector('input[placeholder="Search for an address..."]') as HTMLInputElement;
			addressInput.value = 'New York';

			const searchButton = container.querySelector('[icon-description="Search address"]');
			await fireEvent.click(searchButton!);

			await waitFor(() => {
				expect(mockChange).toHaveBeenCalledTimes(1);
				expect(mockChange).toHaveBeenCalledWith(
					expect.objectContaining({ detail: '40.7128,-74.006' })
				);
			});
		});

		it('should dispatch blur event', async () => {
			const mockBlur = vi.fn();
			const { getByLabelText } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '40.7128,-74.0060',
				onblur: mockBlur
			});

			const mapContainer = getByLabelText('Geolocation Field');
			await fireEvent.blur(mapContainer);

			expect(mockBlur).toHaveBeenCalledTimes(1);
		});

		it('should dispatch focus event', async () => {
			const mockFocus = vi.fn();
			const { getByLabelText } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '40.7128,-74.0060',
				onfocus: mockFocus
			});

			const mapContainer = getByLabelText('Geolocation Field');
			await fireEvent.focus(mapContainer);

			expect(mockFocus).toHaveBeenCalledTimes(1);
		});
	});

	describe('P3-007-T27: Edge Cases', () => {
		it('should handle empty coordinates', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: ''
			});

			const mapContainer = container.querySelector('.map-container');
			expect(mapContainer?.innerHTML).toContain('No location selected');
		});

		it('should handle invalid coordinates', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: 'invalid-coordinates'
			});

			const coordText = container.querySelector('.coord-text');
			expect(coordText).not.toBeInTheDocument();
		});

		it('should handle coordinates with extra whitespace', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: ' 40.7128, -74.0060 '
			});

			const coordText = container.querySelector('.coord-text');
			expect(coordText?.textContent).toBe('40.712800, -74.006000');
		});

		it('should handle very precise coordinates', async () => {
			const { container } = await renderWithProps(GeolocationField, {
				field: mockFields.geolocation,
				value: '40.7128123456789,-74.0060123456789'
			});

			const coordText = container.querySelector('.coord-text');
			expect(coordText?.textContent).toBe('40.712812, -74.006012');
		});
	});
});