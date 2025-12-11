<script lang="ts">
	import DataField from '$lib/desk/form/fields/DataField.svelte';
	import IntField from '$lib/desk/form/fields/IntField.svelte';
	import FloatField from '$lib/desk/form/fields/FloatField.svelte';
	import CheckField from '$lib/desk/form/fields/CheckField.svelte';
	import SelectField from '$lib/desk/form/fields/SelectField.svelte';
	import DateField from '$lib/desk/form/fields/DateField.svelte';
	import TextField from '$lib/desk/form/fields/TextField.svelte';
	import PasswordField from '$lib/desk/form/fields/PasswordField.svelte';
	import CurrencyField from '$lib/desk/form/fields/CurrencyField.svelte';
	import PercentField from '$lib/desk/form/fields/PercentField.svelte';
	import ColorField from '$lib/desk/form/fields/ColorField.svelte';
	import FieldRenderer from '$lib/desk/form/fields/FieldRenderer.svelte';
	import type { DocField } from '$lib/meta/doctype/types';

	// Test data for each field type
	let dataValue = $state('Hello World');
	let intValue = $state<number | null>(42);
	let floatValue = $state<number | null>(3.14);
	let checkValue = $state(true);
	let selectValue = $state('Open');
	let dateValue = $state<string | null>('2024-01-15');
	let textValue = $state('This is a multi-line\ntext area content.');
	let passwordValue = $state('secret123');
	let currencyValue = $state<number | null>(1250.5);
	let percentValue = $state<number | null>(75);
	let colorValue = $state('#3498db');

	// Helper to create mock DocField
	function createField(overrides: Partial<DocField>): DocField {
		return {
			fieldname: 'test_field',
			fieldtype: 'Data',
			label: 'Test Field',
			options: '',
			required: false,
			description: '',
			...overrides
		} as DocField;
	}

	// Field configurations
	const fields = {
		data: createField({
			fieldname: 'name',
			label: 'Name (Data)',
			fieldtype: 'Data',
			description: 'Enter your full name'
		}),
		dataRequired: createField({
			fieldname: 'email',
			label: 'Email (Required)',
			fieldtype: 'Data',
			required: true
		}),
		int: createField({ fieldname: 'quantity', label: 'Quantity (Int)', fieldtype: 'Int' }),
		float: createField({ fieldname: 'rate', label: 'Rate (Float)', fieldtype: 'Float' }),
		check: createField({ fieldname: 'active', label: 'Active (Check)', fieldtype: 'Check' }),
		select: createField({
			fieldname: 'status',
			label: 'Status (Select)',
			fieldtype: 'Select',
			options: 'Open\nClosed\nPending\nCancelled'
		}),
		date: createField({ fieldname: 'due_date', label: 'Due Date (Date)', fieldtype: 'Date' }),
		text: createField({ fieldname: 'description', label: 'Description (Text)', fieldtype: 'Long Text' }),
		password: createField({ fieldname: 'password', label: 'Password', fieldtype: 'Password' }),
		currency: createField({ fieldname: 'amount', label: 'Amount (Currency)', fieldtype: 'Currency' }),
		percent: createField({ fieldname: 'progress', label: 'Progress (Percent)', fieldtype: 'Percent' }),
		color: createField({ fieldname: 'theme_color', label: 'Theme Color', fieldtype: 'Color' })
	};

	// Log changes for debugging
	function logChange(fieldName: string, value: any) {
		console.log(`[P3-007] ${fieldName} changed:`, value);
	}
</script>

<svelte:head>
	<title>P3-007 Form Field Components Test</title>
</svelte:head>

