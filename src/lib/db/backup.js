import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { getDB, getCurrentDevice } from './connection.js';

/**
 * @typedef {Object} BackupMetadata
 * @property {string} version - Backup format version
 * @property {number} timestamp - When the backup was created
 * @property {string} deviceId - Device that created the backup
 * @property {string[]} householdIds - Households included in backup
 */

/**
 * @typedef {Object} BackupData
 * @property {BackupMetadata} metadata
 * @property {Object} data
 * @property {Array<Object>} data.users
 * @property {Array<Object>} data.device_info
 * @property {Array<Object>} data.households
 * @property {Array<Object>} data.members
 * @property {Array<Object>} data.months
 * @property {Array<Object>} data.budgets
 * @property {Array<Object>} data.transactions
 * @property {Array<Object>} data.sync_meta
 */

const BACKUP_VERSION = '1.0.0';

/**
 * Generate a complete backup of all data for specified households
 * @param {string[]} [householdIds] - Optional array of household IDs to backup. If not provided, backs up all households.
 * @returns {Promise<BackupData>}
 */
export async function generateBackup(householdIds) {
	const db = getDB();
	if (!db) {
		throw new Error('Database not initialized');
	}

	const deviceId = getCurrentDevice();
	const timestamp = Date.now();

	// Get all households if not specified
	/** @type {string[]} */
	let idsToBackup = householdIds || [];
	if (idsToBackup.length === 0) {
		const householdsResult = await db.query('SELECT id FROM households');
		idsToBackup = householdsResult.values?.map((/** @type {{ id: string }} */ h) => h.id) || [];
	}

	// Build placeholders for SQL IN clause
	const placeholders = idsToBackup.map(() => '?').join(',');

	// Fetch all related data - only users/devices that are members of backed-up households
	const [users, deviceInfo, households, members, months, budgets, transactions, syncMeta] =
		await Promise.all([
			// Only users who are members of the backed-up households
			db.query(
				`SELECT DISTINCT u.* FROM users u
				 INNER JOIN members m ON u.id = m.userId
				 WHERE m.householdId IN (${placeholders})`,
				idsToBackup
			),
			// Only device_info for users who are members of backed-up households
			db.query(
				`SELECT DISTINCT d.* FROM device_info d
				 INNER JOIN members m ON d.userId = m.userId
				 WHERE m.householdId IN (${placeholders})`,
				idsToBackup
			),
			db.query(`SELECT * FROM households WHERE id IN (${placeholders})`, idsToBackup),
			db.query(`SELECT * FROM members WHERE householdId IN (${placeholders})`, idsToBackup),
			db.query(`SELECT * FROM months WHERE householdId IN (${placeholders})`, idsToBackup),
			// Budgets and transactions are linked via months
			db.query(
				`SELECT b.* FROM budgets b 
				 INNER JOIN months m ON b.monthId = m.id 
				 WHERE m.householdId IN (${placeholders})`,
				idsToBackup
			),
			db.query(
				`SELECT t.* FROM transactions t 
				 INNER JOIN months m ON t.monthId = m.id 
				 WHERE m.householdId IN (${placeholders})`,
				idsToBackup
			),
			db.query(`SELECT * FROM sync_meta WHERE householdId IN (${placeholders})`, idsToBackup)
		]);

	/** @type {BackupData} */
	const backup = {
		metadata: {
			version: BACKUP_VERSION,
			timestamp,
			deviceId: deviceId || 'unknown',
			householdIds: idsToBackup
		},
		data: {
			users: users.values || [],
			device_info: deviceInfo.values || [],
			households: households.values || [],
			members: members.values || [],
			months: months.values || [],
			budgets: budgets.values || [],
			transactions: transactions.values || [],
			sync_meta: syncMeta.values || []
		}
	};

	return backup;
}

/**
 * Generate a filename for the backup
 * @param {string} [householdName] - Optional household name to include in filename
 * @returns {string}
 */
export function generateBackupFilename(householdName) {
	const date = new Date();
	const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
	const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS

	if (householdName) {
		const safeName = householdName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
		return `budgit_backup_${safeName}_${dateStr}_${timeStr}.json`;
	}

	return `budgit_backup_${dateStr}_${timeStr}.json`;
}

/**
 * Save backup to local device storage (Downloads folder on Android)
 * @param {BackupData} backup - The backup data to save
 * @param {string} [filename] - Optional custom filename
 * @returns {Promise<{ success: boolean, path?: string, filename?: string, error?: string }>}
 */
