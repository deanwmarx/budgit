<script>
	import { button_round_size_classes, color_classes } from './button-styles.js';

	/**
	 * @typedef {Object} ButtonIconProps
	 * @property {'button' | 'submit'} [type]
	 * @property {boolean} [disabled]
	 * @property {string} [title]
	 * @property {string} [href]
	 * @property {'small' | 'medium' | 'large'} [size]
	 * @property {'primary' | 'secondary' | 'tertiary' | 'danger' | 'transparent'} [color]
	 * @property {string} [tooltip_text]
	 * @property {'top' | 'right' | 'bottom' | 'left'} [tooltip_position]
	 */

	/** @type {ButtonIconProps & { [key: string]: any }} */
	let {
		type = 'button',
		disabled = $bindable(false),
		title = '',
		size = 'large',
		color = 'primary',
		children,
		...rest
	} = $props();
</script>

<button
	{type}
	{...rest}
	{disabled}
	{title}
	class={[
		'flex aspect-square flex-nowrap items-center justify-center rounded-full transition-colors duration-300 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',
		button_round_size_classes[size],
		color_classes[color],
		rest.class || ''
	]}
>
	{@render children()}
</button>
