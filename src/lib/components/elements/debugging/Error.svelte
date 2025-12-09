<script>
	import { appState } from '$lib/appState.svelte.js';
</script>

{#if appState.error_active && appState.last_error}
	<button
		onclick={() => appState.clearError()}
		class="fixed right-4 bottom-4 z-9999 rounded-lg border border-danger-600 bg-danger-100 p-1 text-danger-800"
	>
		<strong>Error:</strong> {appState.last_error.message}
	</button>
{/if}
