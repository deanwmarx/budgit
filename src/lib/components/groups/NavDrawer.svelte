<script>
	import { navigation, SCREENS } from '$lib/navigation.svelte.js';

	let { open = $bindable() } = $props();

	function navigate(screen) {
		navigation.navigateTo(screen);
		open = false;
	}

	function handleLogout() {
		// Implement logout logic
		navigation.reset();
		open = false;
	}
</script>

{#if open}
	<!-- Overlay -->
	<div class="fixed inset-0 z-40 bg-black/50" onclick={() => (open = false)}></div>

	<!-- Drawer -->
	<nav class="fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-white shadow-lg">
		<div class="bg-blue-600 p-4 text-white">
			<h2 class="text-xl font-bold">Menu</h2>
		</div>

		<div class="flex-1 overflow-y-auto p-4">
			<button
				onclick={() => navigate(SCREENS.DASHBOARD)}
				class="w-full rounded p-3 text-left hover:bg-gray-100"
			>
				Dashboard
			</button>

			<button
				onclick={() => navigate(SCREENS.SETTINGS)}
				class="w-full rounded p-3 text-left hover:bg-gray-100"
			>
				Settings
			</button>

			<button
				onclick={() => navigate(SCREENS.HOUSEHOLD_SETTINGS)}
				class="w-full rounded p-3 text-left hover:bg-gray-100"
			>
				Household Settings
			</button>

			<button
				onclick={() => navigate(SCREENS.MEMBER_MANAGEMENT)}
				class="w-full rounded p-3 text-left hover:bg-gray-100"
			>
				Manage Members
			</button>

			<button
				onclick={() => navigate(SCREENS.DEVICE_MANAGEMENT)}
				class="w-full rounded p-3 text-left hover:bg-gray-100"
			>
				Manage Devices
			</button>
		</div>

		<div class="border-t p-4">
			<button
				onclick={handleLogout}
				class="w-full rounded p-3 text-left text-red-600 hover:bg-red-50"
			>
				Logout
			</button>
		</div>
	</nav>
{/if}
