<script>
	import { untrack } from 'svelte';
	import ButtonRound from '$comps/elements/buttons/ButtonRound.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import { appState } from '$lib/appState.svelte.js';
	import { getMonths, getMonthsBefore, createMonth } from '$lib/db';
	import {
		formatMonthDisplay,
		getCurrentBudgetMonthId,
		calculateMonthDates,
		canCreateNextMonth,
		getNextMonthId,
		compareMonths
	} from '$lib/utils';
	import Modal from './Modal.svelte';

	let { current_month = $bindable() } = $props();

	let show_create_month_modal = $state(false);
	let existing_months = $state([]);
	let is_loading = $state(true);
	let oldest_loaded_timestamp = $state(/** @type {number|null} */ (null));
	let has_more_older_months = $state(true);

	const household = $derived(appState.current_household);
	const start_day = $derived(household?.budgetCycleStartDay || 1);

	const latest_month = $derived(
		existing_months.length > 0
			? existing_months.reduce((latest, m) => (m.id > latest.id ? m : latest))
			: null
	);

	const can_create_next = $derived(
		latest_month ? canCreateNextMonth(latest_month.id, start_day) : false
	);

	const is_latest_month = $derived(latest_month && current_month === latest_month.id);

	// Is today on or after the household budget cycle start day?
	const is_on_or_after_start_day = $derived(new Date().getDate() >= start_day);
	// Show the "+" create button when either:
	//  - we have no months loaded (onboarding / first-run), or
	//  - the currently selected month is the latest and creation is allowed
	// Show the "+" create button when either there are no months at all,
	// or the currently selected month is the latest (i.e. no future months exist).
	// We still respect `can_create_next` by disabling the button when creation
	// is not allowed.
	const show_plus_button = $derived(
		existing_months.length === 0 ? is_on_or_after_start_day : is_latest_month && can_create_next
	);

	// Show the "next" navigation button only when there are months and the
	// selected month is not the latest one (i.e. there is a future month to go to).
	const show_next_button = $derived(existing_months.length > 0 && !is_latest_month);

	// Disable rules for the + button: when there are months, respect can_create_next;
	// when there are no months, use the start-day rule.
	const plus_disabled = $derived(
		existing_months.length === 0 ? !is_on_or_after_start_day : !can_create_next
	);
	const display_month = $derived(formatMonthDisplay(current_month));

	const current_index = $derived(existing_months.findIndex((m) => m.id === current_month));
	const is_at_oldest = $derived(current_index === existing_months.length - 1);
	const can_go_back = $derived(!is_at_oldest || has_more_older_months);

	// Track the last loaded household to detect changes
	let last_loaded_household_id = $state(/** @type {string|null} */ (null));

	// Load months when household changes (including initial load)
	$effect(() => {
		const current_household = household;
		const current_household_id = current_household?.id;
		
		console.log('[MonthSelector] Effect running:', { current_household_id, last_loaded_household_id });
		
		if (current_household_id && current_household_id !== last_loaded_household_id) {
			console.log('[MonthSelector] Loading months for household:', current_household_id);
			// Reset state for new household
			existing_months = [];
			oldest_loaded_timestamp = null;
			has_more_older_months = true;
			is_loading = true;
			
			// Update tracking variable (use untrack to avoid re-triggering)
			untrack(() => {
				last_loaded_household_id = current_household_id;
			});
			
			// Load months for the new household
			loadMonths();
		}
	});

	async function loadMonths() {
		if (!household) return;

		is_loading = true;

		try {
			let months = await getMonths(household.id, 12);

			if (months.length === 0) {
				// Auto-create the current month so it always exists in the database
				const current_budget_month_id = getCurrentBudgetMonthId(start_day);
				const { startDate, endDate } = calculateMonthDates(current_budget_month_id, start_day);

				const created = await createMonth(household.id, startDate, endDate);
				months = [created];
			}

			// Month IDs are stored as householdId-YYYY-MM in the database
			// Map them to the component's expected format
			existing_months = months.map((m) => ({
				id: m.id,
				startDate: m.startDate,
				endDate: m.endDate
			}));

			const latest = existing_months.reduce((latest, m) => (compareMonths(m.id, latest.id) > 0 ? m : latest));
			current_month = latest.id;

			oldest_loaded_timestamp = months[months.length - 1].startDate;
			const older_check = await getMonthsBefore(household.id, oldest_loaded_timestamp, 1);
			has_more_older_months = older_check.length > 0;
		} catch (error) {
			console.error('Failed to load months:', error);
		} finally {
			is_loading = false;
		}
	}

	async function loadOlderMonths() {
		if (!household || !oldest_loaded_timestamp) return;

		const older_months = await getMonthsBefore(household.id, oldest_loaded_timestamp, 12);

		if (older_months.length > 0) {
			// Month IDs are stored as householdId-YYYY-MM in the database
			const mapped = older_months.map((m) => ({
				id: m.id,
				startDate: m.startDate,
				endDate: m.endDate
			}));

			existing_months = [...existing_months, ...mapped].sort((a, b) => compareMonths(b.id, a.id));
			oldest_loaded_timestamp = older_months[older_months.length - 1].startDate;
			has_more_older_months = older_months.length === 12;
		} else {
			has_more_older_months = false;
		}
	}

	async function goToPreviousMonth() {
		const current_index = existing_months.findIndex((m) => m.id === current_month);

		// If at the oldest loaded month, try to load more
		if (current_index === existing_months.length - 1 && has_more_older_months) {
			await loadOlderMonths();
		}

		// Navigate to previous
		const new_index = existing_months.findIndex((m) => m.id === current_month);
		if (new_index < existing_months.length - 1) {
			current_month = existing_months[new_index + 1].id;
		}
	}

	function goToNextMonth() {
		const current_index = existing_months.findIndex((m) => m.id === current_month);
		if (current_index > 0) {
			current_month = existing_months[current_index - 1].id;
		}
	}

	async function handleCreateNextMonth() {
		if (!household || !latest_month) return;

		const next_month_id = getNextMonthId(latest_month.id);
		const { startDate, endDate } = calculateMonthDates(next_month_id, start_day);

		const created = await createMonth(household.id, startDate, endDate, latest_month.id);
		await loadMonths();

		// Use the created month's ID (which is the composite householdId-YYYY-MM)
		current_month = created.id;
	}
