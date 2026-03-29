const express = require("express");
const router = express.Router();
const db = require("../db");

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

module.exports = router;