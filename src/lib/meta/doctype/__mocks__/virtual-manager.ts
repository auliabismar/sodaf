
import { vi } from 'vitest';

export const mockMethods = {
    getVirtualDocType: vi.fn(),
    getController: vi.fn(),
    queryVirtualDocType: vi.fn(),
    refreshVirtualDocType: vi.fn(),
    getAllVirtualDocTypes: vi.fn(),
    getVirtualDocTypesBySourceType: vi.fn(),
    getVirtualDocTypesByStatus: vi.fn(),
    testConnection: vi.fn(),
    getAllPerformanceMetrics: vi.fn(),
    getAllCacheStats: vi.fn()
};

export class VirtualDocTypeManager {
    static getInstance = vi.fn(() => mockMethods);
    // Helper to access mocks from tests if needed, though they can import mockMethods directly if exported?
    // Vitest __mocks__ usually replace the module content.
    // So importing the module in test gets THIS file.
    // So we can export mockMethods here and import it in test.
}
