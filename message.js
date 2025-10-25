const db = require('./db');

class Message {
  // Create a new room
  static createRoom(roomCode, name = 'Chat Room') {
    try {
      const insert = db.prepare(`INSERT INTO rooms (room_code, name) VALUES (?, ?)`);
      const result = insert.run(roomCode, name);
      return result.lastInsertRowid;
    } catch (error) {
      throw error;
    }
  }

  // Get room by code
  static getRoomByCode(roomCode) {
    try {
      const stmt = db.prepare(`SELECT * FROM rooms WHERE room_code = ?`);
      return stmt.get(roomCode);
    } catch (error) {
      throw error;
    }
  }

  // Send a message to a room
  static sendMessage(roomId, senderName, content, messageType = 'text') {
    try {
      const insert = db.prepare(`INSERT INTO messages (room_id, sender_name, content, message_type) VALUES (?, ?, ?, ?)`);
      const result = insert.run(roomId, senderName, content, messageType);

      // Update room updated_at
      const update = db.prepare(`UPDATE rooms SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
      update.run(roomId);

      return result.lastInsertRowid;
    } catch (error) {
      throw error;
    }
  }

  // Get messages for a room
  static getMessages(roomId, limit = 50, offset = 0) {
    try {
      const stmt = db.prepare(`
        SELECT m.*, r.name as room_name
        FROM messages m
        JOIN rooms r ON m.room_id = r.id
        WHERE m.room_id = ?
        ORDER BY m.sent_at DESC
        LIMIT ? OFFSET ?
      `);
      const rows = stmt.all(roomId, limit, offset);
      return rows.reverse(); // Return in chronological order
    } catch (error) {
      throw error;
    }
  }

  // Get all rooms
  static getAllRooms() {
    try {
      const stmt = db.prepare(`
        SELECT r.*,
               (SELECT content FROM messages WHERE room_id = r.id ORDER BY sent_at DESC LIMIT 1) as last_message,
               (SELECT sender_name FROM messages WHERE room_id = r.id ORDER BY sent_at DESC LIMIT 1) as last_sender,
               (SELECT sent_at FROM messages WHERE room_id = r.id ORDER BY sent_at DESC LIMIT 1) as last_message_time,
               (SELECT COUNT(*) FROM messages WHERE room_id = r.id) as message_count
        FROM rooms r
        ORDER BY r.updated_at DESC
      `);
      return stmt.all();
    } catch (error) {
      throw error;
    }
  }

  // Add friend
  static addFriend(userName, friendName) {
    try {
      const insert = db.prepare(`INSERT OR REPLACE INTO friends (user_name, friend_name, status) VALUES (?, ?, 'accepted')`);
      insert.run(userName, friendName);
    } catch (error) {
      throw error;
    }
  }

  // Get user friends
  static getFriends(userName) {
    try {
      const stmt = db.prepare(`
        SELECT friend_name as name, status
        FROM friends
        WHERE user_name = ? AND status = 'accepted'
        UNION
        SELECT user_name as name, status
        FROM friends
        WHERE friend_name = ? AND status = 'accepted'
      `);
      return stmt.all(userName, userName);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Message;
