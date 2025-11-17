<script>
	import ButtonRound from '$comps/elements/buttons/ButtonRound.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import {
		getPreviousMonthId,
		getNextMonthId,
		getCurrentMonthId,
		isSameMonth,
		formatMonthDisplay
	} from '$lib/utils';
	import { fade } from 'svelte/transition';

	/**
	 * @typedef {Object} Props
	 * @property {string} current_month - The currently selected month ID in YYYY-MM format (e.g., "2025-10")
	 * @property {boolean} [can_create] - Whether a new month can be created (based on budget cycle day)
	 */

	/** @type {Props} */
	let { current_month = $bindable(), can_create = false } = $props();

	/**
	 * Navigate to the previous month
	 */
	function goToPreviousMonth() {
		current_month = getPreviousMonthId(current_month);
	}

	/**
	 * Navigate to the next month
	 */
	function goToNextMonth() {
		current_month = getNextMonthId(current_month);
	}

	/**
	 * Check if currently viewing the actual current month
	 */
	const is_current_month = $derived(isSameMonth(current_month, getCurrentMonthId()));

	/**
	 * Determine if the plus button should be visible
	 */
	const show_plus_button = $derived(is_current_month && can_create);

	/**
	 * Determine if the next button should be visible
	 * Show when we're viewing a past month (not the current month)
	 */
	const show_next_button = $derived(!is_current_month);

	/**
	 * Format the current month for display (e.g., "October 2025")
	 */
	const display_month = $derived(formatMonthDisplay(current_month));
</script>

<div class="flex items-center gap-2 border-b border-b-grey-800 px-4 py-2">
	<ButtonRound color="secondary" size="large" onclick={goToPreviousMonth}>
		<Icon name="arrow-left" class="size-5" />
	</ButtonRound>
	<div class="w-full rounded-lg px-3 py-1.5 text-center ring ring-grey-400">
		{display_month}
	</div>
	<ButtonRound
		color={show_next_button ? 'secondary' : 'primary'}
		size="large"
		onclick={() => {
			if (show_next_button) goToNextMonth();
		}}
	>
		{#if show_next_button}
			<Icon name="arrow-right" class="size-5" />
		{:else if show_plus_button}
			<Icon name="plus" class="size-5" />
		{/if}
	</ButtonRound>
</div>
