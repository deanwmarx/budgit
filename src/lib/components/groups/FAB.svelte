<script>
	import ButtonQuick from '$comps/elements/buttons/ButtonQuick.svelte';
	import { fly } from 'svelte/transition';

	let { children, is_active=$bindable(false) } = $props();
</script>

<div class="flex flex-col items-center justify-center gap-2">
	{#if is_active}
		<div
			class="flex w-screen flex-col items-center justify-center gap-2"
			transition:fly={{ y: 8, duration: 300 }}
		>
			{@render children()}
		</div>
	{/if}
	<ButtonQuick color="secondary" active={is_active} onclick={() => (is_active = !is_active)} />
</div>
