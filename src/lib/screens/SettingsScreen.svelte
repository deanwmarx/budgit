<script>
	import PrettyJSON from '$comps/elements/debugging/PrettyJSON.svelte';
	import InputLabel from '$comps/elements/inputs/descriptors/InputLabel.svelte';
	import InputSlider from '$comps/elements/inputs/InputSlider.svelte';
	import InputText from '$comps/elements/inputs/InputText.svelte';
	import InputToggle from '$comps/elements/inputs/InputToggle.svelte';
	import Accordion from '$comps/groups/Accordion.svelte';
	import { Button } from '$comps';
	import { appState } from '$lib/appState.svelte';
	import { getHousehold, updateHousehold } from '$lib/db/households';
	import { createLocalBackup, getBackupHistory, pickAndImportBackup } from '$lib/db/backup';
	import { navigation } from '$lib/navigation.svelte';
	import { onMount, untrack } from 'svelte';

	/** @type {any} */
	let household = $state([]);
	/** @type {string} */
	let household_name = $state('');
	/**  @type {number | null} */
	let budget_cycle_start_day = $state(null);
	let budget_warning_threshold = $state(75);
	let budget_danger_threshold = $state(90);

	/** @type {string} */
	let original_household_name = $state('');
	/** @type {number | null} */
	let original_budget_cycle_start_day = $state(null);
	/** @type {number} */
	let original_budget_warning_threshold = $state(75);
	/** @type {number} */
	let original_budget_danger_threshold = $state(90);

	// Backup state
	let is_backing_up = $state(false);
	let backup_message = $state('');
	let backup_filename = $state('');
	/** @type {'success' | 'error' | ''} */
	let backup_status = $state('');
	/** @type {Array<{ id: string, timestamp: number, type: string, location: string }>} */
	let backup_history = $state([]);
	let backup_all_households = $state(false);

	// Import state
	let is_importing = $state(false);
	let import_message = $state('');
	/** @type {'success' | 'error' | ''} */
	let import_status = $state('');

	let has_changes = $derived(
		household_name !== original_household_name ||
			budget_cycle_start_day !== original_budget_cycle_start_day ||
			budget_warning_threshold !== original_budget_warning_threshold ||
			budget_danger_threshold !== original_budget_danger_threshold
	);

	onMount(async () => {
		if (!appState.current_household_id) return;
		household = await getHousehold(appState.current_household_id);
		if (household) {
			household_name = household.name;
			budget_cycle_start_day = household.budgetCycleStartDay;
			budget_warning_threshold = household.budgetWarningThreshold;
			budget_danger_threshold = household.budgetDangerThreshold;

			original_household_name = household.name;
			original_budget_cycle_start_day = household.budgetCycleStartDay;
			original_budget_warning_threshold = household.budgetWarningThreshold;
			original_budget_danger_threshold = household.budgetDangerThreshold;
		}

		// Load backup history
		backup_history = await getBackupHistory(5);
	});

	$effect(() => {
		has_changes;

		untrack(() => {
			updateHeaderMode();
		});
	});

	function updateHeaderMode() {
		if (has_changes) {
			// Save handler
			const save = async () => {
				try {
					if (!appState.current_household_id) return;
					const hid = appState.current_household_id;
					await updateHousehold(
						hid,
						household_name,
						Number(budget_cycle_start_day ?? 1),
						Number(budget_warning_threshold ?? 75),
						Number(budget_danger_threshold ?? 90)
					);

					appState.current_household = {
						id: hid,
						name: household_name,
						budgetCycleStartDay: Number(budget_cycle_start_day ?? 1)
					};
					appState.household_budget_warning_threshold = Number(budget_warning_threshold ?? 75);
					appState.household_budget_danger_threshold = Number(budget_danger_threshold ?? 90);

					// commit originals
					original_household_name = household_name;
					original_budget_cycle_start_day = budget_cycle_start_day ?? null;
					original_budget_warning_threshold = budget_warning_threshold;
					original_budget_danger_threshold = budget_danger_threshold;
					// clear header
					navigation.header_mode = 'none';
					navigation.header_onclick = null;
					navigation.header_undo = null;
				} catch (err) {
					console.error('Failed saving household settings', err);
				}
			};

			// Undo handler
			const undo = () => {
				household_name = original_household_name;
				budget_cycle_start_day = original_budget_cycle_start_day;
				budget_warning_threshold = original_budget_warning_threshold;
				budget_danger_threshold = original_budget_danger_threshold;
				navigation.header_mode = 'none';
				navigation.header_onclick = null;
				navigation.header_undo = null;
			};

			navigation.header_mode = 'update';
			navigation.header_onclick = save;
			navigation.header_undo = undo;
		} else {
			if (navigation.header_mode !== 'none') {
				navigation.header_mode = 'none';
				navigation.header_onclick = null;
				navigation.header_undo = null;
			}
		}
	}

	async function handleLocalBackup() {
		if (is_backing_up) return;

		is_backing_up = true;
		backup_message = '';
		backup_status = '';

		try {
			// If backup_all_households is true, pass empty array to backup all
			// Otherwise, backup only current household
			const householdIds = backup_all_households
				? []
				: appState.current_household_id
					? [appState.current_household_id]
					: [];
			const backupName = backup_all_households ? 'all_households' : household_name;
			const result = await createLocalBackup(householdIds, backupName);

			if (result.success) {
				backup_status = 'success';
				backup_filename = result.filename || '';
				backup_message = 'Backup saved to Downloads folder';
				// Refresh backup history
				backup_history = await getBackupHistory(5);
			} else {
				backup_status = 'error';
				backup_filename = '';
				backup_message = result.error || 'Failed to create backup';
			}
		} catch (error) {
			backup_status = 'error';
			backup_message = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			is_backing_up = false;
		}
	}

	async function handleImport() {
		if (is_importing) return;

		is_importing = true;
		import_message = '';
		import_status = '';

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
					if (stats.budgetsImported) parts.push(`${stats.budgetsImported} budget(s)`);
					import_message = parts.length > 0 ? `Imported: ${parts.join(', ')}` : 'Import complete';
				} else {
					import_message = 'Import complete';
				}
				// Refresh backup history
				backup_history = await getBackupHistory(5);
			} else if (result.error === 'Cancelled') {
				// User cancelled, don't show error
				import_status = '';
			} else {
				import_status = 'error';
				import_message = result.error || 'Failed to import backup';
			}
		} catch (error) {
			import_status = 'error';
			import_message = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			is_importing = false;
		}
	}

	/**
	 * Format timestamp for display
	 * @param {number} timestamp
	 */
	function formatBackupDate(timestamp) {
		return new Date(timestamp).toLocaleString();
	}
