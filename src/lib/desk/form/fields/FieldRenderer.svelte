<script lang="ts">
	import DataField from './DataField.svelte';
	import IntField from './IntField.svelte';
	import FloatField from './FloatField.svelte';
	import CurrencyField from './CurrencyField.svelte';
	import PercentField from './PercentField.svelte';
	import CheckField from './CheckField.svelte';
	import SelectField from './SelectField.svelte';
	import LinkField from './LinkField.svelte';
	import DynamicLinkField from './DynamicLinkField.svelte';
	import PasswordField from './PasswordField.svelte';
	import ColorField from './ColorField.svelte';
	import RatingField from './RatingField.svelte';
	import SignatureField from './SignatureField.svelte';
	import GeolocationField from './GeolocationField.svelte';
	import ReadOnlyField from './ReadOnlyField.svelte';
	import type { DocField, FieldType } from '../../../meta/doctype/types';

	interface Props {
		field: DocField;
		value?: any;
		error?: string | string[];
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		description?: string;
		hideLabel?: boolean;
		onchange?: (value: any) => void;
		onblur?: (event?: any) => void;
		onfocus?: (event?: any) => void;
		// Allow passing through other props potentially needed by specific fields
		[key: string]: any;
	}

	let {
		field,
		value = $bindable(undefined),
		error = '',
		disabled = false,
		readonly = false,
		required = false,
		description = '',
		hideLabel = false,
		onchange,
		onblur,
		onfocus,
		...restProps
	}: Props = $props();

	// Component mapping based on field type
	let component = $derived(getComponentForFieldType(field.fieldtype));

	function handleBlur() {
		onblur?.();
	}

	function handleFocus() {
		onfocus?.();
	}

	function handleChange(newValue: any) {
		value = newValue; // Update local bound value
		onchange?.(newValue);
	}

	function getComponentForFieldType(fieldType: FieldType) {
		switch (fieldType) {
			case 'Data':
				return DataField;
			case 'Int':
				return IntField;
			case 'Float':
				return FloatField;
			case 'Currency':
				return CurrencyField;
			case 'Percent':
				return PercentField;
			case 'Check':
				return CheckField;
			case 'Select':
				return SelectField;
			case 'Link':
				return LinkField;
			case 'Dynamic Link':
				return DynamicLinkField;
			case 'Password':
				return PasswordField;
			case 'Color':
				return ColorField;
			case 'Rating':
				return RatingField;
			case 'Signature':
				return SignatureField;
			case 'Geolocation':
				return GeolocationField;
			case 'Read Only':
				return ReadOnlyField;
			default:
				// Fallback to DataField for unknown types
				return DataField;
		}
	}

	// Props to pass to the rendered component
	// We construct this reactively. Note that `value` is passed and bound in the child component if we use `bind:value` or just passed if child handles it.
	// In Svelte 5 with dynamic components, we can pass props spread.
	// But binding `value` dynamically with spread props isn't directly supported like `bind:value={value}`.
	// However, the fields accept `value` as prop and emit `onchange`.
	// Our `handleChange` catches the update and updates `value` prop in `FieldRenderer`.
	// But if we want two-way binding to flow DOWN from `FieldRenderer` to Child, we just pass `value`.
	// Runes props are reactive. Passing `value` (which is a prop of FieldRenderer) to Child prop `value`.

	let componentProps = $derived({
		field,
		value,
		error,
		disabled,
		readonly,
		required,
		description,
		hideLabel, // Pass through hideLabel prop
		// Actually, `FieldRenderer` seems to be used *inside* a `FormGroup` or similar?
		// Or does `FieldRenderer` replace the whole field display including label?
		// The original code passed `hideLabel: true`.
		// But in individual fields (e.g. DataField), `hideLabel` prop is used in `<BaseField {hideLabel} ...>`.
		// If `hideLabel` is strictly true here, then all rendered fields will hide their label.
		// Presumably the label is rendered outside FieldRenderer?
		onchange: handleChange,
		onblur: handleBlur,
		onfocus: handleFocus,
		...restProps
	});
</script>

{#if component}
	{@const Component = component}
	<Component {...componentProps} />
{:else}
	<div class="field-renderer-error">
		Invalid field type: {field.fieldtype}
	</div>
{/if}

<style>
	.field-renderer-error {
		padding: 0.5rem;
		background-color: var(--cds-support-error);
		color: var(--cds-text-on-color);
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-weight: 500;
	}
</style>
