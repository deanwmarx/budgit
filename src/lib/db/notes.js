import { getDB, trackDeviceActivity } from './connection.js';

export async function createNote(title, content) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	const id = `note-${crypto.randomUUID()}`;
	const createdAt = Date.now();

	await db.run('INSERT INTO notes (id, title, content, createdAt) VALUES (?, ?, ?, ?)', [
		id,
		title,
		content,
		createdAt
	]);

	await trackDeviceActivity();
	return { id, title, content, createdAt };
}

export async function getNotes() {
	const db = getDB();
	if (!db) return [];

	const result = await db.query('SELECT * FROM notes ORDER BY createdAt DESC');
	return result.values || [];
}

export async function updateNote(id, title, content) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	await db.run('UPDATE notes SET title = ?, content = ? WHERE id = ?', [title, content, id]);
	await trackDeviceActivity();
}

export async function deleteNote(id) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	await db.run('DELETE FROM notes WHERE id = ?', [id]);
	await trackDeviceActivity();
}
