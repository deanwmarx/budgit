import { getDB, trackDeviceActivity } from './connection.js';

// CRUD functions for months table

/**
 * Generate a semantic month ID from an end date timestamp.
 * The month ID is YYYY-MM format based on the calendar month the budget period ENDS in.
 * @param {number} end_date - The end date timestamp
 * @returns {string} Month ID in YYYY-MM format (e.g., "2025-10")
 */
function generateMonthId(end_date) {
	const date = new Date(end_date);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	return `${year}-${month}`;
}

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

	// Generate semantic month ID from end date (YYYY-MM format per spec)
	const id = generateMonthId(end_date);
	const created_at = Date.now();
	const updated_at = created_at;

	// Check if month already exists for this household
	const existing = await db.query(
		'SELECT * FROM months WHERE id = ? AND householdId = ?',
		[id, household_id]
	);
	
	if (existing.values && existing.values.length > 0) {
		// Month already exists, return it
		return existing.values[0];
	}

	await db.run(
		'INSERT INTO months (id, householdId, startDate, endDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
		[id, household_id, start_date, end_date, created_at, updated_at]
	);

	await trackDeviceActivity();
	return {
		id,
		householdId: household_id,
		startDate: start_date,
		endDate: end_date,
		createdAt: created_at,
		updatedAt: updated_at
	};
}

/**
 * Get or create a month by ID for a household.
 * @param {string} household_id - The household ID
 * @param {string} month_id - The month ID in YYYY-MM format
 * @param {number} start_date - The start date timestamp (used if creating)
 * @param {number} end_date - The end date timestamp (used if creating)
 * @returns {Promise<{id: string, householdId: string, startDate: number, endDate: number, createdAt: number, updatedAt: number}>} The month object
 */
export async function getOrCreateMonth(household_id, month_id, start_date, end_date) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	// Check if month exists
	const existing = await db.query(
		'SELECT * FROM months WHERE id = ? AND householdId = ?',
		[month_id, household_id]
	);
	
	if (existing.values && existing.values.length > 0) {
		return existing.values[0];
	}

	// Create the month
	return createMonth(household_id, start_date, end_date);
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
 * Get months older than a specific timestamp.
 * @param {string} household_id - The household ID
 * @param {number} before_timestamp - Get months with startDate < this timestamp
 * @param {number} limit - Number of months to return
 * @returns {Promise<Array<{id: string, householdId: string, startDate: number, endDate: number, createdAt: number, updatedAt: number}>>} Array of month objects
 */
export async function getMonthsBefore(household_id, before_timestamp, limit) {
	const db = getDB();
	if (!db) return [];

	const result = await db.query(
		'SELECT * FROM months WHERE householdId = ? AND startDate < ? ORDER BY startDate DESC LIMIT ?',
		[household_id, before_timestamp, limit]
	);
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

	await db.run('UPDATE months SET startDate = ?, endDate = ?, updatedAt = ? WHERE id = ?', [
		start_date,
		end_date,
		updated_at,
		id
	]);

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
 * Create a new budget for a month.
 * Fails if a budget with the same monthId and groupName already exists (UNIQUE constraint).
 * @param {string} month_id - The month ID
 * @param {string} group_name - The budget group name
 * @param {number} amount - The budget amount (in cents)
 * @returns {Promise<{id: string, monthId: string, groupName: string, amount: number, createdAt: number, updatedAt: number}>} The created budget object
 */
export async function addBudget(month_id, group_name, amount) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	if (!group_name || !group_name.trim()) {
		throw new Error('Budget group name is required');
	}

	const id = `budget-${crypto.randomUUID()}`;
	const created_at = Date.now();
	const updated_at = created_at;

	// Plain INSERT - will fail on UNIQUE(monthId, groupName) constraint if duplicate
	await db.run(
		'INSERT INTO budgets (id, monthId, groupName, amount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
		[id, month_id, group_name.trim(), amount, created_at, updated_at]
	);

	await trackDeviceActivity();
	return {
		id,
		monthId: month_id,
		groupName: group_name.trim(),
		amount,
		createdAt: created_at,
		updatedAt: updated_at
	};
}

/**
 * Update an existing budget by ID.
 * @param {string} budget_id - The budget ID
 * @param {number} amount - The new budget amount (in cents)
 * @returns {Promise<void>}
 */
export async function updateBudget(budget_id, amount) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	const updated_at = Date.now();

	const result = await db.run(
		'UPDATE budgets SET amount = ?, updatedAt = ? WHERE id = ?',
		[amount, updated_at, budget_id]
	);

	if (result.changes === 0) {
		throw new Error(`Budget with id ${budget_id} not found`);
	}

	await trackDeviceActivity();
}

/**
 * Get all budgets for a month.
 * @param {string} month_id - The month ID
 * @returns {Promise<Array<{id: string, monthId: string, groupName: string, amount: number, createdAt: number, updatedAt: number}>>} Array of budget objects
 */
export async function getBudgets(month_id) {
	const db = getDB();
	if (!db) return [];

	const result = await db.query('SELECT * FROM budgets WHERE monthId = ? ORDER BY groupName ASC', [
		month_id
	]);
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

	const result = await db.query('SELECT * FROM budgets WHERE monthId = ? AND groupName = ?', [
		month_id,
		group_name
	]);
	return result.values?.[0] || null;
}

/**
 * Delete a budget.
 * @param {string} month_id - The month ID
 * @param {string} budget_id - The budget ID
 * @returns {Promise<void>}
 */
export async function deleteBudget(month_id, budget_id) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	await db.run('DELETE FROM budgets WHERE monthId = ? AND id = ?', [month_id, budget_id]);
	await trackDeviceActivity();
}

/**
 * Get all budgets for a month with their usage (spent amounts from transactions).
 * Only counts variable expense transactions against budgets.
 * @param {string} month_id - The month ID
 * @returns {Promise<Array<{id: string, monthId: string, groupName: string, amount: number, createdAt: number, updatedAt: number, used: number}>>} Array of budget objects with used amounts
 */
export async function getBudgetsWithUsage(month_id) {
	const db = getDB();
	if (!db) return [];

	const result = await db.query(
		`SELECT 
			b.id,
			b.monthId,
			b.groupName,
			b.amount,
			b.createdAt,
			b.updatedAt,
			COALESCE(SUM(t.amount), 0) as used
		FROM budgets b
		LEFT JOIN transactions t ON 
			t.monthId = b.monthId AND 
			t.budgetGroup = b.id AND 
			t.type = 'expense' AND 
			t.category = 'variable' AND 
			t.deletedAt IS NULL
		WHERE b.monthId = ?
		GROUP BY b.id, b.monthId, b.groupName, b.amount, b.createdAt, b.updatedAt
		ORDER BY b.groupName ASC`,
		[month_id]
	);
	return result.values || [];
}
