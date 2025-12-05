<script>
	let { data } = $props();
</script>

<pre class="max-w-full overflow-x-auto rounded bg-grey-800 p-2 text-sm">
    {JSON.stringify(data, null, 2)}
</pre>
