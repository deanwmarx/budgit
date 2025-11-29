<script>
	import ButtonHamburger from '$comps/elements/buttons/ButtonHamburger.svelte';
	import ButtonRound from '$comps/elements/buttons/ButtonRound.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import Logo from '$comps/elements/Logo.svelte';
	import { navigation, SCREENS } from '$lib/navigation.svelte';
	import { untrack } from 'svelte';
	import { fade } from 'svelte/transition';

	let { drawer_open = $bindable(false), mode = 'none', onclick = null } = $props();

	/**
	 * @type {Object.<string, {icon: string, color: string}>}
	 */
	let mode_buttons = {
		add: {
			icon: 'plus',
			color: 'primary'
		},
		update: {
			icon: 'checkmark',
			color: 'primary'
		},
		delete: {
			icon: 'trash',
			color: 'danger'
		},
		undo: {
			icon: 'arrow-undo',
			color: 'secondary'
		}
	};

	let button_icon = $state('');
	let button_color = $state('secondary');

	$effect(() => {
		mode;

		untrack(() => {
			if (mode in mode_buttons) {
				button_icon = mode_buttons[mode].icon;
				button_color = mode_buttons[mode].color;
			} else {
				button_icon = '';
				button_color = 'secondary';
			}
		});
	});

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
	{#if mode === 'update'}
		<div in:fade={{ duration: 200 }}>
			<ButtonRound size="large" color="secondary" onclick={() => {
				// call global undo handler if present
				if (navigation.header_undo && typeof navigation.header_undo === 'function') {
					navigation.header_undo();
				} else {
					drawer_open = true;
				}
			}}>
				<Icon name="xmark" class="size-5" />
			</ButtonRound>
		</div>
	{:else}
		<div in:fade={{ duration: 200 }}>
			<ButtonHamburger onclick={() => (drawer_open = true)} />
		</div>
	{/if}
	<button class="appearance-none outline-0" onclick={() => navigate(SCREENS.DASHBOARD)}>
		<Logo />
	</button>
	{#if mode !== 'none'}
		<ButtonRound size="large" {onclick} color={button_color}>
			<Icon name={button_icon} class="size-5" />
		</ButtonRound>
	{:else}
		<div class="size-11"></div>
	{/if}
</header>
