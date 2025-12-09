<script lang="ts">
  import { Pagination } from "carbon-components-svelte";
  import type { ListController } from "./list-controller";
  import type { ListViewState } from "./types";

  export let controller: ListController;

  let state: ListViewState;

  // Subscribe to controller state
  $: controller.subscribe((value) => {
    state = value;
  });

  // Handle page change
  function handleUpdate(e: CustomEvent) {
    const { page, pageSize } = e.detail;
    if (pageSize !== state.pagination.page_size) {
        controller.setPageSize(pageSize);
    } else {
        controller.goToPage(page);
    }
  }
</script>

{#if state}
  <Pagination
    totalItems={state.pagination.total}
    page={state.pagination.page}
    pageSize={state.pagination.page_size}
    pageSizes={[20, 50, 100]}
    on:update={handleUpdate}
  />
{/if}
