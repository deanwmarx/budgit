<script>
	import Icon from '../icons/Icon.svelte';
	import { formatRelativeDate } from '$lib/utils/helpers.js';

	/**
	 * @typedef {Object} InputTextProps
	 * @property {string} [name="date"]
	 * @property {string} [placeholder]
	 * @property {string | number | null | undefined} [value=""]
	 * @property {boolean} [invalid=false]
	 * @property {boolean} [disabled=false]
	 * @property {boolean} [required=false]
	 * @property {string} [class]
	 * @property {string} [id]
	 */

	/** @type {InputTextProps & { [key: string]: any }} */
	let {
		name = 'date',
		placeholder = undefined,
		value = $bindable(undefined),
		invalid = false,
		disabled = false,
		required = false,
		...rest
	} = $props();

	let display_value = $derived.by(() => {
		if (!value || typeof value !== 'string') return '';
		return formatRelativeDate(value);
	});
</script>

<div
	class="
        relative w-full rounded-lg px-3 py-1.5 placeholder-grey-300 ring ring-grey-400 outline-0
        transition-all duration-300 focus-within:ring-2 focus-within:ring-primary-700 focus-within:outline-0
        {disabled ? 'pointer-events-none cursor-not-allowed opacity-60' : ''}
        {invalid ? 'ring-danger-600! focus-within:ring-danger-600!' : ''}
        {rest.class}
    "
>
	{#if value}
		<span class="pointer-events-none">
			{display_value}
		</span>
	{:else}
		<span class="pointer-events-none text-grey-300">
			{placeholder}
		</span>
	{/if}
	<input
		type="date"
		{name}
		bind:value
		{placeholder}
		{disabled}
		{required}
		id={rest.id}
		class="absolute top-0 left-0 h-full w-full appearance-none opacity-0"
	/>
	<Icon
		name="calendar"
		class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 {!value
			? 'text-grey-300'
			: ''}"
	/>
</div>
