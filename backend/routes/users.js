const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/auth");
const bcrypt = require("bcryptjs");

// GET all users (only from users table)
router.get("/", (req, res) => {
  db.query(
    "SELECT user_id, full_name, email, phone, created_at FROM users",
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(results);
    }
  );
});

// GET /profile/:id — Fetch a single user's profile
router.get("/profile/:id", verifyToken, (req, res) => {
  if (parseInt(req.params.id) !== req.user.id) return res.status(403).json({ message: "Forbidden" });
  
  db.query(
    "SELECT full_name, email, phone, address FROM users WHERE user_id = ?",
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database Error" });
      if (results.length === 0) return res.status(404).json({ message: "User not found" });
      res.json(results[0]);
    }
  );
});

// PUT /update/:id — Update Personal Information
router.put("/update/:id", verifyToken, (req, res) => {
  if (parseInt(req.params.id) !== req.user.id) return res.status(403).json({ message: "Forbidden" });
  const { full_name, email } = req.body;
  
  if (!full_name || !email) return res.status(400).json({ message: "Missing fields" });

  db.query(
    "UPDATE users SET full_name = ?, email = ? WHERE user_id = ?",
    [full_name, email, req.user.id],
    (err) => {
      if (err) {
        console.error("PUT /update error:", err);
        return res.status(500).json({ message: "Database Error" });
      }
      res.json({ message: "Profile updated successfully", full_name, email });
    }
  );
});

// PUT /change-password/:id — Change Password
router.put("/change-password/:id", verifyToken, async (req, res) => {
  if (parseInt(req.params.id) !== req.user.id) return res.status(403).json({ message: "Forbidden" });
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ message: "Missing fields" });

  db.query("SELECT password FROM users WHERE user_id = ?", [req.user.id], async (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(current_password, results[0].password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

    const hashedPassword = await bcrypt.hash(new_password, 10);
    db.query("UPDATE users SET password = ? WHERE user_id = ?", [hashedPassword, req.user.id], (err2) => {
      if (err2) return res.status(500).json({ message: "Database Error" });
      res.json({ message: "Password updated successfully" });
    });
  });
});

// DELETE /:id — Delete Account
router.delete("/:id", verifyToken, (req, res) => {
  if (parseInt(req.params.id) !== req.user.id) return res.status(403).json({ message: "Forbidden" });
  
  const userId = req.user.id;

  // Step 1: Cleanup orders/order_items/shipping/payments
  db.query("SELECT order_id FROM orders WHERE user_id = ?", [userId], (err, orderResults) => {
    if (err) {
      console.error("Delete: Error fetching orders", err);
      return res.status(500).json({ message: "Error cleaning up orders" });
    }

    const orderIds = orderResults.map(o => o.order_id);

    const cleanupOrders = (callback) => {
      if (orderIds.length === 0) return callback();
      
      // Delete order dependents first
      db.query("DELETE FROM order_items WHERE order_id IN (?)", [orderIds], () => {
        db.query("DELETE FROM shipping_info WHERE order_id IN (?)", [orderIds], () => {
          db.query("DELETE FROM payments WHERE order_id IN (?)", [orderIds], () => {
            db.query("DELETE FROM orders WHERE user_id = ?", [userId], callback);
          });
        });
      });
    };

    cleanupOrders(() => {
      // Step 2: Cleanup Carts and cart_items
      db.query("SELECT cart_id FROM cart WHERE user_id = ?", [userId], (errC, cartRows) => {
        const cartIds = cartRows.map(c => c.cart_id);
        
        const cleanupCart = (cb) => {
          if (cartIds.length === 0) return cb();
          db.query("DELETE FROM cart_items WHERE cart_id IN (?)", [cartIds], () => {
            db.query("DELETE FROM cart WHERE user_id = ?", [userId], cb);
          });
        };

        cleanupCart(() => {
          // Step 3: Cleanup Wishlist and Feedback
          db.query("DELETE FROM wishlist WHERE user_id = ?", [userId], () => {
            db.query("DELETE FROM feedback WHERE user_id = ?", [userId], () => {
              // Final Step: Delete User
              db.query("DELETE FROM users WHERE user_id = ?", [userId], (errFinal) => {
                if (errFinal) {
                  console.error("Delete: Final user delete error", errFinal);
                  return res.status(500).json({ message: "Error deleting user record" });
                }
                res.json({ message: "Account deleted successfully" });
              });
            });
          });
        });
      });
    });
  });
});

