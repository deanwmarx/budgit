<script>
	import { navigation, SCREENS } from '$lib/navigation.svelte.js';
	import DashboardScreen from '$lib/screens/DashboardScreen.svelte';
	import SettingsScreen from '$lib/screens/SettingsScreen.svelte';
	import MembersScreen from '$lib/screens/MembersScreen.svelte';
	import BudgetsScreen from '$lib/screens/BudgetsScreen.svelte';
	import TransactionsScreen from '$lib/screens/TransactionsScreen.svelte';
	import { fade } from 'svelte/transition';
	import ButtonQuick from '$comps/elements/buttons/ButtonQuick.svelte';
</script>

{#if navigation.current_screen === SCREENS.DASHBOARD}
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
{:else if navigation.current_screen === SCREENS.TRANSACTIONS}
	<div in:fade={{ duration: 300 }}>
		<TransactionsScreen />
	</div>
{:else}
	<div in:fade={{ duration: 300 }}>
		<DashboardScreen />
	</div>
{/if}
