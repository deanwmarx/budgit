import { getDB, trackDeviceActivity } from './connection.js';

// CRUD functions for users table

/**
 * Create a new user.
 * @param {string} email - The user's email (must be unique)
 * @param {string} name - The user's name
 * @returns {Promise<{id: string, email: string, name: string, createdAt: number, updatedAt: number}>} The created user object
 */
export async function createUser(email, name) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	const id = `user-${crypto.randomUUID()}`;
	const created_at = Date.now();
	const updated_at = created_at;

	await db.run(
		'INSERT INTO users (id, email, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
		[id, email, name, created_at, updated_at]
	);

	await trackDeviceActivity();
	return { id, email, name, createdAt: created_at, updatedAt: updated_at };
}

/**
 * Get all users.
 * @returns {Promise<Array<{id: string, email: string, name: string, createdAt: number, updatedAt: number}>>} Array of user objects
 */
export async function getUsers() {
	const db = getDB();
	if (!db) return [];

	const result = await db.query('SELECT * FROM users ORDER BY name ASC');
	return result.values || [];
}

/**
 * Get a single user by ID.
 * @param {string} id - The user ID
 * @returns {Promise<{id: string, email: string, name: string, createdAt: number, updatedAt: number}|null>} The user object or null
 */
export async function getUser(id) {
	const db = getDB();
	if (!db) return null;

	const result = await db.query('SELECT * FROM users WHERE id = ?', [id]);
	return result.values?.[0] || null;
}

/**
 * Get a user by email.
 * @param {string} email - The user's email
 * @returns {Promise<{id: string, email: string, name: string, createdAt: number, updatedAt: number}|null>} The user object or null
 */
export async function getUserByEmail(email) {
	const db = getDB();
	if (!db) return null;

	const result = await db.query('SELECT * FROM users WHERE email = ?', [email]);
	return result.values?.[0] || null;
}

/**
 * Update a user.
 * @param {string} id - The user ID
 * @param {string} email - Updated email
 * @param {string} name - Updated name
 * @returns {Promise<void>}
 */
export async function updateUser(id, email, name) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	const updated_at = Date.now();

	await db.run('UPDATE users SET email = ?, name = ?, updatedAt = ? WHERE id = ?', [
		email,
		name,
		updated_at,
		id
	]);

	await trackDeviceActivity();
}

/**
 * Delete a user (cascade deletes all member associations).
 * @param {string} id - The user ID to delete
 * @returns {Promise<void>}
 */
export async function deleteUser(id) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	await db.run('DELETE FROM users WHERE id = ?', [id]);
	await trackDeviceActivity();
}

/**
 * Get all households that a user belongs to.
 * @param {string} user_id - The user ID
 * @returns {Promise<Array<{id: string, name: string, budgetCycleStartDay: number, role: string, color: string, joinedAt: number}>>} Array of households with member info
 */
export async function getUserHouseholds(user_id) {
	const db = getDB();
	if (!db) return [];

	const result = await db.query(
		`SELECT 
			h.id,
			h.name,
			h.budgetCycleStartDay,
			h.createdAt,
			h.updatedAt,
			m.role,
			m.color,
			m.joinedAt
		FROM households h
		JOIN members m ON h.id = m.householdId
		WHERE m.userId = ?
		ORDER BY m.joinedAt DESC`,
		[user_id]
	);

	return result.values || [];
}

// CRUD functions for device_info table

/**
 * Register or update a device for a user.
 * Uses UPSERT pattern to handle re-registrations.
 * @param {string} device_id - The unique device ID
 * @param {string} device_name - The device name/model
 * @param {string} user_id - The user ID
 * @returns {Promise<{deviceId: string, deviceName: string, userId: string, lastActive: number, createdAt: number, updatedAt: number}>} The device info object
 */
export async function registerDevice(device_id, device_name, user_id) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	const last_active = Date.now();
	const created_at = last_active;
	const updated_at = last_active;

	// UPSERT: Insert new device or update existing one
	await db.run(
		`INSERT INTO device_info (deviceId, deviceName, userId, lastActive, createdAt, updatedAt) 
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(deviceId) 
		DO UPDATE SET deviceName = ?, userId = ?, lastActive = ?, updatedAt = ?`,
		[device_id, device_name, user_id, last_active, created_at, updated_at, device_name, user_id, last_active, updated_at]
	);

	await trackDeviceActivity();
	return { deviceId: device_id, deviceName: device_name, userId: user_id, lastActive: last_active, createdAt: created_at, updatedAt: updated_at };
}

/**
 * Update device last active timestamp.
 * @param {string} device_id - The device ID
 * @returns {Promise<void>}
 */
export async function updateDeviceActivity(device_id) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	const last_active = Date.now();
	const updated_at = last_active;

	await db.run(
		'UPDATE device_info SET lastActive = ?, updatedAt = ? WHERE deviceId = ?',
		[last_active, updated_at, device_id]
	);
}

/**
 * Get all devices for a user.
 * @param {string} user_id - The user ID
 * @returns {Promise<Array<{deviceId: string, deviceName: string, userId: string, lastActive: number, createdAt: number, updatedAt: number}>>} Array of device info objects
 */
export async function getUserDevices(user_id) {
	const db = getDB();
	if (!db) return [];

	const result = await db.query(
		'SELECT * FROM device_info WHERE userId = ? ORDER BY lastActive DESC',
		[user_id]
	);
	return result.values || [];
}

/**
 * Get a device by ID.
 * @param {string} device_id - The device ID
 * @returns {Promise<{deviceId: string, deviceName: string, userId: string, lastActive: number, createdAt: number, updatedAt: number}|null>} The device info object or null
 */
export async function getDevice(device_id) {
	const db = getDB();
	if (!db) return null;

	const result = await db.query('SELECT * FROM device_info WHERE deviceId = ?', [device_id]);
	return result.values?.[0] || null;
}

/**
 * Unregister a device.
 * @param {string} device_id - The device ID to unregister
 * @returns {Promise<void>}
 */
export async function unregisterDevice(device_id) {
	const db = getDB();
	if (!db) throw new Error('Database not initialized');

	await db.run('DELETE FROM device_info WHERE deviceId = ?', [device_id]);
	await trackDeviceActivity();
}
