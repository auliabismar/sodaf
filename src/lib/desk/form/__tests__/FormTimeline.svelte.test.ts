/**
 * P3-008: FormTimeline Component Tests
 * - P3-008-T12: Timeline shows activity
 * - P3-008-T13: Add comment
 */

import { render } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FormTimeline from '../FormTimeline.svelte';
import type { FormTimelineEntry } from '../types';

describe('P3-008: FormTimeline Component', () => {
    const mockTimeline: FormTimelineEntry[] = [
        {
            type: 'comment',
            timestamp: '2024-01-15T10:30:00',
            user: 'admin@example.com',
            content: 'This is a test comment'
        },
        {
            type: 'version',
            timestamp: '2024-01-14T09:00:00',
            user: 'user@example.com',
            content: 'Changed status from Draft to Open',
            data: { field: 'status' }
        }
    ];

    beforeEach(() => { vi.clearAllMocks(); });

    describe('P3-008-T12: Timeline shows activity', () => {
        it('displays Activity heading', async () => {
            render(FormTimeline, { timeline: mockTimeline });
            await expect.element(page.getByText('Activity')).toBeVisible();
        });

        it('displays timeline items', async () => {
            render(FormTimeline, { timeline: mockTimeline });
            await expect.element(page.getByText('This is a test comment')).toBeVisible();
        });

        it('displays user information', async () => {
            render(FormTimeline, { timeline: mockTimeline });
            await expect.element(page.getByText('admin@example.com')).toBeVisible();
        });

        it('shows "commented" for comment type', async () => {
            render(FormTimeline, { timeline: mockTimeline });
            await expect.element(page.getByText('commented')).toBeVisible();
        });

        it('shows empty state when no timeline', async () => {
            render(FormTimeline, { timeline: [] });
            await expect.element(page.getByText('No activity yet.')).toBeVisible();
        });

        it('shows empty state when timeline is undefined', async () => {
            render(FormTimeline, {});
            await expect.element(page.getByText('No activity yet.')).toBeVisible();
        });
    });

    describe('P3-008-T13: Add comment', () => {
        it('displays comment input box', async () => {
            render(FormTimeline, { timeline: [] });
            await expect.element(page.getByPlaceholder('Leave a comment...')).toBeVisible();
        });

        it('displays Comment button', async () => {
            render(FormTimeline, { timeline: [] });
            await expect.element(page.getByText('Comment')).toBeVisible();
        });

        it('Comment button is disabled when input is empty', async () => {
            render(FormTimeline, { timeline: [] });
            const commentBtn = page.getByRole('button', { name: 'Comment' });
            await expect.element(commentBtn).toBeDisabled();
        });

        it('Comment button becomes enabled when text is entered', async () => {
            render(FormTimeline, { timeline: [] });
            const textarea = page.getByPlaceholder('Leave a comment...');
            await textarea.fill('New comment');

            const commentBtn = page.getByRole('button', { name: 'Comment' });
            await expect.element(commentBtn).not.toBeDisabled();
        });

        it('displays avatar placeholder', async () => {
            render(FormTimeline, { timeline: [] });
            await expect.element(page.getByText('ME')).toBeVisible();
        });
    });
});
