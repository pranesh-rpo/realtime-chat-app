const db = require('./db');

class Order {
  static async placeOrder(userId, shippingAddress) {
    return new Promise((resolve, reject) => {
      // Get cart items
      db.all('SELECT c.*, j.name, j.price FROM carts c JOIN jerseys j ON c.jersey_id = j.id WHERE c.user_id = ?', [userId], (err, cartItems) => {
        if (err) {
          return reject(err);
        }

        if (cartItems.length === 0) {
          return reject(new Error('Cart is empty'));
        }

        const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create order
        db.run('INSERT INTO orders (user_id, total_amount, shipping_address) VALUES (?, ?, ?)', [userId, totalAmount, shippingAddress], function(err) {
          if (err) {
            return reject(err);
          }

          const orderId = this.lastID;

          // Add order items
          const stmt = db.prepare('INSERT INTO order_items (order_id, jersey_id, quantity, price) VALUES (?, ?, ?, ?)');
          cartItems.forEach(item => {
            stmt.run(orderId, item.jersey_id, item.quantity, item.price);
          });
          stmt.finalize();

          // Clear cart
          db.run('DELETE FROM carts WHERE user_id = ?', [userId], (err) => {
            if (err) {
              console.error('Failed to clear cart:', err);
            }
          });

          resolve({ orderId, totalAmount });
        });
      });
    });
  }

  static async getUserOrders(userId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT o.*, oi.quantity, oi.price, j.name as jersey_name
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN jerseys j ON oi.jersey_id = j.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
      `, [userId], (err, orders) => {
        if (err) {
          reject(err);
        } else {
          resolve(orders);
        }
      });
    });
  }

  static async updateOrderStatus(orderId, status) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE orders SET status = ? WHERE id = ?', [status, orderId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  static async getAllOrders() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT o.*, u.username, u.email
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
      `, [], (err, orders) => {
        if (err) {
          reject(err);
        } else {
          resolve(orders);
        }
      });
    });
  }
}

module.exports = Order;
