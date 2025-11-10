<script>
	import Button from '$comps/elements/buttons/Button.svelte';
	import ButtonRound from '$comps/elements/buttons/ButtonRound.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import FAB from '$comps/groups/FAB.svelte';
</script>

<div class="relative space-y-4 p-4">
	<h1 class="mb-4 text-2xl font-bold">Transaction</h1>
	<p class="text-gray-400">Transaction screen placeholder</p>

	<h2 class="mt-6 mb-4 text-xl font-semibold">Buttons</h2>

	<Button size="small" color="primary">Small Primary Button</Button>
	<Button size="small" color="secondary">Small Secondary Button</Button>
	<Button size="small" color="tertiary">Small Tertiary Button</Button>
	<Button size="small" color="danger">Small Danger Button</Button>
	<Button size="medium" color="primary">Medium Primary Button</Button>
	<Button size="medium" color="secondary">Medium Secondary Button</Button>
	<Button size="medium" color="tertiary">Medium Tertiary Button</Button>
	<Button size="medium" color="danger">Medium Danger Button</Button>
	<Button size="large" color="primary">Large Primary Button</Button>
	<Button size="large" color="secondary">Large Secondary Button</Button>
	<Button size="large" color="tertiary">Large Tertiary Button</Button>
	<Button size="large" color="danger" disabled>Large Danger Button</Button>

	<h2 class="mt-6 mb-4 text-xl font-semibold">Round Buttons</h2>

	<ButtonRound size="small" color="primary">
		<Icon name="plus" class="size-4" />
	</ButtonRound>
	<ButtonRound size="small" color="secondary">
		<Icon name="arrow-left" class="size-4" />
	</ButtonRound>
	<ButtonRound size="small" color="tertiary">
		<Icon name="xmark" class="size-4" />
	</ButtonRound>
	<ButtonRound size="small" color="danger">
		<Icon name="trash" class="size-4" />
	</ButtonRound>
	<ButtonRound size="medium" color="primary">
		<Icon name="plus" class="size-4" />
	</ButtonRound>
	<ButtonRound size="medium" color="secondary">
		<Icon name="arrow-left" class="size-4" />
	</ButtonRound>
	<ButtonRound size="medium" color="tertiary">
		<Icon name="xmark" class="size-4" />
	</ButtonRound>
	<ButtonRound size="medium" color="danger">
		<Icon name="trash" class="size-4" />
	</ButtonRound>
	<ButtonRound size="large" color="primary">
		<Icon name="plus" class="size-4" />
	</ButtonRound>
	<ButtonRound size="large" color="secondary">
		<Icon name="arrow-left" class="size-4" />
	</ButtonRound>
	<ButtonRound size="large" color="tertiary">
		<Icon name="xmark" class="size-4" />
	</ButtonRound>
	<ButtonRound size="large" color="danger" disabled>
		<Icon name="trash" class="size-4" />
	</ButtonRound>

	<div class="absolute bottom-0 left-1/2 -translate-x-1/2 transform">
		<FAB>
			<Button color="primary">
				<Icon name="arrows-up-down" class="size-6" />
				Add Variable Expense
			</Button>
			<Button color="primary">
				<Icon name="exclamation-triangle" class="size-6" />
				Add Incidental Expense
			</Button>
		</FAB>
	</div>
</div>
