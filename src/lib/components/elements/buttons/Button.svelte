<script>
	import { size_classes, color_classes } from './button-styles.js';

	/**
	 * @typedef {Object} ButtonIconProps
	 * @property {boolean} [disabled]
	 * @property {string} [title]
	 * @property {string} [href]
	 * @property {'small' | 'medium' | 'large'} [size]
	 * @property {'primary' | 'secondary' | 'tertiary' | 'danger'} [color]
	 * @property {string} [tooltip_text]
	 * @property {'top' | 'right' | 'bottom' | 'left'} [tooltip_position]
	 */

	/** @type {ButtonIconProps & { [key: string]: any }} */
	let {
		disabled = $bindable(false),
		title = '',
		size = 'medium',
		color = 'primary',
		children,
		...rest
	} = $props();
</script>

<button
	type="button"
	{...rest}
	{disabled}
	{title}
	class={[
		'flex flex-nowrap items-center justify-center gap-2 rounded-full transition-colors duration-300 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',
		size_classes[size],
		color_classes[color],
		rest.class || ''
	]}
>
	{@render children()}
</button>
