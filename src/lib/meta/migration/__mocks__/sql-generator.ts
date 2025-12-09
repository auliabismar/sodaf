import { vi } from 'vitest';

export const SQLGenerator = vi.fn(function () {
    return {
        generateMigrationSQL: vi.fn()
    };
});
