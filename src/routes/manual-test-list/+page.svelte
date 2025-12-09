<script lang="ts" context="module">
	// Mock fetch at module level so it's ready before component mounts
	if (typeof window !== 'undefined') {
		const originalFetch = window.fetch;

		// Generate all mock data once
		const allMockData = Array(50)
			.fill(0)
			.map((_, i) => ({
				name: `todo-${i}`,
				description: `Manual Test Task ${i}`,
				status: i % 3 === 0 ? 'Closed' : 'Open',
				priority: i % 2 === 0 ? 'High' : 'Low',
				due_date: '2025-12-31'
			}));

		window.fetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
			const urlStr = url.toString();
			if (urlStr.includes('/api/resource/ToDo')) {
				console.log('Mock fetch intercepted:', urlStr);
				await new Promise((r) => setTimeout(r, 300));

				// Parse URL params
				const urlObj = new URL(urlStr, window.location.origin);
				const page = parseInt(urlObj.searchParams.get('page') || '1');
				const limit = parseInt(urlObj.searchParams.get('limit') || '20');
				const filtersParam = urlObj.searchParams.get('filters');

				// Apply filters
				let filteredData = [...allMockData];

				// T21: Trigger error if status filter is "Error"
				if (filtersParam && filtersParam.includes('"status":"Error"')) {
					return new Response(JSON.stringify({ error: 'Simulated server error for testing T21' }), {
						status: 500,
						headers: { 'Content-Type': 'application/json' }
					});
				}

				if (filtersParam) {
					try {
						const filters = JSON.parse(filtersParam);
						for (const [field, value] of Object.entries(filters)) {
							if (value && value !== '') {
								// Handle _search filter - search in description field
								if (field === '_search' && Array.isArray(value) && value[0] === 'like') {
									const searchTerm = value[1].replace(/%/g, '').toLowerCase();
									filteredData = filteredData.filter((item: any) =>
										String(item.description || '')
											.toLowerCase()
											.includes(searchTerm)
									);
								}
								// Handle like filter format ["like", "%query%"]
								else if (Array.isArray(value) && value[0] === 'like') {
									const searchTerm = value[1].replace(/%/g, '').toLowerCase();
									filteredData = filteredData.filter((item: any) =>
										String(item[field] || '')
											.toLowerCase()
											.includes(searchTerm)
									);
								} else {
									// Exact match
									filteredData = filteredData.filter((item: any) => item[field] === value);
								}
							}
						}
					} catch (e) {
						console.error('Failed to parse filters:', e);
					}
				}

				// Apply pagination
				const startIndex = (page - 1) * limit;
				const endIndex = startIndex + limit;
				const paginatedData = filteredData.slice(startIndex, endIndex);

				console.log(
					`Page ${page}, Limit ${limit}, Total: ${filteredData.length}, Returning ${paginatedData.length} items`
				);

				return new Response(
					JSON.stringify({
						data: paginatedData,
						meta: { total: filteredData.length }
					}),
					{
						status: 200,
						headers: { 'Content-Type': 'application/json' }
					}
				);
			}
			return originalFetch(url, options);
		};
	}
</script>

<script lang="ts">
	import ListView from '$lib/desk/list/ListView.svelte';
	import type { ListViewConfig } from '$lib/desk/list/types';

	const config: ListViewConfig = {
		doctype: 'ToDo',
		columns: [
			{ fieldname: 'description', label: 'Description', width: '300px' },
			{ fieldname: 'status', label: 'Status', width: '150px' },
			{ fieldname: 'due_date', label: 'Due Date', width: '150px' },
			{ fieldname: 'priority', label: 'Priority', width: '100px' }
		],
		filters: [
			{ fieldname: 'status', label: 'Status', fieldtype: 'Select', options: ['Open', 'Closed', 'Overdue'] },
			{ fieldname: 'priority', label: 'Priority', fieldtype: 'Select', options: ['High', 'Medium', 'Low'] },
			{ fieldname: 'due_date', label: 'Due Date', fieldtype: 'Date' }
		],
		row_actions: [
			{ label: 'Edit', action: (row) => alert(`Edit ${row.name}`) },
			{ label: 'Complete', action: (row) => alert(`Complete ${row.name}`) }
		],
		bulk_actions: [
			{ label: 'Delete', action: (ids) => alert(`Delete ${ids.length} items`) },
			{ label: 'Mark as Closed', action: (ids) => alert(`Close ${ids.length} items`) }
		],
		page_length: 20
	};
</script>

<div style="padding: 2rem;">
	<h1>Manual List View Test</h1>
	<ListView doctype="ToDo" {config} />
</div>
