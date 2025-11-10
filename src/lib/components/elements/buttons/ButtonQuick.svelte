<script>
	import Icon from '../icons/Icon.svelte';
	import { color_classes } from './button-styles.js';

	/**
	 * @typedef {Object} ButtonIconProps
	 * @property {boolean} [disabled]
	 * @property {string} [title]
	 * @property {string} [href]
	 * @property {'small' | 'medium' | 'large'} [size]
	 * @property {'primary' | 'secondary' | 'tertiary' | 'danger'} [color]
	 * @property {boolean} [active]
	 */

	/** @type {ButtonIconProps & { [key: string]: any }} */
	let {
		disabled = $bindable(false),
		title = '',
		size = 'large',
		color = 'secondary',
		active = $bindable(false),
		...rest
	} = $props();
</script>

<button
	type="button"
	{...rest}
	{disabled}
	{title}
	class={[
		'relative h-9 rounded-t-full px-9 py-4 transition-colors duration-300 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',
		color_classes[color],
		rest.class || ''
	]}
>
	<Icon
		name="plus"
		class="absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2 transform transition-all duration-300 {active
			? 'rotate-135'
			: ''}"
	/>
</button>
