<script>
	import { fade, fly } from 'svelte/transition';
	import ButtonRound from './buttons/ButtonRound.svelte';
	import Icon from './icons/Icon.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {boolean} [sheet_open=false]
	 * @property {boolean} [can_delete=false]
	 * @property {*} children
	 * @property {*} [onsubmit]
	 */

	/** @type {Props} */
	let { sheet_open = $bindable(false), can_delete = false, children, onsubmit } = $props();
</script>

{#if sheet_open}
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 z-999 bg-black/60"
		role="none"
		onclick={() => (sheet_open = false)}
	></div>
	<form
		transition:fly={{ duration: 200, y: 400 }}
		class="fixed top-15 left-0 z-1000 flex h-[calc(100dvh-60px)] w-full flex-col border-t border-t-grey-800 bg-black"
		{onsubmit}
	>
		<div class="flex-1 space-y-4 overflow-y-auto p-4">
			{@render children()}
		</div>
		<div class="flex justify-between gap-2 border-y border-y-grey-800 bg-grey-900 px-4 py-2">
			<ButtonRound onclick={() => (sheet_open = false)} color="secondary">
				<Icon name="xmark" class="size-5" />
			</ButtonRound>
			{#if can_delete}{:else}
				<ButtonRound type="submit" color="primary">
					<Icon name="checkmark" class="size-5" />
				</ButtonRound>
			{/if}
		</div>
	</form>
{/if}
