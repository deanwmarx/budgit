<script>
	import PrettyJSON from '$comps/elements/debugging/PrettyJSON.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import MetricAmount from '$comps/elements/metrics/MetricAmount.svelte';
	import MetricProgress from '$comps/elements/metrics/MetricProgress.svelte';
	import DashboardAccordion from '$comps/groups/DashboardAccordion.svelte';
	import Modal from '$comps/groups/Modal.svelte';
	import { appState } from '$lib/appState.svelte';
	import { getBudgetsWithUsage, getMonthExpenses, getMonthIncomes, getMonthSavings } from '$lib/db';
	import { formatCurrency } from '$utils';

	let is_loading = $state(false);
	let projected_savings_panel_open = $state(false);
	let actual_savings_panel_open = $state(false);
	let salary_income_panel_open = $state(false);
	let onceoff_income_panel_open = $state(false);
	let fixed_expenses_panel_open = $state(false);
	let variable_expenses_panel_open = $state(false);
	let incidental_expenses_panel_open = $state(false);

	// savings state
	let projected_savings = $state('R 0.00');
	let actual_savings = $state('R 0.00');

	// budgets state
	let budgets = $state(/** @type {any[]} */ ([]));

	// incomes state
	let salary_incomes = $state('');
	let onceoff_incomes = $state('');
	let total_incomes = $state('');

	// expenses state
	let fixed_expenses = $state('');
	let variable_expenses = $state('');
	let incidental_expenses = $state('');
	let total_expenses = $state('');

	/** @type {string | null} */
	const current_month_id = $derived(appState.current_month_id);

	$effect(() => {
		if (current_month_id) {
			getDashboardData(current_month_id);
		}
	});

	/** @param {string} month_id */
	async function getDashboardData(month_id) {
		try {
			is_loading = true;

			const [budgets_result, savings_result, incomes_result, expenses_result] = await Promise.all([
				getBudgetsWithUsage(month_id),
				getMonthSavings(month_id),
				getMonthIncomes(month_id),
				getMonthExpenses(month_id)
			]);

			budgets = budgets_result;

			if (savings_result) {
				projected_savings = formatCurrency(savings_result.projected, {
					currency: 'R',
					position: 'prefix'
				});
				actual_savings = formatCurrency(savings_result.actual, {
					currency: 'R',
					position: 'prefix'
				});
			}

			if (incomes_result) {
				salary_incomes = formatCurrency(incomes_result.salary, {
					currency: 'R',
					position: 'prefix'
				});
				onceoff_incomes = formatCurrency(incomes_result.oneTime, {
					currency: 'R',
					position: 'prefix'
				});
				total_incomes = formatCurrency(incomes_result.total, {
					currency: 'R',
					position: 'prefix'
				});
			}
			if (expenses_result) {
				fixed_expenses = formatCurrency(expenses_result.fixed, {
					currency: 'R',
					position: 'prefix'
				});
				variable_expenses = formatCurrency(expenses_result.variable, {
					currency: 'R',
					position: 'prefix'
				});
				incidental_expenses = formatCurrency(expenses_result.incidental, {
					currency: 'R',
					position: 'prefix'
				});
				total_expenses = formatCurrency(expenses_result.total, {
					currency: 'R',
					position: 'prefix'
				});
			}
		} catch (e) {
			console.error('Error fetching dashboard data:', e);
		} finally {
			is_loading = false;
		}
	}
</script>

