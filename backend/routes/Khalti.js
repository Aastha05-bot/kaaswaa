const express     = require("express");
const router      = express.Router();
const axios       = require("axios");
const db          = require("../db");
const verifyToken = require("../middleware/auth");

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY; // ✅ read from .env
const KHALTI_INITIATE   = "https://dev.khalti.com/api/v2/epayment/initiate/";
const KHALTI_LOOKUP     = "https://dev.khalti.com/api/v2/epayment/lookup/";

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

    // 2b. Add initial payment record (Pending)
    // This matches COD's behavior where the record is created immediately.
    await db.promise().query(
      "INSERT INTO payments (order_id, payment_method, status) VALUES (?, 'khalti', 'pending')",
      [orderId]
    );

    // 2c. Notify admin and staff
    const [staffUsers] = await db.promise().query("SELECT user_id FROM users WHERE role IN ('admin', 'staff')");
    if (staffUsers && staffUsers.length > 0) {
      const notifMsg = `New order #${orderId} was placed.`;
      const notifValues = staffUsers.map(u => [u.user_id, notifMsg, false]);
      await db.promise().query("INSERT INTO notifications (user_id, message, is_read) VALUES ?", [notifValues]);
    }

    // 3. Initiate Khalti payment
    const payload = {
      return_url:           return_url || `${process.env.FRONTEND_URL}/payment-verify`,
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
        Authorization:  `Key ${KHALTI_SECRET_KEY}`,  // ✅ Capital 'Key'
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
  const { pidx, purchase_order_id } = req.body;
  if (!pidx) return res.status(400).json({ message: "pidx is required." });

  try {
    const verifyRes = await axios.post(
      "https://dev.khalti.com/api/v2/epayment/lookup/",
      { pidx },
      {
        headers: {
          Authorization:  `Key ${KHALTI_SECRET_KEY}`, // ✅ Capital 'Key'
          "Content-Type": "application/json",
        },
      }
    );

    console.log("=== KHALTI VERIFY RESPONSE ===", verifyRes.data);
    const { status, total_amount, transaction_id, purchase_order_id: khaltiOrderId } = verifyRes.data;

    // Use purchase_order_id from frontend if Khalti lookup doesn't return it
    const finalPurchaseOrderId = khaltiOrderId || purchase_order_id;

    if (status !== "Completed") {
      console.log("Payment status not completed:", status);
      return res.status(400).json({ success: false, message: `Payment not completed. Status: ${status}` });
    }

    // Extract order_id
    let orderId = finalPurchaseOrderId;
    if (typeof finalPurchaseOrderId === "string" && finalPurchaseOrderId.toLowerCase().includes("order-")) {
      orderId = parseInt(finalPurchaseOrderId.replace(/order-/i, ""));
    } else {
      orderId = parseInt(finalPurchaseOrderId);
    }

    if (isNaN(orderId)) {
      console.error("Failed to parse orderId from:", finalPurchaseOrderId);
      throw new Error(`Invalid order ID format from Khalti: ${finalPurchaseOrderId}`);
    }

    console.log("Order ID to update:", orderId);

    // 1. Update order status
    try {
      await db.promise().query(
        "UPDATE orders SET order_status = 'processing' WHERE order_id = ?",
        [orderId]
      );
      console.log("Orders table updated ✅");
      
      // Send notification to user
      const [orderRows] = await db.promise().query("SELECT user_id FROM orders WHERE order_id = ?", [orderId]);
      if (orderRows && orderRows.length > 0) {
        const uId = orderRows[0].user_id;
        await db.promise().query(
          "INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, FALSE)",
          [uId, "Your order is being processed"]
        );
      }
    } catch (e) {
      console.error("SQL Error (orders update):", e.message);
      throw new Error(`Failed to update orders table: ${e.message}`);
    }

    // 2. Update payments table
    try {
      await db.promise().query(
        `UPDATE payments 
         SET status = 'completed', transaction_id = ? 
         WHERE order_id = ? AND payment_method = 'khalti'`,
        [transaction_id, orderId]
      );
      console.log("Payments table updated ✅");
    } catch (e) {
      console.error("SQL Error (payments update):", e.message);
      throw new Error(`Failed to update payments table: ${e.message}`);
    }

    // 3. Clear cart
    try {
      const [orderRows] = await db.promise().query(
        "SELECT user_id FROM orders WHERE order_id = ?", [orderId]
      );
      
      if (orderRows && orderRows.length > 0) {
        const uId = orderRows[0].user_id;
        // Simpler delete
        await db.promise().query(
          "DELETE ci FROM cart_items ci JOIN cart c ON ci.cart_id = c.cart_id WHERE c.user_id = ?",
          [uId]
        );
        console.log("Cart cleared for user:", uId, "✅");
      }
    } catch (e) {
      console.error("SQL Error (cart clear):", e.message);
      // Don't fail the whole payment if only cart clearing fails, but log it
    }

    res.json({
      success:        true,
      order_id:       orderId,
      transaction_id,
      amount:         total_amount / 100,
    });

  } catch (err) {
    console.error("=== KHALTI VERIFY ERROR ===");
    console.error("Message:", err.message);
    const detail = err?.response?.data || null;
    if (detail) console.error("Khalti Response:", detail);
    
    res.status(500).json({ 
      message: "Failed to verify or record Khalti payment.",
      error:   err.message,
      detail:  detail
    });
  }
});

module.exports = router;