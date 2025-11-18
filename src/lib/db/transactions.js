import { getDB, trackDeviceActivity } from './connection.js';

// CRUD functions for transactions table

/**
 * Create a new transaction.
 * @param {string} monthId - The month ID the transaction belongs to
 * @param {'income' | 'expense'} type - The type of transaction
 * @param {string} userId - The user ID who made the transaction
 * @param {string} name - The name/description of the transaction
 * @param {number} amount - The amount in cents (non-negative)
 * @param {string} category - The category of the transaction
 * @param {string|null} budgetGroup - The budget group (if applicable)
 * @param {number} date - The date of the transaction (timestamp)
 * @param {string} createdBy - The user ID who created the transaction
 * @returns {Promise<{id: string, monthId: string, type: string, userId: string, name: string, amount: number, category: string, budgetGroup: string|null, date: number, createdAt: number, updatedAt: number}>} The created transaction object
 */
export async function createTransaction(
	month_id,
	type,
	user_id,
	name,
	amount,
	category,
	budget_group,
	date,
	created_by
) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	const id = `transaction-${crypto.randomUUID()}`;
	const created_at = Date.now();
	const updated_at = created_at;

	await db.run(
		'INSERT INTO transactions (id, monthId, type, userId, name, amount, category, budgetGroup, date, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
		[
			id,
			month_id,
			type,
			user_id,
			name,
			amount,
			category,
			budget_group,
			date,
			created_by,
			created_at,
			updated_at
		]
	);

	await trackDeviceActivity();
	return {
		id,
		monthId: month_id,
		type,
		userId: user_id,
		name,
		amount,
		category,
		budgetGroup: budget_group,
		date,
		createdAt: created_at,
		updatedAt: updated_at
	};
}

/**
 * Get transactions for a month with limit and offset (for "load more").
 * @param {string} monthId - The month ID
 * @param {number} limit - Number of transactions to load (default 20)
 * @param {number} offset - Number to skip (default 0)
 * @returns {Promise<Array>} Array of transaction objects
 */
export async function getTransactions(month_id, limit = 20, offset = 0) {
	const db = getDB();
	if (!db) return [];

	const result = await db.query(
		`SELECT * FROM transactions 
         WHERE monthId = ? AND deletedAt IS NULL 
         ORDER BY date DESC, createdAt DESC 
         LIMIT ? OFFSET ?`,
		[month_id, limit, offset]
	);
	return result.values || [];
}

/**
 * Get a transaction by ID.
 * @param {string} id - The transaction ID
 * @returns {Promise<{id: string, monthId: string, type: string, userId: string, name: string, amount: number, category: string, budgetGroup: string|null, date: number, createdAt: number, updatedAt: number}|null>} The transaction object or null if not found
 */
export async function getTransaction(id) {
	const db = getDB();
	if (!db) return null;

	const result = await db.query(
		'SELECT * FROM transactions WHERE id = ? AND deletedAt IS NULL',
		[id]
	);
	return result.values?.[0] || null;
}

/**
 * Update a transaction.
 * @param {string} id - The transaction ID
 * @param {Partial<{type: string, userId: string, name: string, amount: number, category: string, budgetGroup: string|null, date: number}>} updates - The fields to update (only whitelisted fields allowed)
 * @returns {Promise<void>}
 */
export async function updateTransaction(id, updates) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	// Whitelist of allowed fields to update
	const allowed_fields = ['type', 'userId', 'name', 'amount', 'category', 'budgetGroup', 'date'];
	
	const fields = Object.keys(updates).filter(field => allowed_fields.includes(field));
	if (fields.length === 0) throw new Error('No valid fields to update');

	// Always update the updatedAt timestamp
	const updated_at = Date.now();
	const set_clause = [...fields.map((field) => `${field} = ?`), 'updatedAt = ?'].join(', ');
	const values = [...fields.map((field) => updates[field]), updated_at];

	await db.run(`UPDATE transactions SET ${set_clause} WHERE id = ?`, [...values, id]);
	await trackDeviceActivity();
}

/**
 * Delete a transaction (soft delete - marks as deleted but keeps record).
 * @param {string} id - The transaction ID to delete
 * @returns {Promise<void>}
 */
export async function deleteTransaction(id) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');
	
	const deleted_at = Date.now();
	await db.run('UPDATE transactions SET deletedAt = ? WHERE id = ?', [deleted_at, id]);
	await trackDeviceActivity();
}

/**
 * Permanently delete a transaction (hard delete - removes from database).
 * @param {string} id - The transaction ID to permanently delete
 * @returns {Promise<void>}
 */
export async function permanentlyDeleteTransaction(id) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');
	
	await db.run('DELETE FROM transactions WHERE id = ?', [id]);
	await trackDeviceActivity();
}

/**
 * Restore a soft-deleted transaction.
 * @param {string} id - The transaction ID to restore
 * @returns {Promise<void>}
 */
export async function restoreTransaction(id) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');
	
	await db.run('UPDATE transactions SET deletedAt = NULL WHERE id = ?', [id]);
	await trackDeviceActivity();
}