export async function saveBackupToDevice(backup, filename) {
	try {
		const finalFilename = filename || generateBackupFilename();
		const jsonContent = JSON.stringify(backup, null, 2);

		// Save to External Storage (Downloads on Android) - more accessible to user
		const result = await Filesystem.writeFile({
			path: `Download/${finalFilename}`,
			data: jsonContent,
			directory: Directory.ExternalStorage,
			encoding: Encoding.UTF8
		});

		// Log the backup in backup_log table
		await logBackup(backup.metadata.deviceId, 'local', result.uri, backup.metadata.householdIds);

		return {
			success: true,
			path: result.uri,
			filename: finalFilename
		};
	} catch (error) {
		console.error('Failed to save backup:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error saving backup'
		};
	}
}

/**
 * Create a full backup and save it to local storage
 * @param {string[]} [householdIds] - Optional array of household IDs to backup
 * @param {string} [householdName] - Optional household name for filename
 * @returns {Promise<{ success: boolean, path?: string, filename?: string, error?: string }>}
 */
export async function createLocalBackup(householdIds, householdName) {
	try {
		const backup = await generateBackup(householdIds);
		const filename = generateBackupFilename(householdName);
		return await saveBackupToDevice(backup, filename);
	} catch (error) {
		console.error('Failed to create local backup:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error creating backup'
		};
	}
}

/**
 * Log a backup operation to the backup_log table
 * @param {string} deviceId
 * @param {'local' | 'google_drive'} type
 * @param {string} location
 * @param {string[]} householdIds
 */
async function logBackup(deviceId, type, location, householdIds) {
	const db = getDB();
	if (!db) return;

	try {
		const id = crypto.randomUUID();
		const timestamp = Date.now();

		await db.run(
			`INSERT INTO backup_log (id, deviceId, timestamp, type, location, householdIds) 
			 VALUES (?, ?, ?, ?, ?, ?)`,
			[id, deviceId || 'unknown', timestamp, type, location, JSON.stringify(householdIds)]
		);
	} catch (error) {
		console.error('Failed to log backup:', error);
	}
}

/**
 * Get the backup history from the log
 * @param {number} [limit=10] - Maximum number of records to return
 * @returns {Promise<Array<{ id: string, deviceId: string, timestamp: number, type: string, location: string, householdIds: string[] }>>}
 */
export async function getBackupHistory(limit = 10) {
	const db = getDB();
	if (!db) return [];

	try {
		const result = await db.query(
			'SELECT * FROM backup_log ORDER BY timestamp DESC LIMIT ?',
			[limit]
		);

		return (result.values || []).map((/** @type {any} */ row) => ({
			...row,
			householdIds: JSON.parse(row.householdIds || '[]')
		}));
	} catch (error) {
		console.error('Failed to get backup history:', error);
		return [];
	}
}

/**
 * Read a backup file from device storage
 * @param {string} path - Path to the backup file
 * @returns {Promise<BackupData | null>}
 */
export async function readBackupFile(path) {
	try {
		const result = await Filesystem.readFile({
			path,
			directory: Directory.Documents,
			encoding: Encoding.UTF8
		});

		const content = typeof result.data === 'string' ? result.data : '';
		return JSON.parse(content);
	} catch (error) {
		console.error('Failed to read backup file:', error);
		return null;
	}
}

/**
 * List available backup files in the Documents directory
 * @returns {Promise<Array<{ name: string, uri: string, mtime: number }>>}
 */
export async function listBackupFiles() {
	try {
		const result = await Filesystem.readdir({
			path: '',
			directory: Directory.Documents
		});

		// Filter for budgit backup files
		const backupFiles = (result.files || [])
			.filter((file) => file.name.startsWith('budgit_backup_') && file.name.endsWith('.json'))
			.map((file) => ({
				name: file.name,
				uri: file.uri,
				mtime: file.mtime || 0
			}))
			.sort((a, b) => b.mtime - a.mtime);

		return backupFiles;
	} catch (error) {
		console.error('Failed to list backup files:', error);
		return [];
	}
}

/**
 * @typedef {Object} ImportResult
 * @property {boolean} success
 * @property {string} [error]
 * @property {Object} [stats]
 * @property {number} [stats.usersImported]
 * @property {number} [stats.householdsImported]
 * @property {number} [stats.membersImported]
 * @property {number} [stats.monthsImported]
 * @property {number} [stats.budgetsImported]
 * @property {number} [stats.transactionsImported]
 */

/**
 * Import a backup file with upsert logic (INSERT if not exists, UPDATE if newer)
 * Users are matched by EMAIL (not ID) since emails are unique across devices.
 * A mapping is created from backup user IDs to local user IDs for related records.
 * @param {BackupData} backup - The backup data to import
 * @returns {Promise<ImportResult>}
 */