</script>

<div class="flex items-center gap-2 border-b border-b-grey-800 px-4 py-2">
	<ButtonRound
		color="secondary"
		size="large"
		onclick={goToPreviousMonth}
		disabled={!can_go_back || is_loading}
	>
		<Icon name="arrow-left" class="size-5" />
	</ButtonRound>
	<div class="w-full rounded-lg px-3 py-1.5 text-center ring ring-grey-400">
		{#if !is_loading}
			{display_month}
		{:else}
			<Icon name="spinner" class="size-4 animate-spin" />
		{/if}
	</div>
	<ButtonRound
		color={show_next_button ? 'secondary' : 'primary'}
		size="large"
		onclick={show_next_button ? goToNextMonth : () => (show_create_month_modal = true)}
		disabled={(!show_next_button && !show_plus_button) ||
			is_loading ||
			(show_plus_button && !can_create_next)}
	>
		{#if show_next_button}
			<Icon name="arrow-right" class="size-5" />
		{:else}
			<Icon name="calendar-plus" class="size-5" />
		{/if}
	</ButtonRound>
</div>

<Modal bind:is_active={show_create_month_modal}>
	<div class="space-y-4">
		<h2 class="text-center text-lg leading-none font-medium">Create Month</h2>
		<h1 class="text-center text-2xl leading-none font-medium">
			{formatMonthDisplay(getNextMonthId(latest_month.id))}
		</h1>

		<p>
			Your new month will be created and your fixed expenses and salaries will be copied over from
			the previous month.
		</p>

		<div class="flex justify-between gap-2">
			<ButtonRound color="secondary" size="large" onclick={() => (show_create_month_modal = false)}>
				<Icon name="xmark" class="size-5" />
			</ButtonRound>
			<ButtonRound
				color="primary"
				size="large"
				onclick={async () => {
					await handleCreateNextMonth();
					show_create_month_modal = false;
				}}
			>
				<Icon name="checkmark" class="size-5" />
			</ButtonRound>
		</div>
	</div>
</Modal>
