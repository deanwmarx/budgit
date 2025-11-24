<script>
	import ButtonHamburger from '$comps/elements/buttons/ButtonHamburger.svelte';
	import ButtonRound from '$comps/elements/buttons/ButtonRound.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import Logo from '$comps/elements/Logo.svelte';
	import { navigation, SCREENS } from '$lib/navigation.svelte';

	let { drawer_open = $bindable(false), mode = 'none', onclick = null } = $props();

	/**
	 * Navigate to a screen
	 * @param {import('$lib/navigation.svelte.js').ScreenType} screen
	 */
	function navigate(screen) {
		navigation.navigateTo(screen);
		drawer_open = false;
	}
</script>

<header
	class="relative flex items-center justify-between gap-4 border-t border-t-grey-800 px-4 py-2"
>
	<ButtonHamburger onclick={() => (drawer_open = true)} />
	<button class="appearance-none outline-0" onclick={() => navigate(SCREENS.DASHBOARD)}>
		<Logo />
	</button>
	{#if mode === 'add'}
		<ButtonRound size="large" {onclick}>
			<Icon name="plus" class="size-5" />
		</ButtonRound>
	{:else if mode === 'delete'}
		<ButtonRound size="large" color="danger" {onclick}>
			<Icon name="trash" class="size-5" />
		</ButtonRound>
	{:else}
		<div class="size-5"></div>
	{/if}
</header>
