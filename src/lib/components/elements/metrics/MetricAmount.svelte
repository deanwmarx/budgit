<script>
	import Icon from '../icons/Icon.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {string} amount
	 * @property {string} label
	 * @property {string} icon
	 * @property {string} [class]
	 */

	/** @type {Props} */
	let { amount, label, icon, ...rest } = $props();
</script>

<div class="flex flex-col gap-1 rounded-xl bg-grey-900 p-2 {rest.class ?? ''}">
	<div class="flex items-center gap-4">
		<Icon name={icon} class="size-8 text-primary-600" />
		<span class="block w-full flex-1 align-middle text-sm font-medium">{label}</span>
	</div>
	<span class="block w-full text-center leading-5 font-bold break-all">{amount}</span>
</div>