// ── GET /notifications/:id  (protected) ────────────────
router.get("/notifications/:id", verifyToken, (req, res) => {
  if (parseInt(req.params.id) !== req.user.id) return res.status(403).json({ message: "Forbidden" });
  
  db.query(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database Error" });
      res.json(results);
    }
  );
});

// ── PUT /notifications/read/:id (protected) ─────────────
router.post("/notifications/read/:id", verifyToken, (req, res) => {
  // Marked as read
  db.query("UPDATE notifications SET is_read = TRUE WHERE user_id = ?", [req.user.id], (err) => {
    if (err) return res.status(500).json({ message: "Database Error" });
    res.json({ message: "Notifications marked as read" });
  });
});

// ── ADDRESS MANAGEMENT ───────────────────────────────

// GET all addresses for a user
router.get("/addresses/:id", verifyToken, (req, res) => {
  if (parseInt(req.params.id) !== req.user.id) return res.status(403).json({ message: "Forbidden" });
  
  db.query(
    "SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, address_id DESC",
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database Error" });
      res.json(results);
    }
  );
});

// POST new address
router.post("/addresses", verifyToken, (req, res) => {
  const { label, full_name, phone, city, address_details, is_default } = req.body;
  const userId = req.user.id;

  if (!full_name || !phone || !city || !address_details) {
    return res.status(400).json({ message: "Missing required shipping fields" });
  }

  const insertAddr = () => {
    const sql = "INSERT INTO user_addresses (user_id, label, full_name, phone, city, address_details, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [userId, label || 'Other', full_name, phone, city, address_details, is_default || false], (err, result) => {
      if (err) return res.status(500).json({ message: "Database Error" });
      res.status(201).json({ message: "Address added", address_id: result.insertId });
    });
  };

  if (is_default) {
    // Clear other defaults first
    db.query("UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?", [userId], insertAddr);
  } else {
    insertAddr();
  }
});

// PUT address
router.put("/addresses/:addrId", verifyToken, (req, res) => {
  const { label, full_name, phone, city, address_details, is_default } = req.body;
  const userId = req.user.id;
  const addrId = req.params.addrId;

  if (!full_name || !phone || !city || !address_details) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const updateAddr = () => {
    const sql = "UPDATE user_addresses SET label = ?, full_name = ?, phone = ?, city = ?, address_details = ?, is_default = ? WHERE address_id = ? AND user_id = ?";
    db.query(sql, [label, full_name, phone, city, address_details, is_default, addrId, userId], (err) => {
      if (err) return res.status(500).json({ message: "Database Error" });
      res.json({ message: "Address updated" });
    });
  };

  if (is_default) {
    db.query("UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?", [userId], updateAddr);
  } else {
    updateAddr();
  }
});

// DELETE address
router.delete("/addresses/:addrId", verifyToken, (req, res) => {
  db.query("DELETE FROM user_addresses WHERE address_id = ? AND user_id = ?", [req.params.addrId, req.user.id], (err) => {
    if (err) return res.status(500).json({ message: "Database Error" });
    res.json({ message: "Address deleted" });
  });
});

// SET DEFAULT address
router.put("/addresses/default/:addrId", verifyToken, (req, res) => {
  const userId = req.user.id;
  const addrId = req.params.addrId;

  db.query("UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?", [userId], (err) => {
    if (err) return res.status(500).json({ message: "Database Error" });
    db.query("UPDATE user_addresses SET is_default = TRUE WHERE address_id = ? AND user_id = ?", [addrId, userId], (err2) => {
      if (err2) return res.status(500).json({ message: "Database Error" });
      res.json({ message: "Default address updated" });
    });
  });
});

module.exports = router;