const express     = require("express");
const router      = express.Router();
const db          = require("../db");
const verifyToken = require("../middleware/auth");

// GET all orders (admin)
router.get("/", (req, res) => {
  const sql = `
    SELECT o.*, u.full_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.user_id
    ORDER BY o.order_date DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(results);
  });
});

// GET orders for logged in user
router.get("/my", verifyToken, (req, res) => {
  db.query(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC",
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(results);
    }
  );
});

// POST place order
router.post("/", verifyToken, (req, res) => {
  const userId = req.user.id;
  const { items, total } = req.body;

  if (!items || !items.length)
    return res.status(400).json({ message: "No items provided" });

  db.query(
    "INSERT INTO orders (user_id, total, order_status) VALUES (?, ?, 'Pending')",
    [userId, total],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Failed to place order" });

      const orderId = result.insertId;
      const orderItems = items.map(i => [orderId, i.product_id, i.quantity, i.unit_price]);

      db.query(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ?",
        [orderItems],
        (err) => {
          if (err) return res.status(500).json({ message: "Failed to save order items" });
          res.status(201).json({ message: "Order placed!", order_id: orderId });
        }
      );
    }
  );
});

// UPDATE order status
router.put("/:order_id", (req, res) => {
  const { order_status } = req.body;
  db.query(
    "UPDATE orders SET order_status = ? WHERE order_id = ?",
    [order_status, req.params.order_id],
    (err) => {
      if (err) return res.status(500).json({ message: "Failed to update order" });
      res.json({ message: "Order updated" });
    }
  );
});

module.exports = router;