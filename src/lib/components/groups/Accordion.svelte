<script>
	import ButtonRound from '$comps/elements/buttons/ButtonRound.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import { slide } from 'svelte/transition';

	/**
	 * @typedef {Object} Props
	 * @property {string} title - Title of the accordion
	 * @property {boolean} [is_open=false] - Whether the accordion is open by default
	 * @property {import('svelte').Snippet} children - Accordion content
	 */

	/** @type {Props} */
	let { title, is_open = false, children } = $props();
</script>

<div class="overflow-hidden rounded-lg bg-grey-900 shadow-sm">
	<button
		class="group flex w-full appearance-none items-center justify-between gap-4 p-4 text-lg leading-none font-medium outline-0"
		onclick={() => (is_open = !is_open)}
	>
		{title}
		<ButtonRound
			size="small"
			color="secondary"
			onclick={(e) => {
				e.stopPropagation();
				is_open = !is_open;
			}}
			class="group-active:bg-secondary-600"
		>
			<Icon
				name="chevron-down"
				class="size-4 transition-transform duration-300 {is_open ? 'rotate-180' : ''}"
			/>
		</ButtonRound>
	</button>
	{#if is_open}
		<div transition:slide={{ duration: 250 }} class="space-y-4 px-4 pb-4">
			{@render children()}
		</div>
	{/if}
</div>