</script>

<div class="space-y-4">
	<h1 class="text-center text-xl leading-none font-medium">Settings</h1>
	<Accordion is_open={true} title="Household Settings">
		<div class="space-y-1">
			<InputLabel text="Name" for="household-name" />
			<InputText
				id="household-name"
				bind:value={household_name}
				placeholder="Enter household name"
			/>
		</div>
		<div class="space-y-1">
			<InputLabel text="Budget Cycle Start Day" for="budget-cycle-start-day" />
			<InputText
				id="budget-cycle-start-day"
				type="number"
				bind:value={budget_cycle_start_day}
				min="1"
				max="28"
				placeholder="Enter start day for your budget cycle"
			/>
		</div>
		<div class="space-y-1">
			<InputLabel text="Budget Warning Threshold" for="warning-threshold" />
			<InputSlider bind:value={budget_warning_threshold} variant="warning" />
		</div>
		<div class="space-y-1">
			<InputLabel text="Budget Danger Threshold" for="danger-threshold" />
			<InputSlider bind:value={budget_danger_threshold} variant="danger" />
		</div>
	</Accordion>

	<Accordion title="Backup & Restore">
		<div class="space-y-4">
			<!-- Backup Section -->
			<div class="space-y-3">
				<h4 class="text-sm font-medium">Create Backup</h4>
				<p class="text-sm text-grey-600 dark:text-grey-400">
					Local backups are saved to your device's Downloads folder.
				</p>

				<div class="flex items-center justify-between">
					<span class="text-sm text-grey-700 dark:text-grey-300">Backup all households</span>
					<InputToggle bind:checked={backup_all_households} />
				</div>

				<div class="flex gap-2">
					<Button onclick={handleLocalBackup} disabled={is_backing_up} color="primary">
						{is_backing_up ? 'Creating...' : 'Local Backup'}
					</Button>
					<Button disabled={true} color="secondary">Google Drive</Button>
				</div>

				{#if backup_status === 'success'}
					<div class="rounded-lg bg-success-50 p-3">
						<p class="text-sm font-medium text-success-600">
							✓ {backup_message}
						</p>
						{#if backup_filename}
							<p class="mt-1 text-xs text-success-600">
								File: {backup_filename}
							</p>
							<p class="mt-1 text-xs text-success-600">
								Open your Files app → Downloads to find it
							</p>
						{/if}
					</div>
				{:else if backup_status === 'error'}
					<p class="text-sm text-danger-600">{backup_message}</p>
				{/if}
			</div>

			<!-- Import Section -->
			<div class="space-y-3 border-t border-grey-200 pt-4">
				<h4 class="text-sm font-medium">Import Backup</h4>
				<p class="text-sm text-grey-600">
					Import data from a backup file. Existing data will be preserved.
				</p>

				<div class="flex gap-2">
					<Button onclick={handleImport} disabled={is_importing} color="secondary">
						{is_importing ? 'Importing...' : 'Select File'}
					</Button>
					<Button disabled={true} color="secondary">Google Drive</Button>
				</div>

				{#if import_status === 'success'}
					<div class="rounded-lg bg-success-50 p-3 ">
						<p class="text-sm font-medium text-success-600">
							✓ {import_message}
						</p>
					</div>
				{:else if import_status === 'error'}
					<p class="text-sm text-danger-600">{import_message}</p>
				{/if}
			</div>

			<!-- History Section -->
			{#if backup_history.length > 0}
				<div class="space-y-2 border-t border-grey-200 pt-4">
					<h4 class="text-sm font-medium">Recent Backups</h4>
					<ul class="space-y-1 text-sm">
						{#each backup_history as backup}
							<li class="flex justify-between text-grey-600">
								<span>{formatBackupDate(backup.timestamp)}</span>
								<span class="capitalize">{backup.type.replace('_', ' ')}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</Accordion>
</div>