export async function importBackup(backup) {
	const db = getDB();
	if (!db) {
		return { success: false, error: 'Database not initialized' };
	}

	// Validate backup structure
	if (!backup.metadata || !backup.data) {
		return { success: false, error: 'Invalid backup format' };
	}

	const stats = {
		usersImported: 0,
		householdsImported: 0,
		membersImported: 0,
		monthsImported: 0,
		budgetsImported: 0,
		transactionsImported: 0
	};

	// Mapping from backup user IDs to local user IDs
	/** @type {Map<string, string>} */
	const userIdMap = new Map();

	try {
		// Process in dependency order: users → households → members → months → budgets → transactions

		// 1. Users - match by EMAIL, not ID
		for (const user of backup.data.users || []) {
			/** @type {any} */
			const u = user;
			const result = await upsertUserByEmail(db, u);
			if (result.imported) stats.usersImported++;
			// Map backup user ID to local user ID
			userIdMap.set(u.id, result.localUserId);
		}

		// 2. Households
		for (const household of backup.data.households || []) {
			const imported = await upsertRecord(db, 'households', household, 'id', 'updatedAt');
			if (imported) stats.householdsImported++;
		}

		// 3. Members (composite key) - remap userId
		for (const member of backup.data.members || []) {
			/** @type {any} */
			const m = member;
			const mappedMember = {
				...m,
				userId: userIdMap.get(m.userId) || m.userId
			};
			const imported = await upsertMember(db, mappedMember);
			if (imported) stats.membersImported++;
		}

		// 4. Months
		for (const month of backup.data.months || []) {
			const imported = await upsertRecord(db, 'months', month, 'id', 'updatedAt');
			if (imported) stats.monthsImported++;
		}

		// 5. Budgets
		for (const budget of backup.data.budgets || []) {
			const imported = await upsertRecord(db, 'budgets', budget, 'id', 'updatedAt');
			if (imported) stats.budgetsImported++;
		}

		// 6. Transactions - remap userId and createdBy
		for (const transaction of backup.data.transactions || []) {
			/** @type {any} */
			const t = transaction;
			const mappedTransaction = {
				...t,
				userId: userIdMap.get(t.userId) || t.userId,
				createdBy: userIdMap.get(t.createdBy) || t.createdBy
			};
			const imported = await upsertRecord(db, 'transactions', mappedTransaction, 'id', 'updatedAt');
			if (imported) stats.transactionsImported++;
		}

		// 7. Sync meta (no updatedAt, use lastSyncedAt)
		for (const meta of backup.data.sync_meta || []) {
			await upsertSyncMeta(db, meta);
		}

		// 8. Device info - remap userId
		for (const device of backup.data.device_info || []) {
			/** @type {any} */
			const d = device;
			const mappedDevice = {
				...d,
				userId: userIdMap.get(d.userId) || d.userId
			};
			await upsertRecord(db, 'device_info', mappedDevice, 'deviceId', 'updatedAt');
		}

		return { success: true, stats };
	} catch (error) {
		console.error('Failed to import backup:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error during import'
		};
	}
}

/**
 * Upsert a user by EMAIL (not ID). Returns the local user ID for mapping.
 * @param {any} db
 * @param {Record<string, any>} user
 * @returns {Promise<{imported: boolean, localUserId: string}>}
 */
async function upsertUserByEmail(db, user) {
	const { email, id: backupUserId } = user;
	if (!email) return { imported: false, localUserId: backupUserId };

	// Check if user with this email already exists
	const existing = await db.query('SELECT id, updatedAt FROM users WHERE email = ?', [email]);

	if (existing.values && existing.values.length > 0) {
		// User with this email exists - use their local ID
		const localUserId = existing.values[0].id;
		const existingTimestamp = existing.values[0].updatedAt || 0;
		const backupTimestamp = user.updatedAt || 0;

		if (backupTimestamp > existingTimestamp) {
			// Backup is newer - update (but keep the local ID!)
			await db.run(`UPDATE users SET name = ?, updatedAt = ? WHERE id = ?`, [
				user.name,
				user.updatedAt,
				localUserId
			]);
			return { imported: true, localUserId };
		}
		// Local is newer, skip update but return the mapping
		return { imported: false, localUserId };
	} else {
		// No user with this email - insert with the backup's ID
		const columns = Object.keys(user);
		const placeholders = columns.map(() => '?').join(', ');
		const values = columns.map((col) => user[col]);

		await db.run(`INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders})`, values);
		return { imported: true, localUserId: backupUserId };
	}
}

/**
 * Upsert a record - INSERT if not exists, UPDATE if backup timestamp is newer
 * @param {any} db
 * @param {string} table
 * @param {Record<string, any>} record
 * @param {string} primaryKey
 * @param {string} timestampField
 * @returns {Promise<boolean>} - true if record was inserted or updated
 */
