const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/auth");
const bcrypt = require("bcryptjs");

// GET all users (only from users table)
router.get("/", (req, res) => {
  db.query(
    "SELECT user_id, full_name, email, created_at FROM users",
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
  const { full_name, email, phone, address } = req.body;
  
  if (!full_name || !email) return res.status(400).json({ message: "Missing fields" });

  db.query(
    "UPDATE users SET full_name = ?, email = ?, phone = ?, address = ? WHERE user_id = ?",
    [full_name, email, phone || null, address || null, req.user.id],
    (err) => {
      if (err) {
        console.error("PUT /update error:", err);
        return res.status(500).json({ message: "Database Error" });
      }
      res.json({ message: "Profile updated successfully", full_name, email, phone, address });
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
  
  db.query("DELETE FROM users WHERE user_id = ?", [req.user.id], (err) => {
    if (err) return res.status(500).json({ message: "Database Error" });
    res.json({ message: "Account deleted successfully" });
  });
});

module.exports = router;