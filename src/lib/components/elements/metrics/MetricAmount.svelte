<script>
	import Icon from '../icons/Icon.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {string} amount
	 * @property {string} label
	 * @property {string} icon
	 */

	/** @type {Props} */
	let { amount, label, icon } = $props();
</script>

<div class="inline-flex w-auto items-center gap-3 rounded-xl bg-grey-900 px-3 py-2">
	<Icon name={icon} class="size-[50px] text-primary-600" />
	<div class="flex flex-col">
		<span class="text-sm font-medium">{label}</span>
		<span class="text-lg font-bold">{amount}</span>
	</div>
</div>
