<script>
	import Panel from '$comps/elements/Panel.svelte';
	import { fade, fly } from 'svelte/transition';

	/**
	 * @typedef {Object} Props
	 * @property {boolean} is_active - Whether the modal is active
	 * @property {import('svelte').Snippet} children - Modal content
	 */

	/** @type {Props} */
	let { is_active = $bindable(false), children } = $props();
</script>

{#if is_active}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
		onclick={() => (is_active = false)}
		role="none"
		transition:fade={{ duration: 200 }}
	>
		<div transition:fly={{ y: 20, duration: 200 }} class="w-full">
			<Panel>
				{@render children()}
			</Panel>
		</div>
	</div>
{/if}
