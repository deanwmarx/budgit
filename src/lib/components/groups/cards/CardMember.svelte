<script>
	import Badge from '$comps/elements/badges/Badge.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import MemberColor from '$comps/elements/members/MemberColor.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {string} color - Member's color (e.g., 'red', 'blue')
	 * @property {string} name - Member's name
	 * @property {'admin' | 'member'} role - Member's role
	 * @property {any} [onclick]
	 */

	/** @type {Props} */
	let { color = 'blue', name = '', role = 'member', ...rest } = $props();

	const ROLE_ICONS = {
		admin: 'shield-check',
		member: 'user'
	};
</script>

<button
	class="w-full appearance-none rounded-lg border border-grey-900 bg-grey-800 p-2.5 outline-0 transition-colors duration-300 active:border-grey-800 active:bg-grey-700"
	onclick={rest.onclick}
>
	<article class="flex justify-between gap-2">
		<div class="flex flex-col gap-2">
			<span class="line-clamp-1 text-lg leading-none">{name}</span>
			<Badge>
				<Icon name={ROLE_ICONS[role]} class="size-4" />
				<span class="leading-none capitalize">{role}</span>
			</Badge>
		</div>
		<MemberColor {color} class="size-[54px]" />
	</article>
</button>