<div class="space-y-4">
	<DashboardAccordion is_open={true} title="Savings">
		<div class="flex gap-4">
			<button
				class="flex-1 appearance-none outline-0"
				onclick={() => (projected_savings_panel_open = true)}
			>
				<MetricAmount amount={projected_savings} label="Projected" icon="pie-chart" />
			</button>
			<button
				class="flex-1 appearance-none outline-0"
				onclick={() => (actual_savings_panel_open = true)}
			>
				<MetricAmount amount={actual_savings} label="Actual" icon="piggy-bank" />
			</button>
		</div>
	</DashboardAccordion>

	<DashboardAccordion is_open={true} title="Budgets">
		<div class="flex flex-wrap justify-center gap-4">
			{#each budgets as budget}
				<MetricProgress
					percentage={Math.min(100, Math.round((budget.used / budget.amount) * 100))}
					label={budget.groupName}
					icon={budget.icon ?? null}
					class="w-[calc(33.33%-0.67rem)]"
				/>
			{/each}
		</div>
	</DashboardAccordion>

	<DashboardAccordion is_open={false} title={`Incomes ${total_incomes ? `- ${total_incomes}` : 'R 0'} total`}>
		<div class="flex gap-4">
			<button
				class="flex-1 appearance-none outline-0"
				onclick={() => (salary_income_panel_open = true)}
			>
				<MetricAmount amount={salary_incomes} label="Salary" icon="calendar-range" />
			</button>
			<button
				class="flex-1 appearance-none outline-0"
				onclick={() => (onceoff_income_panel_open = true)}
			>
				<MetricAmount amount={onceoff_incomes} label="Once-off" icon="money" />
			</button>
		</div>
	</DashboardAccordion>
	<DashboardAccordion is_open={false} title={`Expenses ${total_expenses ? `- ${total_expenses}` : 'R 0'} total`}>
		<div class="flex flex-wrap justify-center gap-4">
			<button
				class="w-[calc(50%-0.5rem)] appearance-none outline-0"
				onclick={() => (fixed_expenses_panel_open = true)}
			>
				<MetricAmount amount={fixed_expenses} label="Fixed" icon="lock" />
			</button>
			<button
				class="w-[calc(50%-0.5rem)] appearance-none outline-0"
				onclick={() => (variable_expenses_panel_open = true)}
			>
				<MetricAmount amount={variable_expenses} label="Variable" icon="arrows-up-down" />
			</button>
			<button
				class="w-[calc(50%-0.5rem)] appearance-none outline-0"
				onclick={() => (incidental_expenses_panel_open = true)}
			>
				<MetricAmount amount={incidental_expenses} label="Incidental" icon="exclamation-triangle" />
			</button>
		</div>
	</DashboardAccordion>
</div>

<Modal bind:is_active={projected_savings_panel_open}>
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<Icon name="info" class="size-6" />
			<h2 class="text-lg leading-none font-medium">Projected Savings</h2>
		</div>
		<p class="leading-5">
			Projected savings is what you can save (or more) if you stick to your budgeted amounts and
			have no incidental expenses.
		</p>
	</div>
</Modal>

<Modal bind:is_active={actual_savings_panel_open}>
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<Icon name="info" class="size-6" />
			<h2 class="text-lg leading-none font-medium">Actual Savings</h2>
		</div>
		<p class="leading-5">
			Actual savings is what you have saved based on your actual income and expenses to date.
		</p>
	</div>
</Modal>

<Modal bind:is_active={salary_income_panel_open}>
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<Icon name="info" class="size-6" />
			<h2 class="text-lg leading-none font-medium">Salary Income</h2>
		</div>
		<p class="leading-5">
			Salary income is the total amount you earn from your regular job or business before any
			deductions.
		</p>
	</div>
</Modal>

<Modal bind:is_active={onceoff_income_panel_open}>
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<Icon name="info" class="size-6" />
			<h2 class="text-lg leading-none font-medium">Once-off Income</h2>
		</div>
		<p class="leading-5">
			Once-off income includes any irregular or unexpected earnings, such as bonuses, gifts, or
			selling personal items.
		</p>
	</div>
</Modal>

<Modal bind:is_active={fixed_expenses_panel_open}>
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<Icon name="info" class="size-6" />
			<h2 class="text-lg leading-none font-medium">Fixed Expenses</h2>
		</div>
		<p class="leading-5">
			Fixed expenses are regular, recurring costs that do not change significantly over time, such
			as rent, mortgage, or subscriptions.
		</p>
	</div>
</Modal>

<Modal bind:is_active={variable_expenses_panel_open}>
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<Icon name="info" class="size-6" />
			<h2 class="text-lg leading-none font-medium">Variable Expenses</h2>
		</div>
		<p class="leading-5">
			Variable expenses fluctuate based on usage or consumption, such as groceries, utilities, and
			entertainment.
		</p>
	</div>
</Modal>

<Modal bind:is_active={incidental_expenses_panel_open}>
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<Icon name="info" class="size-6" />
			<h2 class="text-lg leading-none font-medium">Incidental Expenses</h2>
		</div>
		<p class="leading-5">
			Incidental expenses are unexpected or irregular costs that arise, such as medical bills, car
			repairs, or gifts.
		</p>
	</div>
</Modal>
