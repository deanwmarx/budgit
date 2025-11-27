<script>
	import ButtonRound from '$comps/elements/buttons/ButtonRound.svelte';
	import Button from '$comps/elements/buttons/Button.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import InputLabel from '$comps/elements/inputs/descriptors/InputLabel.svelte';
	import InputOptions from '$comps/elements/inputs/InputOptions.svelte';
	import InputText from '$comps/elements/inputs/InputText.svelte';
	import MemberSelect from '$comps/elements/members/MemberSelect.svelte';
	import Sheet from '$comps/elements/Sheet.svelte';
	import CardMember from '$comps/groups/cards/CardMember.svelte';
	import { appState } from '$lib/appState.svelte.js';
	import { navigation } from '$lib/navigation.svelte.js';
	import { getMembers, updateMember, inviteMember, removeMember } from '$lib/db';
	import { getMemberColors, formatRelativeDate } from '$lib/utils/helpers';
	import { onMount } from 'svelte';
	import Modal from '$comps/groups/Modal.svelte';
	import PrettyJSON from '$comps/elements/debugging/PrettyJSON.svelte';

	let members = $state([]);
	let edit_sheet_open = $state(false);
	let add_sheet_open = $state(false);
	let delete_panel_open = $state(false);
	let selected_members = $state(/** @type {string[]} */ ([]));
	let selected_member = $state(null);
	let is_loading = $state(false);

	// Edit form fields
	let member_name = $state('');
	let member_email = $state('');
	let member_role = $state('');
	let member_color = $state('');
	let member_joined_at = $state('');
	let member_updated_at = $state('');

	// Add form fields
	let new_member_name = $state('');
	let new_member_email = $state('');
	let new_member_role = $state('member');
	let new_member_color = $state('');

	// Generate color options
	const color_options = getMemberColors()
		.filter((color) => !['slate', 'gray', 'zinc'].includes(color))
		.map((color) => ({
			value: `${color}-500`,
			label: color.charAt(0).toUpperCase() + color.slice(1),
			color: color
		}));

	onMount(async () => {
		members = await getMembers(appState.current_household_id);
		updateHeaderMode();
	});

	function updateHeaderMode() {
		if (selected_members.length > 0) {
			navigation.setHeaderMode('delete', () => {
				delete_panel_open = true;
			});
		} else {
			navigation.setHeaderMode('add', openAddSheet);
		}
	}

	function formatDateTime(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		const dateOnly = date.toISOString().split('T')[0];
		const relativeDate = formatRelativeDate(dateOnly);
		const time = date.toLocaleTimeString('en-ZA', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
		return `${relativeDate}, ${time}`;
	}

	function openEditSheet(member) {
		selected_member = member;
		member_name = member.name;
		member_email = member.email;
		member_role = member.role;
		member_color = `${member.color}-500`;
		member_joined_at = formatDateTime(member.joinedAt);
		member_updated_at = formatDateTime(member.updatedAt);
		edit_sheet_open = true;
	}

	function openAddSheet() {
		// Reset form
		new_member_name = '';
		new_member_email = '';
		new_member_role = 'member';
		// Auto-assign next available color
		const used_colors = members.map((m) => m.color);
		const available_color = color_options.find((opt) => !used_colors.includes(opt.color));
		new_member_color = available_color ? `${available_color.color}-500` : 'blue-500';
		add_sheet_open = true;
	}

	/**
	 * @param {string} userId
	 */
	function handleLongPress(userId) {
		// Toggle selection
		if (selected_members.includes(userId)) {
			selected_members = selected_members.filter((id) => id !== userId);
		} else {
			selected_members = [...selected_members, userId];
		}
		updateHeaderMode();
	}

	/**
	 * @param {any} member
	 */
	function handleCardClick(member) {
		if (selected_members.length > 0) {
			// In selection mode, toggle selection
			handleLongPress(member.userId);
		} else {
			// Normal mode, open edit sheet
			openEditSheet(member);
		}
	}

	async function handleUpdateMember() {
		if (!selected_member) return;

		try {
			is_loading = true;
			// Convert color from "red-500" format back to "red"
			const color_name = member_color.replace('-500', '');

			await updateMember(
				selected_member.householdId,
				selected_member.userId,
				member_name,
				member_email,
				member_role,
				color_name
			);
			// Refresh members list
			members = await getMembers(appState.current_household_id);
			edit_sheet_open = false;
		} catch (e) {
			console.error('Error updating member:', e);
		} finally {
			is_loading = false;
		}
	}

	async function handleAddMember() {
		try {
			is_loading = true;

			// Validate required fields
			if (!new_member_name.trim() || !new_member_email.trim()) {
				console.error('Name and email are required');
				return;
			}

			// Check if member already exists in household
			const existing_member = members.find(
				(m) => m.email.toLowerCase() === new_member_email.toLowerCase()
			);
			if (existing_member) {
				console.error('Member with this email already exists in household');
				return;
			}

			// Convert color from "red-500" format back to "red"
			const color_name = new_member_color.replace('-500', '');

			await inviteMember(
				appState.current_household_id,
				new_member_email,
				new_member_name,
				new_member_role,
				color_name
			);

			// Refresh members list
			members = await getMembers(appState.current_household_id);
			add_sheet_open = false;
			selected_members = [];
			updateHeaderMode();
		} catch (e) {
			console.error('Error adding member:', e);
		} finally {
			is_loading = false;
		}
	}

	async function handleDeleteMembers() {
		try {
			is_loading = true;

			// Check if trying to delete self
			if (selected_members.includes(appState.current_user_id)) {
				console.error('Cannot delete yourself');
				delete_panel_open = false;
				return;
			}

			// Delete each selected member
			for (const userId of selected_members) {
				await removeMember(appState.current_household_id, userId);
			}

			// Refresh members list
			members = await getMembers(appState.current_household_id);

			// Clear selection and close panel
			selected_members = [];
			delete_panel_open = false;
			updateHeaderMode();
		} catch (e) {
			console.error('Error deleting members:', e);
		} finally {
			is_loading = false;
		}
	}
</script>

<div class="space-y-4">
	<h1 class="text-center text-xl leading-none font-medium">Members</h1>

	{#if members.length === 0}
		<p class="text-gray-600 mt-4 text-sm">No members found.</p>
	{:else}
		<!-- <PrettyJSON data={members} /> -->
		{#each members as member}
			<CardMember
				color={member.color}
				name={member.name}
				role={member.role}
				is_selected={selected_members.includes(member.userId)}
				on_long_press={() => handleLongPress(member.userId)}
				onclick={() => handleCardClick(member)}
			/>
		{/each}
	{/if}
</div>

<Sheet
	bind:sheet_open={edit_sheet_open}
	onsubmit={(e) => {
		e.preventDefault();
		handleUpdateMember();
	}}
>
	<h1 class="text-center text-xl leading-none font-medium">Edit Member</h1>
	<div class="space-y-1">
		<InputLabel text="Full name" for="full-name" />
		<InputText id="full-name" placeholder="Enter full name" bind:value={member_name} />
	</div>

	<div class="space-y-1">
		<InputLabel text="Email address" for="email-address" />
		<InputText
			type="email"
			id="email-address"
			placeholder="Enter email address"
			bind:value={member_email}
		/>
	</div>

	<div class="space-y-1">
		<InputLabel text="Role" for="role" />
		<InputOptions
			options={[
				{ value: 'admin', label: 'Admin' },
				{ value: 'member', label: 'Member' }
			]}
			bind:value={member_role}
		/>
	</div>

	<div class="space-y-1">
		<InputLabel text="Colour" for="color" />
		<MemberSelect id="color" options={color_options} bind:selected_option={member_color} />
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div class="space-y-1">
			<InputLabel text="Joined at" for="joined-at" disabled={true} />
			<InputText
				type="text"
				id="joined-at"
				value={selected_member ? member_joined_at : ''}
				disabled={true}
			/>
		</div>
		<div class="space-y-1">
			<InputLabel text="Updated at" for="updated-at" disabled={true} />
			<InputText
				type="text"
				id="updated-at"
				value={selected_member ? member_updated_at : ''}
				disabled={true}
			/>
		</div>
	</div>
</Sheet>

<Sheet
	bind:sheet_open={add_sheet_open}
	onsubmit={(e) => {
		e.preventDefault();
		handleAddMember();
	}}
>
	<h1 class="text-center text-xl leading-none font-medium">Add Member</h1>
	<div class="space-y-1">
		<InputLabel text="Full name" for="new-full-name" />
		<InputText
			id="new-full-name"
			placeholder="Enter full name"
			bind:value={new_member_name}
			focus_on_load={true}
		/>
	</div>

	<div class="space-y-1">
		<InputLabel text="Email address" for="new-email-address" />
		<InputText
			type="email"
			id="new-email-address"
			placeholder="Enter email address"
			bind:value={new_member_email}
		/>
	</div>

	<div class="space-y-1">
		<InputLabel text="Role" for="new-role" />
		<InputOptions
			options={[
				{ value: 'admin', label: 'Admin' },
				{ value: 'member', label: 'Member' }
			]}
			bind:value={new_member_role}
		/>
	</div>

	<div class="space-y-1">
		<InputLabel text="Colour" for="new-color" />
		<MemberSelect id="new-color" options={color_options} bind:selected_option={new_member_color} />
	</div>
</Sheet>

<Modal bind:is_active={delete_panel_open}>
	<div class="space-y-4">
		<h2 class="text-center text-xl font-semibold">
			Delete Member{selected_members.length > 1 ? 's' : ''}?
		</h2>
		<p>
			Are you sure you want to delete {selected_members.length} member{selected_members.length > 1
				? 's'
				: ''}? This action cannot be undone.
		</p>
		<div class="flex justify-between gap-2">
			<ButtonRound color="secondary" onclick={() => (delete_panel_open = false)}>
				<Icon name="xmark" class="size-5" />
			</ButtonRound>
			<Button color="danger" onclick={handleDeleteMembers}>
				<Icon name="trash" class="size-5" />
				Delete
			</Button>
		</div>
	</div>
</Modal>
