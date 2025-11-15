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
	import InputToggle from '$comps/elements/inputs/InputToggle.svelte';
	import MemberSelect from '$comps/elements/members/MemberSelect.svelte';
	import MetricAmount from '$comps/elements/metrics/MetricAmount.svelte';
	import MetricProgress from '$comps/elements/metrics/MetricProgress.svelte';
	import CardBudget from '$comps/groups/cards/CardBudget.svelte';
	import CardMember from '$comps/groups/cards/CardMember.svelte';
	import CardTransaction from '$comps/groups/cards/CardTransaction.svelte';

	let selected_date = $state('');
	const my_options = [
		{ value: 'variable', label: 'Variable', icon: 'arrows-up-down' },
		{ value: 'incidental', label: 'Incidental', icon: 'exclamation-triangle' },
		{ value: 'fixed', label: 'Fixed', icon: 'lock-closed' }
	];
	let selected_option = $state('incidental');
	let slider_value = $state(50);
	let amount = $state(null);
	let toggle_state = $state(false);
	let input_selected_option = $state('option1');
	let input_select_options = [
		{ value: 'john', label: 'John Smith', color: 'green' },
		{ value: 'jane', label: 'Jane Smith', color: 'orange' },
		{ value: 'edgar', label: 'Edgar Smith', color: 'blue' }
	];
	let transaction_clicked = $state(false);
	let member_clicked = $state(false);
	let budget_clicked = $state(false);
</script>

<div class="space-y-4 p-2">
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
		Badge Example
	</Badge>
	<div class="space-y-1">
		<InputLabel for="pick-date" text="Pick a Date" />
		<InputDate id="pick-date" bind:value={selected_date} placeholder="Select a date" />
	</div>
	<p>Selected Date: {selected_date}</p>

	<div class="space-y-1">
		<InputLabel text="Select a category" />
		<InputOptions name="example-options" options={my_options} bind:value={selected_option} />
	</div>
	<p>Selected category: {selected_option}</p>

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

	<div class="space-y-1">
		<InputLabel text="Toggle Example" for="toggle-example" />
		<InputToggle id="toggle-example" bind:checked={toggle_state} />
	</div>
	<p>Toggle State: {toggle_state}</p>

	<div class="space-y-1">
		<InputLabel text="Select a Member" for="select-member" />
		<MemberSelect
			id="select-member"
			name="select-member"
			options={input_select_options}
			bind:selected_option={input_selected_option}
		/>
	</div>
	<p>Selected from InputSelect: {input_selected_option}</p>

	<CardTransaction
		title="Grocery Shopping"
		amount={{ currency: 'R', position: 'prefix', value: 450 }}
		date="2024-06-15"
		category="variable"
		type="expense"
		member={{ name: 'Jane Smith', color: 'orange' }}
		onclick={() => (transaction_clicked = !transaction_clicked)}
	/>
	<p>Transaction Clicked: {transaction_clicked.toString()}</p>

	<CardMember
		name="John Smith"
		color="green"
		role="admin"
		onclick={() => (member_clicked = !member_clicked)}
	/>
	<p>Member Clicked: {member_clicked.toString()}</p>

	<CardBudget
		title="Groceries Budget"
		used={5500}
		total={5000}
		currency="R"
		position="prefix"
		thresholds={{ warning: 70, danger: 90 }}
		onclick={() => (budget_clicked = !budget_clicked)}
	/>
	<p>Budget Clicked: {budget_clicked.toString()}</p>
</div>
