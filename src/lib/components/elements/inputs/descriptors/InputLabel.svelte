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
		required_text = '*',
		...rest
	} = $props();
</script>

<label
	{...rest}
	class="
		block leading-none transition-all select-none {rest.class ?? ''}
		{disabled ? 'opacity-60' : ''}
		{invalid ? 'text-danger-600' : ''}
	"
>
	{text}
	{#if optional}
		{optional_text}
	{/if}
	{#if required}
		{required_text}
	{/if}
</label>
