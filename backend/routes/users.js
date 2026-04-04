const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/auth");
const verifyAdmin = require("../middleware/verifyAdmin");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure Multer for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/profile_pics/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `profile_${req.params.id}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const types = /jpeg|jpg|png/;
    const ext = types.test(path.extname(file.originalname).toLowerCase());
    if (ext) return cb(null, true);
    cb(new Error("Only images (jpeg, jpg, png) are allowed"));
  },
});

// GET all users (with default phone number) — Admin Only
router.get("/", verifyAdmin, (req, res) => {
  const sql = `
    SELECT u.user_id, u.full_name, u.email, ua.phone, u.created_at, u.profile_picture 
    FROM users u
    LEFT JOIN user_addresses ua ON u.user_id = ua.user_id AND ua.is_default = 1
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("GET / error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// GET /profile/:id — Fetch a single user's profile
router.get("/profile/:id", verifyToken, (req, res) => {
  if (parseInt(req.params.id) !== req.user.id) return res.status(403).json({ message: "Forbidden" });
  
  const sql = `
    SELECT u.full_name, u.email, ua.phone, ua.address_details as address, u.profile_picture 
    FROM users u
    LEFT JOIN user_addresses ua ON u.user_id = ua.user_id AND ua.is_default = 1
    WHERE u.user_id = ?
  `;
  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error("GET /profile/:id error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    if (results.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(results[0]);
  });
});

// POST /upload-profile-pic/:id — Upload profile picture
router.post("/upload-profile-pic/:id", verifyToken, upload.single("profile_pic"), (req, res) => {
  if (parseInt(req.params.id) !== req.user.id) return res.status(403).json({ message: "Forbidden" });
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filename = req.file.filename;
  db.query("UPDATE users SET profile_picture = ? WHERE user_id = ?", [filename, req.user.id], (err) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ message: "Profile picture updated", filename });
  });
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

// DELETE /:id — Delete Account (Self)
router.delete("/:id", verifyToken, (req, res) => {
  if (parseInt(req.params.id) !== req.user.id) return res.status(403).json({ message: "Forbidden" });
  deleteUserById(req.params.id, res);
});

// ADMIN DELETE /admin/delete/:id — Administrative Delete
router.delete("/admin/delete/:id", verifyAdmin, (req, res) => {
  deleteUserById(req.params.id, res);
});

// Helper function to handle user deletion and its cascades
function deleteUserById(userId, res) {
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
          // Step 3: Cleanup Wishlist/Feedback/Addresses
          db.query("DELETE FROM wishlist WHERE user_id = ?", [userId], () => {
            db.query("DELETE FROM feedback WHERE user_id = ?", [userId], () => {
              db.query("DELETE FROM user_addresses WHERE user_id = ?", [userId], () => {
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
}

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