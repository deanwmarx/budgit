<script>
	import Badge from '$comps/elements/badges/Badge.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import InputLabel from '$comps/elements/inputs/descriptors/InputLabel.svelte';
	import InputValidation from '$comps/elements/inputs/descriptors/InputValidation.svelte';
	import InputAmount from '$comps/elements/inputs/InputAmount.svelte';
	import InputDate from '$comps/elements/inputs/InputDate.svelte';
	import InputOptions from '$comps/elements/inputs/InputOptions.svelte';
	import InputSlider from '$comps/elements/inputs/InputSlider.svelte';
	import InputText from '$comps/elements/inputs/InputText.svelte';
	import MetricAmount from '$comps/elements/metrics/MetricAmount.svelte';
	import MetricProgress from '$comps/elements/metrics/MetricProgress.svelte';

	let selected_date = $state('');
	const my_options = [
		{ value: 'option1', label: 'Dashboard', icon: 'home' },
		{ value: 'option2', label: 'Settings', icon: 'cog' },
		{ value: 'option3', label: 'Profile' } // No icon
	];
	let selected_option = $state('option2');
	let slider_value = $state(50);
	let amount = $state(null);
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
	<div class="space-y-1">
		<InputLabel for="input-example-disabled" text="Example Disabled Input" disabled={true} />
		<InputText
			id="input-example-disabled"
			placeholder="You can't enter some text..."
			focus_on_load={true}
			disabled={true}
		/>
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

	<div class="space-y-1">
		<InputLabel text="Slider Example" />
		<InputSlider bind:value={slider_value} variant="safe" />
	</div>
	<p>Slider Value: {slider_value}%</p>

	<div class="space-y-1">
		<InputLabel text="Amount Input Example" />
		<InputAmount
			type="number"
			placeholder="Enter amount"
			currency="R"
			currency_position="prefix"
			bind:value={amount}
		/>
	</div>
	<p>Amount Entered: {amount}</p>

	<MetricAmount amount="R 1256" label="Total Amount" icon="wallet" />

	<div class="grid grid-cols-3 gap-4">
		<MetricProgress percentage={75} label="Electricity" icon="bolt" />
		<MetricProgress percentage={90} label="Groceries" icon="cart" />
		<MetricProgress percentage={25} label="Petrol" icon="flame" />
	</div>
</div>
