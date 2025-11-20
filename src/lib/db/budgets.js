import { getDB, trackDeviceActivity } from './connection.js';

// CRUD functions for months table

/**
 * Create a new month.
 * @param {string} household_id - The household ID
 * @param {number} start_date - The start date timestamp
 * @param {number} end_date - The end date timestamp
 * @returns {Promise<{id: string, householdId: string, startDate: number, endDate: number, createdAt: number, updatedAt: number}>} The created month object
 */
export async function createMonth(household_id, start_date, end_date) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	const id = `month-${crypto.randomUUID()}`;
	const created_at = Date.now();
	const updated_at = created_at;

	await db.run(
		'INSERT INTO months (id, householdId, startDate, endDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
		[id, household_id, start_date, end_date, created_at, updated_at]
	);

	await trackDeviceActivity();
	return { id, householdId: household_id, startDate: start_date, endDate: end_date, createdAt: created_at, updatedAt: updated_at };
}

/**
 * Get all months for a household.
 * @param {string} household_id - The household ID
 * @param {number} limit - Optional limit (default: all months)
 * @returns {Promise<Array<{id: string, householdId: string, startDate: number, endDate: number, createdAt: number, updatedAt: number}>>} Array of month objects
 */
export async function getMonths(household_id, limit) {
	const db = getDB();
	if (!db) return [];

	const query = limit
		? 'SELECT * FROM months WHERE householdId = ? ORDER BY startDate DESC LIMIT ?'
		: 'SELECT * FROM months WHERE householdId = ? ORDER BY startDate DESC';

	const params = limit ? [household_id, limit] : [household_id];

	const result = await db.query(query, params);
	return result.values || [];
}

/**
 * Get a single month by ID.
 * @param {string} id - The month ID
 * @returns {Promise<{id: string, householdId: string, startDate: number, endDate: number, createdAt: number, updatedAt: number}|null>} The month object or null
 */
export async function getMonth(id) {
	const db = getDB();
	if (!db) return null;

	const result = await db.query('SELECT * FROM months WHERE id = ?', [id]);
	return result.values?.[0] || null;
}

/**
 * Update a month.
 * @param {string} id - The month ID
 * @param {number} start_date - Updated start date timestamp
 * @param {number} end_date - Updated end date timestamp
 * @returns {Promise<void>}
 */
export async function updateMonth(id, start_date, end_date) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	const updated_at = Date.now();

	await db.run(
		'UPDATE months SET startDate = ?, endDate = ?, updatedAt = ? WHERE id = ?',
		[start_date, end_date, updated_at, id]
	);

	await trackDeviceActivity();
}

/**
 * Delete a month (cascade deletes all budgets and transactions).
 * @param {string} id - The month ID to delete
 * @returns {Promise<void>}
 */
export async function deleteMonth(id) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	await db.run('DELETE FROM months WHERE id = ?', [id]);
	await trackDeviceActivity();
}

// CRUD functions for budgets table

/**
 * Create or update a budget for a month.
 * Uses UPSERT pattern since budgets have UNIQUE(monthId, groupName).
 * @param {string} month_id - The month ID
 * @param {string} group_name - The budget group name
 * @param {number} amount - The budget amount (in cents)
 * @returns {Promise<{id: string, monthId: string, groupName: string, amount: number, createdAt: number, updatedAt: number}>} The created/updated budget object
 */
export async function setBudget(month_id, group_name, amount) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	const id = `budget-${crypto.randomUUID()}`;
	const created_at = Date.now();
	const updated_at = created_at;

	// SQLite UPSERT: Insert or replace if conflict on UNIQUE constraint
	await db.run(
		`INSERT INTO budgets (id, monthId, groupName, amount, createdAt, updatedAt) 
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(monthId, groupName) 
		DO UPDATE SET amount = ?, updatedAt = ?`,
		[id, month_id, group_name, amount, created_at, updated_at, amount, updated_at]
	);

	await trackDeviceActivity();
	return { id, monthId: month_id, groupName: group_name, amount, createdAt: created_at, updatedAt: updated_at };
}

/**
 * Get all budgets for a month.
 * @param {string} month_id - The month ID
 * @returns {Promise<Array<{id: string, monthId: string, groupName: string, amount: number, createdAt: number, updatedAt: number}>>} Array of budget objects
 */
export async function getBudgets(month_id) {
	const db = getDB();
	if (!db) return [];

	const result = await db.query(
		'SELECT * FROM budgets WHERE monthId = ? ORDER BY groupName ASC',
		[month_id]
	);
	return result.values || [];
}

/**
 * Get a specific budget by month and group name.
 * @param {string} month_id - The month ID
 * @param {string} group_name - The budget group name
 * @returns {Promise<{id: string, monthId: string, groupName: string, amount: number, createdAt: number, updatedAt: number}|null>} The budget object or null
 */
export async function getBudget(month_id, group_name) {
	const db = getDB();
	if (!db) return null;

	const result = await db.query(
		'SELECT * FROM budgets WHERE monthId = ? AND groupName = ?',
		[month_id, group_name]
	);
	return result.values?.[0] || null;
}

/**
 * Delete a budget.
 * @param {string} month_id - The month ID
 * @param {string} group_name - The budget group name
 * @returns {Promise<void>}
 */
export async function deleteBudget(month_id, group_name) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	await db.run('DELETE FROM budgets WHERE monthId = ? AND groupName = ?', [month_id, group_name]);
	await trackDeviceActivity();
}
