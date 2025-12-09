<script lang="ts">
	import { OverflowMenu, OverflowMenuItem } from 'carbon-components-svelte';
	import type { RowAction } from './types';

	export let row: any;
	export let actions: RowAction[] = [];

	$: availableActions = actions.filter((action) => !action.condition || action.condition(row));
</script>

{#if availableActions.length > 0}
	<OverflowMenu flipped size="sm">
		{#each availableActions as action, index}
			<OverflowMenuItem
				text={action.label}
				on:click={() => {
					console.log('OverflowMenuItem clicked:', action.label, row);
					if (action.action) {
						action.action(row);
					}
				}}
			/>
		{/each}
	</OverflowMenu>
{/if}
