<script>
	import { onMount, untrack } from 'svelte';
	import ButtonRound from '$comps/elements/buttons/ButtonRound.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import { appState } from '$lib/appState.svelte.js';
	import { getMonths, getMonthsBefore, createMonth } from '$lib/db';
	import {
		formatMonthDisplay,
		getCurrentBudgetMonthId,
		calculateMonthDates,
		canCreateNextMonth,
		getNextMonthId
	} from '$lib/utils';

	let { current_month = $bindable() } = $props();

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

	onMount(async () => {
		await loadMonths();
	});

	async function loadMonths() {
		if (!household) return;

		is_loading = true;

		let months = await getMonths(household.id, 12);

		if (months.length === 0) {
			// Auto-create the current month so it always exists in the database
			const current_budget_month_id = getCurrentBudgetMonthId(start_day);
			const { startDate, endDate } = calculateMonthDates(current_budget_month_id, start_day);

			const created = await createMonth(household.id, startDate, endDate);
			months = [created];
		}

		{
			// Month IDs are now stored as YYYY-MM in the database (per spec)
			// so we can use them directly
			existing_months = months.map((m) => ({
				id: m.id,
				startDate: m.startDate,
				endDate: m.endDate
			}));

			const latest = existing_months.reduce((latest, m) => (m.id > latest.id ? m : latest));
			current_month = latest.id;

			oldest_loaded_timestamp = months[months.length - 1].startDate;
			const older_check = await getMonthsBefore(household.id, oldest_loaded_timestamp, 1);
			has_more_older_months = older_check.length > 0;
		}

		is_loading = false;
	}

	async function loadOlderMonths() {
		if (!household || !oldest_loaded_timestamp) return;

		const older_months = await getMonthsBefore(household.id, oldest_loaded_timestamp, 12);

		if (older_months.length > 0) {
			// Month IDs are now stored as YYYY-MM in the database (per spec)
			const mapped = older_months.map((m) => ({
				id: m.id,
				startDate: m.startDate,
				endDate: m.endDate
			}));

			existing_months = [...existing_months, ...mapped].sort((a, b) => b.id.localeCompare(a.id));
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

		await createMonth(household.id, startDate, endDate);
		await loadMonths();

		current_month = next_month_id;
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
		onclick={show_next_button ? goToNextMonth : handleCreateNextMonth}
		disabled={((!show_next_button && !show_plus_button) || is_loading) || (show_plus_button && !can_create_next)}
	>
		{#if show_next_button}
			<Icon name="arrow-right" class="size-5" />
		{:else}
			<Icon name="calendar-plus" class="size-5" />
		{/if}
	</ButtonRound>
</div>
