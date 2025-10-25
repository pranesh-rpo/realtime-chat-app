const db = require('./db');

class Order {
  static async placeOrder(userId, shippingAddress) {
    try {
      // Get cart items
      const cartStmt = db.prepare('SELECT c.*, j.name, j.price FROM carts c JOIN jerseys j ON c.jersey_id = j.id WHERE c.user_id = ?');
      const cartItems = cartStmt.all(userId);

      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create order
      const orderStmt = db.prepare('INSERT INTO orders (user_id, total_amount, shipping_address) VALUES (?, ?, ?)');
      const orderResult = orderStmt.run(userId, totalAmount, shippingAddress);
      const orderId = orderResult.lastInsertRowid;

      // Add order items
      const itemStmt = db.prepare('INSERT INTO order_items (order_id, jersey_id, quantity, price) VALUES (?, ?, ?, ?)');
      cartItems.forEach(item => {
        itemStmt.run(orderId, item.jersey_id, item.quantity, item.price);
      });

      // Clear cart
      const clearStmt = db.prepare('DELETE FROM carts WHERE user_id = ?');
      clearStmt.run(userId);

      return { orderId, totalAmount };
    } catch (error) {
      throw error;
    }
  }

  static async getUserOrders(userId) {
    try {
      const stmt = db.prepare(`
        SELECT o.*, oi.quantity, oi.price, j.name as jersey_name
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN jerseys j ON oi.jersey_id = j.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
      `);
      return stmt.all(userId);
    } catch (error) {
      throw error;
    }
  }

  static async updateOrderStatus(orderId, status) {
    try {
      const stmt = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
      const result = stmt.run(status, orderId);
      return { changes: result.changes };
    } catch (error) {
      throw error;
    }
  }

  static async getAllOrders() {
    try {
      const stmt = db.prepare(`
        SELECT o.*, u.username, u.email
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
      `);
      return stmt.all();
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Order;
