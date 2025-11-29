<script>
	let { error, is_active } = $props();
</script>

{#if is_active}
	<button
		onclick={() => (is_active = false)}
		class="fixed right-4 bottom-4 z-9999 rounded-lg border border-danger-600 bg-danger-100 p-1 text-danger-800"
	>
		<strong>Error:</strong>{error.message}
	</button>
{/if}
