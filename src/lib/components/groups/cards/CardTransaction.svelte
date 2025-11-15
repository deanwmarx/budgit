<script>
	import Badge from '$comps/elements/badges/Badge.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import MemberColor from '$comps/elements/members/MemberColor.svelte';
	import { formatRelativeDate } from '$lib/utils/helpers';

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
</script>

<button
	class="w-full appearance-none rounded-lg border border-grey-900 bg-grey-800 p-2.5 outline-0 transition-colors duration-300 active:border-grey-800 active:bg-grey-700"
	onclick={rest.onclick}
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
