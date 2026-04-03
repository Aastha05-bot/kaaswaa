const express     = require("express");
const router      = express.Router();
const db          = require("../db");
const verifyToken = require("../middleware/auth");

/*
  Requires an order_items table (if you don't have it, run this):

  CREATE TABLE order_items (
    order_item_id INT(11)       NOT NULL AUTO_INCREMENT,
    order_id      INT(11)       NOT NULL,
    product_id    INT(11)       NOT NULL,
    quantity      INT(11)       NOT NULL DEFAULT 1,
    price         DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_item_id),
    KEY order_id   (order_id),
    KEY product_id (product_id),
    FOREIGN KEY (order_id)    REFERENCES orders(order_id)     ON DELETE CASCADE,
    FOREIGN KEY (product_id)  REFERENCES product(product_id)  ON DELETE CASCADE
  );

  Also requires a shipping_info table (if you don't have it):

  CREATE TABLE shipping_info (
    shipping_id INT(11)      NOT NULL AUTO_INCREMENT,
    order_id    INT(11)      NOT NULL UNIQUE,
    phone       VARCHAR(20)  NOT NULL,
    city        VARCHAR(100) NOT NULL,
    address     VARCHAR(255) NOT NULL,
    landmark    VARCHAR(255),
    note        TEXT,
    PRIMARY KEY (shipping_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
  );
*/

