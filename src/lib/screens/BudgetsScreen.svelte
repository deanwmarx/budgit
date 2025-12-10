<script>
	import { appState } from '$lib/appState.svelte';
	import { getBudgetsWithUsage, addBudget, updateBudget, deleteBudget } from '$lib/db';
	import { navigation } from '$lib/navigation.svelte';
	import { onMount, untrack } from 'svelte';
	import CardBudget from '$comps/groups/cards/CardBudget.svelte';
	import Sheet from '$comps/elements/Sheet.svelte';
	import InputLabel from '$comps/elements/inputs/descriptors/InputLabel.svelte';
	import InputValidation from '$comps/elements/inputs/descriptors/InputValidation.svelte';
	import InputText from '$comps/elements/inputs/InputText.svelte';
	import { formatRelativeDate } from '$lib/utils/helpers';
	import { createValidator, required } from '$lib/utils/validation.svelte';
	import { fade } from 'svelte/transition';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import Modal from '$comps/groups/Modal.svelte';
	import ButtonRound from '$comps/elements/buttons/ButtonRound.svelte';
	import Button from '$comps/elements/buttons/Button.svelte';
	import InputAmount from '$comps/elements/inputs/InputAmount.svelte';

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

	// Add form validation
	const { errors, validate, setError, clearError } = createValidator({
		name: [required('Budget name is required.')],
		amount: [required('Amount is required.')]
	});

	const current_month_id = $derived(appState.current_month_id);
	const household_budget_warning_threshold = $derived(
		appState.household_budget_warning_threshold || 75
	);
	const household_budget_danger_threshold = $derived(
		appState.household_budget_danger_threshold || 90
	);

	onMount(async () => {
		if (current_month_id) {
			budgets = await getBudgetsWithUsage(current_month_id);
		}
		updateHeaderMode();
	});

	$effect(() => {
		current_month_id;

		untrack(async () => {
			if (current_month_id) {
				budgets = await getBudgetsWithUsage(current_month_id);
			}
		});
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

	/**
	 * @param {any} budget
	 */
	function handleCardClick(budget) {
		if (selected_budgets.length > 0) {
			// In selection mode, toggle selection
			handleLongPress(budget.id);
		} else {
			// Normal mode, open edit sheet
			openEditSheet(budget);
		}
	}

	async function handleUpdateBudget() {
		if (!selected_budget || !current_month_id) return;

		try {
			is_loading = true;

			await updateBudget(selected_budget.id, budget_amount);

			budgets = await getBudgetsWithUsage(current_month_id);
			edit_sheet_open = false;
			selected_budgets = [];
			updateHeaderMode();
		} catch (e) {
			console.error('Error updating budget:', e);
		} finally {
			is_loading = false;
		}
	}

	async function handleAddBudget() {
		if (!validate({ name: new_budget_group_name, amount: new_budget_amount })) return;
		if (!current_month_id) return;

		try {
			is_loading = true;

			await addBudget(current_month_id, new_budget_group_name, new_budget_amount);

			budgets = await getBudgetsWithUsage(current_month_id);
			add_sheet_open = false;
			selected_budgets = [];
			updateHeaderMode();
		} catch (error) {
			// Check for unique constraint violation
			if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
				setError('name', 'A budget with this name already exists.');
			} else {
				// For unexpected errors, still show in the system error toast
				appState.setError(error);
			}
		} finally {
			is_loading = false;
		}
	}

	/**
	 * @param {string} id
	 */
	function handleLongPress(id) {
		// Toggle selection
		if (selected_budgets.includes(id)) {
			selected_budgets = selected_budgets.filter((budget_id) => budget_id !== id);
		} else {
			selected_budgets = [...selected_budgets, id];
		}
		updateHeaderMode();
	}

	async function handleDeleteBudgets() {
		if (!current_month_id) return;

		try {
			is_loading = true;

			for (const budget_id of selected_budgets) {
				await deleteBudget(current_month_id, budget_id);
			}

			budgets = await getBudgetsWithUsage(current_month_id);
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
		<p class="text-center text-sm">No budgets for this month.</p>
	{:else}
		<div in:fade={{ duration: 300 }} class="space-y-4">
			{#each budgets as budget}
				<CardBudget
					title={budget.groupName}
					used={budget.used}
					total={budget.amount}
					currency="R"
					position="prefix"
					thresholds={{
						warning: household_budget_warning_threshold,
						danger: household_budget_danger_threshold
					}}
					is_selected={selected_budgets.includes(budget.id)}
					on_long_press={() => handleLongPress(budget.id)}
					onclick={() => handleCardClick(budget)}
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
		/>
	</div>

	<div class="space-y-1">
		<InputLabel text="Max Amount" for="budget-amount" />
		<InputAmount
			type="number"
			id="budget-amount"
			name="budget-amount"
			placeholder="Enter max amount"
			currency="R"
			position="prefix"
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
		<InputLabel text="Budget Name" for="new-budget-name" invalid={!!errors.name} />
		<InputText
			id="new-budget-name"
			name="new-budget-name"
			placeholder="Enter budget name"
			bind:value={new_budget_group_name}
			focus_on_load={true}
			invalid={!!errors.name}
			oninput={() => clearError('name')}
		/>
		{#if errors.name}
			<InputValidation text={errors.name} invalid={true} />
		{/if}
	</div>

	<div class="space-y-1">
		<InputLabel text="Max Amount" for="new-budget-amount" invalid={!!errors.amount} />
		<InputAmount
			id="new-budget-amount"
			name="new-budget-amount"
			type="number"
			placeholder="Enter max amount"
			currency="R"
			position="prefix"
			bind:value={new_budget_amount}
			invalid={!!errors.amount}
			oninput={() => clearError('amount')}
		/>
		{#if errors.amount}
			<InputValidation text={errors.amount} invalid={true} />
		{/if}
	</div>
</Sheet>

<Modal bind:is_active={delete_panel_open}>
	<div class="space-y-4">
		<h2 class="text-center text-xl font-semibold">
			Delete budget{selected_budgets.length === 1 ? '' : 's'}?
		</h2>
		<p>
			Are you sure you want to delete the selected budget{selected_budgets.length === 1 ? '' : 's'}?
			This action cannot be undone.
		</p>
		<div class="flex justify-between gap-2">
			<ButtonRound color="secondary" onclick={() => (delete_panel_open = false)}>
				<Icon name="xmark" class="size-5" />
			</ButtonRound>
			<Button color="danger" onclick={handleDeleteBudgets}>
				<Icon name="trash" class="size-5" />
				Delete
			</Button>
		</div>
	</div>
</Modal>
