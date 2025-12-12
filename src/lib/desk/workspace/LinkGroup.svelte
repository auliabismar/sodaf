<script lang="ts">
	/**
	 * LinkGroup Component
	 * P3-017: Groups workspace links by category (Masters, Transactions, Reports)
	 */
	import type { WorkspaceLink } from './types';

	type Props = {
		groupName: string;
		links: WorkspaceLink[];
	};

	let { groupName, links }: Props = $props();

	function handleLinkClick(link: WorkspaceLink) {
		if (link.type === 'DocType') {
			window.location.href = `/desk/${link.link_to}`;
		} else if (link.type === 'Report') {
			window.location.href = `/desk/Report/${link.link_to}`;
		} else if (link.type === 'Page') {
			window.location.href = `/desk/Page/${link.link_to}`;
		} else {
			window.location.href = `/desk/${link.link_to}`;
		}
	}

	function handleKeyDown(e: KeyboardEvent, link: WorkspaceLink) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleLinkClick(link);
		}
	}

	// Icon based on type
	function getLinkIcon(link: WorkspaceLink): string {
		switch (link.type) {
			case 'Report':
				return '📊';
			case 'Page':
				return '📄';
			default:
				return '📋';
		}
	}
</script>

<div class="link-group" data-testid="link-group-{groupName}">
	<h3 class="link-group-header">{groupName}</h3>
	<ul class="link-list" role="list">
		{#each links as link (link.link_to)}
			<li>
				<button
					class="link-item"
					onclick={() => handleLinkClick(link)}
					onkeydown={(e) => handleKeyDown(e, link)}
					data-testid="link-item-{link.link_to}"
				>
					<span class="link-icon" aria-hidden="true">{getLinkIcon(link)}</span>
					<span class="link-label">{link.label}</span>
				</button>
			</li>
		{/each}
	</ul>
</div>

<style>
	.link-group {
		margin-bottom: 1.5rem;
	}

	.link-group-header {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted, #6b7280);
		padding: 0.5rem 0;
		margin: 0 0 0.5rem 0;
		border-bottom: 1px solid var(--border-subtle, #e5e7eb);
	}

	.link-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.link-list li {
		margin: 0;
		padding: 0;
	}

	.link-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0;
		border: none;
		background: transparent;
		color: var(--text-secondary, #4b5563);
		font-size: 0.875rem;
		text-align: left;
		cursor: pointer;
		border-radius: 0.25rem;
		transition: color 0.15s ease;
	}

	.link-item:hover {
		color: var(--text-primary, #111827);
	}

	.link-item:hover .link-label {
		text-decoration: underline;
	}

	.link-item:focus-visible {
		outline: 2px solid var(--focus-ring, #3b82f6);
		outline-offset: 2px;
	}

	.link-icon {
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	.link-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
