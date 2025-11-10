<script>
	import { slide } from 'svelte/transition';

	/**
	 * @typedef {Object} Props
	 * @property {string} text
	 * @property {boolean} [disabled=false]
	 * @property {boolean} [invalid=false]
	 * @property {string} [class]
	 */

	/** @type {Props & { [key: string]: any }} */
	let { text, disabled = $bindable(false), invalid = $bindable(false), ...rest } = $props();
</script>

{#if text}
	<div
		transition:slide={{ duration: 200 }}
		{...rest}
		class="{invalid
			? 'text-danger-600'
			: disabled
				? 'opacity-60'
				: ''} text-right text-sm {rest.class}"
	>
		{text}
	</div>
{/if}
