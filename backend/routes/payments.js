const express     = require("express");
const router      = express.Router();
const db          = require("../db");
const verifyToken = require("../middleware/auth");


// ── POST /api/payments  (protected) ──────────────────────
// Called after eSewa / Card payment is confirmed on the frontend.
// body: { order_id, payment_method: "esewa"|"card"|"cash" }
router.post("/payments", verifyToken, (req, res) => {
  const { order_id, payment_method } = req.body;

  if (!order_id || !payment_method) {
    return res.status(400).json({ message: "order_id and payment_method are required." });
  }

  const validMethods = ["cash", "card", "esewa", "khalti"];
  if (!validMethods.includes(payment_method)) {
    return res.status(400).json({ message: `payment_method must be one of: ${validMethods.join(", ")}` });
  }

  // Verify the order belongs to the logged-in user
  db.query(
    "SELECT order_id, user_id, order_status FROM orders WHERE order_id = ?",
    [order_id],
    (err, orders) => {
      if (err || orders.length === 0) {
        return res.status(404).json({ message: "Order not found." });
      }
      if (orders[0].user_id !== req.user.id) {
        return res.status(403).json({ message: "Forbidden." });
      }

      // Check payment doesn't already exist
      db.query(
        "SELECT payment_id FROM payments WHERE order_id = ?",
        [order_id],
        (err2, existing) => {
          if (err2) return res.status(500).json({ message: "DB error." });
          if (existing.length > 0) {
            return res.status(409).json({ message: "Payment already recorded for this order." });
          }

          // Insert payment record
          db.query(
            "INSERT INTO payments (order_id, payment_method) VALUES (?, ?)",
            [order_id, payment_method],
            (err3, result) => {
              if (err3) {
                console.error("Payment insert error:", err3);
                return res.status(500).json({ message: "Failed to record payment." });
              }

              // Update order status to 'processing' after payment
              db.query(
                "UPDATE orders SET order_status = 'processing' WHERE order_id = ?",
                [order_id],
                (err4) => {
                  if (err4) console.error("Order status update error:", err4);
                }
              );

              res.status(201).json({
                message:    "Payment recorded successfully.",
                payment_id: result.insertId,
                order_id,
              });
            }
          );
        }
      );
    }
  );
});

// ── GET /api/payments/:orderId  (protected) ──────────────
router.get("/payments/:orderId", verifyToken, (req, res) => {
  const orderId = req.params.orderId;

  // Verify ownership
  db.query(
    "SELECT user_id FROM orders WHERE order_id = ?",
    [orderId],
    (err, orders) => {
      if (err || orders.length === 0) return res.status(404).json({ message: "Order not found." });
      if (orders[0].user_id !== req.user.id) return res.status(403).json({ message: "Forbidden." });

      db.query(
        "SELECT * FROM payments WHERE order_id = ?",
        [orderId],
        (err2, payments) => {
          if (err2) return res.status(500).json({ message: "Failed to fetch payment." });
          res.json(payments[0] || null);
        }
      );
    }
  );
});

module.exports = router;