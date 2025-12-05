<script>
	import PrettyJSON from '$comps/elements/debugging/PrettyJSON.svelte';
	import { appState } from '$lib/appState.svelte';
	import { getBudgets, setBudget, getMonths, createMonth, deleteBudget } from '$lib/db';
	import { navigation } from '$lib/navigation.svelte';
	import { onMount, untrack } from 'svelte';
	import Page from '../../routes/+page.svelte';
	import CardBudget from '$comps/groups/cards/CardBudget.svelte';
	import Sheet from '$comps/elements/Sheet.svelte';
	import InputLabel from '$comps/elements/inputs/descriptors/InputLabel.svelte';
	import InputText from '$comps/elements/inputs/InputText.svelte';
	import { formatRelativeDate } from '$lib/utils/helpers';
	import { fade } from 'svelte/transition';
	import Icon from '$comps/elements/icons/Icon.svelte';

	let budgets = $state(/** @type {any[]} */ ([]));
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

	const current_month_id = $derived(appState.current_month_id);

	onMount(async () => {
		// Resolve current month id (appState may hold a YYYY-MM label)
		try {
			const month_id = await resolveOrEnsureMonthId(current_month_id);
			budgets = await getBudgets(month_id);
		} catch (err) {
			console.error('[Budgets] Failed to load budgets for month:', err);
		}
		updateHeaderMode();
	});

	$effect(() => {
		current_month_id;

		untrack(async () => {
			try {
				const month_id = await resolveOrEnsureMonthId(current_month_id);
				budgets = await getBudgets(month_id);
			} catch (err) {
				console.error('[Budgets] Failed to load budgets for month change:', err);
			}
		});
	});

	/**
	 * Resolve a month identifier from the appState value. If appState stores a label like "YYYY-MM",
	 * try to find the corresponding month row for the current household. If none exists, create it.
	 * Month IDs are now stored as YYYY-MM format directly in the database (per spec).
	 * @param {string|null} month_key
	 * @returns {Promise<string>} month id in YYYY-MM format
	 */
	async function resolveOrEnsureMonthId(month_key) {
		if (!month_key) throw new Error('No month specified');

		// Month IDs are now YYYY-MM format - validate format
		if (!/^\d{4}-\d{2}$/.test(month_key)) {
			throw new Error(`Invalid month format: ${month_key}. Expected YYYY-MM`);
		}

		// Need household context to lookup/create month
		const household_id = appState.current_household_id;
		if (!household_id) throw new Error('No household selected');

		// Check if month exists by ID directly (since ID is now YYYY-MM)
		const months = await getMonths(household_id, 0);
		const match = months.find((m) => m.id === month_key);
		if (match) return match.id;

		// Not found: create a new month for that label
		const [year_str, month_str] = month_key.split('-');
		const year = Number(year_str);
		const month = Number(month_str); // 1-12
		if (!year || !month) throw new Error('Invalid month format');

		// Calculate proper start/end dates based on budget cycle
		const { calculateMonthDates } = await import('$lib/utils');
		const start_day = appState.current_household?.budgetCycleStartDay || 1;
		const { startDate, endDate } = calculateMonthDates(month_key, start_day);

		const created = await createMonth(household_id, startDate, endDate);
		return created.id;
	}

	function updateHeaderMode() {
		if (selected_budgets.length > 0) {
			navigation.setHeaderMode('delete', () => {
				delete_panel_open = true;
			});
		} else {
			navigation.setHeaderMode('add', openAddSheet);
		}
	}

	function openEditSheet(budget) {
		selected_budget = budget;
		budget_group_name = budget.groupName;
		budget_amount = budget.amount;
		budget_created_at = formatRelativeDate(budget.createdAt);
		budget_updated_at = formatRelativeDate(budget.updatedAt);
		edit_sheet_open = true;
	}

	function openAddSheet() {
		// Reset form
		new_budget_group_name = '';
		new_budget_amount = 0;

		// open sheet
		add_sheet_open = true;
	}

	async function handleUpdateBudget() {
		if (!selected_budget) return;

		try {
		} catch (e) {
			console.error('Error updating budget:', e);
		} finally {
			is_loading = false;
		}
	}

	async function handleAddBudget() {
		try {
			is_loading = true;

			if (!new_budget_group_name.trim() || !new_budget_amount) {
				console.error('Budget name and amount are required.');
			}

			// Ensure we have a canonical month id (appState may store a YYYY-MM label)
			const month_id = await resolveOrEnsureMonthId(appState.current_month_id);

			await setBudget(month_id, new_budget_group_name, new_budget_amount);

			// Refresh budgets list for the canonical month id
			budgets = await getBudgets(month_id);
			add_sheet_open = false;
			selected_budgets = [];
			updateHeaderMode();
		} catch (error) {
			console.error('[Budgets] Error adding budget:', error);
		} finally {
			is_loading = false;
		}
	}

	async function handleDeleteBudgets() {
		try {
			is_loading = true;

			// Ensure we have a canonical month id (appState may store a YYYY-MM label)
			const month_id = await resolveOrEnsureMonthId(appState.current_month_id);

			for (const budget_id of selected_budgets) {
				await deleteBudget(month_id, budget_id);
			}

			// Refresh budgets list for the canonical month id
			budgets = await getBudgets(month_id);
			delete_panel_open = false;
			selected_budgets = [];
			updateHeaderMode();
		} catch (e) {
			console.error('Error deleting budgets:', e);
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
		<div in:fade={{ duration: 300 }} class="space-y-4">
			{#each budgets as budget}
				<CardBudget
					title={budget.groupName}
					used={250}
					total={budget.amount}
					currency="R"
					position="prefix"
					thresholds={{ warning: 75, danger: 90 }}
					onclick={() => openEditSheet(budget)}
				/>
			{/each}
		</div>
	{/if}
</div>

<Sheet
	bind:sheet_open={edit_sheet_open}
	onsubmit={(e) => {
		e.preventDefault();
		handleUpdateBudget();
	}}
>
	<h1 class="text-center text-xl leading-none font-medium">Edit Budget</h1>
	<div class="space-y-1">
		<InputLabel text="Budget Name" for="budget-name" />
		<InputText
			id="budget-name"
			name="budget-name"
			placeholder="Enter budget name"
			bind:value={budget_group_name}
			focus_on_load={true}
		/>
	</div>

	<div class="space-y-1">
		<InputLabel text="Max Amount" for="budget-amount" />
		<InputText
			id="budget-amount"
			name="budget-amount"
			type="number"
			placeholder="Enter max amount"
			bind:value={budget_amount}
		/>
	</div>
</Sheet>

<Sheet
	bind:sheet_open={add_sheet_open}
	onsubmit={(/** @type {SubmitEvent} */ e) => {
		console.log('[Budgets] Sheet onsubmit', {
			name: new_budget_group_name,
			amount: new_budget_amount
		});
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
