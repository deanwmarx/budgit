<script>
	import { navigation, SCREENS } from '$lib/navigation.svelte.js';
	import { appState } from '$lib/appState.svelte.js';
	import DashboardScreen from '$lib/screens/DashboardScreen.svelte';
	import SettingsScreen from '$lib/screens/SettingsScreen.svelte';
	import MembersScreen from '$lib/screens/MembersScreen.svelte';
	import BudgetsScreen from '$lib/screens/BudgetsScreen.svelte';
	import TransactionsScreen from '$lib/screens/TransactionsScreen.svelte';
	import ComponentsScreen from '$lib/screens/ComponentsScreen.svelte';
	import NotesScreen from '$lib/screens/NotesScreen.svelte';
	import OnboardingScreen from '$lib/screens/OnboardingScreen.svelte';
	import { fade } from 'svelte/transition';
</script>

{#if appState.is_loading}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<div class="mb-4 text-4xl font-bold text-primary-500">Budgit</div>
			<div class="text-gray-400">Loading...</div>
		</div>
	</div>
{:else if !appState.is_initialized}
	<OnboardingScreen />
{:else if navigation.current_screen === SCREENS.DASHBOARD}
	<div in:fade={{ duration: 300 }}>
		<DashboardScreen />
	</div>
{:else if navigation.current_screen === SCREENS.SETTINGS}
	<div in:fade={{ duration: 300 }}>
		<SettingsScreen />
	</div>
{:else if navigation.current_screen === SCREENS.MEMBERS}
	<div in:fade={{ duration: 300 }}>
		<MembersScreen />
	</div>
{:else if navigation.current_screen === SCREENS.BUDGETS}
	<div in:fade={{ duration: 300 }}>
		<BudgetsScreen />
	</div>
{:else if navigation.current_screen === SCREENS.COMPONENTS}
	<div in:fade={{ duration: 300 }}>
		<ComponentsScreen />
	</div>
{:else if navigation.current_screen === SCREENS.NOTES}
	<div in:fade={{ duration: 300 }}>
		<NotesScreen />
	</div>
{:else if navigation.current_screen === SCREENS.TRANSACTIONS}
	<div in:fade={{ duration: 300 }}>
		<TransactionsScreen />
	</div>
{:else}
	<div in:fade={{ duration: 300 }}>
		<DashboardScreen />
	</div>
{/if}
