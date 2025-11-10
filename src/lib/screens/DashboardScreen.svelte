<script>
	import { onMount } from 'svelte';
	import { Capacitor } from '@capacitor/core';
	import { initDB, createNote, getNotes, updateNote, deleteNote } from '$lib/db';

	let isNative = Capacitor.isNativePlatform();
	let notes = $state([]);
	let loading = $state(false);
	let showForm = $state(false);
	let editingNote = $state(null);
	let title = $state('');
	let content = $state('');

	onMount(async () => {
		if (isNative) {
			await initDB();
			await loadNotes();
		}
	});

	async function loadNotes() {
		loading = true;
		notes = await getNotes();
		loading = false;
	}

	async function handleSubmit() {
		if (!title.trim() || !content.trim()) {
			alert('Please fill in all fields');
			return;
		}

		loading = true;
		try {
			if (editingNote) {
				await updateNote(editingNote.id, title, content);
			} else {
				await createNote(title, content);
			}
			await loadNotes();
			resetForm();
		} catch (error) {
			console.error('Failed to save note:', error);
			alert('Failed to save note');
		}
		loading = false;
	}

	async function handleDelete(id) {
		if (!confirm('Delete this note?')) return;

		loading = true;
		try {
			await deleteNote(id);
			await loadNotes();
		} catch (error) {
			console.error('Failed to delete note:', error);
			alert('Failed to delete note');
		}
		loading = false;
	}

	function handleEdit(note) {
		editingNote = note;
		title = note.title;
		content = note.content;
		showForm = true;
	}

	function resetForm() {
		showForm = false;
		editingNote = null;
		title = '';
		content = '';
	}
</script>

<div class="p-4">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Dashboard - Notes CRUD Test</h1>
		{#if !showForm}
			<button
				onclick={() => (showForm = true)}
				class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
			>
				+ New Note
			</button>
		{/if}
	</div>

	{#if !isNative}
		<div class="rounded border border-yellow-400 bg-yellow-100 px-4 py-3 text-yellow-700">
			<p class="font-bold">Native Platform Required</p>
			<p class="mt-1 text-sm">SQLite only works on Android/iOS.</p>
		</div>
	{:else if showForm}
		<div class="mb-6 rounded-lg bg-grey-900 p-6">
			<h2 class="mb-4 text-xl font-semibold">
				{editingNote ? 'Edit Note' : 'New Note'}
			</h2>
			<div class="space-y-4">
				<div>
					<label for="title" class="mb-1 block text-sm font-medium">Title</label>
					<input
						id="title"
						type="text"
						bind:value={title}
						placeholder="Note title"
						class="w-full rounded border p-3"
						disabled={loading}
					/>
				</div>
				<div>
					<label for="content" class="mb-1 block text-sm font-medium">Content</label>
					<textarea
						id="content"
						bind:value={content}
						placeholder="Note content"
						rows="6"
						class="w-full rounded border p-3"
						disabled={loading}
					></textarea>
				</div>
				<div class="flex gap-2">
					<button
						onclick={handleSubmit}
						disabled={loading}
						class="flex-1 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
					>
						{loading ? 'Saving...' : editingNote ? 'Update' : 'Create'}
					</button>
					<button
						onclick={resetForm}
						disabled={loading}
						class="rounded border border-grey-700 px-4 py-2 hover:bg-grey-800 disabled:opacity-50"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if loading && !showForm}
		<p class="text-center text-gray-400">Loading...</p>
	{:else if notes.length === 0}
		<p class="text-center text-gray-400">No notes yet. Create one to get started!</p>
	{:else}
		<div class="space-y-4">
			{#each notes as note (note.id)}
				<div class="rounded-lg bg-grey-900 p-4">
					<div class="mb-2 flex items-start justify-between">
						<h3 class="text-lg font-semibold">{note.title}</h3>
						<div class="flex gap-2">
							<button
								onclick={() => handleEdit(note)}
								class="text-sm text-blue-400 hover:text-blue-300"
							>
								Edit
							</button>
							<button
								onclick={() => handleDelete(note.id)}
								class="text-sm text-red-400 hover:text-red-300"
							>
								Delete
							</button>
						</div>
					</div>
					<p class="mb-2 whitespace-pre-wrap text-gray-300">{note.content}</p>
					<p class="text-xs text-gray-500">
						{new Date(note.createdAt).toLocaleString()}
					</p>
				</div>
			{/each}
		</div>
	{/if}
</div>
