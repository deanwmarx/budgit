<script>
	import Icon from '../icons/Icon.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {Array<{value: string | number, label: string, icon?: string}>} [options]
	 * @property {string} [name]
	 * @property {string | number} [value]
	 * @property {string | number | null} [default_value]
	 */

	/** @type {Props} */
	let { options = [], name = 'options', value = $bindable(), default_value = null } = $props();

	// Initialize value if not set
	if (value === undefined && default_value !== null) {
		value = default_value;
	} else if (value === undefined && options.length > 0) {
		value = options[0].value;
	}

	/** @param {string | number} option_value */
	function handleChange(option_value) {
		value = option_value;
	}
</script>

<div class="flex flex-nowrap gap-px overflow-hidden rounded-lg">
	{#each options as option}
		{@const checked = value === option.value}
		<label
			class="relative flex w-full items-center gap-1.5 p-3 py-2 transition-all duration-300 {checked
				? 'bg-primary-700 shadow-sm active:bg-primary-600'
				: 'bg-grey-800 active:bg-grey-700'}"
		>
			<input
				type="radio"
				class="absolute inset-0 h-full w-full appearance-none opacity-0"
				{name}
				value={option.value}
				{checked}
				onchange={() => handleChange(option.value)}
			/>
			{#if option.icon}
				<Icon name={option.icon} class="size-4" />
			{/if}
			<span class="text-sm transition-all duration-300 {checked ? 'font-medium' : ''}">
				{option.label}
			</span>
		</label>
	{/each}
</div>
