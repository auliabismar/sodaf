import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Simple from './Simple.svelte';

describe('Simple Component', () => {
    it('renders hello world', async () => {
        render(Simple, { name: 'Vitest' }); // Props are passed directly in recent versions or via props object depending on lib version. 
        // @testing-library/svelte v5: render(Component, { props: ... }) or just options.
        // Let's check signature. usually render(Component, { props: { ... } })

        await expect.element(screen.getByText('Hello Vitest')).toBeVisible();
    });
});

