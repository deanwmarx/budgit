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
	 * @property {string} [currency='R']
	 * @property {'prefix' | 'suffix'} [currency_position='prefix']
	 */

	/** @type {InputTextProps & { [key: string]: any }} */
	let {
		type = 'text',
		name = 'text',
		placeholder = 'Enter amount',
		value = $bindable(undefined),
		invalid = false,
		disabled = false,
		input = $bindable(),
		focus_on_load = false,
		autofocus,
		currency = 'R',
		currency_position = 'prefix',
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

	/**
	 * Focus the input when clicking anywhere on the div
	 */
	function handleClick() {
		if (!disabled && input) {
			input.focus();
		}
	}

	/**
	 * Handle keyboard events for accessibility
	 * @param {KeyboardEvent} event
	 */
	function handleKeyDown(event) {
		if ((event.key === 'Enter' || event.key === ' ') && !disabled && input) {
			event.preventDefault();
			input.focus();
		}
	}
</script>

<div
	class="
		flex h-full flex-row items-center gap-2 rounded-lg px-3 py-1.5 ring ring-grey-400 outline-0 transition-all
		duration-300 outline-none focus-within:ring-2 focus-within:ring-primary-700 focus-within:outline-0
		{disabled ? 'cursor-not-allowed opacity-60' : ''}
		{invalid ? 'ring-danger-600! focus-within:ring-danger-600!' : ''}
		{rest.class}
	"
	onclick={handleClick}
	onkeydown={handleKeyDown}
	role="none"
>
	{#if currency_position === 'prefix'}
		<span class="text-grey-300">{currency}</span>
	{/if}
	<input
		class="h-full w-full bg-transparent placeholder-grey-300 outline-0"
		type="number"
		min="0"
		step="0.01"
		use:init
		{name}
		bind:value
		bind:this={input}
		{placeholder}
		{disabled}
	/>
	{#if currency_position === 'suffix'}
		<span class="text-grey-300">{currency}</span>
	{/if}
</div>
