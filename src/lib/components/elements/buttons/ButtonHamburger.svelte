<script>
	import Icon from '../icons/Icon.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {() => void} onclick - Click handler
	 */

	/** @type {Props} */
	const { onclick = () => {} } = $props();
</script>

<button
	type="button"
	{onclick}
	class="flex aspect-square flex-nowrap items-center justify-center p-2"
>
	<Icon name="hamburger" class="size-6" />
</button>
