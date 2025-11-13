<script>
	/**
	 * @typedef {Object} Props
	 * @property {number} [value]
	 * @property {'default' | 'safe' | 'warning' | 'danger'} [variant]
	 */

	/** @type {Props} */
	let { value = $bindable(50), variant = 'default' } = $props();

	const variant_classes = {
		default: 'slider-default',
		safe: 'slider-safe',
		warning: 'slider-warning',
		danger: 'slider-danger'
	};

	let display_value = $state(`${value}%`);

	$effect(() => {
		display_value = `${value}%`;
	});

	function handleInput(event) {
		const input = event.target.value.replace('%', '');
		const num = parseInt(input);
		if (!isNaN(num) && num >= 0 && num <= 100) {
			value = num;
		}
		display_value = `${value}%`;
	}
</script>

<div class="flex h-4 items-center gap-1 overflow-hidden rounded-l-full">
	<input
		type="range"
		min="0"
		max="100"
		bind:value
		class="w-full cursor-pointer appearance-none rounded-2xl outline-none {variant_classes[
			variant
		]}"
	/>
	<input
		type="text"
		value={display_value}
		oninput={handleInput}
		class="w-[38px] rounded-xs border border-grey-600 bg-grey-900 text-center text-xs leading-none outline-none focus:border-2 focus:border-primary-700"
	/>
</div>

<style>
	/* Default variant (primary) */
	:global(.slider-default::-webkit-slider-runnable-track) {
		height: 8px;
		background: var(--color-primary-50);
		border-radius: 16px;
	}

	:global(.slider-default::-moz-range-track) {
		height: 8px;
		background: var(--color-primary-50);
		border-radius: 16px;
	}

	:global(.slider-default::-webkit-slider-thumb) {
		-webkit-appearance: none;
		appearance: none;
		height: 16px;
		width: 16px;
		background-color: var(--color-white);
		border-radius: 50%;
		border: 2px solid var(--color-primary-600);
		box-shadow: -407px 0 0 400px var(--color-primary-600);
		margin-top: -4px;
	}

	:global(.slider-default::-moz-range-thumb) {
		height: 16px;
		width: 16px;
		background-color: var(--color-white);
		border-radius: 50%;
		border: 1px solid var(--color-primary-600);
		box-shadow: -407px 0 0 400px var(--color-primary-600);
	}

	/* Safe variant (success) */
	:global(.slider-safe::-webkit-slider-runnable-track) {
		height: 8px;
		background: var(--color-success-50);
		border-radius: 16px;
	}

	:global(.slider-safe::-moz-range-track) {
		height: 8px;
		background: var(--color-success-50);
		border-radius: 16px;
	}

	:global(.slider-safe::-webkit-slider-thumb) {
		-webkit-appearance: none;
		appearance: none;
		height: 16px;
		width: 16px;
		background-color: var(--color-white);
		border-radius: 50%;
		border: 2px solid var(--color-success-500);
		box-shadow: -407px 0 0 400px var(--color-success-500);
		margin-top: -4px;
	}

	:global(.slider-safe::-moz-range-thumb) {
		height: 16px;
		width: 16px;
		background-color: var(--color-white);
		border-radius: 50%;
		border: 1px solid var(--color-success-500);
		box-shadow: -407px 0 0 400px var(--color-success-500);
	}

	/* Warning variant */
	:global(.slider-warning::-webkit-slider-runnable-track) {
		height: 8px;
		background: var(--color-warning-50);
		border-radius: 16px;
	}

	:global(.slider-warning::-moz-range-track) {
		height: 8px;
		background: var(--color-warning-50);
		border-radius: 16px;
	}

	:global(.slider-warning::-webkit-slider-thumb) {
		-webkit-appearance: none;
		appearance: none;
		height: 16px;
		width: 16px;
		background-color: var(--color-white);
		border-radius: 50%;
		border: 2px solid var(--color-warning-500);
		box-shadow: -407px 0 0 400px var(--color-warning-500);
		margin-top: -4px;
	}

	:global(.slider-warning::-moz-range-thumb) {
		height: 16px;
		width: 16px;
		background-color: var(--color-white);
		border-radius: 50%;
		border: 1px solid var(--color-warning-500);
		box-shadow: -407px 0 0 400px var(--color-warning-500);
	}

	/* Danger variant */
	:global(.slider-danger::-webkit-slider-runnable-track) {
		height: 8px;
		background: var(--color-danger-50);
		border-radius: 16px;
	}

	:global(.slider-danger::-moz-range-track) {
		height: 8px;
		background: var(--color-danger-50);
		border-radius: 16px;
	}

	:global(.slider-danger::-webkit-slider-thumb) {
		-webkit-appearance: none;
		appearance: none;
		height: 16px;
		width: 16px;
		background-color: var(--color-white);
		border-radius: 50%;
		border: 2px solid var(--color-danger-500);
		box-shadow: -407px 0 0 400px var(--color-danger-500);
		margin-top: -4px;
	}

	:global(.slider-danger::-moz-range-thumb) {
		height: 16px;
		width: 16px;
		background-color: var(--color-white);
		border-radius: 50%;
		border: 1px solid var(--color-danger-500);
		box-shadow: -407px 0 0 400px var(--color-danger-500);
	}
</style>
