<script>
	import { onMount } from 'svelte';

	/**
	 * @typedef {Object} Props
	 * @property {string} name - The name of the icon to display
	 * @property {string} [class] - Additional CSS classes to apply to the SVG
	 */

	/** @type {Props} */
	let { name, ...rest } = $props();
	let svg = $state(``);

	onMount(() => {
		let cancelled = false;

		import(`./svg/${name}.svg?raw`)
			.then((mod) => {
				if (!cancelled) svg = mod.default;
			})
			.catch(() => {
				if (!cancelled)
					svg = `<svg viewBox="0 0 16 16"><text x="8" y="12" text-anchor="middle">?</text></svg>`;
			});

		// Cleanup prevents state updates if component unmounts before import finishes
		return () => (cancelled = true);
	});
</script>

<span class="inline-block {rest.class ?? ''}" role="img" aria-hidden="true">
	{@html svg}
</span>
