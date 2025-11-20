<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} [text="Label text"]
	 * @property {boolean} [invalid=false]
	 * @property {boolean} [disabled=false]
	 * @property {boolean} [optional=false]
	 * @property {boolean} [required=false]
	 * @property {string} [optional_text="(optional)"]
	 * @property {string} [required_text="*"]
	 * @property {string} [class]
	 * @property {string} [for]
	 */

	/** @type {Props} */

	let {
		text = 'Label text',
		invalid = false,
		disabled = false,
		optional = false,
		optional_text = '(optional)',
		required = false,
		...rest
	} = $props();
</script>

<label
	{...rest}
	class="
		block text-sm leading-none transition-colors select-none {rest.class ?? ''}
		{disabled ? 'pointer-events-none opacity-60' : ''}
		{invalid ? 'text-danger-600' : ''}
	"
>
	{text}
	{#if optional}
		{optional_text}
	{/if}
</label>
