import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const sqlite = new SQLiteConnection(CapacitorSQLite);
const DB_NAME = 'budgit.db';

let db = null;
let current_device_id = null;

export function getDB() {
	return db;
}

export function setCurrentDevice(device_id) {
	current_device_id = device_id;
}

export function getCurrentDevice() {
	return current_device_id;
}

export async function trackDeviceActivity() {
	if (!current_device_id || !db) return;

	try {
		const last_active = Date.now();
		const updated_at = last_active;

		await db.run(
			'UPDATE device_info SET lastActive = ?, updatedAt = ? WHERE deviceId = ?',
			[last_active, updated_at, current_device_id]
		);
	} catch (error) {
		console.error('Failed to track device activity:', error);
	}
}

export async function initDB() {
	try {
		db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
		await db.open();

		// Enable foreign key constraints every time since it does not persist
		await db.execute('PRAGMA foreign_keys = ON;');

		await db.execute(`
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                createdAt INTEGER NOT NULL
            );

			CREATE TABLE IF NOT EXISTS users (
				id TEXT PRIMARY KEY,
				email TEXT NOT NULL UNIQUE,
				name TEXT NOT NULL,
				createdAt INTEGER NOT NULL,
				updatedAt INTEGER NOT NULL
			);

			CREATE TABLE IF NOT EXISTS device_info (
				deviceId TEXT PRIMARY KEY,
				deviceName TEXT NOT NULL,
				userId TEXT NOT NULL,
				lastActive INTEGER NOT NULL,
				createdAt INTEGER NOT NULL,
				updatedAt INTEGER NOT NULL,
				FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
			);
			
			CREATE TABLE IF NOT EXISTS households (
				id TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				budgetCycleStartDay INTEGER NOT NULL,
				createdAt INTEGER NOT NULL,
				updatedAt INTEGER NOT NULL	
			);

			CREATE TABLE IF NOT EXISTS members (
				householdId TEXT NOT NULL,
				userId TEXT NOT NULL,
				role TEXT NOT NULL,
				color TEXT NOT NULL,
				joinedAt INTEGER NOT NULL,
				updatedAt INTEGER NOT NULL,
				PRIMARY KEY (householdId, userId),
				FOREIGN KEY (householdId) REFERENCES households(id) ON DELETE CASCADE,
				FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
			);

			CREATE TABLE IF NOT EXISTS months (
				id TEXT PRIMARY KEY,
				householdId TEXT NOT NULL,
				startDate INTEGER NOT NULL,
				endDate INTEGER NOT NULL,
				createdAt INTEGER NOT NULL,
				updatedAt INTEGER NOT NULL,
				FOREIGN KEY (householdId) REFERENCES households(id) ON DELETE CASCADE
			);

			CREATE TABLE IF NOT EXISTS budgets (
				id TEXT PRIMARY KEY,
				monthId TEXT NOT NULL,
				groupName TEXT NOT NULL,
				amount INTEGER NOT NULL,
				createdAt INTEGER NOT NULL,
				updatedAt INTEGER NOT NULL,
				UNIQUE(monthId, groupName),
				FOREIGN KEY (monthId) REFERENCES months(id) ON DELETE CASCADE
			);

			CREATE TABLE IF NOT EXISTS transactions (
				id TEXT PRIMARY KEY,
				monthId TEXT NOT NULL,
				type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
				userId TEXT NOT NULL,
				name TEXT NOT NULL,
				amount INTEGER NOT NULL CHECK (amount >= 0),
				category TEXT NOT NULL CHECK(
					(type = 'income' AND category IN ('salary', 'one_time')) OR
					(type = 'expense' AND category IN ('fixed', 'variable', 'incidental'))
				),
				budgetGroup TEXT CHECK(
					budgetGroup IS NULL OR
					(type = 'expense' AND category = 'variable')
				),
				date INTEGER NOT NULL,
				createdAt INTEGER NOT NULL,
				updatedAt INTEGER NOT NULL,
				createdBy TEXT NOT NULL,
				deletedAt INTEGER,
				FOREIGN KEY (monthId) REFERENCES months(id) ON DELETE CASCADE,
				FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
				FOREIGN KEY (createdBy) REFERENCES users(id)
			);

			CREATE INDEX IF NOT EXISTS idx_month_type ON transactions(monthId, type);
			CREATE INDEX IF NOT EXISTS idx_month_deleted ON transactions(monthId, deletedAt);
        `);

		console.log('Database initialized with notes table');
		return true;
	} catch (error) {
		console.error('Database init failed:', error);
		return false;
	}
}
