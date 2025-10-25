const db = require('./db');

class Message {
  // Create a new room
  static createRoom(roomCode, name = 'Chat Room') {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO rooms (room_code, name) VALUES (?, ?)`;
      db.run(sql, [roomCode, name], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // Get room by code
  static getRoomByCode(roomCode) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM rooms WHERE room_code = ?`;
      db.get(sql, [roomCode], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Send a message to a room
  static sendMessage(roomId, senderName, content, messageType = 'text') {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO messages (room_id, sender_name, content, message_type) VALUES (?, ?, ?, ?)`;
      db.run(sql, [roomId, senderName, content, messageType], function(err) {
        if (err) {
          reject(err);
        } else {
          // Update room updated_at
          db.run(`UPDATE rooms SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [roomId]);
          resolve(this.lastID);
        }
      });
    });
  }

  // Get messages for a room
  static getMessages(roomId, limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT m.*, r.name as room_name
        FROM messages m
        JOIN rooms r ON m.room_id = r.id
        WHERE m.room_id = ?
        ORDER BY m.sent_at DESC
        LIMIT ? OFFSET ?
      `;
      db.all(sql, [roomId, limit, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.reverse()); // Return in chronological order
      });
    });
  }

  // Get all rooms
  static getAllRooms() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT r.*,
               (SELECT content FROM messages WHERE room_id = r.id ORDER BY sent_at DESC LIMIT 1) as last_message,
               (SELECT sender_name FROM messages WHERE room_id = r.id ORDER BY sent_at DESC LIMIT 1) as last_sender,
               (SELECT sent_at FROM messages WHERE room_id = r.id ORDER BY sent_at DESC LIMIT 1) as last_message_time,
               (SELECT COUNT(*) FROM messages WHERE room_id = r.id) as message_count
        FROM rooms r
        ORDER BY r.updated_at DESC
      `;
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Add friend
  static addFriend(userName, friendName) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT OR REPLACE INTO friends (user_name, friend_name, status) VALUES (?, ?, 'accepted')`;
      db.run(sql, [userName, friendName], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Get user friends
  static getFriends(userName) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT friend_name as name, status
        FROM friends
        WHERE user_name = ? AND status = 'accepted'
        UNION
        SELECT user_name as name, status
        FROM friends
        WHERE friend_name = ? AND status = 'accepted'
      `;
      db.all(sql, [userName, userName], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = Message;
