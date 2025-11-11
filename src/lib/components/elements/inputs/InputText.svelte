<script>
	import { onMount } from 'svelte';

	/**
	 * @typedef {Object} InputTextProps
	 * @property {'text' | 'number' | 'email' | 'search' | 'password' | 'time' | 'tel'} [type='text']
	 * @property {string} [name="text"]
	 * @property {string | number | null | undefined} [value=""]
	 * @property {boolean} [invalid=false]
	 * @property {boolean} [disabled=false]
	 * @property {boolean} [clearable=false]
	 * @property {string} [placeholder]
	 * @property {boolean} [autofocus=false]
	 */

	/** @type {InputTextProps & { [key: string]: any }} */
	let {
		type = 'text',
		name = 'text',
		placeholder = 'Placeholder text',
		value = $bindable(undefined),
		invalid = false,
		disabled = false,
		input = $bindable(),
		focus_on_load = false,
		autofocus,
		...rest
	} = $props();

	onMount(() => {
		if (focus_on_load) {
			input.focus();
		}
	});

	/**
	 * @param {HTMLInputElement} node
	 */
	function init(node) {
		if (!autofocus) return;

		node.focus();
	}
</script>

<input
	{type}
	use:init
	{name}
	bind:value
	bind:this={input}
	{placeholder}
	{disabled}
	{...rest}
	class="
			w-full rounded-lg px-3 py-1.5 placeholder-grey-300 ring ring-grey-400 outline-0
			transition-all duration-300 focus:ring-2 focus:ring-primary-700 focus:outline-0
			{disabled ? 'cursor-not-allowed opacity-60' : ''}
			{invalid ? 'pointer-events-none ring-danger-600! focus:ring-danger-600!' : ''}
			{rest.class}
		"
/>
