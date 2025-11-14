<script>
	import Icon from '$comps/elements/icons/Icon.svelte';
	import { fade, slide } from 'svelte/transition';
	import { quadInOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import MemberColor from '$comps/elements/members/MemberColor.svelte';

	/**
	 * @typedef {Object} Option
	 * @property {string} label
	 * @property {*} [value]
	 * @property {boolean} [is_selected]
	 * @property {string} [icon]
	 * @property {string} [color]
	 */

	/**
	 * @typedef {Object} Props
	 * @property {string} [name]
	 * @property {string} [placeholder]
	 * @property {*} [value]
	 * @property {boolean} [invalid=false]
	 * @property {boolean} [disabled=false]
	 * @property {Option[]} [options]
	 * @property {import("svelte").SvelteComponent | any} [optionSnippet]
	 * @property {string} [class]
	 */

	/** @type {Props & { [key: string]: any }} */
	let {
		value = $bindable(''),
		invalid = false,
		disabled = false,
		options = [],
		optionSnippet,
		focus_on_load = false,
		...rest
	} = $props();

	onMount(() => {
		if (focus_on_load) {
			handleOpen();
		}
	});

	let is_open = $state(false);
	let is_focused = $state(false);

	/** @type {number} */
	let highlighted_index = $state(-1);

	/** @type {HTMLButtonElement | null} */
	let button_element = $state(null);

	// Update formatted_options to reset highlighted_index when options change
	/** @type {() => Option[]} */
	const formatted_options = $derived(() => {
		if (!options) return [];

		// Force dependency on is_open to ensure recalculation when dropdown opens
		const _ = is_open;

		// Map options with selection state
		let filtered = options.map((o) => ({
			...o,
			is_selected: o.value === value
		}));

		return filtered;
	});

	/** @type {string} */
	const display_text = $derived(
		is_open
			? (rest.placeholder ?? '')
			: (formatted_options().find((o) => o.is_selected)?.label ?? rest.placeholder ?? '')
	);

	/** @type {string | undefined} */
	const selected_color = $derived(formatted_options().find((o) => o.is_selected)?.color);

	$effect(() => {
		const filtered = formatted_options();
		highlighted_index = filtered.length > 0 ? 0 : -1;
	});

	/** @param {KeyboardEvent & { currentTarget: HTMLElement }} e */
	function handleKeydown(e) {
		// If dropdown is closed and space is pressed, open it
		if (!is_open && e.key === ' ') {
			e.preventDefault();
			is_open = true;
			return;
		}

		if (!is_open) return;

		if (is_open) {
			switch (e.key) {
				case 'ArrowDown':
					e.preventDefault();
					highlighted_index = Math.min(highlighted_index + 1, formatted_options().length - 1);
					scrollHighlightedIntoView();
					break;
				case 'ArrowUp':
					e.preventDefault();
					highlighted_index = Math.max(highlighted_index - 1, 0);
					scrollHighlightedIntoView();
					break;
				case 'Enter':
					e.preventDefault();
					const options = formatted_options();
					if (highlighted_index >= 0 && options[highlighted_index]) {
						const selectedValue = options[highlighted_index].value;
						value = selectedValue;
						is_open = false;

						// Blur the button to remove focus after selection
						if (button_element) {
							button_element.blur();
						}

						if (rest.onchange) {
							rest.onchange({
								currentTarget: e.currentTarget,
								detail: { value: selectedValue }
							});
						}
					}
					break;
			}
		}
	}

	function scrollHighlightedIntoView() {
		/** @type {HTMLElement | null} */
		const highlightedElement = document.querySelector(`[data-index="${highlighted_index}"]`);
		/** @type {HTMLElement | null} */
		const container = document.querySelector('.dropdown-container');

		if (highlightedElement && container) {
			const elementTop = highlightedElement.offsetTop;
			const elementBottom = elementTop + highlightedElement.offsetHeight;
			const containerTop = container.scrollTop;
			const containerBottom = containerTop + container.offsetHeight;

			// Add padding to calculations for scroll offset
			const padding = 9;

			if (elementBottom > containerBottom - padding) {
				// Scroll down - align to bottom with padding
				container.scrollTo({
					top: elementBottom - container.offsetHeight + padding,
					behavior: 'smooth'
				});
			} else if (elementTop < containerTop + padding) {
				// Scroll up - align to top with padding
				container.scrollTo({
					top: elementTop - padding,
					behavior: 'smooth'
				});
			}
		}
	}

	/** @param {MouseEvent & { currentTarget: HTMLButtonElement }} e */
	function handleSelect(e) {
		e.stopImmediatePropagation();
		const newValue = e.currentTarget.value;
		value = newValue;
		is_open = false;
		is_focused = false;

		// Blur the button to remove focus after selection
		if (button_element) {
			button_element.blur();
		}

		if (rest.onchange) {
			rest.onchange({
				currentTarget: e.currentTarget,
				detail: { value: newValue }
			});
		}
	}

	/** @param {(MouseEvent | KeyboardEvent | FocusEvent) & { currentTarget: HTMLElement }} [e] */
	function handleOpen(e) {
		if (e && e instanceof KeyboardEvent) {
			if (e.key === ' ') {
				e.preventDefault();
				is_open = !is_open;
			}
			return;
		}

		// Toggle dropdown state
		is_open = !is_open;

		if (e) e.stopPropagation();
	}

	/** @param {FocusEvent & { currentTarget: HTMLElement }} e */
	function handleBlur(e) {
		const relatedTarget = /** @type {HTMLElement | null} */ (e.relatedTarget);
		const currentContainer = /** @type {HTMLElement | null} */ (
			e.currentTarget.closest('.input-select-container')
		);
		const targetContainer = relatedTarget?.closest('.input-select-container');

		// Reset state if we can't find containers or they're different
		if (!currentContainer || !targetContainer || currentContainer !== targetContainer) {
			is_focused = false;
			is_open = false;
		}
	}
</script>

<select bind:value {disabled} {...rest} hidden class="sr-only">
	{#each formatted_options() as option (option.value)}
		<option value={option.value}>
			{option.label}
		</option>
	{/each}
</select>

<div class="relative w-full">
	<button
		bind:this={button_element}
		type="button"
		{disabled}
		onclick={handleOpen}
		onkeydown={handleKeydown}
		onblur={handleBlur}
		onfocus={() => (is_focused = true)}
		class="
			input-select-container flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5
			text-left ring ring-grey-400 outline-0 transition-all
			duration-300 focus:ring-2 focus:ring-primary-700 focus:outline-0
			{disabled ? 'point-events-none opacity-60' : ''}
			{invalid ? 'ring-danger-600! focus:ring-danger-600!' : ''}
			{is_open ? 'ring-2 ring-primary-700' : ''}
			{rest.class}
		"
	>
		<span class="truncate {display_text === rest.placeholder ? 'text-grey-300' : ''}">
			{display_text}
		</span>
		{#if selected_color}
			<div in:fade={{ duration: 200, easing: quadInOut }}>
				<MemberColor color={selected_color} class="size-4" />
			</div>
		{:else}
			<Icon
				name="chevron-down"
				class={'size-4 transform transition-transform duration-100 ' +
					(is_open ? '-rotate-180' : '')}
			/>
		{/if}
	</button>

	{#if is_open}
		<div
			transition:slide={{ duration: 200, easing: quadInOut }}
			class="dropdown-container absolute mt-1.5 max-h-[275px] w-full overflow-y-auto rounded-lg bg-black p-1 shadow-lg ring-1 ring-grey-600"
			onmousedown={(e) => e.preventDefault()}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="listbox"
			tabindex="-1"
			aria-label="options"
		>
			{#each formatted_options() as option, index (option.value)}
				<button
					transition:fade={{ duration: 150 }}
					type="button"
					data-index={index}
					class="block w-full overflow-hidden rounded-lg px-3 py-1.5 text-left transition-colors active:bg-grey-900
						{option.is_selected ? 'bg-primary-700 active:bg-primary-600' : ''}
					"
					value={option.value}
					tabindex="-1"
					onclick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						handleSelect(e);
					}}
				>
					{#if optionSnippet}
						{@render optionSnippet({ option })}
					{:else}
						{option.label}
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
