const express     = require("express");
const router      = express.Router();
const db          = require("../db");
const verifyToken = require("../middleware/auth");

// ── POST /api/orders ─────────────────────────────────────
// Creates an order in `orders` table and line items in `cart_items`
// Body: { user_id, total_amount, items: [{ product_id, quantity, price }] }
router.post("/orders", verifyToken, (req, res) => {
  const { user_id, total_amount, items = [] } = req.body;

  if (!user_id)            return res.status(400).json({ message: "user_id is required." });
  if (items.length === 0)  return res.status(400).json({ message: "No items provided." });

  // Step 1: Insert into orders table
  const orderSql = "INSERT INTO orders (user_id, total, order_status) VALUES (?, ?, 'pending')";
  db.query(orderSql, [user_id, total_amount || 0], (err, orderResult) => {
    if (err) {
      console.error("Order insert error:", err);
      return res.status(500).json({ message: "Failed to place order." });
    }

    const orderId = orderResult.insertId;

    // Step 2: Insert line items into cart_items table
    // cart_items: cart_id (reused as order_id here), product_id, quantity
    const itemValues = items.map((item) => [orderId, item.product_id, item.quantity || 1]);

    db.query(
      "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ?",
      [itemValues],
      (err2) => {
        if (err2) {
          console.error("cart_items insert error:", err2);
          // Order was created — still return success
        }
        res.status(201).json({ message: "Order placed.", order_id: orderId });
      }
    );
  });
});

// ── GET /api/orders/:userId ───────────────────────────────
// Fetch all orders for a user
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

module.exports = router;