<script>
	import CardTransaction from '$comps/groups/cards/CardTransaction.svelte';
	import { appState } from '$lib/appState.svelte';
	import {
		addTransaction,
		getTransactions,
		updateTransaction,
		deleteTransaction,
		getBudgets,
		getMembers
	} from '$lib/db';
	import { navigation } from '$lib/navigation.svelte';
	import { createValidator, required } from '$utils';
	import { onMount, untrack } from 'svelte';
	import { fade } from 'svelte/transition';
	import Sheet from '$comps/elements/Sheet.svelte';
	import InputLabel from '$comps/elements/inputs/descriptors/InputLabel.svelte';
	import InputValidation from '$comps/elements/inputs/descriptors/InputValidation.svelte';
	import InputText from '$comps/elements/inputs/InputText.svelte';
	import Modal from '$comps/groups/Modal.svelte';
	import ButtonRound from '$comps/elements/buttons/ButtonRound.svelte';
	import Button from '$comps/elements/buttons/Button.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import InputOptions from '$comps/elements/inputs/InputOptions.svelte';
	import InputSelect from '$comps/elements/inputs/InputSelect.svelte';
	import InputDate from '$comps/elements/inputs/InputDate.svelte';
	import MemberSelect from '$comps/elements/members/MemberSelect.svelte';
	import InputAmount from '$comps/elements/inputs/InputAmount.svelte';

	const type_options = [
		{ value: 'expense', label: 'Expense', icon: 'trending-down' },
		{ value: 'income', label: 'Income', icon: 'trending-up' }
	];

	const expense_category_options = [
		{ value: 'variable', label: 'Variable', icon: 'arrows-up-down' },
		{ value: 'incidental', label: 'Incidental', icon: 'exclamation-triangle' },
		{ value: 'fixed', label: 'Fixed', icon: 'lock' }
	];

	const income_category_options = [
		{ value: 'salary', label: 'Salary', icon: 'wallet' },
		{ value: 'one_time', label: 'Once-off', icon: 'money' },
		{ value: 'interest', label: 'Interest', icon: 'percent' }
	];

	// Filter options
	const type_filter_options = [
		{ value: '', label: 'All' },
		{ value: 'expense', label: 'Expense' },
		{ value: 'income', label: 'Income' }
	];

	const all_category_filter_options = [
		{ value: '', label: 'All' },
		{ value: 'variable', label: 'Variable' },
		{ value: 'incidental', label: 'Incidental' },
		{ value: 'fixed', label: 'Fixed' },
		{ value: 'salary', label: 'Salary' },
		{ value: 'one_time', label: 'Once-off' },
		{ value: 'interest', label: 'Interest' }
	];

	const expense_category_filter_options = [
		{ value: '', label: 'All' },
		{ value: 'variable', label: 'Variable' },
		{ value: 'incidental', label: 'Incidental' },
		{ value: 'fixed', label: 'Fixed' }
	];

	const income_category_filter_options = [
		{ value: '', label: 'All' },
		{ value: 'salary', label: 'Salary' },
		{ value: 'one_time', label: 'Once-off' },
		{ value: 'interest', label: 'Interest' }
	];

	let transactions = $state(/** @type {any[]} */ ([]));
	let edit_sheet_open = $state(false);
	let add_sheet_open = $state(false);
	let delete_panel_open = $state(false);
	let selected_transactions = $state(/** @type {any[]}*/ ([]));
	let selected_transaction = $state(/** @type {any} */ (null));
	let is_loading = $state(false);

	// Filter state
	let filter_type = $state(/** @type {'' | 'expense' | 'income'} */ (''));
	let filter_category = $state(
		/** @type {'' | 'variable' | 'incidental' | 'fixed' | 'one_time' | 'salary' | 'interest'} */ (
			''
		)
	);

	// Derived category filter options based on selected type
	const category_filter_options = $derived(
		filter_type === 'expense'
			? expense_category_filter_options
			: filter_type === 'income'
				? income_category_filter_options
				: all_category_filter_options
	);

	// Filtered transactions based on selected filters
	const filtered_transactions = $derived(
		transactions.filter((t) => {
			const type_match = !filter_type || t.type === filter_type;
			const category_match = !filter_category || t.category === filter_category;
			return type_match && category_match;
		})
	);

	// Edit form fields
	let transaction_name = $state('');
	/** @type {'expense' | 'income'} */
	let transaction_type = $state(/** @type {'expense' | 'income'} */ ('expense'));
	let transaction_category = $state(
		/** @type {'variable' | 'incidental' | 'fixed' | 'one_time' | 'salary' | 'interest' } */ (
			'variable'
		)
	);
	let transaction_budget_group = $state('');
	let transaction_who = $state('');
	let transaction_when = $state('');
	let transaction_amount = $state(0);
	let transaction_created_by = $state('');

	// Add form fields
	let new_transaction_name = $state('');
	/** @type {'expense' | 'income'} */
	let new_transaction_type = $state(/** @type {'expense' | 'income'} */ ('expense'));
	let new_transaction_category = $state(
		/** @type {'variable' | 'incidental' | 'fixed' | 'one_time' | 'salary' | 'interest'} */ (
			'variable'
		)
	);
	let new_transaction_budget_group = $state('');
	let new_transaction_who = $state('');
	let new_transaction_when = $state('');
	let new_transaction_amount = $state(0);
	let new_transaction_created_by = $state('');

	let budgets = $state(/** @type {any[]} */ ([]));
	let members = $state(/** @type {any[]} */ ([]));

	// Add form validation
	const { errors, validate, setError, clearError } = createValidator({
		name: [required('Transaction name is required.')],
		amount: [required('Amount is required.')],
		when: [required('Date is required.')],
		who: [required('Member is required.')],
		budget: [] // Manual validation, but needs to be in errors object
	});

	/** @type {string | null} */
	const current_month_id = $derived(appState.current_month_id);
	/** @type {string | null} */
	const current_household_id = $derived(appState.current_household_id);

	onMount(async () => {
		updateHeaderMode();
	});

	// Reload transactions and budgets when month changes
	$effect(() => {
		current_month_id;

		untrack(async () => {
			if (current_month_id) {
				transactions = await getTransactions(current_month_id);
				const budgetResults = await getBudgets(current_month_id);
				budgets = budgetResults.map((b) => ({
					...b,
					label: b.groupName,
					value: b.id
				}));
			}
		});
	});

	// Reload members when household changes
	$effect(() => {
		current_household_id;

		untrack(async () => {
			if (current_household_id) {
				const result = await getMembers(current_household_id);
				members = result.map((m) => ({
					...m,
					label: m.name,
					value: m.userId
				}));
			}
		});
	});

	$effect(() => {
		new_transaction_type;

		untrack(() => {
			// Reset category when type changes
			if (new_transaction_type === 'expense') {
				new_transaction_category = 'variable';
			} else if (new_transaction_type === 'income') {
				new_transaction_category = 'salary';
			}
			// Clear budget error and value when type changes
			clearError('budget');
			new_transaction_budget_group = '';
		});
	});

	// Clear budget error when category changes away from variable
	$effect(() => {
		if (new_transaction_category !== 'variable') {
			clearError('budget');
			new_transaction_budget_group = '';
		}
	});

	// Reset category filter when type filter changes to avoid invalid combinations
	$effect(() => {
		filter_type;
		// Reset category filter when type changes
		filter_category = '';
	});

	// Clear validation errors when values change
	$effect(() => {
		if (new_transaction_who) clearError('who');
	});

	$effect(() => {
		if (new_transaction_when) clearError('when');
	});

	$effect(() => {
		if (new_transaction_amount) clearError('amount');
	});

	$effect(() => {
		if (new_transaction_budget_group) clearError('budget');
	});

	function updateHeaderMode() {
		if (selected_transactions.length > 0) {
			navigation.setHeaderMode('delete', () => {
				delete_panel_open = true;
			});
		} else {
			navigation.setHeaderMode('add', openAddSheet);
		}
	}

	/**
	 * @param {any} transaction
	 */
	function openEditSheet(transaction) {
		selected_transaction = transaction;
		transaction_name = transaction.name;
		transaction_type = transaction.type;
		transaction_category = transaction.category;
		transaction_budget_group = transaction.budgetGroup || '';
		transaction_who = transaction.userId;
		// Convert timestamp to YYYY-MM-DD string for date input
		transaction_when = new Date(transaction.date).toISOString().split('T')[0];
		transaction_amount = transaction.amount;
		transaction_created_by = transaction.createdBy || appState.current_user_id || '';
		edit_sheet_open = true;
	}

	function openAddSheet() {
		// Reset form fields
		new_transaction_name = '';
		new_transaction_type = 'expense';
		new_transaction_category = 'variable';
		new_transaction_budget_group = '';
		new_transaction_who = '';
		// Default the date to today's date (local) in YYYY-MM-DD format
		const _today = new Date();
		const _yyyy = _today.getFullYear();
		const _mm = String(_today.getMonth() + 1).padStart(2, '0');
		const _dd = String(_today.getDate()).padStart(2, '0');
		new_transaction_when = `${_yyyy}-${_mm}-${_dd}`;
		new_transaction_amount = 0;
		new_transaction_created_by = appState.current_user_id || '';

		// open sheet
		add_sheet_open = true;
	}

	/**
	 * @param {any} transaction
	 */
	function handleCardClick(transaction) {
		if (selected_transactions.length > 0) {
			// In selection mode, toggle selection
			handleLongPress(transaction.id);
		} else {
			// Normal mode, open edit sheet
			openEditSheet(transaction);
		}
	}

	/**
	 * @param {string} id
	 */
	function handleLongPress(id) {
		// Toggle selection
		if (selected_transactions.includes(id)) {
			selected_transactions = selected_transactions.filter((t_id) => t_id !== id);
		} else {
			selected_transactions = [...selected_transactions, id];
		}
		updateHeaderMode();
	}

	async function handleDeleteTransactions() {
		if (!current_month_id) return;

		try {
			is_loading = true;

			for (const transaction_id of selected_transactions) {
				await deleteTransaction(transaction_id);
			}

			transactions = await getTransactions(current_month_id);
			delete_panel_open = false;
			selected_transactions = [];
			updateHeaderMode();
		} catch (e) {
			console.error('Error deleting transactions:', e);
		} finally {
			is_loading = false;
		}
	}

	async function handleUpdateTransaction() {
		if (!selected_transaction || !current_month_id) return;

		// Check if budget is required for this transaction
		const budget_required = transaction_type === 'expense' && transaction_category === 'variable';

		// Budget validation
		if (budget_required && !transaction_budget_group) {
			const budget_msg =
				budgets.length === 0
					? 'No budgets yet — add one in Budgets (required for variable expenses).'
					: 'Budget is required for variable expenses.';
			setError('budget', budget_msg);
			return;
		}

		try {
			is_loading = true;

			await updateTransaction(selected_transaction.id, {
				name: transaction_name,
				type: transaction_type,
				category: transaction_category,
				budgetGroup: transaction_budget_group || null,
				userId: transaction_who,
				date: new Date(transaction_when).getTime(),
				amount: transaction_amount
			});

			transactions = await getTransactions(current_month_id);
			edit_sheet_open = false;
			selected_transactions = [];
			updateHeaderMode();
		} catch (e) {
			appState.setError(e);
		} finally {
			is_loading = false;
		}
	}

	async function handleAddTransaction() {
		// Check if budget is required
		const budget_required =
			new_transaction_type === 'expense' && new_transaction_category === 'variable';

		// Validate all fields
		const is_valid = validate({
			name: new_transaction_name,
			amount: new_transaction_amount,
			when: new_transaction_when,
			who: new_transaction_who
		});

		// Budget validation (manual, shown alongside other errors)
		if (budget_required && !new_transaction_budget_group) {
			const budget_msg =
				budgets.length === 0
					? 'No budgets yet — add one in Budgets (required for variable expenses).'
					: 'Budget is required for variable expenses.';
			setError('budget', budget_msg);
		}

		// Return if any validation failed
		if (!is_valid || (budget_required && !new_transaction_budget_group)) {
			return;
		}

		if (!current_month_id) return;

		try {
			is_loading = true;

			await addTransaction(
				current_month_id,
				new_transaction_type,
				new_transaction_who,
				new_transaction_name,
				new_transaction_amount,
				new_transaction_category,
				new_transaction_budget_group || null,
				new Date(new_transaction_when).getTime(),
				new_transaction_created_by
			);

			transactions = await getTransactions(current_month_id);
			add_sheet_open = false;
			selected_transactions = [];
			updateHeaderMode();
		} catch (e) {
			appState.setError(e);
		} finally {
			is_loading = false;
		}
	}