<div class="test-page">
	<header>
		<h1>P3-007: Form Field Components</h1>
		<p>Manual testing page for all form field types</p>
	</header>

	<main>
		<section class="field-section">
			<h2>Text Input Fields</h2>

			<div class="field-row">
				<div class="field-container">
					<h3>P3-007-T1: DataField</h3>
					<DataField
						field={fields.data}
						value={dataValue}
						onchange={(v) => {
							dataValue = v;
							logChange('DataField', v);
						}}
					/>
					<div class="field-value">Value: "{dataValue}"</div>
				</div>

				<div class="field-container">
					<h3>P3-007-T28: Required Field</h3>
					<DataField field={fields.dataRequired} value="" required={true} error="This field is required" />
				</div>

				<div class="field-container">
					<h3>P3-007-T29: Read-only Field</h3>
					<DataField field={fields.data} value="Read-only value" readonly={true} />
				</div>
			</div>
		</section>

		<section class="field-section">
			<h2>Numeric Fields</h2>

			<div class="field-row">
				<div class="field-container">
					<h3>P3-007-T2: IntField</h3>
					<IntField
						field={fields.int}
						value={intValue}
						onchange={(v) => {
							intValue = v;
							logChange('IntField', v);
						}}
					/>
					<div class="field-value">Value: {intValue}</div>
				</div>

				<div class="field-container">
					<h3>P3-007-T3: FloatField</h3>
					<FloatField
						field={fields.float}
						value={floatValue}
						onchange={(v) => {
							floatValue = v;
							logChange('FloatField', v);
						}}
					/>
					<div class="field-value">Value: {floatValue}</div>
				</div>

				<div class="field-container">
					<h3>P3-007-T4: CurrencyField</h3>
					<CurrencyField
						field={fields.currency}
						value={currencyValue}
						onchange={(v) => {
							currencyValue = v;
							logChange('CurrencyField', v);
						}}
					/>
					<div class="field-value">Value: ${currencyValue}</div>
				</div>

				<div class="field-container">
					<h3>P3-007-T5: PercentField</h3>
					<PercentField
						field={fields.percent}
						value={percentValue}
						onchange={(v) => {
							percentValue = v;
							logChange('PercentField', v);
						}}
					/>
					<div class="field-value">Value: {percentValue}%</div>
				</div>
			</div>
		</section>

		<section class="field-section">
			<h2>Selection Fields</h2>

			<div class="field-row">
				<div class="field-container">
					<h3>P3-007-T6: CheckField</h3>
					<CheckField
						field={fields.check}
						value={checkValue}
						onchange={(v) => {
							checkValue = v;
							logChange('CheckField', v);
						}}
					/>
					<div class="field-value">Value: {checkValue}</div>
				</div>

				<div class="field-container">
					<h3>P3-007-T7: SelectField</h3>
					<SelectField
						field={fields.select}
						value={selectValue}
						onchange={(v) => {
							selectValue = v;
							logChange('SelectField', v);
						}}
					/>
					<div class="field-value">Value: "{selectValue}"</div>
				</div>

				<div class="field-container">
					<h3>P3-007-T24: ColorField</h3>
					<ColorField
						field={fields.color}
						value={colorValue}
						onchange={(v) => {
							colorValue = v;
							logChange('ColorField', v);
						}}
					/>
					<div class="field-value">Value: {colorValue}</div>
				</div>
			</div>
		</section>

		<section class="field-section">
			<h2>Date/Time Fields</h2>

			<div class="field-row">
				<div class="field-container">
					<h3>P3-007-T12: DateField</h3>
					<DateField
						field={fields.date}
						value={dateValue}
						onchange={(v) => {
							dateValue = v;
							logChange('DateField', v);
						}}
					/>
					<div class="field-value">Value: {dateValue}</div>
				</div>
			</div>
		</section>

		<section class="field-section">
			<h2>Multi-line & Special Fields</h2>

			<div class="field-row">
				<div class="field-container" style="flex: 2;">
					<h3>P3-007-T16: TextField</h3>
					<TextField
						field={fields.text}
						value={textValue}
						onchange={(v) => {
							textValue = v;
							logChange('TextField', v);
						}}
					/>
					<div class="field-value">Value: "{textValue}"</div>
				</div>

				<div class="field-container">
					<h3>P3-007-T23: PasswordField</h3>
					<PasswordField
						field={fields.password}
						value={passwordValue}
						onchange={(v) => {
							passwordValue = v;
							logChange('PasswordField', v);
						}}
					/>
					<div class="field-value">Value: (hidden)</div>
				</div>
			</div>
		</section>

		<section class="field-section">
			<h2>P3-007-T32: FieldRenderer (Dynamic)</h2>
			<p class="section-description">The FieldRenderer picks the correct component based on fieldtype</p>

			<div class="field-row">
				<div class="field-container">
					<h4>Renders DataField</h4>
					<FieldRenderer
						field={createField({ fieldname: 'dynamic_data', label: 'Dynamic Data', fieldtype: 'Data' })}
						value="Rendered via FieldRenderer"
					/>
				</div>

				<div class="field-container">
					<h4>Renders IntField</h4>
					<FieldRenderer
						field={createField({ fieldname: 'dynamic_int', label: 'Dynamic Int', fieldtype: 'Int' })}
						value={100}
					/>
				</div>

				<div class="field-container">
					<h4>Renders CheckField</h4>
					<FieldRenderer
						field={createField({ fieldname: 'dynamic_check', label: 'Dynamic Check', fieldtype: 'Check' })}
						value={true}
					/>
				</div>
			</div>
		</section>
	</main>

	<footer>
		<p>Open browser console to see value change events</p>
	</footer>
</div>

<style>
	.test-page {
		font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		background: #f4f4f4;
		min-height: 100vh;
	}

	header {
		text-align: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #0f62fe;
	}

	header h1 {
		color: #161616;
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	header p {
		color: #525252;
	}

	.field-section {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
	}

	.field-section h2 {
		color: #161616;
		font-size: 1.25rem;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e0e0e0;
	}

	.section-description {
		color: #525252;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.field-row {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.field-container {
		flex: 1;
		min-width: 250px;
		padding: 1rem;
		background: #f4f4f4;
		border-radius: 4px;
	}

	.field-container h3 {
		font-size: 0.875rem;
		color: #0f62fe;
		margin-bottom: 0.75rem;
	}

	.field-container h4 {
		font-size: 0.75rem;
		color: #525252;
		margin-bottom: 0.5rem;
	}

	.field-value {
		margin-top: 0.5rem;
		font-size: 0.75rem;
		color: #6f6f6f;
		font-family: 'IBM Plex Mono', monospace;
		background: #e0e0e0;
		padding: 0.25rem 0.5rem;
		border-radius: 2px;
		word-break: break-all;
	}

	footer {
		text-align: center;
		padding-top: 1rem;
		color: #525252;
		font-size: 0.875rem;
	}

	/* Carbon Component Overrides for visibility on light grey background */
	.field-container :global(.cds--label) {
		color: #161616 !important;
	}

	.field-container :global(.cds--text-input),
	.field-container :global(.cds--number input),
	.field-container :global(.cds--text-area),
	.field-container :global(.cds--dropdown),
	.field-container :global(.cds--select-input) {
		background-color: #ffffff !important;
		color: #161616 !important;
	}

	.field-container :global(.cds--text-input[readonly]),
	.field-container :global(.cds--number input[readonly]) {
		background-color: #f4f4f4 !important;
		color: #525252 !important;
		border-bottom: 1px solid #8d8d8d !important;
	}

	.field-container :global(.cds--form__helper-text) {
		color: #525252 !important;
	}

	.field-container :global(.cds--checkbox-label-text),
	.field-container :global(.cds--radio-button__label-text) {
		color: #161616 !important;
	}
</style>
