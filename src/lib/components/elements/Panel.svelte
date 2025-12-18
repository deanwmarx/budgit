<script>
	const { children } = $props();
</script>

<div class="w-full rounded-lg bg-grey-900 p-4 shadow-lg">
	{@render children()}
</div>
