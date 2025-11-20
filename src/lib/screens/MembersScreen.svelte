<script>
	import ButtonRound from '$comps/elements/buttons/ButtonRound.svelte';
	import Icon from '$comps/elements/icons/Icon.svelte';
	import InputLabel from '$comps/elements/inputs/descriptors/InputLabel.svelte';
	import InputDate from '$comps/elements/inputs/InputDate.svelte';
	import InputOptions from '$comps/elements/inputs/InputOptions.svelte';
	import InputText from '$comps/elements/inputs/InputText.svelte';
	import MemberSelect from '$comps/elements/members/MemberSelect.svelte';
	import Sheet from '$comps/elements/Sheet.svelte';
	import CardMember from '$comps/groups/cards/CardMember.svelte';
	import { appState } from '$lib/appState.svelte.js';
	import { getMembers, updateMember } from '$lib/db';
	import { getMemberColors } from '$lib/utils/helpers';
	import { error } from '@sveltejs/kit';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	let members = $state([]);
	let edit_sheet_open = $state(false);
	let selected_member = $state(null);
	let is_loading = $state(false);

	// Form fields
	let member_name = $state('');
	let member_email = $state('');
	let member_role = $state('');
	let member_color = $state('');
	let member_joined_at = $state('');
	let member_updated_at = $state('');

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
	});

	function openEditSheet(member) {
		selected_member = member;
		member_name = member.name;
		member_email = member.email;
		member_role = member.role;
		member_color = `${member.color}-500`;
		member_joined_at = new Date(member.joinedAt).toISOString().split('T')[0];
		member_updated_at = new Date(member.updatedAt).toISOString().split('T')[0];
		edit_sheet_open = true;
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
</script>

<div class="space-y-4">
	<h1 class="mb-1 text-center text-lg leading-none">Members</h1>

	{#if members.length === 0}
		<p class="text-gray-600 mt-4 text-sm">No members found.</p>
	{:else}
		<!-- <pre class="bg-gray-100 mt-4 rounded p-2 text-sm">{JSON.stringify(members, null, 2)}</pre> -->
		{#each members as member}
			<CardMember
				color={member.color}
				name={member.name}
				role={member.role}
				onclick={() => openEditSheet(member)}
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
	<h1 class="mb-1 text-center text-lg leading-none">Edit Member</h1>
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
			<InputDate id="joined-at" value={selected_member ? member_joined_at : ''} disabled={true} />
		</div>
		<div class="space-y-1">
			<InputLabel text="Updated at" for="updated-at" disabled={true} />
			<InputDate id="updated-at" value={selected_member ? member_updated_at : ''} disabled={true} />
		</div>
	</div>
</Sheet>
