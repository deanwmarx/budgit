<script>
	import Icon from '$comps/elements/icons/Icon.svelte';

	/**
	 * @typedef {Object} Thresholds
	 * @property {number} warning - Warning threshold percentage
	 * @property {number} danger - Danger threshold percentage
	 */

	/**
	 * @typedef {Object} Props
	 * @property {string} title - Budget title
	 * @property {number} used - Amount of budget used
	 * @property {number} total - Total budget amount
	 * @property {string} currency - Currency symbol (e.g., 'R')
	 * @property {'suffix' | 'prefix'} position - Position of the currency symbol
	 * @property {Thresholds} thresholds - Budget thresholds
	 * @property {any} [onclick] - Optional click handler
	 */

	/** @type {Props} */
	let {
		title = '',
		used = 0,
		total = 0,
		currency = 'R',
		position = 'prefix',
		thresholds = { warning: 75, danger: 90 },
		...rest
	} = $props();

	let usage_percentage = $derived.by(() => {
		if (total === 0) return 0;
		return (used / total) * 100;
	});
</script>

<button
	class="w-full appearance-none rounded-lg border border-grey-900 bg-grey-800 p-2.5 outline-0 transition-colors duration-300 active:border-grey-800 active:bg-grey-700"
	onclick={rest.onclick}
>
	<article class="flex flex-col gap-2">
		<div class="flex justify-between gap-2">
			<span class="line-clamp-1 text-lg leading-none">{title}</span>
			<div class="flex gap-2">
				<Icon name="scales" class="size-4.5" />
				<span class="inline-flex items-center gap-1 leading-none">
					<span
						class="text-xs font-medium {usage_percentage >= thresholds.danger
							? 'text-danger-500'
							: usage_percentage >= thresholds.warning
								? 'text-warning-500'
								: 'text-success-500'}"
					>
						{position === 'prefix' ? currency : ''}{used}{position === 'suffix' ? currency : ''}
					</span>
					<span class="text-lg leading-none font-medium">
						/
						{position === 'prefix' ? currency : ''}{total}{position === 'suffix' ? currency : ''}
					</span>
				</span>
			</div>
		</div>
		<!-- progress bar svg -->
		<svg
			class="h-2 w-full {usage_percentage >= thresholds.danger
				? 'bg-danger-50'
				: usage_percentage >= thresholds.warning
					? 'bg-warning-50'
					: 'bg-success-50'} overflow-hidden rounded-full"
		>
			<rect
				class={usage_percentage >= thresholds.danger
					? 'fill-danger-500'
					: usage_percentage >= thresholds.warning
						? 'fill-warning-500'
						: 'fill-success-500'}
				x="0"
				y="0"
				width="{usage_percentage}%"
				height="100%"
				rx="4"
				ry="4"
			/>
		</svg>
	</article>
</button>
