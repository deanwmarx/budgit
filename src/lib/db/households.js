import { getDB, trackDeviceActivity } from './connection.js';

// CRUD functions for households and members table

/**
 * Create a new household.
 * @param {string} name - The name of the household
 * @param {number} budget_cycle_start_day - Day of month when budget cycle starts (1-31)
 * @returns {Promise<{id: string, name: string, budgetCycleStartDay: number, createdAt: number, updatedAt: number}>} The created household object
 */
export async function createHousehold(name, budget_cycle_start_day) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	const id = `household-${crypto.randomUUID()}`;
	const created_at = Date.now();
	const updated_at = created_at;

	await db.run(
		'INSERT INTO households (id, name, budgetCycleStartDay, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
		[id, name, budget_cycle_start_day, created_at, updated_at]
	);

	await trackDeviceActivity();
	return { id, name, budgetCycleStartDay: budget_cycle_start_day, createdAt: created_at, updatedAt: updated_at };
}

/**
 * Get all households.
 * @returns {Promise<Array<{id: string, name: string, budgetCycleStartDay: number, createdAt: number, updatedAt: number}>>} Array of household objects
 */
export async function getHouseholds() {
	const db = getDB();
	if (!db) return [];

	const result = await db.query('SELECT * FROM households ORDER BY createdAt DESC');
	return result.values || [];
}

/**
 * Update a household.
 * @param {string} id - The household ID
 * @param {string} name - The updated name
 * @param {number} budget_cycle_start_day - Updated day of month when budget cycle starts (1-31)
 * @returns {Promise<void>}
 */
export async function updateHousehold(id, name, budget_cycle_start_day) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	const updated_at = Date.now();

	await db.run(
		'UPDATE households SET name = ?, budgetCycleStartDay = ?, updatedAt = ? WHERE id = ?',
		[name, budget_cycle_start_day, updated_at, id]
	);

	await trackDeviceActivity();
}

/**
 * Delete a household (cascade deletes all members, months, budgets, and transactions).
 * @param {string} id - The household ID to delete
 * @returns {Promise<void>}
 */
export async function deleteHousehold(id) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	await db.run('DELETE FROM households WHERE id = ?', [id]);
	await trackDeviceActivity();
}

// CRUD functions for members table

/**
 * Add a member to a household.
 * @param {string} household_id - The household ID
 * @param {string} user_id - The user ID
 * @param {string} role - Member role (e.g., 'owner', 'admin', 'member')
 * @param {string} color - Display color for the member
 * @returns {Promise<{householdId: string, userId: string, role: string, color: string, joinedAt: number, updatedAt: number}>} The created member object
 */
export async function addMember(household_id, user_id, role, color) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');
	
	const joined_at = Date.now();
	const updated_at = joined_at;
	
	await db.run(
		'INSERT INTO members (householdId, userId, role, color, joinedAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
		[household_id, user_id, role, color, joined_at, updated_at]
	);

	await trackDeviceActivity();
	return { householdId: household_id, userId: user_id, role, color, joinedAt: joined_at, updatedAt: updated_at };
}

/**
 * Get all members of a household.
 * @param {string} household_id - The household ID
 * @returns {Promise<Array<{householdId: string, userId: string, role: string, color: string, joinedAt: number, updatedAt: number}>>} Array of member objects
 */
export async function getMembers(household_id) {
	const db = getDB();
	if (!db) return [];
	
	const result = await db.query(
		'SELECT * FROM members WHERE householdId = ? ORDER BY joinedAt DESC',
		[household_id]
	);
	return result.values || [];
}

/**
 * Update a member of a household.
 * @param {string} household_id - The household ID
 * @param {string} user_id - The user ID
 * @param {string} role - Updated member role
 * @param {string} color - Updated display color
 * @returns {Promise<void>}
 */
export async function updateMember(household_id, user_id, role, color) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');
	
	const updated_at = Date.now();
	
	await db.run(
		'UPDATE members SET role = ?, color = ?, updatedAt = ? WHERE householdId = ? AND userId = ?',
		[role, color, updated_at, household_id, user_id]
	);

	await trackDeviceActivity();
}

/**
 * Remove a member from a household.
 * @param {string} household_id - The household ID
 * @param {string} user_id - The user ID to remove
 * @returns {Promise<void>}
 */
export async function removeMember(household_id, user_id) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	await db.run('DELETE FROM members WHERE householdId = ? AND userId = ?', [household_id, user_id]);
	await trackDeviceActivity();
}