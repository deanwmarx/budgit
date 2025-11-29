<script>
	import PrettyJSON from '$comps/elements/debugging/PrettyJSON.svelte';
	import { appState } from '$lib/appState.svelte';
	import { getBudgets, setBudget } from '$lib/db';
	import { navigation } from '$lib/navigation.svelte';
	import { onMount } from 'svelte';
	import Page from '../../routes/+page.svelte';
	import CardBudget from '$comps/groups/cards/CardBudget.svelte';
	import Sheet from '$comps/elements/Sheet.svelte';
	import InputLabel from '$comps/elements/inputs/descriptors/InputLabel.svelte';
	import InputText from '$comps/elements/inputs/InputText.svelte';

	let budgets = $state([]);
	let edit_sheet_open = $state(false);
	let add_sheet_open = $state(false);
	let delete_panel_open = $state(false);
	let selected_budgets = $state(/** @type {string[]} */ ([]));
	let selected_budget = $state(null);
	let is_loading = $state(false);

	// Edit form fields
	let budget_group_name = $state('');
	let budget_amount = $state(0);
	let budget_created_at = $state('');
	let budget_updated_at = $state('');

	// Add form fields
	let new_budget_group_name = $state('');
	let new_budget_amount = $state(0);
	let new_budget_created_at = $state('');
	let new_budget_updated_at = $state('');

	onMount(async () => {
		budgets = await getBudgets(appState.current_month_id);
		updateHeaderMode();
	});

	function updateHeaderMode() {
		if (selected_budgets.length > 0) {
			navigation.setHeaderMode('delete', () => {
				delete_panel_open = true;
			});
		} else {
			navigation.setHeaderMode('add', openAddSheet);
		}
	}

	function openAddSheet() {
		// Reset form
		new_budget_group_name = '';
		new_budget_amount = 0;

		// open sheet
		add_sheet_open = true;
	}

	async function handleAddBudget() {
		try {
			is_loading = true;

			if (!new_budget_group_name.trim() || !new_budget_amount) {
				console.error('Budget name and amount are required.');
			}

			await setBudget(appState.current_month_id, new_budget_group_name, new_budget_amount);

			// Refresh budgets list
			budgets = await getBudgets(appState.current_month_id);
			add_sheet_open = false;
			selected_budgets = [];
			updateHeaderMode();
		} catch (error) {
			console.error('Error adding budget:', error);
		} finally {
			is_loading = false;
		}
	}
</script>

<div class="space-y-4">
	<h1 class="text-center text-xl leading-none font-medium">Budgets</h1>

	{#if budgets.length === 0}
		<p class="text-center text-sm">
            No budgets found. Click the "+" button to add your first budget.
        </p>
	{:else}
		{#each budgets as budget}
			<CardBudget
				title={budget.group_name}
				used={250}
				total={budget.amount}
				currency="R"
				position="prefix"
				thresholds={{ warning: 75, danger: 90 }}
			/>
		{/each}
	{/if}
</div>

<Sheet
	bind:sheet_open={add_sheet_open}
	onsubmit={(e) => {
		e.preventDefault();
		handleAddBudget();
	}}
>
	<h1 class="text-center text-xl leading-none font-medium">Add Budget</h1>

	<div class="space-y-1">
		<InputLabel text="Budget Name" for="new-budget-name" />
		<InputText
			id="new-budget-name"
			name="new-budget-name"
			placeholder="Enter budget name"
			bind:value={new_budget_group_name}
			focus_on_load={true}
		/>
	</div>

	<div class="space-y-1">
		<InputLabel text="Max Amount" for="new-budget-amount" />
		<InputText
			id="new-budget-amount"
			name="new-budget-amount"
			type="number"
			placeholder="Enter max amount"
			bind:value={new_budget_amount}
		/>
	</div>
</Sheet>
