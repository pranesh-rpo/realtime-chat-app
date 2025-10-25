const db = require('./db');

function addToCart(userId, jerseyId, quantity = 1) {
  try {
    // Check if item already in cart
    const selectStmt = db.prepare("SELECT * FROM carts WHERE user_id = ? AND jersey_id = ?");
    const row = selectStmt.get(userId, jerseyId);

    if (row) {
      // Update quantity
      const updateStmt = db.prepare("UPDATE carts SET quantity = quantity + ? WHERE id = ?");
      updateStmt.run(quantity, row.id);
      return { id: row.id, user_id: userId, jersey_id: jerseyId, quantity: row.quantity + quantity };
    } else {
      // Insert new item
      const insertStmt = db.prepare("INSERT INTO carts (user_id, jersey_id, quantity) VALUES (?, ?, ?)");
      const result = insertStmt.run(userId, jerseyId, quantity);
      return { id: result.lastInsertRowid, user_id: userId, jersey_id: jerseyId, quantity };
    }
  } catch (error) {
    throw error;
  }
}

function getCart(userId) {
  try {
    const stmt = db.prepare(`
      SELECT c.id, c.quantity, c.added_at, j.id as jersey_id, j.name, j.price, j.image, j.description
      FROM carts c
      JOIN jerseys j ON c.jersey_id = j.id
      WHERE c.user_id = ?
    `);
    return stmt.all(userId);
  } catch (error) {
    throw error;
  }
}

function removeFromCart(cartId, userId) {
  try {
    const stmt = db.prepare("DELETE FROM carts WHERE id = ? AND user_id = ?");
    const result = stmt.run(cartId, userId);
    return { deleted: result.changes > 0 };
  } catch (error) {
    throw error;
  }
}

function updateCartQuantity(cartId, userId, quantity) {
  try {
    if (quantity <= 0) {
      return removeFromCart(cartId, userId);
    } else {
      const stmt = db.prepare("UPDATE carts SET quantity = ? WHERE id = ? AND user_id = ?");
      const result = stmt.run(quantity, cartId, userId);
      return { updated: result.changes > 0 };
    }
  } catch (error) {
    throw error;
  }
}

module.exports = {
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity
};
