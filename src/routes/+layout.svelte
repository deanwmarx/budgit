<script>
	import { navigation, SCREENS } from '$lib/navigation.svelte.js';
	import { appState } from '$lib/appState.svelte.js';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import '../app.css';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import ButtonRound from '$comps/elements/buttons/ButtonRound.svelte';
	import Button from '$comps/elements/buttons/Button.svelte';
	import FAB from '$comps/groups/FAB.svelte';
	import Header from '$comps/groups/Header.svelte';
	import MonthSelector from '$comps/groups/MonthSelector.svelte';
	import InputSelect from '$comps/elements/inputs/InputSelect.svelte';
	import Error from '$comps/elements/debugging/Error.svelte';

	let { children } = $props();
	let drawer_open = $state(false);
	let fab_menu_is_active = $state(false);
	let current_month = $state('');
	let budget_warning_threshold = $state(75);
	let budget_danger_threshold = $state(90);

	// Derived from app state
	let households = $derived(
		appState.households.map((h) => ({
			value: h.id,
			label: h.name
		}))
	);
	let default_household = $derived(appState.current_household_id || '');

	let show_layout = $derived(appState.is_initialized);

	onMount(() => {
		/** @type {any} */
		let cleanup = null;
		(async () => {
			// Initialize app state - loads user/household from Capacitor Preferences
			await appState.initialize();

			if (typeof window === 'undefined') return;

			const origConsoleError = console.error && console.error.bind(console);

			/** @param {any} ev */
			function errorEventHandler(ev) {
				try {
					const err = ev?.error || (ev?.message ? new Error(ev.message) : ev);
					appState.setError(err);
				} catch (e) {
					// ignore
				}
				if (origConsoleError) origConsoleError(ev);
			}

			/** @param {any} ev */
			function rejectionHandler(ev) {
				try {
					const reason = ev?.reason || new Error('Unhandled rejection');
					appState.setError(reason);
				} catch (e) {
					// ignore
				}
				if (origConsoleError) origConsoleError(ev.reason || ev);
			}

			/** @param {...any} args */
			function consoleErrorOverride(...args) {
				try {
					const first = args[0];
					const err = first instanceof Error ? first : new Error(args.map(String).join(' '));
					appState.setError(err);
				} catch (e) {
					// ignore
				}
				if (origConsoleError) origConsoleError(...args);
			}

			window.addEventListener('error', errorEventHandler);
			window.addEventListener('unhandledrejection', rejectionHandler);
			console.error = consoleErrorOverride;

			cleanup = () => {
				if (origConsoleError) console.error = origConsoleError;
				window.removeEventListener('error', errorEventHandler);
				window.removeEventListener('unhandledrejection', rejectionHandler);
			};
		})();

		return () => {
			if (cleanup) cleanup();
		};
	});

	$effect(() => {
		appState.current_month_id = current_month;
	});

	/**
	 * Navigate to a screen
	 * @param {import('$lib/navigation.svelte.js').ScreenType} screen
	 */
	function navigate(screen) {
		navigation.navigateTo(screen);
		drawer_open = false;
	}

	/**
	 * Handle household selection change
	 * @param {Event & { currentTarget: HTMLSelectElement }} e
	 */
	async function handleHouseholdChange(e) {
		const selected_id = e.currentTarget.value;
		const selected = appState.households.find((h) => h.id === selected_id);
		if (selected) {
			await appState.setHousehold(selected.id, selected.name);
		}
	}

	async function handleLogout() {
		await appState.logout();
		drawer_open = false;
	}
</script>

