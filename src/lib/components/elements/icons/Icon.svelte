<script>
	import { onMount, untrack } from 'svelte';

	/**
	 * @typedef {Object} Props
	 * @property {string} name - The name of the icon to display
	 * @property {string} class - Usually used to set the size or color of the icon (e.g., 'size-4 text-primary-700')
	 */

	/** @type {Props} */
	let { name, ...rest } = $props();
	let svg = $state(``);

	$effect(() => {
		let cancelled = false;
		name;

		untrack(() => {
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
	});
</script>

<span class="inline-block {rest.class ?? ''}" role="img" aria-hidden="true">
	{@html svg}
</span>
