import * as SQLite from 'expo-sqlite';

/**
 * Run database migrations
 */
export async function runMigrations(sqlite: SQLite.SQLiteDatabase): Promise<void> {
  try {

    // Migration 1: Add status column to messages table
    try {
      await sqlite.execAsync(`
        ALTER TABLE messages ADD COLUMN status TEXT NOT NULL DEFAULT 'sent';
      `);
    } catch (error) {
      const err = error as Error;
      if (!err.message?.includes('duplicate column name')) {
        console.error('Migration 1 error:', error);
      }
    }

    // Migration 2: Add type column to messages table
    try {
      await sqlite.execAsync(`
        ALTER TABLE messages ADD COLUMN type TEXT NOT NULL DEFAULT 'text';
      `);
    } catch (error) {
      const err = error as Error;
      if (!err.message?.includes('duplicate column name')) {
        console.error('Migration 2 error:', error);
      }
    }

    // Migration 3: Add image_url column to messages table
    try {
      await sqlite.execAsync(`
        ALTER TABLE messages ADD COLUMN image_url TEXT;
      `);
    } catch (error) {
      const err = error as Error;
      if (!err.message?.includes('duplicate column name')) {
        console.error('Migration 3 error:', error);
      }
    }

    // Migration 4: Add edited_at column to messages table
    try {
      await sqlite.execAsync(`
        ALTER TABLE messages ADD COLUMN edited_at INTEGER;
      `);
    } catch (error) {
      const err = error as Error;
      if (!err.message?.includes('duplicate column name')) {
        console.error('Migration 4 error:', error);
      }
    }

    // Migration 5: Add deleted_at column to messages table
    try {
      await sqlite.execAsync(`
        ALTER TABLE messages ADD COLUMN deleted_at INTEGER;
      `);
    } catch (error) {
      const err = error as Error;
      if (!err.message?.includes('duplicate column name')) {
        console.error('Migration 5 error:', error);
      }
    }

    // Migration 6: Add timestamps to chats table
    try {
      await sqlite.execAsync(`
        ALTER TABLE chats ADD COLUMN created_at INTEGER NOT NULL DEFAULT ${Date.now()};
      `);
    } catch (error) {
      const err = error as Error;
      if (!err.message?.includes('duplicate column name')) {
        console.error('Migration 6 error:', error);
      }
    }

    // Migration 7: Add updated_at to chats table
    try {
      await sqlite.execAsync(`
        ALTER TABLE chats ADD COLUMN updated_at INTEGER NOT NULL DEFAULT ${Date.now()};
      `);
    } catch (error) {
      const err = error as Error;
      if (!err.message?.includes('duplicate column name')) {
        console.error('Migration 7 error:', error);
      }
    }

  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}