{#if show_layout}
	<div class="flex h-screen flex-col">
		<MonthSelector bind:current_month />

		<Error />

		{#if drawer_open}
			<div
				class="fixed inset-0 z-40 h-full w-full bg-black/75"
				onclick={() => (drawer_open = false)}
				transition:fade={{ duration: 300 }}
				role="none"
			></div>
			<nav
				class="fixed top-0 left-0 z-50 flex h-full w-80 flex-col justify-between bg-grey-900 shadow"
				transition:fly={{ x: -324, duration: 300 }}
			>
				<div>
					<div class="flex items-center justify-between gap-2 border-b border-grey-800 p-4">
						<InputSelect
							class="flex-1"
							value={default_household}
							onchange={handleHouseholdChange}
							options={households}
							placeholder="Select a household"
						/>
						<ButtonRound onclick={() => (drawer_open = false)} color="transparent" size="large">
							<Icon name="xmark" class="size-5" />
						</ButtonRound>
					</div>
					<div class="space-y-2 pt-4">
						<button
							onclick={() => navigate(SCREENS.DASHBOARD)}
							class="flex w-full items-center gap-2 px-4 py-1.5 text-left transition-colors duration-300 active:bg-grey-800 {navigation.current_screen ===
							SCREENS.DASHBOARD
								? 'bg-primary-700 font-semibold'
								: ''}"
						>
							<Icon name="home" class="size-4" />
							Dashboard
						</button>
						<button
							onclick={() => navigate(SCREENS.TRANSACTIONS)}
							class="flex w-full items-center gap-2 px-4 py-1.5 text-left transition-colors duration-300 active:bg-grey-800 {navigation.current_screen ===
							SCREENS.TRANSACTIONS
								? 'bg-primary-700 font-semibold'
								: ''}"
						>
							<Icon name="arrows-left-right" class="size-4 -rotate-45" />
							Transactions
						</button>
						<button
							onclick={() => navigate(SCREENS.BUDGETS)}
							class="flex w-full items-center gap-2 px-4 py-1.5 text-left transition-colors duration-300 active:bg-grey-800 {navigation.current_screen ===
							SCREENS.BUDGETS
								? 'bg-primary-700 font-semibold'
								: ''}"
						>
							<Icon name="sliders" class="size-4" />
							Budgets
						</button>
						<button
							onclick={() => navigate(SCREENS.COMPONENTS)}
							class="flex w-full items-center gap-2 px-4 py-1.5 text-left transition-colors duration-300 active:bg-grey-800 {navigation.current_screen ===
							SCREENS.COMPONENTS
								? 'bg-primary-700 font-semibold'
								: ''}"
						>
							<Icon name="building-blocks" class="size-4" />
							Components
						</button>
					</div>
				</div>
				<div>
					<div class="space-y-2 border-b border-grey-800 pb-4">
						<button
							onclick={() => navigate(SCREENS.MEMBERS)}
							class="flex w-full items-center gap-2 px-4 py-1.5 text-left transition-colors duration-300 active:bg-grey-800 {navigation.current_screen ===
							SCREENS.MEMBERS
								? 'bg-primary-700 font-semibold'
								: ''}"
						>
							<Icon name="users" class="size-4" />
							Members
						</button>
						<button
							onclick={() => navigate(SCREENS.SETTINGS)}
							class="flex w-full items-center gap-1 px-4 py-1.5 text-left transition-colors duration-300 active:bg-grey-800 {navigation.current_screen ===
							SCREENS.SETTINGS
								? 'bg-primary-700 font-semibold'
								: ''}"
						>
							<Icon name="gear" class="size-4" />
							Settings
						</button>
					</div>
					<div class="p-4 text-right">
						<button onclick={handleLogout} class="flex items-center gap-2">
							<Icon name="logout" class="size-4" />
							Logout
						</button>
					</div>
				</div>
			</nav>
		{/if}

		<main class="relative flex-1 overflow-y-auto p-4">
			{@render children()}
		</main>

		<!-- <div class="fixed bottom-15.5 left-1/2 z-10 -translate-x-1/2 transform">
			<FAB bind:is_active={fab_menu_is_active}>
				<Button color="primary" onclick={() => (fab_menu_is_active = false)}>
					<Icon name="arrows-up-down" class="size-6" />
					Add Variable Expense
				</Button>
				<Button color="primary" onclick={() => (fab_menu_is_active = false)}>
					<Icon name="exclamation-triangle" class="size-6" />
					Add Incidental Expense
				</Button>
			</FAB>
		</div> -->
		<Header bind:drawer_open mode={navigation.header_mode} onclick={navigation.header_onclick} />
	</div>
{:else}
	{@render children()}
{/if}
