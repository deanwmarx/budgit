<script>
	import PrettyJSON from '$comps/elements/debugging/PrettyJSON.svelte';
import InputLabel from '$comps/elements/inputs/descriptors/InputLabel.svelte';
	import InputSlider from '$comps/elements/inputs/InputSlider.svelte';
	import InputText from '$comps/elements/inputs/InputText.svelte';
	import Accordion from '$comps/groups/Accordion.svelte';
	import { appState } from '$lib/appState.svelte';
	import { getHousehold } from '$lib/db/households';
	import { onMount } from 'svelte';

	/** @type {any} */
	let household = $state([]);
	/** @type {string} */
	let household_name = $state('');
	/**  @type {number | null} */
	let budget_cycle_start_day = $state(null);

	onMount(async () => {
		// Load current household settings
		household = await getHousehold(appState.current_household_id);
		if (household) {
			household_name = household.name;
			budget_cycle_start_day = household.budgetCycleStartDay;
		}
	});
</script>

<div class="space-y-4">
	<h1 class="text-center text-xl leading-none font-medium">Settings</h1>
    <PrettyJSON data={household} />
	<Accordion is_open={true} title="Household Settings">
		<div class="space-y-1">
			<InputLabel text="Name" for="household-name" />
			<InputText
				id="household-name"
				bind:value={household_name}
				placeholder="Enter household name"
			/>
		</div>
		<div class="space-y-1">
			<InputLabel text="Budget Cycle Start Day" for="budget-cycle-start-day" />
			<InputText
				id="budget-cycle-start-day"
				type="number"
                bind:value={budget_cycle_start_day}
				min="1"
				max="28"
				placeholder="Enter start day for your budget cycle"
			/>
		</div>
	</Accordion>
	<Accordion title="Budget Settings">
		<div class="space-y-1">
			<InputLabel text="Wanring Threshold" for="warning-threshold" />
			<InputSlider value={75} variant="warning" />
		</div>
		<div class="space-y-1">
			<InputLabel text="Danger Threshold" for="danger-threshold" />
			<InputSlider value={90} variant="danger" />
		</div>
	</Accordion>
</div>
