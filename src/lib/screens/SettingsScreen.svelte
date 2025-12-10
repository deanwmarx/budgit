<script>
	import PrettyJSON from '$comps/elements/debugging/PrettyJSON.svelte';
	import InputLabel from '$comps/elements/inputs/descriptors/InputLabel.svelte';
	import InputSlider from '$comps/elements/inputs/InputSlider.svelte';
	import InputText from '$comps/elements/inputs/InputText.svelte';
	import Accordion from '$comps/groups/Accordion.svelte';
	import { appState } from '$lib/appState.svelte';
	import { getHousehold, updateHousehold } from '$lib/db/households';
	import { navigation } from '$lib/navigation.svelte';
	import { onMount, untrack } from 'svelte';

	/** @type {any} */
	let household = $state([]);
	/** @type {string} */
	let household_name = $state('');
	/**  @type {number | null} */
	let budget_cycle_start_day = $state(null);
	let budget_warning_threshold = $state(75);
	let budget_danger_threshold = $state(90);

	/** @type {string} */
	let original_household_name = $state('');
	/** @type {number | null} */
	let original_budget_cycle_start_day = $state(null);
	/** @type {number} */
	let original_budget_warning_threshold = $state(75);
	/** @type {number} */
	let original_budget_danger_threshold = $state(90);

	let has_changes = $derived(
		household_name !== original_household_name ||
			budget_cycle_start_day !== original_budget_cycle_start_day ||
			budget_warning_threshold !== original_budget_warning_threshold ||
			budget_danger_threshold !== original_budget_danger_threshold
	);

	onMount(async () => {
		if (!appState.current_household_id) return;
		household = await getHousehold(appState.current_household_id);
		if (household) {
			household_name = household.name;
			budget_cycle_start_day = household.budgetCycleStartDay;
			budget_warning_threshold = household.budgetWarningThreshold;
			budget_danger_threshold = household.budgetDangerThreshold;

			original_household_name = household.name;
			original_budget_cycle_start_day = household.budgetCycleStartDay;
			original_budget_warning_threshold = household.budgetWarningThreshold;
			original_budget_danger_threshold = household.budgetDangerThreshold;
		}
	});

	$effect(() => {
		has_changes;

		untrack(() => {
			updateHeaderMode();
		});
	});

	function updateHeaderMode() {
		if (has_changes) {
			// Save handler
			const save = async () => {
				try {
					if (!appState.current_household_id) return;
					const hid = appState.current_household_id;
					await updateHousehold(
						hid,
						household_name,
						Number(budget_cycle_start_day ?? 1),
						Number(budget_warning_threshold ?? 75),
						Number(budget_danger_threshold ?? 90)
					);

					appState.current_household = {
						id: hid,
						name: household_name,
						budgetCycleStartDay: Number(budget_cycle_start_day ?? 1)
					};
					appState.household_budget_warning_threshold = Number(budget_warning_threshold ?? 75);
					appState.household_budget_danger_threshold = Number(budget_danger_threshold ?? 90);

					// commit originals
					original_household_name = household_name;
					original_budget_cycle_start_day = budget_cycle_start_day ?? null;
					original_budget_warning_threshold = budget_warning_threshold;
					original_budget_danger_threshold = budget_danger_threshold;
					// clear header
					navigation.header_mode = 'none';
					navigation.header_onclick = null;
					navigation.header_undo = null;
				} catch (err) {
					console.error('Failed saving household settings', err);
				}
			};

			// Undo handler
			const undo = () => {
				household_name = original_household_name;
				budget_cycle_start_day = original_budget_cycle_start_day;
				budget_warning_threshold = original_budget_warning_threshold;
				budget_danger_threshold = original_budget_danger_threshold;
				navigation.header_mode = 'none';
				navigation.header_onclick = null;
				navigation.header_undo = null;
			};

			navigation.header_mode = 'update';
			navigation.header_onclick = save;
			navigation.header_undo = undo;
		} else {
			if (navigation.header_mode !== 'none') {
				navigation.header_mode = 'none';
				navigation.header_onclick = null;
				navigation.header_undo = null;
			}
		}
	}
</script>

<div class="space-y-4">
	<h1 class="text-center text-xl leading-none font-medium">Settings</h1>
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
		<div class="space-y-1">
			<InputLabel text="Budget Warning Threshold" for="warning-threshold" />
			<InputSlider bind:value={budget_warning_threshold} variant="warning" />
		</div>
		<div class="space-y-1">
			<InputLabel text="Budget Danger Threshold" for="danger-threshold" />
			<InputSlider bind:value={budget_danger_threshold} variant="danger" />
		</div>
	</Accordion>
</div>
