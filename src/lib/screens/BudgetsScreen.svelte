<script>
	import InputLabel from '$comps/elements/inputs/descriptors/InputLabel.svelte';
	import InputValidation from '$comps/elements/inputs/descriptors/InputValidation.svelte';
	import InputText from '$comps/elements/inputs/InputText.svelte';
</script>

<div class="space-y-4 p-4">
	<div class="space-y-1">
		<InputLabel for="input-example" text="Example Input" />
		<InputText id="input-example" placeholder="Enter some text..." focus_on_load={true} />
	</div>
	<div class="space-y-1">
		<InputLabel for="input-example" text="Example Input" required={true} invalid={true} />
		<InputText id="input-example" placeholder="Enter some text..." required={true} invalid={true} />
		<InputValidation text="This field is required." invalid={true} />
	</div>
</div>
