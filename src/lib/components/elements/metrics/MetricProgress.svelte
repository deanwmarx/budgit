<script>
	import Icon from '../icons/Icon.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {number} percentage
	 * @property {string} label
	 * @property {string} icon
	 * @property {number} [warning_threshold=70]
	 * @property {number} [danger_threshold=90]
	 * @property {string} [class]
	 */

	/** @type {Props} */
	let { percentage, label, icon, warning_threshold = 70, danger_threshold = 90, ...rest } = $props();

	const radius = 32;
	const circumference = 2 * Math.PI * radius;
</script>

<div class="inline-flex w-auto flex-col items-center gap-2 rounded-xl bg-grey-900 py-3 {rest.class ?? ''}">
	<div class="flex gap-1">
		<Icon name={icon} class="size-4" />
		<span class="text-sm font-medium">{label}</span>
	</div>
	<div class="relative flex items-center justify-center">
		<svg class="size-19 -rotate-90 transform">
			<!-- Background circle -->
			<circle
				cx="38"
				cy="38"
				r={radius}
				class="fill-none stroke-[12px] {percentage >= danger_threshold
					? 'stroke-danger-50'
					: percentage >= warning_threshold
						? 'stroke-warning-50'
						: 'stroke-success-50'}"
			/>
			<!-- Progress circle -->
			<circle
				cx="38"
				cy="38"
				r={radius}
				class="fill-none stroke-[12px] transition-all duration-500 {percentage >= danger_threshold
					? 'stroke-danger-500'
					: percentage >= warning_threshold
						? 'stroke-warning-500'
						: 'stroke-success-500'}"
				style="stroke-dasharray: {circumference}; stroke-dashoffset: {circumference -
					(percentage / 100) * circumference};"
				stroke-linecap="round"
			/>
		</svg>
		<span class="absolute text-lg font-semibold text-white">
			{percentage}%
		</span>
	</div>
</div>
