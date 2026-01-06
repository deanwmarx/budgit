<script>
	import { appState } from '$lib/appState.svelte.js';
	import {
		createUser,
		createHousehold,
		addMember,
		registerDevice,
		pickAndImportBackup
	} from '$lib/db';
	import { Device } from '@capacitor/device';
	import { getMemberColors } from '$lib/utils/helpers';
	import Button from '$comps/elements/buttons/Button.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import InputText from '$comps/elements/inputs/InputText.svelte';
	import InputLabel from '$comps/elements/inputs/descriptors/InputLabel.svelte';
	import InputSelect from '$comps/elements/inputs/InputSelect.svelte';
	import InputOptions from '$comps/elements/inputs/InputOptions.svelte';
	import MemberColor from '$comps/elements/members/MemberColor.svelte';
	import { fade } from 'svelte/transition';

	// Check if user exists (the default user for this device)
	let has_user = $derived(!!appState.current_user_id);
	let has_households = $derived(appState.households.length > 0);

	// Mode: 'create-user' or 'select-household' or 'create-household'
	let mode = $derived(
		has_user ? (has_households ? 'select-household' : 'create-household') : 'create-user'
	);

	// Household setup mode: 'create' or 'import'
	/** @type {'create' | 'import'} */
	let household_setup_mode = $state('create');

	const household_setup_options = [
		{ value: 'create', label: 'Create New', icon: 'plus' },
		{ value: 'import', label: 'Import Backup', icon: 'file-import' }
	];

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

	// Selected existing household - pre-select last household if it exists
	let selected_household_id = $state('');

	// Update selected household when last_household_id is loaded
	$effect(() => {
		if (appState.last_household_id && mode === 'select-household' && !selected_household_id) {
			selected_household_id = appState.last_household_id;
		}
	});

	let is_loading = $state(false);
	let error = $state('');

	// Import state
	let is_importing = $state(false);
	let import_message = $state('');
	/** @type {'success' | 'error' | ''} */
	let import_status = $state('');

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
			label: h.name
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
				// Mark onboarding complete
				try {
					await appState.setOnboarded(true);
				} catch (e) {
					// ignore
				}
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

			// Add current user as admin member
			const color_name = member_color.replace('-500', '');
			await addMember(household.id, appState.current_user_id, 'admin', color_name);

			// Update app state
			await appState.setHousehold(household.id, household.name);
			// Mark onboarding complete
			try {
				await appState.setOnboarded(true);
			} catch (e) {
				// ignore
			}
			appState.addHousehold(household.id, household.name, 'admin');

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

	async function handleImportBackup() {
		if (is_importing) return;

		is_importing = true;
		import_message = '';
		import_status = '';
		error = '';

		try {
			const result = await pickAndImportBackup();

			if (result.success) {
				import_status = 'success';
				const stats = result.stats;
				if (stats) {
					const parts = [];
					if (stats.householdsImported) parts.push(`${stats.householdsImported} household(s)`);
					if (stats.usersImported) parts.push(`${stats.usersImported} user(s)`);
					if (stats.transactionsImported)
						parts.push(`${stats.transactionsImported} transaction(s)`);
					import_message = parts.length > 0 ? `Imported: ${parts.join(', ')}` : 'Import complete';
				} else {
					import_message = 'Import complete';
				}

				// Reload households from app state
				await appState.loadHouseholds();

				// If we now have households, the mode will automatically switch to select-household
				if (appState.households.length > 0) {
					// Give a moment to see the success message
					setTimeout(() => {
						// Mode will auto-switch due to reactive state
					}, 1500);
				}
			} else if (result.error === 'Cancelled') {
				// User cancelled, don't show error
				import_status = '';
			} else {
				import_status = 'error';
				error = result.error || 'Failed to import backup';
			}
		} catch (err) {
			import_status = 'error';
			error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			is_importing = false;
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
		<div class="rounded-lg bg-grey-900 p-4 shadow-lg">
			{#if mode === 'create-user'}
				<!-- Create User Form -->
				<form
					in:fade={{ duration: 150 }}
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
								placeholder="Enter your full name"
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
								placeholder="Enter your email address"
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

					<Button type="submit" color="primary" class="ml-auto" disabled={is_loading}>
						{#if is_loading}
							Creating account...
							<Icon name="spinner" class="size-5 animate-spin" />
						{:else}
							Continue
							<Icon name="arrow-right" class="size-5" />
						{/if}
					</Button>
				</form>
			{:else if mode === 'select-household'}
				<!-- Select Household Form -->
				<form
					in:fade={{ duration: 150 }}
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

					<div class="flex flex-nowrap justify-between gap-2">
						<Button
							type="button"
							color="secondary"
							onclick={() => (mode = 'create-household')}
							disabled={is_loading}
						>
							<Icon name="plus" class="size-5" />
							Household
						</Button>

						<Button type="submit" color="primary" disabled={is_loading}>
							{#if is_loading}
								Loading...
								<Icon name="spinner" class="size-5 animate-spin" />
							{:else}
								Continue
								<Icon name="arrow-right" class="size-5" />
							{/if}
						</Button>
					</div>
				</form>
			{:else}
				<!-- Create/Import Household -->
				<div in:fade={{ duration: 150 }} class="space-y-6">
					<!-- Mode selector -->
					<InputOptions options={household_setup_options} bind:value={household_setup_mode} />

					{#if household_setup_mode === 'create'}
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
										placeholder="Enter a household name"
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
										placeholder="Enter the day your month starts (usually around payday)"
										disabled={is_loading}
										required
									/>
								</div>

								<div class="space-y-1">
									<InputLabel text="Your Colour" required for="color" />
									<div class="flex flex-wrap gap-2">
										{#each color_options as color}
											<button
												type="button"
												onclick={() => (member_color = color.value)}
												class="scale-90 rounded-full border-2 transition-all {member_color ===
												color.value
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

							<div
								class="flex flex-nowrap gap-2 {!has_households ? 'justify-end' : 'justify-between'}"
							>
								{#if has_households}
									<Button
										type="button"
										color="secondary"
										onclick={() => (mode = 'select-household')}
										disabled={is_loading}
									>
										<Icon name="arrow-left" class="size-5" />
										Back
									</Button>
								{/if}
								<Button type="submit" color="primary" disabled={is_loading}>
									{#if is_loading}
										Creating household...
										<Icon name="spinner" class="size-5 animate-spin" />
									{:else}
										Get Started
										<Icon name="arrow-right" class="size-5" />
									{/if}
								</Button>
							</div>
						</form>
					{:else}
						<!-- Import Backup -->
						<div class="space-y-4">
							<p class="text-gray-400 text-sm">
								Import data from a backup file. Select a JSON backup file from your device.
							</p>

							<div class="flex gap-2">
								<Button
									onclick={handleImportBackup}
									disabled={is_importing}
									color="primary"
									class="flex-1"
								>
									{#if is_importing}
										Importing...
										<Icon name="spinner" class="size-5 animate-spin" />
									{:else}
										Select Backup File
									{/if}
								</Button>
							</div>

							{#if import_status === 'success'}
								<div class="bg-green-900/30 rounded-lg p-3">
									<p class="text-green-400 text-sm font-medium">✓ {import_message}</p>
									<p class="mt-1 text-xs text-green-500">Redirecting to household selection...</p>
								</div>
							{/if}

							{#if error}
								<div class="text-red-400 rounded border border-red-500 bg-red-500/10 p-3 text-sm">
									<div class="flex items-center gap-2">
										<Icon name="exclamation-triangle" class="size-4" />
										{error}
									</div>
								</div>
							{/if}

							{#if has_households}
								<div class="flex justify-start">
									<Button
										type="button"
										color="secondary"
										onclick={() => (mode = 'select-household')}
										disabled={is_importing}
									>
										<Icon name="arrow-left" class="size-5" />
										Back
									</Button>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
