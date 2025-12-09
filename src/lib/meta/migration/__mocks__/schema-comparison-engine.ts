import { vi } from 'vitest';

export const SchemaComparisonEngine = vi.fn(function () {
    return {
        compareSchema: vi.fn()
    };
});
