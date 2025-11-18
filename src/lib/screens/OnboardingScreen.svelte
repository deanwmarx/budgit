<script>
	import { appState } from '$lib/appState.svelte.js';
	import { createUser, createHousehold, addMember, registerDevice } from '$lib/db';
	import { Device } from '@capacitor/device';
	import { getMemberColors } from '$lib/utils/helpers';
	import Button from '$comps/elements/buttons/Button.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import InputText from '$comps/elements/inputs/InputText.svelte';
	import InputLabel from '$comps/elements/inputs/descriptors/InputLabel.svelte';
	import InputSelect from '$comps/elements/inputs/InputSelect.svelte';
	import MemberColor from '$comps/elements/members/MemberColor.svelte';

	// Check if user exists (the default user for this device)
	let has_user = $derived(!!appState.current_user_id);
	let has_households = $derived(appState.households.length > 0);
	
	// Mode: 'create-user' or 'select-household' or 'create-household'
	let mode = $derived(has_user ? (has_households ? 'select-household' : 'create-household') : 'create-user');

	// Reset loading when mode changes
	$effect(() => {
		mode; // Track mode changes
		is_loading = false;
		error = '';
	});

	// Form fields for new user
	let user_name = $state('');
	let user_email = $state('');
	
	// Form fields for new household
	let household_name = $state('');
	let budget_cycle_start_day = $state(1);
	let member_color = $state('blue-500');
	
	// Selected existing household
	let selected_household_id = $state('');
	
	let is_loading = $state(false);
	let error = $state('');

	// Get all member colors except neutrals
	const color_options = getMemberColors()
		.filter((color) => !['slate', 'gray', 'zinc'].includes(color))
		.map((color) => ({
			value: `${color}-500`,
			label: color.charAt(0).toUpperCase() + color.slice(1),
			color: color
		}));

	// Budget day options (1-31)
	const budget_day_options = Array.from({ length: 31 }, (_, i) => ({
		value: i + 1,
		label: `${i + 1}${getOrdinalSuffix(i + 1)} of the month`
	}));

	// Household select options
	const household_options = $derived(
		appState.households.map((h) => ({
			value: h.id,
			label: `${h.name} (${h.role})`
		}))
	);

	function getOrdinalSuffix(num) {
		const j = num % 10;
		const k = num % 100;
		if (j === 1 && k !== 11) return 'st';
		if (j === 2 && k !== 12) return 'nd';
		if (j === 3 && k !== 13) return 'rd';
		return 'th';
	}

	async function handleSelectHousehold() {
		if (!selected_household_id) {
			error = 'Please select a household';
			return;
		}

		is_loading = true;
		error = '';

		try {
			const selected = appState.households.find((h) => h.id === selected_household_id);
			if (selected) {
				await appState.setHousehold(selected.id, selected.name);
				console.log('Household selected!');
			}
		} catch (err) {
			console.error('Failed to select household:', err);
			error = err.message || 'Failed to select household. Please try again.';
			is_loading = false;
		}
	}

	async function handleCreateHousehold() {
		// Validate
		if (!household_name.trim()) {
			error = 'Please enter a household name';
			return;
		}

		if (budget_cycle_start_day < 1 || budget_cycle_start_day > 31) {
			error = 'Budget cycle day must be between 1 and 31';
			return;
		}

		is_loading = true;
		error = '';

		try {
			// Create household
			const household = await createHousehold(household_name.trim(), budget_cycle_start_day);

			// Add current user as owner member
			const color_name = member_color.replace('-500', '');
			await addMember(household.id, appState.current_user_id, 'owner', color_name);

			// Update app state
			await appState.setHousehold(household.id, household.name);
			appState.addHousehold(household.id, household.name, 'owner');

			console.log('Household created!');
		} catch (err) {
			console.error('Failed to create household:', err);
			error = err.message || 'Failed to create household. Please try again.';
			is_loading = false;
		}
	}

	async function handleCreateUser() {
		// Validate
		if (!user_name.trim() || !user_email.trim()) {
			error = 'Please fill in all fields';
			return;
		}

		if (!user_email.includes('@')) {
			error = 'Please enter a valid email';
			return;
		}

		is_loading = true;
		error = '';

		try {
			// 1. Create user
			const user = await createUser(user_email.trim(), user_name.trim());

			// 2. Register device
			const device_info = await Device.getInfo();
			const device_id = await Device.getId();
			await registerDevice(
				device_id.identifier,
				`${device_info.manufacturer} ${device_info.model}`,
				user.id
			);

			// 3. Update app state
			await appState.setUser(user.id, user.email, user.name);

			// 4. Switch to create household mode
			mode = 'create-household';

			console.log('User created!');
		} catch (err) {
			console.error('Failed to create user:', err);
			error = err.message || 'Failed to create account. Please try again.';
			is_loading = false;
		}
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-grey-950 p-4">
	<div class="w-full max-w-md space-y-8">
		<!-- Header -->
		<div class="text-center">
			<h1 class="text-4xl font-bold text-primary-500">
				{#if mode === 'create-user'}
					Welcome to Budgit
				{:else if mode === 'select-household'}
					Select Household
				{:else}
					Create Household
				{/if}
			</h1>
			<p class="text-gray-400 mt-2">
				{#if mode === 'create-user'}
					Let's set up your account
				{:else if mode === 'select-household'}
					Choose a household or create a new one
				{:else}
					Set up your budget household
				{/if}
			</p>
		</div>

		<!-- Form -->
		<div class="rounded-lg bg-grey-900 p-6 shadow-lg">
			{#if mode === 'create-user'}
				<!-- Create User Form -->
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleCreateUser();
					}}
					class="space-y-6"
				>
					<div class="space-y-4">
						<h2 class="text-xl font-semibold">Your Information</h2>

						<div class="space-y-1">
							<InputLabel text="Name" required for="name" />
							<InputText
								id="name"
								type="text"
								bind:value={user_name}
								placeholder="John Doe"
								disabled={is_loading}
								required
							/>
						</div>

						<div class="space-y-1">
							<InputLabel text="Email" required for="email" />
							<InputText
								id="email"
								type="email"
								bind:value={user_email}
								placeholder="john@example.com"
								disabled={is_loading}
								required
							/>
						</div>
					</div>

					{#if error}
						<div class="text-red-400 rounded border border-red-500 bg-red-500/10 p-3 text-sm">
							<div class="flex items-center gap-2">
								<Icon name="exclamation-triangle" class="size-4" />
								{error}
							</div>
						</div>
					{/if}

					<Button type="submit" color="primary" class="w-full" disabled={is_loading}>
						{#if is_loading}
							<Icon name="spinner" class="size-5 animate-spin" />
							Creating account...
						{:else}
							<Icon name="arrow-right" class="size-5" />
							Continue
						{/if}
					</Button>
				</form>
			{:else if mode === 'select-household'}
				<!-- Select Household Form -->
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleSelectHousehold();
					}}
					class="space-y-6"
				>
					<div class="space-y-4">
						<div class="space-y-1">
							<InputLabel text="Select Household" required for="household-select" />
							<InputSelect
								id="household-select"
								bind:value={selected_household_id}
								options={household_options}
								placeholder="Choose a household"
								disabled={is_loading}
							/>
						</div>
					</div>

					{#if error}
						<div class="text-red-400 rounded border border-red-500 bg-red-500/10 p-3 text-sm">
							<div class="flex items-center gap-2">
								<Icon name="exclamation-triangle" class="size-4" />
								{error}
							</div>
						</div>
					{/if}

					<div class="space-y-2">
						<Button type="submit" color="primary" class="w-full" disabled={is_loading}>
							{#if is_loading}
								<Icon name="spinner" class="size-5 animate-spin" />
								Loading...
							{:else}
								<Icon name="arrow-right" class="size-5" />
								Continue
							{/if}
						</Button>

						<Button
							type="button"
							color="secondary"
							class="w-full"
							onclick={() => (mode = 'create-household')}
							disabled={is_loading}
						>
							<Icon name="plus" class="size-5" />
							Create New Household
						</Button>
					</div>
				</form>
			{:else}
				<!-- Create Household Form -->
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleCreateHousehold();
					}}
					class="space-y-6"
				>
					<div class="space-y-4">
						<div class="space-y-1">
							<InputLabel text="Household Name" required for="household" />
							<InputText
								id="household"
								type="text"
								bind:value={household_name}
								placeholder="Smith Family Budget"
								disabled={is_loading}
								required
							/>
						</div>

						<div class="space-y-1">
							<InputLabel text="Budget Cycle Start Day" required for="budgetDay" />
							<InputText
								id="budgetDay"
								type="number"
								bind:value={budget_cycle_start_day}
								placeholder="Enter the day your month starts (1-31)"
								disabled={is_loading}
								required
							/>
						</div>

						<div class="space-y-1">
							<InputLabel text="Your Color" required for="color" />
							<div class="flex flex-wrap gap-2">
								{#each color_options as color}
									<button
										type="button"
										onclick={() => (member_color = color.value)}
										class="scale-90 rounded-full border-2 transition-all {member_color === color.value
											? 'scale-100 border-white'
											: 'border-transparent'}"
										disabled={is_loading}
										title={color.label}
									>
										<MemberColor color={color.color} class="size-8" />
									</button>
								{/each}
							</div>
						</div>
					</div>

					{#if error}
						<div class="text-red-400 rounded border border-red-500 bg-red-500/10 p-3 text-sm">
							<div class="flex items-center gap-2">
								<Icon name="exclamation-triangle" class="size-4" />
								{error}
							</div>
						</div>
					{/if}

					<div class="space-y-2">
						<Button type="submit" color="primary" class="w-full" disabled={is_loading}>
							{#if is_loading}
								<Icon name="spinner" class="size-5 animate-spin" />
								Creating household...
							{:else}
								<Icon name="arrow-right" class="size-5" />
								Get Started
							{/if}
						</Button>

						{#if has_households}
							<Button
								type="button"
								color="secondary"
								class="w-full"
								onclick={() => (mode = 'select-household')}
								disabled={is_loading}
							>
								<Icon name="arrow-left" class="size-5" />
								Back to Select Household
							</Button>
						{/if}
					</div>
				</form>
			{/if}
		</div>

		{#if mode === 'create-household'}
			<p class="text-center text-sm text-gray-500">
				You can invite other members to your household later
			</p>
		{/if}
	</div>
</div>
