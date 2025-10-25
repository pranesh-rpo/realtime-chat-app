const Database = require('better-sqlite3');
const path = require('path');
const dbPath = process.env.NODE_ENV === 'production' ? ':memory:' : './chat.db';
const db = new Database(dbPath);

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_code TEXT UNIQUE NOT NULL,
      name TEXT DEFAULT 'Chat Room',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      sender_name TEXT NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text', -- 'text', 'image', 'file'
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms (id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_name TEXT NOT NULL,
      friend_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_name, friend_name)
    )
  `);
});

module.exports = db;
