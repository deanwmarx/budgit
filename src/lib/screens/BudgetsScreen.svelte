<script>
	import Badge from '$comps/elements/badges/Badge.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import InputLabel from '$comps/elements/inputs/descriptors/InputLabel.svelte';
	import InputValidation from '$comps/elements/inputs/descriptors/InputValidation.svelte';
	import InputDate from '$comps/elements/inputs/InputDate.svelte';
	import InputOptions from '$comps/elements/inputs/InputOptions.svelte';
	import InputText from '$comps/elements/inputs/InputText.svelte';

	let selected_date = $state('');
	const my_options = [
		{ value: 'option1', label: 'Dashboard', icon: 'home' },
		{ value: 'option2', label: 'Settings', icon: 'cog' },
		{ value: 'option3', label: 'Profile' } // No icon
	];
	let selected_option = $state('option2');
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
	<Badge>
		<Icon name="checkmark" class="size-4" />
		Badge Component Example
	</Badge>
	<div class="space-y-1">
		<InputLabel for="pick-date" text="Pick a Date" />
		<InputDate id="pick-date" bind:value={selected_date} placeholder="Select a date" />
	</div>
	<p>Selected Date: {selected_date}</p>

	<div class="space-y-1">
		<InputLabel text="Select an Option" />
		<InputOptions
			name="example-options"
			options={my_options}
			default_value="option2"
			bind:value={selected_option}
		/>
	</div>
	<p>Selected Option: {selected_option}</p>
</div>