// ── POST /api/orders  (protected) ────────────────────────
// Places a new order. For COD this is the final step.
// For eSewa/card, payment is confirmed separately via /api/payments.
//
// body: {
//   user_id, total_amount, phone, city, address, landmark, note,
//   payment_method: "cod"|"esewa"|"card",
//   items: [{ product_id, quantity, price }]
// }
router.post("/orders", verifyToken, (req, res) => {
  const {
    user_id, total_amount, phone, city, address,
    landmark = "", note = "", payment_method, items,
  } = req.body;

  if (!user_id || !total_amount || !phone || !city || !address || !payment_method) {
    return res.status(400).json({ message: "Missing required fields." });
  }
  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Order must have at least one item." });
  }

  // 1. Insert into orders
  const orderSql = `
    INSERT INTO orders (user_id, total, order_status)
    VALUES (?, ?, 'Pending')
  `;
  db.query(orderSql, [user_id, total_amount], (err, orderResult) => {
    if (err) {
      console.error("Order insert error:", err);
      return res.status(500).json({ message: "Failed to create order." });
    }

    const orderId = orderResult.insertId;

    // 2. Insert order_items
    const itemValues = items.map((i) => [orderId, i.product_id, i.quantity, i.price]);
    db.query(
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
      [itemValues],
      (err2) => {
        if (err2) {
          console.error("Order items insert error:", err2);
          return res.status(500).json({ message: "Failed to save order items." });
        }

        // 3. Insert shipping_info
        const shippingSql = `
          INSERT INTO shipping_info (order_id, phone, city, address, landmark, note)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(shippingSql, [orderId, phone, city, address, landmark, note], (err3) => {
          if (err3) {
            console.error("Shipping info insert error:", err3);
            // Non-fatal — order is still placed
          }

          // 4. If COD, insert payment record immediately
          if (payment_method === "cod") {
            db.query(
              "INSERT INTO payments (order_id, payment_method) VALUES (?, 'cash')",
              [orderId],
              (err4) => {
                if (err4) console.error("Payment insert error (COD):", err4);
              }
            );
          }

          res.status(201).json({
            message: "Order placed successfully.",
            order_id: orderId,
          });
        });
      }
    );
  });
});

// ── GET /api/orders (admin/staff) ────────────────────────
router.get("/orders", verifyToken, (req, res) => {
  if (req.user.role === "user") {
    return res.status(403).json({ message: "Forbidden. Admins only." });
  }

  const sql = `
    SELECT o.order_id, o.order_date, o.order_status, o.total, o.user_id,
           u.full_name AS user_name,
           s.city, s.address, s.phone,
           p.payment_method
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    LEFT JOIN shipping_info s ON o.order_id = s.order_id
    LEFT JOIN payments p ON o.order_id = p.order_id
    ORDER BY o.order_id DESC
  `;
  
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("ADMIN ORDERS ERROR:", err);
      return res.status(500).json({ message: "Database Error", details: err.sqlMessage });
    }
    res.json(rows);
  });
});

// ── GET /api/orders/detail/:orderId (protected) ─────────
router.get("/orders/detail/:orderId", verifyToken, (req, res) => {
  const orderId = req.params.orderId;
  db.query("SELECT * FROM orders WHERE order_id = ?", [orderId], (err, orders) => {
    if (err || orders.length === 0) return res.status(404).json({ message: "Order not found." });
    const order = orders[0];
    if (order.user_id !== req.user.id && req.user.role === "user") {
      return res.status(403).json({ message: "Forbidden." });
    }
    db.query(
      `SELECT oi.order_id, oi.product_id, oi.quantity, oi.price,
              p.product_name, p.image_url
       FROM order_items oi
       JOIN product p ON oi.product_id = p.product_id
       WHERE oi.order_id = ?`,
      [orderId],
      (err2, items) => {
        if (err2) return res.status(500).json({ message: "Failed to fetch items." });
        res.json({ ...order, items });
      }
    );
  });
});

// ── GET /api/orders/:userId (protected) ─────────────────
router.get("/orders/:userId", verifyToken, (req, res) => {
  if (parseInt(req.params.userId) !== req.user.id) {
    return res.status(403).json({ message: "Forbidden." });
  }

  const sql = `
    SELECT o.order_id, o.order_date, o.order_status, o.total,
           s.city, s.address, s.phone, p.payment_method
    FROM orders o
    LEFT JOIN shipping_info s ON o.order_id = s.order_id
    LEFT JOIN payments p ON o.order_id = p.order_id
    WHERE o.user_id = ?
    ORDER BY o.order_id DESC
  `;
  db.query(sql, [req.params.userId], (err, orders) => {
    if (err) return res.status(500).json({ message: "Failed to fetch orders." });
    if (orders.length === 0) return res.json([]);
    const orderIds = orders.map((o) => o.order_id);
    const itemsSql = `
      SELECT oi.order_id, oi.product_id, oi.quantity, oi.price,
             p.product_name, p.image_url
      FROM order_items oi
      JOIN product p ON oi.product_id = p.product_id
      WHERE oi.order_id IN (?)
    `;
    db.query(itemsSql, [orderIds], (err2, items) => {
      if (err2) return res.status(500).json({ message: "Failed to fetch order items." });
      const itemsByOrder = {};
      items.forEach((item) => {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        itemsByOrder[item.order_id].push(item);
      });
      const result = orders.map((o) => ({
        ...o,
        items: itemsByOrder[o.order_id] || [],
      }));
      res.json(result);
    });
  });
});

// ── PUT /api/orders/:orderId (admin/staff) ───────────────
router.put("/orders/:orderId", verifyToken, (req, res) => {
  if (req.user.role === "user") {
    return res.status(403).json({ message: "Forbidden. Admins only." });
  }
  const { order_status } = req.body;
  const { orderId } = req.params;
  if (!order_status) return res.status(400).json({ message: "Missing order_status" });
  db.query("UPDATE orders SET order_status = ? WHERE order_id = ?", [order_status, orderId], (err) => {
    if (err) return res.status(500).json({ message: "Failed to update order status" });

    // Fetch user_id for notification
    db.query("SELECT user_id FROM orders WHERE order_id = ?", [orderId], (err2, rows) => {
      if (!err2 && rows.length > 0) {
        const userId = rows[0].user_id;
        const msg = `Your order #${orderId} status has been updated to: ${order_status}`;
        db.query("INSERT INTO notifications (user_id, message) VALUES (?, ?)", [userId, msg]);
      }
    });

    res.json({ message: "Order updated successfully" });
  });
});

// ── PUT /api/orders/user/cancel/:orderId (User can cancel)
router.put("/orders/user/cancel/:orderId", verifyToken, (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  // 1. Fetch order to verify ownership and status
  db.query("SELECT * FROM orders WHERE order_id = ?", [orderId], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: "Order not found." });
    
    const order = results[0];
    if (order.user_id !== userId) return res.status(403).json({ message: "Forbidden. Not your order." });
    
    if (order.order_status.toLowerCase() !== "pending") {
      return res.status(400).json({ message: "Cannot cancel order that is already " + order.order_status });
    }

    // 2. Update to Cancelled
    db.query("UPDATE orders SET order_status = 'Cancelled' WHERE order_id = ?", [orderId], (err2) => {
      if (err2) return res.status(500).json({ message: "Failed to cancel order." });
      
      // 3. Optional: Notification for Admin (could be added later)
      res.json({ message: "Order cancelled successfully." });
    });
  });
});

module.exports = router;