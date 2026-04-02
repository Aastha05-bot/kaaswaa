const express     = require("express");
const router      = express.Router();
const db          = require("../db");
const verifyToken = require("../middleware/auth");

// ── GET /api/orders/:userId  (protected) ─────────────────
router.get("/orders/:userId", verifyToken, (req, res) => {
  if (parseInt(req.params.userId) !== req.user.user_id) {
    return res.status(403).json({ message: "Forbidden." });
  }

  const sql = `
    SELECT order_id, user_id, order_date, order_status, total
    FROM orders
    WHERE user_id = ?
    ORDER BY order_date DESC
  `;
  db.query(sql, [req.params.userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Failed to fetch orders." });
    res.json(results);
  });
});

// ── POST /api/cart  (protected) ──────────────────────────
// Places an order — inserts into `orders` table
// body: { user_id, total_amount, items: [{ product_id, quantity, price }] }
router.post("/cart", verifyToken, (req, res) => {
  const { user_id, total_amount } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: "user_id is required." });
  }

  const sql = "INSERT INTO orders (user_id, total, order_status) VALUES (?, ?, 'pending')";
  db.query(sql, [user_id, total_amount || 0], (err, result) => {
    if (err) {
      console.error("Order insert error:", err);
      return res.status(500).json({ message: "Failed to place order." });
    }
    res.status(201).json({ message: "Order placed.", order_id: result.insertId });
  });
});

// ── GET /api/orders  (protected, all orders for admin or current user) ──
router.get("/orders", verifyToken, (req, res) => {
  const userId = req.user.user_id;
  const sql = `
    SELECT order_id, user_id, order_date, order_status, total
    FROM orders
    WHERE user_id = ?
    ORDER BY order_date DESC
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Failed to fetch orders." });
    res.json(results);
  });
});

module.exports = router;