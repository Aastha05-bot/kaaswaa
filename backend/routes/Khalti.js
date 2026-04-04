const express     = require("express");
const router      = express.Router();
const axios       = require("axios");
const db          = require("../db");
const verifyToken = require("../middleware/auth");

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY; // ✅ read from .env
const KHALTI_INITIATE   = "https://khalti.com/api/v2/epayment/initiate/";

// ── POST /api/khalti/initiate ─────────────────────────────
router.post("/khalti/initiate", verifyToken, async (req, res) => {
  const { user_id, total_amount, items, address_id, address, phone, city, return_url } = req.body;

  if (!total_amount || !items?.length) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    // 1. Save pending order in DB with status 'pending'
    const [orderResult] = await db.promise().query(
      "INSERT INTO orders (user_id, total, order_status, address_id) VALUES (?, ?, 'pending', ?)",
      [user_id, total_amount, address_id]
    );
    const orderId = orderResult.insertId;

    // 2. Save order items
    const itemValues = items.map(i => [orderId, i.product_id, i.quantity, i.price]);
    await db.promise().query(
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
      [itemValues]
    );

    // 3. Initiate Khalti payment
    const payload = {
      return_url:           return_url || `${process.env.FRONTEND_URL}/payment/verify`,
      website_url:          process.env.FRONTEND_URL || "http://localhost:5173",
      amount:               Math.round(total_amount * 100), // paisa
      purchase_order_id:    `ORDER-${orderId}`,
      purchase_order_name:  "Kaa Swaa Order",
      customer_info: {
        name:  req.user.username || "Customer",
        email: req.user.email    || "customer@example.com",
        phone: phone             || "9800000000",
      },
    };

    console.log("=== KHALTI PAYLOAD ===", payload);
    console.log("=== USING KEY ===", KHALTI_SECRET_KEY ? "Key loaded ✅" : "Key MISSING ❌");

    const khaltiRes = await axios.post(KHALTI_INITIATE, payload, {
      headers: {
        Authorization:  `key ${KHALTI_SECRET_KEY}`,  // ✅ lowercase 'key'
        "Content-Type": "application/json",
      },
    });

    console.log("=== KHALTI INITIATION SUCCESS ===");
    console.log("Status:", khaltiRes.status);
    console.log("Payment URL:", khaltiRes.data.payment_url);
    console.log("pidx:", khaltiRes.data.pidx);

    res.json({
      payment_url: khaltiRes.data.payment_url,
      pidx:        khaltiRes.data.pidx,
      order_id:    orderId,
    });

  } catch (err) {
    console.error("=== KHALTI INITIATE ERROR ===");
    console.error("Message:", err.message);
    console.error("Khalti response:", err?.response?.data);
    console.error("Stack:", err.stack);
    res.status(500).json({
      message: "Failed to initiate Khalti payment.",
      error:   err.message,
      detail:  err?.response?.data || null,
    });
  }
});

// ── POST /api/khalti/verify ───────────────────────────────
router.post("/khalti/verify", verifyToken, async (req, res) => {
  const { pidx } = req.body;
  if (!pidx) return res.status(400).json({ message: "pidx is required." });

  try {
    const verifyRes = await axios.post(
      "https://khalti.com/api/v2/epayment/lookup/",
      { pidx },
      {
        headers: {
          Authorization:  `key ${KHALTI_SECRET_KEY}`, // ✅ lowercase 'key'
          "Content-Type": "application/json",
        },
      }
    );

    const { status, total_amount, transaction_id, purchase_order_id } = verifyRes.data;

    if (status !== "Completed") {
      return res.status(400).json({ success: false, message: `Payment not completed. Status: ${status}` });
    }

    // Extract order_id from purchase_order_id (format: "ORDER-123")
    const orderId = parseInt(purchase_order_id.replace("ORDER-", ""));

    // Update order status to processing
    await db.promise().query(
      "UPDATE orders SET order_status = 'processing' WHERE order_id = ?",
      [orderId]
    );

    // Record in payments table
    await db.promise().query(
      `INSERT INTO payments (order_id, payment_method, status, transaction_id)
       VALUES (?, 'khalti', 'completed', ?)
       ON DUPLICATE KEY UPDATE status = 'completed', transaction_id = ?`,
      [orderId, transaction_id, transaction_id]
    );

    // Clear user's cart from DB
    const [orderRows] = await db.promise().query(
      "SELECT user_id FROM orders WHERE order_id = ?", [orderId]
    );
    if (orderRows.length) {
      await db.promise().query(
        "DELETE FROM cart_items WHERE cart_id IN (SELECT cart_id FROM cart WHERE user_id = ?)",
        [orderRows[0].user_id]
      );
    }

    res.json({
      success:        true,
      order_id:       orderId,
      transaction_id,
      amount:         total_amount / 100,
    });

  } catch (err) {
    console.error("Khalti verify error:", err?.response?.data || err.message);
    res.status(500).json({ message: "Failed to verify payment." });
  }
});

module.exports = router;