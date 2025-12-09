<script>
	import Badge from '$comps/elements/badges/Badge.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import MemberColor from '$comps/elements/members/MemberColor.svelte';
	import { formatRelativeDate } from '$lib/utils/helpers';
	import { Haptics, ImpactStyle } from '@capacitor/haptics';

	/**
	 * @typedef {Object} Member
	 * @property {string} name - Member's name
	 * @property {string} color
	 */

	/**
	 * @typedef {Object} Amount
	 * @property {string} currency - Currency symbol (e.g., 'R')
	 * @property {'prefix' | 'suffix'} position - Position of the currency symbol
	 * @property {number} value - Amount value
	 */

	/**
	 * @typedef {Object} Props
	 * @property {string} title - Transaction title
	 * @property {Amount} amount - Transaction amount
	 * @property {string} date - Transaction date
	 * @property {'variable' | 'fixed' | 'incidental' | 'one-time' | 'salary'} category - Transaction category
	 * @property {'income' | 'expense'} type - Transaction type
	 * @property {Member} member - Transaction member
	 * @property {boolean} [is_selected] - Whether the card is selected
	 * @property {number} [long_press_duration] - Duration in ms for long press (default 500)
	 * @property {(() => void) | null} [on_long_press] - Callback for long press
	 * @property {any} [onclick] - Optional click handler
	 */

	/** @type {Props} */
	let {
		title = '',
		amount = { currency: 'R', position: 'prefix', value: 0 },
		date = '',
		category = 'variable',
		type = 'expense',
		member = { name: '', color: 'green' },
		is_selected = false,
		long_press_duration = 500,
		on_long_press = null,
		...rest
	} = $props();

	const CATEGORY_ICONS = {
		variable: 'arrows-up-down',
		fixed: 'lock-closed',
		incidental: 'exclamation-triangle',
		'one-time': 'calendar-days',
		salary: 'money'
	};

	const formatted_date = $derived(formatRelativeDate(date));

	let press_timer = $state(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

	function handlePointerDown() {
		if (!on_long_press) return;

		press_timer = setTimeout(async () => {
			// Trigger haptic feedback
			try {
				await Haptics.impact({ style: ImpactStyle.Light });
			} catch (e) {
				console.log('Haptics not available:', e);
			}

			// Call long press handler
			on_long_press?.();
		}, long_press_duration);
	}

	function handlePointerUp() {
		if (press_timer) {
			clearTimeout(press_timer);
			press_timer = null;
		}
	}

	function handleClick() {
		// Clear any pending long press
		if (press_timer) {
			clearTimeout(press_timer);
			press_timer = null;
		}

		// Call regular click handler
		rest.onclick?.();
	}
</script>

<button
	class="w-full appearance-none rounded-lg border border-grey-900 bg-grey-800 p-2.5 outline-0 transition-all duration-300 active:border-grey-800 active:bg-grey-700 {is_selected
		? 'border-primary-800 bg-secondary-700! ring-2 ring-primary-700'
		: 'border-grey-900 active:border-grey-800'}"
	onclick={handleClick}
	onpointerdown={handlePointerDown}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
	onpointerleave={handlePointerUp}
>
	<article class="flex flex-col gap-2">
		<div class="flex justify-between gap-2">
			<span class="line-clamp-1 text-lg leading-none">{title}</span>
			<Badge>
				<Icon name={CATEGORY_ICONS[category]} class="size-4" />
				<span class="leading-none capitalize">{category}</span>
			</Badge>
		</div>
		<div class="flex items-end justify-between gap-2">
			<div class="flex items-center gap-2">
				<MemberColor color={member.color} class="size-9" />
				<div class="flex flex-col items-start">
					<span class="leading-none font-medium">{member.name}</span>
					<span class="text-xs text-grey-300">{formatted_date}</span>
				</div>
			</div>
			<span
				class="text-lg leading-none font-semibold {type === 'income'
					? 'text-green-400'
					: 'text-danger-400'}"
			>
				{#if amount.position === 'prefix'}
					{type === 'income'
						? `+${amount.currency} ${amount.value}`
						: `-${amount.currency} ${amount.value}`}
				{:else}
					{type === 'income'
						? `+${amount.value} ${amount.currency}`
						: `-${amount.value} ${amount.currency}`}
				{/if}
			</span>
		</div>
	</article>
</button>
