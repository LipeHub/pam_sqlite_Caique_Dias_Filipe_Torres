import { type SQLiteDatabase } from 'expo-sqlite';

export async function initDB(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT 0,
      isImportant BOOLEAN NOT NULL DEFAULT 0,
      isPlanned BOOLEAN NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'Tasks' 
    );
  `);
}