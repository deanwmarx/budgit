<script>
	import InputSelect from '../inputs/InputSelect.svelte';
	import MemberColor from './MemberColor.svelte';

	/**
	 * @typedef {Object} Option
	 * @property {string} label
	 * @property {string} value
	 * @property {string} color
	 */

	/**
	 * @typedef {Object} Props
	 * @property {Option[]} options - Array of option objects
	 * @property {string} selected_option - Currently selected option value
	 * @property {string} [placeholder] - Placeholder text for the select input
	 * @property {string} [name] - Name attribute for the select input
	 * @property {string} [id] - ID attribute for the select input
	 * @property {boolean} [invalid] - Whether the input is in an invalid state
	 */

	/** @type {Props} */
	let {
		options,
		selected_option = $bindable(),
		placeholder = 'Choose a member',
		invalid = false,
		...rest
	} = $props();
</script>

{#snippet optionSnippet({ option })}
	<div class="flex items-center justify-between">
		<span>{option.label}</span>
		{#if option.color}
			<MemberColor color={option.color} class="size-4" />
		{/if}
	</div>
{/snippet}

<InputSelect
	{...rest}
	{invalid}
	{options}
	{optionSnippet}
	bind:value={selected_option}
	{placeholder}
	absolute={false}
/>
