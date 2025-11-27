<script>
	import Badge from '$comps/elements/badges/Badge.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import MemberColor from '$comps/elements/members/MemberColor.svelte';
	import { Haptics, ImpactStyle } from '@capacitor/haptics';

	/**
	 * @typedef {Object} Props
	 * @property {string} color - Member's color (e.g., 'red', 'blue')
	 * @property {string} name - Member's name
	 * @property {'admin' | 'member'} role - Member's role
	 * @property {boolean} [is_selected] - Whether the card is selected
	 * @property {number} [long_press_duration] - Duration in ms for long press (default 500)
	 * @property {(() => void) | null} [on_long_press] - Callback for long press
	 * @property {any} [onclick]
	 */

	/** @type {Props} */
	let {
		color = 'blue',
		name = '',
		role = 'member',
		is_selected = false,
		long_press_duration = 500,
		on_long_press = null,
		...rest
	} = $props();

	const ROLE_ICONS = {
		admin: 'shield-check',
		member: 'user'
	};

	let press_timer = $state(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

	function handlePointerDown() {
		if (!on_long_press) return;

		press_timer = setTimeout(async () => {
			// Trigger haptic feedback
			try {
				await Haptics.impact({ style: ImpactStyle.Medium });
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
	class="w-full appearance-none rounded-lg border bg-grey-800 p-2.5 outline-0 transition-all duration-300 active:bg-grey-700 {is_selected
		? 'border-primary-800 bg-grey-700! ring-2 ring-primary-800'
		: 'border-grey-900 active:border-grey-800'}"
	onclick={handleClick}
	onpointerdown={handlePointerDown}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
	onpointerleave={handlePointerUp}
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