async function upsertRecord(db, table, record, primaryKey, timestampField) {
	const pkValue = record[primaryKey];
	if (!pkValue) return false;

	// Check if record exists
	const existing = await db.query(`SELECT ${timestampField} FROM ${table} WHERE ${primaryKey} = ?`, [
		pkValue
	]);

	if (existing.values && existing.values.length > 0) {
		// Record exists - check if backup is newer
		const existingTimestamp = existing.values[0][timestampField] || 0;
		const backupTimestamp = record[timestampField] || 0;

		if (backupTimestamp > existingTimestamp) {
			// Backup is newer - update
			const columns = Object.keys(record).filter((k) => k !== primaryKey);
			const setClause = columns.map((col) => `${col} = ?`).join(', ');
			const values = columns.map((col) => record[col]);
			values.push(pkValue);

			await db.run(`UPDATE ${table} SET ${setClause} WHERE ${primaryKey} = ?`, values);
			return true;
		}
		return false; // Local is newer or same, skip
	} else {
		// Record doesn't exist - insert
		const columns = Object.keys(record);
		const placeholders = columns.map(() => '?').join(', ');
		const values = columns.map((col) => record[col]);

		await db.run(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`, values);
		return true;
	}
}

/**
 * Upsert a member record (composite primary key)
 * @param {any} db
 * @param {Record<string, any>} member
 * @returns {Promise<boolean>}
 */
async function upsertMember(db, member) {
	const { householdId, userId } = member;
	if (!householdId || !userId) return false;

	const existing = await db.query(
		'SELECT updatedAt FROM members WHERE householdId = ? AND userId = ?',
		[householdId, userId]
	);

	if (existing.values && existing.values.length > 0) {
		const existingTimestamp = existing.values[0].updatedAt || 0;
		const backupTimestamp = member.updatedAt || 0;

		if (backupTimestamp > existingTimestamp) {
			await db.run(
				`UPDATE members SET role = ?, color = ?, joinedAt = ?, updatedAt = ? 
				 WHERE householdId = ? AND userId = ?`,
				[member.role, member.color, member.joinedAt, member.updatedAt, householdId, userId]
			);
			return true;
		}
		return false;
	} else {
		await db.run(
			`INSERT INTO members (householdId, userId, role, color, joinedAt, updatedAt) 
			 VALUES (?, ?, ?, ?, ?, ?)`,
			[householdId, userId, member.role, member.color, member.joinedAt, member.updatedAt]
		);
		return true;
	}
}

/**
 * Upsert sync_meta record
 * @param {any} db
 * @param {Record<string, any>} meta
 */
async function upsertSyncMeta(db, meta) {
	const { householdId } = meta;
	if (!householdId) return;

	const existing = await db.query('SELECT lastSyncedAt FROM sync_meta WHERE householdId = ?', [
		householdId
	]);

	if (existing.values && existing.values.length > 0) {
		const existingTimestamp = existing.values[0].lastSyncedAt || 0;
		const backupTimestamp = meta.lastSyncedAt || 0;

		if (backupTimestamp > existingTimestamp) {
			await db.run(
				`UPDATE sync_meta SET lastSyncedAt = ?, lastSnapshotVersion = ?, lastSnapshotAt = ? 
				 WHERE householdId = ?`,
				[meta.lastSyncedAt, meta.lastSnapshotVersion, meta.lastSnapshotAt, householdId]
			);
		}
	} else {
		await db.run(
			`INSERT INTO sync_meta (householdId, lastSyncedAt, lastSnapshotVersion, lastSnapshotAt) 
			 VALUES (?, ?, ?, ?)`,
			[householdId, meta.lastSyncedAt || 0, meta.lastSnapshotVersion || 0, meta.lastSnapshotAt || 0]
		);
	}
}

/**
 * Parse and import a backup from a JSON string
 * @param {string} jsonContent - The JSON string content of the backup
 * @returns {Promise<ImportResult>}
 */
export async function importBackupFromJson(jsonContent) {
	try {
		const backup = JSON.parse(jsonContent);
		return await importBackup(backup);
	} catch (error) {
		console.error('Failed to parse backup JSON:', error);
		return {
			success: false,
			error: 'Invalid JSON format'
		};
	}
}

/**
 * Open file picker and import the selected backup file
 * @returns {Promise<ImportResult>}
 */
export async function pickAndImportBackup() {
	try {
		const result = await FilePicker.pickFiles({
			types: ['application/json'],
			limit: 1,
			readData: true
		});

		if (!result.files || result.files.length === 0) {
			return { success: false, error: 'No file selected' };
		}

		const file = result.files[0];

		// File data is base64 encoded when readData is true
		if (!file.data) {
			return { success: false, error: 'Could not read file data' };
		}

		// Decode base64 to string
		const jsonContent = atob(file.data);

		return await importBackupFromJson(jsonContent);
	} catch (error) {
		// User cancelled the picker
		if (error instanceof Error && error.message.includes('cancel')) {
			return { success: false, error: 'Cancelled' };
		}
		console.error('Failed to pick and import backup:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error selecting file'
		};
	}
}
