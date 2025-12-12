<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FieldRenderer from '$lib/desk/form/fields/FieldRenderer.svelte';

	const { Story } = defineMeta({
		title: 'Desk/Form Fields',
		component: FieldRenderer,
		tags: ['autodocs']
	});
</script>

<Story
	name="DataField"
	args={{
		field: { fieldname: 'test_data', label: 'Test Data', fieldtype: 'Data' },
		value: 'Hello',
		hideLabel: false
	}}
/>

<Story
	name="IntField"
	args={{
		field: { fieldname: 'test_int', label: 'Test Int', fieldtype: 'Int' },
		value: 42,
		hideLabel: false
	}}
/>

<Story
	name="FloatField"
	args={{
		field: { fieldname: 'test_float', label: 'Test Float', fieldtype: 'Float' },
		value: 3.14,
		hideLabel: false
	}}
/>

<Story
	name="CurrencyField"
	args={{
		field: { fieldname: 'test_currency', label: 'Test Currency', fieldtype: 'Currency' },
		value: 1234.56,
		hideLabel: false
	}}
/>

<Story
	name="PercentField"
	args={{
		field: { fieldname: 'test_percent', label: 'Test Percent', fieldtype: 'Percent' },
		value: 75,
		hideLabel: false
	}}
/>

<Story
	name="CheckField"
	args={{
		field: { fieldname: 'test_check', label: 'Test Check', fieldtype: 'Check' },
		value: true,
		hideLabel: false
	}}
/>

<Story
	name="SelectField"
	args={{
		field: {
			fieldname: 'test_select',
			label: 'Test Select',
			fieldtype: 'Select',
			options: 'Option 1\nOption 2\nOption 3'
		},
		value: 'Option 1',
		hideLabel: false
	}}
/>

<Story
	name="DateField"
	args={{
		field: { fieldname: 'test_date', label: 'Test Date', fieldtype: 'Date' },
		value: '2024-01-01',
		hideLabel: false
	}}
/>

<Story
	name="TextField (Long Text)"
	args={{
		field: { fieldname: 'test_text', label: 'Test Text', fieldtype: 'Long Text' },
		value: 'This is a long text area',
		hideLabel: false
	}}
/>

<Story
	name="PasswordField"
	args={{
		field: { fieldname: 'test_password', label: 'Test Password', fieldtype: 'Password' },
		value: 'secret',
		hideLabel: false
	}}
/>

<Story
	name="ColorField"
	args={{
		field: { fieldname: 'test_color', label: 'Test Color', fieldtype: 'Color' },
		value: '#ff0000',
		hideLabel: false
	}}
/>
