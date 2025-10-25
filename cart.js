const db = require('./db');

function addToCart(userId, jerseyId, quantity = 1) {
  return new Promise((resolve, reject) => {
    // Check if item already in cart
    db.get("SELECT * FROM carts WHERE user_id = ? AND jersey_id = ?", [userId, jerseyId], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        // Update quantity
        db.run("UPDATE carts SET quantity = quantity + ? WHERE id = ?", [quantity, row.id], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: row.id, user_id: userId, jersey_id: jerseyId, quantity: row.quantity + quantity });
          }
        });
      } else {
        // Insert new item
        db.run("INSERT INTO carts (user_id, jersey_id, quantity) VALUES (?, ?, ?)", [userId, jerseyId, quantity], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, user_id: userId, jersey_id: jerseyId, quantity });
          }
        });
      }
    });
  });
}

function getCart(userId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT c.id, c.quantity, c.added_at, j.id as jersey_id, j.name, j.price, j.image, j.description
      FROM carts c
      JOIN jerseys j ON c.jersey_id = j.id
      WHERE c.user_id = ?
    `;
    db.all(query, [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function removeFromCart(cartId, userId) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM carts WHERE id = ? AND user_id = ?", [cartId, userId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ deleted: this.changes > 0 });
      }
    });
  });
}

function updateCartQuantity(cartId, userId, quantity) {
  return new Promise((resolve, reject) => {
    if (quantity <= 0) {
      removeFromCart(cartId, userId).then(resolve).catch(reject);
    } else {
      db.run("UPDATE carts SET quantity = ? WHERE id = ? AND user_id = ?", [quantity, cartId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ updated: this.changes > 0 });
        }
      });
    }
  });
}

module.exports = {
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity
};
