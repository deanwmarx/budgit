import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const sqlite = new SQLiteConnection(CapacitorSQLite);
const DB_NAME = 'budgettracker.db';

let db = null;

export function getDB() {
	return db;
}

export async function initDB() {
	if (!Capacitor.isNativePlatform()) {
		console.log('SQLite only available on native platform');
		return false;
	}

	try {
		db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
		await db.open();

		await db.execute(`
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                createdAt INTEGER NOT NULL
            );
        `);

		console.log('Database initialized with notes table');
		return true;
	} catch (error) {
		console.error('Database init failed:', error);
		return false;
	}
}