</script>

<div class="space-y-4">
	<h1 class="text-center text-xl leading-none font-medium">Transactions</h1>

	{#if transactions.length === 0}
		<p class="text-center text-sm">No transactions for this month.</p>
	{:else}
		<div class="flex gap-4">
			<div class="flex-1 space-y-1">
				<!-- Type filter (income or expense) -->
				<InputLabel text="Type" for="type-filter" />
				<InputSelect
					id="type-filter"
					name="type-filter"
					placeholder="All"
					options={type_filter_options}
					bind:value={filter_type}
				/>
			</div>
			<div class="flex-1 space-y-1">
				<!-- Category filter (salary or one-time if income and variable fixed or incidental if expense) -->
				<InputLabel text="Category" for="category-filter" />
				<InputSelect
					id="category-filter"
					name="category-filter"
					placeholder="All"
					options={category_filter_options}
					bind:value={filter_category}
				/>
			</div>
		</div>

		{#if filtered_transactions.length === 0}
			<p class="text-center text-sm">No transactions match the selected filters.</p>
		{:else}
			<div in:fade={{ duration: 300 }} class="space-y-4">
				{#each filtered_transactions as transaction}
					{@const member = members.find((m) => m.userId === transaction.userId)}
					<CardTransaction
						title={transaction.name}
						amount={{ currency: 'R', position: 'prefix', value: transaction.amount }}
						date={new Date(transaction.date).toISOString()}
						category={transaction.category}
						type={transaction.type}
						member={{ name: member?.name ?? transaction.userId, color: member?.color ?? 'blue' }}
						is_selected={selected_transactions.includes(transaction.id)}
						on_long_press={() => handleLongPress(transaction.id)}
						onclick={() => handleCardClick(transaction)}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<Sheet
	bind:sheet_open={edit_sheet_open}
	onsubmit={(/** @type {SubmitEvent} */ e) => {
		e.preventDefault();
		handleUpdateTransaction();
	}}
>
	<h1 class="text-center text-xl leading-none font-medium">Edit Transaction</h1>
	<div class="space-y-1">
		<InputLabel text="Transaction Name" for="transaction-name" invalid={!!errors.name} />
		<InputText
			id="transaction-name"
			name="transaction-name"
			placeholder="Enter transaction name"
			invalid={!!errors.name}
			bind:value={transaction_name}
		/>
		{#if errors.name}
			<InputValidation text={errors.name} invalid={true} />
		{/if}
	</div>

	<!-- Type Options -->
	<div class="space-y-1">
		<InputLabel text="Type" />
		<InputOptions
			name="transaction-type-options"
			options={type_options}
			bind:value={transaction_type}
		/>
	</div>

	{#if transaction_type === 'expense'}
		<!-- Expense Category Options -->
		<div class="space-y-1" in:fade={{ duration: 200 }}>
			<InputLabel text="Category" />
			<InputOptions
				name="transaction-expense-category-options"
				options={expense_category_options}
				bind:value={transaction_category}
			/>
		</div>
	{:else if transaction_type === 'income'}
		<!-- Income Category Options -->
		<div class="space-y-1" in:fade={{ duration: 200 }}>
			<InputLabel text="Category" />
			<InputOptions
				name="transaction-income-category-options"
				options={income_category_options}
				bind:value={transaction_category}
			/>
		</div>
	{/if}

	<!-- Budget -->
	{#if transaction_type === 'expense' && transaction_category === 'variable'}
		<div class="space-y-1">
			<InputLabel for="transaction-budget-group" text="Budget" invalid={!!errors.budget} />
			<InputSelect
				id="transaction-budget-group"
				name="transaction-budget-group"
				placeholder="Select a budget group"
				options={budgets}
				bind:value={transaction_budget_group}
				absolute={false}
				invalid={!!errors.budget}
			/>
			{#if errors.budget}
				<InputValidation text={errors.budget} invalid={true} />
			{/if}
		</div>
	{/if}

	<!-- Who -->
	<div class="flex-1 space-y-1">
		<InputLabel text="Who" for="transaction-who" invalid={!!errors.who} />
		<MemberSelect
			id="transaction-who"
			name="transaction-who"
			placeholder="Select member"
			invalid={!!errors.who}
			options={members}
			bind:selected_option={transaction_who}
		/>
		{#if errors.who}
			<InputValidation text={errors.who} invalid={true} />
		{/if}
	</div>

	<!-- When -->
	<div class="flex-1 space-y-1">
		<InputLabel text="When" for="transaction-when" invalid={!!errors.when} />
		<InputDate
			id="transaction-when"
			name="transaction-when"
			bind:value={transaction_when}
			placeholder="Select a date"
			invalid={!!errors.when}
			onchange={() => clearError('when')}
		/>
		{#if errors.when}
			<InputValidation text={errors.when} invalid={true} />
		{/if}
	</div>

	<!-- Amount -->
	<div class="space-y-1">
		<InputLabel text="Amount" for="transaction-amount" invalid={!!errors.amount} />
		<InputAmount
			type="number"
			placeholder="Enter amount"
			currency="R"
			position="prefix"
			bind:value={transaction_amount}
			invalid={!!errors.amount}
			oninput={() => clearError('amount')}
		/>
		{#if errors.amount}
			<InputValidation text={errors.amount} invalid={true} />
		{/if}
	</div>
</Sheet>

<Sheet
	bind:sheet_open={add_sheet_open}
	onsubmit={(/** @type {SubmitEvent} */ e) => {
		e.preventDefault();
		handleAddTransaction();
	}}
>
	<h1 class="text-center text-xl leading-none font-medium">Add Transaction</h1>

	<div class="space-y-1">
		<InputLabel text="Transaction Name" for="new-transaction-name" invalid={!!errors.name} />
		<InputText
			id="new-transaction-name"
			name="new-transaction-name"
			placeholder="Enter transaction name"
			bind:value={new_transaction_name}
			focus_on_load={true}
			invalid={!!errors.name}
			oninput={() => clearError('name')}
		/>
		{#if errors.name}
			<InputValidation text={errors.name} invalid={true} />
		{/if}
	</div>

	<!-- Type Options -->
	<div class="space-y-1">
		<InputLabel text="Type" />
		<InputOptions
			name="new-transaction-type-options"
			options={type_options}
			bind:value={new_transaction_type}
		/>
	</div>

	{#if new_transaction_type === 'expense'}
		<!-- Expense Category Options -->
		<div class="space-y-1" in:fade={{ duration: 200 }}>
			<InputLabel text="Category" />
			<InputOptions
				name="new-transaction-expense-category-options"
				options={expense_category_options}
				bind:value={new_transaction_category}
			/>
		</div>
	{:else if new_transaction_type === 'income'}
		<!-- Income Category Options -->
		<div class="space-y-1" in:fade={{ duration: 200 }}>
			<InputLabel text="Category" />
			<InputOptions
				name="new-transaction-income-category-options"
				options={income_category_options}
				bind:value={new_transaction_category}
			/>
		</div>
	{/if}

	<!-- Budget -->
	{#if new_transaction_type === 'expense' && new_transaction_category === 'variable'}
		<div class="space-y-1">
			<InputLabel for="new-transaction-budget-group" text="Budget" invalid={!!errors.budget} />
			<InputSelect
				id="new-transaction-budget-group"
				name="new-transaction-budget-group"
				placeholder="Select a budget group"
				options={budgets}
				bind:value={new_transaction_budget_group}
				absolute={false}
				invalid={!!errors.budget}
			/>
			{#if errors.budget}
				<InputValidation text={errors.budget} invalid={true} />
			{/if}
		</div>
	{/if}

	<!-- Who -->
	<div class="flex-1 space-y-1">
		<InputLabel text="Who" for="new-transaction-who" invalid={!!errors.who} />
		<MemberSelect
			id="new-transaction-who"
			name="new-transaction-who"
			placeholder="Select member"
			invalid={!!errors.who}
			options={members}
			bind:selected_option={new_transaction_who}
		/>
		{#if errors.who}
			<InputValidation text={errors.who} invalid={true} />
		{/if}
	</div>

	<!-- When -->
	<div class="flex-1 space-y-1">
		<InputLabel text="When" for="new-transaction-when" invalid={!!errors.when} />
		<InputDate
			id="new-transaction-when"
			name="new-transaction-when"
			bind:value={new_transaction_when}
			placeholder="Select a date"
			invalid={!!errors.when}
			onchange={() => clearError('when')}
		/>
		{#if errors.when}
			<InputValidation text={errors.when} invalid={true} />
		{/if}
	</div>

	<!-- Amount -->
	<div class="space-y-1">
		<InputLabel text="Amount" for="new-transaction-amount" invalid={!!errors.amount} />
		<InputAmount
			type="number"
			placeholder="Enter amount"
			currency="R"
			position="prefix"
			bind:value={new_transaction_amount}
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
			Delete transaction{selected_transactions.length === 1 ? '' : 's'}?
		</h2>
		<p>
			Are you sure you want to delete the selected transaction{selected_transactions.length === 1
				? ''
				: 's'}? This action cannot be undone.
		</p>
		<div class="flex justify-between gap-2">
			<ButtonRound color="secondary" onclick={() => (delete_panel_open = false)}>
				<Icon name="xmark" class="size-5" />
			</ButtonRound>
			<Button color="danger" onclick={handleDeleteTransactions}>
				<Icon name="trash" class="size-5" />
				Delete
			</Button>
		</div>
	</div>
</Modal>
