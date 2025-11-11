<script>
	/**
	 * @typedef {Object} Props
	 * @property {any} [children] - The content to be displayed inside the badge.
	 * @property {string} [class] - Additional CSS classes to apply to the badge.
	 */

	/** @type {Props} */
	let { children, ...rest } = $props();
</script>

<div
	class="inline-flex w-auto items-center gap-1.5 rounded-full bg-grey-900 px-3 py-1.5 text-sm font-medium {rest.class}"
>
	{@render children()}
</div>
