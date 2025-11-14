<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} [id] - Unique identifier for the input
	 * @property {boolean} [checked=false] - Whether the switch is checked
	 * @property {string} [name] - Form field name
	 * @property {boolean} [invalid=false] - Error state
	 * @property {boolean} [disabled=false] - Disabled state
	 * @property {string} [value] - Value when checked
	 */

	const random_id = Math.random().toString(36).substring(2, 15);

	/** @type {Props & { [key: string]: any }} */
	let {
		checked = $bindable(false),
		name = 'switch' + random_id,
		invalid = $bindable(false),
		disabled = $bindable(false),
		...rest
	} = $props();

	const COLORS = {
		green: 'peer-checked:bg-primary-600 peer-checked:hover:bg-500'
	};

	// Extract onchange handler and remove it from rest to prevent double handlers
	const onChangeHandler = rest.onchange;
	delete rest.onchange;

	// Store previous state to prevent duplicate events
	let previous_state = checked;

	$effect(() => {
		// Only trigger if state changed
		if (checked !== previous_state && onChangeHandler) {
			previous_state = checked;
			onChangeHandler({
				detail: { value: checked }
			});
		}
	});

	function handleSwitchClick() {
		if (!disabled) {
			checked = !checked;
		}
	}
</script>

<div class="flex items-center">
	<input
		type="checkbox"
		tabindex="-1"
		id={name}
		hidden
		{name}
		{disabled}
		bind:checked
		class="peer sr-only"
		{...rest}
	/>
	<div
		role="switch"
		tabindex="0"
		aria-checked={checked}
		onclick={handleSwitchClick}
		onkeydown={(e) => e.key === ' ' && handleSwitchClick()}
		class="
            peer-checked:hover:bg-500 relative h-6 w-10 overflow-hidden
            rounded-full transition-all duration-300
            ease-out peer-checked:bg-primary-600 peer-focus-visible:ring-2
            peer-focus-visible:ring-black peer-focus-visible:ring-offset-2 before:absolute
            before:top-[3px] before:left-[3px]
            before:h-[18px] before:w-[18px]
            before:rounded-full
            before:bg-white before:shadow-sm
            before:transition-all
            before:duration-300 before:ease-out peer-checked:before:translate-x-[16px]
            {invalid
			? 'bg-danger-500 peer-checked:bg-danger-400'
			: 'active:bg-slate-400 bg-grey-500'}
            {disabled ? 'opacity-60' : 'before:bg-white'}
        "
	></div>
</div>
