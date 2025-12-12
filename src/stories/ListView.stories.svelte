<script context="module" lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ListView from '$lib/desk/list/ListView.svelte';

	// Mock fetch logic
	if (typeof window !== 'undefined') {
		const originalFetch = window.fetch;
		const allMockData = Array(50)
			.fill(0)
			.map((_, i) => ({
				name: `todo-${i}`,
				description: `Storybook Test Task ${i}`,
				status: i % 3 === 0 ? 'Closed' : 'Open',
				priority: i % 2 === 0 ? 'High' : 'Low',
				due_date: '2025-12-31'
			}));

		window.fetch = async (url, options) => {
			const urlStr = url.toString();
			if (urlStr.includes('/api/resource/ToDo')) {
				await new Promise((r) => setTimeout(r, 300));
				const urlObj = new URL(urlStr, window.location.origin);
				const page = parseInt(urlObj.searchParams.get('page') || '1');
				const limit = parseInt(urlObj.searchParams.get('limit') || '20');
				const filtersParam = urlObj.searchParams.get('filters');
				let filteredData = [...allMockData];

				if (filtersParam) {
					try {
						const filters = JSON.parse(filtersParam);
						for (const [field, value] of Object.entries(filters)) {
							if (value && value !== '') {
								if (field === '_search' && Array.isArray(value) && value[0] === 'like') {
									const searchTerm = value[1].replace(/%/g, '').toLowerCase();
									filteredData = filteredData.filter((item) =>
										String(item.description || '')
											.toLowerCase()
											.includes(searchTerm)
									);
								} else if (Array.isArray(value) && value[0] === 'like') {
									const searchTerm = value[1].replace(/%/g, '').toLowerCase();
									filteredData = filteredData.filter((item) =>
										String((item as any)[field] || '')
											.toLowerCase()
											.includes(searchTerm)
									);
								} else {
									filteredData = filteredData.filter((item) => (item as any)[field] === value);
								}
							}
						}
					} catch (e) {
						console.error(e);
					}
				}

				const startIndex = (page - 1) * limit;
				const paginatedData = filteredData.slice(startIndex, startIndex + limit);

				return new Response(
					JSON.stringify({
						data: paginatedData,
						meta: { total: filteredData.length }
					}),
					{ status: 200, headers: { 'Content-Type': 'application/json' } }
				);
			}
			return originalFetch(url, options);
		};
	}

	const { Story } = defineMeta({
		title: 'Desk/ListView',
		component: ListView,
		tags: ['autodocs']
	});
</script>

<Story
	name="Default"
	args={{
		doctype: 'ToDo',
		config: {
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
			page_length: 20
		}
	}}
/>
