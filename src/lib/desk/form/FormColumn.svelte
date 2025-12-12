<script lang="ts">
	import type { DocField } from '../../meta/doctype/types';
	import type { FormController } from './form-controller';
	import FieldRenderer from './fields/FieldRenderer.svelte';

	type Props = {
		fields: DocField[];
		controller: FormController;
	};

	let { fields, controller }: Props = $props();
</script>

<div class="form-column">
	{#each fields as field (field.fieldname)}
		<div class="field-wrapper" data-fieldname={field.fieldname}>
			<FieldRenderer {field} {controller} />
		</div>
	{/each}
</div>

<style>
	.form-column {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
		min-width: 0;
	}

	.field-wrapper {
		width: 100%;
	}
</style>
