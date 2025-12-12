<script lang="ts">
	import type { FormTimelineEntry } from './types';

	type Props = {
		timeline?: FormTimelineEntry[];
	};

	let { timeline = [] }: Props = $props();

	let newComment = $state('');

	function handleAddComment() {
		if (!newComment.trim()) return;
		// In real impl, this would call an API or Controller method
		console.log('Adding comment:', newComment);
		newComment = '';
	}
</script>

<div class="form-timeline">
	<div class="timeline-header">
		<h3 class="heading">Activity</h3>
	</div>

	<div class="comment-box">
		<div class="avatar-placeholder">ME</div>
		<div class="input-wrapper">
			<textarea placeholder="Leave a comment..." bind:value={newComment} rows="3"></textarea>
			<div class="actions">
				<button class="btn-comment" disabled={!newComment.trim()} onclick={handleAddComment}>
					Comment
				</button>
			</div>
		</div>
	</div>

	<div class="timeline-items">
		{#each timeline as entry}
			<div class="timeline-item" class:is-comment={entry.type === 'comment'}>
				<div class="timeline-left">
					{#if entry.type === 'comment'}
						<div class="avatar">{entry.user.charAt(0).toUpperCase()}</div>
					{:else}
						<div class="dot"></div>
					{/if}
				</div>
				<div class="timeline-content">
					<div class="header">
						<span class="user">{entry.user}</span>
						<span class="action">
							{#if entry.type === 'comment'}
								commented
							{:else if entry.type === 'version'}
								changed value of {entry.data?.field}
							{:else}
								{entry.type}
							{/if}
						</span>
						<span class="time">{new Date(entry.timestamp).toLocaleString()}</span>
					</div>
					<div class="body">
						{entry.content}
					</div>
				</div>
			</div>
		{/each}

		{#if timeline.length === 0}
			<div class="empty-state">No activity yet.</div>
		{/if}
	</div>
</div>

<style>
	.form-timeline {
		margin-top: 2rem;
	}

	.heading {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: var(--text-color, #1e293b);
	}

	.comment-box {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.avatar-placeholder,
	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background-color: var(--bg-surface-alt, #f1f5f9);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted, #64748b);
		flex-shrink: 0;
	}

	.input-wrapper {
		flex: 1;
		border: 1px solid var(--border-color, #e2e8f0);
		border-radius: 0.5rem;
		background-color: var(--bg-surface, #ffffff);
		padding: 0.5rem;
	}

	textarea {
		width: 100%;
		border: none;
		resize: vertical;
		outline: none;
		font-family: inherit;
		font-size: 0.9rem;
		min-height: 60px;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 0.5rem;
	}

	.btn-comment {
		background-color: var(--primary-color, #3b82f6);
		color: white;
		border: none;
		padding: 0.375rem 0.75rem;
		border-radius: 0.25rem;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
	}

	.btn-comment:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.timeline-items {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		position: relative;
	}

	.timeline-items::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: 15px; /* Half of dot/avatar approx */
		width: 1px;
		background-color: var(--border-color, #e2e8f0);
		z-index: 0;
	}

	.timeline-item {
		display: flex;
		gap: 1rem;
		position: relative;
		z-index: 1;
	}

	.timeline-left {
		width: 32px;
		display: flex;
		justify-content: center;
		padding-top: 0.25rem;
		background-color: var(--bg-app, #f8fafc); /* Mask line */
		box-shadow: 0 0 0 4px var(--bg-app, #f8fafc); /* More masking */
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: var(--border-color, #cbd5e1);
		margin-top: 0.35rem;
	}

	.timeline-content {
		flex: 1;
	}

	.header {
		font-size: 0.85rem;
		margin-bottom: 0.25rem;
	}

	.user {
		font-weight: 600;
		color: var(--text-color, #1e293b);
	}

	.action {
		color: var(--text-muted, #64748b);
	}

	.time {
		color: var(--text-muted-light, #94a3b8);
		font-size: 0.75rem;
		margin-left: 0.5rem;
	}

	.body {
		font-size: 0.9rem;
		color: var(--text-color, #334155);
	}

	.empty-state {
		text-align: center;
		color: var(--text-muted, #94a3b8);
		padding: 2rem;
		font-style: italic;
	}
</style>
