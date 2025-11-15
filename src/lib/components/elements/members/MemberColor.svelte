<script>
	import { getColorBgClass } from '$lib/utils/helpers';

	/**
	 * @typedef {Object} Props
	 * @property {string} color - Color name (e.g., 'red', 'blue')
	 * @property {string} class - Additional classes usually to set the size of the circle (e.g., 'size-4')
	 */

	/** @type {Props} */
	const { color = 'blue', ...rest } = $props();

	const bg_color_class = $derived(getColorBgClass(color));
</script>

<div
	class="rounded-full aspect-square shadow-sm transition-colors duration-300 {bg_color_class} {rest.class ?? ''}"
></div>
