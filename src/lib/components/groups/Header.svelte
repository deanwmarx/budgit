<script>
	import ButtonHamburger from '$comps/elements/buttons/ButtonHamburger.svelte';
	import ButtonRound from '$comps/elements/buttons/ButtonRound.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import Logo from '$comps/elements/Logo.svelte';

	let { drawer_open = $bindable(false) } = $props();
</script>

<header
	class="relative flex items-center justify-between gap-4 border-t border-t-grey-800 px-4 py-2"
>
	<ButtonHamburger onclick={() => (drawer_open = true)} />
	<Logo />
	<ButtonRound size="large">
		<Icon name="plus" class="size-5" />
	</ButtonRound>
</header>
